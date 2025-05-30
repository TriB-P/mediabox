// app/components/Tactiques/BudgetBonificationSection.tsx

'use client';

import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';

// ==================== TYPES ====================

interface BudgetBonificationSectionProps {
  // Données du formulaire
  formData: {
    TC_Currency?: string;
    TC_Has_Bonus?: boolean;
    TC_Real_Value?: number;
    TC_Bonus_Value?: number;
  };
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  onCalculatedChange: (field: string, value: number) => void;
  
  // Données externes
  mediaBudget: number;
  
  // État de chargement
  disabled?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const BudgetBonificationSection = memo<BudgetBonificationSectionProps>(({
  formData,
  onChange,
  onTooltipChange,
  onCalculatedChange,
  mediaBudget,
  disabled = false
}) => {
  
  // Extraire les valeurs du formulaire
  const hasBonus = formData.TC_Has_Bonus || false;
  const realValue = formData.TC_Real_Value || 0;
  const bonusValue = formData.TC_Bonus_Value || 0;
  const currency = formData.TC_Currency || 'CAD';

  // Calcul automatique de la bonification
  const calculatedBonusValue = useMemo(() => {
    if (!hasBonus || realValue <= 0 || mediaBudget <= 0) return 0;
    return Math.max(0, realValue - mediaBudget);
  }, [hasBonus, realValue, mediaBudget]);

  // Validation de la valeur réelle
  const validationStatus = useMemo(() => {
    if (!hasBonus) return { isValid: true, message: null };
    
    if (realValue <= 0) {
      return { 
        isValid: false, 
        message: 'La valeur réelle doit être supérieure à 0' 
      };
    }
    
    if (realValue < mediaBudget) {
      return { 
        isValid: false, 
        message: 'La valeur réelle doit être supérieure ou égale au budget média pour avoir une bonification' 
      };
    }
    
    if (realValue === mediaBudget) {
      return { 
        isValid: true, 
        message: 'Aucune bonification (valeur réelle = budget média)' 
      };
    }
    
    return { isValid: true, message: null };
  }, [hasBonus, realValue, mediaBudget]);

  // Pourcentage de bonification
  const bonusPercentage = useMemo(() => {
    if (!hasBonus || mediaBudget <= 0 || calculatedBonusValue <= 0) return 0;
    return (calculatedBonusValue / mediaBudget) * 100;
  }, [hasBonus, mediaBudget, calculatedBonusValue]);

  // Gestionnaire pour le toggle bonification
  const handleHasBonusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onChange(e);
    
    if (!checked) {
      // Reset des valeurs si bonification désactivée
      onCalculatedChange('TC_Real_Value', 0);
      onCalculatedChange('TC_Bonus_Value', 0);
    }
  }, [onChange, onCalculatedChange]);

  // Gestionnaire pour la valeur réelle
  const handleRealValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newRealValue = parseFloat(e.target.value) || 0;
    onCalculatedChange('TC_Real_Value', newRealValue);
  }, [onCalculatedChange]);

  // Mettre à jour la bonification quand les paramètres changent
  useEffect(() => {
    if (hasBonus) {
      onCalculatedChange('TC_Bonus_Value', calculatedBonusValue);
    }
  }, [hasBonus, calculatedBonusValue, onCalculatedChange]);

  // Formatage des montants
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  }, []);

  return (
    <div className="space-y-6">
      {/* Toggle bonification */}
      <div className="flex items-start">
        <div className="flex items-center h-6">
          <input
            type="checkbox"
            id="TC_Has_Bonus"
            name="TC_Has_Bonus"
            checked={hasBonus}
            onChange={handleHasBonusChange}
            disabled={disabled || mediaBudget <= 0}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
          />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              'Cette tactique inclut de la bonification', 
              'La bonification représente la valeur ajoutée gratuite obtenue auprès du partenaire média. Elle permet de maximiser la portée sans coût supplémentaire.', 
              onTooltipChange
            )}
          </div>
          <p className="text-sm text-gray-600">
            Cochez cette case si vous avez négocié une valeur supplémentaire gratuite avec le partenaire.
          </p>
        </div>
      </div>

      {/* Message si budget média nécessaire */}
      {mediaBudget <= 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            ⚠️ Un budget média doit être défini avant de configurer la bonification.
          </p>
        </div>
      )}

      {/* Champs de bonification */}
      {hasBonus && mediaBudget > 0 && (
        <div className="space-y-6 pl-7">
          {/* Valeur réelle */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                'Valeur réelle de la tactique', 
                'Valeur totale négociée avec le partenaire média (incluant la bonification). Doit être supérieure au budget média pour générer une économie.', 
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
            
            {/* Message de validation */}
            {validationStatus.message && (
              <div className={`mt-1 text-sm ${validationStatus.isValid ? 'text-blue-600' : 'text-red-600'}`}>
                {validationStatus.message}
              </div>
            )}
            
            {/* Informations contextuelles */}
            {realValue > 0 && validationStatus.isValid && (
              <div className="mt-2 text-sm text-gray-600">
                {realValue >= mediaBudget 
                  ? `Économie de ${formatPercentage(((realValue - mediaBudget) / realValue) * 100)}% sur la valeur négociée`
                  : `Valeur insuffisante pour bonification`
                }
              </div>
            )}
          </div>

          {/* Bonification calculée */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                'Bonification', 
                'Économie réalisée calculée automatiquement (Valeur réelle - Budget média). Cette valeur représente l\'avantage négocié en dollars économisés.', 
                onTooltipChange
              )}
            </div>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm font-medium">{currency}</span>
              </div>
              <input
                type="number"
                value={calculatedBonusValue.toFixed(2)}
                disabled
                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-green-50 text-green-800 font-medium"
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
            {calculatedBonusValue > 0 && (
              <div className="mt-1 text-sm text-green-600">
                Économie de {formatCurrency(calculatedBonusValue)} {currency} ({formatPercentage(bonusPercentage)}% du budget)
              </div>
            )}
          </div>

          
        </div>
      )}

      {/* Message si champs désactivés */}
      {disabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            ⏳ Chargement en cours... La configuration de bonification sera disponible une fois les données chargées.
          </p>
        </div>
      )}
    </div>
  );
});

BudgetBonificationSection.displayName = 'BudgetBonificationSection';

export default BudgetBonificationSection;