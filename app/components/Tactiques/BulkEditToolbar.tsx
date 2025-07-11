// app/components/Tactiques/BulkEditToolbar.tsx

'use client';

import React, { useState, useCallback } from 'react';
import { 
  DocumentDuplicateIcon, 
  ArrowDownIcon, 
  CheckIcon, 
  XMarkIcon,
  PencilSquareIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { TableLevel, DynamicColumn } from './TactiquesAdvancedTableView';
import { getColumnsForLevel } from './tableColumns.config';

// ==================== TYPES ====================

interface BulkEditToolbarProps {
  selectedLevel: TableLevel;
  selectedRows: Set<string>;
  pendingChangesCount: number;
  onSaveAll: () => Promise<void>;
  onCancelAll: () => void;
  onBulkEdit: (fieldKey: string, value: any, entityIds: string[]) => void;
  onFillDown: (fromRowId: string, fieldKey: string, toRowIds: string[]) => void;
  onCopyValues: (fromRowId: string, toRowIds: string[]) => void;
  isSaving: boolean;
}

interface BulkEditModalState {
  isOpen: boolean;
  field: string;
  fieldLabel: string;
  fieldType: string;
  options?: Array<{ id: string; label: string }>;
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function BulkEditToolbar({
  selectedLevel,
  selectedRows,
  pendingChangesCount,
  onSaveAll,
  onCancelAll,
  onBulkEdit,
  onFillDown,
  onCopyValues,
  isSaving
}: BulkEditToolbarProps) {

  // ==================== ÉTATS ====================

  const [bulkEditModal, setBulkEditModal] = useState<BulkEditModalState>({
    isOpen: false,
    field: '',
    fieldLabel: '',
    fieldType: ''
  });

  const [bulkValue, setBulkValue] = useState<any>('');
  const [selectedField, setSelectedField] = useState<string>('');

  // ==================== DONNÉES CALCULÉES ====================

  const selectedRowsArray = Array.from(selectedRows);
  const hasSelection = selectedRowsArray.length > 0;
  const isMultiSelection = selectedRowsArray.length > 1;
  
  // Colonnes disponibles pour l'édition en masse (exclure readonly et hiérarchie)
  const editableColumns = getColumnsForLevel(selectedLevel).filter(
    col => col.type !== 'readonly' && col.key !== '_hierarchy'
  );

  // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================

  const handleOpenBulkEdit = useCallback(() => {
    if (!hasSelection || !selectedField) return;
    
    const column = editableColumns.find(col => col.key === selectedField);
    if (!column) return;

    setBulkEditModal({
      isOpen: true,
      field: column.key,
      fieldLabel: column.label,
      fieldType: column.type,
      options: column.options
    });
    
    setBulkValue('');
  }, [hasSelection, selectedField, editableColumns]);

  const handleCloseBulkEdit = useCallback(() => {
    setBulkEditModal({ isOpen: false, field: '', fieldLabel: '', fieldType: '' });
    setBulkValue('');
  }, []);

  const handleApplyBulkEdit = useCallback(() => {
    if (!bulkEditModal.field || !hasSelection) return;

    onBulkEdit(bulkEditModal.field, bulkValue, selectedRowsArray);
    handleCloseBulkEdit();
  }, [bulkEditModal.field, bulkValue, hasSelection, selectedRowsArray, onBulkEdit, handleCloseBulkEdit]);

  const handleFillDown = useCallback(() => {
    if (!selectedField || selectedRowsArray.length < 2) return;
    
    const [firstRowId, ...restRowIds] = selectedRowsArray;
    onFillDown(firstRowId, selectedField, restRowIds);
  }, [selectedField, selectedRowsArray, onFillDown]);

  const handleCopyRow = useCallback(() => {
    if (selectedRowsArray.length < 2) return;
    
    const [firstRowId, ...restRowIds] = selectedRowsArray;
    onCopyValues(firstRowId, restRowIds);
  }, [selectedRowsArray, onCopyValues]);

  // ==================== COMPOSANTS DE RENDU ====================

  const renderBulkEditInput = () => {
    switch (bulkEditModal.fieldType) {
      case 'select':
        return (
          <select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Sélectionner une valeur --</option>
            {bulkEditModal.options?.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      case 'number':
      case 'currency':
        return (
          <input
            type="number"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Entrer une valeur numérique"
            min="0"
            step={bulkEditModal.fieldType === 'currency' ? '0.01' : '1'}
          />
        );
        
      case 'date':
        return (
          <input
            type="date"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        );
        
      default:
        return (
          <input
            type="text"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Entrer la nouvelle valeur"
          />
        );
    }
  };

  // ==================== RENDU PRINCIPAL ====================

  if (!hasSelection && pendingChangesCount === 0) {
    return null; // Masquer la barre d'outils si aucune sélection ni changement
  }

  return (
    <>
      {/* Barre d'outils principale */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Section gauche - Outils d'édition */}
          <div className="flex items-center space-x-4">
            {hasSelection && (
              <>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedRowsArray.length}</span> {selectedLevel}{selectedRowsArray.length > 1 ? 's' : ''} sélectionné{selectedRowsArray.length > 1 ? 's' : ''}
                </div>
                
                <div className="h-4 border-l border-gray-300" />
                
                {/* Sélecteur de champ */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Champ:</label>
                  <select
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-- Choisir un champ --</option>
                    {editableColumns.map(column => (
                      <option key={column.key} value={column.key}>
                        {column.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Boutons d'action */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleOpenBulkEdit}
                    disabled={!selectedField}
                    className="flex items-center px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Modifier la valeur pour toutes les lignes sélectionnées"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                    Éditer en masse
                  </button>
                  
                  {isMultiSelection && (
                    <>
                      <button
                        onClick={handleFillDown}
                        disabled={!selectedField}
                        className="flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Copier la valeur de la première ligne vers les autres"
                      >
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                        Remplir vers le bas
                      </button>
                      
                      <button
                        onClick={handleCopyRow}
                        className="flex items-center px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        title="Copier toutes les valeurs de la première ligne vers les autres"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                        Copier la ligne
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Section droite - Sauvegarde */}
          {pendingChangesCount > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                <span className="font-medium text-orange-600">{pendingChangesCount}</span> modification{pendingChangesCount > 1 ? 's' : ''} en attente
              </span>
              
              <button
                onClick={onCancelAll}
                disabled={isSaving}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Annuler
              </button>
              
              <button
                onClick={onSaveAll}
                disabled={isSaving}
                className="flex items-center px-4 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder tout'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'édition en masse */}
      {bulkEditModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Édition en masse - {bulkEditModal.fieldLabel}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Cette valeur sera appliquée aux {selectedRowsArray.length} {selectedLevel}{selectedRowsArray.length > 1 ? 's' : ''} sélectionné{selectedRowsArray.length > 1 ? 's' : ''}.
              </p>
            </div>
            
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouvelle valeur pour "{bulkEditModal.fieldLabel}"
              </label>
              {renderBulkEditInput()}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={handleCloseBulkEdit}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleApplyBulkEdit}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Appliquer aux {selectedRowsArray.length} ligne{selectedRowsArray.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}