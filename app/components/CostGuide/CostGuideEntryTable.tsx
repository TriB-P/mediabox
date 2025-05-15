'use client';

import { useState, useEffect, useRef } from 'react';
import { CostGuideEntry, PurchaseUnit, CostGuideEntryFormData } from '../../types/costGuide';
import { 
  batchUpdateCostGuideEntries, 
  addCostGuideEntry,
  deleteCostGuideEntry,
  duplicateCostGuideEntry
} from '../../lib/costGuideService';
import { 
  CheckIcon, 
  XMarkIcon,
  ArrowDownTrayIcon,
  ChevronUpDownIcon,
  DocumentDuplicateIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface CostGuideEntryTableProps {
  guideId: string;
  entries: CostGuideEntry[];
  partners: any[];
  onEntriesUpdated: () => void;
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

export default function CostGuideEntryTable({
  guideId,
  entries,
  partners,
  onEntriesUpdated,
}: CostGuideEntryTableProps) {
  const [editMode, setEditMode] = useState(false);
  const [sortField, setSortField] = useState<keyof CostGuideEntry>('partnerName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editableCells, setEditableCells] = useState<EditableCell[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Nouvelle logique pour la sélection multiple
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [selectionStart, setSelectionStart] = useState<SelectedCell | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<SelectedCell | null>(null);
  const [copiedValue, setCopiedValue] = useState<any>(null);
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<CostGuideEntryFormData>>({
    partnerId: '',
    level1: '',
    level2: '',
    level3: '',
    purchaseUnit: 'CPM',
    unitPrice: '',
    comment: ''
  });
  
  const tableRef = useRef<HTMLTableElement>(null);

  // Formatter le montant en devise
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  // Trier les entrées
  const sortedEntries = [...entries].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    // Gérer les cas spéciaux pour le tri
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Gérer les touches pour la sélection et la copie
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift pour la sélection multiple
      if (e.key === 'Shift') {
        setIsShiftKeyPressed(true);
      }
      
      // Ctrl+C ou Command+C pour copier
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedCells.length > 0) {
          // Copier la valeur de la première cellule sélectionnée
          const firstCell = selectedCells[0];
          const entry = sortedEntries[firstCell.rowIndex];
          const value = entry[firstCell.field];
          setCopiedValue(value);
        }
      }
      
      // Ctrl+V ou Command+V pour coller
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (copiedValue !== null && selectedCells.length > 0 && editMode) {
          handlePaste();
        }
      }
      
      // Échap pour annuler la sélection
      if (e.key === 'Escape') {
        setSelectedCells([]);
        setSelectionStart(null);
        setSelectionEnd(null);
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
  }, [selectedCells, sortedEntries, editMode, copiedValue]);

  // Gérer le clic sur un en-tête pour trier
  const handleSort = (field: keyof CostGuideEntry) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Gérer le double-clic sur une cellule pour l'éditer
  const handleCellDoubleClick = (entry: CostGuideEntry, field: keyof CostGuideEntry, rowIndex: number) => {
    if (!editMode) return;
    
    // Vérifier si le champ est éditable
    const editableFields: (keyof CostGuideEntry)[] = ['partnerId', 'level1', 'level2', 'level3', 'purchaseUnit', 'unitPrice', 'comment'];
    if (!editableFields.includes(field)) return;
    
    // Vérifier si la cellule est déjà en cours d'édition
    const isAlreadyEditing = editableCells.some(
      cell => cell.entryId === entry.id && cell.field === field
    );
    
    if (!isAlreadyEditing) {
      setEditableCells(prev => [
        ...prev,
        { entryId: entry.id, field, value: entry[field] }
      ]);
      
      // Définir cette cellule comme sélectionnée
      setSelectedCells([{ rowIndex, field }]);
      setSelectionStart({ rowIndex, field });
      setSelectionEnd({ rowIndex, field });
    }
  };

  // Gérer le clic sur une cellule pour la sélection
  const handleCellClick = (rowIndex: number, field: keyof CostGuideEntry) => {
    if (!editMode) return;
    
    // Déterminer si la cellule est éditable
    const editableFields: (keyof CostGuideEntry)[] = ['partnerId', 'level1', 'level2', 'level3', 'purchaseUnit', 'unitPrice', 'comment'];
    if (!editableFields.includes(field)) return;
    
    // Si Shift est pressé, étendre la sélection
    if (isShiftKeyPressed && selectionStart) {
      // Calculer la plage entre selectionStart et cette cellule
      const startRow = Math.min(selectionStart.rowIndex, rowIndex);
      const endRow = Math.max(selectionStart.rowIndex, rowIndex);
      
      // Pour l'instant, on gère uniquement la sélection dans la même colonne
      if (field === selectionStart.field) {
        const newSelection: SelectedCell[] = [];
        for (let i = startRow; i <= endRow; i++) {
          newSelection.push({ rowIndex: i, field });
        }
        setSelectedCells(newSelection);
        setSelectionEnd({ rowIndex, field });
      } else {
        // Sélection d'une seule cellule si la colonne est différente
        setSelectedCells([{ rowIndex, field }]);
        setSelectionStart({ rowIndex, field });
        setSelectionEnd({ rowIndex, field });
      }
    } else {
      // Sélection d'une seule cellule
      setSelectedCells([{ rowIndex, field }]);
      setSelectionStart({ rowIndex, field });
      setSelectionEnd({ rowIndex, field });
    }
  };

  // Gérer le collage de valeurs
  const handlePaste = () => {
    if (copiedValue === null || selectedCells.length === 0) return;
    
    // Créer de nouvelles cellules éditables avec la valeur copiée
    const newEditableCells = [...editableCells];
    
    selectedCells.forEach(cell => {
      const entry = sortedEntries[cell.rowIndex];
      
      // Vérifier si cette cellule est déjà en édition
      const existingCellIndex = newEditableCells.findIndex(
        ec => ec.entryId === entry.id && ec.field === cell.field
      );
      
      if (existingCellIndex >= 0) {
        // Mettre à jour la cellule existante
        newEditableCells[existingCellIndex].value = copiedValue;
      } else {
        // Ajouter une nouvelle cellule
        newEditableCells.push({
          entryId: entry.id,
          field: cell.field,
          value: copiedValue
        });
      }
    });
    
    setEditableCells(newEditableCells);
  };

  // Mettre à jour la valeur d'une cellule éditable
  const handleCellChange = (index: number, value: any) => {
    const newEditableCells = [...editableCells];
    newEditableCells[index].value = value;
    setEditableCells(newEditableCells);
  };

  // Sauvegarder les modifications
  const handleSaveChanges = async () => {
    if (editableCells.length === 0) return;
    
    try {
      setIsSaving(true);
      
      // Regrouper les mises à jour par entrée
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
      
      // Envoyer les mises à jour
      await batchUpdateCostGuideEntries(guideId, updates);
      
      // Effacer les cellules éditables
      setEditableCells([]);
      setSelectedCells([]);
      
      // Rafraîchir les entrées
      onEntriesUpdated();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des modifications:', err);
      alert('Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  // Ajouter une nouvelle ligne
  const handleAddRow = async () => {
    if (!newRowData.partnerId || !newRowData.level1 || !newRowData.level2 || !newRowData.level3 || !newRowData.unitPrice) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      setIsSaving(true);
      
      // Trouver le nom du partenaire
      const selectedPartner = partners.find(p => p.id === newRowData.partnerId);
      const partnerName = selectedPartner ? selectedPartner.SH_Display_Name_FR : '';
      
      // Créer la nouvelle entrée
      await addCostGuideEntry(
        guideId, 
        {
          partnerId: newRowData.partnerId || '',
          level1: newRowData.level1 || '',
          level2: newRowData.level2 || '',
          level3: newRowData.level3 || '',
          purchaseUnit: newRowData.purchaseUnit as PurchaseUnit || 'CPM',
          unitPrice: newRowData.unitPrice || '0',
          comment: newRowData.comment || ''
        },
        partnerName
      );
      
      // Réinitialiser le formulaire
      setNewRowData({
        partnerId: '',
        level1: '',
        level2: '',
        level3: '',
        purchaseUnit: 'CPM',
        unitPrice: '',
        comment: ''
      });
      
      // Cacher le formulaire
      setIsAddingRow(false);
      
      // Rafraîchir les entrées
      onEntriesUpdated();
    } catch (err) {
      console.error('Erreur lors de l\'ajout d\'une entrée:', err);
      alert('Une erreur est survenue lors de l\'ajout de l\'entrée.');
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer une ligne
  const handleDeleteRow = async (entryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;
    
    try {
      setIsSaving(true);
      await deleteCostGuideEntry(guideId, entryId);
      onEntriesUpdated();
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'entrée:', err);
      alert('Une erreur est survenue lors de la suppression.');
    } finally {
      setIsSaving(false);
    }
  };

  // Dupliquer une ligne
  const handleDuplicateRow = async (entryId: string) => {
    try {
      setIsSaving(true);
      await duplicateCostGuideEntry(guideId, entryId);
      onEntriesUpdated();
    } catch (err) {
      console.error('Erreur lors de la duplication de l\'entrée:', err);
      alert('Une erreur est survenue lors de la duplication.');
    } finally {
      setIsSaving(false);
    }
  };

  // Annuler les modifications
  const handleCancelChanges = () => {
    setEditableCells([]);
    setSelectedCells([]);
    setSelectionStart(null);
    setSelectionEnd(null);
    setCopiedValue(null);
  };

  // Exporter en CSV
  const handleExportCSV = () => {
    if (entries.length === 0) return;
    
    // Construire l'en-tête CSV
    const headers = [
      'Partenaire',
      'Niveau 1',
      'Niveau 2', 
      'Niveau 3',
      'Unité d\'achat',
      'Prix unitaire',
      'Commentaire'
    ];
    
    // Construire les lignes de données
    const rows = entries.map(entry => [
      entry.partnerName,
      entry.level1,
      entry.level2,
      entry.level3,
      entry.purchaseUnit,
      entry.unitPrice.toString(),
      entry.comment || ''
    ]);
    
    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `guide-cout-${guideId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour savoir si une cellule est en cours d'édition
  const isCellEditing = (entryId: string, field: keyof CostGuideEntry) => {
    return editableCells.some(cell => cell.entryId === entryId && cell.field === field);
  };

  // Fonction pour savoir si une cellule est sélectionnée
  const isCellSelected = (rowIndex: number, field: keyof CostGuideEntry) => {
    return selectedCells.some(cell => cell.rowIndex === rowIndex && cell.field === field);
  };

  // Obtenir la valeur éditée d'une cellule
  const getEditedCellValue = (entryId: string, field: keyof CostGuideEntry) => {
    const cell = editableCells.find(cell => cell.entryId === entryId && cell.field === field);
    return cell ? cell.value : null;
  };

  // Mettre à jour un champ de la nouvelle ligne
  const handleNewRowChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRowData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Rendu d'une cellule en fonction de son état
  const renderCell = (entry: CostGuideEntry, field: keyof CostGuideEntry, rowIndex: number) => {
    // Classes CSS pour la cellule
    const cellClasses = `px-4 py-2 whitespace-nowrap text-sm ${
      isCellSelected(rowIndex, field) ? 'bg-indigo-100' : ''
    } ${editMode ? 'cursor-cell' : ''}`;
    
    // Si la cellule est en cours d'édition
    if (isCellEditing(entry.id, field)) {
      const cellIndex = editableCells.findIndex(
        cell => cell.entryId === entry.id && cell.field === field
      );
      
      // Différents contrôles en fonction du type de champ
      if (field === 'partnerId') {
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
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.SH_Display_Name_FR}
                </option>
              ))}
            </select>
          </td>
        );
      } else if (field === 'purchaseUnit') {
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
    
    // Affichage normal
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
    } else if (field === 'partnerId') {
      // Pour le champ partnerId, on affiche le nom du partenaire mais on stocke l'ID
      return (
        <td 
          className={cellClasses}
          onClick={() => handleCellClick(rowIndex, field)}
          onDoubleClick={() => handleCellDoubleClick(entry, field, rowIndex)}
        >
          {entry.partnerName}
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
          Aucune entrée disponible. Ajoutez des entrées pour utiliser l'édition rapide.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              editMode
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {editMode ? 'Mode édition activé' : 'Activer l\'édition'}
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Exporter CSV
          </button>
        </div>
        
        {editMode && editableCells.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancelChanges}
              className="flex items-center px-4 py-2 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              disabled={isSaving}
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Annuler
            </button>
            <button
              onClick={handleSaveChanges}
              className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
              disabled={isSaving}
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {editMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
          <p>
            <strong>Mode édition rapide :</strong> Cliquez pour sélectionner une cellule. Maintenez Shift pour sélectionner plusieurs cellules. 
            Double-cliquez pour modifier une cellule. Utilisez Ctrl+C/⌘+C pour copier et Ctrl+V/⌘+V pour coller sur les cellules sélectionnées.
          </p>
        </div>
      )}

      {/* Formulaire d'ajout de ligne */}
      {isAddingRow && (
        <div className="bg-white rounded-lg shadow p-4 border border-indigo-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Ajouter une nouvelle entrée</h3>
            <button
              onClick={() => setIsAddingRow(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
            <div>
              <label htmlFor="partnerId" className="block text-sm font-medium text-gray-700">
                Partenaire *
              </label>
              <select
                id="partnerId"
                name="partnerId"
                value={newRowData.partnerId}
                onChange={handleNewRowChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Sélectionner un partenaire</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.SH_Display_Name_FR}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="level1" className="block text-sm font-medium text-gray-700">
                Niveau 1 *
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
                Niveau 2 *
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
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
            <div>
              <label htmlFor="level3" className="block text-sm font-medium text-gray-700">
                Niveau 3 *
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
              <label htmlFor="purchaseUnit" className="block text-sm font-medium text-gray-700">
                Unité d'achat *
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
                Montant unitaire * (CAD)
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
              Commentaire
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={3}
              value={newRowData.comment}
              onChange={handleNewRowChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Informations supplémentaires..."
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAddingRow(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAddRow}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              disabled={isSaving}
            >
              {isSaving ? 'Ajout en cours...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Tableau */}
      {(entries.length > 0 || isAddingRow) && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" ref={tableRef}>
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { key: 'partnerId', label: 'Partenaire' },
                    { key: 'level1', label: 'Niveau 1' },
                    { key: 'level2', label: 'Niveau 2' },
                    { key: 'level3', label: 'Niveau 3' },
                    { key: 'purchaseUnit', label: 'Unité d\'achat' },
                    { key: 'unitPrice', label: 'Prix unitaire' },
                    { key: 'comment', label: 'Commentaire' },
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
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEntries.map((entry, rowIndex) => (
                  <tr key={entry.id} className={`hover:bg-gray-50 ${editMode ? 'cursor-pointer' : ''}`}>
                    {renderCell(entry, 'partnerId', rowIndex)}
                    {renderCell(entry, 'level1', rowIndex)}
                    {renderCell(entry, 'level2', rowIndex)}
                    {renderCell(entry, 'level3', rowIndex)}
                    {renderCell(entry, 'purchaseUnit', rowIndex)}
                    {renderCell(entry, 'unitPrice', rowIndex)}
                    {renderCell(entry, 'comment', rowIndex)}
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {editMode && (
                          <button
                            onClick={() => handleDuplicateRow(entry.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Dupliquer cette ligne"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRow(entry.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer cette ligne"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedEntries.length === 0 && !isAddingRow && (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                      Aucune entrée disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}