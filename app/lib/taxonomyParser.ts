/**
 * Ce fichier est responsable de l'analyse et de la génération des taxonomies.
 * Il gère la substitution des variables dans les chaînes de taxonomie,
 * la validation des formats et des noms de variables, et l'extraction
 * des variables uniques à partir de différentes structures de taxonomie.
 * Il sert de moteur central pour la logique de taxonomie de l'application.
 */
import {
  TAXONOMY_VARIABLE_REGEX,
  ERROR_MESSAGES,
  getFieldSource,
  isKnownVariable,
  getVariableConfig,
  type TaxonomyFormat
} from '../config/taxonomyFields';

import type {
  ParsedTaxonomyVariable,
  ParsedTaxonomyStructure,
  TaxonomyValues,
  GeneratedTaxonomies,
  TaxonomyContext,
  TaxonomyProcessingResult,
} from '../types/tactiques';

const MASTER_REGEX = /(<[^>]*>|\[[^\]]+\])/g;

/**
 * Génère la chaîne de taxonomie finale en remplaçant les variables et en traitant les groupes.
 * @param structure La chaîne de taxonomie brute (ex: "[VAR1]|<[VAR2]_[VAR3]>").
 * @param valueResolver Une fonction qui prend (variableName, format) et retourne la valeur résolue.
 * @returns La chaîne de taxonomie finale.
 */
export function generateFinalTaxonomyString(
  structure: string,
  valueResolver: (variableName: string, format: TaxonomyFormat) => string
): string {
  if (!structure) return '';

  const segments = structure.split(MASTER_REGEX).filter(Boolean);

  const result = segments.map(segment => {
    // Traitement pour les groupes <...>
    if (segment.startsWith('<') && segment.endsWith('>')) {
      const groupContent = segment.slice(1, -1);
      
      const variablesInGroup = Array.from(groupContent.matchAll(TAXONOMY_VARIABLE_REGEX));
      if (variablesInGroup.length === 0) return groupContent;

      const resolvedValues = variablesInGroup
        .map(match => {
          const [, variableName, format] = match;
          const resolved = valueResolver(variableName, format as TaxonomyFormat);
          return (resolved && !resolved.startsWith('[')) ? resolved : null;
        })
        .filter((value): value is string => value !== null && value.trim() !== '');

      if (resolvedValues.length === 0) {
        return '';
      }

      const delimiterMatch = groupContent.match(/\](.*?)\s*\[/);
      const delimiter = delimiterMatch ? delimiterMatch[1] : '';

      return resolvedValues.join(delimiter);
    }

    // Traitement pour les variables simples [...]
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const variableMatch = segment.match(TAXONOMY_VARIABLE_REGEX);
      if (variableMatch) {
        const [, variableName, format] = variableMatch;
        const resolvedValue = valueResolver(variableName, format as TaxonomyFormat);
        return resolvedValue.startsWith('[') ? '' : resolvedValue;
      }
    }

    return segment;
  });

  return result.join('');
}

/**
 * Parse une structure de taxonomie donnée et extrait les variables qu'elle contient.
 * Valide chaque variable trouvée et collecte les erreurs.
 * @param structure La chaîne de taxonomie à analyser.
 * @param level Le niveau de la taxonomie (pour le contexte).
 * @returns Un objet ParsedTaxonomyStructure contenant les variables extraites, leur validité et les erreurs.
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

  const allVarsRegex = new RegExp(TAXONOMY_VARIABLE_REGEX.source, 'g');
  
  let match;
  const foundVariables = new Set<string>();

  while ((match = allVarsRegex.exec(structure)) !== null) {
    const [fullMatch, variableName, format] = match;
    const variableKey = `${variableName}:${format}`;
    
    if (foundVariables.has(variableKey)) continue;
    foundVariables.add(variableKey);

    const source = getFieldSource(variableName);
    const validation = validateVariable(variableName, format as TaxonomyFormat);
    const config = getVariableConfig(variableName);

    
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
        label: config?.label,
        level,
        isValid: validation.isValid,
        errorMessage: validation.errorMessage,
      });
    }
    
    if (!validation.isValid && validation.errorMessage) {
      result.isValid = false;
      result.errors.push(`${variableName}: ${validation.errorMessage}`);
    }
  }
  
  return result;
}

/**
 * Valide une variable de taxonomie en vérifiant si elle est connue et si le format est autorisé.
 * @param variableName Le nom de la variable à valider.
 * @param format Le format de la variable.
 * @returns Un objet indiquant si la variable est valide et un message d'erreur si ce n'est pas le cas.
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
  
  const config = getVariableConfig(variableName);
  const allowedFormats = config?.allowedFormats || [];

  if (!allowedFormats.includes(format)) {
    return {
      isValid: false,
      errorMessage: `Format ${format} non compatible. Formats permis: ${allowedFormats.join(', ')}`
    };
  }
  
  return { isValid: true };
}

/**
 * Analyse toutes les taxonomies fournies (tags, platform, mediaOcean).
 * @param taxonomyTags La chaîne de taxonomie pour les tags.
 * @param taxonomyPlatform La chaîne de taxonomie pour la plateforme.
 * @param taxonomyMediaOcean La chaîne de taxonomie pour MediaOcean.
 * @returns Un objet contenant les structures analysées pour chaque type de taxonomie.
 */
