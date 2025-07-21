// app/hooks/useSelectionValidation.ts - Validation de sélection pour déplacement

import { useMemo } from 'react';

// ==================== TYPES ====================

export type ItemType = 'section' | 'tactique' | 'placement' | 'creatif';

export interface HierarchyItem {
  id: string;
  type: ItemType;
  name: string;
  parentId?: string;
  childrenIds: string[];
}

export interface SelectionValidationResult {
  isValid: boolean;
  canMove: boolean;
  moveLevel?: ItemType;                    // Type d'élément qui sera déplacé
  targetLevel?: 'onglet' | 'section' | 'tactique' | 'placement'; // Où ils iront
  errorMessage?: string;
  warningMessage?: string;
  affectedItemsCount: number;              // Nombre total d'éléments qui seront déplacés
  details: {
    selectedItems: string[];               // IDs directement sélectionnés
    orphanCheck: {
      isValid: boolean;
      orphans: Array<{
        parentId: string;
        parentName: string;
        missingChildren: Array<{ id: string; name: string }>;
      }>;
    };
    levelCheck: {
      isValid: boolean;
      levels: Array<{ type: ItemType; count: number }>;
      mixedLevels?: string[];
    };
  };
}

export interface UseSelectionValidationProps {
  // Structure hiérarchique complète
  hierarchyMap: Map<string, HierarchyItem>;
  
  // Sélection actuelle (IDs directement sélectionnés par l'utilisateur)
  selectedIds: string[];
}

// ==================== CONSTANTES ====================

const MOVE_TARGET_MAP: Record<ItemType, 'onglet' | 'section' | 'tactique' | 'placement'> = {
  'section': 'onglet',      // Les sections vont vers un onglet
  'tactique': 'section',    // Les tactiques vont vers une section
  'placement': 'tactique',  // Les placements vont vers une tactique
  'creatif': 'placement'    // Les créatifs vont vers un placement
};

const ITEM_LABELS: Record<ItemType, string> = {
  'section': 'sections',
  'tactique': 'tactiques', 
  'placement': 'placements',
  'creatif': 'créatifs'
};

const TARGET_LABELS: Record<string, string> = {
  'onglet': 'un onglet',
  'section': 'une section',
  'tactique': 'une tactique',
  'placement': 'un placement'
};

// ==================== HOOK PRINCIPAL ====================

export function useSelectionValidation({
  hierarchyMap,
  selectedIds
}: UseSelectionValidationProps): SelectionValidationResult {

  return useMemo(() => {

    // ==================== VÉRIFICATIONS DE BASE ====================

    if (selectedIds.length === 0) {
      return {
        isValid: false,
        canMove: false,
        errorMessage: 'Aucun élément sélectionné',
        affectedItemsCount: 0,
        details: {
          selectedItems: [],
          orphanCheck: { isValid: true, orphans: [] },
          levelCheck: { isValid: true, levels: [] }
        }
      };
    }

    // Vérifier que tous les éléments sélectionnés existent
    const selectedItems = selectedIds.map(id => hierarchyMap.get(id)).filter(Boolean) as HierarchyItem[];
    
    if (selectedItems.length !== selectedIds.length) {
      const missingIds = selectedIds.filter(id => !hierarchyMap.has(id));
      return {
        isValid: false,
        canMove: false,
        errorMessage: `Éléments manquants dans la hiérarchie: ${missingIds.join(', ')}`,
        affectedItemsCount: 0,
        details: {
          selectedItems: selectedIds,
          orphanCheck: { isValid: false, orphans: [] },
          levelCheck: { isValid: false, levels: [] }
        }
      };
    }

    // ==================== 1ère VÉRIFICATION : ABSENCE D'ORPHELINS ====================

    const orphanCheck = checkForOrphans(selectedItems, hierarchyMap);
    
    if (!orphanCheck.isValid) {
      const firstOrphan = orphanCheck.orphans[0];
      const missingCount = firstOrphan.missingChildren.length;
      const totalOrphans = orphanCheck.orphans.reduce((sum, o) => sum + o.missingChildren.length, 0);
      
      return {
        isValid: false,
        canMove: false,
        errorMessage: `Sélection incomplète : "${firstOrphan.parentName}" a ${missingCount} élément(s) non sélectionné(s). ${totalOrphans} enfant(s) manquant(s) au total.`,
        affectedItemsCount: selectedItems.length,
        details: {
          selectedItems: selectedIds,
          orphanCheck,
          levelCheck: { isValid: true, levels: [] }
        }
      };
    }

    // ==================== 2ème VÉRIFICATION : COHÉRENCE HIÉRARCHIQUE ====================

    const selectedSet = new Set(selectedItems.map(item => item.id));
    const levelCheck = checkHierarchicalConsistency(selectedItems, hierarchyMap, selectedSet);
    
    if (!levelCheck.isValid) {
      return {
        isValid: false,
        canMove: false,
        errorMessage: `Types d'éléments incompatibles : impossible de déplacer des ${levelCheck.mixedLevels?.join(' et des ')} ensemble.`,
        affectedItemsCount: selectedItems.length,
        details: {
          selectedItems: selectedIds,
          orphanCheck,
          levelCheck
        }
      };
    }

    // ==================== VALIDATION RÉUSSIE ====================

    const moveLevel = levelCheck.levels[0].type;
    const targetLevel = MOVE_TARGET_MAP[moveLevel];
    
    // Calculer le nombre total d'éléments qui seront affectés (sélectionnés + leurs enfants)
    const affectedItemsCount = calculateAffectedItemsCount(selectedItems, hierarchyMap);

    return {
      isValid: true,
      canMove: true,
      moveLevel,
      targetLevel,
      affectedItemsCount,
      details: {
        selectedItems: selectedIds,
        orphanCheck,
        levelCheck
      }
    };

  }, [hierarchyMap, selectedIds]);
}

