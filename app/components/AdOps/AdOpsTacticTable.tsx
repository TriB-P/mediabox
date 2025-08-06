// app/components/AdOps/AdOpsTable.tsx
/**
 * Composant AdOpsTable
 * Ce composant affiche un tableau simple pour les données AdOps.
 * Il présente les tactiques et leurs métriques de performance.
 */
'use client';

import React from 'react';
import { Campaign } from '../../types/campaign';

interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

interface AdOpsTableProps {
  selectedCampaign: Campaign;
  selectedVersion: Version;
}

/**
 * Composant principal pour le tableau AdOps.
 * Affiche les données des tactiques sous forme de tableau.
 *
 * @param {AdOpsTableProps} props - Les propriétés du composant
 * @returns {JSX.Element} Le composant AdOpsTable
 */
export default function AdOpsTable({ 
  selectedCampaign, 
  selectedVersion 
}: AdOpsTableProps) {

  // Données d'exemple
  const tableData = [
    { id: 1, name: 'Display Banner', status: 'Actif', budget: 15000, spent: 12500, impressions: 450000 },
    { id: 2, name: 'Video Pre-Roll', status: 'Actif', budget: 25000, spent: 18750, impressions: 320000 },
    { id: 3, name: 'Social Media', status: 'Pause', budget: 10000, spent: 8200, impressions: 180000 },
    { id: 4, name: 'Search Ads', status: 'Actif', budget: 18000, spent: 15600, impressions: 520000 },
    { id: 5, name: 'Native Ads', status: 'Inactif', budget: 8000, spent: 2100, impressions: 95000 },
  ];

  /**
   * Formate un montant en devise
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: selectedCampaign?.CA_Currency || 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  /**
   * Formate un nombre avec séparateurs
   */
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-CA').format(num);
  };

  /**
   * Retourne la classe CSS pour le statut
   */
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Actif':
        return 'bg-green-100 text-green-800';
      case 'Pause':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inactif':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Adops Table
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tactique
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dépensé
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impressions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(row.budget)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(row.spent)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(row.impressions)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Zone d'information */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          Ce tableau affiche les tactiques AdOps et leurs performances.
        </p>
      </div>
    </div>
  );
}