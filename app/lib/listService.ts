/**
 * Ce fichier contient des fonctions utilitaires pour interagir avec la base de données Firebase
 * afin de récupérer des informations sur les clients, les listes associées aux clients (comme les shortcodes),
 * et les partenaires. Il gère la lecture des données depuis Firestore.
 */
import { collection, getDocs, query, doc, getDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export interface ShortcodeItem {
  id: string;
  SH_Code: string;
  SH_Display_Name_EN: string;
  SH_Display_Name_FR: string;
  SH_Default_UTM?: string;
  SH_Logo?: string;
  SH_Type?: string;
  SH_Tags?: string[];
}

/**
 * Récupère les informations d'un client spécifique depuis Firestore.
 * @param clientId - L'identifiant unique du client à récupérer.
 * @returns Un objet contenant les informations du client, ou null si le client n'est pas trouvé ou en cas d'erreur.
 */
export async function getClientInfo(clientId: string): Promise<any> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: code.ts - Fonction: getClientInfo - Path: clients/${clientId}");
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
 * Récupère une liste spécifique de shortcodes associée à un client donné.
 * Cette fonction récupère d'abord les IDs des shortcodes liés à la liste et au client,
 * puis récupère les détails complets de chaque shortcode.
 * @param listType - Le type de la liste à récupérer (par exemple, 'CA_Division', 'CA_Custom_Dim_1').
 * @param clientId - L'identifiant unique du client pour lequel récupérer la liste.
 * @returns Un tableau d'objets ShortcodeItem triés par nom d'affichage français, ou un tableau vide en cas d'erreur ou d'absence de shortcodes.
 */
export async function getClientList(
  listType: string,
  clientId: string
): Promise<ShortcodeItem[]> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: code.ts - Fonction: getClientList - Path: lists/${listType}/clients/${clientId}/shortcodes");
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
      return [];
    }
    
    const shortcodesPromises = shortcodeIds.map(async (id) => {
      console.log("FIREBASE: LECTURE - Fichier: code.ts - Fonction: getClientList - Path: shortcodes/${id}");
      const shortcodeRef = doc(db, 'shortcodes', id);
      const shortcodeSnap = await getDoc(shortcodeRef);
      if (shortcodeSnap.exists()) {
        const data = shortcodeSnap.data();
        return {
          id: shortcodeSnap.id,
          SH_Code: data.SH_Code || id,
          SH_Display_Name_EN: data.SH_Display_Name_EN || data.SH_Code || id,
          SH_Display_Name_FR: data.SH_Display_Name_FR,
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

    return finalShortcodes.sort((a, b) => 
      a.SH_Display_Name_EN.localeCompare(b.SH_Display_Name_EN, 'fr', { sensitivity: 'base' })
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
 * Récupère la liste de tous les partenaires disponibles.
 * Cette fonction est utilisée pour obtenir une liste globale des éditeurs/partenaires.
 * @returns Un tableau d'objets ShortcodeItem représentant les partenaires, triés par nom d'affichage français, ou un tableau vide en cas d'erreur.
 */
export async function getPartnersList(): Promise<ShortcodeItem[]> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: code.ts - Fonction: getPartnersList - Path: lists/TC_Publisher/clients/PlusCo/shortcodes");
    const partnerIdsRef = collection(db, 'lists', 'TC_Publisher', 'clients', 'PlusCo', 'shortcodes');
    const partnerIdsSnapshot = await getDocs(partnerIdsRef);
    
    if (partnerIdsSnapshot.empty) {
      return [];
    }
    
    const partnersPromises = partnerIdsSnapshot.docs.map(async (docSnap) => {
      const partnerId = docSnap.id;
      
      console.log("FIREBASE: LECTURE - Fichier: code.ts - Fonction: getPartnersList - Path: shortcodes/${partnerId}");
      const partnerRef = doc(db, 'shortcodes', partnerId);
      const partnerSnap = await getDoc(partnerRef);
      
      if (partnerSnap.exists()) {
        const data = partnerSnap.data();
        return {
          id: partnerId,
          SH_Code: data.SH_Code || partnerId,
          SH_Display_Name_EN: data.SH_Display_Name_EN || data.SH_Code || partnerId,
          SH_Display_Name_FR: data.SH_Display_Name_FR || data.SH_Code || partnerId,
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
    
    return partners.sort((a, b) => 
      a.SH_Display_Name_EN.localeCompare(b.SH_Display_Name_EN, 'fr', { sensitivity: 'base' })
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des partenaires:', error);
    return [];
  }
}

/**
 * Récupère les informations détaillées d'un partenaire spécifique par son ID.
 * @param partnerId - L'identifiant unique du partenaire à récupérer.
 * @returns Un objet ShortcodeItem contenant les informations du partenaire, ou null si le partenaire n'est pas trouvé ou en cas d'erreur.
 */
export async function getPartnerById(partnerId: string): Promise<ShortcodeItem | null> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: code.ts - Fonction: getPartnerById - Path: shortcodes/${partnerId}");
    const partnerRef = doc(db, 'shortcodes', partnerId);
    const partnerDoc = await getDoc(partnerRef);

    if (!partnerDoc.exists()) {
      return null;
    }

    const data = partnerDoc.data();
    return {
      id: partnerDoc.id,
      SH_Code: data.SH_Code || partnerDoc.id,
      SH_Display_Name_EN: data.SH_Display_Name_EN || data.SH_Code || partnerDoc.id,
      SH_Display_Name_FR: data.SH_Display_Name_FR || data.SH_Code || partnerDoc.id,
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