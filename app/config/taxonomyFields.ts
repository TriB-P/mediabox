// app/config/taxonomyFields.ts - VERSION CORRIGÉE POUR PLACEMENTS

/**
 * Ce fichier sert de source centrale pour la configuration des variables de taxonomie.
 * Il définit d'où proviennent les variables (campagne, tactique, placement, ou créatif),
 * les formats de sortie autorisés pour chaque variable,
 * et fournit des fonctions utilitaires pour interagir avec cette configuration.
 * CORRIGÉ : Fonctions spécifiques pour les placements ajoutées.
 * AJOUTÉ : CR_Sprint_Dates pour les créatifs (même logique que CA_Sprint_Dates)
 */

export type FieldSource = 'campaign' | 'tactique' | 'placement' | 'créatif';

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

  'TC_AssetDate': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_Billing_ID': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_BuyCurrency': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_Prog_Buying_Method': { source: 'tactique',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'TC_Custom_Dim_1': { source: 'tactique',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code', 'open'] },
  'TC_Custom_Dim_2': { source: 'tactique',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code', 'open'] },
  'TC_Custom_Dim_3': { source: 'tactique', allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code', 'open'] },
  'TC_Location_Open': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_Start_Date': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_End_Date': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_Format_Open': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_Frequence': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_Inventory': { source: 'tactique',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'TC_Kpi': { source: 'tactique',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'TC_Language_Open': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_LOB': { source: 'tactique',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'TC_Market': { source: 'tactique',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'TC_Market_Open': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_Media_Objective': { source: 'tactique',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'TC_Media_Type': { source: 'tactique',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'TC_PO': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_Product_Open': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_Publisher': { source: 'tactique',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'TC_Targeting_Open': { source: 'tactique',  allowedFormats: ['open'] },
  'TC_Unit_Type': { source: 'tactique',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },

  'PL_Audience_Behaviour': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Audience_Demographics': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Audience_Engagement': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Audience_Interest': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Audience_Other': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Creative_Grouping': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Device': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Market_Details': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Product': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Segment_Open': { source: 'placement',  allowedFormats: ['open'] },
  'PL_Tactic_Category': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Targeting': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Custom_Dim_1': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code', 'open'] },
  'PL_Custom_Dim_2': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code', 'open'] },
  'PL_Custom_Dim_3': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code', 'open'] },
  'PL_Channel': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Format': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Language': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'PL_Placement_Location': { source: 'placement',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },

  'CR_Custom_Dim_1': { source: 'créatif',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'CR_Custom_Dim_2': { source: 'créatif',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'CR_Custom_Dim_3': { source: 'créatif',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'CR_CTA': { source: 'créatif',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'CR_Format_Details': { source: 'créatif',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'CR_Offer': { source: 'créatif',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'CR_Plateform_Name': { source: 'créatif',  allowedFormats: ['open'] },
  'CR_Primary_Product': { source: 'créatif',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'CR_URL': { source: 'créatif',  allowedFormats: ['open'] },
  'CR_Version': { source: 'créatif',  allowedFormats: ['code', 'display_fr', 'display_en', 'utm', 'custom_utm', 'custom_code'] },
  'CR_Sprint_Dates': { source: 'créatif',  allowedFormats: ['open'] },
};

export const TAXONOMY_FORMATS: FormatOption[] = [
  { id: 'code', label: 'Code', description: 'Utilise la valeur SH_Code du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'display_fr', label: 'Display FR', description: 'Utilise la valeur SH_Display_Name_EN du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'display_en', label: 'Display EN', description: 'Utilise la valeur SH_Display_Name_FR du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'utm', label: 'UTM', description: 'Utilise la valeur SH_Default_UTM du shortcode', requiresShortcode: true, allowsUserInput: false },
  { id: 'custom_utm', label: 'UTM Personnalisé', description: 'Utilise la valeur personnalisée UTM du client, sinon SH_Default_UTM', requiresShortcode: true, allowsUserInput: false },
  { id: 'custom_code', label: 'Code Personnalisé', description: 'Utilise la valeur personnalisée Code du client, sinon SH_Code', requiresShortcode: true, allowsUserInput: false },
  { id: 'open', label: 'Saisie Libre', description: 'Utilise directement la valeur saisie par l\'utilisateur', requiresShortcode: false, allowsUserInput: true }
];

export const SOURCE_COLORS = {
  campaign: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', hex: '#3B82F6' },
  tactique: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', hex: '#10B981' },
  placement: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', hex: '#8B5CF6' },
  créatif: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', hex: '#F59E0B' },
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
 * @returns La source du champ (campaign, tactique, placement, créatif) ou null si non trouvée.
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
 * @param source - La source du champ (campaign, tactique, placement, créatif, ou null).
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

// ==================== FONCTIONS POUR CRÉATIFS ====================

/**
 * Extrait tous les noms de variables qui ont la source 'créatif'.
 * @returns Un tableau de chaînes de caractères représentant les noms des variables créatives.
 */
export function getCreatifVariableNames(): string[] {
  return getVariableNamesBySource('créatif');
}

/**
 * Crée un objet vide où toutes les variables créatives sont initialisées avec une chaîne vide.
 * Utile pour initialiser des formulaires ou des états spécifiques aux créatifs.
 * @returns Un objet avec les noms des variables créatives comme clés et des chaînes vides comme valeurs.
 */
export function createEmptyCreatifFieldsObject(): { [key: string]: string } {
  return createEmptyFieldsObjectBySource('créatif');
}

/**
 * Extrait les valeurs des champs créatifs à partir d'un objet de données générique.
 * @param data - L'objet de données source.
 * @returns Un objet contenant uniquement les champs créatifs extraits avec leurs valeurs.
 */
export function extractCreatifFieldsFromData(data: any): { [key: string]: string } {
  return extractFieldsBySource(data, 'créatif');
}

/**
 * Valide si un nom de variable donné correspond à un champ créatif (source 'créatif').
 * @param variableName - Le nom de la variable à valider.
 * @returns Vrai si la variable est un champ créatif, faux sinon.
 */
export function isCreatifVariable(variableName: string): boolean {
  const config = TAXONOMY_VARIABLE_CONFIG[variableName];
  return config ? config.source === 'créatif' : false;
}

// ==================== FONCTIONS POUR PLACEMENTS ====================

/**
 * Extrait tous les noms de variables qui ont la source 'placement'.
 * @returns Un tableau de chaînes de caractères représentant les noms des variables de placement.
 */
export function getPlacementVariableNames(): string[] {
  return getVariableNamesBySource('placement');
}

/**
 * Crée un objet vide où toutes les variables de placement sont initialisées avec une chaîne vide.
 * Utile pour initialiser des formulaires ou des états spécifiques aux placements.
 * @returns Un objet avec les noms des variables de placement comme clés et des chaînes vides comme valeurs.
 */
export function createEmptyPlacementFieldsObject(): { [key: string]: string } {
  return createEmptyFieldsObjectBySource('placement');
}

/**
 * Extrait les valeurs des champs de placement à partir d'un objet de données générique.
 * @param data - L'objet de données source.
 * @returns Un objet contenant uniquement les champs de placement extraits avec leurs valeurs.
 */
export function extractPlacementFieldsFromData(data: any): { [key: string]: string } {
  return extractFieldsBySource(data, 'placement');
}

/**
 * Valide si un nom de variable donné correspond à un champ de placement (source 'placement').
 * @param variableName - Le nom de la variable à valider.
 * @returns Vrai si la variable est un champ de placement, faux sinon.
 */
export function isPlacementVariable(variableName: string): boolean {
  const config = TAXONOMY_VARIABLE_CONFIG[variableName];
  return config ? config.source === 'placement' : false;
}

// ==================== FONCTIONS UTILITAIRES POUR FILTRAGE PAR SOURCE ====================

/**
 * Récupère tous les noms de variables pour une source donnée.
 * @param source - La source à filtrer ('campaign', 'tactique', 'placement', 'créatif').
 * @returns Un tableau de chaînes de caractères représentant les noms des variables de cette source.
 */
export function getVariableNamesBySource(source: FieldSource): string[] {
  return Object.entries(TAXONOMY_VARIABLE_CONFIG)
    .filter(([_, config]) => config.source === source)
    .map(([variableName, _]) => variableName);
}

/**
 * Crée un objet vide pour une source donnée où toutes les variables sont initialisées avec une chaîne vide.
 * @param source - La source pour laquelle créer l'objet vide.
 * @returns Un objet avec les noms des variables de cette source comme clés et des chaînes vides comme valeurs.
 */
export function createEmptyFieldsObjectBySource(source: FieldSource): { [key: string]: string } {
  const variables = getVariableNamesBySource(source);
  const emptyObject: { [key: string]: string } = {};

  variables.forEach(varName => {
    emptyObject[varName] = '';
  });

  return emptyObject;
}

/**
 * Extrait les valeurs des champs pour une source donnée à partir d'un objet de données générique.
 * @param data - L'objet de données source.
 * @param source - La source à extraire.
 * @returns Un objet contenant uniquement les champs de cette source extraits avec leurs valeurs.
 */
export function extractFieldsBySource(data: any, source: FieldSource): { [key: string]: string } {
  const variables = getVariableNamesBySource(source);
  const extractedFields: { [key: string]: string } = {};

  variables.forEach(varName => {
    if (data && typeof data[varName] !== 'undefined') {
      extractedFields[varName] = data[varName];
    }
  });

  return extractedFields;
}