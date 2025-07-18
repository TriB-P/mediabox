// app/lib/moveService.ts - VERSION CORRIGÉE AVEC GESTION HIÉRARCHIQUE AUTOMATIQUE

import {
    collection,
    doc,
    getDocs,
    getDoc,
    runTransaction,
    query,
    orderBy
  } from 'firebase/firestore';
  import { db } from './firebase';
  import {
    MoveOperation,
    MoveResult,
    MoveDestination,
    SelectedItemWithSource,
    MoveValidationResult,
    ORDER_FIELDS,
    extractIdsFromParentPath,
    MoveItemType
  } from '../types/move';
  import { Section, Tactique, Placement, Creatif } from '../types/tactiques';
  
  // ==================== 🔥 NOUVEAU: STRUCTURE POUR GÉRER LA HIÉRARCHIE ====================
  
  interface HierarchicalMoveItem {
    element: SelectedItemWithSource;
    children: HierarchicalMoveItem[];
    order: number; // Ordre de traitement (enfants d'abord)
  }
  
  // ==================== VALIDATION DE DESTINATION ====================
  
  export async function validateMoveDestination(
    destination: Partial<MoveDestination>,
    clientId: string
  ): Promise<MoveValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
  
    try {
      console.log('🔍 Validation destination:', destination);
  
      // Vérifications de base
      if (!destination.campaignId) {
        errors.push('Campagne de destination manquante');
        return { isValid: false, canProceed: false, errors, warnings };
      }
  
      if (!destination.versionId) {
        errors.push('Version de destination manquante');
        return { isValid: false, canProceed: false, errors, warnings };
      }
  
      if (!destination.ongletId) {
        errors.push('Onglet de destination manquant');
        return { isValid: false, canProceed: false, errors, warnings };
      }
  
      // Vérifier l'existence des références
      const campaignRef = doc(db, 'clients', clientId, 'campaigns', destination.campaignId);
      const campaignSnap = await getDoc(campaignRef);
      if (!campaignSnap.exists()) {
        errors.push('La campagne de destination n\'existe pas');
      }
  
      const versionRef = doc(
        db, 'clients', clientId, 'campaigns', destination.campaignId,
        'versions', destination.versionId
      );
      const versionSnap = await getDoc(versionRef);
      if (!versionSnap.exists()) {
        errors.push('La version de destination n\'existe pas');
      }
  
      const ongletRef = doc(
        db, 'clients', clientId, 'campaigns', destination.campaignId,
        'versions', destination.versionId, 'onglets', destination.ongletId
      );
      const ongletSnap = await getDoc(ongletRef);
      if (!ongletSnap.exists()) {
        errors.push('L\'onglet de destination n\'existe pas');
      }
  
      // Vérifications conditionnelles selon le niveau de destination
      if (destination.sectionId) {
        const sectionRef = doc(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId,
          'sections', destination.sectionId
        );
        const sectionSnap = await getDoc(sectionRef);
        if (!sectionSnap.exists()) {
          errors.push('La section de destination n\'existe pas');
        }
      }
  
      if (destination.tactiqueId && destination.sectionId) {
        const tactiqueRef = doc(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId,
          'sections', destination.sectionId, 'tactiques', destination.tactiqueId
        );
        const tactiqueSnap = await getDoc(tactiqueRef);
        if (!tactiqueSnap.exists()) {
          errors.push('La tactique de destination n\'existe pas');
        }
      }
  
      if (destination.placementId && destination.tactiqueId && destination.sectionId) {
        const placementRef = doc(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId,
          'sections', destination.sectionId, 'tactiques', destination.tactiqueId,
          'placements', destination.placementId
        );
        const placementSnap = await getDoc(placementRef);
        if (!placementSnap.exists()) {
          errors.push('Le placement de destination n\'existe pas');
        }
      }
  
      console.log(`✅ Validation terminée: ${errors.length} erreurs, ${warnings.length} avertissements`);
  
      return {
        isValid: errors.length === 0,
        canProceed: errors.length === 0,
        errors,
        warnings
      };
  
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      return {
        isValid: false,
        canProceed: false,
        errors: ['Erreur lors de la validation de la destination'],
        warnings: []
      };
    }
  }
  
  // ==================== 🔥 NOUVEAU: FONCTIONS POUR RÉCUPÉRER LES ENFANTS ====================
  
  async function getAllChildrenFromFirestore(
    clientId: string,
    element: SelectedItemWithSource
  ): Promise<SelectedItemWithSource[]> {
    const children: SelectedItemWithSource[] = [];
    const sourceIds = extractIdsFromParentPath(element.type, element.parentPath);
  
    console.log(`🔍 Récupération des enfants pour ${element.type} ${element.id}`);
  
    try {
      switch (element.type) {
        case 'section':
          // Récupérer les tactiques
          const tactiquesRef = collection(
            db, 'clients', clientId, 'campaigns', sourceIds.campaignId,
            'versions', sourceIds.versionId, 'onglets', sourceIds.ongletId,
            'sections', element.id, 'tactiques'
          );
          const tactiquesSnap = await getDocs(query(tactiquesRef, orderBy('TC_Order', 'asc')));
          
          for (const tactiqueDoc of tactiquesSnap.docs) {
            const tactiqueData = tactiqueDoc.data() as Tactique;
            const tactiqueWithId = { ...tactiqueData, id: tactiqueDoc.id };
            
            const tactiqueElement: SelectedItemWithSource = {
              id: tactiqueDoc.id,
              type: 'tactique',
              selectionSource: 'automatic',
              parentPath: [element.id, sourceIds.campaignId, sourceIds.versionId, sourceIds.ongletId],
              item: tactiqueWithId
            };
            
            children.push(tactiqueElement);
            
            // Récupérer récursivement les enfants de cette tactique
            const tactiqueChildren = await getAllChildrenFromFirestore(clientId, tactiqueElement);
            children.push(...tactiqueChildren);
          }
          break;
  
        case 'tactique':
          // Récupérer les placements
          const placementsRef = collection(
            db, 'clients', clientId, 'campaigns', sourceIds.campaignId,
            'versions', sourceIds.versionId, 'onglets', sourceIds.ongletId,
            'sections', sourceIds.sectionId!, 'tactiques', element.id, 'placements'
          );
          const placementsSnap = await getDocs(query(placementsRef, orderBy('PL_Order', 'asc')));
          
          for (const placementDoc of placementsSnap.docs) {
            const placementData = placementDoc.data() as Placement;
            const placementWithId = { ...placementData, id: placementDoc.id };
            
            const placementElement: SelectedItemWithSource = {
              id: placementDoc.id,
              type: 'placement',
              selectionSource: 'automatic',
              parentPath: [element.id, sourceIds.sectionId!, sourceIds.campaignId, sourceIds.versionId, sourceIds.ongletId],
              item: placementWithId
            };
            
            children.push(placementElement);
            
            // Récupérer récursivement les enfants de ce placement
            const placementChildren = await getAllChildrenFromFirestore(clientId, placementElement);
            children.push(...placementChildren);
          }
          break;
  
        case 'placement':
          // Récupérer les créatifs
          const creatifsRef = collection(
            db, 'clients', clientId, 'campaigns', sourceIds.campaignId,
            'versions', sourceIds.versionId, 'onglets', sourceIds.ongletId,
            'sections', sourceIds.sectionId!, 'tactiques', sourceIds.tactiqueId!,
            'placements', element.id, 'creatifs'
          );
          const creatifsSnap = await getDocs(query(creatifsRef, orderBy('CR_Order', 'asc')));
          
          for (const creatifDoc of creatifsSnap.docs) {
            const creatifData = creatifDoc.data() as Creatif;
            const creatifWithId = { ...creatifData, id: creatifDoc.id };
            
            const creatifElement: SelectedItemWithSource = {
              id: creatifDoc.id,
              type: 'creatif',
              selectionSource: 'automatic',
              parentPath: [element.id, sourceIds.tactiqueId!, sourceIds.sectionId!, sourceIds.campaignId, sourceIds.versionId, sourceIds.ongletId],
              item: creatifWithId
            };
            
            children.push(creatifElement);
          }
          break;
  
        case 'creatif':
          // Les créatifs n'ont pas d'enfants
          break;
      }
  
      console.log(`✅ ${children.length} enfants récupérés pour ${element.type} ${element.id}`);
      return children;
  
    } catch (error) {
      console.error(`❌ Erreur récupération enfants pour ${element.type} ${element.id}:`, error);
      return [];
    }
  }
  
  // ==================== 🔥 NOUVEAU: ORGANISATION HIÉRARCHIQUE POUR LE DÉPLACEMENT ====================
  
  function organizeHierarchicalMove(elements: SelectedItemWithSource[]): SelectedItemWithSource[] {
    console.log('🏗️ Organisation hiérarchique pour déplacement de', elements.length, 'éléments');
    
    // Grouper par type et trier par ordre de déplacement (enfants en premier)
    const byType: { [K in MoveItemType]: SelectedItemWithSource[] } = {
      creatif: [],
      placement: [],
      tactique: [],
      section: []
    };
    
    elements.forEach(element => {
      byType[element.type].push(element);
    });
    
    // Trier chaque type par ordre (pour maintenir la cohérence)
    Object.keys(byType).forEach(type => {
      byType[type as MoveItemType].sort((a, b) => {
        const aOrder = getElementOrder(a);
        const bOrder = getElementOrder(b);
        return aOrder - bOrder;
      });
    });
    
    // Retourner dans l'ordre: créatifs, puis placements, puis tactiques, puis sections
    const orderedElements = [
      ...byType.creatif,
      ...byType.placement,
      ...byType.tactique,
      ...byType.section
    ];
    
    console.log('✅ Organisation terminée:', {
      creatifs: byType.creatif.length,
      placements: byType.placement.length,
      tactiques: byType.tactique.length,
      sections: byType.section.length,
      total: orderedElements.length
    });
    
    return orderedElements;
  }
  
  function getElementOrder(element: SelectedItemWithSource): number {
    const item = element.item as any;
    switch (element.type) {
      case 'section': return item.SECTION_Order || 0;
      case 'tactique': return item.TC_Order || 0;
      case 'placement': return item.PL_Order || 0;
      case 'creatif': return item.CR_Order || 0;
      default: return 0;
    }
  }
  
  // ==================== UTILITAIRES POUR LES ORDRES ====================
  
  async function getNextOrderInDestination(
    clientId: string,
    destination: MoveDestination,
    itemType: MoveItemType
  ): Promise<number> {
    let collectionRef;
    const orderField = ORDER_FIELDS[itemType];
  
    console.log(`🔢 Calcul nouvel ordre pour ${itemType} dans:`, destination);
  
    switch (itemType) {
      case 'section':
        collectionRef = collection(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId, 'sections'
        );
        break;
        
      case 'tactique':
        if (!destination.sectionId) throw new Error('Section ID manquant pour les tactiques');
        collectionRef = collection(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId,
          'sections', destination.sectionId, 'tactiques'
        );
        break;
        
      case 'placement':
        if (!destination.sectionId || !destination.tactiqueId) {
          throw new Error('Section ID ou Tactique ID manquant pour les placements');
        }
        collectionRef = collection(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId,
          'sections', destination.sectionId, 'tactiques', destination.tactiqueId, 'placements'
        );
        break;
        
      case 'creatif':
        if (!destination.sectionId || !destination.tactiqueId || !destination.placementId) {
          throw new Error('Section, Tactique ou Placement ID manquant pour les créatifs');
        }
        collectionRef = collection(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId,
          'sections', destination.sectionId, 'tactiques', destination.tactiqueId,
          'placements', destination.placementId, 'creatifs'
        );
        break;
    }
  
    const q = query(collectionRef, orderBy(orderField, 'desc'));
    const snapshot = await getDocs(q);
    
    const nextOrder = snapshot.empty ? 0 : (snapshot.docs[0].data()[orderField] || 0) + 1;
    console.log(`📊 Nouvel ordre calculé: ${nextOrder}`);
    
    return nextOrder;
  }
  
  // ==================== FONCTIONS DE DÉPLACEMENT AVEC CHEMINS CORRIGÉS ====================
  
  async function moveSection(
    transaction: any,
    sourceItem: SelectedItemWithSource,
    destination: MoveDestination,
    clientId: string,
    newOrder: number
  ): Promise<void> {
    const section = sourceItem.item as Section;
    
    console.log('🔄 Déplacement section:', {
      name: section.SECTION_Name,
      id: section.id,
      parentPath: sourceItem.parentPath,
      destination
    });
    
    // Extraire les IDs source depuis parentPath
    const sourceIds = extractIdsFromParentPath('section', sourceItem.parentPath);
    
    // Créer la nouvelle section
    const newSectionRef = doc(collection(
      db, 'clients', clientId, 'campaigns', destination.campaignId,
      'versions', destination.versionId, 'onglets', destination.ongletId, 'sections'
    ));
  
    const newSectionData = {
      ...section,
      SECTION_Order: newOrder,
      updatedAt: new Date().toISOString()
    };
    delete (newSectionData as any).id;
  
    transaction.set(newSectionRef, newSectionData);
    
    // Construire le chemin de l'ancienne section
    const oldSectionRef = doc(
      db, 'clients', clientId, 'campaigns', sourceIds.campaignId,
      'versions', sourceIds.versionId, 'onglets', sourceIds.ongletId,
      'sections', section.id
    );
    
    console.log('🗑️ Suppression ancienne section:', {
      campaignId: sourceIds.campaignId,
      versionId: sourceIds.versionId,
      ongletId: sourceIds.ongletId,
      sectionId: section.id
    });
    
    transaction.delete(oldSectionRef);
  }
  
  async function moveTactique(
    transaction: any,
    sourceItem: SelectedItemWithSource,
    destination: MoveDestination,
    clientId: string,
    newOrder: number
  ): Promise<void> {
    const tactique = sourceItem.item as Tactique;
    
    console.log('🔄 Déplacement tactique:', {
      name: tactique.TC_Label,
      id: tactique.id,
      parentPath: sourceItem.parentPath,
      destination
    });
    
    // Extraire les IDs source depuis parentPath
    const sourceIds = extractIdsFromParentPath('tactique', sourceItem.parentPath);
    
    // Créer la nouvelle tactique
    const newTactiqueRef = doc(collection(
      db, 'clients', clientId, 'campaigns', destination.campaignId,
      'versions', destination.versionId, 'onglets', destination.ongletId,
      'sections', destination.sectionId!, 'tactiques'
    ));
  
    const newTactiqueData = {
      ...tactique,
      TC_SectionId: destination.sectionId!,
      TC_Order: newOrder,
      updatedAt: new Date().toISOString()
    };
    delete (newTactiqueData as any).id;
  
    transaction.set(newTactiqueRef, newTactiqueData);
    
    // Construire le chemin de l'ancienne tactique
    const oldTactiqueRef = doc(
      db, 'clients', clientId, 'campaigns', sourceIds.campaignId,
      'versions', sourceIds.versionId, 'onglets', sourceIds.ongletId,
      'sections', sourceIds.sectionId!, 'tactiques', tactique.id
    );
    
    console.log('🗑️ Suppression ancienne tactique:', {
      campaignId: sourceIds.campaignId,
      versionId: sourceIds.versionId,
      ongletId: sourceIds.ongletId,
      sectionId: sourceIds.sectionId,
      tactiqueId: tactique.id
    });
    
    transaction.delete(oldTactiqueRef);
  }
  
  async function movePlacement(
    transaction: any,
    sourceItem: SelectedItemWithSource,
    destination: MoveDestination,
    clientId: string,
    newOrder: number
  ): Promise<void> {
    const placement = sourceItem.item as Placement;
    
    console.log('🔄 Déplacement placement:', {
      name: placement.PL_Label,
      id: placement.id,
      parentPath: sourceItem.parentPath,
      destination
    });
    
    // Extraire les IDs source depuis parentPath
    const sourceIds = extractIdsFromParentPath('placement', sourceItem.parentPath);
    
    // Créer le nouveau placement
    const newPlacementRef = doc(collection(
      db, 'clients', clientId, 'campaigns', destination.campaignId,
      'versions', destination.versionId, 'onglets', destination.ongletId,
      'sections', destination.sectionId!, 'tactiques', destination.tactiqueId!, 'placements'
    ));
  
    const newPlacementData = {
      ...placement,
      PL_TactiqueId: destination.tactiqueId!,
      PL_SectionId: destination.sectionId!,
      PL_Order: newOrder,
      updatedAt: new Date().toISOString()
    };
    delete (newPlacementData as any).id;
  
    transaction.set(newPlacementRef, newPlacementData);
    
    // Construire le chemin de l'ancien placement
    const oldPlacementRef = doc(
      db, 'clients', clientId, 'campaigns', sourceIds.campaignId,
      'versions', sourceIds.versionId, 'onglets', sourceIds.ongletId,
      'sections', sourceIds.sectionId!, 'tactiques', sourceIds.tactiqueId!,
      'placements', placement.id
    );
    
    console.log('🗑️ Suppression ancien placement:', {
      campaignId: sourceIds.campaignId,
      versionId: sourceIds.versionId,
      ongletId: sourceIds.ongletId,
      sectionId: sourceIds.sectionId,
      tactiqueId: sourceIds.tactiqueId,
      placementId: placement.id
    });
    
    transaction.delete(oldPlacementRef);
  }
  
  async function moveCreatif(
    transaction: any,
    sourceItem: SelectedItemWithSource,
    destination: MoveDestination,
    clientId: string,
    newOrder: number
  ): Promise<void> {
    const creatif = sourceItem.item as Creatif;
    
    console.log('🔄 Déplacement créatif:', {
      name: creatif.CR_Label,
      id: creatif.id,
      parentPath: sourceItem.parentPath,
      destination
    });
    
    // Extraire les IDs source depuis parentPath
    const sourceIds = extractIdsFromParentPath('creatif', sourceItem.parentPath);
    
    // Créer le nouveau créatif
    const newCreatifRef = doc(collection(
      db, 'clients', clientId, 'campaigns', destination.campaignId,
      'versions', destination.versionId, 'onglets', destination.ongletId,
      'sections', destination.sectionId!, 'tactiques', destination.tactiqueId!,
      'placements', destination.placementId!, 'creatifs'
    ));
  
    const newCreatifData = {
      ...creatif,
      CR_PlacementId: destination.placementId!,
      CR_TactiqueId: destination.tactiqueId!,
      CR_SectionId: destination.sectionId!,
      CR_Order: newOrder,
      updatedAt: new Date().toISOString()
    };
    delete (newCreatifData as any).id;
  
    console.log('📝 Données du nouveau créatif:', newCreatifData);
  
    transaction.set(newCreatifRef, newCreatifData);
    
    // Construire le chemin de l'ancien créatif
    const oldCreatifRef = doc(
      db, 'clients', clientId, 'campaigns', sourceIds.campaignId,
      'versions', sourceIds.versionId, 'onglets', sourceIds.ongletId,
      'sections', sourceIds.sectionId!, 'tactiques', sourceIds.tactiqueId!,
      'placements', sourceIds.placementId!, 'creatifs', creatif.id
    );
    
    console.log('🗑️ Suppression ancien créatif:', {
      campaignId: sourceIds.campaignId,
      versionId: sourceIds.versionId,
      ongletId: sourceIds.ongletId,
      sectionId: sourceIds.sectionId,
      tactiqueId: sourceIds.tactiqueId,
      placementId: sourceIds.placementId,
      creatifId: creatif.id
    });
    
    transaction.delete(oldCreatifRef);
  }
  
  // ==================== 🔥 FONCTION PRINCIPALE DE DÉPLACEMENT AVEC GESTION HIÉRARCHIQUE ====================
  
  export async function moveItems(operation: MoveOperation): Promise<MoveResult> {
    console.log('🚀 Début de l\'opération de déplacement hiérarchique', operation);
  
    const startTime = Date.now();
    let totalMovedCount = 0;
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
  
      // 🔥 NOUVEAU: Récupérer automatiquement tous les enfants manquants
      console.log('🔍 Récupération automatique des enfants...');
      const allItemsToMove = new Map<string, SelectedItemWithSource>();
      
      // Ajouter tous les éléments existants à la map
      operation.sourceItems.forEach(item => {
        allItemsToMove.set(item.id, item);
      });
  
      // Pour chaque élément direct, récupérer ses enfants s'ils ne sont pas déjà présents
      for (const sourceItem of operation.sourceItems) {
        if (sourceItem.selectionSource === 'direct') {
          console.log(`🔍 Récupération enfants pour ${sourceItem.type} ${sourceItem.id}`);
          const children = await getAllChildrenFromFirestore(operation.clientId, sourceItem);
          
          children.forEach(child => {
            if (!allItemsToMove.has(child.id)) {
              allItemsToMove.set(child.id, child);
              console.log(`➕ Enfant ajouté automatiquement: ${child.type} ${child.id}`);
            }
          });
        }
      }
  
      const finalItemsList = Array.from(allItemsToMove.values());
      console.log(`📦 Liste finale: ${operation.sourceItems.length} → ${finalItemsList.length} éléments`);
  
      // 🔥 NOUVEAU: Organiser les éléments dans l'ordre hiérarchique correct
      const organizedItems = organizeHierarchicalMove(finalItemsList);
  
      // Exécuter le déplacement dans une transaction
      await runTransaction(db, async (transaction) => {
        // Compteurs d'ordre par type d'élément
        const orderCounters: { [K in MoveItemType]: number } = {
          section: 0,
          tactique: 0,
          placement: 0,
          creatif: 0
        };
        
        // Calculer les ordres de base une seule fois
        const baseOrders: { [K in MoveItemType]: number } = {
          section: 0,
          tactique: 0,
          placement: 0,
          creatif: 0
        };
        
        // Calculer les ordres de base pour chaque type présent
        const typesPresent = new Set(organizedItems.map(item => item.type));
        for (const itemType of typesPresent) {
          baseOrders[itemType] = await getNextOrderInDestination(
            operation.clientId,
            operation.destination,
            itemType
          );
        }
        
        for (const sourceItem of organizedItems) {
          try {
            console.log(`📦 Traitement item ${sourceItem.type}:`, sourceItem.id);
            
            // Calculer le nouvel ordre
            const newOrder = baseOrders[sourceItem.type] + orderCounters[sourceItem.type];
            orderCounters[sourceItem.type]++;
            
            // Déplacer selon le type
            switch (sourceItem.type) {
              case 'section':
                await moveSection(transaction, sourceItem, operation.destination, operation.clientId, newOrder);
                break;
              case 'tactique':
                await moveTactique(transaction, sourceItem, operation.destination, operation.clientId, newOrder);
                break;
              case 'placement':
                await movePlacement(transaction, sourceItem, operation.destination, operation.clientId, newOrder);
                break;
              case 'creatif':
                await moveCreatif(transaction, sourceItem, operation.destination, operation.clientId, newOrder);
                break;
              default:
                throw new Error(`Type d'élément non supporté: ${sourceItem.type}`);
            }
            
            totalMovedCount++;
            
          } catch (itemError) {
            console.error(`❌ Erreur déplacement ${sourceItem.type} ${sourceItem.id}:`, itemError);
            allErrors.push(`Erreur lors du déplacement de ${sourceItem.type} ${sourceItem.id}: ${itemError}`);
          }
        }
      });
  
      const duration = Date.now() - startTime;
      console.log(`✅ Opération de déplacement hiérarchique terminée en ${duration}ms`);
      console.log(`📊 Résultats: ${totalMovedCount} déplacés, ${allErrors.length} erreurs`);
  
      return {
        success: allErrors.length === 0,
        movedItemsCount: totalMovedCount,
        skippedItemsCount: finalItemsList.length - totalMovedCount,
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