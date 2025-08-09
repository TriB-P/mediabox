// app/components/AdOps/AdOpsTacticList.tsx
/**
 * Composant AdOpsTacticList avec indicateurs CM360 complets
 * Affiche les tactiques avec indicateurs incluant placements + créatifs + métriques
 * et filtres par statut CM360.
 * MODIFIÉ : Utilise les nouvelles fonctions avec support métriques
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
  calculateTactiqueStatusWithMetrics,
  getTactiqueDetailedChangesSummary,
  detectMetricsChanges
} from '../../lib/cm360Service';

interface AdOpsTactique {
  id: string;
  TC_Label?: string;
  TC_Publisher?: string;
  TC_Media_Type?: string;
  TC_Prog_Buying_Method?: string;
  // AJOUTÉ : Propriétés de métriques manquantes
  TC_Media_Budget?: number;
  TC_BuyCurrency?: string;
  TC_CM360_Rate?: number;
  TC_CM360_Volume?: number;
  TC_Buy_Type?: string;
  ongletName: string;
  sectionName: string;
  // AJOUTÉ : IDs manquants pour compatibilité avec SelectedTactique
  ongletId: string;
  sectionId: string;
  placementsWithTags: any[];
}

interface AdOpsTacticListProps {
  filteredTactiques: AdOpsTactique[];
  loading: boolean;
  error: string | null;
  onTactiqueSelect?: (tactique: AdOpsTactique | null) => void;
  selectedTactique?: AdOpsTactique | null;
  // Props CM360 depuis AdOpsPage - MODIFIÉ : Structure hierarchique
  cm360Tags?: Map<string, CM360TagHistory>;
  creativesData?: { [tactiqueId: string]: { [placementId: string]: any[] } };
}

/**
 * Composant principal pour la liste des tactiques AdOps avec CM360 complet
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
   * NOUVELLE FONCTION : Filtre les tags CM360 pour une tactique spécifique
   * Retire le préfixe "tactique-${id}-" et retourne une Map compatible
   */
  const getFilteredCM360Tags = (tactiqueId: string): Map<string, CM360TagHistory> => {
    if (!cm360Tags) return new Map();
    
    const filtered = new Map<string, CM360TagHistory>();
    const prefix = `tactique-${tactiqueId}-`;
    
    cm360Tags.forEach((history, key) => {
      if (key.startsWith(prefix)) {
        const localKey = key.substring(prefix.length); // Retire le préfixe
        filtered.set(localKey, history);
      }
    });
    
    console.log(`🔍 [TacticList] Filtrage pour tactique ${tactiqueId}:`, {
      'tags totaux': cm360Tags.size,
      'tags filtrés': filtered.size,
      'clés filtrées': Array.from(filtered.keys()),
      'préfixe recherché': prefix
    });
    
    return filtered;
  };

  /**
   * NOUVELLE FONCTION : Récupère les créatifs pour une tactique spécifique
   * Adapte la structure hierarchique à la structure attendue par les fonctions
   */
  const getFilteredCreatives = (tactiqueId: string): { [placementId: string]: any[] } => {
    if (!creativesData || !creativesData[tactiqueId]) {
      return {};
    }
    
    const result = creativesData[tactiqueId];
    
    return result;
  };

  /**
   * CORRIGÉE : Calcule le statut CM360 d'une tactique incluant les métriques
   * Utilise maintenant la MÊME logique que TacticInfo pour éviter les bugs
   */
  const getTactiqueStatusWithMetrics = (tactique: AdOpsTactique): 'none' | 'created' | 'changed' | 'partial' => {
    if (!cm360Tags || !creativesData) {
      return 'none';
    }
    
    // Filtrer les données pour cette tactique spécifique
    const tactiquesCM360Tags = getFilteredCM360Tags(tactique.id);
    const tactiquesCreatives = getFilteredCreatives(tactique.id);
    
    // 1. Vérifier les éléments (placements + créatifs)
    const allElements: string[] = [];
    tactique.placementsWithTags.forEach(placement => {
      allElements.push(`placement-${placement.id}`);
      const creatives = tactiquesCreatives[placement.id] || [];
      creatives.forEach(creative => {
        allElements.push(`creative-${creative.id}`);
      });
    });
    
    if (allElements.length === 0) return 'none';
    
    let elementsWithTags = 0;
    let elementsWithChanges = 0;
    
    allElements.forEach(itemKey => {
      const history = tactiquesCM360Tags.get(itemKey);
      if (history?.latestTag) {
        elementsWithTags++;
        if (history.hasChanges) {
          elementsWithChanges++;
        }
      }
    });
    
    // 2. CORRIGÉ : Vérifier les métriques avec la MÊME logique que TacticInfo
    let metricsHaveTag = false;
    let metricsHaveChanges = false;
    
    const metricsHistory = tactiquesCM360Tags.get('metrics-tactics');
    if (metricsHistory?.latestTag) {
      metricsHaveTag = true;
      
      // UTILISER LA MÊME DÉTECTION QUE TACTICINFO !
      const tactiqueMetrics = {
        TC_Media_Budget: tactique.TC_Media_Budget,
        TC_BuyCurrency: tactique.TC_BuyCurrency,
        TC_CM360_Rate: tactique.TC_CM360_Rate,
        TC_CM360_Volume: tactique.TC_CM360_Volume,
        TC_Buy_Type: tactique.TC_Buy_Type
      };
      
      // Recalculer les changements comme dans TacticInfo
      const metricsChanges = detectMetricsChanges(tactiqueMetrics, tactiquesCM360Tags);
      metricsHaveChanges = metricsChanges.hasChanges;
    }
    
    // 3. Logique de statut global
    const hasAnyTags = elementsWithTags > 0 || metricsHaveTag;
    const hasAnyChanges = elementsWithChanges > 0 || metricsHaveChanges;
    const allElementsHaveTags = elementsWithTags === allElements.length;
    
    // Aucun tag nulle part
    if (!hasAnyTags) return 'none';
    
    // Au moins un changement détecté
    if (hasAnyChanges) return 'changed';
    
    // Tous les éléments ont des tags + métriques ont un tag + aucun changement
    if (allElementsHaveTags && metricsHaveTag) return 'created';
    
    // Tags partiels (certains éléments ou métriques manquants)
    return 'partial';
  };

  /**
   * CORRIGÉE : Obtient le résumé des changements pour une tactique
   * Utilise maintenant la MÊME logique que TacticInfo pour les métriques
   */
  const getTactiqueChangesSummary = (tactique: AdOpsTactique) => {
    if (!cm360Tags || !creativesData) {
      return { hasChanges: false, changedTypes: [], details: { placements: { total: 0, withTags: 0, withChanges: 0 }, creatives: { total: 0, withTags: 0, withChanges: 0 }, metrics: { hasTag: false, hasChanges: false } } };
    }
    
    // Filtrer les données pour cette tactique spécifique
    const tactiquesCM360Tags = getFilteredCM360Tags(tactique.id);
    const tactiquesCreatives = getFilteredCreatives(tactique.id);
    
    const changedTypes: string[] = [];
    let placementStats = { total: 0, withTags: 0, withChanges: 0 };
    let creativeStats = { total: 0, withTags: 0, withChanges: 0 };
    let metricsStats = { hasTag: false, hasChanges: false };
    
    // 1. Analyser les placements
    tactique.placementsWithTags.forEach(placement => {
      placementStats.total++;
      const history = tactiquesCM360Tags.get(`placement-${placement.id}`);
      if (history?.latestTag) {
        placementStats.withTags++;
        if (history.hasChanges) {
          placementStats.withChanges++;
        }
      }
    });
    
    // 2. Analyser les créatifs
    Object.values(tactiquesCreatives).forEach(creatives => {
      creatives.forEach(creative => {
        creativeStats.total++;
        const history = tactiquesCM360Tags.get(`creative-${creative.id}`);
        if (history?.latestTag) {
          creativeStats.withTags++;
          if (history.hasChanges) {
            creativeStats.withChanges++;
          }
        }
      });
    });
    
    // 3. CORRIGÉ : Analyser les métriques avec la MÊME logique que TacticInfo
    const metricsHistory = tactiquesCM360Tags.get('metrics-tactics');
    if (metricsHistory?.latestTag) {
      metricsStats.hasTag = true;
      
      // UTILISER LA MÊME DÉTECTION QUE TACTICINFO !
      const tactiqueMetrics = {
        TC_Media_Budget: tactique.TC_Media_Budget,
        TC_BuyCurrency: tactique.TC_BuyCurrency,
        TC_CM360_Rate: tactique.TC_CM360_Rate,
        TC_CM360_Volume: tactique.TC_CM360_Volume,
        TC_Buy_Type: tactique.TC_Buy_Type
      };
      
      // Recalculer les changements comme dans TacticInfo
      const metricsChanges = detectMetricsChanges(tactiqueMetrics, tactiquesCM360Tags);
      metricsStats.hasChanges = metricsChanges.hasChanges;
    }
    
    // 4. Déterminer les types qui ont changé
    if (placementStats.withChanges > 0) {
      changedTypes.push('placements');
    }
    if (creativeStats.withChanges > 0) {
      changedTypes.push('créatifs');
    }
    if (metricsStats.hasChanges) {
      changedTypes.push('métriques');
    }
    
    return {
      hasChanges: changedTypes.length > 0,
      changedTypes,
      details: {
        placements: placementStats,
        creatives: creativeStats,
        metrics: metricsStats
      }
    };
  };

  /**
   * Applique le filtre CM360 aux tactiques
   */
  const getFilteredTactiques = (): AdOpsTactique[] => {
    if (cm360Filter === 'all') return filteredTactiques;
    
    return filteredTactiques.filter(tactique => {
      const status = getTactiqueStatusWithMetrics(tactique);
      
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
   * NOUVEAU : Composant pour l'indicateur de statut CM360 avec métriques
   */
  const StatusIndicatorWithMetrics = ({ status, changesSummary }: { 
    status: 'none' | 'created' | 'changed' | 'partial';
    changesSummary: ReturnType<typeof getTactiqueChangesSummary>;
  }) => {
    const getTooltipText = (): string => {
      switch (status) {
        case 'created':
          return 'Tous les éléments et métriques ont des tags créés, aucun changement';
        case 'changed':
          const changedText = changesSummary.changedTypes.join(', ');
          return `Modifications détectées dans: ${changedText}`;
        case 'partial':
          return 'Tags partiels - certains éléments ou métriques n\'ont pas de tags';
        case 'none':
        default:
          return 'Aucun tag créé';
      }
    };

    switch (status) {
      case 'created':
        return (
          <div 
            className="w-5 h-5 text-green-600 flex items-center justify-center font-bold"
            title={getTooltipText()}
          >
            ✓
          </div>
        );
      case 'changed':
        return (
          <ExclamationTriangleIcon 
            className="w-5 h-5 text-orange-600" 
            title={getTooltipText()}
          />
        );
      case 'partial':
        return (
          <div 
            className="w-5 h-5 text-blue-600 flex items-center justify-center font-bold text-lg"
            title={getTooltipText()}
          >
          </div>
        );
      default:
        return null;
    }
  };

  /**
   * NOUVEAU : Badge détaillé pour les changements
   */
  const ChangesBadge = ({ changesSummary }: { changesSummary: ReturnType<typeof getTactiqueChangesSummary> }) => {
    if (!changesSummary.hasChanges) return null;

    const changedCount = changesSummary.changedTypes.length;
    const changedText = changesSummary.changedTypes.join(', ');

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
          Tactiques
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
          Tactiques
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

      {/* Filtres CM360 avec nouvelles catégories */}
      <div className="mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { value: 'all' as CM360Filter, label: 'Tous', color: 'gray' },
            { value: 'created' as CM360Filter, label: 'Complets ✓', color: 'green' },
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
                      cm360Filter === 'created' ? 'complète (tous tags créés)' :
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
              const status = getTactiqueStatusWithMetrics(tactique);
              const changesSummary = getTactiqueChangesSummary(tactique);
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
                            
                            {/* Indicateur de statut CM360 avec métriques */}
                            <StatusIndicatorWithMetrics status={status} changesSummary={changesSummary} />
                          </div>
                          
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <span>{getDisplayName(tactique.TC_Media_Type, 'TC_Media_Type')}</span>
                            <span>•</span>
                            <span>{getDisplayName(tactique.TC_Prog_Buying_Method, 'TC_Prog_Buying_Method')}</span>
                            <span>•</span>
                            <span>{getDisplayName(tactique.TC_Publisher, 'TC_Publisher')}</span>
                          </div>

                          {/* Badge de changements détaillé */}
                          {changesSummary.hasChanges && (
                            <div className="mt-2">
                              <ChangesBadge changesSummary={changesSummary} />
                            </div>
                          )}
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
                      
                      
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer avec légende mise à jour */}
      {tactiquesToShow.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="text-green-600 font-bold">✓</span>
              <span>Complet (tous créés)</span>
            </div>
            <div className="flex items-center gap-1">
              <ExclamationTriangleIcon className="w-3 h-3 text-orange-600" />
              <span>Modifications</span>
            </div>
            <div className="flex items-center gap-1">
            </div>
          </div>
        </div>
      )}
    </div>
  );
}