// app/partenaires/page.tsx

/**
 * Ce fichier définit la page des partenaires.
 * VERSION 2024 : Utilise le PartenairesPageManager qui gère tout via le cache localStorage 
 * au lieu du PartnerProvider supprimé qui faisait des appels Firebase coûteux.
 */
'use client';

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import PartenairesPageManager from '../components/Partenaires/PartenairesPageManager';

/**
 * Composant de la page des partenaires.
 * Il enveloppe le contenu principal avec des protections de route et des mises en page authentifiées.
 * VERSION 2024 : Utilise le nouveau PartenairesPageManager qui exploite le cache localStorage.
 *
 * @returns {JSX.Element} Le composant de la page des partenaires.
 */
export default function PartenairesPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <PartenairesPageManager />
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}