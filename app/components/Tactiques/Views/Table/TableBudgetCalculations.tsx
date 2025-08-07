// app/components/Tactiques/Views/Table/TableBudgetCalculations.tsx

/**
 * Helper unifié pour les calculs budgétaires dans la vue tableau
 * Version propre et réactive qui gère tous les calculs budget en temps réel
 */

// ==================== TYPES ====================

export interface BudgetRowData {
    // Champs de base
    TC_Budget_Mode?: 'media' | 'client';
    TC_BudgetInput?: number;
    TC_Unit_Type?: string;
    TC_Unit_Price?: number;
    TC_BuyCurrency?: string;
    TC_Media_Value?: number;
    
    // Champs calculés
    TC_Unit_Volume?: number;
    TC_Media_Budget?: number;
    TC_Client_Budget?: number;
    TC_Bonification?: number;
    TC_Total_Fees?: number;
    
    // Frais (jusqu'à 5)
    TC_Fee_1_Enabled?: boolean;
    TC_Fee_1_Option?: string;
    TC_Fee_1_Volume?: number;
    TC_Fee_1_Value?: number;
    TC_Fee_2_Enabled?: boolean;
    TC_Fee_2_Option?: string;
    TC_Fee_2_Volume?: number;
    TC_Fee_2_Value?: number;
    TC_Fee_3_Enabled?: boolean;
    TC_Fee_3_Option?: string;
    TC_Fee_3_Volume?: number;
    TC_Fee_3_Value?: number;
    TC_Fee_4_Enabled?: boolean;
    TC_Fee_4_Option?: string;
    TC_Fee_4_Volume?: number;
    TC_Fee_4_Value?: number;
    TC_Fee_5_Enabled?: boolean;
    TC_Fee_5_Option?: string;
    TC_Fee_5_Volume?: number;
    TC_Fee_5_Value?: number;
    
    [key: string]: any;
  }
  
  export interface ClientFee {
    id: string;
    FE_Name: string;
    FE_Calculation_Type: 'Pourcentage budget' | 'Volume d\'unité' | 'Unités' | 'Frais fixe';
    FE_Calculation_Mode: 'Directement sur le budget média' | 'Applicable sur les frais précédents';
    FE_Order: number;
    options: {
      id: string;
      FO_Option: string;
      FO_Value: number;
      FO_Buffer: number;
      FO_Editable: boolean;
    }[];
  }
  
  export interface BudgetCalculationResult {
    mediaBudget: number;
    clientBudget: number;
    totalFees: number;
    unitVolume: number;
    bonification: number;
    feeAmounts: { [key: string]: number }; // TC_Fee_X_Value
    hasConverged: boolean;
    iterations?: number;
  }
  
  // ==================== FONCTIONS UTILITAIRES ====================
  
  /**
   * Détermine si le type d'unité est un CPM (impressions)
   */
  function isImpressionUnitType(unitType?: string): boolean {
    if (!unitType) return false;
    const lowerType = unitType.toLowerCase();
    return lowerType.includes('impression') || lowerType.includes('cpm');
  }
  
  /**
   * Calcule le volume d'unités selon le type
   */
  function calculateUnitVolume(
    mediaBudget: number,
    bonification: number,
    unitPrice: number,
    unitType?: string
  ): number {
    if (unitPrice <= 0) return 0;
    
    const effectiveBudget = mediaBudget + bonification;
    
    if (isImpressionUnitType(unitType)) {
      // Pour CPM : (Budget + Bonification) / CPM * 1000
      return Math.round((effectiveBudget / unitPrice) * 1000);
    } else {
      // Pour autres unités : (Budget + Bonification) / Coût par unité
      return Math.round(effectiveBudget / unitPrice);
    }
  }
  
  /**
   * Calcule la bonification selon la logique métier
   */
  function calculateBonification(
    budgetChoice: string,
    budgetInput: number,
    mediaValue: number,
    calculatedMediaBudget?: number
  ): number {
    if (!mediaValue || mediaValue <= 0) return 0;
    
    if (budgetChoice === 'media') {
      // Mode budget média : bonification = valeur réelle - budget saisi
      return Math.max(0, mediaValue - budgetInput);
    } else {
      // Mode budget client : bonification = valeur réelle - budget média calculé
      const effectiveMediaBudget = calculatedMediaBudget || budgetInput;
      return Math.max(0, mediaValue - effectiveMediaBudget);
    }
  }
  
  // ==================== CALCUL DES FRAIS ====================
  

/**
 * CORRIGÉ : Calcule les montants des frais en utilisant l'index séquentiel comme le drawer
 * Les champs de données utilisent TC_Fee_1_, TC_Fee_2_, TC_Fee_3_... (index + 1)
 * Mais on trie par FE_Order pour l'ordre d'affichage et de calcul
 */
