/**
 * Ce fichier contient un hook personnalisé (useSelectionLogic) qui gère la logique de sélection
 * d'éléments hiérarchiques (sections, tactiques, placements, créatifs) dans une interface utilisateur.
 * Il permet de sélectionner et désélectionner des éléments, en propageant la sélection aux descendants.
 * Le hook fournit également des fonctions pour vérifier l'état de sélection et obtenir des statistiques.
 * C'est une version simplifiée qui traite toute sélection comme "directe" et n'a pas de concept d'héritage.
 */
import { useState, useCallback, useMemo } from 'react';

export interface SelectionItem {
  id: string;
  type: 'section' | 'tactique' | 'placement' | 'creatif';
  name: string;
  parentId?: string;
  childrenIds: string[];
}

export interface UseSelectionLogicProps {
  sections: Array<{
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
  }>;
}

/**
 * Hook principal pour gérer la logique de sélection d'éléments hiérarchiques.
 *
 * @param {UseSelectionLogicProps} props - Les propriétés incluant la liste des sections.
 * @returns {object} Un objet contenant les actions de sélection, l'état de sélection, les statistiques et les IDs bruts sélectionnés.
 */
export function useSelectionLogic({ sections }: UseSelectionLogicProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /**
   * Construit une carte (Map) de tous les éléments sélectionnables à partir des sections fournies.
   * Cette carte facilite la recherche rapide d'éléments par leur ID et l'accès à leurs propriétés.
   *
   * @returns {Map<string, SelectionItem>} Une carte où les clés sont les IDs des éléments et les valeurs sont les objets SelectionItem correspondants.
   */
  const itemsMap = useMemo(() => {
    const map = new Map<string, SelectionItem>();
    
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
  }, [sections]);

  /**
   * Récupère tous les IDs des descendants d'un élément donné.
   *
   * @param {string} itemId - L'ID de l'élément dont on veut récupérer les descendants.
   * @returns {string[]} Un tableau d'IDs représentant tous les descendants de l'élément.
   */
  const getAllDescendants = useCallback((itemId: string): string[] => {
    const descendants: string[] = [];
    const item = itemsMap.get(itemId);
    
    if (!item) return descendants;
    
    const queue = [...item.childrenIds];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      descendants.push(currentId);
      
      const currentItem = itemsMap.get(currentId);
      if (currentItem) {
        queue.push(...currentItem.childrenIds);
      }
    }
    
    return descendants;
  }, [itemsMap]);
  
  /**
   * Récupère tous les IDs des ancêtres d'un élément donné.
   *
   * @param {string} itemId - L'ID de l'élément dont on veut récupérer les ancêtres.
   * @returns {string[]} Un tableau d'IDs représentant tous les ancêtres de l'élément.
   */
  const getAllAncestors = useCallback((itemId: string): string[] => {
    const ancestors: string[] = [];
    let currentItem = itemsMap.get(itemId);
    
    while (currentItem && currentItem.parentId) {
      ancestors.push(currentItem.parentId);
      currentItem = itemsMap.get(currentItem.parentId);
    }
    
    return ancestors;
  }, [itemsMap]);

  /**
   * Bascule l'état de sélection d'un élément (sélectionne ou désélectionne).
   * Lorsque l'élément est sélectionné, tous ses descendants sont également sélectionnés.
   * Lorsque l'élément est désélectionné, tous ses descendants sont également désélectionnés.
   *
   * @param {string} itemId - L'ID de l'élément à basculer.
   * @param {boolean} [forceSelected] - Si vrai, force la sélection ; si faux, force la désélection. Si non défini, bascule l'état actuel.
   */
  const toggleSelection = useCallback((itemId: string, forceSelected?: boolean) => {
    
    const item = itemsMap.get(itemId);
    if (!item) {
      console.warn('Élément non trouvé:', itemId);
      return;
    }
    
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      
      const shouldSelect = forceSelected !== undefined 
        ? forceSelected 
        : !newSelected.has(itemId);
      
      if (shouldSelect) {
        newSelected.add(itemId);
        const descendants = getAllDescendants(itemId);
        descendants.forEach(descendantId => newSelected.add(descendantId));
        
        
      } else {
        newSelected.delete(itemId);
        const descendants = getAllDescendants(itemId);
        descendants.forEach(descendantId => newSelected.delete(descendantId));
        
      }
      
      return newSelected;
    });
  }, [itemsMap, getAllDescendants, getAllAncestors]);
  
  /**
   * Efface toute la sélection, résultant en un ensemble vide d'éléments sélectionnés.
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Vérifie si un élément donné est sélectionné.
   *
   * @param {string} itemId - L'ID de l'élément à vérifier.
   * @returns {boolean} Vrai si l'élément est sélectionné, faux sinon.
   */
  const isSelected = useCallback((itemId: string): boolean => {
    return selectedIds.has(itemId);
  }, [selectedIds]);
  
  /**
   * Récupère tous les éléments actuellement sélectionnés.
   *
   * @returns {object} Un objet contenant :
   * - `direct`: Un tableau de tous les IDs sélectionnés (tous considérés comme directs dans cette version).
   * - `all`: Un tableau de tous les IDs sélectionnés (identique à `direct`).
   * - `details`: Un tableau d'objets contenant l'ID, l'élément complet et un indicateur `isDirect` (toujours vrai).
   */
  const getSelectedItems = useCallback(() => {
    const allSelected = Array.from(selectedIds);
    
    return {
      direct: allSelected,
      all: allSelected,
      
      details: allSelected.map(id => ({
        id,
        item: itemsMap.get(id),
        isDirect: true
      })).filter(item => item.item !== undefined)
    };
  }, [selectedIds, itemsMap]);

  /**
   * Calcule des statistiques sur la sélection actuelle, y compris le total des éléments sélectionnés
   * et la répartition par type d'élément (section, tactique, placement, créatif).
   *
   * @returns {object} Un objet de statistiques de sélection.
   */
  const selectionStats = useMemo(() => {
    const stats = {
      total: selectedIds.size,
      direct: selectedIds.size,
      inherited: 0,
      byType: {
        section: 0,
        tactique: 0,
        placement: 0,
        creatif: 0
      }
    };
    
    selectedIds.forEach(itemId => {
      const item = itemsMap.get(itemId);
      if (item) {
        stats.byType[item.type]++;
      }
    });
    
    return stats;
  }, [selectedIds, itemsMap]);

  return {
    toggleSelection,
    clearSelection,
    
    isSelected,
    getSelectedItems,
    
    selectionStats,
    
    rawSelectedIds: selectedIds
  };
}