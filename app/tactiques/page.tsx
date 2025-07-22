// app/tactiques/page.tsx - Version avec réinitialisation forcée de la sélection

'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useTactiquesCrud } from '../hooks/useTactiquesCrud';
import { useTactiquesSelection } from '../hooks/useTactiquesSelection';
import { useTactiquesEnrichedData, useTactiquesFormatting, useTactiquesUIStates } from '../hooks/useTactiquesEnrichedData';
import { useTactiquesRefresh, useTactiquesModals } from '../hooks/useTactiquesRefresh';

import CampaignVersionSelector from '../components/Others/CampaignVersionSelector';
import TactiquesHierarchyView from '../components/Tactiques/Views/Hierarchy/TactiquesHierarchyView';
import TactiquesAdvancedTableView from '../components/Tactiques/Views/Table/TactiquesAdvancedTableView';
import TactiquesTimelineView from '../components/Tactiques/Views/Timeline/TactiquesTimelineView';
import TactiquesFooter from '../components/Tactiques/TactiquesFooter';
import { default as SectionModal } from '../components/Tactiques/SectionModal';
import LoadingSpinner from '../components/Others/LoadingSpinner';
import TactiquesBudgetPanel from '../components/Tactiques/TactiquesBudgetPanel';
import SelectedActionsPanel from '../components/Tactiques/SelectedActionsPanel';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { useClient } from '../contexts/ClientContext';

// ==================== TYPES ====================

type ViewMode = 'hierarchy' | 'table' | 'timeline';

// ==================== COMPOSANT PRINCIPAL ====================

