// app/lib/campaignService.ts
/**
 * Ce fichier gère toutes les opérations CRUD (Création, Lecture, Mise à jour, Suppression)
 * liées aux campagnes dans Firebase Firestore.
 * Il inclut également la logique pour dupliquer des campagnes entières,
 * créer des versions originales de campagnes et gérer les breakdowns par défaut associés.
 * C'est le point central pour interagir avec la collection 'campaigns' de Firebase.
 * 
 * ✅ HARMONISÉ : Intégration du système de validation des dates centralisé
 * ✅ NOUVEAU : Validation avant sauvegarde et calcul automatique des Sprint Dates
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
  Campaign, 
  CampaignFormData, 
  CampaignValidationResult,
  CampaignValidationContext,
  campaignToDateRange
} from '../types/campaign';
import {
  createDefaultBreakdown,
  updateDefaultBreakdownDates,
  ensureDefaultBreakdownExists
} from './breakdownService';
import {
  duplicateCompleteCampaign
} from './campaignDuplicationUtils';
import { addOnglet } from './tactiqueService';

// ✅ NOUVEAUX IMPORTS : Système de validation des dates
import {
  validateDateRange,
  ValidationResult,
  DateRange
} from './dateValidationService';
import {
  calculateSprintDates,
  isValidDateString,
  formatDateForDisplay,
  daysBetween
} from './dateUtils';
import {
  getErrorMessage,
  formatValidationMessage
} from './validationMessages';

// ==================== FONCTIONS DE VALIDATION SPÉCIALISÉES CAMPAGNE ====================

/**
 * ✅ NOUVEAU : Valide spécifiquement les données d'une campagne
 * ✅ MODIFIÉ : Sprint Dates toujours calculées automatiquement, aucune validation manuelle
 */
function validateCampaignDates(campaignData: CampaignFormData): CampaignValidationResult {
  const { CA_Start_Date, CA_End_Date } = campaignData;

  // Validation de base des dates (fin >= début)
  const dateErrors = validateDateRange(CA_Start_Date, CA_End_Date, 'CA_');
  
  // ✅ MODIFIÉ : Calcul automatique TOUJOURS (ignorer toute valeur manuelle)
  const calculatedSprintDates = calculateSprintDates(CA_Start_Date, CA_End_Date);
  
  // ✅ SUPPRIMÉ : Plus de validation des Sprint Dates manuelles
  // Les Sprint Dates sont toujours calculées automatiquement

  return {
    isValid: dateErrors.length === 0,
    errors: dateErrors,
    limits: {}, // Pas de limites pour les campagnes (niveau racine)
    sprintDatesValid: true, // ✅ MODIFIÉ : Toujours true car toujours calculées
    calculatedSprintDates
  };
}

/**
 * ✅ NOUVEAU : Valide l'impact d'une modification de campagne sur ses entités enfants
 */
async function validateCampaignModificationImpact(
  clientId: string,
  campaignId: string,
  newDates: DateRange
): Promise<{
  isValid: boolean;
  affectedTactiques: Array<{ id: string; label: string; issue: string }>;
  affectedPlacements: Array<{ id: string; label: string; issue: string }>;
  warnings: string[];
}> {
  // Cette fonction pourrait être étendue pour vérifier l'impact sur les tactiques/placements existants
  // Pour l'instant, on retourne une validation simple
  return {
    isValid: true,
    affectedTactiques: [],
    affectedPlacements: [],
    warnings: []
  };
}

/**
 * Crée une version "Originale" pour une campagne donnée dans Firebase.
 * Cette version est marquée comme officielle et enregistre l'utilisateur et la date de création.
 * Crée également un onglet "General" par défaut dans cette version.
 * @param CA_Client L'identifiant du client.
 * @param campaignId L'identifiant de la campagne.
 * @param userEmail L'e-mail de l'utilisateur qui crée la version.
 * @returns L'identifiant du document de la version originale créée.
 */
