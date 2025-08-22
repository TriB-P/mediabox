// app/lib/breakdownService.ts

/**
 * Service amélioré pour la gestion des breakdowns avec:
 * - Limite à 5 breakdowns par campagne
 * - IDs uniques pour les périodes avec champ date pour types automatiques
 * - Champ name pour les types custom seulement
 */
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Breakdown,
  BreakdownFormData,
  BreakdownType,
  DateValidationResult,
  CustomPeriod,
  CustomPeriodFormData,
  validateCustomPeriods,
  DEFAULT_BREAKDOWN_NAME
} from '../types/breakdown';

// ============================================================================
// INTERFACES AMÉLIORÉES
// ============================================================================

/**
 * NOUVEAU: Structure améliorée d'une période de breakdown
 */
export interface TactiqueBreakdownPeriod {
  value: string;        // Volume d'unité pour PEBs, valeur unique pour autres types
  isToggled: boolean;
  order: number;
  unitCost?: string;    // Coût par unité (PEBs uniquement)
  total?: string;       // Total calculé (PEBs uniquement)
  date?: string;        // NOUVEAU: Date de début de la période (YYYY-MM-DD) pour types automatiques
  name?: string;        // NOUVEAU: Nom de la période (custom uniquement)
}

/**
 * Données de breakdown à sauvegarder pour une tactique
 */
export interface BreakdownUpdateData {
  breakdownId: string;
  periodId: string;
  value: string;
  isToggled?: boolean;
  order?: number;
  unitCost?: string;
  total?: string;
  date?: string;        // NOUVEAU: Date de début
  name?: string;        // NOUVEAU: Nom pour custom
}

// ============================================================================
// CONSTANTES AMÉLIORÉES
// ============================================================================

export const MAX_BREAKDOWNS_PER_CAMPAIGN = 5; // MODIFIÉ: Augmenté de 3 à 5

// ============================================================================
// FONCTIONS UTILITAIRES POUR LES IDS ET DATES
// ============================================================================

/**
 * NOUVEAU: Génère un ID unique pour une période
 */
function generateUniquePeriodId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * NOUVEAU: Calcule la date de début d'une période selon le type
 */
function calculatePeriodStartDate(
  periodDate: Date,
  breakdownType: BreakdownType
): string {
  switch (breakdownType) {
    case 'Hebdomadaire':
    case 'PEBs':
      // Trouver le lundi de la semaine
      const dayOfWeek = periodDate.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(periodDate);
      monday.setDate(periodDate.getDate() - daysToSubtract);
      return monday.toISOString().split('T')[0];
    
    case 'Mensuel':
      // 1er du mois
      const firstOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
      return firstOfMonth.toISOString().split('T')[0];
    
    default:
      return periodDate.toISOString().split('T')[0];
  }
}

/**
 * NOUVEAU: Génère les périodes avec la nouvelle structure
 */
function generatePeriodsForBreakdown(
  breakdown: Breakdown,
  tactiqueStartDate?: string,
  tactiqueEndDate?: string
): { id: string; date?: string; name?: string; order: number }[] {
  const periods: { id: string; date?: string; name?: string; order: number }[] = [];

  if (breakdown.type === 'Custom') {
    // Pour Custom: utiliser name, pas de date
    if (breakdown.customPeriods) {
      breakdown.customPeriods
        .sort((a, b) => a.order - b.order)
        .forEach((period, index) => {
          periods.push({
            id: generateUniquePeriodId(),
            name: period.name,
            order: index
          });
        });
    }
    return periods;
  }

  // Pour les autres types: générer avec des dates
  let startDate: Date, endDate: Date;

  if (breakdown.isDefault && tactiqueStartDate && tactiqueEndDate) {
    startDate = new Date(tactiqueStartDate);
    endDate = new Date(tactiqueEndDate);
  } else {
    startDate = new Date(breakdown.startDate);
    endDate = new Date(breakdown.endDate);
  }

  let current = new Date(startDate);
  let order = 0;

  if (breakdown.type === 'Mensuel') {
    // Générer par mois
    current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (current <= endDate) {
      periods.push({
        id: generateUniquePeriodId(),
        date: calculatePeriodStartDate(current, breakdown.type),
        order: order++
      });
      
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    // Générer par semaine (Hebdomadaire, PEBs)
    // Ajuster au lundi
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 1) {
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      current.setDate(current.getDate() - daysToSubtract);
    }
    
    while (current <= endDate) {
      periods.push({
        id: generateUniquePeriodId(),
        date: calculatePeriodStartDate(current, breakdown.type),
        order: order++
      });
      
      current.setDate(current.getDate() + 7);
    }
  }

  return periods;
}

