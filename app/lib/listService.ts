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

    // 1. Récupérer les IDs des shortcodes de la liste du client
    const shortcodeRefs = collection(
      db,
      'lists',
      listType,
      'clients',
      clientId,
      'shortcodes'
    );

    const snapshot = await getDocs(query(shortcodeRefs));
    const shortcodeIds = snapshot.docs.map(doc => doc.id);

    if (shortcodeIds.length === 0) {
      console.log(`Aucun shortcode trouvé dans la liste ${listType} pour le client ${clientId}`);
      return [];
    }
    
    console.log(`${shortcodeIds.length} IDs de shortcode trouvés pour ${listType}. Récupération des détails...`);

    // 2. Récupérer les détails de chaque shortcode depuis la collection racine 'shortcodes'
    const shortcodesPromises = shortcodeIds.map(async (id) => {
      const shortcodeRef = doc(db, 'shortcodes', id);
      const shortcodeSnap = await getDoc(shortcodeRef);
      if (shortcodeSnap.exists()) {
        const data = shortcodeSnap.data();
        return {
          id: shortcodeSnap.id,
          SH_Code: data.SH_Code || id,
          SH_Display_Name_FR: data.SH_Display_Name_FR || data.SH_Code || id,
          SH_Display_Name_EN: data.SH_Display_Name_EN,
          SH_Default_UTM: data.SH_Default_UTM,
          SH_Logo: data.SH_Logo,
          SH_Type: data.SH_Type,
          SH_Tags: data.SH_Tags || [],
        } as ShortcodeItem;
      }
      return null;
    });

    const resolvedShortcodes = await Promise.all(shortcodesPromises);
    const finalShortcodes = resolvedShortcodes.filter(s => s !== null) as ShortcodeItem[];

    // Trier par nom d'affichage français
    return finalShortcodes.sort((a, b) => 
      a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
    );

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

    // 1. Récupérer les IDs des partenaires depuis la nouvelle structure
    const partnerIdsRef = collection(db, 'lists', 'TC_Publisher', 'clients', 'PlusCo', 'shortcodes');
    const partnerIdsSnapshot = await getDocs(partnerIdsRef);
    
    console.log(`${partnerIdsSnapshot.size} IDs de partenaires trouvés`);
    
    if (partnerIdsSnapshot.empty) {
      return [];
    }
    
    // 2. Pour chaque ID, récupérer les informations complètes
    const partnersPromises = partnerIdsSnapshot.docs.map(async (docSnap) => {
      const partnerId = docSnap.id;
      
      // Récupérer les informations complètes du partenaire
      const partnerRef = doc(db, 'shortcodes', partnerId);
      const partnerSnap = await getDoc(partnerRef);
      
      if (partnerSnap.exists()) {
        const data = partnerSnap.data();
        return {
          id: partnerId,
          SH_Code: data.SH_Code || partnerId,
          SH_Display_Name_FR: data.SH_Display_Name_FR || data.SH_Code || partnerId,
          SH_Display_Name_EN: data.SH_Display_Name_EN || data.SH_Code || partnerId,
          SH_Default_UTM: data.SH_Default_UTM,
          SH_Logo: data.SH_Logo,
          SH_Type: data.SH_Type,
          SH_Tags: data.SH_Tags || [],
        } as ShortcodeItem;
      }
      
      return null;
    });
    
    const partnersResults = await Promise.all(partnersPromises);
    const partners = partnersResults.filter(p => p !== null) as ShortcodeItem[];
    
    console.log(`${partners.length} partenaires avec informations complètes récupérés`);
    
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

    // Récupérer directement les informations du partenaire depuis la collection shortcodes
    const partnerRef = doc(db, 'shortcodes', partnerId);
    const partnerDoc = await getDoc(partnerRef);

    if (!partnerDoc.exists()) {
      console.log(`Partenaire ${partnerId} non trouvé`);
      return null;
    }

    const data = partnerDoc.data();
    return {
      id: partnerDoc.id,
      SH_Code: data.SH_Code || partnerDoc.id,
      SH_Display_Name_FR: data.SH_Display_Name_FR || data.SH_Code || partnerDoc.id,
      SH_Display_Name_EN: data.SH_Display_Name_EN || data.SH_Code || partnerDoc.id,
      SH_Default_UTM: data.SH_Default_UTM,
      SH_Logo: data.SH_Logo,
      SH_Type: data.SH_Type,
      SH_Tags: data.SH_Tags || [],
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération du partenaire ${partnerId}:`, error);
    return null;
  }
}