// app/components/Tactiques/Views/Hierarchy/PreciseDropIndicators.tsx

/**
 * Indicateurs de drop précis qui montrent exactement où l'élément va s'insérer
 */
'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DropZoneIndicatorProps {
  id: string;
  position: 'before' | 'after';
  className?: string;
  children?: React.ReactNode;
}

export const DropZoneIndicator: React.FC<DropZoneIndicatorProps> = ({
  id,
  position,
  className = '',
  children
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `${id}-${position}`
  });

  return (
    <div ref={setNodeRef} className={`relative ${className}`}>
      {/* Ligne d'insertion visible quand on survole */}
      {isOver && (
        <div
          className={`absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-lg z-10 transition-all duration-200 ${
            position === 'before' ? '-top-1' : '-bottom-1'
          }`}
          style={{
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
          }}
        >
          {/* Points aux extrémités */}
          <div className="absolute -left-1 -top-1 w-2 h-2 bg-indigo-500 rounded-full"></div>
          <div className="absolute -right-1 -top-1 w-2 h-2 bg-indigo-500 rounded-full"></div>
        </div>
      )}
      {children}
    </div>
  );
};

interface SortableItemWrapperProps {
  id: string;
  index: number;
  totalItems: number;
  children: React.ReactNode;
  type: 'tactique' | 'placement' | 'creatif';
}

export const SortableItemWrapper: React.FC<SortableItemWrapperProps> = ({
  id,
  index,
  totalItems,
  children,
  type
}) => {
  return (
    <div className="relative">
      {/* Zone de drop AVANT l'élément */}
      <DropZoneIndicator
        id={id}
        position="before"
        className="h-2 -mb-2"
      />
      
      {/* L'élément lui-même */}
      <div className="relative z-0">
        {children}
      </div>
      
      {/* Zone de drop APRÈS l'élément (seulement pour le dernier élément) */}
      {index === totalItems - 1 && (
        <DropZoneIndicator
          id={id}
          position="after"
          className="h-2 -mt-2"
        />
      )}
    </div>
  );
};