// app/components/Tactiques/Tactiques/TactiqueFormRepartition.tsx
/**
 * CORRIGÉ: Validation numérique stricte pour masquer pourcentages/totaux sur valeurs non-numériques
 * CORRIGÉ: Problème de réinitialisation des valeurs dans le drawer de tactique
 * NOUVEAU: IDs de périodes standardisés compatibles avec la timeline
 * NOUVEAU: Support du type PEBs avec 3 inputs (coût/unité, volume, total calculé)
 * REFACTORISÉ: Code simplifié avec hooks personnalisés et modal externe
 */

'use client';

import React, { useState, useEffect } from 'react';
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
 * NOUVEAU: Fonction helper pour valider qu'une valeur est strictement numérique
 * Contrairement à parseFloat(), cette fonction rejette les chaînes partiellement numériques
 */
const isStrictlyNumeric = (value: string): boolean => {
  if (!value || value.trim() === '') return false;
  
  const trimmedValue = value.trim();
  const numericValue = Number(trimmedValue);
  
  // Number() retourne NaN pour les chaînes partiellement numériques comme "5 mai"
  // et pour les chaînes vides, Number("") retourne 0, donc on vérifie aussi la longueur
  return !isNaN(numericValue) && isFinite(numericValue) && trimmedValue !== '';
};

