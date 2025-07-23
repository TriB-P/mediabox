/**
 * Ce hook gère le chargement, la gestion et la synchronisation des données relatives aux tactiques, sections, onglets, placements et créatifs depuis Firebase.
 * Il centralise la logique de récupération des données et expose des fonctions pour interagir avec celles-ci,
 * y compris des opérations CRUD déléguées à d'autres hooks spécialisés (useTactiquesOperations, useTactiquesModals).
 * Il s'occupe également de la gestion des états de chargement et des expansions de sections.
 */
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
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  shouldShowFullLoader: boolean;
  shouldShowTopIndicator: boolean;
  onglets: Onglet[];
  selectedOnglet: Onglet | null;
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  sectionModal: SectionModalState;
  handleSaveSection: (sectionData: any) => Promise<void>;
  closeSectionModal: () => void;
  handleSectionExpand: (sectionId: string) => void;
  sectionExpansions: SectionExpansionState;
  handleCreateTactique: (sectionId: string) => Promise<Tactique>;
  handleUpdateTactique: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  handleDeleteTactique: (sectionId: string, tactiqueId: string) => void;
  handleCreatePlacement: (tactiqueId: string) => Promise<Placement>;
  handleUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  handleDeletePlacement: (sectionId: string, tactiqueId: string, placementId: string) => void;
  handleCreateCreatif: (placementId: string) => Promise<Creatif>;
  handleUpdateCreatif: (creatifId: string, data: Partial<Creatif>) => Promise<void>;
  handleDeleteCreatif: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => void;
  handleAddSection: () => void;
  handleEditSection: (sectionId: string) => void;
  handleDeleteSection: (sectionId: string) => void;
  handleAddOnglet: () => Promise<void>;
  handleRenameOnglet: (ongletId: string, newName?: string) => Promise<void>;
  handleDeleteOnglet: (ongletId: string) => Promise<void>;
  handleSelectOnglet: (onglet: Onglet) => void;
  onRefresh: (() => Promise<void>) | (() => void);
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

  const dataFlow = useDataFlow({
    enableDebug: process.env.NODE_ENV === 'development',
    minimumLoadingTime: 1500
  });

  const [onglets, setOnglets] = useState<Onglet[]>([]);
  const [selectedOnglet, setSelectedOnglet] = useState<Onglet | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [tactiques, setTactiques] = useState<{ [sectionId: string]: Tactique[] }>({});
  const [placements, setPlacements] = useState<{ [tactiqueId: string]: Placement[] }>({});
  const [creatifs, setCreatifs] = useState<{ [placementId: string]: Creatif[] }>({});

  const [hasInitialData, setHasInitialData] = useState(false);

  /**
   * Charge toutes les données (sections, tactiques, placements, créatifs) pour un onglet donné.
   * Met à jour les états locaux correspondants.
   * @param ongletId L'ID de l'onglet à charger.
   * @param availableOnglets Une liste optionnelle d'onglets à utiliser pour trouver l'onglet sélectionné.
   */
  const loadOngletData = useCallback(async (ongletId: string, availableOnglets?: Onglet[]) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      return;
    }

    try {
      const ongletsToUse = availableOnglets || onglets;
      const onglet = ongletsToUse.find(o => o.id === ongletId);
      if (onglet) {
        setSelectedOnglet(onglet);
      }

      console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: loadOngletData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${ongletId}/sections");
      const newSections = await getSections(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        ongletId
      );

      setSections(newSections.map(section => ({
        ...section,
        isExpanded: dataFlow.state.sectionExpansions[section.id] || false
      })));

      const newTactiques: { [sectionId: string]: Tactique[] } = {};
      for (const section of newSections) {
        console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: loadOngletData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${ongletId}/sections/${section.id}/tactiques");
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

      const newPlacements: { [tactiqueId: string]: Placement[] } = {};
      for (const [sectionId, sectionTactiques] of Object.entries(newTactiques)) {
        for (const tactique of sectionTactiques) {
          console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: loadOngletData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactique.id}/placements");
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

      const newCreatifs: { [placementId: string]: Creatif[] } = {};
      for (const [tactiqueId, tactiquePlacements] of Object.entries(newPlacements)) {
        for (const placement of tactiquePlacements) {
          const sectionId = Object.keys(newTactiques).find(sId =>
            newTactiques[sId].some(t => t.id === tactiqueId)
          );

          if (sectionId) {
            console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: loadOngletData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placement.id}/creatifs");
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

      setHasInitialData(true);

    } catch (err) {
      console.error(`❌ Erreur chargement onglet ${ongletId}:`, err);
      throw err;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onglets, dataFlow.state.sectionExpansions]);

  /**
   * Fonction principale de rafraîchissement des données.
   * Recharge tous les onglets, puis les données de l'onglet actuellement sélectionné.
   */
  const onRefresh = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      return;
    }

    try {
      if (hasInitialData) {
        dataFlow.startRefreshLoading('Actualisation des données...');
      } else {
        dataFlow.startInitialLoading('Chargement des tactiques...');
      }

      console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: onRefresh - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets");
      const newOnglets = await getOnglets(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId
      );
      setOnglets(newOnglets);

      if (selectedOngletId) {
        const onglet = newOnglets.find(o => o.id === selectedOngletId);
        if (onglet) {
          setSelectedOnglet(onglet);

          console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: onRefresh - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections");
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

          const newTactiques: { [sectionId: string]: Tactique[] } = {};
          for (const section of newSections) {
            console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: onRefresh - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${section.id}/tactiques");
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
              console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: onRefresh - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques/${tactique.id}/placements");
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
                console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: onRefresh - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placement.id}/creatifs");
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

    } catch (err) {
      console.error('❌ Erreur lors du refresh:', err);
      dataFlow.setError(err instanceof Error ? err.message : 'Erreur lors du rafraîchissement');
    } finally {
      dataFlow.stopLoading();
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, hasInitialData, dataFlow, dataFlow.state.sectionExpansions]);

  /**
   * Effet de chargement initial des données lorsque le contexte (client, campagne, version) est disponible.
   * Il réinitialise les données si le contexte devient incomplet.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
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

      if (hasInitialData && onglets.length > 0) {
        return;
      }

      await Promise.resolve(onRefresh());
    };

    loadInitialData();
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId]);

  /**
   * Effet qui synchronise l'onglet sélectionné lorsque l'ID de l'onglet sélectionné change
   * ou que la liste des onglets est mise à jour.
   */
  useEffect(() => {
    if (selectedOngletId && onglets.length > 0) {
      const onglet = onglets.find(o => o.id === selectedOngletId);
      if (onglet && onglet.id !== selectedOnglet?.id) {
        setSelectedOnglet(onglet);
      }
    }
  }, [selectedOngletId, onglets, selectedOnglet?.id]);

  /**
   * Effet qui auto-sélectionne le premier onglet si aucun onglet n'est sélectionné.
   */
  useEffect(() => {
    if (onglets.length > 0 && !selectedOngletId) {
      const firstOnglet = onglets[0];
      setSelectedOngletId(firstOnglet.id);
    }
  }, [onglets.length, selectedOngletId, setSelectedOngletId]);

  /**
   * Gère l'expansion/réduction d'une section et met à jour l'état local des sections.
   * @param sectionId L'ID de la section à basculer.
   */
  const handleSectionExpand = useCallback((sectionId: string) => {
    dataFlow.toggleSectionExpansion(sectionId);

    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    ));
  }, [dataFlow]);

  /**
   * Gère la sélection d'un onglet. Met à jour l'ID de l'onglet sélectionné
   * et recharge toutes les données associées à ce nouvel onglet.
   * @param onglet L'objet Onglet à sélectionner.
   */
  const handleSelectOnglet = useCallback(async (onglet: Onglet) => {
    if (onglet.id !== selectedOngletId) {
      if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
        return;
      }

      try {
        setSelectedOngletId(onglet.id);
        setSelectedOnglet(onglet);

        dataFlow.startRefreshLoading('Chargement de l\'onglet...');

        console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: handleSelectOnglet - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${onglet.id}/sections");
        const newSections = await getSections(
          selectedClient.clientId,
          selectedCampaignId,
          selectedVersionId,
          onglet.id
        );

        setSections(newSections.map(section => ({
          ...section,
          isExpanded: dataFlow.state.sectionExpansions[section.id] || false
        })));

        const newTactiques: { [sectionId: string]: Tactique[] } = {};
        for (const section of newSections) {
          console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: handleSelectOnglet - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${onglet.id}/sections/${section.id}/tactiques");
          const sectionTactiques = await getTactiques(
            selectedClient.clientId,
            selectedCampaignId,
            selectedVersionId,
            onglet.id,
            section.id
          );
          newTactiques[section.id] = sectionTactiques;
        }
        setTactiques(newTactiques);

        const newPlacements: { [tactiqueId: string]: Placement[] } = {};
        for (const [sectionId, sectionTactiques] of Object.entries(newTactiques)) {
          for (const tactique of sectionTactiques) {
            console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: handleSelectOnglet - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${onglet.id}/sections/${sectionId}/tactiques/${tactique.id}/placements");
            const tactiquePlacements = await getPlacementsForTactique(
              selectedClient.clientId,
              selectedCampaignId,
              selectedVersionId,
              onglet.id,
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
              console.log("FIREBASE: LECTURE - Fichier: useTactiquesData.ts - Fonction: handleSelectOnglet - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${onglet.id}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placement.id}/creatifs");
              const placementCreatifs = await getCreatifsForPlacement(
                selectedClient.clientId,
                selectedCampaignId,
                selectedVersionId,
                onglet.id,
                sectionId,
                tactiqueId,
                placement.id
              );
              newCreatifs[placement.id] = placementCreatifs;
            }
          }
        }
        setCreatifs(newCreatifs);

      } catch (err) {
        console.error('❌ Erreur changement onglet:', err);
        dataFlow.setError('Erreur lors du changement d\'onglet');
      } finally {
        dataFlow.stopLoading();
      }
    }
  }, [selectedOngletId, setSelectedOngletId, selectedClient?.clientId, selectedCampaignId, selectedVersionId, dataFlow, dataFlow.state.sectionExpansions]);

  /**
   * Filtre une liste d'éléments et réordonne les éléments restants en fonction d'un champ d'ordre spécifié.
   * @param items La liste d'éléments à filtrer.
   * @param itemIdToRemove L'ID de l'élément à supprimer.
   * @param orderField Le champ à utiliser pour l'ordre (ex: 'TC_Order', 'PL_Order').
   * @returns Une nouvelle liste d'éléments filtrée et réordonnée.
   */
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

  /**
   * Supprime un créatif de l'état local de manière optimiste.
   * @param sectionId L'ID de la section parente.
   * @param tactiqueId L'ID de la tactique parente.
   * @param placementId L'ID du placement parent.
   * @param creatifId L'ID du créatif à supprimer.
   */
  const removeCreatifLocally = useCallback((sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => {
    setCreatifs(prevCreatifs => {
      const newCreatifs = { ...prevCreatifs };
      if (newCreatifs[placementId]) {
        newCreatifs[placementId] = filterAndReorder(newCreatifs[placementId], creatifId, 'CR_Order');
      }
      return newCreatifs;
    });
  }, [filterAndReorder]);

  /**
   * Supprime un placement et ses créatifs enfants de l'état local de manière optimiste.
   * @param sectionId L'ID de la section parente.
   * @param tactiqueId L'ID de la tactique parente.
   * @param placementId L'ID du placement à supprimer.
   */
  const removePlacementAndChildrenLocally = useCallback((sectionId: string, tactiqueId: string, placementId: string) => {
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

  /**
   * Supprime une tactique, ses placements et ses créatifs enfants de l'état local de manière optimiste.
   * @param sectionId L'ID de la section parente.
   * @param tactiqueId L'ID de la tactique à supprimer.
   */
  const removeTactiqueAndChildrenLocally = useCallback((sectionId: string, tactiqueId: string) => {
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

  /**
   * Supprime une section, ses tactiques, placements et créatifs enfants de l'état local de manière optimiste.
   * @param sectionId L'ID de la section à supprimer.
   */
  const removeSectionLocally = useCallback((sectionId: string) => {
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

  const operations = useTactiquesOperations({
    selectedCampaign,
    selectedOnglet,
    sections,
    tactiques,
    campaignData: selectedCampaign,
    allTactiques: tactiques,
    allPlacements: placements,
    allCreatifs: creatifs,
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

  return {
    loading: dataFlow.isLoading,
    error: dataFlow.state.error,
    setError: dataFlow.setError,
    shouldShowFullLoader: dataFlow.shouldShowFullLoader,
    shouldShowTopIndicator: dataFlow.shouldShowTopIndicator,
    onglets,
    selectedOnglet,
    sections,
    tactiques,
    placements,
    creatifs,
    handleSectionExpand,
    sectionExpansions: dataFlow.state.sectionExpansions,
    sectionModal: modals.sectionModal,
    handleSaveSection: modals.handleSaveSection,
    closeSectionModal: modals.closeSectionModal,
    handleCreateTactique: operations.handleCreateTactique,
    handleUpdateTactique: operations.handleUpdateTactique,
    handleDeleteTactique: operations.handleDeleteTactique,
    handleCreatePlacement: operations.handleCreatePlacement,
    handleUpdatePlacement: operations.handleUpdatePlacement,
    handleDeletePlacement: operations.handleDeletePlacement,
    handleCreateCreatif: operations.handleCreateCreatif,
    handleUpdateCreatif: operations.handleUpdateCreatif,
    handleDeleteCreatif: operations.handleDeleteCreatif,
    handleAddSection: modals.handleAddSection,
    handleEditSection: modals.handleEditSection,
    handleDeleteSection: modals.handleDeleteSection,
    handleAddOnglet: modals.handleAddOnglet,
    handleRenameOnglet: modals.handleRenameOnglet,
    handleDeleteOnglet: modals.handleDeleteOnglet,
    handleSelectOnglet,
    onRefresh,
    removeSectionLocally,
    removeTactiqueAndChildrenLocally,
    removePlacementAndChildrenLocally,
    removeCreatifLocally,
  };
};