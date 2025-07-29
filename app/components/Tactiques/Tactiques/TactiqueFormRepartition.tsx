// app/components/Tactiques/Tactiques/TactiqueFormRepartition.tsx
/**
 * CORRIGÉ: Problème de réinitialisation des valeurs dans le drawer de tactique
 * NOUVEAU: IDs de périodes standardisés compatibles avec la timeline
 * NOUVEAU: Support du type PEBs avec 3 inputs (coût/unité, volume, total calculé)
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpIcon,
  createLabelWithHelp,
  FormSection
} from './TactiqueFormComponents';
import { Breakdown } from '../../../types/breakdown';
import { CalendarIcon, ClockIcon, Cog6ToothIcon, CalculatorIcon, PlusIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  getTactiqueBreakdownValue,
  getTactiqueBreakdownUnitCost,
  getTactiqueBreakdownTotal,
  getTactiqueBreakdownToggleStatus,
  calculateTactiqueBreakdownTotal,
  areAllTactiqueBreakdownValuesNumeric,
  calculatePEBsTotal
} from '../../../lib/breakdownService';

interface TactiqueFormRepartitionProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  breakdowns: Breakdown[];
  loading?: boolean;
}

interface BreakdownPeriod {
  id: string;
  label: string;
  value: string;
  breakdownId: string;
  breakdownName: string;
  isFirst?: boolean;
  isLast?: boolean;
}

interface DistributionModalState {
  isOpen: boolean;
  breakdownId: string | null;
  totalAmount: string;
  distributionMode: 'equal' | 'weighted';
  startDate: string; // NOUVEAU: Date de début personnalisable
  endDate: string;   // NOUVEAU: Date de fin personnalisable
  pebsField: 'unitCost' | 'value'; // NOUVEAU: Champ à distribuer pour PEBs
}

// CORRIGÉ: Fonctions de génération de périodes avec IDs standardisés (identiques à timelinePeriodsUtils.ts)
function generateMonthlyPeriods(breakdown: Breakdown, tactiqueStartDate?: string, tactiqueEndDate?: string): BreakdownPeriod[] {
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
    const monthNames = ['JAN', 'FEB', 'MAR', 'AVR', 'MAI', 'JUN',
      'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'];

    const monthLabel = monthNames[current.getMonth()];
    const yearSuffix = current.getFullYear().toString().slice(-2);

    // CORRIGÉ: ID standardisé avec préfixe breakdown pour éviter les collisions
    const periodId = `${breakdown.id}_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}`;

    periods.push({
      id: periodId, // CORRIGÉ: Avec préfixe breakdown pour unicité
      label: `${monthLabel} ${yearSuffix}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name
    });

    current.setMonth(current.getMonth() + 1);
  }

  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  return periods;
}

function generateWeeklyPeriods(breakdown: Breakdown, tactiqueStartDate?: string, tactiqueEndDate?: string): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];

  let startDate: Date, endDate: Date;

  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = new Date(tactiqueStartDate);
    endDate = new Date(tactiqueEndDate);
  } else {
    startDate = new Date(breakdown.startDate);
    endDate = new Date(breakdown.endDate);
  }

  // CORRIGÉ: Toujours ajuster au lundi pour TOUS les breakdowns hebdomadaires
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 1) { // Si ce n'est pas un lundi
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);
  }

  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const month = monthNames[current.getMonth()];

    // CORRIGÉ: ID standardisé avec préfixe breakdown pour éviter les collisions
    const periodId = `${breakdown.id}_week_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}_${String(current.getDate()).padStart(2, '0')}`;

    periods.push({
      id: periodId, // CORRIGÉ: Avec préfixe breakdown pour unicité
      label: `${day} ${month}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name
    });

    current.setDate(current.getDate() + 7);
  }

  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  return periods;
}

// NOUVEAU: Génération de périodes PEBs (identique aux périodes hebdomadaires)
function generatePEBsPeriods(breakdown: Breakdown, tactiqueStartDate?: string, tactiqueEndDate?: string): BreakdownPeriod[] {
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
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const month = monthNames[current.getMonth()];

    // ID standardisé identique aux périodes hebdomadaires
    const periodId = `week_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}_${String(current.getDate()).padStart(2, '0')}`;

    periods.push({
      id: periodId,
      label: `${day} ${month}`,
      value: '',
      breakdownId: breakdown.id,
      breakdownName: breakdown.name
    });

    current.setDate(current.getDate() + 7);
  }

  if (periods.length > 0) {
    periods[0].isFirst = true;
    periods[periods.length - 1].isLast = true;
  }

  return periods;
}

function generateCustomPeriods(breakdown: Breakdown): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];

  if (breakdown.customPeriods) {
    breakdown.customPeriods
      .sort((a, b) => a.order - b.order)
      .forEach((period) => {
        // CORRIGÉ: ID standardisé avec préfixe breakdown pour éviter les collisions
        periods.push({
          id: `${breakdown.id}_${period.id}`, // CORRIGÉ: Avec préfixe breakdown pour unicité
          label: period.name,
          value: '',
          breakdownId: breakdown.id,
          breakdownName: breakdown.name
        });
      });
  }

  return periods;
}

function generateAllPeriods(breakdowns: Breakdown[], tactiqueStartDate?: string, tactiqueEndDate?: string): BreakdownPeriod[] {
  const allPeriods: BreakdownPeriod[] = [];

  breakdowns.forEach(breakdown => {
    let periods: BreakdownPeriod[] = [];

    switch (breakdown.type) {
      case 'Mensuel':
        periods = generateMonthlyPeriods(breakdown, tactiqueStartDate, tactiqueEndDate);
        break;
      case 'Hebdomadaire':
        periods = generateWeeklyPeriods(breakdown, tactiqueStartDate, tactiqueEndDate);
        break;
      case 'PEBs': // NOUVEAU: Support du type PEBs
        periods = generatePEBsPeriods(breakdown, tactiqueStartDate, tactiqueEndDate);
        break;
      case 'Custom':
        periods = generateCustomPeriods(breakdown);
        break;
    }

    allPeriods.push(...periods);
  });

  return allPeriods;
}

function areAllValuesNumericForBreakdown(
  tactique: any,
  breakdownId: string,
  isDefaultBreakdown: boolean,
  breakdownType?: string
): boolean {
  // CORRIGÉ: Vérifie s'il y a au moins une valeur numérique, pas toutes
  return hasAtLeastOneNumericValue(tactique, breakdownId, isDefaultBreakdown, breakdownType);
}

/**
 * Nouvelle fonction : vérifie s'il y a au moins une valeur numérique valide
 * MODIFIÉ: Support du type PEBs
 */
