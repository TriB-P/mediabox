// app/lib/taxonomyParser.ts - VERSION CORRIGÉE

import {
  TAXONOMY_VARIABLE_CONFIG,
  TAXONOMY_FORMATS,
  MAX_TAXONOMY_LEVELS,
  ERROR_MESSAGES,
  getFieldSource,
  isValidFormat,
  getFormatInfo,
  isKnownVariable,
  getAllowedFormats,
  getAllowedFormatOptions,
  formatRequiresShortcode,
  formatAllowsUserInput
} from '../config/taxonomyFields';

import type {
  ParsedTaxonomyVariable,
  ParsedTaxonomyStructure,
  GeneratedTaxonomies,
  TaxonomyContext,
  TaxonomyFieldConfig,
  TaxonomyVariableSource,
  TaxonomyVariableFormat,
  HighlightState
} from '../types/tactiques';

import type { FieldSource, TaxonomyFormat } from '../config/taxonomyFields';

// Types manquants - à définir localement
interface TaxonomyValues {
  [variableName: string]: {
    value: string;
    source: FieldSource;
    format: TaxonomyFormat;
  };
}

interface TaxonomyProcessingResult {
  variables: ParsedTaxonomyVariable[];
  values: TaxonomyValues;
  generated: GeneratedTaxonomies;
  errors: string[];
  warnings: string[];
}

// ==================== CONSTANTES ====================

const TAXONOMY_VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;

// ==================== FONCTIONS DE PARSING ====================

/**
 * Parse une structure de taxonomie et extrait toutes les variables
 * 
 * @param structure - Structure de taxonomie (ex: "[TC_Publisher:code]|[TC_Objective:display_fr]")
 * @param level - Niveau de la taxonomie (1-6)
 * @returns Résultat du parsing avec variables identifiées
 */
export function parseTaxonomyStructure(
  structure: string, 
  level: number = 1
): ParsedTaxonomyStructure {
  
  const result: ParsedTaxonomyStructure = {
    variables: [],
    isValid: true,
    errors: []
  };

  if (!structure || typeof structure !== 'string') {
    result.isValid = false;
    result.errors.push('Structure de taxonomie vide ou invalide');
    return result;
  }

  // Réinitialiser le regex pour être sûr
  TAXONOMY_VARIABLE_REGEX.lastIndex = 0;
  
  let match;
  const foundVariables = new Set<string>(); // Pour éviter les doublons

  while ((match = TAXONOMY_VARIABLE_REGEX.exec(structure)) !== null) {
    const [fullMatch, variableName, format] = match;
    
    // Éviter les doublons dans le même niveau
    const variableKey = `${variableName}:${format}`;
    if (foundVariables.has(variableKey)) {
      continue;
    }
    foundVariables.add(variableKey);

    // Déterminer la source
    const source = getFieldSource(variableName);
    
    // Valider la variable et le format
    const validation = validateVariable(variableName, format);
    
    // Récupérer tous les formats autorisés pour cette variable
    const allowedFormats = getAllowedFormats(variableName);
    
    const parsedVariable: ParsedTaxonomyVariable = {
      variable: variableName,
      formats: allowedFormats, // 🔥 CORRIGÉ : formats au pluriel
      source: source || 'placement', // Fallback sur placement si source inconnue
      level,
      isValid: validation.isValid,
      errorMessage: validation.errorMessage
    };

    result.variables.push(parsedVariable);
    
    // Ajouter les erreurs au résultat global
    if (!validation.isValid) {
      result.isValid = false;
      result.errors.push(`${variableName}: ${validation.errorMessage}`);
    }
  }

  return result;
}

/**
 * Parse toutes les taxonomies sélectionnées d'un placement
 */
export function parseAllTaxonomies(
  taxonomyTags?: string,
  taxonomyPlatform?: string, 
  taxonomyMediaOcean?: string
): { [key: string]: ParsedTaxonomyStructure } {
  
  const results: { [key: string]: ParsedTaxonomyStructure } = {};
  
  if (taxonomyTags) {
    results.tags = parseTaxonomyStructure(taxonomyTags, 1);
  }
  
  if (taxonomyPlatform) {
    results.platform = parseTaxonomyStructure(taxonomyPlatform, 2);
  }
  
  if (taxonomyMediaOcean) {
    results.mediaocean = parseTaxonomyStructure(taxonomyMediaOcean, 3);
  }

  return results;
}

// ==================== FONCTIONS DE VALIDATION ====================

/**
 * Valide une variable et son format
 */
function validateVariable(
  variableName: string, 
  format: string
): { isValid: boolean; errorMessage?: string } {
  
  // Vérifier que la variable est connue
  if (!isKnownVariable(variableName)) {
    return {
      isValid: false,
      errorMessage: `${ERROR_MESSAGES.UNKNOWN_VARIABLE}: ${variableName}`
    };
  }
  
  // Vérifier que le format est valide
  if (!isValidFormat(format)) {
    return {
      isValid: false,
      errorMessage: `${ERROR_MESSAGES.INVALID_FORMAT}: ${format}`
    };
  }
  
  return { isValid: true };
}

