// app/components/Tactiques/PlacementDrawer.tsx

'use client';

import React, { useState, useCallback } from 'react';
import FormDrawer from '../FormDrawer';
import FormTabs, { FormTab } from '../FormTabs';
import PlacementFormInfo from './PlacementFormInfo';
import PlacementFormTaxonomy from './PlacementFormTaxonomy';
import { TooltipBanner } from '../Tactiques/TactiqueFormComponents';
import { DocumentTextIcon, PhotoIcon, ChartBarIcon, CurrencyDollarIcon, TagIcon } from '@heroicons/react/24/outline';
import { Placement, PlacementFormData } from '../../../types/tactiques';
import { useClient } from '../../../contexts/ClientContext';

interface PlacementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  placement?: Placement | null;
  tactiqueId: string;
  onSave: (placementData: PlacementFormData) => Promise<void>;
}

export default function PlacementDrawer({
  isOpen,
  onClose,
  placement,
  tactiqueId,
  onSave
}: PlacementDrawerProps) {
  const { selectedClient } = useClient();
  
  // État pour les onglets
  const [activeTab, setActiveTab] = useState('infos');
  
  // État pour les tooltips
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // État pour le formulaire avec les nouveaux champs
  const [formData, setFormData] = useState<PlacementFormData>({
    PL_Label: placement?.PL_Label || '',
    PL_Format: placement?.PL_Format || '',
    PL_Budget: placement?.PL_Budget || 0,
    PL_Order: placement?.PL_Order || 0,
    PL_TactiqueId: tactiqueId,
    
    // Champs de taxonomie existants (pour compatibilité)
    PL_Taxonomy_Tags: (placement as any)?.PL_Taxonomy_Tags || '',
    PL_Taxonomy_Platform: (placement as any)?.PL_Taxonomy_Platform || '',
    PL_Taxonomy_MediaOcean: (placement as any)?.PL_Taxonomy_MediaOcean || '',
    
    // Nouveaux champs de taxonomie dynamique
    PL_Taxonomy_Values: (placement as any)?.PL_Taxonomy_Values || {},
    PL_Generated_Taxonomies: (placement as any)?.PL_Generated_Taxonomies || {},
  });
  
  // Définition des onglets
  const tabs: FormTab[] = [
    { id: 'infos', name: 'Informations', icon: DocumentTextIcon },
    { id: 'taxonomie', name: 'Taxonomie', icon: TagIcon },
    { id: 'formats', name: 'Formats', icon: PhotoIcon },
    { id: 'kpis', name: 'KPIs', icon: ChartBarIcon },
    { id: 'budget', name: 'Budget', icon: CurrencyDollarIcon },
  ];
  
  // Gestionnaire de changement des champs
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  }, []);

  // Gestionnaire pour les tooltips
  const handleTooltipChange = useCallback((tooltip: string | null) => {
    setActiveTooltip(tooltip);
  }, []);
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };
  
  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 'infos':
        if (!selectedClient) {
          return (
            <div className="p-8">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                <p className="text-sm">
                  Veuillez sélectionner un client pour configurer les informations du placement.
                </p>
              </div>
            </div>
          );
        }
        
        return (
          <PlacementFormInfo
            formData={formData}
            onChange={handleChange}
            onTooltipChange={handleTooltipChange}
            clientId={selectedClient.clientId}
          />
        );
        
      case 'taxonomie':
        if (!selectedClient) {
          return (
            <div className="p-8">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                <p className="text-sm">
                  Veuillez sélectionner un client pour configurer les taxonomies du placement.
                </p>
              </div>
            </div>
          );
        }
        
        return (
          <PlacementFormTaxonomy
            formData={formData}
            onChange={handleChange}
            onTooltipChange={handleTooltipChange}
            clientId={selectedClient.clientId}
            // TODO: Ajouter campaignData et tactiqueData quand disponibles dans le contexte
            // campaignData={campaignData}
            // tactiqueData={tactiqueData}
          />
        );
      
      case 'formats':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Formats</h3>
            <p className="text-gray-500">Cette section sera implémentée ultérieurement.</p>
          </div>
        );
        
      case 'kpis':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">KPIs</h3>
            <p className="text-gray-500">Cette section sera implémentée ultérieurement.</p>
          </div>
        );
        
      case 'budget':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Budget</h3>
            <p className="text-gray-500">Cette section sera implémentée ultérieurement.</p>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={placement ? `Modifier le placement: ${placement.PL_Label}` : 'Nouveau placement'}
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Navigation par onglets */}
        <FormTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {/* Contenu de l'onglet actif */}
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
        
        {/* Footer avec les boutons d'action */}
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
      
      {/* Bandeau de tooltip */}
      <TooltipBanner tooltip={activeTooltip} />
    </FormDrawer>
  );
}