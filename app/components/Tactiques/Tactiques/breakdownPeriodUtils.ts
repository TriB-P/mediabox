// app/components/Tactiques/Tactiques/breakdownPeriodUtils.ts
/**
 * CORRIGÉ: Gestion des dates améliorée pour éviter les problèmes de fuseau horaire
 * et s'assurer que les bonnes périodes sont générées selon les dates de breakdown/tactique
 */

import { Breakdown, GeneratedPeriodMeta, generatePeriodLabel } from '../../../types/breakdown';
import { BreakdownPeriod } from '../../../hooks/useTactiqueBreakdown';

type TFunction = (key: string) => string;

/**
 * NOUVEAU: Fonction pour parser une date string de manière sûre (évite les problèmes de fuseau horaire)
 */
function parseDate(dateString: string): Date {
  // Si la date est au format YYYY-MM-DD, la parser manuellement pour éviter les problèmes UTC
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Fallback vers Date constructor standard
  return new Date(dateString);
}

/**
 * NOUVEAU: Génère un ID unique pour une période (identique au service)
 */
function generateUniquePeriodId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * NOUVEAU: Calcule la date de début d'une période selon le type
 */
function calculatePeriodStartDate(
  periodDate: Date,
  breakdownType: string
): string {
  switch (breakdownType) {
    case 'Hebdomadaire':
    case 'PEBs':
      // Trouver le lundi de la semaine
      const dayOfWeek = periodDate.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(periodDate);
      monday.setDate(periodDate.getDate() - daysToSubtract);
      return monday.toISOString().split('T')[0];
    
    case 'Mensuel':
      // 1er du mois
      const firstOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
      return firstOfMonth.toISOString().split('T')[0];
    
    default:
      return periodDate.toISOString().split('T')[0];
  }
}

/**
 * CORRIGÉ: Génère les périodes pour un breakdown mensuel avec gestion des dates améliorée
 */
