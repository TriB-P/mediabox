// app/hooks/useTactiqueHistory.ts

/**
 * Hook pour gérer l'historique des changements sur les tactiques
 * Génère automatiquement des logs formatés pour les champs surveillés
 * Gère spécifiquement les changements de breakdowns
 * AMÉLIORÉ : Accumulation de l'historique + Conversion des shortcodes en display names
 */

import { useCallback, useMemo } from 'react';
import { TactiqueFormData } from '../types/tactiques';
import { getCachedAllShortcodes } from '../lib/cacheService';

// ============================================================================
// INTERFACES ET TYPES
// ============================================================================

interface HistoryLogEntry {
  timestamp: string;
  userEmail: string;
  variable: string;
  oldValue: string;
  newValue: string;
}

interface WatchedField {
  name: string;
  displayName: string;
  isShortcode?: boolean; // NOUVEAU : Indique si ce champ contient un shortcode ID
}

interface BreakdownChange {
  breakdownId: string;
  breakdownName: string;
  periodId: string;
  periodLabel: string;
  field: 'value' | 'unitCost' | 'isToggled';
  oldValue: any;
  newValue: any;
  changeType: 'modified' | 'added' | 'removed';
}

interface UseTactiqueHistoryProps {
  watchedFields?: string[];
  user?: { email?: string };
  maxValueLength?: number;
}

interface UseTactiqueHistoryReturn {
  generateHistoryLog: (
    originalData: TactiqueFormData | null,
    newData: TactiqueFormData,
    existingHistory?: string
  ) => string;
  watchedFieldsList: string[];
}

// ============================================================================
// CONFIGURATION PAR DÉFAUT AVEC SUPPORT DES SHORTCODES
// ============================================================================

const DEFAULT_WATCHED_FIELDS: WatchedField[] = [
  { name: 'TC_Publisher', displayName: 'Publisher', isShortcode: true },
  { name: 'TC_Media_Budget', displayName: 'Media Budget' },
  { name: 'TC_Client_Budget', displayName: 'Client Budget' },
  { name: 'TC_Inventory', displayName: 'Inventory', isShortcode: true },
  { name: 'TC_Media_Type', displayName: 'Media Type', isShortcode: true },
  { name: 'TC_Start_Date', displayName: 'Start Date' },
  { name: 'TC_End_Date', displayName: 'End Date' },
  { name: 'TC_Unit_Price', displayName: 'Unit Price' },
  { name: 'TC_BuyCurrency', displayName: 'Buy Currency' },

];

const MAX_VALUE_LENGTH = 50; // Longueur max d'une valeur dans le log

// ============================================================================
// FONCTIONS UTILITAIRES AMÉLIORÉES
// ============================================================================

/**
 * Formate une date/heure au format simple : YYYY-MM-DD HH:MM
 */
const formatDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * NOUVEAU : Convertit un shortcode ID en display name anglais si possible
 */
const convertShortcodeToDisplayName = (shortcodeId: string): string => {
  if (!shortcodeId || shortcodeId.trim() === '') {
    return shortcodeId;
  }

  try {
    const allShortcodes = getCachedAllShortcodes();
    if (!allShortcodes) {
      return shortcodeId; // Fallback si pas de cache
    }

    const shortcode = allShortcodes[shortcodeId];
    if (shortcode) {
      // Priorité : Display Name EN > Display Name FR > Code > ID
      return shortcode.SH_Display_Name_EN || 
             shortcode.SH_Display_Name_FR || 
             shortcode.SH_Code || 
             shortcodeId;
    }

    return shortcodeId; // Fallback si shortcode pas trouvé
  } catch (error) {
    console.error(`[HISTORY] Erreur conversion shortcode ${shortcodeId}:`, error);
    return shortcodeId; // Fallback en cas d'erreur
  }
};

/**
 * AMÉLIORÉ : Formate une valeur pour l'affichage dans les logs avec support des shortcodes
 */
/**
 * AMÉLIORÉ : Formate une valeur pour l'affichage dans les logs avec support des shortcodes et arrondi automatique des nombres
 */
const formatValue = (
  value: any, 
  isShortcode: boolean = false, 
  maxLength: number = MAX_VALUE_LENGTH
): string => {
  if (value === null || value === undefined || value === '') {
    return '(empty)';
  }
  
  let stringValue = String(value);
  
  // NOUVEAU : Détecter automatiquement les valeurs numériques et les arrondir à 2 décimales
  if (!isShortcode && Number.isFinite(Number(value))) {
    const numValue = Number(value);
    stringValue = numValue.toFixed(2);
  }
  
  // NOUVEAU : Convertir les shortcodes en display names
  if (isShortcode && stringValue.startsWith('SH_')) {
    stringValue = convertShortcodeToDisplayName(stringValue);
  }
  
  // Nettoyer les caractères de nouvelle ligne
  stringValue = stringValue.replace(/[\r\n]+/g, ' ');
  
  // Tronquer si trop long
  if (stringValue.length > maxLength) {
    stringValue = stringValue.substring(0, maxLength - 3) + '...';
  }
  
  return `"${stringValue}"`;
};

