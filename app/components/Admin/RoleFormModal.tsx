// app/components/Admin/RoleFormModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Role, RoleFormData } from '../../types/roles';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: RoleFormData) => Promise<void>;
  role?: Role | null;
}

export default function RoleFormModal({ isOpen, onClose, onSave, role }: RoleFormModalProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    Access: false,
    ClientInfo: false,
    CostGuide: false,
    Currency: false,
    CustomCodes: false,
    Dimensions: false,
    Fees: false,
    Listes: false,
    Taxonomy: false,
    Templates: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role) {
      // Mode édition
      setFormData({
        name: role.name,
        Access: role.Access,
        ClientInfo: role.ClientInfo,
        CostGuide: role.CostGuide,
        Currency: role.Currency,
        CustomCodes: role.CustomCodes,
        Dimensions: role.Dimensions,
        Fees: role.Fees,
        Listes: role.Listes,
        Taxonomy: role.Taxonomy,
        Templates: role.Templates,
      });
    } else {
      // Mode création - réinitialiser le formulaire
      setFormData({
        name: '',
        Access: false,
        ClientInfo: false,
        CostGuide: false,
        Currency: false,
        CustomCodes: false,
        Dimensions: false,
        Fees: false,
        Listes: false,
        Taxonomy: false,
        Templates: false,
      });
    }
  }, [role, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Le nom du rôle est requis');
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du rôle');
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionChange = (permission: keyof Omit<RoleFormData, 'name'>, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [permission]: value
    }));
  };

  const permissions = [
    { key: 'Access' as const, label: 'Accès' },
    { key: 'ClientInfo' as const, label: 'Informations Client' },
    { key: 'CostGuide' as const, label: 'Guide de Coût' },
    { key: 'Currency' as const, label: 'Devises' },
    { key: 'CustomCodes' as const, label: 'Codes Personnalisés' },
    { key: 'Dimensions' as const, label: 'Dimensions' },
    { key: 'Fees' as const, label: 'Frais' },
    { key: 'Listes' as const, label: 'Listes' },
    { key: 'Taxonomy' as const, label: 'Taxonomie' },
    { key: 'Templates' as const, label: 'Gabarits' },
  ];

  if (!isOpen) return null;

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
                  {role ? 'Modifier le rôle' : 'Nouveau rôle'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Nom du rôle */}
              <div className="mb-6">
                <label className="form-label">
                  Nom du rôle *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  placeholder="Entrez le nom du rôle"
                  required
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="form-label mb-3">
                  Permissions
                </label>
                <div className="space-y-3">
                  {permissions.map(permission => (
                    <div key={permission.key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`permission-${permission.key}`}
                        checked={formData[permission.key]}
                        onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`permission-${permission.key}`}
                        className="ml-3 text-sm text-gray-700 cursor-pointer"
                      >
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={saving}
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
                    {role ? 'Modifier' : 'Créer'}
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