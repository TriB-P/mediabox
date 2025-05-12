'use client';

import { useAuth } from '../contexts/AuthContext';
import ClientDropdown from './ClientDropdown';

export default function Navigation() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Media Campaign Manager
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Dropdown client */}
            <ClientDropdown />

            {/* Menu utilisateur */}
            <div className="relative flex items-center space-x-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                  {user.displayName[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                {user.displayName}
              </span>
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
