// app/config/taxonomyFields.ts - CONFIGURATION CENTRALISÉE COMPLÈTE

/**
 * Configuration centralisée de tous les champs disponibles dans les taxonomies
 * C'est ici qu'on ajoute de nouveaux champs pour qu'ils soient automatiquement
 * disponibles dans TaxonomyForm et PlacementDrawer
 */

// ==================== TYPES ====================

export type FieldSource = 'campaign' | 'tactique' | 'manual';

export type TaxonomyFormat = 'code' | 'display_fr' | 'display_en' | 'utm' | 'custom_utm' | 'custom_code' | 'open';

export interface FieldDefinition {
  id: string;                    // Identifiant unique du champ
  name: string;                  // Nom d'affichage
  source: FieldSource;           // Source du champ
  description?: string;          // Description du champ
  supportedFormats: TaxonomyFormat[]; // Formats supportés par ce champ
  defaultFormat: TaxonomyFormat; // Format par défaut
  isRequired?: boolean;          // Champ obligatoire
  hasCustomList?: boolean;       // Possède une liste dynamique de shortcodes
}

export interface FormatOption {
  id: TaxonomyFormat;
  label: string;
  description: string;
  requiresShortcode: boolean; // Indique si ce format nécessite un shortcode
  allowsUserInput: boolean;   // Indique si l'utilisateur peut saisir une valeur libre
  fallbackChain?: TaxonomyFormat[]; // Chaîne de fallback si valeur non trouvée
}

// ==================== DÉFINITION DES FORMATS ====================

/**
 * Configuration complète de tous les formats supportés
 */
export const TAXONOMY_FORMATS: FormatOption[] = [
  { 
    id: 'code', 
    label: 'Code', 
    description: 'Utilise la valeur SH_Code du shortcode',
    requiresShortcode: true,
    allowsUserInput: false
  },
  { 
    id: 'display_fr', 
    label: 'Display FR', 
    description: 'Utilise la valeur SH_Display_Name_FR du shortcode',
    requiresShortcode: true,
    allowsUserInput: false
  },
  { 
    id: 'display_en', 
    label: 'Display EN', 
    description: 'Utilise la valeur SH_Display_Name_EN du shortcode avec fallback sur SH_Display_Name_FR',
    requiresShortcode: true,
    allowsUserInput: false,
    fallbackChain: ['display_fr']
  },
  { 
    id: 'utm', 
    label: 'UTM', 
    description: 'Utilise la valeur SH_Default_UTM du shortcode avec fallback sur SH_Code',
    requiresShortcode: true,
    allowsUserInput: false,
    fallbackChain: ['code']
  },
  { 
    id: 'custom_utm', 
    label: 'UTM Personnalisé', 
    description: 'Utilise la valeur personnalisée UTM du client, sinon SH_Default_UTM, sinon SH_Code',
    requiresShortcode: true,
    allowsUserInput: false,
    fallbackChain: ['utm', 'code']
  },
  { 
    id: 'custom_code', 
    label: 'Code Personnalisé', 
    description: 'Utilise la valeur personnalisée Code du client, sinon SH_Code',
    requiresShortcode: true,
    allowsUserInput: false,
    fallbackChain: ['code']
  },
  { 
    id: 'open', 
    label: 'Saisie Libre', 
    description: 'Utilise directement la valeur saisie par l\'utilisateur',
    requiresShortcode: false,
    allowsUserInput: true
  }
];

// ==================== DÉFINITION DES CHAMPS DISPONIBLES ====================

/**
 * 🔥 CONFIGURATION CENTRALISÉE : Tous les champs disponibles dans les taxonomies
 * Pour ajouter un nouveau champ, l'ajouter ici avec sa source et ses formats supportés
 */
