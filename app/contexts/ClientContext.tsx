/**
 * Ce fichier définit le contexte client pour l'application.
 * Il gère la liste des clients auxquels un utilisateur a accès,
 * le client actuellement sélectionné, et la persistance de ce choix
 * dans le stockage local du navigateur.
 * Cela permet de maintenir le client sélectionné même après un rafraîchissement de page.
 */
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

/**
 * Fournit le contexte client à l'ensemble de l'application.
 * Gère le chargement des clients disponibles pour l'utilisateur,
 * la sélection et la persistance du client choisi.
 * @param {React.ReactNode} children - Les composants enfants qui auront accès au contexte.
 * @returns {JSX.Element} Le fournisseur de contexte client.
 */
export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [availableClients, setAvailableClients] = useState<ClientPermission[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientPermission | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Génère une clé de stockage unique basée sur l'e-mail de l'utilisateur.
   * Cela permet de sauvegarder les préférences de chaque utilisateur séparément.
   * @returns {string | null} La clé de stockage ou null si l'utilisateur n'est pas défini.
   */
  const getStorageKey = () => {
    if (!user?.email) return null;
    return `${CLIENT_STORAGE_KEY}-${user.email}`;
  };

  /**
   * Sauvegarde le client sélectionné dans le stockage local du navigateur.
   * @param {ClientPermission | null} client - Le client à sauvegarder ou null pour supprimer l'entrée.
   * @returns {void}
   */
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

  /**
   * Charge le client sélectionné depuis le stockage local du navigateur.
   * @returns {ClientPermission | null} Le client sauvegardé ou null si non trouvé ou en cas d'erreur.
   */
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

  /**
   * Charge les clients associés à l'utilisateur actuel depuis la base de données.
   * Tente de restaurer un client précédemment sélectionné depuis le stockage local,
   * sinon sélectionne le premier client disponible par défaut.
   * @returns {Promise<void>}
   */
  const loadUserClients = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      console.log("FIREBASE: LECTURE - Fichier: ClientContext.tsx - Fonction: loadUserClients - Path: users/${user.email}/clients");
      const clients = await getUserClients(user.email);
      setAvailableClients(clients);

      const savedClient = loadSelectedClient();
      let clientToSelect: ClientPermission | null = null;

      if (savedClient) {
        const existingClient = clients.find(c => c.clientId === savedClient.clientId);
        if (existingClient) {
          clientToSelect = existingClient;
        } else {
          saveSelectedClient(null);
        }
      }

      if (!clientToSelect && clients.length > 0) {
        clientToSelect = clients[0];
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

  /**
   * Gère le changement du client sélectionné par l'utilisateur.
   * Met à jour l'état et sauvegarde le nouveau client sélectionné dans le stockage local.
   * @param {ClientPermission} client - Le client à sélectionner.
   * @returns {void}
   */
  const handleSetSelectedClient = (client: ClientPermission) => {
    setSelectedClient(client);
    saveSelectedClient(client);
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

/**
 * Hook personnalisé pour utiliser le contexte client.
 * Permet d'accéder aux clients disponibles, au client sélectionné
 * et à la fonction pour changer le client sélectionné depuis n'importe quel composant enfant du ClientProvider.
 * @returns {ClientContextType} Le contexte client.
 * @throws {Error} Si `useClient` est utilisé en dehors d'un `ClientProvider`.
 */
export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}