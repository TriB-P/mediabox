/**
 * Ce fichier définit un composant React "FormTabs" qui permet d'afficher une série d'onglets cliquables.
 * Il est utile pour naviguer entre différentes sections d'un formulaire ou d'une interface.
 * Le composant prend en charge l'affichage d'icônes et la gestion de l'onglet actif.
 */
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

/**
 * Composant FormTabs pour afficher des onglets de navigation.
 * @param {FormTabsProps} props - Les props du composant.
 * @param {FormTab[]} props.tabs - Un tableau d'objets FormTab représentant les onglets à afficher.
 * @param {string} props.activeTab - L'identifiant de l'onglet actuellement actif.
 * @param {(tabId: string) => void} props.onTabChange - Une fonction de rappel appelée lorsque l'onglet actif change.
 * @returns {JSX.Element} Le composant FormTabs.
 */
export default function FormTabs({
  tabs,
  activeTab,
  onTabChange
}: FormTabsProps) {
  /**
   * Gère l'événement de clic sur un onglet.
   * @param {React.MouseEvent} e - L'événement de souris.
   * @param {string} tabId - L'identifiant de l'onglet cliqué.
   * @returns {void}
   */
  const handleTabClick = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
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
              type="button"
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