/**
 * Ce fichier contient des fonctions de service pour interagir avec Firestore,
 * spécifiquement pour la gestion des tactiques, sections et onglets
 * dans le contexte des campagnes. Il gère également des fonctionnalités liées au budget
 * comme la récupération des frais, des devises et des types d'unités.
 *
 * Il est conçu pour simplifier les opérations CRUD (Créer, Lire, Mettre à jour, Supprimer)
 * et les opérations de réorganisation pour les données structurées de campagne.
 */
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
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Section, Tactique, Onglet } from '../types/tactiques';
import { getNextOrder, type OrderContext } from './orderManagementService';


interface Fee {
  id: string;
  FE_Name: string;
  FE_Calculation_Type: 'Pourcentage budget' | 'Volume d\'unité' | 'Unités' | 'Frais fixe';
  FE_Calculation_Mode: 'Directement sur le budget média' | 'Applicable sur les frais précédents';
  FE_Order: number;
  options: FeeOption[];
}

interface FeeOption {
  id: string;
  FO_Option: string;
  FO_Value: number;
  FO_Buffer: number;
  FO_Editable: boolean;
}

/**
 * Récupère tous les onglets pour une version spécifique d'une campagne.
 * Les onglets sont triés par leur ordre.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @returns Une promesse qui résout en un tableau d'objets Onglet.
 */
