
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
    
    console.log('🎯 DRAG END - Début:', { activeId: active.id, overId: over?.id });
    
    setActiveId(null);

    if (!over || active.id === over.id) {
      console.log('❌ DRAG END - Pas de destination ou même élément');
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

      console.log(`🔄 DRAG END - Traitement: ${activeIdStr} → ${overIdStr}`);

      if (activeIdStr.startsWith('section-')) {
        console.log('📁 DRAG END - Section détectée');
        await handleSectionDrop(activeIdStr, overIdStr, context);
      } else if (activeIdStr.startsWith('tactique-')) {
        console.log('📚 DRAG END - Tactique détectée');
        await handleTactiqueDrop(activeIdStr, overIdStr, context);
      } else if (activeIdStr.startsWith('placement-')) {
        console.log('📄 DRAG END - Placement détecté');
        await handlePlacementDrop(activeIdStr, overIdStr, context);
      } else if (activeIdStr.startsWith('creatif-')) {
        console.log('🖼️ DRAG END - Créatif détecté');
        await handleCreatifDrop(activeIdStr, overIdStr, context);
      } else {
        console.warn('⚠️ DRAG END - Type non reconnu:', activeIdStr);
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
   * Gère le drop des placements - CORRECTION simple avec logs
   */
  const handlePlacementDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    console.log('📄 PLACEMENT DROP - Début:', { activeId, overId });
    
    const placementId = activeId.replace('placement-', '');
    console.log('📄 PLACEMENT DROP - PlacementId:', placementId);
    
    if (overId.startsWith('placements-')) {
      console.log('📄 PLACEMENT DROP - Cas 1: Drop sur zone placements');
      const targetTactiqueId = overId.replace('placements-', '');
      console.log('📄 PLACEMENT DROP - Target tactique:', targetTactiqueId);
      
      const sourceTactiqueId = findTactiqueIdForPlacement(placementId);
      console.log('📄 PLACEMENT DROP - Source tactique:', sourceTactiqueId);
      
      if (!sourceTactiqueId) {
        console.error('📄 PLACEMENT DROP - ❌ Source tactique non trouvée');
        return;
      }
      
      const sourceSection = findSectionForTactique(sourceTactiqueId);
      const targetSection = findSectionForTactique(targetTactiqueId);
      console.log('📄 PLACEMENT DROP - Sections:', { source: sourceSection?.id, target: targetSection?.id });
      
      if (!sourceSection || !targetSection) {
        console.error('📄 PLACEMENT DROP - ❌ Sections non trouvées');
        return;
      }
      
      if (sourceTactiqueId !== targetTactiqueId) {
        console.log('📄 PLACEMENT DROP - Déplacement vers autre tactique');
        await movePlacementToTactique(
          context,
          placementId,
          sourceSection.id,
          sourceTactiqueId,
          targetSection.id,
          targetTactiqueId,
          0
        );
      } else {
        console.log('📄 PLACEMENT DROP - Même tactique, pas de déplacement');
      }
    } else if (overId.startsWith('placement-')) {
      console.log('📄 PLACEMENT DROP - Cas 2: Drop sur autre placement');
      const overPlacementId = overId.replace('placement-', '');
      console.log('📄 PLACEMENT DROP - Over placement:', overPlacementId);
      
      const sourceTactiqueId = findTactiqueIdForPlacement(placementId);
      const targetTactiqueId = findTactiqueIdForPlacement(overPlacementId);
      console.log('📄 PLACEMENT DROP - Tactiques:', { source: sourceTactiqueId, target: targetTactiqueId });
      
      if (!sourceTactiqueId || !targetTactiqueId) {
        console.error('📄 PLACEMENT DROP - ❌ Tactiques non trouvées');
        return;
      }
      
      if (sourceTactiqueId === targetTactiqueId) {
        console.log('📄 PLACEMENT DROP - Réorganisation dans même tactique');
        await reorderPlacementsInTactique(sourceTactiqueId, placementId, overPlacementId, context);
      } else {
        console.log('📄 PLACEMENT DROP - Pas de réorganisation, tactiques différentes');
      }
    } else {
      console.log('📄 PLACEMENT DROP - ❌ Type de drop non reconnu:', overId);
    }
  };

  /**
   * Gère le drop des créatifs - CORRECTION simple avec logs
   */
  const handleCreatifDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    console.log('🖼️ CREATIF DROP - Début:', { activeId, overId });
    
    const creatifId = activeId.replace('creatif-', '');
    console.log('🖼️ CREATIF DROP - CreatifId:', creatifId);
    
    if (overId.startsWith('creatifs-')) {
      console.log('🖼️ CREATIF DROP - Cas 1: Drop sur zone créatifs');
      const targetPlacementId = overId.replace('creatifs-', '');
      console.log('🖼️ CREATIF DROP - Target placement:', targetPlacementId);
      
      const sourcePlacementId = findPlacementIdForCreatif(creatifId);
      console.log('🖼️ CREATIF DROP - Source placement:', sourcePlacementId);
      
      if (!sourcePlacementId) {
        console.error('🖼️ CREATIF DROP - ❌ Source placement non trouvé');
        return;
      }
      
      if (sourcePlacementId !== targetPlacementId) {
        console.log('🖼️ CREATIF DROP - Déplacement vers autre placement');
        const sourceParents = findParentsForPlacement(sourcePlacementId);
        const targetParents = findParentsForPlacement(targetPlacementId);
        console.log('🖼️ CREATIF DROP - Parents:', { source: sourceParents, target: targetParents });
        
        if (!sourceParents || !targetParents) {
          console.error('🖼️ CREATIF DROP - ❌ Parents non trouvés');
          return;
        }
        
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
      } else {
        console.log('🖼️ CREATIF DROP - Même placement, pas de déplacement');
      }
    } else if (overId.startsWith('creatif-')) {
      console.log('🖼️ CREATIF DROP - Cas 2: Drop sur autre créatif');
      const overCreatifId = overId.replace('creatif-', '');
      console.log('🖼️ CREATIF DROP - Over créatif:', overCreatifId);
      
      const sourcePlacementId = findPlacementIdForCreatif(creatifId);
      const targetPlacementId = findPlacementIdForCreatif(overCreatifId);
      console.log('🖼️ CREATIF DROP - Placements:', { source: sourcePlacementId, target: targetPlacementId });
      
      if (!sourcePlacementId || !targetPlacementId) {
        console.error('🖼️ CREATIF DROP - ❌ Placements non trouvés');
        return;
      }
      
      if (sourcePlacementId === targetPlacementId) {
        console.log('🖼️ CREATIF DROP - Réorganisation dans même placement');
        await reorderCreatifsInPlacement(sourcePlacementId, creatifId, overCreatifId, context);
      } else {
        console.log('🖼️ CREATIF DROP - Déplacement vers autre placement');
        const sourceParents = findParentsForPlacement(sourcePlacementId);
        const targetParents = findParentsForPlacement(targetPlacementId);
        console.log('🖼️ CREATIF DROP - Parents:', { source: sourceParents, target: targetParents });
        
        if (!sourceParents || !targetParents) {
          console.error('🖼️ CREATIF DROP - ❌ Parents non trouvés');
          return;
        }
        
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
    } else {
      console.log('🖼️ CREATIF DROP - ❌ Type de drop non reconnu:', overId);
    }
  };

  // Fonctions utilitaires pour trouver les parents AVEC LOGS
  const findSectionIdForTactique = (tactiqueId: string): string | null => {
    console.log('🔍 FIND SECTION - Recherche pour tactique:', tactiqueId);
    console.log('🔍 FIND SECTION - Sections disponibles:', sections.length);
    
    for (const section of sections) {
      console.log('🔍 FIND SECTION - Vérification section:', section.id, 'avec', section.tactiques.length, 'tactiques');
      if (section.tactiques.some(t => t.id === tactiqueId)) {
        console.log('🔍 FIND SECTION - ✅ Trouvée:', section.id);
        return section.id;
      }
    }
    console.log('🔍 FIND SECTION - ❌ Section non trouvée pour tactique:', tactiqueId);
    return null;
  };

  const findSectionForTactique = (tactiqueId: string) => {
    console.log('🔍 FIND SECTION OBJ - Recherche pour tactique:', tactiqueId);
    const result = sections.find(section => 
      section.tactiques.some(tactique => tactique.id === tactiqueId)
    );
    console.log('🔍 FIND SECTION OBJ - Résultat:', result?.id || 'non trouvé');
    return result;
  };

  const findTactiqueIdForPlacement = (placementId: string): string | null => {
    console.log('🔍 FIND TACTIQUE - Recherche pour placement:', placementId);
    console.log('🔍 FIND TACTIQUE - Placements disponibles:', Object.keys(placements));
    
    for (const [tactiqueId, tactiquesPlacements] of Object.entries(placements)) {
      console.log('🔍 FIND TACTIQUE - Vérification tactique:', tactiqueId, 'avec', tactiquesPlacements.length, 'placements');
      if (tactiquesPlacements.some(p => p.id === placementId)) {
        console.log('🔍 FIND TACTIQUE - ✅ Trouvée:', tactiqueId);
        return tactiqueId;
      }
    }
    console.log('🔍 FIND TACTIQUE - ❌ Tactique non trouvée pour placement:', placementId);
    return null;
  };

  const findPlacementIdForCreatif = (creatifId: string): string | null => {
    console.log('🔍 FIND PLACEMENT - Recherche pour créatif:', creatifId);
    console.log('🔍 FIND PLACEMENT - Créatifs disponibles:', Object.keys(creatifs));
    
    for (const [placementId, placementCreatifs] of Object.entries(creatifs)) {
      console.log('🔍 FIND PLACEMENT - Vérification placement:', placementId, 'avec', placementCreatifs.length, 'créatifs');
      if (placementCreatifs.some(c => c.id === creatifId)) {
        console.log('🔍 FIND PLACEMENT - ✅ Trouvé:', placementId);
        return placementId;
      }
    }
    console.log('🔍 FIND PLACEMENT - ❌ Placement non trouvé pour créatif:', creatifId);
    return null;
  };

  const findParentsForPlacement = (placementId: string) => {
    console.log('🔍 FIND PARENTS - Recherche pour placement:', placementId);
    for (const section of sections) {
      for (const tactique of section.tactiques) {
        const tactiquesPlacements = placements[tactique.id] || [];
        if (tactiquesPlacements.some(p => p.id === placementId)) {
          const result = { sectionId: section.id, tactiqueId: tactique.id };
          console.log('🔍 FIND PARENTS - ✅ Trouvés:', result);
          return result;
        }
      }
    }
    console.log('🔍 FIND PARENTS - ❌ Parents non trouvés pour placement:', placementId);
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

  // ✅ NOUVEAU : Fonction manquante pour réorganiser les créatifs avec position précise
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

    // Trouver les parents du placement
    const parents = findParentsForPlacement(placementId);
    if (!parents) return;

    await reorderCreatifs(context, parents.sectionId, parents.tactiqueId, placementId, creatifOrders);
  };

  // ✅ NOUVEAU : Fonction pour réorganiser avec position précise (before/after)
  const reorderCreatifsInPlacementWithPosition = async (
    placementId: string,
    activeCreatifId: string,
    targetCreatifId: string,
    position: 'before' | 'after',
    context: ReorderContext
  ) => {
    const placementCreatifs = creatifs[placementId] || [];
    const activeIndex = placementCreatifs.findIndex(c => c.id === activeCreatifId);
    const targetIndex = placementCreatifs.findIndex(c => c.id === targetCreatifId);
    
    if (activeIndex === -1 || targetIndex === -1) return;
    
    const newCreatifs = [...placementCreatifs];
    const [movedCreatif] = newCreatifs.splice(activeIndex, 1);
    
    // Calculer la nouvelle position selon before/after
    let insertIndex = targetIndex;
    if (activeIndex < targetIndex) {
      // L'élément vient d'avant, donc on ajuste l'index
      insertIndex = position === 'before' ? targetIndex - 1 : targetIndex;
    } else {
      // L'élément vient d'après
      insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    }
    
    newCreatifs.splice(insertIndex, 0, movedCreatif);

    const creatifOrders = newCreatifs.map((creatif, index) => ({
      id: creatif.id,
      order: index
    }));

    // Trouver les parents du placement
    const parents = findParentsForPlacement(placementId);
    if (!parents) return;

    console.log(`🎯 Réorganisation créatifs avec position: ${activeCreatifId} ${position} ${targetCreatifId}`);
    await reorderCreatifs(context, parents.sectionId, parents.tactiqueId, placementId, creatifOrders);
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