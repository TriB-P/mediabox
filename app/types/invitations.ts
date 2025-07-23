/**
 * Ce fichier définit les interfaces TypeScript pour les invitations et les données utilisateur.
 * Il permet de s'assurer que les données manipulées dans l'application, notamment celles liées aux invitations
 * envoyées aux utilisateurs et à leur statut, respectent une structure cohérente.
 * Ces interfaces sont utilisées pour typer les objets lors de la création, la lecture et la mise à jour
 * des invitations et des informations utilisateur dans la base de données ou lors de l'affichage.
 */
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

/**
 * Définit la structure des données d'un utilisateur avec son statut,
 * utilisée principalement pour l'affichage dans les tableaux de l'interface utilisateur.
 * @property {string} id - L'identifiant unique de l'utilisateur.
 * @property {string} email - L'adresse email de l'utilisateur.
 * @property {string} displayName - Le nom affiché de l'utilisateur.
 * @property {string} [photoURL] - L'URL de la photo de profil de l'utilisateur (optionnel).
 * @property {string} [role] - Le rôle de l'utilisateur (optionnel).
 * @property {'active' | 'invited' | 'expired'} status - Le statut actuel de l'utilisateur (actif, invité, ou expiré).
 * @property {string} [invitedAt] - La date à laquelle l'utilisateur a été invité (optionnel).
 * @property {string} [acceptedAt] - La date à laquelle l'invitation a été acceptée (optionnel).
 * @property {string} [lastLogin] - La date de la dernière connexion de l'utilisateur (optionnel).
 * @property {string} [invitedBy] - L'email de l'administrateur qui a envoyé l'invitation (optionnel).
 * @property {string} [note] - Une note additionnelle concernant l'invitation ou l'utilisateur (optionnel).
 */
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