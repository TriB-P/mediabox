// app/components/Tactiques/TactiquesBudgetPanel.tsx

/**
 * Ce fichier implémente le panneau de budget des tactiques pour l'application.
 * Il affiche un résumé financier des campagnes, permettant de visualiser les totaux
 * du budget par onglet ou pour tous les onglets combinés.
 * Il inclut également des détails sur les frais (tactiques + personnalisés client) et une répartition du budget par section,
 * représentée par un graphique en forme de beignet.
 * Les données sont chargées depuis Firebase via des services dédiés.
 * * NOUVELLE FONCTIONNALITÉ : Intégration des frais personnalisés du client
 * - Affichage des frais définis dans CL_Custom_Fee_1,2,3 avec montants CA_Custom_Fee_1,2,3
 * - Inclusion dans les calculs de budget client total et différence
 * * MISE À JOUR : Conversion des frais tactiques en devise de référence
 * - Les frais tactiques sont maintenant multipliés par TC_Currency_Rate
 * - Ajout d'un indicateur de devise dans le header
 * - Cohérence du symbole de devise partout
 * AMÉLIORÉ : Animations subtiles et transitions fluides
 */
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useCampaignData, formatCurrencyAmount } from '../../hooks/useCampaignData';
import { useTranslation } from '../../contexts/LanguageContext';
import BudgetIndicatorsView from './BudgetIndicatorsView';

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

const subtleEase: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const panelVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: subtleEase }
  }
};

const sectionVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: subtleEase }
  },
  exit: { 
    opacity: 0, 
    y: -5,
    transition: { duration: 0.2, ease: subtleEase }
  }
};

const expandVariants = {
  initial: { height: 0, opacity: 0 },
  animate: { 
    height: "auto", 
    opacity: 1,
    transition: { duration: 0.3, ease: subtleEase }
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.25, ease: subtleEase }
  }
};

const buttonVariants = {
  hover: { 
    scale: 1.02, 
    transition: { duration: 0.2, ease: subtleEase } 
  },
  tap: { scale: 0.98 }
};

const donutVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.4, ease: subtleEase, delay: 0.1 }
  }
};

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
 * AMÉLIORÉ : Avec animations d'apparition
 */
interface DonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  size?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, size = 120 }) => {
  const { t } = useTranslation();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <motion.div
        variants={donutVariants}
        initial="initial"
        animate="animate"
        className="flex items-center justify-center rounded-full bg-gray-100"
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-500">{t('donutChart.noData')}</span>
      </motion.div>
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
    <motion.div
      variants={donutVariants}
      initial="initial"
      animate="animate"
      className="relative"
      style={{ width: size, height: size }}
    >
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
          <motion.circle
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
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: item.strokeDasharray }}
            transition={{ duration: 0.8, ease: subtleEase, delay: index * 0.1 }}
          />
        ))}
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: subtleEase, delay: 0.3 }}
          className="text-lg font-bold text-gray-900"
        >
          {data.length}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: subtleEase, delay: 0.4 }}
          className="text-xs text-gray-500"
        >
          {t('donutChart.sections')}
        </motion.div>
      </div>
    </motion.div>
  );
};

