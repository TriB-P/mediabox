// app/components/Tactiques/TactiqueFormBudget.tsx

'use client';

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { FormSection } from './TactiqueFormComponents';
import BudgetGeneralParams from './BudgetGeneralParams';
import BudgetMainSection from './BudgetMainSection';
import BudgetBonificationSection from './BudgetBonificationSection';
import BudgetFeesSection from './BudgetFeesSection';
import BudgetSummarySection from './BudgetSummarySection';

// Import de la logique de calcul rebuild avec convergence et support impressions
import {
  calculateBudget,
  validateBudgetInputs,
  isImpressionType,
  getCalculationExplanation,
  type FeeDefinition,
  type BudgetInputs,
  type BudgetResults,
  type FeeCalculationType,
  type FeeCalculationMode,
  type ConvergenceInfo
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
  // NOUVEAU: Volume personnalisé pour les frais "Volume d'unité"
  useCustomVolume?: boolean;
  customVolume?: number;
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

// Interface étendue pour le résumé budgétaire avec convergence
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
  convergenceInfo?: ConvergenceInfo;
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

      const baseValue = appliedFee.customValue !== undefined ? appliedFee.customValue : selectedOption.FO_Value;

      return {
        id: fee.id,
        name: fee.FE_Name,
        calculationType: fee.FE_Calculation_Type as FeeCalculationType,
        calculationMode: fee.FE_Calculation_Mode as FeeCalculationMode,
        order: fee.FE_Order,
        value: baseValue,
        buffer: selectedOption.FO_Buffer,
        customUnits: appliedFee.customUnits,
        // NOUVEAU: Support du volume personnalisé
        useCustomVolume: appliedFee.useCustomVolume,
        customVolume: appliedFee.customVolume
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

  // Initialisation simple des frais (une seule fois)
  useEffect(() => {
    if (clientFees.length > 0 && appliedFees.length === 0) {
      const initialAppliedFees = clientFees.map(fee => ({
        feeId: fee.id,
        isActive: false,
        calculatedAmount: 0
      }));
      setAppliedFees(initialAppliedFees);
    }
  }, [clientFees.length]);

  // Fonction pour gérer les changements calculés
  const handleCalculatedChange = useCallback((field: string, value: number | string) => {
    console.log(`🔄 handleCalculatedChange: ${field} = ${value}`);
    
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

  // CORRIGÉ: Validation spécifique pour le mode client
  const clientModeValidation = useMemo(() => {
    const budget = formData.TC_Budget || 0;
    const budgetMode = formData.TC_Budget_Mode || 'media';
    
    // Ne valider que si on est en mode client et qu'on a un budget
    if (budgetMode !== 'client' || budget <= 0) {
      return { isValid: true, message: null };
    }
    
    // Calculer le total des frais actifs (estimation rapide)
    const activeFees = appliedFees.filter(af => af.isActive);
    const totalFees = activeFees.reduce((sum, af) => sum + af.calculatedAmount, 0);
    
    // Vérifier si les frais dépassent ou sont très proches du budget client
    if (totalFees >= budget) {
      return {
        isValid: false,
        message: `Les frais (${totalFees.toFixed(2)}$) dépassent le budget client (${budget.toFixed(2)}$). Le budget média serait négatif.`
      };
    }
    
    // Avertissement si les frais représentent plus de 90% du budget client
    const feePercentage = (totalFees / budget) * 100;
    if (feePercentage > 90) {
      return {
        isValid: false,
        message: `Les frais représentent ${feePercentage.toFixed(1)}% du budget client. Le budget média résultant sera très faible (${(budget - totalFees).toFixed(2)}$).`
      };
    }
    
    return { isValid: true, message: null };
  }, [
    formData.TC_Budget,
    formData.TC_Budget_Mode,
    appliedFees
  ]);

  // CORRIGÉ: Calcul principal - Retirer TC_Unit_Volume des dépendances pour éviter les boucles
  const budgetCalculationResults = useMemo((): BudgetResults | null => {
    try {
      // Nettoyer les erreurs précédentes
      setCalculationError(null);
      
      // Valeurs de base
      const budget = formData.TC_Budget || 0;
      const budgetMode = formData.TC_Budget_Mode || 'media';
      const costPerUnit = formData.TC_Cost_Per_Unit || 0;
      const realValue = formData.TC_Has_Bonus ? (formData.TC_Real_Value || 0) : undefined;
      
      console.log(`📊 Calcul budget - Budget: ${budget}, Mode: ${budgetMode}, Coût/unité: ${costPerUnit}, Valeur réelle: ${realValue}`);
      
      // Validation de base
      if (budget <= 0 || costPerUnit <= 0) {
        console.log('⚠️ Données insuffisantes pour le calcul');
        return null;
      }
      
      // Vérifier la validation du mode client avant de continuer
      if (!clientModeValidation.isValid) {
        console.log('❌ Validation mode client échouée');
        return null;
      }
      
      // Convertir les frais appliqués vers la nouvelle structure
      const feeDefinitions = convertAppliedFeesToDefinitions(appliedFees, clientFees);
      
      // NOUVEAU: Récupérer le display name du type d'unité pour les impressions
      const selectedUnitType = unitTypeOptions.find(option => option.id === formData.TC_Unit_Type);
      const unitTypeDisplayName = selectedUnitType?.SH_Display_Name_FR;
      
      // Préparer les inputs pour le calcul avec le type d'unité
      const budgetInputs: BudgetInputs = {
        costPerUnit,
        realValue,
        fees: feeDefinitions,
        unitType: formData.TC_Unit_Type,
        unitTypeDisplayName
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
      
      console.log(`✅ Calcul terminé - Volume: ${results.unitVolume}, Budget média: ${results.mediaBudget}`);
      
      return results;
      
    } catch (error) {
      console.error('Erreur dans le calcul de budget:', error);
      setCalculationError(error instanceof Error ? error.message : 'Erreur de calcul');
      return null;
    }
  }, [
    // CORRIGÉ: Retirer TC_Unit_Volume des dépendances car c'est un résultat calculé
    formData.TC_Budget,
    formData.TC_Budget_Mode, 
    formData.TC_Cost_Per_Unit,  // IMPORTANT: Garder pour que les changements déclenchent le recalcul
    formData.TC_Has_Bonus,
    formData.TC_Real_Value,     // IMPORTANT: Garder pour que les changements déclenchent le recalcul
    appliedFees,
    clientFees,
    clientModeValidation.isValid
  ]);

  // CORRIGÉ: Synchroniser les résultats avec amélioration du debug
  useEffect(() => {
    if (budgetCalculationResults && appliedFees.length > 0) {
      console.log('🔄 Synchronisation des résultats calculés');
      
      // Mettre à jour les frais calculés
      const updatedAppliedFees = updateAppliedFeesWithCalculations(appliedFees, budgetCalculationResults);
      
      // Vérifier si les montants ont vraiment changé pour éviter les re-renders inutiles
      const amountsChanged = updatedAppliedFees.some((updatedFee, index) => {
        const currentFee = appliedFees[index];
        return currentFee && Math.abs(updatedFee.calculatedAmount - currentFee.calculatedAmount) > 0.01;
      });
      
      if (amountsChanged) {
        console.log('💰 Montants des frais mis à jour');
        setAppliedFees(updatedAppliedFees);
      }
      
      // CORRIGÉ: Toujours mettre à jour le volume d'unité si différent
      const currentVolume = formData.TC_Unit_Volume || 0;
      const newVolume = budgetCalculationResults.unitVolume;
      const volumeDifference = Math.abs(newVolume - currentVolume);
      
      console.log(`📏 Volume - Actuel: ${currentVolume}, Calculé: ${newVolume}, Différence: ${volumeDifference}`);
      
      if (volumeDifference > 0.01) {
        console.log('🔄 Mise à jour du volume d\'unité');
        handleCalculatedChange('TC_Unit_Volume', newVolume);
      }
      
      // Mettre à jour la bonification calculée si nécessaire
      if (formData.TC_Has_Bonus) {
        const currentBonus = formData.TC_Bonus_Value || 0;
        const newBonus = budgetCalculationResults.bonusValue;
        const bonusDifference = Math.abs(newBonus - currentBonus);
        
        console.log(`🎁 Bonus - Actuel: ${currentBonus}, Calculé: ${newBonus}, Différence: ${bonusDifference}`);
        
        if (bonusDifference > 0.01) {
          console.log('🔄 Mise à jour de la bonification');
          handleCalculatedChange('TC_Bonus_Value', newBonus);
        }
      }
    }
  }, [budgetCalculationResults, formData.TC_Has_Bonus, handleCalculatedChange]);

  // Extraire les valeurs calculées ou utiliser les valeurs par défaut
  const calculatedMediaBudget = budgetCalculationResults?.mediaBudget || 0;
  const calculatedTotalFees = budgetCalculationResults?.totalFees || 0;
  const calculatedClientBudget = budgetCalculationResults?.clientBudget || 0;

  // Calcul du résumé budgétaire pour l'affichage avec convergence
  const budgetSummary = useMemo((): BudgetSummary => {
    const currency = formData.TC_Currency || 'CAD';
    const bonusValue = formData.TC_Has_Bonus ? (formData.TC_Bonus_Value || 0) : 0;
    
    // Utiliser les résultats calculés ou les valeurs par défaut
    const mediaBudget = calculatedMediaBudget;
    const totalFees = calculatedTotalFees;
    let clientBudget = calculatedClientBudget;
    
    // Si on a des informations de convergence et qu'elle a échoué,
    // utiliser le vrai total calculé au lieu du budget client saisi
    let convergenceInfo = budgetCalculationResults?.convergenceInfo;
    if (convergenceInfo && !convergenceInfo.hasConverged) {
      clientBudget = convergenceInfo.actualCalculatedTotal;
    }
    
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
      convertedValues,
      convergenceInfo
    };
  }, [
    calculatedMediaBudget,
    calculatedTotalFees,
    calculatedClientBudget,
    formData.TC_Currency,
    formData.TC_Has_Bonus,
    formData.TC_Bonus_Value,
    campaignCurrency,
    exchangeRates,
    budgetCalculationResults?.convergenceInfo
  ]);

  return (
    <div className="p-8 space-y-8">
      {/* En-tête de section */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Budget et frais
        </h3>
      </div>

      {/* Message d'erreur de calcul */}
      {calculationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <strong>Erreur de calcul :</strong> {calculationError}
          </p>
        </div>
      )}

      {/* Message d'erreur pour validation mode client */}
      {!clientModeValidation.isValid && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-lg">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Configuration budgétaire invalide
              </p>
              <p className="text-sm mt-1">
                {clientModeValidation.message}
              </p>
              <p className="text-xs text-red-600 mt-2">
                💡 Réduisez les frais ou augmentez le budget client pour corriger ce problème.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message d'avertissement de convergence */}
      {budgetCalculationResults?.convergenceInfo && !budgetCalculationResults.convergenceInfo.hasConverged && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-lg">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Convergence imparfaite détectée
              </p>
              <p className="text-sm mt-1">
                Le système n'a pas pu trouver un budget média qui génère exactement le budget client visé. 
                Écart: <strong>{Math.abs(budgetCalculationResults.convergenceInfo.finalDifference).toFixed(2)}$ {formData.TC_Currency}</strong>
              </p>
              <p className="text-xs text-orange-600 mt-2">
                Le récapitulatif affichera le total réellement calculé. Vous pouvez ajuster les paramètres ou accepter cet écart.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Paramètres généraux */}
      <BudgetGeneralParams
        formData={formData}
        onChange={onChange}
        onTooltipChange={onTooltipChange}
        unitTypeOptions={unitTypeOptions}
        disabled={isDisabled}
      />

      {/* Section Budget */}
      <FormSection 
        title="Budget principal"
        description="Calculs automatiques du budget, coût et volume"
      >
        <BudgetMainSection
          formData={formData}
          totalFees={calculatedTotalFees}
          unitTypeOptions={unitTypeOptions.map(item => ({ 
            id: item.id, 
            label: item.SH_Display_Name_FR 
          }))}
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

      {/* Debug info en développement - AMÉLIORÉ */}
      {process.env.NODE_ENV === 'development' && budgetCalculationResults && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Debug Info - Calculs impressions</h5>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-gray-800">Inputs:</div>
                <div>Budget saisi: {formData.TC_Budget || 0}</div>
                <div>Mode: {formData.TC_Budget_Mode || 'media'}</div>
                <div>Coût/unité: {formData.TC_Cost_Per_Unit || 0}</div>
                <div>Valeur réelle: {formData.TC_Real_Value || 0}</div>
                <div>Volume actuel: {formData.TC_Unit_Volume || 0}</div>
                <div>Type d'unité: {formData.TC_Unit_Type || 'Non défini'}</div>
                <div>Nom d'affichage: {unitTypeOptions.find(opt => opt.id === formData.TC_Unit_Type)?.SH_Display_Name_FR || 'Non trouvé'}</div>
              </div>
              <div>
                <div className="font-medium text-gray-800">Résultats:</div>
                <div>Budget média calculé: {budgetCalculationResults.mediaBudget.toFixed(2)}</div>
                <div>Budget effectif: {budgetCalculationResults.effectiveBudgetForVolume.toFixed(2)}</div>
                <div>Volume calculé: {budgetCalculationResults.unitVolume.toFixed(2)}</div>
                <div>Total frais: {budgetCalculationResults.totalFees.toFixed(2)}</div>
                <div>Budget client final: {budgetCalculationResults.clientBudget.toFixed(2)}</div>
                <div className="text-blue-600 font-medium">Est impression: {unitTypeOptions.find(opt => opt.id === formData.TC_Unit_Type)?.SH_Display_Name_FR?.toLowerCase().includes('impression') ? 'Oui' : 'Non'}</div>
              </div>
            </div>
            
            {/* Debug validation mode client */}
            <div className="mt-2 p-2 bg-yellow-100 rounded">
              <div className="font-medium text-yellow-800">Validation mode client:</div>
              <div>Valide: {clientModeValidation.isValid ? 'Oui' : 'Non'}</div>
              {clientModeValidation.message && <div>Message: {clientModeValidation.message}</div>}
            </div>
            
            {/* Debug convergence */}
            {budgetCalculationResults.convergenceInfo && (
              <div className="mt-2 p-2 bg-orange-100 rounded">
                <div className="font-medium text-orange-800">Informations de convergence:</div>
                <div>Convergée: {budgetCalculationResults.convergenceInfo.hasConverged ? 'Oui' : 'Non'}</div>
                <div>Écart final: {budgetCalculationResults.convergenceInfo.finalDifference.toFixed(4)}$</div>
                <div>Itérations: {budgetCalculationResults.convergenceInfo.iterations}</div>
                <div>Budget visé: {budgetCalculationResults.convergenceInfo.targetBudget.toFixed(2)}$</div>
                <div>Total calculé: {budgetCalculationResults.convergenceInfo.actualCalculatedTotal.toFixed(2)}$</div>
              </div>
            )}
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