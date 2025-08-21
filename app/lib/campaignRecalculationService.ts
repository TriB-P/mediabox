// app/lib/campaignRecalculationService.ts

/**
 * Service de recalcul des campagnes - Regénère tous les calculs budgétaires des tactiques
 * 
 * Ce service parcourt hiérarchiquement toutes les tactiques d'une campagne
 * (toutes versions → onglets → sections → tactiques) et applique EXACTEMENT les mêmes calculs
 * que ceux effectués dans TactiqueDrawer en utilisant budgetService.calculateComplete :
 * - Logique budget média vs budget client identique
 * - Calculs de frais séquentiels avec calculateFeesCorrectly()
 * - Gestion de la convergence budgétaire
 * - Valeurs héritées de la campagne (Billing_ID, PO)
 * - PRÉSERVATION des versions de taux personnalisées (TC_Currency_Version)
 * - GESTION du changement de devise de campagne (recherche automatique de nouvelles versions)
 * - UTILISATION des NOUVELLES valeurs contextuelles (frais actuels, taux actuels, devise actuelle)
 * - Formatage identique via mapFormToTactique()
 * - 🔥 NOUVEAUX CALCULS : RefCurrency et noms des frais/options
 */

import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { budgetService } from './budgetService';
import { getClientFees, getFeeOptions } from './feeService';
import { getCampaignAdminValues, getCampaignCurrency, getExchangeRates, getDynamicList } from './tactiqueListService';
import { getCurrencyRateByVersion, getCurrencyRatesByPair } from './currencyService';
import { getFeeNamesBatch, getFeeOptionNamesBatch } from './feeService';

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
 * 🔥 NOUVELLE FONCTION : Calcule les montants RefCurrency pour tous les frais
 */
const calculateFeeRefCurrencyAmounts = (
  budgetData: any,
  currencyRate: number
): any => {
  const updates: any = {};
  
  // Calculer pour chaque frais (1 à 5)
  for (let i = 1; i <= 5; i++) {
    const valueKey = `TC_Fee_${i}_Value`;
    const refCurrencyKey = `TC_Fee_${i}_RefCurrency`;
    
    const feeValue = budgetData[valueKey] || 0;
    updates[refCurrencyKey] = feeValue * currencyRate;
  }
  
  return updates;
};

/**
 * 🔥 NOUVELLE FONCTION : Récupère et assigne les noms des frais et options
 */
const assignFeeAndOptionNames = async (
  budgetData: any,
  clientFees: any[],
  clientId: string
): Promise<any> => {
  try {
    const updates: any = {};
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    
    // Préparer les requêtes pour les noms d'options
    const optionRequests: Array<{ feeId: string; optionId: string }> = [];
    
    sortedFees.forEach((fee, orderIndex) => {
      const feeNumber = orderIndex + 1;
      const optionKey = `TC_Fee_${feeNumber}_Option`; // ID de l'option (existant)
      const nameKey = `TC_Fee_${feeNumber}_Name`;
      const optionNameKey = `TC_Fee_${feeNumber}_Option_Name`;
      
      const selectedOptionId = budgetData[optionKey];
      
      // Assigner le nom du frais
      updates[nameKey] = fee.FE_Name;
      
      // Préparer la requête pour le nom de l'option si une option est sélectionnée
      if (selectedOptionId && selectedOptionId !== 'ACTIVE_NO_SELECTION') {
        optionRequests.push({ feeId: fee.id, optionId: selectedOptionId });
      } else {
        updates[optionNameKey] = '';
      }
    });
    
    // Récupérer les noms des options en batch si nécessaire
    if (optionRequests.length > 0) {
      const optionNames = await getFeeOptionNamesBatch(clientId, optionRequests);
      
      sortedFees.forEach((fee, orderIndex) => {
        const feeNumber = orderIndex + 1;
        const optionKey = `TC_Fee_${feeNumber}_Option`;
        const optionNameKey = `TC_Fee_${feeNumber}_Option_Name`;
        
        const selectedOptionId = budgetData[optionKey];
        
        if (selectedOptionId && selectedOptionId !== 'ACTIVE_NO_SELECTION') {
          const key = `${fee.id}:${selectedOptionId}`;
          updates[optionNameKey] = optionNames[key] || '';
        }
      });
    }
    
    return updates;
    
  } catch (error) {
    console.error('Erreur lors de l\'assignation des noms de frais et options:', error);
    return {};
  }
};

