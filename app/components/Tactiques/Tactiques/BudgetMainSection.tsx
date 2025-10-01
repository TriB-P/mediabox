// app/components/Tactiques/BudgetMainSection.tsx

/**
 * Ce fichier définit le composant `BudgetMainSection`.
 * Il s'agit d'une section de formulaire React, côté client ('use client'),
 * dédiée à la gestion des informations budgétaires principales pour une "tactique".
 * Ce composant affiche des champs pour le budget (client ou média), le coût par unité,
 * et calcule dynamiquement le volume d'unités correspondant.
 * Il est conçu pour être flexible, avec des libellés et des calculs qui s'adaptent
 * au type d'unité sélectionné (par exemple, il gère le cas spécifique du CPM pour les impressions).
 * Il ne gère pas son propre état ; toutes les données et les fonctions de rappel (callbacks)
 * sont passées via ses props, le rendant ainsi un composant de présentation réutilisable.
 * 
 * CORRECTION: Champs vides par défaut au lieu de 0
 */
'use client';

import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';
import CostGuideModal from './CostGuideModal';
import { CostGuideEntry } from '../../../types/costGuide';
import { getClientInfo } from '../../../lib/clientService';
import { getCostGuideEntries } from '../../../lib/costGuideService';
import { useTranslation } from '../../../contexts/LanguageContext';

interface BudgetMainSectionProps {
  formData: {
    TC_Budget?: number;
    TC_Currency?: string;
    TC_Cost_Per_Unit?: number;
    TC_Unit_Volume?: number;
    TC_Budget_Mode?: 'client' | 'media';
    TC_Has_Bonus?: boolean;
    TC_Bonus_Value?: number;
    TC_Unit_Type?: string;
  };
  totalFees: number;
  unitTypeOptions: Array<{ id: string; label: string }>;
  clientId?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  onCalculatedChange: (field: string, value: number) => void;
  disabled?: boolean;
}

/**
 * Génère des libellés, des infobulles et des formats d'affichage dynamiques en fonction du type d'unité sélectionné.
 * Gère spécifiquement le cas des "impressions" pour utiliser le terme "CPM".
 * @param {string} unitType - L'identifiant du type d'unité (ex: 'impressions').
 * @param {string} unitTypeOptions - La liste des options de types d'unité disponibles pour trouver le libellé correspondant.
 * @param {Function} t - La fonction de traduction.
 * @returns Un objet contenant les chaînes de caractères et les fonctions de formatage pour l'interface utilisateur.
 */
