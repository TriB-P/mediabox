// app/components/Tactiques/BudgetBonificationSection.tsx

/**
 * Ce fichier définit le composant `BudgetBonificationSection`, une section de formulaire React
 * dédiée à la gestion de la bonification d'une tactique média.
 *
 * Le composant permet à l'utilisateur d'activer ou de désactiver la bonification,
 * de saisir la valeur réelle de la tactique et d'afficher la valeur de la bonification calculée.
 * Il est conçu pour être intégré dans des formulaires plus larges et interagit avec
 * un état parent via des props (callbacks). Il ne gère pas d'état interne pour les valeurs
 * du formulaire, assurant ainsi une source de vérité unique au niveau du composant parent.
 */

'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';
import { useTranslation } from '../../../contexts/LanguageContext';

interface BudgetBonificationSectionProps {
  formData: {
    TC_Currency?: string;
    TC_Has_Bonus?: boolean;
    TC_Real_Value?: number;
    TC_Bonus_Value?: number;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  onCalculatedChange: (field: string, value: number) => void;
  onToggle?: (hasBonus: boolean) => void;
  mediaBudget: number;
  disabled?: boolean;
}

/**
 * @component BudgetBonificationSection
 * @description Affiche et gère la section du formulaire relative à la bonification budgétaire.
 * Ce composant est "memoized" pour optimiser les performances en évitant les re-rendus inutiles.
 * @param {BudgetBonificationSectionProps} props - Les propriétés du composant.
 * @param {object} props.formData - Les données actuelles du formulaire.
 * @param {function} props.onChange - Callback pour les changements sur les champs standards.
 * @param {function} props.onTooltipChange - Callback pour afficher des infobulles d'aide.
 * @param {function} props.onCalculatedChange - Callback pour mettre à jour des champs calculés dans le formulaire parent.
 * @param {function} [props.onToggle] - Callback optionnel pour gérer spécifiquement l'activation/désactivation de la bonification.
 * @param {number} props.mediaBudget - Le budget média de référence pour les calculs.
 * @param {boolean} [props.disabled=false] - État pour désactiver les interactions sur le composant.
 * @returns {React.ReactElement} Le JSX de la section de bonification.
 */
const BudgetBonificationSection = memo<BudgetBonificationSectionProps>(({
  formData,
  onChange,
  onTooltipChange,
  onCalculatedChange,
  onToggle,
  mediaBudget,
  disabled = false
}) => {
  
  const { t } = useTranslation();
  const hasBonus = formData.TC_Has_Bonus || false;
  const realValue = formData.TC_Real_Value || 0;
  const bonusValue = formData.TC_Bonus_Value || 0;
  const currency = formData.TC_Currency || 'CAD';

  /**
   * @description Calcule et mémorise l'état de validation de la valeur réelle saisie.
   * La validation dépend de la valeur du budget média et de la valeur réelle elle-même.
   * @returns {{isValid: boolean, message: string | null}} Un objet contenant l'état de validité et un message associé.
   */
  const validationStatus = useMemo(() => {
    if (!hasBonus) return { isValid: true, message: null };
    
    if (realValue === 0) {
      return { 
        isValid: true, 
        message: null
      };
    }
    
    if (mediaBudget > 0 && realValue < mediaBudget) {
      return { 
        isValid: false, 
        message: t('budgetBonification.validation.mustBeGreaterOrEqual')
      };
    }
    
    if (mediaBudget > 0 && realValue === mediaBudget) {
      return { 
        isValid: true, 
        message: t('budgetBonification.validation.noBonusSameValue')
      };
    }
    
    return { isValid: true, message: null };
  }, [hasBonus, realValue, mediaBudget, t]);

  /**
   * @description Calcule et mémorise le pourcentage de la bonification par rapport au budget média.
   * @returns {number} Le pourcentage de bonification. Retourne 0 si les conditions ne sont pas remplies.
   */
  const bonusPercentage = useMemo(() => {
    if (!hasBonus || mediaBudget <= 0 || bonusValue <= 0) return 0;
    return (bonusValue / mediaBudget) * 100;
  }, [hasBonus, mediaBudget, bonusValue]);

  /**
   * @function handleHasBonusChange
   * @description Gère le changement d'état de la case à cocher pour la bonification.
   * Utilise le callback `onToggle` s'il est fourni, sinon utilise le `onChange` par défaut
   * et réinitialise les champs liés si la bonification est désactivée.
   * @param {React.ChangeEvent<HTMLInputElement>} e - L'événement de changement.
   */
  const handleHasBonusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    
    if (onToggle) {
      onToggle(checked);
    } else {
      onChange(e);
      
      if (!checked) {
        setTimeout(() => {
          onCalculatedChange('TC_Real_Value', 0);
          onCalculatedChange('TC_Bonus_Value', 0);
        }, 0);
      }
    }
  }, [onToggle, onChange, onCalculatedChange]);

