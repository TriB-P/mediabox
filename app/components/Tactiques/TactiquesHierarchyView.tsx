// app/components/Tactiques/TactiquesHierarchyView.tsx - AVEC DRAG AND DROP COMPLET

'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { 
  SectionWithTactiques, 
  Tactique, 
  Placement, 
  Creatif, 
  TactiqueFormData,
  PlacementFormData,
  CreatifFormData
} from '../../types/tactiques';
import TactiqueDrawer from './Tactiques/TactiqueDrawer';
import PlacementDrawer from './Placement/PlacementDrawer';
import CreatifDrawer from './Creatif/CreatifDrawer';
import { useClient } from '../../contexts/ClientContext';
import { useSelection } from '../../contexts/SelectionContext';
import {
  reorderSections,
  reorderTactiques,
  reorderPlacements,
  reorderCreatifs,
  moveTactiqueToSection,
  movePlacementToTactique,
  moveCreatifToPlacement,
  ReorderContext
} from '../../lib/reorderService';

interface TactiquesHierarchyViewProps {
  sections: SectionWithTactiques[];
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  onSectionExpand: (sectionId: string) => void;
  onDragEnd: (result: DropResult) => void;
  onEditSection?: (sectionId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onCreateTactique?: (sectionId: string) => Promise<Tactique>;
  onUpdateTactique?: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  onDeleteTactique?: (sectionId: string, tactiqueId: string) => void;
  onCreatePlacement?: (tactiqueId: string) => Promise<Placement>;
  onUpdatePlacement?: (placementId: string, data: Partial<Placement>) => Promise<void>;
  onDeletePlacement?: (placementId: string) => void;
  onCreateCreatif?: (placementId: string) => Promise<Creatif>;
  onUpdateCreatif?: (creatifId: string, data: Partial<Creatif>) => Promise<void>;
  onDeleteCreatif?: (creatifId: string) => void;
  formatCurrency: (amount: number) => string;
  totalBudget: number;
  onRefresh?: () => void; // Fonction pour rafraîchir les données après drag and drop
}

export default function TactiquesHierarchyView({
  sections,
  placements,
  creatifs,
  onSectionExpand,
  onDragEnd: originalOnDragEnd, // Renommé pour différencier
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
  onRefresh
}: TactiquesHierarchyViewProps) {
  
  // Contextes nécessaires pour les appels Firestore
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  // États pour suivre les éléments survolés
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [hoveredTactique, setHoveredTactique] = useState<{sectionId: string, tactiqueId: string} | null>(null);
  const [hoveredPlacement, setHoveredPlacement] = useState<{sectionId: string, tactiqueId: string, placementId: string} | null>(null);
  const [hoveredCreatif, setHoveredCreatif] = useState<{sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null>(null);
  
  // États pour l'expansion des éléments
  const [expandedTactiques, setExpandedTactiques] = useState<{[tactiqueId: string]: boolean}>({});
  const [expandedPlacements, setExpandedPlacements] = useState<{[placementId: string]: boolean}>({});
  
  // État pour le loading du drag and drop
  const [isDragLoading, setIsDragLoading] = useState(false);
  
  // États pour les drawers (code existant...)
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
    mode: 'create' | 'edit';
  }>({
    isOpen: false,
    placement: null,
    tactiqueId: '',
    mode: 'create'
  });

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

  // ==================== LOGIQUE DRAG AND DROP ====================

  /**
   * Fonction principale de gestion du drag and drop
   */
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // Pas de destination = annulation
    if (!destination) return;
    
    // Même position = pas de changement
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Vérifier les prérequis
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('❌ Contexte manquant pour le drag and drop');
      return;
    }

    const context: ReorderContext = {
      clientId: selectedClient.clientId,
      campaignId: selectedCampaignId,
      versionId: selectedVersionId,
      ongletId: selectedOngletId
    };

    setIsDragLoading(true);

