/**
 * Ce fichier définit toutes les interfaces et types TypeScript utilisés dans l'application
 * pour structurer les données des sections, tactiques, placements et créatifs.
 * Il inclut également des types pour la gestion des taxonomies, les formulaires de données
 * et les structures hiérarchiques utilisées pour l'affichage de l'arborescence.
 * C'est le point central pour comprendre la modélisation des données du projet.
 */
import type { TaxonomyFormat, FieldSource } from '../config/taxonomyFields';

/**
 * Interface pour une section, regroupant des tactiques.
 * @property {string} id - L'identifiant unique de la section.
 * @property {string} SECTION_Name - Le nom de la section.
 * @property {number} SECTION_Order - L'ordre d'affichage de la section.
 * @property {string} [SECTION_Color] - La couleur associée à la section (optionnel).
 * @property {number} [SECTION_Budget] - Le budget total calculé de la section (optionnel).
 * @property {boolean} [isExpanded] - Indique si la section est dépliée dans l'interface utilisateur (optionnel).
 * @property {boolean} [isSelected] - Indique si la section est sélectionnée dans l'interface utilisateur (optionnel).
 */
export interface Section {
  id: string;
  SECTION_Name: string;
  SECTION_Order: number;
  SECTION_Color?: string;
  SECTION_Budget?: number;
  isExpanded?: boolean;
  isSelected?: boolean;
}

/**
 * Interface pour une tactique, contenant des détails budgétaires, stratégiques et de performance.
 * @property {string} id - L'identifiant unique de la tactique.
 * @property {string} TC_Label - Le libellé ou nom de la tactique.
 * @property {number} TC_Budget - Le budget alloué à la tactique.
 * @property {number} TC_Order - L'ordre d'affichage de la tactique.
 * @property {string} TC_SectionId - L'identifiant de la section parente.
 * @property {'Planned' | 'Active' | 'Completed' | 'Cancelled'} [TC_Status] - Le statut de la tactique (optionnel).
 * @property {string} [TC_Bucket] - Référence à l'enveloppe budgétaire (optionnel).
 * @property {string} [TC_LoB] - Ligne d'affaire (optionnel).
 * @property {string} [TC_Media_Type] - Type de média (optionnel).
 * @property {string} [TC_Publisher] - Partenaire ou éditeur (optionnel).
 * @property {string} [TC_Inventory] - Inventaire (optionnel).
 * @property {string} [TC_Product_Open] - Description ouverte du produit (optionnel).
 * @property {string} [TC_Targeting_Open] - Description ouverte de l'audience ciblée (optionnel).
 * @property {string} [TC_Market_Open] - Description ouverte du marché (optionnel).
 * @property {string} [TC_Frequence] - Fréquence (optionnel).
 * @property {string} [TC_Location] - Description de l'emplacement (optionnel).
 * @property {string} [TC_Market] - Marché (liste dynamique) (optionnel).
 * @property {string} [TC_Language] - Langue (optionnel).
 * @property {string} [TC_Format_Open] - Description ouverte du format (optionnel).
 * @property {string} [TC_Buying_Method] - Méthode d'achat (optionnel).
 * @property {string} [TC_Custom_Dim_1] - Dimension personnalisée 1 (optionnel).
 * @property {string} [TC_Custom_Dim_2] - Dimension personnalisée 2 (optionnel).
 * @property {string} [TC_Custom_Dim_3] - Dimension personnalisée 3 (optionnel).
 * @property {string} [TC_NumberCreatives] - Nombre de créatifs suggérés (optionnel).
 * @property {string} [TC_AssetDate] - Date de livraison des créatifs (optionnel).
 * @property {string} [TC_Media_Objective] - Objectif média (optionnel).
 * @property {string} [TC_Kpi] - KPI principal (optionnel).
 * @property {number} [TC_Kpi_CostPer] - Coût par KPI principal (optionnel).
 * @property {number} [TC_Kpi_Volume] - Volume KPI principal (optionnel).
 * @property {string} [TC_Kpi_2] - Deuxième KPI (optionnel).
 * @property {number} [TC_Kpi_CostPer_2] - Coût par deuxième KPI (optionnel).
 * @property {number} [TC_Kpi_Volume_2] - Volume deuxième KPI (optionnel).
 * @property {string} [TC_Kpi_3] - Troisième KPI (optionnel).
 * @property {number} [TC_Kpi_CostPer_3] - Coût par troisième KPI (optionnel).
 * @property {number} [TC_Kpi_Volume_3] - Volume troisième KPI (optionnel).
 * @property {string} [TC_Kpi_4] - Quatrième KPI (optionnel).
 * @property {number} [TC_Kpi_CostPer_4] - Coût par quatrième KPI (optionnel).
 * @property {number} [TC_Kpi_Volume_4] - Volume quatrième KPI (optionnel).
 * @property {string} [TC_Kpi_5] - Cinquième KPI (optionnel).
 * @property {number} [TC_Kpi_CostPer_5] - Coût par cinquième KPI (optionnel).
 * @property {number} [TC_Kpi_Volume_5] - Volume cinquième KPI (optionnel).
 * @property {string} [TC_Billing_ID] - Numéro de facturation (optionnel).
 * @property {string} [TC_PO] - Numéro de PO (optionnel).
 * @property {string} [TC_Placement] - Placement média (legacy, optionnel).
 * @property {string} [TC_Format] - Format utilisé (legacy, optionnel).
 * @property {string} [TC_StartDate] - Date de début (legacy, optionnel).
 * @property {string} [TC_EndDate] - Date de fin (legacy, optionnel).
 * @property {string} [TC_Currency] - Devise d'achat (CAD, USD, EUR...) (optionnel).
 * @property {string} [TC_Unit_Type] - Type d'unité (CPM, CPC, etc.) (optionnel).
 * @property {'client' | 'media'} [TC_Budget_Mode] - Mode de saisie du budget (optionnel).
 * @property {number} [TC_Cost_Per_Unit] - Coût par unité (optionnel).
 * @property {number} [TC_Unit_Volume] - Volume d'unité (optionnel).
 * @property {boolean} [TC_Has_Bonus] - Indique si la tactique inclut une bonification (optionnel).
 * @property {number} [TC_Real_Value] - Valeur réelle payée (optionnel).
 * @property {number} [TC_Bonus_Value] - Bonification calculée (optionnel).
 * @property {boolean} [isSelected] - Indique si la tactique est sélectionnée dans l'interface utilisateur (optionnel).
 */
