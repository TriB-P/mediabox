// app/campaigns/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useClient } from '../contexts/ClientContext';
import { useAuth } from '../contexts/AuthContext';
import { Campaign, CampaignFormData } from '../types/campaign';
import { BreakdownFormData } from '../types/breakdown';
import { getCampaigns, createCampaign, updateCampaign } from '../lib/campaignService';
import CampaignDrawer from '../components/Campaigns/CampaignDrawer';
import CampaignTable from '../components/Campaigns/CampaignTable';

export default function CampaignsPage() {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  
  // États
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États du drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Charger les campagnes
  useEffect(() => {
    if (selectedClient) {
      loadCampaigns();
    } else {
      setCampaigns([]);
      setLoading(false);
    }
  }, [selectedClient]);

  const loadCampaigns = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getCampaigns(selectedClient.clientId);
      setCampaigns(data);
    } catch (err) {
      console.error('Erreur lors du chargement des campagnes:', err);
      setError('Erreur lors du chargement des campagnes');
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaires d'événements
  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setIsDrawerOpen(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingCampaign(null);
  };

  const handleSaveCampaign = async (
    campaignData: CampaignFormData, 
    additionalBreakdowns?: BreakdownFormData[]
  ) => {
    if (!selectedClient || !user) return;

    try {
      if (editingCampaign) {
        // Modification d'une campagne existante
        await updateCampaign(selectedClient.clientId, editingCampaign.id, campaignData);
      } else {
        // Création d'une nouvelle campagne
        await createCampaign(
          selectedClient.clientId, 
          campaignData, 
          user.email,
          additionalBreakdowns || []
        );
      }
      
      // Recharger les campagnes
      await loadCampaigns();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error; // Laisser le drawer gérer l'erreur
    }
  };

  // Affichage conditionnel si pas de client sélectionné
  if (!selectedClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Aucun client sélectionné
          </h2>
          <p className="text-gray-600">
            Veuillez sélectionner un client pour voir ses campagnes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Campagnes
              </h1>
              <p className="text-sm text-gray-600">
                Client: {selectedClient.CL_Name}
              </p>
            </div>
            <button
              onClick={handleCreateCampaign}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Nouvelle campagne
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
            <button 
              onClick={loadCampaigns}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Statistiques rapides */}
        {!loading && campaigns.length > 0 && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-900">
                {campaigns.length}
              </div>
              <div className="text-sm text-gray-600">
                Nombre total de campagnes
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-indigo-600">
                {new Intl.NumberFormat('fr-CA', {
                  style: 'currency',
                  currency: 'CAD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(campaigns.reduce((total, campaign) => total + campaign.budget, 0))}
              </div>
              <div className="text-sm text-gray-600">
                Budget total
              </div>
            </div>
          </div>
        )}

        {/* Tableau des campagnes */}
        <CampaignTable
          campaigns={campaigns}
          clientId={selectedClient.clientId}
          onEdit={handleEditCampaign}
          onRefresh={loadCampaigns}
          loading={loading}
        />
      </div>

      {/* Drawer de création/édition */}
      <CampaignDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        campaign={editingCampaign}
        onSave={handleSaveCampaign}
      />
    </div>
  );
}