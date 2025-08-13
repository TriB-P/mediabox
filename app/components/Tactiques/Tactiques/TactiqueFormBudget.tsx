// app/components/Tactiques/Tactiques/TactiqueFormBudget.tsx

/**
 * Ce fichier contient le composant React `TactiqueFormBudget`.
 * Il s'agit d'un formulaire complexe dédié à la gestion du budget d'une tactique marketing.
 * Il permet de définir le type de budget (client ou média), les coûts, les volumes,
 * la bonification, et d'appliquer divers frais client.
 * Le composant utilise le hook `useBudgetCalculations` pour encapsuler la logique de calcul complexe
 * et remonte les données formatées au composant parent via la prop `onCalculatedChange`.
 * MODIFIÉ : Ajout de la sélection de versions de taux de change personnalisées avec persistance.
 */

'use client';

import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { FormSection } from './TactiqueFormComponents';
import BudgetGeneralParams from './BudgetGeneralParams';
import BudgetMainSection from './BudgetMainSection';
import BudgetBonificationSection from './BudgetBonificationSection';
import BudgetFeesSection from './BudgetFeesSection';
import BudgetSummarySection from './BudgetSummarySection';
import { useBudgetCalculations } from '../../../hooks/useBudgetCalculations';
import { ClientFee } from '../../../lib/budgetService';

// IMPORTS pour la gestion des taux de change par versions
import {
  getCurrencyRatesByPair,
  getCurrencyRateByVersion,
  hasRatesForCurrencyPair
} from '../../../lib/currencyService';
import { Currency } from '../../../types/currency';

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
    TC_Currency_Version?: string; // NOUVEAU : Version de taux sélectionnée
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

// INTERFACE pour les options de taux de change
interface CurrencyRateOption {
  id: string;
  label: string;
  rate: number;
  year: string;
  fromCurrency: string;
  toCurrency: string;
}

/**
 * COMPOSANT : Sélecteur de version de taux de change
 */
