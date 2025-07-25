/**
 * Ce fichier de configuration définit les options, les règles de validation,
 * les fonctions de formatage et la structure des colonnes pour les tableaux dynamiques
 * de l'application. Il organise les colonnes par niveau (section, tactique, placement, créatif)
 * et par sous-catégorie pour les tactiques, permettant une gestion flexible de
 * l'affichage et de la validation des données dans les tables.
 */
import { DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';

/**
 * Options pour la sélection des couleurs utilisées dans l'interface.
 * Chaque option a un identifiant unique (id) et un libellé affichable (label).
 */
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

/**
 * Options pour la sélection du statut d'une entité.
 * Définit les différents états possibles comme Planifiée, Active, Terminée, Annulée.
 */
export const STATUS_OPTIONS = [
  { id: 'Planned', label: 'Planifiée' },
  { id: 'Active', label: 'Active' },
  { id: 'Completed', label: 'Terminée' },
  { id: 'Cancelled', label: 'Annulée' }
];

/**
 * Options pour la sélection du type de média.
 * Liste les catégories de médias comme Display, Vidéo, Social, etc.
 */
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

/**
 * Options pour la sélection de la méthode d'achat.
 * Inclut les méthodes comme Programmatique, Direct, Garanti, Enchères.
 */
export const BUYING_METHOD_OPTIONS = [
  { id: 'Programmatic', label: 'Programmatique' },
  { id: 'Direct', label: 'Direct' },
  { id: 'Guaranteed', label: 'Garanti' },
  { id: 'Auction', label: 'Enchères' }
];

/**
 * Options pour la sélection de la langue.
 * Représente les langues disponibles comme Français, Anglais, Espagnol et Bilingue.
 */
export const LANGUAGE_OPTIONS = [
  { id: 'FR', label: 'Français' },
  { id: 'EN', label: 'Anglais' },
  { id: 'ES', label: 'Espagnol' },
  { id: 'BILINGUAL', label: 'Bilingue' }
];

/**
 * Options pour la sélection du marché géographique.
 * Liste les provinces canadiennes et une option Nationale.
 */
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

/**
 * Options pour la sélection de la devise.
 * Inclut les devises courantes comme CAD, USD, EUR, GBP.
 */
export const CURRENCY_OPTIONS = [
  { id: 'CAD', label: 'CAD' },
  { id: 'USD', label: 'USD' },
  { id: 'EUR', label: 'EUR' },
  { id: 'GBP', label: 'GBP' }
];

/**
 * Options pour le choix du type de budget.
 * Permet de distinguer entre le budget client et le budget média.
 */
export const BUDGET_CHOICE_OPTIONS = [
  { id: 'client', label: 'Budget client' },
  { id: 'media', label: 'Budget média' }
];

/**
 * Valide si une valeur est présente (non nulle, non indéfinie, non vide).
 * @param value La valeur à valider.
 * @returns Vrai si la valeur est requise et non vide, faux sinon.
 */
export const validateRequired = (value: any): boolean => {
  return value !== null && value !== undefined && value !== '';
};

/**
 * Valide si une valeur est un nombre valide et non négatif.
 * @param value La valeur à valider.
 * @returns Vrai si la valeur est un nombre non négatif, faux sinon.
 */
export const validateNumber = (value: any): boolean => {
  return !isNaN(Number(value)) && Number(value) >= 0;
};

/**
 * Valide si une valeur est un budget valide (nombre non négatif).
 * C'est une fonction utilitaire similaire à validateNumber mais spécifique au contexte budgétaire.
 * @param value La valeur du budget à valider.
 * @returns Vrai si la valeur est un nombre non négatif, faux sinon.
 */
export const validateBudget = (value: any): boolean => {
  return !isNaN(Number(value)) && Number(value) >= 0;
};

/**
 * Valide si une valeur représente une date valide.
 * @param value La valeur de la date à valider.
 * @returns Vrai si la valeur est une date valide ou vide, faux sinon.
 */
export const validateDate = (value: any): boolean => {
  if (!value) return true;
  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * Valide si une valeur est une adresse e-mail valide.
 * @param value L'adresse e-mail à valider.
 * @returns Vrai si la valeur est une adresse e-mail valide ou vide, faux sinon.
 */
export const validateEmail = (value: any): boolean => {
  if (!value) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * Formate une valeur numérique en format monétaire canadien (CAD) sans décimales.
 * @param value La valeur à formater.
 * @returns La chaîne de caractères formatée en devise.
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

/**
 * Formate une valeur numérique selon les conventions locales canadiennes.
 * @param value La valeur à formater.
 * @returns La chaîne de caractères formatée en nombre.
 */
export const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return value;

  return new Intl.NumberFormat('fr-CA').format(num);
};

/**
 * Formate une valeur de date en chaîne de caractères selon le format local canadien.
 * @param value La valeur de la date à formater.
 * @returns La chaîne de caractères formatée en date.
 */
export const formatDate = (value: any): string => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString('fr-CA');
};

/**
 * Formate une valeur numérique en pourcentage.
 * @param value La valeur à formater.
 * @returns La chaîne de caractères formatée en pourcentage.
 */
export const formatPercentage = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return value;

  return `${num}%`;
};

