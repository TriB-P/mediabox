// app/components/Tactiques/Views/Table/FeeCompositeCell.tsx

/**
 * Version finale complète et fonctionnelle du composant frais
 */
'use client';

import React, { useMemo, useCallback } from 'react';
import { FeeColumnDefinition, getFeeFieldKeys } from './budgetColumns.config';

interface ClientFee {
  id: string;
  FE_Name: string;
  FE_Calculation_Type: string;
  FE_Calculation_Mode: string;
  FE_Order: number;
  options: {
    id: string;
    FO_Option: string;
    FO_Value: number;
    FO_Buffer: number;
    FO_Editable: boolean;
  }[];
}

interface FeeCompositeCellProps {
  entityId: string;
  column: FeeColumnDefinition;
  rowData: any;
  isEditable: boolean;
  clientFees: ClientFee[];
  currency: string;
  isSelected: boolean;
  hasValidationError: boolean;
  onChange: (entityId: string, fieldKey: string, value: any) => void;
  onCalculatedChange: (entityId: string, updates: { [key: string]: any }) => void;
  onClick: () => void;
  pendingChanges?: Partial<any>;
}

export default function FeeCompositeCell({
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
}: FeeCompositeCellProps) {
  
  const fieldKeys = getFeeFieldKeys(column.feeNumber);
  
  // Valeurs actuelles (version qui fonctionne)
  const isEnabled = Boolean(pendingChanges[fieldKeys.enabled] ?? rowData[fieldKeys.enabled] ?? false);
  const selectedOptionId = pendingChanges[fieldKeys.option] ?? rowData[fieldKeys.option] ?? '';
  const customValue = Number(pendingChanges[fieldKeys.customValue] ?? rowData[fieldKeys.customValue] ?? 0);
  const calculatedAmount = Number(pendingChanges[fieldKeys.calculatedAmount] ?? rowData[fieldKeys.calculatedAmount] ?? 0);

  // Trouve le frais correspondant
  const associatedFee = useMemo(() => {
    return clientFees.find(fee => fee.FE_Order === column.feeNumber);
  }, [clientFees, column.feeNumber]);

  // Options disponibles
  const availableOptions = associatedFee?.options || [];
  const selectedOption = availableOptions.find(opt => opt.id === selectedOptionId);
  const showCustomValue = selectedOption?.FO_Editable || false;

  // Montant formaté
  const formattedAmount = calculatedAmount > 0 ? 
    new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(calculatedAmount) : '-';

  // Gestionnaire checkbox (version qui fonctionne)
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const checked = e.target.checked;
    
    onChange(entityId, fieldKeys.enabled, checked);
    
    if (!checked) {
      // Si désactivé, vider les autres champs
      onChange(entityId, fieldKeys.option, '');
      onChange(entityId, fieldKeys.customValue, 0);
      onCalculatedChange(entityId, {
        [fieldKeys.calculatedAmount]: 0
      });
    }
  };

  // Gestionnaire pour les options
  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const optionId = e.target.value;
    
    onChange(entityId, fieldKeys.option, optionId);
    
    if (!optionId) {
      onChange(entityId, fieldKeys.customValue, 0);
    }
  };

  // Gestionnaire pour la valeur personnalisée
  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = parseFloat(e.target.value) || 0;
    
    onChange(entityId, fieldKeys.customValue, value);
  };

  // Fonction de calcul du montant des frais
  const recalculateFeeAmount = useCallback((optionId: string, customVal: number) => {
    if (!isEnabled || !optionId || !associatedFee) {
      onCalculatedChange(entityId, {
        [fieldKeys.calculatedAmount]: 0
      });
      return;
    }

    const option = availableOptions.find(opt => opt.id === optionId);
    if (!option) {
      onCalculatedChange(entityId, {
        [fieldKeys.calculatedAmount]: 0
      });
      return;
    }

    // Utiliser la valeur personnalisée si le frais est éditable, sinon la valeur par défaut
    const baseValue = option.FO_Editable && customVal > 0 ? customVal : option.FO_Value;
    
    // Appliquer le buffer
    const bufferMultiplier = (100 + option.FO_Buffer) / 100;
    const finalAmount = baseValue * bufferMultiplier;

    // DEBUG temporaire pour les calculs
    console.log(`[CALCUL] ${associatedFee.FE_Name} - ${option.FO_Option}: ${baseValue} × ${bufferMultiplier} = ${finalAmount.toFixed(2)}`);

    onCalculatedChange(entityId, {
      [fieldKeys.calculatedAmount]: Math.round(finalAmount * 100) / 100
    });
  }, [isEnabled, associatedFee, availableOptions, entityId, fieldKeys.calculatedAmount, onCalculatedChange]);

  // Effet pour recalculer automatiquement quand les valeurs changent
  React.useEffect(() => {
    if (isEnabled && selectedOptionId) {
      recalculateFeeAmount(selectedOptionId, customValue);
    } else if (!isEnabled) {
      // Si désactivé, mettre le montant à 0
      onCalculatedChange(entityId, {
        [fieldKeys.calculatedAmount]: 0
      });
    }
  }, [isEnabled, selectedOptionId, customValue, recalculateFeeAmount, entityId, fieldKeys.calculatedAmount, onCalculatedChange]);

  // Si pas de frais associé
  if (!associatedFee) {
    return (
      <div 
        className={`h-12 flex items-center justify-center text-gray-400 text-sm ${
          isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-gray-100'
        }`}
        onClick={onClick}
      >
        Aucun frais
      </div>
    );
  }

  return (
    <div 
      className={`relative border border-gray-200 rounded ${
        isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-white'
      } ${hasValidationError ? 'ring-2 ring-red-500 ring-inset bg-red-50' : ''}`}
    >
      <div className="flex h-12">
        
        {/* 1. Checkbox Activer/Désactiver */}
        <div className="flex items-center justify-center w-8 border-r border-gray-200">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleCheckboxChange}
            disabled={!isEditable}
            className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            title={`${isEnabled ? 'Désactiver' : 'Activer'} ${associatedFee?.FE_Name}`}
          />
        </div>

        {/* 2. Menu déroulant Option */}
        <div className="flex-1 border-r border-gray-200 min-w-0">
          <select
            value={selectedOptionId}
            onChange={handleOptionChange}
            disabled={!isEditable || !isEnabled}
            className={`w-full h-full px-2 text-xs border-0 focus:ring-0 focus:outline-none ${
              !isEnabled ? 'bg-gray-100 text-gray-400' : 'bg-white'
            }`}
            title={isEnabled ? 'Sélectionner une option' : 'Activer le frais pour sélectionner'}
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
        <div className="w-16 border-r border-gray-200">
          {showCustomValue && isEnabled ? (
            <input
              type="number"
              value={customValue || ''}
              onChange={handleCustomValueChange}
              disabled={!isEditable}
              className="w-full h-full px-1 text-xs border-0 focus:ring-0 focus:outline-none text-center"
              min="0"
              step="0.01"
              title="Valeur personnalisée"
              placeholder="0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
              -
            </div>
          )}
        </div>

        {/* 4. Montant calculé (readonly) */}
        <div 
          className="w-20 flex items-center justify-end px-2 cursor-pointer hover:bg-gray-50"
          onClick={onClick}
          title="Cliquer pour sélectionner la cellule"
        >
          <span className={`text-xs font-medium ${
            calculatedAmount > 0 ? 'text-green-700' : 'text-gray-400'
          }`}>
            {formattedAmount}
          </span>
        </div>

      </div>

      {/* Indicateur d'erreur */}
      {hasValidationError && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      )}
    </div>
  );
}

