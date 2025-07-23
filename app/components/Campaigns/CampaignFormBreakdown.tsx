/**
 * @file Ce fichier contient le composant React `CampaignFormBreakdown`, qui gère la section "Répartition temporelle"
 * du formulaire de création ou d'édition d'une campagne. Il permet aux utilisateurs de définir comment la campagne est
 * divisée dans le temps (hebdomadairement, mensuellement, ou en périodes personnalisées).
 * Le composant interagit avec Firebase pour sauvegarder et charger ces répartitions (breakdowns).
 */

'use client';

import React, { useState, useEffect, memo } from 'react';
import {
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  Cog6ToothIcon,
  XMarkIcon,
  LockClosedIcon
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
  CustomPeriodFormData,
  BREAKDOWN_TYPES,
  DEFAULT_BREAKDOWN_NAME,
  createEmptyCustomPeriod,
  validateCustomPeriods
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
 * @param {CampaignFormBreakdownProps} props - Les propriétés du composant.
 * @returns {React.ReactElement} Le JSX du composant de formulaire de répartition.
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
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [additionalBreakdowns, setAdditionalBreakdowns] = useState<BreakdownFormData[]>([]);
  const [editingBreakdown, setEditingBreakdown] = useState<BreakdownEditData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      console.log(`FIREBASE: LECTURE - Fichier: CampaignFormBreakdown.tsx - Fonction: loadBreakdowns - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns`);
      const data = await getBreakdowns(clientId, campaignId);
      setBreakdowns(data);
    } catch (err) {
      console.error('Erreur lors du chargement des breakdowns:', err);
      setError('Erreur lors du chargement des planifications');
    } finally {
      setLocalLoading(false);
    }
  };

  /**
   * Prépare l'état pour la création d'une nouvelle répartition en ouvrant le formulaire modal.
   */
  const handleCreateBreakdown = () => {
    if (!campaignStartDate || !campaignEndDate) {
      setError('Les dates de campagne doivent être définies avant de créer une répartition');
      return;
    }

    if (breakdowns.length >= 3) {
      setError('Maximum 3 répartitions autorisées');
      return;
    }

    const newBreakdown: BreakdownEditData = {
      name: '',
      type: 'Hebdomadaire',
      startDate: getClosestMonday(campaignStartDate),
      endDate: campaignEndDate,
    };

    setEditingBreakdown(newBreakdown);
    setIsCreating(true);
  };

  /**
   * Prépare l'état pour la modification d'une répartition existante en ouvrant le formulaire modal.
   * @param {Breakdown} breakdown - La répartition à modifier.
   */
  const handleEditBreakdown = (breakdown: Breakdown) => {
    if (breakdown.isDefault) {
      setError('Le breakdown par défaut "Calendrier" ne peut pas être modifié. Ses dates sont automatiquement synchronisées avec les dates de la campagne.');
      return;
    }

    const editData: BreakdownEditData = {
      id: breakdown.id,
      name: breakdown.name,
      type: breakdown.type,
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
   * Sauvegarde les modifications d'une répartition. Si la campagne existe, l'opération se fait sur Firebase.
   * Sinon, les données sont gérées localement pour une future création.
   */
  const handleSaveBreakdown = async () => {
    if (!editingBreakdown) return;

    try {
      setLocalLoading(true);
      setError(null);

      if (campaignId) {
        if (isCreating) {
          console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignFormBreakdown.tsx - Fonction: handleSaveBreakdown - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns`);
          await createBreakdown(clientId, campaignId, editingBreakdown);
        } else if (editingBreakdown.id) {
          console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignFormBreakdown.tsx - Fonction: handleSaveBreakdown - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns/${editingBreakdown.id}`);
          await updateBreakdown(clientId, campaignId, editingBreakdown.id, editingBreakdown);
        }
        await loadBreakdowns();
      } else {
        const newBreakdownData: BreakdownFormData = {
          name: editingBreakdown.name,
          type: editingBreakdown.type,
          startDate: editingBreakdown.startDate,
          endDate: editingBreakdown.endDate,
          customPeriods: editingBreakdown.customPeriods
        };

        setAdditionalBreakdowns(prev => [...prev, newBreakdownData]);

        const virtualBreakdown: Breakdown = {
          id: `temp_${Date.now()}`,
          name: editingBreakdown.name,
          type: editingBreakdown.type,
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
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLocalLoading(false);
    }
  };

  /**
   * Supprime une répartition temporelle de Firebase.
   * @param {string} breakdownId - L'ID de la répartition à supprimer.
   */
  const handleDeleteBreakdown = async (breakdownId: string) => {
    if (!campaignId) return;

    const breakdown = breakdowns.find(b => b.id === breakdownId);
    if (breakdown?.isDefault) {
      setError('Impossible de supprimer la planification par défaut');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette planification ?')) {
      return;
    }

    try {
      setLocalLoading(true);
      setError(null);
      console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignFormBreakdown.tsx - Fonction: handleDeleteBreakdown - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns/${breakdownId}`);
      await deleteBreakdown(clientId, campaignId, breakdownId);
      await loadBreakdowns();
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setLocalLoading(false);
    }
  };

  /**
   * Gère le changement de type de répartition dans le formulaire d'édition.
   * Ajuste automatiquement la date de début et la structure des données.
   * @param {BreakdownType} newType - Le nouveau type de répartition sélectionné.
   */
  const handleTypeChange = (newType: BreakdownType) => {
    if (!editingBreakdown) return;

    let adjustedStartDate = editingBreakdown.startDate;
    let updatedBreakdown = { ...editingBreakdown };

    if (newType === 'Hebdomadaire') {
      adjustedStartDate = getClosestMonday(editingBreakdown.startDate);
      updatedBreakdown.customPeriods = undefined;
    } else if (newType === 'Mensuel') {
      adjustedStartDate = getFirstOfMonth(editingBreakdown.startDate);
      updatedBreakdown.customPeriods = undefined;
    } else if (newType === 'Custom') {
      updatedBreakdown.customPeriods = [createEmptyCustomPeriod()];
    }

    updatedBreakdown.type = newType;
    updatedBreakdown.startDate = adjustedStartDate;

    setEditingBreakdown(updatedBreakdown);
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
   * @param {number} index - L'index de la période à supprimer.
   */
  const handleRemoveCustomPeriod = (index: number) => {
    if (!editingBreakdown || editingBreakdown.type !== 'Custom') return;

    const currentPeriods = editingBreakdown.customPeriods || [];
    if (currentPeriods.length <= 1) {
      setError('Au moins une période doit être définie');
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
   * @param {number} index - L'index de la période à mettre à jour.
   * @param {keyof CustomPeriodFormData} field - Le champ à modifier ('name' ou 'order').
   * @param {string | number} value - La nouvelle valeur.
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
   * @param {string} date - La date à valider.
   * @param {boolean} isStartDate - Indique s'il s'agit de la date de début.
   * @returns {string | null} Le message d'erreur ou null si valide.
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
   * @returns {{ isValid: boolean, errors: Record<number, string>, globalError?: string }} Un objet contenant le statut de validation et les erreurs.
   */
  const getCustomPeriodsValidation = () => {
    if (!editingBreakdown || editingBreakdown.type !== 'Custom' || !editingBreakdown.customPeriods) {
      return { isValid: true, errors: {} };
    }

    return validateCustomPeriods(editingBreakdown.customPeriods);
  };

  /**
   * Vérifie si le formulaire d'édition est valide et prêt à être sauvegardé.
   * @returns {boolean} `true` si le formulaire est valide, sinon `false`.
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
   * @param {BreakdownType} type - Le type de répartition.
   * @returns {React.ElementType} Le composant icône.
   */
  const getTypeIcon = (type: BreakdownType) => {
    switch (type) {
      case 'Hebdomadaire':
        return CalendarIcon;
      case 'Mensuel':
        return ClockIcon;
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
        title="Répartition temporelle"
        description="Définissez comment sera divisée votre campagne dans le temps"
      >
        {(!campaignStartDate || !campaignEndDate) && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Dates requises :</strong> Veuillez définir les dates de début et de fin de la campagne
              dans l'onglet "Dates" avant de configurer les répartitions.
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
              Fermer
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
                              (Par défaut - Synchronisé avec les dates de campagne)
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {breakdown.type}
                          {breakdown.type !== 'Custom' && (
                            <> • {breakdown.startDate} → {breakdown.endDate}</>
                          )}
                          {breakdown.type === 'Custom' && breakdown.customPeriods && (
                            <> • {breakdown.customPeriods.length} période(s)</>
                          )}
                          {breakdown.isDefault && (
                            <> • Mis à jour automatiquement</>
                          )}
                        </p>
                        {breakdown.type === 'Custom' && breakdown.customPeriods && (
                          <div className="mt-2 space-y-1">
                            {breakdown.customPeriods.map((period, index) => (
                              <div key={period.id} className="text-xs text-gray-600">
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
                            Modifier
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
                          Non modifiable
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>)}

        {(campaignStartDate && campaignEndDate) && breakdowns.length < 3 && (
          <button
            type="button"
            onClick={handleCreateBreakdown}
            disabled={isDisabled}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-gray-500 hover:border-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          >
            <PlusIcon className="h-6 w-6 mx-auto mb-2" />
            <span className="block text-sm font-medium">
              Ajouter une répartition
            </span>
            <span className="block text-xs">
              ({breakdowns.length}/3)
            </span>
          </button>
        )}

        {(campaignStartDate && campaignEndDate) && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <p className="text-sm">
              <strong>📅 Breakdown par défaut :</strong> Le breakdown "Calendrier" est automatiquement créé et
              synchronisé avec les dates de votre campagne. Il commence toujours un lundi et ne peut pas être modifié manuellement.
            </p>
          </div>
        )}
      </FormSection>

      {editingBreakdown && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {isCreating ? 'Nouvelle répartition' : 'Modifier la répartition'}
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <HelpIcon
                    tooltip="Nom descriptif de cette répartition temporelle"
                    onTooltipChange={onTooltipChange}
                  />
                  <label className="block text-sm font-medium text-gray-700">
                    Nom *
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
                  placeholder="Ex: Sprint 1, Phase initiale..."
                />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <HelpIcon
                    tooltip="Type de répartition : Hebdomadaire (début lundi), Mensuel (début 1er du mois) ou Personnalisé (périodes multiples)"
                    onTooltipChange={onTooltipChange}
                  />
                  <label className="block text-sm font-medium text-gray-700">
                    Type *
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {BREAKDOWN_TYPES.map((type) => {
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

              {editingBreakdown.type !== 'Custom' && (
                <>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <HelpIcon
                        tooltip={`Date de début de la répartition${editingBreakdown.type === 'Hebdomadaire' ? ' (doit être un lundi)' :
                            editingBreakdown.type === 'Mensuel' ? ' (doit être le 1er du mois)' :
                              ''
                          }`}
                        onTooltipChange={onTooltipChange}
                      />
                      <label className="block text-sm font-medium text-gray-700">
                        Date de début *
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
                        tooltip="Date de fin de la répartition"
                        onTooltipChange={onTooltipChange}
                      />
                      <label className="block text-sm font-medium text-gray-700">
                        Date de fin *
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
                          La date de fin doit être postérieure à la date de début
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
                        tooltip="Définissez autant de périodes que nécessaire (ex: Q1, Q2, Phase 1, etc.). Seuls les noms sont requis."
                        onTooltipChange={onTooltipChange}
                      />
                      <label className="block text-sm font-medium text-gray-700">
                        Périodes personnalisées *
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomPeriod}
                      className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Ajouter une période
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
                              Période {index + 1}
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
                                Nom de la période *
                              </label>
                              <input
                                type="text"
                                value={period.name}
                                onChange={(e) => handleUpdateCustomPeriod(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                placeholder="Ex: Q1, Phase 1, Sprint 1..."
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
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveBreakdown}
                disabled={isDisabled || !isFormValid()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isDisabled ? 'Sauvegarde...' : 'Sauvegarder'}
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