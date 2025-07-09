// app/components/Tactiques/Placement/PlacementFormTaxonomy.tsx

'use client';

import React, { memo } from 'react';
import TaxonomyFieldRenderer from './TaxonomyFieldRenderer';
import TaxonomyPreview from './TaxonomyPreview';
import { useTaxonomyForm } from '../../../hooks/useTaxonomyForm';
import { PlacementFormData, Tactique } from '../../../types/tactiques';
import { Campaign } from '../../../types/campaign';

interface PlacementFormTaxonomyProps {
  formData: PlacementFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientId: string;
  campaignData?: Campaign;
  tactiqueData?: Tactique;
  loading?: boolean;
}

const PlacementFormTaxonomy = memo<PlacementFormTaxonomyProps>(({
  formData,
  onChange,
  onTooltipChange,
  clientId,
  campaignData,
  tactiqueData,
  loading = false
}) => {
  
  const {
    selectedTaxonomyData,
    taxonomiesLoading,
    taxonomiesError,
    parsedVariables,
    fieldStates,
    taxonomyValues,
    highlightState,
    expandedPreviews,
    handleFieldChange,
    handleFieldHighlight,
    togglePreviewExpansion,
    retryLoadTaxonomies,
    hasTaxonomies,
    manualVariables,
    hasLoadingFields,
    getFormattedValue,
    getFormattedPreview
  } = useTaxonomyForm({
    formData,
    onChange,
    clientId,
    campaignData,
    tactiqueData
  });

  return (
    <div className="flex h-full">
      {/* Colonne de gauche : Configuration des variables */}
      <div className="w-[50%] p-8 space-y-6 overflow-y-auto">
        
        {taxonomiesError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {taxonomiesError}
            <button 
              onClick={retryLoadTaxonomies}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {hasTaxonomies ? (
          <TaxonomyFieldRenderer
            manualVariables={manualVariables}
            fieldStates={fieldStates}
            formData={formData}
            highlightState={highlightState}
            onFieldChange={handleFieldChange}
            onFieldHighlight={handleFieldHighlight}
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-2">
              Configuration des taxonomies
            </h4>
            <p className="text-sm">
              Veuillez d'abord sélectionner des taxonomies dans l'onglet "Informations" pour configurer les variables.
            </p>
          </div>
        )}

        {(loading || taxonomiesLoading) && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <p className="text-sm">
              {loading ? 'Chargement des données...' : 'Analyse des taxonomies...'}
            </p>
          </div>
        )}
      </div>

      {/* Colonne de droite : Aperçu */}
      <div className="w-[50%] bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
        <TaxonomyPreview
          parsedVariables={parsedVariables}
          selectedTaxonomyData={selectedTaxonomyData}
          taxonomyValues={taxonomyValues}
          expandedPreviews={expandedPreviews}
          hasLoadingFields={hasLoadingFields}
          highlightState={highlightState}
          onToggleExpansion={togglePreviewExpansion}
          getFormattedValue={getFormattedValue}
          getFormattedPreview={getFormattedPreview}
          levelsToShow={[1, 2, 3, 4]} // 🔥 NOUVEAU : Niveaux 1-4 pour les placements
        />
      </div>
    </div>
  );
});

PlacementFormTaxonomy.displayName = 'PlacementFormTaxonomy';

export default PlacementFormTaxonomy;