/**
 * NOUVEAU: Extrait la valeur numérique d'une chaîne strictement numérique
 * Retourne 0 si la valeur n'est pas strictement numérique
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

  // Hooks personnalisés
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

  // Effet pour générer les périodes
  useEffect(() => {
    if (breakdowns.length > 0) {
      const allPeriods = generateAllPeriods(
        breakdowns,
        formData.TC_Start_Date,
        formData.TC_End_Date
      );
      setPeriods(allPeriods);
    } else {
      setPeriods([]);
    }
  }, [breakdowns, formData.TC_Start_Date, formData.TC_End_Date]);

  // Fonction pour toggle l'état collapse/expand d'un breakdown
  const toggleBreakdownCollapse = (breakdownId: string) => {
    setCollapsedBreakdowns(prev => ({
      ...prev,
      [breakdownId]: !prev[breakdownId]
    }));
  };

  // Calcule la différence avec le budget média pour PEBs
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

  // Handlers pour les modales
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

  // Obtient l'icône appropriée pour un type de breakdown
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

  // MODIFIÉ: Fonction pour vérifier s'il y a au moins une valeur numérique valide STRICTE
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
        
        // MODIFIÉ: Validation stricte pour PEBs
        return isStrictlyNumeric(unitCost) && isStrictlyNumeric(volume);
      });
    }

    // MODIFIÉ: Validation stricte pour les autres types
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
        <span className="text-sm text-indigo-600 font-medium">Budget média :</span>
        <span className="text-sm font-semibold text-indigo-800">
          {formData.TC_Media_Budget && formData.TC_Media_Budget > 0
            ? `${parseFloat(formData.TC_Media_Budget.toString()).toLocaleString('fr-CA', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 2 
              })}`
            : 'Non défini'
          }
        </span>
      </div>
    </div>

      <FormSection
        title="Répartition temporelle"
        description="Configurez les dates de la tactique et répartissez les valeurs selon les breakdowns de la campagne"
      >

        <div className="bg-slate-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <HelpIcon
                  tooltip="Date de début de cette tactique spécifique"
                  onTooltipChange={onTooltipChange}
                />
                <label className="block text-sm font-medium text-slate-700">
                  Date de début *
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
                  tooltip="Date de fin de cette tactique spécifique"
                  onTooltipChange={onTooltipChange}
                />
                <label className="block text-sm font-medium text-slate-700">
                  Date de fin *
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

              // Utiliser l'objet breakdowns pour les calculs
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

              // Calcul de la différence avec le budget média pour PEBs
              const budgetDiff = isPEBs && showCalculationsForBreakdown ? 
                calculateBudgetDifference(totalValueForBreakdown) : null;

              return (
                <div key={breakdown.id} className="bg-white rounded-xl shadow-sm">
                  <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Bouton collapse/expand */}
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
                                Par défaut
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {breakdown.type}
                            {breakdown.isDefault && formData.TC_Start_Date && formData.TC_End_Date ? (
                              <> • Basé sur les dates de la tactique</>
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
                              Total: {totalValueForBreakdown.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </div>
                            {/* Affichage de la différence pour PEBs */}
                            {budgetDiff && formData.TC_Media_Budget && (
                              <div className={`mt-1 px-3 py-1 rounded text-xs font-medium ${
                                budgetDiff.isOverBudget 
                                  ? 'bg-red-50 text-red-700' 
                                  : 'bg-green-50 text-green-700'
                              }`}>
                                {budgetDiff.isOverBudget ? '+' : ''}
                                {budgetDiff.difference.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                {' '}({budgetDiff.percentage > 0 ? '+' : ''}{budgetDiff.percentage.toFixed(1)}%)
                                <div className="text-xs opacity-75">vs Budget: {parseFloat(formData.TC_Media_Budget).toLocaleString('fr-CA')}</div>
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
                          Distribuer
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contenu collapsible */}
                  {!isCollapsed && (
                    <div className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {breakdownPeriods.map(period => {
                          const currentValue = getPeriodValue(period.id, period.breakdownId, 'value');
                          const currentUnitCost = getPeriodValue(period.id, period.breakdownId, 'unitCost');
                          const currentTotal = getPeriodValue(period.id, period.breakdownId, 'total');
                          
                          const valueForPercentage = isPEBs ? currentTotal : currentValue;
                          
                          // MODIFIÉ: Validation stricte pour l'affichage des pourcentages
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
                              {/* Icône cost guide pour PEBs */}
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
                                    title="Choisir du guide de coûts"
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
                                  // Interface PEBs avec 3 inputs superposés
                                  <div className="space-y-2">
                                    {/* Coût par unité */}
                                    <input
                                      type="text"
                                      value={currentUnitCost}
                                      onChange={(e) => handlePeriodValueChange(period.id, e.target.value, 'unitCost')}
                                      disabled={loading || (isDefaultBreakdown && !isActive)}
                                      placeholder="Coût/unité"
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
                                      placeholder="Volume"
                                      className={`w-full px-2 py-1 text-xs rounded-md text-center focus:ring-2 focus:ring-indigo-500 transition-all ${
                                        isDefaultBreakdown && !isActive
                                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border'
                                          : 'bg-white border-0 shadow-sm focus:shadow-md'
                                      }`}
                                    />
                                    
                                    {/* Total calculé (grisé) */}
                                    <input
                                      type="text"
                                      value={currentTotal}
                                      disabled={true}
                                      placeholder="Total"
                                      className="w-full px-2 py-1 text-xs rounded-md text-center bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed"
                                    />
                                  </div>
                                ) : (
                                  // Interface normale pour les autres types
                                  <input
                                    type="text"
                                    value={currentValue}
                                    onChange={(e) => handlePeriodValueChange(period.id, e.target.value, 'value')}
                                    disabled={loading || (isDefaultBreakdown && !isActive)}
                                    placeholder="Valeur"
                                    className={`w-full px-3 py-2 text-sm rounded-md text-center focus:ring-2 focus:ring-indigo-500 transition-all ${
                                      isDefaultBreakdown && !isActive
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border'
                                        : 'bg-white border-0 shadow-sm focus:shadow-md'
                                    }`}
                                  />
                                )}

                                {/* MODIFIÉ: Affichage conditionnel des pourcentages basé sur validation stricte */}
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
            <p className="text-slate-500">Aucun breakdown configuré pour cette campagne.</p>
            <p className="text-sm mt-2 text-slate-400">
              Les breakdowns sont définis lors de la création ou modification de la campagne.
            </p>
          </div>
        )}
      </FormSection>

      {/* Modales */}
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
        title="Sélectionner du guide de coûts"
      />
    </div>
  );
}