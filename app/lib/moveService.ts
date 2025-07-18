// app/lib/moveService.ts - VERSION CORRIGÉE

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
    MoveValidationResult
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
  
      return {
        isValid: errors.length === 0,
        canProceed: errors.length === 0,
        errors,
        warnings
      };
  
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
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
        if (!destination.sectionId) throw new Error('Section ID manquant pour les tactiques');
        collectionRef = collection(
          db, 'clients', clientId, 'campaigns', destination.campaignId,
          'versions', destination.versionId, 'onglets', destination.ongletId,
          'sections', destination.sectionId, 'tactiques'
        );
        orderField = 'TC_Order';
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
        orderField = 'PL_Order';
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
  
  // ==================== FONCTIONS DE DÉPLACEMENT SIMPLIFIÉES ====================
  
  async function moveSection(
    transaction: any,
    sourceItem: SelectedItemWithSource,
    destination: MoveDestination,
    clientId: string,
    newOrder: number
  ): Promise<void> {
    const section = sourceItem.item as Section;
    
    console.log('🔄 Déplacement section:', section.SECTION_Name);
    
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
    
    // TODO: Déplacer les tactiques enfants (implémentation future)
    console.log('⚠️ Déplacement des tactiques enfants non implémenté pour cette version');
    
    // Supprimer l'ancienne section
    const oldSectionRef = doc(
      db, 'clients', clientId, 'campaigns', sourceItem.parentPath[0] || destination.campaignId,
      'versions', sourceItem.parentPath[1] || destination.versionId,
      'onglets', sourceItem.parentPath[2] || destination.ongletId,
      'sections', section.id
    );
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
    
    console.log('🔄 Déplacement tactique:', tactique.TC_Label);
    
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
    
    // TODO: Déplacer les placements enfants (implémentation future)
    console.log('⚠️ Déplacement des placements enfants non implémenté pour cette version');
    
    // Supprimer l'ancienne tactique
    const oldTactiqueRef = doc(
      db, 'clients', clientId, 'campaigns', sourceItem.parentPath[0] || destination.campaignId,
      'versions', sourceItem.parentPath[1] || destination.versionId,
      'onglets', sourceItem.parentPath[2] || destination.ongletId,
      'sections', sourceItem.parentPath[0], 'tactiques', tactique.id
    );
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
    
    console.log('🔄 Déplacement placement:', placement.PL_Label);
    
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
    
    // TODO: Déplacer les créatifs enfants (implémentation future)
    console.log('⚠️ Déplacement des créatifs enfants non implémenté pour cette version');
    
    // Supprimer l'ancien placement
    const oldPlacementRef = doc(
      db, 'clients', clientId, 'campaigns', sourceItem.parentPath[0] || destination.campaignId,
      'versions', sourceItem.parentPath[1] || destination.versionId,
      'onglets', sourceItem.parentPath[2] || destination.ongletId,
      'sections', sourceItem.parentPath[0], 'tactiques', sourceItem.parentPath[1],
      'placements', placement.id
    );
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
    
    console.log('🔄 Déplacement créatif:', creatif.CR_Label, {
      source: sourceItem.parentPath,
      destination: {
        campaignId: destination.campaignId,
        versionId: destination.versionId,
        ongletId: destination.ongletId,
        sectionId: destination.sectionId,
        tactiqueId: destination.tactiqueId,
        placementId: destination.placementId
      }
    });
    
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
    
    // Supprimer l'ancien créatif
    // 🔥 CORRECTION: Construire le chemin source correctement
    const sourceCampaignId = sourceItem.parentPath[3] || destination.campaignId;
    const sourceVersionId = sourceItem.parentPath[4] || destination.versionId;
    const sourceOngletId = sourceItem.parentPath[5] || destination.ongletId;
    const sourceSectionId = sourceItem.parentPath[0];
    const sourceTactiqueId = sourceItem.parentPath[1];
    const sourcePlacementId = sourceItem.parentPath[2];
    
    console.log('🗑️ Suppression ancien créatif:', {
      campaignId: sourceCampaignId,
      versionId: sourceVersionId,
      ongletId: sourceOngletId,
      sectionId: sourceSectionId,
      tactiqueId: sourceTactiqueId,
      placementId: sourcePlacementId,
      creatifId: creatif.id
    });
    
    const oldCreatifRef = doc(
      db, 'clients', clientId, 'campaigns', sourceCampaignId,
      'versions', sourceVersionId, 'onglets', sourceOngletId,
      'sections', sourceSectionId, 'tactiques', sourceTactiqueId,
      'placements', sourcePlacementId, 'creatifs', creatif.id
    );
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