export async function getOnglets(
  clientId: string,
  campaignId: string,
  versionId: string
): Promise<Onglet[]> {
  try {
    const ongletsRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets'
    );
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: getOnglets - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets");
    const q = query(ongletsRef, orderBy('ONGLET_Order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Onglet));
  } catch (error) {
    console.error('Erreur lors de la récupération des onglets:', error);
    throw error;
  }
}

/**
 * Récupère toutes les sections pour un onglet spécifique d'une version de campagne.
 * Les sections sont triées par leur ordre.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @returns Une promesse qui résout en un tableau d'objets Section.
 */
export async function getSections(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string
): Promise<Section[]> {
  try {
    const sectionsRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections'
    );
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: getSections - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections");
    const q = query(sectionsRef, orderBy('SECTION_Order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Section));
  } catch (error) {
    console.error('Erreur lors de la récupération des sections:', error);
    throw error;
  }
}

/**
 * Récupère toutes les tactiques pour une section spécifique d'un onglet.
 * Les tactiques sont triées par leur ordre.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionId L'ID de la section.
 * @returns Une promesse qui résout en un tableau d'objets Tactique.
 */
export async function getTactiques(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string
): Promise<Tactique[]> {
  try {
    const tactiquesRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections',
      sectionId,
      'tactiques'
    );
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: getTactiques - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques");
    const q = query(tactiquesRef, orderBy('TC_Order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Tactique));
  } catch (error) {
    console.error('Erreur lors de la récupération des tactiques:', error);
    throw error;
  }
}

/**
 * Ajoute une nouvelle section à un onglet spécifique.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionData Les données de la section à ajouter (sans l'ID).
 * @returns Une promesse qui résout en l'ID du document de la nouvelle section.
 */
export async function addSection(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionData: Omit<Section, 'id'>
): Promise<string> {
  try {
    const sectionsRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections'
    );


    console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: addSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections");
    const docRef = await addDoc(sectionsRef, {
      ...sectionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la section:', error);
    throw error;
  }
}

/**
 * Met à jour une section existante.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionId L'ID de la section à mettre à jour.
 * @param sectionData Les données partielles de la section à mettre à jour.
 * @returns Une promesse qui résout lorsque la section est mise à jour.
 */
export async function updateSection(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string,
  sectionData: Partial<Section>
): Promise<void> {
  try {
    const sectionRef = doc(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections',
      sectionId
    );
    console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: updateSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}");
    await updateDoc(sectionRef, {
      ...sectionData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la section:', error);
    throw error;
  }
}

/**
 * Ajoute une nouvelle tactique à une section spécifique.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionId L'ID de la section.
 * @param tactiqueData Les données de la tactique à ajouter (sans l'ID).
 * @returns Une promesse qui résout en l'ID du document de la nouvelle tactique.
 */
export async function addTactique(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string,
  tactiqueData: Omit<Tactique, 'id'>
): Promise<string> {
  try {
    const tactiquesRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections',
      sectionId,
      'tactiques'
    );

    // ✅ NOUVEAU : Calcul automatique de TC_Order
      const orderContext: OrderContext = {
        clientId,
        campaignId,
        versionId,
        ongletId,
        sectionId
      };

      let calculatedOrder = 0;
      try {
        calculatedOrder = await getNextOrder('tactique', orderContext);
        console.log(`🔢 TC_Order calculé automatiquement: ${calculatedOrder}`);
      } catch (error) {
        console.error('❌ Erreur calcul TC_Order:', error);
        console.log('🔢 TC_Order fallback: 0');
      }

    console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: addTactique - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques");
    const docRef = await addDoc(tactiquesRef, {
      ...tactiqueData,
      TC_Order: calculatedOrder, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la tactique:', error);
    throw error;
  }
}

/**
 * Met à jour une tactique existante.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionId L'ID de la section.
 * @param tactiqueId L'ID de la tactique à mettre à jour.
 * @param tactiqueData Les données partielles de la tactique à mettre à jour.
 * @returns Une promesse qui résout lorsque la tactique est mise à jour.
 */
export async function updateTactique(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string,
  tactiqueId: string,
  tactiqueData: Partial<Tactique>
): Promise<void> {
  try {
    const tactiqueRef = doc(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections',
      sectionId,
      'tactiques',
      tactiqueId
    );
    console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: updateTactique - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}");
    await updateDoc(tactiqueRef, {
      ...tactiqueData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tactique:', error);
    throw error;
  }
}

/**
 * Réordonne les sections dans un onglet en mettant à jour leur propriété 'SECTION_Order'.
 * Utilise un batch pour des mises à jour atomiques.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionOrders Un tableau d'objets contenant l'ID de la section et son nouvel ordre.
 * @returns Une promesse qui résout lorsque toutes les sections sont réordonnées.
 */
export async function reorderSections(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    sectionOrders.forEach(({ id, order }) => {
      const sectionRef = doc(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions',
        versionId,
        'onglets',
        ongletId,
        'sections',
        id
      );
      console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: reorderSections - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${id}");
      batch.update(sectionRef, {
        SECTION_Order: order,
        updatedAt: new Date().toISOString()
      });
    });
    await batch.commit();
  } catch (error) {
    console.error('Erreur lors de la réorganisation des sections:', error);
    throw error;
  }
}

/**
 * Réordonne les tactiques dans une section en mettant à jour leur propriété 'TC_Order'.
 * Utilise un batch pour des mises à jour atomiques.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionId L'ID de la section.
 * @param tactiqueOrders Un tableau d'objets contenant l'ID de la tactique et son nouvel ordre.
 * @returns Une promesse qui résout lorsque toutes les tactiques sont réordonnées.
 */
export async function reorderTactiques(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string,
  tactiqueOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    tactiqueOrders.forEach(({ id, order }) => {
      const tactiqueRef = doc(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions',
        versionId,
        'onglets',
        ongletId,
        'sections',
        sectionId,
        'tactiques',
        id
      );
      console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: reorderTactiques - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${id}");
      batch.update(tactiqueRef, {
        TC_Order: order,
        updatedAt: new Date().toISOString()
      });
    });
    await batch.commit();
  } catch (error) {
    console.error('Erreur lors de la réorganisation des tactiques:', error);
    throw error;
  }
}

/**
 * Déplace une tactique d'une section à une autre et réordonne les tactiques des sections affectées.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param tactiqueId L'ID de la tactique à déplacer.
 * @param fromSectionId L'ID de la section source.
 * @param toSectionId L'ID de la section de destination.
 * @param newOrder Le nouvel ordre de la tactique dans la section de destination.
 * @returns Une promesse qui résout lorsque la tactique est déplacée et les ordres mis à jour.
 */
export async function moveTactiqueToSection(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  tactiqueId: string,
  fromSectionId: string,
  toSectionId: string,
  newOrder: number
): Promise<void> {
  try {
    const tactiqueRef = doc(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections',
      fromSectionId,
      'tactiques',
      tactiqueId
    );
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: moveTactiqueToSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${fromSectionId}/tactiques/${tactiqueId}");
    const tactiqueSnap = await getDoc(tactiqueRef);
    if (!tactiqueSnap.exists()) {
      throw new Error('Tactique introuvable');
    }
    const tactiqueData = tactiqueSnap.data() as Tactique;
    const newTactiquesRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections',
      toSectionId,
      'tactiques'
    );
    console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: moveTactiqueToSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${toSectionId}/tactiques");
    await addDoc(newTactiquesRef, {
      ...tactiqueData,
      TC_SectionId: toSectionId,
      TC_Order: newOrder,
      updatedAt: new Date().toISOString()
    });
    console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: moveTactiqueToSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${fromSectionId}/tactiques/${tactiqueId}");
    await deleteDoc(tactiqueRef);
    const sourceTactiques = await getTactiques(
      clientId,
      campaignId,
      versionId,
      ongletId,
      fromSectionId
    );
    const filteredSourceTactiques = sourceTactiques.filter(t => t.id !== tactiqueId);
    const reorderedSourceTactiques = filteredSourceTactiques.map((t, index) => ({
      id: t.id,
      order: index
    }));
    if (reorderedSourceTactiques.length > 0) {
      await reorderTactiques(
        clientId,
        campaignId,
        versionId,
        ongletId,
        fromSectionId,
        reorderedSourceTactiques
      );
    }
  } catch (error) {
    console.error('Erreur lors du déplacement de la tactique:', error);
    throw error;
  }
}

// app/lib/tactiqueService.ts - deleteSection() corrigée

/**
 * Supprime une section et toutes les tactiques, placements et créatifs qu'elle contient.
 * CORRIGÉ: Nettoie maintenant toute la hiérarchie : tactiques/placements/creatifs
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionId L'ID de la section à supprimer.
 * @returns Une promesse qui résout lorsque la section et ses tactiques sont supprimées.
 */
export async function deleteSection(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string
): Promise<void> {
  try {
    console.log(`🗑️ Début suppression section ${sectionId} et toute sa hiérarchie`);

    // Récupérer toutes les tactiques de cette section
    const tactiquesRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections',
      sectionId,
      'tactiques'
    );
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: deleteSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques");
    const tactiquesSnapshot = await getDocs(tactiquesRef);
    
    for (const tactiqueDoc of tactiquesSnapshot.docs) {
      const tactiqueId = tactiqueDoc.id;
      console.log(`🗑️ Suppression tactique ${tactiqueId}`);
      
      // Récupérer tous les placements de cette tactique
      const placementsRef = collection(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions',
        versionId,
        'onglets',
        ongletId,
        'sections',
        sectionId,
        'tactiques',
        tactiqueId,
        'placements'
      );
      console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: deleteSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
      const placementsSnapshot = await getDocs(placementsRef);
      
      for (const placementDoc of placementsSnapshot.docs) {
        const placementId = placementDoc.id;
        console.log(`🗑️ Suppression placement ${placementId}`);
        
        // Récupérer tous les créatifs de ce placement
        const creatifsRef = collection(
          db,
          'clients',
          clientId,
          'campaigns',
          campaignId,
          'versions',
          versionId,
          'onglets',
          ongletId,
          'sections',
          sectionId,
          'tactiques',
          tactiqueId,
          'placements',
          placementId,
          'creatifs'
        );
        console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: deleteSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs");
        const creatifsSnapshot = await getDocs(creatifsRef);
        
        // Supprimer tous les créatifs
        for (const creatifDoc of creatifsSnapshot.docs) {
          console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifDoc.id}");
          await deleteDoc(creatifDoc.ref);
        }
        
        // Supprimer le placement
        console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
        await deleteDoc(placementDoc.ref);
      }
      
      // Supprimer la tactique
      console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}");
      await deleteDoc(tactiqueDoc.ref);
    }
    
    // Supprimer la section elle-même
    const sectionRef = doc(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections',
      sectionId
    );
    console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteSection - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}");
    await deleteDoc(sectionRef);
    
    console.log(`✅ Suppression complète de la section ${sectionId} terminée`);
    
  } catch (error) {
    console.error('Erreur lors de la suppression de la section:', error);
    throw error;
  }
}

