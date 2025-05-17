'use client';

import React, { useState } from 'react';
import FormDrawer from './FormDrawer';
import FormTabs, { FormTab } from './FormTabs';
import { DocumentTextIcon, PhotoIcon, LinkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { Creatif, CreatifFormData } from '../../types/tactiques';

interface CreatifDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  creatif?: Creatif | null;
  placementId: string;
  onSave: (creatifData: CreatifFormData) => Promise<void>;
}

export default function CreatifDrawer({
  isOpen,
  onClose,
  creatif,
  placementId,
  onSave
}: CreatifDrawerProps) {
  // État pour les onglets
  const [activeTab, setActiveTab] = useState('infos');
  
  // État pour le formulaire
  const [formData, setFormData] = useState<CreatifFormData>({
    CR_Label: '',
    CR_URL: '',
    CR_Order: 0,
    CR_PlacementId: placementId
  });
  
  // Définition des onglets
  const tabs: FormTab[] = [
    { id: 'infos', name: 'Informations', icon: DocumentTextIcon },
    { id: 'creative', name: 'Créatif', icon: PhotoIcon },
    { id: 'tracking', name: 'Tracking', icon: LinkIcon },
    { id: 'params', name: 'Paramètres', icon: AdjustmentsHorizontalIcon },
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du créatif</h3>
            <p className="text-gray-500">Cette section sera implémentée ultérieurement.</p>
          </div>
        );
      
      case 'creative':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fichier créatif</h3>
            <p className="text-gray-500">Cette section sera implémentée ultérieurement.</p>
          </div>
        );
        
      case 'tracking':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking</h3>
            <p className="text-gray-500">Cette section sera implémentée ultérieurement.</p>
          </div>
        );
        
      case 'params':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Paramètres</h3>
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
      title={creatif ? `Modifier le créatif: ${creatif.CR_Label}` : 'Nouveau créatif'}
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
              {creatif ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </form>
    </FormDrawer>
  );
}