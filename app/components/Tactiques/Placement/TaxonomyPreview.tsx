/**
 * Ce fichier définit le composant `TaxonomyPreview`, un composant React côté client.
 * Son rôle est d'afficher un aperçu en temps réel de la structure des taxonomies (comme les tags de suivi)
 * pour un placement publicitaire. Il visualise comment les variables (issues de la campagne, de la tactique, etc.)
 * sont résolues et insérées dans les modèles de taxonomie. Le composant met en évidence les variables,
 * indique leur source, et permet à l'utilisateur d'explorer les différentes sections de taxonomie.
 */
'use client';

import React, { useMemo, useCallback } from 'react';
import { getSourceColor } from '../../../config/taxonomyFields';
import { Taxonomy } from '../../../types/taxonomy';
import type {
  ParsedTaxonomyVariable,
  TaxonomyValues,
  HighlightState
} from '../../../types/tactiques';
import { TAXONOMY_VARIABLE_REGEX } from '../../../config/taxonomyFields';
import { StarIcon } from 'lucide-react';

interface TaxonomyPreviewProps {
  parsedVariables: ParsedTaxonomyVariable[];
  selectedTaxonomyData: {
    tags?: Taxonomy;
    platform?: Taxonomy;
    mediaocean?: Taxonomy;
  };
  taxonomyValues: TaxonomyValues;
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
  levelsToShow?: number[];
}

/**
 * Composant principal qui affiche les aperçus des différentes taxonomies.
 * Il prend en charge la visualisation des variables, la mise en surbrillance, et l'affichage conditionnel des niveaux de la taxonomie.
 * @param {TaxonomyPreviewProps} props - Les propriétés du composant.
 * @param {ParsedTaxonomyVariable[]} props.parsedVariables - La liste des variables extraites des taxonomies.
 * @param {object} props.selectedTaxonomyData - Les données des taxonomies sélectionnées (tags, platform, mediaocean).
 * @param {TaxonomyValues} props.taxonomyValues - Les valeurs actuelles résolues pour chaque variable.
 * @param {object} props.expandedPreviews - L'état d'expansion (ouvert/fermé) de chaque aperçu de taxonomie.
 * @param {boolean} props.hasLoadingFields - Indicateur pour savoir si des champs sont en cours de chargement.
 * @param {HighlightState} props.highlightState - L'état de la mise en surbrillance d'une variable.
 * @param {(taxonomyType: 'tags' | 'platform' | 'mediaocean') => void} props.onToggleExpansion - Callback pour basculer l'état d'expansion d'un aperçu.
 * @param {(variableName: string, format: string) => string} props.getFormattedValue - Fonction pour obtenir la valeur formatée d'une variable.
 * @param {(taxonomyType: 'tags' | 'platform' | 'mediaocean') => string} props.getFormattedPreview - Fonction pour obtenir l'aperçu formaté complet d'une taxonomie.
 * @param {number[]} [props.levelsToShow=[1, 2, 3, 4]] - Les numéros des niveaux de taxonomie à afficher.
 * @returns {React.ReactElement} Le composant d'aperçu des taxonomies.
 */
