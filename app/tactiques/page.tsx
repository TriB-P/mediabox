// app/tactiques/page.tsx - CORRECTION INTÉGRATION DÉPLACEMENT

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useCampaignSelection } from '../hooks/useCampaignSelection';
import { useTactiquesData } from '../hooks/useTactiquesData';
import { SectionWithTactiques, Section, Tactique, Placement, Creatif } from '../types/tactiques';
import CampaignVersionSelector from '../components/Others/CampaignVersionSelector';
import TactiquesHierarchyView from '../components/Tactiques/Views/Hierarchy/TactiquesHierarchyView';
import TactiquesAdvancedTableView from '../components/Tactiques/Views/Table/TactiquesAdvancedTableView';
import TactiquesTimelineView from '../components/Tactiques/Views/Timeline/TactiquesTimelineView';
import TactiquesFooter from '../components/Tactiques/TactiquesFooter';
import { default as SectionModal } from '../components/Tactiques/SectionModal';
import LoadingSpinner from '../components/Others/LoadingSpinner';
import TactiquesBudgetPanel from '../components/Tactiques/TactiquesBudgetPanel';
import SelectedActionsPanel from '../components/Tactiques/SelectedActionsPanel';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { duplicateSelectedItems, DuplicationContext } from '../lib/duplicationService';
import { getClientFees } from '../lib/feeService';
import { ClientFee } from '../lib/budgetService';

// ==================== TYPES ====================

type ViewMode = 'hierarchy' | 'table' | 'timeline';

// ==================== FONCTION UTILITAIRE POUR CALCULER LE BUDGET DES SECTIONS ====================

const calculateSectionBudget = (sectionId: string, tactiques: { [sectionId: string]: Tactique[] }): number => {
  const sectionTactiques = tactiques[sectionId] || [];
  return sectionTactiques.reduce((total, tactique) => {
    return total + (tactique.TC_Budget || 0);
  }, 0);
};

const calculateSectionPercentage = (sectionBudget: number, totalBudget: number): number => {
  if (totalBudget <= 0) return 0;
  return Math.round((sectionBudget / totalBudget) * 100);
};

// ==================== COMPOSANT PRINCIPAL ====================

