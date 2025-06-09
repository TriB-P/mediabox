// app/hooks/useTaxonomyForm.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getClientTaxonomies, getTaxonomyById } from '../lib/taxonomyService';
import { getDynamicList, hasDynamicList } from '../lib/tactiqueListService';
import { useShortcodeFormatter } from './useShortcodeFormatter';
import { Taxonomy } from '../types/taxonomy';
import {
  parseAllTaxonomies,
  extractUniqueVariables,
  createFieldConfig,
  processTaxonomies
} from '../lib/taxonomyParser';
import type {
  PlacementFormData,
  TaxonomyFieldConfig,
  TaxonomyContext,
  HighlightState,
  ParsedTaxonomyVariable,
  TaxonomyValues,
  TaxonomyVariableValue
} from '../types/tactiques';
import type { TaxonomyFormat } from '../config/taxonomyFields';

// ==================== TYPES ====================

interface FieldState {
  config: TaxonomyFieldConfig;
  options: Array<{ id: string; label: string; code?: string }>;
  hasCustomList: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  error?: string;
}

interface UseTaxonomyFormProps {
  formData: PlacementFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  clientId: string;
  campaignData?: any;
  tactiqueData?: any;
}

interface UseTaxonomyFormReturn {
  // États
  selectedTaxonomyData: {
    tags?: Taxonomy;
    platform?: Taxonomy;
    mediaocean?: Taxonomy;
  };
  taxonomiesLoading: boolean;
  taxonomiesError: string | null;
  parsedVariables: ParsedTaxonomyVariable[];
  fieldStates: { [key: string]: FieldState };
  taxonomyValues: TaxonomyValues;
  highlightState: HighlightState;
  expandedPreviews: {
    tags: boolean;
    platform: boolean;
    mediaocean: boolean;
  };
  
  // Actions
  handleFieldChange: (variableName: string, value: string, format: TaxonomyFormat, shortcodeId?: string) => void;
  handleFieldHighlight: (variableName?: string) => void;
  togglePreviewExpansion: (taxonomyType: 'tags' | 'platform' | 'mediaocean') => void;
  retryLoadTaxonomies: () => void;
  
  // Données calculées
  hasTaxonomies: boolean;
  manualVariables: ParsedTaxonomyVariable[];
  hasLoadingFields: boolean;
  
  // 🔥 NOUVEAU : Fonctions de formatage
  getFormattedValue: (variableName: string) => string;
  getFormattedPreview: (taxonomyType: 'tags' | 'platform' | 'mediaocean') => string;
}

// ==================== HOOK PRINCIPAL ====================