export interface Tactique {
  id: string;
  TC_Label: string;
  TC_Budget: number;
  TC_Order: number;
  TC_SectionId: string;
  TC_Status?: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  TC_Bucket?: string;
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
  TC_Buying_Method?: string;
  TC_Custom_Dim_1?: string;
  TC_Custom_Dim_2?: string;
  TC_Custom_Dim_3?: string;
  TC_NumberCreatives?: string;
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
  TC_StartDate?: string;
  TC_EndDate?: string;
  TC_Currency?: string;
  TC_Unit_Type?: string;
  TC_Budget_Mode?: 'client' | 'media';
  TC_Cost_Per_Unit?: number;
  TC_Unit_Volume?: number;
  TC_Has_Bonus?: boolean;
  TC_Real_Value?: number;
  TC_Bonus_Value?: number;
  isSelected?: boolean;
}

/**
 * Type exporté pour le format de taxonomie, réexporté depuis les configurations.
 */
export type TaxonomyVariableFormat = TaxonomyFormat;

/**
 * Type exporté pour la source de champ de taxonomie, réexporté depuis les configurations.
 */
export type TaxonomyVariableSource = FieldSource;

/**
 * Interface représentant une valeur de variable de taxonomie avec sa source et son format.
 * @property {string} value - La valeur de la taxonomie.
 * @property {TaxonomyVariableSource} source - La source de la valeur (e.g., 'campaign', 'tactique').
 * @property {TaxonomyFormat} format - Le format de la taxonomie.
 * @property {string} [shortcodeId] - L'identifiant du shortcode associé, si applicable (optionnel).
 * @property {string} [openValue] - La valeur saisie par l'utilisateur si le format le permet (optionnel).
 */
export interface TaxonomyVariableValue {
  value: string;
  source: TaxonomyVariableSource;
  format: TaxonomyFormat;
  shortcodeId?: string;
  openValue?: string;
}

/**
 * Interface pour un ensemble de valeurs de taxonomie, indexées par le nom de la variable.
 */
export interface TaxonomyValues {
  [variableName: string]: TaxonomyVariableValue;
}

/**
 * Interface pour les taxonomies générées.
 * @property {string} [tags] - Les tags générés (optionnel).
 * @property {string} [platform] - La plateforme générée (optionnel).
 * @property {string} [mediaocean] - La taxonomie MediaOcean générée (optionnel).
 */
