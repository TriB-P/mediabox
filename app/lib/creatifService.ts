// app/lib/creatifService.ts - CORRECTION RÉSOLUTION VARIABLES PLACEMENT

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
    where
} from 'firebase/firestore';
import { db } from './firebase';
import { Creatif, CreatifFormData, GeneratedTaxonomies, TaxonomyValues } from '../types/tactiques';
import { getTaxonomyById } from './taxonomyService';
import { Taxonomy } from '../types/taxonomy';
import { 
    TAXONOMY_VARIABLE_REGEX,
    getCreatifVariableNames, 
    getFieldSource,
    formatRequiresShortcode,
    isPlacementVariable,
    isCreatifVariable,
    TaxonomyFormat 
} from '../config/taxonomyFields';

// ==================== LOGIQUE DE RÉSOLUTION DE TAXONOMIE NIVEAUX 5-6 CORRIGÉE ====================

interface ResolutionContext {
    clientId: string;
    campaignData: any;
    tactiqueData: any;
    placementData: any;
    creatifData: any;
    caches: {
        shortcodes: Map<string, any>;
        customCodes: Map<string, string | null>;
    };
}

async function getShortcode(id: string, cache: Map<string, any>): Promise<any | null> {
    if (cache.has(id)) return cache.get(id);
    const docRef = doc(db, 'shortcodes', id);
    const docSnap = await getDoc(docRef);
    const data = docSnap.exists() ? docSnap.data() : null;
    cache.set(id, data);
    return data;
}

