'use client';

import React, { useState, useEffect, Fragment, useRef } from 'react';
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
import { Listbox, Transition, Dialog } from '@headlessui/react';
import { 
  CheckIcon, 
  ChevronUpDownIcon, 
  PencilIcon, 
  TrashIcon,
  XMarkIcon,
  UserPlusIcon 
} from '@heroicons/react/24/outline';

const ACCESS_LEVELS = [
  { value: 'editor', label: 'Éditeur' },
  { value: 'user', label: 'Utilisateur' }
];

const ClientAccess: React.FC = () => {
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [clientUsers, setClientUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Vérifier si l'utilisateur a la permission de gérer les accès
  const hasAccessPermission = canPerformAction('Access');
  
  // États pour le formulaire d'ajout/modification d'utilisateur
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccess | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState(ACCESS_LEVELS[1]); // 'user' par défaut
  const [note, setNote] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Charger les données quand le client sélectionné change
  useEffect(() => {
    if (selectedClient) {
      loadData();
    }
  }, [selectedClient]);

  const loadData = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger tous les utilisateurs du système
      console.log("Chargement des utilisateurs...");
      const allUsers = await getAllUsers();
      console.log(`${allUsers.length} utilisateurs chargés`);
      setUsers(allUsers);
      
      // Charger les utilisateurs ayant accès au client
      console.log(`Chargement des utilisateurs avec accès au client ${selectedClient.clientId}...`);
      const clientUsersList = await getClientUsers(selectedClient.clientId);
      console.log(`${clientUsersList.length} utilisateurs ont accès`);
      setClientUsers(clientUsersList);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };
  
  const openAddUserModal = () => {
    if (!hasAccessPermission) return;
    
    setIsEditing(false);
    setSelectedUser(null);
    setSelectedAccessLevel(ACCESS_LEVELS[1]); // 'user' par défaut
    setNote('');
    setUserSearchQuery('');
    setIsModalOpen(true);
  };
  
  const openEditUserModal = (user: UserAccess) => {
    if (!hasAccessPermission) return;
    
    setIsEditing(true);
    setCurrentUser(user);
    
    // Définir les valeurs actuelles
    setSelectedAccessLevel(ACCESS_LEVELS.find(level => level.value === user.accessLevel) || ACCESS_LEVELS[1]);
    setNote(user.note || '');
    
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleAddUser = async () => {
    if (!selectedClient || !selectedUser || !hasAccessPermission) return;
    
    try {
      setError(null);
      
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
      
      // Recharger les données
      await loadData();
      
      // Fermer le modal
      closeModal();
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', err);
      setError('Impossible d\'ajouter l\'utilisateur.');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedClient || !currentUser || !hasAccessPermission) return;
    
    try {
      setError(null);
      
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
      
      // Recharger les données
      await loadData();
      
      // Fermer le modal
      closeModal();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'accès utilisateur:', err);
      setError('Impossible de mettre à jour l\'accès utilisateur.');
    }
  };

  const handleRemoveUser = async (userEmail: string) => {
    if (!selectedClient || !hasAccessPermission) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer l\'accès de cet utilisateur ?')) {
      try {
        setError(null);
        
        await removeUserAccess(selectedClient.clientId, userEmail);
        
        setSuccess('Accès utilisateur supprimé avec succès.');
        setTimeout(() => setSuccess(null), 3000);
        
        // Recharger les données
        await loadData();
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'accès utilisateur:', err);
        setError('Impossible de supprimer l\'accès utilisateur.');
      }
    }
  };
  
  // Filtrer les utilisateurs en fonction de la recherche
  const filteredUsers = users.filter(user => {
    if (!userSearchQuery) return true;
    
    const searchLower = userSearchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });
  
  // Filtrer pour ne montrer que les utilisateurs qui n'ont pas encore accès
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
        
        {/* Liste des utilisateurs ayant accès */}
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
        
        {/* Modal d'ajout/modification d'utilisateur */}
        {isModalOpen && hasAccessPermission && (
          <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" open={isModalOpen} onClose={closeModal}>
            <div className="min-h-screen px-4 text-center">
              <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

              {/* Astuce pour centrer le modal */}
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
                  {/* Sélection d'utilisateur (uniquement en mode ajout) */}
                  {!isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sélectionner un utilisateur
                      </label>
                      
                      {/* Champ de recherche/filtre */}
                      <div className="mb-2">
                        <input
                          type="text"
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          placeholder="Filtrer les utilisateurs..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      {/* Liste déroulante d'utilisateurs */}
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
                  
                  {/* Affichage de l'utilisateur en mode édition */}
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
                  
                  {/* Niveau d'accès */}
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
                  
                  {/* Note */}
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