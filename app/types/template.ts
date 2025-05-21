// Types pour les gabarits

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
  
  // Liste des langues disponibles
  export const LANGUAGES = [
    "Français",
    "Anglais"
  ];