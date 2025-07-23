/**
 * Ce fichier est le layout racine de l'application Next.js.
 * Il définit la structure globale de chaque page et enveloppe l'application avec les fournisseurs de contexte nécessaires.
 * Ces fournisseurs (AuthContext, ClientContext, PermissionsContext, SelectionContext)
 * rendent les données d'authentification, les informations client, les permissions et les sélections disponibles
 * à tous les composants enfants de l'application.
 */
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

/**
 * Composant RootLayout.
 * Il sert de mise en page principale pour toutes les pages de l'application.
 * Il inclut la balise HTML, le corps et les différents fournisseurs de contexte.
 * @param {object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Les éléments enfants à rendre à l'intérieur du layout.
 * @returns {JSX.Element} L'élément JSX du layout racine.
 */
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