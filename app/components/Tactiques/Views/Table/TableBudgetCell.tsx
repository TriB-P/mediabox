// app/components/Tactiques/Views/Table/TableBudgetCell.tsx

/**
 * Composant spécialisé pour les cellules budget dans la table
 * Reproduit la logique complexe des calculs budgétaires du drawer
 * Gère automatiquement les recalculs et les dépendances
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DynamicColumn } from './TactiquesAdvancedTableView';
import { 
  calculateBudgetSummary, 
  getBudgetFieldDependencies, 
  validateBudgetData,
  formatBudgetValue 
} from './BudgetCalculationsHelper';

interface ClientFee {
  id: string;
  FE_Name: string;
  FE_Calculation_Type: 'Pourcentage budget' | 'Volume d\'unité' | 'Unités' | 'Frais fixe';
  FE_Calculation_Mode: 'Directement sur le budget média' | 'Applicable sur les frais précédents';
  FE_Order: number;
  options: {
    id: string;
    FO_Option: string;
    FO_Value: number;
    FO_Buffer: number;
    FO_Editable: boolean;
  }[];
}

interface AppliedFee {
  feeId: string;
  isActive: boolean;
  selectedOptionId?: string;
  customValue?: number;
  customUnits?: number;
  useCustomVolume?: boolean;
  customVolume?: number;
  calculatedAmount: number;
}

interface TableBudgetCellProps {
  entityId: string;
  fieldKey: string;
  value: any;
  column: DynamicColumn;
  rowData: any; // Toutes les données de la ligne pour les calculs
  isEditable: boolean;
  isEditing: boolean;
  clientFees: ClientFee[];
  exchangeRates: { [key: string]: number };
  campaignCurrency: string;
  onChange: (entityId: string, fieldKey: string, value: any) => void;
  onCalculatedChange: (entityId: string, updates: { [key: string]: any }) => void;
  onStartEdit: (cellKey: string) => void;
  onEndEdit: (cellKey: string) => void;
}

/**
 * Liste des champs budget qui nécessitent des calculs automatiques
 */
const BUDGET_FIELDS = [
  'TC_Budget_Mode',
  'TC_Budget',
  'TC_Currency',
  'TC_Unit_Type',
  'TC_Cost_Per_Unit',
  'TC_Unit_Volume',
  'TC_Has_Bonus',
  'TC_Real_Value',
  'TC_Bonus_Value',
  'TC_Media_Budget',
  'TC_Client_Budget',
  'TC_Total_Fees'
];

/**
 * Champs calculés automatiquement (lecture seule)
 */
const CALCULATED_FIELDS = [
  'TC_Unit_Volume',
  'TC_Media_Budget',
  'TC_Client_Budget',
  'TC_Bonus_Value',
  'TC_Total_Fees'
];

/**
 * Composant de cellule budget spécialisée
 */
