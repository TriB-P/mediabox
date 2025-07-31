// app/components/Tactiques/Views/Table/DynamicTableStructure.tsx

/**
 * Version mise à jour avec les composants budget réactifs
 * Utilise les nouveaux helpers de calculs et composants spécialisés
 */
'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { ChevronRightIcon, ChevronDownIcon, QuestionMarkCircleIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { TableRow, DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';
import {
  getColumnsWithHierarchy,
  getTactiqueSubCategories,
  TactiqueSubCategory
} from './tableColumns.config';
import {
  createBudgetColumnsComplete,
  isFeeCompositeColumn,
  FeeColumnDefinition
} from './budgetColumns.config';
import {
  enrichColumnsWithData,
  processTableRows,
  getHierarchyLabel,
  getRowStyles,
  getTypeStyles,
  getTypeLabel,
  handleSort as handleSortFromHelper,
  formatDisplayValue
} from './DynamicTableHelpers';
import {
  SelectedCell,
  CopiedData,
  ValidationError,
  validateCellValue,
  generateRectangularSelection,
  applyPastedData,
  canCellReceiveValue,
  formatCopiedValueDisplay,
  getColumnOptions,
  cleanupExpiredErrors,
  createValidationError
} from './CellSelectionHelper';

// NOUVEAUX IMPORTS pour les composants réactifs
import ReactiveBudgetCell from './ReactiveBudgetCell';
import ReactiveFeeComposite, { ReactiveFeeCompositeReadonly } from './ReactiveFeeComposite';
import { 
  BudgetRowData, 
  shouldRecalculate 
} from './TableBudgetCalculations';

import { Fee } from '../../../../lib/tactiqueListService';

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
  clientFees: Fee[];
  exchangeRates: { [key: string]: number };
  campaignCurrency: string;
}

type TableColumn = DynamicColumn | FeeColumnDefinition;

// Champs budget qui déclenchent des recalculs
const BUDGET_FIELDS = [
  'TC_BudgetChoice', 'TC_BudgetInput', 'TC_Unit_Price', 'TC_Unit_Type', 
  'TC_BuyCurrency', 'TC_Media_Value'
];

// Champs calculés automatiquement
const CALCULATED_FIELDS = [
  'TC_Unit_Volume', 'TC_Media_Budget', 'TC_Client_Budget', 
  'TC_Bonification', 'TC_Total_Fees'
];

