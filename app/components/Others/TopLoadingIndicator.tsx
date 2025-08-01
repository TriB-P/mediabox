/**
 * Ce fichier définit un composant d'indicateur de chargement qui s'affiche en haut de la page.
 * Il inclut le composant principal `TopLoadingIndicator`, plusieurs variantes prédéfinies pour des cas d'usage courants
 * (Quick, Save, Error), et un hook personnalisé `useTopLoadingIndicator` pour gérer facilement son état (afficher/masquer/mettre à jour).
 */
'use client';

import { useEffect, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

interface TopLoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  type?: 'info' | 'success' | 'warning' | 'error';
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

/**
 * Affiche une barre de chargement en haut de l'écran.
 * @param {boolean} isVisible - Détermine si l'indicateur est visible.
 * @param {string} [message] - Le message à afficher.
 * @param {number} [progress] - Le pourcentage de progression (0-100) à afficher.
 * @param {'info' | 'success' | 'warning' | 'error'} [type='info'] - Le type d'indicateur, qui change la couleur.
 * @param {boolean} [autoHide=true] - Si vrai, se masque automatiquement après un succès.
 * @param {number} [autoHideDelay=2000] - Le délai en ms avant le masquage automatique.
 * @param {string} [className=''] - Classes CSS additionnelles à appliquer au conteneur principal.
 * @returns {JSX.Element | null} Le composant de l'indicateur de chargement ou null s'il n'est pas visible.
 */
export default function TopLoadingIndicator({
  isVisible,
  message,
  progress,
  type = 'info',
  autoHide = true,
  autoHideDelay = 2000,
  className = ''
}: TopLoadingIndicatorProps) {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const effectiveMessage = message ?? t('topLoadingIndicator.messages.loading');

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setShowSuccess(false);
    } else if (isAnimating) {
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

  /**
   * Retourne les classes CSS pour le conteneur principal en fonction du type de l'indicateur.
   * @returns {string} Une chaîne de caractères contenant les classes Tailwind CSS appropriées.
   */
  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-indigo-50 border-indigo-200 text-indigo-700';
    }
  };

  /**
   * Retourne les classes CSS pour la barre de progression en fonction du type de l'indicateur.
   * @returns {string} Une chaîne de caractères contenant la classe de couleur Tailwind CSS pour la progression.
   */
  const getProgressBarClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-indigo-500';
    }
  };

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
          <div className="flex items-center space-x-3">
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
            <span className="text-sm font-medium">
              {showSuccess ? t('topLoadingIndicator.messages.refreshComplete') : effectiveMessage}
            </span>
          </div>
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

interface QuickLoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

/**
 * Variante de l'indicateur pour les opérations courtes, avec un délai de masquage rapide.
 * @param {boolean} isVisible - Détermine si l'indicateur est visible.
 * @param {string} [message] - Le message à afficher.
 * @returns {JSX.Element} Le composant TopLoadingIndicator pré-configuré.
 */
export function QuickLoadingIndicator({
  isVisible,
  message
}: QuickLoadingIndicatorProps) {
  const { t } = useTranslation();
  return (
    <TopLoadingIndicator
      isVisible={isVisible}
      message={message ?? t('topLoadingIndicator.messages.processing')}
      autoHideDelay={1000}
    />
  );
}

/**
 * Variante de l'indicateur pour les opérations de sauvegarde, affichant un style "succès".
 * @param {boolean} isVisible - Détermine si l'indicateur est visible.
 * @param {string} [message] - Le message à afficher.
 * @returns {JSX.Element} Le composant TopLoadingIndicator pré-configuré pour la sauvegarde.
 */
export function SaveLoadingIndicator({
  isVisible,
  message
}: QuickLoadingIndicatorProps) {
  const { t } = useTranslation();
  return (
    <TopLoadingIndicator
      isVisible={isVisible}
      message={message ?? t('topLoadingIndicator.messages.saving')}
      type="success"
      autoHideDelay={1500}
    />
  );
}

/**
 * Variante de l'indicateur pour afficher une erreur. Ne se masque pas automatiquement.
 * @param {boolean} isVisible - Détermine si l'indicateur est visible.
 * @param {string} [message] - Le message à afficher.
 * @returns {JSX.Element} Le composant TopLoadingIndicator pré-configuré pour les erreurs.
 */
export function ErrorLoadingIndicator({
  isVisible,
  message
}: QuickLoadingIndicatorProps) {
  const { t } = useTranslation();
  return (
    <TopLoadingIndicator
      isVisible={isVisible}
      message={message ?? t('topLoadingIndicator.messages.errorOccurred')}
      type="error"
      autoHide={false}
    />
  );
}

/**
 * Hook personnalisé pour simplifier la gestion de l'état du TopLoadingIndicator.
 * Fournit des fonctions pour afficher, masquer et mettre à jour l'indicateur,
 * ainsi que le composant lui-même prêt à être rendu.
 * @returns {{
 * isVisible: boolean,
 * message: string,
 * type: 'info' | 'success' | 'warning' | 'error',
 * progress: number | undefined,
 * show: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void,
 * showWithProgress: (message: string, progress: number) => void,
 * hide: () => void,
 * showQuick: (message: string) => void,
 * component: JSX.Element
 * }} Un objet contenant l'état de l'indicateur et les fonctions pour le contrôler.
 */
export function useTopLoadingIndicator() {
  const [state, setState] = useState<{
    isVisible: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    progress: number | undefined;
  }>({
    isVisible: false,
    message: '',
    type: 'info',
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