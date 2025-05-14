'use client';

import { useState } from 'react';
import { CostGuideEntry } from '../types/costGuide';
import {
  deleteCostGuideEntry,
  duplicateCostGuideEntry,
} from '../lib/costGuideService';
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
}

export default function CostGuideEntryList({
  entries,
  onEdit,
  onDelete,
  onDuplicate,
  onAddWithPreset,
}: CostGuideEntryListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Formatter le montant en devise
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  // Fonction pour basculer l'expansion d'un groupe
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Fonction pour supprimer une entrée
  const handleDeleteEntry = async (guideId: string, entryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;

    try {
      await deleteCostGuideEntry(guideId, entryId);
      onDelete();
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'entrée:', err);
    }
  };

  // Fonction pour dupliquer une entrée
  const handleDuplicateEntry = async (guideId: string, entryId: string) => {
    try {
      await duplicateCostGuideEntry(guideId, entryId);
      onDuplicate();
    } catch (err) {
      console.error('Erreur lors de la duplication de l\'entrée:', err);
    }
  };

  // Organiser les entrées de manière hiérarchique
  const organizeHierarchy = () => {
    // Structure de données pour notre hiérarchie
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

    // Créer la hiérarchie
    const hierarchy: Record<string, HierarchyItem> = {};

    entries.forEach((entry) => {
      // Initialiser la structure pour ce partenaire s'il n'existe pas
      if (!hierarchy[entry.partnerId]) {
        hierarchy[entry.partnerId] = {
          partner: entry.partnerName,
          partnerId: entry.partnerId,
          level1Items: {},
        };
      }

      // Initialiser level1 s'il n'existe pas
      if (!hierarchy[entry.partnerId].level1Items[entry.level1]) {
        hierarchy[entry.partnerId].level1Items[entry.level1] = {
          level2Items: {},
        };
      }

      // Initialiser level2 s'il n'existe pas
      if (!hierarchy[entry.partnerId].level1Items[entry.level1].level2Items[entry.level2]) {
        hierarchy[entry.partnerId].level1Items[entry.level1].level2Items[entry.level2] = {
          level3Items: [],
        };
      }

      // Ajouter l'entrée à level3
      hierarchy[entry.partnerId].level1Items[entry.level1].level2Items[entry.level2].level3Items.push(
        entry
      );
    });

    return hierarchy;
  };

  const hierarchy = organizeHierarchy();
  
  // Si aucune entrée
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Partenaires */}
      {Object.values(hierarchy).map((partnerItem) => {
        const partnerId = partnerItem.partnerId;
        const isPartnerExpanded = expandedGroups[`partner-${partnerId}`] || false;
        
        return (
          <div key={partnerId} className="border-b border-gray-200 last:border-b-0">
            {/* En-tête Partenaire */}
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
              
              {/* Bouton pour ajouter une entrée pour ce partenaire */}
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
            </div>

            {/* Contenu Partenaire */}
            {isPartnerExpanded && (
              <div>
                {/* Niveau 1 */}
                {Object.keys(partnerItem.level1Items).map((level1) => {
                  const level1Id = `${partnerId}-${level1}`;
                  const isLevel1Expanded = expandedGroups[`level1-${level1Id}`] || false;
                  
                  return (
                    <div key={level1Id} className="border-t border-gray-100">
                      {/* En-tête Niveau 1 */}
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
                        
                        {/* Bouton pour ajouter une entrée avec level1 prérempli */}
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
                      </div>

                      {/* Contenu Niveau 1 */}
                      {isLevel1Expanded && (
                        <div>
                          {/* Niveau 2 */}
                          {Object.keys(partnerItem.level1Items[level1].level2Items).map((level2) => {
                            const level2Id = `${level1Id}-${level2}`;
                            const isLevel2Expanded = expandedGroups[`level2-${level2Id}`] || false;
                            
                            return (
                              <div key={level2Id} className="border-t border-gray-50">
                                {/* En-tête Niveau 2 */}
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
                                  
                                  {/* Bouton pour ajouter une entrée avec level1 et level2 préremplis */}
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
                                </div>

                                {/* Contenu Niveau 2 (Niveau 3 - Entrées) */}
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
                                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                          </th>
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