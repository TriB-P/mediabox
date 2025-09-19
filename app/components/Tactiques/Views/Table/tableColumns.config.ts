// app/components/Tactiques/Views/Table/tableColumns.config.ts

/**
 * Configuration des colonnes de tableau avec support de traduction complète
 * Tous les labels et options sont maintenant traduits dynamiquement
 * SUPPRIME la rétrocompatibilité - la fonction t() est obligatoire
 */
import { m } from 'framer-motion';
import { DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';

/**
 * Fonctions de création d'options traduites pour les menus déroulants
 */


export const getCurrencyOptions = (t: (key: string) => string) => [
  { id: 'CAD', label: t('options.currency.cad') },
  { id: 'USD', label: t('options.currency.usd') },
  { id: 'EUR', label: t('options.currency.eur') },
  { id: 'CHF', label: t('options.currency.chf') }
];

export const getBudgetChoiceOptions = (t: (key: string) => string) => [
  { id: 'client', label: t('options.budgetChoice.client') },
  { id: 'media', label: t('options.budgetChoice.media') }
];

/**
 * Fonctions de validation (inchangées)
 */
export const validateRequired = (value: any): boolean => {
  return value !== null && value !== undefined && value !== '';
};

export const validateNumber = (value: any): boolean => {
  return !isNaN(Number(value)) && Number(value) >= 0;
};

export const validateBudget = (value: any): boolean => {
  return !isNaN(Number(value)) && Number(value) >= 0;
};

export const validateDate = (value: any): boolean => {
  if (!value) return true;
  const date = new Date(value);
  return !isNaN(date.getTime());
};

export const validateEmail = (value: any): boolean => {
  if (!value) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * Fonctions de formatage (inchangées)
 */
export const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return value;

  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0
  }).format(num);
};

export const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return value;

  return new Intl.NumberFormat('fr-CA').format(num);
};

