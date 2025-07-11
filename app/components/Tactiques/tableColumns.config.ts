// app/components/Tactiques/tableColumns.config.ts

import { DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';

// ==================== OPTIONS POUR LES CHAMPS SELECT ====================

export const COLOR_OPTIONS = [
  { id: '#ef4444', label: 'Rouge' },
  { id: '#f97316', label: 'Orange' },
  { id: '#eab308', label: 'Jaune' },
  { id: '#22c55e', label: 'Vert' },
  { id: '#3b82f6', label: 'Bleu' },
  { id: '#6366f1', label: 'Indigo' },
  { id: '#a855f7', label: 'Violet' },
  { id: '#ec4899', label: 'Rose' },
  { id: '#6b7280', label: 'Gris' }
];

export const STATUS_OPTIONS = [
  { id: 'Planned', label: 'Planifiée' },
  { id: 'Active', label: 'Active' },
  { id: 'Completed', label: 'Terminée' },
  { id: 'Cancelled', label: 'Annulée' }
];

export const MEDIA_TYPE_OPTIONS = [
  { id: 'Display', label: 'Display' },
  { id: 'Video', label: 'Vidéo' },
  { id: 'Social', label: 'Social' },
  { id: 'Search', label: 'Recherche' },
  { id: 'Audio', label: 'Audio' },
  { id: 'TV', label: 'Télévision' },
  { id: 'Print', label: 'Imprimé' },
  { id: 'OOH', label: 'Affichage extérieur' }
];

export const BUYING_METHOD_OPTIONS = [
  { id: 'Programmatic', label: 'Programmatique' },
  { id: 'Direct', label: 'Direct' },
  { id: 'Guaranteed', label: 'Garanti' },
  { id: 'Auction', label: 'Enchères' }
];

export const LANGUAGE_OPTIONS = [
  { id: 'FR', label: 'Français' },
  { id: 'EN', label: 'Anglais' },
  { id: 'ES', label: 'Espagnol' },
  { id: 'BILINGUAL', label: 'Bilingue' }
];

export const MARKET_OPTIONS = [
  { id: 'QC', label: 'Québec' },
  { id: 'ON', label: 'Ontario' },
  { id: 'BC', label: 'Colombie-Britannique' },
  { id: 'AB', label: 'Alberta' },
  { id: 'MB', label: 'Manitoba' },
  { id: 'SK', label: 'Saskatchewan' },
  { id: 'NB', label: 'Nouveau-Brunswick' },
  { id: 'NS', label: 'Nouvelle-Écosse' },
  { id: 'PE', label: 'Île-du-Prince-Édouard' },
  { id: 'NL', label: 'Terre-Neuve-et-Labrador' },
  { id: 'NT', label: 'Territoires du Nord-Ouest' },
  { id: 'NU', label: 'Nunavut' },
  { id: 'YT', label: 'Yukon' },
  { id: 'NATIONAL', label: 'National' }
];

// ==================== FONCTIONS DE VALIDATION ====================

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
  if (!value) return true; // Dates optionnelles
  const date = new Date(value);
  return !isNaN(date.getTime());
};

export const validateEmail = (value: any): boolean => {
  if (!value) return true; // Email optionnel
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

// ==================== FONCTIONS DE FORMATAGE ====================

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
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  
  return date.toLocaleDateString('fr-CA');
};

export const formatPercentage = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return value;
  
  return `${num}%`;
};

// ==================== CONFIGURATION DES COLONNES PAR NIVEAU ====================

