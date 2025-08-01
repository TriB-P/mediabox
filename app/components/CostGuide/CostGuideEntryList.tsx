// app/components/CostGuide/CostGuideEntryList.tsx
/**
 * Ce fichier définit le composant CostGuideEntryList, qui est responsable de l'affichage
 * d'une liste hiérarchique des entrées d'un guide de coûts. Les entrées sont groupées
 * par niveau 1, puis par niveau 2, puis par niveau 3, et finalement par niveau 4.
 * Le composant permet l'interaction avec les entrées, comme la modification, la suppression,
 * la duplication, et l'ajout de nouvelles entrées avec des valeurs prédéfinies.
 * Il inclut également un mode lecture seule pour désactiver les actions de modification.
 */

'use client';

import { useState } from 'react';
import { CostGuideEntry } from '../../types/costGuide';
import {
  deleteCostGuideEntry,
  duplicateCostGuideEntry,
} from '../../lib/costGuideService';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

interface CostGuideEntryListProps {
  entries: CostGuideEntry[];
  onEdit: (entry: CostGuideEntry) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddWithPreset: (preset: { level1?: string; level2?: string; level3?: string; level4?: string }) => void;
  readOnly?: boolean;
}

/**
 * Affiche une liste hiérarchique et interactive des entrées du guide de coûts.
 * @param {CostGuideEntry[]} entries - La liste des entrées à afficher.
 * @param {Function} onEdit - Callback déclenché lors du clic sur le bouton de modification.
 * @param {Function} onDelete - Callback déclenché après la suppression d'une entrée.
 * @param {Function} onDuplicate - Callback déclenché après la duplication d'une entrée.
 * @param {Function} onAddWithPreset - Callback pour ajouter une nouvelle entrée avec des champs pré-remplis.
 * @param {boolean} [readOnly=false] - Si vrai, désactive les boutons de modification, suppression et duplication.
 * @returns {JSX.Element | null} Le composant React pour la liste des entrées, ou null si la liste est vide.
 */
