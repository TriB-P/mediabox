// app/lib/invitationService.ts

/**
 * Ce fichier contient des fonctions pour gérer les invitations des utilisateurs
 * dans l'application. Il permet de créer, lire, mettre à jour et supprimer des invitations,
 * ainsi que de gérer le statut des utilisateurs (actifs ou invités) en interagissant avec Firebase Firestore.
 * VERSION OPTIMISÉE pour éviter les requêtes multiples dans getAllUsersWithStatus.
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

// Export du type pour les autres fichiers
export type { UserWithStatus } from '../types/invitations';

// Interface pour utilisateur avec données complètes
interface UserWithFullData {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: string;
  lastLogin?: string;
}

/**
 * VERSION OPTIMISÉE - Récupère tous les utilisateurs avec leurs données complètes en une seule requête.
 * @returns {Promise<UserWithFullData[]>} Un tableau de tous les utilisateurs avec données complètes.
 */
async function getAllUsersWithFullData(): Promise<UserWithFullData[]> {
  try {
    const usersCollection = collection(db, 'users');
    console.log("FIREBASE: LECTURE - Fichier: invitationService.ts - Fonction: getAllUsersWithFullData - Path: users");
    const snapshot = await getDocs(usersCollection);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        displayName: data.displayName || data.email || 'Utilisateur inconnu',
        photoURL: data.photoURL,
        role: data.role || 'user',
        lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin,
      } as UserWithFullData;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs avec données complètes:', error);
    return [];
  }
}

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
    const existingUsers = await getAllUsersWithFullData();
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
 * VERSION OPTIMISÉE - Récupère tous les utilisateurs avec leur statut (actif, invité, expiré).
 * PERFORMANCE: Supprime la boucle de 86 requêtes individuelles, réduit à 2 requêtes total.
 * @returns Un tableau d'objets UserWithStatus.
 */
export async function getAllUsersWithStatus(): Promise<UserWithStatus[]> {
  try {
    // ÉTAPE 1: Récupérer tous les utilisateurs actifs avec leurs données complètes (1 requête)
    const activeUsers = await getAllUsersWithFullData();

    // ÉTAPE 2: Récupérer toutes les invitations (1 requête)
    const invitations = await getAllInvitations();

    const usersWithStatus: UserWithStatus[] = [];

    // ÉTAPE 3: Traiter les utilisateurs actifs (SANS boucle de requêtes individuelles !)
    for (const user of activeUsers) {
      const userInvitation = invitations.find(
        inv => inv.email === user.email && inv.status === 'accepted'
      );

      usersWithStatus.push({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role || 'user', // Données déjà disponibles !
        status: 'active',
        acceptedAt: userInvitation?.acceptedAt,
        invitedAt: userInvitation?.invitedAt,
        invitedBy: userInvitation?.invitedBy,
        note: userInvitation?.note,
        lastLogin: user.lastLogin, // Données déjà disponibles !
      });
    }

    // ÉTAPE 4: Traiter les invitations en attente ou expirées
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
 * Nettoie toutes les permissions d'un utilisateur dans la collection userPermissions.
 * Supprime le document principal de l'utilisateur dans userPermissions (avec toutes ses sous-collections).
 * @param userEmail L'email de l'utilisateur dont il faut nettoyer les permissions.
 * @returns Une promesse vide.
 */
async function cleanupUserPermissions(userEmail: string): Promise<void> {
  try {
    // Récupérer tous les documents de la sous-collection 'clients' pour cet utilisateur
    const clientsCollection = collection(db, 'userPermissions', userEmail, 'clients');
    console.log(`FIREBASE: LECTURE - Fichier: invitationService.ts - Fonction: cleanupUserPermissions - Path: userPermissions/${userEmail}/clients`);
    const clientsSnapshot = await getDocs(clientsCollection);

    // Supprimer tous les documents de la sous-collection 'clients'
    const deletePromises = clientsSnapshot.docs.map(clientDoc => {
      console.log(`FIREBASE: ÉCRITURE - Fichier: invitationService.ts - Fonction: cleanupUserPermissions - Path: userPermissions/${userEmail}/clients/${clientDoc.id}`);
      return deleteDoc(clientDoc.ref);
    });

    await Promise.all(deletePromises);

    // Supprimer le document parent de userPermissions
    const userPermissionRef = doc(db, 'userPermissions', userEmail);
    console.log(`FIREBASE: ÉCRITURE - Fichier: invitationService.ts - Fonction: cleanupUserPermissions - Path: userPermissions/${userEmail}`);
    await deleteDoc(userPermissionRef);

  } catch (error) {
    console.error(`Erreur lors du nettoyage des permissions pour ${userEmail}:`, error);
    // On ne relance pas l'erreur pour ne pas empêcher la suppression de l'utilisateur principal
  }
}

/**
 * Supprime complètement un utilisateur ou une invitation de Firestore.
 * Pour les utilisateurs actifs, supprime le document users ET nettoie les permissions.
 * Pour les invitations, supprime l'invitation de la collection invitations.
 * @param userWithStatus L'objet UserWithStatus représentant l'utilisateur ou l'invitation à supprimer.
 * @returns Une promesse vide.
 */
export async function removeUser(userWithStatus: UserWithStatus): Promise<void> {
  try {
    if (userWithStatus.status === 'active') {
      // Suppression complète de l'utilisateur actif
      const userRef = doc(db, 'users', userWithStatus.id);
      console.log(`FIREBASE: ÉCRITURE - Fichier: invitationService.ts - Fonction: removeUser - Path: users/${userWithStatus.id}`);
      await deleteDoc(userRef);

      // Nettoyage des permissions utilisateur
      await cleanupUserPermissions(userWithStatus.email);
      
    } else {
      // Suppression de l'invitation (invited ou expired)
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