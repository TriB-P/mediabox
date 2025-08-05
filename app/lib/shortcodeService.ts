/**
 * Ce fichier contient des fonctions de service pour interagir avec les shortcodes
 * stockés dans Firebase Firestore. Il permet de gérer les opérations CRUD (Créer, Lire, Mettre à jour, Supprimer)
 * pour les shortcodes, ainsi que des fonctionnalités liées aux listes personnalisées
 * de shortcodes pour différents clients et dimensions.
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { limit, startAfter, DocumentSnapshot } from 'firebase/firestore';


export interface Shortcode {
  id: string;
  SH_Code: string;
  SH_Default_UTM?: string;
  SH_Display_Name_FR?: string;
  SH_Display_Name_EN: string;
  SH_Type?: string;
  SH_Tags?: string[];
}

export interface PaginatedShortcodeResponse {
  shortcodes: Shortcode[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

/**
* Récupère tous les shortcodes de la collection 'shortcodes'.
* @returns Une promesse qui résout en un tableau de tous les shortcodes.
*/
export async function getAllShortcodes(): Promise<Shortcode[]> {
  try {
      console.log("FIREBASE: LECTURE - Fichier: shortcodeService.ts - Fonction: getAllShortcodes - Path: shortcodes");
      const shortcodesCollection = collection(db, 'shortcodes');
      const snapshot = await getDocs(shortcodesCollection);

      return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      } as Shortcode));
  } catch (error) {
      console.error('Erreur lors de la récupération des shortcodes:', error);
      return [];
  }
}

/**
* Crée un nouveau shortcode dans la collection 'shortcodes'.
* @param shortcodeData Les données du shortcode à créer, sans l'ID.
* @returns Une promesse qui résout en l'ID du document nouvellement créé.
*/
export async function createShortcode(shortcodeData: Omit<Shortcode, 'id'>): Promise<string> {
  try {
      console.log("FIREBASE: ÉCRITURE - Fichier: shortcodeService.ts - Fonction: createShortcode - Path: shortcodes");
      const shortcodesCollection = collection(db, 'shortcodes');
      const docRef = await addDoc(shortcodesCollection, {
          ...shortcodeData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
      });
      return docRef.id;
  } catch (error) {
      console.error('Erreur lors de la création du shortcode:', error);
      throw error;
  }
}

/**
* Met à jour un shortcode existant dans la collection 'shortcodes'.
* @param shortcodeId L'ID du shortcode à mettre à jour.
* @param shortcodeData Les données partielles du shortcode à mettre à jour.
* @returns Une promesse qui résout une fois la mise à jour terminée.
*/
export async function updateShortcode(shortcodeId: string, shortcodeData: Partial<Shortcode>): Promise<void> {
  try {
      console.log("FIREBASE: ÉCRITURE - Fichier: shortcodeService.ts - Fonction: updateShortcode - Path: shortcodes/${shortcodeId}");
      const shortcodeRef = doc(db, 'shortcodes', shortcodeId);
      await updateDoc(shortcodeRef, {
          ...shortcodeData,
          updatedAt: serverTimestamp()
      });
  } catch (error) {
      console.error(`Erreur lors de la mise à jour du shortcode ${shortcodeId}:`, error);
      throw error;
  }
}

/**
* Supprime un shortcode de la collection 'shortcodes'.
* @param shortcodeId L'ID du shortcode à supprimer.
* @returns Une promesse qui résout une fois la suppression terminée.
*/
export async function deleteShortcode(shortcodeId: string): Promise<void> {
  try {
      console.log("FIREBASE: ÉCRITURE - Fichier: shortcodeService.ts - Fonction: deleteShortcode - Path: shortcodes/${shortcodeId}");
      const shortcodeRef = doc(db, 'shortcodes', shortcodeId);
      await deleteDoc(shortcodeRef);
  } catch (error) {
      console.error(`Erreur lors de la suppression du shortcode ${shortcodeId}:`, error);
      throw error;
  }
}

/**
* Récupère toutes les dimensions disponibles (les IDs des documents dans la collection 'lists').
* @returns Une promesse qui résout en un tableau de chaînes de caractères représentant les IDs des dimensions.
*/
export async function getAllDimensions(): Promise<string[]> {
  try {
      console.log("FIREBASE: LECTURE - Fichier: shortcodeService.ts - Fonction: getAllDimensions - Path: lists");
      const listsCollection = collection(db, 'lists');
      const snapshot = await getDocs(listsCollection);

      return snapshot.docs.map(doc => doc.id);
  } catch (error) {
      console.error('Erreur lors de la récupération des dimensions:', error);
      return [];
  }
}

