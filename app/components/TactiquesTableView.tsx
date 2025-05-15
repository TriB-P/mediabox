'use client';

import React, { useState, useEffect } from 'react';
import { Tactique } from '../types/tactiques';
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TactiquesTableViewProps {
  tactiques: Tactique[];
  onUpdateTactique: (tactiqueId: string, sectionId: string, updates: Partial<Tactique>) => void;
  onDeleteTactique: (tactiqueId: string, sectionId: string) => void;
  formatCurrency: (amount: number) => string;
  sectionNames: { [key: string]: string }; // Objet clé-valeur pour afficher les noms des sections
}

export default function TactiquesTableView({
  tactiques,
  onUpdateTactique,
  onDeleteTactique,
  formatCurrency,
  sectionNames
}: TactiquesTableViewProps) {
  // État pour la gestion des lignes en cours d'édition
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Tactique>>({});

  // État pour le tri
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Tactique | 'sectionName';
    direction: 'asc' | 'desc';
  }>({
    key: 'TC_Order',
    direction: 'asc'
  });

  // État pour le filtrage
  const [filters, setFilters] = useState({
    search: '',
    section: ''
  });

  // Tactiques filtrées et triées
  const [filteredTactiques, setFilteredTactiques] = useState<Tactique[]>([]);

  // Appliquer le filtrage et le tri lorsque les tactiques ou les filtres changent
  useEffect(() => {
    let result = [...tactiques];

    // Appliquer les filtres
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(tactique => 
        tactique.TC_Label.toLowerCase().includes(searchLower)
      );
    }

    if (filters.section) {
      result = result.filter(tactique => 
        tactique.TC_SectionId === filters.section
      );
    }

    // Appliquer le tri
    result.sort((a, b) => {
      if (sortConfig.key === 'sectionName') {
        const aValue = sectionNames[a.TC_SectionId] || '';
        const bValue = sectionNames[b.TC_SectionId] || '';
        
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      } else {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      }
    });

    setFilteredTactiques(result);
  }, [tactiques, filters, sortConfig, sectionNames]);

  // Démarrer l'édition d'une ligne
  const handleEditClick = (tactique: Tactique) => {
    setEditingRow(tactique.id);
    setEditFormData({
      TC_Label: tactique.TC_Label,
      TC_Budget: tactique.TC_Budget,
      TC_StartDate: tactique.TC_StartDate,
      TC_EndDate: tactique.TC_EndDate,
      TC_Status: tactique.TC_Status,
      TC_Format: tactique.TC_Format,
      TC_Placement: tactique.TC_Placement
    });
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditFormData({});
  };

  // Sauvegarder les modifications
  const handleSaveEdit = (tactiqueId: string, sectionId: string) => {
    onUpdateTactique(tactiqueId, sectionId, editFormData);
    setEditingRow(null);
    setEditFormData({});
  };

  // Gérer les changements dans le formulaire d'édition
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Convertir les valeurs numériques
    if (type === 'number') {
      setEditFormData({
        ...editFormData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };

  // Gérer le changement de tri
  const handleSort = (key: keyof Tactique | 'sectionName') => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortConfig({
        key,
        direction: 'asc'
      });
    }
  };

  // Gérer le changement de filtre
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Définir les sections disponibles pour le filtre
  const uniqueSections = Array.from(new Set(tactiques.map(t => t.TC_SectionId)));

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow flex gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Recherche
          </label>
          <input
            type="text"
            id="search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Rechercher une tactique..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="w-1/3">
          <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
            Filtrer par section
          </label>
          <select
            id="section"
            name="section"
            value={filters.section}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Toutes les sections</option>
            {uniqueSections.map(sectionId => (
              <option key={sectionId} value={sectionId}>
                {sectionNames[sectionId] || 'Section sans nom'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('TC_Label')}
                >
                  <div className="flex items-center">
                    Tactique
                    {sortConfig.key === 'TC_Label' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('sectionName')}
                >
                  <div className="flex items-center">
                    Section
                    {sortConfig.key === 'sectionName' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('TC_Budget')}
                >
                  <div className="flex items-center">
                    Budget
                    {sortConfig.key === 'TC_Budget' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('TC_StartDate')}
                >
                  <div className="flex items-center">
                    Début
                    {sortConfig.key === 'TC_StartDate' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('TC_EndDate')}
                >
                  <div className="flex items-center">
                    Fin
                    {sortConfig.key === 'TC_EndDate' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('TC_Status')}
                >
                  <div className="flex items-center">
                    Statut
                    {sortConfig.key === 'TC_Status' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('TC_Format')}
                >
                  <div className="flex items-center">
                    Format
                    {sortConfig.key === 'TC_Format' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTactiques.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucune tactique trouvée
                  </td>
                </tr>
              ) : (
                filteredTactiques.map(tactique => (
                  <tr key={tactique.id}>
                    {editingRow === tactique.id ? (
                      // Mode édition
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            name="TC_Label"
                            value={editFormData.TC_Label || ''}
                            onChange={handleEditFormChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sectionNames[tactique.TC_SectionId] || 'Section sans nom'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            name="TC_Budget"
                            value={editFormData.TC_Budget || 0}
                            onChange={handleEditFormChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="date"
                            name="TC_StartDate"
                            value={editFormData.TC_StartDate || ''}
                            onChange={handleEditFormChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="date"
                            name="TC_EndDate"
                            value={editFormData.TC_EndDate || ''}
                            onChange={handleEditFormChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            name="TC_Status"
                            value={editFormData.TC_Status || 'Planned'}
                            onChange={handleEditFormChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          >
                            <option value="Planned">Planifiée</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Terminée</option>
                            <option value="Cancelled">Annulée</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            name="TC_Format"
                            value={editFormData.TC_Format || ''}
                            onChange={handleEditFormChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            placeholder="ex: 300x250"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleSaveEdit(tactique.id, tactique.TC_SectionId)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // Mode affichage
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tactique.TC_Label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sectionNames[tactique.TC_SectionId] || 'Section sans nom'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(tactique.TC_Budget)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tactique.TC_StartDate || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tactique.TC_EndDate || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tactique.TC_Status === 'Active' ? 'bg-green-100 text-green-800' :
                            tactique.TC_Status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                            tactique.TC_Status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tactique.TC_Status === 'Active' ? 'Active' :
                             tactique.TC_Status === 'Completed' ? 'Terminée' :
                             tactique.TC_Status === 'Cancelled' ? 'Annulée' :
                             'Planifiée'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tactique.TC_Format || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditClick(tactique)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => onDeleteTactique(tactique.id, tactique.TC_SectionId)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}