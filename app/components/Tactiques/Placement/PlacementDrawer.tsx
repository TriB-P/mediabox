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
import { useTaxonomyForm } from '../../../hooks/useTaxonomyForm';
// 🔥 NOUVEAU : Import des fonctions utilitaires pour les champs manuels
import { createEmptyManualFieldsObject, extractManualFieldsFromData } from '../../../config/taxonomyFields';

/**
 * 🔥 PLACEMENT DRAWER AVEC CHAMPS MANUELS DYNAMIQUES
 * 
 * Ce composant gère maintenant automatiquement tous les champs manuels définis 
 * dans TAXONOMY_VARIABLE_CONFIG avec source: 'manual'. 
 * 
 * Fonctionnalités automatiques :
 * - Initialisation de tous les champs manuels (nouveau placement)
 * - Extraction des champs manuels (placement existant)  
 * - Sauvegarde des champs manuels vers Firestore
 * - Logs de debug pour tracer les valeurs
 * 
 * Pour ajouter un nouveau champ manuel :
 * 1. L'ajouter dans TAXONOMY_VARIABLE_CONFIG avec source: 'manual'
 * 2. L'ajouter dans les types Placement et PlacementFormData
 * 3. Il sera automatiquement géré par ce composant
 */

interface PlacementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  placement?: Placement | null;
  tactiqueId: string;
  tactiqueData?: Tactique; // ✅ VÉRIFICATION : Bien reçu pour les taxonomies
  onSave: (placementData: PlacementFormData) => Promise<void>; // ✅ VÉRIFICATION : Compatible avec placementService
}

