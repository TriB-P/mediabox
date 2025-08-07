/**
 * Ce fichier gère les permissions d'accès des utilisateurs aux clients dans Firestore.
 * Il inclut la récupération d'utilisateurs, la gestion des accès (CRUD),
 * et assure la traçabilité via des logs de lecture/écriture.
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
import { db } from './firebase'; // Assurez-vous que le chemin vers votre config firebase est correct

// Interfaces pour la typisation des données
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
 * Récupère tous les utilisateurs enregistrés dans la collection 'users'.
 * @returns {Promise<User[]>} Un tableau de tous les utilisateurs.
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const usersCollection = collection(db, 'users');
    console.log("FIREBASE: LECTURE - Fichier: permissionsService.js - Fonction: getAllUsers - Path: users");
    const snapshot = await getDocs(usersCollection);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        displayName: data.displayName || data.email || 'Utilisateur inconnu',
        photoURL: data.photoURL,
      } as User;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return [];
  }
}

/**
 * Récupère tous les utilisateurs ayant un accès à un client donné.
 * NOTE: Cette fonction est performante uniquement si le nombre d'utilisateurs total est faible.
 * Elle repose sur le fait que `addUserAccess` crée bien un document parent.
 * @param {string} clientId L'ID du client.
 * @returns {Promise<UserAccess[]>} Un tableau des utilisateurs avec accès.
 */
export async function getClientUsers(clientId: string): Promise<UserAccess[]> {
  try {
    const userPermissionsCollection = collection(db, 'userPermissions');
    console.log("FIREBASE: LECTURE - Fichier: permissionsService.js - Fonction: getClientUsers - Path: userPermissions");
    const allUserPermissions = await getDocs(userPermissionsCollection);

    const clientUsers: UserAccess[] = [];

    // Boucle sur chaque document de permission utilisateur
    for (const userPermDoc of allUserPermissions.docs) {
      const userEmail = userPermDoc.id;
      try {
        // Vérifie si l'accès pour le client spécifique existe dans la sous-collection
        const clientAccessDocRef = doc(db, 'userPermissions', userEmail, 'clients', clientId);
        console.log(`FIREBASE: LECTURE - Fichier: permissionsService.js - Fonction: getClientUsers - Path: userPermissions/${userEmail}/clients/${clientId}`);
        const clientAccessDoc = await getDoc(clientAccessDocRef);

        if (clientAccessDoc.exists()) {
          const userData = await getUserByEmail(userEmail);
          if (userData) {
            clientUsers.push({
              userId: userData.id,
              userEmail: userEmail,
              displayName: userData.displayName,
              photoURL: userData.photoURL,
              accessLevel: clientAccessDoc.data().role || 'user',
              note: clientAccessDoc.data().note || ''
            });
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
 * Récupère les informations d'un utilisateur par son email.
 * Si l'utilisateur n'est pas dans la collection 'users', retourne un objet utilisateur "virtuel".
 * @param {string} email L'email de l'utilisateur.
 * @returns {Promise<User | null>} Un objet User ou null en cas d'erreur.
 */
async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    console.log("FIREBASE: LECTURE - Fichier: permissionsService.js - Fonction: getUserByEmail - Path: users");
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Crée un utilisateur "virtuel" si non trouvé pour affichage
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
 * Ajoute un accès pour un utilisateur à un client.
 * Crée ou met à jour le document de permission parent pour s'assurer qu'il existe.
 * @param {string} clientId L'ID du client.
 * @param {string} clientName Le nom du client.
 * @param {object} userData Les données de l'accès utilisateur.
 */
export async function addUserAccess(
  clientId: string,
  clientName: string,
  userData: {
    userEmail: string;
    accessLevel: 'editor' | 'user';
    note: string;
  }
): Promise<void> {
  try {
    // Étape 1: Créer une référence vers le document de permission parent.
    const userPermissionRef = doc(db, 'userPermissions', userData.userEmail);

    // Étape 2: S'assurer que ce document parent existe en y ajoutant un champ.
    // L'option { merge: true } est cruciale: elle crée le document s'il n'existe pas
    // ou le met à jour sans écraser les sous-collections existantes.
    console.log(`FIREBASE: ÉCRITURE - Fichier: permissionsService.js - Fonction: addUserAccess - Path: userPermissions/${userData.userEmail}`);
    await setDoc(userPermissionRef, {
      lastAccessGrantedAt: serverTimestamp(), // Ce champ garantit l'existence du document
      userEmail: userData.userEmail,          // On peut aussi stocker l'email pour plus de clarté
    }, { merge: true });

    // Étape 3: Créer le document d'accès dans la sous-collection 'clients'.
    const userClientRef = doc(userPermissionRef, 'clients', clientId);
    console.log(`FIREBASE: ÉCRITURE - Fichier: permissionsService.js - Fonction: addUserAccess - Path: userPermissions/${userData.userEmail}/clients/${clientId}`);
    await setDoc(userClientRef, {
      CL_Name: clientName, // Le nom du client est utile ici
      role: userData.accessLevel,
      note: userData.note,
      grantedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'accès utilisateur:", error);
    throw error;
  }
}


/**
 * Met à jour l'accès d'un utilisateur à un client.
 * @param {string} clientId L'ID du client.
 * @param {string} userEmail L'email de l'utilisateur.
 * @param {object} updates Les champs à mettre à jour.
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
    if (updates.accessLevel) updateData.role = updates.accessLevel;
    if (updates.note !== undefined) updateData.note = updates.note;

    console.log(`FIREBASE: ÉCRITURE - Fichier: permissionsService.js - Fonction: updateUserAccess - Path: userPermissions/${userEmail}/clients/${clientId}`);
    await updateDoc(userClientRef, updateData);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'accès utilisateur:", error);
    throw error;
  }
}

/**
 * Supprime l'accès d'un utilisateur à un client.
 * NOTE: Cette fonction ne supprime pas le document de permission parent,
 * même s'il ne contient plus d'accès client, pour simplifier l'opération.
 * @param {string} clientId L'ID du client.
 * @param {string} userEmail L'email de l'utilisateur.
 */
export async function removeUserAccess(
  clientId: string,
  userEmail: string
): Promise<void> {
  try {
    const userClientRef = doc(db, 'userPermissions', userEmail, 'clients', clientId);
    console.log(`FIREBASE: ÉCRITURE - Fichier: permissionsService.js - Fonction: removeUserAccess - Path: userPermissions/${userEmail}/clients/${clientId}`);
    await deleteDoc(userClientRef);
  } catch (error) {
    console.error("Erreur lors de la suppression de l'accès utilisateur:", error);
    throw error;
  }
}