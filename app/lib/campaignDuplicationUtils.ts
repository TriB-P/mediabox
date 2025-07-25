/**
 * Ce fichier contient les utilitaires pour dupliquer une campagne Firebase existante.
 * Il gère la duplication de l'intégralité de la structure d'une campagne, y compris
 * les breakdowns, les versions, les onglets, les sections, les tactiques, les placements,
 * les créatifs et les buckets de stratégie.
 * L'objectif est de créer une copie complète et indépendante d'une campagne pour faciliter
 * la gestion et la réutilisation des structures de données.
 */
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

interface DuplicationMapping {
  versions: Map<string, string>;
  onglets: Map<string, string>;
  sections: Map<string, string>;
  tactiques: Map<string, string>;
  placements: Map<string, string>;
}

/**
 * Duplique l'intégralité du contenu d'une campagne, incluant les breakdowns et toute la hiérarchie des versions.
 * @param clientId L'ID du client auquel la campagne appartient.
 * @param sourceCampaignId L'ID de la campagne source à dupliquer.
 * @param newCampaignId L'ID de la nouvelle campagne qui sera créée.
 * @returns Une promesse qui se résout une fois la duplication complète terminée.
 */
export async function duplicateCompleteCampaign(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string
): Promise<void> {
  try {
    // 1. Dupliquer les breakdowns (structure simple)
    await duplicateBreakdowns(clientId, sourceCampaignId, newCampaignId);
    
    // 2. Dupliquer toute la hiérarchie des versions avec leur contenu
    await duplicateVersionsWithFullHierarchy(clientId, sourceCampaignId, newCampaignId);
    
  } catch (error) {
    console.error('❌ Erreur lors de la duplication complète:', error);
    throw error;
  }
}

/**
 * Duplique les breakdowns d'une campagne source vers une nouvelle campagne.
 * Les breakdowns sont des éléments de structure simples de la campagne.
 * @param clientId L'ID du client.
 * @param sourceCampaignId L'ID de la campagne source.
 * @param newCampaignId L'ID de la nouvelle campagne.
 * @returns Une promesse qui se résout une fois les breakdowns dupliqués.
 */
export async function duplicateBreakdowns(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string
): Promise<void> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateBreakdowns - Path: clients/${clientId}/campaigns/${sourceCampaignId}/breakdowns");
    const breakdownsRef = collection(db, 'clients', clientId, 'campaigns', sourceCampaignId, 'breakdowns');
    const q = query(breakdownsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return;
    }
    
    const newBreakdownsRef = collection(db, 'clients', clientId, 'campaigns', newCampaignId, 'breakdowns');
    
    for (const breakdownDoc of snapshot.docs) {
      const breakdownData = breakdownDoc.data();
      const newBreakdownData = {
        ...breakdownData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log("FIREBASE: ÉCRITURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateBreakdowns - Path: clients/${clientId}/campaigns/${newCampaignId}/breakdowns");
      await addDoc(newBreakdownsRef, newBreakdownData);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des breakdowns:', error);
    throw error;
  }
}

/**
 * Duplique toutes les versions d'une campagne avec leur hiérarchie complète (onglets, sections, tactiques, placements, créatifs et buckets).
 * @param clientId L'ID du client.
 * @param sourceCampaignId L'ID de la campagne source.
 * @param newCampaignId L'ID de la nouvelle campagne.
 * @returns Une promesse qui se résout une fois toutes les versions et leur contenu dupliqués.
 */
