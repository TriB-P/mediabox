// app/components/Tactiques/BudgetMainSection.tsx

'use client';

import React, { memo, useCallback, useMemo, useState } from 'react';
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
  };
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  onCalculatedChange: (field: string, value: number) => void;
  
  // État de chargement
  disabled?: boolean;
}

// ==================== CONSTANTES ====================

const CALCULATION_MODES = {
  BUDGET_DRIVEN: 'budget', // Budget → Coût (si volume défini)
  COST_DRIVEN: 'cost',     // Coût → Budget (si volume défini)
  VOLUME_DRIVEN: 'volume'  // Volume → Budget (si coût défini)
} as const;

// ==================== COMPOSANT PRINCIPAL ====================

const BudgetMainSection = memo<BudgetMainSectionProps>(({
  formData,
  onChange,
  onTooltipChange,
  onCalculatedChange,
  disabled = false
}) => {
  
  // États locaux pour gérer quel champ l'utilisateur édite
  const [lastEditedField, setLastEditedField] = useState<'budget' | 'cost' | 'volume' | null>(null);
  
  // Extraire les valeurs du formulaire
  const budget = formData.TC_Budget || 0;
  const costPerUnit = formData.TC_Cost_Per_Unit || 0;
  const unitVolume = formData.TC_Unit_Volume || 0;
  const currency = formData.TC_Currency || 'CAD';
  const budgetMode = formData.TC_Budget_Mode || 'media';

  // Déterminer l'étiquette et la description du budget selon le mode
  const budgetConfig = useMemo(() => {
    if (budgetMode === 'client') {
      return {
        label: 'Budget client',
        tooltip: 'Montant total que le client paiera, incluant le budget média et tous les frais applicables'
      };
    } else {
      return {
        label: 'Budget média',
        tooltip: 'Montant net qui sera effectivement dépensé sur les plateformes publicitaires, sans les frais'
      };
    }
  }, [budgetMode]);

  // Calculs automatiques bidirectionnels
  const handleBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newBudget = parseFloat(e.target.value) || 0;
    setLastEditedField('budget');
    onChange(e); // Mettre à jour le budget principal
    
    // Recalculer le coût par unité si le volume est défini et > 0
    if (unitVolume > 0) {
      const newCostPerUnit = newBudget / unitVolume;
      onCalculatedChange('TC_Cost_Per_Unit', newCostPerUnit);
    }
  }, [unitVolume, onChange, onCalculatedChange]);

  const handleCostChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = parseFloat(e.target.value) || 0;
    setLastEditedField('cost');
    onCalculatedChange('TC_Cost_Per_Unit', newCost);
    
    // Recalculer le budget si le volume est défini et > 0
    if (unitVolume > 0) {
      const newBudget = newCost * unitVolume;
      onCalculatedChange('TC_Budget', newBudget);
    }
  }, [unitVolume, onCalculatedChange]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) || 0;
    setLastEditedField('volume');
    onCalculatedChange('TC_Unit_Volume', newVolume);
    
    // Recalculer le budget si le coût est défini et > 0
    if (costPerUnit > 0) {
      const newBudget = costPerUnit * newVolume;
      onCalculatedChange('TC_Budget', newBudget);
    }
  }, [costPerUnit, onCalculatedChange]);

  // Déterminer quels calculs sont possibles
  const calculationStatus = useMemo(() => {
    const hasValidBudget = budget > 0;
    const hasValidCost = costPerUnit > 0;
    const hasValidVolume = unitVolume > 0;
    
    return {
      canCalculateCost: hasValidBudget && hasValidVolume,
      canCalculateBudget: hasValidCost && hasValidVolume,
      canCalculateVolume: hasValidBudget && hasValidCost,
      hasPartialData: hasValidBudget || hasValidCost || hasValidVolume,
      hasCompleteData: hasValidBudget && hasValidCost && hasValidVolume
    };
  }, [budget, costPerUnit, unitVolume]);

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

  const formatVolume = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coût par unité */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              'Coût par unité', 
              'Coût unitaire pour le type d\'unité sélectionné. Se calcule automatiquement (Budget ÷ Volume) ou peut être saisi manuellement.', 
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
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
              placeholder="0.0000"
            />
          </div>
          {costPerUnit > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Formaté : {formatCostPerUnit(costPerUnit)} {currency}
            </div>
          )}
        </div>

        {/* Volume d'unité */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              'Volume d\'unité', 
              'Nombre d\'unités prévu pour cette tactique. Se calcule automatiquement (Budget ÷ Coût) ou peut être saisi manuellement.', 
              onTooltipChange
            )}
          </div>
          <input
            type="number"
            value={unitVolume || ''}
            onChange={handleVolumeChange}
            min="0"
            step="1"
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
            placeholder="0"
          />
          {unitVolume > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Formaté : {formatVolume(unitVolume)} unités
            </div>
          )}
        </div>
      </div>

      {/* Indicateurs de calcul et statut */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-800 mb-3">
          🧮 Calculs automatiques
        </h5>
        
        <div className="space-y-3">
          {/* Formule principale */}
          <div className="text-sm text-blue-700">
            <strong>Formule :</strong> Budget = Coût par unité × Volume d'unité
          </div>
          
          {/* État des calculs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className={`p-2 rounded ${calculationStatus.canCalculateCost ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              <div className="font-medium">Calcul du coût</div>
              <div>{calculationStatus.canCalculateCost ? '✅ Possible' : '⏳ Manque budget ou volume'}</div>
            </div>
            
            <div className={`p-2 rounded ${calculationStatus.canCalculateBudget ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              <div className="font-medium">Calcul du budget</div>
              <div>{calculationStatus.canCalculateBudget ? '✅ Possible' : '⏳ Manque coût ou volume'}</div>
            </div>
            
            <div className={`p-2 rounded ${calculationStatus.canCalculateVolume ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              <div className="font-medium">Calcul du volume</div>
              <div>{calculationStatus.canCalculateVolume ? '✅ Possible' : '⏳ Manque budget ou coût'}</div>
            </div>
          </div>

          {/* Instructions selon l'état */}
          <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded">
            {!calculationStatus.hasPartialData && (
              <span>💡 Commencez par saisir n'importe quelle valeur. Les autres se calculeront automatiquement.</span>
            )}
            
            {calculationStatus.hasPartialData && !calculationStatus.hasCompleteData && (
              <span>🔄 Saisissez une deuxième valeur pour déclencher les calculs automatiques.</span>
            )}
            
            {calculationStatus.hasCompleteData && (
              <span>✨ Toutes les valeurs sont cohérentes. Modifiez n'importe laquelle pour recalculer les autres.</span>
            )}
          </div>

          {/* Dernière modification */}
          {lastEditedField && (
            <div className="text-xs text-blue-600 border-t border-blue-200 pt-2">
              <strong>Dernière modification :</strong> {
                lastEditedField === 'budget' ? 'Budget' :
                lastEditedField === 'cost' ? 'Coût par unité' :
                lastEditedField === 'volume' ? 'Volume d\'unité' : ''
              }
            </div>
          )}
        </div>
      </div>

      {/* Résumé si toutes les valeurs sont définies */}
      {calculationStatus.hasCompleteData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-green-800 mb-2">
            📊 Résumé des calculs
          </h5>
          <div className="text-sm text-green-700 space-y-1">
            <div><strong>{budgetConfig.label} :</strong> {formatCurrency(budget)} {currency}</div>
            <div><strong>Coût par unité :</strong> {formatCostPerUnit(costPerUnit)} {currency}</div>
            <div><strong>Volume d'unité :</strong> {formatVolume(unitVolume)} unités</div>
            <div className="pt-2 border-t border-green-200">
              <strong>Vérification :</strong> {formatCostPerUnit(costPerUnit)} × {formatVolume(unitVolume)} = {formatCurrency(costPerUnit * unitVolume)} {currency}
              {Math.abs((costPerUnit * unitVolume) - budget) < 0.01 ? ' ✅' : ' ⚠️ Écart détecté'}
            </div>
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