/**
* Vérifie si un client spécifique a une liste personnalisée pour une dimension donnée.
* @param dimension La dimension à vérifier.
* @param clientId L'ID du client.
* @returns Une promesse qui résout en `true` si le client a une liste personnalisée, sinon `false`.
*/
export async function hasCustomList(dimension: string, clientId: string): Promise<boolean> {
  try {
      console.log("FIREBASE: LECTURE - Fichier: shortcodeService.ts - Fonction: hasCustomList - Path: lists/${dimension}/clients/${clientId}");
      const clientListRef = doc(db, 'lists', dimension, 'clients', clientId);
      const snapshot = await getDoc(clientListRef);
      return snapshot.exists();
  } catch (error) {
      console.error(`Erreur lors de la vérification de la liste personnalisée pour le client ${clientId} et la dimension ${dimension}:`, error);
      return false;
  }
}

/**
* Récupère les shortcodes pour une dimension et un client spécifiques.
* Si le client n'a pas de liste personnalisée pour la dimension, les shortcodes de 'PlusCo' sont utilisés.
* @param dimension La dimension des shortcodes à récupérer.
* @param clientId L'ID du client.
* @returns Une promesse qui résout en un tableau de shortcodes.
*/
export async function getClientDimensionShortcodes(dimension: string, clientId: string): Promise<Shortcode[]> {
  try {
      const hasCustom = await hasCustomList(dimension, clientId);
      const effectiveClientId = hasCustom ? clientId : 'PlusCo';

      console.log("FIREBASE: LECTURE - Fichier: shortcodeService.ts - Fonction: getClientDimensionShortcodes - Path: lists/${dimension}/clients/${effectiveClientId}/shortcodes");
      const shortcodesCollection = collection(db, 'lists', dimension, 'clients', effectiveClientId, 'shortcodes');
      const snapshot = await getDocs(shortcodesCollection);

      const shortcodeIds = snapshot.docs.map(doc => doc.id);

      if (shortcodeIds.length === 0) {
          return [];
      }

      const shortcodes: Shortcode[] = [];
      for (const id of shortcodeIds) {
          console.log("FIREBASE: LECTURE - Fichier: shortcodeService.ts - Fonction: getClientDimensionShortcodes - Path: shortcodes/${id}");
          const shortcodeRef = doc(db, 'shortcodes', id);
          const shortcodeSnap = await getDoc(shortcodeRef);

          if (shortcodeSnap.exists()) {
              shortcodes.push({
                  id: shortcodeSnap.id,
                  ...shortcodeSnap.data()
              } as Shortcode);
          }
      }

      return shortcodes;
  } catch (error) {
      console.error(`Erreur lors de la récupération des shortcodes pour la dimension ${dimension} et le client ${clientId}:`, error);
      return [];
  }
}

/**
* Ajoute un shortcode à une dimension spécifique pour un client donné.
* Crée le document client si nécessaire avant d'ajouter le shortcode.
* @param dimension La dimension à laquelle ajouter le shortcode.
* @param clientId L'ID du client.
* @param shortcodeId L'ID du shortcode à ajouter.
* @returns Une promesse qui résout une fois l'ajout terminé.
*/
export async function addShortcodeToDimension(dimension: string, clientId: string, shortcodeId: string): Promise<void> {
  try {
      console.log("FIREBASE: ÉCRITURE - Fichier: shortcodeService.ts - Fonction: addShortcodeToDimension - Path: lists/${dimension}/clients/${clientId}");
      const clientRef = doc(db, 'lists', dimension, 'clients', clientId);
      await setDoc(clientRef, { createdAt: serverTimestamp() }, { merge: true });

      console.log("FIREBASE: ÉCRITURE - Fichier: shortcodeService.ts - Fonction: addShortcodeToDimension - Path: lists/${dimension}/clients/${clientId}/shortcodes/${shortcodeId}");
      const shortcodeRef = doc(db, 'lists', dimension, 'clients', clientId, 'shortcodes', shortcodeId);
      await setDoc(shortcodeRef, {
          addedAt: serverTimestamp()
      });
  } catch (error) {
      console.error(`Erreur lors de l'ajout du shortcode ${shortcodeId} à la dimension ${dimension} pour le client ${clientId}:`, error);
      throw error;
  }
}

