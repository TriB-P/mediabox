// app/components/Others/CampaignVersionSelector.tsx - Composant réutilisable pour sélection campagne/version

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDownIcon, CheckIcon, StarIcon } from '@heroicons/react/24/outline';
import { Campaign } from '../../types/campaign';

// ==================== TYPES ====================

interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

interface CampaignVersionSelectorProps {
  // Données
  campaigns: Campaign[];
  versions: Version[];
  selectedCampaign: Campaign | null;
  selectedVersion: Version | null;
  
  // États
  loading: boolean;
  error: string | null;
  
  // Actions
  onCampaignChange: (campaign: Campaign) => void;
  onVersionChange: (version: Version) => void;
  
  // Configuration
  className?: string;
  disabled?: boolean;
  autoSelectVersion?: boolean; // Auto-sélectionne si version unique (défaut: true)
  showVersionBadges?: boolean; // Affiche les badges "Officielle" (défaut: true)
  compact?: boolean; // Mode compact pour les espaces restreints (défaut: false)
}

// ==================== COMPOSANT PRINCIPAL ====================

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
  
  // ==================== ÉTATS LOCAUX ====================
  
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState('');
  
  // Refs pour gérer les clics à l'extérieur et focus recherche
  const campaignDropdownRef = useRef<HTMLDivElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);
  const campaignSearchRef = useRef<HTMLInputElement>(null);
  
  // ==================== AUTO-SÉLECTION VERSION ====================
  
  useEffect(() => {
    if (autoSelectVersion && selectedCampaign && versions.length === 1 && !selectedVersion) {
      console.log('🎯 Auto-sélection de la version unique:', versions[0].name);
      onVersionChange(versions[0]);
    }
  }, [autoSelectVersion, selectedCampaign, versions, selectedVersion, onVersionChange]);

  // ==================== FILTRAGE CAMPAGNES ====================
  
  const filteredCampaigns = useMemo(() => {
    if (!campaignSearchTerm.trim()) {
      return campaigns;
    }
    
    const searchLower = campaignSearchTerm.toLowerCase();
    return campaigns.filter((campaign: Campaign) => 
      campaign.CA_Name.toLowerCase().includes(searchLower)
    );
  }, [campaigns, campaignSearchTerm]);
  
  // ==================== GESTION FOCUS RECHERCHE ====================
  
  useEffect(() => {
    if (showCampaignDropdown && campaignSearchRef.current) {
      // Focus automatique sur la recherche quand le dropdown s'ouvre
      setTimeout(() => {
        campaignSearchRef.current?.focus();
      }, 100);
    }
  }, [showCampaignDropdown]);
  
  // Reset search quand on ferme le dropdown
  useEffect(() => {
    if (!showCampaignDropdown) {
      setCampaignSearchTerm('');
    }
  }, [showCampaignDropdown]);
  
  // ==================== GESTION CLICS EXTÉRIEURS ====================
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Pour le dropdown campagne, vérifier que le clic n'est pas dans le champ de recherche
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
  
  // ==================== GESTIONNAIRES ====================
  
  const handleCampaignSelect = useCallback((campaign: Campaign) => {
    console.log('📋 Sélection campagne:', campaign.CA_Name);
    onCampaignChange(campaign);
    setShowCampaignDropdown(false);
    setCampaignSearchTerm(''); // Reset recherche après sélection
  }, [onCampaignChange]);
  
  const handleVersionSelect = useCallback((version: Version) => {
    console.log('📝 Sélection version:', version.name);
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
      // Auto-sélection si une seule campagne correspond
      handleCampaignSelect(filteredCampaigns[0]);
    } else if (e.key === 'ArrowDown') {
      // TODO: Navigation clavier dans la liste (bonus)
      e.preventDefault();
    }
  }, [filteredCampaigns, handleCampaignSelect]);
  
  // ==================== FORMATAGE ====================
  
  const formatCampaignDisplay = useCallback((campaign: Campaign) => {
    // Toujours afficher seulement le nom, plus de campaign identifier
    return campaign.CA_Name;
  }, []);
  
  // ==================== STYLES ====================
  
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
  
  // ==================== RENDU ====================
  
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
      
      {/* ==================== SÉLECTEUR CAMPAGNE ==================== */}
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
                ? 'Aucune campagne'
                : 'Sélectionner une campagne'
            }
          </span>
          <ChevronDownIcon className={`w-5 h-5 ml-2 -mr-1 transition-transform ${
            showCampaignDropdown ? 'rotate-180' : ''
          }`} />
        </button>

        {showCampaignDropdown && campaigns.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-80 overflow-hidden">
            
            {/* Champ de recherche */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <input
                  ref={campaignSearchRef}
                  type="text"
                  placeholder="Rechercher une campagne..."
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

            {/* Liste des campagnes filtrées */}
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
                  Aucune campagne trouvée pour "{campaignSearchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== SÉLECTEUR VERSION ==================== */}
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
                ? 'Sélectionner d\'abord une campagne'
                : versions.length === 0
                  ? 'Aucune version'
                  : 'Sélectionner une version'
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

// ==================== COMPOSANT COMPACT ====================

interface CompactCampaignVersionSelectorProps extends Omit<CampaignVersionSelectorProps, 'compact'> {
  orientation?: 'horizontal' | 'vertical';
}

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

// ==================== HOOK UTILITAIRE ====================

/**
 * Hook pour simplifier l'utilisation du CampaignVersionSelector
 */
export function useCampaignVersionSelector() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  
  const handleCampaignChange = useCallback((campaign: Campaign) => {
    setSelectedCampaign(campaign);
    // Reset version quand on change de campagne
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