// app/components/Tactiques/TactiqueFormBudget.tsx

'use client';

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { FormSection } from './TactiqueFormComponents';
import BudgetGeneralParams from './BudgetGeneralParams';
import BudgetMainSection from './BudgetMainSection';
import BudgetBonificationSection from './BudgetBonificationSection';
import BudgetFeesSection from './BudgetFeesSection';
import BudgetSummarySection from './BudgetSummarySection';

// NOUVEAU: Import de la logique de calcul rebuild
import {
  calculateBudget,
  validateBudgetInputs,
  type FeeDefinition,
  type BudgetInputs,
  type BudgetResults,
  type FeeCalculationType,
  type FeeCalculationMode
} from '../../lib/budgetCalculations';

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
    // Note: Les champs TC_Fee_X_Option et TC_Fee_X_Value ne sont plus utilisés
    // pour éviter les boucles de re-render. Les frais sont gérés en état local.
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

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Convertit les AppliedFee vers FeeDefinition pour la nouvelle logique
 */
const convertAppliedFeesToDefinitions = (
  appliedFees: AppliedFee[],
  clientFees: Fee[]
): FeeDefinition[] => {
  return appliedFees
    .filter(appliedFee => appliedFee.isActive && appliedFee.selectedOptionId)
    .map(appliedFee => {
      const fee = clientFees.find(f => f.id === appliedFee.feeId);
      const selectedOption = fee?.options.find(opt => opt.id === appliedFee.selectedOptionId);
      
      if (!fee || !selectedOption) {
        throw new Error(`Frais ou option non trouvé: ${appliedFee.feeId}`);
      }

      // Utiliser la valeur personnalisée si disponible, sinon la valeur de l'option
      const baseValue = appliedFee.customValue !== undefined ? appliedFee.customValue : selectedOption.FO_Value;

      return {
        id: fee.id,
        name: fee.FE_Name,
        calculationType: fee.FE_Calculation_Type as FeeCalculationType,
        calculationMode: fee.FE_Calculation_Mode as FeeCalculationMode,
        order: fee.FE_Order,
        value: baseValue,
        buffer: selectedOption.FO_Buffer,
        customUnits: appliedFee.customUnits
      };
    });
};

/**
 * Met à jour les AppliedFee avec les montants calculés par la nouvelle logique
 */
