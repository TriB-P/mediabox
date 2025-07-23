/**
 * Ce fichier contient des fonctions pour interagir avec la collection 'currencies' d'un client spécifique dans Firebase Firestore.
 * Il permet de récupérer, ajouter, mettre à jour et supprimer des informations sur les devises gérées pour chaque client.
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
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { Currency, CurrencyFormData } from '../types/currency';

/**
 * Récupère toutes les devises associées à un client spécifique.
 * @param clientId L'ID du client pour lequel récupérer les devises.
 * @returns Une promesse qui résout en un tableau d'objets Currency.
 */
export const getClientCurrencies = async (clientId: string): Promise<Currency[]> => {
  try {
    const currenciesCollection = collection(db, 'clients', clientId, 'currencies');
    const q = query(currenciesCollection, orderBy('CU_Year', 'desc'));
    console.log("FIREBASE: LECTURE - Fichier: [NOM_DU_FICHIER] - Fonction: getClientCurrencies - Path: clients/${clientId}/currencies");
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

/**
 * Récupère une devise spécifique par son ID pour un client donné.
 * @param clientId L'ID du client propriétaire de la devise.
 * @param currencyId L'ID de la devise à récupérer.
 * @returns Une promesse qui résout en un objet Currency si trouvé, sinon null.
 */
export const getCurrencyById = async (clientId: string, currencyId: string): Promise<Currency | null> => {
  try {
    const currencyRef = doc(db, 'clients', clientId, 'currencies', currencyId);
    console.log("FIREBASE: LECTURE - Fichier: [NOM_DU_FICHIER] - Fonction: getCurrencyById - Path: clients/${clientId}/currencies/${currencyId}");
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

/**
 * Vérifie si une paire de devises (De/À) existe déjà pour une année donnée pour un client.
 * Peut exclure un ID de devise spécifique lors de la vérification (utile pour les mises à jour).
 * @param clientId L'ID du client.
 * @param year L'année de la devise.
 * @param fromCurrency La devise de départ.
 * @param toCurrency La devise d'arrivée.
 * @param excludeId (Optionnel) L'ID de la devise à exclure de la vérification (pour les mises à jour).
 * @returns Une promesse qui résout en `true` si la devise existe, sinon `false`.
 */
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
    console.log("FIREBASE: LECTURE - Fichier: [NOM_DU_FICHIER] - Fonction: checkCurrencyExists - Path: clients/${clientId}/currencies");
    const snapshot = await getDocs(q);
    
    if (excludeId) {
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'existence de la devise:', error);
    return false;
  }
};

/**
 * Ajoute une nouvelle devise pour un client spécifique.
 * Vérifie préalablement si la combinaison de devises et l'année existe déjà pour ce client.
 * @param clientId L'ID du client auquel ajouter la devise.
 * @param currencyData Les données de la nouvelle devise.
 * @returns Une promesse qui résout en l'ID de la nouvelle devise ajoutée.
 * @throws Une erreur si la combinaison de devises existe déjà.
 */
export const addCurrency = async (clientId: string, currencyData: CurrencyFormData): Promise<string> => {
  try {
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
    console.log("FIREBASE: ÉCRITURE - Fichier: [NOM_DU_FICHIER] - Fonction: addCurrency - Path: clients/${clientId}/currencies");
    const docRef = await addDoc(currenciesCollection, newCurrency);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la devise:', error);
    throw error;
  }
};

/**
 * Met à jour une devise existante pour un client spécifique.
 * Vérifie si la nouvelle combinaison de devises et l'année entre en conflit avec une autre devise existante.
 * @param clientId L'ID du client propriétaire de la devise.
 * @param currencyId L'ID de la devise à mettre à jour.
 * @param currencyData Les nouvelles données de la devise.
 * @returns Une promesse qui résout lorsque la mise à jour est terminée.
 * @throws Une erreur si la nouvelle combinaison de devises existe déjà pour une autre devise.
 */
export const updateCurrency = async (
  clientId: string, 
  currencyId: string, 
  currencyData: CurrencyFormData
): Promise<void> => {
  try {
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
    console.log("FIREBASE: ÉCRITURE - Fichier: [NOM_DU_FICHIER] - Fonction: updateCurrency - Path: clients/${clientId}/currencies/${currencyId}");
    await updateDoc(currencyRef, updatedCurrency);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la devise ${currencyId}:`, error);
    throw error;
  }
};

/**
 * Supprime une devise spécifique pour un client donné.
 * @param clientId L'ID du client propriétaire de la devise.
 * @param currencyId L'ID de la devise à supprimer.
 * @returns Une promesse qui résout lorsque la suppression est terminée.
 */
export const deleteCurrency = async (clientId: string, currencyId: string): Promise<void> => {
  try {
    const currencyRef = doc(db, 'clients', clientId, 'currencies', currencyId);
    console.log("FIREBASE: ÉCRITURE - Fichier: [NOM_DU_FICHIER] - Fonction: deleteCurrency - Path: clients/${clientId}/currencies/${currencyId}");
    await deleteDoc(currencyRef);
  } catch (error) {
    console.error(`Erreur lors de la suppression de la devise ${currencyId}:`, error);
    throw error;
  }
};