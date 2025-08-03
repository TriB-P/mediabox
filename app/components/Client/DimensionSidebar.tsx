/**
 * app/components/Client/DimensionSidebar.tsx
 * 
 * Version mise à jour avec des icônes pour identifier les dimensions 
 * qui ont des listes personnalisées pour le client sélectionné.
 */

'use client';

import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface DimensionSidebarProps {
  dimensions: string[];
  selectedDimension: string;
  onSelectDimension: (dimension: string) => void;
  loading?: boolean;
  clientId?: string;
  customDimensions?: Set<string>;
}

/**
 * Affiche une barre latérale avec une liste de dimensions cliquables.
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
  if (loading) {
    return (
      <div className="w-full md:w-64">
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Dimensions</h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="h-8 bg-gray-200 rounded animate-pulse"
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
      <div className="w-full md:w-64">
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Dimensions</h3>
          </div>
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">Aucune dimension disponible</p>
          </div>
        </div>
      </div>
    );
  }

  const hasCustomList = (dimension: string): boolean => {
    return customDimensions.has(dimension);
  };

  return (
    <div className="w-full md:w-64">
      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Dimensions</h3>
            {customDimensions.size > 0 && (
              <div className="flex items-center text-xs text-amber-600">
                <StarIcon className="h-3 w-3 mr-1" />
                <span>Custom</span>
              </div>
            )}
          </div>
        </div>
        <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {dimensions.map((dimension) => {
            const isCustom = hasCustomList(dimension);
            const isSelected = selectedDimension === dimension;
            
            return (
              <li key={dimension}>
                <button
                  onClick={() => onSelectDimension(dimension)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 focus:outline-none transition-colors duration-150 ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-medium border-r-2 border-indigo-500'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                  title={`Sélectionner la dimension ${dimension}${isCustom ? ' (liste personnalisée)' : ' (liste PlusCo)'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="block truncate flex-1">
                      {dimension}
                    </span>
                    {isCustom && (
                      <div className="ml-2 flex-shrink-0">
                        {isSelected ? (
                          <StarIcon className="h-4 w-4 text-amber-500" title="Liste personnalisée" />
                        ) : (
                          <StarIcon className="h-4 w-4 text-amber-400" title="Liste personnalisée" />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        
        {dimensions.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {dimensions.length} dimension{dimensions.length > 1 ? 's' : ''} disponible{dimensions.length > 1 ? 's' : ''}
              </span>
              {customDimensions.size > 0 && (
                <div className="flex items-center text-amber-600">
                  <StarIcon className="h-3 w-3 mr-1" />
                  <span>{customDimensions.size} personnalisée{customDimensions.size > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DimensionSidebar;