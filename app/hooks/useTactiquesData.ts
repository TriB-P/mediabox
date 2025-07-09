// app/hooks/useTactiquesData.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelection } from '../contexts/SelectionContext';
import { useClient } from '../contexts/ClientContext';
import {
  Onglet,
  Section,
  Tactique,
  Placement,
  Creatif
} from '../types/tactiques';
import { Campaign } from '../types/campaign';
import { 
  getOnglets,
  getSections,
  getTactiques 
} from '../lib/tactiqueService';
import { 
  getPlacementsForTactique 
} from '../lib/placementService';
import { 
  getCreatifsForPlacement 
} from '../lib/creatifService';
import { useTactiquesOperations } from './useTactiquesOperations';
import { useTactiquesModals } from './useTactiquesModals';

interface SectionModalState {
  isOpen: boolean;
  section: Section | null;
  mode: 'create' | 'edit';
}

interface UseTactiquesDataReturn {
  // États de chargement et erreur
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;

  // Données principales
  onglets: Onglet[];
  selectedOnglet: Onglet | null;
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };

  // Modal de section
  sectionModal: SectionModalState;
  handleSaveSection: (sectionData: any) => Promise<void>;
  closeSectionModal: () => void;
  handleSectionExpand: (sectionId: string) => void;

  // Opérations tactiques
  handleCreateTactique: (sectionId: string) => Promise<Tactique>;
  handleUpdateTactique: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  handleDeleteTactique: (sectionId: string, tactiqueId: string) => void;

  // Opérations placements
  handleCreatePlacement: (tactiqueId: string) => Promise<Placement>;
  handleUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  handleDeletePlacement: (sectionId: string, tactiqueId: string, placementId: string) => void; 

  // Opérations créatifs
  handleCreateCreatif: (placementId: string) => Promise<Creatif>;
  handleUpdateCreatif: (creatifId: string, data: Partial<Creatif>) => Promise<void>;
  handleDeleteCreatif: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => void; 

  // Opérations sections
  handleAddSection: () => void;
  handleEditSection: (sectionId: string) => void;
  handleDeleteSection: (sectionId: string) => void;

  // Opérations onglets
  handleAddOnglet: () => Promise<void>;
  handleRenameOnglet: (ongletId: string, newName?: string) => Promise<void>;
  handleDeleteOnglet: (ongletId: string) => Promise<void>;
  handleSelectOnglet: (onglet: Onglet) => void;

  // Fonction de rafraîchissement pour le drag and drop
  onRefresh: () => Promise<void>;

  // NOUVEAU: Fonctions pour la suppression locale (mise à jour optimiste)
  removeSectionLocally: (sectionId: string) => void;
  removeTactiqueAndChildrenLocally: (sectionId: string, tactiqueId: string) => void;
  removePlacementAndChildrenLocally: (sectionId: string, tactiqueId: string, placementId: string) => void;
  removeCreatifLocally: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => void;
}

