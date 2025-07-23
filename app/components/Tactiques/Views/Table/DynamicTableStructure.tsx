/**
 * Ce composant affiche une table dynamique pour visualiser et éditer les données liées aux sections, tactiques, placements et créatifs.
 * Il gère le tri, le filtrage, la recherche, l'édition de cellules, la sélection multiple et les opérations de copier-coller.
 * Il intègre également une barre d'outils pour naviguer entre les niveaux de données et affiner l'affichage.
 */
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { ChevronRightIcon, ChevronDownIcon, QuestionMarkCircleIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { TableRow, DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';
import {
  getColumnsWithHierarchy,
  formatColumnValue,
  getTactiqueSubCategories,
  TactiqueSubCategory
} from './tableColumns.config';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface CopyOperation {
  sourceRowId: string;
  sourceField: string;
  sourceValue: any;
  targetRowIds: string[];
}

interface DynamicTableStructureProps {
  tableRows: TableRow[];
  selectedLevel: TableLevel;
  pendingChanges: Map<string, Partial<any>>;
  editingCells: Set<string>;
  expandedSections: Set<string>;
  onCellChange: (entityId: string, fieldKey: string, value: any) => void;
  onStartEdit: (cellKey: string) => void;
  onEndEdit: (cellKey: string) => void;
  onToggleSection: (sectionId: string) => void;
  onLevelChange: (level: TableLevel) => void;
  entityCounts: {
    sections: number;
    tactiques: number;
    placements: number;
    creatifs: number;
  };
}

/**
 * Composant principal pour la structure de la table dynamique.
 *
 * @param {DynamicTableStructureProps} props Les propriétés du composant.
 * @returns {JSX.Element} Le JSX pour la table dynamique.
 */
export default function DynamicTableStructure({
  tableRows,
  selectedLevel,
  pendingChanges,
  editingCells,
  expandedSections,
  onCellChange,
  onStartEdit,
  onEndEdit,
  onToggleSection,
  onLevelChange,
  entityCounts
}: DynamicTableStructureProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hideChildrenLevels, setHideChildrenLevels] = useState(false);
  const [selectedTactiqueSubCategory, setSelectedTactiqueSubCategory] = useState<TactiqueSubCategory>('info');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [copyMode, setCopyMode] = useState<{ active: boolean; sourceCell?: string; sourceValue?: any }>({ active: false });
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  /**
   * Calcule les colonnes à afficher en fonction du niveau sélectionné et de la sous-catégorie de tactique.
   *
   * @returns {DynamicColumn[]} Un tableau d'objets DynamicColumn.
   */
  const columns = useMemo(() => {
    return getColumnsWithHierarchy(selectedLevel, selectedLevel === 'tactique' ? selectedTactiqueSubCategory : undefined);
  }, [selectedLevel, selectedTactiqueSubCategory]);

  /**
   * Traite les lignes du tableau en appliquant les filtres (masquer les niveaux inférieurs, recherche) et le tri.
   *
   * @returns {TableRow[]} Un tableau de lignes de table filtrées et triées.
   */
  const processedRows = useMemo(() => {
    let filtered = tableRows;

    if (hideChildrenLevels) {
      filtered = tableRows.filter(row => row.type === selectedLevel);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(row => {
        const data = row.data as any;

        const searchFields = [];

        switch (row.type) {
          case 'section':
            searchFields.push(data.SECTION_Name);
            break;
          case 'tactique':
            searchFields.push(data.TC_Label, data.TC_Publisher, data.TC_Media_Type);
            break;
          case 'placement':
            searchFields.push(data.PL_Label, data.TAX_Product, data.TAX_Location);
            break;
          case 'creatif':
            searchFields.push(data.CR_Label, data.CR_CTA, data.CR_Offer);
            break;
        }

        return searchFields.some(field =>
          field && String(field).toLowerCase().includes(searchLower)
        );
      });
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === '_hierarchy') {
          aValue = getHierarchyLabel(a);
          bValue = getHierarchyLabel(b);
        } else {
          aValue = (a.data as any)[sortConfig.key];
          bValue = (b.data as any)[sortConfig.key];
        }

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr, 'fr');
        } else {
          return bStr.localeCompare(aStr, 'fr');
        }
      });
    }

    return filtered;
  }, [tableRows, searchTerm, sortConfig, hideChildrenLevels, selectedLevel]);

  /**
   * Récupère le libellé de hiérarchie pour une ligne donnée.
   *
   * @param {TableRow} row La ligne pour laquelle récupérer le libellé.
   * @returns {string} Le libellé de hiérarchie.
   */
  const getHierarchyLabel = (row: TableRow): string => {
    const data = row.data as any;

    switch (row.type) {
      case 'section':
        return data.SECTION_Name || 'Section sans nom';
      case 'tactique':
        return data.TC_Label || 'Tactique sans nom';
      case 'placement':
        return data.PL_Label || 'Placement sans nom';
      case 'creatif':
        return data.CR_Label || 'Créatif sans nom';
      default:
        return 'Élément sans nom';
    }
  };

  /**
   * Récupère la valeur d'une cellule, en tenant compte des modifications en attente.
   *
   * @param {TableRow} row La ligne de la cellule.
   * @param {string} columnKey La clé de la colonne.
   * @returns {any} La valeur de la cellule.
   */
  const getCellValue = (row: TableRow, columnKey: string): any => {
    const pendingChange = pendingChanges.get(row.id);
    if (pendingChange && pendingChange[columnKey] !== undefined) {
      return pendingChange[columnKey];
    }
    return (row.data as any)[columnKey];
  };

  /**
   * Génère les classes CSS pour une ligne du tableau en fonction de son état (éditable, sélectionnée, modifications en attente).
   *
   * @param {TableRow} row La ligne pour laquelle générer les styles.
   * @returns {string} Les classes CSS à appliquer.
   */
  const getRowStyles = (row: TableRow): string => {
    let classes = 'hover:bg-gray-50 transition-colors';

    if (row.isEditable) {
      classes += ' bg-white';
    } else {
      classes += ' bg-gray-50 text-gray-500';
    }

    if (selectedRows.has(row.id)) {
      classes += ' bg-indigo-50 border-l-4 border-indigo-500';
    } else if (pendingChanges.has(row.id)) {
      classes += ' border-l-4 border-orange-400';
    }

    return classes;
  };

  /**
   * Gère le changement d'état d'une case à cocher pour la sélection des lignes.
   * Prend en charge les sélections multiples avec Ctrl/Cmd+clic et Shift+clic.
   *
   * @param {string} rowId L'ID de la ligne associée à la case à cocher.
   * @param {React.ChangeEvent<HTMLInputElement>} event L'événement de changement.
   */
  const handleCheckboxChange = (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    const nativeEvent = event.nativeEvent as MouseEvent;

    setSelectedRows(prev => {
      const newSelection = new Set(prev);

      if (nativeEvent.ctrlKey || nativeEvent.metaKey) {
        if (isChecked) {
          newSelection.add(rowId);
        } else {
          newSelection.delete(rowId);
        }
      } else if (nativeEvent.shiftKey && prev.size > 0) {
        const lastSelected = Array.from(prev)[prev.size - 1];
        const currentIndex = processedRows.findIndex(row => row.id === rowId);
        const lastIndex = processedRows.findIndex(row => row.id === lastSelected);

        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);

          for (let i = start; i <= end; i++) {
            if (processedRows[i].isEditable) {
              newSelection.add(processedRows[i].id);
            }
          }
        }
      } else {
        if (isChecked) {
          newSelection.add(rowId);
        } else {
          newSelection.delete(rowId);
        }
      }

      return newSelection;
    });
  };

  /**
   * Gère la sélection ou la désélection de toutes les lignes éditables.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event L'événement de changement.
   */
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      const editableRowIds = processedRows
        .filter(row => row.isEditable)
        .map(row => row.id);
      setSelectedRows(new Set(editableRowIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  /**
   * Efface la sélection de toutes les lignes et désactive le mode copie.
   */
  const clearSelection = () => {
    setSelectedRows(new Set());
    setCopyMode({ active: false });
  };

  const editableRows = processedRows.filter(row => row.isEditable);
  const selectedEditableRows = editableRows.filter(row => selectedRows.has(row.id));
  const isSelectAllChecked = editableRows.length > 0 && selectedEditableRows.length === editableRows.length;
  const isSelectAllIndeterminate = selectedEditableRows.length > 0 && selectedEditableRows.length < editableRows.length;

  /**
   * Active le mode copie avec la valeur de la cellule source.
   *
   * @param {string} sourceRowId L'ID de la ligne source.
   * @param {string} fieldKey La clé du champ source.
   */
  const handleStartCopy = (sourceRowId: string, fieldKey: string) => {
    const sourceValue = getCellValue(processedRows.find(r => r.id === sourceRowId)!, fieldKey);
    setCopyMode({
      active: true,
      sourceCell: `${sourceRowId}_${fieldKey}`,
      sourceValue
    });
  };

  /**
   * Colle la valeur copiée dans toutes les cellules des lignes sélectionnées pour la colonne donnée.
   *
   * @param {string} fieldKey La clé du champ où coller la valeur.
   */
  const handlePasteCopy = (fieldKey: string) => {
    if (!copyMode.active || selectedRows.size === 0) return;

    const targetRows = Array.from(selectedRows);
    targetRows.forEach(rowId => {
      if (rowId !== copyMode.sourceCell?.split('_')[0]) {
        onCellChange(rowId, fieldKey, copyMode.sourceValue);
      }
    });

    setCopyMode({ active: false });
  };

  /**
   * Annule le mode copie.
   */
  const cancelCopy = () => {
    setCopyMode({ active: false });
  };

  /**
   * Gère le tri des colonnes.
   *
   * @param {string} columnKey La clé de la colonne sur laquelle trier.
   */
  const handleSort = (columnKey: string) => {
    setSortConfig(prev => {
      if (prev?.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        return {
          key: columnKey,
          direction: 'asc'
        };
      }
    });
  };

  /**
   * Gère le changement de niveau de la table.
   * Réinitialise la sous-catégorie de tactique si le niveau n'est plus 'tactique'.
   *
   * @param {TableLevel} level Le nouveau niveau de la table.
   */
  const handleLevelChange = useCallback((level: TableLevel) => {
    onLevelChange(level);
    if (level !== 'tactique') {
      setSelectedTactiqueSubCategory('info');
    }
  }, [onLevelChange]);

  /**
   * Gère le changement de sous-catégorie pour les tactiques.
   *
   * @param {TactiqueSubCategory} subCategory La nouvelle sous-catégorie de tactique.
   */
  const handleTactiqueSubCategoryChange = useCallback((subCategory: TactiqueSubCategory) => {
    setSelectedTactiqueSubCategory(subCategory);
  }, []);

  /**
   * Rend la cellule de hiérarchie pour une ligne donnée.
   * Inclut l'icône d'expansion pour les sections et l'indicateur de modifications.
   *
   * @param {TableRow} row La ligne à rendre.
   * @returns {JSX.Element} Le JSX pour la cellule de hiérarchie.
   */
  const renderHierarchyCell = (row: TableRow) => {
    const label = getHierarchyLabel(row);
    const hasChanges = pendingChanges.has(row.id);

    return (
      <div className="flex items-center space-x-2" style={{ paddingLeft: `${row.level * 20}px` }}>
        {row.type === 'section' && (
          <button
            onClick={() => onToggleSection(row.id)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {expandedSections.has(row.id) ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
        )}

        <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeStyles(row.type)}`}>
          {getTypeLabel(row.type)}
        </span>

        <span className={`font-medium ${hasChanges ? 'text-orange-700' : 'text-gray-900'}`}>
          {label}
          {hasChanges && <span className="ml-1 text-orange-500">●</span>}
        </span>
      </div>
    );
  };

  /**
   * Récupère les styles CSS en fonction du type de niveau (section, tactique, etc.).
   *
   * @param {TableLevel} type Le type de niveau.
   * @returns {string} Les classes CSS.
   */
  const getTypeStyles = (type: TableLevel): string => {
    switch (type) {
      case 'section': return 'bg-blue-100 text-blue-800';
      case 'tactique': return 'bg-green-100 text-green-800';
      case 'placement': return 'bg-purple-100 text-purple-800';
      case 'creatif': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Récupère le libellé abrégé pour un type de niveau.
   *
   * @param {TableLevel} type Le type de niveau.
   * @returns {string} Le libellé abrégé.
   */
  const getTypeLabel = (type: TableLevel): string => {
    switch (type) {
      case 'section': return 'SEC';
      case 'tactique': return 'TAC';
      case 'placement': return 'PLA';
      case 'creatif': return 'CRE';
      default: return 'UNK';
    }
  };

  /**
   * Rend la cellule de données pour une ligne et une colonne données.
   * Gère les modes d'affichage (lecture seule, édition), le formatage des valeurs et les boutons de copie.
   *
   * @param {TableRow} row La ligne de la cellule.
   * @param {DynamicColumn} column La colonne de la cellule.
   * @returns {JSX.Element} Le JSX pour la cellule de données.
   */
  const renderDataCell = (row: TableRow, column: DynamicColumn) => {
    const cellKey = `${row.id}_${column.key}`;
    const value = getCellValue(row, column.key);
    const isEditing = editingCells.has(cellKey);
    const isHovered = hoveredCell === cellKey;
    const isCopySource = copyMode.sourceCell === cellKey;

    if (column.type === 'readonly' || !row.isEditable) {
      const formattedValue = formatColumnValue(
        selectedLevel,
        column.key,
        value,
        selectedLevel === 'tactique' ? selectedTactiqueSubCategory : undefined
      );
      return (
        <span className={!row.isEditable ? 'text-gray-400' : 'text-gray-900'}>
          {formattedValue || '-'}
        </span>
      );
    }

    return (
      <div
        className="min-h-[24px] flex items-center relative group"
        onMouseEnter={() => setHoveredCell(cellKey)}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {isEditing ? (
          <>
            {column.type === 'select' ? (
              <select
                value={value || ''}
                onChange={(e) => onCellChange(row.id, column.key, e.target.value)}
                onBlur={() => onEndEdit(cellKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    onEndEdit(cellKey);
                  }
                  if (e.key === 'Escape') {
                    onEndEdit(cellKey);
                  }
                }}
                className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              >
                <option value="">-- Sélectionner --</option>
                {column.options?.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={column.type === 'number' || column.type === 'currency' ? 'number' :
                  column.type === 'date' ? 'date' : 'text'}
                value={value || ''}
                onChange={(e) => onCellChange(row.id, column.key, e.target.value)}
                onBlur={() => onEndEdit(cellKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    onEndEdit(cellKey);
                  }
                  if (e.key === 'Escape') {
                    onEndEdit(cellKey);
                  }
                }}
                className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => onStartEdit(cellKey)}
              className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded min-h-[20px] flex items-center transition-colors ${
                isCopySource ? 'bg-green-100 border border-green-300' : ''
              }`}
            >
              {formatColumnValue(
                selectedLevel,
                column.key,
                value,
                selectedLevel === 'tactique' ? selectedTactiqueSubCategory : undefined
              ) || (
                <span className="text-gray-400 italic">Cliquer pour modifier</span>
              )}
            </button>

            {isHovered && value && (
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 bg-white border border-gray-200 rounded px-1 shadow-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCopy(row.id, column.key);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-xs p-1"
                  title="Copier cette valeur"
                >
                  📋
                </button>

                {copyMode.active && selectedRows.size > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePasteCopy(column.key);
                    }}
                    className="text-green-600 hover:text-green-800 text-xs p-1"
                    title={`Coller vers ${selectedRows.size} ligne${selectedRows.size > 1 ? 's' : ''}`}
                  >
                    📥
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex space-x-1">
          {(['section', 'tactique', 'placement', 'creatif'] as TableLevel[]).map(level => (
            <div key={level} className="relative">
              <button
                onClick={() => handleLevelChange(level)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedLevel === level
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="capitalize">{level}s</span>
                <span className="ml-1.5 text-xs bg-white px-1.5 py-0.5 rounded">
                  {entityCounts[level + 's' as keyof typeof entityCounts]}
                </span>
              </button>
            </div>
          ))}
        </div>

        {selectedLevel === 'tactique' && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded">
            {getTactiqueSubCategories().map(subCategory => (
              <button
                key={subCategory.id}
                onClick={() => handleTactiqueSubCategoryChange(subCategory.id)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedTactiqueSubCategory === subCategory.id
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
              >
                {subCategory.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder={`Rechercher dans les ${selectedLevel}s...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setHideChildrenLevels(!hideChildrenLevels)}
            className={`p-1.5 rounded transition-colors ${
              hideChildrenLevels
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Masquer les niveaux inférieurs"
          >
            <EyeSlashIcon className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              onMouseEnter={() => setShowHelpTooltip(true)}
              onMouseLeave={() => setShowHelpTooltip(false)}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <QuestionMarkCircleIcon className="h-4 w-4" />
            </button>

            {showHelpTooltip && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50">
                <div className="space-y-2">
                  <div><strong>Sélection :</strong> Cases à cocher • Ctrl+Clic = ajout • Shift+Clic = plage</div>
                  <div><strong>Copie :</strong> Survolez cellule → 📋 copier → survolez autre cellule → 📥 coller</div>
                  <div><strong>Édition :</strong> Clic sur cellule pour éditer • Enter/Tab = sauver • Esc = annuler</div>
                  {selectedLevel === 'tactique' && (
                    <div><strong>Tactiques :</strong> Utilisez les onglets Info/Stratégie/Budget/Admin pour voir les colonnes</div>
                  )}
                </div>
                <div className="absolute top-0 right-4 transform -translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </div>

          <span className="text-sm text-gray-500 whitespace-nowrap">
            {processedRows.length} ligne{processedRows.length > 1 ? 's' : ''}
            {searchTerm && ` (filtré${processedRows.length > 1 ? 's' : ''})`}
            {selectedRows.size > 0 && (
              <span className="text-indigo-600 font-medium ml-2">
                • {selectedRows.size} sélectionnée{selectedRows.size > 1 ? 's' : ''}
              </span>
            )}
          </span>

          {sortConfig && (
            <button
              onClick={() => setSortConfig(null)}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
            >
              Effacer tri
            </button>
          )}
        </div>
      </div>

      {(selectedRows.size > 0 || copyMode.active) && (
        <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm">
              {selectedRows.size > 0 && (
                <span className="text-indigo-700">
                  <strong>{selectedRows.size}</strong> sélectionnée{selectedRows.size > 1 ? 's' : ''}
                </span>
              )}

              {copyMode.active && (
                <span className="text-green-700">
                  📋 Mode copie • <strong>"{copyMode.sourceValue}"</strong>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {selectedRows.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-white"
                >
                  Désélectionner
                </button>
              )}

              {copyMode.active && (
                <button
                  onClick={cancelCopy}
                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-white"
                >
                  Annuler copie
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">
        <div
          className="overflow-auto"
          style={{
            maxHeight: '75vh',
            width: '100%',
            maxWidth: 'calc(100vw - 220px)',
          }}
        >
          <table className="divide-y divide-gray-200" style={{ width: 'max-content', minWidth: '100%' }}>
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left whitespace-nowrap" style={{ width: 50, minWidth: 50 }}>
                  <input
                    type="checkbox"
                    checked={isSelectAllChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = isSelectAllIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    title="Sélectionner tout"
                  />
                </th>

                {columns.map(column => (
                  <th
                    key={column.key}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    style={{ width: column.width || 150, minWidth: column.width || 150 }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {sortConfig?.key === column.key && (
                        <span className="text-indigo-600 font-bold">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {processedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-gray-500">
                    {searchTerm ? 'Aucun résultat trouvé' : 'Aucune donnée à afficher'}
                  </td>
                </tr>
              ) : (
                processedRows.map(row => (
                  <tr
                    key={row.id}
                    className={getRowStyles(row)}
                  >
                    <td className="px-3 py-2 text-sm whitespace-nowrap" style={{ width: 50, minWidth: 50 }}>
                      {row.isEditable && (
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={(e) => handleCheckboxChange(row.id, e)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      )}
                    </td>

                    {columns.map(column => (
                      <td
                        key={column.key}
                        className="px-3 py-2 text-sm whitespace-nowrap"
                        style={{ width: column.width || 150, minWidth: column.width || 150 }}
                      >
                        {column.key === '_hierarchy'
                          ? renderHierarchyCell(row)
                          : renderDataCell(row, column)
                        }
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}