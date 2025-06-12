// Types pour les campagnes qui correspondent à votre structure Firestore
export interface Campaign {
  id: string;
  
  // Infos
  name: string;
  division?: string;
  status: 'Draft' | 'Cancelled' | 'Done' | 'Active' | 'Planned';
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Full Year';
  year: number;
  creativeFolder?: string;
  customDim1?: string;
  customDim2?: string;
  customDim3?: string;
  
  // Dates
  startDate: string; // Format: YYYY-MM-DD
  endDate: string;   // Format: YYYY-MM-DD
  sprintDates?: string;
  lastEdit?: string; // Format ISO string
  
  // Budget
  budget: number;
  currency?: string;
  customFee1?: number;
  customFee2?: number;
  customFee3?: number;
  customFee4?: number;
  customFee5?: number;
  
  // Admin
  clientId?: string;
  clientExtId?: string;
  po?: string;
  billingId?: string;
  
  // Métadonnées
  createdAt: string; // Format ISO string
  updatedAt: string; // Format ISO string
  officialVersionId?: string;
}

// Type pour le formulaire de création/édition
export interface CampaignFormData {
  // Infos
  name: string;
  division?: string;
  status: Campaign['status'];
  quarter: Campaign['quarter'];
  year: string; // String pour le formulaire, converti en number après
  creativeFolder?: string;
  customDim1?: string;
  customDim2?: string;
  customDim3?: string;
  
  // Dates
  startDate: string;
  endDate: string;
  sprintDates?: string;
  
  // Budget
  budget: string; // String pour le formulaire, converti en number après
  currency?: string;
  customFee1?: string;
  customFee2?: string;
  customFee3?: string;
  customFee4?: string;
  customFee5?: string;
  
  // Admin
  clientExtId?: string;
  po?: string;
  billingId?: string;
}

// Props pour le drawer de formulaire
export interface CampaignDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  onSave: (campaign: CampaignFormData) => void;
}