function isBudgetField(fieldKey: string): boolean {
  return BUDGET_FIELDS.includes(fieldKey) || CALCULATED_FIELDS.includes(fieldKey) || 
         fieldKey.includes('Fee_') || shouldRecalculate(fieldKey);
}

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
  dynamicLists,
  clientFees,
  exchangeRates,
  campaignCurrency
}: DynamicTableStructureProps) {
  
  // États existants
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hideChildrenLevels, setHideChildrenLevels] = useState(false);
  const [selectedTactiqueSubCategory, setSelectedTactiqueSubCategory] = useState<TactiqueSubCategory>('info');
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  // États pour sélection avancée
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [selectionStart, setSelectionStart] = useState<SelectedCell | null>(null);
  const [copiedData, setCopiedData] = useState<CopiedData | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const tableRef = useRef<HTMLTableElement>(null);

  /**
   * Colonnes enrichies avec noms dynamiques des frais
   */
  const columns = useMemo(() => {
    let baseColumns: TableColumn[];
    
    if (selectedLevel === 'tactique' && selectedTactiqueSubCategory === 'budget') {
      baseColumns = [
        {
          key: '_hierarchy',
          label: 'Structure',
          type: 'readonly' as const,
          width: 300
        },
        ...createBudgetColumnsComplete(clientFees).map(col => {
          // Élargir les colonnes de frais pour plus d'espace
          if (isFeeCompositeColumn(col)) {
            return { ...col, width: 320 }; // Augmenté de 280 à 320
          }
          return col;
        })
      ];
      
      return baseColumns.map(col => {
        if (isFeeCompositeColumn(col)) {
          return col;
        }
        
        const enrichedCol = enrichColumnsWithData([col as DynamicColumn], buckets, dynamicLists)[0];
        return {
          ...enrichedCol,
          options: enrichedCol.options || getColumnOptions(enrichedCol.key, buckets, dynamicLists)
        };
      });
    } else {
      const hierarchyColumns = getColumnsWithHierarchy(
        selectedLevel, 
        selectedLevel === 'tactique' ? selectedTactiqueSubCategory : undefined
      );
      
      return enrichColumnsWithData(hierarchyColumns, buckets, dynamicLists).map(col => ({
        ...col,
        options: col.options || getColumnOptions(col.key, buckets, dynamicLists)
      }));
    }
  }, [selectedLevel, selectedTactiqueSubCategory, buckets, dynamicLists, clientFees]);

  /**
   * Lignes traitées avec filtrage et tri
   */
  const processedRows = useMemo(() => {
    return processTableRows(tableRows, hideChildrenLevels, selectedLevel, searchTerm, sortConfig, getHierarchyLabel);
  }, [tableRows, hideChildrenLevels, selectedLevel, searchTerm, sortConfig]);

  /**
   * Gestion des événements clavier
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);

      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCells.length > 0) {
        e.preventDefault();
        const firstCell = selectedCells[0];
        const row = processedRows[firstCell.rowIndex];
        const column = columns.find(col => col.key === firstCell.columnKey);
        
        if (row && column && !isFeeCompositeColumn(column)) {
          const value = getCellValue(row, firstCell.columnKey);
          setCopiedData({
            value,
            columnType: column.type,
            options: (column as DynamicColumn).options,
            sourceColumnKey: column.key
          });
          
          const displayValue = column.type === 'select' && (column as DynamicColumn).options ? 
            (column as DynamicColumn).options?.find((option: { id: string; label: string }) => option.id === value)?.label || value : value;
          console.log(`✅ Copié: ${displayValue}`);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedData && selectedCells.length > 0) {
        e.preventDefault();
        handlePaste();
      }

      if (e.key === 'Escape') {
        setSelectedCells([]);
        setSelectionStart(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedCells, copiedData, processedRows, columns, isShiftPressed]);

  /**
   * Nettoyage des erreurs expirées
   */
  useEffect(() => {
    const cleanup = setInterval(() => {
      setValidationErrors(prev => cleanupExpiredErrors(prev));
    }, 1000);
    return () => clearInterval(cleanup);
  }, []);

  /**
   * Récupère la valeur d'une cellule
   */
  const getCellValue = useCallback((row: TableRow, columnKey: string): any => {
    const pendingChange = pendingChanges.get(row.id);
    return (pendingChange && pendingChange[columnKey] !== undefined) 
      ? pendingChange[columnKey] 
      : (row.data as any)[columnKey];
  }, [pendingChanges]);

  /**
   * Vérifie si une cellule a une erreur de validation
   */
  const hasValidationError = useCallback((cellKey: string): boolean => {
    return validationErrors.some(error => error.cellKey === cellKey);
  }, [validationErrors]);

  /**
   * Vérifie si une cellule est sélectionnée
   */
  const isCellSelected = useCallback((rowIndex: number, columnKey: string): boolean => {
    return selectedCells.some(cell => cell.rowIndex === rowIndex && cell.columnKey === columnKey);
  }, [selectedCells]);

  /**
   * Gère la sélection de cellules (1 clic = sélection)
   */
  const handleCellClick = useCallback((rowIndex: number, columnKey: string, event?: React.MouseEvent) => {
    if (event && ['INPUT', 'SELECT', 'BUTTON'].includes((event.target as HTMLElement).tagName)) {
      return;
    }

    const newCell = { rowIndex, columnKey };

    if (isShiftPressed && selectionStart) {
      const rectangularSelection = generateRectangularSelection(
        selectionStart, 
        newCell, 
        columns as DynamicColumn[],
        processedRows
      );
      setSelectedCells(rectangularSelection);
    } else {
      const row = processedRows[rowIndex];
      if (row?.isEditable && canCellReceiveValue(newCell, processedRows, columns as DynamicColumn[])) {
        setSelectedCells([newCell]);
        setSelectionStart(newCell);
      }
    }
  }, [isShiftPressed, selectionStart, columns, processedRows]);

  /**
   * Gère le collage avec validation avancée
   */
  const handlePaste = useCallback(() => {
    if (!copiedData || selectedCells.length === 0) return;

    const dynamicColumns = columns.reduce<DynamicColumn[]>((acc, col) => {
      if (!isFeeCompositeColumn(col)) {
        acc.push(col as DynamicColumn);
      }
      return acc;
    }, []);

    const { applied, errors } = applyPastedData(
      selectedCells,
      copiedData,
      processedRows,
      dynamicColumns,
      (rowId: string, columnKey: string, value: any) => {
        onCellChange(rowId, columnKey, value);
      },
      (cellKey: string, errorMessage: string) => {
        setValidationErrors(prev => [
          ...prev.filter(err => err.cellKey !== cellKey),
          createValidationError(cellKey, errorMessage)
        ]);
      }
    );

    if (errors > 0) {
      console.log(`${applied} cellule(s) mise(s) à jour, ${errors} erreur(s) de validation`);
    }
  }, [copiedData, selectedCells, processedRows, columns, onCellChange]);

  /**
   * NOUVEAU : Gère les changements calculés (utilise le nouveau système)
   */
  const handleCalculatedChange = useCallback((entityId: string, updates: { [key: string]: any }) => {
    console.log('=== handleCalculatedChange ===');
    console.log('EntityId:', entityId);
    console.log('Updates:', updates);
    
    Object.entries(updates).forEach(([fieldKey, value]) => {
      onCellChange(entityId, fieldKey, value);
    });
  }, [onCellChange]);

  /**
   * Gère le changement de niveau
   */
  const handleLevelChange = useCallback((level: TableLevel) => {
    onLevelChange(level);
    if (level !== 'tactique') {
      setSelectedTactiqueSubCategory('info');
    }
    setSelectedCells([]);
    setSelectionStart(null);
  }, [onLevelChange]);

  /**
   * Gère le tri
   */
  const handleSort = useCallback((columnKey: string) => {
    setSortConfig(prev => handleSortFromHelper(columnKey, prev));
  }, []);

  /**
   * Efface la sélection
   */
  const clearSelection = useCallback(() => {
    setSelectedCells([]);
    setSelectionStart(null);
    setCopiedData(null);
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
   * Gère le double-clic pour démarrer l'édition
   */
  const handleCellDoubleClick = useCallback((rowIndex: number, columnKey: string, event?: React.MouseEvent) => {
    if (event && ['INPUT', 'SELECT', 'BUTTON'].includes((event.target as HTMLElement).tagName)) {
      return;
    }

    const row = processedRows[rowIndex];
    if (row?.isEditable && columnKey !== '_hierarchy') {
      const cellKey = `${row.id}_${columnKey}`;
      onStartEdit(cellKey);
    }
  }, [processedRows, onStartEdit]);

  /**
   * NOUVEAU : Rend les cellules avec les composants réactifs
   */
  const renderDataCell = useCallback((row: TableRow, column: TableColumn, rowIndex: number) => {
    const cellKey = `${row.id}_${column.key}`;
    const value = getCellValue(row, column.key);
    const isEditing = editingCells.has(cellKey);  
    const isSelected = isCellSelected(rowIndex, column.key);
    const hasError = hasValidationError(cellKey);
    const isBudgetMode = selectedLevel === 'tactique' && selectedTactiqueSubCategory === 'budget';

    // Si c'est une colonne budget mais pas une ligne tactique, ne rien afficher
    if (isBudgetMode && row.type !== 'tactique' && (isBudgetField(column.key) || isFeeCompositeColumn(column))) {
      return (
        <div 
          className={`min-h-[32px] flex items-center justify-center text-gray-400 text-sm ${
            isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-gray-100'
          }`}
          onClick={() => handleCellClick(rowIndex, column.key)}
        >
          -
        </div>
      );
    }

    // NOUVEAU : Gestion des colonnes de frais composites avec le nouveau composant
    if (isFeeCompositeColumn(column)) {
      const rowDataWithPending: BudgetRowData = {
        ...row.data,
        ...pendingChanges.get(row.id)
      };

      if (!row.isEditable) {
        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleCellClick(rowIndex, column.key, e);
            }}
          >
            <ReactiveFeeCompositeReadonly
              column={column}
              rowData={rowDataWithPending}
              clientFees={clientFees}
              currency={(row.data as any).TC_BuyCurrency || campaignCurrency}
              isSelected={isSelected}
              onClick={() => {}} // Pas besoin de onClick ici
              pendingChanges={pendingChanges.get(row.id) || {}}
            />
          </div>
        );
      }

      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleCellClick(rowIndex, column.key, e);
          }}
        >
          <ReactiveFeeComposite
            entityId={row.id}
            column={column}
            rowData={rowDataWithPending}
            isEditable={row.isEditable}
            clientFees={clientFees}
            currency={(row.data as any).TC_BuyCurrency || campaignCurrency}
            isSelected={isSelected}
            hasValidationError={hasError}
            onChange={onCellChange}
            onCalculatedChange={handleCalculatedChange}
            onClick={() => {}} // Pas besoin de onClick ici
            pendingChanges={pendingChanges.get(row.id) || {}}
          />
        </div>
      );
    }

    // NOUVEAU : Cellules budget avec le nouveau composant réactif
    if (isBudgetMode && isBudgetField(column.key)) {
      const rowDataWithPending: BudgetRowData = {
        ...row.data,
        ...pendingChanges.get(row.id)
      };
      
      return (
        <div 
          className={`relative ${isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleCellClick(rowIndex, column.key, e);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleCellDoubleClick(rowIndex, column.key, e);
          }}
        >
          <ReactiveBudgetCell
            entityId={row.id}
            fieldKey={column.key}
            value={value}
            column={column as DynamicColumn}
            rowData={rowDataWithPending}
            isEditable={row.isEditable}
            isEditing={isEditing}
            clientFees={clientFees}
            campaignCurrency={campaignCurrency}
            onChange={onCellChange}
            onCalculatedChange={handleCalculatedChange}
            onStartEdit={onStartEdit}
            onEndEdit={onEndEdit}
          />
        </div>
      );
    }

    // Cellules readonly normales
    if (column.type === 'readonly' || !row.isEditable) {
      const formattedValue = isBudgetMode ? 
        value : // Pas de formatage spécial pour les valeurs simples
        formatDisplayValue(column.key, value, buckets, dynamicLists, selectedLevel, selectedLevel === 'tactique' ? selectedTactiqueSubCategory : undefined);
      
      return (
        <div 
          className={`min-h-[32px] flex items-center justify-center px-2 py-1 cursor-pointer ${
            isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'hover:bg-gray-50'
          } ${!row.isEditable ? 'text-gray-400' : 'text-gray-900'}`}
          onClick={(e) => {
            e.stopPropagation();
            handleCellClick(rowIndex, column.key, e);
          }}
        >
          <span>{formattedValue || '-'}</span>
        </div>
      );
    }

    // Cellules éditables normales (non-budget)
    return (
      <div
        className={`min-h-[32px] flex items-center relative group cursor-pointer ${
          isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'hover:bg-gray-50'
        } ${hasError ? 'ring-2 ring-red-500 ring-inset bg-red-50 animate-pulse' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          handleCellClick(rowIndex, column.key, e);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleCellDoubleClick(rowIndex, column.key, e);
        }}
      >
        {isEditing ? (
          <>
            {column.type === 'select' ? (
              <select
                value={value || ''}
                onChange={(e) => onCellChange(row.id, column.key, e.target.value)}
                onBlur={() => onEndEdit(cellKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') onEndEdit(cellKey);
                  if (e.key === 'Escape') onEndEdit(cellKey);
                }}
                className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">-- Sélectionner --</option>
                {(column as DynamicColumn).options?.map(option => (
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
                onChange={(e) => {
                  const newValue = column.type === 'number' || column.type === 'currency' ? 
                    (parseFloat(e.target.value) || 0) : e.target.value;
                  onCellChange(row.id, column.key, newValue);
                }}
                onBlur={() => onEndEdit(cellKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') onEndEdit(cellKey);
                  if (e.key === 'Escape') onEndEdit(cellKey);
                }}
                className={`w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  column.type === 'number' || column.type === 'currency' ? 'text-center' : 'text-left'
                }`}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                step="0.01"
                min={column.type === 'number' || column.type === 'currency' ? '0' : undefined}
              />
            )}
          </>
        ) : (
          <div className={`w-full px-2 py-1 text-sm min-h-[20px] flex items-center transition-colors ${
            column.type === 'number' || column.type === 'currency' ? 'justify-center' : 'justify-start'
          }`}>
            {formatDisplayValue(column.key, value, buckets, dynamicLists, selectedLevel, selectedLevel === 'tactique' ? selectedTactiqueSubCategory : undefined) || (
              <span className="text-gray-400 italic">Double-clic pour modifier</span>
            )}
          </div>
        )}

        {hasError && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}
      </div>
    );
  }, [
    getCellValue, editingCells, isCellSelected, hasValidationError, buckets, dynamicLists, 
    selectedLevel, selectedTactiqueSubCategory, onCellChange, onEndEdit, onStartEdit,
    handleCellClick, handleCellDoubleClick, clientFees, campaignCurrency, 
    handleCalculatedChange, pendingChanges
  ]);

  return (
    <div className="space-y-3">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between gap-4">
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
              <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50">
                <div className="space-y-2">
                  <div><strong>Sélection :</strong> 1 clic = sélectionner • Shift+Clic = sélection rectangulaire</div>
                  <div><strong>Édition :</strong> Double-clic pour éditer • Enter/Tab = sauver • Esc = annuler</div>
                  <div><strong>Copie :</strong> Ctrl+C pour copier • Ctrl+V pour coller</div>
                  <div><strong>Validation :</strong> Contour rouge clignotant = valeur incompatible rejetée</div>
                  {selectedLevel === 'tactique' && selectedTactiqueSubCategory === 'budget' && (
                    <>
                      <div><strong>Budget :</strong> Calculs automatiques en temps réel • Limité aux tactiques</div>
                      <div><strong>Frais :</strong> Composants réactifs • Checkbox fonctionnel • Calculs instantanés</div>
                      <div><strong>Totaux :</strong> ✓ = calculé automatiquement • Fond vert = champ calculé</div>
                    </>
                  )}
                </div>
                <div className="absolute top-0 right-4 transform -translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </div>

          <span className="text-sm text-gray-500 whitespace-nowrap">
            {processedRows.length} ligne{processedRows.length > 1 ? 's' : ''}

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

      {/* Barre d'action pour sélection et copie */}
      {(selectedCells.length > 0 || copiedData) && (
        <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm">
              {selectedCells.length > 0 && (
                <span className="text-indigo-700 pl-2">
                  <strong>{selectedCells.length}</strong> cellule{selectedCells.length > 1 ? 's' : ''} sélectionnée{selectedCells.length > 1 ? 's' : ''}
                </span>
              )}

              {copiedData && (
                <span className="text-black-700 pl-3">
                  📋  <strong>"{formatCopiedValueDisplay(copiedData)}"</strong>
                  {copiedData.columnType === 'select' && ' (menu déroulant)'}
                </span>
              )}

              {validationErrors.length > 0 && (
                <span className="text-red-700">
                  ⚠️ {validationErrors.length} erreur{validationErrors.length > 1 ? 's' : ''} de validation
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={clearSelection}
                className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-white"
              >
                Tout effacer
              </button>
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
          <table 
            ref={tableRef}
            className="divide-y divide-gray-200" 
            style={{ width: 'max-content', minWidth: '100%' }}
          >
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {columns.map(column => (
                  <th
                    key={column.key}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    style={{ width: column.width || 150, minWidth: column.width || 150 }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {isFeeCompositeColumn(column) && (
                        <span className="text-blue-600 text-xs" title="Frais composite réactif">
                          🔧
                        </span>
                      )}
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
                  <td colSpan={columns.length} className="px-3 py-6 text-center text-gray-500">
                    {searchTerm ? 'Aucun résultat trouvé' : 'Aucune donnée à afficher'}
                  </td>
                </tr>
              ) : (
                processedRows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className={getRowStyles(row, new Set(), pendingChanges)}
                  >
                    {columns.map(column => (
                      <td
                        key={column.key}
                        className="px-3 py-2 text-sm whitespace-nowrap"
                        style={{ width: column.width || 150, minWidth: column.width || 150 }}
                      >
                        {column.key === '_hierarchy' 
                          ? renderHierarchyCell(row)
                          : renderDataCell(row, column, rowIndex)
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