// app/components/Tactiques/Creatif/CreatifFormSpecs.tsx

/**
 * Ce fichier contient le composant CreatifFormSpecs pour gérer les spécifications
 * techniques dans le formulaire de créatif. Il permet de sélectionner un partenaire,
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
} from '../Tactiques/TactiqueFormComponents';
import { getPartnerSpecs, Spec } from '../../../lib/specService';
import { ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../../contexts/LanguageContext';

interface ListItem {
  id: string;
  SH_Display_Name_EN: string;
}

interface CreatifFormSpecsProps {
  formData: {
    CR_Spec_PartnerId?: string;
    CR_Spec_SelectedSpecId?: string;
    CR_Spec_Name?: string;
    CR_Spec_Format?: string;
    CR_Spec_Ratio?: string;
    CR_Spec_FileType?: string;
    CR_Spec_MaxWeight?: string;
    CR_Spec_Weight?: string;
    CR_Spec_Animation?: string;
    CR_Spec_Title?: string;
    CR_Spec_Text?: string;
    CR_Spec_SpecSheetLink?: string;
    CR_Spec_Notes?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  publishersList: ListItem[];
  clientId: string;
}

/**
 * Composant pour gérer les spécifications techniques du créatif
 * @param formData - Les données du formulaire incluant les champs de specs
 * @param onChange - Fonction de callback pour les changements de champs
 * @param onTooltipChange - Fonction pour gérer l'affichage des tooltips
 * @param publishersList - Liste des partenaires disponibles
 * @param clientId - ID du client pour les requêtes Firebase
 */
