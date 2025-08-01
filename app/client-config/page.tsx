/**
 * @file This file defines the main configuration page for a client.
 * It uses a tab system to allow the user to navigate
 * between different configuration sections such as general information,
 * access management, fees, taxonomies, etc.
 * Each tab displays a component dedicated to a specific configuration task.
 */

'use client';

import { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import ClientFees from '../components/Client/ClientFees';
import ClientCurrencies from '../components/Client/ClientCurrencies';
import ClientTaxonomies from '../components/Taxonomy/ClientTaxonomies';
import ClientGeneral from '../components/Client/ClientGeneral';
import ClientDimensions from '../components/Client/ClientDimensions';
import ClientAccess from '../components/Client/ClientAccess';
import ClientLists from '../components/Client/ClientLists';
import ClientCustomCodes from '../components/Client/ClientCustomCodes';
import ClientTemplates from '../components/Client/ClientTemplates';


/**
 * Concatenates CSS class names, filtering out invalid values.
 * Useful for applying conditional classes in React.
 * @param {...string} classes - A list of strings representing CSS classes.
 * @returns {string} A single string containing the valid classes, separated by spaces.
 */
function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Main component for the client configuration page.
 * Manages the state of the currently selected tab and displays the corresponding component.
 * The page is protected and can only be accessed by an authenticated user.
 * @returns {JSX.Element} The rendered configuration page with its navigation tabs.
 */
export default function ClientConfigPage(): JSX.Element {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { name: t('clientConfig.tabs.general'), component: () => <ClientGeneral /> },
    { name: t('clientConfig.tabs.access'), component: () => <ClientAccess /> },
    { name: t('clientConfig.tabs.fees'), component: () => <ClientFees /> },
    { name: t('clientConfig.tabs.taxonomies'), component: () => <ClientTaxonomies /> },
    { name: t('clientConfig.tabs.templates'), component: () => <ClientTemplates /> },
    { name: t('clientConfig.tabs.lists'), component: () => <ClientLists /> },
    { name: t('clientConfig.tabs.dimensions'), component: () => <ClientDimensions /> },
    { name: t('clientConfig.tabs.customCodes'), component: () => <ClientCustomCodes /> },
    { name: t('clientConfig.tabs.currencies'), component: () => <ClientCurrencies /> },
  ];

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('clientConfig.header.title')}</h1>

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