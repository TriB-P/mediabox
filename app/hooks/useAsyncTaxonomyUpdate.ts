/**
 * Ce fichier contient un hook personnalisé `useAsyncTaxonomyUpdate`
 * qui gère la mise à jour asynchrone des taxonomies. Il utilise un autre hook,
 * `useUpdateTaxonomies`, pour effectuer les opérations de mise à jour réelles.
 * Ce hook gère également l'état de l'interface utilisateur lié à ces mises à jour,
 * affichant des messages de progression, de succès ou d'erreur à l'utilisateur.
 * Il est utile pour les opérations de longue durée qui ne doivent pas bloquer l'interface.
 */

'use client';

import { useState, useCallback } from 'react';
import { useUpdateTaxonomies } from './useUpdateTaxonomies';

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

/**
 * Hook personnalisé pour gérer les mises à jour asynchrones des taxonomies.
 * Il fournit un état de mise à jour (en cours, succès, erreur) et des fonctions pour déclencher et masquer les notifications.
 *
 * @returns {object} Un objet contenant le statut actuel de la mise à jour, la fonction pour déclencher la mise à jour asynchrone, et une fonction pour masquer la notification.
 * @property {TaxonomyUpdateStatus} status - L'état actuel de la mise à jour (isUpdating, message, hasError).
 * @property {(parentType: ParentType, parentData: ParentData) => Promise<void>} updateTaxonomiesAsync - Fonction asynchrone pour démarrer la mise à jour des taxonomies.
 * @property {() => void} dismissNotification - Fonction pour masquer manuellement la notification de mise à jour.
 */
export const useAsyncTaxonomyUpdate = () => {
  const { updateTaxonomies } = useUpdateTaxonomies();

  const [status, setStatus] = useState<TaxonomyUpdateStatus>({
    isUpdating: false,
    message: '',
    hasError: false
  });

  /**
   * Déclenche la mise à jour des taxonomies de manière asynchrone et gère l'état de l'interface utilisateur.
   *
   * @param {ParentType} parentType - Le type de parent (ex: 'campaign', 'tactic', 'placement') pour lequel les taxonomies sont mises à jour.
   * @param {ParentData} parentData - Les données du parent incluant l'ID, le nom, l'ID du client et optionnellement l'ID de la campagne.
   * @returns {Promise<void>} Une promesse qui se résout une fois la mise à jour terminée ou échouée.
   */
  const updateTaxonomiesAsync = useCallback(async (
    parentType: ParentType,
    parentData: ParentData
  ) => {
    setStatus({
      isUpdating: true,
      message: 'Mise à jour des taxonomies en cours...',
      hasError: false
    });

    try {
      await updateTaxonomies(parentType, parentData);

      setStatus({
        isUpdating: false,
        message: 'Taxonomies mises à jour avec succès !',
        hasError: false
      });

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

      setTimeout(() => {
        setStatus({
          isUpdating: false,
          message: '',
          hasError: false
        });
      }, 5000);
    }
  }, [updateTaxonomies]);

  /**
   * Masque la notification de statut de mise à jour.
   *
   * @returns {void}
   */
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