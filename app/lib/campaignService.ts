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
import { createDefaultBreakdown, updateDefaultBreakdownDates } from './breakdownService';

// Fonction intégrée pour créer la version originale
async function createOriginalVersion(
  clientId: string,
  campaignId: string,
  userEmail: string
): Promise<string> {
  try {
    console.log('createOriginalVersion - Début', {
      clientId,
      campaignId,
      userEmail,
    });

    const versionsRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions'
    );
    const originalVersion = {
      name: 'Originale',
      isOfficial: true,
      createdAt: new Date().toISOString(),
      createdBy: userEmail,
    };

    console.log('createOriginalVersion - Ajout du document...');
    const docRef = await addDoc(versionsRef, originalVersion);
    console.log('createOriginalVersion - Version créée avec ID:', docRef.id);

    // Mettre à jour la campagne avec l'ID de la version officielle
    console.log('createOriginalVersion - Mise à jour de la campagne...');
    const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
    await updateDoc(campaignRef, {
      officialVersionId: docRef.id,
    });
    console.log('createOriginalVersion - Campagne mise à jour');

    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la version originale:', error);
    throw error;
  }
}

// Obtenir toutes les campagnes pour un client spécifique
export async function getCampaigns(clientId: string): Promise<Campaign[]> {
  try {
    console.log('Récupération des campagnes pour le client:', clientId);
    const campaignsCollection = collection(
      db,
      'clients',
      clientId,
      'campaigns'
    );
    const q = query(campaignsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    console.log('Nombre de campagnes trouvées:', querySnapshot.size);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Campaign)
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    throw error;
  }
}

