/**
 * Ce fichier contient des fonctions pour interagir avec les guides de coûts et leurs entrées
 * stockés dans Firebase Firestore. Il permet de récupérer, créer, mettre à jour et supprimer
 * des guides de coûts, ainsi que de gérer les entrées spécifiques à chaque guide.
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
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { CostGuide, CostGuideEntry, CostGuideFormData, CostGuideEntryFormData } from '../types/costGuide';

/**
* Récupère tous les guides de coûts depuis la base de données.
* Les guides sont ordonnés par nom.
* @returns {Promise<CostGuide[]>} Une promesse qui résout en un tableau de guides de coûts.
*/
export async function getCostGuides(): Promise<CostGuide[]> {
  try {
      const guidesCollection = collection(db, 'cost_guides');
      const q = query(guidesCollection, orderBy('name'));
      console.log("FIREBASE: LECTURE - Fichier: costGuideService.ts - Fonction: getCostGuides - Path: cost_guides");
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
          (doc) =>
              ({
                  id: doc.id,
                  ...doc.data(),
              } as CostGuide)
      );
  } catch (error) {
      console.error('Erreur lors de la récupération des guides de coûts:', error);
      throw error;
  }
}

/**
* Récupère un guide de coûts spécifique par son ID.
* @param {string} guideId L'ID du guide de coûts à récupérer.
* @returns {Promise<CostGuide | null>} Une promesse qui résout en un objet CostGuide si trouvé, sinon null.
*/
export async function getCostGuideById(guideId: string): Promise<CostGuide | null> {
  try {
      const guideRef = doc(db, 'cost_guides', guideId);
      console.log("FIREBASE: LECTURE - Fichier: costGuideService.ts - Fonction: getCostGuideById - Path: cost_guides/${guideId}");
      const guideSnapshot = await getDoc(guideRef);

      if (!guideSnapshot.exists()) {
          return null;
      }

      return {
          id: guideSnapshot.id,
          ...guideSnapshot.data(),
      } as CostGuide;
  } catch (error) {
      console.error(`Erreur lors de la récupération du guide de coûts ${guideId}:`, error);
      throw error;
  }
}

/**
* Crée un nouveau guide de coûts dans la base de données.
* Ajoute les horodatages de création et de dernière mise à jour.
* @param {CostGuideFormData} guideData Les données du nouveau guide de coûts.
* @returns {Promise<string>} Une promesse qui résout en l'ID du document nouvellement créé.
*/
export async function createCostGuide(guideData: CostGuideFormData): Promise<string> {
  try {
      const now = new Date().toISOString();
      const newGuide = {
          ...guideData,
          createdAt: now,
          updatedAt: now,
      };

      const guidesCollection = collection(db, 'cost_guides');
      console.log("FIREBASE: ÉCRITURE - Fichier: costGuideService.ts - Fonction: createCostGuide - Path: cost_guides");
      const docRef = await addDoc(guidesCollection, newGuide);
      return docRef.id;
  } catch (error) {
      console.error('Erreur lors de la création du guide de coûts:', error);
      throw error;
  }
}

/**
* Met à jour un guide de coûts existant.
* Met à jour l'horodatage de dernière modification.
* @param {string} guideId L'ID du guide de coûts à mettre à jour.
* @param {CostGuideFormData} guideData Les nouvelles données du guide de coûts.
* @returns {Promise<void>} Une promesse qui résout une fois la mise à jour terminée.
*/
export async function updateCostGuide(guideId: string, guideData: CostGuideFormData): Promise<void> {
  try {
      const guideRef = doc(db, 'cost_guides', guideId);
      const updatedGuide = {
          ...guideData,
          updatedAt: new Date().toISOString(),
      };

      console.log("FIREBASE: ÉCRITURE - Fichier: costGuideService.ts - Fonction: updateCostGuide - Path: cost_guides/${guideId}");
      await updateDoc(guideRef, updatedGuide);
  } catch (error) {
      console.error(`Erreur lors de la mise à jour du guide de coûts ${guideId}:`, error);
      throw error;
  }
}

