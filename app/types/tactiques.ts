// Types pour le module de tactiques

export interface Section {
  id: string;
  SECTION_Name: string;
  SECTION_Order: number;
  SECTION_Color?: string;
  SECTION_Budget?: number; // Calculé à partir de la somme des budgets des tactiques
}

export interface Tactique {
  id: string;
  TC_Label: string;
  TC_Budget: number;
  TC_Order: number;
  TC_SectionId: string; // Référence à la section parente
  TC_Placement?: string; // Placement média
  TC_Format?: string; // Format utilisé
  TC_StartDate?: string; // Date de début
  TC_EndDate?: string; // Date de fin
  TC_Status?: 'Planned' | 'Active' | 'Completed' | 'Cancelled'; // Statut de la tactique
  
  // Nouveaux champs
  TC_Media_Type?: string;
  TC_Publisher?: string;
  TC_Buying_Method?: string;
  TC_Product_Open?: string;
  TC_Targeting_Open?: string;
  TC_Market_Open?: string;
  TC_Format_Open?: string;
  TC_Media_Objective?: string;
}

export interface Placement {
  id: string;
  PL_Label: string;
  PL_Format?: string;
  PL_Budget: number;
  PL_Order: number;
  PL_TactiqueId: string; // Référence à la tactique parente
  createdAt?: string;
  updatedAt?: string;
}

export interface Creatif {
  id: string;
  CR_Label: string;
  CR_URL?: string;
  CR_Order: number;
  CR_PlacementId: string; // Référence au placement parent
  createdAt?: string;
  updatedAt?: string;
}

export interface Onglet {
  id: string;
  ONGLET_Name: string;
  ONGLET_Order: number;
}

export interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

// Type pour les sections avec tactiques et état d'expansion
export interface SectionWithTactiques extends Section {
  tactiques: Tactique[];
  isExpanded: boolean;
}

// Type pour les tactiques avec placements
export interface TactiqueWithPlacements extends Tactique {
  placements: PlacementWithCreatifs[];
}

// Type pour les placements avec créatifs
export interface PlacementWithCreatifs extends Placement {
  creatifs: Creatif[];
}

// Types pour les formulaires
export interface TactiqueFormData {
  TC_Label: string;
  TC_Budget: number;
  TC_Order: number;
  TC_SectionId: string;
  TC_Placement?: string;
  TC_Format?: string;
  TC_StartDate?: string;
  TC_EndDate?: string;
  TC_Status?: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  
  // Nouveaux champs
  TC_Media_Type?: string;
  TC_Publisher?: string;
  TC_Buying_Method?: string;
  TC_Product_Open?: string;
  TC_Targeting_Open?: string;
  TC_Market_Open?: string;
  TC_Format_Open?: string;
  TC_Media_Objective?: string;
}

export interface PlacementFormData {
  PL_Label: string;
  PL_Format?: string;
  PL_Budget: number;
  PL_Order: number;
  PL_TactiqueId: string;
}

export interface CreatifFormData {
  CR_Label: string;
  CR_URL?: string;
  CR_Order: number;
  CR_PlacementId: string;
}