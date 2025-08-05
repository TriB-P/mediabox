// app/components/Tactiques/Placement/PlacementFormTags.tsx

'use client';

import React from 'react';
import { PlacementFormData, Tactique } from '../../../types/tactiques';
import { Campaign } from '../../../types/campaign';
import { FormSection, FormInput, SmartSelect, createLabelWithHelp } from '../Tactiques/TactiqueFormComponents';

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

  // Options pour TC_Tag_Type
  const tagTypeOptions = [
    { id: '', label: 'Sélectionner un type...' },
    { id: 'Video-Hosted', label: 'Video-Hosted' },
    { id: 'Video-Tracked', label: 'Video-Tracked' },
    { id: 'Display-Hosted', label: 'Display-Hosted' },
    { id: 'Display-Tracked', label: 'Display-Tracked' },
    { id: 'Audio-Hosted', label: 'Audio-Hosted' },
    { id: 'Audio-Tracked', label: 'Audio-Tracked' }
  ];

  // Options pour les champs boolean
  const booleanOptions = [
    { id: 'true', label: 'Oui' },
    { id: 'false', label: 'Non' }
  ];

  return (
    <div className="space-y-6 p-4">
      <FormSection 
        title="Configuration des Tags"
        description="Configurez les paramètres de trafficking pour ce placement."
      >
        {/* Section Dates */}
        <div className="p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="TC_Tag_Start_Date"
              name="TC_Tag_Start_Date"
              value={formData.TC_Tag_Start_Date || ''}
              onChange={onChange}
              type="date"
              label={createLabelWithHelp(
                'Date de début tag',
                'Date de début pour le tagging (par défaut : date de début du placement - 30 jours)',
                onTooltipChange
              )}
            />

            <FormInput
              id="TC_Tag_End_Date"
              name="TC_Tag_End_Date"
              value={formData.TC_Tag_End_Date || ''}
              onChange={onChange}
              type="date"
              label={createLabelWithHelp(
                'Date de fin tag',
                'Date de fin pour le tagging (par défaut : date de fin du placement + 30 jours)',
                onTooltipChange
              )}
            />
          </div>
        </div>

        {/* Section Type de tag */}
        <div className="px-4 py-0 rounded-lg">
        <SmartSelect
            id="TC_Tag_Type"
            name="TC_Tag_Type"
            value={formData.TC_Tag_Type || ''}
            onChange={onChange}
            options={tagTypeOptions}
            placeholder="Sélectionner un type de tag..."
            label={createLabelWithHelp(
              'Type de tag',
              'Sélectionnez le type de tag approprié selon le format média',
              onTooltipChange
            )}
          />
        </div>

        {/* Section Options avancées */}
        <div className="p-4 rounded-lg space-y-4">
          
          <SmartSelect
            id="TC_Third_Party_Measurement"
            name="TC_Third_Party_Measurement"
            value={formData.TC_Third_Party_Measurement === true || formData.TC_Third_Party_Measurement ? 'true' : 'false'}
            onChange={onChange}
            options={booleanOptions}
            placeholder="Sélectionner..."
            label={createLabelWithHelp(
              'Mesure partenaire externe (ex : Double Verify)',
              'Active ou désactive la mesure par un partenaire externe.',
              onTooltipChange
            )}
          />

          <SmartSelect
            id="TC_VPAID"
            name="TC_VPAID"
            value={formData.TC_VPAID === true || formData.TC_VPAID ? 'true' : 'false'}
            onChange={onChange}
            options={booleanOptions}
            placeholder="Sélectionner..."
            label={createLabelWithHelp(
              'VPAID',
              'Active ou désactive VPAID (Video Player-Ad Interface Definition)',
              onTooltipChange
            )}
          />
        </div>
      </FormSection>
    </div>
  );
}