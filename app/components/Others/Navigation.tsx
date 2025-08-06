// app/components/Others/Navigation.tsx
/**
 * @file Ce fichier contient le composant de la barre de navigation latérale de l'application.
 * @summary Ce composant affiche les liens de navigation principaux. Il s'adapte en fonction de l'utilisateur connecté et de ses permissions (par exemple, en affichant un lien "Admin" uniquement pour les administrateurs). Il gère également la mise en surbrillance du lien correspondant à la page actuellement consultée.
 */

'use client';

import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import ClientDropdown from './ClientDropdown';
import Version from './Version';
import CacheRefreshButton from './CacheRefreshButton';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

import { 
  LayoutDashboard, 
  LineChart, 
  Layers, 
  FileText, 
  DollarSign,
  Users,
  HelpCircle,
  Settings,
  ShieldPlus,
  Tag
} from 'lucide-react';

import { useTranslation } from '../../contexts/LanguageContext';


/**
 * @function Navigation
 * @summary Le composant principal pour la barre de navigation latérale.
 * @description Ce composant utilise les contextes d'authentification et de permissions pour récupérer les informations sur l'utilisateur et son rôle. Il construit ensuite une liste d'éléments de navigation et les affiche. Un lien "Admin" est ajouté dynamiquement si l'utilisateur est un administrateur. Le composant gère également l'état actif des liens pour la mise en style.
 * @returns {JSX.Element | null} Un élément JSX représentant la barre de navigation, ou `null` si aucun utilisateur n'est connecté.
 */
export default function Navigation() {
  const { user } = useAuth();
  const { userRole } = usePermissions();
  const pathname = usePathname();

  if (!user) return null;

  const isAdmin = userRole === 'admin';
  const { t } = useTranslation();


  const navigationItems = [
    { name: t('navigation.menus.campaigns'), href: '/campaigns', icon: LayoutDashboard },
    { name: t('navigation.menus.strategy'), href: '/strategy', icon: LineChart },
    { name: 'AdOps', href: '/adops', icon: Tag },
    { name: t('navigation.menus.tactics'), href: '/tactiques', icon: Layers },
    { name: t('navigation.menus.documents'), href: '/documents', icon: FileText },
    { name: t('navigation.menus.costGuide'), href: '/guide-de-cout', icon: DollarSign },
    { name: t('navigation.menus.partners'), href: '/partenaires', icon: Users },
    { name: t('navigation.menus.clientConfig'), href: '/client-config', icon: Settings },
    ...(isAdmin ? [{ name: t('navigation.menus.admin'), href: '/admin', icon: ShieldPlus }] : []),
    { name: t('navigation.menus.help'), href: '/aide', icon: HelpCircle }
  ];

  /**
   * @function isActive
   * @summary Détermine si un chemin de navigation doit être considéré comme actif.
   * @description Compare le chemin fourni avec le chemin actuel de l'URL. Un chemin est considéré comme actif si c'est une correspondance exacte, ou si le chemin actuel de l'URL commence par le chemin du lien (sauf pour la racine "/").
   * @param {string} path - Le chemin du lien de navigation à vérifier.
   * @returns {boolean} `true` si le lien est actif, sinon `false`.
   */
  const isActive = (path: string) => {
    return pathname === path || 
           (path !== '/' && pathname.startsWith(path));
  };

  return (
<div className="w-[210px] bg-white border-r border-gray-200 flex flex-col h-full pb-10">
<div className="p-4 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 flex items-center justify-center rounded overflow-hidden mr-2">
              <Image
                src="/MediaBox_Logo.png"  
                alt="MediaBox Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="font-medium text-gray-900">MediaBox</span>
          </div>
          
          <div className="mb-2">
            <ClientDropdown />
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto pt-2">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm ${
                      isActive(item.href)
                        ? 'text-indigo-700 bg-indigo-50 font-medium border-l-4 border-indigo-500 pl-3'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${isActive(item.href) ? 'text-indigo-500' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Composant Version */}

        <CacheRefreshButton />

        <Version />


      </div>
  );
}