export default function PlacementDrawer({
  isOpen,
  onClose,
  placement,
  tactiqueId,
  tactiqueData, // ✅ VÉRIFICATION : Utilisé pour le contexte taxonomie
  onSave
}: PlacementDrawerProps) {
  const { selectedClient } = useClient();
  const { selectedCampaign } = useCampaignSelection(); // ✅ VÉRIFICATION : Pour le contexte taxonomie
  
  const [activeTab, setActiveTab] = useState('infos');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // ✅ VÉRIFICATION : Structure correcte pour PlacementFormData avec champs manuels dynamiques
  const [formData, setFormData] = useState<PlacementFormData>(() => {
    // 🔥 NOUVEAU : Utiliser les fonctions utilitaires pour initialiser les champs manuels
    const emptyManualFields = createEmptyManualFieldsObject();
    
    return {
      PL_Label: '',
      // 🔥 SUPPRIMÉ : PL_Format et PL_Budget
      PL_Order: 0,
      PL_TactiqueId: tactiqueId,
      PL_Taxonomy_Tags: '',
      PL_Taxonomy_Platform: '',
      PL_Taxonomy_MediaOcean: '',
      PL_Taxonomy_Values: {}, // ✅ VÉRIFICATION : Initialisé comme objet vide
      PL_Generated_Taxonomies: {}, // ✅ VÉRIFICATION : Sera rempli par le service
      
      // 🔥 NOUVEAU : Tous les champs manuels initialisés automatiquement
      ...emptyManualFields
    };
  });

  // ✅ VÉRIFICATION : Charger les données existantes du placement avec champs manuels dynamiques
  useEffect(() => {
    if (placement) {
      // 🔥 NOUVEAU : Extraire automatiquement tous les champs manuels du placement
      const manualFieldsFromPlacement = extractManualFieldsFromData(placement);
      
      console.log('📋 Chargement placement existant:', placement.PL_Label);
      console.log('🔧 Champs manuels extraits:', manualFieldsFromPlacement);
      
      setFormData({
        PL_Label: placement.PL_Label || '',
        // 🔥 SUPPRIMÉ : PL_Format et PL_Budget
        PL_Order: placement.PL_Order || 0,
        PL_TactiqueId: placement.PL_TactiqueId,
        PL_Taxonomy_Tags: placement.PL_Taxonomy_Tags || '',
        PL_Taxonomy_Platform: placement.PL_Taxonomy_Platform || '',
        PL_Taxonomy_MediaOcean: placement.PL_Taxonomy_MediaOcean || '',
        PL_Taxonomy_Values: placement.PL_Taxonomy_Values || {}, // ✅ VÉRIFICATION : Récupéré depuis Firestore
        PL_Generated_Taxonomies: placement.PL_Generated_Taxonomies || {}, // ✅ VÉRIFICATION : Récupéré depuis Firestore
        
        // 🔥 NOUVEAU : Champs manuels extraits automatiquement
        ...manualFieldsFromPlacement
      });
    } else {
      // Reset pour un nouveau placement avec champs manuels vides
      const emptyManualFields = createEmptyManualFieldsObject();
      
      console.log('✨ Nouveau placement - initialisation avec champs manuels vides');
      console.log('🔧 Champs manuels initialisés:', emptyManualFields);
      
      setFormData({
        PL_Label: '', 
        // 🔥 SUPPRIMÉ : PL_Format et PL_Budget
        PL_Order: 0,
        PL_TactiqueId: tactiqueId, 
        PL_Taxonomy_Tags: '',
        PL_Taxonomy_Platform: '', 
        PL_Taxonomy_MediaOcean: '',
        PL_Taxonomy_Values: {}, // ✅ VÉRIFICATION : Objet vide pour nouveau placement
        PL_Generated_Taxonomies: {}, // ✅ VÉRIFICATION : Sera généré par le service
        
        // 🔥 NOUVEAU : Tous les champs manuels initialisés automatiquement
        ...emptyManualFields
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
  
  // ✅ VÉRIFICATION : Hook appelé avec le bon contexte pour les taxonomies
  const taxonomyProps = useTaxonomyForm({
    formData,
    onChange: handleChange,
    clientId: selectedClient?.clientId || '',
    campaignData: selectedCampaign, // ✅ VÉRIFICATION : Données de campagne pour résoudre les variables
    tactiqueData: tactiqueData, // ✅ VÉRIFICATION : Données de tactique pour résoudre les variables
  });

  // ✅ VÉRIFICATION : Sauvegarde compatible avec placementService
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('💾 PlacementDrawer - Début sauvegarde');
    console.log('📋 Données actuelles du formulaire:', formData);
    console.log('🏷️ Valeurs de taxonomie du hook:', taxonomyProps.taxonomyValues);
    
    // 🔥 NOUVEAU : Debug des champs manuels
    const manualFieldsInForm = extractManualFieldsFromData(formData);
    console.log('🔧 Champs manuels dans le formulaire:', manualFieldsInForm);
    
    // 🔥 NOUVEAU : Transférer les valeurs de taxonomie vers les champs distincts
    const updatedManualFields: any = { ...manualFieldsInForm };
    
    // Parcourir toutes les valeurs de taxonomie et les affecter aux champs distincts correspondants
    Object.entries(taxonomyProps.taxonomyValues).forEach(([variableName, taxonomyValue]) => {
      // Vérifier si cette variable correspond à un champ manuel distinct
      if (variableName in formData) {
        let finalValue = '';
        
        // Déterminer la valeur finale selon le format
        if (taxonomyValue.format === 'open' && taxonomyValue.openValue) {
          finalValue = taxonomyValue.openValue;
        } else if (taxonomyValue.value) {
          finalValue = taxonomyValue.value;
        }
        
        // Affecter la valeur au champ distinct
        updatedManualFields[variableName] = finalValue;
        
        console.log(`🔄 Transfert ${variableName}: "${finalValue}" (format: ${taxonomyValue.format})`);
      }
    });
    
    console.log('🎯 Champs manuels mis à jour:', updatedManualFields);
    
    // ✅ VÉRIFICATION : Intégrer les dernières valeurs de taxonomie ET les champs distincts
    const finalFormData: PlacementFormData = {
      ...formData,
      ...updatedManualFields, // 🔥 NOUVEAU : Champs manuels distincts mis à jour
      PL_Taxonomy_Values: taxonomyProps.taxonomyValues // ✅ IMPORTANT : Prendre les valeurs du hook
    };
    
    console.log('🎯 Données finales envoyées au service:', finalFormData);
    
    try {
      // ✅ VÉRIFICATION : onSave attend PlacementFormData, compatible avec placementService
      await onSave(finalFormData);
      console.log('✅ PlacementDrawer - Sauvegarde réussie');
      onClose();
    } catch (error) {
      console.error('❌ PlacementDrawer - Erreur sauvegarde:', error);
      // Ici on pourrait ajouter un état d'erreur si nécessaire
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
        
        // ✅ VÉRIFICATION : Passe toutes les props du hook au composant enfant
        return (
          <PlacementFormTaxonomy
            formData={formData}
            onChange={handleChange}
            onTooltipChange={handleTooltipChange}
            clientId={selectedClient.clientId}
            campaignData={selectedCampaign || undefined} // ✅ VÉRIFICATION : Pour le contexte
            tactiqueData={tactiqueData} // ✅ VÉRIFICATION : Pour le contexte
            {...taxonomyProps} // ✅ VÉRIFICATION : Toutes les valeurs et fonctions du hook
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