// app/hooks/useMoveData.ts - Hook pour charger les données de cascade

import { useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CascadeItem } from '../types/move';

export function useMoveData(clientId: string) {

  // ==================== CHARGEMENT DES CAMPAGNES ====================

  const loadCampaigns = useCallback(async (): Promise<CascadeItem[]> => {
    if (!clientId) return [];
    
    try {
      const campaignsRef = collection(db, 'clients', clientId, 'campaigns');
      const q = query(campaignsRef, orderBy('CA_Name', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.CA_Name || 'Campagne sans nom',
          description: `${data.CA_Status || ''} • Budget: ${data.CA_Budget || 0}`,
          metadata: data
        };
      });
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
      throw error;
    }
  }, [clientId]);

  // ==================== CHARGEMENT DES VERSIONS ====================

  const loadVersions = useCallback(async (campaignId: string): Promise<CascadeItem[]> => {
    if (!clientId || !campaignId) return [];
    
    try {
      const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions');
      const q = query(versionsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Version sans nom',
          description: data.isOfficial ? 'Version officielle' : 'Brouillon',
          metadata: data
        };
      });
    } catch (error) {
      console.error('Erreur chargement versions:', error);
      throw error;
    }
  }, [clientId]);

  // ==================== CHARGEMENT DES ONGLETS ====================

  const loadOnglets = useCallback(async (campaignId: string, versionId: string): Promise<CascadeItem[]> => {
    if (!clientId || !campaignId || !versionId) return [];
    
    try {
      const ongletsRef = collection(
        db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets'
      );
      const q = query(ongletsRef, orderBy('ONGLET_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.ONGLET_Name || 'Onglet sans nom',
          description: `Ordre: ${data.ONGLET_Order || 0}`,
          metadata: data
        };
      });
    } catch (error) {
      console.error('Erreur chargement onglets:', error);
      throw error;
    }
  }, [clientId]);

  // ==================== CHARGEMENT DES SECTIONS ====================

  const loadSections = useCallback(async (
    campaignId: string, 
    versionId: string, 
    ongletId: string
  ): Promise<CascadeItem[]> => {
    if (!clientId || !campaignId || !versionId || !ongletId) return [];
    
    try {
      const sectionsRef = collection(
        db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId,
        'onglets', ongletId, 'sections'
      );
      const q = query(sectionsRef, orderBy('SECTION_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.SECTION_Name || 'Section sans nom',
          description: `Budget: ${data.SECTION_Budget || 0}`,
          metadata: data
        };
      });
    } catch (error) {
      console.error('Erreur chargement sections:', error);
      throw error;
    }
  }, [clientId]);

  // ==================== CHARGEMENT DES TACTIQUES ====================

  const loadTactiques = useCallback(async (
    campaignId: string, 
    versionId: string, 
    ongletId: string, 
    sectionId: string
  ): Promise<CascadeItem[]> => {
    if (!clientId || !campaignId || !versionId || !ongletId || !sectionId) return [];
    
    try {
      const tactiquesRef = collection(
        db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId,
        'onglets', ongletId, 'sections', sectionId, 'tactiques'
      );
      const q = query(tactiquesRef, orderBy('TC_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.TC_Label || 'Tactique sans nom',
          description: `Budget: ${data.TC_Budget || 0}`,
          metadata: data
        };
      });
    } catch (error) {
      console.error('Erreur chargement tactiques:', error);
      throw error;
    }
  }, [clientId]);

  // ==================== CHARGEMENT DES PLACEMENTS ====================

  const loadPlacements = useCallback(async (
    campaignId: string, 
    versionId: string, 
    ongletId: string, 
    sectionId: string, 
    tactiqueId: string
  ): Promise<CascadeItem[]> => {
    if (!clientId || !campaignId || !versionId || !ongletId || !sectionId || !tactiqueId) return [];
    
    try {
      const placementsRef = collection(
        db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId,
        'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements'
      );
      const q = query(placementsRef, orderBy('PL_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.PL_Label || 'Placement sans nom',
          description: `Ordre: ${data.PL_Order || 0}`,
          metadata: data
        };
      });
    } catch (error) {
      console.error('Erreur chargement placements:', error);
      throw error;
    }
  }, [clientId]);

  // ==================== FONCTION GÉNÉRIQUE DE CHARGEMENT ====================

  const loadDataForLevel = useCallback(async (
    level: string,
    campaignId?: string,
    versionId?: string,
    ongletId?: string,
    sectionId?: string,
    tactiqueId?: string
  ): Promise<CascadeItem[]> => {
    switch (level) {
      case 'campaign':
        return loadCampaigns();
      case 'version':
        return campaignId ? loadVersions(campaignId) : [];
      case 'onglet':
        return (campaignId && versionId) ? loadOnglets(campaignId, versionId) : [];
      case 'section':
        return (campaignId && versionId && ongletId) ? 
          loadSections(campaignId, versionId, ongletId) : [];
      case 'tactique':
        return (campaignId && versionId && ongletId && sectionId) ? 
          loadTactiques(campaignId, versionId, ongletId, sectionId) : [];
      case 'placement':
        return (campaignId && versionId && ongletId && sectionId && tactiqueId) ? 
          loadPlacements(campaignId, versionId, ongletId, sectionId, tactiqueId) : [];
      default:
        return [];
    }
  }, [loadCampaigns, loadVersions, loadOnglets, loadSections, loadTactiques, loadPlacements]);

  // ==================== RETURN ====================

  return {
    loadCampaigns,
    loadVersions,
    loadOnglets,
    loadSections,
    loadTactiques,
    loadPlacements,
    loadDataForLevel
  };
}

export default useMoveData;