import ProtectedRoute from '../components/ProtectedRoute';
import AuthenticatedLayout from '../components/AuthenticatedLayout';

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
