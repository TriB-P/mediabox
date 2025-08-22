// app/hooks/useTactiqueBreakdown.ts
/**
 * CORRIGÉ: Hooks personnalisés pour la gestion des breakdowns avec:
 * - Suppression des boucles infinies (dépendances stabilisées)
 * - Support uniquement des IDs déterministes
 * - Gestion des champs date/name selon le type
 * - Structure de données cohérente avec les améliorations
 * - Support des nouvelles fonctionnalités PEBs
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Breakdown } from '../types/breakdown';
import { getCostGuideEntries } from '../lib/costGuideService';
import { getClientInfo } from '../lib/clientService';
import { CostGuideEntry } from '../types/costGuide';
import { calculatePEBsTotal } from '../lib/breakdownService';

// Types exportés
export interface BreakdownPeriod {
  id: string;           // ID déterministe
  label: string;
  value: string;
  breakdownId: string;
  breakdownName: string;
  isFirst?: boolean;
  isLast?: boolean;
  startDate?: Date;     // Date de début pour types automatiques
  periodName?: string;  // Nom pour type custom
}

export interface DistributionModalState {
  isOpen: boolean;
  breakdownId: string | null;
  totalAmount: string;
  distributionMode: 'equal' | 'weighted';
  startDate: string;
  endDate: string;
  pebsField: 'unitCost' | 'value';
}

/**
 * CORRIGÉ: Hook pour gérer l'état local des données de breakdown sans boucles infinies
 */
