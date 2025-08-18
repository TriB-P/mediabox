// Fichier: app/lib/clientService.ts
// Chemin: app/lib/clientService.ts

/**
 * Ce fichier contient des fonctions pour interagir avec les données des clients
 * stockées dans Firebase (Firestore et Storage). Il permet de récupérer les informations
 * des clients, de gérer les permissions des utilisateurs sur ces clients, de mettre à jour
 * les données des clients et d'uploader leurs logos.
 * 
 * MODIFICATION : getUserClients() récupère maintenant les logos depuis la collection racine "clients"
 * au lieu de la sous-collection "userPermissions/{email}/clients"
 * 
 * NOUVELLE MODIFICATION : Les utilisateurs avec le rôle "admin" ont automatiquement accès à tous les clients
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export interface ClientPermission {
  clientId: string;
  CL_Name: string;
  CL_Logo?: string;
  role: 'admin' | 'editor' | 'viewer';
  grantedAt?: any;
}

export interface ClientInfo {
  CL_Name: string;
  CL_Logo?: string;
  CL_Office: string[];
  CL_Agency?: string;
  CL_Export_Language: 'FR' | 'EN';
  CL_Default_Drive_Folder?: string;
  CL_Cost_Guide_ID?: string;
  CL_Custom_Fee_1?: string;
  CL_Custom_Fee_2?: string;
  CL_Custom_Fee_3?: string;
  Custom_Dim_CA_1?: string;
  Custom_Dim_CA_2?: string;
  Custom_Dim_CA_3?: string;
  Custom_Dim_TC_1?: string;
  Custom_Dim_TC_2?: string;
  Custom_Dim_TC_3?: string;
  Custom_Dim_PL_1?: string;
  Custom_Dim_PL_2?: string;
  Custom_Dim_PL_3?: string;
  Custom_Dim_CR_1?: string;
  Custom_Dim_CR_2?: string;
  Custom_Dim_CR_3?: string;
}

/**
 * Récupère le rôle d'un utilisateur depuis la collection users
 * @param userEmail L'adresse e-mail de l'utilisateur
 * @returns Le rôle de l'utilisateur ou null si non trouvé
 */
async function getUserRole(userEmail: string): Promise<string | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userEmail));
    console.log("FIREBASE: LECTURE - Fichier: clientService.ts - Fonction: getUserRole - Path: users");
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const userData = snapshot.docs[0].data();
    return userData.role || null;
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle utilisateur:', error);
    return null;
  }
}

/**
 * Récupère tous les clients de la collection clients (pour les admins)
 * @returns Un tableau de tous les clients avec le rôle admin
 */
async function getAllClientsForAdmin(): Promise<ClientPermission[]> {
  try {
    const clientsRef = collection(db, 'clients');
    console.log("FIREBASE: LECTURE - Fichier: clientService.ts - Fonction: getAllClientsForAdmin - Path: clients");
    const snapshot = await getDocs(clientsRef);
    
    const clients: ClientPermission[] = [];
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      clients.push({
        clientId: doc.id,
        CL_Name: data.CL_Name || '',
        CL_Logo: data.CL_Logo || '',
        role: 'admin', // Tous les clients sont accessibles en tant qu'admin
        grantedAt: new Date(), // Accès automatique
      });
    });
    
    return clients;
  } catch (error) {
    console.error('Erreur lors de la récupération de tous les clients:', error);
    return [];
  }
}

/**
 * Récupère la liste de tous les clients auxquels un utilisateur spécifique a accès.
 * NOUVELLE VERSION : 
 * - Si l'utilisateur a le rôle "admin", il a accès à TOUS les clients avec le rôle "admin"
 * - Sinon, récupère les données depuis userPermissions puis les données complètes depuis la collection racine "clients"
 * 
 * @param userEmail L'adresse e-mail de l'utilisateur pour lequel récupérer les permissions.
 * @returns Une promesse qui résout en un tableau d'objets ClientPermission.
 */
