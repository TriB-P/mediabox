// app/contexts/SelectionContext.tsx

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

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { selectedClient } = useClient();
  const [loading, setLoading] = useState(true);
  
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedCampaignId: null,
    selectedVersionId: null,
    selectedOngletId: null,
  });

  // Générer une clé unique basée sur l'utilisateur et le client
  const getStorageKey = () => {
    if (!user?.email || !selectedClient?.clientId) return null;
    return `${STORAGE_KEY}-${user.email}-${selectedClient.clientId}`;
  };

  // Charger les sélections depuis le localStorage
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
          console.log('Sélections restaurées depuis localStorage:', parsedSelections);
        } else {
          setSelectionState({
            selectedCampaignId: null,
            selectedVersionId: null,
            selectedOngletId: null,
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sélections:', error);
        // En cas d'erreur, réinitialiser
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
      // Réinitialiser quand il n'y a plus d'utilisateur ou de client
      setSelectionState({
        selectedCampaignId: null,
        selectedVersionId: null,
        selectedOngletId: null,
      });
      setLoading(false);
    }
  }, [user, selectedClient]);

  // Sauvegarder les sélections dans le localStorage
  const saveSelections = (newState: SelectionState) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(newState));
      console.log('Sélections sauvegardées:', newState);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des sélections:', error);
    }
  };

  // Fonctions pour mettre à jour les sélections
  const setSelectedCampaignId = (campaignId: string | null) => {
    const newState = {
      selectedCampaignId: campaignId,
      selectedVersionId: null, // Reset version quand on change de campagne
      selectedOngletId: null,   // Reset onglet quand on change de campagne
    };
    setSelectionState(newState);
    saveSelections(newState);
  };

  const setSelectedVersionId = (versionId: string | null) => {
    const newState = {
      ...selectionState,
      selectedVersionId: versionId,
      selectedOngletId: null, // Reset onglet quand on change de version
    };
    setSelectionState(newState);
    saveSelections(newState);
  };

  const setSelectedOngletId = (ongletId: string | null) => {
    const newState = {
      ...selectionState,
      selectedOngletId: ongletId,
    };
    setSelectionState(newState);
    saveSelections(newState);
  };

  const clearVersionSelection = () => {
    const newState = {
      ...selectionState,
      selectedVersionId: null,
      selectedOngletId: null,
    };
    setSelectionState(newState);
    saveSelections(newState);
  };

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

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}