async function duplicateVersionsWithFullHierarchy(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string
): Promise<void> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateVersionsWithFullHierarchy - Path: clients/${clientId}/campaigns/${sourceCampaignId}/versions");
    const versionsRef = collection(db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions');
    const versionsSnapshot = await getDocs(query(versionsRef, orderBy('createdAt', 'asc')));
    
    if (versionsSnapshot.empty) {
      return;
    }
    
    for (const versionDoc of versionsSnapshot.docs) {
      const versionData = versionDoc.data();
      const sourceVersionId = versionDoc.id;
      
      const newVersionsRef = collection(db, 'clients', clientId, 'campaigns', newCampaignId, 'versions');
      console.log("FIREBASE: ÉCRITURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateVersionsWithFullHierarchy - Path: clients/${clientId}/campaigns/${newCampaignId}/versions");
      const newVersionRef = await addDoc(newVersionsRef, {
        ...versionData,
        createdAt: new Date().toISOString(),
      });
      const newVersionId = newVersionRef.id;
      
      await duplicateVersionContent(
        clientId, 
        sourceCampaignId, 
        newCampaignId, 
        sourceVersionId, 
        newVersionId
      );
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des versions:', error);
    throw error;
  }
}

/**
 * Duplique tout le contenu d'une version spécifique : les buckets de stratégie et la hiérarchie des onglets (sections, tactiques, placements, créatifs).
 * @param clientId L'ID du client.
 * @param sourceCampaignId L'ID de la campagne source.
 * @param newCampaignId L'ID de la nouvelle campagne.
 * @param sourceVersionId L'ID de la version source à dupliquer.
 * @param newVersionId L'ID de la nouvelle version.
 * @returns Une promesse qui se résout une fois le contenu de la version dupliqué.
 */
async function duplicateVersionContent(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  sourceVersionId: string,
  newVersionId: string
): Promise<void> {
  try {
    // 1. Dupliquer les buckets de stratégie
    await duplicateBuckets(clientId, sourceCampaignId, newCampaignId, sourceVersionId, newVersionId);
    
    // 2. Dupliquer la hiérarchie onglets → sections → tactiques → placements → créatifs
    await duplicateOngletsWithHierarchy(
      clientId, 
      sourceCampaignId, 
      newCampaignId, 
      sourceVersionId, 
      newVersionId
    );
    
  } catch (error) {
    console.error(`❌ Erreur lors de la duplication du contenu de la version ${sourceVersionId}:`, error);
    throw error;
  }
}

/**
 * Duplique les buckets de stratégie d'une version source vers une nouvelle version.
 * @param clientId L'ID du client.
 * @param sourceCampaignId L'ID de la campagne source.
 * @param newCampaignId L'ID de la nouvelle campagne.
 * @param sourceVersionId L'ID de la version source.
 * @param newVersionId L'ID de la nouvelle version.
 * @returns Une promesse qui se résout une fois les buckets dupliqués.
 */
