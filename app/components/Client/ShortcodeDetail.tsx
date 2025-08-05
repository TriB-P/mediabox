/**
 * Ce fichier définit le composant React `ShortcodeDetail`.
 * Il s'agit d'une boîte de dialogue modale qui permet à l'utilisateur de visualiser,
 * modifier et supprimer les détails d'un "shortcode" existant.
 * Le composant gère son propre état pour les champs du formulaire, le chargement,
 * et les erreurs. Il communique avec un service externe (`shortcodeService`)
 * pour persister les modifications (mise à jour ou suppression) dans la base de données Firebase.
 */
'use client';

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Shortcode, updateShortcode as updateShortcodeService, deleteShortcode as deleteShortcodeService } from '../../lib/shortcodeService';
import { useTranslation } from '../../contexts/LanguageContext';

interface ShortcodeDetailProps {
  shortcode: Shortcode;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

/**
 * Affiche une modale avec un formulaire pour éditer ou supprimer un shortcode.
 * @param {Shortcode} shortcode - L'objet shortcode à afficher et modifier.
 * @param {boolean} isOpen - Contrôle la visibilité de la modale.
 * @param {() => void} onClose - Callback pour fermer la modale.
 * @param {() => void} onDelete - Callback exécuté après une suppression réussie.
 * @param {() => void} onUpdate - Callback exécuté après une mise à jour réussie.
 * @returns {React.ReactElement} Le composant de la modale de détails du shortcode.
 */
const ShortcodeDetail: React.FC<ShortcodeDetailProps> = ({
  shortcode,
  isOpen,
  onClose,
  onDelete,
  onUpdate
}) => {
  const { t } = useTranslation();
  const [editedShortcode, setEditedShortcode] = useState<Shortcode>({...shortcode});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /**
   * Gère les changements dans les champs du formulaire et met à jour l'état local du shortcode.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - L'événement de changement du champ.
   * @returns {void}
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedShortcode(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Soumet les modifications du shortcode au service de mise à jour.
   * Valide les champs obligatoires, gère les états de chargement et d'erreur.
   * @returns {Promise<void>}
   */
  const handleSubmit = async () => {
    if (!editedShortcode.SH_Code || !editedShortcode.SH_Display_Name_EN) {
      setError(t('shortcodeDetail.errors.requiredFields'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`FIREBASE: ÉCRITURE - Fichier: ShortcodeDetail.tsx - Fonction: handleSubmit - Path: shortcodes/${shortcode.id}`);
      await updateShortcodeService(shortcode.id, {
        SH_Code: editedShortcode.SH_Code,
        SH_Display_Name_EN: editedShortcode.SH_Display_Name_EN,
        SH_Display_Name_FR: editedShortcode.SH_Display_Name_FR,
        SH_Default_UTM: editedShortcode.SH_Default_UTM,
        SH_Type: editedShortcode.SH_Type,
        SH_Tags: editedShortcode.SH_Tags,
      });
      
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du shortcode:', err);
      setError(t('shortcodeDetail.errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère la suppression du shortcode après confirmation.
   * Appelle le service de suppression et gère les états de chargement et d'erreur.
   * @returns {Promise<void>}
   */
  const handleDelete = async () => {
    try {
      setLoading(true);
      
      console.log(`FIREBASE: ÉCRITURE - Fichier: ShortcodeDetail.tsx - Fonction: handleDelete - Path: shortcodes/${shortcode.id}`);
      await deleteShortcodeService(shortcode.id);
      
      setIsDeleteModalOpen(false);
      onDelete();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la suppression du shortcode:', err);
      setError(t('shortcodeDetail.errors.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={onClose}>
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

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>
            
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
                    {t('shortcodeDetail.modal.title')}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">{t('common.close')}</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="SH_Code" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('shortcodeDetail.form.codeLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="SH_Code"
                      name="SH_Code"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedShortcode.SH_Code}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="SH_Display_Name_EN" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('shortcodeDetail.form.displayNameFrLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="SH_Display_Name_EN"
                      name="SH_Display_Name_EN"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedShortcode.SH_Display_Name_EN}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="SH_Display_Name_FR" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('shortcodeDetail.form.displayNameEnLabel')}
                    </label>
                    <input
                      type="text"
                      id="SH_Display_Name_FR"
                      name="SH_Display_Name_FR"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedShortcode.SH_Display_Name_FR || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="SH_Default_UTM" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('shortcodeDetail.form.defaultUtmLabel')}
                    </label>
                    <input
                      type="text"
                      id="SH_Default_UTM"
                      name="SH_Default_UTM"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedShortcode.SH_Default_UTM || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="SH_Type" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('shortcodeDetail.form.typeLabel')}
                    </label>
                    <input
                      type="text"
                      id="SH_Type"
                      name="SH_Type"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedShortcode.SH_Type || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    {t('common.delete')}
                  </button>
                  
                  <div>
                    <button
                      type="button"
                      className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={onClose}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? t('shortcodeDetail.buttons.saving') : t('common.save')}
                    </button>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      
      <Transition show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-20 overflow-y-auto" onClose={() => setIsDeleteModalOpen(false)}>
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

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>
            
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
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  {t('shortcodeDetail.deleteModal.title')}
                </Dialog.Title>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {t('shortcodeDetail.deleteModal.areYouSure')} <strong>{shortcode.SH_Code}</strong>{t('shortcodeDetail.deleteModal.irreversible')}
                  </p>
                </div>
                
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? t('shortcodeDetail.buttons.deleting') : t('common.delete')}
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

export default ShortcodeDetail;