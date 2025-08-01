/**
 * Ce fichier définit les interfaces TypeScript pour les campagnes,
 * incluant la structure des données de campagne pour Firestore,
 * le format des données utilisées dans les formulaires de création/édition,
 * et les propriétés requises pour le composant de tiroir (drawer) de formulaire de campagne.
 * Il assure une typage fort pour la manipulation des données de campagne dans l'application.
 */
import { BreakdownFormData } from './breakdown';

/**
 * Définit la structure d'une campagne telle qu'elle est stockée dans Firestore.
 * Chaque propriété correspond à un champ du document Firestore.
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
  CA_Start_Date: string;
  CA_End_Date: string;
  CA_Sprint_Dates?: string;
  CA_Budget: string;
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