// app/components/CostGuide/CostGuideEntryTable.tsx
/**
 * Ce fichier définit le composant `CostGuideEntryTable`, une interface interactive pour afficher et gérer les entrées d'un guide de coûts.
 * Il permet aux utilisateurs de visualiser les données sous forme de tableau, de les trier, et si les permissions le permettent, de les modifier.
 * Les fonctionnalités d'édition incluent la modification en ligne, l'ajout, la suppression, la duplication d'entrées, ainsi que la sélection multiple et le copier-coller pour une édition rapide.
 * Le composant interagit avec les services Firebase pour persister les changements et dispose d'un mode lecture seule pour les utilisateurs non autorisés.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { CostGuideEntry, PurchaseUnit, CostGuideEntryFormData } from '../../types/costGuide';
import {
  batchUpdateCostGuideEntries,
  addCostGuideEntry,
  deleteCostGuideEntry
} from '../../lib/costGuideService';
import {
  CheckIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ChevronUpDownIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

interface CostGuideEntryTableProps {
  guideId: string;
  entries: CostGuideEntry[];
  onEntriesUpdated: () => void;
  readOnly?: boolean;
}

type EditableCell = {
  entryId: string;
  field: keyof CostGuideEntry;
  value: any;
};

type SelectedCell = {
  rowIndex: number;
  field: keyof CostGuideEntry;
};

/**
 * Affiche et gère un tableau d'entrées de guide de coûts avec des fonctionnalités d'édition avancées.
 * @param {CostGuideEntryTableProps} props - Les propriétés du composant.
 * @param {string} props.guideId - L'ID du guide de coûts parent.
 * @param {CostGuideEntry[]} props.entries - La liste des entrées à afficher.
 * @param {() => void} props.onEntriesUpdated - Une fonction de rappel pour rafraîchir les données après une mise à jour.
 * @param {boolean} [props.readOnly=false] - Si vrai, le tableau est en mode lecture seule.
 * @returns {JSX.Element} Le composant de tableau des entrées du guide de coûts.
 */
