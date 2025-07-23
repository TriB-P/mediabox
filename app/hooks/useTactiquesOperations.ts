/**
 * Ce hook gère les opérations CRUD (Créer, Lire, Mettre à jour, Supprimer) pour les tactiques,
 * les placements et les créatifs au sein d'une campagne spécifique.
 * Il assure la communication avec Firebase et intègre des mises à jour optimistes
 * pour une meilleure réactivité de l'interface utilisateur.
 */
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

interface UseTactiquesOperationsProps {
  selectedCampaign: Campaign | null;
  selectedOnglet: Onglet | null;
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  campaignData?: any;
  allTactiques: { [sectionId: string]: Tactique[] };
  allPlacements: { [tactiqueId: string]: Placement[] };
  allCreatifs: { [placementId: string]: Creatif[] };
  onRefresh: (() => Promise<void>) | (() => void);
  removeSectionLocally: (sectionId: string) => void;
  removeTactiqueAndChildrenLocally: (sectionId: string, tactiqueId: string) => void;
  removePlacementAndChildrenLocally: (sectionId: string, tactiqueId: string, placementId: string) => void;
  removeCreatifLocally: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => void;
}

interface UseTactiquesOperationsReturn {
  handleCreateTactique: (sectionId: string) => Promise<Tactique>;
  handleUpdateTactique: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  handleDeleteTactique: (sectionId: string, tactiqueId: string) => void;
  handleCreatePlacement: (tactiqueId: string) => Promise<Placement>;
  handleUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  handleDeletePlacement: (sectionId: string, tactiqueId: string, placementId: string) => void; 
  handleCreateCreatif: (placementId: string) => Promise<Creatif>;
  handleUpdateCreatif: (creatifId: string, data: Partial<Creatif>) => Promise<void>;
  handleDeleteCreatif: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => void; 
}

/**
 * Hook principal pour gérer les opérations sur les tactiques, placements et créatifs.
 *
 * @param {UseTactiquesOperationsProps} props - Les propriétés nécessaires au hook.
 * @returns {UseTactiquesOperationsReturn} Un objet contenant les fonctions de gestion des opérations.
 */
