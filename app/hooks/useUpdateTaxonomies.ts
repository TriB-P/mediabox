// app/hooks/useUpdateTaxonomies.ts - CORRIGÉ

import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  query, 
  writeBatch, 
  DocumentData 
} from 'firebase/firestore';
import { 
  TAXONOMY_VARIABLE_REGEX,
  getManualVariableNames,
  getCreatifVariableNames,
  getFieldSource,
  formatRequiresShortcode,
  isPlacementVariable,
  isCreatifVariable,
  TaxonomyFormat 
} from '../config/taxonomyFields';
import { getTaxonomyById } from '../lib/taxonomyService';

// ==================== TYPES ====================

type ParentType = 'campaign' | 'tactic' | 'placement';

interface ParentData {
  id: string;
  name: string;
  clientId: string; // 🔥 AJOUTÉ: Obligatoire pour naviguer dans la structure Firestore
  campaignId?: string; // Pour tactiques et placements
  [key: string]: any; 
}

interface ResolutionContext {
  clientId: string;
  campaignData: any;
  tactiqueData: any;
  placementData: any;
  caches: {
    shortcodes: Map<string, any>;
    customCodes: Map<string, string | null>;
  };
}

// ==================== FONCTIONS UTILITAIRES TAXONOMIE ====================

async function getShortcode(id: string, cache: Map<string, any>): Promise<any | null> {
  if (cache.has(id)) return cache.get(id);
  try {
    const docRef = doc(db, 'shortcodes', id);
    const docSnap = await getDoc(docRef);
    const data = docSnap.exists() ? docSnap.data() : null;
    cache.set(id, data);
    return data;
  } catch (error) {
    console.error(`Erreur récupération shortcode ${id}:`, error);
    cache.set(id, null);
    return null;
  }
}

