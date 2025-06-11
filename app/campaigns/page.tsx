// app/campaigns/page.tsx

'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Filtrer les campagnes en fonction de la recherche
  const filteredCampaigns = useMemo(() => {
    if (!searchTerm) {
      return campaigns;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return campaigns.filter(campaign =>
      campaign.CA_Name.toLowerCase().includes(lowercasedFilter) ||
      campaign.CA_Campaign_Identifier.toLowerCase().includes(lowercasedFilter)
    );
  }, [campaigns, searchTerm]);
  
  // Calculer le budget total correctement
  const totalBudget = useMemo(() => {
    return campaigns.reduce((total, campaign) => total + (campaign.CA_Budget || 0), 0);
  }, [campaigns]);

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
      {/* Conteneur principal de la page */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête avec la nouvelle disposition */}
        <div className="space-y-4 mb-6">
          
          {/* Rangée du haut: Titre et Totaux */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Campagnes
              </h1>
              <p className="text-sm text-gray-600">
                Client: {selectedClient.CL_Name}
              </p>
            </div>
            
            {/* 🔥 CORRECTION: Conteneur pour les boîtes de totaux avec des largeurs fixes */}
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg shadow p-3 text-center w-40">
                <div className="text-xl font-bold text-gray-900">
                  {campaigns.length}
                </div>
                <div className="text-xs text-gray-600">
                  Campagnes totales
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 text-center w-40">
                <div className="text-xl font-bold text-indigo-600">
                  {new Intl.NumberFormat('fr-CA', {
                    style: 'currency',
                    currency: 'CAD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(totalBudget)}
                </div>
                <div className="text-xs text-gray-600">
                  Budget total
                </div>
              </div>
            </div>
          </div>

          {/* Rangée du bas: Recherche et Bouton */}
          <div className="flex justify-between items-end">
            <div className="w-full max-w-md">
              {/* Le label est caché visuellement mais accessible */}
              <label htmlFor="search" className="sr-only">Rechercher une campagne</label>
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher par nom ou identifiant..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
              </div>
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

        {/* Tableau des campagnes */}
        <CampaignTable
          campaigns={filteredCampaigns}
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