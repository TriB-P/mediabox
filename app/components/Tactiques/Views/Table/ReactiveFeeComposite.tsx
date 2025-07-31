// app/components/Tactiques/Views/Table/ReactiveFeeComposite.tsx

/**
 * Composant de frais composite réactif pour la vue tableau
 * Gère automatiquement les calculs de frais en temps réel
 */
'use client';

import React, { useCallback, useMemo } from 'react';
import { FeeColumnDefinition } from './budgetColumns.config';
import { 
  BudgetRowData, 
  ClientFee, 
  calculateBudgetForRow,
  formatCurrency
} from './TableBudgetCalculations';

interface ReactiveFeeCompositeProps {
  entityId: string;
  column: FeeColumnDefinition;
  rowData: BudgetRowData;
  isEditable: boolean;
  clientFees: ClientFee[];
  currency: string;
  isSelected: boolean;
  hasValidationError: boolean;
  onChange: (entityId: string, fieldKey: string, value: any) => void;
  onCalculatedChange: (entityId: string, updates: { [key: string]: any }) => void;
  onClick: () => void;
  pendingChanges?: Partial<BudgetRowData>;
}

export default function ReactiveFeeComposite({
  entityId,
  column,
  rowData,
  isEditable,
  clientFees,
  currency,
  isSelected,
  hasValidationError,
  onChange,
  onCalculatedChange,
  onClick,
  pendingChanges = {}
}: ReactiveFeeCompositeProps) {
  
  const feeNumber = column.feeNumber;
  
  // Clés des champs pour ce frais
  const fieldKeys = useMemo(() => ({
    enabled: `TC_Fee_${feeNumber}_Enabled`,
    option: `TC_Fee_${feeNumber}_Option`,
    volume: `TC_Fee_${feeNumber}_Volume`,
    value: `TC_Fee_${feeNumber}_Value`
  }), [feeNumber]);
  
  // Valeurs actuelles (avec pendingChanges prioritaires)
  const currentValues = useMemo(() => ({
    isEnabled: Boolean(pendingChanges[fieldKeys.enabled] ?? rowData[fieldKeys.enabled] ?? false),
    selectedOptionId: pendingChanges[fieldKeys.option] ?? rowData[fieldKeys.option] ?? '',
    customVolume: Number(pendingChanges[fieldKeys.volume] ?? rowData[fieldKeys.volume] ?? 0),
    calculatedAmount: Number(pendingChanges[fieldKeys.value] ?? rowData[fieldKeys.value] ?? 0)
  }), [pendingChanges, rowData, fieldKeys]);
  
  // Trouve le frais associé
  const associatedFee = useMemo(() => {
    return clientFees.find(fee => fee.FE_Order === feeNumber);
  }, [clientFees, feeNumber]);
  
  // Options et option sélectionnée
  const availableOptions = associatedFee?.options || [];
  const selectedOption = availableOptions.find(opt => opt.id === currentValues.selectedOptionId);
  const showCustomValue = selectedOption?.FO_Editable || false;
  
  // Montant formaté
  const formattedAmount = useMemo(() => {
    return currentValues.calculatedAmount > 0 ? 
      formatCurrency(currentValues.calculatedAmount, currency) : '-';
  }, [currentValues.calculatedAmount, currency]);
  
  /**
   * Effectue un recalcul complet et met à jour les champs calculés
   */
  const triggerRecalculation = useCallback((updatedRowData: BudgetRowData) => {
    const result = calculateBudgetForRow(updatedRowData, clientFees);
    
    // Mettre à jour tous les champs calculés
    const updates: { [key: string]: any } = {
      TC_Unit_Volume: result.unitVolume,
      TC_Media_Budget: result.mediaBudget,
      TC_Client_Budget: result.clientBudget,
      TC_Bonification: result.bonification,
      TC_Total_Fees: result.totalFees,
      ...result.feeAmounts
    };
    
    onCalculatedChange(entityId, updates);
  }, [entityId, clientFees, onCalculatedChange]);
  
  /**
   * Gère le changement de l'état activé/désactivé
   */
  const handleEnabledChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const checked = e.target.checked;
    
    // Mettre à jour l'état enabled
    onChange(entityId, fieldKeys.enabled, checked);
    
    if (!checked) {
      // Si désactivé, vider les autres champs
      onChange(entityId, fieldKeys.option, '');
      onChange(entityId, fieldKeys.volume, 0);
    }
    
    // Recalculer avec les nouveaux états
    const updatedRowData = {
      ...rowData,
      ...pendingChanges,
      [fieldKeys.enabled]: checked,
      ...(checked ? {} : {
        [fieldKeys.option]: '',
        [fieldKeys.volume]: 0
      })
    };
    
    triggerRecalculation(updatedRowData);
  }, [entityId, fieldKeys, onChange, rowData, pendingChanges, triggerRecalculation]);
  
  /**
   * Gère le changement d'option sélectionnée
   */
  const handleOptionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const optionId = e.target.value;
    
    onChange(entityId, fieldKeys.option, optionId);
    
    if (!optionId) {
      onChange(entityId, fieldKeys.volume, 0);
    }
    
    // Recalculer avec la nouvelle option
    const updatedRowData = {
      ...rowData,
      ...pendingChanges,
      [fieldKeys.option]: optionId,
      ...(optionId ? {} : { [fieldKeys.volume]: 0 })
    };
    
    triggerRecalculation(updatedRowData);
  }, [entityId, fieldKeys, onChange, rowData, pendingChanges, triggerRecalculation]);
  
  /**
   * Gère le changement de valeur personnalisée
   */
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = parseFloat(e.target.value) || 0;
    
    onChange(entityId, fieldKeys.volume, value);
    
    // Recalculer avec la nouvelle valeur
    const updatedRowData = {
      ...rowData,
      ...pendingChanges,
      [fieldKeys.volume]: value
    };
    
    triggerRecalculation(updatedRowData);
  }, [entityId, fieldKeys, onChange, rowData, pendingChanges, triggerRecalculation]);
  
  // Si pas de frais associé
  if (!associatedFee) {
    return (
      <div 
        className={`h-12 flex items-center justify-center text-gray-400 text-sm ${
          isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-gray-100'
        }`}
        onClick={onClick}
      >
        <span>Aucun frais #{feeNumber}</span>
      </div>
    );
  }
  
  return (
    <div 
      className={`relative border border-gray-200 rounded transition-all ${
        isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-white hover:bg-gray-50'
      } ${hasValidationError ? 'ring-2 ring-red-500 ring-inset bg-red-50' : ''}`}
    >
      <div className="flex h-12">
        
        {/* 1. Checkbox Activer/Désactiver */}
        <div className="flex items-center justify-center w-8 border-r border-gray-200">
          <input
            type="checkbox"
            checked={currentValues.isEnabled}
            onChange={handleEnabledChange}
            disabled={!isEditable}
            className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
            title={`${currentValues.isEnabled ? 'Désactiver' : 'Activer'} ${associatedFee.FE_Name}`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* 2. Menu déroulant Option */}
        <div className="flex-1 border-r border-gray-200 min-w-0" style={{ minWidth: '180px' }}>
          <select
            value={currentValues.selectedOptionId}
            onChange={handleOptionChange}
            disabled={!isEditable || !currentValues.isEnabled}
            className={`w-full h-full px-2 text-xs border-0 focus:ring-0 focus:outline-none transition-colors ${
              !currentValues.isEnabled ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'
            }`}
            title={currentValues.isEnabled ? 'Sélectionner une option' : 'Activer le frais pour sélectionner'}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">-- Option --</option>
            {availableOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.FO_Option}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Valeur personnalisée (si éditable) */}
        <div className="w-20 border-r border-gray-200">
          {showCustomValue && currentValues.isEnabled ? (
            <input
              type="number"
              value={currentValues.customVolume || ''}
              onChange={handleVolumeChange}
              disabled={!isEditable}
              className="w-full h-full px-1 text-xs border-0 focus:ring-0 focus:outline-none text-center bg-yellow-50 hover:bg-yellow-100 transition-colors"
              min="0"
              step="0.01"
              title="Valeur personnalisée"
              placeholder="0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
              {currentValues.isEnabled && selectedOption && !selectedOption.FO_Editable ? (
                <span title="Valeur fixe">=</span>
              ) : (
                <span>-</span>
              )}
            </div>
          )}
        </div>

        {/* 4. Montant calculé (readonly) */}
        <div 
          className="w-20 flex items-center justify-center px-2 cursor-pointer transition-colors hover:bg-gray-50"
          title="Cliquer pour sélectionner la cellule"
        >
          <span className={`text-xs font-medium transition-colors ${
            currentValues.calculatedAmount > 0 ? 'text-green-700' : 'text-gray-400'
          }`}>
            {formattedAmount}
          </span>
        </div>

      </div>

      {/* Indicateur d'erreur */}
      {hasValidationError && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      )}
    </div>
  );
}

