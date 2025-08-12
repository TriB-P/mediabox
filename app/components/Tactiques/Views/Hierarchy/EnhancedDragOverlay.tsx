// app/components/Tactiques/Views/Hierarchy/EnhancedDragOverlay.tsx

/**
 * DragOverlay amélioré avec labels lisibles et indicateurs visuels
 */
'use client';

import React from 'react';
import { 
  Bars3Icon,
  SwatchIcon,
  RectangleStackIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { SectionWithTactiques, Tactique, Placement, Creatif } from '../../../../types/tactiques';

interface EnhancedDragOverlayProps {
  activeId: string | null;
  sections: SectionWithTactiques[];
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
}

interface DraggedItem {
  type: 'section' | 'tactique' | 'placement' | 'creatif';
  label: string;
  icon: React.ReactNode;
  color: string;
}

export const EnhancedDragOverlay: React.FC<EnhancedDragOverlayProps> = ({
  activeId,
  sections,
  placements,
  creatifs
}) => {
  if (!activeId) return null;

  const getDraggedItem = (): DraggedItem | null => {
    if (activeId.startsWith('section-')) {
      const sectionId = activeId.replace('section-', '');
      const section = sections.find(s => s.id === sectionId);
      if (section) {
        return {
          type: 'section',
          label: section.SECTION_Name,
          icon: <SwatchIcon className="h-5 w-5" />,
          color: section.SECTION_Color || '#6366f1'
        };
      }
    }

    if (activeId.startsWith('tactique-')) {
      const tactiqueId = activeId.replace('tactique-', '');
      for (const section of sections) {
        const tactique = section.tactiques.find(t => t.id === tactiqueId);
        if (tactique) {
          return {
            type: 'tactique',
            label: tactique.TC_Label,
            icon: <RectangleStackIcon className="h-5 w-5" />,
            color: '#059669' // green-600
          };
        }
      }
    }

    if (activeId.startsWith('placement-')) {
      const placementId = activeId.replace('placement-', '');
      for (const [tactiqueId, tactiquePlacements] of Object.entries(placements)) {
        const placement = tactiquePlacements.find(p => p.id === placementId);
        if (placement) {
          return {
            type: 'placement',
            label: placement.PL_Label,
            icon: <RectangleStackIcon className="h-5 w-5" />,
            color: '#dc2626' // red-600
          };
        }
      }
    }

    if (activeId.startsWith('creatif-')) {
      const creatifId = activeId.replace('creatif-', '');
      for (const [placementId, placementCreatifs] of Object.entries(creatifs)) {
        const creatif = placementCreatifs.find(c => c.id === creatifId);
        if (creatif) {
          return {
            type: 'creatif',
            label: creatif.CR_Label,
            icon: <PhotoIcon className="h-5 w-5" />,
            color: '#7c3aed' // violet-600
          };
        }
      }
    }

    return null;
  };

  const draggedItem = getDraggedItem();
  if (!draggedItem) return null;

  const typeLabels = {
    section: 'Section',
    tactique: 'Tactique',
    placement: 'Placement',
    creatif: 'Créatif'
  };

  return (
    <div className="bg-white shadow-2xl rounded-lg border-2 border-dashed border-indigo-400 p-3 max-w-xs">
      <div className="flex items-center space-x-3">
        {/* Icône de drag */}
        <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
          <Bars3Icon className="h-4 w-4 text-gray-500" />
        </div>
        
        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <div 
              className="flex items-center justify-center w-6 h-6 rounded"
              style={{ backgroundColor: draggedItem.color + '20', color: draggedItem.color }}
            >
              {draggedItem.icon}
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {typeLabels[draggedItem.type]}
            </span>
          </div>
          <div className="mt-1 text-sm font-semibold text-gray-900 truncate">
            {draggedItem.label}
          </div>
        </div>
      </div>
      

    </div>
  );
};

// Composant pour les indicateurs de drop zone
interface DropIndicatorProps {
  isActive: boolean;
  position: 'top' | 'bottom';
  type: 'section' | 'tactique' | 'placement' | 'creatif';
}

export const DropIndicator: React.FC<DropIndicatorProps> = ({
  isActive,
  position,
  type
}) => {
  if (!isActive) return null;

  const colors = {
    section: 'border-blue-400 bg-blue-50',
    tactique: 'border-green-400 bg-green-50',
    placement: 'border-red-400 bg-red-50',
    creatif: 'border-purple-400 bg-purple-50'
  };

  return (
    <div 
      className={`h-1 rounded-full border-2 border-dashed transition-all duration-200 ${colors[type]} ${
        position === 'top' ? 'mb-1' : 'mt-1'
      }`}
      style={{ 
        transform: 'scaleY(2)',
        boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)'
      }}
    />
  );
};