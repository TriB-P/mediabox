// app/components/AdOps/AdOpsTacticList.tsx
/**
 * Composant AdOpsTacticList
 * Ce composant affiche une liste sélectionnable des tactiques AdOps filtrées.
 * Permet de sélectionner une tactique pour afficher ses détails dans un autre composant.
 * MODIFIÉ : Reçoit les données via props au lieu d'utiliser directement le hook
 */
'use client';

import React, { useState } from 'react';
import { getCachedAllShortcodes, getListForClient } from '../../lib/cacheService';
import { useClient } from '../../contexts/ClientContext';

interface AdOpsTactique {
  id: string;
  TC_Label?: string;
  TC_Publisher?: string;
  TC_Media_Type?: string;
  TC_Prog_Buying_Method?: string;
  ongletName: string;
  sectionName: string;
  placementsWithTags: any[];
}

interface AdOpsTacticListProps {
  filteredTactiques: AdOpsTactique[];
  loading: boolean;
  error: string | null;
  onTactiqueSelect?: (tactique: AdOpsTactique | null) => void;
  selectedTactique?: AdOpsTactique | null;
}

/**
 * Composant principal pour la liste des tactiques AdOps.
 * Affiche les tactiques filtrées avec sélection unique.
 *
 * @param {AdOpsTacticListProps} props - Les propriétés du composant
 * @returns {JSX.Element} Le composant AdOpsTacticList
 */
export default function AdOpsTacticList({ 
  filteredTactiques,
  loading,
  error,
  onTactiqueSelect,
  selectedTactique
}: AdOpsTacticListProps) {
  const { selectedClient } = useClient();

  /**
   * Récupère le nom d'affichage d'un shortcode depuis le cache
   */
  const getDisplayName = (shortcodeId: string | undefined, listType: string): string => {
    if (!shortcodeId || shortcodeId.trim() === '') return 'N/A';
    
    // Essayer d'abord le cache optimisé
    const allShortcodes = getCachedAllShortcodes();
    if (allShortcodes && allShortcodes[shortcodeId]) {
      return allShortcodes[shortcodeId].SH_Display_Name_FR || shortcodeId;
    }
    
    // Fallback : essayer la liste spécifique du client
    if (selectedClient) {
      const clientId = selectedClient.clientId;
      const shortcodesList = getListForClient(listType, clientId);
      if (shortcodesList) {
        const shortcode = shortcodesList.find(s => s.id === shortcodeId);
        if (shortcode) {
          return shortcode.SH_Display_Name_FR || shortcodeId;
        }
      }
    }
    
    // Si rien trouvé, retourner l'ID original
    return shortcodeId;
  };

  /**
   * Gère la sélection d'une tactique
   */
  const handleTactiqueSelect = (tactique: AdOpsTactique) => {
    const newSelected = selectedTactique?.id === tactique.id ? null : tactique;
    
    // Notifier le parent
    if (onTactiqueSelect) {
      onTactiqueSelect(newSelected);
    }
  };

  /**
   * Désélectionne toutes les tactiques
   */
  const handleClearSelection = () => {
    if (onTactiqueSelect) {
      onTactiqueSelect(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow h-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow h-full">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Tactiques AdOps
        </h3>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow h-full flex flex-col">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">
          Tactiques AdOps
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {filteredTactiques.length} tactique{filteredTactiques.length !== 1 ? 's' : ''}
          </span>
          {selectedTactique && (
            <button
              onClick={handleClearSelection}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Désélectionner
            </button>
          )}
        </div>
      </div>

      {/* Liste des tactiques */}
      <div className="flex-1 overflow-hidden">
        {filteredTactiques.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-center">
            <div>
              <p className="text-sm">Aucune tactique trouvée</p>
              <p className="text-xs mt-1">Essayez de modifier les filtres publishers</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto space-y-2 pr-2">
            {filteredTactiques.map((tactique) => (
              <div
                key={tactique.id}
                onClick={() => handleTactiqueSelect(tactique)}
                className={`
                  relative p-3 border rounded-lg cursor-pointer transition-all duration-200
                  ${selectedTactique?.id === tactique.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {/* Indicateur de sélection */}
                <div className="flex items-start gap-3">
                  <div className={`
                    mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${selectedTactique?.id === tactique.id
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedTactique?.id === tactique.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>

                  {/* Contenu de la tactique */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className={`
                          text-sm font-medium truncate
                          ${selectedTactique?.id === tactique.id ? 'text-indigo-900' : 'text-gray-900'}
                        `}>
                          {tactique.TC_Label || 'Tactique sans nom'}
                        </h4>
                        
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span>{getDisplayName(tactique.TC_Media_Type, 'TC_Media_Type')}</span>
                          <span>•</span>
                          <span>{getDisplayName(tactique.TC_Prog_Buying_Method, 'TC_Prog_Buying_Method')}</span>
                          <span>•</span>
                          <span>{getDisplayName(tactique.TC_Publisher, 'TC_Publisher')}</span>
                        </div>
                      </div>
                      
                      {/* Badge nombre de placements */}
                      <div className={`
                        ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0
                        ${selectedTactique?.id === tactique.id
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}>
                        {tactique.placementsWithTags.length} placement{tactique.placementsWithTags.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}