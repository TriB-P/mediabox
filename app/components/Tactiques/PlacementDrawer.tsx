'use client';

import React, { useState } from 'react';
import FormDrawer from './FormDrawer';
import FormTabs, { FormTab } from './FormTabs';
import { DocumentTextIcon, PhotoIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Placement, PlacementFormData } from '../../types/tactiques';

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
  // État pour les onglets
  const [activeTab, setActiveTab] = useState('infos');
  
  // État pour le formulaire
  const [formData, setFormData] = useState<PlacementFormData>({
    PL_Label: '',
    PL_Format: '',
    PL_Budget: 0,
    PL_Order: 0,
    PL_TactiqueId: tactiqueId
  });
  
  // Définition des onglets
  const tabs: FormTab[] = [
    { id: 'infos', name: 'Informations', icon: DocumentTextIcon },
    { id: 'formats', name: 'Formats', icon: PhotoIcon },
    { id: 'kpis', name: 'KPIs', icon: ChartBarIcon },
    { id: 'budget', name: 'Budget', icon: CurrencyDollarIcon },
  ];
  
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
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du placement</h3>
            <p className="text-gray-500">Cette section sera implémentée ultérieurement.</p>
          </div>
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
      <form onSubmit={handleSubmit}>
        {/* Navigation par onglets */}
        <FormTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {/* Contenu de l'onglet actif */}
        {renderTabContent()}
        
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
    </FormDrawer>
  );
}