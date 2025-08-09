// app/components/AdOps/AdOpsProgressBar.tsx
/**
 * Composant AdOpsProgressBar
 * Barre de progression horizontale montrant le statut des tags CM360
 * pour tous les placements et créatifs des tactiques filtrées
 */
'use client';

import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { CM360TagHistory } from '../../lib/cm360Service';

interface AdOpsTactique {
  id: string;
  TC_Label?: string;
  placementsWithTags: any[];
}

interface AdOpsProgressBarProps {
  filteredTactiques: AdOpsTactique[];
  cm360Tags?: Map<string, CM360TagHistory>;
  creativesData?: { [tactiqueId: string]: { [placementId: string]: any[] } };
  loading?: boolean;
}

interface ProgressStats {
  created: number;    // Vert - Tags créés sans changements
  toModify: number;   // Rouge - Tags avec changements
  toCreate: number;   // Blanc - Pas de tags
  total: number;
}

/**
 * Composant principal de la barre de progression
 */
export default function AdOpsProgressBar({
  filteredTactiques,
  cm360Tags,
  creativesData,
  loading
}: AdOpsProgressBarProps) {

  /**
   * Filtre les tags CM360 pour une tactique spécifique
   */
  const getFilteredCM360Tags = (tactiqueId: string): Map<string, CM360TagHistory> => {
    if (!cm360Tags) return new Map();
    
    const filtered = new Map<string, CM360TagHistory>();
    const prefix = `tactique-${tactiqueId}-`;
    
    cm360Tags.forEach((history, key) => {
      if (key.startsWith(prefix)) {
        const localKey = key.substring(prefix.length);
        filtered.set(localKey, history);
      }
    });
    
    return filtered;
  };

  /**
   * Calcule les statistiques de progression pour toutes les tactiques
   */
  const calculateProgressStats = (): ProgressStats => {
    let created = 0;
    let toModify = 0;
    let toCreate = 0;
    
    filteredTactiques.forEach(tactique => {
      const tactiquesCM360Tags = getFilteredCM360Tags(tactique.id);
      const tactiquesCreatives = creativesData?.[tactique.id] || {};
      
      // Analyser chaque placement
      tactique.placementsWithTags.forEach(placement => {
        const placementHistory = tactiquesCM360Tags.get(`placement-${placement.id}`);
        
        if (!placementHistory?.latestTag) {
          toCreate++; // Pas de tag
        } else if (placementHistory.hasChanges) {
          toModify++; // Tag avec changements
        } else {
          created++; // Tag créé sans changements
        }
        
        // Analyser chaque créatif de ce placement
        const creatives = tactiquesCreatives[placement.id] || [];
        creatives.forEach(creative => {
          const creativeHistory = tactiquesCM360Tags.get(`creative-${creative.id}`);
          
          if (!creativeHistory?.latestTag) {
            toCreate++; // Pas de tag
          } else if (creativeHistory.hasChanges) {
            toModify++; // Tag avec changements
          } else {
            created++; // Tag créé sans changements
          }
        });
      });
    });
    
    const total = created + toModify + toCreate;
    return { created, toModify, toCreate, total };
  };

  /**
   * Calcule les pourcentages pour la barre
   */
  const getPercentages = (stats: ProgressStats) => {
    if (stats.total === 0) return { created: 0, toModify: 0, toCreate: 100 };
    
    return {
      created: Math.round((stats.created / stats.total) * 100),
      toModify: Math.round((stats.toModify / stats.total) * 100),
      toCreate: Math.round((stats.toCreate / stats.total) * 100)
    };
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-6 bg-gray-200 rounded"></div>
          <div className="w-32 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (filteredTactiques.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-center text-gray-500">
          <p className="text-sm">Sélectionnez une campagne et une version pour voir la progression des tags CM360</p>
        </div>
      </div>
    );
  }

  const stats = calculateProgressStats();
  const percentages = getPercentages(stats);

  return (
    <div className="bg-white p-4 rounded-lg shadow">


      <div className="flex items-center gap-4">
        {/* Barre de progression */}
        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div className="h-full flex">
            {/* Segment vert - Créés */}
            {stats.created > 0 && (
              <div 
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${percentages.created}%` }}
                title={`${stats.created} tags créés (${percentages.created}%)`}
              ></div>
            )}
            
            {/* Segment rouge - À modifier */}
            {stats.toModify > 0 && (
              <div 
                className="bg-red-500 h-full transition-all duration-300"
                style={{ width: `${percentages.toModify}%` }}
                title={`${stats.toModify} tags à modifier (${percentages.toModify}%)`}
              ></div>
            )}
            
            {/* Segment blanc - À créer */}
            {stats.toCreate > 0 && (
              <div 
                className="bg-white border-l border-gray-300 h-full transition-all duration-300"
                style={{ width: `${percentages.toCreate}%` }}
                title={`${stats.toCreate} tags à créer (${percentages.toCreate}%)`}
              ></div>
            )}
          </div>
        </div>

        {/* Légende avec chiffres */}
        <div className="flex items-center gap-4 text-sm font-medium">
          {/* Tags créés */}
          <div className="flex items-center gap-1 text-green-700">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{stats.created}</span>
            <CheckCircleIcon className="w-4 h-4" />
          </div>
          
          {/* Tags à modifier */}
          <div className="flex items-center gap-1 text-red-700">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>{stats.toModify}</span>
            <ExclamationTriangleIcon className="w-4 h-4" />
          </div>
          
          {/* Tags à créer */}
          <div className="flex items-center gap-1 text-gray-700">
            <div className="w-3 h-3 bg-white border-2 border-gray-400 rounded-full"></div>
            <span>{stats.toCreate}</span>
            <PlusCircleIcon className="w-4 h-4" />
          </div>
        </div>
      </div>


    </div>
  );
}