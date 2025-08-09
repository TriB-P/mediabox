// app/components/AdOps/AdOpsDropdowns.tsx
/**
 * Composant AdOpsDropdowns
 * Ce composant affiche un dropdown multi-sélection pour filtrer les publishers
 * des tactiques AdOps ayant des placements avec PL_Tag_Type non vide.
 * MODIFIÉ : Reçoit les données via props au lieu d'utiliser directement le hook
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  CheckIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Publisher {
  id: string;
  name: string;
  tactiqueCount: number;
  isSelected: boolean;
}

interface AdOpsDropdownsProps {
  publishers: Publisher[];
  loading: boolean;
  error: string | null;
  togglePublisher: (publisherId: string) => void;
  selectAllPublishers: () => void;
  deselectAllPublishers: () => void;
  selectedPublishers: string[];
}

/**
 * Composant principal pour les listes déroulantes AdOps.
 * Affiche un dropdown de sélection multiple pour les publishers avec recherche.
 *
 * @param {AdOpsDropdownsProps} props - Les propriétés du composant
 * @returns {JSX.Element} Le composant AdOpsDropdowns
 */
export default function AdOpsDropdowns({ 
  publishers,
  loading,
  error,
  togglePublisher,
  selectAllPublishers,
  deselectAllPublishers,
  selectedPublishers
}: AdOpsDropdownsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Filtre les publishers selon le terme de recherche
   */
  const filteredPublishers = publishers.filter(publisher =>
    publisher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Ferme le dropdown si on clique à l'extérieur
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Focus automatique sur l'input de recherche quand le dropdown s'ouvre
   */
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      // Petit délai pour s'assurer que le dropdown est rendu
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isDropdownOpen]);

  /**
   * Toggle l'ouverture/fermeture du dropdown
   */
  const toggleDropdown = () => {
    if (isDropdownOpen) {
      // Nettoyer la recherche quand on ferme
      setSearchTerm('');
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  /**
   * Gère la sélection/désélection de tous les publishers (filtrés)
   */
  const handleSelectAll = () => {
    const filteredSelected = filteredPublishers.filter(pub => pub.isSelected);
    const allFilteredSelected = filteredSelected.length === filteredPublishers.length;
    
    if (allFilteredSelected) {
      // Désélectionner tous les publishers filtrés
      filteredPublishers.forEach(pub => {
        if (pub.isSelected) {
          togglePublisher(pub.id);
        }
      });
    } else {
      // Sélectionner tous les publishers filtrés
      filteredPublishers.forEach(pub => {
        if (!pub.isSelected) {
          togglePublisher(pub.id);
        }
      });
    }
  };

  /**
   * Vérifie si tous les publishers filtrés sont sélectionnés
   */
  const areAllFilteredSelected = () => {
    if (filteredPublishers.length === 0) return false;
    return filteredPublishers.every(pub => pub.isSelected);
  };

  /**
   * Formate le texte du bouton principal
   */
  const getButtonText = () => {
    if (loading) return 'Chargement...';
    if (publishers.length === 0) return 'Aucun publisher';
    
    const selectedCount = publishers.filter(pub => pub.isSelected).length;
    if (selectedCount === 0) return 'Sélectionner des publishers';
    if (selectedCount === publishers.length) return 'Tous les publishers';
    return `${selectedCount} publisher${selectedCount > 1 ? 's' : ''} sélectionné${selectedCount > 1 ? 's' : ''}`;
  };

  /**
   * Gère les clics sur l'input de recherche (empêche la fermeture du dropdown)
   */
  const handleSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  /**
   * Gère les changements dans l'input de recherche
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Publishers
        </h3>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Publishers
      </h3>
      
      {/* Dropdown Publishers */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner les publishers
        </label>
        
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={publishers.length === 0}
          className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            publishers.length === 0 ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          <span className="truncate">{getButtonText()}</span>
          <ChevronDownIcon className={`w-5 h-5 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Menu déroulant */}
        {isDropdownOpen && publishers.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
            
            {/* Barre de recherche */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onClick={handleSearchClick}
                  placeholder="Rechercher un publisher..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* En-tête avec actions globales */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <button
                onClick={handleSelectAll}
                className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                <div className={`w-4 h-4 mr-2 border border-gray-300 rounded flex items-center justify-center ${
                  areAllFilteredSelected() ? 'bg-indigo-600 border-indigo-600' : ''
                }`}>
                  {areAllFilteredSelected() && (
                    <CheckIcon className="w-3 h-3 text-white" />
                  )}
                </div>
                {areAllFilteredSelected() ? 'Désélectionner' : 'Sélectionner'} {filteredPublishers.length > 0 ? 'les résultats' : 'tout'}
              </button>
              
              {/* Compteur de résultats */}
              {searchTerm && (
                <div className="mt-1 text-xs text-gray-500">
                  {filteredPublishers.length} résultat{filteredPublishers.length !== 1 ? 's' : ''} trouvé{filteredPublishers.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Liste des publishers filtrés */}
            <div className="py-1 max-h-48 overflow-y-auto">
              {filteredPublishers.length > 0 ? (
                filteredPublishers.map((publisher) => (
                  <div
                    key={publisher.id}
                    onClick={() => togglePublisher(publisher.id)}
                    className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={`w-4 h-4 mr-3 border border-gray-300 rounded flex-shrink-0 flex items-center justify-center ${
                        publisher.isSelected ? 'bg-indigo-600 border-indigo-600' : ''
                      }`}>
                        {publisher.isSelected && (
                          <CheckIcon className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="truncate">{publisher.name}</span>
                    </div>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                      {publisher.tactiqueCount}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  Aucun publisher trouvé pour "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}