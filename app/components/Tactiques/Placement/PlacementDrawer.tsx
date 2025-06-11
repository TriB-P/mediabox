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
import { createEmptyManualFieldsObject, extractManualFieldsFromData, getManualVariableNames } from '../../../config/taxonomyFields';

/**
 * 🔥 PLACEMENT DRAWER AVEC CHAMPS MANUELS DYNAMIQUES - VERSION CORRIGÉE
 * 
 * CORRECTION : Assure que les champs manuels modifiés dans TaxonomyFieldRenderer 
 * sont correctement sauvegardés comme propriétés indépendantes dans Firestore.
 */

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
  
  // ✅ VÉRIFICATION : Structure correcte pour PlacementFormData avec champs manuels dynamiques
  const [formData, setFormData] = useState<PlacementFormData>(() => {
    // 🔥 NOUVEAU : Utiliser les fonctions utilitaires pour initialiser les champs manuels
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
        PL_Order: placement.PL_Order || 0,
        PL_TactiqueId: placement.PL_TactiqueId,
        PL_Taxonomy_Tags: placement.PL_Taxonomy_Tags || '',
        PL_Taxonomy_Platform: placement.PL_Taxonomy_Platform || '',
        PL_Taxonomy_MediaOcean: placement.PL_Taxonomy_MediaOcean || '',
        PL_Taxonomy_Values: placement.PL_Taxonomy_Values || {},
        PL_Generated_Taxonomies: placement.PL_Generated_Taxonomies || {},
        
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
        PL_Order: 0,
        PL_TactiqueId: tactiqueId, 
        PL_Taxonomy_Tags: '',
        PL_Taxonomy_Platform: '', 
        PL_Taxonomy_MediaOcean: '',
        PL_Taxonomy_Values: {},
        PL_Generated_Taxonomies: {},
        
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
    campaignData: selectedCampaign,
    tactiqueData: tactiqueData,
  });

  // 🔥 CORRECTION : Sauvegarde corrigée pour les champs manuels
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('💾 PlacementDrawer - Début sauvegarde CORRIGÉE');
    console.log('📋 Données actuelles du formulaire:', formData);
    console.log('🏷️ Valeurs de taxonomie du hook:', taxonomyProps.taxonomyValues);
    
    // 🔥 CORRECTION : Obtenir la liste des variables manuelles depuis la config
    const manualVariableNames = getManualVariableNames();
    console.log('🔧 Variables manuelles disponibles:', manualVariableNames);
    
    // 🔥 CORRECTION : Créer un objet avec les champs manuels mis à jour
    const updatedManualFields: any = {};
    
    // Initialiser avec les valeurs actuelles du formulaire
    manualVariableNames.forEach(varName => {
      updatedManualFields[varName] = (formData as any)[varName] || '';
    });
    
    console.log('📊 Champs manuels actuels dans le formulaire:', updatedManualFields);
    
    // 🔥 CORRECTION : Transférer les valeurs depuis taxonomyValues vers les champs distincts
    Object.entries(taxonomyProps.taxonomyValues).forEach(([variableName, taxonomyValue]) => {
      // 🔥 CORRECTION : Vérifier si c'est une variable manuelle configurée
      if (manualVariableNames.includes(variableName)) {
        let finalValue = '';
        
        // Déterminer la valeur finale selon le format
        if (taxonomyValue.format === 'open' && taxonomyValue.openValue) {
          finalValue = taxonomyValue.openValue;
          console.log(`🔄 Transfer OPEN ${variableName}: "${finalValue}"`);
        } else if (taxonomyValue.value) {
          finalValue = taxonomyValue.value;
          console.log(`🔄 Transfer VALUE ${variableName}: "${finalValue}"`);
        } else if (taxonomyValue.shortcodeId) {
          // Pour les shortcodes, utiliser la valeur affichée
          finalValue = taxonomyValue.value || taxonomyValue.shortcodeId;
          console.log(`🔄 Transfer SHORTCODE ${variableName}: "${finalValue}" (ID: ${taxonomyValue.shortcodeId})`);
        }
        
        // Affecter la valeur au champ distinct
        updatedManualFields[variableName] = finalValue;
        
        console.log(`✅ ${variableName} transféré: "${finalValue}" (format: ${taxonomyValue.format})`);
      } else {
        console.log(`⚠️ ${variableName} n'est pas une variable manuelle configurée`);
      }
    });
    
    console.log('🎯 Champs manuels finaux:', updatedManualFields);
    
    // 🔥 CORRECTION : Construire les données finales avec les champs manuels corrigés
    const finalFormData: PlacementFormData = {
      ...formData,
      ...updatedManualFields, // 🔥 CORRECTION : Champs manuels mis à jour
      PL_Taxonomy_Values: taxonomyProps.taxonomyValues // ✅ IMPORTANT : Prendre les valeurs du hook
    };
    
    console.log('🎯 Données finales envoyées au service (avec champs manuels):', finalFormData);
    
    // 🔥 DEBUG : Vérifier spécifiquement TAX_Product
    if (finalFormData.TAX_Product) {
      console.log('🛍️ TAX_Product sera sauvegardé:', finalFormData.TAX_Product);
    } else {
      console.log('❌ TAX_Product est vide ou undefined');
    }
    
    try {
      await onSave(finalFormData);
      console.log('✅ PlacementDrawer - Sauvegarde réussie avec champs manuels');
      onClose();
    } catch (error) {
      console.error('❌ PlacementDrawer - Erreur sauvegarde:', error);
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
            {...taxonomyProps}
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