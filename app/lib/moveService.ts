// app/lib/moveService.ts

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
    runTransaction,
    where
  } from 'firebase/firestore';
  import { db } from './firebase';
  import {
    MoveOperation,
    MoveResult,
    MoveDestination,
    SelectedItemWithSource,
    MoveValidationResult
  } from '../types/move';
  import { Section, Tactique, Placement, Creatif } from '../types/tactiques';
  
  // ==================== INTERFACES INTERNES ====================
  
  interface MoveContext {
    clientId: string;
    sourceRefs: {
      campaignId: string;
      versionId: string;
      ongletId: string;
    };
    destinationRefs: {
      campaignId: string;
      versionId: string;
      ongletId: string;
    };
  }
  
  interface ItemWithNewOrder {
    id: string;
    newOrder: number;
    data: any;
  }
  
  // ==================== VALIDATION DE DESTINATION ====================
  
  export async function validateMoveDestination(
    destination: Partial<MoveDestination>,
    clientId: string
  ): Promise<MoveValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
  
    try {
      // Vérifier que la campagne existe et appartient au client
      if (destination.campaignId) {
        const campaignRef = doc(db, 'clients', clientId, 'campaigns', destination.campaignId);
        const campaignSnap = await getDoc(campaignRef);
        
        if (!campaignSnap.exists()) {
          errors.push('La campagne de destination n\'existe pas ou n\'est plus accessible');
        }
      }
  
      // Vérifier que la version existe
      if (destination.campaignId && destination.versionId) {
        const versionRef = doc(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId
        );
        const versionSnap = await getDoc(versionRef);
        
        if (!versionSnap.exists()) {
          errors.push('La version de destination n\'existe pas ou n\'est plus accessible');
        }
      }
  
      // Vérifier que l'onglet existe
      if (destination.campaignId && destination.versionId && destination.ongletId) {
        const ongletRef = doc(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId
        );
        const ongletSnap = await getDoc(ongletRef);
        
        if (!ongletSnap.exists()) {
          errors.push('L\'onglet de destination n\'existe pas ou n\'est plus accessible');
        }
      }
  
      // Vérifications supplémentaires selon le niveau de destination
      if (destination.sectionId) {
        const sectionRef = doc(
          db, 'clients', clientId, 'campaigns', destination.campaignId!,
          'versions', destination.versionId!, 'onglets', destination.ongletId!,
          'sections', destination.sectionId
        );
        const sectionSnap = await getDoc(sectionRef);
        
        if (!sectionSnap.exists()) {
          errors.push('La section de destination n\'existe pas ou n\'est plus accessible');
        }
      }
  
      if (destination.tactiqueId) {
        const tactiqueRef = doc(
          db, 'clients', clientId, 'campaigns', destination.campaignId!,
          'versions', destination.versionId!, 'onglets', destination.ongletId!,
          'sections', destination.sectionId!, 'tactiques', destination.tactiqueId
        );
        const tactiqueSnap = await getDoc(tactiqueRef);
        
        if (!tactiqueSnap.exists()) {
          errors.push('La tactique de destination n\'existe pas ou n\'est plus accessible');
        }
      }
  
      if (destination.placementId) {
        const placementRef = doc(
          db, 'clients', clientId, 'campaigns', destination.campaignId!,
          'versions', destination.versionId!, 'onglets', destination.ongletId!,
          'sections', destination.sectionId!, 'tactiques', destination.tactiqueId!,
          'placements', destination.placementId
        );
        const placementSnap = await getDoc(placementRef);
        
        if (!placementSnap.exists()) {
          errors.push('Le placement de destination n\'existe pas ou n\'est plus accessible');
        }
      }
  
      return {
        isValid: errors.length === 0,
        canProceed: errors.length === 0,
        errors,
        warnings
      };
  
    } catch (error) {
      console.error('Erreur lors de la validation de destination:', error);
      return {
        isValid: false,
        canProceed: false,
        errors: ['Erreur lors de la validation de la destination'],
        warnings: []
      };
    }
  }
  
  // ==================== UTILITAIRES DE CALCUL D'ORDRE ====================
  
  async function getNextOrderInDestination(
    clientId: string,
    destination: MoveDestination,
    itemType: 'section' | 'tactique' | 'placement' | 'creatif'
  ): Promise<number> {
    let collectionRef;
    let orderField: string;
  
    switch (itemType) {
      case 'section':
        collectionRef = collection(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId, 'sections'
        );
        orderField = 'SECTION_Order';
        break;
        
      case 'tactique':
        collectionRef = collection(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId,
          'sections', destination.sectionId!, 'tactiques'
        );
        orderField = 'TC_Order';
        break;
        
      case 'placement':
        collectionRef = collection(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId,
          'sections', destination.sectionId!, 'tactiques', destination.tactiqueId!, 'placements'
        );
        orderField = 'PL_Order';
        break;
        
      case 'creatif':
        collectionRef = collection(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId,
          'sections', destination.sectionId!, 'tactiques', destination.tactiqueId!,
          'placements', destination.placementId!, 'creatifs'
        );
        orderField = 'CR_Order';
        break;
    }
  
    const q = query(collectionRef, orderBy(orderField, 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 0;
    }
    
    const lastItem = snapshot.docs[0].data();
    return (lastItem[orderField] || 0) + 1;
  }
  
  async function reorderItemsInCollection(
    batch: any,
    clientId: string,
    collectionPathSegments: string[],
    orderField: string,
    excludeIds: string[] = []
  ) {
    // Construction explicite de la référence selon le nombre de segments
    let collectionRef;
    
    if (collectionPathSegments.length === 4) {
      // Ex: ['campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections']
      const [p1, p2, p3, p4, p5, p6, p7] = collectionPathSegments;
      collectionRef = collection(db, 'clients', clientId, p1, p2, p3, p4, p5, p6, p7);
    } else if (collectionPathSegments.length === 6) {
      // Ex: ['campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques']
      const [p1, p2, p3, p4, p5, p6, p7, p8, p9] = collectionPathSegments;
      collectionRef = collection(db, 'clients', clientId, p1, p2, p3, p4, p5, p6, p7, p8, p9);
    } else {
      // Fallback - construire manuellement (moins sûr mais fonctionnel)
      const pathString = ['clients', clientId, ...collectionPathSegments].join('/');
      console.warn('Utilisation de la construction de chemin fallback pour:', pathString);
      return; // Skip pour éviter les erreurs
    }
    
    const q = query(collectionRef, orderBy(orderField, 'asc'));
    const snapshot = await getDocs(q);
    
    let newOrder = 0;
    snapshot.docs.forEach((docSnap) => {
      if (!excludeIds.includes(docSnap.id)) {
        const docRef = doc(collectionRef, docSnap.id);
        batch.update(docRef, { 
          [orderField]: newOrder,
          updatedAt: new Date().toISOString()
        });
        newOrder++;
      }
    });
  }
  
  // ==================== FONCTIONS DE DÉPLACEMENT PAR TYPE ====================
  
  async function moveSections(
    operation: MoveOperation,
    context: MoveContext
  ): Promise<{ movedCount: number; errors: string[] }> {
    let movedCount = 0;
    const errors: string[] = [];
  
    console.log('🔄 Déplacement de sections:', operation.sourceItems.length);
  
    await runTransaction(db, async (transaction) => {
      for (const sourceItem of operation.sourceItems.filter(item => item.type === 'section')) {
        try {
          const section = sourceItem.item as Section;
          
          // Déterminer le nouvel ordre
          const newOrder = await getNextOrderInDestination(
            operation.clientId,
            operation.destination,
            'section'
          );
  
          // Créer la nouvelle section dans la destination
          const newSectionRef = doc(collection(
            db, 'clients', operation.clientId, 'campaigns', operation.destination.campaignId,
            'versions', operation.destination.versionId, 'onglets', operation.destination.ongletId, 'sections'
          ));
  
          const newSectionData = {
            ...section,
            SECTION_Order: newOrder + movedCount,
            updatedAt: new Date().toISOString()
          };
          delete (newSectionData as any).id; // Supprimer l'ancien ID
  
          transaction.set(newSectionRef, newSectionData);
  
          // Déplacer toutes les tactiques de cette section
          const tactiquesRef = collection(
            db, 'clients', operation.clientId, 'campaigns', context.sourceRefs.campaignId,
            'versions', context.sourceRefs.versionId, 'onglets', context.sourceRefs.ongletId,
            'sections', section.id, 'tactiques'
          );
          
          const tactiquesSnapshot = await getDocs(tactiquesRef);
          
          for (const tactiqueDoc of tactiquesSnapshot.docs) {
            const tactiqueData = tactiqueDoc.data();
            
            // Créer la tactique dans la nouvelle section
            const newTactiqueRef = doc(collection(
              db, 'clients', operation.clientId, 'campaigns', operation.destination.campaignId,
              'versions', operation.destination.versionId, 'onglets', operation.destination.ongletId,
              'sections', newSectionRef.id, 'tactiques'
            ));
  
            const newTactiqueData = {
              ...tactiqueData,
              TC_SectionId: newSectionRef.id,
              updatedAt: new Date().toISOString()
            };
  
            transaction.set(newTactiqueRef, newTactiqueData);
  
            // Déplacer tous les placements de cette tactique
            await movePlacementsForTactique(
              transaction,
              operation.clientId,
              context,
              operation.destination,
              tactiqueDoc.id,
              newTactiqueRef.id,
              newSectionRef.id,
              section.id
            );
  
            // Supprimer l'ancienne tactique
            transaction.delete(tactiqueDoc.ref);
          }
  
          // Supprimer l'ancienne section
          const oldSectionRef = doc(
            db, 'clients', operation.clientId, 'campaigns', context.sourceRefs.campaignId,
            'versions', context.sourceRefs.versionId, 'onglets', context.sourceRefs.ongletId,
            'sections', section.id
          );
          transaction.delete(oldSectionRef);
  
          movedCount++;
          console.log(`✅ Section déplacée: ${section.SECTION_Name}`);
  
        } catch (error) {
          console.error(`❌ Erreur déplacement section ${sourceItem.id}:`, error);
          errors.push(`Erreur lors du déplacement de la section ${sourceItem.id}`);
        }
      }
    });
  
    return { movedCount, errors };
  }
  
  async function movePlacementsForTactique(
    transaction: any,
    clientId: string,
    context: MoveContext,
    destination: MoveDestination,
    oldTactiqueId: string,
    newTactiqueId: string,
    newSectionId: string,
    oldSectionId: string
  ) {
    const placementsRef = collection(
      db, 'clients', clientId, 'campaigns', context.sourceRefs.campaignId,
      'versions', context.sourceRefs.versionId, 'onglets', context.sourceRefs.ongletId,
      'sections', oldSectionId, 'tactiques', oldTactiqueId, 'placements'
    );
    
    const placementsSnapshot = await getDocs(placementsRef);
    
    for (const placementDoc of placementsSnapshot.docs) {
      const placementData = placementDoc.data();
      
      // Créer le placement dans la nouvelle tactique
      const newPlacementRef = doc(collection(
        db, 'clients', clientId, 'campaigns', destination.campaignId,
        'versions', destination.versionId, 'onglets', destination.ongletId,
        'sections', newSectionId, 'tactiques', newTactiqueId, 'placements'
      ));
  
      const newPlacementData = {
        ...placementData,
        PL_TactiqueId: newTactiqueId,
        updatedAt: new Date().toISOString()
      };
  
      transaction.set(newPlacementRef, newPlacementData);
  
      // Déplacer tous les créatifs de ce placement
      await moveCreatifsForPlacement(
        transaction,
        clientId,
        context,
        destination,
        placementDoc.id,
        newPlacementRef.id,
        newTactiqueId,
        newSectionId,
        oldSectionId,
        oldTactiqueId
      );
  
      // Supprimer l'ancien placement
      transaction.delete(placementDoc.ref);
    }
  }
  
  async function moveCreatifsForPlacement(
    transaction: any,
    clientId: string,
    context: MoveContext,
    destination: MoveDestination,
    oldPlacementId: string,
    newPlacementId: string,
    newTactiqueId: string,
    newSectionId: string,
    oldSectionId: string,
    oldTactiqueId: string
  ) {
    const creatifsRef = collection(
      db, 'clients', clientId, 'campaigns', context.sourceRefs.campaignId,
      'versions', context.sourceRefs.versionId, 'onglets', context.sourceRefs.ongletId,
      'sections', oldSectionId, 'tactiques', oldTactiqueId,
      'placements', oldPlacementId, 'creatifs'
    );
    
    const creatifsSnapshot = await getDocs(creatifsRef);
    
    for (const creatifDoc of creatifsSnapshot.docs) {
      const creatifData = creatifDoc.data();
      
      // Créer le créatif dans le nouveau placement
      const newCreatifRef = doc(collection(
        db, 'clients', clientId, 'campaigns', destination.campaignId,
        'versions', destination.versionId, 'onglets', destination.ongletId,
        'sections', newSectionId, 'tactiques', newTactiqueId,
        'placements', newPlacementId, 'creatifs'
      ));
  
      const newCreatifData = {
        ...creatifData,
        CR_PlacementId: newPlacementId,
        updatedAt: new Date().toISOString()
      };
  
      transaction.set(newCreatifRef, newCreatifData);
  
      // Supprimer l'ancien créatif
      transaction.delete(creatifDoc.ref);
    }
  }
  
  async function moveTactiques(
    operation: MoveOperation,
    context: MoveContext
  ): Promise<{ movedCount: number; errors: string[] }> {
    let movedCount = 0;
    const errors: string[] = [];
  
    console.log('🔄 Déplacement de tactiques:', operation.sourceItems.length);
  
    await runTransaction(db, async (transaction) => {
      for (const sourceItem of operation.sourceItems.filter(item => item.type === 'tactique')) {
        try {
          const tactique = sourceItem.item as Tactique;
          
          // Déterminer le nouvel ordre
          const newOrder = await getNextOrderInDestination(
            operation.clientId,
            operation.destination,
            'tactique'
          );
  
          // Créer la nouvelle tactique dans la destination
          const newTactiqueRef = doc(collection(
            db, 'clients', operation.clientId, 'campaigns', operation.destination.campaignId,
            'versions', operation.destination.versionId, 'onglets', operation.destination.ongletId,
            'sections', operation.destination.sectionId!, 'tactiques'
          ));
  
          const newTactiqueData = {
            ...tactique,
            TC_SectionId: operation.destination.sectionId!,
            TC_Order: newOrder + movedCount,
            updatedAt: new Date().toISOString()
          };
          delete (newTactiqueData as any).id;
  
          transaction.set(newTactiqueRef, newTactiqueData);
  
          // Déplacer tous les placements de cette tactique
          await movePlacementsForTactique(
            transaction,
            operation.clientId,
            context,
            operation.destination,
            tactique.id,
            newTactiqueRef.id,
            operation.destination.sectionId!,
            tactique.TC_SectionId
          );
  
          // Supprimer l'ancienne tactique
          const oldTactiqueRef = doc(
            db, 'clients', operation.clientId, 'campaigns', context.sourceRefs.campaignId,
            'versions', context.sourceRefs.versionId, 'onglets', context.sourceRefs.ongletId,
            'sections', tactique.TC_SectionId, 'tactiques', tactique.id
          );
          transaction.delete(oldTactiqueRef);
  
          movedCount++;
          console.log(`✅ Tactique déplacée: ${tactique.TC_Label}`);
  
        } catch (error) {
          console.error(`❌ Erreur déplacement tactique ${sourceItem.id}:`, error);
          errors.push(`Erreur lors du déplacement de la tactique ${sourceItem.id}`);
        }
      }
    });
  
    return { movedCount, errors };
  }
  
  async function movePlacements(
    operation: MoveOperation,
    context: MoveContext
  ): Promise<{ movedCount: number; errors: string[] }> {
    let movedCount = 0;
    const errors: string[] = [];
  
    console.log('🔄 Déplacement de placements:', operation.sourceItems.length);
  
    await runTransaction(db, async (transaction) => {
      for (const sourceItem of operation.sourceItems.filter(item => item.type === 'placement')) {
        try {
          const placement = sourceItem.item as Placement;
          
          // Déterminer le nouvel ordre
          const newOrder = await getNextOrderInDestination(
            operation.clientId,
            operation.destination,
            'placement'
          );
  
          // Créer le nouveau placement dans la destination
          const newPlacementRef = doc(collection(
            db, 'clients', operation.clientId, 'campaigns', operation.destination.campaignId,
            'versions', operation.destination.versionId, 'onglets', operation.destination.ongletId,
            'sections', operation.destination.sectionId!, 'tactiques', operation.destination.tactiqueId!,
            'placements'
          ));
  
          const newPlacementData = {
            ...placement,
            PL_TactiqueId: operation.destination.tactiqueId!,
            PL_Order: newOrder + movedCount,
            updatedAt: new Date().toISOString()
          };
          delete (newPlacementData as any).id;
  
          transaction.set(newPlacementRef, newPlacementData);
  
          // Déplacer tous les créatifs de ce placement
          await moveCreatifsForPlacement(
            transaction,
            operation.clientId,
            context,
            operation.destination,
            placement.id,
            newPlacementRef.id,
            operation.destination.tactiqueId!,
            operation.destination.sectionId!,
            sourceItem.parentPath[0], // oldSectionId
            sourceItem.parentPath[1]  // oldTactiqueId
          );
  
          // Supprimer l'ancien placement
          const oldPlacementRef = doc(
            db, 'clients', operation.clientId, 'campaigns', context.sourceRefs.campaignId,
            'versions', context.sourceRefs.versionId, 'onglets', context.sourceRefs.ongletId,
            'sections', sourceItem.parentPath[0], 'tactiques', sourceItem.parentPath[1],
            'placements', placement.id
          );
          transaction.delete(oldPlacementRef);
  
          movedCount++;
          console.log(`✅ Placement déplacé: ${placement.PL_Label}`);
  
        } catch (error) {
          console.error(`❌ Erreur déplacement placement ${sourceItem.id}:`, error);
          errors.push(`Erreur lors du déplacement du placement ${sourceItem.id}`);
        }
      }
    });
  
    return { movedCount, errors };
  }
  
  async function moveCreatifs(
    operation: MoveOperation,
    context: MoveContext
  ): Promise<{ movedCount: number; errors: string[] }> {
    let movedCount = 0;
    const errors: string[] = [];
  
    console.log('🔄 Déplacement de créatifs:', operation.sourceItems.length);
  
    await runTransaction(db, async (transaction) => {
      for (const sourceItem of operation.sourceItems.filter(item => item.type === 'creatif')) {
        try {
          const creatif = sourceItem.item as Creatif;
          
          // Déterminer le nouvel ordre
          const newOrder = await getNextOrderInDestination(
            operation.clientId,
            operation.destination,
            'creatif'
          );
  
          // Créer le nouveau créatif dans la destination
          const newCreatifRef = doc(collection(
            db, 'clients', operation.clientId, 'campaigns', operation.destination.campaignId,
            'versions', operation.destination.versionId, 'onglets', operation.destination.ongletId,
            'sections', operation.destination.sectionId!, 'tactiques', operation.destination.tactiqueId!,
            'placements', operation.destination.placementId!, 'creatifs'
          ));
  
          const newCreatifData = {
            ...creatif,
            CR_PlacementId: operation.destination.placementId!,
            CR_Order: newOrder + movedCount,
            updatedAt: new Date().toISOString()
          };
          delete (newCreatifData as any).id;
  
          transaction.set(newCreatifRef, newCreatifData);
  
          // Supprimer l'ancien créatif
          const oldCreatifRef = doc(
            db, 'clients', operation.clientId, 'campaigns', context.sourceRefs.campaignId,
            'versions', context.sourceRefs.versionId, 'onglets', context.sourceRefs.ongletId,
            'sections', sourceItem.parentPath[0], 'tactiques', sourceItem.parentPath[1],
            'placements', sourceItem.parentPath[2], 'creatifs', creatif.id
          );
          transaction.delete(oldCreatifRef);
  
          movedCount++;
          console.log(`✅ Créatif déplacé: ${creatif.CR_Label}`);
  
        } catch (error) {
          console.error(`❌ Erreur déplacement créatif ${sourceItem.id}:`, error);
          errors.push(`Erreur lors du déplacement du créatif ${sourceItem.id}`);
        }
      }
    });
  
    return { movedCount, errors };
  }
  
  // ==================== FONCTION PRINCIPALE DE DÉPLACEMENT ====================
  
  export async function moveItems(operation: MoveOperation): Promise<MoveResult> {
    console.log('🚀 Début de l\'opération de déplacement', operation);
  
    const startTime = Date.now();
    let totalMovedCount = 0;
    let totalSkippedCount = 0;
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
  
    try {
      // Validation préalable
      const validation = await validateMoveDestination(operation.destination, operation.clientId);
      if (!validation.isValid) {
        return {
          success: false,
          movedItemsCount: 0,
          skippedItemsCount: operation.sourceItems.length,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }
  
      // Contexte pour les opérations
      const context: MoveContext = {
        clientId: operation.clientId,
        sourceRefs: {
          campaignId: operation.sourceItems[0]?.parentPath[0] || '', // Sera récupéré dynamiquement
          versionId: operation.sourceItems[0]?.parentPath[1] || '',
          ongletId: operation.sourceItems[0]?.parentPath[2] || ''
        },
        destinationRefs: {
          campaignId: operation.destination.campaignId,
          versionId: operation.destination.versionId,
          ongletId: operation.destination.ongletId
        }
      };
  
      // Déplacement selon le type d'opération
      let result: { movedCount: number; errors: string[] };
  
      switch (operation.operationType) {
        case 'section':
          result = await moveSections(operation, context);
          break;
        case 'tactique':
          result = await moveTactiques(operation, context);
          break;
        case 'placement':
          result = await movePlacements(operation, context);
          break;
        case 'creatif':
          result = await moveCreatifs(operation, context);
          break;
        default:
          throw new Error(`Type d'opération non supporté: ${operation.operationType}`);
      }
  
      totalMovedCount = result.movedCount;
      totalSkippedCount = operation.sourceItems.length - result.movedCount;
      allErrors.push(...result.errors);
  
      // Note: La réorganisation des ordres dans les collections source 
      // sera implémentée dans une version future. Pour l'instant, les ordres 
      // sont recalculés côté client lors du refresh.
  
      const duration = Date.now() - startTime;
      console.log(`✅ Opération de déplacement terminée en ${duration}ms`);
      console.log(`📊 Résultats: ${totalMovedCount} déplacés, ${totalSkippedCount} ignorés, ${allErrors.length} erreurs`);
  
      return {
        success: allErrors.length === 0,
        movedItemsCount: totalMovedCount,
        skippedItemsCount: totalSkippedCount,
        errors: allErrors,
        warnings: allWarnings
      };
  
    } catch (error) {
      console.error('❌ Erreur fatale lors du déplacement:', error);
      return {
        success: false,
        movedItemsCount: totalMovedCount,
        skippedItemsCount: operation.sourceItems.length - totalMovedCount,
        errors: [`Erreur fatale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`],
        warnings: allWarnings
      };
    }
  }
  
  // ==================== EXPORT PAR DÉFAUT ====================
  
  export default {
    moveItems,
    validateMoveDestination
  };