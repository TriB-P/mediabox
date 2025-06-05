// app/hooks/useBudgetCalculations.ts - CORRECTION CALCUL POURCENTAGES

import { useState, useEffect, useCallback } from 'react';
import { budgetService, BudgetData, ClientFee, BudgetCalculationResult } from '../lib/budgetService';

// ==================== TYPES ====================

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

// ==================== FONCTION DE CALCUL DES FRAIS CORRIGÉE ====================

/**
 * Calcule correctement les frais en appliquant les bonnes formules selon le type
 */
function calculateFeesCorrectly(
  budgetData: BudgetData, 
  clientFees: ClientFee[]
): Partial<BudgetData> {
  console.log('🧮 Début calcul des frais corrigé avec logique séquentielle');
  
  const updates: any = {}; // Utiliser any pour les clés dynamiques
  const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
  
  // Budget média pour les calculs
  const mediaBudget = budgetData.TC_Media_Budget || 0;
  const unitVolume = budgetData.TC_Unit_Volume || 0;
  
  // 🔥 CORRECTION: Base de calcul cumulative pour TOUS les frais suivants
  let cumulativeBase = mediaBudget;
  
  console.log(`💰 Base initiale (budget média): ${mediaBudget.toFixed(2)}`);
  
  sortedFees.forEach((fee, orderIndex) => {
    const feeNumber = orderIndex + 1;
    const optionKey = `TC_Fee_${feeNumber}_Option`;
    const volumeKey = `TC_Fee_${feeNumber}_Volume`;
    const valueKey = `TC_Fee_${feeNumber}_Value`;
    
    const selectedOptionId = (budgetData as any)[optionKey] as string;
    const customVolume = (budgetData as any)[volumeKey] as number || 0;
    
    if (!selectedOptionId) {
      // Frais inactif
      updates[valueKey] = 0;
      console.log(`❌ Frais ${fee.FE_Name}: inactif`);
      return;
    }
    
    // Trouver l'option sélectionnée
    const selectedOption = fee.options?.find(opt => opt.id === selectedOptionId);

    
    if (!selectedOption) {
      updates[valueKey] = 0;
      console.log(`❌ Frais ${fee.FE_Name}: option non trouvée`);
      return;
    }
    
    // 🔥 CORRECTION: Logique pour valeur personnalisée vs valeur par défaut
    let baseValue = selectedOption.FO_Value;
    
    // Pour les champs éditables, utiliser la valeur personnalisée si fournie
    if (selectedOption.FO_Editable) {
      switch (fee.FE_Calculation_Type) {
        case 'Pourcentage budget':
          // Pour les pourcentages, customVolume contient la valeur décimale (ex: 0.15 pour 15%)
          if (customVolume !== undefined && customVolume !== null) {
            baseValue = customVolume;
            console.log(`✏️ Pourcentage personnalisé pour ${fee.FE_Name}: ${baseValue} (${(baseValue * 100).toFixed(2)}%)`);
          }
          break;
        case 'Frais fixe':
          // Pour les frais fixes, customVolume contient le montant direct
          if (customVolume !== undefined && customVolume !== null && customVolume >= 0) {
            baseValue = customVolume;
            console.log(`✏️ Montant fixe personnalisé pour ${fee.FE_Name}: ${baseValue}`);
          }
          break;
        case 'Volume d\'unité':
          // Pour Volume d'unité, la valeur de base reste la même (prix unitaire)
          // C'est le volume qui sera personnalisé plus tard dans le calcul
          console.log(`📦 Volume d'unité ${fee.FE_Name}: prix unitaire = ${baseValue}, volume sera déterminé après`);
          break;
        case 'Unités':
          // Pour Unités, la valeur de base reste la même (prix par unité)
          // C'est le nombre d'unités qui sera personnalisé plus tard dans le calcul
          console.log(`🔢 Unités ${fee.FE_Name}: prix par unité = ${baseValue}, nombre d'unités sera déterminé après`);
          break;
        default:
          console.log(`⚙️ Type non reconnu pour ${fee.FE_Name}, utilisation valeur par défaut`);
      }
    } else {
      console.log(`🔒 Valeur non éditable pour ${fee.FE_Name}: ${baseValue}`);
    }
    
    // Appliquer le buffer
    const bufferMultiplier = (100 + (selectedOption.FO_Buffer || 0)) / 100;
    const finalValue = baseValue * bufferMultiplier;
    
    console.log(`📊 ${fee.FE_Name}: base=${baseValue}, buffer=${selectedOption.FO_Buffer}%, final=${finalValue}`);
    
    // Calculer le montant selon le type
    let calculatedAmount = 0;
    
    switch (fee.FE_Calculation_Type) {
      case 'Pourcentage budget':
        // 🔥 CORRECTION: Base de calcul selon le mode ET l'ordre séquentiel
        let baseForPercentage: number;
        
        if (fee.FE_Calculation_Mode === 'Directement sur le budget média') {
          baseForPercentage = mediaBudget;
          console.log(`📊 ${fee.FE_Name}: Mode direct sur budget média`);
        } else {
          // 🔥 CORRECTION: Utiliser la base cumulative (budget + frais précédents)
          baseForPercentage = cumulativeBase;
          console.log(`📊 ${fee.FE_Name}: Mode cumulatif sur ${cumulativeBase.toFixed(2)}`);
        }
        
        calculatedAmount = finalValue * baseForPercentage;
        console.log(`💰 POURCENTAGE: ${finalValue} × ${baseForPercentage.toFixed(2)} = ${calculatedAmount.toFixed(2)}`);
        break;
        
      case 'Volume d\'unité':
        // 🔥 CORRECTION: Volume personnalisé pour Volume d'unité
        let effectiveVolume: number;
        
        // Pour les frais "Volume d'unité", customVolume contient le volume personnalisé si défini
        if (customVolume > 0) {
          // Volume personnalisé saisi par l'utilisateur
          effectiveVolume = customVolume;
          console.log(`📦 VOLUME PERSONNALISÉ: ${fee.FE_Name} utilise volume personnalisé = ${effectiveVolume}`);
        } else {
          // Volume de la tactique par défaut
          effectiveVolume = unitVolume;
          console.log(`📦 VOLUME TACTIQUE: ${fee.FE_Name} utilise volume tactique = ${effectiveVolume}`);
        }
        
        calculatedAmount = finalValue * effectiveVolume;
        
        if (effectiveVolume === 0) {
          console.log(`📦 VOLUME (ZÉRO): ${finalValue} × ${effectiveVolume} = ${calculatedAmount} - FRAIS ACTIVÉ MAIS EN ATTENTE DE VOLUME`);
        } else {
          console.log(`📦 VOLUME CALCUL: ${finalValue} × ${effectiveVolume} = ${calculatedAmount.toFixed(2)}`);
        }
        break;
        
        case 'Unités':
          // 🔥 CORRECTION: Pour les frais de type "Unités", le nombre d'unités 
          // est TOUJOURS modifiable, même si la valeur unitaire ne l'est pas
          let unitsCount: number;
          
          // Utiliser le nombre d'unités saisi par l'utilisateur
          if (customVolume > 0) {
            unitsCount = customVolume;
            console.log(`🔢 UNITÉS SAISIES: ${fee.FE_Name} utilise ${unitsCount} unités`);
          } else {
            // Nombre d'unités par défaut (1)
            unitsCount = 1;
            console.log(`🔢 UNITÉS PAR DÉFAUT: ${fee.FE_Name} utilise ${unitsCount} unité`);
          }
          
          calculatedAmount = finalValue * unitsCount;
          console.log(`🔢 UNITÉS CALCUL: ${finalValue} × ${unitsCount} = ${calculatedAmount}`);
          break;
        
      case 'Frais fixe':
        calculatedAmount = finalValue;
        console.log(`💵 FIXE: ${calculatedAmount}`);
        break;
        
      default:
        console.warn(`⚠️ Type de frais non reconnu: ${fee.FE_Calculation_Type}`);
        calculatedAmount = 0;
    }
    
    // Stocker le résultat
    updates[valueKey] = calculatedAmount;
    
    // 🔥 CORRECTION: TOUS les frais s'ajoutent à la base cumulative pour les suivants
    if (calculatedAmount > 0) {
      cumulativeBase += calculatedAmount;
      console.log(`📈 Base cumulative mise à jour: ${mediaBudget.toFixed(2)} → ${cumulativeBase.toFixed(2)} (+${calculatedAmount.toFixed(2)} de ${fee.FE_Name})`);
    }
    
    console.log(`✅ ${fee.FE_Name}: ${calculatedAmount.toFixed(2)} (mode: ${fee.FE_Calculation_Mode})`);
  });
  
  // Calculer le total des frais (pour référence dans les logs)
  let totalFees = 0;
  for (let i = 1; i <= 5; i++) {
    const valueKey = `TC_Fee_${i}_Value`;
    totalFees += updates[valueKey] || 0;
  }
  
  console.log(`💼 Total des frais calculé: ${totalFees.toFixed(2)}`);
  console.log(`🏁 Base cumulative finale: ${cumulativeBase.toFixed(2)}`);
  
  return updates as Partial<BudgetData>;
}

