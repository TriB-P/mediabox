// app/components/Tactiques/Tactiques/DistributionModal.tsx
/**
 * Modal pour la distribution de montants sur les périodes de breakdown.
 * Permet de choisir des dates personnalisées, le champ à distribuer pour PEBs,
 * et affiche un aperçu en temps réel de la distribution.
 * CORRIGÉ: Ajout de stopPropagation pour éviter la fermeture du drawer parent
 * NOUVEAU: Exclusion des périodes décochées du breakdown par défaut pour PEBs et Weekly
 */

'use client';

import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { Breakdown } from '../../../types/breakdown';
import { BreakdownPeriod, DistributionModalState } from '../../../hooks/useTactiqueBreakdown';
import { getPeriodsForDistribution, extractPeriodStartDate } from './breakdownPeriodUtils';

interface DistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalState: DistributionModalState;
  setModalState: React.Dispatch<React.SetStateAction<DistributionModalState>>;
  breakdown?: Breakdown;
  periods: BreakdownPeriod[];
  formData: any;
  getPeriodActiveStatus: (periodId: string, breakdownId: string) => boolean;
  handlePeriodValueChange: (periodId: string, value: string, field?: 'value' | 'unitCost') => void;
}

export default function DistributionModal({
  isOpen,
  onClose,
  modalState,
  setModalState,
  breakdown,
  periods,
  formData,
  getPeriodActiveStatus,
  handlePeriodValueChange
}: DistributionModalProps) {
  const { t } = useTranslation();

  /**
   * NOUVEAU: Récupère les dates de début des périodes décochées du breakdown par défaut
   */
  const getUncheckedDefaultPeriodStartDates = (): Date[] => {
    // Trouver le breakdown par défaut
    const defaultBreakdown = periods.find(p => {
      // On cherche un breakdown par défaut en regardant les périodes
      const breakdownData = formData.breakdowns?.[p.breakdownId];
      return breakdownData && Object.values(breakdownData.periods || {}).some((period: any) => 
        period.isToggled !== undefined
      );
    });

    if (!defaultBreakdown) return [];

    // Récupérer toutes les périodes du breakdown par défaut
    const defaultBreakdownId = defaultBreakdown.breakdownId;
    const defaultPeriods = periods.filter(p => p.breakdownId === defaultBreakdownId);

    // Filtrer les périodes décochées et extraire leurs dates de début
    const uncheckedDates: Date[] = [];
    
    defaultPeriods.forEach(period => {
      const isActive = getPeriodActiveStatus(period.id, period.breakdownId);
      if (!isActive) {
        const startDate = extractPeriodStartDate(period);
        if (startDate) {
          uncheckedDates.push(startDate);
        }
      }
    });

    return uncheckedDates;
  };

  /**
   * NOUVEAU: Vérifie si une période doit être exclue en fonction des périodes décochées
   */
  const shouldExcludePeriod = (period: BreakdownPeriod, uncheckedDates: Date[]): boolean => {
    if (!breakdown || (breakdown.type !== 'PEBs' && breakdown.type !== 'Hebdomadaire')) {
      return false; // Pas d'exclusion pour les autres types
    }

    const periodStartDate = extractPeriodStartDate(period);
    if (!periodStartDate) return false;

    // Vérifier si cette date correspond à une période décochée
    return uncheckedDates.some(uncheckedDate => {
      return periodStartDate.getTime() === uncheckedDate.getTime();
    });
  };

  /**
   * Calcule la valeur par période pour l'affichage
   * MODIFIÉ: Prend en compte l'exclusion des périodes décochées
   */
  const getDistributionPreview = (): { periodsCount: number; valuePerPeriod: number } => {
    if (!modalState.breakdownId || !modalState.totalAmount || 
        !modalState.startDate || !modalState.endDate) {
      return { periodsCount: 0, valuePerPeriod: 0 };
    }

    const totalAmount = parseFloat(modalState.totalAmount);
    if (isNaN(totalAmount)) return { periodsCount: 0, valuePerPeriod: 0 };

    const concernedPeriods = getPeriodsForDistribution(
      periods,
      modalState.breakdownId,
      modalState.startDate,
      modalState.endDate
    );

    // NOUVEAU: Récupérer les dates des périodes décochées
    const uncheckedDates = getUncheckedDefaultPeriodStartDates();

    // Filtrer selon les périodes actives pour le breakdown par défaut
    const activePeriods = concernedPeriods.filter(period => {
      if (!breakdown?.isDefault) {
        // NOUVEAU: Pour les breakdowns non-par défaut, exclure selon les périodes décochées
        return !shouldExcludePeriod(period, uncheckedDates);
      }
      return getPeriodActiveStatus(period.id, period.breakdownId);
    });

    const periodsCount = activePeriods.length;
    const valuePerPeriod = periodsCount > 0 ? totalAmount / periodsCount : 0;

    return { periodsCount, valuePerPeriod };
  };

  /**
   * Confirme et applique la distribution
   * MODIFIÉ: Ajoute l'exclusion des périodes décochées pour PEBs et Weekly
   */
  const handleConfirmDistribution = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation

    if (!modalState.breakdownId || !modalState.totalAmount || 
        !modalState.startDate || !modalState.endDate || !breakdown) return;

    const totalAmount = parseFloat(modalState.totalAmount);
    if (isNaN(totalAmount)) return;

    // Utiliser les périodes calculées selon les dates personnalisées
    const concernedPeriods = getPeriodsForDistribution(
      periods,
      modalState.breakdownId,
      modalState.startDate,
      modalState.endDate
    );

    const isDefaultBreakdown = breakdown.isDefault;
    const isPEBs = breakdown.type === 'PEBs';

    // NOUVEAU: Récupérer les dates des périodes décochées du breakdown par défaut
    const uncheckedDates = getUncheckedDefaultPeriodStartDates();

    // Filtrer les périodes actives avec la nouvelle logique
    const activePeriodsList = concernedPeriods.filter(period => {
      if (isDefaultBreakdown) {
        // Pour les breakdowns par défaut, utiliser le statut d'activation habituel
        return getPeriodActiveStatus(period.id, breakdown.id) !== false;
      } else {
        // NOUVEAU: Pour les autres breakdowns (PEBs, Weekly), exclure les périodes décochées
        return !shouldExcludePeriod(period, uncheckedDates);
      }
    });

    if (activePeriodsList.length === 0) return;

    const amountPerPeriod = totalAmount / activePeriodsList.length;

    // Distribution selon le type et le champ choisi
    activePeriodsList.forEach(period => {
      if (isPEBs) {
        if (modalState.pebsField === 'unitCost') {
          // Distribuer sur le coût/unité, garder le volume existant
          handlePeriodValueChange(period.id, amountPerPeriod.toFixed(2), 'unitCost');
        } else {
          // Distribuer sur le volume, garder le coût/unité existant
          handlePeriodValueChange(period.id, amountPerPeriod.toFixed(2), 'value');
        }
      } else {
        // Pour les autres types, distribuer sur value
        handlePeriodValueChange(period.id, amountPerPeriod.toFixed(2), 'value');
      }
    });

    onClose();
  };

  /**
   * Handler pour le bouton Annuler avec stopPropagation
   */
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation
    onClose();
  };

  /**
   * Handler pour empêcher la fermeture sur clic à l'intérieur du modal
   */
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation des clics internes
  };

  /**
   * Handler pour l'overlay - ferme seulement si clic direct sur l'overlay
   */
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Fermer seulement si le clic est directement sur l'overlay (pas sur le contenu)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-xl p-6 w-full max-w-lg mx-4"
        onClick={handleModalContentClick}
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {t('distributionModal.title')}
        </h3>

        <div className="space-y-4">
          {/* Dates de distribution */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('distributionModal.form.startDateLabel')}
              </label>
              <input
                type="date"
                value={modalState.startDate}
                onChange={(e) => setModalState(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('distributionModal.form.endDateLabel')}
              </label>
              <input
                type="date"
                value={modalState.endDate}
                onChange={(e) => setModalState(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Choix du champ pour PEBs */}
          {breakdown?.type === 'PEBs' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('distributionModal.form.distributeOnLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalState(prev => ({ ...prev, pebsField: 'unitCost' }));
                  }}
                  className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                    modalState.pebsField === 'unitCost'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {t('distributionModal.form.unitCost')}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalState(prev => ({ ...prev, pebsField: 'value' }));
                  }}
                  className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                    modalState.pebsField === 'value'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {t('distributionModal.form.volume')}
                </button>
              </div>
            </div>
          )}

          {/* Montant total */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('distributionModal.form.totalAmountLabel')}
            </label>
            <input
              type="number"
              step="0.01"
              value={modalState.totalAmount}
              onChange={(e) => setModalState(prev => ({ ...prev, totalAmount: e.target.value }))}
              placeholder={t('distributionModal.form.amountPlaceholder')}
              className="w-full px-4 py-3 border-0 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Aperçu de la distribution */}
          {(() => {
            const preview = getDistributionPreview();
            return preview.periodsCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 font-medium">
                    {t('distributionModal.preview.willBeDividedOver')} {preview.periodsCount} {t('distributionModal.preview.period')}{preview.periodsCount > 1 ? 's' : ''}
                  </span>
                  <span className="text-blue-600 font-semibold">
                    {preview.valuePerPeriod.toLocaleString('fr-CA', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} {t('distributionModal.preview.perPeriod')}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="text-sm text-slate-500 space-y-1">
            <p>
              {t('distributionModal.info.distributionDates')}
              {breakdown?.isDefault && 
                t('distributionModal.info.andAreActive')}.
              {/* NOUVEAU: Message pour PEBs et Weekly */}
              {!breakdown?.isDefault && (breakdown?.type === 'PEBs' || breakdown?.type === 'Hebdomadaire') && (
                <span className="block text-indigo-600 font-medium mt-1">
                  {t('distributionModal.info.excludesUncheckedPeriods') || 'Exclut les périodes décochées du calendrier par défaut.'}
                </span>
              )}
            </p>
            {breakdown?.type === 'PEBs' && (
              <p className="text-indigo-600 font-medium">
                {modalState.pebsField === 'unitCost' 
                  ? t('distributionModal.info.unitCostDistribution')
                  : t('distributionModal.info.volumeDistribution')
                }
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirmDistribution}
            disabled={!modalState.totalAmount || !modalState.startDate || !modalState.endDate}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('distributionModal.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  );
}