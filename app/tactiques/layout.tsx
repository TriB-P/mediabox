/**
 * Ce fichier définit le layout principal pour la section "Tactiques" de l'application.
 * Il assure que l'utilisateur est authentifié et protégé via des routes spécifiques,
 * et enveloppe les composants enfants avec le contexte du partenaire.
 */
'use client';

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { PartnerProvider } from '../contexts/PartnerContext';

/**
 * Composant de layout pour la section des tactiques.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Les éléments enfants à rendre dans ce layout.
 * @returns {JSX.Element} Le layout avec les protections de route, le layout authentifié et le fournisseur de contexte partenaire.
 */
export default function TactiquesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <PartnerProvider>
          {children}
        </PartnerProvider>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}