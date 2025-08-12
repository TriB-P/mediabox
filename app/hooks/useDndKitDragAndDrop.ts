// app/hooks/useDndKitDragAndDrop.ts
/**
 * CORRECTION : Hook @dnd-kit/core simplifié et optimisé
 * Version robuste avec logique de drop unifiée et fonctions utilitaires optimisées
 */
import { useState } from 'react';
import {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  sortableKeyboardCoordinates,
} from '@dnd-kit/core';
import { useInsertionIndicator } from './useInsertionIndicator';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import {
  reorderSections,
  reorderTactiques,
  reorderPlacements,
  reorderCreatifs,
  moveTactiqueToSection,
  movePlacementToTactique,
  moveCreatifToPlacement,
  ReorderContext
} from '../lib/reorderService';
import { SectionWithTactiques, Tactique, Placement, Creatif } from '../types/tactiques';

interface UseDndKitDragAndDropProps {
  sections: SectionWithTactiques[];
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  onRefresh?: () => Promise<void>;
}

interface UseDndKitDragAndDropReturn {
  isDragLoading: boolean;
  sensors: any;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  activeId: string | null;
  // ✅ NOUVEAU : Indicateur d'insertion
  indicatorState: {
    isVisible: boolean;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
    targetType: 'tactique' | 'placement' | 'creatif' | null;
    insertionMode: 'before' | 'after' | 'inside' | null;
    targetId: string | null;
  };
}

/**
 * Hook @dnd-kit/core corrigé et optimisé
 */
