// app/components/Tactiques/Views/Timeline/TactiquesTimelineTable.tsx
/**
 * Tableau d'édition des répartitions temporelles des tactiques.
 * CORRIGÉ: Bugs de sauvegarde Firebase et cases à cocher
 * NOUVEAU: Scroll horizontal et position fixe des checkboxes
 * FINAL: Corrections UI et TypeScript
 */

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tactique } from '../../../../types/tactiques';
import { Breakdown } from '../../../../types/breakdown';
import {
  TimelinePeriod,
  generatePeriodsForBreakdown
} from './timelinePeriodsUtils';
import {
  getTactiqueBreakdownValue,
  getTactiqueBreakdownToggleStatus,
  updateTactiqueBreakdownData,
  calculateTactiqueBreakdownTotal,
  areAllTactiqueBreakdownValuesNumeric,
  BreakdownUpdateData
} from '../../../../lib/breakdownService';
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
    sectionId: string,
    tactiqueId: string, 
    updates: Partial<Tactique>
  ) => Promise<void>;
  onSaveComplete?: () => void;
  onCancelEdit?: () => void;
}

interface EditableCell {
  tactiqueId: string;
  breakdownId: string;
  periodId: string;
  value: string;
  isToggled?: boolean;
}

interface SelectedCell {
  rowIndex: number;
  breakdownId: string;
  periodId: string;
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
          const value = getTactiqueBreakdownValue(tactique, firstCell.breakdownId, firstCell.periodId);
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
   * Obtient la valeur d'une période pour une tactique en considérant les modifications en cours.
   */
  const getPeriodValueForTactique = (tactique: Tactique, breakdownId: string, periodId: string): string => {
    const editedCell = editableCells.find(
      cell => cell.tactiqueId === tactique.id && 
               cell.breakdownId === breakdownId && 
               cell.periodId === periodId
    );
    
    if (editedCell) {
      return editedCell.value;
    }
    
    return getTactiqueBreakdownValue(tactique, breakdownId, periodId);
  };

  /**
   * Obtient le statut d'activation d'une période pour une tactique en considérant les modifications en cours.
   */
  const getPeriodToggleForTactique = (tactique: Tactique, breakdownId: string, periodId: string): boolean => {
    const editedCell = editableCells.find(
      cell => cell.tactiqueId === tactique.id && 
               cell.breakdownId === breakdownId && 
               cell.periodId === periodId
    );
    
    if (editedCell && editedCell.isToggled !== undefined) {
      return editedCell.isToggled;
    }
    
    return getTactiqueBreakdownToggleStatus(tactique, breakdownId, periodId);
  };

  /**
   * Gère la sélection d'une cellule.
   */
  const handleCellClick = (rowIndex: number, breakdownId: string, periodId: string, event?: React.MouseEvent) => {
    if (!editMode) return;

    // CORRIGÉ: Empêcher la propagation si le clic vient d'une case à cocher
    if (event && (event.target as HTMLInputElement).type === 'checkbox') {
      return;
    }

    if (isShiftKeyPressed && selectionStart) {
      const startRow = Math.min(selectionStart.rowIndex, rowIndex);
      const endRow = Math.max(selectionStart.rowIndex, rowIndex);

      if (breakdownId === selectionStart.breakdownId && periodId === selectionStart.periodId) {
        const newSelection: SelectedCell[] = [];
        for (let i = startRow; i <= endRow; i++) {
          newSelection.push({ rowIndex: i, breakdownId, periodId });
        }
        setSelectedCells(newSelection);
      } else {
        setSelectedCells([{ rowIndex, breakdownId, periodId }]);
        setSelectionStart({ rowIndex, breakdownId, periodId });
      }
    } else {
      setSelectedCells([{ rowIndex, breakdownId, periodId }]);
      setSelectionStart({ rowIndex, breakdownId, periodId });
    }
  };

