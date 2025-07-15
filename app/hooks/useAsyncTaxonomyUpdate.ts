// app/hooks/useAsyncTaxonomyUpdate.ts

'use client';

import { useState, useCallback } from 'react';
import { useUpdateTaxonomies } from './useUpdateTaxonomies';

// ==================== TYPES ====================

interface TaxonomyUpdateStatus {
  isUpdating: boolean;
  message: string;
  hasError: boolean;
}

interface ParentData {
  id: string;
  name: string;
  clientId: string;
  campaignId?: string;
}

type ParentType = 'campaign' | 'tactic' | 'placement';

// ==================== HOOK PRINCIPAL ====================

export const useAsyncTaxonomyUpdate = () => {
  const { updateTaxonomies } = useUpdateTaxonomies();
  
  const [status, setStatus] = useState<TaxonomyUpdateStatus>({
    isUpdating: false,
    message: '',
    hasError: false
  });

  const updateTaxonomiesAsync = useCallback(async (
    parentType: ParentType, 
    parentData: ParentData
  ) => {
    console.log(`🚀 [AsyncUpdate] Démarrage en arrière-plan pour ${parentType}: ${parentData.name}`);

    // Afficher le bandeau
    setStatus({
      isUpdating: true,
      message: 'Mise à jour des taxonomies en cours...',
      hasError: false
    });

    try {
      // Appeler ton hook qui fonctionne
      await updateTaxonomies(parentType, parentData);

      // Succès
      setStatus({
        isUpdating: false,
        message: 'Taxonomies mises à jour avec succès !',
        hasError: false
      });

      // Auto-cacher après 3 secondes
      setTimeout(() => {
        setStatus({
          isUpdating: false,
          message: '',
          hasError: false
        });
      }, 3000);

    } catch (error) {
      console.error('❌ [AsyncUpdate] Erreur:', error);
      
      setStatus({
        isUpdating: false,
        message: '❌ Erreur lors de la mise à jour des taxonomies',
        hasError: true
      });

      // Auto-cacher les erreurs après 5 secondes
      setTimeout(() => {
        setStatus({
          isUpdating: false,
          message: '',
          hasError: false
        });
      }, 5000);
    }
  }, [updateTaxonomies]);

  const dismissNotification = useCallback(() => {
    setStatus({
      isUpdating: false,
      message: '',
      hasError: false
    });
  }, []);

  return {
    status,
    updateTaxonomiesAsync,
    dismissNotification
  };
};