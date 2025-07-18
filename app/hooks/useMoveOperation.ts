// app/hooks/useMoveOperation.ts - VERSION CORRIGÉE AVEC RÉCUPÉRATION CONTEXTE HIÉRARCHIQUE

import { useCallback, useMemo, useEffect, useState } from 'react';
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
  UseMoveOperationReturn,
  buildParentPath
} from '../types/move';
import { Section, Tactique, Placement, Creatif } from '../types/tactiques';
import { moveItems, validateMoveDestination } from '../lib/moveService';
import useMoveModal from './useMoveModal';
import useMoveData from './useMoveData';

// ==================== 🔥 NOUVEAU: INTERFACE POUR LE CONTEXTE HIÉRARCHIQUE ====================

interface HierarchyContextMap {
  [itemId: string]: {
    itemType: MoveItemType;
    campaignId: string;
    versionId: string;
    ongletId: string;
    sectionId?: string;
    tactiqueId?: string;
    placementId?: string;
  };
}

// ==================== HELPERS POUR DÉTECTER LES TYPES ====================

function detectItemType(item: any): MoveItemType | null {
  console.log('🔍 Détection de type pour item:', {
    id: item.id,
    type: item.type,
    keys: Object.keys(item),
    sampleProperties: {
      SECTION_Name: item.SECTION_Name,
      TC_Label: item.TC_Label,
      PL_Label: item.PL_Label,
      CR_Label: item.CR_Label
    }
  });

  if (item.type && ['section', 'tactique', 'placement', 'creatif'].includes(item.type)) {
    console.log('✅ Type détecté via propriété directe:', item.type);
    return item.type as MoveItemType;
  }

  if (item.SECTION_Name !== undefined) return 'section';
  if (item.TC_Label !== undefined) return 'tactique';
  if (item.PL_Label !== undefined) return 'placement';
  if (item.CR_Label !== undefined) return 'creatif';
  
  console.warn('❌ Type non détecté pour item:', item);
  return null;
}

function getItemDisplayName(item: any, type: MoveItemType): string {
  if (item.name) {
    console.log('✅ Nom trouvé via propriété directe:', item.name);
    return item.name;
  }

  switch (type) {
    case 'section': return item.SECTION_Name || 'Section sans nom';
    case 'tactique': return item.TC_Label || 'Tactique sans nom';
    case 'placement': return item.PL_Label || 'Placement sans nom';
    case 'creatif': return item.CR_Label || 'Créatif sans nom';
    default: return 'Élément sans nom';
  }
}

// ==================== HOOK PRINCIPAL ====================

