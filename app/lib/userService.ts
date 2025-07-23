/**
 * Ce fichier contient des fonctions pour gérer les utilisateurs et leurs permissions d'accès aux clients dans Firebase Firestore.
 * Il permet de récupérer des informations sur les utilisateurs, de gérer les accès spécifiques aux clients (ajout, mise à jour, suppression),
 * et de s'assurer de la traçabilité des interactions avec la base de données.
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

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface UserAccess {
  userId: string;
  userEmail: string;
  displayName: string;
  photoURL?: string;
  accessLevel: 'editor' | 'user';
  note: string;
}

/**
 * Récupère tous les utilisateurs enregistrés dans le système.
 * @returns {Promise<User[]>} Une promesse qui résout en un tableau d'objets User.
 * Retourne un tableau vide en cas d'erreur.
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const usersCollection = collection(db, 'users');
    console.log("FIREBASE: LECTURE - Fichier: code-cleaner.js - Fonction: getAllUsers - Path: users");
    const snapshot = await getDocs(usersCollection);

    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        displayName: data.displayName || data.email || 'Utilisateur sans nom',
        photoURL: data.photoURL,
      } as User;
    });

    return users;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return [];
  }
}

/**
 * Récupère tous les utilisateurs ayant un accès spécifique à un client donné.
 * Cette fonction parcourt toutes les permissions utilisateur pour trouver les accès client.
 * @param {string} clientId L'ID du client pour lequel récupérer les utilisateurs.
 * @returns {Promise<UserAccess[]>} Une promesse qui résout en un tableau d'objets UserAccess.
 * Retourne un tableau vide en cas d'erreur.
 */
export async function getClientUsers(clientId: string): Promise<UserAccess[]> {
  try {
    const userPermissionsCollection = collection(db, 'userPermissions');
    console.log("FIREBASE: LECTURE - Fichier: code-cleaner.js - Fonction: getClientUsers - Path: userPermissions");
    const allUserPermissions = await getDocs(userPermissionsCollection);

    const clientUsers: UserAccess[] = [];

    for (const userPermDoc of allUserPermissions.docs) {
      const userEmail = userPermDoc.id;
      try {
        const clientsCollection = collection(db, 'userPermissions', userEmail, 'clients');
        console.log(`FIREBASE: LECTURE - Fichier: code-cleaner.js - Fonction: getClientUsers - Path: userPermissions/${userEmail}/clients`);
        const clientsSnapshot = await getDocs(clientsCollection);

        const clientAccess = clientsSnapshot.docs.find(doc => doc.id === clientId);

        if (clientAccess) {
          const userData = await getUserByEmail(userEmail);

          if (userData) {
            clientUsers.push({
              userId: userData.id,
              userEmail: userEmail,
              displayName: userData.displayName,
              photoURL: userData.photoURL,
              accessLevel: clientAccess.data().role || 'user',
              note: clientAccess.data().note || ''
            });
          } else {
            console.log(`Impossible de trouver les infos pour l'utilisateur ${userEmail}`);
          }
        }
      } catch (err) {
        console.error(`Erreur lors de la vérification de l'accès pour ${userEmail}:`, err);
      }
    }

    return clientUsers;
  } catch (error) {
    console.error(`Erreur lors de la récupération des utilisateurs pour le client ${clientId}:`, error);
    return [];
  }
}

/**
 * Fonction d'aide interne pour récupérer les informations d'un utilisateur par son email.
 * @param {string} email L'adresse email de l'utilisateur à rechercher.
 * @returns {Promise<User | null>} Une promesse qui résout en un objet User si trouvé, ou un objet User virtuel si non trouvé, ou null en cas d'erreur.
 */
async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', email));
    console.log("FIREBASE: LECTURE - Fichier: code-cleaner.js - Fonction: getUserByEmail - Path: users (email)");
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        id: 'virtual-' + email,
        email: email,
        displayName: email.split('@')[0] || email,
      };
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    return {
      id: userDoc.id,
      email: userData.email || email,
      displayName: userData.displayName || email,
      photoURL: userData.photoURL,
    };
  } catch (error) {
    console.error(`Erreur lors de la recherche de l'utilisateur par email ${email}:`, error);
    return null;
  }
}

/**
 * Ajoute un accès pour un utilisateur à un client spécifique.
 * @param {string} clientId L'ID du client.
 * @param {string} clientName Le nom du client.
 * @param {object} userData Les données de l'utilisateur incluant userId, userEmail, accessLevel et note.
 * @returns {Promise<void>} Une promesse qui résout lorsque l'accès est ajouté.
 * Lance une erreur en cas d'échec.
 */
export async function addUserAccess(
  clientId: string,
  clientName: string,
  userData: {
    userId: string;
    userEmail: string;
    accessLevel: 'editor' | 'user';
    note: string;
  }
): Promise<void> {
  try {
    const userClientRef = doc(db, 'userPermissions', userData.userEmail, 'clients', clientId);
    console.log(`FIREBASE: ÉCRITURE - Fichier: code-cleaner.js - Fonction: addUserAccess - Path: userPermissions/${userData.userEmail}/clients/${clientId}`);
    await setDoc(userClientRef, {
      clientId: clientId,
      CL_Name: clientName,
      role: userData.accessLevel,
      note: userData.note,
      grantedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'accès utilisateur:', error);
    throw error;
  }
}

/**
 * Met à jour l'accès d'un utilisateur à un client spécifique.
 * @param {string} clientId L'ID du client.
 * @param {string} userEmail L'adresse email de l'utilisateur.
 * @param {object} updates Les champs à mettre à jour (accessLevel, note).
 * @returns {Promise<void>} Une promesse qui résout lorsque l'accès est mis à jour.
 * Lance une erreur en cas d'échec.
 */
export async function updateUserAccess(
  clientId: string,
  userEmail: string,
  updates: {
    accessLevel?: 'editor' | 'user';
    note?: string;
  }
): Promise<void> {
  try {
    const userClientRef = doc(db, 'userPermissions', userEmail, 'clients', clientId);
    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (updates.accessLevel) {
      updateData.role = updates.accessLevel;
    }

    if (updates.note !== undefined) {
      updateData.note = updates.note;
    }
    console.log(`FIREBASE: ÉCRITURE - Fichier: code-cleaner.js - Fonction: updateUserAccess - Path: userPermissions/${userEmail}/clients/${clientId}`);
    await updateDoc(userClientRef, updateData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'accès utilisateur:', error);
    throw error;
  }
}

/**
 * Supprime l'accès d'un utilisateur à un client spécifique.
 * @param {string} clientId L'ID du client.
 * @param {string} userEmail L'adresse email de l'utilisateur dont l'accès doit être supprimé.
 * @returns {Promise<void>} Une promesse qui résout lorsque l'accès est supprimé.
 * Lance une erreur en cas d'échec.
 */
export async function removeUserAccess(
  clientId: string,
  userEmail: string
): Promise<void> {
  try {
    const userClientRef = doc(db, 'userPermissions', userEmail, 'clients', clientId);
    console.log(`FIREBASE: ÉCRITURE - Fichier: code-cleaner.js - Fonction: removeUserAccess - Path: userPermissions/${userEmail}/clients/${clientId}`);
    await deleteDoc(userClientRef);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'accès utilisateur:', error);
    throw error;
  }
}