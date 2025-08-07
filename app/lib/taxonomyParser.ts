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
 * * @param structure - Structure de taxonomie (ex: "[TC_Publisher:code]|[TC_Objective:display_fr]")
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
    const validation = validateVariable(variableName, format);
    const allowedFormats = getAllowedFormats(variableName);
    
    const parsedVariable: ParsedTaxonomyVariable = {
      variable: variableName,
      formats: allowedFormats,
      source: source || 'placement',
      level,
      isValid: validation.isValid,
      errorMessage: validation.errorMessage
    };

    result.variables.push(parsedVariable);
    
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

function validateVariable(
  variableName: string, 
  format: string
): { isValid: boolean; errorMessage?: string } {
  
  if (!isKnownVariable(variableName)) {
    return {
      isValid: false,
      errorMessage: `${ERROR_MESSAGES.UNKNOWN_VARIABLE}: ${variableName}`
    };
  }
  
  if (!isValidFormat(format)) {
    return {
      isValid: false,
      errorMessage: `${ERROR_MESSAGES.INVALID_FORMAT}: ${format}`
    };
  }
  
  return { isValid: true };
}

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

export function resolveVariableValues(
  variables: ParsedTaxonomyVariable[],
  context: TaxonomyContext
): TaxonomyValues {
  const values: TaxonomyValues = {};
  
  variables.forEach(variable => {
    const resolvedValue = resolveVariableValue(variable, context);
    values[variable.variable] = {
      value: resolvedValue,
      source: variable.source,
      format: variable.formats[0] || 'display_fr'
    };
  });
  
  return values;
}

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
        return '';
    }
  } catch (error) {
    console.error(`Erreur lors de la résolution de ${varName}:`, error);
    return '';
  }
}

function resolveCampaignValue(variableName: string, campaignData?: any): string {
  if (!campaignData) return '';
  const rawValue = campaignData[variableName];
  return (rawValue === undefined || rawValue === null) ? '' : String(rawValue);
}

function resolveTactiqueValue(variableName: string, tactiqueData?: any): string {
  if (!tactiqueData) return '';
  const rawValue = tactiqueData[variableName];
  return (rawValue === undefined || rawValue === null) ? '' : String(rawValue);
}

function resolvePlacementValue(variableName: string, placementData?: any): string {
  if (!placementData) return '';
  const rawValue = placementData[variableName];
  return (rawValue === undefined || rawValue === null) ? '' : String(rawValue);
}

function resolveCreatifValue(variableName: string, placementData?: any): string {
  if (!placementData) return '';
  if (placementData.PL_Taxonomy_Values && placementData.PL_Taxonomy_Values[variableName]) {
    return placementData.PL_Taxonomy_Values[variableName].value || '';
  }
  return '';
}

// ==================== FONCTIONS DE GÉNÉRATION ====================

export function generateTaxonomyStrings(
  structures: { [key: string]: ParsedTaxonomyStructure },
  values: TaxonomyValues
): GeneratedTaxonomies {
  const generated: GeneratedTaxonomies = {};
  
  Object.entries(structures).forEach(([type, structure]) => {
    if (structure.isValid) {
      const generatedString = generateSingleTaxonomyString(structure, values);
      if (generatedString) {
        generated[type as keyof GeneratedTaxonomies] = generatedString;
      }
    }
  });
  
  return generated;
}

function generateSingleTaxonomyString(
  structure: ParsedTaxonomyStructure,
  values: TaxonomyValues
): string {
  const segments = structure.variables.map(variable => {
    const value = values[variable.variable];
    if (value && value.value) {
      return value.value;
    }
    return `[${variable.variable}:${variable.formats[0] || 'display_fr'}]`;
  });
  
  return segments.filter(Boolean).join('|');
}

// ==================== FONCTION PRINCIPALE ====================

export function processTaxonomies(
  taxonomyTags?: string,
  taxonomyPlatform?: string,
  taxonomyMediaOcean?: string,
  context?: TaxonomyContext
): TaxonomyProcessingResult {
  const result: TaxonomyProcessingResult = {
    variables: [],
    values: {},
    generated: {},
    errors: [],
    warnings: []
  };
  
  try {
    const structures = parseAllTaxonomies(taxonomyTags, taxonomyPlatform, taxonomyMediaOcean);
    const uniqueVariables = extractUniqueVariables(structures);
    result.variables = uniqueVariables;
    
    if (context) {
      result.values = resolveVariableValues(uniqueVariables, context);
      result.generated = generateTaxonomyStrings(structures, result.values);
    }
    
    Object.values(structures).forEach(structure => {
      result.errors.push(...structure.errors);
    });
    
  } catch (error) {
    console.error('💥 Erreur lors du traitement des taxonomies:', error);
    result.errors.push(ERROR_MESSAGES.PARSING_ERROR);
  }
  
  return result;
}

