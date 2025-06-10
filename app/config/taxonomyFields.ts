// app/config/taxonomyFields.ts

/**
 * Configuration centrale pour toutes les variables de taxonomie et leurs utilitaires.
 * Ce fichier est la source de vérité pour déterminer :
 * 1. La source d'une variable (héritée de la campagne, de la tactique, ou manuelle).
 * 2. Les formats de sortie autorisés pour chaque variable.
 * 3. Des fonctions utilitaires pour manipuler ces configurations.
 */

// ==================== TYPES ====================

// Définit les sources possibles pour une variable de taxonomie.
export type FieldSource = 'campaign' | 'tactique' | 'manual';

// Définit tous les formats de sortie possibles pour une variable.
export type TaxonomyFormat = 'code' | 'display_fr' | 'display_en' | 'utm' | 'custom_utm' | 'custom_code' | 'open';

// Définit la structure de configuration pour une seule variable.
export interface VariableConfig {
  source: FieldSource;
  allowedFormats: TaxonomyFormat[];
}

// Interface pour les options de formatage
export interface FormatOption {
  id: TaxonomyFormat;
  label: string;
  description: string;
  requiresShortcode: boolean;
  allowsUserInput: boolean;
}

// ==================== CONFIGURATION CENTRALE DES VARIABLES (NOUVEAU) ====================

