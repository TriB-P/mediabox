// Types pour les frais clients

export type CalculationType = "Volume d'unité" | "Frais fixe" | "Pourcentage budget" | "Unités";

export interface Fee {
  id: string;
  FE_Calculation_Type: CalculationType;
  FE_Name: string;
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
  FE_Name: string;
}

export interface FeeOptionFormData {
  FO_Buffer: number;
  FO_Editable: boolean;
  FO_Option: string;
  FO_Value: number;
}