export interface GeneratedTaxonomies {
  tags?: string;
  platform?: string;
  mediaocean?: string;
}

/**
 * Interface représentant une variable de taxonomie parsée.
 * @property {string} variable - Le nom de la variable de taxonomie.
 * @property {TaxonomyFormat[]} formats - Les formats acceptés pour cette variable.
 * @property {TaxonomyVariableSource} source - La source de la variable.
 * @property {string} [label] - Le libellé de la variable (optionnel).
 * @property {number} level - Le niveau hiérarchique de la variable.
 * @property {boolean} isValid - Indique si la variable est valide.
 * @property {string} [errorMessage] - Message d'erreur si la variable est invalide (optionnel).
 */
export interface ParsedTaxonomyVariable {
  variable: string;
  formats: TaxonomyFormat[];
  source: TaxonomyVariableSource;
  label?: string;
  level: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Interface représentant la structure complète d'une taxonomie parsée.
 * @property {ParsedTaxonomyVariable[]} variables - Un tableau des variables de taxonomie parsées.
 * @property {boolean} isValid - Indique si la structure globale est valide.
 * @property {string[]} errors - Un tableau de messages d'erreurs (optionnel).
 */
export interface ParsedTaxonomyStructure {
  variables: ParsedTaxonomyVariable[];
  isValid: boolean;
  errors: string[];
}

/**
 * Interface pour un placement, contenant des informations de taxonomie.
 * @property {string} id - L'identifiant unique du placement.
 * @property {string} PL_Label - Le libellé ou nom du placement.
 * @property {number} PL_Order - L'ordre d'affichage du placement.
 * @property {string} PL_TactiqueId - L'identifiant de la tactique parente.
 * @property {string} [PL_Taxonomy_Tags] - Les tags de taxonomie du placement (optionnel).
 * @property {string} [PL_Taxonomy_Platform] - La plateforme de taxonomie du placement (optionnel).
 * @property {string} [PL_Taxonomy_MediaOcean] - La taxonomie MediaOcean du placement (optionnel).
 * @property {string} [TAX_Product] - Taxonomie produit (optionnel).
 * @property {string} [TAX_Audience_Demographics] - Taxonomie démographie de l'audience (optionnel).
 * @property {string} [TAX_Location] - Taxonomie emplacement (optionnel).
 * @property {string} [TAX_Device] - Taxonomie appareil (optionnel).
 * @property {string} [TAX_Targeting] - Taxonomie ciblage (optionnel).
 * @property {TaxonomyValues} [PL_Taxonomy_Values] - Les valeurs de taxonomie associées au placement (optionnel).
 * @property {GeneratedTaxonomies} [PL_Generated_Taxonomies] - Les taxonomies générées pour le placement (optionnel).
 * @property {string} [createdAt] - Date de création du placement (optionnel).
 * @property {string} [updatedAt] - Date de dernière mise à jour du placement (optionnel).
 * @property {boolean} [isSelected] - Indique si le placement est sélectionné dans l'interface utilisateur (optionnel).
 */
export interface Placement {
  id: string;
  PL_Label: string;
  PL_Order: number;
  PL_TactiqueId: string;
  PL_Taxonomy_Tags?: string;
  PL_Taxonomy_Platform?: string;
  PL_Taxonomy_MediaOcean?: string;
  TAX_Product?: string;
  TAX_Audience_Demographics?: string;
  TAX_Location?: string;
  TAX_Device?: string;
  TAX_Targeting?: string;
  PL_Taxonomy_Values?: TaxonomyValues;
  PL_Generated_Taxonomies?: GeneratedTaxonomies;
  createdAt?: string;
  updatedAt?: string;
  isSelected?: boolean;
}

/**
 * Interface pour un créatif, lié à un placement.
 * @property {string} id - L'identifiant unique du créatif.
 * @property {string} CR_Label - Le libellé ou nom du créatif.
 * @property {number} CR_Order - L'ordre d'affichage du créatif.
 * @property {string} CR_PlacementId - L'identifiant du placement parent.
 * @property {string} [CR_Taxonomy_Tags] - Les tags de taxonomie du créatif (optionnel).
 * @property {string} [CR_Taxonomy_Platform] - La plateforme de taxonomie du créatif (optionnel).
 * @property {string} [CR_Taxonomy_MediaOcean] - La taxonomie MediaOcean du créatif (optionnel).
 * @property {string} [CR_Start_Date] - Date de début du créatif (optionnel).
 * @property {string} [CR_End_Date] - Date de fin du créatif (optionnel).
 * @property {string} [CR_Rotation_Weight] - Poids de rotation du créatif (optionnel).
 * @property {string} [CR_CTA] - Call-to-Action du créatif (optionnel).
 * @property {string} [CR_Format_Details] - Détails du format du créatif (optionnel).
 * @property {string} [CR_Offer] - Offre du créatif (optionnel).
 * @property {string} [CR_Plateform_Name] - Nom de la plateforme du créatif (optionnel).
 * @property {string} [CR_Primary_Product] - Produit principal du créatif (optionnel).
 * @property {string} [CR_URL] - URL du créatif (optionnel).
 * @property {string} [CR_Version] - Version du créatif (optionnel).
 * @property {TaxonomyValues} [CR_Taxonomy_Values] - Les valeurs de taxonomie associées au créatif (optionnel).
 * @property {GeneratedTaxonomies} [CR_Generated_Taxonomies] - Les taxonomies générées pour le créatif (optionnel).
 * @property {string} [createdAt] - Date de création du créatif (optionnel).
 * @property {string} [updatedAt] - Date de dernière mise à jour du créatif (optionnel).
 * @property {boolean} [isSelected] - Indique si le créatif est sélectionné dans l'interface utilisateur (optionnel).
 */
export interface Creatif {
  id: string;
  CR_Label: string;
  CR_Order: number;
  CR_PlacementId: string;
  CR_Taxonomy_Tags?: string;
  CR_Taxonomy_Platform?: string;
  CR_Taxonomy_MediaOcean?: string;
  CR_Start_Date?: string;
  CR_End_Date?: string;
  CR_Rotation_Weight?: string;
  CR_CTA?: string;
  CR_Format_Details?: string;
  CR_Offer?: string;
  CR_Plateform_Name?: string;
  CR_Primary_Product?: string;
  CR_URL?: string;
  CR_Version?: string;
  CR_Taxonomy_Values?: TaxonomyValues;
  CR_Generated_Taxonomies?: GeneratedTaxonomies;
  createdAt?: string;
  updatedAt?: string;
  isSelected?: boolean;
}

/**
 * Interface pour un onglet de l'application.
 * @property {string} id - L'identifiant unique de l'onglet.
 * @property {string} ONGLET_Name - Le nom de l'onglet.
 * @property {number} ONGLET_Order - L'ordre d'affichage de l'onglet.
 */
export interface Onglet {
  id: string;
  ONGLET_Name: string;
  ONGLET_Order: number;
}

/**
 * Interface pour une version d'une campagne ou d'un projet.
 * @property {string} id - L'identifiant unique de la version.
 * @property {string} name - Le nom de la version.
 * @property {boolean} isOfficial - Indique si cette version est officielle.
 * @property {string} createdAt - La date de création de la version.
 * @property {string} createdBy - L'utilisateur qui a créé la version.
 */
export interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

/**
 * Interface étendue de Placement incluant un tableau de créatifs.
 * Utilisée pour représenter un placement avec ses créatifs associés dans une structure hiérarchique.
 * @property {Creatif[]} creatifs - Le tableau des créatifs liés à ce placement.
 */
export interface PlacementWithCreatifs extends Placement {
  creatifs: Creatif[];
}

/**
 * Interface étendue de Tactique incluant un tableau de placements avec leurs créatifs.
 * Utilisée pour représenter une tactique avec ses placements et créatifs associés dans une structure hiérarchique.
 * @property {PlacementWithCreatifs[]} placements - Le tableau des placements liés à cette tactique, chacun incluant ses créatifs.
 */
export interface TactiqueWithPlacements extends Tactique {
  placements: PlacementWithCreatifs[];
}

/**
 * Interface étendue de Section incluant un tableau de tactiques avec leurs placements et créatifs.
 * Utilisée pour représenter une section avec ses tactiques, placements et créatifs associés dans une structure hiérarchique complète.
 * @property {TactiqueWithPlacements[]} tactiques - Le tableau des tactiques liées à cette section, chacune incluant ses placements et créatifs.
 */
export interface SectionWithTactiques extends Section {
  tactiques: TactiqueWithPlacements[];
}

/**
 * Interface pour les données de formulaire d'une tactique.
 * Elle contient tous les champs modifiables d'une tactique.
 */
export interface TactiqueFormData {
  TC_Label: string;
  TC_Budget: number;
  TC_Order: number;
  TC_SectionId: string;
  TC_Status?: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  TC_Bucket?: string;
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
  TC_Buying_Method?: string;
  TC_Custom_Dim_1?: string;
  TC_Custom_Dim_2?: string;
  TC_Custom_Dim_3?: string;
  TC_NumberCreatives?: string;
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
  TC_StartDate?: string;
  TC_EndDate?: string;
}

/**
 * Interface pour les données de formulaire d'un placement.
 * Elle contient tous les champs modifiables d'un placement, y compris les taxonomies.
 */
export interface PlacementFormData {
  PL_Label: string;
  PL_Order: number;
  PL_TactiqueId: string;
  PL_Taxonomy_Tags?: string;
  PL_Taxonomy_Platform?: string;
  PL_Taxonomy_MediaOcean?: string;
  TAX_Product?: string;
  TAX_Location?: string;
  TAX_Audience_Demographics?: string;
  TAX_Device?: string;
  TAX_Targeting?: string;
  PL_Taxonomy_Values?: TaxonomyValues;
  PL_Generated_Taxonomies?: GeneratedTaxonomies;
}

/**
 * Interface pour les données de formulaire d'un créatif.
 * Elle contient tous les champs modifiables d'un créatif, y compris les taxonomies.
 */
export interface CreatifFormData {
  CR_Label: string;
  CR_Order: number;
  CR_PlacementId: string;
  CR_Taxonomy_Tags?: string;
  CR_Taxonomy_Platform?: string;
  CR_Taxonomy_MediaOcean?: string;
  CR_Start_Date?: string;
  CR_End_Date?: string;
  CR_Rotation_Weight?: string;
  CR_CTA?: string;
  CR_Format_Details?: string;
  CR_Offer?: string;
  CR_Plateform_Name?: string;
  CR_Primary_Product?: string;
  CR_URL?: string;
  CR_Version?: string;
  CR_Taxonomy_Values?: TaxonomyValues;
  CR_Generated_Taxonomies?: GeneratedTaxonomies;
}

/**
 * Interface représentant le contexte pour le traitement des taxonomies.
 * @property {any} [campaign] - Les données de la campagne (optionnel).
 * @property {any} [tactique] - Les données de la tactique (optionnel).
 * @property {any} [placement] - Les données du placement (optionnel).
 * @property {string} clientId - L'identifiant du client.
 */
export interface TaxonomyContext {
  campaign?: any;
  tactique?: any;
  placement?: any;
  clientId: string;
}

/**
 * Interface pour le résultat du traitement des taxonomies.
 * @property {ParsedTaxonomyVariable[]} variables - Les variables de taxonomie parsées.
 * @property {TaxonomyValues} values - Les valeurs de taxonomie résultantes.
 * @property {GeneratedTaxonomies} generated - Les taxonomies générées.
 * @property {string[]} errors - Les erreurs rencontrées lors du traitement.
 * @property {string[]} warnings - Les avertissements rencontrés lors du traitement.
 */
export interface TaxonomyProcessingResult {
  variables: ParsedTaxonomyVariable[];
  values: TaxonomyValues;
  generated: GeneratedTaxonomies;
  errors: string[];
  warnings: string[];
}

/**
 * Interface pour la configuration d'un champ de taxonomie.
 * @property {string} variable - Le nom de la variable.
 * @property {FieldSource} source - La source du champ.
 * @property {TaxonomyFormat[]} formats - Les formats acceptés.
 * @property {boolean} isRequired - Indique si le champ est obligatoire.
 * @property {boolean} hasCustomList - Indique si le champ a une liste personnalisée.
 * @property {string} [currentValue] - La valeur actuelle du champ (optionnel).
 * @property {string} [placeholder] - Le texte d'espace réservé (optionnel).
 * @property {boolean} [requiresShortcode] - Indique si le champ nécessite un shortcode (optionnel).
 * @property {boolean} [allowsUserInput] - Indique si le champ permet la saisie utilisateur libre (optionnel).
 */
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

/**
 * Interface pour l'état de surbrillance des champs de taxonomie dans l'interface utilisateur.
 * @property {string} [activeField] - Le champ actif (optionnel).
 * @property {string} [activeVariable] - La variable active (optionnel).
 * @property {'field' | 'preview' | 'none'} mode - Le mode de surbrillance.
 */
export interface HighlightState {
  activeField?: string;
  activeVariable?: string;
  mode: 'field' | 'preview' | 'none';
}