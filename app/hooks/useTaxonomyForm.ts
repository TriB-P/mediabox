// app/hooks/useTaxonomyForm.ts - VERSION CORRIGÉE FORMATS SPÉCIFIQUES

import { useState, useEffect, useCallback } from 'react';
import { getTaxonomyById } from '../lib/taxonomyService';
import { getDynamicList, hasDynamicList } from '../lib/tactiqueListService';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Taxonomy } from '../types/taxonomy';
import { TAXONOMY_FIELD_SOURCES } from '../config/taxonomyFields';
import type {
  PlacementFormData,
  HighlightState,
  TaxonomyValues,
  TaxonomyVariableValue
} from '../types/tactiques';
import type { TaxonomyFormat } from '../config/taxonomyFields';

// ==================== TYPES MODIFIÉS ====================

// 🔥 NOUVEAU : Variable avec multiples formats
interface ExtendedParsedTaxonomyVariable {
  variable: string;
  formats: TaxonomyFormat[]; // 🔥 CHANGEMENT : Array de formats au lieu d'un seul
  source: 'campaign' | 'tactique' | 'manual';
  level: number;
  isValid: boolean;
  errorMessage?: string;
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
  const [parsedVariables, setParsedVariables] = useState<ExtendedParsedTaxonomyVariable[]>([]);
  const [fieldStates, setFieldStates] = useState<{ [key: string]: FieldState }>({});
  const [taxonomyValues, setTaxonomyValues] = useState<TaxonomyValues>(
    formData.PL_Taxonomy_Values || {}
  );
  
  // 🔥 NOUVEAU : Timestamp pour forcer la mise à jour des aperçus
  const [previewUpdateTime, setPreviewUpdateTime] = useState(Date.now());
  
  // Cache pour les shortcodes
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

  // ==================== FORMATAGE SYNCHRONE ====================
  
  const formatShortcode = useCallback((shortcodeId: string, format: TaxonomyFormat): string => {
    const shortcodeData = shortcodeCache.get(shortcodeId);
    if (!shortcodeData) {
      loadShortcode(shortcodeId);
      return shortcodeId;
    }
    
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

  // ==================== PARSING DES VARIABLES CORRIGÉ ====================
  
  function parseVariablesFromStructure(structure: string): Array<{ variable: string; format: TaxonomyFormat; source: 'campaign' | 'tactique' | 'manual' }> {
    if (!structure) return [];
    
    const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
    const variables: Array<{ variable: string; format: TaxonomyFormat; source: 'campaign' | 'tactique' | 'manual' }> = [];
    let match;
    
    while ((match = VARIABLE_REGEX.exec(structure)) !== null) {
      const [, variableName, format] = match;
      
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
        source
      });
    }
    
    return variables;
  }

