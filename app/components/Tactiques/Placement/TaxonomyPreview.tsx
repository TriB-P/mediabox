// app/components/Tactiques/Placement/TaxonomyPreview.tsx - VERSION OPTIMISÉE AVEC FORMATS SPÉCIFIQUES

'use client';

import React, { useMemo } from 'react';
import { getSourceColor, getFormatColor, getFormatInfo } from '../../../config/taxonomyFields';
import { Taxonomy } from '../../../types/taxonomy';

// ==================== TYPES ====================

// Variable optimisée avec déduplication
interface OptimizedParsedVariable {
  variable: string;
  formats: string[]; // Tous les formats demandés pour cette variable
  source: 'campaign' | 'tactique' | 'manual';
  level: number;
  isValid: boolean;
  errorMessage?: string;
  occurrences: Array<{
    taxonomyType: 'tags' | 'platform' | 'mediaocean';
    format: string;
    level: number;
  }>;
}

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

interface TaxonomyValues {
  [variableName: string]: {
    value: string;
    source: 'campaign' | 'tactique' | 'manual';
    format: string;
    shortcodeId?: string;
    openValue?: string;
  };
}

interface TaxonomyPreviewProps {
  parsedVariables: OptimizedParsedVariable[];
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
  highlightState: HighlightState;
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
  highlightState,
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
   * Vérifie si une variable a une valeur définie - VERSION OPTIMISÉE
   */
  const hasVariableValue = (variableName: string): boolean => {
    const formattedValue = getFormattedValue(variableName);
    
    return Boolean(
      formattedValue && 
      formattedValue.trim() !== '' && 
      !formattedValue.startsWith('[')
    );
  };

  /**
   * Obtient des statistiques sur l'utilisation des variables pour l'info
   */
  const getVariableStats = useMemo(() => {
    const stats = {
      totalVariables: parsedVariables.length,
      manualVariables: parsedVariables.filter(v => v.source === 'manual').length,
      inheritedVariables: parsedVariables.filter(v => v.source !== 'manual').length,
      resolvedVariables: parsedVariables.filter(v => hasVariableValue(v.variable)).length,
      multiFormatVariables: parsedVariables.filter(v => v.formats.length > 1).length
    };
    
    return stats;
  }, [parsedVariables]);

  // ==================== FONCTIONS DE RENDU OPTIMISÉES ====================
  
  /**
   * 🔥 OPTIMISÉ : Génère l'aperçu avec formatage intelligent et highlight en temps réel
   */
  const getMemoizedPreview = useMemo(() => {
    return (taxonomyType: 'tags' | 'platform' | 'mediaocean') => {
      const preview = getFormattedPreview(taxonomyType);
      console.log(`🎯 Aperçu optimisé pour ${taxonomyType}: ${preview}`);
      return preview;
    };
  }, [getFormattedPreview, taxonomyValues, selectedTaxonomyData, parsedVariables, highlightState]);

