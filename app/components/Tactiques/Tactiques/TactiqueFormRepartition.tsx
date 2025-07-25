// app/components/Tactiques/Tactiques/TactiqueFormRepartition.tsx
/**
 * CORRIGÉ: Problème de réinitialisation des valeurs dans le drawer de tactique
 * NOUVEAU: IDs de périodes standardisés compatibles avec la timeline
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpIcon,
  createLabelWithHelp,
  FormSection
} from './TactiqueFormComponents';
import { Breakdown } from '../../../types/breakdown';
import { CalendarIcon, ClockIcon, Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  getTactiqueBreakdownValue,
  getTactiqueBreakdownToggleStatus,
  calculateTactiqueBreakdownTotal,
  areAllTactiqueBreakdownValuesNumeric
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
  isDefaultBreakdown: boolean
): boolean {
  // CORRIGÉ: Vérifie s'il y a au moins une valeur numérique, pas toutes
  return hasAtLeastOneNumericValue(tactique, breakdownId, isDefaultBreakdown);
}

/**
 * Nouvelle fonction : vérifie s'il y a au moins une valeur numérique valide
 */
function hasAtLeastOneNumericValue(
  tactique: any,
  breakdownId: string,
  isDefaultBreakdown: boolean
): boolean {
  if (!tactique.breakdowns || !tactique.breakdowns[breakdownId]) {
    return false;
  }

  const breakdown = tactique.breakdowns[breakdownId];
  const periods = Object.values(breakdown) as any[];
  
  const relevantPeriods = periods.filter(period => 
    !isDefaultBreakdown || period.isToggled
  );

  if (relevantPeriods.length === 0) {
    return false;
  }

  // Retourne true s'il y a au moins une valeur numérique valide
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
  isDefaultBreakdown: boolean
): number {
  return calculateTactiqueBreakdownTotal(tactique, breakdownId, isDefaultBreakdown);
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
  isDefaultBreakdown: boolean
): { [key: string]: string } {
  const activePeriodsList = breakdownPeriods.filter(period =>
    !isDefaultBreakdown || activePeriods[period.id] !== false
  );

  if (activePeriodsList.length === 0) return {};

  const amountPerPeriod = totalAmount / activePeriodsList.length;
  const result: { [key: string]: string } = {};

  activePeriodsList.forEach(period => {
    result[period.id] = amountPerPeriod.toFixed(2);
  });

  return result;
}