export default function TactiquesPage() {
  
  // ==================== DONNÉES PRINCIPALES ====================

  const { selectedClient } = useClient();
  
  const {
    campaigns,
    versions,
    selectedCampaign,
    selectedVersion,
    onglets,
    selectedOnglet,
    sections,
    tactiques,
    placements,
    creatifs,
    loading,
    error,
    stage,
    handleCampaignChange,
    handleVersionChange,
    handleOngletChange,
    refresh
  } = useAppData();

  // ==================== ÉTATS UI ====================

  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  
  // 🔥 AJOUT: Ref pour forcer le re-render de TactiquesHierarchyView
  const [hierarchyViewKey, setHierarchyViewKey] = useState(0);

  // ==================== HOOKS SPÉCIALISÉS ====================

  // Hook pour les opérations CRUD
  const crudActions = useTactiquesCrud({
    sections,
    tactiques,
    placements,
    creatifs,
    selectedCampaign,
    onglets,
    onRefresh: refresh
  });

  // 🔥 CALLBACK DE RESET COMPLET
  const handleForceSelectionReset = useCallback(() => {
    console.log('🔄 Force reset complet de la vue hiérarchique');
    
    // Forcer le re-render de TactiquesHierarchyView qui va réinitialiser
    // tous les hooks de sélection internes
    setHierarchyViewKey(prev => prev + 1);
    
    // Petit délai pour s'assurer que le re-render est effectif
    setTimeout(() => {
      console.log('✅ Vue hiérarchique réinitialisée');
    }, 100);
  }, []);

  // Hook pour les sélections avec fonction de reset
  const selectionState = useTactiquesSelection({
    sections,
    tactiques,
    placements,
    creatifs,
    onRefresh: refresh,
    onDeleteSection: crudActions.handleDeleteSection,
    onDeleteTactique: crudActions.handleDeleteTactique,
    onDeletePlacement: crudActions.handleDeletePlacement,
    onDeleteCreatif: crudActions.handleDeleteCreatif,
    // 🔥 AJOUT: Fonction de reset forcé
    onForceSelectionReset: handleForceSelectionReset
  });

  // Hook pour le refresh et les frais client
  const refreshState = useTactiquesRefresh({
    selectedClientId: selectedClient?.clientId,
    loading,
    onRefresh: refresh
  });

  // Hook pour les modals et expansions
  const modalState = useTactiquesModals();

  // Hook pour les données enrichies
  const enrichedData = useTactiquesEnrichedData({
    sections,
    tactiques,
    placements,
    creatifs,
    selectedItems: selectionState.selectedItems,
    sectionExpansions: modalState.sectionExpansions
  });

  // Hooks utilitaires
  const { formatCurrency, formatStatistics } = useTactiquesFormatting();
  const { getContainerClasses, getContentClasses, getMainContentClasses, getLoadingStates } = useTactiquesUIStates();

  // ==================== GESTIONNAIRES DE MODAL SECTION ====================

  const handleSaveSection = useCallback(async (sectionData: any) => {
    try {
      if (modalState.sectionModal.mode === 'create') {
        await crudActions.handleCreateSection(sectionData);
      } else if (modalState.sectionModal.mode === 'edit' && modalState.sectionModal.section) {
        await crudActions.handleUpdateSection(modalState.sectionModal.section.id, sectionData);
      }
      
      modalState.closeSectionModal();
      await refresh();
    } catch (error) {
      console.error('❌ Erreur sauvegarde section:', error);
    }
  }, [modalState.sectionModal.mode, modalState.sectionModal.section, crudActions, modalState.closeSectionModal, refresh]);
  
  const handleAddSection = useCallback(() => {
    modalState.openSectionModal(null, 'create');
  }, [modalState.openSectionModal]);
  
  const handleEditSection = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      modalState.openSectionModal(section, 'edit');
    }
  }, [sections, modalState.openSectionModal]);

  // ==================== 🔥 GESTIONNAIRE DE REFRESH AVEC RESET ====================
  
  const handleRefreshWithReset = useCallback(async () => {
    console.log('🔄 Refresh avec réinitialisation complète');
    
    // 1. Nettoyer d'abord la sélection
    selectionState.handleClearSelection();
    
    // 2. Puis rafraîchir les données
    await refresh();
    
    // 3. Attendre que le refresh soit terminé puis forcer le reset
    setTimeout(() => {
      handleForceSelectionReset();
    }, 200);
  }, [selectionState.handleClearSelection, refresh, handleForceSelectionReset]);

  // ==================== DONNÉES CALCULÉES ====================

  const totalBudget = useMemo(() => {
    return selectedCampaign?.CA_Budget || 0;
  }, [selectedCampaign]);

  const statistics = useMemo(() => {
    return formatStatistics(placements, creatifs);
  }, [formatStatistics, placements, creatifs]);

  const loadingStates = getLoadingStates(
    loading, 
    selectedOnglet, 
    refreshState.isRefreshing, 
    selectionState.duplicationLoading || selectionState.deletionLoading,
    refreshState.clientFeesLoading
  );

  const hasError = !!error;

  // ==================== RENDU ====================

  return (
    <div className={getContainerClasses()}>
      
      {/* ==================== EN-TÊTE AVEC BOUTON REFRESH ==================== */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900">Tactiques</h1>
          
          {/* Bouton refresh */}
          {selectedOnglet && (
            <button
              onClick={refreshState.handleManualRefresh}
              disabled={refreshState.isRefreshing || loading}
              className={`
                flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200
                ${refreshState.isRefreshing || loading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                }
              `}
              title="Actualiser les données"
            >
              <ArrowPathIcon 
                className={`h-4 w-4 ${(refreshState.isRefreshing || loading) ? 'animate-spin' : ''}`} 
              />
            </button>
          )}
        </div>
      </div>

      {/* ==================== SÉLECTEUR CAMPAGNE/VERSION ==================== */}
      <CampaignVersionSelector
        campaigns={campaigns}
        versions={versions}
        selectedCampaign={selectedCampaign}
        selectedVersion={selectedVersion}
        loading={loading}
        error={error}
        onCampaignChange={handleCampaignChange}
        onVersionChange={handleVersionChange}
        className="mb-6"
      />

      {/* ==================== INDICATEURS DE CHARGEMENT ==================== */}
      
      {loadingStates.shouldShowTopIndicator && (
        <div className={`border rounded-lg p-3 mb-4 ${
          refreshState.isRefreshing 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-indigo-50 border-indigo-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${
              refreshState.isRefreshing 
                ? 'border-blue-600' 
                : 'border-indigo-600'
            }`}></div>
            <span className={`text-sm ${
              refreshState.isRefreshing 
                ? 'text-blue-700' 
                : 'text-indigo-700'
            }`}>
              {refreshState.isRefreshing ? 'Actualisation des données...' : (stage || 'Actualisation en cours...')}
            </span>
          </div>
        </div>
      )}

      {selectionState.duplicationLoading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            <span className="text-sm text-green-700">Duplication en cours...</span>
          </div>
        </div>
      )}

      {selectionState.deletionLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            <span className="text-sm text-red-700">Suppression en cours...</span>
          </div>
        </div>
      )}

      {refreshState.clientFeesLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Chargement des frais du client...</span>
          </div>
        </div>
      )}

      {/* ==================== AFFICHAGE D'ERREUR ==================== */}
      {hasError && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-red-600">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={handleRefreshWithReset} // 🔥 UTILISATION DU REFRESH AVEC RESET
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CHARGEMENT COMPLET ==================== */}
      {loadingStates.shouldShowFullLoader && (
        <LoadingSpinner 
          message={stage || "Chargement des tactiques..."} 
          minimumDuration={1500}
        />
      )}

      {/* ==================== CONTENU PRINCIPAL ==================== */}
      {selectedVersion && !loadingStates.shouldShowFullLoader && (
        <div className={getContentClasses(viewMode)}>
          
          {/* Zone de contenu principal */}
          <div className={getMainContentClasses(viewMode)}>
            
            {/* Panel d'actions groupées */}
            {selectionState.selectedItems.size > 0 && viewMode === 'hierarchy' && (
              <SelectedActionsPanel
                selectedItems={selectionState.selectedItemsWithData}
                onDuplicateSelected={selectionState.handleDuplicateSelected}
                onDeleteSelected={selectionState.handleDeleteSelected}
                onClearSelection={selectionState.handleClearSelection}
                onRefresh={handleRefreshWithReset} // 🔥 UTILISATION DU REFRESH AVEC RESET
                loading={loadingStates.isLoading}
                hierarchyContext={enrichedData.hierarchyContextForMove}
              />
            )}
            
            {/* Barre d'outils */}
            {(viewMode === 'hierarchy' || viewMode === 'timeline') && (
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

                {/* Statistiques */}
                {enrichedData.sectionsWithTactiques.length > 0 && (
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{statistics.placementsText}</span>
                    <span>{statistics.creatifsText}</span>
                    {selectionState.selectedItems.size > 0 && (
                      <span className="text-indigo-600 font-medium">
                        {selectionState.selectedItems.size} sélectionné{selectionState.selectedItems.size > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Contenu selon le mode de vue */}
            {!hasError && (
              <>
                {viewMode === 'hierarchy' && (
                  <>
                    {enrichedData.sectionsWithTactiques.length > 0 ? (
                      <TactiquesHierarchyView
                        key={hierarchyViewKey} // 🔥 FORCER LE RE-RENDER AVEC CLÉ
                        sections={enrichedData.sectionsWithTactiques}
                        placements={enrichedData.enrichedPlacements} 
                        creatifs={enrichedData.enrichedCreatifs} 
                        onSectionExpand={modalState.handleSectionExpand}
                        onEditSection={handleEditSection}
                        onDeleteSection={crudActions.handleDeleteSection}
                        onCreateTactique={crudActions.handleCreateTactique}
                        onUpdateTactique={crudActions.handleUpdateTactique}
                        onDeleteTactique={crudActions.handleDeleteTactique}
                        onCreatePlacement={crudActions.handleCreatePlacement}
                        onUpdatePlacement={crudActions.handleUpdatePlacement}
                        onDeletePlacement={crudActions.handleDeletePlacement}
                        onCreateCreatif={crudActions.handleCreateCreatif}
                        onUpdateCreatif={crudActions.handleUpdateCreatif}
                        onDeleteCreatif={crudActions.handleDeleteCreatif}
                        formatCurrency={formatCurrency}
                        totalBudget={totalBudget}
                        onRefresh={handleRefreshWithReset} // 🔥 UTILISATION DU REFRESH AVEC RESET
                        onDuplicateSelected={selectionState.handleDuplicateSelected}
                        onDeleteSelected={selectionState.handleDeleteSelected}
                        onClearSelection={selectionState.handleClearSelection}
                        loading={loadingStates.isLoading}
                        hierarchyContext={enrichedData.hierarchyContextForMove}
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
                  <div className="w-full">
                    <TactiquesAdvancedTableView
                      sections={sections}
                      tactiques={tactiques}
                      placements={placements}
                      creatifs={creatifs}
                      onUpdateTactique={crudActions.handleUpdateTactique}
                      onUpdateSection={crudActions.handleUpdateSection}
                      onUpdatePlacement={crudActions.handleUpdatePlacement}
                      onUpdateCreatif={crudActions.handleUpdateCreatif}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                )}

                {viewMode === 'timeline' && selectedCampaign && (
                  <TactiquesTimelineView
                    tactiques={enrichedData.flatTactiques}
                    sectionNames={enrichedData.sectionNames}
                    campaignStartDate={selectedCampaign.CA_Start_Date}
                    campaignEndDate={selectedCampaign.CA_End_Date}
                    formatCurrency={formatCurrency}
                    onEditTactique={(tactiqueId, sectionId) => {
                      const tactique = enrichedData.flatTactiques.find(t => t.id === tactiqueId);
                      if (tactique) {
                        console.log('Éditer tactique:', tactique);
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* Budget Panel */}
          {(viewMode === 'hierarchy' || viewMode === 'timeline') && (
            <TactiquesBudgetPanel
              selectedCampaign={selectedCampaign}
              sections={sections}
              tactiques={tactiques}
              selectedOnglet={selectedOnglet}
              onglets={onglets}
              formatCurrency={formatCurrency}
              clientFees={refreshState.clientFees}
            />
          )}
        </div>
      )}

      {/* Message si aucune version sélectionnée */}
      {!loadingStates.shouldShowFullLoader && !hasError && !selectedVersion && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">
            Veuillez sélectionner une campagne et une version pour voir les tactiques.
          </p>
        </div>
      )}

      {/* Footer avec onglets et boutons de vue */}
      {selectedOnglet && !loadingStates.shouldShowFullLoader && (
        <TactiquesFooter
          viewMode={viewMode}
          setViewMode={setViewMode}
          onglets={onglets}
          selectedOnglet={selectedOnglet}
          onSelectOnglet={handleOngletChange}
          onAddOnglet={crudActions.handleAddOnglet} 
          onRenameOnglet={crudActions.handleRenameOnglet} 
          onDeleteOnglet={crudActions.handleDeleteOnglet} 
        />
      )}

      {/* Modal de section */}
      <SectionModal
        isOpen={modalState.sectionModal.isOpen}
        onClose={modalState.closeSectionModal}
        onSave={handleSaveSection}
        section={modalState.sectionModal.section}
        mode={modalState.sectionModal.mode}
      />
    </div>
  );
}