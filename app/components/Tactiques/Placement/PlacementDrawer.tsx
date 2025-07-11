// app/components/Tactiques/Placement/PlacementDrawer.tsx - DEBUG

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  
  const [activeTab, setActiveTab] = useState('infos');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PlacementFormData>(() => {
    const emptyManualFields = createEmptyManualFieldsObject();
    return {
      PL_Label: '',
      PL_Order: 0,
      PL_TactiqueId: tactiqueId,
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
      console.log('🔍 === DEBUG PLACEMENT DRAWER ===');
      console.log('📦 Placement reçu:', placement);
      console.log('📋 Clés du placement:', Object.keys(placement));
      
      // Vérifier les champs TAX_ directement sur l'objet placement
      const directTaxFields = {
        TAX_Product: placement.TAX_Product,
        TAX_Audience_Demographics: placement.TAX_Audience_Demographics,
        TAX_Location: placement.TAX_Location,
        TAX_Device: placement.TAX_Device,
        TAX_Targeting: placement.TAX_Targeting
      };
      console.log('🏷️ Champs TAX_ directs:', directTaxFields);
      
      // Vérifier PL_Taxonomy_Values
      console.log('📊 PL_Taxonomy_Values:', placement.PL_Taxonomy_Values);
      
      // Extraire depuis PL_Taxonomy_Values si les champs directs sont vides
      const taxFromTaxonomyValues: any = {};
      if (placement.PL_Taxonomy_Values) {
        Object.keys(placement.PL_Taxonomy_Values).forEach(key => {
          if (key.startsWith('TAX_')) {
            const taxonomyValue = placement.PL_Taxonomy_Values![key];
            taxFromTaxonomyValues[key] = taxonomyValue.openValue || taxonomyValue.value || '';
            console.log(`🔄 Récupération ${key} depuis PL_Taxonomy_Values:`, taxFromTaxonomyValues[key]);
          }
        });
      }
      
      // Extraire les champs manuels
      const manualFieldsFromPlacement = extractManualFieldsFromData(placement);
      console.log('📋 Champs manuels extraits:', manualFieldsFromPlacement);
      
      // Priorité: champs directs > taxonomy values > vide
      const finalTaxFields: any = {};
      ['TAX_Product', 'TAX_Audience_Demographics', 'TAX_Location', 'TAX_Device', 'TAX_Targeting'].forEach(field => {
        finalTaxFields[field] = directTaxFields[field as keyof typeof directTaxFields] || 
                               taxFromTaxonomyValues[field] || 
                               '';
        console.log(`✅ ${field} final:`, finalTaxFields[field]);
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
      
      console.log('✅ FormData final après restauration:', newFormData);
      console.log('🎯 Champs TAX_ dans formData final:', {
        TAX_Product: newFormData.TAX_Product,
        TAX_Audience_Demographics: newFormData.TAX_Audience_Demographics,
        TAX_Location: newFormData.TAX_Location,
        TAX_Device: newFormData.TAX_Device,
        TAX_Targeting: newFormData.TAX_Targeting
      });
      console.log('🔍 === FIN DEBUG PLACEMENT DRAWER ===');
      
      setFormData(newFormData);
    } else {
      console.log('📝 Nouveau placement - formData vide');
      setFormData({
        PL_Label: '', 
        PL_Order: 0,
        PL_TactiqueId: tactiqueId, 
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
    console.log(`🔄 Changement de champ PlacementDrawer: ${name} =`, value);
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      console.log('📋 Nouveau formData après changement:', newData);
      return newData;
    });
  }, []);

  const handleTooltipChange = useCallback((tooltip: string | null) => {
    setActiveTooltip(tooltip);
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('💾 === SAUVEGARDE PLACEMENT ===');
      console.log('📤 FormData envoyé:', formData);
      console.log('🎯 Champs TAX_ envoyés:', {
        TAX_Product: formData.TAX_Product,
        TAX_Audience_Demographics: formData.TAX_Audience_Demographics,
        TAX_Location: formData.TAX_Location,
        TAX_Device: formData.TAX_Device,
        TAX_Targeting: formData.TAX_Targeting
      });
      console.log('💾 === FIN SAUVEGARDE PLACEMENT ===');
      
      await onSave(formData);
      onClose();
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
  );
}