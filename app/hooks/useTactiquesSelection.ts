// app/hooks/useTactiquesSelection.ts - Version corrigée avec nettoyage complet

import { useState, useCallback } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { duplicateSelectedItems, DuplicationContext } from '../lib/duplicationService';

// ==================== TYPES ====================

interface UseTactiquesSelectionProps {
  sections: any[];
  tactiques: { [sectionId: string]: any[] };
  placements: { [tactiqueId: string]: any[] };
  creatifs: { [placementId: string]: any[] };
  onRefresh: (() => Promise<void>) | (() => void);
  onDeleteSection?: (sectionId: string) => Promise<void>;
  onDeleteTactique?: (sectionId: string, tactiqueId: string) => Promise<void>;
  onDeletePlacement?: (sectionId: string, tactiqueId: string, placementId: string) => Promise<void>;
  onDeleteCreatif?: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => Promise<void>;
  // 🔥 AJOUT: Callback pour forcer la réinitialisation complète
  onForceSelectionReset?: () => void;
}

interface UseTactiquesSelectionReturn {
  selectedItems: Set<string>;
  duplicationLoading: boolean;
  deletionLoading: boolean;
  handleSelectItems: (
    itemIds: string[],
    type: 'section' | 'tactique' | 'placement' | 'creatif',
    isSelected: boolean
  ) => void;
  handleClearSelection: () => void;
  handleDuplicateSelected: (itemIds: string[]) => Promise<void>;
  handleDeleteSelected: (itemIds: string[]) => Promise<void>;
  selectedItemsWithData: Array<{
    id: string;
    name: string;
    type: 'section' | 'tactique' | 'placement' | 'creatif';
    data?: any;
  }>;
}

// ==================== TYPES POUR LA SUPPRESSION ====================

interface ItemToDelete {
  id: string;
  type: 'section' | 'tactique' | 'placement' | 'creatif';
  sectionId: string;
  tactiqueId?: string;
  placementId?: string;
  name: string;
}

// ==================== HOOK PRINCIPAL ====================

