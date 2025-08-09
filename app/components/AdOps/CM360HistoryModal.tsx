// app/components/AdOps/CM360HistoryModal.tsx
/**
 * Composant modal pour afficher l'historique des valeurs CM360
 * Montre la valeur actuelle vs toutes les valeurs précédentes avec timestamps
 */
'use client';

import React from 'react';
import { XMarkIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getFieldHistory, CM360TagData, CM360TagHistory } from '../../lib/cm360Service';

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
  if (!isOpen) return null;

  // Obtenir l'historique formaté du champ
  const fieldHistory = getFieldHistory(fieldName, tags, currentValue, cm360Tags);

  /**
   * Formate une valeur pour l'affichage
   */
  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return '(vide)';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
              Historique des modifications
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {fieldLabel} - {itemLabel} ({itemType === 'placement' ? 'Placement' : itemType === 'creative' ? 'Créatif' : 'Métriques'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
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
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <h4 className="font-medium text-blue-900">Valeur actuelle</h4>
              </div>
              <div className="text-lg font-mono bg-white border border-blue-200 rounded px-3 py-2">
                {formatValue(fieldHistory.current)}
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Cette valeur est différente du dernier tag créé
              </p>
            </div>
          </div>

          {/* Historique des tags */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              Historique des tags créés
            </h4>
            
            {fieldHistory.history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun historique disponible pour ce champ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fieldHistory.history.map((entry, index) => {
                  const isLatest = index === 0;
                  const previousEntry = index < fieldHistory.history.length - 1 ? 
                    fieldHistory.history[index + 1] : null;
                  const valueChanged = previousEntry ? 
                    hasChanged(entry.value, previousEntry.value) : true;
                  
                  return (
                    <div 
                      key={`${entry.timestamp}-${entry.version}`}
                      className={`border rounded-lg p-4 ${
                        isLatest 
                          ? 'border-orange-200 bg-orange-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isLatest ? 'bg-orange-600' : 'bg-gray-400'
                          }`}></div>
                          <span className="font-medium text-sm">
                            Version {entry.version}
                            {isLatest && (
                              <span className="text-orange-700 ml-2">(Dernier tag)</span>
                            )}
                          </span>
                          {valueChanged && index > 0 && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                              Modifié
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      
                      <div className="font-mono text-sm bg-white border border-gray-200 rounded px-3 py-2">
                        {formatValue(entry.value)}
                      </div>
                      
                      {/* Comparaison avec la valeur actuelle */}
                      {isLatest && entry.value !== fieldHistory.current && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                          ⚠️ Cette valeur diffère de la valeur actuelle
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Informations additionnelles */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Informations</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Valeur actuelle :</strong> Ce qui est affiché dans le tableau maintenant</li>
              <li>• <strong>Dernier tag :</strong> La valeur lors de la dernière création de tag CM360</li>
              <li>• <strong>Versions :</strong> Chaque création de tag incrémente la version</li>
              <li>• <strong>Modifications :</strong> Les changements sont détectés automatiquement</li>
            </ul>
          </div>
        </div>

        {/* Pied de page */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {fieldHistory.history.length} version{fieldHistory.history.length !== 1 ? 's' : ''} de tag trouvée{fieldHistory.history.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}