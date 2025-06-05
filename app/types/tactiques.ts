// app/types/tactiques.ts

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
  TC_Status?: 'Planned' | 'Active' | 'Completed' | 'Cancelled'; // Statut de la tactique
  
  // Champs Info
  TC_Bucket?: string; // Référence à l'enveloppe budgétaire
  
  // Champs Stratégie - Section principale
  TC_LoB?: string; // Ligne d'affaire
  TC_Media_Type?: string; // Type média
  TC_Publisher?: string; // Partenaire
  TC_Inventory?: string; // Inventaire
  TC_Product_Open?: string; // Description du produit
  TC_Targeting_Open?: string; // Description de l'audience
  TC_Market_Open?: string; // Description du marché
  TC_Frequence?: string; // Fréquence
  TC_Location?: string; // Description de l'emplacement
  TC_Market?: string; // Marché (liste dynamique)
  TC_Language?: string; // Langue
  TC_Format_Open?: string; // Description du format
  
  // Champs Stratégie - Champs personnalisés
  TC_Buying_Method?: string; // Méthode d'achat
  TC_Custom_Dim_1?: string; // Dimension personnalisée 1
  TC_Custom_Dim_2?: string; // Dimension personnalisée 2
  TC_Custom_Dim_3?: string; // Dimension personnalisée 3
  
  // Champs Stratégie - Production
  TC_NumberCreatives?: string; // Nombre de créatifs suggérés
  TC_AssetDate?: string; // Date de livraison des créatifs
  
  // Champs KPI
  TC_Media_Objective?: string; // Objectif média
  
  // KPIs multiples (jusqu'à 5)
  TC_Kpi?: string; // KPI principal
  TC_Kpi_CostPer?: number; // Coût par principal
  TC_Kpi_Volume?: number; // Volume principal
  TC_Kpi_2?: string; // KPI 2
  TC_Kpi_CostPer_2?: number; // Coût par 2
  TC_Kpi_Volume_2?: number; // Volume 2
  TC_Kpi_3?: string; // KPI 3
  TC_Kpi_CostPer_3?: number; // Coût par 3
  TC_Kpi_Volume_3?: number; // Volume 3
  TC_Kpi_4?: string; // KPI 4
  TC_Kpi_CostPer_4?: number; // Coût par 4
  TC_Kpi_Volume_4?: number; // Volume 4
  TC_Kpi_5?: string; // KPI 5
  TC_Kpi_CostPer_5?: number; // Coût par 5
  TC_Kpi_Volume_5?: number; // Volume 5
  
  // Champs Admin
  TC_Billing_ID?: string; // Numéro de facturation
  TC_PO?: string; // PO
  
  // Champs legacy (à conserver pour compatibilité)
  TC_Placement?: string; // Placement média
  TC_Format?: string; // Format utilisé
  TC_StartDate?: string; // Date de début
  TC_EndDate?: string; // Date de fin

  // Nouveaux champs Budget
TC_Currency?: string;           // Devise d'achat (CAD, USD, EUR...)
TC_Unit_Type?: string;          // Type d'unité (CPM, CPC, etc.)
TC_Budget_Mode?: 'client' | 'media';  // Mode de saisie
TC_Cost_Per_Unit?: number;      // Coût par unité
TC_Unit_Volume?: number;        // Volume d'unité
TC_Has_Bonus?: boolean;         // Inclut bonification
TC_Real_Value?: number;         // Valeur réelle payée
TC_Bonus_Value?: number;        // Bonification calculée
}

export interface Placement {
  id: string;
  PL_Label: string;
  PL_Format?: string;
  PL_Budget: number;
  PL_Order: number;
  PL_TactiqueId: string; // Référence à la tactique parente
  
  // Nouveaux champs de taxonomie
  PL_Taxonomy_Tags?: string; // Taxonomie pour les tags
  PL_Taxonomy_Platform?: string; // Taxonomie pour la plateforme
  PL_Taxonomy_MediaOcean?: string; // Taxonomie pour MediaOcean
  
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
  TC_Status?: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  
  // Champs Info
  TC_Bucket?: string;
  
  // Champs Stratégie - Section principale
  TC_LoB?: string;
  TC_Media_Type?: string;
  TC_Publisher?: string;
  TC_Inventory?: string;
  TC_Product_Open?: string;
  TC_Targeting_Open?: string;
  TC_Market_Open?: string;
  TC_Frequence?: string;
  TC_Location?: string;
  TC_Market?: string;
  TC_Language?: string;
  TC_Format_Open?: string;
  
  // Champs Stratégie - Champs personnalisés
  TC_Buying_Method?: string;
  TC_Custom_Dim_1?: string;
  TC_Custom_Dim_2?: string;
  TC_Custom_Dim_3?: string;
  
  // Champs Stratégie - Production
  TC_NumberCreatives?: string;
  TC_AssetDate?: string;
  
  // Champs KPI
  TC_Media_Objective?: string;
  
  // KPIs multiples (jusqu'à 5)
  TC_Kpi?: string;
  TC_Kpi_CostPer?: number;
  TC_Kpi_Volume?: number;
  TC_Kpi_2?: string;
  TC_Kpi_CostPer_2?: number;
  TC_Kpi_Volume_2?: number;
  TC_Kpi_3?: string;
  TC_Kpi_CostPer_3?: number;
  TC_Kpi_Volume_3?: number;
  TC_Kpi_4?: string;
  TC_Kpi_CostPer_4?: number;
  TC_Kpi_Volume_4?: number;
  TC_Kpi_5?: string;
  TC_Kpi_CostPer_5?: number;
  TC_Kpi_Volume_5?: number;
  
  // Champs Admin
  TC_Billing_ID?: string;
  TC_PO?: string;
  
  // Champs legacy (à conserver pour compatibilité)
  TC_Placement?: string;
  TC_Format?: string;
  TC_StartDate?: string;
  TC_EndDate?: string;
}

export interface PlacementFormData {
  PL_Label: string;
  PL_Format?: string;
  PL_Budget: number;
  PL_Order: number;
  PL_TactiqueId: string;
  
  // Nouveaux champs de taxonomie
  PL_Taxonomy_Tags?: string; // Taxonomie pour les tags
  PL_Taxonomy_Platform?: string; // Taxonomie pour la plateforme
  PL_Taxonomy_MediaOcean?: string; // Taxonomie pour MediaOcean
}

export interface CreatifFormData {
  CR_Label: string;
  CR_URL?: string;
  CR_Order: number;
  CR_PlacementId: string;
}