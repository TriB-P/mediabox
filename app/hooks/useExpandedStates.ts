// app/hooks/useExpandedStates.ts

/**
 * Hook personnalisé pour gérer la persistance des états d'expansion hiérarchique.
 * Remplace les useState locaux pour maintenir les états collapse/expand
 * lors des refresh de données, améliorant l'expérience utilisateur.
 * 
 * ✅ NOUVEAU : Ajout de la gestion des sections et des fonctions expandAll/collapseAll
 * ✅ NOUVEAU : Par défaut, les sections sont expanded (tactiques visibles)
 * 
 * Fonctionnalités :
 * - Persistance en sessionStorage avec clé contextualisée
 * - Nettoyage automatique des IDs obsolètes
 * - Interface identique aux useState pour intégration transparente
 * - Support des sections, tactiques, placements et créatifs
 * - Fonctions expandAll() et collapseAll() pour gérer toute la hiérarchie
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';

interface ExpandedStates {
  sections: { [sectionId: string]: boolean };
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
  expandedSections: { [sectionId: string]: boolean };
  expandedTactiques: { [tactiqueId: string]: boolean };
  expandedPlacements: { [placementId: string]: boolean };
  setExpandedSections: (value: { [sectionId: string]: boolean } | ((prev: { [sectionId: string]: boolean }) => { [sectionId: string]: boolean })) => void;
  setExpandedTactiques: (value: { [tactiqueId: string]: boolean } | ((prev: { [tactiqueId: string]: boolean }) => { [tactiqueId: string]: boolean })) => void;
  setExpandedPlacements: (value: { [placementId: string]: boolean } | ((prev: { [placementId: string]: boolean }) => { [placementId: string]: boolean })) => void;
  handleSectionExpand: (sectionId: string) => void;
  handleTactiqueExpand: (tactiqueId: string) => void;
  handlePlacementExpand: (placementId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
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

  // ✅ NOUVEAU : Ajout de l'état pour les sections
  const [expandedSections, setExpandedSectionsState] = useState<{ [sectionId: string]: boolean }>({});
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
   * ✅ MODIFIÉ : Charge les états d'expansion depuis le sessionStorage avec support des sections.
   */
  const loadExpandedStates = useCallback((): ExpandedStates => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      // ✅ NOUVEAU : Par défaut, toutes les sections sont expanded
      const defaultSections: { [sectionId: string]: boolean } = {};
      sections.forEach(section => {
        defaultSections[section.id] = true;
      });
      return { sections: defaultSections, tactiques: {}, placements: {} };
    }

    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ExpandedStates;
        
        // Validation de la structure
        if (parsed && typeof parsed === 'object') {
          // ✅ NOUVEAU : Support de l'ancien format sans sections
          if (!parsed.sections) {
            const defaultSections: { [sectionId: string]: boolean } = {};
            sections.forEach(section => {
              defaultSections[section.id] = true;
            });
            parsed.sections = defaultSections;
          }
          
          console.log('📁 États d\'expansion chargés:', {
            sections: Object.keys(parsed.sections).length,
            tactiques: Object.keys(parsed.tactiques || {}).length,
            placements: Object.keys(parsed.placements || {}).length
          });
          
          return {
            sections: parsed.sections || {},
            tactiques: parsed.tactiques || {},
            placements: parsed.placements || {}
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur chargement états d\'expansion:', error);
    }

    // ✅ NOUVEAU : Par défaut, toutes les sections sont expanded
    const defaultSections: { [sectionId: string]: boolean } = {};
    sections.forEach(section => {
      defaultSections[section.id] = true;
    });
    return { sections: defaultSections, tactiques: {}, placements: {} };
  }, [getStorageKey, sections]);

  /**
   * ✅ MODIFIÉ : Sauvegarde les états d'expansion avec support des sections.
   */
  const saveExpandedStates = useCallback((states: ExpandedStates) => {
    const storageKey = getStorageKey();
    if (!storageKey || isLoadingRef.current) {
      return;
    }

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(states));
      console.log('💾 États d\'expansion sauvegardés:', {
        sections: Object.keys(states.sections).length,
        tactiques: Object.keys(states.tactiques).length,
        placements: Object.keys(states.placements).length
      });
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde états d\'expansion:', error);
    }
  }, [getStorageKey]);

  /**
   * ✅ MODIFIÉ : Nettoie les IDs obsolètes des états d'expansion avec support des sections.
   */
  const cleanObsoleteIds = useCallback((states: ExpandedStates): ExpandedStates => {
    const validSectionIds = new Set<string>();
    const validTactiqueIds = new Set<string>();
    const validPlacementIds = new Set<string>();

    // Collecter tous les IDs valides
    sections.forEach(section => {
      validSectionIds.add(section.id);
      
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
    const cleanedSections: { [sectionId: string]: boolean } = {};
    const cleanedTactiques: { [tactiqueId: string]: boolean } = {};
    const cleanedPlacements: { [placementId: string]: boolean } = {};

    // ✅ NOUVEAU : Nettoyer les sections
    Object.entries(states.sections || {}).forEach(([id, expanded]) => {
      if (validSectionIds.has(id)) {
        cleanedSections[id] = expanded;
      }
    });

    // Ajouter les nouvelles sections comme expanded par défaut
    validSectionIds.forEach(id => {
      if (cleanedSections[id] === undefined) {
        cleanedSections[id] = true;
      }
    });

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

    const removedSections = Object.keys(states.sections || {}).length - Object.keys(cleanedSections).length;
    const removedTactiques = Object.keys(states.tactiques).length - Object.keys(cleanedTactiques).length;
    const removedPlacements = Object.keys(states.placements).length - Object.keys(cleanedPlacements).length;

    if (removedSections > 0 || removedTactiques > 0 || removedPlacements > 0) {
      console.log('🧹 IDs obsolètes supprimés:', {
        sections: removedSections,
        tactiques: removedTactiques,
        placements: removedPlacements
      });
    }

    return {
      sections: cleanedSections,
      tactiques: cleanedTactiques,
      placements: cleanedPlacements
    };
  }, [sections, tactiques, placements]);

  /**
   * ✅ MODIFIÉ : Charge les états d'expansion avec support des sections.
   */
  useEffect(() => {
    isLoadingRef.current = true;
    
    const stored = loadExpandedStates();
    const cleaned = cleanObsoleteIds(stored);
    
    setExpandedSectionsState(cleaned.sections);
    setExpandedTactiquesState(cleaned.tactiques);
    setExpandedPlacementsState(cleaned.placements);
    
    // Sauvegarder les états nettoyés si nécessaire
    if (stored.sections !== cleaned.sections || 
        stored.tactiques !== cleaned.tactiques || 
        stored.placements !== cleaned.placements) {
      saveExpandedStates(cleaned);
    }
    
    isLoadingRef.current = false;
  }, [sections, tactiques, placements, loadExpandedStates, cleanObsoleteIds, saveExpandedStates]);

  /**
   * ✅ NOUVEAU : Setter personnalisé pour les sections avec persistance automatique.
   */
  const setExpandedSections = useCallback((
    value: { [sectionId: string]: boolean } | ((prev: { [sectionId: string]: boolean }) => { [sectionId: string]: boolean })
  ) => {
    setExpandedSectionsState(prevSections => {
      const newSections = typeof value === 'function' ? value(prevSections) : value;
      
      // Sauvegarder automatiquement
      const newStates: ExpandedStates = {
        sections: newSections,
        tactiques: expandedTactiques,
        placements: expandedPlacements
      };
      saveExpandedStates(newStates);
      
      return newSections;
    });
  }, [expandedTactiques, expandedPlacements, saveExpandedStates]);

  /**
   * ✅ MODIFIÉ : Setter personnalisé pour les tactiques avec persistance automatique.
   */
  const setExpandedTactiques = useCallback((
    value: { [tactiqueId: string]: boolean } | ((prev: { [tactiqueId: string]: boolean }) => { [tactiqueId: string]: boolean })
  ) => {
    setExpandedTactiquesState(prevTactiques => {
      const newTactiques = typeof value === 'function' ? value(prevTactiques) : value;
      
      // Sauvegarder automatiquement
      const newStates: ExpandedStates = {
        sections: expandedSections,
        tactiques: newTactiques,
        placements: expandedPlacements
      };
      saveExpandedStates(newStates);
      
      return newTactiques;
    });
  }, [expandedSections, expandedPlacements, saveExpandedStates]);

  /**
   * ✅ MODIFIÉ : Setter personnalisé pour les placements avec persistance automatique.
   */
  const setExpandedPlacements = useCallback((
    value: { [placementId: string]: boolean } | ((prev: { [placementId: string]: boolean }) => { [placementId: string]: boolean })
  ) => {
    setExpandedPlacementsState(prevPlacements => {
      const newPlacements = typeof value === 'function' ? value(prevPlacements) : value;
      
      // Sauvegarder automatiquement
      const newStates: ExpandedStates = {
        sections: expandedSections,
        tactiques: expandedTactiques,
        placements: newPlacements
      };
      saveExpandedStates(newStates);
      
      return newPlacements;
    });
  }, [expandedSections, expandedTactiques, saveExpandedStates]);

  /**
   * ✅ NOUVEAU : Gestionnaire pratique pour basculer l'expansion d'une section.
   */
  const handleSectionExpand = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, [setExpandedSections]);

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
   * ✅ NOUVEAU : Ouvre TOUS les éléments de la hiérarchie (sections + tactiques + placements).
   */
  const expandAll = useCallback(() => {
    const allSections: { [sectionId: string]: boolean } = {};
    const allTactiques: { [tactiqueId: string]: boolean } = {};
    const allPlacements: { [placementId: string]: boolean } = {};

    // Ouvrir toutes les sections
    sections.forEach(section => {
      allSections[section.id] = true;
      
      // Ouvrir toutes les tactiques de cette section
      const sectionTactiques = tactiques[section.id] || [];
      sectionTactiques.forEach(tactique => {
        allTactiques[tactique.id] = true;
        
        // Ouvrir tous les placements de cette tactique
        const tactiquePlacements = placements[tactique.id] || [];
        tactiquePlacements.forEach(placement => {
          allPlacements[placement.id] = true;
        });
      });
    });

    setExpandedSectionsState(allSections);
    setExpandedTactiquesState(allTactiques);
    setExpandedPlacementsState(allPlacements);

    // Sauvegarder
    const newStates: ExpandedStates = {
      sections: allSections,
      tactiques: allTactiques,
      placements: allPlacements
    };
    saveExpandedStates(newStates);

    console.log('📖 Expand All:', {
      sections: Object.keys(allSections).length,
      tactiques: Object.keys(allTactiques).length,
      placements: Object.keys(allPlacements).length
    });
  }, [sections, tactiques, placements, saveExpandedStates]);

  /**
   * ✅ NOUVEAU : Ferme TOUS les éléments de la hiérarchie.
   */
  const collapseAll = useCallback(() => {
    setExpandedSectionsState({});
    setExpandedTactiquesState({});
    setExpandedPlacementsState({});

    // Sauvegarder
    const newStates: ExpandedStates = {
      sections: {},
      tactiques: {},
      placements: {}
    };
    saveExpandedStates(newStates);

    console.log('📕 Collapse All');
  }, [saveExpandedStates]);

  /**
   * ✅ MODIFIÉ : Efface tous les états d'expansion.
   */
  const clearExpandedStates = useCallback(() => {
    const emptyStates: ExpandedStates = { sections: {}, tactiques: {}, placements: {} };
    setExpandedSectionsState({});
    setExpandedTactiquesState({});
    setExpandedPlacementsState({});
    saveExpandedStates(emptyStates);
    console.log('🗑️ États d\'expansion effacés');
  }, [saveExpandedStates]);

  return {
    expandedSections,
    expandedTactiques,
    expandedPlacements,
    setExpandedSections,
    setExpandedTactiques,
    setExpandedPlacements,
    handleSectionExpand,
    handleTactiqueExpand,
    handlePlacementExpand,
    expandAll,
    collapseAll,
    clearExpandedStates
  };
}