/**
 * Définit les identifiants des sous-catégories pour les tactiques.
 */
export type TactiqueSubCategory = 'info' | 'strategie' | 'budget' | 'admin';

/**
 * Interface pour la configuration d'une sous-catégorie de tactique.
 * Comprend un identifiant, un libellé et la liste des colonnes associées.
 */
export interface TactiqueSubCategoryConfig {
  id: TactiqueSubCategory;
  label: string;
  columns: DynamicColumn[];
}

/**
 * Définition des colonnes pour la sous-catégorie 'Info' des tactiques.
 * Ces colonnes sont utilisées pour les informations générales d'une tactique.
 */
const TACTIQUE_INFO_COLUMNS: DynamicColumn[] = [
  {
    key: 'TC_Label',
    label: 'Étiquette',
    type: 'text',
    width: 250,
    validation: validateRequired
  },
  {
    key: 'TC_Bucket',
    label: 'Enveloppe',
    type: 'select',
    width: 180,
    options: []
  }
];

/**
 * Définition des colonnes pour la sous-catégorie 'Stratégie' des tactiques.
 * Ces colonnes couvrent les aspects stratégiques et créatifs d'une tactique.
 */
const TACTIQUE_STRATEGIE_COLUMNS: DynamicColumn[] = [
  {
    key: 'TC_LoB',
    label: 'Ligne d\'affaire',
    type: 'select',
    width: 150,
    options: []
  },
  {
    key: 'TC_Media_Type',
    label: 'Type média',
    type: 'select',
    width: 150,
    options: MEDIA_TYPE_OPTIONS
  },
  {
    key: 'TC_Publisher',
    label: 'Partenaire',
    type: 'select',
    width: 180,
    options: []
  },
  {
    key: 'TC_Inventory',
    label: 'Inventaire',
    type: 'select',
    width: 150,
    options: []
  },
  {
    key: 'TC_Market_Open',
    label: 'Description du marché',
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Targeting_Open',
    label: 'Description de l\'audience',
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Product_Open',
    label: 'Description du produit',
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Format_Open',
    label: 'Description du format',
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Location',
    label: 'Description de l\'emplacement',
    type: 'text',
    width: 200
  },
  {
    key: 'TC_Frequence',
    label: 'Fréquence',
    type: 'text',
    width: 150
  },
  {
    key: 'TC_Market',
    label: 'Marché',
    type: 'select',
    width: 140,
    options: MARKET_OPTIONS
  },
  {
    key: 'TC_Language',
    label: 'Langue',
    type: 'select',
    width: 120,
    options: LANGUAGE_OPTIONS
  },
  {
    key: 'TC_Buying_Method',
    label: 'Méthode d\'achat',
    type: 'select',
    width: 150,
    options: BUYING_METHOD_OPTIONS
  },
  {
    key: 'TC_Custom_Dim_1',
    label: 'Dimension personnalisée 1',
    type: 'select',
    width: 180,
    options: []
  },
  {
    key: 'TC_Custom_Dim_2',
    label: 'Dimension personnalisée 2',
    type: 'select',
    width: 180,
    options: []
  },
  {
    key: 'TC_Custom_Dim_3',
    label: 'Dimension personnalisée 3',
    type: 'select',
    width: 180,
    options: []
  },
  {
    key: 'TC_NumberCreatives',
    label: 'Nombre de créatifs suggérés',
    type: 'text',
    width: 200
  },
  {
    key: 'TC_AssetDate',
    label: 'Date de livraison des créatifs',
    type: 'date',
    width: 180,
    validation: validateDate,
    format: formatDate
  }
];

