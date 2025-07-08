// app/components/Tactiques/TactiquesBudgetPanel.tsx - AVEC ONGLETS
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  CurrencyDollarIcon,
  ChartPieIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Campaign } from '../../types/campaign';
import { Section, Tactique, Onglet } from '../../types/tactiques';
import { ClientFee } from '../../lib/budgetService';

interface TactiquesBudgetPanelProps {
  selectedCampaign: Campaign | null;
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  selectedOnglet: Onglet | null;
  onglets: Onglet[];
  formatCurrency: (amount: number) => string;
  clientFees?: ClientFee[];
}

type DisplayScope = 'currentTab' | 'allTabs';
type PanelTab = 'totals' | 'indicators';

// ==================== COMPOSANT DONUT CHART ====================
interface DonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  size?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, size = 120 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div 
        className="flex items-center justify-center rounded-full bg-gray-100"
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-500">Aucune donnée</span>
      </div>
    );
  }

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercentage = 0;
  const pathData = data.map(item => {
    const percentage = (item.value / total) * 100;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
    
    cumulativePercentage += percentage;
    
    return {
      ...item,
      percentage,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        
        {pathData.map((item, index) => (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth={strokeWidth}
            strokeDasharray={item.strokeDasharray}
            strokeDashoffset={item.strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        ))}
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg font-bold text-gray-900">
          {data.length}
        </div>
        <div className="text-xs text-gray-500">
          sections
        </div>
      </div>
    </div>
  );
};

// ==================== COMPOSANT VUE TOTAUX ====================
interface BudgetTotalsViewProps {
  selectedCampaign: Campaign;
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  formatCurrency: (amount: number) => string;
  clientFees: ClientFee[];
  displayScope: DisplayScope;
  setDisplayScope: (scope: DisplayScope) => void;
}

const BudgetTotalsView: React.FC<BudgetTotalsViewProps> = ({
  selectedCampaign,
  sections,
  tactiques,
  formatCurrency,
  clientFees,
  displayScope,
  setDisplayScope,
}) => {
  const [showFeeDetails, setShowFeeDetails] = useState(false);
  const [showSectionBreakdown, setShowSectionBreakdown] = useState(true);

  const filteredSections = useMemo(() => {
    if (displayScope === 'currentTab') {
      return sections;
    }
    return sections;
  }, [sections, displayScope]);

  const allTactiquesInScope = useMemo(() => {
    const relevantTactiqueIds = new Set<string>();
    filteredSections.forEach(section => {
      (tactiques[section.id] || []).forEach(tactique => {
        relevantTactiqueIds.add(tactique.id);
      });
    });

    return Object.values(tactiques).flat().filter(t => relevantTactiqueIds.has(t.id));
  }, [filteredSections, tactiques]);

  const calculateTotals = useCallback(() => {
    let totalMediaBudgetInput = 0;
    let totalMediaBudgetWithBonification = 0;
    let totalClientBudget = 0;
    let totalBonification = 0;
    
    const rawFeeTotals: { [key: string]: number } = {};

    allTactiquesInScope.forEach(tactique => {
      totalMediaBudgetInput += tactique.TC_Budget || 0; 
      totalMediaBudgetWithBonification += (tactique as any).TC_Media_Budget || 0;
      totalClientBudget += (tactique as any).TC_Client_Budget || 0;
      totalBonification += (tactique as any).TC_Bonification || 0;

      for (let i = 1; i <= 5; i++) {
        const feeValueKey = `TC_Fee_${i}_Value`;
        rawFeeTotals[feeValueKey] = (rawFeeTotals[feeValueKey] || 0) + ((tactique as any)[feeValueKey] || 0);
      }
    });

    const totalFees = Object.values(rawFeeTotals).reduce((sum, current) => sum + current, 0);

    return {
      totalMediaBudgetInput,
      totalMediaBudgetWithBonification,
      totalClientBudget,
      totalBonification,
      rawFeeTotals,
      totalFees,
    };
  }, [allTactiquesInScope]);

  const totals = useMemo(() => calculateTotals(), [calculateTotals]);

  const sectionBudgets = useMemo(() => {
    const budgets: { name: string; amount: number; percentage: number; color: string }[] = [];
    let grandTotalForPercentages = 0;

    if (selectedCampaign) {
      grandTotalForPercentages = totals.totalClientBudget > 0 ? totals.totalClientBudget : totals.totalMediaBudgetInput;
    }

    filteredSections.forEach(section => {
      const sectionAmount = (tactiques[section.id] || []).reduce((sum, t) => sum + t.TC_Budget, 0);
      budgets.push({
        name: section.SECTION_Name,
        amount: sectionAmount,
        percentage: grandTotalForPercentages > 0 ? (sectionAmount / grandTotalForPercentages) * 100 : 0,
        color: section.SECTION_Color || '#6366f1',
      });
    });
    return budgets.sort((a, b) => b.amount - a.amount);
  }, [filteredSections, selectedCampaign, tactiques, totals.totalClientBudget, totals.totalMediaBudgetInput]);

  const getFeeNameByKey = useCallback((feeKey: string) => {
    const match = feeKey.match(/TC_Fee_(\d+)_Value/);
    if (!match) return feeKey;

    const feeNumber = parseInt(match[1], 10);
    
    if (!clientFees || !Array.isArray(clientFees) || clientFees.length === 0) {
      return `Frais ${feeNumber}`;
    }
    
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    const feeIndex = feeNumber - 1;
    
    if (feeIndex >= 0 && feeIndex < sortedFees.length) {
      return sortedFees[feeIndex].FE_Name;
    }
    
    return `Frais ${feeNumber}`;
  }, [clientFees]);

  const difference = selectedCampaign.CA_Budget - totals.totalClientBudget;

  return (
    <div className="space-y-4">
      {/* Scope selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Afficher le budget pour:
        </label>
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setDisplayScope('currentTab')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border border-gray-300
              ${displayScope === 'currentTab' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Onglet actuel
          </button>
          <button
            type="button"
            onClick={() => setDisplayScope('allTabs')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border border-gray-300 border-l-0
              ${displayScope === 'allTabs' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Tous les onglets
          </button>
        </div>
      </div>

      {/* Main Budget Summary */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800">Totaux</h4>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Budget de la campagne:</span>
            <span className="font-medium">{formatCurrency(selectedCampaign.CA_Budget)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Budget média:</span>
            <span className="font-medium">{formatCurrency(totals.totalMediaBudgetWithBonification)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Bonification:</span>
            <span className="font-medium text-green-700">+{formatCurrency(totals.totalBonification)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Frais:</span>
            <span className="font-medium text-blue-700">+{formatCurrency(totals.totalFees)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2 mt-2">
            <span>Budget client total:</span>
            <span>{formatCurrency(totals.totalClientBudget)}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2" style={{ borderTop: '1px dashed #e5e7eb' }}>
            <span className="text-gray-600">Différence:</span>
            <span className={`font-medium ${difference < 0 ? 'text-red-700' : 'text-green-700'}`}>
              {formatCurrency(difference)}
            </span>
          </div>
        </div>
      </div>

      {/* Fee Details */}
      <div className="border border-gray-200 rounded-lg">
        <button
          className="flex justify-between items-center w-full p-3 bg-gray-50 border-b border-gray-200 focus:outline-none"
          onClick={() => setShowFeeDetails(!showFeeDetails)}
        >
          <h4 className="text-sm font-semibold text-gray-800">Détail des frais</h4>
          {showFeeDetails ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {showFeeDetails && (
          <div className="p-3 space-y-2">
            {Object.entries(totals.rawFeeTotals)
                .filter(([, amount]) => amount > 0)
                .map(([feeKey, amount]) => (
                <div key={feeKey} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{getFeeNameByKey(feeKey)}:</span>
                    <span className="font-medium text-blue-700">{formatCurrency(amount)}</span>
                </div>
            ))}
            {Object.keys(totals.rawFeeTotals).length === 0 || Object.values(totals.rawFeeTotals).every(amount => amount === 0) ? (
                <p className="text-sm text-gray-500 italic">Aucun frais appliqué.</p>
            ) : null}
          </div>
        )}
      </div>

      {/* Budget Split by Section with Donut Chart */}
      <div className="border border-gray-200 rounded-lg">
        <button
          className="flex justify-between items-center w-full p-3 bg-gray-50 border-b border-gray-200 focus:outline-none"
          onClick={() => setShowSectionBreakdown(!showSectionBreakdown)}
        >
          <h4 className="text-sm font-semibold text-gray-800">Répartition par section</h4>
          <div className="flex items-center gap-2">
            <ChartPieIcon className="h-4 w-4 text-gray-500" />
            {showSectionBreakdown ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </button>
        {showSectionBreakdown && (
          <div className="p-3">
            {sectionBudgets.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <DonutChart 
                    data={sectionBudgets.map(section => ({
                      name: section.name,
                      value: section.amount,
                      color: section.color
                    }))}
                    size={100}
                  />
                </div>
                
                <div className="space-y-2">
                  {sectionBudgets.map(section => (
                    <div key={section.name} className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: section.color }}
                        ></span>
                        <span className="text-gray-600">{section.name}:</span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(section.amount)} ({section.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Aucune section ou budget défini.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== COMPOSANT VUE INDICATEURS ====================
interface BudgetIndicatorsViewProps {
  selectedCampaign: Campaign;
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  formatCurrency: (amount: number) => string;
}

const BudgetIndicatorsView: React.FC<BudgetIndicatorsViewProps> = ({
  selectedCampaign,
  sections,
  tactiques,
  formatCurrency,
}) => {
  return (
    <div className="space-y-4">
      {/* Placeholder pour les indicateurs */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800">Indicateurs de performance</h4>
        </div>
        <div className="p-8 text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Indicateurs</h3>
          <p className="text-gray-500 mb-4">
            Les indicateurs de performance seront bientôt disponibles.
          </p>
          <div className="text-sm text-gray-400">
            🚧 En construction
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================
const TactiquesBudgetPanel: React.FC<TactiquesBudgetPanelProps> = ({
  selectedCampaign,
  sections,
  tactiques,
  selectedOnglet,
  onglets,
  formatCurrency,
  clientFees = [],
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('totals');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('currentTab');

  if (!selectedCampaign) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 text-center text-gray-500">
        Sélectionnez une campagne pour voir le budget.
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-lg overflow-hidden">
      {/* Header avec onglets */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Budget</h3>
          <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
        </div>
        
        {/* Onglets */}
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('totals')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md border border-gray-300 flex items-center justify-center
              ${activeTab === 'totals' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            Totaux
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('indicators')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md border border-gray-300 border-l-0 flex items-center justify-center
              ${activeTab === 'indicators' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            <ChartBarIcon className="h-4 w-4 mr-1" />
            Indicateurs
          </button>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'totals' && (
          <BudgetTotalsView
            selectedCampaign={selectedCampaign}
            sections={sections}
            tactiques={tactiques}
            formatCurrency={formatCurrency}
            clientFees={clientFees}
            displayScope={displayScope}
            setDisplayScope={setDisplayScope}
          />
        )}
        
        {activeTab === 'indicators' && (
          <BudgetIndicatorsView
            selectedCampaign={selectedCampaign}
            sections={sections}
            tactiques={tactiques}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  );
};

export default TactiquesBudgetPanel;