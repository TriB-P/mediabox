/**
 * Ce fichier définit le composant `PlacementFormTaxonomy`.
 * Il gère l'onglet "Taxonomie" du formulaire de création ou d'édition d'un placement.
 * Il se divise en deux parties : à gauche, les champs de saisie pour les variables de taxonomie,
 * et à droite, un aperçu en temps réel des noms générés.
 * La logique complexe de gestion des taxonomies est déléguée au hook `useTaxonomyForm`.
 */
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

/**
 * Composant principal pour la section taxonomie du formulaire de placement.
 * Il affiche les champs de configuration des variables de taxonomie et un aperçu en temps réel.
 * La logique est gérée par le hook `useTaxonomyForm`.
 * @param {PlacementFormTaxonomyProps} props - Les propriétés du composant.
 * @param {PlacementFormData} props.formData - Les données actuelles du formulaire de placement.
 * @param {(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void} props.onChange - Fonction de rappel pour gérer les changements dans le formulaire.
 * @param {(tooltip: string | null) => void} props.onTooltipChange - Fonction de rappel pour gérer l'affichage des infobulles.
 * @param {string} props.clientId - L'identifiant du client.
 * @param {Campaign} [props.campaignData] - Les données optionnelles de la campagne parente.
 * @param {Tactique} [props.tactiqueData] - Les données optionnelles de la tactique parente.
 * @param {boolean} [props.loading=false] - Indicateur de chargement global.
 * @returns {React.ReactElement} Le composant JSX pour la section taxonomie.
 */
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
    tactiqueData,
    formType: 'placement'
  });

  return (
    <div className="flex h-full">
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
          levelsToShow={[1, 2, 3, 4]}
        />
      </div>
    </div>
  );
});

PlacementFormTaxonomy.displayName = 'PlacementFormTaxonomy';

export default PlacementFormTaxonomy;