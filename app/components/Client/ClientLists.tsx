// app/components/Client/ClientLists.tsx

'use client';

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useShortcodes } from '../../hooks/useShortcodes';
import DimensionSidebar from './DimensionSidebar';
import ListHeader from './ListHeader';
import ShortcodeActions from './ShortcodeActions';
import ShortcodeTable from './ShortcodeTable';

const ClientLists: React.FC = () => {
  const { selectedClient } = useClient();
  const { canPerformAction, userRole } = usePermissions();
  
  // Vérifier si l'utilisateur a la permission de gérer les listes
  const hasListPermission = canPerformAction('Listes');
  
  // États pour la recherche et les modals
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteListModalOpen, setIsDeleteListModalOpen] = useState(false);
  
  // Hook personnalisé pour la gestion des shortcodes
  const {
    dimensions,
    selectedDimension,
    shortcodes,
    allShortcodes,
    isCustomList,
    hasMore,
    totalCount,
    loading,
    loadingMore,
    error,
    success,
    setSelectedDimension,
    loadMoreShortcodes,
    handleCreateCustomList,
    handleDeleteCustomList,
    handleAddShortcode,
    handleRemoveShortcode,
    handleCreateShortcode,
    refreshShortcodes,
    clearMessages
  } = useShortcodes();

  const onDeleteCustomList = () => {
    setIsDeleteListModalOpen(true);
  };

  const confirmDeleteCustomList = async () => {
    await handleDeleteCustomList();
    setIsDeleteListModalOpen(false);
  };

  const onUpdateShortcode = async () => {
    await refreshShortcodes();
  };

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
        
        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            <div className="flex justify-between items-start">
              <span>{error}</span>
              <button onClick={clearMessages} className="text-red-500 hover:text-red-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
            <div className="flex justify-between items-start">
              <span>{success}</span>
              <button onClick={clearMessages} className="text-green-500 hover:text-green-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Bandeau d'avertissement pour les permissions */}
        {!hasListPermission && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700">
            Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les listes.
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* Sidebar des dimensions */}
          <DimensionSidebar
            dimensions={dimensions}
            selectedDimension={selectedDimension}
            onSelectDimension={setSelectedDimension}
            loading={loading && dimensions.length === 0}
          />
          
          {/* Contenu principal */}
          <div className="flex-1 mt-6 md:mt-0">
            {/* En-tête de la liste */}
            <ListHeader
              selectedDimension={selectedDimension}
              isCustomList={isCustomList}
              clientName={selectedClient.CL_Name}
              hasPermission={hasListPermission}
              onCreateCustomList={handleCreateCustomList}
              onDeleteCustomList={onDeleteCustomList}
            />
            
            {selectedDimension && (
              <>
                {/* Actions et recherche */}
                <ShortcodeActions
                  hasPermission={hasListPermission}
                  isCustomList={isCustomList}
                  allShortcodes={allShortcodes}
                  currentShortcodes={shortcodes}
                  onCreateShortcode={handleCreateShortcode}
                  onAddShortcode={handleAddShortcode}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
                
                {/* Tableau des shortcodes */}
                <ShortcodeTable
                  shortcodes={shortcodes}
                  hasPermission={hasListPermission}
                  isCustomList={isCustomList}
                  loading={loading}
                  loadingMore={loadingMore}
                  hasMore={hasMore}
                  totalCount={totalCount}
                  searchQuery={searchQuery}
                  userRole={userRole}
                  onRemoveShortcode={handleRemoveShortcode}
                  onUpdateShortcode={onUpdateShortcode}
                  onLoadMore={loadMoreShortcodes}
                />
              </>
            )}
          </div>
        </div>
        
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

              <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
              
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
                      onClick={confirmDeleteCustomList}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
};

export default ClientLists;