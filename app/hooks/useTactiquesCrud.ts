/**
 * Ce hook gère toutes les opérations CRUD (Créer, Lire, Mettre à jour, Supprimer) pour les sections,
 * les tactiques, les placements, les créatifs et les onglets dans la base de données Firebase.
 * Il assure que les opérations sont effectuées dans le contexte de l'utilisateur, de la campagne,
 * de la version et de l'onglet actuellement sélectionnés.
 * Il utilise des fonctions de service distinctes pour interagir avec Firebase et intègre la logique
 * de rafraîchissement des données après chaque modification.
 */
import { useCallback } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { Section, Tactique, Placement, Creatif } from '../types/tactiques';
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
interface UseTactiquesCrudProps {
  sections: any[];
  tactiques: { [sectionId: string]: any[] };
  placements: { [tactiqueId: string]: any[] };
  creatifs: { [placementId: string]: any[] };
  selectedCampaign: any;
  onglets: any[];
  onRefresh: (() => Promise<void>) | (() => void);
}
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

  /**
   * Gère la création d'une nouvelle section.
   * @param {any} sectionData - Les données de la nouvelle section à créer.
   * @returns {Promise<string>} L'ID de la nouvelle section créée.
   * @throws {Error} Si le contexte nécessaire pour créer une section est manquant.
   */
  const handleCreateSection = useCallback(async (sectionData: any) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer une section');
    }
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleCreateSection - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections");
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
      return newSectionId;
    } catch (error) {
      console.error('❌ Erreur création section:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections.length]);

  /**
   * Gère la mise à jour d'une section existante.
   * @param {string} sectionId - L'ID de la section à modifier.
   * @param {any} sectionData - Les données de la section à mettre à jour.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour modifier une section est manquant.
   */
  const handleUpdateSection = useCallback(async (sectionId: string, sectionData: any) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour modifier une section');
    }
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleUpdateSection - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}");
      await updateSection(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        sectionData
      );
    } catch (error) {
      console.error('❌ Erreur modification section:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId]);

  /**
   * Gère la suppression d'une section.
   * @param {string} sectionId - L'ID de la section à supprimer.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour supprimer une section est manquant.
   */
  const handleDeleteSection = useCallback(async (sectionId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer une section');
    }
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleDeleteSection - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}");
      await deleteSection(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId
      );
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur suppression section:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh]);

  /**
   * Gère la création d'une nouvelle tactique.
   * @param {string} sectionId - L'ID de la section parente à laquelle la tactique sera ajoutée.
   * @returns {Promise<Tactique>} La nouvelle tactique créée.
   * @throws {Error} Si le contexte nécessaire pour créer une tactique est manquant.
   */
  const handleCreateTactique = useCallback(async (sectionId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer une tactique');
    }
    try {
      const sectionTactiques = tactiques[sectionId] || [];
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleCreateTactique - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques");
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

  /**
   * Gère la mise à jour d'une tactique existante.
   * @param {string} sectionId - L'ID de la section parente de la tactique.
   * @param {string} tactiqueId - L'ID de la tactique à modifier.
   * @param {Partial<Tactique>} data - Les données de la tactique à mettre à jour.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour modifier une tactique est manquant.
   */
  const handleUpdateTactique = useCallback(async (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour modifier une tactique');
    }
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleUpdateTactique - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques/${tactiqueId}");
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
      console.error('❌ Erreur modification tactique:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh]);

  /**
   * Gère la suppression d'une tactique.
   * @param {string} sectionId - L'ID de la section parente de la tactique.
   * @param {string} tactiqueId - L'ID de la tactique à supprimer.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour supprimer une tactique est manquant.
   */
  const handleDeleteTactique = useCallback(async (sectionId: string, tactiqueId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer une tactique');
    }
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleDeleteTactique - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques/${tactiqueId}");
      await deleteTactique(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId
      );
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur suppression tactique:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh]);

  /**
   * Gère la création d'un nouveau placement.
   * @param {string} tactiqueId - L'ID de la tactique parente à laquelle le placement sera ajouté.
   * @returns {Promise<Placement>} Le nouveau placement créé.
   * @throws {Error} Si le contexte nécessaire pour créer un placement est manquant ou si la section parente n'est pas trouvée.
   */
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
      const tactiquesPlacements = placements[tactiqueId] || [];
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleCreatePlacement - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
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

  /**
   * Gère la mise à jour d'un placement existant.
   * @param {string} placementId - L'ID du placement à modifier.
   * @param {Partial<Placement>} data - Les données du placement à mettre à jour.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour modifier un placement est manquant ou si la hiérarchie parente n'est pas trouvée.
   */
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
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleUpdatePlacement - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
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
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur modification placement:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, placements, selectedCampaign, onRefresh]);

  /**
   * Gère la suppression d'un placement.
   * @param {string} sectionId - L'ID de la section parente du placement.
   * @param {string} tactiqueId - L'ID de la tactique parente du placement.
   * @param {string} placementId - L'ID du placement à supprimer.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour supprimer un placement est manquant.
   */
  const handleDeletePlacement = useCallback(async (sectionId: string, tactiqueId: string, placementId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer un placement');
    }
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleDeletePlacement - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
      await deletePlacement(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId
      );
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur suppression placement:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh]);

  /**
   * Gère la création d'un nouveau créatif.
   * @param {string} placementId - L'ID du placement parent auquel le créatif sera ajouté.
   * @returns {Promise<Creatif>} Le nouveau créatif créé.
   * @throws {Error} Si le contexte nécessaire pour créer un créatif est manquant ou si la hiérarchie parente n'est pas trouvée.
   */
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
      const placementCreatifs = creatifs[placementId] || [];
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleCreateCreatif - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs");
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

  /**
   * Gère la mise à jour d'un créatif existant.
   * @param {string} sectionId - L'ID de la section parente du créatif.
   * @param {string} tactiqueId - L'ID de la tactique parente du créatif.
   * @param {string} placementId - L'ID du placement parent du créatif.
   * @param {string} creatifId - L'ID du créatif à modifier.
   * @param {Partial<Creatif>} data - Les données du créatif à mettre à jour.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour modifier un créatif est manquant ou si le placement parent n'est pas trouvé.
   */
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
    if (!sectionId || !tactiqueId || !placementId) {
      throw new Error('Hiérarchie parent (section, tactique, placement) manquante pour le créatif');
    }
    try {
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      const currentPlacement = placements[tactiqueId]?.find(p => p.id === placementId);
      if (!currentPlacement) {
        throw new Error('Le placement parent n\'a pas été trouvé dans les données locales.');
      }
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleUpdateCreatif - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifId}");
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
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur modification créatif:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, tactiques, placements, selectedCampaign, onRefresh]);

  /**
   * Gère la suppression d'un créatif.
   * @param {string} sectionId - L'ID de la section parente du créatif.
   * @param {string} tactiqueId - L'ID de la tactique parente du créatif.
   * @param {string} placementId - L'ID du placement parent du créatif.
   * @param {string} creatifId - L'ID du créatif à supprimer.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour supprimer un créatif est manquant.
   */
  const handleDeleteCreatif = useCallback(async (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer un créatif');
    }
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleDeleteCreatif - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifId}");
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
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur suppression créatif:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh]);

  /**
   * Gère l'ajout d'un nouvel onglet.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour créer un onglet est manquant.
   */
  const handleAddOnglet = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour créer un onglet');
    }
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleAddOnglet - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets");
      const newOngletId = await addOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        {
          ONGLET_Name: 'Nouvel onglet',
          ONGLET_Order: onglets.length
        }
      );
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur création onglet:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onglets.length, onRefresh]);

  /**
   * Gère le renommage d'un onglet existant.
   * @param {string} ongletId - L'ID de l'onglet à renommer.
   * @param {string} [newName] - Le nouveau nom de l'onglet. Si non fourni, une boîte de dialogue est affichée.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour renommer un onglet est manquant.
   */
  const handleRenameOnglet = useCallback(async (ongletId: string, newName?: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour renommer un onglet');
    }
    const finalName = newName || prompt('Nouveau nom de l\'onglet:');
    if (!finalName) return;
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleRenameOnglet - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${ongletId}");
      await updateOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        ongletId,
        { ONGLET_Name: finalName }
      );
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur renommage onglet:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onRefresh]);

  /**
   * Gère la suppression d'un onglet.
   * @param {string} ongletId - L'ID de l'onglet à supprimer.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour supprimer un onglet est manquant.
   */
  const handleDeleteOnglet = useCallback(async (ongletId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour supprimer un onglet');
    }
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleDeleteOnglet - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${ongletId}");
      await deleteOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        ongletId
      );
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur suppression onglet:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onRefresh]);
  return {
    handleCreateSection,
    handleUpdateSection,
    handleDeleteSection,
    handleCreateTactique,
    handleUpdateTactique,
    handleDeleteTactique,
    handleCreatePlacement,
    handleUpdatePlacement,
    handleDeletePlacement,
    handleCreateCreatif,
    handleUpdateCreatif,
    handleDeleteCreatif,
    handleAddOnglet,
    handleRenameOnglet,
    handleDeleteOnglet
  };
}