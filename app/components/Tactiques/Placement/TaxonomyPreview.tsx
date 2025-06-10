// app/components/Tactiques/Placement/TaxonomyPreview.tsx - VERSION AVEC HIGHLIGHT EN GRAS

'use client';

import React, { useMemo } from 'react';
import { getSourceColor, getFormatColor } from '../../../config/taxonomyFields';
import { Taxonomy } from '../../../types/taxonomy';
import type {
  ParsedTaxonomyVariable,
  TaxonomyValues
} from '../../../types/tactiques';

// ==================== TYPES ====================

interface FieldState {
  options: Array<{ id: string; label: string; code?: string }>;
  hasCustomList: boolean;
  isLoading: boolean;
  error?: string;
}

interface HighlightState {
  activeField?: string;
  activeVariable?: string;
  mode: 'field' | 'preview' | 'none';
}

interface TaxonomyPreviewProps {
  parsedVariables: ParsedTaxonomyVariable[];
  selectedTaxonomyData: {
    tags?: Taxonomy;
    platform?: Taxonomy;
    mediaocean?: Taxonomy;
  };
  taxonomyValues: TaxonomyValues;
  fieldStates: { [key: string]: FieldState };
  expandedPreviews: {
    tags: boolean;
    platform: boolean;
    mediaocean: boolean;
  };
  campaignData?: any;
  tactiqueData?: any;
  hasLoadingFields: boolean;
  highlightState: HighlightState; // 🔥 NOUVEAU : Ajout du highlightState
  onToggleExpansion: (taxonomyType: 'tags' | 'platform' | 'mediaocean') => void;
  getFormattedValue: (variableName: string) => string;
  getFormattedPreview: (taxonomyType: 'tags' | 'platform' | 'mediaocean') => string;
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function TaxonomyPreview({
  parsedVariables,
  selectedTaxonomyData,
  taxonomyValues,
  fieldStates,
  expandedPreviews,
  campaignData,
  tactiqueData,
  hasLoadingFields,
  highlightState, // 🔥 NOUVEAU : Récupération du highlightState
  onToggleExpansion,
  getFormattedValue,
  getFormattedPreview
}: TaxonomyPreviewProps) {

  // ==================== FONCTIONS UTILITAIRES ====================
  
  /**
   * Détermine la source d'une variable pour la coloration
   */
  const getVariableSource = (variableName: string): 'campaign' | 'tactique' | 'manual' => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    return variable?.source || 'manual';
  };

