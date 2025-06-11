// app/lib/taxonomyProcessor.ts

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { TaxonomyFormat, FieldSource } from '../config/taxonomyFields';
import { getFieldSource } from '../config/taxonomyFields';
import type { TaxonomyContext, TaxonomyValues } from '../types/tactiques';

// Cache simple pour la durée d'une opération de sauvegarde
const shortcodeCache = new Map<string, any>();
const customCodeCache = new Map<string, any>();

/**
 * Nettoie les caches. Doit être appelé avant une nouvelle opération de sauvegarde.
 */
export function clearTaxonomyCache() {
  shortcodeCache.clear();
  customCodeCache.clear();
}

/**
 * Récupère un shortcode depuis Firestore avec un système de cache.
 */
async function getShortcodeWithCache(shortcodeId: string): Promise<any | null> {
  if (shortcodeCache.has(shortcodeId)) {
    return shortcodeCache.get(shortcodeId);
  }
  try {
    const shortcodeRef = doc(db, 'shortcodes', shortcodeId);
    const shortcodeSnap = await getDoc(shortcodeRef);
    if (shortcodeSnap.exists()) {
      const data = shortcodeSnap.data();
      shortcodeCache.set(shortcodeId, data);
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Erreur chargement shortcode ${shortcodeId}:`, error);
    return null;
  }
}

/**
 * Récupère un code personnalisé depuis Firestore avec un système de cache.
 */
async function getCustomCodeWithCache(clientId: string, shortcodeId: string): Promise<string | null> {
  const cacheKey = `${clientId}-${shortcodeId}`;
  if (customCodeCache.has(cacheKey)) {
    return customCodeCache.get(cacheKey);
  }
  try {
    // La collection est `customCodes` au pluriel
    const customCodesCollection = collection(db, 'clients', clientId, 'customCodes');
    const q = query(customCodesCollection, where('shortcodeId', '==', shortcodeId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const customCodeDoc = querySnapshot.docs[0];
        const customCode = customCodeDoc.data().customCode;
        customCodeCache.set(cacheKey, customCode);
        return customCode;
    }
    return null;
  } catch (error) {
    console.error(`Erreur chargement custom code pour ${shortcodeId}:`, error);
    return null;
  }
}


/**
 * Formate une valeur de shortcode selon le format demandé.
 */
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

/**
 * Résout la valeur d'une variable en utilisant le contexte et les caches.
 */
export async function resolveVariableValue(
  variableName: string,
  format: TaxonomyFormat,
  context: TaxonomyContext,
  taxonomyValues: TaxonomyValues
): Promise<string> {
  const manualValue = taxonomyValues[variableName];

  // 1. Valeur manuelle (saisie libre ou sélection dans le formulaire)
  if (manualValue) {
    if (manualValue.format === 'open') return manualValue.openValue || '';
    
    // Si c'est un shortcode, on doit le résoudre
    if (manualValue.shortcodeId) {
      const shortcodeData = await getShortcodeWithCache(manualValue.shortcodeId);
      if (shortcodeData) {
        const customCode = await getCustomCodeWithCache(context.clientId, manualValue.shortcodeId);
        return formatShortcodeValue(shortcodeData, customCode, format);
      }
    }
    return manualValue.value || '';
  }

  // 2. Valeur héritée (Campagne ou Tactique)
  let inheritedValue: any = null;
  const source: FieldSource | null = getFieldSource(variableName);

  if (source === 'campaign' && context.campaign) {
    const key = variableName.split('_').pop()?.toLowerCase() || '';
    inheritedValue = context.campaign[key];
  } else if (source === 'tactique' && context.tactique) {
    inheritedValue = context.tactique[variableName];
  } else if (source === 'manual' && context.placement) {
    inheritedValue = context.placement[variableName];
  }
  
  if (inheritedValue) {
    const shortcodeData = await getShortcodeWithCache(inheritedValue);
    if (shortcodeData) {
      const customCode = await getCustomCodeWithCache(context.clientId, inheritedValue);
      return formatShortcodeValue(shortcodeData, customCode, format);
    }
    return String(inheritedValue);
  }

  return '';
}

/**
 * Génère la chaîne de taxonomie finale en remplaçant les variables de manière asynchrone.
 */
export async function generateFinalTaxonomyString(
  structure: string,
  valueResolver: (variableName: string, format: TaxonomyFormat) => Promise<string>
): Promise<string> {
  if (!structure) return '';

  const MASTER_REGEX = /(<[^>]*>|\[[^\]]+\])/g;
  const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
  const segments = structure.split(MASTER_REGEX).filter(Boolean);

  let finalString = '';

  for (const segment of segments) {
    let resolvedSegment = segment;

    if (segment.startsWith('<') && segment.endsWith('>')) {
      const groupContent = segment.slice(1, -1);
      const variablesInGroup = Array.from(groupContent.matchAll(VARIABLE_REGEX));
      const resolvedValues = [];

      for (const match of variablesInGroup) {
        const [, variableName, format] = match;
        const value = await valueResolver(variableName, format as TaxonomyFormat);
        if (value) {
          resolvedValues.push(value);
        }
      }
      
      if (resolvedValues.length === variablesInGroup.length) {
        let tempGroupContent = groupContent;
        for (let i = 0; i < variablesInGroup.length; i++) {
          tempGroupContent = tempGroupContent.replace(variablesInGroup[i][0], resolvedValues[i]);
        }
        resolvedSegment = tempGroupContent;
      } else {
        resolvedSegment = '';
      }
    }
    else if (segment.startsWith('[') && segment.endsWith(']')) {
      const variableMatch = segment.match(VARIABLE_REGEX);
      if (variableMatch) {
        const [, variableName, format] = variableMatch;
        resolvedSegment = await valueResolver(variableName, format as TaxonomyFormat);
      }
    }

    finalString += resolvedSegment;
  }

  return finalString;
}