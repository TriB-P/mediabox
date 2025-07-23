/**
 * @file Ce fichier contient le composant PermissionsTab.
 * Il s'agit d'un onglet de l'interface d'administration qui permet de gérer les rôles et leurs permissions.
 * Le composant affiche une table des rôles, permet de modifier les permissions directement,
 * et d'ouvrir des modales pour créer, éditer ou supprimer des rôles.
 * Toutes les données sont synchronisées avec la base de données Firebase.
 */

'use client';

import { useState, useEffect } from 'react';
import { getRoles, updateRole, createRole, deleteRole } from '../../lib/roleService';
import { Role, RoleFormData } from '../../types/roles';
import { Save, Plus, Trash2, Edit2 } from 'lucide-react';
import RoleFormModal from './RoleFormModal';


/**
 * Affiche et gère l'onglet des permissions des rôles dans le panneau d'administration.
 * @returns {JSX.Element} Le composant React de l'onglet des permissions.
 */
export default function PermissionsTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  /**
   * Charge la liste des rôles depuis Firebase et met à jour l'état du composant.
   * Gère l'état de chargement pendant l'opération.
   * @returns {Promise<void>} Une promesse qui se résout une fois les rôles chargés.
   */
  const loadRoles = async () => {
    try {
      setLoading(true);
      console.log("FIREBASE: LECTURE - Fichier: PermissionsTab.tsx - Fonction: loadRoles - Path: roles");
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour une permission spécifique pour un rôle donné.
   * La mise à jour est d'abord appliquée localement pour une meilleure réactivité,
   * puis envoyée à Firebase. En cas d'erreur, les données sont rechargées.
   * @param {string} roleId - L'ID du rôle à modifier.
   * @param {keyof Omit<Role, 'id' | 'name' | 'createdAt' | 'updatedAt'>} permission - La clé de la permission à changer.
   * @param {boolean} value - La nouvelle valeur (true ou false) de la permission.
   * @returns {Promise<void>} Une promesse qui se résout une fois la mise à jour terminée.
   */
  const handlePermissionChange = async (roleId: string, permission: keyof Omit<Role, 'id' | 'name' | 'createdAt' | 'updatedAt'>, value: boolean) => {
    try {
      setSaving(roleId);
      
      setRoles(prevRoles => 
        prevRoles.map(role => 
          role.id === roleId 
            ? { ...role, [permission]: value }
            : role
        )
      );
      
      console.log(`FIREBASE: ÉCRITURE - Fichier: PermissionsTab.tsx - Fonction: handlePermissionChange - Path: roles/${roleId}`);
      await updateRole(roleId, { [permission]: value });
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour des permissions:', error);
      loadRoles();
    } finally {
      setSaving(null);
    }
  };

  /**
   * Gère la création d'un nouveau rôle en base de données.
   * Appelle le service de création et recharge la liste des rôles.
   * @param {RoleFormData} roleData - Les données du nouveau rôle provenant du formulaire.
   * @returns {Promise<void>} Une promesse qui se résout après la création et le rechargement.
   */
  const handleCreateRole = async (roleData: RoleFormData) => {
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: PermissionsTab.tsx - Fonction: handleCreateRole - Path: roles");
      await createRole(roleData);
      await loadRoles();
    } catch (error) {
      console.error('Erreur lors de la création du rôle:', error);
      throw error;
    }
  };

  /**
   * Gère la modification d'un rôle existant en base de données.
   * Appelle le service de mise à jour et recharge la liste des rôles.
   * @param {RoleFormData} roleData - Les nouvelles données du rôle provenant du formulaire.
   * @returns {Promise<void>} Une promesse qui se résout après la modification et le rechargement.
   */
  const handleEditRole = async (roleData: RoleFormData) => {
    if (!editingRole) return;
    
    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: PermissionsTab.tsx - Fonction: handleEditRole - Path: roles/${editingRole.id}`);
      await updateRole(editingRole.id, roleData);
      await loadRoles();
    } catch (error) {
      console.error('Erreur lors de la modification du rôle:', error);
      throw error;
    }
  };

  /**
   * Gère la suppression d'un rôle après une confirmation de l'utilisateur.
   * Appelle le service de suppression et recharge la liste des rôles.
   * @param {string} roleId - L'ID du rôle à supprimer.
   * @param {string} roleName - Le nom du rôle à supprimer (utilisé pour la confirmation).
   * @returns {Promise<void>} Une promesse qui se résout après la suppression et le rechargement.
   */
  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${roleName}" ?`)) {
      return;
    }

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: PermissionsTab.tsx - Fonction: handleDeleteRole - Path: roles/${roleId}`);
      await deleteRole(roleId);
      await loadRoles();
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
      alert('Erreur lors de la suppression du rôle');
    }
  };

  /**
   * Ouvre la modale pour créer un nouveau rôle.
   * @returns {void}
   */
  const openCreateModal = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  /**
   * Ouvre la modale pour éditer un rôle existant.
   * @param {Role} role - L'objet du rôle à éditer.
   * @returns {void}
   */
  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  /**
   * Ferme la modale de création/édition et réinitialise l'état d'édition.
   * @returns {void}
   */
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const permissions = [
    { key: 'Access' as const, label: 'Accès' },
    { key: 'ClientInfo' as const, label: 'Infos Client' },
    { key: 'CostGuide' as const, label: 'Guide de Coût' },
    { key: 'Currency' as const, label: 'Devises' },
    { key: 'CustomCodes' as const, label: 'Codes Personnalisés' },
    { key: 'Dimensions' as const, label: 'Dimensions' },
    { key: 'Fees' as const, label: 'Frais' },
    { key: 'Listes' as const, label: 'Listes' },
    { key: 'Taxonomy' as const, label: 'Taxonomie' },
    { key: 'Templates' as const, label: 'Gabarits' },
  ];

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
        <h2 className="text-xl font-semibold text-gray-900">Gestion des permissions</h2>
        <button 
          onClick={openCreateModal}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Rôle</span>
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                {permissions.map(permission => (
                  <th key={permission.key} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {permission.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {role.name || role.id}
                      </div>
                      {saving === role.id && (
                        <Save className="ml-2 h-4 w-4 text-blue-500 animate-pulse" />
                      )}
                    </div>
                  </td>
                  {permissions.map(permission => (
                    <td key={permission.key} className="px-3 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={role[permission.key] || false}
                        onChange={(e) => handlePermissionChange(role.id, permission.key, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={saving === role.id}
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => openEditModal(role)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Modifier le rôle"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id, role.name || role.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer le rôle"
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

      {roles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun rôle configuré</p>
          <button 
            onClick={openCreateModal}
            className="mt-4 btn-primary"
          >
            Créer votre premier rôle
          </button>
        </div>
      )}

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={editingRole ? handleEditRole : handleCreateRole}
        role={editingRole}
      />
    </div>
  );
}