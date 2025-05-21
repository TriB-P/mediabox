// app/lib/shortcodeService.ts

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
  
  export interface Shortcode {
    id: string;
    SH_Code: string;
    SH_Default_UTM?: string;
    SH_Display_Name_EN?: string;
    SH_Display_Name_FR: string;
    SH_Type?: string;
    SH_Tags?: string[];
  }
  
  // Récupérer tous les shortcodes
  export async function getAllShortcodes(): Promise<Shortcode[]> {
    try {
      console.log('Récupération de tous les shortcodes');
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
  
  // Créer un nouveau shortcode
  export async function createShortcode(shortcodeData: Omit<Shortcode, 'id'>): Promise<string> {
    try {
      console.log('Création d\'un nouveau shortcode:', shortcodeData);
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
  
  // Mettre à jour un shortcode
  export async function updateShortcode(shortcodeId: string, shortcodeData: Partial<Shortcode>): Promise<void> {
    try {
      console.log(`Mise à jour du shortcode ${shortcodeId}:`, shortcodeData);
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
  
  // Supprimer un shortcode
  export async function deleteShortcode(shortcodeId: string): Promise<void> {
    try {
      console.log(`Suppression du shortcode ${shortcodeId}`);
      const shortcodeRef = doc(db, 'shortcodes', shortcodeId);
      await deleteDoc(shortcodeRef);
    } catch (error) {
      console.error(`Erreur lors de la suppression du shortcode ${shortcodeId}:`, error);
      throw error;
    }
  }
  
  // Récupérer toutes les dimensions disponibles (listes)
  export async function getAllDimensions(): Promise<string[]> {
    try {
      console.log('Récupération de toutes les dimensions');
      const listsCollection = collection(db, 'lists');
      const snapshot = await getDocs(listsCollection);
      
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Erreur lors de la récupération des dimensions:', error);
      return [];
    }
  }
  
  // Vérifier si un client a une liste personnalisée pour une dimension
  export async function hasCustomList(dimension: string, clientId: string): Promise<boolean> {
    try {
      console.log(`Vérification si le client ${clientId} a une liste personnalisée pour la dimension ${dimension}`);
      const clientListRef = doc(db, 'lists', dimension, 'clients', clientId);
      const snapshot = await getDoc(clientListRef);
      return snapshot.exists();
    } catch (error) {
      console.error(`Erreur lors de la vérification de la liste personnalisée pour le client ${clientId} et la dimension ${dimension}:`, error);
      return false;
    }
  }
  
  // Récupérer les shortcodes pour une dimension et un client spécifiques
  export async function getClientDimensionShortcodes(dimension: string, clientId: string): Promise<Shortcode[]> {
    try {
      console.log(`Récupération des shortcodes pour la dimension ${dimension} et le client ${clientId}`);
      
      // Vérifier si le client a une liste personnalisée, sinon utiliser PlusCo
      const hasCustom = await hasCustomList(dimension, clientId);
      const effectiveClientId = hasCustom ? clientId : 'PlusCo';
      
      console.log(`Utilisation de l'ID client: ${effectiveClientId} (personnalisé: ${hasCustom})`);
      
      const shortcodesCollection = collection(db, 'lists', dimension, 'clients', effectiveClientId, 'shortcodes');
      const snapshot = await getDocs(shortcodesCollection);
      
      // Récupérer tous les IDs de shortcodes
      const shortcodeIds = snapshot.docs.map(doc => doc.id);
      
      if (shortcodeIds.length === 0) {
        return [];
      }
      
      // Récupérer les données réelles des shortcodes
      const shortcodes: Shortcode[] = [];
      for (const id of shortcodeIds) {
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
  
  // Ajouter un shortcode à une dimension pour un client
  export async function addShortcodeToDimension(dimension: string, clientId: string, shortcodeId: string): Promise<void> {
    try {
      console.log(`Ajout du shortcode ${shortcodeId} à la dimension ${dimension} pour le client ${clientId}`);
      
      // S'assurer que le document client existe dans la dimension
      const clientRef = doc(db, 'lists', dimension, 'clients', clientId);
      await setDoc(clientRef, { createdAt: serverTimestamp() }, { merge: true });
      
      // Ajouter le shortcode à la liste du client
      const shortcodeRef = doc(db, 'lists', dimension, 'clients', clientId, 'shortcodes', shortcodeId);
      await setDoc(shortcodeRef, { 
        addedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Erreur lors de l'ajout du shortcode ${shortcodeId} à la dimension ${dimension} pour le client ${clientId}:`, error);
      throw error;
    }
  }
  
  // Supprimer un shortcode d'une dimension pour un client
  export async function removeShortcodeFromDimension(dimension: string, clientId: string, shortcodeId: string): Promise<void> {
    try {
      console.log(`Suppression du shortcode ${shortcodeId} de la dimension ${dimension} pour le client ${clientId}`);
      const shortcodeRef = doc(db, 'lists', dimension, 'clients', clientId, 'shortcodes', shortcodeId);
      await deleteDoc(shortcodeRef);
    } catch (error) {
      console.error(`Erreur lors de la suppression du shortcode ${shortcodeId} de la dimension ${dimension} pour le client ${clientId}:`, error);
      throw error;
    }
  }
  
  // Créer une liste personnalisée pour un client basée sur PlusCo
  export async function createCustomListFromPlusCo(dimension: string, clientId: string): Promise<void> {
    try {
      console.log(`Création d'une liste personnalisée pour la dimension ${dimension} et le client ${clientId} basée sur PlusCo`);
      
      // Récupérer les shortcodes PlusCo
      const plusCoShortcodes = await getClientDimensionShortcodes(dimension, 'PlusCo');
      
      // Créer le document client dans la dimension
      const clientRef = doc(db, 'lists', dimension, 'clients', clientId);
      await setDoc(clientRef, { 
        createdAt: serverTimestamp(),
        copiedFrom: 'PlusCo'
      });
      
      // Ajouter tous les shortcodes PlusCo à la nouvelle liste client
      for (const shortcode of plusCoShortcodes) {
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

  // Fonction à ajouter dans shortcodeService.ts

// Supprimer une liste personnalisée pour un client
export async function deleteCustomList(dimension: string, clientId: string): Promise<void> {
    try {
      console.log(`Suppression de la liste personnalisée pour la dimension ${dimension} et le client ${clientId}`);
      
      // Vérifier d'abord si la liste personnalisée existe
      const exists = await hasCustomList(dimension, clientId);
      if (!exists) {
        throw new Error('La liste personnalisée n\'existe pas.');
      }
      
      // Récupérer toutes les shortcodes dans la liste
      const shortcodesCollection = collection(db, 'lists', dimension, 'clients', clientId, 'shortcodes');
      const snapshot = await getDocs(shortcodesCollection);
      
      // Supprimer tous les shortcodes de la liste
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      // Supprimer le document client de la dimension
      const clientRef = doc(db, 'lists', dimension, 'clients', clientId);
      await deleteDoc(clientRef);
      
      console.log(`Liste personnalisée supprimée pour la dimension ${dimension} et le client ${clientId}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de la liste personnalisée pour la dimension ${dimension} et le client ${clientId}:`, error);
      throw error;
    }
  }

  export async function updatePartner(
    partnerId: string,
    partnerData: Partial<Shortcode>
  ): Promise<void> {
    try {
      console.log(`Mise à jour du partenaire ${partnerId}:`, partnerData);
      
      // Mettre à jour le document dans la collection shortcodes
      const shortcodeRef = doc(db, 'shortcodes', partnerId);
      await updateDoc(shortcodeRef, {
        ...partnerData,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Partenaire ${partnerId} mis à jour avec succès`);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du partenaire ${partnerId}:`, error);
      throw error;
    }
  }