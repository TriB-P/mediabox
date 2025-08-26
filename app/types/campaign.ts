/**
 * Ce fichier définit les interfaces TypeScript pour les campagnes,
 * incluant la structure des données de campagne pour Firestore,
 * le format des données utilisées dans les formulaires de création/édition,
 * et les propriétés requises pour le composant de tiroir (drawer) de formulaire de campagne.
 * Il assure une typage fort pour la manipulation des données de campagne dans l'application.
 * 
 * ✅ HARMONISÉ : Intégration avec le système de validation des dates centralisé
 */
import { BreakdownFormData } from './breakdown';

// ✅ NOUVEAUX IMPORTS pour la validation des dates
import type { 
  DateRange, 
  DateHierarchy, 
  ValidationResult, 
  ValidationError, 
  DateLimits,
  EntityLevel 
} from '../lib/dateValidationService';

// Re-export pour faciliter l'utilisation
export type { 
  DateRange, 
  DateHierarchy, 
  ValidationResult, 
  ValidationError, 
  DateLimits,
  EntityLevel 
};

/**
 * Définit la structure d'une campagne telle qu'elle est stockée dans Firestore.
 * Chaque propriété correspond à un champ du document Firestore.
 * ✅ HARMONISÉ : Dates déjà en string, cohérent avec le reste du système
 */
export interface Campaign {
  id: string;
  CA_Name: string;
  CA_Campaign_Identifier: string;
  CA_Division?: string;
  CA_Status: 'Draft' | 'Cancelled' | 'Done' | 'Active' | 'Planned';
  CA_Quarter: string;
  CA_Year: string;
  CA_Creative_Folder?: string;
  CA_Custom_Dim_1?: string;
  CA_Custom_Dim_2?: string;
  CA_Custom_Dim_3?: string;
  
  // ✅ HARMONISÉ : Dates principales en string (déjà cohérent)
  CA_Start_Date: string;
  CA_End_Date: string;
  CA_Sprint_Dates?: string;
  CA_Last_Edit?: string;
  
  CA_Budget: number;
  CA_Currency?: string;
  CA_Custom_Fee_1?: number;
  CA_Custom_Fee_2?: number;
  CA_Custom_Fee_3?: number;
  clientId?: string;
  CA_Client_Ext_Id?: string;
  CA_PO?: string;
  CA_Billing_ID?: string;
  createdAt: string;
  updatedAt: string;
  officialVersionId?: string;
}

/**
 * Définit la structure des données utilisées dans les formulaires de création ou d'édition de campagne.
 * Les types de certaines propriétés peuvent différer de l'interface `Campaign` pour faciliter la gestion des entrées de formulaire (par exemple, des nombres stockés en tant que chaînes).
 * ✅ HARMONISÉ : Dates en string cohérent avec Campaign
 */
export interface CampaignFormData {
  CA_Name: string;
  CA_Campaign_Identifier: string;
  CA_Division?: string;
  CA_Status: Campaign['CA_Status'];
  CA_Quarter: string;
  CA_Year: string;
  CA_Creative_Folder?: string;
  CA_Custom_Dim_1?: string;
  CA_Custom_Dim_2?: string;
  CA_Custom_Dim_3?: string;
  
  // ✅ HARMONISÉ : Dates en string (déjà cohérent)
  CA_Start_Date: string;
  CA_End_Date: string;
  CA_Sprint_Dates?: string;
  
  CA_Budget: string; // String dans le formulaire, converti en number au moment de sauvegarder
  CA_Currency?: string;
  CA_Custom_Fee_1?: string;
  CA_Custom_Fee_2?: string;
  CA_Custom_Fee_3?: string;
  CA_Client_Ext_Id?: string;
  CA_PO?: string;
  CA_Billing_ID?: string;
}

/**
 * Définit les propriétés attendues par le composant `CampaignDrawer`.
 * Ces propriétés contrôlent l'ouverture/fermeture du tiroir,
 * les données de la campagne en cours d'édition (si applicable),
 * et la fonction de rappel à exécuter lors de la sauvegarde des modifications.
 */
export interface CampaignDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  onSave: (campaign: CampaignFormData, additionalBreakdowns?: BreakdownFormData[]) => void;
}

// ==================== NOUVEAUX TYPES POUR LA VALIDATION DES CAMPAGNES ====================

/**
 * Interface pour la validation spécifique aux campagnes
 */
export interface CampaignDateValidation {
  startDate: string;
  endDate: string;
  sprintDates?: string;
}

/**
 * Résultat de validation spécifique aux campagnes
 */
export interface CampaignValidationResult extends ValidationResult {
  sprintDatesValid: boolean;
  calculatedSprintDates?: string;
}

/**
 * Données nécessaires pour valider une campagne vs d'autres entités
 */
