// app/hooks/useCacheLoading.ts

/**
 * Hook personnalisé pour gérer l'état de chargement du cache.
 * Écoute les événements émis par le cacheService et met à jour l'état en conséquence.
 * Fournit un état détaillé du progrès pour l'affichage dans LoadingScreen.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

export interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  details?: string;
}

export interface CacheLoadingState {
  isLoading: boolean;
  currentStep: string;
  steps: LoadingStep[];
  progress: number;
  currentDetails?: string;
  error?: string;
}

// Types d'événements émis par le cacheService
export interface CacheProgressEvent {
  type: 'step-start' | 'step-complete' | 'step-error' | 'details-update' | 'cache-complete' | 'cache-error';
  stepId: string;
  stepLabel?: string;
  details?: string;
  progress?: number;
  error?: string;
}

/**
 * Hook personnalisé pour gérer l'état de chargement du cache.
 * @returns État complet du chargement avec méthodes de contrôle
 */
export function useCacheLoading() {
  const { t } = useTranslation();

  // Définition des étapes de chargement
  const LOADING_STEPS: LoadingStep[] = useMemo(() => [
    {
      id: 'auth',
      label: t('cacheLoading.steps.authVerification'),
      status: 'pending'
    },
    {
      id: 'clients',
      label: t('cacheLoading.steps.loadingAccessibleClients'),
      status: 'pending'
    },
    {
      id: 'global-lists',
      label: t('cacheLoading.steps.loadingGlobalLists'),
      status: 'pending'
    },
    {
      id: 'client-overrides',
      label: t('cacheLoading.steps.loadingClientOverrides'),
      status: 'pending'
    },
    {
      id: 'cache-save',
      label: t('cacheLoading.steps.finalTouch'),
      status: 'pending'
    }
  ], [t]);


  const [state, setState] = useState<CacheLoadingState>({
    isLoading: false,
    currentStep: '',
    steps: [...LOADING_STEPS],
    progress: 0,
    currentDetails: undefined,
    error: undefined
  });

  /**
   * Démarre le processus de chargement.
   */
  const startLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      currentStep: 'auth',
      steps: LOADING_STEPS.map(step => ({ ...step, status: 'pending' })),
      progress: 0,
      currentDetails: undefined,
      error: undefined
    }));
  }, [LOADING_STEPS]);

  /**
   * Termine le processus de chargement avec succès.
   */
  const completeLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100,
      currentStep: '',
      currentDetails: t('cacheLoading.messages.success')
    }));
  }, [t]);

  /**
   * Termine le processus de chargement avec erreur.
   */
  const errorLoading = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error,
      currentDetails: `${t('common.error')}: ${error}`
    }));
  }, [t]);

  /**
   * Met à jour l'état d'une étape spécifique.
   */
  const updateStep = useCallback((stepId: string, status: LoadingStep['status'], details?: string) => {
    setState(prev => {
      const newSteps = prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, status, details }
          : step
      );

      // Calculer le progrès basé sur les étapes complétées
      const completedSteps = newSteps.filter(step => step.status === 'completed').length;
      const totalSteps = newSteps.length;
      const progress = (completedSteps / totalSteps) * 100;

      return {
        ...prev,
        steps: newSteps,
        currentStep: status === 'loading' ? stepId : prev.currentStep,
        progress,
        currentDetails: details
      };
    });
  }, []);

  /**
   * Met à jour les détails de l'étape courante.
   */
  const updateCurrentDetails = useCallback((details: string) => {
    setState(prev => ({
      ...prev,
      currentDetails: details
    }));
  }, []);

  /**
   * Gestionnaire d'événements du cache.
   */
  const handleCacheEvent = useCallback((event: CacheProgressEvent) => {
    switch (event.type) {
      case 'step-start':
        updateStep(event.stepId, 'loading', event.details);
        break;
      
      case 'step-complete':
        updateStep(event.stepId, 'completed', event.details);
        break;
      
      case 'step-error':
        updateStep(event.stepId, 'error', event.error);
        break;
      
      case 'details-update':
        updateCurrentDetails(event.details || '');
        break;
      
      case 'cache-complete':
        completeLoading();
        break;
      
      case 'cache-error':
        errorLoading(event.error || t('cacheLoading.errors.unknown'));
        break;
    }
  }, [updateStep, updateCurrentDetails, completeLoading, errorLoading, t]);

  /**
   * Effet pour écouter les événements du cache.
   */
  useEffect(() => {
    // Écouter les événements personnalisés
    const handleCustomEvent = (event: CustomEvent<CacheProgressEvent>) => {
      handleCacheEvent(event.detail);
    };

    window.addEventListener('cache-progress', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('cache-progress', handleCustomEvent as EventListener);
    };
  }, [handleCacheEvent]);

  return {
    ...state,
    startLoading,
    completeLoading,
    errorLoading,
    updateStep,
    updateCurrentDetails
  };
}

/**
 * Fonction utilitaire pour émettre des événements de progrès depuis le cacheService.
 * @param event L'événement à émettre
 */
export function emitCacheProgress(event: CacheProgressEvent) {
  const customEvent = new CustomEvent('cache-progress', { detail: event });
  window.dispatchEvent(customEvent);
}