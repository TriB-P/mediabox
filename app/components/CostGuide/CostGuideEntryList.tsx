/**
 * Ce fichier définit le composant CostGuideEntryList, qui est responsable de l'affichage
 * d'une liste hiérarchique des entrées d'un guide de coûts. Les entrées sont groupées
 * par partenaire, puis par catégories (niveau 1 et 2). Le composant permet
 * l'interaction avec les entrées, comme la modification, la suppression, la duplication,
 * et l'ajout de nouvelles entrées avec des valeurs prédéfinies. Il inclut également un mode
 * lecture seule pour désactiver les actions de modification.
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

interface CostGuideEntryListProps {
  entries: CostGuideEntry[];
  onEdit: (entry: CostGuideEntry) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddWithPreset: (preset: { partnerId?: string; level1?: string; level2?: string }) => void;
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

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: CostGuideEntryList.tsx - Fonction: handleDeleteEntry - Path: costGuides/${guideId}/entries/${entryId}`);
      await deleteCostGuideEntry(guideId, entryId);
      onDelete();
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'entrée:', err);
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
      console.error('Erreur lors de la duplication de l\'entrée:', err);
    }
  };

  /**
   * Organise la liste plate d'entrées en une structure hiérarchique imbriquée
   * par partenaire, puis par niveau 1 et niveau 2.
   * @returns {Record<string, HierarchyItem>} Un objet représentant la hiérarchie des entrées.
   */
  const organizeHierarchy = () => {
    type HierarchyItem = {
      partner: string;
      partnerId: string;
      level1Items: {
        [level1: string]: {
          level2Items: {
            [level2: string]: {
              level3Items: CostGuideEntry[];
            };
          };
        };
      };
    };

    const hierarchy: Record<string, HierarchyItem> = {};

    entries.forEach((entry) => {
      if (!hierarchy[entry.partnerId]) {
        hierarchy[entry.partnerId] = {
          partner: entry.partnerName,
          partnerId: entry.partnerId,
          level1Items: {},
        };
      }

      if (!hierarchy[entry.partnerId].level1Items[entry.level1]) {
        hierarchy[entry.partnerId].level1Items[entry.level1] = {
          level2Items: {},
        };
      }

      if (!hierarchy[entry.partnerId].level1Items[entry.level1].level2Items[entry.level2]) {
        hierarchy[entry.partnerId].level1Items[entry.level1].level2Items[entry.level2] = {
          level3Items: [],
        };
      }

      hierarchy[entry.partnerId].level1Items[entry.level1].level2Items[entry.level2].level3Items.push(
        entry
      );
    });

    return hierarchy;
  };

  const hierarchy = organizeHierarchy();

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {Object.values(hierarchy).map((partnerItem) => {
        const partnerId = partnerItem.partnerId;
        const isPartnerExpanded = expandedGroups[`partner-${partnerId}`] || false;

        return (
          <div key={partnerId} className="border-b border-gray-200 last:border-b-0">
            <div
              className={`px-6 py-4 bg-gray-50 flex items-center cursor-pointer ${
                isPartnerExpanded ? 'border-b border-gray-200' : ''
              }`}
              onClick={() => toggleGroup(`partner-${partnerId}`)}
            >
              {isPartnerExpanded ? (
                <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
              )}
              <h3 className="text-lg font-medium text-gray-900">{partnerItem.partner}</h3>

              {!readOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddWithPreset({ partnerId: partnerId });
                  }}
                  className="ml-3 p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                  title="Ajouter une entrée pour ce partenaire"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {isPartnerExpanded && (
              <div>
                {Object.keys(partnerItem.level1Items).map((level1) => {
                  const level1Id = `${partnerId}-${level1}`;
                  const isLevel1Expanded = expandedGroups[`level1-${level1Id}`] || false;

                  return (
                    <div key={level1Id} className="border-t border-gray-100">
                      <div
                        className={`px-6 py-3 pl-10 bg-gray-50 flex items-center cursor-pointer ${
                          isLevel1Expanded ? 'border-b border-gray-100' : ''
                        }`}
                        onClick={() => toggleGroup(`level1-${level1Id}`)}
                      >
                        {isLevel1Expanded ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                        )}
                        <h4 className="text-md font-medium text-gray-800">{level1}</h4>

                        {!readOnly && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddWithPreset({
                                partnerId: partnerId,
                                level1: level1
                              });
                            }}
                            className="ml-3 p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                            title="Ajouter une entrée avec ce niveau 1"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {isLevel1Expanded && (
                        <div>
                          {Object.keys(partnerItem.level1Items[level1].level2Items).map((level2) => {
                            const level2Id = `${level1Id}-${level2}`;
                            const isLevel2Expanded = expandedGroups[`level2-${level2Id}`] || false;

                            return (
                              <div key={level2Id} className="border-t border-gray-50">
                                <div
                                  className={`px-6 py-2 pl-16 bg-gray-50 flex items-center cursor-pointer ${
                                    isLevel2Expanded ? 'border-b border-gray-50' : ''
                                  }`}
                                  onClick={() => toggleGroup(`level2-${level2Id}`)}
                                >
                                  {isLevel2Expanded ? (
                                    <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                                  ) : (
                                    <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                                  )}
                                  <h5 className="text-sm font-medium text-gray-700">{level2}</h5>

                                  {!readOnly && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAddWithPreset({
                                          partnerId: partnerId,
                                          level1: level1,
                                          level2: level2
                                        });
                                      }}
                                      className="ml-3 p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                                      title="Ajouter une entrée avec ces niveaux 1 et 2"
                                    >
                                      <PlusIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>

                                {isLevel2Expanded && (
                                  <div>
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th scope="col" className="px-6 py-3 pl-20 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Niveau 3
                                          </th>
                                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Unité
                                          </th>
                                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Prix unitaire
                                          </th>
                                          {!readOnly && (
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                              Actions
                                            </th>
                                          )}
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {partnerItem.level1Items[level1].level2Items[level2].level3Items.map((entry) => (
                                          <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 pl-20 whitespace-nowrap text-sm text-gray-900">
                                              {entry.level3}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                              {entry.purchaseUnit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                              {formatCurrency(entry.unitPrice)}
                                            </td>
                                            {!readOnly && (
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                  <button
                                                    onClick={() => onEdit(entry)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Modifier"
                                                  >
                                                    <PencilIcon className="h-4 w-4" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDuplicateEntry(entry.guideId, entry.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Dupliquer"
                                                  >
                                                    <DocumentDuplicateIcon className="h-4 w-4" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteEntry(entry.guideId, entry.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Supprimer"
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
  );
}