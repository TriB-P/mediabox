// app/lib/budgetCalculations.ts

/**
 * SYSTÈME DE CALCUL DES FRAIS MÉDIA - VERSION REBUILD AVEC CONVERGENCE
 * 
 * Ce fichier contient toute la logique de calcul bidirectionnel des budgets média,
 * remplaçant l'ancien système itératif par des calculs mathématiques précis.
 * 
 * NOUVEAU: Gestion de la convergence et des écarts
 */

// ==================== TYPES ====================

export type FeeCalculationType = 'Pourcentage budget' | 'Volume d\'unité' | 'Unités' | 'Frais fixe';
export type FeeCalculationMode = 'Directement sur le budget média' | 'Applicable sur les frais précédents';
export type BudgetMode = 'client' | 'media';

export interface FeeDefinition {
  id: string;
  name: string;
  calculationType: FeeCalculationType;
  calculationMode: FeeCalculationMode;
  order: number;
  value: number;          // Valeur de base (% en décimal pour pourcentages, montant pour autres)
  buffer: number;         // Buffer en % (ex: 5 pour +5%)
  customUnits?: number;   // Nombre d'unités pour type "Unités"
}

export interface BudgetInputs {
  // Un seul des deux doit être fourni
  mediaBudget?: number;
  clientBudget?: number;
  
  // Paramètres pour calculs
  costPerUnit: number;
  realValue?: number;     // Valeur réelle (bonification)
  unitVolume?: number;    // Volume d'unités (optionnel, calculé si absent)
  
  // Frais à appliquer
  fees: FeeDefinition[];
}

// NOUVEAU: Interface pour les informations de convergence
export interface ConvergenceInfo {
  hasConverged: boolean;      // La convergence a-t-elle réussie ?
  finalDifference: number;    // Écart final en dollars
  iterations: number;         // Nombre d'itérations utilisées
  tolerance: number;          // Tolérance utilisée
  targetBudget: number;       // Budget visé
  actualCalculatedTotal: number; // Total réellement calculé
}

export interface BudgetResults {
  mediaBudget: number;
  clientBudget: number;
  effectiveBudgetForVolume: number; // Budget média + bonification
  unitVolume: number;
  totalFees: number;
  feeDetails: FeeCalculationDetail[];
  hasBonus: boolean;
  bonusValue: number;
  
  // NOUVEAU: Informations de convergence (optionnel, seulement pour calcul inverse)
  convergenceInfo?: ConvergenceInfo;
}

