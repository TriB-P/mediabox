// app/lib/budgetCalculations.ts

// ==================== TYPES ====================

export type FeeCalculationType = 'Pourcentage budget' | 'Volume d\'unité' | 'Unités' | 'Frais fixe';
export type FeeCalculationMode = 'Directement sur le budget média' | 'Applicable sur les frais précédents';

export interface FeeDefinition {
  id: string;
  name: string;
  calculationType: FeeCalculationType;
  calculationMode: FeeCalculationMode;
  order: number;
  value: number;
  buffer: number;
  customUnits?: number;
  // NOUVEAU: Volume personnalisé pour les frais "Volume d'unité"
  useCustomVolume?: boolean;
  customVolume?: number;
}

export interface BudgetInputs {
  costPerUnit: number;
  realValue?: number;
  fees: FeeDefinition[];
  mediaBudget?: number;
  clientBudget?: number;
  // NOUVEAU: Type d'unité pour le calcul des impressions
  unitType?: string;
  unitTypeDisplayName?: string;
}

export interface FeeDetail {
  feeId: string;
  name: string;
  calculationType: FeeCalculationType;
  calculationMode: FeeCalculationMode;
  baseValue: number;
  calculatedAmount: number;
  units?: number;
}

export interface ConvergenceInfo {
  hasConverged: boolean;
  iterations: number;
  finalDifference: number;
  targetBudget: number;
  actualCalculatedTotal: number;
}

export interface BudgetResults {
  mediaBudget: number;
  totalFees: number;
  clientBudget: number;
  unitVolume: number;
  effectiveBudgetForVolume: number;
  bonusValue: number;
  feeDetails: FeeDetail[];
  convergenceInfo?: ConvergenceInfo;
}

// ==================== UTILITAIRES POUR LES IMPRESSIONS ====================

/**
 * Détermine si le type d'unité correspond aux impressions
 */
const isImpressionUnitType = (unitType?: string, unitTypeDisplayName?: string): boolean => {
  if (!unitType && !unitTypeDisplayName) return false;
  
  const displayName = unitTypeDisplayName?.toLowerCase() || '';
  const typeId = unitType?.toLowerCase() || '';
  
  return displayName.includes('impression') || typeId.includes('impression');
};

/**
 * Calcule le volume d'unité en tenant compte du type d'unité
 * Pour les impressions : (budget ÷ CPM) × 1000 = nombre d'impressions
 * Pour les autres : budget ÷ coût unitaire = nombre d'unités
 */
const calculateUnitVolume = (
  effectiveBudget: number, 
  costPerUnit: number, 
  unitType?: string, 
  unitTypeDisplayName?: string
): number => {
  if (effectiveBudget <= 0 || costPerUnit <= 0) {
    return 0;
  }
  
  const baseVolume = effectiveBudget / costPerUnit;
  
  // Pour les impressions, multiplier par 1000 car le CPM est pour 1000 impressions
  if (isImpressionUnitType(unitType, unitTypeDisplayName)) {
    return Math.round(baseVolume * 1000);
  }
  
  return Math.round(baseVolume);
};

/**
 * Calcule le budget effectif à partir du volume d'unité
 * Pour les impressions : (volume ÷ 1000) × CPM = budget
 * Pour les autres : volume × coût unitaire = budget
 */
const calculateEffectiveBudgetFromVolume = (
  volume: number, 
  costPerUnit: number, 
  unitType?: string, 
  unitTypeDisplayName?: string
): number => {
  if (volume <= 0 || costPerUnit <= 0) {
    return 0;
  }
  
  // Pour les impressions, diviser par 1000 car le CPM est pour 1000 impressions
  if (isImpressionUnitType(unitType, unitTypeDisplayName)) {
    return (volume / 1000) * costPerUnit;
  }
  
  return volume * costPerUnit;
};

// ==================== VALIDATION ====================

export const validateBudgetInputs = (inputs: BudgetInputs): string[] => {
  const errors: string[] = [];
  
  if (inputs.costPerUnit <= 0) {
    errors.push('Le coût par unité doit être supérieur à 0');
  }
  
  if (inputs.realValue !== undefined && inputs.realValue < 0) {
    errors.push('La valeur réelle ne peut pas être négative');
  }
  
  if (!inputs.mediaBudget && !inputs.clientBudget) {
    errors.push('Un budget média ou client doit être spécifié');
  }
  
  if (inputs.mediaBudget && inputs.mediaBudget <= 0) {
    errors.push('Le budget média doit être supérieur à 0');
  }
  
  if (inputs.clientBudget && inputs.clientBudget <= 0) {
    errors.push('Le budget client doit être supérieur à 0');
  }
  
  // Validation spécifique pour les frais
  for (const fee of inputs.fees) {
    if (fee.value < 0) {
      errors.push(`La valeur du frais "${fee.name}" ne peut pas être négative`);
    }
    
    if (fee.calculationType === 'Unités' && (!fee.customUnits || fee.customUnits <= 0)) {
      errors.push(`Le frais "${fee.name}" de type "Unités" nécessite un nombre d'unités valide`);
    }
  }
  
  return errors;
};

