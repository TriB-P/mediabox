// app/hooks/useCampaignSelection.ts - Version simplifiée pour éviter les boucles infinies

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { getCampaigns } from '../lib/campaignService';
import { getVersions } from '../lib/versionService';
import { Campaign } from '../types/campaign';
import { useDataFlow } from './useDataFlow';

// ==================== TYPES ====================

// 🔥 CORRECTION: Utiliser le type Version cohérent
interface Version {
  id: string;
  name: string;
  isOfficial: boolean; // 🔥 Obligatoire, pas optionnel
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
    enableDebug: false // Désactiver le debug verbeux
  });
  
  // ==================== ÉTATS LOCAUX ====================
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loadedClientId, setLoadedClientId] = useState<string | null>(null);
  const [loadedCampaignId, setLoadedCampaignId] = useState<string | null>(null);
  
  // ==================== OBJETS DÉRIVÉS ====================
  
  const selectedCampaign = useMemo(() => {
    if (!selectedCampaignId || campaigns.length === 0) return null;
    return campaigns.find(c => c.id === selectedCampaignId) || null;
  }, [selectedCampaignId, campaigns]);
  
  const selectedVersion = useMemo(() => {
    if (!selectedVersionId || versions.length === 0) return null;
    return versions.find(v => v.id === selectedVersionId) || null;
  }, [selectedVersionId, versions]);
  
  // ==================== CHARGEMENT DES CAMPAGNES ====================
  
  const loadCampaigns = useCallback(async (clientId: string) => {
    console.log('📋 Chargement campagnes pour:', clientId);
    
    try {
      dataFlow.startRefreshLoading('Chargement des campagnes...');
      
      const campaignsData = await getCampaigns(clientId);
      setCampaigns(campaignsData);
      setLoadedClientId(clientId);
      
      console.log(`✅ ${campaignsData.length} campagnes chargées`);
      
      // 🔥 CORRECTION: Enlever la validation automatique qui cause le reset
      
    } catch (err) {
      console.error('❌ Erreur chargement campagnes:', err);
      dataFlow.setError('Erreur lors du chargement des campagnes');
      setCampaigns([]);
    } finally {
      dataFlow.stopLoading();
    }
  }, [selectedCampaignId, setSelectedCampaignId, dataFlow]);
  
  // ==================== CHARGEMENT DES VERSIONS ====================
  
  const loadVersions = useCallback(async (clientId: string, campaignId: string) => {
    console.log('📝 Chargement versions pour:', campaignId);
    
    try {
      dataFlow.startRefreshLoading('Chargement des versions...');
      
      const versionsData = await getVersions(clientId, campaignId);
      setVersions(versionsData);
      setLoadedCampaignId(campaignId);
      
      console.log(`✅ ${versionsData.length} versions chargées`);
      
      // 🔥 CORRECTION: Enlever la validation automatique qui cause le reset
      
    } catch (err) {
      console.error('❌ Erreur chargement versions:', err);
      dataFlow.setError('Erreur lors du chargement des versions');
      setVersions([]);
    } finally {
      dataFlow.stopLoading();
    }
  }, [selectedVersionId, setSelectedVersionId, dataFlow]);
  
  // ==================== EFFET SIMPLE POUR LE CLIENT ====================
  
  useEffect(() => {
    console.log('🔄 [useEffect-client] Déclenché avec:', {
      clientId: selectedClient?.clientId,
      loadedClientId
    });
    
    if (!selectedClient?.clientId) {
      console.log('🔄 [useEffect-client] Pas de client - reset tout');
      // Pas de client = reset tout
      setCampaigns([]);
      setVersions([]);
      setLoadedClientId(null);
      setLoadedCampaignId(null);
      return;
    }
    
    // Charger uniquement si ce n'est pas déjà le bon client
    if (selectedClient.clientId !== loadedClientId) {
      console.log('🔄 [useEffect-client] Nouveau client détecté:', selectedClient.CL_Name);
      setVersions([]);
      setLoadedCampaignId(null);
      loadCampaigns(selectedClient.clientId);
    } else {
      console.log('🔄 [useEffect-client] Client déjà chargé, skip');
    }
  }, [selectedClient?.clientId, loadedClientId, loadCampaigns]);
  
  // ==================== EFFET SIMPLE POUR LA CAMPAGNE ====================
  
  useEffect(() => {
    console.log('🔄 [useEffect-campaign] Déclenché avec:', {
      clientId: selectedClient?.clientId,
      selectedCampaignId,
      loadedCampaignId
    });
    
    if (!selectedClient?.clientId || !selectedCampaignId) {
      console.log('🔄 [useEffect-campaign] Pas de client/campagne - reset versions si nécessaire');
      // Pas de campagne = reset versions
      if (loadedCampaignId) {
        setVersions([]);
        setLoadedCampaignId(null);
      }
      return;
    }
    
    // Charger uniquement si ce n'est pas déjà la bonne campagne
    if (selectedCampaignId !== loadedCampaignId) {
      console.log('🔄 [useEffect-campaign] Nouvelle campagne détectée:', selectedCampaignId);
      loadVersions(selectedClient.clientId, selectedCampaignId);
    } else {
      console.log('🔄 [useEffect-campaign] Campagne déjà chargée, skip');
    }
  }, [selectedClient?.clientId, selectedCampaignId, loadedCampaignId, loadVersions]);
  
  // ==================== GESTIONNAIRES POUR LE COMPOSANT ====================
  
  const handleCampaignChange = useCallback((campaign: Campaign) => {
    console.log('🎯 [handleCampaignChange] DÉBUT - Sélection campagne:', campaign.CA_Name, 'ID:', campaign.id);
    
    // Vérifier que la campagne existe dans la liste
    const campaignExists = campaigns.find(c => c.id === campaign.id);
    if (!campaignExists) {
      console.error('❌ [handleCampaignChange] Campagne introuvable dans la liste!');
      return;
    }
    
    // 🔥 TEST: Changer l'ordre - d'abord reset version, puis sélectionner campagne
    console.log('🎯 [handleCampaignChange] Appel setSelectedVersionId(null) EN PREMIER');
    setSelectedVersionId(null); // Reset version EN PREMIER
    
    // Attendre le prochain tick pour éviter les conflits
    setTimeout(() => {
      console.log('🎯 [handleCampaignChange] Appel setSelectedCampaignId avec:', campaign.id);
      setSelectedCampaignId(campaign.id);
    }, 0);
    
    console.log('🎯 [handleCampaignChange] FIN');
  }, [campaigns, setSelectedCampaignId, setSelectedVersionId]);
  
  const handleVersionChange = useCallback((version: Version) => {
    console.log('🎯 Sélection version:', version.name);
    
    // Vérifier que la version existe dans la liste
    const versionExists = versions.find(v => v.id === version.id);
    if (!versionExists) {
      console.error('❌ Version introuvable dans la liste!');
      return;
    }
    
    setSelectedVersionId(version.id);
  }, [versions, setSelectedVersionId]);
  
  // ==================== ACTIONS UTILITAIRES ====================
  
  const refreshCampaigns = useCallback(async () => {
    if (selectedClient?.clientId) {
      setLoadedClientId(null); // Force le rechargement
      await loadCampaigns(selectedClient.clientId);
    }
  }, [selectedClient?.clientId, loadCampaigns]);
  
  const refreshVersions = useCallback(async () => {
    if (selectedClient?.clientId && selectedCampaignId) {
      setLoadedCampaignId(null); // Force le rechargement
      await loadVersions(selectedClient.clientId, selectedCampaignId);
    }
  }, [selectedClient?.clientId, selectedCampaignId, loadVersions]);
  
  const clearSelection = useCallback(() => {
    console.log('🧹 Nettoyage complet');
    clearCampaignSelection();
    setCampaigns([]);
    setVersions([]);
    setLoadedClientId(null);
    setLoadedCampaignId(null);
    dataFlow.setError(null);
  }, [clearCampaignSelection, dataFlow]);
  
  // ==================== GESTION D'ERREUR ====================
  
  const hasError = !selectedClient ? false : !!dataFlow.state.error;
  const isLoading = dataFlow.isLoading;
  
  // ==================== DEBUG MINIMAL ====================
  
  useEffect(() => {
    console.log('📊 [État] Changement détecté:', {
      client: selectedClient?.CL_Name,
      campaigns: campaigns.length,
      versions: versions.length,
      selectedCampaignId,
      selectedVersionId,
      selectedCampaign: selectedCampaign?.CA_Name,
      selectedVersion: selectedVersion?.name,
      loading: isLoading
    });
  });
  
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