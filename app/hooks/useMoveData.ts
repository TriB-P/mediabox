// app/hooks/useMoveData.ts - Hook pour charger les données de cascade - VERSION CORRIGÉE

import { useCallback } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CascadeItem } from '../types/move';

export function useMoveData(clientId: string) {

  // ==================== CHARGEMENT DES CAMPAGNES ====================

  const loadCampaigns = useCallback(async (): Promise<CascadeItem[]> => {
    if (!clientId) {
      console.warn('loadCampaigns: clientId manquant');
      return [];
    }
    
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
          description: `${data.CA_Status || 'Statut inconnu'} • Budget: ${data.CA_Budget || 0}€`,
          metadata: {
            ...data,
            status: data.CA_Status,
            budget: data.CA_Budget || 0
          }
        };
      });
      
      console.log(`✅ ${campaigns.length} campagnes chargées`);
      return campaigns;
      
    } catch (error) {
      console.error('❌ Erreur chargement campagnes:', error);
      throw new Error(`Impossible de charger les campagnes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [clientId]);

  // ==================== CHARGEMENT DES VERSIONS ====================

  const loadVersions = useCallback(async (campaignId: string): Promise<CascadeItem[]> => {
    if (!clientId || !campaignId) {
      console.warn('loadVersions: clientId ou campaignId manquant', { clientId, campaignId });
      return [];
    }
    
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
          description: data.isOfficial ? '✓ Version officielle' : '📝 Brouillon',
          metadata: {
            ...data,
            isOfficial: data.isOfficial || false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          }
        };
      });
      
      console.log(`✅ ${versions.length} versions chargées`);
      return versions;
      
    } catch (error) {
      console.error('❌ Erreur chargement versions:', error);
      throw new Error(`Impossible de charger les versions: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [clientId]);

  // ==================== CHARGEMENT DES ONGLETS ====================

  const loadOnglets = useCallback(async (campaignId: string, versionId: string): Promise<CascadeItem[]> => {
    if (!clientId || !campaignId || !versionId) {
      console.warn('loadOnglets: paramètres manquants', { clientId, campaignId, versionId });
      return [];
    }
    
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
          description: `Ordre: ${data.ONGLET_Order || 0}`,
          metadata: {
            ...data,
            order: data.ONGLET_Order || 0
          }
        };
      });
      
      console.log(`✅ ${onglets.length} onglets chargés`);
      return onglets;
      
    } catch (error) {
      console.error('❌ Erreur chargement onglets:', error);
      throw new Error(`Impossible de charger les onglets: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [clientId]);

  // ==================== CHARGEMENT DES SECTIONS ====================

  const loadSections = useCallback(async (
    campaignId: string, 
    versionId: string, 
    ongletId: string
  ): Promise<CascadeItem[]> => {
    if (!clientId || !campaignId || !versionId || !ongletId) {
      console.warn('loadSections: paramètres manquants', { clientId, campaignId, versionId, ongletId });
      return [];
    }
    
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
          description: `Budget: ${data.SECTION_Budget || 0}€`,
          metadata: {
            ...data,
            budget: data.SECTION_Budget || 0,
            order: data.SECTION_Order || 0,
            color: data.SECTION_Color
          }
        };
      });
      
      console.log(`✅ ${sections.length} sections chargées`);
      return sections;
      
    } catch (error) {
      console.error('❌ Erreur chargement sections:', error);
      throw new Error(`Impossible de charger les sections: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [clientId]);

  // ==================== CHARGEMENT DES TACTIQUES ====================

  const loadTactiques = useCallback(async (
    campaignId: string, 
    versionId: string, 
    ongletId: string, 
    sectionId: string
  ): Promise<CascadeItem[]> => {
    if (!clientId || !campaignId || !versionId || !ongletId || !sectionId) {
      console.warn('loadTactiques: paramètres manquants', { clientId, campaignId, versionId, ongletId, sectionId });
      return [];
    }
    
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
          description: `Budget: ${data.TC_Budget || 0}€`,
          metadata: {
            ...data,
            budget: data.TC_Budget || 0,
            order: data.TC_Order || 0,
            publisher: data.TC_Publisher,
            sectionId: sectionId // Ajout pour traçabilité
          }
        };
      });
      
      console.log(`✅ ${tactiques.length} tactiques chargées`);
      return tactiques;
      
    } catch (error) {
      console.error('❌ Erreur chargement tactiques:', error);
      throw new Error(`Impossible de charger les tactiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
    if (!clientId || !campaignId || !versionId || !ongletId || !sectionId || !tactiqueId) {
      console.warn('loadPlacements: paramètres manquants', { 
        clientId, campaignId, versionId, ongletId, sectionId, tactiqueId 
      });
      return [];
    }
    
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
          description: `Ordre: ${data.PL_Order || 0}`,
          metadata: {
            ...data,
            order: data.PL_Order || 0,
            tactiqueId: tactiqueId, // Ajout pour traçabilité
            sectionId: sectionId    // Ajout pour traçabilité
          }
        };
      });
      
      console.log(`✅ ${placements.length} placements chargés`);
      return placements;
      
    } catch (error) {
      console.error('❌ Erreur chargement placements:', error);
      throw new Error(`Impossible de charger les placements: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
    try {
      console.log(`🔄 Chargement niveau: ${level}`, { 
        campaignId, versionId, ongletId, sectionId, tactiqueId 
      });
      
      switch (level) {
        case 'campaign':
          return loadCampaigns();
          
        case 'version':
          if (!campaignId) throw new Error('Campaign ID requis pour charger les versions');
          return loadVersions(campaignId);
          
        case 'onglet':
          if (!campaignId || !versionId) {
            throw new Error('Campaign ID et Version ID requis pour charger les onglets');
          }
          return loadOnglets(campaignId, versionId);
          
        case 'section':
          if (!campaignId || !versionId || !ongletId) {
            throw new Error('Campaign ID, Version ID et Onglet ID requis pour charger les sections');
          }
          return loadSections(campaignId, versionId, ongletId);
          
        case 'tactique':
          if (!campaignId || !versionId || !ongletId || !sectionId) {
            throw new Error('Tous les IDs parents requis pour charger les tactiques');
          }
          return loadTactiques(campaignId, versionId, ongletId, sectionId);
          
        case 'placement':
          if (!campaignId || !versionId || !ongletId || !sectionId || !tactiqueId) {
            throw new Error('Tous les IDs parents requis pour charger les placements');
          }
          return loadPlacements(campaignId, versionId, ongletId, sectionId, tactiqueId);
          
        default:
          console.warn(`Niveau inconnu: ${level}`);
          return [];
      }
    } catch (error) {
      console.error(`❌ Erreur chargement niveau ${level}:`, error);
      throw error; // Re-throw pour que l'appelant puisse gérer
    }
  }, [loadCampaigns, loadVersions, loadOnglets, loadSections, loadTactiques, loadPlacements]);

  // ==================== FONCTION UTILITAIRE POUR VÉRIFIER LA VALIDITÉ ====================

  const validateLevel = useCallback((level: string): boolean => {
    const validLevels = ['campaign', 'version', 'onglet', 'section', 'tactique', 'placement'];
    return validLevels.includes(level);
  }, []);

  // ==================== RETURN ====================

  return {
    // Fonctions spécifiques
    loadCampaigns,
    loadVersions,
    loadOnglets,
    loadSections,
    loadTactiques,
    loadPlacements,
    
    // Fonction générique
    loadDataForLevel,
    
    // Utilitaires
    validateLevel
  };
}

export default useMoveData;