'use client';

import React, { useState, useEffect } from 'react';
import { DynamicList } from '../types/shortcode';
import { getDynamicLists, deleteDynamicList } from '../lib/dynamicListService';
import DynamicListDrawer from '../components/DynamicListDrawer';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useClient } from '../contexts/ClientContext';

export default function DynamicListsPage() {
  const { selectedClient } = useClient();
  const [lists, setLists] = useState<DynamicList[]>([]);
  const [selectedList, setSelectedList] = useState<DynamicList | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGlobal, setShowGlobal] = useState(true);

  useEffect(() => {
    if (selectedClient) {
      loadLists();
    }
  }, [selectedClient]);

  const loadLists = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getDynamicLists(selectedClient.clientId);
      setLists(data);
    } catch (err) {
      setError('Erreur lors du chargement des listes dynamiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) {
      try {
        await deleteDynamicList(id);
        await loadLists();
      } catch (err) {
        setError('Erreur lors de la suppression de la liste');
        console.error(err);
      }
    }
  };

  const filteredLists = lists.filter((list) => {
    const matchesSearch = 
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = showGlobal || list.clientId === selectedClient?.clientId;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Listes dynamiques</h2>
          <p className="text-gray-600">
            Gérez vos listes déroulantes personnalisées{' '}
            {selectedClient ? `pour ${selectedClient.CL_Name}` : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedList(null);
            setIsDrawerOpen(true);
          }}
          disabled={!selectedClient}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            selectedClient
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Ajouter une liste
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Rechercher une liste..."
          />
        </div>
        
        <div className="flex items-center">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showGlobal}
              onChange={(e) => setShowGlobal(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Afficher les listes globales
            </span>
          </label>
        </div>
      </div>

      {/* Gestion des états de chargement et d'erreur */}
      {!selectedClient && (
        <div className="text-center py-8 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700">
            Veuillez sélectionner un client dans le menu déroulant ci-dessus.
          </p>
        </div>
      )}

      {loading && selectedClient && (
        <div className="text-center py-8">
          <p className="text-gray-500">Chargement des listes dynamiques...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tableau des listes */}
      {!loading && filteredLists.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom de la liste
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom d'affichage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Portée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valeurs
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLists.map((list) => (
                <tr key={list.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {list.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{list.displayName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      list.clientId === 'global'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {list.clientId === 'global' ? 'Globale' : 'Client'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {list.values.filter(v => v.isActive).length} valeurs actives
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedList(list);
                        setIsDrawerOpen(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Modifier
                    </button>
                    {/* N'autoriser la suppression que pour les listes du client actuel, pas les listes globales */}
                    {list.clientId !== 'global' && (
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Message si aucune liste après filtrage */}
      {!loading && filteredLists.length === 0 && searchQuery && (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            Aucune liste ne correspond à votre recherche.
          </p>
        </div>
      )}

      {/* Message si aucune liste */}
      {!loading && lists.length === 0 && !searchQuery && selectedClient && (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            Aucune liste trouvée. Créez votre première liste dynamique !
          </p>
        </div>
      )}

      {/* Drawer pour créer/éditer une liste */}
      <DynamicListDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedList(null);
        }}
        list={selectedList}
        clientId={selectedClient?.clientId || ''}
        onSave={loadLists}
      />
    </div>
  );
}