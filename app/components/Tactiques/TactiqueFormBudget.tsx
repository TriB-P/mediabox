// app/components/Tactiques/TactiqueFormBudget.tsx

'use client';

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { FormSection } from './TactiqueFormComponents';
import BudgetGeneralParams from './BudgetGeneralParams';
import BudgetMainSection from './BudgetMainSection';
import BudgetBonificationSection from './BudgetBonificationSection';
import BudgetFeesSection from './BudgetFeesSection';
import BudgetSummarySection from './BudgetSummarySection';

// ==================== TYPES ====================

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

interface Fee {
  id: string;
  FE_Name: string;
  FE_Calculation_Type: 'Pourcentage budget' | 'Volume d\'unité' | 'Unités' | 'Frais fixe';
  FE_Calculation_Mode: 'Directement sur le budget média' | 'Applicable sur les frais précédents';
  FE_Order: number;
  options: FeeOption[];
}

interface FeeOption {
  id: string;
  FO_Option: string;
  FO_Value: number;
  FO_Buffer: number;
  FO_Editable: boolean;
}

interface AppliedFee {
  feeId: string;
  isActive: boolean;
  selectedOptionId?: string;
  customValue?: number;
  customUnits?: number;
  calculatedAmount: number;
}

interface TactiqueFormBudgetProps {
  // Données du formulaire principal
  formData: {
    TC_Budget?: number;
    TC_Currency?: string;
    TC_Unit_Type?: string;
    TC_Cost_Per_Unit?: number;
    TC_Unit_Volume?: number;
    TC_Budget_Mode?: 'client' | 'media';
    TC_Has_Bonus?: boolean;
    TC_Real_Value?: number;
    TC_Bonus_Value?: number;
  };
  
  // Données externes
  dynamicLists: { [key: string]: ListItem[] };
  clientFees: Fee[];
  campaignCurrency: string;
  exchangeRates: { [key: string]: number };
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  
  // État de chargement
  loading?: boolean;
}

interface BudgetSummary {
  mediaBudget: number;
  totalFees: number;
  clientBudget: number;
  bonusValue: number;
  currency: string;
  convertedValues?: {
    mediaBudget: number;
    totalFees: number;
    clientBudget: number;
    bonusValue: number;
    currency: string;
    exchangeRate: number;
  };
}

// ==================== COMPOSANT PRINCIPAL ====================

