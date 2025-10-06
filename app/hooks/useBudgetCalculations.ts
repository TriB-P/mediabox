// app/hooks/useBudgetCalculations.ts

/**
 * Ce hook gère les calculs complexes liés au budget d'une campagne, y compris
 * le budget média, les volumes d'unités, et surtout, le calcul des frais clients.
 * CORRECTION : Élimination de la boucle infinie en stabilisant les références
 * et en optimisant les appels d'assignation des noms.
 * CORRECTION BUDGETS REFCURRENCY : Ajout du calcul des budgets en devise de référence
 * NOUVEAU : Permet les calculs même sans TC_Unit_Price valide (utilise TC_Unit_Volume = 0)
 * CORRECTION : Permet maintenant TC_BudgetInput = 0 (effectue les calculs et retourne 0 partout)
 * CORRECTION : TC_BudgetInput peut être null/undefined (traité comme 0)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { budgetService, BudgetData, ClientFee, BudgetCalculationResult } from '../lib/budgetService';
import { getFeeNamesBatch, getFeeOptionNamesBatch } from '../lib/feeService';

interface UseBudgetCalculationsProps {
  initialData?: any;
  clientFees: ClientFee[];
  campaignCurrency: string;
  exchangeRates: { [key: string]: number };
  unitTypeOptions: Array<{ id: string; SH_Display_Name_FR: string }>;
  autoCalculate?: boolean;
  clientId?: string;
}

interface UseBudgetCalculationsReturn {
  budgetData: BudgetData;
  isCalculating: boolean;
  lastResult: BudgetCalculationResult | null;
  errors: string[];
  hasValidData: boolean;
  debugMode: boolean;
  toggleDebug: () => void;
  updateField: (field: keyof BudgetData, value: any) => void;
  updateMultipleFields: (updates: Partial<BudgetData>) => void;
  calculate: () => void;
  reset: () => void;
  getDataForFirestore: () => BudgetData;
}

/**
 * 🔥 FONCTION CORRIGÉE : Calcule les montants en devise de référence pour tous les frais ET les budgets.
 */
function calculateRefCurrencyAmounts(
  budgetData: BudgetData, 
  currencyRate: number
): Partial<BudgetData> {
  const updates: any = {};
  
  // Calcul des frais en devise de référence (logique existante)
  for (let i = 1; i <= 5; i++) {
    const valueKey = `TC_Fee_${i}_Value`;
    const refCurrencyKey = `TC_Fee_${i}_RefCurrency`;
    
    const feeValue = (budgetData as any)[valueKey] || 0;
    updates[refCurrencyKey] = feeValue * currencyRate;
  }
  
  // 🆕 CORRECTION : Calcul des budgets en devise de référence
  const clientBudget = budgetData.TC_Client_Budget || 0;
  const mediaBudget = budgetData.TC_Media_Budget || 0;
  
  updates.TC_Client_Budget_RefCurrency = clientBudget * currencyRate;
  updates.TC_Media_Budget_RefCurrency = mediaBudget * currencyRate;
  
  return updates as Partial<BudgetData>;
}

/**
 * 🔥 FONCTION OPTIMISÉE : Vérifie si les options de frais ont changé pour éviter les appels inutiles
 */
function hasOptionsChanged(
  currentData: BudgetData,
  previousData: BudgetData | null
): boolean {
  if (!previousData) return true;
  
  for (let i = 1; i <= 5; i++) {
    const optionKey = `TC_Fee_${i}_Option` as keyof BudgetData;
    if (currentData[optionKey] !== previousData[optionKey]) {
      return true;
    }
  }
  
  return false;
}

/**
 * 🔥 FONCTION OPTIMISÉE : Récupère et assigne les noms des frais et options SEULEMENT si nécessaire.
 */
