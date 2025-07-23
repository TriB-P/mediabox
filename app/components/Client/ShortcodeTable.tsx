/**
 * Ce composant a pour rôle d'afficher une table de "shortcodes".
 * Il gère l'affichage des données, les états de chargement, et les interactions de l'utilisateur
 * comme la copie d'ID, la modification et la suppression de shortcodes.
 * Il intègre une pagination (déclenchée via un bouton "Charger plus") et un filtrage local
 * sur les données déjà chargées. Les permissions d'édition et de suppression sont gérées
 * en fonction des props reçues.
 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Shortcode } from '../../lib/shortcodeService';
import ShortcodeDetail from './ShortcodeDetail';

interface ShortcodeTableProps {
  shortcodes: Shortcode[];
  hasPermission: boolean;
  isCustomList: boolean;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  searchQuery: string;
  userRole: string | null;
  onRemoveShortcode: (shortcodeId: string) => Promise<void>;
  onUpdateShortcode: () => Promise<void>;
  onLoadMore: () => Promise<void>;
}

/**
 * Affiche un tableau paginé et filtrable de shortcodes.
 * @param {ShortcodeTableProps} props - Les propriétés du composant.
 * @param {Shortcode[]} props.shortcodes - La liste des shortcodes actuellement chargés.
 * @param {boolean} props.hasPermission - Indique si l'utilisateur a la permission de supprimer des éléments.
 * @param {boolean} props.isCustomList - Indique s'il s'agit d'une liste personnalisée (pour les messages de confirmation).
 * @param {boolean} props.loading - État de chargement initial.
 * @param {boolean} props.loadingMore - État de chargement lors du clic sur "Charger plus".
 * @param {boolean} props.hasMore - Indique s'il y a d'autres shortcodes à charger.
 * @param {number} props.totalCount - Le nombre total de shortcodes disponibles sur le serveur.
 * @param {string} props.searchQuery - La chaîne de recherche pour filtrer les shortcodes localement.
 * @param {string | null} props.userRole - Le rôle de l'utilisateur ('admin' ou autre) pour déterminer les droits d'édition.
 * @param {(shortcodeId: string) => Promise<void>} props.onRemoveShortcode - Fonction de rappel pour supprimer un shortcode.
 * @param {() => Promise<void>} props.onUpdateShortcode - Fonction de rappel pour rafraîchir les données après une mise à jour.
 * @param {() => Promise<void>} props.onLoadMore - Fonction de rappel pour charger la page suivante de shortcodes.
 * @returns {React.ReactElement} Le composant JSX représentant la table de shortcodes.
 */
