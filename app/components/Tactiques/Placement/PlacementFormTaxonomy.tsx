// app/components/Tactiques/Placement/PlacementFormTaxonomy.tsx - VERSION AVEC HIGHLIGHT

'use client';

import React, { memo } from 'react';
import TaxonomyFieldRenderer from './TaxonomyFieldRenderer';
import TaxonomyPreview from './TaxonomyPreview';
import { useTaxonomyForm } from '../../../hooks/useTaxonomyForm';
import { PlacementFormData, Tactique } from '../../../types/tactiques';
import { Campaign } from '../../../types/campaign';

// ==================== TYPES ====================

interface PlacementFormTaxonomyProps {
  // Données du formulaire
  formData: PlacementFormData;
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  
  // Contexte client
  clientId: string;
  
  // Données héritées
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
  
  // Utiliser le hook corrigé avec toutes les nouvelles fonctionnalités
  const {
    selectedTaxonomyData,
    taxonomiesLoading,
    taxonomiesError,
    parsedVariables,
    fieldStates,
    taxonomyValues,
    highlightState, // 🔥 RÉCUPÉRATION : État de highlight
    expandedPreviews,
    handleFieldChange,
    handleFieldHighlight,
    togglePreviewExpansion,
    retryLoadTaxonomies,
    hasTaxonomies,
    manualVariables,
    hasLoadingFields,
    getFormattedValue, // FONCTION SYNCHRONE
    getFormattedPreview // FONCTION SYNCHRONE
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
    manualVariables: manualVariables.length,
    taxonomiesLoading,
    hasLoadingFields,
    highlightState: highlightState.activeVariable // 🔥 AJOUT : Log du highlight
  });

  return (
    <div className="flex h-full">
      {/* Colonne de gauche : Configuration des variables */}
      <div className="w-[50%] p-8 space-y-6 overflow-y-auto">
        
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
            getFormattedValue={getFormattedValue}
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
      <div className="w-[50%] bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
        <TaxonomyPreview
          parsedVariables={parsedVariables}
          selectedTaxonomyData={selectedTaxonomyData}
          taxonomyValues={taxonomyValues}
          fieldStates={fieldStates}
          expandedPreviews={expandedPreviews}
          campaignData={campaignData}
          tactiqueData={tactiqueData}
          hasLoadingFields={hasLoadingFields}
          highlightState={highlightState} // 🔥 NOUVEAU : Transmission du highlightState
          onToggleExpansion={togglePreviewExpansion}
          getFormattedValue={getFormattedValue} // NOUVEAU : Fonction synchrone
          getFormattedPreview={getFormattedPreview} // NOUVEAU : Fonction synchrone
        />
      </div>
    </div>
  );
});

PlacementFormTaxonomy.displayName = 'PlacementFormTaxonomy';

export default PlacementFormTaxonomy;