// app/lib/tactiqueService.ts - deleteTactique() corrigée

/**
 * Supprime une tactique spécifique et tous les placements et créatifs qu'elle contient.
 * Réordonne également les tactiques restantes dans sa section.
 * CORRIGÉ: Nettoie maintenant toute la hiérarchie : placements/creatifs
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet.
 * @param sectionId L'ID de la section.
 * @param tactiqueId L'ID de la tactique à supprimer.
 * @returns Une promesse qui résout lorsque la tactique est supprimée et les ordres mis à jour.
 */
export async function deleteTactique(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string,
  tactiqueId: string
): Promise<void> {
  try {
    console.log(`🗑️ Début suppression tactique ${tactiqueId} et toute sa hiérarchie`);

    // Récupérer tous les placements de cette tactique
    const placementsRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections',
      sectionId,
      'tactiques',
      tactiqueId,
      'placements'
    );
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: deleteTactique - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
    const placementsSnapshot = await getDocs(placementsRef);
    
    for (const placementDoc of placementsSnapshot.docs) {
      const placementId = placementDoc.id;
      console.log(`🗑️ Suppression placement ${placementId}`);
      
      // Récupérer tous les créatifs de ce placement
      const creatifsRef = collection(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions',
        versionId,
        'onglets',
        ongletId,
        'sections',
        sectionId,
        'tactiques',
        tactiqueId,
        'placements',
        placementId,
        'creatifs'
      );
      console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: deleteTactique - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs");
      const creatifsSnapshot = await getDocs(creatifsRef);
      
      // Supprimer tous les créatifs
      for (const creatifDoc of creatifsSnapshot.docs) {
        console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteTactique - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifDoc.id}");
        await deleteDoc(creatifDoc.ref);
      }
      
      // Supprimer le placement
      console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteTactique - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
      await deleteDoc(placementDoc.ref);
    }
    
    // Supprimer la tactique elle-même
    const tactiqueRef = doc(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections',
      sectionId,
      'tactiques',
      tactiqueId
    );
    console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteTactique - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}");
    await deleteDoc(tactiqueRef);
    
    // Réorganiser les tactiques restantes dans la section
    console.log(`🔄 Réorganisation des tactiques restantes dans la section ${sectionId}`);
    const tactiques = await getTactiques(
      clientId,
      campaignId,
      versionId,
      ongletId,
      sectionId
    );
    
    const reorderedTactiques = tactiques
      .filter(t => t.id !== tactiqueId)
      .sort((a, b) => a.TC_Order - b.TC_Order)
      .map((t, index) => ({
        id: t.id,
        order: index
      }));
    
    if (reorderedTactiques.length > 0) {
      await reorderTactiques(
        clientId,
        campaignId,
        versionId,
        ongletId,
        sectionId,
        reorderedTactiques
      );
    }
    
    console.log(`✅ Suppression complète de la tactique ${tactiqueId} terminée`);
    
  } catch (error) {
    console.error('Erreur lors de la suppression de la tactique:', error);
    throw error;
  }
}

