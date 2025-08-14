// app/config/TaxonomyFieldLabels.ts
// Configuration complète des labels de champs avec traduction obligatoire
// Tous les labels sont maintenant traduits dynamiquement - t() est obligatoire

/**
 * Interface pour la configuration client contenant les labels personnalisés
 */
export interface ClientConfig {
  Custom_Dim_PL_1?: string;
  Custom_Dim_PL_2?: string;
  Custom_Dim_PL_3?: string;
  Custom_Dim_CR_1?: string;
  Custom_Dim_CR_2?: string;
  Custom_Dim_CR_3?: string;
}

/**
 * Mapping des noms techniques des champs de placement vers leurs clés de traduction
 */
export const getPlacementFieldLabels = (t: (key: string) => string): Record<string, string> => ({
  // Champs d'audience
  PL_Audience_Behaviour: t('fields.placement.audienceBehaviour'),
  PL_Audience_Demographics: t('fields.placement.audienceDemographics'), 
  PL_Audience_Engagement: t('fields.placement.audienceEngagement'),
  PL_Audience_Interest: t('fields.placement.audienceInterest'),
  PL_Audience_Other: t('fields.placement.audienceOther'),
  
  // Champs de créatif et groupement
  PL_Creative_Grouping: t('fields.placement.creativeGrouping'),
  
  // Champs techniques
  PL_Device: t('fields.placement.device'),
  PL_Channel: t('fields.placement.channel'),
  PL_Format: t('fields.placement.format'),
  PL_Language: t('fields.placement.language'),
  
  // Champs de marché et produit
  PL_Market_Details: t('fields.placement.marketDetails'),
  PL_Product: t('fields.placement.product'),
  
  // Champs de segmentation et tactiques
  PL_Segment_Open: t('fields.placement.segmentOpen'),
  PL_Tactic_Category: t('fields.placement.tacticCategory'),
  PL_Targeting: t('fields.placement.targeting'),
  
  // Champs de localisation
  PL_Placement_Location: t('fields.placement.placementLocation'),
  
  // Dimensions personnalisées (labels par défaut - seront remplacés par la config client)
  PL_Custom_Dim_1: t('fields.placement.customDim1'),
  PL_Custom_Dim_2: t('fields.placement.customDim2'), 
  PL_Custom_Dim_3: t('fields.placement.customDim3'),
  
  // Champs de base du placement
  PL_Label: t('fields.placement.label'),
  PL_Order: t('fields.placement.order'),
  PL_TactiqueId: t('fields.placement.tactiqueId'),
  PL_Taxonomy_Tags: t('fields.placement.taxonomyTags'),
  PL_Taxonomy_Platform: t('fields.placement.taxonomyPlatform'),
  PL_Taxonomy_MediaOcean: t('fields.placement.taxonomyMediaOcean')
});

/**
 * Mapping des noms techniques des champs de créatifs vers leurs clés de traduction
 */
export const getCreatifFieldLabels = (t: (key: string) => string): Record<string, string> => ({
  // Dimensions personnalisées (labels par défaut - seront remplacés par la config client)
  CR_Custom_Dim_1: t('fields.creatif.customDim1'),
  CR_Custom_Dim_2: t('fields.creatif.customDim2'),
  CR_Custom_Dim_3: t('fields.creatif.customDim3'),
  
  // Champs spécifiques aux créatifs
  CR_CTA: t('fields.creatif.cta'),
  CR_Format_Details: t('fields.creatif.formatDetails'),
  CR_Offer: t('fields.creatif.offer'),
  CR_Plateform_Name: t('fields.creatif.platformName'),
  CR_Primary_Product: t('fields.creatif.primaryProduct'),
  CR_URL: t('fields.creatif.url'),
  CR_Version: t('fields.creatif.version'),
  
  // Champs de base du créatif
  CR_Label: t('fields.creatif.label'),
  CR_Order: t('fields.creatif.order'),
  CR_PlacementId: t('fields.creatif.placementId'),
  CR_Start_Date: t('fields.creatif.startDate'),
  CR_End_Date: t('fields.creatif.endDate'),
  CR_Sprint_Dates: t('fields.creatif.sprintDates'),
  CR_Taxonomy_Tags: t('fields.creatif.taxonomyTags'),
  CR_Taxonomy_Platform: t('fields.creatif.taxonomyPlatform'),
  CR_Taxonomy_MediaOcean: t('fields.creatif.taxonomyMediaOcean'),
  
  // Champs specs
  CR_Spec_PartnerId: t('fields.creatif.specPartnerId'),
  CR_Spec_SelectedSpecId: t('fields.creatif.specSelectedSpecId'),
  CR_Spec_Name: t('fields.creatif.specName'),
  CR_Spec_Format: t('fields.creatif.specFormat'),
  CR_Spec_Ratio: t('fields.creatif.specRatio'),
  CR_Spec_FileType: t('fields.creatif.specFileType'),
  CR_Spec_MaxWeight: t('fields.creatif.specMaxWeight'),
  CR_Spec_Weight: t('fields.creatif.specWeight'),
  CR_Spec_Animation: t('fields.creatif.specAnimation'),
  CR_Spec_Title: t('fields.creatif.specTitle'),
  CR_Spec_Text: t('fields.creatif.specText'),
  CR_Spec_SpecSheetLink: t('fields.creatif.specSheetLink'),
  CR_Spec_Notes: t('fields.creatif.specNotes')
});

