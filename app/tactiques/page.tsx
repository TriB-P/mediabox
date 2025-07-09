// app/tactiques/page.tsx - AVEC INTÉGRATION COMPLÈTE DU DRAG AND DROP

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCampaignSelection } from '../hooks/useCampaignSelection';
import { useTactiquesData } from '../hooks/useTactiquesData';
import { SectionWithTactiques } from '../types/tactiques';
import TactiquesHierarchyView from '../components/Tactiques/TactiquesHierarchyView';
import TactiquesTableView from '../components/Tactiques/TactiquesTableView';
import TactiquesTimelineView from '../components/Tactiques/TactiquesTimelineView';
import TactiquesFooter from '../components/Tactiques/TactiquesFooter';
import { default as SectionModal } from '../components/Tactiques/SectionModal';
import LoadingSpinner from '../components/Others/LoadingSpinner';
import TactiquesBudgetPanel from '../components/Tactiques/TactiquesBudgetPanel';
import {
  ChevronDownIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'hierarchy' | 'table' | 'timeline';

export default function TactiquesPage() {
  // ==================== HOOKS PRINCIPAUX ====================

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

  const {
    loading,
    error,
    setError,
    onglets,
    selectedOnglet,
    sections,
    tactiques,
    placements,
    creatifs,
    // Modal de section
    sectionModal,
    handleSaveSection,
    closeSectionModal,
    handleAddSection,
    handleEditSection,
    handleDeleteSection,
    handleSectionExpand,
    // Opérations tactiques
    handleCreateTactique,
    handleUpdateTactique,
    handleDeleteTactique,
    // Opérations placements
    handleCreatePlacement,
    handleUpdatePlacement,
    handleDeletePlacement,
    // Opérations créatifs
    handleCreateCreatif,
    handleUpdateCreatif,
    handleDeleteCreatif,
    // Opérations onglets
    handleAddOnglet,
    handleRenameOnglet,
    handleDeleteOnglet,
    handleSelectOnglet,
    // 🔥 NOUVEAU : Fonction de rafraîchissement pour le drag and drop
    onRefresh,
  } = useTactiquesData(selectedCampaign, selectedVersion);

  // ==================== ÉTATS UI ====================

  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);

  // Refs pour les dropdowns
  const campaignDropdownRef = useRef<HTMLDivElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);

  // ==================== LOGIQUE DE CHARGEMENT ====================

  const isLoading = campaignLoading || loading;
  const hasError = campaignError || error;

  // Gérer le loader avec une logique simplifiée - SANS minimum de 2 secondes
  useEffect(() => {
    if (isLoading) {
      console.log('🔄 Début chargement');
      setShowLoader(true);
      setMinimumTimeElapsed(false);
    } else {
      console.log('🏁 Chargement terminé - masquer loader immédiatement');
      setShowLoader(false);
      setMinimumTimeElapsed(true);
    }
  }, [isLoading]);

  // Timeout de sécurité pour éviter les blocages
  useEffect(() => {
    if (showLoader) {
      const safetyTimer = setTimeout(() => {
        console.log('🚨 Timeout de sécurité (6s) - forcer l\'arrêt');
        setShowLoader(false);
        setMinimumTimeElapsed(true);
      }, 6000);

      return () => clearTimeout(safetyTimer);
    }
  }, [showLoader]);

  // ==================== GESTION DES DROPDOWNS ====================

  // Fermer les dropdowns quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (campaignDropdownRef.current && !campaignDropdownRef.current.contains(event.target as Node)) {
        setShowCampaignDropdown(false);
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target as Node)) {
        setShowVersionDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ==================== GESTION DU BUDGET ====================

  // Mettre à jour le budget total quand la campagne change
  useEffect(() => {
    if (selectedCampaign) {
      setTotalBudget(selectedCampaign.CA_Budget || 0);
    } else {
      setTotalBudget(0);
    }
  }, [selectedCampaign]);

  // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================

  // Gestionnaires pour les changements de sélection avec dropdown
  const handleCampaignChangeLocal = (campaign: any) => {
    handleCampaignChange(campaign);
    setShowCampaignDropdown(false);
    setShowVersionDropdown(false);
  };

  const handleVersionChangeLocal = (version: any) => {
    handleVersionChange(version);
    setShowVersionDropdown(false);
  };

  // Formater les montants en CAD
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // ==================== PRÉPARATION DES DONNÉES ====================

  // Préparer les données pour les vues avec états d'expansion préservés
  const sectionsWithTactiques: SectionWithTactiques[] = sections.map(section => ({
    ...section,
    tactiques: tactiques[section.id] || [],
    // isExpanded est déjà inclus dans section depuis useTactiquesData
  }));

  const budgetUtilisé = sections.reduce((total, section) => total + (section.SECTION_Budget || 0), 0);
  const budgetRestant = totalBudget - budgetUtilisé;

  const sectionNames = sections.reduce((names, section) => {
    names[section.id] = section.SECTION_Name;
    return names;
  }, {} as Record<string, string>);

  const flatTactiques = Object.values(tactiques).flat();

  // ==================== LOGS ET STATISTIQUES ====================

  // Logs et statistiques pour les créatifs
  useEffect(() => {
    console.log('📋 Placements actuels:', placements);
    console.log('🎨 Créatifs actuels:', creatifs);
    
    const totalPlacements = Object.values(placements).reduce((total, tacticPlacements) => total + tacticPlacements.length, 0);
    const totalCreatifs = Object.values(creatifs).reduce((total, placementCreatifs) => total + placementCreatifs.length, 0);
    
    console.log(`📊 Total placements: ${totalPlacements}`);
    console.log(`🎯 Total créatifs: ${totalCreatifs}`);
    
    // Statistiques détaillées par tactique
    Object.entries(tactiques).forEach(([sectionId, sectionTactiques]) => {
      sectionTactiques.forEach(tactique => {
        const tactiquesPlacements = placements[tactique.id] || [];
        const tactiquesCreatifs = tactiquesPlacements.reduce((sum, placement) => {
          return sum + (creatifs[placement.id] || []).length;
        }, 0);
        
        if (tactiquesPlacements.length > 0 || tactiquesCreatifs > 0) {
          console.log(`🔍 Tactique "${tactique.TC_Label}": ${tactiquesPlacements.length} placements, ${tactiquesCreatifs} créatifs`);
        }
      });
    });
  }, [placements, creatifs, tactiques]);

  // ==================== RENDU ====================

  return (
    <div className="space-y-6 pb-16">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tactiques</h1>
      </div>

      {/* Sélecteurs de campagne et version */}
      <div className="flex gap-4 mb-6">
        {/* Sélecteur de campagne */}
        <div className="w-1/2 relative" ref={campaignDropdownRef}>
          <button
            type="button"
            className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
          >
            <span>{selectedCampaign?.CA_Name || 'Sélectionner une campagne'}</span>
            <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" />
          </button>

          {showCampaignDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-56 overflow-auto">
              <ul className="py-1">
                {campaigns.map(campaign => (
                  <li
                    key={campaign.id}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                      selectedCampaign?.id === campaign.id ? 'bg-gray-50 font-medium' : ''
                    }`}
                    onClick={() => handleCampaignChangeLocal(campaign)}
                  >
                    {campaign.CA_Name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sélecteur de version */}
        <div className="w-1/2 relative" ref={versionDropdownRef}>
          <button
            type="button"
            className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => setShowVersionDropdown(!showVersionDropdown)}
            disabled={!selectedCampaign || versions.length === 0}
          >
            <span>{selectedVersion?.name || 'Sélectionner une version'}</span>
            <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" />
          </button>

          {showVersionDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-56 overflow-auto">
              <ul className="py-1">
                {versions.map(version => (
                  <li
                    key={version.id}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                      selectedVersion?.id === version.id ? 'bg-gray-50 font-medium' : ''
                    }`}
                    onClick={() => handleVersionChangeLocal(version)}
                  >
                    {version.name}
                    {version.isOfficial && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Officielle
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* LoadingSpinner avec timer minimum de 2 secondes */}
      {showLoader && <LoadingSpinner message="Chargement des tactiques..." />}

      {selectedVersion && !showLoader && (
        <div className="w-full flex">
          {/* Zone de contenu principal */}
          <div className="flex-1 mr-4">
            {/* Barre d'outils */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={handleAddSection}
                  className="flex items-center px-3 py-1.5 rounded text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                >
                  <PlusIcon className="h-5 w-5 mr-1.5" />
                  Nouvelle section
                </button>
              </div>

              {/* Statistiques créatifs dans la barre d'outils */}
              {sectionsWithTactiques.length > 0 && (
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    {Object.values(placements).reduce((total, tacticPlacements) => total + tacticPlacements.length, 0)} placement{Object.values(placements).reduce((total, tacticPlacements) => total + tacticPlacements.length, 0) !== 1 ? 's' : ''}
                  </span>
                  <span>
                    {Object.values(creatifs).reduce((total, placementCreatifs) => total + placementCreatifs.length, 0)} créatif{Object.values(creatifs).reduce((total, placementCreatifs) => total + placementCreatifs.length, 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Message d'erreur */}
            {hasError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {hasError}
                <button
                  onClick={() => setError(null)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Contenu selon le mode de vue */}
            {!hasError && (
              <>
                {viewMode === 'hierarchy' && (
                  <>
                    {sectionsWithTactiques.length > 0 ? (
                      <TactiquesHierarchyView
                        sections={sectionsWithTactiques}
                        placements={placements}
                        creatifs={creatifs}
                        onSectionExpand={handleSectionExpand}
                        onEditSection={handleEditSection}
                        onDeleteSection={handleDeleteSection}
                        onCreateTactique={handleCreateTactique}
                        onUpdateTactique={handleUpdateTactique}
                        onDeleteTactique={handleDeleteTactique}
                        onCreatePlacement={handleCreatePlacement}
                        onUpdatePlacement={handleUpdatePlacement}
                        onDeletePlacement={handleDeletePlacement}
                        onCreateCreatif={handleCreateCreatif}
                        onUpdateCreatif={handleUpdateCreatif}
                        onDeleteCreatif={handleDeleteCreatif}
                        formatCurrency={formatCurrency}
                        totalBudget={totalBudget}
                        onRefresh={onRefresh} // 🔥 NOUVEAU : Fonction de rafraîchissement pour le drag and drop
                      />
                    ) : (
                      <div className="bg-white p-8 rounded-lg shadow text-center">
                        <p className="text-gray-500">
                          Aucune section trouvée pour cet onglet. Créez une nouvelle section pour commencer.
                        </p>
                        <button
                          onClick={handleAddSection}
                          className="mt-4 flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 mx-auto"
                        >
                          <PlusIcon className="h-5 w-5 mr-1.5" />
                          Nouvelle section
                        </button>
                      </div>
                    )}
                  </>
                )}

                {viewMode === 'table' && (
                  <TactiquesTableView
                    tactiques={flatTactiques}
                    onUpdateTactique={handleUpdateTactique}
                    onDeleteTactique={handleDeleteTactique}
                    formatCurrency={formatCurrency}
                    sectionNames={sectionNames}
                  />
                )}

                {viewMode === 'timeline' && selectedCampaign && (
                  <TactiquesTimelineView
                    tactiques={flatTactiques}
                    sectionNames={sectionNames}
                    campaignStartDate={selectedCampaign.CA_Start_Date}
                    campaignEndDate={selectedCampaign.CA_End_Date}
                    formatCurrency={formatCurrency}
                    onEditTactique={(tactiqueId, sectionId) => {
                      const tactique = flatTactiques.find(t => t.id === tactiqueId);
                      if (tactique) {
                        console.log('Éditer tactique:', tactique);
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* Budget Panel - seulement en mode hiérarchie */}
          {viewMode === 'hierarchy' && (
            <TactiquesBudgetPanel
              selectedCampaign={selectedCampaign}
              sections={sections}
              tactiques={tactiques}
              selectedOnglet={selectedOnglet}
              onglets={onglets}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      )}

      {/* Message si aucune version sélectionnée */}
      {!showLoader && !hasError && !selectedVersion && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">
            Veuillez sélectionner une campagne et une version pour voir les tactiques.
          </p>
        </div>
      )}

      {/* Footer avec onglets et boutons de vue */}
      {selectedOnglet && !showLoader && (
        <TactiquesFooter
          viewMode={viewMode}
          setViewMode={setViewMode}
          onglets={onglets}
          selectedOnglet={selectedOnglet}
          onSelectOnglet={handleSelectOnglet}
          onAddOnglet={handleAddOnglet}
          onRenameOnglet={handleRenameOnglet}
          onDeleteOnglet={handleDeleteOnglet}
        />
      )}

      {/* Modal de section */}
      <SectionModal
        isOpen={sectionModal.isOpen}
        onClose={closeSectionModal}
        onSave={handleSaveSection}
        section={sectionModal.section}
        mode={sectionModal.mode}
      />
    </div>
  );
}