export function useBreakdownLocalData(
  periods: BreakdownPeriod[],
  formData: any,
  breakdowns: Breakdown[],
  onChange: (e: any) => void
) {
  const [localBreakdownData, setLocalBreakdownData] = useState<any>({});
  
  // ✅ CORRIGÉ : Ref pour éviter les re-créations
  const isInitializedRef = useRef(false);
  const lastSyncRef = useRef<string>('');

  /**
   * Fonction pour parser une date string de manière sûre - MÉMORISÉE
   */
  const parseDate = useCallback((dateString: string): Date => {
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date(dateString);
  }, []);

  /**
   * ✅ CORRIGÉ : Dates de tactique mémorisées pour éviter les recalculs
   */
  const tactiqueeDates = useMemo(() => {
    const tactiqueStartDate = formData.TC_Start_Date ? parseDate(formData.TC_Start_Date) : null;
    const tactiqueEndDate = formData.TC_End_Date ? parseDate(formData.TC_End_Date) : null;
    return { tactiqueStartDate, tactiqueEndDate };
  }, [formData.TC_Start_Date, formData.TC_End_Date, parseDate]);

  /**
   * ✅ CORRIGÉ : Fonction pour filtrer les périodes - STABLE
   */
  const filterPeriodsForBreakdown = useCallback((
    breakdownPeriods: BreakdownPeriod[],
    breakdown: Breakdown,
    tactiqueStartDate: Date | null,
    tactiqueEndDate: Date | null
  ): BreakdownPeriod[] => {
    let filteredPeriods = breakdownPeriods;
    
    console.log(`📊 Breakdown ${breakdown.name} (${breakdown.type}) - ${breakdownPeriods.length} périodes générées`);
    
    // Pour les breakdowns par défaut, filtrer selon les dates de la tactique
    if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
      console.log(`🔍 Filtrage des périodes pour breakdown par défaut selon dates tactique`);
      
      filteredPeriods = breakdownPeriods.filter(period => {
        if (period.startDate) {
          const periodStartDate = period.startDate;
          const periodEndDate = new Date(periodStartDate);
          
          if (breakdown.type === 'Hebdomadaire' || breakdown.type === 'PEBs') {
            periodEndDate.setDate(periodEndDate.getDate() + 6);
          } else if (breakdown.type === 'Mensuel') {
            periodEndDate.setMonth(periodEndDate.getMonth() + 1);
            periodEndDate.setDate(0);
          }
          
          const isValid = periodStartDate <= tactiqueEndDate && periodEndDate >= tactiqueStartDate;
          return isValid;
        }
        return true;
      });
    }
    // Pour les autres breakdowns, filtrer selon leurs propres dates
    else if (!breakdown.isDefault && breakdown.startDate && breakdown.endDate) {
      const breakdownStartDate = parseDate(breakdown.startDate);
      const breakdownEndDate = parseDate(breakdown.endDate);
      
      filteredPeriods = breakdownPeriods.filter(period => {
        if (period.startDate) {
          const periodStartDate = period.startDate;
          const periodEndDate = new Date(periodStartDate);
          
          if (breakdown.type === 'Hebdomadaire' || breakdown.type === 'PEBs') {
            periodEndDate.setDate(periodEndDate.getDate() + 6);
          } else if (breakdown.type === 'Mensuel') {
            periodEndDate.setMonth(periodEndDate.getMonth() + 1);
            periodEndDate.setDate(0);
          }
          
          return periodStartDate <= breakdownEndDate && periodEndDate >= breakdownStartDate;
        }
        return true;
      });
    }

    // Trier les périodes
    return [...filteredPeriods].sort((a, b) => {
      if (breakdown.type === 'Custom') {
        if (breakdown.customPeriods) {
          const aCustomPeriod = breakdown.customPeriods.find(p => p.id === a.id || p.name === a.periodName);
          const bCustomPeriod = breakdown.customPeriods.find(p => p.id === b.id || p.name === b.periodName);
          const aOrder = aCustomPeriod ? aCustomPeriod.order : 0;
          const bOrder = bCustomPeriod ? bCustomPeriod.order : 0;
          return aOrder - bOrder;
        }
        return 0;
      } else {
        if (a.startDate && b.startDate) {
          return a.startDate.getTime() - b.startDate.getTime();
        }
        return 0;
      }
    });
  }, [parseDate]);

  /**
   * ✅ CORRIGÉ : Génération des dates formatées - STABLE
   */
  const formattedDates = useMemo(() => {
    return getFormattedDates(formData.TC_Start_Date, formData.TC_End_Date);
  }, [formData.TC_Start_Date, formData.TC_End_Date]);

  /**
   * ✅ CORRIGÉ : Initialisation sans dépendance circulaire
   */
  const initializeLocalBreakdownData = useCallback(() => {
    // ✅ Éviter la ré-initialisation si déjà fait avec les mêmes périodes
    const periodsKey = periods.map(p => p.id).sort().join('|');
    if (isInitializedRef.current && lastSyncRef.current === periodsKey) {
      return;
    }

    console.log(`🔄 Initialisation des données locales pour ${periods.length} périodes`);
    
    const initialData: any = {};
    const existingBreakdowns = formData.breakdowns || {};
    
    periods.forEach(period => {
      const breakdown = existingBreakdowns[period.breakdownId];
      let foundExistingData = false;
      
      if (breakdown?.periods?.[period.id]) {
        const existingPeriod = breakdown.periods[period.id];
        console.log(`✅ Données trouvées pour période ${period.label} avec ID ${period.id}`);
        initialData[period.id] = {
          value: existingPeriod.value || '',
          isToggled: existingPeriod.isToggled !== undefined ? existingPeriod.isToggled : true,
          unitCost: existingPeriod.unitCost || '',
          total: existingPeriod.total || ''
        };
        foundExistingData = true;
      }
      
      if (!foundExistingData) {
        console.log(`➕ Nouvelle période initialisée: ${period.label} (${period.id})`);
        
        const breakdown_def = breakdowns.find(b => b.id === period.breakdownId);
        let initialValue = '';
        
        if (breakdown_def?.isDefault) {
          if (period.isFirst && formattedDates.startDateFormatted) {
            initialValue = formattedDates.startDateFormatted;
          } else if (period.isLast && formattedDates.endDateFormatted) {
            initialValue = formattedDates.endDateFormatted;
          }
        }
        
        initialData[period.id] = {
          value: initialValue,
          isToggled: true,
          unitCost: '',
          total: ''
        };
      }
    });
    
    setLocalBreakdownData(initialData);
    isInitializedRef.current = true;
    lastSyncRef.current = periodsKey;
  }, [
    periods, 
    formData.breakdowns, 
    breakdowns, 
    formattedDates.startDateFormatted, 
    formattedDates.endDateFormatted
    // ✅ CORRIGÉ : Suppression de localBreakdownData des dépendances
  ]);

  /**
   * ✅ CORRIGÉ : Création d'objet breakdowns - OPTIMISÉE
   */
  const createBreakdownsObject = useCallback(() => {
    const breakdownsObj: any = {};
    const { tactiqueStartDate, tactiqueEndDate } = tactiqueeDates;

    console.log(`🎯 Création objet breakdowns - Dates tactique: ${formData.TC_Start_Date} → ${formData.TC_End_Date}`);
    
    // Grouper les périodes par breakdown
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

      const filteredPeriods = filterPeriodsForBreakdown(
        breakdownPeriods, 
        breakdown, 
        tactiqueStartDate, 
        tactiqueEndDate
      );

      filteredPeriods.forEach((period, index) => {
        const periodData = localBreakdownData[period.id] || { 
          value: '', 
          isToggled: true, 
          unitCost: '',
          total: ''
        };
        
        const periodInfo: any = {
          value: periodData.value,
          isToggled: periodData.isToggled,
          order: index,
          unitCost: periodData.unitCost || '',
          total: periodData.total || ''
        };

        if (breakdown.type === 'Custom') {
          periodInfo.name = period.periodName || period.label;
        } else {
          if (period.startDate) {
            periodInfo.date = period.startDate.toISOString().split('T')[0];
          }
        }
        
        breakdownsObj[breakdownId].periods[period.id] = periodInfo;
      });
    });
    
    return breakdownsObj;
  }, [
    periods, 
    breakdowns, 
    tactiqueeDates, 
    formData.TC_Start_Date, 
    formData.TC_End_Date, 
    filterPeriodsForBreakdown,
    localBreakdownData
  ]);

  // ✅ CORRIGÉ : Effect pour initialiser - STABLE
  useEffect(() => {
    if (periods.length > 0) {
      initializeLocalBreakdownData();
    }
  }, [initializeLocalBreakdownData]);

  // ✅ CORRIGÉ : Effect pour dates par défaut - OPTIMISÉ
  useEffect(() => {
    if (periods.length === 0 || Object.keys(localBreakdownData).length === 0) return;

    const defaultBreakdown = breakdowns.find(b => b.isDefault);
    if (!defaultBreakdown || (!formData.TC_Start_Date && !formData.TC_End_Date)) return;

    const defaultPeriods = periods.filter(p => p.breakdownId === defaultBreakdown.id);
    if (defaultPeriods.length === 0) return;

    let hasUpdates = false;
    const updatedData = { ...localBreakdownData };
    
    defaultPeriods.forEach(period => {
      let newValue = '';
      
      if (period.isFirst && formattedDates.startDateFormatted) {
        newValue = formattedDates.startDateFormatted;
      } else if (period.isLast && formattedDates.endDateFormatted) {
        newValue = formattedDates.endDateFormatted;
      }
      
      if (updatedData[period.id] && updatedData[period.id].value !== newValue) {
        updatedData[period.id] = { 
          ...updatedData[period.id],
          value: newValue
        };
        hasUpdates = true;
      }
    });
    
    if (hasUpdates) {
      setLocalBreakdownData(updatedData);
    }
  }, [
    formattedDates.startDateFormatted, 
    formattedDates.endDateFormatted, 
    periods, 
    breakdowns, 
    localBreakdownData
  ]);

  // ✅ CORRIGÉ : Synchronisation optimisée avec throttling
  useEffect(() => {
    if (periods.length === 0 || Object.keys(localBreakdownData).length === 0) return;

    // ✅ Throttling pour éviter trop de mises à jour
    const timeoutId = setTimeout(() => {
      const breakdownsObj = createBreakdownsObject();
      const currentBreakdowns = formData.breakdowns || {};
      
      // ✅ Comparaison plus intelligente
      const currentHash = JSON.stringify(currentBreakdowns);
      const newHash = JSON.stringify(breakdownsObj);
      
      if (currentHash !== newHash) {
        console.log(`🔄 Synchronisation avec formulaire parent`);
        const syntheticEvent = {
          target: {
            name: 'breakdowns',
            value: breakdownsObj,
            type: 'object'
          }
        } as any;
        onChange(syntheticEvent);
      }
    }, 100); // ✅ Debounce de 100ms

    return () => clearTimeout(timeoutId);
  }, [localBreakdownData, createBreakdownsObject, formData.breakdowns, onChange]);

  return {
    localBreakdownData,
    setLocalBreakdownData
  };
}

