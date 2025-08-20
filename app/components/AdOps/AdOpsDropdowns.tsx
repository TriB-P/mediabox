// app/components/AdOps/AdOpsDropdowns.tsx
/**
 * Composant AdOpsDropdowns unifié et optimisé
 * CORRIGÉ : Types unifiés, logique simplifiée, performance améliorée
 */
'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronDownIcon, 
  CheckIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

// Import des types unifiés
import {
  AdOpsDropdownsProps,
  AdOpsPublisher,
  AdOpsTactiqueOption
} from '../../types/adops';

// ================================
// INTERFACES LOCALES
// ================================

interface DropdownState {
  isOpen: boolean;
  searchTerm: string;
}

interface DropdownItemProps {
  item: AdOpsPublisher | AdOpsTactiqueOption;
  isSelected: boolean;
  onClick: () => void;
  showCount?: boolean;
}

// ================================
// COMPOSANTS UTILITAIRES
// ================================

/**
 * Élément de dropdown optimisé
 */
const DropdownItem = React.memo(({ item, isSelected, onClick, showCount = false }: DropdownItemProps) => {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <div
      onClick={handleClick}
      className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
    >
      <div className="flex items-center flex-1 min-w-0">
        <div className={`w-4 h-4 mr-3 border border-gray-300 rounded flex-shrink-0 flex items-center justify-center ${
          isSelected ? 'bg-indigo-600 border-indigo-600' : ''
        }`}>
          {isSelected && (
            <CheckIcon className="w-3 h-3 text-white" />
          )}
        </div>
        <span className="truncate">
          {'name' in item ? item.name : item.label}
        </span>
      </div>
      {showCount && 'tactiqueCount' in item && (
        <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
          {item.tactiqueCount}
        </span>
      )}
    </div>
  );
});

DropdownItem.displayName = 'DropdownItem';

/**
 * Barre de recherche de dropdown optimisée
 */
