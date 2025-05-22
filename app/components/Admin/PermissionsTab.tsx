// app/components/Admin/PermissionsTab.tsx

'use client';

import { useState, useEffect } from 'react';
import { getRoles, updateRole, createRole, deleteRole } from '../../lib/roleService';
import { Role, RoleFormData } from '../../types/roles';
import { Save, Plus, Trash2, Edit2 } from 'lucide-react';
import RoleFormModal from './RoleFormModal';

export default function PermissionsTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await getRoles();
      console.log('Rôles chargés:', rolesData); // Pour déboguer
      setRoles(rolesData);
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (roleId: string, permission: keyof Omit<Role, 'id' | 'name' | 'createdAt' | 'updatedAt'>, value: boolean) => {
    try {
      setSaving(roleId);
      
      // Mettre à jour localement
      setRoles(prevRoles => 
        prevRoles.map(role => 
          role.id === roleId 
            ? { ...role, [permission]: value }
            : role
        )
      );

      // Mettre à jour en base de données
      await updateRole(roleId, { [permission]: value });
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour des permissions:', error);
      // Recharger les données en cas d'erreur
      loadRoles();
    } finally {
      setSaving(null);
    }
  };

  const handleCreateRole = async (roleData: RoleFormData) => {
    try {
      await createRole(roleData);
      await loadRoles(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la création du rôle:', error);
      throw error;
    }
  };

  const handleEditRole = async (roleData: RoleFormData) => {
    if (!editingRole) return;
    
    try {
      await updateRole(editingRole.id, roleData);
      await loadRoles(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la modification du rôle:', error);
      throw error;
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${roleName}" ?`)) {
      return;
    }

    try {
      await deleteRole(roleId);
      await loadRoles(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
      alert('Erreur lors de la suppression du rôle');
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

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

      {/* Modal de création/édition */}
      <RoleFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={editingRole ? handleEditRole : handleCreateRole}
        role={editingRole}
      />
    </div>
  );
}