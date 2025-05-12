'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getUserClients, ClientPermission } from '../lib/clientService';

interface ClientContextType {
  availableClients: ClientPermission[];
  selectedClient: ClientPermission | null;
  setSelectedClient: (client: ClientPermission) => void;
  loading: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [availableClients, setAvailableClients] = useState<ClientPermission[]>(
    []
  );
  const [selectedClient, setSelectedClient] = useState<ClientPermission | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      loadUserClients();
    } else {
      setAvailableClients([]);
      setSelectedClient(null);
      setLoading(false);
    }
  }, [user]);

  const loadUserClients = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const clients = await getUserClients(user.email);
      console.log('Clients chargés dans le contexte:', clients);
      setAvailableClients(clients);

      // Sélectionner automatiquement le premier client
      if (clients.length > 0) {
        const currentSelectedId = selectedClient?.clientId;
        const currentClientStillExists = clients.some(
          (c) => c.clientId === currentSelectedId
        );

        // Si pas de client sélectionné ou si le client sélectionné n'existe plus
        if (!currentClientStillExists) {
          setSelectedClient(clients[0]);
          console.log('Client sélectionné automatiquement:', clients[0]);
        }
      } else {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: ClientContextType = {
    availableClients,
    selectedClient,
    setSelectedClient,
    loading,
  };

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}
