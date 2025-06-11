// app/lib/placementService.ts - VERSION COMPLÈTE

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
  import { Placement, PlacementFormData, GeneratedTaxonomies, TaxonomyValues } from '../types/tactiques';
  import { getTaxonomyById } from './taxonomyService';
  import { Taxonomy } from '../types/taxonomy';
  import { TAXONOMY_VARIABLE_REGEX } from '../config/taxonomyFields';
  
  // ==================== INTERFACES POUR LES CHAÎNES TAXONOMIQUES ====================
  
  interface GeneratedTaxonomyChains {
    // Tags
    PL_Tag_1?: string;
    PL_Tag_2?: string;
    PL_Tag_3?: string;
    PL_Tag_4?: string;
    
    // Platform
    PL_Plateforme_1?: string;
    PL_Plateforme_2?: string;
    PL_Plateforme_3?: string;
    PL_Plateforme_4?: string;
    
    // MediaOcean
    PL_MO_1?: string;
    PL_MO_2?: string;
    PL_MO_3?: string;
    PL_MO_4?: string;
  }
  
  interface PlacementFirestoreData extends PlacementFormData, GeneratedTaxonomyChains {
    // Métadonnées
    createdAt: string;
    updatedAt: string;
  }
  
  // ==================== UTILITAIRES DE GÉNÉRATION DES TAXONOMIES ====================
  
  /**
   * Résout les valeurs des variables dans une chaîne taxonomique
   */
  function resolveVariablesInTaxonomy(
    taxonomyStructure: string,
    taxonomyValues: TaxonomyValues,
    campaignData?: any,
    tactiqueData?: any
  ): string {
    console.log('🔧 Résolution des variables dans:', taxonomyStructure);
    
    return taxonomyStructure.replace(TAXONOMY_VARIABLE_REGEX, (match, variableName, format) => {
      console.log(`📝 Résolution de ${variableName}:${format}`);
      
      // 1. Vérifier les valeurs manuelles de placement
      const manualValue = taxonomyValues[variableName];
      if (manualValue) {
        if (manualValue.format === 'open' && manualValue.openValue) {
          console.log(`✅ Valeur manuelle open: ${manualValue.openValue}`);
          return manualValue.openValue;
        }
        if (manualValue.value) {
          console.log(`✅ Valeur manuelle: ${manualValue.value}`);
          return manualValue.value;
        }
      }
      
      // 2. Vérifier les données de tactique
      if (tactiqueData && tactiqueData[variableName]) {
        console.log(`✅ Valeur de tactique: ${tactiqueData[variableName]}`);
        return String(tactiqueData[variableName]);
      }
      
      // 3. Vérifier les données de campagne
      if (campaignData) {
        const campaignMappings: { [key: string]: string } = {
          'CA_Campaign_Identifier': 'name',
          'CA_Year': 'year',
          'CA_Division': 'division',
          'CA_Quarter': 'quarter'
        };
        
        const mappedField = campaignMappings[variableName] || variableName;
        if (campaignData[mappedField]) {
          console.log(`✅ Valeur de campagne: ${campaignData[mappedField]}`);
          return String(campaignData[mappedField]);
        }
      }
      
      // 4. Retourner le placeholder si aucune valeur trouvée
      console.log(`❌ Aucune valeur trouvée pour ${variableName}, retour du placeholder`);
      return match;
    });
  }
  
  /**
   * Génère les chaînes taxonomiques pour chaque niveau d'une taxonomie
   */
  function generateTaxonomyChains(
    taxonomy: Taxonomy,
    taxonomyValues: TaxonomyValues,
    campaignData?: any,
    tactiqueData?: any
  ): string[] {
    const levels = [
      taxonomy.NA_Name_Level_1,
      taxonomy.NA_Name_Level_2,
      taxonomy.NA_Name_Level_3,
      taxonomy.NA_Name_Level_4,
    ].filter(Boolean); // Enlever les niveaux vides
    
    console.log(`🏗️ Génération des chaînes pour ${levels.length} niveaux`);
    
    return levels.map((levelStructure, index) => {
      console.log(`📊 Niveau ${index + 1}:`, levelStructure);
      const resolved = resolveVariablesInTaxonomy(
        levelStructure,
        taxonomyValues,
        campaignData,
        tactiqueData
      );
      console.log(`✅ Résolu:`, resolved);
      return resolved;
    });
  }
  
  /**
   * Génère toutes les chaînes taxonomiques pour un placement
   */
  async function generateAllTaxonomyChains(
    formData: PlacementFormData,
    clientId: string,
    campaignData?: any,
    tactiqueData?: any
  ): Promise<GeneratedTaxonomyChains> {
    console.log('🎯 Début génération des chaînes taxonomiques');
    
    const chains: GeneratedTaxonomyChains = {};
    const taxonomyValues = formData.PL_Taxonomy_Values || {};
    
    // Générer les chaînes pour Tags
    if (formData.PL_Taxonomy_Tags) {
      console.log('🏷️ Génération des chaînes Tags...');
      try {
        const tagTaxonomy = await getTaxonomyById(clientId, formData.PL_Taxonomy_Tags);
        if (tagTaxonomy) {
          const tagChains = generateTaxonomyChains(
            tagTaxonomy,
            taxonomyValues,
            campaignData,
            tactiqueData
          );
          
          chains.PL_Tag_1 = tagChains[0];
          chains.PL_Tag_2 = tagChains[1];
          chains.PL_Tag_3 = tagChains[2];
          chains.PL_Tag_4 = tagChains[3];
          
          console.log('✅ Chaînes Tags générées:', {
            PL_Tag_1: chains.PL_Tag_1,
            PL_Tag_2: chains.PL_Tag_2,
            PL_Tag_3: chains.PL_Tag_3,
            PL_Tag_4: chains.PL_Tag_4,
          });
        }
      } catch (error) {
        console.error('❌ Erreur génération Tags:', error);
      }
    }
    
    // Générer les chaînes pour Platform
    if (formData.PL_Taxonomy_Platform) {
      console.log('🖥️ Génération des chaînes Platform...');
      try {
        const platformTaxonomy = await getTaxonomyById(clientId, formData.PL_Taxonomy_Platform);
        if (platformTaxonomy) {
          const platformChains = generateTaxonomyChains(
            platformTaxonomy,
            taxonomyValues,
            campaignData,
            tactiqueData
          );
          
          chains.PL_Plateforme_1 = platformChains[0];
          chains.PL_Plateforme_2 = platformChains[1];
          chains.PL_Plateforme_3 = platformChains[2];
          chains.PL_Plateforme_4 = platformChains[3];
          
          console.log('✅ Chaînes Platform générées:', {
            PL_Plateforme_1: chains.PL_Plateforme_1,
            PL_Plateforme_2: chains.PL_Plateforme_2,
            PL_Plateforme_3: chains.PL_Plateforme_3,
            PL_Plateforme_4: chains.PL_Plateforme_4,
          });
        }
      } catch (error) {
        console.error('❌ Erreur génération Platform:', error);
      }
    }
    
    // Générer les chaînes pour MediaOcean
    if (formData.PL_Taxonomy_MediaOcean) {
      console.log('🌊 Génération des chaînes MediaOcean...');
      try {
        const moTaxonomy = await getTaxonomyById(clientId, formData.PL_Taxonomy_MediaOcean);
        if (moTaxonomy) {
          const moChains = generateTaxonomyChains(
            moTaxonomy,
            taxonomyValues,
            campaignData,
            tactiqueData
          );
          
          chains.PL_MO_1 = moChains[0];
          chains.PL_MO_2 = moChains[1];
          chains.PL_MO_3 = moChains[2];
          chains.PL_MO_4 = moChains[3];
          
          console.log('✅ Chaînes MediaOcean générées:', {
            PL_MO_1: chains.PL_MO_1,
            PL_MO_2: chains.PL_MO_2,
            PL_MO_3: chains.PL_MO_3,
            PL_MO_4: chains.PL_MO_4,
          });
        }
      } catch (error) {
        console.error('❌ Erreur génération MediaOcean:', error);
      }
    }
    
    console.log('🎯 Fin génération des chaînes taxonomiques');
    return chains;
  }
  
  // ==================== FONCTIONS PRINCIPALES DU SERVICE ====================
  
  /**
   * Récupérer tous les placements pour une tactique
   */
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
  
  /**
   * Créer un nouveau placement
   */
  export async function createPlacement(
    clientId: string,
    campaignId: string,
    versionId: string,
    ongletId: string,
    sectionId: string,
    tactiqueId: string,
    placementData: PlacementFormData,
    campaignData?: any,
    tactiqueData?: any
  ): Promise<string> {
    try {
      console.log('✨ Création d\'un nouveau placement');
      
      const placementsCollection = collection(
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
      
      // Générer les chaînes taxonomiques
      const taxonomyChains = await generateAllTaxonomyChains(
        placementData,
        clientId,
        campaignData,
        tactiqueData
      );
      
      // Préparer les données pour Firestore
      const firestoreData: PlacementFirestoreData = {
        ...placementData,
        ...taxonomyChains,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
  
      console.log('💾 Données à sauvegarder:', firestoreData);
      
      const docRef = await addDoc(placementsCollection, firestoreData);
      
      console.log('✅ Placement créé avec ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Erreur lors de la création du placement:", error);
      throw error;
    }
  }
  
  /**
   * Mettre à jour un placement existant
   */
  export async function updatePlacement(
    clientId: string,
    campaignId: string,
    versionId: string,
    ongletId: string,
    sectionId: string,
    tactiqueId: string,
    placementId: string,
    placementData: Partial<PlacementFormData>,
    campaignData?: any,
    tactiqueData?: any
  ): Promise<void> {
    try {
      console.log('🔄 Mise à jour du placement:', placementId);
      
      const placementRef = doc(
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
        'placements',
        placementId
      );
  
      // Récupérer les données existantes pour la fusion
      const existingDoc = await getDoc(placementRef);
      if (!existingDoc.exists()) {
        throw new Error('Placement non trouvé');
      }
      
      const existingData = existingDoc.data() as PlacementFormData;
      const mergedData = { ...existingData, ...placementData };
      
      // Régénérer les chaînes taxonomiques si nécessaire
      let taxonomyChains: GeneratedTaxonomyChains = {};
      
      if (
        placementData.PL_Taxonomy_Values ||
        placementData.PL_Taxonomy_Tags ||
        placementData.PL_Taxonomy_Platform ||
        placementData.PL_Taxonomy_MediaOcean
      ) {
        console.log('🔧 Régénération des chaînes taxonomiques...');
        taxonomyChains = await generateAllTaxonomyChains(
          mergedData,
          clientId,
          campaignData,
          tactiqueData
        );
      }
      
      // Préparer les données de mise à jour
      const updateData = {
        ...placementData,
        ...taxonomyChains,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('💾 Données de mise à jour:', updateData);
      
      await updateDoc(placementRef, updateData);
      
      console.log('✅ Placement mis à jour avec succès');
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du placement:", error);
      throw error;
    }
  }
  
  /**
   * Supprimer un placement
   */
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
      console.log('🗑️ Suppression du placement:', placementId);
      
      // Supprimer les créatifs associés d'abord
      const creatifsRef = collection(
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
        'placements',
        placementId,
        'creatifs'
      );
      
      const creatifsSnapshot = await getDocs(creatifsRef);
      
      const batch = writeBatch(db);
      creatifsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // Supprimer le placement
      const placementRef = doc(
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
        'placements',
        placementId
      );
      
      batch.delete(placementRef);
      
      await batch.commit();
      
      console.log('✅ Placement et créatifs supprimés avec succès');
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du placement:", error);
      throw error;
    }
  }
  
  /**
   * Récupérer un placement spécifique
   */
  export async function getPlacementById(
    clientId: string,
    campaignId: string,
    versionId: string,
    ongletId: string,
    sectionId: string,
    tactiqueId: string,
    placementId: string
  ): Promise<Placement | null> {
    try {
      console.log('🔍 Récupération du placement:', placementId);
      
      const placementRef = doc(
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
        'placements',
        placementId
      );
      
      const placementSnap = await getDoc(placementRef);
      
      if (!placementSnap.exists()) {
        console.log('❌ Placement non trouvé');
        return null;
      }
      
      const placement = {
        id: placementSnap.id,
        ...placementSnap.data()
      } as Placement;
      
      console.log('✅ Placement récupéré:', placement);
      return placement;
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du placement:", error);
      throw error;
    }
  }