// app/components/Tactiques/Views/Timeline/timelinePeriodsUtils.ts
/**
 * NETTOYÉ ET HARMONISÉ: Utilitaires pour générer les périodes d'affichage avec:
 * - Support uniquement des IDs déterministes (même logique que breakdownPeriodUtils.ts)
 * - Utilisation des champs date/name selon le type
 * - Lecture cohérente avec la structure de données Firebase
 * - Support amélioré du type PEBs
 */

import { Breakdown } from '../../../../types/breakdown';
import { 
  getTactiqueBreakdownValue,
  getTactiqueBreakdownToggleStatus,
  calculateTactiqueBreakdownTotal,
  areAllTactiqueBreakdownValuesNumeric,
  getTactiqueBreakdownPeriodDate,
  getTactiqueBreakdownPeriodName
} from '../../../../lib/breakdownService';

export interface TimelinePeriod {
  id: string;           // ID déterministe (même logique que breakdownPeriodUtils)
  label: string;
  fieldName: string;    // Conservé pour compatibilité
  breakdownId: string;
  breakdownName: string;
  isFirst?: boolean;
  isLast?: boolean;
  order: number;
  date?: string;        // Date de début pour types automatiques
  periodName?: string;  // Nom pour type custom
}

/**
 * Interface pour les traductions de périodes
 */
export interface PeriodTranslations {
  shortMonths: string[]; // e.g., ['JAN', 'FEV', ...]
  mediumMonths: string[]; // e.g., ['Jan', 'Fév', ...]
}

/**
 * HARMONISÉ: Génère un ID déterministe pour une période (même logique que breakdownPeriodUtils.ts)
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
 * HARMONISÉ: Génère les périodes pour un breakdown mensuel avec IDs déterministes
 */
