/**
 * Prépare les données de la tactique avec les NOUVELLES valeurs actuelles
 * SIMPLE: Garde les données de la tactique mais injecte les nouvelles valeurs contextuelles
 */
const mapTactiqueForBudgetCalculation = (tactique: any, context: RecalculationContext, currencyInfo: { rate: number; version: string }): any => {
    return {
      // Données de la tactique (inchangées)
      TC_Budget_Mode: tactique.TC_Budget_Mode || 'media',
      TC_BudgetInput: tactique.TC_BudgetInput || tactique.TC_Budget || 0,
      TC_Unit_Price: tactique.TC_Unit_Price || tactique.TC_Cost_Per_Unit || 0,
      TC_Unit_Volume: tactique.TC_Unit_Volume || 0,
      TC_Media_Value: tactique.TC_Media_Value || tactique.TC_Real_Value || 0,
      TC_Bonification: tactique.TC_Bonification || tactique.TC_Bonus_Value || 0,
      TC_Media_Budget: tactique.TC_Media_Budget || 0,
      TC_Client_Budget: tactique.TC_Client_Budget || 0,
      TC_BuyCurrency: tactique.TC_BuyCurrency || tactique.TC_Currency || 'CAD',
      TC_Delta: tactique.TC_Delta || 0,
      TC_Unit_Type: tactique.TC_Unit_Type || '',
      TC_Has_Bonus: tactique.TC_Has_Bonus || false,
      
      // NOUVELLES valeurs contextuelles
      TC_Currency_Rate: currencyInfo.rate,
      TC_Currency_Version: currencyInfo.version,
      
      // Frais: garder les sélections mais reset les valeurs (seront recalculées)
      TC_Fee_1_Option: tactique.TC_Fee_1_Option || '',
      TC_Fee_1_Volume: tactique.TC_Fee_1_Volume || 0,
      TC_Fee_1_Value: 0,
      TC_Fee_2_Option: tactique.TC_Fee_2_Option || '',
      TC_Fee_2_Volume: tactique.TC_Fee_2_Volume || 0,
      TC_Fee_2_Value: 0,
      TC_Fee_3_Option: tactique.TC_Fee_3_Option || '',
      TC_Fee_3_Volume: tactique.TC_Fee_3_Volume || 0,
      TC_Fee_3_Value: 0,
      TC_Fee_4_Option: tactique.TC_Fee_4_Option || '',
      TC_Fee_4_Volume: tactique.TC_Fee_4_Volume || 0,
      TC_Fee_4_Value: 0,
      TC_Fee_5_Option: tactique.TC_Fee_5_Option || '',
      TC_Fee_5_Volume: tactique.TC_Fee_5_Volume || 0,
      TC_Fee_5_Value: 0,
    };
  };
  
  /**
   * Valide qu'une option de frais sélectionnée existe encore dans la configuration actuelle des frais
   * Si l'option n'existe plus, retourne une chaîne vide pour désactiver le frais
   */
  const validateFeeOption = (selectedOptionId: string | undefined, clientFees: any[], feeIndex: number): string => {
    if (!selectedOptionId || selectedOptionId.trim() === '') {
      return '';
    }
    
    // Trouver le frais correspondant (trié par ordre)
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    const fee = sortedFees[feeIndex];
    
    if (!fee || !fee.options) {
      console.log(`⚠️ Frais ${feeIndex + 1} n'existe plus, désactivation`);
      return '';
    }
    
    // Vérifier que l'option existe encore
    const optionExists = fee.options.some((option: any) => option.id === selectedOptionId);
    
    if (!optionExists) {
      console.log(`⚠️ Option ${selectedOptionId} du frais ${fee.FE_Name} n'existe plus, désactivation`);
      return '';
    }
    
    return selectedOptionId;
  };
  

  import {
    collection,
    doc,
    getDocs,
    query,
    orderBy,
    writeBatch,
    getDoc,
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { budgetService } from './budgetService';
  import { getClientFees } from './feeService';
  import { getCampaignAdminValues, getCampaignCurrency, getExchangeRates, getDynamicList } from './tactiqueListService';
  import { getCurrencyRateByVersion, getCurrencyRatesByPair } from './currencyService';
  import { useBudgetCalculationsReadOnly } from '../hooks/useBudgetCalculations';
  
  interface RecalculationResult {
    success: boolean;
    updatedCount: number;
    versionsProcessed: number;
    errorsCount: number;
    errors: string[];
  }
  
  interface TactiqueData {
    id: string;
    [key: string]: any;
  }
  
  interface RecalculationContext {
    clientId: string;
    campaignId: string;
    campaignAdminValues: { CA_Billing_ID?: string; CA_PO?: string };
    clientFees: any[];
    campaignCurrency: string;
    exchangeRates: { [key: string]: number };
    unitTypeOptions: Array<{ id: string; SH_Display_Name_FR: string }>;
  }
  
  /**
   * Résout le taux de change à utiliser pour une tactique
   * SIMPLE: Compare TC_BuyCurrency avec CA_Currency et vérifie la compatibilité de TC_Currency_Version
   */
  const resolveCurrencyRate = async (
    tactique: TactiqueData,
    context: RecalculationContext
  ): Promise<{ rate: number; version: string }> => {
    
    const tacticCurrency = tactique.TC_BuyCurrency || tactique.TC_Currency || 'CAD';
    const campaignCurrency = context.campaignCurrency;
    const existingVersion = tactique.TC_Currency_Version || '';
  
    // 1. Si même devise → pas de conversion
    if (tacticCurrency === campaignCurrency) {
      return { rate: 1, version: '' };
    }
  
    console.log(`🔄 Vérification taux: ${tacticCurrency} → ${campaignCurrency} (version: ${existingVersion || 'aucune'})`);
  
    // 2. Si version spécifique → vérifier si elle est compatible avec la paire actuelle
    if (existingVersion) {
      try {
        const specificRate = await getCurrencyRateByVersion(
          context.clientId,
          tacticCurrency,
          campaignCurrency,
          existingVersion
        );
  
        if (specificRate) {
          console.log(`✅ Version compatible: ${existingVersion} = ${specificRate.CU_Rate}`);
          return { rate: specificRate.CU_Rate, version: existingVersion };
        } else {
          console.log(`❌ Version ${existingVersion} incompatible pour ${tacticCurrency} → ${campaignCurrency}`);
        }
      } catch (error) {
        console.error(`❌ Erreur vérification version ${existingVersion}:`, error);
      }
    }
  
    // 3. Chercher une version compatible pour la paire actuelle
    try {
      const availableRates = await getCurrencyRatesByPair(
        context.clientId,
        tacticCurrency,
        campaignCurrency
      );
  
      if (availableRates.length > 0) {
        const bestRate = availableRates[0]; // Plus récente
        console.log(`🔄 Nouvelle version: ${bestRate.CU_Year} = ${bestRate.CU_Rate}`);
        return { rate: bestRate.CU_Rate, version: bestRate.CU_Year };
      }
    } catch (error) {
      console.error(`❌ Erreur recherche versions:`, error);
    }
  
    // 4. Fallback: taux automatique
    const automaticRate = context.exchangeRates[tacticCurrency] || 
                          context.exchangeRates[`${tacticCurrency}_${campaignCurrency}`] || 1;
    
    console.log(`🔄 Taux automatique: ${automaticRate}`);
    return { rate: automaticRate, version: '' };
  };
  
  /**
   * Arrondit une valeur numérique à 2 décimales
   */
  const round2 = (val: any): number => val ? Math.round(Number(val) * 100) / 100 : 0;

  


// app/lib/campaignRecalculationService.ts - Fonction applyBudgetCalculations corrigée

/**
 * Applique les calculs budgétaires sur une tactique
 * CORRIGÉ : Utilise directement budgetService au lieu du hook + validation des frais
 */
const applyBudgetCalculations = async (
    tactique: TactiqueData,
    context: RecalculationContext
  ): Promise<Partial<TactiqueData> | null> => {
    try {
      // 1. Résoudre et préserver le taux de change personnalisé AVEC LES NOUVELLES DEVISES
      const currencyInfo = await resolveCurrencyRate(tactique, context);
  
      // 2. Préparer les données budgétaires avec VALIDATION des options de frais
      const budgetData = mapTactiqueForBudgetCalculationCorrected(tactique, context, currencyInfo);
      
      // 3. Vérifier si on a les données minimales pour calculer
      if (!budgetData.TC_BudgetInput || !budgetData.TC_Unit_Price) {
        console.log(`⚠️ Tactique ${tactique.id} : données budgétaires insuffisantes, ignorer`);
        return null;
      }
  
      console.log(`🔄 Calcul tactique ${tactique.id} avec:`);
      console.log(`   - Frais: ${context.clientFees.length} configurés`);
      console.log(`   - Devise: ${budgetData.TC_BuyCurrency} → ${context.campaignCurrency}`);
      console.log(`   - Taux: ${currencyInfo.rate} (${currencyInfo.version || 'auto'})`);
  
      // 4. UTILISER DIRECTEMENT budgetService au lieu du hook
      const calculationResult = budgetService.calculateComplete(
        budgetData,                    // Données de la tactique + nouvelles valeurs contextuelles
        context.clientFees,            // NOUVEAUX frais du client
        context.exchangeRates,         // NOUVEAUX taux de change
        context.campaignCurrency,      // NOUVELLE devise de campagne
        context.unitTypeOptions        // Types d'unité actuels
      );
  
      if (!calculationResult.success || !calculationResult.data) {
        console.error(`❌ Erreur calcul tactique ${tactique.id}:`, calculationResult.error);
        return null;
      }
  
      // 5. Extraire les données calculées (même logique que TactiqueDrawer)
      const updatedBudgetData = calculationResult.data.updatedData;
      
      // 6. Appliquer la correction des frais (même logique que useBudgetCalculations)
      const correctedFeesAndBonus = calculateFeesCorrectly(updatedBudgetData, context.clientFees);
      
      const finalData = {
        ...updatedBudgetData,
        ...correctedFeesAndBonus
      };
  
      // 7. Calculer les budgets en devise de référence (logique TactiqueFormBudget)
      const currency = finalData.TC_BuyCurrency;
      const effectiveRate = currencyInfo.rate || 1;
      const needsConversion = currency !== context.campaignCurrency;
      const finalRate = needsConversion ? effectiveRate : 1;
      
      const refCurrencyBudgets = {
        TC_Client_Budget_RefCurrency: finalData.TC_Client_Budget * finalRate,
        TC_Media_Budget_RefCurrency: finalData.TC_Media_Budget * finalRate
      };
  
      // 8. Appliquer la fonction mapFormToTactique (même logique que TactiqueDrawer)
      const processedData = {
        ...finalData,
        ...refCurrencyBudgets, // Ajouter les budgets de référence calculés
        
        // Budgets arrondis à 2 décimales (même logique que mapFormToTactique)
        TC_Budget: round2(finalData.TC_Client_Budget),
        TC_Media_Budget: round2(finalData.TC_Media_Budget),
        TC_Client_Budget: round2(finalData.TC_Client_Budget),
        TC_Client_Budget_RefCurrency: round2(refCurrencyBudgets.TC_Client_Budget_RefCurrency),
        TC_Media_Budget_RefCurrency: round2(refCurrencyBudgets.TC_Media_Budget_RefCurrency),
        
        // Paramètres budgétaires arrondis
        TC_BudgetInput: round2(finalData.TC_BudgetInput),
        TC_Unit_Price: round2(finalData.TC_Unit_Price),
        TC_Unit_Volume: round2(finalData.TC_Unit_Volume),
        TC_Media_Value: round2(finalData.TC_Media_Value),
        TC_Bonification: round2(finalData.TC_Bonification),
        TC_Delta: round2(finalData.TC_Delta),
        
        // PRÉSERVATION DU TAUX DE CHANGE PERSONNALISÉ RÉSOLU
        TC_Currency_Rate: round2(currencyInfo.rate),
        TC_Currency_Version: currencyInfo.version,
        
        // Autres champs non-numériques
        TC_Budget_Mode: finalData.TC_Budget_Mode,
        TC_BuyCurrency: finalData.TC_BuyCurrency,
        TC_Unit_Type: finalData.TC_Unit_Type,
        TC_Has_Bonus: finalData.TC_Has_Bonus || false,
        
        // Frais arrondis (même logique que mapFormToTactique)
        TC_Fee_1_Option: finalData.TC_Fee_1_Option || '',
        TC_Fee_1_Volume: round2(finalData.TC_Fee_1_Volume),
        TC_Fee_1_Value: round2(finalData.TC_Fee_1_Value),
        TC_Fee_2_Option: finalData.TC_Fee_2_Option || '',
        TC_Fee_2_Volume: round2(finalData.TC_Fee_2_Volume),
        TC_Fee_2_Value: round2(finalData.TC_Fee_2_Value),
        TC_Fee_3_Option: finalData.TC_Fee_3_Option || '',
        TC_Fee_3_Volume: round2(finalData.TC_Fee_3_Volume),
        TC_Fee_3_Value: round2(finalData.TC_Fee_3_Value),
        TC_Fee_4_Option: finalData.TC_Fee_4_Option || '',
        TC_Fee_4_Volume: round2(finalData.TC_Fee_4_Volume),
        TC_Fee_4_Value: round2(finalData.TC_Fee_4_Value),
        TC_Fee_5_Option: finalData.TC_Fee_5_Option || '',
        TC_Fee_5_Volume: round2(finalData.TC_Fee_5_Volume),
        TC_Fee_5_Value: round2(finalData.TC_Fee_5_Value),
      };
  
      // 9. Préparer les updates finales
      const updates: Partial<TactiqueData> = {
        ...processedData,
        updatedAt: new Date().toISOString(),
      };
  
      // 10. Appliquer les valeurs héritées si nécessaire (même logique que TactiqueDrawer)
      const shouldInheritBilling = !tactique.TC_Billing_ID || tactique.TC_Billing_ID.trim() === '';
      const shouldInheritPO = !tactique.TC_PO || tactique.TC_PO.trim() === '';
  
      if (shouldInheritBilling && context.campaignAdminValues.CA_Billing_ID) {
        updates.TC_Billing_ID = context.campaignAdminValues.CA_Billing_ID;
      }
  
      if (shouldInheritPO && context.campaignAdminValues.CA_PO) {
        updates.TC_PO = context.campaignAdminValues.CA_PO;
      }
  
      console.log(`✅ Tactique ${tactique.id} recalculée avec nouvelles valeurs contextuelles`);
      console.log(`   - Budget média: ${processedData.TC_Media_Budget} ${budgetData.TC_BuyCurrency}`);
      console.log(`   - Budget client: ${processedData.TC_Client_Budget} ${budgetData.TC_BuyCurrency}`);
      console.log(`   - Budget média RefCurrency: ${processedData.TC_Media_Budget_RefCurrency} ${context.campaignCurrency}`);
      console.log(`   - Budget client RefCurrency: ${processedData.TC_Client_Budget_RefCurrency} ${context.campaignCurrency}`);
      console.log(`   - Taux utilisé: ${finalRate} (${needsConversion ? 'conversion requise' : 'même devise'})`);
      console.log(`   - Frais total: ${(processedData.TC_Fee_1_Value + processedData.TC_Fee_2_Value + processedData.TC_Fee_3_Value + processedData.TC_Fee_4_Value + processedData.TC_Fee_5_Value).toFixed(2)}`);
  
      return updates;
      
    } catch (error) {
      console.error(`❌ Erreur lors du calcul de la tactique ${tactique.id}:`, error);
      return null;
    }
  };

  // app/lib/campaignRecalculationService.ts - Fonction validateAndPreserveFeeOption

/**
 * Valide et préserve une option de frais si elle existe encore dans la configuration actuelle
 * Retourne l'option originale si elle est valide, sinon chaîne vide pour la supprimer
 * 
 * @param selectedOptionId L'ID de l'option actuellement sélectionnée dans la tactique
 * @param clientFees La liste actuelle des frais configurés pour le client
 * @param feeIndex L'index du frais (0-4 pour frais 1-5)
 * @returns L'ID de l'option si elle existe encore, sinon chaîne vide
 */
const validateAndPreserveFeeOption = (
    selectedOptionId: string | undefined, 
    clientFees: any[], 
    feeIndex: number
  ): string => {
    // Si pas d'option sélectionnée, rien à préserver
    if (!selectedOptionId || selectedOptionId.trim() === '' || selectedOptionId === 'ACTIVE_NO_SELECTION') {
      return '';
    }
    
    // Trouver le frais correspondant (trié par ordre comme dans l'interface)
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    const fee = sortedFees[feeIndex];
    
    // Si le frais n'existe plus dans la configuration
    if (!fee || !fee.options) {
      console.log(`⚠️ Frais ${feeIndex + 1} n'existe plus dans la configuration, suppression de l'option ${selectedOptionId}`);
      return '';
    }
    
    // Vérifier que l'option spécifique existe encore dans ce frais
    const optionExists = fee.options.some((option: any) => option.id === selectedOptionId);
    
    if (!optionExists) {
      console.log(`⚠️ Option ${selectedOptionId} du frais "${fee.FE_Name}" n'existe plus, suppression`);
      return '';
    }
    
    // Option valide, la préserver
    console.log(`✅ Option ${selectedOptionId} du frais "${fee.FE_Name}" préservée`);
    return selectedOptionId;
  };
  
  /**
   * NOUVELLE FONCTION : Prépare les données en CONSERVANT les frais valides
   */
  const mapTactiqueForBudgetCalculationCorrected = (
    tactique: any, 
    context: RecalculationContext, 
    currencyInfo: { rate: number; version: string }
  ): any => {
    
    // Valider et conserver les options de frais existantes
    const preservedFees = {
      TC_Fee_1_Option: validateAndPreserveFeeOption(tactique.TC_Fee_1_Option, context.clientFees, 0),
      TC_Fee_1_Volume: validateAndPreserveFeeOption(tactique.TC_Fee_1_Option, context.clientFees, 0) ? (tactique.TC_Fee_1_Volume || 0) : 0,
      
      TC_Fee_2_Option: validateAndPreserveFeeOption(tactique.TC_Fee_2_Option, context.clientFees, 1),
      TC_Fee_2_Volume: validateAndPreserveFeeOption(tactique.TC_Fee_2_Option, context.clientFees, 1) ? (tactique.TC_Fee_2_Volume || 0) : 0,
      
      TC_Fee_3_Option: validateAndPreserveFeeOption(tactique.TC_Fee_3_Option, context.clientFees, 2),
      TC_Fee_3_Volume: validateAndPreserveFeeOption(tactique.TC_Fee_3_Option, context.clientFees, 2) ? (tactique.TC_Fee_3_Volume || 0) : 0,
      
      TC_Fee_4_Option: validateAndPreserveFeeOption(tactique.TC_Fee_4_Option, context.clientFees, 3),
      TC_Fee_4_Volume: validateAndPreserveFeeOption(tactique.TC_Fee_4_Option, context.clientFees, 3) ? (tactique.TC_Fee_4_Volume || 0) : 0,
      
      TC_Fee_5_Option: validateAndPreserveFeeOption(tactique.TC_Fee_5_Option, context.clientFees, 4),
      TC_Fee_5_Volume: validateAndPreserveFeeOption(tactique.TC_Fee_5_Option, context.clientFees, 4) ? (tactique.TC_Fee_5_Volume || 0) : 0,
    };
  
    console.log(`🔄 Préservation frais tactique ${tactique.id}:`);
    for (let i = 1; i <= 5; i++) {
      const optionKey = `TC_Fee_${i}_Option` as keyof typeof preservedFees;
      const volumeKey = `TC_Fee_${i}_Volume` as keyof typeof preservedFees;
      if (preservedFees[optionKey]) {
        console.log(`   - Frais ${i}: ${preservedFees[optionKey]} (volume: ${preservedFees[volumeKey]})`);
      }
    }
  
    return {
      // Données de la tactique (inchangées)
      TC_Budget_Mode: tactique.TC_Budget_Mode || 'media',
      TC_BudgetInput: tactique.TC_BudgetInput || tactique.TC_Budget || 0,
      TC_Unit_Price: tactique.TC_Unit_Price || tactique.TC_Cost_Per_Unit || 0,
      TC_Unit_Volume: tactique.TC_Unit_Volume || 0,
      TC_Media_Value: tactique.TC_Media_Value || tactique.TC_Real_Value || 0,
      TC_Bonification: tactique.TC_Bonification || tactique.TC_Bonus_Value || 0,
      TC_Media_Budget: tactique.TC_Media_Budget || 0,
      TC_Client_Budget: tactique.TC_Client_Budget || 0,
      TC_BuyCurrency: tactique.TC_BuyCurrency || tactique.TC_Currency || 'CAD',
      TC_Delta: tactique.TC_Delta || 0,
      TC_Unit_Type: tactique.TC_Unit_Type || '',
      TC_Has_Bonus: tactique.TC_Has_Bonus || false,
      
      // NOUVELLES valeurs contextuelles
      TC_Currency_Rate: currencyInfo.rate,
      TC_Currency_Version: currencyInfo.version,
      
      // Frais PRÉSERVÉS : garder les sélections ET volumes existants, seules les valeurs seront recalculées
      ...preservedFees,
      TC_Fee_1_Value: 0, // Sera recalculé avec les nouvelles configurations
      TC_Fee_2_Value: 0, // Sera recalculé avec les nouvelles configurations
      TC_Fee_3_Value: 0, // Sera recalculé avec les nouvelles configurations
      TC_Fee_4_Value: 0, // Sera recalculé avec les nouvelles configurations
      TC_Fee_5_Value: 0, // Sera recalculé avec les nouvelles configurations
    };
  };
  
  /**
   * FONCTION UTILITAIRE : calculateFeesCorrectly importée depuis useBudgetCalculations
   * Cette fonction doit être copiée/importée depuis le hook
   */
  function calculateFeesCorrectly(
    budgetData: any, 
    clientFees: any[]
  ): any {
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
      
      const selectedOption = fee.options?.find((opt: any) => opt.id === selectedOptionId);
  
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
    
    return updates;
  }



  
  /**
   * Charge le contexte de recalcul (données partagées)
   */
  const loadRecalculationContext = async (
    clientId: string,
    campaignId: string
  ): Promise<RecalculationContext | null> => {
    try {
      console.log(`🔄 Chargement contexte de recalcul pour campagne ${campaignId}`);
      
      // Charger les données nécessaires en parallèle
      const [
        campaignAdminValues,
        clientFees,
        campaignCurrency,
        exchangeRates,
        unitTypeList
      ] = await Promise.all([
        getCampaignAdminValues(clientId, campaignId),
        getClientFees(clientId),
        getCampaignCurrency(clientId, campaignId),
        getExchangeRates(clientId),
        getDynamicList('TC_Unit_Type', clientId).catch(() => [])
      ]);
  
      console.log(`✅ Contexte chargé: ${clientFees.length} frais, devise: ${campaignCurrency}`);
  
      return {
        clientId,
        campaignId,
        campaignAdminValues,
        clientFees,
        campaignCurrency,
        exchangeRates,
        unitTypeOptions: unitTypeList.map(item => ({
          id: item.id,
          SH_Display_Name_FR: item.SH_Display_Name_FR
        }))
      };
      
    } catch (error) {
      console.error('❌ Erreur chargement contexte:', error);
      return null;
    }
  };
  
  /**
   * Traite toutes les tactiques d'une version spécifique
   */
  const processVersionTactics = async (
    clientId: string,
    campaignId: string,
    versionId: string,
    context: RecalculationContext,
    progressCallback?: (progress: number) => void
  ): Promise<{ updatedCount: number; errors: string[] }> => {
    
    const errors: string[] = [];
    let updatedCount = 0;
    let processedCount = 0;
    
    try {
      console.log(`📁 Traitement version ${versionId}`);
      
      // Récupérer tous les onglets
      const ongletsCollection = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets');
      const ongletsSnapshot = await getDocs(query(ongletsCollection, orderBy('ONGLET_Order')));
      
      const ongletIds = ongletsSnapshot.docs.map(doc => doc.id);
      console.log(`📂 ${ongletIds.length} onglets trouvés`);
      
      // Compter le nombre total de tactiques pour la progression
      let totalTactics = 0;
      for (const ongletId of ongletIds) {
        const sectionsCollection = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections');
        const sectionsSnapshot = await getDocs(sectionsCollection);
        
        for (const sectionDoc of sectionsSnapshot.docs) {
          const tactiquesCollection = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionDoc.id, 'tactiques');
          const tactiquesSnapshot = await getDocs(tactiquesCollection);
          totalTactics += tactiquesSnapshot.docs.length;
        }
      }
      
      console.log(`🎯 ${totalTactics} tactiques à traiter au total`);
      
      if (totalTactics === 0) {
        return { updatedCount: 0, errors: [] };
      }
  
      // Traitement par batch pour optimiser Firebase
      const batch = writeBatch(db);
      let batchCount = 0;
      const MAX_BATCH_SIZE = 500;
      
      // Parcourir tous les onglets
      for (const ongletId of ongletIds) {
        console.log(`📂 Traitement onglet ${ongletId}`);
        
        const sectionsCollection = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections');
        const sectionsSnapshot = await getDocs(query(sectionsCollection, orderBy('SECTION_Order')));
        
        // Parcourir toutes les sections
        for (const sectionDoc of sectionsSnapshot.docs) {
          const sectionId = sectionDoc.id;
          console.log(`📄 Traitement section ${sectionId}`);
          
          const tactiquesCollection = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques');
          const tactiquesSnapshot = await getDocs(query(tactiquesCollection, orderBy('TC_Order')));
          
          // Traiter toutes les tactiques de la section
          for (const tactiqueDoc of tactiquesSnapshot.docs) {
            const tactiqueData = { id: tactiqueDoc.id, ...tactiqueDoc.data() } as TactiqueData;
            
            try {
              // Appliquer les calculs
              const updates = await applyBudgetCalculations(tactiqueData, context);
              
              if (updates) {
                // Ajouter au batch
                const tactiqueRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueDoc.id);
                batch.update(tactiqueRef, updates);
                batchCount++;
                updatedCount++;
                
                // Exécuter le batch si on atteint la limite
                if (batchCount >= MAX_BATCH_SIZE) {
                  console.log(`💾 Exécution batch (${batchCount} mises à jour)`);
                  await batch.commit();
                  // Créer un nouveau batch
                  batchCount = 0;
                }
              }
              
            } catch (tactiqueError) {
              const errorMsg = `Erreur tactique ${tactiqueData.id}: ${tactiqueError instanceof Error ? tactiqueError.message : 'Erreur inconnue'}`;
              console.error(`❌ ${errorMsg}`);
              errors.push(errorMsg);
            }
            
            // Mettre à jour la progression
            processedCount++;
            if (progressCallback && totalTactics > 0) {
              const progress = (processedCount / totalTactics) * 100;
              progressCallback(progress);
            }
          }
        }
      }
      
      // Exécuter le batch final s'il reste des opérations
      if (batchCount > 0) {
        console.log(`💾 Exécution batch final (${batchCount} mises à jour)`);
        await batch.commit();
      }
      
      console.log(`✅ Version ${versionId} traitée: ${updatedCount} tactiques mises à jour, ${errors.length} erreurs`);
      
      return { updatedCount, errors };
      
    } catch (error) {
      const errorMsg = `Erreur traitement version ${versionId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      return { updatedCount, errors };
    }
  };
  
  /**
   * FONCTION PRINCIPALE : Recalcule toutes les tactiques d'une campagne
   */
  export const recalculateAllCampaignTactics = async (
    clientId: string,
    campaignId: string,
    progressCallback?: (progress: number) => void
  ): Promise<RecalculationResult> => {
    
    console.log(`🚀 DÉBUT RECALCUL CAMPAGNE ${campaignId}`);
    const startTime = Date.now();
    
    try {
      // 1. Charger le contexte de recalcul
      const context = await loadRecalculationContext(clientId, campaignId);
      if (!context) {
        throw new Error('Impossible de charger le contexte de recalcul');
      }
  
      // 2. Récupérer toutes les versions de la campagne
      const versionsCollection = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions');
      const versionsSnapshot = await getDocs(versionsCollection);
      const versionIds = versionsSnapshot.docs.map(doc => doc.id);
      
      console.log(`📚 ${versionIds.length} versions trouvées: ${versionIds.join(', ')}`);
      
      if (versionIds.length === 0) {
        return {
          success: true,
          updatedCount: 0,
          versionsProcessed: 0,
          errorsCount: 0,
          errors: []
        };
      }
  
      // 3. Traiter chaque version
      let totalUpdatedCount = 0;
      let allErrors: string[] = [];
      let versionProgress = 0;
      
      for (let i = 0; i < versionIds.length; i++) {
        const versionId = versionIds[i];
        
        try {
          const result = await processVersionTactics(
            clientId,
            campaignId,
            versionId,
            context,
            (versionProgressValue) => {
              // Calculer progression globale
              const overallProgress = ((i / versionIds.length) * 100) + ((versionProgressValue / versionIds.length));
              if (progressCallback) {
                progressCallback(Math.min(overallProgress, 100));
              }
            }
          );
          
          totalUpdatedCount += result.updatedCount;
          allErrors.push(...result.errors);
          
        } catch (versionError) {
          const errorMsg = `Erreur version ${versionId}: ${versionError instanceof Error ? versionError.message : 'Erreur inconnue'}`;
          console.error(`❌ ${errorMsg}`);
          allErrors.push(errorMsg);
        }
      }
      
      // 4. Progression finale
      if (progressCallback) {
        progressCallback(100);
      }
      
      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTime) / 1000);
      
      console.log(`🏁 RECALCUL TERMINÉ en ${durationSeconds}s avec logique identique à TactiqueDrawer`);
      console.log(`🆕 Toutes les tactiques utilisent maintenant les NOUVELLES valeurs contextuelles`);
      console.log(`📊 Résultats: ${totalUpdatedCount} tactiques mises à jour, ${allErrors.length} erreurs`);
      
      if (allErrors.length > 0) {
        console.log(`❌ Erreurs rencontrées:`, allErrors);
      }
  
      return {
        success: true,
        updatedCount: totalUpdatedCount,
        versionsProcessed: versionIds.length,
        errorsCount: allErrors.length,
        errors: allErrors
      };
      
    } catch (error) {
      console.error('❌ ERREUR CRITIQUE RECALCUL:', error);
      
      return {
        success: false,
        updatedCount: 0,
        versionsProcessed: 0,
        errorsCount: 1,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue lors du recalcul']
      };
    }
  };