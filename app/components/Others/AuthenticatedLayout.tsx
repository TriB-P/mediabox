/**
 * Ce fichier définit le composant AuthenticatedLayout, qui sert de structure de base
 * pour les pages nécessitant une authentification de l'utilisateur. Il inclut une barre
 * de navigation latérale persistante et une barre supérieure affichant les informations
 * de l'utilisateur connecté avec un menu pour se déconnecter. Le contenu de chaque
 * page est injecté via la prop `children`.
 */

'use client';

import Navigation from './Navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

/**
 * Crée une mise en page protégée pour les utilisateurs authentifiés.
 * @param {React.ReactNode} children - Les composants enfants à afficher dans la zone de contenu principal.
 * @returns {JSX.Element} Le composant de mise en page avec navigation et menu utilisateur.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Effet pour gérer la fermeture du menu utilisateur lorsqu'un clic est détecté
   * en dehors de celui-ci.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-end px-6 py-2 border-b border-gray-200 bg-white">
          <div className="ml-auto relative" ref={menuRef}>
            {user && (
              <>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2"
                >
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
                  <span className="text-sm font-medium">{user.displayName || user.email}</span>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <button
                      onClick={() => {
                        console.log("FIREBASE: ÉCRITURE - Fichier: AuthenticatedLayout.tsx - Fonction: onClick (Déconnexion) - Path: Firebase Authentication");
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}