export default function CostGuideEntryTable({
  guideId,
  entries,
  onEntriesUpdated,
  readOnly = false,
}: CostGuideEntryTableProps) {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [sortField, setSortField] = useState<keyof CostGuideEntry>('level1');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editableCells, setEditableCells] = useState<EditableCell[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [selectionStart, setSelectionStart] = useState<SelectedCell | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<SelectedCell | null>(null);
  const [copiedValue, setCopiedValue] = useState<any>(null);
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<CostGuideEntryFormData>>({
    level1: '',
    level2: '',
    level3: '',
    level4: '',
    purchaseUnit: 'CPM',
    unitPrice: '',
    comment: ''
  });

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (readOnly) {
      setEditMode(false);
      setEditableCells([]);
      setSelectedCells([]);
    }
  }, [readOnly]);

  /**
   * Formate un nombre en une chaîne de caractères de devise CAD.
   * @param {number} amount - Le montant numérique à formater.
   * @returns {string} Le montant formaté en devise (ex: "1 234,56 $").
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const sortedEntries = [...entries].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  useEffect(() => {
    if (readOnly) return;

    /**
     * Gère les événements d'appui sur une touche pour des actions comme le copier-coller et la sélection multiple.
     * @param {KeyboardEvent} e - L'événement du clavier.
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftKeyPressed(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedCells.length > 0) {
          const firstCell = selectedCells[0];
          const entry = sortedEntries[firstCell.rowIndex];
          const value = entry[firstCell.field];
          setCopiedValue(value);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (copiedValue !== null && selectedCells.length > 0 && editMode) {
          handlePaste();
        }
      }

      if (e.key === 'Escape') {
        setSelectedCells([]);
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    };

    /**
     * Gère les événements de relâchement d'une touche pour réinitialiser l'état de la touche Shift.
     * @param {KeyboardEvent} e - L'événement du clavier.
     */
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
  }, [selectedCells, sortedEntries, editMode, copiedValue, readOnly]);

  /**
   * Gère le tri des colonnes du tableau lorsque l'utilisateur clique sur un en-tête.
   * @param {keyof CostGuideEntry} field - Le champ sur lequel trier.
   */
  const handleSort = (field: keyof CostGuideEntry) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /**
   * Active le mode édition pour une cellule lors d'un double-clic, si le mode édition est activé.
   * @param {CostGuideEntry} entry - L'entrée de coût de la cellule.
   * @param {keyof CostGuideEntry} field - Le champ de la cellule.
   * @param {number} rowIndex - L'index de la ligne de la cellule.
   */
  const handleCellDoubleClick = (entry: CostGuideEntry, field: keyof CostGuideEntry, rowIndex: number) => {
    if (!editMode || readOnly) return;

    const editableFields: (keyof CostGuideEntry)[] = ['level1', 'level2', 'level3', 'level4', 'purchaseUnit', 'unitPrice', 'comment'];
    if (!editableFields.includes(field)) return;

    const isAlreadyEditing = editableCells.some(
      cell => cell.entryId === entry.id && cell.field === field
    );

    if (!isAlreadyEditing) {
      setEditableCells(prev => [
        ...prev,
        { entryId: entry.id, field, value: entry[field] }
      ]);

      setSelectedCells([{ rowIndex, field }]);
      setSelectionStart({ rowIndex, field });
      setSelectionEnd({ rowIndex, field });
    }
  };

  /**
   * Gère la sélection d'une ou plusieurs cellules lors d'un clic.
   * @param {number} rowIndex - L'index de la ligne de la cellule cliquée.
   * @param {keyof CostGuideEntry} field - Le champ de la cellule cliquée.
   */
  const handleCellClick = (rowIndex: number, field: keyof CostGuideEntry) => {
    if (!editMode || readOnly) return;

    const editableFields: (keyof CostGuideEntry)[] = ['level1', 'level2', 'level3', 'level4', 'purchaseUnit', 'unitPrice', 'comment'];
    if (!editableFields.includes(field)) return;

    if (isShiftKeyPressed && selectionStart) {
      const startRow = Math.min(selectionStart.rowIndex, rowIndex);
      const endRow = Math.max(selectionStart.rowIndex, rowIndex);

      if (field === selectionStart.field) {
        const newSelection: SelectedCell[] = [];
        for (let i = startRow; i <= endRow; i++) {
          newSelection.push({ rowIndex: i, field });
        }
        setSelectedCells(newSelection);
        setSelectionEnd({ rowIndex, field });
      } else {
        setSelectedCells([{ rowIndex, field }]);
        setSelectionStart({ rowIndex, field });
        setSelectionEnd({ rowIndex, field });
      }
    } else {
      setSelectedCells([{ rowIndex, field }]);
      setSelectionStart({ rowIndex, field });
      setSelectionEnd({ rowIndex, field });
    }
  };

  /**
   * Colle la valeur copiée dans les cellules actuellement sélectionnées.
   */
  const handlePaste = () => {
    if (copiedValue === null || selectedCells.length === 0 || readOnly) return;

    const newEditableCells = [...editableCells];

    selectedCells.forEach(cell => {
      const entry = sortedEntries[cell.rowIndex];

      const existingCellIndex = newEditableCells.findIndex(
        ec => ec.entryId === entry.id && ec.field === cell.field
      );

      if (existingCellIndex >= 0) {
        newEditableCells[existingCellIndex].value = copiedValue;
      } else {
        newEditableCells.push({
          entryId: entry.id,
          field: cell.field,
          value: copiedValue
        });
      }
    });

    setEditableCells(newEditableCells);
  };

  /**
   * Met à jour la valeur d'une cellule en cours d'édition dans l'état local.
   * @param {number} index - L'index de la cellule dans le tableau `editableCells`.
   * @param {any} value - La nouvelle valeur pour la cellule.
   */
  const handleCellChange = (index: number, value: any) => {
    if (readOnly) return;

    const newEditableCells = [...editableCells];
    newEditableCells[index].value = value;
    setEditableCells(newEditableCells);
  };

  /**
   * Sauvegarde toutes les modifications en attente dans Firebase.
   */
  const handleSaveChanges = async () => {
    if (editableCells.length === 0 || readOnly) return;

    try {
      setIsSaving(true);

      const updates: { id: string; updates: Record<string, any> }[] = [];

      editableCells.forEach(cell => {
        let existingUpdate = updates.find(update => update.id === cell.entryId);

        if (existingUpdate) {
          existingUpdate.updates[cell.field] = cell.value;
        } else {
          updates.push({
            id: cell.entryId,
            updates: { [cell.field]: cell.value }
          });
        }
      });
      
      console.log(`FIREBASE: ÉCRITURE - Fichier: CostGuideEntryTable.tsx - Fonction: handleSaveChanges - Path: costGuides/${guideId}/entries`);
      await batchUpdateCostGuideEntries(guideId, updates);

      setEditableCells([]);
      setSelectedCells([]);

      onEntriesUpdated();
    } catch (err) {
      console.error(t('costGuideTable.saveError'), err);
      alert(t('costGuideTable.saveErrorAlert'));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Ajoute une nouvelle entrée au guide de coûts dans Firebase.
   */
  const handleAddRow = async () => {
    if (readOnly) return;

    if (!newRowData.level1 || !newRowData.level2 || !newRowData.level3 || !newRowData.level4 || !newRowData.unitPrice) {
      alert(t('costGuideTable.fillRequiredFields'));
      return;
    }

    try {
      setIsSaving(true);
      
      console.log(`FIREBASE: ÉCRITURE - Fichier: CostGuideEntryTable.tsx - Fonction: handleAddRow - Path: costGuides/${guideId}/entries`);
      await addCostGuideEntry(
        guideId,
        {
          level1: newRowData.level1 || '',
          level2: newRowData.level2 || '',
          level3: newRowData.level3 || '',
          level4: newRowData.level4 || '',
          purchaseUnit: newRowData.purchaseUnit as PurchaseUnit || 'CPM',
          unitPrice: newRowData.unitPrice || '0',
          comment: newRowData.comment || ''
        }
      );

      setNewRowData({
        level1: '',
        level2: '',
        level3: '',
        level4: '',
        purchaseUnit: 'CPM',
        unitPrice: '',
        comment: ''
      });

      setIsAddingRow(false);
      onEntriesUpdated();
    } catch (err) {
      console.error(t('costGuideTable.addEntryError'), err);
      alert(t('costGuideTable.addEntryErrorAlert'));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Supprime une entrée du guide de coûts dans Firebase.
   * @param {string} entryId - L'ID de l'entrée à supprimer.
   */
  const handleDeleteRow = async (entryId: string) => {
    if (readOnly) return;

    if (!confirm(t('costGuideTable.confirmDeleteEntry'))) return;

    try {
      setIsSaving(true);
      console.log(`FIREBASE: ÉCRITURE - Fichier: CostGuideEntryTable.tsx - Fonction: handleDeleteRow - Path: costGuides/${guideId}/entries/${entryId}`);
      await deleteCostGuideEntry(guideId, entryId);
      onEntriesUpdated();
    } catch (err) {
      console.error(t('costGuideTable.deleteEntryError'), err);
      alert(t('costGuideTable.deleteEntryErrorAlert'));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Duplique une entrée existante en créant une nouvelle entrée avec les mêmes données.
   * @param {CostGuideEntry} entryToDuplicate - L'objet de l'entrée à dupliquer.
   */
  const handleDuplicateRow = async (entryToDuplicate: CostGuideEntry) => {
    if (readOnly) return;

    try {
      setIsSaving(true);
      
      const newEntryData: CostGuideEntryFormData = {
        level1: entryToDuplicate.level1,
        level2: entryToDuplicate.level2,
        level3: entryToDuplicate.level3,
        level4: entryToDuplicate.level4,
        purchaseUnit: entryToDuplicate.purchaseUnit,
        unitPrice: String(entryToDuplicate.unitPrice), // S'assurer que le prix est une chaîne de caractères
        comment: entryToDuplicate.comment || ''
      };
      
      console.log(`FIREBASE: ÉCRITURE - Fichier: CostGuideEntryTable.tsx - Fonction: handleDuplicateRow (via addCostGuideEntry) - Path: costGuides/${guideId}/entries`);
      await addCostGuideEntry(guideId, newEntryData);
      
      onEntriesUpdated();
    } catch (err) {
      console.error(t('costGuideTable.duplicateEntryError'), err);
      alert(t('costGuideTable.duplicateEntryErrorAlert'));
    } finally {
      setIsSaving(false);
    }
  };


  /**
   * Annule toutes les modifications en cours et réinitialise l'état de sélection.
   */
  const handleCancelChanges = () => {
    setEditableCells([]);
    setSelectedCells([]);
    setSelectionStart(null);
    setSelectionEnd(null);
    setCopiedValue(null);
  };

  /**
   * Exporte les données du tableau au format CSV.
   */
  const handleExportCSV = () => {
    if (entries.length === 0) return;

    const headers = [
      t('costGuideTable.level1'),
      t('costGuideTable.level2'),
      t('costGuideTable.level3'),
      t('costGuideTable.level4'),
      t('costGuideTable.purchaseUnit'),
      t('costGuideTable.unitPrice'),
      t('costGuideTable.comment')
    ];

    const rows = entries.map(entry => [
      entry.level1,
      entry.level2,
      entry.level3,
      entry.level4,
      entry.purchaseUnit,
      entry.unitPrice.toString(),
      entry.comment || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `guide-cout-${guideId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Vérifie si une cellule est actuellement en mode édition.
   * @param {string} entryId - L'ID de l'entrée de la cellule.
   * @param {keyof CostGuideEntry} field - Le champ de la cellule.
   * @returns {boolean} Vrai si la cellule est en cours d'édition.
   */
  const isCellEditing = (entryId: string, field: keyof CostGuideEntry) => {
    return editableCells.some(cell => cell.entryId === entryId && cell.field === field);
  };

  /**
   * Vérifie si une cellule est actuellement sélectionnée.
   * @param {number} rowIndex - L'index de la ligne de la cellule.
   * @param {keyof CostGuideEntry} field - Le champ de la cellule.
   * @returns {boolean} Vrai si la cellule est sélectionnée.
   */
  const isCellSelected = (rowIndex: number, field: keyof CostGuideEntry) => {
    return selectedCells.some(cell => cell.rowIndex === rowIndex && cell.field === field);
  };

  /**
   * Récupère la valeur modifiée d'une cellule en cours d'édition.
   * @param {string} entryId - L'ID de l'entrée de la cellule.
   * @param {keyof CostGuideEntry} field - Le champ de la cellule.
   * @returns {any | null} La valeur éditée ou null si elle n'est pas en édition.
   */
  const getEditedCellValue = (entryId: string, field: keyof CostGuideEntry) => {
    const cell = editableCells.find(cell => cell.entryId === entryId && cell.field === field);
    return cell ? cell.value : null;
  };

  /**
   * Gère les changements dans les champs du formulaire d'ajout d'une nouvelle ligne.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e - L'événement de changement.
   */
  const handleNewRowChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (readOnly) return;

    const { name, value } = e.target;
    setNewRowData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Rend une cellule du tableau, en gérant son affichage en mode normal, sélectionné ou édition.
   * @param {CostGuideEntry} entry - L'objet de données de la ligne.
   * @param {keyof CostGuideEntry} field - Le champ à rendre pour cette cellule.
   * @param {number} rowIndex - L'index de la ligne dans le tableau.
   * @returns {JSX.Element} Le `<td>` rendu pour la cellule.
   */
  const renderCell = (entry: CostGuideEntry, field: keyof CostGuideEntry, rowIndex: number) => {
    const cellClasses = `px-4 py-2 whitespace-nowrap text-sm ${
      isCellSelected(rowIndex, field) ? 'bg-indigo-100' : ''
    } ${editMode && !readOnly ? 'cursor-cell' : ''}`;

    if (isCellEditing(entry.id, field) && !readOnly) {
      const cellIndex = editableCells.findIndex(
        cell => cell.entryId === entry.id && cell.field === field
      );

      if (field === 'purchaseUnit') {
        return (
          <td
            className={cellClasses}
            onClick={() => handleCellClick(rowIndex, field)}
          >
            <select
              value={editableCells[cellIndex].value}
              onChange={(e) => handleCellChange(cellIndex, e.target.value)}
              className="w-full p-1 border border-indigo-500 rounded text-sm"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 'inherit' }}
            >
              <option value="CPM">CPM</option>
              <option value="PEB">PEB</option>
              <option value="Unitaire">Unitaire</option>
            </select>
          </td>
        );
      } else if (field === 'unitPrice') {
        return (
          <td
            className={cellClasses}
            onClick={() => handleCellClick(rowIndex, field)}
          >
            <input
              type="number"
              value={editableCells[cellIndex].value}
              onChange={(e) => handleCellChange(cellIndex, parseFloat(e.target.value) || 0)}
              className="w-full p-1 border border-indigo-500 rounded text-sm"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 'inherit' }}
            />
          </td>
        );
      } else {
        return (
          <td
            className={cellClasses}
            onClick={() => handleCellClick(rowIndex, field)}
          >
            <input
              type="text"
              value={editableCells[cellIndex].value}
              onChange={(e) => handleCellChange(cellIndex, e.target.value)}
              className="w-full p-1 border border-indigo-500 rounded text-sm"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 'inherit' }}
            />
          </td>
        );
      }
    }

    if (field === 'unitPrice') {
      return (
        <td
          className={cellClasses}
          onClick={() => handleCellClick(rowIndex, field)}
          onDoubleClick={() => handleCellDoubleClick(entry, field, rowIndex)}
        >
          {formatCurrency(entry[field] as number)}
        </td>
      );
    }

    return (
      <td
        className={cellClasses}
        onClick={() => handleCellClick(rowIndex, field)}
        onDoubleClick={() => handleCellDoubleClick(entry, field, rowIndex)}
      >
        {entry[field]}
      </td>
    );
  };

  if (entries.length === 0 && !isAddingRow) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 mb-4">
          {t('costGuideTable.noEntriesAvailable')}{!readOnly && t('costGuideTable.addEntriesForQuickEdit')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {!readOnly && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                editMode
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {editMode ? t('costGuideTable.editModeActive') : t('costGuideTable.activateEditMode')}
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            {t('costGuideTable.exportCSV')}
          </button>
        </div>

        {editMode && !readOnly && editableCells.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancelChanges}
              className="flex items-center px-4 py-2 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              disabled={isSaving}
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              {t('costGuideTable.cancel')}
            </button>
            <button
              onClick={handleSaveChanges}
              className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
              disabled={isSaving}
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              {isSaving ? t('costGuideTable.saving') : t('costGuideTable.save')}
            </button>
          </div>
        )}

      </div>

      {editMode && !readOnly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
          <p>
            <strong>{t('costGuideTable.quickEditModeTitle')}</strong> {t('costGuideTable.quickEditModeDescription')}
          </p>
        </div>
      )}

      {isAddingRow && !readOnly && (
        <div className="bg-white rounded-lg shadow p-4 border border-indigo-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">{t('costGuideTable.addNewEntry')}</h3>
            <button
              onClick={() => setIsAddingRow(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label htmlFor="level1" className="block text-sm font-medium text-gray-700">
                {t('costGuideTable.level1')} *
              </label>
              <input
                type="text"
                id="level1"
                name="level1"
                value={newRowData.level1}
                onChange={handleNewRowChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="level2" className="block text-sm font-medium text-gray-700">
                {t('costGuideTable.level2')} *
              </label>
              <input
                type="text"
                id="level2"
                name="level2"
                value={newRowData.level2}
                onChange={handleNewRowChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label htmlFor="level3" className="block text-sm font-medium text-gray-700">
                {t('costGuideTable.level3')} *
              </label>
              <input
                type="text"
                id="level3"
                name="level3"
                value={newRowData.level3}
                onChange={handleNewRowChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="level4" className="block text-sm font-medium text-gray-700">
                {t('costGuideTable.level4')} *
              </label>
              <input
                type="text"
                id="level4"
                name="level4"
                value={newRowData.level4}
                onChange={handleNewRowChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label htmlFor="purchaseUnit" className="block text-sm font-medium text-gray-700">
                {t('costGuideTable.purchaseUnit')} *
              </label>
              <select
                id="purchaseUnit"
                name="purchaseUnit"
                value={newRowData.purchaseUnit}
                onChange={handleNewRowChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="CPM">CPM</option>
                <option value="PEB">PEB</option>
                <option value="Unitaire">Unitaire</option>
              </select>
            </div>

            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">
                {t('costGuideTable.unitPriceAmount')} * (CAD)
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="unitPrice"
                  name="unitPrice"
                  value={newRowData.unitPrice}
                  onChange={handleNewRowChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 pl-7 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              {t('costGuideTable.comment')}
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={3}
              value={newRowData.comment}
              onChange={handleNewRowChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={t('costGuideTable.additionalInfoPlaceholder')}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAddingRow(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('costGuideTable.cancel')}
            </button>
            <button
              type="button"
              onClick={handleAddRow}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              disabled={isSaving}
            >
              {isSaving ? t('costGuideTable.addingInProgress') : t('costGuideTable.add')}
            </button>
          </div>
        </div>
      )}

      {(entries.length > 0 || isAddingRow) && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" ref={tableRef}>
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { key: 'level1', label: t('costGuideTable.level1') },
                    { key: 'level2', label: t('costGuideTable.level2') },
                    { key: 'level3', label: t('costGuideTable.level3') },
                    { key: 'level4', label: t('costGuideTable.level4') },
                    { key: 'purchaseUnit', label: t('costGuideTable.purchaseUnit') },
                    { key: 'unitPrice', label: t('costGuideTable.unitPrice') },
                    { key: 'comment', label: t('costGuideTable.comment') },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort(key as keyof CostGuideEntry)}
                    >
                      <div className="flex items-center">
                        <span>{label}</span>
                        <ChevronUpDownIcon
                          className={`ml-1 h-4 w-4 ${
                            sortField === key ? 'text-indigo-500' : 'text-gray-400'
                          }`}
                        />
                      </div>
                    </th>
                  ))}
                  {!readOnly && (
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('costGuideTable.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEntries.map((entry, rowIndex) => (
                  <tr key={entry.id} className={`hover:bg-gray-50 ${editMode && !readOnly ? 'cursor-pointer' : ''}`}>
                    {renderCell(entry, 'level1', rowIndex)}
                    {renderCell(entry, 'level2', rowIndex)}
                    {renderCell(entry, 'level3', rowIndex)}
                    {renderCell(entry, 'level4', rowIndex)}
                    {renderCell(entry, 'purchaseUnit', rowIndex)}
                    {renderCell(entry, 'unitPrice', rowIndex)}
                    {renderCell(entry, 'comment', rowIndex)}
                    {!readOnly && (
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {editMode && (
                            <button
                              onClick={() => handleDuplicateRow(entry)}
                              className="text-blue-600 hover:text-blue-900"
                              title={t('costGuideTable.duplicateRow')}
                            >
                              <DocumentDuplicateIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRow(entry.id)}
                            className="text-red-600 hover:text-red-900"
                            title={t('costGuideTable.deleteRow')}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {sortedEntries.length === 0 && !isAddingRow && (
                  <tr>
                    <td colSpan={readOnly ? 7 : 8} className="px-4 py-4 text-center text-gray-500">
                      {t('costGuideTable.noEntriesAvailable')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {readOnly && (
        <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                {t('costGuideTable.readOnlyModeMessage')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}