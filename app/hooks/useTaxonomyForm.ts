/**
 * Ce hook gère la logique complexe des formulaires de taxonomie pour les créatifs et les placements.
 * Il s'occupe du chargement des données de taxonomie depuis Firebase,
 * de l'analyse des variables contenues dans ces taxonomies,
 * de la gestion des états des champs de formulaire (options, chargement, erreurs),
 * de la prévisualisation des taxonomies formatées,
 * et de la persistance des valeurs sélectionnées.
 * Il interagit avec les services Firebase pour récupérer les données nécessaires.
 */
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
   * Mémoise les variables manuelles filtrées en fonction du type de formulaire.
   * @returns Un tableau de variables de taxonomie analysées qui sont considérées comme manuelles.
   */
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
   * Charge les données d'un shortcode spécifique depuis Firebase Firestore.
   * Met en cache les données récupérées pour éviter des appels répétés.
   * @param shortcodeId L'ID du shortcode à charger.
   * @returns Les données du shortcode ou null si non trouvé ou en cas d'erreur.
   */
  const loadShortcode = useCallback(async (shortcodeId: string): Promise<ShortcodeData | null> => {
    if (shortcodeCache.has(shortcodeId)) return shortcodeCache.get(shortcodeId)!;
    try {
      console.log("FIREBASE: LECTURE - Fichier: useTaxonomyForm.ts - Fonction: loadShortcode - Path: shortcodes/${shortcodeId}");
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
   * Charge les options pour les champs de formulaire manuels.
   * Met à jour l'état `fieldStates` avec les options, l'état de chargement et les erreurs.
   */
  const loadFieldOptions = useCallback(async () => {
    if (manualVariables.length === 0) return;

    for (const variable of manualVariables) {
      const fieldKey = variable.variable;
      setFieldStates(prev => ({ ...prev, [fieldKey]: { options: [], hasCustomList: false, isLoading: true } }));
      try {
        console.log("FIREBASE: LECTURE - Fichier: useTaxonomyForm.ts - Fonction: loadFieldOptions - Path: dynamicLists/${variable.variable}");
        const hasCustom = await hasDynamicList(variable.variable, clientId);
        let options: Array<{ id: string; label: string; code?: string }> = [];
        if (hasCustom) {
          console.log("FIREBASE: LECTURE - Fichier: useTaxonomyForm.ts - Fonction: loadFieldOptions - Path: dynamicLists/${variable.variable}");
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
   * Gère le changement de valeur d'un champ de taxonomie manuel.
   * Met à jour les valeurs de taxonomie et déclenche l'événement `onChange` pour le formulaire parent.
   * @param variableName Le nom de la variable de taxonomie.
   * @param value La nouvelle valeur du champ.
   * @param format Le format de la valeur.
   * @param shortcodeId L'ID du shortcode associé, si applicable.
   */
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

    // 1. Vérifier les valeurs manuelles en priorité
    const manualValue = taxonomyValues[variableName];
    if (manualValue) {
      if (manualValue.format === 'open') return manualValue.openValue || '';
      if (manualValue.shortcodeId) return formatShortcode(manualValue.shortcodeId, format);
      return manualValue.value || '';
    }

    let rawValue: any = null;

    // 2. Résolution selon la source avec correction pour les placements
    if (variableSource === 'campaign' && campaignData) {
      rawValue = campaignData[variableName];
    } else if (variableSource === 'tactique' && tactiqueData) {
      rawValue = tactiqueData[variableName];
    } else if (variableSource === 'placement' && placementData) {
      // Pour les variables de placement, chercher dans PL_Taxonomy_Values
      if (isPlacementVariable(variableName) && placementData.PL_Taxonomy_Values && placementData.PL_Taxonomy_Values[variableName]) {
        const taxonomyValue = placementData.PL_Taxonomy_Values[variableName];

        // Extraire la valeur selon le format demandé
        if (format === 'open' && taxonomyValue.openValue) {
          rawValue = taxonomyValue.openValue;
        } else if (taxonomyValue.shortcodeId && formatRequiresShortcode(format)) {
          rawValue = formatShortcode(taxonomyValue.shortcodeId, format);
          return rawValue; // Retour direct car déjà formaté
        } else {
          rawValue = taxonomyValue.value;
        }
      } else {
        // Fallback: chercher directement dans l'objet placement
        rawValue = placementData[variableName];
      }
    }

    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return `[${variableName}]`;
    }

    // 3. Formatage de la valeur (seulement si pas déjà formaté)
    if (typeof rawValue === 'string' && formatRequiresShortcode(format)) {
      const formattedValue = formatShortcode(rawValue, format);
      return formattedValue;
    }

    const finalValue = String(rawValue);
    return finalValue;
  }, [taxonomyValues, campaignData, tactiqueData, placementData, formatShortcode]);

  /**
   * Récupère la valeur formatée d'une variable spécifique.
   * @param variableName Le nom de la variable à formater.
   * @param format Le format de sortie souhaité.
   * @returns La valeur formatée de la variable.
   */
  const getFormattedValue = useCallback((variableName: string, format: string): string => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    if (!variable) return '';
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