// app/types/adops.ts
/**
 * Types unifiés pour le module AdOps
 * Centralise toutes les interfaces pour éviter les redondances
 */

import { CM360TagHistory } from '../lib/cm360Service';

// ================================
// INTERFACES DE BASE
// ================================

/**
 * Interface pour une tactique AdOps
 */
export interface AdOpsTactique {
  id: string;
  TC_Label?: string;
  TC_Media_Budget?: number;
  TC_BuyCurrency?: string;
  TC_CM360_Rate?: number;
  TC_CM360_Volume?: number;
  TC_Buy_Type?: string;
  TC_Publisher?: string;
  TC_Adops_Color?: string;
  ongletName: string;
  sectionName: string;
  ongletId: string;
  sectionId: string;
  placementsWithTags: AdOpsPlacement[];
  [key: string]: any; // Index signature pour l'accès dynamique
}

/**
 * Interface pour un placement AdOps
 */
export interface AdOpsPlacement {
  id: string;
  PL_Label?: string;
  PL_Tag_Type?: string;
  PL_Tag_Start_Date?: string;
  PL_Tag_End_Date?: string;
  PL_Rotation_Type?: string;
  PL_Floodlight?: string;
  PL_Third_Party_Measurement?: boolean;
  PL_VPAID?: boolean;
  PL_Tag_1?: string;
  PL_Tag_2?: string;
  PL_Tag_3?: string;
  PL_Adops_Color?: string;
  PL_Order?: number;
  [key: string]: any; // Index signature pour l'accès dynamique
}

/**
 * Interface pour un créatif AdOps
 */
export interface AdOpsCreative {
  id: string;
  CR_Label?: string;
  CR_Tag_Start_Date?: string;
  CR_Tag_End_Date?: string;
  CR_Rotation_Weight?: number;
  CR_Tag_5?: string;
  CR_Tag_6?: string;
  CR_Adops_Color?: string;
  CR_Order?: number;
  [key: string]: any; // Index signature pour l'accès dynamique
}

// ================================
// TYPES STRUCTURELS
// ================================

/**
 * Type union pour les éléments AdOps
 */
export type AdOpsItem = AdOpsTactique | AdOpsPlacement | AdOpsCreative;

/**
 * Type pour le niveau hiérarchique
 */
export type AdOpsLevel = 0 | 1 | 2;

/**
 * Type pour le type d'élément
 */
export type AdOpsItemType = 'tactique' | 'placement' | 'creative';

/**
 * Type pour le statut CM360
 */
export type CM360Status = 'none' | 'created' | 'changed' | 'partial';

/**
 * Type pour les filtres CM360
 */
export type CM360Filter = 'all' | 'created' | 'changed' | 'none';

// ================================
// INTERFACES POUR LES TABLEAUX
// ================================

/**
 * Interface pour une ligne du tableau hiérarchique
 */
export interface AdOpsTableRow {
  type: AdOpsItemType;
  level: AdOpsLevel;
  data: AdOpsItem;
  tactiqueId?: string;
  placementId?: string;
  isExpanded?: boolean;
  children?: AdOpsTableRow[];
}

/**
 * Interface pour les données de créatifs organisées par tactique et placement
 */
export interface AdOpsCreativesData {
  [tactiqueId: string]: {
    [placementId: string]: AdOpsCreative[];
  };
}

// ================================
// INTERFACES POUR LES DROPDOWNS
// ================================

/**
 * Interface pour un publisher dans les dropdowns
 */
export interface AdOpsPublisher {
  id: string;
  name: string;
  tactiqueCount: number;
  isSelected: boolean;
}

/**
 * Interface pour une option de tactique dans les dropdowns
 */
export interface AdOpsTactiqueOption {
  id: string;
  label: string;
  publisherId: string;
  isSelected: boolean;
}

// ================================
// INTERFACES POUR LES COULEURS
// ================================

/**
 * Interface pour une couleur prédéfinie
 */
export interface AdOpsColor {
  name: string;
  value: string;
  class: string;
}

// ================================
// INTERFACES POUR LES MÉTRIQUES
// ================================

/**
 * Interface pour les métriques de tactique avec indexation
 */
export interface AdOpsTactiqueMetrics {
  TC_Media_Budget: any;
  TC_BuyCurrency: any;
  TC_CM360_Rate: any;
  TC_CM360_Volume: any;
  TC_Buy_Type: any;
  TC_Label: any;
  TC_Publisher: any;
  [key: string]: any; // Index signature pour l'accès dynamique
}

// ================================
// INTERFACES POUR LES PROPS
// ================================

/**
 * Props pour le composant AdOpsActionButtons
 */
export interface AdOpsActionButtonsProps {
  rowType: AdOpsItemType;
  data: AdOpsItem;
  selectedTactique?: AdOpsTactique;
  selectedCampaign: any;
  selectedVersion: any;
  cm360History?: CM360TagHistory;
  cm360Tags?: Map<string, CM360TagHistory>;
}

/**
 * Props pour le composant AdOpsTableRow
 */
export interface AdOpsTableRowProps {
  row: AdOpsTableRow;
  index: number;
  isSelected: boolean;
  selectedTactiques: AdOpsTactique[];
  selectedCampaign: any;
  selectedVersion: any;
  cm360Status: CM360Status;
  cm360History?: CM360TagHistory;
  cm360Tags?: Map<string, CM360TagHistory>;
  showBudgetParams: boolean;
  showTaxonomies: boolean;
  copiedField: string | null;
  onRowSelection: (rowId: string, index: number, event: React.MouseEvent) => void;
  onToggleExpanded: (rowId: string, rowType: string) => void;
  onCopyToClipboard: (value: any, fieldId: string) => void;
  formatCurrency: (amount: number | undefined, currency: string | undefined) => string;
  formatNumber: (num: number | undefined) => string;
  formatDate: (dateString: string | undefined) => string;
}

