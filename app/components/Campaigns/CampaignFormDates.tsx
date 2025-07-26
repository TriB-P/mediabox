/**
 * @file Ce fichier contient le composant React `CampaignFormDates`, une section de formulaire dédiée à la sélection des dates de début et de fin d'une campagne.
 * Il gère la validation des dates et affiche dynamiquement la durée de la campagne ainsi que la période de sprint correspondante.
 */

'use client';

import React, { memo } from 'react';
import {
  FormInput,
  createLabelWithHelp,
  FormSection
} from '../Tactiques/Tactiques/TactiqueFormComponents';
import { CampaignFormData } from '../../types/campaign';
import { useTranslation } from '../../contexts/LanguageContext';

interface CampaignFormDatesProps {
  formData: CampaignFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  loading?: boolean;
}

/**
 * Gère l'affichage et la logique de la section des dates dans le formulaire de campagne.
 * @param {CampaignFormDatesProps} props - Les propriétés du composant.
 * @param {CampaignFormData} props.formData - Les données actuelles du formulaire.
 * @param {Function} props.onChange - La fonction de rappel pour gérer les changements dans les champs du formulaire.
 * @param {Function} props.onTooltipChange - La fonction de rappel pour afficher les infobulles d'aide.
 * @param {boolean} [props.loading=false] - Indique si le formulaire est en état de chargement, désactivant les champs.
 * @returns {React.ReactElement} Le composant de la section des dates du formulaire.
 */
const CampaignFormDates = memo<CampaignFormDatesProps>(({
  formData,
  onChange,
  onTooltipChange,
  loading = false
}) => {
  const { t } = useTranslation();
  const isDisabled = loading;

  /**
   * Valide que la date de fin est postérieure à la date de début.
   * @returns {string | null} Un message d'erreur si la validation échoue, sinon null.
   */
  const getDateValidationMessage = (): string | null => {
    if (!formData.CA_Start_Date || !formData.CA_End_Date) return null;

    const startDate = new Date(formData.CA_Start_Date);
    const endDate = new Date(formData.CA_End_Date);

    if (endDate <= startDate) {
      return t('campaigns.formDates.validationError');
    }

    return null;
  };

  const dateValidationError = getDateValidationMessage();

  return (
    <div className="p-8 space-y-6">
      <FormSection
        title={t('campaigns.formDates.title')}
        description={t('campaigns.formDates.description')}
      >
        <div className="space-y-6">
          <FormInput
            id="CA_Start_Date"
            name="CA_Start_Date"
            value={formData.CA_Start_Date}
            onChange={onChange}
            type="date"
            required={!isDisabled}
            label={createLabelWithHelp(
              t('campaigns.formDates.startDateLabel'),
              t('campaigns.formDates.startDateHelp'),
              onTooltipChange
            )}
          />

          <FormInput
            id="CA_End_Date"
            name="CA_End_Date"
            value={formData.CA_End_Date}
            onChange={onChange}
            type="date"
            required={!isDisabled}
            label={createLabelWithHelp(
              t('campaigns.formDates.endDateLabel'),
              t('campaigns.formDates.endDateHelp'),
              onTooltipChange
            )}
          />

          {dateValidationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{dateValidationError}</p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                t('campaigns.formDates.sprintPeriodLabel'),
                t('campaigns.formDates.sprintPeriodHelp'),
                onTooltipChange
              )}
            </div>
            <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
              {formData.CA_Sprint_Dates ? (
                <p className="font-mono text-sm">{formData.CA_Sprint_Dates}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">{t('campaigns.formDates.sprintPeriodGenerated')}</p>
              )}
            </div>
          </div>

          {formData.CA_Start_Date && formData.CA_End_Date && !dateValidationError && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
              <p className="text-sm">
                <strong>{t('campaigns.formDates.campaignDuration')}</strong> {
                  t('campaigns.formDates.days', { count: Math.ceil(
                    (new Date(formData.CA_End_Date).getTime() - new Date(formData.CA_Start_Date).getTime())
                    / (1000 * 60 * 60 * 24)
                  )})
                }
              </p>
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
});

CampaignFormDates.displayName = 'CampaignFormDates';

export default CampaignFormDates;