async function assignFeeAndOptionNames(
  budgetData: BudgetData,
  clientFees: ClientFee[],
  clientId: string
): Promise<Partial<BudgetData>> {
  if (!clientId) {
    return {};
  }

  try {
    const updates: any = {};
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    
    const optionRequests: Array<{ feeId: string; optionId: string }> = [];
    
    sortedFees.forEach((fee, orderIndex) => {
      const feeNumber = orderIndex + 1;
      const optionKey = `TC_Fee_${feeNumber}_Option`;
      const nameKey = `TC_Fee_${feeNumber}_Name`;
      const optionNameKey = `TC_Fee_${feeNumber}_Option_Name`;
      
      const selectedOptionId = (budgetData as any)[optionKey] as string;
      
      // Assigner le nom du frais
      updates[nameKey] = fee.FE_Name;
      
      // Préparer la requête pour le nom de l'option si une option est sélectionnée
      if (selectedOptionId && selectedOptionId !== 'ACTIVE_NO_SELECTION') {
        optionRequests.push({ feeId: fee.id, optionId: selectedOptionId });
      } else {
        updates[optionNameKey] = '';
      }
    });
    
    // Récupérer les noms des options en batch si nécessaire
    if (optionRequests.length > 0) {
      const optionNames = await getFeeOptionNamesBatch(clientId, optionRequests);
      
      sortedFees.forEach((fee, orderIndex) => {
        const feeNumber = orderIndex + 1;
        const optionKey = `TC_Fee_${feeNumber}_Option`;
        const optionNameKey = `TC_Fee_${feeNumber}_Option_Name`;
        
        const selectedOptionId = (budgetData as any)[optionKey] as string;
        
        if (selectedOptionId && selectedOptionId !== 'ACTIVE_NO_SELECTION') {
          const key = `${fee.id}:${selectedOptionId}`;
          updates[optionNameKey] = optionNames[key] || '';
        }
      });
    }
    
    return updates as Partial<BudgetData>;
    
  } catch (error) {
    console.error('Erreur lors de l\'assignation des noms de frais et options:', error);
    return {};
  }
}

/**
 * Calcule correctement les frais en appliquant les bonnes formules selon le type de frais
 * et la logique séquentielle/cumulative.
 */
function calculateFeesCorrectly(
  budgetData: BudgetData, 
  clientFees: ClientFee[]
): Partial<BudgetData> {
  const updates: any = {};
  const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
  
  const mediaBudget = budgetData.TC_Media_Budget || 0;
  const unitVolume = budgetData.TC_Unit_Volume || 0;
  
  let cumulativeBase = mediaBudget;
  
  sortedFees.forEach((fee, orderIndex) => {
    const feeNumber = orderIndex + 1;
    const optionKey = `TC_Fee_${feeNumber}_Option`;
    const volumeKey = `TC_Fee_${feeNumber}_Volume`;
    const valueKey = `TC_Fee_${feeNumber}_Value`;
    
    const selectedOptionId = (budgetData as any)[optionKey] as string;
    const customVolume = (budgetData as any)[volumeKey] as number || 0;
    
    if (!selectedOptionId) {
      updates[valueKey] = 0;
      return;
    }
    
    const selectedOption = fee.options?.find(opt => opt.id === selectedOptionId);

    if (!selectedOption) {
      updates[valueKey] = 0;
      return;
    }
    
    let baseValue = selectedOption.FO_Value;
    
    if (selectedOption.FO_Editable) {
      switch (fee.FE_Calculation_Type) {
        case 'Pourcentage budget':
          if (customVolume !== undefined && customVolume !== null) {
            baseValue = customVolume;
          }
          break;
        case 'Frais fixe':
          if (customVolume !== undefined && customVolume !== null && customVolume >= 0) {
            baseValue = customVolume;
          }
          break;
        case 'Volume d\'unité':
          break;
        case 'Unités':
          break;
        default:
      }
    }
    
    const bufferMultiplier = (100 + (selectedOption.FO_Buffer || 0)) / 100;
    const finalValue = baseValue * bufferMultiplier;
    
    let calculatedAmount = 0;
    
    switch (fee.FE_Calculation_Type) {
      case 'Pourcentage budget':
        let baseForPercentage: number;
        
        if (fee.FE_Calculation_Mode === 'Directement sur le budget média') {
          baseForPercentage = mediaBudget;
        } else {
          baseForPercentage = cumulativeBase;
        }
        
        calculatedAmount = finalValue * baseForPercentage;
        break;
        
      case 'Volume d\'unité':
        let effectiveVolume: number;
        
        if (customVolume > 0) {
          effectiveVolume = customVolume;
        } else {
          effectiveVolume = unitVolume;
        }
        
        calculatedAmount = finalValue * effectiveVolume /1000;
        break;
        
        case 'Unités':
          let unitsCount: number;
          
          if (customVolume > 0) {
            unitsCount = customVolume;
          } else {
            unitsCount = 1;
          }
          
          calculatedAmount = finalValue * unitsCount;
          break;
        
      case 'Frais fixe':
        calculatedAmount = finalValue;
        break;
        
      default:
        console.warn(`⚠️ Type de frais non reconnu: ${fee.FE_Calculation_Type}`);
        calculatedAmount = 0;
    }
    
    updates[valueKey] = calculatedAmount;
    
    if (calculatedAmount > 0) {
      cumulativeBase += calculatedAmount;
    }
  });
  
  return updates as Partial<BudgetData>;
}

