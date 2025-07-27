// app/components/Tactiques/Views/Table/DynamicTableHelpers.tsx

/**
 * Fonctions utilitaires pour DynamicTableStructure
 * Contient toute la logique d'enrichissement, formatage et traitement des données
 */

import { TableRow, DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';
import { formatColumnValue, TactiqueSubCategory } from './tableColumns.config';

interface CampaignBucket {
  id: string;
  name: string;
  description?: string;
  target: number;
  color?: string;
}

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * Enrichit les colonnes avec les données dynamiques et filtre les colonnes vides
 */
export function enrichColumnsWithData(
  baseColumns: DynamicColumn[],
  buckets: CampaignBucket[],
  dynamicLists: { [key: string]: ListItem[] }
): DynamicColumn[] {
  return baseColumns
    .map(column => {
      const enrichedColumn = { ...column };

      if (column.type === 'select') {
        switch (column.key) {
          case 'TC_Bucket':
            enrichedColumn.options = buckets.map(bucket => ({
              id: bucket.id,
              label: bucket.name
            }));
            break;

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
            const listData = dynamicLists[column.key] || [];
            enrichedColumn.options = listData.map(item => ({
              id: item.id,
              label: item.SH_Display_Name_FR
            }));
            break;

          default:
            break;
        }
      }

      return enrichedColumn;
    })
    .filter(column => {
      // Toujours garder la colonne de hiérarchie
      if (column.key === '_hierarchy') {
        return true;
      }

      // Toujours garder les champs non-select
      if (column.type !== 'select') {
        return true;
      }

      // Pour TC_Bucket, garder seulement s'il y a des buckets
      if (column.key === 'TC_Bucket') {
        return buckets.length > 0;
      }

      // Pour les listes dynamiques, garder seulement s'il y a des données
      if (dynamicLists[column.key]) {
        return dynamicLists[column.key].length > 0;
      }

      // Pour les autres colonnes select sans données dynamiques, les masquer
      if (column.type === 'select' && (!column.options || column.options.length === 0)) {
        return false;
      }

      // Garder par défaut
      return true;
    });
}

/**
 * Formate une valeur pour l'affichage en mode lecture
 */
export function formatDisplayValue(
  columnKey: string,
  value: any,
  buckets: CampaignBucket[],
  dynamicLists: { [key: string]: ListItem[] },
  selectedLevel: TableLevel,
  selectedTactiqueSubCategory?: TactiqueSubCategory
): string {
  // Cas spécial pour TC_Bucket : afficher le nom au lieu de l'ID
  if (columnKey === 'TC_Bucket' && value) {
    const bucket = buckets.find(b => b.id === value);
    return bucket ? bucket.name : value;
  }

  // Cas spéciaux pour les listes dynamiques : afficher le label au lieu de l'ID
  if (value && dynamicLists[columnKey]) {
    const item = dynamicLists[columnKey].find(item => item.id === value);
    return item ? item.SH_Display_Name_FR : value;
  }

  // Formatage standard pour les autres types
  return formatColumnValue(
    selectedLevel,
    columnKey,
    value,
    selectedLevel === 'tactique' ? selectedTactiqueSubCategory : undefined
  );
}

/**
 * Traite les lignes du tableau avec filtrage et tri
 */
export function processTableRows(
  tableRows: TableRow[],
  hideChildrenLevels: boolean,
  selectedLevel: TableLevel,
  searchTerm: string,
  sortConfig: SortConfig | null,
  getHierarchyLabel: (row: TableRow) => string
): TableRow[] {
  let filtered = tableRows;

  if (hideChildrenLevels) {
    filtered = tableRows.filter(row => row.type === selectedLevel);
  }

  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(row => {
      const data = row.data as any;

      const searchFields = [];

      switch (row.type) {
        case 'section':
          searchFields.push(data.SECTION_Name);
          break;
        case 'tactique':
          searchFields.push(data.TC_Label, data.TC_Publisher, data.TC_Media_Type);
          break;
        case 'placement':
          searchFields.push(data.PL_Label, data.TAX_Product, data.TAX_Location);
          break;
        case 'creatif':
          searchFields.push(data.CR_Label, data.CR_CTA, data.CR_Offer);
          break;
      }

      return searchFields.some(field =>
        field && String(field).toLowerCase().includes(searchLower)
      );
    });
  }

  if (sortConfig) {
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === '_hierarchy') {
        aValue = getHierarchyLabel(a);
        bValue = getHierarchyLabel(b);
      } else {
        aValue = (a.data as any)[sortConfig.key];
        bValue = (b.data as any)[sortConfig.key];
      }

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr, 'fr');
      } else {
        return bStr.localeCompare(aStr, 'fr');
      }
    });
  }

  return filtered;
}

/**
 * Récupère le libellé de hiérarchie pour une ligne donnée
 */
export function getHierarchyLabel(row: TableRow): string {
  const data = row.data as any;

  switch (row.type) {
    case 'section':
      return data.SECTION_Name || 'Section sans nom';
    case 'tactique':
      return data.TC_Label || 'Tactique sans nom';
    case 'placement':
      return data.PL_Label || 'Placement sans nom';
    case 'creatif':
      return data.CR_Label || 'Créatif sans nom';
    default:
      return 'Élément sans nom';
  }
}

/**
 * Récupère les styles CSS en fonction du type de niveau
 */
export function getTypeStyles(type: TableLevel): string {
  switch (type) {
    case 'section': return 'bg-blue-100 text-blue-800';
    case 'tactique': return 'bg-green-100 text-green-800';
    case 'placement': return 'bg-purple-100 text-purple-800';
    case 'creatif': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Récupère le libellé abrégé pour un type de niveau
 */
export function getTypeLabel(type: TableLevel): string {
  switch (type) {
    case 'section': return 'SEC';
    case 'tactique': return 'TAC';
    case 'placement': return 'PLA';
    case 'creatif': return 'CRE';
    default: return 'UNK';
  }
}

/**
 * Génère les classes CSS pour une ligne du tableau
 */
export function getRowStyles(
  row: TableRow,
  selectedRows: Set<string>,
  pendingChanges: Map<string, Partial<any>>
): string {
  let classes = 'hover:bg-gray-50 transition-colors';

  if (row.isEditable) {
    classes += ' bg-white';
  } else {
    classes += ' bg-gray-50 text-gray-500';
  }

  if (selectedRows.has(row.id)) {
    classes += ' bg-indigo-50 border-l-4 border-indigo-500';
  } else if (pendingChanges.has(row.id)) {
    classes += ' border-l-4 border-orange-400';
  }

  return classes;
}