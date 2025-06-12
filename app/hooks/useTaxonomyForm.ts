// app/hooks/useTaxonomyForm.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getClientTaxonomies, getTaxonomyById } from '../lib/taxonomyService';
import { getDynamicList, hasDynamicList } from '../lib/tactiqueListService';
import { Taxonomy } from '../types/taxonomy';
import {
  createFieldConfig,
  extractUniqueVariables,
  parseAllTaxonomies
} from '../lib/taxonomyParser';
import type {
  PlacementFormData,
  TaxonomyFieldConfig,
  TaxonomyContext,
  HighlightState,
  ParsedTaxonomyVariable,
  TaxonomyValues
} from '../types/tactiques';

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
  handleFieldChange: (variableName: string, value: string, format: string) => void;
  handleFieldHighlight: (variableName?: string) => void;
  togglePreviewExpansion: (taxonomyType: 'tags' | 'platform' | 'mediaocean') => void;
  retryLoadTaxonomies: () => void;
  
  // Données calculées
  hasTaxonomies: boolean;
  manualVariables: ParsedTaxonomyVariable[];
  hasLoadingFields: boolean;
}

// ==================== HOOK PRINCIPAL ====================

export function useTaxonomyForm({
  formData,
  onChange,
  clientId,
  campaignData,
  tactiqueData
}: UseTaxonomyFormProps): UseTaxonomyFormReturn {
  
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

  const getDisplayValueForFormat = useCallback((item: any, format: string): string => {
    switch (format) {
      case 'code':
        return item.SH_Code || item.id;
      case 'display_fr':
        return item.SH_Display_Name_FR || item.SH_Code || item.id;
      case 'display_en':
        return item.SH_Display_Name_EN || item.SH_Display_Name_FR || item.SH_Code || item.id;
      case 'utm':
        return item.SH_Default_UTM || item.SH_Code || item.id;
      case 'custom':
        return item.customCode || item.SH_Code || item.id;
      default:
        return item.SH_Display_Name_FR || item.SH_Code || item.id;
    }
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

  // NOUVEAU : Charger toutes les listes manuelles en une fois
  useEffect(() => {
    if (manualVariables.length > 0) {
      loadAllManualFieldOptions();
    }
  }, [manualVariables, clientId]);

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

  // NOUVEAU : Chargement simultané de toutes les listes manuelles
  const loadAllManualFieldOptions = async () => {
    console.log('📦 Chargement simultané de toutes les listes manuelles');
    
    // Initialiser tous les états avec isLoading: true pour les champs manuels
    const initialFieldStates: { [key: string]: FieldState } = {};
    const loadPromises: Promise<void>[] = [];
    
    for (const variable of manualVariables) {
      const fieldKey = `${variable.variable}_${variable.format}`;
      
      initialFieldStates[fieldKey] = {
        config: createFieldConfig(variable, '', false),
        options: [],
        hasCustomList: false,
        isLoading: true,
        isLoaded: false,
        error: undefined
      };

      // Créer une promesse pour charger ce champ
      const loadPromise = loadSingleFieldOptions(fieldKey, variable);
      loadPromises.push(loadPromise);
    }
    
    // Mettre à jour l'état initial
    setFieldStates(initialFieldStates);
    
    // Attendre que tous les chargements se terminent
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
      
      // Mettre à jour ce champ spécifiquement
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

  // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================
  
  const handleFieldChange = useCallback((variableName: string, value: string, format: string) => {
    console.log(`🔄 Changement field ${variableName}: ${value}`);
    
    const newTaxonomyValues = {
      ...taxonomyValues,
      [variableName]: {
        value,
        source: 'manual' as const,
        format: format as any
      }
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
    hasLoadingFields
  };
}