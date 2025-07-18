// app/hooks/useMoveOperation.ts - VERSION CORRIGÉE AVEC GESTION HIÉRARCHIQUE AUTOMATIQUE

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

// ==================== 🔥 NOUVEAU: INTERFACE POUR LES RELATIONS HIÉRARCHIQUES ====================

interface HierarchyRelations {
  // Map: parentId -> enfantIds[]
  children: { [parentId: string]: string[] };
  // Map: enfantId -> parentId
  parents: { [childId: string]: string };
  // Map: itemId -> itemType
  itemTypes: { [itemId: string]: MoveItemType };
  // Map: itemId -> item data
  itemData: { [itemId: string]: Section | Tactique | Placement | Creatif };
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

// ==================== 🔥 NOUVEAU: HELPERS POUR ANALYSER LA HIÉRARCHIE ====================

function buildHierarchyRelations(
  hierarchyContext?: {
    sections?: any[];
    tactiques?: { [sectionId: string]: any[] };
    placements?: { [tactiqueId: string]: any[] };
    creatifs?: { [placementId: string]: any[] };
  }
): HierarchyRelations {
  const relations: HierarchyRelations = {
    children: {},
    parents: {},
    itemTypes: {},
    itemData: {}
  };

  if (!hierarchyContext) return relations;

  const { sections = [], tactiques = {}, placements = {}, creatifs = {} } = hierarchyContext;

  // Parcourir toute la hiérarchie pour construire les relations
  sections.forEach(section => {
    relations.itemTypes[section.id] = 'section';
    relations.itemData[section.id] = section;
    relations.children[section.id] = [];

    // Tactiques de cette section
    const sectionTactiques = tactiques[section.id] || [];
    sectionTactiques.forEach(tactique => {
      relations.itemTypes[tactique.id] = 'tactique';
      relations.itemData[tactique.id] = tactique;
      relations.parents[tactique.id] = section.id;
      relations.children[section.id].push(tactique.id);
      relations.children[tactique.id] = [];

      // Placements de cette tactique
      const tactiquePlacements = placements[tactique.id] || [];
      tactiquePlacements.forEach(placement => {
        relations.itemTypes[placement.id] = 'placement';
        relations.itemData[placement.id] = placement;
        relations.parents[placement.id] = tactique.id;
        relations.children[tactique.id].push(placement.id);
        relations.children[placement.id] = [];

        // Créatifs de ce placement
        const placementCreatifs = creatifs[placement.id] || [];
        placementCreatifs.forEach(creatif => {
          relations.itemTypes[creatif.id] = 'creatif';
          relations.itemData[creatif.id] = creatif;
          relations.parents[creatif.id] = placement.id;
          relations.children[placement.id].push(creatif.id);
        });
      });
    });
  });

  console.log('🏗️ Relations hiérarchiques construites:', {
    totalItems: Object.keys(relations.itemTypes).length,
    sampleChildren: Object.fromEntries(
      Object.entries(relations.children).slice(0, 3).map(([k, v]) => [k, v.length])
    )
  });

  return relations;
}

function findRootElements(selectedItemIds: string[], relations: HierarchyRelations): string[] {
  const selectedSet = new Set(selectedItemIds);
  const rootElements: string[] = [];

  console.log('🔍 Recherche des éléments racines dans la sélection:', selectedItemIds);

  for (const itemId of selectedItemIds) {
    const parentId = relations.parents[itemId];
    
    // Si l'élément n'a pas de parent OU si son parent n'est pas sélectionné,
    // alors c'est un élément racine
    if (!parentId || !selectedSet.has(parentId)) {
      rootElements.push(itemId);
      console.log(`📌 Élément racine trouvé: ${itemId} (parent: ${parentId || 'aucun'})`);
    } else {
      console.log(`🔗 Élément enfant: ${itemId} -> parent: ${parentId}`);
    }
  }

  console.log('✅ Éléments racines identifiés:', rootElements);
  return rootElements;
}

function getAllDescendants(itemId: string, relations: HierarchyRelations): string[] {
  const descendants: string[] = [];
  const queue = [itemId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const children = relations.children[currentId] || [];
    descendants.push(...children);
    queue.push(...children);
  }

  return descendants;
}

// ==================== 🔥 NOUVEAU: VALIDATION D'INTÉGRITÉ HIÉRARCHIQUE ====================

function validateHierarchicalIntegrity(
  selectedItemIds: string[], 
  relations: HierarchyRelations
): { isValid: boolean; errorMessage?: string } {
  const selectedSet = new Set(selectedItemIds);
  
  console.log('🔍 Validation d\'intégrité hiérarchique pour:', selectedItemIds.length, 'éléments');

  // Pour chaque élément sélectionné, vérifier que :
  // 1. Si ses enfants directs existent, ils doivent TOUS être sélectionnés
  // 2. OU aucun de ses enfants directs ne doit être sélectionné
  
  for (const itemId of selectedItemIds) {
    const directChildren = relations.children[itemId] || [];
    
    if (directChildren.length === 0) {
      // Pas d'enfants, pas de problème
      continue;
    }

    // Compter combien d'enfants directs sont sélectionnés
    const selectedChildren = directChildren.filter(childId => selectedSet.has(childId));
    
    console.log(`🔍 Élément ${itemId}:`, {
      totalChildren: directChildren.length,
      selectedChildren: selectedChildren.length,
      children: directChildren,
      selected: selectedChildren
    });

    // Si quelques enfants sont sélectionnés mais pas tous
    if (selectedChildren.length > 0 && selectedChildren.length < directChildren.length) {
      const itemType = relations.itemTypes[itemId];
      const itemData = relations.itemData[itemId] as any;
      const itemName = getItemDisplayName(itemData, itemType);
      
      const missingChildren = directChildren.filter(childId => !selectedSet.has(childId));
      const missingChildrenNames = missingChildren.map(childId => {
        const childType = relations.itemTypes[childId];
        const childData = relations.itemData[childId];
        return getItemDisplayName(childData, childType);
      });

      const errorMessage = `Impossible de déplacer "${itemName}" car ${selectedChildren.length} de ses ${directChildren.length} enfants sont sélectionnés. ` +
        `Tous les enfants doivent être inclus dans le déplacement. Enfants manquants : ${missingChildrenNames.join(', ')}`;
      
      console.log('❌ Intégrité hiérarchique violée:', errorMessage);
      
      return {
        isValid: false,
        errorMessage
      };
    }
  }

  console.log('✅ Intégrité hiérarchique validée');
  return { isValid: true };
}

// ==================== HOOK PRINCIPAL ====================

export function useMoveOperation(
  onRefreshCallback?: () => Promise<void>,
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
  const [hierarchyRelations, setHierarchyRelations] = useState<HierarchyRelations>({
    children: {},
    parents: {},
    itemTypes: {},
    itemData: {}
  });

  // Construire la carte de contexte hiérarchique depuis les données fournies
  useEffect(() => {
    if (!hierarchyContext || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      setHierarchyContextMap({});
      setHierarchyRelations({
        children: {},
        parents: {},
        itemTypes: {},
        itemData: {}
      });
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

    // Construire aussi les relations hiérarchiques
    const relations = buildHierarchyRelations(hierarchyContext);
    setHierarchyRelations(relations);

  }, [hierarchyContext, selectedCampaignId, selectedVersionId, selectedOngletId]);

  // ==================== 🔥 ANALYSE DE SÉLECTION CORRIGÉE AVEC GESTION HIÉRARCHIQUE ====================

  const analyzeSelection = useCallback((selectedItems: any[]): SelectionAnalysis => {
    console.log('🔍 Analyse de sélection hiérarchique démarrée avec:', selectedItems);

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
      hierarchyContextMapSize: Object.keys(hierarchyContextMap).length,
      hierarchyRelationsSize: Object.keys(hierarchyRelations.itemTypes).length
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
      // 🔥 ÉTAPE 1: Identifier les éléments sélectionnés et leurs types
      const selectedItemIds: string[] = [];
      const itemTypesDetected = new Set<MoveItemType>();

      for (const item of selectedItems) {
        const itemType = detectItemType(item);
        if (!itemType) {
          console.warn('Type d\'élément non reconnu:', item);
          continue;
        }

        selectedItemIds.push(item.id);
        itemTypesDetected.add(itemType);
      }

      if (selectedItemIds.length === 0) {
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

      console.log('📊 Éléments sélectionnés analysés:', {
        totalSelected: selectedItemIds.length,
        typesDetected: Array.from(itemTypesDetected)
      });

      // 🔥 ÉTAPE 2: Identifier les éléments racines (ceux qui ne sont pas enfants d'autres éléments sélectionnés)
      const rootElementIds = findRootElements(selectedItemIds, hierarchyRelations);

      if (rootElementIds.length === 0) {
        return {
          isValid: false,
          canMove: false,
          rootElements: [],
          allElements: [],
          moveLevel: 'section',
          targetLevel: 'onglet',
          totalItemsToMove: 0,
          errorMessage: 'Aucun élément racine identifié dans la sélection'
        };
      }

      // 🔥 NOUVEAU: ÉTAPE 2.5: Vérifier l'intégrité hiérarchique (pas d'enfants orphelins)
      const integrityCheck = validateHierarchicalIntegrity(selectedItemIds, hierarchyRelations);
      if (!integrityCheck.isValid) {
        return {
          isValid: false,
          canMove: false,
          rootElements: [],
          allElements: [],
          moveLevel: 'section',
          targetLevel: 'onglet',
          totalItemsToMove: 0,
          errorMessage: integrityCheck.errorMessage
        };
      }

      // 🔥 ÉTAPE 3: Vérifier que tous les éléments racines sont du même type
      const rootElementTypes = new Set<MoveItemType>();
      rootElementIds.forEach(id => {
        const type = hierarchyRelations.itemTypes[id];
        if (type) rootElementTypes.add(type);
      });

      if (rootElementTypes.size > 1) {
        return {
          isValid: false,
          canMove: false,
          rootElements: [],
          allElements: [],
          moveLevel: 'section',
          targetLevel: 'onglet',
          totalItemsToMove: 0,
          errorMessage: `Impossible de déplacer des éléments racines de types différents (${Array.from(rootElementTypes).join(', ')})`
        };
      }

      const moveLevel = Array.from(rootElementTypes)[0];
      const targetLevel = MOVE_LEVEL_HIERARCHY[moveLevel];

      // 🔥 ÉTAPE 4: Construire la liste complète des éléments à déplacer (racines + enfants)
      const allElementsToMove = new Set<string>();

      for (const rootId of rootElementIds) {
        // Ajouter l'élément racine
        allElementsToMove.add(rootId);
        
        // Ajouter tous ses descendants
        const descendants = getAllDescendants(rootId, hierarchyRelations);
        descendants.forEach(id => allElementsToMove.add(id));
      }

      console.log('📦 Analyse complète des éléments à déplacer:', {
        rootElements: rootElementIds.length,
        totalElements: allElementsToMove.size,
        moveLevel,
        targetLevel
      });

      // 🔥 ÉTAPE 5: Construire les objets SelectedItemWithSource pour tous les éléments
      const convertedRootElements: SelectedItemWithSource[] = [];
      const convertedAllElements: SelectedItemWithSource[] = [];

      for (const itemId of allElementsToMove) {
        const itemType = hierarchyRelations.itemTypes[itemId];
        const itemData = hierarchyRelations.itemData[itemId];
        
        if (!itemType || !itemData) {
          console.warn('Données manquantes pour élément:', itemId);
          continue;
        }

        // Récupérer le contexte depuis la carte hiérarchique
        const itemContext = hierarchyContextMap[itemId];
        let parentPath: string[] = [];

        if (itemContext) {
          parentPath = buildParentPath(itemType, {
            campaignId: itemContext.campaignId,
            versionId: itemContext.versionId,
            ongletId: itemContext.ongletId,
            sectionId: itemContext.sectionId,
            tactiqueId: itemContext.tactiqueId,
            placementId: itemContext.placementId
          });
        }

        if (parentPath.length === 0) {
          console.error('❌ ParentPath vide pour:', {
            itemType,
            itemId,
            itemContext
          });
          continue;
        }

        const convertedElement: SelectedItemWithSource = {
          id: itemId,
          type: itemType,
          selectionSource: rootElementIds.includes(itemId) ? 'direct' : 'automatic',
          parentPath,
          item: itemData as Section | Tactique | Placement | Creatif
        };

        convertedAllElements.push(convertedElement);
        
        if (rootElementIds.includes(itemId)) {
          convertedRootElements.push(convertedElement);
        }
      }

      console.log('✅ Analyse terminée avec succès:', {
        rootElements: convertedRootElements.length,
        totalElements: convertedAllElements.length,
        moveLevel,
        targetLevel
      });

      return {
        isValid: true,
        canMove: true,
        rootElements: convertedRootElements,
        allElements: convertedAllElements,
        moveLevel,
        targetLevel,
        totalItemsToMove: convertedAllElements.length
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
  }, [selectedCampaignId, selectedVersionId, selectedOngletId, hierarchyContextMap, hierarchyRelations]);

  // ==================== FONCTIONS UTILITAIRES ====================

  const canMoveSelection = useCallback((selectedItems: any[]): boolean => {
    const analysis = analyzeSelection(selectedItems);
    return analysis.canMove;
  }, [analyzeSelection]);

  const getMoveButtonLabel = useCallback((selectedItems: any[]): string => {
    const analysis = analyzeSelection(selectedItems);
    
    if (!analysis.canMove) {
      // Messages d'erreur plus explicites selon le contexte
      if (analysis.errorMessage?.includes('enfants sont sélectionnés')) {
        return 'Sélection incomplète (enfants manquants)';
      } else if (analysis.errorMessage?.includes('types différents')) {
        return 'Types d\'éléments incompatibles';
      } else if (analysis.errorMessage?.includes('Contexte manquant')) {
        return 'Contexte requis manquant';
      } else {
        return analysis.errorMessage || 'Sélection invalide';
      }
    }

    const rootCount = analysis.rootElements.length;
    const totalCount = analysis.totalItemsToMove;
    const itemLabel = MOVE_LEVEL_LABELS[analysis.moveLevel];
    const targetLabel = TARGET_LEVEL_LABELS[analysis.targetLevel];
    
    if (totalCount > rootCount) {
      return `Déplacer ${rootCount} ${itemLabel} (${totalCount} éléments au total) vers ${targetLabel}`;
    } else {
      return `Déplacer ${rootCount} ${itemLabel} vers ${targetLabel}`;
    }
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

      // 🔥 NOUVEAU: Utiliser TOUS les éléments (racines + enfants) pour l'opération
      const operation: MoveOperation = {
        sourceItems: modalState.selection.allElements, // CHANGEMENT: utiliser allElements au lieu de rootElements
        destination: modalState.destination as MoveDestination,
        operationType: modalState.selection.moveLevel,
        totalItemsAffected: modalState.selection.totalItemsToMove,
        clientId: selectedClient.clientId
      };

      console.log('📦 Opération de déplacement avec hiérarchie complète:', {
        rootElements: modalState.selection.rootElements.length,
        totalElements: modalState.selection.allElements.length,
        operation
      });

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