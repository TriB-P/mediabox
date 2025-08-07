// app/components/Client/ClientAccess.tsx
/**
 * Ce fichier contient le composant React `ClientAccess`.
 * Ce composant a pour rôle de gérer les permissions d'accès des utilisateurs à un client spécifique.
 * Il permet d'afficher la liste des utilisateurs ayant déjà un accès, d'ajouter de nouveaux accès,
 * de modifier les droits existants (par exemple, passer un utilisateur d'un rôle "Utilisateur" à "Éditeur"),
 * et de révoquer l'accès d'un utilisateur.
 * Le composant interagit avec Firebase pour récupérer les listes d'utilisateurs (actifs + invités) et pour mettre à jour les permissions.
 */
'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { 
  getClientUsers, 
  addUserAccess, 
  updateUserAccess, 
  removeUserAccess,
  UserAccess
} from '../../lib/userService';
import { getAllUsersWithStatus, UserWithStatus } from '../../lib/invitationService';
import { Dialog } from '@headlessui/react';
import { 
  PencilIcon, 
  TrashIcon,
  XMarkIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

/**
 * Composant principal pour la gestion des accès d'un client.
 * Il affiche les utilisateurs ayant accès, permet d'en ajouter, modifier ou supprimer.
 * @returns {React.ReactElement} Le JSX du composant.
 */
const ClientAccess: React.FC = () => {
  const { t } = useTranslation();

  const ACCESS_LEVELS = [
    { value: 'editor', label: t('clientAccess.accessLevels.editor') },
    { value: 'user', label: t('clientAccess.accessLevels.user') }
  ];

  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [usersWithStatus, setUsersWithStatus] = useState<UserWithStatus[]>([]);
  const [clientUsers, setClientUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const hasAccessPermission = canPerformAction('Access');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccess | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithStatus | null>(null);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState(ACCESS_LEVELS[1]);
  const [note, setNote] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  useEffect(() => {
    if (selectedClient) {
      loadData();
    }
  }, [selectedClient]);

  // Fermer le drop down quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isDropdownOpen && !target.closest('.user-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  /**
   * Charge les données depuis Firebase : la liste de tous les utilisateurs du système (actifs + invités)
   * et la liste des utilisateurs ayant un accès spécifique au client sélectionné.
   * @async
   * @returns {Promise<void>}
   */
  const loadData = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("FIREBASE: [LECTURE] - Fichier: ClientAccess.tsx - Fonction: loadData - Path: users + invitations");
      const allUsersWithStatus = await getAllUsersWithStatus();
      setUsersWithStatus(allUsersWithStatus);
      
      console.log(`FIREBASE: [LECTURE] - Fichier: ClientAccess.tsx - Fonction: loadData - Path: clients/${selectedClient.clientId}/userAccess`);
      const clientUsersList = await getClientUsers(selectedClient.clientId);
      setClientUsers(clientUsersList);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(t('clientAccess.errors.loadData'));
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Ouvre la fenêtre modale pour ajouter un nouvel utilisateur.
   * Réinitialise les états du formulaire en mode "ajout".
   * Ne fait rien si l'utilisateur n'a pas les permissions nécessaires.
   * @returns {void}
   */
  const openAddUserModal = () => {
    if (!hasAccessPermission) return;
    
    setIsEditing(false);
    setSelectedUser(null);
    setSelectedAccessLevel(ACCESS_LEVELS[1]);
    setNote('');
    setUserSearchQuery('');
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  };
  
  /**
   * Ouvre la fenêtre modale pour modifier un utilisateur existant.
   * Pré-remplit le formulaire avec les informations de l'utilisateur sélectionné.
   * Ne fait rien si l'utilisateur n'a pas les permissions nécessaires.
   * @param {UserAccess} user - L'utilisateur dont l'accès doit être modifié.
   * @returns {void}
   */
  const openEditUserModal = (user: UserAccess) => {
    if (!hasAccessPermission) return;
    
    setIsEditing(true);
    setCurrentUser(user);
    
    setSelectedAccessLevel(ACCESS_LEVELS.find(level => level.value === user.accessLevel) || ACCESS_LEVELS[1]);
    setNote(user.note || '');
    
    setIsModalOpen(true);
  };
  
  /**
   * Ferme la fenêtre modale et réinitialise l'état de l'utilisateur en cours d'édition.
   * @returns {void}
   */
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
    setIsDropdownOpen(false);
    setSelectedUser(null);
    setUserSearchQuery('');
  };

  /**
   * Gère la soumission du formulaire pour ajouter un accès utilisateur.
   * Appelle le service Firebase pour créer le nouvel accès, puis recharge les données.
   * @async
   * @returns {Promise<void>}
   */
  const handleAddUser = async () => {
    if (!selectedClient || !selectedUser || !hasAccessPermission) return;
    
    try {
      setError(null);
      
      console.log(`FIREBASE: [ÉCRITURE] - Fichier: ClientAccess.tsx - Fonction: handleAddUser - Path: clients/${selectedClient.clientId}/userAccess`);
      await addUserAccess(
        selectedClient.clientId,
        selectedClient.CL_Name,
        {
          userId: selectedUser.id,
          userEmail: selectedUser.email,
          accessLevel: selectedAccessLevel.value as 'editor' | 'user',
          note: note
        }
      );
      
      setSuccess(t('clientAccess.success.userAdded'));
      setTimeout(() => setSuccess(null), 3000);
      
      await loadData();
      
      closeModal();
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', err);
      setError(t('clientAccess.errors.addUser'));
    }
  };

  /**
   * Gère la soumission du formulaire pour mettre à jour un accès utilisateur.
   * Appelle le service Firebase pour modifier l'accès, puis recharge les données.
   * @async
   * @returns {Promise<void>}
   */
  const handleUpdateUser = async () => {
    if (!selectedClient || !currentUser || !hasAccessPermission) return;
    
    try {
      setError(null);
      
      console.log(`FIREBASE: [ÉCRITURE] - Fichier: ClientAccess.tsx - Fonction: handleUpdateUser - Path: clients/${selectedClient.clientId}/userAccess/${currentUser.userEmail}`);
      await updateUserAccess(
        selectedClient.clientId,
        currentUser.userEmail,
        {
          accessLevel: selectedAccessLevel.value as 'editor' | 'user',
          note: note
        }
      );
      
      setSuccess(t('clientAccess.success.userUpdated'));
      setTimeout(() => setSuccess(null), 3000);
      
      await loadData();
      
      closeModal();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'accès utilisateur:', err);
      setError(t('clientAccess.errors.updateUser'));
    }
  };

  /**
   * Gère la suppression de l'accès d'un utilisateur après confirmation.
   * Appelle le service Firebase pour supprimer l'accès, puis recharge les données.
   * @param {string} userEmail - L'email de l'utilisateur dont l'accès doit être supprimé.
   * @async
   * @returns {Promise<void>}
   */
  const handleRemoveUser = async (userEmail: string) => {
    if (!selectedClient || !hasAccessPermission) return;
    
    if (window.confirm(t('clientAccess.confirmations.removeUser'))) {
      try {
        setError(null);
        
        console.log(`FIREBASE: [ÉCRITURE] - Fichier: ClientAccess.tsx - Fonction: handleRemoveUser - Path: clients/${selectedClient.clientId}/userAccess/${userEmail}`);
        await removeUserAccess(selectedClient.clientId, userEmail);
        
        setSuccess(t('clientAccess.success.userRemoved'));
        setTimeout(() => setSuccess(null), 3000);
        
        await loadData();
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'accès utilisateur:', err);
        setError(t('clientAccess.errors.removeUser'));
      }
    }
  };
  
  /**
   * Retourne le badge de statut approprié pour un utilisateur
   * @param {UserWithStatus['status']} status - Le statut de l'utilisateur
   * @returns {JSX.Element} Badge JSX avec icône et texte
   */
  const getUserStatusBadge = (status: UserWithStatus['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Actif
          </span>
        );
      case 'invited':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Invité
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XMarkIcon className="w-3 h-3 mr-1" />
            Expiré
          </span>
        );
      default:
        return null;
    }
  };
  
  const filteredUsers = usersWithStatus.filter(user => {
    if (!userSearchQuery.trim()) return true;
    
    const searchLower = userSearchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });
  
  // Filtrer pour exclure les utilisateurs qui ont déjà un accès et les invitations expirées
  const availableUsers = filteredUsers.filter(user => 
    !clientUsers.some(clientUser => clientUser.userEmail === user.email) &&
    user.status !== 'expired'
  );

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">{t('clientAccess.messages.selectClient')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">{t('clientAccess.messages.loading')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">{t('clientAccess.title')}</h2>
          <button
            onClick={openAddUserModal}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
              hasAccessPermission 
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!hasAccessPermission}
            title={!hasAccessPermission ? t('clientAccess.tooltips.noAccessPermission') : ""}
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            {t('clientAccess.buttons.addUser')}
          </button>
        </div>

        {!hasAccessPermission && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700">
            {t('clientAccess.messages.readOnly')}
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
        
        {clientUsers.length === 0 ? (
          <div className="bg-gray-50 p-6 text-center rounded-lg">
            <p className="text-gray-500">{t('clientAccess.emptyState.noUsers')}</p>
            <p className="text-gray-500 mt-2">{t('clientAccess.emptyState.getStarted')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientAccess.table.header.user')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientAccess.table.header.accessLevel')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientAccess.table.header.note')}
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">{t('clientAccess.table.header.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientUsers.map((user) => (
                  <tr key={user.userId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.photoURL ? (
                            <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-xl text-indigo-800">
                                {user.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName}
                            </div>
                            {user.status && getUserStatusBadge(user.status)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.accessLevel === 'editor' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.accessLevel === 'editor' ? t('clientAccess.accessLevels.editor') : t('clientAccess.accessLevels.user')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.note || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditUserModal(user)}
                        className={`${
                          hasAccessPermission 
                            ? 'text-indigo-600 hover:text-indigo-900' 
                            : 'text-gray-400 cursor-not-allowed'
                        } mr-4`}
                        disabled={!hasAccessPermission}
                        title={!hasAccessPermission ? t('clientAccess.tooltips.noEditPermission') : ""}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleRemoveUser(user.userEmail)}
                        className={`${
                          hasAccessPermission 
                            ? 'text-red-600 hover:text-red-900' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!hasAccessPermission}
                        title={!hasAccessPermission ? t('clientAccess.tooltips.noDeletePermission') : ""}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {isModalOpen && hasAccessPermission && (
          <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" open={isModalOpen} onClose={closeModal}>
            <div className="min-h-screen px-4 text-center">
              <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

              <span className="inline-block h-screen align-middle" aria-hidden="true">
                &#8203;
              </span>
              
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {isEditing ? t('clientAccess.modal.title.edit') : t('clientAccess.modal.title.add')}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={closeModal}
                  >
                    <span className="sr-only">{t('clientAccess.modal.close')}</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-4">
                  {!isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('clientAccess.form.label.selectUser')}
                      </label>
                      
                      <div className="relative user-dropdown">
                        <input
                          type="text"
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          placeholder="Rechercher un utilisateur..."
                          value={selectedUser ? `${selectedUser.displayName} (${selectedUser.email})` : userSearchQuery}
                          onChange={(e) => {
                            if (!selectedUser) {
                              setUserSearchQuery(e.target.value);
                            }
                            setIsDropdownOpen(true);
                          }}
                          onFocus={() => {
                            if (!selectedUser) {
                              setIsDropdownOpen(true);
                            }
                          }}
                          onClick={() => {
                            if (selectedUser) {
                              setSelectedUser(null);
                              setUserSearchQuery('');
                              setIsDropdownOpen(true);
                            }
                          }}
                        />
                        
                        {isDropdownOpen && !selectedUser && (
                          <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                            {availableUsers.length === 0 ? (
                              <div className="px-4 py-2 text-gray-500 text-sm">
                                {userSearchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                              </div>
                            ) : (
                              availableUsers.map((user) => (
                                <div
                                  key={user.id}
                                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setUserSearchQuery('');
                                    setIsDropdownOpen(false);
                                  }}
                                >
                                  <div className="flex items-center">
                                    {user.photoURL ? (
                                      <img
                                        src={user.photoURL}
                                        alt=""
                                        className="h-8 w-8 rounded-full mr-3"
                                      />
                                    ) : (
                                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                        <span className="text-sm text-indigo-800">
                                          {user.displayName.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium text-gray-900">{user.displayName}</div>
                                          <div className="text-gray-500 text-sm">{user.email}</div>
                                        </div>
                                        {getUserStatusBadge(user.status)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      
                      {selectedUser && (
                        <div className="mt-2 flex items-center bg-gray-50 p-3 rounded-md">
                          {selectedUser.photoURL ? (
                            <img
                              src={selectedUser.photoURL}
                              alt=""
                              className="h-8 w-8 rounded-full mr-3"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                              <span className="text-md text-indigo-800">
                                {selectedUser.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium">{selectedUser.displayName}</p>
                              {getUserStatusBadge(selectedUser.status)}
                            </div>
                            <p className="text-xs text-gray-500">{selectedUser.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(null);
                              setUserSearchQuery('');
                              setIsDropdownOpen(false);
                            }}
                            className="text-gray-400 hover:text-gray-500 p-1"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isEditing && currentUser && (
                    <div className="mb-4 flex items-center bg-gray-50 p-3 rounded-md">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt=""
                          className="h-8 w-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                          <span className="text-md text-indigo-800">
                            {currentUser.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{currentUser.displayName}</p>
                        <p className="text-xs text-gray-500">{currentUser.userEmail}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('clientAccess.form.label.accessLevel')}
                    </label>
                    <select
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={selectedAccessLevel.value}
                      onChange={(e) => {
                        const value = e.target.value as 'editor' | 'user';
                        const level = ACCESS_LEVELS.find(l => l.value === value) || ACCESS_LEVELS[1];
                        setSelectedAccessLevel(level);
                      }}
                    >
                      {ACCESS_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('clientAccess.form.label.note')}
                    </label>
                    <textarea
                      id="note"
                      name="note"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder={t('clientAccess.form.placeholder.addNote')}
                    />
                  </div>
                  
                  {selectedUser && selectedUser.status === 'invited' && (
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700 text-sm">
                      <div className="flex">
                        <ClockIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Utilisateur invité</p>
                          <p className="text-xs mt-1">Cet utilisateur verra ce client dès sa première connexion.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                    onClick={closeModal}
                  >
                    {t('clientAccess.buttons.cancel')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={isEditing ? handleUpdateUser : handleAddUser}
                    disabled={isEditing ? false : !selectedUser}
                  >
                    {isEditing ? t('clientAccess.buttons.update') : t('clientAccess.buttons.add')}
                  </button>
                </div>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default ClientAccess;