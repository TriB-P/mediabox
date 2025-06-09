// app/aide/layout.tsx

'use client';

import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';

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