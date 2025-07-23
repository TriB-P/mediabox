/**
 * Ce fichier gère toutes les opérations CRUD (Créer, Lire, Mettre à jour, Supprimer)
 * pour les breakdowns d'une campagne dans Firebase Firestore.
 * Il inclut également des fonctions utilitaires pour la validation des dates
 * et la gestion des breakdowns par défaut.
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

/**
 * Valide une date selon le type de breakdown.
 * @param date - La date à valider au format YYYY-MM-DD.
 * @param type - Le type de breakdown ('Hebdomadaire', 'Mensuel', 'Custom').
 * @param isStartDate - Indique si la date est une date de début (true) ou de fin (false).
 * @returns Un objet DateValidationResult indiquant si la date est valide et un message d'erreur si ce n'est pas le cas.
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
 * @param date - La date de référence au format YYYY-MM-DD.
 * @returns La date du lundi le plus proche au format YYYY-MM-DD.
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
 * @param date - La date de référence au format YYYY-MM-DD.
 * @returns La date du 1er du mois au format YYYY-MM-DD.
 */
export function getFirstOfMonth(date: string): string {
  const dateObj = new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
    .toISOString().split('T')[0];
}

/**
 * Génère un ID unique pour une période personnalisée.
 * @returns Un identifiant de chaîne unique.
 */
function generateCustomPeriodId(): string {
  return `period_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convertit les périodes du formulaire en périodes avec ID.
 * @param periods - Un tableau d'objets CustomPeriodFormData.
 * @returns Un tableau d'objets CustomPeriod avec des IDs générés.
 */
function processCustomPeriods(periods: CustomPeriodFormData[]): CustomPeriod[] {
  return periods.map((period, index) => ({
    id: generateCustomPeriodId(),
    name: period.name,
    order: index
  }));
}

/**
 * Récupère tous les breakdowns pour une campagne spécifique.
 * @param clientId - L'identifiant du client.
 * @param campaignId - L'identifiant de la campagne.
 * @returns Une promesse qui résout en un tableau d'objets Breakdown.
 * @throws Une erreur si la récupération échoue.
 */
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

/**
 * Crée un nouveau breakdown pour une campagne.
 * @param clientId - L'identifiant du client.
 * @param campaignId - L'identifiant de la campagne.
 * @param breakdownData - Les données du breakdown à créer.
 * @param isDefault - Indique si le breakdown doit être le breakdown par défaut.
 * @returns Une promesse qui résout en l'identifiant du breakdown créé.
 * @throws Une erreur si la création échoue ou si les données sont invalides.
 */
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

/**
 * Met à jour un breakdown existant.
 * @param clientId - L'identifiant du client.
 * @param campaignId - L'identifiant de la campagne.
 * @param breakdownId - L'identifiant du breakdown à mettre à jour.
 * @param breakdownData - Les nouvelles données du breakdown.
 * @returns Une promesse qui résout lorsque la mise à jour est terminée.
 * @throws Une erreur si la mise à jour échoue, si le breakdown est par défaut ou si les données sont invalides.
 */
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

/**
 * Supprime un breakdown existant.
 * @param clientId - L'identifiant du client.
 * @param campaignId - L'identifiant de la campagne.
 * @param breakdownId - L'identifiant du breakdown à supprimer.
 * @returns Une promesse qui résout lorsque la suppression est terminée.
 * @throws Une erreur si la suppression échoue ou si le breakdown est le breakdown par défaut.
 */
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

/**
 * Met à jour les dates du breakdown par défaut lorsque les dates de campagne changent.
 * @param clientId - L'identifiant du client.
 * @param campaignId - L'identifiant de la campagne.
 * @param newStartDate - La nouvelle date de début de la campagne.
 * @param newEndDate - La nouvelle date de fin de la campagne.
 * @returns Une promesse qui résout lorsque la mise à jour est terminée.
 * @throws Une erreur si la mise à jour échoue.
 */
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

/**
 * Crée le breakdown par défaut pour une nouvelle campagne.
 * @param clientId - L'identifiant du client.
 * @param campaignId - L'identifiant de la campagne.
 * @param campaignStartDate - La date de début de la campagne.
 * @param campaignEndDate - La date de fin de la campagne.
 * @returns Une promesse qui résout en l'identifiant du breakdown par défaut créé ou mis à jour.
 * @throws Une erreur si la création échoue ou si les dates sont invalides.
 */
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

/**
 * Vérifie et s'assure qu'un breakdown par défaut existe pour une campagne, le crée si nécessaire.
 * @param clientId - L'identifiant du client.
 * @param campaignId - L'identifiant de la campagne.
 * @param campaignStartDate - La date de début de la campagne.
 * @param campaignEndDate - La date de fin de la campagne.
 * @returns Une promesse qui résout en l'identifiant du breakdown par défaut existant ou nouvellement créé.
 * @throws Une erreur si la vérification ou la création échoue.
 */
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