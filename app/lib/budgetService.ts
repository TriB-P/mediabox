/**
 * Ce fichier contient le service principal pour la gestion des budgets.
 * Il gère la création, le chargement et le calcul des données budgétaires,
 * en intégrant la logique de calcul des frais et la conversion des devises.
 * Il sert d'interface entre les données de l'application et le moteur de calcul du budget.
 */
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

export interface BudgetData {
  TC_Budget_Mode: 'media' | 'client';
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

export class BudgetService {
  private debugMode: boolean = false;

  /**
   * Active ou désactive le mode de débogage pour le service Budget.
   * @param enabled - Vrai pour activer le mode débogage, faux pour le désactiver.
   * @returns Ne retourne rien.
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Enregistre un message de log si le mode débogage est activé.
   * @param message - Le message à enregistrer.
   * @param data - Des données additionnelles à inclure dans le log (optionnel).
   * @returns Ne retourne rien.
   */
  private log(message: string, data?: any): void {
    if (this.debugMode) {
      console.log(`🏦 ${message}`, data || '');
    }
  }

  /**
   * Crée un objet BudgetData avec des valeurs par défaut.
   * Cette fonction initialise toutes les propriétés nécessaires pour un nouveau budget.
   * @param clientFees - Un tableau des définitions de frais client, non utilisé directement pour la création de données par défaut, mais requis par l'interface.
   * @returns Un objet BudgetData initialisé avec des valeurs par défaut.
   */
  createDefaultData(clientFees: ClientFee[]): BudgetData {
    this.log('Création données par défaut');

    const defaultData: BudgetData = {
      TC_Budget_Mode: 'media',
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
   * Charge les données budgétaires à partir d'un objet Firestore, en appliquant des valeurs par défaut si certaines propriétés sont manquantes.
   * @param firestoreData - L'objet de données brutes récupéré de Firestore.
   * @param clientFees - Un tableau des définitions de frais client.
   * @returns Un objet BudgetData hydraté avec les données de Firestore ou les valeurs par défaut.
   */
  loadFromFirestore(firestoreData: any, clientFees: ClientFee[]): BudgetData {
    this.log('Chargement depuis Firestore', firestoreData);

    console.log("FIREBASE: LECTURE - Fichier: budgetService.ts - Fonction: loadFromFirestore - Path: firestoreData");
    const data = this.createDefaultData(clientFees);

    if (firestoreData) {
      data.TC_Budget_Mode = firestoreData.TC_Budget_Mode || firestoreData.TC_Budget_Mode || 'media';
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

  /**
   * Effectue tous les calculs budgétaires complets en utilisant les données fournies, les frais client, les taux de change et les options de type d'unité.
   * @param data - L'objet BudgetData contenant les entrées budgétaires.
   * @param clientFees - Un tableau des définitions de frais client.
   * @param exchangeRates - Un objet contenant les taux de change.
   * @param campaignCurrency - La devise de la campagne.
   * @param unitTypeOptions - Un tableau d'options de type d'unité avec leurs noms d'affichage.
   * @returns Un objet BudgetCalculationResult indiquant le succès ou l'échec du calcul, avec les données résultantes si le calcul est réussi.
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
      if (data.TC_BudgetInput <= 0 || data.TC_Unit_Price <= 0) {
        return { success: false, error: 'Budget et prix unitaire requis' };
      }

      const feeDefinitions = this.buildFeeDefinitions(data, clientFees);
      this.log('Frais pour calcul', feeDefinitions);

      const selectedUnitType = unitTypeOptions.find(option => option.id === data.TC_Unit_Type);
      const unitTypeDisplayName = selectedUnitType?.SH_Display_Name_FR;

      const budgetInputs: BudgetInputs = {
        costPerUnit: data.TC_Unit_Price,
        realValue: data.TC_Media_Value > 0 ? data.TC_Media_Value : undefined,
        fees: feeDefinitions,
        unitType: data.TC_Unit_Type,
        unitTypeDisplayName
      };

      if (data.TC_Budget_Mode === 'client') {
        budgetInputs.clientBudget = data.TC_BudgetInput;
      } else {
        budgetInputs.mediaBudget = data.TC_BudgetInput;
      }

      const validationErrors = validateBudgetInputs(budgetInputs);
      if (validationErrors.length > 0) {
        return { success: false, error: validationErrors.join(', ') };
      }

      const budgetResults = calculateBudget(budgetInputs);
      this.log('Résultats calculs', budgetResults);

      const effectiveRate = this.calculateExchangeRate(data.TC_BuyCurrency, campaignCurrency, exchangeRates);

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
      console.error("Erreur de calculs:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Construit un tableau de définitions de frais à partir des données budgétaires et des frais client.
   * Ces définitions sont utilisées par le moteur de calcul du budget.
   * @param data - L'objet BudgetData contenant les sélections et les volumes de frais.
   * @param clientFees - Un tableau des définitions de frais client.
   * @returns Un tableau de FeeDefinition prêtes pour le calcul.
   */
  private buildFeeDefinitions(data: BudgetData, clientFees: ClientFee[]): FeeDefinition[] {
    const definitions: FeeDefinition[] = [];

    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);

    sortedFees.forEach((fee, orderIndex) => {
      const feeNumber = orderIndex + 1;
      const optionKey = `TC_Fee_${feeNumber}_Option` as keyof BudgetData;
      const volumeKey = `TC_Fee_${feeNumber}_Volume` as keyof BudgetData;

      const optionId = data[optionKey] as string;
      const volumeValue = data[volumeKey] as number;

      if (optionId && optionId !== '') {
        const selectedOption = fee.options?.find(opt => opt.id === optionId);

        if (selectedOption) {
          let baseValue = selectedOption.FO_Value;
          let customUnits: number | undefined;
          let useCustomVolume: boolean | undefined;
          let customVolume: number | undefined;

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
            case 'Frais fixe':
              if (selectedOption.FO_Editable && volumeValue > 0) {
                baseValue = volumeValue;
              }
              break;
          }

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

    return definitions;
  }

  /**
   * Met à jour un objet BudgetData existant avec les résultats des calculs budgétaires.
   * Cela inclut le volume d'unité, la bonification, les budgets média et client, le taux de change et les montants des frais.
   * @param data - L'objet BudgetData original à mettre à jour.
   * @param budgetResults - Les résultats des calculs budgétaires.
   * @param exchangeRate - Le taux de change effectif utilisé.
   * @param clientFees - Un tableau des définitions de frais client.
   * @returns Un nouvel objet BudgetData avec les valeurs mises à jour.
   */
  private updateDataWithResults(
    data: BudgetData,
    budgetResults: BudgetResults,
    exchangeRate: number,
    clientFees: ClientFee[]
  ): BudgetData {
    const updatedData = { ...data };

    updatedData.TC_Unit_Volume = budgetResults.unitVolume;
    updatedData.TC_Bonification = budgetResults.bonusValue;
    updatedData.TC_Media_Budget = budgetResults.mediaBudget;
    updatedData.TC_Client_Budget = budgetResults.clientBudget;
    updatedData.TC_Currency_Rate = exchangeRate;
    updatedData.TC_Delta = budgetResults.convergenceInfo ?
      Math.abs(budgetResults.convergenceInfo.finalDifference) : 0;

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
   * Calcule le taux de change effectif entre deux devises en utilisant un ensemble de taux de change fournis.
   * @param fromCurrency - La devise de départ.
   * @param toCurrency - La devise cible.
   * @param exchangeRates - Un objet où les clés sont les paires de devises (ex: "USD_CAD") ou la devise de départ, et les valeurs sont les taux.
   * @returns Le taux de change calculé, ou 1 si les devises sont identiques ou si aucun taux n'est trouvé.
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

    console.warn(`⚠️ Taux de change non trouvé pour ${fromCurrency} → ${toCurrency}`);
    return 1;
  }
}

export const budgetService = new BudgetService();