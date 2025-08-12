/**
 * Ce fichier gère le pied de page de l'application des tactiques.
 * Il permet de naviguer entre les différents onglets de tactiques, d'en ajouter de nouveaux,
 * de renommer les onglets existants et de les supprimer.
 * Il inclut également des boutons pour changer le mode d'affichage des tactiques (hiérarchie, tableau, timeline).
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ListBulletIcon, 
  TableCellsIcon, 
  ViewColumnsIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { Onglet } from '../../types/tactiques';
import { useTranslation } from '../../contexts/LanguageContext';

interface TactiquesFooterProps {
  viewMode: 'hierarchy' | 'table' | 'timeline';
  setViewMode: (mode: 'hierarchy' | 'table' | 'timeline') => void;
  onglets: Onglet[];
  selectedOnglet: Onglet | null;
  onSelectOnglet: (onglet: Onglet) => void;
  onAddOnglet: () => Promise<void>;
  onRenameOnglet: (ongletId: string, newName: string) => Promise<void>;
  onDeleteOnglet: (ongletId: string) => Promise<void>;
}

/**
 * Composant de pied de page pour la gestion des onglets et des modes de vue des tactiques.
 * @param {TactiquesFooterProps} props - Les propriétés du composant.
 * @param {'hierarchy' | 'table' | 'timeline'} props.viewMode - Le mode d'affichage actuel.
 * @param {(mode: 'hierarchy' | 'table' | 'timeline') => void} props.setViewMode - Fonction pour définir le mode d'affichage.
 * @param {Onglet[]} props.onglets - La liste de tous les onglets disponibles.
 * @param {Onglet | null} props.selectedOnglet - L'onglet actuellement sélectionné.
 * @param {(onglet: Onglet) => void} props.onSelectOnglet - Fonction pour sélectionner un onglet.
 * @param {() => Promise<void>} props.onAddOnglet - Fonction pour ajouter un nouvel onglet.
 * @param {(ongletId: string, newName: string) => Promise<void>} props.onRenameOnglet - Fonction pour renommer un onglet.
 * @param {(ongletId: string) => Promise<void>} props.onDeleteOnglet - Fonction pour supprimer un onglet.
 * @returns {JSX.Element} Le composant de pied de page des tactiques.
 */