async function getCustomCode(clientId: string, shortcodeId: string, cache: Map<string, string | null>): Promise<string | null> {
    const cacheKey = `${clientId}__${shortcodeId}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey)!;

    const q = query(collection(db, 'clients', clientId, 'customCodes'), where('shortcodeId', '==', shortcodeId));
    const snapshot = await getDocs(q);
    const data = snapshot.empty ? null : snapshot.docs[0].data().customCode;
    cache.set(cacheKey, data);
    return data;
}

function formatShortcodeValue(
  shortcodeData: any,
  customCode: string | null,
  format: TaxonomyFormat
): string {
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

// 🔥 CORRECTION: Fonction de résolution alignée avec useTaxonomyForm.ts
async function resolveVariable(variableName: string, format: TaxonomyFormat, context: ResolutionContext): Promise<string> {
    const source = getFieldSource(variableName);
    let rawValue: any = null;

    console.log(`🔍 [CreatifService] === RÉSOLUTION VARIABLE ${variableName} ===`);
    console.log(`🎯 Source détectée: ${source}, Format: ${format}`);

    // 1. 🔥 CORRECTION: Vérifier d'abord les valeurs manuelles dans CR_Taxonomy_Values
    const manualValue = context.creatifData.CR_Taxonomy_Values?.[variableName];
    if (manualValue) {
        console.log(`✅ [CreatifService] Valeur manuelle trouvée dans CR_Taxonomy_Values:`, manualValue);
        if (manualValue.format === 'open') return manualValue.openValue || '';
        if (manualValue.shortcodeId) {
            const shortcodeData = await getShortcode(manualValue.shortcodeId, context.caches.shortcodes);
            if (shortcodeData) {
                const customCode = await getCustomCode(context.clientId, manualValue.shortcodeId, context.caches.customCodes);
                const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
                console.log(`🔧 [CreatifService] Valeur formatée depuis shortcode manuel:`, formattedValue);
                return formattedValue;
            }
        }
        return manualValue.value || '';
    }

    // 2. 🔥 NOUVEAU: Résolution selon la source avec correction pour les placements
    if (source === 'campaign' && context.campaignData) {
        rawValue = context.campaignData[variableName];
        console.log(`🏛️ [CreatifService] Valeur campagne[${variableName}]:`, rawValue);
    } else if (source === 'tactique' && context.tactiqueData) {
        rawValue = context.tactiqueData[variableName];
        console.log(`🎯 [CreatifService] Valeur tactique[${variableName}]:`, rawValue);
    } else if (source === 'placement' && context.placementData) {
        // 🔥 CORRECTION PRINCIPALE: Pour les variables de placement, chercher dans PL_Taxonomy_Values
        if (isPlacementVariable(variableName) && context.placementData.PL_Taxonomy_Values && context.placementData.PL_Taxonomy_Values[variableName]) {
            const taxonomyValue = context.placementData.PL_Taxonomy_Values[variableName];
            console.log(`🏢 [CreatifService] Variable placement trouvée dans PL_Taxonomy_Values[${variableName}]:`, taxonomyValue);
            
            // Extraire la valeur selon le format demandé
            if (format === 'open' && taxonomyValue.openValue) {
                rawValue = taxonomyValue.openValue;
            } else if (taxonomyValue.shortcodeId && formatRequiresShortcode(format)) {
                const shortcodeData = await getShortcode(taxonomyValue.shortcodeId, context.caches.shortcodes);
                if (shortcodeData) {
                    const customCode = await getCustomCode(context.clientId, taxonomyValue.shortcodeId, context.caches.customCodes);
                    const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
                    console.log(`🔧 [CreatifService] Variable placement formatée depuis shortcode:`, formattedValue);
                    return formattedValue; // Retour direct car déjà formaté
                }
            } else {
                rawValue = taxonomyValue.value;
            }
            console.log(`✅ [CreatifService] Valeur placement extraite:`, rawValue);
        } else {
            // Fallback: chercher directement dans l'objet placement
            rawValue = context.placementData[variableName];
            console.log(`🏢 [CreatifService] Valeur placement directe[${variableName}]:`, rawValue);
        }
    } else if (source === 'manual' && isCreatifVariable(variableName)) {
        // Variables créatifs manuelles directement sur l'objet créatif
        rawValue = context.creatifData[variableName];
        console.log(`🎨 [CreatifService] Variable créatif manuelle directe[${variableName}]:`, rawValue);
    }

    if (rawValue === null || rawValue === undefined || rawValue === '') {
        console.log(`❌ [CreatifService] Aucune valeur trouvée pour ${variableName}`);
        console.log(`🔍 [CreatifService] === FIN RÉSOLUTION ${variableName} ===`);
        return '';
    }

    // 3. Formatage de la valeur (seulement si pas déjà formaté)
    if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
        const shortcodeData = await getShortcode(rawValue, context.caches.shortcodes);
        if (shortcodeData) {
            const customCode = await getCustomCode(context.clientId, rawValue, context.caches.customCodes);
            const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
            console.log(`🔧 [CreatifService] Formatage final (shortcode):`, formattedValue);
            console.log(`🔍 [CreatifService] === FIN RÉSOLUTION ${variableName} ===`);
            return formattedValue;
        }
    }
    
    const finalValue = String(rawValue);
    console.log(`✅ [CreatifService] Valeur finale pour ${variableName}:`, finalValue);
    console.log(`🔍 [CreatifService] === FIN RÉSOLUTION ${variableName} ===`);
    return finalValue;
}

async function generateLevelString(structure: string, context: ResolutionContext): Promise<string> {
    if (!structure) return '';
    
    console.log(`🔄 [CreatifService] Generating level: "${structure}"`);
    
    const MASTER_REGEX = /(<[^>]*>|\[[^\]]+\])/g;
    const segments = structure.split(MASTER_REGEX).filter(Boolean);
    let finalString = '';

    for (const segment of segments) {
        if (segment.startsWith('[') && segment.endsWith(']')) {
            const variableMatch = segment.match(/\[([^:]+):([^\]]+)\]/);
            if (variableMatch) {
                const [, variableName, format] = variableMatch;
                const resolvedValue = await resolveVariable(variableName, format as TaxonomyFormat, context);
                finalString += resolvedValue;
                console.log(`🔧 [CreatifService] ${variableName}:${format} -> "${resolvedValue}"`);
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
                const resolved = await resolveVariable(variableName, format as TaxonomyFormat, context);
                if (resolved && !resolved.startsWith('[')) {
                    resolvedValues.push(resolved);
                }
            }
            
            if (resolvedValues.length === 0) {
                continue;
            }

            const delimiterMatch = groupContent.match(/\](.*?)\s*\[/);
            const delimiter = delimiterMatch ? delimiterMatch[1] : '';
            finalString += resolvedValues.join(delimiter);
            
        } else {
            finalString += segment;
        }
    }
    
    console.log(`✅ [CreatifService] Level generated: "${finalString}"`);
    return finalString;
}

async function prepareDataForFirestore(
  creatifData: CreatifFormData,
  clientId: string,
  campaignData: any,
  tactiqueData: any,
  placementData: any,
  isUpdate: boolean = false
): Promise<any> {
    
    console.log(`🔄 [CreatifService] === START CREATIVE DATA PREPARATION ===`);
    console.log(`🎨 CreatifData received:`, creatifData);
    console.log(`🏛️ CampaignData received:`, campaignData || 'undefined');
    console.log(`🎯 TactiqueData received:`, tactiqueData || 'undefined');
    console.log(`🏢 PlacementData received:`, placementData || 'undefined');
    
    // 🔥 DEBUG: Vérifications spécifiques pour les données de placement
    console.log(`🔍 [CreatifService] VÉRIFICATIONS PLACEMENT:`);
    if (placementData) {
        console.log(`  - PlacementData keys: ${Object.keys(placementData).join(', ')}`);
        console.log(`  - PL_Label: ${placementData.PL_Label || 'undefined'}`);
        console.log(`  - PL_Taxonomy_Values défini: ${!!placementData.PL_Taxonomy_Values}`);
        if (placementData.PL_Taxonomy_Values) {
            console.log(`  - Variables TAX_ dans PL_Taxonomy_Values: ${Object.keys(placementData.PL_Taxonomy_Values).filter(k => k.startsWith('TAX_')).join(', ')}`);
            
            // Montrer le contenu des variables TAX_ importantes
            ['TAX_Product', 'TAX_Audience_Demographics', 'TAX_Location', 'TAX_Device', 'TAX_Targeting'].forEach(varName => {
                if (placementData.PL_Taxonomy_Values[varName]) {
                    console.log(`    - ${varName}:`, placementData.PL_Taxonomy_Values[varName]);
                }
            });
        }
    }
    
    const caches = { shortcodes: new Map(), customCodes: new Map() };
    const context: ResolutionContext = { clientId, campaignData, tactiqueData, placementData, creatifData, caches };

    // Process taxonomy LEVELS 5-6 (instead of 1-4)
    const processTaxonomyType = async (taxonomyId: string | undefined): Promise<string[]> => {
        if (!taxonomyId) return ['', ''];
        console.log(`📋 [CreatifService] Creative taxonomy processing: ${taxonomyId}`);
        
        const taxonomy = await getTaxonomyById(clientId, taxonomyId);
        if (!taxonomy) return ['', ''];
        
        // LEVELS 5-6 for creatives
        const levels = [
            taxonomy.NA_Name_Level_5 || '', 
            taxonomy.NA_Name_Level_6 || ''
        ];
        
        console.log(`📐 [CreatifService] Level 5-6 structures:`, levels);
        
        return Promise.all(levels.map(level => generateLevelString(level, context)));
    };

    const [tagChains, platformChains, moChains] = await Promise.all([
      processTaxonomyType(creatifData.CR_Taxonomy_Tags),
      processTaxonomyType(creatifData.CR_Taxonomy_Platform),
      processTaxonomyType(creatifData.CR_Taxonomy_MediaOcean)
    ]);
    
    console.log(`🏷️ [CreatifService] Generated creative chains:`);
    console.log(`  Tags (5-6):`, tagChains);
    console.log(`  Platform (5-6):`, platformChains);
    console.log(`  MediaOcean (5-6):`, moChains);
    
    // Creative taxonomy chains (levels 5-6)
    const taxonomyChains = {
      CR_Tag_5: tagChains[0], 
      CR_Tag_6: tagChains[1],
      CR_Plateforme_5: platformChains[0], 
      CR_Plateforme_6: platformChains[1],
      CR_MO_5: moChains[0], 
      CR_MO_6: moChains[1],
    };

    // Specific creative fields
    const creatifFieldNames = getCreatifVariableNames();
    const creatifFields: any = {};
    creatifFieldNames.forEach(fieldName => {
        if (fieldName in creatifData) {
            creatifFields[fieldName] = (creatifData as any)[fieldName] || '';
        }
    });

    const firestoreData = {
        CR_Label: creatifData.CR_Label || '',
        CR_Order: creatifData.CR_Order || 0,
        CR_PlacementId: creatifData.CR_PlacementId,
        CR_Taxonomy_Tags: creatifData.CR_Taxonomy_Tags || '',
        CR_Taxonomy_Platform: creatifData.CR_Taxonomy_Platform || '',
        CR_Taxonomy_MediaOcean: creatifData.CR_Taxonomy_MediaOcean || '',
        CR_Taxonomy_Values: creatifData.CR_Taxonomy_Values || {},
        CR_Generated_Taxonomies: {
            tags: tagChains.filter(Boolean).join('|'),
            platform: platformChains.filter(Boolean).join('|'),
            mediaocean: moChains.filter(Boolean).join('|'),
        },
        ...creatifFields,
        ...taxonomyChains,
        updatedAt: new Date().toISOString(),
        ...(!isUpdate && { createdAt: new Date().toISOString() })
    };
    
    // Clean up undefined values
    Object.keys(firestoreData).forEach(key => {
        if ((firestoreData as any)[key] === undefined) {
            (firestoreData as any)[key] = '';
        }
    });

    console.log(`✅ [CreatifService] Final data for Firestore:`, firestoreData);
    console.log(`🏷️ [CreatifService] Chaînes taxonomiques finales sauvegardées:`);
    console.log(`  CR_Tag_5: "${firestoreData.CR_Tag_5}"`);
    console.log(`  CR_Tag_6: "${firestoreData.CR_Tag_6}"`);
    console.log(`  CR_Plateforme_5: "${firestoreData.CR_Plateforme_5}"`);
    console.log(`  CR_Plateforme_6: "${firestoreData.CR_Plateforme_6}"`);
    console.log(`  CR_MO_5: "${firestoreData.CR_MO_5}"`);
    console.log(`  CR_MO_6: "${firestoreData.CR_MO_6}"`);
    console.log(`🔄 [CreatifService] === END CREATIVE DATA PREPARATION ===`);
    return firestoreData;
}

// ==================== CRUD FUNCTIONS (INCHANGÉES) ====================

export async function createCreatif(
  clientId: string, campaignId: string, versionId: string, ongletId: string, 
  sectionId: string, tactiqueId: string, placementId: string,
  creatifData: CreatifFormData, 
  campaignData?: any, tactiqueData?: any, placementData?: any
): Promise<string> {
  
  // 🔥 DEBUG: Log input parameters
  console.log(`🚀 [CreatifService] === CREATING CREATIVE ===`);
  console.log(`📍 Parameters:`, { clientId, campaignId, versionId, ongletId, sectionId, tactiqueId, placementId });
  console.log(`🎨 CreatifData passed:`, creatifData);
  console.log(`🏛️ CampaignData passed:`, campaignData || 'undefined');
  console.log(`🎯 TactiqueData passed:`, tactiqueData || 'undefined');
  console.log(`🏢 PlacementData passed:`, placementData || 'undefined');
  
  const creatifsCollection = collection(
    db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 
    'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 
    'placements', placementId, 'creatifs'
  );
  
  const firestoreData = await prepareDataForFirestore(
    creatifData, clientId, campaignData, tactiqueData, placementData, false
  );
  
  const docRef = await addDoc(creatifsCollection, firestoreData);
  
  console.log(`✅ [CreatifService] Creative created with ID: ${docRef.id}`);
  return docRef.id;
}

export async function updateCreatif(
  clientId: string, campaignId: string, versionId: string, ongletId: string,
  sectionId: string, tactiqueId: string, placementId: string, creatifId: string,
  creatifData: Partial<CreatifFormData>, 
  campaignData?: any, tactiqueData?: any, placementData?: any
): Promise<void> {
  
  // 🔥 DEBUG: Log input parameters
  console.log(`🔄 [CreatifService] === UPDATING CREATIVE ===`);
  console.log(`📍 Parameters:`, { clientId, campaignId, versionId, ongletId, sectionId, tactiqueId, placementId, creatifId });
  console.log(`🎨 CreatifData passed:`, creatifData);
  console.log(`🏛️ CampaignData passed:`, campaignData || 'undefined');
  console.log(`🎯 TactiqueData passed:`, tactiqueData || 'undefined');
  console.log(`🏢 PlacementData passed:`, placementData || 'undefined');
  
  const creatifRef = doc(
    db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 
    'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 
    'placements', placementId, 'creatifs', creatifId
  );
  
  const existingDoc = await getDoc(creatifRef);
  if (!existingDoc.exists()) throw new Error('Creative not found');
  
  const mergedData = { ...existingDoc.data(), ...creatifData } as CreatifFormData;
  const firestoreData = await prepareDataForFirestore(
    mergedData, clientId, campaignData, tactiqueData, placementData, true
  );
  
  await updateDoc(creatifRef, firestoreData);
  
  console.log(`✅ [CreatifService] Creative updated: ${creatifId}`);
}

export async function getCreatifsForPlacement(
    clientId: string, campaignId: string, versionId: string, ongletId: string,
    sectionId: string, tactiqueId: string, placementId: string
): Promise<Creatif[]> {
    try {
        const creatifsRef = collection(
            db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 
            'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 
            'placements', placementId, 'creatifs'
        );
        
        const q = query(creatifsRef, orderBy('CR_Order', 'asc'));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creatif));
    } catch (error) {
        console.error("Erreur lors de la récupération des créatifs:", error);
        throw error;
    }
}

export async function deleteCreatif(
    clientId: string, campaignId: string, versionId: string, ongletId: string,
    sectionId: string, tactiqueId: string, placementId: string, creatifId: string
): Promise<void> {
    try {
        const creatifRef = doc(
            db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 
            'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 
            'placements', placementId, 'creatifs', creatifId
        );
        
        await deleteDoc(creatifRef);
        
        console.log(`✅ [CreatifService] Creative deleted: ${creatifId}`);
    } catch (error) {
        console.error("Erreur lors de la suppression du créatif:", error);
        throw error;
    }
}