export interface FeeCalculationDetail {
  feeId: string;
  feeName: string;
  calculationType: FeeCalculationType;
  baseValue: number;      // Valeur avec buffer appliqué
  appliedOn: number;      // Montant sur lequel le frais s'applique
  calculatedAmount: number;
  description: string;    // Description du calcul
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Applique le buffer à une valeur de frais
 */
export const applyBuffer = (baseValue: number, bufferPercent: number): number => {
  return baseValue * (1 + bufferPercent / 100);
};

/**
 * Trie les frais par ordre d'application
 */
export const sortFeesByOrder = (fees: FeeDefinition[]): FeeDefinition[] => {
  return [...fees].sort((a, b) => a.order - b.order);
};

/**
 * Calcule le volume d'unités basé sur le budget effectif et le coût par unité
 */
export const calculateUnitVolume = (effectiveBudget: number, costPerUnit: number): number => {
  if (costPerUnit <= 0) return 0;
  return Math.round(effectiveBudget / costPerUnit);
};

/**
 * Calcule le budget effectif pour le volume (média + bonification)
 */
export const calculateEffectiveBudgetForVolume = (mediaBudget: number, realValue?: number): number => {
  if (realValue && realValue > mediaBudget) {
    return realValue; // Utilise la valeur réelle si elle est supérieure
  }
  return mediaBudget;
};

/**
 * Calcule un frais individuel selon son type et mode
 */
export const calculateSingleFee = (
  fee: FeeDefinition,
  mediaBudget: number,
  cumulativeBase: number,
  unitVolume: number
): FeeCalculationDetail => {
  
  const valueWithBuffer = applyBuffer(fee.value, fee.buffer);
  let calculatedAmount = 0;
  let appliedOn = 0;
  let description = '';
  
  switch (fee.calculationType) {
    case 'Frais fixe':
      calculatedAmount = valueWithBuffer;
      appliedOn = 0; // Ne s'applique sur rien
      description = `Montant fixe de ${valueWithBuffer.toFixed(2)}$`;
      break;
      
    case 'Unités':
      const units = fee.customUnits || 1;
      calculatedAmount = valueWithBuffer * units;
      appliedOn = units;
      description = `${valueWithBuffer.toFixed(2)}$ × ${units} unités`;
      break;
      
    case 'Volume d\'unité':
      calculatedAmount = valueWithBuffer * unitVolume;
      appliedOn = unitVolume;
      description = `${valueWithBuffer.toFixed(4)}$ × ${unitVolume} unités de volume`;
      break;
      
    case 'Pourcentage budget':
      if (fee.calculationMode === 'Directement sur le budget média') {
        appliedOn = mediaBudget;
        calculatedAmount = valueWithBuffer * mediaBudget;
        description = `${(valueWithBuffer * 100).toFixed(2)}% × Budget média (${mediaBudget.toFixed(2)}$)`;
      } else {
        // 'Applicable sur les frais précédents'
        appliedOn = cumulativeBase;
        calculatedAmount = valueWithBuffer * cumulativeBase;
        description = `${(valueWithBuffer * 100).toFixed(2)}% × Base cumulative (${cumulativeBase.toFixed(2)}$)`;
      }
      break;
      
    default:
      throw new Error(`Type de frais non supporté: ${fee.calculationType}`);
  }
  
  return {
    feeId: fee.id,
    feeName: fee.name,
    calculationType: fee.calculationType,
    baseValue: valueWithBuffer,
    appliedOn,
    calculatedAmount,
    description
  };
};

// ==================== CALCUL DIRECT (Budget média → Budget client) ====================

/**
 * Calcule le budget client à partir du budget média
 * Logique simple et directe sans itération
 */
export const calculateClientBudgetFromMedia = (inputs: BudgetInputs): BudgetResults => {
  const { mediaBudget, costPerUnit, realValue, fees } = inputs;
  
  if (!mediaBudget || mediaBudget <= 0) {
    throw new Error('Budget média requis pour le calcul direct');
  }

  // 1. Calculer le budget effectif et volume
  const effectiveBudgetForVolume = calculateEffectiveBudgetForVolume(mediaBudget, realValue);
  const unitVolume = inputs.unitVolume || calculateUnitVolume(effectiveBudgetForVolume, costPerUnit);
  
  // 2. Trier les frais par ordre
  const sortedFees = sortFeesByOrder(fees);
  
  // 3. Calculer chaque frais dans l'ordre
  const feeDetails: FeeCalculationDetail[] = [];
  let cumulativeBase = mediaBudget; // Base cumulative pour les frais "sur précédents"
  
  for (const fee of sortedFees) {
    const detail = calculateSingleFee(fee, mediaBudget, cumulativeBase, unitVolume);
    feeDetails.push(detail);
    
    // Ajouter ce frais à la base cumulative pour les frais suivants
    cumulativeBase += detail.calculatedAmount;
  }
  
  // 4. Calculer les totaux
  const totalFees = feeDetails.reduce((sum, detail) => sum + detail.calculatedAmount, 0);
  const clientBudget = mediaBudget + totalFees;
  
  // 5. Calculer la bonification
  const hasBonus = realValue && realValue > mediaBudget;
  const bonusValue = hasBonus ? realValue - mediaBudget : 0;
  
  return {
    mediaBudget,
    clientBudget,
    effectiveBudgetForVolume,
    unitVolume,
    totalFees,
    feeDetails,
    hasBonus: !!hasBonus,
    bonusValue
    // Pas de convergenceInfo pour le calcul direct
  };
};

// ==================== CALCUL INVERSE (Budget client → Budget média) ====================

/**
 * Calcule le budget média à partir du budget client
 * NOUVELLE APPROCHE: Résolution itérative avec informations de convergence
 */
export const calculateMediaBudgetFromClient = (inputs: BudgetInputs): BudgetResults => {
  const { clientBudget, costPerUnit, realValue, fees } = inputs;
  
  if (!clientBudget || clientBudget <= 0) {
    throw new Error('Budget client requis pour le calcul inverse');
  }

  // Configuration de l'algorithme itératif
  const tolerance = 0.004; // Tolérance de 1 centime
  const maxIterations = 100;
  let iteration = 0;
  
  // AJUSTEMENT: Estimation initiale légèrement plus basse pour biaiser vers le bas
  let mediaBudgetEstimate = clientBudget * 0.73; // 73% au lieu de 75%
  let bestEstimate = mediaBudgetEstimate;
  let bestDifference = Infinity;
  let bestActualTotal = 0; // NOUVEAU: Garder le vrai total calculé
  
  console.log(`DÉBUT CALCUL ITÉRATIF pour budget client: ${clientBudget}$`);
  
  while (iteration < maxIterations) {
    // Calculer le budget client résultant avec cette estimation
    const testInputs: BudgetInputs = {
      mediaBudget: mediaBudgetEstimate,
      costPerUnit,
      realValue,
      fees
    };
    
    try {
      // Utiliser le calcul direct pour voir quel budget client on obtient
      const directResult = calculateClientBudgetFromMedia(testInputs);
      const difference = directResult.clientBudget - clientBudget;
      const absDifference = Math.abs(difference);
      
      console.log(`Itération ${iteration + 1}: Budget média ${mediaBudgetEstimate.toFixed(2)}$ → Budget client ${directResult.clientBudget.toFixed(2)}$ (écart: ${difference.toFixed(2)}$)`);
      
      // Garder la meilleure estimation
      if (absDifference < bestDifference) {
        bestDifference = absDifference;
        bestEstimate = mediaBudgetEstimate;
        bestActualTotal = directResult.clientBudget; // NOUVEAU: Garder le vrai total
      }
      
      // Vérifier la convergence
      if (absDifference < tolerance) {
        console.log(`CONVERGENCE atteinte après ${iteration + 1} itérations`);
        
        // Recalculer une dernière fois pour obtenir tous les détails
        const finalResult = calculateClientBudgetFromMedia(testInputs);
        
        // NOUVEAU: Ajouter les informations de convergence
        const convergenceInfo: ConvergenceInfo = {
          hasConverged: true,
          finalDifference: difference,
          iterations: iteration + 1,
          tolerance,
          targetBudget: clientBudget,
          actualCalculatedTotal: finalResult.clientBudget
        };
        
        return {
          mediaBudget: mediaBudgetEstimate,
          clientBudget,
          effectiveBudgetForVolume: calculateEffectiveBudgetForVolume(mediaBudgetEstimate, realValue),
          unitVolume: finalResult.unitVolume,
          totalFees: finalResult.totalFees,
          feeDetails: finalResult.feeDetails,
          hasBonus: finalResult.hasBonus,
          bonusValue: finalResult.bonusValue,
          convergenceInfo // NOUVEAU
        };
      }
      
      // AJUSTEMENT: Facteur de convergence plus conservateur pour éviter de dépasser
      const adjustmentFactor = 0.25; // Plus conservateur (était 0.3)
      const adjustment = difference * adjustmentFactor;
      mediaBudgetEstimate = mediaBudgetEstimate - adjustment;
      
      // S'assurer que l'estimation reste positive
      if (mediaBudgetEstimate <= 0) {
        mediaBudgetEstimate = bestEstimate * 0.5;
      }
      
    } catch (error) {
      // Si l'estimation cause une erreur, essayer une estimation plus faible
      console.warn(`Erreur avec estimation ${mediaBudgetEstimate.toFixed(2)}$: ${error}`);
      mediaBudgetEstimate = mediaBudgetEstimate * 0.8;
      
      if (mediaBudgetEstimate <= 0) {
        throw new Error('Impossible de trouver un budget média positif avec ces frais');
      }
    }
    
    iteration++;
  }
  
  // NOUVEAU: Si on n'a pas convergé, utiliser la meilleure estimation avec informations de convergence
  console.warn(`CONVERGENCE NON ATTEINTE après ${maxIterations} itérations. Meilleur écart: ${bestDifference.toFixed(2)}$`);
  
  // Calculer le résultat final avec la meilleure estimation
  const finalInputs: BudgetInputs = {
    mediaBudget: bestEstimate,
    costPerUnit,
    realValue,
    fees
  };
  
  const finalResult = calculateClientBudgetFromMedia(finalInputs);
  
  // NOUVEAU: Informations de convergence pour échec
  const convergenceInfo: ConvergenceInfo = {
    hasConverged: false,
    finalDifference: bestActualTotal - clientBudget,
    iterations: maxIterations,
    tolerance,
    targetBudget: clientBudget,
    actualCalculatedTotal: bestActualTotal
  };
  
  return {
    mediaBudget: bestEstimate,
    clientBudget, // Garde le budget client saisi, mais convergenceInfo contient le vrai total
    effectiveBudgetForVolume: calculateEffectiveBudgetForVolume(bestEstimate, realValue),
    unitVolume: finalResult.unitVolume,
    totalFees: finalResult.totalFees,
    feeDetails: finalResult.feeDetails,
    hasBonus: finalResult.hasBonus,
    bonusValue: finalResult.bonusValue,
    convergenceInfo // NOUVEAU
  };
};

// ==================== FONCTION PRINCIPALE UNIFIÉE ====================

/**
 * Fonction principale qui détecte automatiquement le type de calcul à effectuer
 */
export const calculateBudget = (inputs: BudgetInputs): BudgetResults => {
  const hasMediaBudget = inputs.mediaBudget && inputs.mediaBudget > 0;
  const hasClientBudget = inputs.clientBudget && inputs.clientBudget > 0;
  
  if (hasMediaBudget && hasClientBudget) {
    throw new Error('Ne fournir qu\'un seul type de budget (média ou client)');
  }
  
  if (!hasMediaBudget && !hasClientBudget) {
    throw new Error('Un budget (média ou client) doit être fourni');
  }
  
  if (inputs.costPerUnit <= 0) {
    throw new Error('Le coût par unité doit être supérieur à 0');
  }
  
  try {
    if (hasMediaBudget) {
      return calculateClientBudgetFromMedia(inputs);
    } else {
      return calculateMediaBudgetFromClient(inputs);
    }
  } catch (error) {
    console.error('Erreur dans le calcul de budget:', error);
    throw error;
  }
};

// ==================== UTILITAIRES D'AFFICHAGE ====================

/**
 * Formate un montant en devises
 */
export const formatCurrency = (amount: number, currency: string = 'CAD'): string => {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formate un pourcentage
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('fr-CA', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Valide les inputs avant calcul
 */
export const validateBudgetInputs = (inputs: BudgetInputs): string[] => {
  const errors: string[] = [];
  
  if (!inputs.mediaBudget && !inputs.clientBudget) {
    errors.push('Un budget (média ou client) doit être fourni');
  }
  
  if (inputs.mediaBudget && inputs.clientBudget) {
    errors.push('Ne fournir qu\'un seul type de budget');
  }
  
  if (inputs.costPerUnit <= 0) {
    errors.push('Le coût par unité doit être supérieur à 0');
  }
  
  if (inputs.realValue && inputs.realValue < 0) {
    errors.push('La valeur réelle ne peut pas être négative');
  }
  
  if (inputs.unitVolume && inputs.unitVolume < 0) {
    errors.push('Le volume d\'unité ne peut pas être négatif');
  }
  
  // Valider les frais
  const feeOrders = inputs.fees.map(f => f.order);
  const uniqueOrders = new Set(feeOrders);
  if (feeOrders.length !== uniqueOrders.size) {
    errors.push('Les ordres de frais doivent être uniques');
  }
  
  return errors;
};