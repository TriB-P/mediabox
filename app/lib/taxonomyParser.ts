// app/lib/taxonomyParser.ts

import {
  TAXONOMY_FIELD_SOURCES,
  TAXONOMY_FORMATS,
  TAXONOMY_VARIABLE_REGEX,
  MAX_TAXONOMY_LEVELS,
  ERROR_MESSAGES,
  getFieldSource,
  isValidFormat,
  getFormatInfo,
  isKnownVariable,
  formatRequiresShortcode,
  formatAllowsUserInput,
  getCompatibleFormats,
  type TaxonomyFormat,
  type FieldSource
} from '../config/taxonomyFields';

import type {
  ParsedTaxonomyVariable,
  ParsedTaxonomyStructure,
  TaxonomyValues,
  GeneratedTaxonomies,
  TaxonomyContext,
  TaxonomyProcessingResult,
  TaxonomyFieldConfig,
  TaxonomyVariableSource,
  TaxonomyVariableFormat
} from '../types/tactiques';

// ==================== TYPES ADAPTÉS ====================

/**
 * 🔥 NOUVEAU : Variable parsée avec les nouveaux formats
 */
export interface ExtendedParsedTaxonomyVariable {
  variable: string;
  format: TaxonomyFormat;
  source: FieldSource;
  level: number;
  isValid: boolean;
  errorMessage?: string;
  requiresShortcode: boolean;
  allowsUserInput: boolean;
}

/**
 * 🔥 NOUVEAU : Résultat de résolution avec plus de contexte
 */
export interface VariableResolutionResult {
  value: string;
  source: FieldSource;
  format: TaxonomyFormat;
  shortcodeId?: string;
  openValue?: string;
  isResolved: boolean;
  needsUserInput: boolean;
}

// ==================== FONCTIONS DE PARSING ====================

/**
 * Parse une structure de taxonomie et extrait toutes les variables
 * 
 * @param structure - Structure de taxonomie (ex: "[TC_Publisher:display_fr]|[TC_Objective:code]")
 * @param level - Niveau de la taxonomie (1-4)
 * @returns Résultat du parsing avec variables identifiées
 */
export function parseTaxonomyStructure(
  structure: string, 
  level: number = 1
): ParsedTaxonomyStructure {
  console.log(`🔍 Parsing structure niveau ${level}:`, structure);
  
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
    
    console.log(`📋 Variable trouvée: ${variableName}, format: ${format}`);
    
    // Éviter les doublons dans le même niveau
    const variableKey = `${variableName}:${format}`;
    if (foundVariables.has(variableKey)) {
      continue;
    }
    foundVariables.add(variableKey);

    // Déterminer la source
    const source = getFieldSource(variableName);
    
    // Valider la variable et le format
    const validation = validateVariable(variableName, format as TaxonomyFormat);
    
    // 🔥 NOUVEAU : Informations sur les exigences du format
    const formatInfo = getFormatInfo(format as TaxonomyFormat);
    
    const parsedVariable: ExtendedParsedTaxonomyVariable = {
      variable: variableName,
      format: format as TaxonomyFormat,
      source: source || 'manual', // Fallback sur manual si source inconnue
      level,
      isValid: validation.isValid,
      errorMessage: validation.errorMessage,
      requiresShortcode: formatInfo?.requiresShortcode ?? true,
      allowsUserInput: formatInfo?.allowsUserInput ?? false
    };

    result.variables.push(parsedVariable as ParsedTaxonomyVariable);
    
    // Ajouter les erreurs au résultat global
    if (!validation.isValid) {
      result.isValid = false;
      result.errors.push(`${variableName}: ${validation.errorMessage}`);
    }
  }

  console.log(`✅ Parsing terminé: ${result.variables.length} variables trouvées, valide: ${result.isValid}`);
  
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
  console.log('🔍 Parsing de toutes les taxonomies');
  
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

  console.log(`✅ Parsing complet: ${Object.keys(results).length} taxonomies analysées`);
  
  return results;
}

// ==================== FONCTIONS DE VALIDATION ====================

/**
 * 🔥 NOUVEAU : Valide une variable et son format avec les nouveaux types
 */
function validateVariable(
  variableName: string, 
  format: TaxonomyFormat
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

  // 🔥 NOUVEAU : Vérifier la compatibilité format/source
  const source = getFieldSource(variableName);
  if (source) {
    const compatibleFormats = getCompatibleFormats(source);
    const isCompatible = compatibleFormats.some(f => f.id === format);
    
    if (!isCompatible) {
      return {
        isValid: false,
        errorMessage: `Format ${format} non compatible avec la source ${source}`
      };
    }
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
      const key = `${variable.variable}:${variable.format}`;
      if (!uniqueVariables.has(key)) {
        uniqueVariables.set(key, variable);
      }
    });
  });
  
  return Array.from(uniqueVariables.values());
}