// ============================================================================
// FONCTIONS DE VALIDATION (inchangées)
// ============================================================================

export function validateBreakdownDate(
  date: string,
  type: BreakdownType,
  isStartDate: boolean = true
): DateValidationResult {
  if (!date) {
    return { isValid: false, error: 'Date requise' };
  }
  const dateParts = date.split('-');
  if (dateParts.length !== 3) {
    return { isValid: false, error: 'Format de date invalide' };
  }
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1;
  const day = parseInt(dateParts[2]);
  const dateObj = new Date(year, month, day);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Date invalide' };
  }
  const dayOfWeek = dateObj.getDay();
  switch (type) {
    case 'Hebdomadaire':
    case 'PEBs':
      if (isStartDate) {
        if (dayOfWeek !== 1) {
          return {
            isValid: false,
            error: `La date de début doit être un lundi pour un breakdown ${type}. Date fournie: ${date} (jour ${dayOfWeek})`
          };
        }
      }
      break;
    case 'Mensuel':
      if (isStartDate) {
        const dayOfMonth = dateObj.getDate();
        if (dayOfMonth !== 1) {
          return {
            isValid: false,
            error: 'La date de début doit être le 1er du mois pour un breakdown mensuel'
          };
        }
      }
      break;
    case 'Custom':
      break;
  }
  return { isValid: true };
}

export function getClosestMonday(date: string): string {
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();
  if (dayOfWeek === 1) {
    return date;
  }
  let daysToSubtract: number;
  if (dayOfWeek === 0) {
    daysToSubtract = 6;
  } else {
    daysToSubtract = dayOfWeek - 1;
  }
  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() - daysToSubtract);
  const mondayString = monday.toISOString().split('T')[0];
  return mondayString;
}

export function getFirstOfMonth(date: string): string {
  
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    
    const firstOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const yearStr = firstOfMonth.getFullYear().toString();
    const monthStr = (firstOfMonth.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = firstOfMonth.getDate().toString().padStart(2, '0');
    const result = `${yearStr}-${monthStr}-${dayStr}`;
    return result;
  }
  
  // Fallback vers la méthode originale si le format n'est pas reconnu
  const dateObj = new Date(date);
  
  const firstOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
  
  const yearStr = firstOfMonth.getFullYear().toString();
  const monthStr = (firstOfMonth.getMonth() + 1).toString().padStart(2, '0');
  const dayStr = firstOfMonth.getDate().toString().padStart(2, '0');
  
  const result = `${yearStr}-${monthStr}-${dayStr}`;
  return result;
}
// ============================================================================
// FONCTIONS CRUD AMÉLIORÉES
// ============================================================================

export async function getBreakdowns(
  clientId: string,
  campaignId: string
): Promise<Breakdown[]> {
  try {
    const breakdownsRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'breakdowns'
    );
    const q = query(breakdownsRef, orderBy('order', 'asc'));
    console.log("FIREBASE: LECTURE - Fichier: breakdownService.ts - Fonction: getBreakdowns");
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Breakdown));
  } catch (error) {
    console.error('Erreur lors de la récupération des breakdowns:', error);
    throw error;
  }
}

