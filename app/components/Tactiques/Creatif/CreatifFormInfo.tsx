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
  // Données simplifiées du formulaire créatif
  formData: {
    CR_Label?: string;
    CR_Taxonomy_Tags?: string;
    CR_Taxonomy_Platform?: string;
    CR_Taxonomy_MediaOcean?: string;
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
          Configuration de base et sélection des taxonomies pour le créatif
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
          placeholder="Ex: Bannière 300x250 v1, Vidéo 15s A/B test, Native Ad mobile"
          required={!isDisabled}
          label={createLabelWithHelp(
            'Nom du créatif *', 
            'Nom descriptif du créatif. Soyez spécifique pour faciliter l\'identification lors des rapports.', 
            onTooltipChange
          )}
        />

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

        {/* Section taxonomies créatifs */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Taxonomies créatifs (niveaux 5-6)
          </h4>


          {/* Sélecteurs de taxonomies */}
          {taxonomies.length > 0 ? (
            <div className="space-y-4">
              {/* Taxonomie pour les tags */}
              <SmartSelect
                id="CR_Taxonomy_Tags"
                name="CR_Taxonomy_Tags"
                value={formData.CR_Taxonomy_Tags || ''}
                onChange={onChange}
                options={taxonomyOptions}
                placeholder="Sélectionner une taxonomie..."
                label={createLabelWithHelp(
                  'Taxonomie pour les tags créatifs', 
                  'Taxonomie qui sera utilisée pour générer les tags du créatif (niveaux 5-6)', 
                  onTooltipChange
                )}
              />

              {/* Taxonomie pour la plateforme */}
              <SmartSelect
                id="CR_Taxonomy_Platform"
                name="CR_Taxonomy_Platform"
                value={formData.CR_Taxonomy_Platform || ''}
                onChange={onChange}
                options={taxonomyOptions}
                placeholder="Sélectionner une taxonomie..."
                label={createLabelWithHelp(
                  'Taxonomie pour la plateforme créatifs', 
                  'Taxonomie qui sera utilisée pour la configuration de la plateforme (niveaux 5-6)', 
                  onTooltipChange
                )}
              />

              {/* Taxonomie pour MediaOcean */}
              <SmartSelect
                id="CR_Taxonomy_MediaOcean"
                name="CR_Taxonomy_MediaOcean"
                value={formData.CR_Taxonomy_MediaOcean || ''}
                onChange={onChange}
                options={taxonomyOptions}
                placeholder="Sélectionner une taxonomie..."
                label={createLabelWithHelp(
                  'Taxonomie pour MediaOcean créatifs', 
                  'Taxonomie qui sera utilisée pour l\'export vers MediaOcean (niveaux 5-6)', 
                  onTooltipChange
                )}
              />
            </div>
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