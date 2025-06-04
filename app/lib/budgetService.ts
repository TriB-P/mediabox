// app/lib/budgetService.ts - VERSION SIMPLIFIÉE

import {
  calculateBudget,
  validateBudgetInputs,
  type FeeDefinition,
  type BudgetInputs,
  type BudgetResults,
  type FeeCalculationType,
  type FeeCalculationMode,
  type ConvergenceInfo
} from './budgetCalculations';

// ==================== TYPES SIMPLIFIÉS ====================

// Une seule interface pour les données budget (noms Firestore partout)
export interface BudgetData {
  TC_BudgetChoice: 'media' | 'client';
  TC_BudgetInput: number;
  TC_Unit_Price: number;
  TC_Unit_Volume: number;
  TC_Media_Value: number;
  TC_Bonification: number;
  TC_Media_Budget: number;
  TC_Client_Budget: number;
  TC_Currency_Rate: number;
  TC_BuyCurrency: string;
  TC_Delta: number;
  TC_Unit_Type?: string;
  // Frais simplifiés - jusqu'à 5
  TC_Fee_1_Option: string;
  TC_Fee_1_Volume: number;
  TC_Fee_1_Value: number;
  TC_Fee_2_Option: string;
  TC_Fee_2_Volume: number;
  TC_Fee_2_Value: number;
  TC_Fee_3_Option: string;
  TC_Fee_3_Volume: number;
  TC_Fee_3_Value: number;
  TC_Fee_4_Option: string;
  TC_Fee_4_Volume: number;
  TC_Fee_4_Value: number;
  TC_Fee_5_Option: string;
  TC_Fee_5_Volume: number;
  TC_Fee_5_Value: number;
}

// Frais client (inchangé)
export interface ClientFee {
  id: string;
  FE_Name: string;
  FE_Calculation_Type: FeeCalculationType;
  FE_Calculation_Mode: FeeCalculationMode;
  FE_Order: number;
  options: ClientFeeOption[];
}

export interface ClientFeeOption {
  id: string;
  FO_Option: string;
  FO_Value: number;
  FO_Buffer: number;
  FO_Editable: boolean;
}

// Résultat des calculs
export interface BudgetCalculationResult {
  success: boolean;
  error?: string;
  data?: {
    budgetResults: BudgetResults;
    updatedData: BudgetData;
    hasConverged: boolean;
    convergenceInfo?: ConvergenceInfo;
  };
}

// ==================== SERVICE SIMPLIFIÉ ====================

export class BudgetService {
  private debugMode: boolean = false;

