// app/components/Tactiques/SelectedActionsPanel.tsx

'use client';

import React from 'react';
import { TrashIcon, DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Section, Tactique, Placement, Creatif } from '../../types/tactiques';

interface SelectedActionsPanelProps {
  selectedItems: (Section | Tactique | Placement | Creatif)[];
  onDuplicateSelected: (itemIds: string[]) => void;
  onDeleteSelected: (itemIds: string[]) => void;
  onClearSelection: () => void;
  loading: boolean;
}

export default function SelectedActionsPanel({
  selectedItems,
  onDuplicateSelected,
  onDeleteSelected,
  onClearSelection,
  loading,
}: SelectedActionsPanelProps) {
  const selectedCount = selectedItems.length;

  if (selectedCount === 0) {
    return null; // Ne pas afficher si aucun élément n'est sélectionné
  }

  const selectedItemIds = selectedItems.map(item => item.id);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 flex items-center justify-between z-20 sticky top-4 mb-6 border border-indigo-200">
      <div className="flex items-center space-x-4">
        <span className="text-indigo-700 font-medium text-sm">
          {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
        </span>

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
  );
}