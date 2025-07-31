// app/components/Tactiques/Views/Table/ReactiveBudgetCell.tsx

/**
 * Composant de cellule budget réactif pour la vue tableau
 * Gère automatiquement les calculs et les mises à jour en temps réel
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DynamicColumn } from './TactiquesAdvancedTableView';
import { 
  BudgetRowData, 
  ClientFee, 
  calculateBudgetForRow, 
  shouldRecalculate, 
  getDependentFields,
  formatCurrency,
  formatNumber
} from './TableBudgetCalculations';

interface ReactiveBudgetCellProps {
  entityId: string;
  fieldKey: string;
  value: any;
  column: DynamicColumn;
  rowData: BudgetRowData;
  isEditable: boolean;
  isEditing: boolean;
  clientFees: ClientFee[];
  campaignCurrency: string;
  onChange: (entityId: string, fieldKey: string, value: any) => void;
  onCalculatedChange: (entityId: string, updates: { [key: string]: any }) => void;
  onStartEdit: (cellKey: string) => void;
  onEndEdit: (cellKey: string) => void;
}

/**
 * Champs qui sont calculés automatiquement (readonly)
 */
const CALCULATED_FIELDS = [
  'TC_Unit_Volume',
  'TC_Media_Budget',
  'TC_Client_Budget',
  'TC_Bonification',
  'TC_Total_Fees',
  'TC_Fee_1_Value',
  'TC_Fee_2_Value',
  'TC_Fee_3_Value',
  'TC_Fee_4_Value',
  'TC_Fee_5_Value'
];

/**
 * Champs budget qui nécessitent une validation spécialisée
 */
const BUDGET_FIELDS = [
  'TC_BudgetChoice',
  'TC_BudgetInput',
  'TC_Unit_Price',
  'TC_Unit_Type',
  'TC_BuyCurrency',
  'TC_Media_Value'
];

