// app/components/Tactiques/Views/Table/budgetColumns.config.ts

/**
 * Configuration simplifiée pour les colonnes budget
 * SUPPRIME toute logique de calcul (maintenant dans budgetService)
 * GARDE uniquement la configuration des colonnes
 */

import { DynamicColumn } from './TactiquesAdvancedTableView';
import { ClientFee as BudgetClientFee } from '../../../../lib/budgetService';

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
  { id: 'CHF', label: 'CHF' },
];

/**
 * Type spécialisé pour les colonnes de frais composites
 */
export interface FeeColumnDefinition extends Omit<DynamicColumn, 'type'> {
  type: 'fee-composite';
  feeNumber: number; // FE_Order du frais
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
    key: 'TC_Budget_Mode',
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
 * SIMPLIFIÉ : Création des colonnes de frais sans logique de calcul
 */
export function createFeeColumns(clientFees: BudgetClientFee[]): FeeColumnDefinition[] {
  const feeColumns: FeeColumnDefinition[] = [];
  
  // Trier les frais par leur FE_Order et créer une colonne pour chaque frais existant
  const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
  
  sortedFees.forEach((fee) => {
    feeColumns.push({
      key: `TC_Fee_${fee.FE_Order}`,
      label: fee.FE_Name,
      type: 'fee-composite',
      width: 280,
      feeNumber: fee.FE_Order, // Utilise le FE_Order original
      subColumns: {
        enabled: true,
        option: true, 
        customValue: true,
        calculatedAmount: true
      }
    });
  });
  
  console.log(`[BUDGET COLONNES] ✅ ${feeColumns.length} colonnes de frais créées :`, 
    sortedFees.map(fee => `${fee.FE_Name} (TC_Fee_${fee.FE_Order})`));
  
  return feeColumns;
}

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
 * SIMPLIFIÉ : Fonction pour créer la configuration complète des colonnes budget
 */
export function createBudgetColumnsComplete(clientFees: BudgetClientFee[]): (DynamicColumn | FeeColumnDefinition)[] {
  const feeColumns = createFeeColumns(clientFees);
  
  return [
    ...BUDGET_BASE_COLUMNS,
    ...feeColumns,
    ...BUDGET_TOTAL_COLUMNS
  ];
}

/**
 * Fonction pour vérifier si une ligne doit afficher les colonnes budget
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
 * SIMPLIFIÉ : Fonction utilitaire pour récupérer les champs liés à un frais
 * (garde seulement les noms des champs, sans logique de calcul)
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
 * NOUVEAU : Liste des champs budget qui déclenchent des recalculs
 * (utilisé par DynamicTableStructure, remplace shouldTriggerBudgetRecalculation)
 */
export const BUDGET_TRIGGER_FIELDS = [
  'TC_Unit_Type',
  'TC_BuyCurrency', 
  'TC_Budget_Mode',
  'TC_BudgetInput',
  'TC_Unit_Price',
  'TC_Media_Value', // Valeur réelle pour bonification
  // Frais
  'TC_Fee_1_Option', 'TC_Fee_1_Volume',
  'TC_Fee_2_Option', 'TC_Fee_2_Volume', 
  'TC_Fee_3_Option', 'TC_Fee_3_Volume',
  'TC_Fee_4_Option', 'TC_Fee_4_Volume',
  'TC_Fee_5_Option', 'TC_Fee_5_Volume'
];

/**
 * NOUVEAU : Liste des champs calculés automatiquement (readonly)
 * (utilisé par DynamicTableStructure, remplace getCalculatedBudgetFields)
 */
export const BUDGET_CALCULATED_FIELDS = [
  'TC_Unit_Volume',
  'TC_Media_Budget', 
  'TC_Client_Budget',
  'TC_Bonification',
  'TC_Total_Fees',
  'TC_Currency_Rate',
  'TC_Delta',
  'TC_Fee_1_Value',
  'TC_Fee_2_Value',
  'TC_Fee_3_Value', 
  'TC_Fee_4_Value',
  'TC_Fee_5_Value'
];

/**
 * NOUVEAU : Fonction helper pour vérifier si un champ déclenche un recalcul
 */
export function shouldTriggerRecalculation(fieldKey: string): boolean {
  return BUDGET_TRIGGER_FIELDS.includes(fieldKey);
}

/**
 * NOUVEAU : Fonction helper pour vérifier si un champ est calculé automatiquement
 */
export function isCalculatedField(fieldKey: string): boolean {
  return BUDGET_CALCULATED_FIELDS.includes(fieldKey);
}

/**
 * SUPPRIMÉ : calculateFeesAmounts (maintenant dans budgetService)
 * SUPPRIMÉ : shouldTriggerBudgetRecalculation (remplacé par shouldTriggerRecalculation)
 * SUPPRIMÉ : getCalculatedBudgetFields (remplacé par BUDGET_CALCULATED_FIELDS)
 * SUPPRIMÉ : formatBudgetDisplayValue (formatage maintenant dans les composants réactifs)
 */