// app/components/Tactiques/TaxonomyPreview.tsx

'use client';

import React from 'react';
import { getSourceColor } from '../../config/taxonomyFields';
import { Taxonomy } from '../../types/taxonomy';
import type {
  ParsedTaxonomyVariable,
  TaxonomyValues
} from '../../types/tactiques';

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
  onToggleExpansion
}: TaxonomyPreviewProps) {

  // ==================== FONCTIONS UTILITAIRES ====================
  
  // Fonction pour résoudre la valeur d'une variable avec support des formats
  const resolveVariableValue = (variableName: string, format?: string): string => {
    // 1. Vérifier d'abord les valeurs manuelles
    const manualValue = taxonomyValues[variableName];
    if (manualValue?.value) {
      // Si c'est une valeur sélectionnée depuis une liste, récupérer le bon format
      if (format && format !== 'custom') {
        const fieldKey = `${variableName}_${format}`;
        const fieldState = fieldStates[fieldKey];
        
        if (fieldState?.options) {
          const selectedOption = fieldState.options.find(opt => opt.id === manualValue.value);
          if (selectedOption) {
            // Utiliser le code au lieu de l'ID si le format est 'code'
            if (format === 'code' && selectedOption.code) {
              return selectedOption.code;
            }
            // Pour les autres formats, utiliser le label (qui contient déjà le bon format)
            return selectedOption.label;
          }
        }
      }
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
  };

  // ==================== FONCTIONS DE RENDU ====================
  
  const renderLevelWithVariables = (levelStructure: string) => {
    // Utiliser une regex pour trouver et remplacer toutes les variables [VARIABLE:format]
    const VARIABLE_REGEX = /\[([^:]+):([^\]]+)\]/g;
    
    // Remplacer chaque variable par sa valeur résolue
    const resolvedStructure = levelStructure.replace(VARIABLE_REGEX, (match, variableName, format) => {
      const resolvedValue = resolveVariableValue(variableName, format);
      
      // Si la valeur est résolue, l'afficher avec une couleur selon la source
      if (resolvedValue && resolvedValue !== `[${variableName}]`) {
        // Déterminer la source de la variable pour la couleur
        const variable = parsedVariables.find(v => v.variable === variableName);
        const sourceColor = variable ? getSourceColor(variable.source) : getSourceColor(null);
        
        return `<span class="px-1 py-0.5 text-xs rounded ${sourceColor.bg} ${sourceColor.text}" title="Source: ${variable?.source || 'inconnue'} | Format: ${format}">${resolvedValue}</span>`;
      }
      
      // Sinon afficher le placeholder original en rouge
      return `<span class="px-1 py-0.5 text-xs rounded bg-red-100 text-red-800" title="Valeur manquante | Format: ${format}">${match}</span>`;
    });
    
    // Retourner un élément dangerouslySetInnerHTML pour le rendu HTML
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: resolvedStructure }}
        className="whitespace-pre-wrap"
      />
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
        {levels.map((level) => (
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

  const renderTaxonomyCard = (
    type: 'tags' | 'platform' | 'mediaocean',
    taxonomy: Taxonomy,
    colorClass: string,
    label: string
  ) => (
    <div key={type} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleExpansion(type);
        }}
        className={`w-full px-4 py-3 ${colorClass} border-b border-gray-200 text-left flex items-center justify-between hover:opacity-80 transition-colors`}
      >
        <span className="font-medium">
          {label}
        </span>
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
          {renderTaxonomyStructureWithTitles(taxonomy)}
        </div>
      )}
    </div>
  );

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
      
      {/* Légende des couleurs */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Légende des sources :</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Campagne</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Tactique</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">Placement</span>
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Manquant</span>
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