// app/hooks/useTactiquesModals.ts - Hook pour la gestion des modals et opérations sections/onglets

import { useState, useCallback } from 'react';
import { useSelection } from '../contexts/SelectionContext';
import { useClient } from '../contexts/ClientContext';
import {
  Section,
  Onglet
} from '../types/tactiques';
import { Campaign } from '../types/campaign';
import {
  addSection,
  updateSection,
  deleteSection
} from '../lib/tactiqueService';

interface SectionModalState {
  isOpen: boolean;
  section: Section | null;
  mode: 'create' | 'edit';
}

interface UseTactiquesModalsProps {
  selectedCampaign: Campaign | null;
  onglets: Onglet[];
  selectedOnglet: Onglet | null;
  sections: Section[];
  onRefresh: () => Promise<void>;
}

interface UseTactiquesModalsReturn {
  // États des modals
  sectionModal: SectionModalState;
  
  // Fonctions de gestion des modals
  handleSaveSection: (sectionData: any) => Promise<void>;
  closeSectionModal: () => void;
  
  // Opérations sections
  handleAddSection: () => void;
  handleEditSection: (sectionId: string) => void;
  handleDeleteSection: (sectionId: string) => void;
  
  // Opérations onglets
  handleAddOnglet: () => Promise<void>;
  handleRenameOnglet: (ongletId: string, newName?: string) => Promise<void>;
  handleDeleteOnglet: (ongletId: string) => Promise<void>;
}

export const useTactiquesModals = ({
  selectedCampaign,
  onglets,
  selectedOnglet,
  sections,
  onRefresh
}: UseTactiquesModalsProps): UseTactiquesModalsReturn => {

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  // ==================== ÉTATS DES MODALS ====================

  const [sectionModal, setSectionModal] = useState<SectionModalState>({
    isOpen: false,
    section: null,
    mode: 'create'
  });

  // ==================== GESTION DES SECTIONS ====================

  const handleAddSection = useCallback(() => {
    setSectionModal({
      isOpen: true,
      section: null,
      mode: 'create'
    });
  }, []);

  const handleEditSection = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setSectionModal({
        isOpen: true,
        section,
        mode: 'edit'
      });
    }
  }, [sections]);

  const handleSaveSection = useCallback(async (sectionData: any) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour sauvegarder la section');
    }

    try {
      if (sectionModal.mode === 'create') {
        // Création d'une nouvelle section
        const newSectionData = {
          SECTION_Name: sectionData.SECTION_Name,
          SECTION_Order: sections.length,
          SECTION_Color: sectionData.SECTION_Color || '#6366f1',
          SECTION_Budget: 0
        };

        await addSection(
          selectedClient.clientId,
          selectedCampaignId,
          selectedVersionId,
          selectedOngletId,
          newSectionData
        );
      } else if (sectionModal.section) {
        // Mise à jour d'une section existante
        await updateSection(
          selectedClient.clientId,
          selectedCampaignId,
          selectedVersionId,
          selectedOngletId,
          sectionModal.section.id,
          sectionData
        );
      }

      // Fermer le modal et rafraîchir
      setSectionModal(prev => ({ ...prev, isOpen: false }));
      await onRefresh();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la section:', error);
      throw error;
    }
  }, [
    selectedClient?.clientId, 
    selectedCampaignId, 
    selectedVersionId, 
    selectedOngletId,
    sectionModal.mode,
    sectionModal.section,
    sections.length,
    onRefresh
  ]);

  const closeSectionModal = useCallback(() => {
    setSectionModal(prev => ({ ...prev, isOpen: false }));
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
      deleteSection(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId
      ).then(() => {
        onRefresh();
      }).catch(error => {
        console.error('Erreur lors de la suppression de la section:', error);
        alert('Erreur lors de la suppression de la section');
      });
    }
  }, [
    selectedClient?.clientId,
    selectedCampaignId,
    selectedVersionId,
    selectedOngletId,
    sections,
    onRefresh
  ]);

  // ==================== GESTION DES ONGLETS ====================

  const handleAddOnglet = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      console.error('Contexte manquant pour ajouter un onglet');
      return;
    }

    const newOngletName = prompt('Nom du nouvel onglet:');
    if (!newOngletName?.trim()) {
      return;
    }

    try {
      // TODO: Implémenter la création d'onglet dans le service
      console.log('TODO: Implémenter addOnglet dans tactiqueService');
      
      // Logique temporaire
      alert('Fonctionnalité en cours de développement');
    } catch (error) {
      console.error('Erreur lors de la création de l\'onglet:', error);
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId]);

  const handleRenameOnglet = useCallback(async (ongletId: string, newName?: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      console.error('Contexte manquant pour renommer un onglet');
      return;
    }

    const onglet = onglets.find(o => o.id === ongletId);
    if (!onglet) {
      console.error('Onglet non trouvé');
      return;
    }

    const finalNewName = newName || prompt('Nouveau nom pour l\'onglet:', onglet.ONGLET_Name);
    if (!finalNewName?.trim() || finalNewName === onglet.ONGLET_Name) {
      return;
    }

    try {
      // TODO: Implémenter la mise à jour d'onglet dans le service
      console.log('TODO: Implémenter updateOnglet dans tactiqueService');
      
      // Logique temporaire
      alert('Fonctionnalité en cours de développement');
    } catch (error) {
      console.error('Erreur lors du renommage de l\'onglet:', error);
    }
  }, [
    selectedClient?.clientId,
    selectedCampaignId,
    selectedVersionId,
    onglets
  ]);

  const handleDeleteOnglet = useCallback(async (ongletId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      console.error('Contexte manquant pour supprimer un onglet');
      return;
    }

    const onglet = onglets.find(o => o.id === ongletId);
    if (!onglet) {
      console.error('Onglet non trouvé');
      return;
    }

    // Empêcher la suppression du dernier onglet
    if (onglets.length <= 1) {
      alert('Impossible de supprimer le dernier onglet');
      return;
    }

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'onglet "${onglet.ONGLET_Name}" et toutes ses données ?`;
    
    if (confirm(confirmMessage)) {
      try {
        // TODO: Implémenter la suppression d'onglet dans le service
        console.log('TODO: Implémenter deleteOnglet dans tactiqueService');
        
        // Logique temporaire
        alert('Fonctionnalité en cours de développement');
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'onglet:', error);
      }
    }
  }, [
    selectedClient?.clientId,
    selectedCampaignId,
    selectedVersionId,
    onglets
  ]);

  return {
    // États des modals
    sectionModal,
    
    // Fonctions de gestion des modals
    handleSaveSection,
    closeSectionModal,
    
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