export const useDndKitDragAndDrop = ({
  sections,
  tactiques,
  placements,
  creatifs,
  onRefresh
}: UseDndKitDragAndDropProps): UseDndKitDragAndDropReturn => {
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();
  
  const [isDragLoading, setIsDragLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // ✅ NOUVEAU : Intégration de l'indicateur d'insertion
  const { 
    indicatorState, 
    handleDragOverWithIndicator, 
    hideIndicator, 
    resetIndicator 
  } = useInsertionIndicator();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    resetIndicator(); // Réinitialiser l'indicateur au début du drag
  };

  const handleDragOver = (event: DragOverEvent) => {
    // ✅ NOUVEAU : Gestion de l'indicateur d'insertion en temps réel
    handleDragOverWithIndicator(event);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('🎯 DRAG END:', { activeId: active.id, overId: over?.id });
    
    setActiveId(null);
    hideIndicator(); // Cacher l'indicateur à la fin du drag

    if (!over || active.id === over.id) {
      console.log('❌ Pas de destination ou même élément');
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('❌ Contexte manquant');
      return;
    }

    const context: ReorderContext = {
      clientId: selectedClient.clientId,
      campaignId: selectedCampaignId,
      versionId: selectedVersionId,
      ongletId: selectedOngletId
    };

    setIsDragLoading(true);

    try {
      const activeIdStr = active.id as string;
      const overIdStr = over.id as string;

      if (activeIdStr.startsWith('section-')) {
        await handleSectionDrop(activeIdStr, overIdStr, context);
      } else if (activeIdStr.startsWith('tactique-')) {
        await handleTactiqueDrop(activeIdStr, overIdStr, context);
      } else if (activeIdStr.startsWith('placement-')) {
        await handlePlacementDrop(activeIdStr, overIdStr, context);
      } else if (activeIdStr.startsWith('creatif-')) {
        await handleCreatifDrop(activeIdStr, overIdStr, context);
      }

      console.log('✅ Opération terminée, refresh...');
      if (onRefresh) {
        await Promise.resolve(onRefresh());
      }

    } catch (error) {
      console.error('❌ Erreur drag & drop:', error);
    } finally {
      setIsDragLoading(false);
    }
  };

  // ✅ CORRECTION : Gestionnaire de sections simplifié
  const handleSectionDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    const activeSectionId = activeId.replace('section-', '');
    const overSectionId = overId.replace('section-', '');

    const activeIndex = sections.findIndex(s => s.id === activeSectionId);
    const overIndex = sections.findIndex(s => s.id === overSectionId);

    if (activeIndex === -1 || overIndex === -1) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(activeIndex, 1);
    newSections.splice(overIndex, 0, movedSection);

    const sectionOrders = newSections.map((section, index) => ({
      id: section.id,
      order: index
    }));

    await reorderSections(context, sectionOrders);
  };

  // ✅ CORRECTION : Gestionnaire de tactiques simplifié
  const handleTactiqueDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    const tactiqueId = activeId.replace('tactique-', '');
    
    if (overId.startsWith('tactiques-')) {
      // Drop sur zone de tactiques
      const targetSectionId = overId.replace('tactiques-', '');
      const sourceSectionId = findSectionIdForTactique(tactiqueId);
      
      if (!sourceSectionId) return;

      if (sourceSectionId === targetSectionId) {
        console.log('Même section - pas d\'action');
      } else {
        await moveTactiqueToSection(context, tactiqueId, sourceSectionId, targetSectionId, 0);
      }
    } else if (overId.startsWith('tactique-')) {
      // Drop sur une autre tactique
      const overTactiqueId = overId.replace('tactique-', '');
      const sourceSectionId = findSectionIdForTactique(tactiqueId);
      const targetSectionId = findSectionIdForTactique(overTactiqueId);
      
      if (!sourceSectionId || !targetSectionId) return;
      
      if (sourceSectionId === targetSectionId) {
        await reorderTactiquesInSection(sourceSectionId, tactiqueId, overTactiqueId, context);
      } else {
        await moveTactiqueToSection(context, tactiqueId, sourceSectionId, targetSectionId, 0);
      }
    }
  };

  // ✅ CORRECTION : Gestionnaire de placements SIMPLIFIÉ
  const handlePlacementDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    const placementId = activeId.replace('placement-', '');
    const sourceTactiqueId = findTactiqueIdForPlacement(placementId);
    
    if (!sourceTactiqueId) {
      console.error('Source tactique non trouvée pour placement:', placementId);
      return;
    }

    if (overId.startsWith('placements-')) {
      // Drop sur zone de placements
      const targetTactiqueId = overId.replace('placements-', '');
      
      if (sourceTactiqueId !== targetTactiqueId) {
        const sourceSection = findSectionForTactique(sourceTactiqueId);
        const targetSection = findSectionForTactique(targetTactiqueId);
        
        if (sourceSection && targetSection) {
          await movePlacementToTactique(
            context,
            placementId,
            sourceSection.id,
            sourceTactiqueId,
            targetSection.id,
            targetTactiqueId,
            0
          );
        }
      }
    } else if (overId.startsWith('placement-')) {
      // Drop sur un autre placement
      const overPlacementId = overId.replace('placement-', '');
      const targetTactiqueId = findTactiqueIdForPlacement(overPlacementId);
      
      if (targetTactiqueId && sourceTactiqueId === targetTactiqueId) {
        await reorderPlacementsInTactique(sourceTactiqueId, placementId, overPlacementId, context);
      }
    }
  };

  // ✅ CORRECTION : Gestionnaire de créatifs SIMPLIFIÉ  
  const handleCreatifDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    const creatifId = activeId.replace('creatif-', '');
    const sourcePlacementId = findPlacementIdForCreatif(creatifId);
    
    if (!sourcePlacementId) {
      console.error('Source placement non trouvé pour créatif:', creatifId);
      return;
    }

    if (overId.startsWith('creatifs-')) {
      // Drop sur zone de créatifs
      const targetPlacementId = overId.replace('creatifs-', '');
      
      if (sourcePlacementId !== targetPlacementId) {
        const sourceParents = findParentsForPlacement(sourcePlacementId);
        const targetParents = findParentsForPlacement(targetPlacementId);
        
        if (sourceParents && targetParents) {
          await moveCreatifToPlacement(
            context,
            creatifId,
            sourceParents.sectionId,
            sourceParents.tactiqueId,
            sourcePlacementId,
            targetParents.sectionId,
            targetParents.tactiqueId,
            targetPlacementId,
            0
          );
        }
      }
    } else if (overId.startsWith('creatif-')) {
      // Drop sur un autre créatif
      const overCreatifId = overId.replace('creatif-', '');
      const targetPlacementId = findPlacementIdForCreatif(overCreatifId);
      
      if (targetPlacementId) {
        if (sourcePlacementId === targetPlacementId) {
          await reorderCreatifsInPlacement(sourcePlacementId, creatifId, overCreatifId, context);
        } else {
          // Déplacement vers autre placement
          const sourceParents = findParentsForPlacement(sourcePlacementId);
          const targetParents = findParentsForPlacement(targetPlacementId);
          
          if (sourceParents && targetParents) {
            await moveCreatifToPlacement(
              context,
              creatifId,
              sourceParents.sectionId,
              sourceParents.tactiqueId,
              sourcePlacementId,
              targetParents.sectionId,
              targetParents.tactiqueId,
              targetPlacementId,
              0
            );
          }
        }
      }
    }
  };

  // ✅ CORRECTION : Fonctions utilitaires OPTIMISÉES
  const findSectionIdForTactique = (tactiqueId: string): string | null => {
    for (const section of sections) {
      if (section.tactiques.some(t => t.id === tactiqueId)) {
        return section.id;
      }
    }
    return null;
  };

  const findSectionForTactique = (tactiqueId: string) => {
    return sections.find(section => 
      section.tactiques.some(tactique => tactique.id === tactiqueId)
    );
  };

  const findTactiqueIdForPlacement = (placementId: string): string | null => {
    for (const [tactiqueId, tactiquesPlacements] of Object.entries(placements)) {
      if (tactiquesPlacements.some(p => p.id === placementId)) {
        return tactiqueId;
      }
    }
    return null;
  };

  const findPlacementIdForCreatif = (creatifId: string): string | null => {
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
        const tactiquesPlacements = placements[tactique.id] || [];
        if (tactiquesPlacements.some(p => p.id === placementId)) {
          return { sectionId: section.id, tactiqueId: tactique.id };
        }
      }
    }
    return null;
  };

  // ✅ CORRECTION : Fonctions de réorganisation SIMPLIFIÉES
  const reorderTactiquesInSection = async (
    sectionId: string, 
    activeTactiqueId: string, 
    overTactiqueId: string, 
    context: ReorderContext
  ) => {
    const sectionTactiques = tactiques[sectionId] || [];
    const activeIndex = sectionTactiques.findIndex(t => t.id === activeTactiqueId);
    const overIndex = sectionTactiques.findIndex(t => t.id === overTactiqueId);
    
    if (activeIndex === -1 || overIndex === -1) return;
    
    const newTactiques = [...sectionTactiques];
    const [movedTactique] = newTactiques.splice(activeIndex, 1);
    newTactiques.splice(overIndex, 0, movedTactique);

    const tactiqueOrders = newTactiques.map((tactique, index) => ({
      id: tactique.id,
      order: index
    }));

    await reorderTactiques(context, sectionId, tactiqueOrders);
  };

  const reorderPlacementsInTactique = async (
    tactiqueId: string,
    activePlacementId: string,
    overPlacementId: string,
    context: ReorderContext
  ) => {
    const tactiquePlacements = placements[tactiqueId] || [];
    const activeIndex = tactiquePlacements.findIndex(p => p.id === activePlacementId);
    const overIndex = tactiquePlacements.findIndex(p => p.id === overPlacementId);
    
    if (activeIndex === -1 || overIndex === -1) return;
    
    const newPlacements = [...tactiquePlacements];
    const [movedPlacement] = newPlacements.splice(activeIndex, 1);
    newPlacements.splice(overIndex, 0, movedPlacement);

    const placementOrders = newPlacements.map((placement, index) => ({
      id: placement.id,
      order: index
    }));

    const sectionId = findSectionIdForTactique(tactiqueId);
    if (!sectionId) return;

    await reorderPlacements(context, sectionId, tactiqueId, placementOrders);
  };

  const reorderCreatifsInPlacement = async (
    placementId: string,
    activeCreatifId: string,
    overCreatifId: string,
    context: ReorderContext
  ) => {
    const placementCreatifs = creatifs[placementId] || [];
    const activeIndex = placementCreatifs.findIndex(c => c.id === activeCreatifId);
    const overIndex = placementCreatifs.findIndex(c => c.id === overCreatifId);
    
    if (activeIndex === -1 || overIndex === -1) return;
    
    const newCreatifs = [...placementCreatifs];
    const [movedCreatif] = newCreatifs.splice(activeIndex, 1);
    newCreatifs.splice(overIndex, 0, movedCreatif);

    const creatifOrders = newCreatifs.map((creatif, index) => ({
      id: creatif.id,
      order: index
    }));

    const parents = findParentsForPlacement(placementId);
    if (!parents) return;

    await reorderCreatifs(context, parents.sectionId, parents.tactiqueId, placementId, creatifOrders);
  };

  return {
    isDragLoading,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    activeId,
    indicatorState // ✅ NOUVEAU : État de l'indicateur d'insertion
  };
};