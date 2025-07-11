// app/components/Tactiques/EditableTableCell.tsx

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';
import { validateColumnValue, formatColumnValue } from './tableColumns.config';

// ==================== TYPES ====================

interface EditableTableCellProps {
  entityId: string;
  fieldKey: string;
  value: any;
  column: DynamicColumn;
  tableLevel: TableLevel;
  isEditable: boolean;
  isEditing: boolean;
  hasError?: boolean;
  onChange: (entityId: string, fieldKey: string, value: any) => void;
  onStartEdit: (cellKey: string) => void;
  onEndEdit: (cellKey: string) => void;
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function EditableTableCell({
  entityId,
  fieldKey,
  value,
  column,
  tableLevel,
  isEditable,
  isEditing,
  hasError = false,
  onChange,
  onStartEdit,
  onEndEdit,
  onNavigate
}: EditableTableCellProps) {

  // ==================== ÉTATS ET REFS ====================

  const [localValue, setLocalValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);
  const cellKey = `${entityId}_${fieldKey}`;

  // ==================== EFFETS ====================

  // Synchroniser la valeur locale avec la prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Focus automatique en mode édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      
      // Sélectionner tout le texte pour les inputs texte
      if (inputRef.current.type === 'text' || inputRef.current.type === 'number') {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing]);

  // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================

  const handleStartEdit = useCallback(() => {
    if (!isEditable) return;
    onStartEdit(cellKey);
  }, [isEditable, cellKey, onStartEdit]);

  const handleChange = useCallback((newValue: any) => {
    setLocalValue(newValue);
    
    // Validation en temps réel
    const valid = validateColumnValue(tableLevel, fieldKey, newValue);
    setIsValid(valid);
    
    // Notifier le changement immédiatement
    onChange(entityId, fieldKey, newValue);
  }, [tableLevel, fieldKey, entityId, onChange]);