/**
 * Ajoute un nouvel onglet à une version de campagne.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletData Les données de l'onglet à ajouter (sans l'ID).
 * @returns Une promesse qui résout en l'ID du document du nouvel onglet.
 */
export async function addOnglet(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletData: Omit<Onglet, 'id'>
): Promise<string> {
  try {
    const ongletsRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets'
    );
    console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: addOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets");
    const docRef = await addDoc(ongletsRef, {
      ...ongletData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de l\'onglet:', error);
    throw error;
  }
}

/**
 * Met à jour un onglet existant (par exemple, pour le renommer).
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet à mettre à jour.
 * @param ongletData Les données partielles de l'onglet à mettre à jour.
 * @returns Une promesse qui résout lorsque l'onglet est mis à jour.
 */
export async function updateOnglet(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  ongletData: Partial<Onglet>
): Promise<void> {
  try {
    const ongletRef = doc(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId
    );
    console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: updateOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}");
    await updateDoc(ongletRef, {
      ...ongletData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'onglet:', error);
    throw error;
  }
}

// app/lib/tactiqueService.ts - deleteOnglet() corrigée

/**
 * Supprime un onglet et toutes les sections, tactiques, placements et créatifs qu'il contient.
 * CORRIGÉ: Nettoie maintenant toute la hiérarchie : sections/tactiques/placements/creatifs
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletId L'ID de l'onglet à supprimer.
 * @returns Une promesse qui résout lorsque l'onglet et ses données sont supprimés.
 */
