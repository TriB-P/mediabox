// Chemin du fichier : app/aide/layout.tsx
'use client';

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';

export default function AideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Ces composants enveloppent votre page pour la protéger et lui donner le menu
    <ProtectedRoute>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </ProtectedRoute>
  );
}