
import { BreakdownFormData } from './breakdown';
// Types pour les campagnes qui correspondent à votre structure Firestore
export interface Campaign {
  id: string;
  
  // 🔥 CORRECTION : Ajout de CA_Name et renommage des autres champs
  CA_Name: string; // Nom d'affichage principal
  CA_Campaign_Identifier: string; // Identifiant technique
  CA_Division?: string;
  CA_Status: 'Draft' | 'Cancelled' | 'Done' | 'Active' | 'Planned';
  CA_Quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Full Year';
  CA_Year: number;
  CA_Creative_Folder?: string;
  CA_Custom_Dim_1?: string;
  CA_Custom_Dim_2?: string;
  CA_Custom_Dim_3?: string;
  
  // Dates
  CA_Start_Date: string;
  CA_End_Date: string;
  CA_Sprint_Dates?: string;
  CA_Last_Edit?: string;
  
  // Budget
  CA_Budget: number;
  CA_Currency?: string;
  CA_Custom_Fee_1?: number;
  CA_Custom_Fee_2?: number;
  CA_Custom_Fee_3?: number;
  
  // Admin
  clientId?: string;
  CA_Client_Ext_Id?: string;
  CA_PO?: string;
  CA_Billing_ID?: string;
  
  // Métadonnées
  createdAt: string;
  updatedAt: string;
  officialVersionId?: string;
}

// Type pour le formulaire de création/édition
export interface CampaignFormData {
  // 🔥 CORRECTION : Ajout de CA_Name
  CA_Name: string;
  CA_Campaign_Identifier: string;
  CA_Division?: string;
  CA_Status: Campaign['CA_Status'];
  CA_Quarter: Campaign['CA_Quarter'];
  CA_Year: string;
  CA_Creative_Folder?: string;
  CA_Custom_Dim_1?: string;
  CA_Custom_Dim_2?: string;
  CA_Custom_Dim_3?: string;
  
  // Dates
  CA_Start_Date: string;
  CA_End_Date: string;
  CA_Sprint_Dates?: string;
  
  // Budget
  CA_Budget: string;
  CA_Currency?: string;
  CA_Custom_Fee_1?: string;
  CA_Custom_Fee_2?: string;
  CA_Custom_Fee_3?: string;

  
  // Admin
  CA_Client_Ext_Id?: string;
  CA_PO?: string;
  CA_Billing_ID?: string;
}

// Props pour le drawer de formulaire
export interface CampaignDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  onSave: (campaign: CampaignFormData, additionalBreakdowns?: BreakdownFormData[]) => void;
}