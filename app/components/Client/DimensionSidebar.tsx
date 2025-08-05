/**
 * app/components/Client/DimensionSidebar.tsx
 * * Version améliorée avec fonctionnalité de recherche à travers les dimensions
 * et interface plus claire pour identifier les listes personnalisées.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { StarIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

interface DimensionSidebarProps {
  dimensions: string[];
  selectedDimension: string;
  onSelectDimension: (dimension: string) => void;
  loading?: boolean;
  clientId?: string;
  customDimensions?: Set<string>;
}

/**
 * Affiche une barre latérale avec recherche et liste de dimensions cliquables.
 * Inclut des icônes pour identifier les dimensions avec des listes personnalisées.
 * @param {DimensionSidebarProps} props - Les propriétés du composant.
 * @param {string[]} props.dimensions - La liste des dimensions à afficher.
 * @param {string} props.selectedDimension - La dimension actuellement sélectionnée.
 * @param {(dimension: string) => void} props.onSelectDimension - Fonction appelée lors de la sélection.
 * @param {boolean} [props.loading=false] - État de chargement.
 * @param {string} [props.clientId] - ID du client pour identifier les listes custom.
 * @param {Set<string>} [props.customDimensions] - Set des dimensions ayant des listes personnalisées.
 * @returns {React.ReactElement} Le composant JSX de la barre latérale.
 */
const DimensionSidebar: React.FC<DimensionSidebarProps> = ({
  dimensions,
  selectedDimension,
  onSelectDimension,
  loading = false,
  clientId,
  customDimensions = new Set()
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Fonction pour formater les noms de dimensions de façon plus lisible
  const formatDimensionName = (dimension: string): string => {
    return dimension
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Filtrer les dimensions selon la recherche
  const filteredDimensions = useMemo(() => {
    if (!searchQuery.trim()) return dimensions;
    
    const searchLower = searchQuery.toLowerCase();
    return dimensions.filter(dimension => {
      const formattedName = formatDimensionName(dimension);
      return (
        dimension.toLowerCase().includes(searchLower) ||
        formattedName.toLowerCase().includes(searchLower)
      );
    });
  }, [dimensions, searchQuery]);

  // Séparer les dimensions personnalisées et standard pour l'affichage
  const sortedDimensions = useMemo(() => {
    return filteredDimensions.sort((a, b) => {
      const aIsCustom = customDimensions.has(a);
      const bIsCustom = customDimensions.has(b);
      
      // Les listes personnalisées en premier
      if (aIsCustom && !bIsCustom) return -1;
      if (!aIsCustom && bIsCustom) return 1;
      
      // Puis tri alphabétique
      return formatDimensionName(a).localeCompare(formatDimensionName(b));
    });
  }, [filteredDimensions, customDimensions]);

  const hasCustomList = (dimension: string): boolean => {
    return customDimensions.has(dimension);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="w-full md:w-80">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">{t('dimensionSidebar.header.title')}</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="h-10 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (dimensions.length === 0) {
    return (
      <div className="w-full md:w-80">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">{t('dimensionSidebar.header.title')}</h3>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500">{t('dimensionSidebar.status.noDimensionsAvailable')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-80">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* En-tête avec titre et statistiques */}
        <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800">{t('dimensionSidebar.header.title')}</h3>
            {customDimensions.size > 0 && (
              <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <StarIcon className="h-3 w-3 mr-1" />
                <span>{customDimensions.size} {customDimensions.size > 1 ? t('dimensionSidebar.header.customPersonalized_plural') : t('dimensionSidebar.header.customPersonalized')}</span>
              </div>
            )}
          </div>
          
          {/* Barre de recherche */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder={t('dimensionSidebar.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Liste des dimensions */}
        <div className="max-h-96 overflow-y-auto">
          {searchQuery && filteredDimensions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">
                {t('dimensionSidebar.search.noMatch')} "{searchQuery}"
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sortedDimensions.map((dimension) => {
                const isCustom = hasCustomList(dimension);
                const isSelected = selectedDimension === dimension;
                const formattedName = formatDimensionName(dimension);
                
                return (
                  <li key={dimension}>
                    <button
                      onClick={() => onSelectDimension(dimension)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none transition-all duration-150 group ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-medium border-r-4 border-indigo-500'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                      title={`${t('dimensionSidebar.list.selectDimension')} ${formattedName}${isCustom ? ` (${t('dimensionSidebar.list.customListTooltip')})` : ` (${t('dimensionSidebar.list.pluscoListTooltip')})`}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            {isCustom && (
                              <StarIcon 
                                className={`h-4 w-4 mr-2 flex-shrink-0 ${
                                  isSelected ? 'text-amber-500' : 'text-amber-400'
                                }`} 
                                title={t('dimensionSidebar.list.customListTitle')}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium truncate ${
                                isSelected ? 'text-indigo-700' : 'text-gray-900'
                              }`}>
                                {dimension}
                              </p>
                        
                            </div>
                          </div>
                        </div>
                        
                        {/* Indicateur de type de liste */}
                        <div className="ml-2 flex-shrink-0">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isCustom
                              ? isSelected 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-amber-50 text-amber-700'
                              : isSelected
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isCustom ? t('dimensionSidebar.list.customBadge') : t('dimensionSidebar.list.pluscoBadge')}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        {/* Pied avec statistiques */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {searchQuery ? (
                <>
                  {filteredDimensions.length} {filteredDimensions.length > 1 ? t('dimensionSidebar.footer.results') : t('dimensionSidebar.footer.result')} {t('common.on')} {dimensions.length}
                </>
              ) : (
                <>
                  {dimensions.length} {dimensions.length > 1 ? t('dimensionSidebar.footer.dimensionsAvailable') : t('dimensionSidebar.footer.dimensionAvailable')}
                </>
              )}
            </span>
            

          </div>
        </div>
      </div>
    </div>
  );
};

export default DimensionSidebar;