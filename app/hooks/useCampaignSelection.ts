// app/hooks/useCampaignSelection.ts - Version simplifiée focalisée sur le data fetching

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { getCampaigns } from '../lib/campaignService';
import { getVersions } from '../lib/versionService';
import { Campaign } from '../types/campaign';
import { useDataFlow } from './useDataFlow';

// ==================== TYPES ====================

interface Version {
  id: string;
  name: string;
  isOfficial?: boolean;
  createdAt: string;
  createdBy: string;
}

interface UseCampaignSelectionReturn {
  // Données chargées
  campaigns: Campaign[];
  versions: Version[];
  
  // États dérivés pour le composant CampaignVersionSelector
  selectedCampaign: Campaign | null;
  selectedVersion: Version | null;
  
  // États de chargement (délégués à useDataFlow)
  loading: boolean;
  error: string | null;
  
  // Actions pour CampaignVersionSelector
  handleCampaignChange: (campaign: Campaign) => void;
  handleVersionChange: (version: Version) => void;
  
  // Actions utilitaires
  refreshCampaigns: () => Promise<void>;
  refreshVersions: () => Promise<void>;
  clearSelection: () => void;
}

// ==================== HOOK PRINCIPAL ====================

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
  
  const dataFlow = useDataFlow({ 
    enableDebug: process.env.NODE_ENV === 'development' 
  });
  
  // ==================== ÉTATS LOCAUX ====================
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);
  const [versionsLoaded, setVersionsLoaded] = useState(false);
  
  // ==================== OBJETS DÉRIVÉS ====================
  
  // Retrouver les objets complets depuis les IDs stockés dans SelectionContext
  const selectedCampaign = useMemo(() => {
    if (!selectedCampaignId || campaigns.length === 0) return null;
    return campaigns.find(c => c.id === selectedCampaignId) || null;
  }, [selectedCampaignId, campaigns]);
  
  const selectedVersion = useMemo(() => {
    if (!selectedVersionId || versions.length === 0) return null;
    return versions.find(v => v.id === selectedVersionId) || null;
  }, [selectedVersionId, versions]);
  
  // ==================== CHARGEMENT DES CAMPAGNES ====================
  
  const loadCampaigns = useCallback(async () => {
    if (!selectedClient?.clientId) {
      setCampaigns([]);
      setCampaignsLoaded(true);
      return;
    }
    
    try {
      console.log('📋 Chargement des campagnes pour le client:', selectedClient.CL_Name);
      dataFlow.startRefreshLoading('Chargement des campagnes...');
      
      const campaignsData = await getCampaigns(selectedClient.clientId);
      setCampaigns(campaignsData);
      setCampaignsLoaded(true);
      
      console.log(`✅ ${campaignsData.length} campagnes chargées`);
      
      // Validation de la campagne sélectionnée
      if (selectedCampaignId) {
        const campaignExists = campaignsData.find(c => c.id === selectedCampaignId);
        if (!campaignExists) {
          console.log('⚠️ Campagne sélectionnée introuvable, reset sélection');
          setSelectedCampaignId(null);
        }
      }
      
    } catch (err) {
      console.error('❌ Erreur chargement campagnes:', err);
      dataFlow.setError('Erreur lors du chargement des campagnes');
      setCampaigns([]);
      setCampaignsLoaded(true);
    } finally {
      dataFlow.stopLoading();
    }
  }, [selectedClient?.clientId, selectedCampaignId, setSelectedCampaignId, dataFlow]);
  
  // ==================== CHARGEMENT DES VERSIONS ====================
  
  const loadVersions = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaignId) {
      setVersions([]);
      setVersionsLoaded(true);
      return;
    }
    
    try {
      console.log('📝 Chargement des versions pour la campagne:', selectedCampaignId);
      dataFlow.startRefreshLoading('Chargement des versions...');
      
      const versionsData = await getVersions(selectedClient.clientId, selectedCampaignId);
      setVersions(versionsData);
      setVersionsLoaded(true);
      
      console.log(`✅ ${versionsData.length} versions chargées`);
      
      // Validation de la version sélectionnée
      if (selectedVersionId) {
        const versionExists = versionsData.find(v => v.id === selectedVersionId);
        if (!versionExists) {
          console.log('⚠️ Version sélectionnée introuvable, reset sélection');
          setSelectedVersionId(null);
        }
      }
      
    } catch (err) {
      console.error('❌ Erreur chargement versions:', err);
      dataFlow.setError('Erreur lors du chargement des versions');
      setVersions([]);
      setVersionsLoaded(true);
    } finally {
      dataFlow.stopLoading();
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, setSelectedVersionId, dataFlow]);
  
  // ==================== EFFETS DE CHARGEMENT ====================
  
  // Chargement initial des campagnes quand le client change
  useEffect(() => {
    setCampaignsLoaded(false);
    setVersionsLoaded(false);
    loadCampaigns();
  }, [selectedClient?.clientId]);
  
  // Chargement des versions quand la campagne change
  useEffect(() => {
    if (campaignsLoaded) {
      setVersionsLoaded(false);
      loadVersions();
    }
  }, [selectedCampaignId, campaignsLoaded]);
  
  // ==================== GESTIONNAIRES POUR LE COMPOSANT ====================
  
  const handleCampaignChange = useCallback((campaign: Campaign) => {
    console.log('🎯 Changement de campagne:', campaign.CA_Name);
    
    // Mettre à jour la sélection
    setSelectedCampaignId(campaign.id);
    
    // Reset la version automatiquement
    setSelectedVersionId(null);
    setVersions([]);
    setVersionsLoaded(false);
    
  }, [setSelectedCampaignId, setSelectedVersionId]);
  
  const handleVersionChange = useCallback((version: Version) => {
    console.log('🎯 Changement de version:', version.name);
    setSelectedVersionId(version.id);
  }, [setSelectedVersionId]);
  
  // ==================== ACTIONS UTILITAIRES ====================
  
  const refreshCampaigns = useCallback(async () => {
    console.log('🔄 Refresh manuel des campagnes');
    setCampaignsLoaded(false);
    await loadCampaigns();
  }, [loadCampaigns]);
  
  const refreshVersions = useCallback(async () => {
    console.log('🔄 Refresh manuel des versions');
    setVersionsLoaded(false);
    await loadVersions();
  }, [loadVersions]);
  
  const clearSelection = useCallback(() => {
    console.log('🧹 Nettoyage de la sélection');
    clearCampaignSelection();
    setCampaigns([]);
    setVersions([]);
    setCampaignsLoaded(false);
    setVersionsLoaded(false);
    dataFlow.setError(null);
  }, [clearCampaignSelection, dataFlow]);
  
  // ==================== GESTION D'ERREUR SIMPLIFIÉE ====================
  
  // Si pas de client, pas d'erreur - c'est normal
  const hasError = !selectedClient ? false : !!dataFlow.state.error;
  const isLoading = dataFlow.isLoading;
  
  // ==================== LOGS DE DEBUG ====================
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 État useCampaignSelection:', {
        client: selectedClient?.CL_Name || 'Aucun',
        campaigns: campaigns.length,
        versions: versions.length,
        selectedCampaign: selectedCampaign?.CA_Name || 'Aucune',
        selectedVersion: selectedVersion?.name || 'Aucune',
        campaignsLoaded,
        versionsLoaded,
        loading: isLoading,
        error: dataFlow.state.error
      });
    }
  }, [
    selectedClient, campaigns.length, versions.length, 
    selectedCampaign, selectedVersion, campaignsLoaded, 
    versionsLoaded, isLoading, dataFlow.state.error
  ]);
  
  // ==================== RETURN ====================
  
  return {
    // Données
    campaigns,
    versions,
    
    // États dérivés
    selectedCampaign,
    selectedVersion,
    
    // États de chargement
    loading: isLoading,
    error: hasError ? dataFlow.state.error : null,
    
    // Actions pour CampaignVersionSelector
    handleCampaignChange,
    handleVersionChange,
    
    // Actions utilitaires
    refreshCampaigns,
    refreshVersions,
    clearSelection
  };
}

// ==================== HOOK UTILITAIRE ====================

/**
 * Hook simplifié pour juste récupérer les données sans gestion d'état
 */
export function useCampaignData(clientId?: string) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadCampaigns = useCallback(async () => {
    if (!clientId) {
      setCampaigns([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await getCampaigns(clientId);
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);
  
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);
  
  return { campaigns, loading, error, refresh: loadCampaigns };
}