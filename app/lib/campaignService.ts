// app/lib/campaignService.ts
/**
 * Ce fichier gère toutes les opérations CRUD (Création, Lecture, Mise à jour, Suppression)
 * liées aux campagnes dans Firebase Firestore.
 * Il inclut également la logique pour dupliquer des campagnes entières,
 * créer des versions originales de campagnes et gérer les breakdowns par défaut associés.
 * C'est le point central pour interagir avec la collection 'campaigns' de Firebase.
 * CORRIGÉ: Suppression des appels répétés à ensureDefaultBreakdownExists dans getCampaigns
 * NOUVEAU: Support multilingue pour le nom du breakdown par défaut
 */
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
  duplicateCompleteCampaign
} from './campaignDuplicationUtils';
import { addOnglet } from './tactiqueService';

/**
 * Crée une version "Originale" pour une campagne donnée dans Firebase.
 * Cette version est marquée comme officielle et enregistre l'utilisateur et la date de création.
 * Crée également un onglet "General" par défaut dans cette version.
 * @param CA_Client L'identifiant du client.
 * @param campaignId L'identifiant de la campagne.
 * @param userEmail L'e-mail de l'utilisateur qui crée la version.
 * @returns L'identifiant du document de la version originale créée.
 */
async function createOriginalVersion(
  CA_Client: string,
  campaignId: string,
  userEmail: string
): Promise<string> {
  try {
    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: createOriginalVersion - Path: clients/${CA_Client}/campaigns/${campaignId}/versions");
    const versionsRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, 'versions');
    const originalVersion = {
      name: 'Version #1',
      isOfficial: true,
      createdAt: new Date().toISOString(),
      createdBy: userEmail,
    };
    const docRef = await addDoc(versionsRef, originalVersion);
    
    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: createOriginalVersion - Path: clients/${CA_Client}/campaigns/${campaignId}");
    const campaignRef = doc(db, 'clients', CA_Client, 'campaigns', campaignId);
    await updateDoc(campaignRef, { officialVersionId: docRef.id });

    // Créer l'onglet "General" par défaut
    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: createOriginalVersion - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${docRef.id}/onglets");
    await addOnglet(
      CA_Client,
      campaignId,
      docRef.id,
      {
        ONGLET_Name: 'General',
        ONGLET_Order: 0
      }
    );

    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la version originale:', error);
    throw error;
  }
}

/**
 * CORRIGÉ: Récupère toutes les campagnes pour un client donné, triées par date de début.
 * SUPPRESSION des appels automatiques à ensureDefaultBreakdownExists qui causaient des appels répétés.
 * @param CA_Client L'identifiant du client.
 * @returns Une promesse qui résout en un tableau d'objets Campaign.
 */
export async function getCampaigns(CA_Client: string): Promise<Campaign[]> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: campaignService.ts - Fonction: getCampaigns - Path: clients/${CA_Client}/campaigns");
    const campaignsCollection = collection(db, 'clients', CA_Client, 'campaigns');
    const q = query(campaignsCollection, orderBy('CA_Start_Date', 'desc'));
    const querySnapshot = await getDocs(q);

    const campaigns = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Campaign));

    // ❌ SUPPRIMÉ: Ces appels causaient des lectures répétées des breakdowns
    // campaigns.forEach(async (campaign) => {
    //   if (campaign.CA_Start_Date && campaign.CA_End_Date) {
    //     try {
    //       await ensureDefaultBreakdownExists(CA_Client, campaign.id, campaign.CA_Start_Date, campaign.CA_End_Date);
    //     } catch (error) {
    //       console.warn(`Impossible de vérifier le breakdown par défaut pour la campagne ${campaign.id}:`, error);
    //     }
    //   }
    // });

    return campaigns;
  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    throw error;
  }
}

/**
 * MODIFIÉ: Vérification des breakdowns par défaut à la demande avec support multilingue.
 * À appeler seulement quand une campagne est sélectionnée, pas à chaque getCampaigns.
 * @param CA_Client L'identifiant du client.
 * @param campaign L'objet campagne.
 * @param language La langue pour le nom du breakdown ('FR' ou 'EN'). Par défaut 'FR'.
 */
export async function ensureDefaultBreakdownForCampaign(
  CA_Client: string,
  campaign: Campaign,
  language?: 'FR' | 'EN' // NOUVEAU: Paramètre de langue
): Promise<void> {
  if (campaign.CA_Start_Date && campaign.CA_End_Date) {
    try {
      console.log(`✅ Vérification breakdown par défaut pour campagne ${campaign.id}`);
      await ensureDefaultBreakdownExists(
        CA_Client, 
        campaign.id, 
        campaign.CA_Start_Date, 
        campaign.CA_End_Date,
        language // NOUVEAU: Passer la langue
      );
    } catch (error) {
      console.warn(`Impossible de vérifier le breakdown par défaut pour la campagne ${campaign.id}:`, error);
    }
  }
}

