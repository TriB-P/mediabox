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
import { useTranslation } from '../../../contexts/LanguageContext';

// ==================== CONSTANTES ====================

// 🔥 NOUVEAU : Regex pour les double brackets
const TAXONOMY_DOUBLE_BRACKET_REGEX = /\[\[([^:]+):([^\]]+)\]\]/g;

// 🔥 NOUVEAU : Regex combinée pour détecter tous les types de variables
const ALL_VARIABLES_REGEX = /(\[\[([^:]+):([^\]]+)\]\]|\[([^:]+):([^\]]+)\])/g;

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

  const { t } = useTranslation();
  
  // ==================== FONCTIONS UTILITAIRES ====================
  
  const getVariableSource = (variableName: string): 'campaign' | 'tactique' | 'placement' | 'créatif' => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    return variable?.source || 'créatif';
  };

  const hasVariableValue = (variableName: string, format: string): boolean => {
    const formattedValue = getFormattedValue(variableName, format);
    return Boolean(formattedValue && !formattedValue.startsWith('['));
  };

  // 🔥 MODIFIÉ : Scanner TOUS les niveaux (1-6) pour détecter les variables, pas seulement levelsToShow
  const isVariableInSection = useCallback((taxonomy: Taxonomy | undefined, variableName: string): boolean => {
    if (!taxonomy || !variableName) {
      return false;
    }
    
    // 🔥 CORRECTION : Toujours scanner les niveaux 1-6 pour détecter toutes les variables utilisées
    // même si l'aperçu n'affiche que les niveaux 1-4
    const allLevels = [1, 2, 3, 4, 5, 6];
    const levelNames = allLevels.map(level => 
      taxonomy[`NA_Name_Level_${level}` as keyof Taxonomy] as string
    ).filter(Boolean);
    
    const fullStructure = levelNames.join('|');

    // Chercher les single ET double brackets
    const singleBracketRegex = new RegExp(`\\[${variableName}:`);
    const doubleBracketRegex = new RegExp(`\\[\\[${variableName}:`);
    
    return singleBracketRegex.test(fullStructure) || doubleBracketRegex.test(fullStructure);
  }, []); // Pas de dépendance sur levelsToShow car on scanne toujours tous les niveaux

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

  // 🔥 MODIFIÉ : Fonction pour parser toutes les variables (single et double brackets)
  const parseAllVariables = (levelStructure: string) => {
    const variables: Array<{
      fullMatch: string;
      variableName: string;
      format: string;
      index: number;
      length: number;
      isDoubleBracket: boolean;
    }> = [];

    // Parser les double brackets d'abord
    TAXONOMY_DOUBLE_BRACKET_REGEX.lastIndex = 0;
    let match;
    while ((match = TAXONOMY_DOUBLE_BRACKET_REGEX.exec(levelStructure)) !== null) {
      variables.push({
        fullMatch: match[0],
        variableName: match[1],
        format: match[2],
        index: match.index,
        length: match[0].length,
        isDoubleBracket: true
      });
    }

    // Parser les single brackets (en évitant ceux qui sont dans les double brackets)
    TAXONOMY_VARIABLE_REGEX.lastIndex = 0;
    while ((match = TAXONOMY_VARIABLE_REGEX.exec(levelStructure)) !== null) {
      const matchIndex = match.index;
      
      // Vérifier si ce single bracket fait partie d'un double bracket
      const isPartOfDouble = variables.some(variable => 
        variable.isDoubleBracket && 
        matchIndex >= variable.index && 
        matchIndex < variable.index + variable.length
      );

      if (!isPartOfDouble) {
        variables.push({
          fullMatch: match[0],
          variableName: match[1],
          format: match[2],
          index: matchIndex,
          length: match[0].length,
          isDoubleBracket: false
        });
      }
    }

    // Trier par index pour traitement séquentiel
    return variables.sort((a, b) => a.index - b.index);
  };

  // 🔥 MODIFIÉ : Support des double et single brackets
  const renderLevelWithVariables = (levelStructure: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    const variables = parseAllVariables(levelStructure);
    
    variables.forEach((variable, idx) => {
      // Ajouter le texte avant la variable
      if (variable.index > lastIndex) {
        parts.push(levelStructure.substring(lastIndex, variable.index));
      }
      
      const { variableName, format, fullMatch, isDoubleBracket } = variable;
      
      const formattedValue = getFormattedValue(variableName, format);
      const source = getVariableSource(variableName);
      const hasValue = hasVariableValue(variableName, format);
      const isHighlighted = highlightState.activeVariable === variableName;

      const sourceColor = getSourceColor(source);
      
      const highlightClasses = isHighlighted 
        ? 'font-bold ring-2 ring-yellow-400 ring-opacity-75 transform scale-105 transition-all duration-200 shadow-lg z-10 relative' 
        : 'transition-all duration-200';

      // 🔥 NOUVEAU : Appliquer les brackets selon le type de variable
      let content: string;
      if (hasValue) {
        content = isDoubleBracket ? `[${formattedValue}]` : formattedValue;
      } else {
        content = fullMatch; // Garder la variable non résolue telle quelle
      }

      parts.push(
        <span 
          key={`${variable.index}-${idx}`}
          className={`inline-flex items-center px-2 py-1 mx-0.5 my-0.5 text-xs rounded-md ${sourceColor.bg} ${sourceColor.text} ${highlightClasses} ${!hasValue ? 'border-2 border-red-400' : ''}`}
          title={`${t('taxonomyPreview.variableTooltip.variable')}: ${variableName} | ${t('taxonomyPreview.variableTooltip.format')}: ${format} | ${t('taxonomyPreview.variableTooltip.source')}: ${source} | ${t('taxonomyPreview.variableTooltip.type')}: ${isDoubleBracket ? 'Double brackets' : 'Single brackets'}`}
        >
          {content}
        </span>
      );
      
      lastIndex = variable.index + variable.length;
    });

    // Ajouter le texte restant
    if (lastIndex < levelStructure.length) {
      parts.push(levelStructure.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}
      </div>
    );
  };
  
  // 🔥 NOTE : Cette fonction utilise levelsToShow pour l'AFFICHAGE uniquement
  // La détection des variables se fait via isVariableInSection qui scanne tous les niveaux
  const renderTaxonomyStructure = (taxonomy: Taxonomy) => {
    const levels = levelsToShow.map(levelNum => {
      const name = taxonomy[`NA_Name_Level_${levelNum}` as keyof Taxonomy] as string;
      const title = taxonomy[`NA_Name_Level_${levelNum}_Title` as keyof Taxonomy] as string;
      
      return {
        number: levelNum,
        name,
        title: title || `${t('taxonomyPreview.level.title')} ${levelNum}`
      };
    }).filter(level => level.name);

    if (levels.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          {t('taxonomyPreview.level.noneConfigured', { levels: levelsToShow.join(', ') })}
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
        <h4 className="text-md font-medium text-gray-900 mb-2">{t('taxonomyPreview.title')}</h4>
        <p className="text-sm">{t('taxonomyPreview.placeholder.description')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900">
          {t('taxonomyPreview.title')}
        </h4>
        {hasLoadingFields && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
            {t('common.loading')}
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="space-y-2">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">{t('taxonomyPreview.source.title')}</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{t('taxonomyPreview.source.campaign')}</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">{t('taxonomyPreview.source.tactic')}</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">{t('taxonomyPreview.source.placement')}</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">{t('taxonomyPreview.source.creative')}</span>
              <span className="px-2 py-1 bg-white text-black border-2 border-red-400 rounded">{t('taxonomyPreview.source.missingValue')}</span>
            </div>
          </div>
          <div className="text-xs text-gray-600 pt-1">
            {t('taxonomyPreview.helpText.hover')}
            {/* 🔥 NOUVEAU : Ajouter info sur les double brackets */}
            <br />
            <span className="font-medium">Double brackets [[var]]</span> → <span className="font-mono">[valeur]</span> | 
            <span className="font-medium"> Single brackets [var]</span> → <span className="font-mono">valeur</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {selectedTaxonomyData.tags && renderTaxonomyCard('tags', selectedTaxonomyData.tags, 'bg-grey-50 text-grey-900', t('taxonomyPreview.card.tags'))}
        {selectedTaxonomyData.platform && renderTaxonomyCard('platform', selectedTaxonomyData.platform, 'bg-grey-50 text-grey-900', t('taxonomyPreview.card.platform'))}
        {selectedTaxonomyData.mediaocean && renderTaxonomyCard('mediaocean', selectedTaxonomyData.mediaocean, 'bg-grey-50 text-grey-900', t('taxonomyPreview.card.mediaocean'))}
      </div>
    </div>
  );
}