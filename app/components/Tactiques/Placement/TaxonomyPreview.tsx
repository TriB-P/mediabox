// app/components/Tactiques/Placement/TaxonomyPreview.tsx

'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { getSourceColor } from '../../../config/taxonomyFields';
import { Taxonomy } from '../../../types/taxonomy';
import type {
  ParsedTaxonomyVariable,
  HighlightState
} from '../../../types/tactiques';
import { TAXONOMY_VARIABLE_REGEX } from '../../../config/taxonomyFields';
import { StarIcon } from 'lucide-react';


// ==================== TYPES ====================

interface TaxonomyPreviewProps {
  parsedVariables: ParsedTaxonomyVariable[];
  selectedTaxonomyData: {
    tags?: Taxonomy;
    platform?: Taxonomy;
    mediaocean?: Taxonomy;
  };
  expandedPreviews: {
    tags: boolean;
    platform: boolean;
    mediaocean: boolean;
  };
  hasLoadingFields: boolean;
  highlightState: HighlightState;
  onToggleExpansion: (taxonomyType: 'tags' | 'platform' | 'mediaocean') => void;
  getFormattedValue: (variableName: string, format: string) => string;
  getFormattedPreview: (taxonomyType: 'tags' | 'platform' | 'mediaocean') => string;
  levelsToShow?: number[]; // 🔥 NOUVEAU : Niveaux à afficher (par défaut [1,2,3,4] pour placements)
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function TaxonomyPreview({
  parsedVariables,
  selectedTaxonomyData,
  expandedPreviews,
  hasLoadingFields,
  highlightState,
  onToggleExpansion,
  getFormattedValue,
  getFormattedPreview,
  levelsToShow = [1, 2, 3, 4] // 🔥 NOUVEAU : Par défaut niveaux 1-4 (placements)
}: TaxonomyPreviewProps) {

  // ==================== FONCTIONS UTILITAIRES ====================
  
  const getVariableSource = (variableName: string): 'campaign' | 'tactique' | 'placement' | 'créatif' => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    return variable?.source || 'créatif';
  };

  const hasVariableValue = (variableName: string, format: string): boolean => {
    const formattedValue = getFormattedValue(variableName, format);
    return Boolean(formattedValue && !formattedValue.startsWith('['));
  };

  const isVariableInSection = useCallback((taxonomy: Taxonomy | undefined, variableName: string): boolean => {
    if (!taxonomy || !variableName) {
      return false;
    }
    
    // 🔥 NOUVEAU : Construire la structure selon les niveaux à afficher
    const levelNames = levelsToShow.map(level => 
      taxonomy[`NA_Name_Level_${level}` as keyof Taxonomy] as string
    ).filter(Boolean);
    
    const fullStructure = levelNames.join('|');

    const variableRegex = new RegExp(`\\[${variableName}:`);
    return variableRegex.test(fullStructure);
  }, [levelsToShow]);

// Remplacer le useMemo par un useState + useEffect
const [previewCache, setPreviewCache] = useState<{
  tags: string;
  platform: string;
  mediaocean: string;
}>({ tags: '', platform: '', mediaocean: '' });

// Nouveau useEffect pour gérer l'async
useEffect(() => {
  const updatePreviews = async () => {
    const [tags, platform, mediaocean] = await Promise.all([
      selectedTaxonomyData.tags ? getFormattedPreview('tags') : '',
      selectedTaxonomyData.platform ? getFormattedPreview('platform') : '',
      selectedTaxonomyData.mediaocean ? getFormattedPreview('mediaocean') : '',
    ]);
    
    setPreviewCache({ tags, platform, mediaocean });
  };
  
  updatePreviews();
}, [getFormattedPreview, selectedTaxonomyData, highlightState]);

const getMemoizedPreview = useCallback((taxonomyType: 'tags' | 'platform' | 'mediaocean') => {
  return previewCache[taxonomyType];
}, [previewCache]);


