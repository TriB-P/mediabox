// app/hooks/useMoveModal.ts - Hook pour l'état du modal de déplacement

import { useState, useCallback } from 'react';
import {
  MoveModalState,
  SelectionAnalysis,
  CascadeLevel,
  MoveDestination
} from '../types/move';

// ==================== ÉTAT INITIAL ====================

const createInitialCascadeLevel = (): CascadeLevel => ({
  level: 'campaign',
  isRequired: true,
  isVisible: true,
  items: [],
  selectedId: null,
  loading: false,
  searchTerm: ''
});

const createInitialModalState = (): MoveModalState => ({
  isOpen: false,
  step: 'destination',
  selection: null,
  destination: {},
  cascadeLevels: {
    campaign: { ...createInitialCascadeLevel(), level: 'campaign' },
    version: { ...createInitialCascadeLevel(), level: 'version', isVisible: false },
    onglet: { ...createInitialCascadeLevel(), level: 'onglet', isVisible: false },
    section: { ...createInitialCascadeLevel(), level: 'section', isVisible: false },
    tactique: { ...createInitialCascadeLevel(), level: 'tactique', isVisible: false },
    placement: { ...createInitialCascadeLevel(), level: 'placement', isVisible: false }
  },
  validation: null,
  operation: null,
  result: null,
  loading: false,
  error: null
});

// ==================== HOOK PRINCIPAL ====================

export function useMoveModal() {
  const [modalState, setModalState] = useState<MoveModalState>(createInitialModalState());

  // ==================== ACTIONS DE BASE ====================

  const openModal = useCallback((selection: SelectionAnalysis) => {
    console.log('🚀 Ouverture du modal de déplacement', selection);
    
    const newModalState = createInitialModalState();
    newModalState.isOpen = true;
    newModalState.selection = selection;
    
    // Configurer les niveaux visibles selon le type de destination
    const targetLevel = selection.targetLevel;
    
    newModalState.cascadeLevels.campaign.isVisible = true;
    newModalState.cascadeLevels.campaign.loading = true;
    newModalState.cascadeLevels.version.isVisible = true;
    newModalState.cascadeLevels.onglet.isVisible = ['onglet', 'section', 'tactique', 'placement'].includes(targetLevel);
    newModalState.cascadeLevels.section.isVisible = ['section', 'tactique', 'placement'].includes(targetLevel);
    newModalState.cascadeLevels.tactique.isVisible = ['tactique', 'placement'].includes(targetLevel);
    newModalState.cascadeLevels.placement.isVisible = targetLevel === 'placement';
    
    setModalState(newModalState);
  }, []);

  const closeModal = useCallback(() => {
    console.log('❌ Fermeture du modal de déplacement');
    setModalState(createInitialModalState());
  }, []);

  // ==================== GESTION DES ÉTAPES ====================

  const setStep = useCallback((step: MoveModalState['step']) => {
    setModalState(prev => ({ ...prev, step }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setModalState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setModalState(prev => ({ ...prev, error }));
  }, []);

  // ==================== GESTION DE LA DESTINATION ====================

  const updateDestination = useCallback((updates: Partial<MoveDestination>) => {
    setModalState(prev => ({
      ...prev,
      destination: { ...prev.destination, ...updates }
    }));
  }, []);

  const resetDestinationFromLevel = useCallback((level: string) => {
    setModalState(prev => {
      const newDestination = { ...prev.destination };
      
      // Reset selon le niveau
      const levelOrder = ['campaign', 'version', 'onglet', 'section', 'tactique', 'placement'];
      const currentIndex = levelOrder.indexOf(level);
      
      for (let i = currentIndex + 1; i < levelOrder.length; i++) {
        const nextLevel = levelOrder[i];
        
        switch (nextLevel) {
          case 'version':
            delete newDestination.versionId;
            delete newDestination.versionName;
            break;
          case 'onglet':
            delete newDestination.ongletId;
            delete newDestination.ongletName;
            break;
          case 'section':
            delete newDestination.sectionId;
            delete newDestination.sectionName;
            break;
          case 'tactique':
            delete newDestination.tactiqueId;
            delete newDestination.tactiqueName;
            break;
          case 'placement':
            delete newDestination.placementId;
            delete newDestination.placementName;
            break;
        }
      }
      
      return { ...prev, destination: newDestination };
    });
  }, []);

  // ==================== GESTION DES NIVEAUX DE CASCADE ====================

  const updateCascadeLevel = useCallback((
    level: keyof MoveModalState['cascadeLevels'],
    updates: Partial<CascadeLevel>
  ) => {
    setModalState(prev => ({
      ...prev,
      cascadeLevels: {
        ...prev.cascadeLevels,
        [level]: { ...prev.cascadeLevels[level], ...updates }
      }
    }));
  }, []);

  const selectInLevel = useCallback((level: string, itemId: string, itemName: string) => {
    setModalState(prev => {
      const newState = { ...prev };
      
      // Mettre à jour la destination
      const newDestination = { ...newState.destination };
      
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
      
      newState.destination = newDestination;
      
      // Mettre à jour la sélection pour ce niveau
      const levelKey = level as keyof typeof newState.cascadeLevels;
      newState.cascadeLevels[levelKey].selectedId = itemId;
      
      // Reset les sélections des niveaux suivants
      const levelOrder = ['campaign', 'version', 'onglet', 'section', 'tactique', 'placement'];
      const currentIndex = levelOrder.indexOf(level);
      for (let i = currentIndex + 1; i < levelOrder.length; i++) {
        const nextLevel = levelOrder[i] as keyof typeof newState.cascadeLevels;
        newState.cascadeLevels[nextLevel].selectedId = null;
        newState.cascadeLevels[nextLevel].items = [];
      }
      
      return newState;
    });
  }, []);

  const resetLevelsAfter = useCallback((level: string) => {
    setModalState(prev => {
      const newState = { ...prev };
      const levelOrder = ['campaign', 'version', 'onglet', 'section', 'tactique', 'placement'];
      const currentIndex = levelOrder.indexOf(level);
      
      for (let i = currentIndex + 1; i < levelOrder.length; i++) {
        const nextLevel = levelOrder[i] as keyof typeof newState.cascadeLevels;
        newState.cascadeLevels[nextLevel].selectedId = null;
        newState.cascadeLevels[nextLevel].items = [];
      }
      
      return newState;
    });
  }, []);

  // ==================== GESTION DU RÉSULTAT ====================

  const setResult = useCallback((result: any) => {
    setModalState(prev => ({ ...prev, result }));
  }, []);

  // ==================== RETURN ====================

  return {
    modalState,
    
    // Actions de base
    openModal,
    closeModal,
    
    // Gestion des étapes
    setStep,
    setLoading,
    setError,
    
    // Gestion de la destination
    updateDestination,
    resetDestinationFromLevel,
    
    // Gestion des niveaux de cascade
    updateCascadeLevel,
    selectInLevel,
    resetLevelsAfter,
    
    // Gestion du résultat
    setResult
  };
}

export default useMoveModal;