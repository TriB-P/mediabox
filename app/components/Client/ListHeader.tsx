/**
 * Ce fichier définit le composant ListHeader, qui sert d'en-tête pour les listes
 * de questions. Il affiche des informations contextuelles comme la dimension sélectionnée,
 * si la liste est personnalisée ou par défaut, et propose des actions comme la création
 * ou la suppression d'une liste personnalisée en fonction des permissions de l'utilisateur.
 */
'use client';

import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

interface ListHeaderProps {
  selectedDimension: string;
  isCustomList: boolean;
  clientName: string;
  hasPermission: boolean;
  onCreateCustomList: () => void;
  onDeleteCustomList: () => void;
}

/**
 * Affiche l'en-tête d'une liste de questions.
 * Fournit des informations sur la dimension et le type de liste (par défaut ou personnalisée).
 * Permet aux utilisateurs autorisés de créer une liste personnalisée à partir d'une liste par défaut,
 * ou de supprimer une liste personnalisée existante.
 *
 * @param {string} selectedDimension - La dimension actuellement affichée.
 * @param {boolean} isCustomList - Indique si la liste affichée est une liste personnalisée.
 * @param {string} clientName - Le nom du client, utilisé dans les descriptions.
 * @param {boolean} hasPermission - Indique si l'utilisateur a les droits pour créer/supprimer des listes.
 * @param {() => void} onCreateCustomList - La fonction à appeler pour créer une liste personnalisée.
 * @param {() => void} onDeleteCustomList - La fonction à appeler pour supprimer la liste personnalisée.
 * @returns {React.ReactElement | null} Le composant JSX de l'en-tête, ou null si aucune dimension n'est sélectionnée.
 */
const ListHeader: React.FC<ListHeaderProps> = ({
  selectedDimension,
  isCustomList,
  clientName,
  hasPermission,
  onCreateCustomList,
  onDeleteCustomList
}) => {
  if (!selectedDimension) {
    return null;
  }

  return (
    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-md font-medium text-gray-700">
            Dimension: <span className="text-indigo-600">{selectedDimension}</span> -
            {isCustomList ? (
              <span className="text-green-600 ml-2">Liste personnalisée</span>
            ) : (
              <span className="text-amber-600 ml-2">Liste par défaut (PlusCo)</span>
            )}
          </h3>
          <p className="text-sm text-gray-500">
            {isCustomList
              ? `Liste spécifique au client ${clientName}`
              : `Liste commune (PlusCo)`
            }
          </p>
        </div>

        <div className="flex space-x-2">
          {!isCustomList ? (
            <button
              onClick={onCreateCustomList}
              className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md transition-colors duration-150 ${
                hasPermission
                  ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
              disabled={!hasPermission}
              title={!hasPermission ? "Vous n'avez pas la permission de créer une liste personnalisée" : "Créer une liste personnalisée basée sur la liste PlusCo"}
            >
              Créer une liste personnalisée
            </button>
          ) : (
            <button
              onClick={onDeleteCustomList}
              className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md transition-colors duration-150 ${
                hasPermission
                  ? 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
              disabled={!hasPermission}
              title={!hasPermission ? "Vous n'avez pas la permission de supprimer cette liste" : "Supprimer cette liste personnalisée"}
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Supprimer cette liste
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListHeader;