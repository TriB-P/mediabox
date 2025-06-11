import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Campaign, CampaignFormData } from '../types/campaign';
import { 
  createDefaultBreakdown, 
  updateDefaultBreakdownDates, 
  ensureDefaultBreakdownExists 
} from './breakdownService';
import {
  duplicateBreakdowns,
  duplicateOnglets,
  duplicateSectionsAndTactiques
} from './campaignDuplicationUtils';

// La fonction createOriginalVersion reste inchangée
async function createOriginalVersion(
  CA_Client: string,
  campaignId: string,
  userEmail: string
): Promise<string> {
  try {
    const versionsRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, 'versions');
    const originalVersion = {
      name: 'Originale',
      isOfficial: true,
      createdAt: new Date().toISOString(),
      createdBy: userEmail,
    };
    const docRef = await addDoc(versionsRef, originalVersion);
    const campaignRef = doc(db, 'clients', CA_Client, 'campaigns', campaignId);
    await updateDoc(campaignRef, { officialVersionId: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la version originale:', error);
    throw error;
  }
}

// getCampaigns reste inchangée
export async function getCampaigns(CA_Client: string): Promise<Campaign[]> {
  try {
    const campaignsCollection = collection(db, 'clients', CA_Client, 'campaigns');
    // 🔥 CORRECTION: Tri par date de début, de la plus récente à la plus ancienne
    const q = query(campaignsCollection, orderBy('CA_Start_Date', 'desc'));
    const querySnapshot = await getDocs(q);

    const campaigns = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Campaign));

    campaigns.forEach(async (campaign) => {
      if (campaign.CA_Start_Date && campaign.CA_End_Date) {
        try {
          await ensureDefaultBreakdownExists(CA_Client, campaign.id, campaign.CA_Start_Date, campaign.CA_End_Date);
        } catch (error) {
          console.warn(`Impossible de vérifier le breakdown par défaut pour la campagne ${campaign.id}:`, error);
        }
      }
    });

    return campaigns;
  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    throw error;
  }
}

export async function createCampaign(
  CA_Client: string,
  campaignData: CampaignFormData,
  userEmail: string,
  additionalBreakdowns: any[] = [] 
): Promise<string> {
  try {
    const campaignsCollection = collection(db, 'clients', CA_Client, 'campaigns');
    const now = new Date().toISOString();

    const newCampaign = {
      CA_Name: campaignData.CA_Name,
      CA_Campaign_Identifier: campaignData.CA_Campaign_Identifier,
      CA_Division: campaignData.CA_Division || '',
      CA_Status: campaignData.CA_Status,
      CA_Quarter: campaignData.CA_Quarter,
      CA_Year: parseInt(campaignData.CA_Year),
      CA_Creative_Folder: campaignData.CA_Creative_Folder || '',
      CA_Custom_Dim_1: campaignData.CA_Custom_Dim_1 || '',
      CA_Custom_Dim_2: campaignData.CA_Custom_Dim_2 || '',
      CA_Custom_Dim_3: campaignData.CA_Custom_Dim_3 || '',
      CA_Start_Date: campaignData.CA_Start_Date,
      CA_End_Date: campaignData.CA_End_Date,
      CA_Sprint_Dates: campaignData.CA_Sprint_Dates || '',
      CA_Last_Edit: now,
      CA_Budget: parseFloat(campaignData.CA_Budget) || 0,
      CA_Currency: campaignData.CA_Currency || 'CAD',
      CA_Custom_Fee_1: campaignData.CA_Custom_Fee_1 ? parseFloat(campaignData.CA_Custom_Fee_1) : null,
      CA_Custom_Fee_2: campaignData.CA_Custom_Fee_2 ? parseFloat(campaignData.CA_Custom_Fee_2) : null,
      CA_Custom_Fee_3: campaignData.CA_Custom_Fee_3 ? parseFloat(campaignData.CA_Custom_Fee_3) : null,
      CA_Client: CA_Client,
      CA_Client_Ext_Id: campaignData.CA_Client_Ext_Id || '',
      CA_PO: campaignData.CA_PO || '',
      CA_Billing_ID: campaignData.CA_Billing_ID || '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(campaignsCollection, newCampaign);
    await createOriginalVersion(CA_Client, docRef.id, userEmail);

    if (additionalBreakdowns.length > 0) {
      const { createBreakdown } = await import('./breakdownService');
      for (const breakdown of additionalBreakdowns) {
        await createBreakdown(CA_Client, docRef.id, breakdown, breakdown.isDefault || false);
      }
    } else {
      // 🔥 CORRECTION : On ne crée le breakdown par défaut que si les dates existent
      if (campaignData.CA_Start_Date && campaignData.CA_End_Date) {
        await createDefaultBreakdown(
          CA_Client,
          docRef.id,
          campaignData.CA_Start_Date,
          campaignData.CA_End_Date
        );
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la campagne:', error);
    throw error;
  }
}

// updateCampaign reste inchangée
export async function updateCampaign(
  CA_Client: string,
  campaignId: string,
  campaignData: CampaignFormData
): Promise<void> {
  try {
    const campaignRef = doc(db, 'clients', CA_Client, 'campaigns', campaignId);
    const now = new Date().toISOString();

    const oldCampaigns = await getCampaigns(CA_Client);
    const oldCampaign = oldCampaigns.find(c => c.id === campaignId);

    const updatedCampaign = {
      CA_Name: campaignData.CA_Name,
      CA_Campaign_Identifier: campaignData.CA_Campaign_Identifier,
      CA_Division: campaignData.CA_Division || '',
      CA_Status: campaignData.CA_Status,
      CA_Quarter: campaignData.CA_Quarter,
      CA_Year: parseInt(campaignData.CA_Year),
      CA_Creative_Folder: campaignData.CA_Creative_Folder || '',
      CA_Custom_Dim_1: campaignData.CA_Custom_Dim_1 || '',
      CA_Custom_Dim_2: campaignData.CA_Custom_Dim_2 || '',
      CA_Custom_Dim_3: campaignData.CA_Custom_Dim_3 || '',
      CA_Start_Date: campaignData.CA_Start_Date,
      CA_End_Date: campaignData.CA_End_Date,
      CA_Sprint_Dates: campaignData.CA_Sprint_Dates || '',
      CA_Last_Edit: now,
      CA_Budget: parseFloat(campaignData.CA_Budget) || 0,
      CA_Currency: campaignData.CA_Currency || 'CAD',
      CA_Custom_Fee_1: campaignData.CA_Custom_Fee_1 ? parseFloat(campaignData.CA_Custom_Fee_1) : null,
      CA_Custom_Fee_2: campaignData.CA_Custom_Fee_2 ? parseFloat(campaignData.CA_Custom_Fee_2) : null,
      CA_Custom_Fee_3: campaignData.CA_Custom_Fee_3 ? parseFloat(campaignData.CA_Custom_Fee_3) : null,
      CA_Client_Ext_Id: campaignData.CA_Client_Ext_Id || '',
      CA_PO: campaignData.CA_PO || '',
      CA_Billing_ID: campaignData.CA_Billing_ID || '',
      updatedAt: now,
    };

    await updateDoc(campaignRef, updatedCampaign);

    if (oldCampaign && 
        (oldCampaign.CA_Start_Date !== campaignData.CA_Start_Date || 
         oldCampaign.CA_End_Date !== campaignData.CA_End_Date)) {
      await ensureDefaultBreakdownExists(
        CA_Client,
        campaignId,
        campaignData.CA_Start_Date,
        campaignData.CA_End_Date
      );
      await updateDefaultBreakdownDates(
        CA_Client,
        campaignId,
        campaignData.CA_Start_Date,
        campaignData.CA_End_Date
      );
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la campagne:', error);
    throw error;
  }
}

// deleteCampaign et duplicateCampaign restent inchangées
export async function deleteCampaign(
  CA_Client: string,
  campaignId: string
): Promise<void> {
    try {
        const subcollections = ['versions', 'breakdowns'];
        for (const subcollection of subcollections) {
            const subRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, subcollection);
            const snapshot = await getDocs(subRef);
            for (const doc of snapshot.docs) {
                await deleteDoc(doc.ref);
            }
        }
        const campaignRef = doc(db, 'clients', CA_Client, 'campaigns', campaignId);
        await deleteDoc(campaignRef);
    } catch (error) {
        console.error('Erreur lors de la suppression de la campagne:', error);
        throw error;
    }
}

export async function duplicateCampaign(
  CA_Client: string,
  sourceCampaignId: string,
  userEmail: string,
  newName?: string
): Promise<string> {
    const campaigns = await getCampaigns(CA_Client);
    const sourceCampaign = campaigns.find(c => c.id === sourceCampaignId);
    if (!sourceCampaign) {
      throw new Error('Campagne source non trouvée');
    }
    
    const newCampaignData: any = { ...sourceCampaign };
    delete newCampaignData.id;
    delete newCampaignData.officialVersionId;
    
    newCampaignData.CA_Name = newName || `${sourceCampaign.CA_Name} - Copie`;
    newCampaignData.CA_Status = 'Draft';
    newCampaignData.createdAt = new Date().toISOString();
    newCampaignData.updatedAt = new Date().toISOString();
    newCampaignData.CA_Last_Edit = new Date().toISOString();

    const campaignsCollection = collection(db, 'clients', CA_Client, 'campaigns');
    const docRef = await addDoc(campaignsCollection, newCampaignData);
    const newCampaignId = docRef.id;

    await duplicateBreakdowns(CA_Client, sourceCampaignId, newCampaignId);
    await duplicateOnglets(CA_Client, sourceCampaignId, newCampaignId);
    await duplicateSectionsAndTactiques(CA_Client, sourceCampaignId, newCampaignId);
    await createOriginalVersion(CA_Client, newCampaignId, userEmail);

    return newCampaignId;
}