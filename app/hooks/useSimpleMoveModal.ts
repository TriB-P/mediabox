// app/hooks/useSimpleMoveModal.ts

/**
 * Ce hook gère la logique d'un modal simple pour le déplacement d'éléments entre différentes structures
 * de campagne (campagnes, versions, onglets, sections, tactiques, placements).
 * Il prend en charge l'ouverture et la fermeture du modal, le chargement des options de destination
 * depuis Firebase, la sélection de la destination, la validation et l'exécution du déplacement.
 * Il assure également un rafraîchissement de l'interface après un déplacement réussi.
 * NOUVEAU : Il met automatiquement à jour les taxonomies des éléments déplacés.
 */
import { useState, useCallback, useRef } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { SelectionValidationResult } from './useSelectionValidation';
import { useUpdateTaxonomies } from './useUpdateTaxonomies';
import * as MoveService from '../lib/simpleMoveService';

export interface MoveModalState {
  isOpen: boolean;
  step: 'destination' | 'progress' | 'result';

  validationResult: SelectionValidationResult | null;
  selectedItemIds: string[];

  campaigns: MoveService.CascadeItem[];
  versions: MoveService.CascadeItem[];
  onglets: MoveService.CascadeItem[];
  sections: MoveService.CascadeItem[];
  tactiques: MoveService.CascadeItem[];
  placements: MoveService.CascadeItem[];

  destination: Partial<MoveService.MoveDestination>;

  loadingCampaigns: boolean;
  loadingVersions: boolean;
  loadingOnglets: boolean;
  loadingSections: boolean;
  loadingTactiques: boolean;
  loadingPlacements: boolean;

  result: MoveService.MoveResult | null;
  processing: boolean;
  error: string | null;

  hierarchyContext?: {
    sections: any[];
    tactiques: { [sectionId: string]: any[] };
    placements: { [tactiqueId: string]: any[] };
    creatifs: { [placementId: string]: any[] };
  };
}

/**
 * Hook principal pour gérer le modal de déplacement.
 * @returns {object} Un objet contenant l'état du modal et les fonctions pour interagir avec.
 */
