/**
 * Ce fichier contient des fonctions pour gérer les invitations des utilisateurs
 * dans l'application. Il permet de créer, lire, mettre à jour et supprimer des invitations,
 * ainsi que de gérer le statut des utilisateurs (actifs ou invités) en interagissant avec Firebase Firestore.
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Invitation, InvitationFormData, UserWithStatus } from '../types/invitations';
import { getAllUsers } from './userService';

/**
 * Crée une nouvelle invitation pour un utilisateur.
 * @param invitationData Les données de l'invitation, incluant l'email et le rôle.
 * @param invitedBy L'identifiant de l'utilisateur qui a envoyé l'invitation.
 * @returns L'identifiant de la nouvelle invitation créée.
 */
export async function createInvitation(
  invitationData: InvitationFormData,
  invitedBy: string
): Promise<string> {
  try {
    const existingUsers = await getAllUsers();
    const existingUser = existingUsers.find(user => user.email === invitationData.email);

    if (existingUser) {
      throw new Error('Un utilisateur avec cette adresse email existe déjà');
    }

    const existingInvitation = await getInvitationByEmail(invitationData.email);
    if (existingInvitation && existingInvitation.status === 'pending') {
      throw new Error('Une invitation pendante existe déjà pour cette adresse email');
    }

    const invitationsCollection = collection(db, 'invitations');
    const newInvitationRef = doc(invitationsCollection);

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    const invitationDoc: Omit<Invitation, 'id'> = {
      email: invitationData.email.toLowerCase(),
      role: invitationData.role,
      status: 'pending',
      invitedBy: invitedBy,
      invitedAt: new Date().toISOString(),
      expiresAt: expirationDate.toISOString(),
    };

    console.log("FIREBASE: ÉCRITURE - Fichier: invitationService.ts - Fonction: createInvitation - Path: invitations");
    await setDoc(newInvitationRef, {
      ...invitationDoc,
      createdAt: serverTimestamp(),
    });

    return newInvitationRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de l\'invitation:', error);
    throw error;
  }
}

/**
 * Récupère toutes les invitations enregistrées.
 * @returns Un tableau de toutes les invitations.
 */
export async function getAllInvitations(): Promise<Invitation[]> {
  try {
    const invitationsCollection = collection(db, 'invitations');
    console.log("FIREBASE: LECTURE - Fichier: invitationService.ts - Fonction: getAllInvitations - Path: invitations");
    const snapshot = await getDocs(invitationsCollection);

    const invitations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        role: data.role || '',
        status: data.status || 'pending',
        invitedBy: data.invitedBy || '',
        invitedAt: data.invitedAt || '',
        acceptedAt: data.acceptedAt || undefined,
        expiresAt: data.expiresAt || '',
        note: data.note || '',
      } as Invitation;
    });

    return invitations;
  } catch (error) {
    console.error('Erreur lors de la récupération des invitations:', error);
    return [];
  }
}

/**
 * Récupère une invitation spécifique par son adresse email.
 * @param email L'adresse email de l'invitation à rechercher.
 * @returns L'invitation trouvée ou null si aucune invitation n'est trouvée.
 */
export async function getInvitationByEmail(email: string): Promise<Invitation | null> {
  try {
    const invitationsCollection = collection(db, 'invitations');
    const q = query(invitationsCollection, where('email', '==', email.toLowerCase()));
    console.log("FIREBASE: LECTURE - Fichier: invitationService.ts - Fonction: getInvitationByEmail - Path: invitations");
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      email: data.email || '',
      role: data.role || '',
      status: data.status || 'pending',
      invitedBy: data.invitedBy || '',
      invitedAt: data.invitedAt || '',
      acceptedAt: data.acceptedAt || undefined,
      expiresAt: data.expiresAt || '',
      note: data.note || '',
    } as Invitation;
  } catch (error) {
    console.error(`Erreur lors de la recherche d'invitation pour ${email}:`, error);
    return null;
  }
}

/**
 * Accepte une invitation et assigne le rôle correspondant à l'utilisateur.
 * Cette fonction est généralement appelée lors de la première connexion d'un utilisateur invité.
 * @param email L'adresse email de l'invitation à accepter.
 * @param userId L'identifiant de l'utilisateur qui accepte l'invitation.
 * @returns Une promesse vide.
 */