// ==================== FONCTION POUR GÉNÉRATION DIRECTE ====================

export function generateFinalTaxonomyString(
  structure: string,
  valueResolver: (variableName: string, format: TaxonomyFormat) => string
): string {
  if (!structure || typeof structure !== 'string') {
    return '';
  }

  return structure.replace(TAXONOMY_VARIABLE_REGEX, (fullMatch, variableName, format) => {
    return valueResolver(variableName, format as TaxonomyFormat);
  });
}

// ==================== FONCTIONS UTILITAIRES ====================

export function createFieldConfig(
  variable: ParsedTaxonomyVariable,
  currentValue?: string,
  hasCustomList: boolean = false
): TaxonomyFieldConfig {
  return {
    variable: variable.variable,
    source: variable.source,
    formats: variable.formats,
    isRequired: true,
    hasCustomList,
    currentValue,
    placeholder: generatePlaceholder(variable),
    requiresShortcode: variable.formats.some(formatRequiresShortcode),
    allowsUserInput: variable.formats.some(formatAllowsUserInput)
  };
}

function generatePlaceholder(variable: ParsedTaxonomyVariable): string {
  const primaryFormat = variable.formats[0] || 'display_fr';
  const formatInfo = getFormatInfo(primaryFormat);
  const formatLabel = formatInfo?.label || primaryFormat;
  
  switch (variable.source) {
    case 'campaign': return `Valeur de campagne (${formatLabel})`;
    case 'tactique': return `Valeur de tactique (${formatLabel})`;
    case 'placement': return `Valeur de placement (${formatLabel})`;
    case 'créatif': return `Valeur de créatif (${formatLabel})`;
    default: return `Saisir ${formatLabel}...`;
  }
}

// ==================== FONCTIONS CENTRALISÉES POUR DÉLIMITEURS SPÉCIAUX (CORRIGÉES) ====================

/**
 * 🔥 CORRIGÉ : Fonction de remplacement asynchrone sécurisée.
 * Traite les délimiteurs en plusieurs passes jusqu'à stabilisation pour éviter les boucles infinies.
 */
export async function processTaxonomyDelimiters(
  structure: string,
  variableResolver: (variableName: string, format: string) => Promise<string> | string
): Promise<string> {
  if (!structure) return '';

  let currentStructure = structure;
  let previousStructure = '';

  const asyncReplace = async (str: string, regex: RegExp, asyncFn: (...args: any[]) => Promise<string>) => {
    const matches = Array.from(str.matchAll(regex));
    const promises = matches.map(match => asyncFn(...match));
    const replacements = await Promise.all(promises);
    return str.replace(regex, () => replacements.shift() || '');
  };

  while (currentStructure !== previousStructure) {
    previousStructure = currentStructure;
    let tempStructure = previousStructure;

    // 1. Groupes conditionnels <content>
    tempStructure = await asyncReplace(tempStructure, /<([^>]+)>/g, (match, content) =>
      processConditionalGroup(content, variableResolver)
    );

    // 2. Règles ▶content◀ (minuscules)
    tempStructure = await asyncReplace(tempStructure, /▶([^◀]+)◀/g, (match, content) =>
      processContentWithVariableTransform(content, variableResolver, (v) => v.toLowerCase())
    );

    // 3. Règles 〔content〕 (nettoyage)
    tempStructure = await asyncReplace(tempStructure, /〔([^〕]+)〕/g, (match, content) =>
      processContentWithVariableTransform(content, variableResolver, cleanSpecialCharacters)
    );
    
    // 4. Règles 〈content〉 (remplacement conditionnel par &)
    const ampersandRegex = /〈([^〉]+)〉/g;
    const ampersandCount = (tempStructure.match(ampersandRegex) || []).length;
    if (ampersandCount > 0) {
      tempStructure = await asyncReplace(tempStructure, ampersandRegex, (match, content) => {
        if (ampersandCount > 1) return Promise.resolve('&');
        return processContentWithVariableTransform(content, variableResolver, (v) => v);
      });
    }
    
    // 5. Variables individuelles restantes
    tempStructure = await asyncReplace(tempStructure, /\[([^:]+):([^\]]+)\]/g, (match, name, format) =>
      Promise.resolve(variableResolver(name, format))
    );

    currentStructure = tempStructure;
  }

  return currentStructure;
}

/**
 * 🔥 CORRIGÉ : Version synchrone sécurisée.
 * Utilise la même logique de stabilisation pour éviter les boucles infinies.
 */
