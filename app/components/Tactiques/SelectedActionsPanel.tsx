/**
 * Ce fichier définit le composant SelectedActionsPanel, qui est un panneau d'actions
 * affiché lorsque des éléments (sections, tactiques, placements, créatifs) sont sélectionnés.
 * Il permet d'effectuer des opérations groupées comme la duplication, la suppression et le déplacement
 * des éléments sélectionnés, en interagissant avec l'état global et les hooks de gestion de la sélection.
 */
'use client';

import React, { useMemo, useEffect, useCallback } from 'react';
import {
  DocumentDuplicateIcon,
  TrashIcon,
  XMarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Section, Tactique, Placement, Creatif } from '../../types/tactiques';
import { SelectionValidationResult } from '../../hooks/useSelectionValidation';
import { useSimpleMoveModal } from '../../hooks/useSimpleMoveModal';
import SimpleMoveModal from './SimpleMoveModal';
import { useTranslation } from '../../contexts/LanguageContext';

interface SelectedItem {
  id: string;
  name: string;
  type: 'section' | 'tactique' | 'placement' | 'creatif';
  data?: Section | Tactique | Placement | Creatif;
}

interface SelectedActionsPanelProps {
  selectedItems: SelectedItem[];
  onDuplicateSelected: (itemIds: string[]) => void;
  onDeleteSelected: (itemIds: string[]) => void;
  onClearSelection: () => void;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
  validationResult?: SelectionValidationResult;
  hierarchyContext?: {
    sections?: Section[];
    tactiques?: { [sectionId: string]: Tactique[] };
    placements?: { [tactiqueId: string]: Placement[] };
    creatifs?: { [placementId: string]: Creatif[] };
  };
}

