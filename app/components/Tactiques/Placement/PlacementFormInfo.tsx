// app/components/Tactiques/Placement/PlacementFormInfo.tsx

/**
 * Ce fichier définit le composant PlacementFormInfo, une section de formulaire utilisée
 * pour la création ou la modification des informations de base d'un "Placement".
 * Il gère la saisie du nom du placement, les dates de début/fin et la sélection des taxonomies associées
 * en récupérant les taxonomies spécifiques au client depuis la base de données.
 * * VERSION SIMPLIFIÉE : Les valeurs des dates proviennent directement de formData 
 * (l'héritage se fait dans PlacementDrawer lors de l'initialisation).
 */
'use client';

import React, { useState, useEffect, memo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
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
    PL_Start_Date?: string;
    PL_End_Date?: string;
    PL_Taxonomy_Tags?: string;
    PL_Taxonomy_Platform?: string;
    PL_Taxonomy_MediaOcean?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientId: string;
  campaignData?: any;
  tactiqueData?: any;
  loading?: boolean;
}

/**
 * Composant de formulaire pour les informations générales d'un placement.
 * Affiche les champs pour le nom du placement, les dates et les sélecteurs de taxonomies.
 * Les taxonomies sont chargées dynamiquement en fonction de l'ID du client.
 * * Les dates affichées proviennent directement de formData - l'héritage est géré par le parent.
 */
const PlacementFormInfo = memo<PlacementFormInfoProps>(({
  formData,
  onChange,
  onTooltipChange,
  clientId,
  campaignData,
  tactiqueData,
  loading = false,
}) => {
  const { t } = useTranslation();
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
      setTaxonomiesError(t('placementFormInfo.notifications.taxonomiesError'));
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
          {t('placementFormInfo.header.title')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('placementFormInfo.header.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        <FormInput
          id="PL_Label"
          name="PL_Label"
          value={formData.PL_Label || ''}
          onChange={onChange}
          type="text"
          placeholder={t('placementFormInfo.fields.namePlaceholder')}
          required={!isDisabled}
          label={createLabelWithHelp(
            t('placementFormInfo.fields.nameLabel'),
            t('placementFormInfo.fields.nameTooltip'),
            onTooltipChange
          )}
        />

        {/* CHAMPS DE DATES CÔTE À CÔTE - Valeurs directes depuis formData */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="PL_Start_Date"
            name="PL_Start_Date"
            value={formData.PL_Start_Date || ''}
            onChange={onChange}
            type="date"
            label={createLabelWithHelp(
              t('placementFormInfo.fields.startDateLabel'),
              t('placementFormInfo.fields.startDateTooltip'),
              onTooltipChange
            )}
          />

          <FormInput
            id="PL_End_Date"
            name="PL_End_Date"
            value={formData.PL_End_Date || ''}
            onChange={onChange}
            type="date"
            label={createLabelWithHelp(
              t('placementFormInfo.fields.endDateLabel'),
              t('placementFormInfo.fields.endDateTooltip'),
              onTooltipChange
            )}
          />
        </div>

        {taxonomiesError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {taxonomiesError}
            <button
              onClick={loadTaxonomies}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              {t('placementFormInfo.notifications.retry')}
            </button>
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {t('placementFormInfo.taxonomies.title')}
          </h4>

          {taxonomies.length > 0 ? (
            <div className="space-y-4">
              <SmartSelect
                id="PL_Taxonomy_Tags"
                name="PL_Taxonomy_Tags"
                value={formData.PL_Taxonomy_Tags || ''}
                onChange={onChange}
                options={taxonomyOptions}
                placeholder={t('placementFormInfo.taxonomies.placeholder')}
                label={createLabelWithHelp(
                  t('placementFormInfo.taxonomies.tagsLabel'),
                  t('placementFormInfo.taxonomies.tagsTooltip'),
                  onTooltipChange
                )}
              />

              <SmartSelect
                id="PL_Taxonomy_Platform"
                name="PL_Taxonomy_Platform"
                value={formData.PL_Taxonomy_Platform || ''}
                onChange={onChange}
                options={taxonomyOptions}
                placeholder={t('placementFormInfo.taxonomies.placeholder')}
                label={createLabelWithHelp(
                  t('placementFormInfo.taxonomies.platformLabel'),
                  t('placementFormInfo.taxonomies.platformTooltip'),
                  onTooltipChange
                )}
              />

              <SmartSelect
                id="PL_Taxonomy_MediaOcean"
                name="PL_Taxonomy_MediaOcean"
                value={formData.PL_Taxonomy_MediaOcean || ''}
                onChange={onChange}
                options={taxonomyOptions}
                placeholder={t('placementFormInfo.taxonomies.placeholder')}
                label={createLabelWithHelp(
                  t('placementFormInfo.taxonomies.mediaOceanLabel'),
                  t('placementFormInfo.taxonomies.mediaOceanTooltip'),
                  onTooltipChange
                )}
              />
            </div>
          ) : !taxonomiesLoading && !taxonomiesError ? (
            <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
              <p className="text-sm">
                {t('placementFormInfo.notifications.noTaxonomiesConfigured')}{' '}
                {t('placementFormInfo.notifications.youCanCreateTaxonomies')}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {(loading || taxonomiesLoading) && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            {loading ? t('placementFormInfo.notifications.loadingData') : t('placementFormInfo.notifications.loadingTaxonomies')}
          </p>
        </div>
      )}
    </div>
  );
});

PlacementFormInfo.displayName = 'PlacementFormInfo';

export default PlacementFormInfo;