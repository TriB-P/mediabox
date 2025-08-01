// app/components/Tactiques/Creatif/CreatifDrawer.tsx

/**
 * Ce fichier définit le composant CreatifDrawer optimisé avec le système de cache.
 * OPTIMISÉ : Utilise directement le cacheService au lieu de dupliquer la logique.
 * Élimination des appels Firebase redondants et des imports dynamiques inutiles.
 * Version corrigée pour maximiser l'utilisation du cache localStorage.
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FormDrawer from '../FormDrawer';
import FormTabs, { FormTab } from '../FormTabs';
import CreatifFormInfo from './CreatifFormInfo';
import CreatifFormTaxonomy from './CreatifFormTaxonomy';
import CreatifFormSpecs from './CreatifFormSpecs';
import { TooltipBanner } from '../Tactiques/TactiqueFormComponents';
import { DocumentTextIcon, TagIcon, CogIcon } from '@heroicons/react/24/outline';
import { Creatif, CreatifFormData, Tactique, Placement } from '../../../types/tactiques';
import { useClient } from '../../../contexts/ClientContext';
import { useCampaignSelection } from '../../../hooks/useCampaignSelection';
import { createEmptyCreatifFieldsObject, extractCreatifFieldsFromData } from '../../../config/taxonomyFields';

// OPTIMISÉ : Import direct du cacheService optimisé
import { getListForClient } from '../../../lib/cacheService';

// OPTIMISÉ : Fonction utilitaire pour vérifier l'existence d'une liste depuis le cache
const hasCachedList = (fieldId: string, clientId: string): boolean => {
  try {
    const cachedList = getListForClient(fieldId, clientId);
    return cachedList !== null && cachedList.length > 0;
  } catch (error) {
    console.error(`[CACHE] Erreur vérification ${fieldId}:`, error);
    return false;
  }
};

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
  SH_Display_Name_EN?: string;
  SH_Default_UTM?: string;
  SH_Logo?: string;
  SH_Type?: string;
  SH_Tags?: string[];
}

interface CreatifDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  creatif?: Creatif | null;
  placementId: string;
  placementData?: Placement;
  tactiqueData?: Tactique;
  onSave: (creatifData: CreatifFormData) => Promise<void>;
}

/**
 * Composant principal du tiroir de formulaire pour les créatifs OPTIMISÉ.
 * Utilise le système de cache pour réduire drastiquement les appels Firebase.
 * @param {boolean} isOpen - Contrôle la visibilité du tiroir.
 * @param {() => void} onClose - Fonction pour fermer le tiroir.
 * @param {Creatif | null} [creatif] - L'objet créatif à modifier. Si null, le formulaire est en mode création.
 * @param {string} placementId - L'ID du placement auquel ce créatif est associé.
 * @param {Placement} [placementData] - Les données du placement parent.
 * @param {Tactique} [tactiqueData] - Les données de la tactique parente.
 * @param {(creatifData: CreatifFormData) => Promise<void>} onSave - Fonction de callback pour sauvegarder les données du créatif.
 * @returns {React.ReactElement} Le composant du tiroir de formulaire.
 */
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
  const [dynamicLists, setDynamicLists] = useState<{ [key: string]: ListItem[] }>({});
  const [visibleFields, setVisibleFields] = useState<{ [key: string]: boolean }>({});

  // OPTIMISÉ : Liste des champs dynamiques possibles pour les créatifs (mémorisée)
  const dynamicListFields = useMemo(() => [
    'CR_Custom_Dim_1', 
    'CR_Custom_Dim_2', 
    'CR_Custom_Dim_3', 
    'CR_CTA', 
    'CR_Format_Details', 
    'CR_Offer', 
    'CR_Plateform_Name', 
    'CR_Primary_Product', 
    'CR_URL', 
    'CR_Version', 
  ], []);

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
      // Nouveaux champs pour les specs
      CR_Spec_PartnerId: '',
      CR_Spec_SelectedSpecId: '',
      CR_Spec_Name: '',
      CR_Spec_Format: '',
      CR_Spec_Ratio: '',
      CR_Spec_FileType: '',
      CR_Spec_MaxWeight: '',
      CR_Spec_Weight: '',
      CR_Spec_Animation: '',
      CR_Spec_Title: '',
      CR_Spec_Text: '',
      CR_Spec_SpecSheetLink: '',
      CR_Spec_Notes: '',
      ...emptyCreatifFields,
    };
  });

  /**
   * OPTIMISÉ : Charge toutes les listes dynamiques nécessaires depuis le cache
   * Utilise la même logique uniforme que TactiqueDrawer
   */
  const loadAllData = useCallback(async () => {
    if (!selectedClient) return;

    try {
      
      // 1. Vérifier l'existence de toutes les listes dynamiques
      const newVisibleFields: { [key: string]: boolean } = {};
      for (const field of dynamicListFields) {
        const hasListResult = hasCachedList(field, selectedClient.clientId);
        newVisibleFields[field] = hasListResult;
      }
      
      setVisibleFields(newVisibleFields);

      // 2. Charger les listes qui existent
      const newDynamicLists: { [key: string]: ListItem[] } = {};
      for (const field of dynamicListFields) {
        if (newVisibleFields[field]) {
          const cachedList = getListForClient(field, selectedClient.clientId);
          
          if (cachedList && cachedList.length > 0) {
            // Conversion directe ShortcodeItem[] vers ListItem[]
            newDynamicLists[field] = cachedList.map(item => ({
              id: item.id,
              SH_Display_Name_FR: item.SH_Display_Name_FR,
              SH_Display_Name_EN: item.SH_Display_Name_EN,
              SH_Default_UTM: item.SH_Default_UTM,
              SH_Logo: item.SH_Logo,
              SH_Type: item.SH_Type,
              SH_Tags: item.SH_Tags
            }));
            
          }
        }
      }

      setDynamicLists(newDynamicLists);
      
      
    } catch (error) {
      console.error('[CACHE] Erreur lors du chargement optimisé:', error);
      setDynamicLists({});
      setVisibleFields({});
    }
  }, [selectedClient, dynamicListFields]);

  /**
   * Effet pour charger les données au montage du composant
   */
  useEffect(() => {
    if (isOpen && selectedClient) {
      loadAllData();
    }
  }, [isOpen, selectedClient, loadAllData]);

  /**
   * Effet pour initialiser ou mettre à jour les données du formulaire.
   * Si un objet `creatif` est fourni, le formulaire est peuplé avec ses données (mode édition).
   * Sinon, le formulaire est initialisé avec des valeurs par défaut pour un nouveau créatif (mode création).
   */
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
        // Champs specs depuis le créatif existant
        CR_Spec_PartnerId: (creatif as any).CR_Spec_PartnerId || '',
        CR_Spec_SelectedSpecId: (creatif as any).CR_Spec_SelectedSpecId || '',
        CR_Spec_Name: (creatif as any).CR_Spec_Name || '',
        CR_Spec_Format: (creatif as any).CR_Spec_Format || '',
        CR_Spec_Ratio: (creatif as any).CR_Spec_Ratio || '',
        CR_Spec_FileType: (creatif as any).CR_Spec_FileType || '',
        CR_Spec_MaxWeight: (creatif as any).CR_Spec_MaxWeight || '',
        CR_Spec_Weight: (creatif as any).CR_Spec_Weight || '',
        CR_Spec_Animation: (creatif as any).CR_Spec_Animation || '',
        CR_Spec_Title: (creatif as any).CR_Spec_Title || '',
        CR_Spec_Text: (creatif as any).CR_Spec_Text || '',
        CR_Spec_SpecSheetLink: (creatif as any).CR_Spec_SpecSheetLink || '',
        CR_Spec_Notes: (creatif as any).CR_Spec_Notes || '',
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
        // Champs specs vides pour nouveau créatif
        CR_Spec_PartnerId: '',
        CR_Spec_SelectedSpecId: '',
        CR_Spec_Name: '',
        CR_Spec_Format: '',
        CR_Spec_Ratio: '',
        CR_Spec_FileType: '',
        CR_Spec_MaxWeight: '',
        CR_Spec_Weight: '',
        CR_Spec_Animation: '',
        CR_Spec_Title: '',
        CR_Spec_Text: '',
        CR_Spec_SpecSheetLink: '',
        CR_Spec_Notes: '',
        ...emptyCreatifFields,
      });
    }
  }, [creatif, placementId]);

  const tabs: FormTab[] = [
    { id: 'infos', name: 'Informations', icon: DocumentTextIcon },
    { id: 'taxonomie', name: 'Taxonomie', icon: TagIcon },
    { id: 'specs', name: 'Specs', icon: CogIcon }
  ];

  /**
   * Met à jour l'état du formulaire lorsqu'un utilisateur modifie un champ.
   * Utilise `useCallback` pour la performance, en évitant de recréer la fonction à chaque rendu.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e - L'événement de changement.
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
   * Prévient le comportement par défaut, appelle la fonction `onSave` fournie par le parent,
   * puis ferme le tiroir.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du créatif:', error);
    }
  };

  /**
   * Rend le contenu de l'onglet actuellement sélectionné.
   * @returns {React.ReactNode} Le composant de formulaire correspondant à l'onglet actif.
   */
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

      case 'specs':
        if (!selectedClient) return null;
        return (
          <CreatifFormSpecs
            formData={formData}
            onChange={handleChange}
            onTooltipChange={handleTooltipChange}
            publishersList={dynamicLists.TC_Publisher || []}
            clientId={selectedClient.clientId}
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