export async function deleteOnglet(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string
): Promise<void> {
  try {
    console.log(`🗑️ Début suppression onglet ${ongletId} et toute sa hiérarchie`);

    // Récupérer toutes les sections de cet onglet
    const sectionsRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId,
      'sections'
    );
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: deleteOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections");
    const sectionsSnapshot = await getDocs(sectionsRef);
    
    for (const sectionDoc of sectionsSnapshot.docs) {
      const sectionId = sectionDoc.id;
      console.log(`🗑️ Suppression section ${sectionId}`);
      
      // Récupérer toutes les tactiques de cette section
      const tactiquesRef = collection(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions',
        versionId,
        'onglets',
        ongletId,
        'sections',
        sectionId,
        'tactiques'
      );
      console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: deleteOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques");
      const tactiquesSnapshot = await getDocs(tactiquesRef);
      
      for (const tactiqueDoc of tactiquesSnapshot.docs) {
        const tactiqueId = tactiqueDoc.id;
        console.log(`🗑️ Suppression tactique ${tactiqueId}`);
        
        // Récupérer tous les placements de cette tactique
        const placementsRef = collection(
          db,
          'clients',
          clientId,
          'campaigns',
          campaignId,
          'versions',
          versionId,
          'onglets',
          ongletId,
          'sections',
          sectionId,
          'tactiques',
          tactiqueId,
          'placements'
        );
        console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: deleteOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
        const placementsSnapshot = await getDocs(placementsRef);
        
        for (const placementDoc of placementsSnapshot.docs) {
          const placementId = placementDoc.id;
          console.log(`🗑️ Suppression placement ${placementId}`);
          
          // Récupérer tous les créatifs de ce placement
          const creatifsRef = collection(
            db,
            'clients',
            clientId,
            'campaigns',
            campaignId,
            'versions',
            versionId,
            'onglets',
            ongletId,
            'sections',
            sectionId,
            'tactiques',
            tactiqueId,
            'placements',
            placementId,
            'creatifs'
          );
          console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: deleteOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs");
          const creatifsSnapshot = await getDocs(creatifsRef);
          
          // Supprimer tous les créatifs
          for (const creatifDoc of creatifsSnapshot.docs) {
            console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifDoc.id}");
            await deleteDoc(creatifDoc.ref);
          }
          
          // Supprimer le placement
          console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
          await deleteDoc(placementDoc.ref);
        }
        
        // Supprimer la tactique
        console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}");
        await deleteDoc(tactiqueDoc.ref);
      }
      
      // Supprimer la section
      console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}");
      await deleteDoc(sectionDoc.ref);
    }
    
    // Supprimer l'onglet lui-même
    const ongletRef = doc(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      ongletId
    );
    console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: deleteOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}");
    await deleteDoc(ongletRef);
    
    console.log(`✅ Suppression complète de l'onglet ${ongletId} terminée`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'onglet:', error);
    throw error;
  }
}

/**
 * Réordonne les onglets en mettant à jour leur propriété 'ONGLET_Order'.
 * Utilise un batch pour des mises à jour atomiques.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param ongletOrders Un tableau d'objets contenant l'ID de l'onglet et son nouvel ordre.
 * @returns Une promesse qui résout lorsque tous les onglets sont réordonnés.
 */
export async function reorderOnglets(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    ongletOrders.forEach(({ id, order }) => {
      const ongletRef = doc(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions',
        versionId,
        'onglets',
        id
      );
      console.log("FIREBASE: ÉCRITURE - Fichier: tactiqueService.ts - Fonction: reorderOnglets - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${id}");
      batch.update(ongletRef, {
        ONGLET_Order: order,
        updatedAt: new Date().toISOString()
      });
    });
    await batch.commit();
  } catch (error) {
    console.error('❌ Erreur lors de la réorganisation des onglets:', error);
    throw error;
  }
}

/**
 * Duplique un onglet existant, y compris toutes ses sections et tactiques,
 * sous un nouveau nom et avec un nouvel ordre.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version.
 * @param sourceOngletId L'ID de l'onglet source à dupliquer.
 * @param newOngletName Le nouveau nom pour l'onglet dupliqué.
 * @returns Une promesse qui résout en l'ID du nouvel onglet dupliqué.
 */
