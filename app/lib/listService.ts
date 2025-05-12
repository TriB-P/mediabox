import { collection, getDocs, query, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface ShortcodeItem {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Default_UTM?: string;
}

/**
 * Récupère les informations d'un client depuis Firestore
 * @param clientId - ID du client
 * @returns Les informations du client
 */
export async function getClientInfo(clientId: string): Promise<any> {
  try {
    console.log(`Récupération des informations pour le client ${clientId}`);

    const clientRef = doc(db, 'clients', clientId);
    const clientDoc = await getDoc(clientRef);

    if (!clientDoc.exists()) {
      console.log(`Client ${clientId} non trouvé dans Firestore`);
      return null;
    }

    return clientDoc.data();
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des informations du client ${clientId}:`,
      error
    );
    return null;
  }
}

/**
 * Récupère une liste spécifique pour un client donné
 * @param listType - Type de liste (ex: CA_Division, CA_Custom_Dim_1)
 * @param clientId - ID du client
 * @returns Une liste d'éléments avec leurs propriétés
 */
export async function getClientList(
  listType: string,
  clientId: string
): Promise<ShortcodeItem[]> {
  try {
    console.log(
      `Récupération de la liste ${listType} pour le client ${clientId}`
    );

    const shortcodesRef = collection(
      db,
      'lists',
      listType, // On utilise directement le nom de la liste (ex: CA_Custom_Dim_1)
      'clients',
      clientId,
      'shortcodes'
    );

    const q = query(shortcodesRef);
    const snapshot = await getDocs(q);

    console.log(`${snapshot.size} éléments trouvés dans la liste ${listType}`);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      SH_Code: doc.data().SH_Code || doc.id,
      SH_Display_Name_FR:
        doc.data().SH_Display_Name_FR || doc.data().SH_Code || doc.id,
      SH_Default_UTM: doc.data().SH_Default_UTM,
    }));
  } catch (error) {
    console.error(
      `Erreur lors de la récupération de la liste ${listType}:`,
      error
    );
    return [];
  }
}
