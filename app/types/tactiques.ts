// app/types/tactiques.ts

// ==================== IMPORTS DES TYPES DE CONFIGURATION ====================

import type { TaxonomyFormat, FieldSource } from '../config/taxonomyFields';
export type { TaxonomyFormat, FieldSource };

// ==================== INTERFACE SECTION CORRIGÉE ====================

export interface Section {
  id: string;
  SECTION_Name: string;
  SECTION_Order: number;
  SECTION_Color?: string;
  SECTION_Budget?: number; // Calculé à partir de la somme des budgets des tactiques
  isExpanded?: boolean; // 🔥 AJOUTÉ : État d'expansion pour l'UI
  isSelected?: boolean; // 🔥 NOUVEAU: État de sélection pour l'UI
}

// ==================== TYPES EXISTANTS (INCHANGÉS) ====================

export interface Tactique {
  id: string;
  TC_Label: string;
  TC_Budget: number;
  TC_Order: number;
  TC_MPA: string;
  TC_SectionId: string; // Référence à la section parente
  TC_Status?: 'Planned' | 'Active' | 'Completed' | 'Cancelled'; // Statut de la tactique

  // Champs Info
  TC_Bucket?: string; // Référence à l'enveloppe budgétaire

  // Champs Stratégie - Section principale
  TC_LOB?: string; // Ligne d'affaire
  TC_Media_Type?: string; // Type média
  TC_Publisher?: string; // Partenaire
  TC_Inventory?: string; // Inventaire
  TC_Product_Open?: string; // Description du produit
  TC_Targeting_Open?: string; // Description de l'audience
  TC_Market_Open?: string; // Description du marché
  TC_Frequence?: string; // Fréquence
  TC_Location_Open?: string; // Description de l'emplacement
  TC_Market?: string; // Marché (liste dynamique)
  TC_Language_Open?: string; // Langue
  TC_Format_Open?: string; // Description du format

  // Champs Stratégie - Champs personnalisés
  TC_Buying_Method?: string; // Méthode d'achat
  TC_Custom_Dim_1?: string; // Dimension personnalisée 1
  TC_Custom_Dim_2?: string; // Dimension personnalisée 2
  TC_Custom_Dim_3?: string; // Dimension personnalisée 3

  // Champs Stratégie - Production
  TC_NumberCreative?: string; // Nombre de créatifs suggérés
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

  // 🔥 NOUVEAUX CHAMPS TAGS
  TC_Buy_Type?: 'CPM' | 'CPC'; // Type d'achat (CPM ou CPC)
  TC_CM360_Volume?: number; // Volume CM360 (nombre entier)
  TC_CM360_Rate?: number; // Taux CM360 calculé (non éditable)

  // Champs Admin
  TC_Billing_ID?: string; // Numéro de facturation
  TC_PO?: string; // PO

  // Champs legacy (à conserver pour compatibilité)
  TC_Placement?: string; // Placement média
  TC_Format?: string; // Format utilisé
  TC_Start_Date?: string; // Date de début
  TC_End_Date?: string; // Date de fin

  // Nouveaux champs Budget
  TC_Currency?: string;           // Devise d'achat (CAD, USD, EUR...)
  TC_Unit_Type?: string;          // Type d'unité (CPM, CPC, etc.)
  TC_Budget_Mode?: 'client' | 'media';  // Mode de saisie
  TC_Cost_Per_Unit?: number;      // Coût par unité
  TC_Unit_Volume?: number;        // Volume d'unité
  TC_Has_Bonus?: boolean;         // Inclut bonification
  TC_Real_Value?: number;         // Valeur réelle payée
  TC_Bonus_Value?: number;        // Bonification calculée

  TC_Client_Budget_RefCurrency?: number;  // Budget client converti dans la devise de référence de la campagne
  TC_Media_Budget_RefCurrency?: number;   // Budget média converti dans la devise de référence de la campagne
  TC_Currency_Rate?: number;              // Taux de change utilisé pour la conversion (devise tactique → devise campagne)

  isSelected?: boolean; // 🔥 NOUVEAU: État de sélection pour l'UI
}

// ==================== TYPES TAXONOMIE ====================

export type TaxonomyVariableFormat = TaxonomyFormat;
export type TaxonomyVariableSource = FieldSource;


export interface GeneratedTaxonomies {
  tags?: string;
  platform?: string;
  mediaocean?: string;
}

export interface ParsedTaxonomyVariable {
  variable: string;
  formats: TaxonomyFormat[];
  source: TaxonomyVariableSource;
  label?: string;
  level: number;
  isValid: boolean;
  errorMessage?: string;
}

export interface ParsedTaxonomyStructure {
  variables: ParsedTaxonomyVariable[];
  isValid: boolean;
  errors: string[];
}

// ==================== PLACEMENT AVEC CHAMPS DE PLACEMENT + TAGS ====================

