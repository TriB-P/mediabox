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
    writeBatch,
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { Placement, PlacementFormData, GeneratedTaxonomies, TaxonomyValues } from '../types/tactiques';
  import { getTaxonomyById } from './taxonomyService';
  import { Taxonomy } from '../types/taxonomy';
  import { TAXONOMY_VARIABLE_REGEX, getManualVariableNames, getFieldSource, isFormatAllowed } from '../config/taxonomyFields';
  
  interface GeneratedTaxonomyChains {
    PL_Tag_1?: string;
    PL_Tag_2?: string;
    PL_Tag_3?: string;
    PL_Tag_4?: string;
    PL_Plateforme_1?: string;
    PL_Plateforme_2?: string;
    PL_Plateforme_3?: string;
    PL_Plateforme_4?: string;
    PL_MO_1?: string;
    PL_MO_2?: string;
    PL_MO_3?: string;
    PL_MO_4?: string;
  }
  
  interface PlacementFirestoreData extends Omit<PlacementFormData, 'PL_Taxonomy_Values' | 'PL_Generated_Taxonomies'>, GeneratedTaxonomyChains {
    PL_Taxonomy_Values: TaxonomyValues;
    PL_Generated_Taxonomies: GeneratedTaxonomies;
    TAX_Product?: string;
    TAX_Location?: string;
    createdAt: string;
    updatedAt: string;
  }

  // Fonctions utilitaires (inchangées)
  function resolveVariablesInTaxonomy(
    taxonomyStructure: string,
    taxonomyValues: TaxonomyValues,
    campaignData?: any,
    tactiqueData?: any
  ): string {
    if (!taxonomyStructure) return '';
    return taxonomyStructure.replace(TAXONOMY_VARIABLE_REGEX, (match, variableName, format) => {
      const manualValue = taxonomyValues[variableName];
      if (manualValue) {
        if (manualValue.format === 'open' && manualValue.openValue) return manualValue.openValue;
        if (manualValue.value) return manualValue.value;
      }
      if (tactiqueData && tactiqueData[variableName]) return String(tactiqueData[variableName]);
      if (campaignData) {
        const campaignMappings: { [key: string]: string } = {
          'CA_Campaign_Identifier': 'name', 'CA_Year': 'year', 'CA_Division': 'division', 'CA_Quarter': 'quarter'
        };
        const mappedField = campaignMappings[variableName] || variableName;
        if (campaignData[mappedField]) return String(campaignData[mappedField]);
      }
      return match;
    });
  }
  
  function generateTaxonomyChains(
    taxonomy: Taxonomy,
    taxonomyValues: TaxonomyValues,
    campaignData?: any,
    tactiqueData?: any
  ): string[] {
    const levels = [
      taxonomy.NA_Name_Level_1, taxonomy.NA_Name_Level_2, taxonomy.NA_Name_Level_3, taxonomy.NA_Name_Level_4,
    ].filter(Boolean);
    return levels.map(levelStructure => resolveVariablesInTaxonomy(levelStructure, taxonomyValues, campaignData, tactiqueData));
  }
  
  async function generateAllTaxonomyChains(
    formData: PlacementFormData,
    clientId: string,
    campaignData?: any,
    tactiqueData?: any
  ): Promise<GeneratedTaxonomyChains> {
    const chains: GeneratedTaxonomyChains = {};
    const taxonomyValues = formData.PL_Taxonomy_Values || {};

    if (formData.PL_Taxonomy_Tags) {
      const tagTaxonomy = await getTaxonomyById(clientId, formData.PL_Taxonomy_Tags);
      if (tagTaxonomy) {
        const tagChains = generateTaxonomyChains(tagTaxonomy, taxonomyValues, campaignData, tactiqueData);
        [chains.PL_Tag_1, chains.PL_Tag_2, chains.PL_Tag_3, chains.PL_Tag_4] = tagChains;
      }
    }
    if (formData.PL_Taxonomy_Platform) {
        const platformTaxonomy = await getTaxonomyById(clientId, formData.PL_Taxonomy_Platform);
        if (platformTaxonomy) {
          const platformChains = generateTaxonomyChains(platformTaxonomy, taxonomyValues, campaignData, tactiqueData);
          [chains.PL_Plateforme_1, chains.PL_Plateforme_2, chains.PL_Plateforme_3, chains.PL_Plateforme_4] = platformChains;
        }
    }
    if (formData.PL_Taxonomy_MediaOcean) {
        const moTaxonomy = await getTaxonomyById(clientId, formData.PL_Taxonomy_MediaOcean);
        if (moTaxonomy) {
          const moChains = generateTaxonomyChains(moTaxonomy, taxonomyValues, campaignData, tactiqueData);
          [chains.PL_MO_1, chains.PL_MO_2, chains.PL_MO_3, chains.PL_MO_4] = moChains;
        }
    }
    return chains;
  }
  
  /**
   * 🔥 CORRECTION : Assure que les champs optionnels ont une valeur par défaut.
   */
  function prepareDataForFirestore(
    placementData: PlacementFormData,
    taxonomyChains: GeneratedTaxonomyChains,
    isUpdate: boolean = false
  ): Omit<PlacementFirestoreData, 'id'> {
    
    const placementFieldNames = getManualVariableNames();
    const placementFields: any = {};
    
    placementFieldNames.forEach(fieldName => {
      if (fieldName in placementData) {
        placementFields[fieldName] = (placementData as any)[fieldName] || ''; // Assure que ce n'est pas undefined
      }
    });

    const firestoreData = {
      PL_Label: placementData.PL_Label || '',
      PL_Order: placementData.PL_Order || 0,
      PL_TactiqueId: placementData.PL_TactiqueId,
      PL_Taxonomy_Tags: placementData.PL_Taxonomy_Tags || '',
      PL_Taxonomy_Platform: placementData.PL_Taxonomy_Platform || '',
      PL_Taxonomy_MediaOcean: placementData.PL_Taxonomy_MediaOcean || '',
      PL_Taxonomy_Values: placementData.PL_Taxonomy_Values || {},
      PL_Generated_Taxonomies: placementData.PL_Generated_Taxonomies || {},
      ...placementFields,
      ...taxonomyChains,
      updatedAt: new Date().toISOString(),
      ...(!isUpdate && { createdAt: new Date().toISOString() })
    };
    
    return firestoreData;
  }
  
  export async function createPlacement(
    clientId: string, campaignId: string, versionId: string, ongletId: string, sectionId: string, tactiqueId: string,
    placementData: PlacementFormData, campaignData?: any, tactiqueData?: any
  ): Promise<string> {
    const placementsCollection = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements');
    const taxonomyChains = await generateAllTaxonomyChains(placementData, clientId, campaignData, tactiqueData);
    const firestoreData = prepareDataForFirestore(placementData, taxonomyChains, false);
    const docRef = await addDoc(placementsCollection, firestoreData as any); // cast to any to avoid type issue with serverTimestamp
    return docRef.id;
  }
  
  export async function updatePlacement(
    clientId: string, campaignId: string, versionId: string, ongletId: string, sectionId: string, tactiqueId: string, placementId: string,
    placementData: Partial<PlacementFormData>, campaignData?: any, tactiqueData?: any
  ): Promise<void> {
    const placementRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId);
    const existingDoc = await getDoc(placementRef);
    if (!existingDoc.exists()) throw new Error('Placement non trouvé');
    const mergedData = { ...existingDoc.data(), ...placementData } as PlacementFormData;
    const taxonomyChains = await generateAllTaxonomyChains(mergedData, clientId, campaignData, tactiqueData);
    const firestoreData = prepareDataForFirestore(mergedData, taxonomyChains, true);
    await updateDoc(placementRef, firestoreData as any);
  }

  // Fonctions getPlacementsForTactique, deletePlacement, etc. restent inchangées
  // ... (le reste du fichier)
  export async function getPlacementsForTactique(
    clientId: string,
    campaignId: string,
    versionId: string,
    ongletId: string,
    sectionId: string,
    tactiqueId: string
  ): Promise<Placement[]> {
    try {
      console.log('📋 Récupération des placements pour tactique:', tactiqueId);
      
      const placementsRef = collection(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions',
        versionId,
        'onglets',
        ongletId,
        'sections',
        sectionId,
        'tactiques',
        tactiqueId,
        'placements'
      );
      
      const q = query(placementsRef, orderBy('PL_Order', 'asc'));
      const querySnapshot = await getDocs(q);
  
      const placements = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Placement));
      
      console.log(`✅ ${placements.length} placements récupérés`);
      return placements;
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des placements:", error);
      throw error;
    }
  }

  export async function deletePlacement(
    clientId: string,
    campaignId: string,
    versionId: string,
    ongletId: string,
    sectionId: string,
    tactiqueId: string,
    placementId: string
  ): Promise<void> {
    try {
      const creatifsRef = collection(db,'clients',clientId,'campaigns',campaignId,'versions',versionId,'onglets',ongletId,'sections',sectionId,'tactiques',tactiqueId,'placements',placementId,'creatifs');
      const creatifsSnapshot = await getDocs(creatifsRef);
      const batch = writeBatch(db);
      creatifsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      const placementRef = doc(db,'clients',clientId,'campaigns',campaignId,'versions',versionId,'onglets',ongletId,'sections',sectionId,'tactiques',tactiqueId,'placements',placementId);
      batch.delete(placementRef);
      await batch.commit();
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du placement:", error);
      throw error;
    }
  }