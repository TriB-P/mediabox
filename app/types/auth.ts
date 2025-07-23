/**
 * Ce fichier définit les interfaces TypeScript utilisées pour la gestion de l'authentification
 * des utilisateurs et la structuration des données des clients et de leurs permissions.
 * Il sert de contrat pour les objets manipulés dans l'application, assurant la cohérence
 * des types à travers le projet.
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface Client {
  id: string;
  name: string;
  logoUrl?: string;
  createdAt: Date;
  active: boolean;
}

export interface UserPermission {
  userId: string;
  clientId: string;
  role: 'admin' | 'editor' | 'viewer';
  grantedAt: Date;
  grantedBy: string;
}

/**
 * Interface pour le contexte d'authentification.
 * @property {User | null} user - L'utilisateur actuellement connecté, ou null si personne n'est connecté.
 * @property {boolean} loading - Indique si une opération d'authentification est en cours.
 * @property {() => Promise<void>} signInWithGoogle - Fonction pour connecter l'utilisateur via Google.
 * @property {() => Promise<void>} signOut - Fonction pour déconnecter l'utilisateur.
 * @returns {Promise<void>} Une promesse qui se résout une fois l'opération terminée.
 */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Interface pour le contexte des clients.
 * @property {Client[]} availableClients - Liste de tous les clients disponibles pour l'utilisateur.
 * @property {Client | null} selectedClient - Le client actuellement sélectionné par l'utilisateur, ou null si aucun n'est sélectionné.
 * @property {(client: Client) => void} setSelectedClient - Fonction pour définir le client sélectionné.
 * @property {boolean} loading - Indique si les données des clients sont en cours de chargement.
 * @returns {void} Ne retourne rien.
 */
export interface ClientContextType {
  availableClients: Client[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client) => void;
  loading: boolean;
}