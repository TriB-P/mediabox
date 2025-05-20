import {
    collection,
    getDocs,
    getDoc,
    doc,
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { Taxonomy } from '../types/taxonomy';
  
  // Obtenir toutes les taxonomies standard
  export const getDefaultTaxonomies = async () => {
    try {
      console.log('Récupération des taxonomies standard');
      const taxonomiesCollection = collection(db, 'defaultTaxo');
      const snapshot = await getDocs(taxonomiesCollection);
  
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.id, // L'ID est le nom à afficher
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des taxonomies standard:', error);
      return [];
    }
  };
  
  // Obtenir une taxonomie standard spécifique
  export const getDefaultTaxonomyById = async (taxonomyId: string) => {
    try {
      const taxonomyRef = doc(db, 'defaultTaxo', taxonomyId);
      const snapshot = await getDoc(taxonomyRef);
  
      if (!snapshot.exists()) {
        return null;
      }
  
      const data = snapshot.data();
      
      // Mapper les données du document à la structure de Taxonomy
      return {
        id: snapshot.id,
        NA_Display_Name: snapshot.id,
        NA_Description: data.Description || '',
        NA_Standard: true,
        NA_Name_Level_1: data.Niveau_1 || '',
        NA_Name_Level_2: data.Niveau_2 || '',
        NA_Name_Level_3: data.Niveau_3 || '',
        NA_Name_Level_4: data.Niveau_4 || '',
        NA_Name_Level_5: data.Niveau_5 || '',
        NA_Name_Level_6: data.Niveau_6 || '',
        NA_Name_Level_1_Title: data.Titre_Niveau_1 || '',
        NA_Name_Level_2_Title: data.Titre_Niveau_2 || '',
        NA_Name_Level_3_Title: data.Titre_Niveau_3 || '',
        NA_Name_Level_4_Title: data.Titre_Niveau_4 || '',
        NA_Name_Level_5_Title: data.Titre_Niveau_5 || '',
        NA_Name_Level_6_Title: data.Titre_Niveau_6 || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération de la taxonomie standard ${taxonomyId}:`, error);
      return null;
    }
  };
  
  // Exporter comme objet pour s'assurer que les importations fonctionnent correctement
  const defaultTaxonomyService = {
    getDefaultTaxonomies,
    getDefaultTaxonomyById
  };
  
  export default defaultTaxonomyService;