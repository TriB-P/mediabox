/**
 * Ce fichier contient des fonctions pour interagir avec les données des clients
 * stockées dans Firebase (Firestore et Storage). Il permet de récupérer les informations
 * des clients, de gérer les permissions des utilisateurs sur ces clients, de mettre à jour
 * les données des clients et d'uploader leurs logos.
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
  Custom_Dim_SPL_3?: string;
  Custom_Dim_CR_1?: string;
  Custom_Dim_CR_2?: string;
  Custom_Dim_CR_3?: string;
}

/**
 * Récupère la liste de tous les clients auxquels un utilisateur spécifique a accès.
 * @param userEmail L'adresse e-mail de l'utilisateur pour lequel récupérer les permissions.
 * @returns Une promesse qui résout en un tableau d'objets ClientPermission.
 */
export async function getUserClients(
  userEmail: string
): Promise<ClientPermission[]> {
  try {
    const permissionsRef = collection(
      db,
      'userPermissions',
      userEmail,
      'clients'
    );
    console.log("FIREBASE: LECTURE - Fichier: clientService.ts - Fonction: getUserClients - Path: userPermissions/${userEmail}/clients");
    const permissionsSnapshot = await getDocs(permissionsRef);
    const clients: ClientPermission[] = permissionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        clientId: doc.id,
        CL_Name: data.CL_Name,
        CL_Logo: data.CL_Logo,
        role: data.role || 'viewer',
        grantedAt: data.grantedAt,
      };
    });
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
      Custom_Dim_SPL_3: data.Custom_Dim_SPL_3 || '',
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