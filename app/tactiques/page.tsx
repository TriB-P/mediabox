// app/tactiques/page.tsx - Version simplifiée avec nouvelle architecture

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useCampaignSelection } from '../hooks/useCampaignSelection';
import { useTactiquesData } from '../hooks/useTactiquesData';
import { SectionWithTactiques, Section, Tactique, Placement, Creatif } from '../types/tactiques';
import CampaignVersionSelector from '../components/Others/CampaignVersionSelector';
import TactiquesHierarchyView from '../components/Tactiques/TactiquesHierarchyView';
import TactiquesTableView from '../components/Tactiques/TactiquesTableView';
import TactiquesTimelineView from '../components/Tactiques/TactiquesTimelineView';
import TactiquesFooter from '../components/Tactiques/TactiquesFooter';
import { default as SectionModal } from '../components/Tactiques/SectionModal';
import LoadingSpinner from '../components/Others/LoadingSpinner';
import TactiquesBudgetPanel from '../components/Tactiques/TactiquesBudgetPanel';
import SelectedActionsPanel from '../components/Tactiques/SelectedActionsPanel';
import { PlusIcon } from '@heroicons/react/24/outline';

// ==================== TYPES ====================

type ViewMode = 'hierarchy' | 'table' | 'timeline';

// ==================== COMPOSANT PRINCIPAL ====================

export default function TactiquesPage() {
  
  // ==================== HOOKS PRINCIPAUX ====================

  // Hook de sélection campagne/version (simplifié)
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

  // Hook de données tactiques (avec useDataFlow intégré)
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

  const handleDuplicateSelected = useCallback(async (itemIds: string[]) => {
    alert(`🚧 Duplication à implémenter pour: ${itemIds.join(', ')}`);
    console.log('🔄 Duplication des éléments:', itemIds);
    await onRefresh();
    handleClearSelection();
  }, [onRefresh, handleClearSelection]);

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

      // Recherche du type et contexte de l'élément
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

      // Suppression avec mise à jour optimiste
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
        onRefresh(); // Fallback en cas d'erreur
      }
    }

    handleClearSelection();
  }, [
    sections, tactiques, placements, creatifs, 
    handleDeleteSection, handleDeleteTactique, handleDeletePlacement, handleDeleteCreatif,
    removeSectionLocally, removeTactiqueAndChildrenLocally, removePlacementAndChildrenLocally, removeCreatifLocally,
    onRefresh, handleClearSelection, setError
  ]);

  // ==================== PRÉPARATION DES DONNÉES AVEC SÉLECTION ====================

  const sectionsWithTactiques: SectionWithTactiques[] = useMemo(() => {
    return sections.map(section => {
      const sectionTactiques = tactiques[section.id] || [];
      
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
        tactiques: mappedTactiques,
        isSelected: isSectionSelected,
        // 🔥 SYNCHRONISATION: Utiliser l'état d'expansion de useDataFlow
        isExpanded: sectionExpansions[section.id] || false
      };
    });
  }, [sections, tactiques, placements, creatifs, selectedItems, sectionExpansions]);

  // Données enrichies pour les composants
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

  // Données pour les autres vues
  const sectionNames = useMemo(() => {
    return sections.reduce((names, section) => {
      names[section.id] = section.SECTION_Name;
      return names;
    }, {} as Record<string, string>);
  }, [sections]);

  const flatTactiques = useMemo(() => {
    return Object.values(tactiques).flat();
  }, [tactiques]);

  // ==================== GESTION D'ERREUR ====================

  const hasError = campaignError || tactiquesError;
  const isLoading = campaignLoading || tactiquesLoading;

  // ==================== RENDU ====================

  return (
    <div className="space-y-6 pb-16">
      
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

      {/* ==================== INDICATEUR DE REFRESH ==================== */}
      {shouldShowTopIndicator && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-indigo-700">Actualisation en cours...</span>
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
        <div className="w-full flex">
          
          {/* Zone de contenu principal */}
          <div className="flex-1 mr-4">
            
            {/* Panneau d'actions groupées */}
            {selectedItems.size > 0 && (
              <SelectedActionsPanel
                selectedItems={Array.from(selectedItems).map(id => {
                  // Trouver l'élément dans la structure
                  for (const section of sectionsWithTactiques) {
                    if (section.id === id) return { id, name: section.SECTION_Name, type: 'section' };
                    for (const tactique of section.tactiques) {
                      if (tactique.id === id) return { id, name: tactique.TC_Label, type: 'tactique' };
                      if (tactique.placements) {
                        for (const placement of tactique.placements) {
                          if (placement.id === id) return { id, name: placement.PL_Label, type: 'placement' };
                          if (placement.creatifs) {
                            for (const creatif of placement.creatifs) {
                              if (creatif.id === id) return { id, name: creatif.CR_Label, type: 'creatif' };
                            }
                          }
                        }
                      }
                    }
                  }
                  return { id, name: 'Unknown', type: 'unknown'} as any;
                }).filter(Boolean)}
                onDuplicateSelected={handleDuplicateSelected}
                onDeleteSelected={handleDeleteSelected}
                onClearSelection={handleClearSelection}
                loading={isLoading}
              />
            )}
            
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