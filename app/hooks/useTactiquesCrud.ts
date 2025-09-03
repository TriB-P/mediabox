// app/hooks/useTactiquesCrud.ts

/**
 * Ce hook gère toutes les opérations CRUD (Créer, Lire, Mettre à jour, Supprimer) pour les sections,
 * les tactiques, les placements, les créatifs et les onglets dans la base de données Firebase.
 * Il assure que les opérations sont effectuées dans le contexte de l'utilisateur, de la campagne,
 * de la version et de l'onglet actuellement sélectionnés.
 * Il utilise des fonctions de service distinctes pour interagir avec Firebase et intègre la logique
 * de rafraîchissement des données après chaque modification.
 * * MISE À JOUR : Utilise maintenant orderManagementService pour une gestion centralisée des ordres.
 */
import { useCallback } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { Section, Tactique, Placement, Creatif, PlacementFormData } from '../types/tactiques';
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
import {
  getNextOrder,
  type OrderContext
} from '../lib/orderManagementService';
import { useTranslation } from '../contexts/LanguageContext';

interface UseTactiquesCrudProps {
  sections: any[];
  tactiques: { [sectionId: string]: any[] };
  placements: { [tactiqueId: string]: any[] };
  creatifs: { [placementId: string]: any[] };
  selectedCampaign: any;
  onglets: any[];
  onRefresh: (() => Promise<void>) | (() => void);
}

// ==================== FONCTIONS UTILITAIRES POUR LES DATES ====================


// app/hooks/useTactiquesCrud.ts - FIX convertPlacementToFormData

/**
 * Convertit une Date en string au format YYYY-MM-DD
 */
const dateToString = (date: Date | string | null | undefined): string => {
  if (!date) {
    return '';
  }
  
  // Si c'est déjà une string, la retourner
  if (typeof date === 'string') {
    return date;
  }
  
  // Si c'est un objet Date valide, le convertir
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return '';
};

/**
 * ✅ FIX : Convertit Placement vers PlacementFormData en incluant les dates
 */
const convertPlacementToFormData = (placement: Partial<Placement>): Partial<PlacementFormData> => {
  console.log('🔍 DEBUG convertPlacementToFormData - Données reçues:', {
    PL_Start_Date: placement.PL_Start_Date,
    PL_End_Date: placement.PL_End_Date,
    PL_Label: placement.PL_Label
  });
  
  const { PL_Start_Date, PL_End_Date, ...rest } = placement;
  
  const result = {
    ...rest,
    // ✅ FIX : Inclure les dates converties en string
    PL_Start_Date: dateToString(PL_Start_Date),
    PL_End_Date: dateToString(PL_End_Date),
  };
  
  console.log('🔍 DEBUG convertPlacementToFormData - Données converties:', {
    PL_Start_Date: result.PL_Start_Date,
    PL_End_Date: result.PL_End_Date,
    PL_Label: result.PL_Label
  });
  
  return result;
};
  



