// app/components/Tactiques/Placement/PlacementFormTags.tsx

'use client';

import React from 'react';
import { PlacementFormData, Tactique } from '../../../types/tactiques';
import { Campaign } from '../../../types/campaign';
import { FormSection, FormInput, SmartSelect, createLabelWithHelp } from '../Tactiques/TactiqueFormComponents';
import { useTranslation } from '../../../contexts/LanguageContext';

interface PlacementFormTagsProps {
  formData: PlacementFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  clientId: string;
  campaignData?: Campaign;
  tactiqueData?: Tactique;
}

export default function PlacementFormTags({
  formData,
  onChange,
  onTooltipChange,
  clientId,
  campaignData,
  tactiqueData
}: PlacementFormTagsProps) {

  const { t } = useTranslation();

  // Options pour PL_Tag_Type
  const tagTypeOptions = [
    { id: '', label: t('placementFormTags.tagType.selectOption') },
    { id: 'Video-Hosted', label: 'Video-Hosted' },
    { id: 'Video-Tracked', label: 'Video-Tracked' },
    { id: 'Display-Hosted', label: 'Display-Hosted' },
    { id: 'Display-Tracked', label: 'Display-Tracked' },
    { id: 'Audio-Hosted', label: 'Audio-Hosted' },
    { id: 'Audio-Tracked', label: 'Audio-Tracked' }
  ];

  // Options pour les champs boolean
  const booleanOptions = [
    { id: 'true', label: t('common.yes') },
    { id: 'false', label: t('common.no') }
  ];

  // Options pour PL_Creative_Rotation_Type
  const rotationTypeOptions = [
    { id: 'Even', label: 'Even' },
    { id: 'Optimized by clicks', label: 'Optimized by clicks' },
    { id: 'Weighted', label: 'Weighted' },
    { id: 'Floodlight', label: 'Floodlight' }
  ];

  return (
    <div className="space-y-6 p-4">
      <FormSection 
        title={t('placementFormTags.section.title')}
        description={t('placementFormTags.section.description')}
      >
        {/* Section Dates */}
        <div className="p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="PL_Tag_Start_Date"
              name="PL_Tag_Start_Date"
              value={formData.PL_Tag_Start_Date || ''}
              onChange={onChange}
              type="date"
              label={createLabelWithHelp(
                t('placementFormTags.dates.startDateLabel'),
                t('placementFormTags.dates.startDateTooltip'),
                onTooltipChange
              )}
            />

            <FormInput
              id="PL_Tag_End_Date"
              name="PL_Tag_End_Date"
              value={formData.PL_Tag_End_Date || ''}
              onChange={onChange}
              type="date"
              label={createLabelWithHelp(
                t('placementFormTags.dates.endDateLabel'),
                t('placementFormTags.dates.endDateTooltip'),
                onTooltipChange
              )}
            />
          </div>
        </div>

        {/* Section Type de tag */}
        <div className="px-4 py-0 rounded-lg">
        <SmartSelect
            id="PL_Tag_Type"
            name="PL_Tag_Type"
            value={formData.PL_Tag_Type || ''}
            onChange={onChange}
            options={tagTypeOptions}
            placeholder={t('placementFormTags.tagType.placeholder')}
            label={createLabelWithHelp(
              t('placementFormTags.tagType.label'),
              t('placementFormTags.tagType.tooltip'),
              onTooltipChange
            )}
          />
        </div>

        {/* Section Rotation des créatifs */}
        <div className="p-4 rounded-lg space-y-4">
          <SmartSelect
            id="PL_Creative_Rotation_Type"
            name="PL_Creative_Rotation_Type"
            value={formData.PL_Creative_Rotation_Type || ''}
            onChange={onChange}
            options={rotationTypeOptions}
            placeholder={t('placementFormTags.rotation.placeholder')}
            label={createLabelWithHelp(
              t('placementFormTags.rotation.label'),
              t('placementFormTags.rotation.tooltip'),
              onTooltipChange
            )}
          />

          {/* Champ conditionnel pour Floodlight */}
          {formData.PL_Creative_Rotation_Type === 'Floodlight' && (
            <FormInput
              id="PL_Floodlight"
              name="PL_Floodlight"
              value={formData.PL_Floodlight || ''}
              onChange={onChange}
              type="text"
              placeholder={t('placementFormTags.floodlight.placeholder')}
              label={createLabelWithHelp(
                t('placementFormTags.floodlight.label'),
                t('placementFormTags.floodlight.tooltip'),
                onTooltipChange
              )}
            />
          )}

          {/* Message informatif pour Weighted */}
          {formData.PL_Creative_Rotation_Type === 'Weighted' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>{t('placementFormTags.weightedInfo.title')}</strong>
                    {' '}{t('placementFormTags.weightedInfo.text')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Options avancées */}
        <div className="p-4 rounded-lg space-y-4">
          
          <SmartSelect
            id="PL_Third_Party_Measurement"
            name="PL_Third_Party_Measurement"
            value={formData.PL_Third_Party_Measurement === true || formData.PL_Third_Party_Measurement ? 'true' : 'false'}
            onChange={onChange}
            options={booleanOptions}
            placeholder={t('placementFormTags.advanced.selectPlaceholder')}
            label={createLabelWithHelp(
              t('placementFormTags.advanced.thirdPartyMeasurementLabel'),
              t('placementFormTags.advanced.thirdPartyMeasurementTooltip'),
              onTooltipChange
            )}
          />

          <SmartSelect
            id="PL_VPAID"
            name="PL_VPAID"
            value={formData.PL_VPAID === true || formData.PL_VPAID ? 'true' : 'false'}
            onChange={onChange}
            options={booleanOptions}
            placeholder={t('placementFormTags.advanced.selectPlaceholder')}
            label={createLabelWithHelp(
              t('placementFormTags.advanced.vpaidLabel'),
              t('placementFormTags.advanced.vpaidTooltip'),
              onTooltipChange
            )}
          />
        </div>
      </FormSection>
    </div>
  );
}