// Créer une nouvelle campagne pour un client spécifique
export async function createCampaign(
  clientId: string,
  campaignData: CampaignFormData,
  userEmail: string,
  additionalBreakdowns: any[] = [] // Breakdowns additionnels créés lors de la création
): Promise<string> {
  try {
    console.log(
      'createCampaign - Début, clientId:',
      clientId,
      'userEmail:',
      userEmail
    );

    const campaignsCollection = collection(
      db,
      'clients',
      clientId,
      'campaigns'
    );
    const now = new Date().toISOString();

    // Conversion des champs numériques
    const newCampaign = {
      // Infos
      name: campaignData.name,
      division: campaignData.division || '',
      status: campaignData.status,
      quarter: campaignData.quarter,
      year: parseInt(campaignData.year),
      creativeFolder: campaignData.creativeFolder || '',
      customDim1: campaignData.customDim1 || '',
      customDim2: campaignData.customDim2 || '',
      customDim3: campaignData.customDim3 || '',

      // Dates
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      sprintDates: campaignData.sprintDates || '',
      lastEdit: now,

      // Budget
      budget: parseFloat(campaignData.budget) || 0,
      currency: campaignData.currency || 'CAD',
      customFee1: campaignData.customFee1
        ? parseFloat(campaignData.customFee1)
        : null,
      customFee2: campaignData.customFee2
        ? parseFloat(campaignData.customFee2)
        : null,
      customFee3: campaignData.customFee3
        ? parseFloat(campaignData.customFee3)
        : null,
      customFee4: campaignData.customFee4
        ? parseFloat(campaignData.customFee4)
        : null,
      customFee5: campaignData.customFee5
        ? parseFloat(campaignData.customFee5)
        : null,

      // Admin
      clientId: clientId,
      clientExtId: campaignData.clientExtId || '',
      po: campaignData.po || '',
      billingId: campaignData.billingId || '',

      // Métadonnées
      createdAt: now,
      updatedAt: now,
    };

    // Créer la campagne
    console.log('createCampaign - Création de la campagne...');
    const docRef = await addDoc(campaignsCollection, newCampaign);
    console.log('createCampaign - Campagne créée avec ID:', docRef.id);

    // Créer automatiquement la version "Originale"
    console.log('createCampaign - Création de la version originale...');
    try {
      await createOriginalVersion(clientId, docRef.id, userEmail);
      console.log('createCampaign - Version originale créée avec succès');
    } catch (versionError) {
      console.error(
        'createCampaign - Erreur lors de la création de la version:',
        versionError
      );
      // On ne propage pas l'erreur pour que la campagne soit quand même créée
    }

    // Créer le breakdown par défaut "Calendrier" (RÉACTIVÉ)
    console.log('createCampaign - Création du breakdown par défaut...');
    try {
      await createDefaultBreakdown(
        clientId,
        docRef.id,
        campaignData.startDate,
        campaignData.endDate
      );
      console.log('createCampaign - Breakdown par défaut créé avec succès');
    } catch (breakdownError) {
      console.error(
        'createCampaign - Erreur lors de la création du breakdown par défaut:',
        breakdownError
      );
      // On ne propage pas l'erreur pour que la campagne soit quand même créée
    }

    // Créer les breakdowns additionnels si fournis
    if (additionalBreakdowns.length > 0) {
      console.log('createCampaign - Création des breakdowns additionnels...');
      try {
        const { createBreakdown } = await import('./breakdownService');
        
        for (const breakdown of additionalBreakdowns) {
          await createBreakdown(clientId, docRef.id, breakdown, false);
        }
        console.log('createCampaign - Breakdowns additionnels créés avec succès');
      } catch (additionalBreakdownError) {
        console.error(
          'createCampaign - Erreur lors de la création des breakdowns additionnels:',
          additionalBreakdownError
        );
        // On ne propage pas l'erreur pour que la campagne soit quand même créée
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la campagne:', error);
    throw error;
  }
}

// Mettre à jour une campagne existante pour un client spécifique
export async function updateCampaign(
  clientId: string,
  campaignId: string,
  campaignData: CampaignFormData
): Promise<void> {
  try {
    const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
    const now = new Date().toISOString();

    // Récupérer les anciennes données pour comparer les dates
    const oldCampaignData = await getCampaigns(clientId);
    const oldCampaign = oldCampaignData.find(c => c.id === campaignId);

    const updatedCampaign = {
      // Infos
      name: campaignData.name,
      division: campaignData.division || '',
      status: campaignData.status,
      quarter: campaignData.quarter,
      year: parseInt(campaignData.year),
      creativeFolder: campaignData.creativeFolder || '',
      customDim1: campaignData.customDim1 || '',
      customDim2: campaignData.customDim2 || '',
      customDim3: campaignData.customDim3 || '',

      // Dates
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      sprintDates: campaignData.sprintDates || '',
      lastEdit: now,

      // Budget
      budget: parseFloat(campaignData.budget) || 0,
      currency: campaignData.currency || 'CAD',
      customFee1: campaignData.customFee1
        ? parseFloat(campaignData.customFee1)
        : null,
      customFee2: campaignData.customFee2
        ? parseFloat(campaignData.customFee2)
        : null,
      customFee3: campaignData.customFee3
        ? parseFloat(campaignData.customFee3)
        : null,
      customFee4: campaignData.customFee4
        ? parseFloat(campaignData.customFee4)
        : null,
      customFee5: campaignData.customFee5
        ? parseFloat(campaignData.customFee5)
        : null,

      // Admin
      clientExtId: campaignData.clientExtId || '',
      po: campaignData.po || '',
      billingId: campaignData.billingId || '',

      // Métadonnées
      updatedAt: now,
    };

    await updateDoc(campaignRef, updatedCampaign);

    // Vérifier si les dates ont changé et mettre à jour le breakdown par défaut
    if (oldCampaign && 
        (oldCampaign.startDate !== campaignData.startDate || 
         oldCampaign.endDate !== campaignData.endDate)) {
      console.log('updateCampaign - Mise à jour des dates du breakdown par défaut...');
      try {
        await updateDefaultBreakdownDates(
          clientId,
          campaignId,
          campaignData.startDate,
          campaignData.endDate
        );
        console.log('updateCampaign - Dates du breakdown par défaut mises à jour');
      } catch (breakdownError) {
        console.error(
          'updateCampaign - Erreur lors de la mise à jour du breakdown par défaut:',
          breakdownError
        );
        // On ne propage pas l'erreur pour que la campagne soit quand même mise à jour
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la campagne:', error);
    throw error;
  }
}

// Supprimer une campagne
export async function deleteCampaign(
  clientId: string,
  campaignId: string
): Promise<void> {
  try {
    const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
    await deleteDoc(campaignRef);
  } catch (error) {
    console.error('Erreur lors de la suppression de la campagne:', error);
    throw error;
  }
}