// ==================== FONCTIONS UTILITAIRES ====================

function checkForOrphans(
  selectedItems: HierarchyItem[],
  hierarchyMap: Map<string, HierarchyItem>
): SelectionValidationResult['details']['orphanCheck'] {
  
  const selectedSet = new Set(selectedItems.map(item => item.id));
  const orphans: Array<{
    parentId: string;
    parentName: string;
    missingChildren: Array<{ id: string; name: string }>;
  }> = [];


  for (const selectedItem of selectedItems) {
    if (selectedItem.childrenIds.length === 0) {
      // Pas d'enfants, pas de problème
      continue;
    }

    // Vérifier si TOUS les enfants directs sont sélectionnés
    const missingChildren: Array<{ id: string; name: string }> = [];
    
    for (const childId of selectedItem.childrenIds) {
      if (!selectedSet.has(childId)) {
        const childItem = hierarchyMap.get(childId);
        if (childItem) {
          missingChildren.push({
            id: childId,
            name: childItem.name
          });
        }
      }
    }

    if (missingChildren.length > 0) {
      orphans.push({
        parentId: selectedItem.id,
        parentName: selectedItem.name,
        missingChildren
      });
    }
  }

  return {
    isValid: orphans.length === 0,
    orphans
  };
}

function checkHierarchicalConsistency(
  selectedItems: HierarchyItem[],
  hierarchyMap: Map<string, HierarchyItem>,
  selectedSet: Set<string>
): SelectionValidationResult['details']['levelCheck'] {
  

  // Pour chaque élément, trouver son niveau hiérarchique racine
  const rootLevelCounts = new Map<ItemType, number>();
  
  selectedItems.forEach(item => {
    const rootLevel = findRootLevel(item.id, hierarchyMap, selectedSet);
    
    rootLevelCounts.set(rootLevel, (rootLevelCounts.get(rootLevel) || 0) + 1);
  });

  const levels = Array.from(rootLevelCounts.entries()).map(([type, count]) => ({ type, count }));
  

  // Vérifier qu'on a un seul niveau racine
  if (levels.length > 1) {
    const mixedLevels = levels.map(l => ITEM_LABELS[l.type]);
    
    return {
      isValid: false,
      levels,
      mixedLevels
    };
  }

  
  return {
    isValid: true,
    levels
  };
}

// ==================== NOUVELLE FONCTION : TROUVER LE NIVEAU RACINE ====================

