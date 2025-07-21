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
import { useDataFlow, type SectionExpansionState } from './useDataFlow';

// ==================== TYPES ====================

interface SectionModalState {
  isOpen: boolean;
  section: Section | null;
  mode: 'create' | 'edit';
}

interface UseTactiquesDataProps {
  selectedCampaign: Campaign | null;
  selectedVersion: any;
}

interface UseTactiquesDataReturn {
  // États de chargement centralisés
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  shouldShowFullLoader: boolean;
  shouldShowTopIndicator: boolean;

  // Données principales
  onglets: Onglet[];
  selectedOnglet: Onglet | null;
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };

  // Modal de section (délégué au hook modals)
  sectionModal: SectionModalState;
  handleSaveSection: (sectionData: any) => Promise<void>;
  closeSectionModal: () => void;
  
  // Gestion d'expansion avec useDataFlow
  handleSectionExpand: (sectionId: string) => void;
  sectionExpansions: SectionExpansionState;

  // Opérations CRUD (délégué au hook operations)
  handleCreateTactique: (sectionId: string) => Promise<Tactique>;
  handleUpdateTactique: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  handleDeleteTactique: (sectionId: string, tactiqueId: string) => void;
  handleCreatePlacement: (tactiqueId: string) => Promise<Placement>;
  handleUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  handleDeletePlacement: (sectionId: string, tactiqueId: string, placementId: string) => void; 
  handleCreateCreatif: (placementId: string) => Promise<Creatif>;
  handleUpdateCreatif: (creatifId: string, data: Partial<Creatif>) => Promise<void>;
  handleDeleteCreatif: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => void; 

  // Opérations sections/onglets (délégué au hook modals)
  handleAddSection: () => void;
  handleEditSection: (sectionId: string) => void;
  handleDeleteSection: (sectionId: string) => void;
  handleAddOnglet: () => Promise<void>;
  handleRenameOnglet: (ongletId: string, newName?: string) => Promise<void>;
  handleDeleteOnglet: (ongletId: string) => Promise<void>;
  handleSelectOnglet: (onglet: Onglet) => void;

  // Refresh principal
  onRefresh: () => Promise<void>;

  // Fonctions de suppression locale (optimiste)
  removeSectionLocally: (sectionId: string) => void;
  removeTactiqueAndChildrenLocally: (sectionId: string, tactiqueId: string) => void;
  removePlacementAndChildrenLocally: (sectionId: string, tactiqueId: string, placementId: string) => void;
  removeCreatifLocally: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => void;
}

// ==================== HOOK PRINCIPAL ====================