  /**
   * @function handleRealValueChange
   * @description Gère le changement de la valeur réelle. Met à jour la valeur dans le
   * formulaire parent via le callback `onCalculatedChange`.
   * @param {React.ChangeEvent<HTMLInputElement>} e - L'événement de changement de l'input.
   */
  const handleRealValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newRealValue = parseFloat(e.target.value) || 0;
    onCalculatedChange('TC_Real_Value', newRealValue);
  }, [onCalculatedChange]);

  /**
   * @function formatCurrency
   * @description Formate un nombre en une chaîne de caractères représentant une devise (CAD).
   * @param {number} value - La valeur numérique à formater.
   * @returns {string} La valeur formatée en devise.
   */
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  /**
   * @function formatPercentage
   * @description Formate un nombre en une chaîne de caractères représentant un pourcentage.
   * @param {number} value - La valeur numérique à formater.
   * @returns {string} La valeur formatée en pourcentage.
   */
  const formatPercentage = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start">
        <div className="flex items-center h-6">
          <input
            type="checkbox"
            id="TC_Has_Bonus"
            name="TC_Has_Bonus"
            checked={hasBonus}
            onChange={handleHasBonusChange}
            disabled={disabled}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
          />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              t('budgetBonification.includeBonusLabel'), 
              t('budgetBonification.includeBonusTooltip'), 
              onTooltipChange
            )}
          </div>
          <p className="text-sm text-gray-600">
            {hasBonus 
              ? t('budgetBonification.hasBonusDescription')
              : t('budgetBonification.noBonusDescription')
            }
          </p>
        </div>
      </div>

      {mediaBudget <= 0 && hasBonus && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            {t('budgetBonification.mediaBudgetWarning')}
          </p>
        </div>
      )}

      {hasBonus && (
        <div className="space-y-6 pl-7">
          {mediaBudget > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-800 mb-2">
                {t('budgetBonification.referenceBudgetTitle')}
              </h5>
              <div className="text-sm text-gray-700">
                <div className="flex justify-between items-center">
                  <span>{t('budgetBonification.currentMediaBudget')}</span>
                  <span className="font-medium">{formatCurrency(mediaBudget)} {currency}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('budgetBonification.realValueMustBeGreater')}
                </div>
              </div>
            </div>
          )}

          {realValue === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-lg">💡</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">
                    {t('budgetBonification.bonusActivePendingInputTitle')}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {t('budgetBonification.bonusActivePendingInputDescription')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                t('budgetBonification.realValueLabel'), 
                t('budgetBonification.realValueTooltip'), 
                onTooltipChange
              )}
            </div>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm font-medium">{currency}</span>
              </div>
              <input
                type="number"
                value={realValue || ''}
                onChange={handleRealValueChange}
                min="0"
                step="0.01"
                disabled={disabled}
                className={`block w-full pl-12 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100 ${
                  validationStatus.isValid ? 'border-gray-300' : 'border-red-300 bg-red-50'
                }`}
                placeholder="0.00"
              />
            </div>
            
            {validationStatus.message && (
              <div className={`mt-1 text-sm ${validationStatus.isValid ? 'text-blue-600' : 'text-red-600'}`}>
                {validationStatus.message}
              </div>
            )}
            
            {realValue > 0 && validationStatus.isValid && mediaBudget > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {realValue >= mediaBudget 
                  ? `${t('budgetBonification.economyOf')} ${formatPercentage(((realValue - mediaBudget) / realValue) * 100)}% ${t('budgetBonification.onNegotiatedValue')}`
                  : t('budgetBonification.insufficientValue')
                }
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                t('budgetBonification.bonusCalculatedLabel'), 
                t('budgetBonification.bonusCalculatedTooltip'), 
                onTooltipChange
              )}
            </div>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm font-medium">{currency}</span>
              </div>
              <input
                type="number"
                value={bonusValue.toFixed(2)}
                disabled
                className={`block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm font-medium ${
                  bonusValue > 0 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
                }`}
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {bonusPercentage > 0 && (
                  <span className="text-green-600 text-sm font-medium">
                    +{formatPercentage(bonusPercentage)}%
                  </span>
                )}
              </div>
            </div>
            {bonusValue > 0 && (
              <div className="mt-1 text-sm text-green-600">
                {t('budgetBonification.economyOf')} {formatCurrency(bonusValue)} {currency} ({formatPercentage(bonusPercentage)}% {t('budgetBonification.ofMediaBudget')})
              </div>
            )}
            {bonusValue === 0 && realValue > 0 && (
              <div className="mt-1 text-sm text-gray-500">
                {realValue === mediaBudget 
                  ? t('budgetBonification.noBonusReasonSameValue')
                  : t('budgetBonification.bonusWillBeCalculated')
                }
              </div>
            )}
          </div>

          {realValue > 0 && bonusValue > 0 && mediaBudget > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-green-800 mb-3">
                {t('budgetBonification.summary.title')}
              </h5>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>{t('budgetBonification.summary.totalNegotiatedValue')}</span>
                  <span className="font-medium">{formatCurrency(realValue)} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('budgetBonification.summary.mediaBudgetPaid')}</span>
                  <span className="font-medium">{formatCurrency(mediaBudget)} {currency}</span>
                </div>
                <div className="flex justify-between border-t border-green-300 pt-2 font-semibold">
                  <span>{t('budgetBonification.summary.bonusObtained')}</span>
                  <span className="text-green-800">+{formatCurrency(bonusValue)} {currency}</span>
                </div>
                <div className="text-xs text-green-600 mt-2">
                  {t('budgetBonification.summary.represents')} {formatPercentage(bonusPercentage)}% {t('budgetBonification.summary.addedValue')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!hasBonus && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <strong>{t('budgetBonification.disabled.title')}</strong> {t('budgetBonification.disabled.description')}
          </p>
        </div>
      )}

      {disabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            {t('budgetBonification.loadingConfiguration')}
          </p>
        </div>
      )}
    </div>
  );
});

BudgetBonificationSection.displayName = 'BudgetBonificationSection';

export default BudgetBonificationSection;