const ShortcodeTable: React.FC<ShortcodeTableProps> = ({
  shortcodes,
  hasPermission,
  isCustomList,
  loading,
  loadingMore,
  hasMore,
  totalCount,
  searchQuery,
  userRole,
  onRemoveShortcode,
  onUpdateShortcode,
  onLoadMore
}) => {
  const canEditShortcode = userRole === 'admin';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedShortcode, setSelectedShortcode] = useState<Shortcode | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const filteredShortcodes = useMemo(() => {
    if (!searchQuery) return shortcodes;
    
    const searchLower = searchQuery.toLowerCase();
    return shortcodes.filter(shortcode => 
      shortcode.SH_Code.toLowerCase().includes(searchLower) ||
      shortcode.SH_Display_Name_FR.toLowerCase().includes(searchLower) ||
      (shortcode.SH_Display_Name_EN?.toLowerCase().includes(searchLower)) ||
      (shortcode.SH_Default_UTM?.toLowerCase().includes(searchLower))
    );
  }, [shortcodes, searchQuery]);

  /**
   * Copie l'ID d'un shortcode dans le presse-papiers et affiche une confirmation visuelle.
   * @param {string} id - L'ID du shortcode à copier.
   */
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(err => {
        console.error('Erreur lors de la copie dans le presse-papier:', err);
      });
  };

  /**
   * Gère la suppression d'un shortcode après une confirmation de l'utilisateur.
   * @param {string} shortcodeId - L'ID du shortcode à supprimer.
   */
  const handleRemove = async (shortcodeId: string) => {
    const confirmMessage = isCustomList 
      ? "Êtes-vous sûr de vouloir retirer ce shortcode de cette liste ?"
      : "Êtes-vous sûr de vouloir retirer ce shortcode de la liste PlusCo ? Cela affectera tous les clients qui utilisent cette liste.";
    
    if (window.confirm(confirmMessage)) {
      await onRemoveShortcode(shortcodeId);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-3 bg-gray-50">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (shortcodes.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Aucun shortcode dans cette liste.</p>
      </div>
    );
  }

  if (searchQuery && filteredShortcodes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="text-sm text-gray-500">
            Recherche dans {shortcodes.length} shortcodes chargés sur {totalCount} total
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">
            Aucun shortcode ne correspond à votre recherche dans les éléments chargés.
          </p>
          {hasMore && (
            <p className="text-sm text-gray-400 mt-2">
              Essayez de charger plus d'éléments pour élargir la recherche.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-3 bg-gray-50 flex justify-between items-center border-b border-gray-200">
        <div className="text-sm text-gray-500">
          {searchQuery ? (
            <>
              {filteredShortcodes.length} résultat{filteredShortcodes.length > 1 ? 's' : ''} 
              dans {shortcodes.length} éléments chargés sur {totalCount} total
            </>
          ) : (
            <>
              {shortcodes.length} sur {totalCount} shortcodes chargés
            </>
          )}
        </div>
        
        {searchQuery && (
          <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            Recherche locale uniquement
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Code
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                Nom FR
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Nom EN
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                UTM par défaut
              </th>
              <th scope="col" className="px-3 py-3 w-24">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredShortcodes.map((shortcode) => (
              <tr key={shortcode.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-3 py-3 text-sm font-medium text-gray-900">
                  <div className="break-words" style={{ maxWidth: '120px' }}>
                    {shortcode.SH_Code}
                  </div>
                </td>
                <td className="px-3 py-3 text-sm text-gray-500">
                  <div className="break-words" style={{ maxWidth: '250px' }}>
                    {shortcode.SH_Display_Name_FR}
                  </div>
                </td>
                <td className="px-3 py-3 text-sm text-gray-500">
                  <div className="break-words" style={{ maxWidth: '180px' }}>
                    {shortcode.SH_Display_Name_EN || '—'}
                  </div>
                </td>
                <td className="px-3 py-3 text-sm text-gray-500">
                  <div className="break-words text-xs" style={{ maxWidth: '300px' }}>
                    {shortcode.SH_Default_UTM || '—'}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleCopyId(shortcode.id)}
                      className="text-gray-600 hover:text-gray-900 group relative transition-colors duration-150"
                      title="Copier l'ID du code"
                    >
                      {copiedId === shortcode.id ? (
                        <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <ClipboardIcon className="h-4 w-4" />
                      )}
                      <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                        Copier l'ID
                      </span>
                    </button>
                    
                    {canEditShortcode && (
                      <button
                        onClick={() => {
                          setSelectedShortcode(shortcode);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 group relative transition-colors duration-150"
                        title="Modifier ce shortcode"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                          Modifier
                        </span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => hasPermission && handleRemove(shortcode.id)}
                      className={`group relative transition-colors duration-150 ${
                        hasPermission 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!hasPermission}
                      title={
                        !hasPermission 
                          ? "Permission requise"
                          : isCustomList 
                            ? "Retirer de cette liste" 
                            : "Retirer de la liste PlusCo"
                      }
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                        {!hasPermission 
                          ? "Permission requise"
                          : "Retirer"}
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && !searchQuery && (
        <div className="flex justify-center py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                Chargement...
              </>
            ) : (
              <>
                Charger plus de shortcodes
                <span className="ml-2 text-xs opacity-75">
                  ({totalCount - shortcodes.length} restants)
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {!hasMore && shortcodes.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500 border-t border-gray-200 bg-gray-50">
          Tous les shortcodes ont été chargés ({totalCount} au total)
        </div>
      )}

      {selectedShortcode && (
        <ShortcodeDetail
          shortcode={selectedShortcode}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onDelete={onUpdateShortcode}
          onUpdate={onUpdateShortcode}
        />
      )}
    </div>
  );
};

export default ShortcodeTable;