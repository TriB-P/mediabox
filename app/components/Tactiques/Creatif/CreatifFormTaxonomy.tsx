// app/components/Tactiques/Creatif/CreatifFormTaxonomy.tsx - PROPRIÉTÉS CORRIGÉES

/**
 * @file Ce fichier définit le composant CreatifFormTaxonomy, qui est une section de formulaire dédiée à la configuration de la taxonomie pour un "Créatif".
 * Il utilise une disposition à deux colonnes : une pour la saisie des variables taxonomiques et l'autre pour prévisualiser le résultat.
 * La logique principale de gestion du formulaire est encapsulée dans le hook `useTaxonomyForm`.
 * CORRIGÉ: Adaptation aux nouvelles propriétés retournées par useTaxonomyForm
 */

'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import TaxonomyFieldRenderer from '../Placement/TaxonomyFieldRenderer';
import TaxonomyPreview from '../Placement/TaxonomyPreview';
import { useTaxonomyForm } from '../../../hooks/useTaxonomyForm';
import { CreatifFormData, Tactique, Placement } from '../../../types/tactiques';
import { Campaign } from '../../../types/campaign';
import { getClientInfo } from '../../../lib/listService';

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

// Interface pour la configuration client (labels et filtrage)
interface ClientConfig {
  Custom_Dim_CR_1?: string;
  Custom_Dim_CR_2?: string;
  Custom_Dim_CR_3?: string;
}

/**
 * Affiche l'interface de configuration de la taxonomie pour un créatif.
 * Ce composant gère l'affichage des champs de saisie basés sur les taxonomies sélectionnées
 * et fournit un aperçu en temps réel. Il se concentre spécifiquement sur les niveaux 5 et 6 de la taxonomie.
 */
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
  
  const { t } = useTranslation();
  // État pour la config client (labels et filtrage)
  const [clientConfig, setClientConfig] = useState<ClientConfig>({});

  // Charger uniquement la config client (pas les listes)
  const loadClientConfig = useCallback(async () => {
    if (!clientId) return;
    try {
      console.log(`FIREBASE: LECTURE - Fichier: CreatifFormTaxonomy.tsx - Fonction: loadClientConfig - Path: clients/${clientId}`);
      const clientInfo = await getClientInfo(clientId);
      setClientConfig({
        Custom_Dim_CR_1: clientInfo.Custom_Dim_CR_1 || undefined,
        Custom_Dim_CR_2: clientInfo.Custom_Dim_CR_2 || undefined,
        Custom_Dim_CR_3: clientInfo.Custom_Dim_CR_3 || undefined,
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

  // Filtrer manualVariables pour masquer dimensions non configurées
  const filteredManualVariables = manualVariables.filter(variable => {
    const fieldKey = variable.variable;
    
    // Si c'est une custom dimension créatif, vérifier si elle est configurée
    if (fieldKey === 'CR_Custom_Dim_1') return !!clientConfig.Custom_Dim_CR_1;
    if (fieldKey === 'CR_Custom_Dim_2') return !!clientConfig.Custom_Dim_CR_2;
    if (fieldKey === 'CR_Custom_Dim_3') return !!clientConfig.Custom_Dim_CR_3;
    
    // Pour tous les autres champs, les garder
    return true;
  });

  return (
    <div className="flex h-full">
      <div className="w-[50%] p-8 space-y-6 overflow-y-auto">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('creatifFormTaxonomy.title')}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {t('creatifFormTaxonomy.subtitle')}
          </p>
        </div>
        
        {taxonomiesError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {taxonomiesError}
            <button 
              onClick={retryLoadTaxonomies}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              {t('creatifFormTaxonomy.retry')}
            </button>
          </div>
        )}

        {hasTaxonomies ? (
          <TaxonomyFieldRenderer
            manualVariables={filteredManualVariables}
            fieldStates={fieldStates}
            formData={formData}
            highlightState={highlightState}
            clientConfig={clientConfig}
            onFieldChange={handleFieldChange}
            onFieldHighlight={handleFieldHighlight}
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-2">
              {t('creatifFormTaxonomy.noTaxonomy.title')}
            </h4>
            <p className="text-sm">
              {t('creatifFormTaxonomy.noTaxonomy.description')}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {t('creatifFormTaxonomy.noTaxonomy.tip')}
            </p>
          </div>
        )}

        {(loading || taxonomiesLoading) && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <p className="text-sm">
              {loading ? t('creatifFormTaxonomy.loading.data') : t('creatifFormTaxonomy.loading.taxonomies')}
            </p>
          </div>
        )}
      </div>

      <div className="w-[50%] bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-900">{t('creatifFormTaxonomy.preview.title')}</h4>
          <p className="text-sm text-gray-600 mt-1">
            {t('creatifFormTaxonomy.preview.subtitle')}
          </p>
        </div>
        <TaxonomyPreview
          parsedVariables={parsedVariables}
          selectedTaxonomyData={selectedTaxonomyData}
          expandedPreviews={expandedPreviews}
          hasLoadingFields={hasLoadingFields}
          highlightState={highlightState}
          onToggleExpansion={togglePreviewExpansion}
          getFormattedValue={getFormattedValue}
          getFormattedPreview={getFormattedPreview}
          levelsToShow={[5, 6]}
        />
      </div>
    </div>
  );
});

CreatifFormTaxonomy.displayName = 'CreatifFormTaxonomy';

export default CreatifFormTaxonomy;