export interface Placement {
  id: string;
  PL_Label: string;
  PL_Order: number;
  PL_TactiqueId: string;

  PL_Taxonomy_Tags?: string;
  PL_Taxonomy_Platform?: string;
  PL_Taxonomy_MediaOcean?: string;

  PL_Start_Date?:Date;
  PL_End_Date?:Date;

  // Champs de placement
  PL_Audience_Behaviour?: string;
  PL_Audience_Demographics?: string;
  PL_Audience_Engagement?: string;
  PL_Audience_Interest?: string;
  PL_Audience_Other?: string;
  PL_Creative_Grouping?: string;
  PL_Device?: string;
  PL_Market_Details?: string;
  PL_Product?: string;
  PL_Segment_Open?: string;
  PL_Tactic_Category?: string;
  PL_Targeting?: string;
  PL_Custom_Dim_1?: string;
  PL_Custom_Dim_2?: string;
  PL_Custom_Dim_3?: string;
  PL_Channel?: string;
  PL_Format?: string;
  PL_Language?: string;
  PL_Placement_Location?: string;

  // 🔥 NOUVEAUX CHAMPS TAGS
  PL_Tag_Start_Date?: string;         // Date de début tag
  PL_Tag_End_Date?: string;           // Date de fin tag  
  TC_Tag_Type?: string;               // Type de tag (Video-Hosted, Video-Tracked, Display-Hosted, Display-Tracked, Audio-Hosted, Audio-Tracked)
  TC_Third_Party_Measurement?: boolean; // Mesure tierce partie (défaut: false)
  TC_VPAID?: boolean;                 // VPAID activé (défaut: true)
  PL_Creative_Rotation_Type?: string; // Type de rotation créatif (Even, Optimized by clicks, Weighted, Floodlight)
  PL_Floodlight?: string;             // Configuration Floodlight (affiché si rotation type = Floodlight)

  TC_Client_Budget_RefCurrency?: number;  // Budget client converti dans la devise de référence de la campagne
  TC_Media_Budget_RefCurrency?: number;   // Budget média converti dans la devise de référence de la campagne
  TC_Currency_Rate?: number;              // Taux de change utilisé pour la conversion (devise tactique → devise campagne)

  createdAt?: string;
  updatedAt?: string;
  isSelected?: boolean; // 🔥 NOUVEAU: État de sélection pour l'UI
}

// ==================== CRÉATIF ENRICHI AVEC TOUS LES CHAMPS + SPECS + SPRINT_DATES ====================

export interface Creatif {
  id: string;
  CR_Label: string;
  CR_Order: number;
  CR_PlacementId: string;

  // Taxonomies créatifs (niveaux 5-6)
  CR_Taxonomy_Tags?: string;
  CR_Taxonomy_Platform?: string;
  CR_Taxonomy_MediaOcean?: string;

  // 10 champs spécifiques aux créatifs
  CR_Start_Date?: string;           // Date de début créatif
  CR_End_Date?: string;             // Date de fin créatif
  CR_Rotation_Weight?: string;      // Poids de rotation
  CR_CTA?: string;                  // Call-to-Action
  CR_Format_Details?: string;       // Détails du format
  CR_Offer?: string;                // Offre
  CR_Plateform_Name?: string;       // Nom de plateforme
  CR_Primary_Product?: string;      // Produit principal
  CR_URL?: string;                  // URL du créatif
  CR_Version?: string;              // Version du créatif

  // 🔥 NOUVEAU CHAMP CALCULÉ - AJOUTÉ
  CR_Sprint_Dates?: string;         // Dates de sprint calculées (format: MMMdd-MMMdd)

  // 🔥 NOUVEAUX CHAMPS TAGS - AJOUTÉS
  CR_Tag_Start_Date?: string;       // Date de début tag créatif (héritée de PL_Tag_Start_Date)
  CR_Tag_End_Date?: string;         // Date de fin tag créatif (héritée de PL_Tag_End_Date)

  // NOUVEAUX CHAMPS SPECS - AJOUTÉS
  CR_Spec_PartnerId?: string;       // ID du partenaire sélectionné
  CR_Spec_SelectedSpecId?: string;  // ID de la spec sélectionnée
  CR_Spec_Name?: string;            // Nom de la spécification
  CR_Spec_Format?: string;          // Format (ex: 300x250)
  CR_Spec_Ratio?: string;           // Ratio (ex: 16:9)
  CR_Spec_FileType?: string;        // Type de fichier (ex: JPG, PNG, GIF)
  CR_Spec_MaxWeight?: string;       // Poids maximal
  CR_Spec_Weight?: string;          // Poids maximal HTML5
  CR_Spec_Animation?: string;       // Animation (Autorisée/Non autorisée)
  CR_Spec_Title?: string;           // Contraintes titre
  CR_Spec_Text?: string;            // Contraintes texte
  CR_Spec_SpecSheetLink?: string;   // Lien vers feuille de specs
  CR_Spec_Notes?: string;           // Notes additionnelles

