/**
 * Ce hook gère la sélection, la duplication et la suppression d'éléments (sections, tactiques, placements, créatifs)
 * dans l'interface utilisateur. Il fournit des fonctions pour manipuler l'état de sélection,
 * interagir avec les services de duplication et de suppression, et afficher des notifications.
 * Il est utilisé pour centraliser la logique de gestion des éléments hiérarchiques.
 */
import { useState, useCallback } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { duplicateSelectedItems, DuplicationContext } from '../lib/duplicationService';
import { useTranslation } from '../contexts/LanguageContext';

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

interface ItemToDelete {
  id: string;
  type: 'section' | 'tactique' | 'placement' | 'creatif';
  sectionId: string;
  tactiqueId?: string;
  placementId?: string;
  name: string;
}

/**
 * Hook principal pour gérer la sélection, la duplication et la suppression des éléments.
 *
 * @param {UseTactiquesSelectionProps} props - Les propriétés nécessaires au hook.
 * @param {any[]} props.sections - Liste des sections.
 * @param {{ [sectionId: string]: any[] }} props.tactiques - Objet mappant les tactiques par ID de section.
 * @param {{ [tactiqueId: string]: any[] }} props.placements - Objet mappant les placements par ID de tactique.
 * @param {{ [placementId: string]: any[] }} props.creatifs - Objet mappant les créatifs par ID de placement.
 * @param {(() => Promise<void>) | (() => void)} props.onRefresh - Fonction de rappel pour rafraîchir les données.
 * @param {(sectionId: string) => Promise<void>} [props.onDeleteSection] - Fonction de rappel pour supprimer une section.
 * @param {(sectionId: string, tactiqueId: string) => Promise<void>} [props.onDeleteTactique] - Fonction de rappel pour supprimer une tactique.
 * @param {(sectionId: string, tactiqueId: string, placementId: string) => Promise<void>} [props.onDeletePlacement] - Fonction de rappel pour supprimer un placement.
 * @param {(sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => Promise<void>} [props.onDeleteCreatif] - Fonction de rappel pour supprimer un créatif.
 * @param {() => void} [props.onForceSelectionReset] - Fonction de rappel pour forcer la réinitialisation complète de la sélection.
 * @returns {UseTactiquesSelectionReturn} L'objet retourné contenant l'état et les fonctions de manipulation.
 */
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
  onForceSelectionReset
}: UseTactiquesSelectionProps): UseTactiquesSelectionReturn {

  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [duplicationLoading, setDuplicationLoading] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);

  /**
   * Gère la sélection ou la désélection d'un ou plusieurs éléments.
   *
   * @param {string[]} itemIds - Les IDs des éléments à sélectionner ou désélectionner.
   * @param {'section' | 'tactique' | 'placement' | 'creatif'} type - Le type des éléments.
   * @param {boolean} isSelected - Vrai pour sélectionner, faux pour désélectionner.
   * @returns {void}
   */
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

  /**
   * Efface complètement la sélection actuelle et force une réinitialisation des hooks dépendants si un callback est fourni.
   *
   * @returns {void}
   */
  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set());
    if (onForceSelectionReset) {
      onForceSelectionReset();
    }
  }, [onForceSelectionReset]);

  /**
   * Affiche une notification temporaire en haut à droite de l'écran.
   *
   * @param {string} message - Le message à afficher dans la notification.
   * @param {'success' | 'error'} [type='success'] - Le type de notification (succès ou erreur).
   * @returns {void}
   */
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

  /**
   * Recherche la hiérarchie complète (section, tactique, placement, créatif) d'un élément donné par son ID.
   *
   * @param {string} itemId - L'ID de l'élément à rechercher.
   * @returns {ItemToDelete | null} L'objet ItemToDelete contenant les informations hiérarchiques, ou null si l'élément n'est pas trouvé.
   */
  const findItemHierarchy = useCallback((itemId: string): ItemToDelete | null => {
    for (const section of sections) {
      if (section.id === itemId) {
        return {
          id: itemId,
          type: 'section',
          sectionId: section.id,
          name: section.SECTION_Name
        };
      }
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

  /**
   * Gère la suppression groupée des éléments sélectionnés.
   * Une confirmation est demandée à l'utilisateur avant la suppression.
   * Les éléments sont supprimés dans l'ordre hiérarchique inverse (créatifs, placements, tactiques, sections).
   *
   * @param {string[]} itemIds - Les IDs des éléments à supprimer.
   * @returns {Promise<void>}
   */
  const handleDeleteSelected = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0) {
      return;
    }

    if (!onDeleteSection || !onDeleteTactique || !onDeletePlacement || !onDeleteCreatif) {
      console.error('Fonctions de suppression non disponibles');
      showNotification(t('useTactiquesSelection.notifications.deleteFunctionsNotConfigured'), 'error');
      return;
    }

    const itemsToDelete: ItemToDelete[] = [];
    
    for (const itemId of itemIds) {
      const hierarchy = findItemHierarchy(itemId);
      if (hierarchy) {
        itemsToDelete.push(hierarchy);
      } else {
        console.warn('Élément non trouvé dans la hiérarchie:', itemId);
      }
    }

    if (itemsToDelete.length === 0) {
      console.warn('Aucun élément valide à supprimer');
      return;
    }

    const itemsDescription = itemsToDelete.map(item => `${item.name} (${item.type})`).join(', ');
    const confirmMessage = `${t('useTactiquesSelection.deleteConfirm.areYouSure')} ${itemsToDelete.length} ${t('useTactiquesSelection.deleteConfirm.selectedItems')}\n\n${itemsDescription}\n\n${t('useTactiquesSelection.deleteConfirm.irreversibleWarning')}`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletionLoading(true);

      const creatifItems = itemsToDelete.filter(item => item.type === 'creatif');
      const placementItems = itemsToDelete.filter(item => item.type === 'placement');
      const tactiqueItems = itemsToDelete.filter(item => item.type === 'tactique');
      const sectionItems = itemsToDelete.filter(item => item.type === 'section');

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const item of creatifItems) {
        try {
          console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesSelection.ts - Fonction: handleDeleteSelected - Path: creatifs");
          await onDeleteCreatif(item.sectionId, item.tactiqueId!, item.placementId!, item.id);
          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = `${t('useTactiquesSelection.notifications.errorDeleteCreative')} "${item.name}"`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      for (const item of placementItems) {
        try {
          console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesSelection.ts - Fonction: handleDeleteSelected - Path: placements");
          await onDeletePlacement(item.sectionId, item.tactiqueId!, item.id);
          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = `${t('useTactiquesSelection.notifications.errorDeletePlacement')} "${item.name}"`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      for (const item of tactiqueItems) {
        try {
          console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesSelection.ts - Fonction: handleDeleteSelected - Path: tactiques");
          await onDeleteTactique(item.sectionId, item.id);
          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = `${t('useTactiquesSelection.notifications.errorDeleteTactic')} "${item.name}"`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      for (const item of sectionItems) {
        try {
          console.log("FIREBASE: ÉCRITURE - Fichier: useTactiquesSelection.ts - Fonction: handleDeleteSelected - Path: sections");
          await onDeleteSection(item.id);
          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = `${t('useTactiquesSelection.notifications.errorDeleteSection')} "${item.name}"`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      if (successCount > 0) {
        const successMessage = `✅ ${successCount} ${successCount > 1 ? t('useTactiquesSelection.notifications.deleteSuccessPlural') : t('useTactiquesSelection.notifications.deleteSuccessSingular')}`;
        showNotification(successMessage);
      }

      if (errorCount > 0) {
        const errorMessage = `❌ ${errorCount} ${errorCount > 1 ? t('useTactiquesSelection.notifications.deleteErrorPlural') : t('useTactiquesSelection.notifications.deleteErrorSingular')}`;
        showNotification(errorMessage, 'error');
        console.error('Erreurs de suppression:', errors);
      }

      handleClearSelection();
      await new Promise(resolve => setTimeout(resolve, 100));
      await Promise.resolve(onRefresh());

    } catch (error) {
      console.error('Erreur critique lors de la suppression groupée:', error);
      showNotification(t('useTactiquesSelection.notifications.criticalDeleteError'), 'error');
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
    showNotification,
    t
  ]);

  /**
   * Gère la duplication des éléments sélectionnés.
   * Requiert le contexte client, campagne, version et onglet pour effectuer la duplication.
   *
   * @param {string[]} itemIds - Les IDs des éléments à dupliquer.
   * @returns {Promise<void>}
   */
  const handleDuplicateSelected = useCallback(async (itemIds: string[]) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('Contexte manquant pour la duplication');
      showNotification(t('useTactiquesSelection.notifications.missingContextDuplication'), 'error');
      return;
    }

    if (itemIds.length === 0) {
      return;
    }

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
        const successMessage = `✅ ${result.duplicatedIds.length} ${
          result.duplicatedIds.length > 1 ? t('useTactiquesSelection.notifications.duplicateSuccessPlural') : t('useTactiquesSelection.notifications.duplicateSuccessSingular')
        }`;
        
        showNotification(successMessage);

        await Promise.resolve(onRefresh());
        handleClearSelection();

      } else {
        const errorMessages = result.errors.length > 0 ? result.errors : [t('useTactiquesSelection.notifications.unknownDuplicationError')];
        console.error('Erreurs duplication:', errorMessages);
        showNotification(`${t('useTactiquesSelection.notifications.duplicationError')} ${errorMessages[0]}`, 'error');
      }

    } catch (error) {
      console.error('Erreur critique duplication:', error);
      showNotification(t('useTactiquesSelection.notifications.criticalDuplicationError'), 'error');
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
    showNotification,
    t
  ]);

  /**
   * Retourne une liste des éléments actuellement sélectionnés avec leurs données enrichies.
   *
   * @returns {Array<{ id: string; name: string; type: 'section' | 'tactique' | 'placement' | 'creatif'; data?: any; }>} La liste des éléments sélectionnés avec leurs détails.
   */
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