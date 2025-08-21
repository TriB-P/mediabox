// app/components/Tactiques/BudgetFeesSection.tsx

/**
 * @file Ce fichier contient le composant React `BudgetFeesSection` et ses sous-composants.
 * Il est responsable de l'affichage et de la gestion de la configuration des frais (fees) associés au budget d'une tactique marketing.
 * Ce composant permet aux utilisateurs d'activer, de désactiver et de personnaliser les frais qui s'appliqueront au calcul du budget total de la tactique.
 * Il gère différents types de calculs de frais (pourcentage, volume, fixe) et affiche un résumé des coûts.
 */

'use client';

import React, { memo, useCallback, useMemo, useState } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';
import { useTranslation } from '../../../contexts/LanguageContext';

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
  useCustomVolume?: boolean;
  customVolume?: number;
  calculatedAmount: number;
}

interface BudgetFeesSectionProps {
  clientFees: Fee[];
  appliedFees: AppliedFee[];
  setAppliedFees: React.Dispatch<React.SetStateAction<AppliedFee[]>>;
  mediaBudget: number;
  unitVolume: number;
  tacticCurrency: string;
  onTooltipChange: (tooltip: string | null) => void;
  disabled?: boolean;
}

/**
 * Retourne une icône emoji basée sur le type de calcul du frais.
 * @param {Fee['FE_Calculation_Type']} calculationType - Le type de calcul du frais.
 * @returns {string} - L'émoji correspondant au type.
 */
const getFeeTypeIcon = (calculationType: Fee['FE_Calculation_Type']) => {
  switch (calculationType) {
    case 'Pourcentage budget': return '💰';
    case 'Volume d\'unité': return '💰';
    case 'Unités': return '💰';
    case 'Frais fixe': return '💰';
    default: return '⚙️';
  }
};

/**
 * Retourne une description textuelle pour un type de calcul de frais.
 * @param {Fee['FE_Calculation_Type']} calculationType - Le type de calcul du frais.
 * @param {function} t - La fonction de traduction.
 * @returns {string} - La description lisible du type de calcul.
 */
const getFeeTypeDescription = (calculationType: Fee['FE_Calculation_Type'], t: (key: string) => string) => {
  switch (calculationType) {
    case 'Pourcentage budget': return t('budgetFees.calculationDescription.percentageOnBudget');
    case 'Volume d\'unité': return t('budgetFees.calculationDescription.fixedAmountByUnitVolume');
    case 'Unités': return t('budgetFees.calculationDescription.fixedAmountByUnitCount');
    case 'Frais fixe': return t('budgetFees.calculationDescription.independentFixedAmount');
    default: return t('budgetFees.calculationDescription.undefinedType');
  }
};

/**
 * Formate une valeur numérique pour l'affichage, en la multipliant par 100 si c'est un pourcentage.
 * @param {number} value - La valeur numérique à formater.
 * @param {Fee['FE_Calculation_Type']} calculationType - Le type de calcul pour déterminer si c'est un pourcentage.
 * @returns {string} - La valeur formatée en chaîne de caractères pour l'affichage.
 */
const formatValueForDisplay = (value: number, calculationType: Fee['FE_Calculation_Type']) => {
  if (calculationType === 'Pourcentage budget') {
    return (value * 100).toFixed(2);
  }
  return value.toFixed(2);
};

/**
 * Convertit une valeur d'affichage (string) en valeur numérique pour le stockage, en la divisant par 100 si c'est un pourcentage.
 * @param {string} displayValue - La valeur affichée dans le champ de saisie.
 * @param {Fee['FE_Calculation_Type']} calculationType - Le type de calcul pour déterminer si c'est un pourcentage.
 * @returns {number} - La valeur numérique convertie pour le stockage.
 */
const parseValueFromDisplay = (displayValue: string, calculationType: Fee['FE_Calculation_Type']) => {
  const numValue = parseFloat(displayValue) || 0;
  if (calculationType === 'Pourcentage budget') {
    return numValue / 100;
  }
  return numValue;
};

