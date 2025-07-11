// app/hooks/useAdvancedTableData.ts

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Section, Tactique, Placement, Creatif } from '../types/tactiques';
import { TableRow, TableLevel, EntityCounts, BulkUpdateOperation } from '../components/Tactiques/TactiquesAdvancedTableView';

// ==================== TYPES ====================

interface UseAdvancedTableDataProps {
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  onUpdateSection: (sectionId: string, data: Partial<Section>) => Promise<void>;
  onUpdateTactique: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  onUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  onUpdateCreatif: (creatifId: string, data: Partial<Creatif>) => Promise<void>;
}

interface UseAdvancedTableDataReturn {
  // Données transformées
  tableRows: TableRow[];
  entityCounts: EntityCounts;
  
  // États de sélection et d'édition
  selectedLevel: TableLevel;
  pendingChanges: Map<string, Partial<any>>;
  editingCells: Set<string>;
  selectedRows: Set<string>;
  expandedSections: Set<string>;
  
  // Actions de modification
  setSelectedLevel: (level: TableLevel) => void;
  updateCell: (entityId: string, fieldKey: string, value: any) => void;
  startEdit: (cellKey: string) => void;
  endEdit: (cellKey: string) => void;
  
  // Actions de sélection
  selectRow: (rowId: string, isSelected: boolean) => void;
  selectMultipleRows: (rowIds: string[], isSelected: boolean) => void;
  clearSelection: () => void;
  
  // Actions d'expansion
  toggleSectionExpansion: (sectionId: string) => void;
  expandAllSections: () => void;
  collapseAllSections: () => void;
  
  // Actions d'édition en masse
  bulkEdit: (fieldKey: string, value: any, entityIds: string[]) => void;
  fillDown: (fromRowId: string, fieldKey: string, toRowIds: string[]) => void;
  copyValues: (fromRowId: string, toRowIds: string[]) => void;
  
  // Actions de sauvegarde
  saveAllChanges: () => Promise<void>;
  cancelAllChanges: () => void;
  
