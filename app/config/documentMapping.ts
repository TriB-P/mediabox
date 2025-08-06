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
        column: 'Label',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Budget_Mode',
        column: 'Type de budget',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_BuyCurrency',
        column: 'Devise',
        type: 'text' as FieldType,
      },
      {
        field: 'TC_Order',
        column: 'Order',
        type: 'number' as FieldType,
      },
      {
        field: 'TC_Unit_Volume',
        column: 'Volume unité',
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