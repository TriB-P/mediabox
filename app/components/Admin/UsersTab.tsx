/**
 * @file app/components/Admin/UsersTab.tsx
 * Ce fichier définit le composant React `UsersTab`, qui constitue un onglet dans l'interface d'administration.
 * Il permet aux administrateurs de visualiser la liste de tous les utilisateurs (actifs, invités, expirés),
 * d'inviter de nouveaux utilisateurs par email, de modifier le rôle des utilisateurs actifs, et de
 * supprimer des utilisateurs ou des invitations.
 */

'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2, RotateCcw, Clock, CheckCircle, XCircle, Search, X, Edit2 } from 'lucide-react';
import { UserWithStatus, InvitationFormData } from '../../types/invitations';
import { getAllUsersWithStatus, createInvitation, removeUser } from '../../lib/invitationService';
import { useAuth } from '../../contexts/AuthContext';
import InvitationModal from './InvitationModal';
import EditUserModal from './EditUserModal';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

/**
 * Composant principal de l'onglet de gestion des utilisateurs.
 * Affiche une interface complète pour visualiser, inviter, et gérer les utilisateurs de l'application.
 * @returns {JSX.Element} Le rendu de l'onglet de gestion des utilisateurs.
 */
export default function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserWithStatus | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  /**
   * Charge ou recharge la liste complète des utilisateurs et des invitations.
   * Appelle le service `getAllUsersWithStatus` pour récupérer les données et met à jour l'état du composant.
   * @returns {Promise<void>} Une promesse qui se résout une fois les utilisateurs chargés.
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersWithStatus = await getAllUsersWithStatus();
      setUsers(usersWithStatus);
      setFilteredUsers(usersWithStatus);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère l'ouverture de la modale d'édition pour un utilisateur spécifique.
   * @param {UserWithStatus} user - L'objet utilisateur à modifier.
   * @returns {void}
   */
  const handleEditUser = (user: UserWithStatus) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  /**
   * Sauvegarde le nouveau rôle d'un utilisateur dans Firestore.
   * @param {string} userId - L'ID de l'utilisateur à mettre à jour.
   * @param {string} newRole - Le nouveau rôle à assigner.
   * @returns {Promise<void>} Une promesse qui se résout après la mise à jour et le rechargement des données.
   */
  const handleSaveUserRole = async (userId: string, newRole: string) => {
    try {
      if (userId.startsWith('invitation-')) {
        throw new Error('Impossible de modifier le rôle d\'une invitation. L\'utilisateur doit d\'abord se connecter.');
      }
      
      const userRef = doc(db, 'users', userId);
      console.log(`FIREBASE: ÉCRITURE - Fichier: UsersTab.tsx - Fonction: handleSaveUserRole - Path: users/${userId}`);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date(),
      });
      
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      throw error;
    }
  };

  /**
   * Gère l'envoi d'une nouvelle invitation via le service `createInvitation`.
   * @param {InvitationFormData} invitationData - Les données du formulaire d'invitation (email, rôle).
   * @returns {Promise<void>} Une promesse qui se résout après l'envoi de l'invitation et le rechargement de la liste.
   */
  const handleSendInvitation = async (invitationData: InvitationFormData) => {
    if (!currentUser?.email) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      await createInvitation(invitationData, currentUser.email);
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', error);
      throw error;
    }
  };

  /**
   * Gère la suppression d'une invitation ou la désactivation d'un utilisateur actif.
   * Demande une confirmation avant d'effectuer l'action.
   * @param {UserWithStatus} userToRemove - L'utilisateur ou l'invitation à supprimer.
   * @returns {Promise<void>} Une promesse qui se résout après la suppression et le rechargement de la liste.
   */
  const handleRemoveUser = async (userToRemove: UserWithStatus) => {
    const confirmMessage = userToRemove.status === 'active' 
      ? `Êtes-vous sûr de vouloir désactiver l'utilisateur "${userToRemove.email}" ?`
      : `Êtes-vous sûr de vouloir supprimer l'invitation pour "${userToRemove.email}" ?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await removeUser(userToRemove);
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  /**
   * Retourne un badge JSX stylisé en fonction du statut de l'utilisateur.
   * @param {UserWithStatus['status']} status - Le statut de l'utilisateur ('active', 'invited', 'expired').
   * @returns {JSX.Element | null} Un composant de badge ou null.
   */
  const getStatusBadge = (status: UserWithStatus['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actif
          </span>
        );
      case 'invited':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Invité
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Expiré
          </span>
        );
      default:
        return null;
    }
  };

  /**
   * Formate une chaîne de caractères de date en une date lisible pour l'interface.
   * @param {string | undefined} dateString - La date sous forme de chaîne ISO.
   * @returns {string} La date formatée (ex: "23/07/2025, 10:25") ou '-'.
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestion des utilisateurs</h2>
          <p className="text-sm text-gray-600 mt-1">
            Inviter de nouveaux utilisateurs et gérer les accès à l'application
          </p>
        </div>
        <button 
          onClick={() => setIsInvitationModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Inviter utilisateur</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Utilisateurs actifs</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Invitations en attente</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.filter(u => u.status === 'invited').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Invitations expirées</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.filter(u => u.status === 'expired').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <UserPlus className="h-8 w-8 text-indigo-500" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, email ou rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            {filteredUsers.length} résultat(s) trouvé(s) pour "{searchTerm}"
          </p>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-64 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="w-32 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="w-40 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invité le
                </th>
                <th className="w-40 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accepté le
                </th>
                <th className="w-32 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invité par
                </th>
                <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="w-64 px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.photoURL ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={user.photoURL}
                          alt={user.displayName}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.displayName}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="w-32 px-4 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="w-24 px-4 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">
                      {user.role || '-'}
                    </span>
                  </td>
                  <td className="w-40 px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {formatDate(user.invitedAt)}
                  </td>
                  <td className="w-40 px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {formatDate(user.acceptedAt)}
                  </td>
                  <td className="w-32 px-4 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-500 truncate">
                      {user.invitedBy ? user.invitedBy.split('@')[0] : '-'}
                    </span>
                  </td>
                  <td className="w-20 px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-1">
                      {user.status === 'active' && (
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Modifier le rôle"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {user.status === 'expired' && (
                        <button
                          onClick={() => {}}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Renvoyer l'invitation"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveUser(user)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title={user.status === 'active' ? 'Désactiver l\'utilisateur' : 'Supprimer l\'invitation'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && users.length > 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun résultat</h3>
          <p className="mt-1 text-sm text-gray-500">
            Aucun utilisateur ne correspond à votre recherche "{searchTerm}".
          </p>
          <div className="mt-6">
            <button 
              onClick={() => setSearchTerm('')}
              className="btn-secondary"
            >
              Effacer la recherche
            </button>
          </div>
        </div>
      )}

      {users.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur</h3>
          <p className="mt-1 text-sm text-gray-500">
            Commencez par inviter votre premier utilisateur.
          </p>
          <div className="mt-6">
            <button 
              onClick={() => setIsInvitationModalOpen(true)}
              className="btn-primary"
            >
              Inviter un utilisateur
            </button>
          </div>
        </div>
      )}

      {users.some(u => u.status === 'invited') && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <Clock className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                À propos des invitations
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Les utilisateurs invités recevront un accès automatiquement lors de leur première connexion avec Google.
                  Les invitations expirent après 7 jours et peuvent être renvoyées si nécessaire.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <InvitationModal
        isOpen={isInvitationModalOpen}
        onClose={() => setIsInvitationModalOpen(false)}
        onSend={handleSendInvitation}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setUserToEdit(null);
        }}
        user={userToEdit}
        onSave={handleSaveUserRole}
      />
    </div>
  );
}