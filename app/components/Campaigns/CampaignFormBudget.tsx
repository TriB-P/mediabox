// app/components/Campaigns/CampaignFormBudget.tsx

/**
 * @file Ce fichier contient le composant React `CampaignFormBudget`.
 * Ce composant est responsable de l'affichage de la section "Budget et coûts"
 * dans le formulaire de création ou d'édition d'une campagne. Il permet à
 * l'utilisateur de saisir le budget principal, de choisir une devise et
 * d'ajouter des frais personnalisés définis au niveau du client. Il affiche
 * également un récapitulatif du budget média disponible (budget principal - frais).
 */

'use client';

import React, { memo } from 'react';
import { 
  FormInput, 
  createLabelWithHelp,
  FormSection 
} from '../Tactiques/Tactiques/TactiqueFormComponents';
import { CampaignFormData } from '../../types/campaign';
import { useTranslation } from '../../contexts/LanguageContext';

interface CampaignFormBudgetProps {
  formData: CampaignFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientConfig: { 
    CL_Custom_Fee_1?: string;
    CL_Custom_Fee_2?: string;
    CL_Custom_Fee_3?: string;
  };
  loading?: boolean;
}

/**
 * Affiche les champs de formulaire liés au budget d'une campagne.
 * @param {CampaignFormBudgetProps} props - Les propriétés du composant.
 * @param {CampaignFormData} props.formData - Les données actuelles du formulaire de la campagne.
 * @param {(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void} props.onChange - La fonction de rappel pour gérer les changements dans les champs du formulaire.
 * @param {(tooltip: string | null) => void} props.onTooltipChange - La fonction de rappel pour afficher des infobulles d'aide.
 * @param {object} props.clientConfig - La configuration du client, contenant les libellés des frais personnalisés.
 * @param {boolean} [props.loading=false] - Un booléen indiquant si le formulaire est en état de chargement, ce qui désactive les champs.
 * @returns {React.ReactElement} Le composant de formulaire pour le budget.
 */
const CampaignFormBudget = memo<CampaignFormBudgetProps>(({
  formData,
  onChange,
  onTooltipChange,
  clientConfig, 
  loading = false
}) => {
  const { t, language } = useTranslation();
  const isDisabled = loading;

  const currencyOptions = [
    { value: 'CAD', label: 'CAD - Dollar Canadien' },
    { value: 'USD', label: 'USD - Dollar Américain' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'CHF', label: 'CHF - Franc Suisse' },
  ];

  /**
   * Calcule et retourne la somme totale des frais personnalisés.
   * Elle lit les valeurs des frais depuis l'état `formData`, les convertit en nombres
   * et les additionne.
   * @returns {number} La somme des frais personnalisés.
   */
  const getTotalCustomFees = (): number => {
    const fees = [
      parseFloat(formData.CA_Custom_Fee_1 || '0'),
      parseFloat(formData.CA_Custom_Fee_2 || '0'),
      parseFloat(formData.CA_Custom_Fee_3 || '0'),
    ];
    
    return fees.reduce((sum, fee) => sum + (isNaN(fee) ? 0 : fee), 0);
  };

  const totalCustomFees = getTotalCustomFees();
  const mainBudget = parseFloat(formData.CA_Budget || '0');
  const mediaBudget = mainBudget - totalCustomFees; // MODIFICATION: soustraction au lieu d'addition

  return (
    <div className="p-8 space-y-6">
      <FormSection
        title={t('campaigns.formBudget.title')}
        description={t('campaigns.formBudget.description')}
      >
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                t('campaigns.formBudget.mainBudgetLabel'), 
                t('campaigns.formBudget.mainBudgetHelp'), 
                onTooltipChange
              )}
            </div>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="CA_Budget"
                id="CA_Budget"
                required={!isDisabled}
                value={formData.CA_Budget}
                onChange={onChange}
                className="w-full pl-7 px-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                t('campaigns.formBudget.currencyLabel'), 
                t('campaigns.formBudget.currencyHelp'), 
                onTooltipChange
              )}
            </div>
            <select
              name="CA_Currency"
              id="CA_Currency"
              value={formData.CA_Currency || 'CAD'}
              onChange={onChange}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection
        title={t('campaigns.formBudget.customFeesTitle')}
        description={t('campaigns.formBudget.customFeesDescription')}
      >
        <div className="space-y-6">
          {[1, 2, 3].map((num) => {
            const feeConfigName = `CL_Custom_Fee_${num}` as keyof typeof clientConfig;
            const customLabel = clientConfig[feeConfigName];

            if (customLabel && customLabel.trim() !== '') {
              const feeValueName = `CA_Custom_Fee_${num}` as keyof CampaignFormData;

              return (
                <div key={num}>
                  <div className="flex items-center gap-3 mb-2">
                    {createLabelWithHelp(
                      customLabel, 
                      t('campaigns.formBudget.customFeeHelp', { num }), 
                      onTooltipChange
                    )}
                  </div>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name={feeValueName}
                      id={feeValueName}
                      value={formData[feeValueName] as string || ''}
                      onChange={onChange}
                      className="w-full pl-7 px-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </FormSection>

      {(mainBudget > 0 || totalCustomFees > 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">{t('campaigns.formBudget.summaryTitle')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('campaigns.formBudget.summaryMainBudget')}</span>
              <span className="font-medium">
                {new Intl.NumberFormat(language === 'fr' ? 'fr-CA' : 'en-CA', {
                  style: 'currency',
                  currency: formData.CA_Currency || 'CAD',
                }).format(mainBudget)}
              </span>
            </div>
            
            {totalCustomFees > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t('campaigns.formBudget.summaryCustomFees')}</span>
                <span className="font-medium text-gray-600">
                  -{new Intl.NumberFormat(language === 'fr' ? 'fr-CA' : 'en-CA', {
                    style: 'currency',
                    currency: formData.CA_Currency || 'CAD',
                  }).format(totalCustomFees)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="font-medium text-gray-900">{t('campaigns.formBudget.summaryMediaBudget')}</span>
              <span className={`font-bold text-lg ${mediaBudget >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat(language === 'fr' ? 'fr-CA' : 'en-CA', {
                  style: 'currency',
                  currency: formData.CA_Currency || 'CAD',
                }).format(mediaBudget)}
              </span>
            </div>
            
            {mediaBudget < 0 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  ⚠️ {t('campaigns.formBudget.negativeBudgetWarning')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

CampaignFormBudget.displayName = 'CampaignFormBudget';

export default CampaignFormBudget;