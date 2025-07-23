/**
 * Ce hook gère les calculs complexes liés au budget d'une campagne, y compris
 * le budget média, les volumes d'unités, et surtout, le calcul des frais clients.
 * Il assure une gestion cohérente des données budgétaires, des erreurs et
 * permet de déclencher des recalculs. Il intègre une logique spécifique pour
 * le calcul séquentiel et cumulatif des frais.
 */
import { useState, useEffect, useCallback } from 'react';
import { budgetService, BudgetData, ClientFee, BudgetCalculationResult } from '../lib/budgetService';

interface UseBudgetCalculationsProps {
  initialData?: any;
  clientFees: ClientFee[];
  campaignCurrency: string;
  exchangeRates: { [key: string]: number };
  unitTypeOptions: Array<{ id: string; SH_Display_Name_FR: string }>;
  autoCalculate?: boolean;
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
 * Calcule correctement les frais en appliquant les bonnes formules selon le type de frais
 * et la logique séquentielle/cumulative.
 * @param {BudgetData} budgetData Les données actuelles du budget.
 * @param {ClientFee[]} clientFees La liste des frais clients avec leurs options.
 * @returns {Partial<BudgetData>} Un objet contenant les montants de frais calculés à mettre à jour dans `BudgetData`.
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
        
        calculatedAmount = finalValue * effectiveVolume;
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
 * Hook personnalisé pour gérer toutes les logiques de calcul et d'état
 * liées aux budgets de campagne.
 * @param {UseBudgetCalculationsProps} props Les propriétés pour l'initialisation du hook.
 * @param {any} props.initialData Les données initiales du budget, souvent chargées depuis Firestore.
 * @param {ClientFee[]} props.clientFees La liste des frais clients applicables.
 * @param {string} props.campaignCurrency La devise de la campagne.
 * @param {{[key: string]: number}} props.exchangeRates Les taux de change.
 * @param {Array<{id: string; SH_Display_Name_FR: string}>} props.unitTypeOptions Les options de type d'unité.
 * @param {boolean} [props.autoCalculate=true] Indique si le calcul doit être déclenché automatiquement lors des changements de données.
 * @returns {UseBudgetCalculationsReturn} Un objet contenant les données du budget, l'état de calcul, les erreurs, et les fonctions de manipulation.
 */
export function useBudgetCalculations({
  initialData,
  clientFees,
  campaignCurrency,
  exchangeRates,
  unitTypeOptions,
  autoCalculate = true
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
  
  const hasValidData = budgetData.TC_BudgetInput > 0 && budgetData.TC_Unit_Price > 0;
  const errors = lastResult?.error ? [lastResult.error] : [];
  
  /**
   * Effet pour synchroniser le mode debug du service de budget avec l'état du hook.
   */
  useEffect(() => {
    budgetService.setDebugMode(debugMode);
  }, [debugMode]);
  
  /**
   * Effet pour déclencher un auto-calcul lorsque les données pertinentes du budget changent,
   * à condition que `autoCalculate` soit activé et que les données soient valides.
   */
  useEffect(() => {
    if (autoCalculate && hasValidData && !isCalculating) {
      calculateWithCorrectFees();
    }
  }, [
    budgetData.TC_BudgetInput, 
    budgetData.TC_Unit_Price, 
    budgetData.TC_BudgetChoice,
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
    isCalculating
  ]);
  
  /**
   * Met à jour un champ spécifique des données du budget.
   * @param {keyof BudgetData} field Le nom du champ à mettre à jour.
   * @param {any} value La nouvelle valeur du champ.
   */
  const updateField = useCallback((field: keyof BudgetData, value: any) => {
    setBudgetData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  /**
   * Met à jour plusieurs champs des données du budget simultanément.
   * @param {Partial<BudgetData>} updates Un objet contenant les champs à mettre à jour.
   */
  const updateMultipleFields = useCallback((updates: Partial<BudgetData>) => {
    setBudgetData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
  /**
   * Exécute le calcul complet du budget, en incluant la correction des frais.
   * Met à jour l'état `budgetData` avec les résultats.
   */
  const calculateWithCorrectFees = useCallback(() => {
    if (!hasValidData) {
      return;
    }
    
    setIsCalculating(true);
    
    try {
      const result = budgetService.calculateComplete(
        budgetData,
        clientFees,
        exchangeRates,
        campaignCurrency,
        unitTypeOptions
      );
      
      setLastResult(result);
      
      if (result.success && result.data) {
        const correctedFeesAndBonus = calculateFeesCorrectly(result.data.updatedData, clientFees);
        
        const finalData = {
          ...result.data.updatedData,
          ...correctedFeesAndBonus
        };
        
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
      setIsCalculating(false);
    }
  }, [budgetData, clientFees, exchangeRates, campaignCurrency, unitTypeOptions, hasValidData]);
  
  /**
   * Fonction pour déclencher un calcul manuel du budget.
   */
  const calculate = useCallback(() => {
    calculateWithCorrectFees();
  }, [calculateWithCorrectFees]);
  
  /**
   * Réinitialise les données du budget à leur état par défaut.
   */
  const reset = useCallback(() => {
    setBudgetData(budgetService.createDefaultData(clientFees));
    setLastResult(null);
  }, [clientFees]);
  
  /**
   * Bascule le mode de débogage du service de budget.
   */
  const toggleDebug = useCallback(() => {
    const newMode = !debugMode;
    setDebugMode(newMode);
  }, [debugMode]);
  
  /**
   * Retourne les données actuelles du budget formatées pour être enregistrées dans Firestore.
   * @returns {BudgetData} Les données du budget.
   */
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
 * Il ne gère pas l'état interne et est destiné à des calculs ponctuels.
 * @param {BudgetData} budgetData Les données du budget à utiliser pour le calcul.
 * @param {ClientFee[]} clientFees La liste des frais clients.
 * @param {string} campaignCurrency La devise de la campagne.
 * @param {{[key: string]: number}} exchangeRates Les taux de change.
 * @param {Array<{id: string; SH_Display_Name_FR: string}>} unitTypeOptions Les options de type d'unité.
 * @returns {() => BudgetCalculationResult} Une fonction qui, lorsqu'elle est appelée, exécute le calcul complet et retourne le résultat.
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