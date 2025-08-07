/**
 * Ce fichier gère toutes les interactions avec Firebase Firestore pour récupérer diverses listes et données.
 * Il inclut des fonctions pour obtenir des listes dynamiques (shortcodes),
 * des dimensions client, des buckets de campagne, des informations administratives de campagne,
 * et des données financières comme les frais et les taux de change.
 * L'objectif est de centraliser la logique de récupération de données pour assurer la cohérence.
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export interface ListItem {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Display_Name_EN?: string;
  SH_Default_UTM?: string;
  SH_Logo?: string;
  SH_Type?: string;
  SH_Tags?: string[];
}

export interface ClientCustomDimensions {
  Custom_Dim_CA_1?: string;
  Custom_Dim_CA_2?: string;
  Custom_Dim_CA_3?: string;
  Custom_Dim_TC_1?: string;
  Custom_Dim_TC_2?: string;
  Custom_Dim_TC_3?: string;
}

export interface CampaignBucket {
  id: string;
  name: string;
  description?: string;
  target: number;
  color?: string;
}

export interface Fee {
  id: string;
  FE_Name: string;
  FE_Calculation_Type: 'Pourcentage budget' | 'Volume d\'unité' | 'Unités' | 'Frais fixe';
  FE_Calculation_Mode: 'Directement sur le budget média' | 'Applicable sur les frais précédents';
  FE_Order: number;
  options: FeeOption[];
}

export interface FeeOption {
  id: string;
  FO_Option: string;
  FO_Value: number;
  FO_Buffer: number;
  FO_Editable: boolean;
}

/**
 * Récupère une liste dynamique pour un champ spécifique en cherchant d'abord pour le client, puis pour PlusCo si non trouvée.
 * @param {string} fieldId - L'identifiant du champ pour lequel récupérer la liste.
 * @param {string} clientId - L'identifiant du client.
 * @returns {Promise<ListItem[]>} Une promesse qui résout en un tableau d'éléments de liste.
 */
export async function getDynamicList(
  fieldId: string,
  clientId: string
): Promise<ListItem[]> {
  try {
    let shortcodeIds = await getClientShortcodeIds(fieldId, clientId);

    if (shortcodeIds.length === 0) {
      shortcodeIds = await getClientShortcodeIds(fieldId, 'PlusCo');
    }

    if (shortcodeIds.length === 0) {
      return [];
    }

    const shortcodes = await getShortcodeDetails(shortcodeIds);

    return shortcodes;

  } catch (error) {
    console.error(`Erreur lors de la récupération de la liste ${fieldId}:`, error);
    return [];
  }
}

/**
 * Récupère les IDs des shortcodes associés à un champ et un client spécifiques.
 * @param {string} fieldId - L'identifiant du champ.
 * @param {string} clientId - L'identifiant du client.
 * @returns {Promise<string[]>} Une promesse qui résout en un tableau d'identifiants de shortcodes.
 */
async function getClientShortcodeIds(
  fieldId: string,
  clientId: string
): Promise<string[]> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: tactiqueListService.ts - Fonction: getClientShortcodeIds - Path: lists/${fieldId}/clients/${clientId}/shortcodes");
    const shortcodesRef = collection(
      db,
      'lists',
      fieldId,
      'clients',
      clientId,
      'shortcodes'
    );

    const snapshot = await getDocs(shortcodesRef);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => doc.id);

  } catch (error) {
    console.error(`Erreur lors de la récupération des shortcodes pour ${fieldId}/${clientId}:`, error);
    return [];
  }
}

/**
 * Récupère les détails complets des shortcodes à partir de leurs IDs.
 * @param {string[]} shortcodeIds - Un tableau d'identifiants de shortcodes.
 * @returns {Promise<ListItem[]>} Une promesse qui résout en un tableau d'objets ListItem détaillés.
 */
