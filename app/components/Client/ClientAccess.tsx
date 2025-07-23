/**
 * Ce fichier contient le composant React `ClientAccess`.
 * Ce composant a pour rôle de gérer les permissions d'accès des utilisateurs à un client spécifique.
 * Il permet d'afficher la liste des utilisateurs ayant déjà un accès, d'ajouter de nouveaux accès,
 * de modifier les droits existants (par exemple, passer un utilisateur d'un rôle "Utilisateur" à "Éditeur"),
 * et de révoquer l'accès d'un utilisateur.
 * Le composant interagit avec Firebase pour récupérer les listes d'utilisateurs et pour mettre à jour les permissions.
 */
'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { 
  getAllUsers, 
  getClientUsers, 
  addUserAccess, 
  updateUserAccess, 
  removeUserAccess,
  User,
  UserAccess
} from '../../lib/userService';
import { Dialog } from '@headlessui/react';
import { 
  PencilIcon, 
  TrashIcon,
  XMarkIcon,
  UserPlusIcon 
} from '@heroicons/react/24/outline';

const ACCESS_LEVELS = [
  { value: 'editor', label: 'Éditeur' },
  { value: 'user', label: 'Utilisateur' }
];

/**
 * Composant principal pour la gestion des accès d'un client.
 * Il affiche les utilisateurs ayant accès, permet d'en ajouter, modifier ou supprimer.
 * @returns {React.ReactElement} Le JSX du composant.
 */
const ClientAccess: React.FC = () => {
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [clientUsers, setClientUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const hasAccessPermission = canPerformAction('Access');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccess | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState(ACCESS_LEVELS[1]);
  const [note, setNote] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  useEffect(() => {
    if (selectedClient) {
      loadData();
    }
  }, [selectedClient]);

  /**
   * Charge les données depuis Firebase : la liste de tous les utilisateurs du système
   * et la liste des utilisateurs ayant un accès spécifique au client sélectionné.
   * @async
   * @returns {Promise<void>}
   */
  const loadData = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("FIREBASE: [LECTURE] - Fichier: ClientAccess.tsx - Fonction: loadData - Path: users");
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      
      console.log(`FIREBASE: [LECTURE] - Fichier: ClientAccess.tsx - Fonction: loadData - Path: clients/${selectedClient.clientId}/userAccess`);
      const clientUsersList = await getClientUsers(selectedClient.clientId);
      setClientUsers(clientUsersList);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données.');
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
      
      setSuccess('Utilisateur ajouté avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      await loadData();
      
      closeModal();
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', err);
      setError('Impossible d\'ajouter l\'utilisateur.');
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
      
      setSuccess('Accès utilisateur mis à jour avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      await loadData();
      
      closeModal();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'accès utilisateur:', err);
      setError('Impossible de mettre à jour l\'accès utilisateur.');
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
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer l\'accès de cet utilisateur ?')) {
      try {
        setError(null);
        
        console.log(`FIREBASE: [ÉCRITURE] - Fichier: ClientAccess.tsx - Fonction: handleRemoveUser - Path: clients/${selectedClient.clientId}/userAccess/${userEmail}`);
        await removeUserAccess(selectedClient.clientId, userEmail);
        
        setSuccess('Accès utilisateur supprimé avec succès.');
        setTimeout(() => setSuccess(null), 3000);
        
        await loadData();
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'accès utilisateur:', err);
        setError('Impossible de supprimer l\'accès utilisateur.');
      }
    }
  };
  
  const filteredUsers = users.filter(user => {
    if (!userSearchQuery) return true;
    
    const searchLower = userSearchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });
  
  const availableUsers = filteredUsers.filter(user => 
    !clientUsers.some(clientUser => clientUser.userEmail === user.email)
  );

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Veuillez sélectionner un client pour gérer les accès.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Chargement des données d'accès...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Gestion des accès</h2>
          <button
            onClick={openAddUserModal}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
              hasAccessPermission 
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!hasAccessPermission}
            title={!hasAccessPermission ? "Vous n'avez pas la permission de gérer les accès" : ""}
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Ajouter un utilisateur
          </button>
        </div>

        {!hasAccessPermission && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700">
            Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier accès.
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
            <p className="text-gray-500">Aucun utilisateur n'a accès à ce client.</p>
            <p className="text-gray-500 mt-2">Cliquez sur "Ajouter un utilisateur" pour commencer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Niveau d'accès
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
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
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName}
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
                        {user.accessLevel === 'editor' ? 'Éditeur' : 'Utilisateur'}
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
                        title={!hasAccessPermission ? "Vous n'avez pas la permission de modifier les accès" : ""}
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
                        title={!hasAccessPermission ? "Vous n'avez pas la permission de supprimer les accès" : ""}
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
                    {isEditing ? 'Modifier l\'accès utilisateur' : 'Ajouter un utilisateur'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={closeModal}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-4">
                  {!isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sélectionner un utilisateur
                      </label>
                      
                      <div className="mb-2">
                        <input
                          type="text"
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          placeholder="Filtrer les utilisateurs..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <div className="relative">
                        <select
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          value={selectedUser?.id || ""}
                          onChange={(e) => {
                            const selectedUserId = e.target.value;
                            const user = users.find(u => u.id === selectedUserId);
                            setSelectedUser(user || null);
                          }}
                        >
                          <option value="">Sélectionner un utilisateur</option>
                          {availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.displayName} ({user.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedUser && (
                        <div className="mt-2 flex items-center bg-gray-50 p-2 rounded-md">
                          {selectedUser.photoURL ? (
                            <img
                              src={selectedUser.photoURL}
                              alt=""
                              className="h-8 w-8 rounded-full mr-2"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                              <span className="text-md text-indigo-800">
                                {selectedUser.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{selectedUser.displayName}</p>
                            <p className="text-xs text-gray-500">{selectedUser.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isEditing && currentUser && (
                    <div className="mb-4 flex items-center bg-gray-50 p-2 rounded-md">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt=""
                          className="h-8 w-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
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
                      Niveau d'accès
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
                      Note
                    </label>
                    <textarea
                      id="note"
                      name="note"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Ajoutez une note concernant cet accès..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                    onClick={closeModal}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={isEditing ? handleUpdateUser : handleAddUser}
                    disabled={isEditing ? false : !selectedUser}
                  >
                    {isEditing ? 'Mettre à jour' : 'Ajouter'}
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