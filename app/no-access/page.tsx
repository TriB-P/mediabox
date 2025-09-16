// app/no-access/page.tsx
/**
 * Page d'erreur affichée lorsqu'un utilisateur authentifié n'a accès à aucun client.
 * Version simplifiée et autonome qui ne dépend pas des contextes complexes.
 * VERSION MISE À JOUR : Utilise Heroicons au lieu de SVG personnalisés.
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { ExclamationTriangleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function NoAccessPage() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  // Rediriger vers login si pas d'utilisateur connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading... / Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Sera redirigé vers login
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header simple sans dépendances */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MediaBox</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Informations utilisateur */}
              <div className="flex items-center space-x-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Profile"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                    {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user.displayName || user.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full text-center">
          {/* Icône d'accès interdit avec Heroicons */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-8">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
          </div>

          {/* Titre en anglais */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          
          {/* Titre en français */}
          <h3 className="text-2xl font-semibold text-gray-700 mb-8">
            Accès non autorisé
          </h3>

          {/* Message en anglais */}
          <div className="bg-white rounded-lg p-6 mb-4 shadow-sm border border-gray-200">
            <p className="text-lg text-gray-700 mb-4">
              You currently have no access to any client in MediaBox.
            </p>
            <p className="text-sm text-gray-600">
              Contact the MediaBox team to request access:
            </p>
          </div>

          {/* Message en français */}
          <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-gray-200">
            <p className="text-lg text-gray-700 mb-4">
              Vous n'avez actuellement accès à aucun client dans MediaBox.
            </p>
            <p className="text-sm text-gray-600">
              Contactez l'équipe MediaBox pour faire une demande d'accès :
            </p>
          </div>

          {/* Email de contact avec Heroicons */}
          <div className="mb-8">
            <a
              href="mailto:mediabox@pluscompany.com"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-lg"
            >
              <EnvelopeIcon className="w-5 h-5 mr-2" />
              mediabox@pluscompany.com
            </a>
          </div>

          {/* Bouton de déconnexion */}
          <button
            onClick={handleSignOut}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Sign Out / Se déconnecter
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            MediaBox - Plus Company
          </p>
        </div>
      </div>
    </div>
  );
}