export function generateMonthlyPeriods(
  breakdown: Breakdown, 
  tactiqueStartDate: string | undefined, 
  tactiqueEndDate: string | undefined,
  t: TFunction
): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];

  let startDate: Date, endDate: Date;

  console.log(`🔍 Génération des périodes mensuelles pour breakdown ${breakdown.name}`);
  console.log(`📅 Breakdown dates: ${breakdown.startDate} → ${breakdown.endDate}`);
  console.log(`🎯 Tactique dates: ${tactiqueStartDate} → ${tactiqueEndDate}`);
  console.log(`🏷️ Is default: ${breakdown.isDefault}`);

  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    console.log(`✅ Utilisation des dates de tactique (breakdown par défaut)`);
    startDate = parseDate(tactiqueStartDate);
    endDate = parseDate(tactiqueEndDate);
  } else {
    console.log(`✅ Utilisation des dates de breakdown`);
    startDate = parseDate(breakdown.startDate);
    endDate = parseDate(breakdown.endDate);
  }

  console.log(`📍 Dates calculées: ${startDate.toISOString().split('T')[0]} → ${endDate.toISOString().split('T')[0]}`);

  // Commence au 1er du mois de la date de début
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  console.log(`🎬 Premier mois: ${current.toISOString().split('T')[0]} (${current.getMonth() + 1}/${current.getFullYear()})`);

  while (current <= endDate) {
    const monthNames = t('breakdownPeriod.months.short').split(',');
    const monthLabel = monthNames[current.getMonth()];
    const yearSuffix = current.getFullYear().toString().slice(-2);

    // ID unique
    const periodId = generateUniquePeriodId();
    
    // Date de début calculée
    const periodStartDate = new Date(current.getFullYear(), current.getMonth(), 1);

    console.log(`📅 Génération période: ${monthLabel} ${yearSuffix} (${periodStartDate.toISOString().split('T')[0]})`);

    periods.push({
      id: periodId,
      label: `${monthLabel} ${yearSuffix}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      startDate: periodStartDate
    });

    current.setMonth(current.getMonth() + 1);
  }

  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  console.log(`✅ ${periods.length} périodes générées:`, periods.map(p => p.label));

  return periods;
}

/**
 * CORRIGÉ: Génère les périodes pour un breakdown hebdomadaire avec gestion des dates améliorée
 */
export function generateWeeklyPeriods(
  breakdown: Breakdown, 
  tactiqueStartDate: string | undefined, 
  tactiqueEndDate: string | undefined,
  t: TFunction
): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];

  let startDate: Date, endDate: Date;

  console.log(`🔍 Génération des périodes hebdomadaires pour breakdown ${breakdown.name}`);

  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = parseDate(tactiqueStartDate);
    endDate = parseDate(tactiqueEndDate);
  } else {
    startDate = parseDate(breakdown.startDate);
    endDate = parseDate(breakdown.endDate);
  }

  // Ajuster au lundi pour TOUS les breakdowns hebdomadaires
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 1) {
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);
  }

  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDate().toString().padStart(2, '0');
    const monthNames = t('breakdownPeriod.months.shortTitleCase').split(',');
    const month = monthNames[current.getMonth()];

    const periodId = generateUniquePeriodId();
    const periodStartDate = new Date(current);

    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      startDate: periodStartDate
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
 * CORRIGÉ: Génère les périodes pour un breakdown PEBs avec gestion des dates améliorée
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
    startDate = parseDate(tactiqueStartDate);
    endDate = parseDate(tactiqueEndDate);
  } else {
    startDate = parseDate(breakdown.startDate);
    endDate = parseDate(breakdown.endDate);
  }

  // Ajuster au lundi pour TOUS les breakdowns PEBs
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 1) {
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);
  }

  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDate().toString().padStart(2, '0');
    const monthNames = t('breakdownPeriod.months.shortTitleCase').split(',');
    const month = monthNames[current.getMonth()];

    const periodId = generateUniquePeriodId();
    const periodStartDate = new Date(current);

    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      startDate: periodStartDate
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
 * CORRIGÉ: Génère les périodes pour un breakdown personnalisé
 */
export function generateCustomPeriods(breakdown: Breakdown): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];

  if (breakdown.customPeriods) {
    breakdown.customPeriods
      .sort((a, b) => a.order - b.order)
      .forEach((period) => {
        const periodId = period.id || generateUniquePeriodId();
        
        periods.push({
          id: periodId,
          label: period.name,
          value: '',
          breakdownId: breakdown.id,
          breakdownName: breakdown.name,
          startDate: period.date ? parseDate(period.date) : undefined
        });
      });
  }

  return periods;
}

/**
 * CORRIGÉ: Génère toutes les périodes pour tous les breakdowns
 */
export function generateAllPeriods(
  breakdowns: Breakdown[], 
  tactiqueStartDate: string | undefined, 
  tactiqueEndDate: string | undefined,
  t: TFunction
): BreakdownPeriod[] {
  const allPeriods: BreakdownPeriod[] = [];

  console.log(`🚀 Génération de toutes les périodes pour ${breakdowns.length} breakdowns`);
  console.log(`🎯 Dates de tactique: ${tactiqueStartDate} → ${tactiqueEndDate}`);

  breakdowns.forEach(breakdown => {
    let periods: BreakdownPeriod[] = [];

    console.log(`\n📊 Processing breakdown: ${breakdown.name} (${breakdown.type})`);

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

    console.log(`✅ ${periods.length} périodes générées pour ${breakdown.name}`);
    allPeriods.push(...periods);
  });

  console.log(`🎉 Total: ${allPeriods.length} périodes générées`);
  return allPeriods;
}

/**
 * CORRIGÉ: Extrait la date de début d'une période depuis sa structure
 */
export function extractPeriodStartDate(period: BreakdownPeriod): Date | null {
  if (period.startDate) {
    return period.startDate;
  }

  console.warn('Impossible d\'extraire la date de la période:', period.id);
  return null;
}

// Dans breakdownPeriodUtils.ts

/**
 * CORRIGÉ: Calcule les périodes concernées par des dates de distribution
 * Ajout du paramètre breakdown pour avoir accès au type correct
 */
export function getPeriodsForDistribution(
  periods: BreakdownPeriod[],
  breakdownId: string, 
  startDate: string, 
  endDate: string,
  breakdown?: Breakdown  // NOUVEAU: paramètre breakdown pour connaître le type
): BreakdownPeriod[] {
  if (!startDate || !endDate) return [];

  const breakdownPeriods = periods.filter(p => p.breakdownId === breakdownId);
  const distributionStart = parseDate(startDate);
  const distributionEnd = parseDate(endDate);

  console.log(`🔍 Distribution: ${startDate} → ${endDate}`);
  console.log(`📊 ${breakdownPeriods.length} périodes à filtrer pour breakdown ${breakdownId}`);

  return breakdownPeriods.filter(period => {
    const periodStartDate = extractPeriodStartDate(period);
    if (!periodStartDate) {
      console.log(`⚠️ Pas de date de début pour période ${period.id}, inclusion par défaut`);
      return true;
    }

    // CORRIGÉ: Utiliser le breakdown passé en paramètre pour déterminer le type
    let periodEnd = new Date(periodStartDate);
    
    if (breakdown) {
      // Calculer la fin de période selon le type réel du breakdown
      if (breakdown.type === 'Hebdomadaire' || breakdown.type === 'PEBs') {
        periodEnd.setDate(periodEnd.getDate() + 6); // Fin de semaine (dimanche)
      } else if (breakdown.type === 'Mensuel') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0); // Dernier jour du mois
      } else if (breakdown.type === 'Custom') {
        // Pour les custom, on considère que la période dure 1 jour si pas d'autre info
        periodEnd = new Date(periodStartDate);
      }
    } else {
      // Fallback: essayer de déterminer le type par le nom (ancien comportement)
      if (period.breakdownName.includes('Hebdo') || period.breakdownName.includes('PEB')) {
        periodEnd.setDate(periodEnd.getDate() + 6);
      } else if (period.breakdownName.includes('Mensuel')) {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0);
      } else {
        console.log(`⚠️ Type de breakdown inconnu pour ${period.breakdownName}, inclusion par défaut`);
        return true;
      }
    }

    // Vérifier si la période chevauche avec la plage de distribution
    const isInRange = periodStartDate <= distributionEnd && periodEnd >= distributionStart;
    
    console.log(`📅 Période ${period.label}: ${periodStartDate.toISOString().split('T')[0]} → ${periodEnd.toISOString().split('T')[0]} | Range: ${isInRange}`);
    
    return isInRange;
  });
}

// ============================================================================
// NOUVELLES FONCTIONS POUR LA GESTION DE LA STRUCTURE FIREBASE
// ============================================================================

/**
 * NOUVEAU: Crée les métadonnées d'une période selon le breakdown et les paramètres
 */
export function createPeriodMetadata(
  breakdown: Breakdown,
  periodDate?: Date,
  customName?: string,
  order: number = 0
): GeneratedPeriodMeta {
  const periodId = generateUniquePeriodId();
  
  if (breakdown.type === 'Custom') {
    return {
      id: periodId,
      name: customName || `Période ${order + 1}`,
      order
    };
  } else {
    if (!periodDate) {
      throw new Error('Date requise pour les breakdowns automatiques');
    }
    
    return {
      id: periodId,
      date: calculatePeriodStartDate(periodDate, breakdown.type),
      order
    };
  }
}

/**
 * NOUVEAU: Génère toutes les métadonnées de périodes pour un breakdown donné
 */
export function generatePeriodMetadataForBreakdown(
  breakdown: Breakdown,
  tactiqueStartDate?: string,
  tactiqueEndDate?: string
): GeneratedPeriodMeta[] {
  const metadata: GeneratedPeriodMeta[] = [];

  if (breakdown.type === 'Custom') {
    if (breakdown.customPeriods) {
      breakdown.customPeriods
        .sort((a, b) => a.order - b.order)
        .forEach((period, index) => {
          metadata.push({
            id: period.id || generateUniquePeriodId(),
            name: period.name,
            order: index
          });
        });
    }
    return metadata;
  }

  let startDate: Date, endDate: Date;

  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = parseDate(tactiqueStartDate);
    endDate = parseDate(tactiqueEndDate);
  } else {
    startDate = parseDate(breakdown.startDate);
    endDate = parseDate(breakdown.endDate);
  }

  let current = new Date(startDate);
  let order = 0;

  if (breakdown.type === 'Mensuel') {
    current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (current <= endDate) {
      metadata.push(createPeriodMetadata(breakdown, current, undefined, order++));
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    // Ajuster au lundi pour Hebdomadaire/PEBs
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 1) {
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      current.setDate(current.getDate() - daysToSubtract);
    }
    
    while (current <= endDate) {
      metadata.push(createPeriodMetadata(breakdown, current, undefined, order++));
      current.setDate(current.getDate() + 7);
    }
  }

  return metadata;
}