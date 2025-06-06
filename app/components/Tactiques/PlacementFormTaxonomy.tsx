// app/components/Tactiques/PlacementFormTaxonomy.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FormInput, 
  SmartSelect, 
  createLabelWithHelp 
} from './TactiqueFormComponents';
import { getClientTaxonomies, getTaxonomyById } from '../../lib/taxonomyService';
import { getDynamicList, hasDynamicList } from '../../lib/tactiqueListService';
import { Taxonomy } from '../../types/taxonomy';
import {
  processTaxonomies,
  createFieldConfig,
  extractUniqueVariables,
  parseAllTaxonomies
} from '../../lib/taxonomyParser';
import {
  getSourceColor,
  SOURCE_COLORS,
  MAX_TAXONOMY_LEVELS
} from '../../config/taxonomyFields';
import type {
  PlacementFormData,
  TaxonomyFieldConfig,
  TaxonomyContext,
  HighlightState,
  ParsedTaxonomyVariable,
  TaxonomyValues
} from '../../types/tactiques';

// ==================== TYPES ====================

interface PlacementFormTaxonomyProps {
  formData: PlacementFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientId: string;
  campaignData?: any;
  tactiqueData?: any;
  loading?: boolean;
}

interface FieldState {
  config: TaxonomyFieldConfig;
  options: Array<{ id: string; label: string }>;
  hasCustomList: boolean;
  isLoading: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const PlacementFormTaxonomy: React.FC<PlacementFormTaxonomyProps> = ({
  formData,
  onChange,
  onTooltipChange,
  clientId,
  campaignData,
  tactiqueData,
  loading = false
}) => {
  
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
  const [taxonomyValues, setTaxonomyValues] = useState<TaxonomyValues>({});
  
  const [highlightState, setHighlightState] = useState<HighlightState>({
    mode: 'none'
  });
  
  // État pour l'expansion des aperçus (fermés par défaut)
  const [expandedPreviews, setExpandedPreviews] = useState<{
    tags: boolean;
    platform: boolean;
    mediaocean: boolean;
  }>({
    tags: false,
    platform: false,
    mediaocean: false
  });

  // ==================== FONCTIONS UTILITAIRES ====================
  
  // Fonction pour extraire la structure combinée d'une taxonomie
  const extractTaxonomyStructure = useCallback((taxonomy: Taxonomy): string => {
    const levels = [
      taxonomy.NA_Name_Level_1,
      taxonomy.NA_Name_Level_2,
      taxonomy.NA_Name_Level_3,
      taxonomy.NA_Name_Level_4
    ].filter(Boolean); // Enlever les niveaux vides
    
    return levels.join('|');
  }, []);

  // ==================== MEMOIZED VALUES ====================
  
  // Récupérer les IDs des taxonomies sélectionnées depuis l'onglet Informations
  const selectedTaxonomyIds = useMemo(() => ({
    tags: formData.PL_Taxonomy_Tags || '',
    platform: formData.PL_Taxonomy_Platform || '',
    mediaocean: formData.PL_Taxonomy_MediaOcean || ''
  }), [formData.PL_Taxonomy_Tags, formData.PL_Taxonomy_Platform, formData.PL_Taxonomy_MediaOcean]);

  // Vérifier si des taxonomies sont sélectionnées
  const hasTaxonomies = useMemo(() => 
    selectedTaxonomyIds.tags || selectedTaxonomyIds.platform || selectedTaxonomyIds.mediaocean
  , [selectedTaxonomyIds]);

  // Structures des taxonomies pour le parsing
  const taxonomyStructures = useMemo(() => ({
    tags: selectedTaxonomyData.tags ? extractTaxonomyStructure(selectedTaxonomyData.tags) : '',
    platform: selectedTaxonomyData.platform ? extractTaxonomyStructure(selectedTaxonomyData.platform) : '',
    mediaocean: selectedTaxonomyData.mediaocean ? extractTaxonomyStructure(selectedTaxonomyData.mediaocean) : ''
  }), [selectedTaxonomyData, extractTaxonomyStructure]);

  // Filtrer pour ne garder que les variables manuelles (modifiables par l'utilisateur)
  const manualVariables = useMemo(() => 
    parsedVariables.filter(variable => variable.source === 'manual')
  , [parsedVariables]);

  const context: TaxonomyContext = useMemo(() => ({
    campaign: campaignData,
    tactique: tactiqueData,
    placement: formData,
    clientId
  }), [campaignData, tactiqueData, formData, clientId]);

  // ==================== EFFECTS ====================
  
  // Charger les taxonomies complètes quand les IDs changent
  useEffect(() => {
    if (hasTaxonomies) {
      loadSelectedTaxonomies();
    } else {
      setSelectedTaxonomyData({});
      setParsedVariables([]);
    }
  }, [selectedTaxonomyIds.tags, selectedTaxonomyIds.platform, selectedTaxonomyIds.mediaocean, hasTaxonomies, clientId]);

  // Parser les structures des taxonomies quand elles sont chargées
  useEffect(() => {
    if (Object.keys(selectedTaxonomyData).length > 0) {
      parseTaxonomyStructures();
    }
  }, [selectedTaxonomyData]);

  // Charger les options des champs quand les variables changent
  useEffect(() => {
    if (manualVariables.length > 0) {
      loadFieldOptions();
    }
  }, [manualVariables, clientId]);

  // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================
  
  // Fonction pour résoudre la valeur d'une variable (héritée ou manuelle)
  const resolveVariableValue = useCallback((variableName: string): string => {
    // 1. Vérifier d'abord les valeurs manuelles
    const manualValue = taxonomyValues[variableName];
    if (manualValue?.value) {
      return manualValue.value;
    }
    
    // 2. Chercher dans les données de campagne
    if (campaignData && campaignData[variableName] !== undefined) {
      return String(campaignData[variableName]);
    }
    
    // 3. Chercher dans les données de tactique
    if (tactiqueData && tactiqueData[variableName] !== undefined) {
      return String(tactiqueData[variableName]);
    }
    
    // 4. Retourner placeholder si aucune valeur trouvée
    return `[${variableName}]`;
  }, [taxonomyValues, campaignData, tactiqueData]);
  
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
      
      // Charger chaque taxonomie sélectionnée
      if (selectedTaxonomyIds.tags) {
        const tagsData = await getTaxonomyById(clientId, selectedTaxonomyIds.tags);
        if (tagsData) newTaxonomyData.tags = tagsData;
      }
      
      if (selectedTaxonomyIds.platform) {
        const platformData = await getTaxonomyById(clientId, selectedTaxonomyIds.platform);
        if (platformData) newTaxonomyData.platform = platformData;
      }
      
      if (selectedTaxonomyIds.mediaocean) {
        const mediaoceanData = await getTaxonomyById(clientId, selectedTaxonomyIds.mediaocean);
        if (mediaoceanData) newTaxonomyData.mediaocean = mediaoceanData;
      }
      
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

  const loadFieldOptions = async () => {
    console.log('📦 Chargement des options pour les champs');
    
    const newFieldStates: { [key: string]: FieldState } = {};
    
    for (const variable of parsedVariables) {
      const fieldKey = `${variable.variable}_${variable.format}`;
      
      newFieldStates[fieldKey] = {
        config: createFieldConfig(variable, '', false),
        options: [],
        hasCustomList: false,
        isLoading: true
      };
      
      // Charger les options pour les champs avec listes dynamiques
      if (variable.source === 'manual' || variable.source === 'tactique') {
        try {
          const hasCustom = await hasDynamicList(variable.variable, clientId);
          const options = hasCustom ? await getDynamicList(variable.variable, clientId) : [];
          
          newFieldStates[fieldKey] = {
            ...newFieldStates[fieldKey],
            options: options.map(opt => ({ id: opt.id, label: opt.SH_Display_Name_FR })),
            hasCustomList: hasCustom,
            isLoading: false
          };
        } catch (error) {
          console.error(`Erreur chargement options pour ${variable.variable}:`, error);
          newFieldStates[fieldKey].isLoading = false;
        }
      } else {
        newFieldStates[fieldKey].isLoading = false;
      }
    }
    
    setFieldStates(newFieldStates);
  };

  const handleFieldChange = useCallback((variableName: string, value: string, format: string) => {
    console.log(`🔄 Changement field ${variableName}: ${value}`);
    
    // Mettre à jour les valeurs de taxonomie
    const newTaxonomyValues = {
      ...taxonomyValues,
      [variableName]: {
        value,
        source: 'manual' as const,
        format: format as any
      }
    };
    setTaxonomyValues(newTaxonomyValues);
    
    // Déclencher le changement pour le parent avec un cast approprié
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

  // ==================== FONCTIONS DE RENDU ====================
  
  const renderVariableFields = () => {
    if (manualVariables.length === 0) {
      return (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-2">
            Configuration des variables
          </h4>
          <p className="text-sm">
            Aucune variable manuelle trouvée. Toutes les valeurs sont héritées automatiquement 
            de la campagne et de la tactique.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
      
        
        {manualVariables.map((variable, index) => {
          const fieldKey = `${variable.variable}_${variable.format}`;
          const fieldState = fieldStates[fieldKey];
          const sourceColor = getSourceColor(variable.source);
          
          if (!fieldState) return null;
          
          return (
            <div
              key={fieldKey}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                highlightState.activeVariable === variable.variable
                  ? `${sourceColor.border} bg-${sourceColor.bg.split('-')[1]}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onMouseEnter={() => handleFieldHighlight(variable.variable)}
              onMouseLeave={() => handleFieldHighlight()}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${sourceColor.bg} ${sourceColor.text}`}>
                    {variable.source}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {variable.variable}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({variable.format})
                  </span>
                </div>
                
                {!variable.isValid && (
                  <span className="text-xs text-red-600">
                    {variable.errorMessage}
                  </span>
                )}
              </div>
              
              {renderVariableInput(variable, fieldState)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderVariableInput = (variable: ParsedTaxonomyVariable, fieldState: FieldState) => {
    const fieldKey = `${variable.variable}_${variable.format}`;
    const currentValue = taxonomyValues[variable.variable]?.value || '';
    
    if (variable.source === 'campaign' || variable.source === 'tactique') {
      // Champs en lecture seule avec valeurs héritées
      const inheritedValue = variable.source === 'campaign' 
        ? campaignData?.[variable.variable] || ''
        : tactiqueData?.[variable.variable] || '';
      
      return (
        <div className="relative">
          <FormInput
            id={fieldKey}
            name={fieldKey}
            value={String(inheritedValue)}
            onChange={() => {}} // Lecture seule
            type="text"
            placeholder={`Valeur héritée de ${variable.source}`}
            label=""
          />
          <div className="absolute inset-0 bg-gray-50 bg-opacity-50 cursor-not-allowed rounded"></div>
        </div>
      );
    }
    
    // Champs manuels
    if (fieldState.hasCustomList && fieldState.options.length > 0) {
      return (
        <div className="relative">
          <SmartSelect
            id={fieldKey}
            name={fieldKey}
            value={currentValue}
            onChange={(e) => handleFieldChange(variable.variable, e.target.value, variable.format)}
            options={fieldState.options}
            placeholder="Sélectionner une valeur..."
            label=""
          />
          {fieldState.isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <FormInput
        id={fieldKey}
        name={fieldKey}
        value={currentValue}
        onChange={(e) => handleFieldChange(variable.variable, e.target.value, variable.format)}
        type="text"
        placeholder={`Saisir ${variable.format}...`}
        label=""
      />
    );
  };

  const togglePreviewExpansion = (taxonomyType: 'tags' | 'platform' | 'mediaocean') => {
    setExpandedPreviews(prev => ({
      ...prev,
      [taxonomyType]: !prev[taxonomyType]
    }));
  };

  const renderPreview = () => {
    if (parsedVariables.length === 0) return null;

    return (
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Aperçu des taxonomies
        </h4>
        
        <div className="space-y-3">
          {selectedTaxonomyData.tags && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePreviewExpansion('tags');
                }}
                className="w-full px-4 py-3 bg-blue-50 border-b border-gray-200 text-left flex items-center justify-between hover:bg-blue-100 transition-colors"
              >
                <span className="font-medium text-blue-900">Tags</span>
                <span className="text-blue-700">
                  {expandedPreviews.tags ? '−' : '+'}
                </span>
              </button>
              {expandedPreviews.tags && (
                <div className="p-4">
                  {renderTaxonomyStructureWithTitles(selectedTaxonomyData.tags)}
                </div>
              )}
            </div>
          )}
          
          {selectedTaxonomyData.platform && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePreviewExpansion('platform');
                }}
                className="w-full px-4 py-3 bg-green-50 border-b border-gray-200 text-left flex items-center justify-between hover:bg-green-100 transition-colors"
              >
                <span className="font-medium text-green-900">Platform</span>
                <span className="text-green-700">
                  {expandedPreviews.platform ? '−' : '+'}
                </span>
              </button>
              {expandedPreviews.platform && (
                <div className="p-4">
                  {renderTaxonomyStructureWithTitles(selectedTaxonomyData.platform)}
                </div>
              )}
            </div>
          )}
          
          {selectedTaxonomyData.mediaocean && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePreviewExpansion('mediaocean');
                }}
                className="w-full px-4 py-3 bg-orange-50 border-b border-gray-200 text-left flex items-center justify-between hover:bg-orange-100 transition-colors"
              >
                <span className="font-medium text-orange-900">MediaOcean</span>
                <span className="text-orange-700">
                  {expandedPreviews.mediaocean ? '−' : '+'}
                </span>
              </button>
              {expandedPreviews.mediaocean && (
                <div className="p-4">
                  {renderTaxonomyStructureWithTitles(selectedTaxonomyData.mediaocean)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderTaxonomyStructureWithTitles = (taxonomy: Taxonomy) => {
    const levels = [
      { 
        name: taxonomy.NA_Name_Level_1, 
        title: taxonomy.NA_Name_Level_1_Title || 'Niveau 1',
        level: 1
      },
      { 
        name: taxonomy.NA_Name_Level_2, 
        title: taxonomy.NA_Name_Level_2_Title || 'Niveau 2',
        level: 2
      },
      { 
        name: taxonomy.NA_Name_Level_3, 
        title: taxonomy.NA_Name_Level_3_Title || 'Niveau 3',
        level: 3
      },
      { 
        name: taxonomy.NA_Name_Level_4, 
        title: taxonomy.NA_Name_Level_4_Title || 'Niveau 4',
        level: 4
      }
    ].filter(level => level.name); // Garder seulement les niveaux définis

    return (
      <div className="space-y-3">
        {levels.map((level, index) => (
          <div key={level.level} className="border-l-2 border-gray-300 pl-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {level.title}
            </div>
            <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
              {renderLevelWithVariables(level.name)}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderLevelWithVariables = (levelStructure: string) => {
    // Utiliser une regex pour trouver et remplacer toutes les variables [VARIABLE:format]
    const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
    
    // Remplacer chaque variable par sa valeur résolue
    const resolvedStructure = levelStructure.replace(VARIABLE_REGEX, (match, variableName, format) => {
      const resolvedValue = resolveVariableValue(variableName);
      
      // Si la valeur est résolue, l'afficher avec une couleur selon la source
      if (resolvedValue && resolvedValue !== `[${variableName}]`) {
        // Déterminer la source de la variable pour la couleur
        const variable = parsedVariables.find(v => v.variable === variableName);
        const sourceColor = variable ? getSourceColor(variable.source) : getSourceColor(null);
        
        return `<span class="px-1 py-0.5 text-xs rounded ${sourceColor.bg} ${sourceColor.text}">${resolvedValue}</span>`;
      }
      
      // Sinon afficher le placeholder original en rouge
      return `<span class="px-1 py-0.5 text-xs rounded bg-red-100 text-red-800">${match}</span>`;
    });
    
    // Retourner un élément dangerouslySetInnerHTML pour le rendu HTML
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: resolvedStructure }}
        className="whitespace-pre-wrap"
      />
    );
  };



  // ==================== RENDU PRINCIPAL ====================
  
  return (
    <div className="p-8 space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Configuration des taxonomies
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configurez les valeurs des variables pour les taxonomies sélectionnées
        </p>
      </div>

      {/* Message si aucune taxonomie sélectionnée */}
      {!hasTaxonomies && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            Aucune taxonomie sélectionnée. Rendez-vous dans l'onglet "Informations" pour sélectionner les taxonomies à utiliser.
          </p>
        </div>
      )}

      {/* Messages d'erreur */}
      {taxonomiesError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {taxonomiesError}
          <button 
            onClick={loadSelectedTaxonomies}
            className="ml-2 text-red-600 hover:text-red-800 underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Champs de variables et aperçu en colonnes */}
      {hasTaxonomies && !taxonomiesLoading && Object.keys(selectedTaxonomyData).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne de gauche : Configuration des variables manuelles */}
          <div>
            {renderVariableFields()}
          </div>
          
          {/* Colonne de droite : Aperçu */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            {renderPreview()}
          </div>
        </div>
      )}

      {/* Indicateur de chargement */}
      {(loading || taxonomiesLoading) && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            {taxonomiesLoading ? 'Chargement des taxonomies...' : 'Chargement des données...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlacementFormTaxonomy;