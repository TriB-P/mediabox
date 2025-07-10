// app/components/Others/TopLoadingIndicator.tsx - CORRECTION ERREUR TYPESCRIPT

'use client';

import { useEffect, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

// ==================== TYPES ====================

interface TopLoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
  progress?: number; // 0-100
  type?: 'info' | 'success' | 'warning' | 'error';
  autoHide?: boolean; // Auto-masquer après succès (défaut: true)
  autoHideDelay?: number; // Délai avant masquage (défaut: 2000ms)
  className?: string;
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function TopLoadingIndicator({
  isVisible,
  message = 'Chargement...',
  progress,
  type = 'info',
  autoHide = true,
  autoHideDelay = 2000,
  className = ''
}: TopLoadingIndicatorProps) {
  
  // ==================== ÉTATS LOCAUX ====================
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // ==================== GESTION DES ANIMATIONS ====================
  
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setShowSuccess(false);
    } else if (isAnimating) {
      // Quand on arrête le chargement, montrer brièvement le succès
      if (autoHide && type === 'info') {
        setShowSuccess(true);
        const timer = setTimeout(() => {
          setShowSuccess(false);
          setIsAnimating(false);
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      } else {
        setIsAnimating(false);
      }
    }
  }, [isVisible, isAnimating, autoHide, type, autoHideDelay]);
  
  // ==================== STYLES SELON LE TYPE ====================
  
  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      default: // info
        return 'bg-indigo-50 border-indigo-200 text-indigo-700';
    }
  };
  
  const getProgressBarClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default: // info
        return 'bg-indigo-500';
    }
  };
  
  // ==================== RENDU ====================
  
  if (!isAnimating && !showSuccess) {
    return null;
  }
  
  return (
    <div 
      className={`
        fixed top-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out
        ${isAnimating ? 'translate-y-0' : '-translate-y-full'}
        ${className}
      `}
    >
      <div className={`
        border-b shadow-sm px-4 py-3
        ${getTypeClasses()}
      `}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          
          {/* Contenu principal */}
          <div className="flex items-center space-x-3">
            
            {/* Icône/Spinner */}
            {showSuccess ? (
              <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                <CheckIcon className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className={`
                animate-spin rounded-full h-4 w-4 border-b-2
                ${type === 'error' ? 'border-red-600' : 
                  type === 'warning' ? 'border-yellow-600' : 
                  type === 'success' ? 'border-green-600' : 'border-indigo-600'}
              `} />
            )}
            
            {/* Message */}
            <span className="text-sm font-medium">
              {showSuccess ? 'Actualisation terminée' : message}
            </span>
          </div>
          
          {/* Indicateur de progression (optionnel) */}
          {progress !== undefined && !showSuccess && (
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-white bg-opacity-50 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarClasses()}`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <span className="text-xs font-mono">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Barre de progression pleine largeur (si pas de progress spécifique) */}
        {progress === undefined && !showSuccess && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white bg-opacity-30">
            <div className={`
              h-full ${getProgressBarClasses()} 
              animate-pulse
            `} style={{ width: '60%' }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== VARIANTES PRÉDÉFINIES ====================

interface QuickLoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

/**
 * Indicateur rapide pour les opérations courtes
 */
export function QuickLoadingIndicator({ 
  isVisible, 
  message = 'Traitement...' 
}: QuickLoadingIndicatorProps) {
  return (
    <TopLoadingIndicator
      isVisible={isVisible}
      message={message}
      autoHideDelay={1000}
    />
  );
}

/**
 * Indicateur pour les sauvegardes
 */
export function SaveLoadingIndicator({ 
  isVisible, 
  message = 'Sauvegarde...' 
}: QuickLoadingIndicatorProps) {
  return (
    <TopLoadingIndicator
      isVisible={isVisible}
      message={message}
      type="success"
      autoHideDelay={1500}
    />
  );
}

/**
 * Indicateur pour les erreurs
 */
export function ErrorLoadingIndicator({ 
  isVisible, 
  message = 'Une erreur est survenue' 
}: QuickLoadingIndicatorProps) {
  return (
    <TopLoadingIndicator
      isVisible={isVisible}
      message={message}
      type="error"
      autoHide={false}
    />
  );
}

// ==================== HOOK UTILITAIRE ====================

/**
 * Hook pour simplifier l'utilisation des indicateurs
 */
export function useTopLoadingIndicator() {
  // 🔥 CORRECTION: Type explicite pour éviter l'erreur TypeScript
  const [state, setState] = useState<{
    isVisible: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    progress: number | undefined;
  }>({
    isVisible: false,
    message: '',
    type: 'info', // Plus de "as const" qui restreint le type
    progress: undefined
  });
  
  const show = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setState({ isVisible: true, message, type, progress: undefined });
  };
  
  const showWithProgress = (message: string, progress: number) => {
    setState({ isVisible: true, message, type: 'info', progress });
  };
  
  const hide = () => {
    setState(prev => ({ ...prev, isVisible: false }));
  };
  
  const showQuick = (message: string) => {
    show(message);
    setTimeout(hide, 1500);
  };
  
  return {
    ...state,
    show,
    showWithProgress,
    hide,
    showQuick,
    component: (
      <TopLoadingIndicator
        isVisible={state.isVisible}
        message={state.message}
        type={state.type}
        progress={state.progress}
      />
    )
  };
}