export function generateMonthlyPeriods(
  breakdown: Breakdown,
  translations: PeriodTranslations,
  tactiqueStartDate?: string, 
  tactiqueEndDate?: string
): TimelinePeriod[] {
  const periods: TimelinePeriod[] = [];

  let startDate: Date, endDate: Date;

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
    const monthLabel = translations.shortMonths[current.getMonth()];
    const yearSuffix = current.getFullYear().toString().slice(-2);
    
    // HARMONISÉ: Utiliser la même logique de génération d'ID déterministe
    const periodStartDate = new Date(current.getFullYear(), current.getMonth(), 1);
    const periodId = generateDeterministicPeriodId(
      breakdown.id, 
      breakdown.type, 
      periodStartDate
    );
    
    // Date de début calculée
    const periodDate = periodStartDate.toISOString().split('T')[0];
    
    periods.push({
      id: periodId,
      label: `${monthLabel} ${yearSuffix}`,
      fieldName: `TC_Breakdown_${periodId}`, // Conservé pour compatibilité
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      order: order++,
      date: periodDate
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
 * HARMONISÉ: Génère les périodes pour un breakdown hebdomadaire avec IDs déterministes
 */
export function generateWeeklyPeriods(
  breakdown: Breakdown,
  translations: PeriodTranslations,
  tactiqueStartDate?: string, 
  tactiqueEndDate?: string
): TimelinePeriod[] {
  const periods: TimelinePeriod[] = [];

  let startDate: Date, endDate: Date;

  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = new Date(tactiqueStartDate);
    endDate = new Date(tactiqueEndDate);
  } else {
    startDate = new Date(breakdown.startDate);
    endDate = new Date(breakdown.endDate);
  }

  // Ajuster au lundi le plus proche pour TOUS les breakdowns hebdomadaires
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 1) {
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);
  }

  const current = new Date(startDate);
  let order = 0;

  while (current <= endDate) {
    const day = current.getDate().toString().padStart(2, '0');
    const month = translations.mediumMonths[current.getMonth()];
    
    // HARMONISÉ: Utiliser la même logique de génération d'ID déterministe
    const periodStartDate = new Date(current);
    const periodId = generateDeterministicPeriodId(
      breakdown.id, 
      breakdown.type, 
      periodStartDate
    );
    
    // Date de début (lundi de la semaine)
    const periodDate = periodStartDate.toISOString().split('T')[0];
    
    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      fieldName: `TC_Breakdown_${periodId}`, // Conservé pour compatibilité
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      order: order++,
      date: periodDate
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
 * HARMONISÉ: Génère les périodes pour un breakdown PEBs avec IDs déterministes
 */
export function generatePEBsPeriods(
  breakdown: Breakdown,
  translations: PeriodTranslations,
  tactiqueStartDate?: string, 
  tactiqueEndDate?: string
): TimelinePeriod[] {
  const periods: TimelinePeriod[] = [];

  let startDate: Date, endDate: Date;

  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = new Date(tactiqueStartDate);
    endDate = new Date(tactiqueEndDate);
  } else {
    startDate = new Date(breakdown.startDate);
    endDate = new Date(breakdown.endDate);
  }

  // Ajuster au lundi le plus proche pour TOUS les breakdowns PEBs
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 1) {
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);
  }

  const current = new Date(startDate);
  let order = 0;

  while (current <= endDate) {
    const day = current.getDate().toString().padStart(2, '0');
    const month = translations.mediumMonths[current.getMonth()];
    
    // HARMONISÉ: Utiliser la même logique de génération d'ID déterministe
    const periodStartDate = new Date(current);
    const periodId = generateDeterministicPeriodId(
      breakdown.id, 
      breakdown.type, 
      periodStartDate
    );
    
    // Date de début (lundi de la semaine)
    const periodDate = periodStartDate.toISOString().split('T')[0];
    
    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      fieldName: `TC_Breakdown_${periodId}`, // Conservé pour compatibilité
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      order: order++,
      date: periodDate
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
 * HARMONISÉ: Génère les périodes pour un breakdown personnalisé avec IDs déterministes
 */
export function generateCustomPeriods(breakdown: Breakdown): TimelinePeriod[] {
  const periods: TimelinePeriod[] = [];

  if (!breakdown.customPeriods || breakdown.customPeriods.length === 0) {
    return periods;
  }

  breakdown.customPeriods
    .sort((a, b) => a.order - b.order)
    .forEach((period, index) => {
      // HARMONISÉ: Utiliser la même logique pour les IDs custom
      const periodId = period.id || generateDeterministicPeriodId(
        breakdown.id,
        breakdown.type,
        undefined,
        period.name,
        index
      );
      
      periods.push({
        id: periodId,
        label: period.name,
        fieldName: `TC_Breakdown_${periodId}`, // Conservé pour compatibilité
        breakdownId: breakdown.id,
        breakdownName: breakdown.name,
        order: index,
        periodName: period.name
      });
    });

  return periods;  
}

/**
 * NETTOYÉ: Génère toutes les périodes pour un breakdown donné avec IDs déterministes harmonisés
 */
export function generatePeriodsForBreakdown(
  breakdown: Breakdown,
  translations: PeriodTranslations,
  tactiqueStartDate?: string,
  tactiqueEndDate?: string
): TimelinePeriod[] {
  switch (breakdown.type) {
    case 'Mensuel':
      return generateMonthlyPeriods(breakdown, translations, tactiqueStartDate, tactiqueEndDate);
    case 'Hebdomadaire':
      return generateWeeklyPeriods(breakdown, translations, tactiqueStartDate, tactiqueEndDate);
    case 'PEBs':
      return generatePEBsPeriods(breakdown, translations, tactiqueStartDate, tactiqueEndDate);
    case 'Custom':
      return generateCustomPeriods(breakdown);
    default:
      console.warn(`Type de breakdown non supporté: ${breakdown.type}`);
      return [];
  }
}

/**
 * NETTOYÉ: Obtient la valeur d'une période pour une tactique donnée avec IDs déterministes
 */
export function getPeriodValue(tactique: any, period: TimelinePeriod): string {
  return getTactiqueBreakdownValue(tactique, period.breakdownId, period.id);
}

/**
 * NETTOYÉ: Obtient le statut d'activation d'une période pour une tactique avec IDs déterministes
 */
export function getPeriodActiveStatus(tactique: any, period: TimelinePeriod): boolean {
  return getTactiqueBreakdownToggleStatus(tactique, period.breakdownId, period.id);
}

/**
 * NETTOYÉ: Obtient la date d'une période stockée en Firebase
 */
export function getPeriodDate(tactique: any, period: TimelinePeriod): string {
  return getTactiqueBreakdownPeriodDate(tactique, period.breakdownId, period.id);
}

/**
 * NETTOYÉ: Obtient le nom d'une période custom stocké en Firebase
 */
export function getPeriodName(tactique: any, period: TimelinePeriod): string {
  return getTactiqueBreakdownPeriodName(tactique, period.breakdownId, period.id);
}

/**
 * NETTOYÉ: Calcule le total des valeurs numériques pour un breakdown avec IDs déterministes
 */
export function calculateBreakdownTotal(
  tactique: any, 
  periods: TimelinePeriod[], 
  isDefaultBreakdown: boolean = false,
  breakdownType?: string
): number {
  if (periods.length === 0) return 0;
  
  const breakdownId = periods[0].breakdownId;
  return calculateTactiqueBreakdownTotal(tactique, breakdownId, isDefaultBreakdown, breakdownType);
}

/**
 * NETTOYÉ: Vérifie si toutes les valeurs d'un breakdown sont numériques avec IDs déterministes
 */
export function areAllValuesNumeric(
  tactique: any, 
  periods: TimelinePeriod[], 
  isDefaultBreakdown: boolean = false,
  breakdownType?: string
): boolean {
  if (periods.length === 0) return false;
  
  const breakdownId = periods[0].breakdownId;
  return areAllTactiqueBreakdownValuesNumeric(tactique, breakdownId, isDefaultBreakdown, breakdownType);
}

/**
 * NETTOYÉ: Distribue équitablement un montant sur les périodes actives avec IDs déterministes
 */
export function distributeAmountEqually(
  totalAmount: number,
  periods: TimelinePeriod[],
  activePeriods: { [periodId: string]: boolean } = {},
  isDefaultBreakdown: boolean = false,
  breakdownType?: string,
  tactiqueStartDate?: string,
  tactiqueEndDate?: string
): { [periodId: string]: { value: string; isToggled: boolean; order: number; unitCost?: string; total?: string; date?: string; name?: string } } {
  
  console.log('🎯 Distribution - Params reçus:', {
    totalAmount,
    periodsCount: periods.length,
    tactiqueStartDate,
    tactiqueEndDate,
    breakdownType
  });

  // Filtrer les périodes selon les dates de tactique (sauf pour Custom)
  let relevantPeriods = periods;
  
  if (breakdownType !== 'Custom' && tactiqueStartDate && tactiqueEndDate) {
    console.log('🔍 Filtrage des périodes selon les dates de tactique...');
    
    const tactiqueStart = parseDate(tactiqueStartDate);
    const tactiqueEnd = parseDate(tactiqueEndDate);
    
    relevantPeriods = periods.filter(period => {
      // Pour les breakdowns par défaut, vérifier aussi l'état d'activation
      if (isDefaultBreakdown && activePeriods[period.id] === false) {
        console.log(`❌ Période ${period.label} désactivée`);
        return false;
      }
      
      // Filtrer selon les dates
      if (period.date) {
        const periodStart = parseDate(period.date);
        
        // Calculer la fin de période selon le type
        const periodEnd = new Date(periodStart);
        if (breakdownType === 'Hebdomadaire' || breakdownType === 'PEBs') {
          periodEnd.setDate(periodEnd.getDate() + 6);
        } else if (breakdownType === 'Mensuel') {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          periodEnd.setDate(0);
        }
        
        // La période est incluse si elle intersecte avec les dates de tactique
        const isInRange = periodStart <= tactiqueEnd && periodEnd >= tactiqueStart;
        
        console.log(`📅 Période ${period.label}: ${periodStart.toISOString().split('T')[0]} → ${periodEnd.toISOString().split('T')[0]} = ${isInRange ? '✅ INCLUSE' : '❌ EXCLUE'}`);
        
        return isInRange;
      }
      
      // Si pas de date, inclure par défaut (ne devrait pas arriver pour les types automatiques)
      console.log(`⚠️ Période ${period.label} sans date - incluse par défaut`);
      return true;
    });
  } else {
    // Pour Custom ou si pas de dates de tactique, utiliser la logique originale
    relevantPeriods = periods.filter(period => {
      if (!isDefaultBreakdown) return true;
      return activePeriods[period.id] !== false;
    });
  }

  console.log(`✅ ${relevantPeriods.length}/${periods.length} périodes sélectionnées pour distribution`);
  console.log('📋 Périodes à distribuer:', relevantPeriods.map(p => p.label));

  if (relevantPeriods.length === 0) {
    console.log('❌ Aucune période valide pour distribution');
    return {};
  }

  const result: { [periodId: string]: { value: string; isToggled: boolean; order: number; unitCost?: string; total?: string; date?: string; name?: string } } = {};

  if (breakdownType === 'PEBs') {
    // Pour PEBs, distribuer le montant total sur les périodes
    const amountPerPeriod = totalAmount / relevantPeriods.length;
    console.log(`💰 PEBs - Distribution: ${totalAmount} / ${relevantPeriods.length} = ${amountPerPeriod} par période`);
    
    relevantPeriods.forEach(period => {
      const periodData: any = {
        value: '1', // Volume par défaut à 1
        unitCost: amountPerPeriod.toFixed(2), // Montant distribué comme coût par unité
        total: amountPerPeriod.toFixed(2), // Total calculé
        isToggled: true,
        order: period.order
      };

      // Ajouter date ou name selon le type de période
      if (period.date) {
        periodData.date = period.date;
      }
      if (period.periodName) {
        periodData.name = period.periodName;
      }

      result[period.id] = periodData;
    });
  } else {
    // Pour les autres types, distribution normale sur value
    const amountPerPeriod = totalAmount / relevantPeriods.length;
    console.log(`💰 Distribution normale: ${totalAmount} / ${relevantPeriods.length} = ${amountPerPeriod} par période`);
    
    relevantPeriods.forEach(period => {
      const periodData: any = {
        value: amountPerPeriod.toFixed(2),
        isToggled: true,
        order: period.order
      };

      // Ajouter date ou name selon le type de période
      if (period.date) {
        periodData.date = period.date;
      }
      if (period.periodName) {
        periodData.name = period.periodName;
      }

      result[period.id] = periodData;
    });
  }

  console.log('✅ Distribution terminée:', Object.keys(result).length, 'périodes mises à jour');
  return result;
}

/**
 * Fonction helper pour parser les dates de manière sécurisée
 */
function parseDate(dateString: string): Date {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return new Date(dateString);
}

/**
 * NETTOYÉ: Génère un label d'affichage approprié pour une période selon son type
 */
export function generatePeriodDisplayLabel(
  period: TimelinePeriod,
  breakdownType: string,
  translations: PeriodTranslations
): string {
  if (breakdownType === 'Custom') {
    return period.periodName || period.label;
  }

  // Pour les types automatiques, utiliser la date si disponible
  if (period.date) {
    const date = new Date(period.date);
    
    if (breakdownType === 'Mensuel') {
      const month = translations.shortMonths[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);
      return `${month} ${year}`;
    } else {
      // Hebdomadaire, PEBs
      const day = date.getDate().toString().padStart(2, '0');
      const month = translations.mediumMonths[date.getMonth()];
      return `${day} ${month}`;
    }
  }

  // Fallback au label existant
  return period.label;
}