// app/lib/orderManagementService.ts

/**
 * Service central pour la gestion des ordres dans Firebase.
 * Centralise toute la logique pour TC_Order, PL_Order, CR_Order, SECTION_Order, ONGLET_Order.
 * Assure la cohérence des ordres lors des créations, déplacements, drag & drop et nettoyages.
 */
import {
    collection,
    doc,
    getDocs,
    query,
    orderBy,
    writeBatch,
    updateDoc
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  // Types supportés pour les ordres
  export type OrderType = 'section' | 'onglet' | 'tactique' | 'placement' | 'creatif';
  
  // Mapping des champs d'ordre selon le type
  const ORDER_FIELDS: Record<OrderType, string> = {
    section: 'SECTION_Order',
    onglet: 'ONGLET_Order', 
    tactique: 'TC_Order',
    placement: 'PL_Order',
    creatif: 'CR_Order'
  };
  
  // Interface pour définir le contexte Firebase
  export interface OrderContext {
    clientId: string;
    campaignId: string;
    versionId: string;
    ongletId?: string;
    sectionId?: string;
    tactiqueId?: string;
    placementId?: string;
  }
  
  // Interface pour les éléments avec ordre
  export interface OrderedItem {
    id: string;
    order: number;
    [key: string]: any;
  }
  
  // Résultat d'opération sur les ordres
  export interface OrderOperationResult {
    success: boolean;
    updatedCount: number;
    errors: string[];
  }
  
  /**
   * Construit le chemin de collection Firebase selon le type d'élément et le contexte
   */
  function buildCollectionPath(type: OrderType, context: OrderContext): string[] {
    const { clientId, campaignId, versionId, ongletId, sectionId, tactiqueId, placementId } = context;
  
    const basePath = ['clients', clientId, 'campaigns', campaignId, 'versions', versionId];
  
    switch (type) {
      case 'onglet':
        return [...basePath, 'onglets'];
        
      case 'section':
        if (!ongletId) throw new Error('ongletId requis pour les sections');
        return [...basePath, 'onglets', ongletId, 'sections'];
        
      case 'tactique':
        if (!ongletId || !sectionId) throw new Error('ongletId et sectionId requis pour les tactiques');
        return [...basePath, 'onglets', ongletId, 'sections', sectionId, 'tactiques'];
        
      case 'placement':
        if (!ongletId || !sectionId || !tactiqueId) {
          throw new Error('ongletId, sectionId et tactiqueId requis pour les placements');
        }
        return [...basePath, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements'];
        
      case 'creatif':
        if (!ongletId || !sectionId || !tactiqueId || !placementId) {
          throw new Error('Tous les IDs parents requis pour les créatifs');
        }
        return [...basePath, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId, 'creatifs'];
        
      default:
        throw new Error(`Type non supporté: ${type}`);
    }
  }
  
  /**
   * Récupère tous les éléments d'une collection avec leur ordre actuel
   */
  export async function getCurrentItems(type: OrderType, context: OrderContext): Promise<OrderedItem[]> {
    try {
      const orderField = ORDER_FIELDS[type];
      let collectionRef;
  
      // Construire la référence de collection directement selon le type
      switch (type) {
        case 'onglet':
          collectionRef = collection(
            db, 'clients', context.clientId, 'campaigns', context.campaignId, 
            'versions', context.versionId, 'onglets'
          );
          break;
          
        case 'section':
          if (!context.ongletId) throw new Error('ongletId requis pour les sections');
          collectionRef = collection(
            db, 'clients', context.clientId, 'campaigns', context.campaignId,
            'versions', context.versionId, 'onglets', context.ongletId, 'sections'
          );
          break;
          
        case 'tactique':
          if (!context.ongletId || !context.sectionId) {
            throw new Error('ongletId et sectionId requis pour les tactiques');
          }
          collectionRef = collection(
            db, 'clients', context.clientId, 'campaigns', context.campaignId,
            'versions', context.versionId, 'onglets', context.ongletId,
            'sections', context.sectionId, 'tactiques'
          );
          break;
          
        case 'placement':
          if (!context.ongletId || !context.sectionId || !context.tactiqueId) {
            throw new Error('ongletId, sectionId et tactiqueId requis pour les placements');
          }
          collectionRef = collection(
            db, 'clients', context.clientId, 'campaigns', context.campaignId,
            'versions', context.versionId, 'onglets', context.ongletId,
            'sections', context.sectionId, 'tactiques', context.tactiqueId, 'placements'
          );
          break;
          
        case 'creatif':
          if (!context.ongletId || !context.sectionId || !context.tactiqueId || !context.placementId) {
            throw new Error('Tous les IDs parents requis pour les créatifs');
          }
          collectionRef = collection(
            db, 'clients', context.clientId, 'campaigns', context.campaignId,
            'versions', context.versionId, 'onglets', context.ongletId,
            'sections', context.sectionId, 'tactiques', context.tactiqueId,
            'placements', context.placementId, 'creatifs'
          );
          break;
          
        default:
          throw new Error(`Type non supporté: ${type}`);
      }
  
      const pathStr = `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}` +
        (context.ongletId ? `/onglets/${context.ongletId}` : '') +
        (context.sectionId ? `/sections/${context.sectionId}` : '') +
        (context.tactiqueId ? `/tactiques/${context.tactiqueId}` : '') +
        (context.placementId ? `/placements/${context.placementId}` : '') +
        `/${type}s`;
  
      console.log(`FIREBASE: LECTURE - Fichier: orderManagementService.ts - Fonction: getCurrentItems - Path: ${pathStr}`);
      const q = query(collectionRef, orderBy(orderField, 'asc'));
      const snapshot = await getDocs(q);
  
      return snapshot.docs.map(doc => ({
        id: doc.id,
        order: doc.data()[orderField] || 0,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`❌ Erreur récupération ${type}:`, error);
      throw error;
    }
  }
  
  /**
   * Trouve le prochain ordre disponible (pour création à la fin)
   * VERSION ROBUSTE : Gère les valeurs undefined/null et ajoute du debug
   */
  export async function getNextOrder(type: OrderType, context: OrderContext): Promise<number> {
    try {
      const items = await getCurrentItems(type, context);
      const orderField = ORDER_FIELDS[type];
      
      console.log(`🔢 getNextOrder(${type}): Trouvé ${items.length} éléments existants`);
      
      if (items.length === 0) {
        console.log(`🔢 getNextOrder(${type}): Aucun élément → retourne 0`);
        return 0;
      }
  
      // ✅ CORRECTION : Filtrer et nettoyer les ordres avant le calcul
      const validOrders = items
        .map(item => {
          const order = item.order;
          // Debug chaque élément
          console.log(`🔢 Élément ${item.id}: ${orderField}=${order} (type: ${typeof order})`);
          return order;
        })
        .filter(order => order !== null && order !== undefined && !isNaN(Number(order)))
        .map(order => Number(order));
  
      console.log(`🔢 getNextOrder(${type}): Ordres valides:`, validOrders);
  
      if (validOrders.length === 0) {
        console.log(`🔢 getNextOrder(${type}): Aucun ordre valide → retourne 0`);
        return 0;
      }
  
      // Trouve l'ordre le plus élevé et ajoute 1
      const maxOrder = Math.max(...validOrders);
      const nextOrder = maxOrder + 1;
      
      console.log(`🔢 getNextOrder(${type}): Max ordre=${maxOrder}, retourne ${nextOrder}`);
      return nextOrder;
      
    } catch (error) {
      console.error(`❌ Erreur calcul nextOrder pour ${type}:`, error);
      console.log(`🔢 getNextOrder(${type}): Erreur → fallback vers 0`);
      return 0;
    }
  }
  
  /**
   * Déplace des éléments à la fin en préservant leur ordre relatif
   */
  export async function moveToEnd(
    itemIds: string[], 
    type: OrderType, 
    context: OrderContext
  ): Promise<OrderOperationResult> {
    const result: OrderOperationResult = {
      success: true,
      updatedCount: 0,
      errors: []
    };
  
    try {
      const allItems = await getCurrentItems(type, context);
      const orderField = ORDER_FIELDS[type];
  
      // Séparer les éléments à déplacer de ceux qui restent
      const itemsToMove = allItems.filter(item => itemIds.includes(item.id));
      const itemsToKeep = allItems.filter(item => !itemIds.includes(item.id));
  
      // Trier les éléments à déplacer par leur ordre actuel pour préserver l'ordre relatif
      itemsToMove.sort((a, b) => a.order - b.order);
  
      // Calculer les nouveaux ordres
      const updates: { id: string; newOrder: number }[] = [];
      let nextOrder = itemsToKeep.length;
  
      // Assigner de nouveaux ordres aux éléments déplacés
      itemsToMove.forEach(item => {
        updates.push({ id: item.id, newOrder: nextOrder });
        nextOrder++;
      });
  
      // Appliquer les mises à jour en batch
      const batch = writeBatch(db);
  
      updates.forEach(({ id, newOrder }) => {
        const docRef = buildDocRef(type, context, id);
        
        console.log(`FIREBASE: ÉCRITURE - Fichier: orderManagementService.ts - Fonction: moveToEnd - Path: ${docRef.path}`);
        batch.update(docRef, {
          [orderField]: newOrder,
          updatedAt: new Date().toISOString()
        });
      });
  
      await batch.commit();
      result.updatedCount = updates.length;
  
    } catch (error) {
      console.error(`❌ Erreur moveToEnd pour ${type}:`, error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  
    return result;
  }
  
  /**
   * Réorganise une séquence complète d'éléments (pour drag & drop)
   */
  export async function reorderSequence(
    newOrderIds: string[], 
    type: OrderType, 
    context: OrderContext
  ): Promise<OrderOperationResult> {
    const result: OrderOperationResult = {
      success: true,
      updatedCount: 0,
      errors: []
    };
  
    try {
      const orderField = ORDER_FIELDS[type];
  
      // Appliquer les nouveaux ordres
      const batch = writeBatch(db);
  
      newOrderIds.forEach((itemId, index) => {
        const docRef = buildDocRef(type, context, itemId);
        
        console.log(`FIREBASE: ÉCRITURE - Fichier: orderManagementService.ts - Fonction: reorderSequence - Path: ${docRef.path}`);
        batch.update(docRef, {
          [orderField]: index,
          updatedAt: new Date().toISOString()
        });
      });
  
      await batch.commit();
      result.updatedCount = newOrderIds.length;
  
    } catch (error) {
      console.error(`❌ Erreur reorderSequence pour ${type}:`, error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  
    return result;
  }
  
  /**
   * Nettoie et remet les ordres en séquence propre [0, 1, 2, 3...]
   */
  export async function compactOrders(
    type: OrderType, 
    context: OrderContext
  ): Promise<OrderOperationResult> {
    const result: OrderOperationResult = {
      success: true,
      updatedCount: 0,
      errors: []
    };
  
    try {
      const items = await getCurrentItems(type, context);
      const orderField = ORDER_FIELDS[type];
  
      // Trier par ordre actuel puis réassigner de 0 à n-1
      items.sort((a, b) => a.order - b.order);
  
      const batch = writeBatch(db);
      let hasChanges = false;
  
      items.forEach((item, index) => {
        if (item.order !== index) {
          hasChanges = true;
          const docRef = buildDocRef(type, context, item.id);
          
          console.log(`FIREBASE: ÉCRITURE - Fichier: orderManagementService.ts - Fonction: compactOrders - Path: ${docRef.path}`);
          batch.update(docRef, {
            [orderField]: index,
            updatedAt: new Date().toISOString()
          });
        }
      });
  
      if (hasChanges) {
        await batch.commit();
        result.updatedCount = items.filter((item, index) => item.order !== index).length;
      }
  
    } catch (error) {
      console.error(`❌ Erreur compactOrders pour ${type}:`, error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  
    return result;
  }
  
  /**
   * Fonction utilitaire : Met à jour l'ordre d'un seul élément
   */
  export async function updateSingleOrder(
    itemId: string,
    newOrder: number,
    type: OrderType,
    context: OrderContext
  ): Promise<void> {
    try {
      const orderField = ORDER_FIELDS[type];
      const docRef = buildDocRef(type, context, itemId);
  
      console.log(`FIREBASE: ÉCRITURE - Fichier: orderManagementService.ts - Fonction: updateSingleOrder - Path: ${docRef.path}`);
      await updateDoc(docRef, {
        [orderField]: newOrder,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Erreur updateSingleOrder pour ${type}:`, error);
      throw error;
    }
  }
  
  /**
   * Construit une référence de document Firebase selon le type et le contexte
   */
  function buildDocRef(type: OrderType, context: OrderContext, itemId: string) {
    const { clientId, campaignId, versionId, ongletId, sectionId, tactiqueId, placementId } = context;
  
    switch (type) {
      case 'onglet':
        return doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', itemId);
        
      case 'section':
        if (!ongletId) throw new Error('ongletId requis pour les sections');
        return doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', itemId);
        
      case 'tactique':
        if (!ongletId || !sectionId) throw new Error('ongletId et sectionId requis pour les tactiques');
        return doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', itemId);
        
      case 'placement':
        if (!ongletId || !sectionId || !tactiqueId) {
          throw new Error('ongletId, sectionId et tactiqueId requis pour les placements');
        }
        return doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', itemId);
        
      case 'creatif':
        if (!ongletId || !sectionId || !tactiqueId || !placementId) {
          throw new Error('Tous les IDs parents requis pour les créatifs');
        }
        return doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId, 'creatifs', itemId);
        
      default:
        throw new Error(`Type non supporté: ${type}`);
    }
  }
  
  /**
   * Fonction utilitaire : Valide qu'un contexte a tous les IDs requis pour un type donné
   */
  export function validateContext(type: OrderType, context: OrderContext): boolean {
    const { clientId, campaignId, versionId, ongletId, sectionId, tactiqueId, placementId } = context;
  
    if (!clientId || !campaignId || !versionId) return false;
  
    switch (type) {
      case 'onglet':
        return true;
      case 'section':
        return !!ongletId;
      case 'tactique':
        return !!(ongletId && sectionId);
      case 'placement':
        return !!(ongletId && sectionId && tactiqueId);
      case 'creatif':
        return !!(ongletId && sectionId && tactiqueId && placementId);
      default:
        return false;
    }
  }