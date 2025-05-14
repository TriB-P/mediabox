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
  
  // Obtenir tous les guides de coûts
  export async function getCostGuides(): Promise<CostGuide[]> {
    try {
      const guidesCollection = collection(db, 'cost_guides');
      const q = query(guidesCollection, orderBy('name'));
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
  
  // Obtenir un guide de coûts par ID
  export async function getCostGuideById(guideId: string): Promise<CostGuide | null> {
    try {
      const guideRef = doc(db, 'cost_guides', guideId);
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
  
  // Créer un nouveau guide de coûts
  export async function createCostGuide(guideData: CostGuideFormData): Promise<string> {
    try {
      const now = new Date().toISOString();
      const newGuide = {
        ...guideData,
        createdAt: now,
        updatedAt: now,
      };
  
      const guidesCollection = collection(db, 'cost_guides');
      const docRef = await addDoc(guidesCollection, newGuide);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création du guide de coûts:', error);
      throw error;
    }
  }
  
  // Mettre à jour un guide de coûts
  export async function updateCostGuide(guideId: string, guideData: CostGuideFormData): Promise<void> {
    try {
      const guideRef = doc(db, 'cost_guides', guideId);
      const updatedGuide = {
        ...guideData,
        updatedAt: new Date().toISOString(),
      };
  
      await updateDoc(guideRef, updatedGuide);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du guide de coûts ${guideId}:`, error);
      throw error;
    }
  }
  
  // Supprimer un guide de coûts
  export async function deleteCostGuide(guideId: string): Promise<void> {
    try {
      const guideRef = doc(db, 'cost_guides', guideId);
      await deleteDoc(guideRef);
      
      // Supprimer également toutes les entrées associées
      const entriesCollection = collection(db, 'cost_guides', guideId, 'entries');
      const entriesSnapshot = await getDocs(entriesCollection);
      
      const deletePromises = entriesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`Erreur lors de la suppression du guide de coûts ${guideId}:`, error);
      throw error;
    }
  }
  
  // Obtenir toutes les entrées d'un guide de coûts
  export async function getCostGuideEntries(guideId: string): Promise<CostGuideEntry[]> {
    try {
      const entriesCollection = collection(db, 'cost_guides', guideId, 'entries');
      const q = query(entriesCollection);
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
  
  // Ajouter une entrée à un guide de coûts
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
      const docRef = await addDoc(entriesCollection, newEntry);
      return docRef.id;
    } catch (error) {
      console.error(`Erreur lors de l'ajout d'une entrée au guide ${guideId}:`, error);
      throw error;
    }
  }
  
  // Mettre à jour une entrée
  export async function updateCostGuideEntry(guideId: string, entryId: string, entryData: CostGuideEntryFormData, partnerName: string): Promise<void> {
    try {
      const entryRef = doc(db, 'cost_guides', guideId, 'entries', entryId);
      const updatedEntry = {
        ...entryData,
        partnerName,
        unitPrice: typeof entryData.unitPrice === 'string' ? parseFloat(entryData.unitPrice) : entryData.unitPrice,
        updatedAt: new Date().toISOString(),
      };
  
      await updateDoc(entryRef, updatedEntry);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'entrée ${entryId}:`, error);
      throw error;
    }
  }
  
  // Dupliquer une entrée
  export async function duplicateCostGuideEntry(guideId: string, entryId: string): Promise<string> {
    try {
      const entryRef = doc(db, 'cost_guides', guideId, 'entries', entryId);
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
      const docRef = await addDoc(entriesCollection, duplicatedEntry);
      return docRef.id;
    } catch (error) {
      console.error(`Erreur lors de la duplication de l'entrée ${entryId}:`, error);
      throw error;
    }
  }
  
  // Supprimer une entrée
  export async function deleteCostGuideEntry(guideId: string, entryId: string): Promise<void> {
    try {
      const entryRef = doc(db, 'cost_guides', guideId, 'entries', entryId);
      await deleteDoc(entryRef);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'entrée ${entryId}:`, error);
      throw error;
    }
  }
  
  // Mettre à jour plusieurs entrées en même temps (pour l'édition rapide)
  export async function batchUpdateCostGuideEntries(guideId: string, entries: { id: string; updates: Partial<CostGuideEntryFormData> }[]): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const updatePromises = entries.map(async (entry) => {
        const entryRef = doc(db, 'cost_guides', guideId, 'entries', entry.id);
        
        // Convertir unitPrice en nombre si c'est une chaîne
        if (entry.updates.unitPrice && typeof entry.updates.unitPrice === 'string') {
          entry.updates.unitPrice = parseFloat(entry.updates.unitPrice);
        }
        
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