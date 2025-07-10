// app/hooks/useDataFlow.ts - Hook central pour la gestion des chargements et états UI

import { useState, useCallback, useRef, useEffect } from 'react';

// ==================== TYPES ====================

export type LoadingType = 'INITIAL' | 'REFRESH' | 'OPERATION' | 'NONE';

export interface LoadingState {
  type: LoadingType;
  message: string;
  progress?: number; // 0-100 pour les barres de progression
  operation?: string; // Description de l'opération en cours
}

export interface SectionExpansionState {
  [sectionId: string]: boolean;
}

export interface DataFlowState {
  // États de chargement
  loading: LoadingState;
  
  // États d'expansion (préservés entre les refresh)
  sectionExpansions: SectionExpansionState;
  
  // États d'erreur
  error: string | null;
  
  // Métadonnées
  lastRefreshTime: number;
  operationInProgress: boolean;
}

interface UseDataFlowProps {
  // Configuration
  minimumLoadingTime?: number; // Temps minimum pour INITIAL (défaut: 1500ms)
  enableDebug?: boolean;
}

interface UseDataFlowReturn {
  // État actuel
  state: DataFlowState;
  
  // Actions de chargement
  startInitialLoading: (message?: string) => void;
  startRefreshLoading: (message?: string) => void;
  startOperationLoading: (operation: string) => void;
  stopLoading: () => void;
  
  // Gestion d'expansion
  setSectionExpanded: (sectionId: string, expanded: boolean) => void;
  toggleSectionExpansion: (sectionId: string) => void;
  setSectionExpansions: (expansions: SectionExpansionState) => void;
  clearExpansions: () => void;
  
  // Gestion d'erreur
  setError: (error: string | null) => void;
  
  // Utilitaires
  isLoading: boolean;
  shouldShowFullLoader: boolean; // Pour le gif complet
  shouldShowTopIndicator: boolean; // Pour la barre discrète
  shouldShowOperationSpinner: boolean; // Pour les spinners locaux
}

// ==================== HOOK PRINCIPAL ====================

export function useDataFlow({
  minimumLoadingTime = 1500,
  enableDebug = false
}: UseDataFlowProps = {}): UseDataFlowReturn {
  
  // ==================== ÉTATS ====================
  
  const [state, setState] = useState<DataFlowState>({
    loading: { type: 'NONE', message: '' },
    sectionExpansions: {},
    error: null,
    lastRefreshTime: 0,
    operationInProgress: false
  });
  
  // Refs pour gérer les timers et éviter les effets de bord
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minimumTimeRef = useRef<boolean>(false);
  
  // ==================== UTILITAIRES ====================
  
  const log = useCallback((message: string, data?: any) => {
    if (enableDebug) {
      console.log(`🔄 [DataFlow] ${message}`, data || '');
    }
  }, [enableDebug]);
  
  // ==================== ACTIONS DE CHARGEMENT ====================
  
  const startInitialLoading = useCallback((message = 'Chargement des données...') => {
    log('Début chargement INITIAL', { message });
    
    // Nettoyer le timer précédent
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
    
    // Timer pour le temps minimum
    loadingTimerRef.current = setTimeout(() => {
      minimumTimeRef.current = true;
      log('Temps minimum écoulé pour INITIAL');
    }, minimumLoadingTime);
    
  }, [minimumLoadingTime, log]);
  
  const startRefreshLoading = useCallback((message = 'Actualisation...') => {
    log('Début chargement REFRESH', { message });
    
    setState(prev => ({
      ...prev,
      loading: { type: 'REFRESH', message, progress: 50 },
      error: null,
      operationInProgress: true
    }));
  }, [log]);
  
  const startOperationLoading = useCallback((operation: string) => {
    log('Début chargement OPERATION', { operation });
    
    setState(prev => ({
      ...prev,
      loading: { type: 'OPERATION', message: `${operation}...`, operation },
      error: null,
      operationInProgress: true
    }));
  }, [log]);
  
  const stopLoading = useCallback(() => {
    const currentType = state.loading.type;
    
    // Pour INITIAL, attendre le temps minimum
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
          // Réessayer dans 100ms
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
    
    // Nettoyer le timer
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, [state.loading.type, log]);
  
  // ==================== GESTION D'EXPANSION ====================
  
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
  
  const setSectionExpansions = useCallback((expansions: SectionExpansionState) => {
    log('Mise à jour massive des expansions', expansions);
    
    setState(prev => ({
      ...prev,
      sectionExpansions: expansions
    }));
  }, [log]);
  
  const clearExpansions = useCallback(() => {
    log('Effacement de toutes les expansions');
    
    setState(prev => ({
      ...prev,
      sectionExpansions: {}
    }));
  }, [log]);
  
  // ==================== GESTION D'ERREUR ====================
  
  const setError = useCallback((error: string | null) => {
    log('Mise à jour erreur', { error });
    
    setState(prev => ({
      ...prev,
      error,
      // Arrêter le chargement en cas d'erreur
      ...(error && {
        loading: { type: 'NONE', message: '' },
        operationInProgress: false
      })
    }));
  }, [log]);
  
  // ==================== PROPRIÉTÉS CALCULÉES ====================
  
  const isLoading = state.loading.type !== 'NONE';
  const shouldShowFullLoader = state.loading.type === 'INITIAL';
  const shouldShowTopIndicator = state.loading.type === 'REFRESH';
  const shouldShowOperationSpinner = state.loading.type === 'OPERATION';
  
  // ==================== NETTOYAGE ====================
  
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);
  
  // ==================== RETURN ====================
  
  return {
    // État
    state,
    
    // Actions de chargement
    startInitialLoading,
    startRefreshLoading,
    startOperationLoading,
    stopLoading,
    
    // Gestion d'expansion
    setSectionExpanded,
    toggleSectionExpansion,
    setSectionExpansions,
    clearExpansions,
    
    // Gestion d'erreur
    setError,
    
    // Utilitaires
    isLoading,
    shouldShowFullLoader,
    shouldShowTopIndicator,
    shouldShowOperationSpinner
  };
}

// ==================== HOOKS UTILITAIRES ====================

/**
 * Hook simplifié pour juste la gestion d'expansion
 */
export function useSectionExpansion(initialExpansions: SectionExpansionState = {}) {
  const [expansions, setExpansions] = useState<SectionExpansionState>(initialExpansions);
  
  const toggle = useCallback((sectionId: string) => {
    setExpansions(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);
  
  const set = useCallback((sectionId: string, expanded: boolean) => {
    setExpansions(prev => ({
      ...prev,
      [sectionId]: expanded
    }));
  }, []);
  
  return { expansions, toggle, set, setExpansions };
}

/**
 * Hook pour les opérations CRUD avec feedback
 */
export function useDataFlowOperations(dataFlow: UseDataFlowReturn) {
  const executeOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      dataFlow.startOperationLoading(operationName);
      const result = await operation();
      
      if (successMessage) {
        // TODO: Intégrer avec un système de notifications
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