export default function CostGuideEntryList({
  entries,
  onEdit,
  onDelete,
  onDuplicate,
  onAddWithPreset,
  readOnly = false,
}: CostGuideEntryListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const { t } = useTranslation();

  /**
   * Formate un nombre en une chaîne de caractères représentant une devise en dollars canadiens (CAD).
   * @param {number} amount - Le montant numérique à formater.
   * @returns {string} La chaîne de caractères formatée en devise (ex: "123,45 $").
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  /**
   * Bascule l'état (ouvert/fermé) d'un groupe dans la liste hiérarchique.
   * @param {string} groupId - L'identifiant unique du groupe à basculer.
   * @returns {void}
   */
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  /**
   * Gère la suppression d'une entrée du guide de coûts après confirmation de l'utilisateur.
   * Ne fait rien si le composant est en mode lecture seule.
   * @param {string} guideId - L'ID du guide de coûts parent.
   * @param {string} entryId - L'ID de l'entrée à supprimer.
   * @returns {Promise<void>} Une promesse qui se résout une fois l'opération terminée.
   */
  const handleDeleteEntry = async (guideId: string, entryId: string) => {
    if (readOnly) return;

    if (!confirm(t('costGuideList.deleteConfirmation'))) return;

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: CostGuideEntryList.tsx - Fonction: handleDeleteEntry - Path: costGuides/${guideId}/entries/${entryId}`);
      await deleteCostGuideEntry(guideId, entryId);
      onDelete();
    } catch (err) {
      console.error(t('costGuideList.deleteError'), err);
    }
  };

  /**
   * Gère la duplication d'une entrée du guide de coûts.
   * Ne fait rien si le composant est en mode lecture seule.
   * @param {string} guideId - L'ID du guide de coûts parent.
   * @param {string} entryId - L'ID de l'entrée à dupliquer.
   * @returns {Promise<void>} Une promesse qui se résout une fois l'opération terminée.
   */
  const handleDuplicateEntry = async (guideId: string, entryId: string) => {
    if (readOnly) return;

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: CostGuideEntryList.tsx - Fonction: handleDuplicateEntry - Path: costGuides/${guideId}/entries/${entryId}`);
      await duplicateCostGuideEntry(guideId, entryId);
      onDuplicate();
    } catch (err){
      console.error(t('costGuideList.duplicateError'), err);
    }
  };

  /**
   * Organise la liste plate d'entrées en une structure hiérarchique imbriquée
   * par niveau 1, puis par niveau 2, puis par niveau 3, et finalement par niveau 4.
   * @returns {Record<string, HierarchyItem>} Un objet représentant la hiérarchie des entrées.
   */
  const organizeHierarchy = () => {
    type HierarchyItem = {
      level1: string;
      level2Items: {
        [level2: string]: {
          level3Items: {
            [level3: string]: {
              level4Items: {
                [level4: string]: CostGuideEntry[];
              };
            };
          };
        };
      };
    };

    const hierarchy: Record<string, HierarchyItem> = {};

    entries.forEach((entry) => {
      if (!hierarchy[entry.level1]) {
        hierarchy[entry.level1] = {
          level1: entry.level1,
          level2Items: {},
        };
      }

      if (!hierarchy[entry.level1].level2Items[entry.level2]) {
        hierarchy[entry.level1].level2Items[entry.level2] = {
          level3Items: {},
        };
      }

      if (!hierarchy[entry.level1].level2Items[entry.level2].level3Items[entry.level3]) {
        hierarchy[entry.level1].level2Items[entry.level2].level3Items[entry.level3] = {
          level4Items: {},
        };
      }

      if (!hierarchy[entry.level1].level2Items[entry.level2].level3Items[entry.level3].level4Items[entry.level4]) {
        hierarchy[entry.level1].level2Items[entry.level2].level3Items[entry.level3].level4Items[entry.level4] = [];
      }

      hierarchy[entry.level1].level2Items[entry.level2].level3Items[entry.level3].level4Items[entry.level4].push(entry);
    });

    return hierarchy;
  };

  const hierarchy = organizeHierarchy();

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {Object.values(hierarchy).map((level1Item) => {
        const level1 = level1Item.level1;
        const isLevel1Expanded = expandedGroups[`level1-${level1}`] || false;

        return (
          <div key={level1} className="border-b border-gray-200 last:border-b-0">
            <div
              className={`px-6 py-4 bg-gray-50 flex items-center cursor-pointer ${
                isLevel1Expanded ? 'border-b border-gray-200' : ''
              }`}
              onClick={() => toggleGroup(`level1-${level1}`)}
            >
              {isLevel1Expanded ? (
                <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
              )}
              <h3 className="text-lg font-medium text-gray-900">{level1}</h3>

              {!readOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddWithPreset({ level1: level1 });
                  }}
                  className="ml-3 p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                  title={t('costGuideList.addEntryLevel1')}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {isLevel1Expanded && (
              <div>
                {Object.keys(level1Item.level2Items).map((level2) => {
                  const level2Id = `${level1}-${level2}`;
                  const isLevel2Expanded = expandedGroups[`level2-${level2Id}`] || false;

                  return (
                    <div key={level2Id} className="border-t border-gray-100">
                      <div
                        className={`px-6 py-3 pl-10 bg-gray-50 flex items-center cursor-pointer ${
                          isLevel2Expanded ? 'border-b border-gray-100' : ''
                        }`}
                        onClick={() => toggleGroup(`level2-${level2Id}`)}
                      >
                        {isLevel2Expanded ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                        )}
                        <h4 className="text-md font-medium text-gray-800">{level2}</h4>

                        {!readOnly && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddWithPreset({
                                level1: level1,
                                level2: level2
                              });
                            }}
                            className="ml-3 p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                            title={t('costGuideList.addEntryLevel1And2')}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {isLevel2Expanded && (
                        <div>
                          {Object.keys(level1Item.level2Items[level2].level3Items).map((level3) => {
                            const level3Id = `${level2Id}-${level3}`;
                            const isLevel3Expanded = expandedGroups[`level3-${level3Id}`] || false;

                            return (
                              <div key={level3Id} className="border-t border-gray-50">
                                <div
                                  className={`px-6 py-2 pl-16 bg-gray-50 flex items-center cursor-pointer ${
                                    isLevel3Expanded ? 'border-b border-gray-50' : ''
                                  }`}
                                  onClick={() => toggleGroup(`level3-${level3Id}`)}
                                >
                                  {isLevel3Expanded ? (
                                    <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                                  ) : (
                                    <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                                  )}
                                  <h5 className="text-sm font-medium text-gray-700">{level3}</h5>

                                  {!readOnly && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAddWithPreset({
                                          level1: level1,
                                          level2: level2,
                                          level3: level3
                                        });
                                      }}
                                      className="ml-3 p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                                      title={t('costGuideList.addEntryLevel12And3')}
                                    >
                                      <PlusIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>

                                {isLevel3Expanded && (
                                  <div>
                                    {Object.keys(level1Item.level2Items[level2].level3Items[level3].level4Items).map((level4) => {
                                      const level4Id = `${level3Id}-${level4}`;
                                      const isLevel4Expanded = expandedGroups[`level4-${level4Id}`] || false;

                                      return (
                                        <div key={level4Id} className="border-t border-gray-50">
                                          <div
                                            className={`px-6 py-2 pl-20 bg-gray-50 flex items-center cursor-pointer ${
                                              isLevel4Expanded ? 'border-b border-gray-50' : ''
                                            }`}
                                            onClick={() => toggleGroup(`level4-${level4Id}`)}
                                          >
                                            {isLevel4Expanded ? (
                                              <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                                            ) : (
                                              <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                                            )}
                                            <h6 className="text-sm font-medium text-gray-600">{level4}</h6>

                                            {!readOnly && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onAddWithPreset({
                                                    level1: level1,
                                                    level2: level2,
                                                    level3: level3,
                                                    level4: level4
                                                  });
                                                }}
                                                className="ml-3 p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                                                title={t('costGuideList.addEntryAllLevels')}
                                              >
                                                <PlusIcon className="h-4 w-4" />
                                              </button>
                                            )}
                                          </div>

                                          {isLevel4Expanded && (
                                            <div>
                                              <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                  <tr>
                                                    <th scope="col" className="px-6 py-3 pl-24 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                      {t('costGuideList.unit')}
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                      {t('costGuideList.unitPrice')}
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                      {t('costGuideList.comment')}
                                                    </th>
                                                    {!readOnly && (
                                                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        {t('costGuideList.actions')}
                                                      </th>
                                                    )}
                                                  </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                  {level1Item.level2Items[level2].level3Items[level3].level4Items[level4].map((entry) => (
                                                    <tr key={entry.id} className="hover:bg-gray-50">
                                                      <td className="px-6 py-4 pl-24 whitespace-nowrap text-sm text-gray-900">
                                                        {entry.purchaseUnit}
                                                      </td>
                                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatCurrency(entry.unitPrice)}
                                                      </td>
                                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {entry.comment || '-'}
                                                      </td>
                                                      {!readOnly && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                          <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                              onClick={() => onEdit(entry)}
                                                              className="text-indigo-600 hover:text-indigo-900"
                                                              title={t('costGuideList.edit')}
                                                            >
                                                              <PencilIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                              onClick={() => handleDuplicateEntry(entry.guideId, entry.id)}
                                                              className="text-blue-600 hover:text-blue-900"
                                                              title={t('costGuideList.duplicate')}
                                                            >
                                                              <DocumentDuplicateIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                              onClick={() => handleDeleteEntry(entry.guideId, entry.id)}
                                                              className="text-red-600 hover:text-red-900"
                                                              title={t('costGuideList.delete')}
                                                            >
                                                              <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                          </div>
                                                        </td>
                                                      )}
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}