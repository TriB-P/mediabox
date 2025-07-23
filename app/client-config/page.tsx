/**
 * @file Ce fichier définit la page principale de configuration pour un client.
 * Il utilise un système d'onglets pour permettre à l'utilisateur de naviguer
 * entre différentes sections de configuration comme les informations générales,
 * la gestion des accès, les frais, les taxonomies, etc.
 * Chaque onglet affiche un composant dédié à une tâche de configuration spécifique.
 */

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
import ClientCustomCodes from '../components/Client/ClientCustomCodes';
import ClientTemplates from '../components/Client/ClientTemplates';


/**
 * Concatène des noms de classes CSS en filtrant les valeurs non valides.
 * Utile pour appliquer des classes conditionnelles dans React.
 * @param {...string} classes - Une liste de chaînes de caractères représentant les classes CSS.
 * @returns {string} Une chaîne de caractères unique contenant les classes valides, séparées par des espaces.
 */
function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Composant principal de la page de configuration du client.
 * Gère l'état de l'onglet actuellement sélectionné et affiche le composant correspondant.
 * La page est protégée et ne peut être accédée que par un utilisateur authentifié.
 * @returns {JSX.Element} Le rendu de la page de configuration avec ses onglets de navigation.
 */
export default function ClientConfigPage(): JSX.Element {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { name: 'Général', component: () => <ClientGeneral /> },
    { name: 'Accès', component: () => <ClientAccess /> },
    { name: 'Frais', component: () => <ClientFees /> },
    { name: 'Taxonomies', component: () => <ClientTaxonomies /> },
    { name: 'Gabarits', component: () => <ClientTemplates /> },
    { name: 'Listes', component: () => <ClientLists /> },
    { name: 'Dimensions', component: () => <ClientDimensions /> },
    { name: 'Codes personnalisés', component: () => <ClientCustomCodes /> },
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