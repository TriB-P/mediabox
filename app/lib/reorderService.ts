/**
 * Ce fichier gère toutes les opérations de réorganisation et de déplacement (drag and drop)
 * pour les sections, tactiques, placements et créatifs au sein de la base de données Firebase.
 * Il inclut des fonctions pour réordonner des éléments dans leur conteneur et des fonctions
 * plus complexes pour déplacer des éléments (et leurs sous-éléments) entre différents conteneurs,
 * assurant la cohérence des données hiérarchiques dans Firebase.
 * 
 * MISE À JOUR : Utilise maintenant orderManagementService pour une gestion centralisée des ordres.
 */
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
import {
  reorderSequence,
  moveToEnd,
  type OrderContext,
  type OrderType
} from './orderManagementService';

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

/**
 * Construit le contexte d'ordre pour le service orderManagementService
 */
function buildOrderContext(context: ReorderContext, additionalContext: Partial<OrderContext> = {}): OrderContext {
  return {
    clientId: context.clientId,
    campaignId: context.campaignId,
    versionId: context.versionId,
    ongletId: context.ongletId,
    ...additionalContext
  };
}

/**
 * Réorganise l'ordre des sections au sein d'un onglet spécifié.
 * MISE À JOUR : Utilise reorderSequence() du service central au lieu des batches manuels
 * @param context - Le contexte de réorganisation incluant clientId, campaignId, versionId et ongletId.
 * @param sectionOrders - Un tableau d'objets contenant l'ID de la section et son nouvel ordre.
 * @returns Une promesse qui se résout une fois les sections réorganisées.
 */
export async function reorderSections(
  context: ReorderContext,
  sectionOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    // ✅ NOUVEAU : Utilise le service central pour la réorganisation
    const orderContext = buildOrderContext(context);
    
    // Trier par ordre et extraire les IDs dans le bon ordre
    const sortedOrders = [...sectionOrders].sort((a, b) => a.order - b.order);
    const newOrderIds = sortedOrders.map(item => item.id);
    
    await reorderSequence(newOrderIds, 'section', orderContext);
    
  } catch (error) {
    console.error('❌ Erreur lors de la réorganisation des sections:', error);
    throw error;
  }
}

/**
 * Réorganise l'ordre des tactiques au sein d'une section spécifiée.
 * MISE À JOUR : Utilise reorderSequence() du service central au lieu des batches manuels
 * @param context - Le contexte de réorganisation incluant clientId, campaignId, versionId et ongletId.
 * @param sectionId - L'ID de la section parente des tactiques.
 * @param tactiqueOrders - Un tableau d'objets contenant l'ID de la tactique et son nouvel ordre.
 * @returns Une promesse qui se résout une fois les tactiques réorganisées.
 */
export async function reorderTactiques(
  context: ReorderContext,
  sectionId: string,
  tactiqueOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    // ✅ NOUVEAU : Utilise le service central pour la réorganisation
    const orderContext = buildOrderContext(context, { sectionId });
    
    // Trier par ordre et extraire les IDs dans le bon ordre
    const sortedOrders = [...tactiqueOrders].sort((a, b) => a.order - b.order);
    const newOrderIds = sortedOrders.map(item => item.id);
    
    await reorderSequence(newOrderIds, 'tactique', orderContext);
    
  } catch (error) {
    console.error('❌ Erreur lors de la réorganisation des tactiques:', error);
    throw error;
  }
}

/**
 * Réorganise l'ordre des placements au sein d'une tactique spécifiée.
 * MISE À JOUR : Utilise reorderSequence() du service central au lieu des batches manuels
 * @param context - Le contexte de réorganisation incluant clientId, campaignId, versionId et ongletId.
 * @param sectionId - L'ID de la section parente de la tactique.
 * @param tactiqueId - L'ID de la tactique parente des placements.
 * @param placementOrders - Un tableau d'objets contenant l'ID du placement et son nouvel ordre.
 * @returns Une promesse qui se résout une fois les placements réorganisés.
 */