// ==================== HOOK PRINCIPAL ====================

export function useBudgetCalculations({
  initialData,
  clientFees,
  campaignCurrency,
  exchangeRates,
  unitTypeOptions,
  autoCalculate = true
}: UseBudgetCalculationsProps): UseBudgetCalculationsReturn {
  
  // ==================== ÉTATS ====================
  
  const [budgetData, setBudgetData] = useState<BudgetData>(() => {
    console.log('🏗️ Initialisation du hook budget');
    if (initialData && clientFees.length > 0) {
      return budgetService.loadFromFirestore(initialData, clientFees);
    } else {
      return budgetService.createDefaultData(clientFees);
    }
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastResult, setLastResult] = useState<BudgetCalculationResult | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // ==================== DONNÉES CALCULÉES ====================
  
  const hasValidData = budgetData.TC_BudgetInput > 0 && budgetData.TC_Unit_Price > 0;
  const errors = lastResult?.error ? [lastResult.error] : [];
  
  // ==================== EFFECTS ====================
  
  useEffect(() => {
    budgetService.setDebugMode(debugMode);
  }, [debugMode]);
  
  // Auto-calcul avec recalcul des frais corrigé
  useEffect(() => {
    if (autoCalculate && hasValidData && !isCalculating) {
      console.log('🤖 Auto-calcul déclenché avec correction des frais');
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
    // Inclure les volumes pour détecter les changements de valeurs personnalisées
    budgetData.TC_Fee_1_Volume,
    budgetData.TC_Fee_2_Volume,
    budgetData.TC_Fee_3_Volume,
    budgetData.TC_Fee_4_Volume,
    budgetData.TC_Fee_5_Volume,
    autoCalculate,
    hasValidData,
    isCalculating
  ]);
  
  // ==================== ACTIONS ====================
  
  const updateField = useCallback((field: keyof BudgetData, value: any) => {
    console.log(`🔄 Mise à jour ${field}:`, value);
    setBudgetData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  const updateMultipleFields = useCallback((updates: Partial<BudgetData>) => {
    console.log('🔄 Mise à jour multiple:', updates);
    setBudgetData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
  /**
   * 🔥 NOUVEAU: Calcul avec correction des frais
   */
  const calculateWithCorrectFees = useCallback(() => {
    if (!hasValidData) {
      console.log('⚠️ Données insuffisantes pour le calcul');
      return;
    }
    
    console.log('🧮 Début calcul avec correction des frais');
    setIsCalculating(true);
    
    try {
      // 1. Faire le calcul principal (budget, volume, etc.)
      const result = budgetService.calculateComplete(
        budgetData,
        clientFees,
        exchangeRates,
        campaignCurrency,
        unitTypeOptions
      );
      
      setLastResult(result);
      
      if (result.success && result.data) {
        console.log('✅ Calcul principal réussi');
        
        // 2. Recalculer les frais ET la bonification avec notre logique corrigée
        const correctedFeesAndBonus = calculateFeesCorrectly(result.data.updatedData, clientFees);
        
        // 3. Fusionner les résultats
        const finalData = {
          ...result.data.updatedData,
          ...correctedFeesAndBonus
        };
        
        console.log('🎯 Données finales avec frais et bonification corrigés:', finalData);
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
  
  const calculate = useCallback(() => {
    calculateWithCorrectFees();
  }, [calculateWithCorrectFees]);
  
  const reset = useCallback(() => {
    console.log('🔄 Reset des données budget');
    setBudgetData(budgetService.createDefaultData(clientFees));
    setLastResult(null);
  }, [clientFees]);
  
  const toggleDebug = useCallback(() => {
    const newMode = !debugMode;
    console.log(`🐛 Toggle debug: ${newMode}`);
    setDebugMode(newMode);
  }, [debugMode]);
  
  const getDataForFirestore = useCallback(() => {
    return budgetData;
  }, [budgetData]);
  
  // ==================== RETURN ====================
  
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

// ==================== UTILITAIRES ====================

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