function findRootLevel(
  itemId: string, 
  hierarchyMap: Map<string, HierarchyItem>, 
  selectedSet: Set<string>
): ItemType {
  
  const item = hierarchyMap.get(itemId);
  if (!item) {
    return 'creatif'; // Fallback
  }
  
  // Remonter la hiérarchie jusqu'à trouver le plus haut niveau sélectionné
  let current = item;
  let rootLevel = current.type;
  
  while (current.parentId) {
    const parent = hierarchyMap.get(current.parentId);
    if (!parent) break;
    
    // Si le parent est sélectionné, il devient notre nouveau niveau racine
    if (selectedSet.has(parent.id)) {
      rootLevel = parent.type;
      current = parent;
    } else {
      // Le parent n'est pas sélectionné, on s'arrête ici
      break;
    }
  }
  
  return rootLevel;
}

function calculateAffectedItemsCount(
  selectedItems: HierarchyItem[],
  hierarchyMap: Map<string, HierarchyItem>
): number {
  const affectedIds = new Set<string>();
  
  // Fonction récursive pour ajouter tous les descendants
  function addAllDescendants(itemId: string) {
    if (affectedIds.has(itemId)) return;
    
    affectedIds.add(itemId);
    
    const item = hierarchyMap.get(itemId);
    if (item) {
      item.childrenIds.forEach(childId => addAllDescendants(childId));
    }
  }
  
  // Ajouter chaque élément sélectionné et tous ses descendants
  selectedItems.forEach(item => addAllDescendants(item.id));
  
  return affectedIds.size;
}

// ==================== UTILITAIRE POUR CONSTRUIRE LA HIÉRARCHIE ====================

export function buildHierarchyMap(sections: Array<{
  id: string;
  SECTION_Name: string;
  tactiques: Array<{
    id: string;
    TC_Label: string;
    placements?: Array<{
      id: string;
      PL_Label: string;
      creatifs?: Array<{
        id: string;
        CR_Label: string;
      }>;
    }>;
  }>;
}>): Map<string, HierarchyItem> {
  
  const map = new Map<string, HierarchyItem>();
  
  
  sections.forEach(section => {
    // Ajouter la section
    const sectionChildrenIds = section.tactiques.map(t => t.id);
    map.set(section.id, {
      id: section.id,
      type: 'section',
      name: section.SECTION_Name,
      childrenIds: sectionChildrenIds
    });
    
    section.tactiques.forEach(tactique => {
      // Ajouter la tactique
      const tactiqueChildrenIds = tactique.placements?.map(p => p.id) || [];
      map.set(tactique.id, {
        id: tactique.id,
        type: 'tactique',
        name: tactique.TC_Label,
        parentId: section.id,
        childrenIds: tactiqueChildrenIds
      });
      
      tactique.placements?.forEach(placement => {
        // Ajouter le placement
        const placementChildrenIds = placement.creatifs?.map(c => c.id) || [];
        map.set(placement.id, {
          id: placement.id,
          type: 'placement',
          name: placement.PL_Label,
          parentId: tactique.id,
          childrenIds: placementChildrenIds
        });
        
        placement.creatifs?.forEach(creatif => {
          // Ajouter le créatif
          map.set(creatif.id, {
            id: creatif.id,
            type: 'creatif',
            name: creatif.CR_Label,
            parentId: placement.id,
            childrenIds: []
          });
        });
      });
    });
  });
  
  return map;
}

// ==================== HOOK UTILITAIRE POUR MESSAGES D'INTERFACE ====================

export function useSelectionMessages(validationResult: SelectionValidationResult) {
  return useMemo(() => {
    if (!validationResult.canMove) {
      return {
        buttonLabel: 'Sélection invalide',
        buttonDisabled: true,
        statusMessage: validationResult.errorMessage,
        statusColor: 'red'
      };
    }
    
    const { moveLevel, targetLevel, affectedItemsCount } = validationResult;
    const directCount = validationResult.details.selectedItems.length;
    
    let buttonLabel = `Déplacer ${directCount} ${ITEM_LABELS[moveLevel!]}`;
    if (affectedItemsCount > directCount) {
      buttonLabel += ` (${affectedItemsCount} éléments au total)`;
    }
    buttonLabel += ` vers ${TARGET_LABELS[targetLevel!]}`;
    
    return {
      buttonLabel,
      buttonDisabled: false,
      statusMessage: `${directCount} ${ITEM_LABELS[moveLevel!]} sélectionné${directCount > 1 ? 's' : ''}${
        affectedItemsCount > directCount ? ` (${affectedItemsCount} éléments au total)` : ''
      }`,
      statusColor: 'green'
    };
  }, [validationResult]);
}