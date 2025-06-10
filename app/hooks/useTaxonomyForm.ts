// app/hooks/useTaxonomyForm.ts - VERSION OPTIMISÉE AVEC DÉDUPLICATION ET FORMATS ÉTENDUS

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTaxonomyById } from '../lib/taxonomyService';
import { getDynamicList, hasDynamicList } from '../lib/tactiqueListService';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Taxonomy } from '../types/taxonomy';
import { 
  AVAILABLE_FIELDS, 
  TAXONOMY_FORMATS,
  TAXONOMY_VARIABLE_REGEX,
  getFieldDefinition,
  getFieldSource,
  getFormatInfo,
  formatRequiresShortcode,
  formatAllowsUserInput,
  getFormatFallbackChain,
  isKnownVariable,
  isValidFormat,
  type TaxonomyFormat,
  type FieldSource 
} from '../config/taxonomyFields';
import type {
  PlacementFormData,
  HighlightState,
  TaxonomyValues,
  TaxonomyVariableValue
} from '../types/tactiques';

// ==================== TYPES OPTIMISÉS ====================

// Variable parsée avec déduplication optimisée
interface OptimizedParsedVariable {
  variable: string;
  formats: TaxonomyFormat[]; // Tous les formats demandés pour cette variable
  source: FieldSource;
  level: number;
  isValid: boolean;
  errorMessage?: string;
  occurrences: Array<{ // Toutes les occurrences dans les taxonomies
    taxonomyType: 'tags' | 'platform' | 'mediaocean';
    format: TaxonomyFormat;
    level: number;
  }>;
}

interface FieldState {
  options: Array<{ id: string; label: string; code?: string }>;
  hasCustomList: boolean;
  isLoading: boolean;
  error?: string;
}

interface ShortcodeData {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Display_Name_EN?: string;
  SH_Default_UTM?: string;
}

interface CustomCode {
  CC_Shortcode_ID: string;
  CC_Custom_UTM?: string;
  CC_Custom_Code?: string;
}

interface UseTaxonomyFormProps {
  formData: PlacementFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  clientId: string;
  campaignData?: any;
  tactiqueData?: any;
}

// ==================== HOOK PRINCIPAL OPTIMISÉ ====================