  // États utilitaires
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

// ==================== HOOK PRINCIPAL ====================

export function useAdvancedTableData({
  sections,
  tactiques,
  placements,
  creatifs,
  onUpdateSection,
  onUpdateTactique,
  onUpdatePlacement,
  onUpdateCreatif
}: UseAdvancedTableDataProps): UseAdvancedTableDataReturn {

  // ==================== ÉTATS ====================

  const [selectedLevel, setSelectedLevel] = useState<TableLevel>('tactique');
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<any>>>(new Map());
  const [editingCells, setEditingCells] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map(s => s.id)) // Toutes les sections étendues par défaut
  );
  const [isSaving, setIsSaving] = useState(false);

  // ==================== DONNÉES CALCULÉES ====================

  // Compter les entités par type
  const entityCounts = useMemo((): EntityCounts => {
    const tactiquesCount = Object.values(tactiques).reduce((sum, sectionTactiques) => sum + sectionTactiques.length, 0);
    const placementsCount = Object.values(placements).reduce((sum, tactiquePlacements) => sum + tactiquePlacements.length, 0);
    const creatifsCount = Object.values(creatifs).reduce((sum, placementCreatifs) => sum + placementCreatifs.length, 0);

    return {
      sections: sections.length,
      tactiques: tactiquesCount,
      placements: placementsCount,
      creatifs: creatifsCount
    };
  }, [sections, tactiques, placements, creatifs]);

  // Générer les lignes du tableau avec hiérarchie aplatie
  const tableRows = useMemo((): TableRow[] => {
    const rows: TableRow[] = [];

    sections.forEach(section => {
      // Ligne de section
      rows.push({
        id: section.id,
        type: 'section',
        data: section,
        level: 0,
        isEditable: selectedLevel === 'section',
        sectionId: section.id
      });

      // Si la section est étendue, ajouter ses enfants
      if (expandedSections.has(section.id)) {
        const sectionTactiques = tactiques[section.id] || [];
        
        sectionTactiques.forEach(tactique => {
          // Ligne de tactique
          rows.push({
            id: tactique.id,
            type: 'tactique',
            data: tactique,
            level: 1,
            isEditable: selectedLevel === 'tactique',
            parentId: section.id,
            sectionId: section.id,
            tactiqueId: tactique.id
          });

          const tactiquePlacements = placements[tactique.id] || [];
          
          tactiquePlacements.forEach(placement => {
            // Ligne de placement
            rows.push({
              id: placement.id,
              type: 'placement',
              data: placement,
              level: 2,
              isEditable: selectedLevel === 'placement',
              parentId: tactique.id,
              sectionId: section.id,
              tactiqueId: tactique.id,
              placementId: placement.id
            });

            const placementCreatifs = creatifs[placement.id] || [];
            
            placementCreatifs.forEach(creatif => {
              // Ligne de créatif
              rows.push({
                id: creatif.id,
                type: 'creatif',
                data: creatif,
                level: 3,
                isEditable: selectedLevel === 'creatif',
                parentId: placement.id,
                sectionId: section.id,
                tactiqueId: tactique.id,
                placementId: placement.id
              });
            });
          });
        });
      }
    });

    return rows;
  }, [sections, tactiques, placements, creatifs, selectedLevel, expandedSections]);

  const hasUnsavedChanges = pendingChanges.size > 0;

  // ==================== ACTIONS DE MODIFICATION ====================

  const updateCell = useCallback((entityId: string, fieldKey: string, value: any) => {
    setPendingChanges(prev => {
      const newChanges = new Map(prev);
      const currentChanges = newChanges.get(entityId) || {};
      
      newChanges.set(entityId, {
        ...currentChanges,
        [fieldKey]: value
      });

      return newChanges;
    });
  }, []);

  const startEdit = useCallback((cellKey: string) => {
    setEditingCells(prev => {
      const newEditingCells = new Set(prev);
      newEditingCells.add(cellKey);
      return newEditingCells;
    });
  }, []);

  const endEdit = useCallback((cellKey: string) => {
    setEditingCells(prev => {
      const newEditingCells = new Set(prev);
      newEditingCells.delete(cellKey);
      return newEditingCells;
    });
  }, []);

  // ==================== ACTIONS DE SÉLECTION ====================

  const selectRow = useCallback((rowId: string, isSelected: boolean) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      
      if (isSelected) {
        newSelected.add(rowId);
      } else {
        newSelected.delete(rowId);
      }

      return newSelected;
    });
  }, []);

  const selectMultipleRows = useCallback((rowIds: string[], isSelected: boolean) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      
      rowIds.forEach(rowId => {
        if (isSelected) {
          newSelected.add(rowId);
        } else {
          newSelected.delete(rowId);
        }
      });

      return newSelected;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  // ==================== ACTIONS D'EXPANSION ====================

  const toggleSectionExpansion = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }

      return newExpanded;
    });
  }, []);

  const expandAllSections = useCallback(() => {
    setExpandedSections(new Set(sections.map(s => s.id)));
  }, [sections]);

  const collapseAllSections = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  // ==================== ACTIONS D'ÉDITION EN MASSE ====================

  const bulkEdit = useCallback((fieldKey: string, value: any, entityIds: string[]) => {
    setPendingChanges(prev => {
      const newChanges = new Map(prev);
      
      entityIds.forEach(entityId => {
        const currentChanges = newChanges.get(entityId) || {};
        newChanges.set(entityId, {
          ...currentChanges,
          [fieldKey]: value
        });
      });

      return newChanges;
    });
  }, []);

  const fillDown = useCallback((fromRowId: string, fieldKey: string, toRowIds: string[]) => {
    // Récupérer la valeur de la ligne source
    const fromRow = tableRows.find(row => row.id === fromRowId);
    if (!fromRow) return;

    // Vérifier s'il y a des modifications pendantes pour ce champ
    const pendingChange = pendingChanges.get(fromRowId);
    const sourceValue = pendingChange && pendingChange[fieldKey] !== undefined 
      ? pendingChange[fieldKey] 
      : (fromRow.data as any)[fieldKey];

    // Appliquer la valeur aux lignes cibles
    bulkEdit(fieldKey, sourceValue, toRowIds);
  }, [tableRows, pendingChanges, bulkEdit]);

  const copyValues = useCallback((fromRowId: string, toRowIds: string[]) => {
    const fromRow = tableRows.find(row => row.id === fromRowId);
    if (!fromRow) return;

    // Obtenir toutes les valeurs de la ligne source (données + modifications pendantes)
    const sourceData = fromRow.data as any;
    const sourcePendingChanges = pendingChanges.get(fromRowId) || {};
    const allSourceValues = { ...sourceData, ...sourcePendingChanges };

    // Appliquer toutes les valeurs aux lignes cibles (exclure les champs système)
    const systemFields = ['id', 'createdAt', 'updatedAt', 'TC_SectionId', 'PL_TactiqueId', 'CR_PlacementId'];
    
    setPendingChanges(prev => {
      const newChanges = new Map(prev);
      
      toRowIds.forEach(toRowId => {
        const targetRow = tableRows.find(row => row.id === toRowId);
        if (!targetRow || targetRow.type !== fromRow.type) return; // Copie seulement entre même type
        
        const currentChanges = newChanges.get(toRowId) || {};
        const valuesToCopy: any = {};
        
        Object.keys(allSourceValues).forEach(key => {
          if (!systemFields.includes(key)) {
            valuesToCopy[key] = allSourceValues[key];
          }
        });
        
        newChanges.set(toRowId, {
          ...currentChanges,
          ...valuesToCopy
        });
      });

      return newChanges;
    });
  }, [tableRows, pendingChanges]);

  // ==================== ACTIONS DE SAUVEGARDE ====================

  const saveAllChanges = useCallback(async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    
    try {
      const updatePromises: Promise<void>[] = [];
      const pendingChangesArray = Array.from(pendingChanges.entries());

      for (const [entityId, changes] of pendingChangesArray) {
        const row = tableRows.find(r => r.id === entityId);
        if (!row) continue;

        switch (row.type) {
          case 'section':
            updatePromises.push(onUpdateSection(entityId, changes));
            break;
          case 'tactique':
            if (row.sectionId) {
              updatePromises.push(onUpdateTactique(row.sectionId, entityId, changes));
            }
            break;
          case 'placement':
            updatePromises.push(onUpdatePlacement(entityId, changes));
            break;
          case 'creatif':
            updatePromises.push(onUpdateCreatif(entityId, changes));
            break;
        }
      }

      await Promise.all(updatePromises);

      // Reset des états après sauvegarde réussie
      setPendingChanges(new Map());
      setEditingCells(new Set());
      setSelectedRows(new Set());

      console.log(`✅ ${pendingChangesArray.length} modifications sauvegardées avec succès`);

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      throw error; // Propager l'erreur pour gestion par le composant parent
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, tableRows, onUpdateSection, onUpdateTactique, onUpdatePlacement, onUpdateCreatif]);

  const cancelAllChanges = useCallback(() => {
    setPendingChanges(new Map());
    setEditingCells(new Set());
    setSelectedRows(new Set());
    console.log('🔄 Toutes les modifications ont été annulées');
  }, []);

  // ==================== EFFETS ====================

  // Mise à jour des sections étendues quand les sections changent
  useEffect(() => {
    setExpandedSections(prev => {
      const currentSectionIds = new Set(sections.map(s => s.id));
      const newExpanded = new Set<string>();
      
      // Conserver les sections étendues qui existent encore
      prev.forEach(sectionId => {
        if (currentSectionIds.has(sectionId)) {
          newExpanded.add(sectionId);
        }
      });
      
      // Étendre automatiquement les nouvelles sections
      sections.forEach(section => {
        if (!prev.has(section.id)) {
          newExpanded.add(section.id);
        }
      });
      
      return newExpanded;
    });
  }, [sections]);

  // Reset des changements et sélections lors du changement de niveau
  useEffect(() => {
    setPendingChanges(new Map());
    setEditingCells(new Set());
    setSelectedRows(new Set());
  }, [selectedLevel]);

  // ==================== RETURN ====================

  return {
    // Données transformées
    tableRows,
    entityCounts,
    
    // États de sélection et d'édition
    selectedLevel,
    pendingChanges,
    editingCells,
    selectedRows,
    expandedSections,
    
    // Actions de modification
    setSelectedLevel,
    updateCell,
    startEdit,
    endEdit,
    
    // Actions de sélection
    selectRow,
    selectMultipleRows,
    clearSelection,
    
    // Actions d'expansion
    toggleSectionExpansion,
    expandAllSections,
    collapseAllSections,
    
    // Actions d'édition en masse
    bulkEdit,
    fillDown,
    copyValues,
    
    // Actions de sauvegarde
    saveAllChanges,
    cancelAllChanges,
    
    // États utilitaires
    isSaving,
    hasUnsavedChanges
  };
}