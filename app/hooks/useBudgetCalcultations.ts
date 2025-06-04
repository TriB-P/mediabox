// app/hooks/useBudgetCalculations.ts

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  budgetService, 
  BudgetUIData, 
  BudgetFeeUI, 
  ClientFee, 
  BudgetDebugInfo,
  BudgetCalculationResult
} from '../lib/budgetService';

// ==================== TYPES ====================

interface UseBudgetCalculationsProps {
  initialData?: any; // Données depuis Firestore/formulaire
  clientFees: ClientFee[];
  campaignCurrency: string;
  exchangeRates: { [key: string]: number };
  unitTypeOptions: Array<{ id: string; SH_Display_Name_FR: string }>;
  autoCalculate?: boolean; // Auto-calcul quand les données changent (défaut: true)
}

interface UseBudgetCalculationsReturn {
  // État du budget
  budgetData: BudgetUIData;
  isCalculating: boolean;
  lastCalculationResult: BudgetCalculationResult | null;
  
  // Erreurs et validation
  errors: string[];
  warnings: string[];
  hasValidData: boolean;
  
  // Debug
  debugMode: boolean;
  debugInfo: BudgetDebugInfo;
  
  // Actions principales
  updateBudgetInput: (value: number) => void;
  updateBudgetChoice: (choice: 'media' | 'client') => void;
  updateUnitPrice: (price: number) => void;
  updateMediaValue: (value: number) => void;
  updateCurrency: (currency: string) => void;
  updateUnitType: (unitType: string) => void;
  
  // Actions frais
  updateFee: (feeId: string, updates: Partial<BudgetFeeUI>) => void;
  toggleFee: (feeId: string, isActive: boolean) => void;
  setFeeOption: (feeId: string, optionId: string) => void;
  setFeeVolume: (feeId: string, volume: number) => void;
  
  // Calculs
  calculate: () => Promise<boolean>;
  recalculateIfNeeded: () => void;
  
  // Debug
  toggleDebug: () => void;
  
  // Export/Import
  exportToFirestore: () => any;
  importFromFirestore: (data: any) => void;
  
  // Reset
  reset: () => void;
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
  