/**
 * Hook pour gérer l'état du cost guide - INCHANGÉ
 */
export function useCostGuide(clientId?: string) {
  const [costGuideEntries, setCostGuideEntries] = useState<CostGuideEntry[]>([]);
  const [clientHasCostGuide, setClientHasCostGuide] = useState<boolean>(false);
  const [costGuideLoading, setCostGuideLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkClientCostGuide = async () => {
      if (!clientId) {
        console.warn('ClientId non fourni pour la vérification du cost guide');
        return;
      }
      
      try {
        const clientInfo = await getClientInfo(clientId);
        
        const costGuideId = clientInfo.CL_Cost_Guide_ID;
        const hasCostGuide = !!(costGuideId && typeof costGuideId === 'string' && costGuideId.trim());
        
        setClientHasCostGuide(hasCostGuide);
        
        if (hasCostGuide && costGuideId) {
          setCostGuideLoading(true);
          const entries = await getCostGuideEntries(costGuideId);
          setCostGuideEntries(entries);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du cost guide:', error);
        setClientHasCostGuide(false);
      } finally {
        setCostGuideLoading(false);
      }
    };

    checkClientCostGuide();
  }, [clientId]);

  return {
    costGuideEntries,
    clientHasCostGuide,
    costGuideLoading
  };
}

