// app/lib/taxonomyService.ts
/**
 * Ce fichier gère toutes les interactions avec la collection 'taxonomies' de Firebase Firestore.
 * Il contient des fonctions pour récupérer, ajouter, mettre à jour et supprimer des taxonomies
 * associées à un client spécifique.
 * NOUVEAU: Ajout de la fonction de recherche/remplacement en masse dans les champs de structure.
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
  import { Taxonomy, TaxonomyFormData, SearchResult } from '../types/taxonomy';
  
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
  
  /**
  * NOUVEAU: Effectue une recherche et un remplacement en masse dans tous les champs de structure 
  * des taxonomies d'un client donné.
  * @param {string} clientId - L'identifiant unique du client.
  * @param {string} searchText - Le texte à rechercher (case-sensitive).
  * @param {string} replaceText - Le texte de remplacement.
  * @returns {Promise<number>} Une promesse qui résout en le nombre total de remplacements effectués.
  */
  export const searchReplaceInTaxonomies = async (
    clientId: string, 
    searchText: string, 
    replaceText: string
  ): Promise<number> => {
    try {
      // Récupérer toutes les taxonomies du client
      console.log("FIREBASE: LECTURE - Fichier: taxonomyService.ts - Fonction: searchReplaceInTaxonomies - Path: clients/${clientId}/taxonomies");
      const taxonomies = await getClientTaxonomies(clientId);
      
      let totalReplacements = 0;
      const taxonomiesToUpdate: { taxonomy: Taxonomy; updatedData: TaxonomyFormData }[] = [];
      
      // Parcourir chaque taxonomie
      for (const taxonomy of taxonomies) {
        let taxonomyModified = false;
        let taxonomyReplacements = 0;
        
        // Créer une copie des données de la taxonomie pour les modifications
        const updatedTaxonomyData: TaxonomyFormData = {
          NA_Display_Name: taxonomy.NA_Display_Name,
          NA_Description: taxonomy.NA_Description,
          NA_Standard: taxonomy.NA_Standard,
          NA_Name_Level_1: taxonomy.NA_Name_Level_1,
          NA_Name_Level_2: taxonomy.NA_Name_Level_2,
          NA_Name_Level_3: taxonomy.NA_Name_Level_3,
          NA_Name_Level_4: taxonomy.NA_Name_Level_4,
          NA_Name_Level_5: taxonomy.NA_Name_Level_5,
          NA_Name_Level_6: taxonomy.NA_Name_Level_6,
          NA_Name_Level_1_Title: taxonomy.NA_Name_Level_1_Title,
          NA_Name_Level_2_Title: taxonomy.NA_Name_Level_2_Title,
          NA_Name_Level_3_Title: taxonomy.NA_Name_Level_3_Title,
          NA_Name_Level_4_Title: taxonomy.NA_Name_Level_4_Title,
          NA_Name_Level_5_Title: taxonomy.NA_Name_Level_5_Title,
          NA_Name_Level_6_Title: taxonomy.NA_Name_Level_6_Title,
        };
        
        // Vérifier et remplacer dans chaque champ de structure (NA_Name_Level_1 à NA_Name_Level_6)
        // On traite chaque niveau individuellement pour éviter les problèmes de types TypeScript
        
        // Niveau 1
        if (updatedTaxonomyData.NA_Name_Level_1 && updatedTaxonomyData.NA_Name_Level_1.includes(searchText)) {
          const matches = updatedTaxonomyData.NA_Name_Level_1.split(searchText).length - 1;
          taxonomyReplacements += matches;
          updatedTaxonomyData.NA_Name_Level_1 = updatedTaxonomyData.NA_Name_Level_1.replace(
            new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
            replaceText
          );
          taxonomyModified = true;
        }
        
        // Niveau 2
        if (updatedTaxonomyData.NA_Name_Level_2 && updatedTaxonomyData.NA_Name_Level_2.includes(searchText)) {
          const matches = updatedTaxonomyData.NA_Name_Level_2.split(searchText).length - 1;
          taxonomyReplacements += matches;
          updatedTaxonomyData.NA_Name_Level_2 = updatedTaxonomyData.NA_Name_Level_2.replace(
            new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
            replaceText
          );
          taxonomyModified = true;
        }
        
        // Niveau 3
        if (updatedTaxonomyData.NA_Name_Level_3 && updatedTaxonomyData.NA_Name_Level_3.includes(searchText)) {
          const matches = updatedTaxonomyData.NA_Name_Level_3.split(searchText).length - 1;
          taxonomyReplacements += matches;
          updatedTaxonomyData.NA_Name_Level_3 = updatedTaxonomyData.NA_Name_Level_3.replace(
            new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
            replaceText
          );
          taxonomyModified = true;
        }
        
        // Niveau 4
        if (updatedTaxonomyData.NA_Name_Level_4 && updatedTaxonomyData.NA_Name_Level_4.includes(searchText)) {
          const matches = updatedTaxonomyData.NA_Name_Level_4.split(searchText).length - 1;
          taxonomyReplacements += matches;
          updatedTaxonomyData.NA_Name_Level_4 = updatedTaxonomyData.NA_Name_Level_4.replace(
            new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
            replaceText
          );
          taxonomyModified = true;
        }
        
        // Niveau 5
        if (updatedTaxonomyData.NA_Name_Level_5 && updatedTaxonomyData.NA_Name_Level_5.includes(searchText)) {
          const matches = updatedTaxonomyData.NA_Name_Level_5.split(searchText).length - 1;
          taxonomyReplacements += matches;
          updatedTaxonomyData.NA_Name_Level_5 = updatedTaxonomyData.NA_Name_Level_5.replace(
            new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
            replaceText
          );
          taxonomyModified = true;
        }
        
        // Niveau 6
        if (updatedTaxonomyData.NA_Name_Level_6 && updatedTaxonomyData.NA_Name_Level_6.includes(searchText)) {
          const matches = updatedTaxonomyData.NA_Name_Level_6.split(searchText).length - 1;
          taxonomyReplacements += matches;
          updatedTaxonomyData.NA_Name_Level_6 = updatedTaxonomyData.NA_Name_Level_6.replace(
            new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
            replaceText
          );
          taxonomyModified = true;
        }
        
        // Si la taxonomie a été modifiée, l'ajouter à la liste des taxonomies à mettre à jour
        if (taxonomyModified) {
          taxonomiesToUpdate.push({
            taxonomy,
            updatedData: updatedTaxonomyData
          });
          totalReplacements += taxonomyReplacements;
        }
      }
      
      // Mettre à jour toutes les taxonomies modifiées
      for (const { taxonomy, updatedData } of taxonomiesToUpdate) {
        console.log(`FIREBASE: ÉCRITURE - Fichier: taxonomyService.ts - Fonction: searchReplaceInTaxonomies - Path: clients/${clientId}/taxonomies/${taxonomy.id}`);
        await updateTaxonomy(clientId, taxonomy.id, updatedData);
      }
      
      console.log(`Recherche/Remplacement terminée: ${totalReplacements} occurrence(s) remplacée(s) dans ${taxonomiesToUpdate.length} taxonomie(s)`);
      return totalReplacements;
      
    } catch (error) {
      console.error('Erreur lors de la recherche/remplacement dans les taxonomies:', error);
      throw error;
    }
  };
  
  /**
  * NOUVEAU: Effectue une recherche dans tous les champs de structure des taxonomies d'un client donné.
  * Retourne tous les résultats avec le contexte (nom de taxonomie, niveau, contenu).
  * @param {string} clientId - L'identifiant unique du client.
  * @param {string} searchText - Le texte à rechercher (case-sensitive).
  * @returns {Promise<SearchResult[]>} Une promesse qui résout en un tableau de résultats de recherche.
  */
  export const searchInTaxonomies = async (
    clientId: string, 
    searchText: string
  ): Promise<SearchResult[]> => {
    try {
      // Récupérer toutes les taxonomies du client
      console.log("FIREBASE: LECTURE - Fichier: taxonomyService.ts - Fonction: searchInTaxonomies - Path: clients/${clientId}/taxonomies");
      const taxonomies = await getClientTaxonomies(clientId);
      
      const searchResults: SearchResult[] = [];
      
      // Parcourir chaque taxonomie
      for (const taxonomy of taxonomies) {
        // Vérifier chaque champ de structure (NA_Name_Level_1 à NA_Name_Level_6)
        for (let level = 1; level <= 6; level++) {
          const fieldName = `NA_Name_Level_${level}` as keyof Taxonomy;
          const content = taxonomy[fieldName] as string;
          
          if (content && typeof content === 'string' && content.includes(searchText)) {
            searchResults.push({
              taxonomyId: taxonomy.id,
              taxonomyName: taxonomy.NA_Display_Name,
              level: level,
              fieldName: fieldName,
              content: content
            });
          }
        }
      }
      
      console.log(`Recherche terminée: ${searchResults.length} résultat(s) trouvé(s) dans ${taxonomies.length} taxonomie(s)`);
      return searchResults;
      
    } catch (error) {
      console.error('Erreur lors de la recherche dans les taxonomies:', error);
      throw error;
    }
  };