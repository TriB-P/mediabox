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
  
  // Obtenir toutes les taxonomies pour un client spécifique
  export const getClientTaxonomies = async (clientId: string): Promise<Taxonomy[]> => {
    try {
      console.log(`Récupération des taxonomies pour le client ${clientId}`);
      const taxonomiesCollection = collection(db, 'clients', clientId, 'taxonomies');
      const q = query(taxonomiesCollection, orderBy('NA_Display_Name'));
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
  
  // Obtenir une taxonomie spécifique
  export const getTaxonomyById = async (clientId: string, taxonomyId: string): Promise<Taxonomy | null> => {
    try {
      const taxonomyRef = doc(db, 'clients', clientId, 'taxonomies', taxonomyId);
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
  
  // Ajouter une nouvelle taxonomie
  export const addTaxonomy = async (clientId: string, taxonomyData: TaxonomyFormData): Promise<string> => {
    try {
      const taxonomiesCollection = collection(db, 'clients', clientId, 'taxonomies');
      const now = new Date().toISOString();
  
      const newTaxonomy = {
        ...taxonomyData,
        createdAt: now,
        updatedAt: now,
      };
  
      const docRef = await addDoc(taxonomiesCollection, newTaxonomy);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la taxonomie:', error);
      throw error;
    }
  };
  
  // Mettre à jour une taxonomie existante
  export const updateTaxonomy = async (clientId: string, taxonomyId: string, taxonomyData: TaxonomyFormData): Promise<void> => {
    try {
      const taxonomyRef = doc(db, 'clients', clientId, 'taxonomies', taxonomyId);
      const updatedTaxonomy = {
        ...taxonomyData,
        updatedAt: new Date().toISOString(),
      };
  
      await updateDoc(taxonomyRef, updatedTaxonomy);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la taxonomie ${taxonomyId}:`, error);
      throw error;
    }
  };
  
  // Supprimer une taxonomie
  export const deleteTaxonomy = async (clientId: string, taxonomyId: string): Promise<void> => {
    try {
      const taxonomyRef = doc(db, 'clients', clientId, 'taxonomies', taxonomyId);
      await deleteDoc(taxonomyRef);
    } catch (error) {
      console.error(`Erreur lors de la suppression de la taxonomie ${taxonomyId}:`, error);
      throw error;
    }
  };