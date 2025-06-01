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
    // NOUVEAU: Champs pour les frais persistés
    TC_Fee_1_Option?: string;
    TC_Fee_1_Value?: number;
    TC_Fee_2_Option?: string;
    TC_Fee_2_Value?: number;
    TC_Fee_3_Option?: string;
    TC_Fee_3_Value?: number;
    TC_Fee_4_Option?: string;
    TC_Fee_4_Value?: number;
    TC_Fee_5_Option?: string;
    TC_Fee_5_Value?: number;
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
 * CORRECTION COMPLÈTE : Calcule le budget média correct en mode client
 * en résolvant la dépendance circulaire ET en gérant les frais précédents
 */
function calculateMediaBudgetInClientMode(
  clientBudget: number,
  appliedFees: AppliedFee[],
  clientFees: Fee[],
  unitVolume: number
): { mediaBudget: number; calculatedFees: AppliedFee[] } {
  
  if (clientBudget <= 0) {
    return { mediaBudget: 0, calculatedFees: appliedFees };
  }

  // Trier les frais par ordre pour traitement séquentiel
  const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
  
  // NOUVELLE APPROCHE : Résolution itérative pour gérer les frais précédents
  let mediaBudget = clientBudget * 0.8; // Estimation initiale
  let iterations = 0;
  const maxIterations = 20;
  let converged = false;
  
  while (!converged && iterations < maxIterations) {
    const previousMediaBudget = mediaBudget;
    
    // Calculer tous les frais avec ce budget média
    let cumulatedBase = mediaBudget;
    let totalCalculatedFees = 0;
    const calculatedFeesAmounts: { [feeId: string]: number } = {};
    
    for (const fee of sortedFees) {
      const appliedFee = appliedFees.find(af => af.feeId === fee.id);
      if (!appliedFee || !appliedFee.isActive || !appliedFee.selectedOptionId) {
        calculatedFeesAmounts[fee.id] = 0;
        continue;
      }

      const selectedOption = fee.options.find(opt => opt.id === appliedFee.selectedOptionId);
      if (!selectedOption) {
        calculatedFeesAmounts[fee.id] = 0;
        continue;
      }

      // Calculer la valeur avec buffer
      const baseValue = appliedFee.customValue !== undefined ? appliedFee.customValue : selectedOption.FO_Value;
      const finalValue = baseValue * ((100 + selectedOption.FO_Buffer) / 100);

      let calculatedAmount = 0;
      
      // Calculer selon le type de frais
      switch (fee.FE_Calculation_Type) {
        case 'Volume d\'unité':
          calculatedAmount = finalValue * unitVolume;
          break;
          
        case 'Unités':
          const units = appliedFee.customUnits || 1;
          calculatedAmount = finalValue * units;
          break;
          
        case 'Frais fixe':
          calculatedAmount = finalValue;
          break;
          
        case 'Pourcentage budget':
          // CORRECTION : Utiliser la bonne base selon le mode
          const baseAmount = fee.FE_Calculation_Mode === 'Directement sur le budget média' 
            ? mediaBudget 
            : cumulatedBase; // Base cumulative pour "frais précédents"
          
          calculatedAmount = finalValue * baseAmount;
          break;
      }

      calculatedFeesAmounts[fee.id] = calculatedAmount;
      totalCalculatedFees += calculatedAmount;
      
      // IMPORTANT : Ajouter ce frais à la base cumulative pour les suivants
      cumulatedBase += calculatedAmount;
    }
    
    // Nouveau budget média = Budget client - Total des frais
    const newMediaBudget = clientBudget - totalCalculatedFees;
    
    // Vérifier la convergence
    const difference = Math.abs(newMediaBudget - mediaBudget);
    if (difference < 0.01) {
      converged = true;
    }
    
    mediaBudget = newMediaBudget;
    iterations++;
    
    console.log(`Itération ${iterations}: Budget média = ${mediaBudget.toFixed(2)}, Total frais = ${totalCalculatedFees.toFixed(2)}, Différence = ${difference.toFixed(4)}`);
  }
  
  if (!converged) {
    console.warn(`Convergence non atteinte après ${maxIterations} itérations`);
  }

  // Calculer une dernière fois avec le budget média final
  let cumulatedBase = mediaBudget;
  const updatedFees: AppliedFee[] = [];
  
  for (const fee of sortedFees) {
    const appliedFee = appliedFees.find(af => af.feeId === fee.id);
    if (!appliedFee || !appliedFee.isActive || !appliedFee.selectedOptionId) {
      updatedFees.push(appliedFee || { 
        feeId: fee.id, 
        isActive: false, 
        calculatedAmount: 0 
      });
      continue;
    }

    const selectedOption = fee.options.find(opt => opt.id === appliedFee.selectedOptionId);
    if (!selectedOption) {
      updatedFees.push({ ...appliedFee, calculatedAmount: 0 });
      continue;
    }

    // Calculer la valeur avec buffer
    const baseValue = appliedFee.customValue !== undefined ? appliedFee.customValue : selectedOption.FO_Value;
    const finalValue = baseValue * ((100 + selectedOption.FO_Buffer) / 100);

    let calculatedAmount = 0;
    
    // Calculer selon le type de frais
    switch (fee.FE_Calculation_Type) {
      case 'Volume d\'unité':
        calculatedAmount = finalValue * unitVolume;
        break;
        
      case 'Unités':
        const units = appliedFee.customUnits || 1;
        calculatedAmount = finalValue * units;
        break;
        
      case 'Frais fixe':
        calculatedAmount = finalValue;
        break;
        
      case 'Pourcentage budget':
        const baseAmount = fee.FE_Calculation_Mode === 'Directement sur le budget média' 
          ? mediaBudget 
          : cumulatedBase;
        
        calculatedAmount = finalValue * baseAmount;
        break;
    }

    updatedFees.push({ ...appliedFee, calculatedAmount });
    
    // Ajouter à la base cumulative pour les frais suivants
    cumulatedBase += calculatedAmount;
  }

  const finalTotalFees = updatedFees.reduce((sum, fee) => sum + (fee.calculatedAmount || 0), 0);
  
  console.log(`RÉSULTAT FINAL MODE CLIENT:
    - Budget client: ${clientBudget}
    - Budget média final: ${mediaBudget.toFixed(2)}
    - Total frais: ${finalTotalFees.toFixed(2)}
    - Vérification: ${(mediaBudget + finalTotalFees).toFixed(2)}
    - Itérations: ${iterations}`);

  return { mediaBudget: Math.max(0, mediaBudget), calculatedFees: updatedFees };
}

