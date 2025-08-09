// app/lib/placementService.ts

/**
 * Ce fichier gère toutes les opérations liées aux placements dans Firebase Firestore.
 * Il inclut les fonctions pour créer, lire, mettre à jour et supprimer des placements,
 * ainsi que la logique complexe de résolution et de génération des taxonomies
 * pour s'assurer que les données sont correctement formatées avant d'être sauvegardées.
 * MISE À JOUR : Ajout des nouveaux champs Tags (PL_Tag_Start_Date, PL_Tag_End_Date, PL_Tag_Type, etc.)
 */
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
import { Placement, PlacementFormData, GeneratedTaxonomies } from '../types/tactiques';
import { getTaxonomyById } from './taxonomyService';
import { Taxonomy } from '../types/taxonomy';
import { 
  TAXONOMY_VARIABLE_REGEX,
  getPlacementVariableNames, 
  getFieldSource,
  formatRequiresShortcode,
  TaxonomyFormat 
} from '../config/taxonomyFields';

import { processTaxonomyDelimiters } from './taxonomyParser';


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

/**
 * Récupère un shortcode depuis la base de données ou le cache.
 * @param id L'identifiant du shortcode.
 * @param cache Le cache pour stocker les shortcodes déjà récupérés.
 * @returns Les données du shortcode ou null si non trouvé.
 */
async function getShortcode(id: string, cache: Map<string, any>): Promise<any | null> {
  if (cache.has(id)) return cache.get(id);
  const docRef = doc(db, 'shortcodes', id);
  console.log("FIREBASE: LECTURE - Fichier: placementService.ts - Fonction: getShortcode - Path: shortcodes/${id}");
  const docSnap = await getDoc(docRef);
  const data = docSnap.exists() ? docSnap.data() : null;
  cache.set(id, data);
  return data;
}

/**
 * Récupère un code personnalisé pour un client et un shortcode donnés, en utilisant un cache.
 * @param clientId L'identifiant du client.
 * @param shortcodeId L'identifiant du shortcode.
 * @param cache Le cache pour stocker les codes personnalisés déjà récupérés.
 * @returns Le code personnalisé ou null si non trouvé.
 */
