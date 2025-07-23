/**
 * Ce fichier contient des fonctions pour interagir avec les collections 'fees' et 'options'
 * dans Firestore. Il permet de gérer les frais associés à des clients,
 * ainsi que les différentes options pour chaque frais.
 * Les opérations incluent la lecture, l'écriture, la mise à jour et la suppression de données.
 */
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

/**
 * Récupère tous les frais pour un client spécifique.
 * Les frais sont triés en premier par leur propriété 'FE_Order', puis par 'FE_Name' si l'ordre est identique.
 * @param clientId L'ID du client pour lequel récupérer les frais.
 * @returns Une promesse qui résout en un tableau de frais (Fee[]). Retourne un tableau vide en cas d'erreur.
 */
export const getClientFees = async (clientId: string): Promise<Fee[]> => {
  try {
    const feesCollection = collection(db, 'clients', clientId, 'fees');
    console.log("FIREBASE: LECTURE - Fichier: fees.ts - Fonction: getClientFees - Path: clients/${clientId}/fees");
    const snapshot = await getDocs(feesCollection);

    const fees = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Fee));

    return fees.sort((a, b) => {
      const orderA = a.FE_Order ?? 999;
      const orderB = b.FE_Order ?? 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return a.FE_Name.localeCompare(b.FE_Name);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des frais:', error);
    return [];
  }
};

/**
 * Récupère un frais spécifique par son ID pour un client donné.
 * @param clientId L'ID du client.
 * @param feeId L'ID du frais à récupérer.
 * @returns Une promesse qui résout en un objet Fee si trouvé, ou null si non trouvé ou en cas d'erreur.
 */