// NOUVELLE FONCTION: Charger les frais appliqués depuis les données de la tactique
function loadAppliedFeesFromFormData(
  formData: TactiqueFormBudgetProps['formData'],
  clientFees: Fee[]
): AppliedFee[] {
  const appliedFees: AppliedFee[] = [];
  
  // Parcourir les frais clients et chercher les valeurs correspondantes dans formData
  clientFees.forEach((fee, index) => {
    const feeOrder = fee.FE_Order + 1; // Les champs commencent à 1
    const optionKey = `TC_Fee_${feeOrder}_Option` as keyof typeof formData;
    const valueKey = `TC_Fee_${feeOrder}_Value` as keyof typeof formData;
    
    const selectedOptionId = formData[optionKey] as string;
    const customValue = formData[valueKey] as number;
    
    const isActive = !!selectedOptionId;
    
    appliedFees.push({
      feeId: fee.id,
      isActive,
      selectedOptionId: isActive ? selectedOptionId : undefined,
      customValue: customValue !== undefined ? customValue : undefined,
      calculatedAmount: 0 // Sera calculé plus tard
    });
  });
  
  return appliedFees;
}

// NOUVELLE FONCTION: Sauvegarder les frais appliqués dans les données du formulaire
function saveAppliedFeesToFormData(
  appliedFees: AppliedFee[],
  clientFees: Fee[],
  onCalculatedChange: (field: string, value: number | string) => void
): void {
  
  // Réinitialiser tous les champs de frais
  for (let i = 1; i <= 5; i++) {
    onCalculatedChange(`TC_Fee_${i}_Option`, '');
    onCalculatedChange(`TC_Fee_${i}_Value`, 0);
  }
  
  // Sauvegarder les frais actifs
  clientFees.forEach((fee, index) => {
    const appliedFee = appliedFees.find(af => af.feeId === fee.id);
    if (!appliedFee) return;
    
    const feeOrder = fee.FE_Order + 1; // Les champs commencent à 1
    
    if (appliedFee.isActive && appliedFee.selectedOptionId) {
      onCalculatedChange(`TC_Fee_${feeOrder}_Option`, appliedFee.selectedOptionId);
      
      if (appliedFee.customValue !== undefined) {
        onCalculatedChange(`TC_Fee_${feeOrder}_Value`, appliedFee.customValue);
      } else {
        // Utiliser la valeur par défaut de l'option
        const selectedOption = fee.options.find(opt => opt.id === appliedFee.selectedOptionId);
        if (selectedOption) {
          onCalculatedChange(`TC_Fee_${feeOrder}_Value`, selectedOption.FO_Value);
        }
      }
    }
  });
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

  // NOUVEAU: Charger les frais appliqués depuis les données du formulaire au démarrage
  useEffect(() => {
    if (clientFees.length > 0) {
      const loadedAppliedFees = loadAppliedFeesFromFormData(formData, clientFees);
      setAppliedFees(loadedAppliedFees);
    }
  }, [clientFees, formData]);

  // Fonction pour gérer les changements calculés avec sauvegarde des frais
  const handleCalculatedChange = useCallback((field: string, value: number | string) => {
    const syntheticEvent = {
      target: {
        name: field,
        value: value.toString(),
        type: typeof value === 'number' ? 'number' : 'text'
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  }, [onChange]);

  // NOUVEAU: Effect pour sauvegarder les frais quand ils changent
  useEffect(() => {
    if (appliedFees.length > 0) {
      // Sauvegarder dans les propriétés de la tactique
      saveAppliedFeesToFormData(appliedFees, clientFees, handleCalculatedChange);
    }
  }, [appliedFees, clientFees, handleCalculatedChange]);

  // CORRECTION MAJEURE : Calcul correct du budget média et des frais
  const { calculatedMediaBudget, calculatedTotalFees, correctedAppliedFees } = useMemo(() => {
    const budget = formData.TC_Budget || 0;
    const budgetMode = formData.TC_Budget_Mode || 'media';
    const unitVolume = formData.TC_Unit_Volume || 0;
    
    if (budgetMode === 'client' && budget > 0) {
      // NOUVEAU : Calcul correct pour le mode client
      const result = calculateMediaBudgetInClientMode(budget, appliedFees, clientFees, unitVolume);
      
      const totalFees = result.calculatedFees
        .filter(af => af.isActive)
        .reduce((sum, af) => sum + af.calculatedAmount, 0);
      
      return {
        calculatedMediaBudget: result.mediaBudget,
        calculatedTotalFees: totalFees,
        correctedAppliedFees: result.calculatedFees
      };
    } else {
      // Mode média : logique normale
      const totalFees = appliedFees
        .filter(af => af.isActive && typeof af.calculatedAmount === 'number')
        .reduce((sum, af) => sum + (af.calculatedAmount || 0), 0);
      
      return {
        calculatedMediaBudget: budget,
        calculatedTotalFees: isNaN(totalFees) ? 0 : totalFees,
        correctedAppliedFees: appliedFees
      };
    }
  }, [formData.TC_Budget, formData.TC_Budget_Mode, formData.TC_Unit_Volume, appliedFees, clientFees]);

  // Synchroniser les frais corrigés
  useEffect(() => {
    if (formData.TC_Budget_Mode === 'client') {
      setAppliedFees(correctedAppliedFees);
    }
  }, [correctedAppliedFees, formData.TC_Budget_Mode]);

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
        // Mode client: utiliser les valeurs calculées
        finalClientBudget = budget;
        finalMediaBudget = calculatedMediaBudget;
      } else {
        // Mode média: budget saisi = budget média, on ajoute les frais pour le client
        finalMediaBudget = budget;
        finalClientBudget = budget + calculatedTotalFees;
      }
      
      // Validation des valeurs
      finalMediaBudget = isNaN(finalMediaBudget) ? 0 : finalMediaBudget;
      finalClientBudget = isNaN(finalClientBudget) ? 0 : finalClientBudget;
      const finalTotalFees = isNaN(calculatedTotalFees) ? 0 : calculatedTotalFees;
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
    calculatedMediaBudget,
    calculatedTotalFees,
    formData.TC_Budget,
    formData.TC_Budget_Mode,
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

      {/* Section Frais - MODIFIÉE pour passer la devise de la tactique avec debug */}
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

      {/* Debug info en développement - AJOUTÉ pour vérifier la devise */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Debug Info - Devise</h5>
          <div className="text-xs text-gray-600 space-y-1">
            <div>formData.TC_Currency: "{formData.TC_Currency}"</div>
            <div>formData.TC_Currency || 'CAD': "{formData.TC_Currency || 'CAD'}"</div>
            <div>Type: {typeof formData.TC_Currency}</div>
          </div>
        </div>
      )}

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
          <h5 className="text-sm font-medium text-gray-800 mb-2">Debug Info (Persistance Frais)</h5>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Budget saisi: {formData.TC_Budget || 0}</div>
            <div>Mode: {formData.TC_Budget_Mode || 'media'}</div>
            <div>Budget média calculé: {calculatedMediaBudget}</div>
            <div>Total frais calculé: {calculatedTotalFees}</div>
            <div>Budget client final: {budgetSummary.clientBudget}</div>
            <div>Frais actifs: {appliedFees.filter(af => af.isActive).length}</div>
            <div>Frais persistés:</div>
            {[1,2,3,4,5].map(i => {
              const optionKey = `TC_Fee_${i}_Option` as keyof typeof formData;
              const valueKey = `TC_Fee_${i}_Value` as keyof typeof formData;
              const option = formData[optionKey];
              const value = formData[valueKey];
              return option ? (
                <div key={i} className="ml-2">
                  Fee_{i}: {option} = {value}
                </div>
              ) : null;
            })}
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