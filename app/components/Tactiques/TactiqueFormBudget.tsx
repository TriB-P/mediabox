// app/components/Tactiques/TactiqueFormBudget.tsx

'use client';

import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { FormSection } from './TactiqueFormComponents';
import BudgetGeneralParams from './BudgetGeneralParams';
import BudgetMainSection from './BudgetMainSection';
import BudgetBonificationSection from './BudgetBonificationSection';
import BudgetFeesSection from './BudgetFeesSection';
import BudgetSummarySection from './BudgetSummarySection';

// Import du hook centralisé
import { useBudgetCalculations } from '../hooks/useBudgetCalculations';
import { ClientFee } from '../lib/budgetService';

// Import de la logique de calcul existante (PRÉSERVÉE)
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
  useCustomVolume?: boolean;
  customVolume?: number;
  calculatedAmount: number;
}

// Interface pour les changements calculés à remonter au parent
interface BudgetCalculatedValues {
  TC_BudgetInput?: number;
  TC_Unit_Price?: number;
  TC_Unit_Volume?: number;
  TC_Media_Value?: number;
  TC_Bonification?: number;
  TC_Media_Budget?: number;
  TC_Client_Budget?: number;
  TC_Currency_Rate?: number;
  TC_BuyCurrency?: string;
  TC_Delta?: number;
  [key: string]: any; // Pour les champs TC_Fee_X_Option, TC_Fee_X_Volume, TC_Fee_X_Value
}

interface TactiqueFormBudgetProps {
  // Données du formulaire principal
  formData: {
    TC_BudgetChoice?: 'client' | 'media';
    TC_BudgetInput?: number;
    TC_Unit_Price?: number;
    TC_Unit_Volume?: number;
    TC_Media_Value?: number;
    TC_Bonification?: number;
    TC_Media_Budget?: number;
    TC_Client_Budget?: number;
    TC_Currency_Rate?: number;
    TC_BuyCurrency?: string;
    TC_Delta?: number;
    TC_Unit_Type?: string;
    TC_Has_Bonus?: boolean;
    [key: string]: any;
  };
  
  // Données externes
  dynamicLists: { [key: string]: ListItem[] };
  clientFees: Fee[];
  campaignCurrency: string;
  exchangeRates: { [key: string]: number };
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCalculatedChange: (updates: BudgetCalculatedValues) => void;
  onTooltipChange: (tooltip: string | null) => void;
  
