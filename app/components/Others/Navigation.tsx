'use client';

import { useAuth } from '../../contexts/AuthContext';
import ClientDropdown from './ClientDropdown';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

// Import d'icônes
import { 
  LayoutDashboard, 
  LineChart, 
  Layers, 
  FileText, 
  FileCode, 
  DollarSign,
  Users,
  HelpCircle,
  Settings

} from 'lucide-react';

export default function Navigation() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navigationItems = [
    { name: 'Campagnes', href: '/campaigns', icon: LayoutDashboard },
    { name: 'Stratégie', href: '/strategy', icon: LineChart },
    { name: 'Tactiques', href: '/tactiques', icon: Layers },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Guide de coût', href: '/guide-de-cout', icon: DollarSign },
    { name: 'Partenaires', href: '/partenaires', icon: Users },
    { name: 'Client', href: '/client-config', icon: Settings },
    { name: 'Aide', href: '/aide', icon: HelpCircle }
  ];

  const isActive = (path: string) => {
    return pathname === path || 
           (path !== '/' && pathname.startsWith(path));
  };

  return (
    <div className="w-[210px] bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
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
        
        {/* Client selector */}
        <div className="mb-2">
          <ClientDropdown />
        </div>
      </div>
      
      {/* Navigation links */}
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
    </div>
  );
}