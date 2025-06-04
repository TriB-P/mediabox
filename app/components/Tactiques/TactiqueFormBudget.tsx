// app/components/Tactiques/TactiqueFormBudget.tsx - VERSION REFAITE DE ZÉRO

'use client';

import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { FormSection } from './TactiqueFormComponents';
import BudgetGeneralParams from './BudgetGeneralParams';
import BudgetMainSection from './BudgetMainSection';
import BudgetBonificationSection from './BudgetBonificationSection';
import BudgetFeesSection from './BudgetFeesSection';
import BudgetSummarySection from './BudgetSummarySection';

// Import du nouveau hook
import { useBudgetCalculations } from '../../hooks/useBudgetCalculations';
import { ClientFee } from '../../lib/budgetService';

// ==================== TYPES ====================

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

interface TactiqueFormBudgetProps {
  // Données du formulaire principal (format mixte pour compatibilité)
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
    [key: string]: any; // Pour les champs de frais
  };
  
  // Données externes
  dynamicLists: { [key: string]: ListItem[] };
  clientFees: ClientFee[];
  campaignCurrency: string;
  exchangeRates: { [key: string]: number };
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCalculatedChange: (updates: any) => void;
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
  
  // ==================== HOOK BUDGET ====================
  
  const unitTypeOptions = dynamicLists.TC_Unit_Type || [];
  
  const {
    budgetData,
    updateField,
    updateMultipleFields,
    hasValidData,
    errors,
    lastResult,
    debugMode,
    toggleDebug,
    getDataForFirestore
  } = useBudgetCalculations({
    initialData: formData,
    clientFees,
    campaignCurrency,
    exchangeRates,
    unitTypeOptions,
    autoCalculate: true // Auto-calcul activé
  });

  // ==================== REMONTER LES CHANGEMENTS AU PARENT ====================
  
  // Remonter les données calculées au parent (TactiqueDrawer)
  useEffect(() => {
    const dataForParent = getDataForFirestore();
    console.log('📤 Remontée des données au parent:', dataForParent);
    onCalculatedChange(dataForParent);
  }, [budgetData, getDataForFirestore, onCalculatedChange]);

  // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================
  
  /**
   * Gestionnaire pour les changements de champs simples
   */
  const handleFieldChange = useCallback((field: string, value: any) => {
    console.log(`🔄 Changement ${field}:`, value);
    
    // Mapper les noms legacy si nécessaire
    const mappedField = mapLegacyFieldName(field);
    updateField(mappedField as any, value);
  }, [updateField]);

  /**
   * Gestionnaire pour les événements de formulaire classiques
   */
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    }
    
    // Appeler aussi le onChange du parent pour compatibilité
    onChange(e);
    
    // Mettre à jour nos données
    handleFieldChange(name, processedValue);
  }, [onChange, handleFieldChange]);

  // ==================== DONNÉES POUR LES SOUS-COMPOSANTS ====================
  
  // Calculer le budget média effectif pour l'affichage
  const calculatedMediaBudget = budgetData.TC_Media_Budget || 0;
  
  // Calculer le total des frais (avec typage correct)
  const calculatedTotalFees = useMemo(() => {
    let total = 0;
    for (let i = 1; i <= 5; i++) {
      const valueKey = `TC_Fee_${i}_Value` as keyof typeof budgetData;
      total += (budgetData as any)[valueKey] || 0;
    }
    return total;
  }, [budgetData]);

  // Convertir les données budget vers le format attendu par les anciens composants
  const legacyFormData = useMemo(() => ({
    TC_Currency: budgetData.TC_BuyCurrency,
    TC_Unit_Type: budgetData.TC_Unit_Type,
    TC_Budget_Mode: budgetData.TC_BudgetChoice,
    TC_Budget: budgetData.TC_BudgetInput,
    TC_Cost_Per_Unit: budgetData.TC_Unit_Price,
    TC_Unit_Volume: budgetData.TC_Unit_Volume,
    TC_Has_Bonus: budgetData.TC_Media_Value > 0,
    TC_Real_Value: budgetData.TC_Media_Value,
    TC_Bonus_Value: budgetData.TC_Bonification
  }), [budgetData]);

  // Préparer appliedFees pour BudgetFeesSection (format de compatibilité)
  const appliedFees = useMemo(() => {
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    
    return sortedFees.map((fee, orderIndex) => {
      const feeNumber = orderIndex + 1;
      const optionKey = `TC_Fee_${feeNumber}_Option` as keyof typeof budgetData;
      const volumeKey = `TC_Fee_${feeNumber}_Volume` as keyof typeof budgetData;
      const valueKey = `TC_Fee_${feeNumber}_Value` as keyof typeof budgetData;
      
      const optionId = (budgetData as any)[optionKey] as string || '';
      const volumeValue = (budgetData as any)[volumeKey] as number || 0;
      const calculatedAmount = (budgetData as any)[valueKey] as number || 0;
      
      const appliedFee: any = {
        feeId: fee.id,
        isActive: !!optionId,
        selectedOptionId: optionId || undefined,
        customUnits: fee.FE_Calculation_Type === 'Unités' ? volumeValue : undefined,
        useCustomVolume: fee.FE_Calculation_Type === 'Volume d\'unité' && volumeValue > 0,
        customVolume: fee.FE_Calculation_Type === 'Volume d\'unité' && volumeValue > 0 ? volumeValue : undefined,
        customValue: fee.FE_Calculation_Type === 'Pourcentage budget' ? volumeValue : undefined,
        calculatedAmount
      };
      
      return appliedFee;
    });
  }, [budgetData, clientFees]);

  // Gestionnaire pour appliedFees (compatible avec le type attendu)
  const setAppliedFees = useCallback((value: any) => {
    console.log('🔄 Mise à jour appliedFees:', value);
    
    // Gérer le cas où c'est une fonction (setter React)
    const newAppliedFees = typeof value === 'function' ? value(appliedFees) : value;
    
    // Convertir les appliedFees vers notre format budgetData
    const updates: Record<string, any> = {};
    
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    
    sortedFees.forEach((fee, orderIndex) => {
      const feeNumber = orderIndex + 1;
      const appliedFee = newAppliedFees.find((af: any) => af.feeId === fee.id);
      
      const optionKey = `TC_Fee_${feeNumber}_Option` as keyof typeof budgetData;
      const volumeKey = `TC_Fee_${feeNumber}_Volume` as keyof typeof budgetData;
      const valueKey = `TC_Fee_${feeNumber}_Value` as keyof typeof budgetData;
      
      if (appliedFee && appliedFee.isActive && appliedFee.selectedOptionId) {
        (updates as any)[optionKey] = appliedFee.selectedOptionId;
        
        // Déterminer la valeur de volume selon le type
        let volumeValue = 0;
        switch (fee.FE_Calculation_Type) {
          case 'Unités':
            volumeValue = appliedFee.customUnits || 1;
            break;
          case 'Volume d\'unité':
            volumeValue = appliedFee.useCustomVolume ? (appliedFee.customVolume || 0) : 0;
            break;
          case 'Pourcentage budget':
            volumeValue = appliedFee.customValue || 0;
            break;
        }
        
        (updates as any)[volumeKey] = volumeValue;
        (updates as any)[valueKey] = appliedFee.calculatedAmount || 0;
      } else {
        // Frais inactif
        (updates as any)[optionKey] = '';
        (updates as any)[volumeKey] = 0;
        (updates as any)[valueKey] = 0;
      }
    });
    
    updateMultipleFields(updates);
  }, [clientFees, updateMultipleFields, appliedFees]);

  // Résumé budgétaire pour BudgetSummarySection
  const budgetSummary = useMemo(() => {
    const currency = budgetData.TC_BuyCurrency;
    const bonusValue = budgetData.TC_Bonification;
    const mediaBudget = calculatedMediaBudget;
    const totalFees = calculatedTotalFees;
    const clientBudget = budgetData.TC_Client_Budget;
    
    // Conversion de devise si nécessaire
    let convertedValues;
    const effectiveRate = budgetData.TC_Currency_Rate;
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
      convergenceInfo: lastResult?.data?.convergenceInfo
    };
  }, [budgetData, calculatedMediaBudget, calculatedTotalFees, campaignCurrency, lastResult]);

  // ==================== RENDU ====================

  return (
    <div className="p-8 space-y-8">
      {/* En-tête de section */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Budget et frais
        </h3>
      </div>

      {/* Messages d'erreur */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <strong>Erreurs de calcul :</strong>
          </p>
          <ul className="list-disc list-inside text-sm mt-1">
            {errors.map((error: string, index: number) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Message de convergence */}
      {lastResult?.data?.convergenceInfo && !lastResult.data.convergenceInfo.hasConverged && (
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
                Écart: <strong>{Math.abs(lastResult.data.convergenceInfo.finalDifference).toFixed(2)}$ {budgetData.TC_BuyCurrency}</strong>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Paramètres généraux */}
      <BudgetGeneralParams
        formData={legacyFormData}
        onChange={handleFormChange}
        onTooltipChange={onTooltipChange}
        unitTypeOptions={unitTypeOptions}
        disabled={loading}
      />

      {/* Section Budget principal */}
      <FormSection 
        title="Budget principal"
        description="Calculs automatiques du budget, coût et volume"
      >
        <BudgetMainSection
          formData={legacyFormData}
          totalFees={calculatedTotalFees}
          unitTypeOptions={unitTypeOptions.map(item => ({ 
            id: item.id, 
            label: item.SH_Display_Name_FR 
          }))}
          onChange={handleFormChange}
          onTooltipChange={onTooltipChange}
          onCalculatedChange={handleFieldChange}
          disabled={loading}
        />
      </FormSection>

      {/* Section Bonification */}
      <FormSection 
        title="Bonification"
        description="Gestion de l'économie négociée"
      >
        <BudgetBonificationSection
          formData={legacyFormData}
          onChange={handleFormChange}
          onTooltipChange={onTooltipChange}
          onCalculatedChange={handleFieldChange}
          mediaBudget={calculatedMediaBudget}
          disabled={loading}
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
          unitVolume={budgetData.TC_Unit_Volume}
          tacticCurrency={budgetData.TC_BuyCurrency}
          onTooltipChange={onTooltipChange}
          disabled={loading}
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

      {/* Panel de debug */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleDebug}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          🐛 Debug Mode {debugMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Debug info */}
      {debugMode && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 mb-2">🐛 Debug Info - Budget</h5>
          <div className="text-xs text-gray-600 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-gray-800">Données Budget:</div>
                <div>Choice: {budgetData.TC_BudgetChoice}</div>
                <div>Input: {budgetData.TC_BudgetInput}</div>
                <div>Unit Price: {budgetData.TC_Unit_Price}</div>
                <div>Media Value: {budgetData.TC_Media_Value}</div>
                <div>Currency: {budgetData.TC_BuyCurrency}</div>
                <div>Has Valid Data: {hasValidData.toString()}</div>
              </div>
              <div>
                <div className="font-medium text-gray-800">Résultats:</div>
                <div>Media Budget: {budgetData.TC_Media_Budget.toFixed(2)}</div>
                <div>Client Budget: {budgetData.TC_Client_Budget.toFixed(2)}</div>
                <div>Unit Volume: {budgetData.TC_Unit_Volume.toFixed(0)}</div>
                <div>Bonification: {budgetData.TC_Bonification.toFixed(2)}</div>
                <div>Total Fees: {calculatedTotalFees.toFixed(2)}</div>
                <div>Convergé: {lastResult?.data?.hasConverged ? 'Oui' : 'Non'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message de chargement */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">Chargement des données budgétaires...</p>
        </div>
      )}
    </div>
  );
});

// ==================== UTILITAIRES ====================

/**
 * Mappe les anciens noms de champs vers les nouveaux
 */
function mapLegacyFieldName(field: string): string {
  const mapping: Record<string, string> = {
    'TC_Budget': 'TC_BudgetInput',
    'TC_Budget_Mode': 'TC_BudgetChoice', 
    'TC_Cost_Per_Unit': 'TC_Unit_Price',
    'TC_Real_Value': 'TC_Media_Value',
    'TC_Bonus_Value': 'TC_Bonification',
    'TC_Currency': 'TC_BuyCurrency'
  };
  
  return mapping[field] || field;
}

TactiqueFormBudget.displayName = 'TactiqueFormBudget';

export default TactiqueFormBudget;