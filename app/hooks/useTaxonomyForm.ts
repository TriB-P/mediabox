// app/hooks/useTaxonomyForm.ts

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTaxonomyById } from '../lib/taxonomyService';
import { getDynamicList, hasDynamicList } from '../lib/tactiqueListService';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Taxonomy } from '../types/taxonomy';
import { 
  parseAllTaxonomies, 
  extractUniqueVariables 
} from '../lib/taxonomyParser';
// 🔥 CORRECTION: Import des nouvelles fonctions utilitaires
import { TAXONOMY_VARIABLE_REGEX, formatRequiresShortcode, isManualVariable } from '../config/taxonomyFields';
import type {
  PlacementFormData,
  HighlightState,
  TaxonomyValues,
  TaxonomyVariableValue,
  ParsedTaxonomyVariable,
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
  shortcodeId: string;
  customCode: string;
}

interface UseTaxonomyFormProps {
  formData: PlacementFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
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
  
  const [previewUpdateTime, setPreviewUpdateTime] = useState(Date.now());
  const [shortcodeCache, setShortcodeCache] = useState<Map<string, ShortcodeData>>(new Map());
  const [customCodesCache, setCustomCodesCache] = useState<CustomCode[]>([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [highlightState, setHighlightState] = useState<HighlightState>({ mode: 'none' });
  const [expandedPreviews, setExpandedPreviews] = useState({ tags: false, platform: false, mediaocean: false });

  const selectedTaxonomyIds = {
    tags: formData.PL_Taxonomy_Tags || '',
    platform: formData.PL_Taxonomy_Platform || '',
    mediaocean: formData.PL_Taxonomy_MediaOcean || ''
  };

  const hasTaxonomies = Boolean(selectedTaxonomyIds.tags || selectedTaxonomyIds.platform || selectedTaxonomyIds.mediaocean);
  
  // 🔥 CORRECTION: Utilise la fonction isManualVariable pour identifier les champs de placement.
  const manualVariables = useMemo(() => 
    parsedVariables.filter(variable => isManualVariable(variable.variable)), 
    [parsedVariables]
  );
  
  const hasLoadingFields = Object.values(fieldStates).some(fs => fs.isLoading);

  const loadShortcodeCache = useCallback(async () => {
    if (cacheLoaded || !clientId) return;
    try {
      const customCodesRef = collection(db, 'clients', clientId, 'customCodes');
      const customSnapshot = await getDocs(customCodesRef);
      const customCodes: CustomCode[] = customSnapshot.docs.map(doc => ({ shortcodeId: doc.data().shortcodeId, customCode: doc.data().customCode } as CustomCode));
      setCustomCodesCache(customCodes);
      setCacheLoaded(true);
    } catch (error) { console.error('Erreur chargement cache:', error); setCacheLoaded(true); }
  }, [clientId, cacheLoaded]);

  const loadShortcode = useCallback(async (shortcodeId: string): Promise<ShortcodeData | null> => {
    if (shortcodeCache.has(shortcodeId)) return shortcodeCache.get(shortcodeId)!;
    try {
      const shortcodeRef = doc(db, 'shortcodes', shortcodeId);
      const shortcodeSnap = await getDoc(shortcodeRef);
      if (!shortcodeSnap.exists()) return null;
      const data = shortcodeSnap.data();
      const shortcodeData: ShortcodeData = { id: shortcodeSnap.id, SH_Code: data.SH_Code || shortcodeSnap.id, SH_Display_Name_FR: data.SH_Display_Name_FR || data.SH_Code || shortcodeSnap.id, SH_Display_Name_EN: data.SH_Display_Name_EN, SH_Default_UTM: data.SH_Default_UTM };
      setShortcodeCache(prev => new Map(prev).set(shortcodeId, shortcodeData));
      return shortcodeData;
    } catch (error) { console.error(`Erreur chargement shortcode ${shortcodeId}:`, error); return null; }
  }, [shortcodeCache]);

  const formatShortcode = useCallback((shortcodeId: string, format: TaxonomyFormat): string => {
    const shortcodeData = shortcodeCache.get(shortcodeId);
    if (!shortcodeData) { loadShortcode(shortcodeId); return shortcodeId; }
    
    const customCodeMatch = customCodesCache.find(cc => cc.shortcodeId === shortcodeId);
    
    switch (format) {
      case 'code': return shortcodeData.SH_Code;
      case 'display_fr': return shortcodeData.SH_Display_Name_FR;
      case 'display_en': return shortcodeData.SH_Display_Name_EN || shortcodeData.SH_Display_Name_FR;
      case 'utm': return shortcodeData.SH_Default_UTM || shortcodeData.SH_Code;
      case 'custom_utm':
        return customCodeMatch?.customCode || shortcodeData.SH_Default_UTM || shortcodeData.SH_Code;
      case 'custom_code':
        return customCodeMatch?.customCode || shortcodeData.SH_Code;
      default: return shortcodeData.SH_Display_Name_FR;
    }
  }, [shortcodeCache, customCodesCache, loadShortcode]);
  
  const loadAndParseTaxonomies = useCallback(async () => {
    if (!hasTaxonomies) {
      setSelectedTaxonomyData({});
      setParsedVariables([]);
      return;
    }
    
    setTaxonomiesLoading(true);
    setTaxonomiesError(null);
    
    try {
      const dataPromises = {
        tags: selectedTaxonomyIds.tags ? getTaxonomyById(clientId, selectedTaxonomyIds.tags) : Promise.resolve(null),
        platform: selectedTaxonomyIds.platform ? getTaxonomyById(clientId, selectedTaxonomyIds.platform) : Promise.resolve(null),
        mediaocean: selectedTaxonomyIds.mediaocean ? getTaxonomyById(clientId, selectedTaxonomyIds.mediaocean) : Promise.resolve(null),
      };

      const results = await Promise.all(Object.values(dataPromises));
      const newTaxonomyData = {
        tags: results[0] || undefined,
        platform: results[1] || undefined,
        mediaocean: results[2] || undefined,
      };
      
      setSelectedTaxonomyData(newTaxonomyData);

      const extractFullStructure = (taxonomy?: Taxonomy) => {
        if (!taxonomy) return '';
        return [taxonomy.NA_Name_Level_1, taxonomy.NA_Name_Level_2, taxonomy.NA_Name_Level_3, taxonomy.NA_Name_Level_4].filter(Boolean).join('|');
      };
      
      const structures = parseAllTaxonomies(
        extractFullStructure(newTaxonomyData.tags),
        extractFullStructure(newTaxonomyData.platform),
        extractFullStructure(newTaxonomyData.mediaocean)
      );
      const variables = extractUniqueVariables(structures);
      setParsedVariables(variables);
      
    } catch (error) {
      setTaxonomiesError('Erreur lors du chargement des taxonomies.');
    } finally {
      setTaxonomiesLoading(false);
    }
  }, [clientId, hasTaxonomies, selectedTaxonomyIds.tags, selectedTaxonomyIds.platform, selectedTaxonomyIds.mediaocean]);

  const loadFieldOptions = useCallback(async () => {
    if (manualVariables.length === 0) return;

    for (const variable of manualVariables) {
      const fieldKey = variable.variable;
      setFieldStates(prev => ({ ...prev, [fieldKey]: { options: [], hasCustomList: false, isLoading: true } }));
      try {
        const hasCustom = await hasDynamicList(variable.variable, clientId);
        let options: Array<{ id: string; label: string; code?: string }> = [];
        if (hasCustom) {
          const dynamicList = await getDynamicList(variable.variable, clientId);
          options = dynamicList.map(item => ({ id: item.id, label: item.SH_Display_Name_FR || item.SH_Code || item.id, code: item.SH_Code }));
        }
        setFieldStates(prev => ({ ...prev, [fieldKey]: { options, hasCustomList: hasCustom, isLoading: false } }));
      } catch (error) {
        setFieldStates(prev => ({ ...prev, [fieldKey]: { options: [], hasCustomList: false, isLoading: false, error: 'Erreur' } }));
      }
    }
  }, [clientId, manualVariables]);
  
  useEffect(() => { loadShortcodeCache(); }, [loadShortcodeCache]);
  useEffect(() => { if (cacheLoaded) loadAndParseTaxonomies(); }, [loadAndParseTaxonomies, cacheLoaded]);
  useEffect(() => { if (parsedVariables.length > 0) loadFieldOptions(); }, [parsedVariables, loadFieldOptions]);
  useEffect(() => { setPreviewUpdateTime(Date.now()); }, [shortcodeCache.size, customCodesCache.length]);

  // 🔥 CORRECTION : handleFieldChange met à jour formData ET taxonomyValues
  const handleFieldChange = useCallback((variableName: string, value: string, format: TaxonomyFormat, shortcodeId?: string) => {
    // 1. Mettre à jour l'objet taxonomyValues pour l'aperçu et la logique interne
    const newTaxonomyValue: TaxonomyVariableValue = {
      value, source: 'manual', format,
      ...(format === 'open' ? { openValue: value } : {}),
      ...(shortcodeId ? { shortcodeId } : {})
    };
    
    const newTaxonomyValues = { ...taxonomyValues, [variableName]: newTaxonomyValue };
    setTaxonomyValues(newTaxonomyValues);
    
    // 2. Créer un événement synthétique pour mettre à jour PL_Taxonomy_Values dans formData
    const taxonomyValuesEvent = {
      target: { name: 'PL_Taxonomy_Values', value: newTaxonomyValues }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onChange(taxonomyValuesEvent);

    // 3. 🔥 NOUVEAU : Mettre aussi à jour directement le champ de placement dans formData
    if (isManualVariable(variableName)) {
        const fieldChangeEvent = {
            target: { name: variableName, value }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(fieldChangeEvent);
    }

    setPreviewUpdateTime(Date.now());
  }, [taxonomyValues, onChange]);

  const handleFieldHighlight = useCallback((variableName?: string) => {
    setHighlightState({ activeField: variableName, activeVariable: variableName, mode: variableName ? 'field' : 'none' });
  }, []);

  const togglePreviewExpansion = useCallback((taxonomyType: 'tags' | 'platform' | 'mediaocean') => {
    setExpandedPreviews(prev => ({ ...prev, [taxonomyType]: !prev[taxonomyType] }));
  }, []);

  const retryLoadTaxonomies = useCallback(() => { loadAndParseTaxonomies(); }, [loadAndParseTaxonomies]);

  const resolveVariableValue = useCallback((variable: ParsedTaxonomyVariable, format: TaxonomyFormat): string => {
    const manualValue = taxonomyValues[variable.variable];
    if (manualValue) {
      if (manualValue.format === 'open') return manualValue.openValue || '';
      if (manualValue.shortcodeId) return formatShortcode(manualValue.shortcodeId, format);
      return manualValue.value || '';
    }
    
    let rawValue: any = null;
    // 🔥 SUPPRESSION DE campaignMap
    
    const tactiqueMap: { [key: string]: keyof typeof tactiqueData } = { 'TC_Publisher': 'TC_Publisher', 'TC_Media_Type': 'TC_Media_Type' };
    
    if (variable.source === 'campaign' && campaignData) {
      // ✅ CORRECTION: Accès direct à la propriété
      rawValue = (campaignData as any)[variable.variable];
    }
    if (variable.source === 'tactique' && tactiqueData) {
      const field = tactiqueMap[variable.variable] || variable.variable;
      rawValue = tactiqueData[field];
    }
    
    if (rawValue) {
      const rawValueStr = String(rawValue);
      if (formatRequiresShortcode(format)) {
        return formatShortcode(rawValueStr, format);
      }
      return rawValueStr;
    }
    
    return `[${variable.variable}]`;
  }, [taxonomyValues, campaignData, tactiqueData, formatShortcode]);

  const getFormattedValue = useCallback((variableName: string, format: string): string => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    if (!variable) return '';
    return resolveVariableValue(variable, format as TaxonomyFormat);
  }, [parsedVariables, resolveVariableValue]);
  
  const getFormattedPreview = useCallback((taxonomyType: 'tags' | 'platform' | 'mediaocean'): string => {
    const taxonomy = selectedTaxonomyData[taxonomyType];
    if (!taxonomy) return '';
    const structure = [taxonomy.NA_Name_Level_1, taxonomy.NA_Name_Level_2, taxonomy.NA_Name_Level_3, taxonomy.NA_Name_Level_4].filter(Boolean).join('|');
    
    TAXONOMY_VARIABLE_REGEX.lastIndex = 0;
    
    return structure.replace(TAXONOMY_VARIABLE_REGEX, (match, variableName, format) => {
        return getFormattedValue(variableName, format) || match;
    });
  }, [selectedTaxonomyData, getFormattedValue, previewUpdateTime]);
  
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