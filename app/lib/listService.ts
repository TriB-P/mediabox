import { collection, getDocs, query, doc, getDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export interface ShortcodeItem {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Display_Name_EN: string;
  SH_Default_UTM?: string;
  SH_Logo?: string;
  SH_Type?: string;
  SH_Tags?: string[];
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
      SH_Display_Name_EN:
        doc.data().SH_Display_Name_EN || doc.data().SH_Code || doc.id,
      SH_Default_UTM: doc.data().SH_Default_UTM,
      SH_Logo: doc.data().SH_Logo,
      SH_Type: doc.data().SH_Type,
      SH_Tags: doc.data().SH_Tags || [],
    }));
  } catch (error) {
    console.error(
      `Erreur lors de la récupération de la liste ${listType}:`,
      error
    );
    return [];
  }
}

/**
 * Récupère la liste des partenaires (non classifiée par client)
 * @returns Une liste des partenaires avec leurs propriétés
 */
export async function getPartnersList(): Promise<ShortcodeItem[]> {
  try {
    console.log('Récupération de la liste des partenaires');

    const shortcodesRef = collection(db, 'lists', 'CA_Publisher', 'shortcodes');
    const q = query(shortcodesRef);
    const snapshot = await getDocs(q);

    console.log(`${snapshot.size} partenaires trouvés`);

    // Récupérer les données
    const partners = snapshot.docs.map((doc) => ({
      id: doc.id,
      SH_Code: doc.data().SH_Code || doc.id,
      SH_Display_Name_FR:
        doc.data().SH_Display_Name_FR || doc.data().SH_Code || doc.id,
      SH_Display_Name_EN:
        doc.data().SH_Display_Name_EN || doc.data().SH_Code || doc.id,
      SH_Default_UTM: doc.data().SH_Default_UTM,
      SH_Logo: doc.data().SH_Logo,
      SH_Type: doc.data().SH_Type,
      SH_Tags: doc.data().SH_Tags || [],
    }));
    
    // Trier par ordre alphabétique du nom d'affichage
    return partners.sort((a, b) => 
      a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des partenaires:', error);
    return [];
  }
}

/**
 * Récupère un partenaire spécifique par son ID
 * @param partnerId - ID du partenaire
 * @returns Les informations détaillées du partenaire
 */
export async function getPartnerById(partnerId: string): Promise<ShortcodeItem | null> {
  try {
    console.log(`Récupération du partenaire ${partnerId}`);

    const partnerRef = doc(db, 'lists', 'CA_Publisher', 'shortcodes', partnerId);
    const partnerDoc = await getDoc(partnerRef);

    if (!partnerDoc.exists()) {
      console.log(`Partenaire ${partnerId} non trouvé`);
      return null;
    }

    return {
      id: partnerDoc.id,
      SH_Code: partnerDoc.data().SH_Code || partnerDoc.id,
      SH_Display_Name_FR:partnerDoc.data().SH_Display_Name_FR || partnerDoc.data().SH_Code || partnerDoc.id,
      SH_Display_Name_EN:partnerDoc.data().SH_Display_Name_EN || partnerDoc.data().SH_Code || partnerDoc.id,
      SH_Default_UTM: partnerDoc.data().SH_Default_UTM,
      SH_Logo: partnerDoc.data().SH_Logo,
      SH_Type: partnerDoc.data().SH_Type,
      SH_Tags: partnerDoc.data().SH_Tags || [],
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération du partenaire ${partnerId}:`, error);
    return null;
  }
}

