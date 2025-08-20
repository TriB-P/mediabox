// app/components/AdOps/AdOpsProgressBar.tsx
/**
 * Composant AdOpsProgressBar unifié et optimisé
 * CORRIGÉ : Types unifiés, logique simplifiée, performance améliorée
 */
'use client';

import React, { useMemo, useCallback } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { CM360TagHistory } from '../../lib/cm360Service';
import { useTranslation } from '../../contexts/LanguageContext';

// Import des types unifiés
import {
  AdOpsProgressBarProps,
  AdOpsProgressStats,
  AdOpsProgressPercentages,
  AdOpsTactique
} from '../../types/adops';

// ================================
// COMPOSANTS UTILITAIRES
// ================================

/**
 * Indicateur de statut avec icône et couleur
 */
const StatusIndicator = React.memo(({ 
  type, 
  count, 
  color,
  icon: Icon,
  title 
}: {
  type: string;
  count: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) => (
  <div className="flex items-center gap-1 text-sm font-medium" style={{ color }}>
    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: color }}></div>
    <span>{count}</span>
    <Icon className="w-4 h-4" />
  </div>
));

StatusIndicator.displayName = 'StatusIndicator';

/**
 * Segment de la barre de progression
 */
const ProgressSegment = React.memo(({ 
  width, 
  color, 
  title,
  isLast = false 
}: {
  width: number;
  color: string;
  title: string;
  isLast?: boolean;
}) => (
  <div 
    className={`h-full transition-all duration-300 ${isLast ? 'border-l border-gray-300' : ''}`}
    style={{ 
      width: `${width}%`, 
      backgroundColor: color 
    }}
    title={title}
  />
));

ProgressSegment.displayName = 'ProgressSegment';

// ================================
// COMPOSANT PRINCIPAL
// ================================

/**
 * Barre de progression pour le statut CM360
 */
export default function AdOpsProgressBar({
  filteredTactiques,
  cm360Tags,
  creativesData,
  loading
}: AdOpsProgressBarProps) {
  const { t } = useTranslation();

  // Fonction pour filtrer les tags CM360 d'une tactique
  const getFilteredCM360Tags = useCallback((tactiqueId: string): Map<string, CM360TagHistory> => {
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
  }, [cm360Tags]);

  // Calcul des statistiques de progression mémorisé
  const progressStats: AdOpsProgressStats = useMemo(() => {
    let created = 0;
    let toModify = 0;
    let toCreate = 0;
    
    filteredTactiques.forEach((tactique: AdOpsTactique) => {
      const tactiquesCM360Tags = getFilteredCM360Tags(tactique.id);
      const tactiquesCreatives = creativesData?.[tactique.id] || {};
      
      // Analyser chaque placement
      tactique.placementsWithTags.forEach(placement => {
        const placementHistory = tactiquesCM360Tags.get(`placement-${placement.id}`);
        
        if (!placementHistory?.latestTag) {
          toCreate++;
        } else if (placementHistory.hasChanges) {
          toModify++;
        } else {
          created++;
        }
        
        // Analyser chaque créatif de ce placement
        const creatives = tactiquesCreatives[placement.id] || [];
        creatives.forEach(creative => {
          const creativeHistory = tactiquesCM360Tags.get(`creative-${creative.id}`);
          
          if (!creativeHistory?.latestTag) {
            toCreate++;
          } else if (creativeHistory.hasChanges) {
            toModify++;
          } else {
            created++;
          }
        });
      });
    });
    
    const total = created + toModify + toCreate;
    return { created, toModify, toCreate, total };
  }, [filteredTactiques, getFilteredCM360Tags, creativesData]);

  // Calcul des pourcentages mémorisé
  const progressPercentages: AdOpsProgressPercentages = useMemo(() => {
    if (progressStats.total === 0) {
      return { created: 0, toModify: 0, toCreate: 100 };
    }
    
    return {
      created: Math.round((progressStats.created / progressStats.total) * 100),
      toModify: Math.round((progressStats.toModify / progressStats.total) * 100),
      toCreate: Math.round((progressStats.toCreate / progressStats.total) * 100)
    };
  }, [progressStats]);

  // Configuration des couleurs et icônes
  const statusConfig = useMemo(() => ({
    created: {
      color: '#10b981', // green-500
      icon: CheckCircleIcon,
      label: t('adOpsProgressBar.tooltip.created')
    },
    toModify: {
      color: '#ef4444', // red-500
      icon: ExclamationTriangleIcon,
      label: t('adOpsProgressBar.tooltip.toModify')
    },
    toCreate: {
      color: '#ffffff', // white
      icon: PlusCircleIcon,
      label: t('adOpsProgressBar.tooltip.toCreate')
    }
  }), [t]);

  // Rendu conditionnel pour le chargement
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

  // Rendu pour l'état vide
  if (filteredTactiques.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-center text-gray-500">
          <p className="text-sm">{t('adOpsProgressBar.emptyState.message')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center gap-4">
        
        {/* Barre de progression principale */}
        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div className="h-full flex">
            {/* Segment créés (vert) */}
            {progressStats.created > 0 && (
              <ProgressSegment
                width={progressPercentages.created}
                color={statusConfig.created.color}
                title={`${progressStats.created} ${statusConfig.created.label} (${progressPercentages.created}%)`}
              />
            )}
            
            {/* Segment à modifier (rouge) */}
            {progressStats.toModify > 0 && (
              <ProgressSegment
                width={progressPercentages.toModify}
                color={statusConfig.toModify.color}
                title={`${progressStats.toModify} ${statusConfig.toModify.label} (${progressPercentages.toModify}%)`}
              />
            )}
            
            {/* Segment à créer (blanc) */}
            {progressStats.toCreate > 0 && (
              <ProgressSegment
                width={progressPercentages.toCreate}
                color={statusConfig.toCreate.color}
                title={`${progressStats.toCreate} ${statusConfig.toCreate.label} (${progressPercentages.toCreate}%)`}
                isLast={true}
              />
            )}
          </div>
        </div>

        {/* Légende avec statistiques */}
        <div className="flex items-center gap-4 text-sm font-medium">
          
          {/* Tags créés */}
          <StatusIndicator
            type="created"
            count={progressStats.created}
            color={statusConfig.created.color}
            icon={statusConfig.created.icon}
            title={statusConfig.created.label}
          />
          
          {/* Tags à modifier */}
          <StatusIndicator
            type="toModify"
            count={progressStats.toModify}
            color={statusConfig.toModify.color}
            icon={statusConfig.toModify.icon}
            title={statusConfig.toModify.label}
          />
          
          {/* Tags à créer */}
          <StatusIndicator
            type="toCreate"
            count={progressStats.toCreate}
            color="#6b7280" // gray-500 pour le texte
            icon={statusConfig.toCreate.icon}
            title={statusConfig.toCreate.label}
          />
        </div>
        
      </div>



    </div>
  );
}