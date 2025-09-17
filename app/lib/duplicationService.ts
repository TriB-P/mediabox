// app/lib/duplicationService.ts

/**
 * Ce fichier contient les fonctions nécessaires pour dupliquer des éléments (sections, tactiques, placements, créatifs)
 * au sein de la base de données Firebase. Il gère la création de copies avec de nouveaux noms et le maintien
 * de la hiérarchie en dupliquant également les éléments enfants.
 * 
 * MISE À JOUR : Utilise maintenant orderManagementService pour une gestion centralisée des ordres.
 * NOUVEAU : Exclut les propriétés cm360Tags, CR_Adops_Color et PL_Adops_Color lors de la duplication.
 */
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
import {
  getNextOrder,
  type OrderContext
} from './orderManagementService';

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

/**
 * Construit le contexte d'ordre pour le service orderManagementService
 */
function buildOrderContext(context: DuplicationContext, additionalContext: Partial<OrderContext> = {}): OrderContext {
  return {
    clientId: context.clientId,
    campaignId: context.campaignId,
    versionId: context.versionId,
    ongletId: context.ongletId,
    ...additionalContext
  };
}

/**
 * Nettoie les données en supprimant les propriétés qui ne doivent pas être dupliquées
 * @param data Les données à nettoyer
 * @returns Les données nettoyées sans les propriétés exclues
 */
function cleanDataForDuplication(data: any): any {
  const cleanedData = { ...data };
  
  // Supprimer les propriétés à exclure de la duplication
  delete cleanedData.cm360Tags;
  delete cleanedData.CR_Adops_Color;
  delete cleanedData.PL_Adops_Color;
  
  return cleanedData;
}

/**
 * Génère un nouveau nom en ajoutant un suffixe "(Copie)" ou en incrémentant le numéro de copie existant.
 * @param originalName Le nom original de l'élément à dupliquer.
 * @returns Le nouveau nom avec le suffixe de copie.
 */
function generateDuplicateName(originalName: string): string {
  const copyMatch = originalName.match(/^(.*?)\s*\(Copie(?:\s+(\d+))?\)$/);

  if (copyMatch) {
    const baseName = copyMatch[1];
    const copyNumber = copyMatch[2] ? parseInt(copyMatch[2]) + 1 : 2;
    return `${baseName} (Copie ${copyNumber})`;
  }

  return `${originalName} (Copie)`;
}

/**
 * Duplique un élément créatif dans Firebase.
 * MISE À JOUR : Utilise getNextOrder() du service central au lieu de getNextAvailableOrder()
 * NOUVEAU : Exclut les propriétés cm360Tags et CR_Adops_Color
 * @param context Contexte de duplication (IDs du client, campagne, version, onglet).
 * @param sourceSectionId L'ID de la section source du créatif.
 * @param sourceTactiqueId L'ID de la tactique source du créatif.
 * @param sourcePlacementId L'ID du placement source du créatif.
 * @param sourceCreatifId L'ID du créatif à dupliquer.
 * @param targetSectionId L'ID de la section de destination pour le créatif dupliqué.
 * @param targetTactiqueId L'ID de la tactique de destination pour le créatif dupliqué.
 * @param targetPlacementId L'ID du placement de destination pour le créatif dupliqué.
 * @returns L'ID du nouveau créatif dupliqué.
 * @throws Erreur si le créatif source n'est pas trouvé.
 */
