// app/types/breakdown.ts

export type BreakdownType = 'Mensuel' | 'Hebdomadaire' | 'Custom';

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
}

export interface BreakdownFormData {
  name: string;
  type: BreakdownType;
  startDate: string;
  endDate: string;
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

// Constantes pour les types de breakdown
export const BREAKDOWN_TYPES: { value: BreakdownType; label: string }[] = [
  { value: 'Hebdomadaire', label: 'Hebdomadaire' },
  { value: 'Mensuel', label: 'Mensuel' },
  { value: 'Custom', label: 'Personnalisé' },
];

// Nom du breakdown par défaut
export const DEFAULT_BREAKDOWN_NAME = 'Calendrier';