async function createOriginalVersion(
  CA_Client: string,
  campaignId: string,
  userEmail: string
): Promise<string> {
  try {
    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: createOriginalVersion - Path: clients/${CA_Client}/campaigns/${campaignId}/versions");
    const versionsRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, 'versions');
    const originalVersion = {
      name: 'Originale',
      isOfficial: true,
      createdAt: new Date().toISOString(),
      createdBy: userEmail,
    };
    const docRef = await addDoc(versionsRef, originalVersion);
    
    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: createOriginalVersion - Path: clients/${CA_Client}/campaigns/${campaignId}");
    const campaignRef = doc(db, 'clients', CA_Client, 'campaigns', campaignId);
    await updateDoc(campaignRef, { officialVersionId: docRef.id });

    // Créer l'onglet "General" par défaut
    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: createOriginalVersion - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${docRef.id}/onglets");
    await addOnglet(
      CA_Client,
      campaignId,
      docRef.id,
      {
        ONGLET_Name: 'General',
        ONGLET_Order: 0
      }
    );

    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la version originale:', error);
    throw error;
  }
}

/**
 * ✅ OPTIMISÉ : Récupère toutes les campagnes pour un client donné, triées par date de début.
 * SUPPRESSION des appels automatiques à ensureDefaultBreakdownExists qui causaient des appels répétés.
 * @param CA_Client L'identifiant du client.
 * @returns Une promesse qui résout en un tableau d'objets Campaign.
 */
export async function getCampaigns(CA_Client: string): Promise<Campaign[]> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: campaignService.ts - Fonction: getCampaigns - Path: clients/${CA_Client}/campaigns");
    const campaignsCollection = collection(db, 'clients', CA_Client, 'campaigns');
    const q = query(campaignsCollection, orderBy('CA_Start_Date', 'desc'));
    const querySnapshot = await getDocs(q);

    const campaigns = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Campaign));

    return campaigns;
  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    throw error;
  }
}

/**
 * ✅ FONCTION EXISTANTE : Vérification des breakdowns par défaut à la demande.
 * À appeler seulement quand une campagne est sélectionnée, pas à chaque getCampaigns.
 * @param CA_Client L'identifiant du client.
 * @param campaign L'objet campagne.
 */
export async function ensureDefaultBreakdownForCampaign(
  CA_Client: string,
  campaign: Campaign
): Promise<void> {
  if (campaign.CA_Start_Date && campaign.CA_End_Date) {
    try {
      console.log(`✅ Vérification breakdown par défaut pour campagne ${campaign.id}`);
      await ensureDefaultBreakdownExists(
        CA_Client, 
        campaign.id, 
        campaign.CA_Start_Date, 
        campaign.CA_End_Date
      );
    } catch (error) {
      console.warn(`Impossible de vérifier le breakdown par défaut pour la campagne ${campaign.id}:`, error);
    }
  }
}

/**
 * ✅ MODIFIÉ : Crée une nouvelle campagne dans Firebase avec validation des dates intégrée.
 * Initialise également une version originale et, si nécessaire, des breakdowns additionnels ou un breakdown par défaut.
 * @param CA_Client L'identifiant du client.
 * @param campaignData Les données du formulaire de la nouvelle campagne.
 * @param userEmail L'e-mail de l'utilisateur qui crée la campagne.
 * @param additionalBreakdowns Un tableau optionnel de breakdowns à ajouter lors de la création.
 * @returns L'identifiant du document de la campagne créée.
 * @throws Error si les données de campagne ne passent pas la validation.
 */
