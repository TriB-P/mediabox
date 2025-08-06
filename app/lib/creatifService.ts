// app/lib/creatifService.ts

/**
 * Ce fichier gère toutes les opérations CRUD (Create, Read, Update, Delete)
 * pour les créatifs dans Firebase Firestore. Il inclut également une logique complexe
 * pour résoudre et formater les variables de taxonomie basées sur les données
 * de la campagne, de la tactique et du placement, ainsi que les valeurs
 * spécifiques du créatif.
 *
 * Il assure que les données du créatif sont correctement préparées avant
 * d'être sauvegardées ou mises à jour dans la base de données, en intégrant
 * les chaînes de taxonomie générées automatiquement.
 * 
 * MISE À JOUR : Ajout des nouveaux champs Tags (CR_Tag_Start_Date, CR_Tag_End_Date, CR_Rotation_Weight)
 * NOUVEAU : Calcul automatique du champ CR_Sprint_Dates (format MMMdd-MMMdd)
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
import { Creatif, CreatifFormData, GeneratedTaxonomies } from '../types/tactiques';
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

/**
 * Formate une date en format MMMdd (ex: "Jan15", "Feb28")
 * @param dateString Date au format ISO (YYYY-MM-DD)
 * @returns Date formatée en MMMdd ou chaîne vide si invalide
 */
function formatDateToMMMdd(dateString: string): string {
    if (!dateString) return '';
    
    try {
        // Parse directement la chaîne pour éviter les problèmes de fuseau horaire
        const dateParts = dateString.split('-');
        if (dateParts.length !== 3) return '';
        
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Les mois JavaScript commencent à 0
        const day = parseInt(dateParts[2], 10);
        
        if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
        if (month < 0 || month > 11 || day < 1 || day > 31) return '';
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const monthName = monthNames[month];
        const dayFormatted = day.toString().padStart(2, '0');
        
        return `${monthName}${dayFormatted}`;
    } catch (error) {
        console.error('Erreur lors du formatage de la date:', error);
        return '';
    }
}

/**
 * Calcule le champ CR_Sprint_Dates basé sur CR_Start_Date et CR_End_Date
 * @param startDate Date de début au format ISO
 * @param endDate Date de fin au format ISO
 * @returns Chaîne formatée "MMMdd-MMMdd" ou chaîne vide si dates invalides
 */
function calculateSprintDates(startDate: string, endDate: string): string {
    const startFormatted = formatDateToMMMdd(startDate);
    const endFormatted = formatDateToMMMdd(endDate);
    
    if (startFormatted && endFormatted) {
        return `${startFormatted}-${endFormatted}`;
    }
    return '';
}

/**
 * Récupère les données d'un shortcode à partir de son ID.
 * Utilise un cache pour éviter les lectures répétées depuis Firestore.
 * @param id L'ID du shortcode.
 * @param cache Le Map de cache pour stocker les données des shortcodes.
 * @returns Les données du shortcode ou null si non trouvé.
 */
async function getShortcode(id: string, cache: Map<string, any>): Promise<any | null> {
    if (cache.has(id)) return cache.get(id);
    console.log("FIREBASE: LECTURE - Fichier: creatifService.ts - Fonction: getShortcode - Path: shortcodes/${id}");
    const docRef = doc(db, 'shortcodes', id);
    const docSnap = await getDoc(docRef);
    const data = docSnap.exists() ? docSnap.data() : null;
    cache.set(id, data);
    return data;
}

/**
 * Récupère le code personnalisé pour un shortcode donné et un client spécifique.
 * Utilise un cache pour éviter les lectures répétées.
 * @param clientId L'ID du client.
 * @param shortcodeId L'ID du shortcode.
 * @param cache Le Map de cache pour stocker les codes personnalisés.
 * @returns Le code personnalisé ou null si non trouvé.
 */
