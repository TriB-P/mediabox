// app/hooks/useExpandedStates.ts

/**
 * Hook personnalisé pour gérer la persistance des états d'expansion hiérarchique.
 * Remplace les useState locaux pour maintenir les états collapse/expand
 * lors des refresh de données, amélirant l'expérience utilisateur.
 * 
 * Fonctionnalités :
 * - Persistance en sessionStorage avec clé contextualisée
 * - Nettoyage automatique des IDs obsolètes
 * - Interface identique aux useState pour intégration transparente
 * - Support des tactiques, placements et créatifs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';

interface ExpandedStates {
  tactiques: { [tactiqueId: string]: boolean };
  placements: { [placementId: string]: boolean };
}

interface UseExpandedStatesProps {
  sections: any[];
  tactiques: { [sectionId: string]: any[] };
  placements: { [tactiqueId: string]: any[] };
  creatifs: { [placementId: string]: any[] };
}

interface UseExpandedStatesReturn {
  expandedTactiques: { [tactiqueId: string]: boolean };
  expandedPlacements: { [placementId: string]: boolean };
  setExpandedTactiques: (value: { [tactiqueId: string]: boolean } | ((prev: { [tactiqueId: string]: boolean }) => { [tactiqueId: string]: boolean })) => void;
  setExpandedPlacements: (value: { [placementId: string]: boolean } | ((prev: { [placementId: string]: boolean }) => { [placementId: string]: boolean })) => void;
  handleTactiqueExpand: (tactiqueId: string) => void;
  handlePlacementExpand: (placementId: string) => void;
  clearExpandedStates: () => void;
}

/**
 * Hook pour gérer la persistance des états d'expansion.
 * Maintient les états collapse/expand lors des refresh de données.
 * 
 * @param props - Données hiérarchiques pour validation et nettoyage
 * @returns Interface de gestion des états d'expansion
 */
export function useExpandedStates({
  sections,
  tactiques,
  placements,
  creatifs
}: UseExpandedStatesProps): UseExpandedStatesReturn {

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId } = useSelection();

  // États internes
  const [expandedTactiques, setExpandedTactiquesState] = useState<{ [tactiqueId: string]: boolean }>({});
  const [expandedPlacements, setExpandedPlacementsState] = useState<{ [placementId: string]: boolean }>({});
  
  // Ref pour éviter les cycles de sauvegarde
  const isLoadingRef = useRef(false);

  /**
   * Génère la clé de stockage contextualisée.
   * Format: "expanded-states-{clientId}-{campaignId}-{versionId}"
   */
  const getStorageKey = useCallback((): string | null => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      return null;
    }
    return `expanded-states-${selectedClient.clientId}-${selectedCampaignId}-${selectedVersionId}`;
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId]);

  /**
   * Charge les états d'expansion depuis le sessionStorage.
   */
  const loadExpandedStates = useCallback((): ExpandedStates => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      return { tactiques: {}, placements: {} };
    }

    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ExpandedStates;
        
        // Validation de la structure
        if (parsed && typeof parsed === 'object' && parsed.tactiques && parsed.placements) {
          console.log('📁 États d\'expansion chargés:', {
            tactiques: Object.keys(parsed.tactiques).length,
            placements: Object.keys(parsed.placements).length
          });
          return parsed;
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur chargement états d\'expansion:', error);
    }

    return { tactiques: {}, placements: {} };
  }, [getStorageKey]);

  /**
   * Sauvegarde les états d'expansion dans le sessionStorage.
   */
  const saveExpandedStates = useCallback((states: ExpandedStates) => {
    const storageKey = getStorageKey();
    if (!storageKey || isLoadingRef.current) {
      return;
    }

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(states));
      console.log('💾 États d\'expansion sauvegardés:', {
        tactiques: Object.keys(states.tactiques).length,
        placements: Object.keys(states.placements).length
      });
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde états d\'expansion:', error);
    }
  }, [getStorageKey]);

  /**
   * Nettoie les IDs obsolètes des états d'expansion.
   * Supprime les entrées pour les éléments qui n'existent plus.
   */
  const cleanObsoleteIds = useCallback((states: ExpandedStates): ExpandedStates => {
    const validTactiqueIds = new Set<string>();
    const validPlacementIds = new Set<string>();

    // Collecter tous les IDs valides
    sections.forEach(section => {
      const sectionTactiques = tactiques[section.id] || [];
      sectionTactiques.forEach(tactique => {
        validTactiqueIds.add(tactique.id);
        
        const tactiquePlacements = placements[tactique.id] || [];
        tactiquePlacements.forEach(placement => {
          validPlacementIds.add(placement.id);
        });
      });
    });

    // Filtrer les états pour garder seulement les IDs valides
    const cleanedTactiques: { [tactiqueId: string]: boolean } = {};
    const cleanedPlacements: { [placementId: string]: boolean } = {};

    Object.entries(states.tactiques).forEach(([id, expanded]) => {
      if (validTactiqueIds.has(id)) {
        cleanedTactiques[id] = expanded;
      }
    });

    Object.entries(states.placements).forEach(([id, expanded]) => {
      if (validPlacementIds.has(id)) {
        cleanedPlacements[id] = expanded;
      }
    });

    const removedTactiques = Object.keys(states.tactiques).length - Object.keys(cleanedTactiques).length;
    const removedPlacements = Object.keys(states.placements).length - Object.keys(cleanedPlacements).length;

    if (removedTactiques > 0 || removedPlacements > 0) {
      console.log('🧹 IDs obsolètes supprimés:', {
        tactiques: removedTactiques,
        placements: removedPlacements
      });
    }

    return {
      tactiques: cleanedTactiques,
      placements: cleanedPlacements
    };
  }, [sections, tactiques, placements]);

  /**
   * Charge les états d'expansion au montage et lors des changements de contexte.
   */
  useEffect(() => {
    isLoadingRef.current = true;
    
    const stored = loadExpandedStates();
    const cleaned = cleanObsoleteIds(stored);
    
    setExpandedTactiquesState(cleaned.tactiques);
    setExpandedPlacementsState(cleaned.placements);
    
    // Sauvegarder les états nettoyés si nécessaire
    if (stored.tactiques !== cleaned.tactiques || stored.placements !== cleaned.placements) {
      saveExpandedStates(cleaned);
    }
    
    isLoadingRef.current = false;
  }, [sections, tactiques, placements, loadExpandedStates, cleanObsoleteIds, saveExpandedStates]);

  /**
   * Setter personnalisé pour les tactiques avec persistance automatique.
   */
  const setExpandedTactiques = useCallback((
    value: { [tactiqueId: string]: boolean } | ((prev: { [tactiqueId: string]: boolean }) => { [tactiqueId: string]: boolean })
  ) => {
    setExpandedTactiquesState(prevTactiques => {
      const newTactiques = typeof value === 'function' ? value(prevTactiques) : value;
      
      // Sauvegarder automatiquement
      const newStates: ExpandedStates = {
        tactiques: newTactiques,
        placements: expandedPlacements
      };
      saveExpandedStates(newStates);
      
      return newTactiques;
    });
  }, [expandedPlacements, saveExpandedStates]);

  /**
   * Setter personnalisé pour les placements avec persistance automatique.
   */
  const setExpandedPlacements = useCallback((
    value: { [placementId: string]: boolean } | ((prev: { [placementId: string]: boolean }) => { [placementId: string]: boolean })
  ) => {
    setExpandedPlacementsState(prevPlacements => {
      const newPlacements = typeof value === 'function' ? value(prevPlacements) : value;
      
      // Sauvegarder automatiquement
      const newStates: ExpandedStates = {
        tactiques: expandedTactiques,
        placements: newPlacements
      };
      saveExpandedStates(newStates);
      
      return newPlacements;
    });
  }, [expandedTactiques, saveExpandedStates]);

  /**
   * Gestionnaire pratique pour basculer l'expansion d'une tactique.
   */
  const handleTactiqueExpand = useCallback((tactiqueId: string) => {
    setExpandedTactiques(prev => ({
      ...prev,
      [tactiqueId]: !prev[tactiqueId]
    }));
  }, [setExpandedTactiques]);

  /**
   * Gestionnaire pratique pour basculer l'expansion d'un placement.
   */
  const handlePlacementExpand = useCallback((placementId: string) => {
    setExpandedPlacements(prev => ({
      ...prev,
      [placementId]: !prev[placementId]
    }));
  }, [setExpandedPlacements]);

  /**
   * Efface tous les états d'expansion (utile pour debugging ou reset manuel).
   */
  const clearExpandedStates = useCallback(() => {
    const emptyStates: ExpandedStates = { tactiques: {}, placements: {} };
    setExpandedTactiquesState({});
    setExpandedPlacementsState({});
    saveExpandedStates(emptyStates);
    console.log('🗑️ États d\'expansion effacés');
  }, [saveExpandedStates]);

  return {
    expandedTactiques,
    expandedPlacements,
    setExpandedTactiques,
    setExpandedPlacements,
    handleTactiqueExpand,
    handlePlacementExpand,
    clearExpandedStates
  };
}