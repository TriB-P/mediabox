// app/hooks/useAdvancedDragDrop.ts
/**
 * Hook avancé qui combine réorganisation ET déplacement cross-parent
 * - Même parent → Réorganisation (comme useSimpleDragDrop)
 * - Autre parent → Déplacement (utilise simpleMoveService)
 * 
 * ✅ CORRIGÉ : Gestion non-bloquante des taxonomies et protection contre les boucles infinies
 */
import { useState, useRef } from 'react';
import {
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import {
  reorderTactiques,
  reorderPlacements,  
  reorderCreatifs,
  ReorderContext
} from '../lib/reorderService';
import { SectionWithTactiques, Tactique, Placement, Creatif } from '../types/tactiques';
import * as MoveService from '../lib/simpleMoveService';
import { useUpdateTaxonomiesAfterMove } from './useUpdateTaxonomiesAfterMove';

interface UseAdvancedDragDropProps {
  sections: SectionWithTactiques[];
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  onRefresh?: () => Promise<void>;
  onDragSuccess?: () => Promise<void>;
  hierarchyContext?: {
    sections: any[];
    tactiques: { [sectionId: string]: any[] };
    placements: { [tactiqueId: string]: any[] };
    creatifs: { [placementId: string]: any[] };
  };
}

interface UseAdvancedDragDropReturn {
  isDragLoading: boolean;
  sensors: any;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
}

/**
 * ✅ Hook avancé qui détecte automatiquement :
 * - Réorganisation (même parent) → useSimpleDragDrop logic
 * - Déplacement (autre parent) → simpleMoveService logic
 */
export const useAdvancedDragDrop = ({
  sections,
  placements,
  creatifs,
  onRefresh,
  onDragSuccess,
  hierarchyContext
}: UseAdvancedDragDropProps): UseAdvancedDragDropReturn => {
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();
  const { updateTaxonomiesAfterMove } = useUpdateTaxonomiesAfterMove();
  
  const [isDragLoading, setIsDragLoading] = useState(false);
  const isProcessingRef = useRef(false); // ✅ Protection contre les boucles

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * ✅ NOUVELLE LOGIQUE : Détecte si c'est une réorganisation ou un déplacement
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    console.log('🎯 ADVANCED DRAG END:', { activeId: event.active.id, overId: event.over?.id });
    
    // ✅ Protection contre les boucles infinies
    if (isProcessingRef.current) {
      console.warn('⚠️ Drag déjà en cours, ignoré');
      return;
    }

    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('❌ Contexte manquant');
      return;
    }

    // ✅ Marquer comme en cours
    isProcessingRef.current = true;
    setIsDragLoading(true);

    // ✅ Timeout de sécurité
    const timeoutId = setTimeout(() => {
      console.error('⏰ Timeout atteint, déblocage forcé');
      isProcessingRef.current = false;
      setIsDragLoading(false);
    }, 30000);

    try {
      const activeIdStr = active.id as string;
      const overIdStr = over.id as string;

      // ✅ 1. Analyser le type d'opération
      const operationType = analyzeDropOperation(activeIdStr, overIdStr);
      
      if (operationType.type === 'reorganization') {
        console.log('📝 Réorganisation détectée - même parent');
        await handleReorganization(activeIdStr, overIdStr, operationType.itemType!);
      } else if (operationType.type === 'cross_parent_move') {
        console.log('🚀 Déplacement cross-parent détecté');
        await handleCrossParentMove(activeIdStr, overIdStr, operationType);
      } else {
        console.log('⚠️ Opération non supportée:', operationType);
        return;
      }

      // ✅ Refresh avec protection
      if (onDragSuccess) {
        try {
          await Promise.race([
            onDragSuccess(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout refresh')), 15000))
          ]);
          console.log('✅ Refresh terminé avec succès');
        } catch (refreshError) {
          console.error('❌ Erreur lors du refresh:', refreshError);
          // Ne pas bloquer même si le refresh échoue
        }
      }

    } catch (error) {
      console.error('❌ Erreur drag & drop avancé:', error);
    } finally {
      // ✅ Nettoyage garanti
      clearTimeout(timeoutId);
      isProcessingRef.current = false;
      setIsDragLoading(false);
    }
  };

  /**
   * ✅ Analyse si c'est une réorganisation ou un déplacement cross-parent
   */
  const analyzeDropOperation = (activeId: string, overId: string) => {
    // Extraire le type et l'ID de l'élément déplacé
    const activeType = getItemType(activeId);
    const activeItemId = activeId.replace(`${activeType}-`, '');
    
    // Extraire le type et l'ID de la cible
    const overType = getItemType(overId);
    const overItemId = overId.replace(`${overType}-`, '');

    if (!activeType || !overType) {
      return { type: 'unsupported' };
    }

    // ✅ RÉORGANISATION : Même type ET même parent
    if (activeType === overType && isSameParent(activeItemId, overItemId, activeType)) {
      return { 
        type: 'reorganization' as const, 
        itemType: activeType,
        activeItemId,
        overItemId 
      };
    }

    // ✅ DÉPLACEMENT CROSS-PARENT : Validation des combinaisons autorisées
    const allowedMoves = {
      'tactique': ['section'], // Tactique → Section
      'placement': ['tactique'], // Placement → Tactique  
      'creatif': ['placement']   // Créatif → Placement
    };

    if (allowedMoves[activeType as keyof typeof allowedMoves]?.includes(overType)) {
      return {
        type: 'cross_parent_move' as const,
        sourceType: activeType,
        targetType: overType,
        sourceItemId: activeItemId,
        targetItemId: overItemId
      };
    }

    return { type: 'unsupported' };
  };

  /**
   * ✅ Gère la réorganisation (logique de useSimpleDragDrop)
   */
  const handleReorganization = async (activeId: string, overId: string, itemType: string) => {
    const context: ReorderContext = {
      clientId: selectedClient!.clientId,
      campaignId: selectedCampaignId!,
      versionId: selectedVersionId!,
      ongletId: selectedOngletId!
    };

    if (itemType === 'tactique') {
      await handleTactiqueReorganization(activeId, overId, context);
    } else if (itemType === 'placement') {
      await handlePlacementReorganization(activeId, overId, context);
    } else if (itemType === 'creatif') {
      await handleCreatifReorganization(activeId, overId, context);
    }
  };

  /**
   * ✅ Gère le déplacement cross-parent (utilise simpleMoveService)
   */
  const handleCrossParentMove = async (activeId: string, overId: string, operationType: any) => {
    if (!hierarchyContext) {
      console.error('❌ Contexte hiérarchique manquant pour le déplacement cross-parent');
      return;
    }

    const { sourceType, targetType, sourceItemId, targetItemId } = operationType;

    // ✅ 1. Construire la destination
    const destination = await buildDestinationFromTarget(targetType, targetItemId);
    if (!destination) {
      console.error('❌ Impossible de construire la destination');
      return;
    }

    // ✅ 2. NOUVEAU : Inclure automatiquement tous les enfants
    const allItemsToMove = getAllItemsWithChildren(sourceItemId, sourceType);
    console.log('📦 Éléments à déplacer (avec enfants):', allItemsToMove);

    // ✅ 3. Construire le contexte des éléments
    const sourceContext = {
      campaignId: selectedCampaignId!,
      versionId: selectedVersionId!,
      ongletId: selectedOngletId!
    };

    const itemsWithContext = await MoveService.buildItemsContext(
      selectedClient!.clientId,
      allItemsToMove, // ✅ CHANGÉ : Inclut tous les enfants
      sourceContext,
      hierarchyContext
    );

    if (itemsWithContext.length === 0) {
      console.error('❌ Impossible de construire le contexte des éléments');
      return;
    }

    // ✅ 4. Exécuter le déplacement
    const operation: MoveService.MoveOperation = {
      clientId: selectedClient!.clientId,
      itemType: sourceType as any,
      selectedItemIds: allItemsToMove, // ✅ CHANGÉ : Inclut tous les enfants
      destination: destination as MoveService.MoveDestination,
      sourceContext,
      itemsWithContext
    };

    console.log('🚀 Exécution du déplacement cross-parent via simpleMoveService');
    const result = await MoveService.performMove(operation);

    if (result.success) {
      console.log('✅ Déplacement réussi, mise à jour des taxonomies en arrière-plan...');
      
      // ✅ 5. Mettre à jour les taxonomies EN ARRIÈRE-PLAN (non bloquant)
      updateTaxonomiesInBackground(destination as MoveService.MoveDestination);
    } else {
      console.error('❌ Échec du déplacement:', result.errors);
    }
  };

  /**
   * ✅ NOUVEAU : Mise à jour des taxonomies en arrière-plan (non bloquante)
   */
  const updateTaxonomiesInBackground = async (destination: MoveService.MoveDestination) => {
    try {
      const campaignData = {
        id: destination.campaignId,
        name: destination.campaignName,
        clientId: selectedClient!.clientId,
      };

      // ✅ Lancer en arrière-plan sans attendre
      updateTaxonomiesAfterMove('campaign', campaignData)
        .then(() => {
          console.log('✅ Taxonomies mises à jour avec succès en arrière-plan');
        })
        .catch((taxonomyError) => {
          console.error('⚠️ Erreur mise à jour taxonomies (non bloquant):', taxonomyError);
        });
        
    } catch (error) {
      console.error('⚠️ Erreur lors du lancement de la mise à jour des taxonomies:', error);
    }
  };

  /**
   * ✅ NOUVEAU : Récupère tous les enfants d'un élément pour les inclure dans le déplacement
   */
  const getAllItemsWithChildren = (itemId: string, itemType: string): string[] => {
    const allItems: string[] = [itemId]; // Commencer par l'élément lui-même

    if (itemType === 'section') {
      // Récupérer toutes les tactiques de cette section
      const section = sections.find(s => s.id === itemId);
      if (section) {
        section.tactiques.forEach(tactique => {
          allItems.push(tactique.id);
          
          // Récupérer tous les placements de cette tactique
          const tactiquePlacements = placements[tactique.id] || [];
          tactiquePlacements.forEach(placement => {
            allItems.push(placement.id);
            
            // Récupérer tous les créatifs de ce placement
            const placementCreatifs = creatifs[placement.id] || [];
            placementCreatifs.forEach(creatif => {
              allItems.push(creatif.id);
            });
          });
        });
      }
    } else if (itemType === 'tactique') {
      // Récupérer tous les placements de cette tactique
      const tactiquePlacements = placements[itemId] || [];
      tactiquePlacements.forEach(placement => {
        allItems.push(placement.id);
        
        // Récupérer tous les créatifs de ce placement
        const placementCreatifs = creatifs[placement.id] || [];
        placementCreatifs.forEach(creatif => {
          allItems.push(creatif.id);
        });
      });
    } else if (itemType === 'placement') {
      // Récupérer tous les créatifs de ce placement
      const placementCreatifs = creatifs[itemId] || [];
      placementCreatifs.forEach(creatif => {
        allItems.push(creatif.id);
      });
    }
    // Pour les créatifs, pas d'enfants à récupérer

    console.log(`📦 ${itemType} ${itemId} avec ${allItems.length - 1} enfants:`, allItems);
    return allItems;
  };

  // ✅ Fonctions utilitaires
  const getItemType = (id: string): string | null => {
    if (id.startsWith('tactique-')) return 'tactique';
    if (id.startsWith('placement-')) return 'placement';
    if (id.startsWith('creatif-')) return 'creatif';
    if (id.startsWith('section-')) return 'section';
    return null;
  };

  const isSameParent = (itemId1: string, itemId2: string, itemType: string): boolean => {
    if (itemType === 'tactique') {
      const section1 = findSectionForTactique(itemId1);
      const section2 = findSectionForTactique(itemId2);
      return section1 === section2 && section1 !== null;
    } else if (itemType === 'placement') {
      const tactique1 = findTactiqueForPlacement(itemId1);
      const tactique2 = findTactiqueForPlacement(itemId2);
      return tactique1 === tactique2 && tactique1 !== null;
    } else if (itemType === 'creatif') {
      const placement1 = findPlacementForCreatif(itemId1);
      const placement2 = findPlacementForCreatif(itemId2);
      return placement1 === placement2 && placement1 !== null;
    }
    return false;
  };

  const buildDestinationFromTarget = async (targetType: string, targetId: string): Promise<Partial<MoveService.MoveDestination> | null> => {
    // ✅ Construire la destination selon le type de cible
    const baseDestination = {
      campaignId: selectedCampaignId!,
      campaignName: 'Campagne actuelle', // TODO: récupérer le vrai nom
      versionId: selectedVersionId!,
      versionName: 'Version actuelle', // TODO: récupérer le vrai nom
      ongletId: selectedOngletId!,
      ongletName: 'Onglet actuel' // TODO: récupérer le vrai nom
    };

    if (targetType === 'section') {
      const section = sections.find(s => s.id === targetId);
      return {
        ...baseDestination,
        sectionId: targetId,
        sectionName: section?.SECTION_Name || 'Section inconnue'
      };
    } else if (targetType === 'tactique') {
      // Trouver la section parent de cette tactique
      let parentSection = null;
      let targetTactique = null;
      
      for (const section of sections) {
        const tactique = section.tactiques.find(t => t.id === targetId);
        if (tactique) {
          parentSection = section;
          targetTactique = tactique;
          break;
        }
      }

      if (!parentSection || !targetTactique) return null;

      return {
        ...baseDestination,
        sectionId: parentSection.id,
        sectionName: parentSection.SECTION_Name,
        tactiqueId: targetId,
        tactiqueName: targetTactique.TC_Label
      };
    } else if (targetType === 'placement') {
      // Trouver la tactique et section parents de ce placement
      let parentSection = null;
      let parentTactique = null;
      let targetPlacement = null;

      for (const section of sections) {
        for (const tactique of section.tactiques) {
          const placement = (placements[tactique.id] || []).find(p => p.id === targetId);
          if (placement) {
            parentSection = section;
            parentTactique = tactique;
            targetPlacement = placement;
            break;
          }
        }
        if (targetPlacement) break;
      }

      if (!parentSection || !parentTactique || !targetPlacement) return null;

      return {
        ...baseDestination,
        sectionId: parentSection.id,
        sectionName: parentSection.SECTION_Name,
        tactiqueId: parentTactique.id,
        tactiqueName: parentTactique.TC_Label,
        placementId: targetId,
        placementName: targetPlacement.PL_Label
      };
    }

    return null;
  };

  // ✅ Fonctions de réorganisation (copiées de useSimpleDragDrop)
  const handleTactiqueReorganization = async (activeId: string, overId: string, context: ReorderContext) => {
    const tactiqueId = activeId.replace('tactique-', '');
    const overTactiqueId = overId.replace('tactique-', '');
    
    const sectionId = findSectionForTactique(tactiqueId);
    if (!sectionId) return;

    const overSectionId = findSectionForTactique(overTactiqueId);
    if (sectionId !== overSectionId) return;

    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const tactiques = section.tactiques;
    const oldIndex = tactiques.findIndex(t => t.id === tactiqueId);
    const newIndex = tactiques.findIndex(t => t.id === overTactiqueId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedTactiques = arrayMove(tactiques, oldIndex, newIndex);
    const tactiqueOrders = reorderedTactiques.map((tactique, index) => ({
      id: tactique.id,
      order: index
    }));

    await reorderTactiques(context, sectionId, tactiqueOrders);
  };

  const handlePlacementReorganization = async (activeId: string, overId: string, context: ReorderContext) => {
    const placementId = activeId.replace('placement-', '');
    const overPlacementId = overId.replace('placement-', '');
    
    const tactiqueId = findTactiqueForPlacement(placementId);
    if (!tactiqueId) return;

    const overTactiqueId = findTactiqueForPlacement(overPlacementId);
    if (tactiqueId !== overTactiqueId) return;

    const tactiquePlacements = placements[tactiqueId] || [];
    const oldIndex = tactiquePlacements.findIndex(p => p.id === placementId);
    const newIndex = tactiquePlacements.findIndex(p => p.id === overPlacementId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedPlacements = arrayMove(tactiquePlacements, oldIndex, newIndex);
    const placementOrders = reorderedPlacements.map((placement, index) => ({
      id: placement.id,
      order: index
    }));

    const sectionId = findSectionForTactique(tactiqueId);
    if (!sectionId) return;

    await reorderPlacements(context, sectionId, tactiqueId, placementOrders);
  };

  const handleCreatifReorganization = async (activeId: string, overId: string, context: ReorderContext) => {
    const creatifId = activeId.replace('creatif-', '');
    const overCreatifId = overId.replace('creatif-', '');
    
    const placementId = findPlacementForCreatif(creatifId);
    if (!placementId) return;

    const overPlacementId = findPlacementForCreatif(overCreatifId);
    if (placementId !== overPlacementId) return;

    const placementCreatifs = creatifs[placementId] || [];
    const oldIndex = placementCreatifs.findIndex(c => c.id === creatifId);
    const newIndex = placementCreatifs.findIndex(c => c.id === overCreatifId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedCreatifs = arrayMove(placementCreatifs, oldIndex, newIndex);
    const creatifOrders = reorderedCreatifs.map((creatif, index) => ({
      id: creatif.id,
      order: index
    }));

    const parents = findParentsForPlacement(placementId);
    if (!parents) return;

    await reorderCreatifs(context, parents.sectionId, parents.tactiqueId, placementId, creatifOrders);
  };

  // ✅ Fonctions utilitaires de recherche
  const findSectionForTactique = (tactiqueId: string): string | null => {
    for (const section of sections) {
      if (section.tactiques.some(t => t.id === tactiqueId)) {
        return section.id;
      }
    }
    return null;
  };

  const findTactiqueForPlacement = (placementId: string): string | null => {
    for (const [tactiqueId, tactiquePlacements] of Object.entries(placements)) {
      if (tactiquePlacements.some(p => p.id === placementId)) {
        return tactiqueId;
      }
    }
    return null;
  };

  const findPlacementForCreatif = (creatifId: string): string | null => {
    for (const [placementId, placementCreatifs] of Object.entries(creatifs)) {
      if (placementCreatifs.some(c => c.id === creatifId)) {
        return placementId;
      }
    }
    return null;
  };

  const findParentsForPlacement = (placementId: string) => {
    for (const section of sections) {
      for (const tactique of section.tactiques) {
        const tactiquePlacements = placements[tactique.id] || [];
        if (tactiquePlacements.some(p => p.id === placementId)) {
          return { sectionId: section.id, tactiqueId: tactique.id };
        }
      }
    }
    return null;
  };

  return {
    isDragLoading,
    sensors,
    handleDragEnd
  };
};