export const AVAILABLE_FIELDS: FieldDefinition[] = [
  
  // ==================== CHAMPS DE CAMPAGNE ====================
  {
    id: 'CA_Campaign_Identifier',
    name: 'Identifiant de campagne',
    source: 'campaign',
    description: 'Nom de la campagne',
    supportedFormats: ['display_fr', 'code', 'open'],
    defaultFormat: 'display_fr'
  },
  {
    id: 'CA_Client',
    name: 'Client',
    source: 'campaign',
    description: 'Nom du client',
    supportedFormats: ['display_fr', 'code', 'open'],
    defaultFormat: 'display_fr'
  },
  {
    id: 'CA_Division',
    name: 'Division',
    source: 'campaign',
    description: 'Division de la campagne',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'CA_Quarter',
    name: 'Trimestre',
    source: 'campaign',
    description: 'Trimestre de la campagne',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'code',
    hasCustomList: true
  },
  {
    id: 'CA_Year',
    name: 'Année',
    source: 'campaign',
    description: 'Année de la campagne',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'code',
    hasCustomList: true
  },
  {
    id: 'CA_Custom_Dim_1',
    name: 'Dimension personnalisée 1 (Campagne)',
    source: 'campaign',
    description: 'Première dimension personnalisée de la campagne',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'CA_Custom_Dim_2',
    name: 'Dimension personnalisée 2 (Campagne)',
    source: 'campaign',
    description: 'Deuxième dimension personnalisée de la campagne',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'CA_Custom_Dim_3',
    name: 'Dimension personnalisée 3 (Campagne)',
    source: 'campaign',
    description: 'Troisième dimension personnalisée de la campagne',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'CA_Budget',
    name: 'Budget de campagne',
    source: 'campaign',
    description: 'Budget total de la campagne',
    supportedFormats: ['display_fr', 'code', 'open'],
    defaultFormat: 'display_fr'
  },
  {
    id: 'CA_Currency',
    name: 'Devise de campagne',
    source: 'campaign',
    description: 'Devise de la campagne',
    supportedFormats: ['code', 'display_fr', 'open'],
    defaultFormat: 'code'
  },
  {
    id: 'CA_Start_Date',
    name: 'Date de début (Campagne)',
    source: 'campaign',
    description: 'Date de début de la campagne',
    supportedFormats: ['display_fr', 'code', 'open'],
    defaultFormat: 'display_fr'
  },
  {
    id: 'CA_End_Date',
    name: 'Date de fin (Campagne)',
    source: 'campaign',
    description: 'Date de fin de la campagne',
    supportedFormats: ['display_fr', 'code', 'open'],
    defaultFormat: 'display_fr'
  },
  {
    id: 'CA_Billing_ID',
    name: 'ID de facturation (Campagne)',
    source: 'campaign',
    description: 'Identifiant de facturation de la campagne',
    supportedFormats: ['code', 'display_fr', 'open'],
    defaultFormat: 'code'
  },
  {
    id: 'CA_PO',
    name: 'PO (Campagne)',
    source: 'campaign',
    description: 'Numéro de bon de commande de la campagne',
    supportedFormats: ['code', 'display_fr', 'open'],
    defaultFormat: 'code'
  },

  // ==================== CHAMPS DE TACTIQUE ====================
  {
    id: 'TC_Publisher',
    name: 'Partenaire',
    source: 'tactique',
    description: 'Partenaire média sélectionné',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Objective',
    name: 'Objectif',
    source: 'tactique',
    description: 'Objectif de la tactique',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_LOB',
    name: 'Ligne d\'affaires',
    source: 'tactique',
    description: 'Ligne d\'affaires de la tactique',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Media_Type',
    name: 'Type média',
    source: 'tactique',
    description: 'Type de média utilisé',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Buying_Method',
    name: 'Méthode d\'achat',
    source: 'tactique',
    description: 'Méthode d\'achat média',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Custom_Dim_1',
    name: 'Dimension personnalisée 1 (Tactique)',
    source: 'tactique',
    description: 'Première dimension personnalisée de la tactique',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Custom_Dim_2',
    name: 'Dimension personnalisée 2 (Tactique)',
    source: 'tactique',
    description: 'Deuxième dimension personnalisée de la tactique',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Custom_Dim_3',
    name: 'Dimension personnalisée 3 (Tactique)',
    source: 'tactique',
    description: 'Troisième dimension personnalisée de la tactique',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Inventory',
    name: 'Inventaire',
    source: 'tactique',
    description: 'Type d\'inventaire utilisé',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Market',
    name: 'Marché',
    source: 'tactique',
    description: 'Marché ciblé',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Language',
    name: 'Langue',
    source: 'tactique',
    description: 'Langue de la tactique',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'code',
    hasCustomList: true
  },
  {
    id: 'TC_Media_Objective',
    name: 'Objectif média',
    source: 'tactique',
    description: 'Objectif média de la tactique',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Kpi',
    name: 'KPI principal',
    source: 'tactique',
    description: 'Indicateur de performance principal',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Unit_Type',
    name: 'Type d\'unité',
    source: 'tactique',
    description: 'Type d\'unité d\'achat',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  },
  {
    id: 'TC_Budget',
    name: 'Budget de tactique',
    source: 'tactique',
    description: 'Budget alloué à la tactique',
    supportedFormats: ['display_fr', 'code', 'open'],
    defaultFormat: 'display_fr'
  },
  {
    id: 'TC_Currency',
    name: 'Devise de tactique',
    source: 'tactique',
    description: 'Devise d\'achat de la tactique',
    supportedFormats: ['code', 'display_fr', 'open'],
    defaultFormat: 'code'
  },
  {
    id: 'TC_Billing_ID',
    name: 'ID de facturation (Tactique)',
    source: 'tactique',
    description: 'Identifiant de facturation de la tactique',
    supportedFormats: ['code', 'display_fr', 'open'],
    defaultFormat: 'code'
  },
  {
    id: 'TC_PO',
    name: 'PO (Tactique)',
    source: 'tactique',
    description: 'Numéro de bon de commande de la tactique',
    supportedFormats: ['code', 'display_fr', 'open'],
    defaultFormat: 'code'
  },
  {
    id: 'TC_Start_Date',
    name: 'Date de début (Tactique)',
    source: 'tactique',
    description: 'Date de début de la tactique',
    supportedFormats: ['display_fr', 'code', 'open'],
    defaultFormat: 'display_fr'
  },
  {
    id: 'TC_End_Date',
    name: 'Date de fin (Tactique)',
    source: 'tactique',
    description: 'Date de fin de la tactique',
    supportedFormats: ['display_fr', 'code', 'open'],
    defaultFormat: 'display_fr'
  },
  {
    id: 'TC_Format',
    name: 'Format (Tactique)',
    source: 'tactique',
    description: 'Format de la tactique',
    supportedFormats: ['code', 'display_fr', 'open'],
    defaultFormat: 'display_fr'
  },
  {
    id: 'TC_Placement',
    name: 'Placement (Tactique)',
    source: 'tactique',
    description: 'Placement de la tactique',
    supportedFormats: ['code', 'display_fr', 'open'],
    defaultFormat: 'display_fr'
  },

  // ==================== CHAMPS MANUELS (PLACEMENT) ====================
  {
    id: 'TAX_Product',
    name: 'Produit',
    source: 'manual',
    description: 'Produit ou service promu',
    supportedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code', 'open'],
    defaultFormat: 'display_fr',
    hasCustomList: true
  }
];

