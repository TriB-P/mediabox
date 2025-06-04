// app/hooks/useBudgetCalculations.ts - VERSION REFAITE DE ZÉRO

import { useState, useEffect, useCallback } from 'react';
import { budgetService, BudgetData, ClientFee, BudgetCalculationResult } from '../lib/budgetService';

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
  // État principal
  budgetData: BudgetData;
  isCalculating: boolean;
  lastResult: BudgetCalculationResult | null;
  
  // Erreurs
  errors: string[];
  hasValidData: boolean;
  
  // Debug
  debugMode: boolean;
  toggleDebug: () => void;
  
  // Actions principales
  updateField: (field: keyof BudgetData, value: any) => void;
  updateMultipleFields: (updates: Partial<BudgetData>) => void;
  calculate: () => void;
  reset: () => void;
  
  // Export pour sauvegarde
  getDataForFirestore: () => BudgetData;
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
  
  // État principal : les données budget (format Firestore)
  const [budgetData, setBudgetData] = useState<BudgetData>(() => {
    console.log('🏗️ Initialisation du hook budget');
    if (initialData && clientFees.length > 0) {
      return budgetService.loadFromFirestore(initialData, clientFees);
    } else {
      return budgetService.createDefaultData(clientFees);
    }
  });
  
  // États secondaires
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastResult, setLastResult] = useState<BudgetCalculationResult | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // ==================== DONNÉES CALCULÉES ====================
  
  // Validation des données
  const hasValidData = budgetData.TC_BudgetInput > 0 && budgetData.TC_Unit_Price > 0;
  
  // Erreurs depuis le dernier calcul
  const errors = lastResult?.error ? [lastResult.error] : [];
  
  // ==================== EFFECTS ====================
  
  // Synchroniser le debug mode avec le service
  useEffect(() => {
    budgetService.setDebugMode(debugMode);
  }, [debugMode]);
  
  // Auto-calcul si activé et données valides
  useEffect(() => {
    if (autoCalculate && hasValidData && !isCalculating) {
      console.log('🤖 Auto-calcul déclenché');
      calculate();
    }
  }, [
    budgetData.TC_BudgetInput, 
    budgetData.TC_Unit_Price, 
    budgetData.TC_BudgetChoice,
    budgetData.TC_Media_Value,
    budgetData.TC_BuyCurrency,
    budgetData.TC_Unit_Type,
    // Frais actifs
    budgetData.TC_Fee_1_Option,
    budgetData.TC_Fee_2_Option,
    budgetData.TC_Fee_3_Option,
    budgetData.TC_Fee_4_Option,
    budgetData.TC_Fee_5_Option,
    autoCalculate,
    hasValidData,
    isCalculating
  ]);
  
  // ==================== ACTIONS ====================
  
  /**
   * Met à jour un seul champ
   */
  const updateField = useCallback((field: keyof BudgetData, value: any) => {
    console.log(`🔄 Mise à jour ${field}:`, value);
    setBudgetData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  /**
   * Met à jour plusieurs champs en une fois
   */
  const updateMultipleFields = useCallback((updates: Partial<BudgetData>) => {
    console.log('🔄 Mise à jour multiple:', updates);
    setBudgetData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
  /**
   * Lance le calcul manuel
   */
  const calculate = useCallback(() => {
    if (!hasValidData) {
      console.log('⚠️ Données insuffisantes pour le calcul');
      return;
    }
    
    console.log('🧮 Début calcul manuel');
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
        console.log('✅ Calcul réussi');
        setBudgetData(result.data.updatedData);
      } else {
        console.error('❌ Calcul échoué:', result.error);
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
   * Remet tout à zéro
   */
  const reset = useCallback(() => {
    console.log('🔄 Reset des données budget');
    setBudgetData(budgetService.createDefaultData(clientFees));
    setLastResult(null);
  }, [clientFees]);
  
  /**
   * Toggle debug mode
   */
  const toggleDebug = useCallback(() => {
    const newMode = !debugMode;
    console.log(`🐛 Toggle debug: ${newMode}`);
    setDebugMode(newMode);
  }, [debugMode]);
  
  /**
   * Récupère les données pour la sauvegarde Firestore
   */
  const getDataForFirestore = useCallback(() => {
    // Les données sont déjà au format Firestore !
    return budgetData;
  }, [budgetData]);
  
  // ==================== RETURN ====================
  
  return {
    // État principal
    budgetData,
    isCalculating,
    lastResult,
    
    // Validation
    errors,
    hasValidData,
    
    // Debug
    debugMode,
    toggleDebug,
    
    // Actions
    updateField,
    updateMultipleFields,
    calculate,
    reset,
    
    // Export
    getDataForFirestore
  };
}

// ==================== UTILITAIRES ====================

/**
 * Hook simplifié pour juste lire les données sans gestion d'état
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