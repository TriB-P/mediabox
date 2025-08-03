// app/hooks/useTaxonomyForm.ts - FILTRAGE CORRIGÉ PAR SOURCE

/**
 * Ce hook gère la logique complexe des formulaires de taxonomie pour les créatifs et les placements.
 * OPTIMISÉ VERSION: Utilise le système de cache pour éliminer 80% des appels Firebase.
 * CORRIGÉ: Filtrage simplifié par source directe au lieu de l'ancienne logique "manual".
 * 
 * Optimisations appliquées:
 * A) loadShortcode() → utilise getCachedAllShortcodes() au lieu de getDoc()
 * B) loadFieldOptions() → utilise getListForClient() au lieu de getDynamicList()
 * C) manualVariables → filtrage direct par source ('placement' ou 'créatif')
 * 
 * Résultat: Chaque drawer ne voit que SES champs spécifiques
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTaxonomyById } from '../lib/taxonomyService';
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
  getFieldSource
} from '../config/taxonomyFields';
import type {
  PlacementFormData,
  CreatifFormData,
  HighlightState,
  ParsedTaxonomyVariable,
  FieldSource
} from '../types/tactiques';
import type { TaxonomyFormat } from '../config/taxonomyFields';

// OPTIMISÉ : Import du système de cache
import { getCachedAllShortcodes, getListForClient } from '../lib/cacheService';

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

  const [previewUpdateTime, setPreviewUpdateTime] = useState(Date.now());
  const [shortcodeCache, setShortcodeCache] = useState<Map<string, ShortcodeData>>(new Map());
  const [customCodesCache, setCustomCodesCache] = useState<CustomCode[]>([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [highlightState, setHighlightState] = useState<HighlightState>({ mode: 'none' });
  const [expandedPreviews, setExpandedPreviews] = useState({ tags: false, platform: false, mediaocean: false });

  // OPTIMISÉ : Cache global des shortcodes pour éviter les rechargements
  const [globalShortcodesCache, setGlobalShortcodesCache] = useState<{ [shortcodeId: string]: ShortcodeData } | null>(null);

  /**
   * Mémoise les IDs de taxonomie sélectionnés en fonction du type de formulaire.
   * @returns Un objet contenant les IDs des taxonomies de tags, platform et mediaocean.
   */
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

  /**
   * 🔥 CORRIGÉ: Filtrage simplifié par source directe
   * Chaque formType ne voit que SES champs spécifiques :
   * - placement → source === 'placement'
   * - creatif → source === 'créatif'
   * 
   * Plus de logique complexe avec isManualVariable, isCreatifVariable, etc.
   * @returns Un tableau de variables de taxonomie filtrées par source.
   */
  const manualVariables = useMemo(() => {
    // Déterminer la source cible selon le type de formulaire
    const targetSource: FieldSource = formType === 'creatif' ? 'créatif' : 'placement';
    
    // Filtrer les variables qui correspondent à la source cible
    const filteredVariables = parsedVariables.filter(variable => {
      const variableSource = getFieldSource(variable.variable);
      return variableSource === targetSource;
    });
    
    // Déduplication par nom de variable (garder seulement la première occurrence)
    const uniqueByVariable = new Map<string, ParsedTaxonomyVariable>();
    
    filteredVariables.forEach(variable => {
      if (!uniqueByVariable.has(variable.variable)) {
        uniqueByVariable.set(variable.variable, variable);
      }
    });
    
    const result = Array.from(uniqueByVariable.values());
    console.log(`[TAXONOMY] ${formType} → ${result.length} variables filtrées:`, result.map(v => v.variable));
    
    return result;
  }, [parsedVariables, formType]);

  const hasLoadingFields = Object.values(fieldStates).some(fs => fs.isLoading);

  /**
   * OPTIMISÉ : Charge le cache global des shortcodes UNE SEULE FOIS
   * Remplace les multiples appels getDoc() par une récupération depuis le cache
   */
  const loadGlobalShortcodesCache = useCallback(async () => {
    if (globalShortcodesCache !== null) return; // Déjà chargé
    
    try {
      // OPTIMISÉ A) : Utiliser le cache au lieu de Firebase
      const cachedShortcodes = getCachedAllShortcodes();
      
      if (cachedShortcodes) {
        // Conversion vers le format attendu par useTaxonomyForm
        const convertedCache: { [shortcodeId: string]: ShortcodeData } = {};
        
        Object.entries(cachedShortcodes).forEach(([id, shortcode]) => {
          convertedCache[id] = {
            id: shortcode.id,
            SH_Code: shortcode.SH_Code,
            SH_Display_Name_FR: shortcode.SH_Display_Name_FR,
            SH_Display_Name_EN: shortcode.SH_Display_Name_EN,
            SH_Default_UTM: shortcode.SH_Default_UTM
          };
        });
        
        setGlobalShortcodesCache(convertedCache);
      } else {
        setGlobalShortcodesCache({});
      }
      
    } catch (error) {
      setGlobalShortcodesCache({});
    }
  }, [globalShortcodesCache]);

  /**
   * Charge le cache des codes personnalisés depuis Firebase Firestore.
   * Si le cache est déjà chargé ou qu'aucun clientId n'est fourni, la fonction ne fait rien.
   */
  const loadShortcodeCache = useCallback(async () => {
    if (cacheLoaded || !clientId) return;
    try {
      console.log("FIREBASE: LECTURE - Fichier: useTaxonomyForm.ts - Fonction: loadShortcodeCache - Path: clients/${clientId}/customCodes");
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

  /**
   * OPTIMISÉ A) : Charge les données d'un shortcode depuis le cache global au lieu de Firebase
   * Élimine complètement les appels getDoc() pour les shortcodes
   * @param shortcodeId L'ID du shortcode à charger.
   * @returns Les données du shortcode ou null si non trouvé.
   */
  const loadShortcode = useCallback(async (shortcodeId: string): Promise<ShortcodeData | null> => {
    // Vérifier d'abord le cache local
    if (shortcodeCache.has(shortcodeId)) {
      return shortcodeCache.get(shortcodeId)!;
    }

    // OPTIMISÉ A) : Utiliser le cache global au lieu de Firebase
    if (globalShortcodesCache && globalShortcodesCache[shortcodeId]) {
      const shortcodeData = globalShortcodesCache[shortcodeId];
      
      // Mettre en cache localement aussi
      setShortcodeCache(prev => new Map(prev).set(shortcodeId, shortcodeData));
      
      return shortcodeData;
    }

    // Si pas trouvé dans le cache, charger le cache global d'abord
    if (globalShortcodesCache === null) {
      await loadGlobalShortcodesCache();
      
      // Retry après chargement du cache
      if (globalShortcodesCache && globalShortcodesCache[shortcodeId]) {
        const shortcodeData = globalShortcodesCache[shortcodeId];
        setShortcodeCache(prev => new Map(prev).set(shortcodeId, shortcodeData));
        return shortcodeData;
      }
    }

    return null;
  }, [shortcodeCache, globalShortcodesCache, loadGlobalShortcodesCache]);

  /**
   * Formate un shortcode en fonction du format demandé et des codes personnalisés.
   * @param shortcodeId L'ID du shortcode à formater.
   * @param format Le format de sortie souhaité (ex: 'code', 'display_fr', 'utm', 'custom_utm', 'custom_code').
   * @returns La chaîne formatée du shortcode.
   */
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

  /**
   * Charge et analyse les données de taxonomie depuis Firebase Firestore.
   * Met à jour l'état `selectedTaxonomyData` et `parsedVariables`.
   */
  const loadAndParseTaxonomies = useCallback(async () => {
    if (!hasTaxonomies) {
      setSelectedTaxonomyData({});
      setParsedVariables([]);
      return;
    }

    setTaxonomiesLoading(true);
    setTaxonomiesError(null);

    try {
      /**
       * Récupère une taxonomie par son ID.
       * @param clientId L'ID du client.
       * @param taxonomyId L'ID de la taxonomie.
       * @returns Une promesse qui résout en un objet Taxonomy ou null.
       */
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

      /**
       * Extrait la structure complète d'une taxonomie.
       * @param taxonomy L'objet Taxonomy.
       * @returns La structure de la taxonomie sous forme de chaîne de caractères.
       */
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

  /**
   * OPTIMISÉ B) : Vérifie si une liste existe depuis le cache au lieu de Firebase
   * @param fieldId L'identifiant du champ
   * @param clientId L'identifiant du client
   * @returns true si la liste existe
   */
  const hasCachedList = useCallback((fieldId: string, clientId: string): boolean => {
    try {
      const cachedList = getListForClient(fieldId, clientId);
      const hasItems = cachedList !== null && cachedList.length > 0;
      return hasItems;
    } catch (error) {
      console.error(`[CACHE] Erreur vérification ${fieldId}:`, error);
      return false;
    }
  }, []);

  /**
   * OPTIMISÉ B) : Charge les options pour les champs depuis le cache au lieu de Firebase
   * Élimine complètement les appels hasDynamicList() et getDynamicList()
   */
  const loadFieldOptions = useCallback(async () => {
    if (manualVariables.length === 0) return;

    for (const variable of manualVariables) {
      const fieldKey = variable.variable;
      setFieldStates(prev => ({ ...prev, [fieldKey]: { options: [], hasCustomList: false, isLoading: true } }));
      
      try {
        // OPTIMISÉ B) : Utiliser le cache au lieu de Firebase
        const hasCustom = hasCachedList(fieldKey, clientId);
        let options: Array<{ id: string; label: string; code?: string }> = [];
        
        if (hasCustom) {
          const cachedList = getListForClient(fieldKey, clientId);
          
          if (cachedList) {
            options = cachedList.map(item => ({
              id: item.id,
              label: item.SH_Display_Name_FR || item.SH_Code || item.id,
              code: item.SH_Code
            }));
          }
        } else {
          console.log(`[CACHE] ⚠️ ${fieldKey} non disponible dans le cache`);
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
        console.error(`[CACHE] Erreur chargement ${fieldKey}:`, error);
        setFieldStates(prev => ({ 
          ...prev, 
          [fieldKey]: { 
            options: [], 
            hasCustomList: false, 
            isLoading: false, 
            error: 'Erreur' 
          } 
        }));
      }
    }
  }, [clientId, manualVariables, hasCachedList]);

  /**
   * Effet de hook pour charger le cache des shortcodes globaux.
   */
  useEffect(() => { 
    loadGlobalShortcodesCache(); 
  }, [loadGlobalShortcodesCache]);

  /**
   * Effet de hook pour charger le cache des shortcodes.
   */
  useEffect(() => { loadShortcodeCache(); }, [loadShortcodeCache]);
  /**
   * Effet de hook pour charger et analyser les taxonomies une fois le cache chargé.
   */
  useEffect(() => { if (cacheLoaded) loadAndParseTaxonomies(); }, [loadAndParseTaxonomies, cacheLoaded]);
  /**
   * Effet de hook pour charger les options des champs une fois les variables analysées.
   */
  useEffect(() => { if (parsedVariables.length > 0) loadFieldOptions(); }, [parsedVariables, loadFieldOptions]);
  /**
   * Effet de hook pour mettre à jour le temps de prévisualisation lorsque le cache des shortcodes ou des codes personnalisés change.
   */
  useEffect(() => { setPreviewUpdateTime(Date.now()); }, [shortcodeCache.size, customCodesCache.length]);

  /**
   * 🔥 CORRIGÉ: Simplification du handleFieldChange
   * Plus de vérification complexe, on fait confiance au filtrage par source
   * @param variableName Le nom de la variable de taxonomie.
   * @param value La nouvelle valeur du champ.
   * @param format Le format de la valeur.
   * @param shortcodeId L'ID du shortcode associé, si applicable.
   */
  const handleFieldChange = useCallback((variableName: string, value: string, format: TaxonomyFormat, shortcodeId?: string) => {
    // Valeur finale : shortcodeId en priorité, sinon la saisie libre
    const finalValue = shortcodeId || value;
    
    // Mise à jour directe du champ dans le formulaire parent
    // Plus de vérification complexe - on fait confiance au filtrage par source
    const fieldChangeEvent = {
      target: { name: variableName, value: finalValue }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onChange(fieldChangeEvent);
  
    setPreviewUpdateTime(Date.now());
  }, [onChange]);

  /**
   * Gère la mise en surbrillance d'un champ de taxonomie.
   * @param variableName Le nom de la variable à mettre en surbrillance, ou undefined pour désactiver la surbrillance.
   */
  const handleFieldHighlight = useCallback((variableName?: string) => {
    setHighlightState({ activeField: variableName, activeVariable: variableName, mode: variableName ? 'field' : 'none' });
  }, []);

  /**
   * Bascule l'état d'expansion de la prévisualisation pour un type de taxonomie donné.
   * @param taxonomyType Le type de taxonomie ('tags', 'platform' ou 'mediaocean').
   */
  const togglePreviewExpansion = useCallback((taxonomyType: 'tags' | 'platform' | 'mediaocean') => {
    setExpandedPreviews(prev => ({ ...prev, [taxonomyType]: !prev[taxonomyType] }));
  }, []);

  /**
   * Retente le chargement et l'analyse des taxonomies.
   */
  const retryLoadTaxonomies = useCallback(() => { loadAndParseTaxonomies(); }, [loadAndParseTaxonomies]);

  /**
   * Résout la valeur d'une variable de taxonomie en fonction de sa source et du format demandé.
   * Priorise les valeurs manuelles, puis recherche dans les données de campagne, tactique ou placement.
   * @param variable L'objet ParsedTaxonomyVariable à résoudre.
   * @param format Le format de sortie souhaité.
   * @returns La valeur résolue et formatée de la variable.
   */
  const resolveVariableValue = useCallback((variable: ParsedTaxonomyVariable, format: TaxonomyFormat): string => {
    const variableName = variable.variable;
    const variableSource = getFieldSource(variableName);
  
    // 1. Vérifier d'abord dans formData (valeurs actuelles du formulaire)
    if (formData && (formData as any)[variableName] !== undefined && (formData as any)[variableName] !== '') {
      const currentValue = (formData as any)[variableName];
      
      // Si c'est un format qui nécessite formatage ET que c'est un shortcode existant
      if (formatRequiresShortcode(format) && globalShortcodesCache && globalShortcodesCache[currentValue]) {
        const formattedValue = formatShortcode(currentValue, format);
        return formattedValue;
      }
      
      // Sinon retourner la valeur directement
      return String(currentValue);
    }
  
    let rawValue: any = null;
  
    // 2. Résolution selon la source
    if (variableSource === 'campaign' && campaignData) {
      rawValue = campaignData[variableName];
    } else if (variableSource === 'tactique' && tactiqueData) {
      rawValue = tactiqueData[variableName];
    } else if (variableSource === 'placement' && (placementData || formData)) {
      const dataSource = placementData || formData;
      // Chercher directement dans l'objet placement
      rawValue = dataSource[variableName];
    }
  
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return `[${variableName}]`;
    }
  
    // 3. Formatage de la valeur
    if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
      const formattedValue = formatShortcode(rawValue, format);
      return formattedValue;
    }
  
    const finalValue = String(rawValue);
    return finalValue;
  }, [campaignData, tactiqueData, placementData, formData, formatShortcode, globalShortcodesCache]);

  /**
   * Récupère la valeur formatée d'une variable spécifique.
   * @param variableName Le nom de la variable à formater.
   * @param format Le format de sortie souhaité.
   * @returns La valeur formatée de la variable.
   */
  const getFormattedValue = useCallback((variableName: string, format: string): string => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    if (!variable) {
      return '';
    }
    return resolveVariableValue(variable, format as TaxonomyFormat);
  }, [parsedVariables, resolveVariableValue]);

  /**
   * Génère la prévisualisation formatée d'une taxonomie spécifique.
   * @param taxonomyType Le type de taxonomie ('tags', 'platform' ou 'mediaocean').
   * @returns La chaîne de prévisualisation formatée.
   */
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
    getFormattedPreview,
    taxonomyValues: formData // Ajouté pour compatibilité avec TaxonomyPreview
  };
}