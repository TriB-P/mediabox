/**
 * Ce fichier définit le composant TaxonomyUpdateBanner.
 * Ce composant est une bannière qui s'affiche en haut de l'écran pour informer l'utilisateur de l'état
 * d'une mise à jour de la taxonomie. Elle peut indiquer si la mise à jour est en cours,
 * si elle a réussi, ou si une erreur s'est produite.
 */
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

/**
 * Affiche une bannière en haut de la page pour montrer l'état de la mise à jour de la taxonomie.
 * @param {TaxonomyUpdateBannerProps} props - Les propriétés du composant.
 * @param {TaxonomyUpdateStatus} props.status - L'objet contenant l'état de la mise à jour (en cours, erreur, message).
 * @param {() => void} props.onDismiss - La fonction à appeler lorsque l'utilisateur ferme la bannière.
 * @returns {React.ReactElement | null} Le composant de la bannière ou null si aucun message n'est à afficher.
 */
export default function TaxonomyUpdateBanner({ status, onDismiss }: TaxonomyUpdateBannerProps) {
  if (!status.message && !status.isUpdating) {
    return null;
  }

  /**
   * Détermine les classes CSS pour le fond et le texte de la bannière en fonction de l'état.
   * @returns {string} Une chaîne de caractères contenant les classes Tailwind CSS.
   */
  const getBannerClasses = () => {
    if (status.hasError) {
      return 'bg-red-50 border-red-200 text-red-800';
    } else if (status.isUpdating) {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    } else {
      return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  /**
   * Détermine la classe CSS pour la couleur de l'icône en fonction de l'état.
   * @returns {string} Une chaîne de caractères contenant la classe de couleur Tailwind CSS.
   */
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
      <div className="flex justify-center w-full px-4 sm:px-6 lg:px-8">
        <div className="relative w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {status.hasError ? (
                  <ExclamationTriangleIcon className={`h-5 w-5 ${getIconClasses()}`} />
                ) : status.isUpdating ? (
                  <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500`}></div>
                ) : (
                  <CheckCircleIcon className={`h-5 w-5 ${getIconClasses()}`} />
                )}
              </div>

              <span className="text-sm font-medium text-center">
                {status.message}
              </span>
            </div>
          </div>

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