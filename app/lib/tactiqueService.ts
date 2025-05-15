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
  
  // Obtenir les onglets pour une version spécifique
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
  
  // Obtenir les sections pour un onglet spécifique
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
  
  // Obtenir les tactiques pour une section spécifique
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
  
  // Ajouter une nouvelle section
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
  
  // Mettre à jour une section
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
      
      await updateDoc(sectionRef, {
        ...sectionData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la section:', error);
      throw error;
    }
  }
  
  // Ajouter une nouvelle tactique
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
      
      const docRef = await addDoc(tactiquesRef, {
        ...tactiqueData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la tactique:', error);
      throw error;
    }
  }
  
  // Mettre à jour une tactique
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
      
      await updateDoc(tactiqueRef, {
        ...tactiqueData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tactique:', error);
      throw error;
    }
  }
  
  // Réordonner les sections
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
  
  // Réordonner les tactiques
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
  
  // Déplacer une tactique vers une autre section
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
      // 1. Récupérer la tactique source
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
      
      const tactiqueSnap = await getDoc(tactiqueRef);
      
      if (!tactiqueSnap.exists()) {
        throw new Error('Tactique introuvable');
      }
      
      // 2. Obtenir les données de la tactique
      const tactiqueData = tactiqueSnap.data() as Tactique;
      
      // 3. Créer la tactique dans la nouvelle section
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
      
      await addDoc(newTactiquesRef, {
        ...tactiqueData,
        TC_SectionId: toSectionId,
        TC_Order: newOrder,
        updatedAt: new Date().toISOString()
      });
      
      // 4. Supprimer l'ancienne tactique
      await deleteDoc(tactiqueRef);
      
      // 5. Réordonner les tactiques dans la section source
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
  
  // Supprimer une section et toutes ses tactiques
  export async function deleteSection(
    clientId: string,
    campaignId: string,
    versionId: string,
    ongletId: string,
    sectionId: string
  ): Promise<void> {
    try {
      // 1. Récupérer toutes les tactiques de la section
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
      
      const tactiquesSnapshot = await getDocs(tactiquesRef);
      
      // 2. Supprimer toutes les tactiques
      const batch = writeBatch(db);
      
      tactiquesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 3. Supprimer la section
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
      
      batch.delete(sectionRef);
      
      await batch.commit();
    } catch (error) {
      console.error('Erreur lors de la suppression de la section:', error);
      throw error;
    }
  }
  
  // Supprimer une tactique
  export async function deleteTactique(
    clientId: string,
    campaignId: string,
    versionId: string,
    ongletId: string,
    sectionId: string,
    tactiqueId: string
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
      
      await deleteDoc(tactiqueRef);
      
      // Réordonner les tactiques restantes
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
    } catch (error) {
      console.error('Erreur lors de la suppression de la tactique:', error);
      throw error;
    }
  }