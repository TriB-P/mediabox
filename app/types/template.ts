/**
 * Ce fichier définit les interfaces TypeScript pour les gabarits (templates)
 * et les données de formulaire associées. Il exporte également une liste
 * des langues disponibles pour ces gabarits.
 */
export interface Template {
  id: string;
  TE_Name: string;
  TE_URL: string;
  TE_Duplicate: boolean;
  TE_Language: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFormData {
  TE_Name: string;
  TE_URL: string;
  TE_Duplicate: boolean;
  TE_Language: string;
}

/**
* Cette constante exporte un tableau de chaînes de caractères
* représentant les langues disponibles pour les gabarits.
* @returns {string[]} Un tableau de noms de langues.
*/
export const LANGUAGES = [
  "Français",
  "Anglais"
];