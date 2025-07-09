// app/components/Tactiques/Creatif/CreatifDrawer.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import FormDrawer from '../FormDrawer';
import FormTabs, { FormTab } from '../FormTabs';
import CreatifFormInfo from './CreatifFormInfo';
import CreatifFormTaxonomy from './CreatifFormTaxonomy';
import { TooltipBanner } from '../Tactiques/TactiqueFormComponents';
import { DocumentTextIcon, TagIcon } from '@heroicons/react/24/outline';
import { Creatif, CreatifFormData, Tactique, Placement } from '../../../types/tactiques';
import { useClient } from '../../../contexts/ClientContext';
import { useCampaignSelection } from '../../../hooks/useCampaignSelection';
import { createEmptyCreatifFieldsObject, extractCreatifFieldsFromData } from '../../../config/taxonomyFields';

interface CreatifDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  creatif?: Creatif | null;
  placementId: string;
  placementData?: Placement;
  tactiqueData?: Tactique;
  onSave: (creatifData: CreatifFormData) => Promise<void>;
}

export default function CreatifDrawer({
  isOpen,
  onClose,
  creatif,
  placementId,
  placementData,
  tactiqueData,
  onSave
}: CreatifDrawerProps) {
  const { selectedClient } = useClient();
  const { selectedCampaign } = useCampaignSelection();
  
  const [activeTab, setActiveTab] = useState('infos');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreatifFormData>(() => {
    const emptyCreatifFields = createEmptyCreatifFieldsObject();
    return {
      CR_Label: '',
      CR_Order: 0,
      CR_PlacementId: placementId,
      CR_Taxonomy_Tags: '',
      CR_Taxonomy_Platform: '',
      CR_Taxonomy_MediaOcean: '',
      CR_Taxonomy_Values: {},
      CR_Generated_Taxonomies: {},
      ...emptyCreatifFields,
    };
  });

  useEffect(() => {
    const emptyCreatifFields = createEmptyCreatifFieldsObject();
    if (creatif) {
      const creatifFieldsFromCreatif = extractCreatifFieldsFromData(creatif);
      setFormData({
        CR_Label: creatif.CR_Label || '',
        CR_Order: creatif.CR_Order || 0,
        CR_PlacementId: creatif.CR_PlacementId,
        CR_Taxonomy_Tags: creatif.CR_Taxonomy_Tags || '',
        CR_Taxonomy_Platform: creatif.CR_Taxonomy_Platform || '',
        CR_Taxonomy_MediaOcean: creatif.CR_Taxonomy_MediaOcean || '',
        CR_Taxonomy_Values: creatif.CR_Taxonomy_Values || {},
        CR_Generated_Taxonomies: creatif.CR_Generated_Taxonomies || {},
        ...emptyCreatifFields,
        ...creatifFieldsFromCreatif,
      });
    } else {
      setFormData({
        CR_Label: '', 
        CR_Order: 0,
        CR_PlacementId: placementId, 
        CR_Taxonomy_Tags: '',
        CR_Taxonomy_Platform: '', 
        CR_Taxonomy_MediaOcean: '',
        CR_Taxonomy_Values: {},
        CR_Generated_Taxonomies: {},
        ...emptyCreatifFields,
      });
    }
  }, [creatif, placementId]);

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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du créatif:', error);
    }
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'infos':
        if (!selectedClient) return null;
        return (
          <CreatifFormInfo
            formData={formData}
            onChange={handleChange}
            onTooltipChange={handleTooltipChange}
            clientId={selectedClient.clientId}
          />
        );
        
      case 'taxonomie':
        if (!selectedClient) return null;
        return (
          <CreatifFormTaxonomy
            formData={formData}
            onChange={handleChange}
            onTooltipChange={handleTooltipChange}
            clientId={selectedClient.clientId}
            campaignData={selectedCampaign || undefined}
            tactiqueData={tactiqueData}
            placementData={placementData}
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
      title={creatif ? `Modifier le créatif: ${formData.CR_Label}` : 'Nouveau créatif'}
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
              {creatif ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </form>
      <TooltipBanner tooltip={activeTooltip} />
    </FormDrawer>
  );
}