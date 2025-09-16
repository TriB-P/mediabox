/**
 * @file Composant amélioré `CampaignFormBreakdown` avec:
 * - Limite à 5 breakdowns par campagne
 * - Support des nouvelles structures de données avec IDs uniques
 * - Gestion améliorée des types automatiques vs custom
 * - Support du sous-type pour les breakdowns mensuels
 * - Traduction des types d'affichage (garde les valeurs FR en backend)
 */

'use client';

import React, { useState, useEffect, memo } from 'react';
import {
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  Cog6ToothIcon,
  CalculatorIcon,
  XMarkIcon,
  LockClosedIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import {
  HelpIcon,
  createLabelWithHelp,
  FormSection
} from '../Tactiques/Tactiques/TactiqueFormComponents';
import {
  Breakdown,
  BreakdownFormData,
  BreakdownType,
  BreakdownSubType,
  CustomPeriodFormData,
  BREAKDOWN_TYPES,
  BREAKDOWN_SUB_TYPES,
  DEFAULT_BREAKDOWN_NAME,
  DEFAULT_BREAKDOWN_SUB_TYPE,
  createEmptyCustomPeriod,
  validateCustomPeriods,
  supportsSubType,
  getBreakdownSubTypeLabel,
  MAX_BREAKDOWNS_PER_CAMPAIGN
} from '../../types/breakdown';
import {
  getBreakdowns,
  createBreakdown,
  updateBreakdown,
  deleteBreakdown,
  validateBreakdownDate,
  getClosestMonday,
  getFirstOfMonth
} from '../../lib/breakdownService';

import { useTranslation } from '../../contexts/LanguageContext';

interface CampaignFormBreakdownProps {
  clientId: string;
  campaignId?: string;
  campaignStartDate: string;
  campaignEndDate: string;
  onTooltipChange: (tooltip: string | null) => void;
  onBreakdownsChange?: (breakdowns: BreakdownFormData[]) => void;
  loading?: boolean;
}

interface BreakdownEditData extends BreakdownFormData {
  id?: string;
  isDefault?: boolean;
}

/**
 * Composant principal pour gérer les répartitions temporelles d'une campagne.
 * AMÉLIORÉ: Avec limite à 5 breakdowns, nouvelle structure de données et sous-type mensuel
 */
const CampaignFormBreakdown = memo<CampaignFormBreakdownProps>(({
  clientId,
  campaignId,
  campaignStartDate,
  campaignEndDate,
  onTooltipChange,
  onBreakdownsChange,
  loading = false
}) => {
  const { t } = useTranslation();
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [additionalBreakdowns, setAdditionalBreakdowns] = useState<BreakdownFormData[]>([]);
  const [editingBreakdown, setEditingBreakdown] = useState<BreakdownEditData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour obtenir le label traduit d'un type de breakdown
   * Garde les valeurs en français pour le backend
   */
  const getBreakdownTypeLabel = (type: BreakdownType): string => {
    switch (type) {
      case 'Hebdomadaire':
        return t('campaigns.formBreakdown.types.weekly');
      case 'Mensuel':
        return t('campaigns.formBreakdown.types.monthly');
      case 'PEBs':
        return t('campaigns.formBreakdown.types.pebs');
      case 'Custom':
        return t('campaigns.formBreakdown.types.custom');
      default:
        return type;
    }
  };

  /**
   * NOUVEAU: Fonction pour obtenir le label traduit d'un sous-type de breakdown
   */
  const getTranslatedBreakdownSubTypeLabel = (subType: BreakdownSubType): string => {
    return getBreakdownSubTypeLabel(subType, t);
  };

  /**
   * Fonction pour obtenir la liste des types avec leurs labels traduits
   */
  const getTranslatedBreakdownTypes = () => {
    return BREAKDOWN_TYPES.map(type => ({
      ...type,
      label: getBreakdownTypeLabel(type.value)
    }));
  };

  /**
   * NOUVEAU: Fonction pour obtenir la liste des sous-types avec leurs labels traduits
   */
  const getTranslatedBreakdownSubTypes = () => {
    return BREAKDOWN_SUB_TYPES.map(subType => ({
      ...subType,
      label: getTranslatedBreakdownSubTypeLabel(subType.value)
    }));
  };

  /**
   * Effet pour charger les répartitions existantes si un `campaignId` est fourni,
   * ou pour initialiser une répartition par défaut virtuelle pour une nouvelle campagne.
   */
  useEffect(() => {
    if (campaignId) {
      loadBreakdowns();
    } else {
      if (campaignStartDate && campaignEndDate) {
        const virtualDefaultBreakdown: Breakdown = {
          id: 'default',
          name: DEFAULT_BREAKDOWN_NAME,
          type: 'Hebdomadaire',
          startDate: getClosestMonday(campaignStartDate),
          endDate: campaignEndDate,
          isDefault: true,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setBreakdowns([virtualDefaultBreakdown]);
      }
      setAdditionalBreakdowns([]);
    }
  }, [campaignId, campaignStartDate, campaignEndDate]);

  /**
   * Effet pour mettre à jour les dates de la répartition par défaut
   * lorsque les dates de la campagne parente changent.
   */
  useEffect(() => {
    if (campaignStartDate && campaignEndDate) {
      setBreakdowns(prevBreakdowns => {
        return prevBreakdowns.map(breakdown => {
          if (breakdown.isDefault) {
            return {
              ...breakdown,
              startDate: getClosestMonday(campaignStartDate),
              endDate: campaignEndDate,
              updatedAt: new Date().toISOString()
            };
          }
          return breakdown;
        });
      });
    }
  }, [campaignStartDate, campaignEndDate]);

  /**
   * Effet pour notifier le composant parent des changements dans les répartitions
   * lors de la création d'une nouvelle campagne (quand `campaignId` n'existe pas).
   */
  useEffect(() => {
    if (!campaignId && onBreakdownsChange) {
      const defaultBreakdown = breakdowns.find(b => b.isDefault);
      const allBreakdowns = [];

      if (defaultBreakdown && campaignStartDate && campaignEndDate) {
        allBreakdowns.push({
          name: defaultBreakdown.name,
          type: defaultBreakdown.type,
          subType: defaultBreakdown.subType, // NOUVEAU: Inclure le sous-type
          startDate: defaultBreakdown.startDate,
          endDate: defaultBreakdown.endDate,
          isDefault: true
        });
      }

      allBreakdowns.push(...additionalBreakdowns);

      onBreakdownsChange(allBreakdowns);
    }
  }, [additionalBreakdowns, breakdowns, campaignId, campaignStartDate, campaignEndDate, onBreakdownsChange]);

  /**
   * Charge les répartitions temporelles depuis Firebase pour une campagne existante.
   */
  const loadBreakdowns = async () => {
    if (!campaignId) return;

    try {
      setLocalLoading(true);
      setError(null);
      console.log(`FIREBASE: LECTURE - Fichier: CampaignFormBreakdown.tsx - Fonction: loadBreakdowns`);
      const data = await getBreakdowns(clientId, campaignId);
      setBreakdowns(data);
    } catch (err) {
      console.error('Erreur lors du chargement des breakdowns:', err);
      setError(t('campaigns.formBreakdown.loadingError'));
    } finally {
      setLocalLoading(false);
    }
  };

  /**
   * Prépare l'état pour la création d'une nouvelle répartition en ouvrant le formulaire modal.
   * MODIFIÉ: Gestion du sous-type par défaut pour les types mensuels
   */
  const handleCreateBreakdown = () => {
    if (!campaignStartDate || !campaignEndDate) {
      setError(t('campaigns.formBreakdown.datesNotDefinedError'));
      return;
    }

    if (breakdowns.length >= MAX_BREAKDOWNS_PER_CAMPAIGN) {
      setError(t('campaigns.formBreakdown.maxBreakdownsError', { max: MAX_BREAKDOWNS_PER_CAMPAIGN }));
      return;
    }

    // CORRIGÉ: Appliquer l'ajustement selon le type par défaut (Hebdomadaire)
    const defaultType: BreakdownType = 'Hebdomadaire';
    let adjustedStartDate = campaignStartDate;
    
    if (defaultType === 'Hebdomadaire') {
      adjustedStartDate = getClosestMonday(campaignStartDate);
    }

    const newBreakdown: BreakdownEditData = {
      name: '',
      type: defaultType,
      startDate: adjustedStartDate,
      endDate: campaignEndDate,
      // NOUVEAU: Pas de sous-type par défaut pour Hebdomadaire
    };

    setEditingBreakdown(newBreakdown);
    setIsCreating(true);
  };

  /**
   * Prépare l'état pour la modification d'une répartition existante en ouvrant le formulaire modal.
   */
  const handleEditBreakdown = (breakdown: Breakdown) => {
    if (breakdown.isDefault) {
      setError(t('campaigns.formBreakdown.defaultBreakdownModifyError'));
      return;
    }

    const editData: BreakdownEditData = {
      id: breakdown.id,
      name: breakdown.name,
      type: breakdown.type,
      subType: breakdown.subType, // NOUVEAU: Inclure le sous-type
      startDate: breakdown.startDate,
      endDate: breakdown.endDate,
      isDefault: breakdown.isDefault,
    };

    if (breakdown.type === 'Custom' && breakdown.customPeriods) {
      editData.customPeriods = breakdown.customPeriods.map(period => ({
        name: period.name,
        order: period.order
      }));
    }

    setEditingBreakdown(editData);
    setIsCreating(false);
  };

  /**
   * Sauvegarde les modifications d'une répartition.
   */
  const handleSaveBreakdown = async () => {
    if (!editingBreakdown) return;

    try {
      setLocalLoading(true);
      setError(null);

      if (campaignId) {
        if (isCreating) {
          console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignFormBreakdown.tsx - Fonction: handleSaveBreakdown`);
          await createBreakdown(clientId, campaignId, editingBreakdown);
        } else if (editingBreakdown.id) {
          console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignFormBreakdown.tsx - Fonction: handleSaveBreakdown`);
          await updateBreakdown(clientId, campaignId, editingBreakdown.id, editingBreakdown);
        }
        await loadBreakdowns();
      } else {
        const newBreakdownData: BreakdownFormData = {
          name: editingBreakdown.name,
          type: editingBreakdown.type,
          subType: editingBreakdown.subType, // NOUVEAU: Inclure le sous-type
          startDate: editingBreakdown.startDate,
          endDate: editingBreakdown.endDate,
          customPeriods: editingBreakdown.customPeriods
        };

        setAdditionalBreakdowns(prev => [...prev, newBreakdownData]);

        const virtualBreakdown: Breakdown = {
          id: `temp_${Date.now()}`,
          name: editingBreakdown.name,
          type: editingBreakdown.type,
          subType: editingBreakdown.subType, // NOUVEAU: Inclure le sous-type
          startDate: editingBreakdown.startDate,
          endDate: editingBreakdown.endDate,
          isDefault: false,
          order: breakdowns.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customPeriods: editingBreakdown.customPeriods ? editingBreakdown.customPeriods.map((period, index) => ({
            id: `temp_period_${Date.now()}_${index}`,
            name: period.name,
            order: period.order
          })) : undefined
        };

        setBreakdowns(prev => [...prev, virtualBreakdown]);
      }

      setEditingBreakdown(null);
      setIsCreating(false);
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.message || t('campaigns.formBreakdown.saveError'));
    } finally {
      setLocalLoading(false);
    }
  };

  /**
   * Supprime une répartition temporelle de Firebase.
   */
  const handleDeleteBreakdown = async (breakdownId: string) => {
    if (!campaignId) return;

    const breakdown = breakdowns.find(b => b.id === breakdownId);
    if (breakdown?.isDefault) {
      setError(t('campaigns.formBreakdown.defaultDeleteError'));
      return;
    }

    if (!confirm(t('campaigns.formBreakdown.deleteConfirm'))) {
      return;
    }

    try {
      setLocalLoading(true);
      setError(null);
      console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignFormBreakdown.tsx - Fonction: handleDeleteBreakdown`);
      await deleteBreakdown(clientId, campaignId, breakdownId);
      await loadBreakdowns();
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.message || t('campaigns.formBreakdown.deleteError'));
    } finally {
      setLocalLoading(false);
    }
  };

  /**
   * Gère le changement de type de répartition dans le formulaire d'édition.
   * MODIFIÉ: Gestion du sous-type selon le type sélectionné
   */
  const handleTypeChange = (newType: BreakdownType) => {
    if (!editingBreakdown) return;

    let adjustedStartDate: string;
    let updatedBreakdown = { ...editingBreakdown };

    // CLEF: Toujours utiliser les dates de campagne originales comme base
    const baseStartDate = campaignStartDate || editingBreakdown.startDate;
    const baseEndDate = campaignEndDate || editingBreakdown.endDate;

    // Appliquer l'ajustement conditionnel selon le type
    switch (newType) {
      case 'Hebdomadaire':
      case 'PEBs':
        // Lundi le plus proche (avant ou égal)
        adjustedStartDate = getClosestMonday(baseStartDate);
        updatedBreakdown.customPeriods = undefined;
        updatedBreakdown.subType = undefined; // NOUVEAU: Supprimer le sous-type
        break;
        
      case 'Mensuel':
        // 1er du mois où la campagne commence
        adjustedStartDate = getFirstOfMonth(baseStartDate);
        updatedBreakdown.customPeriods = undefined;
        // NOUVEAU: Définir le sous-type par défaut pour mensuel
        updatedBreakdown.subType = updatedBreakdown.subType || DEFAULT_BREAKDOWN_SUB_TYPE;
        break;
        
      case 'Custom':
        // Pas d'ajustement pour Custom
        adjustedStartDate = baseStartDate;
        updatedBreakdown.customPeriods = [createEmptyCustomPeriod()];
        updatedBreakdown.subType = undefined; // NOUVEAU: Supprimer le sous-type
        break;
        
      default:
        adjustedStartDate = baseStartDate;
        updatedBreakdown.subType = undefined;
    }

    updatedBreakdown.type = newType;
    updatedBreakdown.startDate = adjustedStartDate;
    updatedBreakdown.endDate = baseEndDate;

    setEditingBreakdown(updatedBreakdown);
  };

  /**
   * NOUVEAU: Gère le changement de sous-type de répartition
   */
  const handleSubTypeChange = (newSubType: BreakdownSubType) => {
    if (!editingBreakdown || !supportsSubType(editingBreakdown.type)) return;

    setEditingBreakdown({
      ...editingBreakdown,
      subType: newSubType
    });
  };

  /**
   * Ajoute une nouvelle période vide à une répartition de type "Custom" en cours d'édition.
   */
  const handleAddCustomPeriod = () => {
    if (!editingBreakdown || editingBreakdown.type !== 'Custom') return;

    const currentPeriods = editingBreakdown.customPeriods || [];
    const newPeriod = createEmptyCustomPeriod(currentPeriods.length);

    setEditingBreakdown({
      ...editingBreakdown,
      customPeriods: [...currentPeriods, newPeriod]
    });
  };

  /**
   * Supprime une période d'une répartition de type "Custom" en cours d'édition.
   */
  const handleRemoveCustomPeriod = (index: number) => {
    if (!editingBreakdown || editingBreakdown.type !== 'Custom') return;

    const currentPeriods = editingBreakdown.customPeriods || [];
    if (currentPeriods.length <= 1) {
      setError(t('campaigns.formBreakdown.atLeastOnePeriodError'));
      return;
    }

    const updatedPeriods = currentPeriods.filter((_, i) => i !== index);
    setEditingBreakdown({
      ...editingBreakdown,
      customPeriods: updatedPeriods
    });
  };

  /**
   * Met à jour le champ d'une période personnalisée.
   */
  const handleUpdateCustomPeriod = (index: number, field: keyof CustomPeriodFormData, value: string | number) => {
    if (!editingBreakdown || editingBreakdown.type !== 'Custom') return;

    const currentPeriods = [...(editingBreakdown.customPeriods || [])];
    currentPeriods[index] = {
      ...currentPeriods[index],
      [field]: value
    };

    setEditingBreakdown({
      ...editingBreakdown,
      customPeriods: currentPeriods
    });
  };

  /**
   * Valide une date en temps réel selon le type de répartition et retourne un message d'erreur s'il y a lieu.
   */
  const getDateValidationError = (date: string, isStartDate: boolean): string | null => {
    if (!editingBreakdown) return null;

    if (editingBreakdown.type === 'Custom') {
      return null;
    }

    const validation = validateBreakdownDate(date, editingBreakdown.type, isStartDate);
    return validation.isValid ? null : (validation.error || null);
  };

  /**
   * Valide l'ensemble des périodes personnalisées pour une répartition de type "Custom".
   */
  const getCustomPeriodsValidation = () => {
    if (!editingBreakdown || editingBreakdown.type !== 'Custom' || !editingBreakdown.customPeriods) {
      return { isValid: true, errors: {} };
    }

    return validateCustomPeriods(editingBreakdown.customPeriods);
  };

  /**
   * Vérifie si le formulaire d'édition est valide et prêt à être sauvegardé.
   */
  const isFormValid = (): boolean => {
    if (!editingBreakdown) return false;

    const basicValid = (
      editingBreakdown.name.trim() !== '' &&
      editingBreakdown.startDate !== '' &&
      editingBreakdown.endDate !== ''
    );

    if (!basicValid) return false;

    if (editingBreakdown.type === 'Custom') {
      const customValidation = getCustomPeriodsValidation();
      return customValidation.isValid;
    } else {
      return (
        new Date(editingBreakdown.endDate) > new Date(editingBreakdown.startDate) &&
        !getDateValidationError(editingBreakdown.startDate, true) &&
        !getDateValidationError(editingBreakdown.endDate, false)
      );
    }
  };

  /**
   * Retourne le composant icône approprié pour un type de répartition donné.
   */
  const getTypeIcon = (type: BreakdownType) => {
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

  const isDisabled = loading || localLoading;

  return (
    <div className="p-8 space-y-6">
      <FormSection
        title={t('campaigns.formBreakdown.title')}
        description={t('campaigns.formBreakdown.description')}
      >
        {(!campaignStartDate || !campaignEndDate) && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">
              <strong>{t('campaigns.formBreakdown.datesRequiredTitle')}</strong>{' '}
              {t('campaigns.formBreakdown.datesRequiredText')}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-600 hover:text-red-800 underline text-sm"
            >
              {t('common.close')}
            </button>
          </div>
        )}

        {(campaignStartDate && campaignEndDate) && (
          <div className="space-y-4">
            {breakdowns.map((breakdown) => {
              const TypeIcon = getTypeIcon(breakdown.type);

              return (
                <div
                  key={breakdown.id}
                  className={`border rounded-lg p-4 ${breakdown.isDefault
                      ? 'border-indigo-200 bg-indigo-50'
                      : 'border-gray-200 bg-white'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TypeIcon className="h-5 w-5 text-gray-500" />
                      {breakdown.isDefault && (
                        <LockClosedIcon className="h-4 w-4 text-indigo-600" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          {breakdown.name}
                          {breakdown.isDefault && (
                            <span className="text-xs text-indigo-600 font-normal">
                              {t('campaigns.formBreakdown.defaultBreakdownLabel')}
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {getBreakdownTypeLabel(breakdown.type)}
                          {/* NOUVEAU: Affichage du sous-type */}
                          {breakdown.subType && (
                            <> • {getTranslatedBreakdownSubTypeLabel(breakdown.subType)}</>
                          )}
                          {breakdown.type !== 'Custom' && (
                            <> • {breakdown.startDate} → {breakdown.endDate}</>
                          )}
                          {breakdown.type === 'Custom' && breakdown.customPeriods && (
                            <> • {breakdown.customPeriods.length} {t('campaigns.formBreakdown.periodsCount')}</>
                          )}
                          {breakdown.isDefault && (
                            <> • {t('campaigns.formBreakdown.updatedAutomatically')}</>
                          )}
                        </p>
                        {breakdown.type === 'Custom' && breakdown.customPeriods && (
                          <div className="mt-2 space-y-1">
                            {breakdown.customPeriods.map((period, index) => (
                              <div key={period.id || index} className="text-xs text-gray-600">
                                • <strong>{period.name}</strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!breakdown.isDefault && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditBreakdown(breakdown)}
                            disabled={isDisabled}
                            className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBreakdown(breakdown.id)}
                            disabled={isDisabled}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {breakdown.isDefault && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <LockClosedIcon className="h-3 w-3" />
                          {t('campaigns.formBreakdown.notEditable')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>)}

        {/* MODIFIÉ: Nouvelle limite affichée */}
        {(campaignStartDate && campaignEndDate) && breakdowns.length < MAX_BREAKDOWNS_PER_CAMPAIGN && (
          <button
            type="button"
            onClick={handleCreateBreakdown}
            disabled={isDisabled}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-gray-500 hover:border-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          >
            <PlusIcon className="h-6 w-6 mx-auto mb-2" />
            <span className="block text-sm font-medium">
              {t('campaigns.formBreakdown.addBreakdown')}
            </span>
            <span className="block text-xs">
              ({breakdowns.length}/{MAX_BREAKDOWNS_PER_CAMPAIGN})
            </span>
          </button>
        )}

        {(campaignStartDate && campaignEndDate) && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <p className="text-sm">
              <strong>{t('campaigns.formBreakdown.defaultBreakdownInfoTitle')}</strong>{' '}
              {t('campaigns.formBreakdown.defaultBreakdownInfoText')}
            </p>
          </div>
        )}
      </FormSection>

      {/* Modal d'édition - MODIFIÉ avec support du sous-type */}
      {editingBreakdown && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {isCreating ? t('campaigns.formBreakdown.modal.newTitle') : t('campaigns.formBreakdown.modal.editTitle')}
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <HelpIcon
                    tooltip={t('campaigns.formBreakdown.modal.nameHelp')}
                    onTooltipChange={onTooltipChange}
                  />
                  <label className="block text-sm font-medium text-gray-700">
                    {t('campaigns.formBreakdown.modal.nameLabel')}
                  </label>
                </div>
                <input
                  type="text"
                  value={editingBreakdown.name}
                  onChange={(e) => setEditingBreakdown({
                    ...editingBreakdown,
                    name: e.target.value
                  })}
                  disabled={editingBreakdown.isDefault}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  placeholder={t('campaigns.formBreakdown.modal.namePlaceholder')}
                />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <HelpIcon
                    tooltip={t('campaigns.formBreakdown.modal.typeHelp')}
                    onTooltipChange={onTooltipChange}
                  />
                  <label className="block text-sm font-medium text-gray-700">
                    {t('campaigns.formBreakdown.modal.typeLabel')}
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {getTranslatedBreakdownTypes().map((type) => {
                    const TypeIcon = getTypeIcon(type.value);
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleTypeChange(type.value)}
                        disabled={editingBreakdown.isDefault}
                        className={`flex flex-col items-center p-3 border rounded-lg transition-colors disabled:bg-gray-100 ${editingBreakdown.type === type.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 hover:border-gray-400'
                          }`}
                      >
                        <TypeIcon className="h-5 w-5 mb-1" />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* NOUVEAU: Champ sous-type conditionnel pour les types mensuels */}
              {supportsSubType(editingBreakdown.type) && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <HelpIcon
                      tooltip={t('campaigns.formBreakdown.modal.subTypeHelp')}
                      onTooltipChange={onTooltipChange}
                    />
                    <label className="block text-sm font-medium text-gray-700">
                      {t('campaigns.formBreakdown.modal.subTypeLabel')}
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={editingBreakdown.subType || DEFAULT_BREAKDOWN_SUB_TYPE}
                      onChange={(e) => handleSubTypeChange(e.target.value as BreakdownSubType)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10"
                    >
                      {getTranslatedBreakdownSubTypes().map((subType) => (
                        <option key={subType.value} value={subType.value}>
                          {subType.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {editingBreakdown.type !== 'Custom' && (
                <>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <HelpIcon
                        tooltip={
                          editingBreakdown.type === 'Hebdomadaire' || editingBreakdown.type === 'PEBs' ? 
                            t('campaigns.formBreakdown.modal.startDateHelpWeekly') :
                          editingBreakdown.type === 'Mensuel' ? 
                            t('campaigns.formBreakdown.modal.startDateHelpMonthly') :
                          t('campaigns.formBreakdown.modal.startDateHelpCustom')
                        }
                        onTooltipChange={onTooltipChange}
                      />
                      <label className="block text-sm font-medium text-gray-700">
                        {t('campaigns.formBreakdown.modal.startDateLabel')}
                      </label>
                    </div>
                    <input
                      type="date"
                      value={editingBreakdown.startDate}
                      onChange={(e) => setEditingBreakdown({
                        ...editingBreakdown,
                        startDate: e.target.value
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    {getDateValidationError(editingBreakdown.startDate, true) && (
                      <p className="text-red-600 text-xs mt-1">
                        {getDateValidationError(editingBreakdown.startDate, true)}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <HelpIcon
                        tooltip={t('campaigns.formBreakdown.modal.endDateHelp')}
                        onTooltipChange={onTooltipChange}
                      />
                      <label className="block text-sm font-medium text-gray-700">
                        {t('campaigns.formBreakdown.modal.endDateLabel')}
                      </label>
                    </div>
                    <input
                      type="date"
                      value={editingBreakdown.endDate}
                      onChange={(e) => setEditingBreakdown({
                        ...editingBreakdown,
                        endDate: e.target.value
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    {editingBreakdown.endDate && editingBreakdown.startDate &&
                      new Date(editingBreakdown.endDate) <= new Date(editingBreakdown.startDate) && (
                        <p className="text-red-600 text-xs mt-1">                          
                          {t('campaigns.formBreakdown.modal.endDateAfterStartError')}
                        </p>
                      )}
                  </div>
                </>
              )}

              {editingBreakdown.type === 'Custom' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <HelpIcon
                        tooltip={t('campaigns.formBreakdown.modal.customPeriodsHelp')}
                        onTooltipChange={onTooltipChange}
                      />
                      <label className="block text-sm font-medium text-gray-700">
                        {t('campaigns.formBreakdown.modal.customPeriodsLabel')}
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomPeriod}
                      className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                      {t('campaigns.formBreakdown.modal.addPeriod')}
                    </button>
                  </div>

                  <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                    {(editingBreakdown.customPeriods || []).map((period, index) => {
                      const validation = getCustomPeriodsValidation();
                      const hasError = !validation.isValid && validation.errors[index];

                      return (
                        <div key={index} className={`border rounded-lg p-4 ${hasError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">
                              {t('campaigns.formBreakdown.modal.period')} {index + 1}
                            </span>
                            {(editingBreakdown.customPeriods || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomPeriod(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                {t('campaigns.formBreakdown.modal.periodNameLabel')}
                              </label>
                              <input
                                type="text"
                                value={period.name}
                                onChange={(e) => handleUpdateCustomPeriod(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                placeholder={t('campaigns.formBreakdown.modal.periodNamePlaceholder')}
                              />
                            </div>
                          </div>

                          {hasError && (
                            <p className="text-red-600 text-xs mt-2">
                              {validation.errors[index]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {(() => {
                    const validation = getCustomPeriodsValidation();
                    return !validation.isValid && validation.globalError && (
                      <p className="text-red-600 text-sm mt-2">
                        {validation.globalError}
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setEditingBreakdown(null);
                  setIsCreating(false);
                  setError(null);
                }}
                disabled={isDisabled}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveBreakdown}
                disabled={isDisabled || !isFormValid()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isDisabled ? t('campaigns.formBreakdown.modal.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CampaignFormBreakdown.displayName = 'CampaignFormBreakdown';

export default CampaignFormBreakdown;