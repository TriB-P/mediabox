// app/lib/placementService.ts

import {
    collection,
    doc,
    getDocs,
    getDoc,
    orderBy,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    writeBatch,
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { Placement, PlacementFormData, GeneratedTaxonomies } from '../types/tactiques';
  import { generateFinalTaxonomyString, parseAllTaxonomies, extractUniqueVariables } from './taxonomyParser';
  import { getTaxonomyById } from './taxonomyService';
  import { Taxonomy } from '../types/taxonomy';
  import { useShortcodeFormatter } from '../hooks/useShortcodeFormatter';
  
  /**
   * Génère les chaînes de taxonomie finales pour un placement.
   * @param formData - Les données du formulaire du placement.
   * @param clientId - L'ID du client.
   * @returns Un objet avec les taxonomies générées.
   */
  async function generatePlacementTaxonomies(
    formData: PlacementFormData,
    clientId: string
  ): Promise<GeneratedTaxonomies> {
    const generated: GeneratedTaxonomies = {};
    
    // Fonction pour résoudre les valeurs des variables
    const valueResolver = (variableName: string, format: any): string => {
      // Note: Cette fonction est une simplification pour la sauvegarde.
      // L'implémentation complète utilisera le contexte (campagne, tactique) et le cache.
      const variableValue = formData.PL_Taxonomy_Values?.[variableName];
      if (variableValue) {
        if (variableValue.format === 'open' && variableValue.openValue) {
          return variableValue.openValue;
        }
        // Pour les autres formats, il faudrait une logique plus complexe
        // pour récupérer les shortcodes, ce que nous ferons plus tard.
        // Pour l'instant, on retourne la valeur brute.
        return variableValue.value || `[${variableName}:${format}]`;
      }
      return `[${variableName}:${format}]`;
    };
  
    if (formData.PL_Taxonomy_Tags) {
      const taxo = await getTaxonomyById(clientId, formData.PL_Taxonomy_Tags);
      if (taxo) {
        const fullStructure = [
          taxo.NA_Name_Level_1, taxo.NA_Name_Level_2, taxo.NA_Name_Level_3,
          taxo.NA_Name_Level_4, taxo.NA_Name_Level_5, taxo.NA_Name_Level_6
        ].filter(Boolean).join('|');
        generated.tags = generateFinalTaxonomyString(fullStructure, valueResolver);
      }
    }
  
    // Répéter pour platform et mediaocean
    if (formData.PL_Taxonomy_Platform) {
      const taxo = await getTaxonomyById(clientId, formData.PL_Taxonomy_Platform);
       if (taxo) {
        const fullStructure = [
          taxo.NA_Name_Level_1, taxo.NA_Name_Level_2, taxo.NA_Name_Level_3,
          taxo.NA_Name_Level_4, taxo.NA_Name_Level_5, taxo.NA_Name_Level_6
        ].filter(Boolean).join('|');
        generated.platform = generateFinalTaxonomyString(fullStructure, valueResolver);
      }
    }
  
    if (formData.PL_Taxonomy_MediaOcean) {
      const taxo = await getTaxonomyById(clientId, formData.PL_Taxonomy_MediaOcean);
       if (taxo) {
        const fullStructure = [
          taxo.NA_Name_Level_1, taxo.NA_Name_Level_2, taxo.NA_Name_Level_3,
          taxo.NA_Name_Level_4, taxo.NA_Name_Level_5, taxo.NA_Name_Level_6
        ].filter(Boolean).join('|');
        generated.mediaocean = generateFinalTaxonomyString(fullStructure, valueResolver);
      }
    }
    
    return generated;
  }
  
  
  // Récupérer tous les placements pour une tactique
  export async function getPlacementsForTactique(
    clientId: string,
    campaignId: string,
    tactiqueId: string
  ): Promise<Placement[]> {
    try {
      const placementsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'placements');
      const q = query(placementsRef, where('PL_TactiqueId', '==', tactiqueId), orderBy('PL_Order', 'asc'));
      const querySnapshot = await getDocs(q);
  
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Placement));
    } catch (error) {
      console.error("Erreur lors de la récupération des placements:", error);
      throw error;
    }
  }
  
  // Créer un nouveau placement
  export async function createPlacement(
    clientId: string,
    campaignId: string,
    placementData: PlacementFormData
  ): Promise<string> {
    try {
      const placementsCollection = collection(db, 'clients', clientId, 'campaigns', campaignId, 'placements');
      
      // Générer les taxonomies finales avant de sauvegarder
      const generatedTaxonomies = await generatePlacementTaxonomies(placementData, clientId);
      
      const newPlacement = {
        ...placementData,
        PL_Generated_Taxonomies: generatedTaxonomies,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
  
      const docRef = await addDoc(placementsCollection, newPlacement);
      return docRef.id;
    } catch (error) {
      console.error("Erreur lors de la création du placement:", error);
      throw error;
    }
  }
  
  // Mettre à jour un placement existant
  export async function updatePlacement(
    clientId: string,
    campaignId: string,
    placementId: string,
    placementData: Partial<PlacementFormData>
  ): Promise<void> {
    try {
      const placementRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'placements', placementId);
  
      // Si les valeurs de taxonomie ont changé, on régénère les chaînes
      if (placementData.PL_Taxonomy_Values || placementData.PL_Taxonomy_Tags) {
        const fullData = { ...(await getDoc(placementRef)).data(), ...placementData } as PlacementFormData;
        const generatedTaxonomies = await generatePlacementTaxonomies(fullData, clientId);
        placementData.PL_Generated_Taxonomies = generatedTaxonomies;
      }
      
      await updateDoc(placementRef, {
        ...placementData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du placement:", error);
      throw error;
    }
  }
  
  // Supprimer un placement
  export async function deletePlacement(
    clientId: string,
    campaignId: string,
    placementId: string
  ): Promise<void> {
    try {
      // Ici, il faudra aussi supprimer les créatifs associés
      const creatifsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'creatifs');
      const q = query(creatifsRef, where('CR_PlacementId', '==', placementId));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      const placementRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'placements', placementId);
      batch.delete(placementRef);
      
      await batch.commit();
    } catch (error) {
      console.error("Erreur lors de la suppression du placement:", error);
      throw error;
    }
  }