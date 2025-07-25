// app/components/Tactiques/Views/Timeline/timelinePeriodsUtils.ts
/**
 * Utilitaires pour générer les périodes d'affichage selon les breakdowns.
 * MODIFIÉ: Utilise les nouvelles fonctions du service breakdown pour lire 
 * les données stockées dans l'objet breakdowns des tactiques.
 * CORRIGÉ: IDs de périodes standardisés et stables
 */

import { Breakdown } from '../../../../types/breakdown';
import { 
  getTactiqueBreakdownValue,
  getTactiqueBreakdownToggleStatus,
  calculateTactiqueBreakdownTotal,
  areAllTactiqueBreakdownValuesNumeric
} from '../../../../lib/breakdownService';

export interface TimelinePeriod {
  id: string;
  label: string;
  fieldName: string; // Conservé pour compatibilité, mais plus utilisé
  breakdownId: string;
  breakdownName: string;
  isFirst?: boolean;
  isLast?: boolean;
  order: number;
}

/**
 * Génère les périodes pour un breakdown mensuel.
 * CORRIGÉ: IDs standardisés basés sur année-mois
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
    
    // CORRIGÉ: ID standardisé avec préfixe breakdown pour éviter les collisions
    const periodId = `${breakdown.id}_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}`;

    const fullPeriodId = `${breakdown.id}_${periodId}`;
    
    periods.push({
      id: periodId, // ID avec préfixe breakdown
      label: `${monthLabel} ${yearSuffix}`,
      fieldName: `TC_Breakdown_${fullPeriodId}`, // Conservé pour compatibilité
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
 * CORRIGÉ: IDs standardisés basés sur date de début de semaine
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
    
    // CORRIGÉ: ID standardisé basé sur la date de début de semaine (YYYY-MM-DD)
    const periodId = `week_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}_${String(current.getDate()).padStart(2, '0')}`;
    
    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      fieldName: `TC_Breakdown_${breakdown.id}_${periodId}`, // Conservé pour compatibilité
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
      periods.push({
        id: `${breakdown.id}_${period.id}`, // CORRIGÉ: Avec préfixe breakdown pour unicité
        label: period.name,
        fieldName: `TC_Breakdown_${breakdown.id}_${period.id}`, // Conservé pour compatibilité
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
 * MODIFIÉ: Utilise le service breakdown au lieu des champs plats.
 */
export function getPeriodValue(tactique: any, period: TimelinePeriod): string {
  return getTactiqueBreakdownValue(tactique, period.breakdownId, period.id);
}

/**
 * Obtient le statut d'activation d'une période pour une tactique (breakdown par défaut uniquement).
 * MODIFIÉ: Utilise le service breakdown au lieu des champs plats.
 */
export function getPeriodActiveStatus(tactique: any, period: TimelinePeriod): boolean {
  return getTactiqueBreakdownToggleStatus(tactique, period.breakdownId, period.id);
}

/**
 * Calcule le total des valeurs numériques pour un breakdown.
 * MODIFIÉ: Utilise le service breakdown au lieu de calculer manuellement.
 */
export function calculateBreakdownTotal(
  tactique: any, 
  periods: TimelinePeriod[], 
  isDefaultBreakdown: boolean = false
): number {
  if (periods.length === 0) return 0;
  
  // Utilise la fonction du service qui gère déjà la logique des périodes actives
  const breakdownId = periods[0].breakdownId;
  return calculateTactiqueBreakdownTotal(tactique, breakdownId, isDefaultBreakdown);
}

/**
 * Vérifie si toutes les valeurs d'un breakdown sont numériques.
 * MODIFIÉ: Utilise le service breakdown au lieu de calculer manuellement.
 */
export function areAllValuesNumeric(
  tactique: any, 
  periods: TimelinePeriod[], 
  isDefaultBreakdown: boolean = false
): boolean {
  if (periods.length === 0) return false;
  
  // Utilise la fonction du service qui gère déjà la logique des périodes actives
  const breakdownId = periods[0].breakdownId;
  return areAllTactiqueBreakdownValuesNumeric(tactique, breakdownId, isDefaultBreakdown);
}

/**
 * Distribue équitablement un montant sur les périodes actives.
 * MODIFIÉ: Retourne les données dans le nouveau format pour le service breakdown.
 */
export function distributeAmountEqually(
  totalAmount: number,
  periods: TimelinePeriod[],
  activePeriods: { [periodId: string]: boolean } = {},
  isDefaultBreakdown: boolean = false
): { [periodId: string]: { value: string; isToggled: boolean } } {
  const relevantPeriods = periods.filter(period => {
    if (!isDefaultBreakdown) return true;
    return activePeriods[period.id] !== false;
  });

  if (relevantPeriods.length === 0) return {};

  const amountPerPeriod = totalAmount / relevantPeriods.length;
  const result: { [periodId: string]: { value: string; isToggled: boolean } } = {};

  relevantPeriods.forEach(period => {
    result[period.id] = {
      value: amountPerPeriod.toFixed(2),
      isToggled: true
    };
  });

  return result;
}