/**
 * Ce fichier définit la page des partenaires.
 * Il utilise des fournisseurs de contexte et des composants d'agencement
 * pour afficher une liste filtrable et consultable de partenaires.
 */
'use client';

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { PartnerProvider } from '../contexts/PartnerContext';
import PartenairesFilter from '../components/Partenaires/PartenairesFilter';
import PartenairesGrid from '../components/Partenaires/PartenairesGrid';
import DrawerContainer from '../components/Partenaires/DrawerContainer';
import PartnersTitle from '../components/Partenaires/PartnersTitle';

/**
 * Composant de la page des partenaires.
 * Il enveloppe le contenu principal avec des protections de route et des mises en page authentifiées.
 *
 * @returns {JSX.Element} Le composant de la page des partenaires.
 */
export default function PartenairesPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <PartnerProvider>
          <div className="space-y-6">
            <PartnersTitle />
            <PartenairesFilter />
            <PartenairesGrid />
            <DrawerContainer />
          </div>
        </PartnerProvider>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}