async function getCustomCode(clientId: string, shortcodeId: string, cache: Map<string, string | null>): Promise<string | null> {
  const cacheKey = `${clientId}__${shortcodeId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    const q = query(collection(db, 'clients', clientId, 'customCodes'));
    const snapshot = await getDocs(q);
    
    for (const customDoc of snapshot.docs) {
      const customData = customDoc.data();
      if (customData.shortcodeId === shortcodeId) {
        cache.set(cacheKey, customData.customCode || null);
        return customData.customCode || null;
      }
    }
    
    cache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error(`Erreur récupération custom code ${shortcodeId}:`, error);
    cache.set(cacheKey, null);
    return null;
  }
}

function formatShortcodeValue(
  shortcodeData: any,
  customCode: string | null,
  format: TaxonomyFormat
): string {
  if (!shortcodeData) return '';
  
  switch (format) {
    case 'code':
      return shortcodeData.SH_Code || '';
    case 'display_fr':
      return shortcodeData.SH_Display_Name_FR || '';
    case 'display_en':
      return shortcodeData.SH_Display_Name_EN || shortcodeData.SH_Display_Name_FR || '';
    case 'utm':
      return shortcodeData.SH_Default_UTM || shortcodeData.SH_Code || '';
    case 'custom_utm':
      return customCode || shortcodeData.SH_Default_UTM || shortcodeData.SH_Code || '';
    case 'custom_code':
      return customCode || shortcodeData.SH_Code || '';
    default:
      return shortcodeData.SH_Display_Name_FR || '';
  }
}

async function resolveVariable(variableName: string, format: TaxonomyFormat, context: ResolutionContext, isCreatif: boolean = false): Promise<string> {
  const source = getFieldSource(variableName);
  let rawValue: any = null;

  console.log(`🔍 [UpdateTaxonomies] Resolving ${variableName} (source: ${source}, format: ${format}, isCreatif: ${isCreatif})`);

  // 1. Check manual values in taxonomy values first
  if (isCreatif && context.placementData && context.placementData.CR_Taxonomy_Values && context.placementData.CR_Taxonomy_Values[variableName]) {
    const taxonomyValue = context.placementData.CR_Taxonomy_Values[variableName];
    
    if (format === 'open' && taxonomyValue.openValue) {
      rawValue = taxonomyValue.openValue;
    } else if (taxonomyValue.shortcodeId && formatRequiresShortcode(format)) {
      const shortcodeData = await getShortcode(taxonomyValue.shortcodeId, context.caches.shortcodes);
      if (shortcodeData) {
        const customCode = await getCustomCode(context.clientId, taxonomyValue.shortcodeId, context.caches.customCodes);
        return formatShortcodeValue(shortcodeData, customCode, format);
      }
    } else {
      rawValue = taxonomyValue.value;
    }
  } else if (!isCreatif && context.placementData && context.placementData.PL_Taxonomy_Values && context.placementData.PL_Taxonomy_Values[variableName]) {
    const taxonomyValue = context.placementData.PL_Taxonomy_Values[variableName];
    
    if (format === 'open' && taxonomyValue.openValue) {
      rawValue = taxonomyValue.openValue;
    } else if (taxonomyValue.shortcodeId && formatRequiresShortcode(format)) {
      const shortcodeData = await getShortcode(taxonomyValue.shortcodeId, context.caches.shortcodes);
      if (shortcodeData) {
        const customCode = await getCustomCode(context.clientId, taxonomyValue.shortcodeId, context.caches.customCodes);
        return formatShortcodeValue(shortcodeData, customCode, format);
      }
    } else {
      rawValue = taxonomyValue.value;
    }
  } else {
    // Look in the data sources
    if (source === 'campaign' && context.campaignData) {
      rawValue = context.campaignData[variableName];
    } else if (source === 'tactique' && context.tactiqueData) {
      rawValue = context.tactiqueData[variableName];
    } else if (source === 'placement' && context.placementData) {
      rawValue = context.placementData[variableName];
    } else if (source === 'manual') {
      rawValue = context.placementData[variableName];
    }
  }

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    console.log(`❌ [UpdateTaxonomies] No value for ${variableName}`);
    return '';
  }

  // Final formatting if shortcode
  if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
    const shortcodeData = await getShortcode(rawValue, context.caches.shortcodes);
    if (shortcodeData) {
      const customCode = await getCustomCode(context.clientId, rawValue, context.caches.customCodes);
      return formatShortcodeValue(shortcodeData, customCode, format);
    }
  }
  
  return String(rawValue);
}

async function generateLevelString(structure: string, context: ResolutionContext, isCreatif: boolean = false): Promise<string> {
  if (!structure) return '';
  
  const MASTER_REGEX = /(<[^>]*>|\[[^\]]+\])/g;
  const segments = structure.split(MASTER_REGEX).filter(Boolean);
  let finalString = '';

  for (const segment of segments) {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const variableMatch = segment.match(/\[([^:]+):([^\]]+)\]/);
      if (variableMatch) {
        const [, variableName, format] = variableMatch;
        const resolvedValue = await resolveVariable(variableName, format as TaxonomyFormat, context, isCreatif);
        finalString += resolvedValue;
      }
    } else if (segment.startsWith('<') && segment.endsWith('>')) {
      const groupContent = segment.slice(1, -1);
      
      const variablesInGroup = Array.from(groupContent.matchAll(TAXONOMY_VARIABLE_REGEX));
      if (variablesInGroup.length === 0) {
        finalString += groupContent;
        continue;
      }

      const resolvedValues = [];
      for (const match of variablesInGroup) {
        const [, variableName, format] = match;
        const resolved = await resolveVariable(variableName, format as TaxonomyFormat, context, isCreatif);
        if (resolved && !resolved.startsWith('[')) {
          resolvedValues.push(resolved);
        }
      }
      
      if (resolvedValues.length === 0) continue;

      const delimiterMatch = groupContent.match(/\](.*?)\s*\[/);
      const delimiter = delimiterMatch ? delimiterMatch[1] : '';
      finalString += resolvedValues.join(delimiter);
      
    } else {
      finalString += segment;
    }
  }
  
  return finalString;
}

// ==================== FONCTIONS DE RÉGÉNÉRATION ====================

async function regeneratePlacementTaxonomies(
  clientId: string,
  placementData: any,
  campaignData: any,
  tactiqueData: any
): Promise<any> {
  const caches = { shortcodes: new Map(), customCodes: new Map() };
  const context: ResolutionContext = { clientId, campaignData, tactiqueData, placementData, caches };

  const processTaxonomyType = async (taxonomyId: string | undefined): Promise<string[]> => {
    if (!taxonomyId) return ['', '', '', ''];
    
    const taxonomy = await getTaxonomyById(clientId, taxonomyId);
    if (!taxonomy) return ['', '', '', ''];
    
    const levels = [
      taxonomy.NA_Name_Level_1, taxonomy.NA_Name_Level_2, 
      taxonomy.NA_Name_Level_3, taxonomy.NA_Name_Level_4
    ];
    
    return Promise.all(levels.map(level => generateLevelString(level || '', context, false)));
  };

  const [tagChains, platformChains, moChains] = await Promise.all([
    processTaxonomyType(placementData.PL_Taxonomy_Tags),
    processTaxonomyType(placementData.PL_Taxonomy_Platform),
    processTaxonomyType(placementData.PL_Taxonomy_MediaOcean)
  ]);

  return {
    PL_Tag_1: tagChains[0] || '',
    PL_Tag_2: tagChains[1] || '',
    PL_Tag_3: tagChains[2] || '',
    PL_Tag_4: tagChains[3] || '',
    PL_Plateforme_1: platformChains[0] || '',
    PL_Plateforme_2: platformChains[1] || '',
    PL_Plateforme_3: platformChains[2] || '',
    PL_Plateforme_4: platformChains[3] || '',
    PL_MO_1: moChains[0] || '',
    PL_MO_2: moChains[1] || '',
    PL_MO_3: moChains[2] || '',
    PL_MO_4: moChains[3] || '',
    PL_Generated_Taxonomies: {
      tags: tagChains.filter(Boolean).join('|'),
      platform: platformChains.filter(Boolean).join('|'),
      mediaocean: moChains.filter(Boolean).join('|'),
    },
    updatedAt: new Date().toISOString()
  };
}

async function regenerateCreatifTaxonomies(
  clientId: string,
  creatifData: any,
  campaignData: any,
  tactiqueData: any,
  placementData: any
): Promise<any> {
  const caches = { shortcodes: new Map(), customCodes: new Map() };
  const context: ResolutionContext = { clientId, campaignData, tactiqueData, placementData: creatifData, caches };

  const processTaxonomyType = async (taxonomyId: string | undefined): Promise<string[]> => {
    if (!taxonomyId) return ['', ''];
    
    const taxonomy = await getTaxonomyById(clientId, taxonomyId);
    if (!taxonomy) return ['', ''];
    
    const levels = [
      taxonomy.NA_Name_Level_5 || '', 
      taxonomy.NA_Name_Level_6 || ''
    ];
    
    return Promise.all(levels.map(level => generateLevelString(level, context, true)));
  };

  const [tagChains, platformChains, moChains] = await Promise.all([
    processTaxonomyType(creatifData.CR_Taxonomy_Tags),
    processTaxonomyType(creatifData.CR_Taxonomy_Platform),
    processTaxonomyType(creatifData.CR_Taxonomy_MediaOcean)
  ]);

  return {
    CR_Tag_5: tagChains[0] || '',
    CR_Tag_6: tagChains[1] || '',
    CR_Plateforme_5: platformChains[0] || '',
    CR_Plateforme_6: platformChains[1] || '',
    CR_MO_5: moChains[0] || '',
    CR_MO_6: moChains[1] || '',
    CR_Generated_Taxonomies: {
      tags: tagChains.filter(Boolean).join('|'),
      platform: platformChains.filter(Boolean).join('|'),
      mediaocean: moChains.filter(Boolean).join('|'),
    },
    updatedAt: new Date().toISOString()
  };
}

// ==================== HOOK PRINCIPAL ====================

export const useUpdateTaxonomies = () => {
  const updateTaxonomies = async (parentType: ParentType, parentData: ParentData) => {
    console.log(`🔄 [UpdateTaxonomies] === DÉBUT MISE À JOUR TAXONOMIES ===`);
    console.log(`📍 Type: ${parentType}, Données reçues:`, parentData);

    const batch = writeBatch(db);
    let updatedCount = 0;

    try {
      // Récupérer le clientId et les campagnes affectées
      const clientId = parentData.clientId;
      if (!clientId) {
        console.error('❌ ClientId manquant dans parentData:', parentData);
        return;
      }
      
      console.log(`✅ ClientId trouvé: ${clientId}`);
      
      let campaignsToProcess: string[] = [];
      
      if (parentType === 'campaign') {
        campaignsToProcess = [parentData.id];
        console.log(`📋 Mode campagne - ID à traiter: ${parentData.id}`);
      } else {
        // Pour tactique et placement, il faut remonter à la campagne
        if (parentData.campaignId) {
          campaignsToProcess = [parentData.campaignId];
          console.log(`📋 Mode ${parentType} - CampaignId: ${parentData.campaignId}`);
        } else {
          console.error('❌ CampaignId manquant pour tactique/placement:', parentData);
          return;
        }
      }

      for (const campaignId of campaignsToProcess) {
        console.log(`🏛️ [UpdateTaxonomies] === TRAITEMENT CAMPAGNE ${campaignId} ===`);
        
        // Récupérer les données de campagne dans la bonne structure
        const campaignPath = `clients/${clientId}/campaigns/${campaignId}`;
        console.log(`📍 Chemin campagne: ${campaignPath}`);
        
        const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
        const campaignSnap = await getDoc(campaignRef);
        
        if (!campaignSnap.exists()) {
          console.error(`❌ Campagne non trouvée au chemin: ${campaignPath}`);
          
          // Debug: Lister les campagnes disponibles
          console.log(`🔍 Debug: Listage des campagnes disponibles pour client ${clientId}:`);
          try {
            const campaignsRef = collection(db, 'clients', clientId, 'campaigns');
            const campaignsSnap = await getDocs(campaignsRef);
            console.log(`📊 Nombre de campagnes trouvées: ${campaignsSnap.size}`);
            campaignsSnap.forEach(doc => {
              console.log(`  - ${doc.id}: ${doc.data().CA_Name || 'Nom inconnu'}`);
            });
          } catch (debugError) {
            console.error('❌ Erreur lors du debug des campagnes:', debugError);
          }
          continue;
        }
        
        console.log(`✅ Campagne trouvée: ${campaignSnap.data().CA_Name}`);
        const campaignData = { ...campaignSnap.data(), clientId };
        
        // Parcourir toutes les versions
        console.log(`📋 [UpdateTaxonomies] Recherche des versions...`);
        const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions');
        const versionsSnap = await getDocs(versionsRef);
        console.log(`📊 Nombre de versions trouvées: ${versionsSnap.size}`);
        
        if (versionsSnap.size === 0) {
          console.warn(`⚠️ Aucune version trouvée pour la campagne ${campaignId}`);
          continue;
        }
        
        for (const versionDoc of versionsSnap.docs) {
          const versionId = versionDoc.id;
          console.log(`📋 [UpdateTaxonomies] === VERSION ${versionId} ===`);
          
          // Parcourir tous les onglets
          const ongletsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets');
          const ongletsSnap = await getDocs(ongletsRef);
          console.log(`📊 Onglets trouvés: ${ongletsSnap.size}`);
          
          if (ongletsSnap.size === 0) {
            console.warn(`⚠️ Aucun onglet trouvé pour version ${versionId}`);
            continue;
          }
          
          for (const ongletDoc of ongletsSnap.docs) {
            const ongletId = ongletDoc.id;
            console.log(`📂 [UpdateTaxonomies] Onglet: ${ongletId}`);
            
            // Parcourir toutes les sections
            const sectionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections');
            const sectionsSnap = await getDocs(sectionsRef);
            console.log(`📊 Sections trouvées: ${sectionsSnap.size}`);
            
            for (const sectionDoc of sectionsSnap.docs) {
              const sectionId = sectionDoc.id;
              console.log(`🗂️ [UpdateTaxonomies] Section: ${sectionId}`);
              
              // Parcourir toutes les tactiques
              const tactiquesRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques');
              const tactiquesSnap = await getDocs(tactiquesRef);
              console.log(`📊 Tactiques trouvées: ${tactiquesSnap.size}`);
              
              for (const tactiqueDoc of tactiquesSnap.docs) {
                const tactiqueId = tactiqueDoc.id;
                const tactiqueData = tactiqueDoc.data();
                console.log(`🎯 [UpdateTaxonomies] Tactique: ${tactiqueId} - ${tactiqueData.TC_Label || 'Sans nom'}`);
                
                // Traiter les placements de cette tactique
                const placementsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements');
                const placementsSnap = await getDocs(placementsRef);
                console.log(`📊 Placements trouvés: ${placementsSnap.size}`);
                
                for (const placementDoc of placementsSnap.docs) {
                  const placementId = placementDoc.id;
                  const placementData = placementDoc.data();
                  console.log(`🏢 [UpdateTaxonomies] Placement: ${placementId} - ${placementData.PL_Label || 'Sans nom'}`);
                  
                  // Vérifier si on doit mettre à jour ce placement
                  let shouldUpdatePlacement = false;
                  
                  if (parentType === 'campaign') {
                    shouldUpdatePlacement = true;
                  } else if (parentType === 'tactic' && tactiqueId === parentData.id) {
                    shouldUpdatePlacement = true;
                  } else if (parentType === 'placement' && placementId === parentData.id) {
                    shouldUpdatePlacement = true;
                  }
                  
                  console.log(`🤔 Doit mettre à jour placement? ${shouldUpdatePlacement}`);
                  
                  if (shouldUpdatePlacement) {
                    console.log(`🔄 [UpdateTaxonomies] MISE À JOUR PLACEMENT: ${placementId}`);
                    
                    try {
                      const updatedPlacementFields = await regeneratePlacementTaxonomies(
                        clientId,
                        placementData,
                        campaignData,
                        tactiqueData
                      );
                      
                      const placementRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId);
                      batch.update(placementRef, updatedPlacementFields);
                      updatedCount++;
                      console.log(`✅ Placement ${placementId} ajouté au batch`);
                      
                    } catch (error) {
                      console.error(`❌ Erreur placement ${placementId}:`, error);
                    }
                  }
                  
                  // Traiter les créatifs de ce placement
                  const creatifsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId, 'creatifs');
                  const creatifsSnap = await getDocs(creatifsRef);
                  console.log(`📊 Créatifs trouvés: ${creatifsSnap.size}`);
                  
                  for (const creatifDoc of creatifsSnap.docs) {
                    const creatifId = creatifDoc.id;
                    const creatifData = creatifDoc.data();
                    console.log(`🎨 [UpdateTaxonomies] Créatif: ${creatifId} - ${creatifData.CR_Label || 'Sans nom'}`);
                    
                    // Vérifier si on doit mettre à jour ce créatif
                    let shouldUpdateCreatif = false;
                    
                    if (parentType === 'campaign') {
                      shouldUpdateCreatif = true;
                    } else if (parentType === 'tactic' && tactiqueId === parentData.id) {
                      shouldUpdateCreatif = true;
                    } else if (parentType === 'placement' && placementId === parentData.id) {
                      shouldUpdateCreatif = true;
                    }
                    
                    console.log(`🤔 Doit mettre à jour créatif? ${shouldUpdateCreatif}`);
                    
                    if (shouldUpdateCreatif) {
                      console.log(`🔄 [UpdateTaxonomies] MISE À JOUR CRÉATIF: ${creatifId}`);
                      
                      try {
                        const updatedCreatifFields = await regenerateCreatifTaxonomies(
                          clientId,
                          creatifData,
                          campaignData,
                          tactiqueData,
                          placementData
                        );
                        
                        const creatifRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId, 'creatifs', creatifId);
                        batch.update(creatifRef, updatedCreatifFields);
                        updatedCount++;
                        console.log(`✅ Créatif ${creatifId} ajouté au batch`);
                        
                      } catch (error) {
                        console.error(`❌ Erreur créatif ${creatifId}:`, error);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Exécuter toutes les mises à jour
      if (updatedCount > 0) {
        await batch.commit();
        console.log(`✅ [UpdateTaxonomies] ${updatedCount} éléments mis à jour avec succès !`);
      } else {
        console.log(`ℹ️ [UpdateTaxonomies] Aucun élément à mettre à jour`);
      }
      
    } catch (error) {
      console.error('❌ [UpdateTaxonomies] Erreur lors de la mise à jour:', error);
      throw new Error('La mise à jour des taxonomies a échoué.');
    }
    
    console.log(`🔄 [UpdateTaxonomies] === FIN MISE À JOUR TAXONOMIES ===`);
  };

  return { updateTaxonomies };
};