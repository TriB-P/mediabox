// app/components/Others/CacheRefreshButton.tsx

/**
 * @file Composant pour le bouton de refresh du cache
 * @summary Ce composant permet aux utilisateurs de forcer un rafraîchissement du cache
 * des shortcodes et des listes. Il utilise la fonction forceRefreshCache du cacheService
 * et gère les états de chargement, succès et erreurs avec un feedback visuel approprié.
 */

'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useClient } from '../../contexts/ClientContext';
import { forceRefreshCache } from '../../lib/cacheService';

type RefreshState = 'idle' | 'loading' | 'success' | 'error';

/**
 * @function CacheRefreshButton
 * @summary Composant bouton pour rafraîchir le cache
 * @description Ce composant affiche un bouton discret permettant de forcer
 * un rafraîchissement complet du cache. Il affiche un feedback visuel pendant
 * l'opération et indique le succès ou l'échec de l'opération.
 * @returns {JSX.Element | null} Le bouton de refresh ou null si les conditions ne sont pas remplies
 */
export default function CacheRefreshButton() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { availableClients } = useClient();
  const [refreshState, setRefreshState] = useState<RefreshState>('idle');

  // Ne pas afficher le bouton si l'utilisateur n'est pas connecté ou n'a pas de clients
  if (!user?.email || availableClients.length === 0) {
    return null;
  }

  /**
   * @function handleRefreshCache
   * @summary Gère le processus de rafraîchissement du cache
   * @description Lance le rafraîchissement forcé du cache et gère les états
   * de chargement, succès et erreur avec un feedback visuel approprié.
   */
  const handleRefreshCache = async () => {
    try {
      setRefreshState('loading');
      
      // Forcer le rafraîchissement du cache avec tous les clients disponibles
      const success = await forceRefreshCache(availableClients, user.email);
      
      if (success) {
        setRefreshState('success');
        // Revenir à l'état idle après 3 secondes
        setTimeout(() => setRefreshState('idle'), 3000);
      } else {
        setRefreshState('error');
        // Revenir à l'état idle après 5 secondes
        setTimeout(() => setRefreshState('idle'), 5000);
      }
    } catch (error) {
      console.error('Erreur lors du refresh du cache:', error);
      setRefreshState('error');
      // Revenir à l'état idle après 5 secondes
      setTimeout(() => setRefreshState('idle'), 5000);
    }
  };

  /**
   * @function getButtonContent
   * @summary Retourne le contenu du bouton selon l'état actuel
   * @returns {Object} Objet contenant l'icône, le texte et les classes CSS
   */
  const getButtonContent = () => {
    switch (refreshState) {
      case 'loading':
        return {
          icon: RefreshCw,
          text: t('cache.refreshing'),
          className: 'text-blue-600 hover:text-blue-700',
          disabled: true
        };
      case 'success':
        return {
          icon: CheckCircle,
          text: t('cache.refreshSuccess'),
          className: 'text-green-600 hover:text-green-700',
          disabled: true
        };
      case 'error':
        return {
          icon: XCircle,
          text: t('cache.refreshError'),
          className: 'text-red-600 hover:text-red-700',
          disabled: true
        };
      default:
        return {
          icon: RefreshCw,
          text: t('cache.refreshCache'),
          className: 'text-gray-500 hover:text-gray-700',
          disabled: false
        };
    }
  };

  const { icon: Icon, text, className, disabled } = getButtonContent();

  return (
    <div className="px-4 py-2 border-t border-gray-200">
      <button
        onClick={handleRefreshCache}
        disabled={disabled}
        className={`w-full flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${className} ${
          disabled 
            ? 'cursor-not-allowed' 
            : 'hover:bg-gray-50 active:bg-gray-100'
        }`}
        title={refreshState === 'idle' ? t('cache.refreshCacheTooltip') : text}
      >
        <Icon 
          className={`h-4 w-4 mr-2 ${
            refreshState === 'loading' ? 'animate-spin' : ''
          }`} 
        />
        <span className="truncate">{text}</span>
      </button>
      
   
      
      {/* Message d'erreur */}
      {refreshState === 'error' && (
        <p className="text-xs text-red-600 text-center mt-1 px-2">
          {t('cache.refreshErrorMessage')}
        </p>
      )}
    </div>
  );
}