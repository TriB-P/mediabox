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
  const [editingOnglet, setEditingOnglet] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showMenuForOnglet, setShowMenuForOnglet] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Fermer le menu lors d'un clic en dehors
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
  
  // Focus sur l'input lors de l'édition
  useEffect(() => {
    if (editingOnglet && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingOnglet]);
  
  const handleStartEdit = (onglet: Onglet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOnglet(onglet.id);
    setEditName(onglet.ONGLET_Name);
  };
  
  const handleSaveEdit = async () => {
    if (editingOnglet && editName.trim()) {
      await onRenameOnglet(editingOnglet, editName.trim());
      setEditingOnglet(null);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingOnglet(null);
    }
  };
  
  const toggleOngletMenu = (e: React.MouseEvent, ongletId: string) => {
    e.stopPropagation();
    setShowMenuForOnglet(showMenuForOnglet === ongletId ? null : ongletId);
  };
  
  const handleDeleteOnglet = async (id: string) => {
    // Vérifier qu'il y a plus d'un onglet avant de supprimer
    if (onglets.length > 1) {
      // Trouver le nom de l'onglet pour un message plus informatif
      const ongletToDelete = onglets.find(o => o.id === id);
      const ongletName = ongletToDelete ? ongletToDelete.ONGLET_Name : 'cet onglet';
      
      // Demander confirmation avant de supprimer
      if (confirm(`Êtes-vous sûr de vouloir supprimer l'onglet "${ongletName}" ? Cette action supprimera également toutes les sections et tactiques associées.`)) {
        setShowMenuForOnglet(null);
        await onDeleteOnglet(id);
      }
    } else {
      alert('Impossible de supprimer le dernier onglet');
    }
  };
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md z-10">
      <div className="max-w-screen-xl mx-auto px-4 w-full">
        {/* Conteneur principal, adapté avec la même largeur que la zone principale */}
        <div className="flex items-center py-1 md:pr-0">
          {/* Zone des onglets style Excel */}
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
                {/* Contenu de l'onglet */}
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
                
                {/* Bouton fermer/supprimer (apparaît au survol) */}
                {onglets.length > 1 && (
                  <button 
                    className="ml-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded-full focus:outline-none transition-opacity duration-200"
                    onClick={() => handleDeleteOnglet(onglet.id)}
                    title="Supprimer l'onglet"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
                
                {/* Bouton d'édition (apparaît au survol) */}
                <button 
                  className="ml-1 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 rounded-full focus:outline-none transition-opacity duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(onglet, e);
                  }}
                  title="Renommer l'onglet"
                >
                  <PencilIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            {/* Bouton d'ajout d'onglet */}
            <button 
              onClick={onAddOnglet}
              className="px-3 py-2 text-gray-600 hover:bg-gray-200 focus:outline-none"
              title="Ajouter un onglet"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Zone des boutons de vue - complètement à droite */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`p-2 rounded-full ${
                viewMode === 'hierarchy' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Vue hiérarchique"
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-full ${
                viewMode === 'table' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Vue tableau"
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-full ${
                viewMode === 'timeline' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Vue timeline"
            >
              <ViewColumnsIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
      

}