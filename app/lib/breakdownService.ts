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
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: 'Date invalide' };
    }
  
    switch (type) {
      case 'Hebdomadaire':
        if (isStartDate) {
          // La date de début doit être un lundi
          const dayOfWeek = dateObj.getDay();
          if (dayOfWeek !== 1) { // 1 = lundi
            return { 
              isValid: false, 
              error: 'La date de début doit être un lundi pour un breakdown hebdomadaire' 
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
        // Aucune contrainte pour custom
        break;
    }
  
    return { isValid: true };
  }
  
  /**
   * Trouve le lundi le plus proche d'une date donnée
   */
  export function getClosestMonday(date: string): string {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    // Si c'est déjà un lundi, retourner la date
    if (dayOfWeek === 1) return date;
    
    // Calculer le nombre de jours à soustraire pour arriver au lundi précédent
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(dateObj);
    monday.setDate(dateObj.getDate() - daysToSubtract);
    
    return monday.toISOString().split('T')[0];
  }
  
  /**
   * Trouve le 1er du mois d'une date donnée
   */
  export function getFirstOfMonth(date: string): string {
    const dateObj = new Date(date);
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
      .toISOString().split('T')[0];
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
      // Validation des dates
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
  
      // Récupérer les breakdowns existants pour déterminer l'ordre
      const existingBreakdowns = await getBreakdowns(clientId, campaignId);
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
      const newBreakdown = {
        name: breakdownData.name,
        type: breakdownData.type,
        startDate: breakdownData.startDate,
        endDate: breakdownData.endDate,
        isDefault,
        order: nextOrder,
        createdAt: now,
        updatedAt: now,
      };
  
      const docRef = await addDoc(breakdownsRef, newBreakdown);
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
      // Validation des dates
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
  
      const breakdownRef = doc(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'breakdowns',
        breakdownId
      );
  
      const updatedBreakdown = {
        name: breakdownData.name,
        type: breakdownData.type,
        startDate: breakdownData.startDate,
        endDate: breakdownData.endDate,
        updatedAt: new Date().toISOString(),
      };
  
      await updateDoc(breakdownRef, updatedBreakdown);
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
        throw new Error('Impossible de supprimer le breakdown par défaut');
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
    } catch (error) {
      console.error('Erreur lors de la suppression du breakdown:', error);
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
      // Ajuster la date de début au lundi le plus proche
      const adjustedStartDate = getClosestMonday(campaignStartDate);
      
      const defaultBreakdownData: BreakdownFormData = {
        name: DEFAULT_BREAKDOWN_NAME,
        type: 'Hebdomadaire',
        startDate: adjustedStartDate,
        endDate: campaignEndDate,
      };
  
      return await createBreakdown(clientId, campaignId, defaultBreakdownData, true);
    } catch (error) {
      console.error('Erreur lors de la création du breakdown par défaut:', error);
      throw error;
    }
  }