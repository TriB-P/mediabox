// app/components/Tactiques/Creatif/CreatifFormInfo.tsx

'use client';

import React, { useState, useEffect, memo } from 'react';
import { 
  FormInput, 
  SmartSelect, 
  createLabelWithHelp 
} from '../Tactiques/TactiqueFormComponents';
import { getClientTaxonomies } from '../../../lib/taxonomyService';
import { Taxonomy } from '../../../types/taxonomy';

// ==================== TYPES ====================

interface CreatifFormInfoProps {
  // Données du formulaire créatif
  formData: {
    CR_Label?: string;
    CR_Taxonomy_Tags?: string;
    CR_Taxonomy_Platform?: string;
    CR_Taxonomy_MediaOcean?: string;
    // 10 champs spécifiques aux créatifs
    CR_Start_Date?: string;
    CR_End_Date?: string;
    CR_Rotation_Weight?: string;
    CR_CTA?: string;
    CR_Format_Details?: string;
    CR_Offer?: string;
    CR_Plateform_Name?: string;
    CR_Primary_Product?: string;
    CR_URL?: string;
    CR_Version?: string;
  };
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  
  // Contexte client
  clientId: string;
  
  // État de chargement
  loading?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const CreatifFormInfo = memo<CreatifFormInfoProps>(({
  formData,
  onChange,
  onTooltipChange,
  clientId,
  loading = false
}) => {
  // État pour les taxonomies
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [taxonomiesLoading, setTaxonomiesLoading] = useState(true);
  const [taxonomiesError, setTaxonomiesError] = useState<string | null>(null);

  // Charger les taxonomies quand le clientId change
  useEffect(() => {
    if (clientId) {
      loadTaxonomies();
    }
  }, [clientId]);

  const loadTaxonomies = async () => {
    try {
      setTaxonomiesLoading(true);
      setTaxonomiesError(null);
      
      const clientTaxonomies = await getClientTaxonomies(clientId);
      setTaxonomies(clientTaxonomies);
      
      console.log(`${clientTaxonomies.length} taxonomies chargées pour le créatif`);
    } catch (error) {
      console.error('Erreur lors du chargement des taxonomies:', error);
      setTaxonomiesError('Erreur lors du chargement des taxonomies');
    } finally {
      setTaxonomiesLoading(false);
    }
  };

  // Préparer les options pour les sélecteurs de taxonomie
  const taxonomyOptions = taxonomies.map(taxonomy => ({
    id: taxonomy.id,
    label: taxonomy.NA_Display_Name
  }));

  // Désactiver les champs si en cours de chargement
  const isDisabled = loading || taxonomiesLoading;

  return (
    <div className="p-8 space-y-6">
      {/* En-tête de section */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Informations du créatif
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configuration de base et taxonomies pour le créatif
        </p>
      </div>
      
      {/* Champs du formulaire */}
      <div className="space-y-6">
        
        {/* CR_Label - Champ obligatoire */}
        <FormInput
          id="CR_Label"
          name="CR_Label"
          value={formData.CR_Label || ''}
          onChange={onChange}
          type="text"
          placeholder="Ex: Bannière 300x250, Vidéo 15s, Native Ad"
          required={!isDisabled}
          label={createLabelWithHelp(
            'Nom du créatif *', 
            'Nom descriptif du créatif. Soyez spécifique pour faciliter l\'identification.', 
            onTooltipChange
          )}
        />

        {/* Section des champs créatifs spécifiques */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Informations créatives
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CR_Start_Date */}
            <FormInput
              id="CR_Start_Date"
              name="CR_Start_Date"
              value={formData.CR_Start_Date || ''}
              onChange={onChange}
              type="date"
              label={createLabelWithHelp(
                'Date de début créatif', 
                'Date de début de diffusion de ce créatif spécifique', 
                onTooltipChange
              )}
            />

            {/* CR_End_Date */}
            <FormInput
              id="CR_End_Date"
              name="CR_End_Date"
              value={formData.CR_End_Date || ''}
              onChange={onChange}
              type="date"
              label={createLabelWithHelp(
                'Date de fin créatif', 
                'Date de fin de diffusion de ce créatif spécifique', 
                onTooltipChange
              )}
            />

            {/* CR_Rotation_Weight */}
            <FormInput
              id="CR_Rotation_Weight"
              name="CR_Rotation_Weight"
              value={formData.CR_Rotation_Weight || ''}
              onChange={onChange}
              type="text"
              placeholder="Ex: 50%, 33%, 25%"
              label={createLabelWithHelp(
                'Poids de rotation', 
                'Pourcentage de répartition de ce créatif dans la rotation (ex: 50%)', 
                onTooltipChange
              )}
            />

            {/* CR_CTA */}
            <FormInput
              id="CR_CTA"
              name="CR_CTA"
              value={formData.CR_CTA || ''}
              onChange={onChange}
              type="text"
              placeholder="Ex: Achetez maintenant, En savoir plus, Découvrir"
              label={createLabelWithHelp(
                'Call-to-Action', 
                'Texte d\'appel à l\'action principal du créatif', 
                onTooltipChange
              )}
            />

            {/* CR_Format_Details */}
            <FormInput
              id="CR_Format_Details"
              name="CR_Format_Details"
              value={formData.CR_Format_Details || ''}
              onChange={onChange}
              type="text"
              placeholder="Ex: 300x250, 728x90, 16:9 Full HD"
              label={createLabelWithHelp(
                'Détails du format', 
                'Spécifications techniques du format (taille, ratio, résolution)', 
                onTooltipChange
              )}
            />

            {/* CR_Offer */}
            <FormInput
              id="CR_Offer"
              name="CR_Offer"
              value={formData.CR_Offer || ''}
              onChange={onChange}
              type="text"
              placeholder="Ex: -20%, Livraison gratuite, Offre limitée"
              label={createLabelWithHelp(
                'Offre', 
                'Offre promotionnelle ou message principal du créatif', 
                onTooltipChange
              )}
            />

            {/* CR_Plateform_Name */}
            <FormInput
              id="CR_Plateform_Name"
              name="CR_Plateform_Name"
              value={formData.CR_Plateform_Name || ''}
              onChange={onChange}
              type="text"
              placeholder="Ex: Facebook, Google Ads, YouTube"
              label={createLabelWithHelp(
                'Nom de plateforme', 
                'Plateforme spécifique où ce créatif sera diffusé', 
                onTooltipChange
              )}
            />

            {/* CR_Primary_Product */}
            <FormInput
              id="CR_Primary_Product"
              name="CR_Primary_Product"
              value={formData.CR_Primary_Product || ''}
              onChange={onChange}
              type="text"
              placeholder="Ex: iPhone 15, MacBook Pro, AirPods"
              label={createLabelWithHelp(
                'Produit principal', 
                'Produit ou service mis en avant dans ce créatif', 
                onTooltipChange
              )}
            />

            {/* CR_URL */}
            <FormInput
              id="CR_URL"
              name="CR_URL"
              value={formData.CR_URL || ''}
              onChange={onChange}
              type="url"
              placeholder="https://example.com/landing-page"
              label={createLabelWithHelp(
                'URL du créatif', 
                'URL de destination ou lien vers les assets créatifs', 
                onTooltipChange
              )}
            />

            {/* CR_Version */}
            <FormInput
              id="CR_Version"
              name="CR_Version"
              value={formData.CR_Version || ''}
              onChange={onChange}
              type="text"
              placeholder="Ex: v1.0, A, B, Test-1"
              label={createLabelWithHelp(
                'Version du créatif', 
                'Version ou variante de ce créatif (pour A/B testing)', 
                onTooltipChange
              )}
            />
          </div>
        </div>

        {/* Message d'erreur pour les taxonomies */}
        {taxonomiesError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {taxonomiesError}
            <button 
              onClick={loadTaxonomies}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Section taxonomies */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Taxonomies créatifs (niveaux 5-6)
          </h4>

          {/* Sélecteurs de taxonomies */}
          {taxonomies.length > 0 ? (
            <>
              {/* Taxonomie pour les tags */}
              <div className="mb-4">
                <SmartSelect
                  id="CR_Taxonomy_Tags"
                  name="CR_Taxonomy_Tags"
                  value={formData.CR_Taxonomy_Tags || ''}
                  onChange={onChange}
                  options={taxonomyOptions}
                  placeholder="Sélectionner une taxonomie..."
                  label={createLabelWithHelp(
                    'Taxonomie à utiliser pour les tags créatifs', 
                    'Taxonomie qui sera utilisée pour générer les tags du créatif (niveaux 5-6)', 
                    onTooltipChange
                  )}
                />
              </div>

              {/* Taxonomie pour la plateforme */}
              <div className="mb-4">
                <SmartSelect
                  id="CR_Taxonomy_Platform"
                  name="CR_Taxonomy_Platform"
                  value={formData.CR_Taxonomy_Platform || ''}
                  onChange={onChange}
                  options={taxonomyOptions}
                  placeholder="Sélectionner une taxonomie..."
                  label={createLabelWithHelp(
                    'Taxonomie à utiliser pour la plateforme créatifs', 
                    'Taxonomie qui sera utilisée pour la configuration de la plateforme (niveaux 5-6)', 
                    onTooltipChange
                  )}
                />
              </div>

              {/* Taxonomie pour MediaOcean */}
              <div className="mb-4">
                <SmartSelect
                  id="CR_Taxonomy_MediaOcean"
                  name="CR_Taxonomy_MediaOcean"
                  value={formData.CR_Taxonomy_MediaOcean || ''}
                  onChange={onChange}
                  options={taxonomyOptions}
                  placeholder="Sélectionner une taxonomie..."
                  label={createLabelWithHelp(
                    'Taxonomie à utiliser pour MediaOcean créatifs', 
                    'Taxonomie qui sera utilisée pour l\'export vers MediaOcean (niveaux 5-6)', 
                    onTooltipChange
                  )}
                />
              </div>
            </>
          ) : !taxonomiesLoading && !taxonomiesError ? (
            /* Message si aucune taxonomie */
            <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
              <p className="text-sm">
                Aucune taxonomie configurée pour ce client. 
                Vous pouvez créer des taxonomies dans la section Configuration.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Message d'information si en chargement */}
      {(loading || taxonomiesLoading) && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            {loading ? 'Chargement des données...' : 'Chargement des taxonomies...'}
          </p>
        </div>
      )}
    </div>
  );
});

CreatifFormInfo.displayName = 'CreatifFormInfo';

export default CreatifFormInfo;