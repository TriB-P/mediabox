// app/components/Client/ClientAccess.tsx
/**
 * Ce fichier contient le composant React `ClientAccess`.
 * Ce composant a pour rôle de gérer les permissions d'accès des utilisateurs à un client spécifique.
 * Il permet d'afficher la liste des utilisateurs ayant déjà un accès, d'ajouter de nouveaux accès,
 * de modifier les droits existants (par exemple, passer un utilisateur d'un rôle "Utilisateur" à "Éditeur"),
 * et de révoquer l'accès d'un utilisateur.
 * NOUVELLE FONCTIONNALITÉ : Ajout multiple d'utilisateurs via copier-coller d'emails
 * Le composant interagit avec Firebase pour récupérer les listes d'utilisateurs (actifs + invités) et pour mettre à jour les permissions.
 */
'use client';

import React, { useState, useEffect } from 'react';
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
  
  // Nouveaux états pour l'ajout multiple
  const [addMode, setAddMode] = useState<'simple' | 'multiple'>('simple');
  const [bulkEmailInput, setBulkEmailInput] = useState('');
  const [validatedBulkUsers, setValidatedBulkUsers] = useState<{
    valid: UserWithStatus[];
    notFound: string[];
    alreadyAdded: string[];
  }>({ valid: [], notFound: [], alreadyAdded: [] });
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  
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
   * Charge les données depuis Firebase
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
   * Ouvre la fenêtre modale pour ajouter un nouvel utilisateur
   */
  const openAddUserModal = () => {
    if (!hasAccessPermission) return;
    
    setIsEditing(false);
    setAddMode('simple');
    setSelectedUser(null);
    setSelectedAccessLevel(ACCESS_LEVELS[1]);
    setNote('');
    setUserSearchQuery('');
    setIsDropdownOpen(false);
    setBulkEmailInput('');
    setValidatedBulkUsers({ valid: [], notFound: [], alreadyAdded: [] });
    setIsModalOpen(true);
  };
  
  /**
   * Ouvre la fenêtre modale pour modifier un utilisateur existant
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
   * Ferme la fenêtre modale
   */
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
    setIsDropdownOpen(false);
    setSelectedUser(null);
    setUserSearchQuery('');
    setBulkEmailInput('');
    setValidatedBulkUsers({ valid: [], notFound: [], alreadyAdded: [] });
    setAddMode('simple');
  };

  /**
   * Valide une liste d'emails et retourne les utilisateurs correspondants
   */
  const validateBulkEmails = (emailList: string) => {
    const emails = emailList
      .split('\n')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);
    
    const valid: UserWithStatus[] = [];
    const notFound: string[] = [];
    const alreadyAdded: string[] = [];
    
    emails.forEach(email => {
      if (clientUsers.some(user => user.userEmail.toLowerCase() === email)) {
        alreadyAdded.push(email);
        return;
      }
      
      const user = usersWithStatus.find(u => u.email.toLowerCase() === email);
      
      if (user) {
        valid.push(user);
      } else {
        notFound.push(email);
      }
    });
    
    return { valid, notFound, alreadyAdded };
  };

  /**
   * Gère le changement de texte dans la zone d'ajout multiple
   */
  const handleBulkEmailChange = (value: string) => {
    setBulkEmailInput(value);
    const validated = validateBulkEmails(value);
    setValidatedBulkUsers(validated);
  };

  /**
   * Gère la soumission du formulaire pour ajouter un accès utilisateur
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
   * Gère l'ajout multiple d'utilisateurs
   */
  const handleAddMultipleUsers = async () => {
    if (!selectedClient || !hasAccessPermission || validatedBulkUsers.valid.length === 0) return;
    
    setIsProcessingBulk(true);
    setError(null);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    try {
      for (const user of validatedBulkUsers.valid) {
        try {
          console.log(`FIREBASE: [ÉCRITURE] - Fichier: ClientAccess.tsx - Fonction: handleAddMultipleUsers - Path: clients/${selectedClient.clientId}/userAccess`);
          await addUserAccess(
            selectedClient.clientId,
            selectedClient.CL_Name,
            {
              userEmail: user.email,
              accessLevel: selectedAccessLevel.value as 'editor' | 'user',
              note: note
            }
          );
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push(`${user.email}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        }
      }
      
      let successMessage = `${results.success} utilisateur(s) ajouté(s) avec succès`;
      if (results.failed > 0) {
        successMessage += ` (${results.failed} échec(s))`;
      }
      if (validatedBulkUsers.notFound.length > 0) {
        successMessage += `. ${validatedBulkUsers.notFound.length} email(s) non trouvé(s)`;
      }
      
      setSuccess(successMessage);
      setTimeout(() => setSuccess(null), 5000);
      
      await loadData();
      closeModal();
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout multiple:', err);
      setError('Erreur lors de l\'ajout multiple des utilisateurs');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  /**
   * Gère la mise à jour d'un utilisateur
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
   * Gère la suppression de l'accès d'un utilisateur
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
   */
  const getUserStatusBadge = (status: UserWithStatus['status']) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Actif
        </span>
      );
    }
    if (status === 'invited') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ⏱ Invité
        </span>
      );
    }
    return null;
  };
  
  const filteredUsers = usersWithStatus.filter(user => {
    if (!userSearchQuery.trim()) return true;
    
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
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
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
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveUser(user.userEmail)}
                        className={`${
                          hasAccessPermission 
                            ? 'text-red-600 hover:text-red-900' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!hasAccessPermission}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Modal */}
        {isModalOpen && hasAccessPermission && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closeModal}></div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              
              <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {isEditing ? t('clientAccess.modal.title.edit') : t('clientAccess.modal.title.add')}
                  </h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={closeModal}
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Toggle entre mode simple et multiple */}
                  {!isEditing && (
                    <div className="flex space-x-2 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => setAddMode('simple')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 ${
                          addMode === 'simple'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Ajout simple
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddMode('multiple')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 ${
                          addMode === 'multiple'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Ajout multiple
                      </button>
                    </div>
                  )}

                  {/* Mode ajout simple */}
                  {!isEditing && addMode === 'simple' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('clientAccess.form.label.selectUser')}
                      </label>
                      
                      <div className="relative user-dropdown">
                        <input
                          type="text"
                          className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                          <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto">
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
                                      <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full mr-3" />
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
                            <img src={selectedUser.photoURL} alt="" className="h-8 w-8 rounded-full mr-3" />
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
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode ajout multiple */}
                  {!isEditing && addMode === 'multiple' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Liste des emails (un par ligne)
                      </label>
                      <textarea
                        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        rows={8}
                        placeholder="exemple1@email.com&#10;exemple2@email.com&#10;exemple3@email.com"
                        value={bulkEmailInput}
                        onChange={(e) => handleBulkEmailChange(e.target.value)}
                      />
                      
                      {/* Résumé de la validation */}
                      {bulkEmailInput.trim() && (
                        <div className="mt-3 space-y-2">
                          {validatedBulkUsers.valid.length > 0 && (
                            <div className="flex items-center text-sm text-green-700">
                              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{validatedBulkUsers.valid.length} utilisateur(s) valide(s)</span>
                            </div>
                          )}
                          {validatedBulkUsers.alreadyAdded.length > 0 && (
                            <div className="flex items-start text-sm text-blue-700">
                              <svg className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <span>{validatedBulkUsers.alreadyAdded.length} utilisateur(s) déjà ajouté(s)</span>
                                <div className="text-xs mt-1 text-blue-600">
                                  {validatedBulkUsers.alreadyAdded.join(', ')}
                                </div>
                              </div>
                            </div>
                          )}
                          {validatedBulkUsers.notFound.length > 0 && (
                            <div className="flex items-start p-3 bg-amber-50 border-l-4 border-amber-400 text-amber-700 text-sm">
                              <svg className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <div>
                                <span className="font-medium">{validatedBulkUsers.notFound.length} email(s) non trouvé(s)</span>
                                <div className="text-xs mt-1">
                                  {validatedBulkUsers.notFound.join(', ')}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isEditing && currentUser && (
                    <div className="mb-4 flex items-center bg-gray-50 p-3 rounded-md">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="" className="h-8 w-8 rounded-full mr-3" />
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
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder={t('clientAccess.form.placeholder.addNote')}
                    />
                    {addMode === 'multiple' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Cette note sera appliquée à tous les utilisateurs ajoutés
                      </p>
                    )}
                  </div>
                  
                  {selectedUser && selectedUser.status === 'invited' && (
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700 text-sm">
                      <div className="flex">
                        <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium">Utilisateur invité</p>
                          <p className="text-xs mt-1">Cet utilisateur verra ce client dès sa première connexion.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={closeModal}
                    disabled={isProcessingBulk}
                  >
                    {t('clientAccess.buttons.cancel')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={
                      isEditing 
                        ? handleUpdateUser 
                        : addMode === 'simple' 
                          ? handleAddUser 
                          : handleAddMultipleUsers
                    }
                    disabled={
                      isProcessingBulk || 
                      (isEditing 
                        ? false 
                        : addMode === 'simple' 
                          ? !selectedUser 
                          : validatedBulkUsers.valid.length === 0)
                    }
                  >
                    {isProcessingBulk ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Traitement...
                      </>
                    ) : (
                      <>
                        {isEditing 
                          ? t('clientAccess.buttons.update') 
                          : addMode === 'simple'
                            ? t('clientAccess.buttons.add')
                            : `Ajouter ${validatedBulkUsers.valid.length} utilisateur(s)`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientAccess;