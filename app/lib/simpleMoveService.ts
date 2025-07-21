// app/lib/simpleMoveService.ts - Service de déplacement simplifié CORRIGÉ

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
  import { Section, Tactique, Placement, Creatif } from '../types/tactiques';
  
  // ==================== TYPES SIMPLIFIÉS ====================
  
  export interface MoveDestination {
    campaignId: string;
    campaignName: string;
    versionId: string;
    versionName: string;
    ongletId: string;
    ongletName: string;
    sectionId?: string;     // Pour tactiques, placements, créatifs
    sectionName?: string;
    tactiqueId?: string;    // Pour placements, créatifs
    tactiqueName?: string;
    placementId?: string;   // Pour créatifs
    placementName?: string;
  }
  
  // 🔥 NOUVEAU: Structure pour un élément avec son contexte
  export interface ItemWithContext {
    itemId: string;
    itemType: 'section' | 'tactique' | 'placement' | 'creatif';
    // IDs des parents pour construire le chemin source
    parentIds: {
      campaignId: string;
      versionId: string;
      ongletId: string;
      sectionId?: string;
      tactiqueId?: string;
      placementId?: string;
    };
  }
  
  export interface MoveOperation {
    clientId: string;
    itemType: 'section' | 'tactique' | 'placement' | 'creatif';
    selectedItemIds: string[];
    destination: MoveDestination;
    // 🔥 NOUVEAU: Contexte enrichi avec les informations hiérarchiques
    sourceContext: {
      campaignId: string;
      versionId: string;
      ongletId: string;
    };
    // 🔥 NOUVEAU: Mapping des éléments avec leur contexte hiérarchique
    itemsWithContext?: ItemWithContext[];
  }
  
  export interface MoveResult {
    success: boolean;
    movedCount: number;
    skippedCount: number;
    errors: string[];
    warnings: string[];
  }
  
  // ==================== DONNÉES POUR LE MODAL ====================
  
  export interface CascadeItem {
    id: string;
    name: string;
    description?: string;
  }
  
  // ==================== CHARGEMENT DES DONNÉES POUR LE MODAL ====================
  
  export async function loadCampaigns(clientId: string): Promise<CascadeItem[]> {
    try {
      console.log('🔄 Chargement des campagnes pour client:', clientId);
      
      const campaignsRef = collection(db, 'clients', clientId, 'campaigns');
      const q = query(campaignsRef, orderBy('CA_Name', 'asc'));
      const snapshot = await getDocs(q);
      
      const campaigns = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.CA_Name || 'Campagne sans nom',
          description: `${data.CA_Status || 'Statut inconnu'} • Budget: ${data.CA_Budget || 0}€`
        };
      });
      
      console.log(`✅ ${campaigns.length} campagnes chargées`);
      return campaigns;
      
    } catch (error) {
      console.error('❌ Erreur chargement campagnes:', error);
      throw error;
    }
  }
  
  export async function loadVersions(clientId: string, campaignId: string): Promise<CascadeItem[]> {
    try {
      console.log('🔄 Chargement des versions pour campagne:', campaignId);
      
      const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions');
      const q = query(versionsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      const versions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Version sans nom',
          description: data.isOfficial ? '✓ Version officielle' : '📝 Brouillon'
        };
      });
      
      console.log(`✅ ${versions.length} versions chargées`);
      return versions;
      
    } catch (error) {
      console.error('❌ Erreur chargement versions:', error);
      throw error;
    }
  }
  
  export async function loadOnglets(
    clientId: string, 
    campaignId: string, 
    versionId: string
  ): Promise<CascadeItem[]> {
    try {
      console.log('🔄 Chargement des onglets pour version:', versionId);
      
      const ongletsRef = collection(
        db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets'
      );
      const q = query(ongletsRef, orderBy('ONGLET_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      const onglets = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.ONGLET_Name || 'Onglet sans nom',
          description: `Ordre: ${data.ONGLET_Order || 0}`
        };
      });
      
      console.log(`✅ ${onglets.length} onglets chargés`);
      return onglets;
      
    } catch (error) {
      console.error('❌ Erreur chargement onglets:', error);
      throw error;
    }
  }
  
  export async function loadSections(
    clientId: string, 
    campaignId: string, 
    versionId: string, 
    ongletId: string
  ): Promise<CascadeItem[]> {
    try {
      console.log('🔄 Chargement des sections pour onglet:', ongletId);
      
      const sectionsRef = collection(
        db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId,
        'onglets', ongletId, 'sections'
      );
      const q = query(sectionsRef, orderBy('SECTION_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      const sections = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.SECTION_Name || 'Section sans nom',
          description: `Budget: ${data.SECTION_Budget || 0}€`
        };
      });
      
      console.log(`✅ ${sections.length} sections chargées`);
      return sections;
      
    } catch (error) {
      console.error('❌ Erreur chargement sections:', error);
      throw error;
    }
  }
  
  export async function loadTactiques(
    clientId: string, 
    campaignId: string, 
    versionId: string, 
    ongletId: string, 
    sectionId: string
  ): Promise<CascadeItem[]> {
    try {
      console.log('🔄 Chargement des tactiques pour section:', sectionId);
      
      const tactiquesRef = collection(
        db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId,
        'onglets', ongletId, 'sections', sectionId, 'tactiques'
      );
      const q = query(tactiquesRef, orderBy('TC_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      const tactiques = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.TC_Label || 'Tactique sans nom',
          description: `Budget: ${data.TC_Budget || 0}€`
        };
      });
      
      console.log(`✅ ${tactiques.length} tactiques chargées`);
      return tactiques;
      
    } catch (error) {
      console.error('❌ Erreur chargement tactiques:', error);
      throw error;
    }
  }
  
  export async function loadPlacements(
    clientId: string, 
    campaignId: string, 
    versionId: string, 
    ongletId: string, 
    sectionId: string, 
    tactiqueId: string
  ): Promise<CascadeItem[]> {
    try {
      console.log('🔄 Chargement des placements pour tactique:', tactiqueId);
      
      const placementsRef = collection(
        db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId,
        'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements'
      );
      const q = query(placementsRef, orderBy('PL_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      const placements = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.PL_Label || 'Placement sans nom',
          description: `Ordre: ${data.PL_Order || 0}`
        };
      });
      
      console.log(`✅ ${placements.length} placements chargés`);
      return placements;
      
    } catch (error) {
      console.error('❌ Erreur chargement placements:', error);
      throw error;
    }
  }
  
  // ==================== 🔥 FONCTION POUR CONSTRUIRE LE CONTEXTE DES ÉLÉMENTS ====================
  
  export async function buildItemsContext(
    clientId: string,
    selectedItemIds: string[],
    sourceContext: { campaignId: string; versionId: string; ongletId: string },
    hierarchyData: {
      sections: any[];
      tactiques: { [sectionId: string]: any[] };
      placements: { [tactiqueId: string]: any[] };
      creatifs: { [placementId: string]: any[] };
    }
  ): Promise<ItemWithContext[]> {
    const itemsWithContext: ItemWithContext[] = [];
    
    console.log('🔍 Construction du contexte pour', selectedItemIds.length, 'éléments');
    
    for (const itemId of selectedItemIds) {
      let found = false;
      
      // Rechercher l'élément dans la hiérarchie
      for (const section of hierarchyData.sections) {
        // Vérifier si c'est une section
        if (section.id === itemId) {
          itemsWithContext.push({
            itemId,
            itemType: 'section',
            parentIds: {
              campaignId: sourceContext.campaignId,
              versionId: sourceContext.versionId,
              ongletId: sourceContext.ongletId
            }
          });
          found = true;
          break;
        }
        
        // Rechercher dans les tactiques de cette section
        const sectionTactiques = hierarchyData.tactiques[section.id] || [];
        for (const tactique of sectionTactiques) {
          if (tactique.id === itemId) {
            itemsWithContext.push({
              itemId,
              itemType: 'tactique',
              parentIds: {
                campaignId: sourceContext.campaignId,
                versionId: sourceContext.versionId,
                ongletId: sourceContext.ongletId,
                sectionId: section.id
              }
            });
            found = true;
            break;
          }
          
          // Rechercher dans les placements de cette tactique
          const tactiquePlacements = hierarchyData.placements[tactique.id] || [];
          for (const placement of tactiquePlacements) {
            if (placement.id === itemId) {
              itemsWithContext.push({
                itemId,
                itemType: 'placement',
                parentIds: {
                  campaignId: sourceContext.campaignId,
                  versionId: sourceContext.versionId,
                  ongletId: sourceContext.ongletId,
                  sectionId: section.id,
                  tactiqueId: tactique.id
                }
              });
              found = true;
              break;
            }
            
            // Rechercher dans les créatifs de ce placement
            const placementCreatifs = hierarchyData.creatifs[placement.id] || [];
            for (const creatif of placementCreatifs) {
              if (creatif.id === itemId) {
                itemsWithContext.push({
                  itemId,
                  itemType: 'creatif',
                  parentIds: {
                    campaignId: sourceContext.campaignId,
                    versionId: sourceContext.versionId,
                    ongletId: sourceContext.ongletId,
                    sectionId: section.id,
                    tactiqueId: tactique.id,
                    placementId: placement.id
                  }
                });
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (found) break;
        }
        if (found) break;
      }
      
      if (!found) {
        console.warn(`⚠️ Élément ${itemId} non trouvé dans la hiérarchie`);
      }
    }
    
    console.log('✅ Contexte construit pour', itemsWithContext.length, 'éléments');
    return itemsWithContext;
  }
  
  // ==================== CALCUL DU PROCHAIN ORDRE ====================
  
  async function getNextOrder(
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
    
    return snapshot.empty ? 0 : (snapshot.docs[0].data()[orderField] || 0) + 1;
  }
  
  // ==================== 🔥 DÉPLACEMENT PRINCIPAL CORRIGÉ ====================
  
  export async function performMove(operation: MoveOperation): Promise<MoveResult> {
    console.log('🚀 Début de l\'opération de déplacement simple CORRIGÉE');
    console.log('📦 Opération:', operation);
  
    const { clientId, itemType, destination, itemsWithContext } = operation;
    
    if (!itemsWithContext || itemsWithContext.length === 0) {
      return {
        success: false,
        movedCount: 0,
        skippedCount: operation.selectedItemIds.length,
        errors: ['Contexte des éléments manquant - impossible de construire les chemins source'],
        warnings: []
      };
    }
  
    let movedCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];
  
    try {
      // Calculer l'ordre de départ
      let nextOrder = await getNextOrder(clientId, destination, itemType);
      
      // Exécuter dans une transaction
      await runTransaction(db, async (transaction) => {
        for (const itemWithContext of itemsWithContext) {
          try {
            // 🔥 CORRECTION: Construire le chemin source avec les vrais IDs
            const sourcePath = buildCorrectSourcePath(clientId, itemWithContext);
            const sourceRef = doc(db, ...sourcePath);
            
            // Construire le chemin destination  
            const destPath = buildDestinationPath(itemType, clientId, destination);
            const destCollectionRef = collection(db, ...destPath);
            const destRef = doc(destCollectionRef);
            
            console.log('📍 Chemins:', {
              source: sourcePath.join('/'),
              destination: destPath.join('/') + '/' + destRef.id
            });
            
            // Lire l'élément source
            const sourceSnap = await transaction.get(sourceRef);
            if (!sourceSnap.exists()) {
              errors.push(`Élément ${itemWithContext.itemId} non trouvé à la source : ${sourcePath.join('/')}`);
              continue;
            }
            
            // Préparer les nouvelles données
            const sourceData = sourceSnap.data();
            const newData = {
              ...sourceData,
              [`${getOrderField(itemType)}`]: nextOrder,
              updatedAt: new Date().toISOString()
            };
            
            // Ajouter les références parentes selon le type
            switch (itemType) {
              case 'tactique':
                newData.TC_SectionId = destination.sectionId;
                break;
              case 'placement':
                newData.PL_TactiqueId = destination.tactiqueId;
                newData.PL_SectionId = destination.sectionId;
                break;
              case 'creatif':
                newData.CR_PlacementId = destination.placementId;
                newData.CR_TactiqueId = destination.tactiqueId;
                newData.CR_SectionId = destination.sectionId;
                break;
            }
            
            // Créer à la destination et supprimer la source
            transaction.set(destRef, newData);
            transaction.delete(sourceRef);
            
            nextOrder++;
            movedCount++;
            
            console.log(`✅ Élément ${itemWithContext.itemId} déplacé avec succès`);
            
          } catch (itemError) {
            console.error(`❌ Erreur déplacement ${itemWithContext.itemId}:`, itemError);
            errors.push(`Erreur déplacement ${itemWithContext.itemId}: ${itemError}`);
          }
        }
      });
  
      const success = errors.length === 0;
      const skippedCount = itemsWithContext.length - movedCount;
  
      console.log(`${success ? '✅' : '⚠️'} Opération terminée:`, {
        success,
        movedCount,
        skippedCount,
        errorsCount: errors.length
      });
  
      return {
        success,
        movedCount,
        skippedCount,
        errors,
        warnings
      };
  
    } catch (error) {
      console.error('💥 Erreur fatale lors du déplacement:', error);
      return {
        success: false,
        movedCount,
        skippedCount: itemsWithContext.length - movedCount,
        errors: [`Erreur fatale: ${error}`],
        warnings
      };
    }
  }
  
  // ==================== 🔥 FONCTIONS UTILITAIRES CORRIGÉES ====================
  
  function buildCorrectSourcePath(clientId: string, itemWithContext: ItemWithContext): string[] {
    const { itemId, itemType, parentIds } = itemWithContext;
    const { campaignId, versionId, ongletId, sectionId, tactiqueId, placementId } = parentIds;
    
    const basePath = [
      'clients', clientId, 'campaigns', campaignId,
      'versions', versionId, 'onglets', ongletId
    ];
    
    switch (itemType) {
      case 'section':
        return [...basePath, 'sections', itemId];
      case 'tactique':
        if (!sectionId) throw new Error(`Section ID manquant pour tactique ${itemId}`);
        return [...basePath, 'sections', sectionId, 'tactiques', itemId];
      case 'placement':
        if (!sectionId || !tactiqueId) throw new Error(`Section ID ou Tactique ID manquant pour placement ${itemId}`);
        return [...basePath, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', itemId];
      case 'creatif':
        if (!sectionId || !tactiqueId || !placementId) throw new Error(`IDs parents manquants pour créatif ${itemId}`);
        return [...basePath, 'sections', sectionId, 'tactiques', tactiqueId, 'placements', placementId, 'creatifs', itemId];
      default:
        throw new Error(`Type d'élément non supporté: ${itemType}`);
    }
  }
  
  function buildDestinationPath(
    itemType: 'section' | 'tactique' | 'placement' | 'creatif',
    clientId: string,
    destination: MoveDestination
  ): string[] {
    const basePath = [
      'clients', clientId, 'campaigns', destination.campaignId,
      'versions', destination.versionId, 'onglets', destination.ongletId
    ];
    
    switch (itemType) {
      case 'section':
        return [...basePath, 'sections'];
      case 'tactique':
        return [...basePath, 'sections', destination.sectionId!, 'tactiques'];
      case 'placement':
        return [...basePath, 'sections', destination.sectionId!, 'tactiques', destination.tactiqueId!, 'placements'];
      case 'creatif':
        return [...basePath, 'sections', destination.sectionId!, 'tactiques', destination.tactiqueId!, 'placements', destination.placementId!, 'creatifs'];
      default:
        throw new Error(`Type d'élément non supporté: ${itemType}`);
    }
  }
  
  function getOrderField(itemType: 'section' | 'tactique' | 'placement' | 'creatif'): string {
    switch (itemType) {
      case 'section': return 'SECTION_Order';
      case 'tactique': return 'TC_Order';
      case 'placement': return 'PL_Order';
      case 'creatif': return 'CR_Order';
    }
  }