// app/components/AdOps/AdOpsTacticTable.tsx
/**
 * Composant AdOpsTacticTable avec fonctionnalités CM360
 * Tableau hiérarchique avancé avec création de tags CM360, détection de changements,
 * et indicateurs visuels pour le statut des tags.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useClient } from '../../contexts/ClientContext';
import AdOpsTableRow from './AdOpsTableRow';
import {
  createCM360Tag,
  getCM360TagsForTactique,
  deleteAllCM360TagsForItem,
  detectChanges,
  detectMetricsChanges,
  updateMetricsTag,
  CM360TagHistory,
  CM360TagData,
  CM360Filter
} from '../../lib/cm360Service';

interface SelectedTactique {
  id: string;
  TC_Label?: string;
  TC_Media_Budget?: number;
  TC_Buy_Currency?: string;
  TC_CM360_Rate?: number;
  TC_CM360_Volume?: number;
  TC_Buy_Type?: string;
  ongletName: string;
  sectionName: string;
  ongletId: string;
  sectionId: string;
  placementsWithTags: Placement[];
}

interface Placement {
  id: string;
  PL_Label?: string;
  PL_Tag_Type?: string;
  PL_Tag_Start_Date?: string;
  PL_Tag_End_Date?: string;
  PL_Rotation_Type?: string;
  PL_Floodlight?: string;
  PL_Third_Party_Measurement?: boolean;
  PL_VPAID?: boolean;
  PL_Tag_1?: string;
  PL_Tag_2?: string;
  PL_Tag_3?: string;
  PL_Adops_Color?: string;
  PL_Order?: number;
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
  type: 'placement' | 'creative';
  level: number;
  data: Placement | Creative;
  placementId?: string;
  isExpanded?: boolean;
  children?: TableRow[];
}

interface AdOpsTacticTableProps {
  selectedTactique: SelectedTactique | null;
  selectedCampaign: any;
  selectedVersion: any;
}

const COLORS = [
  { name: 'Rouge', value: '#FEE2E2', class: 'bg-red-100' },
  { name: 'Vert', value: '#DCFCE7', class: 'bg-green-100' },
  { name: 'Bleu', value: '#DBEAFE', class: 'bg-blue-100' },
  { name: 'Jaune', value: '#FEF3C7', class: 'bg-yellow-100' }
];

/**
 * Composant principal du tableau AdOps avec CM360
 */