export const TAXONOMY_VARIABLE_CONFIG: Record<string, VariableConfig> = {

  // --- Variables de niveau Campagne ---
  'CA_Campaign_Identifier': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Client': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Division': { source: 'campaign', allowedFormats: ['code', 'display_fr', 'display_en'] },
  'CA_Quarter': { source: 'campaign', allowedFormats: ['code', 'display_fr'] },
  'CA_Year': { source: 'campaign', allowedFormats: ['code'] },
  'CA_Custom_Dim_1': { source: 'campaign', allowedFormats: ['code', 'display_fr', 'display_en'] },
  'CA_Custom_Dim_2': { source: 'campaign', allowedFormats: ['code', 'display_fr', 'display_en'] },
  'CA_Custom_Dim_3': { source: 'campaign', allowedFormats: ['code', 'display_fr', 'display_en'] },

  // --- Variables de niveau Tactique ---
  'TC_Publisher': { source: 'tactique', allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_code', 'custom_utm'] },
  'TC_Media_Type': { source: 'tactique', allowedFormats: ['code', 'display_fr', 'display_en'] },
  'TC_Buying_Method': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_LOB': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_Objective': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_Inventory': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_Market': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_Language': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_Media_Objective': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_Kpi': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_Unit_Type': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_Custom_Dim_1': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_Custom_Dim_2': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_Custom_Dim_3': { source: 'tactique', allowedFormats: ['code', 'display_fr'] },
  'TC_Format': { source: 'tactique', allowedFormats: ['open'] },
  'TC_Placement': { source: 'tactique', allowedFormats: ['open'] },

  // --- Variables de niveau Placement (Manuelles) ---
  'TAX_Product': { source: 'manual', allowedFormats: ['open', 'code', 'display_fr','custom_utm','utm','custom_code'] },
  'TAX_Location': { source: 'manual', allowedFormats: ['open', 'code', 'display_fr'] },
  'TAX_Custom_Field_1': { source: 'manual', allowedFormats: ['open'] },
  'TAX_Custom_Field_2': { source: 'manual', allowedFormats: ['open'] },
  'TAX_Custom_Field_3': { source: 'manual', allowedFormats: ['open'] },
  
  // --- Variables spéciales (souvent pour les UTM) ---
  'UTM_TC_Channel': { source: 'tactique', allowedFormats: ['utm'] },
  'UTM_TC_Publisher': { source: 'tactique', allowedFormats: ['utm'] },
  'UTM_CR_Format_Details': { source: 'manual', allowedFormats: ['open'] }, // Créatif/Placement
  'CR_Plateform_Name': { source: 'manual', allowedFormats: ['open'] }, // Créatif/Placement
  'UTM_TC_Language': { source: 'tactique', allowedFormats: ['utm', 'code'] },
  
  // --- Variables Admin (héritées) ---
  'TC_Billing_ID': { source: 'tactique', allowedFormats: ['open'] },
  'TC_PO': { source: 'tactique', allowedFormats: ['open'] },
};


// ==================== FORMATS DISPONIBLES (RÉINTÉGRÉ) ====================

export const TAXONOMY_FORMATS: FormatOption[] = [
  { id: 'code', label: 'Code', description: 'Utilise la valeur SH_Code du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'display_fr', label: 'Display FR', description: 'Utilise la valeur SH_Display_Name_FR du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'display_en', label: 'Display EN', description: 'Utilise la valeur SH_Display_Name_EN du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'utm', label: 'UTM', description: 'Utilise la valeur SH_Default_UTM du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'custom_utm', label: 'UTM Personnalisé', description: 'Utilise la valeur personnalisée UTM du client, sinon SH_Default_UTM', requiresShortcode: true, allowsUserInput: false },
  { id: 'custom_code', label: 'Code Personnalisé', description: 'Utilise la valeur personnalisée Code du client, sinon SH_Code', requiresShortcode: true, allowsUserInput: false },
  { id: 'open', label: 'Saisie Libre', description: 'Utilise directement la valeur saisie par l\'utilisateur', requiresShortcode: false, allowsUserInput: true }
];

// ==================== COULEURS (RÉINTÉGRÉ) ====================

export const SOURCE_COLORS = {
  campaign: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', hex: '#3B82F6' },
  tactique: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', hex: '#10B981' },
  manual: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', hex: '#F59E0B' },
  empty: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', hex: '#6B7280' }
} as const;

export const FORMAT_COLORS = {
  code: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  display_fr: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  display_en: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  utm: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  custom_utm: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
  custom_code: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  open: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' }
} as const;


// ==================== FONCTIONS UTILITAIRES (MISES À JOUR ET RÉINTÉGRÉES) ====================

export function getFieldSource(fieldName: string): FieldSource | null {
  return TAXONOMY_VARIABLE_CONFIG[fieldName]?.source || null;
}

export function isKnownVariable(variableName: string): boolean {
  return variableName in TAXONOMY_VARIABLE_CONFIG;
}

export function isFormatAllowed(variableName: string, format: TaxonomyFormat): boolean {
  const config = TAXONOMY_VARIABLE_CONFIG[variableName];
  return config ? config.allowedFormats.includes(format) : false;
}

// 🔥 NOUVELLE FONCTION AJOUTÉE
export function getVariableConfig(variableName: string): VariableConfig | null {
  return TAXONOMY_VARIABLE_CONFIG[variableName] || null;
}

export function isValidFormat(formatId: string): boolean {
  return TAXONOMY_FORMATS.some(format => format.id === formatId);
}

export function getFormatInfo(formatId: TaxonomyFormat): FormatOption | null {
  return TAXONOMY_FORMATS.find(format => format.id === formatId) || null;
}

export function getSourceColor(source: FieldSource | null) {
  if (!source) return SOURCE_COLORS.empty;
  return SOURCE_COLORS[source];
}

export function getFormatColor(format: TaxonomyFormat) {
  return FORMAT_COLORS[format] || FORMAT_COLORS.display_fr;
}

export function generateFieldId(variable: string, level: number): string {
  return `taxonomy_field_${variable}_level_${level}`;
}

export function formatRequiresShortcode(format: TaxonomyFormat): boolean {
  const formatInfo = getFormatInfo(format);
  return formatInfo?.requiresShortcode ?? true;
}

export function formatAllowsUserInput(format: TaxonomyFormat): boolean {
  const formatInfo = getFormatInfo(format);
  return formatInfo?.allowsUserInput ?? false;
}

export function getCompatibleFormats(source: FieldSource): FormatOption[] {
  if (source === 'campaign' || source === 'tactique') {
    return TAXONOMY_FORMATS.filter(format => 
      format.id === 'display_fr' || 
      format.id === 'code' || 
      format.id === 'open'
    );
  }
  return TAXONOMY_FORMATS;
}

// ==================== CONSTANTES (RÉINTÉGRÉES) ====================

export const MAX_TAXONOMY_LEVELS = 6;

export const TAXONOMY_VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;

export const TAXONOMY_TYPES = {
  TAGS: 'tags',
  PLATFORM: 'platform', 
  MEDIAOCEAN: 'mediaocean'
} as const;

export type TaxonomyType = typeof TAXONOMY_TYPES[keyof typeof TAXONOMY_TYPES];

export const ERROR_MESSAGES = {
  UNKNOWN_VARIABLE: 'Variable non reconnue dans la configuration',
  INVALID_FORMAT: 'Format non valide pour cette variable',
  MISSING_VALUE: 'Valeur manquante pour cette variable',
  PARSING_ERROR: 'Erreur lors de l\'analyse de la structure de taxonomie',
  SHORTCODE_REQUIRED: 'Ce format nécessite la sélection d\'un shortcode',
  USER_INPUT_REQUIRED: 'Ce format nécessite une saisie utilisateur'
} as const;