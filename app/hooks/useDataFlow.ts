/**
 * Ce fichier contient des hooks React pour gérer l'état global de l'interface utilisateur,
 * notamment les indicateurs de chargement, la gestion des erreurs et l'expansion des sections.
 * Il centralise la logique de feedback visuel pour les opérations asynchrones.
 * Il fournit des utilitaires pour simplifier l'interaction avec les données et les API.
 */
import { useState, useCallback, useRef, useEffect } from 'react';

export type LoadingType = 'INITIAL' | 'REFRESH' | 'OPERATION' | 'NONE';

export interface LoadingState {
  type: LoadingType;
  message: string;
  progress?: number;
  operation?: string;
}

export interface SectionExpansionState {
  [sectionId: string]: boolean;
}

export interface DataFlowState {
  loading: LoadingState;
  sectionExpansions: SectionExpansionState;
  error: string | null;
  lastRefreshTime: number;
  operationInProgress: boolean;
}

interface UseDataFlowProps {
  minimumLoadingTime?: number;
  enableDebug?: boolean;
}

interface UseDataFlowReturn {
  state: DataFlowState;
  startInitialLoading: (message?: string) => void;
  startRefreshLoading: (message?: string) => void;
  startOperationLoading: (operation: string) => void;
  stopLoading: () => void;
  setSectionExpanded: (sectionId: string, expanded: boolean) => void;
  toggleSectionExpansion: (sectionId: string) => void;
  setSectionExpansions: (expansions: SectionExpansionState) => void;
  clearExpansions: () => void;
  setError: (error: string | null) => void;
  isLoading: boolean;
  shouldShowFullLoader: boolean;
  shouldShowTopIndicator: boolean;
  shouldShowOperationSpinner: boolean;
}

/**
 * Hook principal pour la gestion du flux de données et des états UI.
 * Gère les différents types de chargement (initial, rafraîchissement, opération),
 * les états d'erreur, et l'expansion des sections de l'UI.
 *
 * @param {UseDataFlowProps} props - Propriétés de configuration du hook.
 * @param {number} props.minimumLoadingTime - Temps minimum en ms pour le chargement initial.
 * @param {boolean} props.enableDebug - Active les logs de débogage.
 * @returns {UseDataFlowReturn} Un objet contenant l'état actuel et les fonctions pour interagir avec cet état.
 */
