// app/components/Campaigns/CampaignTable.tsx

'use client';

import React, { Fragment, useEffect, useState } from 'react';
import { Campaign } from '../../types/campaign';
import CampaignActions from './CampaignActions';
import CampaignVersions from './CampaignVersions'; // Importer le composant des versions
import { useClient } from '../../contexts/ClientContext';
import { getClientList, ShortcodeItem } from '../../lib/listService';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
  const [divisions, setDivisions] = useState<ShortcodeItem[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    const loadDivisions = async () => {
      if (!selectedClient) return;
      
      try {
        const divisionsData = await getClientList('CA_Division', selectedClient.clientId)
          .catch(() => getClientList('CA_Division', 'PlusCo'));
        
        setDivisions(divisionsData);
      } catch (error) {
        console.warn('Impossible de charger les divisions:', error);
      }
    };

    loadDivisions();
  }, [selectedClient]);
  
  const formatCurrency = (amount: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDivisionName = (divisionId: string | undefined): string => {
    if (!divisionId) return '';
    const division = divisions.find(d => d.id === divisionId);
    return division ? division.SH_Display_Name_FR || division.SH_Code || divisionId : divisionId;
  };

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
            Aucune campagne
          </h3>
          <p className="text-gray-500">
            Commencez par créer votre première campagne.
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
                Nom / Identifiant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Période
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
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
                    {campaign.CA_Quarter} {campaign.CA_Year}
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
                      {campaign.CA_Quarter} {campaign.CA_Year}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(campaign.CA_Budget, campaign.CA_Currency)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {formatDate(campaign.CA_Start_Date)} - {formatDate(campaign.CA_End_Date)}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    ID: {campaign.CA_Campaign_Identifier}
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