export async function reorderPlacements(
  context: ReorderContext,
  sectionId: string,
  tactiqueId: string,
  placementOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    // ✅ NOUVEAU : Utilise le service central pour la réorganisation
    const orderContext = buildOrderContext(context, { sectionId, tactiqueId });
    
    // Trier par ordre et extraire les IDs dans le bon ordre
    const sortedOrders = [...placementOrders].sort((a, b) => a.order - b.order);
    const newOrderIds = sortedOrders.map(item => item.id);
    
    await reorderSequence(newOrderIds, 'placement', orderContext);
    
  } catch (error) {
    console.error('❌ Erreur lors de la réorganisation des placements:', error);
    throw error;
  }
}

/**
 * Réorganise l'ordre des créatifs au sein d'un placement spécifié.
 * MISE À JOUR : Utilise reorderSequence() du service central au lieu des batches manuels
 * @param context - Le contexte de réorganisation incluant clientId, campaignId, versionId et ongletId.
 * @param sectionId - L'ID de la section parente de la tactique.
 * @param tactiqueId - L'ID de la tactique parente du placement.
 * @param placementId - L'ID du placement parent des créatifs.
 * @param creatifOrders - Un tableau d'objets contenant l'ID du créatif et son nouvel ordre.
 * @returns Une promesse qui se résout une fois les créatifs réorganisés.
 */
export async function reorderCreatifs(
  context: ReorderContext,
  sectionId: string,
  tactiqueId: string,
  placementId: string,
  creatifOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    // ✅ NOUVEAU : Utilise le service central pour la réorganisation
    const orderContext = buildOrderContext(context, { sectionId, tactiqueId, placementId });
    
    // Trier par ordre et extraire les IDs dans le bon ordre
    const sortedOrders = [...creatifOrders].sort((a, b) => a.order - b.order);
    const newOrderIds = sortedOrders.map(item => item.id);
    
    await reorderSequence(newOrderIds, 'creatif', orderContext);
    
  } catch (error) {
    console.error('❌ Erreur lors de la réorganisation des créatifs:', error);
    throw error;
  }
}

/**
 * Déplace une tactique entière, y compris tous ses placements et créatifs, vers une nouvelle section.
 * MISE À JOUR : Place la tactique déplacée à la fin de sa nouvelle section avec moveToEnd()
 * Cette opération est complexe car elle implique la recréation de la structure dans la nouvelle hiérarchie
 * et la suppression de l'ancienne.
 * @param context - Le contexte de réorganisation incluant clientId, campaignId, versionId et ongletId.
 * @param tactiqueId - L'ID de la tactique à déplacer.
 * @param fromSectionId - L'ID de la section d'origine de la tactique.
 * @param toSectionId - L'ID de la section de destination.
 * @param newOrder - Le nouvel ordre de la tactique dans la section de destination (DEPRECIÉ - utilise moveToEnd).
 * @returns Une promesse qui se résout une fois la tactique déplacée.
 */
