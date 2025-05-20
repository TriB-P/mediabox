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
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { Fee, FeeOption, FeeFormData, FeeOptionFormData } from '../types/fee';
  
  // Obtenir tous les frais pour un client spécifique
  export const getClientFees = async (clientId: string): Promise<Fee[]> => {
    try {
      console.log(`Récupération des frais pour le client ${clientId}`);
      const feesCollection = collection(db, 'clients', clientId, 'fees');
      const q = query(feesCollection, orderBy('FE_Name'));
      const snapshot = await getDocs(q);
  
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Fee));
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
      const now = new Date().toISOString();
  
      const newFee = {
        ...feeData,
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
    } catch (error) {
      console.error(`Erreur lors de la suppression du frais ${feeId}:`, error);
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