  /**
   * 🔥 OPTIMISÉ : Rend un niveau de taxonomie avec formatage intelligent et highlight
   */
  const renderLevelWithVariables = (levelStructure: string) => {
    // Regex optimisée pour trouver et remplacer toutes les variables [VARIABLE:format]
    const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
    
    // Remplacer chaque variable par sa valeur résolue avec le bon style
    const resolvedStructure = levelStructure.replace(VARIABLE_REGEX, (match, variableName, format) => {
      const formattedValue = getFormattedValue(variableName);
      const source = getVariableSource(variableName);
      const hasValue = hasVariableValue(variableName);
      
      // 🔥 OPTIMISÉ : Vérifier si cette variable est en cours de highlight
      const isHighlighted = highlightState.activeVariable === variableName;
      
      // Couleurs basées sur la source et le format
      const sourceColor = getSourceColor(source);
      const formatColor = getFormatColor(format as any);
      const formatInfo = getFormatInfo(format as any);

      // 🔥 OPTIMISÉ : Classes CSS pour le highlight avec animation fluide
      const highlightClasses = isHighlighted 
        ? 'font-bold ring-2 ring-yellow-400 ring-opacity-75 transform scale-105 transition-all duration-200 shadow-lg z-10 relative animate-pulse' 
        : 'transition-all duration-200';

      // Combinaison des couleurs source + format pour une identification visuelle riche
      const borderColor = hasValue ? sourceColor.border : 'border-red-400';
      const bgGradient = hasValue 
        ? `${sourceColor.bg} border-l-4 ${formatColor.border}` 
        : `${sourceColor.bg} border-l-4 border-red-400`;

      // Tooltip enrichi avec informations détaillées
      const tooltipContent = [
        `Variable: ${variableName}`,
        `Format: ${formatInfo?.label || format}`,
        `Source: ${source}`,
        hasValue ? `Valeur: "${formattedValue}"` : 'Valeur manquante',
        formatInfo?.description || ''
      ].filter(Boolean).join(' | ');

      if (hasValue) {
        // Variable avec valeur : style normal + éventuel highlight
        return `<span class="inline-flex items-center px-2 py-1 mx-1 my-0.5 text-xs rounded-md ${bgGradient} ${sourceColor.text} ${highlightClasses}" title="${tooltipContent}">${formattedValue}</span>`;
      } else {
        // Variable sans valeur : style d'erreur + éventuel highlight
        return `<span class="inline-flex items-center px-2 py-1 mx-1 my-0.5 text-xs rounded-md ${bgGradient} ${sourceColor.text} border-2 border-red-400 ${highlightClasses}" title="⚠ ${tooltipContent}">❌ ${match}</span>`;
      }
    });
    
    // Retourner un élément avec HTML sécurisé
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: resolvedStructure }}
        className="whitespace-pre-wrap leading-relaxed font-mono text-sm"
      />
    );
  };

  /**
   * Rend la structure complète d'une taxonomie avec aperçu formaté - VERSION OPTIMISÉE
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
        {/* Aperçu final optimisé */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
            🎯 Aperçu final
            {hasLoadingFields && (
              <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            )}
          </h5>
          <div className="bg-white p-3 rounded border font-mono text-sm overflow-x-auto">
            {renderLevelWithVariables(getMemoizedPreview(taxonomyType))}
          </div>
        </div>

        {/* Détail par niveau */}
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
            Détail par niveau
          </h5>
          {levels.map((level) => (
            <div key={level.level} className="border-l-4 border-gray-300 pl-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {level.title}
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                {renderLevelWithVariables(level.name)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * 🔥 OPTIMISÉ : Rend une carte de taxonomie avec aperçu forcé et mise à jour basée sur highlight
   */
  const renderTaxonomyCard = (
    type: 'tags' | 'platform' | 'mediaocean',
    taxonomy: Taxonomy,
    colorClass: string,
    label: string,
    icon: string
  ) => {
    // Key unique pour forcer la mise à jour du composant
    const highlightKey = `${highlightState.activeVariable || 'none'}_${Date.now()}`;
    
    // Obtenir les statistiques spécifiques à cette taxonomie
    const taxonomyVariables = parsedVariables.filter(v => 
      v.occurrences.some(occ => occ.taxonomyType === type)
    );
    
    const resolvedInTaxonomy = taxonomyVariables.filter(v => hasVariableValue(v.variable));

    return (
      <div key={`${type}-${highlightKey}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleExpansion(type);
          }}
          className={`w-full px-4 py-3 ${colorClass} border-b border-gray-200 text-left flex items-center justify-between hover:opacity-80 transition-all duration-200`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">{icon}</span>
            <div>
              <span className="font-medium text-sm">
                {label}
              </span>
              <div className="text-xs opacity-75 mt-0.5">
                {resolvedInTaxonomy.length}/{taxonomyVariables.length} variables résolues
              </div>
            </div>
            
            {/* 🔥 NOUVEAU : Indicateur de highlight actif */}
            {highlightState.activeVariable && (
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                  {highlightState.activeVariable}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {hasLoadingFields && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
            )}
            <span className="text-sm">
              {expandedPreviews[type] ? '▼' : '▶'}
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
        <h4 className="text-md font-medium text-gray-900 mb-2 flex items-center">
          📋 Aperçu des taxonomies
        </h4>
        <p className="text-sm">
          Aucune variable identifiée. L'aperçu apparaîtra une fois les taxonomies parsées.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900 flex items-center">
          📋 Aperçu des taxonomies
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {getVariableStats.resolvedVariables}/{getVariableStats.totalVariables} résolues
          </span>
        </h4>
        
        {/* Indicateur global de chargement */}
        {hasLoadingFields && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
            Chargement...
          </div>
        )}
      </div>
      
      {/* 🔥 OPTIMISÉ : Légende enrichie avec statistiques */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3">
        <div className="space-y-3">
          {/* Sources avec compteurs */}
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Sources des variables :</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded flex items-center">
                📊 Campagne ({parsedVariables.filter(v => v.source === 'campaign').length})
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded flex items-center">
                🎯 Tactique ({parsedVariables.filter(v => v.source === 'tactique').length})
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded flex items-center">
                ✏️ Manuel ({getVariableStats.manualVariables})
              </span>
              <span className="px-2 py-1 bg-red-100 text-red-800 border-2 border-red-400 rounded flex items-center">
                ❌ Manquant
              </span>
            </div>
          </div>
          
          {/* Statistiques détaillées */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-gray-600">
              • Variables multi-formats : {getVariableStats.multiFormatVariables}
            </div>
            <div className="text-gray-600">
              • Champs dédupliqués dans l'interface
            </div>
          </div>
          
          {/* Instructions interactives */}
          <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
            💡 <strong>Interaction :</strong> Survolez un champ dans "Variables à configurer" pour le mettre en surbrillance ici en temps réel
          </div>
        </div>
      </div>
      
      {/* Cartes des taxonomies avec icônes et couleurs */}
      <div className="space-y-3">
        {selectedTaxonomyData.tags && 
          renderTaxonomyCard(
            'tags', 
            selectedTaxonomyData.tags, 
            'bg-blue-50 text-blue-900', 
            'Tags',
            '🏷️'
          )
        }
        
        {selectedTaxonomyData.platform && 
          renderTaxonomyCard(
            'platform', 
            selectedTaxonomyData.platform, 
            'bg-green-50 text-green-900', 
            'Platform',
            '🚀'
          )
        }
        
        {selectedTaxonomyData.mediaocean && 
          renderTaxonomyCard(
            'mediaocean', 
            selectedTaxonomyData.mediaocean, 
            'bg-orange-50 text-orange-900', 
            'MediaOcean',
            '🌊'
          )
        }
      </div>
    </div>
  );
}