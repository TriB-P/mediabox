// app/components/Tactiques/Views/Timeline/TactiquesTimelineTable.tsx
/**
 * Tableau d'édition des répartitions temporelles des tactiques.
 * CORRIGÉ: Bugs de sauvegarde Firebase et cases à cocher
 * NOUVEAU: Scroll horizontal et position fixe des checkboxes
 * FINAL: Corrections UI et TypeScript
 * NOUVEAU: Support du type PEBs avec 3 cellules superposées (unitCost, volume, total calculé)
 * CORRIGÉ: Affichage vertical PEBs en mode édition + totaux par colonne
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
  getTactiqueBreakdownUnitCost,
  getTactiqueBreakdownTotal,
  getTactiqueBreakdownToggleStatus,
  updateTactiqueBreakdownData,
  calculateTactiqueBreakdownTotal,
  areAllTactiqueBreakdownValuesNumeric,
  calculatePEBsTotal,
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
  unitCost?: string; // NOUVEAU: Support PEBs
  total?: string;    // NOUVEAU: Support PEBs
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
 * NOUVEAU: Interface pour les totaux par colonne
 */
interface ColumnTotals {
  value: number;
  unitCost?: number;
  total?: number;
  hasNumericValues: boolean;
  hasNumericUnitCost?: boolean;
  hasNumericTotal?: boolean;
}

/**
 * NOUVEAU: Interface pour les totaux par ligne (PEBs)
 */
interface RowTotals {
  volume: number;
  total: number;
  unitCostAverage: number;
  hasNumericValues: boolean;
}

/**
 * NOUVEAU: Interface pour les données copiées (support PEBs)
 */
interface CopiedData {
  value: string;
  unitCost?: string;
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
  const [copiedValue, setCopiedValue] = useState<CopiedData | null>(null); // CORRIGÉ: Support PEBs
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [distributionModal, setDistributionModal] = useState<DistributionModalState>({
    isOpen: false,
    tactiqueId: null,
    totalAmount: ''
  });

