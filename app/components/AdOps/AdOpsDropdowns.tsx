// app/components/AdOps/AdOpsDropdowns.tsx
/**
 * Composant AdOpsDropdowns
 * Ce composant affiche un dropdown multi-sélection pour filtrer les publishers
 * des tactiques AdOps ayant des placements avec PL_Tag_Type non vide.
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  CheckIcon
} from '@heroicons/react/24/outline';
import { Campaign } from '../../types/campaign';
import { useAdOpsData } from '../../hooks/useAdOpsData';

interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

interface AdOpsDropdownsProps {
  selectedCampaign: Campaign;
  selectedVersion: Version;
}

/**
 * Composant principal pour les listes déroulantes AdOps.
 * Affiche un dropdown de sélection multiple pour les publishers.
 *
 * @param {AdOpsDropdownsProps} props - Les propriétés du composant
 * @returns {JSX.Element} Le composant AdOpsDropdowns
 */
export default function AdOpsDropdowns({ 
  selectedCampaign, 
  selectedVersion 
}: AdOpsDropdownsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    publishers,
    loading,
    error,
    togglePublisher,
    selectAllPublishers,
    deselectAllPublishers,
    selectedPublishers
  } = useAdOpsData(selectedCampaign, selectedVersion);

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
   * Toggle l'ouverture/fermeture du dropdown
   */
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  /**
   * Gère la sélection/désélection de tous les publishers
   */
  const handleSelectAll = () => {
    const selectedCount = publishers.filter(pub => pub.isSelected).length;
    if (selectedCount === publishers.length) {
      deselectAllPublishers();
    } else {
      selectAllPublishers();
    }
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
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* En-tête avec actions globales */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <button
                onClick={handleSelectAll}
                className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                <div className={`w-4 h-4 mr-2 border border-gray-300 rounded flex items-center justify-center ${
                  publishers.filter(pub => pub.isSelected).length === publishers.length ? 'bg-indigo-600 border-indigo-600' : ''
                }`}>
                  {publishers.filter(pub => pub.isSelected).length === publishers.length && (
                    <CheckIcon className="w-3 h-3 text-white" />
                  )}
                </div>
                {publishers.filter(pub => pub.isSelected).length === publishers.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </button>
            </div>

            {/* Liste des publishers */}
            <div className="py-1">
              {publishers.map((publisher) => (
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}