/**
 * Ce fichier définit le composant React `DimensionSidebar`.
 * Il s'agit d'une barre latérale qui affiche une liste de "dimensions" (par exemple, des catégories ou des filtres).
 * Le composant permet à l'utilisateur de sélectionner une dimension dans la liste,
 * et il gère également les états de chargement et les cas où aucune dimension n'est disponible.
 * C'est un composant "client" car il nécessite de l'interactivité côté navigateur.
 */

'use client';

import React from 'react';

interface DimensionSidebarProps {
  dimensions: string[];
  selectedDimension: string;
  onSelectDimension: (dimension: string) => void;
  loading?: boolean;
}

/**
 * Affiche une barre latérale avec une liste de dimensions cliquables.
 * Gère les états de chargement, d'absence de données et l'affichage de la liste.
 * @param {DimensionSidebarProps} props - Les propriétés du composant.
 * @param {string[]} props.dimensions - La liste des dimensions à afficher.
 * @param {string} props.selectedDimension - La dimension actuellement sélectionnée pour la mise en surbrillance.
 * @param {(dimension: string) => void} props.onSelectDimension - La fonction de rappel à exécuter lorsqu'une dimension est sélectionnée.
 * @param {boolean} [props.loading=false] - Un booléen pour indiquer si le composant est en état de chargement.
 * @returns {React.ReactElement} Le composant JSX de la barre latérale.
 */
const DimensionSidebar: React.FC<DimensionSidebarProps> = ({
  dimensions,
  selectedDimension,
  onSelectDimension,
  loading = false
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

  return (
    <div className="w-full md:w-64">
      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Dimensions</h3>
        </div>
        <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {dimensions.map((dimension) => (
            <li key={dimension}>
              <button
                onClick={() => onSelectDimension(dimension)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-100 focus:outline-none transition-colors duration-150 ${
                  selectedDimension === dimension
                    ? 'bg-indigo-50 text-indigo-700 font-medium border-r-2 border-indigo-500'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                title={`Sélectionner la dimension ${dimension}`}
              >
                <span className="block truncate">
                  {dimension}
                </span>
              </button>
            </li>
          ))}
        </ul>
        
        {dimensions.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {dimensions.length} dimension{dimensions.length > 1 ? 's' : ''} disponible{dimensions.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DimensionSidebar;