  /**
   * Gère le double-clic pour éditer une cellule.
   */
  const handleCellDoubleClick = (
    tactique: Tactique, 
    breakdownId: string, 
    periodId: string, 
    rowIndex: number
  ) => {
    if (!editMode) return;

    const isAlreadyEditing = editableCells.some(
      cell => cell.tactiqueId === tactique.id && 
               cell.breakdownId === breakdownId && 
               cell.periodId === periodId
    );

    if (!isAlreadyEditing) {
      const currentValue = getPeriodValueForTactique(tactique, breakdownId, periodId);
      const currentToggle = getPeriodToggleForTactique(tactique, breakdownId, periodId);
      
      setEditableCells(prev => [
        ...prev,
        { 
          tactiqueId: tactique.id, 
          breakdownId, 
          periodId, 
          value: currentValue,
          isToggled: currentToggle
        }
      ]);

      setSelectedCells([{ rowIndex, breakdownId, periodId }]);
      setSelectionStart({ rowIndex, breakdownId, periodId });
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
   * CORRIGÉ: Gère le changement d'état d'activation d'une période.
   */
  const handleToggleChange = (
    tactique: Tactique, 
    breakdownId: string, 
    periodId: string, 
    isToggled: boolean,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!editMode) return;

    // CORRIGÉ: Empêcher la propagation pour éviter le conflit avec la sélection de cellule
    event.stopPropagation();

    const existingCellIndex = editableCells.findIndex(
      cell => cell.tactiqueId === tactique.id && 
               cell.breakdownId === breakdownId && 
               cell.periodId === periodId
    );

    if (existingCellIndex >= 0) {
      const newEditableCells = [...editableCells];
      newEditableCells[existingCellIndex].isToggled = isToggled;
      if (!isToggled) {
        newEditableCells[existingCellIndex].value = '';
      }
      setEditableCells(newEditableCells);
    } else {
      const currentValue = getPeriodValueForTactique(tactique, breakdownId, periodId);
      setEditableCells(prev => [
        ...prev,
        { 
          tactiqueId: tactique.id, 
          breakdownId, 
          periodId, 
          value: isToggled ? currentValue : '',
          isToggled 
        }
      ]);
    }
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
        ec => ec.tactiqueId === tactique.id && 
              ec.breakdownId === cell.breakdownId && 
              ec.periodId === cell.periodId
      );

      if (existingCellIndex >= 0) {
        newEditableCells[existingCellIndex].value = copiedValue;
      } else {
        const currentToggle = getPeriodToggleForTactique(tactique, cell.breakdownId, cell.periodId);
        newEditableCells.push({
          tactiqueId: tactique.id,
          breakdownId: cell.breakdownId,
          periodId: cell.periodId,
          value: copiedValue,
          isToggled: currentToggle
        });
      }
    });

    setEditableCells(newEditableCells);
  };

  /**
   * CORRIGÉ: Sauvegarde toutes les modifications avec gestion d'erreur améliorée.
   */
  const handleSaveChanges = async () => {
    if (editableCells.length === 0) return;

    try {
      setIsSaving(true);

      // Grouper les modifications par tactique
      const updatesByTactique: { [tactiqueId: string]: BreakdownUpdateData[] } = {};

      editableCells.forEach(cell => {
        if (!updatesByTactique[cell.tactiqueId]) {
          updatesByTactique[cell.tactiqueId] = [];
        }
        
        updatesByTactique[cell.tactiqueId].push({
          breakdownId: cell.breakdownId,
          periodId: cell.periodId,
          value: cell.value,
          isToggled: cell.isToggled,
          order: 0
        });
      });

      // CORRIGÉ: Sauvegarder chaque tactique avec vérification d'existence
      for (const tactiqueId of Object.keys(updatesByTactique)) {
        const tactique = flatTactiques.find(t => t.id === tactiqueId);
        if (!tactique) {
          console.error(`Tactique introuvable avec l'ID: ${tactiqueId}`);
          continue;
        }

        try {
          const updatedTactiqueData = updateTactiqueBreakdownData(
            tactique, 
            updatesByTactique[tactiqueId]
          );
          
          // CORRIGÉ: Ordre des paramètres (sectionId, tactiqueId)
          console.log(`Mise à jour de la tactique ${tactiqueId} dans la section ${tactique.TC_SectionId}`);
          
          await onUpdateTactique(tactique.TC_SectionId, tactiqueId, updatedTactiqueData as Partial<Tactique>);
        } catch (tactiqueError: any) {
          console.error(`Erreur lors de la mise à jour de la tactique ${tactiqueId}:`, tactiqueError);
          
          // CORRIGÉ: Afficher une erreur plus spécifique
          if (tactiqueError.code === 'not-found') {
            alert(`La tactique "${tactique.TC_Label}" n'a pas été trouvée. Elle a peut-être été supprimée par un autre utilisateur.`);
          } else {
            alert(`Erreur lors de la sauvegarde de la tactique "${tactique.TC_Label}": ${tactiqueError.message}`);
          }
          
          // Continuer avec les autres tactiques
          continue;
        }
      }

      // Nettoyer l'état
      setEditableCells([]);
      setSelectedCells([]);
      
      onSaveComplete?.();
    } catch (error) {
      console.error('Erreur générale lors de la sauvegarde:', error);
      alert('Une erreur générale est survenue lors de la sauvegarde.');
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
  const isCellSelected = (rowIndex: number, breakdownId: string, periodId: string): boolean => {
    return selectedCells.some(cell => 
      cell.rowIndex === rowIndex && 
      cell.breakdownId === breakdownId && 
      cell.periodId === periodId
    );
  };

  /**
   * Vérifie si une cellule est en cours d'édition.
   */
  const isCellEditing = (tactiqueId: string, breakdownId: string, periodId: string): boolean => {
    return editableCells.some(cell => 
      cell.tactiqueId === tactiqueId && 
      cell.breakdownId === breakdownId && 
      cell.periodId === periodId
    );
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

      {/* Conteneur principal pour le tableau - CORRIGÉ: Largeur max réduite pour scroll plus précoce */}
      <div 
        className="overflow-auto mx-auto max-w-full"
        style={{
          maxHeight: '75vh',
          width: '100%',
          maxWidth: '(100vw - 700px)', // CORRIGÉ: Réduit de 220px à 350px pour scroll plus précoce
        }}
      >
        <table 
          className="divide-y divide-gray-200" 
          ref={tableRef}
          style={{ width: 'max-content', minWidth: '100%' }}
        >
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
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
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
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
                    className="px-4 py-2 text-sm font-medium text-indigo-900"
                  >
                    {sectionNames[sectionId] || 'Section sans nom'}
                  </td>
                </tr>
                
                {/* Lignes de tactiques */}
                {tactiquesGroupedBySection[sectionId].map((tactique, tactiqueIndex) => {
                  const rowIndex = flatTactiques.findIndex(t => t.id === tactique.id);
                  const isDefaultBreakdown = selectedBreakdown.isDefault;
                  const total = calculateTactiqueBreakdownTotal(tactique, selectedBreakdown.id, isDefaultBreakdown);
                  const hasNumericValues = areAllTactiqueBreakdownValuesNumeric(tactique, selectedBreakdown.id, isDefaultBreakdown);

                  return (
                    <tr key={tactique.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{tactique.TC_Label}</span>
                        </div>
                      </td>

                      {/* Colonnes des périodes */}
                      {periods.map((period) => {
                        const currentValue = getPeriodValueForTactique(tactique, selectedBreakdown.id, period.id);
                        const isActive = getPeriodToggleForTactique(tactique, selectedBreakdown.id, period.id);
                        const cellClasses = `px-2 py-2 whitespace-nowrap text-sm text-center ${
                          isCellSelected(rowIndex, selectedBreakdown.id, period.id) ? 'bg-indigo-100' : ''
                        } ${editMode ? 'cursor-cell' : ''}`;

                        if (isCellEditing(tactique.id, selectedBreakdown.id, period.id)) {
                          const cellIndex = editableCells.findIndex(
                            cell => cell.tactiqueId === tactique.id && 
                                   cell.breakdownId === selectedBreakdown.id && 
                                   cell.periodId === period.id
                          );

                          return (
                            <td key={period.id} className={cellClasses}>
                              <div className="flex items-center space-x-2">
                                {isDefaultBreakdown && (
                                  <input
                                    type="checkbox"
                                    checked={editableCells[cellIndex]?.isToggled ?? true}
                                    onChange={(e) => handleToggleChange(tactique, selectedBreakdown.id, period.id, e.target.checked, e)}
                                    className="h-3 w-3 flex-shrink-0"
                                    disabled={!editMode}
                                  />
                                )}
                                {/* CORRIGÉ: Input plus petit et grisé quand inactive */}
                                <input
                                  type="text"
                                  value={editableCells[cellIndex]?.value || ''}
                                  onChange={(e) => handleCellChange(cellIndex, e.target.value)}
                                  className={`p-1 border rounded text-sm text-center ${
                                    isDefaultBreakdown && !isActive 
                                      ? 'w-12 bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' // CORRIGÉ: Plus petit et grisé
                                      : 'flex-1 border-indigo-500'
                                  }`}
                                  style={{ fontSize: 'inherit' }}
                                  onClick={(e) => e.stopPropagation()}
                                  disabled={isDefaultBreakdown && !isActive}
                                  placeholder={isDefaultBreakdown && !isActive ? '' : undefined}
                                />
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={period.id}
                            className={cellClasses}
                            onClick={(e) => handleCellClick(rowIndex, selectedBreakdown.id, period.id, e)}
                            onDoubleClick={() => handleCellDoubleClick(tactique, selectedBreakdown.id, period.id, rowIndex)}
                          >
                            <div className="flex items-center space-x-2">
                              {isDefaultBreakdown && (
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={(e) => handleToggleChange(tactique, selectedBreakdown.id, period.id, e.target.checked, e)}
                                  className="h-3 w-3 flex-shrink-0"
                                  disabled={!editMode}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                              {/* CORRIGÉ: Affichage conditionnel selon l'état actif */}
                              {isDefaultBreakdown && !isActive ? (
                                <div className="w-12 h-6 bg-gray-100 border border-gray-200 rounded text-gray-400 text-xs flex items-center justify-center">
                                  —
                                </div>
                              ) : (
                                <div className="flex-1">
                                  {currentValue || '—'}
                                </div>
                              )}
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