export async function createBreakdown(
  clientId: string,
  campaignId: string,
  breakdownData: BreakdownFormData,
  isDefault: boolean = false
): Promise<string> {
  try {
    // MODIFIÉ: Vérifier la limite de 5 breakdowns
    const existingBreakdowns = await getBreakdowns(clientId, campaignId);
    if (existingBreakdowns.length >= MAX_BREAKDOWNS_PER_CAMPAIGN && !isDefault) {
      throw new Error(`Maximum ${MAX_BREAKDOWNS_PER_CAMPAIGN} breakdowns autorisés par campagne`);
    }

    const shouldBeDefault = isDefault || breakdownData.isDefault || false;
    
    if (breakdownData.type === 'Custom') {
      if (!breakdownData.customPeriods || breakdownData.customPeriods.length === 0) {
        throw new Error('Au moins une période doit être définie pour un breakdown personnalisé');
      }
      const validation = validateCustomPeriods(breakdownData.customPeriods);
      if (!validation.isValid) {
        const errorMessage = validation.globalError ||
          Object.values(validation.errors).join(', ');
        throw new Error(errorMessage);
      }
    } else {
      const startValidation = validateBreakdownDate(breakdownData.startDate, breakdownData.type, true);
      if (!startValidation.isValid) {
        throw new Error(startValidation.error);
      }
      const endValidation = validateBreakdownDate(breakdownData.endDate, breakdownData.type, false);
      if (!endValidation.isValid) {
        throw new Error(endValidation.error);
      }
      if (new Date(breakdownData.endDate) <= new Date(breakdownData.startDate)) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }
    }

    if (shouldBeDefault) {
      const existingDefault = existingBreakdowns.find(b => b.isDefault);
      if (existingDefault) {
        console.log("FIREBASE: ÉCRITURE - Fonction: createBreakdown - Mise à jour breakdown par défaut");
        await updateDoc(doc(db, 'clients', clientId, 'campaigns', campaignId, 'breakdowns', existingDefault.id), {
          startDate: breakdownData.startDate,
          endDate: breakdownData.endDate,
          updatedAt: new Date().toISOString(),
        });
        return existingDefault.id;
      }
    }

    const nextOrder = existingBreakdowns.length;
    const breakdownsRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'breakdowns'
    );
    const now = new Date().toISOString();
    
    // MODIFIÉ: Nouvelle structure avec periods
    const newBreakdown: any = {
      name: breakdownData.name,
      type: breakdownData.type,
      startDate: breakdownData.startDate,
      endDate: breakdownData.endDate,
      isDefault: shouldBeDefault,
      order: nextOrder,
      createdAt: now,
      updatedAt: now,
    };

    // NOUVEAU: Générer les périodes avec la nouvelle structure
    if (breakdownData.type === 'Custom' && breakdownData.customPeriods) {
      newBreakdown.customPeriods = breakdownData.customPeriods.map((period, index) => ({
        id: generateUniquePeriodId(),
        name: period.name,
        order: index
      }));
    }

    console.log("FIREBASE: ÉCRITURE - Fonction: createBreakdown");
    const docRef = await addDoc(breakdownsRef, newBreakdown);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du breakdown:', error);
    throw error;
  }
}

