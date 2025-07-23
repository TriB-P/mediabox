/**
 * @file Ce fichier définit la structure de layout pour toutes les pages de la section "Campaigns".
 * Il a pour rôle principal d'encadrer le contenu des pages de cette section avec une protection
 * pour s'assurer que seul un utilisateur authentifié peut y accéder, et d'appliquer une mise
 * en page cohérente pour les utilisateurs connectés.
 */

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';

/**
 * Composant de layout pour la section des campagnes.
 * Il enveloppe les pages enfants avec les composants ProtectedRoute et AuthenticatedLayout.
 * @param {object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Les composants enfants (le contenu de la page) à afficher à l'intérieur du layout.
 * @returns {JSX.Element} Le contenu de la page encapsulé dans les layouts de protection et d'authentification.
 */
export default function CampaignsLayout({
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