// app/components/AdOps/AdOpsDropdowns.tsx
/**
 * Composant AdOpsDropdowns
 * Ce composant affiche deux dropdowns multi-sélection en cascade :
 * 1. Publishers pour filtrer les tactiques
 * 2. Tactiques filtrées selon les publishers sélectionnés
 * MODIFIÉ : Ajout dropdown tactiques en cascade avec publishers
 * AMÉLIORÉ : Sans fond blanc individuel, s'intègre dans un conteneur parent
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  CheckIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

interface Publisher {
  id: string;
  name: string;
  tactiqueCount: number;
  isSelected: boolean;
}

// NOUVEAU : Interface pour les tactiques
interface TactiqueOption {
  id: string;
  label: string;
  publisherId: string;
  isSelected: boolean;
}

interface AdOpsDropdownsProps {
  publishers: Publisher[];
  // NOUVEAU : Props pour les tactiques
  tactiqueOptions: TactiqueOption[];
  selectedPublishers: string[];
  selectedTactiques: string[];
  loading: boolean;
  error: string | null;
  // Fonctions publishers
  togglePublisher: (publisherId: string) => void;
  selectAllPublishers: () => void;
  deselectAllPublishers: () => void;
  // NOUVEAU : Fonctions tactiques
  toggleTactique: (tactiqueId: string) => void;
  selectAllTactiques: () => void;
  deselectAllTactiques: () => void;
}

/**
 * Composant principal pour les listes déroulantes AdOps.
 * Affiche deux dropdowns en cascade : Publishers → Tactiques
 */
