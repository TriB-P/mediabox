// app/hooks/useTaxonomyForm.ts - CORRECTION RÉSOLUTION PLACEMENT

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
import { 
  TAXONOMY_VARIABLE_REGEX, 
  formatRequiresShortcode, 
  isManualVariable,
  isCreatifVariable,
  isPlacementVariable,
  getFieldSource
} from '../config/taxonomyFields';
import type {
  PlacementFormData,
  CreatifFormData,
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
  formData: PlacementFormData | CreatifFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  clientId: string;
  campaignData?: any;
  tactiqueData?: any;
  placementData?: any;
  formType?: 'placement' | 'creatif';
}

// ==================== HOOK PRINCIPAL ====================

export function useTaxonomyForm({
  formData,
  onChange,
  clientId,
  campaignData,
  tactiqueData,
  placementData,
  formType = 'placement'
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
  const [taxonomyValues, setTaxonomyValues] = useState<TaxonomyValues>(() => {
    if (formType === 'creatif') {
      return (formData as CreatifFormData).CR_Taxonomy_Values || {};
    }
    return (formData as PlacementFormData).PL_Taxonomy_Values || {};
  });
  
  const [previewUpdateTime, setPreviewUpdateTime] = useState(Date.now());
  const [shortcodeCache, setShortcodeCache] = useState<Map<string, ShortcodeData>>(new Map());
  const [customCodesCache, setCustomCodesCache] = useState<CustomCode[]>([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [highlightState, setHighlightState] = useState<HighlightState>({ mode: 'none' });
  const [expandedPreviews, setExpandedPreviews] = useState({ tags: false, platform: false, mediaocean: false });

  const selectedTaxonomyIds = useMemo(() => {
    if (formType === 'creatif') {
      const creatifData = formData as CreatifFormData;
      return {
        tags: creatifData.CR_Taxonomy_Tags || '',
        platform: creatifData.CR_Taxonomy_Platform || '',
        mediaocean: creatifData.CR_Taxonomy_MediaOcean || ''
      };
    } else {
      const placementData = formData as PlacementFormData;
      return {
        tags: placementData.PL_Taxonomy_Tags || '',
        platform: placementData.PL_Taxonomy_Platform || '',
        mediaocean: placementData.PL_Taxonomy_MediaOcean || ''
      };
    }
  }, [formData, formType]);

  const hasTaxonomies = Boolean(selectedTaxonomyIds.tags || selectedTaxonomyIds.platform || selectedTaxonomyIds.mediaocean);
  
  const manualVariables = useMemo(() => {
    if (formType === 'creatif') {
      return parsedVariables.filter(variable => isCreatifVariable(variable.variable));
    } else {
      return parsedVariables.filter(variable => {
        const isCreatif = isCreatifVariable(variable.variable);
        const isPlacement = isPlacementVariable(variable.variable);
        const isManual = isManualVariable(variable.variable);
        return isPlacement || (isManual && !isCreatif);
      });
    }
  }, [parsedVariables, formType]);
  
  const hasLoadingFields = Object.values(fieldStates).some(fs => fs.isLoading);

  const loadShortcodeCache = useCallback(async () => {
    if (cacheLoaded || !clientId) return;
    try {
      const customCodesRef = collection(db, 'clients', clientId, 'customCodes');
      const customSnapshot = await getDocs(customCodesRef);
      const customCodes: CustomCode[] = customSnapshot.docs.map(doc => ({ 
        shortcodeId: doc.data().shortcodeId, 
        customCode: doc.data().customCode 
      } as CustomCode));
      setCustomCodesCache(customCodes);
      setCacheLoaded(true);
    } catch (error) { 
      console.error('Erreur chargement cache:', error); 
      setCacheLoaded(true); 
    }
  }, [clientId, cacheLoaded]);

  const loadShortcode = useCallback(async (shortcodeId: string): Promise<ShortcodeData | null> => {
    if (shortcodeCache.has(shortcodeId)) return shortcodeCache.get(shortcodeId)!;
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
        SH_Default_UTM: data.SH_Default_UTM 
      };
      setShortcodeCache(prev => new Map(prev).set(shortcodeId, shortcodeData));
      return shortcodeData;
    } catch (error) { 
      console.error(`Erreur chargement shortcode ${shortcodeId}:`, error); 
      return null; 
    }
  }, [shortcodeCache]);

  const formatShortcode = useCallback((shortcodeId: string, format: TaxonomyFormat): string => {
    const shortcodeData = shortcodeCache.get(shortcodeId);
    if (!shortcodeData) { 
      loadShortcode(shortcodeId); 
      return shortcodeId; 
    }
    
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
        
        if (formType === 'creatif') {
          return [taxonomy.NA_Name_Level_5, taxonomy.NA_Name_Level_6].filter(Boolean).join('|');
        } else {
          return [taxonomy.NA_Name_Level_1, taxonomy.NA_Name_Level_2, taxonomy.NA_Name_Level_3, taxonomy.NA_Name_Level_4].filter(Boolean).join('|');
        }
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
  }, [clientId, hasTaxonomies, selectedTaxonomyIds.tags, selectedTaxonomyIds.platform, selectedTaxonomyIds.mediaocean, formType]);

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
          options = dynamicList.map(item => ({ 
            id: item.id, 
            label: item.SH_Display_Name_FR || item.SH_Code || item.id, 
            code: item.SH_Code 
          }));
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

  const handleFieldChange = useCallback((variableName: string, value: string, format: TaxonomyFormat, shortcodeId?: string) => {
    const newTaxonomyValue: TaxonomyVariableValue = {
      value, source: 'manual', format,
      ...(format === 'open' ? { openValue: value } : {}),
      ...(shortcodeId ? { shortcodeId } : {})
    };
    
    const newTaxonomyValues = { ...taxonomyValues, [variableName]: newTaxonomyValue };
    setTaxonomyValues(newTaxonomyValues);
    
    const taxonomyValuesFieldName = formType === 'creatif' ? 'CR_Taxonomy_Values' : 'PL_Taxonomy_Values';
    const taxonomyValuesEvent = {
      target: { name: taxonomyValuesFieldName, value: newTaxonomyValues }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onChange(taxonomyValuesEvent);

    if ((formType === 'creatif' && isCreatifVariable(variableName)) || 
        (formType === 'placement' && (isManualVariable(variableName) || isPlacementVariable(variableName)) && !isCreatifVariable(variableName))) {
      const eventValue = shortcodeId ?? value;
      const fieldChangeEvent = {
        target: { name: variableName, value: eventValue }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange(fieldChangeEvent);
    }

    setPreviewUpdateTime(Date.now());
  }, [taxonomyValues, onChange, formType]);

  const handleFieldHighlight = useCallback((variableName?: string) => {
    setHighlightState({ activeField: variableName, activeVariable: variableName, mode: variableName ? 'field' : 'none' });
  }, []);

  const togglePreviewExpansion = useCallback((taxonomyType: 'tags' | 'platform' | 'mediaocean') => {
    setExpandedPreviews(prev => ({ ...prev, [taxonomyType]: !prev[taxonomyType] }));
  }, []);

  const retryLoadTaxonomies = useCallback(() => { loadAndParseTaxonomies(); }, [loadAndParseTaxonomies]);

  // 🔥 CORRECTION: Fonction de résolution corrigée pour les variables de placement
  const resolveVariableValue = useCallback((variable: ParsedTaxonomyVariable, format: TaxonomyFormat): string => {
    const variableName = variable.variable;
    const variableSource = getFieldSource(variableName);
    
    console.log(`🔍 === RÉSOLUTION VARIABLE ${variableName} ===`);
    console.log(`🎯 Source détectée: ${variableSource}, Format: ${format}`);
    
    // 1. Vérifier les valeurs manuelles en priorité
    const manualValue = taxonomyValues[variableName];
    if (manualValue) {
      console.log(`✅ Valeur manuelle trouvée:`, manualValue);
      if (manualValue.format === 'open') return manualValue.openValue || '';
      if (manualValue.shortcodeId) return formatShortcode(manualValue.shortcodeId, format);
      return manualValue.value || '';
    }
    
    let rawValue: any = null;
    
    // 2. Résolution selon la source avec correction pour les placements
    if (variableSource === 'campaign' && campaignData) {
      rawValue = campaignData[variableName];
      console.log(`🏛️ Valeur campagne[${variableName}]:`, rawValue);
    } else if (variableSource === 'tactique' && tactiqueData) {
      rawValue = tactiqueData[variableName];
      console.log(`🎯 Valeur tactique[${variableName}]:`, rawValue);
    } else if (variableSource === 'placement' && placementData) {
      // 🔥 CORRECTION: Pour les variables de placement, chercher dans PL_Taxonomy_Values
      if (isPlacementVariable(variableName) && placementData.PL_Taxonomy_Values && placementData.PL_Taxonomy_Values[variableName]) {
        const taxonomyValue = placementData.PL_Taxonomy_Values[variableName];
        console.log(`🏢 Valeur placement PL_Taxonomy_Values[${variableName}]:`, taxonomyValue);
        
        // Extraire la valeur selon le format demandé
        if (format === 'open' && taxonomyValue.openValue) {
          rawValue = taxonomyValue.openValue;
        } else if (taxonomyValue.shortcodeId && formatRequiresShortcode(format)) {
          rawValue = formatShortcode(taxonomyValue.shortcodeId, format);
          console.log(`🔧 Valeur formatée depuis shortcode:`, rawValue);
          return rawValue; // Retour direct car déjà formaté
        } else {
          rawValue = taxonomyValue.value;
        }
        console.log(`✅ Valeur extraite:`, rawValue);
      } else {
        // Fallback: chercher directement dans l'objet placement
        rawValue = placementData[variableName];
        console.log(`🏢 Valeur placement directe[${variableName}]:`, rawValue);
      }
    }
    
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      console.log(`❌ Aucune valeur trouvée pour ${variableName}`);
      return `[${variableName}]`;
    }

    // 3. Formatage de la valeur (seulement si pas déjà formaté)
    if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
      const formattedValue = formatShortcode(rawValue, format);
      console.log(`🔧 Valeur formatée (shortcode):`, formattedValue);
      return formattedValue;
    }
    
    const finalValue = String(rawValue);
    console.log(`✅ Valeur finale:`, finalValue);
    console.log(`🔍 === FIN RÉSOLUTION ${variableName} ===`);
    
    return finalValue;
  }, [taxonomyValues, campaignData, tactiqueData, placementData, formatShortcode]);

  const getFormattedValue = useCallback((variableName: string, format: string): string => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    if (!variable) return '';
    return resolveVariableValue(variable, format as TaxonomyFormat);
  }, [parsedVariables, resolveVariableValue]);
  
  const getFormattedPreview = useCallback((taxonomyType: 'tags' | 'platform' | 'mediaocean'): string => {
    const taxonomy = selectedTaxonomyData[taxonomyType];
    if (!taxonomy) return '';
    
    let structure = '';
    if (formType === 'creatif') {
      structure = [taxonomy.NA_Name_Level_5, taxonomy.NA_Name_Level_6].filter(Boolean).join('|');
    } else {
      structure = [taxonomy.NA_Name_Level_1, taxonomy.NA_Name_Level_2, taxonomy.NA_Name_Level_3, taxonomy.NA_Name_Level_4].filter(Boolean).join('|');
    }
    
    TAXONOMY_VARIABLE_REGEX.lastIndex = 0;
    
    return structure.replace(TAXONOMY_VARIABLE_REGEX, (match, variableName, format) => {
        return getFormattedValue(variableName, format) || match;
    });
  }, [selectedTaxonomyData, getFormattedValue, previewUpdateTime, formType]);
  
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