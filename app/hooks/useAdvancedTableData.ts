/**
 * Ce hook gère la logique complexe d'affichage et de modification des données
 * pour un tableau avancé hiérarchique (Sections > Tactiques > Placements > Créatifs).
 * Il fournit les données transformées pour l'affichage, gère l'état des modifications
 * en attente, les cellules en cours d'édition, les sélections de lignes et l'expansion
 * des sections. Il offre également des fonctions pour la mise à jour unitaire,
 * l'édition en masse, la copie et le remplissage vers le bas des valeurs,
 * ainsi que la sauvegarde et l'annulation des modifications.
 * C'est le cerveau derrière le tableau d'édition de masse.
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

  /**
   * État du niveau de sélection actuel dans le tableau (section, tactique, placement, créatif).
   * @type {TableLevel}
   */
  const [selectedLevel, setSelectedLevel] = useState<TableLevel>('tactique');
  /**
   * Carte des modifications en attente de sauvegarde. La clé est l'ID de l'entité, la valeur est un objet Partiel des champs modifiés.
   * @type {Map<string, Partial<any>>}
   */
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<any>>>(new Map());
  /**
   * Ensemble des clés de cellules actuellement en mode édition. Une clé de cellule est généralement `entityId-fieldKey`.
   * @type {Set<string>}
   */
  const [editingCells, setEditingCells] = useState<Set<string>>(new Set());
  /**
   * Ensemble des IDs de lignes sélectionnées dans le tableau.
   * @type {Set<string>}
   */
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  /**
   * Ensemble des IDs de sections actuellement étendues dans l'affichage hiérarchique.
   * @type {Set<string>}
   */
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map(s => s.id))
  );
  /**
   * Indique si une opération de sauvegarde est en cours.
   * @type {boolean}
   */
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Calcule le nombre d'entités (sections, tactiques, placements, créatifs).
   * @returns {EntityCounts} Un objet contenant le compte de chaque type d'entité.
   */
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
   * Génère la liste aplatie des lignes du tableau à partir des données hiérarchiques (sections, tactiques, placements, créatifs).
   * Inclut les informations de niveau et d'éditabilité basées sur le `selectedLevel` et `expandedSections`.
   * @returns {TableRow[]} Un tableau d'objets TableRow représentant les lignes du tableau.
   */
  const tableRows = useMemo((): TableRow[] => {
    const rows: TableRow[] = [];

    sections.forEach(section => {
      rows.push({
        id: section.id,
        type: 'section',
        data: section,
        level: 0,
        isEditable: selectedLevel === 'section',
        sectionId: section.id
      });

      if (expandedSections.has(section.id)) {
        const sectionTactiques = tactiques[section.id] || [];
        
        sectionTactiques.forEach(tactique => {
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
              rows.push({
                id: creatif.id,
                type: 'creatif',
                data: creatif,
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
  }, [sections, tactiques, placements, creatifs, selectedLevel, expandedSections]);

  /**
   * Indique s'il y a des modifications en attente qui n'ont pas encore été sauvegardées.
   * @type {boolean}
   */
  const hasUnsavedChanges = pendingChanges.size > 0;

  /**
   * Met à jour une valeur de cellule spécifique pour une entité donnée dans les modifications en attente.
   * @param {string} entityId L'ID de l'entité à modifier.
   * @param {string} fieldKey La clé du champ à mettre à jour.
   * @param {any} value La nouvelle valeur du champ.
   */
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

  /**
   * Ajoute une clé de cellule à l'ensemble des cellules en cours d'édition.
   * @param {string} cellKey La clé de la cellule (ex: "entityId-fieldKey").
   */
  const startEdit = useCallback((cellKey: string) => {
    setEditingCells(prev => {
      const newEditingCells = new Set(prev);
      newEditingCells.add(cellKey);
      return newEditingCells;
    });
  }, []);

  /**
   * Supprime une clé de cellule de l'ensemble des cellules en cours d'édition.
   * @param {string} cellKey La clé de la cellule (ex: "entityId-fieldKey").
   */
  const endEdit = useCallback((cellKey: string) => {
    setEditingCells(prev => {
      const newEditingCells = new Set(prev);
      newEditingCells.delete(cellKey);
      return newEditingCells;
    });
  }, []);

  /**
   * Ajoute ou retire une ligne de l'ensemble des lignes sélectionnées.
   * @param {string} rowId L'ID de la ligne à sélectionner/désélectionner.
   * @param {boolean} isSelected Indique si la ligne doit être sélectionnée (true) ou désélectionnée (false).
   */
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

  /**
   * Ajoute ou retire plusieurs lignes de l'ensemble des lignes sélectionnées.
   * @param {string[]} rowIds Un tableau des IDs de lignes à sélectionner/désélectionner.
   * @param {boolean} isSelected Indique si les lignes doivent être sélectionnées (true) ou désélectionnées (false).
   */
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

  /**
   * Désélectionne toutes les lignes actuellement sélectionnées.
   */
  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  /**
   * Bascule l'état d'expansion (étendu/réduit) d'une section donnée.
   * @param {string} sectionId L'ID de la section à basculer.
   */
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

  /**
   * Étend toutes les sections disponibles.
   */
  const expandAllSections = useCallback(() => {
    setExpandedSections(new Set(sections.map(s => s.id)));
  }, [sections]);

  /**
   * Réduit toutes les sections.
   */
  const collapseAllSections = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  /**
   * Applique une modification de champ unique à plusieurs entités sélectionnées.
   * @param {string} fieldKey La clé du champ à modifier.
   * @param {any} value La nouvelle valeur à appliquer.
   * @param {string[]} entityIds Un tableau des IDs des entités à modifier.
   */
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

  /**
   * Remplit une colonne vers le bas avec la valeur d'une ligne source.
   * @param {string} fromRowId L'ID de la ligne source dont la valeur doit être copiée.
   * @param {string} fieldKey La clé du champ à copier.
   * @param {string[]} toRowIds Un tableau des IDs des lignes cibles à mettre à jour.
   */
  const fillDown = useCallback((fromRowId: string, fieldKey: string, toRowIds: string[]) => {
    const fromRow = tableRows.find(row => row.id === fromRowId);
    if (!fromRow) return;

    const pendingChange = pendingChanges.get(fromRowId);
    const sourceValue = pendingChange && pendingChange[fieldKey] !== undefined 
      ? pendingChange[fieldKey] 
      : (fromRow.data as any)[fieldKey];

    bulkEdit(fieldKey, sourceValue, toRowIds);
  }, [tableRows, pendingChanges, bulkEdit]);

  /**
   * Copie toutes les valeurs éditables d'une ligne source vers plusieurs lignes cibles du même type.
   * @param {string} fromRowId L'ID de la ligne source à partir de laquelle copier les valeurs.
   * @param {string[]} toRowIds Un tableau des IDs des lignes cibles vers lesquelles copier les valeurs.
   */
  const copyValues = useCallback((fromRowId: string, toRowIds: string[]) => {
    const fromRow = tableRows.find(row => row.id === fromRowId);
    if (!fromRow) return;

    const sourceData = fromRow.data as any;
    const sourcePendingChanges = pendingChanges.get(fromRowId) || {};
    const allSourceValues = { ...sourceData, ...sourcePendingChanges };

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
  }, [tableRows, pendingChanges]);

  /**
   * Sauvegarde toutes les modifications en attente en appelant les fonctions de mise à jour Firebase correspondantes.
   * Réinitialise les états de modifications, d'édition et de sélection après une sauvegarde réussie.
   * @returns {Promise<void>} Une promesse qui se résout une fois toutes les modifications sauvegardées ou se rejette en cas d'erreur.
   */
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
            console.log("FIREBASE: ÉCRITURE - Fichier: useAdvancedTableData.ts - Fonction: saveAllChanges - Path: sections/${entityId}");
            updatePromises.push(onUpdateSection(entityId, changes));
            break;
          case 'tactique':
            if (row.sectionId) {
              console.log("FIREBASE: ÉCRITURE - Fichier: useAdvancedTableData.ts - Fonction: saveAllChanges - Path: sections/${row.sectionId}/tactiques/${entityId}");
              updatePromises.push(onUpdateTactique(row.sectionId, entityId, changes));
            }
            break;
          case 'placement':
            console.log("FIREBASE: ÉCRITURE - Fichier: useAdvancedTableData.ts - Fonction: saveAllChanges - Path: placements/${entityId}");
            updatePromises.push(onUpdatePlacement(entityId, changes));
            break;
            case 'creatif':
              if (row.sectionId && row.tactiqueId && row.placementId) {
                console.log("FIREBASE: ÉCRITURE - Fichier: useAdvancedTableData.ts - Fonction: saveAllChanges - Path: sections/${row.sectionId}/tactiques/${row.tactiqueId}/placements/${row.placementId}/creatifs/${entityId}");
                updatePromises.push(onUpdateCreatif(row.sectionId, row.tactiqueId, row.placementId, entityId, changes));
              }
              break;
        }
      }

      await Promise.all(updatePromises);

      setPendingChanges(new Map());
      setEditingCells(new Set());
      setSelectedRows(new Set());

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, tableRows, onUpdateSection, onUpdateTactique, onUpdatePlacement, onUpdateCreatif]);

  /**
   * Annule toutes les modifications en attente et réinitialise les états d'édition et de sélection.
   */
  const cancelAllChanges = useCallback(() => {
    setPendingChanges(new Map());
    setEditingCells(new Set());
    setSelectedRows(new Set());
  }, []);

  /**
   * Effet qui met à jour les sections étendues lorsque la liste des sections change.
   * Il assure que les sections existantes restent étendues et que les nouvelles sections sont automatiquement étendues.
   */
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

  /**
   * Effet qui réinitialise les modifications en attente, les cellules en édition et les sélections
   * chaque fois que le niveau de sélection du tableau change.
   */
  useEffect(() => {
    setPendingChanges(new Map());
    setEditingCells(new Set());
    setSelectedRows(new Set());
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