export async function createCampaign(
  CA_Client: string,
  campaignData: CampaignFormData,
  userEmail: string,
  additionalBreakdowns: any[] = []
): Promise<string> {
  try {
    // ✅ NOUVELLE ÉTAPE : Validation des données avant création
    console.log('📝 Validation des données de campagne...');
    const validation = validateCampaignDates(campaignData);
    
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(error => 
        getErrorMessage(error.code, {
          date: error.field === 'CA_Start_Date' ? campaignData.CA_Start_Date : 
                error.field === 'CA_End_Date' ? campaignData.CA_End_Date : undefined,
          startDate: campaignData.CA_Start_Date,
          endDate: campaignData.CA_End_Date,
          currentLevel: 'campaign'
        })
      );
      
      throw new Error(`Données de campagne invalides :\n${errorMessages.join('\n')}`);
    }

    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: createCampaign - Path: clients/${CA_Client}/campaigns");
    const campaignsCollection = collection(db, 'clients', CA_Client, 'campaigns');
    const now = new Date().toISOString();

    // ✅ MODIFIÉ : Sprint Dates TOUJOURS calculées automatiquement (ignorer toute valeur du formulaire)
    const calculatedSprintDates = calculateSprintDates(campaignData.CA_Start_Date, campaignData.CA_End_Date);

    const newCampaign = {
      CA_Name: campaignData.CA_Name,
      CA_Campaign_Identifier: campaignData.CA_Campaign_Identifier,
      CA_Division: campaignData.CA_Division || '',
      CA_Status: campaignData.CA_Status,
      CA_Quarter: campaignData.CA_Quarter,
      CA_Year: campaignData.CA_Year,
      CA_Creative_Folder: campaignData.CA_Creative_Folder || '',
      CA_Custom_Dim_1: campaignData.CA_Custom_Dim_1 || '',
      CA_Custom_Dim_2: campaignData.CA_Custom_Dim_2 || '',
      CA_Custom_Dim_3: campaignData.CA_Custom_Dim_3 || '',
      CA_Start_Date: campaignData.CA_Start_Date,
      CA_End_Date: campaignData.CA_End_Date,
      CA_Sprint_Dates: calculatedSprintDates, // ✅ TOUJOURS calculé automatiquement
      CA_Last_Edit: now,
      CA_Budget: parseFloat(campaignData.CA_Budget) || 0,
      CA_Currency: campaignData.CA_Currency || 'CAD',
      CA_Custom_Fee_1: campaignData.CA_Custom_Fee_1 ? parseFloat(campaignData.CA_Custom_Fee_1) : null,
      CA_Custom_Fee_2: campaignData.CA_Custom_Fee_2 ? parseFloat(campaignData.CA_Custom_Fee_2) : null,
      CA_Custom_Fee_3: campaignData.CA_Custom_Fee_3 ? parseFloat(campaignData.CA_Custom_Fee_3) : null,
      CA_Client: CA_Client,
      CA_Client_Ext_Id: campaignData.CA_Client_Ext_Id || '',
      CA_PO: campaignData.CA_PO || '',
      CA_Billing_ID: campaignData.CA_Billing_ID || '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(campaignsCollection, newCampaign);
    console.log(`✅ Campagne créée avec Sprint Dates automatiques: ${calculatedSprintDates}`);
    
    await createOriginalVersion(CA_Client, docRef.id, userEmail);

    if (additionalBreakdowns.length > 0) {
      const { createBreakdown } = await import('./breakdownService');
      for (const breakdown of additionalBreakdowns) {
        await createBreakdown(CA_Client, docRef.id, breakdown, breakdown.isDefault || false);
      }
    } else {
      if (campaignData.CA_Start_Date && campaignData.CA_End_Date) {
        await createDefaultBreakdown(
          CA_Client,
          docRef.id,
          campaignData.CA_Start_Date,
          campaignData.CA_End_Date
        );
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la campagne:', error);
    throw error;
  }
}

/**
 * ✅ MODIFIÉ : Met à jour une campagne existante dans Firebase avec validation des dates intégrée.
 * Si les dates de début ou de fin de la campagne changent, met à jour les dates du breakdown par défaut.
 * @param CA_Client L'identifiant du client.
 * @param campaignId L'identifiant de la campagne à mettre à jour.
 * @param campaignData Les données du formulaire mises à jour pour la campagne.
 * @returns Une promesse qui résout une fois la mise à jour terminée.
 * @throws Error si les nouvelles données ne passent pas la validation.
 */
export async function updateCampaign(
  CA_Client: string,
  campaignId: string,
  campaignData: CampaignFormData
): Promise<void> {
  try {
    // ✅ NOUVELLE ÉTAPE : Validation des données avant mise à jour
    console.log('📝 Validation des données de campagne pour mise à jour...');
    const validation = validateCampaignDates(campaignData);
    
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(error => 
        getErrorMessage(error.code, {
          date: error.field === 'CA_Start_Date' ? campaignData.CA_Start_Date : 
                error.field === 'CA_End_Date' ? campaignData.CA_End_Date : undefined,
          startDate: campaignData.CA_Start_Date,
          endDate: campaignData.CA_End_Date,
          currentLevel: 'campaign'
        })
      );
      
      throw new Error(`Données de campagne invalides :\n${errorMessages.join('\n')}`);
    }

    // ✅ NOUVELLE ÉTAPE : Vérifier l'impact sur les entités enfants
    const impactValidation = await validateCampaignModificationImpact(
      CA_Client,
      campaignId,
      { startDate: campaignData.CA_Start_Date, endDate: campaignData.CA_End_Date }
    );

    if (!impactValidation.isValid) {
      const warningMessage = `Cette modification affectera des entités existantes:\n` +
        impactValidation.affectedTactiques.map(t => `- Tactique "${t.label}": ${t.issue}`).join('\n') +
        impactValidation.affectedPlacements.map(p => `- Placement "${p.label}": ${p.issue}`).join('\n');
      
      console.warn('⚠️ Impact détecté lors de la modification de campagne:', warningMessage);
      // Note: Dans une UI, on pourrait demander confirmation à l'utilisateur ici
    }

    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: updateCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}");
    const campaignRef = doc(db, 'clients', CA_Client, 'campaigns', campaignId);
    const now = new Date().toISOString();

    // Récupérer l'ancienne campagne pour comparer les dates
    const oldCampaigns = await getCampaigns(CA_Client);
    const oldCampaign = oldCampaigns.find(c => c.id === campaignId);

    // ✅ MODIFIÉ : Sprint Dates TOUJOURS calculées automatiquement (ignorer toute valeur du formulaire)
    const calculatedSprintDates = calculateSprintDates(campaignData.CA_Start_Date, campaignData.CA_End_Date);

    const updatedCampaign = {
      CA_Name: campaignData.CA_Name,
      CA_Campaign_Identifier: campaignData.CA_Campaign_Identifier,
      CA_Division: campaignData.CA_Division || '',
      CA_Status: campaignData.CA_Status,
      CA_Quarter: campaignData.CA_Quarter,
      CA_Year: campaignData.CA_Year,
      CA_Creative_Folder: campaignData.CA_Creative_Folder || '',
      CA_Custom_Dim_1: campaignData.CA_Custom_Dim_1 || '',
      CA_Custom_Dim_2: campaignData.CA_Custom_Dim_2 || '',
      CA_Custom_Dim_3: campaignData.CA_Custom_Dim_3 || '',
      CA_Start_Date: campaignData.CA_Start_Date,
      CA_End_Date: campaignData.CA_End_Date,
      CA_Sprint_Dates: calculatedSprintDates, // ✅ TOUJOURS calculé automatiquement
      CA_Last_Edit: now,
      CA_Budget: parseFloat(campaignData.CA_Budget) || 0,
      CA_Currency: campaignData.CA_Currency || 'CAD',
      CA_Custom_Fee_1: campaignData.CA_Custom_Fee_1 ? parseFloat(campaignData.CA_Custom_Fee_1) : null,
      CA_Custom_Fee_2: campaignData.CA_Custom_Fee_2 ? parseFloat(campaignData.CA_Custom_Fee_2) : null,
      CA_Custom_Fee_3: campaignData.CA_Custom_Fee_3 ? parseFloat(campaignData.CA_Custom_Fee_3) : null,
      CA_Client_Ext_Id: campaignData.CA_Client_Ext_Id || '',
      CA_PO: campaignData.CA_PO || '',
      CA_Billing_ID: campaignData.CA_Billing_ID || '',
      updatedAt: now,
    };

    await updateDoc(campaignRef, updatedCampaign);
    console.log(`✅ Campagne mise à jour avec Sprint Dates automatiques: ${calculatedSprintDates}`);

    // Mettre à jour les breakdowns si les dates ont changé
    if (oldCampaign &&
      (oldCampaign.CA_Start_Date !== campaignData.CA_Start_Date ||
        oldCampaign.CA_End_Date !== campaignData.CA_End_Date)) {
      
      console.log('📅 Dates modifiées, mise à jour des breakdowns par défaut...');
      await ensureDefaultBreakdownExists(
        CA_Client,
        campaignId,
        campaignData.CA_Start_Date,
        campaignData.CA_End_Date
      );
      await updateDefaultBreakdownDates(
        CA_Client,
        campaignId,
        campaignData.CA_Start_Date,
        campaignData.CA_End_Date
      );
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la campagne:', error);
    throw error;
  }
}

/**
 * Supprime une campagne ainsi que toutes ses sous-collections (versions et breakdowns) de Firebase.
 * @param CA_Client L'identifiant du client.
 * @param campaignId L'identifiant de la campagne à supprimer.
 * @returns Une promesse qui résout une fois la suppression terminée.
 */
export async function deleteCampaign(
  CA_Client: string,
  campaignId: string
): Promise<void> {
  try {
    const subcollections = ['versions', 'breakdowns'];
    for (const subcollection of subcollections) {
      console.log("FIREBASE: LECTURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/${subcollection}");
      const subRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, subcollection);
      const snapshot = await getDocs(subRef);
      for (const doc of snapshot.docs) {
        console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: ${doc.ref.path}");
        await deleteDoc(doc.ref);
      }
    }
    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}");
    const campaignRef = doc(db, 'clients', CA_Client, 'campaigns', campaignId);
    await deleteDoc(campaignRef);
  } catch (error) {
    console.error('Erreur lors de la suppression de la campagne:', error);
    throw error;
  }
}

