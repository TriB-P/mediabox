// app/hooks/useInsertionIndicator.ts
/**
 * Hook pour gérer l'indicateur d'insertion visuel pendant le drag & drop
 * Affiche une ligne bleue indiquant où l'élément sera inséré
 */
import { useState, useCallback } from 'react';
import { DragOverEvent } from '@dnd-kit/core';

interface InsertionIndicatorState {
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
}

interface UseInsertionIndicatorReturn {
  indicatorState: InsertionIndicatorState;
  handleDragOverWithIndicator: (event: DragOverEvent) => void;
  hideIndicator: () => void;
  resetIndicator: () => void;
}

export const useInsertionIndicator = (): UseInsertionIndicatorReturn => {
  const [indicatorState, setIndicatorState] = useState<InsertionIndicatorState>({
    isVisible: false,
    position: null,
    targetType: null,
    insertionMode: null,
    targetId: null
  });

  /**
   * Détermine le type d'élément basé sur l'ID
   */
  const getElementType = (id: string): 'tactique' | 'placement' | 'creatif' | 'zone' | null => {
    if (id.startsWith('tactique-')) return 'tactique';
    if (id.startsWith('placement-')) return 'placement';
    if (id.startsWith('creatif-')) return 'creatif';
    if (id.startsWith('tactiques-') || id.startsWith('placements-') || id.startsWith('creatifs-')) return 'zone';
    return null;
  };

  /**
   * Calcule la position de l'indicateur basée sur l'élément survolé
   */
  const calculateIndicatorPosition = (
    targetElement: Element,
    mouseY: number,
    elementType: 'tactique' | 'placement' | 'creatif'
  ) => {
    const rect = targetElement.getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2;
    const insertBefore = mouseY < elementCenter;

    // Position de l'indicateur
    const indicatorY = insertBefore ? rect.top : rect.bottom;
    
    // Décalage horizontal selon le type d'élément
    let leftOffset = 0;
    let indicatorWidth = rect.width;
    
    switch (elementType) {
      case 'tactique':
        leftOffset = 40; // Décalage pour les tactiques
        indicatorWidth = rect.width - 40;
        break;
      case 'placement':
        leftOffset = 80; // Décalage plus important pour les placements
        indicatorWidth = rect.width - 80;
        break;
      case 'creatif':
        leftOffset = 120; // Décalage maximum pour les créatifs
        indicatorWidth = rect.width - 120;
        break;
    }

    return {
      x: rect.left + leftOffset,
      y: indicatorY - 1, // -1 pour centrer la ligne de 2px
      width: indicatorWidth,
      height: 2,
      insertionMode: insertBefore ? 'before' : 'after'
    };
  };

  /**
   * Calcule la position pour une zone vide (drop zone)
   */
  const calculateZoneIndicatorPosition = (
    targetElement: Element,
    zoneType: string
  ) => {
    const rect = targetElement.getBoundingClientRect();
    
    let leftOffset = 0;
    let indicatorWidth = rect.width;
    
    if (zoneType.startsWith('tactiques-')) {
      leftOffset = 40;
      indicatorWidth = rect.width - 40;
    } else if (zoneType.startsWith('placements-')) {
      leftOffset = 80;
      indicatorWidth = rect.width - 80;
    } else if (zoneType.startsWith('creatifs-')) {
      leftOffset = 120;
      indicatorWidth = rect.width - 120;
    }

    return {
      x: rect.left + leftOffset,
      y: rect.bottom - 1,
      width: indicatorWidth,
      height: 2,
      insertionMode: 'inside'
    };
  };

  /**
   * Gestionnaire principal du drag over avec calcul d'indicateur
   */
  const handleDragOverWithIndicator = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !active) {
      hideIndicator();
      return;
    }

    const activeType = getElementType(active.id as string);
    const overType = getElementType(over.id as string);
    
    if (!activeType || !overType) {
      hideIndicator();
      return;
    }

    // Récupérer l'élément DOM de destination
    const targetElement = document.querySelector(`[data-dnd-id="${over.id}"]`);
    if (!targetElement) {
      hideIndicator();
      return;
    }

    // Récupérer la position de la souris (approximation via l'événement)
    const mouseY = event.delta?.y ? (targetElement.getBoundingClientRect().top + event.delta.y) : 
                   (targetElement.getBoundingClientRect().top + targetElement.getBoundingClientRect().height / 2);

    let position;
    let targetType: 'tactique' | 'placement' | 'creatif' | null = null;
    let insertionMode: 'before' | 'after' | 'inside' | null = null;

    if (overType === 'zone') {
      // Drop sur une zone vide
      position = calculateZoneIndicatorPosition(targetElement, over.id as string);
      insertionMode = 'inside' as const;
      
      // Déterminer le type basé sur la zone
      const zoneId = over.id as string;
      if (zoneId.startsWith('tactiques-')) targetType = 'tactique';
      else if (zoneId.startsWith('placements-')) targetType = 'placement';
      else if (zoneId.startsWith('creatifs-')) targetType = 'creatif';
    } else {
      // Drop sur un élément existant
      targetType = overType;
      const calculated = calculateIndicatorPosition(targetElement, mouseY, overType);
      position = {
        x: calculated.x,
        y: calculated.y,
        width: calculated.width,
        height: calculated.height
      };
      insertionMode = calculated.insertionMode as 'before' | 'after';
    }

    // Vérifier la compatibilité des types (empêcher les drops invalides)
    const isValidDrop = checkDropValidity(activeType, targetType, over.id as string);
    
    if (!isValidDrop) {
      hideIndicator();
      return;
    }

    setIndicatorState({
      isVisible: true,
      position,
      targetType,
      insertionMode,
      targetId: over.id as string
    });
  }, []);

  /**
   * Vérifie si le drop est valide selon les règles métier
   */
  const checkDropValidity = (
    activeType: string, 
    targetType: 'tactique' | 'placement' | 'creatif' | null, 
    overId: string
  ): boolean => {
    // Tactiques peuvent être droppées sur zones tactiques ou autres tactiques
    if (activeType === 'tactique') {
      return overId.startsWith('tactiques-') || overId.startsWith('tactique-');
    }
    
    // Placements peuvent être droppés sur zones placements ou autres placements
    if (activeType === 'placement') {
      return overId.startsWith('placements-') || overId.startsWith('placement-');
    }
    
    // Créatifs peuvent être droppés sur zones créatifs ou autres créatifs
    if (activeType === 'creatif') {
      return overId.startsWith('creatifs-') || overId.startsWith('creatif-');
    }
    
    return false;
  };

  /**
   * Cache l'indicateur
   */
  const hideIndicator = useCallback(() => {
    setIndicatorState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  /**
   * Remet à zéro l'indicateur
   */
  const resetIndicator = useCallback(() => {
    setIndicatorState({
      isVisible: false,
      position: null,
      targetType: null,
      insertionMode: null,
      targetId: null
    });
  }, []);

  return {
    indicatorState,
    handleDragOverWithIndicator,
    hideIndicator,
    resetIndicator
  };
};