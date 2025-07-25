// app/campaigns/page.tsx
/**
 * @file Ce fichier définit le composant de la page principale pour la gestion des campagnes publicitaires.
 * @description Ce composant React permet aux utilisateurs de visualiser la liste des campagnes associées au client actuellement sélectionné.
 * Il offre des fonctionnalités telles que la recherche, l'affichage de statistiques (nombre total de campagnes, budget total),
 * et la possibilité de créer ou de modifier une campagne via un panneau latéral (drawer).
 * La page gère son propre état, y compris la liste des campagnes, le chargement, les erreurs, et l'état du drawer.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useClient } from '../contexts/ClientContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Campaign, CampaignFormData } from '../types/campaign';
import { BreakdownFormData } from '../types/breakdown';
import { getCampaigns, createCampaign, updateCampaign } from '../lib/campaignService';
import CampaignDrawer from '../components/Campaigns/CampaignDrawer';
import CampaignTable from '../components/Campaigns/CampaignTable';

/**
 * Composant principal de la page des campagnes.
 * @returns {JSX.Element} Le rendu de la page des campagnes.
 */
export default function CampaignsPage() {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (selectedClient) {
      loadCampaigns();
    } else {
      setCampaigns([]);
      setLoading(false);
    }
  }, [selectedClient]);

  /**
   * Charge les campagnes pour le client sélectionné depuis la base de données.
   * Met à jour les états de chargement, d'erreur et de la liste des campagnes.
   * @returns {Promise<void>} Une promesse qui se résout une fois les campagnes chargées.
   */
  const loadCampaigns = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);
      setError(null);
      console.log(`FIREBASE: LECTURE - Fichier: app/campaigns/page.tsx - Fonction: loadCampaigns - Path: clients/${selectedClient.clientId}/campaigns`);
      const data = await getCampaigns(selectedClient.clientId);
      setCampaigns(data);
    } catch (err) {
      console.error('Erreur lors du chargement des campagnes:', err);
      setError(t('campaigns.loadingError'));
    } finally {
      setLoading(false);
    }
  };

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

  const totalBudget = useMemo(() => {
    return campaigns.reduce((total, campaign) => total + (campaign.CA_Budget || 0), 0);
  }, [campaigns]);

  /**
   * Ouvre le panneau latéral (drawer) pour la création d'une nouvelle campagne.
   * Réinitialise l'état de la campagne en cours d'édition.
   */
  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setIsDrawerOpen(true);
  };

  /**
   * Ouvre le panneau latéral (drawer) pour la modification d'une campagne existante.
   * @param {Campaign} campaign L'objet de la campagne à modifier.
   */
  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsDrawerOpen(true);
  };

  /**
   * Ferme le panneau latéral et réinitialise l'état de la campagne en cours d'édition.
   */
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingCampaign(null);
  };

  /**
   * Gère la sauvegarde d'une campagne, qu'il s'agisse d'une création ou d'une modification.
   * Appelle le service approprié pour interagir avec la base de données.
   * @param {CampaignFormData} campaignData Les données du formulaire de la campagne.
   * @param {BreakdownFormData[]} [additionalBreakdowns] Une liste optionnelle de breakdowns supplémentaires à créer.
   * @returns {Promise<void>} Une promesse qui se résout après la tentative de sauvegarde.
   */
  const handleSaveCampaign = async (
    campaignData: CampaignFormData,
    additionalBreakdowns?: BreakdownFormData[]
  ) => {
    if (!selectedClient || !user) return;

    try {
      if (editingCampaign) {
        console.log(`FIREBASE: ÉCRITURE - Fichier: app/campaigns/page.tsx - Fonction: handleSaveCampaign - Path: clients/${selectedClient.clientId}/campaigns/${editingCampaign.id}`);
        await updateCampaign(selectedClient.clientId, editingCampaign.id, campaignData);
      } else {
        console.log(`FIREBASE: ÉCRITURE - Fichier: app/campaigns/page.tsx - Fonction: handleSaveCampaign - Path: clients/${selectedClient.clientId}/campaigns`);
        await createCampaign(
          selectedClient.clientId,
          campaignData,
          user.email,
          additionalBreakdowns || []
        );
      }

      await loadCampaigns();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  };

  if (!selectedClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('campaigns.noClientSelected')}
          </h2>
          <p className="text-gray-600">
            {t('campaigns.noClientMessage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('campaigns.title')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('campaigns.client')} {selectedClient.CL_Name}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg shadow p-3 text-center w-40">
                <div className="text-xl font-bold text-gray-900">
                  {campaigns.length}
                </div>
                <div className="text-xs text-gray-600">
                  {t('campaigns.totalCampaigns')}
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
                  {t('campaigns.totalBudget')}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="w-full max-w-md">
              <label htmlFor="search" className="sr-only">{t('campaigns.searchLabel')}</label>
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('campaigns.searchPlaceholder')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
              </div>
            </div>
            
            <button
              onClick={handleCreateCampaign}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              {t('campaigns.newCampaign')}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
            <button 
              onClick={loadCampaigns}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              {t('campaigns.retry')}
            </button>
          </div>
        )}

        <CampaignTable
          campaigns={filteredCampaigns}
          clientId={selectedClient.clientId}
          onEdit={handleEditCampaign}
          onRefresh={loadCampaigns}
          loading={loading}
        />
      </div>

      <CampaignDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        campaign={editingCampaign}
        onSave={handleSaveCampaign}
      />
    </div>
  );
}