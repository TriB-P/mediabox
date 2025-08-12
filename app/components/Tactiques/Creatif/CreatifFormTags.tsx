// app/components/Tactiques/Creatif/CreatifFormTags.tsx

'use client';

import React, { useMemo } from 'react';
import { CreatifFormData, Tactique, Placement } from '../../../types/tactiques';
import { Campaign } from '../../../types/campaign';
import { FormSection, FormInput, createLabelWithHelp } from '../Tactiques/TactiqueFormComponents';
import { useTranslation } from '../../../contexts/LanguageContext';

interface CreatifFormTagsProps {
  formData: CreatifFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientId: string;
  campaignData?: Campaign;
  tactiqueData?: Tactique;
  placementData?: Placement;
}

export default function CreatifFormTags({
  formData,
  onChange,
  onTooltipChange,
  clientId,
  campaignData,
  tactiqueData,
  placementData
}: CreatifFormTagsProps) {
  const { t } = useTranslation();

  /**
   * Fonction utilitaire pour convertir les dates en format string
   */
  const convertToDateString = (date: any): string => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return String(date);
  };

  /**
   * Récupère les dates limites du placement pour validation
   */
  const placementTagDates = useMemo(() => {
    const tagStartDate = convertToDateString(placementData?.PL_Tag_Start_Date);
    const tagEndDate = convertToDateString(placementData?.PL_Tag_End_Date);
    return { tagStartDate, tagEndDate };
  }, [placementData]);

  /**
   * Validation des dates créatif par rapport aux dates placement
   */
  const dateValidation = useMemo(() => {
    const crStartDate = formData.CR_Tag_Start_Date || '';
    const crEndDate = formData.CR_Tag_End_Date || '';
    const { tagStartDate, tagEndDate } = placementTagDates;

    const errors: string[] = [];

    // Validation date de début
    if (crStartDate && tagStartDate) {
      if (new Date(crStartDate) < new Date(tagStartDate)) {
        errors.push(t('creatifFormTags.validation.startDateBeforePlacement', { date: tagStartDate }));
      }
    }

    // Validation date de fin
    if (crEndDate && tagEndDate) {
      if (new Date(crEndDate) > new Date(tagEndDate)) {
        errors.push(t('creatifFormTags.validation.endDateAfterPlacement', { date: tagEndDate }));
      }
    }

    // Validation cohérence interne créatif
    if (crStartDate && crEndDate) {
      if (new Date(crStartDate) > new Date(crEndDate)) {
        errors.push(t('creatifFormTags.validation.startAfterEnd'));
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [formData.CR_Tag_Start_Date, formData.CR_Tag_End_Date, placementTagDates, t]);

  /**
   * Vérification si le placement parent utilise une rotation pondérée
   */
  const isWeightedRotation = placementData?.PL_Creative_Rotation_Type === 'Weighted';

  return (
    <div className="space-y-6 p-4">
      <FormSection 
        title={t('creatifFormTags.title')}
        description={t('creatifFormTags.description')}
      >
 

        {/* Messages d'erreur */}
        {!dateValidation.isValid && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              {t('creatifFormTags.validation.title')}
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              {dateValidation.errors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section Dates Tags Créatif */}
        <div className="p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="CR_Tag_Start_Date"
              name="CR_Tag_Start_Date"
              value={formData.CR_Tag_Start_Date || ''}
              onChange={onChange}
              type="date"
              className={!dateValidation.isValid && formData.CR_Tag_Start_Date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              label={createLabelWithHelp(
                t('creatifFormTags.fields.startDate.label'),
                t('creatifFormTags.fields.startDate.tooltip', { startDate: placementTagDates.tagStartDate || 'N/A', endDate: placementTagDates.tagEndDate || 'N/A' }),
                onTooltipChange
              )}
            />

            <FormInput
              id="CR_Tag_End_Date"
              name="CR_Tag_End_Date"
              value={formData.CR_Tag_End_Date || ''}
              onChange={onChange}
              type="date"
              className={!dateValidation.isValid && formData.CR_Tag_End_Date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              label={createLabelWithHelp(
                t('creatifFormTags.fields.endDate.label'),
                t('creatifFormTags.fields.endDate.tooltip', { startDate: placementTagDates.tagStartDate || 'N/A', endDate: placementTagDates.tagEndDate || 'N/A' }),
                onTooltipChange
              )}
            />
          </div>
        </div>

        {/* Section Rotation pondérée - Affiché seulement si placement parent = Weighted */}
        {isWeightedRotation && (
          <div className="p-4 rounded-lg space-y-4">
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <strong>{t('creatifFormTags.weightedRotation.activated')}</strong> {t('creatifFormTags.weightedRotation.description')}
                  </p>
                </div>
              </div>
            </div>

            <FormInput
              id="CR_Rotation_Weight"
              name="CR_Rotation_Weight"
              value={formData.CR_Rotation_Weight || ''}
              onChange={onChange}
              type="number"
              placeholder={t('creatifFormTags.fields.weight.placeholder')}
              label={createLabelWithHelp(
                t('creatifFormTags.fields.weight.label'),
                t('creatifFormTags.fields.weight.tooltip'),
                onTooltipChange
              )}
            />

            <div className="text-sm text-gray-600 mt-2">
              <strong>{t('creatifFormTags.weightedRotation.noteTitle')}</strong> {t('creatifFormTags.weightedRotation.noteDescription')}
            </div>
          </div>
        )}

        {/* Information sur le type de rotation du placement */}
        {placementData?.PL_Creative_Rotation_Type && !isWeightedRotation && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              {t('creatifFormTags.rotationInfo.title')}
            </h4>
            <p className="text-sm text-gray-600">
              <strong>{placementData.PL_Creative_Rotation_Type}</strong>
              {placementData.PL_Creative_Rotation_Type === 'Even' && ` - ${t('creatifFormTags.rotationInfo.evenDescription')}`}
              {placementData.PL_Creative_Rotation_Type === 'Optimized by clicks' && ` - ${t('creatifFormTags.rotationInfo.optimizedDescription')}`}
              {placementData.PL_Creative_Rotation_Type === 'Floodlight' && ` - ${t('creatifFormTags.rotationInfo.floodlightDescription')}`}
            </p>
          </div>
        )}

     
      </FormSection>
    </div>
  );
}