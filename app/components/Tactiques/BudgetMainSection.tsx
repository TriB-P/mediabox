// app/components/Tactiques/BudgetMainSection.tsx

'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';

// ==================== TYPES ====================

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

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
    TC_Unit_Type?: string;
  };
  
  // Options pour les types d'unité
  unitTypeOptions: ListItem[];
  
  // Données externes pour les calculs
  totalFees: number;
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  onCalculatedChange: (field: string, value: number) => void;
  
  // État de chargement
  disabled?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const BudgetMainSection = memo<BudgetMainSectionProps>(({
  formData,
  unitTypeOptions,
  totalFees,
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
  const selectedUnitType = formData.TC_Unit_Type || '';

  // CORRIGÉ: Logique pour déterminer le type d'unité et ses propriétés
  const unitTypeInfo = useMemo(() => {
    if (!selectedUnitType || unitTypeOptions.length === 0) {
      return {
        displayName: '',
        isImpressions: false,
        costLabel: 'Coût par unité',
        volumeLabel: 'Volume d\'unité',
        volumeTooltip: 'Nombre d\'unités calculé automatiquement selon la formule : (Budget média + Bonification) ÷ Coût par unité. Ce champ est en lecture seule et calculé par le système.'
      };
    }

    const selectedUnit = unitTypeOptions.find(unit => unit.id === selectedUnitType);
    if (!selectedUnit) {
      return {
        displayName: '',
        isImpressions: false,
        costLabel: 'Coût par unité',
        volumeLabel: 'Volume d\'unité',
        volumeTooltip: 'Nombre d\'unités calculé automatiquement selon la formule : (Budget média + Bonification) ÷ Coût par unité. Ce champ est en lecture seule et calculé par le système.'
      };
    }

    const displayName = selectedUnit.SH_Display_Name_FR;
    const isImpressions = displayName.toLowerCase() === 'impressions' || displayName.toLowerCase() === 'impression';
    
    let costLabel, volumeLabel, volumeTooltip;
    
    if (isImpressions) {
      costLabel = 'CPM (Coût pour 1000 impressions)';
      volumeLabel = 'Volume d\'impressions';
      volumeTooltip = 'Nombre total d\'impressions calculé automatiquement. Le CPM représente le coût pour 1000 impressions, mais le volume affiché est le nombre total d\'impressions individuelles.';
    } else {
      costLabel = `Coût par ${displayName}`;
      volumeLabel = `Volume de ${displayName}`;
      volumeTooltip = `Nombre de ${displayName} calculé automatiquement selon la formule : (Budget média + Bonification) ÷ Coût par ${displayName}. Ce champ est en lecture seule et calculé par le système.`;
    }

    return {
      displayName,
      isImpressions,
      costLabel,
      volumeLabel,
      volumeTooltip
    };
  }, [selectedUnitType, unitTypeOptions]);

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

  // CORRIGÉ: Volume affiché avec formatage approprié pour les impressions
  const displayVolume = useMemo(() => {
    // Le volume stocké dans formData.TC_Unit_Volume est déjà le volume d'affichage
    // (converti en TactiqueFormBudget si nécessaire)
    return unitVolume;
  }, [unitVolume]);

  // Gestionnaire pour le changement de budget
  const handleBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  }, [onChange]);

  // Gestionnaire pour le changement de coût par unité
  const handleCostChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // CORRIGÉ: Le coût par unité est un input utilisateur, pas une valeur calculée
    onChange(e);
  }, [onChange]);

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

  const formatCostPerUnit = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(value);
  }, []);

  // CORRIGÉ: Formatage du volume selon le type d'unité avec plus de précision
  const formatVolume = useCallback((value: number) => {
    if (unitTypeInfo.isImpressions) {
      // Pour les impressions, formatage en entier avec séparateurs de milliers
      return new Intl.NumberFormat('fr-CA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.round(value));
    }
    
    // Pour les autres types, formatage en entier sans décimales
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value));
  }, [unitTypeInfo.isImpressions]);

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
        {/* Coût par unité - OBLIGATOIRE avec label dynamique */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              `${unitTypeInfo.costLabel} *`, 
              unitTypeInfo.isImpressions 
                ? 'Coût pour 1000 impressions (CPM). Ce champ est obligatoire et doit être saisi manuellement.'
                : `Coût unitaire pour ${unitTypeInfo.displayName || 'le type d\'unité sélectionné'}. Ce champ est obligatoire et doit être saisi manuellement.`, 
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
              placeholder="0.0000"
            />
          </div>
          {costPerUnit > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Formaté : {formatCostPerUnit(costPerUnit)} {currency}
              {unitTypeInfo.isImpressions && ' (pour 1000 impressions)'}
            </div>
          )}
          {costPerUnit === 0 && (
            <div className="mt-1 text-xs text-red-600">
              Champ obligatoire pour calculer le volume
            </div>
          )}
        </div>

          {/* Volume d'unité - CALCULÉ AUTOMATIQUEMENT avec label dynamique */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              `${unitTypeInfo.volumeLabel} (calculé)`, 
              unitTypeInfo.volumeTooltip, 
              onTooltipChange
            )}
          </div>
          <input
            type="text"
            value={displayVolume > 0 ? formatVolume(displayVolume) : ''}
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-700 font-medium"
            placeholder={displayVolume > 0 ? formatVolume(displayVolume) : "Sera calculé automatiquement"}
          />
          {displayVolume > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              {unitTypeInfo.isImpressions 
                ? `${formatVolume(displayVolume)} impressions totales`
                : `${formatVolume(displayVolume)} ${unitTypeInfo.displayName || 'unités'}`
              }
            </div>
          )}
          {effectiveBudgetForVolume > 0 && costPerUnit > 0 && displayVolume > 0 && (
            <div className="mt-1 text-xs text-green-600">
              = {formatCurrency(effectiveBudgetForVolume)} {currency} ÷ {formatCostPerUnit(costPerUnit)} {currency}
              {unitTypeInfo.isImpressions && ' × 1000 impressions'}
            </div>
          )}
          {!calculationStatus.canCalculateVolume && budget > 0 && (
            <div className="mt-1 text-xs text-orange-600">
              Nécessite un coût par unité valide pour le calcul
            </div>
          )}
        </div>
      </div>

      {/* Information sur le type d'unité sélectionné */}
      {unitTypeInfo.displayName && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-indigo-600">📊</span>
            <div className="text-sm text-indigo-800">
              <strong>Type d'unité :</strong> {unitTypeInfo.displayName}
              {unitTypeInfo.isImpressions && (
                <span className="ml-2 text-xs bg-indigo-200 px-2 py-0.5 rounded-full">
                  CPM (Coût pour 1000)
                </span>
              )}
            </div>
          </div>
          {unitTypeInfo.isImpressions && (
            <div className="text-xs text-indigo-600 mt-1">
              💡 Pour les impressions, le volume affiché correspond au nombre total d'impressions individuelles.
            </div>
          )}
        </div>
      )}

      {/* Message si données incomplètes */}
      {(!budget || !costPerUnit) && !disabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm text-yellow-700">
            ⚠️ <strong>Configuration incomplète</strong>
            <ul className="mt-2 ml-4 space-y-1 text-xs">
              {!budget && <li>• Saisir un budget ({budgetMode === 'client' ? 'client' : 'média'})</li>}
              {!costPerUnit && <li>• Saisir un {unitTypeInfo.costLabel.toLowerCase()}</li>}
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