/**
 * Composant mémoïsé pour afficher et gérer un seul frais.
 * Il contient la logique pour activer/désactiver le frais, sélectionner des options, et saisir des valeurs personnalisées.
 * @param {object} props - Les propriétés du composant.
 * @param {Fee} props.fee - Les données de base du frais (nom, type, options).
 * @param {AppliedFee} props.appliedFee - L'état actuel du frais appliqué (actif, option sélectionnée, etc.).
 * @param {function} props.onToggle - Callback pour activer/désactiver le frais.
 * @param {function} props.onOptionChange - Callback pour changer l'option sélectionnée.
 * @param {function} props.onCustomValueChange - Callback pour changer la valeur personnalisée.
 * @param {function} props.onCustomUnitsChange - Callback pour changer le nombre d'unités personnalisé.
 * @param {function} props.onCustomVolumeToggle - Callback pour activer/désactiver le volume personnalisé.
 * @param {function} props.onCustomVolumeChange - Callback pour changer le volume personnalisé.
 * @param {function} props.onTooltipChange - Callback pour gérer l'affichage d'infobulles.
 * @param {string} props.tacticCurrency - La devise de la tactique pour l'affichage.
 * @param {number} props.unitVolume - Le volume d'unité par défaut de la tactique.
 * @param {boolean} [props.disabled=false] - Désactive les interactions si vrai.
 * @returns {React.ReactElement} - Le JSX du composant pour un frais individuel.
 */