export default function CreatifFormSpecs({
  formData,
  onChange,
  onTooltipChange,
  publishersList,
  clientId
}: CreatifFormSpecsProps) {
  
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
    if (formData.CR_Spec_PartnerId) {
      loadPartnerSpecs(formData.CR_Spec_PartnerId);
    } else {
      setPartnerSpecs([]);
      setSelectedSpecData(null);
    }
  }, [formData.CR_Spec_PartnerId, loadPartnerSpecs]);

  /**
   * Effet pour initialiser selectedSpecData quand on a une spec sélectionnée et que les specs sont chargées
   */
  useEffect(() => {
    if (formData.CR_Spec_SelectedSpecId && partnerSpecs.length > 0) {
      const selectedSpec = partnerSpecs.find(spec => spec.id === formData.CR_Spec_SelectedSpecId);
      if (selectedSpec) {
        setSelectedSpecData(selectedSpec);
      }
    } else if (!formData.CR_Spec_SelectedSpecId) {
      setSelectedSpecData(null);
    }
  }, [formData.CR_Spec_SelectedSpecId, partnerSpecs]);

  /**
   * Gère la sélection d'un partenaire
   */
  const handlePartnerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const partnerId = e.target.value;
    
    // Réinitialiser les specs et les champs quand on change de partenaire
    onChange({
      target: { name: 'CR_Spec_PartnerId', value: partnerId }
    } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    
    // Vider la spec sélectionnée et tous les champs
    const fieldsToReset = [
      'CR_Spec_SelectedSpecId', 'CR_Spec_Name', 'CR_Spec_Format', 'CR_Spec_Ratio',
      'CR_Spec_FileType', 'CR_Spec_MaxWeight', 'CR_Spec_Weight', 'CR_Spec_Animation',
      'CR_Spec_Title', 'CR_Spec_Text', 'CR_Spec_SpecSheetLink', 'CR_Spec_Notes'
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
      target: { name: 'CR_Spec_SelectedSpecId', value: specId }
    } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);

    if (specId) {
      const selectedSpec = partnerSpecs.find(spec => spec.id === specId);
      if (selectedSpec) {
        setSelectedSpecData(selectedSpec);
        
        // Auto-remplir tous les champs
        const specFields = {
          CR_Spec_Name: selectedSpec.name,
          CR_Spec_Format: selectedSpec.format,
          CR_Spec_Ratio: selectedSpec.ratio,
          CR_Spec_FileType: selectedSpec.fileType,
          CR_Spec_MaxWeight: selectedSpec.maxWeight,
          CR_Spec_Weight: selectedSpec.weight,
          CR_Spec_Animation: selectedSpec.animation,
          CR_Spec_Title: selectedSpec.title,
          CR_Spec_Text: selectedSpec.text,
          CR_Spec_SpecSheetLink: selectedSpec.specSheetLink,
          CR_Spec_Notes: selectedSpec.notes
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
        CR_Spec_Name: selectedSpecData.name,
        CR_Spec_Format: selectedSpecData.format,
        CR_Spec_Ratio: selectedSpecData.ratio,
        CR_Spec_FileType: selectedSpecData.fileType,
        CR_Spec_MaxWeight: selectedSpecData.maxWeight,
        CR_Spec_Weight: selectedSpecData.weight,
        CR_Spec_Animation: selectedSpecData.animation,
        CR_Spec_Title: selectedSpecData.title,
        CR_Spec_Text: selectedSpecData.text,
        CR_Spec_SpecSheetLink: selectedSpecData.specSheetLink,
        CR_Spec_Notes: selectedSpecData.notes
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
        title={t('creatifFormSpecs.selection.title')}
        description={t('creatifFormSpecs.selection.description')}
      >
        <SmartSelect
          id="CR_Spec_PartnerId"
          name="CR_Spec_PartnerId"
          value={formData.CR_Spec_PartnerId || ''}
          onChange={handlePartnerChange}
          options={publishersList.map(publisher => ({
            id: publisher.id,
            label: publisher.SH_Display_Name_EN
          }))}
          placeholder={t('creatifFormSpecs.selection.partnerPlaceholder')}
          label={createLabelWithHelp(
            t('creatifFormSpecs.selection.partnerLabel'),
            t('creatifFormSpecs.selection.partnerTooltip'),
            onTooltipChange
          )}
        />

        {formData.CR_Spec_PartnerId && (
          <>
            {partnerSpecs.length > 0 ? (
              <SmartSelect
                id="CR_Spec_SelectedSpecId"
                name="CR_Spec_SelectedSpecId"
                value={formData.CR_Spec_SelectedSpecId || ''}
                onChange={handleSpecChange}
                options={partnerSpecs.map(spec => ({
                  id: spec.id,
                  label: spec.name
                }))}
                placeholder={loading ? t('creatifFormSpecs.selection.specLoadingPlaceholder') : t('creatifFormSpecs.selection.specSelectPlaceholder')}
                label={createLabelWithHelp(
                  t('creatifFormSpecs.selection.specLabel'),
                  t('creatifFormSpecs.selection.specTooltip'),
                  onTooltipChange
                )}
              />
            ) : !loading && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  {t('creatifFormSpecs.selection.noSpecs')}
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
                {t('creatifFormSpecs.selection.specPrefix')} "{selectedSpecData.name}" {t('creatifFormSpecs.selection.specSuffix')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              {t('creatifFormSpecs.selection.resetButton')}
            </button>
          </div>
        )}
      </FormSection>

      <FormSection
        title={t('creatifFormSpecs.details.title')}
        description={t('creatifFormSpecs.details.description')}
      >
        <FormInput
          id="CR_Spec_Name"
          name="CR_Spec_Name"
          value={formData.CR_Spec_Name || ''}
          onChange={onChange}
          type="text"
          placeholder={t('creatifFormSpecs.details.namePlaceholder')}
          label={createLabelWithHelp(
            t('creatifFormSpecs.details.nameLabel'),
            t('creatifFormSpecs.details.nameTooltip'),
            onTooltipChange
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="CR_Spec_Format"
            name="CR_Spec_Format"
            value={formData.CR_Spec_Format || ''}
            onChange={onChange}
            type="text"
            placeholder={t('creatifFormSpecs.details.formatPlaceholder')}
            label={createLabelWithHelp(
              t('creatifFormSpecs.details.formatLabel'),
              t('creatifFormSpecs.details.formatTooltip'),
              onTooltipChange
            )}
          />

          <FormInput
            id="CR_Spec_Ratio"
            name="CR_Spec_Ratio"
            value={formData.CR_Spec_Ratio || ''}
            onChange={onChange}
            type="text"
            placeholder={t('creatifFormSpecs.details.ratioPlaceholder')}
            label={createLabelWithHelp(
              t('creatifFormSpecs.details.ratioLabel'),
              t('creatifFormSpecs.details.ratioTooltip'),
              onTooltipChange
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="CR_Spec_FileType"
            name="CR_Spec_FileType"
            value={formData.CR_Spec_FileType || ''}
            onChange={onChange}
            type="text"
            placeholder={t('creatifFormSpecs.details.fileTypePlaceholder')}
            label={createLabelWithHelp(
              t('creatifFormSpecs.details.fileTypeLabel'),
              t('creatifFormSpecs.details.fileTypeTooltip'),
              onTooltipChange
            )}
          />

          <FormInput
            id="CR_Spec_Animation"
            name="CR_Spec_Animation"
            value={formData.CR_Spec_Animation || ''}
            onChange={onChange}
            type="text"
            placeholder={t('creatifFormSpecs.details.animationPlaceholder')}
            label={createLabelWithHelp(
              t('creatifFormSpecs.details.animationLabel'),
              t('creatifFormSpecs.details.animationTooltip'),
              onTooltipChange
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="CR_Spec_MaxWeight"
            name="CR_Spec_MaxWeight"
            value={formData.CR_Spec_MaxWeight || ''}
            onChange={onChange}
            type="text"
            placeholder={t('creatifFormSpecs.details.maxWeightPlaceholder')}
            label={createLabelWithHelp(
              t('creatifFormSpecs.details.maxWeightLabel'),
              t('creatifFormSpecs.details.maxWeightTooltip'),
              onTooltipChange
            )}
          />

          <FormInput
            id="CR_Spec_Weight"
            name="CR_Spec_Weight"
            value={formData.CR_Spec_Weight || ''}
            onChange={onChange}
            type="text"
            placeholder={t('creatifFormSpecs.details.weightPlaceholder')}
            label={createLabelWithHelp(
              t('creatifFormSpecs.details.weightLabel'),
              t('creatifFormSpecs.details.weightTooltip'),
              onTooltipChange
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="CR_Spec_Title"
            name="CR_Spec_Title"
            value={formData.CR_Spec_Title || ''}
            onChange={onChange}
            type="text"
            placeholder={t('creatifFormSpecs.details.titlePlaceholder')}
            label={createLabelWithHelp(
              t('creatifFormSpecs.details.titleLabel'),
              t('creatifFormSpecs.details.titleTooltip'),
              onTooltipChange
            )}
          />

          <FormInput
            id="CR_Spec_Text"
            name="CR_Spec_Text"
            value={formData.CR_Spec_Text || ''}
            onChange={onChange}
            type="text"
            placeholder={t('creatifFormSpecs.details.textPlaceholder')}
            label={createLabelWithHelp(
              t('creatifFormSpecs.details.textLabel'),
              t('creatifFormSpecs.details.textTooltip'),
              onTooltipChange
            )}
          />
        </div>

        <FormInput
          id="CR_Spec_SpecSheetLink"
          name="CR_Spec_SpecSheetLink"
          value={formData.CR_Spec_SpecSheetLink || ''}
          onChange={onChange}
          type="text"
          placeholder={t('creatifFormSpecs.details.specSheetLinkPlaceholder')}
          label={createLabelWithHelp(
            t('creatifFormSpecs.details.specSheetLinkLabel'),
            t('creatifFormSpecs.details.specSheetLinkTooltip'),
            onTooltipChange
          )}
        />

        <FormTextarea
          id="CR_Spec_Notes"
          name="CR_Spec_Notes"
          value={formData.CR_Spec_Notes || ''}
          onChange={onChange}
          rows={3}
          placeholder={t('creatifFormSpecs.details.notesPlaceholder')}
          label={createLabelWithHelp(
            t('creatifFormSpecs.details.notesLabel'),
            t('creatifFormSpecs.details.notesTooltip'),
            onTooltipChange
          )}
        />
      </FormSection>
    </div>
  );
}