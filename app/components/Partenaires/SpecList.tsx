/**
 * @file Ce fichier contient le composant React `SpecList`.
 * @description Ce composant est responsable de l'affichage d'une liste de spécifications techniques (`Spec`).
 * Il permet à l'utilisateur de voir les détails de chaque spécification en l'ouvrant/fermant (mode accordéon)
 * et propose des actions pour modifier ou supprimer une spécification via des fonctions passées en props.
 * C'est un composant de présentation qui reçoit ses données et ses fonctions de gestion depuis un composant parent.
 */

'use client';

import React, { useState } from 'react';
import { Spec } from '../../lib/specService';
import { PencilIcon, TrashIcon, DocumentTextIcon, ChevronDownIcon, ChevronUpIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

interface SpecListProps {
  specs: Spec[];
  onEdit: (spec: Spec) => void;
  onDelete: (specId: string) => void;
}

/**
 * Affiche une liste interactive de spécifications techniques.
 * @param {SpecListProps} props - Les propriétés du composant.
 * @param {Spec[]} props.specs - La liste des spécifications à afficher.
 * @param {(spec: Spec) => void} props.onEdit - La fonction à appeler lorsqu'on clique sur le bouton "Modifier".
 * @param {(specId: string) => void} props.onDelete - La fonction à appeler lorsqu'on clique sur le bouton "Supprimer".
 * @returns {React.ReactElement} Le composant JSX affichant la liste des spécifications.
 */
export default function SpecList({ specs, onEdit, onDelete }: SpecListProps) {
  const { t } = useTranslation();
  const [expandedSpec, setExpandedSpec] = useState<string | null>(null);

  /**
   * Gère l'affichage (ouverture/fermeture) du panneau de détails d'une spécification.
   * Si la spécification cliquée est déjà ouverte, elle est fermée. Sinon, elle est ouverte.
   * @param {string} specId - L'identifiant de la spécification à afficher ou cacher.
   */
  const toggleExpand = (specId: string) => {
    if (expandedSpec === specId) {
      setExpandedSpec(null);
    } else {
      setExpandedSpec(specId);
    }
  };

  if (specs.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        {t('specList.emptyState.message')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {specs.map((spec) => (
        <div key={spec.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleExpand(spec.id)}
          >
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
              <h3 className="font-medium text-gray-900">{spec.name}</h3>
              {spec.format && (
                <span className="text-sm text-gray-500">{spec.format}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(spec);
                }}
                className="p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                title={t('specList.actions.edit')}
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(t('specList.actions.confirmDelete'))) {
                    onDelete(spec.id);
                  }
                }}
                className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-100"
                title={t('specList.actions.delete')}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              {expandedSpec === spec.id ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          {expandedSpec === spec.id && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">{t('specList.details.format')}</h4>
                  <p>{spec.format || '-'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">{t('specList.details.ratio')}</h4>
                  <p>{spec.ratio || '-'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">{t('specList.details.fileType')}</h4>
                  <p>{spec.fileType || '-'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">{t('specList.details.animation')}</h4>
                  <p>{spec.animation || '-'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">{t('specList.details.maxWeight')}</h4>
                  <p>{spec.maxWeight || '-'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">{t('specList.details.weight')}</h4>
                  <p>{spec.weight || '-'}</p>
                </div>
              </div>

              {(spec.title || spec.text) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">{t('specList.details.title')}</h4>
                    <p>{spec.title || '-'}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">{t('specList.details.text')}</h4>
                    <p>{spec.text || '-'}</p>
                  </div>
                </div>
              )}

              {spec.specSheetLink && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-1">{t('specList.details.specSheetLink')}</h4>
                  <a
                    href={spec.specSheetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    {spec.specSheetLink}
                  </a>
                </div>
              )}

              {spec.notes && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">{t('specList.details.notes')}</h4>
                  <p className="whitespace-pre-line">{spec.notes}</p>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">
                {t('specList.footer.lastUpdated')} {new Date(spec.updatedAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}