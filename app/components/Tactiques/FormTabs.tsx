// app/components/Tactiques/FormTabs.tsx

/**
 * Ce fichier définit un composant React "FormTabs" amélioré avec navigation par flèches et comportement sticky.
 * Il permet d'afficher une série d'onglets cliquables avec navigation séquentielle.
 * NOUVELLES FONCTIONNALITÉS :
 * - Flèches de navigation pour passer à l'onglet précédent/suivant
 * - Barre d'onglets sticky au défilement
 * - Désactivation intelligente des flèches aux extrêmes
 * - Icônes et gestion de l'onglet actif conservées
 */
'use client';

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

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
 * Composant FormTabs amélioré pour afficher des onglets de navigation avec flèches.
 * @param {FormTabsProps} props - Les props du composant.
 * @param {FormTab[]} props.tabs - Un tableau d'objets FormTab représentant les onglets à afficher.
 * @param {string} props.activeTab - L'identifiant de l'onglet actuellement actif.
 * @param {(tabId: string) => void} props.onTabChange - Une fonction de rappel appelée lorsque l'onglet actif change.
 * @returns {JSX.Element} Le composant FormTabs amélioré.
 */
export default function FormTabs({
  tabs,
  activeTab,
  onTabChange
}: FormTabsProps) {
  const { t } = useTranslation();

  /**
   * Trouve l'index de l'onglet actuellement actif
   * @returns {number} L'index de l'onglet actif
   */
  const getCurrentTabIndex = (): number => {
    return tabs.findIndex(tab => tab.id === activeTab);
  };

  /**
   * Navigue vers l'onglet précédent
   */
  const goToPreviousTab = () => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex > 0) {
      onTabChange(tabs[currentIndex - 1].id);
    }
  };

  /**
   * Navigue vers l'onglet suivant
   */
  const goToNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex < tabs.length - 1) {
      onTabChange(tabs[currentIndex + 1].id);
    }
  };

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

  /**
   * Gère l'événement de clic sur les flèches de navigation.
   * @param {React.MouseEvent} e - L'événement de souris.
   * @param {() => void} navigationFunction - La fonction de navigation à exécuter.
   * @returns {void}
   */
  const handleArrowClick = (e: React.MouseEvent, navigationFunction: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    navigationFunction();
  };

  const currentIndex = getCurrentTabIndex();
  const isFirstTab = currentIndex === 0;
  const isLastTab = currentIndex === tabs.length - 1;

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <nav className="flex items-center justify-between px-4 sm:px-6" aria-label={t('common.tab')}>
        {/* Zone des onglets - flex-1 pour prendre l'espace disponible */}
        <div className="flex space-x-4 flex-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={(e) => handleTabClick(e, tab.id)}
                className={`
                  flex items-center whitespace-nowrap py-4 px-1 text-sm font-medium transition-colors
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
        </div>

        {/* Zone des flèches de navigation - positionnée à droite */}
        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
          {/* Flèche précédent */}
          <button
            type="button"
            onClick={(e) => handleArrowClick(e, goToPreviousTab)}
            disabled={isFirstTab}
            className={`
              p-2 rounded-lg transition-colors
              ${isFirstTab 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }
            `}
            title={t('common.previousTab')}
            aria-label={t('common.previousTab')}
          >
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Indicateur de position */}
          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
            {currentIndex + 1} / {tabs.length}
          </span>

          {/* Flèche suivant */}
          <button
            type="button"
            onClick={(e) => handleArrowClick(e, goToNextTab)}
            disabled={isLastTab}
            className={`
              p-2 rounded-lg transition-colors
              ${isLastTab 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }
            `}
            title={t('common.nextTab')}
            aria-label={t('common.nextTab')}
          >
            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </div>
  );
}