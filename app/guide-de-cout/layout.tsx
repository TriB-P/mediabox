/**
 * Ce fichier définit le layout principal pour les pages du guide des coûts.
 * Il assure que seules les utilisateurs authentifiés peuvent accéder à ces pages
 * et enveloppe le contenu dans un layout d'application standard.
 */
'use client';

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';

/**
 * Composant de layout pour le guide des coûts.
 *
 * @param {Object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Le contenu enfant à afficher dans le layout.
 * @returns {JSX.Element} Le layout avec les routes protégées et le layout authentifié.
 */
export default function CostGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </ProtectedRoute>
  );
}