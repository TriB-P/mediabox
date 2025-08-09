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
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

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
   * Composant carte métrique réutilisable avec couleurs
   */
  const MetricCard = ({ 
    title, 
    value, 
    rawValue, 
    fieldName, 
    subtitle,
    color = 'gray'
  }: { 
    title: string; 
    value: string; 
    rawValue: string | number | undefined;
    fieldName: string;
    subtitle?: string;
    color?: 'blue' | 'green' | 'purple' | 'gray';
  }) => {
    const isCopied = copiedField === fieldName;
    const hasValue = rawValue !== undefined && rawValue !== null && rawValue !== '';

    const colorClasses = {
      blue: 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-white',
      green: 'border-l-green-500 bg-gradient-to-r from-green-50 to-white', 
      purple: 'border-l-purple-500 bg-gradient-to-r from-purple-50 to-white',
      gray: 'border-l-gray-500 bg-gradient-to-r from-gray-50 to-white'
    };

    const buttonColorClasses = {
      blue: isCopied ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800',
      green: isCopied ? 'bg-green-100 text-green-600' : 'bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-800',
      purple: isCopied ? 'bg-purple-100 text-purple-600' : 'bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-800',
      gray: isCopied ? 'bg-green-100 text-green-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
    };

    return (
      <div className={`p-4 rounded-lg border-l-4 border-gray-200 shadow-sm ${colorClasses[color]}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
          {hasValue && (
            <button
              onClick={() => copyToClipboard(rawValue, fieldName)}
              className={`p-1.5 rounded-md transition-all duration-200 ${buttonColorClasses[color]}`}
              title={isCopied ? 'Copié !' : 'Copier la valeur'}
            >
              {isCopied ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <ClipboardDocumentIcon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        
        <div className="space-y-1">
          <div className={`text-2xl font-bold ${hasValue ? 'text-gray-900' : 'text-gray-400'}`}>
            {value}
          </div>
          
          {subtitle && (
            <div className="text-xs text-gray-500">
              {subtitle}
            </div>
          )}
          
          {isCopied && (
            <div className="text-xs text-green-600 font-medium">
              ✓ Copié dans le presse-papiers
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!selectedTactique) {
    return (
      <div className="bg-white p-6 rounded-lg shadow h-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Informations de la tactique
        </h3>
        
        <div className="flex items-center justify-center h-32 text-gray-500 text-center">
          <div>
            <p className="text-sm">Aucune tactique sélectionnée</p>
            <p className="text-xs mt-1">Sélectionnez une tactique pour voir ses métriques</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Informations de la tactique
            </h3>
            <p className="text-sm text-gray-600 mt-1 truncate">
              {selectedTactique.TC_Label || 'Tactique sans nom'}
            </p>
          </div>
          
          {selectedTactique.TC_Buy_Type && (
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
      </div>
      
      {/* Trois cartes métriques avec couleurs */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="Budget Média"
          value={formatCurrency(selectedTactique.TC_Media_Budget, selectedTactique.TC_Buy_Currency)}
          rawValue={selectedTactique.TC_Media_Budget}
          fieldName="budget"
          subtitle={selectedTactique.TC_Buy_Currency ? `Devise: ${selectedTactique.TC_Buy_Currency}` : undefined}
          color="blue"
        />
        
        <MetricCard
          title="Taux CM360"
          value={formatCurrency(selectedTactique.TC_CM360_Rate, selectedTactique.TC_Buy_Currency)}
          rawValue={selectedTactique.TC_CM360_Rate}
          fieldName="rate"
          subtitle={selectedTactique.TC_Buy_Currency ? `Devise: ${selectedTactique.TC_Buy_Currency}` : "Montant"}
          color="green"
        />
        
        <MetricCard
          title="Volume CM360"
          value={formatNumber(selectedTactique.TC_CM360_Volume)}
          rawValue={selectedTactique.TC_CM360_Volume}
          fieldName="volume"
          subtitle="Unités"
          color="purple"
        />
      </div>
      
      {/* Zone d'information */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          Cliquez sur l'icône de copie pour copier une valeur dans le presse-papiers.
        </p>
      </div>
    </div>
  );
}