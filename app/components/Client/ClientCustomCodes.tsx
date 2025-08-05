/**
 * @file Ce composant React permet de visualiser et de gérer les codes personnalisés (custom codes) pour un client spécifique.
 * Il affiche la liste des codes personnalisés, permet d'en ajouter, de les modifier et de les supprimer.
 * L'accès aux fonctionnalités de modification est contrôlé par le système de permissions.
 * Le composant interagit avec Firebase pour récupérer et manipuler les données des codes.
 */
'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { Dialog, Transition } from '@headlessui/react';
import {
  getAllShortcodes,
  getClientCustomCodes,
  addCustomCode,
  updateCustomCode,
  deleteCustomCode,
  Shortcode,
  CustomCode
} from '../../lib/customCodeService';
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

/**
 * Composant principal pour la gestion des codes personnalisés d'un client.
 * Il gère l'état local, l'affichage des données, les interactions utilisateur (recherche, ajout, modification, suppression)
 * et l'affichage des modales.
 * @returns {React.ReactElement} Le JSX du composant.
 */
const ClientCustomCodes: React.FC = () => {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [customCodes, setCustomCodes] = useState<CustomCode[]>([]);
  const [allShortcodes, setAllShortcodes] = useState<Shortcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasCustomCodePermission = canPerformAction('CustomCodes');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<CustomCode | null>(null);
  const [selectedShortcode, setSelectedShortcode] = useState<Shortcode | null>(null);
  const [customCodeValue, setCustomCodeValue] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [shortcodeSearchTerm, setShortcodeSearchTerm] = useState('');

  useEffect(() => {
    if (selectedClient) {
      loadData();
    }
  }, [selectedClient]);

  /**
   * Charge les données nécessaires depuis Firebase.
   * Récupère la liste de tous les shortcodes disponibles dans le système ainsi que les codes personnalisés
   * spécifiques au client sélectionné.
   * @async
   * @returns {Promise<void>}
   */
  const loadData = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);
      setError(null);

      console.log("FIREBASE: LECTURE - Fichier: ClientCustomCodes.tsx - Fonction: loadData - Path: shortcodes");
      const shortcodes = await getAllShortcodes();
      setAllShortcodes(shortcodes);

      console.log(`FIREBASE: LECTURE - Fichier: ClientCustomCodes.tsx - Fonction: loadData - Path: clients/${selectedClient.clientId}/customCodes`);
      const codes = await getClientCustomCodes(selectedClient.clientId);
      setCustomCodes(codes);

    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(t('clientCustomCodes.messages.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ouvre la modale pour ajouter un nouveau code personnalisé.
   * Réinitialise les états du formulaire avant d'afficher la modale.
   * Ne fait rien si l'utilisateur n'a pas la permission requise.
   */
  const openAddModal = () => {
    if (!hasCustomCodePermission) return;

    setEditingCode(null);
    setSelectedShortcode(null);
    setCustomCodeValue('');
    setShortcodeSearchTerm('');
    setIsModalOpen(true);
  };

  /**
   * Ouvre la modale pour modifier un code personnalisé existant.
   * Pré-remplit le formulaire avec les informations du code sélectionné.
   * @param {CustomCode} code - L'objet du code personnalisé à modifier.
   */
  const openEditModal = (code: CustomCode) => {
    if (!hasCustomCodePermission) return;

    setEditingCode(code);

    const shortcode = allShortcodes.find(s => s.id === code.shortcodeId);
    setSelectedShortcode(shortcode || null);

    setCustomCodeValue(code.customCode);
    setIsModalOpen(true);
  };

  /**
   * Ferme la modale d'ajout ou de modification et réinitialise les états associés.
   */
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCode(null);
    setSelectedShortcode(null);
    setCustomCodeValue('');
  };

  /**
   * Gère la soumission du formulaire pour l'ajout d'un nouveau code personnalisé.
   * Appelle le service Firebase pour créer le document, puis rafraîchit les données locales.
   * Affiche des messages de succès ou d'erreur.
   * @async
   * @returns {Promise<void>}
   */
  const handleAddCode = async () => {
    if (!selectedClient || !selectedShortcode || !hasCustomCodePermission) return;

    try {
      setError(null);

      console.log(`FIREBASE: ÉCRITURE - Fichier: ClientCustomCodes.tsx - Fonction: handleAddCode - Path: clients/${selectedClient.clientId}/customCodes`);
      await addCustomCode(selectedClient.clientId, {
        shortcodeId: selectedShortcode.id,
        customCode: customCodeValue
      });

      setSuccess(t('clientCustomCodes.messages.successAdd'));
      setTimeout(() => setSuccess(null), 3000);

      await loadData();

      closeModal();
    } catch (err) {
      console.error('Erreur lors de l\'ajout du code personnalisé:', err);
      setError(t('clientCustomCodes.messages.errorAdd'));
    }
  };

  /**
   * Gère la soumission du formulaire pour la mise à jour d'un code personnalisé existant.
   * Appelle le service Firebase pour mettre à jour le document, puis rafraîchit les données locales.
   * Affiche des messages de succès ou d'erreur.
   * @async
   * @returns {Promise<void>}
   */
  const handleUpdateCode = async () => {
    if (!selectedClient || !editingCode || !hasCustomCodePermission) return;

    try {
      setError(null);

      console.log(`FIREBASE: ÉCRITURE - Fichier: ClientCustomCodes.tsx - Fonction: handleUpdateCode - Path: clients/${selectedClient.clientId}/customCodes/${editingCode.id}`);
      await updateCustomCode(
        selectedClient.clientId,
        editingCode.id,
        {
          customCode: customCodeValue
        }
      );

      setSuccess(t('clientCustomCodes.messages.successUpdate'));
      setTimeout(() => setSuccess(null), 3000);

      await loadData();

      closeModal();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du code personnalisé:', err);
      setError(t('clientCustomCodes.messages.errorUpdate'));
    }
  };

  /**
   * Gère la suppression d'un code personnalisé après confirmation de l'utilisateur.
   * Appelle le service Firebase pour supprimer le document, puis rafraîchit les données locales.
   * Affiche des messages de succès ou d'erreur.
   * @async
   * @param {string} codeId - L'ID du code personnalisé à supprimer.
   * @returns {Promise<void>}
   */
  const handleDeleteCode = async (codeId: string) => {
    if (!selectedClient || !hasCustomCodePermission) return;

    if (window.confirm(t('clientCustomCodes.messages.confirmDelete'))) {
      try {
        setError(null);

        console.log(`FIREBASE: ÉCRITURE - Fichier: ClientCustomCodes.tsx - Fonction: handleDeleteCode - Path: clients/${selectedClient.clientId}/customCodes/${codeId}`);
        await deleteCustomCode(selectedClient.clientId, codeId);

        setSuccess(t('clientCustomCodes.messages.successDelete'));
        setTimeout(() => setSuccess(null), 3000);

        await loadData();
      } catch (err) {
        console.error('Erreur lors de la suppression du code personnalisé:', err);
        setError(t('clientCustomCodes.messages.errorDelete'));
      }
    }
  };

  // Filtre les codes personnalisés affichés dans le tableau en fonction du terme de recherche.
  const filteredCustomCodes = customCodes.filter(code => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const shortcode = allShortcodes.find(s => s.id === code.shortcodeId);

    return (
      code.customCode.toLowerCase().includes(searchLower) ||
      code.shortcodeId.toLowerCase().includes(searchLower) ||
      (shortcode?.SH_Code && shortcode.SH_Code.toLowerCase().includes(searchLower)) ||
      (shortcode?.SH_Display_Name_EN && shortcode.SH_Display_Name_EN.toLowerCase().includes(searchLower))
    );
  });

  // Filtre la liste des shortcodes disponibles dans la modale en fonction du terme de recherche.
  const filteredShortcodes = allShortcodes.filter(shortcode => {
    if (!shortcodeSearchTerm) return true;

    const searchLower = shortcodeSearchTerm.toLowerCase();
    return (
      shortcode.SH_Code.toLowerCase().includes(searchLower) ||
      shortcode.SH_Display_Name_EN.toLowerCase().includes(searchLower) ||
      shortcode.id.toLowerCase().includes(searchLower)
    );
  });

  /**
   * Vérifie si un shortcode donné a déjà un code personnalisé assigné pour le client actuel.
   * Utilisé pour désactiver la sélection de shortcodes déjà utilisés dans la modale d'ajout.
   * @param {string} shortcodeId - L'ID du shortcode à vérifier.
   * @returns {boolean} - `true` si un code personnalisé existe, sinon `false`.
   */
  const hasCustomCode = (shortcodeId: string) => {
    return customCodes.some(code => code.shortcodeId === shortcodeId);
  };

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">{t('clientCustomCodes.page.prompt')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">{t('clientCustomCodes.page.title')}</h2>
          <button
            onClick={openAddModal}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
              hasCustomCodePermission
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                : 'text-gray-500 bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!hasCustomCodePermission}
            title={!hasCustomCodePermission ? t('clientCustomCodes.permissions.addTooltip') : ""}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('clientCustomCodes.modal.buttonAdd')}
          </button>
        </div>

        {!hasCustomCodePermission && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700">
            {t('clientCustomCodes.permissions.readOnlyWarning')}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
            {success}
          </div>
        )}

        <div className="mb-6">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={t('clientCustomCodes.page.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-4 text-center text-gray-500">{t('clientCustomCodes.page.loading')}</div>
        ) : filteredCustomCodes.length === 0 ? (
          <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            <p>{customCodes.length === 0
              ? t('clientCustomCodes.page.noCodesForClient')
              : t('clientCustomCodes.page.noSearchResults')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientCustomCodes.table.headerId')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientCustomCodes.table.headerCode')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientCustomCodes.table.headerName')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientCustomCodes.table.headerCustomCode')}
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">{t('clientCustomCodes.table.headerActions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomCodes.map((code) => {
                  const shortcode = allShortcodes.find(s => s.id === code.shortcodeId);
                  return (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {code.shortcodeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shortcode?.SH_Code || t('clientCustomCodes.table.notAvailable')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shortcode?.SH_Display_Name_EN || t('clientCustomCodes.table.notAvailable')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {code.customCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(code)}
                            className={`${
                              hasCustomCodePermission
                                ? 'text-indigo-600 hover:text-indigo-900'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!hasCustomCodePermission}
                            title={!hasCustomCodePermission ? t('clientCustomCodes.permissions.editTooltip') : t('clientCustomCodes.table.editAction')}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCode(code.id)}
                            className={`${
                              hasCustomCodePermission
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!hasCustomCodePermission}
                            title={!hasCustomCodePermission ? t('clientCustomCodes.permissions.deleteTooltip') : t('clientCustomCodes.table.deleteAction')}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={closeModal}>
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
                    {editingCode ? t('clientCustomCodes.modal.titleEdit') : t('clientCustomCodes.modal.titleAdd')}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={closeModal}
                  >
                    <span className="sr-only">{t('clientCustomCodes.modal.close')}</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {!editingCode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('clientCustomCodes.modal.selectShortcode')}
                      </label>

                      <div className="mb-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          </div>
                          <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder={t('clientCustomCodes.modal.searchPlaceholder')}
                            value={shortcodeSearchTerm}
                            onChange={(e) => setShortcodeSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                        {filteredShortcodes.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            {t('clientCustomCodes.modal.noShortcodeFound')}
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-200">
                            {filteredShortcodes.map((shortcode) => {
                              const isDisabled = hasCustomCode(shortcode.id);
                              return (
                                <li
                                  key={shortcode.id}
                                  className={`p-3 hover:bg-gray-50 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  onClick={() => {
                                    if (!isDisabled) {
                                      setSelectedShortcode(shortcode);
                                    }
                                  }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        {shortcode.SH_Code}
                                        {isDisabled && <span className="ml-2 text-xs text-red-500">{t('clientCustomCodes.modal.alreadyCustomized')}</span>}
                                      </p>
                                      <p className="text-xs text-gray-500">{shortcode.SH_Display_Name_EN}</p>
                                      <p className="text-xs font-mono text-gray-400 mt-1">ID: {shortcode.id}</p>
                                    </div>
                                    {selectedShortcode?.id === shortcode.id && (
                                      <div className="h-5 w-5 text-indigo-600 flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {editingCode && selectedShortcode && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-900">{selectedShortcode.SH_Code}</p>
                      <p className="text-xs text-gray-500">{selectedShortcode.SH_Display_Name_EN}</p>
                      <p className="text-xs font-mono text-gray-500 mt-1">ID: {selectedShortcode.id}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('clientCustomCodes.modal.customCodeLabel')}
                    </label>
                    <input
                      type="text"
                      id="customCode"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={customCodeValue}
                      onChange={(e) => setCustomCodeValue(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={closeModal}
                  >
                    {t('clientCustomCodes.modal.cancel')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={editingCode ? handleUpdateCode : handleAddCode}
                    disabled={!customCodeValue || (!editingCode && !selectedShortcode)}
                  >
                    {editingCode ? t('clientCustomCodes.modal.update') : t('clientCustomCodes.modal.add')}
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default ClientCustomCodes;