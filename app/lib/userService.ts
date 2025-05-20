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
  
  // Récupérer tous les utilisateurs du système
  export async function getAllUsers(): Promise<User[]> {
    try {
      console.log('Récupération de tous les utilisateurs...');
      const usersCollection = collection(db, 'users');
      const snapshot = await getDocs(usersCollection);
      
      console.log(`Nombre d'utilisateurs trouvés: ${snapshot.size}`);
      
      // Déboguer chaque document utilisateur
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Utilisateur ${index + 1}:`, {
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          hasPhotoURL: !!data.photoURL
        });
      });
      
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
  
  // Récupérer tous les utilisateurs ayant accès à un client spécifique
  export async function getClientUsers(clientId: string): Promise<UserAccess[]> {
    try {
      console.log(`Récupération des utilisateurs pour le client ${clientId}...`);
      
      // Cette fonction est plus complexe car nous devons chercher dans tous les userPermissions
      const userPermissionsCollection = collection(db, 'userPermissions');
      const allUserPermissions = await getDocs(userPermissionsCollection);
      
      console.log(`Nombre de documents userPermissions: ${allUserPermissions.size}`);
      
      // Pour chaque document userPermissions, vérifier s'il a accès au client
      const clientUsers: UserAccess[] = [];
      
      for (const userPermDoc of allUserPermissions.docs) {
        const userEmail = userPermDoc.id; // L'ID du document est l'email de l'utilisateur
        console.log(`Vérification des accès pour l'utilisateur ${userEmail}`);
        
        // Vérifier si cet utilisateur a accès au client spécifié
        try {
          const clientsCollection = collection(db, 'userPermissions', userEmail, 'clients');
          const clientsSnapshot = await getDocs(clientsCollection);
          
          console.log(`L'utilisateur ${userEmail} a accès à ${clientsSnapshot.size} clients`);
          
          // Rechercher le client spécifique
          const clientAccess = clientsSnapshot.docs.find(doc => doc.id === clientId);
          
          if (clientAccess) {
            console.log(`L'utilisateur ${userEmail} a accès au client ${clientId}`);
            
            // Récupérer les informations utilisateur
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
      
      console.log(`Nombre d'utilisateurs ayant accès au client: ${clientUsers.length}`);
      return clientUsers;
    } catch (error) {
      console.error(`Erreur lors de la récupération des utilisateurs pour le client ${clientId}:`, error);
      return [];
    }
  }
  
  // Fonction d'aide pour trouver un utilisateur par son email
  async function getUserByEmail(email: string): Promise<User | null> {
    try {
      console.log(`Recherche de l'utilisateur par email: ${email}`);
      
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('email', '==', email));
      const snapshot = await getDocs(q);
      
      console.log(`Résultat de la recherche: ${snapshot.size} utilisateurs trouvés`);
      
      if (snapshot.empty) {
        // Si aucun utilisateur n'est trouvé avec cette adresse email,
        // on crée un utilisateur virtuel avec l'email comme nom
        console.log(`Aucun utilisateur trouvé pour l'email ${email}, création d'un utilisateur virtuel`);
        return {
          id: 'virtual-' + email,
          email: email,
          displayName: email.split('@')[0] || email,
        };
      }
      
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      console.log(`Utilisateur trouvé:`, {
        id: userDoc.id,
        email: userData.email,
        displayName: userData.displayName
      });
      
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
  
  // Ajouter un accès utilisateur à un client
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
      console.log(`Ajout d'accès pour l'utilisateur ${userData.userEmail} au client ${clientId}`);
      
      // Ajouter le client aux permissions de l'utilisateur
      const userClientRef = doc(db, 'userPermissions', userData.userEmail, 'clients', clientId);
      
      await setDoc(userClientRef, {
        clientId: clientId,
        CL_Name: clientName,
        role: userData.accessLevel,
        note: userData.note,
        grantedAt: serverTimestamp(),
      });
      
      console.log(`Accès ajouté pour l'utilisateur ${userData.userEmail} au client ${clientId}`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'accès utilisateur:', error);
      throw error;
    }
  }
  
  // Mettre à jour l'accès d'un utilisateur
  export async function updateUserAccess(
    clientId: string,
    userEmail: string,
    updates: {
      accessLevel?: 'editor' | 'user';
      note?: string;
    }
  ): Promise<void> {
    try {
      console.log(`Mise à jour de l'accès pour l'utilisateur ${userEmail} au client ${clientId}`);
      
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
      
      await updateDoc(userClientRef, updateData);
      
      console.log(`Accès mis à jour pour l'utilisateur ${userEmail} au client ${clientId}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'accès utilisateur:', error);
      throw error;
    }
  }
  
  // Supprimer l'accès d'un utilisateur
  export async function removeUserAccess(
    clientId: string,
    userEmail: string
  ): Promise<void> {
    try {
      console.log(`Suppression de l'accès pour l'utilisateur ${userEmail} au client ${clientId}`);
      
      const userClientRef = doc(db, 'userPermissions', userEmail, 'clients', clientId);
      await deleteDoc(userClientRef);
      
      console.log(`Accès supprimé pour l'utilisateur ${userEmail} au client ${clientId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'accès utilisateur:', error);
      throw error;
    }
  }