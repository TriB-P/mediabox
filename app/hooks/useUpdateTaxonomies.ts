/**
 * Ce fichier contient un hook React `useUpdateTaxonomies` qui gère la régénération et la mise à jour des taxonomies
 * pour les campagnes, tactiques, placements et créatifs dans la base de données Firebase (Firestore).
 * Il permet de résoudre dynamiquement les variables de taxonomie basées sur des données de campagne,
 * de tactique et de placement, y compris les shortcodes et les codes personnalisés, puis de mettre à jour
 * les documents Firebase correspondants.
 */
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
import { processTaxonomyDelimiters } from '../lib/taxonomyParser';
import { useTranslation } from '../contexts/LanguageContext';


type ParentType = 'campaign' | 'tactic' | 'placement';

interface ParentData {
  id: string;
  name: string;
  clientId: string;
  campaignId?: string;
  [key: string]: any;
}

interface ResolutionContext {
  clientId: string;
  campaignData: any;
  tactiqueData: any;
  placementData: any;
  creatifData?: any;
  caches: {
    shortcodes: Map<string, any>;
    customCodes: Map<string, string | null>;
  };
}

/**
 * Récupère les données d'un shortcode depuis Firebase ou le cache.
 * @param id L'ID du shortcode à récupérer.
 * @param cache Le cache pour stocker et récupérer les données de shortcode.
 * @returns Les données du shortcode ou null si non trouvé ou une erreur survient.
 */