export const getFeeById = async (clientId: string, feeId: string): Promise<Fee | null> => {
  try {
    const feeRef = doc(db, 'clients', clientId, 'fees', feeId);
    console.log("FIREBASE: LECTURE - Fichier: fees.ts - Fonction: getFeeById - Path: clients/${clientId}/fees/${feeId}");
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

/**
 * Ajoute un nouveau frais pour un client spécifique.
 * Il attribue automatiquement un ordre basé sur le nombre de frais existants.
 * @param clientId L'ID du client.
 * @param feeData Les données du frais à ajouter.
 * @returns Une promesse qui résout en l'ID du document nouvellement créé.
 * @throws Renvoie l'erreur si l'ajout échoue.
 */
export const addFee = async (clientId: string, feeData: FeeFormData): Promise<string> => {
  try {
    const feesCollection = collection(db, 'clients', clientId, 'fees');
    
    const existingFees = await getClientFees(clientId);
    const nextOrder = existingFees.length;
    
    const now = new Date().toISOString();

    const newFee = {
      ...feeData,
      FE_Order: nextOrder,
      createdAt: now,
      updatedAt: now,
    };

    console.log("FIREBASE: ÉCRITURE - Fichier: fees.ts - Fonction: addFee - Path: clients/${clientId}/fees");
    const docRef = await addDoc(feesCollection, newFee);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du frais:', error);
    throw error;
  }
};

/**
 * Met à jour un frais existant pour un client.
 * @param clientId L'ID du client.
 * @param feeId L'ID du frais à mettre à jour.
 * @param feeData Les nouvelles données du frais.
 * @returns Une promesse qui résout une fois la mise à jour effectuée.
 * @throws Renvoie l'erreur si la mise à jour échoue.
 */
export const updateFee = async (clientId: string, feeId: string, feeData: FeeFormData): Promise<void> => {
  try {
    const feeRef = doc(db, 'clients', clientId, 'fees', feeId);
    const updatedFee = {
      ...feeData,
      updatedAt: new Date().toISOString(),
    };

    console.log("FIREBASE: ÉCRITURE - Fichier: fees.ts - Fonction: updateFee - Path: clients/${clientId}/fees/${feeId}");
    await updateDoc(feeRef, updatedFee);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du frais ${feeId}:`, error);
    throw error;
  }
};

/**
 * Supprime un frais spécifique et toutes ses options associées.
 * Après la suppression, les frais restants sont réorganisés pour maintenir la séquence d'ordre.
 * @param clientId L'ID du client.
 * @param feeId L'ID du frais à supprimer.
 * @returns Une promesse qui résout une fois la suppression effectuée.
 * @throws Renvoie l'erreur si la suppression échoue.
 */
export const deleteFee = async (clientId: string, feeId: string): Promise<void> => {
  try {
    const options = await getFeeOptions(clientId, feeId);
    
    for (const option of options) {
      await deleteFeeOption(clientId, feeId, option.id);
    }
    
    const feeRef = doc(db, 'clients', clientId, 'fees', feeId);
    console.log("FIREBASE: ÉCRITURE - Fichier: fees.ts - Fonction: deleteFee - Path: clients/${clientId}/fees/${feeId}");
    await deleteDoc(feeRef);
    
    await reorderFeesAfterDelete(clientId, feeId);
  } catch (error) {
    console.error(`Erreur lors de la suppression du frais ${feeId}:`, error);
    throw error;
  }
};

/**
 * Déplace un frais vers le haut dans l'ordre de tri en échangeant son ordre avec le frais précédent.
 * @param clientId L'ID du client.
 * @param feeId L'ID du frais à déplacer.
 * @returns Une promesse qui résout une fois l'opération effectuée.
 * @throws Renvoie l'erreur si le déplacement échoue.
 */
export const moveFeeUp = async (clientId: string, feeId: string): Promise<void> => {
  try {
    const fees = await getClientFees(clientId);
    const currentIndex = fees.findIndex(f => f.id === feeId);
    
    if (currentIndex <= 0) return;
    
    const batch = writeBatch(db);
    
    const currentFee = fees[currentIndex];
    const previousFee = fees[currentIndex - 1];
    
    const currentFeeRef = doc(db, 'clients', clientId, 'fees', currentFee.id);
    const previousFeeRef = doc(db, 'clients', clientId, 'fees', previousFee.id);
    
    console.log("FIREBASE: ÉCRITURE - Fichier: fees.ts - Fonction: moveFeeUp - Path: clients/${clientId}/fees/${currentFee.id}");
    batch.update(currentFeeRef, { 
      FE_Order: previousFee.FE_Order,
      updatedAt: new Date().toISOString()
    });
    console.log("FIREBASE: ÉCRITURE - Fichier: fees.ts - Fonction: moveFeeUp - Path: clients/${clientId}/fees/${previousFee.id}");
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

/**
 * Déplace un frais vers le bas dans l'ordre de tri en échangeant son ordre avec le frais suivant.
 * @param clientId L'ID du client.
 * @param feeId L'ID du frais à déplacer.
 * @returns Une promesse qui résout une fois l'opération effectuée.
 * @throws Renvoie l'erreur si le déplacement échoue.
 */
export const moveFeeDown = async (clientId: string, feeId: string): Promise<void> => {
  try {
    const fees = await getClientFees(clientId);
    const currentIndex = fees.findIndex(f => f.id === feeId);
    
    if (currentIndex < 0 || currentIndex >= fees.length - 1) return;
    
    const batch = writeBatch(db);
    
    const currentFee = fees[currentIndex];
    const nextFee = fees[currentIndex + 1];
    
    const currentFeeRef = doc(db, 'clients', clientId, 'fees', currentFee.id);
    const nextFeeRef = doc(db, 'clients', clientId, 'fees', nextFee.id);
    
    console.log("FIREBASE: ÉCRITURE - Fichier: fees.ts - Fonction: moveFeeDown - Path: clients/${clientId}/fees/${currentFee.id}");
    batch.update(currentFeeRef, { 
      FE_Order: nextFee.FE_Order,
      updatedAt: new Date().toISOString()
    });
    console.log("FIREBASE: ÉCRITURE - Fichier: fees.ts - Fonction: moveFeeDown - Path: clients/${clientId}/fees/${nextFee.id}");
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

/**
 * Réorganise l'ordre des frais restants après la suppression d'un frais.
 * Cela assure que les 'FE_Order' sont des indices séquentiels.
 * @param clientId L'ID du client.
 * @param deletedFeeId L'ID du frais qui a été supprimé (utilisé pour la traçabilité mais pas pour la logique de réorganisation).
 * @returns Une promesse qui résout une fois la réorganisation effectuée.
 * @throws Renvoie l'erreur si la réorganisation échoue.
 */
const reorderFeesAfterDelete = async (clientId: string, deletedFeeId: string): Promise<void> => {
  try {
    const fees = await getClientFees(clientId);
    const batch = writeBatch(db);
    
    fees.forEach((fee, index) => {
      const feeRef = doc(db, 'clients', clientId, 'fees', fee.id);
      console.log("FIREBASE: ÉCRITURE - Fichier: fees.ts - Fonction: reorderFeesAfterDelete - Path: clients/${clientId}/fees/${fee.id}");
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

/**
 * Récupère toutes les options associées à un frais spécifique.
 * Les options sont triées par leur propriété 'FO_Option'.
 * @param clientId L'ID du client.
 * @param feeId L'ID du frais dont les options doivent être récupérées.
 * @returns Une promesse qui résout en un tableau d'options (FeeOption[]). Retourne un tableau vide en cas d'erreur.
 */
export const getFeeOptions = async (clientId: string, feeId: string): Promise<FeeOption[]> => {
  try {
    const optionsCollection = collection(
      db,
      'clients',
      clientId,
      'fees',
      feeId,
      'options'
    );
    const q = query(optionsCollection, orderBy('FO_Option'));
    console.log("FIREBASE: LECTURE - Fichier: fees.ts - Fonction: getFeeOptions - Path: clients/${clientId}/fees/${feeId}/options");
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

/**
 * Ajoute une nouvelle option à un frais spécifique.
 * @param clientId L'ID du client.
 * @param feeId L'ID du frais auquel ajouter l'option.
 * @param optionData Les données de l'option à ajouter.
 * @returns Une promesse qui résout en l'ID du document de l'option nouvellement créée.
 * @throws Renvoie l'erreur si l'ajout échoue.
 */
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

    console.log("FIREBASE: ÉCRITURE - Fichier: fees.ts - Fonction: addFeeOption - Path: clients/${clientId}/fees/${feeId}/options");
    const docRef = await addDoc(optionsCollection, newOption);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'option:', error);
    throw error;
  }
};

/**
 * Met à jour une option de frais existante.
 * @param clientId L'ID du client.
 * @param feeId L'ID du frais parent de l'option.
 * @param optionId L'ID de l'option à mettre à jour.
 * @param optionData Les nouvelles données de l'option.
 * @returns Une promesse qui résout une fois la mise à jour effectuée.
 * @throws Renvoie l'erreur si la mise à jour échoue.
 */
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

    console.log("FIREBASE: ÉCRITURE - Fichier: fees.ts - Fonction: updateFeeOption - Path: clients/${clientId}/fees/${feeId}/options/${optionId}");
    await updateDoc(optionRef, updatedOption);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'option ${optionId}:`, error);
    throw error;
  }
};

/**
 * Supprime une option spécifique d'un frais.
 * @param clientId L'ID du client.
 * @param feeId L'ID du frais parent de l'option.
 * @param optionId L'ID de l'option à supprimer.
 * @returns Une promesse qui résout une fois la suppression effectuée.
 * @throws Renvoie l'erreur si la suppression échoue.
 */
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
    console.log("FIREBASE: ÉCRITURE - Fichier: fees.ts - Fonction: deleteFeeOption - Path: clients/${clientId}/fees/${feeId}/options/${optionId}");
    await deleteDoc(optionRef);
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'option ${optionId}:`, error);
    throw error;
  }
};