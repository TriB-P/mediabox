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
        column: 'Section_Label',
        type: 'text' as FieldType,
      },
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
        field: 'TC_Label',
        column: 'Label',
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
        field: 'TC_Prog_Buying_Method_1',
        column: 'TC_Prog_Buying_Method_1',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Prog_Buying_Method_2',
        column: 'TC_Prog_Buying_Method_2',
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
        field: 'TC_Fee_1_RefCurrency',
        column: 'TC_Fee_1_RefCurrency',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Fee_2_RefCurrency',
        column: 'TC_Fee_2_RefCurrency',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Fee_3_RefCurrency',
        column: 'TC_Fee_3_RefCurrency',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Fee_4_RefCurrency',
        column: 'TC_Fee_4_RefCurrency',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Fee_5_RefCurrency',
        column: 'TC_Fee_5_RefCurrency',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Fee_1_Option_Name',
        column: 'TC_Fee_1_Option_Name',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Fee_2_Option_Name',
        column: 'TC_Fee_2_Option_Name',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Fee_3_Option_Name',
        column: 'TC_Fee_3_Option_Name',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Fee_4_Option_Name',
        column: 'TC_Fee_4_Option_Name',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Fee_5_Option_Name',
        column: 'TC_Fee_5_Option_Name',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Fee_1_Name',
        column: 'TC_Fee_1_Name',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Fee_2_Name',
        column: 'TC_Fee_2_Name',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Fee_3_Name',
        column: 'TC_Fee_3_Name',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Fee_4_Name',
        column: 'TC_Fee_4_Name',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Fee_5_Name',
        column: 'TC_Fee_5_Name',
        type: 'text' as FieldType,
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
        field: 'TC_Kpi',
        column: 'TC_Kpi',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Kpi_CostPer',
        column: 'TC_Kpi_CostPer',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Kpi_Volume',
        column: 'TC_Kpi_Volume',
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
        field: 'TC_Tags',
        column: 'TC_Tags',
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
        field: 'TC_Media_Budget_RefCurrency',
        column: 'TC_Media_Budget_RefCurrency',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Client_Budget',
        column: 'TC_Client_Budget',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Client_Budget_RefCurrency',
        column: 'TC_Client_Budget_RefCurrency',
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
      {
        field: 'TC_MPA',
        column: 'TC_MPA',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Spec_Name',
        column: 'TC_CR_Spec_Name',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Spec_Format',
        column: 'TC_CR_Spec_Format',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Spec_Ratio',
        column: 'TC_CR_Spec_Ratio',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Spec_FileType',
        column: 'TC_CR_Spec_FileType',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Spec_MaxWeight',
        column: 'TC_CR_Spec_MaxWeight',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Spec_Weight',
        column: 'TC_CR_Spec_Weight',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Spec_Animation',
        column: 'TC_CR_Spec_Animation',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Spec_Title',
        column: 'TC_CR_Spec_Title',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Spec_Text',
        column: 'TC_CR_Spec_Text',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Spec_SpecSheetLink',
        column: 'TC_CR_Spec_SpecSheetLink',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Spec_Notes',
        column: 'TC_CR_Spec_Notes',
        type: 'text' as FieldType,
      },       
      {
        field: 'TC_CM360_Rate',
        column: 'TC_CM360_Rate',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_CM360_Volume',
        column: 'TC_CM360_Volume',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Buy_Type',
        column: 'TC_Buy_Type',
        type: 'text' as FieldType,
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
      {
        field: 'PL_Plateforme_1_Title',
        column: 'PL_Plateforme_1_Title',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Plateforme_1',
        column: 'PL_Plateforme_1',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Plateforme_2_Title',
        column: 'PL_Plateforme_2_Title',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Plateforme_2',
        column: 'PL_Plateforme_2',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Plateforme_3_Title',
        column: 'PL_Plateforme_3_Title',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Plateforme_3',
        column: 'PL_Plateforme_3',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Plateforme_4_Title',
        column: 'PL_Plateforme_4_Title',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Plateforme_4',
        column: 'PL_Plateforme_4',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Tag_Type',
        column: 'PL_Tag_Type',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_VPAID',
        column: 'PL_VPAID',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Third_Party_Measurement',
        column: 'PL_Third_Party_Measurement',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Floodlight',
        column: 'PL_Floodlight',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Tag_Start_Date',
        column: 'PL_CR_Tag_Start_Date',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Tag_End_Date',
        column: 'PL_CR_Tag_End_Date',
        type: 'text' as FieldType,
      },
      {
        field: 'PL_Creative_Rotation_Type',
        column: 'PL_CR_Rotation',
        type: 'text' as FieldType,
      }
      
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
        field: 'CR_Spec_Name',
        column: 'TC_CR_Spec_Name',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Spec_Format',
        column: 'TC_CR_Spec_Format',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Spec_Ratio',
        column: 'TC_CR_Spec_Ratio',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Spec_FileType',
        column: 'TC_CR_Spec_FileType',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Spec_MaxWeight',
        column: 'TC_CR_Spec_MaxWeight',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Spec_Weight',
        column: 'TC_CR_Spec_Weight',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Spec_Animation',
        column: 'TC_CR_Spec_Animation',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Spec_Title',
        column: 'TC_CR_Spec_Title',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Spec_Text',
        column: 'TC_CR_Spec_Text',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Spec_SpecSheetLink',
        column: 'TC_CR_Spec_SpecSheetLink',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Spec_Notes',
        column: 'TC_CR_Spec_Notes',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Plateforme_5_Title',
        column: 'CR_Plateforme_5_Title',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Plateforme_5',
        column: 'CR_Plateforme_5',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Plateforme_6_Title',
        column: 'CR_Plateforme_6_Title',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Plateforme_6',
        column: 'CR_Plateforme_6',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Tag_Start_Date',
        column: 'PL_CR_Tag_Start_Date',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Tag_End_Date',
        column: 'PL_CR_Tag_End_Date',
        type: 'text' as FieldType,
      },
      {
        field: 'CR_Rotation_Weight',
        column: 'PL_CR_Rotation',
        type: 'text' as FieldType,
      }

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