export async function duplicateOnglet(
  clientId: string,
  campaignId: string,
  versionId: string,
  sourceOngletId: string,
  newOngletName: string
): Promise<string> {
  try {
    const sourceOngletRef = doc(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      sourceOngletId
    );
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: duplicateOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${sourceOngletId}");
    const sourceOngletSnap = await getDoc(sourceOngletRef);
    if (!sourceOngletSnap.exists()) {
      throw new Error('Onglet source introuvable');
    }
    const sourceOngletData = sourceOngletSnap.data() as Onglet;
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: duplicateOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets");
    const ongletsSnapshot = await getDocs(
      collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets')
    );
    const newOrder = ongletsSnapshot.size;
    const newOngletData = {
      ONGLET_Name: newOngletName,
      ONGLET_Order: newOrder,
    };
    const newOngletId = await addOnglet(clientId, campaignId, versionId, newOngletData);
    const sectionsRef = collection(
      db,
      'clients',
      clientId,
      'campaigns',
      campaignId,
      'versions',
      versionId,
      'onglets',
      sourceOngletId,
      'sections'
    );
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: duplicateOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${sourceOngletId}/sections");
    const sectionsSnapshot = await getDocs(query(sectionsRef, orderBy('SECTION_Order', 'asc')));
    for (const sectionDoc of sectionsSnapshot.docs) {
      const sectionData = sectionDoc.data() as Section;
      const newSectionId = await addSection(
        clientId, campaignId, versionId, newOngletId,
        {
          SECTION_Name: sectionData.SECTION_Name,
          SECTION_Order: sectionData.SECTION_Order,
          SECTION_Color: sectionData.SECTION_Color,
          SECTION_Budget: sectionData.SECTION_Budget
        }
      );
      const tactiquesRef = collection(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions',
        versionId,
        'onglets',
        sourceOngletId,
        'sections',
        sectionDoc.id,
        'tactiques'
      );
      console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: duplicateOnglet - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${sourceOngletId}/sections/${sectionDoc.id}/tactiques");
      const tactiquesSnapshot = await getDocs(query(tactiquesRef, orderBy('TC_Order', 'asc')));
      for (const tactiqueDoc of tactiquesSnapshot.docs) {
        const tactiqueData = tactiqueDoc.data() as Tactique;
        await addTactique(
          clientId, campaignId, versionId, newOngletId, newSectionId,
          {
            TC_Label: tactiqueData.TC_Label,
            TC_MPA:tactiqueData.TC_MPA,
            TC_Order: tactiqueData.TC_Order,
            TC_Budget: tactiqueData.TC_Budget,
            TC_SectionId: newSectionId,
            TC_Client_Budget_RefCurrency: tactiqueData.TC_Client_Budget_RefCurrency,
            TC_Media_Budget_RefCurrency: tactiqueData.TC_Media_Budget_RefCurrency,
          }
        );
      }
    }
    return newOngletId;
  } catch (error) {
    console.error('❌ Erreur lors de la duplication de l\'onglet:', error);
    throw error;
  }
}

/**
 * Récupère tous les frais configurés pour un client, y compris leurs options.
 * @param clientId L'ID du client.
 * @returns Une promesse qui résout en un tableau d'objets Fee.
 */
export async function getClientFees(clientId: string): Promise<Fee[]> {
  try {
    const feesRef = collection(db, 'clients', clientId, 'fees');
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: getClientFees - Path: clients/${clientId}/fees");
    const q = query(feesRef, orderBy('FE_Order', 'asc'));
    const snapshot = await getDocs(q);
    const fees: Fee[] = [];
    for (const feeDoc of snapshot.docs) {
      const feeData = { id: feeDoc.id, ...feeDoc.data() } as Fee;
      const optionsRef = collection(db, 'clients', clientId, 'fees', feeDoc.id, 'options');
      console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: getClientFees - Path: clients/${clientId}/fees/${feeDoc.id}/options");
      const optionsSnapshot = await getDocs(optionsRef);
      feeData.options = optionsSnapshot.docs.map(optionDoc => ({
        id: optionDoc.id,
        ...optionDoc.data()
      } as FeeOption));
      fees.push(feeData);
    }
    return fees;
  } catch (error) {
    console.error('Erreur lors de la récupération des frais client:', error);
    throw error;
  }
}