export function FeeCompositeCellReadonly({
  column,
  rowData,
  clientFees,
  currency,
  isSelected,
  onClick,
  pendingChanges = {}
}: Omit<FeeCompositeCellProps, 'entityId' | 'isEditable' | 'hasValidationError' | 'onChange' | 'onCalculatedChange'>) {
  
  const fieldKeys = getFeeFieldKeys(column.feeNumber);
  
  const isEnabled = Boolean(pendingChanges[fieldKeys.enabled] ?? rowData[fieldKeys.enabled] ?? false);
  const selectedOptionId = pendingChanges[fieldKeys.option] ?? rowData[fieldKeys.option] ?? '';
  const calculatedAmount = Number(pendingChanges[fieldKeys.calculatedAmount] ?? rowData[fieldKeys.calculatedAmount] ?? 0);

  const associatedFee = clientFees.find(fee => fee.FE_Order === column.feeNumber);
  const selectedOption = associatedFee?.options.find(opt => opt.id === selectedOptionId);

  const formattedAmount = calculatedAmount > 0 ? 
    new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(calculatedAmount) : '-';

  if (!associatedFee) {
    return (
      <div 
        className={`h-12 flex items-center justify-center text-gray-400 text-sm ${
          isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-gray-100'
        }`}
        onClick={onClick}
      >
        Aucun frais
      </div>
    );
  }

  return (
    <div 
      className={`relative border border-gray-200 rounded bg-gray-50 ${
        isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex h-12 items-center px-2 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
          <span className="flex-1 truncate">
            {selectedOption?.FO_Option || 'Aucune option'}
          </span>
          <span className="font-medium text-gray-800">
            {formattedAmount}
          </span>
        </div>
      </div>
    </div>
  );
}