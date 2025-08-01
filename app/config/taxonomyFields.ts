// app/config/taxonomyFields.ts
/**
 * Ce fichier sert de source centrale pour la configuration des variables de taxonomie.
 * Il définit d'où proviennent les variables (campagne, tactique, placement, ou manuel),
 * les formats de sortie autorisés pour chaque variable,
 * et fournit des fonctions utilitaires pour interagir avec cette configuration.
 * C'est essentiel pour maintenir la cohérence et la validation des données de taxonomie à travers l'application.
 */

export type FieldSource = 'campaign' | 'tactique' | 'placement' | 'manual';

export type TaxonomyFormat = 'code' | 'display_fr' | 'display_en' | 'utm' | 'custom_utm' | 'custom_code' | 'open';

export interface VariableConfig {
  source: FieldSource;
  allowedFormats: TaxonomyFormat[];
  label?: string;
}

export interface FormatOption {
  id: TaxonomyFormat;
  label: string;
  description: string;
  requiresShortcode: boolean;
  allowsUserInput: boolean;
}

export const TAXONOMY_VARIABLE_CONFIG: Record<string, VariableConfig> = {
  'CA_Billing_ID': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Campaign_Identifier': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Client': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Client_Ext_Id': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Creative_Folder': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Currency': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Custom_Dim_1': { source: 'campaign', allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code', 'open'] },
  'CA_Custom_Dim_2': { source: 'campaign', allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code', 'open'] },
  'CA_Custom_Dim_3': { source: 'campaign', allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code', 'open'] },
  'CA_Custom_Fee_1': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Custom_Fee_2': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Custom_Fee_3': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Division': { source: 'campaign', allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'CA_End_Date': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Last_Edit': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Name': { source: 'campaign', allowedFormats: ['open'] },
  'CA_PO': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Quarter': { source: 'campaign', allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'CA_Sprint_Dates': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Start_Date': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Budget': { source: 'campaign', allowedFormats: ['open'] },
  'CA_Year': { source: 'campaign', allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
};

export const TAXONOMY_FORMATS: FormatOption[] = [
  { id: 'code', label: 'Code', description: 'Utilise la valeur SH_Code du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'display_fr', label: 'Display FR', description: 'Utilise la valeur SH_Display_Name_FR du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'display_en', label: 'Display EN', description: 'Utilise la valeur SH_Display_Name_EN du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'utm', label: 'UTM', description: 'Utilise la valeur SH_Default_UTM du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'custom_utm', label: 'UTM Personnalisé', description: 'Utilise la valeur personnalisée UTM du client, sinon SH_Default_UTM', requiresShortcode: true, allowsUserInput: false },
  { id: 'custom_code', label: 'Code Personnalisé', description: 'Utilise la valeur personnalisée Code du client, sinon SH_Code', requiresShortcode: true, allowsUserInput: false },
  { id: 'open', label: 'Saisie Libre', description: 'Utilise directement la valeur saisie par l\'utilisateur', requiresShortcode: false, allowsUserInput: true }
];

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

/**
 * Récupère la source d'une variable de taxonomie donnée.
 * @param fieldName - Le nom de la variable de taxonomie.
 * @returns La source du champ (campaign, tactique, placement, manual) ou null si non trouvée.
 */
export function getFieldSource(fieldName: string): FieldSource | null {
  return TAXONOMY_VARIABLE_CONFIG[fieldName]?.source || null;
}

/**
 * Vérifie si une variable de taxonomie est reconnue dans la configuration.
 * @param variableName - Le nom de la variable à vérifier.
 * @returns Vrai si la variable est connue, faux sinon.
 */
export function isKnownVariable(variableName: string): boolean {
  return variableName in TAXONOMY_VARIABLE_CONFIG;
}

/**
 * Vérifie si un format spécifique est autorisé pour une variable donnée.
 * @param variableName - Le nom de la variable.
 * @param format - Le format à vérifier.
 * @returns Vrai si le format est autorisé, faux sinon.
 */
export function isFormatAllowed(variableName: string, format: TaxonomyFormat): boolean {
  const config = TAXONOMY_VARIABLE_CONFIG[variableName];
  return config ? config.allowedFormats.includes(format) : false;
}

/**
 * Récupère l'objet de configuration complet pour une variable donnée.
 * @param variableName - Le nom de la variable.
 * @returns L'objet VariableConfig ou null si la variable n'est pas trouvée.
 */
export function getVariableConfig(variableName: string): VariableConfig | null {
  return TAXONOMY_VARIABLE_CONFIG[variableName] || null;
}

/**
 * Récupère la liste des variables disponibles.
 * @returns Un tableau de noms de variables configurées.
 */
export function getAvailableVariables(): string[] {
  return Object.keys(TAXONOMY_VARIABLE_CONFIG);
}

/**
 * Récupère les formats autorisés pour une variable donnée.
 * @param variableName - Le nom de la variable.
 * @returns Un tableau des formats autorisés ou tous les formats si la variable n'est pas trouvée.
 */
export function getAllowedFormats(variableName: string): TaxonomyFormat[] {
  const config = TAXONOMY_VARIABLE_CONFIG[variableName];
  return config ? config.allowedFormats : Object.keys(FORMAT_COLORS) as TaxonomyFormat[];
}

/**
 * Récupère les options de format autorisées pour une variable donnée.
 * @param variableName - Le nom de la variable.
 * @returns Un tableau d'objets FormatOption autorisés pour cette variable.
 */
export function getAllowedFormatOptions(variableName: string): FormatOption[] {
  const allowedFormats = getAllowedFormats(variableName);
  return TAXONOMY_FORMATS.filter(format => allowedFormats.includes(format.id));
}

/**
 * Valide si un ID de format est un format de taxonomie valide.
 * @param formatId - L'ID du format à valider.
 * @returns Vrai si l'ID de format est valide, faux sinon.
 */
export function isValidFormat(formatId: string): boolean {
  return TAXONOMY_FORMATS.some(format => format.id === formatId);
}

/**
 * Récupère les informations détaillées d'un format de taxonomie.
 * @param formatId - L'ID du format.
 * @returns L'objet FormatOption correspondant ou null si non trouvé.
 */
export function getFormatInfo(formatId: TaxonomyFormat): FormatOption | null {
  return TAXONOMY_FORMATS.find(format => format.id === formatId) || null;
}

/**
 * Récupère les couleurs associées à une source de champ.
 * @param source - La source du champ (campaign, tactique, placement, manual, ou null).
 * @returns Un objet contenant les classes CSS pour le fond, le texte, la bordure et la couleur hexadécimale.
 */
export function getSourceColor(source: FieldSource | null) {
  if (!source) return SOURCE_COLORS.empty;
  return SOURCE_COLORS[source];
}

/**
 * Récupère les couleurs associées à un format de taxonomie.
 * @param format - Le format de taxonomie.
 * @returns Un objet contenant les classes CSS pour le fond, le texte et la bordure.
 */
export function getFormatColor(format: TaxonomyFormat) {
  return FORMAT_COLORS[format] || FORMAT_COLORS.display_fr;
}

/**
 * Génère un ID unique pour un champ de taxonomie basé sur la variable et le niveau.
 * @param variable - Le nom de la variable de taxonomie.
 * @param level - Le niveau de la taxonomie.
 * @returns Une chaîne de caractères représentant l'ID du champ.
 */
export function generateFieldId(variable: string, level: number): string {
  return `taxonomy_field_${variable}_level_${level}`;
}

/**
 * Vérifie si un format de taxonomie nécessite la sélection d'un shortcode.
 * @param format - Le format de taxonomie à vérifier.
 * @returns Vrai si le format nécessite un shortcode, faux sinon.
 */
export function formatRequiresShortcode(format: TaxonomyFormat): boolean {
  const formatInfo = getFormatInfo(format);
  return formatInfo?.requiresShortcode ?? true;
}

/**
 * Vérifie si un format de taxonomie permet la saisie directe par l'utilisateur.
 * @param format - Le format de taxonomie à vérifier.
 * @returns Vrai si le format permet la saisie utilisateur, faux sinon.
 */
export function formatAllowsUserInput(format: TaxonomyFormat): boolean {
  const formatInfo = getFormatInfo(format);
  return formatInfo?.allowsUserInput ?? false;
}

/**
 * Filtre les formats de taxonomie compatibles avec une source de champ donnée.
 * @param source - La source du champ pour laquelle trouver les formats compatibles.
 * @returns Un tableau d'objets FormatOption compatibles.
 */
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

/**
 * Extrait tous les noms de variables qui ont la source 'manual'.
 * @returns Un tableau de chaînes de caractères représentant les noms des variables manuelles.
 */
export function getManualVariableNames(): string[] {
  return Object.entries(TAXONOMY_VARIABLE_CONFIG)
    .filter(([_, config]) => config.source === 'manual')
    .map(([variableName, _]) => variableName);
}

/**
 * Extrait tous les noms de variables qui ont la source 'manual' et commencent par 'CR_'.
 * Ces variables sont spécifiquement liées aux créatifs.
 * @returns Un tableau de chaînes de caractères représentant les noms des variables créatives manuelles.
 */
export function getCreatifVariableNames(): string[] {
  return Object.entries(TAXONOMY_VARIABLE_CONFIG)
    .filter(([variableName, config]) => config.source === 'manual' && variableName.startsWith('CR_'))
    .map(([variableName, _]) => variableName);
}

/**
 * Extrait tous les noms de variables qui ont la source 'manual' et commencent par 'TAX_' (pour les placements).
 * Ces variables sont spécifiquement liées aux placements.
 * @returns Un tableau de chaînes de caractères représentant les noms des variables de placement manuelles.
 */
export function getPlacementVariableNames(): string[] {
  return Object.entries(TAXONOMY_VARIABLE_CONFIG)
    .filter(([variableName, config]) => config.source === 'manual' && variableName.startsWith('TAX_'))
    .map(([variableName, _]) => variableName);
}

/**
 * Crée un objet vide où toutes les variables manuelles sont initialisées avec une chaîne vide.
 * Utile pour initialiser des formulaires ou des états.
 * @returns Un objet avec les noms des variables manuelles comme clés et des chaînes vides comme valeurs.
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
 * Crée un objet vide où toutes les variables créatives (commençant par CR_) sont initialisées avec une chaîne vide.
 * Utile pour initialiser des formulaires ou des états spécifiques aux créatifs.
 * @returns Un objet avec les noms des variables créatives comme clés et des chaînes vides comme valeurs.
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
 * Extrait les valeurs des champs manuels à partir d'un objet de données générique.
 * @param data - L'objet de données source.
 * @returns Un objet contenant uniquement les champs manuels extraits avec leurs valeurs.
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
 * Extrait les valeurs des champs créatifs (commençant par CR_) à partir d'un objet de données générique.
 * @param data - L'objet de données source.
 * @returns Un objet contenant uniquement les champs créatifs extraits avec leurs valeurs.
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
 * Valide si un nom de variable donné correspond à un champ manuel.
 * @param variableName - Le nom de la variable à valider.
 * @returns Vrai si la variable est un champ manuel, faux sinon.
 */
export function isManualVariable(variableName: string): boolean {
  const config = TAXONOMY_VARIABLE_CONFIG[variableName];
  return config ? config.source === 'manual' : false;
}

/**
 * Valide si un nom de variable donné correspond à un champ créatif (manuel et commençant par 'CR_').
 * @param variableName - Le nom de la variable à valider.
 * @returns Vrai si la variable est un champ créatif, faux sinon.
 */
export function isCreatifVariable(variableName: string): boolean {
  const config = TAXONOMY_VARIABLE_CONFIG[variableName];
  return config ? config.source === 'manual' && variableName.startsWith('CR_') : false;
}

/**
 * Valide si un nom de variable donné correspond à un champ de placement (soit source 'placement', soit manuel et commençant par 'TAX_').
 * @param variableName - Le nom de la variable à valider.
 * @returns Vrai si la variable est un champ de placement, faux sinon.
 */
export function isPlacementVariable(variableName: string): boolean {
  const config = TAXONOMY_VARIABLE_CONFIG[variableName];
  return config ? config.source === 'placement' || (config.source === 'manual' && variableName.startsWith('TAX_')) : false;
}