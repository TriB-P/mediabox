// app/lib/simpleMoveService.ts - Service de déplacement simplifié

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
  
  export interface MoveOperation {
    clientId: string;
    itemType: 'section' | 'tactique' | 'placement' | 'creatif';
    selectedItemIds: string[];
    destination: MoveDestination;
    // Context source pour construire les chemins
    sourceContext: {
      campaignId: string;
      versionId: string;
      ongletId: string;
    };
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
  
  // ==================== DÉPLACEMENT PRINCIPAL ====================
  
  export async function performMove(operation: MoveOperation): Promise<MoveResult> {
    console.log('🚀 Début de l\'opération de déplacement simple');
    console.log('📦 Opération:', operation);
  
    const { clientId, itemType, selectedItemIds, destination, sourceContext } = operation;
    let movedCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];
  
    try {
      // Calculer l'ordre de départ
      let nextOrder = await getNextOrder(clientId, destination, itemType);
      
      // Exécuter dans une transaction
      await runTransaction(db, async (transaction) => {
        for (const itemId of selectedItemIds) {
          try {
            // Construire le chemin source
            const sourcePath = buildSourcePath(itemType, sourceContext, itemId);
            const sourceRef = doc(db, ...sourcePath);
            
            // Construire le chemin destination  
            const destPath = buildDestinationPath(itemType, clientId, destination);
            const destCollectionRef = collection(db, ...destPath);
            const destRef = doc(destCollectionRef);
            
            // Lire l'élément source
            const sourceSnap = await transaction.get(sourceRef);
            if (!sourceSnap.exists()) {
              errors.push(`Élément ${itemId} non trouvé à la source`);
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
            
            console.log(`✅ Élément ${itemId} déplacé avec succès`);
            
          } catch (itemError) {
            console.error(`❌ Erreur déplacement ${itemId}:`, itemError);
            errors.push(`Erreur déplacement ${itemId}: ${itemError}`);
          }
        }
      });
  
      const success = errors.length === 0;
      const skippedCount = selectedItemIds.length - movedCount;
  
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
        skippedCount: selectedItemIds.length - movedCount,
        errors: [`Erreur fatale: ${error}`],
        warnings
      };
    }
  }
  
  // ==================== FONCTIONS UTILITAIRES ====================
  
  function buildSourcePath(
    itemType: 'section' | 'tactique' | 'placement' | 'creatif',
    sourceContext: { campaignId: string; versionId: string; ongletId: string },
    itemId: string
  ): string[] {
    // Pour l'instant, on suppose que tous les éléments viennent du même contexte
    // TODO: Améliorer pour gérer les contextes mixtes
    const basePath = [
      'clients', 'CLIENT_ID', 'campaigns', sourceContext.campaignId,
      'versions', sourceContext.versionId, 'onglets', sourceContext.ongletId
    ];
    
    switch (itemType) {
      case 'section':
        return [...basePath, 'sections', itemId];
      case 'tactique':
        return [...basePath, 'sections', 'SECTION_ID', 'tactiques', itemId];
      case 'placement':
        return [...basePath, 'sections', 'SECTION_ID', 'tactiques', 'TACTIQUE_ID', 'placements', itemId];
      case 'creatif':
        return [...basePath, 'sections', 'SECTION_ID', 'tactiques', 'TACTIQUE_ID', 'placements', 'PLACEMENT_ID', 'creatifs', itemId];
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