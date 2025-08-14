// app/hooks/useUpdateTaxonomiesAfterMove.ts

/**
 * Ce hook est spécialement conçu pour régénérer complètement les taxonomies après un déplacement d'éléments.
 * Contrairement à useUpdateTaxonomies qui préserve les valeurs manuelles existantes, ce hook force
 * une régénération complète des taxonomies basée uniquement sur le nouveau contexte hiérarchique,
 * en ignorant les anciennes valeurs qui pourraient hériter d'un contexte obsolète.
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
import { useTranslation } from '../contexts/LanguageContext';
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
  forceRegeneration: boolean; // ✅ Flag pour forcer la régénération
}

/**
 * Récupère les données d'un shortcode depuis Firebase ou le cache.
 */
async function getShortcode(id: string, cache: Map<string, any>, t: (key: string) => string): Promise<any | null> {
  if (cache.has(id)) return cache.get(id);
  try {
    console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: getShortcode - Path: shortcodes/${id}");
    const docRef = doc(db, 'shortcodes', id);
    const docSnap = await getDoc(docRef);
    const data = docSnap.exists() ? docSnap.data() : null;
    cache.set(id, data);
    return data;
  } catch (error) {
    console.error(`${t('useUpdateTaxonomiesAfterMove.errors.fetchShortcode')} ${id}:`, error);
    cache.set(id, null);
    return null;
  }
}

/**
 * Récupère un code personnalisé pour un client et un shortcode donnés, depuis Firebase ou le cache.
 */