export function useTactiquesSelection({
  sections,
  tactiques,
  placements,
  creatifs,
  onRefresh,
  onDeleteSection,
  onDeleteTactique,
  onDeletePlacement,
  onDeleteCreatif,
  onForceSelectionReset // 🔥 AJOUT
}: UseTactiquesSelectionProps): UseTactiquesSelectionReturn {

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  // ==================== ÉTATS ====================
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [duplicationLoading, setDuplicationLoading] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);

  // ==================== GESTION DES SÉLECTIONS ====================

  const handleSelectItems = useCallback((
    itemIds: string[],
    type: 'section' | 'tactique' | 'placement' | 'creatif',
    isSelected: boolean
  ) => {
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      itemIds.forEach(id => {
        if (isSelected) {
          newSelected.add(id);
        } else {
          newSelected.delete(id);
        }
      });
      return newSelected;
    });
  }, []);

  // 🔥 CORRECTION: Nettoyage complet avec réinitialisation forcée
  const handleClearSelection = useCallback(() => {
    console.log('🧹 Nettoyage complet de la sélection');
    
    // Nettoyer l'état local
    setSelectedItems(new Set());
    
    // 🔥 NOUVEAU: Forcer la réinitialisation de tous les hooks dépendants
    if (onForceSelectionReset) {
      console.log('🔄 Force reset de la logique de sélection');
      onForceSelectionReset();
    }
  }, [onForceSelectionReset]);

  // ==================== FONCTION DE NOTIFICATION ====================

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white px-4 py-2 rounded shadow-lg z-50 text-sm`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, type === 'success' ? 2000 : 3000);
  }, []);

  // ==================== FONCTION DE RECHERCHE D'ÉLÉMENTS ====================

  const findItemHierarchy = useCallback((itemId: string): ItemToDelete | null => {
    // Chercher dans les sections
    for (const section of sections) {
      if (section.id === itemId) {
        return {
          id: itemId,
          type: 'section',
          sectionId: section.id,
          name: section.SECTION_Name
        };
      }
      
      // Chercher dans les tactiques
      for (const tactique of (tactiques[section.id] || [])) {
        if (tactique.id === itemId) {
          return {
            id: itemId,
            type: 'tactique',
            sectionId: section.id,
            tactiqueId: tactique.id,
            name: tactique.TC_Label
          };
        }
        
        // Chercher dans les placements
        for (const placement of (placements[tactique.id] || [])) {
          if (placement.id === itemId) {
            return {
              id: itemId,
              type: 'placement',
              sectionId: section.id,
              tactiqueId: tactique.id,
              placementId: placement.id,
              name: placement.PL_Label
            };
          }
          
          // Chercher dans les créatifs
          for (const creatif of (creatifs[placement.id] || [])) {
            if (creatif.id === itemId) {
              return {
                id: itemId,
                type: 'creatif',
                sectionId: section.id,
                tactiqueId: tactique.id,
                placementId: placement.id,
                name: creatif.CR_Label
              };
            }
          }
        }
      }
    }
    
    return null;
  }, [sections, tactiques, placements, creatifs]);

  // ==================== SUPPRESSION GROUPÉE ====================

  const handleDeleteSelected = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0) {
      return;
    }

    // Vérifier que les fonctions de suppression sont disponibles
    if (!onDeleteSection || !onDeleteTactique || !onDeletePlacement || !onDeleteCreatif) {
      console.error('❌ Fonctions de suppression non disponibles');
      showNotification('❌ Fonctions de suppression non configurées', 'error');
      return;
    }

    // Construire la liste des éléments à supprimer avec leur hiérarchie
    const itemsToDelete: ItemToDelete[] = [];
    
    for (const itemId of itemIds) {
      const hierarchy = findItemHierarchy(itemId);
      if (hierarchy) {
        itemsToDelete.push(hierarchy);
      } else {
        console.warn('⚠️ Élément non trouvé dans la hiérarchie:', itemId);
      }
    }

    if (itemsToDelete.length === 0) {
      console.warn('⚠️ Aucun élément valide à supprimer');
      return;
    }

    // Confirmation utilisateur
    const itemsDescription = itemsToDelete.map(item => `${item.name} (${item.type})`).join(', ');
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer les ${itemsToDelete.length} éléments sélectionnés ?\n\n${itemsDescription}\n\n⚠️ Cette action est irréversible et supprimera également tous les éléments enfants.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    console.log('🗑️ Début suppression groupée:', itemsToDelete);

    try {
      setDeletionLoading(true);

      // Organisation par ordre de suppression (enfants d'abord)
      const creatifItems = itemsToDelete.filter(item => item.type === 'creatif');
      const placementItems = itemsToDelete.filter(item => item.type === 'placement');
      const tactiqueItems = itemsToDelete.filter(item => item.type === 'tactique');
      const sectionItems = itemsToDelete.filter(item => item.type === 'section');

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // 1. Supprimer les créatifs
      for (const item of creatifItems) {
        try {
          await onDeleteCreatif(item.sectionId, item.tactiqueId!, item.placementId!, item.id);
          successCount++;
          console.log('✅ Créatif supprimé:', item.name);
        } catch (error) {
          errorCount++;
          const errorMsg = `Erreur suppression créatif "${item.name}"`;
          errors.push(errorMsg);
          console.error('❌', errorMsg, error);
        }
      }

      // 2. Supprimer les placements
      for (const item of placementItems) {
        try {
          await onDeletePlacement(item.sectionId, item.tactiqueId!, item.id);
          successCount++;
          console.log('✅ Placement supprimé:', item.name);
        } catch (error) {
          errorCount++;
          const errorMsg = `Erreur suppression placement "${item.name}"`;
          errors.push(errorMsg);
          console.error('❌', errorMsg, error);
        }
      }

      // 3. Supprimer les tactiques
      for (const item of tactiqueItems) {
        try {
          await onDeleteTactique(item.sectionId, item.id);
          successCount++;
          console.log('✅ Tactique supprimée:', item.name);
        } catch (error) {
          errorCount++;
          const errorMsg = `Erreur suppression tactique "${item.name}"`;
          errors.push(errorMsg);
          console.error('❌', errorMsg, error);
        }
      }

      // 4. Supprimer les sections
      for (const item of sectionItems) {
        try {
          await onDeleteSection(item.id);
          successCount++;
          console.log('✅ Section supprimée:', item.name);
        } catch (error) {
          errorCount++;
          const errorMsg = `Erreur suppression section "${item.name}"`;
          errors.push(errorMsg);
          console.error('❌', errorMsg, error);
        }
      }

      // Résultats
      if (successCount > 0) {
        const successMessage = `✅ ${successCount} élément${successCount > 1 ? 's supprimés' : ' supprimé'} avec succès`;
        showNotification(successMessage);
      }

      if (errorCount > 0) {
        const errorMessage = `❌ ${errorCount} erreur${errorCount > 1 ? 's' : ''} lors de la suppression`;
        showNotification(errorMessage, 'error');
        console.error('❌ Erreurs de suppression:', errors);
      }

      // 🔥 CORRECTION: Nettoyage complet AVANT le refresh
      console.log('🧹 Nettoyage complet après suppression');
      handleClearSelection();
      
      // Attendre un petit délai pour s'assurer que le nettoyage est effectif
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Puis rafraîchir
      await Promise.resolve(onRefresh());

    } catch (error) {
      console.error('💥 Erreur critique lors de la suppression groupée:', error);
      showNotification('❌ Erreur critique lors de la suppression', 'error');
      
      // 🔥 CORRECTION: Nettoyer même en cas d'erreur
      handleClearSelection();
    } finally {
      setDeletionLoading(false);
    }
  }, [
    findItemHierarchy,
    onDeleteSection,
    onDeleteTactique, 
    onDeletePlacement,
    onDeleteCreatif,
    handleClearSelection,
    onRefresh,
    showNotification
  ]);

  // ==================== DUPLICATION (INCHANGÉE) ====================

  const handleDuplicateSelected = useCallback(async (itemIds: string[]) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('Contexte manquant pour la duplication');
      showNotification('❌ Contexte manquant pour la duplication', 'error');
      return;
    }

    if (itemIds.length === 0) {
      return;
    }

    console.log('🔄 Début duplication de', itemIds.length, 'éléments:', itemIds);

    try {
      setDuplicationLoading(true);

      const context: DuplicationContext = {
        clientId: selectedClient.clientId,
        campaignId: selectedCampaignId,
        versionId: selectedVersionId,
        ongletId: selectedOngletId
      };

      const itemHierarchy = {
        sections,
        tactiques,
        placements,
        creatifs
      };

      const result = await duplicateSelectedItems(context, itemIds, itemHierarchy);

      if (result.success && result.duplicatedIds.length > 0) {
        console.log('✅ Duplication réussie:', result.duplicatedIds);
        
        const successMessage = `✅ ${result.duplicatedIds.length} élément${
          result.duplicatedIds.length > 1 ? 's dupliqués' : ' dupliqué'
        } avec succès`;
        
        showNotification(successMessage);

        await Promise.resolve(onRefresh());
        handleClearSelection();

      } else {
        const errorMessages = result.errors.length > 0 ? result.errors : ['Erreur inconnue lors de la duplication'];
        console.error('❌ Erreurs duplication:', errorMessages);
        showNotification(`❌ Erreur duplication: ${errorMessages[0]}`, 'error');
      }

    } catch (error) {
      console.error('💥 Erreur critique duplication:', error);
      showNotification('❌ Erreur critique lors de la duplication', 'error');
    } finally {
      setDuplicationLoading(false);
    }
  }, [
    selectedClient?.clientId,
    selectedCampaignId,
    selectedVersionId,
    selectedOngletId,
    sections,
    tactiques,
    placements,
    creatifs,
    onRefresh,
    handleClearSelection,
    showNotification
  ]);

  // ==================== DONNÉES ENRICHIES POUR LES ÉLÉMENTS SÉLECTIONNÉS ====================

  const selectedItemsWithData = useCallback(() => {
    const result: Array<{
      id: string;
      name: string;
      type: 'section' | 'tactique' | 'placement' | 'creatif';
      data?: any;
    }> = [];

    Array.from(selectedItems).forEach(itemId => {
      const hierarchy = findItemHierarchy(itemId);
      if (hierarchy) {
        result.push({
          id: hierarchy.id,
          name: hierarchy.name,
          type: hierarchy.type,
          data: null
        });
      }
    });

    return result;
  }, [selectedItems, findItemHierarchy]);

  // ==================== RETURN ====================

  return {
    selectedItems,
    duplicationLoading,
    deletionLoading,
    handleSelectItems,
    handleClearSelection,
    handleDuplicateSelected,
    handleDeleteSelected,
    selectedItemsWithData: selectedItemsWithData()
  };
}