/**
 * MODIFIÉ : Obtient le label affiché pour un champ de placement donné avec traduction obligatoire.
 * Vérifie d'abord dans la configuration client pour les dimensions personnalisées.
 * 
 * @param fieldName - Le nom technique du champ (ex: "PL_Audience_Behaviour")
 * @param t - La fonction de traduction (obligatoire)
 * @param clientConfig - La configuration client optionnelle contenant les labels personnalisés
 * @param customLabel - Un label personnalisé optionnel (fallback si clientConfig n'est pas fourni)
 * @returns Le label à afficher dans l'interface
 */
export function getPlacementFieldLabel(
  fieldName: string, 
  t: (key: string) => string,
  clientConfig?: ClientConfig, 
  customLabel?: string
): string {
  // Pour les dimensions personnalisées, utiliser la config client en priorité
  if (fieldName === 'PL_Custom_Dim_1' && clientConfig?.Custom_Dim_PL_1) {
    return clientConfig.Custom_Dim_PL_1;
  }
  if (fieldName === 'PL_Custom_Dim_2' && clientConfig?.Custom_Dim_PL_2) {
    return clientConfig.Custom_Dim_PL_2;
  }
  if (fieldName === 'PL_Custom_Dim_3' && clientConfig?.Custom_Dim_PL_3) {
    return clientConfig.Custom_Dim_PL_3;
  }
  
  // Si un label personnalisé est fourni en fallback, l'utiliser
  if (customLabel) {
    return customLabel;
  }
  
  // Sinon, chercher dans le mapping traduit
  const placementLabels = getPlacementFieldLabels(t);
  if (placementLabels[fieldName]) {
    return placementLabels[fieldName];
  }
  
  // En dernier recours, nettoyer le nom technique
  return cleanFieldName(fieldName);
}

/**
 * MODIFIÉ : Obtient le label affiché pour un champ de créatif donné avec traduction obligatoire.
 * Vérifie d'abord dans la configuration client pour les dimensions personnalisées.
 * 
 * @param fieldName - Le nom technique du champ (ex: "CR_Custom_Dim_1")
 * @param t - La fonction de traduction (obligatoire)
 * @param clientConfig - La configuration client optionnelle contenant les labels personnalisés
 * @param customLabel - Un label personnalisé optionnel (fallback si clientConfig n'est pas fourni)
 * @returns Le label à afficher dans l'interface
 */
export function getCreatifFieldLabel(
  fieldName: string, 
  t: (key: string) => string,
  clientConfig?: ClientConfig, 
  customLabel?: string
): string {
  // Pour les dimensions personnalisées, utiliser la config client en priorité
  if (fieldName === 'CR_Custom_Dim_1' && clientConfig?.Custom_Dim_CR_1) {
    return clientConfig.Custom_Dim_CR_1;
  }
  if (fieldName === 'CR_Custom_Dim_2' && clientConfig?.Custom_Dim_CR_2) {
    return clientConfig.Custom_Dim_CR_2;
  }
  if (fieldName === 'CR_Custom_Dim_3' && clientConfig?.Custom_Dim_CR_3) {
    return clientConfig.Custom_Dim_CR_3;
  }
  
  // Si un label personnalisé est fourni en fallback, l'utiliser
  if (customLabel) {
    return customLabel;
  }
  
  // Sinon, chercher dans le mapping traduit
  const creatifLabels = getCreatifFieldLabels(t);
  if (creatifLabels[fieldName]) {
    return creatifLabels[fieldName];
  }
  
  // En dernier recours, nettoyer le nom technique
  return cleanFieldName(fieldName);
}

