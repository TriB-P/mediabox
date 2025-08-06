// app/components/AdOps/AdOpsTacticInfo.tsx
/**
 * Composant AdOpsTacticInfo
 * Ce composant affiche les informations tactiques et métriques
 * pour les opérations AdOps de la campagne sélectionnée.
 * Il fournit un aperçu des performances et statistiques clés.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  EyeIcon, 
  CursorArrowRaysIcon 
} from '@heroicons/react/24/outline';
import { Campaign } from '../../types/campaign';

interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

interface AdOpsTacticInfoProps {
  selectedCampaign: Campaign;
  selectedVersion: Version;
}

/**
 * Composant principal pour l'affichage des informations tactiques AdOps.
 * Présente les métriques clés et performances de la campagne.
 *
 * @param {AdOpsTacticInfoProps} props - Les propriétés du composant
 * @returns {JSX.Element} Le composant AdOpsTacticInfo
 */
export default function AdOpsTacticInfo({ 
  selectedCampaign, 
  selectedVersion 
}: AdOpsTacticInfoProps) {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalSpend: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
  });

  useEffect(() => {
    // Logique de chargement des métriques tactiques
    if (selectedCampaign && selectedVersion) {
      setLoading(true);
      // TODO: Charger les métriques réelles depuis Firebase
      setTimeout(() => {
        // Simulation de données
        setMetrics({
          totalSpend: Math.floor(Math.random() * 50000),
          impressions: Math.floor(Math.random() * 1000000),
          clicks: Math.floor(Math.random() * 10000),
          ctr: Math.random() * 5,
        });
        setLoading(false);
      }, 1000);
    }
  }, [selectedCampaign, selectedVersion]);

  /**
   * Formate un montant en devise
   * @param {number} amount - Montant à formater
   * @returns {string} Montant formaté
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
   * @param {number} num - Nombre à formater
   * @returns {string} Nombre formaté
   */
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-CA').format(Math.floor(num));
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Adops Tactic Info
      </h3>
      
      {/* Grille des métriques */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Dépenses totales */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Dépenses</p>
              <p className="text-lg font-bold text-blue-900">
                {formatCurrency(metrics.totalSpend)}
              </p>
            </div>
          </div>
        </div>

        {/* Impressions */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Impressions</p>
              <p className="text-lg font-bold text-green-900">
                {formatNumber(metrics.impressions)}
              </p>
            </div>
          </div>
        </div>

        {/* Clics */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CursorArrowRaysIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Clics</p>
              <p className="text-lg font-bold text-yellow-900">
                {formatNumber(metrics.clicks)}
              </p>
            </div>
          </div>
        </div>

        {/* CTR */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">CTR</p>
              <p className="text-lg font-bold text-purple-900">
                {metrics.ctr.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Zone d'information */}
      <div className="p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          Ce composant affiche les informations et métriques tactiques de la campagne.
        </p>
        <div className="mt-2 text-xs text-gray-500">
          Budget total: {formatCurrency(selectedCampaign.CA_Budget)}<br />
          Devise: {selectedCampaign.CA_Currency || 'CAD'}
        </div>
      </div>
    </div>
  );
}