// ==================== CALCUL DES FRAIS ====================

const calculateFees = (
  mediaBudget: number, 
  unitVolume: number, 
  fees: FeeDefinition[],
  unitType?: string,
  unitTypeDisplayName?: string
): { totalFees: number; feeDetails: FeeDetail[] } => {
  const sortedFees = [...fees].sort((a, b) => a.order - b.order);
  const feeDetails: FeeDetail[] = [];
  
  let runningMediaBudget = mediaBudget;
  let runningFeesTotal = 0;
  
  for (const fee of sortedFees) {
    let calculatedAmount = 0;
    let units: number | undefined;
    
    switch (fee.calculationType) {
      case 'Pourcentage budget':
        const baseForPercentage = fee.calculationMode === 'Directement sur le budget média' 
          ? mediaBudget 
          : (mediaBudget + runningFeesTotal);
        calculatedAmount = (baseForPercentage * fee.value) / 100;
        break;
        
      case 'Volume d\'unité':
        // MODIFIÉ: Utiliser le volume personnalisé si défini, sinon le volume ajusté pour les impressions
        const volumeToUse = fee.useCustomVolume && fee.customVolume ? fee.customVolume : unitVolume;
        calculatedAmount = volumeToUse * fee.value;
        units = volumeToUse;
        break;
        
      case 'Unités':
        if (fee.customUnits && fee.customUnits > 0) {
          calculatedAmount = fee.customUnits * fee.value;
          units = fee.customUnits;
        }
        break;
        
      case 'Frais fixe':
        calculatedAmount = fee.value;
        break;
    }
    
    // Appliquer le buffer si défini
    if (fee.buffer > 0) {
      calculatedAmount += (calculatedAmount * fee.buffer) / 100;
    }
    
    feeDetails.push({
      feeId: fee.id,
      name: fee.name,
      calculationType: fee.calculationType,
      calculationMode: fee.calculationMode,
      baseValue: fee.value,
      calculatedAmount,
      units
    });
    
    runningFeesTotal += calculatedAmount;
  }
  
  return {
    totalFees: runningFeesTotal,
    feeDetails
  };
};

// ==================== CALCUL PRINCIPAL MODIFIÉ ====================

export const calculateBudget = (inputs: BudgetInputs): BudgetResults => {
  const { costPerUnit, realValue, fees, mediaBudget, clientBudget, unitType, unitTypeDisplayName } = inputs;
  
  // Calcul de la bonification
  
  if (mediaBudget) {
    // Mode budget média → calculer le budget client
    
    const bonusValue = realValue ? Math.max(0, realValue - mediaBudget) : 0;

    const effectiveBudgetForVolume = mediaBudget + bonusValue;


    // MODIFIÉ: Utiliser la nouvelle fonction qui gère les impressions
    const unitVolume = calculateUnitVolume(effectiveBudgetForVolume, costPerUnit, unitType, unitTypeDisplayName);
    
    const { totalFees, feeDetails } = calculateFees(mediaBudget, unitVolume, fees, unitType, unitTypeDisplayName);
    const calculatedClientBudget = mediaBudget + totalFees;
    
    return {
      mediaBudget,
      totalFees,
      clientBudget: calculatedClientBudget,
      unitVolume,
      effectiveBudgetForVolume,
      bonusValue,
      feeDetails
    };
  }
  
  if (clientBudget) {
    // Mode budget client → calculer le budget média avec convergence
    return calculateBudgetWithConvergence(inputs);
  }
  
  throw new Error('Aucun budget spécifié');
};

// ==================== CONVERGENCE POUR MODE CLIENT MODIFIÉE ====================

