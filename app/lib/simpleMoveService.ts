/**
 * Ce fichier est un service de déplacement conçu pour gérer le mouvement d'éléments
 * hiérarchiques (sections, tactiques, placements, créatifs) au sein de votre base de données Firebase.
 * Il permet de déplacer des éléments d'un endroit à un autre en respectant la structure
 * parent-enfant et en gérant les références ainsi que l'ordre des éléments.
 * Le service assure que toutes les opérations de lecture et d'écriture Firebase
 * sont tracées et exécutées de manière atomique via des transactions.
 */
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

export interface MoveDestination {
  campaignId: string;
  campaignName: string;
  versionId: string;
  versionName: string;
  ongletId: string;
  ongletName: string;
  sectionId?: string;
  sectionName?: string;
  tactiqueId?: string;
  tactiqueName?: string;
  placementId?: string;
  placementName?: string;
}

export interface ItemWithContext {
  itemId: string;
  itemType: 'section' | 'tactique' | 'placement' | 'creatif';
  parentIds: {
    campaignId: string;
    versionId: string;
    ongletId: string;
    sectionId?: string;
    tactiqueId?: string;
    placementId?: string;
  };
}

export interface PreparedItem {
  itemWithContext: ItemWithContext;
  sourceRef: DocumentReference<DocumentData>;
  destRef: DocumentReference<DocumentData>;
  enhancedDestination: MoveDestination;
  sourcePath: string[];
  destPath: string[];
}

export interface ReadResult {
  preparedItem: PreparedItem;
  sourceData: DocumentData | null;
  error: string | null;
}

export interface MoveOperation {
  clientId: string;
  itemType: 'section' | 'tactique' | 'placement' | 'creatif';
  selectedItemIds: string[];
  destination: MoveDestination;
  sourceContext: {
    campaignId: string;
    versionId: string;
    ongletId: string;
  };
  itemsWithContext?: ItemWithContext[];
}

export interface MoveResult {
  success: boolean;
  movedCount: number;
  skippedCount: number;
  errors: string[];
  warnings: string[];
}

export interface CascadeItem {
  id: string;
  name: string;
  description?: string;
}

/**
 * Construit une référence de document Firebase à partir d'un tableau de segments de chemin.
 * @param path - Un tableau de chaînes de caractères représentant les segments du chemin du document (ex: ['collection', 'docId', 'subCollection', 'subDocId']).
 * @returns Une référence de document Firebase.
 * @throws {Error} Si le chemin est invalide (doit avoir un nombre pair de segments).
 */
function getDocumentRef(path: string[]): DocumentReference<DocumentData> {
  if (path.length < 2 || path.length % 2 !== 0) {
    throw new Error(`Chemin de document invalide: ${path.join('/')} (doit avoir un nombre pair de segments)`);
  }

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
 * Construit une référence de collection Firebase à partir d'un tableau de segments de chemin.
 * @param path - Un tableau de chaînes de caractères représentant les segments du chemin de la collection (ex: ['collection', 'docId', 'subCollection']).
 * @returns Une référence de collection Firebase.
 * @throws {Error} Si le chemin est invalide (doit avoir un nombre impair de segments).
 */
function getCollectionRef(path: string[]): CollectionReference<DocumentData> {
  if (path.length === 0 || path.length % 2 === 0) {
    throw new Error(`Chemin de collection invalide: ${path.join('/')} (doit avoir un nombre impair de segments)`);
  }

  let currentRef: any = db;

  for (let i = 0; i < path.length - 1; i += 2) {
    currentRef = collection(currentRef, path[i]);
    currentRef = doc(currentRef, path[i + 1]);
  }

  currentRef = collection(currentRef, path[path.length - 1]);

  return currentRef as CollectionReference<DocumentData>;
}

/**
 * Charge la liste des campagnes associées à un client donné.
 * Les campagnes sont triées par nom.
 * @param clientId - L'ID du client.
 * @returns Une promesse résolue avec un tableau d'objets CascadeItem représentant les campagnes.
 * @throws {Error} Si une erreur survient lors du chargement des campagnes.
 */
export async function loadCampaigns(clientId: string): Promise<CascadeItem[]> {
  try {
    const campaignsRef = collection(db, 'clients', clientId, 'campaigns');
    const q = query(campaignsRef, orderBy('CA_Name', 'asc'));
    console.log("FIREBASE: LECTURE - Fichier: simpleMoveService.ts - Fonction: loadCampaigns - Path: clients/${clientId}/campaigns");
    const snapshot = await getDocs(q);

    const campaigns = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.CA_Name || 'Campagne sans nom',
      };
    });

    return campaigns;

  } catch (error) {
    console.error('❌ Erreur chargement campagnes:', error);
    throw error;
  }
}

