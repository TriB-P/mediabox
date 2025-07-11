// app/components/Tactiques/Views/Table/TactiquesAdvancedTableView.tsx

'use client';

import React from 'react';
import { Section, Tactique, Placement, Creatif } from '../../../../types/tactiques';
import { useAdvancedTableData } from '../../../../hooks/useAdvancedTableData';
import DynamicTableStructure from './DynamicTableStructure';
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
    
    // États d'édition
    selectedLevel,
    pendingChanges,
    editingCells,
    expandedSections,
    
    // Actions de modification
    setSelectedLevel,
    updateCell,
    startEdit,
    endEdit,
    
    // Actions d'expansion
    toggleSectionExpansion,
    expandAllSections,
    collapseAllSections,
    
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
    <div className="space-y-3">
      {/* 🔥 SUPPRIMÉ: Ancien sélecteur de niveau - maintenant intégré dans DynamicTableStructure */}

      {/* Barre de sauvegarde - COMPACTE */}
      {hasUnsavedChanges && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              <span className="font-medium text-orange-600">{pendingChanges.size}</span> modification{pendingChanges.size > 1 ? 's' : ''} en attente
            </span>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancelAllChanges}
                disabled={isSaving}
                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              
              <button
                onClick={handleSaveAllChanges}
                disabled={isSaving}
                className="flex items-center px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structure du tableau principal avec barre d'outils intégrée */}
      <DynamicTableStructure
        tableRows={tableRows}
        selectedLevel={selectedLevel}
        pendingChanges={pendingChanges}
        editingCells={editingCells}
        expandedSections={expandedSections}
        onCellChange={updateCell}
        onStartEdit={startEdit}
        onEndEdit={endEdit}
        onToggleSection={toggleSectionExpansion}
        onLevelChange={handleLevelChange}
        entityCounts={entityCounts}
      />

      {/* Informations de statut - COMPACTE */}
      <div className="flex items-center justify-between text-sm text-gray-500 py-2">
        <div className="flex items-center space-x-4">
          <span>{tableRows.length} ligne{tableRows.length > 1 ? 's' : ''} affichée{tableRows.length > 1 ? 's' : ''}</span>
          
          {/* Actions d'expansion rapide */}
          <div className="flex items-center space-x-2">
            <button
              onClick={expandAllSections}
              className="text-xs text-gray-600 hover:text-gray-800 px-1 py-1 rounded hover:bg-gray-100"
            >
              Tout étendre
            </button>
            <button
              onClick={collapseAllSections}
              className="text-xs text-gray-600 hover:text-gray-800 px-1 py-1 rounded hover:bg-gray-100"
            >
              Tout replier
            </button>
          </div>
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
        <details className="bg-gray-50 p-3 rounded text-xs text-gray-600">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <div className="mt-2 space-y-1">
            <p><strong>Selected Level:</strong> {selectedLevel}</p>
            <p><strong>Entity Counts:</strong> {JSON.stringify(entityCounts)}</p>
            <p><strong>Expanded Sections:</strong> {Array.from(expandedSections).join(', ') || 'Aucune'}</p>
            <p><strong>Editing Cells:</strong> {Array.from(editingCells).join(', ') || 'Aucune'}</p>
            <p><strong>Pending Changes:</strong> {pendingChanges.size}</p>
            <p><strong>Is Saving:</strong> {isSaving ? 'Oui' : 'Non'}</p>
          </div>
        </details>
      )}
    </div>
  );
}