// app/hooks/useAdvancedTableData.ts

/**
 * CORRECTION du bug de refresh des sections
 * 
 * Le problème : Après sauvegarde des sections, pendingChanges était vidé immédiatement
 * mais les props sections n'étaient pas encore mises à jour, causant l'affichage 
 * des anciennes valeurs.
 * 
 * Solution : Maintenir un état intermédiaire (savedChanges) qui garde les valeurs
 * sauvegardées jusqu'à ce que les données soient effectivement mises à jour.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Section, Tactique, Placement, Creatif } from '../types/tactiques';
import { TableRow, TableLevel, EntityCounts } from '../components/Tactiques/Views/Table/TactiquesAdvancedTableView';

interface UseAdvancedTableDataProps {
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  onUpdateSection: (sectionId: string, data: Partial<Section>) => Promise<void>;
  onUpdateTactique: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  onUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  onUpdateCreatif: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string, data: Partial<Creatif>) => Promise<void>;
}

interface UseAdvancedTableDataReturn {
  tableRows: TableRow[];
  entityCounts: EntityCounts;
  selectedLevel: TableLevel;
  pendingChanges: Map<string, Partial<any>>;
  editingCells: Set<string>;
  selectedRows: Set<string>;
  expandedSections: Set<string>;
  setSelectedLevel: (level: TableLevel) => void;
  updateCell: (entityId: string, fieldKey: string, value: any) => void;
  startEdit: (cellKey: string) => void;
  endEdit: (cellKey: string) => void;
  selectRow: (rowId: string, isSelected: boolean) => void;
  selectMultipleRows: (rowIds: string[], isSelected: boolean) => void;
  clearSelection: () => void;
  toggleSectionExpansion: (sectionId: string) => void;
  expandAllSections: () => void;
  collapseAllSections: () => void;
  bulkEdit: (fieldKey: string, value: any, entityIds: string[]) => void;
  fillDown: (fromRowId: string, fieldKey: string, toRowIds: string[]) => void;
  copyValues: (fromRowId: string, toRowIds: string[]) => void;
  saveAllChanges: () => Promise<void>;
  cancelAllChanges: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

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

  const [selectedLevel, setSelectedLevel] = useState<TableLevel>('tactique');
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<any>>>(new Map());
  
  // NOUVEAU : État pour maintenir les changements sauvegardés jusqu'à synchronisation
  const [savedChanges, setSavedChanges] = useState<Map<string, Partial<any>>>(new Map());
  
  const [editingCells, setEditingCells] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map(s => s.id))
  );
  const [isSaving, setIsSaving] = useState(false);

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

  /**
   * MODIFIÉ : Fonction utilitaire pour obtenir la valeur effective d'un champ
   * Prend en compte les modifications en attente ET les modifications sauvegardées
   */
  const getEffectiveValue = useCallback((entityId: string, fieldKey: string, originalData: any): any => {
    // 1. Vérifier les modifications en attente (priorité haute)
    const pendingChange = pendingChanges.get(entityId);
    if (pendingChange && pendingChange[fieldKey] !== undefined) {
      return pendingChange[fieldKey];
    }

    // 2. Vérifier les modifications sauvegardées (priorité moyenne)
    const savedChange = savedChanges.get(entityId);
    if (savedChange && savedChange[fieldKey] !== undefined) {
      return savedChange[fieldKey];
    }

    // 3. Valeur originale (priorité basse)
    return originalData[fieldKey];
  }, [pendingChanges, savedChanges]);

  /**
   * MODIFIÉ : Génère les lignes du tableau avec support des valeurs sauvegardées
   */
  const tableRows = useMemo((): TableRow[] => {
    const rows: TableRow[] = [];

    sections.forEach(section => {
      // Créer les données effectives pour la section
      const effectiveData = { ...section };
      
      // Appliquer les modifications sauvegardées
      const sectionSavedChanges = savedChanges.get(section.id);
      if (sectionSavedChanges) {
        Object.assign(effectiveData, sectionSavedChanges);
      }
      
      // Appliquer les modifications en attente
      const sectionPendingChanges = pendingChanges.get(section.id);
      if (sectionPendingChanges) {
        Object.assign(effectiveData, sectionPendingChanges);
      }

      rows.push({
        id: section.id,
        type: 'section',
        data: effectiveData,
        level: 0,
        isEditable: selectedLevel === 'section',
        sectionId: section.id
      });

      if (expandedSections.has(section.id)) {
        const sectionTactiques = tactiques[section.id] || [];
        
        sectionTactiques.forEach(tactique => {
          // Appliquer la même logique pour les tactiques
          const effectiveTactiqueData = { ...tactique };
          
          const tactiqueSavedChanges = savedChanges.get(tactique.id);
          if (tactiqueSavedChanges) {
            Object.assign(effectiveTactiqueData, tactiqueSavedChanges);
          }
          
          const tactiquePendingChanges = pendingChanges.get(tactique.id);
          if (tactiquePendingChanges) {
            Object.assign(effectiveTactiqueData, tactiquePendingChanges);
          }

          rows.push({
            id: tactique.id,
            type: 'tactique',
            data: effectiveTactiqueData,
            level: 1,
            isEditable: selectedLevel === 'tactique',
            parentId: section.id,
            sectionId: section.id,
            tactiqueId: tactique.id
          });

          const tactiquePlacements = placements[tactique.id] || [];
          
          tactiquePlacements.forEach(placement => {
            // Appliquer la même logique pour les placements
            const effectivePlacementData = { ...placement };
            
            const placementSavedChanges = savedChanges.get(placement.id);
            if (placementSavedChanges) {
              Object.assign(effectivePlacementData, placementSavedChanges);
            }
            
            const placementPendingChanges = pendingChanges.get(placement.id);
            if (placementPendingChanges) {
              Object.assign(effectivePlacementData, placementPendingChanges);
            }

            rows.push({
              id: placement.id,
              type: 'placement',
              data: effectivePlacementData,
              level: 2,
              isEditable: selectedLevel === 'placement',
              parentId: tactique.id,
              sectionId: section.id,
              tactiqueId: tactique.id,
              placementId: placement.id
            });

            const placementCreatifs = creatifs[placement.id] || [];
            
            placementCreatifs.forEach(creatif => {
              // Appliquer la même logique pour les créatifs
              const effectiveCreatifData = { ...creatif };
              
              const creatifSavedChanges = savedChanges.get(creatif.id);
              if (creatifSavedChanges) {
                Object.assign(effectiveCreatifData, creatifSavedChanges);
              }
              
              const creatifPendingChanges = pendingChanges.get(creatif.id);
              if (creatifPendingChanges) {
                Object.assign(effectiveCreatifData, creatifPendingChanges);
              }

              rows.push({
                id: creatif.id,
                type: 'creatif',
                data: effectiveCreatifData,
                level: 3,
                isEditable: selectedLevel === 'creatif',
                parentId: placement.id,
                sectionId: section.id,
                tactiqueId: tactique.id,
                placementId: creatif.id
              });
            });
          });
        });
      }
    });

    return rows;
  }, [sections, tactiques, placements, creatifs, selectedLevel, expandedSections, pendingChanges, savedChanges]);

  // NOUVEAU : Effet pour nettoyer les savedChanges quand les données sont synchronisées
  useEffect(() => {
    setSavedChanges(prev => {
      const newSavedChanges = new Map(prev);
      let hasChanges = false;

      // Vérifier les sections
      sections.forEach(section => {
        const savedData = newSavedChanges.get(section.id);
        if (savedData) {
          // Vérifier si les données de la section incluent maintenant les changements sauvegardés
          const isInSync = Object.keys(savedData).every(key => {
            return section[key as keyof Section] === savedData[key];
          });

          if (isInSync) {
            console.log(`✅ Section ${section.id} synchronisée, suppression des savedChanges`);
            newSavedChanges.delete(section.id);
            hasChanges = true;
          }
        }
      });

      // Faire de même pour les autres entités...
      Object.values(tactiques).flat().forEach(tactique => {
        const savedData = newSavedChanges.get(tactique.id);
        if (savedData) {
          const isInSync = Object.keys(savedData).every(key => {
            return tactique[key as keyof Tactique] === savedData[key];
          });

          if (isInSync) {
            console.log(`✅ Tactique ${tactique.id} synchronisée, suppression des savedChanges`);
            newSavedChanges.delete(tactique.id);
            hasChanges = true;
          }
        }
      });

      Object.values(placements).flat().forEach(placement => {
        const savedData = newSavedChanges.get(placement.id);
        if (savedData) {
          const isInSync = Object.keys(savedData).every(key => {
            return placement[key as keyof Placement] === savedData[key];
          });

          if (isInSync) {
            console.log(`✅ Placement ${placement.id} synchronisé, suppression des savedChanges`);
            newSavedChanges.delete(placement.id);
            hasChanges = true;
          }
        }
      });

      Object.values(creatifs).flat().forEach(creatif => {
        const savedData = newSavedChanges.get(creatif.id);
        if (savedData) {
          const isInSync = Object.keys(savedData).every(key => {
            return creatif[key as keyof Creatif] === savedData[key];
          });

          if (isInSync) {
            console.log(`✅ Créatif ${creatif.id} synchronisé, suppression des savedChanges`);
            newSavedChanges.delete(creatif.id);
            hasChanges = true;
          }
        }
      });

      return hasChanges ? newSavedChanges : prev;
    });
  }, [sections, tactiques, placements, creatifs]);

  const hasUnsavedChanges = pendingChanges.size > 0;

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
    const fromRow = tableRows.find(row => row.id === fromRowId);
    if (!fromRow) return;

    const sourceValue = getEffectiveValue(fromRowId, fieldKey, fromRow.data);
    bulkEdit(fieldKey, sourceValue, toRowIds);
  }, [tableRows, getEffectiveValue, bulkEdit]);

  const copyValues = useCallback((fromRowId: string, toRowIds: string[]) => {
    const fromRow = tableRows.find(row => row.id === fromRowId);
    if (!fromRow) return;

    const sourceData = fromRow.data as any;
    const sourcePendingChanges = pendingChanges.get(fromRowId) || {};
    const sourceSavedChanges = savedChanges.get(fromRowId) || {};
    
    // Combiner toutes les sources de données
    const allSourceValues = { ...sourceData, ...sourceSavedChanges, ...sourcePendingChanges };

    const systemFields = ['id', 'createdAt', 'updatedAt', 'TC_SectionId', 'PL_TactiqueId', 'CR_PlacementId'];
    
    setPendingChanges(prev => {
      const newChanges = new Map(prev);
      
      toRowIds.forEach(toRowId => {
        const targetRow = tableRows.find(row => row.id === toRowId);
        if (!targetRow || targetRow.type !== fromRow.type) return; 
        
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
  }, [tableRows, pendingChanges, savedChanges]);

  /**
   * MODIFIÉ : Sauvegarde avec maintien des changements dans savedChanges
   */
  const saveAllChanges = useCallback(async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    
    // Déclarer pendingChangesArray au niveau supérieur pour l'accessibilité dans le catch
    const pendingChangesArray: [string, Partial<any>][] = Array.from(pendingChanges.entries());
    
    try {
      const updatePromises: Promise<void>[] = [];

      // Copier les modifications en attente vers savedChanges AVANT la sauvegarde
      setSavedChanges(prev => {
        const newSavedChanges = new Map(prev);
        
        pendingChangesArray.forEach(([entityId, changes]: [string, Partial<any>]) => {
          const existing = newSavedChanges.get(entityId) || {};
          newSavedChanges.set(entityId, { ...existing, ...changes });
        });
        
        return newSavedChanges;
      });

      console.log(`🔄 Démarrage sauvegarde de ${pendingChangesArray.length} entité(s)`);

      for (const [entityId, changes] of pendingChangesArray) {
        const row = tableRows.find(r => r.id === entityId);
        if (!row) continue;

        switch (row.type) {
          case 'section':
            console.log(`📝 Sauvegarde section ${entityId}:`, changes);
            console.log("FIREBASE: ÉCRITURE - Fichier: useAdvancedTableData.ts - Fonction: saveAllChanges - Path: sections/${entityId}");
            updatePromises.push(onUpdateSection(entityId, changes));
            break;
          case 'tactique':
            if (row.sectionId) {
              console.log(`📝 Sauvegarde tactique ${entityId}:`, changes);
              console.log("FIREBASE: ÉCRITURE - Fichier: useAdvancedTableData.ts - Fonction: saveAllChanges - Path: sections/${row.sectionId}/tactiques/${entityId}");
              updatePromises.push(onUpdateTactique(row.sectionId, entityId, changes));
            }
            break;
          case 'placement':
            console.log(`📝 Sauvegarde placement ${entityId}:`, changes);
            console.log("FIREBASE: ÉCRITURE - Fichier: useAdvancedTableData.ts - Fonction: saveAllChanges - Path: placements/${entityId}");
            updatePromises.push(onUpdatePlacement(entityId, changes));
            break;
          case 'creatif':
            if (row.sectionId && row.tactiqueId && row.placementId) {
              console.log(`📝 Sauvegarde créatif ${entityId}:`, changes);
              console.log("FIREBASE: ÉCRITURE - Fichier: useAdvancedTableData.ts - Fonction: saveAllChanges - Path: sections/${row.sectionId}/tactiques/${row.tactiqueId}/placements/${row.placementId}/creatifs/${entityId}");
              updatePromises.push(onUpdateCreatif(row.sectionId, row.tactiqueId, row.placementId, entityId, changes));
            }
            break;
        }
      }

      await Promise.all(updatePromises);

      console.log(`✅ Sauvegarde terminée, vidage des pendingChanges`);
      
      // Vider seulement les modifications en attente, garder savedChanges jusqu'à synchronisation
      setPendingChanges(new Map());
      setEditingCells(new Set());
      setSelectedRows(new Set());

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      
      // En cas d'erreur, retirer les changements de savedChanges
      setSavedChanges(prev => {
        const newSavedChanges = new Map(prev);
        pendingChangesArray.forEach(([entityId]: [string, Partial<any>]) => {
          newSavedChanges.delete(entityId);
        });
        return newSavedChanges;
      });
      
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, tableRows, onUpdateSection, onUpdateTactique, onUpdatePlacement, onUpdateCreatif]);

  /**
   * MODIFIÉ : Annulation avec nettoyage des savedChanges
   */
  const cancelAllChanges = useCallback(() => {
    setPendingChanges(new Map());
    setEditingCells(new Set());
    setSelectedRows(new Set());
    
    // Optionnel : conserver savedChanges car elles représentent des données déjà sauvegardées
    // setSavedChanges(new Map()); // Décommenter si on veut aussi annuler les changements sauvegardés
  }, []);

  useEffect(() => {
    setExpandedSections(prev => {
      const currentSectionIds = new Set(sections.map(s => s.id));
      const newExpanded = new Set<string>();
      
      prev.forEach(sectionId => {
        if (currentSectionIds.has(sectionId)) {
          newExpanded.add(sectionId);
        }
      });
      
      sections.forEach(section => {
        if (!prev.has(section.id)) {
          newExpanded.add(section.id);
        }
      });
      
      return newExpanded;
    });
  }, [sections]);

  useEffect(() => {
    setPendingChanges(new Map());
    setEditingCells(new Set());
    setSelectedRows(new Set());
    // Note: On ne vide pas savedChanges lors du changement de niveau
  }, [selectedLevel]);

  return {
    tableRows,
    entityCounts,
    selectedLevel,
    pendingChanges,
    editingCells,
    selectedRows,
    expandedSections,
    setSelectedLevel,
    updateCell,
    startEdit,
    endEdit,
    selectRow,
    selectMultipleRows,
    clearSelection,
    toggleSectionExpansion,
    expandAllSections,
    collapseAllSections,
    bulkEdit,
    fillDown,
    copyValues,
    saveAllChanges,
    cancelAllChanges,
    isSaving,
    hasUnsavedChanges
  };
}