/**
 * Charge la liste des versions pour une campagne spécifique.
 * Les versions sont triées par nom.
 * @param clientId - L'ID du client.
 * @param campaignId - L'ID de la campagne.
 * @returns Une promesse résolue avec un tableau d'objets CascadeItem représentant les versions.
 * @throws {Error} Si une erreur survient lors du chargement des versions.
 */
export async function loadVersions(clientId: string, campaignId: string): Promise<CascadeItem[]> {
  try {
    const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions');
    const q = query(versionsRef, orderBy('name', 'asc'));
    console.log("FIREBASE: LECTURE - Fichier: simpleMoveService.ts - Fonction: loadVersions - Path: clients/${clientId}/campaigns/${campaignId}/versions");
    const snapshot = await getDocs(q);

    const versions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Version sans nom',
        description: data.isOfficial ? '✓ Version officielle' : '📝 Version alternative'
      };
    });

    return versions;

  } catch (error) {
    console.error('❌ Erreur chargement versions:', error);
    throw error;
  }
}

/**
 * Charge la liste des onglets pour une version spécifique d'une campagne.
 * Les onglets sont triés par ordre.
 * @param clientId - L'ID du client.
 * @param campaignId - L'ID de la campagne.
 * @param versionId - L'ID de la version.
 * @returns Une promesse résolue avec un tableau d'objets CascadeItem représentant les onglets.
 * @throws {Error} Si une erreur survient lors du chargement des onglets.
 */
export async function loadOnglets(
  clientId: string,
  campaignId: string,
  versionId: string
): Promise<CascadeItem[]> {
  try {
    const ongletsRef = collection(
      db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets'
    );
    const q = query(ongletsRef, orderBy('ONGLET_Order', 'asc'));
    console.log("FIREBASE: LECTURE - Fichier: simpleMoveService.ts - Fonction: loadOnglets - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets");
    const snapshot = await getDocs(q);

    const onglets = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.ONGLET_Name || 'Onglet sans nom',
      };
    });

    return onglets;

  } catch (error) {
    console.error('❌ Erreur chargement onglets:', error);
    throw error;
  }
}

/**
 * Charge la liste des sections pour un onglet spécifique.
 * Les sections sont triées par ordre.
 * @param clientId - L'ID du client.
 * @param campaignId - L'ID de la campagne.
 * @param versionId - L'ID de la version.
 * @param ongletId - L'ID de l'onglet.
 * @returns Une promesse résolue avec un tableau d'objets CascadeItem représentant les sections.
 * @throws {Error} Si une erreur survient lors du chargement des sections.
 */
export async function loadSections(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string
): Promise<CascadeItem[]> {
  try {
    const sectionsRef = collection(
      db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId,
      'onglets', ongletId, 'sections'
    );
    const q = query(sectionsRef, orderBy('SECTION_Order', 'asc'));
    console.log("FIREBASE: LECTURE - Fichier: simpleMoveService.ts - Fonction: loadSections - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections");
    const snapshot = await getDocs(q);

    const sections = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.SECTION_Name || 'Section sans nom',
      };
    });

    return sections;

  } catch (error) {
    console.error('❌ Erreur chargement sections:', error);
    throw error;
  }
}