// ==================== COULEURS POUR LES SOURCES ====================

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

// ==================== COULEURS POUR LES FORMATS ====================

export const FORMAT_COLORS = {
  code: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300'
  },
  display_fr: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-300'
  },
  display_en: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300'
  },
  utm: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-300'
  },
  custom_utm: {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-300'
  },
  custom_code: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300'
  },
  open: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300'
  }
} as const;

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Obtient la définition d'un champ par son ID
 */
export function getFieldDefinition(fieldId: string): FieldDefinition | null {
  return AVAILABLE_FIELDS.find(field => field.id === fieldId) || null;
}

/**
 * Obtient tous les champs d'une source donnée
 */
export function getFieldsBySource(source: FieldSource): FieldDefinition[] {
  return AVAILABLE_FIELDS.filter(field => field.source === source);
}

/**
 * Détermine la source d'un champ donné
 */
export function getFieldSource(fieldId: string): FieldSource | null {
  const field = getFieldDefinition(fieldId);
  return field?.source || null;
}

/**
 * Obtient les informations d'un format par son ID
 */
export function getFormatInfo(formatId: TaxonomyFormat): FormatOption | null {
  return TAXONOMY_FORMATS.find(format => format.id === formatId) || null;
}

/**
 * Obtient la configuration de couleur pour une source donnée
 */
