// app/components/Others/AuthenticatedLayout.tsx
/**
 * Ce fichier définit le composant AuthenticatedLayout, qui sert de structure de base
 * pour les pages nécessitant une authentification de l'utilisateur. Il inclut une barre
 * de navigation latérale persistante et une barre supérieure affichant les informations
 * de l'utilisateur connecté avec un menu pour se déconnecter et un toggle de langue.
 * Le contenu de chaque page est injecté via la prop `children`.
 * 
 * VERSION OPTIMISÉE : Meilleure utilisation de l'espace sur les grands écrans
 * NOUVEAU : Ajout d'une image de thème saisonnier dans le header
 */

'use client';

import Navigation from './Navigation';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useThemeImage } from '../../hooks/useThemeImage';
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
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hook pour récupérer l'image de thème dynamique
  const { imageUrl: themeImageUrl, loading: themeLoading, error: themeError } = useThemeImage(user?.email);

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
        <div className="relative flex items-center justify-end px-6 py-2 border-b border-gray-200 bg-white">
          {/* Image de thème en arrière-plan - seulement si une image est disponible */}
          {themeImageUrl && !themeLoading && (
            <>
              <div 
                className="absolute left-0 top-0 bottom-0"
                style={{
                  right: '0px',
                  backgroundImage: `url(${themeImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'left center',
                  backgroundRepeat: 'no-repeat'
                }}
              ></div>
              
              {/* Dégradé de l'image vers le blanc - ajustements pour équilibre parfait */}
              <div 
                className="absolute left-0 top-0 bottom-0 right-0"
                style={{
                  background: 'linear-gradient(to right, transparent 0%, transparent 40%, rgba(255,255,255,0.8) 55%, white 70%)'
                }}
              ></div>
            </>
          )}
          
          {/* Debug info en développement (optionnel) */}
          {process.env.NODE_ENV === 'development' && themeError && (
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
              Erreur thème: {themeError}
            </div>
          )}
          
          {/* Menu utilisateur et contrôles - relatif pour être au-dessus */}
          <div className="relative flex items-center space-x-4">
            {/* Menu utilisateur */}
            <div className="relative" ref={menuRef}>
              {user && (
                <>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-2 py-1 transition-colors duration-200"
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
                        {t('common.logout')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Toggle de langue */}
            <LanguageToggle />
          </div>
        </div>
        {/* 
          Optimisation pour grands écrans :
          - Utilise plus d'espace horizontal disponible
          - Garde un padding raisonnable (2rem = 32px sur grands écrans)
          - Maintient la lisibilité et l'esthétique
        */}
        <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          {children}
        </div>
      </main>
    </div>
  );
}