// app/tactiques/page.tsx

/**
 * ✅ CORRIGÉ : Hook useExpandedStates déplacé dans page.tsx
 * Le bouton Expand All / Collapse All a maintenant accès direct aux fonctions du hook
 */
'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAppData } from '../hooks/useAppData';
import { useTactiquesCrud } from '../hooks/useTactiquesCrud';
import { useTactiquesSelection } from '../hooks/useTactiquesSelection';
import { useTactiquesEnrichedData, useTactiquesFormatting, useTactiquesUIStates } from '../hooks/useTactiquesEnrichedData';
import { useTactiquesRefresh, useTactiquesModals } from '../hooks/useTactiquesRefresh';
import { useExpandedStates } from '../hooks/useExpandedStates';

import CampaignVersionSelector from '../components/Others/CampaignVersionSelector';
import TactiquesHierarchyView from '../components/Tactiques/Views/Hierarchy/TactiquesHierarchyView';
import TactiquesAdvancedTableView from '../components/Tactiques/Views/Table/TactiquesAdvancedTableView';
import TactiquesTimelineView from '../components/Tactiques/Views/Timeline/TactiquesTimelineView';
import TactiquesAdvancedTaxonomyView from '../components/Tactiques/Views/Taxonomy/TactiquesAdvancedTaxonomyView';
import TactiquesFooter from '../components/Tactiques/TactiquesFooter';
import { default as SectionModal } from '../components/Tactiques/SectionModal';
import LoadingSpinner from '../components/Others/LoadingSpinner';
import TactiquesBudgetPanel from '../components/Tactiques/TactiquesBudgetPanel';
import SelectedActionsPanel from '../components/Tactiques/SelectedActionsPanel';
import { PlusIcon, ArrowPathIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import { getBreakdowns } from '../lib/breakdownService';
import { ensureDefaultBreakdownForCampaign } from '../lib/campaignService';
import { Breakdown } from '../types/breakdown';

import { useClient } from '../contexts/ClientContext';
import { useTranslation } from '../contexts/LanguageContext';

type ViewMode = 'hierarchy' | 'table' | 'timeline' | 'taxonomy';

const subtleEase: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: subtleEase,
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

const headerVariants: Variants = {
  initial: { opacity: 0, y: -8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: subtleEase },
  },
};

const contentVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: subtleEase, delay: 0.1 },
  },
};

const cardVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: subtleEase }
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: { duration: 0.3, ease: subtleEase }
  }
};

const notificationVariants: Variants = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: subtleEase }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.25, ease: subtleEase }
  }
};

const buttonVariants: Variants = {
  hover: { 
    scale: 1.02, 
    transition: { duration: 0.2, ease: subtleEase } 
  },
  tap: { scale: 0.98 },
};

const spinVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

interface BreakdownsCache {
  clientId: string;
  campaignId: string;
  data: Breakdown[];
  timestamp: number;
}