export default function AdOpsDropdowns({ 
  publishers,
  tactiqueOptions,
  selectedPublishers,
  selectedTactiques,
  loading,
  error,
  togglePublisher,
  selectAllPublishers,
  deselectAllPublishers,
  toggleTactique,
  selectAllTactiques,
  deselectAllTactiques
}: AdOpsDropdownsProps) {
  const { t } = useTranslation();
  
  // États pour les dropdowns
  const [isPublisherDropdownOpen, setIsPublisherDropdownOpen] = useState(false);
  const [isTactiqueDropdownOpen, setIsTactiqueDropdownOpen] = useState(false);
  const [publisherSearchTerm, setPublisherSearchTerm] = useState('');
  const [tactiqueSearchTerm, setTactiqueSearchTerm] = useState('');
  
  // Refs pour gérer les clics extérieurs
  const publisherDropdownRef = useRef<HTMLDivElement>(null);
  const tactiqueDropdownRef = useRef<HTMLDivElement>(null);
  const publisherSearchInputRef = useRef<HTMLInputElement>(null);
  const tactiqueSearchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Filtre les publishers selon le terme de recherche
   */
  const filteredPublishers = publishers.filter(publisher =>
    publisher.name.toLowerCase().includes(publisherSearchTerm.toLowerCase())
  );

  /**
   * NOUVEAU : Filtre les tactiques selon le terme de recherche ET les publishers sélectionnés
   */
  const filteredTactiques = tactiqueOptions.filter(tactique => {
    const matchesSearch = tactique.label.toLowerCase().includes(tactiqueSearchTerm.toLowerCase());
    const publisherSelected = selectedPublishers.includes(tactique.publisherId);
    return matchesSearch && publisherSelected;
  });

  /**
   * Ferme les dropdowns si on clique à l'extérieur
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (publisherDropdownRef.current && !publisherDropdownRef.current.contains(event.target as Node)) {
        setIsPublisherDropdownOpen(false);
      }
      if (tactiqueDropdownRef.current && !tactiqueDropdownRef.current.contains(event.target as Node)) {
        setIsTactiqueDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Focus automatique sur l'input de recherche quand les dropdowns s'ouvrent
   */
  useEffect(() => {
    if (isPublisherDropdownOpen && publisherSearchInputRef.current) {
      setTimeout(() => publisherSearchInputRef.current?.focus(), 100);
    }
  }, [isPublisherDropdownOpen]);

  useEffect(() => {
    if (isTactiqueDropdownOpen && tactiqueSearchInputRef.current) {
      setTimeout(() => tactiqueSearchInputRef.current?.focus(), 100);
    }
  }, [isTactiqueDropdownOpen]);

  /**
   * Toggle l'ouverture/fermeture du dropdown publishers
   */
  const togglePublisherDropdown = () => {
    if (isPublisherDropdownOpen) {
      setPublisherSearchTerm('');
    }
    setIsPublisherDropdownOpen(!isPublisherDropdownOpen);
  };

  /**
   * NOUVEAU : Toggle l'ouverture/fermeture du dropdown tactiques
   */
  const toggleTactiqueDropdown = () => {
    if (isTactiqueDropdownOpen) {
      setTactiqueSearchTerm('');
    }
    setIsTactiqueDropdownOpen(!isTactiqueDropdownOpen);
  };

  /**
   * Gère la sélection/désélection de tous les publishers (filtrés)
   */
  const handleSelectAllPublishers = () => {
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
   * NOUVEAU : Gère la sélection/désélection de toutes les tactiques (filtrées)
   */
  const handleSelectAllTactiques = () => {
    const filteredSelected = filteredTactiques.filter(tactique => tactique.isSelected);
    const allFilteredSelected = filteredSelected.length === filteredTactiques.length;
    
    if (allFilteredSelected) {
      // Désélectionner toutes les tactiques filtrées
      filteredTactiques.forEach(tactique => {
        if (tactique.isSelected) {
          toggleTactique(tactique.id);
        }
      });
    } else {
      // Sélectionner toutes les tactiques filtrées
      filteredTactiques.forEach(tactique => {
        if (!tactique.isSelected) {
          toggleTactique(tactique.id);
        }
      });
    }
  };

  /**
   * Vérifie si tous les publishers filtrés sont sélectionnés
   */
  const areAllPublishersSelected = () => {
    if (filteredPublishers.length === 0) return false;
    return filteredPublishers.every(pub => pub.isSelected);
  };

  /**
   * NOUVEAU : Vérifie si toutes les tactiques filtrées sont sélectionnées
   */
  const areAllTactiquesSelected = () => {
    if (filteredTactiques.length === 0) return false;
    return filteredTactiques.every(tactique => tactique.isSelected);
  };

  /**
   * Formate le texte du bouton principal publishers
   */
  const getPublisherButtonText = () => {
    if (loading) return t('common.loading');
    if (publishers.length === 0) return t('adOpsDropdown.button.noPublishers');
    
    const selectedCount = publishers.filter(pub => pub.isSelected).length;
    if (selectedCount === 0) return t('adOpsDropdown.button.selectPublishers');
    if (selectedCount === publishers.length) return t('adOpsDropdown.button.allPublishers');
    return `${selectedCount} ${t(selectedCount > 1 ? 'adOpsDropdown.button.publisherPlural' : 'adOpsDropdown.button.publisherSingular')}`;
  };

  /**
   * NOUVEAU : Formate le texte du bouton principal tactiques
   */
  const getTactiqueButtonText = () => {
    if (loading) return t('common.loading');
    
    const availableTactiques = tactiqueOptions.filter(tactique => 
      selectedPublishers.includes(tactique.publisherId)
    );
    
    if (availableTactiques.length === 0) return t('adOpsDropdown.button.noTactiques');
    
    const selectedCount = availableTactiques.filter(tactique => tactique.isSelected).length;
    if (selectedCount === 0) return t('adOpsDropdown.button.selectTactiques');
    if (selectedCount === availableTactiques.length) return t('adOpsDropdown.button.allTactiques');
    return `${selectedCount} ${t(selectedCount > 1 ? 'adOpsDropdown.button.tactiquePlural' : 'adOpsDropdown.button.tactiqueSingular')}`;
  };

  /**
   * Gère les clics sur l'input de recherche (empêche la fermeture du dropdown)
   */
  const handleSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          {t('adOpsDropdown.title')}
        </h3>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {t('common.error')}: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Grid avec deux dropdowns côte à côte */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Dropdown Publishers */}
        <div className="relative" ref={publisherDropdownRef}>
          <button
            type="button"
            onClick={togglePublisherDropdown}
            disabled={publishers.length === 0}
            className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              publishers.length === 0 ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            <span className="truncate">{getPublisherButtonText()}</span>
            <ChevronDownIcon className={`w-5 h-5 ml-2 transition-transform ${isPublisherDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Menu déroulant Publishers */}
          {isPublisherDropdownOpen && publishers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
              
              {/* Barre de recherche */}
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    ref={publisherSearchInputRef}
                    type="text"
                    value={publisherSearchTerm}
                    onChange={(e) => setPublisherSearchTerm(e.target.value)}
                    onClick={handleSearchClick}
                    placeholder={t('adOpsDropdown.search.placeholder')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* En-tête avec actions globales */}
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <button
                  onClick={handleSelectAllPublishers}
                  className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  <div className={`w-4 h-4 mr-2 border border-gray-300 rounded flex items-center justify-center ${
                    areAllPublishersSelected() ? 'bg-indigo-600 border-indigo-600' : ''
                  }`}>
                    {areAllPublishersSelected() && (
                      <CheckIcon className="w-3 h-3 text-white" />
                    )}
                  </div>
                  {t(areAllPublishersSelected() ? 'adOpsDropdown.actions.deselect' : 'adOpsDropdown.actions.select')} {t(filteredPublishers.length > 0 ? 'adOpsDropdown.actions.theResults' : 'adOpsDropdown.actions.all')}
                </button>
                
                {/* Compteur de résultats */}
                {publisherSearchTerm && (
                  <div className="mt-1 text-xs text-gray-500">
                    {filteredPublishers.length} {t(filteredPublishers.length !== 1 ? 'adOpsDropdown.search.resultsFound' : 'adOpsDropdown.search.resultFound')}
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
                    {t('adOpsDropdown.search.noneFound', { searchTerm: publisherSearchTerm })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* NOUVEAU : Dropdown Tactiques */}
        <div className="relative" ref={tactiqueDropdownRef}>
          <button
            type="button"
            onClick={toggleTactiqueDropdown}
            disabled={filteredTactiques.length === 0}
            className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              filteredTactiques.length === 0 ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            <span className="truncate">{getTactiqueButtonText()}</span>
            <ChevronDownIcon className={`w-5 h-5 ml-2 transition-transform ${isTactiqueDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Menu déroulant Tactiques */}
          {isTactiqueDropdownOpen && filteredTactiques.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
              
              {/* Barre de recherche */}
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    ref={tactiqueSearchInputRef}
                    type="text"
                    value={tactiqueSearchTerm}
                    onChange={(e) => setTactiqueSearchTerm(e.target.value)}
                    onClick={handleSearchClick}
                    placeholder={t('adOpsDropdown.tactiques.searchPlaceholder')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* En-tête avec actions globales */}
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <button
                  onClick={handleSelectAllTactiques}
                  className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  <div className={`w-4 h-4 mr-2 border border-gray-300 rounded flex items-center justify-center ${
                    areAllTactiquesSelected() ? 'bg-indigo-600 border-indigo-600' : ''
                  }`}>
                    {areAllTactiquesSelected() && (
                      <CheckIcon className="w-3 h-3 text-white" />
                    )}
                  </div>
                  {t(areAllTactiquesSelected() ? 'adOpsDropdown.actions.deselect' : 'adOpsDropdown.actions.select')} {t(filteredTactiques.length > 0 ? 'adOpsDropdown.actions.theResults' : 'adOpsDropdown.actions.all')}
                </button>
                
                {/* Compteur de résultats */}
                {tactiqueSearchTerm && (
                  <div className="mt-1 text-xs text-gray-500">
                    {filteredTactiques.length} {t(filteredTactiques.length !== 1 ? 'adOpsDropdown.search.resultsFound' : 'adOpsDropdown.search.resultFound')}
                  </div>
                )}
              </div>

              {/* Liste des tactiques filtrées */}
              <div className="py-1 max-h-48 overflow-y-auto">
                {filteredTactiques.length > 0 ? (
                  filteredTactiques.map((tactique) => (
                    <div
                      key={tactique.id}
                      onClick={() => toggleTactique(tactique.id)}
                      className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className={`w-4 h-4 mr-3 border border-gray-300 rounded flex-shrink-0 flex items-center justify-center ${
                          tactique.isSelected ? 'bg-indigo-600 border-indigo-600' : ''
                        }`}>
                          {tactique.isSelected && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="truncate">{tactique.label}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                    {t('adOpsDropdown.tactiques.noneFound', { searchTerm: tactiqueSearchTerm })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}