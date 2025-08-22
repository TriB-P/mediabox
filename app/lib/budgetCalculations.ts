/**
 * Ce fichier contient les fonctions et les types nécessaires au calcul des budgets, des frais et des volumes d'unités.
 * Il gère différents types de calculs de frais, la convergence de budget client et les spécificités liées aux impressions.
 * C'est le cœur logique pour toutes les opérations financières du projet.
 */

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
  useCustomVolume?: boolean;
  customVolume?: number;
}

export interface BudgetInputs {
  costPerUnit: number;
  realValue?: number;
  fees: FeeDefinition[];
  mediaBudget?: number;
  clientBudget?: number;
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
 * Détermine si le type d'unité correspond aux impressions.
 * @param {string} unitType - L'identifiant interne du type d'unité.
 * @param {string} unitTypeDisplayName - Le nom affiché du type d'unité.
 * @returns {boolean} Vrai si le type d'unité est une impression, faux sinon.
 */
const isImpressionUnitType = (unitType?: string, unitTypeDisplayName?: string): boolean => {
  if (!unitType && !unitTypeDisplayName) return false;

  const displayName = unitTypeDisplayName?.toLowerCase() || '';
  const typeId = unitType?.toLowerCase() || '';

  return displayName.includes('impression') || typeId.includes('impression');
};

/**
 * Calcule le volume d'unité en tenant compte du type d'unité (impressions ou autres).
 * Pour les impressions : (budget ÷ CPM) × 1000 = nombre d'impressions.
 * Pour les autres : budget ÷ coût unitaire = nombre d'unités.
 * @param {number} effectiveBudget - Le budget effectif à utiliser pour le calcul.
 * @param {number} costPerUnit - Le coût par unité ou le CPM.
 * @param {string} unitType - L'identifiant interne du type d'unité.
 * @param {string} unitTypeDisplayName - Le nom affiché du type d'unité.
 * @returns {number} Le volume d'unités calculé.
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

  if (isImpressionUnitType(unitType, unitTypeDisplayName)) {
    return Math.round(baseVolume * 1000);
  }

  return Math.round(baseVolume);
};

/**
 * Calcule le budget effectif à partir du volume d'unité.
 * Pour les impressions : (volume ÷ 1000) × CPM = budget.
 * Pour les autres : volume × coût unitaire = budget.
 * @param {number} volume - Le volume d'unités.
 * @param {number} costPerUnit - Le coût par unité ou le CPM.
 * @param {string} unitType - L'identifiant interne du type d'unité.
 * @param {string} unitTypeDisplayName - Le nom affiché du type d'unité.
 * @returns {number} Le budget effectif calculé.
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

  if (isImpressionUnitType(unitType, unitTypeDisplayName)) {
    return (volume / 1000) * costPerUnit;
  }

  return volume * costPerUnit;
};

// ==================== VALIDATION ====================

/**
 * Valide les entrées du budget pour s'assurer qu'elles sont cohérentes.
 * @param {BudgetInputs} inputs - Les données d'entrée du budget.
 * @returns {string[]} Une liste d'erreurs de validation, vide si aucune erreur.
 */
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

/**
 * Calcule le montant total des frais et le détail de chaque frais.
 * @param {number} mediaBudget - Le budget média actuel.
 * @param {number} unitVolume - Le volume d'unités.
 * @param {FeeDefinition[]} fees - La liste des définitions de frais.
 * @param {string} unitType - L'identifiant interne du type d'unité.
 * @param {string} unitTypeDisplayName - Le nom affiché du type d'unité.
 * @returns {{ totalFees: number; feeDetails: FeeDetail[] }} Un objet contenant le total des frais et leurs détails.
 */
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
        calculatedAmount = (baseForPercentage * fee.value);
        break;