export function getSourceColor(source: FieldSource | null) {
  if (!source) return SOURCE_COLORS.empty;
  return SOURCE_COLORS[source];
}

/**
 * Obtient la configuration de couleur pour un format donné
 */
export function getFormatColor(format: TaxonomyFormat) {
  return FORMAT_COLORS[format] || FORMAT_COLORS.display_fr;
}

/**
 * Valide qu'un format existe dans la configuration
 */
export function isValidFormat(formatId: string): boolean {
  return TAXONOMY_FORMATS.some(format => format.id === formatId);
}

/**
 * Détermine si un format nécessite un shortcode
 */
export function formatRequiresShortcode(format: TaxonomyFormat): boolean {
  const formatInfo = getFormatInfo(format);
  return formatInfo?.requiresShortcode ?? true;
}

/**
 * Détermine si un format permet la saisie libre
 */
export function formatAllowsUserInput(format: TaxonomyFormat): boolean {
  const formatInfo = getFormatInfo(format);
  return formatInfo?.allowsUserInput ?? false;
}

/**
 * Obtient la chaîne de fallback pour un format
 */
export function getFormatFallbackChain(format: TaxonomyFormat): TaxonomyFormat[] {
  const formatInfo = getFormatInfo(format);
  return formatInfo?.fallbackChain || [];
}

/**
 * Valide qu'une variable est reconnue dans notre configuration
 */
export function isKnownVariable(variableName: string): boolean {
  return getFieldDefinition(variableName) !== null;
}

/**
 * Obtient les formats compatibles avec un champ donné
 */
export function getCompatibleFormats(fieldId: string): FormatOption[] {
  const field = getFieldDefinition(fieldId);
  if (!field) return [];
  
  return TAXONOMY_FORMATS.filter(format => 
    field.supportedFormats.includes(format.id)
  );
}

/**
 * Génère un ID unique pour un champ de saisie
 */
export function generateFieldId(variable: string, level: number): string {
  return `taxonomy_field_${variable}_level_${level}`;
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
  PARSING_ERROR: 'Erreur lors de l\'analyse de la structure de taxonomie',
  SHORTCODE_REQUIRED: 'Ce format nécessite la sélection d\'un shortcode',
  USER_INPUT_REQUIRED: 'Ce format nécessite une saisie utilisateur'
} as const;

// ==================== MAPPING HÉRITÉ POUR COMPATIBILITÉ ====================

/**
 * Mapping des anciens noms vers les nouveaux pour compatibilité ascendante
 */
export const LEGACY_FIELD_MAPPING: { [oldName: string]: string } = {
  'UTM_TC_Channel': 'TC_Media_Type',
  'UTM_TC_Publisher': 'TC_Publisher',
  'UTM_CR_Format_Details': 'TC_Format',
  'CR_Plateform_Name': 'TC_Publisher',
  'UTM_TC_Language': 'TC_Language',
  'TC_Targeting': 'TC_Custom_Dim_1', // À adapter selon le besoin
  'TAX_Product': 'TAX_Product'
};

/**
 * Résout un nom de champ hérité vers le nouveau système
 */
export function resolveFieldName(fieldName: string): string {
  return LEGACY_FIELD_MAPPING[fieldName] || fieldName;
}