/**
* Supprime un shortcode d'une dimension spécifique pour un client donné.
* @param dimension La dimension de laquelle supprimer le shortcode.
* @param clientId L'ID du client.
* @param shortcodeId L'ID du shortcode à supprimer.
* @returns Une promesse qui résout une fois la suppression terminée.
*/
export async function removeShortcodeFromDimension(dimension: string, clientId: string, shortcodeId: string): Promise<void> {
  try {
      console.log("FIREBASE: ÉCRITURE - Fichier: shortcodeService.ts - Fonction: removeShortcodeFromDimension - Path: lists/${dimension}/clients/${clientId}/shortcodes/${shortcodeId}");
      const shortcodeRef = doc(db, 'lists', dimension, 'clients', clientId, 'shortcodes', shortcodeId);
      await deleteDoc(shortcodeRef);
  } catch (error) {
      console.error(`Erreur lors de la suppression du shortcode ${shortcodeId} de la dimension ${dimension} pour le client ${clientId}:`, error);
      throw error;
  }
}

/**
* Crée une liste personnalisée pour un client basée sur les shortcodes de 'PlusCo' pour une dimension donnée.
* @param dimension La dimension pour laquelle créer la liste personnalisée.
* @param clientId L'ID du client pour lequel créer la liste.
* @returns Une promesse qui résout une fois la liste personnalisée créée.
*/
export async function createCustomListFromPlusCo(dimension: string, clientId: string): Promise<void> {
  try {
      const plusCoShortcodes = await getClientDimensionShortcodes(dimension, 'PlusCo');

      console.log("FIREBASE: ÉCRITURE - Fichier: shortcodeService.ts - Fonction: createCustomListFromPlusCo - Path: lists/${dimension}/clients/${clientId}");
      const clientRef = doc(db, 'lists', dimension, 'clients', clientId);
      await setDoc(clientRef, {
          createdAt: serverTimestamp(),
          copiedFrom: 'PlusCo'
      });

      for (const shortcode of plusCoShortcodes) {
          console.log("FIREBASE: ÉCRITURE - Fichier: shortcodeService.ts - Fonction: createCustomListFromPlusCo - Path: lists/${dimension}/clients/${clientId}/shortcodes/${shortcode.id}");
          const shortcodeRef = doc(db, 'lists', dimension, 'clients', clientId, 'shortcodes', shortcode.id);
          await setDoc(shortcodeRef, {
              addedAt: serverTimestamp()
          });
      }
  } catch (error) {
      console.error(`Erreur lors de la création de la liste personnalisée pour la dimension ${dimension} et le client ${clientId}:`, error);
      throw error;
  }
}

/**
* Supprime une liste personnalisée pour un client et une dimension donnés.
* Supprime d'abord tous les shortcodes de la liste, puis le document client.
* @param dimension La dimension de la liste personnalisée à supprimer.
* @param clientId L'ID du client dont la liste personnalisée doit être supprimée.
* @returns Une promesse qui résout une fois la suppression terminée.
*/
export async function deleteCustomList(dimension: string, clientId: string): Promise<void> {
  try {
      const exists = await hasCustomList(dimension, clientId);
      if (!exists) {
          throw new Error('La liste personnalisée n\'existe pas.');
      }

      console.log("FIREBASE: LECTURE - Fichier: shortcodeService.ts - Fonction: deleteCustomList - Path: lists/${dimension}/clients/${clientId}/shortcodes");
      const shortcodesCollection = collection(db, 'lists', dimension, 'clients', clientId, 'shortcodes');
      const snapshot = await getDocs(shortcodesCollection);

      for (const doc of snapshot.docs) {
          console.log("FIREBASE: ÉCRITURE - Fichier: shortcodeService.ts - Fonction: deleteCustomList - Path: lists/${dimension}/clients/${clientId}/shortcodes/${doc.id}");
          await deleteDoc(doc.ref);
      }

      console.log("FIREBASE: ÉCRITURE - Fichier: shortcodeService.ts - Fonction: deleteCustomList - Path: lists/${dimension}/clients/${clientId}");
      const clientRef = doc(db, 'lists', dimension, 'clients', clientId);
      await deleteDoc(clientRef);
  } catch (error) {
      console.error(`Erreur lors de la suppression de la liste personnalisée pour la dimension ${dimension} et le client ${clientId}:`, error);
      throw error;
  }
}

/**
* Met à jour un partenaire (qui est un shortcode avec un ID de partenaire).
* @param partnerId L'ID du partenaire à mettre à jour.
* @param partnerData Les données partielles du partenaire à mettre à jour.
* @returns Une promesse qui résout une fois la mise à jour terminée.
*/
export async function updatePartner(
  partnerId: string,
  partnerData: Partial<Shortcode>
): Promise<void> {
  try {
      console.log("FIREBASE: ÉCRITURE - Fichier: shortcodeService.ts - Fonction: updatePartner - Path: shortcodes/${partnerId}");
      const shortcodeRef = doc(db, 'shortcodes', partnerId);
      await updateDoc(shortcodeRef, {
          ...partnerData,
          updatedAt: serverTimestamp()
      });
  } catch (error) {
      console.error(`Erreur lors de la mise à jour du partenaire ${partnerId}:`, error);
      throw error;
  }
}