/**
 * STABLE : Hook pour gérer les handlers des périodes
 */
export function usePeriodHandlers(
  periods: BreakdownPeriod[],
  breakdowns: Breakdown[],
  localBreakdownData: any,
  setLocalBreakdownData: (data: any) => void
) {
  const handlePeriodValueChange = useCallback((
    periodId: string, 
    value: string, 
    field: 'value' | 'unitCost' = 'value'
  ) => {
    const period = periods.find(p => p.id === periodId);
    if (!period) {
      console.warn(`⚠️ Période non trouvée avec ID: ${periodId}`);
      return;
    }

    const breakdown = breakdowns.find(b => b.id === period.breakdownId);
    
    const currentData = localBreakdownData[periodId] || { value: '', isToggled: true, unitCost: '', total: '' };
    if (breakdown?.isDefault && !currentData.isToggled) {
      return;
    }

    const updatedData = {
      ...currentData,
      [field]: value
    };

    if (breakdown?.type === 'PEBs') {
      const unitCost = field === 'unitCost' ? value : currentData.unitCost;
      const volume = field === 'value' ? value : currentData.value;
      
      updatedData.total = calculatePEBsTotal(unitCost, volume);
    }

    console.log(`📝 Mise à jour période ${period.label} (${periodId}): ${field} = "${value}"`);

    setLocalBreakdownData((prev: any) => ({
      ...prev,
      [periodId]: updatedData
    }));
  }, [periods, breakdowns, localBreakdownData, setLocalBreakdownData]);

  const handlePeriodActiveChange = useCallback((periodId: string, isActive: boolean) => {
    const period = periods.find(p => p.id === periodId);
    if (!period) {
      console.warn(`⚠️ Période non trouvée avec ID: ${periodId}`);
      return;
    }

    const currentData = localBreakdownData[periodId] || { value: '', isToggled: true, unitCost: '', total: '' };

    console.log(`🔄 Toggle période ${period.label} (${periodId}): ${isActive ? 'ACTIVÉE' : 'DÉSACTIVÉE'}`);

    setLocalBreakdownData((prev: any) => ({
      ...prev,
      [periodId]: {
        value: isActive ? currentData.value : '',
        unitCost: isActive ? currentData.unitCost : '',
        total: isActive ? currentData.total : '',
        isToggled: isActive
      }
    }));
  }, [periods, localBreakdownData, setLocalBreakdownData]);

  const getPeriodValue = useCallback((
    periodId: string, 
    breakdownId: string, 
    field: 'value' | 'unitCost' | 'total' = 'value'
  ): string => {
    const data = localBreakdownData[periodId];
    return data?.[field] || '';
  }, [localBreakdownData]);

  const getPeriodActiveStatus = useCallback((periodId: string, breakdownId: string): boolean => {
    const data = localBreakdownData[periodId];
    return data?.isToggled !== undefined ? data.isToggled : true;
  }, [localBreakdownData]);

  return {
    handlePeriodValueChange,
    handlePeriodActiveChange,
    getPeriodValue,
    getPeriodActiveStatus
  };
}

// INCHANGÉ: Fonction utilitaire pour formater les dates
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