  const renderLevelWithVariables = (levelStructure: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    TAXONOMY_VARIABLE_REGEX.lastIndex = 0;
    
    let match;
    while ((match = TAXONOMY_VARIABLE_REGEX.exec(levelStructure)) !== null) {
      if (match.index > lastIndex) {
        parts.push(levelStructure.substring(lastIndex, match.index));
      }
      
      const [fullMatch, variableName, format] = match;
      
      const formattedValue = getFormattedValue(variableName, format);
      const source = getVariableSource(variableName);
      const hasValue = hasVariableValue(variableName, format);
      const isHighlighted = highlightState.activeVariable === variableName;

      const sourceColor = getSourceColor(source);
      
      const highlightClasses = isHighlighted 
        ? 'font-bold ring-2 ring-yellow-400 ring-opacity-75 transform scale-105 transition-all duration-200 shadow-lg z-10 relative' 
        : 'transition-all duration-200';

      const content = hasValue ? formattedValue : fullMatch;

      parts.push(
        <span 
          key={match.index}
          className={`inline-flex items-center px-2 py-1 mx-0.5 my-0.5 text-xs rounded-md ${sourceColor.bg} ${sourceColor.text} ${highlightClasses} ${!hasValue ? 'border-2 border-red-400' : ''}`}
          title={`Variable: ${variableName} | Format: ${format} | Source: ${source}`}
        >
          {content}
        </span>
      );
      
      lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < levelStructure.length) {
      parts.push(levelStructure.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}
      </div>
    );
  };
  
  // 🔥 NOUVEAU : Fonction modifiée pour afficher seulement les niveaux demandés
  const renderTaxonomyStructure = (taxonomy: Taxonomy) => {
    const levels = levelsToShow.map(levelNum => {
      const name = taxonomy[`NA_Name_Level_${levelNum}` as keyof Taxonomy] as string;
      const title = taxonomy[`NA_Name_Level_${levelNum}_Title` as keyof Taxonomy] as string;
      
      return {
        number: levelNum,
        name,
        title: title || `Niveau ${levelNum}`
      };
    }).filter(level => level.name);

    if (levels.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          Aucun niveau {levelsToShow.join(', ')} configuré pour cette taxonomie
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {levels.map((level) => (
          <div key={level.number} className="border-l-2 border-gray-300 pl-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {level.title}
            </div>
            <div className="text-sm text-gray-900 font-mono bg-white p-2 rounded border">
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
  ) => {
    const showStar = highlightState.activeVariable && isVariableInSection(taxonomy, highlightState.activeVariable);
    
    return (
      <div key={`${type}-${highlightState.activeVariable}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleExpansion(type); }}
          className={`w-full px-4 py-3 ${colorClass} border-b border-gray-200 text-left flex items-center justify-between hover:opacity-80 transition-colors`}
        >
          <div className="flex items-center space-x-2">
            <span className="font-medium">{label}</span>
            {showStar && <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400" />}

          </div>
          <span>{expandedPreviews[type] ? '−' : '+'}</span>
        </button>
        
        {expandedPreviews[type] && <div className="p-4">{renderTaxonomyStructure(taxonomy)}</div>}
      </div>
    );
  };
  
  if (parsedVariables.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-2">Aperçu des taxonomies</h4>
        <p className="text-sm">L'aperçu apparaîtra une fois les taxonomies sélectionnées et analysées.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900">
          Aperçu des taxonomies
        </h4>
        {hasLoadingFields && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
            Chargement...
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="space-y-2">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Source de la valeur :</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Campagne</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Tactique</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">Placement</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">Créatif</span>
              <span className="px-2 py-1 bg-white text-black border-2 border-red-400 rounded">Valeur manquante</span>
            </div>
          </div>
          <div className="text-xs text-gray-600 pt-1">
            💡 Survolez un champ à configurer pour le mettre en surbrillance ici.
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {selectedTaxonomyData.tags && renderTaxonomyCard('tags', selectedTaxonomyData.tags, 'bg-grey-50 text-grey-900', 'Tags')}
        {selectedTaxonomyData.platform && renderTaxonomyCard('platform', selectedTaxonomyData.platform, 'bg-grey-50 text-grey-900', 'Platform')}
        {selectedTaxonomyData.mediaocean && renderTaxonomyCard('mediaocean', selectedTaxonomyData.mediaocean, 'bg-grey-50 text-grey-900', 'MediaOcean')}
      </div>
    </div>
  );
}