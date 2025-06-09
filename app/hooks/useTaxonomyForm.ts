// app/hooks/useTaxonomyForm.ts - VERSION FINALE SANS BOUCLES

import { useState, useEffect, useCallback } from 'react';
import { getTaxonomyById } from '../lib/taxonomyService';
import { getDynamicList, hasDynamicList } from '../lib/tactiqueListService';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Taxonomy } from '../types/taxonomy';
import { TAXONOMY_FIELD_SOURCES } from '../config/taxonomyFields'; // 🔥 IMPORT DIRECT
import type {
  PlacementFormData,
  HighlightState,
  ParsedTaxonomyVariable,
  TaxonomyValues,
  TaxonomyVariableValue
} from '../types/tactiques';
import type { TaxonomyFormat } from '../config/taxonomyFields';

// ==================== TYPES ====================

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

// ==================== HOOK PRINCIPAL ====================

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
  const [parsedVariables, setParsedVariables] = useState<ParsedTaxonomyVariable[]>([]);
  const [fieldStates, setFieldStates] = useState<{ [key: string]: FieldState }>({});
  const [taxonomyValues, setTaxonomyValues] = useState<TaxonomyValues>(
    formData.PL_Taxonomy_Values || {}
  );
  
  // Cache pour les shortcodes - CHARGÉ UNE SEULE FOIS
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
  
  const selectedTaxonomyIds = {
    tags: formData.PL_Taxonomy_Tags || '',
    platform: formData.PL_Taxonomy_Platform || '',
    mediaocean: formData.PL_Taxonomy_MediaOcean || ''
  };

  const hasTaxonomies = Boolean(
    selectedTaxonomyIds.tags || 
    selectedTaxonomyIds.platform || 
    selectedTaxonomyIds.mediaocean
  );

  const manualVariables = parsedVariables.filter(variable => variable.source === 'manual');
  const hasLoadingFields = Object.values(fieldStates).some(fs => fs.isLoading);

  // ==================== CHARGEMENT INITIAL DU CACHE ====================
  
  const loadShortcodeCache = useCallback(async () => {
    if (cacheLoaded) return;
    
    console.log('🔄 Chargement initial du cache shortcodes');
    
    try {
      // Charger les custom codes du client
      const customCodesRef = collection(db, 'clients', clientId, 'customCodes');
      const customSnapshot = await getDocs(customCodesRef);
      
      const customCodes: CustomCode[] = customSnapshot.docs.map(doc => ({
        CC_Shortcode_ID: doc.data().CC_Shortcode_ID,
        CC_Custom_UTM: doc.data().CC_Custom_UTM,
        CC_Custom_Code: doc.data().CC_Custom_Code,
      }));
      
      setCustomCodesCache(customCodes);
      setCacheLoaded(true);
      
      console.log('✅ Cache shortcodes chargé');
      
    } catch (error) {
      console.error('Erreur chargement cache:', error);
      setCacheLoaded(true); // Marquer comme chargé même en cas d'erreur
    }
  }, [clientId, cacheLoaded]);

  // Charger un shortcode spécifique si pas en cache
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
      
      // Ajouter au cache
      setShortcodeCache(prev => new Map(prev).set(shortcodeId, shortcodeData));
      return shortcodeData;
      
    } catch (error) {
      console.error(`Erreur chargement shortcode ${shortcodeId}:`, error);
      return null;
    }
  }, [shortcodeCache]);

  // ==================== FORMATAGE SYNCHRONE ====================
  
  const formatShortcode = useCallback((shortcodeId: string, format: TaxonomyFormat): string => {
    // 1. Vérifier le cache synchrone
    const shortcodeData = shortcodeCache.get(shortcodeId);
    if (!shortcodeData) {
      // Si pas en cache, charger de manière asynchrone (sans bloquer)
      loadShortcode(shortcodeId);
      return shortcodeId; // Retourner l'ID en attendant
    }
    
    // 2. Appliquer le format
    switch (format) {
      case 'code':
        return shortcodeData.SH_Code;
      case 'display_fr':
        return shortcodeData.SH_Display_Name_FR;
      case 'display_en':
        return shortcodeData.SH_Display_Name_EN || shortcodeData.SH_Display_Name_FR;
      case 'utm':
        return shortcodeData.SH_Default_UTM || shortcodeData.SH_Code;
      case 'custom_utm':
        const customForUTM = customCodesCache.find(cc => cc.CC_Shortcode_ID === shortcodeId);
        return customForUTM?.CC_Custom_UTM || shortcodeData.SH_Default_UTM || shortcodeData.SH_Code;
      case 'custom_code':
        const customForCode = customCodesCache.find(cc => cc.CC_Shortcode_ID === shortcodeId);
        return customForCode?.CC_Custom_Code || shortcodeData.SH_Code;
      default:
        return shortcodeData.SH_Display_Name_FR;
    }
  }, [shortcodeCache, customCodesCache, loadShortcode]);

  // ==================== PARSING DES VARIABLES ====================
  
  function parseVariablesFromStructure(structure: string): ParsedTaxonomyVariable[] {
    if (!structure) return [];
    
    const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
    const variables: ParsedTaxonomyVariable[] = [];
    let match;
    
    while ((match = VARIABLE_REGEX.exec(structure)) !== null) {
      const [, variableName, format] = match;
      
      // 🔥 CORRECTION : Utiliser la configuration importée
      let source: 'campaign' | 'tactique' | 'manual' = 'manual';
      
      if (TAXONOMY_FIELD_SOURCES.campaign.includes(variableName)) {
        source = 'campaign';
      } else if (TAXONOMY_FIELD_SOURCES.tactique.includes(variableName)) {
        source = 'tactique';
      } else {
        source = 'manual';
      }
      
      variables.push({
        variable: variableName,
        format: format as TaxonomyFormat,
        source,
        level: 1,
        isValid: true
      });
    }
    
    return variables;
  }

  function getAllVariables(): ParsedTaxonomyVariable[] {
    const allVariables: ParsedTaxonomyVariable[] = [];
    
    if (selectedTaxonomyData.tags) {
      const structure = extractTaxonomyStructure(selectedTaxonomyData.tags);
      allVariables.push(...parseVariablesFromStructure(structure));
    }
    
    if (selectedTaxonomyData.platform) {
      const structure = extractTaxonomyStructure(selectedTaxonomyData.platform);
      allVariables.push(...parseVariablesFromStructure(structure));
    }
    
    if (selectedTaxonomyData.mediaocean) {
      const structure = extractTaxonomyStructure(selectedTaxonomyData.mediaocean);
      allVariables.push(...parseVariablesFromStructure(structure));
    }
    
    // Éliminer les doublons
    const uniqueVariables = new Map<string, ParsedTaxonomyVariable>();
    allVariables.forEach(variable => {
      const key = `${variable.variable}:${variable.format}`;
      if (!uniqueVariables.has(key)) {
        uniqueVariables.set(key, variable);
      }
    });
    
    return Array.from(uniqueVariables.values());
  }

  function extractTaxonomyStructure(taxonomy: Taxonomy): string {
    const levels = [
      taxonomy.NA_Name_Level_1,
      taxonomy.NA_Name_Level_2,
      taxonomy.NA_Name_Level_3,
      taxonomy.NA_Name_Level_4
    ].filter(Boolean);
    
    return levels.join('|');
  }

  // ==================== RÉSOLUTION DES VALEURS (SYNCHRONE) ====================
  
  const resolveVariableValue = useCallback((variable: ParsedTaxonomyVariable): string => {
    const { variable: varName, format, source } = variable;
    
    // 1. Vérifier s'il y a une valeur manuelle
    const manualValue = taxonomyValues[varName];
    if (manualValue) {
      if (format === 'open' && manualValue.openValue) {
        return manualValue.openValue;
      } else if (manualValue.shortcodeId) {
        return formatShortcode(manualValue.shortcodeId, format);
      } else {
        return manualValue.value || '';
      }
    }
    
    // 2. Utiliser les valeurs héritées
    let rawValue: any = null;
    if (source === 'campaign' && campaignData?.[varName]) {
      rawValue = campaignData[varName];
    } else if (source === 'tactique' && tactiqueData?.[varName]) {
      rawValue = tactiqueData[varName];
    }
    
    if (rawValue) {
      const rawValueStr = String(rawValue);
      
      // 🔥 CORRECTION : Si c'est un ID de shortcode (long et sans espaces), le formater
      if (format !== 'open' && rawValueStr.length > 5 && !rawValueStr.includes(' ')) {
        const formattedValue = formatShortcode(rawValueStr, format);
        // Si le formatage a réussi (pas juste l'ID retourné), utiliser la valeur formatée
        if (formattedValue && formattedValue !== rawValueStr) {
          return formattedValue;
        }
      }
      
      // 🔥 NOUVEAU : Pour les valeurs héritées, toujours retourner la valeur brute si formatage échoue
      return rawValueStr;
    }
    
    // 3. 🔥 CORRECTION : Pour les champs manuels sans valeur, retourner une chaîne vide au lieu d'un placeholder
    if (source === 'manual') {
      return ''; // Chaîne vide pour ne pas affecter l'aperçu
    }
    
    // 4. Retourner un placeholder seulement pour debug
    return `[${varName}:${format}]`;
  }, [taxonomyValues, campaignData, tactiqueData, formatShortcode]);

  // ==================== FONCTIONS DE FORMATAGE (SYNCHRONES) ====================
  
  const getFormattedValue = useCallback((variableName: string): string => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    if (!variable) return '';
    
    return resolveVariableValue(variable);
  }, [parsedVariables, resolveVariableValue]);

  const getFormattedPreview = useCallback((taxonomyType: 'tags' | 'platform' | 'mediaocean'): string => {
    const taxonomy = selectedTaxonomyData[taxonomyType];
    if (!taxonomy) return '';
    
    const structure = extractTaxonomyStructure(taxonomy);
    if (!structure) return '';
    
    const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
    
    return structure.replace(VARIABLE_REGEX, (match, variableName, format) => {
      const variable = parsedVariables.find(v => 
        v.variable === variableName && v.format === format
      );
      
      if (variable) {
        const resolvedValue = resolveVariableValue(variable);
        if (resolvedValue && !resolvedValue.startsWith('[')) {
          return resolvedValue;
        }
      }
      
      return match;
    });
  }, [selectedTaxonomyData, parsedVariables, resolveVariableValue]);

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
  }, [clientId, selectedTaxonomyIds.tags, selectedTaxonomyIds.platform, selectedTaxonomyIds.mediaocean, hasTaxonomies]);

  const loadFieldOptions = useCallback(async () => {
    const variables = getAllVariables();
    const manualVars = variables.filter(v => v.source === 'manual');
    
    if (manualVars.length === 0) return;
    
    console.log('📦 Chargement des listes pour', manualVars.length, 'variables');
    
    for (const variable of manualVars) {
      const fieldKey = `${variable.variable}_${variable.format}`;
      
      setFieldStates(prev => ({
        ...prev,
        [fieldKey]: {
          options: [],
          hasCustomList: false,
          isLoading: true
        }
      }));
      
      try {
        const hasCustom = await hasDynamicList(variable.variable, clientId);
        
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
  }, [selectedTaxonomyData, clientId]);

  // ==================== EFFECTS ====================
  
  // Charger le cache au début
  useEffect(() => {
    loadShortcodeCache();
  }, [loadShortcodeCache]);

  // Charger les taxonomies quand les IDs changent
  useEffect(() => {
    if (cacheLoaded) {
      loadTaxonomies();
    }
  }, [loadTaxonomies, cacheLoaded]);

  // Parser les variables quand les taxonomies sont prêtes
  useEffect(() => {
    if (Object.keys(selectedTaxonomyData).length > 0) {
      const variables = getAllVariables();
      setParsedVariables(variables);
      loadFieldOptions();
    }
  }, [selectedTaxonomyData, loadFieldOptions]);

  // ==================== GESTIONNAIRES ====================
  
  const handleFieldChange = useCallback((
    variableName: string, 
    value: string, 
    format: TaxonomyFormat, 
    shortcodeId?: string
  ) => {
    console.log(`🔄 Changement ${variableName}: ${value}`);
    
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