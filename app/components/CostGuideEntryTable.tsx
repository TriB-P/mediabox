'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CostGuideEntry, PurchaseUnit } from '../types/costGuide';
import { batchUpdateCostGuideEntries } from '../lib/costGuideService';
import { 
  CheckIcon, 
  XMarkIcon,
  ArrowDownTrayIcon,
  ChevronUpDownIcon
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
  const handleCellDoubleClick = (entry: CostGuideEntry, field: keyof CostGuideEntry) => {
    if (!editMode) return;
    
    // Vérifier si le champ est éditable
    const editableFields: (keyof CostGuideEntry)[] = ['level1', 'level2', 'level3', 'purchaseUnit', 'unitPrice', 'comment'];
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
    }
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
      
      // Rafraîchir les entrées
      onEntriesUpdated();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des modifications:', err);
      alert('Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  // Annuler les modifications
  const handleCancelChanges = () => {
    setEditableCells([]);
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
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
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

  // Obtenir la valeur éditée d'une cellule
  const getEditedCellValue = (entryId: string, field: keyof CostGuideEntry) => {
    const cell = editableCells.find(cell => cell.entryId === entryId && cell.field === field);
    return cell ? cell.value : null;
  };

  // Rendu d'une cellule en fonction de son état
  const renderCell = (entry: CostGuideEntry, field: keyof CostGuideEntry) => {
    // Si la cellule est en cours d'édition
    if (isCellEditing(entry.id, field)) {
      const cellIndex = editableCells.findIndex(
        cell => cell.entryId === entry.id && cell.field === field
      );
      
      // Différents contrôles en fonction du type de champ
      if (field === 'purchaseUnit') {
        return (
          <select
            value={editableCells[cellIndex].value}
            onChange={(e) => handleCellChange(cellIndex, e.target.value)}
            className="w-full p-1 border border-indigo-500 rounded"
            autoFocus
          >
            <option value="CPM">CPM</option>
            <option value="PEB">PEB</option>
            <option value="Unitaire">Unitaire</option>
          </select>
        );
      } else if (field === 'unitPrice') {
        return (
          <input
            type="number"
            value={editableCells[cellIndex].value}
            onChange={(e) => handleCellChange(cellIndex, parseFloat(e.target.value) || 0)}
            className="w-full p-1 border border-indigo-500 rounded"
            autoFocus
          />
        );
      } else {
        return (
          <input
            type="text"
            value={editableCells[cellIndex].value}
            onChange={(e) => handleCellChange(cellIndex, e.target.value)}
            className="w-full p-1 border border-indigo-500 rounded"
            autoFocus
          />
        );
      }
    }
    
    // Affichage normal
    if (field === 'unitPrice') {
      return formatCurrency(entry[field] as number);
    }
    
    return entry[field];
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">
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
            <strong>Mode édition rapide :</strong> Double-cliquez sur une cellule pour la modifier. 
            Cliquez sur Enregistrer pour sauvegarder vos modifications.
          </p>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" ref={tableRef}>
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: 'partnerName', label: 'Partenaire' },
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.partnerName}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                      editMode ? 'cursor-cell' : ''
                    }`}
                    onDoubleClick={() => handleCellDoubleClick(entry, 'level1')}
                  >
                    {renderCell(entry, 'level1')}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                      editMode ? 'cursor-cell' : ''
                    }`}
                    onDoubleClick={() => handleCellDoubleClick(entry, 'level2')}
                  >
                    {renderCell(entry, 'level2')}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                      editMode ? 'cursor-cell' : ''
                    }`}
                    onDoubleClick={() => handleCellDoubleClick(entry, 'level3')}
                  >
                    {renderCell(entry, 'level3')}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                      editMode ? 'cursor-cell' : ''
                    }`}
                    onDoubleClick={() => handleCellDoubleClick(entry, 'purchaseUnit')}
                  >
                    {renderCell(entry, 'purchaseUnit')}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                      editMode ? 'cursor-cell' : ''
                    }`}
                    onDoubleClick={() => handleCellDoubleClick(entry, 'unitPrice')}
                  >
                    {renderCell(entry, 'unitPrice')}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${
                      editMode ? 'cursor-cell' : ''
                    }`}
                    onDoubleClick={() => handleCellDoubleClick(entry, 'comment')}
                  >
                    {renderCell(entry, 'comment')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}