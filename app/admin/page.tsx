// app/admin/page.tsx

'use client';

import { useState } from 'react';
import { usePermissions } from '../contexts/PermissionsContext';
import { redirect } from 'next/navigation';
import Navigation from '../components/Others/Navigation';
import UsersTab from '../components/Admin/UsersTab';
import PermissionsTab from '../components/Admin/PermissionsTab';
import { Users, Shield } from 'lucide-react';

export default function AdminPage() {
  const { userRole, loading } = usePermissions();
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');

  // Rediriger si l'utilisateur n'est pas admin
  const isAdmin = userRole === 'admin';
  if (!loading && !isAdmin) {
    redirect('/campaigns');
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'users' as const,
      name: 'Utilisateurs',
      icon: Users,
    },
    {
      id: 'permissions' as const,
      name: 'Permissions',
      icon: Shield,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gérer les utilisateurs et les permissions
            </p>
          </div>
          
          {/* Tabs */}
          <div className="px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'permissions' && <PermissionsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}