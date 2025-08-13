// app/components/Tactiques/Tactiques/TactiqueFormRepartition.tsx
/**
 * FIXED: Strict numeric validation to hide percentages/totals on non-numeric values
 * FIXED: Value reset issue in the tactic drawer
 * NEW: Standardized period IDs compatible with the timeline
 * NEW: Support for PEBs type with 3 inputs (cost/unit, volume, calculated total)
 * REFACTORED: Simplified code with custom hooks and external modal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import {
  HelpIcon,
  FormSection
} from './TactiqueFormComponents';
import { Breakdown } from '../../../types/breakdown';
import { CalendarIcon, ClockIcon, Cog6ToothIcon, CalculatorIcon, PlusIcon, ChevronDownIcon, ChevronRightIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import {
  calculateTactiqueBreakdownTotal,
  areAllTactiqueBreakdownValuesNumeric
} from '../../../lib/breakdownService';
import {
  useBreakdownLocalData,
  useCostGuide,
  usePeriodHandlers,
  BreakdownPeriod,
  DistributionModalState
} from '../../../hooks/useTactiqueBreakdown';
import { generateAllPeriods } from './breakdownPeriodUtils';
import CostGuideModal from './CostGuideModal';
import DistributionModal from './DistributionModal';

interface TactiqueFormRepartitionProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  breakdowns: Breakdown[];
  loading?: boolean;
  clientId?: string;
}

/**
 * NEW: Helper function to validate that a value is strictly numeric
 * Unlike parseFloat(), this function rejects partially numeric strings
 */
const isStrictlyNumeric = (value: string): boolean => {
  if (!value || value.trim() === '') return false;
  
  const trimmedValue = value.trim();
  const numericValue = Number(trimmedValue);
  
  // Number() returns NaN for partially numeric strings like "5 mai"
  // and for empty strings, Number("") returns 0, so we also check the length
  return !isNaN(numericValue) && isFinite(numericValue) && trimmedValue !== '';
};

/**
 * NEW: Extracts the numeric value from a strictly numeric string
 * Returns 0 if the value is not strictly numeric
 */
const getStrictNumericValue = (value: string): number => {
  return isStrictlyNumeric(value) ? Number(value.trim()) : 0;
};