function calculateFeesAmounts(
  rowData: BudgetRowData,
  clientFees: ClientFee[],
  mediaBudget: number,
  unitVolume: number
): { totalFees: number; feeAmounts: { [key: string]: number } } {
  const feeAmounts: { [key: string]: number } = {};
  let totalFees = 0;
  
  // Trier les frais par ordre (pour l'affichage et calcul dans le bon ordre)
  const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
  
  let cumulativeBase = mediaBudget;
  
  sortedFees.forEach((fee, index) => {
    // CORRIGÉ : Utiliser l'index séquentiel pour les champs (comme le drawer)
    const sequentialNumber = index + 1; // 1, 2, 3... selon l'index dans sortedFees
    const isEnabled = rowData[`TC_Fee_${sequentialNumber}_Enabled`];
    const selectedOptionId = rowData[`TC_Fee_${sequentialNumber}_Option`];
    const customVolume = rowData[`TC_Fee_${sequentialNumber}_Volume`] || 0;
    const valueKey = `TC_Fee_${sequentialNumber}_Value`;
    
    console.log(`[DEBUG FRAIS] Fee ${fee.FE_Name} (FE_Order=${fee.FE_Order}) → TC_Fee_${sequentialNumber}`, {
      isEnabled, selectedOptionId, customVolume
    });
    
    if (!isEnabled || !selectedOptionId) {
      feeAmounts[valueKey] = 0;
      return;
    }
    
    const selectedOption = fee.options.find(opt => opt.id === selectedOptionId);
    if (!selectedOption) {
      feeAmounts[valueKey] = 0;
      return;
    }
    
    // Valeur de base avec personnalisation si éditable
    let baseValue = selectedOption.FO_Value;
    if (selectedOption.FO_Editable && customVolume > 0) {
      switch (fee.FE_Calculation_Type) {
        case 'Pourcentage budget':
          baseValue = customVolume / 100; // Convertir en décimal
          break;
        case 'Frais fixe':
          baseValue = customVolume;
          break;
        // Pour Volume d'unité et Unités, la valeur custom est utilisée différemment
      }
    }
    
    // Appliquer le buffer
    const bufferMultiplier = (100 + selectedOption.FO_Buffer) / 100;
    const finalValue = baseValue * bufferMultiplier;
    
    // Calculer le montant selon le type
    let calculatedAmount = 0;
    
    switch (fee.FE_Calculation_Type) {
      case 'Pourcentage budget':
        const baseForPercentage = fee.FE_Calculation_Mode === 'Directement sur le budget média' 
          ? mediaBudget 
          : cumulativeBase;
        calculatedAmount = finalValue * baseForPercentage;
        break;
        
      case 'Volume d\'unité':
        const volume = customVolume > 0 ? customVolume : unitVolume;
        calculatedAmount = finalValue * volume;
        break;
        
      case 'Unités':
        const units = customVolume > 0 ? customVolume : 1;
        calculatedAmount = finalValue * units;
        break;
        
      case 'Frais fixe':
        calculatedAmount = finalValue;
        break;
    }
    
    // Arrondir à 2 décimales
    calculatedAmount = Math.round(calculatedAmount * 100) / 100;
    
    feeAmounts[valueKey] = calculatedAmount;
    totalFees += calculatedAmount;
    
    // Mettre à jour la base cumulative
    if (fee.FE_Calculation_Mode === 'Applicable sur les frais précédents') {
      cumulativeBase += calculatedAmount;
    }
    
    console.log(`[BUDGET CALCUL] ${fee.FE_Name}: ${calculatedAmount.toFixed(2)} (sauvé dans ${valueKey})`);
  });
  
  return { totalFees, feeAmounts };
}
  
  // ==================== CALCUL PRINCIPAL ====================
  
  /**
   * Calcule tous les champs budget pour une ligne de tactique
   */
  export function calculateBudgetForRow(
    rowData: BudgetRowData,
    clientFees: ClientFee[]
  ): BudgetCalculationResult {
    const budgetChoice = rowData.TC_Budget_Mode || 'media';
    const budgetInput = rowData.TC_BudgetInput || 0;
    const unitPrice = rowData.TC_Unit_Price || 0;
    const unitType = rowData.TC_Unit_Type || '';
    const mediaValue = rowData.TC_Media_Value || 0;
    
    // Validation des entrées minimales
    if (budgetInput <= 0 || unitPrice <= 0) {
      return {
        mediaBudget: 0,
        clientBudget: 0,
        totalFees: 0,
        unitVolume: 0,
        bonification: 0,
        feeAmounts: {},
        hasConverged: true
      };
    }
    
    let mediaBudget: number;
    let clientBudget: number;
    let hasConverged = true;
    let iterations = 0;
    
    if (budgetChoice === 'media') {
      // Mode budget média : simple et direct
      mediaBudget = budgetInput;
      
      // Calculer la bonification
      const bonification = calculateBonification(budgetChoice, budgetInput, mediaValue, mediaBudget);
      
      // Calculer le volume d'unités
      const unitVolume = calculateUnitVolume(mediaBudget, bonification, unitPrice, unitType);
      
      // Calculer les frais
      const { totalFees, feeAmounts } = calculateFeesAmounts(rowData, clientFees, mediaBudget, unitVolume);
      
      // Budget client = budget média + frais
      clientBudget = mediaBudget + totalFees;
      
      return {
        mediaBudget,
        clientBudget,
        totalFees,
        unitVolume,
        bonification,
        feeAmounts,
        hasConverged: true
      };
      
    } else {
      // Mode budget client : nécessite convergence
      const targetClientBudget = budgetInput;
      const maxIterations = 10;
      const tolerance = 0.01;
      
      // Estimation initiale
      mediaBudget = targetClientBudget * 0.8;
      
      for (let i = 0; i < maxIterations; i++) {
        iterations = i + 1;
        
        // Calculer la bonification
        const bonification = calculateBonification(budgetChoice, budgetInput, mediaValue, mediaBudget);
        
        // Calculer le volume d'unités
        const unitVolume = calculateUnitVolume(mediaBudget, bonification, unitPrice, unitType);
        
        // Calculer les frais
        const { totalFees } = calculateFeesAmounts(rowData, clientFees, mediaBudget, unitVolume);
        
        // Calculer le budget client résultant
        const calculatedClientBudget = mediaBudget + totalFees;
        
        // Vérifier la convergence
        const difference = Math.abs(calculatedClientBudget - targetClientBudget);
        
        if (difference <= tolerance) {
          hasConverged = true;
          break;
        }
        
        // Ajuster le budget média
        const adjustment = (targetClientBudget - calculatedClientBudget) * 0.8;
        mediaBudget = Math.max(0, mediaBudget + adjustment);
      }
      
      // Calcul final
      const bonification = calculateBonification(budgetChoice, budgetInput, mediaValue, mediaBudget);
      const unitVolume = calculateUnitVolume(mediaBudget, bonification, unitPrice, unitType);
      const { totalFees, feeAmounts } = calculateFeesAmounts(rowData, clientFees, mediaBudget, unitVolume);
      clientBudget = mediaBudget + totalFees;
      
      return {
        mediaBudget,
        clientBudget,
        totalFees,
        unitVolume,
        bonification,
        feeAmounts,
        hasConverged,
        iterations
      };
    }
  }
  
  // ==================== FONCTIONS D'AIDE ====================
  
  /**
   * Détermine quels champs doivent être recalculés quand un champ change
   */
  export function getDependentFields(changedField: string): string[] {
    const allCalculatedFields = [
      'TC_Unit_Volume',
      'TC_Media_Budget',
      'TC_Client_Budget',
      'TC_Bonification',
      'TC_Total_Fees',
      'TC_Fee_1_Value',
      'TC_Fee_2_Value',
      'TC_Fee_3_Value',
      'TC_Fee_4_Value',
      'TC_Fee_5_Value'
    ];
  
    // Champs qui affectent tous les calculs
    const masterFields = [
      'TC_Budget_Mode',
      'TC_BudgetInput',
      'TC_Unit_Price',
      'TC_Unit_Type',
      'TC_Media_Value'
    ];
  
    if (masterFields.includes(changedField)) {
      return allCalculatedFields;
    }
  
    // Champs de frais qui affectent seulement les frais et budgets
    if (changedField.includes('_Fee_') && (changedField.includes('_Enabled') || changedField.includes('_Option') || changedField.includes('_Volume'))) {
      return [
        'TC_Total_Fees',
        'TC_Media_Budget',
        'TC_Client_Budget',
        'TC_Fee_1_Value',
        'TC_Fee_2_Value',
        'TC_Fee_3_Value',
        'TC_Fee_4_Value',
        'TC_Fee_5_Value'
      ];
    }
  
    return [];
  }
  
  /**
   * Vérifie si un champ doit déclencher un recalcul
   */
  export function shouldRecalculate(changedField: string): boolean {
    const triggerFields = [
      'TC_Budget_Mode',
      'TC_BudgetInput',
      'TC_Unit_Price',
      'TC_Unit_Type',
      'TC_Media_Value',
      'TC_Fee_1_Enabled', 'TC_Fee_1_Option', 'TC_Fee_1_Volume',
      'TC_Fee_2_Enabled', 'TC_Fee_2_Option', 'TC_Fee_2_Volume',
      'TC_Fee_3_Enabled', 'TC_Fee_3_Option', 'TC_Fee_3_Volume',
      'TC_Fee_4_Enabled', 'TC_Fee_4_Option', 'TC_Fee_4_Volume',
      'TC_Fee_5_Enabled', 'TC_Fee_5_Option', 'TC_Fee_5_Volume'
    ];
  
    return triggerFields.includes(changedField);
  }
  
  /**
   * Formate une valeur monétaire pour l'affichage
   */
  export function formatCurrency(value: number, currency: string = 'CAD'): string {
    if (isNaN(value)) return '';
    
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
  
  /**
   * Formate un nombre pour l'affichage
   */
  export function formatNumber(value: number): string {
    if (isNaN(value)) return '';
    
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }