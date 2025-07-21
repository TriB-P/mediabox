// app/hooks/useAppData.ts - Version corrigée avec mémoire des sélections

import { useState, useEffect, useCallback, useRef } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { getCampaigns } from '../lib/campaignService';
import { getVersions } from '../lib/versionService';
import { getOnglets, getSections, getTactiques } from '../lib/tactiqueService';
import { getPlacementsForTactique } from '../lib/placementService';
import { getCreatifsForPlacement } from '../lib/creatifService';

// ==================== TYPES ====================

interface AppData {
  // Campagnes
  campaigns: any[];
  versions: any[];
  selectedCampaign: any | null;
  selectedVersion: any | null;
  
  // Tactiques  
  onglets: any[];
  selectedOnglet: any | null;
  sections: any[];
  tactiques: { [sectionId: string]: any[] };
  placements: { [tactiqueId: string]: any[] };
  creatifs: { [placementId: string]: any[] };
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  stage: string | null;
}

// ==================== HOOK PRINCIPAL CORRIGÉ ====================

export function useAppData() {
  const { selectedClient } = useClient();
  const { 
    selectedCampaignId, 
    selectedVersionId, 
    selectedOngletId,
    setSelectedCampaignId,
    setSelectedVersionId,
    setSelectedOngletId 
  } = useSelection();

  // ==================== ÉTATS ====================
  
  const [data, setData] = useState<AppData>({
    campaigns: [],
    versions: [],
    selectedCampaign: null,
    selectedVersion: null,
    onglets: [],
    selectedOnglet: null,
    sections: [],
    tactiques: {},
    placements: {},
    creatifs: {}
  });
  
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
    stage: null
  });
  
  // ==================== REFS POUR ÉVITER LES DOUBLONS ====================
  
  const loadedContextRef = useRef<string>('');
  const isLoadingRef = useRef(false);
  
  // ==================== FONCTION DE CHARGEMENT SÉQUENTIEL ====================
  
  const loadAllData = useCallback(async () => {
    if (!selectedClient?.clientId) {
      // Reset si pas de client
      setData({
        campaigns: [],
        versions: [],
        selectedCampaign: null,
        selectedVersion: null,
        onglets: [],
        selectedOnglet: null,
        sections: [],
        tactiques: {},
        placements: {},
        creatifs: {}
      });
      return;
    }

    const contextKey = `${selectedClient.clientId}-${selectedCampaignId || ''}-${selectedVersionId || ''}-${selectedOngletId || ''}`;
    
    // 🔥 PROTECTION : Éviter les doublons
    if (isLoadingRef.current || loadedContextRef.current === contextKey) {
      console.log('⚠️ Chargement déjà fait ou en cours, skip');
      return;
    }
    
    isLoadingRef.current = true;
    setLoading({ isLoading: true, error: null, stage: 'Démarrage...' });
    
    try {
      
      // ==================== ÉTAPE 1 : CAMPAGNES ====================
      
      setLoading(prev => ({ ...prev, stage: 'Chargement des campagnes...' }));
      
      const campaigns = await getCampaigns(selectedClient.clientId);
      
      // 🔥 CORRECTION : Utiliser les IDs du contexte, pas auto-sélection
      const selectedCampaign = selectedCampaignId 
        ? campaigns.find(c => c.id === selectedCampaignId) || null
        : null;
      
      setData(prev => ({ ...prev, campaigns, selectedCampaign }));
      
      // ==================== ÉTAPE 2 : VERSIONS ====================
      
      if (selectedCampaignId) {
        setLoading(prev => ({ ...prev, stage: 'Chargement des versions...' }));
        
        const versions = await getVersions(selectedClient.clientId, selectedCampaignId);
        
        // 🔥 CORRECTION : Utiliser l'ID du contexte
        const selectedVersion = selectedVersionId 
          ? versions.find(v => v.id === selectedVersionId) || null
          : null;
        
        setData(prev => ({ ...prev, versions, selectedVersion }));
        
        // ==================== ÉTAPE 3 : ONGLETS ====================
        
        if (selectedVersionId) {
          setLoading(prev => ({ ...prev, stage: 'Chargement des onglets...' }));
          
          const onglets = await getOnglets(selectedClient.clientId, selectedCampaignId, selectedVersionId);
          
          // 🔥 CORRECTION : Si pas d'onglet sélectionné, auto-sélectionner le premier
          let currentOngletId = selectedOngletId;
          if (!currentOngletId && onglets.length > 0) {
            currentOngletId = onglets[0].id;
            setSelectedOngletId(currentOngletId); // 🔥 SAUVEGARDER dans le contexte
          }
          
          const selectedOnglet = currentOngletId 
            ? onglets.find(o => o.id === currentOngletId) || null
            : null;
            
          setData(prev => ({ ...prev, onglets, selectedOnglet }));
          
          // ==================== ÉTAPE 4 : SECTIONS ====================
          
          if (currentOngletId) {
            setLoading(prev => ({ ...prev, stage: 'Chargement des sections...' }));
            
            const sections = await getSections(
              selectedClient.clientId, 
              selectedCampaignId, 
              selectedVersionId, 
              currentOngletId
            );
            
            setData(prev => ({ ...prev, sections }));
            
            // ==================== ÉTAPE 5 : TACTIQUES ====================
            
            setLoading(prev => ({ ...prev, stage: 'Chargement des tactiques...' }));
            
            const tactiques: { [sectionId: string]: any[] } = {};
            for (const section of sections) {
              const sectionTactiques = await getTactiques(
                selectedClient.clientId,
                selectedCampaignId,
                selectedVersionId,
                currentOngletId,
                section.id
              );
              tactiques[section.id] = sectionTactiques;
            }
            
            setData(prev => ({ ...prev, tactiques }));
            
            // ==================== ÉTAPE 6 : PLACEMENTS ====================
            
            setLoading(prev => ({ ...prev, stage: 'Chargement des placements...' }));
            
            const placements: { [tactiqueId: string]: any[] } = {};
            for (const [sectionId, sectionTactiques] of Object.entries(tactiques)) {
              for (const tactique of sectionTactiques) {
                const tactiquePlacements = await getPlacementsForTactique(
                  selectedClient.clientId,
                  selectedCampaignId,
                  selectedVersionId,
                  currentOngletId,
                  sectionId,
                  tactique.id
                );
                placements[tactique.id] = tactiquePlacements;
              }
            }
            
            setData(prev => ({ ...prev, placements }));
            
            // ==================== ÉTAPE 7 : CRÉATIFS ====================
            
            setLoading(prev => ({ ...prev, stage: 'Chargement des créatifs...' }));
            
            const creatifs: { [placementId: string]: any[] } = {};
            for (const [tactiqueId, tactiquePlacements] of Object.entries(placements)) {
              for (const placement of tactiquePlacements) {
                const sectionId = Object.keys(tactiques).find(sId => 
                  tactiques[sId].some((t: any) => t.id === tactiqueId)
                );
                
                if (sectionId) {
                  const placementCreatifs = await getCreatifsForPlacement(
                    selectedClient.clientId,
                    selectedCampaignId,
                    selectedVersionId,
                    currentOngletId,
                    sectionId,
                    tactiqueId,
                    placement.id
                  );
                  creatifs[placement.id] = placementCreatifs;
                }
              }
            }
            
            setData(prev => ({ ...prev, creatifs }));
          }
        }
      }
      
      loadedContextRef.current = contextKey;
      console.log('✅ Toutes les données chargées avec succès');
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement:', err);
      setLoading(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Erreur de chargement' 
      }));
    } finally {
      isLoadingRef.current = false;
      setLoading(prev => ({ ...prev, isLoading: false, stage: null }));
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, setSelectedOngletId]);
  
  // ==================== EFFET UNIQUE ====================
  
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
  
  // ==================== ACTIONS CORRIGÉES ====================
  
  const handleCampaignChange = useCallback((campaign: any) => {
    console.log('📋 Changement campagne:', campaign.CA_Name);
    // 🔥 CORRECTION : Sauvegarder dans le contexte (qui sauvegarde dans localStorage)
    setSelectedVersionId(null); // Reset version
    setSelectedCampaignId(campaign.id);
    // Le rechargement se fait automatiquement via l'effet
  }, [setSelectedCampaignId, setSelectedVersionId]);
  
  const handleVersionChange = useCallback((version: any) => {
    console.log('📝 Changement version:', version.name);
    // 🔥 CORRECTION : Sauvegarder dans le contexte
    setSelectedVersionId(version.id);
    // Le rechargement se fait automatiquement via l'effet
  }, [setSelectedVersionId]);
  
  const handleOngletChange = useCallback((onglet: any) => {
    console.log('🎯 Changement onglet:', onglet.ONGLET_Name);
    // 🔥 CORRECTION : Sauvegarder dans le contexte
    setSelectedOngletId(onglet.id);
    // Le rechargement se fait automatiquement via l'effet
  }, [setSelectedOngletId]);
  
  const refresh = useCallback(() => {
    loadedContextRef.current = ''; // Force le rechargement
    loadAllData();
  }, [loadAllData]);
  
  // ==================== RETURN ====================
  
  return {
    ...data,
    loading: loading.isLoading,
    error: loading.error,
    stage: loading.stage,
    handleCampaignChange,
    handleVersionChange,
    handleOngletChange,
    refresh
  };
}