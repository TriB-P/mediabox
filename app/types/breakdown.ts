// app/types/breakdown.ts
/**
 * Types améliorés pour les breakdowns avec:
 * - Support des champs date et name pour les périodes
 * - Distinction entre types automatiques et custom
 * - Support du sous-type pour les breakdowns mensuels
 * - CORRIGÉ: Support multilingue avec minuscules ('fr' | 'en')
 */
export type BreakdownType = 'Mensuel' | 'Hebdomadaire' | 'Custom' | 'PEBs';

/**
 * NOUVEAU: Type pour le sous-type des breakdowns mensuels
 */
export type BreakdownSubType = 'Planned' | 'Actual' | 'Billed' | 'Other';

/**
 * MODIFIÉ: Structure améliorée pour une période personnalisée
 */
export interface CustomPeriod {
  id: string;
  name: string; // Ex: "Q1", "Phase 1", "Sprint 1" - utilisé seulement pour Custom
  order: number;
  date?: string; // NOUVEAU: Date de début (YYYY-MM-DD) - utilisé pour types automatiques
}

/**
 * MODIFIÉ: Interface principale pour un breakdown avec support du sous-type
 */
export interface Breakdown {
  id: string;
  name: string;
  type: BreakdownType;
  subType?: BreakdownSubType; // NOUVEAU: Sous-type pour les breakdowns mensuels
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  isDefault: boolean; // True pour le breakdown "Calendrier" non supprimable
  order: number;
  createdAt: string; // Format ISO string
  updatedAt: string; // Format ISO string

  // Périodes personnalisées pour le type Custom
  customPeriods?: CustomPeriod[]; // Utilisé uniquement si type === 'Custom'
}

/**
 * MODIFIÉ: Interface pour les données de formulaire avec support du sous-type
 */
export interface BreakdownFormData {
  name: string;
  type: BreakdownType;
  subType?: BreakdownSubType; // NOUVEAU: Sous-type pour les breakdowns mensuels
  startDate: string;
  endDate: string;

  // Périodes personnalisées pour le type Custom
  customPeriods?: Omit<CustomPeriod, 'id'>[]; // Sans l'ID lors de la création

  // Flag pour identifier le breakdown par défaut lors de la création
  isDefault?: boolean;
}

/**
 * MODIFIÉ: Interface pour les données de formulaire lors de l'édition d'une période personnalisée
 */
export interface CustomPeriodFormData {
  name: string;
  order: number;
  date?: string; // NOUVEAU: Date de début pour maintenir la cohérence
}

/**
 * Propriétés attendues par le composant BreakdownDrawer
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
 * Résultat de la validation des dates
 */
export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Résultat de la validation spécifique pour les périodes personnalisées
 */
export interface CustomPeriodValidationResult {
  isValid: boolean;
  errors: {
    [periodIndex: number]: string;
  }; // Index de la période -> message d'erreur
  globalError?: string; // Erreur générale (ex: chevauchement)
}

// ============================================================================
// NOUVELLES INTERFACES POUR LA STRUCTURE DE DONNÉES AMÉLIORÉE
// ============================================================================

/**
 * NOUVEAU: Structure complète d'une période de breakdown sur une tactique
 */
export interface EnhancedTactiqueBreakdownPeriod {
  value: string;        // Volume d'unité pour PEBs, valeur unique pour autres types
  isToggled: boolean;
  order: number;
  unitCost?: string;    // Coût par unité (PEBs uniquement)
  total?: string;       // Total calculé (PEBs uniquement)
  date?: string;        // NOUVEAU: Date de début de la période (YYYY-MM-DD) pour types automatiques
  name?: string;        // NOUVEAU: Nom de la période (custom uniquement)
}

/**
 * NOUVEAU: Structure complète des breakdowns sur une tactique
 */
export interface EnhancedTactiqueBreakdownData {
  [breakdownId: string]: {
    periods: {
      [periodId: string]: EnhancedTactiqueBreakdownPeriod;
    };
  };
}

/**
 * NOUVEAU: Métadonnées pour une période générée
 */
export interface GeneratedPeriodMeta {
  id: string;           // ID unique généré
  date?: string;        // Date de début pour types automatiques
  name?: string;        // Nom pour type custom
  order: number;        // Ordre de la période
  label?: string;       // Label à afficher (calculé côté client)
}

// ============================================================================
// CONSTANTES AMÉLIORÉES
// ============================================================================