const calculateBudgetWithConvergence = (inputs: BudgetInputs): BudgetResults => {
  const { costPerUnit, realValue, fees, clientBudget, unitType, unitTypeDisplayName } = inputs;
  
  if (!clientBudget) {
    throw new Error('Budget client requis pour ce calcul');
  }
  
  const tolerance = 0.0004; 
  const maxIterations = 100;
  
  let currentMediaBudget = clientBudget * 0.8; // Estimation initiale
  let bonusValue = 0; // 🔥 DÉCLARER ICI pour qu'elle soit accessible partout
  let iteration = 0;
  let finalDifference = 0;
  let hasConverged = false;
  
  while (iteration < maxIterations && !hasConverged) {
    // 🔥 CORRECTION: Calculer bonusValue avec le budget média actuel
    bonusValue = realValue ? Math.max(0, realValue - currentMediaBudget) : 0;
    const effectiveBudgetForVolume = currentMediaBudget + bonusValue;
    
    // MODIFIÉ: Utiliser la nouvelle fonction qui gère les impressions
    const unitVolume = calculateUnitVolume(effectiveBudgetForVolume, costPerUnit, unitType, unitTypeDisplayName);
    
    const { totalFees } = calculateFees(currentMediaBudget, unitVolume, fees, unitType, unitTypeDisplayName);
    const calculatedTotal = currentMediaBudget + totalFees;
    
    finalDifference = clientBudget - calculatedTotal;
    
    if (Math.abs(finalDifference) <= tolerance) {
      hasConverged = true;
    } else {
      // Ajustement adaptatif du budget média
      const adjustmentFactor = 0.8;
      currentMediaBudget += finalDifference * adjustmentFactor;
      
      // S'assurer que le budget média reste positif
      currentMediaBudget = Math.max(0.01, currentMediaBudget);
    }
    
    iteration++;
  }
  
  // 🔥 RECALCULER bonusValue une dernière fois avec le budget média final
  bonusValue = realValue ? Math.max(0, realValue - currentMediaBudget) : 0;
  
  // Calcul final avec le budget média optimisé
  const effectiveBudgetForVolume = currentMediaBudget + bonusValue;
  
  // MODIFIÉ: Utiliser la nouvelle fonction qui gère les impressions
  const unitVolume = calculateUnitVolume(effectiveBudgetForVolume, costPerUnit, unitType, unitTypeDisplayName);
  
  const { totalFees, feeDetails } = calculateFees(currentMediaBudget, unitVolume, fees, unitType, unitTypeDisplayName);
  const actualCalculatedTotal = currentMediaBudget + totalFees;
  
  return {
    mediaBudget: currentMediaBudget,
    totalFees,
    clientBudget: actualCalculatedTotal,
    unitVolume,
    effectiveBudgetForVolume,
    bonusValue,
    feeDetails,
    convergenceInfo: {
      hasConverged,
      iterations: iteration,
      finalDifference: clientBudget - actualCalculatedTotal,
      targetBudget: clientBudget,
      actualCalculatedTotal
    }
  };
};

// ==================== NOUVELLES FONCTIONS UTILITAIRES ====================

/**
 * Calcule le volume théorique à partir d'un budget donné
 * Utile pour les validations et affichages
 */
export const calculateTheoreticalVolume = (
  budget: number,
  costPerUnit: number,
  bonusValue: number = 0,
  unitType?: string,
  unitTypeDisplayName?: string
): number => {
  const effectiveBudget = budget + bonusValue;
  return calculateUnitVolume(effectiveBudget, costPerUnit, unitType, unitTypeDisplayName);
};

/**
 * Calcule le budget théorique à partir d'un volume donné
 * Utile pour les validations inverse
 */
export const calculateTheoreticalBudget = (
  volume: number,
  costPerUnit: number,
  bonusValue: number = 0,
  unitType?: string,
  unitTypeDisplayName?: string
): number => {
  const effectiveBudget = calculateEffectiveBudgetFromVolume(volume, costPerUnit, unitType, unitTypeDisplayName);
  return Math.max(0, effectiveBudget - bonusValue);
};

/**
 * Vérifie si le type d'unité nécessite un traitement spécial pour les impressions
 */
export const isImpressionType = isImpressionUnitType;

/**
 * Formate l'explication du calcul selon le type d'unité
 */
export const getCalculationExplanation = (
  budget: number,
  costPerUnit: number,
  bonusValue: number,
  unitType?: string,
  unitTypeDisplayName?: string
): string => {
  const effectiveBudget = budget + bonusValue;
  const isImpression = isImpressionUnitType(unitType, unitTypeDisplayName);
  
  if (isImpression) {
    return `${effectiveBudget.toFixed(2)}$ ÷ ${costPerUnit.toFixed(4)}$ CPM × 1000 = ${calculateUnitVolume(effectiveBudget, costPerUnit, unitType, unitTypeDisplayName).toLocaleString()} impressions`;
  } else {
    const unitName = unitTypeDisplayName?.toLowerCase() || 'unités';
    return `${effectiveBudget.toFixed(2)}$ ÷ ${costPerUnit.toFixed(4)}$ = ${calculateUnitVolume(effectiveBudget, costPerUnit, unitType, unitTypeDisplayName).toLocaleString()} ${unitName}`;
  }
};

// ==================== EXPORT DEFAULT ====================

export default {
  calculateBudget,
  validateBudgetInputs,
  calculateTheoreticalVolume,
  calculateTheoreticalBudget,
  isImpressionType,
  getCalculationExplanation
};