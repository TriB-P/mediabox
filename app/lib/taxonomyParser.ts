// app/lib/taxonomyParser.ts

// 🔥 MODIFICATION: Import des fonctions et types depuis le fichier de configuration central.
import {
  TAXONOMY_VARIABLE_REGEX,
  ERROR_MESSAGES,
  getFieldSource,
  isKnownVariable,
  isFormatAllowed,
  getVariableConfig, // <- Import de la nouvelle fonction
  type TaxonomyFormat // <- Import du type depuis la bonne source
} from '../config/taxonomyFields';

// 🔥 MODIFICATION: Les types du parser proviennent maintenant de 'tactiques'
import type {
  ParsedTaxonomyVariable,
  ParsedTaxonomyStructure,
  TaxonomyValues,
  GeneratedTaxonomies,
  TaxonomyContext,
  TaxonomyProcessingResult,
} from '../types/tactiques';


// Regex pour extraire les variables individuelles et les groupes.
// Un groupe est maintenant défini par <...>
const MASTER_REGEX = /(<[^>]*>|\[[^\]]+\])/g;

/**
 * Génère la chaîne de taxonomie finale en remplaçant les variables et en traitant les groupes.
 * @param structure - La chaîne de taxonomie brute (ex: "[VAR1]|<[VAR2]_[VAR3]>").
 * @param valueResolver - Une fonction qui prend (variableName, format) et retourne la valeur résolue.
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
      if (variablesInGroup.length === 0) return groupContent; // Retourne le contenu statique s'il n'y a pas de variables

      // 1. Résoudre toutes les variables et ne garder que celles qui ont une valeur
      const resolvedValues = variablesInGroup
        .map(match => {
          const [, variableName, format] = match;
          const resolved = valueResolver(variableName, format as TaxonomyFormat);
          // Retourner la valeur si elle est valide, sinon null
          return (resolved && !resolved.startsWith('[')) ? resolved : null;
        })
        .filter((value): value is string => value !== null && value.trim() !== ''); // Filtre les null et les chaînes vides

      // 2. Si aucune variable n'a pu être résolue, le groupe est vide
      if (resolvedValues.length === 0) {
        return '';
      }

      // 3. Trouver le délimiteur (logique existante, suppose un délimiteur constant)
      const delimiterMatch = groupContent.match(/\](.*?)\s*\[/);
      const delimiter = delimiterMatch ? delimiterMatch[1] : '';

      // 4. Joindre UNIQUEMENT les valeurs résolues
      return resolvedValues.join(delimiter);
    }

    // Traitement pour les variables simples [...]
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const variableMatch = segment.match(TAXONOMY_VARIABLE_REGEX);
      if (variableMatch) {
        const [, variableName, format] = variableMatch;
        const resolvedValue = valueResolver(variableName, format as TaxonomyFormat);
        return resolvedValue.startsWith('[') ? '' : resolvedValue; // Retourner vide si non résolu
      }
    }

    // Le segment est du texte statique (comme '|')
    return segment;
  });

  return result.join('');
}


// --- Fonctions existantes (aucune modification nécessaire ici) ---

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
    const config = getVariableConfig(variableName); // ✅ NOUVEAU: Récupérer la config

    
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
  
  const config = getVariableConfig(variableName); // Utilise la fonction importée
  const allowedFormats = config?.allowedFormats || [];

  if (!allowedFormats.includes(format)) {
    return {
      isValid: false,
      errorMessage: `Format ${format} non compatible. Formats permis: ${allowedFormats.join(', ')}`
    };
  }
  
  return { isValid: true };
}

// Les autres fonctions comme resolveVariableValues, extractUniqueVariables, etc. restent inchangées.
// ... (le reste du fichier reste identique)
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