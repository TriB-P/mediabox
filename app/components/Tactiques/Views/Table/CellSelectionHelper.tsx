// app/components/Tactiques/Views/Table/CellSelectionHelper.tsx

/**
 * Helper pour la gestion de la sélection de cellules et validation
 * Fonctionnalités similaires à Timeline mais adaptées au tableau dynamique
 * Gère la validation des données collées selon le type de colonne
 */

import { DynamicColumn, TableRow } from './TactiquesAdvancedTableView';

export interface SelectedCell {
  rowIndex: number;
  columnKey: string;
}

export interface CopiedData {
  value: any;
  columnType: string;
  options?: Array<{ id: string; label: string }>;
  sourceColumnKey?: string;
}

export interface ValidationError {
  cellKey: string;
  timestamp: number;
  message: string;
}

export interface CellValidationResult {
  isValid: boolean;
  value?: any;
  errorMessage?: string;
}

interface CampaignBucket {
  id: string;
  name: string;
}

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

/**
 * Valide une valeur selon le type de colonne et ses contraintes
 */
export function validateCellValue(
  value: any,
  column: DynamicColumn,
  copiedData?: CopiedData
): CellValidationResult {
  // Valeur vide ou null - généralement acceptée
  if (value === null || value === undefined || value === '') {
    return { isValid: true, value: '' };
  }

  switch (column.type) {
    case 'select':
      return validateSelectValue(value, column, copiedData);
    
    case 'number':
      return validateNumberValue(value);
    
    case 'currency':
      return validateCurrencyValue(value);
    
    case 'date':
      return validateDateValue(value);
    
    case 'text':
    default:
      return validateTextValue(value, copiedData);
  }
}

/**
 * Valide une valeur pour un champ text (avec conversion intelligente depuis select)
 */
function validateTextValue(
  value: any,
  copiedData?: CopiedData
): CellValidationResult {
  // Si on colle depuis un select vers un champ text, convertir l'ID vers le display name
  if (copiedData?.columnType === 'select' && copiedData.options) {
    const sourceOption = copiedData.options.find(opt => opt.id === value);
    if (sourceOption) {
      // Coller le libellé lisible au lieu de l'ID technique
      return { isValid: true, value: sourceOption.label };
    }
  }

  // Sinon, conversion standard vers string
  return { isValid: true, value: String(value) };
}

/**
 * Valide une valeur pour un champ select
 */
function validateSelectValue(
  value: any,
  column: DynamicColumn,
  copiedData?: CopiedData
): CellValidationResult {
  if (!column.options || column.options.length === 0) {
    return { isValid: true, value };
  }

  const stringValue = String(value);

  // 1. Vérifier correspondance exacte par ID
  const exactMatch = column.options.find(opt => opt.id === stringValue);
  if (exactMatch) {
    return { isValid: true, value: exactMatch.id };
  }

  // 2. Vérifier correspondance par label
  const labelMatch = column.options.find(opt => 
    opt.label.toLowerCase() === stringValue.toLowerCase()
  );
  if (labelMatch) {
    return { isValid: true, value: labelMatch.id };
  }

  // 3. Si on colle depuis un autre select, essayer mapping intelligent
  if (copiedData?.columnType === 'select' && copiedData.options) {
    const sourceOption = copiedData.options.find(opt => opt.id === value);
    if (sourceOption) {
      // Chercher une option avec le même label dans la colonne cible
      const mappedOption = column.options.find(opt => 
        opt.label.toLowerCase() === sourceOption.label.toLowerCase()
      );
      if (mappedOption) {
        return { isValid: true, value: mappedOption.id };
      }
    }
  }

  // 4. Recherche floue par mots-clés (optionnel)
  const fuzzyMatch = column.options.find(opt => 
    opt.label.toLowerCase().includes(stringValue.toLowerCase()) ||
    stringValue.toLowerCase().includes(opt.label.toLowerCase())
  );
  if (fuzzyMatch && stringValue.length > 2) {
    return { isValid: true, value: fuzzyMatch.id };
  }

  return { 
    isValid: false, 
    errorMessage: `"${stringValue}" ne correspond à aucune option disponible` 
  };
}

/**
 * Valide une valeur numérique
 */
function validateNumberValue(value: any): CellValidationResult {
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return { 
      isValid: false, 
      errorMessage: `"${value}" n'est pas un nombre valide` 
    };
  }

  if (numValue < 0) {
    return { 
      isValid: false, 
      errorMessage: 'Les nombres négatifs ne sont pas autorisés' 
    };
  }

  return { isValid: true, value: numValue };
}

/**
 * Valide une valeur monétaire
 */
function validateCurrencyValue(value: any): CellValidationResult {
  // Nettoyer la valeur (enlever les symboles de devise, espaces, etc.)
  const cleanValue = String(value)
    .replace(/[$€£¥₹₽]/g, '') // Symboles de devise
    .replace(/[,\s]/g, '') // Virgules et espaces
    .trim();

  return validateNumberValue(cleanValue);
}

/**
 * Valide une valeur de date
 */