  const [budgetData, setBudgetData] = useState<BudgetUIData>(() => {
    if (initialData && clientFees.length > 0) {
      console.log('🏗️ Initialisation du budget depuis les données existantes');
      return budgetService.firestoreToUI(initialData, clientFees);
    } else {
      console.log('✨ Création de données budget par défaut');
      return budgetService.createDefaultUIData(clientFees);
    }
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculationResult, setLastCalculationResult] = useState<BudgetCalculationResult | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [needsRecalculation, setNeedsRecalculation] = useState(false);
  
  // ==================== DONNÉES MEMOIZED ====================
  
  // Validation des données
  const hasValidData = useMemo(() => {
    return budgetData.budgetInput > 0 && budgetData.unitPrice > 0;
  }, [budgetData.budgetInput, budgetData.unitPrice]);
  
  // Erreurs et warnings depuis le dernier calcul
  const errors = useMemo(() => {
    return lastCalculationResult?.error ? [lastCalculationResult.error] : budgetService.getDebugInfo().errors;
  }, [lastCalculationResult]);
  
  const warnings = useMemo(() => {
    return budgetService.getDebugInfo().warnings;
  }, [debugMode]); // Re-calculer quand debug change pour avoir les infos fraîches
  
  // Debug info
  const debugInfo = useMemo(() => {
    return budgetService.getDebugInfo();
  }, [debugMode, lastCalculationResult]);
  
  // ==================== EFFECTS ====================
  
  // Synchroniser le debug mode avec le service
  useEffect(() => {
    budgetService.setDebugMode(debugMode);
  }, [debugMode]);
  
  // Re-initialiser quand les frais changent
  useEffect(() => {
    if (clientFees.length > 0 && budgetData.fees.length === 0) {
      console.log('🔄 Re-initialisation suite au changement des frais client');
      setBudgetData(prev => ({
        ...prev,
        fees: budgetService.createDefaultUIData(clientFees).fees
      }));
    }
  }, [clientFees.length]);
  
  // Auto-calcul si activé et données valides
  useEffect(() => {
    if (autoCalculate && hasValidData && needsRecalculation) {
      console.log('🤖 Auto-calcul déclenché');
      calculate();
      setNeedsRecalculation(false);
    }
  }, [needsRecalculation, hasValidData, autoCalculate]);
  
  // ==================== ACTIONS BUDGET ====================
  
  const updateBudgetInput = useCallback((value: number) => {
    console.log(`💰 Update budget input: ${value}`);
    setBudgetData(prev => ({ ...prev, budgetInput: value }));
    setNeedsRecalculation(true);
  }, []);
  
  const updateBudgetChoice = useCallback((choice: 'media' | 'client') => {
    console.log(`🎯 Update budget choice: ${choice}`);
    setBudgetData(prev => ({ ...prev, budgetChoice: choice }));
    setNeedsRecalculation(true);
  }, []);
  
  const updateUnitPrice = useCallback((price: number) => {
    console.log(`💲 Update unit price: ${price}`);
    setBudgetData(prev => ({ ...prev, unitPrice: price }));
    setNeedsRecalculation(true);
  }, []);
  
  const updateMediaValue = useCallback((value: number) => {
    console.log(`📈 Update media value: ${value}`);
    setBudgetData(prev => ({ ...prev, mediaValue: value }));
    setNeedsRecalculation(true);
  }, []);
  
  const updateCurrency = useCallback((currency: string) => {
    console.log(`💱 Update currency: ${currency}`);
    setBudgetData(prev => ({ ...prev, buyCurrency: currency }));
    setNeedsRecalculation(true);
  }, []);
  
  const updateUnitType = useCallback((unitType: string) => {
    console.log(`📊 Update unit type: ${unitType}`);
    setBudgetData(prev => ({ ...prev, unitType }));
    setNeedsRecalculation(true);
  }, []);
  
  // ==================== ACTIONS FRAIS ====================
  
  const updateFee = useCallback((feeId: string, updates: Partial<BudgetFeeUI>) => {
    console.log(`🔧 Update fee ${feeId}:`, updates);
    const updatedData = budgetService.updateFee(budgetData, feeId, updates);
    setBudgetData(updatedData);
    setNeedsRecalculation(true);
  }, [budgetData]);
  
  const toggleFee = useCallback((feeId: string, isActive: boolean) => {
    console.log(`🔀 Toggle fee ${feeId}: ${isActive}`);
    updateFee(feeId, { 
      isActive,
      // Reset des valeurs si désactivé
      selectedOptionId: isActive ? undefined : '',
      volumeValue: isActive ? undefined : 0,
      calculatedValue: isActive ? undefined : 0
    });
  }, [updateFee]);
  
  const setFeeOption = useCallback((feeId: string, optionId: string) => {
    console.log(`⚙️ Set fee option ${feeId}: ${optionId}`);
    updateFee(feeId, { 
      selectedOptionId: optionId,
      isActive: !!optionId
    });
  }, [updateFee]);
  
  const setFeeVolume = useCallback((feeId: string, volume: number) => {
    console.log(`📊 Set fee volume ${feeId}: ${volume}`);
    
    // Déterminer le type de volume selon le type de frais
    const fee = budgetData.fees.find(f => f.feeId === feeId);
    if (!fee) return;
    
    const updates: Partial<BudgetFeeUI> = { volumeValue: volume };
    
    switch (fee.feeType) {
      case 'Unités':
        updates.customUnits = volume;
        break;
      case 'Volume d\'unité':
        updates.useCustomVolume = volume > 0;
        updates.customVolume = volume;
        break;
      case 'Pourcentage budget':
        updates.customValue = volume;
        break;
    }
    
    updateFee(feeId, updates);
  }, [budgetData.fees, updateFee]);
  
  // ==================== CALCULS ====================
  
  const calculate = useCallback(async (): Promise<boolean> => {
    console.log('🧮 Début des calculs budget');
    setIsCalculating(true);
    
    try {
      const result = budgetService.calculateBudgetComplete(
        budgetData,
        clientFees,
        exchangeRates,
        campaignCurrency,
        unitTypeOptions
      );
      
      setLastCalculationResult(result);
      
      if (result.success && result.data) {
        console.log('✅ Calculs réussis, mise à jour des données');
        setBudgetData(result.data.updatedUIData);
        return true;
      } else {
        console.error('❌ Calculs échoués:', result.error);
        return false;
      }
      
    } catch (error) {
      console.error('💥 Erreur lors des calculs:', error);
      setLastCalculationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      return false;
      
    } finally {
      setIsCalculating(false);
    }
  }, [budgetData, clientFees, exchangeRates, campaignCurrency, unitTypeOptions]);
  
  const recalculateIfNeeded = useCallback(() => {
    if (hasValidData && !isCalculating) {
      console.log('🔄 Recalcul forcé');
      calculate();
    }
  }, [hasValidData, isCalculating, calculate]);
  
  // ==================== DEBUG ====================
  
  const toggleDebug = useCallback(() => {
    const newMode = !debugMode;
    console.log(`🐛 Toggle debug mode: ${newMode}`);
    setDebugMode(newMode);
  }, [debugMode]);
  
  // ==================== EXPORT/IMPORT ====================
  
  const exportToFirestore = useCallback(() => {
    console.log('📤 Export vers Firestore');
    return budgetService.uiToFirestore(budgetData);
  }, [budgetData]);
  
  const importFromFirestore = useCallback((data: any) => {
    console.log('📥 Import depuis Firestore', data);
    if (clientFees.length > 0) {
      const importedData = budgetService.firestoreToUI(data, clientFees);
      setBudgetData(importedData);
      setNeedsRecalculation(true);
    }
  }, [clientFees]);
  
  // ==================== RESET ====================
  
  const reset = useCallback(() => {
    console.log('🔄 Reset des données budget');
    setBudgetData(budgetService.createDefaultUIData(clientFees));
    setLastCalculationResult(null);
    setNeedsRecalculation(false);
  }, [clientFees]);
  
  // ==================== RETURN ====================
  
  return {
    // État
    budgetData,
    isCalculating,
    lastCalculationResult,
    
    // Validation
    errors,
    warnings,
    hasValidData,
    
    // Debug
    debugMode,
    debugInfo,
    
    // Actions budget
    updateBudgetInput,
    updateBudgetChoice,
    updateUnitPrice,
    updateMediaValue,
    updateCurrency,
    updateUnitType,
    
    // Actions frais
    updateFee,
    toggleFee,
    setFeeOption,
    setFeeVolume,
    
    // Calculs
    calculate,
    recalculateIfNeeded,
    
    // Debug
    toggleDebug,
    
    // Export/Import
    exportToFirestore,
    importFromFirestore,
    
    // Reset
    reset
  };
}

// ==================== UTILITAIRES ====================

/**
 * Hook simplifié pour juste les calculs (sans gestion d'état)
 */
export function useBudgetCalculationsSimple(
  budgetData: BudgetUIData,
  clientFees: ClientFee[],
  campaignCurrency: string,
  exchangeRates: { [key: string]: number },
  unitTypeOptions: Array<{ id: string; SH_Display_Name_FR: string }>
) {
  return useCallback(() => {
    return budgetService.calculateBudgetComplete(
      budgetData,
      clientFees,
      exchangeRates,
      campaignCurrency,
      unitTypeOptions
    );
  }, [budgetData, clientFees, exchangeRates, campaignCurrency, unitTypeOptions]);
}