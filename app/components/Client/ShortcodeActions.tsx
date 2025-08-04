/**
 * app/components/Client/ShortcodeActions.tsx
 * 
 * Version restructurée avec interface plus intuitive et bouton "Voir tous les shortcodes".
 * Simplifie l'interface en regroupant les actions principales et améliore l'UX.
 */
'use client';

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  PlusIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Shortcode } from '../../lib/shortcodeService';

interface ShortcodeActionsProps {
  hasPermission: boolean;
  isCustomList: boolean;
  allShortcodes: Shortcode[];
  currentShortcodes: Shortcode[];
  onCreateShortcode: (shortcodeData: {
    SH_Code: string;
    SH_Default_UTM: string;
    SH_Display_Name_FR: string;
    SH_Display_Name_EN: string;
  }) => Promise<void>;
  onAddShortcode: (shortcodeId: string) => Promise<void>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAllShortcodesModal?: () => void; // Nouvelle prop pour ouvrir le modal global
}

/**
 * Le composant `ShortcodeActions` affiche une interface restructurée pour la gestion des shortcodes.
 * Inclut un bouton pour voir tous les shortcodes dans un modal dédié.
 */
const ShortcodeActions: React.FC<ShortcodeActionsProps> = ({
  hasPermission,
  isCustomList,
  allShortcodes,
  currentShortcodes,
  onCreateShortcode,
  onAddShortcode,
  searchQuery,
  onSearchChange,
  onOpenAllShortcodesModal
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [newShortcode, setNewShortcode] = useState({
    SH_Code: '',
    SH_Default_UTM: '',
    SH_Display_Name_FR: '',
    SH_Display_Name_EN: '',
  });

  /**
   * Gère la soumission du formulaire de création de shortcode.
   */
  const handleCreateSubmit = async () => {
    try {
      await onCreateShortcode(newShortcode);
      setNewShortcode({
        SH_Code: '',
        SH_Default_UTM: '',
        SH_Display_Name_FR: '',
        SH_Display_Name_EN: '',
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la création du shortcode:", error);
    }
  };

  return (
    <>
      {/* Interface compacte des actions */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          
          {/* Section gauche : Actions avec icônes */}
          <div className="flex items-center space-x-3">
            
        {/* Bouton Voir tous les shortcodes */}
        <button
              onClick={onOpenAllShortcodesModal}
              className="inline-flex items-center px-3 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
              title="Parcourir tous les shortcodes disponibles"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Voir tous les shortcodes
            </button>

            {/* Bouton Créer un shortcode */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors duration-150 ${
                hasPermission 
                  ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                  : 'text-gray-400 bg-gray-300 cursor-not-allowed'
              }`}
              disabled={!hasPermission}
              title={!hasPermission ? "Vous n'avez pas la permission de créer des shortcodes" : "Créer un nouveau shortcode"}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouveau shortcode
            </button>
          </div>
          
          {/* Section droite : Recherche compacte */}
          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Rechercher dans cette liste..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de création de shortcode - simplifié */}
      <Transition show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={() => setIsCreateModalOpen(false)}>
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
              <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
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
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Créer un nouveau shortcode
                  </Dialog.Title>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="SH_Code" className="block text-sm font-medium text-gray-700 mb-1">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="SH_Code"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={newShortcode.SH_Code}
                      onChange={(e) => setNewShortcode({...newShortcode, SH_Code: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="SH_Display_Name_FR" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom d'affichage FR <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="SH_Display_Name_FR"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={newShortcode.SH_Display_Name_FR}
                      onChange={(e) => setNewShortcode({...newShortcode, SH_Display_Name_FR: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="SH_Display_Name_EN" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom d'affichage EN
                    </label>
                    <input
                      type="text"
                      id="SH_Display_Name_EN"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={newShortcode.SH_Display_Name_EN}
                      onChange={(e) => setNewShortcode({...newShortcode, SH_Display_Name_EN: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="SH_Default_UTM" className="block text-sm font-medium text-gray-700 mb-1">
                      UTM par défaut
                    </label>
                    <input
                      type="text"
                      id="SH_Default_UTM"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={newShortcode.SH_Default_UTM}
                      onChange={(e) => setNewShortcode({...newShortcode, SH_Default_UTM: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    onClick={handleCreateSubmit}
                  >
                    Créer et assigner
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default ShortcodeActions;