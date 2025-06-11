// app/components/Campaigns/CampaignFormDates.tsx

'use client';

import React, { memo } from 'react';
import { 
  FormInput, 
  FormTextarea,
  createLabelWithHelp,
  FormSection 
} from '../Tactiques/Tactiques/TactiqueFormComponents';
import { CampaignFormData } from '../../types/campaign';

// ==================== TYPES ====================

interface CampaignFormDatesProps {
  formData: CampaignFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  loading?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const CampaignFormDates = memo<CampaignFormDatesProps>(({
  formData,
  onChange,
  onTooltipChange,
  loading = false
}) => {
  const isDisabled = loading;

  // Validation des dates
  const getDateValidationMessage = (): string | null => {
    if (!formData.CA_Start_Date || !formData.CA_End_Date) return null;
    
    const startDate = new Date(formData.CA_Start_Date);
    const endDate = new Date(formData.CA_End_Date);
    
    if (endDate <= startDate) {
      return 'La date de fin doit être postérieure à la date de début';
    }
    
    return null;
  };

  const dateValidationError = getDateValidationMessage();

  return (
    <div className="p-8 space-y-6">
      <FormSection
        title="Planification temporelle"
        description="Définissez la période d'exécution de votre campagne"
      >
        <div className="space-y-6">
          {/* Date de début */}
          <FormInput
            id="CA_Start_Date"
            name="CA_Start_Date"
            value={formData.CA_Start_Date}
            onChange={onChange}
            type="date"
            required={!isDisabled}
            label={createLabelWithHelp(
              'Date de début *', 
              'Date de lancement officiel de la campagne', 
              onTooltipChange
            )}
          />

          {/* Date de fin */}
          <FormInput
            id="CA_End_Date"
            name="CA_End_Date"
            value={formData.CA_End_Date}
            onChange={onChange}
            type="date"
            required={!isDisabled}
            label={createLabelWithHelp(
              'Date de fin *', 
              'Date de fin prévue de la campagne', 
              onTooltipChange
            )}
          />

          {/* Message d'erreur de validation */}
          {dateValidationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{dateValidationError}</p>
            </div>
          )}

          {/* Dates de sprint */}
          <FormTextarea
            id="CA_Sprint_Dates"
            name="CA_Sprint_Dates"
            value={formData.CA_Sprint_Dates || ''}
            onChange={onChange}
            rows={3}
            placeholder="Ex: Sprint 1: 01/01/2024 - 15/01/2024&#10;Sprint 2: 16/01/2024 - 31/01/2024"
            label={createLabelWithHelp(
              'Dates de sprint', 
              'Définissez les phases ou sprints de votre campagne (optionnel)', 
              onTooltipChange
            )}
          />

          {/* Information sur la durée */}
          {formData.CA_Start_Date && formData.CA_End_Date && !dateValidationError && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
              <p className="text-sm">
                <strong>Durée de la campagne :</strong> {
                  Math.ceil(
                    (new Date(formData.CA_End_Date).getTime() - new Date(formData.CA_Start_Date).getTime()) 
                    / (1000 * 60 * 60 * 24)
                  )
                } jours
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