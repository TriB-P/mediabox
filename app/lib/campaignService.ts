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

    // S'assurer que chaque campagne a un breakdown par défaut
    const campaigns = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Campaign)
    );

    // Vérifier et créer les breakdowns par défaut manquants en arrière-plan
    campaigns.forEach(async (campaign) => {
      if (campaign.startDate && campaign.endDate) {
        try {
          await ensureDefaultBreakdownExists(
            clientId,
            campaign.id,
            campaign.startDate,
            campaign.endDate
          );
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

    // Créer tous les breakdowns (y compris le breakdown par défaut)
    if (additionalBreakdowns.length > 0) {
      console.log('createCampaign - Création des breakdowns...');
      try {
        const { createBreakdown } = await import('./breakdownService');
        
        for (const breakdown of additionalBreakdowns) {
          const isDefaultBreakdown = breakdown.isDefault || false;
          await createBreakdown(clientId, docRef.id, breakdown, isDefaultBreakdown);
        }
        console.log('createCampaign - Breakdowns créés avec succès');
      } catch (breakdownError) {
        console.error(
          'createCampaign - Erreur lors de la création des breakdowns:',
          breakdownError
        );
        // On ne propage pas l'erreur pour que la campagne soit quand même créée
      }
    } else {
      // Si pas de breakdowns fournis, créer quand même le breakdown par défaut
      console.log('createCampaign - Aucun breakdown fourni, création du breakdown par défaut...');
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
        // S'assurer qu'un breakdown par défaut existe avant de le mettre à jour
        await ensureDefaultBreakdownExists(
          clientId,
          campaignId,
          campaignData.startDate,
          campaignData.endDate
        );
        
        // Puis mettre à jour ses dates
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

// Supprimer une campagne et toutes ses sous-collections
export async function deleteCampaign(
  clientId: string,
  campaignId: string
): Promise<void> {
  try {
    console.log('Suppression de la campagne:', campaignId);
    
    // Supprimer toutes les sous-collections d'abord
    await deleteAllSubcollections(clientId, campaignId);
    
    // Supprimer la campagne elle-même
    const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
    await deleteDoc(campaignRef);
    
    console.log('Campagne supprimée avec succès:', campaignId);
  } catch (error) {
    console.error('Erreur lors de la suppression de la campagne:', error);
    throw error;
  }
}

// Dupliquer une campagne avec toutes ses sous-collections
export async function duplicateCampaign(
  clientId: string,
  sourceCampaignId: string,
  userEmail: string,
  newName?: string
): Promise<string> {
  try {
    console.log('Duplication de la campagne:', sourceCampaignId);
    
    // Récupérer la campagne source
    const campaigns = await getCampaigns(clientId);
    const sourceCampaign = campaigns.find(c => c.id === sourceCampaignId);
    
    if (!sourceCampaign) {
      throw new Error('Campagne source non trouvée');
    }
    
    // Préparer les données de la nouvelle campagne
    const now = new Date().toISOString();
    const duplicatedName = newName || `${sourceCampaign.name} - Copie`;
    
    const newCampaignData = {
      ...sourceCampaign,
      name: duplicatedName,
      status: 'Draft' as const, // Nouvelle campagne en brouillon
      createdAt: now,
      updatedAt: now,
      lastEdit: now,
    };
    
    // Supprimer les champs qui ne doivent pas être copiés ou qui sont undefined
    delete (newCampaignData as any).id;
    delete (newCampaignData as any).officialVersionId; // Sera défini après création de la version
    
    // Créer la nouvelle campagne
    const campaignsCollection = collection(db, 'clients', clientId, 'campaigns');
    const docRef = await addDoc(campaignsCollection, newCampaignData);
    const newCampaignId = docRef.id;
    
    console.log('Nouvelle campagne créée avec ID:', newCampaignId);
    
    // Dupliquer toutes les sous-collections
    await duplicateAllSubcollections(clientId, sourceCampaignId, newCampaignId, userEmail);
    
    console.log('Campagne dupliquée avec succès:', newCampaignId);
    return newCampaignId;
  } catch (error) {
    console.error('Erreur lors de la duplication de la campagne:', error);
    throw error;
  }
}

// Fonction utilitaire pour supprimer toutes les sous-collections
async function deleteAllSubcollections(
  clientId: string,
  campaignId: string
): Promise<void> {
  const subcollections = ['versions', 'breakdowns', 'sections', 'tactiques', 'onglets', 'placements', 'creatifs'];
  
  for (const subcollection of subcollections) {
    try {
      const subRef = collection(db, 'clients', clientId, 'campaigns', campaignId, subcollection);
      const snapshot = await getDocs(subRef);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`Sous-collection ${subcollection} supprimée`);
    } catch (error) {
      console.warn(`Erreur lors de la suppression de ${subcollection}:`, error);
      // Continuer même si une sous-collection échoue
    }
  }
}

// Fonction utilitaire pour dupliquer toutes les sous-collections
async function duplicateAllSubcollections(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  userEmail: string
): Promise<void> {
  try {
    // 1. Dupliquer les versions
    await duplicateVersions(clientId, sourceCampaignId, newCampaignId, userEmail);
    
    // 2. Dupliquer les breakdowns
    await duplicateBreakdowns(clientId, sourceCampaignId, newCampaignId);
    
    // 3. Dupliquer les onglets (s'ils existent)
    await duplicateOnglets(clientId, sourceCampaignId, newCampaignId);
    
    // 4. Dupliquer les sections et tactiques
    await duplicateSectionsAndTactiques(clientId, sourceCampaignId, newCampaignId);
    
  } catch (error) {
    console.error('Erreur lors de la duplication des sous-collections:', error);
    throw error;
  }
}

// Dupliquer les versions
async function duplicateVersions(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  userEmail: string
): Promise<void> {
  try {
    const versionsRef = collection(db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions');
    const snapshot = await getDocs(versionsRef);
    
    const newVersionsRef = collection(db, 'clients', clientId, 'campaigns', newCampaignId, 'versions');
    let newOfficialVersionId = '';
    
    for (const versionDoc of snapshot.docs) {
      const versionData = versionDoc.data();
      const newVersionData = {
        ...versionData,
        createdAt: new Date().toISOString(),
        createdBy: userEmail,
      };
      
      const newVersionRef = await addDoc(newVersionsRef, newVersionData);
      
      if (versionData.isOfficial) {
        newOfficialVersionId = newVersionRef.id;
      }
    }
    
    // Mettre à jour la campagne avec l'ID de la version officielle
    if (newOfficialVersionId) {
      const campaignRef = doc(db, 'clients', clientId, 'campaigns', newCampaignId);
      await updateDoc(campaignRef, { officialVersionId: newOfficialVersionId });
    }
    
    console.log('Versions dupliquées avec succès');
  } catch (error) {
    console.error('Erreur lors de la duplication des versions:', error);
    throw error;
  }
}