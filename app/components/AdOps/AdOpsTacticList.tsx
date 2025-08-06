// app/components/AdOps/AdOpsTacticList.tsx
/**
 * Composant AdOpsTacticList
 * Ce composant affiche une liste des tactiques disponibles
 * pour les opérations AdOps de la campagne sélectionnée.
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

interface AdOpsTacticListProps {
  selectedCampaign: Campaign;
  selectedVersion: Version;
}

/**
 * Composant principal pour la liste des tactiques AdOps.
 * Affiche les tactiques disponibles sous forme de liste.
 *
 * @param {AdOpsTacticListProps} props - Les propriétés du composant
 * @returns {JSX.Element} Le composant AdOpsTacticList
 */
export default function AdOpsTacticList({ 
  selectedCampaign, 
  selectedVersion 
}: AdOpsTacticListProps) {

  // Données d'exemple des tactiques
  const tactics = [
    { id: 1, name: 'Display Banner', type: 'Display', status: 'Actif' },
    { id: 2, name: 'Video Pre-Roll', type: 'Video', status: 'Actif' },
    { id: 3, name: 'Social Media', type: 'Social', status: 'Pause' },
    { id: 4, name: 'Search Ads', type: 'Search', status: 'Actif' },
    { id: 5, name: 'Native Ads', type: 'Native', status: 'Inactif' },
    { id: 6, name: 'Retargeting', type: 'Display', status: 'Actif' },
  ];

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
        Adop Tactic List
      </h3>
      
      <div className="space-y-3">
        {tactics.map((tactic) => (
          <div 
            key={tactic.id} 
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {tactic.name}
              </h4>
              <p className="text-xs text-gray-500">
                {tactic.type}
              </p>
            </div>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(tactic.status)}`}>
              {tactic.status}
            </span>
          </div>
        ))}
      </div>

      {/* Zone d'information */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          Cette liste affiche les tactiques disponibles pour la campagne.
        </p>
      </div>
    </div>
  );
}