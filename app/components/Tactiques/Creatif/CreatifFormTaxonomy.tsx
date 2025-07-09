// app/components/Tactiques/Creatif/CreatifFormTaxonomy.tsx

'use client';

import React, { memo } from 'react';
import TaxonomyFieldRenderer from '../Placement/TaxonomyFieldRenderer';
import TaxonomyPreview from '../Placement/TaxonomyPreview';
import { useTaxonomyForm } from '../../../hooks/useTaxonomyForm';
import { CreatifFormData, Tactique, Placement } from '../../../types/tactiques';
import { Campaign } from '../../../types/campaign';

interface CreatifFormTaxonomyProps {
  formData: CreatifFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientId: string;
  campaignData?: Campaign;
  tactiqueData?: Tactique;
  placementData?: Placement;
  loading?: boolean;
}

const CreatifFormTaxonomy: React.FC<CreatifFormTaxonomyProps> = memo(({
  formData,
  onChange,
  onTooltipChange,
  clientId,
  campaignData,
  tactiqueData,
  placementData,
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
    tactiqueData,
    placementData,
    formType: 'creatif'
  });

  return (
    <div className="flex h-full">
      {/* Colonne de gauche : Configuration des variables et champs créatifs */}
      <div className="w-[50%] p-8 space-y-6 overflow-y-auto">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Configuration du créatif
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Variables taxonomiques et informations spécifiques au créatif
          </p>
        </div>
        
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
              Configuration des taxonomies créatifs
            </h4>
            <p className="text-sm">
              Veuillez d'abord sélectionner des taxonomies dans l'onglet "Informations" pour configurer les variables créatifs.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              💡 Les créatifs utilisent les niveaux 5-6 des taxonomies.
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

      {/* Colonne de droite : Aperçu taxonomie créatifs (niveaux 5-6) */}
      <div className="w-[50%] bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-900">Aperçu des taxonomies créatifs</h4>
          <p className="text-sm text-gray-600 mt-1">
            Prévisualisation des niveaux 5-6 des taxonomies sélectionnées
          </p>
        </div>
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
          levelsToShow={[5, 6]} // 🔥 NOUVEAU : Ne montrer que les niveaux 5-6 pour les créatifs
        />
      </div>
    </div>
  );
});

CreatifFormTaxonomy.displayName = 'CreatifFormTaxonomy';

export default CreatifFormTaxonomy;