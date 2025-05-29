'use client';

import React, { useState, useEffect } from 'react';
import { Campaign, CampaignFormData } from '../types/campaign';
import { BreakdownFormData } from '../types/breakdown';
import CampaignDrawer from '../components/Campaigns/CampaignDrawer';
import CampaignVersions from '../components/Campaigns/CampaignVersions';
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
} from '../lib/campaignService';
import {
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FunnelIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useClient } from '../contexts/ClientContext';
import { useAuth } from '../contexts/AuthContext';

type SortField =
  | 'name'
  | 'status'
  | 'budget'
  | 'startDate'
  | 'endDate'
  | 'quarter'
  | 'year';
type SortDirection = 'asc' | 'desc';

export default function CampaignsPage() {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Charger les campagnes quand le client change
  useEffect(() => {
    if (selectedClient) {
      loadCampaigns();
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
      setError('Erreur lors du chargement des campagnes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater les montants
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  // Fonction pour sauvegarder une campagne
  const handleSaveCampaign = async (
    formData: CampaignFormData, 
    additionalBreakdowns?: BreakdownFormData[]
  ) => {
    if (!selectedClient || !user?.email) return;

    try {
      if (selectedCampaign) {
        // Mise à jour d'une campagne existante
        await updateCampaign(
          selectedClient.clientId,
          selectedCampaign.id,
          formData
        );
      } else {
        // Création d'une nouvelle campagne avec version originale et breakdowns
        await createCampaign(
          selectedClient.clientId, 
          formData, 
          user.email,
          additionalBreakdowns || []
        );
      }

      // Recharger les campagnes
      await loadCampaigns();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde de la campagne');
    }
  };

  // Fonction pour basculer l'expansion d'une ligne
  const toggleRowExpansion = (campaignId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId);
    } else {
      newExpanded.add(campaignId);
    }
    setExpandedRows(newExpanded);
  };

  // Fonction de filtrage basée sur la recherche
  const filteredCampaigns = campaigns.filter((campaign) => {
    const query = searchQuery.toLowerCase();
    return (
      campaign.name.toLowerCase().includes(query) ||
      campaign.status.toLowerCase().includes(query) ||
      campaign.quarter.toLowerCase().includes(query) ||
      campaign.year.toString().includes(query)
    );
  });

  // Fonction de tri
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Gérer les valeurs null/undefined
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Comparaison en fonction du type
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Fonction pour gérer le clic sur une colonne
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Rechercher une campagne..."
          />
        </div>
        
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FunnelIcon className="h-5 w-5 mr-2 text-gray-400" /> 
            Filter
          </button>
          
          <button
            onClick={() => {
              setSelectedCampaign(null);
              setIsDrawerOpen(true);
            }}
            disabled={!selectedClient}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              selectedClient
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <PlusIcon className="h-5 w-5" />
            Nouvelle
          </button>
        </div>
      </div>

      {/* Gestion des états de chargement et d'erreur */}
      {!selectedClient && (
        <div className="text-center py-8 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700">
            Veuillez sélectionner un client dans le menu déroulant ci-dessus.
          </p>
        </div>
      )}

      {loading && selectedClient && (
        <div className="text-center py-8">
          <p className="text-gray-500">Chargement des campagnes...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tableau des campagnes */}
      {!loading && sortedCampaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden flex-grow flex flex-col min-h-0">
          <div className="overflow-auto flex-grow h-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-8"></th>
                  {[
                    { key: 'name', label: 'NOM DE CAMPAGNE' },
                    { key: 'budget', label: 'BUDGET' },
                    { key: 'startDate', label: 'DÉBUT' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort(key as SortField)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{label}</span>
                        <div className="flex flex-col">
                          <ChevronUpIcon
                            className={`h-3 w-3 ${
                              sortField === key && sortDirection === 'asc'
                                ? 'text-indigo-500'
                                : 'text-gray-400'
                            }`}
                          />
                          <ChevronDownIcon
                            className={`h-3 w-3 -mt-1 ${
                              sortField === key && sortDirection === 'desc'
                                ? 'text-indigo-500'
                                : 'text-gray-400'
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCampaigns.map((campaign) => (
                  <React.Fragment key={campaign.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-2 py-4">
                        <button
                          onClick={() => toggleRowExpansion(campaign.id)}
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          <ChevronRightIcon
                            className={`h-5 w-5 text-gray-500 transform transition-transform ${
                              expandedRows.has(campaign.id) ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setIsDrawerOpen(true);
                        }}
                      >
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {campaign.name}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setIsDrawerOpen(true);
                        }}
                      >
                        {formatCurrency(campaign.budget)}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setIsDrawerOpen(true);
                        }}
                      >
                        {campaign.startDate}
                      </td>
                    </tr>
                    {expandedRows.has(campaign.id) && (
                      <tr>
                        <td colSpan={4} className="px-0 py-0">
                          <CampaignVersions
                            clientId={selectedClient!.clientId}
                            campaignId={campaign.id}
                            officialVersionId={campaign.officialVersionId}
                            onVersionChange={loadCampaigns}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message si aucune campagne après filtrage */}
      {!loading && sortedCampaigns.length === 0 && searchQuery && (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            Aucune campagne ne correspond à votre recherche.
          </p>
        </div>
      )}

      {/* Message si aucune campagne */}
      {!loading && campaigns.length === 0 && !searchQuery && selectedClient && (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            Aucune campagne trouvée. Créez votre première campagne !
          </p>
        </div>
      )}

      {/* Drawer pour créer/éditer une campagne */}
      <CampaignDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
        onSave={handleSaveCampaign}
      />
    </div>
  );
}