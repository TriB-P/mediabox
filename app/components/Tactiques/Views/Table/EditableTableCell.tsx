/**
 * Ce fichier définit le composant `EditableTableCell`, qui représente une cellule éditable dans un tableau.
 * Il gère l'affichage de la valeur, la commutation entre les modes lecture et édition,
 * la validation des entrées et la gestion des événements clavier pour la navigation.
 * Il inclut également le hook `useTableNavigation` pour permettre la navigation au clavier entre les cellules.
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';
import { validateColumnValue, formatColumnValue } from './tableColumns.config';

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

/**
 * Composant de cellule de tableau éditable.
 * Permet d'afficher et de modifier des valeurs dans un tableau, avec validation et gestion des interactions.
 *
 * @param {EditableTableCellProps} props - Les propriétés du composant.
 * @param {string} props.entityId - L'identifiant unique de l'entité (ligne) à laquelle appartient la cellule.
 * @param {string} props.fieldKey - La clé du champ (colonne) que cette cellule représente.
 * @param {any} props.value - La valeur actuelle de la cellule.
 * @param {DynamicColumn} props.column - La configuration de la colonne pour cette cellule.
 * @param {TableLevel} props.tableLevel - Le niveau du tableau (e.g., 'tactiques', 'phases', 'etapes').
 * @param {boolean} props.isEditable - Indique si la cellule est éditable.
 * @param {boolean} props.isEditing - Indique si la cellule est actuellement en mode édition.
 * @param {boolean} [props.hasError] - Indique si la cellule contient une erreur de validation.
 * @param {(entityId: string, fieldKey: string, value: any) => void} props.onChange - Fonction de rappel appelée lorsque la valeur de la cellule change.
 * @param {(cellKey: string) => void} props.onStartEdit - Fonction de rappel appelée lorsque l'édition de la cellule commence.
 * @param {(cellKey: string) => void} props.onEndEdit - Fonction de rappel appelée lorsque l'édition de la cellule se termine.
 * @param {(direction: 'up' | 'down' | 'left' | 'right') => void} [props.onNavigate] - Fonction de rappel pour la navigation au clavier vers d'autres cellules.
 * @returns {JSX.Element} Le composant de cellule éditable.
 */
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
  const [localValue, setLocalValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);
  const cellKey = `${entityId}_${fieldKey}`;

  /**
   * Effet de synchronisation de la valeur locale avec la prop 'value'.
   * Se déclenche lorsque la prop 'value' change, mettant à jour l'état local.
   * @returns {void}
   */
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /**
   * Effet de focalisation automatique sur le champ d'entrée en mode édition.
   * Se déclenche lorsque le mode `isEditing` devient vrai et qu'un `inputRef` est disponible.
   * Sélectionne également le texte entier pour les champs de type texte ou nombre.
   * @returns {void}
   */
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.type === 'text' || inputRef.current.type === 'number') {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing]);

  /**
   * Gère le début de l'édition de la cellule.
   * Appelle `onStartEdit` si la cellule est éditable.
   * @returns {void}
   */
  const handleStartEdit = useCallback(() => {
    if (!isEditable) return;
    onStartEdit(cellKey);
  }, [isEditable, cellKey, onStartEdit]);

  /**
   * Gère le changement de valeur dans le champ d'édition.
   * Met à jour la valeur locale, valide la nouvelle valeur et notifie le composant parent via `onChange`.
   * @param {any} newValue - La nouvelle valeur de la cellule.
   * @returns {void}
   */
  const handleChange = useCallback((newValue: any) => {
    setLocalValue(newValue);
    const valid = validateColumnValue(tableLevel, fieldKey, newValue);
    setIsValid(valid);
    onChange(entityId, fieldKey, newValue);
  }, [tableLevel, fieldKey, entityId, onChange]);

  /**
   * Gère la fin de l'édition de la cellule.
   * Si 'save' est vrai et la valeur est valide, la valeur est considérée comme déjà sauvegardée.
   * Si 'save' est faux, les modifications sont annulées et la valeur est réinitialisée à la valeur d'origine.
   * Appelle `onEndEdit` pour notifier la fin de l'édition.
   * @param {boolean} [save=true] - Indique si les modifications doivent être sauvegardées (true) ou annulées (false).
   * @returns {void}
   */
  const handleEndEdit = useCallback((save: boolean = true) => {
    if (save && isValid) {
    } else if (!save) {
      setLocalValue(value);
      onChange(entityId, fieldKey, value);
    }
    onEndEdit(cellKey);
  }, [isValid, value, entityId, fieldKey, cellKey, onChange, onEndEdit]);

  /**
   * Gère les événements de pression de touche (KeyDown).
   * Gère la navigation au clavier (Enter, Tab, Escape, Arrow keys) et les actions associées (fin d'édition, navigation).
   * @param {React.KeyboardEvent} e - L'événement clavier.
   * @returns {void}
   */
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

  /**
   * Gère l'événement de perte de focus (Blur) sur le champ d'édition.
   * Utilise un délai pour permettre les clics sur d'autres éléments avant de terminer l'édition.
   * @returns {void}
   */
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      handleEndEdit(true);
    }, 150);
  }, [handleEndEdit]);

  /**
   * Rend un champ d'entrée de type texte.
   * @returns {JSX.Element} Le composant input text.
   */
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

  /**
   * Rend un champ d'entrée de type nombre.
   * @returns {JSX.Element} Le composant input number.
   */
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

  /**
   * Rend un champ de sélection (select/dropdown).
   * @returns {JSX.Element} Le composant select.
   */
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

  /**
   * Rend un champ d'entrée de type date.
   * @returns {JSX.Element} Le composant input date.
   */
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

  /**
   * Rend le champ d'édition approprié en fonction du type de colonne.
   * @returns {JSX.Element} Le champ d'édition (input, select, etc.).
   */
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

  /**
   * Rend la valeur affichée de la cellule en mode lecture.
   * Si la cellule est non éditable ou en lecture seule, affiche la valeur formatée.
   * Sinon, affiche un bouton cliquable pour passer en mode édition.
   * @returns {JSX.Element} L'élément affichant la valeur ou le bouton d'édition.
   */
  const renderDisplayValue = () => {
    if (column.type === 'readonly' || !isEditable) {
      const formattedValue = formatColumnValue(tableLevel, fieldKey, value);
      return (
        <span className={`text-sm ${!isEditable ? 'text-gray-400' : 'text-gray-900'}`}>
          {formattedValue || '-'}
        </span>
      );
    }
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

  /**
   * Rend l'icône de validation (✓ pour valide, ⚠ pour invalide) à côté du champ d'édition.
   * Ne s'affiche qu'en mode édition et pour les colonnes non 'readonly'.
   * @returns {JSX.Element | null} L'icône de validation ou null.
   */
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

  /**
   * Détermine les classes CSS pour la cellule en fonction de son état (erreur, non éditable).
   * @returns {string} Les classes CSS à appliquer à la cellule.
   */
  const getCellClasses = () => {
    let classes = 'relative min-h-[32px] flex items-center';
    
    if (hasError) {
      classes += ' bg-red-50';
    } else if (!isEditable) {
      classes += ' bg-gray-50';
    }
    
    return classes;
  };

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
      
      {hasError && !isEditing && (
        <div className="absolute z-10 top-full left-0 mt-1 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 whitespace-nowrap shadow-lg">
          Valeur invalide pour {column.label.toLowerCase()}
        </div>
      )}
    </div>
  );
}

/**
 * Hook personnalisé pour gérer la navigation au clavier entre les cellules d'un tableau.
 * Permet de se déplacer entre les cellules éditables d'une table à l'aide des touches fléchées, Entrée et Tab.
 *
 * @param {any[]} tableRows - Un tableau de toutes les lignes du tableau. Chaque ligne doit avoir un 'id' et une propriété 'isEditable'.
 * @param {DynamicColumn[]} columns - Un tableau des configurations de colonnes du tableau. Chaque colonne doit avoir une 'key' et une propriété 'type'.
 * @param {Set<string>} editingCells - Un Set contenant les clés des cellules actuellement en mode édition.
 * @param {(cellKey: string) => void} onStartEdit - La fonction à appeler pour démarrer l'édition d'une cellule cible.
 * @returns {(fromCellKey: string, direction: 'up' | 'down' | 'left' | 'right') => void} Une fonction `Maps` qui peut être appelée pour déclencher la navigation.
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