// app/hooks/useMoveOperation.ts - VERSION SIMPLIFIÉE

import { useCallback, useMemo } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import {
  SelectionAnalysis,
  SelectedItemWithSource,
  MoveDestination,
  MoveOperation,
  MoveItemType,
  MOVE_LEVEL_HIERARCHY,
  MOVE_LEVEL_LABELS,
  TARGET_LEVEL_LABELS,
  UseMoveOperationReturn
} from '../types/move';
import { Section, Tactique, Placement, Creatif } from '../types/tactiques';
import { moveItems, validateMoveDestination } from '../lib/moveService';
import useMoveModal from './useMoveModal';
import useMoveData from './useMoveData';

// ==================== HOOK PRINCIPAL ====================

export function useMoveOperation(onRefreshCallback?: () => Promise<void>): UseMoveOperationReturn {
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();
  
  const {
    modalState,
    openModal,
    closeModal,
    setStep,
    setLoading,
    setError,
    updateCascadeLevel,
    selectInLevel,
    setResult
  } = useMoveModal();

  const moveData = useMoveData(selectedClient?.clientId || '');

  // ==================== ANALYSE DE SÉLECTION ====================

  const analyzeSelection = useCallback((selectedItems: any[]): SelectionAnalysis => {
    console.log('🔍 Analyse de sélection:', selectedItems);

    if (!selectedItems || selectedItems.length === 0) {
      return {
        isValid: false,
        canMove: false,
        rootElements: [],
        allElements: [],
        moveLevel: 'section',
        targetLevel: 'onglet',
        totalItemsToMove: 0,
        errorMessage: 'Aucun élément sélectionné'
      };
    }

    // Conversion des éléments
    const convertedElements: SelectedItemWithSource[] = selectedItems.map(item => {
      let itemType: MoveItemType;
      let parentPath: string[] = [];
      let actualItem: Section | Tactique | Placement | Creatif;

      // Détection du type d'élément
      if ('SECTION_Name' in item) {
        itemType = 'section';
        parentPath = [
          selectedCampaignId || '',
          selectedVersionId || '',
          selectedOngletId || ''
        ];
        actualItem = item as Section;
      } else if ('TC_Label' in item) {
        itemType = 'tactique';
        parentPath = [
          item.TC_SectionId || '',
          selectedCampaignId || '',
          selectedVersionId || '',
          selectedOngletId || ''
        ];
        actualItem = item as Tactique;
      } else if ('PL_Label' in item) {
        itemType = 'placement';
        parentPath = [
          item.PL_SectionId || '',
          item.PL_TactiqueId || '',
          selectedCampaignId || '',
          selectedVersionId || '',
          selectedOngletId || ''
        ];
        actualItem = item as Placement;
      } else if ('CR_Label' in item) {
        itemType = 'creatif';
        parentPath = [
          item.CR_SectionId || '',
          item.CR_TactiqueId || '',
          item.CR_PlacementId || '',
          selectedCampaignId || '',
          selectedVersionId || '',
          selectedOngletId || ''
        ];
        actualItem = item as Creatif;
      } else {
        throw new Error(`Type d'élément non reconnu: ${JSON.stringify(item)}`);
      }

      return {
        id: item.id,
        type: itemType,
        selectionSource: 'direct' as const,
        parentPath,
        item: actualItem
      };
    });

    // Déterminer les éléments racines (tous pour simplifier)
    const rootElements = convertedElements;

    // Validation
    if (rootElements.length === 0) {
      return {
        isValid: false,
        canMove: false,
        rootElements,
        allElements: convertedElements,
        moveLevel: 'section',
        targetLevel: 'onglet',
        totalItemsToMove: convertedElements.length,
        errorMessage: 'Aucun élément racine identifié'
      };
    }

    // Vérifier que tous les éléments racines sont du même type
    const rootTypes = new Set(rootElements.map(el => el.type));
    if (rootTypes.size > 1) {
      return {
        isValid: false,
        canMove: false,
        rootElements,
        allElements: convertedElements,
        moveLevel: 'section',
        targetLevel: 'onglet',
        totalItemsToMove: convertedElements.length,
        errorMessage: `Impossible de déplacer des éléments de types différents (${Array.from(rootTypes).join(', ')})`
      };
    }

    const moveLevel = rootElements[0]?.type || 'section';
    const targetLevel = MOVE_LEVEL_HIERARCHY[moveLevel];

    console.log('✅ Analyse terminée avec succès:', {
      rootElements: rootElements.length,
      totalElements: convertedElements.length,
      moveLevel,
      targetLevel
    });

    return {
      isValid: true,
      canMove: true,
      rootElements,
      allElements: convertedElements,
      moveLevel,
      targetLevel,
      totalItemsToMove: convertedElements.length
    };
  }, [selectedCampaignId, selectedVersionId, selectedOngletId]);

  // ==================== FONCTIONS UTILITAIRES ====================

  const canMoveSelection = useCallback((selectedItems: any[]): boolean => {
    const analysis = analyzeSelection(selectedItems);
    return analysis.canMove;
  }, [analyzeSelection]);

  const getMoveButtonLabel = useCallback((selectedItems: any[]): string => {
    const analysis = analyzeSelection(selectedItems);
    
    if (!analysis.canMove) {
      return analysis.errorMessage || 'Sélection invalide';
    }

    const rootCount = analysis.rootElements.length;
    const itemLabel = MOVE_LEVEL_LABELS[analysis.moveLevel];
    const targetLabel = TARGET_LEVEL_LABELS[analysis.targetLevel];
    
    return `Déplacer ${rootCount} ${itemLabel} vers ${targetLabel}`;
  }, [analyzeSelection]);

  // ==================== GESTION DU MODAL ====================

  const openMoveModal = useCallback(async (selection: SelectionAnalysis) => {
    openModal(selection);
    
    // Charger immédiatement les campagnes
    try {
      updateCascadeLevel('campaign', { loading: true });
      const campaigns = await moveData.loadCampaigns();
      updateCascadeLevel('campaign', { items: campaigns, loading: false });
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
      setError('Erreur lors du chargement des campagnes');
      updateCascadeLevel('campaign', { loading: false });
    }
  }, [openModal, updateCascadeLevel, moveData, setError]);

  // ==================== SÉLECTION DE DESTINATION ====================

  const selectDestination = useCallback(async (level: string, itemId: string) => {
    console.log('🎯 Sélection de destination:', level, itemId);
    
    // Trouver l'item sélectionné
    const currentLevel = modalState.cascadeLevels[level as keyof typeof modalState.cascadeLevels];
    const selectedItem = currentLevel.items.find(item => item.id === itemId);
    if (!selectedItem) return;
    
    // Mettre à jour la sélection dans le modal
    selectInLevel(level, itemId, selectedItem.name);
    
    // Charger les données du niveau suivant
    const dest = modalState.destination;
    
    try {
      switch (level) {
        case 'campaign':
          if (modalState.cascadeLevels.version.isVisible) {
            updateCascadeLevel('version', { loading: true });
            const versions = await moveData.loadVersions(itemId);
            updateCascadeLevel('version', { items: versions, loading: false });
          }
          break;
          
        case 'version':
          if (modalState.cascadeLevels.onglet.isVisible && dest.campaignId) {
            updateCascadeLevel('onglet', { loading: true });
            const onglets = await moveData.loadOnglets(dest.campaignId, itemId);
            updateCascadeLevel('onglet', { items: onglets, loading: false });
          }
          break;
          
        case 'onglet':
          if (modalState.cascadeLevels.section.isVisible && dest.campaignId && dest.versionId) {
            updateCascadeLevel('section', { loading: true });
            const sections = await moveData.loadSections(dest.campaignId, dest.versionId, itemId);
            updateCascadeLevel('section', { items: sections, loading: false });
          }
          break;
          
        case 'section':
          if (modalState.cascadeLevels.tactique.isVisible && dest.campaignId && dest.versionId && dest.ongletId) {
            updateCascadeLevel('tactique', { loading: true });
            const tactiques = await moveData.loadTactiques(dest.campaignId, dest.versionId, dest.ongletId, itemId);
            updateCascadeLevel('tactique', { items: tactiques, loading: false });
          }
          break;
          
        case 'tactique':
          if (modalState.cascadeLevels.placement.isVisible && dest.campaignId && dest.versionId && dest.ongletId && dest.sectionId) {
            updateCascadeLevel('placement', { loading: true });
            const placements = await moveData.loadPlacements(dest.campaignId, dest.versionId, dest.ongletId, dest.sectionId, itemId);
            updateCascadeLevel('placement', { items: placements, loading: false });
          }
          break;
      }
    } catch (error) {
      console.error(`Erreur chargement niveau ${level}:`, error);
      setError(`Erreur lors du chargement des données pour ${level}`);
    }
  }, [modalState, selectInLevel, updateCascadeLevel, moveData, setError]);

  // ==================== CONFIRMATION DU DÉPLACEMENT ====================

  const confirmMove = useCallback(async (): Promise<void> => {
    if (!modalState.selection || !selectedClient?.clientId) {
      throw new Error('Contexte invalide pour le déplacement');
    }

    console.log('🚀 Confirmation du déplacement');

    setStep('progress');
    setLoading(true);
    setError(null);

    try {
      // Validation finale
      const validation = await validateMoveDestination(modalState.destination, selectedClient.clientId);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Construire l'opération de déplacement
      const operation: MoveOperation = {
        sourceItems: modalState.selection.rootElements,
        destination: modalState.destination as MoveDestination,
        operationType: modalState.selection.moveLevel,
        totalItemsAffected: modalState.selection.totalItemsToMove,
        clientId: selectedClient.clientId
      };

      // Exécuter le déplacement
      const result = await moveItems(operation);

      setStep('result');
      setLoading(false);
      setResult(result);

      console.log('✅ Déplacement terminé:', result);

      // 🔥 NOUVEAU: Refresh automatique après succès
      if (result.success && onRefreshCallback) {
        console.log('🔄 Refresh automatique après déplacement réussi');
        setTimeout(() => {
          onRefreshCallback();
        }, 1000); // Délai court pour laisser le temps à Firebase de se synchroniser
      }

    } catch (error) {
      console.error('❌ Erreur lors du déplacement:', error);
      setStep('result');
      setLoading(false);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      setResult({
        success: false,
        movedItemsCount: 0,
        skippedItemsCount: modalState.selection?.totalItemsToMove || 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
        warnings: []
      });
    }
  }, [modalState, selectedClient?.clientId, setStep, setLoading, setError, setResult, onRefreshCallback]);

  // ==================== VALIDATION ====================

  const validateMove = useCallback(async (destination: Partial<MoveDestination>) => {
    if (!selectedClient?.clientId) {
      return {
        isValid: false,
        canProceed: false,
        errors: ['Client non sélectionné'],
        warnings: []
      };
    }
    
    return await validateMoveDestination(destination, selectedClient.clientId);
  }, [selectedClient?.clientId]);

  // ==================== DESTINATION COMPLÈTE ====================

  const isDestinationComplete = useMemo((): boolean => {
    if (!modalState.selection) return false;
    
    const targetLevel = modalState.selection.targetLevel;
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
  }, [modalState.selection, modalState.destination]);

  // ==================== RETURN ====================

  return {
    modalState,
    openMoveModal,
    closeMoveModal: closeModal,
    selectDestination,
    confirmMove,
    analyzeSelection,
    validateMove,
    canMoveSelection,
    getMoveButtonLabel
  };
}

export default useMoveOperation;