  // Stockage des valeurs taxonomie et générations
  CR_Generated_Taxonomies?: GeneratedTaxonomies;

  createdAt?: string;
  updatedAt?: string;
  isSelected?: boolean; // 🔥 NOUVEAU: État de sélection pour l'UI
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

// ==================== STRUCTURES HIÉRARCHIQUES POUR L'AFFICHAGE ====================

// 🔥 CORRECTION : Ajout de la définition complète des propriétés imbriquées
export interface PlacementWithCreatifs extends Placement {
  creatifs: Creatif[];
}

// 🔥 CORRECTION : Ajout de la définition complète des propriétés imbriquées
export interface TactiqueWithPlacements extends Tactique {
  placements: PlacementWithCreatifs[];
}

// 🔥 CORRECTION : Utilisation de TactiqueWithPlacements pour le tableau imbriqué
export interface SectionWithTactiques extends Section {
  tactiques: TactiqueWithPlacements[];
  // isExpanded héritée de Section - plus besoin de la redéfinir
}

// ==================== TYPES DE FORMULAIRES ====================

export interface TactiqueFormData {
  TC_Label: string;
  TC_Budget: number;
  TC_MPA: string;
  TC_Order: number;
  TC_SectionId: string;
  TC_Status?: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  TC_Bucket?: string;
  TC_LOB?: string;
  TC_Media_Type?: string;
  TC_Publisher?: string;
  TC_Inventory?: string;
  TC_Product_Open?: string;
  TC_Targeting_Open?: string;
  TC_Market_Open?: string;
  TC_Frequence?: string;
  TC_Location_Open?: string;
  TC_Market?: string;
  TC_Language_Open?: string;
  TC_Format_Open?: string;
  TC_Buying_Method?: string;
  TC_Custom_Dim_1?: string;
  TC_Custom_Dim_2?: string;
  TC_Custom_Dim_3?: string;
  TC_NumberCreative?: string;
  TC_AssetDate?: string;
  TC_Media_Objective?: string;
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
  TC_Billing_ID?: string;
  TC_PO?: string;
  TC_Placement?: string;
  TC_Format?: string;
  TC_Start_Date?: string;
  TC_End_Date?: string;

  // 🔥 NOUVEAUX CHAMPS TAGS DANS LE FORMULAIRE
  TC_Buy_Type?: 'CPM' | 'CPC'; // Type d'achat (CPM ou CPC)
  TC_CM360_Volume?: number; // Volume CM360 (nombre entier)
  TC_CM360_Rate?: number; // Taux CM360 calculé (non éditable)

  // 🔥 CORRECTION BUDGET : Ajout des champs budgétaires manquants
  TC_Media_Budget?: number; // Budget média calculé
  TC_Client_Budget?: number; // Budget client calculé
  TC_Budget_Mode?: 'client' | 'media'; // Mode de saisie du budget
  TC_BudgetInput?: number; // Valeur saisie par l'utilisateur
  TC_Unit_Price?: number; // Prix unitaire
  TC_Unit_Volume?: number; // Volume d'unités
  TC_Media_Value?: number; // Valeur média négociée
  TC_Bonification?: number; // Bonification calculée
  TC_Currency_Rate?: number; // Taux de change appliqué
  TC_BuyCurrency?: string; // Devise d'achat
  TC_Delta?: number; // Écart de budget
  TC_Unit_Type?: string; // Type d'unité (CPM, CPC, etc.)
  TC_Has_Bonus?: boolean; // Indicateur de bonification
  
  // Champs de frais (jusqu'à 5 frais possibles)
  TC_Fee_1_Option?: string;
  TC_Fee_1_Volume?: number;
  TC_Fee_1_Value?: number;
  TC_Fee_2_Option?: string;
  TC_Fee_2_Volume?: number;
  TC_Fee_2_Value?: number;
  TC_Fee_3_Option?: string;
  TC_Fee_3_Volume?: number;
  TC_Fee_3_Value?: number;
  TC_Fee_4_Option?: string;
  TC_Fee_4_Volume?: number;
  TC_Fee_4_Value?: number;
  TC_Fee_5_Option?: string;
  TC_Fee_5_Volume?: number;
  TC_Fee_5_Value?: number;
}

export interface PlacementFormData {
  PL_Label: string;
  PL_Order: number;
  PL_TactiqueId: string;

  // NOUVEAUX CHAMPS DE DATES
  PL_Start_Date?: string;
  PL_End_Date?: string;

  PL_Taxonomy_Tags?: string;
  PL_Taxonomy_Platform?: string;
  PL_Taxonomy_MediaOcean?: string;

