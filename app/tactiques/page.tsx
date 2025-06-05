// app/tactiques/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useCampaignSelection } from '../hooks/useCampaignSelection';
import { useTactiquesData } from '../hooks/useTactiquesData';
import { SectionWithTactiques } from '../types/tactiques';
import TactiquesHierarchyView from '../components/Tactiques/TactiquesHierarchyView';
import TactiquesTableView from '../components/Tactiques/TactiquesTableView';
import TactiquesTimelineView from '../components/Tactiques/TactiquesTimelineView';
import TactiquesFooter from '../components/Tactiques/TactiquesFooter';
import { default as SectionModal } from '../components/Tactiques/SectionModal';
import LoadingSpinner from '../components/Others/LoadingSpinner';
import { 
  ChevronDownIcon, 
  PlusIcon, 
} from '@heroicons/react/24/outline';

type ViewMode = 'hierarchy' | 'table' | 'timeline';

export default function TactiquesPage() {
  // Hooks
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
    // NOUVEAU: Propriétés du modal
    sectionModal,
    handleSaveSection,
    closeSectionModal,
    handleAddSection,
    handleEditSection,
    handleDeleteSection,
    handleSectionExpand,
    handleCreateTactique,
    handleUpdateTactique,
    handleDeleteTactique,
    handleCreatePlacement,
    handleUpdatePlacement,
    handleDeletePlacement,
    handleCreateCreatif,
    handleUpdateCreatif,
    handleDeleteCreatif,
    handleAddOnglet,
    handleRenameOnglet,
    handleDeleteOnglet,
    handleSelectOnglet,
  } = useTactiquesData(selectedCampaign, selectedVersion);

  // États pour l'UI et le loading
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  
  // Refs pour les dropdowns
  const campaignDropdownRef = useRef<HTMLDivElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);

  // États de chargement et erreur
  const isLoading = campaignLoading || loading;
  const hasError = campaignError || error;

  // Gérer le loader avec une logique simplifiée
  useEffect(() => {
    if (isLoading) {
      console.log('🔄 Début chargement');
      setShowLoader(true);
      setMinimumTimeElapsed(false);
    } else {
      console.log('🏁 Chargement terminé - attendre 2s minimum');
      // Quand le chargement est fini, attendre 2s puis masquer
      const timer = setTimeout(() => {
        console.log('✅ 2 secondes écoulées - masquer loader');
        setShowLoader(false);
        setMinimumTimeElapsed(true);
      }, 2000);

      return () => {
        console.log('🧹 Nettoyage timer fin de chargement');
        clearTimeout(timer);
      };
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

  // Mettre à jour le budget total quand la campagne change
  useEffect(() => {
    if (selectedCampaign) {
      setTotalBudget(selectedCampaign.budget || 0);
    } else {
      setTotalBudget(0);
    }
  }, [selectedCampaign]);
  
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
  
  // Gestionnaire temporaire pour le drag and drop
  const handleDragEnd = async (result: any) => {
    console.log('Drag and drop à implémenter:', result);
  };
  
  // Formater les montants en CAD
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  };
    
  // Préparer les données pour les vues
  const sectionsWithTactiques: SectionWithTactiques[] = sections.map(section => ({
    ...section,
    tactiques: tactiques[section.id] || [],
  }));
    
  const budgetUtilisé = sections.reduce((total, section) => total + (section.SECTION_Budget || 0), 0);
  const budgetRestant = totalBudget - budgetUtilisé;
    
  const sectionNames = sections.reduce((names, section) => {
    names[section.id] = section.SECTION_Name;
    return names;
  }, {} as Record<string, string>);
    
  const flatTactiques = Object.values(tactiques).flat();

  return (
    <div className="space-y-6 pb-16">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tactiques</h1>
        
        {selectedCampaign && (
          <div className="text-right">
            <div className="text-sm text-gray-500">Budget total: <span className="font-medium">{formatCurrency(totalBudget)}</span></div>
            <div className={`text-sm ${budgetRestant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Budget restant: <span className="font-medium">{formatCurrency(budgetRestant)}</span>
            </div>
            {selectedCampaign && selectedVersion && (
              <div className="text-xs text-gray-400 mt-1">
                {selectedCampaign.name} • {selectedVersion.name}
              </div>
            )}
          </div>
        )}
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
            <span>{selectedCampaign?.name || 'Sélectionner une campagne'}</span>
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
                    {campaign.name}
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
      
      {/* Debug info - à supprimer après résolution */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mb-2 p-2 bg-gray-100 rounded">
          Debug: campaignLoading={campaignLoading.toString()}, loading={loading.toString()}, 
          showLoader={showLoader.toString()}, minimumTimeElapsed={minimumTimeElapsed.toString()}
        </div>
      )} */}
      
      {/* LoadingSpinner avec timer minimum de 2 secondes */}
      {showLoader && <LoadingSpinner message="Chargement des tactiques..." />}
      
      {selectedVersion && !showLoader && (
        <div className="w-full">
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
              {sections.length > 0 && (
                <button
                  onClick={() => handleCreateTactique(sections[0].id)}
                  className="flex items-center px-3 py-1.5 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <PlusIcon className="h-5 w-5 mr-1.5" />
                  Nouvelle tactique
                </button>
              )}
            </div>
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
                      onSectionExpand={handleSectionExpand}
                      onDragEnd={handleDragEnd}
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
                  campaignStartDate={selectedCampaign.startDate}
                  campaignEndDate={selectedCampaign.endDate}
                  formatCurrency={formatCurrency}
                  onEditTactique={(tactiqueId, sectionId) => {
                    const tactique = flatTactiques.find(t => t.id === tactiqueId);
                    if (tactique) {
                      // Logique d'édition à implémenter
                      console.log('Éditer tactique:', tactique);
                    }
                  }}
                />
              )}
            </>
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

      {/* NOUVEAU: Modal de section */}
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