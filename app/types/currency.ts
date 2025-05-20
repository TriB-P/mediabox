// Types pour les devises

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
  
  // Liste des devises couramment utilisées
  export const CURRENCIES = [
    "CAD", // Dollar canadien
    "USD", // Dollar américain
    "EUR", // Euro
    "GBP", // Livre sterling
    "JPY", // Yen japonais
    "AUD", // Dollar australien
    "CHF", // Franc suisse
    "CNY", // Yuan chinois
    "MXN", // Peso mexicain
  ];