// app/lib/taxonomyParser.ts

// 🔥 MODIFIÉ : Imports mis à jour pour utiliser la nouvelle configuration
import {
  TAXONOMY_VARIABLE_REGEX,
  ERROR_MESSAGES,
  getFieldSource,
  isKnownVariable,
  isFormatAllowed,
  getVariableConfig,
  getFormatInfo,
  formatRequiresShortcode,
  formatAllowsUserInput,
  getCompatibleFormats,
  type TaxonomyFormat,
  type FieldSource
} from '../config/taxonomyFields';

// 🔥 MODIFIÉ : Import des types depuis le fichier centralisé
import type {
  ParsedTaxonomyVariable,
  ParsedTaxonomyStructure,
  TaxonomyValues,
  GeneratedTaxonomies,
  TaxonomyContext,
  TaxonomyProcessingResult,
  TaxonomyFieldConfig,
  TaxonomyVariableValue
} from '../types/tactiques';


// ==================== TYPES ADAPTÉS (INCHANGÉ) ====================
// Ces types étaient déjà présents et restent pertinents
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
 * 🔥 MODIFIÉ : Parse une structure de taxonomie et extrait toutes les variables.
 * Utilise maintenant getFieldSource et la validation centralisée.
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

  TAXONOMY_VARIABLE_REGEX.lastIndex = 0;
  
  let match;
  const foundVariables = new Set<string>();

  while ((match = TAXONOMY_VARIABLE_REGEX.exec(structure)) !== null) {
    const [fullMatch, variableName, format] = match;
    
    const variableKey = `${variableName}:${format}`;
    if (foundVariables.has(variableKey)) {
      continue;
    }
    foundVariables.add(variableKey);

    const source = getFieldSource(variableName);
    
    const validation = validateVariable(variableName, format as TaxonomyFormat);
    
    // Agréger les formats pour une même variable
    const existingVarIndex = result.variables.findIndex(v => v.variable === variableName);
    if (existingVarIndex > -1) {
      if (!result.variables[existingVarIndex].formats.includes(format as TaxonomyFormat)) {
        result.variables[existingVarIndex].formats.push(format as TaxonomyFormat);
      }
    } else {
      result.variables.push({
        variable: variableName,
        formats: [format as TaxonomyFormat],
        source: source || 'manual',
        level,
        isValid: validation.isValid,
        errorMessage: validation.errorMessage,
      });
    }
    
    if (!validation.isValid) {
      result.isValid = false;
      if(validation.errorMessage) result.errors.push(`${variableName}: ${validation.errorMessage}`);
    }
  }

  console.log(`✅ Parsing terminé: ${result.variables.length} variables uniques trouvées, valide: ${result.isValid}`);
  
  return result;
}


/**
 * ✅ INCHANGÉ : Parse toutes les taxonomies sélectionnées d'un placement
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
 * 🔥 MODIFIÉ : Valide une variable et son format en utilisant la configuration centrale.
 */
function validateVariable(
  variableName: string, 
  format: TaxonomyFormat
): { isValid: boolean; errorMessage?: string } {
  
  if (!isKnownVariable(variableName)) {
    return {
      isValid: false,
      errorMessage: `${ERROR_MESSAGES.UNKNOWN_VARIABLE}: ${variableName}`
    };
  }
  
  if (!isFormatAllowed(variableName, format)) {
    const config = getVariableConfig(variableName);
    const allowed = config?.allowedFormats.join(', ') || 'aucun';
    return {
      isValid: false,
      errorMessage: `Format ${format} non compatible. Formats permis: ${allowed}`
    };
  }
  
  return { isValid: true };
}

/**
 * ✅ INCHANGÉ : Extrait toutes les variables uniques utilisées dans toutes les taxonomies
 */
export function extractUniqueVariables(
  parsedStructures: { [key: string]: ParsedTaxonomyStructure }
): ParsedTaxonomyVariable[] {
  const uniqueVariables = new Map<string, ParsedTaxonomyVariable>();
  
  Object.values(parsedStructures).forEach(structure => {
    structure.variables.forEach(variable => {
      const key = variable.variable; // La clé est UNIQUEMENT le nom de la variable
      
      // Si la variable existe déjà dans notre map
      if (uniqueVariables.has(key)) {
        const existing = uniqueVariables.get(key)!;
        // On ajoute le nouveau format à la liste s'il n'y est pas déjà
        variable.formats.forEach(format => {
          if (!existing.formats.includes(format)) {
            existing.formats.push(format);
          }
        });
      } else {
        // Sinon, on ajoute la nouvelle variable à la map
        uniqueVariables.set(key, { ...variable });
      }
    });
  });
  
  return Array.from(uniqueVariables.values());
}
// ==================== FONCTIONS DE RÉSOLUTION DES VALEURS ====================

/**
 * ✅ INCHANGÉ : Résout les valeurs avec support des nouveaux formats
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
 * ✅ INCHANGÉ : Résout la valeur d'une variable selon sa source et son format
 */