export default function ReactiveBudgetCell({
  entityId,
  fieldKey,
  value,
  column,
  rowData,
  isEditable,
  isEditing,
  clientFees,
  campaignCurrency,
  onChange,
  onCalculatedChange,
  onStartEdit,
  onEndEdit
}: ReactiveBudgetCellProps) {
  
  const [localValue, setLocalValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  
  const cellKey = `${entityId}_${fieldKey}`;
  const isCalculated = CALCULATED_FIELDS.includes(fieldKey);
  const isBudgetField = BUDGET_FIELDS.includes(fieldKey) || CALCULATED_FIELDS.includes(fieldKey);
  const isActuallyEditable = isEditable && !isCalculated;

  /**
   * Synchronise la valeur locale avec la prop
   */
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /**
   * Validation spécialisée pour les champs budget
   */
  const validateValue = useCallback((val: any): boolean => {
    if (val === null || val === undefined || val === '') return true;
    
    switch (fieldKey) {
      case 'TC_BudgetInput':
      case 'TC_Unit_Price':
      case 'TC_Media_Value':
        const numValue = Number(val);
        return !isNaN(numValue) && numValue >= 0;
        
      case 'TC_BudgetChoice':
        return ['media', 'client'].includes(val);
        
      case 'TC_BuyCurrency':
        return typeof val === 'string' && val.length > 0;
        
      default:
        return true;
    }
  }, [fieldKey]);

  /**
   * Met à jour la validation quand la valeur locale change
   */
  useEffect(() => {
    setIsValid(validateValue(localValue));
  }, [localValue, validateValue]);

  /**
   * Gère les changements de valeur avec recalculs automatiques
   */
  const handleChange = useCallback((newValue: any) => {
    setLocalValue(newValue);
    
    // Appliquer le changement immédiatement
    onChange(entityId, fieldKey, newValue);
    
    // Déclencher recalcul si nécessaire
    if (shouldRecalculate(fieldKey)) {
      // Créer les données mises à jour pour le calcul
      const updatedRowData = { ...rowData, [fieldKey]: newValue };
      
      // Effectuer le calcul complet
      const result = calculateBudgetForRow(updatedRowData, clientFees);
      
      // Préparer les mises à jour calculées
      const updates: { [key: string]: any } = {
        TC_Unit_Volume: result.unitVolume,
        TC_Media_Budget: result.mediaBudget,
        TC_Client_Budget: result.clientBudget,
        TC_Bonification: result.bonification,
        TC_Total_Fees: result.totalFees,
        ...result.feeAmounts
      };
      
      // Appliquer seulement les champs qui ont réellement changé
      const dependentFields = getDependentFields(fieldKey);
      const filteredUpdates: { [key: string]: any } = {};
      
      dependentFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });
      
      if (Object.keys(filteredUpdates).length > 0) {
        onCalculatedChange(entityId, filteredUpdates);
      }
    }
  }, [entityId, fieldKey, rowData, clientFees, onChange, onCalculatedChange]);

  /**
   * Gère les événements clavier
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        onEndEdit(cellKey);
        break;
      case 'Escape':
        e.preventDefault();
        setLocalValue(value); // Restaurer valeur originale
        onEndEdit(cellKey);
        break;
    }
  }, [cellKey, value, onEndEdit]);

  /**
   * Formate la valeur pour l'affichage
   */
  const formattedValue = useMemo(() => {
    if (value === null || value === undefined || value === '') return '';

    switch (column.type) {
      case 'select':
        // Pour les selects, afficher le label au lieu de l'ID
        const selectedOption = column.options?.find(option => option.id === value);
        return selectedOption ? selectedOption.label : String(value);
        
      case 'currency':
        const numValue = Number(value);
        if (isNaN(numValue)) return String(value);
        return formatCurrency(numValue, rowData.TC_BuyCurrency || campaignCurrency);
        
      case 'number':
        const numberValue = Number(value);
        if (isNaN(numberValue)) return String(value);
        return formatNumber(numberValue);
        
      case 'readonly':
        // Pour les champs readonly calculés, forcer le formatage selon le type de données
        if (fieldKey.includes('Budget') || fieldKey.includes('Fees') || fieldKey.includes('Value') || fieldKey.includes('Bonification')) {
          const currencyValue = Number(value);
          if (!isNaN(currencyValue)) {
            return formatCurrency(currencyValue, rowData.TC_BuyCurrency || campaignCurrency);
          }
        } else if (fieldKey.includes('Volume')) {
          const numericValue = Number(value);
          if (!isNaN(numericValue)) {
            return formatNumber(numericValue);
          }
        }
        return String(value);
        
      default:
        return String(value);
    }
  }, [value, column.type, column.options, rowData.TC_BuyCurrency, campaignCurrency, fieldKey]);

  /**
   * Rend le champ d'édition approprié
   */
  const renderEditingField = () => {
    switch (column.type) {
      case 'select':
        return (
          <select
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => onEndEdit(cellKey)}
            onKeyDown={handleKeyDown}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
              isValid 
                ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' 
                : 'border-red-300 focus:border-red-500 focus:ring-red-500'
            }`}
            autoFocus
          >
            <option value="">-- Sélectionner --</option>
            {column.options?.map(option => (
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
            value={localValue || ''}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            onBlur={() => onEndEdit(cellKey)}
            onKeyDown={handleKeyDown}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 text-center ${
              isValid 
                ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' 
                : 'border-red-300 focus:border-red-500 focus:ring-red-500'
            }`}
            step="0.01"
            min="0"
            autoFocus
          />
        );

      default:
        return (
          <input
            type="text"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => onEndEdit(cellKey)}
            onKeyDown={handleKeyDown}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
              isValid 
                ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' 
                : 'border-red-300 focus:border-red-500 focus:ring-red-500'
            }`}
            autoFocus
          />
        );
    }
  };

  /**
   * Rend la valeur en mode lecture
   */
  const renderDisplayValue = () => {
    if (!isActuallyEditable) {
      return (
        <div className={`w-full h-full flex items-center px-2 py-1 ${
          column.type === 'number' || column.type === 'currency' ? 'justify-center' : 'justify-start'
        } ${
          isCalculated ? 'text-green-700 font-medium' : 
          !isEditable ? 'text-gray-400' : 'text-gray-900'
        }`}>
          <span className="text-sm">{formattedValue || '-'}</span>
        </div>
      );
    }

    return (
      <div
        className={`w-full px-2 py-1 text-sm rounded transition-colors min-h-[28px] flex items-center cursor-pointer ${
          column.type === 'number' || column.type === 'currency' ? 'justify-center' : 'justify-start'
        } ${
          !isValid 
            ? 'hover:bg-red-50 text-red-700 border border-red-200' 
            : 'hover:bg-gray-50 text-gray-900 mx-1'
        }`}
        title={`Double-cliquer pour modifier ${column.label.toLowerCase()}`}
      >
        {formattedValue || (
          <span className="text-gray-400 italic">
            Double-clic pour modifier
          </span>
        )}
      </div>
    );
  };

  /**
   * Classes CSS pour le conteneur
   */
  const containerClasses = useMemo(() => {
    let classes = 'relative min-h-[32px] flex items-center';
    
    if (!isValid) {
      classes += ' bg-red-50';
    } else if (isCalculated) {
      classes += ' bg-green-50';
    } else if (!isEditable) {
      classes += ' bg-gray-50';
    }
    
    return classes;
  }, [isValid, isCalculated, isEditable]);

  return (
    <div className={containerClasses}>
      {isEditing ? (
        <>
          {renderEditingField()}
          {!isValid && (
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
              <span className="text-red-500 text-xs" title="Valeur invalide">⚠</span>
            </div>
          )}
        </>
      ) : (
        renderDisplayValue()
      )}
 
    </div>
  );
}