export const formatDate = (value: any): string => {
  if (!value) return '';
  
  let date: Date;
  
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(value);
  }
  
  if (isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${day}/${month}/${year}`;
};

export const formatPercentage = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return value;

  return `${num}%`;
};

/**
 * Types pour les sous-catégories
 */
export type TactiqueSubCategory = 'info' | 'strategie' | 'budget' | 'admin' | 'specs' | 'kpi';
export type PlacementSubCategory = 'info' | 'taxonomie';
export type CreatifSubCategory = 'info' | 'taxonomie' | 'specs';

/**
 * Interfaces pour les configurations de sous-catégories
 */
export interface TactiqueSubCategoryConfig {
  id: TactiqueSubCategory;
  label: string;
  columns: DynamicColumn[];
}

export interface PlacementSubCategoryConfig {
  id: PlacementSubCategory;
  label: string;
  columns: DynamicColumn[];
}

export interface CreatifSubCategoryConfig {
  id: CreatifSubCategory;
  label: string;
  columns: DynamicColumn[];
}

/**
 * Définition des colonnes avec traduction obligatoire
 */
const getTactiqueInfoColumns = (t: (key: string) => string): DynamicColumn[] => [
  {
    key: 'TC_Label',
    label: t('columns.tactique.label'),
    type: 'text',
    width: 250,
    validation: validateRequired
  },
  {
    key: 'TC_Bucket',
    label: t('columns.tactique.bucket'),
    type: 'select',
    width: 180,
    options: []
  },
  {
    key: 'TC_MPA',
    label: t('columns.tactique.mpa'),
    type: 'text',
    width: 250,
  },
  {
    key: 'TC_Start_Date',
    label: t('columns.tactique.startDate'),
    type: 'date',
    width: 150,
    validation: validateDate,
    format: formatDate
  },
  {
    key: 'TC_End_Date',
    label: t('columns.tactique.endDate'),
    type: 'date',
    width: 150,
    validation: validateDate,
    format: formatDate
  }
];

const getTactiqueStrategieColumns = (t: (key: string) => string): DynamicColumn[] => [
  {
    key: 'TC_LOB',
    label: t('columns.tactique.lob'),
    type: 'select',
    width: 150,
    options: []
  },
  {
    key: 'TC_Media_Type',
    label: t('columns.tactique.mediaType'),
    type: 'select',
    width: 150,
    options: []
  },
  {
    key: 'TC_Publisher',
    label: t('columns.tactique.publisher'),
    type: 'select',
    width: 180,
    options: []
  },
  {
    key: 'TC_Inventory',
    label: t('columns.tactique.inventory'),
    type: 'select',
    width: 150,
    options: []
  },
  {
    key: 'TC_Market_Open',
    label: t('columns.tactique.marketOpen'),
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Targeting_Open',
    label: t('columns.tactique.targetingOpen'),
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Product_Open',
    label: t('columns.tactique.productOpen'),
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Format_Open',
    label: t('columns.tactique.formatOpen'),
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Location_Open',
    label: t('columns.tactique.locationOpen'),
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Frequence',
    label: t('columns.tactique.frequency'),
    type: 'text',
    width: 150
  },
  {
    key: 'TC_Market',
    label: t('columns.tactique.market'),
    type: 'select',
    width: 140,
    options: []
  },
  {
    key: 'TC_Language_Open',
    label: t('columns.tactique.language'),
    type: 'text',
    width: 120,
    options: []
  },
  {
    key: 'TC_Prog_Buying_Method_1',
    label: t('columns.tactique.buyingMethod_1'),
    type: 'select',
    width: 150,
    options: []
  },
  {
    key: 'TC_Prog_Buying_Method_2',
    label: t('columns.tactique.buyingMethod_2'),
    type: 'select',
    width: 150,
    options: []
  },
  {
    key: 'TC_Custom_Dim_1',
    label: t('columns.tactique.customDim1'),
    type: 'select',
    width: 180,
    options: []
  },
  {
    key: 'TC_Custom_Dim_2',
    label: t('columns.tactique.customDim2'),
    type: 'select',
    width: 180,
    options: []
  },
  {
    key: 'TC_Custom_Dim_3',
    label: t('columns.tactique.customDim3'),
    type: 'select',
    width: 180,
    options: []
  },
  {
    key: 'TC_NumberCreative',
    label: t('columns.tactique.numberCreative'),
    type: 'text',
    width: 200
  },
  {
    key: 'TC_AssetDate',
    label: t('columns.tactique.assetDate'),
    type: 'date',
    width: 180,
    validation: validateDate,
    format: formatDate
  }
];

const getTactiqueBudgetColumns = (t: (key: string) => string): DynamicColumn[] => [
  {
    key: 'TC_Budget_Mode',
    label: t('columns.tactique.budgetMode'),
    type: 'select',
    width: 150,
    options: getBudgetChoiceOptions(t)
  },
  {
    key: 'TC_BudgetInput',
    label: t('columns.tactique.budgetInput'),
    type: 'currency',
    width: 150,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_BuyCurrency',
    label: t('columns.tactique.buyCurrency'),
    type: 'select',
    width: 100,
    options: getCurrencyOptions(t)
  },
  {
    key: 'TC_Unit_Type',
    label: t('columns.tactique.unitType'),
    type: 'select',
    width: 120,
    options: []
  },
  {
    key: 'TC_Unit_Price',
    label: t('columns.tactique.unitPrice'),
    type: 'currency',
    width: 130,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_Unit_Volume',
    label: t('columns.tactique.unitVolume'),
    type: 'number',
    width: 100,
    validation: validateNumber,
    format: formatNumber
  },
  {
    key: 'TC_Media_Budget',
    label: t('columns.tactique.mediaBudget'),
    type: 'currency',
    width: 150,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_Client_Budget',
    label: t('columns.tactique.clientBudget'),
    type: 'currency',
    width: 150,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_Media_Value',
    label: t('columns.tactique.mediaValue'),
    type: 'currency',
    width: 130,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_Bonification',
    label: t('columns.tactique.bonification'),
    type: 'currency',
    width: 130,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_Currency_Rate',
    label: t('columns.tactique.currencyRate'),
    type: 'number',
    width: 120,
    validation: validateNumber,
    format: formatNumber
  }
];

const getTactiqueAdminColumns = (t: (key: string) => string): DynamicColumn[] => [
  {
    key: 'TC_Billing_ID',
    label: t('columns.tactique.billingId'),
    type: 'text',
    width: 180
  },
  {
    key: 'TC_PO',
    label: t('columns.tactique.po'),
    type: 'text',
    width: 150
  }
];

const getTactiqueSpecsColumns = (t: (key: string) => string): DynamicColumn[] => [
  {
    key: 'TC_Spec_Name',
    label: t('columns.tactique.specName'),
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Spec_Format',
    label: t('columns.tactique.specFormat'),
    type: 'text',
    width: 150
  },
  {
    key: 'TC_Spec_Ratio',
    label: t('columns.tactique.specRatio'),
    type: 'text',
    width: 120
  },
  {
    key: 'TC_Spec_FileType',
    label: t('columns.tactique.specFileType'),
    type: 'text',
    width: 130
  },
  {
    key: 'TC_Spec_MaxWeight',
    label: t('columns.tactique.specMaxWeight'),
    type: 'text',
    width: 120
  },
  {
    key: 'TC_Spec_Weight',
    label: t('columns.tactique.specWeight'),
    type: 'text',
    width: 100
  },
  {
    key: 'TC_Spec_Animation',
    label: t('columns.tactique.specAnimation'),
    type: 'text',
    width: 120
  },
  {
    key: 'TC_Spec_Title',
    label: t('columns.tactique.specTitle'),
    type: 'text',
    width: 150
  },
  {
    key: 'TC_Spec_Text',
    label: t('columns.tactique.specText'),
    type: 'text',
    width: 150
  },
  {
    key: 'TC_Spec_SpecSheetLink',
    label: t('columns.tactique.specSheetLink'),
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Spec_Notes',
    label: t('columns.tactique.specNotes'),
    type: 'text',
    width: 200
  }
];

const getTactiqueKpiColumns = (t: (key: string) => string): DynamicColumn[] => [
  {
    key: 'TC_Media_Objective',
    label: t('columns.tactique.mediaObjective'),
    type: 'select',
    width: 180,
    options: []
  },
  {
    key: 'TC_Kpi',
    label: t('columns.tactique.kpi'),
    type: 'select', 
    width: 150,
    options: []
  },
  {
    key: 'TC_Kpi_CostPer',
    label: t('columns.tactique.kpiCostPer'),
    type: 'currency',
    width: 130,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_Kpi_Volume',
    label: t('columns.tactique.kpiVolume'),
    type: 'number',
    width: 120,
    validation: validateNumber,
    format: formatNumber
  }
];

const getPlacementInfoColumns = (t: (key: string) => string): DynamicColumn[] => [
  {
    key: 'PL_Label',
    label: t('columns.placement.label'),
    type: 'text',
    width: 250,
    validation: validateRequired
  },
  {
    key: 'PL_Start_Date',
    label: t('columns.placement.startDate'),
    type: 'date',
    width: 150,
    validation: validateDate,
    format: formatDate
  },
  {
    key: 'PL_End_Date',
    label: t('columns.placement.endDate'),
    type: 'date',
    width: 150,
    validation: validateDate,
    format: formatDate
  },
  {
    key: 'PL_Taxonomy_Tags',
    label: t('columns.placement.taxonomyTags'),
    type: 'select',
    width: 200,
    options: []
  },
  {
    key: 'PL_Taxonomy_Platform',
    label: t('columns.placement.taxonomyPlatform'),
    type: 'select',
    width: 200,
    options: []
  },
  {
    key: 'PL_Taxonomy_MediaOcean',
    label: t('columns.placement.taxonomyMediaOcean'),
    type: 'select',
    width: 200,
    options: []
  }
];

const getPlacementTaxonomieColumns = (t: (key: string) => string): DynamicColumn[] => [
  {
    key: 'PL_Product',
    label: t('columns.placement.product'),
    type: 'text',
    width: 150
  },
  {
    key: 'PL_Location',
    label: t('columns.placement.location'),
    type: 'text',
    width: 150
  },
  {
    key: 'PL_Audience_Demographics',
    label: t('columns.placement.audienceDemographics'),
    type: 'text',
    width: 150
  },
  {
    key: 'PL_Device',
    label: t('columns.placement.device'),
    type: 'text',
    width: 120
  },
  {
    key: 'PL_Targeting',
    label: t('columns.placement.targeting'),
    type: 'text',
    width: 140
  }
];

const getCreatifInfoColumns = (t: (key: string) => string): DynamicColumn[] => [
  {
    key: 'CR_Label',
    label: t('columns.creatif.label'),
    type: 'text',
    width: 250,
    validation: validateRequired
  },
  {
    key: 'CR_Start_Date',
    label: t('columns.creatif.startDate'),
    type: 'date',
    width: 150,
    validation: validateDate,
    format: formatDate
  },
  {
    key: 'CR_End_Date',
    label: t('columns.creatif.endDate'),
    type: 'date',
    width: 150,
    validation: validateDate,
    format: formatDate
  },
  {
    key: 'CR_Taxonomy_Tags',
    label: t('columns.creatif.taxonomyTags'),
    type: 'select',
    width: 200,
    options: []
  },
  {
    key: 'CR_Taxonomy_Platform',
    label: t('columns.creatif.taxonomyPlatform'),
    type: 'select',
    width: 200,
    options: []
  },
  {
    key: 'CR_Taxonomy_MediaOcean',
    label: t('columns.creatif.taxonomyMediaOcean'),
    type: 'select',
    width: 200,
    options: []
  }
];

const getCreatifTaxonomieColumns = (t: (key: string) => string): DynamicColumn[] => [
  {
    key: 'CR_Product',
    label: t('columns.creatif.product'),
    type: 'text',
    width: 150
  },
  {
    key: 'CR_Audience_Demographics',
    label: t('columns.creatif.audienceDemographics'),
    type: 'text',
    width: 150
  },
  {
    key: 'CR_Device',
    label: t('columns.creatif.device'),
    type: 'text',
    width: 120
  },
  {
    key: 'CR_Targeting',
    label: t('columns.creatif.targeting'),
    type: 'text',
    width: 140
  }
];

const getCreatifSpecsColumns = (t: (key: string) => string): DynamicColumn[] => [
  {
    key: 'CR_Spec_Name',
    label: t('columns.creatif.specName'),
    type: 'text',
    width: 200
  },
  {
    key: 'CR_Spec_Format',
    label: t('columns.creatif.specFormat'),
    type: 'text',
    width: 150
  },
  {
    key: 'CR_Spec_Ratio',
    label: t('columns.creatif.specRatio'),
    type: 'text',
    width: 120
  },
  {
    key: 'CR_Spec_FileType',
    label: t('columns.creatif.specFileType'),
    type: 'text',
    width: 130
  },
  {
    key: 'CR_Spec_MaxWeight',
    label: t('columns.creatif.specMaxWeight'),
    type: 'text',
    width: 120
  },
  {
    key: 'CR_Spec_Weight',
    label: t('columns.creatif.specWeight'),
    type: 'text',
    width: 100
  },
  {
    key: 'CR_Spec_Animation',
    label: t('columns.creatif.specAnimation'),
    type: 'text',
    width: 120
  },
  {
    key: 'CR_Spec_Title',
    label: t('columns.creatif.specTitle'),
    type: 'text',
    width: 150
  },
  {
    key: 'CR_Spec_Text',
    label: t('columns.creatif.specText'),
    type: 'text',
    width: 150
  },
  {
    key: 'CR_Spec_SpecSheetLink',
    label: t('columns.creatif.specSheetLink'),
    type: 'text',
    width: 200
  },
  {
    key: 'CR_Spec_Notes',
    label: t('columns.creatif.specNotes'),
    type: 'text',
    width: 200
  }
];

/**
 * Fonctions pour créer les configurations de sous-catégories traduites
 */
export const getTactiqueSubCategories = (t: (key: string) => string): TactiqueSubCategoryConfig[] => [
  {
    id: 'info',
    label: t('tabs.tactique.info'),
    columns: getTactiqueInfoColumns(t)
  },
  {
    id: 'strategie',
    label: t('tabs.tactique.strategy'),
    columns: getTactiqueStrategieColumns(t)
  },
  {
    id: 'budget',
    label: t('tabs.tactique.budget'),
    columns: getTactiqueBudgetColumns(t)
  },
  {
    id: 'admin',
    label: t('tabs.tactique.admin'),
    columns: getTactiqueAdminColumns(t)
  },
  {
    id: 'specs',
    label: t('tabs.tactique.specs'),
    columns: getTactiqueSpecsColumns(t)
  },
  {
    id: 'kpi',
    label: t('tabs.tactique.kpi'),
    columns: getTactiqueKpiColumns(t)
  }
];

export const getPlacementSubCategories = (t: (key: string) => string): PlacementSubCategoryConfig[] => [
  {
    id: 'info',
    label: t('tabs.placement.info'),
    columns: getPlacementInfoColumns(t)
  },
  {
    id: 'taxonomie',
    label: t('tabs.placement.taxonomy'),
    columns: getPlacementTaxonomieColumns(t)
  }
];

export const getCreatifSubCategories = (t: (key: string) => string): CreatifSubCategoryConfig[] => [
  {
    id: 'info',
    label: t('tabs.creatif.info'),
    columns: getCreatifInfoColumns(t)
  },
  {
    id: 'taxonomie',
    label: t('tabs.creatif.taxonomy'),
    columns: getCreatifTaxonomieColumns(t)
  },
  {
    id: 'specs',
    label: t('tabs.creatif.specs'),
    columns: getCreatifSpecsColumns(t)
  }
];

/**
 * Configuration des colonnes principales par niveau
 */
export const getColumnConfigs = (t: (key: string) => string): Record<TableLevel, DynamicColumn[]> => ({
  section: [
    {
      key: 'SECTION_Name',
      label: t('columns.section.name'),
      type: 'text',
      width: 300,
      validation: validateRequired
    },
  ],
  tactique: getTactiqueInfoColumns(t),
  placement: getPlacementInfoColumns(t),
  creatif: getCreatifInfoColumns(t)
});

/**
 * Fonctions principales pour récupérer les colonnes (OBLIGENT la traduction)
 */
export function getColumnsForLevel(
  level: TableLevel, 
  t: (key: string) => string,
  tactiqueSubCategory?: TactiqueSubCategory,
  placementSubCategory?: PlacementSubCategory,
  creatifSubCategory?: CreatifSubCategory
): DynamicColumn[] {
  if (level === 'tactique' && tactiqueSubCategory) {
    const subCategory = getTactiqueSubCategories(t).find(sc => sc.id === tactiqueSubCategory);
    return subCategory ? subCategory.columns : getColumnConfigs(t)[level];
  } else if (level === 'placement' && placementSubCategory) {
    const subCategory = getPlacementSubCategories(t).find(sc => sc.id === placementSubCategory);
    return subCategory ? subCategory.columns : getColumnConfigs(t)[level];
  } else if (level === 'creatif' && creatifSubCategory) {
    const subCategory = getCreatifSubCategories(t).find(sc => sc.id === creatifSubCategory);
    return subCategory ? subCategory.columns : getColumnConfigs(t)[level];
  } else {
    return getColumnConfigs(t)[level] || [];
  }
}

export function getColumnsWithHierarchy(
  level: TableLevel, 
  t: (key: string) => string,
  subCategory?: TactiqueSubCategory | PlacementSubCategory | CreatifSubCategory
): DynamicColumn[] {
  const hierarchyColumn: DynamicColumn = {
    key: '_hierarchy',
    label: t('columns.structure'),
    type: 'readonly',
    width: 300
  };

  const tactiqueSubCategory = level === 'tactique' ? subCategory as TactiqueSubCategory : undefined;
  const placementSubCategory = level === 'placement' ? subCategory as PlacementSubCategory : undefined;
  const creatifSubCategory = level === 'creatif' ? subCategory as CreatifSubCategory : undefined;

  const columns = getColumnsForLevel(level, t, tactiqueSubCategory, placementSubCategory, creatifSubCategory);
  return [hierarchyColumn, ...columns];
}

export function getColumnByKey(
  level: TableLevel, 
  key: string, 
  t: (key: string) => string,
  tactiqueSubCategory?: TactiqueSubCategory,
  placementSubCategory?: PlacementSubCategory,
  creatifSubCategory?: CreatifSubCategory
): DynamicColumn | undefined {
  const columns = getColumnsForLevel(level, t, tactiqueSubCategory, placementSubCategory, creatifSubCategory);
  return columns.find(col => col.key === key);
}

export function validateColumnValue(
  level: TableLevel, 
  key: string, 
  value: any, 
  t: (key: string) => string,
  subCategory?: TactiqueSubCategory | PlacementSubCategory | CreatifSubCategory
): boolean {
  const tactiqueSubCategory = level === 'tactique' ? subCategory as TactiqueSubCategory : undefined;
  const placementSubCategory = level === 'placement' ? subCategory as PlacementSubCategory : undefined;
  const creatifSubCategory = level === 'creatif' ? subCategory as CreatifSubCategory : undefined;
  
  const column = getColumnByKey(level, key, t, tactiqueSubCategory, placementSubCategory, creatifSubCategory);
  if (!column || !column.validation) return true;

  return column.validation(value);
}

export function formatColumnValue(
  level: TableLevel, 
  key: string, 
  value: any, 
  t: (key: string) => string,
  subCategory?: TactiqueSubCategory | PlacementSubCategory | CreatifSubCategory
): string {
  const tactiqueSubCategory = level === 'tactique' ? subCategory as TactiqueSubCategory : undefined;
  const placementSubCategory = level === 'placement' ? subCategory as PlacementSubCategory : undefined;
  const creatifSubCategory = level === 'creatif' ? subCategory as CreatifSubCategory : undefined;
  
  const column = getColumnByKey(level, key, t, tactiqueSubCategory, placementSubCategory, creatifSubCategory);
  if (!column || !column.format) return String(value || '');

  return column.format(value);
}

export function getTotalColumnsWidth(
  level: TableLevel, 
  t: (key: string) => string,
  subCategory?: TactiqueSubCategory | PlacementSubCategory | CreatifSubCategory
): number {
  const tactiqueSubCategory = level === 'tactique' ? subCategory as TactiqueSubCategory : undefined;
  const placementSubCategory = level === 'placement' ? subCategory as PlacementSubCategory : undefined;
  const creatifSubCategory = level === 'creatif' ? subCategory as CreatifSubCategory : undefined;
  
  const columns = getColumnsForLevel(level, t, tactiqueSubCategory, placementSubCategory, creatifSubCategory);
  return columns.reduce((total, col) => total + (col.width || 150), 0);
}