/**
 * Récupère la devise principale d'une campagne.
 * Retourne 'CAD' par défaut si la campagne n'est pas trouvée ou si la devise n'est pas définie.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @returns Une promesse qui résout en une chaîne de caractères représentant la devise (ex: 'CAD', 'USD').
 */
export async function getCampaignCurrency(clientId: string, campaignId: string): Promise<string> {
  try {
    const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: getCampaignCurrency - Path: clients/${clientId}/campaigns/${campaignId}");
    const campaignSnap = await getDoc(campaignRef);
    if (!campaignSnap.exists()) {
      console.warn('Campagne non trouvée, devise par défaut: CAD');
      return 'CAD';
    }
    const campaignData = campaignSnap.data();
    return campaignData.currency || 'CAD';
  } catch (error) {
    console.error('Erreur lors de la récupération de la devise de campagne:', error);
    return 'CAD';
  }
}

/**
 * Récupère les taux de change configurés pour un client.
 * @param clientId L'ID du client.
 * @returns Une promesse qui résout en un objet mappant les paires de devises (ex: "USD_CAD") à leurs taux de change.
 */
export async function getExchangeRates(clientId: string): Promise<{ [key: string]: number }> {
  try {
    const ratesRef = collection(db, 'clients', clientId, 'currencies');
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: getExchangeRates - Path: clients/${clientId}/currencies");
    const snapshot = await getDocs(ratesRef);
    const rates: { [key: string]: number } = {};
    snapshot.docs.forEach(doc => {
      const currencyData = doc.data();
      const fromCurrency = currencyData.CU_From;
      const toCurrency = currencyData.CU_To;
      const rate = currencyData.CU_Rate;
      const rateKey = `${fromCurrency}_${toCurrency}`;
      rates[rateKey] = rate;
    });
    return rates;
  } catch (error) {
    console.error('Erreur lors de la récupération des taux de change:', error);
    return {};
  }
}

/**
 * Récupère la devise par défaut ou principale configurée pour un client.
 * Retourne 'CAD' par défaut si le client n'est pas trouvé ou si la devise par défaut n'est pas définie.
 * @param clientId L'ID du client.
 * @returns Une promesse qui résout en une chaîne de caractères représentant la devise par défaut.
 */
export async function getClientDefaultCurrency(clientId: string): Promise<string> {
  try {
    const clientRef = doc(db, 'clients', clientId);
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: getClientDefaultCurrency - Path: clients/${clientId}");
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) {
      return 'CAD';
    }
    const clientData = clientSnap.data();
    return clientData.defaultCurrency || 'CAD';
  } catch (error) {
    console.error('Erreur lors de la récupération de la devise client:', error);
    return 'CAD';
  }
}

/**
 * Vérifie si des types d'unités sont définis pour un client ou pour la plateforme 'PlusCo'.
 * @param clientId L'ID du client.
 * @returns Une promesse qui résout en un booléen indiquant si des types d'unités existent.
 */
export async function hasUnitTypeList(clientId: string): Promise<boolean> {
  try {
    const unitTypesRef = collection(db, 'shortcodes');
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: hasUnitTypeList - Path: shortcodes");
    const q = query(
      unitTypesRef,
      where('SH_Dimension', '==', 'TC_Unit_Type'),
      where('SH_Client_ID', 'in', [clientId, 'PlusCo'])
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Erreur lors de la vérification du type d\'unité:', error);
    return false;
  }
}

/**
 * Récupère la liste des types d'unités disponibles pour un client ou pour la plateforme 'PlusCo'.
 * @param clientId L'ID du client.
 * @returns Une promesse qui résout en un tableau d'objets avec l'ID et le nom d'affichage français du type d'unité.
 */
export async function getUnitTypes(clientId: string): Promise<Array<{ id: string, SH_Display_Name_FR: string }>> {
  try {
    const unitTypesRef = collection(db, 'shortcodes');
    console.log("FIREBASE: LECTURE - Fichier: tactiqueService.ts - Fonction: getUnitTypes - Path: shortcodes");
    const q = query(
      unitTypesRef,
      where('SH_Dimension', '==', 'TC_Unit_Type'),
      where('SH_Client_ID', 'in', [clientId, 'PlusCo']),
      orderBy('SH_Display_Name_FR', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      SH_Display_Name_FR: doc.data().SH_Display_Name_FR
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des types d\'unité:', error);
    return [];
  }
}

export type { Fee, FeeOption };