/**
 * Ce hook gère la sélection des campagnes et de leurs versions associées pour un client donné.
 * Il s'occupe du chargement des données depuis Firebase, de la gestion des états de chargement et d'erreur,
 * et de la mise à jour des sélections via les contextes appropriés.
 * Il est conçu pour éviter les rechargements inutiles et les boucles infinies.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { getCampaigns } from '../lib/campaignService';
import { getVersions } from '../lib/versionService';
import { Campaign } from '../types/campaign';

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

/**
 * Hook personnalisé pour gérer la sélection des campagnes et des versions.
 *
 * @returns {UseCampaignSelectionReturn} Un objet contenant les campagnes, les versions,
 * la campagne et la version sélectionnées, l'état de chargement, les erreurs,
 * et les fonctions pour gérer les changements et rafraîchir les données.
 */
export function useCampaignSelection(): UseCampaignSelectionReturn {
  const { selectedClient } = useClient();
  const { 
    selectedCampaignId, 
    selectedVersionId, 
    setSelectedCampaignId, 
    setSelectedVersionId,
    clearCampaignSelection 
  } = useSelection();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadedClientRef = useRef<string | null>(null);
  const loadedCampaignRef = useRef<string | null>(null);
  const loadingCampaignsRef = useRef(false);
  const loadingVersionsRef = useRef(false);
  
  /**
   * Charge les campagnes pour un client donné.
   *
   * @param {string} clientId L'ID du client pour lequel charger les campagnes.
   * @param {boolean} force Indique si le rechargement doit être forcé, ignorant le cache.
   * @returns {Promise<void>} Une promesse qui se résout une fois les campagnes chargées.
   */
  const loadCampaigns = useCallback(async (clientId: string, force = false) => {
    if (loadingCampaignsRef.current && !force) {
      return;
    }
    
    if (loadedClientRef.current === clientId && !force) {
      return;
    }
    
    loadingCampaignsRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log("FIREBASE: LECTURE - Fichier: useCampaignSelection.ts - Fonction: loadCampaigns - Path: campaigns (via getCampaigns)");
      const campaignsData = await getCampaigns(clientId);
      setCampaigns(campaignsData);
      loadedClientRef.current = clientId;
      
      if (loadedCampaignRef.current && loadedCampaignRef.current !== selectedCampaignId) {
        setVersions([]);
        loadedCampaignRef.current = null;
      }
      
    } catch (err) {
      console.error('❌ Erreur chargement campagnes:', err);
      setError('Erreur lors du chargement des campagnes');
      setCampaigns([]);
    } finally {
      loadingCampaignsRef.current = false;
      setLoading(false);
    }
  }, [selectedCampaignId]);
  
  /**
   * Charge les versions pour une campagne donnée et un client spécifique.
   *
   * @param {string} clientId L'ID du client.
   * @param {string} campaignId L'ID de la campagne pour laquelle charger les versions.
   * @param {boolean} force Indique si le rechargement doit être forcé.
   * @returns {Promise<void>} Une promesse qui se résout une fois les versions chargées.
   */
  const loadVersions = useCallback(async (clientId: string, campaignId: string, force = false) => {
    if (loadingVersionsRef.current && !force) {
      return;
    }
    
    if (loadedCampaignRef.current === campaignId && !force) {
      return;
    }
    
    loadingVersionsRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log("FIREBASE: LECTURE - Fichier: useCampaignSelection.ts - Fonction: loadVersions - Path: versions (via getVersions)");
      const versionsData = await getVersions(clientId, campaignId);
      setVersions(versionsData);
      loadedCampaignRef.current = campaignId;
      
    } catch (err) {
      console.error('❌ Erreur chargement versions:', err);
      setError('Erreur lors du chargement des versions');
      setVersions([]);
    } finally {
      loadingVersionsRef.current = false;
      setLoading(false);
    }
  }, []);
  
  /**
   * Effet de bord qui s'exécute lorsque le client sélectionné change.
   * Il réinitialise les sélections et charge les campagnes si un client est sélectionné.
   */
  useEffect(() => {
    if (!selectedClient?.clientId) {
      setCampaigns([]);
      setVersions([]);
      loadedClientRef.current = null;
      loadedCampaignRef.current = null;
      setError(null);
      return;
    }
    
    loadCampaigns(selectedClient.clientId);
  }, [selectedClient?.clientId, loadCampaigns]);
  
  /**
   * Effet de bord qui s'exécute lorsque la campagne sélectionnée ou le client change.
   * Il réinitialise les versions si aucune campagne n'est sélectionnée et charge les versions si nécessaire.
   */
  useEffect(() => {
    if (!selectedClient?.clientId || !selectedCampaignId) {
      if (loadedCampaignRef.current) {
        setVersions([]);
        loadedCampaignRef.current = null;
      }
      return;
    }
    
    loadVersions(selectedClient.clientId, selectedCampaignId);
  }, [selectedClient?.clientId, selectedCampaignId, loadVersions]);
  
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || null;
  const selectedVersion = versions.find(v => v.id === selectedVersionId) || null;
  
  /**
   * Gère le changement de la campagne sélectionnée.
   * Réinitialise la version sélectionnée et met à jour l'ID de la campagne sélectionnée.
   *
   * @param {Campaign} campaign La nouvelle campagne sélectionnée.
   * @returns {void}
   */
  const handleCampaignChange = useCallback((campaign: Campaign) => {
    setSelectedVersionId(null);
    setSelectedCampaignId(campaign.id);
  }, [setSelectedCampaignId, setSelectedVersionId]);
  
  /**
   * Gère le changement de la version sélectionnée.
   * Met à jour l'ID de la version sélectionnée.
   *
   * @param {Version} version La nouvelle version sélectionnée.
   * @returns {void}
   */
  const handleVersionChange = useCallback((version: Version) => {
    setSelectedVersionId(version.id);
  }, [setSelectedVersionId]);
  
  /**
   * Force le rechargement des campagnes.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois les campagnes rafraîchies.
   */
  const refreshCampaigns = useCallback(async () => {
    if (selectedClient?.clientId) {
      loadedClientRef.current = null;
      await loadCampaigns(selectedClient.clientId, true);
    }
  }, [selectedClient?.clientId, loadCampaigns]);
  
  /**
   * Force le rechargement des versions.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois les versions rafraîchies.
   */
  const refreshVersions = useCallback(async () => {
    if (selectedClient?.clientId && selectedCampaignId) {
      loadedCampaignRef.current = null;
      await loadVersions(selectedClient.clientId, selectedCampaignId, true);
    }
  }, [selectedClient?.clientId, selectedCampaignId, loadVersions]);
  
  /**
   * Efface toutes les sélections de campagne et de version, et réinitialise les données.
   *
   * @returns {void}
   */
  const clearSelection = useCallback(() => {
    clearCampaignSelection();
    setCampaigns([]);
    setVersions([]);
    loadedClientRef.current = null;
    loadedCampaignRef.current = null;
    setError(null);
  }, [clearCampaignSelection]);
  
  return {
    campaigns,
    versions,
    selectedCampaign,
    selectedVersion,
    loading,
    error: selectedClient ? error : null,
    handleCampaignChange,
    handleVersionChange,
    refreshCampaigns,
    refreshVersions,
    clearSelection
  };
}