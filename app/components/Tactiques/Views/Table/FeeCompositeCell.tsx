// app/components/Tactiques/Views/Table/FeeCompositeCell.tsx

/**
 * Composant cellule composite pour les frais
 * Affiche une colonne large avec 4 sous-éléments :
 * - Checkbox (activer/désactiver)
 * - Select (option du frais)  
 * - Input (valeur personnalisée si éditable)
 * - Display (montant calculé, readonly)
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
}

/**
 * Composant de cellule composite pour les frais
 */
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
  onClick
}: FeeCompositeCellProps) {
  
  const fieldKeys = getFeeFieldKeys(column.feeNumber);
  
  // Valeurs actuelles des sous-champs
  const isEnabled = rowData[fieldKeys.enabled] || false;
  const selectedOptionId = rowData[fieldKeys.option] || '';
  const customValue = rowData[fieldKeys.customValue] || 0;
  const calculatedAmount = rowData[fieldKeys.calculatedAmount] || 0;

  // Trouve le frais correspondant dans la configuration client
  const associatedFee = useMemo(() => {
    return clientFees.find(fee => fee.FE_Order === column.feeNumber);
  }, [clientFees, column.feeNumber]);

  // Options disponibles pour ce frais
  const availableOptions = associatedFee?.options || [];

  // Option actuellement sélectionnée
  const selectedOption = useMemo(() => {
    return availableOptions.find(opt => opt.id === selectedOptionId);
  }, [availableOptions, selectedOptionId]);

  // Détermine si le champ de valeur personnalisée doit être affiché
  const showCustomValue = selectedOption?.FO_Editable || false;

  /**
   * Formate le montant calculé pour l'affichage
   */
  const formattedAmount = useMemo(() => {
    if (!calculatedAmount || calculatedAmount === 0) {
      return '-';
    }

    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(calculatedAmount);
  }, [calculatedAmount, currency]);

  /**
   * Gère l'activation/désactivation du frais
   */
  const handleEnabledChange = (enabled: boolean) => {
    onChange(entityId, fieldKeys.enabled, enabled);
    
    if (!enabled) {
      // Si désactivé, vider les autres champs
      onChange(entityId, fieldKeys.option, '');
      onChange(entityId, fieldKeys.customValue, 0);
      onCalculatedChange(entityId, {
        [fieldKeys.calculatedAmount]: 0
      });
    }
  };

  /**
   * Gère le changement d'option de frais
   */
  const handleOptionChange = (optionId: string) => {
    onChange(entityId, fieldKeys.option, optionId);
    
    if (!optionId) {
      // Si aucune option, remettre la valeur custom à 0
      onChange(entityId, fieldKeys.customValue, 0);
    }
  };

  /**
   * Gère le changement de valeur personnalisée
   */
  const handleCustomValueChange = (value: number) => {
    onChange(entityId, fieldKeys.customValue, value);
  };

  // Si pas de frais associé, ne rien afficher
  if (!associatedFee) {
    return (
      <div 
        className={`h-12 flex items-center justify-center text-gray-400 text-sm ${
          isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : ''
        }`}
        onClick={onClick}
      >
        Aucun frais configuré
      </div>
    );
  }

  return (
    <div 
      className={`relative border border-gray-200 rounded ${
        isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-white'
      } ${hasValidationError ? 'ring-2 ring-red-500 ring-inset bg-red-50' : ''}`}
      onClick={onClick}
    >
      {/* Titre du frais */}
      <div className="px-2 py-1 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600 truncate">
        {associatedFee.FE_Name}
      </div>

      {/* Contenu principal - 4 sous-colonnes */}
      <div className="flex h-10">
        
        {/* 1. Checkbox Activer/Désactiver */}
        <div className="flex items-center justify-center w-8 border-r border-gray-200">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            disabled={!isEditable}
            className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* 2. Menu déroulant Option */}
        <div className="flex-1 border-r border-gray-200 min-w-0">
          <select
            value={selectedOptionId}
            onChange={(e) => handleOptionChange(e.target.value)}
            disabled={!isEditable || !isEnabled}
            className={`w-full h-full px-2 text-xs border-0 focus:ring-0 focus:outline-none ${
              !isEnabled ? 'bg-gray-100 text-gray-400' : 'bg-white'
            }`}
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
              value={customValue || 0}
              onChange={(e) => handleCustomValueChange(parseFloat(e.target.value) || 0)}
              disabled={!isEditable}
              className="w-full h-full px-1 text-xs border-0 focus:ring-0 focus:outline-none text-center"
              min="0"
              step="0.01"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
              -
            </div>
          )}
        </div>

        {/* 4. Montant calculé (readonly) */}
        <div className="w-20 flex items-center justify-end px-2">
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

/**
 * Composant de cellule simplifiée pour l'affichage en lecture seule
 */
export function FeeCompositeCellReadonly({
  column,
  rowData,
  clientFees,
  currency,
  isSelected,
  onClick
}: Omit<FeeCompositeCellProps, 'entityId' | 'isEditable' | 'hasValidationError' | 'onChange' | 'onCalculatedChange'>) {
  
  const fieldKeys = getFeeFieldKeys(column.feeNumber);
  
  const isEnabled = rowData[fieldKeys.enabled] || false;
  const selectedOptionId = rowData[fieldKeys.option] || '';
  const calculatedAmount = rowData[fieldKeys.calculatedAmount] || 0;

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
      <div className="px-2 py-1 bg-gray-100 border-b border-gray-200 text-xs font-medium text-gray-500 truncate">
        {associatedFee.FE_Name}
      </div>

      <div className="flex h-10 items-center px-2 text-xs text-gray-600">
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