    try {
      console.log('🔄 Début drag and drop:', { draggableId, source, destination, type });

      // Déterminer le type de drag basé sur le draggableId
      if (draggableId.startsWith('section-')) {
        await handleSectionDrag(result, context);
      } else if (draggableId.startsWith('tactique-')) {
        await handleTactiqueDrag(result, context);
      } else if (draggableId.startsWith('placement-')) {
        await handlePlacementDrag(result, context);
      } else if (draggableId.startsWith('creatif-')) {
        await handleCreatifDrag(result, context);
      } else {
        console.warn('⚠️ Type de drag non reconnu:', draggableId);
      }

      // Rafraîchir les données après le drag and drop
      if (onRefresh) {
        await onRefresh();
      }

      console.log('✅ Drag and drop terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du drag and drop:', error);
      // TODO: Afficher un toast d'erreur à l'utilisateur
    } finally {
      setIsDragLoading(false);
    }

    // Appeler la fonction originale si elle existe
    if (originalOnDragEnd) {
      originalOnDragEnd(result);
    }
  };

  /**
   * Gestion du drag des sections
   */
  const handleSectionDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const sectionId = draggableId.replace('section-', '');
    
    // Réorganisation des sections (toujours dans le même conteneur)
    const newSections = Array.from(sections);
    const [removed] = newSections.splice(source.index, 1);
    newSections.splice(destination.index, 0, removed);

    const sectionOrders = newSections.map((section, index) => ({
      id: section.id,
      order: index
    }));

    await reorderSections(context, sectionOrders);
  };

  /**
   * Gestion du drag des tactiques
   */
  const handleTactiqueDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const tactiqueId = draggableId.replace('tactique-', '');
    const sourceSectionId = source.droppableId.replace('tactiques-', '');
    const destSectionId = destination.droppableId.replace('tactiques-', '');

    if (sourceSectionId === destSectionId) {
      // Réorganisation dans la même section
      const sectionTactiques = sections.find(s => s.id === sourceSectionId)?.tactiques || [];
      const newTactiques = Array.from(sectionTactiques);
      const [removed] = newTactiques.splice(source.index, 1);
      newTactiques.splice(destination.index, 0, removed);

      const tactiqueOrders = newTactiques.map((tactique, index) => ({
        id: tactique.id,
        order: index
      }));

      await reorderTactiques(context, sourceSectionId, tactiqueOrders);
    } else {
      // Déplacement vers une autre section
      await moveTactiqueToSection(
        context,
        tactiqueId,
        sourceSectionId,
        destSectionId,
        destination.index
      );

      // Réorganiser les tactiques dans la section de destination
      const destSection = sections.find(s => s.id === destSectionId);
      if (destSection) {
        const updatedTactiques = Array.from(destSection.tactiques);
        // Simuler l'insertion pour calculer les nouveaux ordres
        updatedTactiques.splice(destination.index, 0, { id: tactiqueId } as Tactique);
        
        const tactiqueOrders = updatedTactiques.map((tactique, index) => ({
          id: tactique.id,
          order: index
        }));

        await reorderTactiques(context, destSectionId, tactiqueOrders);
      }
    }
  };

  /**
   * Gestion du drag des placements
   */
  const handlePlacementDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const placementId = draggableId.replace('placement-', '');
    const sourceTactiqueId = source.droppableId.replace('placements-', '');
    const destTactiqueId = destination.droppableId.replace('placements-', '');

    // Trouver les sections parentes
    const findSectionForTactique = (tactiqueId: string) => {
      return sections.find(section => 
        section.tactiques.some(tactique => tactique.id === tactiqueId)
      );
    };

    const sourceSection = findSectionForTactique(sourceTactiqueId);
    const destSection = findSectionForTactique(destTactiqueId);

    if (!sourceSection || !destSection) {
      console.error('❌ Sections parent non trouvées pour les tactiques');
      return;
    }

    if (sourceTactiqueId === destTactiqueId) {
      // Réorganisation dans la même tactique
      const tactiquesPlacements = placements[sourceTactiqueId] || [];
      const newPlacements = Array.from(tactiquesPlacements);
      const [removed] = newPlacements.splice(source.index, 1);
      newPlacements.splice(destination.index, 0, removed);

      const placementOrders = newPlacements.map((placement, index) => ({
        id: placement.id,
        order: index
      }));

      await reorderPlacements(context, sourceSection.id, sourceTactiqueId, placementOrders);
    } else {
      // Déplacement vers une autre tactique
      await movePlacementToTactique(
        context,
        placementId,
        sourceSection.id,
        sourceTactiqueId,
        destSection.id,
        destTactiqueId,
        destination.index
      );
    }
  };

  /**
   * Gestion du drag des créatifs
   */
  const handleCreatifDrag = async (result: DropResult, context: ReorderContext) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const creatifId = draggableId.replace('creatif-', '');
    const sourcePlacementId = source.droppableId.replace('creatifs-', '');
    const destPlacementId = destination.droppableId.replace('creatifs-', '');

    // Fonction pour trouver les parents d'un placement
    const findParentsForPlacement = (placementId: string) => {
      for (const section of sections) {
        for (const tactique of section.tactiques) {
          const tactiquesPlacements = placements[tactique.id] || [];
          const placement = tactiquesPlacements.find(p => p.id === placementId);
          if (placement) {
            return { sectionId: section.id, tactiqueId: tactique.id };
          }
        }
      }
      return null;
    };

    const sourceParents = findParentsForPlacement(sourcePlacementId);
    const destParents = findParentsForPlacement(destPlacementId);

    if (!sourceParents || !destParents) {
      console.error('❌ Parents non trouvés pour les placements');
      return;
    }

    if (sourcePlacementId === destPlacementId) {
      // Réorganisation dans le même placement
      const placementCreatifs = creatifs[sourcePlacementId] || [];
      const newCreatifs = Array.from(placementCreatifs);
      const [removed] = newCreatifs.splice(source.index, 1);
      newCreatifs.splice(destination.index, 0, removed);

      const creatifOrders = newCreatifs.map((creatif, index) => ({
        id: creatif.id,
        order: index
      }));

      await reorderCreatifs(
        context,
        sourceParents.sectionId,
        sourceParents.tactiqueId,
        sourcePlacementId,
        creatifOrders
      );
    } else {
      // Déplacement vers un autre placement
      await moveCreatifToPlacement(
        context,
        creatifId,
        sourceParents.sectionId,
        sourceParents.tactiqueId,
        sourcePlacementId,
        destParents.sectionId,
        destParents.tactiqueId,
        destPlacementId,
        destination.index
      );
    }
  };

  // ==================== FONCTIONS UTILITAIRES (code existant) ====================

  const calculatePercentage = (amount: number) => {
    if (totalBudget <= 0) return 0;
    return Math.round((amount / totalBudget) * 100);
  };
  
  const handleTactiqueExpand = (tactiqueId: string) => {
    setExpandedTactiques(prev => ({
      ...prev,
      [tactiqueId]: !prev[tactiqueId]
    }));
  };
  
  const handlePlacementExpand = (placementId: string) => {
    setExpandedPlacements(prev => ({
      ...prev,
      [placementId]: !prev[placementId]
    }));
  };

  // Gestionnaires pour les actions de création (code existant...)
  const handleCreateTactique = async (sectionId: string) => {
    if (!onCreateTactique) return;
    
    try {
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

  const handleCreatePlacement = async (tactiqueId: string) => {
    if (!onCreatePlacement) return;
    
    try {
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

  const handleCreateCreatif = async (placementId: string) => {
    if (!onCreateCreatif) return;
    
    try {
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

  // Gestionnaires pour ouvrir les drawers en mode édition (code existant...)
  const handleEditTactique = (sectionId: string, tactique: Tactique) => {
    setTactiqueDrawer({
      isOpen: true,
      tactique,
      sectionId,
      mode: 'edit'
    });
  };

  const handleEditPlacement = (tactiqueId: string, placement: Placement) => {
    setPlacementDrawer({
      isOpen: true,
      placement,
      tactiqueId,
      mode: 'edit'
    });
  };

  const handleEditCreatif = (placementId: string, creatif: Creatif) => {
    setCreatifDrawer({
      isOpen: true,
      creatif,
      placementId,
      mode: 'edit'
    });
  };

  // Gestionnaires pour sauvegarder depuis les drawers (code existant...)
  const handleSaveTactique = async (tactiqueData: TactiqueFormData) => {
    if (!tactiqueDrawer.tactique || !onUpdateTactique) return;
    
    try {
      await onUpdateTactique(tactiqueDrawer.sectionId, tactiqueDrawer.tactique.id, tactiqueData);
      setTactiqueDrawer(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tactique:', error);
    }
  };

  const handleSavePlacement = async (placementData: PlacementFormData) => {
    if (!placementDrawer.placement || !onUpdatePlacement) return;
    
    try {
      await onUpdatePlacement(placementDrawer.placement.id, placementData);
      setPlacementDrawer(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du placement:', error);
    }
  };

  const handleSaveCreatif = async (creatifData: CreatifFormData) => {
    if (!creatifDrawer.creatif || !onUpdateCreatif) return;
    
    try {
      await onUpdateCreatif(creatifDrawer.creatif.id, creatifData);
      setCreatifDrawer(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du créatif:', error);
    }
  };

  // Fermer les drawers (code existant...)
  const closeTactiqueDrawer = () => {
    setTactiqueDrawer(prev => ({ ...prev, isOpen: false }));
  };

  const closePlacementDrawer = () => {
    setPlacementDrawer(prev => ({ ...prev, isOpen: false }));
  };

  const closeCreatifDrawer = () => {
    setCreatifDrawer(prev => ({ ...prev, isOpen: false }));
  };

  // Fonction pour trouver la tactique par son ID (code existant...)
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
        const tactiquePlacements = placements[tactique.id] || [];
        const placement = tactiquePlacements.find(p => p.id === placementId);
        if (placement) {
          return { placement, tactique };
        }
      }
    }
    return undefined;
  };

  // Récupérer les données contextuelles pour les drawers (code existant...)
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
              <span className="text-gray-700">Réorganisation en cours...</span>
            </div>
          </div>
        </div>
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
                        className={`${snapshot.isDragging ? 'bg-gray-50 shadow-lg' : ''}`}
                      >
                        {/* Section header */}
                        <div 
                          className="relative"
                          onMouseEnter={() => setHoveredSection(section.id)}
                          onMouseLeave={() => setHoveredSection(null)}
                        >
                          <div
                            className={`flex justify-between items-center px-4 py-3 cursor-pointer ${
                              section.isExpanded ? 'bg-gray-50' : ''
                            }`}
                            onClick={() => onSectionExpand(section.id)}
                            style={{ borderLeft: `4px solid ${section.SECTION_Color || '#6366f1'}` }}
                          >
                            <div className="flex items-center">
                              <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                                <Bars3Icon className="h-4 w-4 text-gray-400" />
                              </span>
                              
                              {section.isExpanded ? (
                                <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                              )}
                              <h3 className="font-medium text-gray-900">{section.SECTION_Name}</h3>
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateTactique(section.id);
                                }} 
                                className={`ml-2 p-1 rounded hover:bg-gray-200 ${
                                  hoveredSection === section.id ? 'text-indigo-600' : 'text-indigo-400'
                                }`}
                                title="Ajouter une tactique"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="flex items-center space-x-4">
                              {hoveredSection === section.id && (
                                <div className="flex space-x-1">
                                  {onEditSection && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditSection(section.id);
                                      }} 
                                      className="p-1 rounded hover:bg-gray-200"
                                    >
                                      <PencilIcon className="h-4 w-4 text-gray-500" />
                                    </button>
                                  )}
                                  {onDeleteSection && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSection(section.id);
                                      }} 
                                      className="p-1 rounded hover:bg-gray-200"
                                    >
                                      <TrashIcon className="h-4 w-4 text-gray-500" />
                                    </button>
                                  )}
                                </div>
                              )}
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

                        {/* Tactiques */}
                        {section.isExpanded && (
                          <div className="bg-gray-50">
                            {section.tactiques.length === 0 ? (
                              <div className="pl-12 py-3 text-sm text-gray-500 italic">
                                Aucune tactique dans cette section
                              </div>
                            ) : (
                              <Droppable droppableId={`tactiques-${section.id}`} type="TACTIQUE">
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                  >
                                    {section.tactiques.map((tactique, tactiqueIndex) => {
                                      const tactiquePlacements = placements[tactique.id] || [];
                                      
                                      return (
                                        <Draggable
                                          key={`tactique-${tactique.id}`}
                                          draggableId={`tactique-${tactique.id}`}
                                          index={tactiqueIndex}
                                        >
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={`border-b border-gray-100 last:border-b-0 pl-8 ${
                                                snapshot.isDragging ? 'bg-white shadow-lg rounded' : ''
                                              }`}
                                              onMouseEnter={() => setHoveredTactique({sectionId: section.id, tactiqueId: tactique.id})}
                                              onMouseLeave={() => setHoveredTactique(null)}
                                            >
                                              <div 
                                                className="flex justify-between items-center px-4 py-3 cursor-pointer"
                                                onClick={() => handleTactiqueExpand(tactique.id)}
                                              >
                                                <div className="flex items-center">
                                                  <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                                                    <Bars3Icon className="h-4 w-4 text-gray-400" />
                                                  </span>
                                                  
                                                  {expandedTactiques[tactique.id] ? (
                                                    <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                                                  ) : (
                                                    <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                                                  )}
                                                  
                                                  <div className="text-sm text-gray-800 font-medium">
                                                    {tactique.TC_Label}
                                                  </div>
                                                  
                                                  <button 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleCreatePlacement(tactique.id);
                                                    }} 
                                                    className={`ml-2 p-1 rounded hover:bg-gray-200 ${
                                                      hoveredTactique?.tactiqueId === tactique.id ? 'text-indigo-600' : 'text-indigo-400'
                                                    }`}
                                                    title="Ajouter un placement"
                                                  >
                                                    <PlusIcon className="h-4 w-4" />
                                                  </button>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                  {hoveredTactique?.sectionId === section.id && 
                                                   hoveredTactique?.tactiqueId === tactique.id && (
                                                    <div className="flex space-x-1">
                                                      <button 
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleEditTactique(section.id, tactique);
                                                        }} 
                                                        className="p-1 rounded hover:bg-gray-200"
                                                      >
                                                        <PencilIcon className="h-4 w-4 text-gray-500" />
                                                      </button>
                                                      {onDeleteTactique && (
                                                        <button 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteTactique(section.id, tactique.id);
                                                          }} 
                                                          className="p-1 rounded hover:bg-gray-200"
                                                        >
                                                          <TrashIcon className="h-4 w-4 text-gray-500" />
                                                        </button>
                                                      )}
                                                    </div>
                                                  )}
                                                  <div className="text-sm font-medium">
                                                    {formatCurrency(tactique.TC_Budget)}
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              {/* Placements */}
                                              {expandedTactiques[tactique.id] && (
                                                <div className="pl-8 pb-2 bg-gray-100">
                                                  {tactiquePlacements.length === 0 ? (
                                                    <div className="px-4 py-2 text-xs text-gray-500 italic">
                                                      Aucun placement dans cette tactique
                                                    </div>
                                                  ) : (
                                                    <Droppable droppableId={`placements-${tactique.id}`} type="PLACEMENT">
                                                      {(provided) => (
                                                        <div
                                                          ref={provided.innerRef}
                                                          {...provided.droppableProps}
                                                        >
                                                          {tactiquePlacements.map((placement, placementIndex) => {
                                                            const placementCreatifs = creatifs[placement.id] || [];
                                                            
                                                            return (
                                                              <Draggable
                                                                key={`placement-${placement.id}`}
                                                                draggableId={`placement-${placement.id}`}
                                                                index={placementIndex}
                                                              >
                                                                {(provided, snapshot) => (
                                                                  <div 
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className={`border-b border-gray-200 last:border-b-0 ${
                                                                      snapshot.isDragging ? 'bg-white shadow-lg rounded' : ''
                                                                    }`}
                                                                    onMouseEnter={() => setHoveredPlacement({sectionId: section.id, tactiqueId: tactique.id, placementId: placement.id})}
                                                                    onMouseLeave={() => setHoveredPlacement(null)}
                                                                  >
                                                                    <div 
                                                                      className="flex justify-between items-center px-4 py-2 cursor-pointer"
                                                                      onClick={() => handlePlacementExpand(placement.id)}
                                                                    >
                                                                      <div className="flex items-center">
                                                                        <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                                                                          <Bars3Icon className="h-3 w-3 text-gray-400" />
                                                                        </span>
                                                                        
                                                                        {expandedPlacements[placement.id] ? (
                                                                          <ChevronDownIcon className="h-3 w-3 text-gray-500 mr-2" />
                                                                        ) : (
                                                                          <ChevronRightIcon className="h-3 w-3 text-gray-500 mr-2" />
                                                                        )}
                                                                        
                                                                        <div className="text-xs text-gray-700">
                                                                          📋 {placement.PL_Label}
                                                                        </div>
                                                                        
                                                                        {placementCreatifs.length > 0 && (
                                                                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            {placementCreatifs.length} créatif{placementCreatifs.length > 1 ? 's' : ''}
                                                                          </span>
                                                                        )}
                                                                        
                                                                        <button 
                                                                          onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCreateCreatif(placement.id);
                                                                          }} 
                                                                          className={`ml-2 p-1 rounded hover:bg-gray-200 ${
                                                                            hoveredPlacement?.placementId === placement.id ? 'text-indigo-600' : 'text-indigo-400'
                                                                          }`}
                                                                          title="Ajouter un créatif"
                                                                        >
                                                                          <PlusIcon className="h-3 w-3" />
                                                                        </button>
                                                                      </div>
                                                                      <div className="flex items-center space-x-2">
                                                                        {hoveredPlacement?.placementId === placement.id && (
                                                                          <>
                                                                            <button 
                                                                              onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEditPlacement(tactique.id, placement);
                                                                              }}
                                                                              className="p-1 rounded hover:bg-gray-200"
                                                                              title="Modifier le placement"
                                                                            >
                                                                              <PencilIcon className="h-3 w-3 text-gray-400" />
                                                                            </button>
                                                                            {onDeletePlacement && (
                                                                              <button 
                                                                                onClick={(e) => {
                                                                                  e.stopPropagation();
                                                                                  onDeletePlacement(placement.id);
                                                                                }}
                                                                                className="p-1 rounded hover:bg-gray-200"
                                                                                title="Supprimer le placement"
                                                                              >
                                                                                <TrashIcon className="h-3 w-3 text-gray-400" />
                                                                              </button>
                                                                            )}
                                                                          </>
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                    
                                                                    {/* Créatifs */}
                                                                    {expandedPlacements[placement.id] && (
                                                                      <div className="pl-8 bg-white py-1">
                                                                        {placementCreatifs.length === 0 ? (
                                                                          <div className="px-3 py-2 text-xs text-gray-500 italic">
                                                                            Aucun créatif pour ce placement
                                                                          </div>
                                                                        ) : (
                                                                          <Droppable droppableId={`creatifs-${placement.id}`} type="CREATIF">
                                                                            {(provided) => (
                                                                              <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.droppableProps}
                                                                              >
                                                                                {placementCreatifs.map((creatif, creatifIndex) => (
                                                                                  <Draggable
                                                                                    key={`creatif-${creatif.id}`}
                                                                                    draggableId={`creatif-${creatif.id}`}
                                                                                    index={creatifIndex}
                                                                                  >
                                                                                    {(provided, snapshot) => (
                                                                                      <div 
                                                                                        ref={provided.innerRef}
                                                                                        {...provided.draggableProps}
                                                                                        className={`flex justify-between items-center px-3 py-1.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                                                                          snapshot.isDragging ? 'bg-white shadow-lg rounded' : ''
                                                                                        }`}
                                                                                        onMouseEnter={() => setHoveredCreatif({sectionId: section.id, tactiqueId: tactique.id, placementId: placement.id, creatifId: creatif.id})}
                                                                                        onMouseLeave={() => setHoveredCreatif(null)}
                                                                                      >
                                                                                        <div className="flex items-center">
                                                                                          <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                                                                                            <Bars3Icon className="h-3 w-3 text-gray-300" />
                                                                                          </span>
                                                                                          <div className="text-xs text-gray-600">
                                                                                            🎨 {creatif.CR_Label}
                                                                                          </div>
                                                                                          {creatif.CR_Version && (
                                                                                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                                                              v{creatif.CR_Version}
                                                                                            </span>
                                                                                          )}
                                                                                        </div>
                                                                                        <div className="flex items-center space-x-1">
                                                                                          {hoveredCreatif?.creatifId === creatif.id && (
                                                                                            <>
                                                                                              <button 
                                                                                                onClick={(e) => {
                                                                                                  e.stopPropagation();
                                                                                                  handleEditCreatif(placement.id, creatif);
                                                                                                }}
                                                                                                className="p-1 rounded hover:bg-gray-200"
                                                                                                title="Modifier le créatif"
                                                                                              >
                                                                                                <PencilIcon className="h-2.5 w-2.5 text-gray-400" />
                                                                                              </button>
                                                                                              {onDeleteCreatif && (
                                                                                                <button 
                                                                                                  onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    onDeleteCreatif(creatif.id);
                                                                                                  }}
                                                                                                  className="p-1 rounded hover:bg-gray-200"
                                                                                                  title="Supprimer le créatif"
                                                                                                >
                                                                                                  <TrashIcon className="h-2.5 w-2.5 text-gray-400" />
                                                                                                </button>
                                                                                              )}
                                                                                            </>
                                                                                          )}
                                                                                        </div>
                                                                                      </div>
                                                                                    )}
                                                                                  </Draggable>
                                                                                ))}
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
      
      {/* Drawers (code existant...) */}
      <TactiqueDrawer
        isOpen={tactiqueDrawer.isOpen}
        onClose={closeTactiqueDrawer}
        tactique={tactiqueDrawer.tactique}
        sectionId={tactiqueDrawer.sectionId}
        onSave={handleSaveTactique}
      />
      
      <PlacementDrawer
        isOpen={placementDrawer.isOpen}
        onClose={closePlacementDrawer}
        placement={placementDrawer.placement}
        tactiqueId={placementDrawer.tactiqueId}
        tactiqueData={currentTactiqueData}
        onSave={handleSavePlacement}
      />
      
      <CreatifDrawer
        isOpen={creatifDrawer.isOpen}
        onClose={closeCreatifDrawer}
        creatif={creatifDrawer.creatif}
        placementId={creatifDrawer.placementId}
        placementData={currentPlacementContext?.placement}
        tactiqueData={currentPlacementContext?.tactique}
        onSave={handleSaveCreatif}
      />
    </>
  );
}