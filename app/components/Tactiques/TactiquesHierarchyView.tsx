// app/components/Tactiques/TactiquesHierarchyView.tsx - VERSION SIMPLIFIÉE AVEC DRAG AND DROP

'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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
  Creatif
} from '../../types/tactiques';
import TactiqueDrawer from './Tactiques/TactiqueDrawer';
import PlacementDrawer from './Placement/PlacementDrawer';
import CreatifDrawer from './Creatif/CreatifDrawer';
import { TactiqueItem } from './HierarchyComponents';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

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
  onDeletePlacement?: (placementId: string) => void;
  onCreateCreatif?: (placementId: string) => Promise<Creatif>;
  onUpdateCreatif?: (creatifId: string, data: Partial<Creatif>) => Promise<void>;
  onDeleteCreatif?: (creatifId: string) => void;
  formatCurrency: (amount: number) => string;
  totalBudget: number;
  onRefresh?: () => Promise<void>;
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
  onRefresh
}: TactiquesHierarchyViewProps) {

  // ==================== HOOK DRAG AND DROP ====================
  
  const tactiques = sections.reduce((acc, section) => {
    acc[section.id] = section.tactiques;
    return acc;
  }, {} as { [sectionId: string]: Tactique[] });

  const { isDragLoading, handleDragEnd } = useDragAndDrop({
    sections,
    tactiques,
    placements,
    creatifs,
    onRefresh
  });

  // ==================== ÉTATS D'INTERACTION ====================

  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [hoveredTactique, setHoveredTactique] = useState<{sectionId: string, tactiqueId: string} | null>(null);
  const [hoveredPlacement, setHoveredPlacement] = useState<{sectionId: string, tactiqueId: string, placementId: string} | null>(null);
  const [hoveredCreatif, setHoveredCreatif] = useState<{sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null>(null);
  
  const [expandedTactiques, setExpandedTactiques] = useState<{[tactiqueId: string]: boolean}>({});
  const [expandedPlacements, setExpandedPlacements] = useState<{[placementId: string]: boolean}>({});

  // ==================== ÉTATS DES DRAWERS ====================

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

  // ==================== FONCTIONS UTILITAIRES ====================

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

  // ==================== GESTIONNAIRES DE CRÉATION ====================

  const handleCreateTactiqueLocal = async (sectionId: string) => {
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

  const handleCreatePlacementLocal = async (tactiqueId: string) => {
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

  const handleCreateCreatifLocal = async (placementId: string) => {
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

  // ==================== GESTIONNAIRES D'ÉDITION ====================

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

  // ==================== GESTIONNAIRES DE SAUVEGARDE ====================

  const handleSaveTactique = async (tactiqueData: any) => {
    if (!tactiqueDrawer.tactique || !onUpdateTactique) return;
    
    try {
      await onUpdateTactique(tactiqueDrawer.sectionId, tactiqueDrawer.tactique.id, tactiqueData);
      setTactiqueDrawer(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tactique:', error);
    }
  };

  const handleSavePlacement = async (placementData: any) => {
    if (!placementDrawer.placement || !onUpdatePlacement) return;
    
    try {
      await onUpdatePlacement(placementDrawer.placement.id, placementData);
      setPlacementDrawer(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du placement:', error);
    }
  };

  const handleSaveCreatif = async (creatifData: any) => {
    if (!creatifDrawer.creatif || !onUpdateCreatif) return;
    
    try {
      await onUpdateCreatif(creatifDrawer.creatif.id, creatifData);
      setCreatifDrawer(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du créatif:', error);
    }
  };

  // ==================== FONCTIONS UTILITAIRES POUR LES DRAWERS ====================

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
                                  handleCreateTactiqueLocal(section.id);
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

                        {/* Rendu des tactiques - logique similaire mais raccourcie */}
                        {section.isExpanded && (
                          <div className="bg-gray-50">
                            {section.tactiques.length === 0 ? (
                              <div className="pl-12 py-3 text-sm text-gray-500 italic">
                                Aucune tactique dans cette section
                              </div>
                            ) : (
                              <Droppable droppableId={`tactiques-${section.id}`} type="TACTIQUE">
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.droppableProps}>
                                            {section.tactiques.map((tactique, tactiqueIndex) => {
                                      const tactiquePlacements = placements[tactique.id] || [];
                                      
                                      return (
                                        <TactiqueItem
                                          key={tactique.id}
                                          tactique={tactique}
                                          index={tactiqueIndex}
                                          sectionId={section.id}
                                          placements={tactiquePlacements}
                                          creatifs={creatifs}
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
                                          onDelete={onDeleteTactique}
                                          onCreatePlacement={handleCreatePlacementLocal}
                                          onEditPlacement={handleEditPlacement}
                                          onDeletePlacement={onDeletePlacement}
                                          onCreateCreatif={handleCreateCreatifLocal}
                                          onEditCreatif={handleEditCreatif}
                                          onDeleteCreatif={onDeleteCreatif}
                                          formatCurrency={formatCurrency}
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
    </>
  );
}