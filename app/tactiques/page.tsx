// app/tactiques/page.tsx - CORRECTION COMPLÈTE DE LA SÉLECTION

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCampaignSelection } from '../hooks/useCampaignSelection';
import { useTactiquesData } from '../hooks/useTactiquesData';
import { SectionWithTactiques, Section, Tactique, Placement, Creatif } from '../types/tactiques';
import TactiquesHierarchyView from '../components/Tactiques/TactiquesHierarchyView';
import TactiquesTableView from '../components/Tactiques/TactiquesTableView';
import TactiquesTimelineView from '../components/Tactiques/TactiquesTimelineView';
import TactiquesFooter from '../components/Tactiques/TactiquesFooter';
import { default as SectionModal } from '../components/Tactiques/SectionModal';
import LoadingSpinner from '../components/Others/LoadingSpinner';
import TactiquesBudgetPanel from '../components/Tactiques/TactiquesBudgetPanel';
import SelectedActionsPanel from '../components/Tactiques/SelectedActionsPanel';
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
    onRefresh,
  } = useTactiquesData(selectedCampaign, selectedVersion);

  // ==================== ÉTATS UI ====================

  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);

  // 🔥 NOUVEAU: État pour les éléments sélectionnés
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Refs pour les dropdowns
  const campaignDropdownRef = useRef<HTMLDivElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);

  // ==================== LOGIQUE DE CHARGEMENT ====================

  const isLoading = campaignLoading || loading;
  const hasError = campaignError || error;

  // Gérer le loader
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

  // Timeout de sécurité
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

  useEffect(() => {
    if (selectedCampaign) {
      setTotalBudget(selectedCampaign.CA_Budget || 0);
    } else {
      setTotalBudget(0);
    }
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
    alert(`Dupliquer les éléments: ${itemIds.join(', ')}`);
  }, [handleClearSelection]);

  const handleDeleteSelected = useCallback(async (itemIds: string[]) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer les ${itemIds.length} éléments sélectionnés ? Cette action est irréversible.`)) {
      return;
    }
    alert(`Supprimer les éléments: ${itemIds.join(', ')}`);
  }, [handleClearSelection]);

  // ==================== PRÉPARATION DES DONNÉES AVEC SÉLECTION CORRIGÉE ====================

  // 🔥 CORRECTION MAJEURE: Enrichissement des données avec états de sélection
  const sectionsWithTactiques: SectionWithTactiques[] = useMemo(() => {
    return sections.map(section => {
      const sectionTactiques = tactiques[section.id] || [];
      
      const mappedTactiques = sectionTactiques.map(tactique => {
        const tactiquePlacements = placements[tactique.id] || [];
        
        const mappedPlacements = tactiquePlacements.map(placement => {
          const placementCreatifs = creatifs[placement.id] || [];
          
          // 🔥 Mapper les créatifs avec leur état de sélection
          const mappedCreatifs = placementCreatifs.map(creatif => ({
            ...creatif,
            isSelected: selectedItems.has(creatif.id)
          }));

          // 🔥 État de sélection du placement : soit explicitement sélectionné, soit tous ses créatifs sont sélectionnés
          const isPlacementSelected = selectedItems.has(placement.id) || 
                                      (mappedCreatifs.length > 0 && mappedCreatifs.every(c => c.isSelected));

          return {
            ...placement,
            creatifs: mappedCreatifs, // 🔥 IMPORTANT: Utiliser les créatifs mappés
            isSelected: isPlacementSelected
          };
        });

        // 🔥 État de sélection de la tactique
        const isTactiqueSelected = selectedItems.has(tactique.id) || 
                                   (mappedPlacements.length > 0 && mappedPlacements.every(p => p.isSelected));

        return {
          ...tactique,
          placements: mappedPlacements, // 🔥 IMPORTANT: Utiliser les placements mappés
          isSelected: isTactiqueSelected
        };
      });

      // 🔥 État de sélection de la section
      const isSectionSelected = selectedItems.has(section.id) ||
                                (mappedTactiques.length > 0 && mappedTactiques.every(t => t.isSelected));

      return {
        ...section,
        tactiques: mappedTactiques,
        isSelected: isSectionSelected
      };
    });
  }, [sections, tactiques, placements, creatifs, selectedItems]);

  // 🔥 CORRECTION: Créer des objets de placements et créatifs basés sur la structure enrichie
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

  const budgetUtilisé = sections.reduce((total, section) => total + (section.SECTION_Budget || 0), 0);
  const budgetRestant = totalBudget - budgetUtilisé;

  const sectionNames = sections.reduce((names, section) => {
    names[section.id] = section.SECTION_Name;
    return names;
  }, {} as Record<string, string>);

  const flatTactiques = Object.values(tactiques).flat();

  // ==================== LOGS ET STATISTIQUES ====================

  useEffect(() => {
    console.log('📋 Placements actuels:', placements);
    console.log('🎨 Créatifs actuels:', creatifs);
    console.log('🎯 Éléments sélectionnés:', Array.from(selectedItems));
    
    const totalPlacements = Object.values(placements).reduce((total, tacticPlacements) => total + tacticPlacements.length, 0);
    const totalCreatifs = Object.values(creatifs).reduce((total, placementCreatifs) => total + placementCreatifs.length, 0);
    
    console.log(`📊 Total placements: ${totalPlacements}`);
    console.log(`🎯 Total créatifs: ${totalCreatifs}`);
  }, [placements, creatifs, selectedItems]);

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
                    onClick={() => handleCampaignChange(campaign)}
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
                    onClick={() => handleVersionChange(version)}
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

      {/* LoadingSpinner */}
      {showLoader && <LoadingSpinner message="Chargement des tactiques..." />}

      {selectedVersion && !showLoader && (
        <div className="w-full flex">
          {/* Zone de contenu principal */}
          <div className="flex-1 mr-4">
            {/* 🔥 Panneau d'actions groupées */}
            {selectedItems.size > 0 && (
              <SelectedActionsPanel
                selectedItems={Array.from(selectedItems).map(id => {
                  // 🔥 CORRECTION: Trouver l'élément dans la structure enrichie
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

              {/* Statistiques dans la barre d'outils */}
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
                        placements={enrichedPlacements} // 🔥 CORRECTION: Utiliser les données enrichies
                        creatifs={enrichedCreatifs} // 🔥 CORRECTION: Utiliser les données enrichies
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