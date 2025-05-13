'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import { PartnerProvider } from '../contexts/PartnerContext';
import PartenairesFilter from '../components/PartenairesFilter';
import PartenairesGrid from '../components/PartenairesGrid';
import DrawerContainer from '../components/DrawerContainer';

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