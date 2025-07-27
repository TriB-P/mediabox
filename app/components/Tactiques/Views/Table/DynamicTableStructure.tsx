// app/components/Tactiques/Views/Table/DynamicTableStructure.tsx

/**
 * Version refactorisée du composant table dynamique
 * Utilise les helpers de façon plus simple et pratique
 */
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { ChevronRightIcon, ChevronDownIcon, QuestionMarkCircleIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { TableRow, DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';
import {
  getColumnsWithHierarchy,
  getTactiqueSubCategories,
  TactiqueSubCategory
} from './tableColumns.config';
import {
  enrichColumnsWithData,
  processTableRows,
  getHierarchyLabel,
  getRowStyles,
  getTypeStyles,
  getTypeLabel,
  handleMultipleSelection,
  handleSort as handleSortFromHelper,
  formatDisplayValue
} from './DynamicTableHelpers';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface CampaignBucket {
  id: string;
  name: string;
  description?: string;
  target: number;
  color?: string;
}

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
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
  buckets: CampaignBucket[];
  dynamicLists: { [key: string]: ListItem[] };
}

/**
 * Composant principal refactorisé pour la structure de la table dynamique
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
  entityCounts,
  buckets,
  dynamicLists
}: DynamicTableStructureProps) {
  
  // États locaux
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hideChildrenLevels, setHideChildrenLevels] = useState(false);
  const [selectedTactiqueSubCategory, setSelectedTactiqueSubCategory] = useState<TactiqueSubCategory>('info');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [copyMode, setCopyMode] = useState<{ active: boolean; sourceCell?: string; sourceValue?: any }>({ active: false });
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  /**
   * Calcule les colonnes enrichies avec les données dynamiques
   */
  const columns = useMemo(() => {
    const baseColumns = getColumnsWithHierarchy(selectedLevel, selectedLevel === 'tactique' ? selectedTactiqueSubCategory : undefined);
    return enrichColumnsWithData(baseColumns, buckets, dynamicLists);
  }, [selectedLevel, selectedTactiqueSubCategory, buckets, dynamicLists]);

  /**
   * Traite les lignes avec filtrage et tri
   */
  const processedRows = useMemo(() => {
    return processTableRows(
      tableRows,
      hideChildrenLevels,
      selectedLevel,
      searchTerm,
      sortConfig,
      getHierarchyLabel
    );
  }, [tableRows, hideChildrenLevels, selectedLevel, searchTerm, sortConfig]);

  /**
   * Calcule les statistiques de sélection
   */
  const selectionStats = useMemo(() => {
    const editableRows = processedRows.filter(row => row.isEditable);
    const selectedEditableRows = editableRows.filter(row => selectedRows.has(row.id));
    return {
      editableRows,
      selectedEditableRows,
      isSelectAllChecked: editableRows.length > 0 && selectedEditableRows.length === editableRows.length,
      isSelectAllIndeterminate: selectedEditableRows.length > 0 && selectedEditableRows.length < editableRows.length
    };
  }, [processedRows, selectedRows]);

  /**
   * Récupère la valeur d'une cellule avec les modifications en attente
   */
  const getCellValue = useCallback((row: TableRow, columnKey: string): any => {
    const pendingChange = pendingChanges.get(row.id);
    if (pendingChange && pendingChange[columnKey] !== undefined) {
      return pendingChange[columnKey];
    }
    return (row.data as any)[columnKey];
  }, [pendingChanges]);

  /**
   * Gère le changement de niveau
   */
  const handleLevelChange = useCallback((level: TableLevel) => {
    onLevelChange(level);
    if (level !== 'tactique') {
      setSelectedTactiqueSubCategory('info');
    }
  }, [onLevelChange]);

  /**
   * Gère le tri des colonnes
   */
  const handleSort = useCallback((columnKey: string) => {
    setSortConfig(prev => handleSortFromHelper(columnKey, prev));
  }, []);

  /**
   * Gère la sélection des lignes
   */
  const handleCheckboxChange = useCallback((rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    const nativeEvent = event.nativeEvent as MouseEvent;

    setSelectedRows(prev => handleMultipleSelection(
      rowId,
      isChecked,
      nativeEvent,
      processedRows,
      prev
    ));
  }, [processedRows]);

  /**
   * Gère la sélection globale
   */
  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      const editableRowIds = selectionStats.editableRows.map(row => row.id);
      setSelectedRows(new Set(editableRowIds));
    } else {
      setSelectedRows(new Set());
    }
  }, [selectionStats.editableRows]);

  /**
   * Gère le mode copie
   */
  const handleStartCopy = useCallback((sourceRowId: string, fieldKey: string) => {
    const sourceValue = getCellValue(processedRows.find(r => r.id === sourceRowId)!, fieldKey);
    setCopyMode({
      active: true,
      sourceCell: `${sourceRowId}_${fieldKey}`,
      sourceValue
    });
  }, [getCellValue, processedRows]);

  /**
   * Gère le collage
   */
  const handlePasteCopy = useCallback((fieldKey: string) => {
    if (!copyMode.active || selectedRows.size === 0) return;

    const targetRows = Array.from(selectedRows);
    targetRows.forEach(rowId => {
      if (rowId !== copyMode.sourceCell?.split('_')[0]) {
        onCellChange(rowId, fieldKey, copyMode.sourceValue);
      }
    });

    setCopyMode({ active: false });
  }, [copyMode, selectedRows, onCellChange]);

  /**
   * Efface la sélection
   */
  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
    setCopyMode({ active: false });
  }, []);

  /**
   * Rend la cellule de hiérarchie
   */
  const renderHierarchyCell = useCallback((row: TableRow) => {
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
  }, [pendingChanges, onToggleSection, expandedSections]);

  /**
   * Rend la cellule de données
   */
  const renderDataCell = useCallback((row: TableRow, column: DynamicColumn) => {
    const cellKey = `${row.id}_${column.key}`;
    const value = getCellValue(row, column.key);
    const isEditing = editingCells.has(cellKey);
    const isHovered = hoveredCell === cellKey;
    const isCopySource = copyMode.sourceCell === cellKey;

    if (column.type === 'readonly' || !row.isEditable) {
      const formattedValue = formatDisplayValue(column.key, value, buckets, dynamicLists, selectedLevel, selectedLevel === 'tactique' ? selectedTactiqueSubCategory : undefined);
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
              {formatDisplayValue(column.key, value, buckets, dynamicLists, selectedLevel, selectedLevel === 'tactique' ? selectedTactiqueSubCategory : undefined) || (
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
  }, [getCellValue, editingCells, hoveredCell, copyMode, buckets, dynamicLists, selectedLevel, selectedTactiqueSubCategory, onCellChange, onEndEdit, onStartEdit, selectedRows, handleStartCopy, handlePasteCopy]);

  return (
    <div className="space-y-3">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between gap-4">
        {/* Sélecteurs de niveau */}
        <div className="flex space-x-1">
          {(['section', 'tactique', 'placement', 'creatif'] as TableLevel[]).map(level => (
            <button
              key={level}
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
          ))}
        </div>

        {/* Sous-catégories de tactiques */}
        {selectedLevel === 'tactique' && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded">
            {getTactiqueSubCategories().map(subCategory => (
              <button
                key={subCategory.id}
                onClick={() => setSelectedTactiqueSubCategory(subCategory.id)}
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

        {/* Barre de recherche */}
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder={`Rechercher dans les ${selectedLevel}s...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Contrôles */}
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

      {/* Barre d'action pour sélection/copie */}
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
                  onClick={() => setCopyMode({ active: false })}
                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-white"
                >
                  Annuler copie
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tableau */}
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
                    checked={selectionStats.isSelectAllChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = selectionStats.isSelectAllIndeterminate;
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
                    className={getRowStyles(row, selectedRows, pendingChanges)}
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