/**
 * Props pour le composant AdOpsTacticTable
 */
export interface AdOpsTacticTableProps {
  selectedTactiques: AdOpsTactique[];
  selectedCampaign: any;
  selectedVersion: any;
  cm360Tags?: Map<string, CM360TagHistory>;
  creativesData?: AdOpsCreativesData;
  onCM360TagsReload?: () => void;
  onDataReload?: () => void;
}

/**
 * Props pour le composant AdOpsDropdowns
 */
export interface AdOpsDropdownsProps {
  publishers: AdOpsPublisher[];
  tactiqueOptions: AdOpsTactiqueOption[];
  selectedPublishers: string[];
  selectedTactiques: string[];
  loading: boolean;
  error: string | null;
  togglePublisher: (publisherId: string) => void;
  selectAllPublishers: () => void;
  deselectAllPublishers: () => void;
  toggleTactique: (tactiqueId: string) => void;
  selectAllTactiques: () => void;
  deselectAllTactiques: () => void;
}

/**
 * Props pour le composant AdOpsProgressBar
 */
export interface AdOpsProgressBarProps {
  filteredTactiques: AdOpsTactique[];
  cm360Tags?: Map<string, CM360TagHistory>;
  creativesData?: AdOpsCreativesData;
  loading?: boolean;
}

/**
 * Props pour le composant AdOpsColorPicker
 */
export interface AdOpsColorPickerProps {
  colors: AdOpsColor[];
  onColorSelect: (colorValue: string) => void;
  onClose: () => void;
}

// ================================
// INTERFACES UTILITAIRES
// ================================

/**
 * Interface pour les statistiques de progression
 */
export interface AdOpsProgressStats {
  created: number;
  toModify: number;
  toCreate: number;
  total: number;
}

/**
 * Interface pour les pourcentages de progression
 */
export interface AdOpsProgressPercentages {
  created: number;
  toModify: number;
  toCreate: number;
}

/**
 * Interface pour les fonctions de formatage
 */
export interface AdOpsFormatters {
  formatCurrency: (amount: number | undefined, currency: string | undefined) => string;
  formatNumber: (num: number | undefined) => string;
  formatDate: (dateString: string | undefined) => string;
}

/**
 * Interface pour l'état de sélection
 */
export interface AdOpsSelectionState {
  selectedRows: Set<string>;
  lastSelectedIndex: number | null;
}

/**
 * Interface pour l'état des filtres
 */
export interface AdOpsFilterState {
  searchTerm: string;
  cm360Filter: CM360Filter;
  colorFilter: string;
  showTaxonomies: boolean;
  showBudgetParams: boolean;
  showTactiques: boolean;
  showPlacements: boolean;
  showCreatives: boolean;
  isFiltersVisible: boolean;
}

// ================================
// CONSTANTES
// ================================

/**
 * Couleurs prédéfinies pour AdOps
 */
export const ADOPS_COLORS: AdOpsColor[] = [
  { name: 'Rose', value: '#F9C8DC', class: 'bg-pink-100' },
  { name: 'Jaune', value: '#FFDE70', class: 'bg-yellow-100' },
  { name: 'Bleu', value: '#ADE0EB', class: 'bg-blue-100' },
  { name: 'Vert', value: '#7EDD8F', class: 'bg-green-100' }
];

/**
 * Champs à comparer pour les métriques de tactique
 */
export const TACTIQUE_METRICS_FIELDS = [
  'TC_Media_Budget',
  'TC_BuyCurrency', 
  'TC_CM360_Rate',
  'TC_CM360_Volume',
  'TC_Buy_Type',
  'TC_Label',
  'TC_Publisher'
] as const;

/**
 * Champs à comparer pour les placements
 */
export const PLACEMENT_FIELDS = [
  'PL_Label',
  'PL_Tag_Type',
  'PL_Tag_Start_Date',
  'PL_Tag_End_Date',
  'PL_Rotation_Type',
  'PL_Floodlight',
  'PL_Third_Party_Measurement',
  'PL_VPAID',
  'PL_Tag_1',
  'PL_Tag_2',
  'PL_Tag_3'
] as const;

/**
 * Champs à comparer pour les créatifs
 */
export const CREATIVE_FIELDS = [
  'CR_Label',
  'CR_Tag_Start_Date',
  'CR_Tag_End_Date',
  'CR_Rotation_Weight',
  'CR_Tag_5',
  'CR_Tag_6'
] as const;

// ================================
// TYPES HELPERS
// ================================

/**
 * Type helper pour extraire le type d'élément depuis un ID de ligne
 */
export type ExtractItemType<T extends string> = T extends `${infer Type}-${string}` 
  ? Type extends AdOpsItemType 
    ? Type 
    : never 
  : never;

/**
 * Type helper pour extraire l'ID depuis un ID de ligne
 */
export type ExtractItemId<T extends string> = T extends `${string}-${infer Id}` ? Id : never;

/**
 * Type guard pour vérifier si un élément est une tactique
 */
export function isAdOpsTactique(item: AdOpsItem): item is AdOpsTactique {
  return 'ongletId' in item && 'sectionId' in item;
}

/**
 * Type guard pour vérifier si un élément est un placement
 */
export function isAdOpsPlacement(item: AdOpsItem): item is AdOpsPlacement {
  return 'PL_Label' in item;
}

/**
 * Type guard pour vérifier si un élément est un créatif
 */
export function isAdOpsCreative(item: AdOpsItem): item is AdOpsCreative {
  return 'CR_Label' in item;
}