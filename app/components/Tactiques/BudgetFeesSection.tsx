// app/components/Tactiques/BudgetFeesSection.tsx

'use client';

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';

// ==================== TYPES ====================

interface Fee {
  id: string;
  FE_Name: string;
  FE_Calculation_Type: 'Pourcentage budget' | 'Volume d\'unité' | 'Unités' | 'Frais fixe';
  FE_Calculation_Mode: 'Directement sur le budget média' | 'Applicable sur les frais précédents';
  FE_Order: number;
  options: FeeOption[];
}

interface FeeOption {
  id: string;
  FO_Option: string;
  FO_Value: number;
  FO_Buffer: number;
  FO_Editable: boolean;
}

interface AppliedFee {
  feeId: string;
  isActive: boolean;
  selectedOptionId?: string;
  customValue?: number;
  customUnits?: number;
  calculatedAmount: number;
}

interface BudgetFeesSectionProps {
  // Données des frais
  clientFees: Fee[];
  appliedFees: AppliedFee[];
  setAppliedFees: React.Dispatch<React.SetStateAction<AppliedFee[]>>;
  
  // Données pour les calculs
  mediaBudget: number;
  unitVolume: number;
  
  // Gestionnaires d'événements
  onTooltipChange: (tooltip: string | null) => void;
  
  // État de chargement
  disabled?: boolean;
}

// ==================== UTILITAIRES ====================

const getFeeTypeIcon = (calculationType: Fee['FE_Calculation_Type']) => {
  switch (calculationType) {
    case 'Pourcentage budget': return '📊';
    case 'Volume d\'unité': return '📈';
    case 'Unités': return '🔢';
    case 'Frais fixe': return '💰';
    default: return '⚙️';
  }
};

const getFeeTypeDescription = (calculationType: Fee['FE_Calculation_Type']) => {
  switch (calculationType) {
    case 'Pourcentage budget': return 'Pourcentage appliqué sur le budget';
    case 'Volume d\'unité': return 'Montant fixe × volume d\'unité';
    case 'Unités': return 'Montant fixe × nombre d\'unités';
    case 'Frais fixe': return 'Montant fixe indépendant';
    default: return 'Type non défini';
  }
};

// CORRECTION: Formater une valeur pour l'affichage selon le type de frais
const formatValueForDisplay = (value: number, calculationType: Fee['FE_Calculation_Type']) => {
  if (calculationType === 'Pourcentage budget') {
    // PROBLÈME CORRIGÉ: La valeur en base est toujours en décimal (0.1 = 10%)
    // On multiplie toujours par 100 pour l'affichage
    return (value * 100).toFixed(2);
  }
  return value.toFixed(2);
};

// CORRECTION: Convertir une valeur d'affichage vers le stockage selon le type de frais  
const parseValueFromDisplay = (displayValue: string, calculationType: Fee['FE_Calculation_Type']) => {
  const numValue = parseFloat(displayValue) || 0;
  if (calculationType === 'Pourcentage budget') {
    // PROBLÈME CORRIGÉ: La valeur affichée est toujours en pourcentage
    // On divise toujours par 100 pour stocker en décimal
    return numValue / 100;
  }
  return numValue;
};

// ==================== COMPOSANT FRAIS INDIVIDUEL ====================

