import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Fee, FeeOption, FeeFormData, FeeOptionFormData } from '../types/fee';

// Obtenir tous les frais pour un client spécifique (triés par ordre)
export const getClientFees = async (clientId: string): Promise<Fee[]> => {
  try {
    console.log(`Récupération des frais pour le client ${clientId}`);
    const feesCollection = collection(db, 'clients', clientId, 'fees');
    const snapshot = await getDocs(feesCollection);

    const fees = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Fee));

    // Trier côté client pour éviter les problèmes d'index
    return fees.sort((a, b) => {
      // D'abord par ordre (en gérant les cas où FE_Order n'existe pas)
      const orderA = a.FE_Order ?? 999;
      const orderB = b.FE_Order ?? 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Ensuite par nom si les ordres sont identiques
      return a.FE_Name.localeCompare(b.FE_Name);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des frais:', error);
    return [];
  }
};

// Obtenir un frais spécifique
export const getFeeById = async (clientId: string, feeId: string): Promise<Fee | null> => {
  try {
    const feeRef = doc(db, 'clients', clientId, 'fees', feeId);
    const snapshot = await getDoc(feeRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Fee;
  } catch (error) {
    console.error(`Erreur lors de la récupération du frais ${feeId}:`, error);
    return null;
  }
};

// Ajouter un nouveau frais
export const addFee = async (clientId: string, feeData: FeeFormData): Promise<string> => {
  try {
    const feesCollection = collection(db, 'clients', clientId, 'fees');
    
    // Obtenir le prochain ordre
    const existingFees = await getClientFees(clientId);
    const nextOrder = existingFees.length;
    
    const now = new Date().toISOString();

    const newFee = {
      ...feeData,
      FE_Order: nextOrder,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(feesCollection, newFee);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du frais:', error);
    throw error;
  }
};

// Mettre à jour un frais existant
export const updateFee = async (clientId: string, feeId: string, feeData: FeeFormData): Promise<void> => {
  try {
    const feeRef = doc(db, 'clients', clientId, 'fees', feeId);
    const updatedFee = {
      ...feeData,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(feeRef, updatedFee);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du frais ${feeId}:`, error);
    throw error;
  }
};

// Supprimer un frais
export const deleteFee = async (clientId: string, feeId: string): Promise<void> => {
  try {
    // D'abord récupérer toutes les options pour les supprimer
    const options = await getFeeOptions(clientId, feeId);
    
    for (const option of options) {
      await deleteFeeOption(clientId, feeId, option.id);
    }
    
    // Ensuite supprimer le frais
    const feeRef = doc(db, 'clients', clientId, 'fees', feeId);
    await deleteDoc(feeRef);
    
    // Réorganiser l'ordre des frais restants
    await reorderFeesAfterDelete(clientId, feeId);
  } catch (error) {
    console.error(`Erreur lors de la suppression du frais ${feeId}:`, error);
    throw error;
  }
};

// Déplacer un frais vers le haut
export const moveFeeUp = async (clientId: string, feeId: string): Promise<void> => {
  try {
    const fees = await getClientFees(clientId);
    const currentIndex = fees.findIndex(f => f.id === feeId);
    
    if (currentIndex <= 0) return; // Déjà en première position
    
    const batch = writeBatch(db);
    
    // Échanger les ordres
    const currentFee = fees[currentIndex];
    const previousFee = fees[currentIndex - 1];
    
    const currentFeeRef = doc(db, 'clients', clientId, 'fees', currentFee.id);
    const previousFeeRef = doc(db, 'clients', clientId, 'fees', previousFee.id);
    
    batch.update(currentFeeRef, { 
      FE_Order: previousFee.FE_Order,
      updatedAt: new Date().toISOString()
    });
    batch.update(previousFeeRef, { 
      FE_Order: currentFee.FE_Order,
      updatedAt: new Date().toISOString()
    });
    
    await batch.commit();
  } catch (error) {
    console.error(`Erreur lors du déplacement du frais ${feeId} vers le haut:`, error);
    throw error;
  }
};

// Déplacer un frais vers le bas
export const moveFeeDown = async (clientId: string, feeId: string): Promise<void> => {
  try {
    const fees = await getClientFees(clientId);
    const currentIndex = fees.findIndex(f => f.id === feeId);
    
    if (currentIndex < 0 || currentIndex >= fees.length - 1) return; // Déjà en dernière position
    
    const batch = writeBatch(db);
    
    // Échanger les ordres
    const currentFee = fees[currentIndex];
    const nextFee = fees[currentIndex + 1];
    
    const currentFeeRef = doc(db, 'clients', clientId, 'fees', currentFee.id);
    const nextFeeRef = doc(db, 'clients', clientId, 'fees', nextFee.id);
    
    batch.update(currentFeeRef, { 
      FE_Order: nextFee.FE_Order,
      updatedAt: new Date().toISOString()
    });
    batch.update(nextFeeRef, { 
      FE_Order: currentFee.FE_Order,
      updatedAt: new Date().toISOString()
    });
    
    await batch.commit();
  } catch (error) {
    console.error(`Erreur lors du déplacement du frais ${feeId} vers le bas:`, error);
    throw error;
  }
};

// Réorganiser l'ordre après suppression
const reorderFeesAfterDelete = async (clientId: string, deletedFeeId: string): Promise<void> => {
  try {
    const fees = await getClientFees(clientId);
    const batch = writeBatch(db);
    
    fees.forEach((fee, index) => {
      const feeRef = doc(db, 'clients', clientId, 'fees', fee.id);
      batch.update(feeRef, { 
        FE_Order: index,
        updatedAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Erreur lors de la réorganisation des frais:', error);
    throw error;
  }
};

// Obtenir toutes les options d'un frais
export const getFeeOptions = async (clientId: string, feeId: string): Promise<FeeOption[]> => {
  try {
    console.log(`Récupération des options pour le frais ${feeId}`);
    const optionsCollection = collection(
      db,
      'clients',
      clientId,
      'fees',
      feeId,
      'options'
    );
    const q = query(optionsCollection, orderBy('FO_Option'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FeeOption));
  } catch (error) {
    console.error(`Erreur lors de la récupération des options du frais ${feeId}:`, error);
    return [];
  }
};

// Ajouter une nouvelle option de frais
export const addFeeOption = async (
  clientId: string,
  feeId: string,
  optionData: FeeOptionFormData
): Promise<string> => {
  try {
    const optionsCollection = collection(
      db,
      'clients',
      clientId,
      'fees',
      feeId,
      'options'
    );
    const now = new Date().toISOString();

    const newOption = {
      ...optionData,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(optionsCollection, newOption);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'option:', error);
    throw error;
  }
};

// Mettre à jour une option de frais
export const updateFeeOption = async (
  clientId: string,
  feeId: string,
  optionId: string,
  optionData: FeeOptionFormData
): Promise<void> => {
  try {
    const optionRef = doc(
      db,
      'clients',
      clientId,
      'fees',
      feeId,
      'options',
      optionId
    );
    const updatedOption = {
      ...optionData,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(optionRef, updatedOption);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'option ${optionId}:`, error);
    throw error;
  }
};

// Supprimer une option de frais
export const deleteFeeOption = async (
  clientId: string,
  feeId: string,
  optionId: string
): Promise<void> => {
  try {
    const optionRef = doc(
      db,
      'clients',
      clientId,
      'fees',
      feeId,
      'options',
      optionId
    );
    await deleteDoc(optionRef);
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'option ${optionId}:`, error);
    throw error;
  }
};