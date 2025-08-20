// app/components/Tactiques/Tactiques/TactiqueFormSpecs.tsx

/**
 * Ce fichier contient le composant TactiqueFormSpecs pour gérer les spécifications
 * techniques dans le formulaire de tactique. Il permet de sélectionner un partenaire,
 * puis une spec de ce partenaire pour auto-remplir les champs, avec possibilité
 * de modification manuelle et de reset.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FormInput, 
  FormTextarea, 
  SmartSelect, 
  FormSection,
  createLabelWithHelp 
} from './TactiqueFormComponents';
import { getPartnerSpecs, Spec } from '../../../lib/specService';
import { ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../../contexts/LanguageContext';

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

interface TactiqueFormSpecsProps {
  formData: {
    TC_Spec_PartnerId?: string;
    TC_Spec_SelectedSpecId?: string;
    TC_Spec_Name?: string;
    TC_Spec_Format?: string;
    TC_Spec_Ratio?: string;
    TC_Spec_FileType?: string;
    TC_Spec_MaxWeight?: string;
    TC_Spec_Weight?: string;
    TC_Spec_Animation?: string;
    TC_Spec_Title?: string;
    TC_Spec_Text?: string;
    TC_Spec_SpecSheetLink?: string;
    TC_Spec_Notes?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  publishersList: ListItem[];
  clientId: string;
}

/**
 * Composant pour gérer les spécifications techniques de la tactique
 * @param formData - Les données du formulaire incluant les champs de specs
 * @param onChange - Fonction de callback pour les changements de champs
 * @param onTooltipChange - Fonction pour gérer l'affichage des tooltips
 * @param publishersList - Liste des partenaires disponibles
 * @param clientId - ID du client pour les requêtes Firebase
 */
