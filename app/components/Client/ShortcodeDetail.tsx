// app/components/Client/ShortcodeDetail.tsx

'use client';

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Shortcode, updateShortcode as updateShortcodeService, deleteShortcode as deleteShortcodeService } from '../../lib/shortcodeService';

interface ShortcodeDetailProps {
  shortcode: Shortcode;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

const ShortcodeDetail: React.FC<ShortcodeDetailProps> = ({
  shortcode,
  isOpen,
  onClose,
  onDelete,
  onUpdate
}) => {
  const [editedShortcode, setEditedShortcode] = useState<Shortcode>({...shortcode});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedShortcode(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!editedShortcode.SH_Code || !editedShortcode.SH_Display_Name_FR) {
      setError('Le code et le nom d\'affichage FR sont obligatoires.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await updateShortcodeService(shortcode.id, {
        SH_Code: editedShortcode.SH_Code,
        SH_Display_Name_FR: editedShortcode.SH_Display_Name_FR,
        SH_Display_Name_EN: editedShortcode.SH_Display_Name_EN,
        SH_Default_UTM: editedShortcode.SH_Default_UTM,
        SH_Type: editedShortcode.SH_Type,
        SH_Tags: editedShortcode.SH_Tags,
      });
      
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du shortcode:', err);
      setError('Impossible de mettre à jour le shortcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      await deleteShortcodeService(shortcode.id);
      
      setIsDeleteModalOpen(false);
      onDelete();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la suppression du shortcode:', err);
      setError('Impossible de supprimer le shortcode.');
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
                    Détails du shortcode
                  </Dialog.Title>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
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
                      Code <span className="text-red-500">*</span>
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
                    <label htmlFor="SH_Display_Name_FR" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom d'affichage FR <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="SH_Display_Name_FR"
                      name="SH_Display_Name_FR"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedShortcode.SH_Display_Name_FR}
                      onChange={handleChange}
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
                      name="SH_Display_Name_EN"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedShortcode.SH_Display_Name_EN || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="SH_Default_UTM" className="block text-sm font-medium text-gray-700 mb-1">
                      UTM par défaut
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
                      Type
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
                    Supprimer
                  </button>
                  
                  <div>
                    <button
                      type="button"
                      className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={onClose}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      
      {/* Modal de confirmation de suppression */}
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
                  Confirmer la suppression
                </Dialog.Title>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Êtes-vous sûr de vouloir supprimer le shortcode <strong>{shortcode.SH_Code}</strong> ? Cette action est irréversible et supprimera également ce shortcode de toutes les listes.
                  </p>
                </div>
                
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? 'Suppression...' : 'Supprimer'}
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