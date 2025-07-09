// app/lib/creatifService.ts

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
    TaxonomyFormat 
} from '../config/taxonomyFields';

// ==================== LOGIQUE DE RÉSOLUTION DE TAXONOMIE NIVEAUX 5-6 ====================

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

async function resolveVariable(variableName: string, format: TaxonomyFormat, context: ResolutionContext): Promise<string> {
    const source = getFieldSource(variableName);
    let rawValue: any = null;

    if (source === 'manual') {
        // 🆕 Variables créatifs manuelles
        const manualValues = context.creatifData.CR_Taxonomy_Values || {};
        const manualEntry = manualValues[variableName];
        if (manualEntry) {
            rawValue = manualEntry.format === 'open' ? manualEntry.openValue : manualEntry.shortcodeId;
        } else {
            rawValue = context.creatifData[variableName];
        }
    } else if (source === 'placement' && context.placementData) {
        // 🆕 Variables héritées du placement
        rawValue = context.placementData[variableName];
    } else if (source === 'campaign' && context.campaignData) {
        // Variables héritées de la campagne
        rawValue = context.campaignData[variableName];
    } else if (source === 'tactique' && context.tactiqueData) {
        // Variables héritées de la tactique
        rawValue = context.tactiqueData[variableName];
    }

    if (rawValue === null || rawValue === undefined || rawValue === '') return '';

    if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
        const shortcodeData = await getShortcode(rawValue, context.caches.shortcodes);
        if (!shortcodeData) return rawValue;

        const customCode = await getCustomCode(context.clientId, rawValue, context.caches.customCodes);
        return formatShortcodeValue(shortcodeData, customCode, format);
    }
    
    return String(rawValue);
}

async function generateLevelString(structure: string, context: ResolutionContext): Promise<string> {
    if (!structure) return '';
    
    const MASTER_REGEX = /(<[^>]*>|\[[^\]]+\])/g;
    const segments = structure.split(MASTER_REGEX).filter(Boolean);
    let finalString = '';

    for (const segment of segments) {
        if (segment.startsWith('[') && segment.endsWith(']')) {
            const variableMatch = segment.match(/\[([^:]+):([^\]]+)\]/);
            if (variableMatch) {
                const [, variableName, format] = variableMatch;
                finalString += await resolveVariable(variableName, format as TaxonomyFormat, context);
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
    
    const caches = { shortcodes: new Map(), customCodes: new Map() };
    const context: ResolutionContext = { clientId, campaignData, tactiqueData, placementData, creatifData, caches };

    // 🆕 Traitement des taxonomies NIVEAUX 5-6 (au lieu de 1-4)
    const processTaxonomyType = async (taxonomyId: string | undefined): Promise<string[]> => {
        if (!taxonomyId) return ['', ''];
        const taxonomy = await getTaxonomyById(clientId, taxonomyId);
        if (!taxonomy) return ['', ''];
        
        // 🔥 NIVEAUX 5-6 pour les créatifs
        const levels = [
            taxonomy.NA_Name_Level_5 || '', 
            taxonomy.NA_Name_Level_6 || ''
        ];
        return Promise.all(levels.map(level => generateLevelString(level, context)));
    };

    const [tagChains, platformChains, moChains] = await Promise.all([
      processTaxonomyType(creatifData.CR_Taxonomy_Tags),
      processTaxonomyType(creatifData.CR_Taxonomy_Platform),
      processTaxonomyType(creatifData.CR_Taxonomy_MediaOcean)
    ]);
    
    // 🆕 Chaînes taxonomie créatifs (niveaux 5-6)
    const taxonomyChains = {
      CR_Tag_5: tagChains[0], 
      CR_Tag_6: tagChains[1],
      CR_Plateforme_5: platformChains[0], 
      CR_Plateforme_6: platformChains[1],
      CR_MO_5: moChains[0], 
      CR_MO_6: moChains[1],
    };

    // Champs spécifiques aux créatifs
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
    
    // Nettoyer les valeurs undefined
    Object.keys(firestoreData).forEach(key => {
        if ((firestoreData as any)[key] === undefined) {
            (firestoreData as any)[key] = '';
        }
    });

    return firestoreData;
}

// ==================== FONCTIONS CRUD ====================

export async function createCreatif(
  clientId: string, campaignId: string, versionId: string, ongletId: string, 
  sectionId: string, tactiqueId: string, placementId: string,
  creatifData: CreatifFormData, 
  campaignData?: any, tactiqueData?: any, placementData?: any
): Promise<string> {
  const creatifsCollection = collection(
    db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 
    'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 
    'placements', placementId, 'creatifs'
  );
  
  const firestoreData = await prepareDataForFirestore(
    creatifData, clientId, campaignData, tactiqueData, placementData, false
  );
  
  const docRef = await addDoc(creatifsCollection, firestoreData);
  return docRef.id;
}

export async function updateCreatif(
  clientId: string, campaignId: string, versionId: string, ongletId: string,
  sectionId: string, tactiqueId: string, placementId: string, creatifId: string,
  creatifData: Partial<CreatifFormData>, 
  campaignData?: any, tactiqueData?: any, placementData?: any
): Promise<void> {
  const creatifRef = doc(
    db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 
    'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 
    'placements', placementId, 'creatifs', creatifId
  );
  
  const existingDoc = await getDoc(creatifRef);
  if (!existingDoc.exists()) throw new Error('Créatif non trouvé');
  
  const mergedData = { ...existingDoc.data(), ...creatifData } as CreatifFormData;
  const firestoreData = await prepareDataForFirestore(
    mergedData, clientId, campaignData, tactiqueData, placementData, true
  );
  
  await updateDoc(creatifRef, firestoreData);
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
    } catch (error) {
        console.error("Erreur lors de la suppression du créatif:", error);
        throw error;
    }
}