export function useSimpleMoveModal() {
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();
  const { updateTaxonomies } = useUpdateTaxonomies();

  const onRefreshRef = useRef<(() => Promise<void>) | null>(null);

  const [modalState, setModalState] = useState<MoveModalState>({
    isOpen: false,
    step: 'destination',
    validationResult: null,
    selectedItemIds: [],
    campaigns: [],
    versions: [],
    onglets: [],
    sections: [],
    tactiques: [],
    placements: [],
    destination: {},
    loadingCampaigns: false,
    loadingVersions: false,
    loadingOnglets: false,
    loadingSections: false,
    loadingTactiques: false,
    loadingPlacements: false,
    result: null,
    processing: false,
    error: null,
    hierarchyContext: undefined
  });

  /**
   * Charge les campagnes disponibles pour le client sélectionné.
   * @returns {Promise<void>} Une promesse qui se résout une fois les campagnes chargées.
   */
  const loadCampaigns = useCallback(async () => {
    if (!selectedClient?.clientId) return;

    setModalState(prev => ({ ...prev, loadingCampaigns: true, error: null }));

    try {
      console.log("FIREBASE: LECTURE - Fichier: useSimpleMoveModal.ts - Fonction: loadCampaigns - Path: clients/${selectedClient.clientId}/campaigns");
      const campaigns = await MoveService.loadCampaigns(selectedClient.clientId);
      setModalState(prev => ({
        ...prev,
        campaigns,
        loadingCampaigns: false
      }));
    } catch (error) {
      console.error('❌ Erreur chargement campagnes:', error);
      setModalState(prev => ({
        ...prev,
        loadingCampaigns: false,
        error: 'Erreur lors du chargement des campagnes'
      }));
    }
  }, [selectedClient?.clientId]);

  /**
   * Charge les versions pour une campagne donnée.
   * @param {string} campaignId L'identifiant de la campagne.
   * @returns {Promise<void>} Une promesse qui se résout une fois les versions chargées.
   */
  const loadVersions = useCallback(async (campaignId: string) => {
    if (!selectedClient?.clientId) return;

    setModalState(prev => ({ ...prev, loadingVersions: true, error: null }));

    try {
      console.log("FIREBASE: LECTURE - Fichier: useSimpleMoveModal.ts - Fonction: loadVersions - Path: clients/${selectedClient.clientId}/campaigns/${campaignId}/versions");
      const versions = await MoveService.loadVersions(selectedClient.clientId, campaignId);
      setModalState(prev => ({
        ...prev,
        versions,
        loadingVersions: false,
        onglets: [],
        sections: [],
        tactiques: [],
        placements: []
      }));
    } catch (error) {
      console.error('❌ Erreur chargement versions:', error);
      setModalState(prev => ({
        ...prev,
        loadingVersions: false,
        error: 'Erreur lors du chargement des versions'
      }));
    }
  }, [selectedClient?.clientId]);

  /**
   * Charge les onglets pour une campagne et une version données.
   * @param {string} campaignId L'identifiant de la campagne.
   * @param {string} versionId L'identifiant de la version.
   * @returns {Promise<void>} Une promesse qui se résout une fois les onglets chargés.
   */
  const loadOnglets = useCallback(async (campaignId: string, versionId: string) => {
    if (!selectedClient?.clientId) return;

    setModalState(prev => ({ ...prev, loadingOnglets: true, error: null }));

    try {
      console.log("FIREBASE: LECTURE - Fichier: useSimpleMoveModal.ts - Fonction: loadOnglets - Path: clients/${selectedClient.clientId}/campaigns/${campaignId}/versions/${versionId}/onglets");
      const onglets = await MoveService.loadOnglets(selectedClient.clientId, campaignId, versionId);
      setModalState(prev => ({
        ...prev,
        onglets,
        loadingOnglets: false,
        sections: [],
        tactiques: [],
        placements: []
      }));
    } catch (error) {
      console.error('❌ Erreur chargement onglets:', error);
      setModalState(prev => ({
        ...prev,
        loadingOnglets: false,
        error: 'Erreur lors du chargement des onglets'
      }));
    }
  }, [selectedClient?.clientId]);

  /**
   * Charge les sections pour une campagne, une version et un onglet donnés.
   * @param {string} campaignId L'identifiant de la campagne.
   * @param {string} versionId L'identifiant de la version.
   * @param {string} ongletId L'identifiant de l'onglet.
   * @returns {Promise<void>} Une promesse qui se résout une fois les sections chargées.
   */
  const loadSections = useCallback(async (campaignId: string, versionId: string, ongletId: string) => {
    if (!selectedClient?.clientId) return;

    setModalState(prev => ({ ...prev, loadingSections: true, error: null }));

    try {
      console.log("FIREBASE: LECTURE - Fichier: useSimpleMoveModal.ts - Fonction: loadSections - Path: clients/${selectedClient.clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections");
      const sections = await MoveService.loadSections(
        selectedClient.clientId,
        campaignId,
        versionId,
        ongletId
      );
      setModalState(prev => ({
        ...prev,
        sections,
        loadingSections: false,
        tactiques: [],
        placements: []
      }));
    } catch (error) {
      console.error('❌ Erreur chargement sections:', error);
      setModalState(prev => ({
        ...prev,
        loadingSections: false,
        error: 'Erreur lors du chargement des sections'
      }));
    }
  }, [selectedClient?.clientId]);

  /**
   * Charge les tactiques pour une campagne, une version, un onglet et une section donnés.
   * @param {string} campaignId L'identifiant de la campagne.
   * @param {string} versionId L'identifiant de la version.
   * @param {string} ongletId L'identifiant de l'onglet.
   * @param {string} sectionId L'identifiant de la section.
   * @returns {Promise<void>} Une promesse qui se résout une fois les tactiques chargées.
   */
  const loadTactiques = useCallback(async (
    campaignId: string,
    versionId: string,
    ongletId: string,
    sectionId: string
  ) => {
    if (!selectedClient?.clientId) return;

    setModalState(prev => ({ ...prev, loadingTactiques: true, error: null }));

    try {
      console.log("FIREBASE: LECTURE - Fichier: useSimpleMoveModal.ts - Fonction: loadTactiques - Path: clients/${selectedClient.clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques");
      const tactiques = await MoveService.loadTactiques(
        selectedClient.clientId,
        campaignId,
        versionId,
        ongletId,
        sectionId
      );
      setModalState(prev => ({
        ...prev,
        tactiques,
        loadingTactiques: false,
        placements: []
      }));
    } catch (error) {
      console.error('❌ Erreur chargement tactiques:', error);
      setModalState(prev => ({
        ...prev,
        loadingTactiques: false,
        error: 'Erreur lors du chargement des tactiques'
      }));
    }
  }, [selectedClient?.clientId]);

  /**
   * Charge les placements pour une campagne, une version, un onglet, une section et une tactique donnés.
   * @param {string} campaignId L'identifiant de la campagne.
   * @param {string} versionId L'identifiant de la version.
   * @param {string} ongletId L'identifiant de l'onglet.
   * @param {string} sectionId L'identifiant de la section.
   * @param {string} tactiqueId L'identifiant de la tactique.
   * @returns {Promise<void>} Une promesse qui se résout une fois les placements chargés.
   */
  const loadPlacements = useCallback(async (
    campaignId: string,
    versionId: string,
    ongletId: string,
    sectionId: string,
    tactiqueId: string
  ) => {
    if (!selectedClient?.clientId) return;

    setModalState(prev => ({ ...prev, loadingPlacements: true, error: null }));

    try {
      console.log("FIREBASE: LECTURE - Fichier: useSimpleMoveModal.ts - Fonction: loadPlacements - Path: clients/${selectedClient.clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
      const placements = await MoveService.loadPlacements(
        selectedClient.clientId,
        campaignId,
        versionId,
        ongletId,
        sectionId,
        tactiqueId
      );
      setModalState(prev => ({
        ...prev,
        placements,
        loadingPlacements: false
      }));
    } catch (error) {
      console.error('❌ Erreur chargement placements:', error);
      setModalState(prev => ({
        ...prev,
        loadingPlacements: false,
        error: 'Erreur lors du chargement des placements'
      }));
    }
  }, [selectedClient?.clientId]);

  /**
   * Ouvre le modal de déplacement avec les données de validation et les IDs des éléments sélectionnés.
   * @param {SelectionValidationResult} validationResult Le résultat de la validation de la sélection.
   * @param {string[]} selectedItemIds Les identifiants des éléments sélectionnés.
   * @param {object} hierarchyContext Le contexte hiérarchique des éléments (sections, tactiques, placements, créatifs).
   * @param {() => Promise<void>} onRefresh Callback à exécuter après un déplacement réussi pour rafraîchir les données.
   * @returns {Promise<void>} Une promesse qui se résout une fois le modal initialisé et les campagnes chargées.
   */
  const openModal = useCallback(async (
    validationResult: SelectionValidationResult,
    selectedItemIds: string[],
    hierarchyContext?: {
      sections: any[];
      tactiques: { [sectionId: string]: any[] };
      placements: { [tactiqueId: string]: any[] };
      creatifs: { [placementId: string]: any[] };
    },
    onRefresh?: () => Promise<void>
  ) => {
    if (!selectedClient?.clientId) {
      console.error('❌ Aucun client sélectionné');
      return;
    }

    onRefreshRef.current = onRefresh || null;

    setModalState(prev => ({
      ...prev,
      isOpen: true,
      step: 'destination',
      validationResult,
      selectedItemIds,
      hierarchyContext,
      campaigns: [],
      versions: [],
      onglets: [],
      sections: [],
      tactiques: [],
      placements: [],
      destination: {},
      result: null,
      processing: false,
      error: null
    }));

    await loadCampaigns();
  }, [selectedClient?.clientId, loadCampaigns]);

  /**
   * Ferme le modal de déplacement.
   * @returns {Promise<void>} Une promesse qui se résout une fois le modal fermé.
   */
  const closeModal = useCallback(async () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));

    onRefreshRef.current = null;
  }, []);

  /**
   * Sélectionne une destination pour le déplacement à un niveau donné (campagne, version, etc.).
   * @param {string} level Le niveau de la destination sélectionnée ('campaign', 'version', 'onglet', 'section', 'tactique', 'placement').
   * @param {string} itemId L'identifiant de l'élément sélectionné à ce niveau.
   * @param {string} itemName Le nom de l'élément sélectionné à ce niveau.
   * @returns {Promise<void>} Une promesse qui se résout une fois la destination mise à jour et le niveau suivant chargé.
   */
  const selectDestination = useCallback(async (level: string, itemId: string, itemName: string) => {
    setModalState(prev => {
      const newDestination = { ...prev.destination };

      switch (level) {
        case 'campaign':
          newDestination.campaignId = itemId;
          newDestination.campaignName = itemName;
          break;
        case 'version':
          newDestination.versionId = itemId;
          newDestination.versionName = itemName;
          break;
        case 'onglet':
          newDestination.ongletId = itemId;
          newDestination.ongletName = itemName;
          break;
        case 'section':
          newDestination.sectionId = itemId;
          newDestination.sectionName = itemName;
          break;
        case 'tactique':
          newDestination.tactiqueId = itemId;
          newDestination.tactiqueName = itemName;
          break;
        case 'placement':
          newDestination.placementId = itemId;
          newDestination.placementName = itemName;
          break;
      }

      return { ...prev, destination: newDestination };
    });

    const dest = modalState.destination;

    switch (level) {
      case 'campaign':
        await loadVersions(itemId);
        break;
      case 'version':
        if (dest.campaignId) {
          await loadOnglets(dest.campaignId, itemId);
        }
        break;
      case 'onglet':
        if (dest.campaignId && dest.versionId) {
          await loadSections(dest.campaignId, dest.versionId, itemId);
        }
        break;
      case 'section':
        if (dest.campaignId && dest.versionId && dest.ongletId) {
          await loadTactiques(dest.campaignId, dest.versionId, dest.ongletId, itemId);
        }
        break;
      case 'tactique':
        if (dest.campaignId && dest.versionId && dest.ongletId && dest.sectionId) {
          await loadPlacements(dest.campaignId, dest.versionId, dest.ongletId, dest.sectionId, itemId);
        }
        break;
    }
  }, [modalState.destination, loadVersions, loadOnglets, loadSections, loadTactiques, loadPlacements]);

  /**
   * Met à jour les taxonomies des éléments déplacés après un déplacement réussi.
   * Détermine automatiquement les éléments qui nécessitent une mise à jour taxonomique
   * en fonction du type et niveau de déplacement effectué.
   * @param {MoveService.MoveResult} moveResult Le résultat du déplacement.
   * @param {string} moveLevel Le niveau d'éléments déplacés ('section', 'tactique', 'placement', 'creatif').
   * @param {MoveService.MoveDestination} destination La destination du déplacement.
   * @returns {Promise<void>} Une promesse qui se résout une fois les taxonomies mises à jour.
   */
  const updateTaxonomiesAfterMove = useCallback(async (
    moveResult: MoveService.MoveResult,
    moveLevel: string,
    destination: MoveService.MoveDestination
  ) => {
    if (!moveResult.success || !selectedClient?.clientId) {
      return;
    }

    const clientId = selectedClient.clientId;

    try {
      console.log('🔄 Mise à jour des taxonomies après déplacement...');

      // Pour les déplacements de sections : mettre à jour toutes les tactiques et leurs enfants
      if (moveLevel === 'section') {
        // Les sections déplacées ont une nouvelle campagne parente
        const campaignData = {
          id: destination.campaignId!,
          name: destination.campaignName!,
          clientId: clientId,
        };

        // Déclencher la mise à jour pour la campagne destination
        // Cela mettra à jour toutes les tactiques, placements et créatifs de ces sections
        await updateTaxonomies('campaign', campaignData);
      }
      
      // Pour les déplacements de tactiques : mettre à jour leurs placements et créatifs
      else if (moveLevel === 'tactique') {
        for (const tactiqueId of modalState.selectedItemIds) {
          const tactiqueData = {
            id: tactiqueId,
            name: `Tactique ${tactiqueId}`, // Le nom exact n'est pas critique pour la mise à jour
            clientId: clientId,
            campaignId: destination.campaignId!,
          };

          await updateTaxonomies('tactic', tactiqueData);
        }
      }
      
      // Pour les déplacements de placements : mettre à jour leurs créatifs
      else if (moveLevel === 'placement') {
        for (const placementId of modalState.selectedItemIds) {
          const placementData = {
            id: placementId,
            name: `Placement ${placementId}`, // Le nom exact n'est pas critique pour la mise à jour
            clientId: clientId,
            campaignId: destination.campaignId!,
          };

          await updateTaxonomies('placement', placementData);
        }
      }

      console.log('✅ Taxonomies mises à jour avec succès après déplacement');

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des taxonomies après déplacement:', error);
      // On ne fait pas échouer le déplacement si la mise à jour des taxonomies échoue
      // L'utilisateur peut toujours les mettre à jour manuellement plus tard
    }
  }, [selectedClient?.clientId, modalState.selectedItemIds, updateTaxonomies]);

  /**
   * Confirme et exécute le déplacement des éléments sélectionnés vers la destination choisie.
   * Gère la construction du contexte source, l'appel au service de déplacement,
   * la mise à jour automatique des taxonomies et le rafraîchissement de l'interface après l'opération.
   * @returns {Promise<void>} Une promesse qui se résout une fois le déplacement terminé.
   */
  const confirmMove = useCallback(async () => {
    if (!selectedClient?.clientId || !modalState.validationResult || !modalState.validationResult.canMove) {
      console.error('❌ Conditions non remplies pour le déplacement');
      return;
    }

    if (!modalState.hierarchyContext) {
      console.error('❌ Contexte hiérarchique manquant');
      setModalState(prev => ({
        ...prev,
        error: 'Contexte hiérarchique manquant pour construire les chemins source'
      }));
      return;
    }

    setModalState(prev => ({ ...prev, step: 'progress', processing: true, error: null }));

    try {
      const sourceContext = {
        campaignId: selectedCampaignId!,
        versionId: selectedVersionId!,
        ongletId: selectedOngletId!
      };

      console.log("FIREBASE: LECTURE - Fichier: useSimpleMoveModal.ts - Fonction: confirmMove - Path: itemsWithContext (dynamique)");
      const itemsWithContext = await MoveService.buildItemsContext(
        selectedClient.clientId,
        modalState.selectedItemIds,
        sourceContext,
        modalState.hierarchyContext
      );

      if (itemsWithContext.length === 0) {
        throw new Error('Aucun élément trouvé dans le contexte - impossible de construire les chemins source');
      }

      const operation: MoveService.MoveOperation = {
        clientId: selectedClient.clientId,
        itemType: modalState.validationResult.moveLevel!,
        selectedItemIds: modalState.selectedItemIds,
        destination: modalState.destination as MoveService.MoveDestination,
        sourceContext,
        itemsWithContext
      };

      console.log("FIREBASE: ÉCRITURE - Fichier: useSimpleMoveModal.ts - Fonction: confirmMove - Path: MoveService.performMove (multiples chemins)");
      const result = await MoveService.performMove(operation);

      if (result.success) {
        // Mise à jour des taxonomies après le déplacement réussi
        await updateTaxonomiesAfterMove(
          result,
          modalState.validationResult.moveLevel!,
          modalState.destination as MoveService.MoveDestination
        );

        // Rafraîchissement des données
        if (onRefreshRef.current) {
          setModalState(prev => ({
            ...prev,
            processing: true,
            error: null
          }));

          try {
            await onRefreshRef.current();
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (refreshError) {
            console.error('❌ Erreur lors du refresh:', refreshError);
          }
        }
      }

      setModalState(prev => ({
        ...prev,
        step: 'result',
        processing: false,
        result
      }));

    } catch (error) {
      console.error('❌ Erreur lors du déplacement:', error);
      setModalState(prev => ({
        ...prev,
        step: 'result',
        processing: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        result: {
          success: false,
          movedCount: 0,
          skippedCount: modalState.selectedItemIds.length,
          errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
          warnings: []
        }
      }));
    }
  }, [
    selectedClient?.clientId,
    modalState.validationResult,
    modalState.selectedItemIds,
    modalState.destination,
    modalState.hierarchyContext,
    selectedCampaignId,
    selectedVersionId,
    selectedOngletId,
    updateTaxonomiesAfterMove
  ]);

  /**
   * Vérifie si la destination sélectionnée est complète en fonction du niveau de déplacement cible.
   * @returns {boolean} Vrai si la destination est complète, faux sinon.
   */
  const isDestinationComplete = useCallback((): boolean => {
    if (!modalState.validationResult) return false;

    const targetLevel = modalState.validationResult.targetLevel;
    const dest = modalState.destination;

    switch (targetLevel) {
      case 'onglet':
        return !!(dest.campaignId && dest.versionId && dest.ongletId);
      case 'section':
        return !!(dest.campaignId && dest.versionId && dest.ongletId && dest.sectionId);
      case 'tactique':
        return !!(dest.campaignId && dest.versionId && dest.ongletId && dest.sectionId && dest.tactiqueId);
      case 'placement':
        return !!(dest.campaignId && dest.versionId && dest.ongletId && dest.sectionId && dest.tactiqueId && dest.placementId);
      default:
        return false;
    }
  }, [modalState.validationResult, modalState.destination]);

  return {
    modalState,
    openModal,
    closeModal,
    selectDestination,
    confirmMove,
    isDestinationComplete: isDestinationComplete()
  };
}