export async function acceptInvitation(email: string, userId: string): Promise<void> {
  try {
    const invitation = await getInvitationByEmail(email);
    if (!invitation) {
      return;
    }

    if (invitation.status !== 'pending') {
      return;
    }

    const now = new Date();
    const expirationDate = new Date(invitation.expiresAt);

    if (now > expirationDate) {
      await updateInvitation(invitation.id, { status: 'expired' });
      return;
    }

    await updateInvitation(invitation.id, {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    });

    const userRef = doc(db, 'users', userId);
    console.log("FIREBASE: ÉCRITURE - Fichier: invitationService.ts - Fonction: acceptInvitation - Path: users/${userId}");
    await updateDoc(userRef, {
      role: invitation.role,
      invitationAcceptedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Erreur lors de l'acceptation de l'invitation pour ${email}:`, error);
    throw error;
  }
}

/**
 * Met à jour une invitation existante avec de nouvelles données.
 * @param invitationId L'identifiant de l'invitation à mettre à jour.
 * @param updates Les champs à mettre à jour dans l'invitation.
 * @returns Une promesse vide.
 */
export async function updateInvitation(
  invitationId: string,
  updates: Partial<Invitation>
): Promise<void> {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);
    console.log("FIREBASE: ÉCRITURE - Fichier: invitationService.ts - Fonction: updateInvitation - Path: invitations/${invitationId}");
    await updateDoc(invitationRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'invitation ${invitationId}:`, error);
    throw error;
  }
}

/**
 * Supprime une invitation spécifique.
 * @param invitationId L'identifiant de l'invitation à supprimer.
 * @returns Une promesse vide.
 */
export async function deleteInvitation(invitationId: string): Promise<void> {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);
    console.log("FIREBASE: ÉCRITURE - Fichier: invitationService.ts - Fonction: deleteInvitation - Path: invitations/${invitationId}");
    await deleteDoc(invitationRef);
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'invitation ${invitationId}:`, error);
    throw error;
  }
}

/**
 * Récupère tous les utilisateurs avec leur statut (actif, invité, expiré).
 * @returns Un tableau d'objets UserWithStatus.
 */
export async function getAllUsersWithStatus(): Promise<UserWithStatus[]> {
  try {
    const activeUsers = await getAllUsers();

    const invitations = await getAllInvitations();

    const usersWithStatus: UserWithStatus[] = [];

    for (const user of activeUsers) {
      console.log("FIREBASE: LECTURE - Fichier: invitationService.ts - Fonction: getAllUsersWithStatus - Path: users/${user.id}");
      const userDoc = await getDoc(doc(db, 'users', user.id));
      const userData = userDoc.exists() ? userDoc.data() : {};

      const userInvitation = invitations.find(
        inv => inv.email === user.email && inv.status === 'accepted'
      );

      usersWithStatus.push({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: userData.role || 'user',
        status: 'active',
        acceptedAt: userInvitation?.acceptedAt,
        invitedAt: userInvitation?.invitedAt,
        invitedBy: userInvitation?.invitedBy,
        note: userInvitation?.note,
        lastLogin: userData.lastLogin?.toDate?.()?.toISOString() || userData.lastLogin,
      });
    }

    for (const invitation of invitations) {
      if (invitation.status === 'pending' || invitation.status === 'expired') {
        const existingUser = usersWithStatus.find(u => u.email === invitation.email);
        if (!existingUser) {
          usersWithStatus.push({
            id: `invitation-${invitation.id}`,
            email: invitation.email,
            displayName: invitation.email.split('@')[0],
            role: invitation.role,
            status: invitation.status === 'pending' ? 'invited' : 'expired',
            invitedAt: invitation.invitedAt,
            invitedBy: invitation.invitedBy,
            note: invitation.note,
          });
        }
      }
    }

    return usersWithStatus.sort((a, b) => a.email.localeCompare(b.email));
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs avec statut:', error);
    return [];
  }
}

/**
 * Supprime un utilisateur ou une invitation. Si l'utilisateur est actif, son rôle est désactivé.
 * Si c'est une invitation, l'invitation est supprimée.
 * @param userWithStatus L'objet UserWithStatus représentant l'utilisateur ou l'invitation à supprimer.
 * @returns Une promesse vide.
 */
export async function removeUser(userWithStatus: UserWithStatus): Promise<void> {
  try {
    if (userWithStatus.status === 'active') {
      const userRef = doc(db, 'users', userWithStatus.id);
      console.log("FIREBASE: ÉCRITURE - Fichier: invitationService.ts - Fonction: removeUser - Path: users/${userWithStatus.id}");
      await updateDoc(userRef, {
        role: null,
        deactivatedAt: serverTimestamp(),
        deactivatedBy: 'admin',
      });
    } else {
      const invitation = await getInvitationByEmail(userWithStatus.email);
      if (invitation) {
        await deleteInvitation(invitation.id);
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'utilisateur ${userWithStatus.email}:`, error);
    throw error;
  }
}