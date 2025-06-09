// app/components/Tactiques/Placement/TaxonomyPreview.tsx

'use client';

import React from 'react';
import { getSourceColor, getFormatColor } from '../../../config/taxonomyFields';
import { Taxonomy } from '../../../types/taxonomy';
import type {
  ParsedTaxonomyVariable,
  TaxonomyValues
} from '../../../types/tactiques';

// ==================== TYPES ====================

interface FieldState {
  config: any;
  options: Array<{ id: string; label: string; code?: string }>;
  hasCustomList: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  error?: string;
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
  onToggleExpansion: (taxonomyType: 'tags' | 'platform' | 'mediaocean') => void;
  getFormattedValue: (variableName: string) => string; // 🔥 NOUVEAU
  getFormattedPreview: (taxonomyType: 'tags' | 'platform' | 'mediaocean') => string; // 🔥 NOUVEAU
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
  onToggleExpansion,
  getFormattedValue, // 🔥 NOUVEAU
  getFormattedPreview // 🔥 NOUVEAU
}: TaxonomyPreviewProps) {

  // ==================== FONCTIONS UTILITAIRES ====================
  
  /**
   * 🔥 NOUVEAU : Détermine la source d'une variable pour la coloration
   */
  const getVariableSource = (variableName: string): 'campaign' | 'tactique' | 'manual' => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    return variable?.source || 'manual';
  };

  /**
   * 🔥 NOUVEAU : Détermine le format d'une variable pour la coloration
   */
  const getVariableFormat = (variableName: string): string => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    return variable?.format || 'display_fr';
  };

  /**
   * 🔥 NOUVEAU : Vérifie si une variable a une valeur définie
   */
  const hasVariableValue = (variableName: string): boolean => {
    const formattedValue = getFormattedValue(variableName);
    return Boolean(formattedValue && formattedValue.trim() !== '' && !formattedValue.startsWith('['));
  };

  // ==================== FONCTIONS DE RENDU ====================
  
  /**
   * 🔥 NOUVEAU : Rend un niveau de taxonomie avec formatage intelligent
   */
  const renderLevelWithVariables = (levelStructure: string) => {
    // Utiliser une regex pour trouver et remplacer toutes les variables [VARIABLE:format]
    const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
    
    // Remplacer chaque variable par sa valeur résolue avec le bon style
    const resolvedStructure = levelStructure.replace(VARIABLE_REGEX, (match, variableName, format) => {
      const formattedValue = getFormattedValue(variableName);
      const source = getVariableSource(variableName);
      const hasValue = hasVariableValue(variableName);
      
      if (hasValue) {
        // Variable avec valeur : utiliser les couleurs de source et format
        const sourceColor = getSourceColor(source);
        const formatColor = getFormatColor(format as any);
        
        return `<span class="inline-flex items-center px-2 py-1 mr-1 text-xs rounded-md ${sourceColor.bg} ${sourceColor.text} border ${formatColor.border}" title="Source: ${source} | Format: ${format} | Valeur: ${formattedValue}">${formattedValue}</span>`;
      } else {
        // Variable sans valeur : afficher le placeholder en rouge
        return `<span class="inline-flex items-center px-2 py-1 mr-1 text-xs rounded-md bg-red-100 text-red-800 border border-red-300" title="Valeur manquante | Variable: ${variableName} | Format: ${format}">${match}</span>`;
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
   * 🔥 NOUVEAU : Rend la structure complète d'une taxonomie avec aperçu formaté
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
    ].filter(level => level.name); // Garder seulement les niveaux définis

    // 🔥 NOUVEAU : Aperçu formaté complet
    const fullPreview = getFormattedPreview(taxonomyType);
    
    return (
      <div className="space-y-4">
        {/* Aperçu formaté complet */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm font-medium text-green-900 mb-2 flex items-center">
            <span className="mr-2">🎯</span>
            Aperçu final formaté
          </div>
          <div className="font-mono text-sm text-green-800 bg-white p-2 rounded border">
            {fullPreview || (
              <span className="text-gray-500 italic">Aucune variable configurée</span>
            )}
          </div>
        </div>

        {/* Détail par niveau */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-700 mb-3">Détail par niveau :</div>
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
      </div>
    );
  };

  /**
   * 🔥 NOUVEAU : Rend une carte de taxonomie avec les nouvelles fonctionnalités
   */
  const renderTaxonomyCard = (
    type: 'tags' | 'platform' | 'mediaocean',
    taxonomy: Taxonomy,
    colorClass: string,
    label: string
  ) => {
    const fullPreview = getFormattedPreview(type);
    const hasValidPreview = fullPreview && !fullPreview.includes('[');
    
    return (
      <div key={type} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
            {/* 🔥 NOUVEAU : Indicateur de statut */}
            {hasValidPreview ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                ✓ Configuré
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                ⚠ En attente
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
        
        {/* 🔥 NOUVEAU : Aperçu condensé quand fermé */}
        {!expandedPreviews[type] && hasValidPreview && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Aperçu :</div>
            <div className="font-mono text-xs text-gray-800 truncate">
              {fullPreview}
            </div>
          </div>
        )}
        
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
      
      {/* 🔥 NOUVELLE : Légende enrichie des couleurs */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Légende :</div>
        <div className="space-y-2">
          {/* Sources */}
          <div>
            <div className="text-xs text-gray-600 mb-1">Sources des données :</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Campagne</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Tactique</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">Placement</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Manquant</span>
            </div>
          </div>
          {/* Formats */}
          <div>
            <div className="text-xs text-gray-600 mb-1">Formats de données :</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded border border-purple-300">Code</span>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded border border-indigo-300">FR</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded border border-blue-300">EN</span>
              <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded border border-cyan-300">UTM</span>
              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded border border-amber-300">Libre</span>
            </div>
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