export async function updateBreakdown(
  clientId: string,
  campaignId: string,
  breakdownId: string,
  breakdownData: BreakdownFormData
): Promise<void> {
  try {
    const existingBreakdowns = await getBreakdowns(clientId, campaignId);
    const targetBreakdown = existingBreakdowns.find(b => b.id === breakdownId);
    if (targetBreakdown?.isDefault) {
      throw new Error('Le breakdown par défaut ne peut pas être modifié manuellement.');
    }

    if (breakdownData.type === 'Custom') {
      if (!breakdownData.customPeriods || breakdownData.customPeriods.length === 0) {
        throw new Error('Au moins une période doit être définie pour un breakdown personnalisé');
      }
      const validation = validateCustomPeriods(breakdownData.customPeriods);
      if (!validation.isValid) {
        const errorMessage = validation.globalError ||
          Object.values(validation.errors).join(', ');
        throw new Error(errorMessage);
      }
    } else {
      const startValidation = validateBreakdownDate(breakdownData.startDate, breakdownData.type, true);
      if (!startValidation.isValid) {
        throw new Error(startValidation.error);
      }
      const endValidation = validateBreakdownDate(breakdownData.endDate, breakdownData.type, false);
      if (!endValidation.isValid) {
        throw new Error(endValidation.error);
      }
      if (new Date(breakdownData.endDate) <= new Date(breakdownData.startDate)) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }
    }

    const breakdownRef = doc(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'breakdowns',
      breakdownId
    );
    
    const updatedBreakdown: any = {
      name: breakdownData.name,
      type: breakdownData.type,
      startDate: breakdownData.startDate,
      endDate: breakdownData.endDate,
      updatedAt: new Date().toISOString(),
    };

    if (breakdownData.type === 'Custom' && breakdownData.customPeriods) {
      updatedBreakdown.customPeriods = breakdownData.customPeriods.map((period, index) => ({
        id: generateUniquePeriodId(),
        name: period.name,
        order: index
      }));
    } else {
      updatedBreakdown.customPeriods = null;
    }

    console.log("FIREBASE: ÉCRITURE - Fonction: updateBreakdown");
    await updateDoc(breakdownRef, updatedBreakdown);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du breakdown:', error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS DE LECTURE AMÉLIORÉES
// ============================================================================

/**
 * MODIFIÉ: Lecture améliorée des données de période
 */
export function getTactiqueBreakdownPeriod(
  tactique: any,
  breakdownId: string,
  periodId: string
): TactiqueBreakdownPeriod | undefined {
  if (!tactique.breakdowns || !tactique.breakdowns[breakdownId]) {
    return undefined;
  }
  
  const breakdown = tactique.breakdowns[breakdownId];
  if (!breakdown.periods) {
    return undefined;
  }
  
  const period = breakdown.periods[periodId];
  if (!period) {
    return undefined;
  }
  
  return {
    value: period.value || '',
    isToggled: period.isToggled !== undefined ? period.isToggled : true,
    order: period.order || 0,
    unitCost: period.unitCost || '',
    total: period.total || '',
    date: period.date || '',        // NOUVEAU
    name: period.name || ''         // NOUVEAU
  };
}

/**
 * NOUVEAU: Fonction pour obtenir la date d'une période
 */
export function getTactiqueBreakdownPeriodDate(
  tactique: any,
  breakdownId: string,
  periodId: string
): string {
  const period = getTactiqueBreakdownPeriod(tactique, breakdownId, periodId);
  return period?.date || '';
}

/**
 * NOUVEAU: Fonction pour obtenir le nom d'une période (custom uniquement)
 */
export function getTactiqueBreakdownPeriodName(
  tactique: any,
  breakdownId: string,
  periodId: string
): string {
  const period = getTactiqueBreakdownPeriod(tactique, breakdownId, periodId);
  return period?.name || '';
}

// ============================================================================
// FONCTIONS DE CALCUL (inchangées mais avec nouvelles interfaces)
// ============================================================================

export function getTactiqueBreakdownValue(
  tactique: any,
  breakdownId: string,
  periodId: string
): string {
  const period = getTactiqueBreakdownPeriod(tactique, breakdownId, periodId);
  return period?.value || '';
}

export function getTactiqueBreakdownUnitCost(
  tactique: any,
  breakdownId: string,
  periodId: string
): string {
  const period = getTactiqueBreakdownPeriod(tactique, breakdownId, periodId);
  return period?.unitCost || '';
}

export function getTactiqueBreakdownTotal(
  tactique: any,
  breakdownId: string,
  periodId: string
): string {
  const period = getTactiqueBreakdownPeriod(tactique, breakdownId, periodId);
  return period?.total || '';
}

export function calculatePEBsTotal(unitCost: string, volume: string): string {
  const unitCostNum = parseFloat(unitCost.trim());
  const volumeNum = parseFloat(volume.trim());
  
  if (isNaN(unitCostNum) || isNaN(volumeNum)) {
    return '';
  }
  
  const total = unitCostNum * volumeNum;
  return total.toFixed(2);
}

export function getTactiqueBreakdownToggleStatus(
  tactique: any,
  breakdownId: string,
  periodId: string
): boolean {
  const period = getTactiqueBreakdownPeriod(tactique, breakdownId, periodId);
  return period?.isToggled !== undefined ? period.isToggled : true;
}

/**
 * MODIFIÉ: Mise à jour améliorée des données de breakdown
 */
export function updateTactiqueBreakdownData(
  currentTactiqueData: any,
  updates: BreakdownUpdateData[]
): any {
  const updatedTactique = { ...currentTactiqueData };
  
  if (!updatedTactique.breakdowns) {
    updatedTactique.breakdowns = {};
  }

  updates.forEach(update => {
    const { breakdownId, periodId, value, isToggled, order, unitCost, total, date, name } = update;
    
    if (!updatedTactique.breakdowns[breakdownId]) {
      updatedTactique.breakdowns[breakdownId] = {
        periods: {}
      };
    }
    
    if (!updatedTactique.breakdowns[breakdownId].periods) {
      updatedTactique.breakdowns[breakdownId].periods = {};
    }
    
    if (!updatedTactique.breakdowns[breakdownId].periods[periodId]) {
      updatedTactique.breakdowns[breakdownId].periods[periodId] = {
        value: '',
        isToggled: true,
        order: 0
      };
    }
    
    const period = updatedTactique.breakdowns[breakdownId].periods[periodId];
    period.value = value;
    if (isToggled !== undefined) period.isToggled = isToggled;
    if (order !== undefined) period.order = order;
    if (unitCost !== undefined) period.unitCost = unitCost;
    if (total !== undefined) period.total = total;
    if (date !== undefined) period.date = date;        // NOUVEAU
    if (name !== undefined) period.name = name;        // NOUVEAU
  });

  return updatedTactique;
}

export function calculateTactiqueBreakdownTotal(
  tactique: any,
  breakdownId: string,
  onlyToggled: boolean = true,
  breakdownType?: string
): number {
  if (!tactique.breakdowns || !tactique.breakdowns[breakdownId]) {
    return 0;
  }

  const breakdown = tactique.breakdowns[breakdownId];
  if (!breakdown.periods) {
    return 0;
  }

  let total = 0;

  Object.values(breakdown.periods).forEach((period: any) => {
    if (!onlyToggled || period.isToggled) {
      const valueToSum = breakdownType === 'PEBs' ? period.total : period.value;
      const numValue = parseFloat(valueToSum || '0');
      if (!isNaN(numValue)) {
        total += numValue;
      }
    }
  });

  return total;
}

export function areAllTactiqueBreakdownValuesNumeric(
  tactique: any,
  breakdownId: string,
  onlyToggled: boolean = true,
  breakdownType?: string
): boolean {
  if (!tactique.breakdowns || !tactique.breakdowns[breakdownId]) {
    return false;
  }

  const breakdown = tactique.breakdowns[breakdownId];
  if (!breakdown.periods) {
    return false;
  }

  const periods = Object.values(breakdown.periods) as TactiqueBreakdownPeriod[];
  
  const relevantPeriods = periods.filter(period => 
    !onlyToggled || period.isToggled
  );

  if (relevantPeriods.length === 0) {
    return false;
  }

  return relevantPeriods.every(period => {
    if (breakdownType === 'PEBs') {
      const unitCostValue = period.unitCost?.trim();
      const volumeValue = period.value?.trim();
      
      if (!unitCostValue || !volumeValue) return false;
      
      const unitCostNum = parseFloat(unitCostValue);
      const volumeNum = parseFloat(volumeValue);
      
      return !isNaN(unitCostNum) && isFinite(unitCostNum) && 
             !isNaN(volumeNum) && isFinite(volumeNum);
    } else {
      const value = period.value?.trim();
      if (!value) return false;
      
      const numValue = parseFloat(value);
      return !isNaN(numValue) && isFinite(numValue);
    }
  });
}

// Fonctions de suppression et autres restent inchangées...
export async function deleteBreakdown(
  clientId: string,
  campaignId: string,
  breakdownId: string
): Promise<void> {
  try {
    const breakdowns = await getBreakdowns(clientId, campaignId);
    const breakdown = breakdowns.find(b => b.id === breakdownId);
    if (!breakdown) {
      throw new Error('Breakdown non trouvé');
    }
    if (breakdown.isDefault) {
      throw new Error('Impossible de supprimer le breakdown par défaut "Calendrier"');
    }
    const breakdownRef = doc(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'breakdowns',
      breakdownId
    );
    console.log("FIREBASE: ÉCRITURE - Fonction: deleteBreakdown");
    await deleteDoc(breakdownRef);
  } catch (error) {
    console.error('Erreur lors de la suppression du breakdown:', error);
    throw error;
  }
}

export async function updateDefaultBreakdownDates(
  clientId: string,
  campaignId: string,
  newStartDate: string,
  newEndDate: string
): Promise<void> {
  try {
    const breakdowns = await getBreakdowns(clientId, campaignId);
    const defaultBreakdown = breakdowns.find(b => b.isDefault);
    if (!defaultBreakdown) {
      return;
    }
    const adjustedStartDate = getClosestMonday(newStartDate);
    const breakdownRef = doc(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'breakdowns',
      defaultBreakdown.id
    );
    console.log("FIREBASE: ÉCRITURE - Fonction: updateDefaultBreakdownDates");
    await updateDoc(breakdownRef, {
      startDate: adjustedStartDate,
      endDate: newEndDate,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des dates du breakdown par défaut:', error);
    throw error;
  }
}

export async function createDefaultBreakdown(
  clientId: string,
  campaignId: string,
  campaignStartDate: string,
  campaignEndDate: string
): Promise<string> {
  try {
    const existingBreakdowns = await getBreakdowns(clientId, campaignId);
    const existingDefault = existingBreakdowns.find(b => b.isDefault);
    if (existingDefault) {
      await updateDefaultBreakdownDates(clientId, campaignId, campaignStartDate, campaignEndDate);
      return existingDefault.id;
    }
    const adjustedStartDate = getClosestMonday(campaignStartDate);
    const startValidation = validateBreakdownDate(adjustedStartDate, 'Hebdomadaire', true);
    if (!startValidation.isValid) {
      console.error('Erreur de validation de la date de début:', startValidation.error);
      throw new Error(`Date de début invalide: ${startValidation.error}`);
    }
    const endValidation = validateBreakdownDate(campaignEndDate, 'Hebdomadaire', false);
    if (!endValidation.isValid) {
      console.error('Erreur de validation de la date de fin:', endValidation.error);
      throw new Error(`Date de fin invalide: ${endValidation.error}`);
    }
    const defaultBreakdownData: BreakdownFormData = {
      name: DEFAULT_BREAKDOWN_NAME,
      type: 'Hebdomadaire',
      startDate: adjustedStartDate,
      endDate: campaignEndDate,
    };
    const breakdownId = await createBreakdown(clientId, campaignId, defaultBreakdownData, true);
    return breakdownId;
  } catch (error) {
    console.error('Erreur lors de la création du breakdown par défaut:', error);
    throw error;
  }
}

export async function ensureDefaultBreakdownExists(
  clientId: string,
  campaignId: string,
  campaignStartDate: string,
  campaignEndDate: string
): Promise<string> {
  try {
    const existingBreakdowns = await getBreakdowns(clientId, campaignId);
    const defaultBreakdown = existingBreakdowns.find(b => b.isDefault);
    if (defaultBreakdown) {
      return defaultBreakdown.id;
    }
    return await createDefaultBreakdown(clientId, campaignId, campaignStartDate, campaignEndDate);
  } catch (error) {
    console.error('Erreur lors de la vérification du breakdown par défaut:', error);
    throw error;
  }
}