async function getShortcode(id: string, cache: Map<string, any>): Promise<any | null> {
  if (cache.has(id)) return cache.get(id);
  try {
    console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomies.ts - Fonction: getShortcode - Path: shortcodes/${id}");
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

/**
 * Récupère un code personnalisé pour un client et un shortcode donnés, depuis Firebase ou le cache.
 * @param clientId L'ID du client.
 * @param shortcodeId L'ID du shortcode associé au code personnalisé.
 * @param cache Le cache pour stocker et récupérer les codes personnalisés.
 * @returns Le code personnalisé ou null si non trouvé ou une erreur survient.
 */
async function getCustomCode(clientId: string, shortcodeId: string, cache: Map<string, string | null>): Promise<string | null> {
  const cacheKey = `${clientId}__${shortcodeId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomies.ts - Fonction: getCustomCode - Path: clients/${clientId}/customCodes");
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

/**
 * Formate la valeur d'un shortcode selon un format de taxonomie spécifié.
 * @param shortcodeData Les données du shortcode.
 * @param customCode Le code personnalisé à utiliser si applicable.
 * @param format Le format de taxonomie souhaité (ex: 'code', 'display_fr', 'utm').
 * @returns La valeur formatée du shortcode.
 */
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

/**
 * Vérifie si une valeur correspond à un shortcode existant dans le cache
 */
async function isExistingShortcode(value: string, cache: Map<string, any>): Promise<boolean> {
  if (!value) return false;
  const shortcodeData = await getShortcode(value, cache);
  return shortcodeData !== null;
}

/**
 * NOUVELLE VERSION SIMPLIFIÉE : Résout la valeur d'une variable de taxonomie en utilisant le contexte fourni
 * Structure simplifiée : *_Taxonomy_Values[variableName] = string (shortcodeId ou saisie libre)
 */

/**
 * NOUVELLE VERSION : Résout la valeur d'une variable directement depuis les champs de l'objet
 * Plus de *_Taxonomy_Values - les valeurs sont stockées directement (ex: PL_Product, CR_CTA)
 */
async function resolveVariable(variableName: string, format: TaxonomyFormat, context: ResolutionContext, isCreatif: boolean = false): Promise<string> {
  const source = getFieldSource(variableName);
  let rawValue: any = null;

  // 1. Vérifier d'abord les champs directs selon le contexte
  if (isCreatif && isCreatifVariable(variableName) && context.creatifData) {
    // Variables créatifs stockées directement (ex: CR_CTA, CR_Offer)
    rawValue = context.creatifData[variableName];
    
    if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
      // Si c'est un shortcode existant ET qu'on a besoin de formatage
      if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
        if (await isExistingShortcode(rawValue, context.caches.shortcodes)) {
          const shortcodeData = await getShortcode(rawValue, context.caches.shortcodes);
          if (shortcodeData) {
            const customCode = await getCustomCode(context.clientId, rawValue, context.caches.customCodes);
            const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
            return formattedValue;
          }
        }
      }
      
      return String(rawValue);
    }
  } else if (!isCreatif && context.placementData) {
    // Variables placement stockées directement (ex: PL_Product, PL_Channel)
    rawValue = context.placementData[variableName];
    
    if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
      // Si c'est un shortcode existant ET qu'on a besoin de formatage
      if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
        if (await isExistingShortcode(rawValue, context.caches.shortcodes)) {
          const shortcodeData = await getShortcode(rawValue, context.caches.shortcodes);
          if (shortcodeData) {
            const customCode = await getCustomCode(context.clientId, rawValue, context.caches.customCodes);
            const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
            return formattedValue;
          }
        }
      }
      
      return String(rawValue);
    }
  }

  // 2. Résolution selon la source (hiérarchie campagne → tactique → placement)
  if (source === 'campaign' && context.campaignData) {
    rawValue = context.campaignData[variableName];
  } else if (source === 'tactique' && context.tactiqueData) {
    rawValue = context.tactiqueData[variableName];
  } else if (source === 'placement' && context.placementData) {
    rawValue = context.placementData[variableName];
  } else if (source === 'créatif') {
    if (isCreatif && isCreatifVariable(variableName) && context.creatifData) {
      rawValue = context.creatifData[variableName];
    } else {
      rawValue = context.placementData[variableName];
    }
  }

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return '';
  }

  // 3. Formatage de la valeur pour les champs directs
  if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
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
/**
 * Génère une chaîne de caractères de taxonomie en résolvant les variables et les groupes à partir d'une structure donnée.
 * @param structure La chaîne de structure de taxonomie contenant des variables (ex: "[CA_ClientName:code]").
 * @param context Le contexte de résolution.
 * @param isCreatif Indique si la chaîne est générée pour un créatif.
 * @returns La chaîne de taxonomie finale résolue.
 */
async function generateLevelString(structure: string, context: ResolutionContext, isCreatif: boolean = false): Promise<string> {
  const variableResolver = async (variableName: string, format: string) => {
    return await resolveVariable(variableName, format as TaxonomyFormat, context, isCreatif);
  };
  
  return await processTaxonomyDelimiters(structure, variableResolver);
}

/**
 * Régénère les taxonomies d'un placement donné en fonction des données de la campagne et de la tactique.
 * @param clientId L'ID du client.
 * @param placementData Les données du placement.
 * @param campaignData Les données de la campagne parente.
 * @param tactiqueData Les données de la tactique parente.
 * @returns Un objet contenant les taxonomies régénérées du placement.
 */
async function regeneratePlacementTaxonomies(clientId: string, placementData: any, campaignData: any, tactiqueData: any): Promise<any> {

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

    updatedAt: new Date().toISOString()
  };
}

/**
 * Régénère les taxonomies d'un créatif donné en fonction des données de la campagne, de la tactique et du placement.
 * @param clientId L'ID du client.
 * @param creatifData Les données du créatif.
 * @param campaignData Les données de la campagne parente.
 * @param tactiqueData Les données de la tactique parente.
 * @param placementData Les données du placement parent.
 * @returns Un objet contenant les taxonomies régénérées du créatif.
 */
async function regenerateCreatifTaxonomies(clientId: string, creatifData: any, campaignData: any, tactiqueData: any, placementData: any): Promise<any> {

  const caches = { shortcodes: new Map(), customCodes: new Map() };
  const context: ResolutionContext = {
    clientId,
    campaignData,
    tactiqueData,
    placementData,
    creatifData,
    caches
  };

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

/**
 * Hook personnalisé pour déclencher la mise à jour des taxonomies.
 * @returns Un objet contenant la fonction `updateTaxonomies`.
 */
export const useUpdateTaxonomies = () => {
  const { t } = useTranslation();
  /**
   * Met à jour les taxonomies pour une campagne, une tactique ou un placement donné.
   * La fonction parcourt l'arborescence des documents Firebase (versions, onglets, sections, tactiques, placements, créatifs)
   * et régénère les taxonomies pour les éléments concernés.
   * Toutes les mises à jour sont effectuées en lot pour optimiser les écritures Firebase.
   * @param parentType Le type de l'entité parente ('campaign', 'tactic', ou 'placement') qui a déclenché la mise à jour.
   * @param parentData Les données de l'entité parente.
   * @throws Lance une erreur si la mise à jour des taxonomies échoue.
   */
  const updateTaxonomies = async (parentType: ParentType, parentData: ParentData) => {
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

      console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomies.ts - Fonction: updateTaxonomies - Path: clients/${clientId}/campaigns/${campaignId}");
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

      console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomies.ts - Fonction: updateTaxonomies - Path: clients/${clientId}/campaigns/${campaignId}/versions");
      const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions');
      const versionsSnap = await getDocs(versionsRef);

      for (const versionDoc of versionsSnap.docs) {
        const versionId = versionDoc.id;

        console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomies.ts - Fonction: updateTaxonomies - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets");
        const ongletsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets');
        const ongletsSnap = await getDocs(ongletsRef);

        for (const ongletDoc of ongletsSnap.docs) {
          const ongletId = ongletDoc.id;

          console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomies.ts - Fonction: updateTaxonomies - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections");
          const sectionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections');
          const sectionsSnap = await getDocs(sectionsRef);

          for (const sectionDoc of sectionsSnap.docs) {
            const sectionId = sectionDoc.id;

            console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomies.ts - Fonction: updateTaxonomies - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques");
            const tactiquesRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques');
            const tactiquesSnap = await getDocs(tactiquesRef);

            for (const tactiqueDoc of tactiquesSnap.docs) {
              const tactiqueId = tactiqueDoc.id;
              const tactiqueData = tactiqueDoc.data();

              console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomies.ts - Fonction: updateTaxonomies - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
              const placementsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements');
              const placementsSnap = await getDocs(placementsRef);

              for (const placementDoc of placementsSnap.docs) {
                const placementId = placementDoc.id;
                const placementData = placementDoc.data();

                let shouldUpdatePlacement = false;
                if (parentType === 'campaign') {
                  shouldUpdatePlacement = true;
                } else if (parentType === 'tactic' && tactiqueId === parentData.id) {
                  shouldUpdatePlacement = true;
                } else if (parentType === 'placement' && placementId === parentData.id) {
                  shouldUpdatePlacement = true;
                }

                if (shouldUpdatePlacement) {
                  try {
                    const updatedFields = await regeneratePlacementTaxonomies(clientId, placementData, campaignData, tactiqueData);
                    console.log("FIREBASE: ÉCRITURE - Fichier: useUpdateTaxonomies.ts - Fonction: updateTaxonomies - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
                    const placementRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId);
                    batch.update(placementRef, updatedFields);
                    updatedCount++;
                  } catch (error) {
                    console.error(`❌ Erreur placement ${placementId}:`, error);
                  }
                }

                console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomies.ts - Fonction: updateTaxonomies - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs");
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
                    try {
                      const updatedFields = await regenerateCreatifTaxonomies(clientId, creatifData, campaignData, tactiqueData, placementData);
                      console.log("FIREBASE: ÉCRITURE - Fichier: useUpdateTaxonomies.ts - Fonction: updateTaxonomies - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifId}");
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

      if (updatedCount > 0) {
        console.log("FIREBASE: ÉCRITURE - Fichier: useUpdateTaxonomies.ts - Fonction: updateTaxonomies - Path: Batch commit");
        await batch.commit();
      } else {
      }

    } catch (error) {
      console.error('❌ [UpdateTaxonomies] Erreur:', error);
      throw new Error(t('updateTaxonomies.updateFailed'));
    }
  };

  return { updateTaxonomies };
};