  // ==================== DEBUG SIMPLE ====================

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`🐛 Budget Debug: ${enabled ? 'ON' : 'OFF'}`);
  }

  private log(message: string, data?: any): void {
    if (this.debugMode) {
      console.log(`🏦 ${message}`, data || '');
    }
  }

  // ==================== CRÉATION DE DONNÉES PAR DÉFAUT ====================

  /**
   * Crée des données budget vides
   */
  createDefaultData(clientFees: ClientFee[]): BudgetData {
    this.log('Création données par défaut');
    
    const defaultData: BudgetData = {
      TC_BudgetChoice: 'media',
      TC_BudgetInput: 0,
      TC_Unit_Price: 0,
      TC_Unit_Volume: 0,
      TC_Media_Value: 0,
      TC_Bonification: 0,
      TC_Media_Budget: 0,
      TC_Client_Budget: 0,
      TC_Currency_Rate: 1,
      TC_BuyCurrency: 'CAD',
      TC_Delta: 0,
      TC_Unit_Type: '',
      // Frais vides
      TC_Fee_1_Option: '',
      TC_Fee_1_Volume: 0,
      TC_Fee_1_Value: 0,
      TC_Fee_2_Option: '',
      TC_Fee_2_Volume: 0,
      TC_Fee_2_Value: 0,
      TC_Fee_3_Option: '',
      TC_Fee_3_Volume: 0,
      TC_Fee_3_Value: 0,
      TC_Fee_4_Option: '',
      TC_Fee_4_Volume: 0,
      TC_Fee_4_Value: 0,
      TC_Fee_5_Option: '',
      TC_Fee_5_Volume: 0,
      TC_Fee_5_Value: 0,
    };

    return defaultData;
  }

  /**
   * Charge les données depuis Firestore (avec valeurs par défaut)
   */
  loadFromFirestore(firestoreData: any, clientFees: ClientFee[]): BudgetData {
    this.log('Chargement depuis Firestore', firestoreData);

    // Commencer avec les données par défaut
    const data = this.createDefaultData(clientFees);

    // Écraser avec les données Firestore existantes
    if (firestoreData) {
      // Budget principal
      data.TC_BudgetChoice = firestoreData.TC_BudgetChoice || firestoreData.TC_Budget_Mode || 'media';
      data.TC_BudgetInput = firestoreData.TC_BudgetInput || firestoreData.TC_Budget || 0;
      data.TC_Unit_Price = firestoreData.TC_Unit_Price || firestoreData.TC_Cost_Per_Unit || 0;
      data.TC_Unit_Volume = firestoreData.TC_Unit_Volume || 0;
      data.TC_Media_Value = firestoreData.TC_Media_Value || firestoreData.TC_Real_Value || 0;
      data.TC_Bonification = firestoreData.TC_Bonification || firestoreData.TC_Bonus_Value || 0;
      data.TC_Media_Budget = firestoreData.TC_Media_Budget || 0;
      data.TC_Client_Budget = firestoreData.TC_Client_Budget || 0;
      data.TC_Currency_Rate = firestoreData.TC_Currency_Rate || 1;
      data.TC_BuyCurrency = firestoreData.TC_BuyCurrency || firestoreData.TC_Currency || 'CAD';
      data.TC_Delta = firestoreData.TC_Delta || 0;
      data.TC_Unit_Type = firestoreData.TC_Unit_Type || '';

      // Frais (mapping simplifié avec typage correct)
      for (let i = 1; i <= 5; i++) {
        const optionKey = `TC_Fee_${i}_Option` as keyof BudgetData;
        const volumeKey = `TC_Fee_${i}_Volume` as keyof BudgetData;
        const valueKey = `TC_Fee_${i}_Value` as keyof BudgetData;
        
        (data as any)[optionKey] = firestoreData[optionKey] || '';
        (data as any)[volumeKey] = firestoreData[volumeKey] || 0;
        (data as any)[valueKey] = firestoreData[valueKey] || 0;
      }
    }

    this.log('Données chargées', data);
    return data;
  }

  // ==================== CALCULS PRINCIPAUX ====================

  /**
   * Effectue tous les calculs budget
   */
  calculateComplete(
    data: BudgetData,
    clientFees: ClientFee[],
    exchangeRates: { [key: string]: number },
    campaignCurrency: string,
    unitTypeOptions: Array<{ id: string; SH_Display_Name_FR: string }>
  ): BudgetCalculationResult {
    this.log('🧮 Début calculs complets');

    try {
      // 1. Validation de base
      if (data.TC_BudgetInput <= 0 || data.TC_Unit_Price <= 0) {
        return { success: false, error: 'Budget et prix unitaire requis' };
      }

      // 2. Convertir les frais actifs vers les définitions de calcul
      const feeDefinitions = this.buildFeeDefinitions(data, clientFees);
      this.log('Frais pour calcul', feeDefinitions);

      // 3. Préparer les inputs pour le moteur de calcul
      const selectedUnitType = unitTypeOptions.find(option => option.id === data.TC_Unit_Type);
      const unitTypeDisplayName = selectedUnitType?.SH_Display_Name_FR;

      const budgetInputs: BudgetInputs = {
        costPerUnit: data.TC_Unit_Price,
        realValue: data.TC_Media_Value > 0 ? data.TC_Media_Value : undefined,
        fees: feeDefinitions,
        unitType: data.TC_Unit_Type,
        unitTypeDisplayName
      };

      // Définir le budget selon le mode
      if (data.TC_BudgetChoice === 'client') {
        budgetInputs.clientBudget = data.TC_BudgetInput;
      } else {
        budgetInputs.mediaBudget = data.TC_BudgetInput;
      }

      // 4. Validation des inputs
      const validationErrors = validateBudgetInputs(budgetInputs);
      if (validationErrors.length > 0) {
        return { success: false, error: validationErrors.join(', ') };
      }

      // 5. Effectuer le calcul (logique existante préservée)
      const budgetResults = calculateBudget(budgetInputs);
      this.log('Résultats calculs', budgetResults);

      // 6. Calculer le taux de change
      const effectiveRate = this.calculateExchangeRate(data.TC_BuyCurrency, campaignCurrency, exchangeRates);

      // 7. Mettre à jour les données avec les résultats
      const updatedData = this.updateDataWithResults(data, budgetResults, effectiveRate, clientFees);

      this.log('✅ Calculs terminés avec succès');

      return {
        success: true,
        data: {
          budgetResults,
          updatedData,
          hasConverged: budgetResults.convergenceInfo?.hasConverged ?? true,
          convergenceInfo: budgetResults.convergenceInfo
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de calcul inconnue';
      this.log('❌ Erreur calculs', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // ==================== HELPERS PRIVÉS ====================

  /**
   * Construit les définitions de frais pour le calcul
   */
// Dans app/lib/budgetService.ts, ligne ~140
// Méthode buildFeeDefinitions - CORRECTION

private buildFeeDefinitions(data: BudgetData, clientFees: ClientFee[]): FeeDefinition[] {
  const definitions: FeeDefinition[] = [];
  
  // Trier les frais par ordre
  const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
  
  sortedFees.forEach((fee, orderIndex) => {
    const feeNumber = orderIndex + 1;
    const optionKey = `TC_Fee_${feeNumber}_Option` as keyof BudgetData;
    const volumeKey = `TC_Fee_${feeNumber}_Volume` as keyof BudgetData;
    
    const optionId = data[optionKey] as string;
    const volumeValue = data[volumeKey] as number;
    
    // Seulement si le frais est actif
    if (optionId && optionId !== '') {
      const selectedOption = fee.options?.find(opt => opt.id === optionId);
      
      if (selectedOption) {
        let baseValue = selectedOption.FO_Value;
        let customUnits: number | undefined;
        let useCustomVolume: boolean | undefined;
        let customVolume: number | undefined;
        
        // 🔥 CORRECTION: Ajouter le case manquant pour 'Frais fixe'
        switch (fee.FE_Calculation_Type) {
          case 'Unités':
            customUnits = volumeValue || 1;
            break;
          case 'Volume d\'unité':
            if (volumeValue > 0) {
              useCustomVolume = true;
              customVolume = volumeValue;
            }
            break;
          case 'Pourcentage budget':
            if (selectedOption.FO_Editable && volumeValue > 0) {
              baseValue = volumeValue;
            }
            break;
          // 🔥 AJOUT: Case manquant pour les frais fixes
          case 'Frais fixe':
            if (selectedOption.FO_Editable && volumeValue > 0) {
              baseValue = volumeValue;
            }
            break;
        }
        
        console.log(`🐛 [buildFeeDefinitions] ${fee.FE_Name}:`, {
          type: fee.FE_Calculation_Type,
          originalValue: selectedOption.FO_Value,
          volumeValue,
          finalBaseValue: baseValue,
          isEditable: selectedOption.FO_Editable
        });
        
        definitions.push({
          id: fee.id,
          name: fee.FE_Name,
          calculationType: fee.FE_Calculation_Type,
          calculationMode: fee.FE_Calculation_Mode,
          order: fee.FE_Order,
          value: baseValue,
          buffer: selectedOption.FO_Buffer,
          customUnits,
          useCustomVolume,
          customVolume
        });
      }
    }
  });
  
  console.log(`🐛 [buildFeeDefinitions] Résultat final:`, definitions);
  return definitions;
}
  /**
   * Met à jour les données avec les résultats de calcul
   */
  private updateDataWithResults(
    data: BudgetData,
    budgetResults: BudgetResults,
    exchangeRate: number,
    clientFees: ClientFee[]
  ): BudgetData {
    const updatedData = { ...data };

    // Mettre à jour les valeurs calculées
    updatedData.TC_Unit_Volume = budgetResults.unitVolume;
    updatedData.TC_Bonification = budgetResults.bonusValue;
    updatedData.TC_Media_Budget = budgetResults.mediaBudget;
    updatedData.TC_Client_Budget = budgetResults.clientBudget;
    updatedData.TC_Currency_Rate = exchangeRate;
    updatedData.TC_Delta = budgetResults.convergenceInfo ? 
      Math.abs(budgetResults.convergenceInfo.finalDifference) : 0;

    // Mettre à jour les montants des frais
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    
    sortedFees.forEach((fee, orderIndex) => {
      const feeNumber = orderIndex + 1;
      const valueKey = `TC_Fee_${feeNumber}_Value` as keyof BudgetData;
      const feeDetail = budgetResults.feeDetails.find(detail => detail.feeId === fee.id);
      
      if (feeDetail) {
        (updatedData[valueKey] as number) = feeDetail.calculatedAmount;
      }
    });

    return updatedData;
  }

  /**
   * Calcule le taux de change effectif
   */
  private calculateExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    exchangeRates: { [key: string]: number }
  ): number {
    if (fromCurrency === toCurrency) return 1;
    
    const directRate = exchangeRates[fromCurrency] || exchangeRates[`${fromCurrency}_${toCurrency}`];
    
    if (directRate && directRate > 0) {
      return directRate;
    }

    this.log(`⚠️ Taux de change non trouvé pour ${fromCurrency} → ${toCurrency}`);
    return 1;
  }
}

// ==================== INSTANCE SINGLETON ====================

export const budgetService = new BudgetService();