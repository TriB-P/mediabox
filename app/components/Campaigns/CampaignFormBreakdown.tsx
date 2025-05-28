// app/components/Campaigns/CampaignFormBreakdown.tsx

'use client';

import React, { useState, useEffect, memo } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  CalendarIcon,
  ClockIcon,
  Cog6ToothIcon
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
  BREAKDOWN_TYPES,
  DEFAULT_BREAKDOWN_NAME 
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
  loading = false
}) => {
  // États
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
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
        startDate: getClosestMonday(campaignStartDate),
        endDate: campaignEndDate,
        isDefault: true,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBreakdowns([virtualDefaultBreakdown]);
    }
  }, [campaignId, campaignStartDate, campaignEndDate]);

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
    if (breakdowns.length >= 3) {
      setError('Maximum 3 planifications autorisées');
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
    setEditingBreakdown({
      id: breakdown.id,
      name: breakdown.name,
      type: breakdown.type,
      startDate: breakdown.startDate,
      endDate: breakdown.endDate,
      isDefault: breakdown.isDefault,
    });
    setIsCreating(false);
  };

  // Gestionnaire pour sauvegarder un breakdown
  const handleSaveBreakdown = async () => {
    if (!editingBreakdown || !campaignId) return;

    try {
      setLocalLoading(true);
      setError(null);

      if (isCreating) {
        await createBreakdown(clientId, campaignId, editingBreakdown);
      } else if (editingBreakdown.id) {
        await updateBreakdown(clientId, campaignId, editingBreakdown.id, editingBreakdown);
      }

      await loadBreakdowns();
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

    // Ajuster la date de début selon le nouveau type
    if (newType === 'Hebdomadaire') {
      adjustedStartDate = getClosestMonday(editingBreakdown.startDate);
    } else if (newType === 'Mensuel') {
      adjustedStartDate = getFirstOfMonth(editingBreakdown.startDate);
    }

    setEditingBreakdown({
      ...editingBreakdown,
      type: newType,
      startDate: adjustedStartDate,
    });
  };

  // Valider les données en temps réel
  const getDateValidationError = (date: string, isStartDate: boolean): string | null => {
    if (!editingBreakdown) return null;
    
    const validation = validateBreakdownDate(date, editingBreakdown.type, isStartDate);
    return validation.isValid ? null : (validation.error || null);
  };

  const isFormValid = (): boolean => {
    if (!editingBreakdown) return false;
    
    return (
      editingBreakdown.name.trim() !== '' &&
      editingBreakdown.startDate !== '' &&
      editingBreakdown.endDate !== '' &&
      new Date(editingBreakdown.endDate) > new Date(editingBreakdown.startDate) &&
      !getDateValidationError(editingBreakdown.startDate, true) &&
      !getDateValidationError(editingBreakdown.endDate, false)
    );
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
        title="Planification temporelle"
        description="Définissez comment sera divisée votre campagne dans le temps"
      >
        {/* Messages d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Liste des breakdowns existants */}
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
                        {breakdown.type} • {breakdown.startDate} → {breakdown.endDate}
                      </p>
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
        </div>

        {/* Bouton d'ajout */}
        {breakdowns.length < 3 && campaignId && (
          <button
            type="button"
            onClick={handleCreateBreakdown}
            disabled={isDisabled}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-gray-500 hover:border-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          >
            <PlusIcon className="h-6 w-6 mx-auto mb-2" />
            <span className="block text-sm font-medium">
              Ajouter une planification
            </span>
            <span className="block text-xs">
              ({breakdowns.length}/3)
            </span>
          </button>
        )}

        {/* Message pour nouvelle campagne */}
        {!campaignId && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <p className="text-sm">
              La planification par défaut sera créée automatiquement lors de la sauvegarde de la campagne. 
              Vous pourrez ajouter d'autres planifications après la création.
            </p>
          </div>
        )}
      </FormSection>

      {/* Modal d'édition */}
      {editingBreakdown && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {isCreating ? 'Nouvelle planification' : 'Modifier la planification'}
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {/* Nom */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <HelpIcon 
                    tooltip="Nom descriptif de cette planification temporelle"
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
                    tooltip="Type de planification : Hebdomadaire (début lundi), Mensuel (début 1er du mois) ou Personnalisé (dates libres)"
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

              {/* Date de début */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <HelpIcon 
                    tooltip={`Date de début de la planification${
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
                    tooltip="Date de fin de la planification"
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