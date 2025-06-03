// app/components/Others/LoadingSpinner.tsx

'use client';

import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  /** Chemin vers le gif d'animation (ex: "/images/loading.gif") */
  gifPath?: string;
  /** Durée minimum d'affichage en millisecondes (défaut: 2000ms) */
  minimumDuration?: number;
  /** Message à afficher sous l'animation */
  message?: string;
  /** Classe CSS personnalisée pour le conteneur */
  className?: string;
  /** Fonction appelée quand le timer minimum est écoulé */
  onMinimumTimeElapsed?: () => void;
}

export default function LoadingSpinner({
  gifPath = "/images/loading.gif",
  minimumDuration = 2000,
  message = "Chargement en cours...",
  className = "",
  onMinimumTimeElapsed
}: LoadingSpinnerProps) {
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
      {/* Container pour le gif */}
      <div className="mb-4 flex items-center justify-center">
        <img 
          src={gifPath}
          alt="Chargement..."
          className="max-w-32 max-h-32 object-contain"
          onError={(e) => {
            // Fallback en cas d'erreur de chargement du gif
            console.warn(`Impossible de charger le gif: ${gifPath}`);
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        
        {/* Fallback spinner CSS si le gif ne charge pas */}
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"
          style={{ display: 'none' }}
          onLoad={(e) => {
            // Si le gif se charge correctement, cacher le spinner de fallback
            const img = (e.target as HTMLElement).parentElement?.querySelector('img');
            if (img && !img.complete) {
              (e.target as HTMLElement).style.display = 'block';
            }
          }}
        />
      </div>
      
      {/* Message de chargement */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900 mb-2">
          {message}
        </div>
        
        {/* Barre de progression minimale */}
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
        
        {/* Indicateur de temps écoulé */}
        {minimumTimeElapsed && (
          <div className="text-xs text-green-600 mt-2 animate-fade-in">
            ✓ Prêt
          </div>
        )}
      </div>
    </div>
  );
}

// Hook personnalisé pour gérer le loading avec timer minimum
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