// Fichier: components/Others/ClientDropdown.tsx
// Chemin: app/components/Others/ClientDropdown.tsx

/**
 * Ce fichier définit le composant ClientDropdown.
 * Son rôle est d'afficher un menu déroulant qui permet à l'utilisateur de sélectionner
 * un "client" parmi une liste. Il récupère les données via le hook `useClient`,
 * gère un état de chargement, affiche le nom et le logo du client sélectionné,
 * et inclut un outil de recherche pour filtrer les clients.
 * Les clients sont affichés par ordre alphabétique.
 * * NOUVELLE FONCTIONNALITÉ : Bouton "+" pour les admins permettant de créer un nouveau client
 */

'use client';

import { Fragment, useState } from 'react';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { ChevronDownIcon, MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { createClient } from '../../lib/clientService';

/**
 * Affiche un menu déroulant permettant à l'utilisateur de sélectionner un client.
 * Le composant gère son propre état (chargement, liste de clients, client sélectionné)
 * en utilisant le contexte `ClientContext`. Inclut une fonction de recherche et
 * tri alphabétique des clients.
 * NOUVEAU : Inclut un bouton "+" visible uniquement aux admins pour créer de nouveaux clients.
 * @returns {JSX.Element} Le composant JSX du menu déroulant.
 */
export default function ClientDropdown() {
  const { t } = useTranslation();
  const { userRole } = usePermissions();
  const { availableClients, selectedClient, setSelectedClient, loading } = useClient();
  
  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour le modal de création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    clientId: '',
    clientName: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Vérifier si l'utilisateur est admin
  const isAdmin = userRole === 'admin';

  // Fonction pour filtrer et trier les clients
  const getFilteredAndSortedClients = () => {
    return availableClients
      .filter((client) =>
        client.CL_Name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.CL_Name.localeCompare(b.CL_Name));
  };

  // Gestionnaire pour ouvrir le modal de création
  const handleOpenCreateModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCreateForm({ clientId: '', clientName: '' });
    setCreateError('');
    setIsCreateModalOpen(true);
  };

  // Gestionnaire pour fermer le modal de création
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm({ clientId: '', clientName: '' });
    setCreateError('');
  };

  // Gestionnaire pour créer un nouveau client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.clientId.trim() || !createForm.clientName.trim()) {
      setCreateError(t('clientDropdown.createModal.errors.fillAllFields'));
      return;
    }

    // Validation basique de l'ID (pas d'espaces, caractères spéciaux limités)
    const idRegex = /^[a-zA-Z0-9_-]+$/;
    if (!idRegex.test(createForm.clientId)) {
      setCreateError(t('clientDropdown.createModal.errors.invalidId'));
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError('');
      
      await createClient(createForm.clientId, createForm.clientName);
      
      // Fermer le modal
      handleCloseCreateModal();
      
      // TODO: Rafraîchir la liste des clients
      // Pour l'instant, on affiche un message à l'utilisateur
      alert(t('clientDropdown.createModal.successMessage'));
      
    } catch (error: any) {
      console.error('Erreur lors de la création du client:', error);
      setCreateError(error.message || t('clientDropdown.createModal.errors.creationError'));
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">{t('common.loading')}</div>;
  }

  if (availableClients.length === 0) {
    return <div className="text-sm text-gray-500">{t('clientDropdown.status.noClientAvailable')}</div>;
  }

  const filteredClients = getFilteredAndSortedClients();

  const displayText = selectedClient ? (
    <div className="flex items-center gap-2 truncate">
      {selectedClient.CL_Logo && (
        <img
          src={selectedClient.CL_Logo}
          alt={selectedClient.CL_Name}
          className="h-5 w-5 rounded-full object-cover flex-shrink-0"
        />
      )}
      <span className="truncate">{selectedClient.CL_Name}</span>
    </div>
  ) : (
    <span>{t('clientDropdown.selectClient')}</span>
  );

  return (
    <>
      <Menu as="div" className="relative inline-block text-left w-full">
        <div className="flex items-center gap-2">
          <Menu.Button className="inline-flex w-full justify-between items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            <div className="truncate max-w-[110px]">{displayText}</div>
            <ChevronDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Menu.Button>
          
          {/* Bouton "+" visible uniquement aux admins */}
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center w-4 h-4 rounded-md bg-gray-100 text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              title={t('clientDropdown.create.title')}
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {/* Champ de recherche */}
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('clientDropdown.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Liste des clients filtrés */}
              <div className="max-h-60 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    {t('clientDropdown.noClientFound')}
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <Menu.Item key={client.clientId}>
                      {({ active }) => (
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setSearchTerm(''); // Réinitialiser la recherche après sélection
                          }}
                          className={`
                            ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                            ${
                              client.clientId === selectedClient?.clientId
                                ? 'bg-gray-50'
                                : ''
                            }
                            flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100
                          `}
                        >
                          {client.CL_Logo && (
                            <img
                              src={client.CL_Logo}
                              alt={client.CL_Name}
                              className="h-5 w-5 rounded-full object-cover"
                            />
                          )}
                          <span className="truncate">{client.CL_Name}</span>
                          {client.clientId === selectedClient?.clientId && (
                            <span className="ml-auto text-indigo-600 flex-shrink-0">✓</span>
                          )}
                        </button>
                      )}
                    </Menu.Item>
                  ))
                )}
              </div>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Modal de création de client */}
      <Transition show={isCreateModalOpen} as={Fragment}>
        <Dialog onClose={handleCloseCreateModal} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {t('clientDropdown.createModal.title')}
                    </Dialog.Title>
                    <button
                      onClick={handleCloseCreateModal}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateClient} className="space-y-4">
                    <div>
                      <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('clientDropdown.createModal.form.clientIdLabel')}
                      </label>
                      <input
                        type="text"
                        id="clientId"
                        value={createForm.clientId}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, clientId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder={t('clientDropdown.createModal.form.clientIdPlaceholder')}
                        disabled={createLoading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('clientDropdown.createModal.form.clientIdHelpText')}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('clientDropdown.createModal.form.clientNameLabel')}
                      </label>
                      <input
                        type="text"
                        id="clientName"
                        value={createForm.clientName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, clientName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder={t('clientDropdown.createModal.form.clientNamePlaceholder')}
                        disabled={createLoading}
                      />
                    </div>

                    {createError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                        {createError}
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleCloseCreateModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        disabled={createLoading}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={createLoading || !createForm.clientId.trim() || !createForm.clientName.trim()}
                      >
                        {createLoading ? t('clientDropdown.createModal.form.creatingButton') : t('common.create')}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}