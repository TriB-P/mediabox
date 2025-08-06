// app/components/Tactiques/Creatif/CreatifFormInfo.tsx

/**
 * @file Ce fichier contient le composant React `CreatifFormInfo`.
 * Ce composant est une partie d'un formulaire plus grand et gère spécifiquement
 * les informations de base d'un "créatif" (comme une publicité).
 * Il permet à l'utilisateur de définir un nom pour le créatif, les dates de début/fin,
 * et d'associer des taxonomies (catégories pré-définies) qui sont récupérées depuis Firebase
 * en fonction du client sélectionné.
 * 
 * AJOUT : Champ calculé CR_Sprint_Dates en lecture seule (format MMMdd-MMMdd)
 */

'use client';

import React, { useState, useEffect, memo, useMemo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
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
    CR_Start_Date?: string;
    CR_End_Date?: string;
    CR_Sprint_Dates?: string;
    CR_Taxonomy_Tags?: string;
    CR_Taxonomy_Platform?: string;
    CR_Taxonomy_MediaOcean?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientId: string;
  campaignData?: any;
  tactiqueData?: any;
  placementData?: any;
  loading?: boolean;
}

/**
 * Formate une date en format MMMdd (ex: "Jan15", "Feb28")
 * @param dateString Date au format ISO (YYYY-MM-DD)
 * @returns Date formatée en MMMdd ou chaîne vide si invalide
 */
const formatDateToMMMdd = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // Parse directement la chaîne pour éviter les problèmes de fuseau horaire
    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) return '';
    
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Les mois JavaScript commencent à 0
    const day = parseInt(dateParts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
    if (month < 0 || month > 11 || day < 1 || day > 31) return '';
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthName = monthNames[month];
    const dayFormatted = day.toString().padStart(2, '0');
    
    return `${monthName}${dayFormatted}`;
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return '';
  }
};

/**
 * Affiche la section du formulaire dédiée aux informations générales du créatif.
 * Ce composant gère la saisie du nom du créatif, les dates et la sélection des taxonomies
 * applicables pour les tags, la plateforme et MediaOcean.
 * Il récupère dynamiquement les taxonomies disponibles pour le client spécifié.
 * AJOUT : Calcul et affichage du champ CR_Sprint_Dates en lecture seule.
 *
 * @param {CreatifFormInfoProps} props - Les propriétés du composant.
 * @param {object} props.formData - Les données actuelles du formulaire pour ce composant.
 * @param {function} props.onChange - Le gestionnaire pour les changements dans les champs de saisie.
 * @param {function} props.onTooltipChange - Le gestionnaire pour afficher des infobulles d'aide.
 * @param {string} props.clientId - L'ID du client pour lequel charger les taxonomies.
 * @param {any} [props.campaignData] - Les données de la campagne pour l'héritage des dates.
 * @param {any} [props.tactiqueData] - Les données de la tactique pour l'héritage des dates.
 * @param {any} [props.placementData] - Les données du placement pour l'héritage des dates.
 * @param {boolean} [props.loading=false] - Indique si le formulaire parent est en état de chargement.
 * @returns {React.ReactElement} Le composant de formulaire pour les informations du créatif.
 */
