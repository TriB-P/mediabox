import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Interface adaptée à votre structure
export interface ClientPermission {
  clientId: string;
  CL_Name: string;
  CL_Logo?: string;
  role: 'admin' | 'editor' | 'viewer';
  grantedAt?: any; // Firestore timestamp
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
