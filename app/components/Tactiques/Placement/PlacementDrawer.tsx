// app/components/Tactiques/Placement/PlacementDrawer.tsx - VERSION SIMPLIFIÉE AVEC STRINGS

/**
 * PlacementDrawer simplifié avec toutes les dates en string.
 * SIMPLIFICATION : Plus de conversion, tout en string maintenant
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import FormDrawer from '../FormDrawer';
import FormTabs, { FormTab } from '../FormTabs';
import PlacementFormInfo from './PlacementFormInfo';
import PlacementFormTaxonomy from './PlacementFormTaxonomy';
import PlacementFormTags from './PlacementFormTags';
import { TooltipBanner } from '../Tactiques/TactiqueFormComponents';
import { DocumentTextIcon, TagIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { Placement, PlacementFormData, Tactique } from '../../../types/tactiques';
import { useClient } from '../../../contexts/ClientContext';
import { useCampaignSelection } from '../../../hooks/useCampaignSelection';
import { createEmptyPlacementFieldsObject, extractPlacementFieldsFromData } from '../../../config/taxonomyFields';
import { useAsyncTaxonomyUpdate } from '../../../hooks/useAsyncTaxonomyUpdate';
import TaxonomyUpdateBanner from '../../Others/TaxonomyUpdateBanner';

interface PlacementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  placement?: Placement | null;
  tactiqueId: string;
  tactiqueData?: Tactique;
  onSave: (placementData: PlacementFormData) => Promise<void>;
}

export default function PlacementDrawer({
  isOpen,
  onClose,
  placement,
  tactiqueId,
  tactiqueData,
  onSave
}: PlacementDrawerProps) {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const { selectedCampaign } = useCampaignSelection();
  const { status, updateTaxonomiesAsync, dismissNotification } = useAsyncTaxonomyUpdate();

  const [activeTab, setActiveTab] = useState('infos');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  /**
   * 🔥 FONCTION SIMPLIFIÉE : Ajouter des jours à une date string
   */
  const addDaysToDateString = useCallback((dateStr: string, days: number): string => {
    
    if (!dateStr) {
      return '';
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    date.setDate(date.getDate() + days);
    const result = date.toISOString().split('T')[0];
    return result;
  }, []);

  /**
   * 🔥 FONCTION UTILITAIRE : Convertit Date ou string vers string
   */
  const dateToString = useCallback((date: Date | string | null | undefined): string => {
    
    if (!date) {
      return '';
    }
    
    // Si c'est déjà une string, la retourner
    if (typeof date === 'string') {
      return date;
    }
    
    // Si c'est un objet Date valide, le convertir
    if (date instanceof Date && !isNaN(date.getTime())) {
      const result = date.toISOString().split('T')[0];
      return result;
    }
    
    return '';
  }, []);

  /**
   * 🔥 FONCTION SIMPLIFIÉE : Récupère les dates héritées et les convertit en string
   */
  const getInheritedDates = useCallback(() => {
    
    
    // Convertir les dates (peuvent être Date ou string) vers string
    const startDate = dateToString(tactiqueData?.TC_Start_Date || selectedCampaign?.CA_Start_Date);
    const endDate = dateToString(tactiqueData?.TC_End_Date || selectedCampaign?.CA_End_Date);
    
    return { startDate, endDate };
  }, [tactiqueData, selectedCampaign, dateToString]);

  /**
   * 🔥 FONCTION SIMPLIFIÉE : Calcule les dates par défaut pour les tags
   */
  const getDefaultTagDates = useCallback((placementStartDate: string, placementEndDate: string) => {
    
    const tagStartDate = addDaysToDateString(placementStartDate, -30);
    const tagEndDate = addDaysToDateString(placementEndDate, 30);
    
    return { tagStartDate, tagEndDate };
  }, [addDaysToDateString]);

  // 🔥 ÉTAT DU FORMULAIRE SIMPLIFIÉ : Tout en string
  const [formData, setFormData] = useState<PlacementFormData>(() => {
    const emptyPlacementFields = createEmptyPlacementFieldsObject();
    
    const initialData: PlacementFormData = {
      PL_Label: '',
      PL_Order: 0,
      PL_TactiqueId: tactiqueId,
      PL_Start_Date: '', // String
      PL_End_Date: '',   // String
      PL_Taxonomy_Tags: '',
      PL_Taxonomy_Platform: '',
      PL_Taxonomy_MediaOcean: '',
      PL_Tag_Start_Date: '',
      PL_Tag_End_Date: '',
      PL_Tag_Type: '',
      PL_Third_Party_Measurement: false,
      PL_VPAID: true,
      PL_Creative_Rotation_Type: '',
      PL_Floodlight: '',
      ...emptyPlacementFields,
    };
    
    return initialData;
  });

 
  /**
   * 🔥 EFFET SIMPLIFIÉ : Initialisation du formulaire selon le mode (création/édition)
   */
  useEffect(() => {
    
    const emptyPlacementFields = createEmptyPlacementFieldsObject();
    
    if (placement) {
      // 🔥 MODE ÉDITION : Convertir les dates (Date ou string) vers string
      
      const placementFieldsFromPlacement = extractPlacementFieldsFromData(placement);
      const placementStartDate = dateToString(placement.PL_Start_Date);
      const placementEndDate = dateToString(placement.PL_End_Date);
      
      // Calculer les dates tags par défaut si elles ne sont pas définies
      const { tagStartDate, tagEndDate } = getDefaultTagDates(placementStartDate, placementEndDate);
      
      setFormData({
        PL_Label: placement.PL_Label || '',
        PL_Order: placement.PL_Order || 0,
        PL_TactiqueId: placement.PL_TactiqueId,
        PL_Start_Date: placementStartDate,
        PL_End_Date: placementEndDate,
        PL_Taxonomy_Tags: placement.PL_Taxonomy_Tags || '',
        PL_Taxonomy_Platform: placement.PL_Taxonomy_Platform || '',
        PL_Taxonomy_MediaOcean: placement.PL_Taxonomy_MediaOcean || '',
        // Nouveaux champs Tags - convertir les dates et utiliser les valeurs par défaut
        PL_Tag_Start_Date: dateToString(placement.PL_Tag_Start_Date) || tagStartDate,
        PL_Tag_End_Date: dateToString(placement.PL_Tag_End_Date) || tagEndDate,
        PL_Tag_Type: placement.PL_Tag_Type || '',
        PL_Third_Party_Measurement: placement.PL_Third_Party_Measurement ?? false,
        PL_VPAID: placement.PL_VPAID ?? true,
        PL_Creative_Rotation_Type: placement.PL_Creative_Rotation_Type || '',
        PL_Floodlight: placement.PL_Floodlight || '',
        ...emptyPlacementFields,
        ...placementFieldsFromPlacement,
      });
    } else {
      // 🔥 MODE CRÉATION : Utiliser les dates héritées
      
      const { startDate, endDate } = getInheritedDates();
      const { tagStartDate, tagEndDate } = getDefaultTagDates(startDate, endDate);
      
      setFormData({
        PL_Label: '',
        PL_Order: 0,
        PL_TactiqueId: tactiqueId,
        PL_Start_Date: startDate,
        PL_End_Date: endDate,
        PL_Taxonomy_Tags: '',
        PL_Taxonomy_Platform: '',
        PL_Taxonomy_MediaOcean: '',
        PL_Tag_Start_Date: tagStartDate,
        PL_Tag_End_Date: tagEndDate,
        PL_Tag_Type: '',
        PL_Third_Party_Measurement: false,
        PL_VPAID: true,
        PL_Creative_Rotation_Type: '',
        PL_Floodlight: '',
        ...emptyPlacementFields,
      });
    }
  }, [placement, tactiqueId, getInheritedDates, getDefaultTagDates, dateToString]);

  /**
   * 🔥 EFFET SIMPLIFIÉ : Recalculer les dates tags quand les dates placement changent
   */
  useEffect(() => {
    if (formData.PL_Start_Date && formData.PL_End_Date) {
      const { tagStartDate, tagEndDate } = getDefaultTagDates(formData.PL_Start_Date, formData.PL_End_Date);
      
      // Seulement mettre à jour si les champs tags sont vides
      setFormData(prev => ({
        ...prev,
        PL_Tag_Start_Date: prev.PL_Tag_Start_Date || tagStartDate,
        PL_Tag_End_Date: prev.PL_Tag_End_Date || tagEndDate,
      }));
    }
  }, [formData.PL_Start_Date, formData.PL_End_Date, getDefaultTagDates]);

  const tabs: FormTab[] = [
    { id: 'infos', name: t('placementDrawer.tabs.info'), icon: DocumentTextIcon },
    { id: 'taxonomie', name: t('placementDrawer.tabs.taxonomy'), icon: BookOpenIcon },
    { id: 'tags', name: t('placementDrawer.tabs.tags'), icon: TagIcon }
  ];

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    
    // Gérer les champs boolean
    if (name === 'PL_Third_Party_Measurement' || name === 'PL_VPAID') {
      const boolValue = value === 'true';
      setFormData(prev => ({ ...prev, [name]: boolValue }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleTooltipChange = useCallback((tooltip: string | null) => {
    setActiveTooltip(tooltip);
  }, []);

  /**
   * 🔥 FONCTION HANDLESUBMIT SIMPLIFIÉE : Plus de conversion nécessaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    try {
      // Plus besoin de conversion, tout est déjà en string
      await onSave(formData);
      onClose();

      // Lancer la mise à jour des taxonomies EN ARRIÈRE-PLAN
      if (placement && placement.id && selectedClient && selectedCampaign) {
        updateTaxonomiesAsync('placement', {
          id: placement.id,
          name: formData.PL_Label,
          clientId: selectedClient.clientId,
          campaignId: selectedCampaign.id
        }).catch(error => {
          console.error('Erreur mise à jour taxonomies placement:', error);
        });
      }

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du placement:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'infos':
        if (!selectedClient) return null;
        return (
          <PlacementFormInfo
            formData={formData}
            onChange={handleChange}
            onTooltipChange={handleTooltipChange}
            clientId={selectedClient.clientId}
            campaignData={selectedCampaign}
            tactiqueData={tactiqueData}
          />
        );

      case 'taxonomie':
        if (!selectedClient) return null;
        return (
          <PlacementFormTaxonomy
            formData={formData}
            onChange={handleChange}
            onTooltipChange={handleTooltipChange}
            clientId={selectedClient.clientId}
            campaignData={selectedCampaign || undefined}
            tactiqueData={tactiqueData}
          />
        );

      case 'tags':
        if (!selectedClient) return null;
        return (
          <PlacementFormTags
            formData={formData}
            onChange={handleChange}
            onTooltipChange={handleTooltipChange}
            clientId={selectedClient.clientId}
            campaignData={selectedCampaign || undefined}
            tactiqueData={tactiqueData}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <TaxonomyUpdateBanner
        status={status}
        onDismiss={dismissNotification}
      />
      
      <FormDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={placement ? t('placementDrawer.title.edit', { label: formData.PL_Label }) : t('placementDrawer.title.new')}
      >
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <FormTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className="flex-1 overflow-y-auto">
            {renderTabContent()}
          </div>
          <div className="sticky bottom-0 bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                {placement ? t('common.update') : t('common.create')}
              </button>
            </div>
          </div>
        </form>
        <TooltipBanner tooltip={activeTooltip} />
      </FormDrawer>
    </>
  );
}