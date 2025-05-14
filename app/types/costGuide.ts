// Types pour le module de guide de coûts

export interface CostGuide {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export type PurchaseUnit = 'PEB' | 'CPM' | 'Unitaire';
  
  export interface CostGuideEntry {
    id: string;
    guideId: string;
    partnerId: string;
    partnerName: string; // Nom du partenaire (pour faciliter l'affichage)
    level1: string;
    level2: string;
    level3: string;
    purchaseUnit: PurchaseUnit;
    unitPrice: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CostGuideFormData {
    name: string;
    description: string;
  }
  
  export interface CostGuideEntryFormData {
    partnerId: string;
    level1: string;
    level2: string;
    level3: string;
    purchaseUnit: PurchaseUnit;
    unitPrice: number | string; // String pour le formulaire, converti en number après
    comment: string;
  }