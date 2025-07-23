/**
 * Ce fichier gère toutes les interactions avec la collection 'taxonomies' de Firebase Firestore.
 * Il contient des fonctions pour récupérer, ajouter, mettre à jour et supprimer des taxonomies
 * associées à un client spécifique.
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
} from 'firebase/firestore';
import { db } from './firebase';
import { Taxonomy, TaxonomyFormData } from '../types/taxonomy';

/**
* Récupère toutes les taxonomies pour un client donné.
* @param {string} clientId - L'identifiant unique du client.
* @returns {Promise<Taxonomy[]>} Une promesse qui résout en un tableau d'objets Taxonomy.
*/
export const getClientTaxonomies = async (clientId: string): Promise<Taxonomy[]> => {
  try {
      const taxonomiesCollection = collection(db, 'clients', clientId, 'taxonomies');
      const q = query(taxonomiesCollection, orderBy('NA_Display_Name'));
      console.log("FIREBASE: LECTURE - Fichier: clientTaxonomyService.ts - Fonction: getClientTaxonomies - Path: clients/${clientId}/taxonomies");
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
      } as Taxonomy));
  } catch (error) {
      console.error('Erreur lors de la récupération des taxonomies:', error);
      return [];
  }
};

/**
* Récupère une taxonomie spécifique par son identifiant.
* @param {string} clientId - L'identifiant unique du client.
* @param {string} taxonomyId - L'identifiant unique de la taxonomie à récupérer.
* @returns {Promise<Taxonomy | null>} Une promesse qui résout en un objet Taxonomy si trouvé, sinon null.
*/
export const getTaxonomyById = async (clientId: string, taxonomyId: string): Promise<Taxonomy | null> => {
  try {
      const taxonomyRef = doc(db, 'clients', clientId, 'taxonomies', taxonomyId);
      console.log("FIREBASE: LECTURE - Fichier: clientTaxonomyService.ts - Fonction: getTaxonomyById - Path: clients/${clientId}/taxonomies/${taxonomyId}");
      const snapshot = await getDoc(taxonomyRef);

      if (!snapshot.exists()) {
          return null;
      }

      return {
          id: snapshot.id,
          ...snapshot.data(),
      } as Taxonomy;
  } catch (error) {
      console.error(`Erreur lors de la récupération de la taxonomie ${taxonomyId}:`, error);
      return null;
  }
};

/**
* Ajoute une nouvelle taxonomie pour un client donné.
* @param {string} clientId - L'identifiant unique du client.
* @param {TaxonomyFormData} taxonomyData - Les données de la taxonomie à ajouter.
* @returns {Promise<string>} Une promesse qui résout en l'identifiant du document de la nouvelle taxonomie.
*/
export const addTaxonomy = async (clientId: string, taxonomyData: TaxonomyFormData): Promise<string> => {
  try {
      const taxonomiesCollection = collection(db, 'clients', clientId, 'taxonomies');
      const now = new Date().toISOString();

      const newTaxonomy = {
          ...taxonomyData,
          createdAt: now,
          updatedAt: now,
      };

      console.log("FIREBASE: ÉCRITURE - Fichier: clientTaxonomyService.ts - Fonction: addTaxonomy - Path: clients/${clientId}/taxonomies");
      const docRef = await addDoc(taxonomiesCollection, newTaxonomy);
      return docRef.id;
  } catch (error) {
      console.error('Erreur lors de l\'ajout de la taxonomie:', error);
      throw error;
  }
};

/**
* Met à jour une taxonomie existante pour un client donné.
* @param {string} clientId - L'identifiant unique du client.
* @param {string} taxonomyId - L'identifiant unique de la taxonomie à mettre à jour.
* @param {TaxonomyFormData} taxonomyData - Les données de la taxonomie à mettre à jour.
* @returns {Promise<void>} Une promesse qui résout lorsque la mise à jour est terminée.
*/
export const updateTaxonomy = async (clientId: string, taxonomyId: string, taxonomyData: TaxonomyFormData): Promise<void> => {
  try {
      const taxonomyRef = doc(db, 'clients', clientId, 'taxonomies', taxonomyId);
      const updatedTaxonomy = {
          ...taxonomyData,
          updatedAt: new Date().toISOString(),
      };

      console.log("FIREBASE: ÉCRITURE - Fichier: clientTaxonomyService.ts - Fonction: updateTaxonomy - Path: clients/${clientId}/taxonomies/${taxonomyId}");
      await updateDoc(taxonomyRef, updatedTaxonomy);
  } catch (error) {
      console.error(`Erreur lors de la mise à jour de la taxonomie ${taxonomyId}:`, error);
      throw error;
  }
};

/**
* Supprime une taxonomie existante pour un client donné.
* @param {string} clientId - L'identifiant unique du client.
* @param {string} taxonomyId - L'identifiant unique de la taxonomie à supprimer.
* @returns {Promise<void>} Une promesse qui résout lorsque la suppression est terminée.
*/
export const deleteTaxonomy = async (clientId: string, taxonomyId: string): Promise<void> => {
  try {
      const taxonomyRef = doc(db, 'clients', clientId, 'taxonomies', taxonomyId);
      console.log("FIREBASE: ÉCRITURE - Fichier: clientTaxonomyService.ts - Fonction: deleteTaxonomy - Path: clients/${clientId}/taxonomies/${taxonomyId}");
      await deleteDoc(taxonomyRef);
  } catch (error) {
      console.error(`Erreur lors de la suppression de la taxonomie ${taxonomyId}:`, error);
      throw error;
  }
};