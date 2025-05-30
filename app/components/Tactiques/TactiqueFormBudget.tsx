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

  // Initialiser les frais appliqués
  useEffect(() => {
    const initialFees: AppliedFee[] = clientFees.map(fee => ({
      feeId: fee.id,
      isActive: false,
      calculatedAmount: 0
    }));
    setAppliedFees(initialFees);
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
    const totalFees = appliedFees
      .filter(af => af.isActive)
      .reduce((sum, af) => sum + af.calculatedAmount, 0);
    
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
        description="Configuration de base pour le calcul du budget"
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
        title="Budget"
        description="Saisie et calcul du budget principal"
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
        description="Gestion de la valeur ajoutée négociée"
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
          onTooltipChange={onTooltipChange}
        />
      </FormSection>

      {/* Message d'information si en chargement */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">Chargement des données budgétaires...</p>
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