async function duplicateBuckets(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  sourceVersionId: string,
  newVersionId: string
): Promise<void> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateBuckets - Path: clients/${clientId}/campaigns/${sourceCampaignId}/versions/${sourceVersionId}/buckets");
    const bucketsRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 'buckets'
    );
    const snapshot = await getDocs(bucketsRef);
    
    if (snapshot.empty) {
      return;
    }
    
    const newBucketsRef = collection(
      db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 'buckets'
    );
    
    for (const bucketDoc of snapshot.docs) {
      const bucketData = bucketDoc.data();
      console.log("FIREBASE: ÉCRITURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateBuckets - Path: clients/${clientId}/campaigns/${newCampaignId}/versions/${newVersionId}/buckets");
      await addDoc(newBucketsRef, {
        ...bucketData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des buckets:', error);
    console.warn('⚠️ Poursuite sans les buckets');
  }
}

/**
 * Duplique les onglets d'une version source avec leur hiérarchie complète (sections, tactiques, placements, créatifs).
 * @param clientId L'ID du client.
 * @param sourceCampaignId L'ID de la campagne source.
 * @param newCampaignId L'ID de la nouvelle campagne.
 * @param sourceVersionId L'ID de la version source.
 * @param newVersionId L'ID de la nouvelle version.
 * @returns Une promesse qui se résout une fois les onglets et leur contenu dupliqués.
 */
async function duplicateOngletsWithHierarchy(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  sourceVersionId: string,
  newVersionId: string
): Promise<void> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateOngletsWithHierarchy - Path: clients/${clientId}/campaigns/${sourceCampaignId}/versions/${sourceVersionId}/onglets");
    const ongletsRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 'onglets'
    );
    const ongletsSnapshot = await getDocs(query(ongletsRef, orderBy('ONGLET_Order', 'asc')));
    
    if (ongletsSnapshot.empty) {
      return;
    }
    
    for (const ongletDoc of ongletsSnapshot.docs) {
      const ongletData = ongletDoc.data();
      const sourceOngletId = ongletDoc.id;
      
      const newOngletsRef = collection(
        db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 'onglets'
      );
      console.log("FIREBASE: ÉCRITURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateOngletsWithHierarchy - Path: clients/${clientId}/campaigns/${newCampaignId}/versions/${newVersionId}/onglets");
      const newOngletRef = await addDoc(newOngletsRef, {
        ...ongletData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const newOngletId = newOngletRef.id;
      
      await duplicateSectionsWithHierarchy(
        clientId, 
        sourceCampaignId, 
        newCampaignId, 
        sourceVersionId, 
        newVersionId,
        sourceOngletId, 
        newOngletId
      );
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des onglets:', error);
    throw error;
  }
}

/**
 * Duplique les sections d'un onglet source avec leur hiérarchie complète (tactiques, placements, créatifs).
 * @param clientId L'ID du client.
 * @param sourceCampaignId L'ID de la campagne source.
 * @param newCampaignId L'ID de la nouvelle campagne.
 * @param sourceVersionId L'ID de la version source.
 * @param newVersionId L'ID de la nouvelle version.
 * @param sourceOngletId L'ID de l'onglet source.
 * @param newOngletId L'ID du nouvel onglet.
 * @returns Une promesse qui se résout une fois les sections et leur contenu dupliqués.
 */
async function duplicateSectionsWithHierarchy(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  sourceVersionId: string,
  newVersionId: string,
  sourceOngletId: string,
  newOngletId: string
): Promise<void> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateSectionsWithHierarchy - Path: clients/${clientId}/campaigns/${sourceCampaignId}/versions/${sourceVersionId}/onglets/${sourceOngletId}/sections");
    const sectionsRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 
      'onglets', sourceOngletId, 'sections'
    );
    const sectionsSnapshot = await getDocs(query(sectionsRef, orderBy('SECTION_Order', 'asc')));
    
    if (sectionsSnapshot.empty) {
      return;
    }
    
    for (const sectionDoc of sectionsSnapshot.docs) {
      const sectionData = sectionDoc.data();
      const sourceSectionId = sectionDoc.id;
      
      const newSectionsRef = collection(
        db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 
        'onglets', newOngletId, 'sections'
      );
      console.log("FIREBASE: ÉCRITURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateSectionsWithHierarchy - Path: clients/${clientId}/campaigns/${newCampaignId}/versions/${newVersionId}/onglets/${newOngletId}/sections");
      const newSectionRef = await addDoc(newSectionsRef, {
        ...sectionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const newSectionId = newSectionRef.id;
      
      await duplicateTactiquesWithHierarchy(
        clientId, 
        sourceCampaignId, 
        newCampaignId, 
        sourceVersionId, 
        newVersionId,
        sourceOngletId, 
        newOngletId, 
        sourceSectionId, 
        newSectionId
      );
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des sections:', error);
    throw error;
  }
}

/**
 * Duplique les tactiques d'une section source avec leur hiérarchie complète (placements, créatifs).
 * @param clientId L'ID du client.
 * @param sourceCampaignId L'ID de la campagne source.
 * @param newCampaignId L'ID de la nouvelle campagne.
 * @param sourceVersionId L'ID de la version source.
 * @param newVersionId L'ID de la nouvelle version.
 * @param sourceOngletId L'ID de l'onglet source.
 * @param newOngletId L'ID du nouvel onglet.
 * @param sourceSectionId L'ID de la section source.
 * @param newSectionId L'ID de la nouvelle section.
 * @returns Une promesse qui se résout une fois les tactiques et leur contenu dupliqués.
 */
async function duplicateTactiquesWithHierarchy(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  sourceVersionId: string,
  newVersionId: string,
  sourceOngletId: string,
  newOngletId: string,
  sourceSectionId: string,
  newSectionId: string
): Promise<void> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateTactiquesWithHierarchy - Path: clients/${clientId}/campaigns/${sourceCampaignId}/versions/${sourceVersionId}/onglets/${sourceOngletId}/sections/${sourceSectionId}/tactiques");
    const tactiquesRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 
      'onglets', sourceOngletId, 'sections', sourceSectionId, 'tactiques'
    );
    const tactiquesSnapshot = await getDocs(query(tactiquesRef, orderBy('TC_Order', 'asc')));
    
    if (tactiquesSnapshot.empty) {
      return;
    }
    
    for (const tactiqueDoc of tactiquesSnapshot.docs) {
      const tactiqueData = tactiqueDoc.data();
      const sourceTactiqueId = tactiqueDoc.id;
      
      const newTactiquesRef = collection(
        db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 
        'onglets', newOngletId, 'sections', newSectionId, 'tactiques'
      );
      console.log("FIREBASE: ÉCRITURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateTactiquesWithHierarchy - Path: clients/${clientId}/campaigns/${newCampaignId}/versions/${newVersionId}/onglets/${newOngletId}/sections/${newSectionId}/tactiques");
      const newTactiqueRef = await addDoc(newTactiquesRef, {
        ...tactiqueData,
        TC_SectionId: newSectionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const newTactiqueId = newTactiqueRef.id;
      
      await duplicatePlacementsWithHierarchy(
        clientId, 
        sourceCampaignId, 
        newCampaignId, 
        sourceVersionId, 
        newVersionId,
        sourceOngletId, 
        newOngletId, 
        sourceSectionId, 
        newSectionId,
        sourceTactiqueId, 
        newTactiqueId
      );
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des tactiques:', error);
    throw error;
  }
}

/**
 * Duplique les placements d'une tactique source avec leurs créatifs.
 * @param clientId L'ID du client.
 * @param sourceCampaignId L'ID de la campagne source.
 * @param newCampaignId L'ID de la nouvelle campagne.
 * @param sourceVersionId L'ID de la version source.
 * @param newVersionId L'ID de la nouvelle version.
 * @param sourceOngletId L'ID de l'onglet source.
 * @param newOngletId L'ID du nouvel onglet.
 * @param sourceSectionId L'ID de la section source.
 * @param newSectionId L'ID de la nouvelle section.
 * @param sourceTactiqueId L'ID de la tactique source.
 * @param newTactiqueId L'ID de la nouvelle tactique.
 * @returns Une promesse qui se résout une fois les placements et leurs créatifs dupliqués.
 */
async function duplicatePlacementsWithHierarchy(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  sourceVersionId: string,
  newVersionId: string,
  sourceOngletId: string,
  newOngletId: string,
  sourceSectionId: string,
  newSectionId: string,
  sourceTactiqueId: string,
  newTactiqueId: string
): Promise<void> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicatePlacementsWithHierarchy - Path: clients/${clientId}/campaigns/${sourceCampaignId}/versions/${sourceVersionId}/onglets/${sourceOngletId}/sections/${sourceSectionId}/tactiques/${sourceTactiqueId}/placements");
    const placementsRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 
      'onglets', sourceOngletId, 'sections', sourceSectionId, 'tactiques', sourceTactiqueId, 'placements'
    );
    const placementsSnapshot = await getDocs(query(placementsRef, orderBy('PL_Order', 'asc')));
    
    if (placementsSnapshot.empty) {
      return;
    }
    
    for (const placementDoc of placementsSnapshot.docs) {
      const placementData = placementDoc.data();
      const sourcePlacementId = placementDoc.id;
      
      const newPlacementsRef = collection(
        db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 
        'onglets', newOngletId, 'sections', newSectionId, 'tactiques', newTactiqueId, 'placements'
      );
      console.log("FIREBASE: ÉCRITURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicatePlacementsWithHierarchy - Path: clients/${clientId}/campaigns/${newCampaignId}/versions/${newVersionId}/onglets/${newOngletId}/sections/${newSectionId}/tactiques/${newTactiqueId}/placements");
      const newPlacementRef = await addDoc(newPlacementsRef, {
        ...placementData,
        PL_TactiqueId: newTactiqueId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const newPlacementId = newPlacementRef.id;
      
      await duplicateCreatifs(
        clientId, 
        sourceCampaignId, 
        newCampaignId, 
        sourceVersionId, 
        newVersionId,
        sourceOngletId, 
        newOngletId, 
        sourceSectionId, 
        newSectionId,
        sourceTactiqueId, 
        newTactiqueId,
        sourcePlacementId, 
        newPlacementId
      );
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des placements:', error);
    console.warn('⚠️ Poursuite sans les placements');
  }
}

/**
 * Duplique les créatifs d'un placement source.
 * @param clientId L'ID du client.
 * @param sourceCampaignId L'ID de la campagne source.
 * @param newCampaignId L'ID de la nouvelle campagne.
 * @param sourceVersionId L'ID de la version source.
 * @param newVersionId L'ID de la nouvelle version.
 * @param sourceOngletId L'ID de l'onglet source.
 * @param newOngletId L'ID du nouvel onglet.
 * @param sourceSectionId L'ID de la section source.
 * @param newSectionId L'ID de la nouvelle section.
 * @param sourceTactiqueId L'ID de la tactique source.
 * @param newTactiqueId L'ID de la nouvelle tactique.
 * @param sourcePlacementId L'ID du placement source.
 * @param newPlacementId L'ID du nouveau placement.
 * @returns Une promesse qui se résout une fois les créatifs dupliqués.
 */
async function duplicateCreatifs(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  sourceVersionId: string,
  newVersionId: string,
  sourceOngletId: string,
  newOngletId: string,
  sourceSectionId: string,
  newSectionId: string,
  sourceTactiqueId: string,
  newTactiqueId: string,
  sourcePlacementId: string,
  newPlacementId: string
): Promise<void> {
  try {
    console.log("FIREBASE: LECTURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateCreatifs - Path: clients/${clientId}/campaigns/${sourceCampaignId}/versions/${sourceVersionId}/onglets/${sourceOngletId}/sections/${sourceSectionId}/tactiques/${sourceTactiqueId}/placements/${sourcePlacementId}/creatifs");
    const creatifsRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 
      'onglets', sourceOngletId, 'sections', sourceSectionId, 'tactiques', sourceTactiqueId, 
      'placements', sourcePlacementId, 'creatifs'
    );
    const creatifsSnapshot = await getDocs(query(creatifsRef, orderBy('CR_Order', 'asc')));
    
    if (creatifsSnapshot.empty) {
      return;
    }
    
    const newCreatifsRef = collection(
      db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 
      'onglets', newOngletId, 'sections', newSectionId, 'tactiques', newTactiqueId, 
      'placements', newPlacementId, 'creatifs'
    );
    
    for (const creatifDoc of creatifsSnapshot.docs) {
      const creatifData = creatifDoc.data();
      
      console.log("FIREBASE: ÉCRITURE - Fichier: campaignDuplicationUtils.ts - Fonction: duplicateCreatifs - Path: clients/${clientId}/campaigns/${newCampaignId}/versions/${newVersionId}/onglets/${newOngletId}/sections/${newSectionId}/tactiques/${newTactiqueId}/placements/${newPlacementId}/creatifs");
      await addDoc(newCreatifsRef, {
        ...creatifData,
        CR_PlacementId: newPlacementId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des créatifs:', error);
    console.warn('⚠️ Poursuite sans les créatifs');
  }
}