/**
 * Composant BudgetTotalsView.
 * Affiche un aperçu détaillé des totaux budgétaires pour une campagne.
 * AMÉLIORÉ : Avec animations et transitions fluides
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
  const { t } = useTranslation();
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

  // ... (toute la logique métier reste identique)
  
  const customClientFees = useMemo((): CustomClientFee[] => {
    if (!clientInfo || !selectedCampaign) return [];

    const fees: CustomClientFee[] = [];
    
    for (let i = 1; i <= 3; i++) {
      const labelKey = `CL_Custom_Fee_${i}` as keyof ClientInfo;
      const amountKey = `CA_Custom_Fee_${i}` as keyof Campaign;
      
      const label = clientInfo[labelKey] as string;
      const amount = selectedCampaign[amountKey] as number;
      
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
      setAllTabsError(t('budgetPanel.errorLoadingData'));
    } finally {
      setIsLoadingAllTabs(false);
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onglets, t]);

  useEffect(() => {
    if (displayScope === 'allTabs' && !allTabsData && !isLoadingAllTabs) {
      loadAllTabsData();
    }
  }, [displayScope, allTabsData, isLoadingAllTabs, loadAllTabsData]);

  // ... (toute la logique de calcul reste identique)
  
  const filteredSections = useMemo(() => {
    if (displayScope === 'currentTab') {
      return sections;
    } else {
      return allTabsData?.sections || [];
    }
  }, [sections, displayScope, allTabsData]);

  const filteredTactiques = useMemo(() => {
    if (displayScope === 'currentTab') {
      return tactiques;
    } else {
      return allTabsData?.tactiques || {};
    }
  }, [tactiques, displayScope, allTabsData]);

  const allTactiquesInScope = useMemo(() => {
    const relevantTactiqueIds = new Set<string>();
    filteredSections.forEach(section => {
      (filteredTactiques[section.id] || []).forEach(tactique => {
        relevantTactiqueIds.add(tactique.id);
      });
    });

    return Object.values(filteredTactiques).flat().filter(t => relevantTactiqueIds.has(t.id));
  }, [filteredSections, filteredTactiques]);

  const calculateTotals = useCallback(() => {
    let totalMediaBudgetInput = 0;
    let totalMediaBudgetWithBonification = 0;
    let totalClientBudget = 0;
    let totalBonification = 0;
    
    const rawFeeTotals: { [key: string]: number } = {};

    allTactiquesInScope.forEach(tactique => {
      totalMediaBudgetInput += tactique.TC_Media_Budget_RefCurrency || 0; 
      totalMediaBudgetWithBonification += (tactique as any).TC_Media_Budget_RefCurrency || 0;
      totalClientBudget += (tactique as any).TC_Client_Budget_RefCurrency || 0;
      totalBonification += (tactique as any).TC_Bonification || 0;

      const currencyRate = (tactique as any).TC_Currency_Rate || 1;
      
      for (let i = 1; i <= 5; i++) {
        const feeValueKey = `TC_Fee_${i}_Value`;
        const feeAmount = ((tactique as any)[feeValueKey] || 0) * currencyRate;
        rawFeeTotals[feeValueKey] = (rawFeeTotals[feeValueKey] || 0) + feeAmount;
      }
    });

    const totalTactiqueFees = Object.values(rawFeeTotals).reduce((sum, current) => sum + current, 0);
    const totalCustomClientFees = customClientFees.reduce((sum, fee) => sum + fee.amount, 0);
    const finalClientBudget = totalClientBudget + totalCustomClientFees;

    return {
      totalMediaBudgetInput,
      totalMediaBudgetWithBonification,
      totalClientBudget: finalClientBudget,
      totalBonification,
      rawFeeTotals,
      totalTactiqueFees,
      totalCustomClientFees,
      customClientFees,
    };
  }, [allTactiquesInScope, customClientFees]);

  const totals = useMemo(() => calculateTotals(), [calculateTotals]);

  const sectionBudgets = useMemo(() => {
    const budgets: { name: string; amount: number; percentage: number; color: string; ongletName?: string }[] = [];
    let grandTotalForPercentages = 0;

    if (selectedCampaign) {
      grandTotalForPercentages = totals.totalClientBudget > 0 ? totals.totalClientBudget : totals.totalMediaBudgetInput;
    }

    filteredSections.forEach(section => {
      const sectionAmount = (filteredTactiques[section.id] || []).reduce((sum, t) => sum + t.TC_Media_Budget_RefCurrency, 0);
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

  const getFeeNameByKey = useCallback((feeKey: string) => {
    const match = feeKey.match(/TC_Fee_(\d+)_Value/);
    if (!match) return feeKey;

    const feeNumber = parseInt(match[1], 10);
    
    if (!clientFees || !Array.isArray(clientFees) || clientFees.length === 0) {
      return `${t('feeDetails.defaultFeeLabel')} ${feeNumber}`;
    }
    
    const sortedFees = [...clientFees].sort((a, b) => a.FE_Order - b.FE_Order);
    const feeIndex = feeNumber - 1;
    
    if (feeIndex >= 0 && feeIndex < sortedFees.length) {
      return sortedFees[feeIndex].FE_Name;
    }
    
    return `${t('feeDetails.defaultFeeLabel')} ${feeNumber}`;
  }, [clientFees, t]);

  const difference = selectedCampaign.CA_Budget - totals.totalClientBudget;

  return (
    <motion.div variants={sectionVariants} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('budgetPanel.displayBudgetFor')}
        </label>
        <div className="flex rounded-md shadow-sm">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            type="button"
            onClick={() => setDisplayScope('currentTab')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border border-gray-300 transition-colors
              ${displayScope === 'currentTab' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            {t('budgetPanel.currentTab')}
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            type="button"
            onClick={() => setDisplayScope('allTabs')}
            disabled={isLoadingAllTabs}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border border-gray-300 border-l-0 transition-colors
              ${displayScope === 'allTabs' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}
              ${isLoadingAllTabs ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoadingAllTabs ? t('common.loading') : t('budgetPanel.allTabs')}
          </motion.button>
        </div>
        
        <AnimatePresence>
          {isLoadingAllTabs && (
            <motion.div
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700"
            >
              {t('budgetPanel.loadingAllTabsData')}
            </motion.div>
          )}
          
          {allTabsError && (
            <motion.div
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700"
            >
              ❌ {allTabsError}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={loadAllTabsData}
                className="ml-2 text-red-800 underline hover:no-underline"
              >
                {t('budgetPanel.retry')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div variants={sectionVariants} className="border border-gray-200 rounded-lg">
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800">
            {t('budgetPanel.totals')} {displayScope === 'allTabs' ? t('budgetPanel.allTabsParenthesis') : t('budgetPanel.currentTabParenthesis')}
          </h4>
        </div>
        
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{t('budgetTotals.mediaBudget')}:</span>
            <span className="font-medium">{formatCurrency(totals.totalMediaBudgetWithBonification)}</span>
          </div>
          
          <AnimatePresence>
            {totals.customClientFees.map((fee) => (
              <motion.div
                key={fee.key}
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-600">{fee.label}:</span>
                <span className="font-medium text-purple-700">+{formatCurrency(fee.amount)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{t('budgetTotals.tacticFees')}:</span>
            <span className="font-medium text-blue-700">+{formatCurrency(totals.totalTactiqueFees)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2 mt-2">
            <span>{t('budgetTotals.totalClientBudget')}:</span>
            <span>{formatCurrency(totals.totalClientBudget)}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2" style={{ borderTop: '1px dashed #e5e7eb' }}>
            <span className="text-gray-600">{t('budgetTotals.campaignBudget')}:</span>
            <span className="font-medium">{formatCurrency(selectedCampaign.CA_Budget)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{t('budgetTotals.difference')}:</span>
            <span className={`font-medium ${difference < 0 ? 'text-red-700' : 'text-green-700'}`}>
              {formatCurrency(difference)}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={sectionVariants} className="border border-gray-200 rounded-lg">
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="flex justify-between items-center w-full p-3 bg-gray-50 border-b border-gray-200 focus:outline-none"
          onClick={() => setShowFeeDetails(!showFeeDetails)}
        >
          <h4 className="text-sm font-semibold text-gray-800">{t('feeDetails.title')}</h4>
          <motion.div
            animate={{ rotate: showFeeDetails ? 180 : 0 }}
            transition={{ duration: 0.2, ease: subtleEase }}
          >
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {showFeeDetails && (
            <motion.div
              variants={expandVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="overflow-hidden"
            >
              <div className="p-3 space-y-2">
                <AnimatePresence>
                  {totals.customClientFees.length > 0 && (
                    <>
                      <motion.div
                        variants={sectionVariants}
                        className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2"
                      >
                        {t('feeDetails.campaignFees')}
                      </motion.div>
                      {totals.customClientFees.map((fee) => (
                        <motion.div
                          key={fee.key}
                          variants={sectionVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-600">{fee.label}:</span>
                          <span className="font-medium text-purple-700">{formatCurrency(fee.amount)}</span>
                        </motion.div>
                      ))}
                      
                      {Object.entries(totals.rawFeeTotals).filter(([, amount]) => amount > 0).length > 0 && (
                        <motion.div
                          variants={sectionVariants}
                          className="border-t border-gray-100 pt-2 mt-2"
                        >
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {t('feeDetails.tacticFeesHeader')}
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {Object.entries(totals.rawFeeTotals)
                      .filter(([, amount]) => amount > 0)
                      .map(([feeKey, amount]) => (
                      <motion.div
                        key={feeKey}
                        variants={sectionVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex justify-between items-center text-sm"
                      >
                          <span className="text-gray-600">{getFeeNameByKey(feeKey)}:</span>
                          <span className="font-medium text-blue-700">{formatCurrency(amount)}</span>
                      </motion.div>
                  ))}
                </AnimatePresence>
                
                {totals.customClientFees.length === 0 && 
                 (Object.keys(totals.rawFeeTotals).length === 0 || Object.values(totals.rawFeeTotals).every(amount => amount === 0)) && (
                    <motion.p
                      variants={sectionVariants}
                      className="text-sm text-gray-500 italic"
                    >
                      {t('feeDetails.noFeesApplied')}
                    </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={sectionVariants} className="border border-gray-200 rounded-lg">
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="flex justify-between items-center w-full p-3 bg-gray-50 border-b border-gray-200 focus:outline-none"
          onClick={() => setShowSectionBreakdown(!showSectionBreakdown)}
        >
          <h4 className="text-sm font-semibold text-gray-800">
            {t('sectionBreakdown.title')} {displayScope === 'allTabs' ? t('sectionBreakdown.allTabsParenthesis') : ''}
          </h4>
          <div className="flex items-center gap-2">
            <ChartPieIcon className="h-4 w-4 text-gray-500" />
            <motion.div
              animate={{ rotate: showSectionBreakdown ? 180 : 0 }}
              transition={{ duration: 0.2, ease: subtleEase }}
            >
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            </motion.div>
          </div>
        </motion.button>
        <AnimatePresence>
          {showSectionBreakdown && (
            <motion.div
              variants={expandVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="overflow-hidden"
            >
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
                    
                    <div className="space-y-3">
                      <AnimatePresence>
                        {sectionBudgets.map((section, index) => (
                          <motion.div
                            key={`${section.name}-${section.ongletName || 'current'}`}
                            variants={sectionVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ delay: index * 0.05 }}
                            className="grid grid-cols-12 gap-2 items-center text-sm"
                          >
                            <div className="col-span-1 flex justify-start">
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, ease: subtleEase, delay: index * 0.05 }}
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: section.color }}
                              ></motion.span>
                            </div>
                            
                            <div className="col-span-5">
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
                            
                            <div className="col-span-3 text-right">
                              <span className="font-medium">
                                {formatCurrency(section.amount)}
                              </span>
                            </div>
                            
                            <div className="col-span-3 text-right">
                              <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs">
                                {section.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <motion.p
                    variants={sectionVariants}
                    className="text-sm text-gray-500 italic"
                  >
                    {isLoadingAllTabs ? t('sectionBreakdown.loadingData') : t('sectionBreakdown.noSectionOrBudget')}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};



/**
 * Composant principal TactiquesBudgetPanel.
 * AMÉLIORÉ : Avec animations d'entrée et transitions fluides
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PanelTab>('totals');
  const [displayScope, setDisplayScope] = useState<DisplayScope>('currentTab');
  
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loadingClientInfo, setLoadingClientInfo] = useState(false);
  const [clientInfoError, setClientInfoError] = useState<string | null>(null);

  const { selectedClient } = useClient();

  const { currency, loading: campaignLoading } = useCampaignData();

  const formatCurrencyWithCampaignCurrency = (amount: number): string => {
    return formatCurrencyAmount(amount, currency);
  };

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
      setClientInfoError(t('budgetPanel.clientInfoError'));
      setClientInfo(null);
    } finally {
      setLoadingClientInfo(false);
    }
  }, [selectedClient?.clientId, t]);

  useEffect(() => {
    loadClientInfo();
  }, [loadClientInfo]);

  if (!selectedCampaign) {
    return (
      <motion.div
        variants={panelVariants}
        initial="initial"
        animate="animate"
        className="w-80 bg-white border-l border-gray-200 p-4 text-center text-gray-500"
      >
        {t('budgetPanel.selectCampaign')}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={panelVariants}
      initial="initial"
      animate="animate"
      className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-lg overflow-hidden"
    >
      {/* Header avec indicateur de devise */}
      <motion.div variants={sectionVariants} className="p-4 border-b border-gray-200 bg-indigo-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{t('budgetPanel.header')}</h3>
          <AnimatePresence>
            {selectedCampaign.CA_Currency && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-xs font-medium"
              >
                <CurrencyDollarIcon className="h-3 w-3" />
                {selectedCampaign.CA_Currency}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex rounded-md shadow-sm">
          {[
            { key: 'totals' as PanelTab, icon: CurrencyDollarIcon, label: t('budgetPanel.totalsTab') },
            { key: 'indicators' as PanelTab, icon: ChartBarIcon, label: t('budgetPanel.indicatorsTab') }
          ].map(({ key, icon: Icon, label }) => (
            <motion.button
              key={key}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              type="button"
              onClick={() => setActiveTab(key)}
              className={`
                flex-1 px-3 py-2 text-sm font-medium border border-gray-300 
                flex items-center justify-center transition-colors
                ${key === 'totals' ? 'rounded-l-md' : 'rounded-r-md border-l-0'}
                ${activeTab === key 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="h-4 w-4 mr-1" />
              {label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {clientInfoError && (
            <motion.div
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700"
            >
              ⚠️ {clientInfoError}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={loadClientInfo}
                className="ml-2 text-amber-800 underline hover:no-underline"
              >
                {t('budgetPanel.retry')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'totals' && (
            <motion.div
              key="totals"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <BudgetTotalsView
                selectedCampaign={selectedCampaign}
                sections={sections}
                tactiques={tactiques}
                onglets={onglets}
                formatCurrency={formatCurrencyWithCampaignCurrency}
                clientFees={clientFees}
                displayScope={displayScope}
                setDisplayScope={setDisplayScope}
                clientInfo={clientInfo}
              />
            </motion.div>
          )}
          
          {activeTab === 'indicators' && (
          <motion.div
            key="indicators"
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <BudgetIndicatorsView
              selectedCampaign={selectedCampaign}
              allSections={sections}
              allTactiques={tactiques}
              formatCurrency={formatCurrencyWithCampaignCurrency}
            />
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TactiquesBudgetPanel;