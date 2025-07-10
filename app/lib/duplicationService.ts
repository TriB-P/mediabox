// app/lib/duplicationService.ts

import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    query,
    orderBy,
    writeBatch
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { Section, Tactique, Placement, Creatif } from '../types/tactiques';
  
  // ==================== TYPES ====================
  
  export interface DuplicationContext {
    clientId: string;
    campaignId: string;
    versionId: string;
    ongletId: string;
  }
  
  export interface DuplicationResult {
    success: boolean;
    duplicatedIds: string[];
    errors: string[];
  }
  
  interface DuplicationMapping {
    [originalId: string]: string; // originalId -> newId
  }
  
  // ==================== FONCTIONS UTILITAIRES ====================
  
  /**
   * Génère un nouveau nom avec suffixe "(Copie)"
   */
  function generateDuplicateName(originalName: string): string {
    // Si le nom se termine déjà par "(Copie)" ou "(Copie N)", incrémenter
    const copyMatch = originalName.match(/^(.*?)\s*\(Copie(?:\s+(\d+))?\)$/);
    
    if (copyMatch) {
      const baseName = copyMatch[1];
      const copyNumber = copyMatch[2] ? parseInt(copyMatch[2]) + 1 : 2;
      return `${baseName} (Copie ${copyNumber})`;
    }
    
    return `${originalName} (Copie)`;
  }
  
  /**
   * Trouve le prochain ordre disponible pour un type d'élément
   */
  async function getNextAvailableOrder(
    collectionRef: any,
    orderField: string
  ): Promise<number> {
    try {
      const q = query(collectionRef, orderBy(orderField, 'desc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return 0;
      }
      
      const highestOrder = (snapshot.docs[0].data() as any)[orderField] || 0;
      return highestOrder + 1;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ordre:', error);
      return 0;
    }
  }
  
  // ==================== DUPLICATION DE CRÉATIFS ====================
  
  async function duplicateCreatif(
    context: DuplicationContext,
    sourceSectionId: string, // Section source
    sourceTactiqueId: string, // Tactique source
    sourcePlacementId: string, // Placement source
    sourceCreatifId: string, // Créatif source
    targetSectionId: string, // Section destination
    targetTactiqueId: string, // Tactique destination
    targetPlacementId: string // Placement destination
  ): Promise<string> {
    try {
      // 1. Récupérer le créatif source
      const creatifRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', sourceSectionId,
        'tactiques', sourceTactiqueId,
        'placements', sourcePlacementId,
        'creatifs', sourceCreatifId
      );
      
      const creatifSnap = await getDoc(creatifRef);
      if (!creatifSnap.exists()) {
        throw new Error(`Créatif ${sourceCreatifId} non trouvé`);
      }
      
      const creatifData = creatifSnap.data() as Creatif;
      
      // 2. Calculer le nouvel ordre dans le placement cible
      const creatifsCollection = collection(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', targetSectionId,
        'tactiques', targetTactiqueId,
        'placements', targetPlacementId,
        'creatifs'
      );
      
      const newOrder = await getNextAvailableOrder(creatifsCollection, 'CR_Order');
      
      // 3. Préparer les nouvelles données
      const newCreatifData = {
        ...creatifData,
        CR_Label: generateDuplicateName(creatifData.CR_Label),
        CR_Order: newOrder,
        CR_PlacementId: targetPlacementId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Supprimer l'ID original
      delete (newCreatifData as any).id;
      
      // 4. Créer le nouveau créatif
      const docRef = await addDoc(creatifsCollection, newCreatifData);
      console.log(`✅ Créatif dupliqué: ${sourceCreatifId} -> ${docRef.id}`);
      
      return docRef.id;
    } catch (error) {
      console.error(`❌ Erreur duplication créatif ${sourceCreatifId}:`, error);
      throw error;
    }
  }
  
  // ==================== DUPLICATION DE PLACEMENTS ====================
  
  async function duplicatePlacement(
    context: DuplicationContext,
    sourceSectionId: string, // Section source
    sourceTactiqueId: string, // Tactique source
    sourcePlacementId: string, // Placement source
    targetSectionId: string, // Section destination
    targetTactiqueId: string // Tactique destination
  ): Promise<string> {
    try {
      // 1. Récupérer le placement source
      const placementRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', sourceSectionId,
        'tactiques', sourceTactiqueId,
        'placements', sourcePlacementId
      );
      
      const placementSnap = await getDoc(placementRef);
      if (!placementSnap.exists()) {
        throw new Error(`Placement ${sourcePlacementId} non trouvé`);
      }
      
      const placementData = placementSnap.data() as Placement;
      
      // 2. Utiliser la section cible passée en paramètre
      console.log(`📋 Duplication placement ${sourcePlacementId}: ${sourceSectionId}/${sourceTactiqueId} -> ${targetSectionId}/${targetTactiqueId}`);
      
      // 3. Calculer le nouvel ordre
      const placementsCollection = collection(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', targetSectionId,
        'tactiques', targetTactiqueId,
        'placements'
      );
      
      const newOrder = await getNextAvailableOrder(placementsCollection, 'PL_Order');
      
      // 4. Préparer les nouvelles données
      const newPlacementData = {
        ...placementData,
        PL_Label: generateDuplicateName(placementData.PL_Label),
        PL_Order: newOrder,
        PL_TactiqueId: targetTactiqueId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Supprimer l'ID original
      delete (newPlacementData as any).id;
      
      // 5. Créer le nouveau placement
      const docRef = await addDoc(placementsCollection, newPlacementData);
      const newPlacementId = docRef.id;
      
      console.log(`✅ Placement dupliqué: ${sourcePlacementId} -> ${newPlacementId}`);
      
      // 6. Dupliquer tous les créatifs du placement ORIGINAL
      const creatifsRef = collection(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', sourceSectionId, // Section source
        'tactiques', sourceTactiqueId, // Tactique source
        'placements', sourcePlacementId, // Placement source
        'creatifs'
      );
      
      const creatifsSnapshot = await getDocs(creatifsRef);
      
      for (const creatifDoc of creatifsSnapshot.docs) {
        await duplicateCreatif(
          context,
          sourceSectionId, // Section source
          sourceTactiqueId, // Tactique source
          sourcePlacementId, // Placement source
          creatifDoc.id, // Créatif source
          targetSectionId, // Section destination
          targetTactiqueId, // Tactique destination
          newPlacementId // Placement destination (nouveau)
        );
      }
      
      return newPlacementId;
    } catch (error) {
      console.error(`❌ Erreur duplication placement ${sourcePlacementId}:`, error);
      throw error;
    }
  }
  
  // ==================== DUPLICATION DE TACTIQUES ====================
  
  async function duplicateTactique(
    context: DuplicationContext,
    sourceSectionId: string, // Section source
    sourceTactiqueId: string, // Tactique source
    targetSectionId: string // Section destination
  ): Promise<string> {
    try {
      // 1. Récupérer la tactique source
      const tactiqueRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', sourceSectionId,
        'tactiques', sourceTactiqueId
      );
      
      const tactiqueSnap = await getDoc(tactiqueRef);
      if (!tactiqueSnap.exists()) {
        throw new Error(`Tactique ${sourceTactiqueId} non trouvée`);
      }
      
      const tactiqueData = tactiqueSnap.data() as Tactique;
      
      // 2. Calculer le nouvel ordre
      const tactiquesCollection = collection(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', targetSectionId,
        'tactiques'
      );
      
      const newOrder = await getNextAvailableOrder(tactiquesCollection, 'TC_Order');
      
      // 3. Préparer les nouvelles données
      const newTactiqueData = {
        ...tactiqueData,
        TC_Label: generateDuplicateName(tactiqueData.TC_Label),
        TC_Order: newOrder,
        TC_SectionId: targetSectionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Supprimer l'ID original
      delete (newTactiqueData as any).id;
      
      // 4. Créer la nouvelle tactique
      const docRef = await addDoc(tactiquesCollection, newTactiqueData);
      const newTactiqueId = docRef.id;
      
      console.log(`✅ Tactique dupliquée: ${sourceTactiqueId} -> ${newTactiqueId}`);
      
      // 5. Dupliquer tous les placements de la tactique ORIGINALE
      const placementsRef = collection(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', sourceSectionId, // Section source
        'tactiques', sourceTactiqueId, // Tactique source
        'placements'
      );
      
      const placementsSnapshot = await getDocs(placementsRef);
      
      for (const placementDoc of placementsSnapshot.docs) {
        await duplicatePlacement(
          context,
          sourceSectionId, // Section source
          sourceTactiqueId, // Tactique source
          placementDoc.id, // Placement source
          targetSectionId, // Section destination
          newTactiqueId // Tactique destination (nouvelle)
        );
      }
      
      return newTactiqueId;
    } catch (error) {
      console.error(`❌ Erreur duplication tactique ${sourceTactiqueId}:`, error);
      throw error;
    }
  }
  
  // ==================== DUPLICATION DE SECTIONS ====================
  
  async function duplicateSection(
    context: DuplicationContext,
    sectionId: string
  ): Promise<string> {
    try {
      // 1. Récupérer la section source
      const sectionRef = doc(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', sectionId
      );
      
      const sectionSnap = await getDoc(sectionRef);
      if (!sectionSnap.exists()) {
        throw new Error(`Section ${sectionId} non trouvée`);
      }
      
      const sectionData = sectionSnap.data() as Section;
      
      // 2. Calculer le nouvel ordre
      const sectionsCollection = collection(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections'
      );
      
      const newOrder = await getNextAvailableOrder(sectionsCollection, 'SECTION_Order');
      
      // 3. Préparer les nouvelles données
      const newSectionData = {
        ...sectionData,
        SECTION_Name: generateDuplicateName(sectionData.SECTION_Name),
        SECTION_Order: newOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Supprimer l'ID original et les champs UI
      delete (newSectionData as any).id;
      delete (newSectionData as any).isExpanded;
      delete (newSectionData as any).isSelected;
      
      // 4. Créer la nouvelle section
      const docRef = await addDoc(sectionsCollection, newSectionData);
      const newSectionId = docRef.id;
      
      console.log(`✅ Section dupliquée: ${sectionId} -> ${newSectionId}`);
      
      // 5. Dupliquer toutes les tactiques de la section ORIGINALE
      const tactiquesRef = collection(
        db,
        'clients', context.clientId,
        'campaigns', context.campaignId,
        'versions', context.versionId,
        'onglets', context.ongletId,
        'sections', sectionId, // Section ORIGINALE
        'tactiques'
      );
      
      const tactiquesSnapshot = await getDocs(tactiquesRef);
      
      for (const tactiqueDoc of tactiquesSnapshot.docs) {
        await duplicateTactique(
          context,
          sectionId, // Section source
          tactiqueDoc.id, // Tactique source
          newSectionId // Section destination (nouvelle)
        );
      }
      
      return newSectionId;
    } catch (error) {
      console.error(`❌ Erreur duplication section ${sectionId}:`, error);
      throw error;
    }
  }
  
  // ==================== FONCTION PRINCIPALE ====================
  
  /**
   * Duplique une liste d'éléments sélectionnés
   */
  export async function duplicateSelectedItems(
    context: DuplicationContext,
    selectedItemIds: string[],
    itemHierarchy: {
      sections: Section[];
      tactiques: { [sectionId: string]: Tactique[] };
      placements: { [tactiqueId: string]: Placement[] };
      creatifs: { [placementId: string]: Creatif[] };
    }
  ): Promise<DuplicationResult> {
    const result: DuplicationResult = {
      success: true,
      duplicatedIds: [],
      errors: []
    };
    
    console.log('🔄 Début duplication de', selectedItemIds.length, 'éléments');
    
    try {
      // Trier les éléments par type et hiérarchie pour éviter les doublons
      const itemsToProcess = new Set<string>();
      const processedParents = new Set<string>();
      
      for (const itemId of selectedItemIds) {
        let itemType: 'section' | 'tactique' | 'placement' | 'creatif' | null = null;
        let parentIds: string[] = [];
        
        // Identifier le type et les parents de l'élément
        for (const section of itemHierarchy.sections) {
          if (section.id === itemId) {
            itemType = 'section';
            break;
          }
          
          const sectionTactiques = itemHierarchy.tactiques[section.id] || [];
          for (const tactique of sectionTactiques) {
            if (tactique.id === itemId) {
              itemType = 'tactique';
              parentIds = [section.id];
              break;
            }
            
            const tactiquePlacements = itemHierarchy.placements[tactique.id] || [];
            for (const placement of tactiquePlacements) {
              if (placement.id === itemId) {
                itemType = 'placement';
                parentIds = [section.id, tactique.id];
                break;
              }
              
              const placementCreatifs = itemHierarchy.creatifs[placement.id] || [];
              for (const creatif of placementCreatifs) {
                if (creatif.id === itemId) {
                  itemType = 'creatif';
                  parentIds = [section.id, tactique.id, placement.id];
                  break;
                }
              }
            }
          }
        }
        
        // Vérifier si un parent n'est pas déjà sélectionné
        const hasSelectedParent = parentIds.some(parentId => processedParents.has(parentId));
        
        if (!hasSelectedParent && itemType) {
          itemsToProcess.add(itemId);
          processedParents.add(itemId);
        }
      }
      
      // Dupliquer chaque élément
      for (const itemId of Array.from(itemsToProcess)) {
        try {
          let newId: string | null = null;
          
          // Identifier le type et dupliquer
          for (const section of itemHierarchy.sections) {
            if (section.id === itemId) {
              newId = await duplicateSection(context, itemId);
              break;
            }
            
            const sectionTactiques = itemHierarchy.tactiques[section.id] || [];
            for (const tactique of sectionTactiques) {
              if (tactique.id === itemId) {
                newId = await duplicateTactique(context, section.id, itemId, section.id);
                break;
              }
              
              const tactiquePlacements = itemHierarchy.placements[tactique.id] || [];
              for (const placement of tactiquePlacements) {
                if (placement.id === itemId) {
                  newId = await duplicatePlacement(context, section.id, tactique.id, itemId, section.id, tactique.id);
                  break;
                }
                
                const placementCreatifs = itemHierarchy.creatifs[placement.id] || [];
                for (const creatif of placementCreatifs) {
                  if (creatif.id === itemId) {
                    newId = await duplicateCreatif(context, section.id, tactique.id, placement.id, itemId, section.id, tactique.id, placement.id);
                    break;
                  }
                }
              }
            }
          }
          
          if (newId) {
            result.duplicatedIds.push(newId);
            console.log(`✅ Élément ${itemId} dupliqué avec succès -> ${newId}`);
          } else {
            result.errors.push(`Élément ${itemId} non trouvé dans la hiérarchie`);
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          result.errors.push(`Erreur duplication ${itemId}: ${errorMessage}`);
          result.success = false;
        }
      }
      
      console.log(`🏁 Duplication terminée: ${result.duplicatedIds.length} succès, ${result.errors.length} erreurs`);
      
    } catch (error) {
      console.error('❌ Erreur générale duplication:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    }
    
    return result;
  }