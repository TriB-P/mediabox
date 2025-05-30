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

  // Budget média effectif (toujours celui utilisé pour les calculs de frais)
  const mediaBudget = useMemo(() => {
    const budget = formData.TC_Budget || 0;
    const budgetMode = formData.TC_Budget_Mode || 'media';
    
    // Si mode client, on devrait déduire les frais pour obtenir le budget média
    // Pour l'instant, on considère que le budget saisi est le budget média
    return budgetMode === 'media' ? budget : budget;
  }, [formData.TC_Budget, formData.TC_Budget_Mode]);

  // Calcul du résumé budgétaire
  const budgetSummary = useMemo((): BudgetSummary => {
    // Calculer le total des frais depuis appliedFees
    const totalFees = appliedFees
      .filter(af => af.isActive)
      .reduce((sum, af) => sum + (af.calculatedAmount || 0), 0);
    
    const bonusValue = formData.TC_Has_Bonus ? (formData.TC_Bonus_Value || 0) : 0;
    const clientBudget = mediaBudget + totalFees;
    const currency = formData.TC_Currency || 'CAD';
    
    // Calcul de la conversion de devise si nécessaire
    let convertedValues;
    if (currency !== campaignCurrency && exchangeRates[currency]) {
      const exchangeRate = exchangeRates[currency];
      convertedValues = {
        mediaBudget: mediaBudget * exchangeRate,
        totalFees: totalFees * exchangeRate,
        clientBudget: clientBudget * exchangeRate,
        currency: campaignCurrency,
        exchangeRate
      };
    }
    
    return {
      mediaBudget,
      totalFees,
      clientBudget,
      bonusValue,
      currency,
      convertedValues
    };
  }, [
    appliedFees, 
    mediaBudget, 
    formData.TC_Has_Bonus, 
    formData.TC_Bonus_Value, 
    formData.TC_Currency, 
    campaignCurrency, 
    exchangeRates
  ]);

  // Debug: Log pour vérifier les calculs
  useEffect(() => {
    console.log('Debug appliedFees:', appliedFees);
    console.log('Debug budgetSummary:', budgetSummary);
  }, [appliedFees, budgetSummary]);

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

      {/* Debug info (à retirer en production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Debug Info</h5>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Frais actifs: {appliedFees.filter(af => af.isActive).length}</div>
            <div>Total frais calculé: {budgetSummary.totalFees}</div>
            <div>Montants individuels: {appliedFees.filter(af => af.isActive).map(af => af.calculatedAmount).join(', ')}</div>
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