async function getShortcodeDetails(shortcodeIds: string[]): Promise<ListItem[]> {
  try {
    const shortcodes: ListItem[] = [];

    for (const id of shortcodeIds) {
      console.log("FIREBASE: LECTURE - Fichier: tactiqueListService.ts - Fonction: getShortcodeDetails - Path: shortcodes/${id}");
      const shortcodeRef = doc(db, 'shortcodes', id);
      const shortcodeSnap = await getDoc(shortcodeRef);

      if (shortcodeSnap.exists()) {
        const data = shortcodeSnap.data();
        shortcodes.push({
          id: shortcodeSnap.id,
          SH_Code: data.SH_Code || shortcodeSnap.id,
          SH_Display_Name_FR: data.SH_Display_Name_FR || data.SH_Code || shortcodeSnap.id,
          SH_Display_Name_EN: data.SH_Display_Name_EN,
          SH_Default_UTM: data.SH_Default_UTM,
          SH_Logo: data.SH_Logo,
          SH_Type: data.SH_Type,
          SH_Tags: data.SH_Tags,
        });
      }
    }

    return shortcodes.sort((a, b) =>
      a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
    );

  } catch (error) {
    console.error('Erreur lors de la récupération des détails des shortcodes:', error);
    return [];
  }
}

/**
 * Récupère les dimensions personnalisées configurées pour un client.
 * @param {string} clientId - L'identifiant du client.
 * @returns {Promise<ClientCustomDimensions>} Une promesse qui résout en un objet contenant les dimensions personnalisées du client.
 */
export async function getClientCustomDimensions(clientId: string): Promise<ClientCustomDimensions> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: tactiqueListService.ts - Fonction: getClientCustomDimensions - Path: clients/${clientId}");
    const clientRef = doc(db, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);

    if (!clientSnap.exists()) {
      return {};
    }

    const data = clientSnap.data();

    return {
      Custom_Dim_CA_1: data.Custom_Dim_CA_1,
      Custom_Dim_CA_2: data.Custom_Dim_CA_2,
      Custom_Dim_CA_3: data.Custom_Dim_CA_3,
      Custom_Dim_TC_1: data.Custom_Dim_TC_1,
      Custom_Dim_TC_2: data.Custom_Dim_TC_2,
      Custom_Dim_TC_3: data.Custom_Dim_TC_3,
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des dimensions personnalisées:', error);
    return {};
  }
}

/**
 * Récupère les buckets de campagne configurés pour une campagne et une version spécifiques.
 * @param {string} clientId - L'identifiant du client.
 * @param {string} campaignId - L'identifiant de la campagne.
 * @param {string} versionId - L'identifiant de la version de la campagne.
 * @returns {Promise<CampaignBucket[]>} Une promesse qui résout en un tableau d'objets CampaignBucket.
 */
export async function getCampaignBuckets(
  clientId: string,
  campaignId: string,
  versionId: string
): Promise<CampaignBucket[]> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: tactiqueListService.ts - Fonction: getCampaignBuckets - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/buckets");
    const bucketsRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'buckets'
    );

    const q = query(bucketsRef, orderBy('name'));
    const snapshot = await getDocs(q);

    const buckets: CampaignBucket[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      buckets.push({
        id: doc.id,
        name: data.name || 'Sans nom',
        description: data.description,
        target: data.target || 0,
        color: data.color,
      });
    });

    return buckets;

  } catch (error) {
    console.error('Erreur lors de la récupération des buckets:', error);
    return [];
  }
}

/**
 * Vérifie si une liste dynamique existe pour un champ donné, d'abord pour le client puis pour PlusCo.
 * @param {string} fieldId - L'identifiant du champ.
 * @param {string} clientId - L'identifiant du client.
 * @returns {Promise<boolean>} Une promesse qui résout à vrai si une liste existe, faux sinon.
 */
export async function hasDynamicList(
  fieldId: string,
  clientId: string
): Promise<boolean> {
  try {
    let shortcodeIds = await getClientShortcodeIds(fieldId, clientId);

    if (shortcodeIds.length > 0) {
      return true;
    }

    shortcodeIds = await getClientShortcodeIds(fieldId, 'PlusCo');
    return shortcodeIds.length > 0;

  } catch (error) {
    console.error(`Erreur lors de la vérification de la liste ${fieldId}:`, error);
    return false;
  }
}

/**
 * Récupère les valeurs administratives (ID de facturation, PO) pour une campagne spécifique.
 * @param {string} clientId - L'identifiant du client.
 * @param {string} campaignId - L'identifiant de la campagne.
 * @returns {Promise<{ CA_Billing_ID?: string; CA_PO?: string }>} Une promesse qui résout en un objet contenant les valeurs administratives.
 */
