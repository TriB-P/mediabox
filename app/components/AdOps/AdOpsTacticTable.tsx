// app/components/AdOps/AdOpsTacticTable.tsx
/**
 * Composant AdOpsTacticTable simplifié et nettoyé
 * CORRIGÉ : Focus sur la logique essentielle sans sur-complexification
 */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  FunnelIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useClient } from '../../contexts/ClientContext';
import AdOpsTableRow from './AdOpsTableRow';
import {
  createCM360Tag,
  deleteAllCM360TagsForItem,
  CM360TagHistory,
  CM360Filter
} from '../../lib/cm360Service';
import { useTranslation } from '../../contexts/LanguageContext';

// Interfaces
interface AdOpsTactique {
  id: string;
  TC_Label?: string;
  TC_Media_Budget?: number;
  TC_BuyCurrency?: string;
  TC_CM360_Rate?: number;
  TC_CM360_Volume?: number;
  TC_Buy_Type?: string;
  TC_Publisher?: string;
  ongletName: string;
  sectionName: string;
  ongletId: string;
  sectionId: string;
  placementsWithTags: any[];
}

interface Creative {
  id: string;
  CR_Label?: string;
  CR_Tag_Start_Date?: string;
  CR_Tag_End_Date?: string;
  CR_Rotation_Weight?: number;
  CR_Tag_5?: string;
  CR_Tag_6?: string;
  CR_Adops_Color?: string;
  CR_Order?: number;
}

interface TableRow {
  type: 'tactique' | 'placement' | 'creative';
  level: 0 | 1 | 2;
  data: any;
  tactiqueId?: string;
  placementId?: string;
  isExpanded?: boolean;
  children?: TableRow[];
}

interface AdOpsTacticTableProps {
  selectedTactiques: AdOpsTactique[];
  selectedCampaign: any;
  selectedVersion: any;
  cm360Tags?: Map<string, CM360TagHistory>;
  creativesData?: { [tactiqueId: string]: { [placementId: string]: Creative[] } };
  onCM360TagsReload?: () => void;
  onDataReload?: () => void;
}

const COLORS = [
  { name: 'Rose', value: '#F9C8DC', class: 'bg-pink-100' },
  { name: 'Jaune', value: '#FFDE70', class: 'bg-yellow-100' },
  { name: 'Bleu', value: '#ADE0EB', class: 'bg-blue-100' },
  { name: 'Vert', value: '#7EDD8F', class: 'bg-green-100' }
];

