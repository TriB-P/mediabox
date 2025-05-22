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

// Types adaptés à la structure Firestore
export interface ClientPermission {
  clientId: string;
  CL_Name: string;
  CL_Logo?: string;
  role: 'admin' | 'editor' | 'viewer';
  grantedAt?: any; // Firestore timestamp
}

export interface ClientInfo {
  // Informations générales
  CL_Name: string;
  CL_Logo?: string;
  CL_Office: string[];
  CL_Agency?: string;
  CL_Export_Language: 'FR' | 'EN';
  CL_Default_Drive_Folder?: string;
  CL_Cost_Guide_ID?: string; 

  
  // Frais personnalisés
  CL_Custom_Fee_1?: string;
  CL_Custom_Fee_2?: string;
  CL_Custom_Fee_3?: string;
  
  // Dimensions personnalisées - Campagne
  Custom_Dim_CA_1?: string;
  Custom_Dim_CA_2?: string;
  Custom_Dim_CA_3?: string;
  
  // Dimensions personnalisées - Tactique
  Custom_Dim_TC_1?: string;
  Custom_Dim_TC_2?: string;
  Custom_Dim_TC_3?: string;
  
  // Dimensions personnalisées - Placement
  Custom_Dim_SPL_1?: string;
  Custom_Dim_SPL_2?: string;
  Custom_Dim_SPL_3?: string;
  
  // Dimensions personnalisées - Créatif
  Custom_Dim_CR_1?: string;
  Custom_Dim_CR_2?: string;
  Custom_Dim_CR_3?: string;
}

// Obtenir tous les clients auxquels un utilisateur a accès
export async function getUserClients(
  userEmail: string
): Promise<ClientPermission[]> {
  try {
    console.log('Récupération des clients pour:', userEmail);

    // Utiliser l'email comme ID
    const permissionsRef = collection(
      db,
      'userPermissions',
      userEmail,
      'clients'
    );
    const permissionsSnapshot = await getDocs(permissionsRef);

    console.log('Nombre de clients trouvés:', permissionsSnapshot.size);

    const clients: ClientPermission[] = permissionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('Client trouvé:', doc.id, data);

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

// Vérifier si un utilisateur a accès à un client
export async function checkUserAccess(
  userEmail: string,
  clientId: string
): Promise<boolean> {
  try {
    const permissionDoc = await getDoc(
      doc(db, 'userPermissions', userEmail, 'clients', clientId)
    );
    return permissionDoc.exists();
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error);
    return false;
  }
}

// Obtenir les informations détaillées d'un client
export async function getClientInfo(clientId: string): Promise<ClientInfo> {
  try {
    console.log(`Récupération des infos pour le client ${clientId}`);
    const clientRef = doc(db, 'clients', clientId);
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
    console.log('Données client récupérées:', data);
    
    return {
      // Informations générales
      CL_Name: data.CL_Name || '',
      CL_Logo: data.CL_Logo || '',
      CL_Office: data.CL_Office || [],
      CL_Agency: data.CL_Agency || '',
      CL_Export_Language: data.CL_Export_Language || 'FR',
      CL_Default_Drive_Folder: data.CL_Default_Drive_Folder || '',
      CL_Cost_Guide_ID: data.CL_Cost_Guide_ID || '',

      
      // Frais personnalisés
      CL_Custom_Fee_1: data.CL_Custom_Fee_1 || '',
      CL_Custom_Fee_2: data.CL_Custom_Fee_2 || '',
      CL_Custom_Fee_3: data.CL_Custom_Fee_3 || '',
      
      // Dimensions personnalisées - Campagne
      Custom_Dim_CA_1: data.Custom_Dim_CA_1 || '',
      Custom_Dim_CA_2: data.Custom_Dim_CA_2 || '',
      Custom_Dim_CA_3: data.Custom_Dim_CA_3 || '',
      
      // Dimensions personnalisées - Tactique
      Custom_Dim_TC_1: data.Custom_Dim_TC_1 || '',
      Custom_Dim_TC_2: data.Custom_Dim_TC_2 || '',
      Custom_Dim_TC_3: data.Custom_Dim_TC_3 || '',
      
      // Dimensions personnalisées - Placement
      Custom_Dim_SPL_1: data.Custom_Dim_SPL_1 || '',
      Custom_Dim_SPL_2: data.Custom_Dim_SPL_2 || '',
      Custom_Dim_SPL_3: data.Custom_Dim_SPL_3 || '',
      
      // Dimensions personnalisées - Créatif
      Custom_Dim_CR_1: data.Custom_Dim_CR_1 || '',
      Custom_Dim_CR_2: data.Custom_Dim_CR_2 || '',
      Custom_Dim_CR_3: data.Custom_Dim_CR_3 || '',
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des infos client:', error);
    throw error;
  }
}

// Mettre à jour les informations d'un client
export async function updateClientInfo(
  clientId: string,
  clientInfo: Partial<ClientInfo>
): Promise<void> {
  try {
    console.log(`Mise à jour des infos pour le client ${clientId}:`, clientInfo);
    const clientRef = doc(db, 'clients', clientId);
    
    await updateDoc(clientRef, {
      ...clientInfo,
      updatedAt: serverTimestamp(),
    });
    
    console.log(`Informations du client ${clientId} mises à jour`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des infos client:', error);
    throw error;
  }
}

// Uploader un logo client et obtenir l'URL
export async function uploadClientLogo(
  clientId: string,
  file: File
): Promise<string> {
  try {
    console.log(`Upload du logo pour le client ${clientId}`);
    // Créer une référence au fichier dans le storage
    const logoRef = ref(storage, `clients/${clientId}/logo_${Date.now()}`);
    
    // Uploader le fichier
    await uploadBytes(logoRef, file);
    console.log('Logo uploadé avec succès');
    
    // Obtenir l'URL du fichier
    const downloadURL = await getDownloadURL(logoRef);
    console.log('URL du logo:', downloadURL);
    
    // Mettre à jour le document client avec la nouvelle URL du logo
    const clientRef = doc(db, 'clients', clientId);
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