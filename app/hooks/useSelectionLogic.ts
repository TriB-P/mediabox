// app/hooks/useSelectionLogic.ts - Version simplifiée sans distinction direct/hérité

import { useState, useCallback, useMemo } from 'react';

// ==================== TYPES SIMPLIFIÉS ====================

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

// ==================== HOOK PRINCIPAL SIMPLIFIÉ ====================

export function useSelectionLogic({ sections }: UseSelectionLogicProps) {
  
  // ==================== ÉTAT SIMPLE ====================
  
  // Un seul Set avec tous les éléments sélectionnés (sans distinction)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ==================== CONSTRUCTION DE LA MAP DES ÉLÉMENTS ====================
  
  const itemsMap = useMemo(() => {
    const map = new Map<string, SelectionItem>();
    
    console.log('🔄 Construction de la map des éléments');
    
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
    
    console.log('✅ Map construite avec', map.size, 'éléments');
    return map;
  }, [sections]);

  // ==================== FONCTIONS UTILITAIRES ====================
  
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
  
  const getAllAncestors = useCallback((itemId: string): string[] => {
    const ancestors: string[] = [];
    let currentItem = itemsMap.get(itemId);
    
    while (currentItem && currentItem.parentId) {
      ancestors.push(currentItem.parentId);
      currentItem = itemsMap.get(currentItem.parentId);
    }
    
    return ancestors;
  }, [itemsMap]);

  // ==================== ACTION DE SÉLECTION SIMPLIFIÉE ====================
  
  const toggleSelection = useCallback((itemId: string, forceSelected?: boolean) => {
    console.log('🎯 Toggle sélection pour:', itemId, forceSelected !== undefined ? `(forcé: ${forceSelected})` : '');
    
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
        // SÉLECTION : Ajouter l'élément ET tous ses descendants
        console.log('✅ Sélection de', item.name, 'et ses descendants');
        
        newSelected.add(itemId);
        const descendants = getAllDescendants(itemId);
        descendants.forEach(descendantId => newSelected.add(descendantId));
        
        console.log('📦 Ajoutés:', 1 + descendants.length, 'éléments');
        
      } else {
        // DÉSÉLECTION : Enlever l'élément ET tous ses descendants (mais PAS les parents)
        console.log('❌ Désélection de', item.name, 'et ses descendants seulement');
        
        // Enlever l'élément et ses descendants
        newSelected.delete(itemId);
        const descendants = getAllDescendants(itemId);
        descendants.forEach(descendantId => newSelected.delete(descendantId));
        
        console.log('🗑️ Supprimés:', 1 + descendants.length, 'éléments');
      }
      
      console.log('📊 Nouvelle sélection:', newSelected.size, 'éléments');
      return newSelected;
    });
  }, [itemsMap, getAllDescendants, getAllAncestors]);
  
  const clearSelection = useCallback(() => {
    console.log('🔄 Effacement de toute la sélection');
    setSelectedIds(new Set());
  }, []);

  // ==================== GETTERS SIMPLIFIÉS ====================
  
  const isSelected = useCallback((itemId: string): boolean => {
    return selectedIds.has(itemId);
  }, [selectedIds]);
  
  const getSelectedItems = useCallback(() => {
    const allSelected = Array.from(selectedIds);
    
    return {
      // Tous les éléments sélectionnés (plus de distinction)
      direct: allSelected,
      all: allSelected,
      
      // Détails complets
      details: allSelected.map(id => ({
        id,
        item: itemsMap.get(id),
        isDirect: true // Maintenant tout est "direct"
      })).filter(item => item.item !== undefined)
    };
  }, [selectedIds, itemsMap]);

  // ==================== STATISTIQUES SIMPLIFIÉES ====================
  
  const selectionStats = useMemo(() => {
    const stats = {
      total: selectedIds.size,
      direct: selectedIds.size,    // Maintenant tout est direct
      inherited: 0,                // Plus d'héritage
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

  // ==================== RETURN SIMPLIFIÉ ====================
  
  return {
    // Actions
    toggleSelection,
    clearSelection,
    
    // État (simplifié - plus qu'une seule méthode)
    isSelected,            // Remplace isDirectlySelected et isVisuallySelected
    getSelectedItems,
    
    // Statistiques
    selectionStats,
    
    // Données brutes (pour debug)
    rawSelectedIds: selectedIds
  };
}