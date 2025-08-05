// app/components/Campaigns/CampaignTable.tsx

/**
 * Ce composant a pour rôle d'afficher une liste de campagnes sous forme de tableau pour les écrans larges
 * et sous forme de liste de cartes pour les appareils mobiles. Il permet de visualiser les informations
 * principales de chaque campagne et d'accéder à des actions (modifier, etc.). Il gère également un état
 * d'expansion pour chaque ligne afin d'afficher des informations détaillées, comme les versions de la campagne,
 * en chargeant un composant enfant `CampaignVersions`.
 * 
 * MODIFIÉ : Support des shortcodes pour CA_Quarter et CA_Year (comme CA_Division).
 */
'use client';

import React, { Fragment, useEffect, useState } from 'react';
import { Campaign } from '../../types/campaign';
import CampaignActions from './CampaignActions';
import CampaignVersions from './CampaignVersions';
import { useClient } from '../../contexts/ClientContext';
import { getClientList, ShortcodeItem } from '../../lib/listService';
import { useTranslation } from '../../contexts/LanguageContext';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Import des fonctions de cache
import {
  getListForClient,
  ShortcodeItem as CachedShortcodeItem
} from '../../lib/cacheService';

interface CampaignTableProps {
  campaigns: Campaign[];
  clientId: string;
  onEdit: (campaign: Campaign) => void;
  onRefresh: () => void;
  loading?: boolean;
}

/**
 * Affiche un tableau ou une liste de campagnes avec des options pour les gérer.
 * @param {Campaign[]} campaigns - La liste des campagnes à afficher.
 * @param {string} clientId - L'identifiant du client auquel les campagnes appartiennent.
 * @param {(campaign: Campaign) => void} onEdit - Fonction de rappel pour éditer une campagne.
 * @param {() => void} onRefresh - Fonction de rappel pour rafraîchir la liste des campagnes.
 * @param {boolean} [loading=false] - Indique si les données sont en cours de chargement.
 * @returns {React.ReactElement} Le composant de la table des campagnes.
 */
