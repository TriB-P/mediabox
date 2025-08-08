/**
 * Ce fichier définit la structure de mappage des documents pour l'application.
 * Il contient les types de données, les niveaux de source (comme campagne, onglet, section, etc.),
 * et les interfaces pour les champs et les sections.
 * La configuration `documentMappingConfig` est l'objet principal qui décrit comment les données
 * des différentes sections sont structurées, incluant les noms de champs, les noms de colonnes correspondantes
 * et leurs types.
 * Des fonctions utilitaires sont également exportées pour faciliter l'accès et la manipulation
 * de ces mappages, permettant de récupérer tous les champs, les en-têtes ordonnés,
 * les champs par source, ou un champ spécifique par son nom de colonne.
 */

export type FieldType = 'text' | 'number' | 'shortcodeID' | 'currency' | 'date' | 'boolean';
export type SourceLevel = 'campaign' | 'onglet' | 'section' | 'tactique' | 'placement' | 'creatif' | 'parent_id';

export interface FieldMapping {
  field: string;
  column: string;
  type: FieldType;
  required?: boolean;
}

export interface SectionMapping {
  name: string;
  source: SourceLevel;
  fields: FieldMapping[];
}

export const documentMappingConfig = {
  identification: {
    name: 'Identification',
    source: 'parent_id' as SourceLevel,
    fields: [
      {
        field: 'level_indicator',
        column: 'Niveau',
        type: 'text' as FieldType,
      },
    ]
  } as SectionMapping,

  onglet: {
    name: 'Onglet',
    source: 'onglet' as SourceLevel,
    fields: [
      {
        field: 'ONGLET_Name',
        column: 'Label',
        type: 'text' as FieldType,
      },
      {
        field: 'ONGLET_Order',
        column: 'Order',
        type: 'number' as FieldType,
      },
    ]
  } as SectionMapping,

  section: {
    name: 'Section',
    source: 'section' as SourceLevel,
    fields: [
      {
        field: 'SECTION_Name',
        column: 'Label',
        type: 'text' as FieldType,
      },
      {
        field: 'SECTION_Order',
        column: 'Order',
        type: 'number' as FieldType,
      },
    ]
  } as SectionMapping,

  tactique: {
    name: 'Tactique',
    source: 'tactique' as SourceLevel,
    fields: [
      {
        field: 'TC_Label',
        column: 'TC_Label',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_BuyCurrency',
        column: 'TC_BuyCurrency',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Billing_ID',
        column: 'TC_Billing_ID',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_AssetDate',
        column: 'TC_AssetDate',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Prog_Buying_Method',
        column: 'TC_Prog_Buying_Method',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Custom_Dim_1',
        column: 'TC_Custom_Dim_1',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Custom_Dim_2',
        column: 'TC_Custom_Dim_2',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Custom_Dim_3',
        column: 'TC_Custom_Dim_3',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Emplacement',
        column: 'TC_Emplacement',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_End_Date',
        column: 'TC_End_Date',
        type: 'date' as FieldType,
      },
      {
        field: 'TC_Fee_1_Value',
        column: 'TC_Fee_1_Value',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Fee_2_Value',
        column: 'TC_Fee_2_Value',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Fee_3_Value',
        column: 'TC_Fee_3_Value',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Fee_4_Value',
        column: 'TC_Fee_4_Value',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Fee_5_Value',
        column: 'TC_Fee_5_Value',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Format_Open',
        column: 'TC_Format_Open',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Frequence',
        column: 'TC_Frequence',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Inventory',
        column: 'TC_Inventory',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Kpi_1',
        column: 'TC_Kpi_1',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Kpi_CostPer_1',
        column: 'TC_Kpi_CostPer_1',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Kpi_Volume_1',
        column: 'TC_Kpi_Volume_1',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Kpi_2',
        column: 'TC_Kpi_2',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Kpi_CostPer_2',
        column: 'TC_Kpi_CostPer_2',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Kpi_Volume_2',
        column: 'TC_Kpi_Volume_2',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Kpi_3',
        column: 'TC_Kpi_3',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Kpi_CostPer_3',
        column: 'TC_Kpi_CostPer_3',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Kpi_Volume_3',
        column: 'TC_Kpi_Volume_3',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Kpi_4',
        column: 'TC_Kpi_4',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Kpi_CostPer_4',
        column: 'TC_Kpi_CostPer_4',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Kpi_Volume_4',
        column: 'TC_Kpi_Volume_4',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Kpi_5',
        column: 'TC_Kpi_5',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Kpi_CostPer_5',
        column: 'TC_Kpi_CostPer_5',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Kpi_Volume_5',
        column: 'TC_Kpi_Volume_5',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Language_Open',
        column: 'TC_Language_Open',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_LOB',
        column: 'TC_LOB',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Market',
        column: 'TC_Market',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Market_Open',
        column: 'TC_Market_Open',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Media_Objective',
        column: 'TC_Media_Objective',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Media_Type',
        column: 'TC_Media_Type',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_NumberCreative',
        column: 'TC_NumberCreative',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_PO',
        column: 'TC_PO',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Product_Open',
        column: 'TC_Product_Open',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Publisher',
        column: 'TC_Publisher',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Start_Date',
        column: 'TC_Start_Date',
        type: 'date' as FieldType,
      },
      {
        field: 'TC_Targeting_Open',
        column: 'TC_Targeting_Open',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Unit_Type',
        column: 'TC_Unit_Type',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Unit_Volume',
        column: 'TC_Unit_Volume',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Media_Budget',
        column: 'TC_Media_Budget',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Client_Budget',
        column: 'TC_Client_Budget',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Media_Value',
        column: 'TC_Media_Value',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Unit_Price',
        column: 'TC_Unit_Price',
        type: 'number' as FieldType,
      },
    ]
  } as SectionMapping,

  placement: {
    name: 'Placement',
    source: 'placement' as SourceLevel,
    fields: [
      {
        field: 'PL_Label',
        column: 'Label',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Order',
        column: 'Order',
        type: 'number' as FieldType,
      },
    ]
  } as SectionMapping,

  creatif: {
    name: 'Créatif',
    source: 'creatif' as SourceLevel,
    fields: [
      {
        field: 'CR_Label',
        column: 'Label',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Tag_5',
        column: 'Taxo_Niveau_5',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Order',
        column: 'Order',
        type: 'number' as FieldType,
      },
      {
        field: 'CR_Tag_6',
        column: 'Volume unité',
        type: 'text' as FieldType,
      },
    ]
  } as SectionMapping
};

