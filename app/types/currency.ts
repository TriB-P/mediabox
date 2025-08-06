/**
 * Ce fichier définit les types TypeScript pour la gestion des devises
 * ainsi qu'une liste des devises couramment utilisées.
 * Il aide à structurer les données des taux de change.
 */
export interface Currency {
  id: string;
  CU_Rate: number;
  CU_Year: string;
  CU_From: string;
  CU_To: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyFormData {
  CU_Rate: number;
  CU_Year: string;
  CU_From: string;
  CU_To: string;
}

/**
 * Liste des codes des devises les plus courantes.
 * Cette liste peut être utilisée pour des sélecteurs ou des validations de devises.
 */
export const CURRENCIES = [
  "CAD",
  "USD",
  "EUR",
  "CHF"
];