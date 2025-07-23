/**
 * Ce composant affiche la hiérarchie complète des sections, tactiques, placements et créatifs.
 * Il permet l'expansion des éléments, la sélection multiple pour des actions groupées,
 * et la réorganisation par glisser-déposer (drag and drop).
 * Il intègre également des tiroirs (drawers) pour la création et l'édition de chaque type d'élément.
 */
'use client';

import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  Bars3Icon
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
import { TactiqueItem } from './HierarchyComponents';
import { useDragAndDrop } from '../../../../hooks/useDragAndDrop';
import { useClient } from '../../../../contexts/ClientContext';
import { useSelection } from '../../../../contexts/SelectionContext';
import { useSelectionLogic } from '../../../../hooks/useSelectionLogic';
import { useSelectionValidation, useSelectionMessages, buildHierarchyMap, SelectionValidationResult } from '../../../../hooks/useSelectionValidation';

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
  onUpdatePlacement?: (placementId: string, data: Partial<Placement>) => Promise<void>;
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
}

/**
 * Composant principal affichant la vue hiérarchique des tactiques.
 *
 * @param {TactiquesHierarchyViewProps} props - Les propriétés du composant.
 * @returns {JSX.Element} Le composant de la vue hiérarchique des tactiques.
 */
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
  hierarchyContext
}: TactiquesHierarchyViewProps) {

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  /**
   * Initialise la logique de sélection pour gérer les éléments choisis dans la hiérarchie.
   */
  const selectionLogic = useSelectionLogic({ sections });

  /**
   * Construit une carte hiérarchique des sections, tactiques, placements et créatifs
   * pour faciliter la validation des opérations.
   */
  const hierarchyMap = useMemo(() => {
    return buildHierarchyMap(sections);
  }, [sections]);

  /**
   * Récupère les identifiants des éléments actuellement sélectionnés.
   * Cette liste n'opère plus de distinction entre sélection directe ou héritée.
   */
  const selectedIds = useMemo(() => {
    return Array.from(selectionLogic.rawSelectedIds);
  }, [selectionLogic]);

  /**
   * Valide la sélection courante pour des opérations telles que le déplacement.
   */
  const validationResult = useSelectionValidation({
    hierarchyMap,
    selectedIds
  });

  /**
   * Génère les messages utilisateur basés sur le résultat de la validation de la sélection.
   */
  const selectionMessages = useSelectionMessages(validationResult);

  /**
   * Applatit la structure des tactiques pour les rendre accessibles par leur ID de section.
   */
  const tactiquesFlat = sections.reduce((acc, section) => {
    acc[section.id] = section.tactiques;
    return acc;
  }, {} as { [sectionId: string]: Tactique[] });

  /**
   * Utilise le hook de glisser-déposer pour gérer la logique de réorganisation des éléments.
   */
  const { isDragLoading, handleDragEnd } = useDragAndDrop({
    sections,
    tactiques: tactiquesFlat,
    placements,
    creatifs,
    onRefresh
  });

  /**
   * État pour suivre la section survolée par la souris.
   */
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  /**
   * État pour suivre la tactique survolée par la souris, incluant son ID de section parente.
   */
  const [hoveredTactique, setHoveredTactique] = useState<{sectionId: string, tactiqueId: string} | null>(null);
  /**
   * État pour suivre le placement survolé par la souris, incluant ses IDs de section et tactique parentes.
   */
  const [hoveredPlacement, setHoveredPlacement] = useState<{sectionId: string, tactiqueId: string, placementId: string} | null>(null);
  /**
   * État pour suivre le créatif survolé par la souris, incluant ses IDs de section, tactique et placement parentes.
   */
  const [hoveredCreatif, setHoveredCreatif] = useState<{sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null>(null);

  /**
   * État pour gérer l'expansion des tactiques (visible/caché).
   */
  const [expandedTactiques, setExpandedTactiques] = useState<{[tactiqueId: string]: boolean}>({});
  /**
   * État pour gérer l'expansion des placements (visible/caché).
   */
  const [expandedPlacements, setExpandedPlacements] = useState<{[placementId: string]: boolean}>({});

  /**
   * État du tiroir (drawer) pour la gestion des tactiques (création/édition).
   */
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

  /**
   * État du tiroir (drawer) pour la gestion des placements (création/édition).
   */
  const [placementDrawer, setPlacementDrawer] = useState<{
    isOpen: boolean;
    placement: Placement | null;
    tactiqueId: string;
    mode: 'create' | 'edit';
  }>({
    isOpen: false,
    placement: null,
    tactiqueId: '',
    mode: 'create'
  });

  /**
   * État du tiroir (drawer) pour la gestion des créatifs (création/édition).
   */
  const [creatifDrawer, setCreatifDrawer] = useState<{
    isOpen: boolean;
    creatif: Creatif | null;
    placementId: string;
    mode: 'create' | 'edit';
  }>({
    isOpen: false,
    creatif: null,
    placementId: '',
    mode: 'create'
  });

  /**
   * État du menu contextuel pour la gestion des taxonomies des placements et créatifs.
   */
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

  /**
   * Calcule le pourcentage d'un montant par rapport au budget total.
   *
   * @param {number} amount - Le montant à calculer.
   * @returns {number} Le pourcentage arrondi.
   */
  const calculatePercentage = (amount: number) => {
    if (totalBudget <= 0) return 0;
    return Math.round((amount / totalBudget) * 100);
  };

  /**
   * Bascule l'état d'expansion d'une tactique.
   *
   * @param {string} tactiqueId - L'identifiant de la tactique à basculer.
   */
  const handleTactiqueExpand = (tactiqueId: string) => {
    setExpandedTactiques(prev => ({
      ...prev,
      [tactiqueId]: !prev[tactiqueId]
    }));
  };

  /**
   * Bascule l'état d'expansion d'un placement.
   *
   * @param {string} placementId - L'identifiant du placement à basculer.
   */
  const handlePlacementExpand = (placementId: string) => {
    setExpandedPlacements(prev => ({
      ...prev,
      [placementId]: !prev[placementId]
    }));
  };

  /**
   * Gère la sélection/désélection d'une section.
   *
   * @param {string} sectionId - L'identifiant de la section.
   * @param {boolean} isSelected - Indique si la section est sélectionnée.
   */
  const handleSectionSelect = (sectionId: string, isSelected: boolean) => {
    selectionLogic.toggleSelection(sectionId, isSelected);
  };

  /**
   * Gère la sélection/désélection d'une tactique.
   *
   * @param {string} tactiqueId - L'identifiant de la tactique.
   * @param {boolean} isSelected - Indique si la tactique est sélectionnée.
   */
  const handleTactiqueSelect = (tactiqueId: string, isSelected: boolean) => {
    selectionLogic.toggleSelection(tactiqueId, isSelected);
  };

  /**
   * Gère la sélection/désélection d'un placement.
   *
   * @param {string} placementId - L'identifiant du placement.
   * @param {boolean} isSelected - Indique si le placement est sélectionné.
   */
  const handlePlacementSelect = (placementId: string, isSelected: boolean) => {
    selectionLogic.toggleSelection(placementId, isSelected);
  };

  /**
   * Gère la sélection/désélection d'un créatif.
   *
   * @param {string} creatifId - L'identifiant du créatif.
   * @param {boolean} isSelected - Indique si le créatif est sélectionné.
   */
  const handleCreatifSelect = (creatifId: string, isSelected: boolean) => {
    selectionLogic.toggleSelection(creatifId, isSelected);
  };

  /**
   * Ouvre le menu contextuel pour la gestion des taxonomies.
   *
   * @param {Placement | Creatif} item - L'élément (placement ou créatif) concerné.
   * @param {'placement' | 'creatif'} itemType - Le type de l'élément ('placement' ou 'creatif').
   * @param {'tags' | 'platform' | 'mediaocean'} taxonomyType - Le type de taxonomie à gérer.
   * @param {{ x: number; y: number }} position - La position d'affichage du menu.
   */
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

  /**
   * Ferme le menu contextuel des taxonomies.
   */
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

  /**
   * Gère la création locale d'une nouvelle tactique.
   *
   * @param {string} sectionId - L'identifiant de la section parente.
   */
  const handleCreateTactiqueLocal = async (sectionId: string) => {
    if (!onCreateTactique) return;

    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: TactiquesHierarchyView.tsx - Fonction: handleCreateTactiqueLocal - Path: tactiques (création)");
      const newTactique = await onCreateTactique(sectionId);
      setTactiqueDrawer({
        isOpen: true,
        tactique: newTactique,
        sectionId,
        mode: 'edit'
      });
    } catch (error) {
      console.error('Erreur lors de la création de la tactique:', error);
    }
  };

  /**
   * Gère la création locale d'un nouveau placement.
   *
   * @param {string} tactiqueId - L'identifiant de la tactique parente.
   */
  const handleCreatePlacementLocal = async (tactiqueId: string) => {
    if (!onCreatePlacement) return;

    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: TactiquesHierarchyView.tsx - Fonction: handleCreatePlacementLocal - Path: placements (création)");
      const newPlacement = await onCreatePlacement(tactiqueId);
      setPlacementDrawer({
        isOpen: true,
        placement: newPlacement,
        tactiqueId,
        mode: 'edit'
      });
    } catch (error) {
      console.error('Erreur lors de la création du placement:', error);
    }
  };

  /**
   * Gère la création locale d'un nouveau créatif.
   *
   * @param {string} placementId - L'identifiant du placement parent.
   */
  const handleCreateCreatifLocal = async (placementId: string) => {
    if (!onCreateCreatif) return;

    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: TactiquesHierarchyView.tsx - Fonction: handleCreateCreatifLocal - Path: creatifs (création)");
      const newCreatif = await onCreateCreatif(placementId);
      setCreatifDrawer({
        isOpen: true,
        creatif: newCreatif,
        placementId,
        mode: 'edit'
      });
    } catch (error) {
      console.error('Erreur lors de la création du créatif:', error);
    }
  };

  /**
   * Ouvre le tiroir d'édition pour une tactique existante.
   *
   * @param {string} sectionId - L'identifiant de la section parente.
   * @param {Tactique} tactique - La tactique à éditer.
   */
  const handleEditTactique = (sectionId: string, tactique: Tactique) => {
    setTactiqueDrawer({
      isOpen: true,
      tactique,
      sectionId,
      mode: 'edit'
    });
  };

  /**
   * Ouvre le tiroir d'édition pour un placement existant.
   *
   * @param {string} tactiqueId - L'identifiant de la tactique parente.
   * @param {Placement} placement - Le placement à éditer.
   */
  const handleEditPlacement = (tactiqueId: string, placement: Placement) => {
    setPlacementDrawer({
      isOpen: true,
      placement,
      tactiqueId,
      mode: 'edit'
    });
  };

  /**
   * Ouvre le tiroir d'édition pour un créatif existant.
   *
   * @param {string} placementId - L'identifiant du placement parent.
   * @param {Creatif} creatif - Le créatif à éditer.
   */
  const handleEditCreatif = (placementId: string, creatif: Creatif) => {
    setCreatifDrawer({
      isOpen: true,
      creatif,
      placementId,
      mode: 'edit'
    });
  };

  /**
   * Gère la sauvegarde des modifications d'une tactique.
   *
   * @param {any} tactiqueData - Les données de la tactique à sauvegarder.
   */
  const handleSaveTactique = async (tactiqueData: any) => {
    if (!tactiqueDrawer.tactique || !onUpdateTactique) return;

    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: TactiquesHierarchyView.tsx - Fonction: handleSaveTactique - Path: tactiques/[tactiqueDrawer.tactique.id]");
      await onUpdateTactique(tactiqueDrawer.sectionId, tactiqueDrawer.tactique.id, tactiqueData);
      setTactiqueDrawer(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tactique:', error);
    }
  };

  /**
   * Gère la sauvegarde des modifications d'un placement.
   *
   * @param {any} placementData - Les données du placement à sauvegarder.
   */
  const handleSavePlacement = async (placementData: any) => {
    if (!placementDrawer.placement || !onUpdatePlacement) return;

    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: TactiquesHierarchyView.tsx - Fonction: handleSavePlacement - Path: placements/[placementDrawer.placement.id]");
      await onUpdatePlacement(placementDrawer.placement.id, placementData);
      setPlacementDrawer(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du placement:', error);
    }
  };

  /**
   * Gère la sauvegarde des modifications d'un créatif.
   * Cette fonction inclut la logique pour retrouver la hiérarchie parente (sectionId, tactiqueId)
   * à partir du placementId pour l'appel à `onUpdateCreatif`.
   *
   * @param {any} creatifData - Les données du créatif à sauvegarder.
   */
  const handleSaveCreatif = async (creatifData: any) => {
    if (!creatifDrawer.creatif || !onUpdateCreatif || !creatifDrawer.placementId) return;

    // 1. Trouver la hiérarchie parente (sectionId, tactiqueId) du créatif
    let sectionId: string | null = null;
    let tactiqueId: string | null = null;

    for (const section of sections) {
      for (const tactique of section.tactiques) {
        // Utiliser les placements directement associés à la tactique dans la boucle
        const placementExists = (tactique.placements || []).some(p => p.id === creatifDrawer.placementId);
        if (placementExists) {
          sectionId = section.id;
          tactiqueId = tactique.id;
          break;
        }
      }
      if (tactiqueId) break;
    }

    // 2. Vérifier si la hiérarchie a été trouvée
    if (!sectionId || !tactiqueId) {
      console.error("Erreur critique : Impossible de trouver la hiérarchie (Section, Tactique) pour le placement ID:", creatifDrawer.placementId);
      return;
    }

    // 3. Appeler onUpdateCreatif avec la hiérarchie complète
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: TactiquesHierarchyView.tsx - Fonction: handleSaveCreatif - Path: creatifs/[creatifDrawer.creatif.id]");
      await onUpdateCreatif(
        sectionId,
        tactiqueId,
        creatifDrawer.placementId,
        creatifDrawer.creatif.id,
        creatifData
      );
      setCreatifDrawer(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du créatif:', error);
    }
  };

  /**
   * Construit la liste des éléments sélectionnés pour affichage dans le panneau d'actions.
   * Cette liste inclut le nom, le type et les données complètes de chaque élément.
   */
  const selectedItems = useMemo(() => {
    const selection = selectionLogic.getSelectedItems();
    const result: Array<{
      id: string;
      name: string;
      type: 'section' | 'tactique' | 'placement' | 'creatif';
      data?: Section | Tactique | Placement | Creatif;
    }> = [];

    selection.details.forEach(detail => {
      // Chercher l'élément réel dans la hiérarchie sections
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

  /**
   * Gère la demande locale de désélection de tous les éléments.
   */
  const handleClearSelectionLocal = () => {
    selectionLogic.clearSelection();
    onClearSelection?.();
  };

  /**
   * Trouve une tactique par son identifiant à travers toutes les sections.
   *
   * @param {string} tactiqueId - L'identifiant de la tactique à trouver.
   * @returns {Tactique | undefined} La tactique trouvée ou undefined si non trouvée.
   */
  const findTactiqueById = (tactiqueId: string): Tactique | undefined => {
    for (const section of sections) {
      const tactique = section.tactiques.find(t => t.id === tactiqueId);
      if (tactique) return tactique;
    }
    return undefined;
  };

  /**
   * Trouve un placement par son identifiant et retourne le placement ainsi que sa tactique parente.
   *
   * @param {string} placementId - L'identifiant du placement à trouver.
   * @returns {{ placement: Placement; tactique: Tactique } | undefined} L'objet contenant le placement et sa tactique, ou undefined.
   */
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

  /**
   * Récupère les données de la tactique courante si un placement est sélectionné dans le tiroir de placement.
   */
  const currentTactiqueData = placementDrawer.tactiqueId ?
    findTactiqueById(placementDrawer.tactiqueId) :
    undefined;

  /**
   * Récupère le contexte du placement courant (placement et tactique parentes)
   * si un créatif est sélectionné dans le tiroir de créatif.
   */
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
              <span className="text-gray-700">Réorganisation en cours...</span>
            </div>
          </div>
        </div>
      )}

      {/* Panel d'actions pour les éléments sélectionnés */}
      {selectedItems.length > 0 && (
        <>
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


        </>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Droppable droppableId="sections" type="SECTION">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="divide-y divide-gray-200"
              >
                {sections.map((section, sectionIndex) => (
                  <Draggable
                    key={`section-${section.id}`}
                    draggableId={`section-${section.id}`}
                    index={sectionIndex}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'bg-white shadow-lg rounded' : ''}`}
                      >
                        {/* Section header */}
                        <div
                          className="relative"
                          onMouseEnter={() => setHoveredSection(section.id)}
                          onMouseLeave={() => setHoveredSection(null)}
                        >
                          <div
                            className={`flex justify-between items-center px-4 py-3 cursor-pointer bg-white hover:bg-gray-50 transition-colors ${
                              section.isExpanded ? 'bg-gray-50' : ''
                            } ${selectionLogic.isSelected(section.id) ? 'bg-indigo-50' : ''}`}
                            style={{ borderLeft: `4px solid ${section.SECTION_Color || '#6366f1'}` }}
                            onClick={() => onSectionExpand(section.id)}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
                                checked={selectionLogic.isSelected(section.id)}
                                onChange={(e) => handleSectionSelect(section.id, e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                                <Bars3Icon className="h-4 w-4 text-gray-400" />
                              </span>

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

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateTactiqueLocal(section.id);
                                }}
                                className={`ml-2 p-1 rounded hover:bg-gray-200 transition-colors ${
                                  hoveredSection === section.id ? 'text-indigo-600' : 'text-indigo-400'
                                }`}
                                title="Ajouter une tactique"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="relative min-w-[24px] h-6">
                                {hoveredSection === section.id && (
                                  <div className="absolute right-0 top-0 flex items-center">
                                    {onEditSection && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditSection(section.id);
                                        }}
                                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                                        title="Modifier la section"
                                      >
                                        <PencilIcon className="h-4 w-4 text-gray-500" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {formatCurrency(section.SECTION_Budget || 0)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {calculatePercentage(section.SECTION_Budget || 0)}% du budget
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rendu des tactiques */}
                        {section.isExpanded && (
                          <div className="bg-white">
                            {section.tactiques.length === 0 ? (
                              <div className="pl-12 py-3 text-sm text-gray-500 italic">
                                Aucune tactique dans cette section
                              </div>
                            ) : (
                              <Droppable droppableId={`tactiques-${section.id}`} type="TACTIQUE">
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.droppableProps}>
                                    {section.tactiques.map((tactique, tactiqueIndex) => {
                                      const tactiquePlacements = tactique.placements || [];

                                      return (
                                        <TactiqueItem
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
                                          expandedTactiques={expandedTactiques}
                                          expandedPlacements={expandedPlacements}
                                          hoveredTactique={hoveredTactique}
                                          hoveredPlacement={hoveredPlacement}
                                          hoveredCreatif={hoveredCreatif}
                                          onHoverTactique={setHoveredTactique}
                                          onHoverPlacement={setHoveredPlacement}
                                          onHoverCreatif={setHoveredCreatif}
                                          onExpandTactique={handleTactiqueExpand}
                                          onExpandPlacement={handlePlacementExpand}
                                          onEdit={handleEditTactique}
                                          onCreatePlacement={handleCreatePlacementLocal}
                                          onEditPlacement={handleEditPlacement}
                                          onCreateCreatif={handleCreateCreatifLocal}
                                          onEditCreatif={handleEditCreatif}
                                          formatCurrency={formatCurrency}
                                          onSelect={handleTactiqueSelect}
                                          onSelectPlacement={handlePlacementSelect}
                                          onSelectCreatif={handleCreatifSelect}
                                          onOpenTaxonomyMenu={handleOpenTaxonomyMenu}
                                        />
                                      );
                                    })}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {/* Drawers */}
      <TactiqueDrawer
        isOpen={tactiqueDrawer.isOpen}
        onClose={() => setTactiqueDrawer(prev => ({ ...prev, isOpen: false }))}
        tactique={tactiqueDrawer.tactique}
        sectionId={tactiqueDrawer.sectionId}
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