export interface CampaignValidationContext {
  campaign: CampaignDateValidation;
  existingTactiques?: Array<{
    id: string;
    startDate?: string;
    endDate?: string;
    label: string;
  }>;
}

/**
 * Interface pour les erreurs de validation spécifiques aux campagnes
 */
export interface CampaignValidationError extends ValidationError {
  affectedTactiques?: string[]; // IDs des tactiques qui seraient affectées
  suggestions?: string[]; // Suggestions pour corriger l'erreur
}

/**
 * Utilitaires pour convertir Campaign en DateRange
 */
export function campaignToDateRange(campaign: Campaign | CampaignFormData): DateRange {
  return {
    startDate: campaign.CA_Start_Date,
    endDate: campaign.CA_End_Date
  };
}

/**
 * Utilitaires pour extraire les limites d'une campagne
 */
export function getCampaignDateLimits(campaign: Campaign | CampaignFormData): DateLimits {
  return {
    minStartDate: campaign.CA_Start_Date,
    maxStartDate: campaign.CA_End_Date,
    minEndDate: campaign.CA_Start_Date,
    maxEndDate: campaign.CA_End_Date,
    sourceLevel: 'campaign' as EntityLevel
  };
}

/**
 * Interface pour les statistiques de dates d'une campagne
 */
export interface CampaignDateStats {
  duration: number; // Nombre de jours
  sprintDatesFormatted: string; // Format MMMdd-MMMdd
  isValidRange: boolean;
  tactiquesOutOfRange?: number; // Nombre de tactiques hors limites
  placementsOutOfRange?: number; // Nombre de placements hors limites
}

/**
 * Type pour les options de validation de campagne
 */
export interface CampaignValidationOptions {
  validateSprintDates?: boolean;
  validateAgainstChildren?: boolean; // Valider contre tactiques/placements existants
  strictMode?: boolean; // Mode strict avec validation complète
}

// ==================== TYPES POUR L'HÉRITAGE HIÉRARCHIQUE ====================

/**
 * Interface pour représenter une campagne dans le contexte hiérarchique
 */
export interface CampaignHierarchyData {
  level: 'campaign';
  dates: DateRange;
  entity: Campaign | CampaignFormData;
}

/**
 * Fonction helper pour créer un contexte hiérarchique depuis une campagne
 */
export function createHierarchyFromCampaign(campaign: Campaign | CampaignFormData): DateHierarchy {
  return {
    campaign: campaignToDateRange(campaign)
  };
}

/**
 * Interface pour les contraintes de dates dérivées d'une campagne
 */
export interface CampaignDerivedConstraints {
  minDate: string; // CA_Start_Date
  maxDate: string; // CA_End_Date
  recommendedTagStartDate: string; // CA_Start_Date - 30 jours
  recommendedTagEndDate: string; // CA_End_Date + 30 jours
}

// ==================== TYPES POUR LA GESTION D'ERREURS AVANCÉES ====================

/**
 * Types d'erreurs spécifiques aux campagnes
 */
export type CampaignErrorType = 
  | 'INVALID_DATE_RANGE'
  | 'SPRINT_DATES_MISMATCH' 
  | 'AFFECTS_CHILD_ENTITIES'
  | 'BUDGET_DATE_INCONSISTENCY'
  | 'QUARTER_YEAR_MISMATCH';

/**
 * Interface d'erreur enrichie pour les campagnes
 */
export interface EnhancedCampaignError extends CampaignValidationError {
  type: CampaignErrorType;
  severity: 'error' | 'warning' | 'info';
  autoFixable: boolean;
  relatedFields: string[];
}

// ==================== CONSTANTES UTILES ====================

/**
 * Constantes pour la validation des campagnes
 */
export const CAMPAIGN_VALIDATION_CONSTANTS = {
  MIN_DURATION_DAYS: 1,
  MAX_DURATION_DAYS: 365,
  DEFAULT_TAG_PADDING_DAYS: 30,
  SPRINT_DATE_FORMAT: /^[A-Za-z]{3}\d{2}-[A-Za-z]{3}\d{2}$/
} as const;

/**
 * Messages par défaut pour les erreurs de campagne
 */
export const CAMPAIGN_ERROR_MESSAGES = {
  INVALID_DATE_RANGE: 'La plage de dates de la campagne est invalide',
  SPRINT_DATES_MISMATCH: 'Les dates de sprint ne correspondent pas aux dates de campagne',
  AFFECTS_CHILD_ENTITIES: 'Cette modification affectera des tactiques ou placements existants',
  BUDGET_DATE_INCONSISTENCY: 'Les dates ne correspondent pas à la période budgétaire',
  QUARTER_YEAR_MISMATCH: 'Le trimestre et l\'année ne correspondent pas aux dates spécifiées'
} as const;