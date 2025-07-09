// app/hooks/useDragAndDrop.ts - Hook pour la gestion complète du drag and drop

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
  handleDragEnd: (result: DropResult) => Promise<void>;
}

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

  /**
   * Fonction principale de gestion du drag and drop
   */
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // Pas de destination = annulation
    if (!destination) return;
    
    // Même position = pas de changement
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Vérifier les prérequis
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
      console.log('🔄 Début drag and drop:', { draggableId, source, destination, type });

      // Déterminer le type de drag basé sur le draggableId
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
      }

      // Rafraîchir les données après le drag and drop
      if (onRefresh) {
        console.log('🔄 Rafraîchissement des données...');
        await onRefresh();
      }

      console.log('✅ Drag and drop terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du drag and drop:', error);
      // TODO: Afficher un toast d'erreur à l'utilisateur
    } finally {
      setIsDragLoading(false);
    }
  };

  /**
   * Gestion du drag des sections
   */
  const handleSectionDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const sectionId = draggableId.replace('section-', '');
    
    // Réorganisation des sections
    const newSections = Array.from(sections);
    const [removed] = newSections.splice(source.index, 1);
    newSections.splice(destination.index, 0, removed);

    const sectionOrders = newSections.map((section, index) => ({
      id: section.id,
      order: index
    }));

    await reorderSections(context, sectionOrders);
    console.log('✅ Sections réorganisées');
  };

  /**
   * Gestion du drag des tactiques
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

      await reorderTactiques(context, sourceSectionId, tactiqueOrders);
      console.log('✅ Tactiques réorganisées dans la même section');
    } else {
      // Déplacement vers une autre section
      await moveTactiqueToSection(
        context,
        tactiqueId,
        sourceSectionId,
        destSectionId,
        destination.index
      );

      // Réorganiser les tactiques dans la section de destination
      const destSectionTactiques = tactiques[destSectionId] || [];
      const updatedTactiques = Array.from(destSectionTactiques);
      
      // Simuler l'insertion pour calculer les nouveaux ordres
      // Note: la tactique sera déjà ajoutée par moveTactiqueToSection
      const tactiqueOrders = updatedTactiques.map((tactique, index) => {
        if (index >= destination.index) {
          return { id: tactique.id, order: index + 1 };
        }
        return { id: tactique.id, order: index };
      });

      // Ajouter la tactique déplacée à la bonne position
      tactiqueOrders.splice(destination.index, 0, { id: tactiqueId, order: destination.index });

      await reorderTactiques(context, destSectionId, tactiqueOrders);
      console.log('✅ Tactique déplacée vers une autre section');
    }
  };

  /**
   * Gestion du drag des placements
   */
  const handlePlacementDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const placementId = draggableId.replace('placement-', '');
    const sourceTactiqueId = source.droppableId.replace('placements-', '');
    const destTactiqueId = destination.droppableId.replace('placements-', '');

    // Trouver les sections parentes
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

      await reorderPlacements(context, sourceSection.id, sourceTactiqueId, placementOrders);
      console.log('✅ Placements réorganisés dans la même tactique');
    } else {
      // Déplacement vers une autre tactique
      await movePlacementToTactique(
        context,
        placementId,
        sourceSection.id,
        sourceTactiqueId,
        destSection.id,
        destTactiqueId,
        destination.index
      );
      console.log('✅ Placement déplacé vers une autre tactique');
    }
  };

  /**
   * Gestion du drag des créatifs
   */
  const handleCreatifDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const creatifId = draggableId.replace('creatif-', '');
    const sourcePlacementId = source.droppableId.replace('creatifs-', '');
    const destPlacementId = destination.droppableId.replace('creatifs-', '');

    // Fonction pour trouver les parents d'un placement
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

      await reorderCreatifs(
        context,
        sourceParents.sectionId,
        sourceParents.tactiqueId,
        sourcePlacementId,
        creatifOrders
      );
      console.log('✅ Créatifs réorganisés dans le même placement');
    } else {
      // Déplacement vers un autre placement
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
      console.log('✅ Créatif déplacé vers un autre placement');
    }
  };

  return {
    isDragLoading,
    handleDragEnd
  };
};