/**
 * Définition des colonnes pour la sous-catégorie 'Budget' des tactiques.
 * Ces colonnes gèrent les informations financières et budgétaires d'une tactique.
 */
const TACTIQUE_BUDGET_COLUMNS: DynamicColumn[] = [
  {
    key: 'TC_BudgetChoice',
    label: 'Mode de saisie',
    type: 'select',
    width: 150,
    options: BUDGET_CHOICE_OPTIONS
  },
  {
    key: 'TC_BudgetInput',
    label: 'Budget saisi',
    type: 'currency',
    width: 150,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_BuyCurrency',
    label: 'Devise',
    type: 'select',
    width: 100,
    options: CURRENCY_OPTIONS
  },
  {
    key: 'TC_Unit_Type',
    label: 'Type d\'unité',
    type: 'select',
    width: 120,
    options: []
  },
  {
    key: 'TC_Unit_Price',
    label: 'Coût par unité',
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
    width: 150,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_Client_Budget',
    label: 'Budget client',
    type: 'currency',
    width: 150,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_Media_Value',
    label: 'Valeur réelle',
    type: 'currency',
    width: 130,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_Bonification',
    label: 'Bonification',
    type: 'currency',
    width: 130,
    validation: validateBudget,
    format: formatCurrency
  },
  {
    key: 'TC_Currency_Rate',
    label: 'Taux de change',
    type: 'number',
    width: 120,
    validation: validateNumber,
    format: formatNumber
  }
];

/**
 * Définition des colonnes pour la sous-catégorie 'Admin' des tactiques.
 * Ces colonnes contiennent les informations administratives et de facturation.
 */
const TACTIQUE_ADMIN_COLUMNS: DynamicColumn[] = [
  {
    key: 'TC_Billing_ID',
    label: 'Numéro de facturation',
    type: 'text',
    width: 180
  },
  {
    key: 'TC_PO',
    label: 'PO',
    type: 'text',
    width: 150
  }
];

/**
 * Configuration complète des sous-catégories de tactiques, associant chaque sous-catégorie
 * à son libellé et à l'ensemble des colonnes qui la composent.
 */
export const TACTIQUE_SUBCATEGORIES: TactiqueSubCategoryConfig[] = [
  {
    id: 'info',
    label: 'Info',
    columns: TACTIQUE_INFO_COLUMNS
  },
  {
    id: 'strategie',
    label: 'Stratégie',
    columns: TACTIQUE_STRATEGIE_COLUMNS
  },
  {
    id: 'budget',
    label: 'Budget',
    columns: TACTIQUE_BUDGET_COLUMNS
  },
  {
    id: 'admin',
    label: 'Admin',
    columns: TACTIQUE_ADMIN_COLUMNS
  }
];

/**
 * Configuration globale des colonnes pour chaque niveau de la table (section, tactique, placement, créatif).
 * Cela permet de définir les colonnes par défaut pour chaque type d'entité.
 */