  // Champs de placement
  PL_Audience_Behaviour?: string;
  PL_Audience_Demographics?: string;
  PL_Audience_Engagement?: string;
  PL_Audience_Interest?: string;
  PL_Audience_Other?: string;
  PL_Creative_Grouping?: string;
  PL_Device?: string;
  PL_Market_Details?: string;
  PL_Product?: string;
  PL_Segment_Open?: string;
  PL_Tactic_Category?: string;
  PL_Targeting?: string;
  PL_Custom_Dim_1?: string;
  PL_Custom_Dim_2?: string;
  PL_Custom_Dim_3?: string;
  PL_Channel?: string;
  PL_Format?: string;
  PL_Language?: string;
  PL_Placement_Location?: string;

  // 🔥 NOUVEAUX CHAMPS TAGS DANS LE FORMULAIRE
  PL_Tag_Start_Date?: string;         // Date de début tag
  PL_Tag_End_Date?: string;           // Date de fin tag  
  TC_Tag_Type?: string;               // Type de tag
  TC_Third_Party_Measurement?: boolean; // Mesure tierce partie
  TC_VPAID?: boolean;                 // VPAID activé
  PL_Creative_Rotation_Type?: string; // Type de rotation créatif (Even, Optimized by clicks, Weighted, Floodlight)
  PL_Floodlight?: string;             // Configuration Floodlight (affiché si rotation type = Floodlight)
}

// ==================== FORMULAIRE CRÉATIF COMPLET + SPECS + TAGS + SPRINT_DATES ====================

export interface CreatifFormData {
  CR_Label: string;
  CR_Order: number;
  CR_PlacementId: string;

  // Sélection des taxonomies (niveaux 5-6)
  CR_Taxonomy_Tags?: string;
  CR_Taxonomy_Platform?: string;
  CR_Taxonomy_MediaOcean?: string;

  // 10 champs spécifiques aux créatifs
  CR_Start_Date?: string;           // Date de début créatif
  CR_End_Date?: string;             // Date de fin créatif
  CR_Rotation_Weight?: string;      // Poids de rotation
  CR_CTA?: string;                  // Call-to-Action
  CR_Format_Details?: string;       // Détails du format
  CR_Offer?: string;                // Offre
  CR_Plateform_Name?: string;       // Nom de plateforme
  CR_Primary_Product?: string;      // Produit principal
  CR_URL?: string;                  // URL du créatif
  CR_Version?: string;              // Version du créatif

  // 🔥 NOUVEAU CHAMP CALCULÉ - AJOUTÉ
  CR_Sprint_Dates?: string;         // Dates de sprint calculées (format: MMMdd-MMMdd)

  // 🔥 NOUVEAUX CHAMPS TAGS - AJOUTÉS
  CR_Tag_Start_Date?: string;       // Date de début tag créatif (héritée de PL_Tag_Start_Date)
  CR_Tag_End_Date?: string;         // Date de fin tag créatif (héritée de PL_Tag_End_Date)

  // NOUVEAUX CHAMPS SPECS - AJOUTÉS
  CR_Spec_PartnerId?: string;       // ID du partenaire sélectionné
  CR_Spec_SelectedSpecId?: string;  // ID de la spec sélectionnée
  CR_Spec_Name?: string;            // Nom de la spécification
  CR_Spec_Format?: string;          // Format (ex: 300x250)
  CR_Spec_Ratio?: string;           // Ratio (ex: 16:9)
  CR_Spec_FileType?: string;        // Type de fichier (ex: JPG, PNG, GIF)
  CR_Spec_MaxWeight?: string;       // Poids maximal
  CR_Spec_Weight?: string;          // Poids maximal HTML5
  CR_Spec_Animation?: string;       // Animation (Autorisée/Non autorisée)
  CR_Spec_Title?: string;           // Contraintes titre
  CR_Spec_Text?: string;            // Contraintes texte
  CR_Spec_SpecSheetLink?: string;   // Lien vers feuille de specs
  CR_Spec_Notes?: string;           // Notes additionnelles

  // Stockage des valeurs taxonomie
  CR_Generated_Taxonomies?: GeneratedTaxonomies;
}

// ==================== TYPES UTILITAIRES POUR LES TAXONOMIES ====================

export interface TaxonomyContext {
  campaign?: any;
  tactique?: any;
  placement?: any;
  clientId: string;
}


export interface TaxonomyFieldConfig {
  variable: string;
  source: FieldSource;
  formats: TaxonomyFormat[];
  isRequired: boolean;
  hasCustomList: boolean;
  currentValue?: string;
  placeholder?: string;
  requiresShortcode?: boolean;
  allowsUserInput?: boolean;
}

export interface HighlightState {
  activeField?: string;
  activeVariable?: string;
  mode: 'field' | 'preview' | 'none';
}