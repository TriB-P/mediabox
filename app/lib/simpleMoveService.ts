// app/lib/simpleMoveService.ts - Service de déplacement CORRIGÉ pour gérer parent-enfant

import {
  collection,
  doc,
  getDocs,
  getDoc,
  runTransaction,
  query,
  orderBy,
  DocumentReference,
  CollectionReference,
  DocumentData
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

// 🔥 STRUCTURE POUR UN ÉLÉMENT AVEC SON CONTEXTE
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
  // 🔥 CONTEXTE ENRICHI AVEC LES INFORMATIONS HIÉRARCHIQUES
  sourceContext: {
    campaignId: string;
    versionId: string;
    ongletId: string;
  };
  // 🔥 MAPPING DES ÉLÉMENTS AVEC LEUR CONTEXTE HIÉRARCHIQUE
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

// ==================== 🔧 HELPERS FIRESTORE SIMPLIFIÉS ====================

/**
 * Construit une référence de document de manière simple et robuste
 */
function getDocumentRef(path: string[]): DocumentReference<DocumentData> {
  if (path.length < 2 || path.length % 2 !== 0) {
    throw new Error(`Chemin de document invalide: ${path.join('/')} (doit avoir un nombre pair de segments)`);
  }
  
  // Construction pas à pas pour éviter les erreurs de spread
  let currentRef: any = db;
  
  for (let i = 0; i < path.length; i += 2) {
    currentRef = collection(currentRef, path[i]);
    if (i + 1 < path.length) {
      currentRef = doc(currentRef, path[i + 1]);
    }
  }
  
  return currentRef as DocumentReference<DocumentData>;
}

/**
 * Construit une référence de collection de manière simple et robuste
 */
function getCollectionRef(path: string[]): CollectionReference<DocumentData> {
  if (path.length === 0 || path.length % 2 === 0) {
    throw new Error(`Chemin de collection invalide: ${path.join('/')} (doit avoir un nombre impair de segments)`);
  }
  
  // Construction pas à pas pour éviter les erreurs de spread
  let currentRef: any = db;
  
  for (let i = 0; i < path.length - 1; i += 2) {
    currentRef = collection(currentRef, path[i]);
    currentRef = doc(currentRef, path[i + 1]);
  }
  
  // Ajouter la dernière collection
  currentRef = collection(currentRef, path[path.length - 1]);
  
  return currentRef as CollectionReference<DocumentData>;
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

// ==================== 🔧 CALCUL DU PROCHAIN ORDRE PAR TYPE ====================

async function getNextOrder(
  clientId: string,
  destination: MoveDestination,
  itemType: 'section' | 'tactique' | 'placement' | 'creatif'
): Promise<number> {
  let collectionRef: CollectionReference;
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

// ==================== 🔧 FONCTIONS UTILITAIRES CORRIGÉES ====================

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
    default: throw new Error(`Type d'élément non supporté: ${itemType}`);
  }
}

function buildParentReferences(
  itemType: 'section' | 'tactique' | 'placement' | 'creatif',
  destination: MoveDestination
): Record<string, any> {
  const refs: Record<string, any> = {};
  
  switch (itemType) {
    case 'section':
      // Les sections n'ont pas de références parentes additionnelles
      break;
    case 'tactique':
      refs.TC_SectionId = destination.sectionId;
      break;
    case 'placement':
      refs.PL_TactiqueId = destination.tactiqueId;
      refs.PL_SectionId = destination.sectionId;
      break;
    case 'creatif':
      refs.CR_PlacementId = destination.placementId;
      refs.CR_TactiqueId = destination.tactiqueId;
      refs.CR_SectionId = destination.sectionId;
      break;
  }
  
  return refs;
}

// ==================== 🔥 DÉPLACEMENT PRINCIPAL RESPECTANT LES RÈGLES FIRESTORE ====================

export async function performMove(operation: MoveOperation): Promise<MoveResult> {
  console.log('🚀 Début de l\'opération de déplacement FIRESTORE-COMPLIANT');
  console.log('📦 Opération:', operation);

  const { clientId, destination, itemsWithContext } = operation;
  
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
    // 🔥 ÉTAPE 1: PRÉPARATION HORS TRANSACTION
    console.log('📋 Phase préparatoire hors transaction...');
    
    // Trier par ordre hiérarchique
    const hierarchyOrder = ['section', 'tactique', 'placement', 'creatif'];
    const sortedItems = itemsWithContext.sort((a, b) => {
      return hierarchyOrder.indexOf(a.itemType) - hierarchyOrder.indexOf(b.itemType);
    });

    console.log('📊 Éléments triés par hiérarchie:', sortedItems.map(item => `${item.itemType}:${item.itemId}`));

    // Map pour stocker les nouveaux IDs (ancien ID → nouveau ID)
    const newIdMapping = new Map<string, string>();
    
    // 🔥 ÉTAPE 2: PRÉ-GÉNÉRER TOUS LES IDs ET RÉFÉRENCES
    const preparedItems = [];
    
    for (const itemWithContext of sortedItems) {
      // Construire la destination enrichie avec les IDs déjà générés
      const enhancedDestination = buildEnhancedDestination(
        destination, 
        itemWithContext, 
        newIdMapping
      );
      
      // Construire les chemins
      const sourcePath = buildCorrectSourcePath(clientId, itemWithContext);
      const destPath = buildDestinationPath(itemWithContext.itemType, clientId, enhancedDestination);
      
      // Construire les références
      const sourceRef = getDocumentRef(sourcePath);
      const destCollectionRef = getCollectionRef(destPath);
      const destRef = doc(destCollectionRef); // Auto-génère un nouvel ID
      
      console.log('📍 Élément préparé:', {
        itemId: itemWithContext.itemId,
        itemType: itemWithContext.itemType,
        newId: destRef.id,
        source: sourcePath.join('/'),
        destination: destPath.join('/') + '/' + destRef.id
      });
      
      // 🔥 IMPORTANT: Stocker le mapping MAINTENANT
      newIdMapping.set(itemWithContext.itemId, destRef.id);
      
      preparedItems.push({
        itemWithContext,
        sourceRef,
        destRef,
        enhancedDestination,
        sourcePath,
        destPath
      });
    }

    // 🔥 ÉTAPE 3: CALCULER TOUS LES ORDRES HORS TRANSACTION
    console.log('📊 Calcul des ordres hors transaction...');
    const ordersByType = new Map<string, number>();
    
    for (const preparedItem of preparedItems) {
      const { itemWithContext, enhancedDestination } = preparedItem;
      
      if (!ordersByType.has(itemWithContext.itemType)) {
        const nextOrder = await getNextOrder(clientId, enhancedDestination, itemWithContext.itemType);
        ordersByType.set(itemWithContext.itemType, nextOrder);
        console.log(`📋 Type ${itemWithContext.itemType}: ordre de départ = ${nextOrder}`);
      }
    }

    // 🔥 ÉTAPE 4: TRANSACTION AVEC LECTURE → ÉCRITURE STRICTE
    await runTransaction(db, async (transaction) => {
      console.log('🔄 Transaction Firestore : LECTURE → ÉCRITURE');
      
      // 📖 PHASE 1: TOUTES LES LECTURES
      console.log('📖 Phase 1: Lectures de tous les éléments...');
      const readResults = [];
      
      for (const preparedItem of preparedItems) {
        const { itemWithContext, sourceRef } = preparedItem;
        
        try {
          const sourceSnap = await transaction.get(sourceRef);
          
          if (!sourceSnap.exists()) {
            readResults.push({
              preparedItem,
              sourceData: null,
              error: `Élément ${itemWithContext.itemId} non trouvé à la source`
            });
          } else {
            readResults.push({
              preparedItem,
              sourceData: sourceSnap.data(),
              error: null
            });
          }
          
          console.log(`📖 Lecture ${itemWithContext.itemId} (${itemWithContext.itemType}): ${sourceSnap.exists() ? 'OK' : 'NOT_FOUND'}`);
          
        } catch (readError) {
          console.error(`❌ Erreur lecture ${itemWithContext.itemId}:`, readError);
          readResults.push({
            preparedItem,
            sourceData: null,
            error: `Erreur lecture: ${readError}`
          });
        }
      }
      
      console.log(`📖 Phase 1 terminée: ${readResults.length} lectures effectuées`);
      
      // ✍️ PHASE 2: TOUTES LES ÉCRITURES
      console.log('✍️ Phase 2: Écritures de tous les éléments...');
      
      for (const readResult of readResults) {
        const { preparedItem, sourceData, error } = readResult;
        
        if (error) {
          errors.push(error);
          continue;
        }
        
        if (!sourceData) {
          errors.push(`Données source manquantes pour ${preparedItem.itemWithContext.itemId}`);
          continue;
        }
        
        try {
          const { itemWithContext, sourceRef, destRef, enhancedDestination } = preparedItem;
          
          // Préparer les nouvelles données
          const currentOrder = ordersByType.get(itemWithContext.itemType)!;
          const orderField = getOrderField(itemWithContext.itemType);
          const parentRefs = buildParentReferences(itemWithContext.itemType, enhancedDestination);
          
          const newData = {
            ...sourceData,
            [orderField]: currentOrder,
            ...parentRefs,
            updatedAt: new Date().toISOString()
          };
          
          // Écriture
          transaction.set(destRef, newData);
          transaction.delete(sourceRef);
          
          // Incrémenter l'ordre pour le prochain élément du même type
          ordersByType.set(itemWithContext.itemType, currentOrder + 1);
          
          movedCount++;
          console.log(`✍️ Écriture ${itemWithContext.itemId} (${itemWithContext.itemType}): OK`);
          
        } catch (writeError) {
          console.error(`❌ Erreur écriture ${preparedItem.itemWithContext.itemId}:`, writeError);
          errors.push(`Erreur écriture ${preparedItem.itemWithContext.itemId}: ${writeError}`);
        }
      }
      
      console.log(`✍️ Phase 2 terminée: ${movedCount} écritures effectuées`);
    });

    const success = errors.length === 0;
    const skippedCount = itemsWithContext.length - movedCount;

    console.log(`${success ? '✅' : '⚠️'} Opération terminée:`, {
      success,
      movedCount,
      skippedCount,
      errorsCount: errors.length,
      newIdMapping: Object.fromEntries(newIdMapping)
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

// 🔥 FONCTION CORRIGÉE: Construire une destination enrichie avec TOUTE la chaîne hiérarchique
function buildEnhancedDestination(
  baseDestination: MoveDestination,
  itemWithContext: ItemWithContext,
  newIdMapping: Map<string, string>
): MoveDestination {
  const enhanced = { ...baseDestination };
  
  console.log(`🔗 Construction destination enrichie pour ${itemWithContext.itemType}:${itemWithContext.itemId}`);
  
  // 🔥 CORRECTION: Mettre à jour TOUTE la chaîne hiérarchique, pas seulement le parent direct
  
  // Mettre à jour sectionId si elle a été déplacée
  if (itemWithContext.parentIds.sectionId) {
    const newSectionId = newIdMapping.get(itemWithContext.parentIds.sectionId);
    if (newSectionId) {
      enhanced.sectionId = newSectionId;
      console.log(`  🔗 Section parent: ${itemWithContext.parentIds.sectionId} → ${newSectionId}`);
    }
  }
  
  // Mettre à jour tactiqueId si elle a été déplacée  
  if (itemWithContext.parentIds.tactiqueId) {
    const newTactiqueId = newIdMapping.get(itemWithContext.parentIds.tactiqueId);
    if (newTactiqueId) {
      enhanced.tactiqueId = newTactiqueId;
      console.log(`  🔗 Tactique parent: ${itemWithContext.parentIds.tactiqueId} → ${newTactiqueId}`);
    }
  }
  
  // Mettre à jour placementId si il a été déplacé
  if (itemWithContext.parentIds.placementId) {
    const newPlacementId = newIdMapping.get(itemWithContext.parentIds.placementId);
    if (newPlacementId) {
      enhanced.placementId = newPlacementId;
      console.log(`  🔗 Placement parent: ${itemWithContext.parentIds.placementId} → ${newPlacementId}`);
    }
  }
  
  // 🔥 VALIDATION: Vérifier que tous les IDs requis sont présents
  switch (itemWithContext.itemType) {
    case 'section':
      // Les sections ne nécessitent que campaign/version/onglet (déjà dans baseDestination)
      break;
      
    case 'tactique':
      if (!enhanced.sectionId) {
        console.warn(`⚠️ Tactique ${itemWithContext.itemId}: sectionId manquant!`);
      }
      break;
      
    case 'placement':
      if (!enhanced.sectionId || !enhanced.tactiqueId) {
        console.warn(`⚠️ Placement ${itemWithContext.itemId}: sectionId=${enhanced.sectionId}, tactiqueId=${enhanced.tactiqueId}`);
      }
      break;
      
    case 'creatif':
      if (!enhanced.sectionId || !enhanced.tactiqueId || !enhanced.placementId) {
        console.warn(`⚠️ Créatif ${itemWithContext.itemId}: sectionId=${enhanced.sectionId}, tactiqueId=${enhanced.tactiqueId}, placementId=${enhanced.placementId}`);
      }
      break;
  }
  
  console.log(`  ✅ Destination enrichie:`, {
    sectionId: enhanced.sectionId,
    tactiqueId: enhanced.tactiqueId, 
    placementId: enhanced.placementId
  });
  
  return enhanced;
}