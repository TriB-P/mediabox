/**
 * Ce fichier définit les interfaces TypeScript utilisées pour structurer les données
 * relatives aux versions de mix tactique et aux campagnes associées.
 * Il permet d'assurer la cohérence des types de données dans l'application,
 * notamment lors des interactions avec Firebase.
 */

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

/**
 * Interface qui étend le type Campaign pour inclure les informations sur les versions.
 * @param id: L'identifiant unique de la campagne.
 * @param name: Le nom de la campagne.
 * @param status: Le statut actuel de la campagne (Draft, Cancelled, Done, Active, Planned).
 * @param budget: Le budget alloué à la campagne.
 * @param startDate: La date de début de la campagne (format string).
 * @param endDate: La date de fin de la campagne (format string).
 * @param quarter: Le trimestre de la campagne.
 * @param year: L'année de la campagne.
 * @param po: Le numéro de bon de commande (optionnel).
 * @param sprintDates: Les dates de sprint (optionnel).
 * @param createdAt: La date de création de la campagne.
 * @param updatedAt: La date de dernière mise à jour de la campagne.
 * @param officialVersionId: L'identifiant de la version officielle (optionnel).
 * @param versions: Un tableau des versions associées à la campagne (optionnel pour l'affichage).
 * @returns Retourne un objet de type Campaign avec les détails des versions.
 */
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