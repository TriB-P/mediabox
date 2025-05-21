// app/components/Client/ClientLists.tsx

'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { Dialog, Transition } from '@headlessui/react';
import {
  getAllDimensions,
  getAllShortcodes,
  getClientDimensionShortcodes,
  hasCustomList,
  addShortcodeToDimension,
  removeShortcodeFromDimension,
  createCustomListFromPlusCo,
  createShortcode,
  deleteCustomList,
  Shortcode
} from '../../lib/shortcodeService';
import { 
    PlusIcon, 
    XMarkIcon, 
    MagnifyingGlassIcon, 
    PencilIcon,
    TrashIcon,
    ClipboardIcon,
    ClipboardDocumentCheckIcon
  } from '@heroicons/react/24/outline';
import ShortcodeDetail from './ShortcodeDetail';

const ClientLists: React.FC = () => {
  const { selectedClient } = useClient();
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [shortcodes, setShortcodes] = useState<Shortcode[]>([]);
  const [allShortcodes, setAllShortcodes] = useState<Shortcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCustomList, setIsCustomList] = useState(false);


  
  // État pour indiquer quel ID a été récemment copié
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // États pour le modal d'ajout de shortcode à la liste
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [shortcodeSearchQuery, setShortcodeSearchQuery] = useState('');
  
  // État pour la recherche dans la liste actuelle
  const [listSearchQuery, setListSearchQuery] = useState('');
  
  // États pour le modal de création de shortcode
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newShortcode, setNewShortcode] = useState<{
    SH_Code: string;
    SH_Default_UTM: string;
    SH_Display_Name_FR: string;
    SH_Display_Name_EN: string;
  }>({
    SH_Code: '',
    SH_Default_UTM: '',
    SH_Display_Name_FR: '',
    SH_Display_Name_EN: '',
  });
  
  // États pour la modal de détails d'un shortcode
  const [selectedShortcode, setSelectedShortcode] = useState<Shortcode | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // État pour la confirmation de suppression d'une liste
  const [isDeleteListModalOpen, setIsDeleteListModalOpen] = useState(false);

  // Charger les dimensions disponibles au chargement du composant
  useEffect(() => {
    loadDimensions();
  }, []);

  // Charger les shortcodes quand la dimension ou le client sélectionné change
  useEffect(() => {
    if (selectedClient && selectedDimension) {
      loadClientDimensionShortcodes();
    }
  }, [selectedClient, selectedDimension]);

  const loadDimensions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedDimensions = await getAllDimensions();
      setDimensions(fetchedDimensions);
      
      // Sélectionner la première dimension par défaut
      if (fetchedDimensions.length > 0 && !selectedDimension) {
        setSelectedDimension(fetchedDimensions[0]);
      }
      
      // Charger tous les shortcodes disponibles
      const fetchedAllShortcodes = await getAllShortcodes();
      setAllShortcodes(fetchedAllShortcodes);
      
    } catch (err) {
      console.error('Erreur lors du chargement des dimensions:', err);
      setError('Impossible de charger les dimensions.');
    } finally {
      setLoading(false);
    }
  };

  const loadClientDimensionShortcodes = async () => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier si le client a une liste personnalisée
      const hasCustom = await hasCustomList(selectedDimension, selectedClient.clientId);
      setIsCustomList(hasCustom);
      
      // Charger les shortcodes
      const fetchedShortcodes = await getClientDimensionShortcodes(
        selectedDimension,
        selectedClient.clientId
      );
      setShortcodes(fetchedShortcodes);
      
      // Réinitialiser la recherche sur la liste
      setListSearchQuery('');
      
    } catch (err) {
      console.error('Erreur lors du chargement des shortcodes:', err);
      setError('Impossible de charger les shortcodes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomList = async () => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await createCustomListFromPlusCo(selectedDimension, selectedClient.clientId);
      
      setSuccess('Liste personnalisée créée avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les shortcodes
      await loadClientDimensionShortcodes();
      
    } catch (err) {
      console.error('Erreur lors de la création de la liste personnalisée:', err);
      setError('Impossible de créer la liste personnalisée.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCustomList = async () => {
    if (!selectedClient || !selectedDimension || !isCustomList) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await deleteCustomList(selectedDimension, selectedClient.clientId);
      
      setSuccess('Liste personnalisée supprimée avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      // Fermer le modal de confirmation
      setIsDeleteListModalOpen(false);
      
      // Recharger les shortcodes (maintenant ce sera la liste PlusCo)
      await loadClientDimensionShortcodes();
      
    } catch (err) {
      console.error('Erreur lors de la suppression de la liste personnalisée:', err);
      setError('Impossible de supprimer la liste personnalisée.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddShortcode = async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Déterminer si on travaille sur une liste PlusCo ou personnalisée
      const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';
      
      // Ajouter le shortcode à la liste appropriée
      await addShortcodeToDimension(
        selectedDimension,
        targetClientId,
        shortcodeId
      );
      
      setSuccess('Shortcode ajouté avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      // Fermer le modal
      setIsAddModalOpen(false);
      
      // Recharger les shortcodes
      await loadClientDimensionShortcodes();
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du shortcode:', err);
      setError('Impossible d\'ajouter le shortcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShortcode = async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Déterminer si on travaille sur une liste PlusCo ou personnalisée
      const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';
      
      await removeShortcodeFromDimension(
        selectedDimension,
        targetClientId,
        shortcodeId
      );
      
      setSuccess('Shortcode retiré avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les shortcodes
      await loadClientDimensionShortcodes();
      
    } catch (err) {
      console.error('Erreur lors du retrait du shortcode:', err);
      setError('Impossible de retirer le shortcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShortcode = async () => {
    if (!newShortcode.SH_Code || !newShortcode.SH_Display_Name_FR) {
      setError('Le code et le nom d\'affichage FR sont obligatoires.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const shortcodeId = await createShortcode({
        SH_Code: newShortcode.SH_Code,
        SH_Default_UTM: newShortcode.SH_Default_UTM,
        SH_Display_Name_FR: newShortcode.SH_Display_Name_FR,
        SH_Display_Name_EN: newShortcode.SH_Display_Name_EN,
      });
      
      setSuccess('Shortcode créé avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      // Réinitialiser le formulaire
      setNewShortcode({
        SH_Code: '',
        SH_Default_UTM: '',
        SH_Display_Name_FR: '',
        SH_Display_Name_EN: '',
      });
      
      // Fermer le modal
      setIsCreateModalOpen(false);
      
      // Recharger tous les shortcodes
      const fetchedAllShortcodes = await getAllShortcodes();
      setAllShortcodes(fetchedAllShortcodes);
      
      // Si le client a une liste personnalisée, ajouter directement le shortcode
      if (selectedClient && selectedDimension && isCustomList) {
        await addShortcodeToDimension(
          selectedDimension,
          selectedClient.clientId,
          shortcodeId
        );
        
        // Recharger les shortcodes
        await loadClientDimensionShortcodes();
      }
      
    } catch (err) {
      console.error('Erreur lors de la création du shortcode:', err);
      setError('Impossible de créer le shortcode.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour rafraîchir les données après modification d'un shortcode
  const handleUpdateShortcode = async () => {
    // Recharger tous les shortcodes
    const fetchedAllShortcodes = await getAllShortcodes();
    setAllShortcodes(fetchedAllShortcodes);
    
    // Recharger les shortcodes de la dimension
    if (selectedClient && selectedDimension) {
      await loadClientDimensionShortcodes();
    }
  };

  // Filtrer les shortcodes disponibles pour l'ajout
  const filteredShortcodes = allShortcodes.filter(shortcode => {
    // Exclure les shortcodes déjà dans la liste
    const isAlreadyInList = shortcodes.some(s => s.id === shortcode.id);
    if (isAlreadyInList) return false;
    
    // Filtrer par recherche
    if (!shortcodeSearchQuery) return true;
    
    const searchLower = shortcodeSearchQuery.toLowerCase();
    return (
      shortcode.SH_Code.toLowerCase().includes(searchLower) ||
      shortcode.SH_Display_Name_FR.toLowerCase().includes(searchLower) ||
      (shortcode.SH_Display_Name_EN && shortcode.SH_Display_Name_EN.toLowerCase().includes(searchLower))
    );
  });

  // Fonction à ajouter pour copier l'ID dans le presse-papiers
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
      .then(() => {
        setCopiedId(id);
        // Réinitialiser l'état après un court délai
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(err => {
        console.error('Erreur lors de la copie dans le presse-papier:', err);
      });
  };
  
  // Filtrer les shortcodes dans la liste actuelle par recherche
  const filteredListShortcodes = shortcodes.filter(shortcode => {
    if (!listSearchQuery) return true;
    
    const searchLower = listSearchQuery.toLowerCase();
    return (
      shortcode.SH_Code.toLowerCase().includes(searchLower) ||
      shortcode.SH_Display_Name_FR.toLowerCase().includes(searchLower) ||
      (shortcode.SH_Display_Name_EN && shortcode.SH_Display_Name_EN.toLowerCase().includes(searchLower)) ||
      (shortcode.SH_Default_UTM && shortcode.SH_Default_UTM.toLowerCase().includes(searchLower))
    );
  });

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Veuillez sélectionner un client pour gérer ses listes.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Gestion des listes</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
            {success}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* Colonne des dimensions (gauche) */}
          <div className="w-full md:w-64">
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Dimensions</h3>
              </div>
              <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {dimensions.map((dimension) => (
                  <li key={dimension}>
                    <button
                      onClick={() => setSelectedDimension(dimension)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-100 focus:outline-none ${
                        selectedDimension === dimension ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {dimension}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Colonne principale (droite) */}
          <div className="flex-1 mt-6 md:mt-0">
            {/* Informations sur la liste utilisée */}
          {/* Informations sur la liste utilisée */}
            {selectedDimension && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="mb-4 sm:mb-0">
                    <h3 className="text-md font-medium text-gray-700">
                    Dimension: <span className="text-indigo-600">{selectedDimension}</span> - 
                    {isCustomList ? (
                        <span className="text-green-600 ml-2">Liste personnalisée</span>
                    ) : (
                        <span className="text-amber-600 ml-2">Liste par défaut (PlusCo)</span>
                    )}
                    </h3>
                    <p className="text-sm text-gray-500">
                    {isCustomList 
                        ? `Liste spécifique au client ${selectedClient.CL_Name}`
                        : `Liste commune (PlusCo)`
                    }
                    </p>
                </div>
                <div className="flex space-x-2">
                    {!isCustomList ? (
                    <button
                        onClick={handleCreateCustomList}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Créer une liste personnalisée
                    </button>
                    ) : (
                    <button
                        onClick={() => setIsDeleteListModalOpen(true)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Supprimer cette liste
                    </button>
                    )}
                </div>
                </div>
            </div>
            )}
            
            {/* Boutons d'action et barre de recherche */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex space-x-2 mb-4 sm:mb-0">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Créer un shortcode
                </button>
                
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Assigner un shortcode
                </button>
                </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Rechercher dans la liste..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Liste des shortcodes */}
            <div className="mb-6">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Chargement des shortcodes...</p>
                </div>
              ) : filteredListShortcodes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    {shortcodes.length === 0 
                      ? 'Aucun shortcode dans cette liste.' 
                      : 'Aucun shortcode ne correspond à votre recherche.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom FR
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom EN
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          UTM par défaut
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredListShortcodes.map((shortcode) => (
                        <tr key={shortcode.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {shortcode.SH_Code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {shortcode.SH_Display_Name_FR}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {shortcode.SH_Display_Name_EN || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {shortcode.SH_Default_UTM || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-3">
                            <button
                            onClick={() => handleCopyId(shortcode.id)}
                            className="text-gray-600 hover:text-gray-900 group relative"
                            title="Copier l'ID du code"
                            >
                            {copiedId === shortcode.id ? (
                                <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-600" />
                            ) : (
                                <ClipboardIcon className="h-5 w-5" />
                            )}
                            <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                Copier l'ID du code
                            </span>
                            </button>
                                                            <button
                                onClick={() => {
                                    setSelectedShortcode(shortcode);
                                    setIsDetailModalOpen(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 group relative"
                                title="Modifier ce shortcode"
                                >
                                <PencilIcon className="h-5 w-5" />
                                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                    Modifier ce shortcode
                                </span>
                                </button>
                                
                                <button
                                onClick={() => handleRemoveShortcode(shortcode.id)}
                                className="text-red-600 hover:text-red-900 group relative"
                                title={isCustomList ? "Retirer de cette liste" : "Retirer de la liste PlusCo"}
                                >
                                <TrashIcon className="h-5 w-5" />
                                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                    {isCustomList ? "Retirer de cette liste" : "Retirer de la liste PlusCo"}
                                </span>
                                </button>
                            </div>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Modal d'ajout de shortcode */}
        <Transition show={isAddModalOpen} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={() => setIsAddModalOpen(false)}>
            <div className="min-h-screen px-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
              </Transition.Child>

              <span className="inline-block h-screen align-middle" aria-hidden="true">
                &#8203;
              </span>
              
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">

                    <div className="flex justify-between items-start">
                    <div>
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        {isCustomList 
                            ? "Assigner un shortcode à la liste"
                            : "Ajouter un shortcode à la liste PlusCo"
                        }
                        </Dialog.Title>
                        
                        {/* Message d'avertissement placé sous le titre */}
                        {!isCustomList && (
                        <div className="mt-2 p-3 bg-amber-50 border-l-4 border-amber-400 text-amber-700 text-sm">
                            Attention: Vous êtes en train de modifier la liste commune (PlusCo). 
                            Les modifications affecteront tous les clients qui n'ont pas de liste personnalisée pour cette dimension.
                        </div>
                        )}
                    </div>
                    
                    <button
                        type="button"
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={() => setIsAddModalOpen(false)}
                    >
                        <span className="sr-only">Fermer</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    </div>
                  
                  <div className="mt-4">
                    <div className="mb-4">
                      <label htmlFor="shortcode-search" className="block text-sm font-medium text-gray-700 mb-1">
                        Rechercher un shortcode
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          id="shortcode-search"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Rechercher par code ou nom"
                          value={shortcodeSearchQuery}
                          onChange={(e) => setShortcodeSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto mt-4">
                      {filteredShortcodes.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Aucun shortcode disponible</p>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {filteredShortcodes.map((shortcode) => (
                            <li key={shortcode.id} className="py-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{shortcode.SH_Code}</p>
                                  <p className="text-sm text-gray-500">{shortcode.SH_Display_Name_FR}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddShortcode(shortcode.id)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  Ajouter
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
        
        {/* Modal de création de shortcode */}
        <Transition show={isCreateModalOpen} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={() => setIsCreateModalOpen(false)}>
            <div className="min-h-screen px-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
              </Transition.Child>

              <span className="inline-block h-screen align-middle" aria-hidden="true">
                &#8203;
              </span>
              
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                  <div className="flex justify-between items-center">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Créer un nouveau shortcode
                    </Dialog.Title>
                    <button
                      type="button"
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      <span className="sr-only">Fermer</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="SH_Code" className="block text-sm font-medium text-gray-700 mb-1">
                        Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="SH_Code"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newShortcode.SH_Code}
                        onChange={(e) => setNewShortcode({...newShortcode, SH_Code: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="SH_Display_Name_FR" className="block text-sm font-medium text-gray-700 mb-1">
                        Nom d'affichage FR <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="SH_Display_Name_FR"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newShortcode.SH_Display_Name_FR}
                        onChange={(e) => setNewShortcode({...newShortcode, SH_Display_Name_FR: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="SH_Display_Name_EN" className="block text-sm font-medium text-gray-700 mb-1">
                        Nom d'affichage EN
                      </label>
                      <input
                        type="text"
                        id="SH_Display_Name_EN"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newShortcode.SH_Display_Name_EN}
                        onChange={(e) => setNewShortcode({...newShortcode, SH_Display_Name_EN: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="SH_Default_UTM" className="block text-sm font-medium text-gray-700 mb-1">
                        UTM par défaut
                      </label>
                      <input
                        type="text"
                        id="SH_Default_UTM"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newShortcode.SH_Default_UTM}
                        onChange={(e) => setNewShortcode({...newShortcode, SH_Default_UTM: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={handleCreateShortcode}
                    >
                      Créer
                    </button>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
        
        {/* Modal de confirmation de suppression de liste */}
        <Transition show={isDeleteListModalOpen} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={() => setIsDeleteListModalOpen(false)}>
            <div className="min-h-screen px-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
              </Transition.Child>

              <span className="inline-block h-screen align-middle" aria-hidden="true">
                &#8203;
              </span>
              
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                  <div className="flex justify-between items-center">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Confirmer la suppression
                    </Dialog.Title>
                    <button
                      type="button"
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setIsDeleteListModalOpen(false)}
                    >
                      <span className="sr-only">Fermer</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer cette liste personnalisée ? Le système utilisera la liste par défaut (PlusCo) à la place. Cette action est irréversible.
                    </p>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => setIsDeleteListModalOpen(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={handleDeleteCustomList}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
        
        {/* Composant de détail d'un shortcode */}
        {selectedShortcode && (
          <ShortcodeDetail
            shortcode={selectedShortcode}
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            onDelete={handleUpdateShortcode}
            onUpdate={handleUpdateShortcode}
          />
        )}
      </div>
    </div>
  );
};

export default ClientLists;