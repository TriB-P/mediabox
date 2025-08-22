// app/hooks/useTactiqueBreakdown.ts
/**
 * CORRIGÉ: Hooks personnalisés pour la gestion des breakdowns avec:
 * - Support des IDs déterministes pour éviter la perte de données
 * - Gestion des champs date/name selon le type
 * - Structure de données cohérente avec les améliorations
 * - Support des nouvelles fonctionnalités PEBs
 */

import { useState, useEffect, useCallback } from 'react';
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
 * CORRIGÉ: Hook pour gérer l'état local des données de breakdown avec IDs déterministes
 */
export function useBreakdownLocalData(
  periods: BreakdownPeriod[],
  formData: any,
  breakdowns: Breakdown[],
  onChange: (e: any) => void
) {
  const [localBreakdownData, setLocalBreakdownData] = useState<any>({});

  /**
   * Fonction pour parser une date string de manière sûre
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
   * AMÉLIORÉ: Crée l'objet breakdowns structuré avec nouvelle logique de filtrage
   */
  const createBreakdownsObject = useCallback(() => {
    const breakdownsObj: any = {};
    
    const tactiqueStartDate = formData.TC_Start_Date ? parseDate(formData.TC_Start_Date) : null;
    const tactiqueEndDate = formData.TC_End_Date ? parseDate(formData.TC_End_Date) : null;

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

      // Filtrer les périodes selon les dates de la tactique (pour breakdown par défaut)
      let filteredPeriods = breakdownPeriods;
      
      console.log(`📊 Breakdown ${breakdown.name} (${breakdown.type}) - ${breakdownPeriods.length} périodes générées`);
      
      // Pour les breakdowns par défaut, filtrer selon les dates de la tactique
      if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
        console.log(`🔍 Filtrage des périodes pour breakdown par défaut selon dates tactique`);
        console.log(`📅 Dates tactique: ${tactiqueStartDate.toISOString().split('T')[0]} → ${tactiqueEndDate.toISOString().split('T')[0]}`);
        
        filteredPeriods = breakdownPeriods.filter(period => {
          if (period.startDate) {
            const periodStartDate = period.startDate;
            
            // Calculer la date de fin de la période selon le type de breakdown
            const periodEndDate = new Date(periodStartDate);
            
            if (breakdown.type === 'Hebdomadaire' || breakdown.type === 'PEBs') {
              periodEndDate.setDate(periodEndDate.getDate() + 6);
            } else if (breakdown.type === 'Mensuel') {
              periodEndDate.setMonth(periodEndDate.getMonth() + 1);
              periodEndDate.setDate(0);
            }
            
            // La période est valide si elle intersecte avec les dates de la tactique
            const isValid = periodStartDate <= tactiqueEndDate && periodEndDate >= tactiqueStartDate;
            
            console.log(`📅 Période ${period.label} (${period.id}): ${periodStartDate.toISOString().split('T')[0]} → ${periodEndDate.toISOString().split('T')[0]} = ${isValid ? '✅ GARDÉE' : '❌ SUPPRIMÉE'}`);
            
            return isValid;
          }
          
          console.log(`⚠️ Période ${period.label} (${period.id}) sans date de début - gardée par défaut`);
          return true; // Garder si pas de date (pour compatibilité)
        });
        
        console.log(`✅ ${filteredPeriods.length}/${breakdownPeriods.length} périodes gardées après filtrage`);
      }
      // Pour les autres breakdowns, filtrer selon leurs propres dates
      else if (!breakdown.isDefault && breakdown.startDate && breakdown.endDate) {
        console.log(`🔍 Filtrage des périodes pour breakdown non-default selon ses propres dates`);
        console.log(`📅 Dates breakdown: ${breakdown.startDate} → ${breakdown.endDate}`);
        
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
            
            const isValid = periodStartDate <= breakdownEndDate && periodEndDate >= breakdownStartDate;
            
            console.log(`📅 Période ${period.label} (${period.id}): ${periodStartDate.toISOString().split('T')[0]} → ${periodEndDate.toISOString().split('T')[0]} = ${isValid ? '✅ GARDÉE' : '❌ SUPPRIMÉE'}`);
            
            return isValid;
          }
          
          return true;
        });
        
        console.log(`✅ ${filteredPeriods.length}/${breakdownPeriods.length} périodes gardées après filtrage`);
      } else {
        console.log(`➡️ Aucun filtrage appliqué pour ce breakdown`);
      }

      // Trier les périodes filtrées par date ou ordre selon le type
      const sortedPeriods = [...filteredPeriods].sort((a, b) => {
        if (breakdown.type === 'Custom') {
          // Pour Custom, utiliser l'ordre défini dans customPeriods
          if (breakdown.customPeriods) {
            const aCustomPeriod = breakdown.customPeriods.find(p => p.id === a.id || p.name === a.periodName);
            const bCustomPeriod = breakdown.customPeriods.find(p => p.id === b.id || p.name === b.periodName);
            const aOrder = aCustomPeriod ? aCustomPeriod.order : 0;
            const bOrder = bCustomPeriod ? bCustomPeriod.order : 0;
            return aOrder - bOrder;
          }
          return 0;
        } else {
          // Pour les types automatiques, trier par date
          if (a.startDate && b.startDate) {
            return a.startDate.getTime() - b.startDate.getTime();
          }
          return 0;
        }
      });

      // CORRIGÉ: Sauvegarder avec l'ID déterministe comme clé
      sortedPeriods.forEach((period, index) => {
        const periodData = localBreakdownData[period.id] || { 
          value: '', 
          isToggled: true, 
          unitCost: '',
          total: ''
        };
        
        console.log(`💾 Sauvegarde période ${period.label} avec ID: ${period.id}`);
        
        // Structure améliorée avec date/name selon le type
        const periodInfo: any = {
          value: periodData.value,
          isToggled: periodData.isToggled,
          order: index,
          unitCost: periodData.unitCost || '',
          total: periodData.total || ''
        };

        // Ajouter date ou name selon le type
        if (breakdown.type === 'Custom') {
          periodInfo.name = period.periodName || period.label;
        } else {
          // Types automatiques : utiliser la date de début
          if (period.startDate) {
            periodInfo.date = period.startDate.toISOString().split('T')[0];
          }
        }
        
        breakdownsObj[breakdownId].periods[period.id] = periodInfo;
      });
    });
    
    return breakdownsObj;
  }, [periods, localBreakdownData, breakdowns, formData.TC_Start_Date, formData.TC_End_Date, parseDate]);

  /**
   * CORRIGÉ: Initialise l'état local avec support des IDs déterministes
   */
  const initializeLocalBreakdownData = useCallback(() => {
    const initialData: any = {};
    
    console.log(`🔄 Initialisation des données locales pour ${periods.length} périodes`);
    
    periods.forEach(period => {
      const existingBreakdowns = formData.breakdowns || {};
      const breakdown = existingBreakdowns[period.breakdownId];
      
      let foundExistingData = false;
      
      if (breakdown && breakdown.periods) {
        // NOUVEAU: Chercher d'abord avec l'ID déterministe exact
        const existingPeriod = breakdown.periods[period.id];
        
        if (existingPeriod) {
          console.log(`✅ Données trouvées pour période ${period.label} avec ID ${period.id}`);
          initialData[period.id] = {
            value: existingPeriod.value || '',
            isToggled: existingPeriod.isToggled !== undefined ? existingPeriod.isToggled : true,
            unitCost: existingPeriod.unitCost || '',
            total: existingPeriod.total || ''
          };
          foundExistingData = true;
        } else {
          // FALLBACK: Si pas trouvé avec l'ID exact, chercher par date/nom pour migration
          console.log(`🔍 Tentative de migration pour période ${period.label} (${period.id})`);
          
          const periodsInBreakdown = Object.entries(breakdown.periods) as [string, any][];
          
          if (period.startDate) {
            // Pour les types automatiques: chercher par date
            const targetDate = period.startDate.toISOString().split('T')[0];
            const matchingEntry = periodsInBreakdown.find(([, periodData]) => 
              periodData && typeof periodData === 'object' && periodData.date === targetDate
            );
            
            if (matchingEntry) {
              const [oldId, periodData] = matchingEntry;
              console.log(`🔄 Migration trouvée: ${oldId} → ${period.id} (date: ${targetDate})`);
              initialData[period.id] = {
                value: (periodData.value as string) || '',
                isToggled: periodData.isToggled !== undefined ? (periodData.isToggled as boolean) : true,
                unitCost: (periodData.unitCost as string) || '',
                total: (periodData.total as string) || ''
              };
              foundExistingData = true;
            }
          } else if (period.periodName) {
            // Pour les types Custom: chercher par nom
            const matchingEntry = periodsInBreakdown.find(([, periodData]) => 
              periodData && typeof periodData === 'object' && periodData.name === period.periodName
            );
            
            if (matchingEntry) {
              const [oldId, periodData] = matchingEntry;
              console.log(`🔄 Migration trouvée: ${oldId} → ${period.id} (nom: ${period.periodName})`);
              initialData[period.id] = {
                value: (periodData.value as string) || '',
                isToggled: periodData.isToggled !== undefined ? (periodData.isToggled as boolean) : true,
                unitCost: (periodData.unitCost as string) || '',
                total: (periodData.total as string) || ''
              };
              foundExistingData = true;
            }
          }
        }
      }
      
      if (!foundExistingData) {
        console.log(`➕ Nouvelle période initialisée: ${period.label} (${period.id})`);
        
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
      }
    });
    
    const hasChanged = periods.some(period => {
      const existing = localBreakdownData[period.id];
      const newData = initialData[period.id];
      return !existing || existing.value !== newData.value || existing.isToggled !== newData.isToggled ||
             existing.unitCost !== newData.unitCost || existing.total !== newData.total;
    });
    
    if (hasChanged) {
      console.log(`💾 Mise à jour de l'état local avec ${Object.keys(initialData).length} périodes`);
      setLocalBreakdownData(initialData);
    }
  }, [periods, formData.breakdowns, formData.TC_Start_Date, formData.TC_End_Date, breakdowns, localBreakdownData]);

  // Effect pour initialiser l'état local quand les périodes changent
  useEffect(() => {
    if (periods.length > 0) {
      initializeLocalBreakdownData();
    }
  }, [periods, initializeLocalBreakdownData]);

  // Effect pour gérer les changements de dates sur le breakdown par défaut
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
      }
    }
  }, [formData.TC_Start_Date, formData.TC_End_Date, periods, breakdowns, localBreakdownData]);

  // Synchronise l'objet breakdowns avec le formulaire parent
  useEffect(() => {
    if (periods.length > 0 && Object.keys(localBreakdownData).length > 0) {
      const breakdownsObj = createBreakdownsObject();
      
      const currentBreakdowns = formData.breakdowns || {};
      const hasReallyChanged = JSON.stringify(currentBreakdowns) !== JSON.stringify(breakdownsObj);
      
      if (hasReallyChanged) {
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
    }
  }, [localBreakdownData, periods, createBreakdownsObject, formData.breakdowns, onChange]);

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
 * AMÉLIORÉ: Hook pour gérer les handlers des périodes avec IDs déterministes
 */
export function usePeriodHandlers(
  periods: BreakdownPeriod[],
  breakdowns: Breakdown[],
  localBreakdownData: any,
  setLocalBreakdownData: (data: any) => void
) {
  /**
   * AMÉLIORÉ: Gère le changement de valeur d'une période avec support PEBs et IDs déterministes
   */
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

    // Pour PEBs, recalculer automatiquement le total
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

  /**
   * AMÉLIORÉ: Gère le changement d'état d'activation d'une période avec IDs déterministes
   */
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

  /**
   * AMÉLIORÉ: Obtient la valeur d'une période depuis l'état local avec IDs déterministes
   */
  const getPeriodValue = useCallback((
    periodId: string, 
    breakdownId: string, 
    field: 'value' | 'unitCost' | 'total' = 'value'
  ): string => {
    const data = localBreakdownData[periodId];
    const value = data?.[field] || '';
    
    if (!data) {
      console.log(`⚠️ Pas de données pour période ${periodId}`);
    }
    
    return value;
  }, [localBreakdownData]);

  /**
   * AMÉLIORÉ: Obtient le statut d'activation d'une période depuis l'état local avec IDs déterministes
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