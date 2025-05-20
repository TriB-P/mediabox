'use client';

import { useState } from 'react';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import ClientFees from '../components/Client/ClientFees';

// Importez correctement tous les composants Tab
import * as TabPrimitive from '@headlessui/react';
const { Tab } = TabPrimitive;

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ClientConfigPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Liste des onglets sans les composants pré-rendus
  const tabs = [
    { name: 'Frais' },
    { name: 'Dimensions' },
    { name: 'Accès' }
  ];

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuration du client</h1>
          
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {tabs.map((tab, index) => (
              <button
                key={tab.name}
                onClick={() => setSelectedTab(index)}
                className={classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2',
                  selectedTab === index
                    ? 'bg-white shadow text-indigo-700'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-700'
                )}
              >
                {tab.name}
              </button>
            ))}
          </div>
          
          <div className="rounded-xl focus:outline-none">
            {selectedTab === 0 && <ClientFees />}
            {selectedTab === 1 && <div>Contenu de la section "Dimensions" - À venir</div>}
            {selectedTab === 2 && <div>Contenu de la section "Accès" - À venir</div>}
          </div>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}