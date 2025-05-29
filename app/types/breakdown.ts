// app/types/breakdown.ts

export type BreakdownType = 'Mensuel' | 'Hebdomadaire' | 'Custom';

// Structure pour une période personnalisée en mode Custom
export interface CustomPeriod {
  id: string;
  name: string; // Ex: "Q1", "Phase 1", "Sprint 1"
  order: number;
}

export interface Breakdown {
  id: string;
  name: string;
  type: BreakdownType;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string;   // Format: YYYY-MM-DD
  isDefault: boolean; // True pour le breakdown "Calendrier" non supprimable
  order: number;
  createdAt: string; // Format ISO string
  updatedAt: string; // Format ISO string
  
  // Nouveau : périodes personnalisées pour le type Custom
  customPeriods?: CustomPeriod[]; // Utilisé uniquement si type === 'Custom'
}

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

// Structure pour éditer une période personnalisée
export interface CustomPeriodFormData {
  name: string;
  order: number;
}

export interface BreakdownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown?: Breakdown | null;
  campaignStartDate: string;
  campaignEndDate: string;
  onSave: (breakdownData: BreakdownFormData) => Promise<void>;
}

// Utilitaires pour les validations de dates
export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

// Validation spécifique pour les périodes personnalisées
export interface CustomPeriodValidationResult {
  isValid: boolean;
  errors: { [periodIndex: number]: string }; // Index de la période -> message d'erreur
  globalError?: string; // Erreur générale (ex: chevauchement)
}

// Constantes pour les types de breakdown
export const BREAKDOWN_TYPES: { value: BreakdownType; label: string }[] = [
  { value: 'Hebdomadaire', label: 'Hebdomadaire' },
  { value: 'Mensuel', label: 'Mensuel' },
  { value: 'Custom', label: 'Personnalisé' },
];

// Nom du breakdown par défaut
export const DEFAULT_BREAKDOWN_NAME = 'Calendrier';

// Utilitaires pour les périodes personnalisées
export const createEmptyCustomPeriod = (order: number = 0): CustomPeriodFormData => ({
  name: '',
  order
});

// Validation des périodes personnalisées
export const validateCustomPeriods = (
  periods: CustomPeriodFormData[]
): CustomPeriodValidationResult => {
  const result: CustomPeriodValidationResult = {
    isValid: true,
    errors: {}
  };

  if (periods.length === 0) {
    result.isValid = false;
    result.globalError = 'Au moins une période doit être définie pour un breakdown personnalisé';
    return result;
  }

  // Valider chaque période individuellement
  periods.forEach((period, index) => {
    if (!period.name.trim()) {
      result.errors[index] = 'Le nom de la période est obligatoire';
      result.isValid = false;
    }
  });

  // Vérifier qu'il n'y a pas de doublons dans les noms
  const names = periods.map(p => p.name.toLowerCase().trim()).filter(Boolean);
  const uniqueNames = new Set(names);
  
  if (names.length !== uniqueNames.size) {
    result.isValid = false;
    result.globalError = 'Les noms de périodes doivent être uniques';
  }

  return result;
};