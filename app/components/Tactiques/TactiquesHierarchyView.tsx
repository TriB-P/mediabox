// app/components/Tactiques/TactiquesHierarchyView.tsx - AVEC CRÉATIFS INTÉGRÉS

'use client';

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { SectionWithTactiques, Tactique, Placement, Creatif } from '../../types/tactiques';
import PlacementDrawer from './Placement/PlacementDrawer';
import CreatifDrawer from './Creatif/CreatifDrawer';
import TactiqueDrawer from './Tactiques/TactiqueDrawer';

// 🔥 NOUVEAU : Interface avec créatifs
interface CreatifsByPlacement {
  [placementId: string]: Creatif[];
}

interface TactiquesHierarchyViewProps {
  sections: SectionWithTactiques[];
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: CreatifsByPlacement; // 🔥 NOUVEAU : Créatifs par placement
  onSectionExpand: (sectionId: string) => void;
  onDragEnd: (result: any) => void;
  onEditSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onCreateTactique: (sectionId: string) => Promise<Tactique>;
  onUpdateTactique: (sectionId: string, tactiqueId: string, updates: Partial<Tactique>) => Promise<void>;
  onDeleteTactique: (sectionId: string, tactiqueId: string) => Promise<void>;
  onCreatePlacement: (tactiqueId: string) => Promise<Placement>;
  onUpdatePlacement: (placementId: string, updates: Partial<Placement>) => Promise<void>;
  onDeletePlacement: (placementId: string) => Promise<void>;
  // 🔥 NOUVEAU : Actions créatifs réelles
  onCreateCreatif: (placementId: string) => Promise<Creatif>;
  onUpdateCreatif: (creatifId: string, updates: Partial<Creatif>) => Promise<void>;
  onDeleteCreatif: (creatifId: string) => Promise<void>;
  formatCurrency: (amount: number) => string;
  totalBudget: number;
}

