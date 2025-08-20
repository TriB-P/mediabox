// app/components/AdOps/AdOpsTacticTable.tsx
/**
 * Composant AdOpsTacticTable - Logique métier et gestion d'état
 * RESPONSABILITÉS : États, calculs, effets, fonctions métier
 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useClient } from '../../contexts/ClientContext';
import AdOpsTableInterface from './AdOpsTableInterface';
import {
  createCM360Tag,
  createTactiqueMetricsTag,
  deleteAllCM360TagsForItem,
  deleteTactiqueMetricsTags,
  calculateTactiqueMetricsStatus,
  CM360TagHistory
} from '../../lib/cm360Service';

// Import des types unifiés
import {
  AdOpsTactique,
  AdOpsPlacement,
  AdOpsCreative,
  AdOpsTableRow as TableRowType,
  AdOpsCreativesData,
  AdOpsTacticTableProps,
  CM360Status,
  AdOpsFilterState,
  AdOpsSelectionState,
  AdOpsFormatters
} from '../../types/adops';

// ================================
// COMPOSANT PRINCIPAL - LOGIQUE
// ================================

export default function AdOpsTacticTable({ 
  selectedTactiques,
  selectedCampaign, 
  selectedVersion,
  cm360Tags,
  creativesData,
  onCM360TagsReload,
  onDataReload
}: AdOpsTacticTableProps) {
  const { selectedClient } = useClient();
  
  // ================================
  // ÉTATS CENTRALISÉS
  // ================================
  
  const [tableRows, setTableRows] = useState<TableRowType[]>([]);
  const [selectionState, setSelectionState] = useState<AdOpsSelectionState>({
    selectedRows: new Set<string>(),
    lastSelectedIndex: null
  });
  const [filterState, setFilterState] = useState<AdOpsFilterState>({
    searchTerm: '',
    cm360Filter: 'all',
    colorFilter: 'all',
    showTaxonomies: false,
    showBudgetParams: true,
    showTactiques: true,
    showPlacements: true,
    showCreatives: true,
    isFiltersVisible: false
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [cm360Loading, setCm360Loading] = useState(false);

  // ================================
  // FONCTIONS UTILITAIRES MÉMORISÉES
  // ================================

  /**
   * Filtre les tags CM360 pour une tactique spécifique
   */
  const getFilteredCM360Tags = useCallback((tactiqueId: string): Map<string, CM360TagHistory> => {
    if (!cm360Tags) return new Map();
    
    const filtered = new Map<string, CM360TagHistory>();
    const prefix = `tactique-${tactiqueId}-`;
    
    cm360Tags.forEach((history, key) => {
      if (key.startsWith(prefix)) {
        const localKey = key.substring(prefix.length);
        filtered.set(localKey, history);
      }
    });
    
    return filtered;
  }, [cm360Tags]);

  /**
   * Calcule le statut CM360 d'une ligne
   */
  const getRowCM360Status = useCallback((row: TableRowType): CM360Status => {
    if (row.type === 'tactique') {
      const filteredTags = getFilteredCM360Tags(row.data.id);
      const metricsHistory = filteredTags.get('metrics-tactics');
      return calculateTactiqueMetricsStatus(row.data as AdOpsTactique, metricsHistory);
    }
    
    const rowId = `${row.type}-${row.data.id}`;
    const tactiqueId = row.tactiqueId!;
    const filteredTags = getFilteredCM360Tags(tactiqueId);
    const history = filteredTags.get(rowId);
    
    if (!history?.latestTag) return 'none';
    return history.hasChanges ? 'changed' : 'created';
  }, [getFilteredCM360Tags]);

  /**
   * Construit la structure hiérarchique du tableau
   */
  const buildTableRows = useCallback((tactiques: AdOpsTactique[]): TableRowType[] => {
    return tactiques.map(tactique => {
      const tactiqueRow: TableRowType = {
        type: 'tactique',
        level: 0,
        data: tactique,
        isExpanded: true,
        children: []
      };
      
      tactiqueRow.children = tactique.placementsWithTags.map(placement => {
        const placementRow: TableRowType = {
          type: 'placement',
          level: 1,
          data: placement,
          tactiqueId: tactique.id,
          isExpanded: true,
          children: []
        };
        
        const creatives = creativesData?.[tactique.id]?.[placement.id] || [];
        placementRow.children = creatives.map(creative => ({
          type: 'creative',
          level: 2,
          data: creative,
          tactiqueId: tactique.id,
          placementId: placement.id
        }));
        
        return placementRow;
      });
      
      return tactiqueRow;
    });
  }, [creativesData]);

  /**
   * Aplati la structure hiérarchique
   */
  const getFlattenedRows = useMemo((): TableRowType[] => {
    const flattened: TableRowType[] = [];
    
    const flattenRecursive = (rows: TableRowType[]) => {
      rows.forEach(row => {
        flattened.push(row);
        if (row.isExpanded && row.children) {
          flattenRecursive(row.children);
        }
      });
    };
    
    flattenRecursive(tableRows);
    return flattened;
  }, [tableRows]);

  /**
   * Filtre les lignes selon les critères
   */
  const getFilteredRows = useMemo((): TableRowType[] => {
    let baseRows = getFlattenedRows;
    
    // Filtre par type de ligne
    baseRows = baseRows.filter(row => {
      if (row.type === 'tactique' && !filterState.showTactiques) return false;
      if (row.type === 'placement' && !filterState.showPlacements) return false;
      if (row.type === 'creative' && !filterState.showCreatives) return false;
      return true;
    });
    
    // Filtre de recherche
    if (filterState.searchTerm.trim()) {
      const searchLower = filterState.searchTerm.toLowerCase();
      baseRows = baseRows.filter(row => {
        const label = row.type === 'tactique' ? (row.data as AdOpsTactique).TC_Label :
                     row.type === 'placement' ? (row.data as AdOpsPlacement).PL_Label :
                     (row.data as AdOpsCreative).CR_Label;
        return label?.toLowerCase().includes(searchLower);
      });
    }
    
    // Filtre CM360
    if (filterState.cm360Filter !== 'all') {
      baseRows = baseRows.filter(row => {
        const status = getRowCM360Status(row);
        return status === filterState.cm360Filter;
      });
    }
    
    // Filtre par couleur
    if (filterState.colorFilter !== 'all') {
      baseRows = baseRows.filter(row => {
        const userColor = row.type === 'tactique'
          ? (row.data as AdOpsTactique).TC_Adops_Color
          : row.type === 'placement' 
          ? (row.data as AdOpsPlacement).PL_Adops_Color 
          : (row.data as AdOpsCreative).CR_Adops_Color;
        
        if (filterState.colorFilter === 'none') {
          return !userColor;
        } else {
          return userColor === filterState.colorFilter;
        }
      });
    }
    
    return baseRows;
  }, [getFlattenedRows, filterState, getRowCM360Status]);

  // ================================
  // FONCTIONS DE FORMATAGE
  // ================================

  const formatters: AdOpsFormatters = useMemo(() => ({
    formatCurrency: (amount: number | undefined, currency: string | undefined): string => {
      if (amount === undefined || amount === null) return 'N/A';
      const formattedAmount = new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 2 }).format(amount);
      const effectiveCurrency = currency || 'CAD';
      return effectiveCurrency === 'CAD' ? `${formattedAmount} $` : `${formattedAmount} ${effectiveCurrency}`;
    },

    formatNumber: (num: number | undefined): string => {
      if (num === undefined || num === null) return 'N/A';
      return new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 2 }).format(num);
    },

    formatDate: (dateString: string | undefined): string => {
      if (!dateString) return '-';
      try {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          const localDate = new Date(year, month, day);
          return localDate.toLocaleDateString('fr-CA');
        }
        return dateString;
      } catch {
        return dateString;
      }
    }
  }), []);

  // ================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ================================

  const toggleExpanded = useCallback((rowId: string, rowType: string) => {
    setTableRows(prev => {
      const updateRows = (rows: TableRowType[]): TableRowType[] => {
        return rows.map(row => {
          if (row.type === rowType && row.data.id === rowId.split('-')[1]) {
            return { ...row, isExpanded: !row.isExpanded };
          }
          if (row.children) {
            return { ...row, children: updateRows(row.children) };
          }
          return row;
        });
      };
      return updateRows(prev);
    });
  }, []);

  const handleRowSelection = useCallback((rowId: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setSelectionState(prev => {
      const newSelection = new Set(prev.selectedRows);
      const filteredRows = getFilteredRows;
      
      if (event.shiftKey && prev.lastSelectedIndex !== null) {
        const startIndex = Math.min(prev.lastSelectedIndex, index);
        const endIndex = Math.max(prev.lastSelectedIndex, index);
        
        for (let i = startIndex; i <= endIndex; i++) {
          if (filteredRows[i]) {
            const currentRowId = `${filteredRows[i].type}-${filteredRows[i].data.id}`;
            newSelection.add(currentRowId);
          }
        }
      } else {
        if (newSelection.has(rowId)) {
          newSelection.delete(rowId);
        } else {
          newSelection.add(rowId);
        }
      }
      
      return {
        selectedRows: newSelection,
        lastSelectedIndex: index
      };
    });
  }, [getFilteredRows]);

  const copyToClipboard = useCallback(async (value: string | number | undefined, fieldName: string) => {
    if (value === undefined || value === null) return;
    
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('❌ Erreur copie:', err);
    }
  }, []);

  // ================================
  // FONCTIONS CM360
  // ================================

  const selectedHasTags = useCallback((): boolean => {
    for (const rowId of selectionState.selectedRows) {
      const [type, id] = rowId.split('-');
      
      if (type === 'tactique') {
        const filteredTags = getFilteredCM360Tags(id);
        const metricsHistory = filteredTags.get('metrics-tactics');
        if (metricsHistory?.latestTag) return true;
      } else {
        for (const tactique of selectedTactiques) {
          const filteredTags = getFilteredCM360Tags(tactique.id);
          const history = filteredTags.get(rowId);
          if (history?.latestTag) return true;
        }
      }
    }
    return false;
  }, [selectionState.selectedRows, selectedTactiques, getFilteredCM360Tags]);

  const createCM360Tags = useCallback(async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    setCm360Loading(true);
    const clientId = selectedClient.clientId;
    
    try {
      const tagPromises: Promise<string | void>[] = [];
      const processedTactiques = new Set<string>();
      
      selectionState.selectedRows.forEach(rowId => {
        const [type, itemId] = rowId.split('-');
        
        if (type === 'tactique') {
          if (processedTactiques.has(itemId)) return;
          processedTactiques.add(itemId);
          
          const tactique = selectedTactiques.find(t => t.id === itemId);
          if (!tactique) return;
          
          const metricsPromise = createTactiqueMetricsTag(
            clientId,
            selectedCampaign.id,
            selectedVersion.id,
            tactique.ongletId,
            tactique.sectionId,
            tactique
          );
          
          tagPromises.push(metricsPromise);
          
        } else if (type === 'placement') {
          for (const tactique of selectedTactiques) {
            const placement = tactique.placementsWithTags.find(p => p.id === itemId);
            if (placement) {
              const tableData: any = {};
              Object.keys(placement).forEach(key => {
                if (key.startsWith('PL_') || key === 'id') {
                  tableData[key] = placement[key];
                }
              });
              
              const tagData = {
                type: 'placement' as const,
                itemId,
                tactiqueId: tactique.id,
                tableData,
                campaignData: {
                  campaignId: selectedCampaign.id,
                  versionId: selectedVersion.id,
                  ongletId: tactique.ongletId,
                  sectionId: tactique.sectionId
                }
              };
              
              tagPromises.push(createCM360Tag(clientId, tagData));
              break;
            }
          }
          
        } else if (type === 'creative') {
          for (const tactique of selectedTactiques) {
            const creatives = creativesData?.[tactique.id] || {};
            let foundCreative: AdOpsCreative | null = null;
            let parentPlacementId: string | undefined = undefined;
            
            for (const [placementId, creativesArray] of Object.entries(creatives)) {
              const creative = creativesArray.find(c => c.id === itemId);
              if (creative) {
                foundCreative = creative;
                parentPlacementId = placementId;
                break;
              }
            }
            
            if (foundCreative && parentPlacementId) {
              const tableData: any = {};
              Object.keys(foundCreative).forEach(key => {
                if (key.startsWith('CR_') || key === 'id') {
                  tableData[key] = foundCreative![key];
                }
              });
              tableData.placementId = parentPlacementId;
              
              const tagData = {
                type: 'creative' as const,
                itemId,
                tactiqueId: tactique.id,
                tableData,
                campaignData: {
                  campaignId: selectedCampaign.id,
                  versionId: selectedVersion.id,
                  ongletId: tactique.ongletId,
                  sectionId: tactique.sectionId
                }
              };
              
              tagPromises.push(createCM360Tag(clientId, tagData));
              break;
            }
          }
        }
      });
      
      await Promise.all(tagPromises);
      
      if (onCM360TagsReload) {
        onCM360TagsReload();
      }
      
      console.log(`✅ Tags CM360 créés: ${tagPromises.length} éléments`);
      
    } catch (error) {
      console.error('❌ Erreur création tags CM360:', error);
    } finally {
      setCm360Loading(false);
    }
  }, [selectionState.selectedRows, selectedClient, selectedCampaign, selectedVersion, selectedTactiques, creativesData, onCM360TagsReload]);

  const cancelCM360Tags = useCallback(async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    setCm360Loading(true);
    const clientId = selectedClient.clientId;
    
    try {
      const deletePromises: Promise<void>[] = [];
      
      selectionState.selectedRows.forEach(rowId => {
        const [type, id] = rowId.split('-');
        
        if (type === 'tactique') {
          const tactique = selectedTactiques.find(t => t.id === id);
          if (tactique) {
            deletePromises.push(
              deleteTactiqueMetricsTags(
                clientId,
                selectedCampaign.id,
                selectedVersion.id,
                tactique.ongletId,
                tactique.sectionId,
                tactique.id
              )
            );
          }
        } else {
          for (const tactique of selectedTactiques) {
            const creatives = creativesData?.[tactique.id] || {};
            let placementId: string | undefined = undefined;
            let itemExists = false;
            
            if (type === 'placement') {
              itemExists = tactique.placementsWithTags.some(p => p.id === id);
            } else if (type === 'creative') {
              for (const [pId, creativesArray] of Object.entries(creatives)) {
                if (creativesArray.some(c => c.id === id)) {
                  placementId = pId;
                  itemExists = true;
                  break;
                }
              }
            }
            
            if (itemExists) {
              deletePromises.push(
                deleteAllCM360TagsForItem(
                  clientId,
                  selectedCampaign.id,
                  selectedVersion.id,
                  tactique.ongletId,
                  tactique.sectionId,
                  tactique.id,
                  id,
                  type as 'placement' | 'creative',
                  placementId
                )
              );
              break;
            }
          }
        }
      });
      
      await Promise.all(deletePromises);
      
      if (onCM360TagsReload) {
        onCM360TagsReload();
      }
      
      console.log(`✅ Tags CM360 supprimés: ${deletePromises.length} éléments`);
      
    } catch (error) {
      console.error('❌ Erreur suppression tags CM360:', error);
    } finally {
      setCm360Loading(false);
    }
  }, [selectionState.selectedRows, selectedClient, selectedCampaign, selectedVersion, selectedTactiques, creativesData, onCM360TagsReload]);

  const applyColorToSelected = useCallback(async (color: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    const clientId = selectedClient.clientId;
    const updates: Promise<void>[] = [];
    
    // Mise à jour locale immédiate
    setTableRows(prevRows => {
      const updateRowsRecursive = (rows: TableRowType[]): TableRowType[] => {
        return rows.map(row => {
          const rowId = `${row.type}-${row.data.id}`;
          let hasChanged = false;
          let updatedRow = { ...row };
          
          if (selectionState.selectedRows.has(rowId)) {
            const updatedData = { ...row.data };
            
            if (row.type === 'tactique') {
              (updatedData as AdOpsTactique).TC_Adops_Color = color;
              hasChanged = true;
            } else if (row.type === 'placement') {
              (updatedData as AdOpsPlacement).PL_Adops_Color = color;
              hasChanged = true;
            } else if (row.type === 'creative') {
              (updatedData as AdOpsCreative).CR_Adops_Color = color;
              hasChanged = true;
            }
            
            if (hasChanged) {
              updatedRow.data = updatedData;
            }
          }
          
          if (row.children && row.children.length > 0) {
            const updatedChildren = updateRowsRecursive(row.children);
            const childrenChanged = updatedChildren.some((child, index) => 
              child !== row.children![index]
            );
            
            if (childrenChanged) {
              updatedRow.children = updatedChildren;
              hasChanged = true;
            }
          }
          
          return hasChanged ? updatedRow : row;
        });
      };
      
      return updateRowsRecursive(prevRows);
    });
    
    // Sauvegarde asynchrone Firestore
    selectionState.selectedRows.forEach(rowId => {
      const [type, id] = rowId.split('-');
      
      for (const tactique of selectedTactiques) {
        const basePath = `clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${tactique.ongletId}/sections/${tactique.sectionId}/tactiques/${tactique.id}`;
        
        if (type === 'tactique' && tactique.id === id) {
          const docRef = doc(db, `${basePath.split('/tactiques')[0]}/tactiques/${id}`);
          updates.push(updateDoc(docRef, { TC_Adops_Color: color }));
          break;
        } else if (type === 'placement') {
          const placementExists = tactique.placementsWithTags.some(p => p.id === id);
          if (placementExists) {
            const docRef = doc(db, `${basePath}/placements/${id}`);
            updates.push(updateDoc(docRef, { PL_Adops_Color: color }));
            break;
          }
        } else if (type === 'creative') {
          const creatives = creativesData?.[tactique.id] || {};
          let placementId: string | null = null;
          
          for (const [pId, creativesArray] of Object.entries(creatives)) {
            if (creativesArray.some(c => c.id === id)) {
              placementId = pId;
              break;
            }
          }
          
          if (placementId) {
            const docRef = doc(db, `${basePath}/placements/${placementId}/creatifs/${id}`);
            updates.push(updateDoc(docRef, { CR_Adops_Color: color }));
            break;
          }
        }
      }
    });
    
    try {
      await Promise.all(updates);
      console.log(`✅ Couleurs appliquées: ${updates.length} éléments`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde couleurs:', error);
    }
  }, [selectionState.selectedRows, selectedClient, selectedCampaign, selectedVersion, selectedTactiques, creativesData]);

  // ================================
  // GESTIONNAIRES DE FILTRES
  // ================================

  const updateFilterState = useCallback((updates: Partial<AdOpsFilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    updateFilterState({
      cm360Filter: 'all',
      colorFilter: 'all',
      searchTerm: ''
    });
  }, [updateFilterState]);

  const clearSelection = useCallback(() => {
    setSelectionState({
      selectedRows: new Set(),
      lastSelectedIndex: null
    });
  }, []);

  const selectAllRows = useCallback(() => {
    const allIds = new Set(getFilteredRows.map(row => `${row.type}-${row.data.id}`));
    setSelectionState(prev => ({
      ...prev,
      selectedRows: allIds
    }));
  }, [getFilteredRows]);

  // ================================
  // EFFETS
  // ================================

  useEffect(() => {
    const newRows = buildTableRows(selectedTactiques);
    setTableRows(newRows);
    
    // Reset des états lors du changement de tactiques
    setSelectionState({
      selectedRows: new Set(),
      lastSelectedIndex: null
    });
    
    setFilterState(prev => ({
      ...prev,
      searchTerm: '',
      cm360Filter: 'all',
      colorFilter: 'all',
      isFiltersVisible: false
    }));
    
  }, [selectedTactiques, creativesData, buildTableRows]);

  // ================================
  // RENDU AVEC COMPOSANT INTERFACE
  // ================================

  return (
    <AdOpsTableInterface
      // Données
      selectedTactiques={selectedTactiques}
      selectedCampaign={selectedCampaign}
      selectedVersion={selectedVersion}
      filteredRows={getFilteredRows}
      cm360Tags={cm360Tags}
      
      // États
      selectionState={selectionState}
      filterState={filterState}
      copiedField={copiedField}
      cm360Loading={cm360Loading}
      
      // Fonctions
      formatters={formatters}
      getFilteredCM360Tags={getFilteredCM360Tags}
      getRowCM360Status={getRowCM360Status}
      selectedHasTags={selectedHasTags}
      
      // Gestionnaires
      handleRowSelection={handleRowSelection}
      toggleExpanded={toggleExpanded}
      copyToClipboard={copyToClipboard}
      createCM360Tags={createCM360Tags}
      cancelCM360Tags={cancelCM360Tags}
      applyColorToSelected={applyColorToSelected}
      updateFilterState={updateFilterState}
      resetFilters={resetFilters}
      clearSelection={clearSelection}
      selectAllRows={selectAllRows}
    />
  );
}