export async function getUserClients(
  userEmail: string
): Promise<ClientPermission[]> {
  try {
    // 1. Vérifier d'abord si l'utilisateur est admin
    const userRole = await getUserRole(userEmail);
    
    if (userRole === 'admin') {
      console.log(`Utilisateur ${userEmail} est admin - accès à tous les clients`);
      return await getAllClientsForAdmin();
    }
    
    // 2. Logique normale pour les utilisateurs non-admin
    // Récupérer d'abord les permissions/rôles depuis userPermissions
    const permissionsRef = collection(
      db,
      'userPermissions',
      userEmail,
      'clients'
    );
    console.log("FIREBASE: LECTURE - Fichier: clientService.ts - Fonction: getUserClients - Path: userPermissions/${userEmail}/clients");
    const permissionsSnapshot = await getDocs(permissionsRef);
    
    // 3. Extraire les informations de permissions (rôle, grantedAt)
    const permissionsData = permissionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        clientId: doc.id,
        role: data.role || 'viewer',
        grantedAt: data.grantedAt,
      };
    });

    // 4. Pour chaque client autorisé, récupérer les données complètes depuis la collection racine
    const clients: ClientPermission[] = [];
    
    for (const permission of permissionsData) {
      try {
        const clientRef = doc(db, 'clients', permission.clientId);
        console.log(`FIREBASE: LECTURE - Fichier: clientService.ts - Fonction: getUserClients - Path: clients/${permission.clientId}`);
        const clientDoc = await getDoc(clientRef);
        
        if (clientDoc.exists()) {
          const clientData = clientDoc.data();
          
          // 5. Fusionner les données de permissions avec les données maîtres
          clients.push({
            clientId: permission.clientId,
            CL_Name: clientData.CL_Name || '',
            CL_Logo: clientData.CL_Logo || '',
            role: permission.role,
            grantedAt: permission.grantedAt,
          });
        } else {
          console.warn(`Client ${permission.clientId} introuvable dans la collection racine clients`);
          // Garder une entrée minimale pour éviter les erreurs
          clients.push({
            clientId: permission.clientId,
            CL_Name: 'Client introuvable',
            CL_Logo: '',
            role: permission.role,
            grantedAt: permission.grantedAt,
          });
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération du client ${permission.clientId}:`, error);
        // Continuer avec les autres clients même si un échoue
      }
    }
    
    return clients;
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    return [];
  }
}

/**
 * Vérifie si un utilisateur a accès à un client spécifique.
 * @param userEmail L'adresse e-mail de l'utilisateur.
 * @param clientId L'ID du client à vérifier.
 * @returns Une promesse qui résout en 'true' si l'utilisateur a accès, sinon 'false'.
 */
export async function checkUserAccess(
  userEmail: string,
  clientId: string
): Promise<boolean> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: clientService.ts - Fonction: checkUserAccess - Path: userPermissions/${userEmail}/clients/${clientId}");
    const permissionDoc = await getDoc(
      doc(db, 'userPermissions', userEmail, 'clients', clientId)
    );
    return permissionDoc.exists();
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error);
    return false;
  }
}

/**
 * Récupère les informations détaillées d'un client spécifique.
 * @param clientId L'ID du client dont les informations doivent être récupérées.
 * @returns Une promesse qui résout en un objet ClientInfo contenant les détails du client.
 * Retourne un objet ClientInfo avec des valeurs par défaut si le client n'est pas trouvé.
 */
export async function getClientInfo(clientId: string): Promise<ClientInfo> {
  try {
    const clientRef = doc(db, 'clients', clientId);
    console.log("FIREBASE: LECTURE - Fichier: clientService.ts - Fonction: getClientInfo - Path: clients/${clientId}");
    const clientDoc = await getDoc(clientRef);
    
    if (!clientDoc.exists()) {
      console.log(`Client ${clientId} non trouvé`);
      return {
        CL_Name: '',
        CL_Logo: '',
        CL_Office: [],
        CL_Agency: '',
        CL_Export_Language: 'FR',
        CL_Default_Drive_Folder: '',
        CL_Cost_Guide_ID: '',
      };
    }
    
    const data = clientDoc.data();
    
    return {
      CL_Name: data.CL_Name || '',
      CL_Logo: data.CL_Logo || '',
      CL_Office: data.CL_Office || [],
      CL_Agency: data.CL_Agency || '',
      CL_Export_Language: data.CL_Export_Language || 'FR',
      CL_Default_Drive_Folder: data.CL_Default_Drive_Folder || '',
      CL_Cost_Guide_ID: data.CL_Cost_Guide_ID || '',
      CL_Custom_Fee_1: data.CL_Custom_Fee_1 || '',
      CL_Custom_Fee_2: data.CL_Custom_Fee_2 || '',
      CL_Custom_Fee_3: data.CL_Custom_Fee_3 || '',
      Custom_Dim_CA_1: data.Custom_Dim_CA_1 || '',
      Custom_Dim_CA_2: data.Custom_Dim_CA_2 || '',
      Custom_Dim_CA_3: data.Custom_Dim_CA_3 || '',
      Custom_Dim_TC_1: data.Custom_Dim_TC_1 || '',
      Custom_Dim_TC_2: data.Custom_Dim_TC_2 || '',
      Custom_Dim_TC_3: data.Custom_Dim_TC_3 || '',
      Custom_Dim_PL_1: data.Custom_Dim_PL_1 || '',
      Custom_Dim_PL_2: data.Custom_Dim_PL_2 || '',
      Custom_Dim_PL_3: data.Custom_Dim_PL_3 || '',
      Custom_Dim_CR_1: data.Custom_Dim_CR_1 || '',
      Custom_Dim_CR_2: data.Custom_Dim_CR_2 || '',
      Custom_Dim_CR_3: data.Custom_Dim_CR_3 || '',
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des infos client:', error);
    throw error;
  }
}

/**
 * Met à jour les informations d'un client existant.
 * @param clientId L'ID du client à mettre à jour.
 * @param clientInfo Un objet partiel de type ClientInfo contenant les champs à modifier.
 * @returns Une promesse qui résout une fois la mise à jour effectuée.
 */
export async function updateClientInfo(
  clientId: string,
  clientInfo: Partial<ClientInfo>
): Promise<void> {
  try {
    const clientRef = doc(db, 'clients', clientId);
    console.log("FIREBASE: ÉCRITURE - Fichier: clientService.ts - Fonction: updateClientInfo - Path: clients/${clientId}");
    await updateDoc(clientRef, {
      ...clientInfo,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des infos client:', error);
    throw error;
  }
}

/**
 * Crée un nouveau client dans la collection Firestore.
 * @param clientId L'ID personnalisé du client (défini par l'utilisateur).
 * @param clientName Le nom du client (CL_Name).
 * @returns Une promesse qui résout une fois le client créé.
 */
export async function createClient(
  clientId: string,
  clientName: string
): Promise<void> {
  try {
    // Vérifier si le client existe déjà
    const clientRef = doc(db, 'clients', clientId);
    console.log(`FIREBASE: LECTURE - Fichier: clientService.ts - Fonction: createClient - Path: clients/${clientId}`);
    const existingClient = await getDoc(clientRef);
    
    if (existingClient.exists()) {
      throw new Error(`Un client avec l'ID "${clientId}" existe déjà`);
    }

    // Créer le nouveau client avec les champs minimum
    const newClientData: Partial<ClientInfo> = {
      CL_Name: clientName,
      CL_Logo: '',
      CL_Office: [],
      CL_Agency: '',
      CL_Export_Language: 'FR',
      CL_Default_Drive_Folder: '',
      CL_Cost_Guide_ID: '',
      CL_Custom_Fee_1: '',
      CL_Custom_Fee_2: '',
      CL_Custom_Fee_3: '',
      Custom_Dim_CA_1: '',
      Custom_Dim_CA_2: '',
      Custom_Dim_CA_3: '',
      Custom_Dim_TC_1: '',
      Custom_Dim_TC_2: '',
      Custom_Dim_TC_3: '',
      Custom_Dim_PL_1: '',
      Custom_Dim_PL_2: '',
      Custom_Dim_PL_3: '',
      Custom_Dim_CR_1: '',
      Custom_Dim_CR_2: '',
      Custom_Dim_CR_3: '',
    };

    console.log(`FIREBASE: ÉCRITURE - Fichier: clientService.ts - Fonction: createClient - Path: clients/${clientId}`);
    await setDoc(clientRef, {
      ...newClientData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    throw error;
  }
}

/**
 * Uploade un fichier logo pour un client et met à jour l'URL du logo dans les informations du client.
 * @param clientId L'ID du client pour lequel uploader le logo.
 * @param file Le fichier du logo à uploader.
 * @returns Une promesse qui résout en l'URL de téléchargement du logo uploadé.
 */
export async function uploadClientLogo(
  clientId: string,
  file: File
): Promise<string> {
  try {
    const logoRef = ref(storage, `clients/${clientId}/logo_${Date.now()}`);
    console.log("FIREBASE: ÉCRITURE - Fichier: clientService.ts - Fonction: uploadClientLogo - Path: clients/${clientId}/logo_${Date.now()}");
    await uploadBytes(logoRef, file);
    console.log("FIREBASE: LECTURE - Fichier: clientService.ts - Fonction: uploadClientLogo - Path: clients/${clientId}/logo_${Date.now()}");
    const downloadURL = await getDownloadURL(logoRef);
    
    const clientRef = doc(db, 'clients', clientId);
    console.log("FIREBASE: ÉCRITURE - Fichier: clientService.ts - Fonction: uploadClientLogo - Path: clients/${clientId}");
    await updateDoc(clientRef, {
      CL_Logo: downloadURL,
      updatedAt: serverTimestamp()
    });
    
    return downloadURL;
  } catch (error) {
    console.error('Erreur lors de l\'upload du logo:', error);
    throw error;
  }
}