export default function TactiquesHierarchyView({
  sections,
  placements,
  creatifs,
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
  
  // États pour les drawers
  const [tactiqueDrawer, setTactiqueDrawer] = useState<{
    isOpen: boolean;
    tactique: Tactique | null;
    sectionId: string | null;
  }>({
    isOpen: false,
    tactique: null,
    sectionId: null
  });

  const [placementDrawer, setPlacementDrawer] = useState<{
    isOpen: boolean;
    placement: Placement | null;
    tactiqueId: string | null;
    tactiqueData: Tactique | null;
  }>({
    isOpen: false,
    placement: null,
    tactiqueId: null,
    tactiqueData: null
  });

  // 🔥 NOUVEAU : État pour le drawer créatif
  const [creatifDrawer, setCreatifDrawer] = useState<{
    isOpen: boolean;
    creatif: Creatif | null;
    placementId: string | null;
    placementData: Placement | null;
    tactiqueData: Tactique | null;
  }>({
    isOpen: false,
    creatif: null,
    placementId: null,
    placementData: null,
    tactiqueData: null
  });

  // États pour l'expansion des éléments
  const [expandedTactiques, setExpandedTactiques] = useState<Set<string>>(new Set());
  const [expandedPlacements, setExpandedPlacements] = useState<Set<string>>(new Set());

  // Gestion de l'expansion des tactiques
  const toggleTactiqueExpansion = useCallback((tactiqueId: string) => {
    setExpandedTactiques(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tactiqueId)) {
        newSet.delete(tactiqueId);
      } else {
        newSet.add(tactiqueId);
      }
      return newSet;
    });
  }, []);

  // Gestion de l'expansion des placements
  const togglePlacementExpansion = useCallback((placementId: string) => {
    setExpandedPlacements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placementId)) {
        newSet.delete(placementId);
      } else {
        newSet.add(placementId);
      }
      return newSet;
    });
  }, []);

  // Gestionnaires pour les tactiques
  const handleEditTactique = useCallback((tactique: Tactique, sectionId: string) => {
    setTactiqueDrawer({
      isOpen: true,
      tactique,
      sectionId
    });
  }, []);

  const handleSaveTactique = useCallback(async (tactiqueData: Partial<Tactique>) => {
    if (!tactiqueDrawer.sectionId) return;
    
    try {
      if (tactiqueDrawer.tactique) {
        await onUpdateTactique(tactiqueDrawer.sectionId, tactiqueDrawer.tactique.id, tactiqueData);
      } else {
        await onCreateTactique(tactiqueDrawer.sectionId);
      }
      setTactiqueDrawer({ isOpen: false, tactique: null, sectionId: null });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tactique:', error);
    }
  }, [tactiqueDrawer, onUpdateTactique, onCreateTactique]);

  // Gestionnaires pour les placements
  const handleEditPlacement = useCallback((placement: Placement, tactiqueId: string, tactiqueData: Tactique) => {
    setPlacementDrawer({
      isOpen: true,
      placement,
      tactiqueId,
      tactiqueData
    });
  }, []);

  const handleSavePlacement = useCallback(async (placementData: any) => {
    if (!placementDrawer.tactiqueId) return;
    
    try {
      if (placementDrawer.placement) {
        await onUpdatePlacement(placementDrawer.placement.id, placementData);
      } else {
        await onCreatePlacement(placementDrawer.tactiqueId);
      }
      setPlacementDrawer({ isOpen: false, placement: null, tactiqueId: null, tactiqueData: null });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du placement:', error);
    }
  }, [placementDrawer, onUpdatePlacement, onCreatePlacement]);

  // 🔥 NOUVEAUX : Gestionnaires pour les créatifs
  const handleEditCreatif = useCallback((creatif: Creatif, placementId: string, placementData: Placement, tactiqueData: Tactique) => {
    setCreatifDrawer({
      isOpen: true,
      creatif,
      placementId,
      placementData,
      tactiqueData
    });
  }, []);

  const handleCreateCreatif = useCallback(async (placementId: string, placementData: Placement, tactiqueData: Tactique) => {
    setCreatifDrawer({
      isOpen: true,
      creatif: null,
      placementId,
      placementData,
      tactiqueData
    });
  }, []);

  const handleSaveCreatif = useCallback(async (creatifData: any) => {
    if (!creatifDrawer.placementId) return;
    
    try {
      if (creatifDrawer.creatif) {
        await onUpdateCreatif(creatifDrawer.creatif.id, creatifData);
      } else {
        await onCreateCreatif(creatifDrawer.placementId);
      }
      setCreatifDrawer({ isOpen: false, creatif: null, placementId: null, placementData: null, tactiqueData: null });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du créatif:', error);
    }
  }, [creatifDrawer, onUpdateCreatif, onCreateCreatif]);

  // 🔥 NOUVEAU : Rendu des créatifs
  const renderCreatifs = (placementId: string, placementData: Placement, tactiqueData: Tactique) => {
    const placementCreatifs = creatifs[placementId] || [];
    
    if (placementCreatifs.length === 0) {
      return (
        <div className="ml-16 mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Aucun créatif</span>
            <button
              onClick={() => handleCreateCreatif(placementId, placementData, tactiqueData)}
              className="flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Créatif
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="ml-16 mt-2 space-y-2">
        {placementCreatifs.map((creatif) => (
          <div key={creatif.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <PhotoIcon className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-gray-900">{creatif.CR_Label}</div>
                <div className="text-sm text-gray-500">
                  {creatif.CR_Format_Details && (
                    <span className="mr-3">Format: {creatif.CR_Format_Details}</span>
                  )}
                  {creatif.CR_Version && (
                    <span>Version: {creatif.CR_Version}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEditCreatif(creatif, placementId, placementData, tactiqueData)}
                className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                title="Modifier le créatif"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteCreatif(creatif.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Supprimer le créatif"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        
        {/* Bouton pour ajouter un créatif */}
        <div className="flex justify-center">
          <button
            onClick={() => handleCreateCreatif(placementId, placementData, tactiqueData)}
            className="flex items-center px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Nouveau créatif
          </button>
        </div>
      </div>
    );
  };

  // Rendu des placements
  const renderPlacements = (tactiqueId: string, tactiqueData: Tactique) => {
    const tactiquePlacements = placements[tactiqueId] || [];
    
    if (tactiquePlacements.length === 0) {
      return (
        <div className="ml-12 mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Aucun placement</span>
            <button
              onClick={() => onCreatePlacement(tactiqueId)}
              className="flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Placement
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="ml-12 mt-2 space-y-2">
        {tactiquePlacements.map((placement) => {
          const isExpanded = expandedPlacements.has(placement.id);
          const placementCreatifs = creatifs[placement.id] || [];
          
          return (
            <div key={placement.id} className="bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => togglePlacementExpansion(placement.id)}
                    className="p-1 hover:bg-purple-100 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-purple-600" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-purple-600" />
                    )}
                  </button>
                  <DocumentIcon className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">{placement.PL_Label}</div>
                    <div className="text-sm text-gray-500">
                      {placementCreatifs.length} créatif{placementCreatifs.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditPlacement(placement, tactiqueId, tactiqueData)}
                    className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                    title="Modifier le placement"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeletePlacement(placement.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer le placement"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* 🔥 NOUVEAU : Affichage des créatifs quand expanded */}
              {isExpanded && renderCreatifs(placement.id, placement, tactiqueData)}
            </div>
          );
        })}
        
        {/* Bouton pour ajouter un placement */}
        <div className="flex justify-center">
          <button
            onClick={() => onCreatePlacement(tactiqueId)}
            className="flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Nouveau placement
          </button>
        </div>
      </div>
    );
  };

  // Rendu des tactiques
  const renderTactiques = (section: SectionWithTactiques) => {
    if (section.tactiques.length === 0) {
      return (
        <div className="ml-8 mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Aucune tactique</span>
            <button
              onClick={() => onCreateTactique(section.id)}
              className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Tactique
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="ml-8 mt-2 space-y-2">
        {section.tactiques.map((tactique) => {
          const isExpanded = expandedTactiques.has(tactique.id);
          const tactiquePlacements = placements[tactique.id] || [];
          const totalCreatifs = tactiquePlacements.reduce((sum, placement) => {
            return sum + (creatifs[placement.id] || []).length;
          }, 0);
          
          return (
            <div key={tactique.id} className="bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleTactiqueExpansion(tactique.id)}
                    className="p-1 hover:bg-green-100 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-green-600" />
                    )}
                  </button>
                  <div>
                    <div className="font-medium text-gray-900">{tactique.TC_Label}</div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(tactique.TC_Budget)} • {tactiquePlacements.length} placement{tactiquePlacements.length !== 1 ? 's' : ''} • {totalCreatifs} créatif{totalCreatifs !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditTactique(tactique, section.id)}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    title="Modifier la tactique"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteTactique(section.id, tactique.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer la tactique"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Affichage des placements quand expanded */}
              {isExpanded && renderPlacements(tactique.id, tactique)}
            </div>
          );
        })}
        
        {/* Bouton pour ajouter une tactique */}
        <div className="flex justify-center">
          <button
            onClick={() => onCreateTactique(section.id)}
            className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Nouvelle tactique
          </button>
        </div>
      </div>
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              style={{ backgroundColor: section.SECTION_Color ? `${section.SECTION_Color}20` : undefined }}
              onClick={() => onSectionExpand(section.id)}
            >
              <div className="flex items-center space-x-3">
                {section.isExpanded ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{section.SECTION_Name}</h3>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(section.SECTION_Budget || 0)} • {section.tactiques.length} tactique{section.tactiques.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSection(section.id);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Modifier la section"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSection(section.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Supprimer la section"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Contenu de la section */}
            {section.isExpanded && (
              <div className="border-t border-gray-200 p-4">
                {renderTactiques(section)}
              </div>
            )}
          </div>
        ))}
        
        {/* Drawers */}
        <TactiqueDrawer
          isOpen={tactiqueDrawer.isOpen}
          onClose={() => setTactiqueDrawer({ isOpen: false, tactique: null, sectionId: null })}
          tactique={tactiqueDrawer.tactique}
          onSave={handleSaveTactique}
        />
        
        <PlacementDrawer
          isOpen={placementDrawer.isOpen}
          onClose={() => setPlacementDrawer({ isOpen: false, placement: null, tactiqueId: null, tactiqueData: null })}
          placement={placementDrawer.placement}
          placementId={placementDrawer.tactiqueId || ''}
          tactiqueData={placementDrawer.tactiqueData || undefined}
          onSave={handleSavePlacement}
        />
        
        {/* 🔥 NOUVEAU : Drawer créatifs */}
        <CreatifDrawer
          isOpen={creatifDrawer.isOpen}
          onClose={() => setCreatifDrawer({ isOpen: false, creatif: null, placementId: null, placementData: null, tactiqueData: null })}
          creatif={creatifDrawer.creatif}
          placementId={creatifDrawer.placementId || ''}
          placementData={creatifDrawer.placementData || undefined}
          tactiqueData={creatifDrawer.tactiqueData || undefined}
          onSave={handleSaveCreatif}
        />
      </div>
    </DragDropContext>
  );
}