/**
 * Extrait toutes les variables uniques utilisées dans toutes les taxonomies
 */
export function extractUniqueVariables(
  parsedStructures: { [key: string]: ParsedTaxonomyStructure }
): ParsedTaxonomyVariable[] {
  const uniqueVariables = new Map<string, ParsedTaxonomyVariable>();
  
  Object.values(parsedStructures).forEach(structure => {
    structure.variables.forEach(variable => {
      const key = variable.variable;
      if (!uniqueVariables.has(key)) {
        uniqueVariables.set(key, variable);
      }
    });
  });
  
  return Array.from(uniqueVariables.values());
}

// ==================== FONCTIONS DE RÉSOLUTION DES VALEURS ====================

/**
 * Résout les valeurs pour toutes les variables identifiées
 */
export function resolveVariableValues(
  variables: ParsedTaxonomyVariable[],
  context: TaxonomyContext
): TaxonomyValues {
  console.log(`🔄 Résolution des valeurs pour ${variables.length} variables`);
  
  const values: TaxonomyValues = {};
  
  variables.forEach(variable => {
    const resolvedValue = resolveVariableValue(variable, context);
    values[variable.variable] = {
      value: resolvedValue,
      source: variable.source,
      format: variable.formats[0] || 'display_fr' // Utiliser le premier format disponible
    };
  });
  
  console.log(`✅ Valeurs résolues:`, Object.keys(values));
  
  return values;
}

/**
 * Résout la valeur d'une variable selon sa source
 */
function resolveVariableValue(
  variable: ParsedTaxonomyVariable,
  context: TaxonomyContext
): string {
  const { variable: varName, source } = variable;
  
  try {
    switch (source) {
      case 'campaign':
        return resolveCampaignValue(varName, context.campaign);
        
      case 'tactique':
        return resolveTactiqueValue(varName, context.tactique);
        
      case 'placement':
        return resolvePlacementValue(varName, context.placement);
        
      case 'créatif':
        return resolveCreatifValue(varName, context.placement);
        
      default:
        console.warn(`Source inconnue pour ${varName}: ${source}`);
        return '';
    }
  } catch (error) {
    console.error(`Erreur lors de la résolution de ${varName}:`, error);
    return '';
  }
}

/**
 * Résout une valeur depuis les données de campagne
 */
function resolveCampaignValue(variableName: string, campaignData?: any): string {
  if (!campaignData) {
    console.log(`❌ Pas de données de campagne pour ${variableName}`);
    return '';
  }
  
  const rawValue = campaignData[variableName];
  
  if (rawValue === undefined || rawValue === null) {
    console.log(`❌ Valeur manquante pour ${variableName} dans les données de campagne`);
    return '';
  }
  
  return String(rawValue);
}

/**
 * Résout une valeur depuis les données de tactique
 */
function resolveTactiqueValue(variableName: string, tactiqueData?: any): string {
  if (!tactiqueData) {
    console.log(`❌ Pas de données de tactique pour ${variableName}`);
    return '';
  }
  
  const rawValue = tactiqueData[variableName];
  
  if (rawValue === undefined || rawValue === null) {
    console.log(`❌ Valeur manquante pour ${variableName} dans les données de tactique`);
    return '';
  }
  
  return String(rawValue);
}

/**
 * Résout une valeur depuis les données de placement
 */
function resolvePlacementValue(variableName: string, placementData?: any): string {
  if (!placementData) {
    console.log(`❌ Pas de données de placement pour ${variableName}`);
    return '';
  }
  
  const rawValue = placementData[variableName];
  
  if (rawValue === undefined || rawValue === null) {
    console.log(`❌ Valeur manquante pour ${variableName} dans les données de placement`);
    return '';
  }
  
  return String(rawValue);
}

/**
 * Résout une valeur depuis les données de créatif
 */
function resolveCreatifValue(variableName: string, placementData?: any): string {
  // Pour les créatifs, on peut avoir besoin d'accéder aux valeurs stockées
  // dans le placement ou dans des données spécifiques au créatif
  if (!placementData) {
    console.log(`❌ Pas de données de placement/créatif pour ${variableName}`);
    return '';
  }
  
  // Chercher d'abord dans les valeurs taxonomie du placement
  if (placementData.PL_Taxonomy_Values && placementData.PL_Taxonomy_Values[variableName]) {
    const taxonomyValue = placementData.PL_Taxonomy_Values[variableName];
    return taxonomyValue.value || '';
  }
  
  return '';
}

// ==================== FONCTIONS DE GÉNÉRATION ====================

/**
 * Génère les chaînes taxonomiques finales
 */
export function generateTaxonomyStrings(
  structures: { [key: string]: ParsedTaxonomyStructure },
  values: TaxonomyValues
): GeneratedTaxonomies {
  console.log('🏗️ Génération des chaînes taxonomiques');
  
  const generated: GeneratedTaxonomies = {};
  
  Object.entries(structures).forEach(([type, structure]) => {
    if (structure.isValid) {
      const generatedString = generateSingleTaxonomyString(structure, values);
      if (generatedString) {
        generated[type as keyof GeneratedTaxonomies] = generatedString;
      }
    }
  });
  
  console.log('✅ Chaînes générées:', generated);
  
  return generated;
}

