'use client';

import FirestoreExplorer from '../components/FirestoreExplorer';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import ProtectedRoute from '../components/ProtectedRoute';

export default function DebugPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Débogage Firestore
              </h2>
              <p className="text-gray-600">
                Explorateur de structure pour résoudre les problèmes de listes
              </p>
            </div>
          </div>

          <FirestoreExplorer />
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