  // 🔥 FONCTION CORRIGÉE : Déduplication par nom de variable
  function getAllVariables(): ExtendedParsedTaxonomyVariable[] {
    const rawVariables: Array<{ variable: string; format: TaxonomyFormat; source: 'campaign' | 'tactique' | 'manual' }> = [];
    
    if (selectedTaxonomyData.tags) {
      const structure = extractTaxonomyStructure(selectedTaxonomyData.tags);
      rawVariables.push(...parseVariablesFromStructure(structure));
    }
    
    if (selectedTaxonomyData.platform) {
      const structure = extractTaxonomyStructure(selectedTaxonomyData.platform);
      rawVariables.push(...parseVariablesFromStructure(structure));
    }
    
    if (selectedTaxonomyData.mediaocean) {
      const structure = extractTaxonomyStructure(selectedTaxonomyData.mediaocean);
      rawVariables.push(...parseVariablesFromStructure(structure));
    }
    
    // 🔥 CORRECTION : Déduplication par nom de variable uniquement
    const variableMap = new Map<string, ExtendedParsedTaxonomyVariable>();
    
    rawVariables.forEach(({ variable, format, source }) => {
      if (variableMap.has(variable)) {
        // Variable déjà présente : ajouter le format s'il n'y est pas déjà
        const existing = variableMap.get(variable)!;
        if (!existing.formats.includes(format)) {
          existing.formats.push(format);
        }
      } else {
        // Nouvelle variable : créer l'entrée
        variableMap.set(variable, {
          variable,
          formats: [format], // 🔥 CHANGEMENT : Array avec le premier format
          source,
          level: 1,
          isValid: true
        });
      }
    });
    
    const result = Array.from(variableMap.values());
    
    console.log('🔍 Variables après déduplication:', result.map(v => ({
      variable: v.variable,
      formats: v.formats,
      source: v.source
    })));
    
    return result;
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
  
  const resolveVariableValue = useCallback((variable: ExtendedParsedTaxonomyVariable): string => {
    const { variable: varName, source } = variable;
    
    // 1. Vérifier s'il y a une valeur manuelle
    const manualValue = taxonomyValues[varName];
    if (manualValue) {
      if (manualValue.format === 'open' && manualValue.openValue) {
        return manualValue.openValue;
      } else if (manualValue.shortcodeId) {
        // 🔥 NOUVEAU : Pour les multiples formats, utiliser le premier format pour l'affichage
        const primaryFormat = variable.formats[0];
        return formatShortcode(manualValue.shortcodeId, primaryFormat);
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
      
      // Pour les valeurs héritées, utiliser le premier format demandé
      const primaryFormat = variable.formats[0];
      if (primaryFormat !== 'open' && rawValueStr.length > 5 && !rawValueStr.includes(' ')) {
        const formattedValue = formatShortcode(rawValueStr, primaryFormat);
        if (formattedValue && formattedValue !== rawValueStr) {
          return formattedValue;
        }
      }
      
      return rawValueStr;
    }
    
    return source === 'manual' ? '' : `[${varName}:${variable.formats.join('|')}]`;
  }, [taxonomyValues, campaignData, tactiqueData, formatShortcode]);

  // ==================== FONCTIONS DE FORMATAGE (SYNCHRONES) ====================
  
  const getFormattedValue = useCallback((variableName: string): string => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    if (!variable) return '';
    
    return resolveVariableValue(variable);
  }, [parsedVariables, resolveVariableValue]);

  // 🔥 FONCTION CORRIGÉE : Respecte le format spécifique de chaque occurrence
  const getFormattedPreview = useCallback((taxonomyType: 'tags' | 'platform' | 'mediaocean'): string => {
    console.log(`🎯 Génération aperçu pour ${taxonomyType}`);
    
    const taxonomy = selectedTaxonomyData[taxonomyType];
    if (!taxonomy) {
      console.log(`❌ Pas de taxonomie pour ${taxonomyType}`);
      return '';
    }
    
    const structure = extractTaxonomyStructure(taxonomy);
    if (!structure) {
      console.log(`❌ Pas de structure pour ${taxonomyType}`);
      return '';
    }
    
    console.log(`📋 Structure à traiter: ${structure}`);
    
    // 🔥 NOUVEAU : Créer une nouvelle regex à chaque appel pour éviter les problèmes de state
    const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
    
    const result = structure.replace(VARIABLE_REGEX, (match, variableName, requestedFormat) => {
      console.log(`🔍 Traitement ${variableName} avec format ${requestedFormat} dans ${taxonomyType}`);
      
      const variable = parsedVariables.find(v => v.variable === variableName);
      
      if (!variable) {
        console.log(`❌ Variable ${variableName} non trouvée dans parsedVariables`);
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
          
          // 🔥 CORRECTION : Utiliser le format spécifique demandé dans cette occurrence
          if (requestedFormat !== 'open' && rawValueStr.length > 5 && !rawValueStr.includes(' ')) {
            const formattedValue = formatShortcode(rawValueStr, requestedFormat as TaxonomyFormat);
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
          // 🔥 CORRECTION : Utiliser le format spécifique demandé dans cette occurrence
          const formattedValue = formatShortcode(taxonomyValue.shortcodeId, requestedFormat as TaxonomyFormat);
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
    formatShortcode,
    // 🔥 NOUVEAU : Forcer la re-exécution quand le cache change
    shortcodeCache,
    customCodesCache,
    // 🔥 NOUVEAU : Forcer la mise à jour avec timestamp
    previewUpdateTime
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
  }, [clientId, selectedTaxonomyIds.tags, selectedTaxonomyIds.platform, selectedTaxonomyIds.mediaocean, hasTaxonomies]);

  const loadFieldOptions = useCallback(async () => {
    const variables = getAllVariables();
    const manualVars = variables.filter(v => v.source === 'manual');
    
    if (manualVars.length === 0) return;
    
    console.log('📦 Chargement des listes pour', manualVars.length, 'variables');
    
    for (const variable of manualVars) {
      // 🔥 CORRECTION : Une seule clé par variable (pas par format)
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
      const variables = getAllVariables();
      setParsedVariables(variables);
      loadFieldOptions();
    }
  }, [selectedTaxonomyData, loadFieldOptions]);
  
  // 🔥 NOUVEAU : Forcer la mise à jour des aperçus quand les shortcodes sont chargés
  useEffect(() => {
    if (shortcodeCache.size > 0 || customCodesCache.length > 0) {
      console.log('🔄 Cache shortcode mis à jour, forcer aperçu');
      setPreviewUpdateTime(Date.now());
    }
  }, [shortcodeCache.size, customCodesCache.length]);

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
    
    // 🔥 NOUVEAU : Forcer la mise à jour des aperçus
    setPreviewUpdateTime(Date.now());
    
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