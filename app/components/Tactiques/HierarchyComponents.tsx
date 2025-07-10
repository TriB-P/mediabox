// app/components/Tactiques/HierarchyComponents.tsx - VERSION ALLÉGÉE VISUELLEMENT

'use client';

import React, { useState, useEffect } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PencilIcon, 
  PlusIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { Tactique, Placement, Creatif } from '../../types/tactiques';
import { usePartners } from '../../contexts/PartnerContext';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// ==================== INTERFACE COMMUNE ====================

interface BaseItemProps {
  formatCurrency: (amount: number) => string;
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
  onSelectCreatif: (creatifId: string, isSelected: boolean) => void;
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
  onSelectCreatif
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
            <input
              type="checkbox"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
              checked={creatif.isSelected || false}
              onChange={(e) => onSelectCreatif(creatif.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
              <Bars3Icon className="h-3 w-3 text-gray-300" />
            </span>
            <div className="text-xs text-gray-600">
              {creatif.CR_Label}
            </div>
            {creatif.CR_Version && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                v{creatif.CR_Version}
              </span>
            )}
          </div>
          
          {/* Actions fixes - positionnement absolu pour éviter le décalage */}
          <div className="relative min-w-[24px] h-6">
            {isHovered && (
              <div className="absolute right-0 top-0 flex items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(placementId, creatif);
                  }}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Modifier le créatif"
                >
                  <PencilIcon className="h-3 w-3 text-gray-400" />
                </button>
              </div>
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
  onCreateCreatif?: (placementId: string) => void;
  onEditCreatif: (placementId: string, creatif: Creatif) => void;
  onSelectPlacement: (placementId: string, isSelected: boolean) => void;
  onSelectCreatif: (creatifId: string, isSelected: boolean) => void;
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
  onCreateCreatif,
  onEditCreatif,
  onSelectPlacement,
  onSelectCreatif
}) => {
  const isExpanded = expandedPlacements[placement.id];
  const isHovered = hoveredPlacement?.placementId === placement.id;

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
            className="flex justify-between items-center px-4 py-2 cursor-pointer bg-white"
            onClick={() => onExpand(placement.id)}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
                checked={placement.isSelected || false}
                onChange={(e) => onSelectPlacement(placement.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                <Bars3Icon className="h-3 w-3 text-gray-400" />
              </span>
              
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3 text-gray-500 mr-2" />
              ) : (
                <ChevronRightIcon className="h-3 w-3 text-gray-500 mr-2" />
              )}
              
              <div className="text-xs text-gray-700 font-medium">
                 {placement.PL_Label}
              </div>
              
              {/* Badge créatifs plus discret */}
              {creatifs.length > 0 && (
                <span className="ml-5 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                {creatifs.length}
                </span>
              )}
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateCreatif?.(placement.id);
                }} 
                className={`ml-2 p-1 rounded hover:bg-gray-200 transition-colors ${
                  isHovered ? 'text-indigo-600' : 'text-indigo-400'
                }`}
                title="Ajouter un créatif"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
            </div>
            
            {/* Actions fixes */}
            <div className="relative min-w-[24px] h-6">
              {isHovered && (
                <div className="absolute right-0 top-0 flex items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(tactiqueId, placement);
                    }}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    title="Modifier le placement"
                  >
                    <PencilIcon className="h-3 w-3 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Créatifs - fond blanc uniforme */}
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
                          formatCurrency={() => ''}
                          onSelectCreatif={onSelectCreatif}
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

