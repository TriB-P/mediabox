// app/components/Tactiques/TactiqueFormBudget.tsx

/**
 * Ce fichier contient le composant React `TactiqueFormBudget`.
 * Il s'agit d'un formulaire complexe dédié à la gestion du budget d'une tactique marketing.
 * Il permet de définir le type de budget (client ou média), les coûts, les volumes,
 * la bonification, et d'appliquer divers frais client.
 * Le composant utilise le hook `useBudgetCalculations` pour encapsuler la logique de calcul complexe
 * et remonte les données formatées au composant parent via la prop `onCalculatedChange`.
 */

'use client';

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FormSection } from './TactiqueFormComponents';
import BudgetGeneralParams from './BudgetGeneralParams';
import BudgetMainSection from './BudgetMainSection';
import BudgetBonificationSection from './BudgetBonificationSection';
import BudgetFeesSection from './BudgetFeesSection';
import BudgetSummarySection from './BudgetSummarySection';
import { useBudgetCalculations } from '../../../hooks/useBudgetCalculations';
import { ClientFee } from '../../../lib/budgetService';

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

interface TactiqueFormBudgetProps {
  formData: {
    TC_Budget_Mode?: 'client' | 'media';
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
  
  dynamicLists: { [key: string]: ListItem[] };
  clientFees: ClientFee[];
  campaignCurrency: string;
  exchangeRates: { [key: string]: number };
  clientId?: string;
  
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCalculatedChange: (updates: any) => void;
  onTooltipChange: (tooltip: string | null) => void;
  
  loading?: boolean;
}

/**
 * Composant principal du formulaire de budget pour une tactique.
 * @param {TactiqueFormBudgetProps} props - Les propriétés du composant.
 * @param {object} props.formData - Les données initiales du formulaire pour la tactique.
 * @param {object} props.dynamicLists - Listes de valeurs dynamiques pour les menus déroulants (ex: types d'unité).
 * @param {ClientFee[]} props.clientFees - Un tableau des frais configurés pour le client.
 * @param {string} props.campaignCurrency - La devise par défaut de la campagne.
 * @param {object} props.exchangeRates - Les taux de change disponibles.
 * @param {string} [props.clientId] - L'identifiant du client pour récupérer le guide de coûts.
 * @param {Function} props.onChange - Callback déclenché lors d'un changement sur un champ de formulaire standard.
 * @param {Function} props.onCalculatedChange - Callback pour remonter les données calculées et formatées au parent.
 * @param {Function} props.onTooltipChange - Callback pour afficher des infobulles d'aide.
 * @param {boolean} [props.loading=false] - Indique si le composant est en état de chargement.
 * @returns {React.ReactElement} Le formulaire de budget.
 */
const TactiqueFormBudget = memo<TactiqueFormBudgetProps>(({
  formData,
  dynamicLists,
  clientFees,
  campaignCurrency,
  exchangeRates,
  clientId,
  onChange,
  onCalculatedChange,
  onTooltipChange,
  loading = false
}) => {
  
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
    autoCalculate: true
  });

  const [feeIntentions, setFeeIntentions] = useState<{ [feeId: string]: boolean }>(() => {
    const intentions: { [feeId: string]: boolean } = {};
    clientFees.forEach((fee, index) => {
      const feeNumber = index + 1;
      const optionKey = `TC_Fee_${feeNumber}_Option`;
      const hasOption = !!(budgetData as any)[optionKey];
      intentions[fee.id] = hasOption;
    });
    return intentions;
  });

  const [bonusIntention, setBonusIntention] = useState(() => {
    return budgetData.TC_Media_Value > 0 || !!formData.TC_Has_Bonus;
  });

  const calculatedMediaBudget = budgetData.TC_Media_Budget || 0;