/**
 * Génère une chaîne taxonomique pour une structure donnée
 */
function generateSingleTaxonomyString(
  structure: ParsedTaxonomyStructure,
  values: TaxonomyValues
): string {
  const segments = structure.variables.map(variable => {
    const value = values[variable.variable];
    if (value && value.value) {
      return value.value;
    }
    return `[${variable.variable}:${variable.formats[0] || 'display_fr'}]`; // Placeholder si pas de valeur
  });
  
  return segments.filter(Boolean).join('|');
}

// ==================== FONCTION PRINCIPALE ====================

/**
 * Fonction principale pour traiter toutes les taxonomies d'un placement
 */
export function processTaxonomies(
  taxonomyTags?: string,
  taxonomyPlatform?: string,
  taxonomyMediaOcean?: string,
  context?: TaxonomyContext
): TaxonomyProcessingResult {
  console.log('🚀 Début du traitement des taxonomies');
  
  const result: TaxonomyProcessingResult = {
    variables: [],
    values: {},
    generated: {},
    errors: [],
    warnings: []
  };
  
  try {
    // 1. Parser toutes les structures
    const structures = parseAllTaxonomies(taxonomyTags, taxonomyPlatform, taxonomyMediaOcean);
    
    // 2. Extraire les variables uniques
    const uniqueVariables = extractUniqueVariables(structures);
    result.variables = uniqueVariables;
    
    // 3. Résoudre les valeurs si contexte fourni
    if (context) {
      result.values = resolveVariableValues(uniqueVariables, context);
      
      // 4. Générer les chaînes taxonomiques
      result.generated = generateTaxonomyStrings(structures, result.values);
    }
    
    // 5. Collecter les erreurs
    Object.values(structures).forEach(structure => {
      result.errors.push(...structure.errors);
    });
    
    console.log(`✅ Traitement terminé: ${result.variables.length} variables, ${result.errors.length} erreurs`);
    
  } catch (error) {
    console.error('💥 Erreur lors du traitement des taxonomies:', error);
    result.errors.push(ERROR_MESSAGES.PARSING_ERROR);
  }
  
  return result;
}

// ==================== FONCTION POUR GÉNÉRATION DIRECTE ====================

/**
 * Génère une chaîne taxonomique finale à partir d'une structure et d'un résolveur de valeurs
 * Utilisée par le TaxonomyContextMenu pour générer les chaînes à copier
 * 
 * @param structure - Structure de taxonomie (ex: "[TC_Publisher:code]|[TC_Objective:display_fr]")
 * @param valueResolver - Fonction qui résout les valeurs pour chaque variable
 * @returns Chaîne taxonomique avec les valeurs substituées
 */
export function generateFinalTaxonomyString(
  structure: string,
  valueResolver: (variableName: string, format: TaxonomyFormat) => string
): string {
  if (!structure || typeof structure !== 'string') {
    return '';
  }

  // Réinitialiser le regex
  TAXONOMY_VARIABLE_REGEX.lastIndex = 0;
  
  let result = structure;
  let match;

  while ((match = TAXONOMY_VARIABLE_REGEX.exec(structure)) !== null) {
    const [fullMatch, variableName, format] = match;
    
    // Résoudre la valeur via le resolver fourni
    const resolvedValue = valueResolver(variableName, format as TaxonomyFormat);
    
    // Remplacer le placeholder par la valeur résolue
    result = result.replace(fullMatch, resolvedValue);
  }

  return result;
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Créer la configuration pour l'affichage d'un champ
 */
export function createFieldConfig(
  variable: ParsedTaxonomyVariable,
  currentValue?: string,
  hasCustomList: boolean = false
): TaxonomyFieldConfig {
  return {
    variable: variable.variable,
    source: variable.source,
    formats: variable.formats, // 🔥 CORRIGÉ : formats au pluriel
    isRequired: true, // Tous les champs sont requis maintenant
    hasCustomList,
    currentValue,
    placeholder: generatePlaceholder(variable),
    requiresShortcode: variable.formats.some(format => formatRequiresShortcode(format)),
    allowsUserInput: variable.formats.some(format => formatAllowsUserInput(format))
  };
}

/**
 * Génère un placeholder pour un champ selon sa source
 */
function generatePlaceholder(variable: ParsedTaxonomyVariable): string {
  const primaryFormat = variable.formats[0] || 'display_fr';
  const formatInfo = getFormatInfo(primaryFormat);
  const formatLabel = formatInfo?.label || primaryFormat;
  
  switch (variable.source) {
    case 'campaign':
      return `Valeur de campagne (${formatLabel})`;
    case 'tactique':
      return `Valeur de tactique (${formatLabel})`;
    case 'placement':
      return `Valeur de placement (${formatLabel})`;
    case 'créatif':
      return `Valeur de créatif (${formatLabel})`;
    default:
      return `Saisir ${formatLabel}...`;
  }
}