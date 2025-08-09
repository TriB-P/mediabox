// app/components/AdOps/AdOpsTacticList.tsx
/**
 * Composant AdOpsTacticList avec indicateurs CM360
 * Affiche les tactiques avec propagation des statuts depuis les placements/créatifs
 * et filtres identiques au tableau.
 */
'use client';

import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { getCachedAllShortcodes, getListForClient } from '../../lib/cacheService';
import { useClient } from '../../contexts/ClientContext';
import { 
  CM360TagHistory, 
  CM360Filter,
  calculateTactiqueStatus
} from '../../lib/cm360Service';

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
  // Nouvelles props pour CM360
  cm360Tags?: Map<string, CM360TagHistory>;
  creativesData?: { [placementId: string]: any[] };
}

/**
 * Composant principal pour la liste des tactiques AdOps avec CM360
 */
export default function AdOpsTacticList({ 
  filteredTactiques,
  loading,
  error,
  onTactiqueSelect,
  selectedTactique,
  cm360Tags,
  creativesData
}: AdOpsTacticListProps) {
  const { selectedClient } = useClient();
  const [cm360Filter, setCm360Filter] = useState<CM360Filter>('all');

  /**
   * Récupère le nom d'affichage d'un shortcode depuis le cache
   */
  const getDisplayName = (shortcodeId: string | undefined, listType: string): string => {
    if (!shortcodeId || shortcodeId.trim() === '') return 'N/A';
    
    const allShortcodes = getCachedAllShortcodes();
    if (allShortcodes && allShortcodes[shortcodeId]) {
      return allShortcodes[shortcodeId].SH_Display_Name_FR || shortcodeId;
    }
    
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
    
    return shortcodeId;
  };

  /**
   * Calcule le statut CM360 d'une tactique
   */
  const getTactiqueStatus = (tactique: AdOpsTactique): 'none' | 'created' | 'changed' | 'partial' => {
    if (!cm360Tags || !creativesData) return 'none';
    
    return calculateTactiqueStatus(cm360Tags, tactique.placementsWithTags, creativesData);
  };

  /**
   * Applique le filtre CM360 aux tactiques
   */
  const getFilteredTactiques = (): AdOpsTactique[] => {
    if (cm360Filter === 'all') return filteredTactiques;
    
    return filteredTactiques.filter(tactique => {
      const status = getTactiqueStatus(tactique);
      
      switch (cm360Filter) {
        case 'created':
          return status === 'created';
        case 'changed':
          return status === 'changed' || status === 'partial';
        case 'none':
          return status === 'none';
        default:
          return true;
      }
    });
  };

  /**
   * Gère la sélection d'une tactique
   */
  const handleTactiqueSelect = (tactique: AdOpsTactique) => {
    const newSelected = selectedTactique?.id === tactique.id ? null : tactique;
    
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

  /**
   * Composant pour l'indicateur de statut CM360
   */
  const StatusIndicator = ({ status }: { status: 'none' | 'created' | 'changed' | 'partial' }) => {
    switch (status) {
      case 'created':
        return (
          <div 
            className="w-5 h-5 text-green-600 flex items-center justify-center"
            title="Tous les éléments ont des tags créés"
          >
            ✓
          </div>
        );
      case 'changed':
      case 'partial':
        return (
          <ExclamationTriangleIcon 
            className="w-5 h-5 text-orange-600" 
            title={status === 'changed' ? "Modifications détectées" : "Tags partiels - certains éléments n'ont pas de tags"}
          />
        );
      default:
        return null;
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

  const tactiquesToShow = getFilteredTactiques();

  return (
    <div className="bg-white p-4 rounded-lg shadow h-full flex flex-col">
      {/* En-tête avec filtres */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">
          Tactiques AdOps
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {tactiquesToShow.length} tactique{tactiquesToShow.length !== 1 ? 's' : ''}
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

      {/* Filtres CM360 */}
      <div className="mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-700">Statut CM360:</span>
          {[
            { value: 'all' as CM360Filter, label: 'Tous', color: 'gray' },
            { value: 'created' as CM360Filter, label: 'Créés ✓', color: 'green' },
            { value: 'changed' as CM360Filter, label: 'Modifiés ⚠️', color: 'orange' },
            { value: 'none' as CM360Filter, label: 'À créer', color: 'blue' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setCm360Filter(filter.value)}
              className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                cm360Filter === filter.value
                  ? filter.color === 'green' 
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : filter.color === 'orange'
                    ? 'bg-orange-100 text-orange-800 border-orange-300'
                    : filter.color === 'blue'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des tactiques */}
      <div className="flex-1 overflow-hidden">
        {tactiquesToShow.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-center">
            <div>
              <p className="text-sm">
                {cm360Filter === 'all' 
                  ? 'Aucune tactique trouvée'
                  : `Aucune tactique ${
                      cm360Filter === 'created' ? 'avec tags créés' :
                      cm360Filter === 'changed' ? 'avec modifications' :
                      'sans tags'
                    }`
                }
              </p>
              <p className="text-xs mt-1">
                {cm360Filter !== 'all' && 'Changez le filtre pour voir d\'autres tactiques'}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto space-y-2 pr-2">
            {tactiquesToShow.map((tactique) => {
              const status = getTactiqueStatus(tactique);
              const isSelected = selectedTactique?.id === tactique.id;
              
              return (
                <div
                  key={tactique.id}
                  onClick={() => handleTactiqueSelect(tactique)}
                  className={`
                    relative p-3 border rounded-lg cursor-pointer transition-all duration-200
                    ${isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Indicateur de sélection et statut CM360 */}
                  <div className="flex items-start gap-3">
                    <div className={`
                      mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-gray-300'
                      }
                    `}>
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>

                    {/* Contenu de la tactique */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`
                              text-sm font-medium truncate
                              ${isSelected ? 'text-indigo-900' : 'text-gray-900'}
                            `}>
                              {tactique.TC_Label || 'Tactique sans nom'}
                            </h4>
                            
                            {/* Indicateur de statut CM360 */}
                            <StatusIndicator status={status} />
                          </div>
                          
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <span>{getDisplayName(tactique.TC_Media_Type, 'TC_Media_Type')}</span>
                            <span>•</span>
                            <span>{getDisplayName(tactique.TC_Prog_Buying_Method, 'TC_Prog_Buying_Method')}</span>
                            <span>•</span>
                            <span>{getDisplayName(tactique.TC_Publisher, 'TC_Publisher')}</span>
                          </div>
                        </div>
                        
                        {/* Badge nombre de placements avec statut */}
                        <div className="ml-2 flex items-center gap-1 flex-shrink-0">
                          <div className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${isSelected
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-gray-100 text-gray-600'
                            }
                          `}>
                            {tactique.placementsWithTags.length} placement{tactique.placementsWithTags.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      {/* Indicateur de statut détaillé pour les statuts partiels */}
                      {status === 'partial' && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                          Tags partiels - certains éléments sans tags
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer avec légende */}
      {tactiquesToShow.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="text-green-600">✓</span>
              <span>Tous créés</span>
            </div>
            <div className="flex items-center gap-1">
              <ExclamationTriangleIcon className="w-3 h-3 text-orange-600" />
              <span>Modifications/Partiels</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}