export function useDataFlow({
  minimumLoadingTime = 1500,
  enableDebug = false
}: UseDataFlowProps = {}): UseDataFlowReturn {

  const [state, setState] = useState<DataFlowState>({
    loading: { type: 'NONE', message: '' },
    sectionExpansions: {},
    error: null,
    lastRefreshTime: 0,
    operationInProgress: false
  });

  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minimumTimeRef = useRef<boolean>(false);

  /**
   * Fonction utilitaire pour logger des messages si le mode debug est activé.
   *
   * @param {string} message - Le message à logger.
   * @param {any} [data] - Des données additionnelles à logger.
   */
  const log = useCallback((message: string, data?: any) => {
    if (enableDebug) {
      console.log(`🔄 [DataFlow] ${message}`, data || '');
    }
  }, [enableDebug]);

  /**
   * Démarre un état de chargement initial.
   * Utilisé généralement au premier chargement d'une page ou d'un composant majeur.
   *
   * @param {string} [message='Chargement des données...'] - Message à afficher pendant le chargement.
   */
  const startInitialLoading = useCallback((message = 'Chargement des données...') => {
    log('Début chargement INITIAL', { message });

    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    setState(prev => ({
      ...prev,
      loading: { type: 'INITIAL', message, progress: 0 },
      error: null,
      operationInProgress: true
    }));

    minimumTimeRef.current = false;

    loadingTimerRef.current = setTimeout(() => {
      minimumTimeRef.current = true;
      log('Temps minimum écoulé pour INITIAL');
    }, minimumLoadingTime);

  }, [minimumLoadingTime, log]);

  /**
   * Démarre un état de chargement de rafraîchissement.
   * Utilisé pour indiquer une actualisation de données sans bloquer l'interface.
   *
   * @param {string} [message='Actualisation...'] - Message à afficher pendant le rafraîchissement.
   */
  const startRefreshLoading = useCallback((message = 'Actualisation...') => {
    log('Début chargement REFRESH', { message });

    setState(prev => ({
      ...prev,
      loading: { type: 'REFRESH', message, progress: 50 },
      error: null,
      operationInProgress: true
    }));
  }, [log]);

  /**
   * Démarre un état de chargement pour une opération spécifique.
   * Utilisé pour des actions ciblées (ex: soumission de formulaire, suppression d'élément).
   *
   * @param {string} operation - Description de l'opération en cours.
   */
  const startOperationLoading = useCallback((operation: string) => {
    log('Début chargement OPERATION', { operation });

    setState(prev => ({
      ...prev,
      loading: { type: 'OPERATION', message: `${operation}...`, operation },
      error: null,
      operationInProgress: true
    }));
  }, [log]);

  /**
   * Arrête tout état de chargement en cours.
   * Pour le chargement initial, respecte le temps minimum configuré.
   */
  const stopLoading = useCallback(() => {
    const currentType = state.loading.type;

    if (currentType === 'INITIAL' && !minimumTimeRef.current) {
      log('Attente du temps minimum pour INITIAL');

      const checkMinimumTime = () => {
        if (minimumTimeRef.current) {
          log('Arrêt chargement INITIAL (temps minimum respecté)');
          setState(prev => ({
            ...prev,
            loading: { type: 'NONE', message: '' },
            operationInProgress: false,
            lastRefreshTime: Date.now()
          }));
        } else {
          setTimeout(checkMinimumTime, 100);
        }
      };

      checkMinimumTime();
      return;
    }

    log(`Arrêt chargement ${currentType}`);

    setState(prev => ({
      ...prev,
      loading: { type: 'NONE', message: '' },
      operationInProgress: false,
      lastRefreshTime: Date.now()
    }));

    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, [state.loading.type, log]);

  /**
   * Définit l'état d'expansion d'une section spécifique.
   *
   * @param {string} sectionId - L'identifiant unique de la section.
   * @param {boolean} expanded - `true` pour étendre, `false` pour replier.
   */
  const setSectionExpanded = useCallback((sectionId: string, expanded: boolean) => {
    log(`Section ${sectionId} ${expanded ? 'étendue' : 'repliée'}`);

    setState(prev => ({
      ...prev,
      sectionExpansions: {
        ...prev.sectionExpansions,
        [sectionId]: expanded
      }
    }));
  }, [log]);

  /**
   * Bascule l'état d'expansion d'une section (étendue <-> repliée).
   *
   * @param {string} sectionId - L'identifiant unique de la section.
   */
  const toggleSectionExpansion = useCallback((sectionId: string) => {
    setState(prev => {
      const currentState = prev.sectionExpansions[sectionId] || false;
      const newState = !currentState;

      log(`Toggle section ${sectionId}: ${currentState} → ${newState}`);

      return {
        ...prev,
        sectionExpansions: {
          ...prev.sectionExpansions,
          [sectionId]: newState
        }
      };
    });
  }, [log]);

  /**
   * Définit l'état d'expansion de plusieurs sections à la fois.
   *
   * @param {SectionExpansionState} expansions - Un objet contenant les identifiants de section et leurs états d'expansion.
   */
  const setSectionExpansions = useCallback((expansions: SectionExpansionState) => {
    log('Mise à jour massive des expansions', expansions);

    setState(prev => ({
      ...prev,
      sectionExpansions: expansions
    }));
  }, [log]);

  /**
   * Réinitialise toutes les expansions de section.
   */
  const clearExpansions = useCallback(() => {
    log('Effacement de toutes les expansions');

    setState(prev => ({
      ...prev,
      sectionExpansions: {}
    }));
  }, [log]);

  /**
   * Définit un message d'erreur ou efface l'erreur actuelle.
   * Arrête tout chargement en cours si une erreur est définie.
   *
   * @param {string | null} error - Le message d'erreur à afficher, ou `null` pour effacer l'erreur.
   */
  const setError = useCallback((error: string | null) => {
    log('Mise à jour erreur', { error });

    setState(prev => ({
      ...prev,
      error,
      ...(error && {
        loading: { type: 'NONE', message: '' },
        operationInProgress: false
      })
    }));
  }, [log]);

  const isLoading = state.loading.type !== 'NONE';
  const shouldShowFullLoader = state.loading.type === 'INITIAL';
  const shouldShowTopIndicator = state.loading.type === 'REFRESH';
  const shouldShowOperationSpinner = state.loading.type === 'OPERATION';

  /**
   * Nettoie le timer de chargement si le composant est démonté.
   */
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  return {
    state,
    startInitialLoading,
    startRefreshLoading,
    startOperationLoading,
    stopLoading,
    setSectionExpanded,
    toggleSectionExpansion,
    setSectionExpansions,
    clearExpansions,
    setError,
    isLoading,
    shouldShowFullLoader,
    shouldShowTopIndicator,
    shouldShowOperationSpinner
  };
}

/**
 * Hook simplifié pour gérer spécifiquement l'expansion des sections.
 *
 * @param {SectionExpansionState} [initialExpansions={}] - L'état initial des expansions de section.
 * @returns {{expansions: SectionExpansionState, toggle: (sectionId: string) => void, set: (sectionId: string, expanded: boolean) => void, setExpansions: (expansions: SectionExpansionState) => void}} Un objet contenant l'état des expansions et les fonctions pour les manipuler.
 */
export function useSectionExpansion(initialExpansions: SectionExpansionState = {}) {
  const [expansions, setExpansions] = useState<SectionExpansionState>(initialExpansions);

  /**
   * Bascule l'état d'expansion d'une section.
   *
   * @param {string} sectionId - L'identifiant de la section à basculer.
   */
  const toggle = useCallback((sectionId: string) => {
    setExpansions(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  /**
   * Définit l'état d'expansion d'une section.
   *
   * @param {string} sectionId - L'identifiant de la section.
   * @param {boolean} expanded - `true` pour étendre, `false` pour replier.
   */
  const set = useCallback((sectionId: string, expanded: boolean) => {
    setExpansions(prev => ({
      ...prev,
      [sectionId]: expanded
    }));
  }, []);

  return { expansions, toggle, set, setExpansions };
}

/**
 * Hook pour encapsuler les opérations asynchrones (ex: CRUD) avec un feedback visuel intégré
 * via le hook `useDataFlow`.
 *
 * @param {UseDataFlowReturn} dataFlow - L'objet retourné par `useDataFlow` pour la gestion des états.
 * @returns {{executeOperation: <T>(operationName: string, operation: () => Promise<T>, successMessage?: string) => Promise<T | null>}} Un objet contenant la fonction `executeOperation`.
 */
export function useDataFlowOperations(dataFlow: UseDataFlowReturn) {
  /**
   * Exécute une opération asynchrone et gère les états de chargement et d'erreur.
   *
   * @template T - Le type de la valeur retournée par l'opération.
   * @param {string} operationName - Nom de l'opération à afficher pendant le chargement et les erreurs.
   * @param {() => Promise<T>} operation - La fonction asynchrone à exécuter.
   * @param {string} [successMessage] - Message à afficher en cas de succès de l'opération.
   * @returns {Promise<T | null>} La valeur retournée par l'opération en cas de succès, ou `null` en cas d'erreur.
   */
  const executeOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      dataFlow.startOperationLoading(operationName);
      const result = await operation();

      if (successMessage) {
        console.log(`✅ ${successMessage}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      dataFlow.setError(`Erreur lors de ${operationName}: ${errorMessage}`);
      return null;
    } finally {
      dataFlow.stopLoading();
    }
  }, [dataFlow]);

  return { executeOperation };
}