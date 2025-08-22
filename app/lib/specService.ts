/**
 * Ce fichier gère toutes les interactions avec la collection 'specs' de Firebase pour un partenaire donné.
 * Il permet de récupérer, ajouter, modifier et supprimer des spécifications.
 * C'est essentiel pour gérer les différentes caractéristiques techniques des annonces ou des contenus.
 */
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Spec {
  id: string;
  name: string;
  format: string;
  ratio: string;
  fileType: string;
  maxWeight: string;
  weight: string;
  animation: string;
  title: string;
  text: string;
  specSheetLink: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpecFormData {
  name: string;
  format: string;
  ratio: string;
  fileType: string;
  maxWeight: string;
  weight: string;
  animation: string;
  title: string;
  text: string;
  specSheetLink: string;
  notes: string;
}

/**
 * Récupère toutes les spécifications pour un partenaire spécifique depuis Firebase.
 * @param partnerId L'identifiant unique du partenaire.
 * @returns Une promesse qui résout en un tableau d'objets Spec.
 */
export async function getPartnerSpecs(partnerId: string): Promise<Spec[]> {
  try {
    const specsCollection = collection(
      db,
      'shortcodes',
      partnerId,
      'specs'
    );
    const q = query(specsCollection, orderBy('name'));
    console.log("FIREBASE: LECTURE - Fichier: [NOM_DU_FICHIER] - Fonction: getPartnerSpecs - Path: lists/CA_Publisher/shortcodes/${partnerId}/specs");
    const snapshot = await getDocs(q);

    const specs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Spec));

    return specs;
  } catch (error) {
    console.error('Erreur lors de la récupération des specs:', error);
    return [];
  }
}

/**
 * Ajoute une nouvelle spécification pour un partenaire spécifique à Firebase.
 * @param partnerId L'identifiant unique du partenaire.
 * @param specData Les données de la spécification à ajouter.
 * @returns Une promesse qui résout en l'identifiant de la nouvelle spécification.
 */
export async function addSpec(partnerId: string, specData: SpecFormData): Promise<string> {
  try {
    const specsCollection = collection(
      db,
      'shortcodes',
      partnerId,
      'specs'
    );

    const now = new Date().toISOString();

    const newSpec = {
      ...specData,
      createdAt: now,
      updatedAt: now,
    };

    console.log("FIREBASE: ÉCRITURE - Fichier: [NOM_DU_FICHIER] - Fonction: addSpec - Path: lists/CA_Publisher/shortcodes/${partnerId}/specs");
    const docRef = await addDoc(specsCollection, newSpec);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la spec:', error);
    throw error;
  }
}

/**
 * Met à jour une spécification existante pour un partenaire spécifique dans Firebase.
 * @param partnerId L'identifiant unique du partenaire.
 * @param specId L'identifiant unique de la spécification à mettre à jour.
 * @param specData Les nouvelles données de la spécification.
 * @returns Une promesse qui résout lorsque la mise à jour est terminée.
 */
export async function updateSpec(partnerId: string, specId: string, specData: SpecFormData): Promise<void> {
  try {
    const specRef = doc(
      db,
      'shortcodes',
      partnerId,
      'specs',
      specId
    );

    const updatedSpec = {
      ...specData,
      updatedAt: new Date().toISOString(),
    };

    console.log("FIREBASE: ÉCRITURE - Fichier: [NOM_DU_FICHIER] - Fonction: updateSpec - Path: lists/CA_Publisher/shortcodes/${partnerId}/specs/${specId}");
    await updateDoc(specRef, updatedSpec);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la spec:', error);
    throw error;
  }
}

/**
 * Supprime une spécification existante pour un partenaire spécifique de Firebase.
 * @param partnerId L'identifiant unique du partenaire.
 * @param specId L'identifiant unique de la spécification à supprimer.
 * @returns Une promesse qui résout lorsque la suppression est terminée.
 */
export async function deleteSpec(partnerId: string, specId: string): Promise<void> {
  try {
    const specRef = doc(
      db,
      'shortcodes',
      partnerId,
      'specs',
      specId
    );

    console.log("FIREBASE: ÉCRITURE - Fichier: [NOM_DU_FICHIER] - Fonction: deleteSpec - Path: lists/CA_Publisher/shortcodes/${partnerId}/specs/${specId}");
    await deleteDoc(specRef);
  } catch (error) {
    console.error('Erreur lors de la suppression de la spec:', error);
    throw error;
  }
}