/**
* Supprime un guide de coûts et toutes ses entrées associées.
* @param {string} guideId L'ID du guide de coûts à supprimer.
* @returns {Promise<void>} Une promesse qui résout une fois la suppression terminée.
*/
export async function deleteCostGuide(guideId: string): Promise<void> {
  try {
      const guideRef = doc(db, 'cost_guides', guideId);
      console.log("FIREBASE: ÉCRITURE - Fichier: costGuideService.ts - Fonction: deleteCostGuide - Path: cost_guides/${guideId}");
      await deleteDoc(guideRef);

      const entriesCollection = collection(db, 'cost_guides', guideId, 'entries');
      console.log("FIREBASE: LECTURE - Fichier: costGuideService.ts - Fonction: deleteCostGuide - Path: cost_guides/${guideId}/entries");
      const entriesSnapshot = await getDocs(entriesCollection);

      const deletePromises = entriesSnapshot.docs.map(doc => {
          console.log("FIREBASE: ÉCRITURE - Fichier: costGuideService.ts - Fonction: deleteCostGuide - Path: doc.ref");
          return deleteDoc(doc.ref)
      });
      await Promise.all(deletePromises);
  } catch (error) {
      console.error(`Erreur lors de la suppression du guide de coûts ${guideId}:`, error);
      throw error;
  }
}

/**
* Récupère toutes les entrées associées à un guide de coûts spécifique.
* @param {string} guideId L'ID du guide de coûts dont on veut récupérer les entrées.
* @returns {Promise<CostGuideEntry[]>} Une promesse qui résout en un tableau d'entrées de guide de coûts.
*/
export async function getCostGuideEntries(guideId: string): Promise<CostGuideEntry[]> {
  try {
      const entriesCollection = collection(db, 'cost_guides', guideId, 'entries');
      const q = query(entriesCollection);
      console.log("FIREBASE: LECTURE - Fichier: costGuideService.ts - Fonction: getCostGuideEntries - Path: cost_guides/${guideId}/entries");
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
          (doc) =>
              ({
                  id: doc.id,
                  ...doc.data(),
                  guideId,
              } as CostGuideEntry)
      );
  } catch (error) {
      console.error(`Erreur lors de la récupération des entrées du guide ${guideId}:`, error);
      throw error;
  }
}

/**
* Ajoute une nouvelle entrée à un guide de coûts.
* Convertit `unitPrice` en nombre si c'est une chaîne et ajoute les horodatages.
* @param {string} guideId L'ID du guide de coûts auquel ajouter l'entrée.
* @param {CostGuideEntryFormData} entryData Les données de la nouvelle entrée.
* @param {string} partnerName Le nom du partenaire associé à l'entrée.
* @returns {Promise<string>} Une promesse qui résout en l'ID du document de l'entrée nouvellement créée.
*/
export async function addCostGuideEntry(guideId: string, entryData: CostGuideEntryFormData, partnerName: string): Promise<string> {
  try {
      const now = new Date().toISOString();
      const newEntry = {
          ...entryData,
          partnerName,
          unitPrice: typeof entryData.unitPrice === 'string' ? parseFloat(entryData.unitPrice) : entryData.unitPrice,
          createdAt: now,
          updatedAt: now,
      };

      const entriesCollection = collection(db, 'cost_guides', guideId, 'entries');
      console.log("FIREBASE: ÉCRITURE - Fichier: costGuideService.ts - Fonction: addCostGuideEntry - Path: cost_guides/${guideId}/entries");
      const docRef = await addDoc(entriesCollection, newEntry);
      return docRef.id;
  } catch (error) {
      console.error(`Erreur lors de l'ajout d'une entrée au guide ${guideId}:`, error);
      throw error;
  }
}

/**
* Met à jour une entrée spécifique dans un guide de coûts.
* Convertit `unitPrice` en nombre si c'est une chaîne et met à jour l'horodatage.
* @param {string} guideId L'ID du guide de coûts parent.
* @param {string} entryId L'ID de l'entrée à mettre à jour.
* @param {CostGuideEntryFormData} entryData Les nouvelles données de l'entrée.
* @param {string} partnerName Le nom du partenaire associé à l'entrée.
* @returns {Promise<void>} Une promesse qui résout une fois la mise à jour terminée.
*/
export async function updateCostGuideEntry(guideId: string, entryId: string, entryData: CostGuideEntryFormData, partnerName: string): Promise<void> {
  try {
      const entryRef = doc(db, 'cost_guides', guideId, 'entries', entryId);
      const updatedEntry = {
          ...entryData,
          partnerName,
          unitPrice: typeof entryData.unitPrice === 'string' ? parseFloat(entryData.unitPrice) : entryData.unitPrice,
          updatedAt: new Date().toISOString(),
      };

      console.log("FIREBASE: ÉCRITURE - Fichier: costGuideService.ts - Fonction: updateCostGuideEntry - Path: cost_guides/${guideId}/entries/${entryId}");
      await updateDoc(entryRef, updatedEntry);
  } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'entrée ${entryId}:`, error);
      throw error;
  }
}

