'use client';

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { PartnerProvider } from '../contexts/PartnerContext';
import PartenairesFilter from '../components/Partenaires/PartenairesFilter';
import PartenairesGrid from '../components/Partenaires/PartenairesGrid';
import DrawerContainer from '../components/Partenaires/DrawerContainer';
import PartnersTitle from '../components/Partenaires/PartnersTitle';

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