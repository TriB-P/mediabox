// app/components/Tactiques/HierarchyComponents.tsx - Composants de rendu pour la hiérarchie

'use client';

import React from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { Tactique, Placement, Creatif } from '../../types/tactiques';

// ==================== INTERFACE COMMUNE ====================

interface BaseItemProps {
  formatCurrency: (amount: number) => string;
  onSelect: (id: string, type: 'section' | 'tactique' | 'placement' | 'creatif', isSelected: boolean) => void;
}

// ==================== COMPOSANT CRÉATIF ====================

interface CreatifItemProps extends BaseItemProps {
  creatif: Creatif;
  index: number;
  sectionId: string;
  tactiqueId: string;
  placementId: string;
  hoveredCreatif: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null;
  onHover: (hover: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null) => void;
  onEdit: (placementId: string, creatif: Creatif) => void;
  onDelete?: (creatifId: string) => void;
}

export const CreatifItem: React.FC<CreatifItemProps> = ({
  creatif,
  index,
  sectionId,
  tactiqueId,
  placementId,
  hoveredCreatif,
  onHover,
  onEdit,
  onDelete,
  onSelect
}) => {
  const isHovered = hoveredCreatif?.creatifId === creatif.id;

  return (
    <Draggable
      key={`creatif-${creatif.id}`}
      draggableId={`creatif-${creatif.id}`}
      index={index}
    >
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex justify-between items-center px-3 py-1.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
            snapshot.isDragging ? 'bg-white shadow-lg rounded' : ''
          } ${creatif.isSelected ? 'bg-indigo-50' : ''}`}
          onMouseEnter={() => onHover({sectionId, tactiqueId, placementId, creatifId: creatif.id})}
          onMouseLeave={() => onHover(null)}
        >
          <div className="flex items-center">
            {/* Checkbox pour le créatif */}
            <input
              type="checkbox"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
              checked={creatif.isSelected || false}
              onChange={(e) => onSelect(creatif.id, 'creatif', e.target.checked)}
              onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic à l'élément parent
            />
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
            {isHovered && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(placementId, creatif);
                  }}
                  className="p-1 rounded hover:bg-gray-200"
                  title="Modifier le créatif"
                >
                  <PencilIcon className="h-2.5 w-2.5 text-gray-400" />
                </button>
                {onDelete && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(creatif.id);
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
  );
};

// ==================== COMPOSANT PLACEMENT ====================

interface PlacementItemProps extends BaseItemProps {
  placement: Placement;
  index: number;
  sectionId: string;
  tactiqueId: string;
  creatifs: Creatif[];
  expandedPlacements: {[placementId: string]: boolean};
  hoveredPlacement: {sectionId: string, tactiqueId: string, placementId: string} | null;
  hoveredCreatif: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null;
  onHoverPlacement: (hover: {sectionId: string, tactiqueId: string, placementId: string} | null) => void;
  onHoverCreatif: (hover: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null) => void;
  onExpand: (placementId: string) => void;
  onEdit: (tactiqueId: string, placement: Placement) => void;
  onDelete?: (placementId: string) => void;
  onCreateCreatif?: (placementId: string) => void;
  onEditCreatif: (placementId: string, creatif: Creatif) => void;
  onDeleteCreatif?: (creatifId: string) => void;
}

export const PlacementItem: React.FC<PlacementItemProps> = ({
  placement,
  index,
  sectionId,
  tactiqueId,
  creatifs,
  expandedPlacements,
  hoveredPlacement,
  hoveredCreatif,
  onHoverPlacement,
  onHoverCreatif,
  onExpand,
  onEdit,
  onDelete,
  onCreateCreatif,
  onEditCreatif,
  onDeleteCreatif,
  onSelect
}) => {
  const isExpanded = expandedPlacements[placement.id];
  const isHovered = hoveredPlacement?.placementId === placement.id;

  // Déterminer si tous les créatifs sont sélectionnés
  const allCreatifsSelected = creatifs.length > 0 && creatifs.every(c => c.isSelected);

  return (
    <Draggable
      key={`placement-${placement.id}`}
      draggableId={`placement-${placement.id}`}
      index={index}
    >
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`border-b border-gray-200 last:border-b-0 ${
            snapshot.isDragging ? 'bg-white shadow-lg rounded' : ''
          } ${placement.isSelected ? 'bg-indigo-50' : ''}`}
          onMouseEnter={() => onHoverPlacement({sectionId, tactiqueId, placementId: placement.id})}
          onMouseLeave={() => onHoverPlacement(null)}
        >
          <div 
            className="flex justify-between items-center px-4 py-2 cursor-pointer"
            onClick={() => onExpand(placement.id)}
          >
            <div className="flex items-center">
              {/* Checkbox pour le placement */}
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
                checked={placement.isSelected || false}
                // Si tous les créatifs sont sélectionnés, la checkbox du parent doit l'être aussi
                // Sinon, si le parent est sélectionné mais pas tous les enfants, c'est un état intermédiaire
                onChange={(e) => onSelect(placement.id, 'placement', e.target.checked)}
                onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic
              />
              <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                <Bars3Icon className="h-3 w-3 text-gray-400" />
              </span>
              
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3 text-gray-500 mr-2" />
              ) : (
                <ChevronRightIcon className="h-3 w-3 text-gray-500 mr-2" />
              )}
              
              <div className="text-xs text-gray-700">
                📋 {placement.PL_Label}
              </div>
              
              {creatifs.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {creatifs.length} créatif{creatifs.length > 1 ? 's' : ''}
                </span>
              )}
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateCreatif?.(placement.id);
                }} 
                className={`ml-2 p-1 rounded hover:bg-gray-200 ${
                  isHovered ? 'text-indigo-600' : 'text-indigo-400'
                }`}
                title="Ajouter un créatif"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {isHovered && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(tactiqueId, placement);
                    }}
                    className="p-1 rounded hover:bg-gray-200"
                    title="Modifier le placement"
                  >
                    <PencilIcon className="h-3 w-3 text-gray-400" />
                  </button>
                  {onDelete && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(placement.id);
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
          {isExpanded && (
            <div className="pl-8 bg-white py-1">
              {creatifs.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500 italic">
                  Aucun créatif pour ce placement
                </div>
              ) : (
                <Droppable droppableId={`creatifs-${placement.id}`} type="CREATIF">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {creatifs.map((creatif, creatifIndex) => (
                        <CreatifItem
                          key={creatif.id}
                          creatif={creatif}
                          index={creatifIndex}
                          sectionId={sectionId}
                          tactiqueId={tactiqueId}
                          placementId={placement.id}
                          hoveredCreatif={hoveredCreatif}
                          onHover={onHoverCreatif}
                          onEdit={onEditCreatif}
                          onDelete={onDeleteCreatif}
                          formatCurrency={() => ''}
                          onSelect={onSelect}
                        />
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
};

// ==================== COMPOSANT TACTIQUE ====================

interface TactiqueItemProps extends BaseItemProps {
  tactique: Tactique;
  index: number;
  sectionId: string;
  placements: Placement[];
  creatifs: { [placementId: string]: Creatif[] };
  expandedTactiques: {[tactiqueId: string]: boolean};
  expandedPlacements: {[placementId: string]: boolean};
  hoveredTactique: {sectionId: string, tactiqueId: string} | null;
  hoveredPlacement: {sectionId: string, tactiqueId: string, placementId: string} | null;
  hoveredCreatif: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null;
  onHoverTactique: (hover: {sectionId: string, tactiqueId: string} | null) => void;
  onHoverPlacement: (hover: {sectionId: string, tactiqueId: string, placementId: string} | null) => void;
  onHoverCreatif: (hover: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null) => void;
  onExpandTactique: (tactiqueId: string) => void;
  onExpandPlacement: (placementId: string) => void;
  onEdit: (sectionId: string, tactique: Tactique) => void;
  onDelete?: (sectionId: string, tactiqueId: string) => void;
  onCreatePlacement?: (tactiqueId: string) => void;
  onEditPlacement: (tactiqueId: string, placement: Placement) => void;
  onDeletePlacement?: (placementId: string) => void;
  onCreateCreatif?: (placementId: string) => void;
  onEditCreatif: (placementId: string, creatif: Creatif) => void;
  onDeleteCreatif?: (creatifId: string) => void;
}

export const TactiqueItem: React.FC<TactiqueItemProps> = ({
  tactique,
  index,
  sectionId,
  placements,
  creatifs,
  expandedTactiques,
  expandedPlacements,
  hoveredTactique,
  hoveredPlacement,
  hoveredCreatif,
  onHoverTactique,
  onHoverPlacement,
  onHoverCreatif,
  onExpandTactique,
  onExpandPlacement,
  onEdit,
  onDelete,
  onCreatePlacement,
  onEditPlacement,
  onDeletePlacement,
  onCreateCreatif,
  onEditCreatif,
  onDeleteCreatif,
  formatCurrency,
  onSelect
}) => {
  const isExpanded = expandedTactiques[tactique.id];
  const isHovered = hoveredTactique?.tactiqueId === tactique.id && hoveredTactique?.sectionId === sectionId;

  // Déterminer si tous les placements sont sélectionnés
  const allPlacementsSelected = placements.length > 0 && placements.every(p => p.isSelected);

  return (
    <Draggable
      key={`tactique-${tactique.id}`}
      draggableId={`tactique-${tactique.id}`}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`border-b border-gray-100 last:border-b-0 pl-8 ${
            snapshot.isDragging ? 'bg-white shadow-lg rounded' : ''
          } ${tactique.isSelected ? 'bg-indigo-50' : ''}`}
          onMouseEnter={() => onHoverTactique({sectionId, tactiqueId: tactique.id})}
          onMouseLeave={() => onHoverTactique(null)}
        >
          <div 
            className="flex justify-between items-center px-4 py-3 cursor-pointer"
            onClick={() => onExpandTactique(tactique.id)}
          >
            <div className="flex items-center">
              {/* Checkbox pour la tactique */}
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
                checked={tactique.isSelected || false}
                // Si tous les placements sont sélectionnés, la checkbox du parent doit l'être aussi
                // Sinon, si le parent est sélectionné mais pas tous les enfants, c'est un état intermédiaire
                onChange={(e) => onSelect(tactique.id, 'tactique', e.target.checked)}
                onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic
              />
              <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                <Bars3Icon className="h-4 w-4 text-gray-400" />
              </span>
              
              {isExpanded ? (
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
                  onCreatePlacement?.(tactique.id);
                }} 
                className={`ml-2 p-1 rounded hover:bg-gray-200 ${
                  isHovered ? 'text-indigo-600' : 'text-indigo-400'
                }`}
                title="Ajouter un placement"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {isHovered && (
                <div className="flex space-x-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(sectionId, tactique);
                    }} 
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    <PencilIcon className="h-4 w-4 text-gray-500" />
                  </button>
                  {onDelete && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(sectionId, tactique.id);
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
          {isExpanded && (
            <div className="pl-8 pb-2 bg-gray-100">
              {placements.length === 0 ? (
                <div className="px-4 py-2 text-xs text-gray-500 italic">
                  Aucun placement dans cette tactique
                </div>
              ) : (
                <Droppable droppableId={`placements-${tactique.id}`} type="PLACEMENT">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {placements.map((placement, placementIndex) => (
                        <PlacementItem
                          key={placement.id}
                          placement={placement}
                          index={placementIndex}
                          sectionId={sectionId}
                          tactiqueId={tactique.id}
                          creatifs={creatifs[placement.id] || []}
                          expandedPlacements={expandedPlacements}
                          hoveredPlacement={hoveredPlacement}
                          hoveredCreatif={hoveredCreatif}
                          onHoverPlacement={onHoverPlacement}
                          onHoverCreatif={onHoverCreatif}
                          onExpand={onExpandPlacement}
                          onEdit={onEditPlacement}
                          onDelete={onDeletePlacement}
                          onCreateCreatif={onCreateCreatif}
                          onEditCreatif={onEditCreatif}
                          onDeleteCreatif={onDeleteCreatif}
                          formatCurrency={formatCurrency}
                          onSelect={onSelect}
                        />
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
};