export async function moveTactiqueToSection(
  context: ReorderContext,
  tactiqueId: string,
  fromSectionId: string,
  toSectionId: string,
  newOrder: number // ✅ PARAMÈTRE IGNORÉ - on place toujours à la fin
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

    console.log("FIREBASE: LECTURE - Fichier: reorderService.ts - Fonction: moveTactiqueToSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${tactiqueId}");
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
    console.log("FIREBASE: LECTURE - Fichier: reorderService.ts - Fonction: moveTactiqueToSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${tactiqueId}/placements");
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
      console.log("FIREBASE: LECTURE - Fichier: reorderService.ts - Fonction: moveTactiqueToSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${tactiqueId}/placements/${placementDoc.id}/creatifs");
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

    // ✅ NOUVEAU : Utilise moveToEnd() pour déterminer l'ordre au lieu de newOrder
    const orderContext = buildOrderContext(context, { sectionId: toSectionId });
    await moveToEnd([tactiqueId], 'tactique', orderContext);
    
    // Récupérer l'ordre mis à jour après moveToEnd()
    const { getCurrentItems } = await import('./orderManagementService');
    const tactiquesInDestination = await getCurrentItems('tactique', orderContext);
    const movedTactique = tactiquesInDestination.find(t => t.id === tactiqueId);
    const finalOrder = movedTactique?.order || 0;

    // 4. Créer la tactique dans la nouvelle section avec l'ordre calculé
    const newTactiqueRef = doc(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', toSectionId,
      'tactiques', tactiqueId
    );

    console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: moveTactiqueToSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${toSectionId}/tactiques/${tactiqueId}");
    batch.set(newTactiqueRef, {
      ...tactiqueData,
      TC_SectionId: toSectionId,
      TC_Order: finalOrder, // ✅ CHANGÉ : Utilise l'ordre calculé par moveToEnd()
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

      console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: moveTactiqueToSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${toSectionId}/tactiques/${tactiqueId}/placements/${placement.id}");
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

        console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: moveTactiqueToSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${toSectionId}/tactiques/${tactiqueId}/placements/${placement.id}/creatifs/${creatif.id}");
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
        console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: moveTactiqueToSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${tactiqueId}/placements/${placement.id}/creatifs/${creatif.id}");
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
      console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: moveTactiqueToSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${tactiqueId}/placements/${placement.id}");
      batch.delete(oldPlacementRef);
    }

    // Supprimer l'ancienne tactique
    console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: moveTactiqueToSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${tactiqueId}");
    batch.delete(tactiqueRef);

    await batch.commit();
  } catch (error) {
    console.error('❌ Erreur lors du déplacement de la tactique:', error);
    throw error;
  }
}

/**
 * Déplace un placement entier, y compris tous ses créatifs, vers une nouvelle tactique.
 * MISE À JOUR : Place le placement déplacé à la fin de sa nouvelle tactique avec moveToEnd()
 * @param context - Le contexte de réorganisation incluant clientId, campaignId, versionId et ongletId.
 * @param placementId - L'ID du placement à déplacer.
 * @param fromSectionId - L'ID de la section d'origine de la tactique parente.
 * @param fromTactiqueId - L'ID de la tactique d'origine du placement.
 * @param toSectionId - L'ID de la section de destination de la nouvelle tactique parente.
 * @param toTactiqueId - L'ID de la tactique de destination.
 * @param newOrder - Le nouvel ordre du placement dans la tactique de destination (DEPRECIÉ - utilise moveToEnd).
 * @returns Une promesse qui se résout une fois le placement déplacé.
 */
export async function movePlacementToTactique(
  context: ReorderContext,
  placementId: string,
  fromSectionId: string,
  fromTactiqueId: string,
  toSectionId: string,
  toTactiqueId: string,
  newOrder: number // ✅ PARAMÈTRE IGNORÉ - on place toujours à la fin
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

    console.log("FIREBASE: LECTURE - Fichier: reorderService.ts - Fonction: movePlacementToTactique - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${fromTactiqueId}/placements/${placementId}");
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
    console.log("FIREBASE: LECTURE - Fichier: reorderService.ts - Fonction: movePlacementToTactique - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${fromTactiqueId}/placements/${placementId}/creatifs");
    const creatifsSnap = await getDocs(creatifsRef);

    const creatifs = creatifsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // ✅ NOUVEAU : Utilise moveToEnd() pour déterminer l'ordre au lieu de newOrder
    const orderContext = buildOrderContext(context, { sectionId: toSectionId, tactiqueId: toTactiqueId });
    await moveToEnd([placementId], 'placement', orderContext);
    
    // Récupérer l'ordre mis à jour après moveToEnd()
    const { getCurrentItems } = await import('./orderManagementService');
    const placementsInDestination = await getCurrentItems('placement', orderContext);
    const movedPlacement = placementsInDestination.find(p => p.id === placementId);
    const finalOrder = movedPlacement?.order || 0;

    // 3. Créer le placement dans la nouvelle tactique avec l'ordre calculé
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

    console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: movePlacementToTactique - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${toSectionId}/tactiques/${toTactiqueId}/placements/${placementId}");
    batch.set(newPlacementRef, {
      ...placementData,
      PL_TactiqueId: toTactiqueId,
      PL_Order: finalOrder, // ✅ CHANGÉ : Utilise l'ordre calculé par moveToEnd()
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

      console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: movePlacementToTactique - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${toSectionId}/tactiques/${toTactiqueId}/placements/${placementId}/creatifs/${creatif.id}");
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
      console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: movePlacementToTactique - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${fromTactiqueId}/placements/${placementId}/creatifs/${creatif.id}");
      batch.delete(oldCreatifRef);
    }

    console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: movePlacementToTactique - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${fromTactiqueId}/placements/${placementId}");
    batch.delete(placementRef);

    await batch.commit();
  } catch (error) {
    console.error('❌ Erreur lors du déplacement du placement:', error);
    throw error;
  }
}

