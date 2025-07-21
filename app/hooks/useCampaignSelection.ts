// app/hooks/useCampaignSelection.ts - Version optimisée sans boucles infinies

import { useState, useEffect, useCallback, useRef } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { getCampaigns } from '../lib/campaignService';
import { getVersions } from '../lib/versionService';
import { Campaign } from '../types/campaign';

// ==================== TYPES ====================

interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

interface UseCampaignSelectionReturn {
  campaigns: Campaign[];
  versions: Version[];
  selectedCampaign: Campaign | null;
  selectedVersion: Version | null;
  loading: boolean;
  error: string | null;
  handleCampaignChange: (campaign: Campaign) => void;
  handleVersionChange: (version: Version) => void;
  refreshCampaigns: () => Promise<void>;
  refreshVersions: () => Promise<void>;
  clearSelection: () => void;
}

// ==================== HOOK PRINCIPAL OPTIMISÉ ====================

export function useCampaignSelection(): UseCampaignSelectionReturn {
  
  // ==================== DÉPENDANCES ====================
  
  const { selectedClient } = useClient();
  const { 
    selectedCampaignId, 
    selectedVersionId, 
    setSelectedCampaignId, 
    setSelectedVersionId,
    clearCampaignSelection 
  } = useSelection();
  
  // ==================== ÉTATS LOCAUX ====================
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ==================== REFS POUR ÉVITER LES BOUCLES ====================
  
  const loadedClientRef = useRef<string | null>(null);
  const loadedCampaignRef = useRef<string | null>(null);
  const loadingCampaignsRef = useRef(false);
  const loadingVersionsRef = useRef(false);
  
  // ==================== FONCTIONS DE CHARGEMENT OPTIMISÉES ====================
  
  const loadCampaigns = useCallback(async (clientId: string, force = false) => {
    // 🔥 PROTECTION : Éviter les appels simultanés
    if (loadingCampaignsRef.current && !force) {
      console.log('⚠️ Chargement campagnes déjà en cours, ignoré');
      return;
    }
    
    // 🔥 PROTECTION : Éviter les rechargements inutiles
    if (loadedClientRef.current === clientId && !force) {
      console.log('✅ Campagnes déjà chargées pour ce client');
      return;
    }
    
    loadingCampaignsRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Chargement campagnes pour client:', clientId);
      
      const campaignsData = await getCampaigns(clientId);
      setCampaigns(campaignsData);
      loadedClientRef.current = clientId;
      
      // 🔥 CORRECTION : Reset versions seulement si changement de client
      if (loadedCampaignRef.current && loadedCampaignRef.current !== selectedCampaignId) {
        setVersions([]);
        loadedCampaignRef.current = null;
      }
      
      console.log('✅ Campagnes chargées:', campaignsData.length);
      
    } catch (err) {
      console.error('❌ Erreur chargement campagnes:', err);
      setError('Erreur lors du chargement des campagnes');
      setCampaigns([]);
    } finally {
      loadingCampaignsRef.current = false;
      setLoading(false);
    }
  }, [selectedCampaignId]);
  
  const loadVersions = useCallback(async (clientId: string, campaignId: string, force = false) => {
    // 🔥 PROTECTION : Éviter les appels simultanés
    if (loadingVersionsRef.current && !force) {
      console.log('⚠️ Chargement versions déjà en cours, ignoré');
      return;
    }
    
    // 🔥 PROTECTION : Éviter les rechargements inutiles
    if (loadedCampaignRef.current === campaignId && !force) {
      console.log('✅ Versions déjà chargées pour cette campagne');
      return;
    }
    
    loadingVersionsRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Chargement versions pour campagne:', campaignId);
      
      const versionsData = await getVersions(clientId, campaignId);
      setVersions(versionsData);
      loadedCampaignRef.current = campaignId;
      
      console.log('✅ Versions chargées:', versionsData.length);
      
    } catch (err) {
      console.error('❌ Erreur chargement versions:', err);
      setError('Erreur lors du chargement des versions');
      setVersions([]);
    } finally {
      loadingVersionsRef.current = false;
      setLoading(false);
    }
  }, []);
  
  // ==================== EFFET SIMPLIFIÉ POUR LE CLIENT ====================
  
  useEffect(() => {
    if (!selectedClient?.clientId) {
      // Reset complet si pas de client
      setCampaigns([]);
      setVersions([]);
      loadedClientRef.current = null;
      loadedCampaignRef.current = null;
      setError(null);
      return;
    }
    
    // Charger uniquement si nécessaire
    loadCampaigns(selectedClient.clientId);
  }, [selectedClient?.clientId, loadCampaigns]);
  
  // ==================== EFFET SIMPLIFIÉ POUR LA CAMPAGNE ====================
  
  useEffect(() => {
    if (!selectedClient?.clientId || !selectedCampaignId) {
      // Reset versions si pas de campagne
      if (loadedCampaignRef.current) {
        setVersions([]);
        loadedCampaignRef.current = null;
      }
      return;
    }
    
    // Charger uniquement si nécessaire
    loadVersions(selectedClient.clientId, selectedCampaignId);
  }, [selectedClient?.clientId, selectedCampaignId, loadVersions]);
  
  // ==================== OBJETS DÉRIVÉS MÉMORISÉS ====================
  
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || null;
  const selectedVersion = versions.find(v => v.id === selectedVersionId) || null;
  
  // ==================== GESTIONNAIRES SIMPLIFIÉS ====================
  
  const handleCampaignChange = useCallback((campaign: Campaign) => {
    console.log('📋 Changement campagne:', campaign.CA_Name);
    
    // 🔥 CORRECTION : Changement synchrone sans setTimeout
    setSelectedVersionId(null); // Reset version d'abord
    setSelectedCampaignId(campaign.id); // Puis changer campagne
  }, [setSelectedCampaignId, setSelectedVersionId]);
  
  const handleVersionChange = useCallback((version: Version) => {
    console.log('📝 Changement version:', version.name);
    setSelectedVersionId(version.id);
  }, [setSelectedVersionId]);
  
  // ==================== ACTIONS UTILITAIRES ====================
  
  const refreshCampaigns = useCallback(async () => {
    if (selectedClient?.clientId) {
      loadedClientRef.current = null; // Force le rechargement
      await loadCampaigns(selectedClient.clientId, true);
    }
  }, [selectedClient?.clientId, loadCampaigns]);
  
  const refreshVersions = useCallback(async () => {
    if (selectedClient?.clientId && selectedCampaignId) {
      loadedCampaignRef.current = null; // Force le rechargement
      await loadVersions(selectedClient.clientId, selectedCampaignId, true);
    }
  }, [selectedClient?.clientId, selectedCampaignId, loadVersions]);
  
  const clearSelection = useCallback(() => {
    clearCampaignSelection();
    setCampaigns([]);
    setVersions([]);
    loadedClientRef.current = null;
    loadedCampaignRef.current = null;
    setError(null);
  }, [clearCampaignSelection]);
  
  // ==================== RETURN ====================
  
  return {
    campaigns,
    versions,
    selectedCampaign,
    selectedVersion,
    loading,
    error: selectedClient ? error : null, // Pas d'erreur si pas de client
    handleCampaignChange,
    handleVersionChange,
    refreshCampaigns,
    refreshVersions,
    clearSelection
  };
}