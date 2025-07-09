// app/hooks/useTactiquesOperations.ts

import { useCallback } from 'react';
import { useSelection } from '../contexts/SelectionContext';
import { useClient } from '../contexts/ClientContext';
import {
  Tactique,
  TactiqueFormData,
  Placement,
  PlacementFormData,
  Creatif,
  CreatifFormData,
  Section,
  Onglet
} from '../types/tactiques';
import { Campaign } from '../types/campaign';
import {
  addTactique,
  updateTactique,
  deleteTactique,
  addSection,
  updateSection,
  deleteSection
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

// NOUVEAU: Les fonctions de suppression locale ne sont plus importées directement du hook
// useTactiquesData, mais reçues via les props du hook useTactiquesOperations.

interface UseTactiquesOperationsProps {
  selectedCampaign: Campaign | null;
  selectedOnglet: Onglet | null;
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  onRefresh: () => Promise<void>;

  // NOUVEAU: Ajout des fonctions de suppression locale dans les props du hook
  removeSectionLocally: (sectionId: string) => void;
  removeTactiqueAndChildrenLocally: (sectionId: string, tactiqueId: string) => void;
  removePlacementAndChildrenLocally: (sectionId: string, tactiqueId: string, placementId: string) => void;
  removeCreatifLocally: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => void;
}

interface UseTactiquesOperationsReturn {
  // Opérations tactiques
  handleCreateTactique: (sectionId: string) => Promise<Tactique>;
  handleUpdateTactique: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  handleDeleteTactique: (sectionId: string, tactiqueId: string) => void;

  // Opérations placements
  handleCreatePlacement: (tactiqueId: string) => Promise<Placement>;
  handleUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  handleDeletePlacement: (sectionId: string, tactiqueId: string, placementId: string) => void; 

  // Opérations créatifs
  handleCreateCreatif: (placementId: string) => Promise<Creatif>;
  handleUpdateCreatif: (creatifId: string, data: Partial<Creatif>) => Promise<void>;
  handleDeleteCreatif: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => void; 

  // Opérations sections
  handleAddSection: () => void;
  handleEditSection: (sectionId: string) => void;
  handleDeleteSection: (sectionId: string) => void;

  // Opérations onglets
  handleAddOnglet: () => Promise<void>;
  handleRenameOnglet: (ongletId: string, newName?: string) => Promise<void>;
  handleDeleteOnglet: (ongletId: string) => Promise<void>;
}

export const useTactiquesOperations = ({
  selectedCampaign,
  selectedOnglet,
  sections,
  tactiques,
  onRefresh,
  // NOUVEAU: Récupération des fonctions de suppression locale depuis les props
  removeSectionLocally, 
  removeTactiqueAndChildrenLocally, 
  removePlacementAndChildrenLocally, 
  removeCreatifLocally 
}: UseTactiquesOperationsProps): UseTactiquesOperationsReturn => {

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();
  
  // ==================== TACTIQUES ====================

  const handleCreateTactique = useCallback(async (sectionId: string): Promise<Tactique> => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer une tactique');
    }

    const sectionTactiques = tactiques[sectionId] || [];
    const newOrder = sectionTactiques.length;

    const newTactiqueData: Omit<Tactique, 'id'> = {
      TC_Label: 'Nouvelle tactique',
      TC_Budget: 0,
      TC_Order: newOrder,
      TC_SectionId: sectionId,
      TC_Status: 'Planned'
    };

    try {
      const tactiqueId = await addTactique(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        newTactiqueData
      );

      const newTactique = { id: tactiqueId, ...newTactiqueData };
      await onRefresh();
      return newTactique;
    } catch (error) {
      console.error('Erreur lors de la création de la tactique:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, tactiques, onRefresh]);

  const handleUpdateTactique = useCallback(async (
    sectionId: string, 
    tactiqueId: string, 
    data: Partial<Tactique>
  ): Promise<void> => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour mettre à jour la tactique');
    }

    try {
      await updateTactique(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        data
      );
      await onRefresh();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tactique:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh]);

  const handleDeleteTactique = useCallback((sectionId: string, tactiqueId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('Contexte manquant pour supprimer la tactique');
      return;
    }
    // Mise à jour optimiste: retirer l'élément de l'interface
    removeTactiqueAndChildrenLocally(sectionId, tactiqueId); 
    
    // Suppression en base de données
    deleteTactique(
      selectedClient.clientId,
      selectedCampaignId,
      selectedVersionId,
      selectedOngletId,
      sectionId,
      tactiqueId
    ).catch(error => {
      console.error('Erreur lors de la suppression de la tactique Firestore:', error);
      // En cas d'échec, rafraîchir pour resynchroniser l'interface avec la base de données
      onRefresh(); 
    });
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, removeTactiqueAndChildrenLocally, onRefresh]);

  // ==================== PLACEMENTS ====================

  const handleCreatePlacement = useCallback(async (tactiqueId: string): Promise<Placement> => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer un placement');
    }

    // Trouver la section qui contient cette tactique
    const sectionId = Object.keys(tactiques).find(sId =>
      tactiques[sId].some(t => t.id === tactiqueId)
    );

    if (!sectionId) {
      throw new Error('Section non trouvée pour la tactique');
    }

    const newPlacementData: PlacementFormData = {
      PL_Label: 'Nouveau placement',
      PL_Order: 0, // Sera recalculé côté serveur
      PL_TactiqueId: tactiqueId
    };

    try {
      const placementId = await createPlacement(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        newPlacementData
      );

      const newPlacement = { id: placementId, ...newPlacementData };
      await onRefresh();
      return newPlacement;
    } catch (error) {
      console.error('Erreur lors de la création du placement:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, tactiques, onRefresh]);

  const handleUpdatePlacement = useCallback(async (
    placementId: string, 
    data: Partial<Placement>
  ): Promise<void> => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour mettre à jour le placement');
    }

    // Trouver la section et tactique qui contiennent ce placement
    let sectionId = '';
    let tactiqueId = '';

    for (const [sId, sectionTactiques] of Object.entries(tactiques)) {
      for (const tactique of sectionTactiques) {
        // Cette logique nécessiterait d'avoir accès aux placements ici
        // On va simplifier en supposant que cette info est dans data
        if (data.PL_TactiqueId) {
          tactiqueId = data.PL_TactiqueId;
          sectionId = sId;
          break;
        }
      }
      if (sectionId) break;
    }

    if (!sectionId || !tactiqueId) {
      throw new Error('Contexte parent non trouvé pour le placement');
    }

    try {
      await updatePlacement(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId,
        data
      );
      await onRefresh();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du placement:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, tactiques, onRefresh]);

  const handleDeletePlacement = useCallback((sectionId: string, tactiqueId: string, placementId: string) => { 
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('Contexte manquant pour supprimer le placement');
      return;
    }
    // Mise à jour optimiste: retirer l'élément de l'interface
    removePlacementAndChildrenLocally(sectionId, tactiqueId, placementId); 

    // Suppression en base de données
    deletePlacement(
      selectedClient.clientId,
      selectedCampaignId,
      selectedVersionId,
      selectedOngletId,
      sectionId, 
      tactiqueId, 
      placementId
    ).catch(error => {
      console.error('Erreur lors de la suppression du placement Firestore:', error);
      // En cas d'échec, rafraîchir pour resynchroniser l'interface
      onRefresh(); 
    });
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, removePlacementAndChildrenLocally, onRefresh]);

  // ==================== CRÉATIFS ====================

  const handleCreateCreatif = useCallback(async (placementId: string): Promise<Creatif> => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer un créatif');
    }

    // Trouver le contexte parent (section, tactique)
    let sectionId = '';
    let tactiqueId = '';

    for (const [sId, sectionTactiques] of Object.entries(tactiques)) {
      for (const tactique of sectionTactiques) {
        sectionId = sId;
        tactiqueId = tactique.id;
        break; 
      }
      if (sectionId) break;
    }

    if (!sectionId || !tactiqueId) {
      throw new Error('Contexte parent non trouvé pour le créatif');
    }

    const newCreatifData: CreatifFormData = {
      CR_Label: 'Nouveau créatif',
      CR_Order: 0,
      CR_PlacementId: placementId
    };

    try {
      const creatifId = await createCreatif(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId,
        newCreatifData
      );

      const newCreatif = { id: creatifId, ...newCreatifData };
      await onRefresh();
      return newCreatif;
    } catch (error) {
      console.error('Erreur lors de la création du créatif:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, tactiques, onRefresh]);

  const handleUpdateCreatif = useCallback(async (
    creatifId: string, 
    data: Partial<Creatif>
  ): Promise<void> => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour mettre à jour le créatif');
    }

    // Trouver le contexte parent (logique simplifiée)
    let sectionId = '';
    let tactiqueId = '';
    let placementId = data.CR_PlacementId || '';

    for (const [sId, sectionTactiques] of Object.entries(tactiques)) {
      for (const tactique of sectionTactiques) {
        sectionId = sId;
        tactiqueId = tactique.id;
        break;
      }
      if (sectionId) break;
    }

    if (!sectionId || !tactiqueId || !placementId) {
      throw new Error('Contexte parent non trouvé pour le créatif');
    }

    try {
      await updateCreatif(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId,
        creatifId,
        data
      );
      await onRefresh();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du créatif:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, tactiques, onRefresh]);

  const handleDeleteCreatif = useCallback((sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => { 
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('Contexte manquant pour supprimer le créatif');
      return;
    }
    // Mise à jour optimiste: retirer l'élément de l'interface
    removeCreatifLocally(sectionId, tactiqueId, placementId, creatifId); 
    
    // Suppression en base de données
    deleteCreatif(
      selectedClient.clientId,
      selectedCampaignId,
      selectedVersionId,
      selectedOngletId,
      sectionId, 
      tactiqueId, 
      placementId, 
      creatifId
    ).catch(error => {
      console.error('Erreur lors de la suppression du créatif Firestore:', error);
      // En cas d'échec, rafraîchir pour resynchroniser l'interface
      onRefresh(); 
    });
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, removeCreatifLocally, onRefresh]);

  // ==================== SECTIONS & ONGLETS ====================
  // TODO: Implémenter ces fonctions dans le prochain artefact (useTactiquesModals)

  const handleAddSection = useCallback(() => {
    console.log('TODO: handleAddSection - à implémenter dans useTactiquesModals');
  }, []);

  const handleEditSection = useCallback((sectionId: string) => {
    console.log('TODO: handleEditSection - à implémenter dans useTactiquesModals');
  }, []);

  const handleDeleteSection = useCallback((sectionId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
        console.error('Contexte manquant pour supprimer la section');
        return;
    }

    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      console.error('Section non trouvée');
      return;
    }

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer la section "${section.SECTION_Name}" et toutes ses tactiques ?`;
    
    if (confirm(confirmMessage)) {
      // Mise à jour optimiste: retirer l'élément de l'interface
      removeSectionLocally(sectionId); 

      // Suppression en base de données
      deleteSection(
          selectedClient.clientId,
          selectedCampaignId,
          selectedVersionId,
          selectedOngletId,
          sectionId
      ).catch(error => {
          console.error('Erreur lors de la suppression de la section Firestore:', error);
          // En cas d'échec, rafraîchir pour resynchroniser l'interface
          onRefresh(); 
      });
    }

  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, removeSectionLocally, onRefresh]);

  const handleAddOnglet = useCallback(async () => {
    console.log('TODO: handleAddOnglet - à implémenter dans useTactiquesModals');
  }, []);

  const handleRenameOnglet = useCallback(async (ongletId: string, newName?: string) => {
    console.log('TODO: handleRenameOnglet - à implémenter dans useTactiquesModals');
  }, []);

  const handleDeleteOnglet = useCallback(async (ongletId: string) => {
    console.log('TODO: handleDeleteOnglet - à implémenter dans useTactiquesModals');
  }, []);

  return {
    // Opérations tactiques
    handleCreateTactique,
    handleUpdateTactique,
    handleDeleteTactique,

    // Opérations placements
    handleCreatePlacement,
    handleUpdatePlacement,
    handleDeletePlacement,

    // Opérations créatifs
    handleCreateCreatif,
    handleUpdateCreatif,
    handleDeleteCreatif,

    // Opérations sections
    handleAddSection,
    handleEditSection,
    handleDeleteSection,

    // Opérations onglets
    handleAddOnglet,
    handleRenameOnglet,
    handleDeleteOnglet,
  };
};