export default function TactiqueFormRepartition({
  formData,
  onChange,
  onTooltipChange,
  breakdowns,
  loading = false,
  clientId
}: TactiqueFormRepartitionProps) {

  const { t } = useTranslation();
  const [periods, setPeriods] = useState<BreakdownPeriod[]>([]);
  const [collapsedBreakdowns, setCollapsedBreakdowns] = useState<{ [key: string]: boolean }>({});
  const [distributionModal, setDistributionModal] = useState<DistributionModalState>({
    isOpen: false,
    breakdownId: null,
    totalAmount: '',
    distributionMode: 'equal',
    startDate: '',
    endDate: '',
    pebsField: 'unitCost'
  });
  const [costGuideModal, setCostGuideModal] = useState({
    isOpen: false,
    periodId: null as string | null
  });

  // Custom hooks
  const { localBreakdownData, setLocalBreakdownData } = useBreakdownLocalData(
    periods,
    formData,
    breakdowns,
    onChange
  );

  const { costGuideEntries, clientHasCostGuide, costGuideLoading } = useCostGuide(clientId);

  const {
    handlePeriodValueChange,
    handlePeriodActiveChange,
    getPeriodValue,
    getPeriodActiveStatus
  } = usePeriodHandlers(periods, breakdowns, localBreakdownData, setLocalBreakdownData);

  // Effect to generate periods
  useEffect(() => {
    if (breakdowns.length > 0) {
      const allPeriods = generateAllPeriods(
        breakdowns,
        formData.TC_Start_Date,
        formData.TC_End_Date,
        t
      );
      setPeriods(allPeriods);
    } else {
      setPeriods([]);
    }
  }, [breakdowns, formData.TC_Start_Date, formData.TC_End_Date, t]);

  // Function to toggle the collapse/expand state of a breakdown
  const toggleBreakdownCollapse = (breakdownId: string) => {
    setCollapsedBreakdowns(prev => ({
      ...prev,
      [breakdownId]: !prev[breakdownId]
    }));
  };

  // Calculate the difference with the media budget for PEBs
  const calculateBudgetDifference = (totalValue: number): { difference: number; percentage: number; isOverBudget: boolean } => {
    const mediaBudget = parseFloat(formData.TC_Media_Budget || '0');
    if (mediaBudget === 0) {
      return { difference: 0, percentage: 0, isOverBudget: false };
    }

    const difference = totalValue - mediaBudget;
    const percentage = (difference / mediaBudget) * 100;
    const isOverBudget = difference > 0;

    return { difference, percentage, isOverBudget };
  };

  // Handlers for modals
  const handleOpenDistributionModal = (breakdownId: string) => {
    setDistributionModal({
      isOpen: true,
      breakdownId,
      totalAmount: '',
      distributionMode: 'equal',
      startDate: formData.TC_Start_Date || '',
      endDate: formData.TC_End_Date || '',
      pebsField: 'unitCost'
    });
  };

  const handleCloseDistributionModal = () => {
    setDistributionModal({
      isOpen: false,
      breakdownId: null,
      totalAmount: '',
      distributionMode: 'equal',
      startDate: '',
      endDate: '',
      pebsField: 'unitCost'
    });
  };

  const handleOpenCostGuideModal = (periodId: string) => {
    setCostGuideModal({
      isOpen: true,
      periodId
    });
  };

  const handleCloseCostGuideModal = () => {
    setCostGuideModal({
      isOpen: false,
      periodId: null
    });
  };

  const handleCostGuideSelect = (unitPrice: number) => {
    if (costGuideModal.periodId) {
      handlePeriodValueChange(costGuideModal.periodId, unitPrice.toString(), 'unitCost');
    }
  };

  // Gets the appropriate icon for a breakdown type
  const getBreakdownIcon = (type: string) => {
    switch (type) {
      case 'Hebdomadaire':
        return CalendarIcon;
      case 'Mensuel':
        return ClockIcon;
      case 'PEBs':
        return CalculatorIcon;
      case 'Custom':
        return Cog6ToothIcon;
      default:
        return CalendarIcon;
    }
  };
  
  const getTranslatedBreakdownType = (type: string) => {
    switch (type) {
      case 'Mensuel':
        return t('repartition.breakdown.typeMonthly');
      case 'Hebdomadaire':
        return t('repartition.breakdown.typeWeekly');
      case 'PEBs':
        return t('repartition.breakdown.typePEBs');
      case 'Custom':
        return t('repartition.breakdown.typeCustom');
      default:
        return type;
    }
  };

  // MODIFIED: Function to check if there is at least one STRICTLY valid numeric value
  const hasAtLeastOneNumericValue = (
    tactique: any,
    breakdownId: string,
    isDefaultBreakdown: boolean,
    breakdownType?: string
  ): boolean => {
    if (!tactique.breakdowns || !tactique.breakdowns[breakdownId]) {
      return false;
    }

    const breakdown = tactique.breakdowns[breakdownId];
    const periods = Object.values(breakdown.periods) as any[];
    
    const relevantPeriods = periods.filter(period => 
      !isDefaultBreakdown || period.isToggled
    );

    if (relevantPeriods.length === 0) {
      return false;
    }

    if (breakdownType === 'PEBs') {
      return relevantPeriods.some(period => {
        const unitCost = period.unitCost?.trim() || '';
        const volume = period.value?.trim() || '';
        
        // MODIFIED: Strict validation for PEBs
        return isStrictlyNumeric(unitCost) && isStrictlyNumeric(volume);
      });
    }

    // MODIFIED: Strict validation for other types
    return relevantPeriods.some(period => {
      const value = period.value?.trim() || '';
      return isStrictlyNumeric(value);
    });
  };

  const periodsByBreakdown = periods.reduce((acc, period) => {
    if (!acc[period.breakdownId]) {
      acc[period.breakdownId] = [];
    }
    acc[period.breakdownId].push(period);
    return acc;
  }, {} as { [key: string]: BreakdownPeriod[] });

  return (
    <div className="p-8 space-y-8">

<div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mb-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-indigo-600 font-medium">{t('repartition.mediaBudget.label')}</span>
        <span className="text-sm font-semibold text-indigo-800">
          {formData.TC_Media_Budget && formData.TC_Media_Budget > 0
            ? `${parseFloat(formData.TC_Media_Budget.toString()).toLocaleString('fr-CA', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 2 
              })}`
            : t('repartition.mediaBudget.notDefined')
          }
        </span>
      </div>
    </div>

      <FormSection
        title={t('repartition.section.title')}
        description={t('repartition.section.description')}
      >

        <div className="bg-slate-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <HelpIcon
                  tooltip={t('repartition.startDate.tooltip')}
                  onTooltipChange={onTooltipChange}
                />
                <label className="block text-sm font-medium text-slate-700">
                  {t('repartition.startDate.label')}
                </label>
              </div>
              <input
                type="date"
                name="TC_Start_Date"
                value={formData.TC_Start_Date || ''}
                max={formData.TC_End_Date || ''}
                onChange={onChange}
                disabled={loading}
                className="w-full px-4 py-3 border-0 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:shadow-md transition-all"
              />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <HelpIcon
                  tooltip={t('repartition.endDate.tooltip')}
                  onTooltipChange={onTooltipChange}
                />
                <label className="block text-sm font-medium text-slate-700">
                  {t('repartition.endDate.label')}
                </label>
              </div>
              <input
                type="date"
                name="TC_End_Date"
                value={formData.TC_End_Date || ''}
                min={formData.TC_Start_Date || ''}

                onChange={onChange}
                disabled={loading}
                className="w-full px-4 py-3 border-0 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:shadow-md transition-all"
              />
            </div>
          </div>
        </div>

        {breakdowns.length > 0 ? (
          <div className="space-y-8">
            {breakdowns.map(breakdown => {
              const Icon = getBreakdownIcon(breakdown.type);
              const breakdownPeriods = periodsByBreakdown[breakdown.id] || [];
              const isDefaultBreakdown = breakdown.isDefault;
              const isPEBs = breakdown.type === 'PEBs';
              const isCollapsed = collapsedBreakdowns[breakdown.id] || false;

              // Use the breakdowns object for calculations
              const currentBreakdowns = formData.breakdowns || {};
              const showCalculationsForBreakdown = hasAtLeastOneNumericValue(
                { breakdowns: currentBreakdowns },
                breakdown.id,
                isDefaultBreakdown,
                breakdown.type
              );
              const totalValueForBreakdown = showCalculationsForBreakdown ? calculateTactiqueBreakdownTotal(
                { breakdowns: currentBreakdowns },
                breakdown.id,
                isDefaultBreakdown,
                breakdown.type
              ) : 0;

              // Calculate the difference with the media budget for PEBs
              const budgetDiff = isPEBs && showCalculationsForBreakdown ? 
                calculateBudgetDifference(totalValueForBreakdown) : null;

              return (
                <div key={breakdown.id} className="bg-white rounded-xl shadow-sm">
                  <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Collapse/expand button */}
                        <button
                          type="button"
                          onClick={() => toggleBreakdownCollapse(breakdown.id)}
                          className="p-1 rounded-md hover:bg-white/50 transition-colors"
                        >
                          {isCollapsed ? (
                            <ChevronRightIcon className="h-5 w-5 text-slate-600" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-slate-600" />
                          )}
                        </button>

                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-slate-900">{breakdown.name}</h4>
                            {breakdown.isDefault && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                                {t('repartition.breakdown.defaultBadge')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {getTranslatedBreakdownType(breakdown.type)}
                            {breakdown.isDefault && formData.TC_Start_Date && formData.TC_End_Date ? (
                              <> {t('repartition.breakdown.basedOnTacticDates')}</>
                            ) : (
                              <> • {breakdown.startDate} → {breakdown.endDate}</>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {showCalculationsForBreakdown && totalValueForBreakdown > 0 && (
                          <div className="text-right">
                            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
                              {t('repartition.breakdown.totalLabel')} {totalValueForBreakdown.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </div>
                            {/* Display difference for PEBs */}
                            {budgetDiff && formData.TC_Media_Budget && (
                              <div className={`mt-1 px-3 py-1 rounded text-xs font-medium ${
                                budgetDiff.isOverBudget 
                                  ? 'bg-red-50 text-red-700' 
                                  : 'bg-green-50 text-green-700'
                              }`}>
                                {budgetDiff.isOverBudget ? '+' : ''}
                                {budgetDiff.difference.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                {' '}({budgetDiff.percentage > 0 ? '+' : ''}{budgetDiff.percentage.toFixed(1)}%)
                                <div className="text-xs opacity-75">{t('repartition.breakdown.vsBudget')} {parseFloat(formData.TC_Media_Budget).toLocaleString('fr-CA')}</div>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenDistributionModal(breakdown.id)}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <PlusIcon className="h-4 w-4" />
                          {t('repartition.breakdown.distributeButton')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible content */}
                  {!isCollapsed && (
                    <div className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {breakdownPeriods.map(period => {
                          const currentValue = getPeriodValue(period.id, period.breakdownId, 'value');
                          const currentUnitCost = getPeriodValue(period.id, period.breakdownId, 'unitCost');
                          const currentTotal = getPeriodValue(period.id, period.breakdownId, 'total');
                          
                          const valueForPercentage = isPEBs ? currentTotal : currentValue;
                          
                          // MODIFIED: Strict validation for percentage display
                          const isValueStrictlyNumeric = isPEBs 
                            ? isStrictlyNumeric(currentTotal)
                            : isStrictlyNumeric(currentValue);
                          
                          const percentage = showCalculationsForBreakdown && 
                                           totalValueForBreakdown > 0 && 
                                           isValueStrictlyNumeric
                            ? getStrictNumericValue(valueForPercentage) / totalValueForBreakdown * 100
                            : 0;

                          const isActive = getPeriodActiveStatus(period.id, period.breakdownId);

                          return (
                            <div key={period.id} className={`rounded-lg transition-all duration-200 relative ${
                              isDefaultBreakdown && !isActive
                                ? 'bg-slate-50'
                                : 'bg-slate-50 hover:bg-slate-100'
                            }`}>
                              {/* Cost guide icon for PEBs */}
                              {isPEBs && clientId && clientHasCostGuide && !costGuideLoading && (
                                <div className="absolute top-1 right-1 z-10">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCostGuideModal(period.id)}
                                    disabled={loading || costGuideLoading || (isDefaultBreakdown && !isActive)}
                                    className={`ml-1 p-1 rounded-md transition-colors ${
                                      isDefaultBreakdown && !isActive
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : 'text-slate-500 hover:text-indigo-600 hover:bg-white/80'
                                    }`}
                                    title={t('repartition.period.costGuideTitle')}
                                  >
                                    <CurrencyDollarIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center justify-between p-3 pb-2">
                                <label className={`text-sm font-medium ${
                                  isDefaultBreakdown && !isActive ? 'text-slate-400' : 'text-slate-700'
                                }`}>
                                  {period.label}
                                </label>

                                {isDefaultBreakdown && (
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => handlePeriodActiveChange(period.id, e.target.checked)}
                                    disabled={loading}
                                    className="h-4 w-4 text-slate-500 focus:ring-slate-400 border-slate-300 rounded"
                                  />
                                )}
                              </div>

                              <div className="px-3 pb-3">
                                {isPEBs ? (
                                  // PEBs interface with 3 stacked inputs
                                  <div className="space-y-2">
                                    {/* Cost per unit */}
                                    <input
                                      type="text"
                                      value={currentUnitCost}
                                      onChange={(e) => handlePeriodValueChange(period.id, e.target.value, 'unitCost')}
                                      disabled={loading || (isDefaultBreakdown && !isActive)}
                                      placeholder={t('repartition.period.unitCostPlaceholder')}
                                      className={`w-full px-2 py-1 text-xs rounded-md text-center focus:ring-2 focus:ring-indigo-500 transition-all ${
                                        isDefaultBreakdown && !isActive
                                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border'
                                          : 'bg-white border-0 shadow-sm focus:shadow-md'
                                      }`}
                                    />
                                    
                                    {/* Volume */}
                                    <input
                                      type="text"
                                      value={currentValue}
                                      onChange={(e) => handlePeriodValueChange(period.id, e.target.value, 'value')}
                                      disabled={loading || (isDefaultBreakdown && !isActive)}
                                      placeholder={t('repartition.period.volumePlaceholder')}
                                      className={`w-full px-2 py-1 text-xs rounded-md text-center focus:ring-2 focus:ring-indigo-500 transition-all ${
                                        isDefaultBreakdown && !isActive
                                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border'
                                          : 'bg-white border-0 shadow-sm focus:shadow-md'
                                      }`}
                                    />
                                    
                                    {/* Calculated total (grayed out) */}
                                    <input
                                      type="text"
                                      value={currentTotal}
                                      disabled={true}
                                      placeholder={t('repartition.period.totalPlaceholder')}
                                      className="w-full px-2 py-1 text-xs rounded-md text-center bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed"
                                    />
                                  </div>
                                ) : (
                                  // Normal interface for other types
                                  <input
                                    type="text"
                                    value={currentValue}
                                    onChange={(e) => handlePeriodValueChange(period.id, e.target.value, 'value')}
                                    disabled={loading || (isDefaultBreakdown && !isActive)}
                                    placeholder={t('repartition.period.valuePlaceholder')}
                                    className={`w-full px-3 py-2 text-sm rounded-md text-center focus:ring-2 focus:ring-indigo-500 transition-all ${
                                      isDefaultBreakdown && !isActive
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border'
                                        : 'bg-white border-0 shadow-sm focus:shadow-md'
                                    }`}
                                  />
                                )}

                                {/* MODIFIED: Conditional display of percentages based on strict validation */}
                                {showCalculationsForBreakdown && 
                                 isValueStrictlyNumeric && 
                                 isActive && 
                                 percentage > 0 && (
                                  <div className="mt-2 text-center space-y-1">
                                    <div className="text-sm font-medium text-indigo-600">
                                      {percentage.toFixed(1)}%
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <p className="text-slate-500">{t('repartition.noBreakdown.message')}</p>
            <p className="text-sm mt-2 text-slate-400">
              {t('repartition.noBreakdown.details')}
            </p>
          </div>
        )}
      </FormSection>

      {/* Modals */}
      <DistributionModal
        isOpen={distributionModal.isOpen}
        onClose={handleCloseDistributionModal}
        modalState={distributionModal}
        setModalState={setDistributionModal}
        breakdown={breakdowns.find(b => b.id === distributionModal.breakdownId)}
        periods={periods}
        formData={formData}
        getPeriodActiveStatus={getPeriodActiveStatus}
        handlePeriodValueChange={handlePeriodValueChange}
      />

      <CostGuideModal
        isOpen={costGuideModal.isOpen}
        onClose={handleCloseCostGuideModal}
        onSelect={handleCostGuideSelect}
        costGuideEntries={costGuideEntries}
        title={t('repartition.costGuideModal.title')}
      />
    </div>
  );
}