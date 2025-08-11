// app/contexts/ClientContext.tsx

/**
 * Ce fichier définit le contexte client pour l'application.
 * Il gère la liste des clients auxquels un utilisateur a accès,
 * le client actuellement sélectionné, et la persistance de ce choix
 * dans le stockage local du navigateur.
 * VERSION MISE À JOUR : Inclut maintenant la redirection automatique 
 * vers /no-access si l'utilisateur n'a accès à aucun client.
 * CORRECTION : Permet l'affichage de la page /no-access même quand hasAccess = false.
 */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { getUserClients, ClientPermission } from '../lib/clientService';
import { cacheUserClients, smartCacheUpdate } from '../lib/cacheService';
import { useCacheLoading } from '../hooks/useCacheLoading';
import LoadingScreen from '../components/LoadingScreen';

interface ClientContextType {
  availableClients: ClientPermission[];
  selectedClient: ClientPermission | null;
  setSelectedClient: (client: ClientPermission) => void;
  loading: boolean;
  hasAccess: boolean; // Nouveau : indique si l'utilisateur a au moins un client
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

const CLIENT_STORAGE_KEY = 'mediabox-selected-client';

/**
 * Fournit le contexte client à l'ensemble de l'application.
 * Gère le chargement des clients disponibles pour l'utilisateur,
 * la sélection et la persistance du client choisi.
 * NOUVEAU : Redirige automatiquement vers /no-access si aucun client disponible.
 * CORRECTION : Permet l'affichage de la page /no-access même sans accès client.
 * @param {React.ReactNode} children - Les composants enfants qui auront accès au contexte.
 * @returns {JSX.Element} Le fournisseur de contexte client.
 */
export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [availableClients, setAvailableClients] = useState<ClientPermission[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientPermission | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true); // Par défaut true pour éviter la redirection prématurée

  // Hook pour la gestion du chargement du cache
  const cacheLoading = useCacheLoading();

  // Vérifier si on est sur la page no-access
  const isOnNoAccessPage = pathname === '/no-access';

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
      setHasAccess(true); // Réinitialiser à true quand pas d'utilisateur
      setLoading(false);
    }
  }, [user]);

  /**
   * Charge les clients associés à l'utilisateur actuel depuis la base de données.
   * NOUVEAU : Gère la redirection automatique vers /no-access si aucun client disponible.
   * @returns {Promise<void>}
   */
  const loadUserClients = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      
      // 1. Démarrer l'écran de chargement
      cacheLoading.startLoading();
      
      // 2. Étape d'authentification (déjà faite, marquer comme complète)
      cacheLoading.updateStep('auth', 'completed', 'Utilisateur authentifié');

      // 3. Charger les clients depuis Firebase
      console.log("FIREBASE: LECTURE - Fichier: ClientContext.tsx - Fonction: loadUserClients - Path: users/${user.email}/clients");
      const clients = await getUserClients(user.email);
      setAvailableClients(clients);

      // 4. NOUVEAU : Vérifier l'accès et rediriger si nécessaire
      if (clients.length === 0) {
        console.log('Aucun client disponible pour l\'utilisateur, redirection vers /no-access');
        setHasAccess(false);
        // Fermer l'écran de chargement avant la redirection
        cacheLoading.completeLoading();
        router.push('/no-access');
        return; // Arrêter ici pour éviter le traitement supplémentaire
      } else {
        setHasAccess(true);
      }

      // 5. Mise à jour intelligente du cache (seulement si l'utilisateur a accès)
      const cacheSuccess = await smartCacheUpdate(clients, user.email);
      
      if (!cacheSuccess) {
        console.warn('[CACHE] Échec de la mise à jour du cache, mais on continue...');
      }

      // 6. Restaurer la sélection client depuis le stockage local
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
      cacheLoading.errorLoading('Erreur lors du chargement des données');
      // En cas d'erreur, on considère que l'utilisateur n'a pas accès
      setHasAccess(false);
      // Fermer l'écran de chargement avant la redirection
      cacheLoading.completeLoading();
      router.push('/no-access');
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
    hasAccess, // Nouveau champ exposé
  };

  return (
    <ClientContext.Provider value={value}>
      {/* Écran de chargement du cache - s'affiche seulement si l'utilisateur a accès */}
      {hasAccess && (
        <LoadingScreen
          isVisible={cacheLoading.isLoading}
          currentStep={cacheLoading.currentStep}
          steps={cacheLoading.steps}
          progress={cacheLoading.progress}
          currentDetails={cacheLoading.currentDetails}
        />
      )}
      
      {/* CORRECTION : Contenu normal de l'application */}
      {/* Afficher si l'utilisateur a accès OU s'il est sur la page no-access */}
      {(hasAccess || isOnNoAccessPage) && children}
    </ClientContext.Provider>
  );
}

/**
 * Hook personnalisé pour utiliser le contexte client.
 * Permet d'accéder aux clients disponibles, au client sélectionné,
 * à la fonction pour changer le client sélectionné et au statut d'accès.
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