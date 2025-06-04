// app/lib/budgetService.ts

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
  
  // ==================== TYPES CENTRALISÉS ====================
  
  // Structure des données budget dans Firestore (nouveaux noms)
  export interface BudgetFirestoreData {
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
    // Frais dynamiques - jusqu'à 5 (CORRIGÉ: retirer ? pour éviter les erreurs TypeScript)
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
  
  // Structure des données budget pour l'interface (état interne)
  export interface BudgetUIData {
    budgetChoice: 'media' | 'client';
    budgetInput: number;
    unitPrice: number;
    unitVolume: number;
    mediaValue: number;
    bonification: number;
    mediaBudget: number;
    clientBudget: number;
    currencyRate: number;
    buyCurrency: string;
    delta: number;
    unitType?: string;
    fees: BudgetFeeUI[];
  }
  
  // Structure pour un frais dans l'interface
  export interface BudgetFeeUI {
    feeId: string;
    feeOrder: number;
    feeName: string;
    feeType: FeeCalculationType;
    feeMode: FeeCalculationMode;
    isActive: boolean;
    selectedOptionId?: string;
    volumeValue: number;
    calculatedValue: number;
    // Données techniques pour les calculs
    customUnits?: number;
    customValue?: number;
    useCustomVolume?: boolean;
    customVolume?: number;
  }
  
  // Définition d'un frais client
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
  
  // Résultat des calculs budget
  export interface BudgetCalculationResult {
    success: boolean;
    error?: string;
    data?: {
      budgetResults: BudgetResults;
      updatedUIData: BudgetUIData;
      hasConverged: boolean;
      convergenceInfo?: ConvergenceInfo;
    };
  }
  
  // Options pour le debug
  export interface BudgetDebugInfo {
    inputs: any;
    calculations: any;
    fees: any;
    mapping: any;
    errors: string[];
    warnings: string[];
  }
  
  // ==================== SERVICE PRINCIPAL ====================
  
  export class BudgetService {
    private debugMode: boolean = false;
    private debugInfo: BudgetDebugInfo = {
      inputs: {},
      calculations: {},
      fees: {},
      mapping: {},
      errors: [],
      warnings: []
    };
  
    // ==================== CONFIGURATION DEBUG ====================
  
    setDebugMode(enabled: boolean): void {
      this.debugMode = enabled;
      if (enabled) {
        console.log('🐛 Budget Debug Mode activé');
      } else {
        console.log('🐛 Budget Debug Mode désactivé');
      }
    }
  
    getDebugInfo(): BudgetDebugInfo {
      return { ...this.debugInfo };
    }
  
    private log(message: string, data?: any): void {
      if (this.debugMode) {
        console.log(`🏦 BudgetService: ${message}`, data || '');
      }
    }
  
    private addDebugInfo(category: keyof BudgetDebugInfo, key: string, value: any): void {
      if (this.debugMode && category !== 'errors' && category !== 'warnings') {
        (this.debugInfo[category] as any)[key] = value;
      }
    }
  
    private addError(error: string): void {
      this.debugInfo.errors.push(error);
      console.error(`❌ BudgetService Error: ${error}`);
    }
  
    private addWarning(warning: string): void {
      this.debugInfo.warnings.push(warning);
      console.warn(`⚠️ BudgetService Warning: ${warning}`);
    }
  
    private clearDebugInfo(): void {
      this.debugInfo = {
        inputs: {},
        calculations: {},
        fees: {},
        mapping: {},
        errors: [],
        warnings: []
      };
    }
  
    // ==================== CONVERSION FIRESTORE ↔ UI ====================
  
    /**
     * Convertit les données Firestore vers l'interface utilisateur
     */
    firestoreToUI(firestoreData: any, clientFees: ClientFee[]): BudgetUIData {
      this.clearDebugInfo();
      this.log('Converting Firestore → UI', firestoreData);
  
      const uiData: BudgetUIData = {
        budgetChoice: firestoreData.TC_BudgetChoice || firestoreData.TC_Budget_Mode || 'media',
        budgetInput: firestoreData.TC_BudgetInput || firestoreData.TC_Budget || 0,
        unitPrice: firestoreData.TC_Unit_Price || firestoreData.TC_Cost_Per_Unit || 0,
        unitVolume: firestoreData.TC_Unit_Volume || 0,
        mediaValue: firestoreData.TC_Media_Value || firestoreData.TC_Real_Value || 0,
        bonification: firestoreData.TC_Bonification || firestoreData.TC_Bonus_Value || 0,
        mediaBudget: firestoreData.TC_Media_Budget || 0,
        clientBudget: firestoreData.TC_Client_Budget || 0,
        currencyRate: firestoreData.TC_Currency_Rate || 1,
        buyCurrency: firestoreData.TC_BuyCurrency || firestoreData.TC_Currency || 'CAD',
        delta: firestoreData.TC_Delta || 0,
        unitType: firestoreData.TC_Unit_Type || '',
        fees: this.convertFeesFromFirestore(firestoreData, clientFees)
      };
  
      this.addDebugInfo('mapping', 'firestoreToUI', { input: firestoreData, output: uiData });
      this.log('✅ Conversion Firestore → UI terminée', uiData);
  
      return uiData;
    }
  
    /**
     * Convertit les données UI vers Firestore
     */
    uiToFirestore(uiData: BudgetUIData): any {
      this.log('Converting UI → Firestore', uiData);
  
      const firestoreData: any = {
        TC_BudgetChoice: uiData.budgetChoice,
        TC_BudgetInput: uiData.budgetInput,
        TC_Unit_Price: uiData.unitPrice,
        TC_Unit_Volume: uiData.unitVolume,
        TC_Media_Value: uiData.mediaValue,
        TC_Bonification: uiData.bonification,
        TC_Media_Budget: uiData.mediaBudget,
        TC_Client_Budget: uiData.clientBudget,
        TC_Currency_Rate: uiData.currencyRate,
        TC_BuyCurrency: uiData.buyCurrency,
        TC_Delta: uiData.delta,
        TC_Unit_Type: uiData.unitType
      };
  
      // Ajouter les frais
      const feeData = this.convertFeesToFirestore(uiData.fees);
      Object.assign(firestoreData, feeData);
  
      this.addDebugInfo('mapping', 'uiToFirestore', { input: uiData, output: firestoreData });
      this.log('✅ Conversion UI → Firestore terminée', firestoreData);
  
      return firestoreData;
    }
  
    // ==================== GESTION DES FRAIS ====================
  
    /**
     * Convertit les frais depuis Firestore vers l'UI
     */
    private convertFeesFromFirestore(firestoreData: any, clientFees: ClientFee[]): BudgetFeeUI[] {
      this.log('Converting fees Firestore → UI');
  
      const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
      
      const uiFees: BudgetFeeUI[] = sortedFees.map((fee, orderIndex) => {
        const feeNumber = orderIndex + 1;
        const optionId = firestoreData[`TC_Fee_${feeNumber}_Option`] as string || '';
        const volumeValue = firestoreData[`TC_Fee_${feeNumber}_Volume`] as number || 0;
        const calculatedValue = firestoreData[`TC_Fee_${feeNumber}_Value`] as number || 0;
  
        const uiFee: BudgetFeeUI = {
          feeId: fee.id,
          feeOrder: fee.FE_Order,
          feeName: fee.FE_Name,
          feeType: fee.FE_Calculation_Type,
          feeMode: fee.FE_Calculation_Mode,
          isActive: !!optionId,
          selectedOptionId: optionId || undefined,
          volumeValue,
          calculatedValue
        };
  
        // Déterminer les valeurs techniques selon le type
        if (uiFee.isActive && volumeValue > 0) {
          switch (fee.FE_Calculation_Type) {
            case 'Unités':
              uiFee.customUnits = volumeValue;
              break;
            case 'Volume d\'unité':
              uiFee.useCustomVolume = true;
              uiFee.customVolume = volumeValue;
              break;
            case 'Pourcentage budget':
              uiFee.customValue = volumeValue;
              break;
          }
        }
  
        this.log(`💰 Frais ${feeNumber} (${fee.FE_Name}):`, uiFee);
        return uiFee;
      });
  
      this.addDebugInfo('fees', 'fromFirestore', uiFees);
      return uiFees;
    }
  
    /**
     * Convertit les frais depuis l'UI vers Firestore
     */
    private convertFeesToFirestore(uiFees: BudgetFeeUI[]): Record<string, string | number> {
      this.log('Converting fees UI → Firestore');
  
      const firestoreData: Record<string, string | number> = {};
      
      // Trier par ordre pour assurer la correspondance
      const sortedFees = [...uiFees].sort((a, b) => a.feeOrder - b.feeOrder);
      
      sortedFees.forEach((fee, orderIndex) => {
        const feeNumber = orderIndex + 1;
        
        if (fee.isActive && fee.selectedOptionId) {
          firestoreData[`TC_Fee_${feeNumber}_Option`] = fee.selectedOptionId;
          firestoreData[`TC_Fee_${feeNumber}_Volume`] = fee.volumeValue;
          firestoreData[`TC_Fee_${feeNumber}_Value`] = fee.calculatedValue;
        } else {
          // Nettoyer les valeurs si inactif
          firestoreData[`TC_Fee_${feeNumber}_Option`] = '';
          firestoreData[`TC_Fee_${feeNumber}_Volume`] = 0;
          firestoreData[`TC_Fee_${feeNumber}_Value`] = 0;
        }
  
        this.log(`💰 Mapping frais ${feeNumber}:`, {
          option: firestoreData[`TC_Fee_${feeNumber}_Option`],
          volume: firestoreData[`TC_Fee_${feeNumber}_Volume`],
          value: firestoreData[`TC_Fee_${feeNumber}_Value`]
        });
      });
  
      this.addDebugInfo('fees', 'toFirestore', firestoreData);
      return firestoreData;
    }
  
    // ==================== CALCULS BUDGÉTAIRES ====================
  
    /**
     * Effectue tous les calculs budgétaires
     */
    calculateBudgetComplete(
      uiData: BudgetUIData,
      clientFees: ClientFee[],
      exchangeRates: { [key: string]: number },
      campaignCurrency: string,
      unitTypeOptions: Array<{ id: string; SH_Display_Name_FR: string }>
    ): BudgetCalculationResult {
      this.log('🧮 Début des calculs budget complets');
      this.addDebugInfo('inputs', 'uiData', uiData);
      this.addDebugInfo('inputs', 'exchangeRates', exchangeRates);
      this.addDebugInfo('inputs', 'campaignCurrency', campaignCurrency);
  
      try {
        // 1. Validation des inputs de base
        if (uiData.budgetInput <= 0 || uiData.unitPrice <= 0) {
          this.addWarning('Budget ou prix unitaire manquant');
          return { success: false, error: 'Budget et prix unitaire requis' };
        }
  
        // 2. Convertir les frais UI vers les définitions de calcul
        const feeDefinitions = this.convertUIFeesToDefinitions(uiData.fees, clientFees);
        this.addDebugInfo('calculations', 'feeDefinitions', feeDefinitions);
  
        // 3. Préparer les inputs pour le moteur de calcul
        const selectedUnitType = unitTypeOptions.find(option => option.id === uiData.unitType);
        const unitTypeDisplayName = selectedUnitType?.SH_Display_Name_FR;
  
        const budgetInputs: BudgetInputs = {
          costPerUnit: uiData.unitPrice,
          realValue: uiData.mediaValue > 0 ? uiData.mediaValue : undefined,
          fees: feeDefinitions,
          unitType: uiData.unitType,
          unitTypeDisplayName
        };
  
        // Définir le budget selon le mode
        if (uiData.budgetChoice === 'client') {
          budgetInputs.clientBudget = uiData.budgetInput;
        } else {
          budgetInputs.mediaBudget = uiData.budgetInput;
        }
  
        this.addDebugInfo('calculations', 'budgetInputs', budgetInputs);
  
        // 4. Validation des inputs
        const validationErrors = validateBudgetInputs(budgetInputs);
        if (validationErrors.length > 0) {
          validationErrors.forEach(error => this.addError(error));
          return { success: false, error: validationErrors.join(', ') };
        }
  
        // 5. Effectuer le calcul
        const budgetResults = calculateBudget(budgetInputs);
        this.addDebugInfo('calculations', 'budgetResults', budgetResults);
  
        // 6. Calculer le taux de change effectif
        const effectiveRate = this.calculateExchangeRate(uiData.buyCurrency, campaignCurrency, exchangeRates);
        this.addDebugInfo('calculations', 'effectiveRate', effectiveRate);
  
        // 7. Mettre à jour les données UI avec les résultats
        const updatedUIData = this.updateUIDataWithResults(uiData, budgetResults, effectiveRate, clientFees);
        this.addDebugInfo('calculations', 'updatedUIData', updatedUIData);
  
        this.log('✅ Calculs budget terminés avec succès');
  
        return {
          success: true,
          data: {
            budgetResults,
            updatedUIData,
            hasConverged: budgetResults.convergenceInfo?.hasConverged ?? true,
            convergenceInfo: budgetResults.convergenceInfo
          }
        };
  
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur de calcul inconnue';
        this.addError(errorMessage);
        return { success: false, error: errorMessage };
      }
    }
  
    /**
     * Convertit les frais UI vers les définitions de calcul
     */
    private convertUIFeesToDefinitions(uiFees: BudgetFeeUI[], clientFees: ClientFee[]): FeeDefinition[] {
      return uiFees
        .filter(uiFee => uiFee.isActive && uiFee.selectedOptionId)
        .map(uiFee => {
          const clientFee = clientFees.find(f => f.id === uiFee.feeId);
          const selectedOption = clientFee?.options.find(opt => opt.id === uiFee.selectedOptionId);
          
          if (!clientFee || !selectedOption) {
            throw new Error(`Frais ou option non trouvé: ${uiFee.feeId}`);
          }
  
          const baseValue = uiFee.customValue !== undefined ? uiFee.customValue : selectedOption.FO_Value;
  
          const definition: FeeDefinition = {
            id: clientFee.id,
            name: clientFee.FE_Name,
            calculationType: clientFee.FE_Calculation_Type,
            calculationMode: clientFee.FE_Calculation_Mode,
            order: clientFee.FE_Order,
            value: baseValue,
            buffer: selectedOption.FO_Buffer,
            customUnits: uiFee.customUnits,
            useCustomVolume: uiFee.useCustomVolume,
            customVolume: uiFee.customVolume
          };
  
          this.log(`🔄 Frais converti pour calcul: ${clientFee.FE_Name}`, definition);
          return definition;
        });
    }
  
    /**
     * Met à jour les données UI avec les résultats de calcul
     */
    private updateUIDataWithResults(
      uiData: BudgetUIData,
      budgetResults: BudgetResults,
      exchangeRate: number,
      clientFees: ClientFee[]
    ): BudgetUIData {
      const updatedData = { ...uiData };
  
      // Mettre à jour les valeurs calculées
      updatedData.unitVolume = budgetResults.unitVolume;
      updatedData.bonification = budgetResults.bonusValue;
      updatedData.mediaBudget = budgetResults.mediaBudget;
      updatedData.clientBudget = budgetResults.clientBudget;
      updatedData.currencyRate = exchangeRate;
      updatedData.delta = budgetResults.convergenceInfo ? 
        Math.abs(budgetResults.convergenceInfo.finalDifference) : 0;
  
      // Mettre à jour les montants calculés des frais
      updatedData.fees = updatedData.fees.map(uiFee => {
        const feeDetail = budgetResults.feeDetails.find(detail => detail.feeId === uiFee.feeId);
        return {
          ...uiFee,
          calculatedValue: feeDetail ? feeDetail.calculatedAmount : 0
        };
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
      
      // Chercher le taux direct
      const directRate = exchangeRates[fromCurrency] || exchangeRates[`${fromCurrency}_${toCurrency}`];
      
      if (directRate && directRate > 0) {
        return directRate;
      }
  
      this.addWarning(`Taux de change non trouvé pour ${fromCurrency} → ${toCurrency}, utilisation de 1`);
      return 1;
    }
  
    // ==================== UTILITAIRES ====================
  
    /**
     * Crée des données UI vides avec les frais par défaut
     */
    createDefaultUIData(clientFees: ClientFee[]): BudgetUIData {
      return {
        budgetChoice: 'media',
        budgetInput: 0,
        unitPrice: 0,
        unitVolume: 0,
        mediaValue: 0,
        bonification: 0,
        mediaBudget: 0,
        clientBudget: 0,
        currencyRate: 1,
        buyCurrency: 'CAD',
        delta: 0,
        unitType: '',
        fees: this.createDefaultFees(clientFees)
      };
    }
  
    /**
     * Crée les frais par défaut (inactifs)
     */
    private createDefaultFees(clientFees: ClientFee[]): BudgetFeeUI[] {
      return clientFees.map(fee => ({
        feeId: fee.id,
        feeOrder: fee.FE_Order,
        feeName: fee.FE_Name,
        feeType: fee.FE_Calculation_Type,
        feeMode: fee.FE_Calculation_Mode,
        isActive: false,
        volumeValue: 0,
        calculatedValue: 0
      }));
    }
  
    /**
     * Met à jour un frais spécifique
     */
    updateFee(uiData: BudgetUIData, feeId: string, updates: Partial<BudgetFeeUI>): BudgetUIData {
      const updatedData = { ...uiData };
      updatedData.fees = updatedData.fees.map(fee => 
        fee.feeId === feeId ? { ...fee, ...updates } : fee
      );
      
      this.log(`🔄 Frais mis à jour: ${feeId}`, updates);
      return updatedData;
    }
  }
  
  // ==================== INSTANCE SINGLETON ====================
  
  export const budgetService = new BudgetService();