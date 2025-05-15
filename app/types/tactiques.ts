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