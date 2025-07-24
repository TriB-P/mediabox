// app/components/Tactiques/Views/Timeline/TactiquesTimelineTable.tsx
/**
 * Tableau d'édition des répartitions temporelles des tactiques.
 * Permet de visualiser et modifier les valeurs des breakdowns avec fonctionnalités
 * de copier-coller, sélection multiple et gestion des périodes actives.
 */

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tactique } from '../../../../types/tactiques';
import { Breakdown } from '../../../../types/breakdown';
import {
  TimelinePeriod,
  generatePeriodsForBreakdown,
  getPeriodValue,
  getPeriodActiveStatus,
  calculateBreakdownTotal,
  areAllValuesNumeric,
  distributeAmountEqually
} from './timelinePeriodsUtils';
import {
  CheckIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface TactiquesTimelineTableProps {
  tactiques: Tactique[];
  sectionNames: { [key: string]: string };
  selectedBreakdown: Breakdown;
  editMode: boolean;
  campaignStartDate: string;
  campaignEndDate: string;
  formatCurrency: (amount: number) => string;
  onUpdateTactique: (
    tactiqueId: string, 
    sectionId: string, 
    updates: Partial<Tactique>
  ) => Promise<void>;
  onSaveComplete?: () => void;
  onCancelEdit?: () => void;
}

interface EditableCell {
  tactiqueId: string;
  fieldName: string;
  value: string;
}

interface SelectedCell {
  rowIndex: number;
  fieldName: string;
}

interface DistributionModalState {
  isOpen: boolean;
  tactiqueId: string | null;
  totalAmount: string;
}

/**
 * Composant tableau pour l'édition des répartitions temporelles.
 */
export default function TactiquesTimelineTable({
  tactiques,
  sectionNames,
  selectedBreakdown,
  editMode,
  campaignStartDate,
  campaignEndDate,
  formatCurrency,
  onUpdateTactique,
  onSaveComplete,
  onCancelEdit
}: TactiquesTimelineTableProps) {
  const [editableCells, setEditableCells] = useState<EditableCell[]>([]);
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [selectionStart, setSelectionStart] = useState<SelectedCell | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [distributionModal, setDistributionModal] = useState<DistributionModalState>({
    isOpen: false,
    tactiqueId: null,
    totalAmount: ''
  });

  const tableRef = useRef<HTMLTableElement>(null);

  // Génération des périodes pour le breakdown sélectionné
  const periods = useMemo(() => {
    return generatePeriodsForBreakdown(
      selectedBreakdown,
      campaignStartDate,
      campaignEndDate
    );
  }, [selectedBreakdown, campaignStartDate, campaignEndDate]);

  // Groupement des tactiques par section
  const tactiquesGroupedBySection = useMemo(() => {
    const grouped: { [sectionId: string]: Tactique[] } = {};
    
    tactiques.forEach(tactique => {
      const sectionId = tactique.TC_SectionId;
      if (!grouped[sectionId]) {
        grouped[sectionId] = [];
      }
      grouped[sectionId].push(tactique);
    });

    // Trier les tactiques dans chaque section par ordre
    Object.keys(grouped).forEach(sectionId => {
      grouped[sectionId].sort((a, b) => (a.TC_Order || 0) - (b.TC_Order || 0));
    });

    return grouped;
  }, [tactiques]);

  // Tableau plat pour l'affichage
  const flatTactiques = useMemo(() => {
    const flat: Tactique[] = [];
    Object.keys(tactiquesGroupedBySection)
      .sort()
      .forEach(sectionId => {
        flat.push(...tactiquesGroupedBySection[sectionId]);
      });
    return flat;
  }, [tactiquesGroupedBySection]);

  /**
   * Gestion des événements clavier pour copier-coller et sélection
   */
  useEffect(() => {
    if (!editMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftKeyPressed(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedCells.length > 0) {
          const firstCell = selectedCells[0];
          const tactique = flatTactiques[firstCell.rowIndex];
          const value = getPeriodValueForTactique(tactique, firstCell.fieldName);
          setCopiedValue(value);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (copiedValue !== null && selectedCells.length > 0) {
          handlePaste();
        }
      }

      if (e.key === 'Escape') {
        setSelectedCells([]);
        setSelectionStart(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftKeyPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedCells, flatTactiques, editMode, copiedValue]);

  /**
   * Obtient la valeur d'une période pour une tactique.
   */
  const getPeriodValueForTactique = (tactique: Tactique, fieldName: string): string => {
    const editedCell = editableCells.find(
      cell => cell.tactiqueId === tactique.id && cell.fieldName === fieldName
    );
    
    if (editedCell) {
      return editedCell.value;
    }
    
    return String(tactique[fieldName as keyof Tactique] || '');
  };

  /**
   * Gère la sélection d'une cellule.
   */
  const handleCellClick = (rowIndex: number, fieldName: string) => {
    if (!editMode) return;

    if (isShiftKeyPressed && selectionStart) {
      const startRow = Math.min(selectionStart.rowIndex, rowIndex);
      const endRow = Math.max(selectionStart.rowIndex, rowIndex);

      if (fieldName === selectionStart.fieldName) {
        const newSelection: SelectedCell[] = [];
        for (let i = startRow; i <= endRow; i++) {
          newSelection.push({ rowIndex: i, fieldName });
        }
        setSelectedCells(newSelection);
      } else {
        setSelectedCells([{ rowIndex, fieldName }]);
        setSelectionStart({ rowIndex, fieldName });
      }
    } else {
      setSelectedCells([{ rowIndex, fieldName }]);
      setSelectionStart({ rowIndex, fieldName });
    }
  };

  /**
   * Gère le double-clic pour éditer une cellule.
   */
  const handleCellDoubleClick = (tactique: Tactique, fieldName: string, rowIndex: number) => {
    if (!editMode) return;

    const isAlreadyEditing = editableCells.some(
      cell => cell.tactiqueId === tactique.id && cell.fieldName === fieldName
    );

    if (!isAlreadyEditing) {
      const currentValue = getPeriodValueForTactique(tactique, fieldName);
      setEditableCells(prev => [
        ...prev,
        { tactiqueId: tactique.id, fieldName, value: currentValue }
      ]);

      setSelectedCells([{ rowIndex, fieldName }]);
      setSelectionStart({ rowIndex, fieldName });
    }
  };

  /**
   * Met à jour la valeur d'une cellule en cours d'édition.
   */
  const handleCellChange = (index: number, value: string) => {
    const newEditableCells = [...editableCells];
    newEditableCells[index].value = value;
    setEditableCells(newEditableCells);
  };

  /**
   * Colle la valeur copiée dans les cellules sélectionnées.
   */
  const handlePaste = () => {
    if (copiedValue === null || selectedCells.length === 0) return;

    const newEditableCells = [...editableCells];

    selectedCells.forEach(cell => {
      const tactique = flatTactiques[cell.rowIndex];

      const existingCellIndex = newEditableCells.findIndex(
        ec => ec.tactiqueId === tactique.id && ec.fieldName === cell.fieldName
      );

      if (existingCellIndex >= 0) {
        newEditableCells[existingCellIndex].value = copiedValue;
      } else {
        newEditableCells.push({
          tactiqueId: tactique.id,
          fieldName: cell.fieldName,
          value: copiedValue
        });
      }
    });

    setEditableCells(newEditableCells);
  };

  /**
   * Sauvegarde toutes les modifications.
   */
  const handleSaveChanges = async () => {
    if (editableCells.length === 0) return;

    try {
      setIsSaving(true);

      // Grouper les modifications par tactique
      const updatesByTactique: { [tactiqueId: string]: Partial<Tactique> } = {};

      editableCells.forEach(cell => {
        if (!updatesByTactique[cell.tactiqueId]) {
          updatesByTactique[cell.tactiqueId] = {};
        }
        updatesByTactique[cell.tactiqueId][cell.fieldName as keyof Tactique] = cell.value as any;
      });

      // Sauvegarder chaque tactique
      for (const tactiqueId of Object.keys(updatesByTactique)) {
        const tactique = flatTactiques.find(t => t.id === tactiqueId);
        if (tactique) {
          await onUpdateTactique(tactiqueId, tactique.TC_SectionId, updatesByTactique[tactiqueId]);
        }
      }

      // Nettoyer l'état
      setEditableCells([]);
      setSelectedCells([]);
      
      onSaveComplete?.();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Annule toutes les modifications.
   */
  const handleCancelChanges = () => {
    setEditableCells([]);
    setSelectedCells([]);
    setSelectionStart(null);
    setCopiedValue(null);
    onCancelEdit?.();
  };

  /**
   * Vérifie si une cellule est sélectionnée.
   */
  const isCellSelected = (rowIndex: number, fieldName: string): boolean => {
    return selectedCells.some(cell => cell.rowIndex === rowIndex && cell.fieldName === fieldName);
  };

  /**
   * Vérifie si une cellule est en cours d'édition.
   */
  const isCellEditing = (tactiqueId: string, fieldName: string): boolean => {
    return editableCells.some(cell => cell.tactiqueId === tactiqueId && cell.fieldName === fieldName);
  };

  if (periods.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Aucune période trouvée pour ce breakdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Boutons de sauvegarde en mode édition */}
      {editMode && editableCells.length > 0 && (
        <div className="flex items-center justify-end space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-sm text-yellow-800">
            {editableCells.length} modification(s) en attente
          </span>
          <button
            onClick={handleCancelChanges}
            className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSaving}
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Annuler
          </button>
          <button
            onClick={handleSaveChanges}
            className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={isSaving}
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      )}

      {/* Tableau principal */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" ref={tableRef}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Section / Tactique
              </th>
              {periods.map((period) => (
                <th
                  key={period.id}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                >
                  {period.label}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.keys(tactiquesGroupedBySection).map(sectionId => (
              <React.Fragment key={sectionId}>
                {/* Ligne de section */}
                <tr className="bg-indigo-50">
                  <td 
                    colSpan={periods.length + 2} 
                    className="px-4 py-2 text-sm font-medium text-indigo-900 sticky left-0 bg-indigo-50 z-10"
                  >
                    {sectionNames[sectionId] || 'Section sans nom'}
                  </td>
                </tr>
                
                {/* Lignes de tactiques */}
                {tactiquesGroupedBySection[sectionId].map((tactique, tactiqueIndex) => {
                  const rowIndex = flatTactiques.findIndex(t => t.id === tactique.id);
                  const isDefaultBreakdown = selectedBreakdown.isDefault;
                  const total = calculateBreakdownTotal(tactique, periods, isDefaultBreakdown);
                  const hasNumericValues = areAllValuesNumeric(tactique, periods, isDefaultBreakdown);

                  return (
                    <tr key={tactique.id} className="hover:bg-gray-50">
                      {/* Colonne tactique */}
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-white z-10">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500"></span>
                          <span>{tactique.TC_Label}</span>
                        </div>
                      </td>

                      {/* Colonnes des périodes */}
                      {periods.map((period) => {
                        const currentValue = getPeriodValueForTactique(tactique, period.fieldName);
                        const isActive = !isDefaultBreakdown || getPeriodActiveStatus(tactique, period);
                        const cellClasses = `px-2 py-2 whitespace-nowrap text-sm text-center ${
                          isCellSelected(rowIndex, period.fieldName) ? 'bg-indigo-100' : ''
                        } ${editMode ? 'cursor-cell' : ''}`;

                        if (isCellEditing(tactique.id, period.fieldName)) {
                          const cellIndex = editableCells.findIndex(
                            cell => cell.tactiqueId === tactique.id && cell.fieldName === period.fieldName
                          );

                          return (
                            <td key={period.id} className={cellClasses}>
                              <input
                                type="text"
                                value={editableCells[cellIndex]?.value || ''}
                                onChange={(e) => handleCellChange(cellIndex, e.target.value)}
                                className="w-full p-1 border border-indigo-500 rounded text-sm text-center"
                                style={{ fontSize: 'inherit' }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                          );
                        }

                        return (
                          <td
                            key={period.id}
                            className={cellClasses}
                            onClick={() => handleCellClick(rowIndex, period.fieldName)}
                            onDoubleClick={() => handleCellDoubleClick(tactique, period.fieldName, rowIndex)}
                          >
                            <div className="relative">
                              {isDefaultBreakdown && (
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={(e) => {
                                    // TODO: Gérer le changement d'état actif
                                    console.log('Toggle period active:', period.id, e.target.checked);
                                  }}
                                  className="absolute top-0 left-0 h-3 w-3"
                                  disabled={!editMode}
                                />
                              )}
                              <div className={`${isDefaultBreakdown ? 'mt-4' : ''} ${!isActive ? 'opacity-50' : ''}`}>
                                {currentValue || '—'}
                              </div>
                            </div>
                          </td>
                        );
                      })}

                      {/* Colonne total */}
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium">
                        {hasNumericValues && total > 0 ? formatCurrency(total) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}