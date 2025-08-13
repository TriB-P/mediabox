// app/hooks/useDragAndDrop.ts

/**
 * CORRECTION : Amélioration de la gestion de l'état et synchronisation des données
 * pour éviter les erreurs "Unable to find draggable" après drag & drop.
 */
import { useState } from 'react';
import { DropResult } from 'react-beautiful-dnd';
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

interface UseDragAndDropProps {
  sections: SectionWithTactiques[];
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  onRefresh?: () => Promise<void>;
}

interface UseDragAndDropReturn {
  isDragLoading: boolean;
  isDragDisabled: boolean; // ✅ NOUVEAU : État pour désactiver temporairement le drag
  handleDragEnd: (result: DropResult) => Promise<void>;
  dragKey: string; // ✅ NOUVEAU : Clé pour forcer le reset du DragDropContext
}

/**
 * Hook personnalisé pour gérer les opérations de glisser-déposer.
 * CORRECTION : Ajout de la gestion de l'état pour éviter les erreurs de synchronisation.
 */
export const useDragAndDrop = ({
  sections,
  tactiques,
  placements,
  creatifs,
  onRefresh
}: UseDragAndDropProps): UseDragAndDropReturn => {
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();
  
  const [isDragLoading, setIsDragLoading] = useState(false);
  const [isDragDisabled, setIsDragDisabled] = useState(false); // ✅ NOUVEAU
  const [dragKey, setDragKey] = useState(`drag-${Date.now()}`); // ✅ NOUVEAU

  /**
   * CORRECTION : Fonction améliorée avec gestion de l'état et reset du composant
   */
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // Vérifications de base
    if (!destination) return;
    
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
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

    // ✅ NOUVEAU : Désactiver immédiatement le drag pour éviter les conflits
    setIsDragLoading(true);
    setIsDragDisabled(true);

    try {
      console.log(`🔄 Début du drag & drop pour ${draggableId}`);

      // Exécuter l'opération de drag selon le type
      if (draggableId.startsWith('section-')) {
        await handleSectionDrag(result, context);
      } else if (draggableId.startsWith('tactique-')) {
        await handleTactiqueDrag(result, context);
      } else if (draggableId.startsWith('placement-')) {
        await handlePlacementDrag(result, context);
      } else if (draggableId.startsWith('creatif-')) {
        await handleCreatifDrag(result, context);
      } else {
        console.warn('⚠️ Type de drag non reconnu:', draggableId);
        return;
      }

      console.log('✅ Opération drag & drop terminée, refresh des données...');

      // ✅ NOUVEAU : Attendre le refresh et ensuite reset le composant
      if (onRefresh) {
        await Promise.resolve(onRefresh());
        
        // ✅ NOUVEAU : Forcer le reset du DragDropContext avec une nouvelle clé
        setDragKey(`drag-${Date.now()}`);
        
        console.log('✅ Refresh terminé, composant DragDrop reseté');
      }

    } catch (error) {
      console.error('❌ Erreur lors du drag and drop:', error);
      
      // ✅ NOUVEAU : En cas d'erreur, forcer aussi le reset
      setDragKey(`drag-error-${Date.now()}`);
      
    } finally {
      // ✅ NOUVEAU : Réactiver le drag après un délai pour assurer la stabilité
      setTimeout(() => {
        setIsDragLoading(false);
        setIsDragDisabled(false);
        console.log('🔓 Drag & drop réactivé');
      }, 500); // Délai de 500ms pour la stabilité
    }
  };

  /**
   * Gère le glisser-déposer des sections.
   */
  const handleSectionDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const sectionId = draggableId.replace('section-', '');
    
    const newSections = Array.from(sections);
    const [removed] = newSections.splice(source.index, 1);
    newSections.splice(destination.index, 0, removed);

    const sectionOrders = newSections.map((section, index) => ({
      id: section.id,
      order: index
    }));

    console.log("FIREBASE: ÉCRITURE - Fichier: useDragAndDrop.ts - Fonction: handleSectionDrag - Path: sections");
    await reorderSections(context, sectionOrders);
  };

  /**
   * Gère le glisser-déposer des tactiques.
   */
  const handleTactiqueDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const tactiqueId = draggableId.replace('tactique-', '');
    const sourceSectionId = source.droppableId.replace('tactiques-', '');
    const destSectionId = destination.droppableId.replace('tactiques-', '');

    if (sourceSectionId === destSectionId) {
      // Réorganisation dans la même section
      const sectionTactiques = tactiques[sourceSectionId] || [];
      const newTactiques = Array.from(sectionTactiques);
      const [removed] = newTactiques.splice(source.index, 1);
      newTactiques.splice(destination.index, 0, removed);

      const tactiqueOrders = newTactiques.map((tactique, index) => ({
        id: tactique.id,
        order: index
      }));

      console.log("FIREBASE: ÉCRITURE - Fichier: useDragAndDrop.ts - Fonction: handleTactiqueDrag - Path: sections/${sourceSectionId}/tactiques");
      await reorderTactiques(context, sourceSectionId, tactiqueOrders);
    } else {
      // Déplacement vers une autre section
      console.log("FIREBASE: ÉCRITURE - Fichier: useDragAndDrop.ts - Fonction: handleTactiqueDrag - Path: tactiques");
      await moveTactiqueToSection(
        context,
        tactiqueId,
        sourceSectionId,
        destSectionId,
        destination.index
      );

      // Réorganiser la section de destination
      const destSectionTactiques = tactiques[destSectionId] || [];
      const updatedTactiques = Array.from(destSectionTactiques);
      
      const tactiqueOrders = updatedTactiques.map((tactique, index) => {
        if (index >= destination.index) {
          return { id: tactique.id, order: index + 1 };
        }
        return { id: tactique.id, order: index };
      });

      tactiqueOrders.splice(destination.index, 0, { id: tactiqueId, order: destination.index });

      console.log("FIREBASE: ÉCRITURE - Fichier: useDragAndDrop.ts - Fonction: handleTactiqueDrag - Path: sections/${destSectionId}/tactiques");
      await reorderTactiques(context, destSectionId, tactiqueOrders);
    }
  };

  /**
   * Gère le glisser-déposer des placements.
   */
  const handlePlacementDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const placementId = draggableId.replace('placement-', '');
    const sourceTactiqueId = source.droppableId.replace('placements-', '');
    const destTactiqueId = destination.droppableId.replace('placements-', '');

    const findSectionForTactique = (tactiqueId: string) => {
      return sections.find(section => 
        section.tactiques.some(tactique => tactique.id === tactiqueId)
      );
    };

    const sourceSection = findSectionForTactique(sourceTactiqueId);
    const destSection = findSectionForTactique(destTactiqueId);

    if (!sourceSection || !destSection) {
      console.error('❌ Sections parent non trouvées pour les tactiques');
      return;
    }

    if (sourceTactiqueId === destTactiqueId) {
      // Réorganisation dans la même tactique
      const tactiquesPlacements = placements[sourceTactiqueId] || [];
      const newPlacements = Array.from(tactiquesPlacements);
      const [removed] = newPlacements.splice(source.index, 1);
      newPlacements.splice(destination.index, 0, removed);

      const placementOrders = newPlacements.map((placement, index) => ({
        id: placement.id,
        order: index
      }));

      console.log("FIREBASE: ÉCRITURE - Fichier: useDragAndDrop.ts - Fonction: handlePlacementDrag - Path: sections/${sourceSection.id}/tactiques/${sourceTactiqueId}/placements");
      await reorderPlacements(context, sourceSection.id, sourceTactiqueId, placementOrders);
    } else {
      // Déplacement vers une autre tactique
      console.log("FIREBASE: ÉCRITURE - Fichier: useDragAndDrop.ts - Fonction: handlePlacementDrag - Path: placements");
      await movePlacementToTactique(
        context,
        placementId,
        sourceSection.id,
        sourceTactiqueId,
        destSection.id,
        destTactiqueId,
        destination.index
      );
    }
  };

  /**
   * Gère le glisser-déposer des créatifs.
   */
  const handleCreatifDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const creatifId = draggableId.replace('creatif-', '');
    const sourcePlacementId = source.droppableId.replace('creatifs-', '');
    const destPlacementId = destination.droppableId.replace('creatifs-', '');

    const findParentsForPlacement = (placementId: string) => {
      for (const section of sections) {
        for (const tactique of section.tactiques) {
          const tactiquesPlacements = placements[tactique.id] || [];
          const placement = tactiquesPlacements.find(p => p.id === placementId);
          if (placement) {
            return { sectionId: section.id, tactiqueId: tactique.id };
          }
        }
      }
      return null;
    };

    const sourceParents = findParentsForPlacement(sourcePlacementId);
    const destParents = findParentsForPlacement(destPlacementId);

    if (!sourceParents || !destParents) {
      console.error('❌ Parents non trouvés pour les placements');
      return;
    }

    if (sourcePlacementId === destPlacementId) {
      // Réorganisation dans le même placement
      const placementCreatifs = creatifs[sourcePlacementId] || [];
      const newCreatifs = Array.from(placementCreatifs);
      const [removed] = newCreatifs.splice(source.index, 1);
      newCreatifs.splice(destination.index, 0, removed);

      const creatifOrders = newCreatifs.map((creatif, index) => ({
        id: creatif.id,
        order: index
      }));

      console.log("FIREBASE: ÉCRITURE - Fichier: useDragAndDrop.ts - Fonction: handleCreatifDrag - Path: sections/${sourceParents.sectionId}/tactiques/${sourceParents.tactiqueId}/placements/${sourcePlacementId}/creatifs");
      await reorderCreatifs(
        context,
        sourceParents.sectionId,
        sourceParents.tactiqueId,
        sourcePlacementId,
        creatifOrders
      );
    } else {
      // Déplacement vers un autre placement
      console.log("FIREBASE: ÉCRITURE - Fichier: useDragAndDrop.ts - Fonction: handleCreatifDrag - Path: creatifs");
      await moveCreatifToPlacement(
        context,
        creatifId,
        sourceParents.sectionId,
        sourceParents.tactiqueId,
        sourcePlacementId,
        destParents.sectionId,
        destParents.tactiqueId,
        destPlacementId,
        destination.index
      );
    }
  };

  return {
    isDragLoading,
    isDragDisabled, // ✅ NOUVEAU
    handleDragEnd,
    dragKey // ✅ NOUVEAU
  };
};