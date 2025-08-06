/**
 * app/components/Client/ShortcodeActions.tsx
 * Version restructurée avec interface plus intuitive et bouton "Voir tous les shortcodes".
 * Simplifie l'interface en regroupant les actions principales et améliore l'UX.
 * Ajout du champ SH_Type avec menu déroulant dans le modal de création.
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
import { useTranslation } from '../../contexts/LanguageContext';

interface ShortcodeActionsProps {
  hasPermission: boolean;
  isCustomList: boolean;
  allShortcodes: Shortcode[];
  currentShortcodes: Shortcode[];
  onCreateShortcode: (shortcodeData: {
    SH_Code: string;
    SH_Default_UTM: string;
    SH_Display_Name_EN: string;
    SH_Display_Name_FR: string;
    SH_Type: string;
  }) => Promise<void>;
  onAddShortcode: (shortcodeId: string) => Promise<void>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAllShortcodesModal?: () => void;
}

// Options pour le menu déroulant SH_Type
const SH_TYPE_OPTIONS = [
  'Print Publisher',
  'TV Station',
  'Digital Publisher',
  'Radio Station',
  'OOH Publisher',
  'Social Publisher',
  'Programmatic Publisher',
  'Search Publisher'
];

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
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [newShortcode, setNewShortcode] = useState({
    SH_Code: '',
    SH_Default_UTM: '',
    SH_Display_Name_EN: '',
    SH_Display_Name_FR: '',
    SH_Type: '',
  });

  // États pour traquer les modifications manuelles
  const [isENManuallyEdited, setIsENManuallyEdited] = useState(false);
  const [isUTMManuallyEdited, setIsUTMManuallyEdited] = useState(false);

  /**
   * Transforme un texte en format UTM (sans caractères spéciaux, espaces → tirets, accents normalisés)
   */
  const transformToUTM = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/é/g, 'e')
      .replace(/è/g, 'e')
      .replace(/ê/g, 'e')
      .replace(/ë/g, 'e')
      .replace(/à/g, 'a')
      .replace(/â/g, 'a')
      .replace(/ä/g, 'a')
      .replace(/ç/g, 'c')
      .replace(/ô/g, 'o')
      .replace(/ö/g, 'o')
      .replace(/ù/g, 'u')
      .replace(/û/g, 'u')
      .replace(/ü/g, 'u')
      .replace(/î/g, 'i')
      .replace(/ï/g, 'i')
      .replace(/[^a-z0-9\s-]/g, '') // Supprime tous les caractères spéciaux sauf espaces et tirets
      .replace(/\s+/g, '-') // Remplace les espaces par des tirets
      .replace(/-+/g, '-') // Élimine les tirets multiples
      .replace(/^-|-$/g, ''); // Supprime les tirets en début et fin
  };

  /**
   * Gère le changement du nom français avec auto-remplissage du nom anglais
   */
  const handleDisplayNameFRChange = (value: string) => {
    setNewShortcode(prev => {
      const newEN = isENManuallyEdited ? prev.SH_Display_Name_EN : value;
      const newUTM = isUTMManuallyEdited ? prev.SH_Default_UTM : transformToUTM(newEN);
      
      return {
        ...prev,
        SH_Display_Name_FR: value,
        SH_Display_Name_EN: newEN,
        SH_Default_UTM: newUTM
      };
    });
  };

  /**
   * Gère le changement du nom anglais avec auto-génération de l'UTM
   */
  const handleDisplayNameENChange = (value: string) => {
    setIsENManuallyEdited(true);
    setNewShortcode(prev => ({
      ...prev,
      SH_Display_Name_EN: value,
      SH_Default_UTM: isUTMManuallyEdited ? prev.SH_Default_UTM : transformToUTM(value)
    }));
  };

  /**
   * Gère le changement manuel de l'UTM
   */
  const handleUTMChange = (value: string) => {
    setIsUTMManuallyEdited(true);
    setNewShortcode(prev => ({
      ...prev,
      SH_Default_UTM: value
    }));
  };

  /**
   * Gère la soumission du formulaire de création de shortcode.
   */
  const handleCreateSubmit = async () => {
    try {
      await onCreateShortcode(newShortcode);
      setNewShortcode({
        SH_Code: '',
        SH_Default_UTM: '',
        SH_Display_Name_EN: '',
        SH_Display_Name_FR: '',
        SH_Type: '',
      });
      // Réinitialiser les états de suivi
      setIsENManuallyEdited(false);
      setIsUTMManuallyEdited(false);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la création du shortcode:", error);
    }
  };

  /**
   * Gère la fermeture du modal en réinitialisant tout
   */
  const handleModalClose = () => {
    setNewShortcode({
      SH_Code: '',
      SH_Default_UTM: '',
      SH_Display_Name_EN: '',
      SH_Display_Name_FR: '',
      SH_Type: '',
    });
    setIsENManuallyEdited(false);
    setIsUTMManuallyEdited(false);
    setIsCreateModalOpen(false);
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
              title={t('shortcodeActions.browse.title')}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              {t('shortcodeActions.browse.button')}
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
              title={!hasPermission ? t('shortcodeActions.create.noPermission') : t('shortcodeActions.create.title')}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('shortcodeActions.create.button')}
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
                placeholder={t('shortcodeActions.search.placeholder')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de création de shortcode - avec champ SH_Type */}
      <Transition show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={handleModalClose}>
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
                    {t('shortcodeActions.createModal.title')}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={handleModalClose}
                  >
                    <span className="sr-only">{t('common.close')}</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="SH_Code" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('shortcodeActions.createModal.form.codeLabel')} <span className="text-red-500">*</span>
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
                    <label htmlFor="SH_Type" className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      id="SH_Type"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={newShortcode.SH_Type}
                      onChange={(e) => setNewShortcode({...newShortcode, SH_Type: e.target.value})}
                    >
                      <option value="">Sélectionnez un type</option>
                      {SH_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="SH_Display_Name_FR" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('shortcodeActions.createModal.form.nameFRLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="SH_Display_Name_FR"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={newShortcode.SH_Display_Name_FR}
                      onChange={(e) => handleDisplayNameFRChange(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="SH_Display_Name_EN" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('shortcodeActions.createModal.form.nameENLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="SH_Display_Name_EN"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={newShortcode.SH_Display_Name_EN}
                      onChange={(e) => handleDisplayNameENChange(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="SH_Default_UTM" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('shortcodeActions.createModal.form.defaultUTMLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="SH_Default_UTM"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={newShortcode.SH_Default_UTM}
                      onChange={(e) => handleUTMChange(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    onClick={handleModalClose}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    onClick={handleCreateSubmit}
                  >
                    {t('shortcodeActions.createModal.submitButton')}
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