export function useTaxonomyForm({
  formData,
  onChange,
  clientId,
  campaignData,
  tactiqueData
}: UseTaxonomyFormProps) {
  
  // ==================== ÉTATS ====================
  
  const [selectedTaxonomyData, setSelectedTaxonomyData] = useState<{
    tags?: Taxonomy;
    platform?: Taxonomy;
    mediaocean?: Taxonomy;
  }>({});
  
  const [taxonomiesLoading, setTaxonomiesLoading] = useState(false);
  const [taxonomiesError, setTaxonomiesError] = useState<string | null>(null);
  const [parsedVariables, setParsedVariables] = useState<OptimizedParsedVariable[]>([]);
  const [fieldStates, setFieldStates] = useState<{ [key: string]: FieldState }>({});
  const [taxonomyValues, setTaxonomyValues] = useState<TaxonomyValues>(
    formData.PL_Taxonomy_Values || {}
  );
  
  // Cache pour les shortcodes avec optimisation
  const [shortcodeCache, setShortcodeCache] = useState<Map<string, ShortcodeData>>(new Map());
  const [customCodesCache, setCustomCodesCache] = useState<CustomCode[]>([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  
  const [highlightState, setHighlightState] = useState<HighlightState>({
    mode: 'none'
  });
  
  const [expandedPreviews, setExpandedPreviews] = useState({
    tags: false,
    platform: false,
    mediaocean: false
  });

  // ==================== VALEURS CALCULÉES ====================
  
  const selectedTaxonomyIds = useMemo(() => ({
    tags: formData.PL_Taxonomy_Tags || '',
    platform: formData.PL_Taxonomy_Platform || '',
    mediaocean: formData.PL_Taxonomy_MediaOcean || ''
  }), [formData.PL_Taxonomy_Tags, formData.PL_Taxonomy_Platform, formData.PL_Taxonomy_MediaOcean]);

  const hasTaxonomies = useMemo(() => Boolean(
    selectedTaxonomyIds.tags || 
    selectedTaxonomyIds.platform || 
    selectedTaxonomyIds.mediaocean
  ), [selectedTaxonomyIds]);

  const manualVariables = useMemo(() => 
    parsedVariables.filter(variable => variable.source === 'manual'),
    [parsedVariables]
  );
  
  const hasLoadingFields = useMemo(() => 
    Object.values(fieldStates).some(fs => fs.isLoading),
    [fieldStates]
  );

  // ==================== CHARGEMENT CACHE OPTIMISÉ ====================
  
  const loadShortcodeCache = useCallback(async () => {
    if (cacheLoaded) return;
    
    console.log('🔄 Chargement optimisé du cache shortcodes');
    
    try {
      // Charger les custom codes en parallèle
      const customCodesRef = collection(db, 'clients', clientId, 'customCodes');
      const customSnapshot = await getDocs(customCodesRef);
      
      const customCodes: CustomCode[] = customSnapshot.docs.map(doc => ({
        CC_Shortcode_ID: doc.data().CC_Shortcode_ID,
        CC_Custom_UTM: doc.data().CC_Custom_UTM,
        CC_Custom_Code: doc.data().CC_Custom_Code,
      }));
      
      setCustomCodesCache(customCodes);
      setCacheLoaded(true);
      
      console.log('✅ Cache shortcodes chargé avec', customCodes.length, 'codes personnalisés');
      
    } catch (error) {
      console.error('Erreur chargement cache:', error);
      setCacheLoaded(true);
    }
  }, [clientId, cacheLoaded]);

  const loadShortcode = useCallback(async (shortcodeId: string): Promise<ShortcodeData | null> => {
    if (shortcodeCache.has(shortcodeId)) {
      return shortcodeCache.get(shortcodeId)!;
    }
    
    try {
      const shortcodeRef = doc(db, 'shortcodes', shortcodeId);
      const shortcodeSnap = await getDoc(shortcodeRef);
      
      if (!shortcodeSnap.exists()) return null;
      
      const data = shortcodeSnap.data();
      const shortcodeData: ShortcodeData = {
        id: shortcodeSnap.id,
        SH_Code: data.SH_Code || shortcodeSnap.id,
        SH_Display_Name_FR: data.SH_Display_Name_FR || data.SH_Code || shortcodeSnap.id,
        SH_Display_Name_EN: data.SH_Display_Name_EN,
        SH_Default_UTM: data.SH_Default_UTM,
      };
      
      setShortcodeCache(prev => new Map(prev).set(shortcodeId, shortcodeData));
      return shortcodeData;
      
    } catch (error) {
      console.error(`Erreur chargement shortcode ${shortcodeId}:`, error);
      return null;
    }
  }, [shortcodeCache]);

  // ==================== FORMATAGE AVANCÉ AVEC FALLBACKS ====================
  
  const formatShortcodeWithFallbacks = useCallback((
    shortcodeId: string, 
    format: TaxonomyFormat
  ): string => {
    const shortcodeData = shortcodeCache.get(shortcodeId);
    if (!shortcodeData) {
      loadShortcode(shortcodeId);
      return shortcodeId;
    }
    
    // Fonction récursive pour appliquer les fallbacks
    const applyFormat = (currentFormat: TaxonomyFormat): string | null => {
      switch (currentFormat) {
        case 'code':
          return shortcodeData.SH_Code;
          
        case 'display_fr':
          return shortcodeData.SH_Display_Name_FR;
          
        case 'display_en':
          return shortcodeData.SH_Display_Name_EN || null;
          
        case 'utm':
          return shortcodeData.SH_Default_UTM || null;
          
        case 'custom_utm':
          const customForUTM = customCodesCache.find(cc => cc.CC_Shortcode_ID === shortcodeId);
          return customForUTM?.CC_Custom_UTM || null;
          
        case 'custom_code':
          const customForCode = customCodesCache.find(cc => cc.CC_Shortcode_ID === shortcodeId);
          return customForCode?.CC_Custom_Code || null;
          
        default:
          return null;
      }
    };
    
    // Essayer le format demandé
    let result = applyFormat(format);
    if (result) return result;
    
    // Appliquer la chaîne de fallback
    const fallbackChain = getFormatFallbackChain(format);
    for (const fallbackFormat of fallbackChain) {
      result = applyFormat(fallbackFormat);
      if (result) {
        console.log(`📋 Fallback appliqué: ${format} → ${fallbackFormat} pour ${shortcodeId}`);
        return result;
      }
    }
    
    // Fallback ultime : SH_Code ou ID
    return shortcodeData.SH_Code || shortcodeId;
    
  }, [shortcodeCache, customCodesCache, loadShortcode]);

  // ==================== PARSING OPTIMISÉ AVEC DÉDUPLICATION ====================
  
  const parseAllTaxonomiesOptimized = useCallback(() => {
    console.log('🔍 Parsing optimisé avec déduplication');
    
    const variableMap = new Map<string, OptimizedParsedVariable>();
    
    // Helper pour extraire variables d'une structure
    const extractFromStructure = (
      structure: string, 
      taxonomyType: 'tags' | 'platform' | 'mediaocean'
    ) => {
      if (!structure) return;
      
      // Réinitialiser le regex
      TAXONOMY_VARIABLE_REGEX.lastIndex = 0;
      let match;
      
      while ((match = TAXONOMY_VARIABLE_REGEX.exec(structure)) !== null) {
        const [, variableName, format] = match;
        const formatTyped = format as TaxonomyFormat;
        
        // Valider la variable
        if (!isKnownVariable(variableName) || !isValidFormat(format)) {
          console.warn(`Variable ou format invalide: ${variableName}:${format}`);
          continue;
        }
        
        const source = getFieldSource(variableName) || 'manual';
        
        // Ajouter ou mettre à jour dans la map
        if (variableMap.has(variableName)) {
          const existing = variableMap.get(variableName)!;
          
          // Ajouter le format s'il n'existe pas déjà
          if (!existing.formats.includes(formatTyped)) {
            existing.formats.push(formatTyped);
          }
          
          // Ajouter l'occurrence
          existing.occurrences.push({
            taxonomyType,
            format: formatTyped,
            level: 1 // Pour l'instant niveau 1, à adapter si nécessaire
          });
          
        } else {
          // Nouvelle variable
          variableMap.set(variableName, {
            variable: variableName,
            formats: [formatTyped],
            source,
            level: 1,
            isValid: true,
            occurrences: [{
              taxonomyType,
              format: formatTyped,
              level: 1
            }]
          });
        }
      }
    };
    
    // Parser toutes les taxonomies
    if (selectedTaxonomyData.tags) {
      const structure = extractTaxonomyStructure(selectedTaxonomyData.tags);
      extractFromStructure(structure, 'tags');
    }
    
    if (selectedTaxonomyData.platform) {
      const structure = extractTaxonomyStructure(selectedTaxonomyData.platform);
      extractFromStructure(structure, 'platform');
    }
    
    if (selectedTaxonomyData.mediaocean) {
      const structure = extractTaxonomyStructure(selectedTaxonomyData.mediaocean);
      extractFromStructure(structure, 'mediaocean');
    }
    
    const result = Array.from(variableMap.values());
    
    console.log('🎯 Variables dédupliquées:', result.map(v => ({
      variable: v.variable,
      formats: v.formats,
      occurrences: v.occurrences.length
    })));
    
    return result;
  }, [selectedTaxonomyData]);

  const extractTaxonomyStructure = useCallback((taxonomy: Taxonomy): string => {
    const levels = [
      taxonomy.NA_Name_Level_1,
      taxonomy.NA_Name_Level_2,
      taxonomy.NA_Name_Level_3,
      taxonomy.NA_Name_Level_4
    ].filter(Boolean);
    
    return levels.join('|');
  }, []);

  // ==================== RÉSOLUTION DES VALEURS OPTIMISÉE ====================
  
  const resolveVariableValue = useCallback((variable: OptimizedParsedVariable): string => {
    const { variable: varName, source } = variable;
    
    // 1. Vérifier d'abord si on a une valeur manuelle
    const manualValue = taxonomyValues[varName];
    if (manualValue) {
      if (manualValue.format === 'open' && manualValue.openValue) {
        return manualValue.openValue;
      } else if (manualValue.shortcodeId && formatRequiresShortcode(manualValue.format)) {
        return formatShortcodeWithFallbacks(manualValue.shortcodeId, manualValue.format);
      } else {
        return manualValue.value || '';
      }
    }
    
    // 2. Résolution selon la source pour les champs hérités
    let rawValue: any = null;
    if (source === 'campaign' && campaignData?.[varName]) {
      rawValue = campaignData[varName];
    } else if (source === 'tactique' && tactiqueData?.[varName]) {
      rawValue = tactiqueData[varName];
    }
    
    if (rawValue) {
      const rawValueStr = String(rawValue);
      
      // Pour les valeurs héritées, utiliser le premier format demandé
      const primaryFormat = variable.formats[0];
      if (primaryFormat !== 'open' && rawValueStr.length > 5 && !rawValueStr.includes(' ')) {
        // Probablement un shortcode ID
        const formattedValue = formatShortcodeWithFallbacks(rawValueStr, primaryFormat);
        if (formattedValue && formattedValue !== rawValueStr) {
          return formattedValue;
        }
      }
      
      return rawValueStr;
    }
    
    return source === 'manual' ? '' : `[${varName}:${variable.formats.join('|')}]`;
  }, [taxonomyValues, campaignData, tactiqueData, formatShortcodeWithFallbacks]);

  // ==================== FONCTIONS DE FORMATAGE SYNCHRONES ====================
  
  const getFormattedValue = useCallback((variableName: string): string => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    if (!variable) return '';
    
    return resolveVariableValue(variable);
  }, [parsedVariables, resolveVariableValue]);

  // Génère l'aperçu avec chaque occurrence dans son format spécifique
  const getFormattedPreview = useCallback((taxonomyType: 'tags' | 'platform' | 'mediaocean'): string => {
    console.log(`🎯 Génération aperçu pour ${taxonomyType}`);
    
    const taxonomy = selectedTaxonomyData[taxonomyType];
    if (!taxonomy) return '';
    
    const structure = extractTaxonomyStructure(taxonomy);
    if (!structure) return '';
    
    // Nouvelle regex à chaque appel pour éviter les problèmes de state
    const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
    
    const result = structure.replace(VARIABLE_REGEX, (match, variableName, requestedFormat) => {
      console.log(`🔍 Traitement ${variableName} avec format ${requestedFormat} dans ${taxonomyType}`);
      
      const variable = parsedVariables.find(v => v.variable === variableName);
      
      if (!variable) {
        console.log(`❌ Variable ${variableName} non trouvée`);
        return match;
      }
      
      const taxonomyValue = taxonomyValues[variableName];
      
      // Pour les champs hérités (campaign/tactique)
      if (variable.source === 'campaign' || variable.source === 'tactique') {
        let rawValue: any = null;
        if (variable.source === 'campaign' && campaignData?.[variableName]) {
          rawValue = campaignData[variableName];
        } else if (variable.source === 'tactique' && tactiqueData?.[variableName]) {
          rawValue = tactiqueData[variableName];
        }
        
        if (rawValue) {
          const rawValueStr = String(rawValue);
          
          // Utiliser le format spécifique demandé dans cette occurrence
          if (requestedFormat !== 'open' && rawValueStr.length > 5 && !rawValueStr.includes(' ')) {
            const formattedValue = formatShortcodeWithFallbacks(rawValueStr, requestedFormat as TaxonomyFormat);
            if (formattedValue && formattedValue !== rawValueStr) {
              console.log(`✅ HÉRITÉ ${variableName} formaté: ${rawValueStr} → ${formattedValue} (format: ${requestedFormat})`);
              return formattedValue;
            }
          }
          
          console.log(`📝 HÉRITÉ ${variableName} valeur brute: ${rawValueStr}`);
          return rawValueStr;
        }
      } 
      // Pour les champs manuels
      else if (variable.source === 'manual' && taxonomyValue) {
        if (requestedFormat === 'open' && taxonomyValue.openValue) {
          console.log(`📝 MANUEL ${variableName} saisie libre: ${taxonomyValue.openValue}`);
          return taxonomyValue.openValue;
        } else if (taxonomyValue.shortcodeId) {
          // Utiliser le format spécifique demandé dans cette occurrence
          const formattedValue = formatShortcodeWithFallbacks(taxonomyValue.shortcodeId, requestedFormat as TaxonomyFormat);
          console.log(`✅ MANUEL ${variableName} shortcode formaté: ${taxonomyValue.shortcodeId} → ${formattedValue} (format: ${requestedFormat})`);
          return formattedValue;
        } else if (taxonomyValue.value) {
          console.log(`📝 MANUEL ${variableName} valeur directe: ${taxonomyValue.value}`);
          return taxonomyValue.value;
        }
      }
      
      console.log(`❌ ${variableName} non résolu, garde ${match}`);
      return match; // Garder la variable non résolue
    });
    
    console.log(`🎯 Résultat final pour ${taxonomyType}: ${result}`);
    return result;
    
  }, [
    selectedTaxonomyData, 
    parsedVariables, 
    taxonomyValues, 
    campaignData, 
    tactiqueData, 
    formatShortcodeWithFallbacks,
    extractTaxonomyStructure
  ]);

  // ==================== CHARGEMENT DES DONNÉES ====================
  
  const loadTaxonomies = useCallback(async () => {
    if (!hasTaxonomies) {
      setSelectedTaxonomyData({});
      setParsedVariables([]);
      return;
    }
    
    console.log('🚀 Chargement des taxonomies');
    setTaxonomiesLoading(true);
    setTaxonomiesError(null);
    
    try {
      const newTaxonomyData: {
        tags?: Taxonomy;
        platform?: Taxonomy;
        mediaocean?: Taxonomy;
      } = {};
      
      const promises = [];
      
      if (selectedTaxonomyIds.tags) {
        promises.push(
          getTaxonomyById(clientId, selectedTaxonomyIds.tags)
            .then(data => data && (newTaxonomyData.tags = data))
        );
      }
      
      if (selectedTaxonomyIds.platform) {
        promises.push(
          getTaxonomyById(clientId, selectedTaxonomyIds.platform)
            .then(data => data && (newTaxonomyData.platform = data))
        );
      }
      
      if (selectedTaxonomyIds.mediaocean) {
        promises.push(
          getTaxonomyById(clientId, selectedTaxonomyIds.mediaocean)
            .then(data => data && (newTaxonomyData.mediaocean = data))
        );
      }
      
      await Promise.all(promises);
      setSelectedTaxonomyData(newTaxonomyData);
      
      console.log('✅ Taxonomies chargées');
      
    } catch (error) {
      console.error('Erreur chargement taxonomies:', error);
      setTaxonomiesError('Erreur lors du chargement');
    } finally {
      setTaxonomiesLoading(false);
    }
  }, [clientId, selectedTaxonomyIds, hasTaxonomies]);

  const loadFieldOptions = useCallback(async () => {
    const manualVars = parsedVariables.filter(v => v.source === 'manual');
    
    if (manualVars.length === 0) return;
    
    console.log('📦 Chargement des listes pour', manualVars.length, 'variables manuelles');
    
    for (const variable of manualVars) {
      const fieldKey = variable.variable;
      
      setFieldStates(prev => ({
        ...prev,
        [fieldKey]: {
          options: [],
          hasCustomList: false,
          isLoading: true
        }
      }));
      
      try {
        const fieldDef = getFieldDefinition(variable.variable);
        const hasCustom = fieldDef?.hasCustomList ? 
          await hasDynamicList(variable.variable, clientId) : false;
        
        let options: Array<{ id: string; label: string; code?: string }> = [];
        
        if (hasCustom) {
          const dynamicList = await getDynamicList(variable.variable, clientId);
          options = dynamicList.map(item => ({
            id: item.id,
            label: item.SH_Display_Name_FR || item.SH_Code || item.id,
            code: item.SH_Code
          }));
        }
        
        setFieldStates(prev => ({
          ...prev,
          [fieldKey]: {
            options,
            hasCustomList: hasCustom,
            isLoading: false
          }
        }));
        
      } catch (error) {
        console.error(`Erreur chargement ${fieldKey}:`, error);
        setFieldStates(prev => ({
          ...prev,
          [fieldKey]: {
            options: [],
            hasCustomList: false,
            isLoading: false,
            error: 'Erreur de chargement'
          }
        }));
      }
    }
  }, [parsedVariables, clientId]);

  // ==================== EFFECTS ====================
  
  useEffect(() => {
    loadShortcodeCache();
  }, [loadShortcodeCache]);

  useEffect(() => {
    if (cacheLoaded) {
      loadTaxonomies();
    }
  }, [loadTaxonomies, cacheLoaded]);

  useEffect(() => {
    if (Object.keys(selectedTaxonomyData).length > 0) {
      const variables = parseAllTaxonomiesOptimized();
      setParsedVariables(variables);
      loadFieldOptions();
    }
  }, [selectedTaxonomyData, parseAllTaxonomiesOptimized, loadFieldOptions]);

  // ==================== GESTIONNAIRES ====================
  
  const handleFieldChange = useCallback((
    variableName: string, 
    value: string, 
    format: TaxonomyFormat, 
    shortcodeId?: string
  ) => {
    console.log(`🔄 Changement ${variableName}: ${value} (format: ${format})`);
    
    const newValue: TaxonomyVariableValue = {
      value,
      source: 'manual',
      format,
      ...(format === 'open' ? { openValue: value } : {}),
      ...(shortcodeId ? { shortcodeId } : {})
    };
    
    const newTaxonomyValues = {
      ...taxonomyValues,
      [variableName]: newValue
    };
    
    setTaxonomyValues(newTaxonomyValues);
    
    const syntheticEvent = {
      target: {
        name: 'PL_Taxonomy_Values',
        value: newTaxonomyValues
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  }, [taxonomyValues, onChange]);

  const handleFieldHighlight = useCallback((variableName?: string) => {
    setHighlightState({
      activeField: variableName,
      activeVariable: variableName,
      mode: variableName ? 'field' : 'none'
    });
  }, []);

  const togglePreviewExpansion = useCallback((taxonomyType: 'tags' | 'platform' | 'mediaocean') => {
    setExpandedPreviews(prev => ({
      ...prev,
      [taxonomyType]: !prev[taxonomyType]
    }));
  }, []);

  const retryLoadTaxonomies = useCallback(() => {
    loadTaxonomies();
  }, [loadTaxonomies]);

  // ==================== RETURN ====================
  
  return {
    selectedTaxonomyData,
    taxonomiesLoading,
    taxonomiesError,
    parsedVariables,
    fieldStates,
    taxonomyValues,
    highlightState,
    expandedPreviews,
    handleFieldChange,
    handleFieldHighlight,
    togglePreviewExpansion,
    retryLoadTaxonomies,
    hasTaxonomies,
    manualVariables,
    hasLoadingFields,
    getFormattedValue,
    getFormattedPreview
  };
}