export function useMoveOperation(
  onRefreshCallback?: () => Promise<void>,
  // 🔥 NOUVEAU: Ajouter des informations de contexte hiérarchique
  hierarchyContext?: {
    sections?: any[];
    tactiques?: { [sectionId: string]: any[] };
    placements?: { [tactiqueId: string]: any[] };
    creatifs?: { [placementId: string]: any[] };
  }
): UseMoveOperationReturn {
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

  // ==================== 🔥 NOUVEAU: CARTE DU CONTEXTE HIÉRARCHIQUE ====================

  const [hierarchyContextMap, setHierarchyContextMap] = useState<HierarchyContextMap>({});

  // Construire la carte de contexte hiérarchique depuis les données fournies
  useEffect(() => {
    if (!hierarchyContext || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      setHierarchyContextMap({});
      return;
    }

    const { sections = [], tactiques = {}, placements = {}, creatifs = {} } = hierarchyContext;
    const contextMap: HierarchyContextMap = {};

    console.log('🗺️ Construction de la carte de contexte hiérarchique');

    // Parcourir toute la hiérarchie pour construire la carte de contexte
    sections.forEach(section => {
      // Contexte pour les sections
      contextMap[section.id] = {
        itemType: 'section',
        campaignId: selectedCampaignId,
        versionId: selectedVersionId,
        ongletId: selectedOngletId
      };

      // Contexte pour les tactiques de cette section
      const sectionTactiques = tactiques[section.id] || [];
      sectionTactiques.forEach(tactique => {
        contextMap[tactique.id] = {
          itemType: 'tactique',
          campaignId: selectedCampaignId,
          versionId: selectedVersionId,
          ongletId: selectedOngletId,
          sectionId: section.id
        };

        // Contexte pour les placements de cette tactique
        const tactiquePlacements = placements[tactique.id] || [];
        tactiquePlacements.forEach(placement => {
          contextMap[placement.id] = {
            itemType: 'placement',
            campaignId: selectedCampaignId,
            versionId: selectedVersionId,
            ongletId: selectedOngletId,
            sectionId: section.id,
            tactiqueId: tactique.id
          };

          // Contexte pour les créatifs de ce placement
          const placementCreatifs = creatifs[placement.id] || [];
          placementCreatifs.forEach(creatif => {
            contextMap[creatif.id] = {
              itemType: 'creatif',
              campaignId: selectedCampaignId,
              versionId: selectedVersionId,
              ongletId: selectedOngletId,
              sectionId: section.id,
              tactiqueId: tactique.id,
              placementId: placement.id
            };
          });
        });
      });
    });

    console.log('✅ Carte de contexte construite:', Object.keys(contextMap).length, 'éléments');
    setHierarchyContextMap(contextMap);

  }, [hierarchyContext, selectedCampaignId, selectedVersionId, selectedOngletId]);

  // ==================== 🔥 ANALYSE DE SÉLECTION CORRIGÉE ====================

  const analyzeSelection = useCallback((selectedItems: any[]): SelectionAnalysis => {
    console.log('🔍 Analyse de sélection démarrée avec:', selectedItems);

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

    console.log('🔍 Contexte de sélection:', {
      selectedCampaignId,
      selectedVersionId,
      selectedOngletId,
      hasClient: !!selectedClient?.clientId,
      hierarchyContextMapSize: Object.keys(hierarchyContextMap).length
    });

    if (!selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      return {
        isValid: false,
        canMove: false,
        rootElements: [],
        allElements: [],
        moveLevel: 'section',
        targetLevel: 'onglet',
        totalItemsToMove: 0,
        errorMessage: 'Contexte manquant (campagne, version ou onglet non sélectionné)'
      };
    }

    try {
      const convertedElements: SelectedItemWithSource[] = [];
      const itemTypes = new Set<MoveItemType>();

      for (const item of selectedItems) {
        const itemType = detectItemType(item);
        if (!itemType) {
          console.warn('Type d\'élément non reconnu:', item);
          continue;
        }

        itemTypes.add(itemType);

        // 🔥 NOUVEAU: Récupérer le contexte depuis la carte hiérarchique
        const itemContext = hierarchyContextMap[item.id];
        
        console.log(`🔧 Construction parentPath pour ${itemType} ${item.id}:`, {
          itemContext,
          hierarchyContextMapHasItem: !!itemContext
        });

        let parentPath: string[] = [];

        if (itemContext) {
          // Utiliser le contexte de la carte hiérarchique
          console.log('✅ Utilisation du contexte hiérarchique:', itemContext);
          parentPath = buildParentPath(itemType, {
            campaignId: itemContext.campaignId,
            versionId: itemContext.versionId,
            ongletId: itemContext.ongletId,
            sectionId: itemContext.sectionId,
            tactiqueId: itemContext.tactiqueId,
            placementId: itemContext.placementId
          });
        } else {
          // 🔥 FALLBACK: Essayer de construire depuis les propriétés de l'item
          console.log('⚠️ Fallback: construction depuis propriétés item');
          
          switch (itemType) {
            case 'section':
              parentPath = buildParentPath('section', {
                campaignId: selectedCampaignId,
                versionId: selectedVersionId,
                ongletId: selectedOngletId
              });
              break;

            case 'tactique':
              const sectionIdForTactique = item.TC_SectionId || 
                item.contextSectionId || 
                item.sectionId;
              
              if (sectionIdForTactique) {
                parentPath = buildParentPath('tactique', {
                  campaignId: selectedCampaignId,
                  versionId: selectedVersionId,
                  ongletId: selectedOngletId,
                  sectionId: sectionIdForTactique
                });
              }
              break;

            case 'placement':
              const tactiqueIdForPlacement = item.PL_TactiqueId || 
                item.contextTactiqueId || 
                item.tactiqueId;
              const sectionIdForPlacement = item.PL_SectionId || 
                item.contextSectionId || 
                item.sectionId;
              
              if (tactiqueIdForPlacement && sectionIdForPlacement) {
                parentPath = buildParentPath('placement', {
                  campaignId: selectedCampaignId,
                  versionId: selectedVersionId,
                  ongletId: selectedOngletId,
                  sectionId: sectionIdForPlacement,
                  tactiqueId: tactiqueIdForPlacement
                });
              }
              break;

            case 'creatif':
              const placementIdForCreatif = item.CR_PlacementId || 
                item.contextPlacementId || 
                item.placementId;
              const tactiqueIdForCreatif = item.CR_TactiqueId || 
                item.contextTactiqueId || 
                item.tactiqueId;
              const sectionIdForCreatif = item.CR_SectionId || 
                item.contextSectionId || 
                item.sectionId;
              
              if (placementIdForCreatif && tactiqueIdForCreatif && sectionIdForCreatif) {
                parentPath = buildParentPath('creatif', {
                  campaignId: selectedCampaignId,
                  versionId: selectedVersionId,
                  ongletId: selectedOngletId,
                  sectionId: sectionIdForCreatif,
                  tactiqueId: tactiqueIdForCreatif,
                  placementId: placementIdForCreatif
                });
              }
              break;
          }
        }

        if (parentPath.length === 0) {
          console.error('❌ ParentPath vide pour:', {
            itemType,
            itemId: item.id,
            itemContext,
            selectedCampaignId,
            selectedVersionId,
            selectedOngletId
          });
          continue;
        }

        console.log(`✅ Élément ${itemType} converti:`, {
          id: item.id,
          name: getItemDisplayName(item, itemType),
          parentPath
        });

        convertedElements.push({
          id: item.id,
          type: itemType,
          selectionSource: 'direct',
          parentPath,
          item: item as Section | Tactique | Placement | Creatif
        });
      }

      // Validation des éléments convertis
      if (convertedElements.length === 0) {
        return {
          isValid: false,
          canMove: false,
          rootElements: [],
          allElements: [],
          moveLevel: 'section',
          targetLevel: 'onglet',
          totalItemsToMove: 0,
          errorMessage: 'Aucun élément valide trouvé dans la sélection'
        };
      }

      // Vérifier que tous les éléments sont du même type
      if (itemTypes.size > 1) {
        return {
          isValid: false,
          canMove: false,
          rootElements: convertedElements,
          allElements: convertedElements,
          moveLevel: 'section',
          targetLevel: 'onglet',
          totalItemsToMove: convertedElements.length,
          errorMessage: `Impossible de déplacer des éléments de types différents (${Array.from(itemTypes).join(', ')})`
        };
      }

      const moveLevel = Array.from(itemTypes)[0];
      const targetLevel = MOVE_LEVEL_HIERARCHY[moveLevel];

      console.log('✅ Analyse terminée avec succès:', {
        rootElements: convertedElements.length,
        totalElements: convertedElements.length,
        moveLevel,
        targetLevel
      });

      return {
        isValid: true,
        canMove: true,
        rootElements: convertedElements,
        allElements: convertedElements,
        moveLevel,
        targetLevel,
        totalItemsToMove: convertedElements.length
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse de sélection:', error);
      return {
        isValid: false,
        canMove: false,
        rootElements: [],
        allElements: [],
        moveLevel: 'section',
        targetLevel: 'onglet',
        totalItemsToMove: 0,
        errorMessage: `Erreur d'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }, [selectedCampaignId, selectedVersionId, selectedOngletId, hierarchyContextMap]);

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
    console.log('🚀 Ouverture du modal de déplacement');
    openModal(selection);
    
    // Charger immédiatement les campagnes
    try {
      updateCascadeLevel('campaign', { loading: true });
      const campaigns = await moveData.loadCampaigns();
      updateCascadeLevel('campaign', { items: campaigns, loading: false });
      console.log(`📋 ${campaigns.length} campagnes chargées`);
    } catch (error) {
      console.error('❌ Erreur chargement campagnes:', error);
      setError('Erreur lors du chargement des campagnes');
      updateCascadeLevel('campaign', { loading: false });
    }
  }, [openModal, updateCascadeLevel, moveData, setError]);

  // ==================== SÉLECTION DE DESTINATION ====================

  const selectDestination = useCallback(async (level: string, itemId: string) => {
    console.log('🎯 Sélection de destination:', { level, itemId });
    
    // Trouver l'item sélectionné
    const currentLevel = modalState.cascadeLevels[level as keyof typeof modalState.cascadeLevels];
    const selectedItem = currentLevel.items.find(item => item.id === itemId);
    if (!selectedItem) {
      console.error('Item non trouvé:', itemId);
      return;
    }
    
    // Mettre à jour la sélection dans le modal
    selectInLevel(level, itemId, selectedItem.name);
    
    // Charger les données du niveau suivant
    const dest = modalState.destination;
    
    try {
      switch (level) {
        case 'campaign':
          if (modalState.cascadeLevels.version.isVisible) {
            console.log('🔄 Chargement versions pour campagne:', itemId);
            updateCascadeLevel('version', { loading: true });
            const versions = await moveData.loadVersions(itemId);
            updateCascadeLevel('version', { items: versions, loading: false });
          }
          break;
          
        case 'version':
          if (modalState.cascadeLevels.onglet.isVisible && dest.campaignId) {
            console.log('🔄 Chargement onglets pour version:', itemId);
            updateCascadeLevel('onglet', { loading: true });
            const onglets = await moveData.loadOnglets(dest.campaignId, itemId);
            updateCascadeLevel('onglet', { items: onglets, loading: false });
          }
          break;
          
        case 'onglet':
          if (modalState.cascadeLevels.section.isVisible && dest.campaignId && dest.versionId) {
            console.log('🔄 Chargement sections pour onglet:', itemId);
            updateCascadeLevel('section', { loading: true });
            const sections = await moveData.loadSections(dest.campaignId, dest.versionId, itemId);
            updateCascadeLevel('section', { items: sections, loading: false });
          }
          break;
          
        case 'section':
          if (modalState.cascadeLevels.tactique.isVisible && dest.campaignId && dest.versionId && dest.ongletId) {
            console.log('🔄 Chargement tactiques pour section:', itemId);
            updateCascadeLevel('tactique', { loading: true });
            const tactiques = await moveData.loadTactiques(dest.campaignId, dest.versionId, dest.ongletId, itemId);
            updateCascadeLevel('tactique', { items: tactiques, loading: false });
          }
          break;
          
        case 'tactique':
          if (modalState.cascadeLevels.placement.isVisible && dest.campaignId && dest.versionId && dest.ongletId && dest.sectionId) {
            console.log('🔄 Chargement placements pour tactique:', itemId);
            updateCascadeLevel('placement', { loading: true });
            const placements = await moveData.loadPlacements(dest.campaignId, dest.versionId, dest.ongletId, dest.sectionId, itemId);
            updateCascadeLevel('placement', { items: placements, loading: false });
          }
          break;
      }
    } catch (error) {
      console.error(`❌ Erreur chargement niveau ${level}:`, error);
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

      console.log('📦 Opération de déplacement:', operation);

      // Exécuter le déplacement
      const result = await moveItems(operation);

      setStep('result');
      setLoading(false);
      setResult(result);

      console.log('✅ Déplacement terminé:', result);

      // Refresh automatique après succès
      if (result.success && onRefreshCallback) {
        console.log('🔄 Refresh automatique après déplacement réussi');
        setTimeout(() => {
          onRefreshCallback();
        }, 1500);
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