  /**
   * Détermine les formats d'une variable pour la coloration
   */
  const getVariableFormats = (variableName: string): string[] => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    return variable?.formats || ['display_fr'];
  };

  /**
   * Vérifie si une variable a une valeur définie - VERSION SYNCHRONE
   */
  const hasVariableValue = (variableName: string): boolean => {
    const formattedValue = getFormattedValue(variableName);
    
    return Boolean(
      formattedValue && 
      formattedValue.trim() !== '' && 
      !formattedValue.startsWith('[')
    );
  };

  // ==================== FONCTIONS DE RENDU ====================
  
  /**
   * 🔥 NOUVEAU : Génère l'aperçu avec memoization pour éviter les re-calculs inutiles
   * Maintenant avec prise en compte du highlightState
   */
  const getMemoizedPreview = useMemo(() => {
    return (taxonomyType: 'tags' | 'platform' | 'mediaocean') => {
      const preview = getFormattedPreview(taxonomyType);
      console.log(`🎯 Aperçu mémorisé pour ${taxonomyType}: ${preview}`);
      return preview;
    };
  }, [getFormattedPreview, taxonomyValues, selectedTaxonomyData, parsedVariables, highlightState]);

  /**
   * 🔥 MODIFIÉ : Rend un niveau de taxonomie avec formatage intelligent et highlight
   */
  const renderLevelWithVariables = (levelStructure: string) => {
    // Utiliser une regex pour trouver et remplacer toutes les variables [VARIABLE:format]
    const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
    
    // Remplacer chaque variable par sa valeur résolue avec le bon style
    const resolvedStructure = levelStructure.replace(VARIABLE_REGEX, (match, variableName, format) => {
      const formattedValue = getFormattedValue(variableName);
      const source = getVariableSource(variableName);
      const hasValue = hasVariableValue(variableName);
      
      // 🔥 NOUVEAU : Vérifier si cette variable est en cours de highlight
      const isHighlighted = highlightState.activeVariable === variableName;
      
      // Toujours utiliser les couleurs de source et format
      const sourceColor = getSourceColor(source);
      const formatColor = getFormatColor(format as any);

      // 🔥 NOUVEAU : Classes CSS supplémentaires pour le highlight
      const highlightClasses = isHighlighted 
        ? 'font-bold ring-2 ring-yellow-400 ring-opacity-75 transform scale-105 transition-all duration-200 shadow-lg z-10 relative' 
        : 'transition-all duration-200';

      if (hasValue) {
        // Variable avec valeur : contour normal + éventuel highlight
        return `<span class="inline-flex items-center px-2 py-1 mx-0.3 my-0.5 text-xs rounded-md ${sourceColor.bg} ${sourceColor.text} ${highlightClasses}" title="${variableName} | ${format}">${formattedValue}</span>`;
      } else {
        // Variable sans valeur : même couleurs mais contour rouge épais + éventuel highlight
        return `<span class="inline-flex items-center px-2 py-1 mx-0.3 my-0.5 text-xs rounded-md ${sourceColor.bg} ${sourceColor.text} border-2 border-red-400 ${highlightClasses}" title="⚠ ${variableName} | ${format}">${match}</span>`;
      }
    });
    
    // Retourner un élément dangerouslySetInnerHTML pour le rendu HTML
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: resolvedStructure }}
        className="whitespace-pre-wrap leading-relaxed"
      />
    );
  };

  /**
   * Rend la structure complète d'une taxonomie avec aperçu formaté - VERSION SYNCHRONE
   */
  const renderTaxonomyStructureWithPreview = (taxonomy: Taxonomy, taxonomyType: 'tags' | 'platform' | 'mediaocean') => {
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
    ].filter(level => level.name);

    return (
      <div className="space-y-4">
        {/* Détail par niveau */}
        <div className="space-y-3">
          {levels.map((level) => (
            <div key={level.level} className="border-l-2 border-gray-300 pl-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {level.title}
              </div>
              <div className="text-sm text-gray-900 font-mono bg-white p-2 rounded border">
                {renderLevelWithVariables(level.name)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * 🔥 MODIFIÉ : Rend une carte de taxonomie avec aperçu forcé et mise à jour basée sur highlight
   */
  const renderTaxonomyCard = (
    type: 'tags' | 'platform' | 'mediaocean',
    taxonomy: Taxonomy,
    colorClass: string,
    label: string
  ) => {
    // 🔥 MODIFICATION : Forcer le recalcul quand highlightState change
    const highlightKey = highlightState.activeVariable || 'none';
    const fullPreview = getMemoizedPreview(type);
    
    console.log(`🎯 Rendu carte ${type}, aperçu: ${fullPreview}, highlight: ${highlightKey}`);

    return (
      <div key={`${type}-${highlightKey}-${Date.now()}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleExpansion(type);
          }}
          className={`w-full px-4 py-3 ${colorClass} border-b border-gray-200 text-left flex items-center justify-between hover:opacity-80 transition-colors`}
        >
          <div className="flex items-center space-x-2">
            <span className="font-medium">
              {label}
            </span>
            {/* 🔥 NOUVEAU : Indicateur de highlight actif */}
            {highlightState.activeVariable && (
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                ← {highlightState.activeVariable}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasLoadingFields && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
            )}
            <span>
              {expandedPreviews[type] ? '−' : '+'}
            </span>
          </div>
        </button>
        
        {expandedPreviews[type] && (
          <div className="p-4">
            {renderTaxonomyStructureWithPreview(taxonomy, type)}
          </div>
        )}
      </div>
    );
  };

  // ==================== RENDU PRINCIPAL ====================
  
  if (parsedVariables.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-2">
          Aperçu des taxonomies
        </h4>
        <p className="text-sm">
          Aucune variable identifiée. L'aperçu apparaîtra une fois les taxonomies parsées.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900">
          Aperçu des taxonomies
        </h4>
        {/* Indicateur global de chargement */}
        {hasLoadingFields && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
            Chargement des listes...
          </div>
        )}
      </div>
      
      {/* 🔥 MODIFIÉ : Légende enrichie des couleurs avec info sur highlight */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="space-y-2">
          {/* Sources */}
          <div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Campagne</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Tactique</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">Placement</span>
              <span className="px-2 py-1 bg-white-100 text-black-800 border-2 border-red-400 rounded">Manquant</span>
            </div>
          </div>
          {/* 🔥 NOUVEAU : Instructions pour l'utilisateur */}
          <div className="text-xs text-gray-600">
            💡 Survolez un champ dans la section "Variables à configurer" pour le mettre en surbrillance dans l'aperçu
          </div>
        </div>
      </div>
      
      {/* Cartes des taxonomies */}
      <div className="space-y-3">
        {selectedTaxonomyData.tags && 
          renderTaxonomyCard('tags', selectedTaxonomyData.tags, 'bg-blue-50 text-blue-900', 'Tags')
        }
        
        {selectedTaxonomyData.platform && 
          renderTaxonomyCard('platform', selectedTaxonomyData.platform, 'bg-green-50 text-green-900', 'Platform')
        }
        
        {selectedTaxonomyData.mediaocean && 
          renderTaxonomyCard('mediaocean', selectedTaxonomyData.mediaocean, 'bg-orange-50 text-orange-900', 'MediaOcean')
        }
      </div>
    </div>
  );
}