/**
* Duplique une entrée existante dans un guide de coûts.
* Crée une nouvelle entrée avec les mêmes données mais un nouvel ID et des horodatages mis à jour.
* @param {string} guideId L'ID du guide de coûts parent.
* @param {string} entryId L'ID de l'entrée à dupliquer.
* @returns {Promise<string>} Une promesse qui résout en l'ID de la nouvelle entrée dupliquée.
*/
export async function duplicateCostGuideEntry(guideId: string, entryId: string): Promise<string> {
  try {
      const entryRef = doc(db, 'cost_guides', guideId, 'entries', entryId);
      console.log("FIREBASE: LECTURE - Fichier: costGuideService.ts - Fonction: duplicateCostGuideEntry - Path: cost_guides/${guideId}/entries/${entryId}");
      const entrySnapshot = await getDoc(entryRef);

      if (!entrySnapshot.exists()) {
          throw new Error(`L'entrée ${entryId} n'existe pas`);
      }

      const entryData = entrySnapshot.data();
      const now = new Date().toISOString();

      const duplicatedEntry = {
          ...entryData,
          createdAt: now,
          updatedAt: now,
      };

      const entriesCollection = collection(db, 'cost_guides', guideId, 'entries');
      console.log("FIREBASE: ÉCRITURE - Fichier: costGuideService.ts - Fonction: duplicateCostGuideEntry - Path: cost_guides/${guideId}/entries");
      const docRef = await addDoc(entriesCollection, duplicatedEntry);
      return docRef.id;
  } catch (error) {
      console.error(`Erreur lors de la duplication de l'entrée ${entryId}:`, error);
      throw error;
  }
}

/**
* Supprime une entrée spécifique d'un guide de coûts.
* @param {string} guideId L'ID du guide de coûts parent.
* @param {string} entryId L'ID de l'entrée à supprimer.
* @returns {Promise<void>} Une promesse qui résout une fois la suppression terminée.
*/
export async function deleteCostGuideEntry(guideId: string, entryId: string): Promise<void> {
  try {
      const entryRef = doc(db, 'cost_guides', guideId, 'entries', entryId);
      console.log("FIREBASE: ÉCRITURE - Fichier: costGuideService.ts - Fonction: deleteCostGuideEntry - Path: cost_guides/${guideId}/entries/${entryId}");
      await deleteDoc(entryRef);
  } catch (error) {
      console.error(`Erreur lors de la suppression de l'entrée ${entryId}:`, error);
      throw error;
  }
}

/**
* Met à jour plusieurs entrées d'un guide de coûts en une seule opération (par lots).
* Utile pour l'édition rapide de plusieurs champs.
* @param {string} guideId L'ID du guide de coûts parent.
* @param {Array<{ id: string; updates: Partial<CostGuideEntryFormData> }>} entries Un tableau d'objets contenant l'ID de l'entrée et les mises à jour partielles.
* @returns {Promise<void>} Une promesse qui résout une fois toutes les mises à jour terminées.
*/
export async function batchUpdateCostGuideEntries(guideId: string, entries: { id: string; updates: Partial<CostGuideEntryFormData> }[]): Promise<void> {
  try {
      const now = new Date().toISOString();

      const updatePromises = entries.map(async (entry) => {
          const entryRef = doc(db, 'cost_guides', guideId, 'entries', entry.id);

          if (entry.updates.unitPrice && typeof entry.updates.unitPrice === 'string') {
              entry.updates.unitPrice = parseFloat(entry.updates.unitPrice);
          }

          console.log("FIREBASE: ÉCRITURE - Fichier: costGuideService.ts - Fonction: batchUpdateCostGuideEntries - Path: cost_guides/${guideId}/entries/${entry.id}");
          await updateDoc(entryRef, {
              ...entry.updates,
              updatedAt: now,
          });
      });

      await Promise.all(updatePromises);
  } catch (error) {
      console.error('Erreur lors de la mise à jour par lots des entrées:', error);
      throw error;
  }
}