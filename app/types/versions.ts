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
  quarter: string;
  year: number;
  po?: string;
  sprintDates?: string;
  createdAt: string;
  updatedAt: string;
  officialVersionId?: string;
  versions?: Version[]; // Optionnel pour l'affichage
}