/**
 * Compare deux valeurs et détermine si elles sont différentes
 */
const areValuesDifferent = (oldValue: any, newValue: any): boolean => {
  // Gestion des valeurs null/undefined/empty
  const normalizeValue = (val: any) => {
    if (val === null || val === undefined || val === '') {
      return null;
    }
    return val;
  };
  
  const normalizedOld = normalizeValue(oldValue);
  const normalizedNew = normalizeValue(newValue);
  
  return normalizedOld !== normalizedNew;
};

/**
 * Génère le label d'affichage d'une période de breakdown
 */
const generatePeriodLabel = (periodId: string, breakdownData: any): string => {
  if (!breakdownData || !breakdownData.periods || !breakdownData.periods[periodId]) {
    return periodId.substring(0, 8); // Fallback: 8 premiers chars de l'ID
  }
  
  const period = breakdownData.periods[periodId];
  
  // Si c'est une période custom avec un nom
  if (period.name) {
    return period.name;
  }
  
  // Si c'est une période avec une date
  if (period.date) {
    const date = new Date(period.date);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  }
  
  // Fallback
  return `Period ${period.order || 0}`;
};

// ============================================================================
// HOOK PRINCIPAL AMÉLIORÉ
// ============================================================================

export const useTactiqueHistory = ({
  watchedFields,
  user,
  maxValueLength = MAX_VALUE_LENGTH
}: UseTactiqueHistoryProps = {}): UseTactiqueHistoryReturn => {

  // Liste des champs surveillés (par défaut ou personnalisée)
  const watchedFieldsConfig = useMemo(() => {
    if (watchedFields) {
      return watchedFields.map(field => ({ 
        name: field, 
        displayName: field,
        isShortcode: false // Les champs personnalisés ne sont pas des shortcodes par défaut
      }));
    }
    return DEFAULT_WATCHED_FIELDS;
  }, [watchedFields]);

  const watchedFieldsList = useMemo(() => {
    return watchedFieldsConfig.map(field => field.name);
  }, [watchedFieldsConfig]);

  /**
   * Compare les champs simples et génère les logs avec conversion des shortcodes
   */
  const compareSimpleFields = useCallback((
    originalData: TactiqueFormData,
    newData: TactiqueFormData,
    userEmail: string,
    timestamp: string
  ): HistoryLogEntry[] => {
    const entries: HistoryLogEntry[] = [];
    
    watchedFieldsConfig.forEach(fieldConfig => {
      const fieldName = fieldConfig.name;
      const displayName = fieldConfig.displayName;
      const isShortcode = fieldConfig.isShortcode || false;
      
      const oldValue = (originalData as any)[fieldName];
      const newValue = (newData as any)[fieldName];
      
      if (areValuesDifferent(oldValue, newValue)) {
        entries.push({
          timestamp,
          userEmail,
          variable: displayName,
          oldValue: formatValue(oldValue, isShortcode, maxValueLength),
          newValue: formatValue(newValue, isShortcode, maxValueLength)
        });
      }
    });
    
    return entries;
  }, [watchedFieldsConfig, maxValueLength]);

  /**
   * Compare les breakdowns et génère les logs spécialisés
   */
  const compareBreakdowns = useCallback((
    originalData: TactiqueFormData,
    newData: TactiqueFormData,
    userEmail: string,
    timestamp: string
  ): HistoryLogEntry[] => {
    const entries: HistoryLogEntry[] = [];
    
    const oldBreakdowns = (originalData as any).breakdowns || {};
    const newBreakdowns = (newData as any).breakdowns || {};
    
    // Récupérer tous les breakdownIds (anciens et nouveaux)
    const allBreakdownIds = new Set([
      ...Object.keys(oldBreakdowns),
      ...Object.keys(newBreakdowns)
    ]);
    
    allBreakdownIds.forEach(breakdownId => {
      const oldBreakdown = oldBreakdowns[breakdownId];
      const newBreakdown = newBreakdowns[breakdownId];
      
      // Nom du breakdown (avec fallback)
      const breakdownName = newBreakdown?.name || oldBreakdown?.name || breakdownId.substring(0, 8);
      
      if (!oldBreakdown && newBreakdown) {
        // Nouveau breakdown ajouté
        entries.push({
          timestamp,
          userEmail,
          variable: `Breakdown "${breakdownName}"`,
          oldValue: '(not set)',
          newValue: '(created)',
        });
        return;
      }
      
      if (oldBreakdown && !newBreakdown) {
        // Breakdown supprimé
        entries.push({
          timestamp,
          userEmail,
          variable: `Breakdown "${breakdownName}"`,
          oldValue: '(existed)',
          newValue: '(deleted)',
        });
        return;
      }
      
      if (!oldBreakdown || !newBreakdown) return;
      
      // Comparer les périodes
      const oldPeriods = oldBreakdown.periods || {};
      const newPeriods = newBreakdown.periods || {};
      
      const allPeriodIds = new Set([
        ...Object.keys(oldPeriods),
        ...Object.keys(newPeriods)
      ]);
      
      allPeriodIds.forEach(periodId => {
        const oldPeriod = oldPeriods[periodId];
        const newPeriod = newPeriods[periodId];
        
        const periodLabel = generatePeriodLabel(periodId, newBreakdown);
        
        if (!oldPeriod && newPeriod) {
          // Nouvelle période ajoutée
          entries.push({
            timestamp,
            userEmail,
            variable: `Breakdown "${breakdownName}" period "${periodLabel}"`,
            oldValue: '(not set)',
            newValue: `added with value ${formatValue(newPeriod.value, false, maxValueLength)}`,
          });
          return;
        }
        
        if (oldPeriod && !newPeriod) {
          // Période supprimée
          entries.push({
            timestamp,
            userEmail,
            variable: `Breakdown "${breakdownName}" period "${periodLabel}"`,
            oldValue: formatValue(oldPeriod.value, false, maxValueLength),
            newValue: '(removed)',
          });
          return;
        }
        
        if (!oldPeriod || !newPeriod) return;
        
        // Comparer les champs de la période
        const fieldsToCompare = ['value', 'unitCost', 'isToggled'];
        
        fieldsToCompare.forEach(field => {
          const oldFieldValue = oldPeriod[field];
          const newFieldValue = newPeriod[field];
          
          if (areValuesDifferent(oldFieldValue, newFieldValue)) {
            const fieldDisplayName = field === 'unitCost' ? 'unit cost' : 
                                   field === 'isToggled' ? 'status' : 'value';
            
            entries.push({
              timestamp,
              userEmail,
              variable: `Breakdown "${breakdownName}" period "${periodLabel}" ${fieldDisplayName}`,
              oldValue: formatValue(oldFieldValue, false, maxValueLength),
              newValue: formatValue(newFieldValue, false, maxValueLength)
            });
          }
        });
      });
    });
    
    return entries;
  }, [maxValueLength]);

  /**
   * AMÉLIORÉ : Génère le log d'historique complet avec accumulation correcte
   */
  const generateHistoryLog = useCallback((
    originalData: TactiqueFormData | null,
    newData: TactiqueFormData,
    existingHistory?: string
  ): string => {
    // Si pas de données originales, retourner l'historique existant (création)
    if (!originalData) {
      return existingHistory || '';
    }
    
    const userEmail = user?.email || 'unknown@user.com';
    const timestamp = formatDateTime();
    
    let allEntries: HistoryLogEntry[] = [];
    
    try {
      // Comparer les champs simples
      const simpleFieldEntries = compareSimpleFields(
        originalData,
        newData,
        userEmail,
        timestamp
      );
      allEntries = [...allEntries, ...simpleFieldEntries];
      
      // Comparer les breakdowns
      const breakdownEntries = compareBreakdowns(
        originalData,
        newData,
        userEmail,
        timestamp
      );
      allEntries = [...allEntries, ...breakdownEntries];
      
    } catch (error) {
      console.error('Erreur lors de la génération du log d\'historique:', error);
      
      // Log d'erreur de fallback
      allEntries = [{
        timestamp,
        userEmail,
        variable: 'System',
        oldValue: 'previous state',
        newValue: 'updated (error in logging)'
      }];
    }
    
    // Si aucun changement détecté, retourner l'historique existant tel quel
    if (allEntries.length === 0) {
      return existingHistory || '';
    }
    
    // Formater les nouvelles entrées en texte
    const newLogEntries = allEntries.map(entry => {
      return `• ${entry.timestamp} - ${entry.userEmail} : ${entry.variable} has been changed from ${entry.oldValue} to ${entry.newValue}`;
    });
    
    const newLogText = newLogEntries.join('\n');
    
    // CORRIGÉ : Accumulation propre de l'historique avec retours de ligne corrects
    if (existingHistory && existingHistory.trim()) {
      // Assurer qu'il n'y a pas de retour de ligne en trop au début/fin
      const cleanExistingHistory = existingHistory.trim();
      return cleanExistingHistory + '\n' + newLogText;
    } else {
      return newLogText;
    }
    
  }, [user?.email, compareSimpleFields, compareBreakdowns]);

  return {
    generateHistoryLog,
    watchedFieldsList
  };
};