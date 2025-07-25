// app/tactiques/layout.tsx

/**
 * Ce fichier définit le layout principal pour la section "Tactiques" de l'application.
 * Il assure que l'utilisateur est authentifié et protégé via des routes spécifiques.
 * 
 * VERSION 2024 : PartnerProvider supprimé car TC_Publisher utilise maintenant le cache localStorage
 */
'use client';

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';

/**
 * Composant de layout pour la section des tactiques.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Les éléments enfants à rendre dans ce layout.
 * @returns {JSX.Element} Le layout avec les protections de route et le layout authentifié.
 */
export default function TactiquesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        {children}
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}