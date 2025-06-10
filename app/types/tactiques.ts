// app/types/tactiques.ts - MISE À JOUR POUR MULTIPLES FORMATS

// Types pour le module de tactiques

// ==================== IMPORTS DES NOUVEAUX TYPES ====================

import type { TaxonomyFormat, FieldSource } from '../config/taxonomyFields';
export type { TaxonomyFormat, FieldSource }; 

// ==================== TYPES EXISTANTS (INCHANGÉS) ====================

export interface Section {
  id: string;
  SECTION_Name: string;
  SECTION_Order: number;
  SECTION_Color?: string;
  SECTION_Budget?: number; // Calculé à partir de la somme des budgets des tactiques
}

export interface Tactique {
  id: string;
  TC_Label: string;
  TC_Budget: number;
  TC_Order: number;
  TC_SectionId: string; // Référence à la section parente
  TC_Status?: 'Planned' | 'Active' | 'Completed' | 'Cancelled'; // Statut de la tactique
  
  // Champs Info
  TC_Bucket?: string; // Référence à l'enveloppe budgétaire
  
  // Champs Stratégie - Section principale
  TC_LoB?: string; // Ligne d'affaire
  TC_Media_Type?: string; // Type média
  TC_Publisher?: string; // Partenaire
  TC_Inventory?: string; // Inventaire
  TC_Product_Open?: string; // Description du produit
  TC_Targeting_Open?: string; // Description de l'audience
  TC_Market_Open?: string; // Description du marché
  TC_Frequence?: string; // Fréquence
  TC_Location?: string; // Description de l'emplacement
  TC_Market?: string; // Marché (liste dynamique)
  TC_Language?: string; // Langue
  TC_Format_Open?: string; // Description du format
  
  // Champs Stratégie - Champs personnalisés
  TC_Buying_Method?: string; // Méthode d'achat
  TC_Custom_Dim_1?: string; // Dimension personnalisée 1
  TC_Custom_Dim_2?: string; // Dimension personnalisée 2
  TC_Custom_Dim_3?: string; // Dimension personnalisée 3
  
  // Champs Stratégie - Production
  TC_NumberCreatives?: string; // Nombre de créatifs suggérés
  TC_AssetDate?: string; // Date de livraison des créatifs
  
  // Champs KPI
  TC_Media_Objective?: string; // Objectif média
  
  // KPIs multiples (jusqu'à 5)
  TC_Kpi?: string; // KPI principal
  TC_Kpi_CostPer?: number; // Coût par principal
  TC_Kpi_Volume?: number; // Volume principal
  TC_Kpi_2?: string; // KPI 2
  TC_Kpi_CostPer_2?: number; // Coût par 2
  TC_Kpi_Volume_2?: number; // Volume 2
  TC_Kpi_3?: string; // KPI 3
  TC_Kpi_CostPer_3?: number; // Coût par 3
  TC_Kpi_Volume_3?: number; // Volume 3
  TC_Kpi_4?: string; // KPI 4
  TC_Kpi_CostPer_4?: number; // Coût par 4
  TC_Kpi_Volume_4?: number; // Volume 4
  TC_Kpi_5?: string; // KPI 5
  TC_Kpi_CostPer_5?: number; // Coût par 5
  TC_Kpi_Volume_5?: number; // Volume 5
  
  // Champs Admin
  TC_Billing_ID?: string; // Numéro de facturation
  TC_PO?: string; // PO
  
  // Champs legacy (à conserver pour compatibilité)
  TC_Placement?: string; // Placement média
  TC_Format?: string; // Format utilisé
  TC_StartDate?: string; // Date de début
  TC_EndDate?: string; // Date de fin

  // Nouveaux champs Budget
  TC_Currency?: string;           // Devise d'achat (CAD, USD, EUR...)
  TC_Unit_Type?: string;          // Type d'unité (CPM, CPC, etc.)
  TC_Budget_Mode?: 'client' | 'media';  // Mode de saisie
  TC_Cost_Per_Unit?: number;      // Coût par unité
  TC_Unit_Volume?: number;        // Volume d'unité
  TC_Has_Bonus?: boolean;         // Inclut bonification
  TC_Real_Value?: number;         // Valeur réelle payée
  TC_Bonus_Value?: number;        // Bonification calculée
}

// ==================== NOUVEAUX TYPES POUR LES TAXONOMIES ====================

/**
 * 🔥 NOUVEAU : Format des valeurs de variables utilisées dans les taxonomies
 * Utilise maintenant le type importé de la configuration
 */
export type TaxonomyVariableFormat = TaxonomyFormat;

