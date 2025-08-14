// app/components/Partenaires/PartenairesFilter.tsx

/**
 * Ce fichier définit le composant React `PartenairesFilter`.
 * Son rôle est de fournir une interface utilisateur permettant de filtrer une liste de partenaires.
 * Il inclut une barre de recherche textuelle et des boutons pour filtrer par type de partenaire.
 * VERSION 2024.1 : Support des types de partenaires traduits selon la langue de l'interface.
 */
'use client';

import { Search, X } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

interface PartenairesFilterProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  activeTypeFilters: {
    [translatedType: string]: { englishType: string; active: boolean }
  };
  onToggleType: (translatedType: string) => void;
}

/**
 * Affiche les contrôles de filtrage pour la liste des partenaires.
 * Ce composant permet à l'utilisateur de rechercher un partenaire par son nom
 * et de filtrer la liste en fonction de différents types (affichés dans la langue de l'interface).
 * @param {PartenairesFilterProps} props - Les propriétés reçues du parent
 * @returns {JSX.Element} Le composant JSX contenant la barre de recherche et les boutons de filtre.
 */
export default function PartenairesFilter({
  searchTerm,
  onSearchTermChange,
  activeTypeFilters,
  onToggleType
}: PartenairesFilterProps) {
  const { t } = useTranslation();

  // Trier les types traduits par ordre alphabétique pour un affichage cohérent
  const sortedTranslatedTypes = Object.keys(activeTypeFilters).sort((a, b) => 
    a.localeCompare(b, 'fr', { sensitivity: 'base' })
  );

  return (
    <div className="mb-6 space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          placeholder={t('partnersFilter.search.placeholder')}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
        
        {searchTerm && (
          <button 
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            onClick={() => onSearchTermChange('')}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {sortedTranslatedTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center mr-2">
            {t('partnersFilter.filter.label')}
          </span>
          {sortedTranslatedTypes.map(translatedType => (
            <button
              key={translatedType}
              onClick={() => onToggleType(translatedType)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                activeTypeFilters[translatedType].active 
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-medium' 
                  : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
              }`}
              title={`${translatedType} (${activeTypeFilters[translatedType].englishType})`}
            >
              {translatedType}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}