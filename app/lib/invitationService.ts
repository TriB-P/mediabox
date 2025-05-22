// app/lib/invitationService.ts

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
    Timestamp,
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { Invitation, InvitationFormData, UserWithStatus } from '../types/invitations';
  import { getAllUsers } from './userService';
  
  // Créer une nouvelle invitation
  export async function createInvitation(
    invitationData: InvitationFormData,
    invitedBy: string
  ): Promise<string> {
    try {
      console.log('Création d\'une nouvelle invitation:', invitationData);
      
      // Vérifier si l'utilisateur existe déjà
      const existingUsers = await getAllUsers();
      const existingUser = existingUsers.find(user => user.email === invitationData.email);
      
      if (existingUser) {
        throw new Error('Un utilisateur avec cette adresse email existe déjà');
      }
      
      // Vérifier si une invitation pendante existe déjà
      const existingInvitation = await getInvitationByEmail(invitationData.email);
      if (existingInvitation && existingInvitation.status === 'pending') {
        throw new Error('Une invitation pendante existe déjà pour cette adresse email');
      }
      
      // Créer l'invitation
      const invitationsCollection = collection(db, 'invitations');
      const newInvitationRef = doc(invitationsCollection);
      
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // Expire dans 7 jours
      
      const invitationDoc: Omit<Invitation, 'id'> = {
        email: invitationData.email.toLowerCase(),
        role: invitationData.role,
        status: 'pending',
        invitedBy: invitedBy,
        invitedAt: new Date().toISOString(),
        expiresAt: expirationDate.toISOString(),
      };
      
      await setDoc(newInvitationRef, {
        ...invitationDoc,
        createdAt: serverTimestamp(),
      });
      
      console.log(`Invitation créée avec l'ID: ${newInvitationRef.id}`);
      return newInvitationRef.id;
    } catch (error) {
      console.error('Erreur lors de la création de l\'invitation:', error);
      throw error;
    }
  }
  
  // Récupérer toutes les invitations
  export async function getAllInvitations(): Promise<Invitation[]> {
    try {
      console.log('Récupération de toutes les invitations...');
      const invitationsCollection = collection(db, 'invitations');
      const snapshot = await getDocs(invitationsCollection);
      
      console.log(`Nombre d'invitations trouvées: ${snapshot.size}`);
      
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
  
  // Récupérer une invitation par email
  export async function getInvitationByEmail(email: string): Promise<Invitation | null> {
    try {
      console.log(`Recherche d'invitation pour l'email: ${email}`);
      const invitationsCollection = collection(db, 'invitations');
      const q = query(invitationsCollection, where('email', '==', email.toLowerCase()));
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
  
  // Accepter une invitation (appelé lors de la première connexion)
  export async function acceptInvitation(email: string, userId: string): Promise<void> {
    try {
      console.log(`Acceptation de l'invitation pour: ${email}`);
      
      const invitation = await getInvitationByEmail(email);
      if (!invitation) {
        console.log(`Aucune invitation trouvée pour ${email}`);
        return;
      }
      
      if (invitation.status !== 'pending') {
        console.log(`L'invitation pour ${email} n'est pas en attente`);
        return;
      }
      
      // Vérifier si l'invitation n'a pas expiré
      const now = new Date();
      const expirationDate = new Date(invitation.expiresAt);
      
      if (now > expirationDate) {
        console.log(`L'invitation pour ${email} a expiré`);
        await updateInvitation(invitation.id, { status: 'expired' });
        return;
      }
      
      // Marquer l'invitation comme acceptée
      await updateInvitation(invitation.id, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
      });
      
      // Assigner le rôle à l'utilisateur
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: invitation.role,
        invitationAcceptedAt: serverTimestamp(),
      });
      
      console.log(`Invitation acceptée pour ${email}, rôle assigné: ${invitation.role}`);
    } catch (error) {
      console.error(`Erreur lors de l'acceptation de l'invitation pour ${email}:`, error);
      throw error;
    }
  }
  
  // Mettre à jour une invitation
  export async function updateInvitation(
    invitationId: string,
    updates: Partial<Invitation>
  ): Promise<void> {
    try {
      console.log(`Mise à jour de l'invitation ${invitationId}:`, updates);
      const invitationRef = doc(db, 'invitations', invitationId);
      
      await updateDoc(invitationRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      console.log(`Invitation ${invitationId} mise à jour`);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'invitation ${invitationId}:`, error);
      throw error;
    }
  }
  
  // Supprimer une invitation
  export async function deleteInvitation(invitationId: string): Promise<void> {
    try {
      console.log(`Suppression de l'invitation ${invitationId}`);
      const invitationRef = doc(db, 'invitations', invitationId);
      await deleteDoc(invitationRef);
      
      console.log(`Invitation ${invitationId} supprimée`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'invitation ${invitationId}:`, error);
      throw error;
    }
  }
  
  // Récupérer tous les utilisateurs avec leur statut (actif/invité)
  export async function getAllUsersWithStatus(): Promise<UserWithStatus[]> {
    try {
      console.log('Récupération de tous les utilisateurs avec statut...');
      
      // Récupérer tous les utilisateurs actifs
      const activeUsers = await getAllUsers();
      
      // Récupérer toutes les invitations
      const invitations = await getAllInvitations();
      
      const usersWithStatus: UserWithStatus[] = [];
      
      // Ajouter les utilisateurs actifs
      for (const user of activeUsers) {
        // Récupérer le rôle de l'utilisateur
        const userDoc = await getDoc(doc(db, 'users', user.id));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        // Chercher si cet utilisateur avait une invitation
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
      
      // Ajouter les invitations pendantes et expirées
      for (const invitation of invitations) {
        if (invitation.status === 'pending' || invitation.status === 'expired') {
          // Vérifier si ce n'est pas déjà un utilisateur actif
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
      
      console.log(`Total utilisateurs avec statut: ${usersWithStatus.length}`);
      return usersWithStatus.sort((a, b) => a.email.localeCompare(b.email));
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs avec statut:', error);
      return [];
    }
  }
  
  // Supprimer un utilisateur (actif ou invitation)
  export async function removeUser(userWithStatus: UserWithStatus): Promise<void> {
    try {
      console.log('Suppression de l\'utilisateur:', userWithStatus.email);
      
      if (userWithStatus.status === 'active') {
        // Pour un utilisateur actif, on ne peut pas le supprimer de Firebase Auth
        // On peut seulement retirer son rôle ou le désactiver
        const userRef = doc(db, 'users', userWithStatus.id);
        await updateDoc(userRef, {
          role: null,
          deactivatedAt: serverTimestamp(),
          deactivatedBy: 'admin', // TODO: récupérer l'admin actuel
        });
        
        console.log(`Utilisateur ${userWithStatus.email} désactivé`);
      } else {
        // Pour une invitation pendante ou expirée, on supprime l'invitation
        const invitation = await getInvitationByEmail(userWithStatus.email);
        if (invitation) {
          await deleteInvitation(invitation.id);
          console.log(`Invitation supprimée pour ${userWithStatus.email}`);
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'utilisateur ${userWithStatus.email}:`, error);
      throw error;
    }
  }