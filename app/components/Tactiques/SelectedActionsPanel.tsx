// app/components/Tactiques/SelectedActionsPanel.tsx - AVEC VALIDATION DE DÉPLACEMENT

'use client';

import React, { useMemo } from 'react';
import {
  DocumentDuplicateIcon,
  TrashIcon,
  XMarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Section, Tactique, Placement, Creatif } from '../../types/tactiques';
import { SelectionValidationResult } from '../../hooks/useSelectionValidation';
import { useSimpleMoveModal } from '../../hooks/useSimpleMoveModal';
import MoveModal from './SimpleMoveModal';

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
  // 🔥 NOUVEAU: Résultat de validation pour le déplacement
  validationResult?: SelectionValidationResult;
  // 🔥 NOUVEAU: Contexte hiérarchique pour le déplacement (optionnel pour l'instant)
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
  validationResult,
  hierarchyContext
}: SelectedActionsPanelProps) {

  // ==================== 🔥 HOOK MODAL DE DÉPLACEMENT ====================

  const {
    modalState: moveModalState,
    openModal: openMoveModal,
    closeModal: closeMoveModal,
    selectDestination,
    confirmMove,
    isDestinationComplete
  } = useSimpleMoveModal();

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

  // ==================== 🔥 LOGIQUE DE BOUTON DÉPLACER ====================

  const moveButtonState = useMemo(() => {
    if (!validationResult) {
      return {
        canMove: false,
        label: 'Validation en cours...',
        disabled: true,
        reason: 'Aucune validation disponible'
      };
    }

    if (!validationResult.canMove) {
      return {
        canMove: false,
        label: 'Sélection invalide',
        disabled: true,
        reason: validationResult.errorMessage || 'Sélection invalide pour le déplacement'
      };
    }

    const { moveLevel, targetLevel, affectedItemsCount } = validationResult;
    const directCount = selectedItems.length;
    
    const moveLabels: Record<string, string> = {
      'section': 'sections',
      'tactique': 'tactiques',
      'placement': 'placements',
      'creatif': 'créatifs'
    };
    
    const targetLabels: Record<string, string> = {
      'onglet': 'un onglet',
      'section': 'une section', 
      'tactique': 'une tactique',
      'placement': 'un placement'
    };

    let label = `Déplacer ${directCount} ${moveLabels[moveLevel!]}`;
    if (affectedItemsCount > directCount) {
      label += ` (${affectedItemsCount} au total)`;
    }
    label += ` vers ${targetLabels[targetLevel!]}`;

    return {
      canMove: true,
      label,
      disabled: false,
      reason: `Prêt à déplacer ${directCount} élément(s)`
    };
  }, [validationResult, selectedItems.length]);

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

  const handleMove = async () => {
    if (loading || !moveButtonState.canMove || !validationResult) return;
    
    console.log('🚀 Ouverture du modal de déplacement');
    console.log('📊 Validation:', validationResult);
    console.log('📦 Éléments à déplacer:', selectedItems);
    
    // Ouvrir le modal avec la validation et les IDs sélectionnés
    await openMoveModal(validationResult, selectedItems.map(item => item.id));
  };

  // ==================== RENDU ====================

  if (totalCount === 0) {
    return null;
  }

  return (
    <>
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
            {/* 🔥 NOUVEAU: Bouton de déplacement avec validation */}
            <button
              onClick={handleMove}
              disabled={loading || moveButtonState.disabled}
              className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                moveButtonState.canMove && !loading
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={moveButtonState.reason}
            >
              <ArrowRightIcon className="h-4 w-4 mr-1.5" />
              {moveButtonState.canMove ? 'Déplacer' : 'Invalide'}
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
        modalState={moveModalState}
        onClose={closeMoveModal}
        onSelectDestination={selectDestination}
        onConfirmMove={confirmMove}
        isDestinationComplete={isDestinationComplete}
      />
    </>
  );
}