/**
 * Récupère tous les mappages de champs définis dans le documentMappingConfig.
 * Chaque champ inclut également sa source (le niveau auquel il appartient).
 * @returns {Array<FieldMapping & { source: SourceLevel }>} Un tableau de tous les mappages de champs avec leur source.
 */
export function getAllFieldMappings(): Array<FieldMapping & { source: SourceLevel }> {
  const allFields: Array<FieldMapping & { source: SourceLevel }> = [];

  const sections = [
    documentMappingConfig.identification,
    documentMappingConfig.onglet,
    documentMappingConfig.section,
    documentMappingConfig.tactique,
    documentMappingConfig.placement,
    documentMappingConfig.creatif
  ];

  sections.forEach(section => {
    section.fields.forEach(field => {
      allFields.push({
        ...field,
        source: section.source
      });
    });
  });

  return allFields;
}

/**
 * Récupère une liste ordonnée de toutes les en-têtes de colonne définies dans les mappages de champs.
 * @returns {string[]} Un tableau de chaînes de caractères représentant les noms de colonne.
 */
export function getOrderedHeaders(): string[] {
  return getAllFieldMappings().map(field => field.column);
}

/**
 * Récupère les mappages de champs associés à une source spécifique.
 * @param {SourceLevel} source - Le niveau de source pour lequel récupérer les champs (ex: 'onglet', 'section').
 * @returns {FieldMapping[]} Un tableau de mappages de champs pour la source donnée. Retourne un tableau vide si aucune section correspondante n'est trouvée.
 */
export function getFieldsBySource(source: SourceLevel): FieldMapping[] {
  const sections = [
    documentMappingConfig.identification,
    documentMappingConfig.onglet,
    documentMappingConfig.section,
    documentMappingConfig.tactique,
    documentMappingConfig.placement,
    documentMappingConfig.creatif
  ];

  const section = sections.find(s => s.source === source);
  return section ? section.fields : [];
}

/**
 * Récupère un mappage de champ spécifique en utilisant le nom de sa colonne.
 * @param {string} column - Le nom de la colonne du champ à rechercher.
 * @returns {(FieldMapping & { source: SourceLevel }) | null} Le mappage de champ trouvé avec sa source, ou `null` si aucun champ correspondant n'est trouvé.
 */
export function getFieldByColumn(column: string): (FieldMapping & { source: SourceLevel }) | null {
  const allFields = getAllFieldMappings();
  return allFields.find(field => field.column === column) || null;
}

export default documentMappingConfig;