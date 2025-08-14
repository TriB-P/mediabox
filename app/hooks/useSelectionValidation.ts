/**
 * Ce fichier contient un hook personnalisé (useSelectionValidation) et des fonctions utilitaires
 * pour valider la sélection d'éléments hiérarchiques (sections, tactiques, placements, créatifs)
 * en vue d'opérations de déplacement. Il s'assure que la sélection est cohérente, qu'il n'y a pas
 * d'éléments "orphelins" (enfants sélectionnés sans leur parent), et détermine le type d'éléments
 * qui seront déplacés ainsi que leur destination possible.
 *
 * Il fournit également un utilitaire (buildHierarchyMap) pour transformer des données brutes en une carte hiérarchique
 * et un autre hook (useSelectionMessages) pour générer des messages d'interface utilisateur basés sur le résultat de la validation.
 */

import { useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

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
  moveLevel?: ItemType;
  targetLevel?: 'onglet' | 'section' | 'tactique' | 'placement';
  errorMessage?: string;
  warningMessage?: string;
  affectedItemsCount: number;
  details: {
    selectedItems: string[];
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
  hierarchyMap: Map<string, HierarchyItem>;
  selectedIds: string[];
}

const MOVE_TARGET_MAP: Record<ItemType, 'onglet' | 'section' | 'tactique' | 'placement'> = {
  'section': 'onglet',
  'tactique': 'section',
  'placement': 'tactique',
  'creatif': 'placement'
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

/**
 * Hook principal pour valider une sélection d'éléments hiérarchiques en vue d'un déplacement.
 * Il effectue plusieurs vérifications pour s'assurer de la cohérence de la sélection.
 *
 * @param {UseSelectionValidationProps} props - Les propriétés incluant la carte hiérarchique complète et les IDs sélectionnés.
 * @returns {SelectionValidationResult} Le résultat de la validation, indiquant si la sélection est valide, déplaçable,
 * le type d'éléments à déplacer, la cible de déplacement, et des messages d'erreur/avertissement si nécessaire.
 */
export function useSelectionValidation({
  hierarchyMap,
  selectedIds
}: UseSelectionValidationProps): SelectionValidationResult {
  const { t } = useTranslation();

  return useMemo(() => {

    if (selectedIds.length === 0) {
      return {
        isValid: false,
        canMove: false,
        errorMessage: t('selectionValidation.errors.noItemSelected'),
        affectedItemsCount: 0,
        details: {
          selectedItems: [],
          orphanCheck: { isValid: true, orphans: [] },
          levelCheck: { isValid: true, levels: [] }
        }
      };
    }

    const selectedItems = selectedIds.map(id => hierarchyMap.get(id)).filter(Boolean) as HierarchyItem[];

    if (selectedItems.length !== selectedIds.length) {
      const missingIds = selectedIds.filter(id => !hierarchyMap.has(id));
      return {
        isValid: false,
        canMove: false,
        errorMessage: `${t('selectionValidation.errors.missingItemsPrefix')} ${missingIds.join(', ')}`,
        affectedItemsCount: 0,
        details: {
          selectedItems: selectedIds,
          orphanCheck: { isValid: false, orphans: [] },
          levelCheck: { isValid: false, levels: [] }
        }
      };
    }

    /**
     * Vérifie si la sélection contient des éléments "orphelins", c'est-à-dire
     * des enfants sélectionnés dont le parent direct n'est pas sélectionné.
     *
     * @param {HierarchyItem[]} selectedItems - Les éléments directement sélectionnés par l'utilisateur.
     * @param {Map<string, HierarchyItem>} hierarchyMap - La carte complète de la hiérarchie.
     * @returns {SelectionValidationResult['details']['orphanCheck']} Un objet indiquant la validité de l'absence d'orphelins et la liste des orphelins trouvés.
     */
    const orphanCheck = checkForOrphans(selectedItems, hierarchyMap);

    if (!orphanCheck.isValid) {
      const firstOrphan = orphanCheck.orphans[0];
      const missingCount = firstOrphan.missingChildren.length;
      const totalOrphans = orphanCheck.orphans.reduce((sum, o) => sum + o.missingChildren.length, 0);

      return {
        isValid: false,
        canMove: false,
        errorMessage: `${t('selectionValidation.errors.incompleteSelectionPrefix')}"${firstOrphan.parentName}"${t('selectionValidation.errors.has')} ${missingCount} ${t('selectionValidation.errors.unselectedItems')} ${totalOrphans} ${t('selectionValidation.errors.missingChildrenTotal')}`,
        affectedItemsCount: selectedItems.length,
        details: {
          selectedItems: selectedIds,
          orphanCheck,
          levelCheck: { isValid: true, levels: [] }
        }
      };
    }

    /**
     * Vérifie la cohérence hiérarchique des éléments sélectionnés.
     * Une sélection est cohérente si tous les éléments racines (les plus hauts niveaux sélectionnés qui n'ont pas de parent sélectionné)
     * sont du même type (par exemple, toutes des sections, ou toutes des tactiques).
     *
     * @param {HierarchyItem[]} selectedItems - Les éléments directement sélectionnés par l'utilisateur.
     * @param {Map<string, HierarchyItem>} hierarchyMap - La carte complète de la hiérarchie.
     * @param {Set<string>} selectedSet - Un ensemble des IDs des éléments sélectionnés pour une recherche rapide.
     * @returns {SelectionValidationResult['details']['levelCheck']} Un objet indiquant la validité de la cohérence des niveaux et les niveaux trouvés.
     */
    const levelCheck = checkHierarchicalConsistency(selectedItems, hierarchyMap, new Set(selectedItems.map(item => item.id)));

    if (!levelCheck.isValid) {
      return {
        isValid: false,
        canMove: false,
        errorMessage: `${t('selectionValidation.errors.incompatibleTypesPrefix')}${levelCheck.mixedLevels?.join(t('selectionValidation.errors.andSeparator'))}${t('selectionValidation.errors.incompatibleTypesSuffix')}`,
        affectedItemsCount: selectedItems.length,
        details: {
          selectedItems: selectedIds,
          orphanCheck,
          levelCheck
        }
      };
    }

    const moveLevel = levelCheck.levels[0].type;
    const targetLevel = MOVE_TARGET_MAP[moveLevel];

    /**
     * Calcule le nombre total d'éléments qui seront affectés par une opération (sélectionnés + leurs enfants et descendants).
     *
     * @param {HierarchyItem[]} selectedItems - Les éléments directement sélectionnés.
     * @param {Map<string, HierarchyItem>} hierarchyMap - La carte complète de la hiérarchie.
     * @returns {number} Le nombre total d'éléments affectés.
     */
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

  }, [hierarchyMap, selectedIds, t]);
}

/**
 * Vérifie si la sélection contient des éléments "orphelins", c'est-à-dire
 * des enfants sélectionnés dont le parent direct n'est pas sélectionné.
 *
 * @param {HierarchyItem[]} selectedItems - Les éléments directement sélectionnés par l'utilisateur.
 * @param {Map<string, HierarchyItem>} hierarchyMap - La carte complète de la hiérarchie.
 * @returns {SelectionValidationResult['details']['orphanCheck']} Un objet indiquant la validité de l'absence d'orphelins et la liste des orphelins trouvés.
 */
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
      continue;
    }

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

/**
 * Vérifie la cohérence hiérarchique des éléments sélectionnés.
 * Une sélection est cohérente si tous les éléments racines (les plus hauts niveaux sélectionnés qui n'ont pas de parent sélectionné)
 * sont du même type (par exemple, toutes des sections, ou toutes des tactiques).
 *
 * @param {HierarchyItem[]} selectedItems - Les éléments directement sélectionnés par l'utilisateur.
 * @param {Map<string, HierarchyItem>} hierarchyMap - La carte complète de la hiérarchie.
 * @param {Set<string>} selectedSet - Un ensemble des IDs des éléments sélectionnés pour une recherche rapide.
 * @returns {SelectionValidationResult['details']['levelCheck']} Un objet indiquant la validité de la cohérence des niveaux et les niveaux trouvés.
 */
function checkHierarchicalConsistency(
  selectedItems: HierarchyItem[],
  hierarchyMap: Map<string, HierarchyItem>,
  selectedSet: Set<string>
): SelectionValidationResult['details']['levelCheck'] {


  const rootLevelCounts = new Map<ItemType, number>();

  selectedItems.forEach(item => {
    const rootLevel = findRootLevel(item.id, hierarchyMap, selectedSet);

    rootLevelCounts.set(rootLevel, (rootLevelCounts.get(rootLevel) || 0) + 1);
  });

  const levels = Array.from(rootLevelCounts.entries()).map(([type, count]) => ({ type, count }));


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

/**
 * Remonte la hiérarchie à partir d'un élément donné pour trouver son "niveau racine" au sein de la sélection.
 * Le niveau racine est l'élément le plus haut dans la hiérarchie sélectionnée qui est un ancêtre de l'élément donné.
 *
 * @param {string} itemId - L'ID de l'élément pour lequel trouver le niveau racine.
 * @param {Map<string, HierarchyItem>} hierarchyMap - La carte complète de la hiérarchie.
 * @param {Set<string>} selectedSet - Un ensemble des IDs des éléments actuellement sélectionnés.
 * @returns {ItemType} Le type de l'élément racine trouvé.
 */
function findRootLevel(
  itemId: string,
  hierarchyMap: Map<string, HierarchyItem>,
  selectedSet: Set<string>
): ItemType {

  const item = hierarchyMap.get(itemId);
  if (!item) {
    return 'creatif';
  }

  let current = item;
  let rootLevel = current.type;

  while (current.parentId) {
    const parent = hierarchyMap.get(current.parentId);
    if (!parent) break;

    if (selectedSet.has(parent.id)) {
      rootLevel = parent.type;
      current = parent;
    } else {
      break;
    }
  }

  return rootLevel;
}

/**
 * Calcule le nombre total d'éléments qui seront affectés par une opération (sélectionnés + leurs enfants et descendants).
 *
 * @param {HierarchyItem[]} selectedItems - Les éléments directement sélectionnés.
 * @param {Map<string, HierarchyItem>} hierarchyMap - La carte complète de la hiérarchie.
 * @returns {number} Le nombre total d'éléments affectés.
 */
function calculateAffectedItemsCount(
  selectedItems: HierarchyItem[],
  hierarchyMap: Map<string, HierarchyItem>
): number {
  const affectedIds = new Set<string>();

  function addAllDescendants(itemId: string) {
    if (affectedIds.has(itemId)) return;

    affectedIds.add(itemId);

    const item = hierarchyMap.get(itemId);
    if (item) {
      item.childrenIds.forEach(childId => addAllDescendants(childId));
    }
  }

  selectedItems.forEach(item => addAllDescendants(item.id));

  return affectedIds.size;
}

/**
 * Construit une carte (Map) de la hiérarchie des éléments à partir d'un tableau de sections.
 * Cette carte est utilisée pour naviguer facilement entre les éléments parent-enfant.
 *
 * @param {Array<Object>} sections - Un tableau d'objets représentant les sections, tactiques, placements et créatifs.
 * @returns {Map<string, HierarchyItem>} Une carte où les clés sont les IDs des éléments et les valeurs sont leurs objets HierarchyItem.
 */
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
    const sectionChildrenIds = section.tactiques.map(t => t.id);
    map.set(section.id, {
      id: section.id,
      type: 'section',
      name: section.SECTION_Name,
      childrenIds: sectionChildrenIds
    });

    section.tactiques.forEach(tactique => {
      const tactiqueChildrenIds = tactique.placements?.map(p => p.id) || [];
      map.set(tactique.id, {
        id: tactique.id,
        type: 'tactique',
        name: tactique.TC_Label,
        parentId: section.id,
        childrenIds: tactiqueChildrenIds
      });

      tactique.placements?.forEach(placement => {
        const placementChildrenIds = placement.creatifs?.map(c => c.id) || [];
        map.set(placement.id, {
          id: placement.id,
          type: 'placement',
          name: placement.PL_Label,
          parentId: tactique.id,
          childrenIds: placementChildrenIds
        });

        placement.creatifs?.forEach(creatif => {
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

/**
 * Hook utilitaire pour générer des messages et des états pour les boutons d'interface utilisateur
 * en fonction du résultat de la validation de la sélection.
 *
 * @param {SelectionValidationResult} validationResult - Le résultat de la validation de la sélection.
 * @returns {Object} Un objet contenant le label du bouton, son état désactivé, le message de statut et sa couleur.
 */
export function useSelectionMessages(validationResult: SelectionValidationResult) {
  const { t } = useTranslation();

  return useMemo(() => {
    if (!validationResult.canMove) {
      return {
        buttonLabel: t('selectionValidation.messages.buttons.invalidSelection'),
        buttonDisabled: true,
        statusMessage: validationResult.errorMessage,
        statusColor: 'red'
      };
    }

    const { moveLevel, targetLevel, affectedItemsCount } = validationResult;
    const directCount = validationResult.details.selectedItems.length;

    const translatedItemLabels = {
        'section': t('selectionValidation.glossary.items.sections'),
        'tactique': t('selectionValidation.glossary.items.tactics'),
        'placement': t('selectionValidation.glossary.items.placements'),
        'creatif': t('selectionValidation.glossary.items.creatives')
    };

    const translatedTargetLabels = {
        'onglet': t('selectionValidation.glossary.targets.tab'),
        'section': t('selectionValidation.glossary.targets.section'),
        'tactique': t('selectionValidation.glossary.targets.tactic'),
        'placement': t('selectionValidation.glossary.targets.placement')
    };

    let buttonLabel = `${t('selectionValidation.messages.buttons.movePrefix')} ${directCount} ${translatedItemLabels[moveLevel!]}`;
    if (affectedItemsCount > directCount) {
      buttonLabel += ` (${affectedItemsCount} ${t('selectionValidation.messages.common.totalItemsSuffix')})`;
    }
    buttonLabel += ` ${t('selectionValidation.messages.buttons.moveTo')} ${translatedTargetLabels[targetLevel!]}`;

    return {
      buttonLabel,
      buttonDisabled: false,
      statusMessage: `${directCount} ${translatedItemLabels[moveLevel!]} ${t(directCount > 1 ? 'selectionValidation.glossary.states.selectedPlural' : 'selectionValidation.glossary.states.selectedSingular')}${
        affectedItemsCount > directCount ? ` (${affectedItemsCount} ${t('selectionValidation.messages.common.totalItemsSuffix')})` : ''
      }`,
      statusColor: 'green'
    };
  }, [validationResult, t]);
}