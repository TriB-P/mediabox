'use client';

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { PartnerProvider } from '../contexts/PartnerContext';
import PartenairesFilter from '../components/Partenaires/PartenairesFilter';
import PartenairesGrid from '../components/Partenaires/PartenairesGrid';
import DrawerContainer from '../components/Partenaires/DrawerContainer';

export default function PartenairesPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <PartnerProvider>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Partenaires</h1>
            </div>
            
            <PartenairesFilter />
            <PartenairesGrid />
            <DrawerContainer />
          </div>
        </PartnerProvider>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}