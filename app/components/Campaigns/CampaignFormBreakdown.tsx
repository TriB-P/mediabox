// app/components/Campaigns/CampaignFormBreakdown.tsx

'use client';

import React, { useState, useEffect, memo } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  CalendarIcon,
  ClockIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  HelpIcon, 
  createLabelWithHelp,
  FormSection 
} from '../Tactiques/TactiqueFormComponents';
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

// ==================== TYPES ====================

interface CampaignFormBreakdownProps {
  clientId: string;
  campaignId?: string; // Optionnel pour nouvelle campagne
  campaignStartDate: string;
  campaignEndDate: string;
  onTooltipChange: (tooltip: string | null) => void;
  onBreakdownsChange?: (breakdowns: BreakdownFormData[]) => void; // Callback pour les nouvelles campagnes
  loading?: boolean;
}

interface BreakdownEditData extends BreakdownFormData {
  id?: string;
  isDefault?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const CampaignFormBreakdown = memo<CampaignFormBreakdownProps>(({
  clientId,
  campaignId,
  campaignStartDate,
  campaignEndDate,
  onTooltipChange,
  onBreakdownsChange,
  loading = false
}) => {
  // États
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [additionalBreakdowns, setAdditionalBreakdowns] = useState<BreakdownFormData[]>([]); // Pour nouvelles campagnes
  const [editingBreakdown, setEditingBreakdown] = useState<BreakdownEditData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les breakdowns existants
  useEffect(() => {
    if (campaignId) {
      loadBreakdowns();
    } else {
      // Pour une nouvelle campagne, afficher seulement le breakdown par défaut virtuel
      const virtualDefaultBreakdown: Breakdown = {
        id: 'default',
        name: DEFAULT_BREAKDOWN_NAME,
        type: 'Hebdomadaire',
        startDate: campaignStartDate ? getClosestMonday(campaignStartDate) : '',
        endDate: campaignEndDate || '',
        isDefault: true,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBreakdowns([virtualDefaultBreakdown]);
      setAdditionalBreakdowns([]);
    }
  }, [campaignId, campaignStartDate, campaignEndDate]);

  // Notifier le parent quand les breakdowns additionnels changent (pour nouvelles campagnes)
  useEffect(() => {
    if (!campaignId && onBreakdownsChange) {
      onBreakdownsChange(additionalBreakdowns);
    }
  }, [additionalBreakdowns, campaignId, onBreakdownsChange]);

  const loadBreakdowns = async () => {
    if (!campaignId) return;
    
    try {
      setLocalLoading(true);
      setError(null);
      const data = await getBreakdowns(clientId, campaignId);
      setBreakdowns(data);
    } catch (err) {
      console.error('Erreur lors du chargement des breakdowns:', err);
      setError('Erreur lors du chargement des planifications');
    } finally {
      setLocalLoading(false);
    }
  };

  // Gestionnaire pour créer un nouveau breakdown
  const handleCreateBreakdown = () => {
    // Vérifier que les dates de campagne sont définies
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

  // Gestionnaire pour éditer un breakdown existant
  const handleEditBreakdown = (breakdown: Breakdown) => {
    const editData: BreakdownEditData = {
      id: breakdown.id,
      name: breakdown.name,
      type: breakdown.type,
      startDate: breakdown.startDate,
      endDate: breakdown.endDate,
      isDefault: breakdown.isDefault,
    };

    // Si c'est un breakdown Custom, copier les périodes
    if (breakdown.type === 'Custom' && breakdown.customPeriods) {
      editData.customPeriods = breakdown.customPeriods.map(period => ({
        name: period.name,
        order: period.order
      }));
    }

    setEditingBreakdown(editData);
    setIsCreating(false);
  };

  // Gestionnaire pour sauvegarder un breakdown
  const handleSaveBreakdown = async () => {
    if (!editingBreakdown) return;

    try {
      setLocalLoading(true);
      setError(null);

      if (campaignId) {
        // Campagne existante - sauvegarder directement dans Firestore
        if (isCreating) {
          await createBreakdown(clientId, campaignId, editingBreakdown);
        } else if (editingBreakdown.id) {
          await updateBreakdown(clientId, campaignId, editingBreakdown.id, editingBreakdown);
        }
        await loadBreakdowns();
      } else {
        // Nouvelle campagne - ajouter à la liste locale et aux breakdowns additionnels
        const newBreakdownData: BreakdownFormData = {
          name: editingBreakdown.name,
          type: editingBreakdown.type,
          startDate: editingBreakdown.startDate,
          endDate: editingBreakdown.endDate,
          customPeriods: editingBreakdown.customPeriods
        };

        // Ajouter aux breakdowns additionnels pour le parent
        setAdditionalBreakdowns(prev => [...prev, newBreakdownData]);

        // Créer un breakdown virtuel pour l'affichage
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

  // Gestionnaire pour supprimer un breakdown
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
      await deleteBreakdown(clientId, campaignId, breakdownId);
      await loadBreakdowns();
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setLocalLoading(false);
    }
  };

  // Gestionnaire pour changer le type de breakdown en édition
  const handleTypeChange = (newType: BreakdownType) => {
    if (!editingBreakdown) return;

    let adjustedStartDate = editingBreakdown.startDate;
    let updatedBreakdown = { ...editingBreakdown };

    // Ajuster la date de début selon le nouveau type
    if (newType === 'Hebdomadaire') {
      adjustedStartDate = getClosestMonday(editingBreakdown.startDate);
      updatedBreakdown.customPeriods = undefined;
    } else if (newType === 'Mensuel') {
      adjustedStartDate = getFirstOfMonth(editingBreakdown.startDate);
      updatedBreakdown.customPeriods = undefined;
    } else if (newType === 'Custom') {
      // Initialiser avec une période par défaut pour Custom
      updatedBreakdown.customPeriods = [createEmptyCustomPeriod()];
    }

    updatedBreakdown.type = newType;
    updatedBreakdown.startDate = adjustedStartDate;

    setEditingBreakdown(updatedBreakdown);
  };

  // ==================== GESTION DES PÉRIODES CUSTOM ====================

  const handleAddCustomPeriod = () => {
    if (!editingBreakdown || editingBreakdown.type !== 'Custom') return;

    const currentPeriods = editingBreakdown.customPeriods || [];
    const newPeriod = createEmptyCustomPeriod(currentPeriods.length);

    setEditingBreakdown({
      ...editingBreakdown,
      customPeriods: [...currentPeriods, newPeriod]
    });
  };

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

  // Valider les données en temps réel
  const getDateValidationError = (date: string, isStartDate: boolean): string | null => {
    if (!editingBreakdown) return null;
    
    if (editingBreakdown.type === 'Custom') {
      // Pour Custom, on valide via validateCustomPeriods
      return null;
    }
    
    const validation = validateBreakdownDate(date, editingBreakdown.type, isStartDate);
    return validation.isValid ? null : (validation.error || null);
  };

  const getCustomPeriodsValidation = () => {
    if (!editingBreakdown || editingBreakdown.type !== 'Custom' || !editingBreakdown.customPeriods) {
      return { isValid: true, errors: {} };
    }

    return validateCustomPeriods(editingBreakdown.customPeriods);
  };

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

  // Icônes pour les types
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
      {/* En-tête de section */}
      <FormSection
        title="Répartition temporelle"
        description="Définissez comment sera divisée votre campagne dans le temps"
      >
        {/* Vérification des dates de campagne */}
        {(!campaignStartDate || !campaignEndDate) && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Dates requises :</strong> Veuillez définir les dates de début et de fin de la campagne 
              dans l'onglet "Dates" avant de configurer les répartitions.
            </p>
          </div>
        )}

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Liste des breakdowns existants */}
        {(campaignStartDate && campaignEndDate) && (
          <div className="space-y-4">
          {breakdowns.map((breakdown) => {
            const TypeIcon = getTypeIcon(breakdown.type);
            
            return (
              <div
                key={breakdown.id}
                className={`border rounded-lg p-4 ${
                  breakdown.isDefault 
                    ? 'border-indigo-200 bg-indigo-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TypeIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {breakdown.name}
                        {breakdown.isDefault && (
                          <span className="ml-2 text-xs text-indigo-600 font-normal">
                            (Par défaut)
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
                      </p>
                      {/* Affichage des périodes Custom */}
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
                    <button
                      type="button"
                      onClick={() => handleEditBreakdown(breakdown)}
                      disabled={isDisabled}
                      className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                    >
                      Modifier
                    </button>
                    {!breakdown.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBreakdown(breakdown.id)}
                        disabled={isDisabled}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>)}

        {/* Bouton d'ajout */}
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

        {/* Message pour nouvelle campagne */}
        {!campaignId && (campaignStartDate && campaignEndDate) && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <p className="text-sm">
              La répartition "Calendrier" par défaut sera créée automatiquement lors de la sauvegarde de la campagne. 
              Vous pouvez ajouter d'autres répartitions dès maintenant.
            </p>
          </div>
        )}
      </FormSection>

      {/* Modal d'édition */}
      {editingBreakdown && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {isCreating ? 'Nouvelle répartition' : 'Modifier la répartition'}
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {/* Nom */}
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

              {/* Type */}
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
                        className={`flex flex-col items-center p-3 border rounded-lg transition-colors disabled:bg-gray-100 ${
                          editingBreakdown.type === type.value
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

              {/* Dates globales (pour Hebdomadaire et Mensuel) */}
              {editingBreakdown.type !== 'Custom' && (
                <>
                  {/* Date de début */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <HelpIcon 
                        tooltip={`Date de début de la répartition${
                          editingBreakdown.type === 'Hebdomadaire' ? ' (doit être un lundi)' :
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

                  {/* Date de fin */}
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

              {/* Interface pour les périodes Custom */}
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

                  {/* Liste des périodes */}
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
                            {/* Nom de la période */}
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
                  
                  {/* Erreur globale pour les périodes Custom */}
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

            {/* Boutons */}
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