const FeeItem = memo<{
  fee: Fee;
  appliedFee: AppliedFee;
  onToggle: (feeId: string, isActive: boolean) => void;
  onOptionChange: (feeId: string, optionId: string) => void;
  onCustomValueChange: (feeId: string, value: number) => void;
  onCustomUnitsChange: (feeId: string, units: number) => void;
  onCustomVolumeToggle: (feeId: string, useCustom: boolean) => void;
  onCustomVolumeChange: (feeId: string, volume: number) => void;
  onTooltipChange: (tooltip: string | null) => void;
  tacticCurrency: string;
  unitVolume: number;
  disabled?: boolean;
}>(({
  fee,
  appliedFee,
  onToggle,
  onOptionChange,
  onCustomValueChange,
  onCustomUnitsChange,
  onCustomVolumeToggle,
  onCustomVolumeChange,
  onTooltipChange,
  tacticCurrency,
  unitVolume,
  disabled = false
}) => {
  const { t } = useTranslation();
  
  // État local pour gérer l'affichage du champ custom value pendant l'édition
  const [customValueInput, setCustomValueInput] = useState<string>('');
  const [isEditingCustomValue, setIsEditingCustomValue] = useState(false);

  const selectedOption = fee.options.find(opt => opt.id === appliedFee.selectedOptionId);

  const handleToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(fee.id, e.target.checked);
  }, [fee.id, onToggle]);

  const handleOptionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onOptionChange(fee.id, e.target.value);
  }, [fee.id, onOptionChange]);

  const handleCustomValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const displayValue = e.target.value;
    setCustomValueInput(displayValue);
    
    // Si le champ est vide, on ne met pas à jour la valeur (on garde undefined)
    if (displayValue.trim() === '') {
      return;
    }
    
    const storageValue = parseValueFromDisplay(displayValue, fee.FE_Calculation_Type);
    onCustomValueChange(fee.id, storageValue);
  }, [fee.id, fee.FE_Calculation_Type, onCustomValueChange]);

  const handleCustomValueFocus = useCallback(() => {
    setIsEditingCustomValue(true);
    // Si customValue est undefined, on commence avec un champ vide
    if (appliedFee.customValue === undefined) {
      setCustomValueInput('');
    } else {
      setCustomValueInput(formatValueForDisplay(appliedFee.customValue, fee.FE_Calculation_Type));
    }
  }, [appliedFee.customValue, fee.FE_Calculation_Type]);

  const handleCustomValueBlur = useCallback(() => {
    setIsEditingCustomValue(false);
    // Si le champ est vide au blur, on remet undefined
    if (customValueInput.trim() === '') {
      onCustomValueChange(fee.id, undefined as any); // Reset to default value
    }
  }, [customValueInput, fee.id, onCustomValueChange]);

  const handleCustomUnitsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const units = parseInt(e.target.value) || 0;
    onCustomUnitsChange(fee.id, units);
  }, [fee.id, onCustomUnitsChange]);

  const handleCustomVolumeToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomVolumeToggle(fee.id, e.target.checked);
  }, [fee.id, onCustomVolumeToggle]);

  const handleCustomVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value) || 0;
    onCustomVolumeChange(fee.id, volume);
  }, [fee.id, onCustomVolumeChange]);

  const finalValue = useMemo(() => {
    if (!selectedOption) return 0;
    const baseValue = appliedFee.customValue !== undefined ? appliedFee.customValue : selectedOption.FO_Value;
    const bufferMultiplier = (100 + selectedOption.FO_Buffer) / 100;
    return baseValue * bufferMultiplier;
  }, [selectedOption, appliedFee.customValue]);

  const formatCurrency = useCallback((value: number) => {
    const currency = tacticCurrency || 'CAD';
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ' ' + currency;
  }, [tacticCurrency]);

  // Logique d'affichage pour le champ custom value
  const displayValue = useMemo(() => {
    if (isEditingCustomValue) {
      return customValueInput;
    }
    
    if (!selectedOption) return '';
    
    // Si pas de valeur personnalisée, on affiche une chaîne vide pour permettre la saisie
    if (appliedFee.customValue === undefined) {
      return '';
    }
    
    return formatValueForDisplay(appliedFee.customValue, fee.FE_Calculation_Type);
  }, [isEditingCustomValue, customValueInput, selectedOption, appliedFee.customValue, fee.FE_Calculation_Type]);

  const finalDisplayValue = useMemo(() => {
    return formatValueForDisplay(finalValue, fee.FE_Calculation_Type);
  }, [finalValue, fee.FE_Calculation_Type]);

  const effectiveVolume = useMemo(() => {
    if (fee.FE_Calculation_Type === 'Volume d\'unité' && appliedFee.useCustomVolume && appliedFee.customVolume) {
      return appliedFee.customVolume;
    }
    return unitVolume;
  }, [fee.FE_Calculation_Type, appliedFee.useCustomVolume, appliedFee.customVolume, unitVolume]);

  // Placeholder plus explicite selon le type
  const getPlaceholder = useCallback(() => {
    if (appliedFee.customValue === undefined && selectedOption) {
      const defaultDisplayValue = formatValueForDisplay(selectedOption.FO_Value, fee.FE_Calculation_Type);
      return `${t('budgetFees.feeItem.defaultValue')}: ${defaultDisplayValue}${fee.FE_Calculation_Type === 'Pourcentage budget' ? '%' : ''}`;
    }
    return fee.FE_Calculation_Type === 'Pourcentage budget' ? '15.00' : '0.00';
  }, [appliedFee.customValue, selectedOption, fee.FE_Calculation_Type, t]);

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
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
              {getFeeTypeDescription(fee.FE_Calculation_Type, t)} 
            </div>
          </div>
        </div>

        {appliedFee.isActive && (
          <div className="text-right ml-4">
            <div className="text-xl font-bold text-indigo-600">
              {formatCurrency(appliedFee.calculatedAmount)}
            </div>
            <div className="text-xs text-gray-500">{t('budgetFees.feeItem.calculatedAmount')}</div>
          </div>
        )}
      </div>

      {appliedFee.isActive && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          {fee.options.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('budgetFees.feeItem.feeOption')}
                {fee.options.length === 1 && (
                  <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {t('budgetFees.feeItem.autoSelected')}
                  </span>
                )}
              </label>
              <select
                value={appliedFee.selectedOptionId || ''}
                onChange={handleOptionChange}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
              >
                <option value="">{t('budgetFees.feeItem.selectOption')}</option>
                {fee.options.map(option => {
                  const displayOptionValue = formatValueForDisplay(option.FO_Value, fee.FE_Calculation_Type);
                  return (
                    <option key={option.id} value={option.id}>
                      {option.FO_Option} - {displayOptionValue}
                      {fee.FE_Calculation_Type === 'Pourcentage budget' ? '%' : ''}
                      {option.FO_Buffer > 0 && t('budgetFees.feeItem.bufferInfo', { buffer: option.FO_Buffer })}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {selectedOption && fee.FE_Calculation_Type === 'Volume d\'unité' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    id={`custom_volume_${fee.id}`}
                    checked={appliedFee.useCustomVolume || false}
                    onChange={handleCustomVolumeToggle}
                    disabled={disabled}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded disabled:opacity-50"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <label
                    htmlFor={`custom_volume_${fee.id}`}
                    className="text-sm font-medium text-yellow-800 cursor-pointer"
                  >
                    {t('budgetFees.feeItem.useDifferentUnitVolume')}
                  </label>
                  <p className="text-xs text-yellow-700 mt-1">
                    {t('budgetFees.feeItem.defaultVolumeInfo', { unitVolume: unitVolume.toLocaleString() })}
                  </p>
                </div>
              </div>

              {appliedFee.useCustomVolume && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-yellow-800 mb-2">
                    {t('budgetFees.feeItem.customUnitVolume')}
                  </label>
                  <input
                    type="number"
                    value={appliedFee.customVolume || ''}
                    onChange={handleCustomVolumeChange}
                    min="0"
                    step="1"
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-yellow-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 disabled:opacity-50 disabled:bg-gray-100"
                    placeholder={t('budgetFees.feeItem.enterUnitVolume')}
                  />
                  <div className="mt-1 text-xs text-yellow-700">
                    {t('budgetFees.feeItem.volumeCalculationHintPrefix')} {formatCurrency(finalValue)} × {appliedFee.customVolume || 0} = {formatCurrency(finalValue * (appliedFee.customVolume || 0))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedOption && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedOption.FO_Editable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('budgetFees.feeItem.customValue')}
                    {fee.FE_Calculation_Type === 'Pourcentage budget' && ' (%)'}
                    {fee.FE_Calculation_Type !== 'Pourcentage budget' && ` (${tacticCurrency || 'CAD'})`}
                    {appliedFee.customValue === undefined && (
                      <span className="ml-2 text-xs text-gray-500">
                        {t('budgetFees.feeItem.optional')}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={displayValue}
                      onChange={handleCustomValueChange}
                      onFocus={handleCustomValueFocus}
                      onBlur={handleCustomValueBlur}
                      min="0"
                      step={fee.FE_Calculation_Type === 'Pourcentage budget' ? '0.01' : '0.01'}
                      disabled={disabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
                      placeholder={getPlaceholder()}
                    />
                    {fee.FE_Calculation_Type === 'Pourcentage budget' && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    )}
                  </div>
                  {selectedOption.FO_Buffer > 0 && (
                    <div className="mt-1 text-xs text-blue-600">
                      {t('budgetFees.feeItem.finalValueWithBuffer', { buffer: selectedOption.FO_Buffer })}: {finalDisplayValue}
                      {fee.FE_Calculation_Type === 'Pourcentage budget' ? '%' : ` ${tacticCurrency || 'CAD'}`}
                    </div>
                  )}
                  {appliedFee.customValue === undefined && selectedOption && (
                    <div className="mt-1 text-xs text-gray-500">
                      {t('budgetFees.feeItem.usingDefaultValue')}: {formatValueForDisplay(selectedOption.FO_Value, fee.FE_Calculation_Type)}
                      {fee.FE_Calculation_Type === 'Pourcentage budget' ? '%' : ` ${tacticCurrency || 'CAD'}`}
                    </div>
                  )}
                </div>
              )}

              {!selectedOption.FO_Editable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('budgetFees.feeItem.fixedValue')}
                    {fee.FE_Calculation_Type === 'Pourcentage budget' && ' (%)'}
                    {fee.FE_Calculation_Type !== 'Pourcentage budget' && ` (${tacticCurrency || 'CAD'})`}
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
                    {t('budgetFees.feeItem.nonEditableValue')}
                    {selectedOption.FO_Buffer > 0 && t('budgetFees.feeItem.bufferIncluded', { buffer: selectedOption.FO_Buffer })}
                  </div>
                </div>
              )}

              {fee.FE_Calculation_Type === 'Unités' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('budgetFees.feeItem.numberOfUnits')}
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
                    {t('budgetFees.feeItem.finalCalculationMultiplier')}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedOption && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-600">
                {fee.FE_Calculation_Type === 'Pourcentage budget' && (
                  <div className="mt-1">
                    {finalDisplayValue}% × {t('budgetFees.feeSummary.calculationBase')}
                    {fee.FE_Calculation_Mode === 'Directement sur le budget média'
                      ? ` ${t('budgetFees.feeSummary.mediaBudgetInCurrency', { currency: tacticCurrency || 'CAD' })}`
                      : ` ${t('budgetFees.feeSummary.mediaBudgetPlusPreviousFeesInCurrency', { currency: tacticCurrency || 'CAD' })}`}
                  </div>
                )}
                {fee.FE_Calculation_Type === 'Volume d\'unité' && (
                  <div className="mt-1">
                    {formatCurrency(finalValue)} × {effectiveVolume.toLocaleString()} {t('budgetFees.feeItem.units')}
                    {appliedFee.useCustomVolume && (
                      <span className="text-yellow-600 font-medium"> {t('budgetFees.feeSummary.customVolume')}</span>
                    )}
                  </div>
                )}
                {fee.FE_Calculation_Type === 'Unités' && (
                  <div className="mt-1">
                    {formatCurrency(finalValue)} × {appliedFee.customUnits || 1} {t('budgetFees.feeItem.units')}
                  </div>
                )}
                {fee.FE_Calculation_Type === 'Frais fixe' && (
                  <div className="mt-1">
                    {t('budgetFees.feeSummary.fixedAmountOf')} {formatCurrency(finalValue)}
                  </div>
                )}
                {selectedOption.FO_Buffer > 0 && (
                  <div className="mt-1 text-blue-600">
                    <strong>{t('budgetFees.feeSummary.bufferApplied')}:</strong> +{selectedOption.FO_Buffer}% {t('budgetFees.feeSummary.onBaseValue')}
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

/**
 * Composant principal qui affiche et gère la section des frais de budget pour une tactique.
 * Il affiche une liste de frais disponibles, permet à l'utilisateur de les configurer et montre un résumé des coûts.
 * @param {object} props - Les propriétés du composant.
 * @param {Fee[]} props.clientFees - La liste de tous les frais disponibles pour le client.
 * @param {AppliedFee[]} props.appliedFees - L'état des frais appliqués à la tactique.
 * @param {React.Dispatch<React.SetStateAction<AppliedFee[]>>} props.setAppliedFees - La fonction pour mettre à jour l'état des frais appliqués.
 * @param {number} props.mediaBudget - Le budget média de la tactique, utilisé pour les calculs.
 * @param {number} props.unitVolume - Le volume d'unité de la tactique, utilisé pour les calculs.
 * @param {string} props.tacticCurrency - La devise à utiliser pour l'affichage des montants.
 * @param {function} props.onTooltipChange - Callback pour gérer l'affichage d'infobulles.
 * @param {boolean} [props.disabled=false] - Désactive toute la section si vrai.
 * @returns {React.ReactElement | null} - Le JSX de la section de gestion des frais.
 */
const BudgetFeesSection = memo<BudgetFeesSectionProps>(({
  clientFees,
  appliedFees,
  setAppliedFees,
  mediaBudget,
  unitVolume,
  tacticCurrency,
  onTooltipChange,
  disabled = false
}) => {
  const { t } = useTranslation();

  const handleToggleFee = useCallback((feeId: string, isActive: boolean) => {
    setAppliedFees(prev => prev.map(appliedFee => {
      if (appliedFee.feeId !== feeId) return appliedFee;

      const fee = clientFees.find(f => f.id === feeId);

      let selectedOptionId = isActive ? appliedFee.selectedOptionId : undefined;

      if (isActive && fee && fee.options.length === 1 && !selectedOptionId) {
        selectedOptionId = fee.options[0].id;
      }

      return {
        ...appliedFee,
        isActive,
        selectedOptionId,
        customValue: isActive ? appliedFee.customValue : undefined,
        customUnits: isActive ? appliedFee.customUnits : undefined,
        useCustomVolume: isActive ? appliedFee.useCustomVolume : false,
        customVolume: isActive ? appliedFee.customVolume : undefined,
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

  const handleCustomValueChange = useCallback((feeId: string, value: number | undefined) => {
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

  const handleCustomVolumeToggle = useCallback((feeId: string, useCustom: boolean) => {
    setAppliedFees(prev => prev.map(appliedFee =>
      appliedFee.feeId === feeId
        ? {
            ...appliedFee,
            useCustomVolume: useCustom,
            customVolume: useCustom ? (appliedFee.customVolume || unitVolume) : undefined
          }
        : appliedFee
    ));
  }, [setAppliedFees, unitVolume]);

  const handleCustomVolumeChange = useCallback((feeId: string, volume: number) => {
    setAppliedFees(prev => prev.map(appliedFee =>
      appliedFee.feeId === feeId
        ? { ...appliedFee, customVolume: volume }
        : appliedFee
    ));
  }, [setAppliedFees]);

  const sortedFees = useMemo(() =>
    [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order),
    [clientFees]
  );

  const activeFees = useMemo(() =>
    appliedFees.filter(af => af.isActive && af.calculatedAmount > 0),
    [appliedFees]
  );

  const totalFees = useMemo(() =>
    activeFees.reduce((sum, af) => sum + af.calculatedAmount, 0),
    [activeFees]
  );

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ' ' + tacticCurrency;
  }, [tacticCurrency]);

  if (clientFees.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
        <p className="text-sm">
          <strong>{t('budgetFees.main.noFeesConfigured')}</strong>
        </p>
        <p className="text-sm mt-1">
          {t('budgetFees.main.feesConfigurableInAdmin')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">💱</span>
          <div className="text-sm text-blue-800">
            <strong>{t('budgetFees.main.displayCurrency')}:</strong> {tacticCurrency}
          </div>
        </div>
        <div className="text-xs text-blue-600 mt-1">
          {t('budgetFees.main.currencyNotice')}
          &nbsp;{t('budgetFees.main.systemCalculationNotice')}
        </div>
      </div>

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
              onCustomVolumeToggle={handleCustomVolumeToggle}
              onCustomVolumeChange={handleCustomVolumeChange}
              onTooltipChange={onTooltipChange}
              tacticCurrency={tacticCurrency}
              unitVolume={unitVolume}
              disabled={disabled}
            />
          );
        })}
      </div>

      {activeFees.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-indigo-800 mb-3">
            📊 {t('budgetFees.main.appliedFees')} ({t('common.in')} {tacticCurrency})
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
                    {fee.FE_Calculation_Type === 'Volume d\'unité' && appliedFee.useCustomVolume && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                        {t('budgetFees.main.customVolumeAbbr')}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-indigo-800">
                    {formatCurrency(appliedFee.calculatedAmount)}
                  </span>
                </div>
              );
            })}
            <div className="border-t border-indigo-200 pt-2 mt-3 flex justify-between text-sm font-semibold text-indigo-800">
              <span>{t('budgetFees.main.totalFees')} ({t('common.in')} {tacticCurrency})</span>
              <span>{formatCurrency(totalFees)}</span>
            </div>
          </div>

        </div>
      )}

      {mediaBudget <= 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            {t('budgetFees.main.mediaBudgetWarning')}
          </p>
        </div>
      )}

      {disabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            {t('budgetFees.main.loadingConfiguration')}
          </p>
        </div>
      )}
    </div>
  );
});

BudgetFeesSection.displayName = 'BudgetFeesSection';

export default BudgetFeesSection;