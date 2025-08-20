// app/components/AdOps/CM360HistoryModal.tsx
/**
 * Composant CM360HistoryModal unifié et optimisé
 * CORRIGÉ : Types unifiés, logique simplifiée, performance améliorée
 */
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { XMarkIcon, ClockIcon, ExclamationTriangleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { getFieldHistory, CM360TagData, CM360TagHistory } from '../../lib/cm360Service';
import { useTranslation } from '../../contexts/LanguageContext';

// Import des types unifiés
import { AdOpsItemType } from '../../types/adops';

// ================================
// INTERFACES LOCALES
// ================================

interface CM360HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldName: string;
  fieldLabel: string;
  currentValue: any;
  tags: CM360TagData[];
  itemType: AdOpsItemType;
  itemLabel: string;
  cm360Tags?: Map<string, CM360TagHistory>;
}

interface HistoryEntry {
  value: any;
  timestamp: string;
  version: number;
}

// ================================
// COMPOSANTS UTILITAIRES
// ================================

/**
 * En-tête du modal optimisé
 */
const ModalHeader = React.memo(({ 
  fieldLabel, 
  itemLabel, 
  itemType, 
  onClose 
}: {
  fieldLabel: string;
  itemLabel: string;
  itemType: AdOpsItemType;
  onClose: () => void;
}) => {
  const { t } = useTranslation();

  const itemTypeLabel = useMemo(() => {
    switch (itemType) {
      case 'placement': return t('cm360HistoryModal.header.placement');
      case 'creative': return t('cm360HistoryModal.header.creative');
      case 'tactique': return t('cm360HistoryModal.header.metrics');
      default: return itemType;
    }
  }, [itemType, t]);

  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <span className="truncate">{t('cm360HistoryModal.header.title')}</span>
        </h3>
        <p className="text-sm text-gray-600 mt-1 truncate">
          {fieldLabel} - {itemLabel} ({itemTypeLabel})
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0 ml-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Fermer"
      >
        <XMarkIcon className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  );
});

ModalHeader.displayName = 'ModalHeader';

/**
 * Section valeur actuelle optimisée
 */
const CurrentValueSection = React.memo(({ 
  currentValue, 
  onCopy, 
  isCopied 
}: {
  currentValue: any;
  onCopy: (value: any) => void;
  isCopied: boolean;
}) => {
  const { t } = useTranslation();

  const formatValue = useCallback((value: any): string => {
    if (value === null || value === undefined || value === '') {
      return t('cm360HistoryModal.values.empty');
    }
    
    if (typeof value === 'boolean') {
      return value ? t('common.yes') : t('common.no');
    }
    
    return String(value);
  }, [t]);

  const handleCopy = useCallback(() => {
    onCopy(currentValue);
  }, [onCopy, currentValue]);

  return (
    <div className="mb-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-medium text-blue-900">{t('cm360HistoryModal.currentValue.title')}</h4>
        </div>
        <div className="flex items-start gap-2">
          <div className="font-mono text-sm bg-white border border-gray-200 rounded px-3 py-2 flex-1 min-w-0 truncate">
            {formatValue(currentValue)}
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-2 hover:bg-blue-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={t('cm360HistoryModal.buttons.copyValue')}
            aria-label={t('cm360HistoryModal.buttons.copyValue')}
          >
            {isCopied ? (
              <span className="text-xs text-green-600 font-medium">{t('cm360HistoryModal.buttons.copied')}</span>
            ) : (
              <DocumentDuplicateIcon className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

CurrentValueSection.displayName = 'CurrentValueSection';

/**
 * Entrée d'historique optimisée
 */
const HistoryEntryComponent = React.memo(({ 
  entry, 
  index, 
  onCopy, 
  copiedIndex 
}: {
  entry: HistoryEntry;
  index: number;
  onCopy: (value: any, index: number) => void;
  copiedIndex: number | null;
}) => {
  const { t } = useTranslation();

  const formatValue = useCallback((value: any): string => {
    if (value === null || value === undefined || value === '') {
      return t('cm360HistoryModal.values.empty');
    }
    
    if (typeof value === 'boolean') {
      return value ? t('common.yes') : t('common.no');
    }
    
    return String(value);
  }, [t]);

  const formatTimestamp = useCallback((timestamp: string): string => {
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
  }, []);

  const handleCopy = useCallback(() => {
    onCopy(entry.value, index);
  }, [onCopy, entry.value, index]);

  return (
    <div className="relative flex items-start">
      {/* Point de la timeline */}
      <div className="absolute left-2.5 translate-x-[0.075rem] mt-1.5 w-3 h-3 bg-gray-500 border-2 border-white rounded-full shadow-sm z-10" />
      
      {/* Contenu de l'entrée */}
      <div className="ml-10 w-full min-w-0">
        <div className="border rounded-lg p-4 border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 truncate">
              {formatTimestamp(entry.timestamp)}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              v{entry.version}
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="font-mono text-sm bg-white border border-gray-200 rounded px-3 py-2 flex-1 min-w-0 truncate">
              {formatValue(entry.value)}
            </div>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              title={t('cm360HistoryModal.buttons.copyValue')}
              aria-label={t('cm360HistoryModal.buttons.copyValue')}
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
});

HistoryEntryComponent.displayName = 'HistoryEntryComponent';

/**
 * Pied de page du modal
 */
const ModalFooter = React.memo(({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
      <div className="text-sm text-gray-600">
        {/* Espace pour informations supplémentaires si nécessaire */}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
});

ModalFooter.displayName = 'ModalFooter';

// ================================
// COMPOSANT PRINCIPAL
// ================================

/**
 * Modal d'historique CM360 optimisé
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

  // Mémoisation de l'historique formaté
  const fieldHistory = useMemo(() => {
    return getFieldHistory(fieldName, tags, currentValue, cm360Tags);
  }, [fieldName, tags, currentValue, cm360Tags]);

  // Gestionnaire de copie avec feedback visuel
  const copyToClipboard = useCallback(async (value: any, index?: number) => {
    try {
      const formatValue = (val: any): string => {
        if (val === null || val === undefined || val === '') {
          return t('cm360HistoryModal.values.empty');
        }
        if (typeof val === 'boolean') {
          return val ? t('common.yes') : t('common.no');
        }
        return String(val);
      };

      const textToCopy = formatValue(value);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedIndex(index ?? -1);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('❌ Erreur lors de la copie:', error);
    }
  }, [t]);

  // Gestionnaire de fermeture avec gestion clavier
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  // Gestionnaire de clic sur l'overlay
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        
        {/* En-tête */}
        <ModalHeader
          fieldLabel={fieldLabel}
          itemLabel={itemLabel}
          itemType={itemType}
          onClose={handleClose}
        />

        {/* Contenu scrollable */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          
          {/* Valeur actuelle */}
          <CurrentValueSection
            currentValue={fieldHistory.current}
            onCopy={copyToClipboard}
            isCopied={copiedIndex === -1}
          />

          {/* Historique des tags */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2" id="modal-title">
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
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300" />
                
                <div className="space-y-6">
                  {fieldHistory.history.map((entry, index) => (
                    <HistoryEntryComponent
                      key={`${entry.timestamp}-${entry.version}`}
                      entry={entry}
                      index={index}
                      onCopy={copyToClipboard}
                      copiedIndex={copiedIndex}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pied de page */}
        <ModalFooter onClose={handleClose} />
      </div>
    </div>
  );
}