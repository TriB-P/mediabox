/**
 * Ce fichier contient les composants et le hook nécessaires pour afficher des sélecteurs de campagne et de version.
 * Il est conçu pour être réutilisable à travers l'application.
 * - `CampaignVersionSelector` : Le composant principal qui affiche deux listes déroulantes.
 * - `CompactCampaignVersionSelector` : Une variante plus petite du composant principal.
 * - `useCampaignVersionSelector` : Un hook personnalisé pour gérer facilement l'état de sélection.
 */
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDownIcon, CheckIcon, StarIcon } from '@heroicons/react/24/outline';
import { Campaign } from '../../types/campaign';
import { useTranslation } from '../../contexts/LanguageContext';


interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

interface CampaignVersionSelectorProps {
  campaigns: Campaign[];
  versions: Version[];
  selectedCampaign: Campaign | null;
  selectedVersion: Version | null;
  loading: boolean;
  error: string | null;
  onCampaignChange: (campaign: Campaign) => void;
  onVersionChange: (version: Version) => void;
  className?: string;
  disabled?: boolean;
  autoSelectVersion?: boolean;
  showVersionBadges?: boolean;
  compact?: boolean;
}

/**
 * Affiche deux listes déroulantes pour sélectionner une campagne puis une version.
 * Ce composant gère l'affichage, la recherche dans les campagnes et la sélection.
 * @param {CampaignVersionSelectorProps} props - Les propriétés pour configurer le composant.
 * @returns {JSX.Element} Le composant de sélection de campagne et de version.
 */
