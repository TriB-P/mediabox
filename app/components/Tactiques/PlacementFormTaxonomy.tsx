// app/components/Tactiques/PlacementFormTaxonomy.tsx

'use client';

import React, { memo, useState, useEffect } from 'react';
import TaxonomyFieldRenderer from './TaxonomyFieldRenderer';
import TaxonomyPreview from './TaxonomyPreview';
import { useTaxonomyForm } from '../../hooks/useTaxonomyForm';
import { PlacementFormData, Tactique } from '../../types/tactiques';
import { Campaign } from '../../types/campaign';

// ==================== TYPES ====================

interface PlacementFormTaxonomyProps {
  // Données du formulaire
  formData: PlacementFormData;
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  
  // Contexte client
  clientId: string;
  
  // NOUVEAU: Données héritées
  campaignData?: Campaign;
  tactiqueData?: Tactique;
  
  // État de chargement
  loading?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const PlacementFormTaxonomy = memo<PlacementFormTaxonomyProps>(({
  formData,
  onChange,
  onTooltipChange,
  clientId,
  campaignData,
  tactiqueData,
  loading = false
}) => {
  
  // Utiliser le hook avec les données héritées
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
    hasLoadingFields
  } = useTaxonomyForm({
    formData,
    onChange,
    clientId,
    campaignData,
    tactiqueData
  });

  console.log('🏗️ PlacementFormTaxonomy rendu avec:', {
    campaignData: campaignData?.name,
    tactiqueData: tactiqueData?.TC_Label,
    hasTaxonomies,
    parsedVariables: parsedVariables.length,
    manualVariables: manualVariables.length
  });

  return (
    <div className="flex h-full">
      {/* Colonne de gauche : Configuration des variables */}
      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Configuration des variables
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configurez les valeurs des variables identifiées dans les taxonomies
          </p>
          
          {/* Debug des données héritées */}
          {(campaignData || tactiqueData) && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Données héritées détectées :</h4>
              <div className="text-xs text-blue-800 space-y-1">
                {campaignData && (
                  <div>📊 <span className="font-medium">Campagne :</span> {campaignData.name}</div>
                )}
                {tactiqueData && (
                  <div>🎯 <span className="font-medium">Tactique :</span> {tactiqueData.TC_Label}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Message d'erreur */}
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

        {/* Configuration des variables */}
        {hasTaxonomies ? (
          <TaxonomyFieldRenderer
            manualVariables={manualVariables}
            fieldStates={fieldStates}
            taxonomyValues={taxonomyValues}
            highlightState={highlightState}
            campaignData={campaignData}
            tactiqueData={tactiqueData}
            onFieldChange={handleFieldChange}
            onFieldHighlight={handleFieldHighlight}
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
            <p className="text-sm">
              Veuillez d'abord sélectionner des taxonomies dans l'onglet "Informations" pour configurer les variables.
            </p>
          </div>
        )}

        {/* Message d'information si en chargement */}
        {(loading || taxonomiesLoading) && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <p className="text-sm">
              {loading ? 'Chargement des données...' : 'Chargement du parsing des taxonomies...'}
            </p>
          </div>
        )}
      </div>

      {/* Colonne de droite : Aperçu */}
      <div className="w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
        <TaxonomyPreview
          parsedVariables={parsedVariables}
          selectedTaxonomyData={selectedTaxonomyData}
          taxonomyValues={taxonomyValues}
          fieldStates={fieldStates}
          expandedPreviews={expandedPreviews}
          campaignData={campaignData}
          tactiqueData={tactiqueData}
          hasLoadingFields={hasLoadingFields}
          onToggleExpansion={togglePreviewExpansion}
        />
      </div>
    </div>
  );
});

PlacementFormTaxonomy.displayName = 'PlacementFormTaxonomy';

export default PlacementFormTaxonomy;