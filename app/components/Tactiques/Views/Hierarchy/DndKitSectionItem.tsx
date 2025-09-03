// app/components/Tactiques/Views/Hierarchy/DndKitSectionItem.tsx

/**
 * ✅ NOUVEAU : Composant Section avec zone de drop pour tactiques
 * Permet de déplacer des tactiques d'une section vers une autre
 */
'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  PencilIcon,
  PlusIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { SectionWithTactiques } from '../../../../types/tactiques';
import { useTranslation } from '../../../../contexts/LanguageContext';

interface DndKitSectionItemProps {
  section: SectionWithTactiques;
  sectionIndex: number;
  children: React.ReactNode;
  hoveredSection: string | null;
  copiedId?: string | null;
  totalBudget: number;
  formatCurrency: (amount: number) => string;
  onSectionExpand: (sectionId: string) => void;
  onEditSection?: (sectionId: string) => void;
  onCreateTactique: (sectionId: string) => void;
  onCopyId: (id: string, type: string) => void;
  onMoveSectionUp: (sectionId: string, currentIndex: number) => void;
  onSectionSelect: (sectionId: string, isSelected: boolean) => void;
  onHoverSection: (sectionId: string | null) => void;
  isSelected: boolean;
}

export const DndKitSectionItem: React.FC<DndKitSectionItemProps> = ({
  section,
  sectionIndex,
  children,
  hoveredSection,
  copiedId,
  totalBudget,
  formatCurrency,
  onSectionExpand,
  onEditSection,
  onCreateTactique,
  onCopyId,
  onMoveSectionUp,
  onSectionSelect,
  onHoverSection,
  isSelected
}) => {
  const { t } = useTranslation();

  // ✅ NOUVEAU : Droppable pour accepter des tactiques
  const {
    setNodeRef,
    isOver
  } = useDroppable({
    id: `section-${section.id}`,
    data: {
      type: 'section',
      accepts: ['tactique'], // ✅ Accepte les tactiques
      sectionId: section.id
    }
  });

  const calculatePercentage = (amount: number) => {
    if (totalBudget <= 0) return 0;
    return Math.round((amount / totalBudget) * 100);
  };

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => onHoverSection(section.id)}
      onMouseLeave={() => onHoverSection(null)}
      className={`${
        isOver ? 'bg-green-50 ring-2 ring-green-300' : '' // ✅ Style de survol pour drop
      }`}
    >
      {/* Section header */}
      <div className="relative">
        <div
          className={`flex justify-between items-center px-4 py-3 bg-white hover:bg-gray-50 transition-colors ${
            section.isExpanded ? 'bg-gray-50' : ''
          } ${isSelected ? 'bg-indigo-50' : ''}`}
          style={{ borderLeft: `4px solid ${section.SECTION_Color || '#6366f1'}` }}
        >
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
              checked={isSelected}
              onChange={(e) => onSectionSelect(section.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveSectionUp(section.id, sectionIndex);
              }}
              disabled={sectionIndex === 0}
              className={`pr-2 p-2 rounded transition-colors ${
                sectionIndex === 0 
                  ? 'cursor-not-allowed text-gray-300' 
                  : 'cursor-pointer text-gray-400 hover:text-gray-600 hover:bg-gray-200'
              }`}
              title={sectionIndex === 0 ? t('tactiquesHierarchyView.section.alreadyFirst') : t('tactiquesHierarchyView.section.moveUp')}
            >
              <ArrowUpIcon className="h-4 w-4" />
            </button>

            <div 
              className="section-expand-area flex items-center cursor-pointer"
              onClick={() => onSectionExpand(section.id)}
            >
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
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateTactique(section.id);
              }}
              className={`ml-2 p-1 rounded hover:bg-gray-200 transition-colors ${
                hoveredSection === section.id ? 'text-indigo-600' : 'text-indigo-400'
              }`}
              title={t('tactiquesHierarchyView.section.addTactique')}
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative min-w-[48px] h-6">
              {hoveredSection === section.id && (
                <div className="absolute right-0 top-0 flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyId(section.id, 'section');
                    }}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    title={copiedId === section.id ? t('tactiquesHierarchyView.common.idCopied') : t('tactiquesHierarchyView.common.copyId')}
                  >
                    <KeyIcon className={`h-3 w-3 ${copiedId === section.id ? 'text-green-500' : 'text-gray-300'}`} />
                  </button>
                  {onEditSection && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSection(section.id);
                      }}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      title={t('tactiquesHierarchyView.section.edit')}
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
                {calculatePercentage(section.SECTION_Budget || 0)}% {t('tactiquesHierarchyView.section.ofBudget')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu des tactiques (passé en children) */}
      {section.isExpanded && children}
    </div>
  );
};