// ==================== COMPOSANT TACTIQUE AVEC LOGO PARTENAIRE ====================

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
  onCreatePlacement?: (tactiqueId: string) => void;
  onEditPlacement: (tactiqueId: string, placement: Placement) => void;
  onCreateCreatif?: (placementId: string) => void;
  onEditCreatif: (placementId: string, creatif: Creatif) => void;
  onSelect: (tactiqueId: string, isSelected: boolean) => void;
  onSelectPlacement: (placementId: string, isSelected: boolean) => void;
  onSelectCreatif: (creatifId: string, isSelected: boolean) => void;
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
  onCreatePlacement,
  onEditPlacement,
  onCreateCreatif,
  onEditCreatif,
  formatCurrency,
  onSelect,
  onSelectPlacement,
  onSelectCreatif
}) => {
  const isExpanded = expandedTactiques[tactique.id];
  const isHovered = hoveredTactique?.tactiqueId === tactique.id && hoveredTactique?.sectionId === sectionId;
  
  // Hook pour récupérer les données partenaires
  const { partners } = usePartners();
  
  // États pour le logo du partenaire
  const [partnerImageUrl, setPartnerImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Charger l'image du partenaire
  useEffect(() => {
    const loadPartnerImage = async () => {
      if (!tactique.TC_Publisher) return;
      
      // Trouver le partenaire correspondant
      const partner = partners.find(p => p.id === tactique.TC_Publisher);
      if (!partner?.SH_Logo) return;
      
      setImageLoading(true);
      setImageError(false);
      
      try {
        const storage = getStorage();
        
        if (partner.SH_Logo.startsWith('gs://')) {
          const storageRef = ref(storage, partner.SH_Logo);
          const url = await getDownloadURL(storageRef);
          setPartnerImageUrl(url);
        } else {
          setPartnerImageUrl(partner.SH_Logo);
        }
      } catch (error) {
        console.error('Erreur chargement logo partenaire:', error);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };
    
    loadPartnerImage();
  }, [tactique.TC_Publisher, partners]);

  // Calculer le nombre total de créatifs
  const totalCreatifs = placements.reduce((total, placement) => {
    return total + (creatifs[placement.id]?.length || 0);
  }, 0);

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
            className="flex justify-between items-center px-4 py-3 cursor-pointer bg-white"
            onClick={() => onExpandTactique(tactique.id)}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
                checked={tactique.isSelected || false}
                onChange={(e) => onSelect(tactique.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                <Bars3Icon className="h-4 w-4 text-gray-400" />
              </span>
              
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
              )}
              
              {/* Logo partenaire - carré plus gros */}
              <div className="flex items-center mr-3">
                {imageLoading ? (
                  <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                ) : partnerImageUrl && !imageError ? (
                  <img
                    src={partnerImageUrl}
                    alt="Logo partenaire"
                    className="w-10 h-10 object-contain rounded"
                    onError={() => setImageError(true)}
                  />
                ) : tactique.TC_Publisher ? (
                  <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-sm text-gray-600 font-semibold">
                    {partners.find(p => p.id === tactique.TC_Publisher)?.SH_Display_Name_FR?.charAt(0) || '?'}
                  </div>
                ) : null}
              </div>
              
              <div className="text-sm text-gray-800 font-medium">
                {tactique.TC_Label}
              </div>
              
              {/* Badge placements seulement - niveau en dessous */}
              {placements.length > 0 && (
                <span className="ml-5 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                  {placements.length}
                </span>
              )}
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onCreatePlacement?.(tactique.id);
                }} 
                className={`ml-2 p-1 rounded hover:bg-gray-200 transition-colors ${
                  isHovered ? 'text-indigo-600' : 'text-indigo-400'
                }`}
                title="Ajouter un placement"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Actions fixes */}
              <div className="relative min-w-[24px] h-6">
                {isHovered && (
                  <div className="absolute right-0 top-0 flex items-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(sectionId, tactique);
                      }} 
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      title="Modifier la tactique"
                    >
                      <PencilIcon className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="text-sm font-medium">
                {formatCurrency(tactique.TC_Budget)}
              </div>
            </div>
          </div>
          
          {/* Placements - fond blanc uniforme */}
          {isExpanded && (
            <div className="pl-8 pb-2 bg-white">
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
                          onCreateCreatif={onCreateCreatif}
                          onEditCreatif={onEditCreatif}
                          formatCurrency={formatCurrency}
                          onSelectPlacement={onSelectPlacement}
                          onSelectCreatif={onSelectCreatif}
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