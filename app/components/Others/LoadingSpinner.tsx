/**
 * Ce fichier contient un composant React `LoadingSpinner` et un hook personnalisé `useMinimumLoading`.
 * Leur but est d'afficher une animation de chargement pendant au moins une durée minimale
 * pour éviter les flashs d'interface (UI) lorsque les données se chargent très rapidement.
 * Cela améliore l'expérience utilisateur en donnant une impression de fluidité.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';

interface LoadingSpinnerProps {
  gifPath?: string;
  minimumDuration?: number;
  message?: string;
  className?: string;
  onMinimumTimeElapsed?: () => void;
}

/**
 * Affiche un spinner de chargement avec un message et une barre de progression.
 * Le spinner est garanti de s'afficher pendant une durée minimale pour une meilleure expérience utilisateur.
 * @param {object} props - Les propriétés du composant.
 * @param {string} [props.gifPath="/images/loading.gif"] - Chemin vers le fichier GIF d'animation.
 * @param {number} [props.minimumDuration=2000] - Durée minimale d'affichage du spinner en millisecondes.
 * @param {string} [props.message] - Le message à afficher sous le spinner.
 * @param {string} [props.className=""] - Classes CSS additionnelles pour le conteneur principal.
 * @param {() => void} [props.onMinimumTimeElapsed] - Une fonction de callback exécutée une fois la durée minimale écoulée.
 * @returns {React.ReactElement} Le composant de chargement.
 */
export default function LoadingSpinner({
  gifPath = "/images/loading.gif",
  minimumDuration = 2000,
  message,
  className = "",
  onMinimumTimeElapsed
}: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumTimeElapsed(true);
      if (onMinimumTimeElapsed) {
        onMinimumTimeElapsed();
      }
    }, minimumDuration);

    return () => clearTimeout(timer);
  }, [minimumDuration, onMinimumTimeElapsed]);

  return (
    <div className={`flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow ${className}`}>
      <div className="mb-4 flex items-center justify-center">
        <img 
          src={gifPath}
          alt={t('loadingSpinner.alt.loading')}
          className="max-w-32 max-h-32 object-contain"
          onError={(e) => {
            console.warn(`${t('loadingSpinner.error.gifLoadFailed')} ${gifPath}`);
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"
          style={{ display: 'none' }}
          onLoad={(e) => {
            const img = (e.target as HTMLElement).parentElement?.querySelector('img');
            if (img && !img.complete) {
              (e.target as HTMLElement).style.display = 'block';
            }
          }}
        />
      </div>
      
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900 mb-2">
          {message ?? t('loadingSpinner.message.inProgress')}
        </div>
        
        <div className="w-48 bg-gray-200 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ease-out ${
              minimumTimeElapsed ? 'bg-green-600 w-full' : 'bg-indigo-600 w-1/3'
            }`}
            style={{
              animation: minimumTimeElapsed ? 'none' : 'pulse 2s ease-in-out infinite'
            }}
          />
        </div>
        
        {minimumTimeElapsed && (
          <div className="text-xs text-green-600 mt-2 animate-fade-in">
            ✓ {t('loadingSpinner.status.ready')}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Un hook personnalisé pour gérer un état de chargement qui doit durer un temps minimum.
 * Utile pour éviter de masquer un spinner de chargement trop rapidement.
 * @param {boolean} isLoading - L'état de chargement brut (par exemple, venant d'une requête de données).
 * @param {number} [minimumDuration=2000] - La durée minimale en millisecondes pendant laquelle le chargement doit être affiché.
 * @returns {boolean} Retourne `true` si le chargement doit être affiché, `false` sinon.
 */
export function useMinimumLoading(isLoading: boolean, minimumDuration: number = 2000) {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      setMinimumTimeElapsed(false);
      
      const timer = setTimeout(() => {
        setMinimumTimeElapsed(true);
      }, minimumDuration);

      return () => clearTimeout(timer);
    }
  }, [isLoading, minimumDuration]);

  useEffect(() => {
    if (!isLoading && minimumTimeElapsed) {
      setShowLoading(false);
    }
  }, [isLoading, minimumTimeElapsed]);

  return showLoading;
}