function validateDateValue(value: any): CellValidationResult {
  const dateValue = new Date(value);
  
  if (isNaN(dateValue.getTime())) {
    return { 
      isValid: false, 
      errorMessage: `"${value}" n'est pas une date valide` 
    };
  }

  // Format ISO pour compatibilité avec les inputs HTML
  const isoDate = dateValue.toISOString().split('T')[0];
  return { isValid: true, value: isoDate };
}

/**
 * Génère une sélection rectangulaire entre deux cellules
 */
export function generateRectangularSelection(
  startCell: SelectedCell,
  endCell: SelectedCell,
  columns: DynamicColumn[],
  rows: TableRow[]
): SelectedCell[] {
  const selection: SelectedCell[] = [];

  const minRow = Math.min(startCell.rowIndex, endCell.rowIndex);
  const maxRow = Math.max(startCell.rowIndex, endCell.rowIndex);

  const startColIndex = columns.findIndex(col => col.key === startCell.columnKey);
  const endColIndex = columns.findIndex(col => col.key === endCell.columnKey);
  const minCol = Math.min(startColIndex, endColIndex);
  const maxCol = Math.max(startColIndex, endColIndex);

  for (let rowIdx = minRow; rowIdx <= maxRow; rowIdx++) {
    const row = rows[rowIdx];
    if (!row?.isEditable) continue;

    for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
      const column = columns[colIdx];
      if (!column || column.key === '_hierarchy' || column.type === 'readonly') continue;

      selection.push({
        rowIndex: rowIdx,
        columnKey: column.key
      });
    }
  }

  return selection;
}

/**
 * Applique des données copiées à une sélection avec validation
 */
export function applyPastedData(
  selectedCells: SelectedCell[],
  copiedData: CopiedData,
  rows: TableRow[],
  columns: DynamicColumn[],
  onValidValue: (rowId: string, columnKey: string, value: any) => void,
  onInvalidValue: (cellKey: string, errorMessage: string) => void
): { applied: number; errors: number } {
  let applied = 0;
  let errors = 0;

  selectedCells.forEach(cell => {
    const row = rows[cell.rowIndex];
    const column = columns.find(col => col.key === cell.columnKey);
    
    if (!row?.isEditable || !column) return;

    const cellKey = `${row.id}_${cell.columnKey}`;
    const validation = validateCellValue(copiedData.value, column, copiedData);

    if (validation.isValid) {
      onValidValue(row.id, cell.columnKey, validation.value);
      applied++;
    } else {
      onInvalidValue(cellKey, validation.errorMessage || 'Valeur invalide');
      errors++;
    }
  });

  return { applied, errors };
}

/**
 * Détermine si une cellule peut recevoir une valeur copiée
 */
export function canCellReceiveValue(
  cell: SelectedCell,
  rows: TableRow[],
  columns: DynamicColumn[]
): boolean {
  const row = rows[cell.rowIndex];
  const column = columns.find(col => col.key === cell.columnKey);

  return !!(
    row?.isEditable && 
    column && 
    column.key !== '_hierarchy' && 
    column.type !== 'readonly'
  );
}

/**
 * Formate une valeur pour l'affichage dans l'indicateur de copie
 */
export function formatCopiedValueDisplay(copiedData: CopiedData): string {
  if (copiedData.value === null || copiedData.value === undefined) {
    return '(vide)';
  }

  let displayValue: string;

  // NOUVEAU : Si c'est un select, afficher le display name au lieu de l'ID
  if (copiedData.columnType === 'select' && copiedData.options) {
    const sourceOption = copiedData.options.find(opt => opt.id === copiedData.value);
    displayValue = sourceOption ? sourceOption.label : String(copiedData.value);
  } else {
    displayValue = String(copiedData.value);
  }

  // Tronquer si trop long
  if (displayValue.length > 25) {
    return displayValue.substring(0, 25) + '...';
  }

  return displayValue;
}

/**
 * Obtient les options disponibles pour un champ basé sur les listes dynamiques
 */
export function getColumnOptions(
  columnKey: string,
  buckets: CampaignBucket[],
  dynamicLists: { [key: string]: ListItem[] }
): Array<{ id: string; label: string }> {
  switch (columnKey) {
    case 'TC_Bucket':
      return buckets.map(bucket => ({
        id: bucket.id,
        label: bucket.name
      }));

    case 'TC_LoB':
    case 'TC_Media_Type':
    case 'TC_Publisher':
    case 'TC_Buying_Method':
    case 'TC_Custom_Dim_1':
    case 'TC_Custom_Dim_2':
    case 'TC_Custom_Dim_3':
    case 'TC_Inventory':
    case 'TC_Market':
    case 'TC_Language':
    case 'TC_Media_Objective':
    case 'TC_Kpi':
    case 'TC_Unit_Type':
      const listData = dynamicLists[columnKey] || [];
      return listData.map(item => ({
        id: item.id,
        label: item.SH_Display_Name_FR
      }));

    default:
      return [];
  }
}

/**
 * Nettoie les erreurs de validation expirées
 */
export function cleanupExpiredErrors(
  errors: ValidationError[],
  maxAge: number = 4000
): ValidationError[] {
  const now = Date.now();
  return errors.filter(error => now - error.timestamp < maxAge);
}

/**
 * Crée une erreur de validation
 */
export function createValidationError(
  cellKey: string,
  message: string
): ValidationError {
  return {
    cellKey,
    message,
    timestamp: Date.now()
  };
}