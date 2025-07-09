// app/lib/reorderService.ts - Service de réorganisation drag and drop hiérarchique

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { Section, Tactique, Placement, Creatif } from '../types/tactiques';

// ==================== TYPES DE DRAG AND DROP ====================

export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
}

export interface ReorderContext {
  clientId: string;
  campaignId: string;
  versionId: string;
  ongletId: string;
}

// ==================== FONCTIONS DE RÉORGANISATION SIMPLE ====================

/**
 * Réorganise les sections dans un onglet
 */
export async function reorderSections(
  context: ReorderContext,
  sectionOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    sectionOrders.forEach(({ id, order }) => {
      const sectionRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', id
      );
      
      batch.update(sectionRef, { 
        SECTION_Order: order,
        updatedAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    console.log('✅ Sections réorganisées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la réorganisation des sections:', error);
    throw error;
  }
}

/**
 * Réorganise les tactiques dans une section
 */
export async function reorderTactiques(
  context: ReorderContext,
  sectionId: string,
  tactiqueOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    tactiqueOrders.forEach(({ id, order }) => {
      const tactiqueRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', sectionId,
        'tactiques', id
      );
      
      batch.update(tactiqueRef, { 
        TC_Order: order,
        updatedAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    console.log('✅ Tactiques réorganisées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la réorganisation des tactiques:', error);
    throw error;
  }
}

/**
 * Réorganise les placements dans une tactique
 */
export async function reorderPlacements(
  context: ReorderContext,
  sectionId: string,
  tactiqueId: string,
  placementOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    placementOrders.forEach(({ id, order }) => {
      const placementRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', sectionId,
        'tactiques', tactiqueId,
        'placements', id
      );
      
      batch.update(placementRef, { 
        PL_Order: order,
        updatedAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    console.log('✅ Placements réorganisés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la réorganisation des placements:', error);
    throw error;
  }
}

/**
 * Réorganise les créatifs dans un placement
 */
export async function reorderCreatifs(
  context: ReorderContext,
  sectionId: string,
  tactiqueId: string,
  placementId: string,
  creatifOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    creatifOrders.forEach(({ id, order }) => {
      const creatifRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', sectionId,
        'tactiques', tactiqueId,
        'placements', placementId,
        'creatifs', id
      );
      
      batch.update(creatifRef, { 
        CR_Order: order,
        updatedAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    console.log('✅ Créatifs réorganisés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la réorganisation des créatifs:', error);
    throw error;
  }
}

// ==================== FONCTIONS DE DÉPLACEMENT ENTRE CONTENEURS ====================

/**
 * Déplace une tactique vers une autre section (avec tous ses placements et créatifs)
 */
export async function moveTactiqueToSection(
  context: ReorderContext,
  tactiqueId: string,
  fromSectionId: string,
  toSectionId: string,
  newOrder: number
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // 1. Récupérer la tactique source
    const tactiqueRef = doc(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', fromSectionId,
      'tactiques', tactiqueId
    );
    
    const tactiqueSnap = await getDoc(tactiqueRef);
    if (!tactiqueSnap.exists()) {
      throw new Error('Tactique introuvable');
    }
    
    const tactiqueData = tactiqueSnap.data() as Tactique;
    
    // 2. Récupérer tous les placements de cette tactique
    const placementsRef = collection(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', fromSectionId,
      'tactiques', tactiqueId,
      'placements'
    );
    const placementsSnap = await getDocs(placementsRef);
    
    // 3. Pour chaque placement, récupérer ses créatifs
    const placementsWithCreatifs: Array<{placement: any, creatifs: any[]}> = [];
    
    for (const placementDoc of placementsSnap.docs) {
      const placementData = placementDoc.data();
      
      const creatifsRef = collection(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', fromSectionId,
        'tactiques', tactiqueId,
        'placements', placementDoc.id,
        'creatifs'
      );
      const creatifsSnap = await getDocs(creatifsRef);
      
      const creatifs = creatifsSnap.docs.map(creatifDoc => ({
        id: creatifDoc.id,
        ...creatifDoc.data()
      }));
      
      placementsWithCreatifs.push({
        placement: { id: placementDoc.id, ...placementData },
        creatifs
      });
    }
    
    // 4. Créer la tactique dans la nouvelle section
    const newTactiqueRef = doc(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', toSectionId,
      'tactiques', tactiqueId
    );
    
    batch.set(newTactiqueRef, {
      ...tactiqueData,
      TC_SectionId: toSectionId,
      TC_Order: newOrder,
      updatedAt: new Date().toISOString()
    });
    
    // 5. Recréer tous les placements et créatifs dans la nouvelle structure
    for (const { placement, creatifs } of placementsWithCreatifs) {
      const newPlacementRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', toSectionId,
        'tactiques', tactiqueId,
        'placements', placement.id
      );
      
      batch.set(newPlacementRef, {
        ...placement,
        PL_TactiqueId: tactiqueId,
        updatedAt: new Date().toISOString()
      });
      
      // Recréer tous les créatifs
      for (const creatif of creatifs) {
        const newCreatifRef = doc(
          db,
          'clients', context.clientId,
          'campaigns', context.campaignId,
          'versions', context.versionId,
          'onglets', context.ongletId,
          'sections', toSectionId,
          'tactiques', tactiqueId,
          'placements', placement.id,
          'creatifs', creatif.id
        );
        
        batch.set(newCreatifRef, {
          ...creatif,
          CR_PlacementId: placement.id,
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    // 6. Supprimer l'ancienne structure
    // Supprimer tous les créatifs
    for (const { placement, creatifs } of placementsWithCreatifs) {
      for (const creatif of creatifs) {
        const oldCreatifRef = doc(
          db,
          'clients', context.clientId,
          'campaigns', context.campaignId,
          'versions', context.versionId,
          'onglets', context.ongletId,
          'sections', fromSectionId,
          'tactiques', tactiqueId,
          'placements', placement.id,
          'creatifs', creatif.id
        );
        batch.delete(oldCreatifRef);
      }
      
      // Supprimer le placement
      const oldPlacementRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', fromSectionId,
        'tactiques', tactiqueId,
        'placements', placement.id
      );
      batch.delete(oldPlacementRef);
    }
    
    // Supprimer l'ancienne tactique
    batch.delete(tactiqueRef);
    
    await batch.commit();
    console.log('✅ Tactique déplacée avec succès vers la nouvelle section');
  } catch (error) {
    console.error('❌ Erreur lors du déplacement de la tactique:', error);
    throw error;
  }
}

/**
 * Déplace un placement vers une autre tactique (avec tous ses créatifs)
 */
export async function movePlacementToTactique(
  context: ReorderContext,
  placementId: string,
  fromSectionId: string,
  fromTactiqueId: string,
  toSectionId: string,
  toTactiqueId: string,
  newOrder: number
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // 1. Récupérer le placement source
    const placementRef = doc(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', fromSectionId,
      'tactiques', fromTactiqueId,
      'placements', placementId
    );
    
    const placementSnap = await getDoc(placementRef);
    if (!placementSnap.exists()) {
      throw new Error('Placement introuvable');
    }
    
    const placementData = placementSnap.data() as Placement;
    
    // 2. Récupérer tous les créatifs de ce placement
    const creatifsRef = collection(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', fromSectionId,
      'tactiques', fromTactiqueId,
      'placements', placementId,
      'creatifs'
    );
    const creatifsSnap = await getDocs(creatifsRef);
    
    const creatifs = creatifsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 3. Créer le placement dans la nouvelle tactique
    const newPlacementRef = doc(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', toSectionId,
      'tactiques', toTactiqueId,
      'placements', placementId
    );
    
    batch.set(newPlacementRef, {
      ...placementData,
      PL_TactiqueId: toTactiqueId,
      PL_Order: newOrder,
      updatedAt: new Date().toISOString()
    });
    
    // 4. Recréer tous les créatifs
    for (const creatif of creatifs) {
      const newCreatifRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', toSectionId,
        'tactiques', toTactiqueId,
        'placements', placementId,
        'creatifs', creatif.id
      );
      
      batch.set(newCreatifRef, {
        ...creatif,
        CR_PlacementId: placementId,
        updatedAt: new Date().toISOString()
      });
    }
    
    // 5. Supprimer l'ancienne structure
    for (const creatif of creatifs) {
      const oldCreatifRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', fromSectionId,
        'tactiques', fromTactiqueId,
        'placements', placementId,
        'creatifs', creatif.id
      );
      batch.delete(oldCreatifRef);
    }
    
    batch.delete(placementRef);
    
    await batch.commit();
    console.log('✅ Placement déplacé avec succès vers la nouvelle tactique');
  } catch (error) {
    console.error('❌ Erreur lors du déplacement du placement:', error);
    throw error;
  }
}

/**
 * Déplace un créatif vers un autre placement
 */
export async function moveCreatifToPlacement(
  context: ReorderContext,
  creatifId: string,
  fromSectionId: string,
  fromTactiqueId: string,
  fromPlacementId: string,
  toSectionId: string,
  toTactiqueId: string,
  toPlacementId: string,
  newOrder: number
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // 1. Récupérer le créatif source
    const creatifRef = doc(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', fromSectionId,
      'tactiques', fromTactiqueId,
      'placements', fromPlacementId,
      'creatifs', creatifId
    );
    
    const creatifSnap = await getDoc(creatifRef);
    if (!creatifSnap.exists()) {
      throw new Error('Créatif introuvable');
    }
    
    const creatifData = creatifSnap.data() as Creatif;
    
    // 2. Créer le créatif dans le nouveau placement
    const newCreatifRef = doc(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', toSectionId,
      'tactiques', toTactiqueId,
      'placements', toPlacementId,
      'creatifs', creatifId
    );
    
    batch.set(newCreatifRef, {
      ...creatifData,
      CR_PlacementId: toPlacementId,
      CR_Order: newOrder,
      updatedAt: new Date().toISOString()
    });
    
    // 3. Supprimer l'ancien créatif
    batch.delete(creatifRef);
    
    await batch.commit();
    console.log('✅ Créatif déplacé avec succès vers le nouveau placement');
  } catch (error) {
    console.error('❌ Erreur lors du déplacement du créatif:', error);
    throw error;
  }
}