/**
 * 🔥 HOOK CORRIGÉ : Hook personnalisé pour gérer toutes les logiques de calcul et d'état
 * 🆕 NOUVEAU : Permet les calculs même sans TC_Unit_Price valide
 * 🆕 CORRECTION : Permet maintenant TC_BudgetInput = 0 (effectue les calculs)
 * 🆕 CORRECTION : TC_BudgetInput peut être null/undefined (traité comme 0)
 */
export function useBudgetCalculations({
  initialData,
  clientFees,
  campaignCurrency,
  exchangeRates,
  unitTypeOptions,
  autoCalculate = true,
  clientId
}: UseBudgetCalculationsProps): UseBudgetCalculationsReturn {
  
  const [budgetData, setBudgetData] = useState<BudgetData>(() => {
    if (initialData && clientFees.length > 0) {
      return budgetService.loadFromFirestore(initialData, clientFees);
    } else {
      return budgetService.createDefaultData(clientFees);
    }
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastResult, setLastResult] = useState<BudgetCalculationResult | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // 🔥 CORRECTION : Référence pour éviter la boucle infinie
  const previousBudgetDataRef = useRef<BudgetData | null>(null);
  const isCalculatingRef = useRef(false);
  
  // 🆕 CORRECTION : hasValidData accepte maintenant null/undefined (traité comme 0)
  const hasValidData = true; // Toujours valide, null/undefined sera traité comme 0
  const errors = lastResult?.error ? [lastResult.error] : [];
  
  /**
   * Effet pour synchroniser le mode debug du service de budget avec l'état du hook.
   */
  useEffect(() => {
    budgetService.setDebugMode(debugMode);
  }, [debugMode]);
  
  /**
   * 🔥 CORRECTION : Fonction de calcul stable qui ne dépend pas de budgetData
   * 🆕 NOUVEAU : Ne vérifie plus TC_Unit_Price, permet les calculs avec prix = 0
   * 🆕 CORRECTION : Accepte maintenant TC_BudgetInput = 0, null ou undefined (traité comme 0)
   */
  const calculateWithCorrectFees = useCallback(async (currentBudgetData: BudgetData) => {
    // 🆕 CORRECTION : Traiter null/undefined comme 0, seules les valeurs négatives sont rejetées
    const budgetInput = currentBudgetData.TC_BudgetInput ?? 0;
    
    if (budgetInput < 0) {
      return; // Seuls les budgets négatifs sont rejetés
    }
    
    if (isCalculatingRef.current) {
      return; // Éviter les calculs multiples simultanés
    }
    
    isCalculatingRef.current = true;
    setIsCalculating(true);
    
    try {
      const result = budgetService.calculateComplete(
        currentBudgetData,
        clientFees,
        exchangeRates,
        campaignCurrency,
        unitTypeOptions
      );
      
      setLastResult(result);
      
      if (result.success && result.data) {
        const correctedFeesAndBonus = calculateFeesCorrectly(result.data.updatedData, clientFees);
        
        // 🆕 CORRECTION : Calculer TOUS les montants RefCurrency (frais + budgets)
        const currencyRate = result.data.updatedData.TC_Currency_Rate || 1;
        const refCurrencyUpdates = calculateRefCurrencyAmounts({
          ...result.data.updatedData,
          ...correctedFeesAndBonus
        }, currencyRate);
        
        let finalData = {
          ...result.data.updatedData,
          ...correctedFeesAndBonus,
          ...refCurrencyUpdates
        };
        
        // 🔥 OPTIMISATION : Assigner les noms seulement si les options ont changé
        if (clientId && hasOptionsChanged(finalData, previousBudgetDataRef.current)) {
          try {
            const namesUpdates = await assignFeeAndOptionNames(finalData, clientFees, clientId);
            finalData = {
              ...finalData,
              ...namesUpdates
            };
          } catch (error) {
            console.warn('Erreur lors de l\'assignation des noms:', error);
          }
        }
        
        previousBudgetDataRef.current = finalData;
        setBudgetData(finalData);
      } else {
        console.error('❌ Calcul principal échoué:', result.error);
      }
      
    } catch (error) {
      console.error('💥 Erreur lors du calcul:', error);
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      isCalculatingRef.current = false;
      setIsCalculating(false);
    }
  }, [clientFees, exchangeRates, campaignCurrency, unitTypeOptions, clientId]);
  
  /**
   * 🔥 CORRECTION : Effet qui utilise une référence stable et évite la boucle
   * 🆕 NOUVEAU : Déclenche les calculs même sans prix unitaire valide
   * 🆕 CORRECTION : Déclenche les calculs même avec TC_BudgetInput = 0, null ou undefined
   */
  useEffect(() => {
    if (!autoCalculate || !hasValidData || isCalculatingRef.current) {
      return;
    }
    
    // Vérifier si les données pertinentes ont réellement changé
    const currentRelevantData = {
      TC_BudgetInput: budgetData.TC_BudgetInput ?? 0, // Traiter null/undefined comme 0
      TC_Unit_Price: budgetData.TC_Unit_Price,
      TC_Budget_Mode: budgetData.TC_Budget_Mode,
      TC_Media_Value: budgetData.TC_Media_Value,
      TC_BuyCurrency: budgetData.TC_BuyCurrency,
      TC_Unit_Type: budgetData.TC_Unit_Type,
      TC_Fee_1_Option: budgetData.TC_Fee_1_Option,
      TC_Fee_2_Option: budgetData.TC_Fee_2_Option,
      TC_Fee_3_Option: budgetData.TC_Fee_3_Option,
      TC_Fee_4_Option: budgetData.TC_Fee_4_Option,
      TC_Fee_5_Option: budgetData.TC_Fee_5_Option,
      TC_Fee_1_Volume: budgetData.TC_Fee_1_Volume,
      TC_Fee_2_Volume: budgetData.TC_Fee_2_Volume,
      TC_Fee_3_Volume: budgetData.TC_Fee_3_Volume,
      TC_Fee_4_Volume: budgetData.TC_Fee_4_Volume,
      TC_Fee_5_Volume: budgetData.TC_Fee_5_Volume,
    };
    
    const previousRelevantData = previousBudgetDataRef.current ? {
      TC_BudgetInput: previousBudgetDataRef.current.TC_BudgetInput ?? 0, // Traiter null/undefined comme 0
      TC_Unit_Price: previousBudgetDataRef.current.TC_Unit_Price,
      TC_Budget_Mode: previousBudgetDataRef.current.TC_Budget_Mode,
      TC_Media_Value: previousBudgetDataRef.current.TC_Media_Value,
      TC_BuyCurrency: previousBudgetDataRef.current.TC_BuyCurrency,
      TC_Unit_Type: previousBudgetDataRef.current.TC_Unit_Type,
      TC_Fee_1_Option: previousBudgetDataRef.current.TC_Fee_1_Option,
      TC_Fee_2_Option: previousBudgetDataRef.current.TC_Fee_2_Option,
      TC_Fee_3_Option: previousBudgetDataRef.current.TC_Fee_3_Option,
      TC_Fee_4_Option: previousBudgetDataRef.current.TC_Fee_4_Option,
      TC_Fee_5_Option: previousBudgetDataRef.current.TC_Fee_5_Option,
      TC_Fee_1_Volume: previousBudgetDataRef.current.TC_Fee_1_Volume,
      TC_Fee_2_Volume: previousBudgetDataRef.current.TC_Fee_2_Volume,
      TC_Fee_3_Volume: previousBudgetDataRef.current.TC_Fee_3_Volume,
      TC_Fee_4_Volume: previousBudgetDataRef.current.TC_Fee_4_Volume,
      TC_Fee_5_Volume: previousBudgetDataRef.current.TC_Fee_5_Volume,
    } : null;
    
    // Comparer les données pertinentes
    if (previousRelevantData && JSON.stringify(currentRelevantData) === JSON.stringify(previousRelevantData)) {
      return; // Pas de changement pertinent
    }
    
    calculateWithCorrectFees(budgetData);
  }, [
    budgetData.TC_BudgetInput,
    budgetData.TC_Unit_Price,
    budgetData.TC_Budget_Mode,
    budgetData.TC_Media_Value,
    budgetData.TC_BuyCurrency,
    budgetData.TC_Unit_Type,
    budgetData.TC_Fee_1_Option,
    budgetData.TC_Fee_2_Option,
    budgetData.TC_Fee_3_Option,
    budgetData.TC_Fee_4_Option,
    budgetData.TC_Fee_5_Option,
    budgetData.TC_Fee_1_Volume,
    budgetData.TC_Fee_2_Volume,
    budgetData.TC_Fee_3_Volume,
    budgetData.TC_Fee_4_Volume,
    budgetData.TC_Fee_5_Volume,
    autoCalculate,
    hasValidData,
    calculateWithCorrectFees
  ]);
  
  const updateField = useCallback((field: keyof BudgetData, value: any) => {
    setBudgetData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  const updateMultipleFields = useCallback((updates: Partial<BudgetData>) => {
    setBudgetData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
  const calculate = useCallback(() => {
    calculateWithCorrectFees(budgetData);
  }, [calculateWithCorrectFees, budgetData]);
  
  const reset = useCallback(() => {
    previousBudgetDataRef.current = null;
    setBudgetData(budgetService.createDefaultData(clientFees));
    setLastResult(null);
  }, [clientFees]);
  
  const toggleDebug = useCallback(() => {
    const newMode = !debugMode;
    setDebugMode(newMode);
  }, [debugMode]);
  
  const getDataForFirestore = useCallback(() => {
    return budgetData;
  }, [budgetData]);
  
  return {
    budgetData,
    isCalculating,
    lastResult,
    errors,
    hasValidData,
    debugMode,
    toggleDebug,
    updateField,
    updateMultipleFields,
    calculate,
    reset,
    getDataForFirestore
  };
}

/**
 * Hook utilitaire en lecture seule pour effectuer un calcul de budget.
 */
export function useBudgetCalculationsReadOnly(
  budgetData: BudgetData,
  clientFees: ClientFee[],
  campaignCurrency: string,
  exchangeRates: { [key: string]: number },
  unitTypeOptions: Array<{ id: string; SH_Display_Name_FR: string }>
) {
  return useCallback(() => {
    return budgetService.calculateComplete(
      budgetData,
      clientFees,
      exchangeRates,
      campaignCurrency,
      unitTypeOptions
    );
  }, [budgetData, clientFees, exchangeRates, campaignCurrency, unitTypeOptions]);
}