/**
 * MODIFIÉ: Crée une nouvelle campagne dans Firebase avec les données fournies et support multilingue.
 * Initialise également une version originale et, si nécessaire, des breakdowns additionnels ou un breakdown par défaut.
 * @param CA_Client L'identifiant du client.
 * @param campaignData Les données du formulaire de la nouvelle campagne.
 * @param userEmail L'e-mail de l'utilisateur qui crée la campagne.
 * @param additionalBreakdowns Un tableau optionnel de breakdowns à ajouter lors de la création.
 * @param language La langue pour le nom du breakdown par défaut ('FR' ou 'EN'). Par défaut 'FR'.
 * @returns L'identifiant du document de la campagne créée.
 */
export async function createCampaign(
  CA_Client: string,
  campaignData: CampaignFormData,
  userEmail: string,
  additionalBreakdowns: any[] = [],
  language?: 'FR' | 'EN' // NOUVEAU: Paramètre de langue
): Promise<string> {
  try {
    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: createCampaign - Path: clients/${CA_Client}/campaigns");
    const campaignsCollection = collection(db, 'clients', CA_Client, 'campaigns');
    const now = new Date().toISOString();

    const newCampaign = {
      CA_Name: campaignData.CA_Name,
      CA_Campaign_Identifier: campaignData.CA_Campaign_Identifier,
      CA_Division: campaignData.CA_Division || '',
      CA_Status: campaignData.CA_Status,
      CA_Quarter: campaignData.CA_Quarter,
      CA_Year: campaignData.CA_Year,
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
      if (campaignData.CA_Start_Date && campaignData.CA_End_Date) {
        await createDefaultBreakdown(
          CA_Client,
          docRef.id,
          campaignData.CA_Start_Date,
          campaignData.CA_End_Date,
          language // NOUVEAU: Passer la langue
        );
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la campagne:', error);
    throw error;
  }
}

/**
 * MODIFIÉ: Met à jour une campagne existante dans Firebase avec les nouvelles données et support multilingue.
 * Si les dates de début ou de fin de la campagne changent, met à jour les dates du breakdown par défaut.
 * @param CA_Client L'identifiant du client.
 * @param campaignId L'identifiant de la campagne à mettre à jour.
 * @param campaignData Les données du formulaire mises à jour pour la campagne.
 * @param language La langue pour le nom du breakdown par défaut ('FR' ou 'EN'). Par défaut 'FR'.
 * @returns Une promesse qui résout une fois la mise à jour terminée.
 */
export async function updateCampaign(
  CA_Client: string,
  campaignId: string,
  campaignData: CampaignFormData,
  language?: 'FR' | 'EN' // NOUVEAU: Paramètre de langue
): Promise<void> {
  try {
    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: updateCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}");
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
      CA_Year: campaignData.CA_Year,
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
        campaignData.CA_End_Date,
        language // NOUVEAU: Passer la langue
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


/**
 * Supprime une campagne ainsi que toutes ses sous-collections complètes de Firebase.
 * CORRIGÉ: Nettoie maintenant toute la hiérarchie : versions/onglets/sections/tactiques/placements/creatifs + breakdowns
 * @param CA_Client L'identifiant du client.
 * @param campaignId L'identifiant de la campagne à supprimer.
 * @returns Une promesse qui résout une fois la suppression terminée.
 */
export async function deleteCampaign(
  CA_Client: string,
  campaignId: string
): Promise<void> {
  try {
    console.log(`🗑️ Début suppression campagne ${campaignId} et toute sa hiérarchie`);

    // 1. Supprimer toutes les versions avec leur hiérarchie complète
    console.log("FIREBASE: LECTURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions");
    const versionsRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, 'versions');
    const versionsSnapshot = await getDocs(versionsRef);
    
    for (const versionDoc of versionsSnapshot.docs) {
      const versionId = versionDoc.id;
      console.log(`🗑️ Suppression version ${versionId}`);
      
      // Supprimer tous les onglets de cette version
      console.log("FIREBASE: LECTURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${versionId}/onglets");
      const ongletsRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, 'versions', versionId, 'onglets');
      const ongletsSnapshot = await getDocs(ongletsRef);
      
      for (const ongletDoc of ongletsSnapshot.docs) {
        const ongletId = ongletDoc.id;
        console.log(`🗑️ Suppression onglet ${ongletId}`);
        
        // Supprimer toutes les sections de cet onglet
        console.log("FIREBASE: LECTURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections");
        const sectionsRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections');
        const sectionsSnapshot = await getDocs(sectionsRef);
        
        for (const sectionDoc of sectionsSnapshot.docs) {
          const sectionId = sectionDoc.id;
          console.log(`🗑️ Suppression section ${sectionId}`);
          
          // Supprimer toutes les tactiques de cette section
          console.log("FIREBASE: LECTURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques");
          const tactiquesRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques');
          const tactiquesSnapshot = await getDocs(tactiquesRef);
          
          for (const tactiqueDoc of tactiquesSnapshot.docs) {
            const tactiqueId = tactiqueDoc.id;
            console.log(`🗑️ Suppression tactique ${tactiqueId}`);
            
            // Supprimer tous les placements de cette tactique
            console.log("FIREBASE: LECTURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
            const placementsRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements');
            const placementsSnapshot = await getDocs(placementsRef);
            
            for (const placementDoc of placementsSnapshot.docs) {
              const placementId = placementDoc.id;
              console.log(`🗑️ Suppression placement ${placementId}`);
              
              // Supprimer tous les créatifs de ce placement
              console.log("FIREBASE: LECTURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs");
              const creatifsRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId, 'creatifs');
              const creatifsSnapshot = await getDocs(creatifsRef);
              
              // Supprimer tous les créatifs
              for (const creatifDoc of creatifsSnapshot.docs) {
                console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifDoc.id}");
                await deleteDoc(creatifDoc.ref);
              }
              
              // Supprimer le placement
              console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
              await deleteDoc(placementDoc.ref);
            }
            
            // Supprimer la tactique
            console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}");
            await deleteDoc(tactiqueDoc.ref);
          }
          
          // Supprimer la section
          console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}");
          await deleteDoc(sectionDoc.ref);
        }
        
        // Supprimer l'onglet
        console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}");
        await deleteDoc(ongletDoc.ref);
      }
      
      // Supprimer la version
      console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/versions/${versionId}");
      await deleteDoc(versionDoc.ref);
    }
    
    // 2. Supprimer les breakdowns (collection parallèle aux versions)
    console.log("FIREBASE: LECTURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/breakdowns");
    const breakdownsRef = collection(db, 'clients', CA_Client, 'campaigns', campaignId, 'breakdowns');
    const breakdownsSnapshot = await getDocs(breakdownsRef);
    
    for (const breakdownDoc of breakdownsSnapshot.docs) {
      console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}/breakdowns/${breakdownDoc.id}");
      await deleteDoc(breakdownDoc.ref);
    }
    
    // 3. Supprimer la campagne elle-même
    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: deleteCampaign - Path: clients/${CA_Client}/campaigns/${campaignId}");
    const campaignRef = doc(db, 'clients', CA_Client, 'campaigns', campaignId);
    await deleteDoc(campaignRef);
    
    console.log(`✅ Suppression complète de la campagne ${campaignId} terminée`);
    
  } catch (error) {
    console.error('Erreur lors de la suppression de la campagne:', error);
    throw error;
  }
}

