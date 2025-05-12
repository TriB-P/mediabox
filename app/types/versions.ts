// Types pour les versions de mix de tactiques

export interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string; // ISO string
  createdBy: string; // Email de l'utilisateur
}

export interface VersionFormData {
  name: string;
}

// Extension du type Campaign pour inclure les versions
export interface CampaignWithVersions {
  id: string;
  name: string;
  status: 'Draft' | 'Cancelled' | 'Done' | 'Active' | 'Planned';
  budget: number;
  startDate: string;
  endDate: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Full Year';
  year: number;
  po?: string;
  sprintDates?: string;
  createdAt: string;
  updatedAt: string;
  officialVersionId?: string;
  versions?: Version[]; // Optionnel pour l'affichage
}