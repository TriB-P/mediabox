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

const CLIENT_STORAGE_KEY = 'mediabox-selected-client';

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [availableClients, setAvailableClients] = useState<ClientPermission[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientPermission | null>(null);
  const [loading, setLoading] = useState(true);

  // Générer une clé unique basée sur l'utilisateur
  const getStorageKey = () => {
    if (!user?.email) return null;
    return `${CLIENT_STORAGE_KEY}-${user.email}`;
  };

  // Sauvegarder le client sélectionné dans le localStorage
  const saveSelectedClient = (client: ClientPermission | null) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      if (client) {
        localStorage.setItem(storageKey, JSON.stringify({
          clientId: client.clientId,
          CL_Name: client.CL_Name,
          CL_Logo: client.CL_Logo,
        }));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du client sélectionné:', error);
    }
  };

  // Charger le client sélectionné depuis le localStorage
  const loadSelectedClient = () => {
    const storageKey = getStorageKey();
    if (!storageKey) return null;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved) as ClientPermission;
      }
    } catch (error) {
      console.error('Erreur lors du chargement du client sélectionné:', error);
      // En cas d'erreur, nettoyer le localStorage
      localStorage.removeItem(storageKey);
    }
    return null;
  };

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

      // Essayer de restaurer le client sélectionné depuis le localStorage
      const savedClient = loadSelectedClient();
      let clientToSelect: ClientPermission | null = null;

      if (savedClient) {
        // Vérifier que le client sauvegardé existe toujours dans la liste
        const existingClient = clients.find(c => c.clientId === savedClient.clientId);
        if (existingClient) {
          clientToSelect = existingClient;
          console.log('Client restauré depuis localStorage:', existingClient);
        } else {
          console.log('Client sauvegardé non trouvé, suppression du localStorage');
          saveSelectedClient(null);
        }
      }

      // Si pas de client restauré ou client non trouvé, sélectionner le premier client
      if (!clientToSelect && clients.length > 0) {
        clientToSelect = clients[0];
        console.log('Premier client sélectionné automatiquement:', clientToSelect);
      }

      if (clientToSelect) {
        setSelectedClient(clientToSelect);
        saveSelectedClient(clientToSelect);
      } else {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour changer le client sélectionné
  const handleSetSelectedClient = (client: ClientPermission) => {
    setSelectedClient(client);
    saveSelectedClient(client);
    console.log('Client sélectionné et sauvegardé:', client);
  };

  const value: ClientContextType = {
    availableClients,
    selectedClient,
    setSelectedClient: handleSetSelectedClient,
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