export function processTaxonomyDelimitersSync(
  structure: string,
  variableResolver: (variableName: string, format: string) => string
): string {
  if (!structure) return '';

  let currentStructure = structure;
  let previousStructure = '';

  while (currentStructure !== previousStructure) {
    previousStructure = currentStructure;
    let tempStructure = previousStructure;

    // 1. Groupes conditionnels <content>
    tempStructure = tempStructure.replace(/<([^>]+)>/g, (match, content) =>
      processConditionalGroupSync(content, variableResolver)
    );

    // 2. Règles ▶content◀ (minuscules)
    tempStructure = tempStructure.replace(/▶([^◀]+)◀/g, (match, content) =>
      processContentWithVariableTransformSync(content, variableResolver, (v) => v.toLowerCase())
    );

    // 3. Règles 〔content〕 (nettoyage)
    tempStructure = tempStructure.replace(/〔([^〕]+)〕/g, (match, content) =>
      processContentWithVariableTransformSync(content, variableResolver, cleanSpecialCharacters)
    );
    
    // 4. Règles 〈content〉 (remplacement conditionnel par &)
    const ampersandRegex = /〈([^〉]+)〉/g;
    const ampersandCount = (tempStructure.match(ampersandRegex) || []).length;
    if (ampersandCount > 0) {
        tempStructure = tempStructure.replace(ampersandRegex, (match, content) => {
            if (ampersandCount > 1) return '&';
            return processContentWithVariableTransformSync(content, variableResolver, (v) => v);
        });
    }

    // 5. Variables individuelles restantes
    tempStructure = tempStructure.replace(/\[([^:]+):([^\]]+)\]/g, (match, name, format) =>
      variableResolver(name, format)
    );

    currentStructure = tempStructure;
  }

  return currentStructure;
}

// ==================== FONCTIONS HELPER POUR DÉLIMITEURS ====================

async function processConditionalGroup(
  groupContent: string,
  variableResolver: (variableName: string, format: string) => Promise<string> | string
): Promise<string> {
  const variableMatches = Array.from(groupContent.matchAll(/\[([^:]+):([^\]]+)\]/g));
  
  if (variableMatches.length === 0) {
    return processContentWithVariableTransform(groupContent, variableResolver, v => v);
  }

  const resolvedValues = await Promise.all(
    variableMatches.map(match => Promise.resolve(variableResolver(match[1], match[2])))
  );
  
  const nonEmptyValues = resolvedValues.filter(v => v && !v.startsWith('['));

  if (nonEmptyValues.length <= 1) {
    return nonEmptyValues.join('');
  }

  const delimiter = findDelimiterBetweenFirstTwoVariables(groupContent, variableMatches);
  return nonEmptyValues.join(delimiter);
}

function processConditionalGroupSync(
  groupContent: string,
  variableResolver: (variableName: string, format: string) => string
): string {
  const variableMatches = Array.from(groupContent.matchAll(/\[([^:]+):([^\]]+)\]/g));
  
  if (variableMatches.length === 0) {
    return processContentWithVariableTransformSync(groupContent, variableResolver, v => v);
  }

  const nonEmptyValues = variableMatches
    .map(match => variableResolver(match[1], match[2]))
    .filter(v => v && !v.startsWith('['));

  if (nonEmptyValues.length <= 1) {
    return nonEmptyValues.join('');
  }

  const delimiter = findDelimiterBetweenFirstTwoVariables(groupContent, variableMatches);
  return nonEmptyValues.join(delimiter);
}

function findDelimiterBetweenFirstTwoVariables(
  content: string, 
  variableMatches: RegExpMatchArray[]
): string {
  if (variableMatches.length < 2) return '';

  const firstEnd = (variableMatches[0].index || 0) + variableMatches[0][0].length;
  const secondStart = variableMatches[1].index || 0;
  return content.substring(firstEnd, secondStart).trim();
}

/**
 * 🔥 CORRIGÉ : Traite le contenu avec une seule passe de `replace` pour éviter les boucles.
 */
async function processContentWithVariableTransform(
  content: string,
  variableResolver: (variableName: string, format: string) => Promise<string> | string,
  transform: (value: string) => string
): Promise<string> {
  const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;

  const matches = Array.from(content.matchAll(VARIABLE_REGEX));
  const promises = matches.map(async (match) => {
    const resolvedValue = await Promise.resolve(variableResolver(match[1], match[2]));
    return resolvedValue && !resolvedValue.startsWith('[') ? transform(resolvedValue) : resolvedValue;
  });

  const replacements = await Promise.all(promises);
  return content.replace(VARIABLE_REGEX, () => replacements.shift() || '');
}

/**
 * 🔥 CORRIGÉ : Version synchrone utilisant une seule passe de `replace`.
 */
function processContentWithVariableTransformSync(
  content: string,
  variableResolver: (variableName: string, format: string) => string,
  transform: (value: string) => string
): string {
  const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
  
  return content.replace(VARIABLE_REGEX, (fullMatch, variableName, format) => {
    const resolvedValue = variableResolver(variableName, format);
    return resolvedValue && !resolvedValue.startsWith('[') ? transform(resolvedValue) : resolvedValue;
  });
}

function cleanSpecialCharacters(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '') // Garde lettres (Unicode), chiffres, et tirets
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}