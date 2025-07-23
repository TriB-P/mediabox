/**
 * @file Ce fichier contient le composant React `CreatifFormInfo`.
 * Ce composant est une partie d'un formulaire plus grand et gère spécifiquement
 * les informations de base d'un "créatif" (comme une publicité).
 * Il permet à l'utilisateur de définir un nom pour le créatif et d'associer
 * des taxonomies (catégories pré-définies) qui sont récupérées depuis Firebase
 * en fonction du client sélectionné.
 */

'use client';

import React, { useState, useEffect, memo } from 'react';
import { 
  FormInput, 
  SmartSelect, 
  createLabelWithHelp 
} from '../Tactiques/TactiqueFormComponents';
import { getClientTaxonomies } from '../../../lib/taxonomyService';
import { Taxonomy } from '../../../types/taxonomy';

interface CreatifFormInfoProps {
  formData: {
    CR_Label?: string;
    CR_Taxonomy_Tags?: string;
    CR_Taxonomy_Platform?: string;
    CR_Taxonomy_MediaOcean?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientId: string;
  loading?: boolean;
}

/**
 * Affiche la section du formulaire dédiée aux informations générales du créatif.
 * Ce composant gère la saisie du nom du créatif et la sélection des taxonomies
 * applicables pour les tags, la plateforme et MediaOcean.
 * Il récupère dynamiquement les taxonomies disponibles pour le client spécifié.
 *
 * @param {CreatifFormInfoProps} props - Les propriétés du composant.
 * @param {object} props.formData - Les données actuelles du formulaire pour ce composant.
 * @param {function} props.onChange - Le gestionnaire pour les changements dans les champs de saisie.
 * @param {function} props.onTooltipChange - Le gestionnaire pour afficher des infobulles d'aide.
 * @param {string} props.clientId - L'ID du client pour lequel charger les taxonomies.
 * @param {boolean} [props.loading=false] - Indique si le formulaire parent est en état de chargement.
 * @returns {React.ReactElement} Le composant de formulaire pour les informations du créatif.
 */
const CreatifFormInfo = memo<CreatifFormInfoProps>(({
  formData,
  onChange,
  onTooltipChange,
  clientId,
  loading = false
}) => {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [taxonomiesLoading, setTaxonomiesLoading] = useState(true);
  const [taxonomiesError, setTaxonomiesError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadTaxonomies();
    }
  }, [clientId]);

  /**
   * Charge les taxonomies associées au client depuis le service de taxonomie.
   * Met à jour l'état du composant avec les taxonomies récupérées, ou une erreur
   * si le chargement échoue.
   *
   * @async
   * @returns {Promise<void>} Une promesse qui se résout une fois les taxonomies chargées et l'état mis à jour.
   */
  const loadTaxonomies = async () => {
    try {
      setTaxonomiesLoading(true);
      setTaxonomiesError(null);
      
      console.log(`FIREBASE: LECTURE - Fichier: CreatifFormInfo.tsx - Fonction: loadTaxonomies - Path: clients/${clientId}/taxonomies`);
      const clientTaxonomies = await getClientTaxonomies(clientId);
      setTaxonomies(clientTaxonomies);
      
    } catch (error) {
      console.error('Erreur lors du chargement des taxonomies:', error);
      setTaxonomiesError('Erreur lors du chargement des taxonomies');
    } finally {
      setTaxonomiesLoading(false);
    }
  };

  const taxonomyOptions = taxonomies.map(taxonomy => ({
    id: taxonomy.id,
    label: taxonomy.NA_Display_Name
  }));

  const isDisabled = loading || taxonomiesLoading;

  return (
    <div className="p-8 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Informations du créatif
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configuration de base et sélection des taxonomies pour le créatif
        </p>
      </div>
      
      <div className="space-y-6">
        
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

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Taxonomies créatifs (niveaux 5-6)
          </h4>

          {taxonomies.length > 0 ? (
            <div className="space-y-4">
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
            <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
              <p className="text-sm">
                Aucune taxonomie configurée pour ce client. 
                Vous pouvez créer des taxonomies dans la section Configuration.
              </p>
            </div>
          ) : null}
        </div>
      </div>

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