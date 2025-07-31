// app/components/Tactiques/Views/Table/BudgetCalculationsTable.tsx

/**
 * Logique de calcul budgétaire complète intégrée pour la vue tableau
 * Reproduit exactement la logique du drawer avec useBudgetCalculations
 */

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
  
  interface BudgetData {
    TC_BudgetChoice?: string;
    TC_BudgetInput?: number;
    TC_BuyCurrency?: string;
    TC_Unit_Type?: string;
    TC_Unit_Price?: number;
    TC_Unit_Volume?: number;
    TC_Media_Value?: number;
    TC_Bonification?: number;
    TC_Media_Budget?: number;
    TC_Client_Budget?: number;
    TC_Total_Fees?: number;
    // Frais dynamiques
    [key: string]: any;
  }
  
  interface TableBudgetCalculations {
    mediaBudget: number;
    clientBudget: number;
    totalFees: number;
    unitVolume: number;
    bonification: number;
    feeCalculations: { [key: string]: number };
  }
  
  /**
   * Calcule correctement les frais selon la logique exacte du drawer
   */
  export function calculateFeesForTable(
    budgetData: BudgetData, 
    clientFees: ClientFee[]
  ): { feeCalculations: { [key: string]: number }; totalFees: number } {
    const feeCalculations: { [key: string]: number } = {};
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    
    const mediaBudget = budgetData.TC_Media_Budget || budgetData.TC_BudgetInput || 0;
    const unitVolume = budgetData.TC_Unit_Volume || 0;
    
    let cumulativeBase = mediaBudget;
    let totalFees = 0;
    
    sortedFees.forEach((fee, orderIndex) => {
      const feeNumber = orderIndex + 1;
      const optionKey = `TC_Fee_${feeNumber}_Option`;
      const volumeKey = `TC_Fee_${feeNumber}_Volume`;
      const valueKey = `TC_Fee_${feeNumber}_Value`;
      const enabledKey = `TC_Fee_${feeNumber}_Enabled`;
      
      const isEnabled = budgetData[enabledKey];
      const selectedOptionId = budgetData[optionKey] as string;
      const customVolume = budgetData[volumeKey] as number || 0;
      
      if (!isEnabled || !selectedOptionId) {
        feeCalculations[valueKey] = 0;
        return;
      }
      
      const selectedOption = fee.options?.find(opt => opt.id === selectedOptionId);
  
      if (!selectedOption) {
        feeCalculations[valueKey] = 0;
        return;
      }
      
      let baseValue = selectedOption.FO_Value;
      
      // Appliquer la valeur personnalisée si le frais est éditable
      if (selectedOption.FO_Editable) {
        switch (fee.FE_Calculation_Type) {
          case 'Pourcentage budget':
            if (customVolume !== undefined && customVolume !== null) {
              baseValue = customVolume / 100; // Convertir en décimal pour le pourcentage
            }
            break;
          case 'Frais fixe':
            if (customVolume !== undefined && customVolume !== null && customVolume >= 0) {
              baseValue = customVolume;
            }
            break;
          case 'Volume d\'unité':
            // baseValue reste celui de l'option, customVolume change le volume multiplié
            break;
          case 'Unités':
            // baseValue reste celui de l'option, customVolume change le nombre d'unités
            break;
          default:
        }
      }
      
      // Appliquer le buffer
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
      
      // Arrondir à 2 décimales
      calculatedAmount = Math.round(calculatedAmount * 100) / 100;
      
      feeCalculations[valueKey] = calculatedAmount;
      totalFees += calculatedAmount;
      
      // Mettre à jour la base cumulative pour les frais suivants
      if (calculatedAmount > 0) {
        cumulativeBase += calculatedAmount;
      }
      
      console.log(`[TABLE CALCUL] ${fee.FE_Name}: ${baseValue} × ${bufferMultiplier} × ${
        fee.FE_Calculation_Type === 'Pourcentage budget' ? (fee.FE_Calculation_Mode === 'Directement sur le budget média' ? mediaBudget : cumulativeBase - calculatedAmount) :
        fee.FE_Calculation_Type === 'Volume d\'unité' ? (customVolume > 0 ? customVolume : unitVolume) :
        fee.FE_Calculation_Type === 'Unités' ? (customVolume > 0 ? customVolume : 1) :
        1
      } = ${calculatedAmount.toFixed(2)}`);
    });
    
    return { feeCalculations, totalFees };
  }
  
  /**
   * Calcule le volume d'unités selon la logique du drawer
   */
  export function calculateUnitVolumeForTable(
    budgetInput: number,
    unitPrice: number,
    unitType: string,
    mediaValue?: number
  ): number {
    if (unitPrice <= 0) return 0;
    
    const effectiveBudget = budgetInput + (mediaValue ? Math.max(0, mediaValue - budgetInput) : 0);
    
    if (unitType?.toLowerCase().includes('impression') || unitType?.toLowerCase().includes('cpm')) {
      // Pour CPM : Budget / CPM * 1000
      return Math.round((effectiveBudget / unitPrice) * 1000);
    } else {
      // Pour autres unités : Budget / Coût par unité
      return Math.round(effectiveBudget / unitPrice);
    }
  }
  
  /**
   * Calcule la bonification selon la logique du drawer
   */
  export function calculateBonificationForTable(
    budgetChoice: string,
    budgetInput: number,
    mediaValue: number,
    mediaBudget?: number
  ): number {
    if (!mediaValue || mediaValue <= 0) return 0;
    
    if (budgetChoice === 'media') {
      // Mode budget média : bonification = valeur réelle - budget saisi
      return Math.max(0, mediaValue - budgetInput);
    } else {
      // Mode budget client : bonification = valeur réelle - budget média calculé
      const effectiveMediaBudget = mediaBudget || budgetInput;
      return Math.max(0, mediaValue - effectiveMediaBudget);
    }
  }
  
  /**
   * Effectue le calcul complet selon la logique du drawer
   */
  export function calculateCompleteBudgetForTable(
    budgetData: BudgetData,
    clientFees: ClientFee[]
  ): TableBudgetCalculations {
    const budgetChoice = budgetData.TC_BudgetChoice || 'media';
    const budgetInput = budgetData.TC_BudgetInput || 0;
    const unitPrice = budgetData.TC_Unit_Price || 0;
    const unitType = budgetData.TC_Unit_Type || '';
    const mediaValue = budgetData.TC_Media_Value || 0;
    
    // 1. Calculer le volume d'unités
    const unitVolume = calculateUnitVolumeForTable(budgetInput, unitPrice, unitType, mediaValue);
    
    // 2. Déterminer le budget média initial
    let mediaBudget: number;
    if (budgetChoice === 'media') {
      mediaBudget = budgetInput;
    } else {
      // Mode client : on doit faire une estimation puis itérer
      mediaBudget = budgetInput * 0.8; // Estimation initiale
    }
    
    // 3. Préparer les données pour le calcul des frais
    const budgetDataForFees = {
      ...budgetData,
      TC_Media_Budget: mediaBudget,
      TC_Unit_Volume: unitVolume
    };
    
    // 4. Calculer les frais
    const { feeCalculations, totalFees } = calculateFeesForTable(budgetDataForFees, clientFees);
    
    // 5. Calculer le budget client
    let clientBudget: number;
    if (budgetChoice === 'media') {
      clientBudget = mediaBudget + totalFees;
    } else {
      clientBudget = budgetInput;
      // En mode client, ajuster le budget média
      mediaBudget = Math.max(0, budgetInput - totalFees);
      
      // Recalculer les frais avec le nouveau budget média si nécessaire
      if (totalFees > 0) {
        const adjustedBudgetData = {
          ...budgetDataForFees,
          TC_Media_Budget: mediaBudget
        };
        const { feeCalculations: adjustedFees, totalFees: adjustedTotalFees } = calculateFeesForTable(adjustedBudgetData, clientFees);
        Object.assign(feeCalculations, adjustedFees);
      }
    }
    
    // 6. Calculer la bonification
    const bonification = calculateBonificationForTable(budgetChoice, budgetInput, mediaValue, mediaBudget);
    
    console.log(`[TABLE BUDGET COMPLET]`, {
      budgetChoice,
      budgetInput,
      mediaBudget,
      clientBudget,
      totalFees,
      unitVolume,
      bonification
    });
    
    return {
      mediaBudget,
      clientBudget,
      totalFees,
      unitVolume,
      bonification,
      feeCalculations
    };
  }
  
  /**
   * Détermine quels champs doivent être recalculés quand un champ change
   */
  export function getBudgetDependenciesForTable(changedField: string): string[] {
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
  
    switch (changedField) {
      case 'TC_BudgetChoice':
      case 'TC_BudgetInput':
      case 'TC_Unit_Price':
      case 'TC_Unit_Type':
      case 'TC_Media_Value':
        return allCalculatedFields;
        
      // Frais
      case 'TC_Fee_1_Enabled':
      case 'TC_Fee_1_Option':
      case 'TC_Fee_1_Volume':
      case 'TC_Fee_2_Enabled':
      case 'TC_Fee_2_Option':
      case 'TC_Fee_2_Volume':
      case 'TC_Fee_3_Enabled':
      case 'TC_Fee_3_Option':
      case 'TC_Fee_3_Volume':
      case 'TC_Fee_4_Enabled':
      case 'TC_Fee_4_Option':
      case 'TC_Fee_4_Volume':
      case 'TC_Fee_5_Enabled':
      case 'TC_Fee_5_Option':
      case 'TC_Fee_5_Volume':
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
        
      default:
        return [];
    }
  }