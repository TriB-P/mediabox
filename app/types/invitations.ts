// app/types/invitations.ts

export interface Invitation {
    id: string;
    email: string;
    role: string; // Référence à un rôle dans la collection 'roles'
    status: 'pending' | 'accepted' | 'expired';
    invitedBy: string; // Email de l'administrateur qui a envoyé l'invitation
    invitedAt: string; // Date d'invitation
    acceptedAt?: string; // Date d'acceptation (optionnel)
    expiresAt: string; // Date d'expiration
    note?: string; // Note optionnelle
  }
  
  export interface InvitationFormData {
    email: string;
    role: string;
  }
  
  // Type pour l'affichage dans le tableau
  export interface UserWithStatus {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role?: string;
    status: 'active' | 'invited' | 'expired';
    invitedAt?: string;
    acceptedAt?: string;
    lastLogin?: string;
    invitedBy?: string;
    note?: string;
  }