// app/components/Tactiques/MoveModal.tsx - VERSION CORRIGÉE

'use client';

import React, { useState, useMemo } from 'react';
import {
  XMarkIcon,
  ChevronRightIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { CascadeLevel, CascadeItem, MoveModalState } from '../../types/move';
import { MOVE_LEVEL_LABELS, TARGET_LEVEL_LABELS } from '../../types/move';

interface MoveModalProps {
  modalState: MoveModalState;
  onClose: () => void;
  onSelectDestination: (level: string, itemId: string) => Promise<void>;
  onConfirmMove: () => Promise<void>;
}

// ==================== COMPOSANT NIVEAU DE CASCADE ====================

interface CascadeLevelComponentProps {
  level: CascadeLevel;
  levelName: string;
  isLast: boolean;
  onSelect: (itemId: string) => void;
  searchable?: boolean;
}

const CascadeLevelComponent: React.FC<CascadeLevelComponentProps> = ({
  level,
  levelName,
  isLast,
  onSelect,
  searchable = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchable || !searchTerm.trim()) {
      return level.items;
    }
    return level.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [level.items, searchTerm, searchable]);

  if (!level.isVisible) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* En-tête du niveau */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 capitalize">
            {levelName}
            {level.isRequired && <span className="text-red-500 ml-1">*</span>}
          </h4>
          {level.loading && (
            <ArrowPathIcon className="h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>
        
        {/* Barre de recherche pour les campagnes */}
        {searchable && level.items.length > 0 && (
          <div className="mt-2 relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Rechercher une ${levelName.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Contenu du niveau */}
      <div className="max-h-48 overflow-y-auto">
        {level.loading ? (
          <div className="p-4 text-center text-gray-500">
            <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto mb-2" />
            <div className="text-sm">Chargement...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-sm">
              {searchTerm ? 'Aucun résultat trouvé' : `Aucun ${levelName.toLowerCase()} disponible`}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  level.selectedId === item.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                }`}
                disabled={level.loading}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {level.selectedId === item.id && (
                      <CheckIcon className="h-4 w-4 text-indigo-600" />
                    )}
                    {!isLast && level.selectedId === item.id && (
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== COMPOSANT RÉSUMÉ DE DESTINATION ====================

interface DestinationSummaryProps {
  modalState: MoveModalState;
}

const DestinationSummary: React.FC<DestinationSummaryProps> = ({ modalState }) => {
  const { destination, selection } = modalState;
  
  if (!selection) return null;

  const pathElements = [];
  
  if (destination.campaignName) {
    pathElements.push({ label: 'Campagne', value: destination.campaignName });
  }
  if (destination.versionName) {
    pathElements.push({ label: 'Version', value: destination.versionName });
  }
  if (destination.ongletName) {
    pathElements.push({ label: 'Onglet', value: destination.ongletName });
  }
  if (destination.sectionName) {
    pathElements.push({ label: 'Section', value: destination.sectionName });
  }
  if (destination.tactiqueName) {
    pathElements.push({ label: 'Tactique', value: destination.tactiqueName });
  }
  if (destination.placementName) {
    pathElements.push({ label: 'Placement', value: destination.placementName });
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-blue-900 mb-3">Destination sélectionnée</h4>
      <div className="space-y-1">
        {pathElements.map((element, index) => (
          <div key={index} className="flex items-center text-sm">
            <span className="text-blue-600 font-medium w-20">{element.label}:</span>
            <span className="text-blue-800">{element.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================

export default function MoveModal({
  modalState,
  onClose,
  onSelectDestination,
  onConfirmMove
}: MoveModalProps) {
  if (!modalState.isOpen) {
    return null;
  }

  const { selection, cascadeLevels, destination, step, loading, error, result } = modalState;

  // Vérifier si la destination est complète
  const isDestinationComplete = useMemo(() => {
    if (!selection) return false;
    
    const targetLevel = selection.targetLevel;
    
    switch (targetLevel) {
      case 'onglet':
        return !!(destination.campaignId && destination.versionId && destination.ongletId);
      case 'section':
        return !!(destination.campaignId && destination.versionId && destination.ongletId && destination.sectionId);
      case 'tactique':
        return !!(destination.campaignId && destination.versionId && destination.ongletId && destination.sectionId && destination.tactiqueId);
      case 'placement':
        return !!(destination.campaignId && destination.versionId && destination.ongletId && destination.sectionId && destination.tactiqueId && destination.placementId);
      default:
        return false;
    }
  }, [selection, destination]);

  // Gestionnaire de sélection avec gestion async améliorée
  const handleSelect = async (level: string, itemId: string) => {
    try {
      console.log(`🎯 Sélection utilisateur: ${level} -> ${itemId}`);
      await onSelectDestination(level, itemId);
    } catch (error) {
      console.error('❌ Erreur lors de la sélection:', error);
      // L'erreur sera gérée par le hook parent
    }
  };

  // Rendu selon l'étape
  const renderContent = () => {
    switch (step) {
      case 'destination':
        return (
          <>
            {/* En-tête avec informations sur le déplacement */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Déplacer les éléments sélectionnés
                  </h3>
                  {selection && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selection.rootElements.length} {MOVE_LEVEL_LABELS[selection.moveLevel]} vers {TARGET_LEVEL_LABELS[selection.targetLevel]}
                      {selection.totalItemsToMove > selection.rootElements.length && (
                        <span className="text-gray-500">
                          {' '}({selection.totalItemsToMove} éléments au total)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Sélection en cascade */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-full">
                {/* Campagnes */}
                <CascadeLevelComponent
                  level={cascadeLevels.campaign}
                  levelName="campagne"
                  isLast={false} // Jamais le dernier niveau
                  onSelect={(itemId) => handleSelect('campaign', itemId)}
                  searchable={true}
                />

                {/* Versions */}
                <CascadeLevelComponent
                  level={cascadeLevels.version}
                  levelName="version"
                  isLast={false} // Jamais le dernier niveau
                  onSelect={(itemId) => handleSelect('version', itemId)}
                />

                {/* Onglets */}
                <CascadeLevelComponent
                  level={cascadeLevels.onglet}
                  levelName="onglet"
                  isLast={selection?.targetLevel === 'onglet'}
                  onSelect={(itemId) => handleSelect('onglet', itemId)}
                />

                {/* Sections */}
                <CascadeLevelComponent
                  level={cascadeLevels.section}
                  levelName="section"
                  isLast={selection?.targetLevel === 'section'}
                  onSelect={(itemId) => handleSelect('section', itemId)}
                />

                {/* Tactiques */}
                <CascadeLevelComponent
                  level={cascadeLevels.tactique}
                  levelName="tactique"
                  isLast={selection?.targetLevel === 'tactique'}
                  onSelect={(itemId) => handleSelect('tactique', itemId)}
                />

                {/* Placements */}
                <CascadeLevelComponent
                  level={cascadeLevels.placement}
                  levelName="placement"
                  isLast={selection?.targetLevel === 'placement'}
                  onSelect={(itemId) => handleSelect('placement', itemId)}
                />
              </div>
            </div>

            {/* Footer avec résumé et actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              {isDestinationComplete && (
                <div className="mb-4">
                  <DestinationSummary modalState={modalState} />
                </div>
              )}
              
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-sm text-red-800">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  onClick={onConfirmMove}
                  disabled={!isDestinationComplete || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading && (
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {loading ? 'Préparation...' : 'Confirmer le déplacement'}
                </button>
              </div>
            </div>
          </>
        );

      case 'progress':
        return (
          <div className="px-6 py-8 text-center">
            <ArrowPathIcon className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Déplacement en cours...
            </h3>
            <p className="text-sm text-gray-600">
              Veuillez patienter pendant que nous déplaçons vos éléments.
            </p>
            {selection && (
              <div className="mt-4 text-xs text-gray-500">
                {selection.totalItemsToMove} élément(s) à traiter
              </div>
            )}
          </div>
        );

      case 'result':
        return (
          <div className="px-6 py-8">
            <div className="text-center mb-6">
              {result?.success ? (
                <CheckIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              ) : (
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
              )}
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {result?.success ? 'Déplacement réussi !' : 'Déplacement échoué'}
              </h3>
              
              {result && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium text-green-600">{result.movedItemsCount}</span> élément(s) déplacé(s)
                  </div>
                  {result.skippedItemsCount > 0 && (
                    <div>
                      <span className="font-medium text-yellow-600">{result.skippedItemsCount}</span> élément(s) ignoré(s)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Erreurs */}
            {result?.errors && result.errors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-red-800 mb-2">Erreurs :</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avertissements */}
            {result?.warnings && result.warnings.length > 0 && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Avertissements :</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="px-6 py-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Étape inconnue
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Une erreur inattendue s'est produite.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity"
          onClick={step === 'destination' ? onClose : undefined} // Empêcher fermeture pendant processing
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex flex-col h-[80vh]">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}