/**
 * Charge la liste des tactiques pour une section spécifique.
 * Les tactiques sont triées par ordre.
 * @param clientId - L'ID du client.
 * @param campaignId - L'ID de la campagne.
 * @param versionId - L'ID de la version.
 * @param ongletId - L'ID de l'onglet.
 * @param sectionId - L'ID de la section.
 * @returns Une promesse résolue avec un tableau d'objets CascadeItem représentant les tactiques.
 * @throws {Error} Si une erreur survient lors du chargement des tactiques.
 */
export async function loadTactiques(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string
): Promise<CascadeItem[]> {
  try {
    const tactiquesRef = collection(
      db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId,
      'onglets', ongletId, 'sections', sectionId, 'tactiques'
    );
    const q = query(tactiquesRef, orderBy('TC_Order', 'asc'));
    console.log("FIREBASE: LECTURE - Fichier: simpleMoveService.ts - Fonction: loadTactiques - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques");
    const snapshot = await getDocs(q);

    const tactiques = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.TC_Label || 'Tactique sans nom',
      };
    });

    return tactiques;

  } catch (error) {
    console.error('❌ Erreur chargement tactiques:', error);
    throw error;
  }
}

/**
 * Charge la liste des placements pour une tactique spécifique.
 * Les placements sont triés par ordre.
 * @param clientId - L'ID du client.
 * @param campaignId - L'ID de la campagne.
 * @param versionId - L'ID de la version.
 * @param ongletId - L'ID de l'onglet.
 * @param sectionId - L'ID de la section.
 * @param tactiqueId - L'ID de la tactique.
 * @returns Une promesse résolue avec un tableau d'objets CascadeItem représentant les placements.
 * @throws {Error} Si une erreur survient lors du chargement des placements.
 */
export async function loadPlacements(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string,
  tactiqueId: string
): Promise<CascadeItem[]> {
  try {
    const placementsRef = collection(
      db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId,
      'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements'
    );
    const q = query(placementsRef, orderBy('PL_Order', 'asc'));
    console.log("FIREBASE: LECTURE - Fichier: simpleMoveService.ts - Fonction: loadPlacements - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
    const snapshot = await getDocs(q);

    const placements = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.PL_Label || 'Placement sans nom',
      };
    });

    return placements;

  } catch (error) {
    console.error('❌ Erreur chargement placements:', error);
    throw error;
  }
}

