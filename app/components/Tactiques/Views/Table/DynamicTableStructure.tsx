// app/components/Tactiques/Views/Table/DynamicTableStructure.tsx

'use client';

import React, { useMemo, useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, QuestionMarkCircleIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { TableRow, DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';
import { getColumnsWithHierarchy, formatColumnValue } from './tableColumns.config';

// ==================== TYPES ====================

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
  // 🔥 NOUVEAU: Props pour la barre d'outils intégrée
  onLevelChange: (level: TableLevel) => void;
  entityCounts: {
    sections: number;
    tactiques: number;
    placements: number;
    creatifs: number;
  };
}

// ==================== COMPOSANT PRINCIPAL ====================

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

  // ==================== ÉTATS ====================

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hideChildrenLevels, setHideChildrenLevels] = useState(false);
  
  // États pour la sélection et copie
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [copyMode, setCopyMode] = useState<{ active: boolean; sourceCell?: string; sourceValue?: any }>({ active: false });
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // État pour le tooltip d'aide
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  // ==================== COLONNES DYNAMIQUES ====================

  const columns = useMemo(() => {
    return getColumnsWithHierarchy(selectedLevel);
  }, [selectedLevel]);

  // ==================== DONNÉES FILTRÉES ET TRIÉES ====================

  const processedRows = useMemo(() => {
    let filtered = tableRows;

    // Filtrage pour masquer les niveaux inférieurs si demandé
    if (hideChildrenLevels) {
      filtered = tableRows.filter(row => row.type === selectedLevel);
    }

    // Filtrage par recherche
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(row => {
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
  }, [tableRows, searchTerm, sortConfig, hideChildrenLevels, selectedLevel]);

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
    let classes = 'hover:bg-gray-50 transition-colors cursor-pointer';
    
    // Style selon le niveau d'édition
    if (row.isEditable) {
      classes += ' bg-white';
    } else {
      classes += ' bg-gray-50 text-gray-500';
    }
    
    // Sélection
    if (selectedRows.has(row.id)) {
      classes += ' bg-indigo-50 border-l-4 border-indigo-500';
    }
    
    // Modifications pendantes
    else if (pendingChanges.has(row.id)) {
      classes += ' border-l-4 border-orange-400';
    }
    
    return classes;
  };

  // ==================== GESTION DE LA SÉLECTION ====================

  const handleRowClick = (rowId: string, event: React.MouseEvent) => {
    // Ignorer si on clique sur un bouton ou input
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button') || target.closest('input')) {
      return;
    }

    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      
      if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd + clic : toggle la sélection
        if (newSelection.has(rowId)) {
          newSelection.delete(rowId);
        } else {
          newSelection.add(rowId);
        }
      } else if (event.shiftKey && prev.size > 0) {
        // Shift + clic : sélection en plage
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
        // Clic simple : sélection unique
        newSelection.clear();
        newSelection.add(rowId);
      }
      
      return newSelection;
    });
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
    setCopyMode({ active: false });
  };

  // ==================== GESTION DE LA COPIE ====================

  const handleStartCopy = (sourceRowId: string, fieldKey: string) => {
    const sourceValue = getCellValue(processedRows.find(r => r.id === sourceRowId)!, fieldKey);
    setCopyMode({
      active: true,
      sourceCell: `${sourceRowId}_${fieldKey}`,
      sourceValue
    });
  };

  const handlePasteCopy = (fieldKey: string) => {
    if (!copyMode.active || selectedRows.size === 0) return;

    const targetRows = Array.from(selectedRows);
    targetRows.forEach(rowId => {
      if (rowId !== copyMode.sourceCell?.split('_')[0]) { // Ne pas copier sur soi-même
        onCellChange(rowId, fieldKey, copyMode.sourceValue);
      }
    });

    // Afficher un feedback
    const copiedCount = targetRows.length;
    console.log(`✅ Valeur "${copyMode.sourceValue}" copiée vers ${copiedCount} ligne${copiedCount > 1 ? 's' : ''}`);
    
    setCopyMode({ active: false });
  };

  const cancelCopy = () => {
    setCopyMode({ active: false });
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
        {/* Icône d'expansion pour les sections */}
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
        
        {/* Icône de type (texte) */}
        <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeStyles(row.type)}`}>
          {getTypeLabel(row.type)}
        </span>
        
        {/* Label avec indicateur de modifications */}
        <span className={`font-medium ${hasChanges ? 'text-orange-700' : 'text-gray-900'}`}>
          {label}
          {hasChanges && <span className="ml-1 text-orange-500">●</span>}
        </span>
      </div>
    );
  };

  const getTypeStyles = (type: TableLevel): string => {
    switch (type) {
      case 'section': return 'bg-blue-100 text-blue-800';
      case 'tactique': return 'bg-green-100 text-green-800';
      case 'placement': return 'bg-purple-100 text-purple-800';
      case 'creatif': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: TableLevel): string => {
    switch (type) {
      case 'section': return 'SEC';
      case 'tactique': return 'TAC';
      case 'placement': return 'PLA';
      case 'creatif': return 'CRE';
      default: return 'UNK';
    }
  };

  const renderDataCell = (row: TableRow, column: DynamicColumn) => {
    const cellKey = `${row.id}_${column.key}`;
    const value = getCellValue(row, column.key);
    const isEditing = editingCells.has(cellKey);
    const isHovered = hoveredCell === cellKey;
    const isCopySource = copyMode.sourceCell === cellKey;
    
    // Cellule readonly ou non-éditable
    if (column.type === 'readonly' || !row.isEditable) {
      const formattedValue = formatColumnValue(selectedLevel, column.key, value);
      return (
        <span className={!row.isEditable ? 'text-gray-400' : 'text-gray-900'}>
          {formattedValue || '-'}
        </span>
      );
    }
    
    // Cellule éditable
    return (
      <div 
        className="min-h-[24px] flex items-center relative group"
        onMouseEnter={() => setHoveredCell(cellKey)}
        onMouseLeave={() => setHoveredCell(null)}
      >
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
              }
            }}
            className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
        ) : (
          <>
            <button
              onClick={() => onStartEdit(cellKey)}
              className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded min-h-[20px] flex items-center transition-colors ${
                isCopySource ? 'bg-green-100 border border-green-300' : ''
              }`}
            >
              {formatColumnValue(selectedLevel, column.key, value) || (
                <span className="text-gray-400 italic">Cliquer pour modifier</span>
              )}
            </button>
            
            {/* Boutons de copie - apparaissent au hover */}
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

  // ==================== RENDU ====================

  return (
    <div className="space-y-3">
      {/* 🔥 NOUVELLE BARRE D'OUTILS COMPACTE - TOUT SUR UNE LIGNE */}
      <div className="flex items-center justify-between gap-4">
        {/* Sélecteur de niveau */}
        <div className="flex space-x-1">
          {(['section', 'tactique', 'placement', 'creatif'] as TableLevel[]).map(level => (
            <button
              key={level}
              onClick={() => onLevelChange(level)}
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

        {/* Contrôles à droite */}
        <div className="flex items-center space-x-3">
          {/* Toggle masquer niveaux inférieurs - icône seule */}
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

          {/* Icône d'aide avec tooltip */}
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
                  <div><strong>Sélection :</strong> Clic = sélection • Ctrl+Clic = ajout • Shift+Clic = plage</div>
                  <div><strong>Copie :</strong> Survolez cellule → 📋 copier → survolez autre cellule → 📥 coller</div>
                  <div><strong>Édition :</strong> Clic sur cellule pour éditer • Enter/Tab = sauver • Esc = annuler</div>
                </div>
                <div className="absolute top-0 right-4 transform -translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </div>

          {/* Compteur de résultats */}
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {processedRows.length} ligne{processedRows.length > 1 ? 's' : ''}
            {searchTerm && ` (filtré${processedRows.length > 1 ? 's' : ''})`}
            {selectedRows.size > 0 && (
              <span className="text-indigo-600 font-medium ml-2">
                • {selectedRows.size} sélectionnée{selectedRows.size > 1 ? 's' : ''}
              </span>
            )}
          </span>

          {/* Effacer le tri si actif */}
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

      {/* Barre d'actions de copie - COMPACTE */}
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

      {/* Conteneur du tableau avec largeur ABSOLUE fixe */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Conteneur avec largeur STRICTEMENT limitée */}
        <div 
          className="overflow-auto"
          style={{ 
            maxHeight: '75vh', // 🔥 AUGMENTÉ : Plus de place pour le tableau
            width: '100%',
            maxWidth: 'calc(100vw - 220px)',
          }}
        >
          {/* Tableau avec largeur interne libre */}
          <table className="divide-y divide-gray-200" style={{ width: 'max-content', minWidth: '100%' }}>
            {/* En-têtes collants */}
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

            {/* Corps du tableau - PADDING RÉDUIT */}
            <tbody className="bg-white divide-y divide-gray-200">
              {processedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-6 text-center text-gray-500">
                    {searchTerm ? 'Aucun résultat trouvé' : 'Aucune donnée à afficher'}
                  </td>
                </tr>
              ) : (
                processedRows.map(row => (
                  <tr 
                    key={row.id} 
                    className={getRowStyles(row)}
                    onClick={(e) => handleRowClick(row.id, e)}
                  >
                    {columns.map(column => (
                      <td 
                        key={column.key} 
                        className="px-3 py-2 text-sm whitespace-nowrap" // 🔥 RÉDUIT : py-2 au lieu de py-3
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