export function parseAllTaxonomies(
  taxonomyTags?: string,
  taxonomyPlatform?: string, 
  taxonomyMediaOcean?: string
): { [key: string]: ParsedTaxonomyStructure } {
  const results: { [key: string]: ParsedTaxonomyStructure } = {};
  if (taxonomyTags) results.tags = parseTaxonomyStructure(taxonomyTags, 1);
  if (taxonomyPlatform) results.platform = parseTaxonomyStructure(taxonomyPlatform, 2);
  if (taxonomyMediaOcean) results.mediaocean = parseTaxonomyStructure(taxonomyMediaOcean, 3);
  return results;
}

/**
 * Extrait toutes les variables uniques de plusieurs structures de taxonomie analysées.
 * Consolidate les formats pour les variables dupliquées.
 * @param parsedStructures Un objet contenant des structures de taxonomie analysées.
 * @returns Un tableau de ParsedTaxonomyVariable, où chaque variable est unique et contient tous ses formats pertinents.
 */
export function extractUniqueVariables(
  parsedStructures: { [key: string]: ParsedTaxonomyStructure }
): ParsedTaxonomyVariable[] {
  const uniqueVariables = new Map<string, ParsedTaxonomyVariable>();
  
  Object.values(parsedStructures).forEach(structure => {
    structure.variables.forEach(variable => {
      const key = variable.variable;
      if (uniqueVariables.has(key)) {
        const existing = uniqueVariables.get(key)!;
        variable.formats.forEach(format => {
          if (!existing.formats.includes(format)) {
            existing.formats.push(format);
          }
        });
      } else {
        uniqueVariables.set(key, { ...variable });
      }
    });
  });
  
  return Array.from(uniqueVariables.values());
}

/**
 * Traite les taxonomies complètes en analysant les structures, en extrayant les variables uniques,
 * et en générant les chaînes de taxonomie finales en résolvant les valeurs.
 * @param taxonomyTags La chaîne de taxonomie pour les tags.
 * @param taxonomyPlatform La chaîne de taxonomie pour la plateforme.
 * @param taxonomyMediaOcean La chaîne de taxonomie pour MediaOcean.
 * @param context Le contexte pour la résolution des variables (ex: campagne, tactique).
 * @param taxonomyValues Les valeurs de taxonomie spécifiques.
 * @returns Un objet TaxonomyProcessingResult contenant les variables, les valeurs, les taxonomies générées, les erreurs et les avertissements.
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
    result.variables = extractUniqueVariables(structures);
    
    const resolveValue = (varName: string, format: TaxonomyFormat): string => {
        if (context?.campaign && varName.startsWith('CA_')) return context.campaign[varName.split('_').pop()?.toLowerCase() || ''] || '';
        if (context?.tactique && varName.startsWith('TC_')) return context.tactique[varName] || '';
        if (taxonomyValues && taxonomyValues[varName]) return taxonomyValues[varName].value || '';
        return `[${varName}]`;
    }

    if (structures.tags) {
        result.generated.tags = generateFinalTaxonomyString(taxonomyTags || '', resolveValue);
    }
    if (structures.platform) {
        result.generated.platform = generateFinalTaxonomyString(taxonomyPlatform || '', resolveValue);
    }
    if (structures.mediaocean) {
        result.generated.mediaocean = generateFinalTaxonomyString(taxonomyMediaOcean || '', resolveValue);
    }
    
    Object.values(structures).forEach(structure => {
      result.errors.push(...structure.errors);
    });
    
  } catch (error) {
    result.errors.push(ERROR_MESSAGES.PARSING_ERROR);
  }
  
  return result;
}