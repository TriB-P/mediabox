// app/hooks/useUpdateTaxonomies.ts - CORRECTION RÉSOLUTION VARIABLES PLACEMENT

import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  writeBatch, 
  query,
  where
} from 'firebase/firestore';
import { getTaxonomyById } from '../lib/taxonomyService';
import { 
  TAXONOMY_VARIABLE_REGEX,
  getFieldSource,
  formatRequiresShortcode,
  isPlacementVariable,
  isCreatifVariable,
  TaxonomyFormat 
} from '../config/taxonomyFields';

// ==================== TYPES ====================

type ParentType = 'campaign' | 'tactic' | 'placement';

interface ParentData {
  id: string;
  name: string;
  clientId: string;
  campaignId?: string;
  [key: string]: any; 
}

// 🔥 CORRECTION: Contexte enrichi pour les créatifs
interface ResolutionContext {
  clientId: string;
  campaignData: any;
  tactiqueData: any;
  placementData: any;
  creatifData?: any; // 🔥 NOUVEAU: Ajout des données créatif séparées
  caches: {
    shortcodes: Map<string, any>;
    customCodes: Map<string, string | null>;
  };
}

// ==================== FONCTIONS UTILITAIRES ====================

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
    const q = query(collection(db, 'clients', clientId, 'customCodes'), where('shortcodeId', '==', shortcodeId));
    const snapshot = await getDocs(q);
    const data = snapshot.empty ? null : snapshot.docs[0].data().customCode;
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Erreur récupération custom code ${shortcodeId}:`, error);
    cache.set(cacheKey, null);
    return null;
  }
}

function formatShortcodeValue(shortcodeData: any, customCode: string | null, format: TaxonomyFormat): string {
  if (!shortcodeData) return '';
  
  switch (format) {
    case 'code': return shortcodeData.SH_Code || '';
    case 'display_fr': return shortcodeData.SH_Display_Name_FR || '';
    case 'display_en': return shortcodeData.SH_Display_Name_EN || shortcodeData.SH_Display_Name_FR || '';
    case 'utm': return shortcodeData.SH_Default_UTM || shortcodeData.SH_Code || '';
    case 'custom_utm': return customCode || shortcodeData.SH_Default_UTM || shortcodeData.SH_Code || '';
    case 'custom_code': return customCode || shortcodeData.SH_Code || '';
    default: return shortcodeData.SH_Display_Name_FR || '';
  }
}

// 🔥 CORRECTION: Fonction de résolution corrigée et alignée avec creatifService.ts
async function resolveVariable(variableName: string, format: TaxonomyFormat, context: ResolutionContext, isCreatif: boolean = false): Promise<string> {
  const source = getFieldSource(variableName);
  let rawValue: any = null;

  console.log(`🔍 [UpdateTaxonomies] === RÉSOLUTION VARIABLE ${variableName} ===`);
  console.log(`🎯 Source détectée: ${source}, Format: ${format}, IsCreatif: ${isCreatif}`);

  // 1. 🔥 CORRECTION: Vérifier d'abord les valeurs manuelles selon le type
  if (isCreatif) {
    // Pour les créatifs, chercher dans CR_Taxonomy_Values du créatif
    const manualValue = context.creatifData?.CR_Taxonomy_Values?.[variableName];
    if (manualValue) {
      console.log(`✅ [UpdateTaxonomies] Valeur manuelle créatif trouvée:`, manualValue);
      if (manualValue.format === 'open') return manualValue.openValue || '';
      if (manualValue.shortcodeId) {
        const shortcodeData = await getShortcode(manualValue.shortcodeId, context.caches.shortcodes);
        if (shortcodeData) {
          const customCode = await getCustomCode(context.clientId, manualValue.shortcodeId, context.caches.customCodes);
          const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
          console.log(`🔧 [UpdateTaxonomies] Valeur créatif formatée depuis shortcode:`, formattedValue);
          return formattedValue;
        }
      }
      return manualValue.value || '';
    }
  } else {
    // Pour les placements, chercher dans PL_Taxonomy_Values
    const manualValue = context.placementData.PL_Taxonomy_Values?.[variableName];
    if (manualValue) {
      console.log(`✅ [UpdateTaxonomies] Valeur manuelle placement trouvée:`, manualValue);
      if (manualValue.format === 'open') return manualValue.openValue || '';
      if (manualValue.shortcodeId) {
        const shortcodeData = await getShortcode(manualValue.shortcodeId, context.caches.shortcodes);
        if (shortcodeData) {
          const customCode = await getCustomCode(context.clientId, manualValue.shortcodeId, context.caches.customCodes);
          const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
          console.log(`🔧 [UpdateTaxonomies] Valeur placement formatée depuis shortcode:`, formattedValue);
          return formattedValue;
        }
      }
      return manualValue.value || '';
    }
  }

  // 2. 🔥 CORRECTION: Résolution selon la source avec logique corrigée pour les placements
  if (source === 'campaign' && context.campaignData) {
    rawValue = context.campaignData[variableName];
    console.log(`🏛️ [UpdateTaxonomies] Valeur campagne[${variableName}]:`, rawValue);
  } else if (source === 'tactique' && context.tactiqueData) {
    rawValue = context.tactiqueData[variableName];
    console.log(`🎯 [UpdateTaxonomies] Valeur tactique[${variableName}]:`, rawValue);
  } else if (source === 'placement' && context.placementData) {
    // 🔥 CORRECTION: Pour les variables de placement, chercher dans PL_Taxonomy_Values
    if (isPlacementVariable(variableName) && context.placementData.PL_Taxonomy_Values && context.placementData.PL_Taxonomy_Values[variableName]) {
      const taxonomyValue = context.placementData.PL_Taxonomy_Values[variableName];
      console.log(`🏢 [UpdateTaxonomies] Variable placement trouvée dans PL_Taxonomy_Values[${variableName}]:`, taxonomyValue);
      
      // Extraire la valeur selon le format demandé
      if (format === 'open' && taxonomyValue.openValue) {
        rawValue = taxonomyValue.openValue;
      } else if (taxonomyValue.shortcodeId && formatRequiresShortcode(format)) {
        const shortcodeData = await getShortcode(taxonomyValue.shortcodeId, context.caches.shortcodes);
        if (shortcodeData) {
          const customCode = await getCustomCode(context.clientId, taxonomyValue.shortcodeId, context.caches.customCodes);
          const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
          console.log(`🔧 [UpdateTaxonomies] Variable placement formatée depuis shortcode:`, formattedValue);
          return formattedValue; // Retour direct car déjà formaté
        }
      } else {
        rawValue = taxonomyValue.value;
      }
      console.log(`✅ [UpdateTaxonomies] Valeur placement extraite:`, rawValue);
    } else {
      // Fallback: chercher directement dans l'objet placement
      rawValue = context.placementData[variableName];
      console.log(`🏢 [UpdateTaxonomies] Valeur placement directe[${variableName}]:`, rawValue);
    }
  } else if (source === 'manual') {
    if (isCreatif && isCreatifVariable(variableName) && context.creatifData) {
      // Variables créatifs manuelles directement sur l'objet créatif
      rawValue = context.creatifData[variableName];
      console.log(`🎨 [UpdateTaxonomies] Variable créatif manuelle directe[${variableName}]:`, rawValue);
    } else {
      // Variables manuelles générales
      rawValue = context.placementData[variableName];
      console.log(`📝 [UpdateTaxonomies] Variable manuelle générale[${variableName}]:`, rawValue);
    }
  }

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    console.log(`❌ [UpdateTaxonomies] Aucune valeur trouvée pour ${variableName}`);
    console.log(`🔍 [UpdateTaxonomies] === FIN RÉSOLUTION ${variableName} ===`);
    return '';
  }

  // 3. Formatage final si shortcode (seulement si pas déjà formaté)
  if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
    const shortcodeData = await getShortcode(rawValue, context.caches.shortcodes);
    if (shortcodeData) {
      const customCode = await getCustomCode(context.clientId, rawValue, context.caches.customCodes);
      const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
      console.log(`🔧 [UpdateTaxonomies] Formatage final (shortcode):`, formattedValue);
      console.log(`🔍 [UpdateTaxonomies] === FIN RÉSOLUTION ${variableName} ===`);
      return formattedValue;
    }
  }
  
  const finalValue = String(rawValue);
  console.log(`✅ [UpdateTaxonomies] Valeur finale pour ${variableName}:`, finalValue);
  console.log(`🔍 [UpdateTaxonomies] === FIN RÉSOLUTION ${variableName} ===`);
  return finalValue;
}

async function generateLevelString(structure: string, context: ResolutionContext, isCreatif: boolean = false): Promise<string> {
  if (!structure) return '';
  
  console.log(`🔄 [UpdateTaxonomies] Generating level (isCreatif: ${isCreatif}): "${structure}"`);
  
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
        console.log(`🔧 [UpdateTaxonomies] ${variableName}:${format} -> "${resolvedValue}"`);
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
  
  console.log(`✅ [UpdateTaxonomies] Level generated: "${finalString}"`);
  return finalString;
}

// ==================== FONCTIONS DE RÉGÉNÉRATION ====================

async function regeneratePlacementTaxonomies(clientId: string, placementData: any, campaignData: any, tactiqueData: any): Promise<any> {
  console.log(`🔄 [UpdateTaxonomies] Regenerating placement taxonomies for: ${placementData.PL_Label}`);
  
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

  console.log(`🏷️ [UpdateTaxonomies] Placement chains generated:`, { tagChains, platformChains, moChains });

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

// 🔥 CORRECTION: Fonction corrigée pour les créatifs
async function regenerateCreatifTaxonomies(clientId: string, creatifData: any, campaignData: any, tactiqueData: any, placementData: any): Promise<any> {
  console.log(`🔄 [UpdateTaxonomies] Regenerating creative taxonomies for: ${creatifData.CR_Label}`);
  console.log(`🔍 [UpdateTaxonomies] Creative data:`, creatifData);
  console.log(`🔍 [UpdateTaxonomies] Placement data:`, placementData);
  
  const caches = { shortcodes: new Map(), customCodes: new Map() };
  // 🔥 CORRECTION: Contexte correct avec creatifData séparée
  const context: ResolutionContext = { 
    clientId, 
    campaignData, 
    tactiqueData, 
    placementData, // 🔥 GARDER les vraies données placement
    creatifData,   // 🔥 AJOUTER les données créatif séparément
    caches 
  };

  const processTaxonomyType = async (taxonomyId: string | undefined): Promise<string[]> => {
    if (!taxonomyId) return ['', ''];
    
    console.log(`📋 [UpdateTaxonomies] Processing creative taxonomy: ${taxonomyId}`);
    
    const taxonomy = await getTaxonomyById(clientId, taxonomyId);
    if (!taxonomy) return ['', ''];
    
    const levels = [
      taxonomy.NA_Name_Level_5 || '', 
      taxonomy.NA_Name_Level_6 || ''
    ];
    
    console.log(`📐 [UpdateTaxonomies] Creative level 5-6 structures:`, levels);
    
    return Promise.all(levels.map(level => generateLevelString(level, context, true)));
  };

  const [tagChains, platformChains, moChains] = await Promise.all([
    processTaxonomyType(creatifData.CR_Taxonomy_Tags),
    processTaxonomyType(creatifData.CR_Taxonomy_Platform),
    processTaxonomyType(creatifData.CR_Taxonomy_MediaOcean)
  ]);

  console.log(`🏷️ [UpdateTaxonomies] Creative chains generated:`, { tagChains, platformChains, moChains });

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

// ==================== HOOK PRINCIPAL (INCHANGÉ) ====================

export const useUpdateTaxonomies = () => {
  const updateTaxonomies = async (parentType: ParentType, parentData: ParentData) => {
    console.log(`🔄 [UpdateTaxonomies] === DÉBUT MISE À JOUR TAXONOMIES ===`);
    console.log(`📍 Type: ${parentType}, Données reçues:`, parentData);

    const batch = writeBatch(db);
    let updatedCount = 0;

    try {
      const clientId = parentData.clientId;
      if (!clientId) {
        console.error('❌ ClientId manquant');
        return;
      }
      
      let campaignId: string;
      if (parentType === 'campaign') {
        campaignId = parentData.id;
      } else {
        if (parentData.campaignId) {
          campaignId = parentData.campaignId;
        } else {
          console.error('❌ CampaignId manquant');
          return;
        }
      }

      console.log(`🏛️ [UpdateTaxonomies] Traitement campagne: ${campaignId}`);
      
      const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
      const campaignSnap = await getDoc(campaignRef);
      
      if (!campaignSnap.exists()) {
        console.error(`❌ Campagne non trouvée`);
        return;
      }
      
      const campaignSnapData = campaignSnap.data();
      if (!campaignSnapData) {
        console.error(`❌ Données campagne vides`);
        return;
      }
      
      const campaignData = { ...campaignSnapData, clientId };
      console.log(`✅ Campagne trouvée: ${(campaignData as any).CA_Name || 'Sans nom'}`);

      // Navigation et mise à jour
      const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions');
      const versionsSnap = await getDocs(versionsRef);
      console.log(`📊 Versions: ${versionsSnap.size}`);
      
      for (const versionDoc of versionsSnap.docs) {
        const versionId = versionDoc.id;
        
        const ongletsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets');
        const ongletsSnap = await getDocs(ongletsRef);
        
        for (const ongletDoc of ongletsSnap.docs) {
          const ongletId = ongletDoc.id;
          
          const sectionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections');
          const sectionsSnap = await getDocs(sectionsRef);
          
          for (const sectionDoc of sectionsSnap.docs) {
            const sectionId = sectionDoc.id;
            
            const tactiquesRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques');
            const tactiquesSnap = await getDocs(tactiquesRef);
            
            for (const tactiqueDoc of tactiquesSnap.docs) {
              const tactiqueId = tactiqueDoc.id;
              const tactiqueData = tactiqueDoc.data();
              
              const placementsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements');
              const placementsSnap = await getDocs(placementsRef);
              
              for (const placementDoc of placementsSnap.docs) {
                const placementId = placementDoc.id;
                const placementData = placementDoc.data();
                
                // Déterminer si on doit mettre à jour ce placement
                let shouldUpdatePlacement = false;
                if (parentType === 'campaign') {
                  shouldUpdatePlacement = true;
                } else if (parentType === 'tactic' && tactiqueId === parentData.id) {
                  shouldUpdatePlacement = true;
                } else if (parentType === 'placement' && placementId === parentData.id) {
                  shouldUpdatePlacement = true;
                }
                
                if (shouldUpdatePlacement) {
                  console.log(`🔄 Mise à jour placement: ${placementData.PL_Label}`);
                  
                  try {
                    const updatedFields = await regeneratePlacementTaxonomies(clientId, placementData, campaignData, tactiqueData);
                    const placementRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId);
                    batch.update(placementRef, updatedFields);
                    updatedCount++;
                  } catch (error) {
                    console.error(`❌ Erreur placement ${placementId}:`, error);
                  }
                }
                
                // Traiter les créatifs
                const creatifsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId, 'creatifs');
                const creatifsSnap = await getDocs(creatifsRef);
                
                for (const creatifDoc of creatifsSnap.docs) {
                  const creatifId = creatifDoc.id;
                  const creatifData = creatifDoc.data();
                  
                  let shouldUpdateCreatif = false;
                  if (parentType === 'campaign') {
                    shouldUpdateCreatif = true;
                  } else if (parentType === 'tactic' && tactiqueId === parentData.id) {
                    shouldUpdateCreatif = true;
                  } else if (parentType === 'placement' && placementId === parentData.id) {
                    shouldUpdateCreatif = true;
                  }
                  
                  if (shouldUpdateCreatif) {
                    console.log(`🔄 Mise à jour créatif: ${creatifData.CR_Label}`);
                    
                    try {
                      const updatedFields = await regenerateCreatifTaxonomies(clientId, creatifData, campaignData, tactiqueData, placementData);
                      const creatifRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId, 'creatifs', creatifId);
                      batch.update(creatifRef, updatedFields);
                      updatedCount++;
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

      // Exécuter toutes les mises à jour
      if (updatedCount > 0) {
        await batch.commit();
        console.log(`✅ [UpdateTaxonomies] ${updatedCount} éléments mis à jour avec succès !`);
      } else {
        console.log(`ℹ️ [UpdateTaxonomies] Aucun élément à mettre à jour`);
      }
      
    } catch (error) {
      console.error('❌ [UpdateTaxonomies] Erreur:', error);
      throw new Error('La mise à jour des taxonomies a échoué.');
    }
    
    console.log(`🔄 [UpdateTaxonomies] === FIN MISE À JOUR ===`);
  };

  return { updateTaxonomies };
};