export default function AdOpsTacticTable({ 
  selectedTactique, 
  selectedCampaign, 
  selectedVersion 
}: AdOpsTacticTableProps) {
  const { selectedClient } = useClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [creativesData, setCreativesData] = useState<{ [placementId: string]: Creative[] }>({});
  
  // État CM360
  const [cm360Tags, setCm360Tags] = useState<Map<string, CM360TagHistory>>(new Map());
  const [cm360Loading, setCm360Loading] = useState(false);
  const [cm360Filter, setCm360Filter] = useState<CM360Filter>('all');

  /**
   * Charge les créatifs ET les tags CM360
   */
  const loadCreativesAndTags = async () => {
    if (!selectedTactique || !selectedClient || !selectedCampaign || !selectedVersion) return;
    
    setLoading(true);
    const clientId = selectedClient.clientId;
    const allCreatives: { [placementId: string]: Creative[] } = {};
    const updatedPlacements: Placement[] = [];

    try {
      const basePath = `clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${selectedTactique.ongletId}/sections/${selectedTactique.sectionId}/tactiques/${selectedTactique.id}`;
      
      // 1. Charger les placements et créatifs
      for (const placement of selectedTactique.placementsWithTags) {
        try {
          const placementRef = doc(db, `${basePath}/placements/${placement.id}`);
          const placementSnapshot = await getDoc(placementRef);
          
          if (placementSnapshot.exists()) {
            const placementData = placementSnapshot.data() as Placement;
            const updatedPlacement = { ...placement, ...placementData, id: placement.id };
            updatedPlacements.push(updatedPlacement);
          } else {
            updatedPlacements.push(placement);
          }
        } catch (error) {
          console.warn(`Erreur chargement placement ${placement.id}:`, error);
          updatedPlacements.push(placement);
        }

        const creativesPath = `${basePath}/placements/${placement.id}/creatifs`;
        const creativesRef = collection(db, creativesPath);
        
        const creativesSnapshot = await getDocs(query(creativesRef, orderBy('CR_Order', 'asc')));
        const creatives: Creative[] = creativesSnapshot.docs.map(doc => ({
          ...doc.data() as Creative,
          id: doc.id
        }));
        
        allCreatives[placement.id] = creatives;
      }
      
      // 2. Charger les tags CM360 avec la nouvelle méthode simplifiée
      const tags = await getCM360TagsForTactique(
        clientId,
        selectedCampaign.id,
        selectedVersion.id,
        selectedTactique.ongletId,
        selectedTactique.sectionId,
        selectedTactique.id,
        updatedPlacements,
        allCreatives
      );
      
      // 3. Détecter les changements pour chaque item
      const updatedTags = new Map<string, CM360TagHistory>();
      tags.forEach((history, key) => {
        if (history.latestTag) {
          const [type, itemId] = key.split('-');
          
          if (type === 'metrics') {
            // Pour les métriques, utiliser les données de la tactique
            const tactiqueMetrics = {
              TC_Media_Budget: selectedTactique.TC_Media_Budget,
              TC_Buy_Currency: selectedTactique.TC_Buy_Currency,
              TC_CM360_Rate: selectedTactique.TC_CM360_Rate,
              TC_CM360_Volume: selectedTactique.TC_CM360_Volume,
              TC_Buy_Type: selectedTactique.TC_Buy_Type
            };
            
            const changes = detectMetricsChanges(tactiqueMetrics, new Map([['metrics-tactics', history]]));
            history.hasChanges = changes.hasChanges;
            history.changedFields = changes.changedFields;
          } else {
            // Pour les placements et créatifs
            let currentData: any = null;
            
            if (type === 'placement') {
              currentData = updatedPlacements.find(p => p.id === itemId);
            } else if (type === 'creative') {
              // Trouver le créatif dans tous les placements
              for (const creatives of Object.values(allCreatives)) {
                const creative = creatives.find(c => c.id === itemId);
                if (creative) {
                  currentData = creative;
                  break;
                }
              }
            }
            
            if (currentData) {
              const changes = detectChanges(currentData, history.latestTag, type as 'placement' | 'creative');
              history.hasChanges = changes.hasChanges;
              history.changedFields = changes.changedFields;
            }
          }
        }
        updatedTags.set(key, history);
      });
      
      console.log('🔍 [AdOpsTacticTable] Tags chargés:', {
        'tags.size': tags.size,
        'updatedTags.size': updatedTags.size,
        'tags keys': Array.from(tags.keys()),
        'updatedTags keys': Array.from(updatedTags.keys()),
        'metrics-tactics exists': updatedTags.has('metrics-tactics')
      });
      
      setCreativesData(allCreatives);
      setCm360Tags(updatedTags);
      
      console.log('🔍 [AdOpsTacticTable] State mis à jour avec setCm360Tags:', updatedTags);
      
      buildTableRows(updatedPlacements, allCreatives);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setCreativesData({});
      setCm360Tags(new Map());
      buildTableRows(selectedTactique.placementsWithTags, {});
    } finally {
      setLoading(false);
    }
  };

  /**
   * Construit la structure hiérarchique du tableau en gardant l'état d'expansion
   */
  const buildTableRows = (placements: Placement[], creatives: { [placementId: string]: Creative[] }) => {
    const rows: TableRow[] = [];
    
    placements.forEach(placement => {
      // Vérifier si ce placement était déjà expandé
      const existingRow = tableRows.find(r => r.type === 'placement' && r.data.id === placement.id);
      const wasExpanded = existingRow?.isExpanded || false;
      
      const placementRow: TableRow = {
        type: 'placement',
        level: 0,
        data: placement,
        isExpanded: wasExpanded, // Garder l'état d'expansion existant
        children: []
      };
      
      const placementCreatives = creatives[placement.id] || [];
      placementCreatives.forEach(creative => {
        const creativeRow: TableRow = {
          type: 'creative',
          level: 1,
          data: creative,
          placementId: placement.id
        };
        placementRow.children?.push(creativeRow);
      });
      
      rows.push(placementRow);
    });
    
    setTableRows(rows);
  };

  /**
   * Crée des tags CM360 pour les lignes sélectionnées
   */
  const createCM360Tags = async () => {
    if (!selectedClient || !selectedTactique || !selectedCampaign || !selectedVersion) return;
    
    setCm360Loading(true);
    const clientId = selectedClient.clientId ;
    
    try {
      const tagPromises: Promise<string>[] = [];
      
      selectedRows.forEach(rowId => {
        const [type, itemId] = rowId.split('-');
        
        // Trouver les données de l'item
        let itemData: any = null;
        let placementId: string | undefined = undefined;
        
        if (type === 'placement') {
          itemData = selectedTactique.placementsWithTags.find(p => p.id === itemId);
        } else if (type === 'creative') {
          for (const [pId, creatives] of Object.entries(creativesData)) {
            const creative = creatives.find(c => c.id === itemId);
            if (creative) {
              itemData = creative;
              placementId = pId;
              break;
            }
          }
        }
        
        if (itemData) {
          // Préparer les données du tag
          const tableData: any = {};
          
          if (type === 'placement') {
            // Copier toutes les propriétés PL_*
            Object.keys(itemData).forEach(key => {
              if (key.startsWith('PL_')) {
                tableData[key] = itemData[key];
              }
            });
          } else if (type === 'creative') {
            // Copier toutes les propriétés CR_*
            Object.keys(itemData).forEach(key => {
              if (key.startsWith('CR_')) {
                tableData[key] = itemData[key];
              }
            });
            // Ajouter l'ID du placement parent
            tableData.placementId = placementId;
          }
          
          const tactiqueMetrics = {
            TC_Media_Budget: selectedTactique.TC_Media_Budget,
            TC_Buy_Currency: selectedTactique.TC_Buy_Currency,
            TC_CM360_Rate: selectedTactique.TC_CM360_Rate,
            TC_CM360_Volume: selectedTactique.TC_CM360_Volume,
            TC_Buy_Type: selectedTactique.TC_Buy_Type
          };
          
          const tagData = {
            type: type as 'placement' | 'creative',
            itemId,
            tactiqueId: selectedTactique.id,
            tableData,
            tactiqueMetrics,
            campaignData: {
              campaignId: selectedCampaign.id,
              versionId: selectedVersion.id,
              ongletId: selectedTactique.ongletId,
              sectionId: selectedTactique.sectionId
            }
          };
          
          tagPromises.push(createCM360Tag(clientId, tagData));
        }
      });
      
      await Promise.all(tagPromises);
      
      // Recharger les tags
      await loadCreativesAndTags();
      
      // NE PAS désélectionner les lignes - garder la sélection
      
    } catch (error) {
      console.error('Erreur création tags CM360:', error);
    } finally {
      setCm360Loading(false);
    }
  };

  /**
   * Annule TOUS les tags CM360 pour les lignes sélectionnées (supprime l'historique complet)
   */
  const cancelCM360Tags = async () => {
    if (!selectedClient || !selectedTactique || !selectedCampaign || !selectedVersion) return;
    
    setCm360Loading(true);
    const clientId = selectedClient.clientId ;
    
    try {
      const deletePromises: Promise<void>[] = [];
      
      selectedRows.forEach(rowId => {
        const [type, itemId] = rowId.split('-');
        let placementId: string | undefined = undefined;
        
        // Trouver le placement parent pour les créatifs
        if (type === 'creative') {
          for (const [pId, creatives] of Object.entries(creativesData)) {
            const creative = creatives.find(c => c.id === itemId);
            if (creative) {
              placementId = pId;
              break;
            }
          }
        }
        
        deletePromises.push(
          deleteAllCM360TagsForItem(
            clientId,
            selectedCampaign.id,
            selectedVersion.id,
            selectedTactique.ongletId,
            selectedTactique.sectionId,
            selectedTactique.id,
            itemId,
            type as 'placement' | 'creative',
            placementId
          )
        );
      });
      
      await Promise.all(deletePromises);
      
      // Recharger les tags
      await loadCreativesAndTags();
      
      // NE PAS désélectionner les lignes - garder la sélection
      
    } catch (error) {
      console.error('Erreur annulation tags CM360:', error);
    } finally {
      setCm360Loading(false);
    }
  };

  /**
   * Obtient le statut CM360 d'une ligne
   */
  const getCM360Status = (rowId: string): 'none' | 'created' | 'changed' => {
    const tagHistory = cm360Tags.get(rowId);
    if (!tagHistory?.latestTag) return 'none';
    if (tagHistory.hasChanges) return 'changed';
    return 'created';
  };

  /**
   * Filtre les lignes selon le terme de recherche ET le filtre CM360
   */
  const getFilteredRows = (): TableRow[] => {
    let baseRows = getFlattenedRows();
    
    // Appliquer le filtre de recherche d'abord
    if (searchTerm.trim()) {
      const filtered: TableRow[] = [];
      
      tableRows.forEach(placementRow => {
        const placement = placementRow.data as Placement;
        const placementMatches = 
          placement.PL_Label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          placement.PL_Tag_1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          placement.PL_Tag_2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          placement.PL_Tag_3?.toLowerCase().includes(searchTerm.toLowerCase());
        
        let hasMatchingCreatives = false;
        const matchingCreatives: TableRow[] = [];
        
        placementRow.children?.forEach(creativeRow => {
          const creative = creativeRow.data as Creative;
          const creativeMatches = 
            creative.CR_Label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            creative.CR_Tag_5?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            creative.CR_Tag_6?.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (creativeMatches) {
            hasMatchingCreatives = true;
            matchingCreatives.push(creativeRow);
          }
        });
        
        if (placementMatches || hasMatchingCreatives) {
          const filteredPlacementRow = {
            ...placementRow,
            isExpanded: hasMatchingCreatives || placementRow.isExpanded, // Garder l'expansion existante
            children: placementMatches ? placementRow.children : matchingCreatives
          };
          filtered.push(filteredPlacementRow);
        }
      });
      
      baseRows = getFlattenedRows(filtered);
    }
    
    // Appliquer le filtre CM360
    if (cm360Filter !== 'all') {
      baseRows = baseRows.filter(row => {
        const rowId = `${row.type}-${row.data.id}`;
        const history = cm360Tags.get(rowId);
        
        switch (cm360Filter) {
          case 'created':
            return history?.latestTag && !history.hasChanges;
          case 'changed':
            return history?.latestTag && history.hasChanges;
          case 'none':
            return !history?.latestTag;
          default:
            return true;
        }
      });
    }
    
    return baseRows;
  };

  /**
   * Aplati la structure hiérarchique pour l'affichage
   */
  const getFlattenedRows = (rows: TableRow[] = tableRows): TableRow[] => {
    const flattened: TableRow[] = [];
    
    rows.forEach(row => {
      flattened.push(row);
      if (row.isExpanded && row.children) {
        flattened.push(...row.children);
      }
    });
    
    return flattened;
  };

  /**
   * Toggle l'expansion d'un placement
   */
  const toggleExpanded = (placementId: string) => {
    setTableRows(prev => prev.map(row => {
      if (row.type === 'placement' && row.data.id === placementId) {
        return { ...row, isExpanded: !row.isExpanded };
      }
      return row;
    }));
  };

  /**
   * Gère la sélection des lignes avec support Shift
   */
  const handleRowSelection = (rowId: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const flatRows = getFilteredRows();
    const newSelection = new Set(selectedRows);
    
    if (event.shiftKey && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const shouldSelect = !newSelection.has(rowId);
      
      for (let i = start; i <= end; i++) {
        if (flatRows[i]) {
          const rangeRowId = `${flatRows[i].type}-${flatRows[i].data.id}`;
          
          if (shouldSelect) {
            newSelection.add(rangeRowId);
            if (flatRows[i].type === 'placement') {
              const children = getChildrenForPlacement(flatRows[i].data.id);
              children.forEach(child => {
                const childRowId = `creative-${child.id}`;
                newSelection.add(childRowId);
              });
            }
          } else {
            newSelection.delete(rangeRowId);
            if (flatRows[i].type === 'placement') {
              const children = getChildrenForPlacement(flatRows[i].data.id);
              children.forEach(child => {
                const childRowId = `creative-${child.id}`;
                newSelection.delete(childRowId);
              });
            }
          }
        }
      }
      
      setSelectedRows(newSelection);
      setLastClickedIndex(index);
    } else {
      const [type, id] = rowId.split('-');
      
      if (newSelection.has(rowId)) {
        newSelection.delete(rowId);
        if (type === 'placement') {
          const children = getChildrenForPlacement(id);
          children.forEach(child => {
            const childRowId = `creative-${child.id}`;
            newSelection.delete(childRowId);
          });
        }
      } else {
        newSelection.add(rowId);
        if (type === 'placement') {
          const children = getChildrenForPlacement(id);
          children.forEach(child => {
            const childRowId = `creative-${child.id}`;
            newSelection.add(childRowId);
          });
        }
      }
      
      setSelectedRows(newSelection);
      setLastClickedIndex(index);
    }
  };

  /**
   * Récupère les créatifs enfants d'un placement
   */
  const getChildrenForPlacement = (placementId: string): Creative[] => {
    return creativesData[placementId] || [];
  };

  /**
   * Calcule les statistiques de sélection
   */
  const getSelectionStats = () => {
    let placements = 0;
    let creatives = 0;
    
    selectedRows.forEach(rowId => {
      const [type] = rowId.split('-');
      if (type === 'placement') placements++;
      else if (type === 'creative') creatives++;
    });
    
    return { placements, creatives, total: placements + creatives };
  };

  /**
   * Vérifie si des lignes sélectionnées ont des tags CM360
   */
  const selectedHasTags = (): boolean => {
    for (const rowId of selectedRows) {
      const tagHistory = cm360Tags.get(rowId);
      if (tagHistory?.latestTag) return true;
    }
    return false;
  };

  /**
   * Applique une couleur aux lignes sélectionnées
   */
  const applyColorToSelected = async (color: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedTactique) return;
    
    const clientId = selectedClient.clientId ;
    const basePath = `clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${selectedTactique.ongletId}/sections/${selectedTactique.sectionId}/tactiques/${selectedTactique.id}`;
    const updates: Promise<void>[] = [];
    
    updateLocalColors(color);
    
    selectedRows.forEach(rowId => {
      const [type, id] = rowId.split('-');
      
      if (type === 'placement') {
        const docRef = doc(db, `${basePath}/placements/${id}`);
        updates.push(updateDoc(docRef, { PL_Adops_Color: color }));
      } else if (type === 'creative') {
        const placementId = getPlacementIdForCreative(id);
        if (placementId) {
          const docRef = doc(db, `${basePath}/placements/${placementId}/creatifs/${id}`);
          updates.push(updateDoc(docRef, { CR_Adops_Color: color }));
        }
      }
    });
    
    try {
      await Promise.all(updates);
    } catch (error) {
      console.error('Erreur sauvegarde couleurs:', error);
    }
  };

  /**
   * Met à jour les couleurs localement
   */
  const updateLocalColors = (color: string) => {
    const updatedTactique = { ...selectedTactique };
    if (updatedTactique.placementsWithTags) {
      updatedTactique.placementsWithTags = updatedTactique.placementsWithTags.map(placement => {
        const rowId = `placement-${placement.id}`;
        if (selectedRows.has(rowId)) {
          return { ...placement, PL_Adops_Color: color };
        }
        return placement;
      });
    }

    const updatedCreatives = { ...creativesData };
    Object.keys(updatedCreatives).forEach(placementId => {
      updatedCreatives[placementId] = updatedCreatives[placementId].map(creative => {
        const rowId = `creative-${creative.id}`;
        if (selectedRows.has(rowId)) {
          return { ...creative, CR_Adops_Color: color };
        }
        return creative;
      });
    });
    
    setCreativesData(updatedCreatives);
    updateTableRowsColors(color);
  };

  /**
   * Met à jour les couleurs dans tableRows
   */
  const updateTableRowsColors = (color: string) => {
    setTableRows(prevRows => 
      prevRows.map(row => {
        const rowId = `${row.type}-${row.data.id}`;
        
        if (selectedRows.has(rowId)) {
          const updatedData = { ...row.data };
          if (row.type === 'placement') {
            updatedData.PL_Adops_Color = color;
          } else {
            updatedData.CR_Adops_Color = color;
          }
          
          const updatedChildren = row.children?.map(child => {
            const childRowId = `${child.type}-${child.data.id}`;
            if (selectedRows.has(childRowId)) {
              return {
                ...child,
                data: { ...child.data, CR_Adops_Color: color }
              };
            }
            return child;
          });
          
          return {
            ...row,
            data: updatedData,
            children: updatedChildren
          };
        }
        
        if (row.children) {
          const updatedChildren = row.children.map(child => {
            const childRowId = `${child.type}-${child.data.id}`;
            if (selectedRows.has(childRowId)) {
              return {
                ...child,
                data: { ...child.data, CR_Adops_Color: color }
              };
            }
            return child;
          });
          
          return {
            ...row,
            children: updatedChildren
          };
        }
        
        return row;
      })
    );
  };

  /**
   * Trouve l'ID du placement parent pour un créatif
   */
  const getPlacementIdForCreative = (creativeId: string): string | null => {
    for (const [placementId, creatives] of Object.entries(creativesData)) {
      if (creatives.some(c => c.id === creativeId)) {
        return placementId;
      }
    }
    return null;
  };

  // Charger les données quand la tactique change
  useEffect(() => {
    if (selectedTactique) {
      loadCreativesAndTags();
    } else {
      setTableRows([]);
      setCreativesData({});
      setCm360Tags(new Map());
    }
    setSelectedRows(new Set());
    setSearchTerm('');
  }, [selectedTactique]);

  if (!selectedTactique) {
    return (
      <div className="bg-white p-4 rounded-lg shadow h-full">
        <div className="flex items-center justify-center h-32 text-gray-500 text-center">
          <div>
            <p className="text-sm">Aucune tactique sélectionnée</p>
            <p className="text-xs mt-1">Sélectionnez une tactique pour voir ses placements</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredRows = getFilteredRows();
  const selectionStats = getSelectionStats();

  return (
    <div className="bg-white p-4 rounded-lg shadow h-full flex flex-col">
      {/* En-tête avec actions CM360 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{selectedTactique.TC_Label}</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectionStats.total} sélectionné{selectionStats.total > 1 ? 's' : ''} 
              </span>
              
              {/* Boutons CM360 */}
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={createCM360Tags}
                  disabled={cm360Loading}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <CloudArrowUpIcon className="w-4 h-4" />
                  {cm360Loading ? 'Création...' : 'Créer dans CM360'}
                </button>
                
                {selectedHasTags() && (
                  <button
                    onClick={cancelCM360Tags}
                    disabled={cm360Loading}
                    className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                    title="Supprime TOUT l'historique des tags CM360 pour les éléments sélectionnés"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Supprimer Tags
                  </button>
                )}
              </div>
              
              {/* Couleurs */}
              <div className="flex items-center gap-1 ml-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => applyColorToSelected(color.value)}
                    className={`w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-500 transition-all duration-200 ${color.class}`}
                    title={`Appliquer la couleur ${color.name.toLowerCase()}`}
                  >
                    <div 
                      className="w-full h-full rounded-full"
                      style={{ backgroundColor: color.value }}
                    ></div>
                  </button>
                ))}
                
                <button
                  onClick={() => applyColorToSelected('')}
                  className="w-6 h-6 rounded-full border-2 border-gray-400 hover:border-gray-600 bg-white transition-all duration-200 relative"
                  title="Enlever la couleur"
                >
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs font-bold">
                    ∅
                  </div>
                </button>
              </div>
              
              <button
                onClick={() => setSelectedRows(new Set())}
                className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
              >
                Désélectionner ({selectionStats.total})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-3 space-y-3">
        {/* Recherche */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par label ou tag..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        {/* Filtres CM360 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filtrer par statut CM360:</span>
          <div className="flex items-center gap-1">
            {[
              { value: 'all' as CM360Filter, label: 'Tous', color: 'gray' },
              { value: 'created' as CM360Filter, label: 'Tags créés ✓', color: 'green' },
              { value: 'changed' as CM360Filter, label: 'À modifier ⚠️', color: 'orange' },
              { value: 'none' as CM360Filter, label: 'À créer', color: 'blue' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setCm360Filter(filter.value)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  cm360Filter === filter.value
                    ? filter.color === 'green' 
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : filter.color === 'orange'
                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                      : filter.color === 'blue'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau scrollable */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
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
              <th className="w-8 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">CM360</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Début</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Fin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rotation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floodlight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">3rd Party</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VPAID</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
                    Chargement des données...
                  </div>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucun placement trouvé'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => {
                const rowId = `${row.type}-${row.data.id}`;
                const cm360Status = getCM360Status(rowId);
                const cm360History = cm360Tags.get(rowId);
                
                return (
                  <AdOpsTableRow
                    key={rowId}
                    row={row}
                    index={index}
                    isSelected={selectedRows.has(rowId)}
                    onToggleExpanded={toggleExpanded}
                    onRowSelection={handleRowSelection}
                    selectedTactique={selectedTactique}
                    selectedCampaign={selectedCampaign}
                    selectedVersion={selectedVersion}
                    selectedRows={selectedRows}
                    cm360History={cm360History}
                    cm360Status={cm360Status}
                    cm360Tags={cm360Tags}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Informations */}
      <div className="mt-3 text-xs text-gray-500">
        {filteredRows.length} ligne{filteredRows.length > 1 ? 's' : ''} • 
        Maintenez Shift pour sélectionner une plage • 
        ✓ = Tag créé • ⚠️ = Modifications détectées
      </div>
    </div>
  );
}