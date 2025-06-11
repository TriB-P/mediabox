// app/components/Tactiques/Placement/PlacementFormInfo.tsx

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

interface PlacementFormInfoProps {
  // Données du formulaire (sans budget et format)
  formData: {
    PL_Label?: string;
    // 🔥 SUPPRIMÉ : PL_Budget et PL_Format
    PL_Taxonomy_Tags?: string;
    PL_Taxonomy_Platform?: string;
    PL_Taxonomy_MediaOcean?: string;
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

const PlacementFormInfo = memo<PlacementFormInfoProps>(({
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
      
      console.log(`${clientTaxonomies.length} taxonomies chargées pour le placement`);
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
          Informations du placement
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configuration de base et taxonomies pour le placement
        </p>
      </div>
      
      {/* Champs du formulaire */}
      <div className="space-y-6">
        
        {/* PL_Label - Champ obligatoire */}
        <FormInput
          id="PL_Label"
          name="PL_Label"
          value={formData.PL_Label || ''}
          onChange={onChange}
          type="text"
          placeholder="Ex: Bannières Desktop, Vidéo Mobile, Display Tablet"
          required={!isDisabled}
          label={createLabelWithHelp(
            'Nom du placement *', 
            'Nom descriptif du placement. Soyez spécifique pour faciliter l\'identification.', 
            onTooltipChange
          )}
        />

        {/* 🔥 SUPPRIMÉ : Champs PL_Budget et PL_Format */}

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

        {/* Sélecteurs de taxonomies */}
        {taxonomies.length > 0 ? (
          <>
            {/* Taxonomie pour les tags */}
            <SmartSelect
              id="PL_Taxonomy_Tags"
              name="PL_Taxonomy_Tags"
              value={formData.PL_Taxonomy_Tags || ''}
              onChange={onChange}
              options={taxonomyOptions}
              placeholder="Sélectionner une taxonomie..."
              label={createLabelWithHelp(
                'Taxonomie à utiliser pour les tags', 
                'Taxonomie qui sera utilisée pour générer les tags du placement', 
                onTooltipChange
              )}
            />

            {/* Taxonomie pour la plateforme */}
            <SmartSelect
              id="PL_Taxonomy_Platform"
              name="PL_Taxonomy_Platform"
              value={formData.PL_Taxonomy_Platform || ''}
              onChange={onChange}
              options={taxonomyOptions}
              placeholder="Sélectionner une taxonomie..."
              label={createLabelWithHelp(
                'Taxonomie à utiliser pour la plateforme', 
                'Taxonomie qui sera utilisée pour la configuration de la plateforme', 
                onTooltipChange
              )}
            />

            {/* Taxonomie pour MediaOcean */}
            <SmartSelect
              id="PL_Taxonomy_MediaOcean"
              name="PL_Taxonomy_MediaOcean"
              value={formData.PL_Taxonomy_MediaOcean || ''}
              onChange={onChange}
              options={taxonomyOptions}
              placeholder="Sélectionner une taxonomie..."
              label={createLabelWithHelp(
                'Taxonomie à utiliser pour MediaOcean', 
                'Taxonomie qui sera utilisée pour l\'export vers MediaOcean', 
                onTooltipChange
              )}
            />
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

PlacementFormInfo.displayName = 'PlacementFormInfo';

export default PlacementFormInfo;