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
  Creatif, 
  TactiqueWithPlacements, 
  PlacementWithCreatifs,
  TactiqueFormData,
  PlacementFormData,
  CreatifFormData
} from '../../types/tactiques';
import TactiqueDrawer from './TactiqueDrawer';
import PlacementDrawer from './PlacementDrawer';
import CreatifDrawer from './CreatifDrawer';

interface TactiquesHierarchyViewProps {
  sections: SectionWithTactiques[];
  onSectionExpand: (sectionId: string) => void;
  onDragEnd: (result: any) => void;
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
}

export default function TactiquesHierarchyView({
  sections,
  onSectionExpand,
  onDragEnd,
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
  totalBudget
}: TactiquesHierarchyViewProps) {
  // États pour suivre les éléments survolés
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [hoveredTactique, setHoveredTactique] = useState<{sectionId: string, tactiqueId: string} | null>(null);
  const [hoveredPlacement, setHoveredPlacement] = useState<{sectionId: string, tactiqueId: string, placementId: string} | null>(null);
  const [hoveredCreatif, setHoveredCreatif] = useState<{sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null>(null);
  
  // États pour l'expansion des éléments
  const [expandedTactiques, setExpandedTactiques] = useState<{[tactiqueId: string]: boolean}>({});
  const [expandedPlacements, setExpandedPlacements] = useState<{[placementId: string]: boolean}>({});
  
  // États pour les drawers
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

  // Fonction pour calculer le pourcentage du budget total
  const calculatePercentage = (amount: number) => {
    if (totalBudget <= 0) return 0;
    return Math.round((amount / totalBudget) * 100);
  };
  
  // Gestionnaires pour l'expansion
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

  // Gestionnaires pour les actions de création
  const handleCreateTactique = async (sectionId: string) => {
    if (!onCreateTactique) return;
    
    try {
      const newTactique = await onCreateTactique(sectionId);
      // Ouvrir le drawer en mode édition avec la nouvelle tactique
      setTactiqueDrawer({
        isOpen: true,
        tactique: newTactique,
        sectionId,
        mode: 'edit' // Mode edit car la tactique existe déjà en base
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

  // Gestionnaires pour ouvrir les drawers en mode édition
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

  // Gestionnaires pour sauvegarder depuis les drawers
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

  // Fermer les drawers
  const closeTactiqueDrawer = () => {
    setTactiqueDrawer(prev => ({ ...prev, isOpen: false }));
  };

  const closePlacementDrawer = () => {
    setPlacementDrawer(prev => ({ ...prev, isOpen: false }));
  };

  const closeCreatifDrawer = () => {
    setCreatifDrawer(prev => ({ ...prev, isOpen: false }));
  };

  // Conversion temporaire des données pour les maquettes
  const sectionsWithPlacements = sections.map(section => {
    const tactiquesWithPlacements = section.tactiques.map(tactique => {
      const placements: PlacementWithCreatifs[] = [
        {
          id: `placement-${tactique.id}-1`,
          PL_Label: 'Bannière principale',
          PL_Format: '300x250',
          PL_Budget: tactique.TC_Budget * 0.6,
          PL_Order: 0,
          PL_TactiqueId: tactique.id,
          creatifs: [
            {
              id: `creatif-${tactique.id}-1-1`,
              CR_Label: 'Créatif A',
              CR_URL: 'https://example.com/creatif-a.jpg',
              CR_Order: 0,
              CR_PlacementId: `placement-${tactique.id}-1`
            },
            {
              id: `creatif-${tactique.id}-1-2`,
              CR_Label: 'Créatif B',
              CR_URL: 'https://example.com/creatif-b.jpg',
              CR_Order: 1,
              CR_PlacementId: `placement-${tactique.id}-1`
            }
          ]
        }
      ];
      
      return {
        ...tactique,
        placements
      } as TactiqueWithPlacements;
    });
    
    return {
      ...section,
      tactiques: tactiquesWithPlacements
    };
  });
  // 🔥 NOUVELLE FONCTION : Trouver la tactique par son ID
const findTactiqueById = (tactiqueId: string): Tactique | undefined => {
  for (const section of sections) {
    const tactique = section.tactiques.find(t => t.id === tactiqueId);
    if (tactique) return tactique;
  }
  return undefined;
};

// 🔥 RÉCUPÉRER LES DONNÉES DE LA TACTIQUE pour le PlacementDrawer
const currentTactiqueData = placementDrawer.tactiqueId ? 
  findTactiqueById(placementDrawer.tactiqueId) : 
  undefined;


  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Droppable droppableId="sections" type="SECTION">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="divide-y divide-gray-200"
              >
                {sectionsWithPlacements.map((section, sectionIndex) => (
                  <Draggable
                    key={`section-${section.id}`}
                    draggableId={`section-${section.id}`}
                    index={sectionIndex}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'bg-gray-50' : ''}`}
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
                              
                              {/* Bouton d'ajout de tactique */}
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
                              {/* Actions de section */}
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
                              section.tactiques.map((tactique) => (
                                <div
                                  key={tactique.id}
                                  className="border-b border-gray-100 last:border-b-0 pl-8"
                                  onMouseEnter={() => setHoveredTactique({sectionId: section.id, tactiqueId: tactique.id})}
                                  onMouseLeave={() => setHoveredTactique(null)}
                                >
                                  <div 
                                    className="flex justify-between items-center px-4 py-3 cursor-pointer"
                                    onClick={() => handleTactiqueExpand(tactique.id)}
                                  >
                                    <div className="flex items-center">
                                      <Bars3Icon className="h-4 w-4 text-gray-400 mr-2" />
                                      
                                      {expandedTactiques[tactique.id] ? (
                                        <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                                      ) : (
                                        <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                                      )}
                                      
                                      <div className="text-sm text-gray-800 font-medium">
                                        {tactique.TC_Label}
                                      </div>
                                      
                                      {/* Bouton d'ajout de placement */}
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
                                      {/* Actions de tactique */}
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
                                      {tactique.placements.map((placement) => (
                                        <div key={placement.id} className="border-b border-gray-200 last:border-b-0">
                                          <div 
                                            className="flex justify-between items-center px-4 py-2 cursor-pointer"
                                            onClick={() => handlePlacementExpand(placement.id)}
                                          >
                                            <div className="flex items-center">
                                              <Bars3Icon className="h-3 w-3 text-gray-400 mr-2" />
                                              
                                              {expandedPlacements[placement.id] ? (
                                                <ChevronDownIcon className="h-3 w-3 text-gray-500 mr-2" />
                                              ) : (
                                                <ChevronRightIcon className="h-3 w-3 text-gray-500 mr-2" />
                                              )}
                                              
                                              <div className="text-xs text-gray-700">
                                                {placement.PL_Label}
                                                {placement.PL_Format && (
                                                  <span className="ml-2 text-gray-500">{placement.PL_Format}</span>
                                                )}
                                              </div>
                                              
                                              {/* Bouton d'ajout de créatif */}
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleCreateCreatif(placement.id);
                                                }} 
                                                className="ml-2 p-1 rounded hover:bg-gray-200 text-indigo-400"
                                                title="Ajouter un créatif"
                                              >
                                                <PlusIcon className="h-3 w-3" />
                                              </button>
                                            </div>
                                            <div className="text-xs font-medium">
                                              {formatCurrency(placement.PL_Budget)}
                                            </div>
                                          </div>
                                          
                                          {/* Créatifs */}
                                          {expandedPlacements[placement.id] && (
                                            <div className="pl-8 bg-white py-1">
                                              {placement.creatifs.map((creatif) => (
                                                <div 
                                                  key={creatif.id}
                                                  className="flex justify-between items-center px-3 py-1"
                                                >
                                                  <div className="flex items-center">
                                                    <Bars3Icon className="h-2 w-2 text-gray-400 mr-1" />
                                                    <div className="w-2 h-2 rounded-full bg-gray-400 ml-1 mr-2"></div>
                                                    <div className="text-xs text-gray-600">
                                                      {creatif.CR_Label}
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="flex space-x-1">
                                                    <button 
                                                      onClick={() => handleEditCreatif(placement.id, creatif)}
                                                      className="p-1 rounded hover:bg-gray-100"
                                                      title="Modifier le créatif"
                                                    >
                                                      <PencilIcon className="h-3 w-3 text-gray-400" />
                                                    </button>
                                                    {onDeleteCreatif && (
                                                      <button 
                                                        onClick={() => onDeleteCreatif(creatif.id)}
                                                        className="p-1 rounded hover:bg-gray-100"
                                                        title="Supprimer le créatif"
                                                      >
                                                        <TrashIcon className="h-3 w-3 text-gray-400" />
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
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
  tactiqueData={currentTactiqueData} // 🔥 NOUVEAU : Transmettre les données de tactique
  onSave={handleSavePlacement}
/>
      
      <CreatifDrawer
        isOpen={creatifDrawer.isOpen}
        onClose={closeCreatifDrawer}
        creatif={creatifDrawer.creatif}
        placementId={creatifDrawer.placementId}
        onSave={handleSaveCreatif}
      />
    </>
  );
}