export default function TactiquesFooter({
  viewMode,
  setViewMode,
  onglets,
  selectedOnglet,
  onSelectOnglet,
  onAddOnglet,
  onRenameOnglet,
  onDeleteOnglet
}: TactiquesFooterProps) {
  const { t } = useTranslation();
  const [editingOnglet, setEditingOnglet] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showMenuForOnglet, setShowMenuForOnglet] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  /**
   * Effet de bord pour fermer le menu contextuel de l'onglet si un clic est détecté en dehors de celui-ci.
   * Ne prend pas de paramètres.
   * Ne retourne rien.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenuForOnglet && !(event.target as HTMLElement).closest('.onglet-menu')) {
        setShowMenuForOnglet(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenuForOnglet]);
  
  /**
   * Effet de bord pour mettre le focus sur l'input de renommage lorsqu'un onglet est en mode édition.
   * Ne prend pas de paramètres.
   * Ne retourne rien.
   */
  useEffect(() => {
    if (editingOnglet && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingOnglet]);
  
  /**
   * Gère le début de l'édition d'un onglet, en définissant l'ID de l'onglet en édition et son nom actuel.
   * @param {Onglet} onglet - L'objet onglet à éditer.
   * @param {React.MouseEvent} e - L'événement de souris qui a déclenché l'édition.
   * Ne retourne rien.
   */
  const handleStartEdit = (onglet: Onglet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOnglet(onglet.id);
    setEditName(onglet.ONGLET_Name);
  };
  
  /**
   * Gère la sauvegarde du nom modifié de l'onglet.
   * Appelle la fonction onRenameOnglet passée en prop.
   * Ne prend pas de paramètres.
   * Ne retourne rien.
   */
  const handleSaveEdit = async () => {
    if (editingOnglet && editName.trim()) {
      await onRenameOnglet(editingOnglet, editName.trim());
      setEditingOnglet(null);
    }
  };
  
  /**
   * Gère les événements clavier pour l'input de renommage (Enter pour sauvegarder, Escape pour annuler).
   * @param {React.KeyboardEvent} e - L'événement clavier.
   * Ne retourne rien.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingOnglet(null);
    }
  };
  
  /**
   * Bascule l'affichage du menu contextuel pour un onglet donné.
   * @param {React.MouseEvent} e - L'événement de souris qui a déclenché le basculement.
   * @param {string} ongletId - L'ID de l'onglet pour lequel basculer le menu.
   * Ne retourne rien.
   */
  const toggleOngletMenu = (e: React.MouseEvent, ongletId: string) => {
    e.stopPropagation();
    setShowMenuForOnglet(showMenuForOnglet === ongletId ? null : ongletId);
  };
  
  /**
   * Gère la suppression d'un onglet après confirmation.
   * Vérifie qu'il reste plus d'un onglet avant de permettre la suppression.
   * @param {string} id - L'ID de l'onglet à supprimer.
   * Ne retourne rien.
   */
  const handleDeleteOnglet = async (id: string) => {
    if (onglets.length > 1) {
      const ongletToDelete = onglets.find(o => o.id === id);
      const ongletName = ongletToDelete ? ongletToDelete.ONGLET_Name : t('tacticsFooter.tabs.fallbackName');
      
      if (confirm(t('tacticsFooter.tabs.deleteConfirmation', { ongletName }))) {
        setShowMenuForOnglet(null);
        console.log("FIREBASE: ÉCRITURE - Fichier: TactiquesFooter.tsx - Fonction: handleDeleteOnglet - Path: onglets/${id}");
        await onDeleteOnglet(id);
      }
    } else {
      alert(t('tacticsFooter.tabs.deleteLastError'));
    }
  };
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md z-10">
      <div className="max-w-screen-xl mx-auto px-4 w-full">
        <div className="flex items-center py-1 md:pr-0">
          <div className="flex-1 flex items-center overflow-x-auto">
            {onglets.map((onglet) => (
              <div 
                key={onglet.id}
                className={`flex items-center px-4 py-2 border-r border-gray-200 cursor-pointer whitespace-nowrap relative group ${
                  selectedOnglet?.id === onglet.id 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div 
                  className="flex items-center"
                  onClick={() => onSelectOnglet(onglet)}
                  onDoubleClick={(e) => handleStartEdit(onglet, e)}
                >
                  {editingOnglet === onglet.id ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      className="bg-white border border-gray-300 px-1 py-0 text-sm rounded w-32"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm font-medium">{onglet.ONGLET_Name}</span>
                  )}
                </div>
                
                {onglets.length > 1 && (
                  <button 
                    className="ml-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded-full focus:outline-none transition-opacity duration-200"
                    onClick={() => handleDeleteOnglet(onglet.id)}
                    title={t('tacticsFooter.tabs.deleteTitle')}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
                
                <button 
                  className="ml-1 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 rounded-full focus:outline-none transition-opacity duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(onglet, e);
                  }}
                  title={t('tacticsFooter.tabs.renameTitle')}
                >
                  <PencilIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            <button 
              onClick={onAddOnglet}
              className="px-3 py-2 text-gray-600 hover:bg-gray-200 focus:outline-none"
              title={t('tacticsFooter.tabs.addTitle')}
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`p-2 rounded-full ${
                viewMode === 'hierarchy' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title={t('tacticsFooter.viewMode.hierarchy')}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-full ${
                viewMode === 'table' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title={t('tacticsFooter.viewMode.table')}
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-full ${
                viewMode === 'timeline' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title={t('tacticsFooter.viewMode.timeline')}
            >
              <ViewColumnsIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
      

}