/**
* Récupère les shortcodes pour une dimension et un client spécifiques avec pagination.
* @param dimension La dimension des shortcodes à récupérer.
* @param clientId L'ID du client.
* @param pageSize Le nombre de documents à récupérer par page (par défaut 50).
* @param lastDocument Le dernier document de la page précédente pour la pagination.
* @returns Une promesse qui résout en un objet `PaginatedShortcodeResponse` contenant les shortcodes, le dernier document et un indicateur s'il y a plus de données.
*/
export async function getClientDimensionShortcodesPaginated(
  dimension: string,
  clientId: string,
  pageSize: number = 50,
  lastDocument?: DocumentSnapshot | null
): Promise<PaginatedShortcodeResponse> {
  try {
      const hasCustom = await hasCustomList(dimension, clientId);
      const effectiveClientId = hasCustom ? clientId : 'PlusCo';

      console.log("FIREBASE: LECTURE - Fichier: shortcodeService.ts - Fonction: getClientDimensionShortcodesPaginated - Path: lists/${dimension}/clients/${effectiveClientId}/shortcodes");
      const shortcodesCollection = collection(db, 'lists', dimension, 'clients', effectiveClientId, 'shortcodes');

      let q = query(shortcodesCollection, limit(pageSize));

      if (lastDocument) {
          q = query(shortcodesCollection, startAfter(lastDocument), limit(pageSize));
      }

      const snapshot = await getDocs(q);

      const shortcodeIds = snapshot.docs.map(doc => doc.id);
      const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

      if (shortcodeIds.length === 0) {
          return {
              shortcodes: [],
              lastDoc: null,
              hasMore: false
          };
      }

      const shortcodes: Shortcode[] = [];
      for (const id of shortcodeIds) {
          console.log("FIREBASE: LECTURE - Fichier: shortcodeService.ts - Fonction: getClientDimensionShortcodesPaginated - Path: shortcodes/${id}");
          const shortcodeRef = doc(db, 'shortcodes', id);
          const shortcodeSnap = await getDoc(shortcodeRef);

          if (shortcodeSnap.exists()) {
              shortcodes.push({
                  id: shortcodeSnap.id,
                  ...shortcodeSnap.data()
              } as Shortcode);
          }
      }

      console.log("FIREBASE: LECTURE - Fichier: shortcodeService.ts - Fonction: getClientDimensionShortcodesPaginated - Path: lists/${dimension}/clients/${effectiveClientId}/shortcodes (hasMore check)");
      const hasMoreQuery = query(
          shortcodesCollection,
          startAfter(lastDoc),
          limit(1)
      );
      const hasMoreSnapshot = await getDocs(hasMoreQuery);
      const hasMore = !hasMoreSnapshot.empty;

      return {
          shortcodes,
          lastDoc,
          hasMore
      };

  } catch (error) {
      console.error(`Erreur lors de la récupération paginée des shortcodes pour la dimension ${dimension} et le client ${clientId}:`, error);
      return {
          shortcodes: [],
          lastDoc: null,
          hasMore: false
      };
  }
}

/**
* Compte le nombre total de shortcodes pour une dimension et un client spécifiques.
* Si le client n'a pas de liste personnalisée, les shortcodes de 'PlusCo' sont comptés.
* @param dimension La dimension des shortcodes à compter.
* @param clientId L'ID du client.
* @returns Une promesse qui résout en le nombre total de shortcodes.
*/
export async function getClientDimensionShortcodesCount(
  dimension: string,
  clientId: string
): Promise<number> {
  try {
      const hasCustom = await hasCustomList(dimension, clientId);
      const effectiveClientId = hasCustom ? clientId : 'PlusCo';

      console.log("FIREBASE: LECTURE - Fichier: shortcodeService.ts - Fonction: getClientDimensionShortcodesCount - Path: lists/${dimension}/clients/${effectiveClientId}/shortcodes");
      const shortcodesCollection = collection(db, 'lists', dimension, 'clients', effectiveClientId, 'shortcodes');
      const snapshot = await getDocs(shortcodesCollection);

      return snapshot.size;
  } catch (error) {
      console.error(`Erreur lors du comptage des shortcodes:`, error);
      return 0;
  }
}