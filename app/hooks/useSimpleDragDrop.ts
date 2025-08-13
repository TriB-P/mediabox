// app/hooks/useSimpleDragDrop.ts
/**
 * Hook @dnd-kit ULTRA-SIMPLIFIÉ
 * Objectif : Juste faire fonctionner le drag & drop et mettre à jour les ordres
 * Pas d'indicateurs, pas d'overlays, pas de complexité !
 */
import { useState } from 'react';
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

interface UseSimpleDragDropProps {
  sections: SectionWithTactiques[];
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  onRefresh?: () => Promise<void>;
  // ✅ SIMPLE : La fonction exacte du bouton qui marche
  onDragSuccess?: () => Promise<void>;
}

interface UseSimpleDragDropReturn {
  isDragLoading: boolean;
  sensors: any;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
}

/**
 * ✅ Hook @dnd-kit SIMPLIFIÉ - Focus sur l'essentiel !
 */
export const useSimpleDragDrop = ({
  sections,
  placements,
  creatifs,
  onRefresh,
  onDragSuccess
}: UseSimpleDragDropProps): UseSimpleDragDropReturn => {
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();
  
  const [isDragLoading, setIsDragLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * ✅ SEULE fonction importante : handleDragEnd
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('🎯 SIMPLE DRAG END:', { activeId: active.id, overId: over?.id });
    
    if (!over || active.id === over.id) {
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

      // ✅ LOGIQUE SIMPLE : Déterminer le type et traiter
      if (activeIdStr.startsWith('tactique-')) {
        await handleTactiqueDrop(activeIdStr, overIdStr, context);
      } else if (activeIdStr.startsWith('placement-')) {
        await handlePlacementDrop(activeIdStr, overIdStr, context);
      } else if (activeIdStr.startsWith('creatif-')) {
        await handleCreatifDrop(activeIdStr, overIdStr, context);
      }

      console.log('✅ Drag terminé, utilise exactement la même fonction que le bouton...');
      
      // ✅ SIMPLE : Appelle exactement la même fonction que le bouton qui marche
      if (onDragSuccess) {
        await onDragSuccess();
      }

    } catch (error) {
      console.error('❌ Erreur drag & drop:', error);
    } finally {
      setIsDragLoading(false);
    }
  };

  /**
   * ✅ Gestion tactiques - SIMPLE
   */
  const handleTactiqueDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    const tactiqueId = activeId.replace('tactique-', '');
    const overTactiqueId = overId.replace('tactique-', '');
    
    // Trouver la section qui contient ces tactiques
    const sectionId = findSectionForTactique(tactiqueId);
    if (!sectionId) return;

    // Vérifier que les deux tactiques sont dans la même section
    const overSectionId = findSectionForTactique(overTactiqueId);
    if (sectionId !== overSectionId) {
      console.log('❌ Déplacement entre sections non supporté pour le moment');
      return;
    }

    // Réorganiser les tactiques dans la section
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const tactiques = section.tactiques;
    const oldIndex = tactiques.findIndex(t => t.id === tactiqueId);
    const newIndex = tactiques.findIndex(t => t.id === overTactiqueId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Calculer le nouvel ordre
    const reorderedTactiques = arrayMove(tactiques, oldIndex, newIndex);
    const tactiqueOrders = reorderedTactiques.map((tactique, index) => ({
      id: tactique.id,
      order: index
    }));

    await reorderTactiques(context, sectionId, tactiqueOrders);
  };

  /**
   * ✅ Gestion placements - SIMPLE
   */
  const handlePlacementDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    const placementId = activeId.replace('placement-', '');
    const overPlacementId = overId.replace('placement-', '');
    
    // Trouver la tactique qui contient ces placements
    const tactiqueId = findTactiqueForPlacement(placementId);
    if (!tactiqueId) return;

    // Vérifier que les deux placements sont dans la même tactique
    const overTactiqueId = findTactiqueForPlacement(overPlacementId);
    if (tactiqueId !== overTactiqueId) {
      console.log('❌ Déplacement entre tactiques non supporté pour le moment');
      return;
    }

    // Réorganiser les placements dans la tactique
    const tactiquePlacements = placements[tactiqueId] || [];
    const oldIndex = tactiquePlacements.findIndex(p => p.id === placementId);
    const newIndex = tactiquePlacements.findIndex(p => p.id === overPlacementId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Calculer le nouvel ordre
    const reorderedPlacements = arrayMove(tactiquePlacements, oldIndex, newIndex);
    const placementOrders = reorderedPlacements.map((placement, index) => ({
      id: placement.id,
      order: index
    }));

    const sectionId = findSectionForTactique(tactiqueId);
    if (!sectionId) return;

    await reorderPlacements(context, sectionId, tactiqueId, placementOrders);
  };

  /**
   * ✅ Gestion créatifs - SIMPLE
   */
  const handleCreatifDrop = async (activeId: string, overId: string, context: ReorderContext) => {
    const creatifId = activeId.replace('creatif-', '');
    const overCreatifId = overId.replace('creatif-', '');
    
    // Trouver le placement qui contient ces créatifs
    const placementId = findPlacementForCreatif(creatifId);
    if (!placementId) return;

    // Vérifier que les deux créatifs sont dans le même placement
    const overPlacementId = findPlacementForCreatif(overCreatifId);
    if (placementId !== overPlacementId) {
      console.log('❌ Déplacement entre placements non supporté pour le moment');
      return;
    }

    // Réorganiser les créatifs dans le placement
    const placementCreatifs = creatifs[placementId] || [];
    const oldIndex = placementCreatifs.findIndex(c => c.id === creatifId);
    const newIndex = placementCreatifs.findIndex(c => c.id === overCreatifId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Calculer le nouvel ordre
    const reorderedCreatifs = arrayMove(placementCreatifs, oldIndex, newIndex);
    const creatifOrders = reorderedCreatifs.map((creatif, index) => ({
      id: creatif.id,
      order: index
    }));

    const parents = findParentsForPlacement(placementId);
    if (!parents) return;

    await reorderCreatifs(context, parents.sectionId, parents.tactiqueId, placementId, creatifOrders);
  };

  // ✅ Fonctions utilitaires SIMPLES
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