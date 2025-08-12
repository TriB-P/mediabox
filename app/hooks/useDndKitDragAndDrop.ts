// app/hooks/useDndKitDragAndDrop.ts

/**
 * NOUVEAU : Hook utilisant @dnd-kit/core pour remplacer react-beautiful-dnd
 * Plus moderne, plus stable et sans problèmes de synchronisation.
 */
import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
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
}

/**
 * Hook utilisant @dnd-kit/core - plus moderne et stable que react-beautiful-dnd
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

  // Configuration des sensors pour @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Logique pour gérer le drag over si nécessaire
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('❌ Contexte manquant pour le drag and drop');
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

      console.log(`🔄 Début du drag & drop: ${activeIdStr} → ${overIdStr}`);

      if (activeIdStr.startsWith('section-')) {
        await handleSectionDrop(activeIdStr, overIdStr, context);
      } else if (activeIdStr.startsWith('tactique-')) {
        await handleTactiqueDrop(activeIdStr, overIdStr, context);
      } else if (activeIdStr.startsWith('placement-')) {
        await handlePlacementDrop(activeIdStr, overIdStr, context);
      } else if (activeIdStr.startsWith('creatif-')) {
        await handleCreatifDrop(activeIdStr, overIdStr, context);
      }

      console.log('✅ Opération drag & drop terminée, refresh des données...');

      if (onRefresh) {
        await Promise.resolve(onRefresh());
        console.log('✅ Refresh terminé');
      }

    } catch (error) {
      console.error('❌ Erreur lors du drag and drop:', error);
    } finally {
      setIsDragLoading(false);
    }
  };

  /**
   * Gère le drop des sections
   */
  const handleSectionDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    const activeSectionId = activeId.replace('section-', '');
    const overSectionId = overId.replace('section-', '');

    const activeIndex = sections.findIndex(s => s.id === activeSectionId);
    const overIndex = sections.findIndex(s => s.id === overSectionId);

    if (activeIndex === -1 || overIndex === -1) return;

    // Créer le nouvel ordre
    const newSections = [...sections];
    const [movedSection] = newSections.splice(activeIndex, 1);
    newSections.splice(overIndex, 0, movedSection);

    const sectionOrders = newSections.map((section, index) => ({
      id: section.id,
      order: index
    }));

    console.log("FIREBASE: ÉCRITURE - Fichier: useDndKitDragAndDrop.ts - Fonction: handleSectionDrop - Path: sections");
    await reorderSections(context, sectionOrders);
  };

  /**
   * Gère le drop des tactiques
   */
  const handleTactiqueDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    const tactiqueId = activeId.replace('tactique-', '');
    
    // Déterminer si c'est un déplacement vers une autre section ou réorganisation
    if (overId.startsWith('tactiques-')) {
      // Drop sur une zone de tactiques
      const targetSectionId = overId.replace('tactiques-', '');
      const sourceSectionId = findSectionIdForTactique(tactiqueId);
      
      if (!sourceSectionId) return;

      if (sourceSectionId === targetSectionId) {
        // Réorganisation dans la même section - À implémenter selon les besoins
        console.log('Réorganisation dans la même section');
      } else {
        // Déplacement vers une autre section
        await moveTactiqueToSection(context, tactiqueId, sourceSectionId, targetSectionId, 0);
      }
    } else if (overId.startsWith('tactique-')) {
      // Drop sur une autre tactique - réorganisation
      const overTactiqueId = overId.replace('tactique-', '');
      const sourceSectionId = findSectionIdForTactique(tactiqueId);
      const targetSectionId = findSectionIdForTactique(overTactiqueId);
      
      if (!sourceSectionId || !targetSectionId) return;
      
      if (sourceSectionId === targetSectionId) {
        // Réorganisation des tactiques dans la même section
        await reorderTactiquesInSection(sourceSectionId, tactiqueId, overTactiqueId, context);
      } else {
        // Déplacement vers une autre section
        await moveTactiqueToSection(context, tactiqueId, sourceSectionId, targetSectionId, 0);
      }
    }
  };

  /**
   * Gère le drop des placements
   */
  const handlePlacementDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    const placementId = activeId.replace('placement-', '');
    
    if (overId.startsWith('placements-')) {
      const targetTactiqueId = overId.replace('placements-', '');
      const sourceTactiqueId = findTactiqueIdForPlacement(placementId);
      
      if (!sourceTactiqueId) return;
      
      const sourceSection = findSectionForTactique(sourceTactiqueId);
      const targetSection = findSectionForTactique(targetTactiqueId);
      
      if (!sourceSection || !targetSection) return;
      
      if (sourceTactiqueId !== targetTactiqueId) {
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
    } else if (overId.startsWith('placement-')) {
      const overPlacementId = overId.replace('placement-', '');
      const sourceTactiqueId = findTactiqueIdForPlacement(placementId);
      const targetTactiqueId = findTactiqueIdForPlacement(overPlacementId);
      
      if (!sourceTactiqueId || !targetTactiqueId) return;
      
      if (sourceTactiqueId === targetTactiqueId) {
        await reorderPlacementsInTactique(sourceTactiqueId, placementId, overPlacementId, context);
      }
    }
  };

  /**
   * Gère le drop des créatifs
   */
  const handleCreatifDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    const creatifId = activeId.replace('creatif-', '');
    
    if (overId.startsWith('creatifs-')) {
      const targetPlacementId = overId.replace('creatifs-', '');
      const sourcePlacementId = findPlacementIdForCreatif(creatifId);
      
      if (!sourcePlacementId) return;
      
      if (sourcePlacementId !== targetPlacementId) {
        const sourceParents = findParentsForPlacement(sourcePlacementId);
        const targetParents = findParentsForPlacement(targetPlacementId);
        
        if (!sourceParents || !targetParents) return;
        
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
  };

  // Fonctions utilitaires pour trouver les parents
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

  // Fonctions de réorganisation
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

  return {
    isDragLoading,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    activeId
  };
};