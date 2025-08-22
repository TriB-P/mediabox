/**
 * Ce fichier définit les interfaces TypeScript pour les gabarits (templates)
 * et les données de formulaire associées. Il exporte également une liste
 * des langues disponibles pour ces gabarits.
 * MODIFIÉ: Utilisation directe des codes "EN" et "FR"
 */
export interface Template {
  id: string;
  TE_Name: string;
  TE_URL: string;
  TE_Duplicate: boolean;
  TE_Language: 'EN' | 'FR';
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFormData {
  TE_Name: string;
  TE_URL: string;
  TE_Duplicate: boolean;
  TE_Language: 'EN' | 'FR';
}

/**
* Langues disponibles pour les templates (codes directs)
*/
export const LANGUAGES = ['FR', 'EN'] as const;

/**
 * Type pour les codes de langue supportés
 */
export type LanguageCode = 'EN' | 'FR';