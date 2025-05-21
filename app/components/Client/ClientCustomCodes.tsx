// app/components/Client/ClientCustomCodes.tsx

'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Dialog, Transition } from '@headlessui/react';
import { 
  getAllShortcodes,
  getClientCustomCodes,
  addCustomCode,
  updateCustomCode,
  deleteCustomCode,
  Shortcode,
  CustomCode
} from '../../lib/customCodeService';
import { 
  PlusIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const ClientCustomCodes: React.FC = () => {
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [customCodes, setCustomCodes] = useState<CustomCode[]>([]);
  const [allShortcodes, setAllShortcodes] = useState<Shortcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Vérifier si l'utilisateur a la permission de gérer les codes personnalisés
  const hasCustomCodePermission = canPerformAction('CustomCodes');
  
  // États pour le modal d'ajout/édition de code personnalisé
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<CustomCode | null>(null);
  const [selectedShortcode, setSelectedShortcode] = useState<Shortcode | null>(null);
  const [customCodeValue, setCustomCodeValue] = useState('');
  
  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [shortcodeSearchTerm, setShortcodeSearchTerm] = useState('');

  // Charger les données quand le client sélectionné change
  useEffect(() => {
    if (selectedClient) {
      loadData();
    }
  }, [selectedClient]);

  const loadData = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger tous les shortcodes du système
      const shortcodes = await getAllShortcodes();
      setAllShortcodes(shortcodes);
      
      // Charger les codes personnalisés du client
      const codes = await getClientCustomCodes(selectedClient.clientId);
      setCustomCodes(codes);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    if (!hasCustomCodePermission) return;
    
    setEditingCode(null);
    setSelectedShortcode(null);
    setCustomCodeValue('');
    setShortcodeSearchTerm('');
    setIsModalOpen(true);
  };

  const openEditModal = (code: CustomCode) => {
    if (!hasCustomCodePermission) return;
    
    setEditingCode(code);
    
    // Trouver le shortcode correspondant
    const shortcode = allShortcodes.find(s => s.id === code.shortcodeId);
    setSelectedShortcode(shortcode || null);
    
    setCustomCodeValue(code.customCode);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCode(null);
    setSelectedShortcode(null);
    setCustomCodeValue('');
  };

  const handleAddCode = async () => {
    if (!selectedClient || !selectedShortcode || !hasCustomCodePermission) return;
    
    try {
      setError(null);
      
      await addCustomCode(selectedClient.clientId, {
        shortcodeId: selectedShortcode.id,
        customCode: customCodeValue
      });
      
      setSuccess('Code personnalisé ajouté avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les données
      await loadData();
      
      // Fermer le modal
      closeModal();
    } catch (err) {
      console.error('Erreur lors de l\'ajout du code personnalisé:', err);
      setError('Impossible d\'ajouter le code personnalisé.');
    }
  };

  const handleUpdateCode = async () => {
    if (!selectedClient || !editingCode || !hasCustomCodePermission) return;
    
    try {
      setError(null);
      
      await updateCustomCode(
        selectedClient.clientId,
        editingCode.id,
        {
          customCode: customCodeValue
        }
      );
      
      setSuccess('Code personnalisé mis à jour avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les données
      await loadData();
      
      // Fermer le modal
      closeModal();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du code personnalisé:', err);
      setError('Impossible de mettre à jour le code personnalisé.');
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!selectedClient || !hasCustomCodePermission) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce code personnalisé ?')) {
      try {
        setError(null);
        
        await deleteCustomCode(selectedClient.clientId, codeId);
        
        setSuccess('Code personnalisé supprimé avec succès.');
        setTimeout(() => setSuccess(null), 3000);
        
        // Recharger les données
        await loadData();
      } catch (err) {
        console.error('Erreur lors de la suppression du code personnalisé:', err);
        setError('Impossible de supprimer le code personnalisé.');
      }
    }
  };
  
  // Filtrer les codes personnalisés selon la recherche
  const filteredCustomCodes = customCodes.filter(code => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const shortcode = allShortcodes.find(s => s.id === code.shortcodeId);
    
    return (
      code.customCode.toLowerCase().includes(searchLower) ||
      code.shortcodeId.toLowerCase().includes(searchLower) || // Recherche par ID du shortcode
      (shortcode?.SH_Code && shortcode.SH_Code.toLowerCase().includes(searchLower)) ||
      (shortcode?.SH_Display_Name_FR && shortcode.SH_Display_Name_FR.toLowerCase().includes(searchLower))
    );
  });
  
  // Filtrer les shortcodes pour la sélection dans le modal
  const filteredShortcodes = allShortcodes.filter(shortcode => {
    if (!shortcodeSearchTerm) return true;
    
    const searchLower = shortcodeSearchTerm.toLowerCase();
    return (
      shortcode.SH_Code.toLowerCase().includes(searchLower) ||
      shortcode.SH_Display_Name_FR.toLowerCase().includes(searchLower) ||
      shortcode.id.toLowerCase().includes(searchLower) // Recherche par ID
    );
  });

  // Vérifier si le shortcode a déjà un code personnalisé
  const hasCustomCode = (shortcodeId: string) => {
    return customCodes.some(code => code.shortcodeId === shortcodeId);
  };

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Veuillez sélectionner un client pour gérer les codes personnalisés.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Codes personnalisés</h2>
          <button
            onClick={openAddModal}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
              hasCustomCodePermission 
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                : 'text-gray-500 bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!hasCustomCodePermission}
            title={!hasCustomCodePermission ? "Vous n'avez pas la permission d'ajouter des codes personnalisés" : ""}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter un code personnalisé
          </button>
        </div>

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
        
        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Rechercher par shortcode, code personnalisé ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Liste des codes personnalisés */}
        {loading ? (
          <div className="py-4 text-center text-gray-500">Chargement des codes personnalisés...</div>
        ) : filteredCustomCodes.length === 0 ? (
          <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            <p>{customCodes.length === 0 
              ? 'Aucun code personnalisé configuré pour ce client.' 
              : 'Aucun résultat pour votre recherche.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Shortcode
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code Shortcode
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom Shortcode
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code Personnalisé
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomCodes.map((code) => {
                  const shortcode = allShortcodes.find(s => s.id === code.shortcodeId);
                  return (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {code.shortcodeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shortcode?.SH_Code || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shortcode?.SH_Display_Name_FR || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {code.customCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(code)}
                            className={`${
                              hasCustomCodePermission 
                                ? 'text-indigo-600 hover:text-indigo-900' 
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!hasCustomCodePermission}
                            title={!hasCustomCodePermission ? "Vous n'avez pas la permission de modifier les codes personnalisés" : "Modifier"}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCode(code.id)}
                            className={`${
                              hasCustomCodePermission 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!hasCustomCodePermission}
                            title={!hasCustomCodePermission ? "Vous n'avez pas la permission de supprimer les codes personnalisés" : "Supprimer"}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d'ajout/édition de code personnalisé */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={closeModal}>
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
                    {editingCode ? 'Modifier le code personnalisé' : 'Ajouter un code personnalisé'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={closeModal}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-4">
                  {/* Sélection du shortcode (seulement en mode ajout) */}
                  {!editingCode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sélectionner un shortcode
                      </label>
                      
                      {/* Champ de recherche */}
                      <div className="mb-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          </div>
                          <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Rechercher par code, nom ou ID..."
                            value={shortcodeSearchTerm}
                            onChange={(e) => setShortcodeSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {/* Liste des shortcodes */}
                      <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                        {filteredShortcodes.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            Aucun shortcode trouvé
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-200">
                            {filteredShortcodes.map((shortcode) => {
                              const isDisabled = hasCustomCode(shortcode.id);
                              return (
                                <li 
                                  key={shortcode.id} 
                                  className={`p-3 hover:bg-gray-50 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  onClick={() => {
                                    if (!isDisabled) {
                                      setSelectedShortcode(shortcode);
                                    }
                                  }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        {shortcode.SH_Code}
                                        {isDisabled && <span className="ml-2 text-xs text-red-500">(Déjà personnalisé)</span>}
                                      </p>
                                      <p className="text-xs text-gray-500">{shortcode.SH_Display_Name_FR}</p>
                                      <p className="text-xs font-mono text-gray-400 mt-1">ID: {shortcode.id}</p>
                                    </div>
                                    {selectedShortcode?.id === shortcode.id && (
                                      <div className="h-5 w-5 text-indigo-600 flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Affichage du shortcode sélectionné en mode édition */}
                  {editingCode && selectedShortcode && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-900">{selectedShortcode.SH_Code}</p>
                      <p className="text-xs text-gray-500">{selectedShortcode.SH_Display_Name_FR}</p>
                      <p className="text-xs font-mono text-gray-500 mt-1">ID: {selectedShortcode.id}</p>
                    </div>
                  )}
                  
                  {/* Code personnalisé */}
                  <div>
                    <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Code personnalisé
                    </label>
                    <input
                      type="text"
                      id="customCode"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={customCodeValue}
                      onChange={(e) => setCustomCodeValue(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={closeModal}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={editingCode ? handleUpdateCode : handleAddCode}
                    disabled={!customCodeValue || (!editingCode && !selectedShortcode)}
                  >
                    {editingCode ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default ClientCustomCodes;