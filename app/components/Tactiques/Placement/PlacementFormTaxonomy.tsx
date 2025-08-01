// app/components/Tactiques/Placement/PlacementFormTaxonomy.tsx - Simplifié

'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import TaxonomyFieldRenderer from './TaxonomyFieldRenderer';
import TaxonomyPreview from './TaxonomyPreview';
import { useTaxonomyForm } from '../../../hooks/useTaxonomyForm';
import { PlacementFormData, Tactique } from '../../../types/tactiques';
import { Campaign } from '../../../types/campaign';
import { getClientInfo } from '../../../lib/listService'; // 🔥 AJOUTÉ: Pour charger config client

interface PlacementFormTaxonomyProps {
  formData: PlacementFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientId: string;
  campaignData?: Campaign;
  tactiqueData?: Tactique;
  loading?: boolean;
}

// 🔥 AJOUTÉ: Interface pour la configuration client (juste pour labels et filtrage)
interface ClientConfig {
  Custom_Dim_PL_1?: string;
  Custom_Dim_PL_2?: string;
  Custom_Dim_PL_3?: string;
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
  
  // 🔥 AJOUTÉ: État pour la config client (juste pour labels et filtrage)
  const [clientConfig, setClientConfig] = useState<ClientConfig>({});

  // 🔥 AJOUTÉ: Charger uniquement la config client (pas les listes)
  const loadClientConfig = useCallback(async () => {
    if (!clientId) return;
    try {
      console.log(`FIREBASE: LECTURE - Fichier: PlacementFormTaxonomy.tsx - Fonction: loadClientConfig - Path: clients/${clientId}`);
      const clientInfo = await getClientInfo(clientId);
      setClientConfig({
        Custom_Dim_PL_1: clientInfo.Custom_Dim_PL_1 || undefined,
        Custom_Dim_PL_2: clientInfo.Custom_Dim_PL_2 || undefined,
        Custom_Dim_PL_3: clientInfo.Custom_Dim_PL_3 || undefined,
      });
    } catch (error) {
      console.error('❌ Erreur chargement config client:', error);
    }
  }, [clientId]);

  useEffect(() => {
    loadClientConfig();
  }, [loadClientConfig]);
  
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

  // 🔥 AJOUTÉ: Filtrer manualVariables pour masquer dimensions non configurées
  const filteredManualVariables = manualVariables.filter(variable => {
    const fieldKey = variable.variable;
    
    // Si c'est une custom dimension, vérifier si elle est configurée
    if (fieldKey === 'PL_Custom_Dim_1') return !!clientConfig.Custom_Dim_PL_1;
    if (fieldKey === 'PL_Custom_Dim_2') return !!clientConfig.Custom_Dim_PL_2;
    if (fieldKey === 'PL_Custom_Dim_3') return !!clientConfig.Custom_Dim_PL_3;
    
    // Pour tous les autres champs, les garder
    return true;
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
            manualVariables={filteredManualVariables} // 🔥 MODIFIÉ: Utiliser variables filtrées
            fieldStates={fieldStates}
            formData={formData}
            highlightState={highlightState}
            clientConfig={clientConfig} // 🔥 AJOUTÉ: Pour les labels personnalisés
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
          levelsToShow={[1, 2, 3, 4]}
        />
      </div>
    </div>
  );
});

PlacementFormTaxonomy.displayName = 'PlacementFormTaxonomy';

export default PlacementFormTaxonomy;