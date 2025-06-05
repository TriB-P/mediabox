// app/components/Tactiques/TactiqueFormRepartition.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  HelpIcon, 
  createLabelWithHelp,
  FormSection 
} from './TactiqueFormComponents';
import { Breakdown } from '../../types/breakdown';
import { CalendarIcon, ClockIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

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
  isFirst?: boolean; // ✅ FEATURE 3: Marquer la première période
  isLast?: boolean;  // ✅ FEATURE 3: Marquer la dernière période
}

// ==================== UTILITAIRES ====================

/**
 * Génère les périodes pour un breakdown mensuel
 */
function generateMonthlyPeriods(breakdown: Breakdown, tactiqueStartDate?: string, tactiqueEndDate?: string): BreakdownPeriod[] {
  const periods: BreakdownPeriod[] = [];
  
  // ✅ FEATURE 2: Pour le breakdown par défaut, utiliser les dates de la tactique
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
  
  // ✅ FEATURE 3: Marquer première et dernière période
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
  
  // ✅ FEATURE 2: Pour le breakdown par défaut, utiliser les dates de la tactique
  let startDate: Date, endDate: Date;
  
  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = new Date(tactiqueStartDate);
    endDate = new Date(tactiqueEndDate);
    
    // Pour les breakdown hebdomadaires par défaut, s'assurer qu'on commence bien le lundi
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 1) { // Si ce n'est pas un lundi
      // Aller au lundi précédent ou suivant selon la logique du breakdown
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
  
  // ✅ FEATURE 3: Marquer première et dernière période
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
 * ✅ FEATURE 1: Vérifie si toutes les valeurs non vides sont numériques pour un breakdown spécifique
 * ✅ FIX: Détection plus stricte pour rejeter les textes comme "15 avril"
 */
function areAllValuesNumericForBreakdown(
  values: { [key: string]: string }, 
  breakdownPeriods: BreakdownPeriod[], 
  activePeriods: { [key: string]: boolean }, 
  isDefaultBreakdown: boolean
): boolean {
  const breakdownValues = breakdownPeriods
    .filter(period => !isDefaultBreakdown || activePeriods[period.id] !== false) // Exclure les inactives
    .map(period => values[period.id] || '')
    .filter(value => value.trim() !== '');
  
  if (breakdownValues.length === 0) return false;
  
  return breakdownValues.every(value => {
    const trimmedValue = value.trim();
    
    // ✅ FIX: Vérifier qu'il n'y a QUE des chiffres, points, virgules et signes
    const numericRegex = /^[-+]?(\d+([.,]\d*)?|\.\d+)$/;
    
    if (!numericRegex.test(trimmedValue)) {
      return false; // Contient des caractères non numériques
    }
    
    // Double vérification avec parseFloat
    const numValue = parseFloat(trimmedValue.replace(',', '.'));
    return !isNaN(numValue) && isFinite(numValue);
  });
}

/**
 * ✅ FEATURE 1: Calcule le total des valeurs numériques pour un breakdown spécifique
 */
function calculateTotalForBreakdown(
  values: { [key: string]: string }, 
  breakdownPeriods: BreakdownPeriod[], 
  activePeriods: { [key: string]: boolean }, 
  isDefaultBreakdown: boolean
): number {
  return breakdownPeriods
    .filter(period => !isDefaultBreakdown || activePeriods[period.id] !== false) // Exclure les inactives
    .map(period => values[period.id] || '')
    .filter(value => value.trim() !== '')
    .reduce((sum, value) => {
      const numValue = parseFloat(value.trim());
      return !isNaN(numValue) ? sum + numValue : sum;
    }, 0);
}

/**
 * ✅ FEATURE 1: Calcule le pourcentage d'une valeur par rapport au total du breakdown
 */
function calculatePercentageForBreakdown(value: string, total: number): number {
  if (total === 0) return 0;
  const numValue = parseFloat(value.trim());
  return !isNaN(numValue) ? (numValue / total) * 100 : 0;
}

/**
 * ✅ FEATURE 3: Obtient les dates complètes formatées pour afficher dans les cases
 */
function getFormattedDates(tactiqueStartDate?: string, tactiqueEndDate?: string): { startDateFormatted: string; endDateFormatted: string } {
  if (!tactiqueStartDate || !tactiqueEndDate) {
    return { startDateFormatted: '', endDateFormatted: '' };
  }
  
  // ✅ FIX: Utiliser une méthode plus robuste pour éviter les problèmes de fuseau horaire
  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 car les mois JS commencent à 0
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
 * ✅ FEATURE 2: Valide que les dates de tactique sont dans la plage de campagne
 */
function validateTactiqueDates(
  tactiqueStartDate: string, 
  tactiqueEndDate: string, 
  breakdowns: Breakdown[]
): string | null {
  if (!tactiqueStartDate || !tactiqueEndDate) {
    return null; // Pas d'erreur si les dates ne sont pas définies
  }
  
  const tactiqueStart = new Date(tactiqueStartDate);
  const tactiqueEnd = new Date(tactiqueEndDate);
  
  // Trouver le breakdown par défaut pour obtenir les dates de campagne
  const defaultBreakdown = breakdowns.find(b => b.isDefault);
  if (!defaultBreakdown) {
    return null; // Pas de validation si pas de breakdown par défaut
  }
  
  const campaignStart = new Date(defaultBreakdown.startDate);
  const campaignEnd = new Date(defaultBreakdown.endDate);
  
  if (tactiqueStart < campaignStart) {
    return `La date de début de la tactique ne peut pas être antérieure au début de la campagne (${defaultBreakdown.startDate})`;
  }
  
  if (tactiqueEnd > campaignEnd) {
    return `La date de fin de la tactique ne peut pas être postérieure à la fin de la campagne (${defaultBreakdown.endDate})`;
  }
  
  return null;
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
  
  // ✅ FEATURE 3: État pour gérer l'activation/désactivation des cases du breakdown par défaut
  const [activePeriods, setActivePeriods] = useState<{ [key: string]: boolean }>({});
  
  // Générer les périodes quand les breakdowns changent
  useEffect(() => {
    if (breakdowns.length > 0) {
      // ✅ FEATURE 2: Passer les dates de tactique pour les breakdowns par défaut
      const allPeriods = generateAllPeriods(
        breakdowns, 
        formData.TC_StartDate, 
        formData.TC_EndDate
      );
      setPeriods(allPeriods);
      
      // ✅ FEATURE 3: Obtenir les dates formatées pour l'initialisation
      const { startDateFormatted, endDateFormatted } = getFormattedDates(formData.TC_StartDate, formData.TC_EndDate);
      
      // Initialiser les valeurs depuis formData si elles existent
      const initialValues: { [key: string]: string } = {};
      const initialActivePeriods: { [key: string]: boolean } = {};
      
      allPeriods.forEach(period => {
        const fieldName = `TC_Breakdown_${period.id}`;
        let initialValue = (formData as any)[fieldName] || '';
        
        // ✅ FEATURE 3: Pour le breakdown par défaut, initialiser avec les dates formatées
        const breakdown = breakdowns.find(b => b.id === period.breakdownId);
        if (breakdown?.isDefault && !initialValue) {
          if (period.isFirst && startDateFormatted) {
            initialValue = startDateFormatted;
          } else if (period.isLast && endDateFormatted) {
            initialValue = endDateFormatted;
          }
        }
        
        initialValues[period.id] = initialValue;
        
        // ✅ FEATURE 3: Initialiser l'état d'activation (par défaut toutes actives)
        const activeFieldName = `TC_Breakdown_Active_${period.id}`;
        
        if (breakdown?.isDefault) {
          // Pour le breakdown par défaut, vérifier si l'état d'activation existe déjà
          initialActivePeriods[period.id] = (formData as any)[activeFieldName] !== undefined 
            ? (formData as any)[activeFieldName] 
            : true; // Par défaut, toutes actives
        }
      });
      
      setPeriodValues(initialValues);
      setActivePeriods(initialActivePeriods);
    } else {
      setPeriods([]);
      setPeriodValues({});
      setActivePeriods({});
    }
  }, [breakdowns, formData.TC_StartDate, formData.TC_EndDate]); // ✅ Ajouter les dates de tactique comme dépendances
  
  // Gestionnaire pour les changements de valeurs de période
  const handlePeriodValueChange = (periodId: string, value: string) => {
    // ✅ FEATURE 3: Vérifier si la case est active avant de permettre la saisie
    const breakdown = breakdowns.find(b => periods.find(p => p.id === periodId)?.breakdownId === b.id);
    if (breakdown?.isDefault && !activePeriods[periodId]) {
      return; // Ne pas permettre la saisie si la case n'est pas active
    }
    
    // Mettre à jour l'état local
    setPeriodValues(prev => ({
      ...prev,
      [periodId]: value
    }));
    
    // Créer un événement synthétique pour le gestionnaire onChange
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
  
  // ✅ FEATURE 3: Gestionnaire pour l'activation/désactivation des cases
  const handlePeriodActiveChange = (periodId: string, isActive: boolean) => {
    // Mettre à jour l'état local
    setActivePeriods(prev => ({
      ...prev,
      [periodId]: isActive
    }));
    
    // Si on désactive la case, vider sa valeur
    if (!isActive) {
      handlePeriodValueChange(periodId, '');
    }
    
    // Sauvegarder l'état d'activation dans le formulaire
    const activeFieldName = `TC_Breakdown_Active_${periodId}`;
    const syntheticEvent = {
      target: {
        name: activeFieldName,
        value: isActive.toString(), // ✅ Convertir en string
        type: 'checkbox',
        checked: isActive // ✅ Ajouter la propriété checked
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>; // ✅ Utiliser unknown d'abord
    
    onChange(syntheticEvent);
  };
  
  // Valider les dates
  const validateDateRange = () => {
    if (!formData.TC_StartDate || !formData.TC_EndDate) {
      return null;
    }
    
    const startDate = new Date(formData.TC_StartDate);
    const endDate = new Date(formData.TC_EndDate);
    
    if (endDate <= startDate) {
      return 'La date de fin doit être postérieure à la date de début';
    }
    
    return null;
  };
  
  const dateValidationError = validateDateRange();
  
  // ✅ FEATURE 2: Valider que les dates de tactique sont dans la plage de campagne
  const tactiqueRangeError = validateTactiqueDates(
    formData.TC_StartDate || '', 
    formData.TC_EndDate || '', 
    breakdowns
  );
  
  // Organiser les périodes par breakdown
  const periodsByBreakdown = periods.reduce((acc, period) => {
    if (!acc[period.breakdownId]) {
      acc[period.breakdownId] = [];
    }
    acc[period.breakdownId].push(period);
    return acc;
  }, {} as { [key: string]: BreakdownPeriod[] });

  return (
    <div className="p-8 space-y-6">
      <FormSection
        title="Répartition temporelle"
        description="Configurez les dates de la tactique et répartissez les valeurs selon les breakdowns de la campagne"
      >
        
        {/* Section des dates de tactique */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Date de début */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <HelpIcon 
                tooltip="Date de début de cette tactique spécifique"
                onTooltipChange={onTooltipChange}
              />
              <label className="block text-sm font-medium text-gray-700">
                Date de début *
              </label>
            </div>
            <input
              type="date"
              name="TC_StartDate"
              value={formData.TC_StartDate || ''}
              onChange={onChange}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Date de fin */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <HelpIcon 
                tooltip="Date de fin de cette tactique spécifique"
                onTooltipChange={onTooltipChange}
              />
              <label className="block text-sm font-medium text-gray-700">
                Date de fin *
              </label>
            </div>
            <input
              type="date"
              name="TC_EndDate"
              value={formData.TC_EndDate || ''}
              onChange={onChange}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        {/* Erreurs de validation des dates */}
        {(dateValidationError || tactiqueRangeError) && (
          <div className="mb-6 space-y-2">
            {dateValidationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {dateValidationError}
              </div>
            )}
            {tactiqueRangeError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {tactiqueRangeError}
              </div>
            )}
          </div>
        )}
        
        {/* Section des breakdowns */}
        {breakdowns.length > 0 ? (
          <div className="space-y-8">
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-6">
                <HelpIcon 
                  tooltip="Répartissez vos valeurs selon les périodes définies dans les breakdowns de la campagne"
                  onTooltipChange={onTooltipChange}
                />
                <h3 className="text-lg font-medium text-gray-900">
                  Répartition par breakdown
                </h3>
              </div>
              
              {breakdowns.map(breakdown => {
                const Icon = getBreakdownIcon(breakdown.type);
                const breakdownPeriods = periodsByBreakdown[breakdown.id] || [];
                const isDefaultBreakdown = breakdown.isDefault;
                
                // ✅ FEATURE 1: Calculs indépendants pour ce breakdown
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
                  <div key={breakdown.id} className="mb-8 last:mb-0">
                    {/* En-tête du breakdown */}
                    <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{breakdown.name}</h4>
                        <p className="text-sm text-gray-500">
                          {breakdown.type}
                          {/* ✅ FEATURE 2: Indiquer si les dates de tactique sont utilisées */}
                          {breakdown.isDefault && formData.TC_StartDate && formData.TC_EndDate ? (
                            <> • Basé sur les dates de la tactique ({formData.TC_StartDate} → {formData.TC_EndDate})</>
                          ) : (
                            <> • {breakdown.startDate} → {breakdown.endDate}</>
                          )}
                          {breakdown.type === 'Custom' && breakdown.customPeriods && (
                            <> • {breakdown.customPeriods.length} période(s)</>
                          )}
                        </p>
                      </div>
                      
                      {/* ✅ FEATURE 1: Total pour ce breakdown spécifique */}
                      {showCalculationsForBreakdown && totalValueForBreakdown > 0 && (
                        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                          Total: {totalValueForBreakdown.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>
                      )}
                      
                      {breakdown.isDefault && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                          Par défaut
                        </span>
                      )}
                    </div>
                    
                    {/* Grille des périodes */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {breakdownPeriods.map(period => {
                        const currentValue = periodValues[period.id] || '';
                        const percentage = showCalculationsForBreakdown && totalValueForBreakdown > 0 
                          ? calculatePercentageForBreakdown(currentValue, totalValueForBreakdown) 
                          : 0;
                        
                        // ✅ FEATURE 3: Gestion de l'activation pour le breakdown par défaut
                        const isDefaultBreakdown = breakdown.isDefault;
                        const isActive = isDefaultBreakdown ? (activePeriods[period.id] ?? true) : true;
                        
                        return (
                          <div key={period.id} className={`p-3 rounded-lg border transition-all duration-200 ${
                            isDefaultBreakdown && !isActive 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-white border-gray-300 shadow-sm hover:border-gray-400'
                          }`}>
                            {/* ✅ DESIGN AMÉLIORÉ: Label et checkbox plus discrets */}
                            <div className="flex items-center justify-between mb-2">
                              <label className={`text-xs font-medium ${
                                isDefaultBreakdown && !isActive ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {period.label}
                              </label>
                              
                              {/* ✅ CHECKBOX PLUS DISCRÈTE: Plus petite et couleur neutre */}
                              {isDefaultBreakdown && (
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={(e) => handlePeriodActiveChange(period.id, e.target.checked)}
                                  disabled={loading}
                                  className="h-3 w-3 text-gray-500 focus:ring-gray-400 border-gray-300 rounded transition-colors"
                                />
                              )}
                            </div>
                            
                            {/* ✅ INPUT AVEC MEILLEUR CONTRASTE */}
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => handlePeriodValueChange(period.id, e.target.value)}
                              disabled={loading || (isDefaultBreakdown && !isActive)}
                              placeholder="Valeur"
                              className={`w-full px-3 py-2 text-sm border rounded-md text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                                isDefaultBreakdown && !isActive 
                                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'border-gray-300 disabled:bg-gray-100 bg-white'
                              }`}
                            />
                            
                            {/* ✅ FEATURE 1: Affichage du pourcentage avec meilleur espacement */}
                            {showCalculationsForBreakdown && currentValue.trim() !== '' && isActive && (
                              <div className="mt-2 text-xs text-center space-y-1">
                                <div className="text-indigo-600 font-medium">
                                  {percentage.toFixed(1)}%
                                </div>
                                <div className="text-gray-500">
                                  {parseFloat(currentValue).toLocaleString('fr-CA', { 
                                    minimumFractionDigits: 0, 
                                    maximumFractionDigits: 2 
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun breakdown configuré pour cette campagne.</p>
            <p className="text-sm mt-2">
              Les breakdowns sont définis lors de la création ou modification de la campagne.
            </p>
          </div>
        )}
      </FormSection>
    </div>
  );
}