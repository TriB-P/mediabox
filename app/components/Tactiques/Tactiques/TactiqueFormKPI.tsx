// app/components/Tactiques/Tactiques/TactiqueFormKPI.tsx
/**
 * @file app/components/forms/TactiqueFormKPI.tsx
 * Ce fichier définit les composants React nécessaires pour la section "KPIs et objectifs"
 * d'un formulaire de tactique. Il est composé de deux éléments principaux :
 * - KPIItem : Un composant pour afficher et gérer un seul indicateur de performance (KPI).
 * - TactiqueFormKPI : Le composant principal qui orchestre l'affichage de l'objectif
 * média et une liste dynamique de composants KPIItem.
 * Ce fichier est purement présentationnel ("dumb component") ; il reçoit toutes les données
 * et les fonctions de gestion d'état via ses props depuis un composant parent.
 * VERSION MODIFIÉE : Les valeurs numériques des KPIs sont initialement vides au lieu de 0
 */

'use client';

import React, { memo, useCallback } from 'react';
import { 
  SmartSelect, 
  SelectionButtons,
  createLabelWithHelp 
} from './TactiqueFormComponents';
import SearchableSelect from '../SearchableSelect';

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

/**
 * MODIFIÉ : Interface KPIData avec valeurs numériques optionnelles
 * Les champs TC_Kpi_CostPer et TC_Kpi_Volume peuvent être undefined pour rester vides initialement
 */
interface KPIData {
  TC_Kpi: string;
  TC_Kpi_CostPer?: number; // MODIFIÉ : Optionnel pour permettre valeurs vides
  TC_Kpi_Volume?: number;  // MODIFIÉ : Optionnel pour permettre valeurs vides
}

interface TactiqueFormKPIProps {
  formData: {
    TC_Media_Objective?: string;
  };
  kpis: KPIData[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  onKpiChange: (index: number, field: keyof KPIData, value: string | number | undefined) => void; // MODIFIÉ : Accepter undefined
  onAddKpi: () => void;
  onRemoveKpi: (index: number) => void;
  dynamicLists: { [key: string]: ListItem[] };
  loading?: boolean;
}

/**
 * Affiche un formulaire pour un seul KPI.
 * Ce composant est mémoïsé pour optimiser les performances lors de la mise à jour de la liste de KPIs.
 * MODIFIÉ : Gestion des valeurs vides pour les champs numériques
 */
const KPIItem = memo<{
  kpi: KPIData;
  index: number;
  canRemove: boolean;
  kpiOptions: ListItem[];
  onKpiChange: (index: number, field: keyof KPIData, value: string | number | undefined) => void;
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
  
  /**
   * Gère le changement de la sélection du type de KPI.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - L'événement de changement.
   */
  const handleKpiTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onKpiChange(index, 'TC_Kpi', e.target.value);
  }, [index, onKpiChange]);

  /**
   * MODIFIÉ : Gère le changement de la valeur du champ "Coût par" avec support des valeurs vides.
   * @param {React.ChangeEvent<HTMLInputElement>} e - L'événement de changement.
   */
  const handleCostPerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Si le champ est vide, passer undefined, sinon parser la valeur
    const numericValue = value === '' ? undefined : parseFloat(value);
    onKpiChange(index, 'TC_Kpi_CostPer', numericValue);
  }, [index, onKpiChange]);

  /**
   * MODIFIÉ : Gère le changement de la valeur du champ "Volume" avec support des valeurs vides.
   * @param {React.ChangeEvent<HTMLInputElement>} e - L'événement de changement.
   */
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Si le champ est vide, passer undefined, sinon parser la valeur
    const numericValue = value === '' ? undefined : parseFloat(value);
    onKpiChange(index, 'TC_Kpi_Volume', numericValue);
  }, [index, onKpiChange]);

  /**
   * Gère la suppression de l'item KPI.
   */
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
        {kpiOptions.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                'KPI', 
                "Indicateur de performance clé",
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

        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              'Coût par', 
              "C'est le coût pour une unité du KPI sélectionné. Par exemple, pour un KPI de type 'CPC', c'est le coût par clic.",
              onTooltipChange
            )}
          </div>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              value={kpi.TC_Kpi_CostPer ?? ''} // MODIFIÉ : Utiliser ?? '' pour afficher vide si undefined
              onChange={handleCostPerChange}
              min="0"
              step="0.01"
              className="block w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              'Volume', 
              "C'est le volume anticipé du KPI sélectionné.",
              onTooltipChange
            )}
          </div>
          <input
            type="number"
            value={kpi.TC_Kpi_Volume ?? ''} // MODIFIÉ : Utiliser ?? '' pour afficher vide si undefined
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

/**
 * Composant principal pour la section des KPIs et objectifs du formulaire de tactique.
 * Il gère l'affichage de l'objectif média et la liste des KPIs.
 * INCHANGÉ : La logique principale reste la même
 */
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
  const kpiOptions = dynamicLists.TC_Kpi || [];
  const isDisabled = loading;
  
  /**
   * Gère l'ajout d'un nouveau KPI, dans la limite de 5.
   */
  const handleAddKpi = useCallback(() => {
    if (kpis.length < 5) {
      onAddKpi();
    }
  }, [kpis.length, onAddKpi]);

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          KPIs et objectifs
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Définition des indicateurs de performance
        </p>
      </div>
      
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
            "Objectif média principal de la tactique",
            onTooltipChange
          )}
        />
      )}

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

        {kpis.length >= 5 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            <p className="text-sm">
              Limite maximale de 5 KPIs atteinte. Supprimez un KPI existant pour en ajouter un nouveau.
            </p>
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">Chargement des données...</p>
        </div>
      )}

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