// app/lib/breakdownService.ts

/**
 * Ce fichier gère toutes les opérations CRUD (Créer, Lire, Mettre à jour, Supprimer)
 * pour les breakdowns d'une campagne dans Firebase Firestore.
 * Il inclut également des fonctions utilitaires pour la validation des dates
 * et la gestion des breakdowns par défaut.
 * 
 * NOUVEAU: Gestion des données de breakdown stockées directement sur les tactiques
 * sous forme d'objet structuré au lieu de champs plats.
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
  where,
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
// INTERFACES POUR LA NOUVELLE STRUCTURE DE DONNÉES
// ============================================================================

/**
 * Structure d'une période de breakdown sur une tactique
 */
export interface TactiqueBreakdownPeriod {
  value: string;
  isToggled: boolean;
  order: number;
}

/**
 * Structure des breakdowns sur une tactique
 */
export interface TactiqueBreakdownData {
  [breakdownId: string]: {
    [periodId: string]: TactiqueBreakdownPeriod;
  };
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
}

// ============================================================================
// FONCTIONS DE VALIDATION EXISTANTES (inchangées)
// ============================================================================

/**
 * Valide une date selon le type de breakdown.
 */
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
      if (isStartDate) {
        if (dayOfWeek !== 1) {
          return {
            isValid: false,
            error: `La date de début doit être un lundi pour un breakdown hebdomadaire. Date fournie: ${date} (jour ${dayOfWeek})`
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

/**
 * Trouve le lundi le plus proche d'une date donnée.
 */
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

/**
 * Trouve le 1er du mois d'une date donnée.
 */
export function getFirstOfMonth(date: string): string {
  const dateObj = new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
    .toISOString().split('T')[0];
}

function generateCustomPeriodId(): string {
  return `period_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function processCustomPeriods(periods: CustomPeriodFormData[]): CustomPeriod[] {
  return periods.map((period, index) => ({
    id: generateCustomPeriodId(),
    name: period.name,
    order: index
  }));
}

// ============================================================================
// FONCTIONS CRUD POUR LES BREAKDOWNS (inchangées)
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
    console.log("FIREBASE: LECTURE - Fichier: breakdownService.ts - Fonction: getBreakdowns - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns");
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
    const existingBreakdowns = await getBreakdowns(clientId, campaignId);
    if (shouldBeDefault) {
      const existingDefault = existingBreakdowns.find(b => b.isDefault);
      if (existingDefault) {
        console.log("FIREBASE: ÉCRITURE - Fichier: breakdownService.ts - Fonction: createBreakdown - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns/${existingDefault.id}");
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
    if (breakdownData.type === 'Custom' && breakdownData.customPeriods) {
      newBreakdown.customPeriods = processCustomPeriods(breakdownData.customPeriods);
    }
    console.log("FIREBASE: ÉCRITURE - Fichier: breakdownService.ts - Fonction: createBreakdown - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns");
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
      throw new Error('Le breakdown par défaut ne peut pas être modifié manuellement. Utilisez updateDefaultBreakdownDates pour mettre à jour ses dates.');
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
      updatedBreakdown.customPeriods = processCustomPeriods(breakdownData.customPeriods);
    } else {
      updatedBreakdown.customPeriods = null;
    }
    console.log("FIREBASE: ÉCRITURE - Fichier: breakdownService.ts - Fonction: updateBreakdown - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns/${breakdownId}");
    await updateDoc(breakdownRef, updatedBreakdown);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du breakdown:', error);
    throw error;
  }
}

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
    console.log("FIREBASE: ÉCRITURE - Fichier: breakdownService.ts - Fonction: deleteBreakdown - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns/${breakdownId}");
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
    console.log("FIREBASE: ÉCRITURE - Fichier: breakdownService.ts - Fonction: updateDefaultBreakdownDates - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns/${defaultBreakdown.id}");
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

// ============================================================================
// NOUVELLES FONCTIONS POUR LA GESTION DES BREAKDOWNS SUR LES TACTIQUES
// ============================================================================

/**
 * Lit les données de breakdown d'une tactique selon la nouvelle structure.
 * NOUVELLE STRUCTURE: breakdown.periods[periodId] = { name, value, isToggled, order }
 * @param tactique - L'objet tactique contenant les données de breakdown
 * @param breakdownId - L'ID du breakdown à lire
 * @param periodId - L'ID de la période à lire (sans préfixe breakdown)
 * @returns Les données de la période ou undefined si non trouvée
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
  if (!breakdown.periods || !breakdown.periods[periodId]) {
    return undefined;
  }
  
  const period = breakdown.periods[periodId];
  return {
    value: period.value || '',
    isToggled: period.isToggled !== undefined ? period.isToggled : true,
    order: period.order || 0
  };
}

/**
 * Lit la valeur d'une période de breakdown depuis une tactique.
 * MODIFIÉ: Utilise la nouvelle structure periods
 * @param tactique - L'objet tactique
 * @param breakdownId - L'ID du breakdown
 * @param periodId - L'ID de la période (sans préfixe breakdown)
 * @returns La valeur de la période ou chaîne vide si non trouvée
 */
export function getTactiqueBreakdownValue(
  tactique: any,
  breakdownId: string,
  periodId: string
): string {
  const period = getTactiqueBreakdownPeriod(tactique, breakdownId, periodId);
  return period?.value || '';
}

/**
 * Lit le statut d'activation d'une période de breakdown depuis une tactique.
 * MODIFIÉ: Utilise la nouvelle structure periods
 * @param tactique - L'objet tactique
 * @param breakdownId - L'ID du breakdown
 * @param periodId - L'ID de la période (sans préfixe breakdown)
 * @returns Le statut d'activation ou true par défaut
 */
export function getTactiqueBreakdownToggleStatus(
  tactique: any,
  breakdownId: string,
  periodId: string
): boolean {
  const period = getTactiqueBreakdownPeriod(tactique, breakdownId, periodId);
  return period?.isToggled ?? true;
}

/**
 * Met à jour les données de breakdown d'une tactique avec la nouvelle structure.
 * MODIFIÉ: Utilise la structure breakdown.periods[periodId] = { name, value, isToggled, order }
 * @param currentTactiqueData - Les données actuelles de la tactique
 * @param updates - Tableau des mises à jour à appliquer
 * @returns Les données de tactique mises à jour
 */
export function updateTactiqueBreakdownData(
  currentTactiqueData: any,
  updates: BreakdownUpdateData[]
): any {
  const updatedTactique = { ...currentTactiqueData };
  
  // Initialiser l'objet breakdowns s'il n'existe pas
  if (!updatedTactique.breakdowns) {
    updatedTactique.breakdowns = {};
  }

  // Appliquer chaque mise à jour
  updates.forEach(update => {
    const { breakdownId, periodId, value, isToggled, order } = update;
    
    // Initialiser le breakdown s'il n'existe pas
    if (!updatedTactique.breakdowns[breakdownId]) {
      updatedTactique.breakdowns[breakdownId] = {
        periods: {}
      };
    }
    
    // Initialiser l'objet periods s'il n'existe pas
    if (!updatedTactique.breakdowns[breakdownId].periods) {
      updatedTactique.breakdowns[breakdownId].periods = {};
    }
    
    // Initialiser la période s'il n'existe pas
    if (!updatedTactique.breakdowns[breakdownId].periods[periodId]) {
      updatedTactique.breakdowns[breakdownId].periods[periodId] = {
        name: '', // Sera mis à jour par le tableau
        value: '',
        isToggled: true,
        order: 0
      };
    }
    
    // Appliquer les mises à jour
    const period = updatedTactique.breakdowns[breakdownId].periods[periodId];
    period.value = value;
    if (isToggled !== undefined) {
      period.isToggled = isToggled;
    }
    if (order !== undefined) {
      period.order = order;
    }
  });

  return updatedTactique;
}

/**
 * Calcule le total des valeurs pour un breakdown spécifique d'une tactique.
 * MODIFIÉ: Utilise la structure breakdown.periods
 * @param tactique - L'objet tactique
 * @param breakdownId - L'ID du breakdown
 * @param onlyToggled - Si true, ne compte que les périodes activées
 * @returns Le total des valeurs numériques
 */
export function calculateTactiqueBreakdownTotal(
  tactique: any,
  breakdownId: string,
  onlyToggled: boolean = true
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
      const numValue = parseFloat(period.value || '0');
      if (!isNaN(numValue)) {
        total += numValue;
      }
    }
  });

  return total;
}

/**
 * Vérifie si toutes les valeurs d'un breakdown sont numériques.
 * MODIFIÉ: Utilise la structure breakdown.periods
 * @param tactique - L'objet tactique
 * @param breakdownId - L'ID du breakdown
 * @param onlyToggled - Si true, ne vérifie que les périodes activées
 * @returns True si toutes les valeurs sont numériques
 */
export function areAllTactiqueBreakdownValuesNumeric(
  tactique: any,
  breakdownId: string,
  onlyToggled: boolean = true
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
    const value = period.value?.trim();
    if (!value) return false;
    
    const numValue = parseFloat(value);
    return !isNaN(numValue) && isFinite(numValue);
  });
}