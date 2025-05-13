'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useClient } from '../contexts/ClientContext';

export default function ClientDropdown() {
  const { availableClients, selectedClient, setSelectedClient, loading } =
    useClient();

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  // Afficher le dropdown s'il y a des clients disponibles
  if (availableClients.length === 0) {
    return <div className="text-sm text-gray-500">Aucun client disponible</div>;
  }

  // Si aucun client n'est sélectionné, afficher "Sélectionner un client"
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
    <span>Sélectionner un client</span>
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
            {availableClients.map((client) => (
              <Menu.Item key={client.clientId}>
                {({ active }) => (
                  <button
                    onClick={() => setSelectedClient(client)}
                    className={`
                      ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                      ${
                        client.clientId === selectedClient?.clientId
                          ? 'bg-gray-50'
                          : ''
                      }
                      flex items-center gap-2 w-full px-4 py-2 text-sm
                    `}
                  >
                    {client.CL_Logo && (
                      <img
                        src={client.CL_Logo}
                        alt={client.CL_Name}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    )}
                    <span>{client.CL_Name}</span>
                    {client.clientId === selectedClient?.clientId && (
                      <span className="ml-auto text-indigo-600">✓</span>
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}