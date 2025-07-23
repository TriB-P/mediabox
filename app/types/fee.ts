/**
 * Ce fichier définit les types TypeScript utilisés pour la gestion des frais clients dans l'application.
 * Il inclut les interfaces pour la structure des frais (Fee), les options de frais (FeeOption),
 * et les données des formulaires associés (FeeFormData, FeeOptionFormData).
 */
export type CalculationType = "Volume d'unité" | "Frais fixe" | "Pourcentage budget" | "Unités";

export type CalculationMode = "Directement sur le budget média" | "Applicable sur les frais précédents";

/**
 * Définit la structure d'un objet de frais.
 * @param id - L'identifiant unique du frais.
 * @param FE_Calculation_Type - Le type de calcul du frais (par exemple, "Volume d'unité", "Frais fixe").
 * @param FE_Calculation_Mode - Le mode d'application du calcul (par exemple, "Directement sur le budget média").
 * @param FE_Name - Le nom du frais.
 * @param FE_Order - L'ordre d'affichage du frais.
 * @param createdAt - La date de création du frais.
 * @param updatedAt - La date de dernière mise à jour du frais.
 */
export interface Fee {
  id: string;
  FE_Calculation_Type: CalculationType;
  FE_Calculation_Mode: CalculationMode;
  FE_Name: string;
  FE_Order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Définit la structure d'une option de frais.
 * @param id - L'identifiant unique de l'option de frais.
 * @param FO_Buffer - Le pourcentage de tampon pour l'option, par bonds de 5%.
 * @param FO_Editable - Indique si l'option est éditable.
 * @param FO_Option - Le nom de l'option.
 * @param FO_Value - La valeur de l'option.
 * @param createdAt - La date de création de l'option.
 * @param updatedAt - La date de dernière mise à jour de l'option.
 */
export interface FeeOption {
  id: string;
  FO_Buffer: number;
  FO_Editable: boolean;
  FO_Option: string;
  FO_Value: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Définit la structure des données pour le formulaire de création ou de modification d'un frais.
 * @param FE_Calculation_Type - Le type de calcul sélectionné pour le formulaire.
 * @param FE_Calculation_Mode - Le mode de calcul sélectionné pour le formulaire.
 * @param FE_Name - Le nom du frais entré dans le formulaire.
 */
export interface FeeFormData {
  FE_Calculation_Type: CalculationType;
  FE_Calculation_Mode: CalculationMode;
  FE_Name: string;
}

/**
 * Définit la structure des données pour le formulaire de création ou de modification d'une option de frais.
 * @param FO_Buffer - Le pourcentage de tampon entré dans le formulaire.
 * @param FO_Editable - L'état d'éditabilité sélectionné dans le formulaire.
 * @param FO_Option - Le nom de l'option entré dans le formulaire.
 * @param FO_Value - La valeur de l'option entrée dans le formulaire.
 */
export interface FeeOptionFormData {
  FO_Buffer: number;
  FO_Editable: boolean;
  FO_Option: string;
  FO_Value: number;
}