export function useTactiquesCrud({
  sections,
  tactiques,
  placements,
  creatifs,
  selectedCampaign,
  onglets,
  onRefresh
}: UseTactiquesCrudProps) {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  /**
   * Construit le contexte d'ordre pour le service orderManagementService
   */
  const buildOrderContext = useCallback((additionalContext: Partial<OrderContext> = {}): OrderContext => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error(t('useTactiquesCrud.errors.missingBaseContext'));
    }

    return {
      clientId: selectedClient.clientId,
      campaignId: selectedCampaignId,
      versionId: selectedVersionId,
      ongletId: selectedOngletId || undefined,
      ...additionalContext
    };
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, t]);

  /**
   * Gère la création d'une nouvelle section.
   * MISE À JOUR : Utilise getNextOrder() pour déterminer l'ordre au lieu de sections.length
   * @param {any} sectionData - Les données de la nouvelle section à créer.
   * @returns {Promise<string>} L'ID de la nouvelle section créée.
   * @throws {Error} Si le contexte nécessaire pour créer une section est manquant.
   */
  const handleCreateSection = useCallback(async (sectionData: any) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error(t('useTactiquesCrud.errors.missingContextCreateSection'));
    }
    try {
      // ✅ NOUVEAU : Utilise le service central pour calculer l'ordre
      const context = buildOrderContext();
      const newOrder = await getNextOrder('section', context);

      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleCreateSection - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections");
      const newSectionId = await addSection(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        {
          SECTION_Name: sectionData.SECTION_Name || t('useTactiquesCrud.defaults.newSection'),
          SECTION_Order: newOrder, // ✅ CHANGÉ : Utilise newOrder au lieu de sections.length
          SECTION_Color: sectionData.SECTION_Color || '#6366f1',
          SECTION_Budget: sectionData.SECTION_Budget || 0
        }
      );
      return newSectionId;
    } catch (error) {
      console.error('❌ Erreur création section:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, buildOrderContext, t]);

  /**
   * Gère la mise à jour d'une section existante.
   * @param {string} sectionId - L'ID de la section à modifier.
   * @param {any} sectionData - Les données de la section à mettre à jour.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour modifier une section est manquant.
   */
  const handleUpdateSection = useCallback(async (sectionId: string, sectionData: any) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error(t('useTactiquesCrud.errors.missingContextUpdateSection'));
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
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, t]);

  /**
   * Gère la suppression d'une section.
   * @param {string} sectionId - L'ID de la section à supprimer.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour supprimer une section est manquant.
   */
  const handleDeleteSection = useCallback(async (sectionId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error(t('useTactiquesCrud.errors.missingContextDeleteSection'));
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
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh, t]);

  /**
   * Gère la création d'une nouvelle tactique.
   * MISE À JOUR : Utilise getNextOrder() pour déterminer l'ordre au lieu de sectionTactiques.length
   * @param {string} sectionId - L'ID de la section parente à laquelle la tactique sera ajoutée.
   * @returns {Promise<Tactique>} La nouvelle tactique créée.
   * @throws {Error} Si le contexte nécessaire pour créer une tactique est manquant.
   */
  const handleCreateTactique = useCallback(async (sectionId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error(t('useTactiquesCrud.errors.missingContextCreateTactic'));
    }
    try {
      // ✅ NOUVEAU : Utilise le service central pour calculer l'ordre
      const context = buildOrderContext({ sectionId });
      const newOrder = await getNextOrder('tactique', context);

      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleCreateTactique - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${sectionId}/tactiques");
      const newTactiqueId = await addTactique(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        {
          TC_Label: t('useTactiquesCrud.defaults.newTactic'),
          TC_Budget: 0,
          TC_MPA:'',
          TC_Order: newOrder, // ✅ CHANGÉ : Utilise newOrder au lieu de sectionTactiques.length
          TC_SectionId: sectionId,
          TC_Unit_Type: '',
          TC_Client_Budget_RefCurrency:0,
          TC_Media_Budget_RefCurrency:0,
        }
      );
      const newTactique: Tactique = {
        id: newTactiqueId,
        TC_Label: t('useTactiquesCrud.defaults.newTactic'),
        TC_Budget: 0,
        TC_MPA: '',
        TC_Order: newOrder, // ✅ CHANGÉ : Utilise newOrder
        TC_SectionId: sectionId,
        TC_Unit_Type: '',
        TC_Client_Budget_RefCurrency:0,
        TC_Media_Budget_RefCurrency:0,
      };
      return newTactique;
    } catch (error) {
      console.error('❌ Erreur création tactique:', error);
      return {} as Tactique;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, buildOrderContext, t]);

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
      throw new Error(t('useTactiquesCrud.errors.missingContextUpdateTactic'));
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
      console.log("DEBUG",data)
      console.error('❌ Erreur modification tactique:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh, t]);

  /**
   * Gère la suppression d'une tactique.
   * @param {string} sectionId - L'ID de la section parente de la tactique.
   * @param {string} tactiqueId - L'ID de la tactique à supprimer.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour supprimer une tactique est manquant.
   */
  const handleDeleteTactique = useCallback(async (sectionId: string, tactiqueId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error(t('useTactiquesCrud.errors.missingContextDeleteTactic'));
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
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh, t]);

  /**
   * Gère la création d'un nouveau placement.
   * MISE À JOUR : Utilise getNextOrder() pour déterminer l'ordre au lieu de tactiquesPlacements.length
   * @param {string} tactiqueId - L'ID de la tactique parente à laquelle le placement sera ajouté.
   * @returns {Promise<Placement>} Le nouveau placement créé.
   * @throws {Error} Si le contexte nécessaire pour créer un placement est manquant ou si la section parente n'est pas trouvée.
   */
  const handleCreatePlacement = useCallback(async (tactiqueId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error(t('useTactiquesCrud.errors.missingContextCreatePlacement'));
    }
    let sectionId = '';
    for (const section of sections) {
      if (tactiques[section.id]?.some(t => t.id === tactiqueId)) {
        sectionId = section.id;
        break;
      }
    }
    if (!sectionId) {
      throw new Error(t('useTactiquesCrud.errors.parentSectionNotFoundForTactic'));
    }
    try {
      // ✅ NOUVEAU : Utilise le service central pour calculer l'ordre
      const context = buildOrderContext({ sectionId, tactiqueId });
      const newOrder = await getNextOrder('placement', context);

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
          PL_Label: t('useTactiquesCrud.defaults.newPlacement'),
          PL_Order: newOrder, // ✅ CHANGÉ : Utilise newOrder au lieu de tactiquesPlacements.length
          PL_TactiqueId: tactiqueId,
          PL_Taxonomy_Tags: '',
          PL_Taxonomy_Platform: '',
          PL_Taxonomy_MediaOcean: '',
        },
        selectedCampaign,
        currentTactique
      );
      const newPlacement: Placement = {
        id: newPlacementId,
        PL_Label: t('useTactiquesCrud.defaults.newPlacement'),
        PL_Order: newOrder, // ✅ CHANGÉ : Utilise newOrder
        PL_TactiqueId: tactiqueId,
        PL_Taxonomy_Tags: '',
        PL_Taxonomy_Platform: '',
        PL_Taxonomy_MediaOcean: '',
      };
      return newPlacement;
    } catch (error) {
      console.error('❌ Erreur création placement:', error);
      return {} as Placement;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, selectedCampaign, buildOrderContext, t]);

  /**
   * Gère la mise à jour d'un placement existant.
   * SIGNATURE CORRIGÉE : Accepte maintenant Partial<Placement> (dates Date) au lieu de Partial<PlacementFormData> (dates string)
   * @param {string} placementId - L'ID du placement à modifier.
   * @param {Partial<Placement>} data - Les données du placement à mettre à jour (avec dates Date).
   * @param {string} [sectionId] - L'ID de la section (optionnel, pour éviter la recherche).
   * @param {string} [tactiqueId] - L'ID de la tactique (optionnel, pour éviter la recherche).
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour modifier un placement est manquant ou si la hiérarchie parente n'est pas trouvée.
   */
  const handleUpdatePlacement = useCallback(async (
    placementId: string, 
    data: Partial<Placement>, // ✅ CHANGÉ : Partial<Placement> au lieu de Partial<PlacementFormData>
    sectionId?: string, 
    tactiqueId?: string
  ) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error(t('useTactiquesCrud.errors.missingContextUpdatePlacement'));
    }

    let finalSectionId = sectionId || '';
    let finalTactiqueId = tactiqueId || '';

    // ✅ Si les IDs ne sont pas fournis, faire la recherche dans les données locales (fallback)
    if (!finalSectionId || !finalTactiqueId) {
      console.log('🔍 Recherche hiérarchie dans les données locales (fallback)...');
      for (const section of sections) {
        for (const tactique of (tactiques[section.id] || [])) {
          if (placements[tactique.id]?.some(p => p.id === placementId)) {
            finalSectionId = section.id;
            finalTactiqueId = tactique.id;
            break;
          }
        }
        if (finalTactiqueId) break;
      }
    }

    if (!finalSectionId || !finalTactiqueId) {
      throw new Error(t('useTactiquesCrud.errors.parentHierarchyNotFoundForPlacement'));
    }

    console.log(`✅ Hiérarchie trouvée: Section=${finalSectionId}, Tactique=${finalTactiqueId}`);

    try {
      const currentTactique = tactiques[finalSectionId]?.find(t => t.id === finalTactiqueId);
      
      // ✅ NOUVEAU : Convertir les données Placement vers PlacementFormData pour l'appel au service
      const formData = convertPlacementToFormData(data);
      
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleUpdatePlacement - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${finalSectionId}/tactiques/${finalTactiqueId}/placements/${placementId}");
      
      await updatePlacement(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        finalSectionId,
        finalTactiqueId,
        placementId,
        formData, // ✅ CHANGÉ : Utilise formData (dates string) au lieu de data (dates Date)
        selectedCampaign,
        currentTactique
      );
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur modification placement:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, placements, selectedCampaign, onRefresh, t]);

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
      throw new Error(t('useTactiquesCrud.errors.missingContextDeletePlacement'));
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
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh, t]);

  /**
   * Gère la création d'un nouveau créatif.
   * MISE À JOUR : Utilise getNextOrder() pour déterminer l'ordre au lieu de placementCreatifs.length
   * @param {string} placementId - L'ID du placement parent auquel le créatif sera ajouté.
   * @returns {Promise<Creatif>} Le nouveau créatif créé.
   * @throws {Error} Si le contexte nécessaire pour créer un créatif est manquant ou si la hiérarchie parente n'est pas trouvée.
   */
  const handleCreateCreatif = useCallback(async (placementId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error(t('useTactiquesCrud.errors.missingContextCreateCreative'));
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
      throw new Error(t('useTactiquesCrud.errors.parentHierarchyNotFoundForCreative'));
    }
    try {
      // ✅ NOUVEAU : Utilise le service central pour calculer l'ordre
      const context = buildOrderContext({ sectionId, tactiqueId, placementId });
      const newOrder = await getNextOrder('creatif', context);

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
          CR_Label: t('useTactiquesCrud.defaults.newCreative'),
          CR_Order: newOrder, // ✅ CHANGÉ : Utilise newOrder au lieu de placementCreatifs.length
          CR_PlacementId: placementId,
          CR_Taxonomy_Tags: '',
          CR_Taxonomy_Platform: '',
          CR_Taxonomy_MediaOcean: '',
        },
        selectedCampaign,
        currentTactique,
        currentPlacement
      );
      const newCreatif: Creatif = {
        id: newCreatifId,
        CR_Label: t('useTactiquesCrud.defaults.newCreative'),
        CR_Order: newOrder, // ✅ CHANGÉ : Utilise newOrder
        CR_PlacementId: placementId,
        CR_Taxonomy_Tags: '',
        CR_Taxonomy_Platform: '',
        CR_Taxonomy_MediaOcean: '',
      };
      return newCreatif;
    } catch (error) {
      console.error('❌ Erreur création créatif:', error);
      return {} as Creatif;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, placements, selectedCampaign, buildOrderContext, t]);

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
      throw new Error(t('useTactiquesCrud.errors.missingContextUpdateCreative'));
    }
  
    let finalSectionId = sectionId;
    let finalTactiqueId = tactiqueId;
    let finalPlacementId = placementId;
  
    // ✅ Vérifier d'abord si la hiérarchie fournie est correcte
    let currentPlacement = placements[finalTactiqueId]?.find(p => p.id === finalPlacementId);
    
    // ✅ Si le placement n'est pas trouvé, faire une recherche dans toutes les données
    if (!currentPlacement) {
      console.log('🔍 Placement non trouvé avec les IDs fournis, recherche automatique...');
      
      // Recherche exhaustive dans toute la hiérarchie
      let found = false;
      for (const section of sections) {
        for (const tactique of (tactiques[section.id] || [])) {
          for (const placement of (placements[tactique.id] || [])) {
            if (creatifs[placement.id]?.some(c => c.id === creatifId)) {
              finalSectionId = section.id;
              finalTactiqueId = tactique.id;
              finalPlacementId = placement.id;
              currentPlacement = placement;
              found = true;
              console.log(`✅ Hiérarchie trouvée automatiquement: Section=${finalSectionId}, Tactique=${finalTactiqueId}, Placement=${finalPlacementId}`);
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }
      
      if (!found || !currentPlacement) {
        throw new Error(t('useTactiquesCrud.errors.fullParentHierarchyNotFoundForCreative'));
      }
    } else {
      console.log(`✅ Hiérarchie validée: Section=${finalSectionId}, Tactique=${finalTactiqueId}, Placement=${finalPlacementId}`);
    }
  
    try {
      const currentTactique = tactiques[finalSectionId]?.find(t => t.id === finalTactiqueId);
      
      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleUpdateCreatif - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${selectedOngletId}/sections/${finalSectionId}/tactiques/${finalTactiqueId}/placements/${finalPlacementId}/creatifs/${creatifId}");
      
      await updateCreatif(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        finalSectionId,
        finalTactiqueId,
        finalPlacementId,
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
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, placements, creatifs, selectedCampaign, onRefresh, t]);

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
      throw new Error(t('useTactiquesCrud.errors.missingContextDeleteCreative'));
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
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, onRefresh, t]);

  /**
   * Gère l'ajout d'un nouvel onglet.
   * MISE À JOUR : Utilise getNextOrder() pour déterminer l'ordre au lieu de onglets.length
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour créer un onglet est manquant.
   */
  const handleAddOnglet = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error(t('useTactiquesCrud.errors.missingContextCreateTab'));
    }
    try {
      // ✅ NOUVEAU : Utilise le service central pour calculer l'ordre
      const context = buildOrderContext();
      const newOrder = await getNextOrder('onglet', context);

      console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesCrud.ts - Fonction: handleAddOnglet - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets");
      const newOngletId = await addOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        {
          ONGLET_Name: t('useTactiquesCrud.defaults.newTab'),
          ONGLET_Order: newOrder // ✅ CHANGÉ : Utilise newOrder au lieu de onglets.length
        }
      );
      await onRefresh();
    } catch (error) {
      console.error('❌ Erreur création onglet:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, buildOrderContext, onRefresh, t]);

  /**
   * Gère le renommage d'un onglet existant.
   * @param {string} ongletId - L'ID de l'onglet à renommer.
   * @param {string} [newName] - Le nouveau nom de l'onglet. Si non fourni, une boîte de dialogue est affichée.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour renommer un onglet est manquant.
   */
  const handleRenameOnglet = useCallback(async (ongletId: string, newName?: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error(t('useTactiquesCrud.errors.missingContextRenameTab'));
    }
    const finalName = newName || prompt(t('useTactiquesCrud.prompts.newTabName'));
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
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onRefresh, t]);

  /**
   * Gère la suppression d'un onglet.
   * @param {string} ongletId - L'ID de l'onglet à supprimer.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte nécessaire pour supprimer un onglet est manquant.
   */
  const handleDeleteOnglet = useCallback(async (ongletId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error(t('useTactiquesCrud.errors.missingContextDeleteTab'));
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
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onRefresh, t]);

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