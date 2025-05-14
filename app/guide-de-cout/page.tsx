'use client';

import { useState, useEffect } from 'react';
import { CostGuide, CostGuideEntry } from '../types/costGuide';
import {
  getCostGuides,
  createCostGuide,
  deleteCostGuide,
  updateCostGuide,
  getCostGuideEntries,
} from '../lib/costGuideService';
import { getPartnersList } from '../lib/listService';
import {
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PencilIcon,
  TableCellsIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import CostGuideEntryForm from '../components/CostGuideEntryForm';
import CostGuideEntryList from '../components/CostGuideEntryList';
import CostGuideEntryTable from '../components/CostGuideEntryTable';

export default function CostGuidePage() {
  // États pour la liste des guides
  const [guides, setGuides] = useState<CostGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGuideName, setNewGuideName] = useState('');
  const [newGuideDescription, setNewGuideDescription] = useState('');
  
  // États pour le guide détaillé
  const [selectedGuide, setSelectedGuide] = useState<CostGuide | null>(null);
  const [entries, setEntries] = useState<CostGuideEntry[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CostGuideEntry | null>(null);
  
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  // Charger la liste des guides au chargement initial
  useEffect(() => {
    loadGuides();
    console.log('CostGuideEntryForm:', CostGuideEntryForm);
console.log('CostGuideEntryList:', CostGuideEntryList); 
console.log('CostGuideEntryTable:', CostGuideEntryTable);
  }, []);

  // Charger les guides
  const loadGuides = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCostGuides();
      setGuides(data);
    } catch (err) {
      setError('Erreur lors du chargement des guides de coût');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Charger un guide détaillé
  const loadGuideDetails = async (guideId: string) => {
    try {
      setLoadingDetail(true);
      
      // Trouver le guide dans la liste
      const guide = guides.find(g => g.id === guideId);
      if (!guide) {
        setError('Guide de coût non trouvé');
        return;
      }
      
      setSelectedGuide(guide);
      setEditedName(guide.name);
      setEditedDescription(guide.description);
      
      // Charger les entrées
      const entriesData = await getCostGuideEntries(guideId);
      setEntries(entriesData);
      
      // Charger les partenaires
      const partnersData = await getPartnersList();
      setPartners(partnersData);
    } catch (err) {
      console.error('Erreur lors du chargement du guide:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Créer un nouveau guide
  const handleCreateGuide = async () => {
    if (!newGuideName.trim()) return;

    try {
      setLoading(true);
      const guideId = await createCostGuide({
        name: newGuideName,
        description: newGuideDescription,
      });
      await loadGuides();
      setIsCreateModalOpen(false);
      setNewGuideName('');
      setNewGuideDescription('');
      
      // Charger le nouveau guide automatiquement
      await loadGuideDetails(guideId);
    } catch (err) {
      setError('Erreur lors de la création du guide');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un guide
  const handleDeleteGuide = async (guideId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce guide de coût ?')) return;

    try {
      setLoading(true);
      await deleteCostGuide(guideId);
      
      // Si on supprime le guide actuellement sélectionné
      if (selectedGuide && selectedGuide.id === guideId) {
        setSelectedGuide(null);
      }
      
      await loadGuides();
    } catch (err) {
      setError('Erreur lors de la suppression du guide');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un guide
  const handleUpdateGuide = async () => {
    if (!selectedGuide) return;
    
    try {
      await updateCostGuide(selectedGuide.id, {
        name: editedName,
        description: editedDescription,
      });
      
      // Mettre à jour le guide dans la liste
      const updatedGuides = guides.map(guide => 
        guide.id === selectedGuide.id 
          ? { ...guide, name: editedName, description: editedDescription } 
          : guide
      );
      setGuides(updatedGuides);
      
      // Mettre à jour le guide sélectionné
      setSelectedGuide({
        ...selectedGuide,
        name: editedName,
        description: editedDescription,
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du guide:', err);
      setError('Erreur lors de la mise à jour du guide');
    }
  };

  // Rafraîchir les entrées
  const refreshEntries = async () => {
    if (!selectedGuide) return;
    
    try {
      const entriesData = await getCostGuideEntries(selectedGuide.id);
      setEntries(entriesData);
    } catch (err) {
      console.error('Erreur lors du rechargement des entrées:', err);
    }
  };

  // Retourner à la liste des guides
  const handleBackToList = () => {
    setSelectedGuide(null);
    setEntries([]);
    setPartners([]);
    setIsEditing(false);
    setShowEntryForm(false);
    setSelectedEntry(null);
  };

  // Rendu conditionnel selon l'état de l'application
  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedGuide ? 'Guide de coût' : 'Guides de coût'}
          </h1>
          <p className="text-gray-600">
            {selectedGuide 
              ? 'Gérez les entrées et paramètres du guide'
              : 'Gérez vos guides de coût pour faciliter la planification budgétaire'}
          </p>
        </div>
        
        {!selectedGuide ? (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouveau guide
          </button>
        ) : (
          <button
            onClick={handleBackToList}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Retour à la liste
          </button>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Liste des guides */}
      {!selectedGuide && (
        <>
          {/* État de chargement */}
          {loading && !guides.length && (
            <div className="text-center py-8">
              <p className="text-gray-500">Chargement des guides de coût...</p>
            </div>
          )}

          {/* Aucun guide */}
          {!loading && !guides.length && (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">
                Aucun guide de coût trouvé. Créez votre premier guide !
              </p>
            </div>
          )}

          {/* Liste des guides */}
          {guides.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {guides.map((guide) => (
                  <li key={guide.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="cursor-pointer" onClick={() => loadGuideDetails(guide.id)}>
                        <h3 className="text-lg font-medium text-gray-900">
                          {guide.name}
                        </h3>
                        {guide.description && (
                          <p className="text-sm text-gray-500">
                            {guide.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Créé le {new Date(guide.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleDeleteGuide(guide.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => loadGuideDetails(guide.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent rounded text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                          <span className="mr-1">Voir</span>
                          <ArrowRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Détail d'un guide */}
      {selectedGuide && (
        <>
          {/* État de chargement */}
          {loadingDetail && (
            <div className="text-center py-8">
              <p className="text-gray-500">Chargement du guide de coût...</p>
            </div>
          )}

          {!loadingDetail && (
            <div className="space-y-6">
              {/* En-tête du guide */}
              <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
                {isEditing ? (
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-lg font-bold"
                      placeholder="Nom du guide"
                    />
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm"
                      placeholder="Description (optionnelle)"
                      rows={2}
                    ></textarea>
                  </div>
                ) : (
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{selectedGuide.name}</h2>
                    {selectedGuide.description && (
                      <p className="text-gray-600 mt-1">{selectedGuide.description}</p>
                    )}
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleUpdateGuide}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedName(selectedGuide.name);
                          setEditedDescription(selectedGuide.description);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-gray-400 hover:text-indigo-600 p-2"
                        title="Modifier"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGuide(selectedGuide.id)}
                        className="text-gray-400 hover:text-red-600 p-2"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Barre d'outils */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center px-3 py-1.5 rounded ${
                      viewMode === 'list'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-1" />
                    Vue hiérarchique
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center px-3 py-1.5 rounded ${
                      viewMode === 'table'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <TableCellsIcon className="h-5 w-5 mr-1" />
                    Édition rapide
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedEntry(null);
                    setShowEntryForm(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Nouvelle entrée
                </button>
              </div>

              {/* Formulaire d'ajout/édition d'entrée */}
              {showEntryForm && (
                <div className="bg-white rounded-lg shadow p-6">
                  <CostGuideEntryForm
                    guideId={selectedGuide.id}
                    entry={selectedEntry}
                    partners={partners}
                    onCancel={() => {
                      setShowEntryForm(false);
                      setSelectedEntry(null);
                    }}
                    onSuccess={() => {
                      setShowEntryForm(false);
                      setSelectedEntry(null);
                      refreshEntries();
                    }}
                  />
                </div>
              )}

              {/* Contenu principal - Vue hiérarchique ou tableau */}
              {viewMode === 'list' ? (
                <CostGuideEntryList
                  entries={entries}
                  onEdit={(entry) => {
                    setSelectedEntry(entry);
                    setShowEntryForm(true);
                  }}
                  onDelete={refreshEntries}
                  onDuplicate={refreshEntries}
                />
              ) : (
                <CostGuideEntryTable
                  guideId={selectedGuide.id}
                  entries={entries}
                  partners={partners}
                  onEntriesUpdated={refreshEntries}
                />
              )}

              {entries.length === 0 && !showEntryForm && (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                  <p className="text-gray-500">
                    Aucune entrée dans ce guide de coût. Ajoutez votre première entrée !
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de création de guide */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Nouveau guide de coût</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="guideName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nom du guide *
                </label>
                <input
                  type="text"
                  id="guideName"
                  value={newGuideName}
                  onChange={(e) => setNewGuideName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Ex: Guide de coût Q1 2023"
                />
              </div>
              <div>
                <label
                  htmlFor="guideDescription"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="guideDescription"
                  value={newGuideDescription}
                  onChange={(e) => setNewGuideDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Description optionnelle"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewGuideName('');
                  setNewGuideDescription('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateGuide}
                disabled={!newGuideName.trim()}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  newGuideName.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-indigo-400 cursor-not-allowed'
                }`}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}