// app/components/Tactiques/Views/Table/budgetColumns.config.ts

/**
 * Configuration spécialisée pour les colonnes budget
 * Reproduit le comportement du drawer avec calculs automatiques
 * Colonnes larges sous-divisées pour les frais
 */

import { DynamicColumn } from './TactiquesAdvancedTableView';

/**
 * Options pour le mode de saisie budget
 */
export const BUDGET_MODE_OPTIONS = [
  { id: 'media', label: 'Budget média' },
  { id: 'client', label: 'Budget client' }
];

/**
 * Options pour les devises communes
 */
export const CURRENCY_OPTIONS = [
  { id: 'CAD', label: 'CAD ($)' },
  { id: 'USD', label: 'USD ($)' },
  { id: 'EUR', label: 'EUR (€)' },
  { id: 'GBP', label: 'GBP (£)' }
];

/**
 * Type spécialisé pour les colonnes de frais composites
 */
export interface FeeColumnDefinition extends Omit<DynamicColumn, 'type'> {
  type: 'fee-composite';
  feeNumber: number; // 1 à 5
  subColumns: {
    enabled: boolean;    // Checkbox pour activer/désactiver
    option: boolean;     // Menu déroulant des options
    customValue: boolean; // Champ valeur personnalisée
    calculatedAmount: boolean; // Montant calculé (readonly)
  };
}

/**
 * Configuration des colonnes budget principales
 */
export const BUDGET_BASE_COLUMNS: DynamicColumn[] = [
  {
    key: 'TC_Unit_Type',
    label: 'Type d\'unité',
    type: 'select',
    width: 140,
    options: [] // Sera peuplé dynamiquement
  },
  {
    key: 'TC_BuyCurrency', 
    label: 'Devise d\'achat',
    type: 'select',
    width: 120,
    options: CURRENCY_OPTIONS
  },
  {
    key: 'TC_BudgetChoice',
    label: 'Mode de saisie',
    type: 'select', 
    width: 130,
    options: BUDGET_MODE_OPTIONS
  },
  {
    key: 'TC_BudgetInput',
    label: 'Budget saisi',
    type: 'currency',
    width: 130
  },
  {
    key: 'TC_Unit_Price',
    label: 'Coût par unité',
    type: 'currency', 
    width: 120
  },
  {
    key: 'TC_Unit_Volume',
    label: 'Volume d\'unité',
    type: 'readonly',
    width: 110
  }
];

/**
 * Configuration des colonnes de frais composites
 */
export const BUDGET_FEE_COLUMNS: FeeColumnDefinition[] = [
  {
    key: 'TC_Fee_1',
    label: 'Frais 1',
    type: 'fee-composite',
    width: 280,
    feeNumber: 1,
    subColumns: {
      enabled: true,
      option: true, 
      customValue: true,
      calculatedAmount: true
    }
  },
  {
    key: 'TC_Fee_2',
    label: 'Frais 2', 
    type: 'fee-composite',
    width: 280,
    feeNumber: 2,
    subColumns: {
      enabled: true,
      option: true,
      customValue: true, 
      calculatedAmount: true
    }
  },
  {
    key: 'TC_Fee_3',
    label: 'Frais 3',
    type: 'fee-composite',
    width: 280, 
    feeNumber: 3,
    subColumns: {
      enabled: true,
      option: true,
      customValue: true,
      calculatedAmount: true
    }
  },
  {
    key: 'TC_Fee_4',
    label: 'Frais 4',
    type: 'fee-composite',
    width: 280,
    feeNumber: 4, 
    subColumns: {
      enabled: true,
      option: true,
      customValue: true,
      calculatedAmount: true
    }
  },
  {
    key: 'TC_Fee_5',
    label: 'Frais 5',
    type: 'fee-composite', 
    width: 280,
    feeNumber: 5,
    subColumns: {
      enabled: true,
      option: true,
      customValue: true,
      calculatedAmount: true
    }
  }
];

