// app/components/Tactiques/Views/Timeline/timelinePeriodsUtils.ts
/**
 * AMÉLIORÉ: Utilitaires pour générer les périodes d'affichage avec:
 * - Support des IDs uniques pour toutes les périodes
 * - Utilisation des champs date/name selon le type
 * - Lecture cohérente avec la nouvelle structure de données Firebase
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
  id: string;           // NOUVEAU: ID unique Firebase
  label: string;
  fieldName: string;    // Conservé pour compatibilité
  breakdownId: string;
  breakdownName: string;
  isFirst?: boolean;
  isLast?: boolean;
  order: number;
  date?: string;        // NOUVEAU: Date de début pour types automatiques
  periodName?: string;  // NOUVEAU: Nom pour type custom
}

/**
 * Interface pour les traductions de périodes
 */
export interface PeriodTranslations {
  shortMonths: string[]; // e.g., ['JAN', 'FEV', ...]
  mediumMonths: string[]; // e.g., ['Jan', 'Fév', ...]
}

/**
 * AMÉLIORÉ: Génère les périodes pour un breakdown mensuel avec IDs uniques et dates
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
    
    // NOUVEAU: Génération d'ID unique (simulé ici, dans Firebase ce sera généré côté serveur)
    const periodId = `period_${breakdown.id}_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}`;
    
    // NOUVEAU: Date de début calculée
    const periodDate = new Date(current.getFullYear(), current.getMonth(), 1).toISOString().split('T')[0];
    
    periods.push({
      id: periodId,
      label: `${monthLabel} ${yearSuffix}`,
      fieldName: `TC_Breakdown_${periodId}`, // Conservé pour compatibilité
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      order: order++,
      date: periodDate // NOUVEAU: Date de début
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
 * AMÉLIORÉ: Génère les périodes pour un breakdown hebdomadaire avec IDs uniques et dates
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
    
    // NOUVEAU: Génération d'ID unique
    const periodId = `period_${breakdown.id}_week_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}_${String(current.getDate()).padStart(2, '0')}`;
    
    // NOUVEAU: Date de début (lundi de la semaine)
    const periodDate = current.toISOString().split('T')[0];
    
    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      fieldName: `TC_Breakdown_${periodId}`, // Conservé pour compatibilité
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      order: order++,
      date: periodDate // NOUVEAU: Date de début
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
 * NOUVEAU: Génère les périodes pour un breakdown PEBs avec IDs uniques et dates
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
    
    // NOUVEAU: Génération d'ID unique (identique aux périodes hebdomadaires pour compatibilité)
    const periodId = `period_${breakdown.id}_week_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}_${String(current.getDate()).padStart(2, '0')}`;
    
    // NOUVEAU: Date de début (lundi de la semaine)
    const periodDate = current.toISOString().split('T')[0];
    
    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      fieldName: `TC_Breakdown_${periodId}`, // Conservé pour compatibilité
      breakdownId: breakdown.id,
      breakdownName: breakdown.name,
      order: order++,
      date: periodDate // NOUVEAU: Date de début
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
 * AMÉLIORÉ: Génère les périodes pour un breakdown personnalisé avec IDs uniques et noms
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
        id: period.id, // NOUVEAU: Utiliser l'ID unique Firebase
        label: period.name,
        fieldName: `TC_Breakdown_${breakdown.id}_${period.id}`, // Conservé pour compatibilité
        breakdownId: breakdown.id,
        breakdownName: breakdown.name,
        order: index,
        periodName: period.name // NOUVEAU: Nom de la période custom
      });
    });

  return periods;  
}

/**
 * AMÉLIORÉ: Génère toutes les périodes pour un breakdown donné avec nouvelle structure
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
 * AMÉLIORÉ: Obtient la valeur d'une période pour une tactique donnée avec IDs uniques
 */
export function getPeriodValue(tactique: any, period: TimelinePeriod): string {
  return getTactiqueBreakdownValue(tactique, period.breakdownId, period.id);
}

/**
 * AMÉLIORÉ: Obtient le statut d'activation d'une période pour une tactique avec IDs uniques
 */
export function getPeriodActiveStatus(tactique: any, period: TimelinePeriod): boolean {
  return getTactiqueBreakdownToggleStatus(tactique, period.breakdownId, period.id);
}

/**
 * NOUVEAU: Obtient la date d'une période stockée en Firebase
 */
export function getPeriodDate(tactique: any, period: TimelinePeriod): string {
  return getTactiqueBreakdownPeriodDate(tactique, period.breakdownId, period.id);
}

/**
 * NOUVEAU: Obtient le nom d'une période custom stocké en Firebase
 */
export function getPeriodName(tactique: any, period: TimelinePeriod): string {
  return getTactiqueBreakdownPeriodName(tactique, period.breakdownId, period.id);
}

/**
 * AMÉLIORÉ: Calcule le total des valeurs numériques pour un breakdown avec nouvelle structure
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
 * AMÉLIORÉ: Vérifie si toutes les valeurs d'un breakdown sont numériques avec nouvelle structure
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
 * AMÉLIORÉ: Distribue équitablement un montant sur les périodes actives EN TENANT COMPTE DES DATES DE TACTIQUE
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

  // NOUVEAU: Filtrer les périodes selon les dates de tactique (sauf pour Custom)
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
    // NOUVEAU: Pour PEBs, distribuer le montant total sur les périodes
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

      // NOUVEAU: Ajouter date ou name selon le type de période
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

      // NOUVEAU: Ajouter date ou name selon le type de période
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
 * NOUVEAU: Fonction helper pour parser les dates de manière sécurisée
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
 * NOUVEAU: Génère un label d'affichage approprié pour une période selon son type
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