export const COLUMN_CONFIGS: Record<TableLevel, DynamicColumn[]> = {
  // ==================== COLONNES SECTIONS ====================
  section: [
    {
      key: 'SECTION_Name',
      label: 'Nom de la section',
      type: 'text',
      width: 300,
      validation: validateRequired
    },
    {
      key: 'SECTION_Color',
      label: 'Couleur',
      type: 'select',
      width: 150,
      options: COLOR_OPTIONS
    },
    {
      key: 'SECTION_Budget',
      label: 'Budget',
      type: 'currency',
      width: 150,
      validation: validateBudget,
      format: formatCurrency
    },
    {
      key: 'SECTION_Order',
      label: 'Ordre',
      type: 'number',
      width: 100,
      validation: validateNumber,
      format: formatNumber
    }
  ],

  // ==================== COLONNES TACTIQUES ====================
  tactique: [
    {
      key: 'TC_Label',
      label: 'Nom de la tactique',
      type: 'text',
      width: 250,
      validation: validateRequired
    },
    {
      key: 'TC_Media_Type',
      label: 'Type de média',
      type: 'select',
      width: 150,
      options: MEDIA_TYPE_OPTIONS
    },
    {
      key: 'TC_Publisher',
      label: 'Éditeur',
      type: 'text',
      width: 180
    },
    {
      key: 'TC_Budget',
      label: 'Budget',
      type: 'currency',
      width: 130,
      validation: validateBudget,
      format: formatCurrency
    },
    {
      key: 'TC_StartDate',
      label: 'Date de début',
      type: 'date',
      width: 130,
      validation: validateDate,
      format: formatDate
    },
    {
      key: 'TC_EndDate',
      label: 'Date de fin',
      type: 'date',
      width: 130,
      validation: validateDate,
      format: formatDate
    },
    {
      key: 'TC_Status',
      label: 'Statut',
      type: 'select',
      width: 120,
      options: STATUS_OPTIONS
    },
    {
      key: 'TC_Buying_Method',
      label: 'Méthode d\'achat',
      type: 'select',
      width: 150,
      options: BUYING_METHOD_OPTIONS
    },
    {
      key: 'TC_Language',
      label: 'Langue',
      type: 'select',
      width: 120,
      options: LANGUAGE_OPTIONS
    },
    {
      key: 'TC_Market',
      label: 'Marché',
      type: 'select',
      width: 140,
      options: MARKET_OPTIONS
    },
    {
      key: 'TC_Format',
      label: 'Format',
      type: 'text',
      width: 120
    },
    {
      key: 'TC_Placement',
      label: 'Emplacement',
      type: 'text',
      width: 150
    },
    {
      key: 'TC_Unit_Price',
      label: 'Prix unitaire',
      type: 'currency',
      width: 130,
      validation: validateBudget,
      format: formatCurrency
    },
    {
      key: 'TC_Unit_Volume',
      label: 'Volume',
      type: 'number',
      width: 100,
      validation: validateNumber,
      format: formatNumber
    },
    {
      key: 'TC_Media_Budget',
      label: 'Budget média',
      type: 'currency',
      width: 130,
      validation: validateBudget,
      format: formatCurrency
    },
    {
      key: 'TC_PO',
      label: 'Bon de commande',
      type: 'text',
      width: 150
    },
    {
      key: 'TC_Billing_ID',
      label: 'ID facturation',
      type: 'text',
      width: 130
    },
    {
      key: 'TC_Order',
      label: 'Ordre',
      type: 'number',
      width: 80,
      validation: validateNumber,
      format: formatNumber
    }
  ],

  // ==================== COLONNES PLACEMENTS ====================
  placement: [
    {
      key: 'PL_Label',
      label: 'Nom du placement',
      type: 'text',
      width: 250,
      validation: validateRequired
    },
    {
      key: 'PL_Order',
      label: 'Ordre',
      type: 'number',
      width: 80,
      validation: validateNumber,
      format: formatNumber
    },
    {
      key: 'TAX_Product',
      label: 'Produit',
      type: 'text',
      width: 150
    },
    {
      key: 'TAX_Location',
      label: 'Emplacement',
      type: 'text',
      width: 150
    },
    {
      key: 'TAX_Audience_Demographics',
      label: 'Démographie',
      type: 'text',
      width: 150
    },
    {
      key: 'TAX_Device',
      label: 'Appareil',
      type: 'text',
      width: 120
    },
    {
      key: 'TAX_Targeting',
      label: 'Ciblage',
      type: 'text',
      width: 140
    }
  ],

  // ==================== COLONNES CRÉATIFS ====================
  creatif: [
    {
      key: 'CR_Label',
      label: 'Nom du créatif',
      type: 'text',
      width: 250,
      validation: validateRequired
    },
    {
      key: 'CR_Order',
      label: 'Ordre',
      type: 'number',
      width: 80,
      validation: validateNumber,
      format: formatNumber
    },
    {
      key: 'CR_Start_Date',
      label: 'Date de début',
      type: 'date',
      width: 130,
      validation: validateDate,
      format: formatDate
    },
    {
      key: 'CR_End_Date',
      label: 'Date de fin',
      type: 'date',
      width: 130,
      validation: validateDate,
      format: formatDate
    },
    {
      key: 'CR_Rotation_Weight',
      label: 'Poids rotation',
      type: 'number',
      width: 120,
      validation: validateNumber,
      format: formatNumber
    },
    {
      key: 'CR_CTA',
      label: 'Appel à l\'action',
      type: 'text',
      width: 150
    },
    {
      key: 'CR_Format_Details',
      label: 'Détails format',
      type: 'text',
      width: 150
    },
    {
      key: 'CR_Offer',
      label: 'Offre',
      type: 'text',
      width: 120
    },
    {
      key: 'CR_Plateform_Name',
      label: 'Plateforme',
      type: 'text',
      width: 130
    },
    {
      key: 'CR_Primary_Product',
      label: 'Produit principal',
      type: 'text',
      width: 150
    },
    {
      key: 'CR_URL',
      label: 'URL',
      type: 'text',
      width: 200
    },
    {
      key: 'CR_Version',
      label: 'Version',
      type: 'text',
      width: 100
    }
  ]
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Récupère les colonnes pour un niveau donné
 */
export function getColumnsForLevel(level: TableLevel): DynamicColumn[] {
  return COLUMN_CONFIGS[level] || [];
}

/**
 * Récupère une colonne spécifique par clé et niveau
 */
export function getColumnByKey(level: TableLevel, key: string): DynamicColumn | undefined {
  return COLUMN_CONFIGS[level]?.find(col => col.key === key);
}

/**
 * Valide une valeur selon la configuration de la colonne
 */
export function validateColumnValue(level: TableLevel, key: string, value: any): boolean {
  const column = getColumnByKey(level, key);
  if (!column || !column.validation) return true;
  
  return column.validation(value);
}

/**
 * Formate une valeur selon la configuration de la colonne
 */
export function formatColumnValue(level: TableLevel, key: string, value: any): string {
  const column = getColumnByKey(level, key);
  if (!column || !column.format) return String(value || '');
  
  return column.format(value);
}

/**
 * Récupère les largeurs totales des colonnes pour un niveau
 */
export function getTotalColumnsWidth(level: TableLevel): number {
  return COLUMN_CONFIGS[level]?.reduce((total, col) => total + (col.width || 150), 0) || 0;
}

/**
 * Ajoute une colonne hiérarchie (nom avec indentation) en première position
 */
export function getColumnsWithHierarchy(level: TableLevel): DynamicColumn[] {
  const hierarchyColumn: DynamicColumn = {
    key: '_hierarchy',
    label: 'Structure',
    type: 'readonly',
    width: 300
  };

  return [hierarchyColumn, ...COLUMN_CONFIGS[level]];
}