/**
 * Configuration des colonnes de totaux calculés
 */
export const BUDGET_TOTAL_COLUMNS: DynamicColumn[] = [
  {
    key: 'TC_Media_Budget',
    label: 'Total média',
    type: 'readonly',
    width: 120
  },
  {
    key: 'TC_Client_Budget', 
    label: 'Total client',
    type: 'readonly',
    width: 120
  }
];

/**
 * Configuration complète des colonnes budget
 * Combine toutes les colonnes dans l'ordre approprié
 */
export const TACTIQUE_BUDGET_COLUMNS_COMPLETE: (DynamicColumn | FeeColumnDefinition)[] = [
  ...BUDGET_BASE_COLUMNS,
  ...BUDGET_FEE_COLUMNS,
  ...BUDGET_TOTAL_COLUMNS
];

/**
 * Fonction utilitaire pour vérifier si une colonne est un frais composite
 */
export function isFeeCompositeColumn(column: DynamicColumn | FeeColumnDefinition): column is FeeColumnDefinition {
  return (column as FeeColumnDefinition).type === 'fee-composite';
}

/**
 * Fonction utilitaire pour récupérer les champs liés à un frais
 */
export function getFeeFieldKeys(feeNumber: number): {
  enabled: string;
  option: string; 
  customValue: string;
  calculatedAmount: string;
} {
  return {
    enabled: `TC_Fee_${feeNumber}_Enabled`,
    option: `TC_Fee_${feeNumber}_Option`,
    customValue: `TC_Fee_${feeNumber}_Volume`, 
    calculatedAmount: `TC_Fee_${feeNumber}_Value`
  };
}

/**
 * Fonction pour déterminer si un champ budget nécessite un recalcul
 */
export function shouldTriggerBudgetRecalculation(fieldKey: string): boolean {
  const triggerFields = [
    'TC_Unit_Type',
    'TC_BuyCurrency', 
    'TC_BudgetChoice',
    'TC_BudgetInput',
    'TC_Unit_Price',
    'TC_Media_Value', // Bonification
    // Frais
    'TC_Fee_1_Enabled', 'TC_Fee_1_Option', 'TC_Fee_1_Volume',
    'TC_Fee_2_Enabled', 'TC_Fee_2_Option', 'TC_Fee_2_Volume', 
    'TC_Fee_3_Enabled', 'TC_Fee_3_Option', 'TC_Fee_3_Volume',
    'TC_Fee_4_Enabled', 'TC_Fee_4_Option', 'TC_Fee_4_Volume',
    'TC_Fee_5_Enabled', 'TC_Fee_5_Option', 'TC_Fee_5_Volume'
  ];

  return triggerFields.includes(fieldKey);
}

/**
 * Fonction pour obtenir les champs calculés automatiquement
 */
export function getCalculatedBudgetFields(): string[] {
  return [
    'TC_Unit_Volume',
    'TC_Media_Budget', 
    'TC_Client_Budget',
    'TC_Bonification',
    'TC_Fee_1_Value',
    'TC_Fee_2_Value',
    'TC_Fee_3_Value', 
    'TC_Fee_4_Value',
    'TC_Fee_5_Value'
  ];
}

/**
 * Fonction pour formater les valeurs budget selon leur type
 */
export function formatBudgetDisplayValue(
  fieldKey: string, 
  value: any, 
  currency: string = 'CAD'
): string {
  if (value === null || value === undefined || value === '') return '';

  // Champs monétaires
  if (fieldKey.includes('Budget') || fieldKey.includes('Price') || fieldKey.includes('Value')) {
    const numValue = Number(value);
    if (isNaN(numValue)) return String(value);
    
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  }

  // Volume d'unités
  if (fieldKey === 'TC_Unit_Volume') {
    const numValue = Number(value);
    if (isNaN(numValue)) return String(value);
    
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  }

  // Valeurs par défaut
  return String(value);
}