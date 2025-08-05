// app/components/Tactiques/Placement/PlacementDrawer.tsx - VERSION AVEC ONGLET TAGS

/**
 * PlacementDrawer avec ajout de l'onglet Tags.
 * Nouveaux champs : PL_Tag_Start_Date, PL_Tag_End_Date, TC_Tag_Type, TC_Third_Party_Measurement, TC_VPAID
 * Logique de calcul des dates par défaut : Start_Date - 30 jours, End_Date + 30 jours
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const { selectedClient } = useClient();
  const { selectedCampaign } = useCampaignSelection();
  const { status, updateTaxonomiesAsync, dismissNotification } = useAsyncTaxonomyUpdate();

  const [activeTab, setActiveTab] = useState('infos');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  /**
   * Fonction utilitaire pour convertir les dates en format string
   */
  const convertToDateString = useCallback((date: any): string => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    return String(date);
  }, []);

  /**
   * Fonction utilitaire pour ajouter ou soustraire des jours à une date
   */
  const addDaysToDate = useCallback((dateStr: string, days: number): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }, []);

  /**
   * Calcule les valeurs héritées pour les dates
   * Priorité : tactiqueData → selectedCampaign
   * Convertit les dates en strings au format ISO si nécessaire
   */
  const getInheritedDates = useCallback(() => {
    const startDate = convertToDateString(
      tactiqueData?.TC_Start_Date || selectedCampaign?.CA_Start_Date
    );
    const endDate = convertToDateString(
      tactiqueData?.TC_End_Date || selectedCampaign?.CA_End_Date
    );
    return { startDate, endDate };
  }, [tactiqueData, selectedCampaign, convertToDateString]);

  /**
   * Calcule les dates par défaut pour les tags
   * PL_Tag_Start_Date = PL_Start_Date - 30 jours
   * PL_Tag_End_Date = PL_End_Date + 30 jours
   */
  const getDefaultTagDates = useCallback((placementStartDate: string, placementEndDate: string) => {
    const tagStartDate = addDaysToDate(placementStartDate, -30);
    const tagEndDate = addDaysToDate(placementEndDate, 30);
    return { tagStartDate, tagEndDate };
  }, [addDaysToDate]);

  const [formData, setFormData] = useState<PlacementFormData>(() => {
    const emptyPlacementFields = createEmptyPlacementFieldsObject();
    return {
      PL_Label: '',
      PL_Order: 0,
      PL_TactiqueId: tactiqueId,
      PL_Start_Date: '',
      PL_End_Date: '',
      PL_Taxonomy_Tags: '',
      PL_Taxonomy_Platform: '',
      PL_Taxonomy_MediaOcean: '',
      PL_Taxonomy_Values: {},
      // Nouveaux champs Tags avec valeurs par défaut
      PL_Tag_Start_Date: '',
      PL_Tag_End_Date: '',
      TC_Tag_Type: '',
      TC_Third_Party_Measurement: false,
      TC_VPAID: true,
      ...emptyPlacementFields,
    };
  });

  useEffect(() => {
    // Réinitialiser l'onglet et le tooltip quand le drawer s'ouvre
    if (isOpen) {
      setActiveTab('infos');
      setActiveTooltip(null);
      
      // Si pas de placement (mode création), réinitialiser les données avec héritage
      if (!placement) {
        const emptyPlacementFields = createEmptyPlacementFieldsObject();
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
          // Nouveaux champs Tags avec valeurs par défaut
          PL_Tag_Start_Date: tagStartDate,
          PL_Tag_End_Date: tagEndDate,
          TC_Tag_Type: '',
          TC_Third_Party_Measurement: false,
          TC_VPAID: true,
          ...emptyPlacementFields,
        });
      }
    }
  }, [isOpen, placement, tactiqueId, getInheritedDates, getDefaultTagDates]);

  /**
   * Effet pour initialiser ou mettre à jour les données du formulaire.
   * Si un objet `placement` est fourni, le formulaire est peuplé avec ses données (mode édition).
   * Sinon, le formulaire est initialisé avec des valeurs par défaut pour un nouveau placement (mode création).
   */
  useEffect(() => {
    const emptyPlacementFields = createEmptyPlacementFieldsObject();
    if (placement) {
      // Mode édition - utiliser la même logique simple que CreatifDrawer
      const placementFieldsFromPlacement = extractPlacementFieldsFromData(placement);
      const placementStartDate = convertToDateString(placement.PL_Start_Date);
      const placementEndDate = convertToDateString(placement.PL_End_Date);
      
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
        // Nouveaux champs Tags - utiliser les valeurs existantes ou les valeurs par défaut
        PL_Tag_Start_Date: convertToDateString(placement.PL_Tag_Start_Date) || tagStartDate,
        PL_Tag_End_Date: convertToDateString(placement.PL_Tag_End_Date) || tagEndDate,
        TC_Tag_Type: placement.TC_Tag_Type || '',
        TC_Third_Party_Measurement: placement.TC_Third_Party_Measurement ?? false,
        TC_VPAID: placement.TC_VPAID ?? true,
        ...emptyPlacementFields,
        ...placementFieldsFromPlacement,
      });
    } else {
      // Nouveau placement - calculer les valeurs héritées
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
        // Nouveaux champs Tags avec valeurs par défaut
        PL_Tag_Start_Date: tagStartDate,
        PL_Tag_End_Date: tagEndDate,
        TC_Tag_Type: '',
        TC_Third_Party_Measurement: false,
        TC_VPAID: true,
        ...emptyPlacementFields,
      });
    }
  }, [placement, tactiqueId, getInheritedDates, getDefaultTagDates, convertToDateString]);

  // useEffect séparé pour réinitialiser les valeurs héritées quand les données sources changent
  useEffect(() => {
    // Seulement pour un nouveau placement (pas d'édition)
    if (!placement && (tactiqueData || selectedCampaign)) {
      const { startDate, endDate } = getInheritedDates();
      const { tagStartDate, tagEndDate } = getDefaultTagDates(startDate, endDate);
      
      setFormData(prev => ({
        ...prev,
        PL_Start_Date: prev.PL_Start_Date || startDate,
        PL_End_Date: prev.PL_End_Date || endDate,
        PL_Tag_Start_Date: prev.PL_Tag_Start_Date || tagStartDate,
        PL_Tag_End_Date: prev.PL_Tag_End_Date || tagEndDate,
      }));
    }
  }, [tactiqueData, selectedCampaign, placement, getInheritedDates, getDefaultTagDates]);

  // useEffect pour recalculer les dates tags quand les dates placement changent
  useEffect(() => {
    if (formData.PL_Start_Date && formData.PL_End_Date) {
      const { tagStartDate, tagEndDate } = getDefaultTagDates(formData.PL_Start_Date, formData.PL_End_Date);
      
      // Seulement mettre à jour si les champs tags sont vides ou correspondent aux anciennes valeurs calculées
      setFormData(prev => ({
        ...prev,
        PL_Tag_Start_Date: prev.PL_Tag_Start_Date || tagStartDate,
        PL_Tag_End_Date: prev.PL_Tag_End_Date || tagEndDate,
      }));
    }
  }, [formData.PL_Start_Date, formData.PL_End_Date, getDefaultTagDates]);

  const tabs: FormTab[] = [
    { id: 'infos', name: 'Informations', icon: DocumentTextIcon },
    { id: 'taxonomie', name: 'Taxonomie', icon: BookOpenIcon },
    { id: 'tags', name: 'Tags', icon: TagIcon }
  ];

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Gérer les champs boolean
    if (name === 'TC_Third_Party_Measurement' || name === 'TC_VPAID') {
      const boolValue = value === 'true';
      setFormData(prev => ({ ...prev, [name]: boolValue }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleTooltipChange = useCallback((tooltip: string | null) => {
    setActiveTooltip(tooltip);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
        title={placement ? `Modifier le placement: ${formData.PL_Label}` : 'Nouveau placement'}
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
                Annuler
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                {placement ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </form>
        <TooltipBanner tooltip={activeTooltip} />
      </FormDrawer>
    </>
  );
}