async function getCustomCode(clientId: string, shortcodeId: string, cache: Map<string, string | null>): Promise<string | null> {
  const cacheKey = `${clientId}__${shortcodeId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const q = query(collection(db, 'clients', clientId, 'customCodes'), where('shortcodeId', '==', shortcodeId));
  console.log("FIREBASE: LECTURE - Fichier: placementService.ts - Fonction: getCustomCode - Path: clients/${clientId}/customCodes");
  const snapshot = await getDocs(q);
  const data = snapshot.empty ? null : snapshot.docs[0].data().customCode;
  cache.set(cacheKey, data);
  return data;
}

/**
 * Formate la valeur d'un shortcode selon un format spécifié.
 * @param shortcodeData Les données du shortcode.
 * @param customCode Le code personnalisé, s'il existe.
 * @param format Le format de sortie désiré (ex: 'code', 'display_fr', 'utm').
 * @returns La chaîne de caractères formatée.
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
 * Vérifie si une valeur correspond à un shortcode existant dans le cache
 */
async function isExistingShortcode(value: string, cache: Map<string, any>): Promise<boolean> {
  if (!value) return false;
  const shortcodeData = await getShortcode(value, cache);
  return shortcodeData !== null;
}

/**
 * NOUVELLE VERSION SIMPLIFIÉE : Résout la valeur d'une variable de taxonomie
 * Structure simplifiée : PL_Taxonomy_Values[variableName] = string (shortcodeId ou saisie libre)
 */
async function resolveVariable(variableName: string, format: TaxonomyFormat, context: ResolutionContext): Promise<string> {
  const source = getFieldSource(variableName);
  let rawValue: any = null;

  // 1. Résolution selon la source
  if (source === 'créatif') {
    // Variables manuelles stockées directement dans l'objet placement
    rawValue = context.placementData[variableName];
  } else if (source === 'campaign' && context.campaignData) {
    rawValue = context.campaignData[variableName];
  } else if (source === 'tactique' && context.tactiqueData) {
    rawValue = context.tactiqueData[variableName];
  } else if (source === 'placement' && context.placementData) {
    // Variables de placement stockées directement dans l'objet (ex: PL_Product, PL_Channel)
    rawValue = context.placementData[variableName];
  }

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return '';
  }

  // 2. Formatage de la valeur si c'est un shortcode
  if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
    // Vérifier si c'est un shortcode existant
    if (await isExistingShortcode(rawValue, context.caches.shortcodes)) {
      const shortcodeData = await getShortcode(rawValue, context.caches.shortcodes);
      if (shortcodeData) {
        const customCode = await getCustomCode(context.clientId, rawValue, context.caches.customCodes);
        const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
        return formattedValue;
      }
    }
  }
  
  const finalValue = String(rawValue);
  return finalValue;
}


async function generateLevelString(structure: string, context: ResolutionContext): Promise<string> {
  const variableResolver = async (variableName: string, format: string) => {
    return await resolveVariable(variableName, format as TaxonomyFormat, context);
  };
  
  return await processTaxonomyDelimiters(structure, variableResolver);
}

/**
 * Prépare les données d'un placement pour l'enregistrement dans Firestore.
 * Cela inclut la résolution des taxonomies et la fusion des données nécessaires.
 * MISE À JOUR : Inclut maintenant les nouveaux champs Tags.
 * @param placementData Les données du formulaire de placement.
 * @param clientId L'identifiant du client.
 * @param campaignData Les données de la campagne associée.
 * @param tactiqueData Les données de la tactique associée.
 * @param isUpdate Indique si l'opération est une mise à jour (true) ou une création (false).
 * @returns Un objet contenant les données prêtes pour Firestore.
 */
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
      
      console.log("FIREBASE: LECTURE - Fichier: placementService.ts - Fonction: prepareDataForFirestore - Path: clients/${clientId}/taxonomies/${taxonomyId}");
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

  // Extraire tous les champs manuels de placement (incluant les variables taxonomie)
  const placementFieldNames = getPlacementVariableNames();
  const placementFields: any = {};
  placementFieldNames.forEach(fieldName => {
      if (fieldName in placementData) {
          placementFields[fieldName] = (placementData as any)[fieldName] || '';
      }
  });

  // 🔥 NOUVEAUX CHAMPS TAGS - Ajout explicite pour garantir la sauvegarde
  const tagsFields = {
    PL_Tag_Start_Date: placementData.PL_Tag_Start_Date || '',
    PL_Tag_End_Date: placementData.PL_Tag_End_Date || '',
    PL_Tag_Type: placementData.PL_Tag_Type || '',
    PL_Third_Party_Measurement: placementData.PL_Third_Party_Measurement ?? false,
    PL_VPAID: placementData.PL_VPAID ?? true,
    PL_Creative_Rotation_Type: placementData.PL_Creative_Rotation_Type || '',
    PL_Floodlight: placementData.PL_Floodlight || '',
  };
  
  const firestoreData = {
      PL_Label: placementData.PL_Label || '',
      PL_Order: placementData.PL_Order || 0,
      PL_TactiqueId: placementData.PL_TactiqueId,
      PL_Start_Date: placementData.PL_Start_Date || '',
      PL_End_Date: placementData.PL_End_Date || '',
      PL_Taxonomy_Tags: placementData.PL_Taxonomy_Tags || '',
      PL_Taxonomy_Platform: placementData.PL_Taxonomy_Platform || '',
      PL_Taxonomy_MediaOcean: placementData.PL_Taxonomy_MediaOcean || '',

      ...placementFields,  // ✅ INCLUT maintenant directement PL_Product, PL_Channel, etc.
      ...taxonomyChains,
      ...tagsFields,       // 🔥 NOUVEAUX CHAMPS TAGS
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

/**
 * Crée un nouveau placement dans la base de données.
 * @param clientId L'identifiant du client.
 * @param campaignId L'identifiant de la campagne.
 * @param versionId L'identifiant de la version.
 * @param ongletId L'identifiant de l'onglet.
 * @param sectionId L'identifiant de la section.
 * @param tactiqueId L'identifiant de la tactique.
 * @param placementData Les données du nouveau placement.
 * @param campaignData Les données de la campagne (optionnel, pour la résolution des taxonomies).
 * @param tactiqueData Les données de la tactique (optionnel, pour la résolution des taxonomies).
 * @returns L'identifiant du placement créé.
 */
export async function createPlacement(
clientId: string, campaignId: string, versionId: string, ongletId: string, sectionId: string, tactiqueId: string,
placementData: PlacementFormData, campaignData?: any, tactiqueData?: any
): Promise<string> {

const placementsCollection = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements');
const firestoreData = await prepareDataForFirestore(placementData, clientId, campaignData, tactiqueData, false);
console.log("FIREBASE: ÉCRITURE - Fichier: placementService.ts - Fonction: createPlacement - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
const docRef = await addDoc(placementsCollection, firestoreData);

return docRef.id;
}

/**
 * Met à jour un placement existant dans la base de données.
 * @param clientId L'identifiant du client.
 * @param campaignId L'identifiant de la campagne.
 * @param versionId L'identifiant de la version.
 * @param ongletId L'identifiant de l'onglet.
 * @param sectionId L'identifiant de la section.
 * @param tactiqueId L'identifiant de la tactique.
 * @param placementId L'identifiant du placement à mettre à jour.
 * @param placementData Les données partielles du placement à mettre à jour.
 * @param campaignData Les données de la campagne (optionnel, pour la résolution des taxonomies).
 * @param tactiqueData Les données de la tactique (optionnel, pour la résolution des taxonomies).
 * @returns Une promesse vide.
 * @throws Error si le placement n'est pas trouvé.
 */
export async function updatePlacement(
clientId: string, campaignId: string, versionId: string, ongletId: string, sectionId: string, tactiqueId: string, placementId: string,
placementData: Partial<PlacementFormData>, campaignData?: any, tactiqueData?: any
): Promise<void> {

const placementRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId);
console.log("FIREBASE: LECTURE - Fichier: placementService.ts - Fonction: updatePlacement - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
const existingDoc = await getDoc(placementRef);
if (!existingDoc.exists()) throw new Error('Placement non trouvé');
const mergedData = { ...existingDoc.data(), ...placementData } as PlacementFormData;
const firestoreData = await prepareDataForFirestore(mergedData, clientId, campaignData, tactiqueData, true);
console.log("FIREBASE: ÉCRITURE - Fichier: placementService.ts - Fonction: updatePlacement - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
await updateDoc(placementRef, firestoreData);
}

/**
 * Récupère tous les placements pour une tactique donnée, triés par ordre.
 * @param clientId L'identifiant du client.
 * @param campaignId L'identifiant de la campagne.
 * @param versionId L'identifiant de la version.
 * @param ongletId L'identifiant de l'onglet.
 * @param sectionId L'identifiant de la section.
 * @param tactiqueId L'identifiant de la tactique.
 * @returns Un tableau d'objets Placement.
 * @throws L'erreur rencontrée lors de la récupération.
 */
export async function getPlacementsForTactique(
  clientId: string, campaignId: string, versionId: string, ongletId: string,
  sectionId: string, tactiqueId: string
): Promise<Placement[]> {
  try {
    const placementsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements');
    const q = query(placementsRef, orderBy('PL_Order', 'asc'));
    console.log("FIREBASE: LECTURE - Fichier: placementService.ts - Fonction: getPlacementsForTactique - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Placement));
  } catch (error) {
    console.error("Erreur lors de la récupération des placements:", error);
    throw error;
  }
}

/**
 * Supprime un placement et tous les créatifs associés.
 * @param clientId L'identifiant du client.
 * @param campaignId L'identifiant de la campagne.
 * @param versionId L'identifiant de la version.
 * @param ongletId L'identifiant de l'onglet.
 * @param sectionId L'identifiant de la section.
 * @param tactiqueId L'identifiant de la tactique.
 * @param placementId L'identifiant du placement à supprimer.
 * @returns Une promesse vide.
 * @throws L'erreur rencontrée lors de la suppression.
 */
export async function deletePlacement(
  clientId: string, campaignId: string, versionId: string, ongletId: string,
  sectionId: string, tactiqueId: string, placementId: string
): Promise<void> {
  try {
    const creatifsRef = collection(db,'clients',clientId,'campaigns',campaignId,'versions',versionId,'onglets',ongletId,'sections',sectionId,'tactiques',tactiqueId,'placements',placementId,'creatifs');
    console.log("FIREBASE: LECTURE - Fichier: placementService.ts - Fonction: deletePlacement - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs");
    const creatifsSnapshot = await getDocs(creatifsRef);
    const batch = writeBatch(db);
    creatifsSnapshot.docs.forEach(doc => {
      console.log("FIREBASE: ÉCRITURE - Fichier: placementService.ts - Fonction: deletePlacement - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${doc.id}");
      batch.delete(doc.ref);
    });
    const placementRef = doc(db,'clients',clientId,'campaigns',campaignId,'versions',versionId,'onglets',ongletId,'sections',sectionId,'tactiques',tactiqueId,'placements',placementId);
    console.log("FIREBASE: ÉCRITURE - Fichier: placementService.ts - Fonction: deletePlacement - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
    batch.delete(placementRef);
    console.log("FIREBASE: ÉCRITURE - Fichier: placementService.ts - Fonction: deletePlacement - Path: Batch commit");
    await batch.commit();
  } catch (error) {
    console.error("Erreur lors de la suppression du placement:", error);
    throw error;
  }
}