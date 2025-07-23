/**
 * Ce hook gère la logique et les états des modales et des opérations CRUD
 * pour les sections et les onglets dans la gestion des tactiques.
 * Il centralise les fonctions d'ajout, d'édition, de suppression et de renommage,
 * en interagissant avec les services Firebase et en gérant les retours utilisateur via useDataFlow.
 * Il assure également la gestion du contexte nécessaire (client, campagne, version, onglet).
 */
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
  deleteSection,
  addOnglet,
  updateOnglet,
  deleteOnglet
} from '../lib/tactiqueService';
import { useDataFlow } from './useDataFlow';

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
  onRefresh: (() => Promise<void>) | (() => void);
}

interface UseTactiquesModalsReturn {
  sectionModal: SectionModalState;
  handleSaveSection: (sectionData: any) => Promise<void>;
  closeSectionModal: () => void;
  handleAddSection: () => void;
  handleEditSection: (sectionId: string) => void;
  handleDeleteSection: (sectionId: string) => void;
  handleAddOnglet: () => Promise<void>;
  handleRenameOnglet: (ongletId: string, newName?: string) => Promise<void>;
  handleDeleteOnglet: (ongletId: string) => Promise<void>;
}

/**
 * Hook principal pour la gestion des modales et des opérations sur les tactiques (sections et onglets).
 *
 * @param {UseTactiquesModalsProps} props - Les propriétés incluent la campagne sélectionnée, les onglets, l'onglet sélectionné, les sections et une fonction de rafraîchissement.
 * @returns {UseTactiquesModalsReturn} Un objet contenant les états des modales et les fonctions de gestion.
 */
