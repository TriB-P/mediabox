// app/components/Tactiques/Tactiques/useTactiqueBreakdown.ts
/**
 * Hooks personnalisés pour la gestion des breakdowns dans les tactiques.
 * Contient toute la logique de gestion des périodes, de l'état local,
 * et de la synchronisation avec le formulaire parent.
 */

import { useState, useEffect, useCallback } from 'react';
import { Breakdown } from '../types/breakdown';
import { getCostGuideEntries } from '../lib/costGuideService';
import { getClientInfo } from '../lib/clientService';
import { CostGuideEntry } from '../types/costGuide';
import { calculatePEBsTotal } from '../lib/breakdownService';

// Types exportés
export interface BreakdownPeriod {
  id: string;
  label: string;
  value: string;
  breakdownId: string;
  breakdownName: string;
  isFirst?: boolean;
  isLast?: boolean;
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
 * Hook pour gérer l'état local des données de breakdown
 */
export function useBreakdownLocalData(
  periods: BreakdownPeriod[],
  formData: any,
  breakdowns: Breakdown[],
  onChange: (e: any) => void
) {
  const [localBreakdownData, setLocalBreakdownData] = useState<any>({});

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

      // Trier les périodes selon leur ordre naturel avant de les sauvegarder
      const sortedPeriods = [...breakdownPeriods].sort((a, b) => {
        // Déterminer l'ordre selon le type de breakdown
        if (breakdown.type === 'Custom' && breakdown.customPeriods) {
          const aCustomPeriod = breakdown.customPeriods.find(p => a.id.endsWith(p.id));
          const bCustomPeriod = breakdown.customPeriods.find(p => b.id.endsWith(p.id));
          const aOrder = aCustomPeriod ? aCustomPeriod.order : 0;
          const bOrder = bCustomPeriod ? bCustomPeriod.order : 0;
          return aOrder - bOrder;
        } else if (breakdown.type === 'Mensuel') {
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

      // Ajouter chaque période avec son ordre calculé
      sortedPeriods.forEach((period, index) => {
        const periodData = localBreakdownData[period.id] || { 
          value: '', 
          isToggled: true, 
          unitCost: '',
          total: ''
        };
        
        const originalPeriodId = period.id.replace(`${period.breakdownId}_`, '');
        
        breakdownsObj[breakdownId].periods[originalPeriodId] = {
          name: period.label,
          value: periodData.value,
          isToggled: periodData.isToggled,
          order: index,
          unitCost: periodData.unitCost || '',
          total: periodData.total || ''
        };
      });
    });
    
    return breakdownsObj;
  }, [periods, localBreakdownData, breakdowns]);

  /**
   * Initialise l'état local à partir des données existantes de breakdown
   */
  const initializeLocalBreakdownData = useCallback(() => {
    const initialData: any = {};
    
    periods.forEach(period => {
      const existingBreakdowns = formData.breakdowns || {};
      const breakdown = existingBreakdowns[period.breakdownId];
      
      if (breakdown && breakdown.periods) {
        const originalPeriodId = period.id.replace(`${period.breakdownId}_`, '');
        const existingPeriod = breakdown.periods[originalPeriodId];
        
        if (existingPeriod) {
          initialData[period.id] = {
            value: existingPeriod.value || '',
            isToggled: existingPeriod.isToggled !== undefined ? existingPeriod.isToggled : true,
            unitCost: existingPeriod.unitCost || '',
            total: existingPeriod.total || ''
          };
          return;
        }
      }
      
      const breakdown_def = breakdowns.find(b => b.id === period.breakdownId);
      let initialValue = '';
      
      if (breakdown_def?.isDefault && !localBreakdownData[period.id]?.value) {
        const { startDateFormatted, endDateFormatted } = getFormattedDates(formData.TC_Start_Date, formData.TC_End_Date);
        if (period.isFirst && startDateFormatted) {
          initialValue = startDateFormatted;
        } else if (period.isLast && endDateFormatted) {
          initialValue = endDateFormatted;
        }
      }
      
      initialData[period.id] = {
        value: initialValue,
        isToggled: true,
        unitCost: '',
        total: ''
      };
    });
    
    const hasChanged = periods.some(period => {
      const existing = localBreakdownData[period.id];
      const newData = initialData[period.id];
      return !existing || existing.value !== newData.value || existing.isToggled !== newData.isToggled ||
             existing.unitCost !== newData.unitCost || existing.total !== newData.total;
    });
    
    if (hasChanged) {
      setLocalBreakdownData(initialData);
    }
  }, [periods, formData.breakdowns, formData.TC_Start_Date, formData.TC_End_Date, breakdowns]);

  // Effet pour initialiser l'état local quand les périodes changent
  useEffect(() => {
    if (periods.length > 0 && Object.keys(localBreakdownData).length === 0) {
      initializeLocalBreakdownData();
    }
  }, [periods, initializeLocalBreakdownData]);

