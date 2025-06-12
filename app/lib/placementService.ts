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
    where
} from 'firebase/firestore';
import { db } from './firebase';
import { Placement, PlacementFormData, GeneratedTaxonomies, TaxonomyValues } from '../types/tactiques';
import { getTaxonomyById } from './taxonomyService';
import { Taxonomy } from '../types/taxonomy';
import { 
    TAXONOMY_VARIABLE_REGEX,
    getManualVariableNames, 
    getFieldSource,
    formatRequiresShortcode,
    TaxonomyFormat 
} from '../config/taxonomyFields';

// ==================== LOGIQUE DE RÉSOLUTION DE TAXONOMIE ====================

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
        const manualValues = context.placementData.PL_Taxonomy_Values || {};
        const manualEntry = manualValues[variableName];
        if (manualEntry) {
            rawValue = manualEntry.format === 'open' ? manualEntry.openValue : manualEntry.shortcodeId;
        } else {
             rawValue = context.placementData[variableName];
        }
      } else if (source === 'campaign' && context.campaignData) {
        // ✅ CORRECTION : On accède directement à la propriété avec le nom complet.
        rawValue = context.campaignData[variableName];
    } else if (source === 'tactique' && context.tactiqueData) {
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
                finalString += groupContent; // Ajoute le contenu statique s'il n'y a pas de variables
                continue;
            }

            // 1. Résoudre toutes les variables et ne garder que celles qui ont une valeur
            const resolvedValues = [];
            for (const match of variablesInGroup) {
                const [, variableName, format] = match;
                const resolved = await resolveVariable(variableName, format as TaxonomyFormat, context);
                if (resolved && !resolved.startsWith('[')) {
                    resolvedValues.push(resolved);
                }
            }
            
            // 2. Si aucune variable n'a été résolue, le groupe est ignoré
            if (resolvedValues.length === 0) {
                continue;
            }

            // 3. Trouver le délimiteur (même logique que dans le parser)
            const delimiterMatch = groupContent.match(/\](.*?)\s*\[/);
            const delimiter = delimiterMatch ? delimiterMatch[1] : '';

            // 4. Joindre UNIQUEMENT les valeurs résolues et les ajouter à la chaîne finale
            finalString += resolvedValues.join(delimiter);
            
        } else {
            finalString += segment;
        }
    }
    return finalString;
}

async function prepareDataForFirestore(
  placementData: PlacementFormData,
  clientId: string,
  campaignData: any,
  tactiqueData: any,
  isUpdate: boolean = false
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
        return Promise.all(levels.map(level => generateLevelString(level, context)));
    };

    const [tagChains, platformChains, moChains] = await Promise.all([
      processTaxonomyType(placementData.PL_Taxonomy_Tags),
      processTaxonomyType(placementData.PL_Taxonomy_Platform),
      processTaxonomyType(placementData.PL_Taxonomy_MediaOcean)
    ]);
    
    const taxonomyChains = {
      PL_Tag_1: tagChains[0], PL_Tag_2: tagChains[1], PL_Tag_3: tagChains[2], PL_Tag_4: tagChains[3],
      PL_Plateforme_1: platformChains[0], PL_Plateforme_2: platformChains[1], PL_Plateforme_3: platformChains[2], PL_Plateforme_4: platformChains[3],
      PL_MO_1: moChains[0], PL_MO_2: moChains[1], PL_MO_3: moChains[2], PL_MO_4: moChains[3],
    };

    const placementFieldNames = getManualVariableNames();
    const placementFields: any = {};
    placementFieldNames.forEach(fieldName => {
        if (fieldName in placementData) {
            placementFields[fieldName] = (placementData as any)[fieldName] || '';
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
        PL_Generated_Taxonomies: {
            tags: tagChains.filter(Boolean).join('|'),
            platform: platformChains.filter(Boolean).join('|'),
            mediaocean: moChains.filter(Boolean).join('|'),
        },
        ...placementFields,
        ...taxonomyChains,
        updatedAt: new Date().toISOString(),
        ...(!isUpdate && { createdAt: new Date().toISOString() })
    };
    
    Object.keys(firestoreData).forEach(key => {
        if ((firestoreData as any)[key] === undefined) {
            (firestoreData as any)[key] = '';
        }
    });

    return firestoreData;
}
  
export async function createPlacement(
  clientId: string, campaignId: string, versionId: string, ongletId: string, sectionId: string, tactiqueId: string,
  placementData: PlacementFormData, campaignData?: any, tactiqueData?: any
): Promise<string> {
  const placementsCollection = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements');
  const firestoreData = await prepareDataForFirestore(placementData, clientId, campaignData, tactiqueData, false);
  const docRef = await addDoc(placementsCollection, firestoreData);
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
  const firestoreData = await prepareDataForFirestore(mergedData, clientId, campaignData, tactiqueData, true);
  await updateDoc(placementRef, firestoreData);
}

export async function getPlacementsForTactique(
    clientId: string, campaignId: string, versionId: string, ongletId: string,
    sectionId: string, tactiqueId: string
  ): Promise<Placement[]> {
    try {
      const placementsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements');
      const q = query(placementsRef, orderBy('PL_Order', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Placement));
    } catch (error) {
      console.error("Erreur lors de la récupération des placements:", error);
      throw error;
    }
}

export async function deletePlacement(
    clientId: string, campaignId: string, versionId: string, ongletId: string,
    sectionId: string, tactiqueId: string, placementId: string
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
      console.error("Erreur lors de la suppression du placement:", error);
      throw error;
    }
}