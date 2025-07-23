/**
 * @file Ce fichier définit le composant PlacementDrawer.
 * Il s'agit d'un panneau latéral (drawer) utilisé pour créer et modifier des placements associés à une tactique.
 * Le composant gère un formulaire divisé en plusieurs onglets (Informations, Taxonomie),
 * l'état des données du formulaire, et la soumission pour sauvegarder les modifications.
 */

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

/**
 * Le composant principal pour le tiroir de création/modification d'un placement.
 * Il gère l'état du formulaire, les onglets, la validation et la communication
 * avec les hooks pour la sauvegarde des données et la mise à jour des taxonomies.
 * @param {PlacementDrawerProps} props - Les propriétés du composant.
 * @param {boolean} props.isOpen - Indique si le tiroir est ouvert ou fermé.
 * @param {() => void} props.onClose - Fonction pour fermer le tiroir.
 * @param {Placement | null} [props.placement] - Les données du placement à modifier. Si null, le formulaire est en mode création.
 * @param {string} props.tactiqueId - L'ID de la tactique parente.
 * @param {Tactique} [props.tactiqueData] - Les données de la tactique parente.
 * @param {(placementData: PlacementFormData) => Promise<void>} props.onSave - La fonction à appeler pour sauvegarder les données du placement.
 * @returns {React.ReactElement} Le tiroir de formulaire pour le placement.
 */
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

  /**
   * Effet pour initialiser ou mettre à jour les données du formulaire.
   * S'exécute lorsque le placement ou l'ID de la tactique change.
   * Si un placement est fourni, il remplit le formulaire avec ses données.
   * Sinon, il initialise un formulaire vide pour un nouveau placement.
   */
  useEffect(() => {
    const emptyManualFields = createEmptyManualFieldsObject();
    if (placement) {
      const directTaxFields = {
        TAX_Product: placement.TAX_Product,
        TAX_Audience_Demographics: placement.TAX_Audience_Demographics,
        TAX_Location: placement.TAX_Location,
        TAX_Device: placement.TAX_Device,
        TAX_Targeting: placement.TAX_Targeting
      };

      const taxFromTaxonomyValues: any = {};
      if (placement.PL_Taxonomy_Values) {
        Object.keys(placement.PL_Taxonomy_Values).forEach(key => {
          if (key.startsWith('TAX_')) {
            const taxonomyValue = placement.PL_Taxonomy_Values![key];
            taxFromTaxonomyValues[key] = taxonomyValue.openValue || taxonomyValue.value || '';
          }
        });
      }

      const manualFieldsFromPlacement = extractManualFieldsFromData(placement);

      const finalTaxFields: any = {};
      ['TAX_Product', 'TAX_Audience_Demographics', 'TAX_Location', 'TAX_Device', 'TAX_Targeting'].forEach(field => {
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

  /**
   * Gère les changements sur les champs du formulaire.
   * Met à jour l'état `formData` avec la nouvelle valeur.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e - L'événement de changement.
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      return newData;
    });
  }, []);

  /**
   * Met à jour l'état de l'infobulle active.
   * @param {string | null} tooltip - L'identifiant de l'infobulle à afficher, ou null pour la cacher.
   */
  const handleTooltipChange = useCallback((tooltip: string | null) => {
    setActiveTooltip(tooltip);
  }, []);

  /**
   * Gère la soumission du formulaire.
   * Appelle la fonction onSave pour persister les données, ferme le tiroir,
   * puis déclenche une mise à jour asynchrone des taxonomies pour les placements existants.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: PlacementDrawer.tsx - Fonction: handleSubmit - Path: placements/${placement?.id || 'new'}`);
      await onSave(formData);
      
      onClose();
      
      if (placement && placement.id && selectedClient && selectedCampaign) {
        console.log(`FIREBASE: ÉCRITURE - Fichier: PlacementDrawer.tsx - Fonction: handleSubmit - Path: placements/${placement.id}`);
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

  /**
   * Rend le contenu de l'onglet actuellement sélectionné.
   * @returns {React.ReactElement | null} Le composant de formulaire pour l'onglet actif.
   */
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