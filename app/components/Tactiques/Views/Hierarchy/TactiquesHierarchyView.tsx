// app/components/Tactiques/Views/Hierarchy/TactiquesHierarchyView.tsx

/**
 * ✅ MISE À JOUR : Intégration de la persistance des états d'expansion
 * Remplace les useState locaux par useExpandedStates pour maintenir
 * les états collapse/expand lors des refresh de données
 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  PencilIcon,
  PlusIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import {
  Section,
  SectionWithTactiques,
  Tactique,
  Placement,
  Creatif
} from '../../../../types/tactiques';
import TactiqueDrawer from '../../Tactiques/TactiqueDrawer';
import PlacementDrawer from '../../Placement/PlacementDrawer';
import CreatifDrawer from '../../Creatif/CreatifDrawer';
import TaxonomyContextMenu from './TaxonomyContextMenu';
import SelectedActionsPanel from '../../SelectedActionsPanel';
import { DndKitTactiqueItem } from './DndKitHierarchyComponents';
import { useAdvancedDragDrop } from '../../../../hooks/useAdvancedDragDrop';
import { useExpandedStates } from '../../../../hooks/useExpandedStates'; // ✅ NOUVEAU !
import { useClient } from '../../../../contexts/ClientContext';
import { useSelection } from '../../../../contexts/SelectionContext';
import { useSelectionLogic } from '../../../../hooks/useSelectionLogic';
import { useSelectionValidation, useSelectionMessages, buildHierarchyMap } from '../../../../hooks/useSelectionValidation';
import { reorderSections } from '../../../../lib/tactiqueService';
import { useCampaignData, formatCurrencyAmount } from '../../../../hooks/useCampaignData';
import { useTranslation } from '../../../../contexts/LanguageContext';

interface TactiquesHierarchyViewProps {
  sections: SectionWithTactiques[];
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  onSectionExpand: (sectionId: string) => void;
  onEditSection?: (sectionId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onCreateTactique?: (sectionId: string) => Promise<Tactique>;
  onUpdateTactique?: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  onDeleteTactique?: (sectionId: string, tactiqueId: string) => void;
  onCreatePlacement?: (tactiqueId: string) => Promise<Placement>;
  onUpdatePlacement?: (placementId: string, data: Partial<Placement>, sectionId?: string, tactiqueId?: string) => Promise<void>;
  onDeletePlacement?: (sectionId: string, tactiqueId: string, placementId: string) => void;
  onCreateCreatif?: (placementId: string) => Promise<Creatif>;
  onUpdateCreatif?: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string, data: Partial<Creatif>) => Promise<void>;
  onDeleteCreatif?: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => void;
  formatCurrency: (amount: number) => string;
  totalBudget: number;
  onRefresh?: () => Promise<void>;
  onDuplicateSelected?: (itemIds: string[]) => void;
  onDeleteSelected?: (itemIds: string[]) => void;
  onClearSelection?: () => void;
  selectedItems?: (SectionWithTactiques | Tactique | Placement | Creatif)[];
  loading?: boolean;
  hierarchyContext?: {
    sections: any[];
    tactiques: { [sectionId: string]: any[] };
    placements: { [tactiqueId: string]: any[] };
    creatifs: { [placementId: string]: any[] };
  };
  onDragRefresh?: () => Promise<void>;
}

export default function TactiquesHierarchyView({
  sections,
  placements,
  creatifs,
  onSectionExpand,
  onEditSection,
  onDeleteSection,
  onCreateTactique,
  onUpdateTactique,
  onDeleteTactique,
  onCreatePlacement,
  onUpdatePlacement,
  onDeletePlacement,
  onCreateCreatif,
  onUpdateCreatif,
  onDeleteCreatif,
  formatCurrency,
  totalBudget,
  onRefresh,
  onDuplicateSelected,
  onDeleteSelected,
  onClearSelection,
  loading = false,
  hierarchyContext,
  onDragRefresh
}: TactiquesHierarchyViewProps) {

  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  const { currency, loading: campaignLoading } = useCampaignData();

  const formatCurrencyWithCampaignCurrency = (amount: number): string => {
    return formatCurrencyAmount(amount, currency);
  };

  const selectionLogic = useSelectionLogic({ sections });

  const hierarchyMap = useMemo(() => {
    return buildHierarchyMap(sections);
  }, [sections]);

  const selectedIds = useMemo(() => {
    return Array.from(selectionLogic.rawSelectedIds);
  }, [selectionLogic]);

  const validationResult = useSelectionValidation({
    hierarchyMap,
    selectedIds
  });

  const selectionMessages = useSelectionMessages(validationResult);

  // ✅ NOUVEAU : Hook de persistance des états d'expansion
  const expandedStates = useExpandedStates({
    sections,
    tactiques: hierarchyContext?.tactiques || {},
    placements,
    creatifs
  });

  // ✅ CHANGÉ : Utilise le hook avancé avec hierarchyContext
  const { isDragLoading, sensors, handleDragEnd } = useAdvancedDragDrop({
    sections,
    placements,
    creatifs,
    onRefresh,
    onDragSuccess: onDragRefresh,
    hierarchyContext
  });

  // États pour le hover, drawers, etc. (inchangés)
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [hoveredTactique, setHoveredTactique] = useState<{sectionId: string, tactiqueId: string} | null>(null);
  const [hoveredPlacement, setHoveredPlacement] = useState<{sectionId: string, tactiqueId: string, placementId: string} | null>(null);
  const [hoveredCreatif, setHoveredCreatif] = useState<{sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null>(null);

  const [tactiqueDrawer, setTactiqueDrawer] = useState<{
    isOpen: boolean;
    tactique: Tactique | null;
    sectionId: string;
    mode: 'create' | 'edit';
  }>({
    isOpen: false,
    tactique: null,
    sectionId: '',
    mode: 'create'
  });

  const [placementDrawer, setPlacementDrawer] = useState<{
    isOpen: boolean;
    placement: Placement | null;
    tactiqueId: string;
    sectionId: string; 
    mode: 'create' | 'edit';
  }>({
    isOpen: false,
    placement: null,
    tactiqueId: '',
    sectionId: '', 
    mode: 'create'
  });

  const [creatifDrawer, setCreatifDrawer] = useState<{
    isOpen: boolean;
    creatif: Creatif | null;
    placementId: string;
    tactiqueId: string;
    sectionId: string;
    mode: 'create' | 'edit';
  }>({
    isOpen: false,
    creatif: null,
    placementId: '',
    tactiqueId: '',
    sectionId: '',
    mode: 'create'
  });

  const [taxonomyMenuState, setTaxonomyMenuState] = useState<{
    isOpen: boolean;
    item: Placement | Creatif | null;
    itemType: 'placement' | 'creatif' | null;
    taxonomyType: 'tags' | 'platform' | 'mediaocean' | null;
    position: { x: number; y: number };
    sectionId: string | null;
    tactiqueId: string | null;
    placementId: string | null;
  }>({
    isOpen: false,
    item: null,
    itemType: null,
    taxonomyType: null,
    position: { x: 0, y: 0 },
    sectionId: null,
    tactiqueId: null,
    placementId: null
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fonctions utilitaires (inchangées)
  const calculatePercentage = (amount: number) => {
    if (totalBudget <= 0) return 0;
    return Math.round((amount / totalBudget) * 100);
  };

  const handleCopyId = async (id: string, type: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      const textArea = document.createElement('textarea');
      textArea.value = id;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        console.error('Erreur lors de la copie fallback:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleMoveSectionUp = async (sectionId: string, currentIndex: number) => {
    if (currentIndex === 0) return;

    if (!selectedClient || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('Contexte client/campagne manquant pour la réorganisation');
      return;
    }

    try {
      const newSectionOrders = sections.map((section, index) => {
        if (index === currentIndex) {
          return { id: section.id, order: currentIndex - 1 };
        } else if (index === currentIndex - 1) {
          return { id: section.id, order: currentIndex };
        } else {
          return { id: section.id, order: index };
        }
      });

      await reorderSections(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        newSectionOrders
      );

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Erreur lors du déplacement de la section:', error);
    }
  };

  // ✅ CHANGÉ : Utilise les gestionnaires du hook de persistance
  // const handleTactiqueExpand = (tactiqueId: string) => { ... } // SUPPRIMÉ
  // const handlePlacementExpand = (placementId: string) => { ... } // SUPPRIMÉ

  // Gestionnaires de sélection (inchangés)
  const handleSectionSelect = (sectionId: string, isSelected: boolean) => {
    selectionLogic.toggleSelection(sectionId, isSelected);
  };

  const handleTactiqueSelect = (tactiqueId: string, isSelected: boolean) => {
    selectionLogic.toggleSelection(tactiqueId, isSelected);
  };

  const handlePlacementSelect = (placementId: string, isSelected: boolean) => {
    selectionLogic.toggleSelection(placementId, isSelected);
  };

  const handleCreatifSelect = (creatifId: string, isSelected: boolean) => {
    selectionLogic.toggleSelection(creatifId, isSelected);
  };

  // Toutes les autres fonctions existantes restent identiques...
  const handleEditTactique = (sectionId: string, tactique: Tactique) => {
    setTactiqueDrawer({
      isOpen: true,
      tactique,
      sectionId,
      mode: 'edit'
    });
  };

  const handleSaveComment = async (sectionId: string, tactiqueId: string, comment: string) => {
    if (!onUpdateTactique) return;
  
    try {
      await onUpdateTactique(sectionId, tactiqueId, { TC_Comment: comment });
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du commentaire:', error);
    }
  };

  const handleEditPlacement = (tactiqueId: string, placement: Placement) => {
    let sectionId = '';
    for (const section of sections) {
      if (section.tactiques.some(t => t.id === tactiqueId)) {
        sectionId = section.id;
        break;
      }
    }
  
    setPlacementDrawer({
      isOpen: true,
      placement,
      tactiqueId,
      sectionId,
      mode: 'edit'
    });
  };

  const handleEditCreatif = (placementId: string, creatif: Creatif) => {
    let sectionId = '';
    let tactiqueId = '';
    
    for (const section of sections) {
      for (const tactique of section.tactiques) {
        const tactiquePlacements = tactique.placements || [];
        if (tactiquePlacements.some(p => p.id === placementId)) {
          sectionId = section.id;
          tactiqueId = tactique.id;
          break;
        }
      }
      if (tactiqueId) break;
    }

    setCreatifDrawer({
      isOpen: true,
      creatif,
      placementId,
      tactiqueId,
      sectionId,
      mode: 'edit'
    });
  };

  // Gestionnaires de sauvegarde (inchangés)
  const handleSaveTactique = async (tactiqueData: any) => {
    if (!onUpdateTactique) return;
  
    try {
      if (tactiqueDrawer.mode === 'create') {
        if (!onCreateTactique) {
          return;
        }
        
        const newTactique = await onCreateTactique(tactiqueDrawer.sectionId);
        await onUpdateTactique(tactiqueDrawer.sectionId, newTactique.id, tactiqueData);
      } else {
        if (!tactiqueDrawer.tactique) return;
        await onUpdateTactique(tactiqueDrawer.sectionId, tactiqueDrawer.tactique.id, tactiqueData);
      }
      
      setTactiqueDrawer(prev => ({ ...prev, isOpen: false }));
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tactique:', error);
    }
  };

  const handleSavePlacement = async (placementData: any) => {
    if (!onUpdatePlacement) return;

    try {
      if (placementDrawer.mode === 'create') {        
        if (!onCreatePlacement) {
          console.error('onCreatePlacement non disponible');
          return;
        }
        
        const newPlacement = await onCreatePlacement(placementDrawer.tactiqueId);
        await onUpdatePlacement(
          newPlacement.id, 
          placementData,
          placementDrawer.sectionId, 
          placementDrawer.tactiqueId  
        );
      } else {
        if (!placementDrawer.placement) return;
        
        await onUpdatePlacement(
          placementDrawer.placement.id, 
          placementData,
          placementDrawer.sectionId, 
          placementDrawer.tactiqueId  
        );
      }
      
      setPlacementDrawer(prev => ({ ...prev, isOpen: false }));
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du placement:', error);
    }
  };

  const handleSaveCreatif = async (creatifData: any) => {
    if (!onUpdateCreatif || !creatifDrawer.placementId) return;
  
    try {
      if (creatifDrawer.mode === 'create') {        
        if (!onCreateCreatif) {
          console.error('onCreateCreatif non disponible');
          return;
        }
        
        const newCreatif = await onCreateCreatif(creatifDrawer.placementId);
        await onUpdateCreatif(
          creatifDrawer.sectionId,
          creatifDrawer.tactiqueId,
          creatifDrawer.placementId,
          newCreatif.id,
          creatifData
        );
      } else {
        if (!creatifDrawer.creatif) return;
        
        await onUpdateCreatif(
          creatifDrawer.sectionId,
          creatifDrawer.tactiqueId,
          creatifDrawer.placementId,
          creatifDrawer.creatif.id,
          creatifData
        );
      }
      
      setCreatifDrawer(prev => ({ ...prev, isOpen: false }));
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du créatif:', error);
    }
  };

  const handleCreateTactiqueLocal = async (sectionId: string) => {
    setTactiqueDrawer({
      isOpen: true,
      tactique: null,   
      sectionId,
      mode: 'create'    
    });
  };

  const handleCreatePlacementLocal = async (tactiqueId: string) => {
    let sectionId = '';
    for (const section of sections) {
      if (section.tactiques.some(t => t.id === tactiqueId)) {
        sectionId = section.id;
        break;
      }
    }
  
    if (!sectionId) {
      console.error('Section parent non trouvée pour la tactique');
      return;
    }
  
    setPlacementDrawer({
      isOpen: true,
      placement: null,
      tactiqueId,
      sectionId,
      mode: 'create'
    });
  };

  const handleCreateCreatifLocal = async (placementId: string) => {
    let sectionId = '';
    let tactiqueId = '';
    
    for (const section of sections) {
      for (const tactique of section.tactiques) {
        const tactiquePlacements = tactique.placements || [];
        if (tactiquePlacements.some(p => p.id === placementId)) {
          sectionId = section.id;
          tactiqueId = tactique.id;
          break;
        }
      }
      if (tactiqueId) break;
    }

    if (!sectionId || !tactiqueId) {
      console.error('Hiérarchie parent non trouvée pour le placement');
      return;
    }

    setCreatifDrawer({
      isOpen: true,
      creatif: null,
      placementId,
      tactiqueId,
      sectionId,
      mode: 'create'
    });
  };

  // Gestionnaires des menus contextuels (inchangés)
  const handleOpenTaxonomyMenu = (
    item: Placement | Creatif,
    itemType: 'placement' | 'creatif',
    taxonomyType: 'tags' | 'platform' | 'mediaocean',
    position: { x: number; y: number }
  ) => {
    let contextSectionId: string | null = null;
    let contextTactiqueId: string | null = null;
    let contextPlacementId: string | null = null;

    for (const section of sections) {
      for (const tactique of section.tactiques) {
        if (itemType === 'placement' && tactique.placements) {
          const foundPlacement = tactique.placements.find(p => p.id === item.id);
          if (foundPlacement) {
            contextSectionId = section.id;
            contextTactiqueId = tactique.id;
            break;
          }
        } else if (itemType === 'creatif' && tactique.placements) {
          for (const placement of tactique.placements) {
            const placementCreatifs = creatifs[placement.id] || [];
            const foundCreatif = placementCreatifs.find(c => c.id === item.id);
            if (foundCreatif) {
              contextSectionId = section.id;
              contextTactiqueId = tactique.id;
              contextPlacementId = placement.id;
              break;
            }
          }
          if (contextPlacementId) break;
        }
      }
      if (contextTactiqueId) break;
    }

    setTaxonomyMenuState({
      isOpen: true,
      item,
      itemType,
      taxonomyType,
      position,
      sectionId: contextSectionId,
      tactiqueId: contextTactiqueId,
      placementId: contextPlacementId
    });
  };

  const handleCloseTaxonomyMenu = () => {
    setTaxonomyMenuState({
      isOpen: false,
      item: null,
      itemType: null,
      taxonomyType: null,
      position: { x: 0, y: 0 },
      sectionId: null,
      tactiqueId: null,
      placementId: null
    });
  };

  // Calcul des éléments sélectionnés (inchangé)
  const selectedItems = useMemo(() => {
    const selection = selectionLogic.getSelectedItems();
    const result: Array<{
      id: string;
      name: string;
      type: 'section' | 'tactique' | 'placement' | 'creatif';
      data?: Section | Tactique | Placement | Creatif;
    }> = [];

    selection.details.forEach(detail => {
      for (const section of sections) {
        if (section.id === detail.id) {
          result.push({
            id: detail.id,
            name: section.SECTION_Name,
            type: 'section',
            data: section
          });
          return;
        }

        for (const tactique of section.tactiques) {
          if (tactique.id === detail.id) {
            result.push({
              id: detail.id,
              name: tactique.TC_Label,
              type: 'tactique',
              data: tactique
            });
            return;
          }

          if (tactique.placements) {
            for (const placement of tactique.placements) {
              if (placement.id === detail.id) {
                result.push({
                  id: detail.id,
                  name: placement.PL_Label,
                  type: 'placement',
                  data: placement
                });
                return;
              }

              if (placement.creatifs) {
                for (const creatif of placement.creatifs) {
                  if (creatif.id === detail.id) {
                    result.push({
                      id: detail.id,
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
  }, [selectionLogic, sections]);

  const handleClearSelectionLocal = () => {
    selectionLogic.clearSelection();
    onClearSelection?.();
  };

  // Fonctions utilitaires pour trouver les éléments (inchangées)
  const findTactiqueById = (tactiqueId: string): Tactique | undefined => {
    for (const section of sections) {
      const tactique = section.tactiques.find(t => t.id === tactiqueId);
      if (tactique) return tactique;
    }
    return undefined;
  };

  const findPlacementById = (placementId: string): { placement: Placement; tactique: Tactique } | undefined => {
    for (const section of sections) {
      for (const tactique of section.tactiques) {
        const tactiquePlacements = tactique.placements || [];
        const placement = tactiquePlacements.find(p => p.id === placementId);
        if (placement) {
          return { placement, tactique };
        }
      }
    }
    return undefined;
  };

  const currentTactiqueData = placementDrawer.tactiqueId ?
    findTactiqueById(placementDrawer.tactiqueId) :
    undefined;

  const currentPlacementContext = creatifDrawer.placementId ?
    findPlacementById(creatifDrawer.placementId) :
    undefined;

  return (
    <>
      {/* Indicateur de loading pendant le drag and drop */}
      {isDragLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span className="text-gray-700">{t('tactiquesHierarchyView.dragAndDrop.reorganizing')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Panel d'actions pour les éléments sélectionnés */}
      {selectedItems.length > 0 && (
        <SelectedActionsPanel
          selectedItems={selectedItems}
          onDuplicateSelected={onDuplicateSelected || (() => {})}
          onDeleteSelected={onDeleteSelected || (() => {})}
          onClearSelection={handleClearSelectionLocal}
          onRefresh={onRefresh}
          loading={loading}
          validationResult={validationResult}
          hierarchyContext={hierarchyContext}
        />
      )}

      {/* DndContext */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            
            {/* Sections avec tactiques */}
            {sections.map((section, sectionIndex) => (
              <div
                key={`section-${section.id}`}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                {/* Section header */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  <div
                    className={`flex justify-between items-center px-4 py-3 bg-white hover:bg-gray-50 transition-colors ${
                      section.isExpanded ? 'bg-gray-50' : ''
                    } ${selectionLogic.isSelected(section.id) ? 'bg-indigo-50' : ''}`}
                    style={{ borderLeft: `4px solid ${section.SECTION_Color || '#6366f1'}` }}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
                        checked={selectionLogic.isSelected(section.id)}
                        onChange={(e) => handleSectionSelect(section.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSectionUp(section.id, sectionIndex);
                        }}
                        disabled={sectionIndex === 0}
                        className={`pr-2 p-2 rounded transition-colors ${
                          sectionIndex === 0 
                            ? 'cursor-not-allowed text-gray-300' 
                            : 'cursor-pointer text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                        }`}
                        title={sectionIndex === 0 ? t('tactiquesHierarchyView.section.alreadyFirst') : t('tactiquesHierarchyView.section.moveUp')}
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>

                      <div 
                        className="section-expand-area flex items-center cursor-pointer"
                        onClick={() => onSectionExpand(section.id)}
                      >
                        {section.isExpanded ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                        )}

                        <h3 className="font-medium text-gray-900">{section.SECTION_Name}</h3>

                        {section.tactiques.length > 0 && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            {section.tactiques.length}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateTactiqueLocal(section.id);
                        }}
                        className={`ml-2 p-1 rounded hover:bg-gray-200 transition-colors ${
                          hoveredSection === section.id ? 'text-indigo-600' : 'text-indigo-400'
                        }`}
                        title={t('tactiquesHierarchyView.section.addTactique')}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="relative min-w-[48px] h-6">
                        {hoveredSection === section.id && (
                          <div className="absolute right-0 top-0 flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyId(section.id, 'section');
                              }}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                              title={copiedId === section.id ? t('tactiquesHierarchyView.common.idCopied') : t('tactiquesHierarchyView.common.copyId')}
                            >
                              <KeyIcon className={`h-3 w-3 ${copiedId === section.id ? 'text-green-500' : 'text-gray-300'}`} />
                            </button>
                            {onEditSection && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSection(section.id);
                                }}
                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                                title={t('tactiquesHierarchyView.section.edit')}
                              >
                                <PencilIcon className="h-4 w-4 text-gray-500" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium">
                        {formatCurrencyWithCampaignCurrency(section.SECTION_Budget || 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {calculatePercentage(section.SECTION_Budget || 0)}% {t('tactiquesHierarchyView.section.ofBudget')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✅ CHANGÉ : Utilise expandedStates au lieu des useState locaux */}
                {section.isExpanded && (
                  <div className="bg-white">
                    {section.tactiques.length === 0 ? (
                      <div className="pl-12 py-3 text-sm text-gray-500 italic">
                        {t('tactiquesHierarchyView.tactique.noneInSection')}
                      </div>
                    ) : (
                      <SortableContext 
                        items={section.tactiques.map(t => `tactique-${t.id}`)} 
                        strategy={verticalListSortingStrategy}
                      >
                        {section.tactiques.map((tactique, tactiqueIndex) => {
                          const tactiquePlacements = tactique.placements || [];

                          return (
                            <DndKitTactiqueItem
                              key={tactique.id}
                              tactique={{
                                ...tactique,
                                isSelected: selectionLogic.isSelected(tactique.id)
                              }}
                              index={tactiqueIndex}
                              sectionId={section.id}
                              placements={tactiquePlacements.map(p => ({
                                ...p,
                                isSelected: selectionLogic.isSelected(p.id)
                              }))}
                              creatifs={Object.fromEntries(
                                Object.entries(creatifs).map(([placementId, placementCreatifs]) => [
                                  placementId,
                                  placementCreatifs.map(c => ({
                                    ...c,
                                    isSelected: selectionLogic.isSelected(c.id)
                                  }))
                                ])
                              )}
                              expandedTactiques={expandedStates.expandedTactiques} // ✅ CHANGÉ
                              expandedPlacements={expandedStates.expandedPlacements} // ✅ CHANGÉ
                              hoveredTactique={hoveredTactique}
                              hoveredPlacement={hoveredPlacement}
                              hoveredCreatif={hoveredCreatif}
                              copiedId={copiedId}
                              onHoverTactique={setHoveredTactique}
                              onHoverPlacement={setHoveredPlacement}
                              onHoverCreatif={setHoveredCreatif}
                              onExpandTactique={expandedStates.handleTactiqueExpand} // ✅ CHANGÉ
                              onExpandPlacement={expandedStates.handlePlacementExpand} // ✅ CHANGÉ
                              onEdit={handleEditTactique}
                              onCreatePlacement={handleCreatePlacementLocal}
                              onEditPlacement={handleEditPlacement}
                              onCreateCreatif={handleCreateCreatifLocal}
                              onEditCreatif={handleEditCreatif}
                              formatCurrency={formatCurrencyWithCampaignCurrency}
                              onSelect={handleTactiqueSelect}
                              onSelectPlacement={handlePlacementSelect}
                              onSelectCreatif={handleCreatifSelect}
                              onOpenTaxonomyMenu={handleOpenTaxonomyMenu}
                              onCopyId={handleCopyId}
                              onSaveComment={handleSaveComment}
                            />
                          );
                        })}
                      </SortableContext>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DndContext>

      {/* TOUS les drawers existants (inchangés) */}
      <TactiqueDrawer
        isOpen={tactiqueDrawer.isOpen}
        onClose={() => setTactiqueDrawer(prev => ({ ...prev, isOpen: false }))}
        tactique={tactiqueDrawer.tactique}
        sectionId={tactiqueDrawer.sectionId}
        mode={tactiqueDrawer.mode}
        onSave={handleSaveTactique}
      />

      <PlacementDrawer
        isOpen={placementDrawer.isOpen}
        onClose={() => setPlacementDrawer(prev => ({ ...prev, isOpen: false }))}
        placement={placementDrawer.placement}
        tactiqueId={placementDrawer.tactiqueId}
        tactiqueData={currentTactiqueData}
        onSave={handleSavePlacement}
      />

      <CreatifDrawer
        isOpen={creatifDrawer.isOpen}
        onClose={() => setCreatifDrawer(prev => ({ ...prev, isOpen: false }))}
        creatif={creatifDrawer.creatif}
        placementId={creatifDrawer.placementId}
        placementData={currentPlacementContext?.placement}
        tactiqueData={currentPlacementContext?.tactique}
        onSave={handleSaveCreatif}
      />

      {/* Menu contextuel pour les taxonomies */}
      {selectedClient && taxonomyMenuState.isOpen && (
        <TaxonomyContextMenu
          isOpen={taxonomyMenuState.isOpen}
          onClose={handleCloseTaxonomyMenu}
          position={taxonomyMenuState.position}
          item={taxonomyMenuState.item!}
          itemType={taxonomyMenuState.itemType!}
          taxonomyType={taxonomyMenuState.taxonomyType!}
          clientId={selectedClient.clientId}
          campaignId={selectedCampaignId || undefined}
          versionId={selectedVersionId || undefined}
          ongletId={selectedOngletId || undefined}
          sectionId={taxonomyMenuState.sectionId || undefined}
          tactiqueId={taxonomyMenuState.tactiqueId || undefined}
          placementId={taxonomyMenuState.placementId || undefined}
        />
      )}
    </>
  );
}