'use client';

import { useState } from 'react';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import ClientFees from '../components/Client/ClientFees';
import ClientCurrencies from '../components/Client/ClientCurrencies';
import ClientTaxonomies from '../components/Taxonomy/ClientTaxonomies';
import ClientGeneral from '../components/Client/ClientGeneral';
import ClientDimensions from '../components/Client/ClientDimensions';
import ClientAccess from '../components/Client/ClientAccess';
import ClientLists from '../components/Client/ClientLists';


// Importez correctement tous les composants Tab
import * as TabPrimitive from '@headlessui/react';
const { Tab } = TabPrimitive;

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ClientConfigPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Liste complète des onglets
  const tabs = [
    { name: 'Général', component: () => <ClientGeneral /> },
    { name: 'Accès', component: () => <ClientAccess /> },
    { name: 'Frais', component: () => <ClientFees /> },
    { name: 'Taxonomies', component: () => <ClientTaxonomies /> },
    { name: 'Gabarits', component: () => <div>Contenu de la section "Templates" - À venir</div> },
    { name: 'Listes', component: () => <ClientLists /> },
    { name: 'Dimensions', component: () => <ClientDimensions /> },
    { name: 'Codes personalisés', component: () => <div>Contenu de la section "Code UTM personnalisé" - À venir</div> },
    { name: 'Devises', component: () => <ClientCurrencies /> },

  ];

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuration du client</h1>
          
          <div className="flex flex-wrap rounded-xl bg-gray-100 p-1 mb-6">
            {tabs.map((tab, index) => (
              <button
                key={tab.name}
                onClick={() => setSelectedTab(index)}
                className={classNames(
                  'flex-grow rounded-lg py-2.5 text-sm font-medium leading-5 min-w-[120px]',
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
            {tabs[selectedTab].component()}
          </div>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}