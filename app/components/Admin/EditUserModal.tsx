// app/components/Admin/EditUserModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { UserWithStatus } from '../../types/invitations';
import { getRoles } from '../../lib/roleService';
import { Role } from '../../types/roles';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithStatus | null;
  onSave: (userId: string, newRole: string) => Promise<void>;
}

export default function EditUserModal({ isOpen, onClose, user, onSave }: EditUserModalProps) {
  const [selectedRole, setSelectedRole] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      loadRoles();
      setSelectedRole(user.role || '');
    }
  }, [isOpen, user]);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedRole) {
      return;
    }

    if (selectedRole === user.role) {
      // Aucun changement
      onClose();
      return;
    }

    try {
      setSaving(true);
      await onSave(user.id, selectedRole);
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      alert(error.message || 'Erreur lors de la mise à jour du rôle');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  const selectedRoleData = roles.find(role => role.id === selectedRole);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Modifier le rôle utilisateur
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Informations utilisateur */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {user.photoURL ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.photoURL}
                      alt={user.displayName}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {user.displayName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sélection du rôle */}
              <div>
                <label className="form-label">
                  Nouveau rôle *
                </label>
                {loadingRoles ? (
                  <div className="form-input bg-gray-50 text-gray-500 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                    Chargement des rôles...
                  </div>
                ) : roles.length === 0 ? (
                  <div className="form-input bg-red-50 text-red-600">
                    Aucun rôle disponible. Veuillez créer des rôles d'abord.
                  </div>
                ) : (
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Sélectionnez un rôle</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
                
                {/* Rôle actuel */}
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <span className="text-blue-800">
                    Rôle actuel : <strong>{user.role || 'Aucun rôle'}</strong>
                  </span>
                </div>

                {/* Aperçu des permissions */}
                {selectedRoleData && (
                  <div className="mt-3 p-3 bg-green-50 rounded">
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      Permissions du rôle "{selectedRoleData.name}" :
                    </h4>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(selectedRoleData).map(([key, value]) => {
                        if (key === 'id' || key === 'name' || key === 'createdAt' || key === 'updatedAt') return null;
                        return (
                          <div key={key} className={`flex items-center ${value ? 'text-green-700' : 'text-gray-500'}`}>
                            <span className={`w-2 h-2 rounded-full mr-1 ${value ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            {key}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={saving || loadingRoles || !selectedRole || selectedRole === user.role}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Modifier le rôle
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}