function hasAtLeastOneNumericValue(
  tactique: any,
  breakdownId: string,
  isDefaultBreakdown: boolean,
  breakdownType?: string
): boolean {
  if (!tactique.breakdowns || !tactique.breakdowns[breakdownId]) {
    return false;
  }

  const breakdown = tactique.breakdowns[breakdownId];
  const periods = Object.values(breakdown.periods) as any[];
  
  const relevantPeriods = periods.filter(period => 
    !isDefaultBreakdown || period.isToggled
  );

  if (relevantPeriods.length === 0) {
    return false;
  }

  // NOUVEAU: Pour PEBs, vérifier unitCost et value (volume)
  if (breakdownType === 'PEBs') {
    return relevantPeriods.some(period => {
      const unitCost = period.unitCost?.trim();
      const volume = period.value?.trim();
      
      if (!unitCost || !volume) return false;
      
      const unitCostNum = parseFloat(unitCost);
      const volumeNum = parseFloat(volume);
      return !isNaN(unitCostNum) && isFinite(unitCostNum) && 
             !isNaN(volumeNum) && isFinite(volumeNum);
    });
  }

  // Pour les autres types, vérifier seulement value
  return relevantPeriods.some(period => {
    const value = period.value?.trim();
    if (!value) return false;
    
    const numValue = parseFloat(value);
    return !isNaN(numValue) && isFinite(numValue);
  });
}

function calculateTotalForBreakdown(
  tactique: any,
  breakdownId: string,
  isDefaultBreakdown: boolean,
  breakdownType?: string
): number {
  return calculateTactiqueBreakdownTotal(tactique, breakdownId, isDefaultBreakdown, breakdownType);
}

function calculatePercentageForBreakdown(value: string, total: number): number {
  if (total === 0) return 0;
  const numValue = parseFloat(value.trim());
  return !isNaN(numValue) ? (numValue / total) * 100 : 0;
}

function getFormattedDates(tactiqueStartDate?: string, tactiqueEndDate?: string): { startDateFormatted: string; endDateFormatted: string } {
  if (!tactiqueStartDate || !tactiqueEndDate) {
    return { startDateFormatted: '', endDateFormatted: '' };
  }

  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const startDate = parseDate(tactiqueStartDate);
  const endDate = parseDate(tactiqueEndDate);

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const monthNames = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun',
      'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
    const month = monthNames[date.getMonth()];
    return `${day} ${month}`;
  };

  return {
    startDateFormatted: formatDate(startDate),
    endDateFormatted: formatDate(endDate)
  };
}

function distributeAmountEqually(
  totalAmount: number,
  breakdownPeriods: BreakdownPeriod[],
  activePeriods: { [key: string]: boolean },
  isDefaultBreakdown: boolean,
  tactiqueStartDate?: string,
  tactiqueEndDate?: string,
  breakdownType?: string
): { [key: string]: string } {
  // NOUVEAU: Filtrer les périodes selon les dates de la tactique
  let relevantPeriods = breakdownPeriods;
  
  if (tactiqueStartDate && tactiqueEndDate) {
    const tactiqueStart = new Date(tactiqueStartDate);
    const tactiqueEnd = new Date(tactiqueEndDate);
    
    relevantPeriods = breakdownPeriods.filter(period => {
      // Extraire la date de début de période depuis l'ID
      const periodStartDate = extractPeriodStartDate(period);
      if (!periodStartDate) return true; // Garder si on ne peut pas déterminer
      
      // Vérifier si la période intersecte avec les dates de tactique
      const periodEnd = new Date(periodStartDate);
      if (period.id.includes('week_')) {
        // Pour les semaines, ajouter 6 jours
        periodEnd.setDate(periodEnd.getDate() + 6);
      } else if (period.id.match(/^\w+_\d{4}_\d{2}$/)) {
        // Pour les mois, aller au dernier jour du mois
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0);
      }
      
      // Intersecte si : début période <= fin tactique ET fin période >= début tactique
      return periodStartDate <= tactiqueEnd && periodEnd >= tactiqueStart;
    });
  }
  
  const activePeriodsList = relevantPeriods.filter(period =>
    !isDefaultBreakdown || activePeriods[period.id] !== false
  );

  if (activePeriodsList.length === 0) return {};

  const result: { [key: string]: string } = {};

  if (breakdownType === 'PEBs') {
    // NOUVEAU: Pour PEBs, distribuer le montant total sur les périodes
    // et laisser l'utilisateur définir comment répartir entre unitCost et volume
    const amountPerPeriod = totalAmount / activePeriodsList.length;
    
    activePeriodsList.forEach(period => {
      result[period.id] = amountPerPeriod.toFixed(2);
    });
  } else {
    // Pour les autres types, distribution normale sur value
    const amountPerPeriod = totalAmount / activePeriodsList.length;
    
    activePeriodsList.forEach(period => {
      result[period.id] = amountPerPeriod.toFixed(2);
    });
  }

  return result;
}

