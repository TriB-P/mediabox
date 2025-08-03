// app/types/breakdown.ts
/**
 * Ce fichier définit les types de données et les interfaces utilisés pour gérer les "breakdowns"
 * dans l'application. Un breakdown représente une manière de découper une période de temps
 * (par exemple, mensuellement, hebdomadairement, avec des périodes personnalisées ou PEBs).
 * Il inclut également des utilitaires pour la validation des périodes personnalisées.
 * NOUVEAU: Support du type PEBs (Périodes d'Estimation par Blocs)
 * NOUVEAU: Support des dates de début pour toutes les périodes
 */
export type BreakdownType = 'Mensuel' | 'Hebdomadaire' | 'Custom' | 'PEBs';

/**
 * Structure pour une période personnalisée utilisée dans un breakdown de type 'Custom'.
 * NOUVEAU: Support du champ startDate pour toutes les périodes
 */
export interface CustomPeriod {
  id: string;
  name: string; // Ex: "Q1", "Phase 1", "Sprint 1"
  order: number;
  startDate?: Date; // NOUVEAU: Date de début de la période (calculée automatiquement pour non-Custom)
}

/**
 * Interface principale pour un breakdown, définissant ses propriétés.
 */
export interface Breakdown {
  id: string;
  name: string;
  type: BreakdownType;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  isDefault: boolean; // True pour le breakdown "Calendrier" non supprimable
  order: number;
  createdAt: string; // Format ISO string
  updatedAt: string; // Format ISO string

  // Nouveau : périodes personnalisées pour le type Custom
  customPeriods?: CustomPeriod[]; // Utilisé uniquement si type === 'Custom'
}

/**
 * Interface pour les données de formulaire lors de la création ou de la mise à jour d'un breakdown.
 */
export interface BreakdownFormData {
  name: string;
  type: BreakdownType;
  startDate: string;
  endDate: string;

  // Nouveau : périodes personnalisées pour le type Custom
  customPeriods?: Omit<CustomPeriod, 'id'>[]; // Sans l'ID lors de la création

  // Nouveau : flag pour identifier le breakdown par défaut lors de la création
  isDefault?: boolean;
}

/**
 * Interface pour les données de formulaire lors de l'édition d'une période personnalisée.
 * NOUVEAU: Support du champ startDate
 */
export interface CustomPeriodFormData {
  name: string;
  order: number;
  startDate?: Date; // NOUVEAU: Date de début (pour maintenir la cohérence)
}

/**
 * Propriétés attendues par le composant BreakdownDrawer.
 */
export interface BreakdownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown?: Breakdown | null;
  campaignStartDate: string;
  campaignEndDate: string;
  onSave: (breakdownData: BreakdownFormData) => Promise<void>;
}

/**
 * Résultat de la validation des dates.
 */
export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Résultat de la validation spécifique pour les périodes personnalisées.
 */
export interface CustomPeriodValidationResult {
  isValid: boolean;
  errors: {
    [periodIndex: number]: string;
  }; // Index de la période -> message d'erreur
  globalError?: string; // Erreur générale (ex: chevauchement)
}

// Constantes pour les types de breakdown
export const BREAKDOWN_TYPES: { value: BreakdownType; label: string }[] = [
  { value: 'Hebdomadaire', label: 'Hebdomadaire' },
  { value: 'Mensuel', label: 'Mensuel' },
  { value: 'PEBs', label: 'PEBs' },
  { value: 'Custom', label: 'Personnalisé' },
];

// Nom du breakdown par défaut
export const DEFAULT_BREAKDOWN_NAME = 'Calendrier';

/**
 * Crée un objet CustomPeriodFormData vide avec un ordre donné.
 * @param order L'ordre initial de la période.
 * @returns Un objet CustomPeriodFormData vide.
 */
export const createEmptyCustomPeriod = (order: number = 0): CustomPeriodFormData => ({
  name: '',
  order,
});

/**
 * Valide un tableau de périodes personnalisées.
 * Vérifie si les noms sont présents et uniques.
 * @param periods Le tableau de périodes personnalisées à valider.
 * @returns Un objet CustomPeriodValidationResult indiquant la validité et les erreurs.
 */
export const validateCustomPeriods = (
  periods: CustomPeriodFormData[],
): CustomPeriodValidationResult => {
  const result: CustomPeriodValidationResult = {
    isValid: true,
    errors: {},
  };

  if (periods.length === 0) {
    result.isValid = false;
    result.globalError = 'Au moins une période doit être définie pour un breakdown personnalisé';
    return result;
  }

  periods.forEach((period, index) => {
    if (!period.name.trim()) {
      result.errors[index] = 'Le nom de la période est obligatoire';
      result.isValid = false;
    }
  });

  const names = periods.map((p) => p.name.toLowerCase().trim()).filter(Boolean);
  const uniqueNames = new Set(names);

  if (names.length !== uniqueNames.size) {
    result.isValid = false;
    result.globalError = 'Les noms de périodes doivent être uniques';
  }

  return result;
};