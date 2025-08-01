// app/components/Others/UnlinkDocumentModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  LinkSlashIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';
import { Document, DocumentUnlinkResult } from '../../types/document';

interface UnlinkDocumentModalProps {
  /** Indique si le modal est ouvert */
  isOpen: boolean;
  
  /** Fonction appelée pour fermer le modal */
  onClose: () => void;
  
  /** Document à dissocier */
  document: Document | null;
  
  /** Fonction appelée lors de la confirmation */
  onConfirm: (document: Document, newName: string) => Promise<DocumentUnlinkResult>;
  
  /** Indique si l'opération est en cours */
  loading?: boolean;
}

/**
 * Modal de confirmation pour dissocier un document.
 * Permet à l'utilisateur de saisir le nom du nouveau document et affiche les avertissements appropriés.
 * @param props Les propriétés du composant.
 * @returns Le composant modal.
 */
export default function UnlinkDocumentModal({
  isOpen,
  onClose,
  document,
  onConfirm,
  loading = false
}: UnlinkDocumentModalProps) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser les états quand le modal s'ouvre/ferme
  useEffect(() => {
    if (isOpen && document) {
      // Pré-remplir avec le nom + "(Unlinked)"
      setNewName(`${document.name} (${t('unlinkDocument.defaultSuffix')})`);
      setError(null);
      setIsSubmitting(false);
    } else if (!isOpen) {
      setNewName('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, document, t]);

  /**
   * Gère la soumission du formulaire.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document || !newName.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await onConfirm(document, newName.trim());
      
      if (result.success) {
        // Fermer le modal en cas de succès
        onClose();
      } else {
        // Afficher l'erreur
        setError(result.errorMessage || t('unlinkDocument.errors.generic'));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('unlinkDocument.errors.unknown');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gère la fermeture du modal.
   */
  const handleClose = () => {
    if (!isSubmitting && !loading) {
      onClose();
    }
  };

  if (!isOpen || !document) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border max-w-lg shadow-lg rounded-lg bg-white">
        
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <LinkSlashIcon className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-medium text-gray-900">
              {t('unlinkDocument.title')}
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting || loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Contenu principal */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avertissement */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-2">
                  {t('unlinkDocument.warning.title')}
                </p>
                <ul className="text-amber-700 space-y-1 list-disc list-inside">
                  <li>{t('unlinkDocument.warning.copyWithoutFormulas')}</li>
                  <li>{t('unlinkDocument.warning.noAutomaticTotals')}</li>
                  <li>{t('unlinkDocument.warning.noLongerLinked')}</li>
                  <li>{t('unlinkDocument.warning.cannotRefresh')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Champ nom */}
          <div>
            <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('unlinkDocument.form.nameLabel')}
            </label>
            <input
              type="text"
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t('unlinkDocument.form.namePlaceholder')}
              disabled={isSubmitting || loading}
              required
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading || !newName.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t('unlinkDocument.form.unlinking')}
                </>
              ) : (
                <>
                  <LinkSlashIcon className="h-4 w-4 mr-2" />
                  {t('unlinkDocument.form.unlinkButton')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}