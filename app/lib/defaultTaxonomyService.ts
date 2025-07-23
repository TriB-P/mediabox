/**
 * Ce fichier est responsable de l'interaction avec la collection 'defaultTaxo'
 * dans Firebase Firestore. Il fournit des fonctions pour récupérer toutes les
 * taxonomies par défaut ou une taxonomie spécifique par son ID.
 * Il est utilisé pour gérer les données de taxonomie standard de l'application.
 */
import {
  collection,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Taxonomy } from '../types/taxonomy';

/**
* Récupère toutes les taxonomies standard depuis la collection 'defaultTaxo' de Firebase.
* @returns {Promise<Array<{id: string, name: string}>>} Une promesse qui résout en un tableau d'objets,
* chacun contenant l'ID et le nom de la taxonomie. Retourne un tableau vide en cas d'erreur.
*/
export const getDefaultTaxonomies = async () => {
  try {
      console.log("FIREBASE: LECTURE - Fichier: defaultTaxonomyService.ts - Fonction: getDefaultTaxonomies - Path: defaultTaxo");
      const taxonomiesCollection = collection(db, 'defaultTaxo');
      const snapshot = await getDocs(taxonomiesCollection);

      return snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.id,
      }));
  } catch (error) {
      console.error('Erreur lors de la récupération des taxonomies standard:', error);
      return [];
  }
};

/**
* Récupère une taxonomie standard spécifique par son ID depuis la collection 'defaultTaxo' de Firebase.
* @param {string} taxonomyId - L'ID de la taxonomie à récupérer.
* @returns {Promise<Taxonomy | null>} Une promesse qui résout en un objet Taxonomy si la taxonomie est trouvée,
* ou null si elle n'existe pas ou si une erreur survient.
*/
export const getDefaultTaxonomyById = async (taxonomyId: string) => {
  try {
      console.log(`FIREBASE: LECTURE - Fichier: defaultTaxonomyService.ts - Fonction: getDefaultTaxonomyById - Path: defaultTaxo/${taxonomyId}`);
      const taxonomyRef = doc(db, 'defaultTaxo', taxonomyId);
      const snapshot = await getDoc(taxonomyRef);

      if (!snapshot.exists()) {
          return null;
      }

      const data = snapshot.data();

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

const defaultTaxonomyService = {
  getDefaultTaxonomies,
  getDefaultTaxonomyById
};

export default defaultTaxonomyService;