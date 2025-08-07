// app/components/Tactiques/Views/Table/ReactiveFeeComposite.tsx

/**
 * Version simplifiée qui n'effectue AUCUN calcul
 * Tous les calculs sont gérés par DynamicTableStructure via budgetService
 */
'use client';

import React, { useCallback, useMemo } from 'react';
import { FeeColumnDefinition } from './budgetColumns.config';
import { Fee } from '../../../../lib/tactiqueListService';

interface ReactiveFeeCompositeProps {
  entityId: string;
  column: FeeColumnDefinition;
  rowData: any;
  isEditable: boolean;
  clientFees: Fee[];
  currency: string;
  isSelected: boolean;
  hasValidationError: boolean;
  onChange: (entityId: string, fieldKey: string, value: any) => void;
  onClick: () => void;
  pendingChanges?: Partial<any>;
}

/**
 * Version lecture seule
 */
export function ReactiveFeeCompositeReadonly({
  column,
  rowData,
  clientFees,
  currency,
  isSelected,
  onClick,
  pendingChanges = {}
}: Omit<ReactiveFeeCompositeProps, 'entityId' | 'isEditable' | 'hasValidationError' | 'onChange'>) {
  
  const feeNumber = column.feeNumber;
  
  // Trouver l'index séquentiel pour les champs de données
  const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
  const feeIndex = sortedFees.findIndex(fee => fee.FE_Order === feeNumber);
  const sequentialNumber = feeIndex + 1;
  
  const fieldKeys = {
    option: `TC_Fee_${sequentialNumber}_Option`,
    value: `TC_Fee_${sequentialNumber}_Value`
  };
  
  // Valeurs actuelles
  const selectedOptionId = pendingChanges[fieldKeys.option] ?? rowData[fieldKeys.option] ?? '';
  const calculatedAmount = Number(pendingChanges[fieldKeys.value] ?? rowData[fieldKeys.value] ?? 0);
  const isEnabled = Boolean(selectedOptionId && selectedOptionId !== '');

  // Frais associé
  const associatedFee = sortedFees[feeIndex];
  const selectedOption = associatedFee?.options.find(opt => opt.id === selectedOptionId);

  const formattedAmount = calculatedAmount > 0 ? 
    formatCurrency(calculatedAmount, currency) : '-';

  if (!associatedFee || feeIndex === -1) {
    return (
      <div 
        className={`h-12 flex items-center justify-center text-gray-400 text-sm ${
          isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-gray-100'
        }`}
        onClick={onClick}
      >
        Frais #{feeNumber} introuvable
      </div>
    );
  }

  return (
    <div 
      className={`relative border border-gray-200 rounded bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <div className="flex h-12 items-center px-2 text-xs text-gray-600">
        <div className="flex items-center space-x-2 flex-1">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isEnabled ? 'bg-green-500' : 'bg-gray-300'
          }`}></span>
          
          <span className="flex-1 truncate">
            {selectedOption?.FO_Option || 'Aucune option'}
          </span>
          
          <span className={`font-medium text-center ${
            calculatedAmount > 0 ? 'text-green-700' : 'text-gray-400'
          }`}>
            {formattedAmount}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Fonction utilitaire pour formater la devise
 */
function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Composant principal - version simplifiée
 */
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
  onClick,
  pendingChanges = {}
}: ReactiveFeeCompositeProps) {
  
  const feeNumber = column.feeNumber;
  
  // Trouver l'index séquentiel pour les champs de données
  const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
  const feeIndex = sortedFees.findIndex(fee => fee.FE_Order === feeNumber);
  const sequentialNumber = feeIndex + 1;
  
  const fieldKeys = useMemo(() => ({
    option: `TC_Fee_${sequentialNumber}_Option`,
    volume: `TC_Fee_${sequentialNumber}_Volume`,
    value: `TC_Fee_${sequentialNumber}_Value`
  }), [sequentialNumber]);
  
  // Valeurs actuelles
  const currentValues = useMemo(() => {
    const selectedOptionId = pendingChanges[fieldKeys.option] ?? rowData[fieldKeys.option] ?? '';
    
    return {
      isEnabled: Boolean(selectedOptionId && selectedOptionId !== ''),
      selectedOptionId,
      customVolume: Number(pendingChanges[fieldKeys.volume] ?? rowData[fieldKeys.volume] ?? 0),
      calculatedAmount: Number(pendingChanges[fieldKeys.value] ?? rowData[fieldKeys.value] ?? 0)
    };
  }, [pendingChanges, rowData, fieldKeys]);
  
  // Frais associé
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
   * SIMPLIFIÉ : Gère le changement d'état sans calculs
   */
  const handleEnabledChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const checked = e.target.checked;
    
    if (checked) {
      // Activer : sélectionner la première option disponible
      if (availableOptions.length === 1) {
        onChange(entityId, fieldKeys.option, availableOptions[0].id);
      } else if (availableOptions.length > 1) {
        onChange(entityId, fieldKeys.option, 'ACTIVE_NO_SELECTION');
      }
    } else {
      // Désactiver : vider l'option et les autres champs
      onChange(entityId, fieldKeys.option, '');
      onChange(entityId, fieldKeys.volume, 0);
    }
    
    // Les calculs sont maintenant gérés par DynamicTableStructure
  }, [entityId, fieldKeys, onChange, availableOptions]);
  
  /**
   * SIMPLIFIÉ : Gère le changement d'option sans calculs
   */
  const handleOptionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const optionId = e.target.value;
    
    onChange(entityId, fieldKeys.option, optionId);
    
    if (!optionId) {
      onChange(entityId, fieldKeys.volume, 0);
    }
    
    // Les calculs sont maintenant gérés par DynamicTableStructure
  }, [entityId, fieldKeys, onChange]);
  
  /**
   * SIMPLIFIÉ : Gère le changement de valeur sans calculs
   */
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = parseFloat(e.target.value) || 0;
    
    onChange(entityId, fieldKeys.volume, value);
    
    // Les calculs sont maintenant gérés par DynamicTableStructure
  }, [entityId, fieldKeys, onChange]);
  
  // Si pas de frais associé
  if (!associatedFee || feeIndex === -1) {
    return (
      <div 
        className={`h-12 flex items-center justify-center text-gray-400 text-sm ${
          isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-gray-100'
        }`}
        onClick={onClick}
      >
        <span>Frais #{feeNumber} introuvable</span>
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
          title="Montant calculé automatiquement"
        >
          <span className={`text-xs font-medium transition-colors ${
            currentValues.calculatedAmount > 0 ? 'text-green-700' : 'text-gray-400'
          }`}>
            {formattedAmount}
          </span>
          {currentValues.calculatedAmount > 0 && (
            <span className="ml-1 text-xs text-green-600" title="Calculé automatiquement">
              ✓
            </span>
          )}
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