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
        title="Configuration des Tags"
        description="Configurez les paramètres de trafficking pour ce placement."
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
                'Date de début tag',
                'Date de début pour le tagging (par défaut : date de début du placement - 30 jours)',
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

        {/* Section Rotation des créatifs */}
        <div className="p-4 rounded-lg space-y-4">
          <SmartSelect
            id="PL_Creative_Rotation_Type"
            name="PL_Creative_Rotation_Type"
            value={formData.PL_Creative_Rotation_Type || ''}
            onChange={onChange}
            options={rotationTypeOptions}
            placeholder="Sélectionner un type de rotation..."
            label={createLabelWithHelp(
              'Type de rotation créatif',
              'Définit comment les créatifs de ce placement seront affichés en rotation',
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
              placeholder="Entrez le nom ET le ID du floodlight"
              label={createLabelWithHelp(
                'Configuration Floodlight',
                'Paramètres spécifiques pour la configuration Floodlight',
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
                    <strong>Rotation pondérée activée :</strong> Vous pourrez définir un poids de rotation (%) pour chaque créatif de ce placement dans l'onglet Tags des créatifs.
                  </p>
                </div>
              </div>
            </div>
          )}
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