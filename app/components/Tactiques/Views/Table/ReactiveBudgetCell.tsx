// app/components/Tactiques/Views/Table/ReactiveBudgetCell.tsx

/**
 * Version simplifiée qui n'effectue AUCUN calcul
 * Tous les calculs sont gérés par DynamicTableStructure via budgetService
 * MODIFIÉ : Ajout du support multilingue
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DynamicColumn } from './TactiquesAdvancedTableView';
import { ClientFee as BudgetClientFee } from '../../../../lib/budgetService';
import { useTranslation } from '../../../../contexts/LanguageContext';

interface ReactiveBudgetCellProps {
  entityId: string;
  fieldKey: string;
  value: any;
  column: DynamicColumn;
  rowData: any; // Données complètes de la ligne
  isEditable: boolean;
  isEditing: boolean;
  clientFees: BudgetClientFee[];
  campaignCurrency: string;
  onChange: (entityId: string, fieldKey: string, value: any) => void;
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
  'TC_Currency_Rate',
  'TC_Delta',
  'TC_Fee_1_Value',
  'TC_Fee_2_Value',
  'TC_Fee_3_Value',
  'TC_Fee_4_Value',
  'TC_Fee_5_Value'
];

/**
 * Composant de cellule budget simplifié - ne fait AUCUN calcul
 * MODIFIÉ : Ajout du support multilingue
 */
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
  onStartEdit,
  onEndEdit
}: ReactiveBudgetCellProps) {
  
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  
  const cellKey = `${entityId}_${fieldKey}`;
  const isCalculated = CALCULATED_FIELDS.includes(fieldKey);
  const isActuallyEditable = isEditable && !isCalculated;

  /**
   * Synchronise la valeur locale avec la prop
   */
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /**
   * Validation de base (sans calculs)
   */
  const validateValue = useCallback((val: any): boolean => {
    if (val === null || val === undefined || val === '') return true;
    
    switch (fieldKey) {
      case 'TC_BudgetInput':
      case 'TC_Unit_Price':
      case 'TC_Media_Value':
        const numValue = Number(val);
        return !isNaN(numValue) && numValue >= 0;
        
      case 'TC_Budget_Mode':
        return ['media', 'client'].includes(val);
        
      case 'TC_BuyCurrency':
        return typeof val === 'string' && val.length > 0;
        
      default:
        return true;
    }
  }, [fieldKey]);

  /**
   * Met à jour la validation
   */
  useEffect(() => {
    setIsValid(validateValue(localValue));
  }, [localValue, validateValue]);

  /**
   * SIMPLIFIÉ : Gère les changements sans calculs
   * Les calculs sont maintenant gérés par DynamicTableStructure
   */
  const handleChange = useCallback((newValue: any) => {
    setLocalValue(newValue);
    
    // Appliquer le changement - les calculs sont gérés ailleurs
    onChange(entityId, fieldKey, newValue);
  }, [entityId, fieldKey, onChange]);

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
   * CORRIGÉ : Gestion correcte des valeurs 0 et suppression du "$" pour TC_Unit_Volume
   */
const formattedValue = useMemo(() => {
  // ✅ CORRECTION : Traitement explicite des valeurs 0 et null/undefined
  if (value === null || value === undefined) return '';
  if (value === 0) {
    // ✅ CORRECTION : TC_Unit_Volume ne doit jamais avoir de "$"
    if (fieldKey === 'TC_Unit_Volume') {
      return '0';
    }
    // Pour les champs calculés, afficher "0" au lieu de "-"
    if (isCalculated) {
      switch (column.type) {
        case 'currency':
        case 'readonly':
          const currency = rowData.TC_BuyCurrency || campaignCurrency;
          return new Intl.NumberFormat('fr-CA', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(0);
        case 'number':
          return '0';
        default:
          return '0';
      }
    }
    // Pour les champs éditables, permettre l'affichage de 0
    return value.toString();
  }
  if (value === '') return '';

  // ✅ CORRECTION : TC_Unit_Volume traité spécialement AVANT les autres types
  if (fieldKey === 'TC_Unit_Volume') {
    const numberValue = Number(value);
    if (isNaN(numberValue)) return String(value);
    
    // Formatage spécial pour le volume (sans décimales et SANS DEVISE)
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numberValue);
  }

  switch (column.type) {
    case 'select':
      const selectedOption = column.options?.find(option => option.id === value);
      return selectedOption ? selectedOption.label : String(value);
      
    case 'currency':
    case 'readonly': // Pour les champs calculés
      const numValue = Number(value);
      if (isNaN(numValue)) return String(value);
      
      // Formater en devise
      const currency = rowData.TC_BuyCurrency || campaignCurrency;
      return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numValue);
      
    case 'number':
      const numberValue = Number(value);
      if (isNaN(numberValue)) return String(value);
      
      return new Intl.NumberFormat('fr-CA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      }).format(numberValue);
      
    default:
      return String(value);
  }
}, [value, column.type, column.options, rowData.TC_BuyCurrency, campaignCurrency, fieldKey, isCalculated]);

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
            <option value="">{t('table.select.placeholder')}</option>
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
            step={fieldKey === 'TC_Unit_Price' ? '0.0001' : '0.01'}
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
          isCalculated ? 'text-green-700 font-medium bg-green-50' : 
          !isEditable ? 'text-gray-400 bg-gray-50' : 'text-gray-900'
        }`}>
          <span className="text-sm">{formattedValue || '-'}</span>
          {isCalculated && (
            <span className="ml-1 text-xs text-green-600" title={t('table.budget.autoCalculated')}>
              ✓
            </span>
          )}
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
        title={t('table.cell.doubleClickToEditField', { field: column.label.toLowerCase() })}
      >
        {formattedValue || (
          <span className="text-gray-400 italic">
            {t('table.cell.doubleClickToEdit')}
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
              <span className="text-red-500 text-xs" title={t('table.validation.invalidValue')}>⚠</span>
            </div>
          )}
        </>
      ) : (
        renderDisplayValue()
      )}
    </div>
  );
}