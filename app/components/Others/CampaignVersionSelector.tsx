// app/components/Others/CampaignVersionSelector.tsx

/**
 * Ce fichier contient les composants et le hook nécessaires pour afficher des sélecteurs de campagne et de version.
 * Il est conçu pour être réutilisable à travers l'application.
 * - `CampaignVersionSelector` : Le composant principal qui affiche deux listes déroulantes.
 * - `CompactCampaignVersionSelector` : Une variante plus petite du composant principal.
 * - `useCampaignVersionSelector` : Un hook personnalisé pour gérer facilement l'état de sélection.
 * 
 * MODIFIÉ : Support des shortcodes pour CA_Quarter et CA_Year (comme CA_Division).
 */
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDownIcon, CheckIcon, StarIcon } from '@heroicons/react/24/outline';
import { Campaign } from '../../types/campaign';
import { useTranslation } from '../../contexts/LanguageContext';
import { useClient } from '../../contexts/ClientContext';

// Import des fonctions de cache
import {
  getListForClient,
  ShortcodeItem as CachedShortcodeItem
} from '../../lib/cacheService';

// Import de la fonction Firebase fallback
import { getClientList } from '../../lib/listService';

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

  // NOUVEAU : États pour les listes de shortcodes
  const [quarters, setQuarters] = useState<CachedShortcodeItem[]>([]);
  const [years, setYears] = useState<CachedShortcodeItem[]>([]);

  const campaignDropdownRef = useRef<HTMLDivElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);
  const campaignSearchRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();
  const { selectedClient } = useClient();

  // NOUVEAU : Charger les listes de shortcodes
  useEffect(() => {
    const loadShortcodeLists = async () => {
      if (!selectedClient) return;

      try {
        // Charger CA_Quarter depuis le cache
        console.log(`[CACHE] Chargement CA_Quarter pour client ${selectedClient.clientId}`);
        const quartersFromCache = getListForClient('CA_Quarter', selectedClient.clientId);
        
        if (quartersFromCache && quartersFromCache.length > 0) {
          console.log(`[CACHE] ✅ CA_Quarter trouvé dans le cache (${quartersFromCache.length} éléments)`);
          setQuarters(quartersFromCache);
        } else {
          console.log(`[CACHE] ⚠️ CA_Quarter non trouvé dans le cache, fallback Firebase`);
          console.log(`FIREBASE: LECTURE - Fichier: CampaignVersionSelector.tsx - Fonction: loadShortcodeLists - Path: shortcodes/clients/${selectedClient.clientId}/CA_Quarter`);
          
          const quartersData = await getClientList('CA_Quarter', selectedClient.clientId)
            .catch(() => {
              console.log("FIREBASE: LECTURE - Fichier: CampaignVersionSelector.tsx - Fonction: loadShortcodeLists - Path: shortcodes/clients/PlusCo/CA_Quarter");
              return getClientList('CA_Quarter', 'PlusCo');
            });

          // Convertir au format CachedShortcodeItem
          const convertedQuarters: CachedShortcodeItem[] = quartersData.map(item => ({
            id: item.id,
            SH_Code: item.SH_Code,
            SH_Display_Name_EN: item.SH_Display_Name_EN,
            SH_Display_Name_FR: item.SH_Display_Name_FR,
            SH_Default_UTM: item.SH_Default_UTM,
            SH_Logo: item.SH_Logo,
            SH_Type: item.SH_Type,
            SH_Tags: item.SH_Tags || []
          }));

          setQuarters(convertedQuarters);
        }

        // Charger CA_Year depuis le cache
        console.log(`[CACHE] Chargement CA_Year pour client ${selectedClient.clientId}`);
        const yearsFromCache = getListForClient('CA_Year', selectedClient.clientId);
        
        if (yearsFromCache && yearsFromCache.length > 0) {
          console.log(`[CACHE] ✅ CA_Year trouvé dans le cache (${yearsFromCache.length} éléments)`);
          setYears(yearsFromCache);
        } else {
          console.log(`[CACHE] ⚠️ CA_Year non trouvé dans le cache, fallback Firebase`);
          console.log(`FIREBASE: LECTURE - Fichier: CampaignVersionSelector.tsx - Fonction: loadShortcodeLists - Path: shortcodes/clients/${selectedClient.clientId}/CA_Year`);
          
          const yearsData = await getClientList('CA_Year', selectedClient.clientId)
            .catch(() => {
              console.log("FIREBASE: LECTURE - Fichier: CampaignVersionSelector.tsx - Fonction: loadShortcodeLists - Path: shortcodes/clients/PlusCo/CA_Year");
              return getClientList('CA_Year', 'PlusCo');
            });

          // Convertir au format CachedShortcodeItem
          const convertedYears: CachedShortcodeItem[] = yearsData.map(item => ({
            id: item.id,
            SH_Code: item.SH_Code,
            SH_Display_Name_EN: item.SH_Display_Name_EN,
            SH_Display_Name_FR: item.SH_Display_Name_FR,
            SH_Default_UTM: item.SH_Default_UTM,
            SH_Logo: item.SH_Logo,
            SH_Type: item.SH_Type,
            SH_Tags: item.SH_Tags || []
          }));

          setYears(convertedYears);
        }

      } catch (error) {
        console.warn('Erreur lors du chargement des listes de shortcodes:', error);
      }
    };

    loadShortcodeLists();
  }, [selectedClient]);

  /**
   * NOUVEAU : Récupère le nom affichable d'un trimestre à partir de son identifiant.
   * @param {string | undefined} quarterId - L'identifiant du trimestre.
   * @returns {string} Le nom du trimestre ou l'identifiant lui-même si non trouvé.
   */
  const getQuarterName = useCallback((quarterId: string | undefined): string => {
    if (!quarterId) return '';
    const quarter = quarters.find(q => q.id === quarterId);
    return quarter ? quarter.SH_Display_Name_EN || quarter.SH_Code || quarterId : quarterId;
  }, [quarters]);

  /**
   * NOUVEAU : Récupère le nom affichable d'une année à partir de son identifiant.
   * @param {string | undefined} yearId - L'identifiant de l'année.
   * @returns {string} Le nom de l'année ou l'identifiant lui-même si non trouvé.
   */
  const getYearName = useCallback((yearId: string | undefined): string => {
    if (!yearId) return '';
    const year = years.find(y => y.id === yearId);
    return year ? year.SH_Display_Name_EN || year.SH_Code || yearId : yearId;
  }, [years]);

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
                              {getYearName(campaign.CA_Year)} • {getQuarterName(campaign.CA_Quarter)}
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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