'use client';

import React, { memo, useCallback } from 'react';
import { 
  SmartSelect, 
  SelectionButtons,
  createLabelWithHelp 
} from './TactiqueFormComponents';
import SearchableSelect from '../SearchableSelect';

// ==================== TYPES ====================

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

interface KPIData {
  TC_Kpi: string;
  TC_Kpi_CostPer: number;
  TC_Kpi_Volume: number;
}

interface TactiqueFormKPIProps {
  // Données du formulaire
  formData: {
    TC_Media_Objective?: string;
  };
  
  // KPIs multiples
  kpis: KPIData[];
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  onKpiChange: (index: number, field: keyof KPIData, value: string | number) => void;
  onAddKpi: () => void;
  onRemoveKpi: (index: number) => void;
  
  // Données externes
  dynamicLists: { [key: string]: ListItem[] };
  
  // État de chargement
  loading?: boolean;
}

// ==================== COMPOSANTS ====================

/**
 * Composant pour un KPI individuel
 */
const KPIItem = memo<{
  kpi: KPIData;
  index: number;
  canRemove: boolean;
  kpiOptions: ListItem[];
  onKpiChange: (index: number, field: keyof KPIData, value: string | number) => void;
  onRemove: (index: number) => void;
  onTooltipChange: (tooltip: string | null) => void;
}>(({ 
  kpi, 
  index, 
  canRemove, 
  kpiOptions, 
  onKpiChange, 
  onRemove, 
  onTooltipChange 
}) => {
  
  const handleKpiTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onKpiChange(index, 'TC_Kpi', e.target.value);
  }, [index, onKpiChange]);

  const handleCostPerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onKpiChange(index, 'TC_Kpi_CostPer', parseFloat(e.target.value) || 0);
  }, [index, onKpiChange]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onKpiChange(index, 'TC_Kpi_Volume', parseFloat(e.target.value) || 0);
  }, [index, onKpiChange]);

  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-medium text-gray-800">
          KPI #{index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Supprimer
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Type */}
        {kpiOptions.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                'KPI', 
                'Masquer si aucune liste trouvée', 
                onTooltipChange
              )}
            </div>
            {kpiOptions.length <= 5 ? (
              <SelectionButtons
                options={kpiOptions.map(item => ({ 
                  id: item.id, 
                  label: item.SH_Display_Name_FR 
                }))}
                value={kpi.TC_Kpi}
                onChange={handleKpiTypeChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
                name={`TC_Kpi_${index}`}
                placeholder="Sélectionner un KPI..."
              />
            ) : (
              <SearchableSelect
                id={`TC_Kpi_${index}`}
                name={`TC_Kpi_${index}`}
                value={kpi.TC_Kpi}
                onChange={handleKpiTypeChange}
                options={kpiOptions.map(item => ({ 
                  id: item.id, 
                  label: item.SH_Display_Name_FR 
                }))}
                placeholder="Sélectionner un KPI..."
                label=""
              />
            )}
          </div>
        )}

        {/* Cost Per */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              'Coût par', 
              'Champs libre', 
              onTooltipChange
            )}
          </div>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              value={kpi.TC_Kpi_CostPer}
              onChange={handleCostPerChange}
              min="0"
              step="0.01"
              className="block w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Volume */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              'Volume', 
              'Champs libre', 
              onTooltipChange
            )}
          </div>
          <input
            type="number"
            value={kpi.TC_Kpi_Volume}
            onChange={handleVolumeChange}
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
});

KPIItem.displayName = 'KPIItem';

// ==================== COMPOSANT PRINCIPAL ====================

const TactiqueFormKPI = memo<TactiqueFormKPIProps>(({
  formData,
  kpis,
  onChange,
  onTooltipChange,
  onKpiChange,
  onAddKpi,
  onRemoveKpi,
  dynamicLists,
  loading = false
}) => {
  // Options pour les KPIs
  const kpiOptions = dynamicLists.TC_Kpi || [];
  
  // Désactiver les champs si en cours de chargement
  const isDisabled = loading;
  
  // Gestionnaires optimisés
  const handleAddKpi = useCallback(() => {
    if (kpis.length < 5) {
      onAddKpi();
    }
  }, [kpis.length, onAddKpi]);

  return (
    <div className="p-8 space-y-8">
      {/* En-tête de section */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          KPIs et objectifs
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Définition des indicateurs de performance
        </p>
      </div>
      
      {/* TC_Media_Objective */}
      {(dynamicLists.TC_Media_Objective && dynamicLists.TC_Media_Objective.length > 0) && (
        <SmartSelect
          id="TC_Media_Objective"
          name="TC_Media_Objective"
          value={formData.TC_Media_Objective || ''}
          onChange={onChange}
          options={dynamicLists.TC_Media_Objective?.map(item => ({ 
            id: item.id, 
            label: item.SH_Display_Name_FR 
          })) || []}
          placeholder="Sélectionner un objectif média..."
          label={createLabelWithHelp(
            'Objectif média', 
            'Masquer si aucune liste trouvée', 
            onTooltipChange
          )}
        />
      )}

      {/* Section KPIs multiples */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800">
              KPIs de performance
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Jusqu'à 5 KPIs peuvent être définis
            </p>
          </div>
          {kpis.length < 5 && !isDisabled && (
            <button
              type="button"
              onClick={handleAddKpi}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              + Ajouter un KPI
            </button>
          )}
        </div>

        {/* Liste des KPIs */}
        <div className="space-y-6">
          {kpis.map((kpi, index) => (
            <KPIItem
              key={index}
              kpi={kpi}
              index={index}
              canRemove={kpis.length > 1 && !isDisabled}
              kpiOptions={kpiOptions}
              onKpiChange={onKpiChange}
              onRemove={onRemoveKpi}
              onTooltipChange={onTooltipChange}
            />
          ))}
        </div>

        {/* Message si aucun KPI */}
        {kpis.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Aucun KPI défini. Ajoutez un KPI pour commencer.
            </p>
            <button
              type="button"
              onClick={handleAddKpi}
              disabled={isDisabled}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              + Ajouter le premier KPI
            </button>
          </div>
        )}

        {/* Limite atteinte */}
        {kpis.length >= 5 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            <p className="text-sm">
              Limite maximale de 5 KPIs atteinte. Supprimez un KPI existant pour en ajouter un nouveau.
            </p>
          </div>
        )}
      </div>

      {/* Message d'information si en chargement */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">Chargement des données...</p>
        </div>
      )}

      {/* Message si aucune liste KPI disponible */}
      {kpiOptions.length === 0 && !loading && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
          <p className="text-sm">
            Aucun KPI disponible dans les listes dynamiques. 
            Les champs de coût et volume restent utilisables.
          </p>
        </div>
      )}
    </div>
  );
});

TactiqueFormKPI.displayName = 'TactiqueFormKPI';

export default TactiqueFormKPI;