export const useTactiquesModals = ({
  selectedCampaign,
  onglets,
  selectedOnglet,
  sections,
  onRefresh
}: UseTactiquesModalsProps): UseTactiquesModalsReturn => {

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId, setSelectedOngletId } = useSelection();

  const dataFlow = useDataFlow({
    enableDebug: process.env.NODE_ENV === 'development'
  });

  const [sectionModal, setSectionModal] = useState<SectionModalState>({
    isOpen: false,
    section: null,
    mode: 'create'
  });

  /**
   * Vérifie que le contexte nécessaire (clientId, campaignId, versionId, ongletId) est disponible.
   *
   * @returns {{clientId: string, campaignId: string, versionId: string, ongletId: string}} L'objet contexte si toutes les IDs sont présentes.
   * @throws {Error} Si le contexte est manquant.
   */
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

  /**
   * Ouvre la modale pour créer une nouvelle section.
   * Ne prend aucun paramètre.
   * Ne retourne rien.
   */
  const handleAddSection = useCallback(() => {
    setSectionModal({
      isOpen: true,
      section: null,
      mode: 'create'
    });
  }, []);

  /**
   * Ouvre la modale pour éditer une section existante.
   *
   * @param {string} sectionId - L'identifiant de la section à éditer.
   * Ne retourne rien.
   */
  const handleEditSection = useCallback((sectionId: string) => {
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

  /**
   * Sauvegarde une section, soit en la créant, soit en la mettant à jour.
   *
   * @param {any} sectionData - Les données de la section à sauvegarder.
   * @returns {Promise<void>} Une promesse qui se résout une fois la section sauvegardée et rafraîchie.
   * @throws {Error} Si une erreur survient lors de la sauvegarde.
   */
  const handleSaveSection = useCallback(async (sectionData: any) => {
    const context = ensureContext();

    try {
      dataFlow.startOperationLoading('Sauvegarde section');

      if (sectionModal.mode === 'create') {
        const newSectionData = {
          SECTION_Name: sectionData.SECTION_Name,
          SECTION_Order: sections.length,
          SECTION_Color: sectionData.SECTION_Color || '#6366f1',
          SECTION_Budget: 0
        };

        console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesModals.ts - Fonction: handleSaveSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections");
        await addSection(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          newSectionData
        );

      } else if (sectionModal.section) {
        console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesModals.ts - Fonction: handleSaveSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionModal.section.id}");
        await updateSection(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          sectionModal.section.id,
          sectionData
        );
      }

      setSectionModal(prev => ({ ...prev, isOpen: false }));
      await Promise.resolve(onRefresh());

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

  /**
   * Ferme la modale de la section.
   * Ne prend aucun paramètre.
   * Ne retourne rien.
   */
  const closeSectionModal = useCallback(() => {
    setSectionModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Gère la suppression d'une section après confirmation.
   *
   * @param {string} sectionId - L'identifiant de la section à supprimer.
   * Ne retourne rien.
   */
  const handleDeleteSection = useCallback((sectionId: string) => {
    const context = ensureContext();
    const section = sections.find(s => s.id === sectionId);

    if (!section) {
      console.error('⚠️ Section non trouvée pour suppression:', sectionId);
      return;
    }

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer la section "${section.SECTION_Name}" et toutes ses tactiques ?`;

    if (confirm(confirmMessage)) {
      dataFlow.startOperationLoading('Suppression section');

      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesModals.ts - Fonction: handleDeleteSection - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}");
      deleteSection(
        context.clientId,
        context.campaignId,
        context.versionId,
        context.ongletId,
        sectionId
      ).then(async () => {
        await Promise.resolve(onRefresh());
      }).catch(error => {
        console.error('❌ Erreur suppression section:', error);
        dataFlow.setError('Erreur lors de la suppression de la section');
      }).finally(() => {
        dataFlow.stopLoading();
      });
    }
  }, [sections, onRefresh, dataFlow]);

  /**
   * Gère l'ajout d'un nouvel onglet après avoir demandé un nom à l'utilisateur.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois l'onglet ajouté et le rafraîchissement effectué.
   * @throws {Error} Si le contexte est manquant ou si une erreur survient lors de la création.
   */
  const handleAddOnglet = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour la création d\'onglet');
    }

    const newOngletName = prompt('Nom du nouvel onglet:');
    if (!newOngletName?.trim()) {
      return;
    }

    const trimmedName = newOngletName.trim();

    const nameExists = onglets.some(onglet =>
      onglet.ONGLET_Name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      alert(`Un onglet avec le nom "${trimmedName}" existe déjà. Veuillez choisir un nom différent.`);
      return;
    }

    try {
      dataFlow.startOperationLoading('Création onglet');

      const newOngletData = {
        ONGLET_Name: trimmedName,
        ONGLET_Order: onglets.length,
        ONGLET_Color: '#6366f1'
      };

      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesModals.ts - Fonction: handleAddOnglet - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets");
      const newOngletId = await addOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        newOngletData
      );

      await Promise.resolve(onRefresh());

      setSelectedOngletId(newOngletId);

    } catch (error) {
      console.error('❌ Erreur création onglet:', error);
      dataFlow.setError('Erreur lors de la création de l\'onglet');
    } finally {
      dataFlow.stopLoading();
    }
  }, [
    selectedClient?.clientId,
    selectedCampaignId,
    selectedVersionId,
    onglets.length,
    onglets,
    onRefresh,
    setSelectedOngletId,
    dataFlow
  ]);

  /**
   * Gère le renommage d'un onglet.
   *
   * @param {string} ongletId - L'identifiant de l'onglet à renommer.
   * @param {string} [newName] - Le nouveau nom pour l'onglet (optionnel, une invite sera affichée si non fourni).
   * @returns {Promise<void>} Une promesse qui se résout une fois l'onglet renommé et le rafraîchissement effectué.
   * @throws {Error} Si le contexte est manquant ou si une erreur survient lors du renommage.
   */
  const handleRenameOnglet = useCallback(async (ongletId: string, newName?: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour le renommage d\'onglet');
    }

    const onglet = onglets.find(o => o.id === ongletId);

    if (!onglet) {
      console.error('⚠️ Onglet non trouvé pour renommage:', ongletId);
      return;
    }

    const finalNewName = newName || prompt('Nouveau nom pour l\'onglet:', onglet.ONGLET_Name);
    if (!finalNewName?.trim() || finalNewName.trim() === onglet.ONGLET_Name) {
      return;
    }

    const trimmedName = finalNewName.trim();

    const nameExists = onglets.some(otherOnglet =>
      otherOnglet.id !== ongletId &&
      otherOnglet.ONGLET_Name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      alert(`Un onglet avec le nom "${trimmedName}" existe déjà. Veuillez choisir un nom différent.`);
      return;
    }

    try {
      dataFlow.startOperationLoading('Renommage onglet');

      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesModals.ts - Fonction: handleRenameOnglet - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${ongletId}");
      await updateOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        ongletId,
        { ONGLET_Name: trimmedName }
      );

      await Promise.resolve(onRefresh());

    } catch (error) {
      console.error('❌ Erreur renommage onglet:', error);
      dataFlow.setError('Erreur lors du renommage de l\'onglet');
    } finally {
      dataFlow.stopLoading();
    }
  }, [
    selectedClient?.clientId,
    selectedCampaignId,
    selectedVersionId,
    onglets,
    onRefresh,
    dataFlow
  ]);

  /**
   * Gère la suppression d'un onglet après confirmation, en empêchant la suppression du dernier onglet.
   *
   * @param {string} ongletId - L'identifiant de l'onglet à supprimer.
   * @returns {Promise<void>} Une promesse qui se résout une fois l'onglet supprimé et le rafraîchissement effectué.
   * @throws {Error} Si le contexte est manquant ou si une erreur survient lors de la suppression.
   */
  const handleDeleteOnglet = useCallback(async (ongletId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour la suppression d\'onglet');
    }

    const onglet = onglets.find(o => o.id === ongletId);

    if (!onglet) {
      console.error('⚠️ Onglet non trouvé pour suppression:', ongletId);
      return;
    }

    if (onglets.length <= 1) {
      alert('Impossible de supprimer le dernier onglet');
      return;
    }

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'onglet "${onglet.ONGLET_Name}" et toutes ses données ?`;

    if (confirm(confirmMessage)) {
      try {
        dataFlow.startOperationLoading('Suppression onglet');

        console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesModals.ts - Fonction: handleDeleteOnglet - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${ongletId}");
        await deleteOnglet(
          selectedClient.clientId,
          selectedCampaignId,
          selectedVersionId,
          ongletId
        );

        if (selectedOngletId === ongletId) {
          const remainingOnglets = onglets.filter(o => o.id !== ongletId);
          if (remainingOnglets.length > 0) {
            setSelectedOngletId(remainingOnglets[0].id);
          }
        }

        await Promise.resolve(onRefresh());

      } catch (error) {
        console.error('❌ Erreur suppression onglet:', error);
        dataFlow.setError('Erreur lors de la suppression de l\'onglet');
      } finally {
        dataFlow.stopLoading();
      }
    }
  }, [
    selectedClient?.clientId,
    selectedCampaignId,
    selectedVersionId,
    onglets,
    selectedOngletId,
    setSelectedOngletId,
    onRefresh,
    dataFlow
  ]);

  return {
    sectionModal,
    handleSaveSection,
    closeSectionModal,
    handleAddSection,
    handleEditSection,
    handleDeleteSection,
    handleAddOnglet,
    handleRenameOnglet,
    handleDeleteOnglet,
  };
};

export type { UseTactiquesModalsProps, UseTactiquesModalsReturn, SectionModalState };