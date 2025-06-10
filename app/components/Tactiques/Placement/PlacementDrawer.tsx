// app/components/Tactiques/Placement/PlacementDrawer.tsx

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
// 🔥 NOUVEAU: Import du hook que nous allons déplacer ici
import { useTaxonomyForm } from '../../../hooks/useTaxonomyForm';

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
  
  const [formData, setFormData] = useState<PlacementFormData>({
    PL_Label: '',
    PL_Format: '',
    PL_Budget: 0,
    PL_Order: 0,
    PL_TactiqueId: tactiqueId,
    PL_Taxonomy_Tags: '',
    PL_Taxonomy_Platform: '',
    PL_Taxonomy_MediaOcean: '',
    PL_Taxonomy_Values: {},
    PL_Generated_Taxonomies: {},
  });

  useEffect(() => {
    if (placement) {
      setFormData({
        PL_Label: placement.PL_Label || '',
        PL_Format: placement.PL_Format || '',
        PL_Budget: placement.PL_Budget || 0,
        PL_Order: placement.PL_Order || 0,
        PL_TactiqueId: placement.PL_TactiqueId,
        PL_Taxonomy_Tags: placement.PL_Taxonomy_Tags || '',
        PL_Taxonomy_Platform: placement.PL_Taxonomy_Platform || '',
        PL_Taxonomy_MediaOcean: placement.PL_Taxonomy_MediaOcean || '',
        PL_Taxonomy_Values: placement.PL_Taxonomy_Values || {},
        PL_Generated_Taxonomies: placement.PL_Generated_Taxonomies || {},
      });
    } else {
        // Reset pour un nouveau placement
        setFormData({
            PL_Label: '', PL_Format: '', PL_Budget: 0, PL_Order: 0,
            PL_TactiqueId: tactiqueId, PL_Taxonomy_Tags: '',
            PL_Taxonomy_Platform: '', PL_Taxonomy_MediaOcean: '',
            PL_Taxonomy_Values: {}, PL_Generated_Taxonomies: {}
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
  
  // 🔥 NOUVEAU: Le hook est maintenant appelé ici, au niveau supérieur.
  const taxonomyProps = useTaxonomyForm({
    formData,
    onChange: handleChange,
    clientId: selectedClient?.clientId || '',
    campaignData: selectedCampaign,
    tactiqueData: tactiqueData,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Intégrer les dernières valeurs de taxonomie au moment de la sauvegarde
    const finalFormData = {
      ...formData,
      PL_Taxonomy_Values: taxonomyProps.taxonomyValues
    };
    await onSave(finalFormData);
    onClose();
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
        
        // 🔥 MODIFIÉ: Passe toutes les props du hook au composant enfant
        return (
          <PlacementFormTaxonomy
            formData={formData}
            onChange={handleChange}
            onTooltipChange={handleTooltipChange}
            clientId={selectedClient.clientId}
            campaignData={selectedCampaign || undefined}
            tactiqueData={tactiqueData}
            {...taxonomyProps} // Passe toutes les valeurs et fonctions du hook
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
            <button type="button" onClick={onClose} className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              {placement ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </form>
      <TooltipBanner tooltip={activeTooltip} />
    </FormDrawer>
  );
}