/**
 * Ce fichier définit le composant de la modale d'invitation.
 * Cette modale permet à un administrateur de saisir l'adresse e-mail et de sélectionner un rôle
 * pour un nouvel utilisateur à inviter dans l'application.
 */


'use client';

import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { InvitationFormData } from '../../types/invitations';
import { getRoles } from '../../lib/roleService';
import { Role } from '../../types/roles';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (invitationData: InvitationFormData) => Promise<void>;
}

/**
 * Affiche une modale pour envoyer une invitation à un nouvel utilisateur.
 * @param {boolean} isOpen - Indique si la modale est ouverte ou fermée.
 * @param {() => void} onClose - Fonction à appeler pour fermer la modale.
 * @param {(invitationData: InvitationFormData) => Promise<void>} onSend - Fonction asynchrone à appeler pour envoyer les données d'invitation.
 * @returns {JSX.Element | null} Le composant de la modale ou null si elle n'est pas ouverte.
 */
export default function InvitationModal({ isOpen, onClose, onSend }: InvitationModalProps) {
  const [formData, setFormData] = useState<InvitationFormData>({
    email: '',
    role: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadRoles();
      setFormData({
        email: '',
        role: ''
      });
    }
  }, [isOpen]);

  /**
   * Charge la liste des rôles disponibles depuis la base de données
   * pour les afficher dans le menu déroulant.
   * @returns {Promise<void>}
   */
  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      console.log("FIREBASE: [LECTURE] - Fichier: app/components/Admin/InvitationModal.tsx - Fonction: loadRoles - Path: roles");
      const rolesData = await getRoles();
      setRoles(rolesData);
      
      if (rolesData.length > 0) {
        const defaultRole = rolesData.find(role => role.name.toLowerCase() === 'user') || rolesData[0];
        setFormData(prev => ({ ...prev, role: defaultRole.id }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  /**
   * Gère la soumission du formulaire d'invitation.
   * Valide les données saisies, appelle la fonction onSend pour traiter l'envoi,
   * et gère les états de chargement et les erreurs.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      alert('L\'adresse email est requise');
      return;
    }
    
    if (!formData.role) {
      alert('Le rôle est requis');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Veuillez entrer une adresse email valide');
      return;
    }

    try {
      setSending(true);
      console.log("FIREBASE: [ÉCRITURE] - Fichier: app/components/Admin/InvitationModal.tsx - Fonction: handleSubmit - Path: invitations");
      await onSend(formData);
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', error);
      alert(error.message || 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setSending(false);
    }
  };

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
                  Inviter un utilisateur
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">
                    Adresse email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="form-input"
                    placeholder="utilisateur@exemple.com"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    L'utilisateur recevra un accès lors de sa première connexion
                  </p>
                </div>

                <div>
                  <label className="form-label">
                    Rôle *
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
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
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
                  {!loadingRoles && roles.length > 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      Ce rôle déterminera les permissions de l'utilisateur
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  💡 L'invitation expirera automatiquement dans 7 jours si l'utilisateur ne se connecte pas.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={sending || loadingRoles}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {sending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer l'invitation
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