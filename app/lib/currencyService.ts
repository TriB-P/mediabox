// app/lib/currencyService.ts

/**
 * Ce fichier contient des fonctions pour interagir avec la collection 'currencies' d'un client spécifique dans Firebase Firestore.
 * Il permet de récupérer, ajouter, mettre à jour et supprimer des informations sur les devises gérées pour chaque client.
 * MODIFIÉ : Ajout de fonctions pour récupérer les taux par paire de devises avec support des versions personnalisées.
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
    console.log("FIREBASE: LECTURE - Fichier: currencyService.ts - Fonction: getClientCurrencies - Path: clients/${clientId}/currencies");
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
 * NOUVEAU : Récupère tous les taux de change disponibles pour une paire de devises spécifique.
 * Utile pour afficher un sélecteur de versions (ex: "2025 v1", "2025 v2") à l'utilisateur.
 * @param clientId L'ID du client.
 * @param fromCurrency La devise de départ (ex: "USD").
 * @param toCurrency La devise d'arrivée (ex: "CAD").
 * @returns Une promesse qui résout en un tableau d'objets Currency triés par CU_Year décroissant.
 */
export const getCurrencyRatesByPair = async (
  clientId: string, 
  fromCurrency: string, 
  toCurrency: string
): Promise<Currency[]> => {
  try {
    const currenciesCollection = collection(db, 'clients', clientId, 'currencies');
    // TEMPORAIRE : Supprimer orderBy pour éviter l'erreur d'index
    const q = query(
      currenciesCollection,
      where('CU_From', '==', fromCurrency),
      where('CU_To', '==', toCurrency)
      // orderBy('CU_Year', 'desc') // COMMENTÉ temporairement
    );
    console.log(`FIREBASE: LECTURE - Fichier: currencyService.ts - Fonction: getCurrencyRatesByPair - Path: clients/${clientId}/currencies - Filter: ${fromCurrency} -> ${toCurrency}`);
    const snapshot = await getDocs(q);

    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Currency));
    
    // TEMPORAIRE : Trier côté client en attendant l'index
    return results.sort((a, b) => {
      // Tri par CU_Year décroissant (versions les plus récentes en premier)
      return b.CU_Year.localeCompare(a.CU_Year);
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des taux ${fromCurrency} -> ${toCurrency}:`, error);
    return [];
  }
};

/**
 * NOUVEAU : Récupère un taux de change spécifique pour une paire de devises et une version.
 * @param clientId L'ID du client.
 * @param fromCurrency La devise de départ (ex: "USD").
 * @param toCurrency La devise d'arrivée (ex: "CAD").
 * @param yearVersion La version/année spécifique (ex: "2025 v1").
 * @returns Une promesse qui résout en un objet Currency si trouvé, sinon null.
 */
export const getCurrencyRateByVersion = async (
  clientId: string,
  fromCurrency: string,
  toCurrency: string,
  yearVersion: string
): Promise<Currency | null> => {
  try {
    const currenciesCollection = collection(db, 'clients', clientId, 'currencies');
    const q = query(
      currenciesCollection,
      where('CU_From', '==', fromCurrency),
      where('CU_To', '==', toCurrency),
      where('CU_Year', '==', yearVersion)
    );
    console.log(`FIREBASE: LECTURE - Fichier: currencyService.ts - Fonction: getCurrencyRateByVersion - Path: clients/${clientId}/currencies - Filter: ${fromCurrency} -> ${toCurrency} (${yearVersion})`);
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0]; // Il ne devrait y avoir qu'un seul résultat
    return {
      id: doc.id,
      ...doc.data(),
    } as Currency;
  } catch (error) {
    console.error(`Erreur lors de la récupération du taux ${fromCurrency} -> ${toCurrency} (${yearVersion}):`, error);
    return null;
  }
};

/**
 * NOUVEAU : Vérifie s'il existe des taux de change pour une paire de devises.
 * @param clientId L'ID du client.
 * @param fromCurrency La devise de départ.
 * @param toCurrency La devise d'arrivée.
 * @returns Une promesse qui résout en true si au moins un taux existe, sinon false.
 */
export const hasRatesForCurrencyPair = async (
  clientId: string,
  fromCurrency: string,
  toCurrency: string
): Promise<boolean> => {
  try {
    const rates = await getCurrencyRatesByPair(clientId, fromCurrency, toCurrency);
    return rates.length > 0;
  } catch (error) {
    console.error(`Erreur lors de la vérification des taux ${fromCurrency} -> ${toCurrency}:`, error);
    return false;
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
    console.log("FIREBASE: LECTURE - Fichier: currencyService.ts - Fonction: getCurrencyById - Path: clients/${clientId}/currencies/${currencyId}");
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
 * Vérifie si une paire de devises (De/À) existe déjà pour une année/version donnée pour un client.
 * Peut exclure un ID de devise spécifique lors de la vérification (utile pour les mises à jour).
 * @param clientId L'ID du client.
 * @param year L'année/version de la devise (ex: "2025 v1").
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
    console.log("FIREBASE: LECTURE - Fichier: currencyService.ts - Fonction: checkCurrencyExists - Path: clients/${clientId}/currencies");
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
 * Vérifie préalablement si la combinaison de devises et l'année/version existe déjà pour ce client.
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
      throw new Error('Cette combinaison de devises pour cette version existe déjà.');
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
    console.log("FIREBASE: ÉCRITURE - Fichier: currencyService.ts - Fonction: addCurrency - Path: clients/${clientId}/currencies");
    const docRef = await addDoc(currenciesCollection, newCurrency);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la devise:', error);
    throw error;
  }
};

/**
 * Met à jour une devise existante pour un client spécifique.
 * Vérifie si la nouvelle combinaison de devises et l'année/version entre en conflit avec une autre devise existante.
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
      throw new Error('Cette combinaison de devises pour cette version existe déjà.');
    }
    
    const currencyRef = doc(db, 'clients', clientId, 'currencies', currencyId);
    const updatedCurrency = {
      ...currencyData,
      CU_Rate: typeof currencyData.CU_Rate === 'string' 
        ? parseFloat(currencyData.CU_Rate) 
        : currencyData.CU_Rate,
      updatedAt: new Date().toISOString(),
    };
    console.log("FIREBASE: ÉCRITURE - Fichier: currencyService.ts - Fonction: updateCurrency - Path: clients/${clientId}/currencies/${currencyId}");
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
    console.log("FIREBASE: ÉCRITURE - Fichier: currencyService.ts - Fonction: deleteCurrency - Path: clients/${clientId}/currencies/${currencyId}");
    await deleteDoc(currencyRef);
  } catch (error) {
    console.error(`Erreur lors de la suppression de la devise ${currencyId}:`, error);
    throw error;
  }
};