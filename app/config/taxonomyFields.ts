// app/config/taxonomyFields.ts

/**
 * Configuration centrale pour toutes les variables de taxonomie et leurs utilitaires.
 * Ce fichier est la source de vérité pour déterminer :
 * 1. La source d'une variable (héritée de la campagne, de la tactique, du placement, ou manuelle).
 * 2. Les formats de sortie autorisés pour chaque variable.
 * 3. Des fonctions utilitaires pour manipuler ces configurations.
 */

// ==================== TYPES ====================

// Définit les sources possibles pour une variable de taxonomie.
export type FieldSource = 'campaign' | 'tactique' | 'placement' | 'manual';

// Définit tous les formats de sortie possibles pour une variable.
export type TaxonomyFormat = 'code' | 'display_fr' | 'display_en' | 'utm' | 'custom_utm' | 'custom_code' | 'open';

// Définit la structure de configuration pour une seule variable.
export interface VariableConfig {
  source: FieldSource;
  allowedFormats: TaxonomyFormat[];
  label?: string; 
}

// Interface pour les options de formatage
export interface FormatOption {
  id: TaxonomyFormat;
  label: string;
  description: string;
  requiresShortcode: boolean;
  allowsUserInput: boolean;
}

// ==================== CONFIGURATION CENTRALE DES VARIABLES ====================

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
  'TC_Billing_ID': { source: 'tactique', allowedFormats: ['open'] },
  'TC_PO': { source: 'tactique', allowedFormats: ['open'] },

  // --- 🆕 Variables de niveau Placement ---
  'PL_Label': { source: 'placement', allowedFormats: ['open'] },
  'TAX_Product': { source: 'placement', allowedFormats: ['open', 'code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'TAX_Location': { source: 'placement', allowedFormats: ['open', 'code', 'display_fr', 'display_en'] },
  'TAX_Audience_Demographics': { source: 'placement', allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'TAX_Device': { source: 'placement', allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'TAX_Targeting': { source: 'placement', allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },

  // --- 🆕 Variables de niveau Créatif (manuelles) ---
  'CR_Start_Date': { 
    source: 'manual', 
    label: 'Date de début créatif', 
    allowedFormats: ['open', 'code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] 
  },
  'CR_End_Date': { 
    source: 'manual', 
    label: 'Date de fin créatif', 
    allowedFormats: ['open', 'code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] 
  },
  'CR_Rotation_Weight': { 
    source: 'manual', 
    label: 'Poids de rotation', 
    allowedFormats: ['open', 'code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] 
  },
  'CR_CTA': { 
    source: 'manual', 
    label: 'Call-to-Action', 
    allowedFormats: ['open', 'code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] 
  },
  'CR_Format_Details': { 
    source: 'manual', 
    label: 'Détails du format', 
    allowedFormats: ['open', 'code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] 
  },
  'CR_Offer': { 
    source: 'manual', 
    label: 'Offre', 
    allowedFormats: ['open', 'code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] 
  },
  'CR_Plateform_Name': { 
    source: 'manual', 
    label: 'Nom de plateforme', 
    allowedFormats: ['open', 'code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] 
  },
  'CR_Primary_Product': { 
    source: 'manual', 
    label: 'Produit principal', 
    allowedFormats: ['open', 'code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] 
  },
  'CR_URL': { 
    source: 'manual', 
    label: 'URL du créatif', 
    allowedFormats: ['open', 'code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] 
  },
  'CR_Version': { 
    source: 'manual', 
    label: 'Version du créatif', 
    allowedFormats: ['open', 'code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] 
  },

  // Variables placement (legacy - pour compatibilité)
  'TAX_Product_Legacy': { 
    source: 'manual', 
    label: 'Produit', 
    allowedFormats: ['open', 'code', 'display_fr','custom_utm','utm','custom_code'] 
  },
  'TAX_Location_Legacy': { 
    source: 'manual', 
    label: 'Emplacement', 
    allowedFormats: ['open', 'code', 'display_fr'] 
  },
  'TAX_Audience_Demographics_Legacy': { 
    source: 'manual', 
    label: 'Audience - Démographique', 
    allowedFormats: ['code', 'display_fr','custom_utm','utm','custom_code'] 
  },
  'TAX_Device_Legacy': { 
    source: 'manual', 
    label: 'Appareil', 
    allowedFormats: ['code', 'display_fr','custom_utm','utm','custom_code'] 
  },
  'TAX_Targeting_Legacy': { 
    source: 'manual', 
    label: 'Type de ciblage', 
    allowedFormats: ['code', 'display_fr','custom_utm','utm','custom_code'] 
  },
};

// ==================== FORMATS DISPONIBLES ====================

export const TAXONOMY_FORMATS: FormatOption[] = [
  { id: 'code', label: 'Code', description: 'Utilise la valeur SH_Code du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'display_fr', label: 'Display FR', description: 'Utilise la valeur SH_Display_Name_FR du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'display_en', label: 'Display EN', description: 'Utilise la valeur SH_Display_Name_EN du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'utm', label: 'UTM', description: 'Utilise la valeur SH_Default_UTM du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'custom_utm', label: 'UTM Personnalisé', description: 'Utilise la valeur personnalisée UTM du client, sinon SH_Default_UTM', requiresShortcode: true, allowsUserInput: false },
  { id: 'custom_code', label: 'Code Personnalisé', description: 'Utilise la valeur personnalisée Code du client, sinon SH_Code', requiresShortcode: true, allowsUserInput: false },
  { id: 'open', label: 'Saisie Libre', description: 'Utilise directement la valeur saisie par l\'utilisateur', requiresShortcode: false, allowsUserInput: true }
];

// ==================== COULEURS ====================

export const SOURCE_COLORS = {
  campaign: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', hex: '#3B82F6' },
  tactique: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', hex: '#10B981' },
  placement: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', hex: '#8B5CF6' },
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

// ==================== FONCTIONS UTILITAIRES ====================

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
  if (source === 'campaign' || source === 'tactique' || source === 'placement') {
    return TAXONOMY_FORMATS.filter(format => 
      format.id === 'display_fr' || 
      format.id === 'code' || 
      format.id === 'open'
    );
  }
  return TAXONOMY_FORMATS;
}

// ==================== CONSTANTES ====================

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

// ==================== 🆕 FONCTIONS UTILITAIRES POUR LES CHAMPS MANUELS ====================

/**
 * Extrait tous les noms de variables qui ont source: 'manual'
 */
export function getManualVariableNames(): string[] {
  return Object.entries(TAXONOMY_VARIABLE_CONFIG)
    .filter(([_, config]) => config.source === 'manual')
    .map(([variableName, _]) => variableName);
}

/**
 * 🆕 Extrait tous les noms de variables qui ont source: 'manual' et commencent par 'CR_'
 */
export function getCreatifVariableNames(): string[] {
  return Object.entries(TAXONOMY_VARIABLE_CONFIG)
    .filter(([variableName, config]) => config.source === 'manual' && variableName.startsWith('CR_'))
    .map(([variableName, _]) => variableName);
}

/**
 * 🆕 Extrait tous les noms de variables qui ont source: 'manual' et commencent par 'TAX_' (pour les placements)
 */
export function getPlacementVariableNames(): string[] {
  return Object.entries(TAXONOMY_VARIABLE_CONFIG)
    .filter(([variableName, config]) => config.source === 'manual' && variableName.startsWith('TAX_'))
    .map(([variableName, _]) => variableName);
}

/**
 * Crée un objet vide avec tous les champs manuels initialisés
 */
export function createEmptyManualFieldsObject(): { [key: string]: string } {
  const manualVars = getManualVariableNames();
  const emptyObject: { [key: string]: string } = {};
  
  manualVars.forEach(varName => {
    emptyObject[varName] = '';
  });
  
  return emptyObject;
}

/**
 * 🆕 Crée un objet vide avec tous les champs créatifs initialisés
 */
export function createEmptyCreatifFieldsObject(): { [key: string]: string } {
  const creatifVars = getCreatifVariableNames();
  const emptyObject: { [key: string]: string } = {};
  
  creatifVars.forEach(varName => {
    emptyObject[varName] = '';
  });
  
  return emptyObject;
}

/**
 * Extrait les valeurs des champs manuels depuis un objet de données
 */
export function extractManualFieldsFromData(data: any): { [key: string]: string } {
  const manualVars = getManualVariableNames();
  const extractedFields: { [key: string]: string } = {};
  
  manualVars.forEach(varName => {
    if (data && typeof data[varName] !== 'undefined') {
      extractedFields[varName] = data[varName];
    }
  });
  
  return extractedFields;
}

/**
 * 🆕 Extrait les valeurs des champs créatifs depuis un objet de données
 */
export function extractCreatifFieldsFromData(data: any): { [key: string]: string } {
  const creatifVars = getCreatifVariableNames();
  const extractedFields: { [key: string]: string } = {};
  
  creatifVars.forEach(varName => {
    if (data && typeof data[varName] !== 'undefined') {
      extractedFields[varName] = data[varName];
    }
  });
  
  return extractedFields;
}

/**
 * Valide qu'un nom de variable est bien un champ manuel
 */
export function isManualVariable(variableName: string): boolean {
  const config = TAXONOMY_VARIABLE_CONFIG[variableName];
  return config ? config.source === 'manual' : false;
}

/**
 * 🆕 Valide qu'un nom de variable est bien un champ créatif
 */
export function isCreatifVariable(variableName: string): boolean {
  const config = TAXONOMY_VARIABLE_CONFIG[variableName];
  return config ? config.source === 'manual' && variableName.startsWith('CR_') : false;
}

/**
 * 🆕 Valide qu'un nom de variable est bien un champ placement
 */
export function isPlacementVariable(variableName: string): boolean {
  const config = TAXONOMY_VARIABLE_CONFIG[variableName];
  return config ? config.source === 'placement' || (config.source === 'manual' && variableName.startsWith('TAX_')) : false;
}