export const COLUMN_CONFIGS: Record<TableLevel, DynamicColumn[]> = {
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
  tactique: TACTIQUE_INFO_COLUMNS,
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
      type: 'text',
      width: 120
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

/**
 * Récupère la configuration des colonnes pour un niveau de tableau donné.
 * Si le niveau est 'tactique' et qu'une sous-catégorie est spécifiée, elle retourne les colonnes de cette sous-catégorie.
 * Sinon, elle retourne les colonnes par défaut pour le niveau spécifié.
 * @param level Le niveau du tableau (e.g., 'section', 'tactique').
 * @param tactiqueSubCategory La sous-catégorie de tactique (optionnel).
 * @returns Un tableau d'objets DynamicColumn correspondant à la configuration des colonnes.
 */
export function getColumnsForLevel(level: TableLevel, tactiqueSubCategory?: TactiqueSubCategory): DynamicColumn[] {
  if (level === 'tactique' && tactiqueSubCategory) {
    const subCategory = TACTIQUE_SUBCATEGORIES.find(sc => sc.id === tactiqueSubCategory);
    return subCategory ? subCategory.columns : COLUMN_CONFIGS[level];
  }
  return COLUMN_CONFIGS[level] || [];
}

/**
 * Récupère toutes les configurations de sous-catégories disponibles pour les tactiques.
 * @returns Un tableau d'objets TactiqueSubCategoryConfig.
 */
export function getTactiqueSubCategories(): TactiqueSubCategoryConfig[] {
  return TACTIQUE_SUBCATEGORIES;
}

/**
 * Récupère une colonne spécifique par sa clé et son niveau, potentiellement filtrée par sous-catégorie de tactique.
 * @param level Le niveau du tableau.
 * @param key La clé unique de la colonne à rechercher.
 * @param tactiqueSubCategory La sous-catégorie de tactique (optionnel).
 * @returns L'objet DynamicColumn correspondant ou undefined si non trouvé.
 */
export function getColumnByKey(level: TableLevel, key: string, tactiqueSubCategory?: TactiqueSubCategory): DynamicColumn | undefined {
  const columns = getColumnsForLevel(level, tactiqueSubCategory);
  return columns.find(col => col.key === key);
}

/**
 * Valide une valeur donnée en fonction des règles de validation définies pour une colonne spécifique.
 * @param level Le niveau du tableau.
 * @param key La clé de la colonne.
 * @param value La valeur à valider.
 * @param tactiqueSubCategory La sous-catégorie de tactique (optionnel).
 * @returns Vrai si la valeur est valide selon la colonne, faux sinon.
 */
export function validateColumnValue(level: TableLevel, key: string, value: any, tactiqueSubCategory?: TactiqueSubCategory): boolean {
  const column = getColumnByKey(level, key, tactiqueSubCategory);
  if (!column || !column.validation) return true;

  return column.validation(value);
}

/**
 * Formate une valeur donnée en utilisant la fonction de formatage spécifiée pour une colonne.
 * @param level Le niveau du tableau.
 * @param key La clé de la colonne.
 * @param value La valeur à formater.
 * @param tactiqueSubCategory La sous-catégorie de tactique (optionnel).
 * @returns La valeur formatée sous forme de chaîne de caractères.
 */
export function formatColumnValue(level: TableLevel, key: string, value: any, tactiqueSubCategory?: TactiqueSubCategory): string {
  const column = getColumnByKey(level, key, tactiqueSubCategory);
  if (!column || !column.format) return String(value || '');

  return column.format(value);
}

/**
 * Calcule la largeur totale combinée de toutes les colonnes pour un niveau de tableau donné.
 * @param level Le niveau du tableau.
 * @param tactiqueSubCategory La sous-catégorie de tactique (optionnel).
 * @returns La somme des largeurs des colonnes.
 */
export function getTotalColumnsWidth(level: TableLevel, tactiqueSubCategory?: TactiqueSubCategory): number {
  const columns = getColumnsForLevel(level, tactiqueSubCategory);
  return columns.reduce((total, col) => total + (col.width || 150), 0);
}

/**
 * Ajoute une colonne spéciale de hiérarchie (indentation visuelle) au début de la liste des colonnes pour un niveau donné.
 * Cette colonne est utilisée pour représenter la structure imbriquée des éléments dans le tableau.
 * @param level Le niveau du tableau.
 * @param tactiqueSubCategory La sous-catégorie de tactique (optionnel).
 * @returns Un tableau de colonnes incluant la colonne de hiérarchie.
 */
export function getColumnsWithHierarchy(level: TableLevel, tactiqueSubCategory?: TactiqueSubCategory): DynamicColumn[] {
  const hierarchyColumn: DynamicColumn = {
    key: '_hierarchy',
    label: 'Structure',
    type: 'readonly',
    width: 300
  };

  const columns = getColumnsForLevel(level, tactiqueSubCategory);
  return [hierarchyColumn, ...columns];
}