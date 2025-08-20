// app/admin/page.tsx
/**
 * Ce fichier définit le composant principal de la page d'administration.
 * Il gère l'affichage des différents onglets (Utilisateurs, Permissions)
 * et restreint l'accès aux utilisateurs ayant le rôle "admin".
 * La page utilise un layout à onglets pour naviguer entre les différentes sections de gestion.
 */

'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { usePermissions } from '../contexts/PermissionsContext';
import { useTranslation } from '../contexts/LanguageContext';
import { redirect } from 'next/navigation';
import Navigation from '../components/Others/Navigation';
import UsersTab from '../components/Admin/UsersTab';
import PermissionsTab from '../components/Admin/PermissionsTab';
import { Users, Shield } from 'lucide-react';

const ease = [0.25, 0.1, 0.25, 1] as const;

const pageContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const blockVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease,
    },
  },
};

const contentVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease,
    },
  },
};


const buttonVariants: Variants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

/**
 * Affiche la page d'administration avec des onglets pour gérer les utilisateurs et les permissions.
 * Ce composant vérifie les permissions de l'utilisateur actuel via le hook `usePermissions`
 * et le redirige vers la page des campagnes s'il n'a pas le rôle "admin".
 * Un écran de chargement est affiché pendant la récupération des permissions.
 * @returns {JSX.Element} Le rendu JSX de la page d'administration.
 */

export default function AdminPage() {
  const { userRole, loading } = usePermissions();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');

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
      name: t('admin.tabs.users'),
      icon: Users,
    },
    {
      id: 'permissions' as const,
      name: t('admin.tabs.permissions'),
      icon: Shield,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        variants={pageContainerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div 
          className="bg-white shadow-sm border-b border-gray-200"
          variants={blockVariants}
        >
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('admin.subtitle')}
            </p>
          </div>
          
          <div className="px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        <motion.div 
          className="flex-1 overflow-auto"
          variants={contentVariants}
        >
          <div className="p-6">
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'permissions' && <PermissionsTab />}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}