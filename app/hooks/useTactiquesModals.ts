// app/hooks/useTactiquesModals.ts - Version nettoyée avec nouvelle architecture

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
import { useDataFlow } from './useDataFlow';

// ==================== TYPES ====================

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

// ==================== HOOK PRINCIPAL ====================

export const useTactiquesModals = ({
  selectedCampaign,
  onglets,
  selectedOnglet,
  sections,
  onRefresh
}: UseTactiquesModalsProps): UseTactiquesModalsReturn => {

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  // Utilisation de useDataFlow pour les opérations qui nécessitent du feedback
  const dataFlow = useDataFlow({ 
    enableDebug: process.env.NODE_ENV === 'development' 
  });

  // ==================== ÉTATS DES MODALS ====================

  const [sectionModal, setSectionModal] = useState<SectionModalState>({
    isOpen: false,
    section: null,
    mode: 'create'
  });

  // ==================== UTILITAIRES ====================

  const ensureContext = () => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour l\'opération sur les modals');
    }
    return {
      clientId: selectedClient.clientId,
      campaignId: selectedCampaignId,
      versionId: selectedVersionId,
      ongletId: selectedOngletId
    };
  };

  // ==================== GESTION DES SECTIONS ====================

  const handleAddSection = useCallback(() => {
    console.log('📋 Ouverture modal nouvelle section');
    setSectionModal({
      isOpen: true,
      section: null,
      mode: 'create'
    });
  }, []);

  const handleEditSection = useCallback((sectionId: string) => {
    console.log('✏️ Ouverture modal édition section:', sectionId);
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setSectionModal({
        isOpen: true,
        section,
        mode: 'edit'
      });
    } else {
      console.warn('⚠️ Section non trouvée pour édition:', sectionId);
    }
  }, [sections]);

  const handleSaveSection = useCallback(async (sectionData: any) => {
    const context = ensureContext();

    try {
      dataFlow.startOperationLoading('Sauvegarde section');

      if (sectionModal.mode === 'create') {
        console.log('➕ Création nouvelle section');
        const newSectionData = {
          SECTION_Name: sectionData.SECTION_Name,
          SECTION_Order: sections.length,
          SECTION_Color: sectionData.SECTION_Color || '#6366f1',
          SECTION_Budget: 0
        };

        await addSection(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          newSectionData
        );
        console.log('✅ Section créée avec succès');

      } else if (sectionModal.section) {
        console.log('💾 Mise à jour section existante');
        await updateSection(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          sectionModal.section.id,
          sectionData
        );
        console.log('✅ Section mise à jour avec succès');
      }

      // Fermer le modal et rafraîchir
      setSectionModal(prev => ({ ...prev, isOpen: false }));
      await onRefresh();

    } catch (error) {
      console.error('❌ Erreur sauvegarde section:', error);
      dataFlow.setError('Erreur lors de la sauvegarde de la section');
      throw error;
    } finally {
      dataFlow.stopLoading();
    }
  }, [
    sectionModal.mode,
    sectionModal.section,
    sections.length,
    onRefresh,
    dataFlow
  ]);

  const closeSectionModal = useCallback(() => {
    console.log('❌ Fermeture modal section');
    setSectionModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleDeleteSection = useCallback((sectionId: string) => {
    const context = ensureContext();
    const section = sections.find(s => s.id === sectionId);
    
    if (!section) {
      console.error('⚠️ Section non trouvée pour suppression:', sectionId);
      return;
    }

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer la section "${section.SECTION_Name}" et toutes ses tactiques ?`;
    
    if (confirm(confirmMessage)) {
      console.log('🗑️ Suppression section confirmée:', section.SECTION_Name);
      
      // Démarrer l'opération avec feedback
      dataFlow.startOperationLoading('Suppression section');
      
      deleteSection(
        context.clientId,
        context.campaignId,
        context.versionId,
        context.ongletId,
        sectionId
      ).then(async () => {
        console.log('✅ Section supprimée avec succès');
        await onRefresh();
      }).catch(error => {
        console.error('❌ Erreur suppression section:', error);
        dataFlow.setError('Erreur lors de la suppression de la section');
      }).finally(() => {
        dataFlow.stopLoading();
      });
    }
  }, [sections, onRefresh, dataFlow]);

  // ==================== GESTION DES ONGLETS ====================

  const handleAddOnglet = useCallback(async () => {
    const context = ensureContext();

    const newOngletName = prompt('Nom du nouvel onglet:');
    if (!newOngletName?.trim()) {
      return;
    }

    try {
      dataFlow.startOperationLoading('Création onglet');
      console.log('📝 Création nouvel onglet:', newOngletName);
      
      // TODO: Implémenter addOnglet dans tactiqueService
      // await addOnglet(context.clientId, context.campaignId, context.versionId, {
      //   ONGLET_Name: newOngletName,
      //   ONGLET_Order: onglets.length
      // });
      
      console.log('🚧 addOnglet pas encore implémenté dans tactiqueService');
      alert('Fonctionnalité en cours de développement - addOnglet manquant');
      
      await onRefresh();
      
    } catch (error) {
      console.error('❌ Erreur création onglet:', error);
      dataFlow.setError('Erreur lors de la création de l\'onglet');
    } finally {
      dataFlow.stopLoading();
    }
  }, [onglets.length, onRefresh, dataFlow]);

  const handleRenameOnglet = useCallback(async (ongletId: string, newName?: string) => {
    const context = ensureContext();
    const onglet = onglets.find(o => o.id === ongletId);
    
    if (!onglet) {
      console.error('⚠️ Onglet non trouvé pour renommage:', ongletId);
      return;
    }

    const finalNewName = newName || prompt('Nouveau nom pour l\'onglet:', onglet.ONGLET_Name);
    if (!finalNewName?.trim() || finalNewName === onglet.ONGLET_Name) {
      return;
    }

    try {
      dataFlow.startOperationLoading('Renommage onglet');
      console.log('✏️ Renommage onglet:', onglet.ONGLET_Name, '→', finalNewName);
      
      // TODO: Implémenter updateOnglet dans tactiqueService
      // await updateOnglet(context.clientId, context.campaignId, context.versionId, ongletId, {
      //   ONGLET_Name: finalNewName
      // });
      
      console.log('🚧 updateOnglet pas encore implémenté dans tactiqueService');
      alert('Fonctionnalité en cours de développement - updateOnglet manquant');
      
      await onRefresh();
      
    } catch (error) {
      console.error('❌ Erreur renommage onglet:', error);
      dataFlow.setError('Erreur lors du renommage de l\'onglet');
    } finally {
      dataFlow.stopLoading();
    }
  }, [onglets, onRefresh, dataFlow]);

  const handleDeleteOnglet = useCallback(async (ongletId: string) => {
    const context = ensureContext();
    const onglet = onglets.find(o => o.id === ongletId);
    
    if (!onglet) {
      console.error('⚠️ Onglet non trouvé pour suppression:', ongletId);
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
        dataFlow.startOperationLoading('Suppression onglet');
        console.log('🗑️ Suppression onglet:', onglet.ONGLET_Name);
        
        // TODO: Implémenter deleteOnglet dans tactiqueService
        // await deleteOnglet(context.clientId, context.campaignId, context.versionId, ongletId);
        
        console.log('🚧 deleteOnglet pas encore implémenté dans tactiqueService');
        alert('Fonctionnalité en cours de développement - deleteOnglet manquant');
        
        await onRefresh();
        
      } catch (error) {
        console.error('❌ Erreur suppression onglet:', error);
        dataFlow.setError('Erreur lors de la suppression de l\'onglet');
      } finally {
        dataFlow.stopLoading();
      }
    }
  }, [onglets, onRefresh, dataFlow]);

  // ==================== RETURN ====================

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

// ==================== TYPES EXPORT ====================

export type { UseTactiquesModalsProps, UseTactiquesModalsReturn, SectionModalState };