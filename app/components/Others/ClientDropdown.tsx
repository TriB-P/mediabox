// Fichier: components/ui/ClientDropdown.js
// Chemin: src/components/ui/ClientDropdown.js

/**
 * Ce fichier définit le composant ClientDropdown.
 * Son rôle est d'afficher un menu déroulant qui permet à l'utilisateur de sélectionner
 * un "client" parmi une liste. Il récupère les données via le hook `useClient`,
 * gère un état de chargement, affiche le nom et le logo du client sélectionné,
 * et inclut un outil de recherche pour filtrer les clients.
 * Les clients sont affichés par ordre alphabétique.
 */

'use client';

import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { useClient } from '../../contexts/ClientContext';
import { useTranslation } from '../../contexts/LanguageContext';


/**
 * Affiche un menu déroulant permettant à l'utilisateur de sélectionner un client.
 * Le composant gère son propre état (chargement, liste de clients, client sélectionné)
 * en utilisant le contexte `ClientContext`. Inclut une fonction de recherche et
 * tri alphabétique des clients.
 * @returns {JSX.Element} Le composant JSX du menu déroulant.
 */
export default function ClientDropdown() {
  const { t } = useTranslation();

  const { availableClients, selectedClient, setSelectedClient, loading } =
    useClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fonction pour filtrer et trier les clients
  const getFilteredAndSortedClients = () => {
    return availableClients
      .filter((client) =>
        client.CL_Name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.CL_Name.localeCompare(b.CL_Name));
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (availableClients.length === 0) {
    return <div className="text-sm text-gray-500">Aucun client disponible</div>;
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
    <Menu as="div" className="relative inline-block text-left w-full">
      <div>
        <Menu.Button className="inline-flex w-full justify-between items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          <div className="truncate max-w-[110px]">{displayText}</div>
          <ChevronDownIcon
            className="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </Menu.Button>
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
  );
}