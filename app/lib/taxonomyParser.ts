// app/lib/taxonomyParser.ts

import {
    TAXONOMY_FIELD_SOURCES,
    SHORTCODE_FORMATS,
    TAXONOMY_VARIABLE_REGEX,
    MAX_TAXONOMY_LEVELS,
    ERROR_MESSAGES,
    getFieldSource,
    isValidFormat,
    getFormatInfo,
    isKnownVariable
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
  
  // ==================== FONCTIONS DE PARSING ====================
  
  /**
   * Parse une structure de taxonomie et extrait toutes les variables
   * 
   * @param structure - Structure de taxonomie (ex: "[TC_Publisher:code]|[TC_Objective:display_fr]")
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
      const validation = validateVariable(variableName, format);
      
      const parsedVariable: ParsedTaxonomyVariable = {
        variable: variableName,
        format: format as TaxonomyVariableFormat,
        source: source || 'manual', // Fallback sur manual si source inconnue
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
        format: variable.format
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
    const { variable: varName, source, format } = variable;
    
    try {
      switch (source) {
        case 'campaign':
          return resolveCampaignValue(varName, format, context.campaign);
          
        case 'tactique':
          return resolveTactiqueValue(varName, format, context.tactique);
          
        case 'manual':
          return resolveManualValue(varName, format, context.placement);
          
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
  function resolveCampaignValue(
    variableName: string, 
    format: TaxonomyVariableFormat, 
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
    
    return String(rawValue);
  }
  
  /**
   * Résout une valeur depuis les données de tactique
   */
  function resolveTactiqueValue(
    variableName: string, 
    format: TaxonomyVariableFormat, 
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
    
    return String(rawValue);
  }
  
  /**
   * Résout une valeur saisie manuellement
   */
  function resolveManualValue(
    variableName: string, 
    format: TaxonomyVariableFormat, 
    placementData?: any
  ): string {
    if (!placementData || !placementData.PL_Taxonomy_Values) {
      console.log(`❌ Pas de valeurs manuelles pour ${variableName}`);
      return '';
    }
    
    const manualValue = placementData.PL_Taxonomy_Values[variableName];
    
    if (!manualValue) {
      console.log(`❌ Valeur manuelle manquante pour ${variableName}`);
      return '';
    }
    
    return manualValue.value || '';
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
      if (type === 'tags' && structure.isValid) {
        generated.tags = generateSingleTaxonomyString(structure, values);
      } else if (type === 'platform' && structure.isValid) {
        generated.platform = generateSingleTaxonomyString(structure, values);
      } else if (type === 'mediaocean' && structure.isValid) {
        generated.mediaocean = generateSingleTaxonomyString(structure, values);
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
    // Pour l'instant, on retourne une structure simple séparée par des pipes
    // Cette logique pourra être enrichie selon les besoins spécifiques
    
    const segments = structure.variables.map(variable => {
      const value = values[variable.variable];
      if (value && value.value) {
        return value.value;
      }
      return `[${variable.variable}:${variable.format}]`; // Placeholder si pas de valeur
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
      format: variable.format,
      isRequired: variable.source !== 'manual', // Les champs manuels sont optionnels
      hasCustomList,
      currentValue,
      placeholder: generatePlaceholder(variable)
    };
  }
  
  /**
   * Génère un placeholder pour un champ selon sa source
   */
  function generatePlaceholder(variable: ParsedTaxonomyVariable): string {
    const formatInfo = getFormatInfo(variable.format);
    const formatLabel = formatInfo?.label || variable.format;
    
    switch (variable.source) {
      case 'campaign':
        return `Valeur de campagne (${formatLabel})`;
      case 'tactique':
        return `Valeur de tactique (${formatLabel})`;
      case 'manual':
        return `Saisir ${formatLabel}...`;
      default:
        return `Valeur ${formatLabel}`;
    }
  }