  const handleEndEdit = useCallback((save: boolean = true) => {
    if (save && isValid) {
      // La valeur a déjà été sauvegardée via handleChange
    } else if (!save) {
      // Annuler les modifications
      setLocalValue(value);
      onChange(entityId, fieldKey, value);
    }
    
    onEndEdit(cellKey);
  }, [isValid, value, entityId, fieldKey, cellKey, onChange, onEndEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleEndEdit(true);
        if (onNavigate) onNavigate('down');
        break;
        
      case 'Tab':
        e.preventDefault();
        handleEndEdit(true);
        if (onNavigate) onNavigate(e.shiftKey ? 'left' : 'right');
        break;
        
      case 'Escape':
        e.preventDefault();
        handleEndEdit(false);
        break;
        
      case 'ArrowUp':
        if (!isEditing || (inputRef.current && inputRef.current.type === 'number')) {
          e.preventDefault();
          handleEndEdit(true);
          if (onNavigate) onNavigate('up');
        }
        break;
        
      case 'ArrowDown':
        if (!isEditing || (inputRef.current && inputRef.current.type === 'number')) {
          e.preventDefault();
          handleEndEdit(true);
          if (onNavigate) onNavigate('down');
        }
        break;
    }
  }, [isEditing, handleEndEdit, onNavigate]);

  const handleBlur = useCallback(() => {
    // Délai pour permettre les clics sur d'autres éléments
    setTimeout(() => {
      handleEndEdit(true);
    }, 150);
  }, [handleEndEdit]);

  // ==================== COMPOSANTS DE CHAMPS ====================

  const renderTextInput = () => (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      value={localValue || ''}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
        isValid 
          ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' 
          : 'border-red-300 focus:border-red-500 focus:ring-red-500'
      }`}
      placeholder={`Saisir ${column.label.toLowerCase()}`}
    />
  );

  const renderNumberInput = () => (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="number"
      value={localValue || ''}
      onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
        isValid 
          ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' 
          : 'border-red-300 focus:border-red-500 focus:ring-red-500'
      }`}
      placeholder="0"
      min="0"
      step={column.type === 'currency' ? '0.01' : '1'}
    />
  );

  const renderSelectInput = () => (
    <select
      ref={inputRef as React.RefObject<HTMLSelectElement>}
      value={localValue || ''}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
        isValid 
          ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' 
          : 'border-red-300 focus:border-red-500 focus:ring-red-500'
      }`}
    >
      <option value="">-- Sélectionner --</option>
      {column.options?.map(option => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const renderDateInput = () => (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="date"
      value={localValue || ''}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
        isValid 
          ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' 
          : 'border-red-300 focus:border-red-500 focus:ring-red-500'
      }`}
    />
  );

  const renderEditingField = () => {
    switch (column.type) {
      case 'text':
        return renderTextInput();
      case 'number':
      case 'currency':
        return renderNumberInput();
      case 'select':
        return renderSelectInput();
      case 'date':
        return renderDateInput();
      default:
        return renderTextInput();
    }
  };

  // ==================== AFFICHAGE EN MODE LECTURE ====================

  const renderDisplayValue = () => {
    if (column.type === 'readonly' || !isEditable) {
      const formattedValue = formatColumnValue(tableLevel, fieldKey, value);
      return (
        <span className={`text-sm ${!isEditable ? 'text-gray-400' : 'text-gray-900'}`}>
          {formattedValue || '-'}
        </span>
      );
    }

    // Mode éditable mais pas en cours d'édition
    const formattedValue = formatColumnValue(tableLevel, fieldKey, value);
    const displayValue = formattedValue || '';
    
    return (
      <button
        onClick={handleStartEdit}
        className={`w-full text-left px-2 py-1 text-sm rounded transition-colors min-h-[28px] flex items-center ${
          hasError 
            ? 'hover:bg-red-50 text-red-700 border border-red-200' 
            : 'hover:bg-gray-50 text-gray-900'
        }`}
        title={`Cliquer pour modifier ${column.label.toLowerCase()}`}
      >
        {displayValue || (
          <span className="text-gray-400 italic">
            Cliquer pour saisir
          </span>
        )}
      </button>
    );
  };

  // ==================== INDICATEURS VISUELS ====================

  const renderValidationIcon = () => {
    if (!isEditing || column.type === 'readonly') return null;
    
    return (
      <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
        {!isValid ? (
          <span className="text-red-500 text-xs">⚠</span>
        ) : (
          <span className="text-green-500 text-xs">✓</span>
        )}
      </div>
    );
  };

  const getCellClasses = () => {
    let classes = 'relative min-h-[32px] flex items-center';
    
    if (hasError) {
      classes += ' bg-red-50';
    } else if (!isEditable) {
      classes += ' bg-gray-50';
    }
    
    return classes;
  };

  // ==================== RENDU PRINCIPAL ====================

  return (
    <div className={getCellClasses()}>
      {isEditing ? (
        <>
          {renderEditingField()}
          {renderValidationIcon()}
        </>
      ) : (
        renderDisplayValue()
      )}
      
      {/* Tooltip d'erreur */}
      {hasError && !isEditing && (
        <div className="absolute z-10 top-full left-0 mt-1 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 whitespace-nowrap shadow-lg">
          Valeur invalide pour {column.label.toLowerCase()}
        </div>
      )}
    </div>
  );
}

// ==================== HOOKS UTILITAIRES ====================

/**
 * Hook pour gérer la navigation au clavier entre cellules
 */
export function useTableNavigation(
  tableRows: any[],
  columns: DynamicColumn[],
  editingCells: Set<string>,
  onStartEdit: (cellKey: string) => void
) {
  const navigate = useCallback((
    fromCellKey: string,
    direction: 'up' | 'down' | 'left' | 'right'
  ) => {
    const [entityId, fieldKey] = fromCellKey.split('_');
    const currentRowIndex = tableRows.findIndex(row => row.id === entityId);
    const currentColIndex = columns.findIndex(col => col.key === fieldKey);
    
    if (currentRowIndex === -1 || currentColIndex === -1) return;
    
    let targetRowIndex = currentRowIndex;
    let targetColIndex = currentColIndex;
    
    switch (direction) {
      case 'up':
        targetRowIndex = Math.max(0, currentRowIndex - 1);
        break;
      case 'down':
        targetRowIndex = Math.min(tableRows.length - 1, currentRowIndex + 1);
        break;
      case 'left':
        targetColIndex = Math.max(0, currentColIndex - 1);
        break;
      case 'right':
        targetColIndex = Math.min(columns.length - 1, currentColIndex + 1);
        break;
    }
    
    const targetRow = tableRows[targetRowIndex];
    const targetColumn = columns[targetColIndex];
    
    if (targetRow && targetColumn && targetRow.isEditable && targetColumn.type !== 'readonly') {
      const targetCellKey = `${targetRow.id}_${targetColumn.key}`;
      onStartEdit(targetCellKey);
    }
  }, [tableRows, columns, onStartEdit]);
  
  return navigate;
}