export default function TactiqueFormSpecs({
  formData,
  onChange,
  onTooltipChange,
  publishersList,
  clientId
}: TactiqueFormSpecsProps) {
  
  const { t } = useTranslation();
  const [partnerSpecs, setPartnerSpecs] = useState<Spec[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpecData, setSelectedSpecData] = useState<Spec | null>(null);

  /**
   * Charge les specs d'un partenaire spécifique
   */
  const loadPartnerSpecs = useCallback(async (partnerId: string) => {
    if (!partnerId) {
      setPartnerSpecs([]);
      return;
    }

    setLoading(true);
    try {
      const specs = await getPartnerSpecs(partnerId);
      setPartnerSpecs(specs);
    } catch (error) {
      console.error('Erreur lors du chargement des specs:', error);
      setPartnerSpecs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Effet pour charger les specs quand le partenaire change
   */
  useEffect(() => {
    if (formData.TC_Spec_PartnerId) {
      loadPartnerSpecs(formData.TC_Spec_PartnerId);
    } else {
      setPartnerSpecs([]);
      setSelectedSpecData(null);
    }
  }, [formData.TC_Spec_PartnerId, loadPartnerSpecs]);

  /**
   * Effet pour initialiser selectedSpecData quand on a une spec sélectionnée et que les specs sont chargées
   */
  useEffect(() => {
    if (formData.TC_Spec_SelectedSpecId && partnerSpecs.length > 0) {
      const selectedSpec = partnerSpecs.find(spec => spec.id === formData.TC_Spec_SelectedSpecId);
      if (selectedSpec) {
        setSelectedSpecData(selectedSpec);
      }
    } else if (!formData.TC_Spec_SelectedSpecId) {
      setSelectedSpecData(null);
    }
  }, [formData.TC_Spec_SelectedSpecId, partnerSpecs]);

  /**
   * Gère la sélection d'un partenaire
   */
  const handlePartnerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const partnerId = e.target.value;
    
    // Réinitialiser les specs et les champs quand on change de partenaire
    onChange({
      target: { name: 'TC_Spec_PartnerId', value: partnerId }
    } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    
    // Vider la spec sélectionnée et tous les champs
    const fieldsToReset = [
      'TC_Spec_SelectedSpecId', 'TC_Spec_Name', 'TC_Spec_Format', 'TC_Spec_Ratio',
      'TC_Spec_FileType', 'TC_Spec_MaxWeight', 'TC_Spec_Weight', 'TC_Spec_Animation',
      'TC_Spec_Title', 'TC_Spec_Text', 'TC_Spec_SpecSheetLink', 'TC_Spec_Notes'
    ];
    
    fieldsToReset.forEach(field => {
      onChange({
        target: { name: field, value: '' }
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    });
    
    setSelectedSpecData(null);
  };

  /**
   * Gère la sélection d'une spec et auto-remplit les champs
   */
  const handleSpecChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const specId = e.target.value;
    
    onChange({
      target: { name: 'TC_Spec_SelectedSpecId', value: specId }
    } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);

    if (specId) {
      const selectedSpec = partnerSpecs.find(spec => spec.id === specId);
      if (selectedSpec) {
        setSelectedSpecData(selectedSpec);
        
        // Auto-remplir tous les champs
        const specFields = {
          TC_Spec_Name: selectedSpec.name,
          TC_Spec_Format: selectedSpec.format,
          TC_Spec_Ratio: selectedSpec.ratio,
          TC_Spec_FileType: selectedSpec.fileType,
          TC_Spec_MaxWeight: selectedSpec.maxWeight,
          TC_Spec_Weight: selectedSpec.weight,
          TC_Spec_Animation: selectedSpec.animation,
          TC_Spec_Title: selectedSpec.title,
          TC_Spec_Text: selectedSpec.text,
          TC_Spec_SpecSheetLink: selectedSpec.specSheetLink,
          TC_Spec_Notes: selectedSpec.notes
        };

        Object.entries(specFields).forEach(([fieldName, value]) => {
          onChange({
            target: { name: fieldName, value: value || '' }
          } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
        });
      }
    } else {
      setSelectedSpecData(null);
    }
  };

  /**
   * Reset les champs aux valeurs originales de la spec sélectionnée
   */
  const handleReset = () => {
    if (selectedSpecData) {
      const specFields = {
        TC_Spec_Name: selectedSpecData.name,
        TC_Spec_Format: selectedSpecData.format,
        TC_Spec_Ratio: selectedSpecData.ratio,
        TC_Spec_FileType: selectedSpecData.fileType,
        TC_Spec_MaxWeight: selectedSpecData.maxWeight,
        TC_Spec_Weight: selectedSpecData.weight,
        TC_Spec_Animation: selectedSpecData.animation,
        TC_Spec_Title: selectedSpecData.title,
        TC_Spec_Text: selectedSpecData.text,
        TC_Spec_SpecSheetLink: selectedSpecData.specSheetLink,
        TC_Spec_Notes: selectedSpecData.notes
      };

      Object.entries(specFields).forEach(([fieldName, value]) => {
        onChange({
          target: { name: fieldName, value: value || '' }
        } as React.ChangeEvent<HTMLSelectElement>);
      });
    }
  };

  return (
    <div className="p-8 space-y-8">
      <FormSection
        title={t('tactiqueFormSpecs.selection.title')}
        description={t('tactiqueFormSpecs.selection.description')}
      >
        <SmartSelect
          id="TC_Spec_PartnerId"
          name="TC_Spec_PartnerId"
          value={formData.TC_Spec_PartnerId || ''}
          onChange={handlePartnerChange}
          items={publishersList || []}
          placeholder={t('tactiqueFormSpecs.selection.partnerPlaceholder')}
          label={createLabelWithHelp(
            t('tactiqueFormSpecs.selection.partnerLabel'),
            t('tactiqueFormSpecs.selection.partnerTooltip'),
            onTooltipChange
          )}
        />

        {formData.TC_Spec_PartnerId && (
          <>
            {partnerSpecs.length > 0 ? (
              <SmartSelect
                id="TC_Spec_SelectedSpecId"
                name="TC_Spec_SelectedSpecId"
                value={formData.TC_Spec_SelectedSpecId || ''}
                onChange={handleSpecChange}
                options={partnerSpecs.map(spec => ({
                  id: spec.id,
                  label: spec.name
                }))}
                placeholder={loading ? t('tactiqueFormSpecs.selection.specLoadingPlaceholder') : t('tactiqueFormSpecs.selection.specSelectPlaceholder')}
                label={createLabelWithHelp(
                  t('tactiqueFormSpecs.selection.specLabel'),
                  t('tactiqueFormSpecs.selection.specTooltip'),
                  onTooltipChange
                )}
              />
            ) : !loading && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  {t('tactiqueFormSpecs.selection.noSpecs')}
                </p>
              </div>
            )}
          </>
        )}

        {selectedSpecData && (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                {t('tactiqueFormSpecs.selection.specPrefix')} "{selectedSpecData.name}" {t('tactiqueFormSpecs.selection.specSuffix')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              {t('tactiqueFormSpecs.selection.resetButton')}
            </button>
          </div>
        )}
      </FormSection>

      <FormSection
        title={t('tactiqueFormSpecs.details.title')}
        description={t('tactiqueFormSpecs.details.description')}
      >
        <FormInput
          id="TC_Spec_Name"
          name="TC_Spec_Name"
          value={formData.TC_Spec_Name || ''}
          onChange={onChange}
          type="text"
          placeholder={t('tactiqueFormSpecs.details.namePlaceholder')}
          label={createLabelWithHelp(
            t('tactiqueFormSpecs.details.nameLabel'),
            t('tactiqueFormSpecs.details.nameTooltip'),
            onTooltipChange
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="TC_Spec_Format"
            name="TC_Spec_Format"
            value={formData.TC_Spec_Format || ''}
            onChange={onChange}
            type="text"
            placeholder={t('tactiqueFormSpecs.details.formatPlaceholder')}
            label={createLabelWithHelp(
              t('tactiqueFormSpecs.details.formatLabel'),
              t('tactiqueFormSpecs.details.formatTooltip'),
              onTooltipChange
            )}
          />

          <FormInput
            id="TC_Spec_Ratio"
            name="TC_Spec_Ratio"
            value={formData.TC_Spec_Ratio || ''}
            onChange={onChange}
            type="text"
            placeholder={t('tactiqueFormSpecs.details.ratioPlaceholder')}
            label={createLabelWithHelp(
              t('tactiqueFormSpecs.details.ratioLabel'),
              t('tactiqueFormSpecs.details.ratioTooltip'),
              onTooltipChange
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="TC_Spec_FileType"
            name="TC_Spec_FileType"
            value={formData.TC_Spec_FileType || ''}
            onChange={onChange}
            type="text"
            placeholder={t('tactiqueFormSpecs.details.fileTypePlaceholder')}
            label={createLabelWithHelp(
              t('tactiqueFormSpecs.details.fileTypeLabel'),
              t('tactiqueFormSpecs.details.fileTypeTooltip'),
              onTooltipChange
            )}
          />

          <FormInput
            id="TC_Spec_Animation"
            name="TC_Spec_Animation"
            value={formData.TC_Spec_Animation || ''}
            onChange={onChange}
            type="text"
            placeholder={t('tactiqueFormSpecs.details.animationPlaceholder')}
            label={createLabelWithHelp(
              t('tactiqueFormSpecs.details.animationLabel'),
              t('tactiqueFormSpecs.details.animationTooltip'),
              onTooltipChange
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="TC_Spec_MaxWeight"
            name="TC_Spec_MaxWeight"
            value={formData.TC_Spec_MaxWeight || ''}
            onChange={onChange}
            type="text"
            placeholder={t('tactiqueFormSpecs.details.maxWeightPlaceholder')}
            label={createLabelWithHelp(
              t('tactiqueFormSpecs.details.maxWeightLabel'),
              t('tactiqueFormSpecs.details.maxWeightTooltip'),
              onTooltipChange
            )}
          />

          <FormInput
            id="TC_Spec_Weight"
            name="TC_Spec_Weight"
            value={formData.TC_Spec_Weight || ''}
            onChange={onChange}
            type="text"
            placeholder={t('tactiqueFormSpecs.details.weightPlaceholder')}
            label={createLabelWithHelp(
              t('tactiqueFormSpecs.details.weightLabel'),
              t('tactiqueFormSpecs.details.weightTooltip'),
              onTooltipChange
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="TC_Spec_Title"
            name="TC_Spec_Title"
            value={formData.TC_Spec_Title || ''}
            onChange={onChange}
            type="text"
            placeholder={t('tactiqueFormSpecs.details.titlePlaceholder')}
            label={createLabelWithHelp(
              t('tactiqueFormSpecs.details.titleLabel'),
              t('tactiqueFormSpecs.details.titleTooltip'),
              onTooltipChange
            )}
          />

          <FormInput
            id="TC_Spec_Text"
            name="TC_Spec_Text"
            value={formData.TC_Spec_Text || ''}
            onChange={onChange}
            type="text"
            placeholder={t('tactiqueFormSpecs.details.textPlaceholder')}
            label={createLabelWithHelp(
              t('tactiqueFormSpecs.details.textLabel'),
              t('tactiqueFormSpecs.details.textTooltip'),
              onTooltipChange
            )}
          />
        </div>

        <FormInput
          id="TC_Spec_SpecSheetLink"
          name="TC_Spec_SpecSheetLink"
          value={formData.TC_Spec_SpecSheetLink || ''}
          onChange={onChange}
          type="text"
          placeholder={t('tactiqueFormSpecs.details.specSheetLinkPlaceholder')}
          label={createLabelWithHelp(
            t('tactiqueFormSpecs.details.specSheetLinkLabel'),
            t('tactiqueFormSpecs.details.specSheetLinkTooltip'),
            onTooltipChange
          )}
        />

        <FormTextarea
          id="TC_Spec_Notes"
          name="TC_Spec_Notes"
          value={formData.TC_Spec_Notes || ''}
          onChange={onChange}
          rows={3}
          placeholder={t('tactiqueFormSpecs.details.notesPlaceholder')}
          label={createLabelWithHelp(
            t('tactiqueFormSpecs.details.notesLabel'),
            t('tactiqueFormSpecs.details.notesTooltip'),
            onTooltipChange
          )}
        />
      </FormSection>
    </div>
  );
}