const CurrencyVersionSelector = memo<{
  tacticCurrency: string;
  campaignCurrency: string;
  availableRates: Currency[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  loading: boolean;
  error: string | null;
  onTooltipChange: (tooltip: string | null) => void;
}>(({ 
  tacticCurrency, 
  campaignCurrency, 
  availableRates, 
  selectedVersion, 
  onVersionChange, 
  loading, 
  error,
  onTooltipChange 
}) => {
  const { t } = useTranslation();

  const formatRateDisplay = useCallback((rate: Currency) => {
    return `${rate.CU_Year} (Taux: ${rate.CU_Rate.toFixed(4)})`;
  }, []);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-800">{t('tactiqueFormBudget.currencySelector.loadingRates')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className="text-red-500 text-lg">⚠️</span>
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">{t('tactiqueFormBudget.currencySelector.unavailableTitle')}</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <p className="text-xs text-red-600 mt-2">
              {t('tactiqueFormBudget.currencySelector.configureMessage', { tacticCurrency, campaignCurrency })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (availableRates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className="text-yellow-600 text-lg">💱</span>
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-800">{t('tactiqueFormBudget.currencySelector.requiredTitle')}</p>
            <p className="text-sm text-yellow-700 mt-1">
              {t('tactiqueFormBudget.currencySelector.requiredDescription', { tacticCurrency, campaignCurrency })}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="currency-version-select" className="block text-sm font-medium text-gray-700 mb-2">
          {t('tactiqueFormBudget.currencySelector.versionLabel')}
          <button
            type="button"
            onMouseEnter={() => onTooltipChange(t('tactiqueFormBudget.currencySelector.versionTooltip'))}
            onMouseLeave={() => onTooltipChange(null)}
            className="ml-2 text-indigo-600 hover:text-indigo-800"
          >
            ℹ️
          </button>
        </label>
        
        <select
          id="currency-version-select"
          value={selectedVersion}
          onChange={(e) => onVersionChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value="">{t('tactiqueFormBudget.currencySelector.selectPlaceholder')}</option>
          {availableRates.map(rate => (
            <option key={rate.id} value={rate.CU_Year}>
              {formatRateDisplay(rate)}
            </option>
          ))}
        </select>
        
        {!selectedVersion && (
          <div className="mt-2 text-sm text-red-600">
            {t('tactiqueFormBudget.currencySelector.selectionWarning')}
          </div>
        )}
      </div>

      {selectedVersion && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <div className="text-sm">
              <span className="font-medium text-green-800">{t('tactiqueFormBudget.currencySelector.selectedRateLabel')}</span>
              <span className="text-green-700 ml-1">
                {availableRates.find(r => r.CU_Year === selectedVersion)?.CU_Rate.toFixed(4)} 
                ({tacticCurrency} → {campaignCurrency})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CurrencyVersionSelector.displayName = 'CurrencyVersionSelector';

/**
 * Composant principal du formulaire de budget pour une tactique.
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
  const { t } = useTranslation();
  
  const unitTypeOptions = dynamicLists.TC_Unit_Type || [];

  // ÉTATS pour la gestion des taux de change par versions (SUPPRIMÉ selectedCurrencyVersion)
  const [availableCurrencyRates, setAvailableCurrencyRates] = useState<Currency[]>([]);
  const [currencyConversionError, setCurrencyConversionError] = useState<string | null>(null);
  const [loadingCurrencyRates, setLoadingCurrencyRates] = useState(false);
  
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

  /**
   * NOUVELLES FONCTIONS pour la persistance de la version de taux
   */

  /**
   * Obtient la version de taux actuellement sélectionnée depuis les données du formulaire
   */
  const getSelectedCurrencyVersion = useCallback((): string => {
    return (formData as any).TC_Currency_Version || '';
  }, [formData.TC_Currency_Version]);

  /**
   * Vérifie si une conversion de devise est nécessaire
   */
  const needsCurrencyConversion = useCallback((tacticCurrency: string, campaignCurrency: string): boolean => {
    if (!tacticCurrency || !campaignCurrency) return false;
    return tacticCurrency !== campaignCurrency;
  }, []);



  // CORRECTION : Utiliser useRef pour stabiliser onCalculatedChange
  const onCalculatedChangeRef = useRef(onCalculatedChange);
  useEffect(() => {
    onCalculatedChangeRef.current = onCalculatedChange;
  }, [onCalculatedChange]);

  /**
   * Charge les taux de change disponibles pour une paire de devises spécifique
   */
  const loadCurrencyRatesForPair = useCallback(async (fromCurrency: string, toCurrency: string) => {
    if (!clientId || !needsCurrencyConversion(fromCurrency, toCurrency)) {
      return;
    }

    try {
      setLoadingCurrencyRates(true);
      setCurrencyConversionError(null);
      console.log(`FIREBASE: LECTURE - Fichier: TactiqueFormBudget.tsx - Fonction: loadCurrencyRatesForPair - Path: clients/${clientId}/currencies - Pair: ${fromCurrency} -> ${toCurrency}`);
      
      const rates = await getCurrencyRatesByPair(clientId, fromCurrency, toCurrency);
      
      if (rates.length === 0) {
        setCurrencyConversionError(t('tactiqueFormBudget.errors.noRateConfigured', { fromCurrency, toCurrency }));
        setAvailableCurrencyRates([]);
      } else {
        setAvailableCurrencyRates(rates);
        
        // CORRECTION : Simplifier la logique pour éviter les appels en cascade
        const currentSelectedVersion = (formData as any).TC_Currency_Version || '';
        
        if (!currentSelectedVersion && rates.length > 0) {
          // Auto-sélectionner la première version seulement si aucune n'est sauvegardée
          const firstRate = rates[0];
          
          // Appliquer le taux directement sans passer par setSelectedCurrencyVersion
          updateField('TC_Currency_Rate' as any, firstRate.CU_Rate);
          onCalculatedChangeRef.current({
            TC_Currency_Version: firstRate.CU_Year,
            TC_Currency_Rate: firstRate.CU_Rate
          });
        } else if (currentSelectedVersion) {
          // Vérifier que la version sauvegardée existe et appliquer son taux
          const savedRate = rates.find(r => r.CU_Year === currentSelectedVersion);
          if (savedRate) {
            updateField('TC_Currency_Rate' as any, savedRate.CU_Rate);
          } else {
            // La version sauvegardée n'existe plus, prendre la première disponible
            const firstRate = rates[0];
            updateField('TC_Currency_Rate' as any, firstRate.CU_Rate);
            onCalculatedChangeRef.current({
              TC_Currency_Version: firstRate.CU_Year,
              TC_Currency_Rate: firstRate.CU_Rate
            });
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des taux ${fromCurrency} -> ${toCurrency}:`, error);
      setCurrencyConversionError(t('tactiqueFormBudget.errors.loadingRatesError', { fromCurrency, toCurrency }));
      setAvailableCurrencyRates([]);
    } finally {
      setLoadingCurrencyRates(false);
    }
  }, [clientId, formData.TC_Currency_Version, updateField, t]); // CORRECTION : onCalculatedChange retiré des dépendances

  /**
   * Gère le changement de version de taux de change sélectionnée
   */
  const handleCurrencyVersionChange = useCallback(async (version: string) => {
    if (!clientId || !version) return;

    const tacticCurrency = budgetData.TC_BuyCurrency;
    if (!tacticCurrency || !campaignCurrency) return;

    try {
      console.log(`FIREBASE: LECTURE - Fichier: TactiqueFormBudget.tsx - Fonction: handleCurrencyVersionChange - Path: clients/${clientId}/currencies - Version: ${version}`);
      
      const rateData = await getCurrencyRateByVersion(
        clientId,
        tacticCurrency,
        campaignCurrency,
        version
      );

      if (rateData) {
        // CORRECTION : Appliquer le taux et sauvegarder la version en une seule fois
        updateField('TC_Currency_Rate' as any, rateData.CU_Rate);
        onCalculatedChangeRef.current({
          TC_Currency_Version: version,
          TC_Currency_Rate: rateData.CU_Rate
        });
        setCurrencyConversionError(null);
      } else {
        setCurrencyConversionError(t('tactiqueFormBudget.errors.rateNotFoundForVersion', { version }));
      }
    } catch (error) {
      console.error('Erreur lors de l\'application du taux de change:', error);
      setCurrencyConversionError(t('tactiqueFormBudget.errors.applyingRateError', { version }));
    }
  }, [clientId, budgetData.TC_BuyCurrency, campaignCurrency, updateField, t]); // CORRECTION : Référence stable

  /**
   * EFFET pour surveiller les changements de devise d'achat
   */
  useEffect(() => {
    const tacticCurrency = budgetData.TC_BuyCurrency;
    
    if (tacticCurrency && campaignCurrency && needsCurrencyConversion(tacticCurrency, campaignCurrency)) {
      loadCurrencyRatesForPair(tacticCurrency, campaignCurrency);
    } else {
      // Nettoyer les erreurs et sélections si pas de conversion nécessaire
      setCurrencyConversionError(null);
      setAvailableCurrencyRates([]);
      
      // CORRECTION : Nettoyer TC_Currency_Version seulement si elle existe pour éviter la boucle
      const currentVersion = (formData as any).TC_Currency_Version || '';
      if (currentVersion) {
        onCalculatedChangeRef.current({
          TC_Currency_Version: ''
        });
      }
    }
  }, [budgetData.TC_BuyCurrency, campaignCurrency, loadCurrencyRatesForPair, formData.TC_Currency_Version]); // CORRECTION : Reference stable

  /**
   * LOGIQUE EXISTANTE (inchangée)
   */
  useEffect(() => {
    const dataForParent = getDataForFirestore();
    
    // Calculer TOUJOURS les budgets en devise de référence
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
  
  const handleFieldChange = useCallback((field: string, value: any) => {
    const mappedField = mapLegacyFieldName(field);
    updateField(mappedField as any, value);
  }, [updateField]);

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

  // Vérifier si la devise nécessite une sélection de version
  const shouldShowCurrencyVersionSelector = useMemo(() => {
    const tacticCurrency = budgetData.TC_BuyCurrency;
    return needsCurrencyConversion(tacticCurrency, campaignCurrency);
  }, [budgetData.TC_BuyCurrency, campaignCurrency, needsCurrencyConversion]);

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          {t('tactiqueFormBudget.form.title')}
        </h3>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <strong>{t('tactiqueFormBudget.form.calculationErrors')}</strong>
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
                {t('tactiqueFormBudget.form.convergenceWarning.title')}
              </p>
              <p className="text-sm mt-1">
                {t('tactiqueFormBudget.form.convergenceWarning.description')}{' '}
                <strong>{t('tactiqueFormBudget.form.convergenceWarning.gap')} {Math.abs(lastResult.data.convergenceInfo.finalDifference).toFixed(2)}$ {budgetData.TC_BuyCurrency}</strong>
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

      {/* SECTION : Sélecteur de version de taux de change */}
      {shouldShowCurrencyVersionSelector && (
        <FormSection 
          title={t('tactiqueFormBudget.form.sections.currencyConversion.title')}
          description={t('tactiqueFormBudget.form.sections.currencyConversion.description')}
        >
          <CurrencyVersionSelector
            tacticCurrency={budgetData.TC_BuyCurrency}
            campaignCurrency={campaignCurrency}
            availableRates={availableCurrencyRates}
            selectedVersion={getSelectedCurrencyVersion()} // MODIFIÉ : utiliser la fonction
            onVersionChange={handleCurrencyVersionChange}
            loading={loadingCurrencyRates}
            error={currencyConversionError}
            onTooltipChange={onTooltipChange}
          />
        </FormSection>
      )}

      <FormSection 
        title={t('tactiqueFormBudget.form.sections.mainBudget.title')}
        description={t('tactiqueFormBudget.form.sections.mainBudget.description')}
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
        title={t('tactiqueFormBudget.form.sections.bonus.title')}
        description={t('tactiqueFormBudget.form.sections.bonus.description')}
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
        title={t('tactiqueFormBudget.form.sections.fees.title')}
        description={t('tactiqueFormBudget.form.sections.fees.description')}
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
        title={t('tactiqueFormBudget.form.sections.summary.title')}
        description={t('tactiqueFormBudget.form.sections.summary.description')}
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
                <div className="font-medium text-gray-800">{t('tactiqueFormBudget.debug.budgetData')}</div>
                <div>Choice: {budgetData.TC_Budget_Mode}</div>
                <div>Input: {budgetData.TC_BudgetInput}</div>
                <div>Unit Price: {budgetData.TC_Unit_Price}</div>
                <div>Media Value: {budgetData.TC_Media_Value}</div>
                <div>Currency: {budgetData.TC_BuyCurrency}</div>
                <div>Has Valid Data: {hasValidData.toString()}</div>
              </div>
              <div>
                <div className="font-medium text-gray-800">{t('tactiqueFormBudget.debug.results')}</div>
                <div>Media Budget: {budgetData.TC_Media_Budget.toFixed(2)}</div>
                <div>Client Budget: {budgetData.TC_Client_Budget.toFixed(2)}</div>
                <div>Unit Volume: {budgetData.TC_Unit_Volume.toFixed(0)}</div>
                <div>{t('tactiqueFormBudget.debug.bonification')} {budgetData.TC_Bonification.toFixed(2)}</div>
                <div>Total Fees: {calculatedTotalFees.toFixed(2)}</div>
                <div>{t('tactiqueFormBudget.debug.converged')} {lastResult?.data?.hasConverged ? t('common.yes') : t('common.no')}</div>
              </div>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="font-medium text-gray-800">Debug Intentions:</div>
              <div>Bonus Intention: {bonusIntention.toString()}</div>
              <div>Fee Intentions: {JSON.stringify(feeIntentions)}</div>
            </div>

            {/* Debug des taux de change */}
            <div className="border-t pt-2 mt-2">
              <div className="font-medium text-gray-800">Debug Currency Rates:</div>
              <div>Needs Conversion: {shouldShowCurrencyVersionSelector.toString()}</div>
              <div>Available Rates: {availableCurrencyRates.length}</div>
              <div>Selected Version: {getSelectedCurrencyVersion()}</div> {/* MODIFIÉ : utiliser la fonction */}
              <div>Currency Error: {currencyConversionError || 'None'}</div>
              <div>Loading Rates: {loadingCurrencyRates.toString()}</div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{t('tactiqueFormBudget.form.loadingData')}</p>
        </div>
      )}
    </div>
  );
});

/**
 * Mappe les anciens noms de champs de formulaire vers les nouveaux noms utilisés par le hook `useBudgetCalculations`.
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