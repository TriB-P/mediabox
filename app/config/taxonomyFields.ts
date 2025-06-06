// app/config/taxonomyFields.ts

/**
 * Configuration des sources de données pour les champs de taxonomie
 * Définit d'où proviennent les valeurs des variables utilisées dans les taxonomies
 */

// ==================== TYPES ====================

export type FieldSource = 'campaign' | 'tactique' | 'manual';

export interface FieldSourceConfig {
  campaign: string[];
  tactique: string[];
  manual: string[];
}

export interface FormatOption {
  id: string;
  label: string;
  field: string;
}

export interface ParsedVariable {
  variable: string;
  format: string;
  source: FieldSource;
  level: number;
  isValid: boolean;
  errorMessage?: string;
}

export interface TaxonomyValues {
  [variableName: string]: {
    value: string;
    source: FieldSource;
    format: string;
  };
}

export interface GeneratedTaxonomies {
  tags?: string;
  platform?: string;
  mediaocean?: string;
}

// ==================== CONFIGURATION DES SOURCES ====================

/**
 * Configuration des sources de données pour chaque type de champ
 * 
 * - campaign: Champs provenant des données de campagne (hérités automatiquement)
 * - tactique: Champs provenant des données de tactique (hérités automatiquement)  
 * - manual: Champs qui doivent être saisis manuellement dans l'onglet
 */
export const TAXONOMY_FIELD_SOURCES: FieldSourceConfig = {
  // Champs provenant de la campagne (mise à jour automatique)
  campaign: [
    'CA_Campaign_Identifier',
    'CA_Division',
    'CA_Quarter', 
    'CA_Year',
    'CA_Custom_Dim_1',
    'CA_Custom_Dim_2',
    'CA_Custom_Dim_3',
    'CA_Billing_ID',
    'CA_PO',
    'CA_Budget',
    'CA_Currency',
    'CA_Start_Date',
    'CA_End_Date',
  ],
  
  // Champs provenant de la tactique (mise à jour automatique)
  tactique: [
    'TC_Publisher',
    'TC_Objective', 
    'TC_LOB',
    'TC_Media_Type',
    'TC_Buying_Method',
    'TC_Custom_Dim_1',
    'TC_Custom_Dim_2', 
    'TC_Custom_Dim_3',
    'TC_Inventory',
    'TC_Market',
    'TC_Language',
    'TC_Media_Objective',
    'TC_Kpi',
    'TC_Unit_Type',
    'TC_Budget',
    'TC_Currency',
    'TC_Billing_ID',
    'TC_PO',
    'TC_Start_Date',
    'TC_End_Date',
    'TC_Format',
    'TC_Placement',
  ],
  
  // Champs à saisir manuellement dans l'onglet
  manual: [
    'TC_Media_Type'
  ]
};

// ==================== FORMATS DISPONIBLES ====================

/**
 * Formats disponibles pour les variables dans les taxonomies
 * Chaque format correspond à un champ spécifique dans les shortcodes
 */
export const SHORTCODE_FORMATS: FormatOption[] = [
  { 
    id: 'code', 
    label: 'Code', 
    field: 'SH_Code' 
  },
  { 
    id: 'display_fr', 
    label: 'Display FR', 
    field: 'SH_Display_Name_FR' 
  },
  { 
    id: 'display_en', 
    label: 'Display EN', 
    field: 'SH_Display_Name_EN' 
  },
  { 
    id: 'utm', 
    label: 'UTM', 
    field: 'SH_Default_UTM' 
  },
  { 
    id: 'custom', 
    label: 'Custom Code', 
    field: 'customCode' 
  }
];

// ==================== COULEURS POUR LES SOURCES ====================

/**
 * Couleurs utilisées pour identifier les sources dans l'interface
 */
export const SOURCE_COLORS = {
  campaign: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    hex: '#3B82F6'
  },
  tactique: {
    bg: 'bg-green-100', 
    text: 'text-green-800',
    border: 'border-green-300',
    hex: '#10B981'
  },
  manual: {
    bg: 'bg-orange-100',
    text: 'text-orange-800', 
    border: 'border-orange-300',
    hex: '#F59E0B'
  },
  empty: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300', 
    hex: '#6B7280'
  }
} as const;

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Détermine la source d'un champ donné
 */
export function getFieldSource(fieldName: string): FieldSource | null {
  if (TAXONOMY_FIELD_SOURCES.campaign.includes(fieldName)) {
    return 'campaign';
  }
  if (TAXONOMY_FIELD_SOURCES.tactique.includes(fieldName)) {
    return 'tactique';
  }
  if (TAXONOMY_FIELD_SOURCES.manual.includes(fieldName)) {
    return 'manual';
  }
  return null;
}

/**
 * Valide qu'un format existe dans la configuration
 */
export function isValidFormat(formatId: string): boolean {
  return SHORTCODE_FORMATS.some(format => format.id === formatId);
}

/**
 * Obtient les informations d'un format par son ID
 */
export function getFormatInfo(formatId: string): FormatOption | null {
  return SHORTCODE_FORMATS.find(format => format.id === formatId) || null;
}

/**
 * Obtient la configuration de couleur pour une source donnée
 */
export function getSourceColor(source: FieldSource | null) {
  if (!source) return SOURCE_COLORS.empty;
  return SOURCE_COLORS[source];
}

/**
 * Génère un ID unique pour un champ de saisie
 */
export function generateFieldId(variable: string, level: number): string {
  return `taxonomy_field_${variable}_level_${level}`;
}

/**
 * Valide qu'une variable est reconnue dans notre configuration
 */
export function isKnownVariable(variableName: string): boolean {
  return getFieldSource(variableName) !== null;
}

/**
 * Obtient tous les champs d'une source donnée
 */
export function getFieldsBySource(source: FieldSource): string[] {
  return TAXONOMY_FIELD_SOURCES[source] || [];
}

// ==================== CONSTANTES ====================

/**
 * Nombre maximum de niveaux de taxonomie à traiter
 */
export const MAX_TAXONOMY_LEVELS = 4;

/**
 * Regex pour parser les variables dans les taxonomies
 * Format attendu : [VARIABLE_NAME:format]
 */
export const TAXONOMY_VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;

/**
 * Types de taxonomies supportés
 */
export const TAXONOMY_TYPES = {
  TAGS: 'tags',
  PLATFORM: 'platform', 
  MEDIAOCEAN: 'mediaocean'
} as const;

export type TaxonomyType = typeof TAXONOMY_TYPES[keyof typeof TAXONOMY_TYPES];

/**
 * Messages d'erreur standardisés
 */
export const ERROR_MESSAGES = {
  UNKNOWN_VARIABLE: 'Variable non reconnue dans la configuration',
  INVALID_FORMAT: 'Format non valide pour cette variable',
  MISSING_VALUE: 'Valeur manquante pour cette variable',
  PARSING_ERROR: 'Erreur lors de l\'analyse de la structure de taxonomie'
} as const;