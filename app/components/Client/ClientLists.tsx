/**
 * app/components/Client/ClientLists.tsx
 * 
 * Version restructurée avec interface plus claire et intégration du modal AllShortcodesModal.
 * Améliore l'organisation visuelle et l'expérience utilisateur.
 */

'use client';

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useShortcodes } from '../../hooks/useShortcodes';
import DimensionSidebar from './DimensionSidebar';
import ListHeader from './ListHeader';
import ShortcodeActions from './ShortcodeActions';
import ShortcodeTable from './ShortcodeTable';
import AllShortcodesModal from './AllShortcodesModal';
import { updateShortcode } from '../../lib/shortcodeService';

/**
 * Composant principal restructuré pour la gestion des listes de shortcodes.
 * Interface plus claire et intuitive avec modal centralisé pour la gestion des shortcodes.
 */
const ClientLists: React.FC = () => {
  const { selectedClient } = useClient();
  const { canPerformAction, userRole } = usePermissions();

  const hasListPermission = canPerformAction('Listes');

  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteListModalOpen, setIsDeleteListModalOpen] = useState(false);
  const [isAllShortcodesModalOpen, setIsAllShortcodesModalOpen] = useState(false);

  const {
    dimensions,
    selectedDimension,
    shortcodes,
    allShortcodes,
    isCustomList,
    customDimensions,
    loading,
    error,
    success,
    setSelectedDimension,
    handleCreateCustomList,
    handleDeleteCustomList,
    handleAddShortcode,
    handleRemoveShortcode,
    handleCreateShortcode,
    refreshShortcodes,
    clearMessages
  } = useShortcodes();

  /**
   * Ouvre la modale de confirmation pour la suppression d'une liste personnalisée.
   */
  const onDeleteCustomList = () => {
    setIsDeleteListModalOpen(true);
  };

  /**
   * Exécute la suppression de la liste personnalisée après confirmation de l'utilisateur.
   */
  const confirmDeleteCustomList = async () => {
    await handleDeleteCustomList();
    setIsDeleteListModalOpen(false);
  };

  /**
   * Déclenche le rafraîchissement de la liste des shortcodes.
   */
  const onUpdateShortcode = async () => {
    await refreshShortcodes();
  };

  /**
   * Ouvre le modal de gestion de tous les shortcodes.
   */
  const openAllShortcodesModal = () => {
    setIsAllShortcodesModalOpen(true);
  };

  /**
   * Ferme le modal de gestion de tous les shortcodes.
   */
  const closeAllShortcodesModal = () => {
    setIsAllShortcodesModalOpen(false);
  };

  /**
   * Gère la mise à jour d'un shortcode depuis le modal global.
   */
  const handleUpdateShortcodeFromModal = async (shortcodeId: string, data: any) => {
    try {
      await updateShortcode(shortcodeId, data);
      await refreshShortcodes(); // Rafraîchir le cache
    } catch (error) {
      console.error('Erreur lors de la mise à jour du shortcode:', error);
      throw error;
    }
  };

  if (!selectedClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Aucun client sélectionné</h2>
            <p className="text-gray-600">
              Veuillez sélectionner un client pour gérer ses listes de shortcodes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        {/* En-tête compact */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Configuration des listes</h2>
            
          </div>
        </div>

        {/* Messages d'état compacts */}
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

        {!hasListPermission && (
          <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400 text-amber-700 text-sm">
            Vous êtes en mode lecture seule. Contactez votre administrateur pour obtenir les permissions de modification.
          </div>
        )}

        {/* Interface principale compacte */}
        <div className="flex flex-col xl:flex-row xl:space-x-6">
          
          {/* Sidebar des dimensions */}
          <div className="xl:w-80 flex-shrink-0 mb-6 xl:mb-0">
            <DimensionSidebar
              dimensions={dimensions}
              selectedDimension={selectedDimension}
              onSelectDimension={setSelectedDimension}
              loading={loading && dimensions.length === 0}
              clientId={selectedClient.clientId}
              customDimensions={customDimensions}
            />
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            {selectedDimension ? (
              <>
                {/* En-tête de la liste - compact et intégré */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <ListHeader
                    selectedDimension={selectedDimension}
                    isCustomList={isCustomList}
                    clientName={selectedClient.CL_Name}
                    hasPermission={hasListPermission}
                    onCreateCustomList={handleCreateCustomList}
                    onDeleteCustomList={onDeleteCustomList}
                  />
                </div>

                {/* Actions compactes */}
                <ShortcodeActions
                  hasPermission={hasListPermission}
                  isCustomList={isCustomList}
                  allShortcodes={allShortcodes}
                  currentShortcodes={shortcodes}
                  onCreateShortcode={handleCreateShortcode}
                  onAddShortcode={handleAddShortcode}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onOpenAllShortcodesModal={openAllShortcodesModal}
                />

                {/* Tableau des shortcodes */}
                <ShortcodeTable
                  shortcodes={shortcodes}
                  hasPermission={hasListPermission}
                  isCustomList={isCustomList}
                  loading={loading}
                  searchQuery={searchQuery}
                  userRole={userRole}
                  onRemoveShortcode={handleRemoveShortcode}
                  onUpdateShortcode={onUpdateShortcode}
                />
              </>
            ) : (
              /* État initial - Aucune dimension sélectionnée */
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Sélectionnez une dimension
                </h3>
                <p className="text-gray-600 text-sm">
                  Choisissez une dimension dans la liste de gauche pour gérer les shortcodes.
                </p>
 
              </div>
            )}
          </div>
        </div>

        {/* Modal de gestion globale des shortcodes - NOUVEAU */}
        <AllShortcodesModal
          isOpen={isAllShortcodesModalOpen}
          onClose={closeAllShortcodesModal}
          allShortcodes={allShortcodes}
          currentShortcodes={shortcodes}
          selectedDimension={selectedDimension}
          isCustomList={isCustomList}
          hasPermission={hasListPermission}
          onAddShortcode={handleAddShortcode}
          onUpdateShortcode={handleUpdateShortcodeFromModal}
          onRefresh={refreshShortcodes}
        />

        {/* Modal de confirmation de suppression de liste */}
        <Transition show={isDeleteListModalOpen} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => setIsDeleteListModalOpen(false)}>
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
                <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
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
                <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Confirmer la suppression
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Êtes-vous sûr de vouloir supprimer cette liste personnalisée ? 
                          Le système utilisera automatiquement la liste par défaut (PlusCo) à la place. 
                          Cette action est <strong>irréversible</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      onClick={() => setIsDeleteListModalOpen(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      onClick={confirmDeleteCustomList}
                    >
                      Supprimer définitivement
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