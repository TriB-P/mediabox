// app/components/Tactiques/TactiquesBudgetPanel.tsx

/**
 * Ce fichier implémente le panneau de budget des tactiques pour l'application.
 * Il affiche un résumé financier des campagnes, permettant de visualiser les totaux
 * du budget par onglet ou pour tous les onglets combinés.
 * Il inclut également des détails sur les frais (tactiques + personnalisés client) et une répartition du budget par section,
 * représentée par un graphique en forme de beignet.
 * Les données sont chargées depuis Firebase via des services dédiés.
 * 
 * NOUVELLE FONCTIONNALITÉ : Intégration des frais personnalisés du client
 * - Affichage des frais définis dans CL_Custom_Fee_1,2,3 avec montants CA_Custom_Fee_1,2,3
 * - Inclusion dans les calculs de budget client total et différence
 */
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { getSections, getTactiques } from '../../lib/tactiqueService';
import { getClientInfo, ClientInfo } from '../../lib/clientService';
import { useClient } from '../../contexts/ClientContext';
import { useSelection } from '../../contexts/SelectionContext';

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

/**
 * Interface pour les frais personnalisés du client
 */
interface CustomClientFee {
  label: string;
  amount: number;
  key: string;
}

/**
 * Composant DonutChart.
 * Affiche un graphique en forme de beignet pour représenter des proportions.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Array<{ name: string; value: number; color: string }>} props.data - Les données à afficher dans le graphique, incluant le nom, la valeur et la couleur.
 * @param {number} [props.size=120] - La taille (largeur et hauteur) du graphique en pixels.
 * @returns {React.FC} Le composant DonutChart.
 */
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

/**
 * Composant BudgetTotalsView.
 * Affiche un aperçu détaillé des totaux budgétaires pour une campagne.
 * Permet de basculer entre les données de l'onglet actuel et celles de tous les onglets.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Campaign} props.selectedCampaign - La campagne actuellement sélectionnée.
 * @param {Section[]} props.sections - Les sections de l'onglet actuel.
 * @param {{ [sectionId: string]: Tactique[] }} props.tactiques - Les tactiques de l'onglet actuel, regroupées par ID de section.
 * @param {Onglet[]} props.onglets - La liste de tous les onglets de la campagne.
 * @param {(amount: number) => string} props.formatCurrency - Fonction utilitaire pour formater les montants en devises.
 * @param {ClientFee[]} props.clientFees - Les frais clients applicables.
 * @param {DisplayScope} props.displayScope - La portée d'affichage actuelle ('currentTab' ou 'allTabs').
 * @param {(scope: DisplayScope) => void} props.setDisplayScope - Fonction pour définir la portée d'affichage.
 * @param {ClientInfo | null} props.clientInfo - Informations du client pour les frais personnalisés.
 * @returns {React.FC} Le composant BudgetTotalsView.
 */
interface BudgetTotalsViewProps {
  selectedCampaign: Campaign;
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  onglets: Onglet[];
  formatCurrency: (amount: number) => string;
  clientFees: ClientFee[];
  displayScope: DisplayScope;
  setDisplayScope: (scope: DisplayScope) => void;
  clientInfo: ClientInfo | null;
}

