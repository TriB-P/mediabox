// app/components/Campaigns/CampaignTable.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { Campaign } from '../../types/campaign';
import CampaignActions from './CampaignActions';
import { useClient } from '../../contexts/ClientContext';
import { getClientList, ShortcodeItem } from '../../lib/listService';

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

  // Charger les divisions
  useEffect(() => {
    const loadDivisions = async () => {
      if (!selectedClient) return;
      
      try {
        const divisionsData = await getClientList('CA_Division', selectedClient.clientId)
          .catch(() => getClientList('CA_Division', 'PlusCo'));
        
        setDivisions(divisionsData);
        console.log(`${divisionsData.length} divisions chargées`);
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
    return new Date(dateString).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Fonction pour obtenir le nom d'affichage de la division
  const getDivisionName = (divisionId: string | undefined): string => {
    if (!divisionId) return '';
    
    const division = divisions.find(d => d.id === divisionId);
    if (division) {
      return division.SH_Display_Name_FR || division.SH_Code || divisionId;
    }
    
    return divisionId; // Fallback sur l'ID si pas trouvé
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
      {/* Version desktop */}
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
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
            {campaigns.map((campaign) => {
              const divisionName = getDivisionName(campaign.division);
              
              return (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.name}
                      </div>
                      {divisionName && (
                        <div className="text-sm text-gray-500">
                          {divisionName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.quarter} {campaign.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(campaign.budget, campaign.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Version mobile */}
      <div className="md:hidden">
        <div className="divide-y divide-gray-200">
          {campaigns.map((campaign) => {
            const divisionName = getDivisionName(campaign.division);
            
            return (
              <div key={campaign.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate flex-1">
                    {campaign.name}
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
                      {campaign.quarter} {campaign.year}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(campaign.budget, campaign.currency)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                  </div>
                  
                  {divisionName && (
                    <div className="text-xs text-gray-500">
                      Division: {divisionName}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}