const CreatifFormInfo = memo<CreatifFormInfoProps>(({
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
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [taxonomiesLoading, setTaxonomiesLoading] = useState(true);
  const [taxonomiesError, setTaxonomiesError] = useState<string | null>(null);

  // Calcul automatique du champ CR_Sprint_Dates
  const sprintDates = useMemo(() => {
    const startFormatted = formatDateToMMMdd(formData.CR_Start_Date || '');
    const endFormatted = formatDateToMMMdd(formData.CR_End_Date || '');
    
    if (startFormatted && endFormatted) {
      return `${startFormatted}-${endFormatted}`;
    }
    return '';
  }, [formData.CR_Start_Date, formData.CR_End_Date]);

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
      setTaxonomiesError(t('creatifFormInfo.errors.taxonomyLoad'));
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
          {t('creatifFormInfo.title')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('creatifFormInfo.description')}
        </p>
      </div>
      
      <div className="space-y-6">
        
        <FormInput
          id="CR_Label"
          name="CR_Label"
          value={formData.CR_Label || ''}
          onChange={onChange}
          type="text"
          placeholder={t('creatifFormInfo.creativeName.placeholder')}
          required={!isDisabled}
          label={createLabelWithHelp(
            t('creatifFormInfo.creativeName.label'), 
            t('creatifFormInfo.creativeName.tooltip'), 
            onTooltipChange
          )}
        />

        {/* CHAMPS DE DATES CÔTE À CÔTE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="CR_Start_Date"
            name="CR_Start_Date"
            value={formData.CR_Start_Date || ''}
            onChange={onChange}
            type="date"
            label={createLabelWithHelp(
              t('creatifFormInfo.startDate.label'),
              t('creatifFormInfo.startDate.tooltip'),
              onTooltipChange
            )}
          />

          <FormInput
            id="CR_End_Date"
            name="CR_End_Date"
            value={formData.CR_End_Date || ''}
            onChange={onChange}
            type="date"
            label={createLabelWithHelp(
              t('creatifFormInfo.endDate.label'),
              t('creatifFormInfo.endDate.tooltip'),
              onTooltipChange
            )}
          />
        </div>

        {/* NOUVEAU CHAMP CR_Sprint_Dates EN LECTURE SEULE */}
        <FormInput
          id="CR_Sprint_Dates"
          name="CR_Sprint_Dates"
          value={sprintDates}
          onChange={() => {}} // Fonction vide car le champ est en lecture seule
          type="text"
          label={createLabelWithHelp(
            'Sprint Dates',
            'Dates du sprint calculées automatiquement (format: MMMdd-MMMdd)',
            onTooltipChange
          )}
          className="bg-gray-50 text-gray-600"
        />

        {taxonomiesError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {taxonomiesError}
            <button 
              onClick={loadTaxonomies}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              {t('creatifFormInfo.retry')}
            </button>
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {t('creatifFormInfo.taxonomySection.title')}
          </h4>

          {taxonomies.length > 0 ? (
            <div className="space-y-4">
              <SmartSelect
                id="CR_Taxonomy_Tags"
                name="CR_Taxonomy_Tags"
                value={formData.CR_Taxonomy_Tags || ''}
                onChange={onChange}
                options={taxonomyOptions}
                placeholder={t('creatifFormInfo.taxonomySection.placeholder')}
                label={createLabelWithHelp(
                  t('creatifFormInfo.taxonomyTags.label'), 
                  t('creatifFormInfo.taxonomyTags.tooltip'), 
                  onTooltipChange
                )}
              />

              <SmartSelect
                id="CR_Taxonomy_Platform"
                name="CR_Taxonomy_Platform"
                value={formData.CR_Taxonomy_Platform || ''}
                onChange={onChange}
                options={taxonomyOptions}
                placeholder={t('creatifFormInfo.taxonomySection.placeholder')}
                label={createLabelWithHelp(
                  t('creatifFormInfo.taxonomyPlatform.label'), 
                  t('creatifFormInfo.taxonomyPlatform.tooltip'), 
                  onTooltipChange
                )}
              />

              <SmartSelect
                id="CR_Taxonomy_MediaOcean"
                name="CR_Taxonomy_MediaOcean"
                value={formData.CR_Taxonomy_MediaOcean || ''}
                onChange={onChange}
                options={taxonomyOptions}
                placeholder={t('creatifFormInfo.taxonomySection.placeholder')}
                label={createLabelWithHelp(
                  t('creatifFormInfo.taxonomyMediaOcean.label'), 
                  t('creatifFormInfo.taxonomyMediaOcean.tooltip'), 
                  onTooltipChange
                )}
              />
            </div>
          ) : !taxonomiesLoading && !taxonomiesError ? (
            <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
              <p className="text-sm">
                {t('creatifFormInfo.noTaxonomy.message')}
                {' '}
                {t('creatifFormInfo.noTaxonomy.action')}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {(loading || taxonomiesLoading) && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            {loading ? t('creatifFormInfo.loading.data') : t('creatifFormInfo.loading.taxonomies')}
          </p>
        </div>
      )}
    </div>
  );
});

CreatifFormInfo.displayName = 'CreatifFormInfo';

export default CreatifFormInfo;