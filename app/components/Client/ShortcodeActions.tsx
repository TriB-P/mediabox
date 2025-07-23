/**
 * Ce fichier définit le composant `ShortcodeActions`, une interface utilisateur côté client
 * pour gérer les shortcodes associés à une dimension spécifique.
 * Il fournit des boutons pour créer un nouveau shortcode ou en assigner un existant,
 * ainsi qu'une barre de recherche pour filtrer la liste affichée.
 * Les actions de création et d'assignation sont gérées via des modals interactives.
 * Ce composant est dépendant de fonctions passées en props pour exécuter les opérations
 * de base de données (création, assignation).
 */
'use client';

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  PlusIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon 
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
}

/**
 * Le composant `ShortcodeActions` affiche les boutons d'action et les modals
 * pour la gestion des shortcodes.
 * @param {object} props - Les propriétés du composant.
 * @param {boolean} props.hasPermission - Indique si l'utilisateur a la permission d'éditer (active/désactive les boutons).
 * @param {boolean} props.isCustomList - Indique si la liste de shortcodes est personnalisée pour le client ou la liste par défaut (PlusCo).
 * @param {Shortcode[]} props.allShortcodes - La liste de tous les shortcodes existants dans le système.
 * @param {Shortcode[]} props.currentShortcodes - La liste des shortcodes actuellement assignés à la dimension.
 * @param {(shortcodeData: object) => Promise<void>} props.onCreateShortcode - Fonction asynchrone pour créer un nouveau shortcode.
 * @param {(shortcodeId: string) => Promise<void>} props.onAddShortcode - Fonction asynchrone pour assigner un shortcode existant.
 * @param {string} props.searchQuery - La valeur actuelle de la barre de recherche de la liste principale.
 * @param {(query: string) => void} props.onSearchChange - Fonction pour mettre à jour la recherche de la liste principale.
 * @returns {React.ReactElement} Le JSX pour la barre d'actions et les modals.
 */
const ShortcodeActions: React.FC<ShortcodeActionsProps> = ({
  hasPermission,
  isCustomList,
  allShortcodes,
  currentShortcodes,
  onCreateShortcode,
  onAddShortcode,
  searchQuery,
  onSearchChange
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shortcodeSearchQuery, setShortcodeSearchQuery] = useState('');
  
  const [newShortcode, setNewShortcode] = useState({
    SH_Code: '',
    SH_Default_UTM: '',
    SH_Display_Name_FR: '',
    SH_Display_Name_EN: '',
  });

  /**
   * Filtre la liste complète des shortcodes pour n'afficher que ceux qui peuvent être ajoutés.
   * Un shortcode est exclu s'il est déjà dans la liste actuelle ou s'il ne correspond pas
   * à la requête de recherche dans le modal d'ajout.
   */
  const filteredShortcodes = allShortcodes.filter(shortcode => {
    const isAlreadyInList = currentShortcodes.some(s => s.id === shortcode.id);
    if (isAlreadyInList) return false;
    
    if (!shortcodeSearchQuery) return true;
    
    const searchLower = shortcodeSearchQuery.toLowerCase();
    return (
      shortcode.SH_Code.toLowerCase().includes(searchLower) ||
      shortcode.SH_Display_Name_FR.toLowerCase().includes(searchLower) ||
      (shortcode.SH_Display_Name_EN && shortcode.SH_Display_Name_EN.toLowerCase().includes(searchLower))
    );
  });

  /**
   * Gère la soumission du formulaire de création de shortcode.
   * Appelle la fonction `onCreateShortcode` passée en prop, puis réinitialise
   * le formulaire et ferme le modal de création.
   */
  const handleCreateSubmit = async () => {
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: ShortcodeActions.tsx - Fonction: handleCreateSubmit - Path: shortcodes");
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

  /**
   * Gère l'ajout d'un shortcode existant à la liste actuelle.
   * Appelle la fonction `onAddShortcode` passée en prop avec l'ID du shortcode
   * sélectionné, puis ferme le modal et réinitialise la recherche du modal.
   * @param {string} shortcodeId - L'ID du shortcode à ajouter.
   */
  const handleAddSubmit = async (shortcodeId: string) => {
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: ShortcodeActions.tsx - Fonction: handleAddSubmit - Path: [Path determined in parent component]");
      await onAddShortcode(shortcodeId);
      setIsAddModalOpen(false);
      setShortcodeSearchQuery('');
    } catch (error) {
      console.error("Erreur lors de l'ajout du shortcode:", error);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex space-x-2 mb-4 sm:mb-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors duration-150 ${
              hasPermission 
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                : 'text-gray-400 bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!hasPermission}
            title={!hasPermission ? "Vous n'avez pas la permission de créer des shortcodes" : "Créer un nouveau shortcode"}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Créer un shortcode
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors duration-150 ${
              hasPermission 
                ? 'text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500' 
                : 'text-gray-400 bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!hasPermission}
            title={!hasPermission ? "Vous n'avez pas la permission d'assigner des shortcodes" : "Assigner un shortcode existant"}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Assigner un shortcode
          </button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Rechercher dans la liste..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <Transition show={isAddModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={() => setIsAddModalOpen(false)}>
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
                <div className="flex justify-between items-start">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {isCustomList 
                        ? "Assigner un shortcode à la liste"
                        : "Ajouter un shortcode à la liste PlusCo"
                      }
                    </Dialog.Title>
                    
                    {!isCustomList && (
                      <div className="mt-2 p-3 bg-amber-50 border-l-4 border-amber-400 text-amber-700 text-sm">
                        Attention: Vous êtes en train de modifier la liste commune (PlusCo). 
                        Les modifications affecteront tous les clients qui n'ont pas de liste personnalisée pour cette dimension.
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="mb-4">
                    <label htmlFor="shortcode-search" className="block text-sm font-medium text-gray-700 mb-1">
                      Rechercher un shortcode
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="text"
                        id="shortcode-search"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Rechercher par code ou nom"
                        value={shortcodeSearchQuery}
                        onChange={(e) => setShortcodeSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto mt-4">
                    {filteredShortcodes.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Aucun shortcode disponible</p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {filteredShortcodes.map((shortcode) => (
                          <li key={shortcode.id} className="py-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{shortcode.SH_Code}</p>
                                <p className="text-sm text-gray-500">{shortcode.SH_Display_Name_FR}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddSubmit(shortcode.id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Ajouter
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

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
                <div className="flex justify-between items-center">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Créer un nouveau shortcode
                  </Dialog.Title>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="SH_Code" className="block text-sm font-medium text-gray-700 mb-1">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="SH_Code"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newShortcode.SH_Default_UTM}
                      onChange={(e) => setNewShortcode({...newShortcode, SH_Default_UTM: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={handleCreateSubmit}
                  >
                    Créer
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