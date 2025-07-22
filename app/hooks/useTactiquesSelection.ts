// app/hooks/useTactiquesSelection.ts - Hook pour la gestion des sélections et duplication

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
}

interface UseTactiquesSelectionReturn {
  selectedItems: Set<string>;
  duplicationLoading: boolean;
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

// ==================== HOOK PRINCIPAL ====================

export function useTactiquesSelection({
  sections,
  tactiques,
  placements,
  creatifs,
  onRefresh
}: UseTactiquesSelectionProps): UseTactiquesSelectionReturn {

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  // ==================== ÉTATS ====================
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [duplicationLoading, setDuplicationLoading] = useState(false);

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

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

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

  // ==================== DUPLICATION ====================

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

  // ==================== SUPPRESSION ====================

  const handleDeleteSelected = useCallback(async (itemIds: string[]) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer les ${itemIds.length} éléments sélectionnés ? Cette action est irréversible.`)) {
      return;
    }

    console.log('🗑️ TODO: Implémenter la suppression des éléments:', itemIds);
    
    // TODO: Implémenter la logique de suppression avec les vraies fonctions
    // Pour l'instant, on fait juste un nettoyage
    handleClearSelection();
    showNotification('🔄 Suppression en cours de développement');
    
    // Uncomment quand la logique de suppression sera implémentée
    // await Promise.resolve(onRefresh());
  }, [handleClearSelection, showNotification]);

  // ==================== DONNÉES ENRICHIES POUR LES ÉLÉMENTS SÉLECTIONNÉS ====================

  const selectedItemsWithData = useCallback(() => {
    const result: Array<{
      id: string;
      name: string;
      type: 'section' | 'tactique' | 'placement' | 'creatif';
      data?: any;
    }> = [];

    Array.from(selectedItems).forEach(itemId => {
      // Chercher dans les sections
      for (const section of sections) {
        if (section.id === itemId) {
          result.push({
            id: itemId,
            name: section.SECTION_Name,
            type: 'section',
            data: section
          });
          return;
        }
        
        // Chercher dans les tactiques
        for (const tactique of (tactiques[section.id] || [])) {
          if (tactique.id === itemId) {
            result.push({
              id: itemId,
              name: tactique.TC_Label,
              type: 'tactique',
              data: tactique
            });
            return;
          }
          
          // Chercher dans les placements
          for (const placement of (placements[tactique.id] || [])) {
            if (placement.id === itemId) {
              result.push({
                id: itemId,
                name: placement.PL_Label,
                type: 'placement',
                data: placement
              });
              return;
            }
            
            // Chercher dans les créatifs
            for (const creatif of (creatifs[placement.id] || [])) {
              if (creatif.id === itemId) {
                result.push({
                  id: itemId,
                  name: creatif.CR_Label,
                  type: 'creatif',
                  data: creatif
                });
                return;
              }
            }
          }
        }
      }
    });

    return result;
  }, [selectedItems, sections, tactiques, placements, creatifs]);

  // ==================== RETURN ====================

  return {
    selectedItems,
    duplicationLoading,
    handleSelectItems,
    handleClearSelection,
    handleDuplicateSelected,
    handleDeleteSelected,
    selectedItemsWithData: selectedItemsWithData()
  };
}