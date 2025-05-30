// app/lib/tactiqueListService.ts

import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

// Types pour les éléments de liste
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

// Types pour les dimensions personnalisées du client
export interface ClientCustomDimensions {
  Custom_Dim_CA_1?: string;
  Custom_Dim_CA_2?: string;
  Custom_Dim_CA_3?: string;
  Custom_Dim_TC_1?: string;
  Custom_Dim_TC_2?: string;
  Custom_Dim_TC_3?: string;
}

// Types pour les buckets de campagne
export interface CampaignBucket {
  id: string;
  name: string;
  description?: string;
  target: number;
  color?: string;
}

// Types pour les frais (nouvellement ajoutés)
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
 * Récupère une liste dynamique pour un champ spécifique
 * Logique : Cherche d'abord pour le client, sinon utilise PlusCo
 */
export async function getDynamicList(
  fieldId: string,
  clientId: string
): Promise<ListItem[]> {
  try {
    console.log(`Récupération de la liste dynamique pour ${fieldId}, client: ${clientId}`);
    
    // 1. Essayer d'abord avec le client spécifique
    let shortcodeIds = await getClientShortcodeIds(fieldId, clientId);
    
    // 2. Si pas trouvé, utiliser PlusCo
    if (shortcodeIds.length === 0) {
      console.log(`Pas de liste trouvée pour ${clientId}, utilisation de PlusCo`);
      shortcodeIds = await getClientShortcodeIds(fieldId, 'PlusCo');
    }
    
    // 3. Si toujours pas de shortcodes, retourner une liste vide
    if (shortcodeIds.length === 0) {
      console.log(`Aucune liste trouvée pour ${fieldId}`);
      return [];
    }
    
    // 4. Récupérer les détails des shortcodes
    const shortcodes = await getShortcodeDetails(shortcodeIds);
    
    console.log(`Liste dynamique récupérée pour ${fieldId}: ${shortcodes.length} éléments`);
    return shortcodes;
    
  } catch (error) {
    console.error(`Erreur lors de la récupération de la liste ${fieldId}:`, error);
    return [];
  }
}

/**
 * Récupère les IDs des shortcodes pour un client et un champ spécifique
 */
async function getClientShortcodeIds(
  fieldId: string,
  clientId: string
): Promise<string[]> {
  try {
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
 * Récupère les détails des shortcodes à partir de leurs IDs
 */
async function getShortcodeDetails(shortcodeIds: string[]): Promise<ListItem[]> {
  try {
    const shortcodes: ListItem[] = [];
    
    // Récupérer chaque shortcode individuellement
    for (const id of shortcodeIds) {
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
    
    // Trier par nom d'affichage français
    return shortcodes.sort((a, b) => 
      a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
    );
    
  } catch (error) {
    console.error('Erreur lors de la récupération des détails des shortcodes:', error);
    return [];
  }
}

/**
 * Récupère les dimensions personnalisées d'un client
 */
export async function getClientCustomDimensions(clientId: string): Promise<ClientCustomDimensions> {
  try {
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
 * Récupère les buckets disponibles pour une campagne
 */
export async function getCampaignBuckets(
  clientId: string,
  campaignId: string,
  versionId: string
): Promise<CampaignBucket[]> {
  try {
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
 * Vérifie si une liste dynamique existe pour un champ et un client
 */
export async function hasDynamicList(
  fieldId: string,
  clientId: string
): Promise<boolean> {
  try {
    // Vérifier d'abord pour le client
    let shortcodeIds = await getClientShortcodeIds(fieldId, clientId);
    
    if (shortcodeIds.length > 0) {
      return true;
    }
    
    // Vérifier pour PlusCo
    shortcodeIds = await getClientShortcodeIds(fieldId, 'PlusCo');
    return shortcodeIds.length > 0;
    
  } catch (error) {
    console.error(`Erreur lors de la vérification de la liste ${fieldId}:`, error);
    return false;
  }
}

/**
 * Récupère les valeurs de campagne pour les champs admin
 */
export async function getCampaignAdminValues(
  clientId: string,
  campaignId: string
): Promise<{ CA_Billing_ID?: string; CA_PO?: string }> {
  try {
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

// ==================== NOUVELLES FONCTIONS POUR LE BUDGET ====================

/**
 * Récupère les frais configurés pour un client
 */
export async function getClientFees(clientId: string): Promise<Fee[]> {
  try {
    const feesRef = collection(db, 'clients', clientId, 'fees');
    const q = query(feesRef, orderBy('FE_Order', 'asc'));
    const snapshot = await getDocs(q);
    
    const fees: Fee[] = [];
    
    for (const feeDoc of snapshot.docs) {
      const feeData = { id: feeDoc.id, ...feeDoc.data() } as Omit<Fee, 'options'>;
      
      // Charger les options pour ce frais
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
 * Récupère la devise de la campagne
 */
export async function getCampaignCurrency(clientId: string, campaignId: string): Promise<string> {
  try {
    const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);
    
    if (!campaignSnap.exists()) {
      console.warn('Campagne non trouvée, devise par défaut: CAD');
      return 'CAD';
    }
    
    const campaignData = campaignSnap.data();
    return campaignData.currency || 'CAD';
  } catch (error) {
    console.error('Erreur lors de la récupération de la devise de campagne:', error);
    return 'CAD'; // Devise par défaut
  }
}

/**
 * Récupère les taux de change du client
 */
export async function getExchangeRates(clientId: string): Promise<{ [key: string]: number }> {
  try {
    const ratesRef = collection(db, 'clients', clientId, 'currencies');
    const snapshot = await getDocs(ratesRef);
    
    const rates: { [key: string]: number } = {};
    
    snapshot.docs.forEach(doc => {
      const currencyData = doc.data();
      const fromCurrency = currencyData.CU_From;
      const toCurrency = currencyData.CU_To;
      const rate = currencyData.CU_Rate;
      
      // Créer une clé pour le taux de change (ex: "USD_CAD")
      const rateKey = `${fromCurrency}_${toCurrency}`;
      rates[rateKey] = rate;
      
      // Aussi stocker par devise source pour faciliter l'accès
      rates[fromCurrency] = rate;
    });
    
    return rates;
  } catch (error) {
    console.error('Erreur lors de la récupération des taux de change:', error);
    return {}; // Taux vides par défaut
  }
}