// app/types/roles.ts

export interface Role {
    id: string;
    name: string;
    // Permissions basées sur votre image et votre contexte existant
    Access: boolean;
    ClientInfo: boolean;
    CostGuide: boolean;
    Currency: boolean;
    CustomCodes: boolean;
    Dimensions: boolean;
    Fees: boolean;
    Listes: boolean; // Correspond à votre contexte existant
    Taxonomy: boolean;
    Templates: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface RoleFormData {
    name: string;
    Access: boolean;
    ClientInfo: boolean;
    CostGuide: boolean;
    Currency: boolean;
    CustomCodes: boolean;
    Dimensions: boolean;
    Fees: boolean;
    Listes: boolean; // Correspond à votre contexte existant
    Taxonomy: boolean;
    Templates: boolean;
  }
  
  // Type pour les permissions utilisateur étendues
  export interface UserPermissionExtended {
    clientId: string;
    CL_Name: string;
    CL_Logo?: string;
    role: string; // Maintenant peut être n'importe quel rôle défini dans la collection roles
    grantedAt?: any;
  }