export default function TactiquesPage() {
  
  // ==================== HOOKS PRINCIPAUX ====================

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

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
    loading: tactiquesLoading,
    error: tactiquesError,
    setError,
    shouldShowFullLoader,
    shouldShowTopIndicator,
    onglets,
    selectedOnglet,
    sections,
    tactiques,
    placements,
    creatifs,
    sectionModal,
    handleSaveSection,
    closeSectionModal,
    handleSectionExpand,
    sectionExpansions,
    handleCreateTactique,
    handleUpdateTactique,
    handleDeleteTactique,
    handleCreatePlacement,
    handleUpdatePlacement,
    handleDeletePlacement,
    handleCreateCreatif,
    handleUpdateCreatif,
    handleDeleteCreatif,
    handleSelectOnglet,
    onRefresh,
    handleAddSection,
    handleEditSection,
    handleDeleteSection,
    handleAddOnglet,
    handleRenameOnglet,
    handleDeleteOnglet,
    removeSectionLocally,
    removeTactiqueAndChildrenLocally,
    removePlacementAndChildrenLocally,
    removeCreatifLocally,
  } = useTactiquesData(selectedCampaign, selectedVersion);

  // ==================== ÉTATS UI ====================

  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [duplicationLoading, setDuplicationLoading] = useState(false);
  const [clientFees, setClientFees] = useState<ClientFee[]>([]);
  const [clientFeesLoading, setClientFeesLoading] = useState(false);

  // ==================== EFFET POUR CHARGER LES FRAIS DU CLIENT ====================

  useEffect(() => {
    const loadClientFees = async () => {
      if (!selectedClient?.clientId) {
        setClientFees([]);
        return;
      }

      try {
        setClientFeesLoading(true);
        console.log('🔄 Chargement des frais pour le client:', selectedClient.clientId);
        
        const fees = await getClientFees(selectedClient.clientId);
        
        const adaptedFees: ClientFee[] = fees.map(fee => ({
          ...fee,
          options: []
        }));
        
        setClientFees(adaptedFees);
        
        console.log('✅ Frais du client chargés:', fees.length, 'frais');
      } catch (error) {
        console.error('❌ Erreur lors du chargement des frais du client:', error);
        setClientFees([]);
      } finally {
        setClientFeesLoading(false);
      }
    };

    loadClientFees();
  }, [selectedClient?.clientId]);

  // ==================== GESTION DU BUDGET ====================

  const totalBudget = useMemo(() => {
    return selectedCampaign?.CA_Budget || 0;
  }, [selectedCampaign]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // ==================== ADAPTATEURS POUR ADVANCED TABLE ====================

  const handleAdvancedUpdateSection = useCallback(async (sectionId: string, data: Partial<Section>) => {
    try {
      await handleEditSection(sectionId);
    } catch (error) {
      console.error('Erreur mise à jour section:', error);
      throw error;
    }
  }, [handleEditSection]);

  const handleAdvancedUpdateTactique = useCallback(async (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => {
    try {
      await handleUpdateTactique(sectionId, tactiqueId, data);
    } catch (error) {
      console.error('Erreur mise à jour tactique:', error);
      throw error;
    }
  }, [handleUpdateTactique]);

  const handleAdvancedUpdatePlacement = useCallback(async (placementId: string, data: Partial<Placement>) => {
    try {
      await handleUpdatePlacement(placementId, data);
    } catch (error) {
      console.error('Erreur mise à jour placement:', error);
      throw error;
    }
  }, [handleUpdatePlacement]);

  const handleAdvancedUpdateCreatif = useCallback(async (creatifId: string, data: Partial<Creatif>) => {
    try {
      await handleUpdateCreatif(creatifId, data);
    } catch (error) {
      console.error('Erreur mise à jour créatif:', error);
      throw error;
    }
  }, [handleUpdateCreatif]);

  // ==================== GESTION DES SÉLECTIONS ====================

  const handleSelectItems = useCallback((
    itemIds: string[],
    type: 'section' | 'tactique' | 'placement' | 'creatif',
    isSelected: boolean
  ) => {
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      itemIds.forEach(id => {
        if (isSelected) {
          newSelected.add(id);
        } else {
          newSelected.delete(id);
        }
      });
      return newSelected;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // ==================== DUPLICATION INTÉGRÉE ====================

  const handleDuplicateSelected = useCallback(async (itemIds: string[]) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      setError('Contexte manquant pour la duplication');
      return;
    }

    if (itemIds.length === 0) {
      return;
    }

    console.log('🔄 Début duplication de', itemIds.length, 'éléments:', itemIds);

    try {
      setDuplicationLoading(true);

      const context: DuplicationContext = {
        clientId: selectedClient.clientId,
        campaignId: selectedCampaignId,
        versionId: selectedVersionId,
        ongletId: selectedOngletId
      };

      const itemHierarchy = {
        sections,
        tactiques,
        placements,
        creatifs
      };

      const result = await duplicateSelectedItems(context, itemIds, itemHierarchy);

      if (result.success && result.duplicatedIds.length > 0) {
        console.log('✅ Duplication réussie:', result.duplicatedIds);
        
        const successMessage = `${result.duplicatedIds.length} élément${result.duplicatedIds.length > 1 ? 's dupliqués' : ' dupliqué'} avec succès`;
        
        const successToast = document.createElement('div');
        successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        successToast.textContent = successMessage;
        document.body.appendChild(successToast);
        
        setTimeout(() => {
          document.body.removeChild(successToast);
        }, 3000);

        await onRefresh();
        handleClearSelection();

      } else {
        const errorMessages = result.errors.length > 0 ? result.errors : ['Erreur inconnue lors de la duplication'];
        console.error('❌ Erreurs duplication:', errorMessages);
        
        setError(`Erreur lors de la duplication: ${errorMessages.join(', ')}`);
      }

    } catch (error) {
      console.error('💥 Erreur critique duplication:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(`Erreur critique lors de la duplication: ${errorMessage}`);
    } finally {
      setDuplicationLoading(false);
    }
  }, [
    selectedClient?.clientId, 
    selectedCampaignId, 
    selectedVersionId, 
    selectedOngletId,
    sections, 
    tactiques, 
    placements, 
    creatifs,
    onRefresh, 
    handleClearSelection, 
    setError
  ]);

  const handleDeleteSelected = useCallback(async (itemIds: string[]) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer les ${itemIds.length} éléments sélectionnés ? Cette action est irréversible.`)) {
      return;
    }

    console.log('🗑️ Suppression des éléments:', itemIds);

    for (const itemId of Array.from(itemIds)) {
      let itemType: 'section' | 'tactique' | 'placement' | 'creatif' | undefined;
      let currentSectionId: string | undefined;
      let currentTactiqueId: string | undefined;
      let currentPlacementId: string | undefined;
      let currentCreatifId: string | undefined; 

      for (const section of sections) {
        if (section.id === itemId) {
          itemType = 'section';
          currentSectionId = section.id;
          break;
        }
        if (tactiques[section.id]) {
          for (const tactique of tactiques[section.id]) {
            if (tactique.id === itemId) {
              itemType = 'tactique';
              currentSectionId = section.id;
              currentTactiqueId = tactique.id;
              break;
            }
            if (placements[tactique.id]) {
              for (const placement of placements[tactique.id]) {
                if (placement.id === itemId) {
                  itemType = 'placement';
                  currentSectionId = section.id;
                  currentTactiqueId = tactique.id;
                  currentPlacementId = placement.id;
                  break;
                }
                if (creatifs[placement.id]) {
                  for (const creatif of creatifs[placement.id]) {
                    if (creatif.id === itemId) {
                      itemType = 'creatif';
                      currentSectionId = section.id;
                      currentTactiqueId = tactique.id;
                      currentPlacementId = placement.id;
                      currentCreatifId = creatif.id; 
                      break;
                    }
                  }
                }
              }
            }
            if (itemType) break;
          }
        }
        if (itemType) break;
      }

      try {
        switch (itemType) {
          case 'section':
            if (currentSectionId) {
              removeSectionLocally(currentSectionId);
              handleDeleteSection(currentSectionId);
              console.log(`✅ Section ${itemId} supprimée`);
            }
            break;
          case 'tactique':
            if (currentSectionId && currentTactiqueId) {
              removeTactiqueAndChildrenLocally(currentSectionId, currentTactiqueId);
              handleDeleteTactique(currentSectionId, currentTactiqueId);
              console.log(`✅ Tactique ${itemId} supprimée`);
            }
            break;
          case 'placement':
            if (currentSectionId && currentTactiqueId && currentPlacementId) {
              removePlacementAndChildrenLocally(currentSectionId, currentTactiqueId, currentPlacementId);
              handleDeletePlacement(currentSectionId, currentTactiqueId, currentPlacementId);
              console.log(`✅ Placement ${itemId} supprimé`);
            }
            break;
          case 'creatif':
            if (currentSectionId && currentTactiqueId && currentPlacementId && currentCreatifId) {
              removeCreatifLocally(currentSectionId, currentTactiqueId, currentPlacementId, currentCreatifId);
              handleDeleteCreatif(currentSectionId, currentTactiqueId, currentPlacementId, currentCreatifId);
              console.log(`✅ Créatif ${itemId} supprimé`);
            }
            break;
          default:
            console.warn(`⚠️ Type d'élément inconnu pour ${itemId}`);
        }
      } catch (opError) {
        console.error(`❌ Erreur suppression ${itemId}:`, opError);
        setError(`Erreur lors de la suppression de ${itemId}`);
        onRefresh();
      }
    }

    handleClearSelection();
  }, [
    sections, tactiques, placements, creatifs, 
    handleDeleteSection, handleDeleteTactique, handleDeletePlacement, handleDeleteCreatif,
    removeSectionLocally, removeTactiqueAndChildrenLocally, removePlacementAndChildrenLocally, removeCreatifLocally,
    onRefresh, handleClearSelection, setError
  ]);

  // ==================== PRÉPARATION DES DONNÉES AVEC CALCUL DE BUDGET ====================

  const sectionsWithTactiques: SectionWithTactiques[] = useMemo(() => {
    return sections.map(section => {
      const sectionTactiques = tactiques[section.id] || [];
      
      const calculatedSectionBudget = calculateSectionBudget(section.id, tactiques);
      
      const mappedTactiques = sectionTactiques.map(tactique => {
        const tactiquePlacements = placements[tactique.id] || [];
        
        const mappedPlacements = tactiquePlacements.map(placement => {
          const placementCreatifs = creatifs[placement.id] || [];
          
          const mappedCreatifs = placementCreatifs.map(creatif => ({
            ...creatif,
            isSelected: selectedItems.has(creatif.id)
          }));

          const isPlacementSelected = selectedItems.has(placement.id) || 
                                      (mappedCreatifs.length > 0 && mappedCreatifs.every(c => c.isSelected));

          return {
            ...placement,
            creatifs: mappedCreatifs,
            isSelected: isPlacementSelected
          };
        });

        const isTactiqueSelected = selectedItems.has(tactique.id) || 
                                   (mappedPlacements.length > 0 && mappedPlacements.every(p => p.isSelected));

        return {
          ...tactique,
          placements: mappedPlacements,
          isSelected: isTactiqueSelected
        };
      });

      const isSectionSelected = selectedItems.has(section.id) ||
                                (mappedTactiques.length > 0 && mappedTactiques.every(t => t.isSelected));

      return {
        ...section,
        SECTION_Budget: calculatedSectionBudget,
        tactiques: mappedTactiques,
        isSelected: isSectionSelected,
        isExpanded: sectionExpansions[section.id] || false
      };
    });
  }, [sections, tactiques, placements, creatifs, selectedItems, sectionExpansions]);

  // ==================== DONNÉES ENRICHIES POUR LES COMPOSANTS ====================

  const enrichedPlacements = useMemo(() => {
    const result: { [tactiqueId: string]: Placement[] } = {};
    sectionsWithTactiques.forEach(section => {
      section.tactiques.forEach(tactique => {
        if (tactique.placements) {
          result[tactique.id] = tactique.placements;
        }
      });
    });
    return result;
  }, [sectionsWithTactiques]);

  const enrichedCreatifs = useMemo(() => {
    const result: { [placementId: string]: Creatif[] } = {};
    sectionsWithTactiques.forEach(section => {
      section.tactiques.forEach(tactique => {
        if (tactique.placements) {
          tactique.placements.forEach(placement => {
            if (placement.creatifs) {
              result[placement.id] = placement.creatifs;
            }
          });
        }
      });
    });
    return result;
  }, [sectionsWithTactiques]);

  const sectionNames = useMemo(() => {
    return sections.reduce((names, section) => {
      names[section.id] = section.SECTION_Name;
      return names;
    }, {} as Record<string, string>);
  }, [sections]);

  const flatTactiques = useMemo(() => {
    return Object.values(tactiques).flat();
  }, [tactiques]);

  // ==================== 🔥 NOUVEAU: PRÉPARATION DU CONTEXTE HIÉRARCHIQUE POUR LE DÉPLACEMENT ====================

  const hierarchyContextForMove = useMemo(() => {
    return {
      sections: sections,
      tactiques: tactiques,
      placements: placements,
      creatifs: creatifs
    };
  }, [sections, tactiques, placements, creatifs]);

  // ==================== 🔥 NOUVEAU: DONNÉES ENRICHIES POUR LE PANEL D'ACTIONS ====================

  const selectedItemsWithData = useMemo(() => {
    const result: Array<{
      id: string;
      name: string;
      type: 'section' | 'tactique' | 'placement' | 'creatif';
      data?: Section | Tactique | Placement | Creatif;
    }> = [];

    Array.from(selectedItems).forEach(itemId => {
      // Chercher l'élément dans la hiérarchie
      for (const section of sectionsWithTactiques) {
        if (section.id === itemId) {
          result.push({
            id: itemId,
            name: section.SECTION_Name,
            type: 'section',
            data: section
          });
          return;
        }
        
        for (const tactique of section.tactiques) {
          if (tactique.id === itemId) {
            result.push({
              id: itemId,
              name: tactique.TC_Label,
              type: 'tactique',
              data: tactique
            });
            return;
          }
          
          if (tactique.placements) {
            for (const placement of tactique.placements) {
              if (placement.id === itemId) {
                result.push({
                  id: itemId,
                  name: placement.PL_Label,
                  type: 'placement',
                  data: placement
                });
                return;
              }
              
              if (placement.creatifs) {
                for (const creatif of placement.creatifs) {
                  if (creatif.id === itemId) {
                    result.push({
                      id: itemId,
                      name: creatif.CR_Label,
                      type: 'creatif',
                      data: creatif
                    });
                    return;
                  }
                }
              }
            }
          }
        }
      }
    });

    return result;
  }, [selectedItems, sectionsWithTactiques]);

  // ==================== GESTION D'ERREUR ====================

  const hasError = campaignError || tactiquesError;
  const isLoading = campaignLoading || tactiquesLoading || duplicationLoading || clientFeesLoading;

  // ==================== CLASSES CSS POUR MARGES RÉDUITES ====================

  const getContainerClasses = () => {
    return "space-y-6 pb-16 px-3";
  };

  const getContentClasses = () => {
    if (viewMode === 'table') {
      return "w-full";
    } else {
      return "w-full flex";
    }
  };

  const getMainContentClasses = () => {
    if (viewMode === 'table') {
      return "w-full";
    } else {
      return "flex-1 mr-4";
    }
  };

  // ==================== RENDU ====================

  return (
    <div className={getContainerClasses()}>
      
      {/* ==================== EN-TÊTE ==================== */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tactiques</h1>
      </div>

      {/* ==================== SÉLECTEUR CAMPAGNE/VERSION ==================== */}
      <CampaignVersionSelector
        campaigns={campaigns}
        versions={versions}
        selectedCampaign={selectedCampaign}
        selectedVersion={selectedVersion}
        loading={campaignLoading}
        error={campaignError}
        onCampaignChange={handleCampaignChange}
        onVersionChange={handleVersionChange}
        className="mb-6"
      />

      {/* ==================== INDICATEURS DE CHARGEMENT ==================== */}
      {shouldShowTopIndicator && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-indigo-700">Actualisation en cours...</span>
          </div>
        </div>
      )}

      {duplicationLoading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            <span className="text-sm text-green-700">Duplication en cours...</span>
          </div>
        </div>
      )}

      {clientFeesLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Chargement des frais du client...</span>
          </div>
        </div>
      )}

      {/* ==================== CHARGEMENT COMPLET ==================== */}
      {shouldShowFullLoader && (
        <LoadingSpinner 
          message="Chargement des tactiques..." 
          minimumDuration={1500}
        />
      )}

      {/* ==================== CONTENU PRINCIPAL ==================== */}
      {selectedVersion && !shouldShowFullLoader && (
        <div className={getContentClasses()}>
          
          {/* Zone de contenu principal */}
          <div className={getMainContentClasses()}>
            
            {/* 🔥 NOUVEAU: Panneau d'actions groupées avec contexte hiérarchique */}
            {selectedItems.size > 0 && viewMode === 'hierarchy' && (
              <SelectedActionsPanel
                selectedItems={selectedItemsWithData}
                onDuplicateSelected={handleDuplicateSelected}
                onDeleteSelected={handleDeleteSelected}
                onClearSelection={handleClearSelection}
                onRefresh={onRefresh}
                loading={isLoading}
                hierarchyContext={hierarchyContextForMove}
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
                {sectionsWithTactiques.length > 0 && (
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {Object.values(placements).reduce((total, tacticPlacements) => total + tacticPlacements.length, 0)} placement{Object.values(placements).reduce((total, tacticPlacements) => total + tacticPlacements.length, 0) !== 1 ? 's' : ''}
                    </span>
                    <span>
                      {Object.values(creatifs).reduce((total, placementCreatifs) => total + placementCreatifs.length, 0)} créatif{Object.values(creatifs).reduce((total, placementCreatifs) => total + placementCreatifs.length, 0) !== 1 ? 's' : ''}
                    </span>
                    {selectedItems.size > 0 && (
                      <span className="text-indigo-600 font-medium">
                        {selectedItems.size} sélectionné{selectedItems.size > 1 ? 's' : ''}
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
                    {sectionsWithTactiques.length > 0 ? (
                      <TactiquesHierarchyView
                        sections={sectionsWithTactiques}
                        placements={enrichedPlacements} 
                        creatifs={enrichedCreatifs} 
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
                        onRefresh={onRefresh}
                        onSelectItems={handleSelectItems}
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
                      onUpdateTactique={handleAdvancedUpdateTactique}
                      onUpdateSection={handleAdvancedUpdateSection}
                      onUpdatePlacement={handleAdvancedUpdatePlacement}
                      onUpdateCreatif={handleAdvancedUpdateCreatif}
                      formatCurrency={formatCurrency}
                    />
                  </div>
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

          {/* Budget Panel */}
          {(viewMode === 'hierarchy' || viewMode === 'timeline') && (
            <TactiquesBudgetPanel
              selectedCampaign={selectedCampaign}
              sections={sections}
              tactiques={tactiques}
              selectedOnglet={selectedOnglet}
              onglets={onglets}
              formatCurrency={formatCurrency}
              clientFees={clientFees}
            />
          )}
        </div>
      )}

      {/* Message si aucune version sélectionnée */}
      {!shouldShowFullLoader && !hasError && !selectedVersion && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">
            Veuillez sélectionner une campagne et une version pour voir les tactiques.
          </p>
        </div>
      )}

      {/* Footer avec onglets et boutons de vue */}
      {selectedOnglet && !shouldShowFullLoader && (
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