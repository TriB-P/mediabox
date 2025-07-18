// app/lib/moveService.ts - VERSION CORRIGÉE AVEC CHEMINS FIXES

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
    extractIdsFromParentPath
  } from '../types/move';
  import { Section, Tactique, Placement, Creatif } from '../types/tactiques';
  
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
  
  // ==================== UTILITAIRES POUR LES ORDRES ====================
  
  async function getNextOrderInDestination(
    clientId: string,
    destination: MoveDestination,
    itemType: 'section' | 'tactique' | 'placement' | 'creatif'
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
  
  // ==================== FONCTION PRINCIPALE DE DÉPLACEMENT ====================
  
  export async function moveItems(operation: MoveOperation): Promise<MoveResult> {
    console.log('🚀 Début de l\'opération de déplacement', operation);
  
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
  
      // Exécuter le déplacement dans une transaction
      await runTransaction(db, async (transaction) => {
        let orderIncrement = 0;
        
        for (const sourceItem of operation.sourceItems) {
          try {
            console.log(`📦 Traitement item ${sourceItem.type}:`, sourceItem.id);
            
            // Calculer le nouvel ordre
            const baseOrder = await getNextOrderInDestination(
              operation.clientId,
              operation.destination,
              sourceItem.type
            );
            const newOrder = baseOrder + orderIncrement;
            
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
            orderIncrement++;
            
          } catch (itemError) {
            console.error(`❌ Erreur déplacement ${sourceItem.type} ${sourceItem.id}:`, itemError);
            allErrors.push(`Erreur lors du déplacement de ${sourceItem.type} ${sourceItem.id}: ${itemError}`);
          }
        }
      });
  
      const duration = Date.now() - startTime;
      console.log(`✅ Opération de déplacement terminée en ${duration}ms`);
      console.log(`📊 Résultats: ${totalMovedCount} déplacés, ${allErrors.length} erreurs`);
  
      return {
        success: allErrors.length === 0,
        movedItemsCount: totalMovedCount,
        skippedItemsCount: operation.sourceItems.length - totalMovedCount,
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