async function duplicateCreatif(
  context: DuplicationContext,
  sourceSectionId: string,
  sourceTactiqueId: string,
  sourcePlacementId: string,
  sourceCreatifId: string,
  targetSectionId: string,
  targetTactiqueId: string,
  targetPlacementId: string
): Promise<string> {
  try {
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

    console.log("FIREBASE: LECTURE - Fichier: duplicationService.ts - Fonction: duplicateCreatif - Path: " + `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sourceSectionId}/tactiques/${sourceTactiqueId}/placements/${sourcePlacementId}/creatifs/${sourceCreatifId}`);
    const creatifSnap = await getDoc(creatifRef);
    if (!creatifSnap.exists()) {
      throw new Error(`Créatif ${sourceCreatifId} non trouvé`);
    }

    const creatifData = creatifSnap.data() as Creatif;

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

    // ✅ NOUVEAU : Utilise le service central pour calculer l'ordre
    const orderContext = buildOrderContext(context, { sectionId: targetSectionId, tactiqueId: targetTactiqueId, placementId: targetPlacementId });
    const newOrder = await getNextOrder('creatif', orderContext);

    // ✅ NOUVEAU : Nettoie les données avant duplication
    const cleanedData = cleanDataForDuplication(creatifData);

    const newCreatifData = {
      ...cleanedData,
      CR_Label: generateDuplicateName(creatifData.CR_Label),
      CR_Order: newOrder,
      CR_PlacementId: targetPlacementId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    delete (newCreatifData as any).id;

    console.log("FIREBASE: ÉCRITURE - Fichier: duplicationService.ts - Fonction: duplicateCreatif - Path: " + `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${targetSectionId}/tactiques/${targetTactiqueId}/placements/${targetPlacementId}/creatifs`);
    const docRef = await addDoc(creatifsCollection, newCreatifData);

    return docRef.id;
  } catch (error) {
    console.error(`❌ Erreur duplication créatif ${sourceCreatifId}:`, error);
    throw error;
  }
}

/**
 * Duplique un élément placement dans Firebase, y compris tous ses créatifs enfants.
 * MISE À JOUR : Utilise getNextOrder() du service central au lieu de getNextAvailableOrder()
 * NOUVEAU : Exclut les propriétés cm360Tags et PL_Adops_Color
 * @param context Contexte de duplication (IDs du client, campagne, version, onglet).
 * @param sourceSectionId L'ID de la section source du placement.
 * @param sourceTactiqueId L'ID de la tactique source du placement.
 * @param sourcePlacementId L'ID du placement à dupliquer.
 * @param targetSectionId L'ID de la section de destination pour le placement dupliqué.
 * @param targetTactiqueId L'ID de la tactique de destination pour le placement dupliqué.
 * @returns L'ID du nouveau placement dupliqué.
 * @throws Erreur si le placement source n'est pas trouvé.
 */
async function duplicatePlacement(
  context: DuplicationContext,
  sourceSectionId: string,
  sourceTactiqueId: string,
  sourcePlacementId: string,
  targetSectionId: string,
  targetTactiqueId: string
): Promise<string> {
  try {
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

    console.log("FIREBASE: LECTURE - Fichier: duplicationService.ts - Fonction: duplicatePlacement - Path: " + `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sourceSectionId}/tactiques/${sourceTactiqueId}/placements/${sourcePlacementId}`);
    const placementSnap = await getDoc(placementRef);
    if (!placementSnap.exists()) {
      throw new Error(`Placement ${sourcePlacementId} non trouvé`);
    }

    const placementData = placementSnap.data() as Placement;

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

    // ✅ NOUVEAU : Utilise le service central pour calculer l'ordre
    const orderContext = buildOrderContext(context, { sectionId: targetSectionId, tactiqueId: targetTactiqueId });
    const newOrder = await getNextOrder('placement', orderContext);

    // ✅ NOUVEAU : Nettoie les données avant duplication
    const cleanedData = cleanDataForDuplication(placementData);

    const newPlacementData = {
      ...cleanedData,
      PL_Label: generateDuplicateName(placementData.PL_Label),
      PL_Order: newOrder,
      PL_TactiqueId: targetTactiqueId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    delete (newPlacementData as any).id;

    console.log("FIREBASE: ÉCRITURE - Fichier: duplicationService.ts - Fonction: duplicatePlacement - Path: " + `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${targetSectionId}/tactiques/${targetTactiqueId}/placements`);
    const docRef = await addDoc(placementsCollection, newPlacementData);
    const newPlacementId = docRef.id;

    const creatifsRef = collection(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', sourceSectionId,
      'tactiques', sourceTactiqueId,
      'placements', sourcePlacementId,
      'creatifs'
    );

    console.log("FIREBASE: LECTURE - Fichier: duplicationService.ts - Fonction: duplicatePlacement - Path: " + `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sourceSectionId}/tactiques/${sourceTactiqueId}/placements/${sourcePlacementId}/creatifs`);
    const creatifsSnapshot = await getDocs(creatifsRef);

    for (const creatifDoc of creatifsSnapshot.docs) {
      await duplicateCreatif(
        context,
        sourceSectionId,
        sourceTactiqueId,
        sourcePlacementId,
        creatifDoc.id,
        targetSectionId,
        targetTactiqueId,
        newPlacementId
      );
    }

    return newPlacementId;
  } catch (error) {
    console.error(`❌ Erreur duplication placement ${sourcePlacementId}:`, error);
    throw error;
  }
}

/**
 * Duplique un élément tactique dans Firebase, y compris tous ses placements et créatifs enfants.
 * MISE À JOUR : Utilise getNextOrder() du service central au lieu de getNextAvailableOrder()
 * NOUVEAU : Exclut les propriétés cm360Tags
 * @param context Contexte de duplication (IDs du client, campagne, version, onglet).
 * @param sourceSectionId L'ID de la section source de la tactique.
 * @param sourceTactiqueId L'ID de la tactique à dupliquer.
 * @param targetSectionId L'ID de la section de destination pour la tactique dupliquée.
 * @returns L'ID de la nouvelle tactique dupliquée.
 * @throws Erreur si la tactique source n'est pas trouvée.
 */
async function duplicateTactique(
  context: DuplicationContext,
  sourceSectionId: string,
  sourceTactiqueId: string,
  targetSectionId: string
): Promise<string> {
  try {
    const tactiqueRef = doc(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', sourceSectionId,
      'tactiques', sourceTactiqueId
    );

    console.log("FIREBASE: LECTURE - Fichier: duplicationService.ts - Fonction: duplicateTactique - Path: " + `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sourceSectionId}/tactiques/${sourceTactiqueId}`);
    const tactiqueSnap = await getDoc(tactiqueRef);
    if (!tactiqueSnap.exists()) {
      throw new Error(`Tactique ${sourceTactiqueId} non trouvée`);
    }

    const tactiqueData = tactiqueSnap.data() as Tactique;

    const tactiquesCollection = collection(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', targetSectionId,
      'tactiques'
    );

    // ✅ NOUVEAU : Utilise le service central pour calculer l'ordre
    const orderContext = buildOrderContext(context, { sectionId: targetSectionId });
    const newOrder = await getNextOrder('tactique', orderContext);

    // ✅ NOUVEAU : Nettoie les données avant duplication
    const cleanedData = cleanDataForDuplication(tactiqueData);

    const newTactiqueData = {
      ...cleanedData,
      TC_Label: generateDuplicateName(tactiqueData.TC_Label),
      TC_Order: newOrder,
      TC_SectionId: targetSectionId,
      TC_History: null, 

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    delete (newTactiqueData as any).id;

    console.log("FIREBASE: ÉCRITURE - Fichier: duplicationService.ts - Fonction: duplicateTactique - Path: " + `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${targetSectionId}/tactiques`);
    const docRef = await addDoc(tactiquesCollection, newTactiqueData);
    const newTactiqueId = docRef.id;

    const placementsRef = collection(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', sourceSectionId,
      'tactiques', sourceTactiqueId,
      'placements'
    );

    console.log("FIREBASE: LECTURE - Fichier: duplicationService.ts - Fonction: duplicateTactique - Path: " + `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sourceSectionId}/tactiques/${sourceTactiqueId}/placements`);
    const placementsSnapshot = await getDocs(placementsRef);

    for (const placementDoc of placementsSnapshot.docs) {
      await duplicatePlacement(
        context,
        sourceSectionId,
        sourceTactiqueId,
        placementDoc.id,
        targetSectionId,
        newTactiqueId
      );
    }

    return newTactiqueId;
  } catch (error) {
    console.error(`❌ Erreur duplication tactique ${sourceTactiqueId}:`, error);
    throw error;
  }
}

/**
 * Duplique un élément section dans Firebase, y compris toutes ses tactiques, placements et créatifs enfants.
 * MISE À JOUR : Utilise getNextOrder() du service central au lieu de getNextAvailableOrder()
 * NOUVEAU : Exclut les propriétés cm360Tags
 * @param context Contexte de duplication (IDs du client, campagne, version, onglet).
 * @param sectionId L'ID de la section à dupliquer.
 * @returns L'ID de la nouvelle section dupliquée.
 * @throws Erreur si la section source n'est pas trouvée.
 */
async function duplicateSection(
  context: DuplicationContext,
  sectionId: string
): Promise<string> {
  try {
    const sectionRef = doc(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', sectionId
    );

    console.log("FIREBASE: LECTURE - Fichier: duplicationService.ts - Fonction: duplicateSection - Path: " + `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}`);
    const sectionSnap = await getDoc(sectionRef);
    if (!sectionSnap.exists()) {
      throw new Error(`Section ${sectionId} non trouvée`);
    }

    const sectionData = sectionSnap.data() as Section;

    const sectionsCollection = collection(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections'
    );

    // ✅ NOUVEAU : Utilise le service central pour calculer l'ordre
    const orderContext = buildOrderContext(context);
    const newOrder = await getNextOrder('section', orderContext);

    // ✅ NOUVEAU : Nettoie les données avant duplication
    const cleanedData = cleanDataForDuplication(sectionData);

    const newSectionData = {
      ...cleanedData,
      SECTION_Name: generateDuplicateName(sectionData.SECTION_Name),
      SECTION_Order: newOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    delete (newSectionData as any).id;
    delete (newSectionData as any).isExpanded;
    delete (newSectionData as any).isSelected;

    console.log("FIREBASE: ÉCRITURE - Fichier: duplicationService.ts - Fonction: duplicateSection - Path: " + `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections`);
    const docRef = await addDoc(sectionsCollection, newSectionData);
    const newSectionId = docRef.id;

    const tactiquesRef = collection(
      db,
      'clients', context.clientId,
      'campaigns', context.campaignId,
      'versions', context.versionId,
      'onglets', context.ongletId,
      'sections', sectionId,
      'tactiques'
    );

    console.log("FIREBASE: LECTURE - Fichier: duplicationService.ts - Fonction: duplicateSection - Path: " + `clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}/tactiques`);
    const tactiquesSnapshot = await getDocs(tactiquesRef);

    for (const tactiqueDoc of tactiquesSnapshot.docs) {
      await duplicateTactique(
        context,
        sectionId,
        tactiqueDoc.id,
        newSectionId
      );
    }

    return newSectionId;
  } catch (error) {
    console.error(`❌ Erreur duplication section ${sectionId}:`, error);
    throw error;
  }
}

/**
 * Duplique une liste d'éléments sélectionnés (sections, tactiques, placements, créatifs) en respectant leur hiérarchie.
 * Cette fonction s'assure qu'un élément parent n'est pas dupliqué si un de ses enfants est déjà sélectionné pour duplication.
 * @param context Contexte de duplication (IDs du client, campagne, version, onglet).
 * @param selectedItemIds Un tableau d'IDs des éléments à dupliquer.
 * @param itemHierarchy Un objet représentant la hiérarchie actuelle des éléments dans l'application.
 * @returns Un objet DuplicationResult indiquant le succès, les IDs des éléments dupliqués et les éventuelles erreurs.
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

  try {
    const itemsToProcess = new Set<string>();
    const processedParents = new Set<string>();

    for (const itemId of selectedItemIds) {
      let itemType: 'section' | 'tactique' | 'placement' | 'creatif' | null = null;
      let parentIds: string[] = [];

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

      const hasSelectedParent = parentIds.some(parentId => processedParents.has(parentId));

      if (!hasSelectedParent && itemType) {
        itemsToProcess.add(itemId);
        processedParents.add(itemId);
      }
    }

    for (const itemId of Array.from(itemsToProcess)) {
      try {
        let newId: string | null = null;

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
        } else {
          result.errors.push(`Élément ${itemId} non trouvé dans la hiérarchie`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        result.errors.push(`Erreur duplication ${itemId}: ${errorMessage}`);
        result.success = false;
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale duplication:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
  }

  return result;
}