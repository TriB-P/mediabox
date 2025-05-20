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
    where
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { Currency, CurrencyFormData } from '../types/currency';
  
  // Obtenir toutes les devises pour un client spécifique
  export const getClientCurrencies = async (clientId: string): Promise<Currency[]> => {
    try {
      console.log(`Récupération des devises pour le client ${clientId}`);
      const currenciesCollection = collection(db, 'clients', clientId, 'currencies');
      const q = query(currenciesCollection, orderBy('CU_Year', 'desc'));
      const snapshot = await getDocs(q);
  
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Currency));
    } catch (error) {
      console.error('Erreur lors de la récupération des devises:', error);
      return [];
    }
  };
  
  // Obtenir une devise spécifique
  export const getCurrencyById = async (clientId: string, currencyId: string): Promise<Currency | null> => {
    try {
      const currencyRef = doc(db, 'clients', clientId, 'currencies', currencyId);
      const snapshot = await getDoc(currencyRef);
  
      if (!snapshot.exists()) {
        return null;
      }
  
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as Currency;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la devise ${currencyId}:`, error);
      return null;
    }
  };
  
  // Vérifier si une paire de devises existe déjà pour une année donnée
  export const checkCurrencyExists = async (
    clientId: string, 
    year: string, 
    fromCurrency: string, 
    toCurrency: string,
    excludeId?: string
  ): Promise<boolean> => {
    try {
      const currenciesCollection = collection(db, 'clients', clientId, 'currencies');
      const q = query(
        currenciesCollection, 
        where('CU_Year', '==', year),
        where('CU_From', '==', fromCurrency),
        where('CU_To', '==', toCurrency)
      );
      const snapshot = await getDocs(q);
      
      // Si on a un ID à exclure (pour les mises à jour), on filtre les résultats
      if (excludeId) {
        return snapshot.docs.some(doc => doc.id !== excludeId);
      }
      
      return !snapshot.empty;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'existence de la devise:', error);
      return false;
    }
  };
  
  // Ajouter une nouvelle devise
  export const addCurrency = async (clientId: string, currencyData: CurrencyFormData): Promise<string> => {
    try {
      // Vérifier si cette combinaison de devises existe déjà pour cette année
      const exists = await checkCurrencyExists(
        clientId, 
        currencyData.CU_Year, 
        currencyData.CU_From, 
        currencyData.CU_To
      );
      
      if (exists) {
        throw new Error('Cette combinaison de devises pour cette année existe déjà.');
      }
      
      const currenciesCollection = collection(db, 'clients', clientId, 'currencies');
      const now = new Date().toISOString();
  
      const newCurrency = {
        ...currencyData,
        CU_Rate: typeof currencyData.CU_Rate === 'string' 
          ? parseFloat(currencyData.CU_Rate) 
          : currencyData.CU_Rate,
        createdAt: now,
        updatedAt: now,
      };
  
      const docRef = await addDoc(currenciesCollection, newCurrency);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la devise:', error);
      throw error;
    }
  };
  
  // Mettre à jour une devise existante
  export const updateCurrency = async (
    clientId: string, 
    currencyId: string, 
    currencyData: CurrencyFormData
  ): Promise<void> => {
    try {
      // Vérifier si cette combinaison de devises existe déjà pour cette année (hors celle-ci)
      const exists = await checkCurrencyExists(
        clientId, 
        currencyData.CU_Year, 
        currencyData.CU_From, 
        currencyData.CU_To,
        currencyId
      );
      
      if (exists) {
        throw new Error('Cette combinaison de devises pour cette année existe déjà.');
      }
      
      const currencyRef = doc(db, 'clients', clientId, 'currencies', currencyId);
      const updatedCurrency = {
        ...currencyData,
        CU_Rate: typeof currencyData.CU_Rate === 'string' 
          ? parseFloat(currencyData.CU_Rate) 
          : currencyData.CU_Rate,
        updatedAt: new Date().toISOString(),
      };
  
      await updateDoc(currencyRef, updatedCurrency);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la devise ${currencyId}:`, error);
      throw error;
    }
  };
  
  // Supprimer une devise
  export const deleteCurrency = async (clientId: string, currencyId: string): Promise<void> => {
    try {
      const currencyRef = doc(db, 'clients', clientId, 'currencies', currencyId);
      await deleteDoc(currencyRef);
    } catch (error) {
      console.error(`Erreur lors de la suppression de la devise ${currencyId}:`, error);
      throw error;
    }
  };