const TactiqueFormBudget = memo<TactiqueFormBudgetProps>(({
  formData,
  dynamicLists,
  clientFees,
  campaignCurrency,
  exchangeRates,
  onChange,
  onTooltipChange,
  loading = false
}) => {
  
  // États locaux
  const [appliedFees, setAppliedFees] = useState<AppliedFee[]>([]);
  
  // Options pour le type d'unité
  const unitTypeOptions = dynamicLists.TC_Unit_Type || [];
  
  // Désactiver les champs si en cours de chargement
  const isDisabled = loading;

  // Initialiser les frais appliqués quand les frais client changent
  useEffect(() => {
    if (clientFees.length > 0) {
      setAppliedFees(prevAppliedFees => {
        // Garder les frais existants qui correspondent toujours aux frais client
        const existingFees = prevAppliedFees.filter(af => 
          clientFees.some(cf => cf.id === af.feeId)
        );
        
        // Ajouter les nouveaux frais qui n'existent pas encore
        const newFees: AppliedFee[] = clientFees
          .filter(cf => !existingFees.some(ef => ef.feeId === cf.id))
          .map(fee => ({
            feeId: fee.id,
            isActive: false,
            calculatedAmount: 0
          }));
        
        return [...existingFees, ...newFees];
      });
    } else {
      // Si pas de frais client, vider la liste
      setAppliedFees([]);
    }
  }, [clientFees]);

  // Fonction pour gérer les changements calculés
  const handleCalculatedChange = useCallback((field: string, value: number) => {
    const syntheticEvent = {
      target: {
        name: field,
        value: value.toString(),
        type: 'number'
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  }, [onChange]);

  // Calcul du total des frais avec gestion des erreurs
  const totalFees = useMemo(() => {
    try {
      if (!appliedFees || appliedFees.length === 0) {
        return 0;
      }
      
      const total = appliedFees
        .filter(af => af.isActive && typeof af.calculatedAmount === 'number')
        .reduce((sum, af) => {
          const amount = af.calculatedAmount || 0;
          return sum + amount;
        }, 0);
      
      // Vérifier si le résultat est valide
      return isNaN(total) ? 0 : total;
    } catch (error) {
      console.error('Erreur lors du calcul du total des frais:', error);
      return 0;
    }
  }, [appliedFees]);

  // Budget média effectif (utilisé pour les calculs de frais ET les calculs d'unités)
  const mediaBudget = useMemo(() => {
    try {
      const budget = formData.TC_Budget || 0;
      const budgetMode = formData.TC_Budget_Mode || 'media';
      
      if (budgetMode === 'client') {
        // En mode client, on déduit les frais pour obtenir le budget média
        const result = Math.max(0, budget - totalFees);
        return isNaN(result) ? 0 : result;
      } else {
        // En mode média, le budget saisi EST le budget média
        return isNaN(budget) ? 0 : budget;
      }
    } catch (error) {
      console.error('Erreur lors du calcul du budget média:', error);
      return 0;
    }
  }, [formData.TC_Budget, formData.TC_Budget_Mode, totalFees]);

  // Calcul du résumé budgétaire
  const budgetSummary = useMemo((): BudgetSummary => {
    try {
      const bonusValue = formData.TC_Has_Bonus ? (formData.TC_Bonus_Value || 0) : 0;
      const budget = formData.TC_Budget || 0;
      const budgetMode = formData.TC_Budget_Mode || 'media';
      const currency = formData.TC_Currency || 'CAD';
      
      let finalMediaBudget: number;
      let finalClientBudget: number;
      
      if (budgetMode === 'client') {
        // Mode client: budget saisi = budget client, on déduit les frais pour le média
        finalClientBudget = budget;
        finalMediaBudget = Math.max(0, budget - totalFees);
      } else {
        // Mode média: budget saisi = budget média, on ajoute les frais pour le client
        finalMediaBudget = budget;
        finalClientBudget = budget + totalFees;
      }
      
      // Validation des valeurs
      finalMediaBudget = isNaN(finalMediaBudget) ? 0 : finalMediaBudget;
      finalClientBudget = isNaN(finalClientBudget) ? 0 : finalClientBudget;
      const finalTotalFees = isNaN(totalFees) ? 0 : totalFees;
      const finalBonusValue = isNaN(bonusValue) ? 0 : bonusValue;
      
      // Calcul de la conversion de devise si nécessaire
      let convertedValues;
      if (currency !== campaignCurrency && exchangeRates[currency]) {
        const exchangeRate = exchangeRates[currency];
        if (!isNaN(exchangeRate) && exchangeRate > 0) {
          convertedValues = {
            mediaBudget: finalMediaBudget * exchangeRate,
            totalFees: finalTotalFees * exchangeRate,
            clientBudget: finalClientBudget * exchangeRate,
            bonusValue: finalBonusValue * exchangeRate,
            currency: campaignCurrency,
            exchangeRate
          };
        }
      }
      
      return {
        mediaBudget: finalMediaBudget,
        totalFees: finalTotalFees,
        clientBudget: finalClientBudget,
        bonusValue: finalBonusValue,
        currency,
        convertedValues
      };
    } catch (error) {
      console.error('Erreur lors du calcul du résumé budgétaire:', error);
      return {
        mediaBudget: 0,
        totalFees: 0,
        clientBudget: 0,
        bonusValue: 0,
        currency: formData.TC_Currency || 'CAD'
      };
    }
  }, [
    appliedFees, 
    formData.TC_Budget,
    formData.TC_Budget_Mode,
    formData.TC_Has_Bonus, 
    formData.TC_Bonus_Value, 
    formData.TC_Currency, 
    totalFees,
    campaignCurrency, 
    exchangeRates
  ]);

  // Debug: Log pour vérifier les calculs
  useEffect(() => {
    console.log('Debug TactiqueFormBudget:');
    console.log('- formData.TC_Budget:', formData.TC_Budget);
    console.log('- formData.TC_Budget_Mode:', formData.TC_Budget_Mode);
    console.log('- appliedFees:', appliedFees);
    console.log('- totalFees calculé:', totalFees);
    console.log('- mediaBudget calculé:', mediaBudget);
    console.log('- budgetSummary:', budgetSummary);
  }, [formData.TC_Budget, formData.TC_Budget_Mode, appliedFees, totalFees, mediaBudget, budgetSummary]);

  return (
    <div className="p-8 space-y-8">
      {/* En-tête de section */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Budget et frais
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configuration détaillée du budget et des frais applicables
        </p>
      </div>
      
      {/* Paramètres généraux */}
      <FormSection 
        title="Paramètres généraux"
        description="Configuration de base du budget"
      >
        <BudgetGeneralParams
          formData={formData}
          onChange={onChange}
          onTooltipChange={onTooltipChange}
          unitTypeOptions={unitTypeOptions}
          disabled={isDisabled}
        />
      </FormSection>

      {/* Section Budget */}
      <FormSection 
        title="Budget principal"
        description="Calculs automatiques du budget, coût et volume"
      >
        <BudgetMainSection
          formData={formData}
          totalFees={totalFees}
          onChange={onChange}
          onTooltipChange={onTooltipChange}
          onCalculatedChange={handleCalculatedChange}
          disabled={isDisabled}
        />
      </FormSection>

      {/* Section Bonification */}
      <FormSection 
        title="Bonification"
        description="Gestion de l'économie négociée"
      >
        <BudgetBonificationSection
          formData={formData}
          onChange={onChange}
          onTooltipChange={onTooltipChange}
          onCalculatedChange={handleCalculatedChange}
          mediaBudget={mediaBudget}
          disabled={isDisabled}
        />
      </FormSection>

      {/* Section Frais */}
      <FormSection 
        title="Frais"
        description="Application des frais configurés pour le client"
      >
        <BudgetFeesSection
          clientFees={clientFees}
          appliedFees={appliedFees}
          setAppliedFees={setAppliedFees}
          mediaBudget={mediaBudget}
          unitVolume={formData.TC_Unit_Volume || 0}
          onTooltipChange={onTooltipChange}
          disabled={isDisabled}
        />
      </FormSection>

      {/* Section Récapitulatif */}
      <FormSection 
        title="Récapitulatif"
        description="Détail des coûts et conversion de devise"
      >
        <BudgetSummarySection
          budgetSummary={budgetSummary}
          appliedFees={appliedFees}
          clientFees={clientFees}
          campaignCurrency={campaignCurrency}
          exchangeRates={exchangeRates}
          onTooltipChange={onTooltipChange}
        />
      </FormSection>

      {/* Message d'information si en chargement */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">Chargement des données budgétaires...</p>
        </div>
      )}

      {/* Debug info en développement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Debug Info</h5>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Budget saisi: {formData.TC_Budget || 0}</div>
            <div>Mode: {formData.TC_Budget_Mode || 'media'}</div>
            <div>Frais actifs: {appliedFees.filter(af => af.isActive).length}</div>
            <div>Total frais calculé: {totalFees}</div>
            <div>Budget média effectif: {mediaBudget}</div>
            <div>Budget client calculé: {budgetSummary.clientBudget}</div>
          </div>
        </div>
      )}
    </div>
  );
});

TactiqueFormBudget.displayName = 'TactiqueFormBudget';

export default TactiqueFormBudget;

// ==================== EXPORTS DES TYPES ====================

export type { 
  TactiqueFormBudgetProps, 
  Fee, 
  FeeOption, 
  AppliedFee, 
  BudgetSummary,
  ListItem 
};