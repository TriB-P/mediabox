// app/components/Partenaires/PartenairesFilter.tsx

/**
 * Ce fichier définit le composant React `PartenairesFilter`.
 * Son rôle est de fournir une interface utilisateur permettant de filtrer une liste de partenaires.
 * Il inclut une barre de recherche textuelle et des boutons pour filtrer par type de partenaire.
 */
'use client';

import { Search, X } from 'lucide-react';

interface PartenairesFilterProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  activeTypes: {[key: string]: boolean};
  onToggleType: (type: string) => void;
}

/**
 * Affiche les contrôles de filtrage pour la liste des partenaires.
 * Ce composant permet à l'utilisateur de rechercher un partenaire par son nom
 * et de filtrer la liste en fonction de différents types.
 * @param {PartenairesFilterProps} props - Les propriétés reçues du parent
 * @returns {JSX.Element} Le composant JSX contenant la barre de recherche et les boutons de filtre.
 */
export default function PartenairesFilter({
  searchTerm,
  onSearchTermChange,
  activeTypes,
  onToggleType
}: PartenairesFilterProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          placeholder="Rechercher un partenaire..."
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
      
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 self-center mr-2">Filtrer par type:</span>
        {Object.keys(activeTypes).map(type => (
          <button
            key={type}
            onClick={() => onToggleType(type)}
            className={`px-3 py-1 text-sm rounded-full ${
              activeTypes[type] 
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}