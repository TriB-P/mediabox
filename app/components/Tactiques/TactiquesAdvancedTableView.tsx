// app/components/Tactiques/TactiquesAdvancedTableView.tsx

'use client';

import React from 'react';
import { Section, Tactique, Placement, Creatif } from '../../types/tactiques';
import { useAdvancedTableData } from '../../hooks/useAdvancedTableData';
import DynamicTableStructure from './DynamicTableStructure';
import BulkEditToolbar from './BulkEditToolbar';
import { useTableNavigation } from './EditableTableCell';
import { getColumnsForLevel } from './tableColumns.config';

// ==================== TYPES ====================

export type TableLevel = 'section' | 'tactique' | 'placement' | 'creatif';

export interface TableRow {
  id: string;
  type: TableLevel;
  data: Section | Tactique | Placement | Creatif;
  level: number; // Niveau d'indentation (0=section, 1=tactique, 2=placement, 3=créatif)
  isEditable: boolean; // true si correspond au niveau sélectionné
  parentId?: string;
  sectionId: string; // ID de la section parente (pour tous les niveaux)
  tactiqueId?: string; // ID de la tactique parente (pour placement/créatif)
  placementId?: string; // ID du placement parent (pour créatif)
}

export interface DynamicColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'currency' | 'readonly';
  width?: number;
  options?: Array<{ id: string; label: string }>;
  validation?: (value: any) => boolean;
  format?: (value: any) => string;
}

export interface BulkUpdateOperation {
  entityId: string;
  entityType: TableLevel;
  field: string;
  oldValue: any;
  newValue: any;
  sectionId: string;
  tactiqueId?: string;
  placementId?: string;
}

export interface EntityCounts {
  sections: number;
  tactiques: number;
  placements: number;
  creatifs: number;
}

// ==================== PROPS ====================

interface TactiquesAdvancedTableViewProps {
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  onUpdateTactique: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  onUpdateSection: (sectionId: string, data: Partial<Section>) => Promise<void>;
  onUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  onUpdateCreatif: (creatifId: string, data: Partial<Creatif>) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function TactiquesAdvancedTableView({
  sections,
  tactiques,
  placements,
  creatifs,
  onUpdateTactique,
  onUpdateSection,
  onUpdatePlacement,
  onUpdateCreatif,
  formatCurrency
}: TactiquesAdvancedTableViewProps) {

  // ==================== HOOK DE GESTION DES DONNÉES ====================

  const {
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
  } = useAdvancedTableData({
    sections,
    tactiques,
    placements,
    creatifs,
    onUpdateSection,
    onUpdateTactique,
    onUpdatePlacement,
    onUpdateCreatif
  });

  // ==================== NAVIGATION CLAVIER ====================

  const columns = getColumnsForLevel(selectedLevel);
  const navigate = useTableNavigation(tableRows, columns, editingCells, startEdit);

  // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================

  const handleLevelChange = (level: TableLevel) => {
    setSelectedLevel(level);
  };

  const handleBulkEdit = (fieldKey: string, value: any, entityIds: string[]) => {
    bulkEdit(fieldKey, value, entityIds);
  };

  const handleFillDown = (fromRowId: string, fieldKey: string, toRowIds: string[]) => {
    fillDown(fromRowId, fieldKey, toRowIds);
  };

  const handleCopyValues = (fromRowId: string, toRowIds: string[]) => {
    copyValues(fromRowId, toRowIds);
  };

  const handleSaveAllChanges = async () => {
    try {
      await saveAllChanges();
      // TODO: Afficher un toast de succès
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // TODO: Afficher un toast d'erreur
    }
  };

  const handleCancelAllChanges = () => {
    if (hasUnsavedChanges && !confirm('Êtes-vous sûr de vouloir annuler toutes les modifications ?')) {
      return;
    }
    cancelAllChanges();
  };

  // ==================== RENDU ====================

  return (
    <div className="space-y-4">
      {/* Sélecteur de niveau d'édition */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {(['section', 'tactique', 'placement', 'creatif'] as TableLevel[]).map(level => (
              <button
                key={level}
                onClick={() => handleLevelChange(level)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedLevel === level
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="capitalize">{level}s</span>
                <span className="ml-2 text-xs bg-white px-2 py-0.5 rounded-full">
                  {entityCounts[level + 's' as keyof EntityCounts]}
                </span>
              </button>
            ))}
          </div>

          {/* Actions d'expansion rapide */}
          <div className="flex items-center space-x-2">
            <button
              onClick={expandAllSections}
              className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
            >
              Tout étendre
            </button>
            <button
              onClick={collapseAllSections}
              className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
            >
              Tout replier
            </button>
          </div>
        </div>
      </div>

      {/* Barre d'outils d'édition en masse */}
      <BulkEditToolbar
        selectedLevel={selectedLevel}
        selectedRows={selectedRows}
        pendingChangesCount={pendingChanges.size}
        onSaveAll={handleSaveAllChanges}
        onCancelAll={handleCancelAllChanges}
        onBulkEdit={handleBulkEdit}
        onFillDown={handleFillDown}
        onCopyValues={handleCopyValues}
        isSaving={isSaving}
      />

      {/* Structure du tableau principal */}
      <DynamicTableStructure
        tableRows={tableRows}
        selectedLevel={selectedLevel}
        pendingChanges={pendingChanges}
        editingCells={editingCells}
        selectedRows={selectedRows}
        expandedSections={expandedSections}
        onCellChange={updateCell}
        onStartEdit={startEdit}
        onEndEdit={endEdit}
        onRowSelection={selectRow}
        onToggleSection={toggleSectionExpansion}
      />

      {/* Informations de statut */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{tableRows.length} ligne{tableRows.length > 1 ? 's' : ''} affichée{tableRows.length > 1 ? 's' : ''}</span>
          {selectedRows.size > 0 && (
            <span className="text-indigo-600 font-medium">
              {selectedRows.size} sélectionnée{selectedRows.size > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {hasUnsavedChanges && (
            <span className="text-orange-600 font-medium">
              {pendingChanges.size} modification{pendingChanges.size > 1 ? 's' : ''} non sauvegardée{pendingChanges.size > 1 ? 's' : ''}
            </span>
          )}
          <span>Mode: <strong className="capitalize">{selectedLevel}</strong></span>
        </div>
      </div>

      {/* Debug info (développement seulement) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="bg-gray-50 p-4 rounded text-xs text-gray-600">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <div className="mt-2 space-y-1">
            <p><strong>Selected Level:</strong> {selectedLevel}</p>
            <p><strong>Entity Counts:</strong> {JSON.stringify(entityCounts)}</p>
            <p><strong>Expanded Sections:</strong> {Array.from(expandedSections).join(', ') || 'Aucune'}</p>
            <p><strong>Selected Rows:</strong> {Array.from(selectedRows).join(', ') || 'Aucune'}</p>
            <p><strong>Editing Cells:</strong> {Array.from(editingCells).join(', ') || 'Aucune'}</p>
            <p><strong>Pending Changes:</strong> {pendingChanges.size}</p>
            <p><strong>Is Saving:</strong> {isSaving ? 'Oui' : 'Non'}</p>
          </div>
        </details>
      )}
    </div>
  );
}