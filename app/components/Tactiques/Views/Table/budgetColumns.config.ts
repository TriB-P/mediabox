// app/components/Tactiques/Views/Table/budgetColumns.config.ts

/**
 * Configuration spécialisée pour les colonnes budget
 * CORRIGÉ : Headers dynamiques basés sur les vrais noms des frais
 * CORRIGÉ : Fonctions utilitaires pour filtrer par type de ligne
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
 * Interface pour les frais client (pour typage)
 */
export interface ClientFee {
  id: string;
  FE_Name: string;
  FE_Calculation_Type: 'Pourcentage budget' | 'Volume d\'unité' | 'Unités' | 'Frais fixe';
  FE_Calculation_Mode: 'Directement sur le budget média' | 'Applicable sur les frais précédents';
  FE_Order: number;
  options: {
    id: string;
    FO_Option: string;
    FO_Value: number;
    FO_Buffer: number;
    FO_Editable: boolean;
  }[];
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
 * CORRIGÉ : Fonction pour créer les colonnes de frais avec des noms dynamiques
 */
export function createFeeColumns(clientFees: ClientFee[]): FeeColumnDefinition[] {
  const feeColumns: FeeColumnDefinition[] = [];
  
  // Créer jusqu'à 5 colonnes de frais basées sur les frais disponibles
  for (let i = 1; i <= 5; i++) {
    const associatedFee = clientFees.find(fee => fee.FE_Order === i);
    const feeLabel = associatedFee ? associatedFee.FE_Name : `Frais ${i}`;
    
    // NOUVEAU : Seulement créer la colonne si le frais existe
    if (associatedFee) {
      feeColumns.push({
        key: `TC_Fee_${i}`,
        label: feeLabel, // CORRIGÉ : Utiliser le vrai nom du frais
        type: 'fee-composite',
        width: 280,
        feeNumber: i,
        subColumns: {
          enabled: true,
          option: true, 
          customValue: true,
          calculatedAmount: true
        }
      });
    }
  }
  
  return feeColumns;
}

/**
 * Configuration des colonnes de totaux calculés
 */
export const BUDGET_TOTAL_COLUMNS: DynamicColumn[] = [
  {
    key: 'TC_Total_Fees',
    label: 'Total frais',
    type: 'readonly',
    width: 120
  },
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
 * CORRIGÉ : Fonction pour créer la configuration complète des colonnes budget
 * avec des noms de frais dynamiques
 */
export function createBudgetColumnsComplete(clientFees: ClientFee[]): (DynamicColumn | FeeColumnDefinition)[] {
  const feeColumns = createFeeColumns(clientFees);
  
  return [
    ...BUDGET_BASE_COLUMNS,
    ...feeColumns,
    ...BUDGET_TOTAL_COLUMNS
  ];
}

/**
 * NOUVEAU : Fonction pour vérifier si une ligne doit afficher les colonnes budget
 */
export function shouldShowBudgetColumns(rowType: string): boolean {
  return rowType === 'tactique';
}

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
    'TC_Media_Value', // Valeur réelle pour bonification
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
    'TC_Total_Fees',
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
  if (fieldKey.includes('Budget') || fieldKey.includes('Price') || fieldKey.includes('Value') || 
      fieldKey.includes('Fees') || fieldKey === 'TC_Bonification') {
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