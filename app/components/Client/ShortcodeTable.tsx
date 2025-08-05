/**
 * app/components/Client/ShortcodeTable.tsx
 * * Version améliorée du tableau de shortcodes avec design moderne,
 * meilleure expérience utilisateur et intégration harmonieuse.
 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Shortcode } from '../../lib/shortcodeService';
import ShortcodeDetail from './ShortcodeDetail';
import { useTranslation } from '../../contexts/LanguageContext';

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
 * Affiche un tableau moderne et intuitif des shortcodes avec fonctionnalités améliorées.
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
  const { t } = useTranslation();
  const canEditShortcode = userRole === 'admin';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedShortcode, setSelectedShortcode] = useState<Shortcode | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const filteredShortcodes = useMemo(() => {
    if (!searchQuery) return shortcodes;
    
    const searchLower = searchQuery.toLowerCase();
    return shortcodes.filter(shortcode => 
      shortcode.SH_Code.toLowerCase().includes(searchLower) ||
      shortcode.SH_Display_Name_EN.toLowerCase().includes(searchLower) ||
      (shortcode.SH_Display_Name_FR?.toLowerCase().includes(searchLower)) ||
      (shortcode.SH_Default_UTM?.toLowerCase().includes(searchLower)) ||
      (shortcode.SH_Type?.toLowerCase().includes(searchLower))
    );
  }, [shortcodes, searchQuery]);

  /**
   * Copie l'ID d'un shortcode dans le presse-papiers avec feedback visuel.
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
   * Gère la suppression d'un shortcode avec confirmation et feedback visuel.
   */
  const handleRemove = async (shortcodeId: string, shortcodeName: string) => {
    const confirmMessage = isCustomList 
      ? t('shortcodeTable.remove.confirmCustom').replace('{name}', shortcodeName)
      : t('shortcodeTable.remove.confirmPlusco').replace('{name}', shortcodeName);
    
    if (window.confirm(confirmMessage)) {
      setRemovingId(shortcodeId);
      try {
        await onRemoveShortcode(shortcodeId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      } finally {
        setRemovingId(null);
      }
    }
  };

  /**
   * Ouvre le modal de détail pour un shortcode.
   */
  const openDetailModal = (shortcode: Shortcode) => {
    setSelectedShortcode(shortcode);
    setIsDetailModalOpen(true);
  };

  /**
   * Ferme le modal de détail.
   */
  const closeDetailModal = () => {
    setSelectedShortcode(null);
    setIsDetailModalOpen(false);
  };

  // État de chargement
  if (loading) {
    return (
      <div className="bg-white">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Aucun shortcode dans la liste
  if (shortcodes.length === 0) {
    return (
      <div className="bg-white">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700">{t('shortcodeTable.header.listTitle')}</h3>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('shortcodeTable.empty.title')}</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {t('shortcodeTable.empty.description')}
          </p>
        </div>
      </div>
    );
  }

  // Aucun résultat de recherche
  if (searchQuery && filteredShortcodes.length === 0) {
    return (
      <div className="bg-white">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">{t('shortcodeTable.header.searchResults')}</h3>
            <div className="flex items-center text-sm text-gray-500">
              <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
              <span>"{searchQuery}"</span>
            </div>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('shortcodeTable.search.noResults')}</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {t('shortcodeTable.search.noMatchPart1')}<strong>{searchQuery}</strong>{t('shortcodeTable.search.noMatchPart2')}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {shortcodes.length} {shortcodes.length > 1 ? t('shortcodeTable.label.shortcodes') : t('shortcodeTable.label.shortcode')} {t('shortcodeTable.label.totalInList')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col">

      
      {/* Conteneur du tableau scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>{t('shortcodeTable.header.code')}</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('shortcodeTable.header.nameFR')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('shortcodeTable.header.nameEN')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('shortcodeTable.header.defaultUTM')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('shortcodeTable.header.type')}
                </th>
                <th scope="col" className="px-4 py-3 w-32">
                  <span className="sr-only">{t('shortcodeTable.header.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredShortcodes.map((shortcode, index) => {
                const isRemoving = removingId === shortcode.id;
                const isCopied = copiedId === shortcode.id;
                
                return (
                  <tr 
                    key={shortcode.id} 
                    className={`transition-all duration-150 ${
                      isRemoving 
                        ? 'bg-red-50 opacity-50' 
                        : 'hover:bg-gray-50'
                    } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  >
                    {/* Code */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 break-words">
                          {shortcode.SH_Code}
                        </span>
                      </div>
                    </td>

                    {/* Nom FR */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 break-words max-w-xs">
                        {shortcode.SH_Display_Name_EN}
                      </div>
                    </td>

                    {/* Nom EN */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600 break-words max-w-xs">
                        {shortcode.SH_Display_Name_FR || (
                          <span className="text-gray-400 italic">{t('shortcodeTable.cell.notDefined')}</span>
                        )}
                      </div>
                    </td>

                    {/* UTM */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 break-words max-w-sm font-mono">
                        {shortcode.SH_Default_UTM || (
                          <span className="text-gray-400 italic font-sans">{t('shortcodeTable.cell.notDefined')}</span>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 whitespace-nowrap">

                      {shortcode.SH_Type ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {shortcode.SH_Type}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">{t('shortcodeTable.cell.notDefined')}</span>
                      )}

                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center space-x-1">
                        
                        {/* Bouton copier ID */}
                        <button
                          onClick={() => handleCopyId(shortcode.id)}
                          className={`p-2 rounded-md transition-all duration-150 ${
                            isCopied 
                              ? 'text-green-600 bg-green-50' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title={isCopied ? t('shortcodeTable.tooltip.idCopied') : t('shortcodeTable.tooltip.copyId')}
                          disabled={isRemoving}
                        >
                          {isCopied ? (
                            <ClipboardDocumentCheckIcon className="h-4 w-4" />
                          ) : (
                            <ClipboardIcon className="h-4 w-4" />
                          )}
                        </button>
                        
                        {/* Bouton modifier */}
                        {canEditShortcode && (
                          <button
                            onClick={() => openDetailModal(shortcode)}
                            className="p-2 rounded-md text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all duration-150"
                            title={t('shortcodeTable.tooltip.editShortcode')}
                            disabled={isRemoving}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* Bouton supprimer */}
                        <button
                          onClick={() => handleRemove(shortcode.id, shortcode.SH_Display_Name_EN)}
                          className={`p-2 rounded-md transition-all duration-150 ${
                            hasPermission && !isRemoving
                              ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!hasPermission || isRemoving}
                          title={
                            isRemoving 
                              ? t('shortcodeTable.tooltip.removing')
                              : !hasPermission 
                                ? t('shortcodeTable.tooltip.permissionRequired')
                                : isCustomList 
                                  ? t('shortcodeTable.tooltip.removeFromCustom') 
                                  : t('shortcodeTable.tooltip.removeFromPlusco')
                          }
                        >
                          {isRemoving ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pied du tableau avec résumé et avertissements */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {searchQuery ? (
              `${filteredShortcodes.length} ${filteredShortcodes.length > 1 ? t('shortcodeTable.footer.resultsDisplayedPlural') : t('shortcodeTable.footer.resultsDisplayedSingular')}`
            ) : (
              `${shortcodes.length} ${shortcodes.length > 1 ? t('shortcodeTable.footer.totalPlural') : t('shortcodeTable.footer.totalSingular')}`
            )}
          </div>
          
          {!isCustomList && (
            <div className="flex items-center text-xs text-amber-600">
              <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
              <span>{t('shortcodeTable.footer.pluscoWarning')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails */}
      {selectedShortcode && (
        <ShortcodeDetail
          shortcode={selectedShortcode}
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          onDelete={onUpdateShortcode}
          onUpdate={onUpdateShortcode}
        />
      )}
    </div>
  );
};

export default ShortcodeTable;