/**
 * Duplique une campagne existante, y compris ses versions et ses breakdowns,
 * et crée une nouvelle campagne avec les données copiées.
 * @param CA_Client L'identifiant du client.
 * @param sourceCampaignId L'identifiant de la campagne source à dupliquer.
 * @param userEmail L'e-mail de l'utilisateur qui effectue la duplication.
 * @param newName Un nouveau nom optionnel pour la campagne dupliquée.
 * @returns L'identifiant du document de la nouvelle campagne dupliquée.
 */
export async function duplicateCampaign(
  CA_Client: string,
  sourceCampaignId: string,
  userEmail: string,
  newName?: string
): Promise<string> {
  try {
    const campaigns = await getCampaigns(CA_Client);
    const sourceCampaign = campaigns.find(c => c.id === sourceCampaignId);
    if (!sourceCampaign) {
      throw new Error('Campagne source non trouvée');
    }

    const newCampaignData: any = { ...sourceCampaign };
    delete newCampaignData.id;
    delete newCampaignData.officialVersionId;

    const originalName = sourceCampaign.CA_Name || 'Campagne sans nom';
    newCampaignData.CA_Name = newName || `${originalName} - Copie`;
    newCampaignData.CA_Status = 'Draft';
    newCampaignData.createdAt = new Date().toISOString();
    newCampaignData.updatedAt = new Date().toISOString();
    newCampaignData.CA_Last_Edit = new Date().toISOString();

    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: duplicateCampaign - Path: clients/${CA_Client}/campaigns");
    const campaignsCollection = collection(db, 'clients', CA_Client, 'campaigns');
    const docRef = await addDoc(campaignsCollection, newCampaignData);
    const newCampaignId = docRef.id;

    await duplicateCompleteCampaign(CA_Client, sourceCampaignId, newCampaignId);

    return newCampaignId;

  } catch (error) {
    console.error('Erreur lors de la duplication complète de campagne:', error);
    throw error;
  }
}

