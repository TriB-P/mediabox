// app/components/Tactiques/Tactiques/breakdownPeriodUtils.ts
/**
 * CORRIGÉ: Génération d'IDs déterministes pour éviter la perte de données utilisateur
 * Les IDs sont maintenant basés sur des propriétés stables des périodes
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
 * CORRIGÉ: Génère un ID déterministe pour une période basé sur ses propriétés stables
 */
function generateDeterministicPeriodId(
  breakdownId: string,
  breakdownType: string,
  periodDate?: Date,
  periodName?: string,
  order?: number
): string {
  let baseString = `${breakdownId}_`;
  
  if (breakdownType === 'Custom') {
    // Pour Custom: utiliser le nom et l'ordre
    baseString += `custom_${periodName}_${order}`;
  } else {
    // Pour les types automatiques: utiliser la date
    if (periodDate) {
      const dateStr = periodDate.toISOString().split('T')[0]; // YYYY-MM-DD
      baseString += `${breakdownType.toLowerCase()}_${dateStr}`;
    } else {
      // Fallback si pas de date
      baseString += `${breakdownType.toLowerCase()}_${order}`;
    }
  }
  
  // Convertir en hash simple pour avoir un ID plus court mais stable
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en 32bit integer
  }
  
  // Retourner un ID positif de 8 caractères
  return Math.abs(hash).toString(36).padStart(8, '0');
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
 * CORRIGÉ: Génère les périodes pour un breakdown mensuel avec IDs déterministes
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

  let order = 0;
  while (current <= endDate) {
    const monthNames = t('breakdownPeriod.months.short').split(',');
    const monthLabel = monthNames[current.getMonth()];
    const yearSuffix = current.getFullYear().toString().slice(-2);

    // Date de début calculée
    const periodStartDate = new Date(current.getFullYear(), current.getMonth(), 1);
    
    // CORRIGÉ: ID déterministe basé sur la date
    const periodId = generateDeterministicPeriodId(
      breakdown.id, 
      breakdown.type, 
      periodStartDate
    );

    console.log(`📅 Génération période: ${monthLabel} ${yearSuffix} (${periodStartDate.toISOString().split('T')[0]}) - ID: ${periodId}`);

    periods.push({
      id: periodId,
      label: `${monthLabel} ${yearSuffix}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      startDate: periodStartDate
    });

    current.setMonth(current.getMonth() + 1);
    order++;
  }

  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  console.log(`✅ ${periods.length} périodes générées:`, periods.map(p => `${p.label} (${p.id})`));

  return periods;
}

/**
 * CORRIGÉ: Génère les périodes pour un breakdown hebdomadaire avec IDs déterministes
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
  let order = 0;

  while (current <= endDate) {
    const day = current.getDate().toString().padStart(2, '0');
    const monthNames = t('breakdownPeriod.months.shortTitleCase').split(',');
    const month = monthNames[current.getMonth()];

    const periodStartDate = new Date(current);
    
    // CORRIGÉ: ID déterministe basé sur la date
    const periodId = generateDeterministicPeriodId(
      breakdown.id, 
      breakdown.type, 
      periodStartDate
    );

    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      startDate: periodStartDate
    });

    current.setDate(current.getDate() + 7);
    order++;
  }

  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  return periods;
}

/**
 * CORRIGÉ: Génère les périodes pour un breakdown PEBs avec IDs déterministes
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
  let order = 0;

  while (current <= endDate) {
    const day = current.getDate().toString().padStart(2, '0');
    const monthNames = t('breakdownPeriod.months.shortTitleCase').split(',');
    const month = monthNames[current.getMonth()];

    const periodStartDate = new Date(current);
    
    // CORRIGÉ: ID déterministe basé sur la date
    const periodId = generateDeterministicPeriodId(
      breakdown.id, 
      breakdown.type, 
      periodStartDate
    );

    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      startDate: periodStartDate
    });

    current.setDate(current.getDate() + 7);
    order++;
  }

  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  return periods;
}

/**
 * CORRIGÉ: Génère les périodes pour un breakdown personnalisé avec IDs déterministes
 */
export function generateCustomPeriods(breakdown: Breakdown): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];

  if (breakdown.customPeriods) {
    breakdown.customPeriods
      .sort((a, b) => a.order - b.order)
      .forEach((period) => {
        // CORRIGÉ: Utiliser l'ID du breakdown pour Custom ou générer un ID déterministe
        const periodId = period.id || generateDeterministicPeriodId(
          breakdown.id,
          breakdown.type,
          undefined,
          period.name,
          period.order
        );
        
        periods.push({
          id: periodId,
          label: period.name,
          value: '',
          breakdownId: breakdown.id,
          breakdownName: breakdown.name,
          startDate: period.date ? parseDate(period.date) : undefined,
          periodName: period.name
        });
      });
  }

  return periods;
}

/**
 * CORRIGÉ: Génère toutes les périodes pour tous les breakdowns avec IDs déterministes
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
    console.log(`🆔 IDs générés:`, periods.map(p => `${p.label}: ${p.id}`));
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

/**
 * CORRIGÉ: Calcule les périodes concernées par des dates de distribution
 */
export function getPeriodsForDistribution(
  periods: BreakdownPeriod[],
  breakdownId: string, 
  startDate: string, 
  endDate: string,
  breakdown?: Breakdown
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

    let periodEnd = new Date(periodStartDate);
    
    if (breakdown) {
      if (breakdown.type === 'Hebdomadaire' || breakdown.type === 'PEBs') {
        periodEnd.setDate(periodEnd.getDate() + 6);
      } else if (breakdown.type === 'Mensuel') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0);
      } else if (breakdown.type === 'Custom') {
        periodEnd = new Date(periodStartDate);
      }
    } else {
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

    const isInRange = periodStartDate <= distributionEnd && periodEnd >= distributionStart;
    
    console.log(`📅 Période ${period.label}: ${periodStartDate.toISOString().split('T')[0]} → ${periodEnd.toISOString().split('T')[0]} | Range: ${isInRange}`);
    
    return isInRange;
  });
}

// ============================================================================
// NOUVELLES FONCTIONS POUR LA GESTION DE LA STRUCTURE FIREBASE
// ============================================================================

/**
 * CORRIGÉ: Crée les métadonnées d'une période avec ID déterministe
 */
export function createPeriodMetadata(
  breakdown: Breakdown,
  periodDate?: Date,
  customName?: string,
  order: number = 0
): GeneratedPeriodMeta {
  const periodId = breakdown.type === 'Custom' 
    ? generateDeterministicPeriodId(breakdown.id, breakdown.type, undefined, customName, order)
    : generateDeterministicPeriodId(breakdown.id, breakdown.type, periodDate);
  
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
 * CORRIGÉ: Génère toutes les métadonnées de périodes avec IDs déterministes
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
          const periodId = period.id || generateDeterministicPeriodId(
            breakdown.id,
            breakdown.type,
            undefined,
            period.name,
            index
          );
          
          metadata.push({
            id: periodId,
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