/**
 * Duplique une campagne existante, y compris ses versions et ses breakdowns,
 * et crée une nouvelle campagne avec les données copiées.
 * @param CA_Client L'identifiant du client.
 * @param sourceCampaignId L'identifiant de la campagne source à dupliquer.
 * @param userEmail L'e-mail de l'utilisateur qui effectue la duplication.
 * @param newName Un nouveau nom optionnel pour la campagne dupliquée.
 * @returns L'identifiant du document de la nouvelle campagne dupliquée.
 */
export async function duplicateCampaign(
  CA_Client: string,
  sourceCampaignId: string,
  userEmail: string,
  newName?: string
): Promise<string> {
  try {
    const campaigns = await getCampaigns(CA_Client);
    const sourceCampaign = campaigns.find(c => c.id === sourceCampaignId);
    if (!sourceCampaign) {
      throw new Error('Campagne source non trouvée');
    }

    const newCampaignData: any = { ...sourceCampaign };
    delete newCampaignData.id;
    delete newCampaignData.officialVersionId;

    const originalName = sourceCampaign.CA_Name || 'Campagne sans nom';
    newCampaignData.CA_Name = newName || `${originalName} - Copie`;
    newCampaignData.CA_Status = 'Draft';
    newCampaignData.createdAt = new Date().toISOString();
    newCampaignData.updatedAt = new Date().toISOString();
    newCampaignData.CA_Last_Edit = new Date().toISOString();

    console.log("FIREBASE: ÉCRITURE - Fichier: campaignService.ts - Fonction: duplicateCampaign - Path: clients/${CA_Client}/campaigns");
    const campaignsCollection = collection(db, 'clients', CA_Client, 'campaigns');
    const docRef = await addDoc(campaignsCollection, newCampaignData);
    const newCampaignId = docRef.id;

    await duplicateCompleteCampaign(CA_Client, sourceCampaignId, newCampaignId);

    return newCampaignId;

  } catch (error) {
    console.error('Erreur lors de la duplication complète de campagne:', error);
    throw error;
  }
}