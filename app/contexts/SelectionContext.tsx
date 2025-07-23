/**
 * Ce fichier définit le contexte de sélection pour l'application.
 * Il gère la sélection de la campagne, de la version et de l'onglet actuellement actifs.
 * Les sélections sont persistées dans le localStorage pour maintenir l'état entre les sessions de l'utilisateur.
 * Il dépend des contextes d'authentification (AuthContext) et de client (ClientContext)
 * pour générer une clé de stockage unique basée sur l'utilisateur et le client sélectionnés.
 */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useClient } from './ClientContext';

interface SelectionState {
  selectedCampaignId: string | null;
  selectedVersionId: string | null;
  selectedOngletId: string | null;
}

interface SelectionContextType extends SelectionState {
  setSelectedCampaignId: (campaignId: string | null) => void;
  setSelectedVersionId: (versionId: string | null) => void;
  setSelectedOngletId: (ongletId: string | null) => void;
  clearVersionSelection: () => void;
  clearCampaignSelection: () => void;
  loading: boolean;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

const STORAGE_KEY = 'mediabox-selections';

/**
 * Fournit le contexte de sélection à l'ensemble de l'application.
 * Gère le chargement et la sauvegarde des sélections dans le localStorage.
 *
 * @param {Object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Les éléments enfants à rendre dans le fournisseur de contexte.
 * @returns {JSX.Element} Le fournisseur de contexte de sélection.
 */
export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { selectedClient } = useClient();
  const [loading, setLoading] = useState(true);
  
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedCampaignId: null,
    selectedVersionId: null,
    selectedOngletId: null,
  });

  /**
   * Génère une clé unique pour le stockage local basée sur l'e-mail de l'utilisateur et l'ID du client sélectionné.
   *
   * @returns {string | null} La clé de stockage ou null si l'utilisateur ou le client ne sont pas définis.
   */
  const getStorageKey = () => {
    if (!user?.email || !selectedClient?.clientId) return null;
    return `${STORAGE_KEY}-${user.email}-${selectedClient.clientId}`;
  };

  /**
   * Effet de bord pour charger les sélections depuis le localStorage lors du montage du composant
   * ou lorsque l'utilisateur ou le client sélectionné changent.
   *
   * @returns {void}
   */
  useEffect(() => {
    const loadSelections = () => {
      const storageKey = getStorageKey();
      if (!storageKey) {
        setSelectionState({
          selectedCampaignId: null,
          selectedVersionId: null,
          selectedOngletId: null,
        });
        setLoading(false);
        return;
      }

      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedSelections = JSON.parse(saved) as SelectionState;
          setSelectionState(parsedSelections);
        } else {
          setSelectionState({
            selectedCampaignId: null,
            selectedVersionId: null,
            selectedOngletId: null,
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sélections:', error);
        const storageKey = getStorageKey();
        if (storageKey) {
          localStorage.removeItem(storageKey);
        }
        setSelectionState({
          selectedCampaignId: null,
          selectedVersionId: null,
          selectedOngletId: null,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && selectedClient) {
      loadSelections();
    } else {
      setSelectionState({
        selectedCampaignId: null,
        selectedVersionId: null,
        selectedOngletId: null,
      });
      setLoading(false);
    }
  }, [user, selectedClient]);

  /**
   * Sauvegarde l'état actuel des sélections dans le localStorage.
   *
   * @param {SelectionState} newState - Le nouvel état de sélection à sauvegarder.
   * @returns {void}
   */
  const saveSelections = (newState: SelectionState) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(newState));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des sélections:', error);
    }
  };

  /**
   * Met à jour l'ID de la campagne sélectionnée et réinitialise les sélections de version et d'onglet.
   *
   * @param {string | null} campaignId - L'ID de la campagne à sélectionner ou null pour désélectionner.
   * @returns {void}
   */
  const setSelectedCampaignId = (campaignId: string | null) => {
    const newState = {
      selectedCampaignId: campaignId,
      selectedVersionId: null,
      selectedOngletId: null,
    };
    setSelectionState(newState);
    saveSelections(newState);
  };

  /**
   * Met à jour l'ID de la version sélectionnée et réinitialise la sélection de l'onglet.
   *
   * @param {string | null} versionId - L'ID de la version à sélectionner ou null pour désélectionner.
   * @returns {void}
   */
  const setSelectedVersionId = (versionId: string | null) => {
    const newState = {
      ...selectionState,
      selectedVersionId: versionId,
      selectedOngletId: null,
    };
    setSelectionState(newState);
    saveSelections(newState);
  };

  /**
   * Met à jour l'ID de l'onglet sélectionné.
   *
   * @param {string | null} ongletId - L'ID de l'onglet à sélectionner ou null pour désélectionner.
   * @returns {void}
   */
  const setSelectedOngletId = (ongletId: string | null) => {
    const newState = {
      ...selectionState,
      selectedOngletId: ongletId,
    };
    setSelectionState(newState);
    saveSelections(newState);
  };

  /**
   * Réinitialise les sélections de version et d'onglet.
   *
   * @returns {void}
   */
  const clearVersionSelection = () => {
    const newState = {
      ...selectionState,
      selectedVersionId: null,
      selectedOngletId: null,
    };
    setSelectionState(newState);
    saveSelections(newState);
  };

  /**
   * Réinitialise toutes les sélections (campagne, version, onglet).
   *
   * @returns {void}
   */
  const clearCampaignSelection = () => {
    const newState = {
      selectedCampaignId: null,
      selectedVersionId: null,
      selectedOngletId: null,
    };
    setSelectionState(newState);
    saveSelections(newState);
  };

  const value: SelectionContextType = {
    ...selectionState,
    setSelectedCampaignId,
    setSelectedVersionId,
    setSelectedOngletId,
    clearVersionSelection,
    clearCampaignSelection,
    loading,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

/**
 * Hook personnalisé pour utiliser le contexte de sélection.
 *
 * @returns {SelectionContextType} Le contexte de sélection.
 * @throws {Error} Si le hook est utilisé en dehors d'un `SelectionProvider`.
 */
export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}