function resolveVariableValue(
  variable: ParsedTaxonomyVariable,
  context: TaxonomyContext,
  taxonomyValues?: TaxonomyValues
): VariableResolutionResult {
  const { variable: varName, source, formats } = variable;
  
  const result: VariableResolutionResult = {
    value: '',
    source,
    format: formats[0],
    isResolved: false,
    needsUserInput: false
  };
  
  try {
    if (taxonomyValues && taxonomyValues[varName]) {
      const taxonomyValue = taxonomyValues[varName];
      
      if (taxonomyValue.format === 'open' && taxonomyValue.openValue) {
        result.value = taxonomyValue.openValue;
        result.openValue = taxonomyValue.openValue;
        result.isResolved = true;
        return result;
      } else if (taxonomyValue.shortcodeId && formatRequiresShortcode(taxonomyValue.format)) {
        result.shortcodeId = taxonomyValue.shortcodeId;
        result.value = taxonomyValue.value || `[SHORTCODE:${taxonomyValue.shortcodeId}:${taxonomyValue.format}]`;
        result.isResolved = !!taxonomyValue.value;
        return result;
      }
    }
    
    switch (source) {
      case 'campaign':
        result.value = resolveCampaignValue(varName, formats[0], context.campaign);
        result.isResolved = !!result.value;
        break;
        
      case 'tactique':
        result.value = resolveTactiqueValue(varName, formats[0], context.tactique);
        result.isResolved = !!result.value;
        break;
        
      case 'manual':
        if (formatAllowsUserInput(formats[0])) {
          result.needsUserInput = true;
          result.value = `[SAISIE:${varName}:${formats[0]}]`;
        } else if (formatRequiresShortcode(formats[0])) {
          result.needsUserInput = true;
          result.value = `[SHORTCODE:${varName}:${formats[0]}]`;
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
 * ✅ INCHANGÉ : Résout une valeur depuis les données de campagne
 */
function resolveCampaignValue(
  variableName: string, 
  format: TaxonomyFormat, 
  campaignData?: any
): string {
  if (!campaignData) return '';
  const fieldMapping: { [key: string]: string } = {
    'CA_Campaign_Identifier': 'name', 'CA_Division': 'division', 'CA_Quarter': 'quarter', 'CA_Year': 'year', 'CA_Budget': 'budget', 'CA_Currency': 'currency', 'CA_Start_Date': 'startDate', 'CA_End_Date': 'endDate', 'CA_Billing_ID': 'billingId', 'CA_PO': 'po', 'CA_Custom_Dim_1': 'customDim1', 'CA_Custom_Dim_2': 'customDim2', 'CA_Custom_Dim_3': 'customDim3'
  };
  const fieldName = fieldMapping[variableName] || variableName;
  const rawValue = campaignData[fieldName];
  if (rawValue === undefined || rawValue === null) return '';
  return formatCampaignValue(String(rawValue), format);
}

/**
 * ✅ INCHANGÉ : Résout une valeur depuis les données de tactique
 */
function resolveTactiqueValue(
  variableName: string, 
  format: TaxonomyFormat, 
  tactiqueData?: any
): string {
  if (!tactiqueData) return '';
  const rawValue = tactiqueData[variableName];
  if (rawValue === undefined || rawValue === null) return '';
  if (formatRequiresShortcode(format)) return `[SHORTCODE:${rawValue}:${format}]`;
  return String(rawValue);
}

/**
 * ✅ INCHANGÉ : Formate une valeur de campagne selon le format demandé
 */
function formatCampaignValue(value: string, format: TaxonomyFormat): string {
  switch (format) {
    case 'code': return value.toUpperCase().replace(/\s+/g, '_').substring(0, 10);
    case 'display_fr': case 'display_en': case 'open': return value;
    default: return value;
  }
}

// ==================== FONCTIONS DE GÉNÉRATION ====================

/**
 * ✅ INCHANGÉ : Génère les chaînes taxonomiques finales
 */
export function generateTaxonomyTemplate(
  structure: ParsedTaxonomyStructure
): string {
  return structure.variables.map(variable => 
    `[${variable.variable}:${variable.formats[0]}]`
  ).join('|');
}

// ==================== FONCTION PRINCIPALE ====================

/**
 * ✅ INCHANGÉ : Fonction principale pour traiter toutes les taxonomies d'un placement
 */
export function processTaxonomies(
  taxonomyTags?: string,
  taxonomyPlatform?: string,
  taxonomyMediaOcean?: string,
  context?: TaxonomyContext,
  taxonomyValues?: TaxonomyValues
): TaxonomyProcessingResult {
  const result: TaxonomyProcessingResult = {
    variables: [], values: {}, generated: {}, errors: [], warnings: []
  };
  
  try {
    const structures = parseAllTaxonomies(taxonomyTags, taxonomyPlatform, taxonomyMediaOcean);
    const uniqueVariables = extractUniqueVariables(structures);
    result.variables = uniqueVariables;
    
    if (context) {
      result.values = resolveVariableValues(uniqueVariables, context, taxonomyValues);
    }
    
    Object.entries(structures).forEach(([type, structure]) => {
      if (structure.isValid) {
        (result.generated as any)[type] = generateTaxonomyTemplate(structure);
      }
    });
    
    Object.values(structures).forEach(structure => {
      result.errors.push(...structure.errors);
    });
    
  } catch (error) {
    result.errors.push(ERROR_MESSAGES.PARSING_ERROR);
  }
  
  return result;
}