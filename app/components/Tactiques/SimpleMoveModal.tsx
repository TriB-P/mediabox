/**
 * Ce fichier définit le composant `SimpleMoveModal`, une modale utilisée pour déplacer des éléments (tactiques, sections, etc.) au sein de l'application.
 * Elle permet à l'utilisateur de sélectionner une nouvelle destination via une interface en cascade (campagne, version, onglet, etc.)
 * et de confirmer le déplacement. La modale gère différents états : sélection de destination, affichage de la progression du déplacement, et affichage des résultats.
 */

'use client';

import React from 'react';
import {
  XMarkIcon,
  ChevronRightIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { MoveModalState } from '../../hooks/useSimpleMoveModal';
import { CascadeItem } from '../../lib/simpleMoveService';
import { useTranslation } from '../../contexts/LanguageContext';

interface SimpleMoveModalProps {
  modalState: MoveModalState;
  onClose: () => void;
  onSelectDestination: (level: string, itemId: string, itemName: string) => Promise<void>;
  onConfirmMove: () => Promise<void>;
  isDestinationComplete: boolean;
}

interface CascadeLevelComponentProps {
  title: string;
  items: CascadeItem[];
  selectedId?: string;
  loading: boolean;
  onSelect: (itemId: string, itemName: string) => void;
  isVisible: boolean;
  isRequired: boolean;
  searchable?: boolean;
}

/**
 * Composant `CascadeLevelComponent`
 * Affiche un niveau de sélection dans la cascade de destination (ex: Campagnes, Versions, Onglets).
 * Prend en paramètres:
 * - `title`: Le titre du niveau (ex: "Campagne").
 * - `items`: Un tableau d'éléments à afficher dans ce niveau.
 * - `selectedId`: L'identifiant de l'élément actuellement sélectionné.
 * - `loading`: Indique si les éléments sont en cours de chargement.
 * - `onSelect`: Fonction de rappel appelée lorsqu'un élément est sélectionné.
 * - `isVisible`: Indique si ce niveau doit être affiché.
 * - `isRequired`: Indique si la sélection d'un élément dans ce niveau est obligatoire.
 * - `searchable`: Indique si une barre de recherche doit être affichée pour filtrer les éléments.
 * Retourne: Un composant React affichant le niveau de sélection ou null s'il n'est pas visible.
 */
const CascadeLevelComponent: React.FC<CascadeLevelComponentProps> = ({
  title,
  items,
  selectedId,
  loading,
  onSelect,
  isVisible,
  isRequired,
  searchable = false
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredItems = React.useMemo(() => {
    if (!searchable || !searchTerm.trim()) {
      return items;
    }
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm, searchable]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 capitalize">
            {title}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </h4>
          {loading && (
            <ArrowPathIcon className="h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>

        {searchable && items.length > 0 && (
          <div className="mt-2 relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('simpleMoveModal.cascade.searchPlaceholder', { title: title.toLowerCase() })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      <div className="max-h-48 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto mb-2" />
            <div className="text-sm">{t('common.loading')}</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-sm">
              {searchTerm ? t('simpleMoveModal.cascade.noResultsFound') : t('simpleMoveModal.cascade.noItemsAvailable', { title: title.toLowerCase() })}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id, item.name)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  selectedId === item.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                }`}
                disabled={loading}
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
                    {selectedId === item.id && (
                      <>
                        <CheckIcon className="h-4 w-4 text-indigo-600" />
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      </>
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

interface DestinationSummaryProps {
  destination: any;
  targetLevel?: string;
}

/**
 * Composant `DestinationSummary`
 * Affiche un résumé de la destination actuellement sélectionnée par l'utilisateur.
 * Prend en paramètres:
 * - `destination`: Un objet contenant les noms des éléments sélectionnés pour la destination (ex: campaignName, versionName).
 * - `targetLevel`: Le niveau cible de l'opération de déplacement.
 * Retourne: Un composant React affichant le chemin complet de la destination sélectionnée ou null si aucune destination n'est définie.
 */
const DestinationSummary: React.FC<DestinationSummaryProps> = ({ destination, targetLevel }) => {
  const { t } = useTranslation();
  const pathElements = [];

  if (destination.campaignName) {
    pathElements.push({ label: t('simpleMoveModal.levels.campaign'), value: destination.campaignName });
  }
  if (destination.versionName) {
    pathElements.push({ label: t('simpleMoveModal.levels.version'), value: destination.versionName });
  }
  if (destination.ongletName) {
    pathElements.push({ label: t('simpleMoveModal.levels.tab'), value: destination.ongletName });
  }
  if (destination.sectionName) {
    pathElements.push({ label: t('simpleMoveModal.levels.section'), value: destination.sectionName });
  }
  if (destination.tactiqueName) {
    pathElements.push({ label: t('simpleMoveModal.levels.tactic'), value: destination.tactiqueName });
  }
  if (destination.placementName) {
    pathElements.push({ label: t('simpleMoveModal.levels.placement'), value: destination.placementName });
  }

  if (pathElements.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-blue-900 mb-3">{t('simpleMoveModal.destinationSummary.selectedDestination')}</h4>
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

/**
 * Composant `SimpleMoveModal`
 * Modale principale pour le déplacement d'éléments.
 * Prend en paramètres:
 * - `modalState`: L'état actuel de la modale, géré par un hook (`useSimpleMoveModal`).
 * - `onClose`: Fonction de rappel pour fermer la modale.
 * - `onSelectDestination`: Fonction de rappel appelée lorsqu'un élément de destination est sélectionné.
 * - `onConfirmMove`: Fonction de rappel pour confirmer l'opération de déplacement.
 * - `isDestinationComplete`: Booléen indiquant si une destination complète et valide a été sélectionnée.
 * Retourne: Le composant de la modale ou null si elle n'est pas ouverte.
 */
export default function SimpleMoveModal({
  modalState,
  onClose,
  onSelectDestination,
  onConfirmMove,
  isDestinationComplete
}: SimpleMoveModalProps) {
  const { t } = useTranslation();

  if (!modalState.isOpen) {
    return null;
  }

  const { step, validationResult, destination, error, result, processing } = modalState;

  /**
   * Fonction `shouldShowLevel`
   * Détermine si un niveau de cascade donné doit être visible en fonction du niveau cible de l'opération de déplacement.
   * Prend en paramètre:
   * - `level`: Le niveau à vérifier (ex: 'campaign', 'version', 'onglet').
   * Retourne: `true` si le niveau doit être affiché, `false` sinon.
   */
  const shouldShowLevel = (level: string): boolean => {
    if (!validationResult) return false;

    const targetLevel = validationResult.targetLevel;

    if (!targetLevel) return false;

    switch (level) {
      case 'campaign':
      case 'version':
      case 'onglet':
        return true;
      case 'section':
        return ['section', 'tactique', 'placement'].includes(targetLevel);
      case 'tactique':
        return ['tactique', 'placement'].includes(targetLevel);
      case 'placement':
        return targetLevel === 'placement';
      default:
        return false;
    }
  };

  /**
   * Fonction `renderContent`
   * Rend le contenu de la modale en fonction de l'étape actuelle du processus de déplacement.
   * Gère les étapes 'destination', 'progress' et 'result'.
   * Ne prend aucun paramètre.
   * Retourne: Le JSX correspondant à l'étape actuelle.
   */
  const renderContent = () => {
    switch (step) {
      case 'destination':
        return (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('simpleMoveModal.destination.title')}
                  </h3>
                  {validationResult && (
                    <p className="text-sm text-gray-600 mt-1">
                      {t('simpleMoveModal.destination.itemCount', { count: validationResult.details.selectedItems.length })}{' '}
                      {validationResult.targetLevel === 'onglet' && t('simpleMoveModal.destination.a_tab')}
                      {validationResult.targetLevel === 'section' && t('simpleMoveModal.destination.a_section')}
                      {validationResult.targetLevel === 'tactique' && t('simpleMoveModal.destination.a_tactic')}
                      {validationResult.targetLevel === 'placement' && t('simpleMoveModal.destination.a_placement')}
                      {validationResult.affectedItemsCount > validationResult.details.selectedItems.length && (
                        <span className="text-gray-500">
                          {' '}{t('simpleMoveModal.destination.totalItems', { count: validationResult.affectedItemsCount })}
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

            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-full">

                <CascadeLevelComponent
                  title={t('simpleMoveModal.levels.campaign')}
                  items={modalState.campaigns}
                  selectedId={destination.campaignId}
                  loading={modalState.loadingCampaigns}
                  onSelect={(itemId, itemName) => onSelectDestination('campaign', itemId, itemName)}
                  isVisible={shouldShowLevel('campaign')}
                  isRequired={true}
                  searchable={true}
                />

                <CascadeLevelComponent
                  title={t('simpleMoveModal.levels.version')}
                  items={modalState.versions}
                  selectedId={destination.versionId}
                  loading={modalState.loadingVersions}
                  onSelect={(itemId, itemName) => onSelectDestination('version', itemId, itemName)}
                  isVisible={shouldShowLevel('version')}
                  isRequired={true}
                />

                <CascadeLevelComponent
                  title={t('simpleMoveModal.levels.tab')}
                  items={modalState.onglets}
                  selectedId={destination.ongletId}
                  loading={modalState.loadingOnglets}
                  onSelect={(itemId, itemName) => onSelectDestination('onglet', itemId, itemName)}
                  isVisible={shouldShowLevel('onglet')}
                  isRequired={true}
                />

                <CascadeLevelComponent
                  title={t('simpleMoveModal.levels.section')}
                  items={modalState.sections}
                  selectedId={destination.sectionId}
                  loading={modalState.loadingSections}
                  onSelect={(itemId, itemName) => onSelectDestination('section', itemId, itemName)}
                  isVisible={shouldShowLevel('section')}
                  isRequired={shouldShowLevel('section')}
                />

                <CascadeLevelComponent
                  title={t('simpleMoveModal.levels.tactic')}
                  items={modalState.tactiques}
                  selectedId={destination.tactiqueId}
                  loading={modalState.loadingTactiques}
                  onSelect={(itemId, itemName) => onSelectDestination('tactique', itemId, itemName)}
                  isVisible={shouldShowLevel('tactique')}
                  isRequired={shouldShowLevel('tactique')}
                />

                <CascadeLevelComponent
                  title={t('simpleMoveModal.levels.placement')}
                  items={modalState.placements}
                  selectedId={destination.placementId}
                  loading={modalState.loadingPlacements}
                  onSelect={(itemId, itemName) => onSelectDestination('placement', itemId, itemName)}
                  isVisible={shouldShowLevel('placement')}
                  isRequired={shouldShowLevel('placement')}
                />

              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              {isDestinationComplete && (
                <div className="mb-4">
                  <DestinationSummary
                    destination={destination}
                    targetLevel={validationResult?.targetLevel}
                  />
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
                  disabled={processing}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={onConfirmMove}
                  disabled={!isDestinationComplete || processing}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {processing && (
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {processing ? t('simpleMoveModal.destination.preparing') : t('simpleMoveModal.destination.confirmMove')}
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
              {t('simpleMoveModal.progress.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('simpleMoveModal.progress.description')}
            </p>
            {validationResult && (
              <div className="mt-4 text-xs text-gray-500">
                {t('simpleMoveModal.progress.itemsToProcess', { count: validationResult.affectedItemsCount })}
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
                {result?.success ? t('simpleMoveModal.result.successTitle') : t('simpleMoveModal.result.failureTitle')}
              </h3>

              {result && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium text-green-600">{result.movedCount}</span>{' '}
                    {t('simpleMoveModal.result.itemsMoved', { count: result.movedCount })}
                  </div>
                  {result.skippedCount > 0 && (
                    <div>
                      <span className="font-medium text-yellow-600">{result.skippedCount}</span>{' '}
                      {t('simpleMoveModal.result.itemsSkipped', { count: result.skippedCount })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {result?.errors && result.errors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-red-800 mb-2">{t('simpleMoveModal.result.errors')}:</h4>
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

            {result?.warnings && result.warnings.length > 0 && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">{t('simpleMoveModal.result.warnings')}:</h4>
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
                {t('common.close')}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          onClick={step === 'destination' ? onClose : undefined}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex flex-col h-[80vh]">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}