/**
 * Composant modal pour afficher l'historique des valeurs CM360
 * Montre la valeur actuelle vs toutes les valeurs précédentes avec timestamps
 */
'use client';

import React, { useState } from 'react';
import { XMarkIcon, ClockIcon, ExclamationTriangleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { getFieldHistory, CM360TagData, CM360TagHistory } from '../../lib/cm360Service';
import { useTranslation } from '../../contexts/LanguageContext';

interface CM360HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldName: string;
  fieldLabel: string;
  currentValue: any;
  tags: CM360TagData[];
  itemType: 'placement' | 'creative' | 'metrics';
  itemLabel: string;
  cm360Tags?: Map<string, CM360TagHistory>; // Nouveau prop optionnel
}

/**
 * Composant modal d'historique CM360
 */
export default function CM360HistoryModal({
  isOpen,
  onClose,
  fieldName,
  fieldLabel,
  currentValue,
  tags,
  itemType,
  itemLabel,
  cm360Tags
}: CM360HistoryModalProps) {
  const { t } = useTranslation();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  // Obtenir l'historique formaté du champ
  const fieldHistory = getFieldHistory(fieldName, tags, currentValue, cm360Tags);

  /**
   * Formate une valeur pour l'affichage
   */
  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return t('cm360HistoryModal.values.empty');
    }
    
    if (typeof value === 'boolean') {
      return value ? t('common.yes') : t('common.no');
    }
    
    return String(value);
  };

  /**
   * Formate une date pour l'affichage
   */
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('fr-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  /**
   * Détermine si une valeur a changé par rapport à la précédente
   */
  const hasChanged = (currentVal: any, previousVal: any): boolean => {
    return currentVal !== previousVal;
  };

  /**
   * Copie une valeur dans le presse-papier
   */
  const copyToClipboard = async (value: any, index: number) => {
    try {
      const textToCopy = formatValue(value);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <span className="truncate">{t('cm360HistoryModal.header.title')}</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1 truncate">
              {fieldLabel} - {itemLabel} ({itemType === 'placement' ? t('cm360HistoryModal.header.placement') : itemType === 'creative' ? t('cm360HistoryModal.header.creative') : t('cm360HistoryModal.header.metrics')})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0 ml-4"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Valeur actuelle */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-blue-900">{t('cm360HistoryModal.currentValue.title')}</h4>
              </div>
              <div className="flex items-start gap-2">
                <div className="font-mono text-sm bg-white border border-gray-200 rounded px-3 py-2 flex-1 min-w-0 truncate">
                  {formatValue(fieldHistory.current)}
                </div>
                <button
                  onClick={() => copyToClipboard(fieldHistory.current, -1)}
                  className="flex-shrink-0 p-2 hover:bg-blue-100 rounded-md transition-colors"
                  title={t('cm360HistoryModal.buttons.copyValue')}
                >
                  {copiedIndex === -1 ? (
                    <span className="text-xs text-green-600 font-medium">{t('cm360HistoryModal.buttons.copied')}</span>
                  ) : (
                    <DocumentDuplicateIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Historique des tags */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              {t('cm360HistoryModal.history.title')}
            </h4>
            
            {fieldHistory.history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('cm360HistoryModal.history.noHistory')}</p>
              </div>
            ) : (
              <div className="relative">
                {/* Ligne verticale de la timeline */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                
                <div className="space-y-6">
                  {fieldHistory.history.map((entry, index) => {
                    const isLatest = index === 0;
                    const previousEntry = index < fieldHistory.history.length - 1 ? 
                      fieldHistory.history[index + 1] : null;
                    const valueChanged = previousEntry ? 
                      hasChanged(entry.value, previousEntry.value) : true;
                    
                    return (
                      <div 
                        key={`${entry.timestamp}-${entry.version}`}
                        className="relative flex items-start"
                      >
                        {/* Point de la timeline */}
                        <div className="absolute left-2.5 translate-x-[0.075rem] mt-1.5 w-3 h-3 bg-gray-500 border-2 border-white rounded-full shadow-sm z-10"></div>
                        
                        {/* Contenu de l'entrée */}
                        <div className="ml-10 w-full min-w-0">
                          <div className="border rounded-lg p-4 border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500 truncate">
                                {formatTimestamp(entry.timestamp)}
                              </span>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <div className="font-mono text-sm bg-white border border-gray-200 rounded px-3 py-2 flex-1 min-w-0 truncate">
                                {formatValue(entry.value)}
                              </div>
                              <button
                                onClick={() => copyToClipboard(entry.value, index)}
                                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-md transition-colors"
                                title={t('cm360HistoryModal.buttons.copyValue')}
                              >
                                {copiedIndex === index ? (
                                  <span className="text-xs text-green-600 font-medium">{t('cm360HistoryModal.buttons.copied')}</span>
                                ) : (
                                  <DocumentDuplicateIcon className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pied de page */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}