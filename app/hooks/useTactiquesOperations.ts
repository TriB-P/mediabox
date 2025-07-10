// app/hooks/useTactiquesOperations.ts - Version finale avec suppression optimiste intégrée

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

// ==================== TYPES ====================

interface UseTactiquesOperationsProps {
  selectedCampaign: Campaign | null;
  selectedOnglet: Onglet | null;
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  onRefresh: () => Promise<void>;

  // Fonctions de suppression locale pour mises à jour optimistes
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
}

// ==================== HOOK PRINCIPAL ====================

export const useTactiquesOperations = ({
  selectedCampaign,
  selectedOnglet,
  sections,
  tactiques,
  onRefresh,
  removeSectionLocally,
  removeTactiqueAndChildrenLocally,
  removePlacementAndChildrenLocally,
  removeCreatifLocally
}: UseTactiquesOperationsProps): UseTactiquesOperationsReturn => {

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();
  
  // ==================== UTILITAIRES ====================
  
  /**
   * Vérifie que le contexte est complet pour les opérations
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
   * Exécute une opération avec gestion d'erreur et refresh conditionnel
   */
  const executeOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>,
    skipRefresh = false
  ): Promise<T> => {
    try {
      console.log(`🔄 ${operationName}...`);
      const result = await operation();
      console.log(`✅ ${operationName} réussi`);
      
      if (!skipRefresh) {
        await onRefresh();
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Erreur ${operationName}:`, error);
      // En cas d'erreur, toujours refresh pour resynchroniser
      await onRefresh();
      throw error;
    }
  }, [onRefresh]);
  
  // ==================== OPÉRATIONS TACTIQUES ====================

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

  const handleUpdateTactique = useCallback(async (
    sectionId: string, 
    tactiqueId: string, 
    data: Partial<Tactique>
  ): Promise<void> => {
    const context = ensureContext();

    return executeOperation(
      'Mise à jour tactique',
      () => updateTactique(
        context.clientId,
        context.campaignId,
        context.versionId,
        context.ongletId,
        sectionId,
        tactiqueId,
        data
      )
    );
  }, [executeOperation]);

  const handleDeleteTactique = useCallback((sectionId: string, tactiqueId: string) => {
    const context = ensureContext();

    // Mise à jour optimiste immédiate
    removeTactiqueAndChildrenLocally(sectionId, tactiqueId);
    console.log(`🗑️ Suppression optimiste tactique ${tactiqueId}`);
    
    // Suppression en arrière-plan
    deleteTactique(
      context.clientId,
      context.campaignId,
      context.versionId,
      context.ongletId,
      sectionId,
      tactiqueId
    ).catch(error => {
      console.error('❌ Erreur suppression tactique Firestore:', error);
      // En cas d'échec, resynchroniser avec la base
      onRefresh();
    });
  }, [removeTactiqueAndChildrenLocally, onRefresh]);

  // ==================== OPÉRATIONS PLACEMENTS ====================

  const handleCreatePlacement = useCallback(async (tactiqueId: string): Promise<Placement> => {
    const context = ensureContext();

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

    return executeOperation(
      'Création placement',
      async () => {
        const placementId = await createPlacement(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          sectionId,
          tactiqueId,
          newPlacementData
        );
        return { id: placementId, ...newPlacementData };
      }
    );
  }, [tactiques, executeOperation]);

  const handleUpdatePlacement = useCallback(async (
    placementId: string, 
    data: Partial<Placement>
  ): Promise<void> => {
    const context = ensureContext();

    // Trouver le contexte parent (section et tactique)
    let sectionId = '';
    let tactiqueId = '';

    for (const [sId, sectionTactiques] of Object.entries(tactiques)) {
      for (const tactique of sectionTactiques) {
        // Utiliser l'ID de tactique directement si disponible dans les données
        if (data.PL_TactiqueId && tactique.id === data.PL_TactiqueId) {
          sectionId = sId;
          tactiqueId = tactique.id;
          break;
        }
      }
      if (sectionId) break;
    }

    if (!sectionId || !tactiqueId) {
      throw new Error('Contexte parent non trouvé pour le placement');
    }

    return executeOperation(
      'Mise à jour placement',
      () => updatePlacement(
        context.clientId,
        context.campaignId,
        context.versionId,
        context.ongletId,
        sectionId,
        tactiqueId,
        placementId,
        data
      )
    );
  }, [tactiques, executeOperation]);

  const handleDeletePlacement = useCallback((sectionId: string, tactiqueId: string, placementId: string) => {
    const context = ensureContext();

    // Mise à jour optimiste immédiate
    removePlacementAndChildrenLocally(sectionId, tactiqueId, placementId);
    console.log(`🗑️ Suppression optimiste placement ${placementId}`);

    // Suppression en arrière-plan
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

  // ==================== OPÉRATIONS CRÉATIFS ====================

  const handleCreateCreatif = useCallback(async (placementId: string): Promise<Creatif> => {
    const context = ensureContext();

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

    return executeOperation(
      'Création créatif',
      async () => {
        const creatifId = await createCreatif(
          context.clientId,
          context.campaignId,
          context.versionId,
          context.ongletId,
          sectionId,
          tactiqueId,
          placementId,
          newCreatifData
        );
        return { id: creatifId, ...newCreatifData };
      }
    );
  }, [tactiques, executeOperation]);

  const handleUpdateCreatif = useCallback(async (
    creatifId: string, 
    data: Partial<Creatif>
  ): Promise<void> => {
    const context = ensureContext();

    // Trouver le contexte parent (simplification - utiliser le premier trouvé)
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

    return executeOperation(
      'Mise à jour créatif',
      () => updateCreatif(
        context.clientId,
        context.campaignId,
        context.versionId,
        context.ongletId,
        sectionId,
        tactiqueId,
        placementId,
        creatifId,
        data
      )
    );
  }, [tactiques, executeOperation]);

  const handleDeleteCreatif = useCallback((sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => {
    const context = ensureContext();

    // Mise à jour optimiste immédiate
    removeCreatifLocally(sectionId, tactiqueId, placementId, creatifId);
    console.log(`🗑️ Suppression optimiste créatif ${creatifId}`);
    
    // Suppression en arrière-plan
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

  // ==================== RETURN ====================

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
  };
};

// ==================== HOOK UTILITAIRE POUR LES OPÉRATIONS CRUD ====================

/**
 * Hook simplifié pour les opérations basiques sans contexte complexe
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

// ==================== TYPES EXPORT ====================

export type { UseTactiquesOperationsProps, UseTactiquesOperationsReturn };