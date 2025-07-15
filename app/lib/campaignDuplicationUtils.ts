// app/lib/campaignDuplicationUtils.ts - CORRECTION COMPLÈTE

import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

// ==================== INTERFACES ====================

interface DuplicationMapping {
  versions: Map<string, string>;
  onglets: Map<string, string>;
  sections: Map<string, string>;
  tactiques: Map<string, string>;
  placements: Map<string, string>;
}

// ==================== FONCTION PRINCIPALE ====================

/**
 * Duplique tout le contenu d'une campagne : breakdowns, versions, onglets, sections, 
 * tactiques, placements, créatifs et buckets de stratégie
 */
export async function duplicateCompleteCampaign(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string
): Promise<void> {
  console.log('🚀 Début duplication complète de campagne');
  
  try {
    // 1. Dupliquer les breakdowns (structure simple)
    await duplicateBreakdowns(clientId, sourceCampaignId, newCampaignId);
    
    // 2. Dupliquer toute la hiérarchie des versions avec leur contenu
    await duplicateVersionsWithFullHierarchy(clientId, sourceCampaignId, newCampaignId);
    
    console.log('✅ Duplication complète terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la duplication complète:', error);
    throw error;
  }
}

// ==================== DUPLICATION DES BREAKDOWNS ====================

export async function duplicateBreakdowns(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string
): Promise<void> {
  try {
    console.log('📋 Duplication des breakdowns...');
    
    const breakdownsRef = collection(db, 'clients', clientId, 'campaigns', sourceCampaignId, 'breakdowns');
    const q = query(breakdownsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('Aucun breakdown à dupliquer');
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
      
      await addDoc(newBreakdownsRef, newBreakdownData);
    }
    
    console.log(`✅ ${snapshot.size} breakdowns dupliqués`);
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des breakdowns:', error);
    throw error;
  }
}

// ==================== DUPLICATION HIÉRARCHIQUE COMPLÈTE ====================

/**
 * Duplique toutes les versions avec leur hiérarchie complète :
 * versions → onglets → sections → tactiques → placements → créatifs + buckets
 */
