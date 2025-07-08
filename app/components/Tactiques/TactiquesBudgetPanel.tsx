// app/components/Tactiques/TactiquesBudgetPanel.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  CurrencyDollarIcon,
  ChartPieIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { Campaign } from '../../types/campaign';
import { Section, Tactique, Onglet } from '../../types/tactiques';
import { ClientFee } from '../../lib/budgetService'; // Import ClientFee type

interface TactiquesBudgetPanelProps {
  selectedCampaign: Campaign | null;
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  selectedOnglet: Onglet | null;
  onglets: Onglet[];
  formatCurrency: (amount: number) => string;
  clientFees: ClientFee[]; // NEW: Pass clientFees to the panel
}

type DisplayScope = 'currentTab' | 'allTabs';

const TactiquesBudgetPanel: React.FC<TactiquesBudgetPanelProps> = ({
  selectedCampaign,
  sections,
  tactiques,
  selectedOnglet,
  onglets,
  formatCurrency,
  clientFees, // NEW
}) => {
  const [displayScope, setDisplayScope] = useState<DisplayScope>('currentTab');
  const [showFeeDetails, setShowFeeDetails] = useState(false);
  const [showSectionBreakdown, setShowSectionBreakdown] = useState(true);

  // Filter sections and tactiques based on displayScope
  const filteredSections = useMemo(() => {
    if (!selectedOnglet) return [];
    if (displayScope === 'currentTab') {
      // In a real application, sections would have an ongletId to filter by
      // For this example, assuming all sections belong to the currently selected onglet
      // or that sections are passed already filtered by onglet from useTactiquesData
      // Given how useTactiquesData loads sections based on selectedOnglet, this should be fine.
      return sections;
    }
    return sections; // All sections if 'allTabs'
  }, [sections, selectedOnglet, displayScope]);

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
    let totalMediaBudgetInput = 0; // Sum of TC_Budget (initial input)
    let totalMediaBudgetWithBonification = 0; // Sum of TC_Media_Budget (after bonification)
    let totalClientBudget = 0; // Sum of TC_Client_Budget (final client cost)
    let totalBonification = 0;
    
    // Use an array to store fee totals by their original key, then map to names
    const rawFeeTotals: { [key: string]: number } = {};

    allTactiquesInScope.forEach(tactique => {
      totalMediaBudgetInput += tactique.TC_Budget || 0; 
      totalMediaBudgetWithBonification += (tactique as any).TC_Media_Budget || 0; // TC_Media_Budget is calculated from the hook
      totalClientBudget += (tactique as any).TC_Client_Budget || 0;
      totalBonification += (tactique as any).TC_Bonification || 0;

      // Sum each fee's value as stored in the tactique object
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
      rawFeeTotals, // Keep raw fee totals by key
      totalFees,
    };
  }, [allTactiquesInScope]);

  const totals = useMemo(() => calculateTotals(), [calculateTotals]);

  const sectionBudgets = useMemo(() => {
    const budgets: { name: string; amount: number; percentage: number; color?: string }[] = [];
    let grandTotalForPercentages = 0;

    if (selectedCampaign) {
      // Use client budget total if available, otherwise media budget
      grandTotalForPercentages = totals.totalClientBudget > 0 ? totals.totalClientBudget : totals.totalMediaBudgetInput;
    }

    filteredSections.forEach(section => {
      const sectionAmount = (tactiques[section.id] || []).reduce((sum, t) => sum + t.TC_Budget, 0);
      budgets.push({
        name: section.SECTION_Name,
        amount: sectionAmount,
        percentage: grandTotalForPercentages > 0 ? (sectionAmount / grandTotalForPercentages) * 100 : 0,
        color: section.SECTION_Color,
      });
    });
    return budgets.sort((a, b) => b.amount - a.amount); // Sort by amount descending
  }, [filteredSections, selectedCampaign, tactiques, totals.totalClientBudget, totals.totalMediaBudgetInput]);

  // Helper to get fee name from clientFees
  const getFeeNameByKey = useCallback((feeKey: string) => {
    // Extract number from key, e.g., "TC_Fee_1_Value" -> 1
    const match = feeKey.match(/TC_Fee_(\d+)_Value/);
    if (!match) return feeKey; // Return original key if format doesn't match

    const feeIndex = parseInt(match[1], 10) - 1; // Convert to 0-based index
    
    // Find the fee by its order or ID (order is more reliable if it corresponds to the TC_Fee_X numbering)
    // Assuming clientFees are sorted by FE_Order
    const fee = clientFees[feeIndex];
    return fee ? fee.FE_Name : `Frais ${match[1]}`; // Fallback to "Frais X"
  }, [clientFees]);

  if (!selectedCampaign) {
    return (
      <div className="p-4 text-center text-gray-500">
        Sélectionnez une campagne pour voir le budget.
      </div>
    );
  }

  const difference = selectedCampaign.CA_Budget - totals.totalClientBudget;

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 flex flex-col shadow-lg overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Résumé du Budget</h3>
        <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
      </div>

      <div className="mb-4">
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
      <div className="border border-gray-200 rounded-lg mb-4">
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800">Totaux</h4>
        </div>
        <div className="p-3 space-y-2">
          {/* Order: Campaign Budget, Media Budget, Bonification, Fees, Client Total, Difference */}
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
            <span className="font-medium text-red-700">+{formatCurrency(totals.totalFees)}</span>
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

      {/* Fee Details (Expandable) */}
      <div className="border border-gray-200 rounded-lg mb-4">
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
                .filter(([, amount]) => amount > 0) // Only show fees with a value
                .map(([feeKey, amount]) => (
                <div key={feeKey} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{getFeeNameByKey(feeKey)}:</span> {/* NEW: Display fee name */}
                    <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
            ))}
            {Object.keys(totals.rawFeeTotals).length === 0 || Object.values(totals.rawFeeTotals).every(amount => amount === 0) ? (
                <p className="text-sm text-gray-500 italic">Aucun frais appliqué.</p>
            ) : null}
          </div>
        )}
      </div>

      {/* Budget Split by Section (Expandable/Pie Chart) */}
      <div className="border border-gray-200 rounded-lg mb-4">
        <button
          className="flex justify-between items-center w-full p-3 bg-gray-50 border-b border-gray-200 focus:outline-none"
          onClick={() => setShowSectionBreakdown(!showSectionBreakdown)}
        >
          <h4 className="text-sm font-semibold text-gray-800">Répartition par section</h4>
          <ChartPieIcon className="h-4 w-4 text-gray-500" />
          {showSectionBreakdown ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {showSectionBreakdown && (
          <div className="p-3 space-y-2">
            {sectionBudgets.length > 0 ? (
              sectionBudgets.map(section => (
                <div key={section.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: section.color || '#6366f1' }}
                    ></span>
                    <span className="text-gray-600">{section.name}:</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(section.amount)} ({section.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Aucune section ou budget défini.</p>
            )}
            {/* Simple textual representation of a pie chart */}
            {sectionBudgets.length > 0 && (
                <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-700">
                    <p className="font-semibold mb-1">Répartition textuelle:</p>
                    {sectionBudgets.map(section => (
                        <p key={`chart-${section.name}`}>
                            - {section.name}: {section.percentage.toFixed(1)}%
                        </p>
                    ))}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TactiquesBudgetPanel;