  // Effet pour gérer les changements de dates sur le breakdown par défaut
  useEffect(() => {
    if (periods.length > 0 && Object.keys(localBreakdownData).length > 0) {
      const defaultBreakdown = breakdowns.find(b => b.isDefault);
      if (defaultBreakdown && (formData.TC_Start_Date || formData.TC_End_Date)) {
        const { startDateFormatted, endDateFormatted } = getFormattedDates(formData.TC_Start_Date, formData.TC_End_Date);
        
        const defaultPeriods = periods.filter(p => p.breakdownId === defaultBreakdown.id);
        const updatedData = { ...localBreakdownData };
        let hasUpdates = false;
        
        defaultPeriods.forEach(period => {
          let newValue = '';
          
          if (period.isFirst && startDateFormatted) {
            newValue = startDateFormatted;
          } else if (period.isLast && endDateFormatted) {
            newValue = endDateFormatted;
          }
          
          updatedData[period.id] = { 
            value: newValue, 
            isToggled: true,
            unitCost: '',
            total: ''
          };
          hasUpdates = true;
        });
        
        if (hasUpdates) {
          setLocalBreakdownData(updatedData);
        }
      }
    }
  }, [formData.TC_Start_Date, formData.TC_End_Date, periods, breakdowns]);

  // Synchronise l'objet breakdowns avec le formulaire parent
  useEffect(() => {
    if (periods.length > 0 && Object.keys(localBreakdownData).length > 0) {
      const breakdownsObj = createBreakdownsObject();
      
      const currentBreakdowns = formData.breakdowns || {};
      const hasReallyChanged = JSON.stringify(currentBreakdowns) !== JSON.stringify(breakdownsObj);
      
      if (hasReallyChanged) {
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
  }, [localBreakdownData, periods]);

  return {
    localBreakdownData,
    setLocalBreakdownData
  };
}

/**
 * Hook pour gérer l'état du cost guide
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
        const hasCostGuide = !!(clientInfo.CL_Cost_Guide_ID && clientInfo.CL_Cost_Guide_ID.trim());
        setClientHasCostGuide(hasCostGuide);
        
        if (hasCostGuide) {
          setCostGuideLoading(true);
          const entries = await getCostGuideEntries(clientInfo.CL_Cost_Guide_ID);
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
 * Hook pour gérer les handlers des périodes
 */
export function usePeriodHandlers(
  periods: BreakdownPeriod[],
  breakdowns: Breakdown[],
  localBreakdownData: any,
  setLocalBreakdownData: (data: any) => void
) {
  /**
   * Gère le changement de valeur d'une période avec support PEBs
   */
  const handlePeriodValueChange = useCallback((
    periodId: string, 
    value: string, 
    field: 'value' | 'unitCost' = 'value'
  ) => {
    const period = periods.find(p => p.id === periodId);
    if (!period) return;

    const breakdown = breakdowns.find(b => b.id === period.breakdownId);
    
    const currentData = localBreakdownData[periodId] || { value: '', isToggled: true, unitCost: '', total: '' };
    if (breakdown?.isDefault && !currentData.isToggled) {
      return;
    }

    const updatedData = {
      ...currentData,
      [field]: value
    };

    // Pour PEBs, recalculer automatiquement le total
    if (breakdown?.type === 'PEBs') {
      const unitCost = field === 'unitCost' ? value : currentData.unitCost;
      const volume = field === 'value' ? value : currentData.value;
      
      updatedData.total = calculatePEBsTotal(unitCost, volume);
    }

    setLocalBreakdownData((prev: any) => ({
      ...prev,
      [periodId]: updatedData
    }));
  }, [periods, breakdowns, localBreakdownData, setLocalBreakdownData]);

  /**
   * Gère le changement d'état d'activation d'une période
   */
  const handlePeriodActiveChange = useCallback((periodId: string, isActive: boolean) => {
    const currentData = localBreakdownData[periodId] || { value: '', isToggled: true, unitCost: '', total: '' };

    setLocalBreakdownData((prev: any) => ({
      ...prev,
      [periodId]: {
        value: isActive ? currentData.value : '',
        unitCost: isActive ? currentData.unitCost : '',
        total: isActive ? currentData.total : '',
        isToggled: isActive
      }
    }));
  }, [localBreakdownData, setLocalBreakdownData]);

  /**
   * Obtient la valeur d'une période depuis l'état local
   */
  const getPeriodValue = useCallback((
    periodId: string, 
    breakdownId: string, 
    field: 'value' | 'unitCost' | 'total' = 'value'
  ): string => {
    const data = localBreakdownData[periodId];
    return data?.[field] || '';
  }, [localBreakdownData]);

  /**
   * Obtient le statut d'activation d'une période depuis l'état local
   */
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

// Fonction utilitaire pour formater les dates
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