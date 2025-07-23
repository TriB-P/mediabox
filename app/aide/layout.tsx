/**
 * Ce fichier définit la structure de layout pour la section "Aide" de l'application.
 * Il s'assure que seul un utilisateur authentifié peut accéder à cette section
 * et applique une mise en page cohérente avec le reste des pages connectées.
 */

'use client';

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';


/**
 * Le composant AideLayout est un layout qui enveloppe le contenu des pages de la section d'aide.
 * @param {object} props - Les propriétés passées au composant.
 * @param {React.ReactNode} props.children - Les composants enfants à afficher à l'intérieur du layout.
 * @returns {JSX.Element} Un composant qui protège la route et applique le layout authentifié.
 */
export default function AideLayout({
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