/**
 * 🔥 NOUVEAU : Source d'une valeur de variable
 * Utilise maintenant le type importé de la configuration
 */
export type TaxonomyVariableSource = FieldSource;

/**
 * 🔥 NOUVEAU : Valeur d'une variable de taxonomie avec ses métadonnées étendues
 */
export interface TaxonomyVariableValue {
  value: string;                          // Valeur finale utilisée
  source: TaxonomyVariableSource;         // Source de la valeur
  format: TaxonomyVariableFormat;         // Format utilisé
  shortcodeId?: string;                   // 🔥 NOUVEAU : ID du shortcode sélectionné (pour formats shortcode)
  openValue?: string;                     // 🔥 NOUVEAU : Valeur libre saisie (pour format open)
}

/**
 * Collection des valeurs de toutes les variables utilisées dans les taxonomies
 */
export interface TaxonomyValues {
  [variableName: string]: TaxonomyVariableValue;
}

/**
 * Chaînes taxonomiques générées pour les différents systèmes
 */
export interface GeneratedTaxonomies {
  tags?: string;       // Taxonomie complète pour tags
  platform?: string;  // Taxonomie complète pour platform  
  mediaocean?: string; // Taxonomie complète pour mediaocean
}

/**
 * 🔥 NOUVEAU CORRIGÉ : Variable parsée depuis une structure de taxonomie avec support multiples formats
 */
export interface ParsedTaxonomyVariable {
  variable: string;                   // Nom de la variable (ex: "TC_Publisher")
  formats: TaxonomyVariableFormat[];  // 🔥 CHANGEMENT : Array de formats demandés au lieu d'un seul
  source: TaxonomyVariableSource;     // Source déterminée automatiquement
  level: number;                      // Niveau dans la taxonomie (1-4)
  isValid: boolean;                   // Indique si la variable/formats sont valides
  errorMessage?: string;              // Message d'erreur si invalide
}

/**
 * Structure de taxonomie parsée complète
 */
export interface ParsedTaxonomyStructure {
  variables: ParsedTaxonomyVariable[]; // Variables trouvées dans la structure
  isValid: boolean;                    // Indique si toute la structure est valide
  errors: string[];                    // Liste des erreurs trouvées
}

// ==================== PLACEMENT AVEC TAXONOMIES ====================

export interface Placement {
  id: string;
  PL_Label: string;
  PL_Format?: string;
  PL_Budget: number;
  PL_Order: number;
  PL_TactiqueId: string; // Référence à la tactique parente
  
  // Champs de taxonomie existants (pour compatibilité)
  PL_Taxonomy_Tags?: string; // Taxonomie pour les tags
  PL_Taxonomy_Platform?: string; // Taxonomie pour la plateforme
  PL_Taxonomy_MediaOcean?: string; // Taxonomie pour MediaOcean
  
  // 🔥 NOUVEAUX CHAMPS POUR LES TAXONOMIES DYNAMIQUES
  PL_Taxonomy_Values?: TaxonomyValues;        // Valeurs des variables configurées
  PL_Generated_Taxonomies?: GeneratedTaxonomies; // Chaînes taxonomiques générées
  
  createdAt?: string;
  updatedAt?: string;
}

export interface Creatif {
  id: string;
  CR_Label: string;
  CR_URL?: string;
  CR_Order: number;
  CR_PlacementId: string; // Référence au placement parent
  createdAt?: string;
  updatedAt?: string;
}

export interface Onglet {
  id: string;
  ONGLET_Name: string;
  ONGLET_Order: number;
}

export interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

// Type pour les sections avec tactiques et état d'expansion
export interface SectionWithTactiques extends Section {
  tactiques: Tactique[];
  isExpanded: boolean;
}

// Type pour les tactiques avec placements
export interface TactiqueWithPlacements extends Tactique {
  placements: PlacementWithCreatifs[];
}

// Type pour les placements avec créatifs
export interface PlacementWithCreatifs extends Placement {
  creatifs: Creatif[];
}

// ==================== TYPES DE FORMULAIRES AVEC TAXONOMIES ====================

// Types pour les formulaires
export interface TactiqueFormData {
  TC_Label: string;
  TC_Budget: number;
  TC_Order: number;
  TC_SectionId: string;
  TC_Status?: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  
  // Champs Info
  TC_Bucket?: string;
  
  // Champs Stratégie - Section principale
  TC_LoB?: string;
  TC_Media_Type?: string;
  TC_Publisher?: string;
  TC_Inventory?: string;
  TC_Product_Open?: string;
  TC_Targeting_Open?: string;
  TC_Market_Open?: string;
  TC_Frequence?: string;
  TC_Location?: string;
  TC_Market?: string;
  TC_Language?: string;
  TC_Format_Open?: string;
  
