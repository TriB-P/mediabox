/**
 * @file Ce fichier définit le composant ProtectedRoute.
 * Son rôle est d'envelopper des pages ou des composants pour s'assurer
 * que seul un utilisateur authentifié peut y accéder. Si l'utilisateur
 * n'est pas connecté, il est automatiquement redirigé vers la page de connexion.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';


/**
 * Protège une route en vérifiant l'état d'authentification de l'utilisateur.
 * Affiche un message de chargement pendant la vérification, redirige les
 * utilisateurs non connectés, et affiche le contenu pour les utilisateurs connectés.
 * @param {object} props - Les props du composant.
 * @param {React.ReactNode} props.children - Les composants enfants à afficher si l'utilisateur est authentifié.
 * @returns {React.ReactNode | null} Le contenu protégé, un indicateur de chargement, ou null.
 */
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t('common.loading')}
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}