export const useTactiquesData = (
  selectedCampaign: Campaign | null,
  selectedVersion: any
): UseTactiquesDataReturn => {
  
  const { selectedClient } = useClient();
  const { 
    selectedCampaignId, 
    selectedVersionId, 
    selectedOngletId,
    setSelectedOngletId 
  } = useSelection();

  // États principaux
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Données
  const [onglets, setOnglets] = useState<Onglet[]>([]);
  const [selectedOnglet, setSelectedOnglet] = useState<Onglet | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [tactiques, setTactiques] = useState<{ [sectionId: string]: Tactique[] }>({});
  const [placements, setPlacements] = useState<{ [tactiqueId: string]: Placement[] }>({});
  const [creatifs, setCreatifs] = useState<{ [placementId: string]: Creatif[] }>({});

  // États d'expansion des sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  /**
   * Fonction principale de rafraîchissement des données
   */
  const onRefresh = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      console.log('🔄 onRefresh: Contexte incomplet, arrêt du rafraîchissement');
      return;
    }

    console.log('🔄 onRefresh: Début du rafraîchissement des données');
    setLoading(true);
    setError(null);

    try {
      // 1. Recharger les onglets
      const newOnglets = await getOnglets(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId
      );
      setOnglets(newOnglets);

      // 2. Si on a un onglet sélectionné, recharger ses données EN PRÉSERVANT les expansions
      if (selectedOngletId) {
        await loadOngletData(selectedOngletId, newOnglets);
      }

      console.log('✅ onRefresh: Rafraîchissement terminé avec succès');
    } catch (err) {
      console.error('❌ onRefresh: Erreur lors du rafraîchissement:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du rafraîchissement');
    } finally {
      setLoading(false);
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId]);

  /**
   * Charger les données d'un onglet spécifique
   */
  const loadOngletData = useCallback(async (ongletId: string, availableOnglets?: Onglet[]) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      return;
    }

    console.log(`🔄 Chargement des données pour l'onglet ${ongletId}`);

    try {
      // 1. Définir l'onglet sélectionné
      const ongletsToUse = availableOnglets || onglets;
      const onglet = ongletsToUse.find(o => o.id === ongletId);
      if (onglet) {
        setSelectedOnglet(onglet);
      }

      // 2. Charger les sections et PRÉSERVER les états d'expansion
      const newSections = await getSections(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        ongletId
      );
      
      // 🔥 IMPORTANT : Préserver les états d'expansion existants
      const sectionsWithExpansion = newSections.map(section => {
        const existingSection = sections.find(s => s.id === section.id);
        return {
          ...section,
          isExpanded: existingSection?.isExpanded || expandedSections.has(section.id) || false
        };
      });
      setSections(sectionsWithExpansion);

      // 3. Charger les tactiques pour chaque section
      const newTactiques: { [sectionId: string]: Tactique[] } = {};
      for (const section of newSections) {
        const sectionTactiques = await getTactiques(
          selectedClient.clientId,
          selectedCampaignId,
          selectedVersionId,
          ongletId,
          section.id
        );
        newTactiques[section.id] = sectionTactiques;
      }
      setTactiques(newTactiques);

      // 4. Charger les placements pour chaque tactique
      const newPlacements: { [tactiqueId: string]: Placement[] } = {};
      for (const [sectionId, sectionTactiques] of Object.entries(newTactiques)) {
        for (const tactique of sectionTactiques) {
          const tactiquePlacements = await getPlacementsForTactique(
            selectedClient.clientId,
            selectedCampaignId,
            selectedVersionId,
            ongletId,
            sectionId,
            tactique.id
          );
          newPlacements[tactique.id] = tactiquePlacements;
        }
      }
      setPlacements(newPlacements);

      // 5. Charger les créatifs pour chaque placement
      const newCreatifs: { [placementId: string]: Creatif[] } = {};
      for (const [tactiqueId, tactiquePlacements] of Object.entries(newPlacements)) {
        for (const placement of tactiquePlacements) {
          // Trouver la section pour ce placement
          const sectionId = Object.keys(newTactiques).find(sId => 
            newTactiques[sId].some(t => t.id === tactiqueId)
          );
          
          if (sectionId) {
            const placementCreatifs = await getCreatifsForPlacement(
              selectedClient.clientId,
              selectedCampaignId,
              selectedVersionId,
              ongletId,
              sectionId,
              tactiqueId,
              placement.id
            );
            newCreatifs[placement.id] = placementCreatifs;
          }
        }
      }
      setCreatifs(newCreatifs);

      console.log(`✅ Données chargées pour l'onglet ${ongletId}`);
    } catch (err) {
      console.error(`❌ Erreur lors du chargement de l'onglet ${ongletId}:`, err);
      throw err;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onglets, sections, tactiques, placements, expandedSections]);

  /**
   * Chargement initial des onglets
   */
  useEffect(() => {
    const loadInitialData = async () => {
      if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const newOnglets = await getOnglets(
          selectedClient.clientId,
          selectedCampaignId,
          selectedVersionId
        );
        setOnglets(newOnglets);

        // Sélectionner le premier onglet par défaut
        if (newOnglets.length > 0 && !selectedOngletId) {
          const firstOnglet = newOnglets[0];
          setSelectedOngletId(firstOnglet.id);
          await loadOngletData(firstOnglet.id, newOnglets);
        } else if (selectedOngletId) {
          await loadOngletData(selectedOngletId, newOnglets);
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement initial:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId]);

  /**
   * Réagir aux changements d'onglet sélectionné
   */
  useEffect(() => {
    if (selectedOngletId && onglets.length > 0) {
      const onglet = onglets.find(o => o.id === selectedOngletId);
      if (onglet && onglet.id !== selectedOnglet?.id) {
        loadOngletData(selectedOngletId);
      }
    }
  }, [selectedOngletId, onglets.length, selectedOnglet?.id, loadOngletData]); 

  /**
   * Gestionnaire pour la sélection d'onglet
   */
  const handleSelectOnglet = useCallback((onglet: Onglet) => {
    if (onglet.id !== selectedOngletId) {
      setSelectedOngletId(onglet.id);
    }
  }, [selectedOngletId, setSelectedOngletId]);

  /**
   * Gestionnaire pour l'expansion des sections - MET À JOUR LES DEUX ÉTATS
   */
  const handleSectionExpand = useCallback((sectionId: string) => {
    // 1. Mettre à jour l'état d'expansion dans expandedSections
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });

    // 2. Mettre à jour l'état d'expansion dans les sections elles-mêmes
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    ));
  }, []);

  // NOUVEAU: Fonctions pour la suppression locale (mise à jour optimiste)
  const filterAndReorder = useCallback(<T extends { id: string; TC_Order?: number; PL_Order?: number; CR_Order?: number; SECTION_Order?: number }>(
    items: T[], 
    itemIdToRemove: string,
    orderField: 'TC_Order' | 'PL_Order' | 'CR_Order' | 'SECTION_Order'
  ): T[] => {
    let orderCounter = 0;
    return items.filter(item => item.id !== itemIdToRemove).map(item => ({
      ...item,
      [orderField]: orderCounter++
    }));
  }, []);

  const removeCreatifLocally = useCallback((sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => {
    setCreatifs(prevCreatifs => {
      const newCreatifs = { ...prevCreatifs };
      if (newCreatifs[placementId]) {
        newCreatifs[placementId] = filterAndReorder(newCreatifs[placementId], creatifId, 'CR_Order');
      }
      return newCreatifs;
    });
  }, [filterAndReorder]);

  const removePlacementAndChildrenLocally = useCallback((sectionId: string, tactiqueId: string, placementId: string) => {
    setPlacements(prevPlacements => {
      const newPlacements = { ...prevPlacements };
      if (newPlacements[tactiqueId]) {
        newPlacements[tactiqueId] = filterAndReorder(newPlacements[tactiqueId], placementId, 'PL_Order');
      }
      return newPlacements;
    });
    // Remove all children creatifs associated with this placement
    setCreatifs(prevCreatifs => {
      const newCreatifs = { ...prevCreatifs };
      delete newCreatifs[placementId];
      return newCreatifs;
    });
  }, [filterAndReorder]);

  const removeTactiqueAndChildrenLocally = useCallback((sectionId: string, tactiqueId: string) => {
    setTactiques(prevTactiques => {
      const newTactiques = { ...prevTactiques };
      if (newTactiques[sectionId]) {
        newTactiques[sectionId] = filterAndReorder(newTactiques[sectionId], tactiqueId, 'TC_Order');
      }
      return newTactiques;
    });
    // Remove all children placements and their creatifs associated with this tactique
    setPlacements(prevPlacements => {
      const newPlacements = { ...prevPlacements };
      const placementsToRemove = newPlacements[tactiqueId] || [];
      placementsToRemove.forEach(p => {
        delete newPlacements[p.id]; 
        setCreatifs(prevCreatifs => {
          const newCreatifs = { ...prevCreatifs };
          delete newCreatifs[p.id];
          return newCreatifs;
        });
      });
      delete newPlacements[tactiqueId]; 
      return newPlacements;
    });
  }, [filterAndReorder]);

  const removeSectionLocally = useCallback((sectionId: string) => {
    setSections(prevSections => {
      return filterAndReorder(prevSections, sectionId, 'SECTION_Order');
    });
    // Remove all children tactiques, placements, and creatifs associated with this section
    setTactiques(prevTactiques => {
      const newTactiques = { ...prevTactiques };
      const tactiquesToRemove = newTactiques[sectionId] || [];
      tactiquesToRemove.forEach(t => {
        removeTactiqueAndChildrenLocally(sectionId, t.id); 
      });
      delete newTactiques[sectionId];
      return newTactiques;
    });
  }, [filterAndReorder, removeTactiqueAndChildrenLocally]); 

  // ==================== INTÉGRATION DES HOOKS SPÉCIALISÉS ====================

  // Hook des opérations CRUD
  const operations = useTactiquesOperations({
    selectedCampaign,
    selectedOnglet,
    sections,
    tactiques,
    onRefresh // onRefresh is still provided for fallback/full sync
  });

  // Hook des modals
  const modals = useTactiquesModals({
    selectedCampaign,
    onglets,
    selectedOnglet,
    sections,
    onRefresh
  });

  return {
    // États
    loading,
    error,
    setError,

    // Données
    onglets,
    selectedOnglet,
    sections,
    tactiques,
    placements,
    creatifs,

    // Modal de section
    sectionModal: modals.sectionModal,
    handleSaveSection: modals.handleSaveSection,
    closeSectionModal: modals.closeSectionModal,
    handleSectionExpand,

    // Opérations tactiques
    handleCreateTactique: operations.handleCreateTactique,
    handleUpdateTactique: operations.handleUpdateTactique,
    handleDeleteTactique: operations.handleDeleteTactique, 

    // Opérations placements
    handleCreatePlacement: operations.handleCreatePlacement,
    handleUpdatePlacement: operations.handleUpdatePlacement,
    handleDeletePlacement: operations.handleDeletePlacement, 

    // Opérations créatifs
    handleCreateCreatif: operations.handleCreateCreatif,
    handleUpdateCreatif: operations.handleUpdateCreatif,
    handleDeleteCreatif: operations.handleDeleteCreatif, 

    // Opérations sections
    handleAddSection: modals.handleAddSection,
    handleEditSection: modals.handleEditSection,
    handleDeleteSection: modals.handleDeleteSection,

    // Opérations onglets
    handleAddOnglet: modals.handleAddOnglet,
    handleRenameOnglet: modals.handleRenameOnglet,
    handleDeleteOnglet: modals.handleDeleteOnglet,
    handleSelectOnglet,

    // Fonction de rafraîchissement
    onRefresh,

    // NOUVEAU: Fonctions de suppression locale (optimiste)
    removeSectionLocally,
    removeTactiqueAndChildrenLocally,
    removePlacementAndChildrenLocally,
    removeCreatifLocally,
  };
};