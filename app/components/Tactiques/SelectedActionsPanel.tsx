// app/components/Tactiques/SelectedActionsPanel.tsx - AVEC INTÉGRATION DÉPLACEMENT

'use client';

import React, { useMemo } from 'react';
import {
  DocumentDuplicateIcon,
  TrashIcon,
  XMarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Section, Tactique, Placement, Creatif } from '../../types/tactiques';
import useMoveOperation from '../../hooks/useMoveOperation';
import MoveModal from './MoveModal';

// ==================== TYPES ====================

interface SelectedItem {
  id: string;
  name: string;
  type: 'section' | 'tactique' | 'placement' | 'creatif';
  // 🔥 NOUVEAU: Données complètes de l'élément pour le déplacement
  data?: Section | Tactique | Placement | Creatif;
}

interface SelectedActionsPanelProps {
  selectedItems: SelectedItem[];
  onDuplicateSelected: (itemIds: string[]) => void;
  onDeleteSelected: (itemIds: string[]) => void;
  onClearSelection: () => void;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
  // 🔥 NOUVEAU: Contexte hiérarchique pour le déplacement
  hierarchyContext?: {
    sections?: Section[];
    tactiques?: { [sectionId: string]: Tactique[] };
    placements?: { [tactiqueId: string]: Placement[] };
    creatifs?: { [placementId: string]: Creatif[] };
  };
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function SelectedActionsPanel({
  selectedItems,
  onDuplicateSelected,
  onDeleteSelected,
  onClearSelection,
  onRefresh,
  loading = false,
  hierarchyContext
}: SelectedActionsPanelProps) {

  // ==================== HOOK DÉPLACEMENT ====================

  const {
    modalState,
    openMoveModal,
    closeMoveModal,
    selectDestination,
    confirmMove,
    analyzeSelection,
    canMoveSelection,
    getMoveButtonLabel
  } = useMoveOperation(onRefresh, hierarchyContext);

  // ==================== CALCULS DÉRIVÉS ====================

  const itemIds = useMemo(() => selectedItems.map(item => item.id), [selectedItems]);

  const itemCountsByType = useMemo(() => {
    const counts = {
      section: 0,
      tactique: 0,
      placement: 0,
      creatif: 0
    };

    selectedItems.forEach(item => {
      if (item.type in counts) {
        counts[item.type as keyof typeof counts]++;
      }
    });

    return counts;
  }, [selectedItems]);

  const totalCount = selectedItems.length;

  // Texte descriptif de la sélection
  const selectionDescription = useMemo(() => {
    const parts: string[] = [];
    
    if (itemCountsByType.section > 0) {
      parts.push(`${itemCountsByType.section} section${itemCountsByType.section > 1 ? 's' : ''}`);
    }
    if (itemCountsByType.tactique > 0) {
      parts.push(`${itemCountsByType.tactique} tactique${itemCountsByType.tactique > 1 ? 's' : ''}`);
    }
    if (itemCountsByType.placement > 0) {
      parts.push(`${itemCountsByType.placement} placement${itemCountsByType.placement > 1 ? 's' : ''}`);
    }
    if (itemCountsByType.creatif > 0) {
      parts.push(`${itemCountsByType.creatif} créatif${itemCountsByType.creatif > 1 ? 's' : ''}`);
    }

    return parts.join(', ');
  }, [itemCountsByType]);

  // ==================== 🔥 GESTION DU DÉPLACEMENT ====================

  // Préparer les données pour l'analyse de sélection
  const selectedItemsForMove = useMemo(() => {
    return selectedItems.map(item => ({
      id: item.id,
      type: item.type,
      // Propriétés pour la détection de type
      ...(item.type === 'section' && { SECTION_Name: item.name }),
      ...(item.type === 'tactique' && { TC_Label: item.name }),
      ...(item.type === 'placement' && { PL_Label: item.name }),
      ...(item.type === 'creatif' && { CR_Label: item.name }),
      // Données complètes si disponibles
      ...(item.data || {})
    }));
  }, [selectedItems]);

  // Vérifier si la sélection peut être déplacée
  const canMove = useMemo(() => {
    if (selectedItems.length === 0) return false;
    return canMoveSelection(selectedItemsForMove);
  }, [selectedItems.length, canMoveSelection, selectedItemsForMove]);

  // Libellé du bouton de déplacement
  const moveButtonLabel = useMemo(() => {
    if (!canMove) return 'Déplacement non disponible';
    return getMoveButtonLabel(selectedItemsForMove);
  }, [canMove, getMoveButtonLabel, selectedItemsForMove]);

  // Gestionnaire d'ouverture du modal de déplacement
  const handleOpenMoveModal = () => {
    console.log('🔄 Ouverture modal déplacement pour:', selectedItems.length, 'éléments');
    
    const analysis = analyzeSelection(selectedItemsForMove);
    console.log('📊 Analyse de sélection:', analysis);
    
    if (analysis.canMove) {
      openMoveModal(analysis);
    } else {
      console.error('❌ Impossible de déplacer la sélection:', analysis.errorMessage);
      alert(analysis.errorMessage || 'Impossible de déplacer cette sélection');
    }
  };

  // ==================== GESTIONNAIRES D'ACTIONS ====================

  const handleDuplicate = () => {
    if (loading) return;
    onDuplicateSelected(itemIds);
  };

  const handleDelete = () => {
    if (loading) return;
    onDeleteSelected(itemIds);
  };

  const handleClear = () => {
    if (loading) return;
    onClearSelection();
  };

  // ==================== RENDU ====================

  if (totalCount === 0) {
    return null;
  }

  return (
    <>
      {/* Panel d'actions */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          {/* Informations de sélection */}
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-indigo-900">
              {totalCount} élément{totalCount > 1 ? 's' : ''} sélectionné{totalCount > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-indigo-600">
              {selectionDescription}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* 🔥 NOUVEAU: Bouton de déplacement */}
            <button
              onClick={handleOpenMoveModal}
              disabled={loading || !canMove}
              className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                canMove && !loading
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={canMove ? moveButtonLabel : 'Sélection invalide pour le déplacement'}
            >
              <ArrowRightIcon className="h-4 w-4 mr-1.5" />
              {canMove ? 'Déplacer' : 'Déplacer'}
            </button>

            {/* Bouton de duplication */}
            <button
              onClick={handleDuplicate}
              disabled={loading}
              className="flex items-center px-3 py-1.5 rounded text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-1.5" />
              Dupliquer
            </button>

            {/* Bouton de suppression */}
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center px-3 py-1.5 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-1.5" />
              Supprimer
            </button>

            {/* Bouton d'annulation */}
            <button
              onClick={handleClear}
              disabled={loading}
              className="flex items-center px-3 py-1.5 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XMarkIcon className="h-4 w-4 mr-1.5" />
              Annuler
            </button>
          </div>
        </div>

        {/* 🔥 NOUVEAU: Aperçu du déplacement si disponible */}
        {canMove && (
          <div className="mt-2 text-xs text-blue-600">
            {moveButtonLabel}
          </div>
        )}

        {/* Indicateur de chargement */}
        {loading && (
          <div className="mt-2 flex items-center text-xs text-indigo-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 mr-2"></div>
            Opération en cours...
          </div>
        )}
      </div>

      {/* 🔥 NOUVEAU: Modal de déplacement */}
      <MoveModal
        modalState={modalState}
        onClose={closeMoveModal}
        onSelectDestination={selectDestination}
        onConfirmMove={confirmMove}
      />
    </>
  );
}