function getBreakdownIcon(type: string) {
  switch (type) {
    case 'Hebdomadaire':
      return CalendarIcon;
    case 'Mensuel':
      return ClockIcon;
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
  const [distributionModal, setDistributionModal] = useState<DistributionModalState>({
    isOpen: false,
    breakdownId: null,
    totalAmount: '',
    distributionMode: 'equal'
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

      breakdownPeriods.forEach(period => {
        // Utiliser l'état local au lieu des champs plats
        const periodData = localBreakdownData[period.id] || { value: '', isToggled: true };
        
        // CORRIGÉ: Extraire l'ID de période original (sans le préfixe breakdown)
        const originalPeriodId = period.id.replace(`${period.breakdownId}_`, '');
        
        breakdownsObj[breakdownId].periods[originalPeriodId] = {
          name: period.label,
          value: periodData.value,
          isToggled: periodData.isToggled,
          order: 0
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
            isToggled: existingPeriod.isToggled !== undefined ? existingPeriod.isToggled : true
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
        isToggled: true
      };
    });
    
    // CORRIGÉ: Ne mettre à jour que si les données ont réellement changé
    const hasChanged = periods.some(period => {
      const existing = localBreakdownData[period.id];
      const newData = initialData[period.id];
      return !existing || existing.value !== newData.value || existing.isToggled !== newData.isToggled;
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
            isToggled: true // Toujours réactiver les cases
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
   */
  const handlePeriodValueChange = (periodId: string, value: string) => {
    const period = periods.find(p => p.id === periodId);
    if (!period) return;

    const breakdown = breakdowns.find(b => b.id === period.breakdownId);
    
    // Vérifier si la période est active (pour les breakdowns par défaut)
    const currentData = localBreakdownData[periodId] || { value: '', isToggled: true };
    if (breakdown?.isDefault && !currentData.isToggled) {
      return;
    }

    // Mettre à jour l'état local
    setLocalBreakdownData(prev => ({
      ...prev,
      [periodId]: {
        ...currentData,
        value: value
      }
    }));
  };

  /**
   * Gère le changement d'état d'activation d'une période (utilise l'état local)
   */
  const handlePeriodActiveChange = (periodId: string, isActive: boolean) => {
    const currentData = localBreakdownData[periodId] || { value: '', isToggled: true };

    // Mettre à jour l'état local
    setLocalBreakdownData(prev => ({
      ...prev,
      [periodId]: {
        value: isActive ? currentData.value : '',
        isToggled: isActive
      }
    }));
  };

  /**
   * Obtient la valeur d'une période depuis l'état local
   */
  const getPeriodValue = (periodId: string, breakdownId: string): string => {
    const data = localBreakdownData[periodId];
    return data?.value || '';
  };

  /**
   * Obtient le statut d'activation d'une période depuis l'état local
   */
  const getPeriodActiveStatus = (periodId: string, breakdownId: string): boolean => {
    const data = localBreakdownData[periodId];
    return data?.isToggled !== undefined ? data.isToggled : true;
  };

  // Modales et autres handlers (inchangés)
  const handleOpenDistributionModal = (breakdownId: string) => {
    setDistributionModal({
      isOpen: true,
      breakdownId,
      totalAmount: '',
      distributionMode: 'equal'
    });
  };

  const handleCloseDistributionModal = () => {
    setDistributionModal({
      isOpen: false,
      breakdownId: null,
      totalAmount: '',
      distributionMode: 'equal'
    });
  };

  const handleConfirmDistribution = () => {
    if (!distributionModal.breakdownId || !distributionModal.totalAmount) return;

    const totalAmount = parseFloat(distributionModal.totalAmount);
    if (isNaN(totalAmount)) return;

    const breakdown = breakdowns.find(b => b.id === distributionModal.breakdownId);
    if (!breakdown) return;

    const breakdownPeriods = periods.filter(p => p.breakdownId === breakdown.id);
    const isDefaultBreakdown = breakdown.isDefault;

    // Construire l'objet activePeriods à partir de l'état local
    const activePeriods: { [key: string]: boolean } = {};
    breakdownPeriods.forEach(period => {
      activePeriods[period.id] = getPeriodActiveStatus(period.id, breakdown.id);
    });

    const distributedValues = distributeAmountEqually(
      totalAmount,
      breakdownPeriods,
      activePeriods,
      isDefaultBreakdown
    );

    Object.entries(distributedValues).forEach(([periodId, value]) => {
      handlePeriodValueChange(periodId, value);
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

              // Utiliser l'objet breakdowns pour les calculs
              const currentBreakdowns = formData.breakdowns || {};
              const showCalculationsForBreakdown = hasAtLeastOneNumericValue(
                { breakdowns: currentBreakdowns },
                breakdown.id,
                isDefaultBreakdown
              );
              const totalValueForBreakdown = showCalculationsForBreakdown ? calculateTotalForBreakdown(
                { breakdowns: currentBreakdowns },
                breakdown.id,
                isDefaultBreakdown
              ) : 0;

              return (
                <div key={breakdown.id} className="bg-white rounded-xl shadow-sm">
                  <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
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
                          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
                            Total: {totalValueForBreakdown.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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

                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {breakdownPeriods.map(period => {
                        const currentValue = getPeriodValue(period.id, period.breakdownId);
                        const percentage = showCalculationsForBreakdown && totalValueForBreakdown > 0
                          ? calculatePercentageForBreakdown(currentValue, totalValueForBreakdown)
                          : 0;

                        const isDefaultBreakdown = breakdown.isDefault;
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
                              <input
                                type="text"
                                value={currentValue}
                                onChange={(e) => handlePeriodValueChange(period.id, e.target.value)}
                                disabled={loading || (isDefaultBreakdown && !isActive)}
                                placeholder="Valeur"
                                className={`w-full px-3 py-2 text-sm rounded-md text-center focus:ring-2 focus:ring-indigo-500 transition-all ${
                                  isDefaultBreakdown && !isActive
                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border'
                                    : 'bg-white border-0 shadow-sm focus:shadow-md'
                                }`}
                              />

                              {showCalculationsForBreakdown && currentValue.trim() !== '' && isActive && 
                               !isNaN(parseFloat(currentValue.trim())) && (
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Distribuer le montant
            </h3>

            <div className="space-y-4">
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
                <p className="text-sm text-slate-500 mt-2">
                  Le montant sera distribué équitablement sur toutes les périodes actives.
                </p>
              </div>
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
                disabled={!distributionModal.totalAmount}
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