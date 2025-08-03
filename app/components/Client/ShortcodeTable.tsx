/**
 * app/components/Client/ShortcodeTable.tsx
 * 
 * Version scrollable du tableau de shortcodes - supprime la pagination
 * et utilise un conteneur avec scroll vertical pour afficher tous les éléments.
 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Shortcode } from '../../lib/shortcodeService';
import ShortcodeDetail from './ShortcodeDetail';

interface ShortcodeTableProps {
  shortcodes: Shortcode[];
  hasPermission: boolean;
  isCustomList: boolean;
  loading: boolean;
  searchQuery: string;
  userRole: string | null;
  onRemoveShortcode: (shortcodeId: string) => Promise<void>;
  onUpdateShortcode: () => Promise<void>;
}

/**
 * Affiche un tableau scrollable et filtrable de shortcodes.
 * @param {ShortcodeTableProps} props - Les propriétés du composant.
 * @param {Shortcode[]} props.shortcodes - La liste complète des shortcodes.
 * @param {boolean} props.hasPermission - Indique si l'utilisateur a la permission de supprimer des éléments.
 * @param {boolean} props.isCustomList - Indique s'il s'agit d'une liste personnalisée.
 * @param {boolean} props.loading - État de chargement initial.
 * @param {string} props.searchQuery - La chaîne de recherche pour filtrer les shortcodes.
 * @param {string | null} props.userRole - Le rôle de l'utilisateur pour déterminer les droits d'édition.
 * @param {(shortcodeId: string) => Promise<void>} props.onRemoveShortcode - Fonction pour supprimer un shortcode.
 * @param {() => Promise<void>} props.onUpdateShortcode - Fonction pour rafraîchir après une mise à jour.
 * @returns {React.ReactElement} Le composant JSX représentant la table scrollable.
 */
const ShortcodeTable: React.FC<ShortcodeTableProps> = ({
  shortcodes,
  hasPermission,
  isCustomList,
  loading,
  searchQuery,
  userRole,
  onRemoveShortcode,
  onUpdateShortcode
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
            Recherche dans {shortcodes.length} shortcodes
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">
            Aucun shortcode ne correspond à votre recherche.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col">
      {/* En-tête fixe avec statistiques */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {searchQuery ? (
              <>
                {filteredShortcodes.length} résultat{filteredShortcodes.length > 1 ? 's' : ''} 
                sur {shortcodes.length} shortcodes
              </>
            ) : (
              <>
                {shortcodes.length} shortcode{shortcodes.length > 1 ? 's' : ''}
              </>
            )}
          </div>
          
          {searchQuery && (
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              Recherche instantanée
            </div>
          )}
        </div>
      </div>
      
      {/* Conteneur scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-96 overflow-y-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50 sticky top-0 z-10">
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
              {filteredShortcodes.map((shortcode, index) => (
                <tr 
                  key={shortcode.id} 
                  className={`hover:bg-gray-50 transition-colors duration-150 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}
                >
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
      </div>

      {/* Pied de tableau avec résumé */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
        <div className="text-xs text-gray-500 text-center">
          {searchQuery ? (
            `${filteredShortcodes.length} résultat${filteredShortcodes.length > 1 ? 's' : ''} affiché${filteredShortcodes.length > 1 ? 's' : ''}`
          ) : (
            `${shortcodes.length} shortcode${shortcodes.length > 1 ? 's' : ''} au total`
          )}
        </div>
      </div>

      {/* Modal de détails */}
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