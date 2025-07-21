// app/hooks/useSimpleMoveModal.ts - Hook simple pour gérer le modal de déplacement

import { useState, useCallback } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { SelectionValidationResult } from './useSelectionValidation';
import * as MoveService from '../lib/simpleMoveService';

// ==================== TYPES ====================

export interface MoveModalState {
  isOpen: boolean;
  step: 'destination' | 'progress' | 'result';
  
  // Données de validation
  validationResult: SelectionValidationResult | null;
  selectedItemIds: string[];
  
  // Navigation dans le modal
  campaigns: MoveService.CascadeItem[];
  versions: MoveService.CascadeItem[];
  onglets: MoveService.CascadeItem[];
  sections: MoveService.CascadeItem[];
  tactiques: MoveService.CascadeItem[];
  placements: MoveService.CascadeItem[];
  
  // Destination sélectionnée
  destination: Partial<MoveService.MoveDestination>;
  
  // États de chargement
  loadingCampaigns: boolean;
  loadingVersions: boolean;
  loadingOnglets: boolean;
  loadingSections: boolean;
  loadingTactiques: boolean;
  loadingPlacements: boolean;
  
  // Résultat final
  result: MoveService.MoveResult | null;
  processing: boolean;
  error: string | null;
}

// ==================== HOOK PRINCIPAL ====================

export function useSimpleMoveModal() {
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();
  
  // ==================== ÉTAT DU MODAL ====================
  
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
    error: null
  });

  // ==================== OUVERTURE DU MODAL ====================
  
  const openModal = useCallback(async (
    validationResult: SelectionValidationResult,
    selectedItemIds: string[]
  ) => {
    console.log('🚀 Ouverture du modal de déplacement');
    console.log('📊 Validation:', validationResult);
    console.log('📦 Éléments sélectionnés:', selectedItemIds);
    
    if (!selectedClient?.clientId) {
      console.error('❌ Aucun client sélectionné');
      return;
    }
    
    // Réinitialiser et ouvrir le modal
    setModalState(prev => ({
      ...prev,
      isOpen: true,
      step: 'destination',
      validationResult,
      selectedItemIds,
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
    
    // Charger les campagnes immédiatement
    await loadCampaigns();
  }, [selectedClient?.clientId]);

  // ==================== FERMETURE DU MODAL ====================
  
  const closeModal = useCallback(() => {
    console.log('❌ Fermeture du modal de déplacement');
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  // ==================== FONCTIONS DE CHARGEMENT ====================
  
  const loadCampaigns = useCallback(async () => {
    if (!selectedClient?.clientId) return;
    
    setModalState(prev => ({ ...prev, loadingCampaigns: true, error: null }));
    
    try {
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
  
  const loadVersions = useCallback(async (campaignId: string) => {
    if (!selectedClient?.clientId) return;
    
    setModalState(prev => ({ ...prev, loadingVersions: true, error: null }));
    
    try {
      const versions = await MoveService.loadVersions(selectedClient.clientId, campaignId);
      setModalState(prev => ({ 
        ...prev, 
        versions, 
        loadingVersions: false,
        // Reset les niveaux suivants
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
  
  const loadOnglets = useCallback(async (campaignId: string, versionId: string) => {
    if (!selectedClient?.clientId) return;
    
    setModalState(prev => ({ ...prev, loadingOnglets: true, error: null }));
    
    try {
      const onglets = await MoveService.loadOnglets(selectedClient.clientId, campaignId, versionId);
      setModalState(prev => ({ 
        ...prev, 
        onglets, 
        loadingOnglets: false,
        // Reset les niveaux suivants
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
  
  const loadSections = useCallback(async (campaignId: string, versionId: string, ongletId: string) => {
    if (!selectedClient?.clientId) return;
    
    setModalState(prev => ({ ...prev, loadingSections: true, error: null }));
    
    try {
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
        // Reset les niveaux suivants
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
  
  const loadTactiques = useCallback(async (
    campaignId: string, 
    versionId: string, 
    ongletId: string, 
    sectionId: string
  ) => {
    if (!selectedClient?.clientId) return;
    
    setModalState(prev => ({ ...prev, loadingTactiques: true, error: null }));
    
    try {
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
        // Reset les niveaux suivants
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

  // ==================== SÉLECTION DE DESTINATION ====================
  
  const selectDestination = useCallback(async (level: string, itemId: string, itemName: string) => {
    console.log(`🎯 Sélection destination ${level}:`, { itemId, itemName });
    
    // Mettre à jour la destination
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
    
    // Charger le niveau suivant
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

  // ==================== CONFIRMATION DU DÉPLACEMENT ====================
  
  const confirmMove = useCallback(async () => {
    if (!selectedClient?.clientId || !modalState.validationResult || !modalState.validationResult.canMove) {
      console.error('❌ Conditions non remplies pour le déplacement');
      return;
    }
    
    console.log('🚀 Confirmation du déplacement');
    
    setModalState(prev => ({ ...prev, step: 'progress', processing: true, error: null }));
    
    try {
      const operation: MoveService.MoveOperation = {
        clientId: selectedClient.clientId,
        itemType: modalState.validationResult.moveLevel!,
        selectedItemIds: modalState.selectedItemIds,
        destination: modalState.destination as MoveService.MoveDestination,
        sourceContext: {
          campaignId: selectedCampaignId!,
          versionId: selectedVersionId!,
          ongletId: selectedOngletId!
        }
      };
      
      const result = await MoveService.performMove(operation);
      
      console.log('✅ Déplacement terminé:', result);
      
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
  }, [selectedClient?.clientId, modalState.validationResult, modalState.selectedItemIds, modalState.destination, selectedCampaignId, selectedVersionId, selectedOngletId]);

  // ==================== UTILITAIRES ====================
  
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

  // ==================== RETURN ====================
  
  return {
    modalState,
    openModal,
    closeModal,
    selectDestination,
    confirmMove,
    isDestinationComplete: isDestinationComplete()
  };
}