// ==================== FONCTIONS DE RÉSOLUTION DES VALEURS ====================

/**
 * 🔥 NOUVEAU : Résout les valeurs avec support des nouveaux formats
 */
export function resolveVariableValues(
  variables: ParsedTaxonomyVariable[],
  context: TaxonomyContext,
  taxonomyValues?: TaxonomyValues
): { [variableName: string]: VariableResolutionResult } {
  console.log(`🔄 Résolution des valeurs pour ${variables.length} variables`);
  
  const results: { [variableName: string]: VariableResolutionResult } = {};
  
  variables.forEach(variable => {
    const result = resolveVariableValue(variable, context, taxonomyValues);
    results[variable.variable] = result;
  });
  
  console.log(`✅ Valeurs résolues:`, Object.keys(results));
  
  return results;
}

/**
 * 🔥 NOUVEAU : Résout la valeur d'une variable selon sa source et son format
 */
function resolveVariableValue(
  variable: ParsedTaxonomyVariable,
  context: TaxonomyContext,
  taxonomyValues?: TaxonomyValues
): VariableResolutionResult {
  const { variable: varName, source, format } = variable;
  
  const result: VariableResolutionResult = {
    value: '',
    source,
    format: format as TaxonomyFormat,
    isResolved: false,
    needsUserInput: false
  };
  
  try {
    // 1. Vérifier d'abord si on a une valeur manuelle/sélectionnée
    if (taxonomyValues && taxonomyValues[varName]) {
      const taxonomyValue = taxonomyValues[varName];
      
      if (format === 'open' && taxonomyValue.openValue) {
        // Format open : utiliser directement la valeur saisie
        result.value = taxonomyValue.openValue;
        result.openValue = taxonomyValue.openValue;
        result.isResolved = true;
        return result;
      } else if (taxonomyValue.shortcodeId && formatRequiresShortcode(format as TaxonomyFormat)) {
        // Format nécessitant un shortcode : stocker l'ID pour formatting ultérieur
        result.shortcodeId = taxonomyValue.shortcodeId;
        result.value = taxonomyValue.value || `[SHORTCODE:${taxonomyValue.shortcodeId}:${format}]`;
        result.isResolved = !!taxonomyValue.value;
        return result;
      }
    }
    
    // 2. Résolution selon la source pour les champs hérités
    switch (source) {
      case 'campaign':
        result.value = resolveCampaignValue(varName, format as TaxonomyFormat, context.campaign);
        result.isResolved = !!result.value;
        break;
        
      case 'tactique':
        result.value = resolveTactiqueValue(varName, format as TaxonomyFormat, context.tactique);
        result.isResolved = !!result.value;
        break;
        
      case 'manual':
        // Champ manuel : nécessite une saisie utilisateur
        if (formatAllowsUserInput(format as TaxonomyFormat)) {
          result.needsUserInput = true;
          result.value = `[SAISIE:${varName}:${format}]`;
        } else if (formatRequiresShortcode(format as TaxonomyFormat)) {
          result.needsUserInput = true;
          result.value = `[SHORTCODE:${varName}:${format}]`;
        }
        break;
        
      default:
        console.warn(`Source inconnue pour ${varName}: ${source}`);
    }
    
  } catch (error) {
    console.error(`Erreur lors de la résolution de ${varName}:`, error);
    result.value = `[ERREUR:${varName}]`;
  }
  
  return result;
}

/**
 * 🔥 NOUVEAU : Résout une valeur depuis les données de campagne
 */
function resolveCampaignValue(
  variableName: string, 
  format: TaxonomyFormat, 
  campaignData?: any
): string {
  if (!campaignData) {
    console.log(`❌ Pas de données de campagne pour ${variableName}`);
    return '';
  }
  
  // Mapping des noms de variables vers les champs de campagne
  const fieldMapping: { [key: string]: string } = {
    'CA_Campaign_Identifier': 'name',
    'CA_Division': 'division',
    'CA_Quarter': 'quarter',
    'CA_Year': 'year',
    'CA_Budget': 'budget',
    'CA_Currency': 'currency',
    'CA_Start_Date': 'startDate',
    'CA_End_Date': 'endDate',
    'CA_Billing_ID': 'billingId',
    'CA_PO': 'po',
    'CA_Custom_Dim_1': 'customDim1',
    'CA_Custom_Dim_2': 'customDim2',
    'CA_Custom_Dim_3': 'customDim3'
  };
  
  const fieldName = fieldMapping[variableName] || variableName;
  const rawValue = campaignData[fieldName];
  
  if (rawValue === undefined || rawValue === null) {
    console.log(`❌ Valeur manquante pour ${variableName} (champ: ${fieldName})`);
    return '';
  }
  
  // Pour les champs de campagne, appliquer le format demandé
  return formatCampaignValue(String(rawValue), format);
}