/**
 * MODIFIÉ : Fonction générique qui détermine automatiquement le type de champ et retourne le bon label.
 * Utilise le préfixe pour déterminer si c'est un champ placement (PL_) ou créatif (CR_).
 * 
 * @param fieldName - Le nom technique du champ (ex: "PL_Audience_Behaviour" ou "CR_Custom_Dim_1")
 * @param t - La fonction de traduction (obligatoire)
 * @param clientConfig - La configuration client optionnelle contenant les labels personnalisés
 * @param customLabel - Un label personnalisé optionnel (fallback si clientConfig n'est pas fourni)
 * @returns Le label à afficher dans l'interface
 */
export function getFieldLabel(
  fieldName: string, 
  t: (key: string) => string,
  clientConfig?: ClientConfig, 
  customLabel?: string
): string {
  if (fieldName.startsWith('PL_')) {
    return getPlacementFieldLabel(fieldName, t, clientConfig, customLabel);
  } else if (fieldName.startsWith('CR_')) {
    return getCreatifFieldLabel(fieldName, t, clientConfig, customLabel);
  } else {
    // Pour les champs sans préfixe, utiliser le label personnalisé ou nettoyer le nom
    return customLabel || cleanFieldName(fieldName);
  }
}

/**
 * Nettoie un nom de champ technique pour le rendre plus lisible.
 * Exemple: "PL_Audience_Behaviour" → "Audience Behaviour"
 * Exemple: "CR_Custom_Dim_1" → "Custom Dim 1"
 * 
 * @param fieldName - Le nom technique du champ
 * @returns Le nom nettoyé
 */
function cleanFieldName(fieldName: string): string {
  return fieldName
    .replace(/^(PL_|CR_)/, '') // Enlever les préfixes PL_ ou CR_
    .replace(/_/g, ' ')        // Remplacer les underscores par des espaces
    .replace(/\b\w/g, l => l.toUpperCase()); // Mettre en majuscule la première lettre de chaque mot
}

/**
 * Vérifie si un champ est une dimension personnalisée de placement
 * 
 * @param fieldName - Le nom du champ à vérifier
 * @returns true si c'est une dimension personnalisée de placement
 */
export function isCustomDimension(fieldName: string): boolean {
  return ['PL_Custom_Dim_1', 'PL_Custom_Dim_2', 'PL_Custom_Dim_3'].includes(fieldName);
}

/**
 * Vérifie si un champ est une dimension personnalisée de créatif
 * 
 * @param fieldName - Le nom du champ à vérifier
 * @returns true si c'est une dimension personnalisée de créatif
 */
export function isCreatifCustomDimension(fieldName: string): boolean {
  return ['CR_Custom_Dim_1', 'CR_Custom_Dim_2', 'CR_Custom_Dim_3'].includes(fieldName);
}

/**
 * Vérifie si un champ est une dimension personnalisée (placement ou créatif)
 * 
 * @param fieldName - Le nom du champ à vérifier
 * @returns true si c'est une dimension personnalisée (peu importe le type)
 */
export function isAnyCustomDimension(fieldName: string): boolean {
  return isCustomDimension(fieldName) || isCreatifCustomDimension(fieldName);
}

/**
 * Détermine le type de champ basé sur son préfixe
 * 
 * @param fieldName - Le nom du champ à analyser
 * @returns 'placement' | 'creatif' | 'unknown'
 */
export function getFieldType(fieldName: string): 'placement' | 'creatif' | 'unknown' {
  if (fieldName.startsWith('PL_')) {
    return 'placement';
  } else if (fieldName.startsWith('CR_')) {
    return 'creatif';
  } else {
    return 'unknown';
  }
}