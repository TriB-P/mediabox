// app/config/documentMapping.ts

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

  // ==================== 1. IDENTIFICATION ====================
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

  // ==================== 2. ONGLET ====================
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

  // ==================== 3. SECTION ====================
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

  // ==================== 4. TACTIQUE ====================
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
        field: 'TC_BudgetChoice',
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
      
    ]
  } as SectionMapping,

  // ==================== 5. PLACEMENT ====================
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

  // ==================== 6. CRÉATIF ====================
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
      
    ]
  } as SectionMapping
};

// ==================== FONCTIONS UTILITAIRES ====================

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

export function getOrderedHeaders(): string[] {
  return getAllFieldMappings().map(field => field.column);
}

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

export function getFieldByColumn(column: string): (FieldMapping & { source: SourceLevel }) | null {
  const allFields = getAllFieldMappings();
  return allFields.find(field => field.column === column) || null;
}

export default documentMappingConfig;