'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SectionWithTactiques } from '../types/tactiques';

interface TactiquesHierarchyViewProps {
  sections: SectionWithTactiques[];
  onSectionExpand: (sectionId: string) => void;
  onDragEnd: (result: any) => void;
  onEditSection?: (sectionId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onEditTactique?: (sectionId: string, tactiqueId: string) => void;
  onDeleteTactique?: (sectionId: string, tactiqueId: string) => void;
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
  formatCurrency,
  totalBudget
}: TactiquesHierarchyViewProps) {
  // État pour suivre la section survolée (pour afficher les boutons d'action)
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [hoveredTactique, setHoveredTactique] = useState<{sectionId: string, tactiqueId: string} | null>(null);

  // Fonction pour calculer le pourcentage du budget total
  const calculatePercentage = (amount: number) => {
    if (totalBudget <= 0) return 0;
    return Math.round((amount / totalBudget) * 100);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
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
                  key={section.id}
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
                          {...provided.dragHandleProps}
                        >
                          <div className="flex items-center">
                            {section.isExpanded ? (
                              <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                            )}
                            <h3 className="font-medium text-gray-900">{section.SECTION_Name}</h3>
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
                                    key={tactique.id}
                                    draggableId={`tactique-${tactique.id}`}
                                    index={tactiqueIndex}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`relative border-b border-gray-100 last:border-b-0 pl-8 ${
                                          snapshot.isDragging ? 'bg-blue-50' : ''
                                        }`}
                                        onMouseEnter={() => setHoveredTactique({sectionId: section.id, tactiqueId: tactique.id})}
                                        onMouseLeave={() => setHoveredTactique(null)}
                                      >
                                        <div className="flex justify-between items-center px-4 py-3">
                                          <div className="text-sm text-gray-800">
                                            {tactique.TC_Label}
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
                                                      onEditTactique(section.id, tactique.id);
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
  );
}