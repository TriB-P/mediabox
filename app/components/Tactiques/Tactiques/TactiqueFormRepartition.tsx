// app/components/Tactiques/TactiqueFormRepartition.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  HelpIcon, 
  createLabelWithHelp,
  FormSection 
} from './TactiqueFormComponents';
import { Breakdown } from '../../../types/breakdown';
import { CalendarIcon, ClockIcon, Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline';

// ==================== TYPES ====================

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

// ==================== UTILITAIRES ====================

/**
 * Génère les périodes pour un breakdown mensuel
 */
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
    
    periods.push({
      id: `${breakdown.id}_${current.getFullYear()}_${current.getMonth()}`,
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

/**
 * Génère les périodes pour un breakdown hebdomadaire
 */
function generateWeeklyPeriods(breakdown: Breakdown, tactiqueStartDate?: string, tactiqueEndDate?: string): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];
  
  let startDate: Date, endDate: Date;
  
  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = new Date(tactiqueStartDate);
    endDate = new Date(tactiqueEndDate);
    
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 1) {
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(startDate.getDate() - daysToSubtract);
    }
  } else {
    startDate = new Date(breakdown.startDate);
    endDate = new Date(breakdown.endDate);
  }
  
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const day = current.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                       'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const month = monthNames[current.getMonth()];
    
    periods.push({
      id: `${breakdown.id}_${current.getTime()}`,
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

/**
 * Génère les périodes pour un breakdown custom
 */
function generateCustomPeriods(breakdown: Breakdown): BreakdownPeriod[] {
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
          breakdownName: breakdown.name
        });
      });
  }
  
  return periods;
}

/**
 * Génère toutes les périodes pour tous les breakdowns
 */
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

/**
 * Vérifie si toutes les valeurs non vides sont numériques pour un breakdown spécifique
 */
