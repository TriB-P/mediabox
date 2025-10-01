/**
 * app/components/Client/AllShortcodesModal.tsx
 * 
 * Modal central pour voir, modifier et assigner tous les shortcodes.
 * Interface intuitive permettant de gérer l'ensemble des shortcodes depuis un seul endroit.
 */

'use client';

import React, { useState, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  CheckIcon,
  XCircleIcon,
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Shortcode } from '../../lib/shortcodeService';

interface AllShortcodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allShortcodes: Shortcode[];
  currentShortcodes: Shortcode[];
  selectedDimension: string;
  isCustomList: boolean;
  hasPermission: boolean;
  onAddShortcode: (shortcodeId: string) => Promise<void>;
  onUpdateShortcode: (shortcodeId: string, data: Partial<Shortcode>) => Promise<void>;
  onRefresh: () => Promise<void>;
}

/**
 * Modal pour gérer tous les shortcodes disponibles.
 * Permet de voir, modifier et assigner les shortcodes en un seul endroit.
 */
const AllShortcodesModal: React.FC<AllShortcodesModalProps> = ({
  isOpen,
  onClose,
  allShortcodes,
  currentShortcodes,
  selectedDimension,
  isCustomList,
  hasPermission,
  onAddShortcode,
  onUpdateShortcode,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'assigned'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Shortcode>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);

  // Créer un Set des IDs des shortcodes déjà assignés pour des vérifications rapides
  const assignedIds = useMemo(() => {
    return new Set(currentShortcodes.map(s => s.id));
  }, [currentShortcodes]);

  // Filtrer et trier les shortcodes
  const filteredShortcodes = useMemo(() => {
    let filtered = allShortcodes;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(shortcode =>
        shortcode.id.toLowerCase().includes(searchLower) ||
        shortcode.SH_Code.toLowerCase().includes(searchLower) ||
        shortcode.SH_Display_Name_FR.toLowerCase().includes(searchLower) ||
        (shortcode.SH_Display_Name_EN?.toLowerCase().includes(searchLower)) ||
        (shortcode.SH_Default_UTM?.toLowerCase().includes(searchLower)) ||
        (shortcode.SH_Type?.toLowerCase().includes(searchLower))
      );
    }

    // Filtre par statut
    if (filterStatus === 'available') {
      filtered = filtered.filter(s => !assignedIds.has(s.id));
    } else if (filterStatus === 'assigned') {
      filtered = filtered.filter(s => assignedIds.has(s.id));
    }

    // Trier : assignés en premier si "all", puis par nom
    return filtered.sort((a, b) => {
      if (filterStatus === 'all') {
        const aAssigned = assignedIds.has(a.id);
        const bAssigned = assignedIds.has(b.id);
        if (aAssigned !== bAssigned) {
          return bAssigned ? 1 : -1; // assignés en premier
        }
      }
      return a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' });
    });
  }, [allShortcodes, searchQuery, filterStatus, assignedIds]);

  /**
   * Démarre l'édition d'un shortcode
   */
  const startEditing = (shortcode: Shortcode) => {
    setEditingId(shortcode.id);
    setEditingData({
      SH_Code: shortcode.SH_Code,
      SH_Display_Name_FR: shortcode.SH_Display_Name_FR,
      SH_Display_Name_EN: shortcode.SH_Display_Name_EN || '',
      SH_Default_UTM: shortcode.SH_Default_UTM || '',
      SH_Type: shortcode.SH_Type || ''
    });
  };

  /**
   * Annule l'édition
   */
  const cancelEditing = () => {
    setEditingId(null);
    setEditingData({});
  };

  /**
   * Sauvegarde les modifications
   */
  const saveEditing = async () => {
    if (!editingId) return;

    try {
      await onUpdateShortcode(editingId, editingData);
      setEditingId(null);
      setEditingData({});
      await onRefresh(); // Rafraîchir les données
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  /**
   * Assigne un shortcode à la liste active
   */
  const handleAssignShortcode = async (shortcodeId: string) => {
    setIsAssigning(shortcodeId);
    try {
      await onAddShortcode(shortcodeId);
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    } finally {
      setIsAssigning(null);
    }
  };

  /**
   * Copie l'ID d'un shortcode
   */
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(err => console.error('Erreur lors de la copie:', err));
  };

  /**
   * Réinitialise les filtres
   */
  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
  };

  const availableCount = allShortcodes.length - currentShortcodes.length;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-hidden" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-7xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
              
              {/* En-tête du modal - Style harmonisé */}
              <div className="px-6 py-4 border-b border-gray-200 bg-indigo-500 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-bold text-white-800">
                      Gestionnaire de shortcodes
                    </Dialog.Title>
                    <p className="text-white-600 text-sm mt-1">
                      Parcourez, modifiez et assignez vos shortcodes pour "{selectedDimension}"
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Barre de contrôles */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  
                  {/* Recherche */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Rechercher par code, nom, UTM, type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filtres et statistiques */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <FunnelIcon className="h-4 w-4 text-gray-500" />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="all">Tous ({allShortcodes.length})</option>
                        <option value="available">Disponibles ({availableCount})</option>
                        <option value="assigned">Assignés ({currentShortcodes.length})</option>
                      </select>
                    </div>

                    {(searchQuery || filterStatus !== 'all') && (
                      <button
                        onClick={resetFilters}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                </div>

                {/* Informations contextuelles */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600">
                      {filteredShortcodes.length} résultat{filteredShortcodes.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-600">Liste {isCustomList ? 'personnalisée' : 'PlusCo'}</span>
                  </div>
                  {!hasPermission && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                      <span className="text-amber-600">Mode lecture seule</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contenu principal - Tableau des shortcodes */}
              <div className="max-h-[60vh] overflow-auto">
                {filteredShortcodes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <p className="text-gray-500 text-lg mb-2">Aucun shortcode trouvé</p>
                    <p className="text-gray-400 text-sm">
                      {searchQuery 
                        ? `Aucun résultat pour "${searchQuery}"`
                        : 'Aucun shortcode disponible avec les filtres actuels'
                      }
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Code
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                          Nom FR
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                          Nom EN
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          UTM par défaut
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          Type
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Statut
                        </th>
                        <th scope="col" className="px-4 py-3 w-32">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredShortcodes.map((shortcode, index) => {
                        const isAssigned = assignedIds.has(shortcode.id);
                        const isEditing = editingId === shortcode.id;
                        const isAssigningThis = isAssigning === shortcode.id;

                        return (
                          <tr 
                            key={shortcode.id}
                            className={`hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                            } ${isAssigned ? 'bg-blue-25' : ''}`}
                          >
                            {/* Code */}
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingData.SH_Code || ''}
                                  onChange={(e) => setEditingData({...editingData, SH_Code: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              ) : (
                                <div className="text-sm font-medium text-gray-900 break-words">
                                  {shortcode.SH_Code}
                                </div>
                              )}
                            </td>

                            {/* Nom FR */}
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingData.SH_Display_Name_FR || ''}
                                  onChange={(e) => setEditingData({...editingData, SH_Display_Name_FR: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              ) : (
                                <div className="text-sm text-gray-900 break-words">
                                  {shortcode.SH_Display_Name_FR}
                                </div>
                              )}
                            </td>

                            {/* Nom EN */}
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingData.SH_Display_Name_EN || ''}
                                  onChange={(e) => setEditingData({...editingData, SH_Display_Name_EN: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              ) : (
                                <div className="text-sm text-gray-500 break-words">
                                  {shortcode.SH_Display_Name_EN || '—'}
                                </div>
                              )}
                            </td>

                            {/* UTM */}
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingData.SH_Default_UTM || ''}
                                  onChange={(e) => setEditingData({...editingData, SH_Default_UTM: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              ) : (
                                <div className="text-xs text-gray-500 break-words max-w-xs">
                                  {shortcode.SH_Default_UTM || '—'}
                                </div>
                              )}
                            </td>

                            {/* Type */}
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingData.SH_Type || ''}
                                  onChange={(e) => setEditingData({...editingData, SH_Type: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              ) : (
                                <div className="text-xs text-gray-500">
                                  {shortcode.SH_Type || '—'}
                                </div>
                              )}
                            </td>

                            {/* Statut */}
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isAssigned
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {isAssigned ? 'Assigné' : 'Libre'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-1">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={saveEditing}
                                      className="text-green-600 hover:text-green-700 p-1"
                                      title="Sauvegarder"
                                    >
                                      <CheckIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="text-red-600 hover:text-red-700 p-1"
                                      title="Annuler"
                                    >
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleCopyId(shortcode.id)}
                                      className="text-gray-500 hover:text-gray-700 p-1"
                                      title="Copier l'ID"
                                    >
                                      {copiedId === shortcode.id ? (
                                        <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <ClipboardIcon className="h-4 w-4" />
                                      )}
                                    </button>

                                    {hasPermission && (
                                      <button
                                        onClick={() => startEditing(shortcode)}
                                        className="text-indigo-600 hover:text-indigo-700 p-1"
                                        title="Modifier"
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </button>
                                    )}

                                    {!isAssigned && hasPermission && (
                                      <button
                                        onClick={() => handleAssignShortcode(shortcode.id)}
                                        disabled={isAssigningThis}
                                        className={`p-1 transition-colors ${
                                          isAssigningThis
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-emerald-600 hover:text-emerald-700'
                                        }`}
                                        title={isAssigningThis ? "Assignation en cours..." : "Assigner à cette liste"}
                                      >
                                        <PlusIcon className="h-4 w-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pied du modal */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {filteredShortcodes.length} shortcode{filteredShortcodes.length > 1 ? 's' : ''} affiché{filteredShortcodes.length > 1 ? 's' : ''}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AllShortcodesModal;