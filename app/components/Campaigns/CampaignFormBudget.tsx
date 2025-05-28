// app/components/Campaigns/CampaignFormBudget.tsx

'use client';

import React, { memo } from 'react';
import { 
  FormInput, 
  createLabelWithHelp,
  FormSection 
} from '../Tactiques/TactiqueFormComponents';
import { CampaignFormData } from '../../types/campaign';

// ==================== TYPES ====================

interface CampaignFormBudgetProps {
  formData: CampaignFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  loading?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const CampaignFormBudget = memo<CampaignFormBudgetProps>(({
  formData,
  onChange,
  onTooltipChange,
  loading = false
}) => {
  const isDisabled = loading;

  // Options de devise
  const currencyOptions = [
    { value: 'CAD', label: 'CAD - Dollar Canadien' },
    { value: 'USD', label: 'USD - Dollar Américain' },
    { value: 'EUR', label: 'EUR - Euro' },
  ];

  // Calculer le total des frais personnalisés
  const getTotalCustomFees = (): number => {
    const fees = [
      parseFloat(formData.customFee1 || '0'),
      parseFloat(formData.customFee2 || '0'),
      parseFloat(formData.customFee3 || '0'),
      parseFloat(formData.customFee4 || '0'),
      parseFloat(formData.customFee5 || '0'),
    ];
    
    return fees.reduce((sum, fee) => sum + (isNaN(fee) ? 0 : fee), 0);
  };

  const totalCustomFees = getTotalCustomFees();
  const mainBudget = parseFloat(formData.budget || '0');
  const totalBudget = mainBudget + totalCustomFees;

  return (
    <div className="p-8 space-y-6">
      <FormSection
        title="Budget et coûts"
        description="Définissez le budget principal et les frais additionnels"
      >
        <div className="space-y-6">
          {/* Budget principal */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                'Budget principal *', 
                'Budget principal alloué à cette campagne', 
                onTooltipChange
              )}
            </div>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="budget"
                id="budget"
                required={!isDisabled}
                value={formData.budget}
                onChange={onChange}
                className="w-full pl-7 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Devise */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                'Devise', 
                'Devise utilisée pour cette campagne', 
                onTooltipChange
              )}
            </div>
            <select
              name="currency"
              id="currency"
              value={formData.currency || 'CAD'}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
        title="Frais personnalisés"
        description="Ajoutez des frais additionnels spécifiques à votre campagne"
      >
        <div className="space-y-6">
          {/* Frais personnalisés 1-5 */}
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num}>
              <div className="flex items-center gap-3 mb-2">
                {createLabelWithHelp(
                  `Frais personnalisé ${num}`, 
                  `Frais additionnel #${num} (ex: frais de production, commission, etc.)`, 
                  onTooltipChange
                )}
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name={`customFee${num}`}
                  id={`customFee${num}`}
                  value={formData[`customFee${num}` as keyof CampaignFormData] as string || ''}
                  onChange={onChange}
                  className="w-full pl-7 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      {/* Récapitulatif budgétaire */}
      {(mainBudget > 0 || totalCustomFees > 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Récapitulatif budgétaire</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Budget principal :</span>
              <span className="font-medium">
                {new Intl.NumberFormat('fr-CA', {
                  style: 'currency',
                  currency: formData.currency || 'CAD',
                }).format(mainBudget)}
              </span>
            </div>
            
            {totalCustomFees > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Total frais personnalisés :</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('fr-CA', {
                    style: 'currency',
                    currency: formData.currency || 'CAD',
                  }).format(totalCustomFees)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="font-medium text-gray-900">Budget total :</span>
              <span className="font-bold text-lg text-indigo-600">
                {new Intl.NumberFormat('fr-CA', {
                  style: 'currency',
                  currency: formData.currency || 'CAD',
                }).format(totalBudget)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CampaignFormBudget.displayName = 'CampaignFormBudget';

export default CampaignFormBudget;