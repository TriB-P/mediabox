// Types pour les frais clients

export type CalculationType = "Volume d'unité" | "Frais fixe" | "Pourcentage budget" | "Unités";

export type CalculationMode = "Directement sur le budget média" | "Applicable sur les frais précédents";

export interface Fee {
  id: string;
  FE_Calculation_Type: CalculationType;
  FE_Calculation_Mode: CalculationMode;
  FE_Name: string;
  FE_Order: number; // Nouvel champ pour l'ordre
  createdAt: string;
  updatedAt: string;
}

export interface FeeOption {
  id: string;
  FO_Buffer: number; // Pourcentage par bond de 5%
  FO_Editable: boolean;
  FO_Option: string;
  FO_Value: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeeFormData {
  FE_Calculation_Type: CalculationType;
  FE_Calculation_Mode: CalculationMode;
  FE_Name: string;
}

export interface FeeOptionFormData {
  FO_Buffer: number;
  FO_Editable: boolean;
  FO_Option: string;
  FO_Value: number;
}