// app/components/Tactiques/Views/Hierarchy/TactiquesHierarchyView.tsx

/**
 * ✅ FINAL : Reçoit expandedStates comme prop
 * Suppression du bouton Expand All / Collapse All (maintenant dans page.tsx)
 * Suppression de l'appel au hook useExpandedStates (maintenant fait dans page.tsx)
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
import HistoryModal from './HistoryModal';
import SelectedActionsPanel from '../../SelectedActionsPanel';
import { DndKitTactiqueItem } from './DndKitHierarchyComponents';
import { DndKitSectionItem } from './DndKitSectionItem';
import { useAdvancedDragDrop } from '../../../../hooks/useAdvancedDragDrop';
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
  expandedStates: {
    expandedSections: { [sectionId: string]: boolean };
    expandedTactiques: { [tactiqueId: string]: boolean };
    expandedPlacements: { [placementId: string]: boolean };
    setExpandedSections: (value: { [sectionId: string]: boolean } | ((prev: { [sectionId: string]: boolean }) => { [sectionId: string]: boolean })) => void;
    setExpandedTactiques: (value: { [tactiqueId: string]: boolean } | ((prev: { [tactiqueId: string]: boolean }) => { [tactiqueId: string]: boolean })) => void;
    setExpandedPlacements: (value: { [placementId: string]: boolean } | ((prev: { [placementId: string]: boolean }) => { [placementId: string]: boolean })) => void;
    handleSectionExpand: (sectionId: string) => void;
    handleTactiqueExpand: (tactiqueId: string) => void;
    handlePlacementExpand: (placementId: string) => void;
    expandAll: () => void;
    collapseAll: () => void;
    clearExpandedStates: () => void;
  };
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
  onDragRefresh,
  expandedStates
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

  // ✅ Utilise le hook avancé avec hierarchyContext
  const { isDragLoading, sensors, handleDragEnd } = useAdvancedDragDrop({
    sections,
    placements,
    creatifs,
    onRefresh,
    onDragSuccess: onDragRefresh,
    hierarchyContext
  });

  // États pour le hover, drawers, etc. (TOUS inchangés)
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

  // État pour le modal d'historique
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    tactique: Tactique | null;
  }>({
    isOpen: false,
    tactique: null
  });

  // Fonctions utilitaires (TOUTES inchangées)
  const handleCopyId = async (
    id: string, 
    type: string, 
    context?: {
      sectionId?: string;
      tactiqueId?: string;
      placementId?: string;
    }
  ) => {
    if (!selectedClient || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('Contexte client/campagne manquant pour générer le chemin');
      return;
    }
  
    // Base du chemin Firebase
    const basePath = `/clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}`;
    
    let fullPath = '';
  
    // Construire le chemin complet selon le type
    switch (type.toLowerCase()) {
      case 'section':
        fullPath = `${basePath}/sections/${id}`;
        break;
        
      case 'tactique':
      case 'tactic':
        if (context?.sectionId) {
          fullPath = `${basePath}/sections/${context.sectionId}/tactiques/${id}`;
        } else {
          const parentSection = sections.find(section => 
            section.tactiques.some(tactique => tactique.id === id)
          );
          if (parentSection) {
            fullPath = `${basePath}/sections/${parentSection.id}/tactiques/${id}`;
          } else {
            fullPath = `${basePath}/tactiques/${id} ${t('tactiquesHierarchyView.copyId.parentSectionNotFound')}`;
          }
        }
        break;
        
      case 'placement':
        if (context?.sectionId && context?.tactiqueId) {
          fullPath = `${basePath}/sections/${context.sectionId}/tactiques/${context.tactiqueId}/placements/${id}`;
        } else {
          let foundSectionId = '';
          let foundTactiqueId = '';
          
          for (const section of sections) {
            for (const tactique of section.tactiques) {
              const tactiquePlacements = tactique.placements || [];
              if (tactiquePlacements.some(placement => placement.id === id)) {
                foundSectionId = section.id;
                foundTactiqueId = tactique.id;
                break;
              }
            }
            if (foundTactiqueId) break;
          }
          
          if (foundSectionId && foundTactiqueId) {
            fullPath = `${basePath}/sections/${foundSectionId}/tactiques/${foundTactiqueId}/placements/${id}`;
          } else {
            fullPath = `${basePath}/placements/${id} ${t('tactiquesHierarchyView.copyId.parentHierarchyNotFound')}`;
          }
        }
        break;
        
      case 'creatif':
      case 'creative':
        if (context?.sectionId && context?.tactiqueId && context?.placementId) {
          fullPath = `${basePath}/sections/${context.sectionId}/tactiques/${context.tactiqueId}/placements/${context.placementId}/creatifs/${id}`;
        } else {
          let foundSectionId = '';
          let foundTactiqueId = '';
          let foundPlacementId = '';
          
          for (const section of sections) {
            for (const tactique of section.tactiques) {
              const tactiquePlacements = tactique.placements || [];
              for (const placement of tactiquePlacements) {
                const placementCreatifs = creatifs[placement.id] || [];
                if (placementCreatifs.some(creatif => creatif.id === id)) {
                  foundSectionId = section.id;
                  foundTactiqueId = tactique.id;
                  foundPlacementId = placement.id;
                  break;
                }
              }
              if (foundPlacementId) break;
            }
            if (foundPlacementId) break;
          }
          
          if (foundSectionId && foundTactiqueId && foundPlacementId) {
            fullPath = `${basePath}/sections/${foundSectionId}/tactiques/${foundTactiqueId}/placements/${foundPlacementId}/creatifs/${id}`;
          } else {
            fullPath = `${basePath}/creatifs/${id} ${t('tactiquesHierarchyView.copyId.parentHierarchyNotFound')}`;
          }
        }
        break;
        
      default:
        fullPath = id;
        console.warn(`Type non reconnu pour la copie d'ID: ${type}`);
    }
  
    try {
      await navigator.clipboard.writeText(fullPath);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      
      console.log(`Chemin Firebase copié: ${fullPath}`);
      
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      
      const textArea = document.createElement('textarea');
      textArea.value = fullPath;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        console.log(`Chemin Firebase copié (fallback): ${fullPath}`);
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

  // Gestionnaires de sélection (TOUS inchangés)
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

  // Toutes les fonctions de gestion des drawers (TOUTES inchangées)
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

  const handleViewHistory = (sectionId: string, tactique: Tactique) => {
    setHistoryModal({
      isOpen: true,
      tactique
    });
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

  // Gestionnaires de sauvegarde (TOUS inchangés)
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

  // Gestionnaires des menus contextuels (TOUS inchangés)
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

  // Fonctions utilitaires pour trouver les éléments (TOUTES inchangées)
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

      {/* DndContext englobant avec SortableContext pour sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={sections.map(s => `section-${s.id}`)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              
              {sections.map((section, sectionIndex) => (
                <DndKitSectionItem
                  key={`section-${section.id}`}
                  section={{
                    ...section,
                    isExpanded: expandedStates.expandedSections[section.id] || false
                  }}
                  sectionIndex={sectionIndex}
                  hoveredSection={hoveredSection}
                  copiedId={copiedId}
                  totalBudget={totalBudget}
                  formatCurrency={formatCurrencyWithCampaignCurrency}
                  onSectionExpand={expandedStates.handleSectionExpand}
                  onEditSection={onEditSection}
                  onCreateTactique={handleCreateTactiqueLocal}
                  onCopyId={handleCopyId}
                  onMoveSectionUp={handleMoveSectionUp}
                  onSectionSelect={handleSectionSelect}
                  onHoverSection={setHoveredSection}
                  isSelected={selectionLogic.isSelected(section.id)}
                >
                  {/* Contenu des tactiques (passé en children) */}
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
                              expandedTactiques={expandedStates.expandedTactiques}
                              expandedPlacements={expandedStates.expandedPlacements}
                              hoveredTactique={hoveredTactique}
                              hoveredPlacement={hoveredPlacement}
                              hoveredCreatif={hoveredCreatif}
                              copiedId={copiedId}
                              onHoverTactique={setHoveredTactique}
                              onHoverPlacement={setHoveredPlacement}
                              onHoverCreatif={setHoveredCreatif}
                              onExpandTactique={expandedStates.handleTactiqueExpand}
                              onExpandPlacement={expandedStates.handlePlacementExpand}
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
                              onViewHistory={handleViewHistory}
                            />
                          );
                        })}
                      </SortableContext>
                    )}
                  </div>
                </DndKitSectionItem>
              ))}
            </div>
          </div>
        </SortableContext>
      </DndContext>

      {/* TOUS les drawers existants (TOUS inchangés) */}
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

      {/* Modal d'historique des tactiques */}
      <HistoryModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal(prev => ({ ...prev, isOpen: false }))}
        tactique={historyModal.tactique}
      />
    </>
  );
}