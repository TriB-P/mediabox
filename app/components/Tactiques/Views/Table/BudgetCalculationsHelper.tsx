// app/components/Tactiques/Views/Table/BudgetCalculationsHelper.tsx

/**
 * Logique de calculs budgétaires pour la vue tableau
 * Adapte la logique complexe de useBudgetCalculations pour le contexte tableau
 */

interface BudgetData {
    // Paramètres de base
    TC_BudgetChoice?: 'client' | 'media';
    TC_BudgetInput?: number;
    TC_BuyCurrency?: string;
    TC_Unit_Type?: string;
    TC_Unit_Price?: number;
    
    // Bonification
    TC_Has_Bonus?: boolean | string;
    TC_Media_Value?: number;
    
    // Frais (jusqu'à 5)
    TC_Fee_1_Option?: string;
    TC_Fee_1_Volume?: number;
    TC_Fee_2_Option?: string;
    TC_Fee_2_Volume?: number;
    TC_Fee_3_Option?: string;
    TC_Fee_3_Volume?: number;
    TC_Fee_4_Option?: string;
    TC_Fee_4_Volume?: number;
    TC_Fee_5_Option?: string;
    TC_Fee_5_Volume?: number;
    
    // Taux de change
    TC_Currency_Rate?: number;
    
    // Autres champs existants
    [key: string]: any;
  }
  
  interface ClientFee {
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
  
  interface CalculationResults {
    TC_Unit_Volume: number;
    TC_Media_Budget: number;
    TC_Client_Budget: number;
    TC_Bonification: number;
    TC_Fee_1_Value: number;
    TC_Fee_2_Value: number;
    TC_Fee_3_Value: number;
    TC_Fee_4_Value: number;
    TC_Fee_5_Value: number;
    TC_Total_Fees: number;
  }
  
  /**
   * Fonction principale de calcul budgétaire pour le tableau
   * Reproduit la logique essentielle de useBudgetCalculations
   */
  export function calculateBudgetValues(
    data: BudgetData,
    clientFees: ClientFee[] = [],
    exchangeRates: { [key: string]: number } = {},
    campaignCurrency: string = 'CAD'
  ): CalculationResults {
    
    const budgetChoice = data.TC_BudgetChoice || 'media';
    const budgetInput = data.TC_BudgetInput || 0;
    const unitPrice = data.TC_Unit_Price || 0;
    const currency = data.TC_BuyCurrency || 'CAD';
    const unitType = data.TC_Unit_Type || '';
    const hasBonus = data.TC_Has_Bonus === true || data.TC_Has_Bonus === 'true';
    const mediaValue = data.TC_Media_Value || 0;
    const exchangeRate = data.TC_Currency_Rate || exchangeRates[currency] || 1;
  
    // === ÉTAPE 1: Calculer les frais ===
    const feeResults = calculateClientFees(data, clientFees);
    const totalFees = feeResults.reduce((sum, fee) => sum + fee.calculatedAmount, 0);
  
    // === ÉTAPE 2: Calculer budget média vs client ===
    let mediaBudget: number;
    let clientBudget: number;
  
    if (budgetChoice === 'client') {
      // Budget client saisi → déduire frais pour obtenir budget média
      clientBudget = budgetInput;
      mediaBudget = Math.max(0, budgetInput - totalFees);
    } else {
      // Budget média saisi → ajouter frais pour obtenir budget client
      mediaBudget = budgetInput;
      clientBudget = budgetInput + totalFees;
    }
  
    // === ÉTAPE 3: Calculer le volume d'unités ===
    let unitVolume = 0;
    if (unitPrice > 0) {
      const effectiveBudget = mediaBudget + (hasBonus ? (mediaValue - mediaBudget) : 0);
      
      if (unitType.toLowerCase().includes('impression')) {
        // Pour CPM : (Budget + Bonification) / CPM * 1000
        unitVolume = (effectiveBudget / unitPrice) * 1000;
      } else {
        // Pour autres unités : (Budget + Bonification) / Coût par unité
        unitVolume = effectiveBudget / unitPrice;
      }
    }
  
    // === ÉTAPE 4: Calculer la bonification ===
    let bonification = 0;
    if (hasBonus && mediaValue > mediaBudget) {
      bonification = mediaValue - mediaBudget;
    }
  
    // === ÉTAPE 5: Retourner les résultats ===
    return {
      TC_Unit_Volume: Math.round(unitVolume),
      TC_Media_Budget: mediaBudget,
      TC_Client_Budget: clientBudget,
      TC_Bonification: bonification,
      TC_Fee_1_Value: feeResults[0]?.calculatedAmount || 0,
      TC_Fee_2_Value: feeResults[1]?.calculatedAmount || 0,
      TC_Fee_3_Value: feeResults[2]?.calculatedAmount || 0,
      TC_Fee_4_Value: feeResults[3]?.calculatedAmount || 0,
      TC_Fee_5_Value: feeResults[4]?.calculatedAmount || 0,
      TC_Total_Fees: totalFees
    };
  }
  
  /**
   * Calcule les frais clients selon leur configuration
   */
  function calculateClientFees(
    data: BudgetData,
    clientFees: ClientFee[]
  ): { feeId: string; calculatedAmount: number }[] {
    const results: { feeId: string; calculatedAmount: number }[] = [];
    
    // Trier les frais par ordre
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    
    let cumulativeBase = data.TC_BudgetInput || 0; // Base pour frais en cascade
    
    for (let i = 0; i < 5; i++) {
      const feeNumber = i + 1;
      const optionKey = `TC_Fee_${feeNumber}_Option`;
      const volumeKey = `TC_Fee_${feeNumber}_Volume`;
      
      const selectedOptionId = data[optionKey] as string;
      const customVolume = data[volumeKey] as number || 0;
      
      let calculatedAmount = 0;
      
      if (selectedOptionId && selectedOptionId !== '') {
        const fee = sortedFees.find(f => f.id === selectedOptionId);
        const option = fee?.options?.find(opt => opt.id === selectedOptionId);
        
        if (fee && option) {
          const baseValue = option.FO_Value;
          const bufferMultiplier = (100 + option.FO_Buffer) / 100;
          const finalValue = baseValue * bufferMultiplier;
          
          switch (fee.FE_Calculation_Type) {
            case 'Pourcentage budget':
              const baseAmount = fee.FE_Calculation_Mode === 'Directement sur le budget média' 
                ? (data.TC_BudgetInput || 0) 
                : cumulativeBase;
              calculatedAmount = baseAmount * finalValue;
              break;
              
            case 'Volume d\'unité':
              const volume = customVolume > 0 ? customVolume : (data.TC_Unit_Volume || 0);
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
          
          // Mettre à jour la base cumulative pour les frais suivants
          if (fee.FE_Calculation_Mode === 'Applicable sur les frais précédents') {
            cumulativeBase += calculatedAmount;
          }
        }
      }
      
      results.push({
        feeId: selectedOptionId || '',
        calculatedAmount: Math.round(calculatedAmount * 100) / 100 // Arrondir à 2 décimales
      });
    }
    
    return results;
  }
  
  /**
   * Détermine quels champs doivent être recalculés quand un champ change
   */
  export function getBudgetFieldDependencies(changedField: string): string[] {
    const allCalculatedFields = [
      'TC_Unit_Volume',
      'TC_Media_Budget', 
      'TC_Client_Budget',
      'TC_Bonification',
      'TC_Fee_1_Value',
      'TC_Fee_2_Value', 
      'TC_Fee_3_Value',
      'TC_Fee_4_Value',
      'TC_Fee_5_Value',
      'TC_Total_Fees'
    ];
  
    switch (changedField) {
      case 'TC_BudgetChoice':
      case 'TC_BudgetInput':
        return allCalculatedFields;
        
      case 'TC_Unit_Price':
      case 'TC_Unit_Type':
        return ['TC_Unit_Volume'];
        
      case 'TC_Has_Bonus':
      case 'TC_Media_Value':
        return ['TC_Bonification', 'TC_Unit_Volume'];
        
      case 'TC_Fee_1_Option':
      case 'TC_Fee_1_Volume':
        return ['TC_Fee_1_Value', 'TC_Total_Fees', 'TC_Media_Budget', 'TC_Client_Budget'];
        
      case 'TC_Fee_2_Option':
      case 'TC_Fee_2_Volume':
        return ['TC_Fee_2_Value', 'TC_Total_Fees', 'TC_Media_Budget', 'TC_Client_Budget'];
        
      case 'TC_Fee_3_Option':
      case 'TC_Fee_3_Volume':
        return ['TC_Fee_3_Value', 'TC_Total_Fees', 'TC_Media_Budget', 'TC_Client_Budget'];
        
      case 'TC_Fee_4_Option':
      case 'TC_Fee_4_Volume':
        return ['TC_Fee_4_Value', 'TC_Total_Fees', 'TC_Media_Budget', 'TC_Client_Budget'];
        
      case 'TC_Fee_5_Option':
      case 'TC_Fee_5_Volume':
        return ['TC_Fee_5_Value', 'TC_Total_Fees', 'TC_Media_Budget', 'TC_Client_Budget'];
        
      default:
        return [];
    }
  }
  
  /**
   * Valide si les données sont suffisantes pour effectuer les calculs
   */
  export function validateBudgetData(data: BudgetData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.TC_BudgetInput || data.TC_BudgetInput <= 0) {
      errors.push('Budget saisi requis');
    }
    
    if (!data.TC_BudgetChoice) {
      errors.push('Mode de saisie requis');
    }
    
    if (!data.TC_BuyCurrency) {
      errors.push('Devise requise');
    }
    
    // Pour calculer le volume, besoin du coût par unité
    if (data.TC_Unit_Price && data.TC_Unit_Price <= 0) {
      errors.push('Coût par unité doit être positif');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }