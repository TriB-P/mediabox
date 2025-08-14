/**
 * Ce fichier définit un composant de modal React utilisé pour créer ou modifier des rôles d'utilisateur.
 * Il affiche un formulaire avec le nom du rôle et une liste de permissions sous forme de cases à cocher.
 * Le composant gère son propre état pour les données du formulaire et l'état de sauvegarde.
 * Il communique avec son composant parent via des props pour l'ouverture, la fermeture et la sauvegarde des données.
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Role, RoleFormData } from '../../types/roles';
import { useTranslation } from '../../contexts/LanguageContext';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: RoleFormData) => Promise<void>;
  role?: Role | null;
}


/**
 * Affiche une modal permettant de créer ou de modifier un rôle et ses permissions associées.
 * @param {boolean} isOpen - Contrôle la visibilité de la modal.
 * @param {() => void} onClose - Fonction à appeler pour fermer la modal.
 * @param {(roleData: RoleFormData) => Promise<void>} onSave - Fonction asynchrone à appeler pour sauvegarder les données du rôle.
 * @param {Role | null} [role] - L'objet rôle à modifier. Si `null` ou `undefined`, la modal est en mode création.
 * @returns {JSX.Element | null} Le composant de la modal ou `null` si `isOpen` est faux.
 */
export default function RoleFormModal({ isOpen, onClose, onSave, role }: RoleFormModalProps) {
  const { t } = useTranslation();
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

  /**
   * Gère la soumission du formulaire. Valide le nom du rôle, appelle la fonction `onSave`
   * et gère l'état de chargement pendant la sauvegarde.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert(t('roleFormModal.alerts.nameRequired'));
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(t('roleFormModal.alerts.saveError'));
    } finally {
      setSaving(false);
    }
  };

  /**
   * Met à jour l'état du formulaire lorsqu'une case à cocher de permission est modifiée.
   * @param {keyof Omit<RoleFormData, 'name'>} permission - La clé de la permission à modifier.
   * @param {boolean} value - La nouvelle valeur (cochée ou non).
   */
  const handlePermissionChange = (permission: keyof Omit<RoleFormData, 'name'>, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [permission]: value
    }));
  };

  const permissions = [
    { key: 'Access' as const, label: t('roleFormModal.permissions.access') },
    { key: 'ClientInfo' as const, label: t('roleFormModal.permissions.clientInfo') },
    { key: 'CostGuide' as const, label: t('roleFormModal.permissions.costGuide') },
    { key: 'Currency' as const, label: t('roleFormModal.permissions.currency') },
    { key: 'CustomCodes' as const, label: t('roleFormModal.permissions.customCodes') },
    { key: 'Dimensions' as const, label: t('roleFormModal.permissions.dimensions') },
    { key: 'Fees' as const, label: t('roleFormModal.permissions.fees') },
    { key: 'Listes' as const, label: t('roleFormModal.permissions.lists') },
    { key: 'Taxonomy' as const, label: t('roleFormModal.permissions.taxonomy') },
    { key: 'Templates' as const, label: t('roleFormModal.permissions.templates') },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {role ? t('roleFormModal.title.edit') : t('roleFormModal.title.new')}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <label className="form-label">
                  {t('roleFormModal.labels.roleName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  placeholder={t('roleFormModal.placeholders.roleName')}
                  required
                />
              </div>

              <div>
                <label className="form-label mb-3">
                  {t('roleFormModal.labels.permissions')}
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

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('roleFormModal.buttons.saving')}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    {role ? t('common.edit') : t('common.create')}
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}