async function duplicateVersionsWithFullHierarchy(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string
): Promise<void> {
  try {
    console.log('🔄 Duplication des versions avec hiérarchie complète...');
    
    // Récupérer toutes les versions sources
    const versionsRef = collection(db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions');
    const versionsSnapshot = await getDocs(query(versionsRef, orderBy('createdAt', 'asc')));
    
    if (versionsSnapshot.empty) {
      console.log('Aucune version à dupliquer');
      return;
    }
    
    // Dupliquer chaque version avec tout son contenu
    for (const versionDoc of versionsSnapshot.docs) {
      const versionData = versionDoc.data();
      const sourceVersionId = versionDoc.id;
      
      // Créer la nouvelle version
      const newVersionsRef = collection(db, 'clients', clientId, 'campaigns', newCampaignId, 'versions');
      const newVersionRef = await addDoc(newVersionsRef, {
        ...versionData,
        createdAt: new Date().toISOString(),
      });
      const newVersionId = newVersionRef.id;
      
      console.log(`📦 Version "${versionData.name}" dupliquée: ${sourceVersionId} → ${newVersionId}`);
      
      // Dupliquer tout le contenu de cette version
      await duplicateVersionContent(
        clientId, 
        sourceCampaignId, 
        newCampaignId, 
        sourceVersionId, 
        newVersionId
      );
    }
    
    console.log('✅ Toutes les versions et leur contenu dupliqués');
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des versions:', error);
    throw error;
  }
}

/**
 * Duplique tout le contenu d'une version : onglets, sections, tactiques, placements, créatifs + buckets
 */
async function duplicateVersionContent(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  sourceVersionId: string,
  newVersionId: string
): Promise<void> {
  try {
    console.log(`🎯 Duplication du contenu de la version ${sourceVersionId} → ${newVersionId}`);
    
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
    
    console.log(`✅ Contenu de la version ${sourceVersionId} dupliqué`);
  } catch (error) {
    console.error(`❌ Erreur lors de la duplication du contenu de la version ${sourceVersionId}:`, error);
    throw error;
  }
}

// ==================== DUPLICATION DES BUCKETS ====================

async function duplicateBuckets(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  sourceVersionId: string,
  newVersionId: string
): Promise<void> {
  try {
    console.log(`💰 Duplication des buckets de la version ${sourceVersionId}...`);
    
    const bucketsRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 'buckets'
    );
    const snapshot = await getDocs(bucketsRef);
    
    if (snapshot.empty) {
      console.log('Aucun bucket à dupliquer');
      return;
    }
    
    const newBucketsRef = collection(
      db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 'buckets'
    );
    
    for (const bucketDoc of snapshot.docs) {
      const bucketData = bucketDoc.data();
      await addDoc(newBucketsRef, {
        ...bucketData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    console.log(`✅ ${snapshot.size} buckets dupliqués`);
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des buckets:', error);
    // Ne pas faire échouer la duplication si les buckets n'existent pas
    console.log('⚠️ Poursuite sans les buckets');
  }
}

// ==================== DUPLICATION DES ONGLETS AVEC HIÉRARCHIE ====================

async function duplicateOngletsWithHierarchy(
  clientId: string,
  sourceCampaignId: string,
  newCampaignId: string,
  sourceVersionId: string,
  newVersionId: string
): Promise<void> {
  try {
    console.log(`📂 Duplication des onglets de la version ${sourceVersionId}...`);
    
    const ongletsRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 'onglets'
    );
    const ongletsSnapshot = await getDocs(query(ongletsRef, orderBy('ONGLET_Order', 'asc')));
    
    if (ongletsSnapshot.empty) {
      console.log('Aucun onglet à dupliquer');
      return;
    }
    
    // Dupliquer chaque onglet avec son contenu
    for (const ongletDoc of ongletsSnapshot.docs) {
      const ongletData = ongletDoc.data();
      const sourceOngletId = ongletDoc.id;
      
      // Créer le nouvel onglet
      const newOngletsRef = collection(
        db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 'onglets'
      );
      const newOngletRef = await addDoc(newOngletsRef, {
        ...ongletData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const newOngletId = newOngletRef.id;
      
      console.log(`📋 Onglet "${ongletData.ONGLET_Name}" dupliqué: ${sourceOngletId} → ${newOngletId}`);
      
      // Dupliquer toutes les sections de cet onglet
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
    
    console.log(`✅ ${ongletsSnapshot.size} onglets dupliqués avec leur contenu`);
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des onglets:', error);
    throw error;
  }
}

// ==================== DUPLICATION DES SECTIONS AVEC HIÉRARCHIE ====================

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
    console.log(`📑 Duplication des sections de l'onglet ${sourceOngletId}...`);
    
    const sectionsRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 
      'onglets', sourceOngletId, 'sections'
    );
    const sectionsSnapshot = await getDocs(query(sectionsRef, orderBy('SECTION_Order', 'asc')));
    
    if (sectionsSnapshot.empty) {
      console.log('Aucune section à dupliquer');
      return;
    }
    
    // Dupliquer chaque section avec ses tactiques
    for (const sectionDoc of sectionsSnapshot.docs) {
      const sectionData = sectionDoc.data();
      const sourceSectionId = sectionDoc.id;
      
      // Créer la nouvelle section
      const newSectionsRef = collection(
        db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 
        'onglets', newOngletId, 'sections'
      );
      const newSectionRef = await addDoc(newSectionsRef, {
        ...sectionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const newSectionId = newSectionRef.id;
      
      console.log(`📄 Section "${sectionData.SECTION_Name}" dupliquée: ${sourceSectionId} → ${newSectionId}`);
      
      // Dupliquer toutes les tactiques de cette section
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
    
    console.log(`✅ ${sectionsSnapshot.size} sections dupliquées avec leur contenu`);
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des sections:', error);
    throw error;
  }
}

// ==================== DUPLICATION DES TACTIQUES AVEC HIÉRARCHIE ====================

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
    console.log(`🎯 Duplication des tactiques de la section ${sourceSectionId}...`);
    
    const tactiquesRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 
      'onglets', sourceOngletId, 'sections', sourceSectionId, 'tactiques'
    );
    const tactiquesSnapshot = await getDocs(query(tactiquesRef, orderBy('TC_Order', 'asc')));
    
    if (tactiquesSnapshot.empty) {
      console.log('Aucune tactique à dupliquer');
      return;
    }
    
    // Dupliquer chaque tactique avec ses placements
    for (const tactiqueDoc of tactiquesSnapshot.docs) {
      const tactiqueData = tactiqueDoc.data();
      const sourceTactiqueId = tactiqueDoc.id;
      
      // Créer la nouvelle tactique avec l'ID de section mis à jour
      const newTactiquesRef = collection(
        db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 
        'onglets', newOngletId, 'sections', newSectionId, 'tactiques'
      );
      const newTactiqueRef = await addDoc(newTactiquesRef, {
        ...tactiqueData,
        TC_SectionId: newSectionId, // Mettre à jour la référence
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const newTactiqueId = newTactiqueRef.id;
      
      console.log(`🏹 Tactique "${tactiqueData.TC_Label}" dupliquée: ${sourceTactiqueId} → ${newTactiqueId}`);
      
      // Dupliquer tous les placements de cette tactique
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
    
    console.log(`✅ ${tactiquesSnapshot.size} tactiques dupliquées avec leur contenu`);
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des tactiques:', error);
    throw error;
  }
}

// ==================== DUPLICATION DES PLACEMENTS AVEC HIÉRARCHIE ====================

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
    console.log(`🏢 Duplication des placements de la tactique ${sourceTactiqueId}...`);
    
    const placementsRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 
      'onglets', sourceOngletId, 'sections', sourceSectionId, 'tactiques', sourceTactiqueId, 'placements'
    );
    const placementsSnapshot = await getDocs(query(placementsRef, orderBy('PL_Order', 'asc')));
    
    if (placementsSnapshot.empty) {
      console.log('Aucun placement à dupliquer');
      return;
    }
    
    // Dupliquer chaque placement avec ses créatifs
    for (const placementDoc of placementsSnapshot.docs) {
      const placementData = placementDoc.data();
      const sourcePlacementId = placementDoc.id;
      
      // Créer le nouveau placement avec l'ID de tactique mis à jour
      const newPlacementsRef = collection(
        db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 
        'onglets', newOngletId, 'sections', newSectionId, 'tactiques', newTactiqueId, 'placements'
      );
      const newPlacementRef = await addDoc(newPlacementsRef, {
        ...placementData,
        PL_TactiqueId: newTactiqueId, // Mettre à jour la référence
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const newPlacementId = newPlacementRef.id;
      
      console.log(`🎪 Placement "${placementData.PL_Label}" dupliqué: ${sourcePlacementId} → ${newPlacementId}`);
      
      // Dupliquer tous les créatifs de ce placement
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
    
    console.log(`✅ ${placementsSnapshot.size} placements dupliqués avec leur contenu`);
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des placements:', error);
    // Ne pas faire échouer si les placements n'existent pas
    console.log('⚠️ Poursuite sans les placements');
  }
}

// ==================== DUPLICATION DES CRÉATIFS ====================

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
    console.log(`🎨 Duplication des créatifs du placement ${sourcePlacementId}...`);
    
    const creatifsRef = collection(
      db, 'clients', clientId, 'campaigns', sourceCampaignId, 'versions', sourceVersionId, 
      'onglets', sourceOngletId, 'sections', sourceSectionId, 'tactiques', sourceTactiqueId, 
      'placements', sourcePlacementId, 'creatifs'
    );
    const creatifsSnapshot = await getDocs(query(creatifsRef, orderBy('CR_Order', 'asc')));
    
    if (creatifsSnapshot.empty) {
      console.log('Aucun créatif à dupliquer');
      return;
    }
    
    const newCreatifsRef = collection(
      db, 'clients', clientId, 'campaigns', newCampaignId, 'versions', newVersionId, 
      'onglets', newOngletId, 'sections', newSectionId, 'tactiques', newTactiqueId, 
      'placements', newPlacementId, 'creatifs'
    );
    
    for (const creatifDoc of creatifsSnapshot.docs) {
      const creatifData = creatifDoc.data();
      
      // Créer le nouveau créatif avec l'ID de placement mis à jour
      await addDoc(newCreatifsRef, {
        ...creatifData,
        CR_PlacementId: newPlacementId, // Mettre à jour la référence
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    console.log(`✅ ${creatifsSnapshot.size} créatifs dupliqués`);
  } catch (error) {
    console.error('❌ Erreur lors de la duplication des créatifs:', error);
    // Ne pas faire échouer si les créatifs n'existent pas
    console.log('⚠️ Poursuite sans les créatifs');
  }
}