const generateDynamicLabels = (unitType: string | undefined, unitTypeOptions: Array<{ id: string; label: string }>, t: (key: string) => string) => {
  const selectedUnitType = unitTypeOptions.find(option => option.id === unitType);
  const unitDisplayName = selectedUnitType?.label || t('budgetMainSection.form.unit');
  
  const isImpression = unitDisplayName.toLowerCase().includes('impression');
  
  if (isImpression) {
    return {
      costLabel: 'CPM',
      costTooltip: t('budgetMainSection.dynamicLabels.cpmTooltip'),
      volumeLabel: t('budgetMainSection.dynamicLabels.impressionVolumeLabel').replace('{unit}', unitDisplayName.toLowerCase()),
      volumeTooltip: t('budgetMainSection.dynamicLabels.impressionVolumeTooltip').replace('{unit}', unitDisplayName.toLowerCase()),
      costPlaceholder: '0.0000',
      formatCostDisplay: (value: number) => {
        return new Intl.NumberFormat('fr-CA', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4
        }).format(value);
      },
      formatVolumeDisplay: (value: number) => {
        return new Intl.NumberFormat('fr-CA', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      }
    };
  }
  
  const unitLower = unitDisplayName.toLowerCase();
  const unitSingular = unitLower.endsWith('s') ? unitLower.slice(0, -1) : unitLower;
  
  return {
    costLabel: t('budgetMainSection.dynamicLabels.costPerUnit').replace('{unit}', unitSingular),
    costTooltip: t('budgetMainSection.dynamicLabels.costPerUnitTooltip').replace('{unit}', unitDisplayName),
    volumeLabel: t('budgetMainSection.dynamicLabels.unitVolumeLabel').replace('{unit}', unitLower),
    volumeTooltip: t('budgetMainSection.dynamicLabels.unitVolumeTooltip').replace('{unit}', unitLower).replace('{unitSingular}', unitSingular),
    costPlaceholder: '0.0000',
    formatCostDisplay: (value: number) => {
      return new Intl.NumberFormat('fr-CA', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 6
      }).format(value);
    },
    formatVolumeDisplay: (value: number) => {
      return new Intl.NumberFormat('fr-CA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
  };
};

/**
 * Composant principal pour la section budget du formulaire de tactique.
 * @param props - Les propriétés du composant.
 * @param props.formData - Les données actuelles du formulaire.
 * @param props.totalFees - Le montant total des frais calculés en externe.
 * @param props.unitTypeOptions - La liste des types d'unités possibles pour les libellés dynamiques.
 * @param props.clientId - L'identifiant du client pour récupérer le guide de coûts.
 * @param props.onChange - Callback pour gérer les changements sur les champs de saisie contrôlés.
 * @param props.onTooltipChange - Callback pour afficher une infobulle dans un composant parent.
 * @param props.onCalculatedChange - Callback pour mettre à jour des champs calculés dans l'état parent.
 * @param props.disabled - Un booléen pour désactiver les champs, généralement pendant le chargement.
 * @returns Le JSX de la section du formulaire de budget.
 */
const BudgetMainSection = memo<BudgetMainSectionProps>(({
  formData,
  totalFees,
  unitTypeOptions = [],
  clientId,
  onChange,
  onTooltipChange,
  onCalculatedChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  
  // État local pour le modal du guide de coûts et les données
  const [isCostGuideModalOpen, setIsCostGuideModalOpen] = useState(false);
  const [costGuideEntries, setCostGuideEntries] = useState<CostGuideEntry[]>([]);
  const [clientHasCostGuide, setClientHasCostGuide] = useState<boolean>(false);
  const [costGuideLoading, setCostGuideLoading] = useState<boolean>(false);

  // Vérifier si le client a un cost guide
  useEffect(() => {
    const checkClientCostGuide = async () => {
      if (!clientId) {
        console.log('BudgetMainSection: Pas de clientId fourni');
        setClientHasCostGuide(false);
        return;
      }
      
      try {
        setCostGuideLoading(true);
        console.log('BudgetMainSection: Vérification du cost guide pour client:', clientId);
        
        const clientInfo = await getClientInfo(clientId);
        console.log('BudgetMainSection: Infos client récupérées:', clientInfo);
        console.log('BudgetMainSection: CL_Cost_Guide_ID:', clientInfo.CL_Cost_Guide_ID);
        
        const costGuideId = clientInfo.CL_Cost_Guide_ID;
        const hasCostGuide = !!(costGuideId && costGuideId.trim());
        
        console.log('BudgetMainSection: Client a cost guide?', hasCostGuide);
        setClientHasCostGuide(hasCostGuide);
        
        if (hasCostGuide && costGuideId) {
          console.log('BudgetMainSection: Chargement des entrées du cost guide...');
          const entries = await getCostGuideEntries(costGuideId);
          console.log('BudgetMainSection: Entrées chargées:', entries.length);
          setCostGuideEntries(entries);
        } else {
          setCostGuideEntries([]);
        }
      } catch (error) {
        console.error('BudgetMainSection: Erreur lors de la vérification du cost guide:', error);
        setClientHasCostGuide(false);
        setCostGuideEntries([]);
      } finally {
        setCostGuideLoading(false);
      }
    };

    checkClientCostGuide();
  }, [clientId]);
  
  // 🆕 CORRECTION: Ne plus forcer à 0, laisser undefined
  const budget = formData.TC_Budget;
  const costPerUnit = formData.TC_Cost_Per_Unit;
  const unitVolume = formData.TC_Unit_Volume ?? 0;
  const currency = formData.TC_Currency || 'CAD';
  const budgetMode = formData.TC_Budget_Mode || 'media';
  const hasBonus = formData.TC_Has_Bonus || false;
  const bonusValue = formData.TC_Bonus_Value || 0;
  const unitType = formData.TC_Unit_Type;

  const dynamicLabels = useMemo(() => {
    return generateDynamicLabels(unitType, unitTypeOptions, t);
  }, [unitType, unitTypeOptions, t]);

  const budgetConfig = useMemo(() => {
    if (budgetMode === 'client') {
      return {
        label: t('budgetMainSection.budgetConfig.clientBudgetLabel'),
        tooltip: t('budgetMainSection.budgetConfig.clientBudgetTooltip')
      };
    } else {
      return {
        label: t('budgetMainSection.budgetConfig.mediaBudgetLabel'),
        tooltip: t('budgetMainSection.budgetConfig.mediaBudgetTooltip')
      };
    }
  }, [budgetMode, t]);

  // 🆕 CORRECTION: Gérer undefined dans les calculs
  const displayMediaBudget = useMemo(() => {
    if (!budget) return 0;
    if (budgetMode === 'client') {
      return Math.max(0, budget - totalFees);
    } else {
      return budget;
    }
  }, [budget, totalFees, budgetMode]);

  const effectiveBudgetForVolume = useMemo(() => {
    const baseBudget = displayMediaBudget;
    const bonus = hasBonus ? bonusValue : 0;
    return baseBudget + bonus;
  }, [displayMediaBudget, hasBonus, bonusValue]);

  const displayClientBudget = useMemo(() => {
    if (!budget) return 0;
    if (budgetMode === 'client') {
      return budget;
    } else {
      return budget + totalFees;
    }
  }, [budget, totalFees, budgetMode]);

  // Vérifier si le guide de coûts est disponible
  const isCostGuideAvailable = useMemo(() => {
    return clientHasCostGuide && costGuideEntries.length > 0;
  }, [clientHasCostGuide, costGuideEntries]);

  const handleBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  }, [onChange]);

  const handleCostChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = parseFloat(e.target.value) || 0;
    onCalculatedChange('TC_Cost_Per_Unit', newCost);
  }, [onCalculatedChange]);

  // Handlers pour le modal du guide de coûts
  const handleOpenCostGuideModal = useCallback(() => {
    setIsCostGuideModalOpen(true);
  }, []);

  const handleCloseCostGuideModal = useCallback(() => {
    setIsCostGuideModalOpen(false);
  }, []);

  const handleCostGuideSelection = useCallback((unitPrice: number) => {
    onCalculatedChange('TC_Cost_Per_Unit', unitPrice);
    setIsCostGuideModalOpen(false);
  }, [onCalculatedChange]);

  // 🆕 CORRECTION: Différencier undefined de 0
  const calculationStatus = useMemo(() => {
    const hasValidBudget = budget !== undefined && budget !== null && budget > 0;
    const hasValidMediaBudget = displayMediaBudget > 0;
    const hasValidCost = costPerUnit !== undefined && costPerUnit !== null && costPerUnit > 0;
    const hasValidEffectiveBudget = effectiveBudgetForVolume > 0;
    
    return {
      canCalculateVolume: hasValidCost && hasValidEffectiveBudget,
      hasPartialData: hasValidBudget || hasValidCost,
      isComplete: hasValidCost && hasValidEffectiveBudget,
      mediaBudgetValid: hasValidMediaBudget,
      effectiveBudgetValid: hasValidEffectiveBudget
    };
  }, [budget, displayMediaBudget, costPerUnit, effectiveBudgetForVolume]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          {createLabelWithHelp(
            budgetConfig.label, 
            budgetConfig.tooltip, 
            onTooltipChange
          )}
        </div>
        <div className="relative rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm font-medium">{currency}</span>
          </div>
          <input
            type="number"
            id="TC_Budget"
            name="TC_Budget"
            value={budget ?? ''}
            onChange={handleBudgetChange}
            min="0"
            step="0.01"
            disabled={disabled}
            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
            placeholder="0.00"
          />
        </div>
      </div>

      {budgetMode === 'client' && budget !== undefined && budget !== null && budget > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-800 mb-2">
            {t('budgetMainSection.clientBudgetBox.title')}
          </h5>
          <div className="text-sm text-blue-700">
            <div className="flex justify-between items-center">
              <span>{t('budgetMainSection.clientBudgetBox.clientBudgetEntered')}</span>
              <span className="font-medium">{formatCurrency(budget)} {currency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t('budgetMainSection.clientBudgetBox.estimatedMediaBudget')}</span>
              <span className="font-medium">{formatCurrency(displayMediaBudget)} {currency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t('budgetMainSection.clientBudgetBox.applicableFees')}</span>
              <span className="font-medium">{formatCurrency(totalFees)} {currency}</span>
            </div>
            <div className="flex justify-between items-center border-t border-blue-300 pt-2 mt-2 font-semibold">
              <span>{t('budgetMainSection.clientBudgetBox.verification')}</span>
              <span className="text-blue-800">{formatCurrency(displayMediaBudget + totalFees)} {currency}</span>
            </div>
            <div className="text-xs text-blue-600 mt-2">
              {t('budgetMainSection.clientBudgetBox.calculationNote')}
            </div>
          </div>
        </div>
      )}

      {budgetMode === 'media' && budget !== undefined && budget !== null && budget > 0 && totalFees > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-green-800 mb-2">
            {t('budgetMainSection.mediaBudgetBox.title')}
          </h5>
          <div className="text-sm text-green-700">
            <div className="flex justify-between items-center">
              <span>{t('budgetMainSection.mediaBudgetBox.mediaBudgetEntered')}</span>
              <span className="font-medium">{formatCurrency(budget)} {currency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t('budgetMainSection.mediaBudgetBox.plusTotalFees')}</span>
              <span className="font-medium">+{formatCurrency(totalFees)} {currency}</span>
            </div>
            <div className="flex justify-between items-center border-t border-green-300 pt-2 mt-2 font-semibold">
              <span>{t('budgetMainSection.mediaBudgetBox.invoicedClientBudget')}</span>
              <span className="text-green-800">{formatCurrency(displayClientBudget)} {currency}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              `${dynamicLabels.costLabel}`, 
              dynamicLabels.costTooltip, 
              onTooltipChange
            )}
          </div>
          <div className="space-y-2">
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm font-medium">{currency}</span>
              </div>
              <input
                type="number"
                value={costPerUnit ?? ''}
                onChange={handleCostChange}
                min="0"
                step="0.0001"
                disabled={disabled}
                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
                placeholder={dynamicLabels.costPlaceholder}
              />
            </div>
            
            {/* Bouton guide de coûts */}
            <button
              type="button"
              onClick={handleOpenCostGuideModal}
              disabled={disabled || !isCostGuideAvailable || costGuideLoading}
              className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors ${
                disabled || !isCostGuideAvailable || costGuideLoading
                  ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300'
              }`}
            >
              {costGuideLoading ? (
                t('budgetMainSection.costGuide.loading')
              ) : isCostGuideAvailable ? (
                t('budgetMainSection.costGuide.useGuide')
              ) : (
                t('budgetMainSection.costGuide.notAvailable')
              )}
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              `${dynamicLabels.volumeLabel} ${t('budgetMainSection.form.calculatedLabel')}`, 
              dynamicLabels.volumeTooltip, 
              onTooltipChange
            )}
          </div>
          <input
            type="number"
            value={costPerUnit !== undefined && costPerUnit !== null && costPerUnit > 0 ? (unitVolume ?? '') : ''}
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-700 font-medium"
            placeholder={t('budgetMainSection.form.calculatedAutomatically')}
          />
          {costPerUnit !== undefined && costPerUnit !== null && costPerUnit > 0 && unitVolume > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              {t('common.formatted')} {dynamicLabels.formatVolumeDisplay(unitVolume)} {unitType ? unitTypeOptions.find(opt => opt.id === unitType)?.label?.toLowerCase() || t('budgetMainSection.form.units') : t('budgetMainSection.form.units')}
            </div>
          )}
          {effectiveBudgetForVolume > 0 && costPerUnit !== undefined && costPerUnit !== null && costPerUnit > 0 && (
            <div className="mt-1 text-xs text-green-600">
              = {formatCurrency(effectiveBudgetForVolume)} {currency} ÷ {dynamicLabels.formatCostDisplay(costPerUnit)} {currency}
              {dynamicLabels.costLabel === 'CPM' && ' × 1000'}
            </div>
          )}
          {!calculationStatus.canCalculateVolume && budget !== undefined && budget !== null && budget > 0 && (
            <div className="mt-1 text-xs text-orange-600">
              {t('budgetMainSection.form.requiresValidCost')}
            </div>
          )}
        </div>
      </div>

      {((budget === undefined || budget === null) || (costPerUnit === undefined || costPerUnit === null)) && !disabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm text-yellow-700">
            ⚠️ <strong>{t('budgetMainSection.incompleteWarning.title')}</strong>
            <ul className="mt-2 ml-4 space-y-1 text-xs">
              {(budget === undefined || budget === null) && <li>{t('budgetMainSection.incompleteWarning.enterBudget').replace('{mode}', budgetMode === 'client' ? t('budgetMainSection.incompleteWarning.clientMode') : t('budgetMainSection.incompleteWarning.mediaMode'))}</li>}
              {(costPerUnit === undefined || costPerUnit === null) && <li>{t('budgetMainSection.incompleteWarning.enterCost').replace('{costLabel}', dynamicLabels.costLabel.toLowerCase())}</li>}
            </ul>
          </div>
        </div>
      )}

      {disabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            {t('budgetMainSection.loadingMessage')}
          </p>
        </div>
      )}

      {/* Modal du guide de coûts */}
      <CostGuideModal
        isOpen={isCostGuideModalOpen}
        onClose={handleCloseCostGuideModal}
        onSelect={handleCostGuideSelection}
        costGuideEntries={costGuideEntries}
        title={t('budgetMainSection.costGuide.modalTitle')}
      />
    </div>
  );
});

BudgetMainSection.displayName = 'BudgetMainSection';

export default BudgetMainSection;