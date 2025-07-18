// app/components/Tactiques/SelectedActionsPanel.tsx

'use client';

import React from 'react';
import { TrashIcon, DocumentDuplicateIcon, XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Section, Tactique, Placement, Creatif } from '../../types/tactiques';
import { useMoveOperation } from '../../hooks/useMoveOperation';
import MoveModal from './MoveModal';

interface SelectedActionsPanelProps {
  selectedItems: (Section | Tactique | Placement | Creatif)[];
  onDuplicateSelected: (itemIds: string[]) => void;
  onDeleteSelected: (itemIds: string[]) => void;
  onClearSelection: () => void;
  onRefresh?: () => Promise<void>; // 🔥 Callback pour refresh après déplacement
  loading: boolean;
}

export default function SelectedActionsPanel({
  selectedItems,
  onDuplicateSelected,
  onDeleteSelected,
  onClearSelection,
  onRefresh,
  loading,
}: SelectedActionsPanelProps) {
  const selectedCount = selectedItems.length;

  // 🔥 Hook pour la gestion du déplacement
  const {
    modalState,
    openMoveModal,
    closeMoveModal,
    selectDestination,
    confirmMove,
    analyzeSelection,
    canMoveSelection,
    getMoveButtonLabel
  } = useMoveOperation();

  if (selectedCount === 0) {
    return null; // Ne pas afficher si aucun élément n'est sélectionné
  }

  const selectedItemIds = selectedItems.map(item => item.id);

  // 🔥 Analyse de la sélection pour le déplacement
  const selectionAnalysis = analyzeSelection(selectedItems);
  const canMove = canMoveSelection(selectedItems);
  const moveButtonLabel = getMoveButtonLabel(selectedItems);

  // 🔥 Gestionnaire du déplacement
  const handleMoveClick = () => {
    if (canMove) {
      openMoveModal(selectionAnalysis);
    }
  };

  // 🔥 NOUVEAU: Gestionnaire de fermeture avec refresh optionnel
  const handleMoveModalClose = async () => {
    const wasSuccessful = modalState.result?.success;
    
    closeMoveModal();
    
    // Si le déplacement a réussi, déclencher le refresh et nettoyer la sélection
    if (wasSuccessful && onRefresh) {
      try {
        await onRefresh();
        onClearSelection(); // Nettoyer la sélection après un déplacement réussi
      } catch (error) {
        console.error('Erreur lors du refresh après déplacement:', error);
      }
    }
  };

  // 🔥 NOUVEAU: Gestionnaire de confirmation avec refresh intégré
  const handleConfirmMove = async () => {
    try {
      await confirmMove();
      // Le refresh sera géré dans handleMoveModalClose après fermeture
    } catch (error) {
      console.error('Erreur lors de la confirmation du déplacement:', error);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-4 flex items-center justify-between z-20 sticky top-4 mb-6 border border-indigo-200">
        <div className="flex items-center space-x-4">
          <span className="text-indigo-700 font-medium text-sm">
            {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
          </span>

          {/* 🔥 Bouton Déplacer */}
          <button
            onClick={handleMoveClick}
            disabled={loading || selectedCount === 0 || !canMove}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md transition-colors ${
              canMove
                ? 'text-purple-700 bg-purple-100 hover:bg-purple-200'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={canMove ? moveButtonLabel : "Sélection non compatible pour le déplacement"}
          >
            <ArrowRightIcon className="h-4 w-4" />
            {canMove ? 'Déplacer' : 'Déplacer'}
          </button>

          <button
            onClick={() => onDuplicateSelected(selectedItemIds)}
            disabled={loading || selectedCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Dupliquer les éléments sélectionnés"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            Dupliquer
          </button>

          <button
            onClick={() => onDeleteSelected(selectedItemIds)}
            disabled={loading || selectedCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Supprimer les éléments sélectionnés"
          >
            <TrashIcon className="h-4 w-4" />
            Supprimer
          </button>
        </div>

        <button
          onClick={onClearSelection}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700 p-1 rounded-full transition-colors"
          title="Désélectionner tout"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* 🔥 Affichage des détails de sélection pour le déplacement (optionnel, pour debug) */}
      {process.env.NODE_ENV === 'development' && selectedCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs">
          <div className="font-medium text-yellow-800 mb-1">Debug - Analyse de sélection :</div>
          <div className="text-yellow-700">
            <div>• Peut déplacer : {canMove ? '✅ Oui' : '❌ Non'}</div>
            <div>• Type de déplacement : {selectionAnalysis.moveLevel}</div>
            <div>• Destination requise : {selectionAnalysis.targetLevel}</div>
            <div>• Éléments racines : {selectionAnalysis.rootElements.length}</div>
            <div>• Total à déplacer : {selectionAnalysis.totalItemsToMove}</div>
            {selectionAnalysis.errorMessage && (
              <div className="text-red-600">• Erreur : {selectionAnalysis.errorMessage}</div>
            )}
          </div>
        </div>
      )}

      {/* 🔥 NOUVEAU: Modal de déplacement intégré */}
      <MoveModal
        modalState={modalState}
        onClose={handleMoveModalClose}
        onSelectDestination={selectDestination}
        onConfirmMove={handleConfirmMove}
      />
    </>
  );
}