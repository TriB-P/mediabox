// app/components/Others/TaxonomyUpdateBanner.tsx

'use client';

import React from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface TaxonomyUpdateStatus {
  isUpdating: boolean;
  message: string;
  hasError: boolean;
}

interface TaxonomyUpdateBannerProps {
  status: TaxonomyUpdateStatus;
  onDismiss: () => void;
}

export default function TaxonomyUpdateBanner({ status, onDismiss }: TaxonomyUpdateBannerProps) {
  // Ne rien afficher si pas de message
  if (!status.message && !status.isUpdating) {
    return null;
  }

  // Couleurs selon l'état
  const getBannerClasses = () => {
    if (status.hasError) {
      return 'bg-red-50 border-red-200 text-red-800';
    } else if (status.isUpdating) {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    } else {
      return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getIconClasses = () => {
    if (status.hasError) {
      return 'text-red-500';
    } else if (status.isUpdating) {
      return 'text-blue-500';
    } else {
      return 'text-green-500';
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 border-b ${getBannerClasses()} transition-all duration-300`}>
      {/* 🔥 NOUVEAU: Conteneur centré avec largeur réduite */}
      <div className="flex justify-center w-full px-4 sm:px-6 lg:px-8">
        <div className="relative w-full max-w-2xl mx-auto">
          
          {/* 🔥 NOUVEAU: Contenu centré */}
          <div className="flex items-center justify-center py-3">
            
            {/* Contenu principal centré */}
            <div className="flex items-center space-x-3">
              
              {/* Icône */}
              <div className="flex-shrink-0">
                {status.hasError ? (
                  <ExclamationTriangleIcon className={`h-5 w-5 ${getIconClasses()}`} />
                ) : status.isUpdating ? (
                  <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500`}></div>
                ) : (
                  <CheckCircleIcon className={`h-5 w-5 ${getIconClasses()}`} />
                )}
              </div>

              {/* Message */}
              <span className="text-sm font-medium text-center">
                {status.message}
              </span>
            </div>
          </div>

          {/* 🔥 NOUVEAU: Bouton fermer repositionné en absolute */}
          <button
            onClick={onDismiss}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors ${getIconClasses()}`}
          >
            <span className="sr-only">Fermer</span>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}