  const tableRef = useRef<HTMLTableElement>(null);
  const isPEBs = selectedBreakdown.type === 'PEBs'; // NOUVEAU: Détection PEBs

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
   * NOUVEAU: Valide qu'une chaîne est un nombre valide (pas juste parseFloat)
   */
  const isValidNumber = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    if (trimmed === '') return false;
    // Vérifie que c'est un nombre valide et pas quelque chose comme "4 avr"
    return /^-?\d*\.?\d+$/.test(trimmed) && !isNaN(parseFloat(trimmed));
  };

  /**
   * NOUVEAU: Calcule les totaux par ligne pour une tactique (PEBs uniquement)
   */
  const calculateRowTotals = (tactique: Tactique): RowTotals => {
    let volumeSum = 0;
    let totalSum = 0;
    let unitCostSum = 0;
    let numericVolumeCount = 0;
    let numericTotalCount = 0;
    let numericUnitCostCount = 0;

    periods.forEach(period => {
      // CORRIGÉ: Pour le breakdown par défaut, ne considérer que les périodes actives
      const isActive = selectedBreakdown.isDefault ? 
        getPeriodToggleForTactique(tactique, selectedBreakdown.id, period.id) : 
        true;

      if (!isActive && selectedBreakdown.isDefault) {
        return; // Ignorer les périodes désactivées
      }

      const volume = getPeriodValueForTactique(tactique, selectedBreakdown.id, period.id, 'value');
      const total = getPeriodValueForTactique(tactique, selectedBreakdown.id, period.id, 'total');
      const unitCost = getPeriodValueForTactique(tactique, selectedBreakdown.id, period.id, 'unitCost');

      if (isValidNumber(volume)) {
        volumeSum += parseFloat(volume);
        numericVolumeCount++;
      }

      if (isValidNumber(total)) {
        totalSum += parseFloat(total);
        numericTotalCount++;
      }

      if (isValidNumber(unitCost)) {
        unitCostSum += parseFloat(unitCost);
        numericUnitCostCount++;
      }
    });

    return {
      volume: volumeSum,
      total: totalSum,
      unitCostAverage: numericUnitCostCount > 0 ? unitCostSum / numericUnitCostCount : 0,
      hasNumericValues: numericVolumeCount > 0 || numericTotalCount > 0
    };
  };
  const getPeriodValueForTactique = (
    tactique: Tactique, 
    breakdownId: string, 
    periodId: string, 
    field: 'value' | 'unitCost' | 'total' = 'value'
  ): string => {
    const editedCell = editableCells.find(
      cell => cell.tactiqueId === tactique.id && 
               cell.breakdownId === breakdownId && 
               cell.periodId === periodId
    );
    
    if (editedCell) {
      if (field === 'unitCost') return editedCell.unitCost || '';
      if (field === 'total') return editedCell.total || '';
      return editedCell.value;
    }
    
    // Lire depuis les données sauvegardées
    if (field === 'unitCost') {
      return getTactiqueBreakdownUnitCost(tactique, breakdownId, periodId);
    }
    if (field === 'total') {
      return getTactiqueBreakdownTotal(tactique, breakdownId, periodId);
    }
    return getTactiqueBreakdownValue(tactique, breakdownId, periodId);
  };

  /**
   * NOUVEAU: Calcule les totaux par colonne
   */
  const columnTotals = useMemo(() => {
    const totals: { [periodId: string]: ColumnTotals } = {};

    periods.forEach(period => {
      let valueSum = 0;
      let unitCostSum = 0;
      let totalSum = 0;
      let numericValueCount = 0;
      let numericUnitCostCount = 0;
      let numericTotalCount = 0;

      flatTactiques.forEach(tactique => {
        // Valeur principale (volume pour PEBs)
        const value = getPeriodValueForTactique(tactique, selectedBreakdown.id, period.id, 'value');
        if (isValidNumber(value)) {
          valueSum += parseFloat(value);
          numericValueCount++;
        }

        // Unit cost pour PEBs
        if (isPEBs) {
          const unitCost = getPeriodValueForTactique(tactique, selectedBreakdown.id, period.id, 'unitCost');
          if (isValidNumber(unitCost)) {
            unitCostSum += parseFloat(unitCost);
            numericUnitCostCount++;
          }

          const total = getPeriodValueForTactique(tactique, selectedBreakdown.id, period.id, 'total');
          if (isValidNumber(total)) {
            totalSum += parseFloat(total);
            numericTotalCount++;
          }
        }
      });

      totals[period.id] = {
        value: valueSum,
        unitCost: isPEBs ? unitCostSum : undefined,
        total: isPEBs ? totalSum : undefined,
        hasNumericValues: numericValueCount > 0,
        hasNumericUnitCost: isPEBs ? numericUnitCostCount > 0 : undefined,
        hasNumericTotal: isPEBs ? numericTotalCount > 0 : undefined
      };
    });

    return totals;
  }, [flatTactiques, periods, selectedBreakdown.id, isPEBs, editableCells]);

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
          
          // CORRIGÉ: Copier les données complètes (value + unitCost pour PEBs)
          const value = getPeriodValueForTactique(tactique, firstCell.breakdownId, firstCell.periodId, 'value');
          const copiedData: CopiedData = { value };
          
          if (isPEBs) {
            copiedData.unitCost = getPeriodValueForTactique(tactique, firstCell.breakdownId, firstCell.periodId, 'unitCost');
          }
          
          setCopiedValue(copiedData);
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
   * CORRIGÉ: Gère la sélection d'une cellule avec support des plages rectangulaires.
   * Maintient le mode édition mais permet la sélection.
   */
  const handleCellClick = (rowIndex: number, breakdownId: string, periodId: string, event?: React.MouseEvent) => {
    if (!editMode) return;

    // CORRIGÉ: Empêcher la propagation si le clic vient d'une case à cocher
    if (event && (event.target as HTMLInputElement).type === 'checkbox') {
      return;
    }

    // SUPPRIMÉ: Ne plus désactiver les cellules en édition - garder le mode édition actif

    if (isShiftKeyPressed && selectionStart) {
      // NOUVEAU: Support des sélections rectangulaires (horizontales et verticales)
      const startRow = Math.min(selectionStart.rowIndex, rowIndex);
      const endRow = Math.max(selectionStart.rowIndex, rowIndex);
      
      // Trouver les indices des périodes pour la sélection horizontale
      const startPeriodIndex = periods.findIndex(p => p.id === selectionStart.periodId);
      const endPeriodIndex = periods.findIndex(p => p.id === periodId);
      const minPeriodIndex = Math.min(startPeriodIndex, endPeriodIndex);
      const maxPeriodIndex = Math.max(startPeriodIndex, endPeriodIndex);

      const newSelection: SelectedCell[] = [];
      for (let i = startRow; i <= endRow; i++) {
        for (let j = minPeriodIndex; j <= maxPeriodIndex; j++) {
          if (periods[j]) {
            newSelection.push({ 
              rowIndex: i, 
              breakdownId: selectionStart.breakdownId, 
              periodId: periods[j].id 
            });
          }
        }
      }
      setSelectedCells(newSelection);
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
      const currentValue = getPeriodValueForTactique(tactique, breakdownId, periodId, 'value');
      const currentUnitCost = getPeriodValueForTactique(tactique, breakdownId, periodId, 'unitCost');
      const currentTotal = getPeriodValueForTactique(tactique, breakdownId, periodId, 'total');
      const currentToggle = getPeriodToggleForTactique(tactique, breakdownId, periodId);
      
      setEditableCells(prev => [
        ...prev,
        { 
          tactiqueId: tactique.id, 
          breakdownId, 
          periodId, 
          value: currentValue,
          unitCost: currentUnitCost, // NOUVEAU: Support PEBs
          total: currentTotal,       // NOUVEAU: Support PEBs
          isToggled: currentToggle
        }
      ]);

      setSelectedCells([{ rowIndex, breakdownId, periodId }]);
      setSelectionStart({ rowIndex, breakdownId, periodId });
    }
  };

  /**
   * NOUVEAU: Met à jour la valeur d'une cellule en cours d'édition avec support PEBs.
   */
  const handleCellChange = (
    index: number, 
    value: string, 
    field: 'value' | 'unitCost' = 'value'
  ) => {
    const newEditableCells = [...editableCells];
    const cell = newEditableCells[index];
    
    // Mettre à jour le champ demandé
    if (field === 'unitCost') {
      cell.unitCost = value;
    } else {
      cell.value = value;
    }
    
    // NOUVEAU: Pour PEBs, recalculer automatiquement le total
    if (isPEBs) {
      const unitCost = cell.unitCost || '';
      const volume = cell.value || '';
      cell.total = calculatePEBsTotal(unitCost, volume);
    }
    
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
        newEditableCells[existingCellIndex].unitCost = ''; // NOUVEAU: Reset PEBs
        newEditableCells[existingCellIndex].total = '';    // NOUVEAU: Reset PEBs
      }
      setEditableCells(newEditableCells);
    } else {
      const currentValue = getPeriodValueForTactique(tactique, breakdownId, periodId, 'value');
      const currentUnitCost = getPeriodValueForTactique(tactique, breakdownId, periodId, 'unitCost');
      const currentTotal = getPeriodValueForTactique(tactique, breakdownId, periodId, 'total');
      
      setEditableCells(prev => [
        ...prev,
        { 
          tactiqueId: tactique.id, 
          breakdownId, 
          periodId, 
          value: isToggled ? currentValue : '',
          unitCost: isToggled ? currentUnitCost : '', // NOUVEAU: Support PEBs
          total: isToggled ? currentTotal : '',       // NOUVEAU: Support PEBs
          isToggled 
        }
      ]);
    }
  };

  /**
   * CORRIGÉ: Colle les valeurs copiées dans les cellules sélectionnées avec support PEBs.
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
        // Modifier une cellule existante
        newEditableCells[existingCellIndex].value = copiedValue.value;
        if (isPEBs && copiedValue.unitCost) {
          newEditableCells[existingCellIndex].unitCost = copiedValue.unitCost;
          newEditableCells[existingCellIndex].total = calculatePEBsTotal(copiedValue.unitCost, copiedValue.value);
        }
      } else {
        // Créer une nouvelle cellule éditable
        const currentToggle = getPeriodToggleForTactique(tactique, cell.breakdownId, cell.periodId);
        
        const newCell: EditableCell = {
          tactiqueId: tactique.id,
          breakdownId: cell.breakdownId,
          periodId: cell.periodId,
          value: copiedValue.value,
          isToggled: currentToggle
        };
        
        if (isPEBs && copiedValue.unitCost) {
          newCell.unitCost = copiedValue.unitCost;
          newCell.total = calculatePEBsTotal(copiedValue.unitCost, copiedValue.value);
        }
        
        newEditableCells.push(newCell);
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
        
        const updateData: BreakdownUpdateData = {
          breakdownId: cell.breakdownId,
          periodId: cell.periodId,
          value: cell.value,
          isToggled: cell.isToggled,
          order: 0
        };
        
        // NOUVEAU: Ajouter les champs PEBs si nécessaire
        if (isPEBs) {
          updateData.unitCost = cell.unitCost;
          updateData.total = cell.total;
        }
        
        updatesByTactique[cell.tactiqueId].push(updateData);
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
    setCopiedValue(null); // CORRIGÉ: Support du nouveau type CopiedData
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

      {/* Conteneur principal pour le tableau - CORRIGÉ: Contraint à la largeur de la page */}
      <div 
        className="overflow-x-auto overflow-y-auto mx-auto"
        style={{
          maxHeight: '75vh',
          width: '100%',
          maxWidth: '100%', // NOUVEAU: Limite à la largeur de la fenêtre
        }}
      >
        <table 
          className="divide-y divide-gray-200 w-full" 
          ref={tableRef}
          style={{ minWidth: 'max-content' }} // CORRIGÉ: Seulement min-width pour le contenu
        >
          
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] sticky left-0 bg-gray-50 z-20">
              Section / Tactique
            </th>
              {periods.map((period) => (
                <th
                  key={period.id}
                  className={`px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    isPEBs ? 'min-w-[120px]' : 'min-w-[120px]' // CORRIGÉ: Largeur uniformisée
                  }`}
                >
                  {period.label}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Total Budget
              </th>
              {/* NOUVEAU: Colonnes supplémentaires pour PEBs */}
              {isPEBs && (
                <>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                    Vol Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                    Coût Moy
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.keys(tactiquesGroupedBySection).map(sectionId => (
              <React.Fragment key={sectionId}>
                {/* Ligne de section */}
                  <tr className="bg-indigo-50">
                    <td className="px-4 py-2 text-sm font-medium text-indigo-900 sticky left-0 bg-indigo-50 z-10">
                      {sectionNames[sectionId] || 'Section sans nom'}
                    </td>
                    {periods.map((period) => (
                      <td key={period.id} className="px-4 py-2 bg-indigo-50"></td>
                    ))}
                    <td className="px-4 py-2 bg-indigo-50"></td>
                    {isPEBs && (
                      <>
                        <td className="px-4 py-2 bg-indigo-50"></td>
                        <td className="px-4 py-2 bg-indigo-50"></td>
                      </>
                    )}
                  </tr>
                          
                {/* Lignes de tactiques */}
                {tactiquesGroupedBySection[sectionId].map((tactique, tactiqueIndex) => {
                  const rowIndex = flatTactiques.findIndex(t => t.id === tactique.id);
                  const isDefaultBreakdown = selectedBreakdown.isDefault;
                  const total = calculateTactiqueBreakdownTotal(
                    tactique, 
                    selectedBreakdown.id, 
                    isDefaultBreakdown, 
                    selectedBreakdown.type
                  );
                  const hasNumericValues = areAllTactiqueBreakdownValuesNumeric(
                    tactique, 
                    selectedBreakdown.id, 
                    isDefaultBreakdown, 
                    selectedBreakdown.type
                  );

                  return (
                    <tr key={tactique.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-white z-10">
                        <div className="flex items-center space-x-2">
                          <span>{tactique.TC_Label}</span>
                        </div>
                      </td>

                      {/* Colonnes des périodes */}
                      {periods.map((period) => {
                        const currentValue = getPeriodValueForTactique(tactique, selectedBreakdown.id, period.id, 'value');
                        const currentUnitCost = getPeriodValueForTactique(tactique, selectedBreakdown.id, period.id, 'unitCost');
                        const currentTotal = getPeriodValueForTactique(tactique, selectedBreakdown.id, period.id, 'total');
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
                            <td 
                              key={period.id} 
                              className={cellClasses}
                              onClick={(e) => handleCellClick(rowIndex, selectedBreakdown.id, period.id, e)}
                            >
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
                                
                                {isPEBs ? (
                                  // CORRIGÉ: Interface PEBs avec 3 inputs superposés - même largeur qu'en mode normal
                                  <div className="flex flex-col space-y-1 w-full min-w-[80px] max-w-[80px] mx-auto">
                                    {/* Coût par unité */}
                                    <input
                                      type="text"
                                      value={editableCells[cellIndex]?.unitCost || ''}
                                      onChange={(e) => handleCellChange(cellIndex, e.target.value, 'unitCost')}
                                      className={`w-full p-1 border rounded text-sm text-center ${
                                        isDefaultBreakdown && !isActive 
                                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                          : 'border-blue-300 focus:border-blue-500'
                                      }`}
                                      placeholder="Coût"
                                      disabled={isDefaultBreakdown && !isActive}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    
                                    {/* Volume */}
                                    <input
                                      type="text"
                                      value={editableCells[cellIndex]?.value || ''}
                                      onChange={(e) => handleCellChange(cellIndex, e.target.value, 'value')}
                                      className={`w-full p-1 border rounded text-sm text-center ${
                                        isDefaultBreakdown && !isActive 
                                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                          : 'border-green-300 focus:border-green-500'
                                      }`}
                                      placeholder="Vol"
                                      disabled={isDefaultBreakdown && !isActive}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    
                                    {/* Total calculé (grisé) */}
                                    <input
                                      type="text"
                                      value={editableCells[cellIndex]?.total || ''}
                                      className="w-full p-1 border rounded text-sm text-center bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                                      placeholder="Total"
                                      disabled={true}
                                      readOnly={true}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                ) : (
                                  // CORRIGÉ: Interface normale - largeur cohérente avec mode normal
                                  <div className="w-full text-center">
                                    <input
                                      type="text"
                                      value={editableCells[cellIndex]?.value || ''}
                                      onChange={(e) => handleCellChange(cellIndex, e.target.value, 'value')}
                                      className={`w-full p-1 border rounded text-sm text-center ${
                                        isDefaultBreakdown && !isActive 
                                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                          : 'border-indigo-500'
                                      }`}
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={isDefaultBreakdown && !isActive}
                                      placeholder={isDefaultBreakdown && !isActive ? '' : undefined}
                                    />
                                  </div>
                                )}
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
                              
                              {isPEBs ? (
                                // NOUVEAU: Affichage PEBs avec 3 valeurs superposées - largeur uniforme
                                isDefaultBreakdown && !isActive ? (
                                  <div className="flex flex-col space-y-1 w-full min-w-[80px] max-w-[80px] mx-auto h-12 bg-gray-100 border border-gray-200 rounded text-gray-400 text-sm flex items-center justify-center">
                                    —
                                  </div>
                                ) : (
                                  <div className="flex flex-col space-y-1 text-sm w-full flex flex-col space-y-1 w-full min-w-[80px] max-w-[80px] mx-auto">
                                    <div className="bg-blue-50 px-1 py-1 rounded text-center">
                                      {currentUnitCost || '—'}
                                    </div>
                                    <div className="bg-green-50 px-1 py-1 rounded text-center">
                                      {currentValue || '—'}
                                    </div>
                                    <div className="bg-gray-100 px-1 py-1 rounded text-gray-600 text-center">
                                      {currentTotal || '—'}
                                    </div>
                                  </div>
                                )
                              ) : (
                                // CORRIGÉ: Affichage normal - largeur uniforme 
                                isDefaultBreakdown && !isActive ? (
                                  <div className="w-full h-6 bg-gray-100 border border-gray-200 rounded text-gray-400 text-sm flex items-center justify-center">
                                    —
                                  </div>
                                ) : (
                                  <div className="w-full text-center text-sm">
                                    {currentValue || '—'}
                                  </div>
                                )
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Colonne total */}
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium">
                        {isPEBs ? (
                          // CORRIGÉ: Pour PEBs, utiliser le total calculé ligne par ligne
                          (() => {
                            const rowTotals = calculateRowTotals(tactique);
                            return rowTotals.hasNumericValues && rowTotals.total > 0 ? formatCurrency(rowTotals.total) : '—';
                          })()
                        ) : (
                          // Pour les autres types, utiliser le total standard
                          hasNumericValues && total > 0 ? formatCurrency(total) : '—'
                        )}
                      </td>

                      {/* NOUVEAU: Colonnes supplémentaires pour PEBs */}
                      {isPEBs && (() => {
                        const rowTotals = calculateRowTotals(tactique);
                        return (
                          <>
                            {/* Volume total par ligne */}
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-green-700">
                              {rowTotals.hasNumericValues ? rowTotals.volume.toFixed(2) : '—'}
                            </td>
                            {/* Coût moyen par ligne */}
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-blue-700">
                              {rowTotals.unitCostAverage > 0 ? formatCurrency(rowTotals.unitCostAverage) : '—'}
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {/* NOUVEAU: Lignes de totaux par colonne */}
            {isPEBs ? (
              // Pour PEBs: 2 lignes de totaux (Volume et Total)
              <>
                {/* Ligne totaux Volume - CORRIGÉ: Grand total dans VOL TOTAL */}
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-4 py-2 text-sm font-medium text-gray-800 sticky left-0 bg-gray-50 z-10">
                  Total Volume
                </td>
                  {periods.map((period) => {
                    const totals = columnTotals[period.id];
                    return (
                      <td key={period.id} className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                        {totals?.hasNumericValues ? totals.value.toFixed(2) : '—'}
                      </td>
                    );
                  })}
                  {/* CORRIGÉ: Colonne TOTAL vide pour Total Volume */}
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                    —
                  </td>
                  {/* CORRIGÉ: VOL TOTAL montre le grand total des volumes */}
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                    {Object.values(columnTotals).some(t => t.hasNumericValues) 
                      ? Object.values(columnTotals).reduce((sum, t) => sum + (t.hasNumericValues ? t.value : 0), 0).toFixed(2)
                      : '—'
                    }
                  </td>
                  {/* CORRIGÉ: COÛT MOY vide pour totaux */}
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                    —
                  </td>
                </tr>

                {/* Ligne totaux Total - CORRIGÉ: Grand total dans TOTAL */}
                <tr className="bg-gray-100 border-t border-gray-200">
                <td className="px-4 py-2 text-sm font-medium text-gray-800 sticky left-0 bg-gray-50 z-10">
                Total Budget
                  </td>
                  {periods.map((period) => {
                    const totals = columnTotals[period.id];
                    return (
                      <td key={period.id} className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                        {totals?.hasNumericTotal && totals.total !== undefined 
                          ? formatCurrency(totals.total) 
                          : '—'
                        }
                      </td>
                    );
                  })}
                  {/* CORRIGÉ: Colonne TOTAL additionne les totaux calculés */}
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                    {Object.values(columnTotals).some(t => t.hasNumericTotal) 
                      ? formatCurrency(Object.values(columnTotals).reduce((sum, t) => sum + (t.hasNumericTotal && t.total !== undefined ? t.total : 0), 0))
                      : '—'
                    }
                  </td>
                  {/* CORRIGÉ: VOL TOTAL vide pour Total Montant */}
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                    —
                  </td>
                  {/* CORRIGÉ: COÛT MOY vide pour totaux */}
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                    —
                  </td>
                </tr>
              </>
            ) : (
              // Pour les autres types: 1 ligne de totaux
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-4 py-2 text-sm font-medium text-gray-800">
                  Total Budget
                </td>
                {periods.map((period) => {
                  const totals = columnTotals[period.id];
                  return (
                    <td key={period.id} className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                      {totals?.hasNumericValues ? formatCurrency(totals.value) : '—'}
                    </td>
                  );
                })}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                  {Object.values(columnTotals).some(t => t.hasNumericValues) 
                    ? formatCurrency(Object.values(columnTotals).reduce((sum, t) => sum + (t.hasNumericValues ? t.value : 0), 0))
                    : '—'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}