export default function TableBudgetCell({
  entityId,
  fieldKey,
  value,
  column,
  rowData,
  isEditable,
  isEditing,
  clientFees,
  exchangeRates,
  campaignCurrency,
  onChange,
  onCalculatedChange,
  onStartEdit,
  onEndEdit
}: TableBudgetCellProps) {
  
  const [localValue, setLocalValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const cellKey = `${entityId}_${fieldKey}`;
  const isCalculatedField = CALCULATED_FIELDS.includes(fieldKey);
  const isBudgetField = BUDGET_FIELDS.includes(fieldKey);

  /**
   * Synchronise la valeur locale avec la prop
   */
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /**
   * Prépare les données pour les calculs budget
   */
  const budgetData = useMemo(() => {
    return {
      TC_Budget_Mode: rowData.TC_Budget_Mode || 'media',
      TC_Budget: rowData.TC_Budget || 0,
      TC_Currency: rowData.TC_Currency || 'CAD',
      TC_Unit_Type: rowData.TC_Unit_Type || '',
      TC_Cost_Per_Unit: rowData.TC_Cost_Per_Unit || 0,
      TC_Has_Bonus: rowData.TC_Has_Bonus || false,
      TC_Real_Value: rowData.TC_Real_Value || 0,
      appliedFees: rowData.appliedFees || [],
      ...rowData
    };
  }, [rowData]);

  /**
   * Calcule les valeurs budget dérivées
   */
  const budgetSummary = useMemo(() => {
    if (!isBudgetField || !budgetData.TC_Budget) {
      return null;
    }

    try {
      return calculateBudgetSummary(
        budgetData,
        clientFees,
        exchangeRates,
        campaignCurrency
      );
    } catch (error) {
      console.warn('Erreur calcul budget:', error);
      return null;
    }
  }, [budgetData, clientFees, exchangeRates, campaignCurrency, isBudgetField]);

  /**
   * Valide les données budget
   */
  const validationResult = useMemo(() => {
    if (!isBudgetField) return { isValid: true, errors: [] };
    return validateBudgetData(budgetData);
  }, [budgetData, isBudgetField]);

  /**
   * Met à jour la validation
   */
  useEffect(() => {
    setIsValid(validationResult.isValid);
    setValidationErrors(validationResult.errors);
  }, [validationResult]);

  /**
   * Gère les changements de valeur avec recalculs automatiques
   */
  const handleChange = useCallback((newValue: any) => {
    setLocalValue(newValue);
    
    // Appliquer le changement immédiatement
    onChange(entityId, fieldKey, newValue);

    // Si c'est un champ budget qui affecte d'autres calculs
    if (isBudgetField && budgetSummary) {
      const dependencies = getBudgetFieldDependencies(fieldKey);
      
      if (dependencies.length > 0) {
        // Calculer les nouvelles valeurs
        const updatedBudgetData = { ...budgetData, [fieldKey]: newValue };
        
        try {
          const newSummary = calculateBudgetSummary(
            updatedBudgetData,
            clientFees,
            exchangeRates,
            campaignCurrency
          );

          // Préparer les mises à jour
          const updates: { [key: string]: any } = {};
          
          if (dependencies.includes('TC_Unit_Volume')) {
            updates.TC_Unit_Volume = newSummary.unitVolume;
          }
          if (dependencies.includes('TC_Media_Budget')) {
            updates.TC_Media_Budget = newSummary.mediaBudget;
          }
          if (dependencies.includes('TC_Client_Budget')) {
            updates.TC_Client_Budget = newSummary.clientBudget;
          }
          if (dependencies.includes('TC_Bonus_Value')) {
            updates.TC_Bonus_Value = newSummary.bonusValue;
          }
          if (dependencies.includes('TC_Total_Fees')) {
            updates.TC_Total_Fees = newSummary.totalFees;
          }

          // Appliquer les mises à jour calculées
          if (Object.keys(updates).length > 0) {
            onCalculatedChange(entityId, updates);
          }
        } catch (error) {
          console.warn('Erreur recalcul budget:', error);
        }
      }
    }
  }, [
    entityId, 
    fieldKey, 
    budgetData, 
    budgetSummary, 
    clientFees, 
    exchangeRates, 
    campaignCurrency, 
    isBudgetField, 
    onChange, 
    onCalculatedChange
  ]);

  /**
   * Gère la fin d'édition
   */
  const handleEndEdit = useCallback(() => {
    onEndEdit(cellKey);
  }, [cellKey, onEndEdit]);

  /**
   * Gère les événements clavier
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        handleEndEdit();
        break;
      case 'Escape':
        e.preventDefault();
        setLocalValue(value); // Restaurer la valeur originale
        handleEndEdit();
        break;
    }
  }, [handleEndEdit, value]);

  /**
   * Formate la valeur pour l'affichage
   */
  const formattedValue = useMemo(() => {
    if (value === null || value === undefined || value === '') return '';

    // Pour les champs calculés, utiliser les valeurs du summary si disponible
    if (isCalculatedField && budgetSummary) {
      switch (fieldKey) {
        case 'TC_Unit_Volume':
          return formatBudgetValue(budgetSummary.unitVolume, 'number');
        case 'TC_Media_Budget':
          return formatBudgetValue(budgetSummary.mediaBudget, 'currency', budgetSummary.currency);
        case 'TC_Client_Budget':
          return formatBudgetValue(budgetSummary.clientBudget, 'currency', budgetSummary.currency);
        case 'TC_Bonus_Value':
          return formatBudgetValue(budgetSummary.bonusValue, 'currency', budgetSummary.currency);
        case 'TC_Total_Fees':
          return formatBudgetValue(budgetSummary.totalFees, 'currency', budgetSummary.currency);
      }
    }

    // Formatage standard selon le type de colonne
    switch (column.type) {
      case 'currency':
        return formatBudgetValue(value, 'currency', budgetData.TC_Currency);
      case 'number':
        return formatBudgetValue(value, 'number');
      default:
        return String(value);
    }
  }, [value, fieldKey, isCalculatedField, budgetSummary, column.type, budgetData.TC_Currency]);

  /**
   * Détermine si la cellule est vraiment éditable
   */
  const isActuallyEditable = isEditable && !isCalculatedField;

  /**
   * Rend le champ d'édition
   */
  const renderEditingField = () => {
    switch (column.type) {
      case 'select':
        return (
          <select
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleEndEdit}
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
            onBlur={handleEndEdit}
            onKeyDown={handleKeyDown}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
              isValid 
                ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' 
                : 'border-red-300 focus:border-red-500 focus:ring-red-500'
            }`}
            step={column.type === 'currency' ? '0.01' : '1'}
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
            onBlur={handleEndEdit}
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
        <span className={`text-sm ${
          isCalculatedField ? 'text-green-700 font-medium bg-green-50 px-2 py-1 rounded' : 
          !isEditable ? 'text-gray-400' : 'text-gray-900'
        }`}>
          {formattedValue || '-'}
          {isCalculatedField && (
            <span className="ml-1 text-xs text-green-600">✓</span>
          )}
        </span>
      );
    }

    return (
      <button
        onClick={() => onStartEdit(cellKey)}
        className={`w-full text-left px-2 py-1 text-sm rounded transition-colors min-h-[28px] flex items-center ${
          !isValid 
            ? 'hover:bg-red-50 text-red-700 border border-red-200' 
            : 'hover:bg-gray-50 text-gray-900'
        }`}
        title={`Cliquer pour modifier ${column.label.toLowerCase()}`}
      >
        {formattedValue || (
          <span className="text-gray-400 italic">
            Cliquer pour saisir
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={`relative min-h-[32px] flex items-center ${
      !isValid ? 'bg-red-50' : 
      isCalculatedField ? 'bg-green-50' : 
      !isEditable ? 'bg-gray-50' : ''
    }`}>
      {isEditing ? (
        <>
          {renderEditingField()}
          {!isValid && (
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
              <span className="text-red-500 text-xs">⚠</span>
            </div>
          )}
        </>
      ) : (
        renderDisplayValue()
      )}
      
      {!isValid && !isEditing && validationErrors.length > 0 && (
        <div className="absolute z-10 top-full left-0 mt-1 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 whitespace-nowrap shadow-lg">
          {validationErrors.join(', ')}
        </div>
      )}

      {isCalculatedField && !isEditing && (
        <div className="absolute z-10 top-full left-0 mt-1 p-2 bg-green-100 border border-green-300 rounded text-xs text-green-700 whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
          Valeur calculée automatiquement
        </div>
      )}
    </div>
  );
}