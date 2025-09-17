// app/components/Tactiques/HistoryModal.tsx

/**
 * Modal en lecture seule pour afficher l'historique d'une tactique (TC_History)
 * Conserve le formatage et les sauts de ligne du contenu
 */
'use client';

import React from 'react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../../../contexts/LanguageContext';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tactique: {
    TC_Label: string;
    TC_History?: string;
  } | null;
}

export default function HistoryModal({
  isOpen,
  onClose,
  tactique
}: HistoryModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !tactique) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {t('historyModal.title')}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {tactique.TC_Label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tactique.TC_History ? (
            <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {tactique.TC_History}
              </pre>
            </div>
          ) : (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                {t('historyModal.noHistory')}
              </h3>  
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}