function areAllValuesNumericForBreakdown(
  values: { [key: string]: string }, 
  breakdownPeriods: BreakdownPeriod[], 
  activePeriods: { [key: string]: boolean }, 
  isDefaultBreakdown: boolean
): boolean {
  const breakdownValues = breakdownPeriods
    .filter(period => !isDefaultBreakdown || activePeriods[period.id] !== false)
    .map(period => values[period.id] || '')
    .filter(value => value.trim() !== '');
  
  if (breakdownValues.length === 0) return false;
  
  return breakdownValues.every(value => {
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
 * Calcule le total des valeurs numériques pour un breakdown spécifique
 */
function calculateTotalForBreakdown(
  values: { [key: string]: string }, 
  breakdownPeriods: BreakdownPeriod[], 
  activePeriods: { [key: string]: boolean }, 
  isDefaultBreakdown: boolean
): number {
  return breakdownPeriods
    .filter(period => !isDefaultBreakdown || activePeriods[period.id] !== false)
    .map(period => values[period.id] || '')
    .filter(value => value.trim() !== '')
    .reduce((sum, value) => {
      const numValue = parseFloat(value.trim());
      return !isNaN(numValue) ? sum + numValue : sum;
    }, 0);
}

/**
 * Calcule le pourcentage d'une valeur par rapport au total du breakdown
 */
function calculatePercentageForBreakdown(value: string, total: number): number {
  if (total === 0) return 0;
  const numValue = parseFloat(value.trim());
  return !isNaN(numValue) ? (numValue / total) * 100 : 0;
}

/**
 * Obtient les dates complètes formatées pour afficher dans les cases
 */
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

/**
 * Distribue équitablement un montant sur les périodes actives
 */
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

/**
 * Obtient l'icône pour un type de breakdown
 */
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

// ==================== COMPOSANT PRINCIPAL ====================

export default function TactiqueFormRepartition({
  formData,
  onChange,
  onTooltipChange,
  breakdowns,
  loading = false
}: TactiqueFormRepartitionProps) {
  
  // États
  const [periods, setPeriods] = useState<BreakdownPeriod[]>([]);
  const [periodValues, setPeriodValues] = useState<{ [key: string]: string }>({});
  const [activePeriods, setActivePeriods] = useState<{ [key: string]: boolean }>({});
  
  // État pour le modal de distribution
  const [distributionModal, setDistributionModal] = useState<DistributionModalState>({
    isOpen: false,
    breakdownId: null,
    totalAmount: '',
    distributionMode: 'equal'
  });
  
  // Générer les périodes quand les breakdowns changent
  useEffect(() => {
    if (breakdowns.length > 0) {
      const allPeriods = generateAllPeriods(
        breakdowns, 
        formData.TC_StartDate, 
        formData.TC_EndDate
      );
      setPeriods(allPeriods);
      
      const { startDateFormatted, endDateFormatted } = getFormattedDates(formData.TC_StartDate, formData.TC_EndDate);
      
      const initialValues: { [key: string]: string } = {};
      const initialActivePeriods: { [key: string]: boolean } = {};
      
      allPeriods.forEach(period => {
        const fieldName = `TC_Breakdown_${period.id}`;
        let initialValue = (formData as any)[fieldName] || '';
        
        const breakdown = breakdowns.find(b => b.id === period.breakdownId);
        if (breakdown?.isDefault && !initialValue) {
          if (period.isFirst && startDateFormatted) {
            initialValue = startDateFormatted;
          } else if (period.isLast && endDateFormatted) {
            initialValue = endDateFormatted;
          }
        }
        
        initialValues[period.id] = initialValue;
        
        const activeFieldName = `TC_Breakdown_Active_${period.id}`;
        
        if (breakdown?.isDefault) {
          initialActivePeriods[period.id] = (formData as any)[activeFieldName] !== undefined 
            ? (formData as any)[activeFieldName] 
            : true;
        }
      });
      
      setPeriodValues(initialValues);
      setActivePeriods(initialActivePeriods);
    } else {
      setPeriods([]);
      setPeriodValues({});
      setActivePeriods({});
    }
  }, [breakdowns, formData.TC_StartDate, formData.TC_EndDate]);
  
  // Gestionnaire pour les changements de valeurs de période
  const handlePeriodValueChange = (periodId: string, value: string) => {
    const breakdown = breakdowns.find(b => periods.find(p => p.id === periodId)?.breakdownId === b.id);
    if (breakdown?.isDefault && !activePeriods[periodId]) {
      return;
    }
    
    setPeriodValues(prev => ({
      ...prev,
      [periodId]: value
    }));
    
    const fieldName = `TC_Breakdown_${periodId}`;
    const syntheticEvent = {
      target: {
        name: fieldName,
        value: value,
        type: 'text'
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };
  
  // Gestionnaire pour l'activation/désactivation des cases
  const handlePeriodActiveChange = (periodId: string, isActive: boolean) => {
    setActivePeriods(prev => ({
      ...prev,
      [periodId]: isActive
    }));
    
    if (!isActive) {
      handlePeriodValueChange(periodId, '');
    }
    
    const activeFieldName = `TC_Breakdown_Active_${periodId}`;
    const syntheticEvent = {
      target: {
        name: activeFieldName,
        value: isActive.toString(),
        type: 'checkbox',
        checked: isActive
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };
  
  // Gestionnaire pour ouvrir le modal de distribution
  const handleOpenDistributionModal = (breakdownId: string) => {
    setDistributionModal({
      isOpen: true,
      breakdownId,
      totalAmount: '',
      distributionMode: 'equal'
    });
  };
  
  // Gestionnaire pour fermer le modal de distribution
  const handleCloseDistributionModal = () => {
    setDistributionModal({
      isOpen: false,
      breakdownId: null,
      totalAmount: '',
      distributionMode: 'equal'
    });
  };
  
  // Gestionnaire pour confirmer la distribution
  const handleConfirmDistribution = () => {
    if (!distributionModal.breakdownId || !distributionModal.totalAmount) return;
    
    const totalAmount = parseFloat(distributionModal.totalAmount);
    if (isNaN(totalAmount)) return;
    
    const breakdown = breakdowns.find(b => b.id === distributionModal.breakdownId);
    if (!breakdown) return;
    
    const breakdownPeriods = periods.filter(p => p.breakdownId === breakdown.id);
    const isDefaultBreakdown = breakdown.isDefault;
    
    const distributedValues = distributeAmountEqually(
      totalAmount, 
      breakdownPeriods, 
      activePeriods, 
      isDefaultBreakdown
    );
    
    // Appliquer les valeurs distribuées
    Object.entries(distributedValues).forEach(([periodId, value]) => {
      handlePeriodValueChange(periodId, value);
    });
    
    handleCloseDistributionModal();
  };
  
  // Organiser les périodes par breakdown
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
        
        {/* Section des dates de tactique - Design épuré */}
        <div className="bg-slate-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-6">
            {/* Date de début */}
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

            {/* Date de fin */}
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
        
        {/* Section des breakdowns - Design épuré */}
        {breakdowns.length > 0 ? (
          <div className="space-y-8">
            {breakdowns.map(breakdown => {
              const Icon = getBreakdownIcon(breakdown.type);
              const breakdownPeriods = periodsByBreakdown[breakdown.id] || [];
              const isDefaultBreakdown = breakdown.isDefault;
              
              const showCalculationsForBreakdown = areAllValuesNumericForBreakdown(
                periodValues, 
                breakdownPeriods, 
                activePeriods, 
                isDefaultBreakdown
              );
              const totalValueForBreakdown = showCalculationsForBreakdown ? calculateTotalForBreakdown(
                periodValues, 
                breakdownPeriods, 
                activePeriods, 
                isDefaultBreakdown
              ) : 0;
              
              return (
                <div key={breakdown.id} className="bg-white rounded-xl shadow-sm">
                  {/* En-tête du breakdown - Design épuré */}
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
                        {/* Total pour ce breakdown */}
                        {showCalculationsForBreakdown && totalValueForBreakdown > 0 && (
                          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
                            Total: {totalValueForBreakdown.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </div>
                        )}
                        
                        {/* Bouton Distribuer */}
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
                  
                  {/* Grille des périodes - Design épuré */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {breakdownPeriods.map(period => {
                        const currentValue = periodValues[period.id] || '';
                        const percentage = showCalculationsForBreakdown && totalValueForBreakdown > 0 
                          ? calculatePercentageForBreakdown(currentValue, totalValueForBreakdown) 
                          : 0;
                        
                        const isDefaultBreakdown = breakdown.isDefault;
                        const isActive = isDefaultBreakdown ? (activePeriods[period.id] ?? true) : true;
                        
                        return (
                          <div key={period.id} className={`rounded-lg transition-all duration-200 ${
                            isDefaultBreakdown && !isActive 
                              ? 'bg-slate-50' 
                              : 'bg-slate-50 hover:bg-slate-100'
                          }`}>
                            {/* Label et checkbox */}
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
                            
                            {/* Input */}
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
                              
                              {/* Pourcentage */}
                              {showCalculationsForBreakdown && currentValue.trim() !== '' && isActive && (
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
      
      {/* Modal de distribution */}
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