// Constantes pour les types de breakdown
export const BREAKDOWN_TYPES: { value: BreakdownType; label: string }[] = [
  { value: 'Hebdomadaire', label: 'Hebdomadaire' },
  { value: 'Mensuel', label: 'Mensuel' },
  { value: 'PEBs', label: 'PEBs' },
  { value: 'Custom', label: 'Personnalisé' },
];

// NOUVEAU: Constantes pour les sous-types de breakdown mensuels
export const BREAKDOWN_SUB_TYPES: { value: BreakdownSubType; label: string }[] = [
  { value: 'Planned', label: 'Planned' }, // Sera traduit dans l'interface
  { value: 'Actual', label: 'Actual' },
  { value: 'Billed', label: 'Billed' },
  { value: 'Other', label: 'Other' },
];

// NOUVEAU: Sous-type par défaut pour les breakdowns mensuels
export const DEFAULT_BREAKDOWN_SUB_TYPE: BreakdownSubType = 'Planned';

// Nom du breakdown par défaut (utilisé comme fallback)
export const DEFAULT_BREAKDOWN_NAME = 'Calendrier';

// NOUVEAU: Limite de breakdowns par campagne
export const MAX_BREAKDOWNS_PER_CAMPAIGN = 5;

// ============================================================================
// FONCTIONS UTILITAIRES AMÉLIORÉES
// ============================================================================

/**
 * CORRIGÉ: Retourne le nom du breakdown par défaut selon la langue
 * @param language - Langue souhaitée ('fr' ou 'en') - minuscules pour correspondre au LanguageContext
 * @returns Le nom traduit du breakdown par défaut
 */
export const getDefaultBreakdownName = (language?: 'fr' | 'en'): string => {
  if (language === 'en') {
    return 'Calendar';
  }
  return 'Calendrier'; // 'fr' par défaut
};

/**
 * Crée un objet CustomPeriodFormData vide avec un ordre donné
 */
export const createEmptyCustomPeriod = (order: number = 0): CustomPeriodFormData => ({
  name: '',
  order,
});

/**
 * Valide un tableau de périodes personnalisées
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

/**
 * NOUVEAU: Détermine si un type de breakdown utilise des dates automatiques
 */
export const isAutomaticDateType = (type: BreakdownType): boolean => {
  return ['Hebdomadaire', 'Mensuel', 'PEBs'].includes(type);
};

/**
 * NOUVEAU: Détermine si un type de breakdown utilise des noms personnalisés
 */
export const isCustomNameType = (type: BreakdownType): boolean => {
  return type === 'Custom';
};

/**
 * NOUVEAU: Détermine si un type de breakdown supporte les sous-types
 */
export const supportsSubType = (type: BreakdownType): boolean => {
  return type === 'Mensuel';
};

/**
 * NOUVEAU: Génère un label d'affichage pour une période selon son type
 */
export const generatePeriodLabel = (
  period: GeneratedPeriodMeta,
  breakdownType: BreakdownType,
  monthNames?: string[]
): string => {
  if (breakdownType === 'Custom') {
    return period.name || `Période ${period.order + 1}`;
  }

  if (!period.date) {
    return `Période ${period.order + 1}`;
  }

  const date = new Date(period.date);
  
  if (breakdownType === 'Mensuel') {
    const defaultMonths = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                          'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const months = monthNames || defaultMonths;
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    return `${month} ${year}`;
  } else {
    // Hebdomadaire, PEBs
    const defaultMonths = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                          'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const months = monthNames || defaultMonths;
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  }
};

/**
 * NOUVEAU: Obtient le label traduit d'un sous-type de breakdown
 * Cette fonction sera utilisée pour l'affichage dans l'interface
 */
export const getBreakdownSubTypeLabel = (subType: BreakdownSubType, t?: (key: string) => string): string => {
  if (!t) {
    // Fallback sans traduction
    switch (subType) {
      case 'Planned':
        return 'Planifié';
      case 'Actual':
        return 'Actuel';
      case 'Billed':
        return 'Facturé';
      case 'Other':
        return 'Autre';
      default:
        return subType;
    }
  }

  // Avec système de traduction
  switch (subType) {
    case 'Planned':
      return t('campaigns.formBreakdown.subTypes.planned');
    case 'Actual':
      return t('campaigns.formBreakdown.subTypes.actual');
    case 'Billed':
      return t('campaigns.formBreakdown.subTypes.billed');
    case 'Other':
      return t('campaigns.formBreakdown.subTypes.other');
    default:
      return subType;
  }
};