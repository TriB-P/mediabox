// app/types/template.ts

/**
 * Ce fichier définit les interfaces TypeScript pour les gabarits (templates)
 * et les données de formulaire associées. Il exporte également une liste
 * des langues disponibles pour ces gabarits.
 * MODIFIÉ: Utilisation directe des codes "EN" et "FR"
 * NOUVEAU: Ajout du champ templateType avec les types de templates disponibles
 */

/**
 * Types de templates disponibles
 */
export const TEMPLATE_TYPES = [
  'Media Plan',
  'MPA',
  'Name Sheet',
  'Spec Sheet',
  'Other'
] as const;

/**
 * Type pour les types de template supportés
 */
export type TemplateType = typeof TEMPLATE_TYPES[number];

export interface Template {
  id: string;
  TE_Name: string;
  TE_URL: string;
  TE_Duplicate: boolean;
  TE_Language: 'EN' | 'FR';
  TE_Type: TemplateType; // NOUVEAU: Type de template
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFormData {
  TE_Name: string;
  TE_URL: string;
  TE_Duplicate: boolean;
  TE_Language: 'EN' | 'FR';
  TE_Type: TemplateType; // NOUVEAU: Type de template
}

/**
* Langues disponibles pour les templates (codes directs)
*/
export const LANGUAGES = ['FR', 'EN'] as const;

/**
 * Type pour les codes de langue supportés
 */
export type LanguageCode = 'EN' | 'FR';