export default function TaxonomyPreview({
  parsedVariables,
  selectedTaxonomyData,
  taxonomyValues,
  expandedPreviews,
  hasLoadingFields,
  highlightState,
  onToggleExpansion,
  getFormattedValue,
  getFormattedPreview,
  levelsToShow = [1, 2, 3, 4]
}: TaxonomyPreviewProps) {

  /**
   * Détermine la source d'une variable donnée (campagne, tactique, etc.).
   * @param {string} variableName - Le nom de la variable à rechercher.
   * @returns {'campaign' | 'tactique' | 'placement' | 'manual'} La source de la variable.
   */
  const getVariableSource = (variableName: string): 'campaign' | 'tactique' | 'placement' | 'manual' => {
    const variable = parsedVariables.find(v => v.variable === variableName);
    return variable?.source || 'manual';
  };

  /**
   * Vérifie si une variable a une valeur concrète qui a été résolue.
   * @param {string} variableName - Le nom de la variable.
   * @param {string} format - Le format de la variable (peut être nécessaire pour la fonction `getFormattedValue`).
   * @returns {boolean} `true` si la variable a une valeur, sinon `false`.
   */
  const hasVariableValue = (variableName: string, format: string): boolean => {
    const formattedValue = getFormattedValue(variableName, format);
    return Boolean(formattedValue && !formattedValue.startsWith('['));
  };

  /**
   * Vérifie si une variable spécifique est présente dans la structure d'une taxonomie donnée, en se basant sur les niveaux à afficher.
   * La fonction est mémoïsée avec `useCallback` pour optimiser les performances.
   * @param {Taxonomy | undefined} taxonomy - L'objet de taxonomie à inspecter.
   * @param {string} variableName - Le nom de la variable à rechercher.
   * @returns {boolean} `true` si la variable est trouvée dans la structure, sinon `false`.
   */
  const isVariableInSection = useCallback((taxonomy: Taxonomy | undefined, variableName: string): boolean => {
    if (!taxonomy || !variableName) {
      return false;
    }
    
    const levelNames = levelsToShow.map(level => 
      taxonomy[`NA_Name_Level_${level}` as keyof Taxonomy] as string
    ).filter(Boolean);
    
    const fullStructure = levelNames.join('|');

    const variableRegex = new RegExp(`\\[${variableName}:`);
    return variableRegex.test(fullStructure);
  }, [levelsToShow]);

  /**
   * Mémoïse la fonction qui retourne l'aperçu formaté d'une taxonomie.
   * `useMemo` est utilisé ici pour éviter de recalculer inutilement l'aperçu à chaque rendu,
   * tant que les dépendances (`getFormattedPreview`, `taxonomyValues`, etc.) n'ont pas changé.
   */
  const getMemoizedPreview = useMemo(() => {
    return (taxonomyType: 'tags' | 'platform' | 'mediaocean') => {
      return getFormattedPreview(taxonomyType);
    };
  }, [getFormattedPreview, taxonomyValues, selectedTaxonomyData, highlightState]);

  /**
   * Génère le rendu d'un seul niveau de la structure de taxonomie. Il analyse la chaîne de structure,
   * trouve les placeholders de variables, et les remplace par des éléments React stylisés qui affichent
   * la valeur résolue, la source, et l'état de surbrillance.
   * @param {string} levelStructure - La chaîne de caractères représentant la structure du niveau.
   * @returns {React.ReactElement} Un élément `div` contenant le niveau rendu avec les variables stylisées.
   */
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
  
  /**
   * Génère le rendu de la structure complète d'une taxonomie en se basant sur les niveaux spécifiés dans `levelsToShow`.
   * Pour chaque niveau, il affiche un titre et le contenu rendu par `renderLevelWithVariables`.
   * @param {Taxonomy} taxonomy - L'objet de taxonomie à rendre.
   * @returns {React.ReactElement} Un élément `div` contenant la structure complète des niveaux de la taxonomie.
   */
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
  
  /**
   * Génère le rendu d'une 'carte' pour un type de taxonomie spécifique (ex: Tags).
   * Cette carte inclut un en-tête cliquable pour déplier/replier le contenu et affiche la structure de la taxonomie si elle est dépliée.
   * @param {'tags' | 'platform' | 'mediaocean'} type - Le type de taxonomie.
   * @param {Taxonomy} taxonomy - Les données de la taxonomie.
   * @param {string} colorClass - La classe CSS pour la couleur de fond de l'en-tête.
   * @param {string} label - L'étiquette à afficher dans l'en-tête de la carte.
   * @returns {React.ReactElement} Un composant de carte pour la taxonomie.
   */
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