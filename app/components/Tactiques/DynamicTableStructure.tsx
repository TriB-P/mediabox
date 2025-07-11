// app/components/Tactiques/DynamicTableStructure.tsx

'use client';

import React, { useMemo, useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { TableRow, DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';
import { getColumnsWithHierarchy, formatColumnValue } from './tableColumns.config';

// ==================== TYPES ====================

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface DynamicTableStructureProps {
  tableRows: TableRow[];
  selectedLevel: TableLevel;
  pendingChanges: Map<string, Partial<any>>;
  editingCells: Set<string>;
  selectedRows: Set<string>;
  expandedSections: Set<string>;
  onCellChange: (entityId: string, fieldKey: string, value: any) => void;
  onStartEdit: (cellKey: string) => void;
  onEndEdit: (cellKey: string) => void;
  onRowSelection: (rowId: string, isSelected: boolean) => void;
  onToggleSection: (sectionId: string) => void;
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function DynamicTableStructure({
  tableRows,
  selectedLevel,
  pendingChanges,
  editingCells,
  selectedRows,
  expandedSections,
  onCellChange,
  onStartEdit,
  onEndEdit,
  onRowSelection,
  onToggleSection
}: DynamicTableStructureProps) {

  // ==================== ÉTATS ====================

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ==================== COLONNES DYNAMIQUES ====================

  const columns = useMemo(() => {
    return getColumnsWithHierarchy(selectedLevel);
  }, [selectedLevel]);

  // ==================== DONNÉES FILTRÉES ET TRIÉES ====================

  const processedRows = useMemo(() => {
    let filtered = tableRows;

    // Filtrage par recherche
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = tableRows.filter(row => {
        const data = row.data as any;
        
        // Recherche dans les champs principaux selon le type
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

    // Tri
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === '_hierarchy') {
          // Tri spécial pour la colonne hiérarchie
          aValue = getHierarchyLabel(a);
          bValue = getHierarchyLabel(b);
        } else {
          aValue = (a.data as any)[sortConfig.key];
          bValue = (b.data as any)[sortConfig.key];
        }

        // Gestion des valeurs nulles/undefined
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // Tri numérique pour les nombres
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Tri alphabétique pour le reste
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
  }, [tableRows, searchTerm, sortConfig]);

  // ==================== FONCTIONS UTILITAIRES ====================

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

  const getCellValue = (row: TableRow, columnKey: string): any => {
    // Valeur avec modifications pendantes
    const pendingChange = pendingChanges.get(row.id);
    if (pendingChange && pendingChange[columnKey] !== undefined) {
      return pendingChange[columnKey];
    }
    
    // Valeur originale
    return (row.data as any)[columnKey];
  };

  const getRowStyles = (row: TableRow): string => {
    let classes = '';
    
    // Style selon le niveau d'édition
    if (row.isEditable) {
      classes += 'bg-white hover:bg-gray-50';
    } else {
      classes += 'bg-gray-50 text-gray-500';
    }
    
    // Sélection
    if (selectedRows.has(row.id)) {
      classes += ' ring-2 ring-indigo-500 bg-indigo-50';
    }
    
    // Modifications pendantes
    if (pendingChanges.has(row.id)) {
      classes += ' border-l-4 border-orange-400';
    }
    
    return classes;
  };

  const handleSort = (columnKey: string) => {
    setSortConfig(prev => {
      if (prev?.key === columnKey) {
        // Inverser la direction
        return {
          key: columnKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // Nouveau tri
        return {
          key: columnKey,
          direction: 'asc'
        };
      }
    });
  };

  const renderHierarchyCell = (row: TableRow) => {
    const label = getHierarchyLabel(row);
    const hasChanges = pendingChanges.has(row.id);
    
    return (
      <div className="flex items-center space-x-2" style={{ paddingLeft: `${row.level * 20}px` }}>
        {/* Checkbox de sélection */}
        <input
          type="checkbox"
          checked={selectedRows.has(row.id)}
          onChange={(e) => onRowSelection(row.id, e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        
        {/* Icône d'expansion pour les sections */}
        {row.type === 'section' && (
          <button
            onClick={() => onToggleSection(row.id)}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {expandedSections.has(row.id) ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
        )}
        
        {/* Indicateur de type */}
        <span className={`inline-block w-2 h-2 rounded-full ${getTypeColor(row.type)}`} />
        
        {/* Label avec indicateur de modifications */}
        <span className={`${hasChanges ? 'font-semibold text-orange-700' : ''}`}>
          {label}
          {hasChanges && <span className="ml-1 text-orange-500">●</span>}
        </span>
      </div>
    );
  };

  const getTypeColor = (type: TableLevel): string => {
    switch (type) {
      case 'section': return 'bg-blue-500';
      case 'tactique': return 'bg-green-500';
      case 'placement': return 'bg-purple-500';
      case 'creatif': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const renderDataCell = (row: TableRow, column: DynamicColumn) => {
    const cellKey = `${row.id}_${column.key}`;
    const value = getCellValue(row, column.key);
    const isEditing = editingCells.has(cellKey);
    
    // Cellule readonly ou non-éditable
    if (column.type === 'readonly' || !row.isEditable) {
      const formattedValue = formatColumnValue(selectedLevel, column.key, value);
      return (
        <span className={!row.isEditable ? 'text-gray-400' : ''}>
          {formattedValue || '-'}
        </span>
      );
    }
    
    // Cellule éditable - sera remplacée par EditableTableCell
    return (
      <div className="min-h-[32px] flex items-center">
        {isEditing ? (
          <input
            type={column.type === 'number' || column.type === 'currency' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => onCellChange(row.id, column.key, e.target.value)}
            onBlur={() => onEndEdit(cellKey)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Tab') {
                onEndEdit(cellKey);
              }
              if (e.key === 'Escape') {
                onEndEdit(cellKey);
                // TODO: Annuler les modifications
              }
            }}
            className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
        ) : (
          <button
            onClick={() => onStartEdit(cellKey)}
            className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded min-h-[28px] flex items-center"
          >
            {formatColumnValue(selectedLevel, column.key, value) || (
              <span className="text-gray-400 italic">Cliquer pour modifier</span>
            )}
          </button>
        )}
      </div>
    );
  };

  // ==================== RENDU ====================

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder={`Rechercher dans les ${selectedLevel}s...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <span className="text-sm text-gray-500">
            {processedRows.length} ligne{processedRows.length > 1 ? 's' : ''}
            {searchTerm && ` (filtré${processedRows.length > 1 ? 's' : ''})`}
          </span>
        </div>
        
        {sortConfig && (
          <button
            onClick={() => setSortConfig(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Effacer le tri
          </button>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          {/* En-têtes */}
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {sortConfig?.key === column.key && (
                      <span className="text-indigo-600">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Corps du tableau */}
          <tbody className="bg-white divide-y divide-gray-200">
            {processedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'Aucun résultat trouvé' : 'Aucune donnée à afficher'}
                </td>
              </tr>
            ) : (
              processedRows.map(row => (
                <tr key={row.id} className={getRowStyles(row)}>
                  {columns.map(column => (
                    <td key={column.key} className="px-4 py-3 text-sm">
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
  );
}