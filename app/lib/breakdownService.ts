// app/lib/breakdownService.ts

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

// ==================== UTILITAIRES DE VALIDATION ====================

/**
 * Valide une date selon le type de breakdown
 */
export function validateBreakdownDate(
  date: string, 
  type: BreakdownType, 
  isStartDate: boolean = true
): DateValidationResult {
  if (!date) {
    return { isValid: false, error: 'Date requise' };
  }

  console.log(`Validation de la date: ${date}, type: ${type}, isStartDate: ${isStartDate}`);

  // Créer la date en utilisant l'heure locale pour éviter les problèmes de fuseau horaire
  const dateParts = date.split('-');
  if (dateParts.length !== 3) {
    return { isValid: false, error: 'Format de date invalide' };
  }

  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1; // Les mois JavaScript commencent à 0
  const day = parseInt(dateParts[2]);
  const dateObj = new Date(year, month, day);
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Date invalide' };
  }

  const dayOfWeek = dateObj.getDay(); // 0=dimanche, 1=lundi, etc.
  console.log(`Date analysée: ${date}, jour de la semaine: ${dayOfWeek}`);

  switch (type) {
    case 'Hebdomadaire':
      if (isStartDate) {
        // La date de début doit être un lundi
        if (dayOfWeek !== 1) { // 1 = lundi
          console.log(`Date ${date} n'est pas un lundi (jour ${dayOfWeek})`);
          return { 
            isValid: false, 
            error: `La date de début doit être un lundi pour un breakdown hebdomadaire. Date fournie: ${date} (jour ${dayOfWeek})` 
          };
        }
      }
      break;
      
    case 'Mensuel':
      if (isStartDate) {
        // La date de début doit être le 1er du mois
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
      // Pour Custom, on valide via validateCustomPeriods()
      break;
  }

  console.log(`Date ${date} validée avec succès pour le type ${type}`);
  return { isValid: true };
}

/**
 * Trouve le lundi le plus proche d'une date donnée
 */
export function getClosestMonday(date: string): string {
  const dateObj = new Date(date + 'T00:00:00'); // Forcer l'heure locale pour éviter les problèmes de fuseau
  const dayOfWeek = dateObj.getDay(); // 0=dimanche, 1=lundi, 2=mardi, etc.
  
  console.log(`Date originale: ${date}, Jour de la semaine: ${dayOfWeek}`);
  
  // Si c'est déjà un lundi, retourner la date
  if (dayOfWeek === 1) {
    console.log(`C'est déjà un lundi: ${date}`);
    return date;
  }
  
  // Calculer le nombre de jours pour aller au lundi précédent
  let daysToSubtract: number;
  if (dayOfWeek === 0) { // Dimanche
    daysToSubtract = 6;
  } else { // Mardi à samedi
    daysToSubtract = dayOfWeek - 1;
  }
  
  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() - daysToSubtract);
  
  const mondayString = monday.toISOString().split('T')[0];
  console.log(`Lundi calculé: ${mondayString} (${daysToSubtract} jours soustraits)`);
  
  return mondayString;
}

/**
 * Trouve le 1er du mois d'une date donnée
 */
export function getFirstOfMonth(date: string): string {
  const dateObj = new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
    .toISOString().split('T')[0];
}

/**
 * Génère un ID unique pour une période personnalisée
 */