export const useTactiquesData = (
  selectedCampaign: Campaign | null,
  selectedVersion: any
): UseTactiquesDataReturn => {
  
  // ==================== DÉPENDANCES ====================
  
  const { selectedClient } = useClient();
  const { 
    selectedCampaignId, 
    selectedVersionId, 
    selectedOngletId,
    setSelectedOngletId 
  } = useSelection();

  // Hook central de gestion des chargements et expansion
  const dataFlow = useDataFlow({ 
    enableDebug: process.env.NODE_ENV === 'development',
    minimumLoadingTime: 1500 
  });
  
  // ==================== ÉTATS LOCAUX ====================
  
  // Données
  const [onglets, setOnglets] = useState<Onglet[]>([]);
  const [selectedOnglet, setSelectedOnglet] = useState<Onglet | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [tactiques, setTactiques] = useState<{ [sectionId: string]: Tactique[] }>({});
  const [placements, setPlacements] = useState<{ [tactiqueId: string]: Placement[] }>({});
  const [creatifs, setCreatifs] = useState<{ [placementId: string]: Creatif[] }>({});

  // États de chargement de données
  const [hasInitialData, setHasInitialData] = useState(false);
  
  // ==================== FONCTIONS DE CHARGEMENT ====================
  
  /**
   * Chargement complet d'un onglet avec tous ses éléments enfants
   */

const loadOngletData = useCallback(async (ongletId: string, availableOnglets?: Onglet[]) => {
  if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
    console.log('🔄 loadOngletData: Contexte incomplet');
    return;
  }

  console.log(`🔄 Chargement complet onglet ${ongletId}`);

  try {
    // 1. Définir l'onglet sélectionné
    const ongletsToUse = availableOnglets || onglets;
    const onglet = ongletsToUse.find(o => o.id === ongletId);
    if (onglet) {
      setSelectedOnglet(onglet);
    }

    // 2. Charger sections en préservant les expansions
    const newSections = await getSections(
      selectedClient.clientId,
      selectedCampaignId,
      selectedVersionId,
      ongletId
    );
    
    // 🔥 CORRECTION : Simplifier la préservation des expansions
    setSections(newSections.map(section => ({
      ...section,
      isExpanded: dataFlow.state.sectionExpansions[section.id] || false
    })));

    // 3. Charger tactiques pour chaque section
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

    // 4. Charger placements pour chaque tactique
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

    // 5. Charger créatifs pour chaque placement
    const newCreatifs: { [placementId: string]: Creatif[] } = {};
    for (const [tactiqueId, tactiquePlacements] of Object.entries(newPlacements)) {
      for (const placement of tactiquePlacements) {
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

    console.log(`✅ Onglet ${ongletId} chargé complètement`);
    setHasInitialData(true);
    
  } catch (err) {
    console.error(`❌ Erreur chargement onglet ${ongletId}:`, err);
    throw err;
  }
}, [selectedClient?.clientId, selectedCampaignId, selectedVersionId]);  // 🔥 CORRECTION : Réduire les dépendances

  /**
   * Fonction principale de rafraîchissement
   */
 const onRefresh = useCallback(async () => {
  if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
    console.log('🔄 onRefresh: Contexte incomplet');
    return;
  }

  console.log('🔄 Début refresh des données tactiques');
  
  try {
    // Type de chargement selon si on a déjà des données
    if (hasInitialData) {
      dataFlow.startRefreshLoading('Actualisation des données...');
    } else {
      dataFlow.startInitialLoading('Chargement des tactiques...');
    }

    // 1. Recharger les onglets
    const newOnglets = await getOnglets(
      selectedClient.clientId,
      selectedCampaignId,
      selectedVersionId
    );
    setOnglets(newOnglets);

    // 2. Si on a un onglet sélectionné, recharger ses données
    if (selectedOngletId) {
      // 🔥 CORRECTION : Passer directement les nouveaux onglets
      const onglet = newOnglets.find(o => o.id === selectedOngletId);
      if (onglet) {
        setSelectedOnglet(onglet);
        
        // Recharger les données sans appeler loadOngletData pour éviter la boucle
        const newSections = await getSections(
          selectedClient.clientId,
          selectedCampaignId,
          selectedVersionId,
          selectedOngletId
        );
        
        setSections(newSections.map(section => ({
          ...section,
          isExpanded: dataFlow.state.sectionExpansions[section.id] || false
        })));

        // Charger le reste des données de façon synchrone
        const newTactiques: { [sectionId: string]: Tactique[] } = {};
        for (const section of newSections) {
          const sectionTactiques = await getTactiques(
            selectedClient.clientId,
            selectedCampaignId,
            selectedVersionId,
            selectedOngletId,
            section.id
          );
          newTactiques[section.id] = sectionTactiques;
        }
        setTactiques(newTactiques);

        const newPlacements: { [tactiqueId: string]: Placement[] } = {};
        for (const [sectionId, sectionTactiques] of Object.entries(newTactiques)) {
          for (const tactique of sectionTactiques) {
            const tactiquePlacements = await getPlacementsForTactique(
              selectedClient.clientId,
              selectedCampaignId,
              selectedVersionId,
              selectedOngletId,
              sectionId,
              tactique.id
            );
            newPlacements[tactique.id] = tactiquePlacements;
          }
        }
        setPlacements(newPlacements);

        const newCreatifs: { [placementId: string]: Creatif[] } = {};
        for (const [tactiqueId, tactiquePlacements] of Object.entries(newPlacements)) {
          for (const placement of tactiquePlacements) {
            const sectionId = Object.keys(newTactiques).find(sId => 
              newTactiques[sId].some(t => t.id === tactiqueId)
            );
            
            if (sectionId) {
              const placementCreatifs = await getCreatifsForPlacement(
                selectedClient.clientId,
                selectedCampaignId,
                selectedVersionId,
                selectedOngletId,
                sectionId,
                tactiqueId,
                placement.id
              );
              newCreatifs[placement.id] = placementCreatifs;
            }
          }
        }
        setCreatifs(newCreatifs);
        
        setHasInitialData(true);
      }
    }

    console.log('✅ Refresh terminé avec succès');
    
  } catch (err) {
    console.error('❌ Erreur lors du refresh:', err);
    dataFlow.setError(err instanceof Error ? err.message : 'Erreur lors du rafraîchissement');
  } finally {
    dataFlow.stopLoading();
  }
}, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, hasInitialData, dataFlow]);  // 🔥 CORRECTION : Réduire les dépendances

  // ==================== EFFETS DE CHARGEMENT ====================
    
  // 🔥 CORRECTION : Un seul effet pour le chargement initial
  useEffect(() => {
    const loadInitialData = async () => {
      if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
        // Reset data si contexte incomplet
        setOnglets([]);
        setSelectedOnglet(null);
        setSections([]);
        setTactiques({});
        setPlacements({});
        setCreatifs({});
        setHasInitialData(false);
        dataFlow.clearExpansions();
        return;
      }

      // 🔥 CORRECTION : Éviter les rechargements inutiles
      if (hasInitialData && onglets.length > 0) {
        console.log('🔄 Données déjà chargées, skip');
        return;
      }

      console.log('🔄 Chargement initial des données tactiques');
      await onRefresh();
    };

    loadInitialData();
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId]); // 🔥 CORRECTION : Retirer onRefresh des dépendances

  // 🔥 CORRECTION : Effet séparé et simplifié pour l'onglet sélectionné
  useEffect(() => {
    if (selectedOngletId && onglets.length > 0) {
      const onglet = onglets.find(o => o.id === selectedOngletId);
      if (onglet && onglet.id !== selectedOnglet?.id) {
        console.log('🔄 Synchronisation onglet sélectionné:', onglet.ONGLET_Name);
        setSelectedOnglet(onglet);
        // 🔥 CORRECTION : Pas de rechargement automatique, c'est handleSelectOnglet qui s'en charge
      }
    }
  }, [selectedOngletId, onglets, selectedOnglet?.id]);

  // Auto-sélection du premier onglet (inchangé)
  useEffect(() => {
    if (onglets.length > 0 && !selectedOngletId) {
      const firstOnglet = onglets[0];
      console.log('🎯 Auto-sélection du premier onglet:', firstOnglet.ONGLET_Name);
      setSelectedOngletId(firstOnglet.id);
    }
  }, [onglets.length, selectedOngletId, setSelectedOngletId]);

  // ==================== GESTION D'EXPANSION ====================
  
  const handleSectionExpand = useCallback((sectionId: string) => {
    dataFlow.toggleSectionExpansion(sectionId);
    
    // 🔥 SYNCHRONISATION : Mettre à jour aussi les sections locales
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    ));
  }, [dataFlow]);

  const handleSelectOnglet = useCallback(async (onglet: Onglet) => {
    if (onglet.id !== selectedOngletId) {
      console.log('🎯 Sélection onglet:', onglet.ONGLET_Name);
      
      // 🔥 CORRECTION : Charger immédiatement les données du bon onglet
      if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
        return;
      }

      try {
        // 1. Mettre à jour l'onglet sélectionné
        setSelectedOngletId(onglet.id);
        setSelectedOnglet(onglet);
        
        // 2. Démarrer le chargement
        dataFlow.startRefreshLoading('Chargement de l\'onglet...');

        // 3. Charger les données directement pour cet onglet
        const newSections = await getSections(
          selectedClient.clientId,
          selectedCampaignId,
          selectedVersionId,
          onglet.id  // 🔥 Utiliser directement l'ID du nouvel onglet
        );
        
        setSections(newSections.map(section => ({
          ...section,
          isExpanded: dataFlow.state.sectionExpansions[section.id] || false
        })));

        // Charger tactiques
        const newTactiques: { [sectionId: string]: Tactique[] } = {};
        for (const section of newSections) {
          const sectionTactiques = await getTactiques(
            selectedClient.clientId,
            selectedCampaignId,
            selectedVersionId,
            onglet.id,  // 🔥 Utiliser directement l'ID du nouvel onglet
            section.id
          );
          newTactiques[section.id] = sectionTactiques;
        }
        setTactiques(newTactiques);

        // Charger placements
        const newPlacements: { [tactiqueId: string]: Placement[] } = {};
        for (const [sectionId, sectionTactiques] of Object.entries(newTactiques)) {
          for (const tactique of sectionTactiques) {
            const tactiquePlacements = await getPlacementsForTactique(
              selectedClient.clientId,
              selectedCampaignId,
              selectedVersionId,
              onglet.id,  // 🔥 Utiliser directement l'ID du nouvel onglet
              sectionId,
              tactique.id
            );
            newPlacements[tactique.id] = tactiquePlacements;
          }
        }
        setPlacements(newPlacements);

        // Charger créatifs
        const newCreatifs: { [placementId: string]: Creatif[] } = {};
        for (const [tactiqueId, tactiquePlacements] of Object.entries(newPlacements)) {
          for (const placement of tactiquePlacements) {
            const sectionId = Object.keys(newTactiques).find(sId => 
              newTactiques[sId].some(t => t.id === tactiqueId)
            );
            
            if (sectionId) {
              const placementCreatifs = await getCreatifsForPlacement(
                selectedClient.clientId,
                selectedCampaignId,
                selectedVersionId,
                onglet.id,  // 🔥 Utiliser directement l'ID du nouvel onglet
                sectionId,
                tactiqueId,
                placement.id
              );
              newCreatifs[placement.id] = placementCreatifs;
            }
          }
        }
        setCreatifs(newCreatifs);
        
        console.log('✅ Onglet changé et données chargées:', onglet.ONGLET_Name);
        
      } catch (err) {
        console.error('❌ Erreur changement onglet:', err);
        dataFlow.setError('Erreur lors du changement d\'onglet');
      } finally {
        dataFlow.stopLoading();
      }
    }
  }, [selectedOngletId, setSelectedOngletId, selectedClient?.clientId, selectedCampaignId, selectedVersionId, dataFlow]);

  // ==================== FONCTIONS DE SUPPRESSION LOCALE ====================
  
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
    console.log(`🗑️ Suppression locale créatif ${creatifId}`);
    setCreatifs(prevCreatifs => {
      const newCreatifs = { ...prevCreatifs };
      if (newCreatifs[placementId]) {
        newCreatifs[placementId] = filterAndReorder(newCreatifs[placementId], creatifId, 'CR_Order');
      }
      return newCreatifs;
    });
  }, [filterAndReorder]);

  const removePlacementAndChildrenLocally = useCallback((sectionId: string, tactiqueId: string, placementId: string) => {
    console.log(`🗑️ Suppression locale placement ${placementId} et enfants`);
    setPlacements(prevPlacements => {
      const newPlacements = { ...prevPlacements };
      if (newPlacements[tactiqueId]) {
        newPlacements[tactiqueId] = filterAndReorder(newPlacements[tactiqueId], placementId, 'PL_Order');
      }
      return newPlacements;
    });
    setCreatifs(prevCreatifs => {
      const newCreatifs = { ...prevCreatifs };
      delete newCreatifs[placementId];
      return newCreatifs;
    });
  }, [filterAndReorder]);

  const removeTactiqueAndChildrenLocally = useCallback((sectionId: string, tactiqueId: string) => {
    console.log(`🗑️ Suppression locale tactique ${tactiqueId} et enfants`);
    setTactiques(prevTactiques => {
      const newTactiques = { ...prevTactiques };
      if (newTactiques[sectionId]) {
        newTactiques[sectionId] = filterAndReorder(newTactiques[sectionId], tactiqueId, 'TC_Order');
      }
      return newTactiques;
    });
    
    const placementsToRemove = placements[tactiqueId] || [];
    placementsToRemove.forEach(placement => {
      setCreatifs(prevCreatifs => {
        const newCreatifs = { ...prevCreatifs };
        delete newCreatifs[placement.id];
        return newCreatifs;
      });
    });
    
    setPlacements(prevPlacements => {
      const newPlacements = { ...prevPlacements };
      delete newPlacements[tactiqueId];
      return newPlacements;
    });
  }, [filterAndReorder, placements]);

  const removeSectionLocally = useCallback((sectionId: string) => {
    console.log(`🗑️ Suppression locale section ${sectionId} et enfants`);
    setSections(prevSections => {
      return filterAndReorder(prevSections, sectionId, 'SECTION_Order');
    });
    
    const sectTactiques = tactiques[sectionId] || [];
    sectTactiques.forEach(tactique => {
      removeTactiqueAndChildrenLocally(sectionId, tactique.id);
    });
    
    setTactiques(prevTactiques => {
      const newTactiques = { ...prevTactiques };
      delete newTactiques[sectionId];
      return newTactiques;
    });
  }, [filterAndReorder, tactiques, removeTactiqueAndChildrenLocally]);

  // ==================== INTÉGRATION HOOKS SPÉCIALISÉS ====================

  const operations = useTactiquesOperations({
    selectedCampaign,
    selectedOnglet,
    sections,
    tactiques,
    // 🔥 AJOUT DE DONNÉES DE CONTEXTE
    campaignData: selectedCampaign, // Passer l'objet campagne complet
    allTactiques: tactiques, // Passer toutes les tactiques
    allPlacements: placements, // Passer tous les placements
    allCreatifs: creatifs, // 🔥 AJOUT: Passer tous les créatifs
    onRefresh,
    removeSectionLocally,
    removeTactiqueAndChildrenLocally,
    removePlacementAndChildrenLocally,
    removeCreatifLocally,
  });

  const modals = useTactiquesModals({
    selectedCampaign,
    onglets,
    selectedOnglet,
    sections,
    onRefresh
  });

  // ==================== RETURN ====================

  return {
    // États centralisés avec useDataFlow
    loading: dataFlow.isLoading,
    error: dataFlow.state.error,
    setError: dataFlow.setError,
    shouldShowFullLoader: dataFlow.shouldShowFullLoader,
    shouldShowTopIndicator: dataFlow.shouldShowTopIndicator,

    // Données
    onglets,
    selectedOnglet,
    sections,
    tactiques,
    placements,
    creatifs,

    // Expansion avec useDataFlow
    handleSectionExpand,
    sectionExpansions: dataFlow.state.sectionExpansions,

    // Modal de section (délégué)
    sectionModal: modals.sectionModal,
    handleSaveSection: modals.handleSaveSection,
    closeSectionModal: modals.closeSectionModal,

    // Opérations CRUD (délégué)
    handleCreateTactique: operations.handleCreateTactique,
    handleUpdateTactique: operations.handleUpdateTactique,
    handleDeleteTactique: operations.handleDeleteTactique,
    handleCreatePlacement: operations.handleCreatePlacement,
    handleUpdatePlacement: operations.handleUpdatePlacement,
    handleDeletePlacement: operations.handleDeletePlacement,
    handleCreateCreatif: operations.handleCreateCreatif,
    handleUpdateCreatif: operations.handleUpdateCreatif,
    handleDeleteCreatif: operations.handleDeleteCreatif,

    // Opérations sections/onglets (délégué)
    handleAddSection: modals.handleAddSection,
    handleEditSection: modals.handleEditSection,
    handleDeleteSection: modals.handleDeleteSection,
    handleAddOnglet: modals.handleAddOnglet,
    handleRenameOnglet: modals.handleRenameOnglet,
    handleDeleteOnglet: modals.handleDeleteOnglet,
    handleSelectOnglet,

    // Refresh principal
    onRefresh,

    // Fonctions de suppression locale
    removeSectionLocally,
    removeTactiqueAndChildrenLocally,
    removePlacementAndChildrenLocally,
    removeCreatifLocally,
  };
};