/**
 * NOUVEAU: Extrait la date de début d'une période depuis son ID
 */
function extractPeriodStartDate(period: BreakdownPeriod): Date | null {
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

function getBreakdownIcon(type: string) {
  switch (type) {
    case 'Hebdomadaire':
      return CalendarIcon;
    case 'Mensuel':
      return ClockIcon;
    case 'PEBs':
      return CalculatorIcon; // NOUVEAU: Icône pour PEBs
    case 'Custom':
      return Cog6ToothIcon;
    default:
      return CalendarIcon;
  }
}

export default function TactiqueFormRepartition({
  formData,
  onChange,
  onTooltipChange,
  breakdowns,
  loading = false
}: TactiqueFormRepartitionProps) {

  const [periods, setPeriods] = useState<BreakdownPeriod[]>([]);
  const [localBreakdownData, setLocalBreakdownData] = useState<any>({}); // État local pour les données de breakdown
  const [collapsedBreakdowns, setCollapsedBreakdowns] = useState<{ [key: string]: boolean }>({}); // NOUVEAU: État collapse/expand
  const [distributionModal, setDistributionModal] = useState<DistributionModalState>({
    isOpen: false,
    breakdownId: null,
    totalAmount: '',
    distributionMode: 'equal',
    startDate: '', // NOUVEAU: Initialisé vide
    endDate: '',   // NOUVEAU: Initialisé vide
    pebsField: 'unitCost' // NOUVEAU: Par défaut sur coût/unité
  });

  /**
   * Crée l'objet breakdowns structuré à partir de l'état local
   */
  const createBreakdownsObject = useCallback(() => {
    const breakdownsObj: any = {};
    
    // Grouper les périodes par breakdown pour construire la structure
    const periodsByBreakdown = periods.reduce((acc, period) => {
      if (!acc[period.breakdownId]) {
        acc[period.breakdownId] = [];
      }
      acc[period.breakdownId].push(period);
      return acc;
    }, {} as { [key: string]: BreakdownPeriod[] });

    Object.entries(periodsByBreakdown).forEach(([breakdownId, breakdownPeriods]) => {
      const breakdown = breakdowns.find(b => b.id === breakdownId);
      if (!breakdown) return;

      breakdownsObj[breakdownId] = {
        name: breakdown.name,
        type: breakdown.type,
        periods: {}
      };

      // NOUVEAU: Trier les périodes selon leur ordre naturel avant de les sauvegarder
      const sortedPeriods = [...breakdownPeriods].sort((a, b) => {
        // Déterminer l'ordre selon le type de breakdown
        if (breakdown.type === 'Custom' && breakdown.customPeriods) {
          // Pour les breakdowns personnalisés, utiliser l'ordre des customPeriods
          const aCustomPeriod = breakdown.customPeriods.find(p => a.id.endsWith(p.id));
          const bCustomPeriod = breakdown.customPeriods.find(p => b.id.endsWith(p.id));
          const aOrder = aCustomPeriod ? aCustomPeriod.order : 0;
          const bOrder = bCustomPeriod ? bCustomPeriod.order : 0;
          return aOrder - bOrder;
        } else if (breakdown.type === 'Mensuel') {
          // Pour les breakdowns mensuels, extraire l'année/mois pour tri chronologique
          const aMatch = a.id.match(/(\d{4})_(\d{2})$/);
          const bMatch = b.id.match(/(\d{4})_(\d{2})$/);
          if (aMatch && bMatch) {
            const aYear = parseInt(aMatch[1]);
            const aMonth = parseInt(aMatch[2]);
            const bYear = parseInt(bMatch[1]);
            const bMonth = parseInt(bMatch[2]);
            return (aYear * 100 + aMonth) - (bYear * 100 + bMonth);
          }
          return 0;
        } else if (breakdown.type === 'Hebdomadaire' || breakdown.type === 'PEBs') {
          // Pour les breakdowns hebdomadaires et PEBs, extraire la date pour tri chronologique
          const aMatch = a.id.match(/week_(\d{4})_(\d{2})_(\d{2})$/);
          const bMatch = b.id.match(/week_(\d{4})_(\d{2})_(\d{2})$/);
          if (aMatch && bMatch) {
            const aYear = parseInt(aMatch[1]);
            const aMonth = parseInt(aMatch[2]); 
            const aDay = parseInt(aMatch[3]);
            const bYear = parseInt(bMatch[1]);
            const bMonth = parseInt(bMatch[2]);
            const bDay = parseInt(bMatch[3]);
            return (aYear * 10000 + aMonth * 100 + aDay) - (bYear * 10000 + bMonth * 100 + bDay);
          }
          return 0;
        }
        return 0;
      });

      // NOUVEAU: Ajouter chaque période avec son ordre calculé
      sortedPeriods.forEach((period, index) => {
        // Utiliser l'état local au lieu des champs plats
        const periodData = localBreakdownData[period.id] || { 
          value: '', 
          isToggled: true, 
          unitCost: '', // NOUVEAU: Support PEBs
          total: ''     // NOUVEAU: Support PEBs
        };
        
        // CORRIGÉ: Extraire l'ID de période original (sans le préfixe breakdown)
        const originalPeriodId = period.id.replace(`${period.breakdownId}_`, '');
        
        breakdownsObj[breakdownId].periods[originalPeriodId] = {
          name: period.label,
          value: periodData.value,
          isToggled: periodData.isToggled,
          order: index, // NOUVEAU: Ajouter l'ordre calculé basé sur la position triée
          unitCost: periodData.unitCost || '', // NOUVEAU: Support PEBs
          total: periodData.total || ''         // NOUVEAU: Support PEBs
        };
      });
    });
    
    return breakdownsObj;
  }, [periods, localBreakdownData, breakdowns]);

  /**
   * Initialise l'état local à partir des données existantes de breakdown
   * CORRIGÉ: Évite la boucle infinie de clignotement
   */
  const initializeLocalBreakdownData = useCallback(() => {
    const initialData: any = {};
    
    periods.forEach(period => {
      // Lire depuis l'objet breakdowns existant si disponible
      const existingBreakdowns = formData.breakdowns || {};
      const breakdown = existingBreakdowns[period.breakdownId];
      
      if (breakdown && breakdown.periods) {
        // CORRIGÉ: Extraire l'ID de période original pour chercher dans Firebase
        const originalPeriodId = period.id.replace(`${period.breakdownId}_`, '');
        const existingPeriod = breakdown.periods[originalPeriodId];
        
        if (existingPeriod) {
          initialData[period.id] = {
            value: existingPeriod.value || '',
            isToggled: existingPeriod.isToggled !== undefined ? existingPeriod.isToggled : true,
            unitCost: existingPeriod.unitCost || '', // NOUVEAU: Support PEBs
            total: existingPeriod.total || ''         // NOUVEAU: Support PEBs
          };
          return;
        }
      }
      
      // CORRIGÉ: Valeurs par défaut seulement si pas encore initialisées
      const breakdown_def = breakdowns.find(b => b.id === period.breakdownId);
      let initialValue = '';
      
      // CORRIGÉ: Ne remplir les dates automatiquement que si pas de valeur existante dans l'état local
      if (breakdown_def?.isDefault && !localBreakdownData[period.id]?.value) {
        const { startDateFormatted, endDateFormatted } = getFormattedDates(formData.TC_StartDate, formData.TC_EndDate);
        if (period.isFirst && startDateFormatted) {
          initialValue = startDateFormatted;
        } else if (period.isLast && endDateFormatted) {
          initialValue = endDateFormatted;
        }
      }
      
      initialData[period.id] = {
        value: initialValue,
        isToggled: true,
        unitCost: '', // NOUVEAU: Support PEBs
        total: ''     // NOUVEAU: Support PEBs
      };
    });
    
    // CORRIGÉ: Ne mettre à jour que si les données ont réellement changé
    const hasChanged = periods.some(period => {
      const existing = localBreakdownData[period.id];
      const newData = initialData[period.id];
      return !existing || existing.value !== newData.value || existing.isToggled !== newData.isToggled ||
             existing.unitCost !== newData.unitCost || existing.total !== newData.total;
    });
    
    if (hasChanged) {
      setLocalBreakdownData(initialData);
    }
  }, [periods, formData.breakdowns, formData.TC_StartDate, formData.TC_EndDate, breakdowns]); // CORRIGÉ: Retiré localBreakdownData des dépendances

  /**
   * Effet pour générer les périodes et initialiser l'état local
   */
  useEffect(() => {
    if (breakdowns.length > 0) {
      const allPeriods = generateAllPeriods(
        breakdowns,
        formData.TC_StartDate,
        formData.TC_EndDate
      );
      setPeriods(allPeriods);
    } else {
      setPeriods([]);
      setLocalBreakdownData({});
    }
  }, [breakdowns, formData.TC_StartDate, formData.TC_EndDate]);

  /**
   * Effet pour initialiser l'état local quand les périodes changent
   * CORRIGÉ: Évite la réinitialisation excessive
   */
  useEffect(() => {
    if (periods.length > 0 && Object.keys(localBreakdownData).length === 0) {
      // CORRIGÉ: Seulement initialiser si l'état local est vide
      initializeLocalBreakdownData();
    }
  }, [periods, initializeLocalBreakdownData]);

  /**
   * NOUVEAU: Effet séparé pour gérer les changements de dates sur le breakdown par défaut
   * CORRIGÉ: Réinitialise complètement quand les dates changent
   */
  useEffect(() => {
    if (periods.length > 0 && Object.keys(localBreakdownData).length > 0) {
      // Mettre à jour seulement les périodes du breakdown par défaut quand les dates changent
      const defaultBreakdown = breakdowns.find(b => b.isDefault);
      if (defaultBreakdown && (formData.TC_StartDate || formData.TC_EndDate)) {
        const { startDateFormatted, endDateFormatted } = getFormattedDates(formData.TC_StartDate, formData.TC_EndDate);
        
        const defaultPeriods = periods.filter(p => p.breakdownId === defaultBreakdown.id);
        const updatedData = { ...localBreakdownData };
        let hasUpdates = false;
        
        // CORRIGÉ: Réinitialiser complètement toutes les périodes du breakdown par défaut
        defaultPeriods.forEach(period => {
          let newValue = '';
          
          // Définir les nouvelles valeurs par défaut
          if (period.isFirst && startDateFormatted) {
            newValue = startDateFormatted;
          } else if (period.isLast && endDateFormatted) {
            newValue = endDateFormatted;
          }
          
          // CORRIGÉ: Réinitialiser complètement (pas seulement si différent)
          updatedData[period.id] = { 
            value: newValue, 
            isToggled: true, // Toujours réactiver les cases
            unitCost: '', // NOUVEAU: Réinitialiser PEBs
            total: ''     // NOUVEAU: Réinitialiser PEBs
          };
          hasUpdates = true;
        });
        
        if (hasUpdates) {
          setLocalBreakdownData(updatedData);
        }
      }
    }
  }, [formData.TC_StartDate, formData.TC_EndDate, periods, breakdowns]); // CORRIGÉ: Dependencies spécifiques pour éviter la boucle

  /**
   * Synchronise l'objet breakdowns avec le formulaire parent (sans champs plats)
   * CORRIGÉ: Évite les mises à jour excessives
   */
  useEffect(() => {
    if (periods.length > 0 && Object.keys(localBreakdownData).length > 0) {
      const breakdownsObj = createBreakdownsObject();
      
      // CORRIGÉ: Vérifier si l'objet a réellement changé avant de mettre à jour
      const currentBreakdowns = formData.breakdowns || {};
      const hasReallyChanged = JSON.stringify(currentBreakdowns) !== JSON.stringify(breakdownsObj);
      
      if (hasReallyChanged) {
        // Mettre à jour SEULEMENT l'objet breakdowns
        const syntheticEvent = {
          target: {
            name: 'breakdowns',
            value: breakdownsObj,
            type: 'object'
          }
        } as any;
        onChange(syntheticEvent);
      }
    }
  }, [localBreakdownData, periods]); // CORRIGÉ: Simplified dependencies

  /**
   * Gère le changement de valeur d'une période (utilise l'état local)
   * NOUVEAU: Support PEBs avec recalcul automatique du total
   */
  const handlePeriodValueChange = (periodId: string, value: string, field: 'value' | 'unitCost' = 'value') => {
    const period = periods.find(p => p.id === periodId);
    if (!period) return;

    const breakdown = breakdowns.find(b => b.id === period.breakdownId);
    
    // Vérifier si la période est active (pour les breakdowns par défaut)
    const currentData = localBreakdownData[periodId] || { value: '', isToggled: true, unitCost: '', total: '' };
    if (breakdown?.isDefault && !currentData.isToggled) {
      return;
    }

    // Mettre à jour l'état local
    const updatedData = {
      ...currentData,
      [field]: value
    };

    // NOUVEAU: Pour PEBs, recalculer automatiquement le total
    if (breakdown?.type === 'PEBs') {
      const unitCost = field === 'unitCost' ? value : currentData.unitCost;
      const volume = field === 'value' ? value : currentData.value;
      
      updatedData.total = calculatePEBsTotal(unitCost, volume);
    }

    setLocalBreakdownData((prev: any) => ({
      ...prev,
      [periodId]: updatedData
    }));
  };

  /**
   * Gère le changement d'état d'activation d'une période (utilise l'état local)
   */
  const handlePeriodActiveChange = (periodId: string, isActive: boolean) => {
    const currentData = localBreakdownData[periodId] || { value: '', isToggled: true, unitCost: '', total: '' };

    // Mettre à jour l'état local
    setLocalBreakdownData((prev: any) => ({
      ...prev,
      [periodId]: {
        value: isActive ? currentData.value : '',
        unitCost: isActive ? currentData.unitCost : '', // NOUVEAU: Support PEBs
        total: isActive ? currentData.total : '',       // NOUVEAU: Support PEBs
        isToggled: isActive
      }
    }));
  };

  /**
   * Obtient la valeur d'une période depuis l'état local
   */
  const getPeriodValue = (periodId: string, breakdownId: string, field: 'value' | 'unitCost' | 'total' = 'value'): string => {
    const data = localBreakdownData[periodId];
    return data?.[field] || '';
  };

  /**
   * Obtient le statut d'activation d'une période depuis l'état local
   */
  const getPeriodActiveStatus = (periodId: string, breakdownId: string): boolean => {
    const data = localBreakdownData[periodId];
    return data?.isToggled !== undefined ? data.isToggled : true;
  };

  // Modales et autres handlers
  const handleOpenDistributionModal = (breakdownId: string) => {
    setDistributionModal({
      isOpen: true,
      breakdownId,
      totalAmount: '',
      distributionMode: 'equal',
      startDate: formData.TC_StartDate || '', // NOUVEAU: Pré-remplir avec dates tactique
      endDate: formData.TC_EndDate || '',     // NOUVEAU: Pré-remplir avec dates tactique
      pebsField: 'unitCost' // NOUVEAU: Par défaut sur coût/unité
    });
  };

  const handleCloseDistributionModal = () => {
    setDistributionModal({
      isOpen: false,
      breakdownId: null,
      totalAmount: '',
      distributionMode: 'equal',
      startDate: '',
      endDate: '',
      pebsField: 'unitCost'
    });
  };

  // NOUVEAU: Fonction pour toggle l'état collapse/expand d'un breakdown
  const toggleBreakdownCollapse = (breakdownId: string) => {
    setCollapsedBreakdowns(prev => ({
      ...prev,
      [breakdownId]: !prev[breakdownId]
    }));
  };

  // NOUVEAU: Calcule la différence avec le budget média pour PEBs
  const calculateBudgetDifference = (totalValue: number): { difference: number; percentage: number; isOverBudget: boolean } => {
    const mediaBudget = parseFloat(formData.TC_Media_Budget || '0');
    if (mediaBudget === 0) {
      return { difference: 0, percentage: 0, isOverBudget: false };
    }

    const difference = totalValue - mediaBudget;
    const percentage = (difference / mediaBudget) * 100;
    const isOverBudget = difference > 0;

    return { difference, percentage, isOverBudget };
  };

  // NOUVEAU: Calcule les périodes concernées par les dates de distribution
  const getPeriodsForDistribution = (
    breakdownId: string, 
    startDate: string, 
    endDate: string
  ): BreakdownPeriod[] => {
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
  };

  // NOUVEAU: Calcule la valeur par période pour l'affichage
  const getDistributionPreview = (): { periodsCount: number; valuePerPeriod: number } => {
    if (!distributionModal.breakdownId || !distributionModal.totalAmount || 
        !distributionModal.startDate || !distributionModal.endDate) {
      return { periodsCount: 0, valuePerPeriod: 0 };
    }

    const totalAmount = parseFloat(distributionModal.totalAmount);
    if (isNaN(totalAmount)) return { periodsCount: 0, valuePerPeriod: 0 };

    const concernedPeriods = getPeriodsForDistribution(
      distributionModal.breakdownId,
      distributionModal.startDate,
      distributionModal.endDate
    );

    // Filtrer selon les périodes actives pour le breakdown par défaut
    const breakdown = breakdowns.find(b => b.id === distributionModal.breakdownId);
    const activePeriods = concernedPeriods.filter(period => {
      if (!breakdown?.isDefault) return true;
      return getPeriodActiveStatus(period.id, period.breakdownId);
    });

    const periodsCount = activePeriods.length;
    const valuePerPeriod = periodsCount > 0 ? totalAmount / periodsCount : 0;

    return { periodsCount, valuePerPeriod };
  };

  const handleConfirmDistribution = () => {
    if (!distributionModal.breakdownId || !distributionModal.totalAmount || 
        !distributionModal.startDate || !distributionModal.endDate) return;

    const totalAmount = parseFloat(distributionModal.totalAmount);
    if (isNaN(totalAmount)) return;

    const breakdown = breakdowns.find(b => b.id === distributionModal.breakdownId);
    if (!breakdown) return;

    // NOUVEAU: Utiliser les périodes calculées selon les dates personnalisées
    const concernedPeriods = getPeriodsForDistribution(
      distributionModal.breakdownId,
      distributionModal.startDate,
      distributionModal.endDate
    );

    const isDefaultBreakdown = breakdown.isDefault;
    const isPEBs = breakdown.type === 'PEBs';

    // Construire l'objet activePeriods à partir de l'état local
    const activePeriods: { [key: string]: boolean } = {};
    concernedPeriods.forEach(period => {
      activePeriods[period.id] = getPeriodActiveStatus(period.id, breakdown.id);
    });

    // Filtrer les périodes actives
    const activePeriodsList = concernedPeriods.filter(period =>
      !isDefaultBreakdown || activePeriods[period.id] !== false
    );

    if (activePeriodsList.length === 0) return;

    const amountPerPeriod = totalAmount / activePeriodsList.length;

    // NOUVEAU: Distribution selon le type et le champ choisi
    activePeriodsList.forEach(period => {
      if (isPEBs) {
        if (distributionModal.pebsField === 'unitCost') {
          // Distribuer sur le coût/unité, garder le volume existant
          handlePeriodValueChange(period.id, amountPerPeriod.toFixed(2), 'unitCost');
        } else {
          // Distribuer sur le volume, garder le coût/unité existant
          handlePeriodValueChange(period.id, amountPerPeriod.toFixed(2), 'value');
        }
      } else {
        // Pour les autres types, distribuer sur value
        handlePeriodValueChange(period.id, amountPerPeriod.toFixed(2), 'value');
      }
    });

    handleCloseDistributionModal();
  };

  const periodsByBreakdown = periods.reduce((acc, period) => {
    if (!acc[period.breakdownId]) {
      acc[period.breakdownId] = [];
    }
    acc[period.breakdownId].push(period);
    return acc;
  }, {} as { [key: string]: BreakdownPeriod[] });

  return (
    <div className="p-8 space-y-8">
      <FormSection
        title="Répartition temporelle"
        description="Configurez les dates de la tactique et répartissez les valeurs selon les breakdowns de la campagne"
      >

        <div className="bg-slate-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <HelpIcon
                  tooltip="Date de début de cette tactique spécifique"
                  onTooltipChange={onTooltipChange}
                />
                <label className="block text-sm font-medium text-slate-700">
                  Date de début *
                </label>
              </div>
              <input
                type="date"
                name="TC_StartDate"
                value={formData.TC_StartDate || ''}
                onChange={onChange}
                disabled={loading}
                className="w-full px-4 py-3 border-0 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:shadow-md transition-all"
              />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <HelpIcon
                  tooltip="Date de fin de cette tactique spécifique"
                  onTooltipChange={onTooltipChange}
                />
                <label className="block text-sm font-medium text-slate-700">
                  Date de fin *
                </label>
              </div>
              <input
                type="date"
                name="TC_EndDate"
                value={formData.TC_EndDate || ''}
                onChange={onChange}
                disabled={loading}
                className="w-full px-4 py-3 border-0 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:shadow-md transition-all"
              />
            </div>
          </div>
        </div>

        {breakdowns.length > 0 ? (
          <div className="space-y-8">
            {breakdowns.map(breakdown => {
              const Icon = getBreakdownIcon(breakdown.type);
              const breakdownPeriods = periodsByBreakdown[breakdown.id] || [];
              const isDefaultBreakdown = breakdown.isDefault;
              const isPEBs = breakdown.type === 'PEBs'; // NOUVEAU: Détection PEBs
              const isCollapsed = collapsedBreakdowns[breakdown.id] || false; // NOUVEAU: État collapse

              // Utiliser l'objet breakdowns pour les calculs
              const currentBreakdowns = formData.breakdowns || {};
              const showCalculationsForBreakdown = hasAtLeastOneNumericValue(
                { breakdowns: currentBreakdowns },
                breakdown.id,
                isDefaultBreakdown,
                breakdown.type
              );
              const totalValueForBreakdown = showCalculationsForBreakdown ? calculateTotalForBreakdown(
                { breakdowns: currentBreakdowns },
                breakdown.id,
                isDefaultBreakdown,
                breakdown.type
              ) : 0;

              // NOUVEAU: Calcul de la différence avec le budget média pour PEBs
              const budgetDiff = isPEBs && showCalculationsForBreakdown ? 
                calculateBudgetDifference(totalValueForBreakdown) : null;

              return (
                <div key={breakdown.id} className="bg-white rounded-xl shadow-sm">
                  <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* NOUVEAU: Bouton collapse/expand */}
                        <button
                          type="button"
                          onClick={() => toggleBreakdownCollapse(breakdown.id)}
                          className="p-1 rounded-md hover:bg-white/50 transition-colors"
                        >
                          {isCollapsed ? (
                            <ChevronRightIcon className="h-5 w-5 text-slate-600" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-slate-600" />
                          )}
                        </button>

                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-slate-900">{breakdown.name}</h4>
                            {breakdown.isDefault && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                                Par défaut
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {breakdown.type}
                            {breakdown.isDefault && formData.TC_StartDate && formData.TC_EndDate ? (
                              <> • Basé sur les dates de la tactique</>
                            ) : (
                              <> • {breakdown.startDate} → {breakdown.endDate}</>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {showCalculationsForBreakdown && totalValueForBreakdown > 0 && (
                          <div className="text-right">
                            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
                              Total: {totalValueForBreakdown.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </div>
                            {/* NOUVEAU: Affichage de la différence pour PEBs */}
                            {budgetDiff && formData.TC_Media_Budget && (
                              <div className={`mt-1 px-3 py-1 rounded text-xs font-medium ${
                                budgetDiff.isOverBudget 
                                  ? 'bg-red-50 text-red-700' 
                                  : 'bg-green-50 text-green-700'
                              }`}>
                                {budgetDiff.isOverBudget ? '+' : ''}
                                {budgetDiff.difference.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                {' '}({budgetDiff.percentage > 0 ? '+' : ''}{budgetDiff.percentage.toFixed(1)}%)
                                <div className="text-xs opacity-75">vs Budget: {parseFloat(formData.TC_Media_Budget).toLocaleString('fr-CA')}</div>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenDistributionModal(breakdown.id)}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Distribuer
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* NOUVEAU: Contenu collapsible */}
                  {!isCollapsed && (
                    <div className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {breakdownPeriods.map(period => {
                        const currentValue = getPeriodValue(period.id, period.breakdownId, 'value');
                        const currentUnitCost = getPeriodValue(period.id, period.breakdownId, 'unitCost');
                        const currentTotal = getPeriodValue(period.id, period.breakdownId, 'total');
                        
                        // NOUVEAU: Pour PEBs, calculer le pourcentage basé sur le total
                        const valueForPercentage = isPEBs ? currentTotal : currentValue;
                        const percentage = showCalculationsForBreakdown && totalValueForBreakdown > 0
                          ? calculatePercentageForBreakdown(valueForPercentage, totalValueForBreakdown)
                          : 0;

                        const isActive = getPeriodActiveStatus(period.id, period.breakdownId);

                        return (
                          <div key={period.id} className={`rounded-lg transition-all duration-200 ${
                            isDefaultBreakdown && !isActive
                              ? 'bg-slate-50'
                              : 'bg-slate-50 hover:bg-slate-100'
                          }`}>
                            <div className="flex items-center justify-between p-3 pb-2">
                              <label className={`text-sm font-medium ${
                                isDefaultBreakdown && !isActive ? 'text-slate-400' : 'text-slate-700'
                              }`}>
                                {period.label}
                              </label>

                              {isDefaultBreakdown && (
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={(e) => handlePeriodActiveChange(period.id, e.target.checked)}
                                  disabled={loading}
                                  className="h-4 w-4 text-slate-500 focus:ring-slate-400 border-slate-300 rounded"
                                />
                              )}
                            </div>

                            <div className="px-3 pb-3">
                              {isPEBs ? (
                                // NOUVEAU: Interface PEBs avec 3 inputs superposés
                                <div className="space-y-2">
                                  {/* Coût par unité */}
                                  <input
                                    type="text"
                                    value={currentUnitCost}
                                    onChange={(e) => handlePeriodValueChange(period.id, e.target.value, 'unitCost')}
                                    disabled={loading || (isDefaultBreakdown && !isActive)}
                                    placeholder="Coût/unité"
                                    className={`w-full px-2 py-1 text-xs rounded-md text-center focus:ring-2 focus:ring-indigo-500 transition-all ${
                                      isDefaultBreakdown && !isActive
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border'
                                        : 'bg-white border-0 shadow-sm focus:shadow-md'
                                    }`}
                                  />
                                  
                                  {/* Volume */}
                                  <input
                                    type="text"
                                    value={currentValue}
                                    onChange={(e) => handlePeriodValueChange(period.id, e.target.value, 'value')}
                                    disabled={loading || (isDefaultBreakdown && !isActive)}
                                    placeholder="Volume"
                                    className={`w-full px-2 py-1 text-xs rounded-md text-center focus:ring-2 focus:ring-indigo-500 transition-all ${
                                      isDefaultBreakdown && !isActive
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border'
                                        : 'bg-white border-0 shadow-sm focus:shadow-md'
                                    }`}
                                  />
                                  
                                  {/* Total calculé (grisé) */}
                                  <input
                                    type="text"
                                    value={currentTotal}
                                    disabled={true}
                                    placeholder="Total"
                                    className="w-full px-2 py-1 text-xs rounded-md text-center bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed"
                                  />
                                </div>
                              ) : (
                                // Interface normale pour les autres types
                                <input
                                  type="text"
                                  value={currentValue}
                                  onChange={(e) => handlePeriodValueChange(period.id, e.target.value, 'value')}
                                  disabled={loading || (isDefaultBreakdown && !isActive)}
                                  placeholder="Valeur"
                                  className={`w-full px-3 py-2 text-sm rounded-md text-center focus:ring-2 focus:ring-indigo-500 transition-all ${
                                    isDefaultBreakdown && !isActive
                                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border'
                                      : 'bg-white border-0 shadow-sm focus:shadow-md'
                                  }`}
                                />
                              )}

                              {showCalculationsForBreakdown && valueForPercentage.trim() !== '' && isActive && 
                               !isNaN(parseFloat(valueForPercentage.trim())) && (
                                <div className="mt-2 text-center space-y-1">
                                  <div className="text-sm font-medium text-indigo-600">
                                    {percentage.toFixed(1)}%
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <p className="text-slate-500">Aucun breakdown configuré pour cette campagne.</p>
            <p className="text-sm mt-2 text-slate-400">
              Les breakdowns sont définis lors de la création ou modification de la campagne.
            </p>
          </div>
        )}
      </FormSection>

      {distributionModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Distribuer le montant
            </h3>

            <div className="space-y-4">
              {/* Dates de distribution */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={distributionModal.startDate}
                    onChange={(e) => setDistributionModal(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={distributionModal.endDate}
                    onChange={(e) => setDistributionModal(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Choix du champ pour PEBs */}
              {distributionModal.breakdownId && breakdowns.find(b => b.id === distributionModal.breakdownId)?.type === 'PEBs' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Distribuer sur
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDistributionModal(prev => ({ ...prev, pebsField: 'unitCost' }))}
                      className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                        distributionModal.pebsField === 'unitCost'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      Coût / unité
                    </button>
                    <button
                      type="button"
                      onClick={() => setDistributionModal(prev => ({ ...prev, pebsField: 'value' }))}
                      className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                        distributionModal.pebsField === 'value'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      Volume
                    </button>
                  </div>
                </div>
              )}

              {/* Montant total */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Montant total à distribuer
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={distributionModal.totalAmount}
                  onChange={(e) => setDistributionModal(prev => ({ ...prev, totalAmount: e.target.value }))}
                  placeholder="Ex: 10000"
                  className="w-full px-4 py-3 border-0 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Aperçu de la distribution */}
              {(() => {
                const preview = getDistributionPreview();
                return preview.periodsCount > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 font-medium">
                        Sera divisé sur {preview.periodsCount} période{preview.periodsCount > 1 ? 's' : ''}
                      </span>
                      <span className="text-blue-600 font-semibold">
                        {preview.valuePerPeriod.toLocaleString('fr-CA', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })} / période
                      </span>
                    </div>
                  </div>
                );
              })()}

              <p className="text-sm text-slate-500">
                La distribution se fera uniquement sur les périodes qui intersectent avec les dates choisies
                {distributionModal.breakdownId && breakdowns.find(b => b.id === distributionModal.breakdownId)?.isDefault && 
                  ' et qui sont activées (cochées)'}.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseDistributionModal}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDistribution}
                disabled={!distributionModal.totalAmount || !distributionModal.startDate || !distributionModal.endDate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Distribuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}