async function getCustomCode(clientId: string, shortcodeId: string, cache: Map<string, string | null>, t: (key: string) => string): Promise<string | null> {
  const cacheKey = `${clientId}__${shortcodeId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: getCustomCode - Path: clients/${clientId}/customCodes");
    const q = query(collection(db, 'clients', clientId, 'customCodes'), where('shortcodeId', '==', shortcodeId));
    const snapshot = await getDocs(q);
    const data = snapshot.empty ? null : snapshot.docs[0].data().customCode;
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`${t('useUpdateTaxonomiesAfterMove.errors.fetchCustomCode')} ${shortcodeId}:`, error);
    cache.set(cacheKey, null);
    return null;
  }
}

/**
 * Formate la valeur d'un shortcode selon un format de taxonomie spécifié.
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
async function isExistingShortcode(value: string, cache: Map<string, any>, t: (key: string) => string): Promise<boolean> {
  if (!value) return false;
  const shortcodeData = await getShortcode(value, cache, t);
  return shortcodeData !== null;
}

/**
 * ✅ MODIFIÉ : Résout la valeur d'une variable directement depuis les champs de l'objet
 * Plus de *_Taxonomy_Values - les valeurs sont stockées directement (ex: PL_Product, CR_CTA)
 * IGNORE les valeurs manuelles existantes si forceRegeneration est true.
 */
async function resolveVariable(variableName: string, format: TaxonomyFormat, context: ResolutionContext, t: (key: string) => string, isCreatif: boolean = false): Promise<string> {
    const source = getFieldSource(variableName);
    let rawValue: any = null;
  
    // ✅ 1. Gestion des valeurs manuelles (seulement si forceRegeneration est false)
    if (!context.forceRegeneration) {
      if (isCreatif && isCreatifVariable(variableName) && context.creatifData) {
        // Variables créatifs stockées directement (ex: CR_CTA, CR_Offer)
        rawValue = context.creatifData[variableName];
        
        if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
          // Si c'est un shortcode existant ET qu'on a besoin de formatage
          if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
            if (await isExistingShortcode(rawValue, context.caches.shortcodes, t)) {
              const shortcodeData = await getShortcode(rawValue, context.caches.shortcodes, t);
              if (shortcodeData) {
                const customCode = await getCustomCode(context.clientId, rawValue, context.caches.customCodes, t);
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
            if (await isExistingShortcode(rawValue, context.caches.shortcodes, t)) {
              const shortcodeData = await getShortcode(rawValue, context.caches.shortcodes, t);
              if (shortcodeData) {
                const customCode = await getCustomCode(context.clientId, rawValue, context.caches.customCodes, t);
                const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
                return formattedValue;
              }
            }
          }
          
          return String(rawValue);
        }
      }
    }
  
    // ✅ 2. Résolution selon la source de la variable (TOUJOURS respectée)
    switch (source) {
      case 'campaign':
        if (context.campaignData) {
          rawValue = context.campaignData[variableName];
        }
        break;
  
      case 'tactique':
        if (context.tactiqueData) {
          rawValue = context.tactiqueData[variableName];
        }
        break;
  
      case 'placement':
        if (context.placementData) {
          // ✅ Recherche directe dans l'objet placement
          rawValue = context.placementData[variableName];
        }
        break;
  
      case 'créatif':
        // ✅ Variables manuelles : chercher selon le contexte (créatif vs placement)
        if (isCreatif && isCreatifVariable(variableName) && context.creatifData) {
          rawValue = context.creatifData[variableName];
        } else if (context.placementData) {
          rawValue = context.placementData[variableName];
        }
        break;
  
      default:
        console.warn(`${t('useUpdateTaxonomiesAfterMove.warnings.unknownSource')} ${variableName}: ${source}`);
        break;
    }
  
    // ✅ 3. Gestion des valeurs vides
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return '';
    }
  
    // ✅ 4. Formatage des shortcodes si nécessaire
    if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
      if (await isExistingShortcode(rawValue, context.caches.shortcodes, t)) {
        const shortcodeData = await getShortcode(rawValue, context.caches.shortcodes, t);
        if (shortcodeData) {
          const customCode = await getCustomCode(context.clientId, rawValue, context.caches.customCodes, t);
          const formattedValue = formatShortcodeValue(shortcodeData, customCode, format);
          return formattedValue;
        }
      }
    }
  
    const finalValue = String(rawValue);
    return finalValue;
  }

/**
 * Génère une chaîne de caractères de taxonomie en résolvant les variables et les groupes.
 */
async function generateLevelString(structure: string, context: ResolutionContext, t: (key: string) => string, isCreatif: boolean = false): Promise<string> {
  const variableResolver = async (variableName: string, format: string) => {
    return await resolveVariable(variableName, format as TaxonomyFormat, context, t, isCreatif);
  };
  
  return await processTaxonomyDelimiters(structure, variableResolver);
}

/**
 * ✅ MODIFIÉ : Régénère les taxonomies d'un placement en forçant la régénération si spécifié.
 */
async function regeneratePlacementTaxonomies(clientId: string, placementData: any, campaignData: any, tactiqueData: any, t: (key: string) => string, forceRegeneration: boolean = false): Promise<any> {

  const caches = { shortcodes: new Map(), customCodes: new Map() };
  const context: ResolutionContext = { 
    clientId, 
    campaignData, 
    tactiqueData, 
    placementData, 
    caches,
    forceRegeneration // ✅ Nouveau flag
  };

  const processTaxonomyType = async (taxonomyId: string | undefined): Promise<string[]> => {
    if (!taxonomyId) return ['', '', '', ''];

    const taxonomy = await getTaxonomyById(clientId, taxonomyId);
    if (!taxonomy) return ['', '', '', ''];

    const levels = [
      taxonomy.NA_Name_Level_1, taxonomy.NA_Name_Level_2,
      taxonomy.NA_Name_Level_3, taxonomy.NA_Name_Level_4
    ];

    return Promise.all(levels.map(level => generateLevelString(level || '', context, t, false)));
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
 * ✅ MODIFIÉ : Régénère les taxonomies d'un créatif en forçant la régénération si spécifié.
 */
async function regenerateCreatifTaxonomies(clientId: string, creatifData: any, campaignData: any, tactiqueData: any, placementData: any, t: (key: string) => string, forceRegeneration: boolean = false): Promise<any> {

  const caches = { shortcodes: new Map(), customCodes: new Map() };
  const context: ResolutionContext = {
    clientId,
    campaignData,
    tactiqueData,
    placementData,
    creatifData,
    caches,
    forceRegeneration // ✅ Nouveau flag
  };

  const processTaxonomyType = async (taxonomyId: string | undefined): Promise<string[]> => {
    if (!taxonomyId) return ['', ''];

    const taxonomy = await getTaxonomyById(clientId, taxonomyId);
    if (!taxonomy) return ['', ''];

    const levels = [
      taxonomy.NA_Name_Level_5 || '',
      taxonomy.NA_Name_Level_6 || ''
    ];

    return Promise.all(levels.map(level => generateLevelString(level, context, t, true)));
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
 * ✅ NOUVEAU : Hook spécialement conçu pour la mise à jour des taxonomies après déplacement.
 * Force une régénération complète des taxonomies basée sur le nouveau contexte hiérarchique.
 */
export const useUpdateTaxonomiesAfterMove = () => {
  const { t } = useTranslation();
  /**
   * ✅ Met à jour les taxonomies après un déplacement en forçant une régénération complète.
   * Cette fonction ignore les valeurs manuelles existantes et recalcule tout basé sur le nouveau contexte.
   */
  const updateTaxonomiesAfterMove = async (parentType: ParentType, parentData: ParentData) => {
    const batch = writeBatch(db);
    let updatedCount = 0;

    try {
      const clientId = parentData.clientId;
      if (!clientId) {
        console.error(t('useUpdateTaxonomiesAfterMove.errors.missingClientId'));
        return;
      }

      let campaignId: string;
      if (parentType === 'campaign') {
        campaignId = parentData.id;
      } else {
        if (parentData.campaignId) {
          campaignId = parentData.campaignId;
        } else {
          console.error(t('useUpdateTaxonomiesAfterMove.errors.missingCampaignId'));
          return;
        }
      }

      console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: updateTaxonomiesAfterMove - Path: clients/${clientId}/campaigns/${campaignId}");
      const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
      const campaignSnap = await getDoc(campaignRef);

      if (!campaignSnap.exists()) {
        console.error(t('useUpdateTaxonomiesAfterMove.errors.campaignNotFound'));
        return;
      }

      const campaignSnapData = campaignSnap.data();
      if (!campaignSnapData) {
        console.error(t('useUpdateTaxonomiesAfterMove.errors.emptyCampaignData'));
        return;
      }

      const campaignData = { ...campaignSnapData, clientId };

      console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: updateTaxonomiesAfterMove - Path: clients/${clientId}/campaigns/${campaignId}/versions");
      const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions');
      const versionsSnap = await getDocs(versionsRef);

      for (const versionDoc of versionsSnap.docs) {
        const versionId = versionDoc.id;

        console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: updateTaxonomiesAfterMove - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets");
        const ongletsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets');
        const ongletsSnap = await getDocs(ongletsRef);

        for (const ongletDoc of ongletsSnap.docs) {
          const ongletId = ongletDoc.id;

          console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: updateTaxonomiesAfterMove - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections");
          const sectionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections');
          const sectionsSnap = await getDocs(sectionsRef);

          for (const sectionDoc of sectionsSnap.docs) {
            const sectionId = sectionDoc.id;

            console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: updateTaxonomiesAfterMove - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques");
            const tactiquesRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques');
            const tactiquesSnap = await getDocs(tactiquesRef);

            for (const tactiqueDoc of tactiquesSnap.docs) {
              const tactiqueId = tactiqueDoc.id;
              const tactiqueData = tactiqueDoc.data();

              console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: updateTaxonomiesAfterMove - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
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
                    // ✅ Force la régénération complète des taxonomies
                    const updatedFields = await regeneratePlacementTaxonomies(clientId, placementData, campaignData, tactiqueData, t, true);
                    console.log("FIREBASE: ÉCRITURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: updateTaxonomiesAfterMove - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
                    const placementRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId);
                    batch.update(placementRef, updatedFields);
                    updatedCount++;
                  } catch (error) {
                    console.error(`${t('useUpdateTaxonomiesAfterMove.errors.placementError')} ${placementId}:`, error);
                  }
                }

                console.log("FIREBASE: LECTURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: updateTaxonomiesAfterMove - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs");
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
                      // ✅ Force la régénération complète des taxonomies
                      const updatedFields = await regenerateCreatifTaxonomies(clientId, creatifData, campaignData, tactiqueData, placementData, t, true);
                      console.log("FIREBASE: ÉCRITURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: updateTaxonomiesAfterMove - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifId}");
                      const creatifRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId, 'creatifs', creatifId);
                      batch.update(creatifRef, updatedFields);
                      updatedCount++;
                    } catch (error) {
                      console.error(`${t('useUpdateTaxonomiesAfterMove.errors.creativeError')} ${creatifId}:`, error);
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (updatedCount > 0) {
        console.log(`🔄 [UpdateTaxonomiesAfterMove] Mise à jour forcée de ${updatedCount} éléments`);
        console.log("FIREBASE: ÉCRITURE - Fichier: useUpdateTaxonomiesAfterMove.ts - Fonction: updateTaxonomiesAfterMove - Path: Batch commit");
        await batch.commit();
        console.log(`✅ [UpdateTaxonomiesAfterMove] ${updatedCount} taxonomies régénérées avec succès`);
      } else {
        console.log('ℹ️ [UpdateTaxonomiesAfterMove] Aucune taxonomie à mettre à jour');
      }

    } catch (error) {
      console.error(t('useUpdateTaxonomiesAfterMove.errors.generalError'), error);
      throw new Error(t('useUpdateTaxonomiesAfterMove.errors.regenerationFailed'));
    }
  };

  return { updateTaxonomiesAfterMove };
};