      case 'Volume d\'unité':
        const volumeToUse = fee.useCustomVolume && fee.customVolume ? fee.customVolume : unitVolume;
        calculatedAmount = volumeToUse * fee.value / 1000;
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

/**
 * Calcule le budget complet basé sur les entrées fournies.
 * Si un budget média est spécifié, il calcule le budget client.
 * Si un budget client est spécifié, il utilise un processus de convergence pour trouver le budget média correspondant.
 * @param {BudgetInputs} inputs - Les données d'entrée pour le calcul du budget.
 * @returns {BudgetResults} Les résultats détaillés du calcul du budget.
 * @throws {Error} Si aucun budget (média ou client) n'est spécifié.
 */
export const calculateBudget = (inputs: BudgetInputs): BudgetResults => {
  const { costPerUnit, realValue, fees, mediaBudget, clientBudget, unitType, unitTypeDisplayName } = inputs;

  if (mediaBudget) {
    const bonusValue = realValue ? Math.max(0, realValue - mediaBudget) : 0;
    const effectiveBudgetForVolume = mediaBudget + bonusValue;
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
    return calculateBudgetWithConvergence(inputs);
  }

  throw new Error('Aucun budget spécifié');
};

// ==================== CONVERGENCE POUR MODE CLIENT MODIFIÉE ====================

/**
 * Calcule le budget média nécessaire pour atteindre un budget client cible en utilisant une méthode de convergence.
 * @param {BudgetInputs} inputs - Les données d'entrée, incluant le budget client cible.
 * @returns {BudgetResults} Les résultats détaillés du calcul du budget, incluant les informations de convergence.
 * @throws {Error} Si le budget client n'est pas spécifié.
 */
const calculateBudgetWithConvergence = (inputs: BudgetInputs): BudgetResults => {
  const { costPerUnit, realValue, fees, clientBudget, unitType, unitTypeDisplayName } = inputs;

  if (!clientBudget) {
    throw new Error('Budget client requis pour ce calcul');
  }

  const tolerance = 0.0004;
  const maxIterations = 100;

  let currentMediaBudget = clientBudget * 0.8;
  let bonusValue = 0;
  let iteration = 0;
  let finalDifference = 0;
  let hasConverged = false;


  while (iteration < maxIterations && !hasConverged) {
    bonusValue = realValue ? Math.max(0, realValue - currentMediaBudget) : 0;
    const effectiveBudgetForVolume = currentMediaBudget + bonusValue;
    const unitVolume = calculateUnitVolume(effectiveBudgetForVolume, costPerUnit, unitType, unitTypeDisplayName);

    const { totalFees } = calculateFees(currentMediaBudget, unitVolume, fees, unitType, unitTypeDisplayName);
    const calculatedTotal = currentMediaBudget + totalFees;

    finalDifference = clientBudget - calculatedTotal;

    if (Math.abs(finalDifference) <= tolerance) {
      hasConverged = true;
    } else {
      const adjustmentFactor = 0.8;
      currentMediaBudget += finalDifference * adjustmentFactor;
      currentMediaBudget = Math.max(0.01, currentMediaBudget);
    }

    iteration++;
  }

  bonusValue = realValue ? Math.max(0, realValue - currentMediaBudget) : 0;
  const effectiveBudgetForVolume = currentMediaBudget + bonusValue;
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
 * Calcule le volume théorique à partir d'un budget donné.
 * Cette fonction est utile pour les validations et les affichages préliminaires.
 * @param {number} budget - Le budget à partir duquel calculer le volume.
 * @param {number} costPerUnit - Le coût par unité.
 * @param {number} bonusValue - La valeur de bonification, par défaut 0.
 * @param {string} unitType - L'identifiant interne du type d'unité.
 * @param {string} unitTypeDisplayName - Le nom affiché du type d'unité.
 * @returns {number} Le volume théorique calculé.
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
 * Calcule le budget théorique à partir d'un volume donné.
 * Cette fonction est utile pour les validations inverses et les scénarios de planification.
 * @param {number} volume - Le volume à partir duquel calculer le budget.
 * @param {number} costPerUnit - Le coût par unité.
 * @param {number} bonusValue - La valeur de bonification, par défaut 0.
 * @param {string} unitType - L'identifiant interne du type d'unité.
 * @param {string} unitTypeDisplayName - Le nom affiché du type d'unité.
 * @returns {number} Le budget théorique calculé.
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
 * Vérifie si le type d'unité nécessite un traitement spécial pour les impressions.
 * @param {string} unitType - L'identifiant interne du type d'unité.
 * @param {string} unitTypeDisplayName - Le nom affiché du type d'unité.
 * @returns {boolean} Vrai si c'est un type d'impression, faux sinon.
 */
export const isImpressionType = isImpressionUnitType;

/**
 * Formate une explication textuelle du calcul du volume selon le type d'unité.
 * @param {number} budget - Le budget utilisé dans le calcul.
 * @param {number} costPerUnit - Le coût par unité ou le CPM.
 * @param {number} bonusValue - La valeur de bonification.
 * @param {string} unitType - L'identifiant interne du type d'unité.
 * @param {string} unitTypeDisplayName - Le nom affiché du type d'unité.
 * @returns {string} L'explication formatée du calcul.
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