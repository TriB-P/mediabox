// app/hooks/useCampaignSelection.ts

import { useState, useEffect } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { getCampaigns } from '../lib/campaignService';
import { getVersions } from '../lib/versionService';
import { Campaign } from '../types/campaign';

interface Version {
  id: string;
  name: string;
  isOfficial?: boolean;
}

export function useCampaignSelection() {
  const { selectedClient } = useClient();
  const {
    selectedCampaignId,
    selectedVersionId,
    setSelectedCampaignId,
    setSelectedVersionId,
    loading: selectionLoading,
  } = useSelection();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les campagnes quand le client change
  useEffect(() => {
    async function loadCampaigns() {
      if (!selectedClient) {
        setCampaigns([]);
        setSelectedCampaign(null);
        setVersions([]);
        setSelectedVersion(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const campaignsData = await getCampaigns(selectedClient.clientId);
        setCampaigns(campaignsData);

        // Essayer de restaurer la campagne sélectionnée depuis le contexte
        if (selectedCampaignId && !selectionLoading) {
          const savedCampaign = campaignsData.find(c => c.id === selectedCampaignId);
          if (savedCampaign) {
            setSelectedCampaign(savedCampaign);
          } else {
            // La campagne sauvegardée n'existe plus, nettoyer la sélection
            setSelectedCampaignId(null);
            setSelectedCampaign(null);
          }
        } else if (!selectionLoading) {
          setSelectedCampaign(null);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des campagnes:', err);
        setError('Erreur lors du chargement des campagnes');
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, [selectedClient, selectedCampaignId, selectionLoading]);

  // Charger les versions quand la campagne sélectionnée change
  useEffect(() => {
    async function loadVersions() {
      if (!selectedClient || !selectedCampaign) {
        setVersions([]);
        setSelectedVersion(null);
        return;
      }

      try {
        setLoading(true);
        
        const versionsData = await getVersions(selectedClient.clientId, selectedCampaign.id);
        setVersions(versionsData);

        // Essayer de restaurer la version sélectionnée depuis le contexte
        if (selectedVersionId && !selectionLoading) {
          const savedVersion = versionsData.find(v => v.id === selectedVersionId);
          if (savedVersion) {
            setSelectedVersion(savedVersion);
          } else {
            // La version sauvegardée n'existe plus, nettoyer la sélection
            setSelectedVersionId(null);
            setSelectedVersion(null);
          }
        } else if (!selectionLoading) {
          setSelectedVersion(null);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des versions:', err);
        setError('Erreur lors du chargement des versions');
      } finally {
        setLoading(false);
      }
    }

    loadVersions();
  }, [selectedClient, selectedCampaign, selectedVersionId, selectionLoading]);

  // Fonctions pour changer les sélections
  const handleCampaignChange = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setSelectedCampaignId(campaign.id);
    // Les versions seront rechargées automatiquement par l'useEffect
  };

  const handleVersionChange = (version: Version) => {
    setSelectedVersion(version);
    setSelectedVersionId(version.id);
  };

  const clearCampaignSelection = () => {
    setSelectedCampaign(null);
    setSelectedCampaignId(null);
  };

  const clearVersionSelection = () => {
    setSelectedVersion(null);
    setSelectedVersionId(null);
  };

  return {
    campaigns,
    versions,
    selectedCampaign,
    selectedVersion,
    loading: loading || selectionLoading,
    error,
    handleCampaignChange,
    handleVersionChange,
    clearCampaignSelection,
    clearVersionSelection,
  };
}