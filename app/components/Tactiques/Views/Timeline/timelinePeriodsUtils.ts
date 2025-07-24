// app/components/Tactiques/Views/Timeline/timelinePeriodsUtils.ts
/**
 * Utilitaires pour générer les périodes d'affichage selon les breakdowns.
 * Gère la génération des colonnes pour les vues timeline avec édition.
 */

import { Breakdown } from '../../../../types/breakdown';

export interface TimelinePeriod {
  id: string;
  label: string;
  fieldName: string; // Nom du champ dans la tactique (ex: TC_Breakdown_breakdown_id_period_id)
  breakdownId: string;
  breakdownName: string;
  isFirst?: boolean;
  isLast?: boolean;
  order: number;
}

/**
 * Génère les périodes pour un breakdown mensuel.
 */
export function generateMonthlyPeriods(
  breakdown: Breakdown, 
  tactiqueStartDate?: string, 
  tactiqueEndDate?: string
): TimelinePeriod[] {
  const periods: TimelinePeriod[] = [];

  let startDate: Date, endDate: Date;

  // Pour le breakdown par défaut, utilise les dates de la tactique si disponibles
  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = new Date(tactiqueStartDate);
    endDate = new Date(tactiqueEndDate);
  } else {
    startDate = new Date(breakdown.startDate);
    endDate = new Date(breakdown.endDate);
  }

  // Commence au 1er du mois de la date de début
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  let order = 0;

  while (current <= endDate) {
    const monthNames = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN',
      'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'];

    const monthLabel = monthNames[current.getMonth()];
    const yearSuffix = current.getFullYear().toString().slice(-2);
    const periodId = `${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}`;

    const fullPeriodId = `${breakdown.id}_${periodId}`;
    
    periods.push({
      id: fullPeriodId,
      label: `${monthLabel} ${yearSuffix}`,
      fieldName: `TC_Breakdown_${fullPeriodId}`,
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      order: order++
    });

    current.setMonth(current.getMonth() + 1);
  }

  // Marquer la première et dernière période
  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  return periods;
}

/**
 * Génère les périodes pour un breakdown hebdomadaire.
 */
export function generateWeeklyPeriods(
  breakdown: Breakdown, 
  tactiqueStartDate?: string, 
  tactiqueEndDate?: string
): TimelinePeriod[] {
  const periods: TimelinePeriod[] = [];

  let startDate: Date, endDate: Date;

  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = new Date(tactiqueStartDate);
    endDate = new Date(tactiqueEndDate);

    // Ajuster au lundi le plus proche pour les breakdowns hebdomadaires
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 1) { // Si ce n'est pas un lundi
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(startDate.getDate() - daysToSubtract);
    }
  } else {
    startDate = new Date(breakdown.startDate);
    endDate = new Date(breakdown.endDate);
  }

  const current = new Date(startDate);
  let order = 0;

  while (current <= endDate) {
    const day = current.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const month = monthNames[current.getMonth()];
    
    // Format d'ID identique à celui du formulaire de répartition
    const periodId = `${breakdown.id}_${current.getTime()}`;

    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      fieldName: `TC_Breakdown_${periodId}`,
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      order: order++
    });

    current.setDate(current.getDate() + 7);
  }

  // Marquer la première et dernière période
  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  return periods;
}

/**
 * Génère les périodes pour un breakdown personnalisé.
 */
export function generateCustomPeriods(breakdown: Breakdown): TimelinePeriod[] {
  const periods: TimelinePeriod[] = [];

  if (!breakdown.customPeriods || breakdown.customPeriods.length === 0) {
    return periods;
  }

  breakdown.customPeriods
    .sort((a, b) => a.order - b.order)
    .forEach((period, index) => {
      // Format d'ID identique à celui du formulaire de répartition
      const periodId = `${breakdown.id}_${period.id}`;
      
      periods.push({
        id: periodId,
        label: period.name,
        fieldName: `TC_Breakdown_${periodId}`,
        breakdownId: breakdown.id,
        breakdownName: breakdown.name,
        order: index
      });
    });

  return periods;  
}