/**
 * Déplace un créatif vers un nouveau placement.
 * MISE À JOUR : Place le créatif déplacé à la fin de son nouveau placement avec moveToEnd()
 * @param context - Le contexte de réorganisation incluant clientId, campaignId, versionId et ongletId.
 * @param creatifId - L'ID du créatif à déplacer.
 * @param fromSectionId - L'ID de la section d'origine du placement parent.
 * @param fromTactiqueId - L'ID de la tactique d'origine du placement parent.
 * @param fromPlacementId - L'ID du placement d'origine du créatif.
 * @param toSectionId - L'ID de la section de destination du nouveau placement parent.
 * @param toTactiqueId - L'ID de la tactique de destination du nouveau placement parent.
 * @param toPlacementId - L'ID du placement de destination.
 * @param newOrder - Le nouvel ordre du créatif dans le placement de destination (DEPRECIÉ - utilise moveToEnd).
 * @returns Une promesse qui se résout une fois le créatif déplacé.
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
  newOrder: number // ✅ PARAMÈTRE IGNORÉ - on place toujours à la fin
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

    console.log("FIREBASE: LECTURE - Fichier: reorderService.ts - Fonction: moveCreatifToPlacement - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${fromTactiqueId}/placements/${fromPlacementId}/creatifs/${creatifId}");
    const creatifSnap = await getDoc(creatifRef);
    if (!creatifSnap.exists()) {
      throw new Error('Créatif introuvable');
    }

    const creatifData = creatifSnap.data() as Creatif;

    // ✅ NOUVEAU : Utilise moveToEnd() pour déterminer l'ordre au lieu de newOrder
    const orderContext = buildOrderContext(context, { sectionId: toSectionId, tactiqueId: toTactiqueId, placementId: toPlacementId });
    await moveToEnd([creatifId], 'creatif', orderContext);
    
    // Récupérer l'ordre mis à jour après moveToEnd()
    const { getCurrentItems } = await import('./orderManagementService');
    const creatifsInDestination = await getCurrentItems('creatif', orderContext);
    const movedCreatif = creatifsInDestination.find(c => c.id === creatifId);
    const finalOrder = movedCreatif?.order || 0;

    // 2. Créer le créatif dans le nouveau placement avec l'ordre calculé
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

    console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: moveCreatifToPlacement - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${toSectionId}/tactiques/${toTactiqueId}/placements/${toPlacementId}/creatifs/${creatifId}");
    batch.set(newCreatifRef, {
      ...creatifData,
      CR_PlacementId: toPlacementId,
      CR_Order: finalOrder, // ✅ CHANGÉ : Utilise l'ordre calculé par moveToEnd()
      updatedAt: new Date().toISOString()
    });

    // 3. Supprimer l'ancien créatif
    console.log("FIREBASE: ÉCRITURE - Fichier: reorderService.ts - Fonction: moveCreatifToPlacement - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${fromSectionId}/tactiques/${fromTactiqueId}/placements/${fromPlacementId}/creatifs/${creatifId}");
    batch.delete(creatifRef);

    await batch.commit();
  } catch (error) {
    console.error('❌ Erreur lors du déplacement du créatif:', error);
    throw error;
  }
}