export default function TactiquesPage() {
  const { t } = useTranslation();
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

  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [hierarchyViewKey, setHierarchyViewKey] = useState(0);
  
  const [breakdownsCache, setBreakdownsCache] = useState<BreakdownsCache | null>(null);
  const [breakdownsLoading, setBreakdownsLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
  const lastCampaignRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ NOUVEAU : Hook useExpandedStates déplacé ici pour accès au bouton
  const expandedStates = useExpandedStates({
    sections,
    tactiques: tactiques,
    placements,
    creatifs
  });

  const crudActions = useTactiquesCrud({
    sections,
    tactiques,
    placements,
    creatifs,
    selectedCampaign,
    onglets,
    onRefresh: refresh
  });

  const handleForceSelectionReset = useCallback(() => {
    console.log('🔄 Force reset complet de la vue hiérarchique');
    setHierarchyViewKey(prev => prev + 1);
    
    setTimeout(() => {
      console.log('✅ Vue hiérarchique réinitialisée');
    }, 100);
  }, []);

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
    onForceSelectionReset: handleForceSelectionReset
  });

  const refreshState = useTactiquesRefresh({
    selectedClientId: selectedClient?.clientId,
    loading,
    onRefresh: refresh
  });

  const modalState = useTactiquesModals();

  const enrichedData = useTactiquesEnrichedData({
    sections,
    tactiques,
    placements,
    creatifs,
    selectedItems: selectionState.selectedItems,
    sectionExpansions: modalState.sectionExpansions
  });

  const { formatCurrency, formatStatistics } = useTactiquesFormatting();
  const { getContainerClasses, getContentClasses, getMainContentClasses, getLoadingStates } = useTactiquesUIStates();

  const loadBreakdowns = useCallback(async (
    clientId: string, 
    campaignId: string, 
    forceReload = false
  ) => {
    const cacheKey = `${clientId}_${campaignId}`;
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000;

    if (!forceReload && 
        breakdownsCache && 
        breakdownsCache.clientId === clientId && 
        breakdownsCache.campaignId === campaignId &&
        (now - breakdownsCache.timestamp) < CACHE_DURATION) {
      console.log(`[CACHE] ✅ Breakdowns trouvés dans le cache pour ${cacheKey}`);
      return breakdownsCache.data;
    }

    if (breakdownsLoading) {
      console.log(`[CACHE] ⚠️ Chargement déjà en cours pour ${cacheKey}`);
      return breakdownsCache?.data || [];
    }

    try {
      setBreakdownsLoading(true);
      console.log(`[CACHE] 📥 Chargement breakdowns depuis Firebase pour ${cacheKey}`);
      console.log(`FIREBASE: LECTURE - Fichier: page.tsx - Fonction: loadBreakdowns - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns`);
      
      const breakdownsData = await getBreakdowns(clientId, campaignId);
      
      const newCache: BreakdownsCache = {
        clientId,
        campaignId,
        data: breakdownsData,
        timestamp: now
      };
      setBreakdownsCache(newCache);
      
      console.log(`[CACHE] ✅ Breakdowns mis en cache pour ${cacheKey} (${breakdownsData.length} éléments)`);
      return breakdownsData;
      
    } catch (error) {
      console.error('Erreur lors du chargement des breakdowns:', error);
      return [];
    } finally {
      setBreakdownsLoading(false);
    }
  }, [breakdownsCache, breakdownsLoading]);

  const handleCampaignChangeWithBreakdowns = useCallback(async (campaign: any) => {
    if (!selectedClient?.clientId) return;
    
    handleCampaignChange(campaign);
    
    if (campaign && lastCampaignRef.current !== campaign.id) {
      lastCampaignRef.current = campaign.id;
      
      try {
        console.log(`✅ Vérification breakdown par défaut pour campagne ${campaign.id}`);
        await ensureDefaultBreakdownForCampaign(selectedClient.clientId, campaign);
        
        await loadBreakdowns(selectedClient.clientId, campaign.id, true);
      } catch (error) {
        console.error('Erreur lors de la vérification des breakdowns:', error);
      }
    }
  }, [selectedClient?.clientId, handleCampaignChange, loadBreakdowns]);

  const handleSaveSection = useCallback(async (sectionData: any) => {
    try {
      if (modalState.sectionModal.mode === 'create') {
        console.log("FIREBASE: ÉCRITURE - Fichier: page.tsx - Fonction: handleSaveSection - Path: sections");
        await crudActions.handleCreateSection(sectionData);
      } else if (modalState.sectionModal.mode === 'edit' && modalState.sectionModal.section) {
        console.log(`FIREBASE: ÉCRITURE - Fichier: page.tsx - Fonction: handleSaveSection - Path: sections/${modalState.sectionModal.section.id}`);
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

  const handleRefreshWithReset = useCallback(async () => {
    console.log('🔄 Refresh avec réinitialisation complète');
    
    selectionState.handleClearSelection();
    
    if (selectedClient?.clientId && selectedCampaign?.id) {
      await loadBreakdowns(selectedClient.clientId, selectedCampaign.id, true);
    }
    
    await refresh();
    
    setTimeout(() => {
      handleForceSelectionReset();
    }, 200);
  }, [selectionState.handleClearSelection, refresh, handleForceSelectionReset, selectedClient?.clientId, selectedCampaign?.id, loadBreakdowns]);

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

  const breakdowns = useMemo(() => {
    return breakdownsCache?.data || [];
  }, [breakdownsCache]);

  // ✅ NOUVEAU : Calcul pour savoir si tout est expanded
  const allExpanded = useMemo(() => {
    const totalItems = 
      sections.length + 
      Object.values(tactiques).flat().length +
      Object.values(placements).flat().length;
    
    const expandedCount = 
      Object.values(expandedStates.expandedSections).filter(Boolean).length +
      Object.values(expandedStates.expandedTactiques).filter(Boolean).length +
      Object.values(expandedStates.expandedPlacements).filter(Boolean).length;
    
    return expandedCount === totalItems && totalItems > 0;
  }, [sections, tactiques, placements, expandedStates]);

  useEffect(() => {
    if (!selectedClient?.clientId || !selectedCampaign?.id) {
      setBreakdownsCache(null);
      return;
    }

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadingTimeoutRef.current = setTimeout(() => {
      loadBreakdowns(selectedClient.clientId!, selectedCampaign.id);
    }, 200);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [selectedClient?.clientId, selectedCampaign?.id, loadBreakdowns]);

  useEffect(() => {
    if (!loadingStates.shouldShowFullLoader && selectedVersion) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [loadingStates.shouldShowFullLoader, selectedVersion]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.div 
      className={getContainerClasses()}
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={headerVariants} className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('tactiquesPage.header.title')}</h1>
          
          {selectedOnglet && (
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={refreshState.handleManualRefresh}
              disabled={refreshState.isRefreshing || loading}
              className={`
                flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200
                ${refreshState.isRefreshing || loading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                }
              `}
              title={t('tactiquesPage.header.refreshTooltip')}
            >
              <motion.div
                variants={refreshState.isRefreshing || loading ? spinVariants : {}}
                animate={refreshState.isRefreshing || loading ? "animate" : ""}
              >
                <ArrowPathIcon className="h-4 w-4" />
              </motion.div>
            </motion.button>
          )}
        </div>
      </motion.div>

      <motion.div variants={contentVariants}>
        <CampaignVersionSelector
          campaigns={campaigns}
          versions={versions}
          selectedCampaign={selectedCampaign}
          selectedVersion={selectedVersion}
          loading={loading}
          error={error}
          onCampaignChange={handleCampaignChangeWithBreakdowns}
          onVersionChange={handleVersionChange}
          className="mb-6"
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {selectionState.duplicationLoading && (
          <motion.div
            key="duplication"
            variants={notificationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4"
          >
            <div className="flex items-center space-x-3">
              <motion.div 
                variants={spinVariants}
                animate="animate"
                className="rounded-full h-4 w-4 border-b-2 border-green-600"
              />
              <span className="text-sm text-green-700">{t('tactiquesPage.notifications.duplicationInProgress')}</span>
            </div>
          </motion.div>
        )}

        {selectionState.deletionLoading && (
          <motion.div
            key="deletion"
            variants={notificationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
          >
            <div className="flex items-center space-x-3">
              <motion.div 
                variants={spinVariants}
                animate="animate"
                className="rounded-full h-4 w-4 border-b-2 border-red-600"
              />
              <span className="text-sm text-red-700">{t('tactiquesPage.notifications.deletionInProgress')}</span>
            </div>
          </motion.div>
        )}

        {refreshState.clientFeesLoading && (
          <motion.div
            key="fees"
            variants={notificationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4"
          >
            <div className="flex items-center space-x-3">
              <motion.div 
                variants={spinVariants}
                animate="animate"
                className="rounded-full h-4 w-4 border-b-2 border-blue-600"
              />
              <span className="text-sm text-blue-700">{t('tactiquesPage.notifications.loadingClientFees')}</span>
            </div>
          </motion.div>
        )}

        {breakdownsLoading && (
          <motion.div
            key="breakdowns"
            variants={notificationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4"
          >
            <div className="flex items-center space-x-3">
              <motion.div 
                variants={spinVariants}
                animate="animate"
                className="rounded-full h-4 w-4 border-b-2 border-indigo-600"
              />
              <span className="text-sm text-indigo-700">{t('tactiquesPage.notifications.loadingBreakdowns', { fallback: 'Chargement des répartitions temporelles...' })}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasError && !loading && (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center space-x-3">
              <div className="text-red-600">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">{t('tactiquesPage.error.loadingTitle')}</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleRefreshWithReset}
                  className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
                >
                  {t('tactiquesPage.error.retry')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loadingStates.shouldShowFullLoader && (
          <LoadingSpinner 
            message={stage || t('tactiquesPage.loader.loadingTactics')} 
            minimumDuration={1500}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContent && (
          <motion.div 
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={getContentClasses(viewMode)}
          >
            <div className={getMainContentClasses(viewMode)}>
              
              <AnimatePresence>
                {selectionState.selectedItems.size > 0 && viewMode === 'hierarchy' && (
                  <motion.div
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <SelectedActionsPanel
                      selectedItems={selectionState.selectedItemsWithData}
                      onDuplicateSelected={selectionState.handleDuplicateSelected}
                      onDeleteSelected={selectionState.handleDeleteSelected}
                      onClearSelection={selectionState.handleClearSelection}
                      onRefresh={handleRefreshWithReset}
                      loading={loadingStates.isLoading}
                      hierarchyContext={enrichedData.hierarchyContextForMove}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* ✅ CORRIGÉ : Bouton utilisant directement expandedStates du hook */}
              {(viewMode === 'hierarchy') && (
                <motion.div variants={cardVariants} className="flex justify-between items-center mb-4">
                  <div className="flex space-x-2">
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={handleAddSection}
                      className="flex items-center px-3 py-1.5 rounded text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 mr-1.5" />
                      {t('tactiquesPage.actions.newSection')}
                    </motion.button>

                    {/* ✅ CORRIGÉ : Bouton qui utilise les fonctions du hook */}
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => {
                        if (allExpanded) {
                          expandedStates.collapseAll();
                        } else {
                          expandedStates.expandAll();
                        }
                      }}
                      className="flex items-center px-3 py-1.5 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {allExpanded ? (
                        <>
                          <ChevronRightIcon className="h-4 w-4 mr-1.5" />
                          {t('tactiquesPage.actions.collapseAll', { fallback: 'Collapse All' })}
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="h-4 w-4 mr-1.5" />
                          {t('tactiquesPage.actions.expandAll', { fallback: 'Expand All' })}
                        </>
                      )}
                    </motion.button>
                  </div>

                  {enrichedData.sectionsWithTactiques.length > 0 && (
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{statistics.placementsText}</span>
                      <span>{statistics.creatifsText}</span>
                      <AnimatePresence>
                        {selectionState.selectedItems.size > 0 && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-indigo-600 font-medium"
                          >
                            {selectionState.selectedItems.size} {t(selectionState.selectedItems.size > 1 ? 'tactiquesPage.selection.selectedPlural' : 'tactiquesPage.selection.selectedSingular')}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}

              {!hasError && (
                <motion.div variants={cardVariants}>
                  {viewMode === 'hierarchy' && (
                    <>
                      {enrichedData.sectionsWithTactiques.length > 0 ? (
                        <TactiquesHierarchyView
                          key={hierarchyViewKey}
                          sections={enrichedData.sectionsWithTactiques}
                          placements={enrichedData.enrichedPlacements} 
                          creatifs={enrichedData.enrichedCreatifs} 
                          onSectionExpand={expandedStates.handleSectionExpand}
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
                          onRefresh={handleRefreshWithReset}
                          onDragRefresh={refreshState.handleManualRefresh}
                          onDuplicateSelected={selectionState.handleDuplicateSelected}
                          onDeleteSelected={selectionState.handleDeleteSelected}
                          onClearSelection={selectionState.handleClearSelection}
                          loading={loadingStates.isLoading}
                          hierarchyContext={{
                            sections: sections,
                            tactiques: tactiques,
                            placements: placements,
                            creatifs: creatifs
                          }}
                          expandedStates={expandedStates}
                        />
                      ) : (
                        <motion.div variants={cardVariants} className="bg-white p-8 rounded-lg shadow text-center">
                          <p className="text-gray-500 mb-4">
                            {t('tactiquesPage.emptyState.noSectionsFound')}
                          </p>
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={handleAddSection}
                            className="flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 mx-auto transition-colors"
                          >
                            <PlusIcon className="h-5 w-5 mr-1.5" />
                            {t('tactiquesPage.actions.newSection')}
                          </motion.button>
                        </motion.div>
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
                      breakdowns={breakdowns}
                      onUpdateTactique={crudActions.handleUpdateTactique}
                    />
                  )}

                  {viewMode === 'taxonomy' && (
                    <div className="w-full">
                      <TactiquesAdvancedTaxonomyView
                        sections={sections}
                        tactiques={tactiques}
                        placements={placements}
                        creatifs={creatifs}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {(viewMode === 'hierarchy') && (
              <motion.div variants={cardVariants}>
                <TactiquesBudgetPanel
                  selectedCampaign={selectedCampaign}
                  sections={sections}
                  tactiques={tactiques}
                  selectedOnglet={selectedOnglet}
                  onglets={onglets}
                  formatCurrency={formatCurrency}
                  clientFees={refreshState.clientFees}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!loadingStates.shouldShowFullLoader && !hasError && !selectedVersion && (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white p-8 rounded-lg shadow text-center"
          >
            <p className="text-gray-500">
              {t('tactiquesPage.emptyState.selectCampaignAndVersion')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
          
      <SectionModal
        isOpen={modalState.sectionModal.isOpen}
        onClose={modalState.closeSectionModal}
        onSave={handleSaveSection}
        section={modalState.sectionModal.section}
        mode={modalState.sectionModal.mode}
      />
    </motion.div>
  );
}