export default function CampaignTable({
  campaigns,
  clientId,
  onEdit,
  onRefresh,
  loading = false
}: CampaignTableProps) {
  const { selectedClient } = useClient();
  const { t, language } = useTranslation();
  const [divisions, setDivisions] = useState<ShortcodeItem[]>([]);
  const [quarters, setQuarters] = useState<CachedShortcodeItem[]>([]);
  const [years, setYears] = useState<CachedShortcodeItem[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    const loadShortcodeLists = async () => {
      if (!selectedClient) return;

      try {
        // Charger CA_Division (logique existante)
        console.log(`FIREBASE: LECTURE - Fichier: CampaignTable.tsx - Fonction: loadShortcodeLists - Path: shortcodes/clients/${selectedClient.clientId}/CA_Division`);
        const divisionsData = await getClientList('CA_Division', selectedClient.clientId)
          .catch(() => {
            console.log("FIREBASE: LECTURE - Fichier: CampaignTable.tsx - Fonction: loadShortcodeLists - Path: shortcodes/clients/PlusCo/CA_Division");
            return getClientList('CA_Division', 'PlusCo');
          });

        setDivisions(divisionsData);

        // NOUVEAU : Charger CA_Quarter depuis le cache
        console.log(`[CACHE] Chargement CA_Quarter pour client ${selectedClient.clientId}`);
        const quartersFromCache = getListForClient('CA_Quarter', selectedClient.clientId);
        
        if (quartersFromCache && quartersFromCache.length > 0) {
          console.log(`[CACHE] ✅ CA_Quarter trouvé dans le cache (${quartersFromCache.length} éléments)`);
          setQuarters(quartersFromCache);
        } else {
          console.log(`[CACHE] ⚠️ CA_Quarter non trouvé dans le cache, fallback Firebase`);
          console.log(`FIREBASE: LECTURE - Fichier: CampaignTable.tsx - Fonction: loadShortcodeLists - Path: shortcodes/clients/${selectedClient.clientId}/CA_Quarter`);
          
          const quartersData = await getClientList('CA_Quarter', selectedClient.clientId)
            .catch(() => {
              console.log("FIREBASE: LECTURE - Fichier: CampaignTable.tsx - Fonction: loadShortcodeLists - Path: shortcodes/clients/PlusCo/CA_Quarter");
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

        // NOUVEAU : Charger CA_Year depuis le cache
        console.log(`[CACHE] Chargement CA_Year pour client ${selectedClient.clientId}`);
        const yearsFromCache = getListForClient('CA_Year', selectedClient.clientId);
        
        if (yearsFromCache && yearsFromCache.length > 0) {
          console.log(`[CACHE] ✅ CA_Year trouvé dans le cache (${yearsFromCache.length} éléments)`);
          setYears(yearsFromCache);
        } else {
          console.log(`[CACHE] ⚠️ CA_Year non trouvé dans le cache, fallback Firebase`);
          console.log(`FIREBASE: LECTURE - Fichier: CampaignTable.tsx - Fonction: loadShortcodeLists - Path: shortcodes/clients/${selectedClient.clientId}/CA_Year`);
          
          const yearsData = await getClientList('CA_Year', selectedClient.clientId)
            .catch(() => {
              console.log("FIREBASE: LECTURE - Fichier: CampaignTable.tsx - Fonction: loadShortcodeLists - Path: shortcodes/clients/PlusCo/CA_Year");
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
        console.warn(`${t('campaigns.table.shortcodeListsLoadingError')}:`, error);
      }
    };

    loadShortcodeLists();
  }, [selectedClient, t]);

  /**
   * Formate un montant numérique en une chaîne de caractères monétaire.
   * @param {number} amount - Le montant à formater.
   * @param {string} [currency='CAD'] - La devise à utiliser pour le formatage.
   * @returns {string} Le montant formaté en devise (ex: "1 234 $").
   */
  const formatCurrency = (amount: number, currency: string = 'CAD') => {
    const locale = language === 'fr' ? 'fr-CA' : 'en-CA';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /**
   * Formate une chaîne de date en un format localisé court.
   * @param {string} dateString - La chaîne de date à formater (ex: "2023-10-26").
   * @returns {string} La date formatée (ex: "26 oct. 2023") ou '-' si la date est invalide.
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const locale = language === 'fr' ? 'fr-CA' : 'en-CA';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Récupère le nom affichable d'une division à partir de son identifiant.
   * @param {string | undefined} divisionId - L'identifiant de la division.
   * @returns {string} Le nom de la division ou l'identifiant lui-même si non trouvé.
   */
  const getDivisionName = (divisionId: string | undefined): string => {
    if (!divisionId) return '';
    const division = divisions.find(d => d.id === divisionId);
    return division ? division.SH_Display_Name_EN || division.SH_Code || divisionId : divisionId;
  };

  /**
   * NOUVEAU : Récupère le nom affichable d'un trimestre à partir de son identifiant.
   * @param {string | undefined} quarterId - L'identifiant du trimestre.
   * @returns {string} Le nom du trimestre ou l'identifiant lui-même si non trouvé.
   */
  const getQuarterName = (quarterId: string | undefined): string => {
    if (!quarterId) return '';
    const quarter = quarters.find(q => q.id === quarterId);
    return quarter ? quarter.SH_Display_Name_EN || quarter.SH_Code || quarterId : quarterId;
  };

  /**
   * NOUVEAU : Récupère le nom affichable d'une année à partir de son identifiant.
   * @param {string | undefined} yearId - L'identifiant de l'année.
   * @returns {string} Le nom de l'année ou l'identifiant lui-même si non trouvé.
   */
  const getYearName = (yearId: string | undefined): string => {
    if (!yearId) return '';
    const year = years.find(y => y.id === yearId);
    return year ? year.SH_Display_Name_EN || year.SH_Code || yearId : yearId;
  };

  /**
   * Gère l'affichage ou le masquage des détails d'une ligne de campagne.
   * @param {string} campaignId - L'identifiant de la campagne dont la ligne doit être basculée.
   * @returns {void}
   */
  const toggleRow = (campaignId: string) => {
    setExpandedRowId(prevId => (prevId === campaignId ? null : campaignId));
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('campaigns.table.noCampaignsTitle')}
          </h3>
          <p className="text-gray-500">
            {t('campaigns.table.noCampaignsMessage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('campaigns.table.nameIdentifier')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('campaigns.table.period')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('campaigns.table.budget')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('campaigns.table.dates')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('campaigns.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <Fragment key={campaign.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <button onClick={() => toggleRow(campaign.id)} className="text-gray-400 hover:text-gray-600">
                      {expandedRowId === campaign.id ? (
                        <ChevronDownIcon className="h-5 w-5" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.CA_Name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.CA_Campaign_Identifier}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getQuarterName(campaign.CA_Quarter)} {getYearName(campaign.CA_Year)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(campaign.CA_Budget, campaign.CA_Currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {formatDate(campaign.CA_Start_Date)} - {formatDate(campaign.CA_End_Date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <CampaignActions
                      campaign={campaign}
                      clientId={clientId}
                      onEdit={onEdit}
                      onRefresh={onRefresh}
                    />
                  </td>
                </tr>
                {expandedRowId === campaign.id && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <div className="px-4 py-4 bg-slate-50">
                        <CampaignVersions
                          clientId={clientId}
                          campaignId={campaign.id}
                          officialVersionId={campaign.officialVersionId}
                          onVersionChange={onRefresh}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        <div className="divide-y divide-gray-200">
          {campaigns.map((campaign) => {
            return (
              <div key={campaign.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate flex-1">
                    {campaign.CA_Name}
                  </h3>
                  <CampaignActions
                    campaign={campaign}
                    clientId={clientId}
                    onEdit={onEdit}
                    onRefresh={onRefresh}
                    className="ml-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 font-medium">
                      {getQuarterName(campaign.CA_Quarter)} {getYearName(campaign.CA_Year)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(campaign.CA_Budget, campaign.CA_Currency)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    {formatDate(campaign.CA_Start_Date)} - {formatDate(campaign.CA_End_Date)}
                  </div>

                  <div className="text-xs text-gray-500">
                    {t('campaigns.table.identifierShort')}: {campaign.CA_Campaign_Identifier}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}