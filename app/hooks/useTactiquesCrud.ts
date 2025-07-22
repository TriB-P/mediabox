// app/hooks/useTactiquesCrud.ts - Version corrigée

import { useCallback } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { Section, Tactique, Placement, Creatif } from '../types/tactiques';

// 🔥 IMPORTS DE VOS VRAIES FONCTIONS
import {
  addSection,
  updateSection,
  deleteSection,
  addTactique,
  updateTactique,
  deleteTactique,
  addOnglet,
  updateOnglet,
  deleteOnglet
} from '../lib/tactiqueService';

import {
  createPlacement,
  updatePlacement,
  deletePlacement
} from '../lib/placementService';

import {
  createCreatif,
  updateCreatif,
  deleteCreatif
} from '../lib/creatifService';

// ==================== TYPES ====================

interface UseTactiquesCrudProps {
  sections: any[];
  tactiques: { [sectionId: string]: any[] };
  placements: { [tactiqueId: string]: any[] };
  creatifs: { [placementId: string]: any[] };
  selectedCampaign: any;
  onglets: any[];
  onRefresh: (() => Promise<void>) | (() => void);
}

// ==================== HOOK PRINCIPAL ====================

export function useTactiquesCrud({
  sections,
  tactiques,
  placements,
  creatifs,
  selectedCampaign,
  onglets,
  onRefresh
}: UseTactiquesCrudProps) {

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  // ==================== FONCTIONS SECTION (INCHANGÉES) ====================
  
  const handleCreateSection = useCallback(async (sectionData: any) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer une section');
    }

    try {
      console.log('🔄 Création section...');
      
      const newSectionId = await addSection(
        selectedClient.clientId,
        selectedCampaignId, 
        selectedVersionId,
        selectedOngletId,
        {
          SECTION_Name: sectionData.SECTION_Name || 'Nouvelle section',
          SECTION_Order: sections.length,
          SECTION_Color: sectionData.SECTION_Color || '#6366f1',
          SECTION_Budget: sectionData.SECTION_Budget || 0
        }
      );
      
      console.log('✅ Section créée:', newSectionId);
      return newSectionId;
    } catch (error) {
      console.error('❌ Erreur création section:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections.length]);

  const handleUpdateSection = useCallback(async (sectionId: string, sectionData: any) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour modifier une section');
    }

    try {
      console.log('🔄 Modification section...');
      
      await updateSection(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        sectionData
      );
      
      console.log('✅ Section modifiée');
    } catch (error) {
      console.error('❌ Erreur modification section:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId]);

  const handleDeleteSection = useCallback(async (sectionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette section ? Cette action est irréversible.')) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer une section');
    }

    try {
      console.log('🔄 Suppression section...');
      
      await deleteSection(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId
      );
      
      console.log('✅ Section supprimée');
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur suppression section:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh]);

  // ==================== FONCTIONS TACTIQUE (INCHANGÉES) ====================
  
  const handleCreateTactique = useCallback(async (sectionId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer une tactique');
    }

    try {
      console.log('🔄 Création tactique...');
      
      const sectionTactiques = tactiques[sectionId] || [];
      
      const newTactiqueId = await addTactique(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        {
          TC_Label: 'Nouvelle tactique',
          TC_Budget: 0,
          TC_Order: sectionTactiques.length,
          TC_SectionId: sectionId,
          TC_Unit_Type: '',
        }
      );
      
      console.log('✅ Tactique créée:', newTactiqueId);
      
      const newTactique: Tactique = {
        id: newTactiqueId,
        TC_Label: 'Nouvelle tactique',
        TC_Budget: 0,
        TC_Order: sectionTactiques.length,
        TC_SectionId: sectionId,
        TC_Unit_Type: '',
      };
      
      return newTactique;
    } catch (error) {
      console.error('❌ Erreur création tactique:', error);
      return {} as Tactique;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, tactiques]);

  const handleUpdateTactique = useCallback(async (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour modifier une tactique');
    }

    try {
      console.log('🔄 Modification tactique...');
      
      await updateTactique(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        data
      );
      
      console.log('✅ Tactique modifiée');
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur modification tactique:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh]);

  const handleDeleteTactique = useCallback(async (sectionId: string, tactiqueId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tactique ? Cette action est irréversible.')) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer une tactique');
    }

    try {
      console.log('🔄 Suppression tactique...');
      
      await deleteTactique(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId
      );
      
      console.log('✅ Tactique supprimée');
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur suppression tactique:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh]);

  // ==================== FONCTIONS PLACEMENT (INCHANGÉES) ====================
  
  const handleCreatePlacement = useCallback(async (tactiqueId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer un placement');
    }

    let sectionId = '';
    for (const section of sections) {
      if (tactiques[section.id]?.some(t => t.id === tactiqueId)) {
        sectionId = section.id;
        break;
      }
    }

    if (!sectionId) {
      throw new Error('Section parent non trouvée pour la tactique');
    }

    try {
      console.log('🔄 Création placement...');
      
      const tactiquesPlacements = placements[tactiqueId] || [];
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      
      const newPlacementId = await createPlacement(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        {
          PL_Label: 'Nouveau placement',
          PL_Order: tactiquesPlacements.length,
          PL_TactiqueId: tactiqueId,
          PL_Taxonomy_Tags: '',
          PL_Taxonomy_Platform: '',
          PL_Taxonomy_MediaOcean: '',
          PL_Taxonomy_Values: {}
        },
        selectedCampaign,
        currentTactique
      );
      
      console.log('✅ Placement créé:', newPlacementId);
      
      const newPlacement: Placement = {
        id: newPlacementId,
        PL_Label: 'Nouveau placement',
        PL_Order: tactiquesPlacements.length,
        PL_TactiqueId: tactiqueId,
        PL_Taxonomy_Tags: '',
        PL_Taxonomy_Platform: '',
        PL_Taxonomy_MediaOcean: '',
        PL_Taxonomy_Values: {}
      };
      
      return newPlacement;
    } catch (error) {
      console.error('❌ Erreur création placement:', error);
      return {} as Placement;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, placements, selectedCampaign]);

  const handleUpdatePlacement = useCallback(async (placementId: string, data: Partial<Placement>) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour modifier un placement');
    }

    let sectionId = '';
    let tactiqueId = '';
    
    for (const section of sections) {
      for (const tactique of (tactiques[section.id] || [])) {
        if (placements[tactique.id]?.some(p => p.id === placementId)) {
          sectionId = section.id;
          tactiqueId = tactique.id;
          break;
        }
      }
      if (tactiqueId) break;
    }

    if (!sectionId || !tactiqueId) {
      throw new Error('Hiérarchie parent non trouvée pour le placement');
    }

    try {
      console.log('🔄 Modification placement...');
      
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      
      await updatePlacement(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId,
        data,
        selectedCampaign,
        currentTactique
      );
      
      console.log('✅ Placement modifié');
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur modification placement:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, placements, selectedCampaign, onRefresh]);

  const handleDeletePlacement = useCallback(async (sectionId: string, tactiqueId: string, placementId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce placement ? Cette action est irréversible.')) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer un placement');
    }

    try {
      console.log('🔄 Suppression placement...');
      
      await deletePlacement(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId
      );
      
      console.log('✅ Placement supprimé');
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur suppression placement:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh]);

  // ==================== FONCTIONS CRÉATIF (CORRIGÉES) ====================
  
  const handleCreateCreatif = useCallback(async (placementId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer un créatif');
    }

    let sectionId = '';
    let tactiqueId = '';
    let currentPlacement: Placement | undefined;
    
    for (const section of sections) {
      for (const tactique of (tactiques[section.id] || [])) {
        const placement = placements[tactique.id]?.find(p => p.id === placementId);
        if (placement) {
          sectionId = section.id;
          tactiqueId = tactique.id;
          currentPlacement = placement;
          break;
        }
      }
      if (tactiqueId) break;
    }

    if (!sectionId || !tactiqueId || !currentPlacement) {
      throw new Error('Hiérarchie parent non trouvée pour le créatif');
    }

    try {
      console.log('🔄 Création créatif...');
      
      const placementCreatifs = creatifs[placementId] || [];
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      
      const newCreatifId = await createCreatif(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId,
        {
          CR_Label: 'Nouveau créatif',
          CR_Order: placementCreatifs.length,
          CR_PlacementId: placementId,
          CR_Taxonomy_Tags: '',
          CR_Taxonomy_Platform: '',
          CR_Taxonomy_MediaOcean: '',
          CR_Taxonomy_Values: {}
        },
        selectedCampaign,
        currentTactique,
        currentPlacement
      );
      
      console.log('✅ Créatif créé:', newCreatifId);
      
      const newCreatif: Creatif = {
        id: newCreatifId,
        CR_Label: 'Nouveau créatif',
        CR_Order: placementCreatifs.length,
        CR_PlacementId: placementId,
        CR_Taxonomy_Tags: '',
        CR_Taxonomy_Platform: '',
        CR_Taxonomy_MediaOcean: '',
        CR_Taxonomy_Values: {}
      };
      
      return newCreatif;
    } catch (error) {
      console.error('❌ Erreur création créatif:', error);
      return {} as Creatif;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, placements, creatifs, selectedCampaign]);

  const handleUpdateCreatif = useCallback(async (
    sectionId: string, 
    tactiqueId: string, 
    placementId: string, 
    creatifId: string, 
    data: Partial<Creatif>
  ) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour modifier un créatif');
    }

    // La recherche de hiérarchie est supprimée, on utilise directement les arguments
    if (!sectionId || !tactiqueId || !placementId) {
      throw new Error('Hiérarchie parent (section, tactique, placement) manquante pour le créatif');
    }

    try {
      console.log('🔄 Modification créatif...');
      
      // On récupère les données du parent directement depuis les props du hook
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      const currentPlacement = placements[tactiqueId]?.find(p => p.id === placementId);

      if (!currentPlacement) {
        throw new Error('Le placement parent n\'a pas été trouvé dans les données locales.');
      }
      
      await updateCreatif(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId,
        creatifId,
        data,
        selectedCampaign,
        currentTactique,
        currentPlacement
      );
      
      console.log('✅ Créatif modifié');
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur modification créatif:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, tactiques, placements, selectedCampaign, onRefresh]);

  const handleDeleteCreatif = useCallback(async (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créatif ? Cette action est irréversible.')) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer un créatif');
    }

    try {
      console.log('🔄 Suppression créatif...');
      
      await deleteCreatif(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId,
        creatifId
      );
      
      console.log('✅ Créatif supprimé');
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur suppression créatif:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh]);

  // ==================== FONCTIONS ONGLET (INCHANGÉES) ====================
  
  const handleAddOnglet = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour créer un onglet');
    }

    try {
      console.log('🔄 Création onglet...');
      
      const newOngletId = await addOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        {
          ONGLET_Name: 'Nouvel onglet',
          ONGLET_Order: onglets.length
        }
      );
      
      console.log('✅ Onglet créé:', newOngletId);
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur création onglet:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onglets.length, onRefresh]);

  const handleRenameOnglet = useCallback(async (ongletId: string, newName?: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour renommer un onglet');
    }

    const finalName = newName || prompt('Nouveau nom de l\'onglet:');
    if (!finalName) return;

    try {
      console.log('🔄 Renommage onglet...');
      
      await updateOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        ongletId,
        { ONGLET_Name: finalName }
      );
      
      console.log('✅ Onglet renommé');
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur renommage onglet:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onRefresh]);

  const handleDeleteOnglet = useCallback(async (ongletId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet onglet ? Toutes ses données seront perdues.')) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour supprimer un onglet');
    }

    try {
      console.log('🔄 Suppression onglet...');
      
      await deleteOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        ongletId
      );
      
      console.log('✅ Onglet supprimé');
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur suppression onglet:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onRefresh]);

  // ==================== RETURN ====================
  
  return {
    // Section
    handleCreateSection,
    handleUpdateSection,
    handleDeleteSection,
    
    // Tactique
    handleCreateTactique,
    handleUpdateTactique,
    handleDeleteTactique,
    
    // Placement
    handleCreatePlacement,
    handleUpdatePlacement,
    handleDeletePlacement,
    
    // Créatif
    handleCreateCreatif,
    handleUpdateCreatif,
    handleDeleteCreatif,
    
    // Onglet
    handleAddOnglet,
    handleRenameOnglet,
    handleDeleteOnglet
  };
}