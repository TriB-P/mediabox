// Types pour l'authentification et la gestion des clients

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

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface ClientContextType {
  availableClients: Client[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client) => void;
  loading: boolean;
}