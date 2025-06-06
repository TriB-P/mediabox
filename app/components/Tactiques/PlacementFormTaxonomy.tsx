// app/components/Tactiques/PlacementFormTaxonomy.tsx

'use client';

import React from 'react';
import { useTaxonomyForm } from '../../hooks/useTaxonomyForm';
import  TaxonomyFieldRenderer  from './TaxonomyFieldRenderer';
import  TaxonomyPreview from './TaxonomyPreview';
import type { PlacementFormData } from '../../types/tactiques';

// ==================== TYPES ====================

interface PlacementFormTaxonomyProps {
  formData: PlacementFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientId: string;
  campaignData?: any;
  tactiqueData?: any;
  loading?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const PlacementFormTaxonomy: React.FC<PlacementFormTaxonomyProps> = ({
  formData,
  onChange,
  onTooltipChange,
  clientId,
  campaignData,
  tactiqueData,
  loading = false
}) => {
  
  // ==================== LOGIQUE MÉTIER ====================
  
  const {
    // États
    selectedTaxonomyData,
    taxonomiesLoading,
    taxonomiesError,
    parsedVariables,
    fieldStates,
    taxonomyValues,
    highlightState,
    expandedPreviews,
    
    // Actions
    handleFieldChange,
    handleFieldHighlight,
    togglePreviewExpansion,
    retryLoadTaxonomies,
    
    // Données calculées
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

  // ==================== RENDU PRINCIPAL ====================
  
  return (
    <div className="p-8 space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Configuration des taxonomies
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configurez les valeurs des variables pour les taxonomies sélectionnées
        </p>
        
        {/* Statut global de chargement */}
        {taxonomiesLoading && (
          <div className="mt-2 flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Chargement des taxonomies...
          </div>
        )}
      </div>

      {/* Message si aucune taxonomie sélectionnée */}
      {!hasTaxonomies && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            Aucune taxonomie sélectionnée. Rendez-vous dans l'onglet "Informations" pour sélectionner les taxonomies à utiliser.
          </p>
        </div>
      )}

      {/* Messages d'erreur */}
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

      {/* Interface principale */}
      {hasTaxonomies && !taxonomiesLoading && Object.keys(selectedTaxonomyData).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne de gauche : Configuration des variables */}
          <div>
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
          </div>
          
          {/* Colonne de droite : Aperçu */}
          <div className="lg:sticky lg:top-8 lg:self-start">
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
      )}

      {/* Indicateur de chargement global */}
      {(loading || taxonomiesLoading) && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            <p className="text-sm">
              {taxonomiesLoading ? 'Chargement des taxonomies...' : 'Chargement des données...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementFormTaxonomy;