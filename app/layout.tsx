// app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './contexts/AuthContext';
import { ClientProvider } from './contexts/ClientContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { SelectionProvider } from './contexts/SelectionContext';

export const metadata: Metadata = {
  title: 'MediaBox',
  description: 'Gestion des campagnes média',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <ClientProvider>
            <PermissionsProvider>
              <SelectionProvider>
                {children}
              </SelectionProvider>
            </PermissionsProvider>
          </ClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}