/**
 * Génère toutes les périodes pour un breakdown donné.
 */
export function generatePeriodsForBreakdown(
  breakdown: Breakdown,
  tactiqueStartDate?: string,
  tactiqueEndDate?: string
): TimelinePeriod[] {
  switch (breakdown.type) {
    case 'Mensuel':
      return generateMonthlyPeriods(breakdown, tactiqueStartDate, tactiqueEndDate);
    case 'Hebdomadaire':
      return generateWeeklyPeriods(breakdown, tactiqueStartDate, tactiqueEndDate);
    case 'Custom':
      return generateCustomPeriods(breakdown);
    default:
      console.warn(`Type de breakdown non supporté: ${breakdown.type}`);
      return [];
  }
}

/**
 * Obtient la valeur d'une période pour une tactique donnée.
 */
export function getPeriodValue(tactique: any, period: TimelinePeriod): string {
  const value = tactique[period.fieldName];
  return value !== undefined ? String(value) : '';
}

/**
 * Obtient le statut d'activation d'une période pour une tactique (breakdown par défaut uniquement).
 */
export function getPeriodActiveStatus(tactique: any, period: TimelinePeriod): boolean {
  const activeFieldName = `TC_Breakdown_Active_${period.id}`;
  const activeStatus = tactique[activeFieldName];
  return activeStatus !== undefined ? Boolean(activeStatus) : true; // Par défaut activé
}

/**
 * Calcule le total des valeurs numériques pour un breakdown.
 */
export function calculateBreakdownTotal(
  tactique: any, 
  periods: TimelinePeriod[], 
  isDefaultBreakdown: boolean = false
): number {
  return periods
    .filter(period => {
      if (!isDefaultBreakdown) return true;
      return getPeriodActiveStatus(tactique, period);
    })
    .reduce((sum, period) => {
      const value = getPeriodValue(tactique, period);
      const numValue = parseFloat(value);
      return !isNaN(numValue) ? sum + numValue : sum;
    }, 0);
}

/**
 * Vérifie si toutes les valeurs d'un breakdown sont numériques.
 */
export function areAllValuesNumeric(
  tactique: any, 
  periods: TimelinePeriod[], 
  isDefaultBreakdown: boolean = false
): boolean {
  const relevantPeriods = periods.filter(period => {
    if (!isDefaultBreakdown) return true;
    return getPeriodActiveStatus(tactique, period);
  });

  if (relevantPeriods.length === 0) return false;

  const values = relevantPeriods
    .map(period => getPeriodValue(tactique, period))
    .filter(value => value.trim() !== '');

  if (values.length === 0) return false;

  return values.every(value => {
    const trimmedValue = value.trim();
    const numericRegex = /^[-+]?(\d+([.,]\d*)?|\.\d+)$/;
    
    if (!numericRegex.test(trimmedValue)) {
      return false;
    }

    const numValue = parseFloat(trimmedValue.replace(',', '.'));
    return !isNaN(numValue) && isFinite(numValue);
  });
}

/**
 * Distribue équitablement un montant sur les périodes actives.
 */
export function distributeAmountEqually(
  totalAmount: number,
  periods: TimelinePeriod[],
  activePeriods: { [periodId: string]: boolean } = {},
  isDefaultBreakdown: boolean = false
): { [fieldName: string]: string } {
  const relevantPeriods = periods.filter(period => {
    if (!isDefaultBreakdown) return true;
    return activePeriods[period.id] !== false;
  });

  if (relevantPeriods.length === 0) return {};

  const amountPerPeriod = totalAmount / relevantPeriods.length;
  const result: { [fieldName: string]: string } = {};

  relevantPeriods.forEach(period => {
    result[period.fieldName] = amountPerPeriod.toFixed(2);
  });

  return result;
}