/**
 * Composant principal qui affiche les actions disponibles pour les éléments sélectionnés.
 * @param {SelectedActionsPanelProps} props - Les propriétés du composant.
 * @returns {JSX.Element | null} Le panneau d'actions ou null si aucun élément n'est sélectionné.
 */
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
  const { t } = useTranslation();

  /**
   * Hook pour la gestion de l'état du modal de déplacement.
   * Fournit les fonctions pour ouvrir, fermer le modal, sélectionner une destination et confirmer le déplacement.
   */
  const {
    modalState: moveModalState,
    openModal: openMoveModal,
    closeModal: closeMoveModal,
    selectDestination,
    confirmMove,
    isDestinationComplete
  } = useSimpleMoveModal();

  /**
   * Callback pour rafraîchir complètement les données après une opération comme le déplacement.
   * Il appelle la fonction onRefresh passée en props et efface la sélection après un court délai.
   * @returns {Promise<void>} Une promesse qui se résout une fois le rafraîchissement terminé.
   */
  const handleRefreshComplete = useCallback(async () => {
    if (!onRefresh) {
      return;
    }

    try {
      await onRefresh();
      await new Promise(resolve => setTimeout(resolve, 200));
      onClearSelection();
    } catch (error) {
      console.error('❌ Erreur lors du refresh complet:', error);
      throw error;
    }
  }, [onRefresh, onClearSelection]);

  /**
   * Mémoïse les IDs des éléments sélectionnés pour éviter des recalculs inutiles.
   * @returns {string[]} Un tableau des IDs des éléments sélectionnés.
   */
  const itemIds = useMemo(() => selectedItems.map(item => item.id), [selectedItems]);

  /**
   * Calcule le nombre d'éléments sélectionnés par type (section, tactique, placement, creatif).
   * @returns {object} Un objet contenant le compte de chaque type d'élément.
   */
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

  /**
   * Calcule le nombre total d'éléments sélectionnés.
   * @returns {number} Le nombre total d'éléments.
   */
  const totalCount = selectedItems.length;

  /**
   * Génère une description textuelle des éléments sélectionnés.
   * @returns {string} Une chaîne de caractères décrivant la sélection (ex: "2 sections, 1 tactique").
   */
  const selectionDescription = useMemo(() => {
    const parts: string[] = [];

    if (itemCountsByType.section > 0) {
      parts.push(`${itemCountsByType.section} ${t('model.section')}${itemCountsByType.section > 1 ? 's' : ''}`);
    }
    if (itemCountsByType.tactique > 0) {
      parts.push(`${itemCountsByType.tactique} ${t('model.tactic')}${itemCountsByType.tactique > 1 ? 's' : ''}`);
    }
    if (itemCountsByType.placement > 0) {
      parts.push(`${itemCountsByType.placement} ${t('model.placement')}${itemCountsByType.placement > 1 ? 's' : ''}`);
    }
    if (itemCountsByType.creatif > 0) {
      parts.push(`${itemCountsByType.creatif} ${t('model.creative')}${itemCountsByType.creatif > 1 ? 's' : ''}`);
    }

    return parts.join(', ');
  }, [itemCountsByType, t]);

  /**
   * Détermine l'état du bouton de déplacement (activé, désactivé, libellé, raison).
   * Se base sur le résultat de la validation de la sélection.
   * @returns {object} Un objet contenant l'état et les informations du bouton.
   */
  const moveButtonState = useMemo(() => {
    if (!validationResult) {
      return {
        canMove: false,
        label: t('selectedActionsPanel.moveButton.validating'),
        disabled: true,
        reason: t('selectedActionsPanel.moveButton.noValidationAvailable')
      };
    }

    if (!validationResult.canMove) {
      return {
        canMove: false,
        label: t('selectedActionsPanel.moveButton.invalidSelection'),
        disabled: true,
        reason: validationResult.errorMessage || t('selectedActionsPanel.moveButton.invalidForMove')
      };
    }

    const { moveLevel, targetLevel, affectedItemsCount } = validationResult;
    const directCount = selectedItems.length;

    const moveLabels: Record<string, string> = {
      section: t('model.sections'),
      tactique: t('model.tactics'),
      placement: t('model.placements'),
      creatif: t('model.creatives')
    };

    const targetLabels: Record<string, string> = {
      onglet: t('selectedActionsPanel.moveButton.target.tab'),
      section: t('selectedActionsPanel.moveButton.target.section'),
      tactique: t('selectedActionsPanel.moveButton.target.tactic'),
      placement: t('selectedActionsPanel.moveButton.target.placement')
    };

    let label = `${t('selectedActionsPanel.moveButton.moveAction')} ${directCount} ${moveLabels[moveLevel!]}`;
    if (affectedItemsCount > directCount) {
      label += ` (${affectedItemsCount} ${t('selectedActionsPanel.moveButton.total')})`;
    }
    label += ` ${t('selectedActionsPanel.moveButton.to')} ${targetLabels[targetLevel!]}`;

    return {
      canMove: true,
      label,
      disabled: false,
      reason: `${t('selectedActionsPanel.moveButton.readyToMove')} ${directCount} ${t('model.item')}${directCount > 1 ? 's' : ''}`
    };
  }, [validationResult, selectedItems.length, t]);

  /**
   * Gère l'action de duplication des éléments sélectionnés.
   * Appelle la fonction onDuplicateSelected passée en props.
   */
  const handleDuplicate = () => {
    if (loading) return;
    onDuplicateSelected(itemIds);
  };

  /**
   * Gère l'action de suppression des éléments sélectionnés.
   * Appelle la fonction onDeleteSelected passée en props.
   */
  const handleDelete = () => {
    if (loading) return;
    onDeleteSelected(itemIds);
  };

  /**
   * Gère l'action d'annulation de la sélection.
   * Appelle la fonction onClearSelection passée en props.
   */
  const handleClear = () => {
    if (loading) return;
    onClearSelection();
  };

  /**
   * Gère l'action de déplacement des éléments sélectionnés.
   * Ouvre le modal de déplacement et passe la fonction de rafraîchissement complète.
   * @returns {Promise<void>} Une promesse qui se résout une fois le modal ouvert.
   */
  const handleMove = async () => {
    if (loading || !moveButtonState.canMove || !validationResult) {
      return;
    }

    if (!hierarchyContext) {
      console.error('❌ hierarchyContext est undefined dans handleMove !');
      return;
    }

    if (!hierarchyContext.sections || hierarchyContext.sections.length === 0) {
      console.error('❌ hierarchyContext.sections est vide !');
      return;
    }

    try {
      await openMoveModal(
        validationResult,
        selectedItems.map(item => item.id),
        {
          sections: hierarchyContext?.sections || [],
          tactiques: hierarchyContext?.tactiques || {},
          placements: hierarchyContext?.placements || {},
          creatifs: hierarchyContext?.creatifs || {}
        },
        handleRefreshComplete
      );
    } catch (error) {
      console.error('❌ Erreur dans openMoveModal:', error);
    }
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-indigo-900">
              {totalCount} {t('model.item')}{totalCount > 1 ? 's' : ''} {t('model.selected')}{totalCount > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-indigo-600">
              {selectionDescription}
            </div>

          </div>

          <div className="flex items-center space-x-2">
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
              {moveButtonState.canMove ? t('selectedActionsPanel.buttons.move') : t('selectedActionsPanel.buttons.invalid')}
            </button>

            <button
              onClick={handleDuplicate}
              disabled={loading}
              className="flex items-center px-3 py-1.5 rounded text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-1.5" />
              {t('common.duplicate')}
            </button>

            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center px-3 py-1.5 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-1.5" />
              {t('common.delete')}
            </button>

            <button
              onClick={handleClear}
              disabled={loading}
              className="flex items-center px-3 py-1.5 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XMarkIcon className="h-4 w-4 mr-1.5" />
              {t('common.cancel')}
            </button>
          </div>
        </div>

        {validationResult && !validationResult.canMove && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
            <strong>{t('selectedActionsPanel.moveImpossible.title')}:</strong> {validationResult.errorMessage}
          </div>
        )}

        {loading && (
          <div className="mt-2 flex items-center text-xs text-indigo-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 mr-2"></div>
            {t('selectedActionsPanel.operationInProgress')}
          </div>
        )}
      </div>

      <SimpleMoveModal
        modalState={moveModalState}
        onClose={closeMoveModal}
        onSelectDestination={selectDestination}
        onConfirmMove={confirmMove}
        isDestinationComplete={isDestinationComplete}
      />
    </>
  );
}