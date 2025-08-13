// app/components/Tactiques/Tactiques/breakdownPeriodUtils.ts
/**
 * Utilitaires pour la génération de périodes de breakdown.
 * Contient toutes les fonctions de génération des périodes selon les types
 * de breakdown (Mensuel, Hebdomadaire, PEBs, Custom).
 * NOUVEAU: Calcul et inclusion des dates de début pour toutes les périodes
 */

import { Breakdown } from '../../../types/breakdown';
import { BreakdownPeriod } from '../../../hooks/useTactiqueBreakdown';

// The 't' function should be passed from a component that uses the useTranslation hook.
type TFunction = (key: string) => string;


/**
 * Génère les périodes pour un breakdown mensuel
 * NOUVEAU: Calcule et inclut la date de début pour chaque période
 */
export function generateMonthlyPeriods(
  breakdown: Breakdown, 
  tactiqueStartDate: string | undefined, 
  tactiqueEndDate: string | undefined,
  t: TFunction
): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];

  let startDate: Date, endDate: Date;

  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = new Date(tactiqueStartDate);
    endDate = new Date(tactiqueEndDate);
  } else {
    startDate = new Date(breakdown.startDate);
    endDate = new Date(breakdown.endDate);
  }

  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (current <= endDate) {
    const monthNames = t('breakdownPeriod.months.short').split(',');

    const monthLabel = monthNames[current.getMonth()];
    const yearSuffix = current.getFullYear().toString().slice(-2);

    // ID standardisé avec préfixe breakdown pour éviter les collisions
    const periodId = `${breakdown.id}_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}`;

    // NOUVEAU: Calculer la date de début (1er du mois)
    const periodStartDate = new Date(current.getFullYear(), current.getMonth(), 1);

    periods.push({
      id: periodId,
      label: `${monthLabel} ${yearSuffix}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      startDate: periodStartDate // NOUVEAU: Date de début incluse
    });

    current.setMonth(current.getMonth() + 1);
  }

  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  return periods;
}

/**
 * Génère les périodes pour un breakdown hebdomadaire
 * NOUVEAU: Calcule et inclut la date de début pour chaque période
 */
export function generateWeeklyPeriods(
  breakdown: Breakdown, 
  tactiqueStartDate: string | undefined, 
  tactiqueEndDate: string | undefined,
  t: TFunction
): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];

  let startDate: Date, endDate: Date;

  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = new Date(tactiqueStartDate);
    endDate = new Date(tactiqueEndDate);
  } else {
    startDate = new Date(breakdown.startDate);
    endDate = new Date(breakdown.endDate);
  }

  // Toujours ajuster au lundi pour TOUS les breakdowns hebdomadaires
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 1) { // Si ce n'est pas un lundi
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);
  }

  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDate().toString().padStart(2, '0');
    const monthNames = t('breakdownPeriod.months.shortTitleCase').split(',');
    const month = monthNames[current.getMonth()];

    // ID standardisé avec préfixe breakdown pour éviter les collisions
    const periodId = `${breakdown.id}_week_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}_${String(current.getDate()).padStart(2, '0')}`;

    // NOUVEAU: Calculer la date de début (lundi de la semaine)
    const periodStartDate = new Date(current);

    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      startDate: periodStartDate // NOUVEAU: Date de début incluse
    });

    current.setDate(current.getDate() + 7);
  }

  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  return periods;
}

/**
 * Génère les périodes pour un breakdown PEBs (identique aux périodes hebdomadaires)
 * NOUVEAU: Calcule et inclut la date de début pour chaque période
 */
export function generatePEBsPeriods(
  breakdown: Breakdown, 
  tactiqueStartDate: string | undefined, 
  tactiqueEndDate: string | undefined,
  t: TFunction
): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];

  let startDate: Date, endDate: Date;

  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = new Date(tactiqueStartDate);
    endDate = new Date(tactiqueEndDate);
  } else {
    startDate = new Date(breakdown.startDate);
    endDate = new Date(breakdown.endDate);
  }

  // Ajuster au lundi pour TOUS les breakdowns PEBs
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 1) { // Si ce n'est pas un lundi
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);
  }

  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDate().toString().padStart(2, '0');
    const monthNames = t('breakdownPeriod.months.shortTitleCase').split(',');
    const month = monthNames[current.getMonth()];

    // ID standardisé identique aux périodes hebdomadaires
    const periodId = `week_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}_${String(current.getDate()).padStart(2, '0')}`;

    // NOUVEAU: Calculer la date de début (lundi de la semaine)
    const periodStartDate = new Date(current);

    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      startDate: periodStartDate // NOUVEAU: Date de début incluse
    });

    current.setDate(current.getDate() + 7);
  }

  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  return periods;
}

/**
 * Génère les périodes pour un breakdown personnalisé
 * NOUVEAU: Les breakdowns Custom n'ont pas de date de début calculable automatiquement
 * mais peuvent en avoir une stockée manuellement
 */
export function generateCustomPeriods(breakdown: Breakdown): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];

  if (breakdown.customPeriods) {
    breakdown.customPeriods
      .sort((a, b) => a.order - b.order)
      .forEach((period) => {
        periods.push({
          id: `${breakdown.id}_${period.id}`,
          label: period.name,
          value: '',
          breakdownId: breakdown.id,
          breakdownName: breakdown.name,
          startDate: period.startDate || undefined // NOUVEAU: Utiliser la date stockée ou undefined
        });
      });
  }

  return periods;
}

/**
 * Génère toutes les périodes pour tous les breakdowns
 * NOUVEAU: Toutes les périodes générées incluent maintenant leur date de début
 */
export function generateAllPeriods(
  breakdowns: Breakdown[], 
  tactiqueStartDate: string | undefined, 
  tactiqueEndDate: string | undefined,
  t: TFunction
): BreakdownPeriod[] {
  const allPeriods: BreakdownPeriod[] = [];

  breakdowns.forEach(breakdown => {
    let periods: BreakdownPeriod[] = [];

    switch (breakdown.type) {
      case 'Mensuel':
        periods = generateMonthlyPeriods(breakdown, tactiqueStartDate, tactiqueEndDate, t);
        break;
      case 'Hebdomadaire':
        periods = generateWeeklyPeriods(breakdown, tactiqueStartDate, tactiqueEndDate, t);
        break;
      case 'PEBs':
        periods = generatePEBsPeriods(breakdown, tactiqueStartDate, tactiqueEndDate, t);
        break;
      case 'Custom':
        periods = generateCustomPeriods(breakdown);
        break;
    }

    allPeriods.push(...periods);
  });

  return allPeriods;
}

/**
 * Extrait la date de début d'une période depuis son ID
 * MODIFIÉ: Maintenant utilise prioritairement la date stockée dans la période
 */
export function extractPeriodStartDate(period: BreakdownPeriod): Date | null {
  // NOUVEAU: Utiliser en priorité la date stockée dans la période
  if (period.startDate) {
    return period.startDate;
  }

  // Fallback: calcul basé sur l'ID (pour compatibilité)
  try {
    // Retirer le préfixe breakdown de l'ID
    const cleanId = period.id.replace(`${period.breakdownId}_`, '');
    
    if (cleanId.includes('week_')) {
      // Format: week_2025_04_21
      const match = cleanId.match(/week_(\d{4})_(\d{2})_(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    } else if (cleanId.match(/^\d{4}_\d{2}$/)) {
      // Format: 2025_04 (mensuel)
      const match = cleanId.match(/^(\d{4})_(\d{2})$/);
      if (match) {
        const [, year, month] = match;
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }
    }
  } catch (error) {
    console.warn('Impossible d\'extraire la date de la période:', period.id);
  }
  
  return null;
}

/**
 * Calcule les périodes concernées par des dates de distribution
 * MODIFIÉ: Utilise la nouvelle fonction extractPeriodStartDate qui priorise les dates stockées
 */
export function getPeriodsForDistribution(
  periods: BreakdownPeriod[],
  breakdownId: string, 
  startDate: string, 
  endDate: string
): BreakdownPeriod[] {
  if (!startDate || !endDate) return [];

  const breakdownPeriods = periods.filter(p => p.breakdownId === breakdownId);
  const distributionStart = new Date(startDate);
  const distributionEnd = new Date(endDate);

  return breakdownPeriods.filter(period => {
    const periodStartDate = extractPeriodStartDate(period);
    if (!periodStartDate) return true; // Garder si on ne peut pas déterminer

    // Calculer la fin de période
    const periodEnd = new Date(periodStartDate);
    if (period.id.includes('week_')) {
      // Pour les semaines, ajouter 6 jours
      periodEnd.setDate(periodEnd.getDate() + 6);
    } else if (period.id.match(/^\w+_\d{4}_\d{2}$/)) {
      // Pour les mois, aller au dernier jour du mois
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(0);
    }

    // Intersecte si : début période <= fin distribution ET fin période >= début distribution
    return periodStartDate <= distributionEnd && periodEnd >= distributionStart;
  });
}