/**
 * Résout le taux de change à utiliser pour une tactique
 * Compare TC_BuyCurrency avec CA_Currency et vérifie la compatibilité de TC_Currency_Version
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
        return { rate: specificRate.CU_Rate, version: existingVersion };
      }
    } catch (error) {
      console.warn(`Version ${existingVersion} incompatible pour ${tacticCurrency} → ${campaignCurrency}`);
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
      return { rate: bestRate.CU_Rate, version: bestRate.CU_Year };
    }
  } catch (error) {
    console.warn(`Erreur recherche versions pour ${tacticCurrency} → ${campaignCurrency}:`, error);
  }

  // 4. Fallback: taux automatique
  const automaticRate = context.exchangeRates[tacticCurrency] || 
                        context.exchangeRates[`${tacticCurrency}_${campaignCurrency}`] || 1;
  
  return { rate: automaticRate, version: '' };
};

/**
 * Valide et préserve une option de frais si elle existe encore dans la configuration actuelle
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
    return '';
  }
  
  // Vérifier que l'option spécifique existe encore dans ce frais
  const optionExists = fee.options.some((option: any) => option.id === selectedOptionId);
  
  if (!optionExists) {
    return '';
  }
  
  // Option valide, la préserver
  return selectedOptionId;
};

/**
 * Prépare les données en CONSERVANT les frais valides
 */
const mapTactiqueForBudgetCalculation = (
  tactique: any, 
  context: RecalculationContext, 
  currencyInfo: { rate: number; version: string }
): any => {
  
  // Valider UNE SEULE FOIS chaque option de frais
  const validatedFeeOption1 = validateAndPreserveFeeOption(tactique.TC_Fee_1_Option, context.clientFees, 0);
  const validatedFeeOption2 = validateAndPreserveFeeOption(tactique.TC_Fee_2_Option, context.clientFees, 1);
  const validatedFeeOption3 = validateAndPreserveFeeOption(tactique.TC_Fee_3_Option, context.clientFees, 2);
  const validatedFeeOption4 = validateAndPreserveFeeOption(tactique.TC_Fee_4_Option, context.clientFees, 3);
  const validatedFeeOption5 = validateAndPreserveFeeOption(tactique.TC_Fee_5_Option, context.clientFees, 4);

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
    TC_Fee_1_Option: validatedFeeOption1,
    TC_Fee_1_Volume: validatedFeeOption1 ? (tactique.TC_Fee_1_Volume || 0) : 0,
    TC_Fee_1_Value: 0, // Sera recalculé avec les nouvelles configurations
    
    TC_Fee_2_Option: validatedFeeOption2,
    TC_Fee_2_Volume: validatedFeeOption2 ? (tactique.TC_Fee_2_Volume || 0) : 0,
    TC_Fee_2_Value: 0, // Sera recalculé avec les nouvelles configurations
    
    TC_Fee_3_Option: validatedFeeOption3,
    TC_Fee_3_Volume: validatedFeeOption3 ? (tactique.TC_Fee_3_Volume || 0) : 0,
    TC_Fee_3_Value: 0, // Sera recalculé avec les nouvelles configurations
    
    TC_Fee_4_Option: validatedFeeOption4,
    TC_Fee_4_Volume: validatedFeeOption4 ? (tactique.TC_Fee_4_Volume || 0) : 0,
    TC_Fee_4_Value: 0, // Sera recalculé avec les nouvelles configurations
    
    TC_Fee_5_Option: validatedFeeOption5,
    TC_Fee_5_Volume: validatedFeeOption5 ? (tactique.TC_Fee_5_Volume || 0) : 0,
    TC_Fee_5_Value: 0, // Sera recalculé avec les nouvelles configurations
  };
};

