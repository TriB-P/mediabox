// app/components/Tactiques/BudgetMainSection.tsx

'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';

// ==================== TYPES ====================

interface BudgetMainSectionProps {
  // Données du formulaire
  formData: {
    TC_Budget?: number;
    TC_Currency?: string;
    TC_Cost_Per_Unit?: number;
    TC_Unit_Volume?: number;
    TC_Budget_Mode?: 'client' | 'media';
    TC_Has_Bonus?: boolean;
    TC_Bonus_Value?: number;
    TC_Unit_Type?: string; // NOUVEAU: Type d'unité pour les labels dynamiques
  };
  
  // Données externes pour les calculs
  totalFees: number; // Total des frais calculés
  
  // NOUVEAU: Options pour le type d'unité (pour récupérer le display name)
  unitTypeOptions: Array<{ id: string; label: string }>;
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  onCalculatedChange: (field: string, value: number) => void;
  
  // État de chargement
  disabled?: boolean;
}

// ==================== UTILITAIRES POUR LABELS DYNAMIQUES ====================

/**
 * Génère les labels dynamiques en fonction du type d'unité
 */
const generateDynamicLabels = (unitType: string | undefined, unitTypeOptions: Array<{ id: string; label: string }>) => {
  // Trouver le display name du type d'unité
  const selectedUnitType = unitTypeOptions.find(option => option.id === unitType);
  const unitDisplayName = selectedUnitType?.label || 'unité';
  
  // Cas spécial pour les impressions → CPM
  const isImpression = unitDisplayName.toLowerCase().includes('impression');
  
  if (isImpression) {
    return {
      costLabel: 'CPM',
      costTooltip: 'Coût par mille impressions. Montant payé pour 1000 impressions affichées.',
      volumeLabel: `Volume d'${unitDisplayName.toLowerCase()}`,
      volumeTooltip: `Nombre d'${unitDisplayName.toLowerCase()} calculé automatiquement selon la formule : (Budget média + Bonification) ÷ CPM × 1000. Ce champ est en lecture seule et calculé par le système.`,
      costPlaceholder: '0.0000',
      formatCostDisplay: (value: number) => {
        // Pour CPM, afficher avec plus de précision
        return new Intl.NumberFormat('fr-CA', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4
        }).format(value);
      },
      formatVolumeDisplay: (value: number) => {
        // Pour les impressions, pas de décimales
        return new Intl.NumberFormat('fr-CA', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      }
    };
  }
  
  // Cas général pour les autres types d'unité
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
      // Pour la plupart des unités, afficher sans décimales
      return new Intl.NumberFormat('fr-CA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
  };
};

// ==================== COMPOSANT PRINCIPAL ====================

const BudgetMainSection = memo<BudgetMainSectionProps>(({
  formData,
  totalFees,
  unitTypeOptions = [], // NOUVEAU: Valeur par défaut
  onChange,
  onTooltipChange,
  onCalculatedChange,
  disabled = false
}) => {
  
  // Extraire les valeurs du formulaire
  const budget = formData.TC_Budget || 0;
  const costPerUnit = formData.TC_Cost_Per_Unit || 0;
  const unitVolume = formData.TC_Unit_Volume || 0;
  const currency = formData.TC_Currency || 'CAD';
  const budgetMode = formData.TC_Budget_Mode || 'media';
  const hasBonus = formData.TC_Has_Bonus || false;
  const bonusValue = formData.TC_Bonus_Value || 0;
  const unitType = formData.TC_Unit_Type; // NOUVEAU

  // NOUVEAU: Générer les labels dynamiques
  const dynamicLabels = useMemo(() => {
    return generateDynamicLabels(unitType, unitTypeOptions);
  }, [unitType, unitTypeOptions]);

  // Déterminer l'étiquette et la description du budget selon le mode
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

  // Calcul simple du budget média (pour affichage informatif seulement)
  const displayMediaBudget = useMemo(() => {
    if (budgetMode === 'client') {
      return Math.max(0, budget - totalFees);
    } else {
      return budget;
    }
  }, [budget, totalFees, budgetMode]);

  // Calcul du budget effectif pour le volume (média + bonification) - pour affichage
  const effectiveBudgetForVolume = useMemo(() => {
    const baseBudget = displayMediaBudget;
    const bonus = hasBonus ? bonusValue : 0;
    return baseBudget + bonus;
  }, [displayMediaBudget, hasBonus, bonusValue]);

  // Calcul du budget client effectif (pour affichage informatif seulement)
  const displayClientBudget = useMemo(() => {
    if (budgetMode === 'client') {
      return budget;
    } else {
      return budget + totalFees;
    }
  }, [budget, totalFees, budgetMode]);

  // Gestionnaire pour le changement de budget
  const handleBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  }, [onChange]);

  // Gestionnaire pour le changement de coût par unité
  const handleCostChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = parseFloat(e.target.value) || 0;
    onCalculatedChange('TC_Cost_Per_Unit', newCost);
  }, [onCalculatedChange]);

  // Déterminer les statuts de calcul (pour l'affichage des messages)
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

  // Formater les nombres pour l'affichage
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  return (
    <div className="space-y-6">
      {/* Budget principal */}
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

      {/* Affichage informatif du budget média si en mode client */}
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

      {/* Affichage informatif du budget client si en mode média */}
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
        {/* MODIFIÉ: Coût par unité avec label dynamique */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              `${dynamicLabels.costLabel} *`, 
              dynamicLabels.costTooltip, 
              onTooltipChange
            )}
          </div>
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

        {/* MODIFIÉ: Volume d'unité avec label dynamique */}
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

 

      {/* Message si données incomplètes */}
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

      {/* Message si champs désactivés */}
      {disabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            ⏳ Chargement en cours... Les calculs budgétaires seront disponibles une fois les données chargées.
          </p>
        </div>
      )}
    </div>
  );
});

BudgetMainSection.displayName = 'BudgetMainSection';

export default BudgetMainSection;