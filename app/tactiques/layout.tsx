'use client';

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { PartnerProvider } from '../contexts/PartnerContext';

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