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
  
  // Type pour les shortcodes
  export interface Shortcode {
    id: string;
    SH_Code: string;
    SH_Default_UTM?: string;
    SH_Display_Name_EN?: string;
    SH_Display_Name_FR: string;
    SH_Type?: string;
    SH_Tags?: string[];
  }
  
  // Type pour les codes personnalisés
  export interface CustomCode {
    id: string;
    shortcodeId: string;
    customCode: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // Type pour le formulaire de code personnalisé
  export interface CustomCodeFormData {
    shortcodeId: string;
    customCode: string;
  }
  
  // Type pour la mise à jour d'un code personnalisé
  export interface CustomCodeUpdateData {
    customCode: string;
  }
  
  // Récupérer tous les shortcodes
  export async function getAllShortcodes(): Promise<Shortcode[]> {
    try {
      console.log('Récupération de tous les shortcodes');
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
  
  // Récupérer tous les codes personnalisés pour un client
  export async function getClientCustomCodes(clientId: string): Promise<CustomCode[]> {
    try {
      console.log(`Récupération des codes personnalisés pour le client ${clientId}`);
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
  
  // Vérifier si un shortcode a déjà un code personnalisé
  export async function hasCustomCode(clientId: string, shortcodeId: string): Promise<boolean> {
    try {
      console.log(`Vérification si le shortcode ${shortcodeId} a déjà un code personnalisé pour le client ${clientId}`);
      const customCodesCollection = collection(db, 'clients', clientId, 'customCodes');
      const q = query(customCodesCollection, where('shortcodeId', '==', shortcodeId));
      const snapshot = await getDocs(q);
  
      return !snapshot.empty;
    } catch (error) {
      console.error(`Erreur lors de la vérification du code personnalisé pour ${shortcodeId}:`, error);
      return false;
    }
  }
  
  // Ajouter un nouveau code personnalisé
  export async function addCustomCode(clientId: string, codeData: CustomCodeFormData): Promise<string> {
    try {
      console.log(`Ajout d'un code personnalisé pour le client ${clientId}`);
      
      // Vérifier si ce shortcode a déjà un code personnalisé
      const alreadyExists = await hasCustomCode(clientId, codeData.shortcodeId);
      if (alreadyExists) {
        throw new Error('Ce shortcode a déjà un code personnalisé.');
      }
      
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
  
  // Mettre à jour un code personnalisé
  export async function updateCustomCode(
    clientId: string,
    customCodeId: string,
    updateData: CustomCodeUpdateData
  ): Promise<void> {
    try {
      console.log(`Mise à jour du code personnalisé ${customCodeId} pour le client ${clientId}`);
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
  
  // Supprimer un code personnalisé
  export async function deleteCustomCode(clientId: string, customCodeId: string): Promise<void> {
    try {
      console.log(`Suppression du code personnalisé ${customCodeId} pour le client ${clientId}`);
      const customCodeRef = doc(db, 'clients', clientId, 'customCodes', customCodeId);
      await deleteDoc(customCodeRef);
    } catch (error) {
      console.error(`Erreur lors de la suppression du code personnalisé ${customCodeId}:`, error);
      throw error;
    }
  }