const BudgetTotalsView: React.FC<BudgetTotalsViewProps> = ({
  selectedCampaign,
  sections,
  tactiques,
  onglets,
  formatCurrency,
  clientFees,
  displayScope,
  setDisplayScope,
  clientInfo,
}) => {
  const [showFeeDetails, setShowFeeDetails] = useState(false);
  const [showSectionBreakdown, setShowSectionBreakdown] = useState(true);
  
  const [allTabsData, setAllTabsData] = useState<{
    sections: Section[];
    tactiques: { [sectionId: string]: Tactique[] };
  } | null>(null);
  const [isLoadingAllTabs, setIsLoadingAllTabs] = useState(false);
  const [allTabsError, setAllTabsError] = useState<string | null>(null);

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId } = useSelection();

  /**
   * Calcule les frais personnalisés du client à partir des données de campagne et client
   */
  const customClientFees = useMemo((): CustomClientFee[] => {
    if (!clientInfo || !selectedCampaign) return [];

    const fees: CustomClientFee[] = [];
    
    // Traiter les 3 frais personnalisés possibles
    for (let i = 1; i <= 3; i++) {
      const labelKey = `CL_Custom_Fee_${i}` as keyof ClientInfo;
      const amountKey = `CA_Custom_Fee_${i}` as keyof Campaign;
      
      const label = clientInfo[labelKey] as string;
      const amount = selectedCampaign[amountKey] as number;
      
      // Afficher seulement si on a un label ET un montant > 0
      if (label && label.trim() !== '' && amount && amount > 0) {
        fees.push({
          label: label.trim(),
          amount: amount,
          key: `custom_fee_${i}`
        });
      }
    }
    
    return fees;
  }, [clientInfo, selectedCampaign]);

  /**
   * Charge les données de toutes les sections et tactiques de tous les onglets.
   * Cette fonction est appelée lorsque l'utilisateur sélectionne l'option "Tous les onglets".
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois les données chargées.
   */
  const loadAllTabsData = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || onglets.length === 0) {
      return;
    }

    try {
      setIsLoadingAllTabs(true);
      setAllTabsError(null);
      
      const allSections: Section[] = [];
      const allTactiques: { [sectionId: string]: Tactique[] } = {};

      for (const onglet of onglets) {
        try {
          console.log("FIREBASE: LECTURE - Fichier: TactiquesBudgetPanel.tsx - Fonction: loadAllTabsData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${onglet.id}/sections");
          const ongletSections = await getSections(
            selectedClient.clientId,
            selectedCampaignId,
            selectedVersionId,
            onglet.id
          );

          const sectionsWithTab = ongletSections.map(section => ({
            ...section,
            ongletName: onglet.ONGLET_Name
          }));
          
          allSections.push(...sectionsWithTab);

          for (const section of ongletSections) {
            try {
              console.log("FIREBASE: LECTURE - Fichier: TactiquesBudgetPanel.tsx - Fonction: loadAllTabsData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${onglet.id}/sections/${section.id}/tactiques");
              const sectionTactiques = await getTactiques(
                selectedClient.clientId,
                selectedCampaignId,
                selectedVersionId,
                onglet.id,
                section.id
              );
              
              allTactiques[section.id] = sectionTactiques;
            } catch (tactiqueError) {
              console.error(`❌ Erreur tactiques section ${section.id}:`, tactiqueError);
              allTactiques[section.id] = [];
            }
          }
          
        } catch (ongletError) {
          console.error(`❌ Erreur onglet ${onglet.id}:`, ongletError);
        }
      }

      setAllTabsData({
        sections: allSections,
        tactiques: allTactiques
      });
      
    } catch (error) {
      console.error('💥 Erreur lors du chargement de tous les onglets:', error);
      setAllTabsError('Erreur lors du chargement des données');
    } finally {
      setIsLoadingAllTabs(false);
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onglets]);

  /**
   * Effet de bord qui déclenche le chargement des données de tous les onglets
   * lorsque le mode d'affichage passe à 'allTabs' et que les données ne sont pas déjà chargées.
   */
  useEffect(() => {
    if (displayScope === 'allTabs' && !allTabsData && !isLoadingAllTabs) {
      loadAllTabsData();
    }
  }, [displayScope, allTabsData, isLoadingAllTabs, loadAllTabsData]);

  /**
   * Retourne les sections filtrées en fonction de la portée d'affichage sélectionnée.
   */
  const filteredSections = useMemo(() => {
    if (displayScope === 'currentTab') {
      return sections;
    } else {
      return allTabsData?.sections || [];
    }
  }, [sections, displayScope, allTabsData]);

  /**
   * Retourne les tactiques filtrées en fonction de la portée d'affichage sélectionnée.
   */
  const filteredTactiques = useMemo(() => {
    if (displayScope === 'currentTab') {
      return tactiques;
    } else {
      return allTabsData?.tactiques || {};
    }
  }, [tactiques, displayScope, allTabsData]);

  /**
   * Retourne toutes les tactiques pertinentes pour la portée d'affichage sélectionnée.
   */
  const allTactiquesInScope = useMemo(() => {
    const relevantTactiqueIds = new Set<string>();
    filteredSections.forEach(section => {
      (filteredTactiques[section.id] || []).forEach(tactique => {
        relevantTactiqueIds.add(tactique.id);
      });
    });

    return Object.values(filteredTactiques).flat().filter(t => relevantTactiqueIds.has(t.id));
  }, [filteredSections, filteredTactiques]);

  /**
   * Calcule les totaux budgétaires (budget média, bonification, frais tactiques, frais personnalisés, budget client).
   */
  const calculateTotals = useCallback(() => {
    let totalMediaBudgetInput = 0;
    let totalMediaBudgetWithBonification = 0;
    let totalClientBudget = 0;
    let totalBonification = 0;
    
    const rawFeeTotals: { [key: string]: number } = {};

    // Calculs des tactiques (existant)
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

    const totalTactiqueFees = Object.values(rawFeeTotals).reduce((sum, current) => sum + current, 0);
    
    // NOUVEAU : Calcul des frais personnalisés du client
    const totalCustomClientFees = customClientFees.reduce((sum, fee) => sum + fee.amount, 0);
    
    // NOUVEAU : Ajout des frais personnalisés au budget client total
    const finalClientBudget = totalClientBudget + totalCustomClientFees;

    return {
      totalMediaBudgetInput,
      totalMediaBudgetWithBonification,
      totalClientBudget: finalClientBudget, // Inclut maintenant les frais personnalisés
      totalBonification,
      rawFeeTotals,
      totalTactiqueFees,
      totalCustomClientFees, // NOUVEAU
      customClientFees, // NOUVEAU
    };
  }, [allTactiquesInScope, customClientFees]);

  /**
   * Les totaux budgétaires calculés, mis en cache avec useMemo.
   */
  const totals = useMemo(() => calculateTotals(), [calculateTotals]);

  /**
   * Calcule les budgets par section et leurs pourcentages.
   */
  const sectionBudgets = useMemo(() => {
    const budgets: { name: string; amount: number; percentage: number; color: string; ongletName?: string }[] = [];
    let grandTotalForPercentages = 0;

    if (selectedCampaign) {
      grandTotalForPercentages = totals.totalClientBudget > 0 ? totals.totalClientBudget : totals.totalMediaBudgetInput;
    }

    filteredSections.forEach(section => {
      const sectionAmount = (filteredTactiques[section.id] || []).reduce((sum, t) => sum + t.TC_Budget, 0);
      budgets.push({
        name: section.SECTION_Name,
        amount: sectionAmount,
        percentage: grandTotalForPercentages > 0 ? (sectionAmount / grandTotalForPercentages) * 100 : 0,
        color: section.SECTION_Color || '#6366f1',
        ongletName: (section as any).ongletName
      });
    });
    return budgets.sort((a, b) => b.amount - a.amount);
  }, [filteredSections, selectedCampaign, filteredTactiques, totals.totalClientBudget, totals.totalMediaBudgetInput]);

  /**
   * Récupère le nom d'un frais tactique à partir de sa clé.
   */
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
            disabled={isLoadingAllTabs}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border border-gray-300 border-l-0
              ${displayScope === 'allTabs' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}
              ${isLoadingAllTabs ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoadingAllTabs ? 'Chargement...' : 'Tous les onglets'}
          </button>
        </div>
        
        {isLoadingAllTabs && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            🔄 Chargement des données de tous les onglets...
          </div>
        )}
        
        {allTabsError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            ❌ {allTabsError}
            <button
              onClick={loadAllTabsData}
              className="ml-2 text-red-800 underline hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg">
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800">
            Totaux {displayScope === 'allTabs' ? '(Tous les onglets)' : '(Onglet actuel)'}
          </h4>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Budget de la campagne:</span>
            <span className="font-medium">{formatCurrency(selectedCampaign.CA_Budget)}</span>
          </div>
          
          {/* NOUVEAU : Affichage des frais personnalisés du client */}
          {totals.customClientFees.map((fee) => (
            <div key={fee.key} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{fee.label}:</span>
              <span className="font-medium text-purple-700">+{formatCurrency(fee.amount)}</span>
            </div>
          ))}
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Budget média:</span>
            <span className="font-medium">{formatCurrency(totals.totalMediaBudgetWithBonification)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Bonification:</span>
            <span className="font-medium text-green-700">+{formatCurrency(totals.totalBonification)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Frais tactiques:</span>
            <span className="font-medium text-blue-700">+{formatCurrency(totals.totalTactiqueFees)}</span>
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
            {/* NOUVEAU : Affichage détaillé des frais personnalisés */}
            {totals.customClientFees.length > 0 && (
              <>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Frais de campagne
                </div>
                {totals.customClientFees.map((fee) => (
                  <div key={fee.key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{fee.label}:</span>
                    <span className="font-medium text-purple-700">{formatCurrency(fee.amount)}</span>
                  </div>
                ))}
                
                {Object.entries(totals.rawFeeTotals).filter(([, amount]) => amount > 0).length > 0 && (
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Frais tactiques
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Frais tactiques existants */}
            {Object.entries(totals.rawFeeTotals)
                .filter(([, amount]) => amount > 0)
                .map(([feeKey, amount]) => (
                <div key={feeKey} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{getFeeNameByKey(feeKey)}:</span>
                    <span className="font-medium text-blue-700">{formatCurrency(amount)}</span>
                </div>
            ))}
            
            {totals.customClientFees.length === 0 && 
             (Object.keys(totals.rawFeeTotals).length === 0 || Object.values(totals.rawFeeTotals).every(amount => amount === 0)) && (
                <p className="text-sm text-gray-500 italic">Aucun frais appliqué.</p>
            )}
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg">
        <button
          className="flex justify-between items-center w-full p-3 bg-gray-50 border-b border-gray-200 focus:outline-none"
          onClick={() => setShowSectionBreakdown(!showSectionBreakdown)}
        >
          <h4 className="text-sm font-semibold text-gray-800">
            Répartition par section {displayScope === 'allTabs' ? '(Tous onglets)' : ''}
          </h4>
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
                    <div key={`${section.name}-${section.ongletName || 'current'}`} className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <span
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                          style={{ backgroundColor: section.color }}
                        ></span>
                        <span className="text-gray-600">
                          {section.name}
                          {displayScope === 'allTabs' && section.ongletName && (
                            <span className="text-xs text-gray-400 ml-1">
                              ({section.ongletName})
                            </span>
                          )}
                          :
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(section.amount)} ({section.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                {isLoadingAllTabs ? 'Chargement des données...' : 'Aucune section ou budget défini.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Composant BudgetIndicatorsView.
 * Un composant de placeholder pour les futurs indicateurs de budget de campagne.
 */
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
      <div className="border border-gray-200 rounded-lg">
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800">Indicateurs de campagne</h4>
        </div>
        <div className="p-8 text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Indicateurs</h3>
          <p className="text-gray-500 mb-4">
            Les indicateurs de campagne seront bientôt disponibles. Ils vous permettront de voir le taux de média locaux, de média numérique et le niveau de complexité de votre campagne
          </p>
          <div className="text-sm text-gray-400">
            🚧 En construction
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Composant principal TactiquesBudgetPanel.
 * Affiche le panneau latéral du budget pour les tactiques d'une campagne sélectionnée.
 * Il gère la sélection de l'onglet (totaux ou indicateurs) et la portée d'affichage du budget.
 */
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
  
  // NOUVEAU : État pour les informations client
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loadingClientInfo, setLoadingClientInfo] = useState(false);
  const [clientInfoError, setClientInfoError] = useState<string | null>(null);

  const { selectedClient } = useClient();

  /**
   * NOUVEAU : Charge les informations du client pour récupérer les labels des frais personnalisés
   */
  const loadClientInfo = useCallback(async () => {
    if (!selectedClient?.clientId) return;

    try {
      setLoadingClientInfo(true);
      setClientInfoError(null);
      
      console.log("FIREBASE: LECTURE - Fichier: TactiquesBudgetPanel.tsx - Fonction: loadClientInfo - Path: clients/${selectedClient.clientId}");
      const info = await getClientInfo(selectedClient.clientId);
      setClientInfo(info);
    } catch (error) {
      console.error('Erreur lors du chargement des informations client:', error);
      setClientInfoError('Impossible de charger les informations client');
      setClientInfo(null);
    } finally {
      setLoadingClientInfo(false);
    }
  }, [selectedClient?.clientId]);

  /**
   * NOUVEAU : Effet pour charger les informations client quand le client sélectionné change
   */
  useEffect(() => {
    loadClientInfo();
  }, [loadClientInfo]);

  if (!selectedCampaign) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 text-center text-gray-500">
        Sélectionnez une campagne pour voir le budget.
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
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

      <div className="flex-1 overflow-y-auto p-4">
        {/* NOUVEAU : Affichage d'erreur client info si nécessaire */}
        {clientInfoError && (
          <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
            ⚠️ {clientInfoError}
            <button
              onClick={loadClientInfo}
              className="ml-2 text-amber-800 underline hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {activeTab === 'totals' && (
          <BudgetTotalsView
            selectedCampaign={selectedCampaign}
            sections={sections}
            tactiques={tactiques}
            onglets={onglets}
            formatCurrency={formatCurrency}
            clientFees={clientFees}
            displayScope={displayScope}
            setDisplayScope={setDisplayScope}
            clientInfo={clientInfo} // NOUVEAU : Passage des informations client
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