  useEffect(() => {
    const dataForParent = getDataForFirestore();
    
    // NOUVEAU : Calculer TOUJOURS les budgets en devise de référence
    const currency = budgetData.TC_BuyCurrency;
    const effectiveRate = budgetData.TC_Currency_Rate || 1;
    const needsConversion = currency !== campaignCurrency;
    
    // Toujours calculer ces champs
    const finalRate = needsConversion ? effectiveRate : 1;
    const refCurrencyData = {
      TC_Client_Budget_RefCurrency: budgetData.TC_Client_Budget * finalRate,
      TC_Media_Budget_RefCurrency: calculatedMediaBudget * finalRate,
      TC_Currency_Rate: finalRate
    };
    
    // Fusionner avec les données existantes
    const enhancedData = {
      ...dataForParent,
      ...refCurrencyData
    };
    
    onCalculatedChange(enhancedData);
  }, [budgetData, getDataForFirestore, onCalculatedChange, calculatedMediaBudget, campaignCurrency]);
  

  /**
   * Gère le changement d'une valeur d'un champ unique du hook de calcul.
   * @param {string} field - Le nom du champ à mettre à jour.
   * @param {any} value - La nouvelle valeur du champ.
   * @returns {void}
   */
  const handleFieldChange = useCallback((field: string, value: any) => {
    const mappedField = mapLegacyFieldName(field);
    updateField(mappedField as any, value);
  }, [updateField]);