/**
 * Construit le contexte hiérarchique pour une liste d'éléments sélectionnés.
 * Cela permet de déterminer le chemin complet (y compris les parents) de chaque élément.
 * @param clientId - L'ID du client.
 * @param selectedItemIds - Un tableau d'IDs des éléments à contextualiser.
 * @param sourceContext - Le contexte de base (campagne, version, onglet) d'où proviennent les éléments.
 * @param hierarchyData - Un objet contenant les données de la hiérarchie (sections, tactiques, placements, créatifs) pour la source.
 * @returns Une promesse résolue avec un tableau d'objets ItemWithContext, chacun décrivant un élément et ses parents.
 */
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

  for (const itemId of selectedItemIds) {
    let found = false;

    for (const section of hierarchyData.sections) {
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

  return itemsWithContext;
}

/**
 * Calcule le prochain numéro d'ordre disponible pour un type d'élément donné
 * dans une collection de destination spécifique.
 * @param clientId - L'ID du client.
 * @param destination - L'objet MoveDestination spécifiant le chemin de destination.
 * @param itemType - Le type d'élément (section, tactique, placement, creatif).
 * @returns Une promesse résolue avec le prochain numéro d'ordre.
 */
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
  console.log(`FIREBASE: LECTURE - Fichier: simpleMoveService.ts - Fonction: getNextOrder - Path: ${collectionRef.path} (pour déterminer l'ordre)`);
  const q = query(collectionRef, orderBy(orderField, 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.empty ? 0 : (snapshot.docs[0].data()[orderField] || 0) + 1;
}

/**
 * Construit le chemin source complet d'un document Firebase en fonction de son type
 * et de son contexte hiérarchique.
 * @param clientId - L'ID du client.
 * @param itemWithContext - L'objet ItemWithContext décrivant l'élément et ses parents.
 * @returns Un tableau de chaînes de caractères représentant le chemin source.
 * @throws {Error} Si un ID parent est manquant pour un type d'élément donné.
 */
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

/**
 * Construit le chemin de la collection de destination pour un type d'élément donné.
 * @param itemType - Le type d'élément (section, tactique, placement, creatif).
 * @param clientId - L'ID du client.
 * @param destination - L'objet MoveDestination spécifiant le chemin de destination.
 * @returns Un tableau de chaînes de caractères représentant le chemin de la collection de destination.
 * @throws {Error} Si le type d'élément n'est pas supporté ou si un ID parent est manquant dans la destination.
 */
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

/**
 * Retourne le nom du champ d'ordre correspondant à un type d'élément.
 * @param itemType - Le type d'élément (section, tactique, placement, creatif).
 * @returns Le nom du champ d'ordre (ex: 'SECTION_Order').
 * @throws {Error} Si le type d'élément n'est pas supporté.
 */
function getOrderField(itemType: 'section' | 'tactique' | 'placement' | 'creatif'): string {
  switch (itemType) {
    case 'section': return 'SECTION_Order';
    case 'tactique': return 'TC_Order';
    case 'placement': return 'PL_Order';
    case 'creatif': return 'CR_Order';
    default: throw new Error(`Type d'élément non supporté: ${itemType}`);
  }
}

/**
 * Construit un objet contenant les références aux IDs des parents pour un élément donné,
 * en fonction de son type et de sa destination. Ces références sont utilisées pour
 * maintenir l'intégrité hiérarchique après le déplacement.
 * @param itemType - Le type d'élément (section, tactique, placement, creatif).
 * @param destination - L'objet MoveDestination spécifiant le chemin de destination.
 * @returns Un enregistrement (Record) d'IDs de référence des parents.
 */
function buildParentReferences(
  itemType: 'section' | 'tactique' | 'placement' | 'creatif',
  destination: MoveDestination
): Record<string, any> {
  const refs: Record<string, any> = {};

  switch (itemType) {
    case 'section':
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

/**
 * Exécute l'opération de déplacement d'éléments dans Firebase Firestore.
 * Cette fonction prépare les chemins source et destination, génère de nouveaux IDs,
 * calcule les ordres, puis exécute une transaction Firestore pour lire les données source,
 * écrire les données modifiées à la destination, et supprimer les données source.
 * @param operation - L'objet MoveOperation décrivant le déplacement à effectuer.
 * @returns Une promesse résolue avec un objet MoveResult indiquant le succès,
 * le nombre d'éléments déplacés/ignorés, et les erreurs/avertissements.
 */
export async function performMove(operation: MoveOperation): Promise<MoveResult> {
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
    const hierarchyOrder = ['section', 'tactique', 'placement', 'creatif'];
    const sortedItems = itemsWithContext.sort((a, b) => {
      return hierarchyOrder.indexOf(a.itemType) - hierarchyOrder.indexOf(b.itemType);
    });

    const newIdMapping = new Map<string, string>();

    const preparedItems: PreparedItem[] = [];

    for (const itemWithContext of sortedItems) {
      const enhancedDestination = buildEnhancedDestination(
        destination,
        itemWithContext,
        newIdMapping
      );

      const sourcePath = buildCorrectSourcePath(clientId, itemWithContext);
      const destPath = buildDestinationPath(itemWithContext.itemType, clientId, enhancedDestination);

      const sourceRef = getDocumentRef(sourcePath);
      const destCollectionRef = getCollectionRef(destPath);
      const destRef = doc(destCollectionRef);

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

    const ordersByType = new Map<string, number>();

    for (const preparedItem of preparedItems) {
      const { itemWithContext, enhancedDestination } = preparedItem;

      if (!ordersByType.has(itemWithContext.itemType)) {
        const nextOrder = await getNextOrder(clientId, enhancedDestination, itemWithContext.itemType);
        ordersByType.set(itemWithContext.itemType, nextOrder);
      }
    }

    await runTransaction(db, async (transaction) => {
      const readResults: ReadResult[] = [];

      for (const preparedItem of preparedItems) {
        const { itemWithContext, sourceRef } = preparedItem;

        try {
          console.log("FIREBASE: LECTURE - Fichier: simpleMoveService.ts - Fonction: performMove - Path: " + sourceRef.path);
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

        } catch (readError: any) {
          console.error(`❌ Erreur lecture ${itemWithContext.itemId}:`, readError);
          readResults.push({
            preparedItem,
            sourceData: null,
            error: `Erreur lecture: ${readError.message || readError}`
          });
        }
      }

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

          const currentOrder = ordersByType.get(itemWithContext.itemType)!;
          const orderField = getOrderField(itemWithContext.itemType);
          const parentRefs = buildParentReferences(itemWithContext.itemType, enhancedDestination);

          // ✅ CORRECTION : Synchroniser le champ 'id' avec l'ID du document Firestore
          const newData = {
            ...sourceData,
            id: destRef.id, // 🔧 CORRECTION APPLIQUÉE ICI
            [orderField]: currentOrder,
            ...parentRefs,
            updatedAt: new Date().toISOString()
          };

          console.log("FIREBASE: ÉCRITURE - Fichier: simpleMoveService.ts - Fonction: performMove - Path: " + destRef.path);
          transaction.set(destRef, newData);
          console.log("FIREBASE: ÉCRITURE - Fichier: simpleMoveService.ts - Fonction: performMove - Path: " + sourceRef.path);
          transaction.delete(sourceRef);

          ordersByType.set(itemWithContext.itemType, currentOrder + 1);

          movedCount++;

        } catch (writeError: any) {
          console.error(`❌ Erreur écriture ${preparedItem.itemWithContext.itemId}:`, writeError);
          errors.push(`Erreur écriture ${preparedItem.itemWithContext.itemId}: ${writeError.message || writeError}`);
        }
      }
    });

    const success = errors.length === 0;
    const skippedCount = itemsWithContext.length - movedCount;

    return {
      success,
      movedCount,
      skippedCount,
      errors,
      warnings
    };

  } catch (error: any) {
    console.error('💥 Erreur fatale lors du déplacement:', error);
    return {
      success: false,
      movedCount,
      skippedCount: itemsWithContext.length - movedCount,
      errors: [`Erreur fatale: ${error.message || error}`],
      warnings
    };
  }
}

/**
 * Construit un objet de destination enrichi, en mettant à jour les IDs des parents
 * (sectionId, tactiqueId, placementId) si ces parents ont été déplacés et ont de nouveaux IDs.
 * Ceci est crucial pour maintenir la bonne hiérarchie des éléments déplacés en cascade.
 * @param baseDestination - L'objet MoveDestination initial fourni par l'utilisateur.
 * @param itemWithContext - L'objet ItemWithContext de l'élément en cours de traitement.
 * @param newIdMapping - Une Map qui contient les correspondances entre les anciens IDs
 * et les nouveaux IDs des éléments déjà traités.
 * @returns Un objet MoveDestination avec les IDs des parents mis à jour si nécessaire.
 */
function buildEnhancedDestination(
  baseDestination: MoveDestination,
  itemWithContext: ItemWithContext,
  newIdMapping: Map<string, string>
): MoveDestination {
  const enhanced = { ...baseDestination };

  if (itemWithContext.parentIds.sectionId) {
    const newSectionId = newIdMapping.get(itemWithContext.parentIds.sectionId);
    if (newSectionId) {
      enhanced.sectionId = newSectionId;
    }
  }

  if (itemWithContext.parentIds.tactiqueId) {
    const newTactiqueId = newIdMapping.get(itemWithContext.parentIds.tactiqueId);
    if (newTactiqueId) {
      enhanced.tactiqueId = newTactiqueId;
    }
  }

  if (itemWithContext.parentIds.placementId) {
    const newPlacementId = newIdMapping.get(itemWithContext.parentIds.placementId);
    if (newPlacementId) {
      enhanced.placementId = newPlacementId;
    }
  }

  switch (itemWithContext.itemType) {
    case 'section':
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

  return enhanced;
}