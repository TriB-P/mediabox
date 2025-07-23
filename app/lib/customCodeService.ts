/**
 * Ce fichier gère toutes les interactions avec Firebase Firestore
 * pour les collections 'shortcodes' et 'customCodes'.
 * Il permet de récupérer, ajouter, modifier et supprimer des données
 * relatives aux shortcodes et aux codes personnalisés associés aux clients.
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
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Shortcode {
  id: string;
  SH_Code: string;
  SH_Default_UTM?: string;
  SH_Display_Name_EN?: string;
  SH_Display_Name_FR: string;
  SH_Type?: string;
  SH_Tags?: string[];
}

export interface CustomCode {
  id: string;
  shortcodeId: string;
  customCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomCodeFormData {
  shortcodeId: string;
  customCode: string;
}

export interface CustomCodeUpdateData {
  customCode: string;
}

/**
 * Récupère tous les shortcodes disponibles dans la collection 'shortcodes'.
 * @returns {Promise<Shortcode[]>} Une promesse qui résout en un tableau de Shortcode.
 * Retourne un tableau vide en cas d'erreur.
 */
export async function getAllShortcodes(): Promise<Shortcode[]> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: [NOM_DU_FICHIER] - Fonction: getAllShortcodes - Path: shortcodes");
    const shortcodesCollection = collection(db, 'shortcodes');
    const snapshot = await getDocs(shortcodesCollection);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Shortcode));
  } catch (error) {
    console.error('Erreur lors de la récupération des shortcodes:', error);
    return [];
  }
}

/**
 * Récupère tous les codes personnalisés associés à un client spécifique.
 * @param {string} clientId L'identifiant du client.
 * @returns {Promise<CustomCode[]>} Une promesse qui résout en un tableau de CustomCode.
 * Retourne un tableau vide en cas d'erreur.
 */
export async function getClientCustomCodes(clientId: string): Promise<CustomCode[]> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: [NOM_DU_FICHIER] - Fonction: getClientCustomCodes - Path: clients/${clientId}/customCodes");
    const customCodesCollection = collection(db, 'clients', clientId, 'customCodes');
    const snapshot = await getDocs(customCodesCollection);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as CustomCode));
  } catch (error) {
    console.error(`Erreur lors de la récupération des codes personnalisés pour le client ${clientId}:`, error);
    return [];
  }
}

/**
 * Vérifie si un shortcode donné a déjà un code personnalisé associé à un client spécifique.
 * @param {string} clientId L'identifiant du client.
 * @param {string} shortcodeId L'identifiant du shortcode à vérifier.
 * @returns {Promise<boolean>} Une promesse qui résout en `true` si un code personnalisé existe, `false` sinon.
 * Retourne `false` en cas d'erreur.
 */
export async function hasCustomCode(clientId: string, shortcodeId: string): Promise<boolean> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: [NOM_DU_FICHIER] - Fonction: hasCustomCode - Path: clients/${clientId}/customCodes");
    const customCodesCollection = collection(db, 'clients', clientId, 'customCodes');
    const q = query(customCodesCollection, where('shortcodeId', '==', shortcodeId));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error(`Erreur lors de la vérification du code personnalisé pour ${shortcodeId}:`, error);
    return false;
  }
}

/**
 * Ajoute un nouveau code personnalisé pour un client donné.
 * Vérifie d'abord si un code personnalisé pour ce shortcode existe déjà pour le client.
 * @param {string} clientId L'identifiant du client.
 * @param {CustomCodeFormData} codeData Les données du code personnalisé à ajouter.
 * @returns {Promise<string>} Une promesse qui résout en l'identifiant du document ajouté.
 * Lance une erreur si le shortcode a déjà un code personnalisé ou en cas d'échec de l'ajout.
 */
export async function addCustomCode(clientId: string, codeData: CustomCodeFormData): Promise<string> {
  try {
    const alreadyExists = await hasCustomCode(clientId, codeData.shortcodeId);
    if (alreadyExists) {
      throw new Error('Ce shortcode a déjà un code personnalisé.');
    }
    
    console.log("FIREBASE: ÉCRITURE - Fichier: [NOM_DU_FICHIER] - Fonction: addCustomCode - Path: clients/${clientId}/customCodes");
    const customCodesCollection = collection(db, 'clients', clientId, 'customCodes');
    const now = new Date().toISOString();
    
    const newCustomCode = {
      ...codeData,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(customCodesCollection, newCustomCode);
    return docRef.id;
  } catch (error) {
    console.error(`Erreur lors de l'ajout du code personnalisé:`, error);
    throw error;
  }
}

/**
 * Met à jour un code personnalisé existant pour un client donné.
 * @param {string} clientId L'identifiant du client.
 * @param {string} customCodeId L'identifiant du code personnalisé à mettre à jour.
 * @param {CustomCodeUpdateData} updateData Les données à mettre à jour pour le code personnalisé.
 * @returns {Promise<void>} Une promesse qui résout une fois la mise à jour effectuée.
 * Lance une erreur en cas d'échec de la mise à jour.
 */
export async function updateCustomCode(
  clientId: string,
  customCodeId: string,
  updateData: CustomCodeUpdateData
): Promise<void> {
  try {
    console.log("FIREBASE: ÉCRITURE - Fichier: [NOM_DU_FICHIER] - Fonction: updateCustomCode - Path: clients/${clientId}/customCodes/${customCodeId}");
    const customCodeRef = doc(db, 'clients', clientId, 'customCodes', customCodeId);
    
    await updateDoc(customCodeRef, {
      customCode: updateData.customCode,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du code personnalisé ${customCodeId}:`, error);
    throw error;
  }
}

/**
 * Supprime un code personnalisé existant pour un client donné.
 * @param {string} clientId L'identifiant du client.
 * @param {string} customCodeId L'identifiant du code personnalisé à supprimer.
 * @returns {Promise<void>} Une promesse qui résout une fois la suppression effectuée.
 * Lance une erreur en cas d'échec de la suppression.
 */
export async function deleteCustomCode(clientId: string, customCodeId: string): Promise<void> {
  try {
    console.log("FIREBASE: ÉCRITURE - Fichier: [NOM_DU_FICHIER] - Fonction: deleteCustomCode - Path: clients/${clientId}/customCodes/${customCodeId}");
    const customCodeRef = doc(db, 'clients', clientId, 'customCodes', customCodeId);
    await deleteDoc(customCodeRef);
  } catch (error) {
    console.error(`Erreur lors de la suppression du code personnalisé ${customCodeId}:`, error);
    throw error;
  }
}