export default function CampaignVersionSelector({
  campaigns,
  versions,
  selectedCampaign,
  selectedVersion,
  loading,
  error,
  onCampaignChange,
  onVersionChange,
  className = '',
  disabled = false,
  autoSelectVersion = true,
  showVersionBadges = true,
  compact = false
}: CampaignVersionSelectorProps) {
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState('');

  const campaignDropdownRef = useRef<HTMLDivElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);
  const campaignSearchRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();


  useEffect(() => {
    if (autoSelectVersion && selectedCampaign && versions.length === 1 && !selectedVersion) {
      onVersionChange(versions[0]);
    }
  }, [autoSelectVersion, selectedCampaign, versions, selectedVersion, onVersionChange]);

  const filteredCampaigns = useMemo(() => {
    if (!campaignSearchTerm.trim()) {
      return campaigns;
    }
    
    const searchLower = campaignSearchTerm.toLowerCase();
    return campaigns.filter((campaign: Campaign) => 
      campaign.CA_Name.toLowerCase().includes(searchLower)
    );
  }, [campaigns, campaignSearchTerm]);

  useEffect(() => {
    if (showCampaignDropdown && campaignSearchRef.current) {
      setTimeout(() => {
        campaignSearchRef.current?.focus();
      }, 100);
    }
  }, [showCampaignDropdown]);

  useEffect(() => {
    if (!showCampaignDropdown) {
      setCampaignSearchTerm('');
    }
  }, [showCampaignDropdown]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (campaignDropdownRef.current && !campaignDropdownRef.current.contains(event.target as Node)) {
        setShowCampaignDropdown(false);
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target as Node)) {
        setShowVersionDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCampaignSelect = useCallback((campaign: Campaign) => {
    onCampaignChange(campaign);
    setShowCampaignDropdown(false);
    setCampaignSearchTerm('');
  }, [onCampaignChange]);

  const handleVersionSelect = useCallback((version: Version) => {
    onVersionChange(version);
    setShowVersionDropdown(false);
  }, [onVersionChange]);

  const handleCampaignDropdownToggle = useCallback(() => {
    if (!disabled) {
      setShowCampaignDropdown(!showCampaignDropdown);
    }
  }, [disabled, showCampaignDropdown]);

  const handleCampaignSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowCampaignDropdown(false);
    } else if (e.key === 'Enter' && filteredCampaigns.length === 1) {
      handleCampaignSelect(filteredCampaigns[0]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
    }
  }, [filteredCampaigns, handleCampaignSelect]);

  const formatCampaignDisplay = useCallback((campaign: Campaign) => {
    return campaign.CA_Name;
  }, []);

  const baseClasses = compact 
    ? "flex gap-2" 
    : "flex gap-4";
  
  const dropdownClasses = compact
    ? "w-full"
    : "w-1/2";
  
  const buttonClasses = `
    flex items-center justify-between w-full px-3 py-2 
    bg-white border border-gray-300 rounded-md shadow-sm 
    text-sm font-medium text-gray-700 
    hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${compact ? 'text-xs px-2 py-1' : ''}
  `.trim();

  if (loading) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <div className={dropdownClasses}>
          <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
        </div>
        <div className={dropdownClasses}>
          <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${baseClasses} ${className}`}>
      <div className={`${dropdownClasses} relative`} ref={campaignDropdownRef}>
        <button
          type="button"
          className={buttonClasses}
          onClick={handleCampaignDropdownToggle}
          disabled={disabled || campaigns.length === 0}
        >
          <span className="truncate">
            {selectedCampaign 
              ? formatCampaignDisplay(selectedCampaign)
              : campaigns.length === 0 
                ? t('campaignSelector.noCampaign')
                : t('campaignSelector.selectCampaign')
            }
          </span>
          <ChevronDownIcon className={`w-5 h-5 ml-2 -mr-1 transition-transform ${
            showCampaignDropdown ? 'rotate-180' : ''
          }`} />
        </button>

        {showCampaignDropdown && campaigns.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-80 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <input
                  ref={campaignSearchRef}
                  type="text"
                  placeholder={t('campaignSelector.searchCampaign')}
                  value={campaignSearchTerm}
                  onChange={(e) => setCampaignSearchTerm(e.target.value)}
                  onKeyDown={handleCampaignSearchKeyDown}
                  className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {campaignSearchTerm && (
                <div className="mt-2 text-xs text-gray-500">
                  {filteredCampaigns.length} résultat{filteredCampaigns.length !== 1 ? 's' : ''} trouvé{filteredCampaigns.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filteredCampaigns.length > 0 ? (
                <ul className="py-1">
                  {filteredCampaigns.map((campaign: Campaign) => (
                    <li key={campaign.id}>
                      <button
                        className={`
                          w-full text-left px-4 py-2 text-sm hover:bg-gray-100 
                          flex items-center justify-between transition-colors
                          ${selectedCampaign?.id === campaign.id ? 'bg-gray-50 font-medium' : ''}
                        `}
                        onClick={() => handleCampaignSelect(campaign)}
                      >
                        <div className="truncate">
                          <div className="font-medium">{campaign.CA_Name}</div>
                          {!compact && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {campaign.CA_Year} • {campaign.CA_Quarter}
                            </div>
                          )}
                        </div>
                        {selectedCampaign?.id === campaign.id && (
                          <CheckIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  {t('campaignSelector.noCampaignFound')} "{campaignSearchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`${dropdownClasses} relative`} ref={versionDropdownRef}>
        <button
          type="button"
          className={buttonClasses}
          onClick={() => !disabled && setShowVersionDropdown(!showVersionDropdown)}
          disabled={disabled || !selectedCampaign || versions.length === 0}
        >
          <span className="truncate">
            {selectedVersion 
              ? selectedVersion.name
              : !selectedCampaign
                ? t('campaignSelector.selectCampaignFirst')
                : versions.length === 0
                  ? t('campaignSelector.noVersion')
                  : t('campaignSelector.selectVersion')
            }
          </span>
          <ChevronDownIcon className={`w-5 h-5 ml-2 -mr-1 transition-transform ${
            showVersionDropdown ? 'rotate-180' : ''
          }`} />
        </button>

        {showVersionDropdown && versions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-56 overflow-auto">
            <ul className="py-1">
              {versions.map((version: Version) => (
                <li key={version.id}>
                  <button
                    className={`
                      w-full text-left px-4 py-2 text-sm hover:bg-gray-100 
                      flex items-center justify-between
                      ${selectedVersion?.id === version.id ? 'bg-gray-50 font-medium' : ''}
                    `}
                    onClick={() => handleVersionSelect(version)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="truncate">{version.name}</span>
                      {showVersionBadges && version.isOfficial && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <StarIcon className="w-3 h-3 mr-1" />
                          Officielle
                        </span>
                      )}
                    </div>
                    {selectedVersion?.id === version.id && (
                      <CheckIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

interface CompactCampaignVersionSelectorProps extends Omit<CampaignVersionSelectorProps, 'compact'> {
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Un wrapper pour `CampaignVersionSelector` qui applique un style compact.
 * Utile pour les interfaces où l'espace est limité.
 * @param {CompactCampaignVersionSelectorProps} props - Les propriétés pour configurer le composant, avec l'ajout de `orientation`.
 * @returns {JSX.Element} Le composant `CampaignVersionSelector` en mode compact.
 */
export function CompactCampaignVersionSelector({
  orientation = 'horizontal',
  ...props
}: CompactCampaignVersionSelectorProps) {
  
  const orientationClasses = orientation === 'vertical' 
    ? 'flex-col space-y-2' 
    : 'flex-row space-x-2';
  
  return (
    <div className={orientationClasses}>
      <CampaignVersionSelector
        {...props}
        compact={true}
        className="w-full"
      />
    </div>
  );
}

/**
 * Hook personnalisé pour simplifier la gestion de l'état du `CampaignVersionSelector`.
 * Il gère la campagne et la version sélectionnées et fournit des fonctions pour les mettre à jour et les réinitialiser.
 * @returns {{selectedCampaign: Campaign | null, selectedVersion: Version | null, handleCampaignChange: (campaign: Campaign) => void, handleVersionChange: (version: Version) => void, reset: () => void}} Un objet contenant l'état et les gestionnaires d'état.
 */
export function useCampaignVersionSelector() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  
  const handleCampaignChange = useCallback((campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setSelectedVersion(null);
  }, []);
  
  const handleVersionChange = useCallback((version: Version) => {
    setSelectedVersion(version);
  }, []);
  
  const reset = useCallback(() => {
    setSelectedCampaign(null);
    setSelectedVersion(null);
  }, []);
  
  return {
    selectedCampaign,
    selectedVersion,
    handleCampaignChange,
    handleVersionChange,
    reset
  };
}