export async function getCampaignAdminValues(
  clientId: string,
  campaignId: string
): Promise<{ CA_Billing_ID?: string; CA_PO?: string }> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: tactiqueListService.ts - Fonction: getCampaignAdminValues - Path: clients/${clientId}/campaigns/${campaignId}");
    const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (!campaignSnap.exists()) {
      return {};
    }

    const data = campaignSnap.data();

    return {
      CA_Billing_ID: data.CA_Billing_ID,
      CA_PO: data.CA_PO,
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des valeurs admin de la campagne:', error);
    return {};
  }
}

/**
 * Récupère les frais configurés pour un client, y compris leurs options.
 * @param {string} clientId - L'identifiant du client.
 * @returns {Promise<Fee[]>} Une promesse qui résout en un tableau d'objets Fee.
 */
export async function getClientFees(clientId: string): Promise<Fee[]> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: tactiqueListService.ts - Fonction: getClientFees - Path: clients/${clientId}/fees");
    const feesRef = collection(db, 'clients', clientId, 'fees');
    const q = query(feesRef, orderBy('FE_Order', 'asc'));
    const snapshot = await getDocs(q);

    const fees: Fee[] = [];

    for (const feeDoc of snapshot.docs) {
      const feeData = { id: feeDoc.id, ...feeDoc.data() } as Omit<Fee, 'options'>;

      console.log("FIREBASE: LECTURE - Fichier: tactiqueListService.ts - Fonction: getClientFees - Path: clients/${clientId}/fees/${feeDoc.id}/options");
      const optionsRef = collection(db, 'clients', clientId, 'fees', feeDoc.id, 'options');
      const optionsSnapshot = await getDocs(optionsRef);

      const options: FeeOption[] = optionsSnapshot.docs.map(optionDoc => ({
        id: optionDoc.id,
        ...optionDoc.data()
      } as FeeOption));

      fees.push({
        ...feeData,
        options
      });
    }

    return fees;
  } catch (error) {
    console.error('Erreur lors de la récupération des frais client:', error);
    return [];
  }
}

/**
 * Récupère la devise principale d'une campagne.
 * @param {string} clientId - L'identifiant du client.
 * @param {string} campaignId - L'identifiant de la campagne.
 * @returns {Promise<string>} Une promesse qui résout en la devise de la campagne (par défaut 'CAD' si non trouvée).
 */
export async function getCampaignCurrency(clientId: string, campaignId: string): Promise<string> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: tactiqueListService.ts - Fonction: getCampaignCurrency - Path: clients/${clientId}/campaigns/${campaignId}");
    const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (!campaignSnap.exists()) {
      console.warn('Campagne non trouvée, devise par défaut: CAD');
      return 'CAD';
    }

    const campaignData = campaignSnap.data();
    return campaignData.CA_Currency || 'CAD';
  } catch (error) {
    console.error('Erreur lors de la récupération de la devise de campagne:', error);
    return 'CAD';
  }
}

/**
 * Récupère les taux de change configurés pour un client.
 * @param {string} clientId - L'identifiant du client.
 * @returns {Promise<{ [key: string]: number }>} Une promesse qui résout en un objet mappant les clés de taux de change aux valeurs numériques.
 */
export async function getExchangeRates(clientId: string): Promise<{ [key: string]: number }> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: tactiqueListService.ts - Fonction: getExchangeRates - Path: clients/${clientId}/currencies");
    const ratesRef = collection(db, 'clients', clientId, 'currencies');
    const snapshot = await getDocs(ratesRef);

    const rates: { [key: string]: number } = {};

    snapshot.docs.forEach(doc => {
      const currencyData = doc.data();
      const fromCurrency = currencyData.CU_From;
      const toCurrency = currencyData.CU_To;
      const rate = currencyData.CU_Rate;

      const rateKey = `${fromCurrency}_${toCurrency}`;
      rates[rateKey] = rate;

    });

    return rates;
  } catch (error) {
    console.error('Erreur lors de la récupération des taux de change:', error);
    return {};
  }
}