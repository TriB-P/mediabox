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
 */
'use client';

import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';
import CostGuideModal from './CostGuideModal';
import { CostGuideEntry } from '../../../types/costGuide';
import { getClientInfo } from '../../../lib/clientService';
import { getCostGuideEntries } from '../../../lib/costGuideService';

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
 * @param unitType - L'identifiant du type d'unité (ex: 'impressions').
 * @param unitTypeOptions - La liste des options de types d'unité disponibles pour trouver le libellé correspondant.
 * @returns Un objet contenant les chaînes de caractères et les fonctions de formatage pour l'interface utilisateur.
 */
const generateDynamicLabels = (unitType: string | undefined, unitTypeOptions: Array<{ id: string; label: string }>) => {
  const selectedUnitType = unitTypeOptions.find(option => option.id === unitType);
  const unitDisplayName = selectedUnitType?.label || 'unité';
  
  const isImpression = unitDisplayName.toLowerCase().includes('impression');
  
  if (isImpression) {
    return {
      costLabel: 'CPM',
      costTooltip: 'Coût par mille impressions. Montant payé pour 1000 impressions affichées.',
      volumeLabel: `Volume d'${unitDisplayName.toLowerCase()}`,
      volumeTooltip: `Nombre d'${unitDisplayName.toLowerCase()} calculé automatiquement selon la formule : (Budget média + Bonification) ÷ CPM × 1000. Ce champ est en lecture seule et calculé par le système.`,
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
    costLabel: `Coût par ${unitSingular}`,
    costTooltip: `Coût unitaire pour le type d'unité sélectionné (${unitDisplayName}). Ce champ est obligatoire et doit être saisi manuellement.`,
    volumeLabel: `Volume de ${unitLower}`,
    volumeTooltip: `Nombre de ${unitLower} calculé automatiquement selon la formule : (Budget média + Bonification) ÷ Coût par ${unitSingular}. Ce champ est en lecture seule et calculé par le système.`,
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
  
  const budget = formData.TC_Budget || 0;
  const costPerUnit = formData.TC_Cost_Per_Unit || 0;
  const unitVolume = formData.TC_Unit_Volume || 0;
  const currency = formData.TC_Currency || 'CAD';
  const budgetMode = formData.TC_Budget_Mode || 'media';
  const hasBonus = formData.TC_Has_Bonus || false;
  const bonusValue = formData.TC_Bonus_Value || 0;
  const unitType = formData.TC_Unit_Type;

  const dynamicLabels = useMemo(() => {
    return generateDynamicLabels(unitType, unitTypeOptions);
  }, [unitType, unitTypeOptions]);

  const budgetConfig = useMemo(() => {
    if (budgetMode === 'client') {
      return {
        label: 'Budget client',
        tooltip: 'Montant total que le client paiera, incluant le budget média et tous les frais applicables. Le budget média sera calculé en déduisant les frais de ce montant.'
      };
    } else {
      return {
        label: 'Budget média',
        tooltip: 'Montant net qui sera effectivement dépensé sur les plateformes publicitaires, sans les frais. Le volume d\'unités sera calculé sur ce montant plus la bonification.'
      };
    }
  }, [budgetMode]);

  const displayMediaBudget = useMemo(() => {
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

  const calculationStatus = useMemo(() => {
    const hasValidBudget = budget > 0;
    const hasValidMediaBudget = displayMediaBudget > 0;
    const hasValidCost = costPerUnit > 0;
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
            value={budget || ''}
            onChange={handleBudgetChange}
            min="0"
            step="0.01"
            disabled={disabled}
            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
            placeholder="0.00"
          />
        </div>
      </div>

      {budgetMode === 'client' && budget > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-800 mb-2">
            💡 Calcul du budget média
          </h5>
          <div className="text-sm text-blue-700">
            <div className="flex justify-between items-center">
              <span>Budget client saisi :</span>
              <span className="font-medium">{formatCurrency(budget)} {currency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Budget média estimé :</span>
              <span className="font-medium">{formatCurrency(displayMediaBudget)} {currency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Frais applicables :</span>
              <span className="font-medium">{formatCurrency(totalFees)} {currency}</span>
            </div>
            <div className="flex justify-between items-center border-t border-blue-300 pt-2 mt-2 font-semibold">
              <span>Vérification :</span>
              <span className="text-blue-800">{formatCurrency(displayMediaBudget + totalFees)} {currency}</span>
            </div>
            <div className="text-xs text-blue-600 mt-2">
              💡 Les calculs exacts sont effectués automatiquement par le système.
            </div>
          </div>
        </div>
      )}

      {budgetMode === 'media' && budget > 0 && totalFees > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-green-800 mb-2">
            💰 Budget client total
          </h5>
          <div className="text-sm text-green-700">
            <div className="flex justify-between items-center">
              <span>Budget média saisi :</span>
              <span className="font-medium">{formatCurrency(budget)} {currency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Plus total des frais :</span>
              <span className="font-medium">+{formatCurrency(totalFees)} {currency}</span>
            </div>
            <div className="flex justify-between items-center border-t border-green-300 pt-2 mt-2 font-semibold">
              <span>Budget client facturé :</span>
              <span className="text-green-800">{formatCurrency(displayClientBudget)} {currency}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              `${dynamicLabels.costLabel} *`, 
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
                value={costPerUnit || ''}
                onChange={handleCostChange}
                min="0"
                step="0.0001"
                disabled={disabled}
                required
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
                '⏳ Chargement du guide...'
              ) : isCostGuideAvailable ? (
                '📋 Utiliser le guide de coût'
              ) : (
                '📋 Guide de coût non disponible'
              )}
            </button>
          </div>
          
          {costPerUnit > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Formaté : {dynamicLabels.formatCostDisplay(costPerUnit)} {currency}
            </div>
          )}
          {costPerUnit === 0 && (
            <div className="mt-1 text-xs text-red-600">
              Champ obligatoire pour calculer le volume
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              `${dynamicLabels.volumeLabel} (calculé)`, 
              dynamicLabels.volumeTooltip, 
              onTooltipChange
            )}
          </div>
          <input
            type="number"
            value={unitVolume || ''}
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-700 font-medium"
            placeholder="Calculé automatiquement"
          />
          {unitVolume > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Formaté : {dynamicLabels.formatVolumeDisplay(unitVolume)} {unitType ? unitTypeOptions.find(opt => opt.id === unitType)?.label?.toLowerCase() || 'unités' : 'unités'}
            </div>
          )}
          {effectiveBudgetForVolume > 0 && costPerUnit > 0 && (
            <div className="mt-1 text-xs text-green-600">
              = {formatCurrency(effectiveBudgetForVolume)} {currency} ÷ {dynamicLabels.formatCostDisplay(costPerUnit)} {currency}
              {dynamicLabels.costLabel === 'CPM' && ' × 1000'}
            </div>
          )}
          {!calculationStatus.canCalculateVolume && budget > 0 && (
            <div className="mt-1 text-xs text-orange-600">
              Nécessite un coût par unité valide pour le calcul
            </div>
          )}
        </div>
      </div>

      {(!budget || !costPerUnit) && !disabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm text-yellow-700">
            ⚠️ <strong>Configuration incomplète</strong>
            <ul className="mt-2 ml-4 space-y-1 text-xs">
              {!budget && <li>• Saisir un budget ({budgetMode === 'client' ? 'client' : 'média'})</li>}
              {!costPerUnit && <li>• Saisir un {dynamicLabels.costLabel.toLowerCase()}</li>}
            </ul>
          </div>
        </div>
      )}

      {disabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            ⏳ Chargement en cours... Les calculs budgétaires seront disponibles une fois les données chargées.
          </p>
        </div>
      )}

      {/* Modal du guide de coûts */}
      <CostGuideModal
        isOpen={isCostGuideModalOpen}
        onClose={handleCloseCostGuideModal}
        onSelect={handleCostGuideSelection}
        costGuideEntries={costGuideEntries}
        title="Sélectionner un coût du guide"
      />
    </div>
  );
});

BudgetMainSection.displayName = 'BudgetMainSection';

export default BudgetMainSection;