  // Champs Stratégie - Champs personnalisés
  TC_Buying_Method?: string;
  TC_Custom_Dim_1?: string;
  TC_Custom_Dim_2?: string;
  TC_Custom_Dim_3?: string;
  
  // Champs Stratégie - Production
  TC_NumberCreatives?: string;
  TC_AssetDate?: string;
  
  // Champs KPI
  TC_Media_Objective?: string;
  
  // KPIs multiples (jusqu'à 5)
  TC_Kpi?: string;
  TC_Kpi_CostPer?: number;
  TC_Kpi_Volume?: number;
  TC_Kpi_2?: string;
  TC_Kpi_CostPer_2?: number;
  TC_Kpi_Volume_2?: number;
  TC_Kpi_3?: string;
  TC_Kpi_CostPer_3?: number;
  TC_Kpi_Volume_3?: number;
  TC_Kpi_4?: string;
  TC_Kpi_CostPer_4?: number;
  TC_Kpi_Volume_4?: number;
  TC_Kpi_5?: string;
  TC_Kpi_CostPer_5?: number;
  TC_Kpi_Volume_5?: number;
  
  // Champs Admin
  TC_Billing_ID?: string;
  TC_PO?: string;
  
  // Champs legacy (à conserver pour compatibilité)
  TC_Placement?: string;
  TC_Format?: string;
  TC_StartDate?: string;
  TC_EndDate?: string;
}

/**
 * 🔥 NOUVEAU : Données de formulaire pour les placements avec support des taxonomies étendues
 */
export interface PlacementFormData {
  PL_Label: string;
  PL_Format?: string;
  PL_Budget: number;
  PL_Order: number;
  PL_TactiqueId: string;
  
  // Champs de taxonomie existants (pour compatibilité)
  PL_Taxonomy_Tags?: string; // Taxonomie pour les tags
  PL_Taxonomy_Platform?: string; // Taxonomie pour la plateforme
  PL_Taxonomy_MediaOcean?: string; // Taxonomie pour MediaOcean
  
  // 🔥 NOUVEAUX CHAMPS POUR LES TAXONOMIES DYNAMIQUES
  PL_Taxonomy_Values?: TaxonomyValues;        // Valeurs des variables configurées
  PL_Generated_Taxonomies?: GeneratedTaxonomies; // Chaînes taxonomiques générées
}

export interface CreatifFormData {
  CR_Label: string;
  CR_URL?: string;
  CR_Order: number;
  CR_PlacementId: string;
}

// ==================== TYPES UTILITAIRES POUR LES TAXONOMIES ====================

/**
 * Interface pour les données contextuelles nécessaires au parsing des taxonomies
 */
export interface TaxonomyContext {
  campaign?: any;     // Données de campagne
  tactique?: any;     // Données de tactique  
  placement?: any;    // Données de placement
  clientId: string;   // ID du client pour les listes dynamiques
}

/**
 * Résultat du parsing et de la génération des taxonomies
 */
export interface TaxonomyProcessingResult {
  variables: ParsedTaxonomyVariable[];     // Variables identifiées
  values: TaxonomyValues;                  // Valeurs résolues
  generated: GeneratedTaxonomies;          // Chaînes générées
  errors: string[];                        // Erreurs rencontrées
  warnings: string[];                      // Avertissements
}

/**
 * 🔥 NOUVEAU : Configuration pour un champ de saisie de taxonomie
 */
export interface TaxonomyFieldConfig {
  variable: string;                    // Nom de la variable
  source: TaxonomyVariableSource;      // Source de la donnée
  formats: TaxonomyVariableFormat[];   // 🔥 CHANGEMENT : Array de formats requis
  isRequired: boolean;                 // Champ obligatoire
  hasCustomList: boolean;              // Possède une liste dynamique
  currentValue?: string;               // Valeur actuelle
  placeholder?: string;                // Placeholder à afficher
  requiresShortcode?: boolean;         // 🔥 NOUVEAU : Nécessite un shortcode
  allowsUserInput?: boolean;           // 🔥 NOUVEAU : Permet la saisie libre
}

/**
 * Props pour le highlight bidirectionnel
 */
export interface HighlightState {
  activeField?: string;               // Champ actuellement mis en surbrillance
  activeVariable?: string;            // Variable actuellement mise en surbrillance
  mode: 'field' | 'preview' | 'none'; // Mode de highlight actuel
}