const FeeItem = memo<{
  fee: Fee;
  appliedFee: AppliedFee;
  onToggle: (feeId: string, isActive: boolean) => void;
  onOptionChange: (feeId: string, optionId: string) => void;
  onCustomValueChange: (feeId: string, value: number) => void;
  onCustomUnitsChange: (feeId: string, units: number) => void;
  onTooltipChange: (tooltip: string | null) => void;
  disabled?: boolean;
}>(({ 
  fee, 
  appliedFee, 
  onToggle, 
  onOptionChange, 
  onCustomValueChange, 
  onCustomUnitsChange, 
  onTooltipChange, 
  disabled = false 
}) => {
  
  const selectedOption = fee.options.find(opt => opt.id === appliedFee.selectedOptionId);
  
  // Gestionnaires d'événements
  const handleToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(fee.id, e.target.checked);
  }, [fee.id, onToggle]);

  const handleOptionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onOptionChange(fee.id, e.target.value);
  }, [fee.id, onOptionChange]);

  const handleCustomValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const displayValue = e.target.value;
    const storageValue = parseValueFromDisplay(displayValue, fee.FE_Calculation_Type);
    onCustomValueChange(fee.id, storageValue);
  }, [fee.id, fee.FE_Calculation_Type, onCustomValueChange]);

  const handleCustomUnitsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const units = parseInt(e.target.value) || 0;
    onCustomUnitsChange(fee.id, units);
  }, [fee.id, onCustomUnitsChange]);

  // Calcul du montant avec buffer si applicable
  const finalValue = useMemo(() => {
    if (!selectedOption) return 0;
    const baseValue = appliedFee.customValue !== undefined ? appliedFee.customValue : selectedOption.FO_Value;
    const bufferMultiplier = (100 + selectedOption.FO_Buffer) / 100;
    return baseValue * bufferMultiplier;
  }, [selectedOption, appliedFee.customValue]);

  // Formatage des montants
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  // Valeur affichée dans l'input (avec conversion pour les pourcentages)
  const displayValue = useMemo(() => {
    if (!selectedOption) return '';
    const baseValue = appliedFee.customValue !== undefined ? appliedFee.customValue : selectedOption.FO_Value;
    return formatValueForDisplay(baseValue, fee.FE_Calculation_Type);
  }, [selectedOption, appliedFee.customValue, fee.FE_Calculation_Type]);

  // Valeur finale avec buffer (pour affichage informatif)
  const finalDisplayValue = useMemo(() => {
    return formatValueForDisplay(finalValue, fee.FE_Calculation_Type);
  }, [finalValue, fee.FE_Calculation_Type]);

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Header avec toggle et information */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center flex-1">
          <input
            type="checkbox"
            id={`fee_${fee.id}`}
            checked={appliedFee.isActive}
            onChange={handleToggle}
            disabled={disabled}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
          />
          <div className="ml-3 flex-1">
            <label 
              htmlFor={`fee_${fee.id}`} 
              className="text-lg font-medium text-gray-900 cursor-pointer flex items-center gap-2"
            >
              <span>{getFeeTypeIcon(fee.FE_Calculation_Type)}</span>
              {fee.FE_Name}
            </label>
            <div className="text-sm text-gray-500 mt-1">
              {getFeeTypeDescription(fee.FE_Calculation_Type)} • {fee.FE_Calculation_Mode} • Ordre #{fee.FE_Order}
            </div>
          </div>
        </div>
        
        {/* Montant calculé si activé */}
        {appliedFee.isActive && (
          <div className="text-right ml-4">
            <div className="text-xl font-bold text-indigo-600">
              {formatCurrency(appliedFee.calculatedAmount)} CAD
            </div>
            <div className="text-xs text-gray-500">Montant final</div>
          </div>
        )}
      </div>

      {/* Configuration du frais si activé */}
      {appliedFee.isActive && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          {/* Sélection d'option */}
          {fee.options.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Option du frais
                {/* NOUVELLE FONCTIONNALITÉ: Indication si sélection automatique */}
                {fee.options.length === 1 && (
                  <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    Sélectionnée automatiquement
                  </span>
                )}
              </label>
              <select
                value={appliedFee.selectedOptionId || ''}
                onChange={handleOptionChange}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
              >
                <option value="">Sélectionner une option...</option>
                {fee.options.map(option => {
                  const displayOptionValue = formatValueForDisplay(option.FO_Value, fee.FE_Calculation_Type);
                  return (
                    <option key={option.id} value={option.id}>
                      {option.FO_Option} - {displayOptionValue}
                      {fee.FE_Calculation_Type === 'Pourcentage budget' ? '%' : ''}
                      {option.FO_Buffer > 0 && ` (Buffer: +${option.FO_Buffer}%)`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Champs personnalisés selon le type de frais */}
          {selectedOption && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Valeur personnalisée si éditable */}
              {selectedOption.FO_Editable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur personnalisée
                    {fee.FE_Calculation_Type === 'Pourcentage budget' && ' (%)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={displayValue}
                      onChange={handleCustomValueChange}
                      min="0"
                      step={fee.FE_Calculation_Type === 'Pourcentage budget' ? '0.01' : '0.01'}
                      disabled={disabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
                      placeholder={fee.FE_Calculation_Type === 'Pourcentage budget' ? '15.00' : '0.00'}
                    />
                    {fee.FE_Calculation_Type === 'Pourcentage budget' && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    )}
                  </div>
                  {selectedOption.FO_Buffer > 0 && (
                    <div className="mt-1 text-xs text-blue-600">
                      Valeur finale avec buffer (+{selectedOption.FO_Buffer}%) : {finalDisplayValue}
                      {fee.FE_Calculation_Type === 'Pourcentage budget' ? '%' : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Valeur non éditable */}
              {!selectedOption.FO_Editable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur fixe
                    {fee.FE_Calculation_Type === 'Pourcentage budget' && ' (%)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={finalDisplayValue}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600"
                    />
                    {fee.FE_Calculation_Type === 'Pourcentage budget' && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Valeur non modifiable
                    {selectedOption.FO_Buffer > 0 && ` (buffer +${selectedOption.FO_Buffer}% inclus)`}
                  </div>
                </div>
              )}

              {/* Nombre d'unités pour type "Unités" */}
              {fee.FE_Calculation_Type === 'Unités' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre d'unités
                  </label>
                  <input
                    type="number"
                    value={appliedFee.customUnits || 1}
                    onChange={handleCustomUnitsChange}
                    min="1"
                    step="1"
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Multiplieur pour le calcul final
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Explication du calcul */}
          {selectedOption && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-600">
                <strong>Calcul détaillé :</strong>
                {fee.FE_Calculation_Type === 'Pourcentage budget' && (
                  <div className="mt-1">
                    {finalDisplayValue}% × Base de calcul 
                    {fee.FE_Calculation_Mode === 'Directement sur le budget média' 
                      ? ' (budget média)' 
                      : ' (budget média + frais précédents)'}
                  </div>
                )}
                {fee.FE_Calculation_Type === 'Volume d\'unité' && (
                  <div className="mt-1">
                    {formatCurrency(finalValue)} × Volume d'unité de la tactique
                  </div>
                )}
                {fee.FE_Calculation_Type === 'Unités' && (
                  <div className="mt-1">
                    {formatCurrency(finalValue)} × {appliedFee.customUnits || 1} unités
                  </div>
                )}
                {fee.FE_Calculation_Type === 'Frais fixe' && (
                  <div className="mt-1">
                    Montant fixe de {formatCurrency(finalValue)}
                  </div>
                )}
                {selectedOption.FO_Buffer > 0 && (
                  <div className="mt-1 text-blue-600">
                    <strong>Buffer appliqué :</strong> +{selectedOption.FO_Buffer}% sur la valeur de base
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

FeeItem.displayName = 'FeeItem';

// ==================== COMPOSANT PRINCIPAL ====================

const BudgetFeesSection = memo<BudgetFeesSectionProps>(({
  clientFees,
  appliedFees,
  setAppliedFees,
  mediaBudget,
  unitVolume,
  onTooltipChange,
  disabled = false
}) => {

  // CORRECTION: Fonction pour calculer le montant d'un frais
  const calculateFeeAmount = useCallback((fee: Fee, appliedFee: AppliedFee, cumulatedBase: number): number => {
    if (!appliedFee.isActive || !appliedFee.selectedOptionId) return 0;
    
    const selectedOption = fee.options.find(opt => opt.id === appliedFee.selectedOptionId);
    if (!selectedOption) return 0;
    
    // Valeur avec buffer - utiliser customValue si définie, sinon FO_Value
    const baseValue = appliedFee.customValue !== undefined ? appliedFee.customValue : selectedOption.FO_Value;
    const finalValue = baseValue * ((100 + selectedOption.FO_Buffer) / 100);
    
    switch (fee.FE_Calculation_Type) {
      case 'Pourcentage budget':
        // CORRECTION: Utiliser la base de calcul cumulative selon le mode
        const baseAmount = fee.FE_Calculation_Mode === 'Directement sur le budget média' 
          ? mediaBudget 
          : cumulatedBase;
        // PROBLÈME CORRIGÉ: finalValue est déjà en décimal (ex: 0.1 pour 10%)
        // Pas besoin de diviser par 100, la valeur est correcte
        console.log(`Calcul frais ${fee.FE_Name}: ${finalValue} × ${baseAmount} = ${finalValue * baseAmount}`);
        return finalValue * baseAmount;
        
      case 'Volume d\'unité':
        return finalValue * unitVolume;
        
      case 'Unités':
        const units = appliedFee.customUnits || 1;
        return finalValue * units;
        
      case 'Frais fixe':
        return finalValue;
        
      default:
        return 0;
    }
  }, [mediaBudget, unitVolume]);

  // Recalculer tous les frais quand les paramètres changent
  useEffect(() => {
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    let cumulatedBase = mediaBudget;
    
    setAppliedFees(prevAppliedFees => {
      const updatedFees: AppliedFee[] = [];
      
      // Traiter les frais dans l'ordre pour calculer la base cumulative correctement
      for (const fee of sortedFees) {
        const appliedFee = prevAppliedFees.find(af => af.feeId === fee.id);
        if (!appliedFee) continue;
        
        const calculatedAmount = calculateFeeAmount(fee, appliedFee, cumulatedBase);
        
        const updatedAppliedFee = {
          ...appliedFee,
          calculatedAmount
        };
        
        updatedFees.push(updatedAppliedFee);
        
        // Ajouter ce frais à la base cumulative pour les frais suivants
        // TOUS les frais actifs s'ajoutent à la base, peu importe leur mode
        if (appliedFee.isActive && calculatedAmount > 0) {
          cumulatedBase += calculatedAmount;
        }
      }
      
      // Retourner les frais dans l'ordre original (pas forcément l'ordre de traitement)
      return prevAppliedFees.map(prevFee => {
        const updatedFee = updatedFees.find(uf => uf.feeId === prevFee.feeId);
        return updatedFee || prevFee;
      });
    });
  }, [clientFees, mediaBudget, unitVolume, setAppliedFees, calculateFeeAmount, appliedFees.map(af => `${af.feeId}-${af.isActive}-${af.selectedOptionId}-${af.customValue}-${af.customUnits}`).join('|')]);

  // NOUVELLE FONCTIONNALITÉ: Gestionnaire d'activation avec sélection automatique
  const handleToggleFee = useCallback((feeId: string, isActive: boolean) => {
    setAppliedFees(prev => prev.map(appliedFee => {
      if (appliedFee.feeId !== feeId) return appliedFee;
      
      // Trouver le frais correspondant
      const fee = clientFees.find(f => f.id === feeId);
      
      let selectedOptionId = isActive ? appliedFee.selectedOptionId : undefined;
      
      // NOUVELLE LOGIQUE: Si activation et une seule option disponible, la sélectionner automatiquement
      if (isActive && fee && fee.options.length === 1 && !selectedOptionId) {
        selectedOptionId = fee.options[0].id;
        console.log(`Sélection automatique de l'option unique pour le frais "${fee.FE_Name}": ${fee.options[0].FO_Option}`);
      }
      
      return { 
        ...appliedFee, 
        isActive,
        selectedOptionId,
        customValue: isActive ? appliedFee.customValue : undefined,
        customUnits: isActive ? appliedFee.customUnits : undefined,
        calculatedAmount: isActive ? appliedFee.calculatedAmount : 0
      };
    }));
  }, [setAppliedFees, clientFees]);

  const handleOptionChange = useCallback((feeId: string, optionId: string) => {
    setAppliedFees(prev => prev.map(appliedFee => 
      appliedFee.feeId === feeId 
        ? { ...appliedFee, selectedOptionId: optionId, customValue: undefined }
        : appliedFee
    ));
  }, [setAppliedFees]);

  const handleCustomValueChange = useCallback((feeId: string, value: number) => {
    setAppliedFees(prev => prev.map(appliedFee => 
      appliedFee.feeId === feeId 
        ? { ...appliedFee, customValue: value }
        : appliedFee
    ));
  }, [setAppliedFees]);

  const handleCustomUnitsChange = useCallback((feeId: string, units: number) => {
    setAppliedFees(prev => prev.map(appliedFee => 
      appliedFee.feeId === feeId 
        ? { ...appliedFee, customUnits: units }
        : appliedFee
    ));
  }, [setAppliedFees]);

  // Trier les frais par ordre
  const sortedFees = useMemo(() => 
    [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order),
    [clientFees]
  );

  // Calculs pour le résumé
  const activeFees = useMemo(() => 
    appliedFees.filter(af => af.isActive && af.calculatedAmount > 0),
    [appliedFees]
  );

  const totalFees = useMemo(() => 
    activeFees.reduce((sum, af) => sum + af.calculatedAmount, 0),
    [activeFees]
  );

  // Formatage
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  // Message si aucun frais
  if (clientFees.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
        <p className="text-sm">
          <strong>Aucun frais configuré pour ce client.</strong>
        </p>
        <p className="text-sm mt-1">
          Les frais peuvent être configurés dans la section Administration du client.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Liste des frais */}
      <div className="space-y-4">
        {sortedFees.map(fee => {
          const appliedFee = appliedFees.find(af => af.feeId === fee.id);
          if (!appliedFee) return null;
          
          return (
            <FeeItem
              key={fee.id}
              fee={fee}
              appliedFee={appliedFee}
              onToggle={handleToggleFee}
              onOptionChange={handleOptionChange}
              onCustomValueChange={handleCustomValueChange}
              onCustomUnitsChange={handleCustomUnitsChange}
              onTooltipChange={onTooltipChange}
              disabled={disabled}
            />
          );
        })}
      </div>

      {/* Résumé des frais actifs */}
      {activeFees.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-indigo-800 mb-3">
            📊 Frais appliqués (ordre d'application)
          </h5>
          <div className="space-y-2">
            {activeFees.map(appliedFee => {
              const fee = clientFees.find(f => f.id === appliedFee.feeId);
              if (!fee) return null;
              
              return (
                <div key={appliedFee.feeId} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span>{getFeeTypeIcon(fee.FE_Calculation_Type)}</span>
                    <span className="text-indigo-700">{fee.FE_Name}</span>
                    <span className="text-xs text-indigo-500">#{fee.FE_Order}</span>
                  </div>
                  <span className="font-medium text-indigo-800">
                    {formatCurrency(appliedFee.calculatedAmount)} CAD
                  </span>
                </div>
              );
            })}
            <div className="border-t border-indigo-200 pt-2 mt-3 flex justify-between text-sm font-semibold text-indigo-800">
              <span>Total des frais</span>
              <span>{formatCurrency(totalFees)} CAD</span>
            </div>
          </div>
        </div>
      )}

      {/* Message si budget média requis */}
      {mediaBudget <= 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            ⚠️ Un budget média doit être défini pour calculer correctement les frais en pourcentage.
          </p>
        </div>
      )}

      {/* Message si volume requis */}
      {unitVolume <= 0 && clientFees.some(f => f.FE_Calculation_Type === 'Volume d\'unité') && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            ⚠️ Un volume d'unité doit être défini pour calculer les frais basés sur le volume.
          </p>
        </div>
      )}

      {/* Message si champs désactivés */}
      {disabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            ⏳ Chargement en cours... La configuration des frais sera disponible une fois les données chargées.
          </p>
        </div>
      )}
    </div>
  );
});

BudgetFeesSection.displayName = 'BudgetFeesSection';

export default BudgetFeesSection;