  // État de chargement
  loading?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const TactiqueFormBudget = memo<TactiqueFormBudgetProps>(({
  formData,
  dynamicLists,
  clientFees,
  campaignCurrency,
  exchangeRates,
  onChange,
  onCalculatedChange,
  onTooltipChange,
  loading = false
}) => {
  
  // Options pour le type d'unité
  const unitTypeOptions = dynamicLists.TC_Unit_Type || [];
  
  // Désactiver les champs si en cours de chargement
  const isDisabled = loading;

  // ==================== HOOK BUDGET CENTRALISÉ ====================
  
  // Convertir les clientFees vers le format attendu par le hook
  const clientFeesForHook = useMemo((): ClientFee[] => {
    return clientFees.map(fee => ({
      id: fee.id,
      FE_Name: fee.FE_Name,
      FE_Calculation_Type: fee.FE_Calculation_Type as FeeCalculationType,
      FE_Calculation_Mode: fee.FE_Calculation_Mode as FeeCalculationMode,
      FE_Order: fee.FE_Order,
      options: fee.options.map(opt => ({
        id: opt.id,
        FO_Option: opt.FO_Option,
        FO_Value: opt.FO_Value,
        FO_Buffer: opt.FO_Buffer,
        FO_Editable: opt.FO_Editable
      }))
    }));
  }, [clientFees]);

  // Utiliser le hook avec auto-calcul désactivé pour garder le contrôle
  const {
    budgetData,
    updateBudgetInput,
    updateBudgetChoice,
    updateUnitPrice,
    updateMediaValue,
    updateCurrency,
    updateUnitType,
    updateFee,
    toggleFee,
    setFeeOption,
    setFeeVolume,
    calculate,
    exportToFirestore,
    debugMode,
    toggleDebug,
    debugInfo,
    errors: hookErrors,
    warnings: hookWarnings,
    hasValidData,
    isCalculating,
    lastCalculationResult
  } = useBudgetCalculations({
    initialData: formData,
    clientFees: clientFeesForHook,
    campaignCurrency,
    exchangeRates,
    unitTypeOptions,
    autoCalculate: false // IMPORTANT: Garder le contrôle manuel des calculs
  });

  // ==================== LOGIQUE DE CALCUL EXISTANTE (PRÉSERVÉE) ====================
  
  // États locaux pour la rétrocompatibilité avec les composants existants
  const [appliedFees, setAppliedFees] = React.useState<AppliedFee[]>([]);
  const [calculationError, setCalculationError] = React.useState<string | null>(null);

  // Synchroniser appliedFees avec budgetData.fees
  useEffect(() => {
    const convertedFees: AppliedFee[] = budgetData.fees.map(fee => ({
      feeId: fee.feeId,
      isActive: fee.isActive,
      selectedOptionId: fee.selectedOptionId,
      customValue: fee.customValue,
      customUnits: fee.customUnits,
      useCustomVolume: fee.useCustomVolume,
      customVolume: fee.customVolume,
      calculatedAmount: fee.calculatedValue
    }));
    setAppliedFees(convertedFees);
  }, [budgetData.fees]);

  // Validation spécifique pour le mode client (LOGIQUE EXISTANTE PRÉSERVÉE)
  const clientModeValidation = useMemo(() => {
    const budgetInput = budgetData.budgetInput;
    const budgetChoice = budgetData.budgetChoice;
    
    if (budgetChoice !== 'client' || budgetInput <= 0) {
      return { isValid: true, message: null };
    }
    
    const activeFees = appliedFees.filter(af => af.isActive);
    const totalFees = activeFees.reduce((sum, af) => sum + af.calculatedAmount, 0);
    
    if (totalFees >= budgetInput) {
      return {
        isValid: false,
        message: `Les frais (${totalFees.toFixed(2)}$) dépassent le budget client (${budgetInput.toFixed(2)}$). Le budget média serait négatif.`
      };
    }
    
    const feePercentage = (totalFees / budgetInput) * 100;
    if (feePercentage > 90) {
      return {
        isValid: false,
        message: `Les frais représentent ${feePercentage.toFixed(1)}% du budget client. Le budget média résultant sera très faible (${(budgetInput - totalFees).toFixed(2)}$).`
      };
    }
    
    return { isValid: true, message: null };
  }, [budgetData.budgetInput, budgetData.budgetChoice, appliedFees]);

  // LOGIQUE DE CALCUL PRINCIPAL EXISTANTE (PRÉSERVÉE)
  const budgetCalculationResults = useMemo((): BudgetResults | null => {
    try {
      setCalculationError(null);
      
      const budgetInput = budgetData.budgetInput;
      const budgetChoice = budgetData.budgetChoice;
      const unitPrice = budgetData.unitPrice;
      const mediaValue = budgetData.mediaValue;
      
      console.log(`📊 Calcul budget - Budget: ${budgetInput}, Mode: ${budgetChoice}, Prix unitaire: ${unitPrice}, Valeur média: ${mediaValue}`);
      
      if (budgetInput <= 0 || unitPrice <= 0) {
        console.log('⚠️ Données insuffisantes pour le calcul');
        return null;
      }
      
      if (!clientModeValidation.isValid) {
        console.log('❌ Validation mode client échouée');
        return null;
      }
      
      // Convertir appliedFees vers FeeDefinition (LOGIQUE EXISTANTE)
      const feeDefinitions: FeeDefinition[] = appliedFees
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
            useCustomVolume: appliedFee.useCustomVolume,
            customVolume: appliedFee.customVolume
          };
        });
      
      const selectedUnitType = unitTypeOptions.find(option => option.id === budgetData.unitType);
      const unitTypeDisplayName = selectedUnitType?.SH_Display_Name_FR;
      
      const budgetInputs: BudgetInputs = {
        costPerUnit: unitPrice,
        realValue: mediaValue > 0 ? mediaValue : undefined,
        fees: feeDefinitions,
        unitType: budgetData.unitType,
        unitTypeDisplayName
      };
      
      if (budgetChoice === 'client') {
        budgetInputs.clientBudget = budgetInput;
      } else {
        budgetInputs.mediaBudget = budgetInput;
      }
      
      const validationErrors = validateBudgetInputs(budgetInputs);
      if (validationErrors.length > 0) {
        console.warn('Erreurs de validation:', validationErrors);
        return null;
      }
      
      // UTILISER LA LOGIQUE DE CALCUL EXISTANTE (PRÉSERVÉE)
      const results = calculateBudget(budgetInputs);
      
      console.log(`✅ Calcul terminé - Volume: ${results.unitVolume}, Budget média: ${results.mediaBudget}`);
      
      return results;
      
    } catch (error) {
      console.error('Erreur dans le calcul de budget:', error);
      setCalculationError(error instanceof Error ? error.message : 'Erreur de calcul');
      return null;
    }
  }, [
    budgetData.budgetInput,
    budgetData.budgetChoice, 
    budgetData.unitPrice,
    budgetData.mediaValue,
    budgetData.unitType,
    appliedFees,
    clientFees,
    clientModeValidation.isValid,
    unitTypeOptions
  ]);

  // Synchroniser les résultats avec le parent (LOGIQUE EXISTANTE PRÉSERVÉE)
  useEffect(() => {
    if (budgetCalculationResults) {
      // Mettre à jour appliedFees avec les calculs
      const updatedAppliedFees = appliedFees.map(appliedFee => {
        const feeDetail = budgetCalculationResults.feeDetails.find(detail => detail.feeId === appliedFee.feeId);
        return {
          ...appliedFee,
          calculatedAmount: feeDetail ? feeDetail.calculatedAmount : 0
        };
      });

      const amountsChanged = updatedAppliedFees.some((updatedFee, index) => {
        const currentFee = appliedFees[index];
        return currentFee && Math.abs(updatedFee.calculatedAmount - currentFee.calculatedAmount) > 0.01;
      });

      if (amountsChanged) {
        setAppliedFees(updatedAppliedFees);
      }

      // Calculer le taux de change effectif
      const effectiveExchangeRate = useMemo(() => {
        const tacticCurrency = budgetData.buyCurrency;
        if (tacticCurrency === campaignCurrency) return 1;
        const rate = exchangeRates[tacticCurrency] || exchangeRates[`${tacticCurrency}_${campaignCurrency}`];
        return rate || 1;
      }, [budgetData.buyCurrency, campaignCurrency, exchangeRates]);

      // Préparer les mises à jour pour le parent
      const calculatedUpdates: BudgetCalculatedValues = {
        TC_Unit_Volume: budgetCalculationResults.unitVolume,
        TC_Bonification: budgetCalculationResults.bonusValue,
        TC_Media_Budget: budgetCalculationResults.mediaBudget,
        TC_Client_Budget: budgetCalculationResults.clientBudget,
        TC_Currency_Rate: effectiveExchangeRate,
        TC_BuyCurrency: budgetData.buyCurrency,
        TC_Delta: budgetCalculationResults.convergenceInfo ? 
          Math.abs(budgetCalculationResults.convergenceInfo.finalDifference) : 0
      };

      // Générer les updates de frais (LOGIQUE EXISTANTE)
      const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
      sortedFees.forEach((fee, orderIndex) => {
        const feeNumber = orderIndex + 1;
        const appliedFee = updatedAppliedFees.find(af => af.feeId === fee.id);
        
        if (appliedFee && appliedFee.isActive && appliedFee.selectedOptionId) {
          calculatedUpdates[`TC_Fee_${feeNumber}_Option`] = appliedFee.selectedOptionId;
          
          let volumeValue = 0;
          if (fee.FE_Calculation_Type === 'Unités') {
            volumeValue = appliedFee.customUnits || 0;
          } else if (fee.FE_Calculation_Type === 'Volume d\'unité') {
            volumeValue = appliedFee.useCustomVolume ? (appliedFee.customVolume || 0) : 0;
          } else if (fee.FE_Calculation_Type === 'Frais fixe') {
            volumeValue = 1;
          } else if (fee.FE_Calculation_Type === 'Pourcentage budget') {
            volumeValue = appliedFee.customValue || 0;
          }
          
          calculatedUpdates[`TC_Fee_${feeNumber}_Volume`] = volumeValue;
          calculatedUpdates[`TC_Fee_${feeNumber}_Value`] = appliedFee.calculatedAmount || 0;
        } else {
          calculatedUpdates[`TC_Fee_${feeNumber}_Option`] = '';
          calculatedUpdates[`TC_Fee_${feeNumber}_Volume`] = 0;
          calculatedUpdates[`TC_Fee_${feeNumber}_Value`] = 0;
        }
      });

      onCalculatedChange(calculatedUpdates);
    }
  }, [budgetCalculationResults, budgetData.buyCurrency, campaignCurrency, exchangeRates, onCalculatedChange, clientFees]);

  // ==================== GESTIONNAIRES SIMPLIFIÉS ====================

  const handleSimpleChange = useCallback((field: string, value: number | string) => {
    console.log(`🔄 handleSimpleChange: ${field} = ${value}`);
    
    // Mapper vers les actions du hook
    switch (field) {
      case 'TC_BudgetInput':
      case 'TC_Budget':
        updateBudgetInput(Number(value));
        break;
      case 'TC_BudgetChoice':
      case 'TC_Budget_Mode':
        updateBudgetChoice(value as 'media' | 'client');
        break;
      case 'TC_Unit_Price':
      case 'TC_Cost_Per_Unit':
        updateUnitPrice(Number(value));
        break;
      case 'TC_Media_Value':
      case 'TC_Real_Value':
        updateMediaValue(Number(value));
        break;
      case 'TC_BuyCurrency':
      case 'TC_Currency':
        updateCurrency(String(value));
        break;
      case 'TC_Unit_Type':
        updateUnitType(String(value));
        break;
      default:
        // Fallback vers onChange classique
        const syntheticEvent = {
          target: {
            name: field,
            value: value.toString(),
            type: typeof value === 'number' ? 'number' : 'text'
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
    }
  }, [updateBudgetInput, updateBudgetChoice, updateUnitPrice, updateMediaValue, updateCurrency, updateUnitType, onChange]);

  // Calculs pour l'affichage (utiliser les résultats existants)
  const calculatedMediaBudget = budgetCalculationResults?.mediaBudget || budgetData.mediaBudget;
  const calculatedTotalFees = budgetCalculationResults?.totalFees || 0;
  const calculatedClientBudget = budgetCalculationResults?.clientBudget || budgetData.clientBudget;

  // Résumé budgétaire pour l'affichage (LOGIQUE EXISTANTE PRÉSERVÉE)
  const budgetSummary = useMemo(() => {
    const currency = budgetData.buyCurrency;
    const bonusValue = budgetData.bonification;
    
    const mediaBudget = calculatedMediaBudget;
    const totalFees = calculatedTotalFees;
    let clientBudget = calculatedClientBudget;
    
    let convergenceInfo = budgetCalculationResults?.convergenceInfo;
    if (convergenceInfo && !convergenceInfo.hasConverged) {
      clientBudget = convergenceInfo.actualCalculatedTotal;
    }
    
    let convertedValues;
    const effectiveRate = budgetData.currencyRate;
    if (currency !== campaignCurrency && effectiveRate !== 1) {
      convertedValues = {
        mediaBudget: mediaBudget * effectiveRate,
        totalFees: totalFees * effectiveRate,
        clientBudget: clientBudget * effectiveRate,
        bonusValue: bonusValue * effectiveRate,
        currency: campaignCurrency,
        exchangeRate: effectiveRate
      };
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
    budgetData.buyCurrency,
    budgetData.bonification,
    budgetData.currencyRate,
    campaignCurrency,
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

      {/* Messages d'erreur de calcul (PRÉSERVÉS) */}
      {calculationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <strong>Erreur de calcul :</strong> {calculationError}
          </p>
        </div>
      )}

      {/* Message d'erreur pour validation mode client (PRÉSERVÉ) */}
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

      {/* Message d'avertissement de convergence (PRÉSERVÉ) */}
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
                Écart: <strong>{Math.abs(budgetCalculationResults.convergenceInfo.finalDifference).toFixed(2)}$ {budgetData.buyCurrency}</strong>
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
        formData={{
          TC_Currency: budgetData.buyCurrency,
          TC_Unit_Type: budgetData.unitType,
          TC_Budget_Mode: budgetData.budgetChoice
        }}
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
          formData={{
            TC_Budget: budgetData.budgetInput,
            TC_Currency: budgetData.buyCurrency,
            TC_Cost_Per_Unit: budgetData.unitPrice,
            TC_Unit_Volume: budgetData.unitVolume,
            TC_Budget_Mode: budgetData.budgetChoice,
            TC_Has_Bonus: budgetData.mediaValue > 0,
            TC_Bonus_Value: budgetData.bonification,
            TC_Unit_Type: budgetData.unitType
          }}
          totalFees={calculatedTotalFees}
          unitTypeOptions={unitTypeOptions.map(item => ({ 
            id: item.id, 
            label: item.SH_Display_Name_FR 
          }))}
          onChange={onChange}
          onTooltipChange={onTooltipChange}
          onCalculatedChange={handleSimpleChange}
          disabled={isDisabled}
        />
      </FormSection>

      {/* Section Bonification */}
      <FormSection 
        title="Bonification"
        description="Gestion de l'économie négociée"
      >
        <BudgetBonificationSection
          formData={{
            TC_Currency: budgetData.buyCurrency,
            TC_Has_Bonus: budgetData.mediaValue > 0,
            TC_Real_Value: budgetData.mediaValue,
            TC_Bonus_Value: budgetData.bonification
          }}
          onChange={onChange}
          onTooltipChange={onTooltipChange}
          onCalculatedChange={handleSimpleChange}
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
          unitVolume={budgetData.unitVolume}
          tacticCurrency={budgetData.buyCurrency}
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

      {/* Debug Panel avec toggle */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleDebug}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          🐛 Debug Mode {debugMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Panel de debug centralisé */}
      {debugMode && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 mb-2">🐛 Debug Info - Budget</h5>
          <div className="text-xs text-gray-600 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-gray-800">Données Budget Hook:</div>
                <div>budgetChoice: {budgetData.budgetChoice}</div>
                <div>budgetInput: {budgetData.budgetInput}</div>
                <div>unitPrice: {budgetData.unitPrice}</div>
                <div>mediaValue: {budgetData.mediaValue}</div>
                <div>buyCurrency: {budgetData.buyCurrency}</div>
                <div>hasValidData: {hasValidData.toString()}</div>
              </div>
              <div>
                <div className="font-medium text-gray-800">Résultats Calculs:</div>
                {budgetCalculationResults ? (
                  <>
                    <div>mediaBudget: {budgetCalculationResults.mediaBudget.toFixed(2)}</div>
                    <div>clientBudget: {budgetCalculationResults.clientBudget.toFixed(2)}</div>
                    <div>unitVolume: {budgetCalculationResults.unitVolume.toFixed(2)}</div>
                    <div>bonification: {budgetCalculationResults.bonusValue.toFixed(2)}</div>
                    <div>convergé: {budgetCalculationResults.convergenceInfo?.hasConverged ? 'Oui' : 'Non'}</div>
                    <div>delta: {budgetCalculationResults.convergenceInfo?.finalDifference.toFixed(4) || 0}</div>
                  </>
                ) : (
                  <div>Pas de calculs disponibles</div>
                )}
              </div>
            </div>
            
            {/* Debug frais */}
            <div className="p-2 bg-indigo-100 rounded">
              <div className="font-medium text-indigo-800">Frais Hook vs Applied:</div>
              {budgetData.fees.map((fee, index) => (
                <div key={fee.feeId} className="text-xs">
                  {fee.feeName}: Hook(active={fee.isActive.toString()}, vol={fee.volumeValue}, val={fee.calculatedValue}) | 
                  Applied({appliedFees.find(af => af.feeId === fee.feeId)?.isActive ? 'active' : 'inactive'})
                </div>
              ))}
            </div>

            {/* Erreurs */}
            {(hookErrors.length > 0 || hookWarnings.length > 0) && (
              <div className="p-2 bg-red-100 rounded">
                <div className="font-medium text-red-800">Erreurs/Warnings:</div>
                {hookErrors.map((error, i) => <div key={i} className="text-red-600">❌ {error}</div>)}
                {hookWarnings.map((warning, i) => <div key={i} className="text-orange-600">⚠️ {warning}</div>)}
              </div>
            )}
          </div>
        </div>
      )}

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