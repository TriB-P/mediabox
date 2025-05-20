// Types pour les taxonomies

export interface Taxonomy {
    id: string;
    NA_Display_Name: string;
    NA_Description: string;
    NA_Standard: boolean;
    NA_Name_Level_1: string;
    NA_Name_Level_2: string;
    NA_Name_Level_3: string;
    NA_Name_Level_4: string;
    NA_Name_Level_5: string;
    NA_Name_Level_6: string;
    NA_Name_Level_1_Title: string;
    NA_Name_Level_2_Title: string;
    NA_Name_Level_3_Title: string;
    NA_Name_Level_4_Title: string;
    NA_Name_Level_5_Title: string;
    NA_Name_Level_6_Title: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface TaxonomyFormData {
    NA_Display_Name: string;
    NA_Description: string;
    NA_Standard: boolean;
    NA_Name_Level_1: string;
    NA_Name_Level_2: string;
    NA_Name_Level_3: string;
    NA_Name_Level_4: string;
    NA_Name_Level_5: string;
    NA_Name_Level_6: string;
    NA_Name_Level_1_Title: string;
    NA_Name_Level_2_Title: string;
    NA_Name_Level_3_Title: string;
    NA_Name_Level_4_Title: string;
    NA_Name_Level_5_Title: string;
    NA_Name_Level_6_Title: string;
  }