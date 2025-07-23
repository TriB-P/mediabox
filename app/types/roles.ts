/**
 * Ce fichier définit les interfaces TypeScript pour les rôles et les permissions.
 * Il inclut la structure d'un rôle avec ses permissions spécifiques,
 * la structure des données de formulaire pour créer ou modifier un rôle,
 * et une interface étendue pour les permissions utilisateur, incluant les détails du client associé.
 */
export interface Role {
  id: string;
  name: string;
  Access: boolean;
  ClientInfo: boolean;
  CostGuide: boolean;
  Currency: boolean;
  CustomCodes: boolean;
  Dimensions: boolean;
  Fees: boolean;
  Listes: boolean;
  Taxonomy: boolean;
  Templates: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Définit la structure des données utilisées lors de la création ou la mise à jour d'un rôle.
 * Les champs sont les mêmes que ceux de l'interface Role, à l'exception de l'id, createdAt et updatedAt.
 */
export interface RoleFormData {
  name: string;
  Access: boolean;
  ClientInfo: boolean;
  CostGuide: boolean;
  Currency: boolean;
  CustomCodes: boolean;
  Dimensions: boolean;
  Fees: boolean;
  Listes: boolean;
  Taxonomy: boolean;
  Templates: boolean;
}

/**
 * Définit la structure des permissions utilisateur étendues.
 * Inclut l'ID du client, le nom du client, un logo optionnel, le rôle attribué et la date d'attribution.
 */
export interface UserPermissionExtended {
  clientId: string;
  CL_Name: string;
  CL_Logo?: string;
  role: string;
  grantedAt?: any;
}