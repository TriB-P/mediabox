// app/components/Tactiques/Placement/PlacementDrawer.tsx - VERSION SIMPLIFIÉE

/**
 * PlacementDrawer avec logique d'héritage de dates simplifiée.
 * Les valeurs héritées sont calculées à l'affichage et fusionnées au moment de la sauvegarde.
 */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import FormDrawer from '../FormDrawer';
import FormTabs, { FormTab } from '../FormTabs';
import PlacementFormInfo from './PlacementFormInfo';
import PlacementFormTaxonomy from './PlacementFormTaxonomy';
import { TooltipBanner } from '../Tactiques/TactiqueFormComponents';
import { DocumentTextIcon, TagIcon } from '@heroicons/react/24/outline';
import { Placement, PlacementFormData, Tactique } from '../../../types/tactiques';
import { useClient } from '../../../contexts/ClientContext';
import { useCampaignSelection } from '../../../hooks/useCampaignSelection';
import { createEmptyManualFieldsObject, extractManualFieldsFromData } from '../../../config/taxonomyFields';
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
  
  // Ref pour accéder aux valeurs actuellement affichées
  const formInfoRef = useRef<any>(null);

  const [formData, setFormData] = useState<PlacementFormData>(() => {
    const emptyManualFields = createEmptyManualFieldsObject();
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
      PL_Generated_Taxonomies: {},
      ...emptyManualFields,
    };
  });

  useEffect(() => {
    const emptyManualFields = createEmptyManualFieldsObject();
    if (placement) {
      // Mode édition - charger les données existantes
      const directTaxFields = {
        PL_Start_Date: placement.PL_Start_Date,
        PL_End_Date: placement.PL_End_Date,
        PL_Audience_Behaviour: placement.PL_Audience_Behaviour,
        PL_Audience_Demographics: placement.PL_Audience_Demographics,
        PL_Audience_Engagement: placement.PL_Audience_Engagement,
        PL_Audience_Interest: placement.PL_Audience_Interest,
        PL_Audience_Other: placement.PL_Audience_Other,
        PL_Creative_Grouping: placement.PL_Creative_Grouping,
        PL_Device: placement.PL_Device,
        PL_Market_Details: placement.PL_Market_Details,
        PL_Product: placement.PL_Product,
        PL_Segment_Open: placement.PL_Segment_Open,
        PL_Tactic_Category: placement.PL_Tactic_Category,
        PL_Targeting: placement.PL_Targeting,
        PL_Custom_Dim_1: placement.PL_Custom_Dim_1,
        PL_Custom_Dim_2: placement.PL_Custom_Dim_2,
        PL_Custom_Dim_3: placement.PL_Custom_Dim_3,
        PL_Channel: placement.PL_Channel,
        PL_Format: placement.PL_Format,
        PL_Language: placement.PL_Language,
        PL_Placement_Location: placement.PL_Placement_Location,
      };
      
      const taxFromTaxonomyValues: any = {};
      if (placement.PL_Taxonomy_Values) {
        Object.keys(placement.PL_Taxonomy_Values).forEach(key => {
          if (key.startsWith('PL_')) {
            const taxonomyValue = placement.PL_Taxonomy_Values![key];
            taxFromTaxonomyValues[key] = taxonomyValue.openValue || taxonomyValue.value || '';
          }
        });
      }
      
      const manualFieldsFromPlacement = extractManualFieldsFromData(placement);
      
      const finalTaxFields: any = {};
      [
        'PL_Start_Date',
        'PL_End_Date',
        'PL_Audience_Behaviour',
        'PL_Audience_Demographics',
        'PL_Audience_Engagement',
        'PL_Audience_Interest',
        'PL_Audience_Other',
        'PL_Creative_Grouping',
        'PL_Device',
        'PL_Market_Details',
        'PL_Product',
        'PL_Segment_Open',
        'PL_Tactic_Category',
        'PL_Targeting',
        'PL_Custom_Dim_1',
        'PL_Custom_Dim_2',
        'PL_Custom_Dim_3',
        'PL_Channel',
        'PL_Format',
        'PL_Language',
        'PL_Placement_Location'
      ].forEach(field => {
        finalTaxFields[field] = directTaxFields[field as keyof typeof directTaxFields] || 
                               taxFromTaxonomyValues[field] || 
                               '';
      });
      
      const newFormData = {
        PL_Label: placement.PL_Label || '',
        PL_Order: placement.PL_Order || 0,
        PL_TactiqueId: placement.PL_TactiqueId,
        PL_Taxonomy_Tags: placement.PL_Taxonomy_Tags || '',
        PL_Taxonomy_Platform: placement.PL_Taxonomy_Platform || '',
        PL_Taxonomy_MediaOcean: placement.PL_Taxonomy_MediaOcean || '',
        PL_Taxonomy_Values: placement.PL_Taxonomy_Values || {},
        PL_Generated_Taxonomies: placement.PL_Generated_Taxonomies || {},
        ...emptyManualFields,
        ...manualFieldsFromPlacement,
        ...finalTaxFields,
      };

      setFormData(newFormData);
    } else {
      // Mode création - initialiser avec valeurs vides (l'héritage se fait à l'affichage)
      setFormData({
        PL_Label: '', 
        PL_Order: 0,
        PL_TactiqueId: tactiqueId,
        PL_Start_Date: '',
        PL_End_Date: '',
        PL_Taxonomy_Tags: '',
        PL_Taxonomy_Platform: '', 
        PL_Taxonomy_MediaOcean: '',
        PL_Taxonomy_Values: {},
        PL_Generated_Taxonomies: {},
        ...emptyManualFields,
      });
    }
  }, [placement, tactiqueId]);

  const tabs: FormTab[] = [
    { id: 'infos', name: 'Informations', icon: DocumentTextIcon },
    { id: 'taxonomie', name: 'Taxonomie', icon: TagIcon }
  ];
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleTooltipChange = useCallback((tooltip: string | null) => {
    setActiveTooltip(tooltip);
  }, []);

  /**
   * Calcule les valeurs finales à sauvegarder en fusionnant formData avec les valeurs héritées affichées
   */
  const getFinalFormData = (): PlacementFormData => {
    const convertToDateString = (date: any): string => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toISOString().split('T')[0];
      return String(date);
    };

    // Calculer les valeurs héritées si les champs sont vides
    const inheritedStartDate = convertToDateString(
      tactiqueData?.TC_Start_Date || selectedCampaign?.CA_Start_Date
    );
    const inheritedEndDate = convertToDateString(
      tactiqueData?.TC_End_Date || selectedCampaign?.CA_End_Date
    );

    return {
      ...formData,
      PL_Start_Date: formData.PL_Start_Date || inheritedStartDate,
      PL_End_Date: formData.PL_End_Date || inheritedEndDate,
    };
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Fusionner avec les valeurs héritées avant sauvegarde
      const finalData = getFinalFormData();
      
      await onSave(finalData);
      onClose();
      
      // Lancer la mise à jour des taxonomies EN ARRIÈRE-PLAN
      if (placement && placement.id && selectedClient && selectedCampaign) {
        updateTaxonomiesAsync('placement', { 
          id: placement.id, 
          name: finalData.PL_Label,
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
            ref={formInfoRef}
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