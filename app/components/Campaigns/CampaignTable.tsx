// app/components/Campaigns/CampaignTable.tsx
/**
 * Ce composant affiche une liste de campagnes sous forme de tableau simplifié (Nom, Trimestre, Budget)
 * avec des filtres par division et année. Il permet de visualiser les informations principales
 * de chaque campagne et d'accéder à des actions. Il gère également l'expansion des lignes
 * pour afficher les versions de campagne.
 */
'use client';

import React, { Fragment, useState, useMemo, useEffect } from 'react';
import { Campaign } from '../../types/campaign';
import CampaignActions from './CampaignActions';
import CampaignVersions from './CampaignVersions';
import { useClient } from '../../contexts/ClientContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getListForClient, ShortcodeItem } from '../../lib/cacheService';

interface CampaignTableProps {
  campaigns: Campaign[];
  clientId: string;
  onEdit: (campaign: Campaign) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export default function CampaignTable({
  campaigns,
  clientId,
  onEdit,
  onRefresh,
  loading = false
}: CampaignTableProps) {
  const { selectedClient } = useClient();
  const { t, language } = useTranslation();
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  // États des filtres
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // États pour les shortcodes depuis le cache
  const [divisionsMap, setDivisionsMap] = useState<Map<string, string>>(new Map());
  const [quartersMap, setQuartersMap] = useState<Map<string, string>>(new Map());
  const [yearsMap, setYearsMap] = useState<Map<string, string>>(new Map());

  // Charger les shortcodes depuis le cache
  useEffect(() => {
    if (!selectedClient) return;

    const loadShortcodesFromCache = () => {
      console.log(`[CACHE] Chargement des shortcodes pour client ${selectedClient.clientId}`);

      // Charger CA_Division
      const divisions = getListForClient('CA_Division', selectedClient.clientId);
      if (divisions) {
        const divMap = new Map<string, string>();
        divisions.forEach(item => {
          divMap.set(item.id, item.SH_Display_Name_FR || item.SH_Code || item.id);
        });
        setDivisionsMap(divMap);
        console.log(`[CACHE] ✅ CA_Division chargé: ${divisions.length} éléments`);
      }

      // Charger CA_Quarter
      const quarters = getListForClient('CA_Quarter', selectedClient.clientId);
      if (quarters) {
        const quarterMap = new Map<string, string>();
        quarters.forEach(item => {
          quarterMap.set(item.id, item.SH_Display_Name_FR || item.SH_Code || item.id);
        });
        setQuartersMap(quarterMap);
        console.log(`[CACHE] ✅ CA_Quarter chargé: ${quarters.length} éléments`);
      }

      // Charger CA_Year
      const years = getListForClient('CA_Year', selectedClient.clientId);
      if (years) {
        const yearMap = new Map<string, string>();
        years.forEach(item => {
          yearMap.set(item.id, item.SH_Display_Name_FR || item.SH_Code || item.id);
        });
        setYearsMap(yearMap);
        console.log(`[CACHE] ✅ CA_Year chargé: ${years.length} éléments`);
      }
    };

    loadShortcodesFromCache();
  }, [selectedClient]);

  // Extraire les valeurs uniques des campagnes
  const uniqueDivisions = useMemo(() => {
    const divisions = [...new Set(campaigns.map(c => c.CA_Division).filter(Boolean))];
    return divisions.sort();
  }, [campaigns]);

  const uniqueYears = useMemo(() => {
    const years = [...new Set(campaigns.map(c => c.CA_Year).filter(Boolean))];
    return years.sort();
  }, [campaigns]);

  // Filtrage des campagnes selon les filtres sélectionnés
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Filtrer par division
    if (selectedDivision) {
      filtered = filtered.filter(campaign => campaign.CA_Division === selectedDivision);
    }

    // Filtrer par année
    if (selectedYear) {
      filtered = filtered.filter(campaign => campaign.CA_Year === selectedYear);
    }

    return filtered;
  }, [campaigns, selectedDivision, selectedYear]);

  const formatCurrency = (amount: number, currency: string = 'CAD') => {
    const locale = language === 'fr' ? 'fr-CA' : 'en-CA';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fonctions pour récupérer les noms d'affichage depuis le cache
  const getDivisionDisplayName = (divisionId: string | undefined): string => {
    if (!divisionId) return '';
    return divisionsMap.get(divisionId) || divisionId;
  };

  const getQuarterDisplayName = (quarterId: string | undefined): string => {
    if (!quarterId) return '';
    return quartersMap.get(quarterId) || quarterId;
  };

  const getYearDisplayName = (yearId: string | undefined): string => {
    if (!yearId) return '';
    return yearsMap.get(yearId) || yearId;
  };

  const toggleRow = (campaignId: string) => {
    setExpandedRowId(prevId => (prevId === campaignId ? null : campaignId));
  };

  const resetFilters = () => {
    setSelectedDivision('');
    setSelectedYear('');
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

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Filtres */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtre par Division */}
          <div className="flex items-center gap-2">
            <label htmlFor="division-filter" className="text-sm font-medium text-gray-700">
              Division:
            </label>
            <select
              id="division-filter"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="block w-40 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{t('common.all') || 'Toutes'}</option>
              {uniqueDivisions.map((division) => (
                <option key={division} value={division}>
                  {getDivisionDisplayName(division)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par Année */}
          <div className="flex items-center gap-2">
            <label htmlFor="year-filter" className="text-sm font-medium text-gray-700">
              Année:
            </label>
            <select
              id="year-filter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="block w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{t('common.all') || 'Toutes'}</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {getYearDisplayName(year)}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton Reset */}
          {(selectedDivision || selectedYear) && (
            <button
              onClick={resetFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700 underline"
            >
              {t('common.clearFilters') || 'Effacer les filtres'}
            </button>
          )}

          {/* Compteur */}
          <div className="ml-auto text-sm text-gray-500">
            {filteredCampaigns.length} / {campaigns.length} campagnes
          </div>
        </div>
      </div>

      {filteredCampaigns.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {campaigns.length === 0 ? t('campaigns.table.noCampaignsTitle') || 'Aucune campagne' : 'Aucune campagne ne correspond aux filtres'}
          </h3>
          <p className="text-gray-500">
            {campaigns.length === 0 
              ? t('campaigns.table.noCampaignsMessage') || 'Créez votre première campagne' 
              : 'Modifiez vos critères de filtrage pour voir plus de résultats.'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('campaigns.table.name') || 'Nom'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('campaigns.table.quarter') || 'Trimestre'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('campaigns.table.budget') || 'Budget'}
                    </th>
                    
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCampaigns.map((campaign) => (
                    <Fragment key={campaign.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-4 w-12">
                          <button onClick={() => toggleRow(campaign.id)} className="text-gray-400 hover:text-gray-600">
                            {expandedRowId === campaign.id ? (
                              <ChevronDownIcon className="h-5 w-5" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 break-words">
                              {campaign.CA_Name}
                            </div>
                            <div className="text-sm text-gray-500 break-words">
                              {campaign.CA_Campaign_Identifier}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getQuarterDisplayName(campaign.CA_Quarter)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(campaign.CA_Budget, campaign.CA_Currency)}
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
                          <td colSpan={5} className="p-0">
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
          </div>

          <div className="md:hidden">
            <div className="divide-y divide-gray-200">
              {filteredCampaigns.map((campaign) => (
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
                        {getQuarterDisplayName(campaign.CA_Quarter)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(campaign.CA_Budget, campaign.CA_Currency)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500">
                      {t('campaigns.table.identifierShort') || 'ID'}: {campaign.CA_Campaign_Identifier}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}