export const useTactiquesOperations = ({
  selectedCampaign,
  selectedOnglet,
  sections,
  tactiques,
  campaignData,
  allTactiques,
  allPlacements,
  allCreatifs,
  onRefresh,
  removeSectionLocally,
  removeTactiqueAndChildrenLocally,
  removePlacementAndChildrenLocally,
  removeCreatifLocally
}: UseTactiquesOperationsProps): UseTactiquesOperationsReturn => {

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();
  
  /**
   * Vérifie que le contexte nécessaire aux opérations Firebase est complet.
   *
   * @returns {{clientId: string, campaignId: string, versionId: string, ongletId: string}} L'objet de contexte.
   * @throws {Error} Si le contexte est incomplet.
   */
  const ensureContext = () => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte incomplet pour l\'opération');
    }
    return {
      clientId: selectedClient.clientId,
      campaignId: selectedCampaignId,
      versionId: selectedVersionId,
      ongletId: selectedOngletId
    };
  };

  /**
   * Exécute une opération Firebase en gérant les erreurs et le rafraîchissement des données.
   *
   * @param {string} operationName - Le nom de l'opération pour les logs.
   * @param {() => Promise<T>} operation - La fonction asynchrone à exécuter.
   * @param {boolean} [skipRefresh=false] - Indique si le rafraîchissement des données doit être ignoré après l'opération.
   * @returns {Promise<T>} Le résultat de l'opération.
   * @throws {Error} L'erreur survenue lors de l'opération.
   */
  const executeOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>,
    skipRefresh = false
  ): Promise<T> => {
    try {
      const result = await operation();
      if (!skipRefresh) {
        await Promise.resolve(onRefresh());
      }
      return result;
    } catch (error) {
      console.error(`❌ Erreur ${operationName}:`, error);
      await Promise.resolve(onRefresh());
      throw error;
    }
  }, [onRefresh]);
  
  /**
   * Gère la création d'une nouvelle tactique.
   *
   * @param {string} sectionId - L'ID de la section à laquelle la tactique appartient.
   * @returns {Promise<Tactique>} La tactique nouvellement créée.
   */
  const handleCreateTactique = useCallback(async (sectionId: string): Promise<Tactique> => {
    const context = ensureContext();
    const sectionTactiques = tactiques[sectionId] || [];

    const newTactiqueData: Omit<Tactique, 'id'> = {
      TC_Label: 'Nouvelle tactique',
      TC_Budget: 0,
      TC_Order: sectionTactiques.length,
      TC_SectionId: sectionId,
      TC_Status: 'Planned'
    };

    return executeOperation(
      'Création tactique',
      async () => {
        console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesOperations.ts - Fonction: handleCreateTactique - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}/tactiques");
        const tactiqueId = await addTactique(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          sectionId,
          newTactiqueData
        );
        return { id: tactiqueId, ...newTactiqueData };
      }
    );
  }, [tactiques, executeOperation]);

  /**
   * Gère la mise à jour d'une tactique existante.
   *
   * @param {string} sectionId - L'ID de la section de la tactique.
   * @param {string} tactiqueId - L'ID de la tactique à mettre à jour.
   * @param {Partial<Tactique>} data - Les données partielles de la tactique à mettre à jour.
   * @returns {Promise<void>}
   */
  const handleUpdateTactique = useCallback(async (
    sectionId: string, 
    tactiqueId: string, 
    data: Partial<Tactique>
  ): Promise<void> => {
    const context = ensureContext();

    return executeOperation(
      'Mise à jour tactique',
      () => {
        console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesOperations.ts - Fonction: handleUpdateTactique - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}/tactiques/${tactiqueId}");
        return updateTactique(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          sectionId,
          tactiqueId,
          data,
        );
      }
    );
  }, [executeOperation, campaignData]);

  /**
   * Gère la suppression d'une tactique et de ses enfants (placements, créatifs).
   * Applique une suppression optimiste localement avant de supprimer sur Firebase.
   *
   * @param {string} sectionId - L'ID de la section de la tactique.
   * @param {string} tactiqueId - L'ID de la tactique à supprimer.
   */
  const handleDeleteTactique = useCallback((sectionId: string, tactiqueId: string) => {
    const context = ensureContext();

    removeTactiqueAndChildrenLocally(sectionId, tactiqueId);
    
    console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesOperations.ts - Fonction: handleDeleteTactique - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}/tactiques/${tactiqueId}");
    deleteTactique(
      context.clientId,
      context.campaignId,
      context.versionId,
      context.ongletId,
      sectionId,
      tactiqueId
    ).catch(error => {
      console.error('❌ Erreur suppression tactique Firestore:', error);
      onRefresh();
    });
  }, [removeTactiqueAndChildrenLocally, onRefresh]);

  /**
   * Gère la création d'un nouveau placement.
   *
   * @param {string} tactiqueId - L'ID de la tactique parente.
   * @returns {Promise<Placement>} Le placement nouvellement créé.
   * @throws {Error} Si la section ou la tactique parente n'est pas trouvée.
   */
  const handleCreatePlacement = useCallback(async (tactiqueId: string): Promise<Placement> => {
    const context = ensureContext();

    const sectionId = Object.keys(allTactiques).find(sId =>
      allTactiques[sId].some(t => t.id === tactiqueId)
    );
    const currentTactique = allTactiques[sectionId || '']?.find(t => t.id === tactiqueId);


    if (!sectionId || !currentTactique) {
      throw new Error('Section ou tactique parente non trouvée pour le placement');
    }

    const newPlacementData: PlacementFormData = {
      PL_Label: 'Nouveau placement',
      PL_Order: 0,
      PL_TactiqueId: tactiqueId
    };

    return executeOperation(
      'Création placement',
      async () => {
        console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesOperations.ts - Fonction: handleCreatePlacement - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements");
        const placementId = await createPlacement(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          sectionId,
          tactiqueId,
          newPlacementData,
          campaignData,
          currentTactique
        );
        return { id: placementId, ...newPlacementData };
      }
    );
  }, [allTactiques, executeOperation, campaignData]);

  /**
   * Gère la mise à jour d'un placement existant.
   *
   * @param {string} placementId - L'ID du placement à mettre à jour.
   * @param {Partial<Placement>} data - Les données partielles du placement à mettre à jour.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte parent (section, tactique) n'est pas trouvé.
   */
  const handleUpdatePlacement = useCallback(async (
    placementId: string, 
    data: Partial<Placement>
  ): Promise<void> => {
    const context = ensureContext();

    let sectionId = '';
    let tactiqueId = '';
    let currentTactique: Tactique | undefined;

    for (const [sId, sectionTactiques] of Object.entries(allTactiques)) {
      for (const tactique of sectionTactiques) {
        const placement = allPlacements[tactique.id]?.find(p => p.id === placementId);
        if (placement) {
          sectionId = sId;
          tactiqueId = tactique.id;
          currentTactique = tactique;
          break;
        }
      }
      if (sectionId) break;
    }

    if (!sectionId || !tactiqueId || !currentTactique) {
      throw new Error('Contexte parent non trouvé pour le placement');
    }

    return executeOperation(
      'Mise à jour placement',
      () => {
        console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesOperations.ts - Fonction: handleUpdatePlacement - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
        return updatePlacement(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          sectionId,
          tactiqueId,
          placementId,
          data,
          campaignData,
          currentTactique
        );
      }
    );
  }, [allTactiques, allPlacements, executeOperation, campaignData]);

  /**
   * Gère la suppression d'un placement et de ses enfants (créatifs).
   * Applique une suppression optimiste localement avant de supprimer sur Firebase.
   *
   * @param {string} sectionId - L'ID de la section de la tactique parente.
   * @param {string} tactiqueId - L'ID de la tactique parente.
   * @param {string} placementId - L'ID du placement à supprimer.
   */
  const handleDeletePlacement = useCallback((sectionId: string, tactiqueId: string, placementId: string) => {
    const context = ensureContext();

    removePlacementAndChildrenLocally(sectionId, tactiqueId, placementId);

    console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesOperations.ts - Fonction: handleDeletePlacement - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}");
    deletePlacement(
      context.clientId,
      context.campaignId,
      context.versionId,
      context.ongletId,
      sectionId,
      tactiqueId,
      placementId
    ).catch(error => {
      console.error('❌ Erreur suppression placement Firestore:', error);
      onRefresh();
    });
  }, [removePlacementAndChildrenLocally, onRefresh]);

  /**
   * Gère la création d'un nouveau créatif.
   *
   * @param {string} placementId - L'ID du placement parent.
   * @returns {Promise<Creatif>} Le créatif nouvellement créé.
   * @throws {Error} Si le contexte parent (section, tactique, placement) n'est pas trouvé.
   */
  const handleCreateCreatif = useCallback(async (placementId: string): Promise<Creatif> => {
    const context = ensureContext();

    let sectionId = '';
    let tactiqueId = '';
    let currentTactique: Tactique | undefined;
    let currentPlacement: Placement | undefined;

    for (const [sId, sectionTactiques] of Object.entries(allTactiques)) {
      for (const tactique of sectionTactiques) {
        currentTactique = tactique;
        const tactiquePlacements = allPlacements[tactique.id] || [];
        currentPlacement = tactiquePlacements.find(p => p.id === placementId);
        if (currentPlacement) {
          sectionId = sId;
          tactiqueId = tactique.id;
          break;
        }
      }
      if (sectionId) break;
    }

    if (!sectionId || !tactiqueId || !currentPlacement || !currentTactique) {
      throw new Error('Contexte parent non trouvé pour le créatif');
    }

    const newCreatifData: CreatifFormData = {
      CR_Label: 'Nouveau créatif',
      CR_Order: 0,
      CR_PlacementId: placementId
    };

    return executeOperation(
      'Création créatif',
      async () => {
        console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesOperations.ts - Fonction: handleCreateCreatif - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs");
        const creatifId = await createCreatif(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          sectionId,
          tactiqueId,
          placementId,
          newCreatifData,
          campaignData,
          currentTactique,
          currentPlacement
        );
        return { id: creatifId, ...newCreatifData };
      }
    );
  }, [allTactiques, allPlacements, executeOperation, campaignData]);

  /**
   * Gère la mise à jour d'un créatif existant.
   *
   * @param {string} creatifId - L'ID du créatif à mettre à jour.
   * @param {Partial<Creatif>} data - Les données partielles du créatif à mettre à jour.
   * @returns {Promise<void>}
   * @throws {Error} Si le contexte parent (section, tactique, placement) n'est pas trouvé.
   */
  const handleUpdateCreatif = useCallback(async (
    creatifId: string, 
    data: Partial<Creatif>
  ): Promise<void> => {
    const context = ensureContext();

    let sectionId = '';
    let tactiqueId = '';
    let placementId = '';
    let currentTactique: Tactique | undefined;
    let currentPlacement: Placement | undefined;

    for (const [pId, creatifsInPlacement] of Object.entries(allCreatifs)) {
      if (creatifsInPlacement.some(c => c.id === creatifId)) {
        placementId = pId;
        break;
      }
    }

    if (!placementId) {
      throw new Error('Placement parent non trouvé pour le créatif');
    }

    for (const tactiqueIdIter in allPlacements) {
        const placementsInTactique = allPlacements[tactiqueIdIter];
        currentPlacement = placementsInTactique.find(p => p.id === placementId);
        if (currentPlacement) {
            tactiqueId = tactiqueIdIter;
            break;
        }
    }

    if (!tactiqueId || !currentPlacement) {
      throw new Error('Tactique parent non trouvée pour le placement du créatif');
    }

    for (const sectionIdIter in allTactiques) {
      const tactiquesInSection = allTactiques[sectionIdIter];
      currentTactique = tactiquesInSection.find(t => t.id === tactiqueId);
      if (currentTactique) {
        sectionId = sectionIdIter;
        break;
      }
    }
    
    if (!sectionId || !currentTactique) {
      throw new Error('Section parente non trouvée pour le créatif');
    }

    return executeOperation(
      'Mise à jour créatif',
      () => {
        console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesOperations.ts - Fonction: handleUpdateCreatif - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifId}");
        return updateCreatif(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          sectionId,
          tactiqueId,
          placementId,
          creatifId,
          data,
          campaignData,
          currentTactique,
          currentPlacement
        );
      }
    );
  }, [allTactiques, allPlacements, allCreatifs, executeOperation, campaignData]);

  /**
   * Gère la suppression d'un créatif.
   * Applique une suppression optimiste localement avant de supprimer sur Firebase.
   *
   * @param {string} sectionId - L'ID de la section de la tactique parente.
   * @param {string} tactiqueId - L'ID de la tactique parente.
   * @param {string} placementId - L'ID du placement parent.
   * @param {string} creatifId - L'ID du créatif à supprimer.
   */
  const handleDeleteCreatif = useCallback((sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => {
    const context = ensureContext();

    removeCreatifLocally(sectionId, tactiqueId, placementId, creatifId);
    
    console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesOperations.ts - Fonction: handleDeleteCreatif - Path: clients/${context.clientId}/campaigns/${context.campaignId}/versions/${context.versionId}/onglets/${context.ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${creatifId}");
    deleteCreatif(
      context.clientId,
      context.campaignId,
      context.versionId,
      context.ongletId,
      sectionId,
      tactiqueId,
      placementId,
      creatifId
    ).catch(error => {
      console.error('❌ Erreur suppression créatif Firestore:', error);
      onRefresh();
    });
  }, [removeCreatifLocally, onRefresh]);

  return {
    handleCreateTactique,
    handleUpdateTactique,
    handleDeleteTactique,
    handleCreatePlacement,
    handleUpdatePlacement,
    handleDeletePlacement,
    handleCreateCreatif,
    handleUpdateCreatif,
    handleDeleteCreatif,
  };
};

/**
 * Hook simplifié pour les opérations CRUD basiques nécessitant uniquement le contexte client, campagne, version et onglet.
 *
 * @returns {{executeWithContext: (operation: (context: {clientId: string, campaignId: string, versionId: string, ongletId: string}) => Promise<T>) => Promise<T>}}
 * Un objet contenant la fonction executeWithContext pour exécuter des opérations avec le contexte.
 */
export function useBasicCrudOperations() {
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  const executeWithContext = useCallback(async <T>(
    operation: (context: {
      clientId: string;
      campaignId: string; 
      versionId: string;
      ongletId: string;
    }) => Promise<T>
  ): Promise<T> => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte incomplet');
    }

    return operation({
      clientId: selectedClient.clientId,
      campaignId: selectedCampaignId,
      versionId: selectedVersionId,
      ongletId: selectedOngletId
    });
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId]);

  return { executeWithContext };
}

export type { UseTactiquesOperationsProps, UseTactiquesOperationsReturn };