const DropdownSearchBar = React.memo(({ 
  value, 
  onChange, 
  placeholder,
  inputRef 
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputRef: React.RefObject<HTMLInputElement>;
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="p-3 border-b border-gray-200 bg-gray-50">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onClick={handleClick}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
});

DropdownSearchBar.displayName = 'DropdownSearchBar';

/**
 * En-tête de dropdown avec actions globales
 */
const DropdownHeader = React.memo(({ 
  isAllSelected, 
  onToggleAll, 
  filteredCount,
  searchTerm,
  itemType 
}: {
  isAllSelected: boolean;
  onToggleAll: () => void;
  filteredCount: number;
  searchTerm: string;
  itemType: string;
}) => {
  const { t } = useTranslation();

  return (
    <div className="p-3 border-b border-gray-200 bg-gray-50">
      <button
        onClick={onToggleAll}
        className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <div className={`w-4 h-4 mr-2 border border-gray-300 rounded flex items-center justify-center ${
          isAllSelected ? 'bg-indigo-600 border-indigo-600' : ''
        }`}>
          {isAllSelected && (
            <CheckIcon className="w-3 h-3 text-white" />
          )}
        </div>
        {t(isAllSelected ? 'adOpsDropdown.actions.deselect' : 'adOpsDropdown.actions.select')} {t(filteredCount > 0 ? 'adOpsDropdown.actions.theResults' : 'adOpsDropdown.actions.all')}
      </button>
      
      {searchTerm && (
        <div className="mt-1 text-xs text-gray-500">
          {filteredCount} {t(filteredCount !== 1 ? 'adOpsDropdown.search.resultsFound' : 'adOpsDropdown.search.resultFound')}
        </div>
      )}
    </div>
  );
});

DropdownHeader.displayName = 'DropdownHeader';

// ================================
// COMPOSANT PRINCIPAL
// ================================

/**
 * Composant dropdowns AdOps optimisé
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
  
  // États locaux
  const [publisherDropdown, setPublisherDropdown] = useState<DropdownState>({
    isOpen: false,
    searchTerm: ''
  });
  
  const [tactiqueDropdown, setTactiqueDropdown] = useState<DropdownState>({
    isOpen: false,
    searchTerm: ''
  });
  
  // Refs pour la gestion des clics extérieurs et du focus
  const publisherDropdownRef = useRef<HTMLDivElement>(null);
  const tactiqueDropdownRef = useRef<HTMLDivElement>(null);
  const publisherSearchInputRef = useRef<HTMLInputElement>(null);
  const tactiqueSearchInputRef = useRef<HTMLInputElement>(null);

  // Mémoisation des éléments filtrés
  const filteredPublishers = useMemo(() => {
    return publishers.filter(publisher =>
      publisher.name.toLowerCase().includes(publisherDropdown.searchTerm.toLowerCase())
    );
  }, [publishers, publisherDropdown.searchTerm]);

  const filteredTactiques = useMemo(() => {
    return tactiqueOptions.filter(tactique => {
      const matchesSearch = tactique.label.toLowerCase().includes(tactiqueDropdown.searchTerm.toLowerCase());
      const publisherSelected = selectedPublishers.includes(tactique.publisherId);
      return matchesSearch && publisherSelected;
    });
  }, [tactiqueOptions, tactiqueDropdown.searchTerm, selectedPublishers]);

  // Mémoisation des textes des boutons
  const buttonTexts = useMemo(() => {
    const getPublisherText = () => {
      if (loading) return t('common.loading');
      if (publishers.length === 0) return t('adOpsDropdown.button.noPublishers');
      
      const selectedCount = publishers.filter(pub => pub.isSelected).length;
      if (selectedCount === 0) return t('adOpsDropdown.button.selectPublishers');
      if (selectedCount === publishers.length) return t('adOpsDropdown.button.allPublishers');
      return `${selectedCount} ${t(selectedCount > 1 ? 'adOpsDropdown.button.publisherPlural' : 'adOpsDropdown.button.publisherSingular')}`;
    };

    const getTactiqueText = () => {
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

    return {
      publisher: getPublisherText(),
      tactique: getTactiqueText()
    };
  }, [loading, publishers, tactiqueOptions, selectedPublishers, t]);

  // Gestionnaires de dropdown
  const togglePublisherDropdown = useCallback(() => {
    setPublisherDropdown(prev => ({
      isOpen: !prev.isOpen,
      searchTerm: prev.isOpen ? '' : prev.searchTerm
    }));
  }, []);

  const toggleTactiqueDropdown = useCallback(() => {
    setTactiqueDropdown(prev => ({
      isOpen: !prev.isOpen,
      searchTerm: prev.isOpen ? '' : prev.searchTerm
    }));
  }, []);

  // Gestionnaires de sélection globale
  const handleSelectAllPublishers = useCallback(() => {
    const filteredSelected = filteredPublishers.filter(pub => pub.isSelected);
    const allFilteredSelected = filteredSelected.length === filteredPublishers.length;
    
    if (allFilteredSelected) {
      filteredPublishers.forEach(pub => {
        if (pub.isSelected) {
          togglePublisher(pub.id);
        }
      });
    } else {
      filteredPublishers.forEach(pub => {
        if (!pub.isSelected) {
          togglePublisher(pub.id);
        }
      });
    }
  }, [filteredPublishers, togglePublisher]);

  const handleSelectAllTactiques = useCallback(() => {
    const filteredSelected = filteredTactiques.filter(tactique => tactique.isSelected);
    const allFilteredSelected = filteredSelected.length === filteredTactiques.length;
    
    if (allFilteredSelected) {
      filteredTactiques.forEach(tactique => {
        if (tactique.isSelected) {
          toggleTactique(tactique.id);
        }
      });
    } else {
      filteredTactiques.forEach(tactique => {
        if (!tactique.isSelected) {
          toggleTactique(tactique.id);
        }
      });
    }
  }, [filteredTactiques, toggleTactique]);

  // Vérification de sélection totale
  const areAllPublishersSelected = useMemo(() => {
    return filteredPublishers.length > 0 && filteredPublishers.every(pub => pub.isSelected);
  }, [filteredPublishers]);

  const areAllTactiquesSelected = useMemo(() => {
    return filteredTactiques.length > 0 && filteredTactiques.every(tactique => tactique.isSelected);
  }, [filteredTactiques]);

  // Gestion des clics extérieurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (publisherDropdownRef.current && !publisherDropdownRef.current.contains(event.target as Node)) {
        setPublisherDropdown(prev => ({ ...prev, isOpen: false }));
      }
      if (tactiqueDropdownRef.current && !tactiqueDropdownRef.current.contains(event.target as Node)) {
        setTactiqueDropdown(prev => ({ ...prev, isOpen: false }));
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus automatique sur les inputs de recherche
  useEffect(() => {
    if (publisherDropdown.isOpen && publisherSearchInputRef.current) {
      setTimeout(() => publisherSearchInputRef.current?.focus(), 100);
    }
  }, [publisherDropdown.isOpen]);

  useEffect(() => {
    if (tactiqueDropdown.isOpen && tactiqueSearchInputRef.current) {
      setTimeout(() => tactiqueSearchInputRef.current?.focus(), 100);
    }
  }, [tactiqueDropdown.isOpen]);

  // Rendu conditionnel pour les états de chargement et d'erreur
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
            <span className="truncate">{buttonTexts.publisher}</span>
            <ChevronDownIcon className={`w-5 h-5 ml-2 transition-transform ${publisherDropdown.isOpen ? 'rotate-180' : ''}`} />
          </button>

          {publisherDropdown.isOpen && publishers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
              
              <DropdownSearchBar
                value={publisherDropdown.searchTerm}
                onChange={(value) => setPublisherDropdown(prev => ({ ...prev, searchTerm: value }))}
                placeholder={t('adOpsDropdown.search.placeholder')}
                inputRef={publisherSearchInputRef}
              />

              <DropdownHeader
                isAllSelected={areAllPublishersSelected}
                onToggleAll={handleSelectAllPublishers}
                filteredCount={filteredPublishers.length}
                searchTerm={publisherDropdown.searchTerm}
                itemType="publishers"
              />

              <div className="py-1 max-h-48 overflow-y-auto">
                {filteredPublishers.length > 0 ? (
                  filteredPublishers.map((publisher) => (
                    <DropdownItem
                      key={publisher.id}
                      item={publisher}
                      isSelected={publisher.isSelected}
                      onClick={() => togglePublisher(publisher.id)}
                      showCount={true}
                    />
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                    {t('adOpsDropdown.search.noneFound', { searchTerm: publisherDropdown.searchTerm })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dropdown Tactiques */}
        <div className="relative" ref={tactiqueDropdownRef}>
          <button
            type="button"
            onClick={toggleTactiqueDropdown}
            disabled={filteredTactiques.length === 0}
            className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              filteredTactiques.length === 0 ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            <span className="truncate">{buttonTexts.tactique}</span>
            <ChevronDownIcon className={`w-5 h-5 ml-2 transition-transform ${tactiqueDropdown.isOpen ? 'rotate-180' : ''}`} />
          </button>

          {tactiqueDropdown.isOpen && filteredTactiques.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
              
              <DropdownSearchBar
                value={tactiqueDropdown.searchTerm}
                onChange={(value) => setTactiqueDropdown(prev => ({ ...prev, searchTerm: value }))}
                placeholder={t('adOpsDropdown.tactiques.searchPlaceholder')}
                inputRef={tactiqueSearchInputRef}
              />

              <DropdownHeader
                isAllSelected={areAllTactiquesSelected}
                onToggleAll={handleSelectAllTactiques}
                filteredCount={filteredTactiques.length}
                searchTerm={tactiqueDropdown.searchTerm}
                itemType="tactiques"
              />

              <div className="py-1 max-h-48 overflow-y-auto">
                {filteredTactiques.length > 0 ? (
                  filteredTactiques.map((tactique) => (
                    <DropdownItem
                      key={tactique.id}
                      item={tactique}
                      isSelected={tactique.isSelected}
                      onClick={() => toggleTactique(tactique.id)}
                      showCount={false}
                    />
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                    {t('adOpsDropdown.tactiques.noneFound', { searchTerm: tactiqueDropdown.searchTerm })}
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