  /**
   * Gère les changements provenant des éléments de formulaire HTML natifs (input, select).
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - L'événement de changement.
   * @returns {void}
   */
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    }
    
    onChange(e);
    handleFieldChange(name, processedValue);
  }, [onChange, handleFieldChange]);

  /**
   * Gère l'activation ou la désactivation de la section bonification.
   * @param {boolean} hasBonus - Indique si la bonification est activée.
   * @returns {void}
   */
  const handleBonusToggle = useCallback((hasBonus: boolean) => {
    setBonusIntention(hasBonus);
    
    if (hasBonus) {
      if (budgetData.TC_Media_Value === 0) {
        // Pas de traitement spécial, l'utilisateur saisira les valeurs.
      }
    } else {
      updateMultipleFields({
        TC_Media_Value: 0,
        TC_Bonification: 0
      });
    }
  }, [budgetData.TC_Media_Value, updateMultipleFields]);

  /**
   * Gère l'activation ou la désactivation d'un frais spécifique.
   * @param {string} feeId - L'ID du frais à basculer.
   * @param {boolean} isActive - Le nouvel état d'activité du frais.
   * @returns {void}
   */
  const handleToggleFee = useCallback((feeId: string, isActive: boolean) => {
    setFeeIntentions(prev => ({
      ...prev,
      [feeId]: isActive
    }));
    
    const fee = clientFees.find(f => f.id === feeId);
    if (!fee) return;
    
    const feeIndex = clientFees.findIndex(f => f.id === feeId);
    const feeNumber = feeIndex + 1;
    const optionKey = `TC_Fee_${feeNumber}_Option`;
    const volumeKey = `TC_Fee_${feeNumber}_Volume`;
    const valueKey = `TC_Fee_${feeNumber}_Value`;
    
    const updates: Record<string, any> = {};
    
    if (isActive) {
      if (fee.options && fee.options.length === 1) {
        updates[optionKey] = fee.options[0].id;
      } else if (fee.options && fee.options.length > 1) {
        updates[optionKey] = 'ACTIVE_NO_SELECTION';
      }
    } else {
      updates[optionKey] = '';
      updates[volumeKey] = 0;
      updates[valueKey] = 0;
    }
    
    updateMultipleFields(updates);
  }, [clientFees, updateMultipleFields]);

  
  const calculatedTotalFees = useMemo(() => {
    let total = 0;
    for (let i = 1; i <= 5; i++) {
      const valueKey = `TC_Fee_${i}_Value` as keyof typeof budgetData;
      total += (budgetData as any)[valueKey] || 0;
    }
    return total;
  }, [budgetData]);

  const legacyFormData = useMemo(() => ({
    TC_Currency: budgetData.TC_BuyCurrency,
    TC_Unit_Type: budgetData.TC_Unit_Type,
    TC_Budget_Mode: budgetData.TC_Budget_Mode,
    TC_Budget: budgetData.TC_BudgetInput,
    TC_Cost_Per_Unit: budgetData.TC_Unit_Price,
    TC_Unit_Volume: budgetData.TC_Unit_Volume,
    TC_Has_Bonus: bonusIntention,
    TC_Real_Value: budgetData.TC_Media_Value,
    TC_Bonus_Value: budgetData.TC_Bonification
  }), [budgetData, bonusIntention]);

  const appliedFees = useMemo(() => {
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    
    return sortedFees.map((fee, orderIndex) => {
      const feeNumber = orderIndex + 1;
      const optionKey = `TC_Fee_${feeNumber}_Option`;
      const volumeKey = `TC_Fee_${feeNumber}_Volume`;
      const valueKey = `TC_Fee_${feeNumber}_Value`;
      
      const optionId = (budgetData as any)[optionKey] as string || '';
      const volumeValue = (budgetData as any)[volumeKey] as number || 0;
      const calculatedAmount = (budgetData as any)[valueKey] as number || 0;
      
      const isActive = feeIntentions[fee.id] || false;
      
      const selectedOption = fee.options?.find(opt => opt.id === optionId);
      
      const appliedFee: any = {
        feeId: fee.id,
        isActive,
        selectedOptionId: optionId || undefined,
        calculatedAmount
      };
      
      if (selectedOption && appliedFee.isActive) {
        switch (fee.FE_Calculation_Type) {
          case 'Unités':
            appliedFee.customUnits = volumeValue || 1;
            break;
          case 'Volume d\'unité':
            if (volumeValue > 0) {
              appliedFee.useCustomVolume = true;
              appliedFee.customVolume = volumeValue;
            }
            break;
          case 'Pourcentage budget':
            if (selectedOption.FO_Editable) {
              appliedFee.customValue = volumeValue;
            }
            break;
          case 'Frais fixe':
            if (selectedOption.FO_Editable) {
              appliedFee.customValue = volumeValue;
            }
            break;
        }
      }
      
      return appliedFee;
    });
  }, [budgetData, clientFees, feeIntentions]);

  /**
   * Met à jour l'état des frais appliqués en fonction des interactions de l'utilisateur.
   * @param {any} value - La nouvelle structure des frais appliqués, ou une fonction pour la mettre à jour.
   * @returns {void}
   */
  const setAppliedFees = useCallback((value: any) => {
    const newAppliedFees = typeof value === 'function' ? value(appliedFees) : value;
    
    const newIntentions: { [feeId: string]: boolean } = {};
    newAppliedFees.forEach((af: any) => {
      newIntentions[af.feeId] = af.isActive;
    });
    setFeeIntentions(newIntentions);
    
    const updates: Record<string, any> = {};
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    
    sortedFees.forEach((fee, orderIndex) => {
      const feeNumber = orderIndex + 1;
      const appliedFee = newAppliedFees.find((af: any) => af.feeId === fee.id);
      
      const optionKey = `TC_Fee_${feeNumber}_Option`;
      const volumeKey = `TC_Fee_${feeNumber}_Volume`;
      const valueKey = `TC_Fee_${feeNumber}_Value`;
      
      if (appliedFee && appliedFee.isActive) {
        if (appliedFee.selectedOptionId && appliedFee.selectedOptionId !== 'ACTIVE_NO_SELECTION') {
          updates[optionKey] = appliedFee.selectedOptionId;
          
          const selectedOption = fee.options?.find(opt => opt.id === appliedFee.selectedOptionId);
          if (selectedOption) {
            let volumeValue = 0;
            
            switch (fee.FE_Calculation_Type) {
              case 'Unités':
                volumeValue = appliedFee.customUnits || 1;
                break;
              case 'Volume d\'unité':
                volumeValue = appliedFee.useCustomVolume ? (appliedFee.customVolume || 0) : 0;
                break;
              case 'Pourcentage budget':
                if (selectedOption.FO_Editable && appliedFee.customValue !== undefined) {
                  volumeValue = appliedFee.customValue;
                }
                break;
              case 'Frais fixe':
                if (selectedOption.FO_Editable && appliedFee.customValue !== undefined) {
                  volumeValue = appliedFee.customValue;
                }
                break;
            }
            
            updates[volumeKey] = volumeValue;
          }
        } else {
          updates[optionKey] = 'ACTIVE_NO_SELECTION';
          updates[volumeKey] = 0;
          updates[valueKey] = 0;
        }
      } else {
        updates[optionKey] = '';
        updates[volumeKey] = 0;
        updates[valueKey] = 0;
      }
    });
    
    updateMultipleFields(updates);
  }, [clientFees, updateMultipleFields, appliedFees]);

  const budgetSummary = useMemo(() => {
    const currency = budgetData.TC_BuyCurrency;
    const bonusValue = budgetData.TC_Bonification;
    const mediaBudget = calculatedMediaBudget;
    const totalFees = calculatedTotalFees;
    const clientBudget = budgetData.TC_Client_Budget;
    
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

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Budget et frais
        </h3>
      </div>

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
      
      <BudgetGeneralParams
        formData={legacyFormData}
        onChange={handleFormChange}
        onTooltipChange={onTooltipChange}
        unitTypeOptions={unitTypeOptions}
        disabled={loading}
      />

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
          clientId={clientId}
          onChange={handleFormChange}
          onTooltipChange={onTooltipChange}
          onCalculatedChange={handleFieldChange}
          disabled={loading}
        />
      </FormSection>

      <FormSection 
        title="Bonification"
        description="Gestion de l'économie négociée"
      >
        <BudgetBonificationSection
          formData={legacyFormData}
          onChange={handleFormChange}
          onTooltipChange={onTooltipChange}
          onCalculatedChange={handleFieldChange}
          onToggle={handleBonusToggle}
          mediaBudget={calculatedMediaBudget}
          disabled={loading}
        />
      </FormSection>

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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleDebug}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          🐛 Debug Mode {debugMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {debugMode && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 mb-2">🐛 Debug Info - Budget</h5>
          <div className="text-xs text-gray-600 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-gray-800">Données Budget:</div>
                <div>Choice: {budgetData.TC_Budget_Mode}</div>
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
            
            <div className="border-t pt-2 mt-2">
              <div className="font-medium text-gray-800">Debug Intentions:</div>
              <div>Bonus Intention: {bonusIntention.toString()}</div>
              <div>Fee Intentions: {JSON.stringify(feeIntentions)}</div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">Chargement des données budgétaires...</p>
        </div>
        )}
    </div>
  );
});


/**
 * Mappe les anciens noms de champs de formulaire vers les nouveaux noms utilisés par le hook `useBudgetCalculations`.
 * Assure la rétrocompatibilité lors de la gestion des changements de champs.
 * @param {string} field - L'ancien nom du champ.
 * @returns {string} Le nouveau nom du champ, ou l'ancien nom si aucune correspondance n'est trouvée.
 */
function mapLegacyFieldName(field: string): string {
  const mapping: Record<string, string> = {
    'TC_Budget': 'TC_BudgetInput',
    'TC_Budget_Mode': 'TC_Budget_Mode', 
    'TC_Cost_Per_Unit': 'TC_Unit_Price',
    'TC_Real_Value': 'TC_Media_Value',
    'TC_Bonus_Value': 'TC_Bonification',
    'TC_Currency': 'TC_BuyCurrency'
  };
  
  return mapping[field] || field;
}

TactiqueFormBudget.displayName = 'TactiqueFormBudget';

export default TactiqueFormBudget;