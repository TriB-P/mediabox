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
  onEditTactique?: (sectionId: string, tactiqueId: string) => void;
  onDeleteTactique?: (sectionId: string, tactiqueId: string) => void;
  onAddTactique?: (sectionId: string) => void;
  onAddPlacement?: (sectionId: string, tactiqueId: string) => void;
  onAddCreatif?: (sectionId: string, tactiqueId: string, placementId: string) => void;
  formatCurrency: (amount: number) => string;
  totalBudget: number;
}

export default function TactiquesHierarchyView({
  sections,
  onSectionExpand,
  onDragEnd,
  onEditSection,
  onDeleteSection,
  onEditTactique,
  onDeleteTactique,
  onAddTactique,
  onAddPlacement,
  onAddCreatif,
  formatCurrency,
  totalBudget
}: TactiquesHierarchyViewProps) {
  // État pour suivre les éléments survolés (pour afficher les boutons d'action)
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [hoveredTactique, setHoveredTactique] = useState<{sectionId: string, tactiqueId: string} | null>(null);
  const [hoveredPlacement, setHoveredPlacement] = useState<{sectionId: string, tactiqueId: string, placementId: string} | null>(null);
  const [hoveredCreatif, setHoveredCreatif] = useState<{sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null>(null);
  
  // État pour suivre l'expansion des tactiques (pour afficher les placements)
  const [expandedTactiques, setExpandedTactiques] = useState<{[tactiqueId: string]: boolean}>({});
  
  // État pour suivre l'expansion des placements (pour afficher les créatifs)
  const [expandedPlacements, setExpandedPlacements] = useState<{[placementId: string]: boolean}>({});
  
  // États pour les formulaires en drawer
  const [tactiqueDrawerOpen, setTactiqueDrawerOpen] = useState(false);
  const [selectedTactique, setSelectedTactique] = useState<Tactique | null>(null);
  const [selectedTactiqueSection, setSelectedTactiqueSection] = useState<string>('');
  
  const [placementDrawerOpen, setPlacementDrawerOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);
  const [selectedPlacementTactique, setSelectedPlacementTactique] = useState<string>('');
  
  const [creatifDrawerOpen, setCreatifDrawerOpen] = useState(false);
  const [selectedCreatif, setSelectedCreatif] = useState<Creatif | null>(null);
  const [selectedCreatifPlacement, setSelectedCreatifPlacement] = useState<string>('');

  // Fonction pour calculer le pourcentage du budget total
  const calculatePercentage = (amount: number) => {
    if (totalBudget <= 0) return 0;
    return Math.round((amount / totalBudget) * 100);
  };
  
  // Fonction pour gérer l'expansion des tactiques
  const handleTactiqueExpand = (tactiqueId: string) => {
    setExpandedTactiques(prev => ({
      ...prev,
      [tactiqueId]: !prev[tactiqueId]
    }));
  };
  
  // Fonction pour gérer l'expansion des placements
  const handlePlacementExpand = (placementId: string) => {
    setExpandedPlacements(prev => ({
      ...prev,
      [placementId]: !prev[placementId]
    }));
  };
  
  // Gestionnaires pour les formulaires
  const handleOpenTactiqueDrawer = (sectionId: string, tactique?: Tactique) => {
    setSelectedTactiqueSection(sectionId);
    setSelectedTactique(tactique || null);
    setTactiqueDrawerOpen(true);
    // Important: si aucune tactique n'est fournie (création), appeler onAddTactique
    if (!tactique && onAddTactique) {
      onAddTactique(sectionId);
    }
  };
  
  const handleOpenPlacementDrawer = (tactiqueId: string, placement?: Placement) => {
    setSelectedPlacementTactique(tactiqueId);
    setSelectedPlacement(placement || null);
    setPlacementDrawerOpen(true);
  };
  
  const handleOpenCreatifDrawer = (placementId: string, creatif?: Creatif) => {
    setSelectedCreatifPlacement(placementId);
    setSelectedCreatif(creatif || null);
    setCreatifDrawerOpen(true);
  };
  
  // Gestionnaires pour sauvegarder les données des formulaires
  const handleSaveTactique = async (tactiqueData: any) => {
    // Cette fonction serait implémentée pour sauvegarder les données dans Firestore
    console.log('Enregistrer la tactique:', tactiqueData);
    // Implémenter la logique de sauvegarde ici
    
    // Si c'est une modification, appeler onEditTactique
    if (selectedTactique && onEditTactique) {
      onEditTactique(selectedTactiqueSection, selectedTactique.id);
    }
    // Si c'est un ajout, onAddTactique aurait déjà été appelé avant
  };
  
  const handleSavePlacement = async (placementData: any) => {
    console.log('Enregistrer le placement:', placementData);
    // Implémenter la logique de sauvegarde ici
  };
  
  const handleSaveCreatif = async (creatifData: any) => {
    console.log('Enregistrer le créatif:', creatifData);
    // Implémenter la logique de sauvegarde ici
  };

  // Conversion temporaire des données pour les maquettes de placements et créatifs
  // Dans une implémentation réelle, ces données viendraient de votre backend
  const sectionsWithPlacements = sections.map(section => {
    const tactiquesWithPlacements = section.tactiques.map(tactique => {
      // Générer des placements fictifs pour chaque tactique
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
        },
        {
          id: `placement-${tactique.id}-2`,
          PL_Label: 'Sidebar',
          PL_Format: '160x600',
          PL_Budget: tactique.TC_Budget * 0.4,
          PL_Order: 1,
          PL_TactiqueId: tactique.id,
          creatifs: [
            {
              id: `creatif-${tactique.id}-2-1`,
              CR_Label: 'Créatif C',
              CR_URL: 'https://example.com/creatif-c.jpg',
              CR_Order: 0,
              CR_PlacementId: `placement-${tactique.id}-2`
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
                              {/* Poignée de déplacement pour les sections */}
                              <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                                <Bars3Icon className="h-4 w-4 text-gray-400" />
                              </span>
                              
                              {section.isExpanded ? (
                                <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                              )}
                              <h3 className="font-medium text-gray-900">{section.SECTION_Name}</h3>
                              
                              {/* Bouton pour ajouter une tactique à cette section (toujours visible) */}
                              {onAddTactique && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenTactiqueDrawer(section.id);
                                    onAddTactique(section.id);
                                  }} 
                                  className={`ml-2 p-1 rounded hover:bg-gray-200 ${
                                    hoveredSection === section.id ? 'text-indigo-600' : 'text-indigo-400'
                                  }`}
                                  title="Ajouter une tactique"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center space-x-4">
                              {/* Actions de section (visibles au survol) */}
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

                        {/* Tactiques au sein de la section */}
                        {section.isExpanded && (
                          <Droppable droppableId={`tactiques-${section.id}`} type="TACTIQUE">
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="bg-gray-50"
                              >
                                {section.tactiques.length === 0 ? (
                                  <div className="pl-12 py-3 text-sm text-gray-500 italic">
                                    Aucune tactique dans cette section
                                  </div>
                                ) : (
                                  section.tactiques.map((tactique, tactiqueIndex) => (
                                    <Draggable
                                      key={`tactique-${tactique.id}`}
                                      draggableId={`tactique-${tactique.id}`}
                                      index={tactiqueIndex}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`relative border-b border-gray-100 last:border-b-0 pl-8 ${
                                            snapshot.isDragging ? 'bg-blue-50' : ''
                                          }`}
                                          onMouseEnter={() => setHoveredTactique({sectionId: section.id, tactiqueId: tactique.id})}
                                          onMouseLeave={() => setHoveredTactique(null)}
                                        >
                                          <div 
                                            className="flex justify-between items-center px-4 py-3 cursor-pointer"
                                            onClick={() => handleTactiqueExpand(tactique.id)}
                                          >
                                            <div className="flex items-center">
                                              {/* Poignée de déplacement pour les tactiques */}
                                              <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                                                <Bars3Icon className="h-4 w-4 text-gray-400" />
                                              </span>
                                              
                                              {/* Icône d'expansion */}
                                              {expandedTactiques[tactique.id] ? (
                                                <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                                              ) : (
                                                <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                                              )}
                                              
                                              <div className="text-sm text-gray-800 font-medium">
                                                {tactique.TC_Label}
                                              </div>
                                              
                                              {/* Bouton pour ajouter un placement (toujours visible) */}
                                              {onAddPlacement && (
                                                <button 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenPlacementDrawer(tactique.id);
                                                    if (onAddPlacement) onAddPlacement(section.id, tactique.id);
                                                  }} 
                                                  className={`ml-2 p-1 rounded hover:bg-gray-200 ${
                                                    hoveredTactique?.tactiqueId === tactique.id ? 'text-indigo-600' : 'text-indigo-400'
                                                  }`}
                                                  title="Ajouter un placement"
                                                >
                                                  <PlusIcon className="h-4 w-4" />
                                                </button>
                                              )}
                                            </div>
                                            <div className="flex items-center space-x-4">
                                              {/* Actions de tactique (visibles au survol) */}
                                              {hoveredTactique?.sectionId === section.id && 
                                               hoveredTactique?.tactiqueId === tactique.id && (
                                                <div className="flex space-x-1">
                                                  {onEditTactique && (
                                                    <button 
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenTactiqueDrawer(section.id, tactique);
                                                      }} 
                                                      className="p-1 rounded hover:bg-gray-200"
                                                    >
                                                      <PencilIcon className="h-4 w-4 text-gray-500" />
                                                    </button>
                                                  )}
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
                                          
                                          {/* Placements au sein de la tactique */}
                                          {expandedTactiques[tactique.id] && (
                                            <div className="pl-8 pb-2 bg-gray-100">
                                              {tactique.placements.length === 0 ? (
                                                <div className="pl-8 py-2 text-xs text-gray-500 italic">
                                                  Aucun placement dans cette tactique
                                                </div>
                                              ) : (
                                                <Droppable droppableId={`placements-${tactique.id}`} type="PLACEMENT">
                                                  {(provided) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.droppableProps}
                                                      className="placement-container"
                                                    >
                                                      {tactique.placements.map((placement, placementIndex) => (
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
                                                                snapshot.isDragging ? 'bg-blue-50' : ''
                                                              }`}
                                                              onMouseEnter={() => setHoveredPlacement({
                                                                sectionId: section.id,
                                                                tactiqueId: tactique.id,
                                                                placementId: placement.id
                                                              })}
                                                              onMouseLeave={() => setHoveredPlacement(null)}
                                                            >
                                                              <div 
                                                                className="flex justify-between items-center px-4 py-2 cursor-pointer"
                                                                onClick={() => handlePlacementExpand(placement.id)}
                                                              >
                                                                <div className="flex items-center">
                                                                  {/* Poignée de déplacement pour les placements */}
                                                                  <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                                                                    <Bars3Icon className="h-3 w-3 text-gray-400" />
                                                                  </span>
                                                                
                                                                  {/* Icône d'expansion */}
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
                                                                  
                                                                  {/* Bouton pour ajouter un créatif (toujours visible) */}
                                                                  {onAddCreatif && (
                                                                    <button 
                                                                      onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenCreatifDrawer(placement.id);
                                                                        if (onAddCreatif) onAddCreatif(section.id, tactique.id, placement.id);
                                                                      }} 
                                                                      className={`ml-2 p-1 rounded hover:bg-gray-200 ${
                                                                        hoveredPlacement?.placementId === placement.id ? 'text-indigo-600' : 'text-indigo-400'
                                                                      }`}
                                                                      title="Ajouter un créatif"
                                                                    >
                                                                      <PlusIcon className="h-3 w-3" />
                                                                    </button>
                                                                  )}
                                                                </div>
                                                                <div className="text-xs font-medium">
                                                                  {formatCurrency(placement.PL_Budget)}
                                                                </div>
                                                              </div>
                                                              
                                                              {/* Créatifs au sein du placement */}
                                                              {expandedPlacements[placement.id] && (
                                                                <Droppable droppableId={`creatifs-${placement.id}`} type="CREATIF">
                                                                  {(provided) => (
                                                                    <div
                                                                      ref={provided.innerRef}
                                                                      {...provided.droppableProps}
                                                                      className="pl-8 bg-white py-1"
                                                                    >
                                                                      {placement.creatifs.length === 0 ? (
                                                                        <div className="pl-6 py-1 text-xs text-gray-500 italic">
                                                                          Aucun créatif dans ce placement
                                                                        </div>
                                                                      ) : (
                                                                        placement.creatifs.map((creatif, creatifIndex) => (
                                                                          <Draggable
                                                                            key={`creatif-${creatif.id}`}
                                                                            draggableId={`creatif-${creatif.id}`}
                                                                            index={creatifIndex}
                                                                          >
                                                                            {(provided, snapshot) => (
                                                                              <div 
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                className={`flex justify-between items-center px-3 py-1 ${
                                                                                  snapshot.isDragging ? 'bg-blue-50' : ''
                                                                                }`}
                                                                                onMouseEnter={() => setHoveredCreatif({
                                                                                  sectionId: section.id,
                                                                                  tactiqueId: tactique.id,
                                                                                  placementId: placement.id,
                                                                                  creatifId: creatif.id
                                                                                })}
                                                                                onMouseLeave={() => setHoveredCreatif(null)}
                                                                              >
                                                                                <div className="flex items-center">
                                                                                  {/* Poignée de déplacement pour les créatifs */}
                                                                                  <span {...provided.dragHandleProps} className="pr-1 cursor-grab">
                                                                                    <Bars3Icon className="h-2 w-2 text-gray-400" />
                                                                                  </span>
                                                                                  <div className="w-2 h-2 rounded-full bg-gray-400 ml-1 mr-2"></div>
                                                                                  <div className="text-xs text-gray-600">
                                                                                    {creatif.CR_Label}
                                                                                  </div>
                                                                                </div>
                                                                                
                                                                                {/* Actions sur les créatifs */}
                                                                                {hoveredCreatif?.creatifId === creatif.id && (
                                                                                  <div className="flex space-x-1">
                                                                                    <button 
                                                                                      onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleOpenCreatifDrawer(placement.id, creatif);
                                                                                      }}
                                                                                      className="p-1 rounded hover:bg-gray-100"
                                                                                      title="Modifier le créatif"
                                                                                    >
                                                                                      <PencilIcon className="h-3 w-3 text-gray-400" />
                                                                                    </button>
                                                                                    <button 
                                                                                      className="p-1 rounded hover:bg-gray-100"
                                                                                      title="Supprimer le créatif"
                                                                                    >
                                                                                      <TrashIcon className="h-3 w-3 text-gray-400" />
                                                                                    </button>
                                                                                  </div>
                                                                                )}
                                                                              </div>
                                                                            )}
                                                                          </Draggable>
                                                                        ))
                                                                      )}
                                                                      {provided.placeholder}
                                                                    </div>
                                                                  )}
                                                                </Droppable>
                                                              )}
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
                                  ))
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
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
      
      {/* Formulaires en drawer */}
      <TactiqueDrawer
        isOpen={tactiqueDrawerOpen}
        onClose={() => setTactiqueDrawerOpen(false)}
        tactique={selectedTactique}
        sectionId={selectedTactiqueSection}
        onSave={handleSaveTactique}
      />
      
      <PlacementDrawer
        isOpen={placementDrawerOpen}
        onClose={() => setPlacementDrawerOpen(false)}
        placement={selectedPlacement}
        tactiqueId={selectedPlacementTactique}
        onSave={handleSavePlacement}
      />
      
      <CreatifDrawer
        isOpen={creatifDrawerOpen}
        onClose={() => setCreatifDrawerOpen(false)}
        creatif={selectedCreatif}
        placementId={selectedCreatifPlacement}
        onSave={handleSaveCreatif}
      />
    </>
  );
}