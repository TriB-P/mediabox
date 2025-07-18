// app/hooks/useMoveModal.ts - Hook pour l'état du modal de déplacement - VERSION CORRIGÉE

import { useState, useCallback } from 'react';
import {
  MoveModalState,
  SelectionAnalysis,
  CascadeLevel,
  MoveDestination
} from '../types/move';

// ==================== ÉTAT INITIAL ====================

const createInitialCascadeLevel = (level: CascadeLevel['level']): CascadeLevel => ({
  level,
  isRequired: level === 'campaign' || level === 'version' || level === 'onglet', // Ces 3 sont toujours requis
  isVisible: false,
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
    campaign: { ...createInitialCascadeLevel('campaign'), isVisible: true, isRequired: true },
    version: { ...createInitialCascadeLevel('version'), isVisible: true, isRequired: true },
    onglet: { ...createInitialCascadeLevel('onglet'), isVisible: true, isRequired: true },
    section: createInitialCascadeLevel('section'),
    tactique: createInitialCascadeLevel('tactique'),
    placement: createInitialCascadeLevel('placement')
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
    console.log('🚀 Ouverture du modal de déplacement avec sélection:', {
      moveLevel: selection.moveLevel,
      targetLevel: selection.targetLevel,
      itemCount: selection.rootElements.length
    });
    
    const newModalState = createInitialModalState();
    newModalState.isOpen = true;
    newModalState.selection = selection;
    
    // Configurer les niveaux visibles selon le type de destination
    const targetLevel = selection.targetLevel;
    
    // Les 3 premiers niveaux sont toujours visibles
    newModalState.cascadeLevels.campaign.isVisible = true;
    newModalState.cascadeLevels.campaign.loading = true; // Sera chargé immédiatement
    newModalState.cascadeLevels.version.isVisible = true;
    newModalState.cascadeLevels.onglet.isVisible = true;
    
    // Niveaux conditionnels selon la destination
    newModalState.cascadeLevels.section.isVisible = ['section', 'tactique', 'placement'].includes(targetLevel);
    newModalState.cascadeLevels.tactique.isVisible = ['tactique', 'placement'].includes(targetLevel);
    newModalState.cascadeLevels.placement.isVisible = targetLevel === 'placement';
    
    // Marquer les niveaux requis selon la destination
    newModalState.cascadeLevels.section.isRequired = ['section', 'tactique', 'placement'].includes(targetLevel);
    newModalState.cascadeLevels.tactique.isRequired = ['tactique', 'placement'].includes(targetLevel);
    newModalState.cascadeLevels.placement.isRequired = targetLevel === 'placement';
    
    console.log('✅ Configuration du modal:', {
      targetLevel,
      visibleLevels: Object.entries(newModalState.cascadeLevels)
        .filter(([_, level]) => level.isVisible)
        .map(([name, _]) => name),
      requiredLevels: Object.entries(newModalState.cascadeLevels)
        .filter(([_, level]) => level.isRequired)
        .map(([name, _]) => name)
    });
    
    setModalState(newModalState);
  }, []);

  const closeModal = useCallback(() => {
    console.log('❌ Fermeture du modal de déplacement');
    setModalState(createInitialModalState());
  }, []);

  // ==================== GESTION DES ÉTAPES ====================

  const setStep = useCallback((step: MoveModalState['step']) => {
    console.log('📋 Changement d\'étape:', step);
    setModalState(prev => ({ ...prev, step }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setModalState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    if (error) {
      console.error('❌ Erreur modal:', error);
    }
    setModalState(prev => ({ ...prev, error }));
  }, []);

  // ==================== GESTION DE LA DESTINATION ====================

  const updateDestination = useCallback((updates: Partial<MoveDestination>) => {
    console.log('🎯 Mise à jour destination:', updates);
    setModalState(prev => ({
      ...prev,
      destination: { ...prev.destination, ...updates }
    }));
  }, []);

  const resetDestinationFromLevel = useCallback((level: string) => {
    console.log('🔄 Reset destination depuis niveau:', level);
    
    setModalState(prev => {
      const newDestination = { ...prev.destination };
      
      // Reset selon le niveau - ordre hiérarchique
      const levelOrder = ['campaign', 'version', 'onglet', 'section', 'tactique', 'placement'];
      const currentIndex = levelOrder.indexOf(level);
      
      if (currentIndex === -1) {
        console.warn('Niveau inconnu pour reset:', level);
        return prev;
      }
      
      // Reset tous les niveaux suivants
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
      
      console.log('✅ Destination après reset:', newDestination);
      return { ...prev, destination: newDestination };
    });
  }, []);

  // ==================== GESTION DES NIVEAUX DE CASCADE ====================

  const updateCascadeLevel = useCallback((
    level: keyof MoveModalState['cascadeLevels'],
    updates: Partial<CascadeLevel>
  ) => {
    console.log(`🔧 Mise à jour niveau ${level}:`, updates);
    
    setModalState(prev => ({
      ...prev,
      cascadeLevels: {
        ...prev.cascadeLevels,
        [level]: { ...prev.cascadeLevels[level], ...updates }
      }
    }));
  }, []);

  const selectInLevel = useCallback((level: string, itemId: string, itemName: string) => {
    console.log(`🎯 Sélection dans niveau ${level}:`, { itemId, itemName });
    
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
        default:
          console.warn('Niveau inconnu pour sélection:', level);
          return prev;
      }
      
      newState.destination = newDestination;
      
      // Mettre à jour la sélection pour ce niveau
      const levelKey = level as keyof typeof newState.cascadeLevels;
      if (newState.cascadeLevels[levelKey]) {
        newState.cascadeLevels[levelKey].selectedId = itemId;
      }
      
      // Reset les sélections des niveaux suivants
      const levelOrder = ['campaign', 'version', 'onglet', 'section', 'tactique', 'placement'];
      const currentIndex = levelOrder.indexOf(level);
      
      for (let i = currentIndex + 1; i < levelOrder.length; i++) {
        const nextLevel = levelOrder[i] as keyof typeof newState.cascadeLevels;
        if (newState.cascadeLevels[nextLevel]) {
          newState.cascadeLevels[nextLevel].selectedId = null;
          newState.cascadeLevels[nextLevel].items = [];
          newState.cascadeLevels[nextLevel].loading = false;
        }
      }
      
      console.log('✅ État après sélection:', {
        destination: newDestination,
        selectedLevel: level,
        resetLevels: levelOrder.slice(currentIndex + 1)
      });
      
      return newState;
    });
  }, []);

  const resetLevelsAfter = useCallback((level: string) => {
    console.log('🔄 Reset niveaux après:', level);
    
    setModalState(prev => {
      const newState = { ...prev };
      const levelOrder = ['campaign', 'version', 'onglet', 'section', 'tactique', 'placement'];
      const currentIndex = levelOrder.indexOf(level);
      
      if (currentIndex === -1) {
        console.warn('Niveau inconnu pour reset:', level);
        return prev;
      }
      
      // Reset tous les niveaux suivants
      for (let i = currentIndex + 1; i < levelOrder.length; i++) {
        const nextLevel = levelOrder[i] as keyof typeof newState.cascadeLevels;
        if (newState.cascadeLevels[nextLevel]) {
          newState.cascadeLevels[nextLevel].selectedId = null;
          newState.cascadeLevels[nextLevel].items = [];
          newState.cascadeLevels[nextLevel].loading = false;
          newState.cascadeLevels[nextLevel].searchTerm = '';
        }
      }
      
      return newState;
    });
  }, []);

  // ==================== GESTION DU RÉSULTAT ====================

  const setResult = useCallback((result: any) => {
    console.log('📊 Résultat de l\'opération:', result);
    setModalState(prev => ({ ...prev, result }));
  }, []);

  // ==================== UTILITAIRES ====================

  const clearError = useCallback(() => {
    setModalState(prev => ({ ...prev, error: null }));
  }, []);

  const isLevelComplete = useCallback((level: string): boolean => {
    const currentLevel = modalState.cascadeLevels[level as keyof typeof modalState.cascadeLevels];
    return !!(currentLevel?.selectedId && currentLevel.selectedId !== null);
  }, [modalState.cascadeLevels]);

  const getSelectedItemName = useCallback((level: string): string | null => {
    const selectedId = modalState.cascadeLevels[level as keyof typeof modalState.cascadeLevels]?.selectedId;
    if (!selectedId) return null;
    
    const levelData = modalState.cascadeLevels[level as keyof typeof modalState.cascadeLevels];
    const selectedItem = levelData?.items.find(item => item.id === selectedId);
    
    return selectedItem?.name || null;
  }, [modalState.cascadeLevels]);

  // ==================== VALIDATION ====================

  const validateDestination = useCallback((): { isValid: boolean; missingLevels: string[] } => {
    if (!modalState.selection) {
      return { isValid: false, missingLevels: ['selection'] };
    }

    const targetLevel = modalState.selection.targetLevel;
    const dest = modalState.destination;
    const missingLevels: string[] = [];

    // Vérifier les niveaux requis selon la destination
    if (!dest.campaignId) missingLevels.push('campaign');
    if (!dest.versionId) missingLevels.push('version');
    if (!dest.ongletId) missingLevels.push('onglet');

    if (['section', 'tactique', 'placement'].includes(targetLevel) && !dest.sectionId) {
      missingLevels.push('section');
    }
    if (['tactique', 'placement'].includes(targetLevel) && !dest.tactiqueId) {
      missingLevels.push('tactique');
    }
    if (targetLevel === 'placement' && !dest.placementId) {
      missingLevels.push('placement');
    }

    return {
      isValid: missingLevels.length === 0,
      missingLevels
    };
  }, [modalState.selection, modalState.destination]);

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
    clearError,
    
    // Gestion de la destination
    updateDestination,
    resetDestinationFromLevel,
    
    // Gestion des niveaux de cascade
    updateCascadeLevel,
    selectInLevel,
    resetLevelsAfter,
    
    // Gestion du résultat
    setResult,
    
    // Utilitaires
    isLevelComplete,
    getSelectedItemName,
    validateDestination
  };
}

export default useMoveModal;