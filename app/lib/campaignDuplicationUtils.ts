// app/lib/campaignDuplicationUtils.ts

import {
    collection,
    doc,
    getDocs,
    addDoc,
    query,
    orderBy,
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  // Dupliquer les breakdowns
  export async function duplicateBreakdowns(
    clientId: string,
    sourceCampaignId: string,
    newCampaignId: string
  ): Promise<void> {
    try {
      const breakdownsRef = collection(db, 'clients', clientId, 'campaigns', sourceCampaignId, 'breakdowns');
      const q = query(breakdownsRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      
      const newBreakdownsRef = collection(db, 'clients', clientId, 'campaigns', newCampaignId, 'breakdowns');
      
      for (const breakdownDoc of snapshot.docs) {
        const breakdownData = breakdownDoc.data();
        const newBreakdownData = {
          ...breakdownData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await addDoc(newBreakdownsRef, newBreakdownData);
      }
      
      console.log('Breakdowns dupliqués avec succès');
    } catch (error) {
      console.error('Erreur lors de la duplication des breakdowns:', error);
      throw error;
    }
  }
  
  // Dupliquer les onglets
  export async function duplicateOnglets(
    clientId: string,
    sourceCampaignId: string,
    newCampaignId: string
  ): Promise<void> {
    try {
      const ongletsRef = collection(db, 'clients', clientId, 'campaigns', sourceCampaignId, 'onglets');
      const q = query(ongletsRef, orderBy('ONGLET_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('Aucun onglet à dupliquer');
        return;
      }
      
      const newOngletsRef = collection(db, 'clients', clientId, 'campaigns', newCampaignId, 'onglets');
      
      for (const ongletDoc of snapshot.docs) {
        const ongletData = ongletDoc.data();
        await addDoc(newOngletsRef, ongletData);
      }
      
      console.log('Onglets dupliqués avec succès');
    } catch (error) {
      console.error('Erreur lors de la duplication des onglets:', error);
      // Ne pas faire échouer la duplication si les onglets ne peuvent pas être copiés
    }
  }
  
  // Dupliquer les sections et tactiques
  export async function duplicateSectionsAndTactiques(
    clientId: string,
    sourceCampaignId: string,
    newCampaignId: string
  ): Promise<void> {
    try {
      // Dupliquer les sections d'abord
      const sectionsMap = await duplicateSections(clientId, sourceCampaignId, newCampaignId);
      
      // Puis dupliquer les tactiques avec les nouveaux IDs de sections
      await duplicateTactiques(clientId, sourceCampaignId, newCampaignId, sectionsMap);
      
      console.log('Sections et tactiques dupliquées avec succès');
    } catch (error) {
      console.error('Erreur lors de la duplication des sections et tactiques:', error);
      throw error;
    }
  }
  
  // Dupliquer les sections et retourner un mapping des anciens vers nouveaux IDs
  async function duplicateSections(
    clientId: string,
    sourceCampaignId: string,
    newCampaignId: string
  ): Promise<Map<string, string>> {
    const sectionsMap = new Map<string, string>();
    
    try {
      const sectionsRef = collection(db, 'clients', clientId, 'campaigns', sourceCampaignId, 'sections');
      const q = query(sectionsRef, orderBy('SECTION_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      const newSectionsRef = collection(db, 'clients', clientId, 'campaigns', newCampaignId, 'sections');
      
      for (const sectionDoc of snapshot.docs) {
        const sectionData = sectionDoc.data();
        const newSectionRef = await addDoc(newSectionsRef, sectionData);
        sectionsMap.set(sectionDoc.id, newSectionRef.id);
      }
      
      console.log('Sections dupliquées:', sectionsMap.size);
    } catch (error) {
      console.error('Erreur lors de la duplication des sections:', error);
      throw error;
    }
    
    return sectionsMap;
  }
  
  // Dupliquer les tactiques avec les nouveaux IDs de sections
  async function duplicateTactiques(
    clientId: string,
    sourceCampaignId: string,
    newCampaignId: string,
    sectionsMap: Map<string, string>
  ): Promise<void> {
    try {
      const tactiquesRef = collection(db, 'clients', clientId, 'campaigns', sourceCampaignId, 'tactiques');
      const q = query(tactiquesRef, orderBy('TC_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      const newTactiquesRef = collection(db, 'clients', clientId, 'campaigns', newCampaignId, 'tactiques');
      const tactiquesMap = new Map<string, string>();
      
      for (const tactiqueDoc of snapshot.docs) {
        const tactiqueData = tactiqueDoc.data();
        
        // Mettre à jour l'ID de section avec le nouveau
        if (tactiqueData.TC_SectionId && sectionsMap.has(tactiqueData.TC_SectionId)) {
          tactiqueData.TC_SectionId = sectionsMap.get(tactiqueData.TC_SectionId);
        }
        
        const newTactiqueRef = await addDoc(newTactiquesRef, tactiqueData);
        tactiquesMap.set(tactiqueDoc.id, newTactiqueRef.id);
      }
      
      // Dupliquer les placements pour chaque tactique
      await duplicateAllPlacements(clientId, sourceCampaignId, newCampaignId, tactiquesMap);
      
      console.log('Tactiques dupliquées:', tactiquesMap.size);
    } catch (error) {
      console.error('Erreur lors de la duplication des tactiques:', error);
      throw error;
    }
  }
  
  // Dupliquer tous les placements
  async function duplicateAllPlacements(
    clientId: string,
    sourceCampaignId: string,
    newCampaignId: string,
    tactiquesMap: Map<string, string>
  ): Promise<void> {
    try {
      const placementsRef = collection(db, 'clients', clientId, 'campaigns', sourceCampaignId, 'placements');
      const snapshot = await getDocs(placementsRef);
      
      const newPlacementsRef = collection(db, 'clients', clientId, 'campaigns', newCampaignId, 'placements');
      const placementsMap = new Map<string, string>();
      
      for (const placementDoc of snapshot.docs) {
        const placementData = placementDoc.data();
        
        // Mettre à jour l'ID de tactique avec le nouveau
        if (placementData.PL_TactiqueId && tactiquesMap.has(placementData.PL_TactiqueId)) {
          placementData.PL_TactiqueId = tactiquesMap.get(placementData.PL_TactiqueId);
        }
        
        const newPlacementRef = await addDoc(newPlacementsRef, placementData);
        placementsMap.set(placementDoc.id, newPlacementRef.id);
      }
      
      // Dupliquer les créatifs pour chaque placement
      await duplicateAllCreatifs(clientId, sourceCampaignId, newCampaignId, placementsMap);
      
      console.log('Placements dupliqués:', placementsMap.size);
    } catch (error) {
      console.error('Erreur lors de la duplication des placements:', error);
      // Ne pas faire échouer si les placements n'existent pas
    }
  }
  
  // Dupliquer tous les créatifs
  async function duplicateAllCreatifs(
    clientId: string,
    sourceCampaignId: string,
    newCampaignId: string,
    placementsMap: Map<string, string>
  ): Promise<void> {
    try {
      const creatifsRef = collection(db, 'clients', clientId, 'campaigns', sourceCampaignId, 'creatifs');
      const snapshot = await getDocs(creatifsRef);
      
      const newCreatifsRef = collection(db, 'clients', clientId, 'campaigns', newCampaignId, 'creatifs');
      
      for (const creatifDoc of snapshot.docs) {
        const creatifData = creatifDoc.data();
        
        // Mettre à jour l'ID de placement avec le nouveau
        if (creatifData.CR_PlacementId && placementsMap.has(creatifData.CR_PlacementId)) {
          creatifData.CR_PlacementId = placementsMap.get(creatifData.CR_PlacementId);
        }
        
        await addDoc(newCreatifsRef, creatifData);
      }
      
      console.log('Créatifs dupliqués avec succès');
    } catch (error) {
      console.error('Erreur lors de la duplication des créatifs:', error);
      // Ne pas faire échouer si les créatifs n'existent pas
    }
  }