export function useTaxonomyForm({
  formData,
  onChange,
  clientId,
  campaignData,
  tactiqueData
}: UseTaxonomyFormProps): UseTaxonomyFormReturn {
  
  // 🔥 NOUVEAU : Hook de formatage des shortcodes
  const { formatValue } = useShortcodeFormatter(clientId);
  
  // ==================== ÉTATS ====================
  
  const [selectedTaxonomyData, setSelectedTaxonomyData] = useState<{
    tags?: Taxonomy;
    platform?: Taxonomy;
    mediaocean?: Taxonomy;
  }>({});
  const [taxonomiesLoading, setTaxonomiesLoading] = useState(false);
  const [taxonomiesError, setTaxonomiesError] = useState<string | null>(null);
  
  const [parsedVariables, setParsedVariables] = useState<ParsedTaxonomyVariable[]>([]);
  const [fieldStates, setFieldStates] = useState<{ [key: string]: FieldState }>({});
  const [taxonomyValues, setTaxonomyValues] = useState<TaxonomyValues>(
    formData.PL_Taxonomy_Values || {}
  );
  
  // 🔥 NOUVEAU : État pour les valeurs formatées en cache
  const [formattedValuesCache, setFormattedValuesCache] = useState<{[variableName: string]: string}>({});
  
  const [highlightState, setHighlightState] = useState<HighlightState>({
    mode: 'none'
  });
  
  const [expandedPreviews, setExpandedPreviews] = useState({
    tags: false,
    platform: false,
    mediaocean: false
  });

  // ==================== FONCTIONS UTILITAIRES ====================
  
  const extractTaxonomyStructure = useCallback((taxonomy: Taxonomy): string => {
    const levels = [
      taxonomy.NA_Name_Level_1,
      taxonomy.NA_Name_Level_2,
      taxonomy.NA_Name_Level_3,
      taxonomy.NA_Name_Level_4
    ].filter(Boolean);
    
    return levels.join('|');
  }, []);

  const getDisplayValueForFormat = useCallback((item: any, format: TaxonomyFormat): string => {
    // 🔥 CORRECTION : TOUJOURS afficher display_fr dans les menus déroulants
    // Le format sera appliqué seulement lors de la génération des chaînes taxonomiques
    return item.SH_Display_Name_FR || item.SH_Code || item.id;
  }, []);

  // ==================== VALEURS CALCULÉES ====================
  
  const selectedTaxonomyIds = useMemo(() => ({
    tags: formData.PL_Taxonomy_Tags || '',
    platform: formData.PL_Taxonomy_Platform || '',
    mediaocean: formData.PL_Taxonomy_MediaOcean || ''
  }), [formData.PL_Taxonomy_Tags, formData.PL_Taxonomy_Platform, formData.PL_Taxonomy_MediaOcean]);

  const hasTaxonomies = useMemo(() => 
    Boolean(selectedTaxonomyIds.tags || selectedTaxonomyIds.platform || selectedTaxonomyIds.mediaocean)
  , [selectedTaxonomyIds]);

  const taxonomyStructures = useMemo(() => ({
    tags: selectedTaxonomyData.tags ? extractTaxonomyStructure(selectedTaxonomyData.tags) : '',
    platform: selectedTaxonomyData.platform ? extractTaxonomyStructure(selectedTaxonomyData.platform) : '',
    mediaocean: selectedTaxonomyData.mediaocean ? extractTaxonomyStructure(selectedTaxonomyData.mediaocean) : ''
  }), [selectedTaxonomyData, extractTaxonomyStructure]);

  const manualVariables = useMemo(() => 
    parsedVariables.filter(variable => variable.source === 'manual')
  , [parsedVariables]);

  const hasLoadingFields = useMemo(() =>
    Object.values(fieldStates).some(fs => fs.isLoading)
  , [fieldStates]);

  // ==================== EFFECTS ====================
  
  // Charger les taxonomies quand les IDs changent
  useEffect(() => {
    if (hasTaxonomies) {
      loadSelectedTaxonomies();
    } else {
      setSelectedTaxonomyData({});
      setParsedVariables([]);
    }
  }, [selectedTaxonomyIds.tags, selectedTaxonomyIds.platform, selectedTaxonomyIds.mediaocean, hasTaxonomies, clientId]);

  // Parser les structures quand elles sont chargées
  useEffect(() => {
    if (Object.keys(selectedTaxonomyData).length > 0) {
      parseTaxonomyStructures();
    }
  }, [selectedTaxonomyData]);

  // Charger toutes les listes manuelles en une fois
  useEffect(() => {
    if (manualVariables.length > 0) {
      loadAllManualFieldOptions();
    }
  }, [manualVariables, clientId]);

  // 🔥 NOUVEAU : Effet pour mettre à jour le cache des valeurs formatées
  useEffect(() => {
    if (parsedVariables.length === 0) return;
    
    console.log('🔄 Mise à jour du cache des valeurs formatées');
    
    const updateFormattedCache = async () => {
      const newCache: {[variableName: string]: string} = {};
      
      for (const variable of parsedVariables) {
        const variableName = variable.variable;
        const taxonomyValue = taxonomyValues[variableName];
        
        if (!taxonomyValue) {
          // Valeur héritée : chercher dans campaign/tactique
          let rawValue: any = null;
          
          if (variable.source === 'campaign' && campaignData?.[variableName]) {
            rawValue = campaignData[variableName];
          } else if (variable.source === 'tactique' && tactiqueData?.[variableName]) {
            rawValue = tactiqueData[variableName];
          }
          
          if (rawValue) {
            const rawValueStr = String(rawValue);
            
            // Si c'est potentiellement un ID de shortcode, utiliser le formatter
            if (variable.format !== 'open' && rawValueStr.length > 5 && !rawValueStr.includes(' ')) {
              const formatResult = formatValue(rawValueStr, variable.format);
              if (formatResult.value && !formatResult.loading) {
                newCache[variableName] = formatResult.value;
              } else if (!formatResult.loading && formatResult.error) {
                newCache[variableName] = rawValueStr; // Fallback sur la valeur brute
              } else {
                newCache[variableName] = `⏳ ${variableName}`; // En cours de chargement
              }
            } else {
              newCache[variableName] = rawValueStr;
            }
          } else {
            newCache[variableName] = '';
          }
        } else {
          // Valeur manuelle
          if (taxonomyValue.format === 'open' && taxonomyValue.openValue) {
            newCache[variableName] = taxonomyValue.openValue;
          } else if (taxonomyValue.shortcodeId) {
            const formatResult = formatValue(taxonomyValue.shortcodeId, taxonomyValue.format);
            if (formatResult.value && !formatResult.loading) {
              newCache[variableName] = formatResult.value;
            } else if (!formatResult.loading && formatResult.error) {
              newCache[variableName] = taxonomyValue.value || `[${variableName}:${variable.format}]`;
            } else {
              newCache[variableName] = `⏳ ${variableName}`;
            }
          } else {
            newCache[variableName] = taxonomyValue.value || `[${variableName}:${variable.format}]`;
          }
        }
      }
      
      setFormattedValuesCache(newCache);
    };
    
    updateFormattedCache();
    
    // Répéter toutes les 500ms pour capturer les chargements asynchrones
    const interval = setInterval(updateFormattedCache, 500);
    
    return () => clearInterval(interval);
  }, [parsedVariables, taxonomyValues, campaignData, tactiqueData, formatValue]);

  // ==================== FONCTIONS DE CHARGEMENT ====================
  
  const loadSelectedTaxonomies = async () => {
    console.log('📋 Chargement des taxonomies sélectionnées');
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
      console.log('✅ Taxonomies chargées:', Object.keys(newTaxonomyData));
      
    } catch (error) {
      console.error('Erreur lors du chargement des taxonomies:', error);
      setTaxonomiesError('Erreur lors du chargement des taxonomies');
    } finally {
      setTaxonomiesLoading(false);
    }
  };
  
  const parseTaxonomyStructures = () => {
    console.log('🔍 Parsing des structures de taxonomie');
    
    try {
      const structures = parseAllTaxonomies(
        taxonomyStructures.tags,
        taxonomyStructures.platform,
        taxonomyStructures.mediaocean
      );
      
      const uniqueVariables = extractUniqueVariables(structures);
      setParsedVariables(uniqueVariables);
      
      console.log(`✅ ${uniqueVariables.length} variables uniques identifiées`);
    } catch (error) {
      console.error('Erreur lors du parsing des taxonomies:', error);
      setParsedVariables([]);
    }
  };

  // Chargement simultané de toutes les listes manuelles
  const loadAllManualFieldOptions = async () => {
    console.log('📦 Chargement simultané de toutes les listes manuelles');
    
    const initialFieldStates: { [key: string]: FieldState } = {};
    const loadPromises: Promise<void>[] = [];
    
    for (const variable of manualVariables) {
      const fieldKey = `${variable.variable}_${variable.format}`;
      
      initialFieldStates[fieldKey] = {
        config: createFieldConfig(variable as any, '', false),
        options: [],
        hasCustomList: false,
        isLoading: true,
        isLoaded: false,
        error: undefined
      };

      const loadPromise = loadSingleFieldOptions(fieldKey, variable);
      loadPromises.push(loadPromise);
    }
    
    setFieldStates(initialFieldStates);
    
    try {
      await Promise.allSettled(loadPromises);
      console.log('✅ Chargement de toutes les listes terminé');
    } catch (error) {
      console.error('Erreur lors du chargement des listes:', error);
    }
  };

  const loadSingleFieldOptions = async (fieldKey: string, variable: ParsedTaxonomyVariable): Promise<void> => {
    try {
      const hasCustom = await hasDynamicList(variable.variable, clientId);
      
      let options: Array<{ id: string; label: string; code?: string }> = [];
      
      if (hasCustom) {
        const dynamicList = await getDynamicList(variable.variable, clientId);
        options = dynamicList.map(item => ({
          id: item.id,
          label: getDisplayValueForFormat(item, variable.format),
          code: item.SH_Code
        }));
      }
      
      setFieldStates(prev => ({
        ...prev,
        [fieldKey]: {
          ...prev[fieldKey],
          options,
          hasCustomList: hasCustom,
          isLoading: false,
          isLoaded: true,
          error: undefined
        }
      }));
      
    } catch (error) {
      console.error(`Erreur chargement ${fieldKey}:`, error);
      setFieldStates(prev => ({
        ...prev,
        [fieldKey]: {
          ...prev[fieldKey],
          isLoading: false,
          isLoaded: false,
          error: 'Erreur de chargement'
        }
      }));
    }
  };

  // ==================== NOUVELLES FONCTIONS DE FORMATAGE ====================
  
  /**
   * 🔥 NOUVEAU : Obtient la valeur formatée pour une variable donnée (depuis le cache)
   */
  const getFormattedValue = useCallback((variableName: string): string => {
    return formattedValuesCache[variableName] || '';
  }, [formattedValuesCache]);

  /**
   * 🔥 NOUVEAU : Génère l'aperçu formaté pour un type de taxonomie (depuis le cache)
   */
  const getFormattedPreview = useCallback((taxonomyType: 'tags' | 'platform' | 'mediaocean'): string => {
    const structure = taxonomyStructures[taxonomyType];
    if (!structure) return '';
    
    // Remplacer chaque variable par sa valeur formatée depuis le cache
    const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
    
    return structure.replace(VARIABLE_REGEX, (match, variableName, format) => {
      const formattedValue = formattedValuesCache[variableName];
      
      if (formattedValue && formattedValue.trim() && !formattedValue.startsWith('⏳') && !formattedValue.startsWith('[')) {
        return formattedValue;
      }
      
      // Si pas de valeur ou en cours de chargement, retourner le placeholder
      return match;
    });
  }, [taxonomyStructures, formattedValuesCache]);

  // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================
  
  /**
   * 🔥 NOUVEAU : Gestionnaire de changement de champ avec support shortcode/open
   */
  const handleFieldChange = useCallback((
    variableName: string, 
    value: string, 
    format: TaxonomyFormat, 
    shortcodeId?: string
  ) => {
    console.log(`🔄 Changement field ${variableName}: ${value} (format: ${format}, shortcodeId: ${shortcodeId})`);
    
    let newValue: TaxonomyVariableValue;
    
    if (format === 'open') {
      // Format open : stocker la valeur saisie
      newValue = {
        value,
        source: 'manual',
        format,
        openValue: value
      };
    } else if (shortcodeId) {
      // Format shortcode : stocker l'ID du shortcode
      newValue = {
        value, // Valeur d'affichage temporaire
        source: 'manual',
        format,
        shortcodeId
      };
    } else {
      // Autre format : stocker directement la valeur
      newValue = {
        value,
        source: 'manual',
        format
      };
    }
    
    const newTaxonomyValues = {
      ...taxonomyValues,
      [variableName]: newValue
    };
    
    setTaxonomyValues(newTaxonomyValues);
    
    // Déclencher le changement pour le parent
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
    loadSelectedTaxonomies();
  }, [selectedTaxonomyIds, clientId]);

  // ==================== RETURN ====================
  
  return {
    // États
    selectedTaxonomyData,
    taxonomiesLoading,
    taxonomiesError,
    parsedVariables,
    fieldStates,
    taxonomyValues,
    highlightState,
    expandedPreviews,
    
    // Actions
    handleFieldChange,
    handleFieldHighlight,
    togglePreviewExpansion,
    retryLoadTaxonomies,
    
    // Données calculées
    hasTaxonomies,
    manualVariables,
    hasLoadingFields,
    
    // 🔥 NOUVELLES FONCTIONS DE FORMATAGE
    getFormattedValue,
    getFormattedPreview
  };
}