const updateAppliedFeesWithCalculations = (
  appliedFees: AppliedFee[],
  budgetResults: BudgetResults
): AppliedFee[] => {
  return appliedFees.map(appliedFee => {
    const feeDetail = budgetResults.feeDetails.find(detail => detail.feeId === appliedFee.feeId);
    return {
      ...appliedFee,
      calculatedAmount: feeDetail ? feeDetail.calculatedAmount : 0
    };
  });
};

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
  const [calculationError, setCalculationError] = useState<string | null>(null);
  
  // Options pour le type d'unité
  const unitTypeOptions = dynamicLists.TC_Unit_Type || [];
  
  // Désactiver les champs si en cours de chargement
  const isDisabled = loading;

  // NOUVEAU: Initialisation simple des frais (une seule fois)
  useEffect(() => {
    if (clientFees.length > 0 && appliedFees.length === 0) {
      const initialAppliedFees = clientFees.map(fee => ({
        feeId: fee.id,
        isActive: false,
        calculatedAmount: 0
      }));
      setAppliedFees(initialAppliedFees);
    }
  }, [clientFees.length]); // Seulement quand clientFees change

  // Fonction pour gérer les changements calculés (SANS persistance automatique des frais)
  const handleCalculatedChange = useCallback((field: string, value: number | string) => {
    // Ignorer les changements de frais pour éviter la boucle
    if (field.startsWith('TC_Fee_')) {
      return;
    }
    
    const syntheticEvent = {
      target: {
        name: field,
        value: value.toString(),
        type: typeof value === 'number' ? 'number' : 'text'
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  }, [onChange]);

  // SUPPRIMÉ: Effect de sauvegarde automatique qui cause la boucle

  // NOUVEAU: Calcul principal avec la logique rebuild
  const budgetCalculationResults = useMemo((): BudgetResults | null => {
    try {
      // Nettoyer les erreurs précédentes
      setCalculationError(null);
      
      // Valeurs de base
      const budget = formData.TC_Budget || 0;
      const budgetMode = formData.TC_Budget_Mode || 'media';
      const costPerUnit = formData.TC_Cost_Per_Unit || 0;
      const realValue = formData.TC_Has_Bonus ? (formData.TC_Real_Value || 0) : undefined;
      const unitVolume = formData.TC_Unit_Volume || 0;
      
      // Validation de base
      if (budget <= 0 || costPerUnit <= 0) {
        return null; // Pas assez de données pour calculer
      }
      
      // Convertir les frais appliqués vers la nouvelle structure
      const feeDefinitions = convertAppliedFeesToDefinitions(appliedFees, clientFees);
      
      // Préparer les inputs pour le calcul
      const budgetInputs: BudgetInputs = {
        costPerUnit,
        realValue,
        unitVolume: unitVolume > 0 ? unitVolume : undefined, // Laisser calculer si 0
        fees: feeDefinitions
      };
      
      // Définir le type de budget selon le mode
      if (budgetMode === 'client') {
        budgetInputs.clientBudget = budget;
      } else {
        budgetInputs.mediaBudget = budget;
      }
      
      // Valider les inputs
      const validationErrors = validateBudgetInputs(budgetInputs);
      if (validationErrors.length > 0) {
        console.warn('Erreurs de validation:', validationErrors);
        return null;
      }
      
      // Effectuer le calcul avec la nouvelle logique
      const results = calculateBudget(budgetInputs);
      
      return results;
      
    } catch (error) {
      console.error('Erreur dans le calcul de budget:', error);
      setCalculationError(error instanceof Error ? error.message : 'Erreur de calcul');
      return null;
    }
  }, [
    formData.TC_Budget,
    formData.TC_Budget_Mode, 
    formData.TC_Cost_Per_Unit,
    formData.TC_Has_Bonus,
    formData.TC_Real_Value,
    formData.TC_Unit_Volume,
    appliedFees,
    clientFees
  ]);

  // Synchroniser les frais calculés avec les AppliedFee (SANS boucle)
  useEffect(() => {
    if (budgetCalculationResults && appliedFees.length > 0) {
      const updatedAppliedFees = updateAppliedFeesWithCalculations(appliedFees, budgetCalculationResults);
      
      // Vérifier si les montants ont vraiment changé pour éviter les re-renders inutiles
      const amountsChanged = updatedAppliedFees.some((updatedFee, index) => {
        const currentFee = appliedFees[index];
        return currentFee && Math.abs(updatedFee.calculatedAmount - currentFee.calculatedAmount) > 0.01;
      });
      
      if (amountsChanged) {
        setAppliedFees(updatedAppliedFees);
      }
      
      // Mettre à jour le volume d'unité calculé si nécessaire (SANS déclencher de boucle)
      if (Math.abs(budgetCalculationResults.unitVolume - (formData.TC_Unit_Volume || 0)) > 0.01) {
        handleCalculatedChange('TC_Unit_Volume', budgetCalculationResults.unitVolume);
      }
      
      // Mettre à jour la bonification calculée si nécessaire (SANS déclencher de boucle)
      if (formData.TC_Has_Bonus && Math.abs(budgetCalculationResults.bonusValue - (formData.TC_Bonus_Value || 0)) > 0.01) {
        handleCalculatedChange('TC_Bonus_Value', budgetCalculationResults.bonusValue);
      }
    }
  }, [budgetCalculationResults]); // SEULEMENT budgetCalculationResults pour éviter la boucle

  // Extraire les valeurs calculées ou utiliser les valeurs par défaut
  const calculatedMediaBudget = budgetCalculationResults?.mediaBudget || 0;
  const calculatedTotalFees = budgetCalculationResults?.totalFees || 0;
  const calculatedClientBudget = budgetCalculationResults?.clientBudget || 0;

  // Calcul du résumé budgétaire pour l'affichage
  const budgetSummary = useMemo((): BudgetSummary => {
    const currency = formData.TC_Currency || 'CAD';
    const bonusValue = formData.TC_Has_Bonus ? (formData.TC_Bonus_Value || 0) : 0;
    
    // Utiliser les résultats calculés ou les valeurs par défaut
    const mediaBudget = calculatedMediaBudget;
    const totalFees = calculatedTotalFees;
    const clientBudget = calculatedClientBudget;
    
    // Calcul de la conversion de devise si nécessaire
    let convertedValues;
    if (currency !== campaignCurrency && exchangeRates[currency]) {
      const exchangeRate = exchangeRates[currency];
      if (!isNaN(exchangeRate) && exchangeRate > 0) {
        convertedValues = {
          mediaBudget: mediaBudget * exchangeRate,
          totalFees: totalFees * exchangeRate,
          clientBudget: clientBudget * exchangeRate,
          bonusValue: bonusValue * exchangeRate,
          currency: campaignCurrency,
          exchangeRate
        };
      }
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
    calculatedMediaBudget,
    calculatedTotalFees,
    calculatedClientBudget,
    formData.TC_Currency,
    formData.TC_Has_Bonus,
    formData.TC_Bonus_Value,
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

      {/* Message d'erreur de calcul */}
      {calculationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <strong>Erreur de calcul :</strong> {calculationError}
          </p>
        </div>
      )}
      
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
          totalFees={calculatedTotalFees}
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
          mediaBudget={calculatedMediaBudget}
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
          mediaBudget={calculatedMediaBudget}
          unitVolume={formData.TC_Unit_Volume || 0}
          tacticCurrency={formData.TC_Currency || 'CAD'}
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
      {process.env.NODE_ENV === 'development' && budgetCalculationResults && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Debug Info (Nouvelle logique - SANS persistance automatique)</h5>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Budget saisi: {formData.TC_Budget || 0}</div>
            <div>Mode: {formData.TC_Budget_Mode || 'media'}</div>
            <div>Budget média calculé: {budgetCalculationResults.mediaBudget.toFixed(2)}</div>
            <div>Total frais calculé: {budgetCalculationResults.totalFees.toFixed(2)}</div>
            <div>Budget client final: {budgetCalculationResults.clientBudget.toFixed(2)}</div>
            <div>Volume d'unité: {budgetCalculationResults.unitVolume}</div>
            <div>Frais actifs: {budgetCalculationResults.feeDetails.length}</div>
            <div>Avec bonification: {budgetCalculationResults.hasBonus ? 'Oui' : 'Non'}</div>
            {budgetCalculationResults.hasBonus && (
              <div>Bonification: {budgetCalculationResults.bonusValue.toFixed(2)}</div>
            )}
            <div className="mt-2 text-orange-600">
              <strong>Note:</strong> Les frais ne sont plus persistés automatiquement pour éviter les boucles de re-render
            </div>
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