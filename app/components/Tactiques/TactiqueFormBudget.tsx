// app/components/Tactiques/TactiqueFormBudget.tsx

'use client';

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { FormSection } from './TactiqueFormComponents';
import BudgetGeneralParams from './BudgetGeneralParams';
import BudgetMainSection from './BudgetMainSection';
import BudgetBonificationSection from './BudgetBonificationSection';
import BudgetFeesSection from './BudgetFeesSection';
import BudgetSummarySection from './BudgetSummarySection';

// Import de la logique de calcul rebuild avec convergence
import {
  calculateBudget,
  validateBudgetInputs,
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

/**
 * NOUVEAU: Détermine si le type d'unité sélectionné correspond aux impressions
 */
const isImpressionsType = (unitType: string, unitTypeOptions: ListItem[]): boolean => {
  if (!unitType || unitTypeOptions.length === 0) return false;
  
  const selectedUnit = unitTypeOptions.find(unit => unit.id === unitType);
  if (!selectedUnit) return false;
  
  const displayName = selectedUnit.SH_Display_Name_FR.toLowerCase();
  return displayName === 'impressions' || displayName === 'impression';
};

/**
 * CORRIGÉ: Calcule le volume d'affichage pour les impressions avec vérifications
 * Pour les impressions : volume affiché = volume calculé * 1000 (arrondi à l'unité)
 * Pour les autres : volume affiché = volume calculé (arrondi à l'unité)
 */
const calculateDisplayVolume = (
  calculatedVolume: number,
  unitType: string,
  unitTypeOptions: ListItem[]
): number => {
  // Vérifications de sécurité
  if (!isFinite(calculatedVolume) || isNaN(calculatedVolume) || calculatedVolume < 0) {
    console.warn('Volume calculé invalide:', calculatedVolume);
    return 0;
  }
  
  if (isImpressionsType(unitType, unitTypeOptions)) {
    // Pour les impressions, multiplier par 1000 puis arrondir
    const result = Math.round(calculatedVolume * 1000);
    console.log(`Conversion impressions: ${calculatedVolume} unités CPM → ${result} impressions`);
    return result;
  }
  // Pour les autres types, arrondir directement
  return Math.round(calculatedVolume);
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
  // NOUVEAU: États pour debounce des calculs
  const [debouncedCostPerUnit, setDebouncedCostPerUnit] = useState(0);
  const [debouncedBudget, setDebouncedBudget] = useState(0);
  
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

  // NOUVEAU: Initialisation des valeurs debouncées au chargement
  useEffect(() => {
    setDebouncedCostPerUnit(formData.TC_Cost_Per_Unit || 0);
    setDebouncedBudget(formData.TC_Budget || 0);
  }, []); // Une seule fois au montage

  // NOUVEAU: Debounce du coût par unité pour éviter les calculs pendant la saisie
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCostPerUnit(formData.TC_Cost_Per_Unit || 0);
    }, 300); // 300ms de délai

    return () => clearTimeout(timer);
  }, [formData.TC_Cost_Per_Unit]);

  // NOUVEAU: Debounce du budget pour éviter les calculs pendant la saisie
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBudget(formData.TC_Budget || 0);
    }, 300); // 300ms de délai

    return () => clearTimeout(timer);
  }, [formData.TC_Budget]);

  // CORRIGÉ: Validation spécifique pour le mode client avec valeurs debouncées
  const clientModeValidation = useMemo(() => {
    const budget = debouncedBudget;
    const budgetMode = formData.TC_Budget_Mode || 'media';
    
    if (budgetMode !== 'client' || budget <= 0) {
      return { isValid: true, message: null };
    }
    
    const activeFees = appliedFees.filter(af => af.isActive);
    const totalFees = activeFees.reduce((sum, af) => sum + af.calculatedAmount, 0);
    
    if (totalFees >= budget) {
      return {
        isValid: false,
        message: `Les frais (${totalFees.toFixed(2)}$) dépassent le budget client (${budget.toFixed(2)}$). Le budget média serait négatif.`
      };
    }
    
    const feePercentage = (totalFees / budget) * 100;
    if (feePercentage > 90) {
      return {
        isValid: false,
        message: `Les frais représentent ${feePercentage.toFixed(1)}% du budget client. Le budget média résultant sera très faible (${(budget - totalFees).toFixed(2)}$).`
      };
    }
    
    return { isValid: true, message: null };
  }, [
    debouncedBudget, // CORRIGÉ: Utiliser la valeur debouncée
    formData.TC_Budget_Mode,
    appliedFees
  ]);

  // CORRIGÉ: Calcul principal avec debounce pour éviter les conflits pendant la saisie
  const budgetCalculationResults = useMemo((): BudgetResults | null => {
    try {
      setCalculationError(null);
      
      // NOUVEAU: Utiliser les valeurs debouncées pour les calculs
      const budget = debouncedBudget;
      const costPerUnit = debouncedCostPerUnit;
      
      // Autres valeurs directes (pas de problème de saisie)
      const budgetMode = formData.TC_Budget_Mode || 'media';
      const realValue = formData.TC_Has_Bonus ? (formData.TC_Real_Value || 0) : undefined;
      const unitVolume = formData.TC_Unit_Volume || 0;
      
      // Validation de base
      if (budget <= 0 || costPerUnit <= 0) {
        return null;
      }
      
      // Vérifier la validation du mode client avant de continuer
      if (!clientModeValidation.isValid) {
        return null;
      }
      
      // Convertir les frais appliqués vers la nouvelle structure
      const feeDefinitions = convertAppliedFeesToDefinitions(appliedFees, clientFees);
      
      // Préparer les inputs pour le calcul
      const budgetInputs: BudgetInputs = {
        costPerUnit,
        realValue,
        unitVolume: unitVolume > 0 ? unitVolume : undefined,
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
    // CORRIGÉ: Utiliser les valeurs debouncées dans les dépendances
    debouncedBudget,
    debouncedCostPerUnit,
    formData.TC_Budget_Mode, 
    formData.TC_Has_Bonus,
    formData.TC_Real_Value,
    appliedFees,
    clientFees,
    clientModeValidation.isValid
  ]);

  // CORRIGÉ: Fonction pour gérer les changements calculés (séparée des inputs utilisateur)
  const handleCalculatedChange = useCallback((field: string, value: number | string) => {
    // IMPORTANT: Cette fonction est SEULEMENT pour les valeurs calculées par le système
    // Les inputs utilisateur (budget, coût par unité) doivent utiliser onChange directement
    
    // Ignorer les changements de frais pour éviter la boucle
    if (field.startsWith('TC_Fee_')) {
      return;
    }
    
    // Créer un événement synthétique
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    
    const syntheticEvent = {
      target: {
        name: field,
        value: numericValue.toString(),
        type: 'number'
      } as HTMLInputElement
    } as React.ChangeEvent<HTMLInputElement>;
    
    console.log(`Mise à jour calculée ${field}:`, numericValue);
    onChange(syntheticEvent);
  }, [onChange]); // Supprimé updateInProgress des dépendances

  // SIMPLIFIÉ: Synchroniser les résultats avec l'état du formulaire sans flag bloquant
  useEffect(() => {
    if (!budgetCalculationResults) return;
    
    try {
      // Mettre à jour les frais si nécessaire
      if (appliedFees.length > 0) {
        const updatedAppliedFees = updateAppliedFeesWithCalculations(appliedFees, budgetCalculationResults);
        
        const amountsChanged = updatedAppliedFees.some((updatedFee, index) => {
          const currentFee = appliedFees[index];
          return currentFee && Math.abs(updatedFee.calculatedAmount - currentFee.calculatedAmount) > 0.01;
        });
        
        if (amountsChanged) {
          setAppliedFees(updatedAppliedFees);
        }
      }
      
      // CORRIGÉ: Calculer le volume d'affichage pour les impressions
      const currentDisplayVolume = formData.TC_Unit_Volume || 0;
      const newDisplayVolume = calculateDisplayVolume(
        budgetCalculationResults.unitVolume,
        formData.TC_Unit_Type || '',
        unitTypeOptions
      );
      
      // Mettre à jour le volume seulement si significativement différent
      if (Math.abs(currentDisplayVolume - newDisplayVolume) > 1) { // Tolérance plus large
        console.log('Volume calculé brut:', budgetCalculationResults.unitVolume);
        console.log('Volume d\'affichage final:', newDisplayVolume);
        console.log('Type d\'unité:', formData.TC_Unit_Type);
        console.log('Est impressions:', isImpressionsType(formData.TC_Unit_Type || '', unitTypeOptions));
        
        // Utiliser un délai pour éviter les conflits avec les inputs utilisateur
        setTimeout(() => {
          handleCalculatedChange('TC_Unit_Volume', newDisplayVolume);
        }, 10);
      }
      
      // Mettre à jour la bonification si nécessaire
      if (formData.TC_Has_Bonus) {
        const currentBonus = formData.TC_Bonus_Value || 0;
        const newBonus = budgetCalculationResults.bonusValue;
        
        if (Math.abs(currentBonus - newBonus) > 0.01) {
          setTimeout(() => {
            handleCalculatedChange('TC_Bonus_Value', newBonus);
          }, 10);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    }
  }, [
    // Dépendances spécifiques
    budgetCalculationResults?.unitVolume,
    budgetCalculationResults?.bonusValue,
    formData.TC_Unit_Type,
    formData.TC_Has_Bonus,
    unitTypeOptions.length,
    handleCalculatedChange
  ]);

  // Extraire les valeurs calculées ou utiliser les valeurs par défaut
  const calculatedMediaBudget = budgetCalculationResults?.mediaBudget || 0;
  const calculatedTotalFees = budgetCalculationResults?.totalFees || 0;
  const calculatedClientBudget = budgetCalculationResults?.clientBudget || 0;

  // Calcul du résumé budgétaire pour l'affichage avec convergence
  const budgetSummary = useMemo((): BudgetSummary => {
    const currency = formData.TC_Currency || 'CAD';
    const bonusValue = formData.TC_Has_Bonus ? (formData.TC_Bonus_Value || 0) : 0;
    
    const mediaBudget = calculatedMediaBudget;
    const totalFees = calculatedTotalFees;
    let clientBudget = calculatedClientBudget;
    
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
          unitTypeOptions={unitTypeOptions} 
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
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Debug Info (Avec debounce)</h5>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-bold text-purple-600">Valeurs en cours de saisie:</div>
                <div>Budget: {formData.TC_Budget || 0}</div>
                <div>Coût par unité: {formData.TC_Cost_Per_Unit || 0}</div>
              </div>
              <div>
                <div className="font-bold text-blue-600">Valeurs debouncées (pour calculs):</div>
                <div>Budget: {debouncedBudget}</div>
                <div>Coût par unité: {debouncedCostPerUnit}</div>
              </div>
            </div>
            <div>Mode: {formData.TC_Budget_Mode || 'media'}</div>
            <div>Type d'unité: {formData.TC_Unit_Type || 'Aucun'}</div>
            <div>Est impressions: {isImpressionsType(formData.TC_Unit_Type || '', unitTypeOptions) ? 'Oui' : 'Non'}</div>
            {budgetCalculationResults && (
              <>
                <div className="font-bold text-blue-600">Volume calculé brut: {budgetCalculationResults.unitVolume}</div>
                <div className="font-bold text-green-600">Volume d'affichage: {formData.TC_Unit_Volume}</div>
                <div>Budget effectif pour volume: {budgetCalculationResults.effectiveBudgetForVolume}</div>
                <div>Budget média calculé: {budgetCalculationResults.mediaBudget.toFixed(2)}</div>
                <div>Total frais calculé: {budgetCalculationResults.totalFees.toFixed(2)}</div>
                <div>Budget client final: {budgetCalculationResults.clientBudget.toFixed(2)}</div>
                <div>Frais actifs: {budgetCalculationResults.feeDetails.length}</div>
                <div>Avec bonification: {budgetCalculationResults.hasBonus ? 'Oui' : 'Non'}</div>
                {budgetCalculationResults.hasBonus && (
                  <div>Bonification: {budgetCalculationResults.bonusValue.toFixed(2)}</div>
                )}
                <div>Multiplication impressions: {isImpressionsType(formData.TC_Unit_Type || '', unitTypeOptions) ? 
                  `${budgetCalculationResults.unitVolume} × 1000 = ${Math.round(budgetCalculationResults.unitVolume * 1000)}` : 
                  'N/A'}</div>
                {budgetCalculationResults.convergenceInfo && (
                  <div className="mt-2 p-2 bg-orange-100 rounded">
                    <div className="font-medium text-orange-800">Informations de convergence:</div>
                    <div>Convergée: {budgetCalculationResults.convergenceInfo.hasConverged ? 'Oui' : 'Non'}</div>
                    <div>Écart final: {budgetCalculationResults.convergenceInfo.finalDifference.toFixed(4)}$</div>
                    <div>Itérations: {budgetCalculationResults.convergenceInfo.iterations}</div>
                  </div>
                )}
              </>
            )}
            <div className="mt-2 p-2 bg-yellow-100 rounded">
              <div className="font-medium text-yellow-800">Validation mode client:</div>
              <div>Valide: {clientModeValidation.isValid ? 'Oui' : 'Non'}</div>
              {clientModeValidation.message && <div>Message: {clientModeValidation.message}</div>}
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