/**
 * 🔥 NOUVEAU : Résout une valeur depuis les données de tactique
 */
function resolveTactiqueValue(
  variableName: string, 
  format: TaxonomyFormat, 
  tactiqueData?: any
): string {
  if (!tactiqueData) {
    console.log(`❌ Pas de données de tactique pour ${variableName}`);
    return '';
  }
  
  const rawValue = tactiqueData[variableName];
  
  if (rawValue === undefined || rawValue === null) {
    console.log(`❌ Valeur manquante pour ${variableName} dans les données de tactique`);
    return '';
  }
  
  // Pour les champs de tactique qui sont des shortcodes, retourner l'ID
  if (formatRequiresShortcode(format)) {
    return `[SHORTCODE:${rawValue}:${format}]`;
  }
  
  // Pour les autres formats, retourner directement la valeur
  return String(rawValue);
}

/**
 * 🔥 NOUVEAU : Formate une valeur de campagne selon le format demandé
 */
function formatCampaignValue(value: string, format: TaxonomyFormat): string {
  switch (format) {
    case 'code':
      // Pour code, utiliser une version raccourcie si approprié
      return value.toUpperCase().replace(/\s+/g, '_').substring(0, 10);
    case 'display_fr':
    case 'display_en':
      // Pour display, utiliser la valeur telle quelle
      return value;
    case 'open':
      // Pour open, utiliser la valeur telle quelle
      return value;
    default:
      return value;
  }
}

// ==================== FONCTIONS DE GÉNÉRATION ====================

/**
 * 🔥 NOUVEAU : Génère les chaînes taxonomiques finales avec le hook de formatage
 * Note: Cette fonction sera appelée depuis les composants avec accès au hook
 */
export function generateTaxonomyTemplate(
  structure: ParsedTaxonomyStructure
): string {
  // Retourner un template qui sera résolu par le composant
  return structure.variables.map(variable => 
    `[${variable.variable}:${variable.format}]`
  ).join('|');
}

// ==================== FONCTION PRINCIPALE ====================

/**
 * 🔥 NOUVEAU : Fonction principale pour traiter toutes les taxonomies d'un placement
 */
export function processTaxonomies(
  taxonomyTags?: string,
  taxonomyPlatform?: string,
  taxonomyMediaOcean?: string,
  context?: TaxonomyContext,
  taxonomyValues?: TaxonomyValues
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
      const resolvedValues = resolveVariableValues(uniqueVariables, context, taxonomyValues);
      
      // Convertir en format TaxonomyValues pour compatibilité
      Object.entries(resolvedValues).forEach(([varName, resolved]) => {
        result.values[varName] = {
          value: resolved.value,
          source: resolved.source,
          format: resolved.format as any,
          shortcodeId: resolved.shortcodeId,
          openValue: resolved.openValue
        };
      });
      
      // 4. Générer les templates (seront résolus par les composants)
      Object.entries(structures).forEach(([type, structure]) => {
        if (structure.isValid) {
          const template = generateTaxonomyTemplate(structure);
          (result.generated as any)[type] = template;
        }
      });
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

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * 🔥 NOUVEAU : Créer la configuration pour l'affichage d'un champ
 */
export function createFieldConfig(
  variable: ExtendedParsedTaxonomyVariable,
  currentValue?: string,
  hasCustomList: boolean = false
): TaxonomyFieldConfig {
  return {
    variable: variable.variable,
    source: variable.source,
    format: variable.format as any,
    isRequired: variable.source !== 'manual', // Les champs manuels sont optionnels
    hasCustomList,
    currentValue,
    placeholder: generatePlaceholder(variable)
  };
}

/**
 * 🔥 NOUVEAU : Génère un placeholder pour un champ selon sa source et son format
 */
function generatePlaceholder(variable: ExtendedParsedTaxonomyVariable): string {
  const formatInfo = getFormatInfo(variable.format);
  const formatLabel = formatInfo?.label || variable.format;
  
  if (variable.allowsUserInput) {
    return `Saisir ${formatLabel.toLowerCase()}...`;
  } else if (variable.requiresShortcode) {
    return `Sélectionner pour ${formatLabel.toLowerCase()}...`;
  }
  
  switch (variable.source) {
    case 'campaign':
      return `Valeur de campagne (${formatLabel})`;
    case 'tactique':
      return `Valeur de tactique (${formatLabel})`;
    case 'manual':
      return `Configurer ${formatLabel.toLowerCase()}...`;
    default:
      return `Valeur ${formatLabel}`;
  }
}