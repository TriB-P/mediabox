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
          <>
            <TaxonomyFieldRenderer
              manualVariables={manualVariables}
              fieldStates={fieldStates}
              formData={formData}
              highlightState={highlightState}
              onFieldChange={handleFieldChange}
              onFieldHighlight={handleFieldHighlight}
            />
            
            {/* Section des champs créatifs spécifiques */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Champs créatifs utilisés dans les taxonomies
              </h4>
              
              {(() => {
                // Filtrer les champs créatifs qui sont réellement utilisés dans les taxonomies
                const usedCreatifFields = [
                  { name: 'CR_Start_Date', label: 'Date de début créatif', type: 'date', placeholder: '' },
                  { name: 'CR_End_Date', label: 'Date de fin créatif', type: 'date', placeholder: '' },
                  { name: 'CR_Rotation_Weight', label: 'Poids de rotation', type: 'text', placeholder: 'Ex: 50%, 33%, 25%' },
                  { name: 'CR_CTA', label: 'Call-to-Action', type: 'text', placeholder: 'Ex: Achetez maintenant, En savoir plus, Découvrir' },
                  { name: 'CR_Format_Details', label: 'Détails du format', type: 'text', placeholder: 'Ex: 300x250, 728x90, 16:9 Full HD' },
                  { name: 'CR_Offer', label: 'Offre', type: 'text', placeholder: 'Ex: -20%, Livraison gratuite, Offre limitée' },
                  { name: 'CR_Plateform_Name', label: 'Nom de plateforme', type: 'text', placeholder: 'Ex: Facebook, Google Ads, YouTube' },
                  { name: 'CR_Primary_Product', label: 'Produit principal', type: 'text', placeholder: 'Ex: iPhone 15, MacBook Pro, AirPods' },
                  { name: 'CR_URL', label: 'URL du créatif', type: 'url', placeholder: 'https://example.com/landing-page' },
                  { name: 'CR_Version', label: 'Version du créatif', type: 'text', placeholder: 'Ex: v1.0, A, B, Test-1' }
                ].filter(field => {
                  // Vérifier si ce champ est utilisé dans au moins une des variables parsées
                  return parsedVariables.some(variable => variable.variable === field.name);
                });

                if (usedCreatifFields.length === 0) {
                  return (
                    <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
                      <p className="text-sm">
                        Aucun champ créatif n'est utilisé dans les taxonomies sélectionnées.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Ajoutez des variables créatifs (CR_*) dans vos taxonomies pour les configurer ici.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>{usedCreatifFields.length}</strong> champ{usedCreatifFields.length > 1 ? 's' : ''} créatif{usedCreatifFields.length > 1 ? 's' : ''} utilisé{usedCreatifFields.length > 1 ? 's' : ''} dans les taxonomies
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {usedCreatifFields.map((field) => (
                        <div key={field.name} className="p-2 rounded-lg border-2 border-transparent hover:border-gray-300">
                          <label className="block text-sm font-medium text-gray-900 mb-1">
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            name={field.name}
                            value={(formData as any)[field.name] || ''}
                            onChange={onChange}
                            placeholder={field.placeholder}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
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