/**
 * Calcule correctement les frais en appliquant les bonnes formules selon le type de frais
 * et la logique séquentielle/cumulative (identique à useBudgetCalculations)
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
        
        calculatedAmount = finalValue * effectiveVolume/1000;
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
        console.warn(`Type de frais non reconnu: ${fee.FE_Calculation_Type}`);
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
 * Arrondit une valeur numérique à 2 décimales
 */
const round2 = (val: any): number => val ? Math.round(Number(val) * 100) / 100 : 0;

/**
 * Applique les calculs budgétaires sur une tactique
 * Utilise directement budgetService au lieu du hook React
 */
const applyBudgetCalculations = async (
  tactique: TactiqueData,
  context: RecalculationContext
): Promise<Partial<TactiqueData> | null> => {
  try {
    // 1. Résoudre et préserver le taux de change personnalisé AVEC LES NOUVELLES DEVISES
    const currencyInfo = await resolveCurrencyRate(tactique, context);

    // 2. Préparer les données budgétaires avec validation des options de frais
    const budgetData = mapTactiqueForBudgetCalculation(tactique, context, currencyInfo);
    
    // 3. Vérifier si on a les données minimales pour calculer
    if (!budgetData.TC_BudgetInput || !budgetData.TC_Unit_Price) {
      return null;
    }

    // 4. Utiliser directement budgetService pour les calculs
    const calculationResult = budgetService.calculateComplete(
      budgetData,
      context.clientFees,
      context.exchangeRates,
      context.campaignCurrency,
      context.unitTypeOptions
    );

    if (!calculationResult.success || !calculationResult.data) {
      console.error(`Erreur calcul tactique ${tactique.id}:`, calculationResult.error);
      return null;
    }

    // 5. Extraire les données calculées et appliquer la correction des frais
    const updatedBudgetData = calculationResult.data.updatedData;
    const correctedFeesAndBonus = calculateFeesCorrectly(updatedBudgetData, context.clientFees);
    
    // 🔥 NOUVEAU : Calculer les montants RefCurrency
    const refCurrencyUpdates = calculateFeeRefCurrencyAmounts({
      ...updatedBudgetData,
      ...correctedFeesAndBonus
    }, currencyInfo.rate);
    
    // 🔥 NOUVEAU : Récupérer et assigner les noms des frais et options
    const namesUpdates = await assignFeeAndOptionNames({
      ...updatedBudgetData,
      ...correctedFeesAndBonus
    }, context.clientFees, context.clientId);
    
    const finalData = {
      ...updatedBudgetData,
      ...correctedFeesAndBonus,
      ...refCurrencyUpdates,
      ...namesUpdates
    };

    // 6. Calculer les budgets en devise de référence (logique TactiqueFormBudget)
    const currency = finalData.TC_BuyCurrency;
    const effectiveRate = currencyInfo.rate || 1;
    const needsConversion = currency !== context.campaignCurrency;
    const finalRate = needsConversion ? effectiveRate : 1;
    
    const refCurrencyBudgets = {
      TC_Client_Budget_RefCurrency: finalData.TC_Client_Budget * finalRate,
      TC_Media_Budget_RefCurrency: finalData.TC_Media_Budget * finalRate
    };

    // 7. Appliquer la fonction mapFormToTactique (même logique que TactiqueDrawer)
    const processedData = {
      ...finalData,
      ...refCurrencyBudgets,
      
      // Budgets arrondis à 2 décimales
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
      
      // Préservation du taux de change personnalisé résolu
      TC_Currency_Rate: round2(currencyInfo.rate),
      TC_Currency_Version: currencyInfo.version,
      
      // Autres champs non-numériques
      TC_Budget_Mode: finalData.TC_Budget_Mode,
      TC_BuyCurrency: finalData.TC_BuyCurrency,
      TC_Unit_Type: finalData.TC_Unit_Type,
      TC_Has_Bonus: finalData.TC_Has_Bonus || false,
      
      // Frais arrondis
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

      // 🔥 NOUVEAUX CHAMPS FRAIS ÉTENDUS ARRONDIS
      TC_Fee_1_RefCurrency: round2(finalData.TC_Fee_1_RefCurrency),
      TC_Fee_1_Option_Name: finalData.TC_Fee_1_Option_Name || '',
      TC_Fee_1_Name: finalData.TC_Fee_1_Name || '',
      TC_Fee_2_RefCurrency: round2(finalData.TC_Fee_2_RefCurrency),
      TC_Fee_2_Option_Name: finalData.TC_Fee_2_Option_Name || '',
      TC_Fee_2_Name: finalData.TC_Fee_2_Name || '',
      TC_Fee_3_RefCurrency: round2(finalData.TC_Fee_3_RefCurrency),
      TC_Fee_3_Option_Name: finalData.TC_Fee_3_Option_Name || '',
      TC_Fee_3_Name: finalData.TC_Fee_3_Name || '',
      TC_Fee_4_RefCurrency: round2(finalData.TC_Fee_4_RefCurrency),
      TC_Fee_4_Option_Name: finalData.TC_Fee_4_Option_Name || '',
      TC_Fee_4_Name: finalData.TC_Fee_4_Name || '',
      TC_Fee_5_RefCurrency: round2(finalData.TC_Fee_5_RefCurrency),
      TC_Fee_5_Option_Name: finalData.TC_Fee_5_Option_Name || '',
      TC_Fee_5_Name: finalData.TC_Fee_5_Name || '',
    };

    // 8. Préparer les updates finales avec valeurs héritées
    const updates: Partial<TactiqueData> = {
      ...processedData,
      updatedAt: new Date().toISOString(),
    };

    // Appliquer les valeurs héritées si nécessaire
    const shouldInheritBilling = !tactique.TC_Billing_ID || tactique.TC_Billing_ID.trim() === '';
    const shouldInheritPO = !tactique.TC_PO || tactique.TC_PO.trim() === '';

    if (shouldInheritBilling && context.campaignAdminValues.CA_Billing_ID) {
      updates.TC_Billing_ID = context.campaignAdminValues.CA_Billing_ID;
    }

    if (shouldInheritPO && context.campaignAdminValues.CA_PO) {
      updates.TC_PO = context.campaignAdminValues.CA_PO;
    }

    return updates;
    
  } catch (error) {
    console.error(`Erreur lors du calcul de la tactique ${tactique.id}:`, error);
    return null;
  }
};

