// app/components/AdOps/AdOpsTacticInfo.tsx
/**
 * Composant AdOpsTacticInfo
 * Ce composant affiche trois cartes métriques pour une tactique sélectionnée :
 * Budget média, taux CM360 et volume CM360.
 * Chaque métrique peut être copiée en un clic.
 * REMPLACE : L'ancienne version avec les métriques simulées
 */
'use client';

import React, { useState } from 'react';

interface AdOpsTactique {
  id: string;
  TC_Label?: string;
  TC_Media_Budget?: number;
  TC_Buy_Currency?: string;
  TC_CM360_Rate?: number;
  TC_CM360_Volume?: number;
  TC_Buy_Type?: string;
}

interface AdOpsTacticInfoProps {
  selectedTactique: AdOpsTactique | null;
}

/**
 * Composant principal pour afficher les informations de la tactique sélectionnée.
 * Présente les métriques sous forme de cartes avec fonctionnalité de copie.
 *
 * @param {AdOpsTacticInfoProps} props - Les propriétés du composant
 * @returns {JSX.Element} Le composant AdOpsTacticInfo
 */
export default function AdOpsTacticInfo({ selectedTactique }: AdOpsTacticInfoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  /**
   * Copie une valeur dans le presse-papiers avec feedback visuel
   */
  const copyToClipboard = async (value: string | number | undefined, fieldName: string) => {
    if (value === undefined || value === null) return;
    
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(fieldName);
      
      // Reset feedback après 2 secondes
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  /**
   * Formate un nombre avec séparateurs
   */
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    return new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 2 }).format(num);
  };

  /**
   * Formate un montant avec devise
   */
  const formatCurrency = (amount: number | undefined, currency: string | undefined): string => {
    if (amount === undefined || amount === null) return 'N/A';
    
    const formattedAmount = formatNumber(amount);
    const currencySymbol = currency || 'CAD';
    
    return `${formattedAmount} ${currencySymbol}`;
  };

  /**
   * Composant carte métrique réutilisable et compacte
   */
  const MetricCard = ({ 
    title, 
    value, 
    rawValue, 
    fieldName, 
    color = 'gray'
  }: { 
    title: string; 
    value: string; 
    rawValue: string | number | undefined;
    fieldName: string;
    color?: 'blue' | 'green' | 'purple' | 'gray';
  }) => {
    const isCopied = copiedField === fieldName;
    const hasValue = rawValue !== undefined && rawValue !== null && rawValue !== '';

    const colorClasses = {
      blue: 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100',
      green: 'border-l-green-500 bg-gradient-to-r from-green-50 to-white hover:from-green-100', 
      purple: 'border-l-purple-500 bg-gradient-to-r from-purple-50 to-white hover:from-purple-100',
      gray: 'border-l-gray-500 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100'
    };

    return (
      <div 
        className={`
          p-2 rounded border-l-4 border-gray-200 shadow-sm cursor-pointer transition-all duration-200
          ${colorClasses[color]}
          ${!hasValue ? 'cursor-not-allowed opacity-50' : ''}
        `}
        onClick={() => hasValue && copyToClipboard(rawValue, fieldName)}
        title={hasValue ? `Cliquer pour copier ${title.toLowerCase()}` : 'Valeur non disponible'}
      >
        <div className="text-xs font-medium text-gray-700 mb-1">{title}</div>
        <div className={`text-lg font-bold ${hasValue ? 'text-gray-900' : 'text-gray-400'}`}>
          {value}
        </div>
        
        {isCopied && (
          <div className="text-xs text-green-600 font-medium mt-1">
            ✓ Copié
          </div>
        )}
      </div>
    );
  };

  if (!selectedTactique) {
    return (
      <div className="bg-white p-3 rounded-lg shadow">
        <div className="flex items-center justify-center h-16 text-gray-500 text-center">
          <p className="text-sm">Aucune tactique sélectionnée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded-lg shadow">
      {/* En-tête compact avec badges */}
      <div className="flex items-center justify-end gap-2 mb-3">
        {selectedTactique.TC_Buy_Currency && (
          <div className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
            {selectedTactique.TC_Buy_Currency}
          </div>
        )}
        
        {selectedTactique.TC_Buy_Type && (
          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
            selectedTactique.TC_Buy_Type === 'CPM' 
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : selectedTactique.TC_Buy_Type === 'CPC'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}>
            {selectedTactique.TC_Buy_Type}
          </div>
        )}
      </div>
      
      {/* Trois cartes métriques compactes */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          title="Budget Média"
          value={formatCurrency(selectedTactique.TC_Media_Budget, selectedTactique.TC_Buy_Currency)}
          rawValue={selectedTactique.TC_Media_Budget}
          fieldName="budget"
          color="blue"
        />
        
        <MetricCard
          title="Taux CM360"
          value={formatCurrency(selectedTactique.TC_CM360_Rate, selectedTactique.TC_Buy_Currency)}
          rawValue={selectedTactique.TC_CM360_Rate}
          fieldName="rate"
          color="green"
        />
        
        <MetricCard
          title="Volume CM360"
          value={formatNumber(selectedTactique.TC_CM360_Volume)}
          rawValue={selectedTactique.TC_CM360_Volume}
          fieldName="volume"
          color="purple"
        />
      </div>
    </div>
  );
}