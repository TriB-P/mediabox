/**
 * Ce fichier définit le composant PlacementFormInfo, une section de formulaire utilisée
 * pour la création ou la modification des informations de base d'un "Placement".
 * Il gère la saisie du nom du placement et la sélection des taxonomies associées
 * en récupérant les taxonomies spécifiques au client depuis la base de données.
 */
'use client';

import React, { useState, useEffect, memo } from 'react';
import {
  FormInput,
  SmartSelect,
  createLabelWithHelp,
} from '../Tactiques/TactiqueFormComponents';
import { getClientTaxonomies } from '../../../lib/taxonomyService';
import { Taxonomy } from '../../../types/taxonomy';

interface PlacementFormInfoProps {
  formData: {
    PL_Label?: string;
    PL_Taxonomy_Tags?: string;
    PL_Taxonomy_Platform?: string;
    PL_Taxonomy_MediaOcean?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientId: string;
  loading?: boolean;
}

/**
 * Composant de formulaire pour les informations générales d'un placement.
 * Affiche les champs pour le nom du placement et les sélecteurs de taxonomies.
 * Les taxonomies sont chargées dynamiquement en fonction de l'ID du client.
 * @param {PlacementFormInfoProps} props - Les propriétés du composant.
 * @param {object} props.formData - Les données actuelles du formulaire.
 * @param {(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void} props.onChange - Le gestionnaire pour les changements dans les champs du formulaire.
 * @param {(tooltip: string | null) => void} props.onTooltipChange - Le gestionnaire pour afficher les infobulles d'aide.
 * @param {string} props.clientId - L'ID du client pour lequel charger les taxonomies.
 * @param {boolean} [props.loading=false] - Indique si le formulaire est en état de chargement global.
 * @returns {React.ReactElement} Le composant de formulaire.
 */
const PlacementFormInfo = memo<PlacementFormInfoProps>(({
  formData,
  onChange,
  onTooltipChange,
  clientId,
  loading = false,
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
   * Charge les taxonomies disponibles pour le client spécifié via `clientId`.
   * Met à jour les états de chargement et d'erreur. La fonction est définie
   * à l'intérieur du composant pour accéder à `clientId` et aux fonctions `set...`.
   * @async
   * @returns {Promise<void>} Une promesse qui se résout une fois le chargement terminé.
   */
  const loadTaxonomies = async () => {
    try {
      setTaxonomiesLoading(true);
      setTaxonomiesError(null);

      console.log(`FIREBASE: LECTURE - Fichier: PlacementFormInfo.tsx - Fonction: loadTaxonomies - Path: clients/${clientId}/taxonomies`);
      const clientTaxonomies = await getClientTaxonomies(clientId);
      setTaxonomies(clientTaxonomies);
    } catch (error) {
      console.error('Erreur lors du chargement des taxonomies:', error);
      setTaxonomiesError('Erreur lors du chargement des taxonomies');
    } finally {
      setTaxonomiesLoading(false);
    }
  };

  const taxonomyOptions = taxonomies.map((taxonomy) => ({
    id: taxonomy.id,
    label: taxonomy.NA_Display_Name,
  }));

  const isDisabled = loading || taxonomiesLoading;

  return (
    <div className="p-8 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Informations du placement
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configuration de base et taxonomies pour le placement
        </p>
      </div>

      <div className="space-y-6">
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

        {taxonomies.length > 0 ? (
          <>
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
          <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
            <p className="text-sm">
              Aucune taxonomie configurée pour ce client.
              Vous pouvez créer des taxonomies dans la section Configuration.
            </p>
          </div>
        ) : null}
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

PlacementFormInfo.displayName = 'PlacementFormInfo';

export default PlacementFormInfo;