function generateCustomPeriodId(): string {
  return `period_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convertit les périodes du formulaire en périodes avec ID
 */
function processCustomPeriods(periods: CustomPeriodFormData[]): CustomPeriod[] {
  return periods.map((period, index) => ({
    id: generateCustomPeriodId(),
    name: period.name,
    order: index
  }));
}

// ==================== FONCTIONS FIRESTORE ====================

/**
 * Récupérer tous les breakdowns d'une campagne
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
 * Créer un nouveau breakdown
 */
export async function createBreakdown(
  clientId: string,
  campaignId: string,
  breakdownData: BreakdownFormData,
  isDefault: boolean = false
): Promise<string> {
  try {
    // Si isDefault n'est pas fourni en paramètre, utiliser celui des données du formulaire
    const shouldBeDefault = isDefault || breakdownData.isDefault || false;
    
    // Validation selon le type
    if (breakdownData.type === 'Custom') {
      // Valider les périodes personnalisées
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
      // Validation classique pour Hebdomadaire/Mensuel
      const startValidation = validateBreakdownDate(breakdownData.startDate, breakdownData.type, true);
      if (!startValidation.isValid) {
        throw new Error(startValidation.error);
      }

      const endValidation = validateBreakdownDate(breakdownData.endDate, breakdownData.type, false);
      if (!endValidation.isValid) {
        throw new Error(endValidation.error);
      }

      // Vérifier que la date de fin est après la date de début
      if (new Date(breakdownData.endDate) <= new Date(breakdownData.startDate)) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }
    }

    // Récupérer les breakdowns existants pour déterminer l'ordre
    const existingBreakdowns = await getBreakdowns(clientId, campaignId);
    
    // Vérifier s'il y a déjà un breakdown par défaut si on essaie d'en créer un
    if (shouldBeDefault) {
      const existingDefault = existingBreakdowns.find(b => b.isDefault);
      if (existingDefault) {
        console.log('Un breakdown par défaut existe déjà, mise à jour au lieu de création');
        // Mettre à jour le breakdown existant au lieu d'en créer un nouveau
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

    // Ajouter les périodes personnalisées si c'est un breakdown Custom
    if (breakdownData.type === 'Custom' && breakdownData.customPeriods) {
      newBreakdown.customPeriods = processCustomPeriods(breakdownData.customPeriods);
    }

    const docRef = await addDoc(breakdownsRef, newBreakdown);
    
    console.log(`Breakdown ${shouldBeDefault ? 'par défaut' : 'personnalisé'} créé avec ID:`, docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du breakdown:', error);
    throw error;
  }
}

/**
 * Mettre à jour un breakdown existant
 */
export async function updateBreakdown(
  clientId: string,
  campaignId: string,
  breakdownId: string,
  breakdownData: BreakdownFormData
): Promise<void> {
  try {
    // Vérifier si c'est un breakdown par défaut (non modifiable via cette fonction)
    const existingBreakdowns = await getBreakdowns(clientId, campaignId);
    const targetBreakdown = existingBreakdowns.find(b => b.id === breakdownId);
    
    if (targetBreakdown?.isDefault) {
      throw new Error('Le breakdown par défaut ne peut pas être modifié manuellement. Utilisez updateDefaultBreakdownDates pour mettre à jour ses dates.');
    }

    // Validation selon le type
    if (breakdownData.type === 'Custom') {
      // Valider les périodes personnalisées
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
      // Validation classique pour Hebdomadaire/Mensuel
      const startValidation = validateBreakdownDate(breakdownData.startDate, breakdownData.type, true);
      if (!startValidation.isValid) {
        throw new Error(startValidation.error);
      }

      const endValidation = validateBreakdownDate(breakdownData.endDate, breakdownData.type, false);
      if (!endValidation.isValid) {
        throw new Error(endValidation.error);
      }

      // Vérifier que la date de fin est après la date de début
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

    // Gestion des périodes personnalisées
    if (breakdownData.type === 'Custom' && breakdownData.customPeriods) {
      updatedBreakdown.customPeriods = processCustomPeriods(breakdownData.customPeriods);
    } else {
      // Supprimer les périodes personnalisées si on change vers un autre type
      updatedBreakdown.customPeriods = null;
    }

    await updateDoc(breakdownRef, updatedBreakdown);
    
    console.log('Breakdown mis à jour avec ID:', breakdownId);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du breakdown:', error);
    throw error;
  }
}

/**
 * Supprimer un breakdown (sauf s'il est par défaut)
 */
export async function deleteBreakdown(
  clientId: string,
  campaignId: string,
  breakdownId: string
): Promise<void> {
  try {
    // Récupérer le breakdown pour vérifier s'il est par défaut
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

    await deleteDoc(breakdownRef);
    
    console.log('Breakdown supprimé avec ID:', breakdownId);
  } catch (error) {
    console.error('Erreur lors de la suppression du breakdown:', error);
    throw error;
  }
}

/**
 * Mettre à jour les dates du breakdown par défaut quand les dates de campagne changent
 */
export async function updateDefaultBreakdownDates(
  clientId: string,
  campaignId: string,
  newStartDate: string,
  newEndDate: string
): Promise<void> {
  try {
    // Récupérer tous les breakdowns pour trouver celui par défaut
    const breakdowns = await getBreakdowns(clientId, campaignId);
    const defaultBreakdown = breakdowns.find(b => b.isDefault);
    
    if (!defaultBreakdown) {
      console.warn('Aucun breakdown par défaut trouvé pour la campagne:', campaignId);
      return;
    }

    // Ajuster la date de début au lundi le plus proche
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

    await updateDoc(breakdownRef, {
      startDate: adjustedStartDate,
      endDate: newEndDate,
      updatedAt: new Date().toISOString(),
    });

    console.log('Dates du breakdown par défaut mises à jour:', {
      breakdownId: defaultBreakdown.id,
      startDate: adjustedStartDate,
      endDate: newEndDate
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des dates du breakdown par défaut:', error);
    throw error;
  }
}

/**
 * Créer le breakdown par défaut pour une nouvelle campagne
 */
export async function createDefaultBreakdown(
  clientId: string,
  campaignId: string,
  campaignStartDate: string,
  campaignEndDate: string
): Promise<string> {
  try {
    console.log('createDefaultBreakdown - Début:', {
      clientId,
      campaignId,
      campaignStartDate,
      campaignEndDate
    });

    // Vérifier qu'il n'y a pas déjà un breakdown par défaut
    const existingBreakdowns = await getBreakdowns(clientId, campaignId);
    const existingDefault = existingBreakdowns.find(b => b.isDefault);
    
    if (existingDefault) {
      console.log('Un breakdown par défaut existe déjà pour cette campagne:', existingDefault.id);
      // Mettre à jour ses dates au lieu de créer un nouveau
      await updateDefaultBreakdownDates(clientId, campaignId, campaignStartDate, campaignEndDate);
      return existingDefault.id;
    }

    // Ajuster la date de début au lundi le plus proche
    const adjustedStartDate = getClosestMonday(campaignStartDate);
    console.log('Date ajustée au lundi:', adjustedStartDate);
    
    // Valider les dates avant la création
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

    console.log('Données du breakdown par défaut à créer:', defaultBreakdownData);

    const breakdownId = await createBreakdown(clientId, campaignId, defaultBreakdownData, true);
    
    console.log('Breakdown par défaut créé avec succès:', breakdownId);
    
    return breakdownId;
  } catch (error) {
    console.error('Erreur lors de la création du breakdown par défaut:', error);
    throw error;
  }
}

/**
 * Vérifier et s'assurer qu'un breakdown par défaut existe pour une campagne
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
      console.log('Breakdown par défaut existe déjà:', defaultBreakdown.id);
      return defaultBreakdown.id;
    }
    
    // Créer le breakdown par défaut s'il n'existe pas
    return await createDefaultBreakdown(clientId, campaignId, campaignStartDate, campaignEndDate);
  } catch (error) {
    console.error('Erreur lors de la vérification du breakdown par défaut:', error);
    throw error;
  }
}