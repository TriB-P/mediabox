// app/adops/page.tsx
/**
 * Ce fichier définit la page "AdOps" de l'application.
 * Elle permet de visualiser et de gérer les opérations publicitaires
 * pour une campagne et une version de campagne sélectionnées.
 * La page affiche 4 composants principaux organisés en grille.
 * MODIFIÉ : État centralisé pour synchroniser les composants
 */
'use client';

import React, { useState } from 'react';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { useTranslation } from '../contexts/LanguageContext';
import CampaignVersionSelector from '../components/Others/CampaignVersionSelector';
import { useClient } from '../contexts/ClientContext';
import { useCampaignSelection } from '../hooks/useCampaignSelection';
import { useAdOpsData } from '../hooks/useAdOpsData';

// Import des composants AdOps
import AdOpsDropdowns from '../components/AdOps/AdOpsDropdowns';
import AdOpsTacticInfo from '../components/AdOps/AdOpsTacticInfo';
import AdOpsTacticList from '../components/AdOps/AdOpsTacticList';
import AdOpsTable from '../components/AdOps/AdOpsTacticTable';

// Interface pour une tactique sélectionnée
interface SelectedTactique {
  id: string;
  TC_Label?: string;
  TC_Publisher?: string;
  TC_Media_Type?: string;
  TC_Prog_Buying_Method?: string;
  ongletName: string;
  sectionName: string;
  placementsWithTags: any[];
}

/**
 * Composant principal de la page AdOps.
 * Permet de gérer les opérations publicitaires pour les campagnes.
 *
 * @returns {JSX.Element} Le composant React de la page AdOps.
 */
export default function AdOpsPage() {
  const { selectedClient } = useClient();
  const { t } = useTranslation();
  const [selectedTactique, setSelectedTactique] = useState<SelectedTactique | null>(null);
  
  const {
    campaigns,
    versions,
    selectedCampaign,
    selectedVersion,
    loading: campaignLoading,
    error: campaignError,
    handleCampaignChange,
    handleVersionChange,
  } = useCampaignSelection();

  // Hook centralisé pour les données AdOps
  const {
    tactiques,
    publishers,
    loading: adOpsLoading,
    error: adOpsError,
    togglePublisher,
    selectAllPublishers,
    deselectAllPublishers,
    selectedPublishers,
    filteredTactiques
  } = useAdOpsData(selectedCampaign, selectedVersion);

  /**
   * Gère le changement de campagne sélectionnée.
   *
   * @param {any} campaign - La nouvelle campagne sélectionnée.
   * @returns {void}
   */
  const handleCampaignChangeLocal = (campaign: any) => {
    handleCampaignChange(campaign);
    // Réinitialiser la sélection de tactique quand on change de campagne
    setSelectedTactique(null);
  };

  /**
   * Gère le changement de version de campagne sélectionnée.
   *
   * @param {any} version - La nouvelle version de campagne sélectionnée.
   * @returns {void}
   */
  const handleVersionChangeLocal = (version: any) => {
    handleVersionChange(version);
    // Réinitialiser la sélection de tactique quand on change de version
    setSelectedTactique(null);
  };

  /**
   * Gère la sélection d'une tactique
   *
   * @param {SelectedTactique | null} tactique - La tactique sélectionnée
   * @returns {void}
   */
  const handleTactiqueSelect = (tactique: SelectedTactique | null) => {
    setSelectedTactique(tactique);
  };

  const isLoading = campaignLoading;
  const hasError = campaignError;

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div className="space-y-6">
          
          {/* En-tête avec titre et informations de campagne */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">AdOps</h1>
            
          </div>
          
          {/* Sélecteur de campagne et version */}
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-4xl">
              <CampaignVersionSelector
                campaigns={campaigns}
                versions={versions}
                selectedCampaign={selectedCampaign}
                selectedVersion={selectedVersion}
                loading={campaignLoading}
                error={campaignError}
                onCampaignChange={handleCampaignChangeLocal}
                onVersionChange={handleVersionChangeLocal}
                className="mb-0"
              />
            </div>
          </div>
          
          {/* Description */}
          <div className="bg-white p-4 rounded-lg shadow mb-6 text-sm text-gray-600">
            <p>
              Cette section permet de gérer les opérations publicitaires et de suivre les performances des tactiques pour la campagne sélectionnée.
            </p>
          </div>
          
          {/* États de chargement et d'erreur */}
          {isLoading && (
            <div className="bg-white p-8 rounded-lg shadow flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <div className="text-sm text-gray-500">Chargement...</div>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {hasError}
            </div>
          )}
          
          {/* Contenu principal */}
          {!isLoading && !hasError && (
            <>
              {!selectedCampaign && (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500">
                    Veuillez sélectionner une campagne et une version pour commencer.
                  </p>
                </div>
              )}
              
              {selectedCampaign && !selectedVersion && (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500">
                    Veuillez sélectionner une version pour continuer.
                  </p>
                </div>
              )}
              
              {selectedCampaign && selectedVersion && (
                <div className="grid grid-cols-12 gap-6">
                  {/* Ligne du haut - 2 colonnes égales */}
                  <div className="col-span-6">
                    <AdOpsDropdowns 
                      publishers={publishers}
                      loading={adOpsLoading}
                      error={adOpsError}
                      togglePublisher={togglePublisher}
                      selectAllPublishers={selectAllPublishers}
                      deselectAllPublishers={deselectAllPublishers}
                      selectedPublishers={selectedPublishers}
                    />
                  </div>
                  
                  <div className="col-span-6">
                    <AdOpsTacticInfo 
                      selectedTactique={selectedTactique}
                    />
                  </div>
                  
                  {/* Ligne du bas - 1/3 et 2/3 */}
                  <div className="col-span-4">
                    <AdOpsTacticList 
                      filteredTactiques={filteredTactiques}
                      loading={adOpsLoading}
                      error={adOpsError}
                      onTactiqueSelect={handleTactiqueSelect}
                      selectedTactique={selectedTactique}
                    />
                  </div>
                  
                  <div className="col-span-8">
                    <AdOpsTable 
                      selectedTactique={selectedTactique}
                      selectedCampaign={selectedCampaign}
                      selectedVersion={selectedVersion}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}