export default function AdOpsTacticTable({ 
  selectedTactiques,
  selectedCampaign, 
  selectedVersion,
  cm360Tags,
  creativesData,
  onCM360TagsReload,
  onDataReload
}: AdOpsTacticTableProps) {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  
  // États essentiels
  const [searchTerm, setSearchTerm] = useState('');
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [cm360Filter, setCm360Filter] = useState<CM360Filter>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [showTaxonomies, setShowTaxonomies] = useState(false);
  const [showBudgetParams, setShowBudgetParams] = useState(true);
  const [showTactiques, setShowTactiques] = useState(true);
  const [showPlacements, setShowPlacements] = useState(true);
  const [showCreatives, setShowCreatives] = useState(true);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [cm360Loading, setCm360Loading] = useState(false);

  /**
   * Filtre les tags CM360 pour une tactique spécifique
   */
  const getFilteredCM360Tags = (tactiqueId: string): Map<string, CM360TagHistory> => {
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
  };

  /**
   * Calcule le statut CM360 d'une tactique - SIMPLIFIÉ
   */
  const getTactiqueCM360Status = (tactique: AdOpsTactique): 'none' | 'created' | 'changed' | 'partial' => {
    const filteredTags = getFilteredCM360Tags(tactique.id);
    const metricsHistory = filteredTags.get('metrics-tactics');
    
    // DÉBOGAGE SIMPLE
    console.log(`[DEBUG] Tactique ${tactique.TC_Label}:`, {
      hasMetrics: !!metricsHistory?.latestTag,
      hasChanges: metricsHistory?.hasChanges,
      finalStatus: !metricsHistory?.latestTag ? 'none' : 
                   metricsHistory.hasChanges ? 'changed' : 'created'
    });
    
    if (!metricsHistory?.latestTag) return 'none';
    if (metricsHistory.hasChanges) return 'changed';
    return 'created';
  };

  /**
   * Calcule le statut CM360 d'une ligne individuelle
   */
  const getRowCM360Status = (row: TableRow): 'none' | 'created' | 'changed' | 'partial' => {
    if (row.type === 'tactique') {
      return getTactiqueCM360Status(row.data as AdOpsTactique);
    }
    
    const rowId = `${row.type}-${row.data.id}`;
    const tactiqueId = row.tactiqueId!;
    const filteredTags = getFilteredCM360Tags(tactiqueId);
    const history = filteredTags.get(rowId);
    
    if (!history?.latestTag) return 'none';
    if (history.hasChanges) return 'changed';
    return 'created';
  };

  /**
   * Construit la structure hiérarchique
   */
  const buildTableRows = (tactiques: AdOpsTactique[]) => {
    const rows: TableRow[] = [];
    
    tactiques.forEach(tactique => {
      const tactiqueRow: TableRow = {
        type: 'tactique',
        level: 0,
        data: tactique,
        isExpanded: true,
        children: []
      };
      
      tactique.placementsWithTags.forEach(placement => {
        const placementRow: TableRow = {
          type: 'placement',
          level: 1,
          data: placement,
          tactiqueId: tactique.id,
          isExpanded: true,
          children: []
        };
        
        const creatives = creativesData?.[tactique.id]?.[placement.id] || [];
        creatives.forEach(creative => {
          const creativeRow: TableRow = {
            type: 'creative',
            level: 2,
            data: creative,
            tactiqueId: tactique.id,
            placementId: placement.id
          };
          placementRow.children?.push(creativeRow);
        });
        
        tactiqueRow.children?.push(placementRow);
      });
      
      rows.push(tactiqueRow);
    });
    
    setTableRows(rows);
  };

  /**
   * Aplati la structure hiérarchique
   */
  const getFlattenedRows = (rows: TableRow[] = tableRows): TableRow[] => {
    const flattened: TableRow[] = [];
    
    rows.forEach(row => {
      flattened.push(row);
      if (row.isExpanded && row.children) {
        const childrenFlattened = getFlattenedRows(row.children);
        flattened.push(...childrenFlattened);
      }
    });
    
    return flattened;
  };

  /**
   * Filtre les lignes selon les critères
   */
  const getFilteredRows = (): TableRow[] => {
    let baseRows = getFlattenedRows();
    
    // Filtre par type de ligne
    baseRows = baseRows.filter(row => {
      if (row.type === 'tactique' && !showTactiques) return false;
      if (row.type === 'placement' && !showPlacements) return false;
      if (row.type === 'creative' && !showCreatives) return false;
      return true;
    });
    
    // Filtre de recherche
    if (searchTerm.trim()) {
      baseRows = baseRows.filter(row => {
        const label = row.type === 'tactique' ? row.data.TC_Label :
                     row.type === 'placement' ? row.data.PL_Label :
                     row.data.CR_Label;
        return label?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    // Filtre CM360
    if (cm360Filter !== 'all') {
      baseRows = baseRows.filter(row => {
        const status = getRowCM360Status(row);
        switch (cm360Filter) {
          case 'created': return status === 'created';
          case 'changed': return status === 'changed';
          case 'none': return status === 'none';
          default: return true;
        }
      });
    }
    
    // Filtre par couleur
    if (colorFilter !== 'all') {
      baseRows = baseRows.filter(row => {
        const userColor = row.type === 'tactique'
          ? (row.data as any).TC_Adops_Color
          : row.type === 'placement' 
          ? (row.data as any).PL_Adops_Color 
          : (row.data as any).CR_Adops_Color;
        
        if (colorFilter === 'none') {
          return !userColor;
        } else {
          return userColor === colorFilter;
        }
      });
    }
    
    return baseRows;
  };

  /**
   * Toggle l'expansion d'une ligne
   */
  const toggleExpanded = (rowId: string, rowType: string) => {
    setTableRows(prev => {
      const updateRows = (rows: TableRow[]): TableRow[] => {
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
  };

  /**
   * Gère la sélection des lignes avec support Shift
   */
  const handleRowSelection = (rowId: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const newSelection = new Set(selectedRows);
    const filteredRows = getFilteredRows();
    
    if (event.shiftKey && lastSelectedIndex !== null) {
      const startIndex = Math.min(lastSelectedIndex, index);
      const endIndex = Math.max(lastSelectedIndex, index);
      
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
      setLastSelectedIndex(index);
    }
    
    setSelectedRows(newSelection);
  };

  /**
   * Fonctions de formatage
   */
  const formatCurrency = (amount: number | undefined, currency: string | undefined): string => {
    if (amount === undefined || amount === null) return 'N/A';
    const formattedAmount = new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 2 }).format(amount);
    const effectiveCurrency = currency || 'CAD';
    return effectiveCurrency === 'CAD' ? `${formattedAmount} $` : `${formattedAmount} ${effectiveCurrency}`;
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    return new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 2 }).format(num);
  };

  const formatDate = (dateString: string | undefined): string => {
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
  };

  /**
   * Copie une valeur dans le presse-papier
   */
  const copyToClipboard = async (value: string | number | undefined, fieldName: string) => {
    if (value === undefined || value === null) return;
    
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  /**
   * Crée les métriques CM360 pour une tactique
   */
  const createTactiqueMetrics = async (clientId: string, tactique: any) => {
    try {
      const tactiquePath = `clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${tactique.ongletId}/sections/${tactique.sectionId}/tactiques/${tactique.id}`;
      
      const tactiqueRef = doc(db, tactiquePath);
      const tactiqueSnapshot = await getDoc(tactiqueRef);
      
      if (!tactiqueSnapshot.exists()) {
        throw new Error(`Document tactique non trouvé: ${tactique.id}`);
      }
      
      const tactiqueData = tactiqueSnapshot.data();
      const existingMetrics = tactiqueData.cm360Tags || {};
      
      const indexes = Object.keys(existingMetrics).map(k => parseInt(k)).filter(n => !isNaN(n));
      const nextIndex = indexes.length === 0 ? 0 : Math.max(...indexes) + 1;
      
      const newMetrics = {
        tableData: {
          TC_Media_Budget: tactique.TC_Media_Budget,
          TC_BuyCurrency: tactique.TC_BuyCurrency,
          TC_CM360_Rate: tactique.TC_CM360_Rate,
          TC_CM360_Volume: tactique.TC_CM360_Volume,
          TC_Buy_Type: tactique.TC_Buy_Type,
          TC_Label: tactique.TC_Label,
          TC_Publisher: tactique.TC_Publisher
        },
        createdAt: new Date().toISOString(),
        version: nextIndex
      };
      
      const updatedMetrics = {
        ...existingMetrics,
        [nextIndex]: newMetrics
      };
      
      await updateDoc(tactiqueRef, {
        cm360Tags: updatedMetrics
      });
      
    } catch (error) {
      console.error(`Erreur création métriques ${tactique.TC_Label}:`, error);
      throw error;
    }
  };

  /**
   * Supprime les métriques CM360 pour une tactique
   */
  const deleteTactiqueMetrics = async (clientId: string, tactique: any) => {
    try {
      const tactiquePath = `clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${tactique.ongletId}/sections/${tactique.sectionId}/tactiques/${tactique.id}`;
      
      const tactiqueRef = doc(db, tactiquePath);
      
      await updateDoc(tactiqueRef, {
        cm360Tags: deleteField()
      });
      
    } catch (error) {
      console.error(`Erreur suppression métriques ${tactique.TC_Label}:`, error);
      throw error;
    }
  };

  /**
   * Crée des tags CM360 pour les lignes sélectionnées
   */
  const createCM360Tags = async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    setCm360Loading(true);
    const clientId = selectedClient.clientId;
    
    try {
      const tagPromises: Promise<string>[] = [];
      const processedTactiques = new Set<string>();
      
      selectedRows.forEach(rowId => {
        const [type, itemId] = rowId.split('-');
        
        if (type === 'tactique') {
          if (processedTactiques.has(itemId)) return;
          processedTactiques.add(itemId);
          
          const tactique = selectedTactiques.find(t => t.id === itemId);
          if (!tactique) return;
          
          const metricsPromise = createTactiqueMetrics(clientId, tactique)
            .then(() => 'metrics-created');
          
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
            let foundCreative: any = null;
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
                  tableData[key] = foundCreative[key];
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
      
    } catch (error) {
      console.error('Erreur création tags CM360:', error);
    } finally {
      setCm360Loading(false);
    }
  };

  /**
   * Vérifie si des lignes sélectionnées ont des tags CM360
   */
  const selectedHasTags = (): boolean => {
    for (const rowId of selectedRows) {
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
  };

  /**
   * Supprime les tags CM360 pour les lignes sélectionnées
   */
  const cancelCM360Tags = async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    setCm360Loading(true);
    const clientId = selectedClient.clientId;
    
    try {
      const deletePromises: Promise<void>[] = [];
      
      selectedRows.forEach(rowId => {
        const [type, id] = rowId.split('-');
        
        if (type === 'tactique') {
          const tactique = selectedTactiques.find(t => t.id === id);
          if (tactique) {
            deletePromises.push(deleteTactiqueMetrics(clientId, tactique));
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
      
    } catch (error) {
      console.error('Erreur suppression tags CM360:', error);
    } finally {
      setCm360Loading(false);
    }
  };

  /**
   * Application des couleurs
   */
  const applyColorToSelected = async (color: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    const clientId = selectedClient.clientId;
    const updates: Promise<void>[] = [];
    
    // Mise à jour locale immédiate
    setTableRows(prevRows => {
      const updateRowsRecursive = (rows: TableRow[]): TableRow[] => {
        return rows.map(row => {
          const rowId = `${row.type}-${row.data.id}`;
          let hasChanged = false;
          let updatedRow = { ...row };
          
          if (selectedRows.has(rowId)) {
            if (row.type === 'tactique') {
              updatedRow.data = { ...row.data, TC_Adops_Color: color };
              hasChanged = true;
            } else if (row.type === 'placement') {
              updatedRow.data = { ...row.data, PL_Adops_Color: color };
              hasChanged = true;
            } else if (row.type === 'creative') {
              updatedRow.data = { ...row.data, CR_Adops_Color: color };
              hasChanged = true;
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
    
    // Sauvegarde Firestore
    selectedRows.forEach(rowId => {
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
    } catch (error) {
      console.error('Erreur sauvegarde couleurs:', error);
    }
  };

  // Construction des lignes
  useEffect(() => {
    buildTableRows(selectedTactiques);
    setSelectedRows(new Set());
    setSearchTerm('');
    setCm360Filter('all');
    setColorFilter('all');
    setShowTaxonomies(false);
    setShowBudgetParams(true);
    setShowTactiques(true);
    setShowPlacements(true);
    setShowCreatives(true);
    setIsFiltersVisible(false);
    setLastSelectedIndex(null);
  }, [selectedTactiques, creativesData]);

  const filteredRows = getFilteredRows();

  if (selectedTactiques.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <p className="text-sm">Aucune tactique sélectionnée</p>
          <p className="text-xs mt-1">Sélectionnez des tactiques dans les dropdowns ci-dessus</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-3 px-4 pt-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedTactiques.length} {selectedTactiques.length > 1 ? 'tactiques sélectionnées' : 'tactique sélectionnée'}
          </h3>
          
          {/* Boutons de filtrage par type */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowTactiques(!showTactiques)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                showTactiques
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <span className="text-xs">TAC</span>
            </button>
            
            <button
              onClick={() => setShowPlacements(!showPlacements)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                showPlacements
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <span className="text-xs">PLA</span>
            </button>
            
            <button
              onClick={() => setShowCreatives(!showCreatives)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                showCreatives
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <span className="text-xs">CRE</span>
            </button>
            
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            
            <button
              onClick={() => setShowBudgetParams(!showBudgetParams)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                showBudgetParams
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <span>💰</span>
              <span>Budget</span>
            </button>
            
            <button
              onClick={() => setShowTaxonomies(!showTaxonomies)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                showTaxonomies
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <span>🏷️</span>
              <span>Tags</span>
            </button>
          </div>
        </div>
        
        {selectedRows.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedRows.size} sélectionnées
            </span>
            
            {/* Boutons CM360 */}
            <div className="flex items-center gap-2 ml-3">
              <button
                onClick={createCM360Tags}
                disabled={cm360Loading}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                <CheckIcon className="w-4 h-4" />
                {cm360Loading ? 'Création...' : 'Créer'}
              </button>
              
              {selectedHasTags() && (
                <button
                  onClick={cancelCM360Tags}
                  disabled={cm360Loading}
                  className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                  title="Supprimer tous les tags CM360 des éléments sélectionnés"
                >
                  <XMarkIcon className="w-4 h-4" />
                  {cm360Loading ? 'Suppression...' : 'Supprimer'}
                </button>
              )}
            </div>
            
            {/* Couleurs */}
            <div className="flex items-center gap-1 ml-3">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => applyColorToSelected(color.value)}
                  className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-500 transition-all duration-200"
                  style={{ backgroundColor: color.value }}
                  title={`Appliquer couleur ${color.name}`}
                />
              ))}
              <button
                onClick={() => applyColorToSelected('')}
                className="w-6 h-6 rounded-full border-2 border-gray-400 bg-white hover:border-gray-600 transition-all duration-200 relative"
                title="Supprimer couleur"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-0.5 bg-red-500 rotate-45 absolute"></div>
                  <div className="w-3 h-0.5 bg-red-500 -rotate-45 absolute"></div>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setSelectedRows(new Set())}
              className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 ml-3"
            >
              Désélectionner
            </button>
          </div>
        )}
      </div>

      {/* Barre de recherche et bouton de filtres */}
      <div className="mb-3 px-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher dans les tactiques, placements, créatifs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className={`p-2 border rounded-md transition-colors ${
              isFiltersVisible || cm360Filter !== 'all' || colorFilter !== 'all'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Panneau de filtres déroulant avec boutons élégants */}
        {isFiltersVisible && (
          <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Filtres CM360 avec boutons */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Statut CM360</span>
                <div className="flex items-center gap-1">
                  {[
                    { value: 'all' as CM360Filter, label: 'Tous', color: 'gray' },
                    { value: 'created' as CM360Filter, label: 'Tags créés', color: 'green' },
                    { value: 'changed' as CM360Filter, label: 'À modifier', color: 'orange' },
                    { value: 'none' as CM360Filter, label: 'À créer', color: 'blue' }
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setCm360Filter(filter.value)}
                      className={`px-3 h-6 text-xs rounded-full border transition-colors flex items-center ${
                        cm360Filter === filter.value
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Filtres par couleur */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Couleur</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setColorFilter('all')}
                    className={`px-3 h-6 text-xs rounded-full border transition-colors flex items-center ${
                      colorFilter === 'all'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Toutes
                  </button>
                  
                  <button
                    onClick={() => setColorFilter('none')}
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center bg-white ${
                      colorFilter === 'none'
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title="Filtrer éléments sans couleur"
                  >
                    <div className="w-5 h-5 rounded-full bg-white relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-0.5 bg-red-500 rotate-45 absolute"></div>
                        <div className="w-3 h-0.5 bg-red-500 -rotate-45 absolute"></div>
                      </div>
                    </div>
                  </button>
                  
                  {COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setColorFilter(color.value)}
                      className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                        colorFilter === color.value
                          ? 'border-indigo-500 ring-2 ring-indigo-200'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={`Filtrer par couleur ${color.name.toLowerCase()}`}
                    />
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => {
                  setCm360Filter('all');
                  setColorFilter('all');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg mx-4 mb-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="w-8 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredRows.length && filteredRows.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allIds = new Set(filteredRows.map(row => `${row.type}-${row.data.id}`));
                      setSelectedRows(allIds);
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="w-12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">CM360</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="w-80 px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              
              {showBudgetParams && (
                <>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Buy Type</th>
                </>
              )}
              
              {showTaxonomies && (
                <>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tag 1</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tag 2</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tag 3</th>
                </>
              )}
              
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tag Type</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date début</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date fin</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rotation</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Floodlight</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Third Party</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">VPAID</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={4 + (showBudgetParams ? 5 : 0) + (showTaxonomies ? 3 : 0) + 7} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucune donnée trouvée'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => {
                const rowId = `${row.type}-${row.data.id}`;
                const cm360Status = getRowCM360Status(row);
                const tactiqueId = row.type === 'tactique' ? row.data.id : row.tactiqueId!;
                const filteredTags = getFilteredCM360Tags(tactiqueId);
                const cm360History = row.type === 'tactique' 
                  ? filteredTags.get('metrics-tactics')
                  : filteredTags.get(rowId);
                
                return (
                  <AdOpsTableRow
                    key={rowId}
                    row={row}
                    index={index}
                    isSelected={selectedRows.has(rowId)}
                    selectedTactiques={selectedTactiques}
                    selectedCampaign={selectedCampaign}
                    selectedVersion={selectedVersion}
                    cm360Status={cm360Status}
                    cm360History={cm360History}
                    cm360Tags={filteredTags}
                    showBudgetParams={showBudgetParams}
                    showTaxonomies={showTaxonomies}
                    copiedField={copiedField}
                    onRowSelection={handleRowSelection}
                    onToggleExpanded={toggleExpanded}
                    onCopyToClipboard={copyToClipboard}
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                    formatDate={formatDate}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}