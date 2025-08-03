// app/config/TaxonomyFieldLabels.ts
// Ce fichier contient le mapping entre les noms techniques des champs de placement ET créatifs et leurs labels affichables

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
 * Mapping des noms techniques des champs de placement vers des labels lisibles
 * pour l'interface utilisateur.
 */
export const PLACEMENT_FIELD_LABELS: Record<string, string> = {
  // Champs d'audience
  PL_Audience_Behaviour: 'Audience Behavior',
  PL_Audience_Demographics: 'Audience Demographics', 
  PL_Audience_Engagement: 'Audience Engagement',
  PL_Audience_Interest: 'Audience Interest',
  PL_Audience_Other: 'Audience Other',
  
  // Champs de créatif et groupement
  PL_Creative_Grouping: 'Creative Grouping',
  
  // Champs techniques
  PL_Device: 'Device',
  PL_Channel: 'Channel',
  PL_Format: 'Format',
  PL_Language: 'Language',
  
  // Champs de marché et produit
  PL_Market_Details: 'Market Details',
  PL_Product: 'Product',
  
  // Champs de segmentation et tactiques
  PL_Segment_Open: 'Segment Open',
  PL_Tactic_Category: 'Tactic Category',
  PL_Targeting: 'Targeting',
  
  // Champs de localisation
  PL_Placement_Location: 'Placement Location',
  
  // Dimensions personnalisées (labels par défaut - seront remplacés par la config client)
  PL_Custom_Dim_1: 'Custom Dimension 1',
  PL_Custom_Dim_2: 'Custom Dimension 2', 
  PL_Custom_Dim_3: 'Custom Dimension 3',
  
  // Champs de base du placement
  PL_Label: 'Label',
  PL_Order: 'Order',
  PL_TactiqueId: 'Tactic ID',
  PL_Taxonomy_Tags: 'Taxonomy Tags',
  PL_Taxonomy_Platform: 'Taxonomy Platform',
  PL_Taxonomy_MediaOcean: 'Taxonomy MediaOcean'
};

/**
 * Mapping des noms techniques des champs de créatifs vers des labels lisibles
 * pour l'interface utilisateur.
 */
export const CREATIF_FIELD_LABELS: Record<string, string> = {
  // Dimensions personnalisées (labels par défaut - seront remplacés par la config client)
  CR_Custom_Dim_1: 'Custom Dimension 1',
  CR_Custom_Dim_2: 'Custom Dimension 2',
  CR_Custom_Dim_3: 'Custom Dimension 3',
  
  // Champs spécifiques aux créatifs
  CR_CTA: 'Call to Action',
  CR_Format_Details: 'Format Details',
  CR_Offer: 'Offer',
  CR_Plateform_Name: 'Platform Name',
  CR_Primary_Product: 'Primary Product',
  CR_URL: 'URL',
  CR_Version: 'Version',
  
  // Champs de base du créatif
  CR_Label: 'Label',
  CR_Order: 'Order',
  CR_PlacementId: 'Placement ID',
  CR_Start_Date: 'Start Date',
  CR_End_Date: 'End Date',
  CR_Taxonomy_Tags: 'Taxonomy Tags',
  CR_Taxonomy_Platform: 'Taxonomy Platform',
  CR_Taxonomy_MediaOcean: 'Taxonomy MediaOcean',
  
  // Champs specs
  CR_Spec_PartnerId: 'Partner ID',
  CR_Spec_SelectedSpecId: 'Selected Spec ID',
  CR_Spec_Name: 'Spec Name',
  CR_Spec_Format: 'Spec Format',
  CR_Spec_Ratio: 'Aspect Ratio',
  CR_Spec_FileType: 'File Type',
  CR_Spec_MaxWeight: 'Max Weight',
  CR_Spec_Weight: 'Weight',
  CR_Spec_Animation: 'Animation',
  CR_Spec_Title: 'Title',
  CR_Spec_Text: 'Text',
  CR_Spec_SpecSheetLink: 'Spec Sheet Link',
  CR_Spec_Notes: 'Notes'
};

/**
 * MODIFIÉ : Obtient le label affiché pour un champ de placement donné.
 * Vérifie d'abord dans la configuration client pour les dimensions personnalisées.
 * 
 * @param fieldName - Le nom technique du champ (ex: "PL_Audience_Behaviour")
 * @param clientConfig - La configuration client optionnelle contenant les labels personnalisés
 * @param customLabel - Un label personnalisé optionnel (fallback si clientConfig n'est pas fourni)
 * @returns Le label à afficher dans l'interface
 */
export function getPlacementFieldLabel(fieldName: string, clientConfig?: ClientConfig, customLabel?: string): string {
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
  
  // Sinon, chercher dans le mapping
  if (PLACEMENT_FIELD_LABELS[fieldName]) {
    return PLACEMENT_FIELD_LABELS[fieldName];
  }
  
  // En dernier recours, nettoyer le nom technique
  return cleanFieldName(fieldName);
}

/**
 * MODIFIÉ : Obtient le label affiché pour un champ de créatif donné.
 * Vérifie d'abord dans la configuration client pour les dimensions personnalisées.
 * 
 * @param fieldName - Le nom technique du champ (ex: "CR_Custom_Dim_1")
 * @param clientConfig - La configuration client optionnelle contenant les labels personnalisés
 * @param customLabel - Un label personnalisé optionnel (fallback si clientConfig n'est pas fourni)
 * @returns Le label à afficher dans l'interface
 */
export function getCreatifFieldLabel(fieldName: string, clientConfig?: ClientConfig, customLabel?: string): string {
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
  
  // Sinon, chercher dans le mapping
  if (CREATIF_FIELD_LABELS[fieldName]) {
    return CREATIF_FIELD_LABELS[fieldName];
  }
  
  // En dernier recours, nettoyer le nom technique
  return cleanFieldName(fieldName);
}

/**
 * MODIFIÉ : Fonction générique qui détermine automatiquement le type de champ et retourne le bon label.
 * Utilise le préfixe pour déterminer si c'est un champ placement (PL_) ou créatif (CR_).
 * 
 * @param fieldName - Le nom technique du champ (ex: "PL_Audience_Behaviour" ou "CR_Custom_Dim_1")
 * @param clientConfig - La configuration client optionnelle contenant les labels personnalisés
 * @param customLabel - Un label personnalisé optionnel (fallback si clientConfig n'est pas fourni)
 * @returns Le label à afficher dans l'interface
 */
export function getFieldLabel(fieldName: string, clientConfig?: ClientConfig, customLabel?: string): string {
  if (fieldName.startsWith('PL_')) {
    return getPlacementFieldLabel(fieldName, clientConfig, customLabel);
  } else if (fieldName.startsWith('CR_')) {
    return getCreatifFieldLabel(fieldName, clientConfig, customLabel);
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