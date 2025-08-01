// app/config/placementFieldLabels.ts
// Ce fichier contient le mapping entre les noms techniques des champs de placement et leurs labels affichables

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
   * Obtient le label affiché pour un champ de placement donné.
   * Si aucun label personnalisé n'est trouvé, retourne le nom du champ nettoyé.
   * 
   * @param fieldName - Le nom technique du champ (ex: "PL_Audience_Behaviour")
   * @param customLabel - Un label personnalisé optionnel (utilisé pour les dimensions custom)
   * @returns Le label à afficher dans l'interface
   */
  export function getPlacementFieldLabel(fieldName: string, customLabel?: string): string {
    // Si un label personnalisé est fourni (cas des dimensions custom), l'utiliser
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
   * Nettoie un nom de champ technique pour le rendre plus lisible.
   * Exemple: "PL_Audience_Behaviour" → "Audience Behaviour"
   * 
   * @param fieldName - Le nom technique du champ
   * @returns Le nom nettoyé
   */
  function cleanFieldName(fieldName: string): string {
    return fieldName
      .replace(/^PL_/, '') // Enlever le préfixe PL_
      .replace(/_/g, ' ')  // Remplacer les underscores par des espaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Mettre en majuscule la première lettre de chaque mot
  }
  
  /**
   * Vérifie si un champ est une dimension personnalisée
   * 
   * @param fieldName - Le nom du champ à vérifier
   * @returns true si c'est une dimension personnalisée
   */
  export function isCustomDimension(fieldName: string): boolean {
    return ['PL_Custom_Dim_1', 'PL_Custom_Dim_2', 'PL_Custom_Dim_3'].includes(fieldName);
  }