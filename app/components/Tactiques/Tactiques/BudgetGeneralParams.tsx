// app/components/Tactiques/BudgetGeneralParams.tsx

/**
 * @file Ce fichier définit le composant BudgetGeneralParams.
 * Il s'agit d'un composant de formulaire réutilisable qui affiche les champs de configuration
 * généraux pour le budget d'une tactique, tels que le type d'unité, la devise et le mode de saisie
 * du budget (client ou média). Il est conçu pour être intégré dans des formulaires plus larges.
 */

'use client';

import React, { memo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { SmartSelect, createLabelWithHelp } from './TactiqueFormComponents';

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

interface BudgetGeneralParamsProps {
  formData: {
    TC_Currency?: string;
    TC_Unit_Type?: string;
    TC_Budget_Mode?: 'client' | 'media';
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  unitTypeOptions: ListItem[];
  disabled?: boolean;
}

/**
 * Affiche les champs de formulaire pour les paramètres généraux du budget d'une tactique.
 * Ce composant est mémoïsé pour optimiser les performances en évitant les rendus inutiles.
 * @param {BudgetGeneralParamsProps} props - Les propriétés du composant.
 * @param {object} props.formData - Les données actuelles du formulaire pour pré-remplir les champs.
 * @param {(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void} props.onChange - La fonction de rappel à exécuter lors d'un changement dans un champ.
 * @param {(tooltip: string | null) => void} props.onTooltipChange - La fonction pour afficher une infobulle d'aide.
 * @param {ListItem[]} props.unitTypeOptions - La liste des options pour le sélecteur de type d'unité.
 * @param {boolean} [props.disabled=false] - Un booléen pour désactiver les champs, par exemple pendant le chargement des données.
 * @returns {React.ReactElement} Le fragment de formulaire JSX pour les paramètres généraux du budget.
 */
const BudgetGeneralParams = memo<BudgetGeneralParamsProps>(({
  formData,
  onChange,
  onTooltipChange,
  unitTypeOptions,
  disabled = false
}) => {
  const { t } = useTranslation();

  const CURRENCIES = [
    { id: 'CAD', label: t('budgetGeneralParams.currencies.cad') },
    { id: 'USD', label: t('budgetGeneralParams.currencies.usd') },
    { id: 'EUR', label: t('budgetGeneralParams.currencies.eur') },
    { id: 'CHF', label: t('budgetGeneralParams.currencies.chf') },
  ];
  
  const BUDGET_MODES = [
    { 
      id: 'media', 
      label: t('budgetGeneralParams.budgetModes.media')
    },
    { 
      id: 'client', 
      label: t('budgetGeneralParams.budgetModes.client')
    }
  ];
  
  const selectedCurrency = formData.TC_Currency || 'CAD';
  const selectedUnitType = formData.TC_Unit_Type || '';
  const selectedBudgetMode = formData.TC_Budget_Mode || 'media';

  return (
    <div className="space-y-6">
      {unitTypeOptions.length > 0 && (
        <SmartSelect
        id="TC_Unit_Type"
        name="TC_Unit_Type"
        value={selectedUnitType}
        onChange={onChange}
        items={unitTypeOptions || []}
        placeholder={t('budgetGeneralParams.unitType.placeholder')}
        label={createLabelWithHelp(
          t('budgetGeneralParams.unitType.label'), 
          t('budgetGeneralParams.unitType.tooltip'), 
          onTooltipChange
        )}
      />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              t('budgetGeneralParams.purchaseCurrency.label'), 
              t('budgetGeneralParams.purchaseCurrency.tooltip'), 
              onTooltipChange
            )}
          </div>
          <select
            id="TC_Currency"
            name="TC_Currency"
            value={selectedCurrency}
            onChange={onChange}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
          >
            {CURRENCIES.map(currency => (
              <option key={currency.id} value={currency.id}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              t('budgetGeneralParams.entryMode.label'), 
              t('budgetGeneralParams.entryMode.tooltip'), 
              onTooltipChange
            )}
          </div>
          <select
            id="TC_Budget_Mode"
            name="TC_Budget_Mode"
            value={selectedBudgetMode}
            onChange={onChange}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
          >
            {BUDGET_MODES.map(mode => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-800 mb-2">
          {t('budgetGeneralParams.infoBox.title')}
        </h5>
        <div className="text-sm text-blue-700 space-y-2">
          <div>
            <strong>{t('budgetGeneralParams.infoBox.mediaBudgetTitle')}</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• {t('budgetGeneralParams.infoBox.mediaBudgetItem1')}</li>
              <li>• {t('budgetGeneralParams.infoBox.mediaBudgetItem2')}</li>
            </ul>
          </div>
          <div>
            <strong>{t('budgetGeneralParams.infoBox.clientBudgetTitle')}</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• {t('budgetGeneralParams.infoBox.clientBudgetItem1')}</li>
              <li>• {t('budgetGeneralParams.infoBox.clientBudgetItem2')}</li>
            </ul>
          </div>
        </div>
      </div>

      {unitTypeOptions.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <strong>{t('budgetGeneralParams.noUnitTypeWarning.label')}</strong> {t('budgetGeneralParams.noUnitTypeWarning.text')}
          </p>
        </div>
      )}

      {disabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            {t('budgetGeneralParams.loading.text')}
          </p>
        </div>
      )}
    </div>
  );
});

BudgetGeneralParams.displayName = 'BudgetGeneralParams';

export default BudgetGeneralParams;