/**
 * Version lecture seule du composant frais composite
 */
export function ReactiveFeeCompositeReadonly({
  column,
  rowData,
  clientFees,
  currency,
  isSelected,
  onClick,
  pendingChanges = {}
}: Omit<ReactiveFeeCompositeProps, 'entityId' | 'isEditable' | 'hasValidationError' | 'onChange' | 'onCalculatedChange'>) {
  
  const feeNumber = column.feeNumber;
  
  const fieldKeys = {
    enabled: `TC_Fee_${feeNumber}_Enabled`,
    option: `TC_Fee_${feeNumber}_Option`,
    value: `TC_Fee_${feeNumber}_Value`
  };
  
  const isEnabled = Boolean(pendingChanges[fieldKeys.enabled] ?? rowData[fieldKeys.enabled] ?? false);
  const selectedOptionId = pendingChanges[fieldKeys.option] ?? rowData[fieldKeys.option] ?? '';
  const calculatedAmount = Number(pendingChanges[fieldKeys.value] ?? rowData[fieldKeys.value] ?? 0);

  const associatedFee = clientFees.find(fee => fee.FE_Order === feeNumber);
  const selectedOption = associatedFee?.options.find(opt => opt.id === selectedOptionId);

  const formattedAmount = calculatedAmount > 0 ? 
    formatCurrency(calculatedAmount, currency) : '-';

  if (!associatedFee) {
    return (
      <div 
        className={`h-12 flex items-center justify-center text-gray-400 text-sm ${
          isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-gray-100'
        }`}
        onClick={onClick}
      >
        Aucun frais #{feeNumber}
      </div>
    );
  }

  return (
    <div 
      className={`relative border border-gray-200 rounded bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'hover:bg-gray-100'
      }`}
    >
      <div className="flex h-12 items-center px-2 text-xs text-gray-600">
        <div className="flex items-center space-x-2 flex-1">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
          <span className="flex-1 truncate">
            {selectedOption?.FO_Option || 'Aucune option'}
          </span>
          <span className="font-medium text-gray-800 text-center">
            {formattedAmount}
          </span>
        </div>
      </div>
    </div>
  );
}