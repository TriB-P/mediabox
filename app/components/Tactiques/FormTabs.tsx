'use client';

import React from 'react';

export interface FormTab {
  id: string;
  name: string;
  icon?: React.ElementType;
}

interface FormTabsProps {
  tabs: FormTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function FormTabs({
  tabs,
  activeTab,
  onTabChange
}: FormTabsProps) {
  // Fonction pour gérer le clic sur un onglet
  const handleTabClick = (e: React.MouseEvent, tabId: string) => {
    // Empêcher la propagation de l'événement
    e.preventDefault();
    e.stopPropagation();
    
    // Changer d'onglet
    onTabChange(tabId);
  };

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-4 px-4 sm:px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={(e) => handleTabClick(e, tab.id)}
              className={`
                flex items-center whitespace-nowrap py-4 px-1 text-sm font-medium
                ${isActive
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
              `}
              aria-current={isActive ? 'page' : undefined}
              type="button" // Ajout explicite du type pour éviter la soumission du formulaire
            >
              {Icon && <Icon className="mr-2 h-5 w-5 flex-shrink-0" aria-hidden="true" />}
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
}