async function getCustomCode(clientId: string, shortcodeId: string, cache: Map<string, string | null>): Promise<string | null> {
    const cacheKey = `${clientId}__${shortcodeId}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey)!;

    console.log("FIREBASE: LECTURE - Fichier: creatifService.ts - Fonction: getCustomCode - Path: clients/${clientId}/customCodes");
    const q = query(collection(db, 'clients', clientId, 'customCodes'), where('shortcodeId', '==', shortcodeId));
    const snapshot = await getDocs(q);
    const data = snapshot.empty ? null : snapshot.docs[0].data().customCode;
    cache.set(cacheKey, data);
    return data;
}

/**
 * Formate la valeur d'un shortcode en fonction du format demandé et d'un code personnalisé.
 * @param shortcodeData Les données brutes du shortcode.
 * @param customCode Le code personnalisé à utiliser, s'il existe.
 * @param format Le format de sortie désiré (ex: 'code', 'display_fr', 'utm').
 * @returns La valeur formatée du shortcode.
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
  
  
  async function resolveVariable(variableName: string, format: TaxonomyFormat, context: ResolutionContext): Promise<string> {
    const source = getFieldSource(variableName);
    let rawValue: any = null;

    // 1. Vérifier d'abord les champs directs du créatif (ex: CR_CTA, CR_Offer)
    if (isCreatifVariable(variableName) && context.creatifData) {
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
    }

    // 2. Résolution selon la source avec correction pour les placements
    if (source === 'campaign' && context.campaignData) {
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

    // 3. Formatage de la valeur si c'est un shortcode
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
 * Génère une chaîne de taxonomie en résolvant les variables contenues dans une structure donnée.
 * La fonction parcourt la structure, identifie les variables (ex: [PL_Product:code]) et les groupes (<...>),
 * puis résout chaque variable en utilisant le contexte fourni.
 * @param structure La chaîne de structure de taxonomie à traiter (ex: "[PL_Product:code]_[PL_Audience:display_fr]").
 * @param context Le contexte de résolution.
 * @returns La chaîne de taxonomie finale avec les variables résolues.
 */
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
                const resolvedValue = await resolveVariable(variableName, format as TaxonomyFormat, context);
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

/**
 * Prépare les données du créatif pour le stockage dans Firestore.
 * Cela inclut la résolution des variables de taxonomie pour générer
 * les chaînes de niveau 5 et 6 pour les tags, plateformes et Media Ocean,
 * ainsi que la gestion des nouveaux champs specs et tags.
 * MISE À JOUR : Inclut maintenant les nouveaux champs Tags et le calcul de CR_Sprint_Dates.
 * @param creatifData Les données du formulaire du créatif.
 * @param clientId L'ID du client.
 * @param campaignData Les données de la campagne associée.
 * @param tactiqueData Les données de la tactique associée.
 * @param placementData Les données du placement associé.
 * @param isUpdate Indique si c'est une opération de mise à jour (pour gérer les champs createdAt/updatedAt).
 * @returns Un objet de données prêt à être sauvegardé dans Firestore.
 */
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

    /**
     * Traite un type de taxonomie donné en générant les chaînes de niveau 5 et 6.
     */
    const processTaxonomyType = async (taxonomyId: string | undefined): Promise<string[]> => {
        if (!taxonomyId) return ['', ''];
        console.log("FIREBASE: LECTURE - Fichier: creatifService.ts - Fonction: processTaxonomyType - Path: clients/${clientId}/taxonomies/${taxonomyId}");
        const taxonomy = await getTaxonomyById(clientId, taxonomyId);
        if (!taxonomy) return ['', ''];

        // LEVELS 5-6 for creatives
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

    // Creative taxonomy chains (levels 5-6)
    const taxonomyChains = {
        CR_Tag_5: tagChains[0],
        CR_Tag_6: tagChains[1],
        CR_Plateforme_5: platformChains[0],
        CR_Plateforme_6: platformChains[1],
        CR_MO_5: moChains[0],
        CR_MO_6: moChains[1],
    };

    // Extraire tous les champs spécifiques aux créatifs (incluant les variables taxonomie)
    const creatifFieldNames = getCreatifVariableNames();
    const creatifFields: any = {};
    creatifFieldNames.forEach(fieldName => {
        if (fieldName in creatifData) {
            creatifFields[fieldName] = (creatifData as any)[fieldName] || '';
        }
    });

    // Gestion des champs specs
    const specFields = {
        CR_Spec_PartnerId: creatifData.CR_Spec_PartnerId || '',
        CR_Spec_SelectedSpecId: creatifData.CR_Spec_SelectedSpecId || '',
        CR_Spec_Name: creatifData.CR_Spec_Name || '',
        CR_Spec_Format: creatifData.CR_Spec_Format || '',
        CR_Spec_Ratio: creatifData.CR_Spec_Ratio || '',
        CR_Spec_FileType: creatifData.CR_Spec_FileType || '',
        CR_Spec_MaxWeight: creatifData.CR_Spec_MaxWeight || '',
        CR_Spec_Weight: creatifData.CR_Spec_Weight || '',
        CR_Spec_Animation: creatifData.CR_Spec_Animation || '',
        CR_Spec_Title: creatifData.CR_Spec_Title || '',
        CR_Spec_Text: creatifData.CR_Spec_Text || '',
        CR_Spec_SpecSheetLink: creatifData.CR_Spec_SpecSheetLink || '',
        CR_Spec_Notes: creatifData.CR_Spec_Notes || '',
    };

    // 🔥 NOUVEAUX CHAMPS TAGS - Ajout explicite pour garantir la sauvegarde
    const tagsFields = {
        CR_Tag_Start_Date: creatifData.CR_Tag_Start_Date || '',
        CR_Tag_End_Date: creatifData.CR_Tag_End_Date || '',
        CR_Rotation_Weight: creatifData.CR_Rotation_Weight || '',
    };

    // 🔥 NOUVEAU CHAMP CALCULÉ - Sprint Dates
    const sprintDates = calculateSprintDates(
        creatifData.CR_Start_Date || '',
        creatifData.CR_End_Date || ''
    );

    const firestoreData = {
        CR_Label: creatifData.CR_Label || '',
        CR_Order: creatifData.CR_Order || 0,
        CR_PlacementId: creatifData.CR_PlacementId,
        CR_Start_Date: creatifData.CR_Start_Date || '',
        CR_End_Date: creatifData.CR_End_Date || '',
        CR_Sprint_Dates: sprintDates, // 🔥 NOUVEAU CHAMP CALCULÉ
        CR_Taxonomy_Tags: creatifData.CR_Taxonomy_Tags || '',
        CR_Taxonomy_Platform: creatifData.CR_Taxonomy_Platform || '',
        CR_Taxonomy_MediaOcean: creatifData.CR_Taxonomy_MediaOcean || '',
        // ✅ SUPPRIMÉ : CR_Taxonomy_Values (plus nécessaire)
        CR_Generated_Taxonomies: {
            tags: tagChains.filter(Boolean).join('|'),
            platform: platformChains.filter(Boolean).join('|'),
            mediaocean: moChains.filter(Boolean).join('|'),
        },
        ...creatifFields,    // ✅ INCLUT maintenant directement CR_CTA, CR_Offer, etc.
        ...taxonomyChains,
        ...specFields,
        ...tagsFields,       // 🔥 NOUVEAUX CHAMPS TAGS
        updatedAt: new Date().toISOString(),
        ...(!isUpdate && { createdAt: new Date().toISOString() })
    };

    // Clean up undefined values
    Object.keys(firestoreData).forEach(key => {
        if ((firestoreData as any)[key] === undefined) {
            (firestoreData as any)[key] = '';
        }
    });

    return firestoreData;
}
/**
 * Crée un nouveau créatif dans la base de données Firestore.
 * Les données du créatif sont préparées, incluant la résolution des taxonomies,
 * avant d'être ajoutées.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionId L'ID de la section.
 * @param tactiqueId L'ID de la tactique.
 * @param placementId L'ID du placement auquel le créatif appartient.
 * @param creatifData Les données du créatif à créer.
 * @param campaignData Les données optionnelles de la campagne pour la résolution des taxonomies.
 * @param tactiqueData Les données optionnelles de la tactique pour la résolution des taxonomies.
 * @param placementData Les données optionnelles du placement pour la résolution des taxonomies.
 * @returns L'ID du nouveau créatif créé.
 */
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

    console.log("FIREBASE: ÉCRITURE - Fichier: creatifService.ts - Fonction: createCreatif - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs");
    const docRef = await addDoc(creatifsCollection, firestoreData);

    return docRef.id;
}

/**
 * Met à jour un créatif existant dans la base de données Firestore.
 * Les données existantes sont fusionnées avec les nouvelles et les taxonomies sont résolues à nouveau.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionId L'ID de la section.
 * @param tactiqueId L'ID de la tactique.
 * @param placementId L'ID du placement.
 * @param creatifId L'ID du créatif à mettre à jour.
 * @param creatifData Les données partielles du créatif à mettre à jour.
 * @param campaignData Les données optionnelles de la campagne pour la résolution des taxonomies.
 * @param tactiqueData Les données optionnelles de la tactique pour la résolution des taxonomies.
 * @param placementData Les données optionnelles du placement pour la résolution des taxonomies.
 */
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

    console.log("FIREBASE: LECTURE - Fichier: creatifService.ts - Fonction: updateCreatif - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifId}");
    const existingDoc = await getDoc(creatifRef);
    if (!existingDoc.exists()) throw new Error('Creative not found');

    const mergedData = { ...existingDoc.data(), ...creatifData } as CreatifFormData;
    const firestoreData = await prepareDataForFirestore(
        mergedData, clientId, campaignData, tactiqueData, placementData, true
    );

    console.log("FIREBASE: ÉCRITURE - Fichier: creatifService.ts - Fonction: updateCreatif - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifId}");
    await updateDoc(creatifRef, firestoreData);
}

/**
 * Récupère tous les créatifs associés à un placement spécifique.
 * Les créatifs sont triés par leur ordre (CR_Order).
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionId L'ID de la section.
 * @param tactiqueId L'ID de la tactique.
 * @param placementId L'ID du placement.
 * @returns Une promesse qui résout en un tableau de créatifs.
 * @throws Lance une erreur si la récupération échoue.
 */
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

        console.log("FIREBASE: LECTURE - Fichier: creatifService.ts - Fonction: getCreatifsForPlacement - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs");
        const q = query(creatifsRef, orderBy('CR_Order', 'asc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creatif));
    } catch (error) {
        console.error("Erreur lors de la récupération des créatifs:", error);
        throw error;
    }
}

/**
 * Supprime un créatif spécifique de la base de données Firestore.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionId L'ID de la section.
 * @param tactiqueId L'ID de la tactique.
 * @param placementId L'ID du placement.
 * @param creatifId L'ID du créatif à supprimer.
 * @returns Une promesse qui résout une fois la suppression effectuée.
 * @throws Lance une erreur si la suppression échoue.
 */
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

        console.log("FIREBASE: ÉCRITURE - Fichier: creatifService.ts - Fonction: deleteCreatif - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifId}");
        await deleteDoc(creatifRef);

    } catch (error) {
        console.error("Erreur lors de la suppression du créatif:", error);
        throw error;
    }
}