// ==================== NOUVELLES FONCTIONS UTILITAIRES ====================

/**
 * ✅ NOUVEAU : Valide une campagne et retourne des suggestions d'amélioration
 */
export function validateCampaignWithSuggestions(campaignData: CampaignFormData): {
  validation: CampaignValidationResult;
  suggestions: string[];
  warnings: string[];
} {
  const validation = validateCampaignDates(campaignData);
  const suggestions: string[] = [];
  const warnings: string[] = [];

  // ✅ SUPPRIMÉ : Suggestions inventées sur la durée des campagnes
  // Seules les validations demandées sont conservées

  return { validation, suggestions, warnings };
}

/**
 * ✅ NOUVEAU : Calcule les statistiques d'une campagne
 */
export function getCampaignDateStats(campaign: Campaign | CampaignFormData): {
  duration: number;
  sprintDatesFormatted: string;
  isValidRange: boolean;
  quarterMatch: boolean;
} {
  const duration = isValidDateString(campaign.CA_Start_Date) && isValidDateString(campaign.CA_End_Date)
    ? daysBetween(campaign.CA_Start_Date, campaign.CA_End_Date)
    : 0;

  const sprintDatesFormatted = calculateSprintDates(campaign.CA_Start_Date, campaign.CA_End_Date);
  const isValidRange = duration > 0;
  
  // Vérification basique de correspondance trimestre (peut être améliorée)
  const quarterMatch = true; // Logique à implémenter selon vos besoins

  return {
    duration,
    sprintDatesFormatted,
    isValidRange,
    quarterMatch
  };
}