/**
 * Charge le contexte de recalcul (données partagées) avec options de frais
 */
const loadRecalculationContext = async (
  clientId: string,
  campaignId: string
): Promise<RecalculationContext | null> => {
  try {
    console.log(`🔄 Chargement contexte de recalcul pour campagne ${campaignId}`);
    
    // Charger les données de base en parallèle
    const [
      campaignAdminValues,
      baseFees,
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

    // Charger les options pour chaque frais
    const clientFeesWithOptions = await Promise.all(
      baseFees.map(async (fee) => {
        try {
          const options = await getFeeOptions(clientId, fee.id);
          return {
            ...fee,
            options: options
          };
        } catch (error) {
          console.error(`Erreur chargement options pour frais ${fee.id}:`, error);
          return {
            ...fee,
            options: []
          };
        }
      })
    );

    console.log(`✅ Contexte chargé: ${clientFeesWithOptions.length} frais, devise: ${campaignCurrency}`);

    return {
      clientId,
      campaignId,
      campaignAdminValues,
      clientFees: clientFeesWithOptions,
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
      const sectionsCollection = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections');
      const sectionsSnapshot = await getDocs(query(sectionsCollection, orderBy('SECTION_Order')));
      
      // Parcourir toutes les sections
      for (const sectionDoc of sectionsSnapshot.docs) {
        const sectionId = sectionDoc.id;
        
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
                await batch.commit();
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
    
    console.log(`🏁 RECALCUL TERMINÉ en ${durationSeconds}s`);
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