/**
 * Ce fichier contient un hook React personnalisé, `useDragAndDrop`,
 * qui gère toute la logique de glisser-déposer (drag and drop) pour les différents éléments
 * de l'application (sections, tactiques, placements, créatifs).
 * Il interagit avec les services de réorganisation pour mettre à jour l'ordre des éléments dans Firebase
 * et assure une gestion cohérente de l'état du chargement et des rafraîchissements.
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
  handleDragEnd: (result: DropResult) => Promise<void>;
}

/**
 * Hook personnalisé pour gérer les opérations de glisser-déposer.
 *
 * @param {UseDragAndDropProps} props - Les propriétés du hook, incluant les données des sections, tactiques, placements, créatifs et une fonction de rafraîchissement.
 * @returns {UseDragAndDropReturn} Un objet contenant l'état de chargement du drag et la fonction de gestion du drag.
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

  /**
   * Fonction principale de gestion de la fin d'une opération de glisser-déposer.
   * Détermine le type d'élément déplacé et appelle la fonction de gestion appropriée.
   *
   * @param {DropResult} result - L'objet résultat fourni par `react-beautiful-dnd` après un drag.
   * @returns {Promise<void>} Une promesse qui se résout une fois l'opération terminée.
   */
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

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

    setIsDragLoading(true);

    try {
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

      if (onRefresh) {
        await Promise.resolve(onRefresh());
      }
    } catch (error) {
      console.error('❌ Erreur lors du drag and drop:', error);
    } finally {
      setIsDragLoading(false);
    }
  };

  /**
   * Gère le glisser-déposer des sections.
   * Réorganise les sections et met à jour leur ordre dans Firebase.
   *
   * @param {DropResult} result - L'objet résultat du drag.
   * @param {ReorderContext} context - Le contexte nécessaire pour les opérations Firebase.
   * @returns {Promise<void>} Une promesse qui se résout une fois les sections réorganisées.
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
   * Peut réorganiser les tactiques au sein d'une même section ou les déplacer vers une autre section.
   *
   * @param {DropResult} result - L'objet résultat du drag.
   * @param {ReorderContext} context - Le contexte nécessaire pour les opérations Firebase.
   * @returns {Promise<void>} Une promesse qui se résout une fois les tactiques réorganisées ou déplacées.
   */
  const handleTactiqueDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const tactiqueId = draggableId.replace('tactique-', '');
    const sourceSectionId = source.droppableId.replace('tactiques-', '');
    const destSectionId = destination.droppableId.replace('tactiques-', '');

    if (sourceSectionId === destSectionId) {
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
      console.log("FIREBASE: ÉCRITURE - Fichier: useDragAndDrop.ts - Fonction: handleTactiqueDrag - Path: tactiques");
      await moveTactiqueToSection(
        context,
        tactiqueId,
        sourceSectionId,
        destSectionId,
        destination.index
      );

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
   * Réorganise les placements au sein d'une même tactique ou les déplace vers une autre tactique.
   *
   * @param {DropResult} result - L'objet résultat du drag.
   * @param {ReorderContext} context - Le contexte nécessaire pour les opérations Firebase.
   * @returns {Promise<void>} Une promesse qui se résout une fois les placements réorganisés ou déplacés.
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
   * Réorganise les créatifs au sein d'un même placement ou les déplace vers un autre placement.
   *
   * @param {DropResult} result - L'objet résultat du drag.
   * @param {ReorderContext} context - Le contexte nécessaire pour les opérations Firebase.
   * @returns {Promise<void>} Une promesse qui se résout une fois les créatifs réorganisés ou déplacés.
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
    handleDragEnd
  };
};