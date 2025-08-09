// app/components/AdOps/AdOpsTacticTable.tsx
/**
 * Composant AdOpsTacticTable avec fonctionnalités CM360
 * Tableau hiérarchique avancé avec création de tags CM360, détection de changements,
 * et indicateurs visuels pour le statut des tags.
 * MODIFIÉ : Utilise les données centralisées d'AdOpsPage avec filtrage hierarchique
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
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useClient } from '../../contexts/ClientContext';
import AdOpsTableRow from './AdOpsTableRow';
import {
  createCM360Tag,
  deleteAllCM360TagsForItem,
  createTacticsMetricsTagIfNeeded,
  CM360TagHistory,
  CM360TagData,
  CM360Filter
} from '../../lib/cm360Service';
import { Check } from 'lucide-react';

interface SelectedTactique {
  id: string;
  TC_Label?: string;
  TC_Media_Budget?: number;
  TC_BuyCurrency?: string;
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
  // Props depuis AdOpsPage - MODIFIÉ : Structure hierarchique
  cm360Tags?: Map<string, CM360TagHistory>;
  creativesData?: { [tactiqueId: string]: { [placementId: string]: Creative[] } };
  onCM360TagsReload?: () => void; // Callback pour recharger les tags
}

const COLORS = [
  { name: '', value: '#FEE2E2', class: 'bg-red-100' },
  { name: '', value: '#DCFCE7', class: 'bg-green-100' },
  { name: '', value: '#DBEAFE', class: 'bg-blue-100' },
  { name: '', value: '#FEF3C7', class: 'bg-yellow-100' }
];

// NOUVEAU : Options de filtre par couleur
const COLOR_FILTER_OPTIONS = [
  { value: 'all', label: 'Toutes', color: null },
  { value: 'none', label: '', color: null },
  ...COLORS.map(color => ({ value: color.value, label: color.name, color: color.value }))
];

/**
 * Composant principal du tableau AdOps avec CM360
 */
export default function AdOpsTacticTable({ 
  selectedTactique, 
  selectedCampaign, 
  selectedVersion,
  cm360Tags,
  creativesData,
  onCM360TagsReload
}: AdOpsTacticTableProps) {
  const { selectedClient } = useClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  
  // États CM360 et filtres
  const [cm360Loading, setCm360Loading] = useState(false);
  const [cm360Filter, setCm360Filter] = useState<CM360Filter>('all');
  const [colorFilter, setColorFilter] = useState<string>('all'); // NOUVEAU : Filtre par couleur

  /**
   * NOUVELLE FONCTION : Filtre les tags CM360 pour la tactique sélectionnée
   * Retire le préfixe "tactique-${id}-" et retourne une Map compatible
   */
  const getFilteredCM360Tags = (): Map<string, CM360TagHistory> => {
    if (!cm360Tags || !selectedTactique) return new Map();
    
    const filtered = new Map<string, CM360TagHistory>();
    const prefix = `tactique-${selectedTactique.id}-`;
    
    cm360Tags.forEach((history, key) => {
      if (key.startsWith(prefix)) {
        const localKey = key.substring(prefix.length); // Retire le préfixe
        filtered.set(localKey, history);
      }
    });
    
    console.log(`🔍 [TacticTable] Filtrage pour tactique ${selectedTactique.id}:`, {
      'tags totaux': cm360Tags.size,
      'tags filtrés': filtered.size,
      'clés filtrées': Array.from(filtered.keys())
    });
    
    return filtered;
  };

  /**
   * NOUVELLE FONCTION : Récupère les créatifs pour la tactique sélectionnée
   * Adapte la structure hierarchique à la structure attendue par les fonctions
   */
  const getFilteredCreatives = (): { [placementId: string]: Creative[] } => {
    if (!creativesData || !selectedTactique || !creativesData[selectedTactique.id]) {
      console.log(`🔍 [TacticTable] Créatifs pour tactique ${selectedTactique?.id}: aucun`);
      return {};
    }
    
    const result = creativesData[selectedTactique.id];
    console.log(`🔍 [TacticTable] Créatifs pour tactique ${selectedTactique.id}:`, {
      'placements': Object.keys(result).length,
      'total créatifs': Object.values(result).reduce((sum, creatives) => sum + creatives.length, 0)
    });
    
    return result;
  };

  /**
   * Construit la structure hiérarchique du tableau en gardant l'état d'expansion
   * MODIFIÉE : Utilise les créatifs filtrés
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
   * CORRIGÉE : Crée des tags CM360 pour les lignes sélectionnées
   * Évite la duplication des métriques en les créant UNE seule fois
   */
  const createCM360Tags = async () => {
    if (!selectedClient || !selectedTactique || !selectedCampaign || !selectedVersion) return;
    
    setCm360Loading(true);
    const clientId = selectedClient.clientId;
    const filteredCreatives = getFilteredCreatives();
    
    try {
      // ÉTAPE 1 : Créer les métriques UNE seule fois (si nécessaire)
      const tactiqueMetrics = {
        TC_Media_Budget: selectedTactique.TC_Media_Budget,
        TC_BuyCurrency: selectedTactique.TC_BuyCurrency,
        TC_CM360_Rate: selectedTactique.TC_CM360_Rate,
        TC_CM360_Volume: selectedTactique.TC_CM360_Volume,
        TC_Buy_Type: selectedTactique.TC_Buy_Type
      };
      
      const metricsCreated = await createTacticsMetricsTagIfNeeded(
        clientId,
        selectedCampaign.id,
        selectedVersion.id,
        selectedTactique.ongletId,
        selectedTactique.sectionId,
        selectedTactique.id,
        tactiqueMetrics
      );
      
      if (metricsCreated) {
        console.log('✅ [TacticTable] Métriques créées pour la tactique');
      } else {
        console.log('⏭️  [TacticTable] Métriques déjà existantes');
      }
      
      // ÉTAPE 2 : Créer tous les tags individuels (sans duplication métriques)
      const tagPromises: Promise<string>[] = [];
      
      selectedRows.forEach(rowId => {
        const [type, itemId] = rowId.split('-');
        
        // Trouver les données de l'item
        let itemData: any = null;
        let placementId: string | undefined = undefined;
        
        if (type === 'placement') {
          itemData = selectedTactique.placementsWithTags.find(p => p.id === itemId);
        } else if (type === 'creative') {
          for (const [pId, creatives] of Object.entries(filteredCreatives)) {
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
          
          const tagData = {
            type: type as 'placement' | 'creative',
            itemId,
            tactiqueId: selectedTactique.id,
            tableData,
            tactiqueMetrics, // Inclure mais ne sera pas utilisé pour créer automatiquement
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
      
      // Attendre que tous les tags soient créés
      await Promise.all(tagPromises);
      
      console.log(`✅ [TacticTable] ${tagPromises.length} tags créés`);
      
      // Recharger depuis AdOpsPage
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
   * MODIFIÉE : Annule TOUS les tags CM360 pour les lignes sélectionnées
   * Utilise onCM360TagsReload au lieu de recharger localement
   */
  const cancelCM360Tags = async () => {
    if (!selectedClient || !selectedTactique || !selectedCampaign || !selectedVersion) return;
    
    setCm360Loading(true);
    const clientId = selectedClient.clientId;
    const filteredCreatives = getFilteredCreatives();
    
    try {
      const deletePromises: Promise<void>[] = [];
      
      selectedRows.forEach(rowId => {
        const [type, itemId] = rowId.split('-');
        let placementId: string | undefined = undefined;
        
        // Trouver le placement parent pour les créatifs
        if (type === 'creative') {
          for (const [pId, creatives] of Object.entries(filteredCreatives)) {
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
      
      // MODIFIÉ : Utiliser le callback pour recharger depuis AdOpsPage
      if (onCM360TagsReload) {
        onCM360TagsReload();
      }
      
      console.log('✅ [TacticTable] Tags supprimés, rechargement depuis AdOpsPage');
      
    } catch (error) {
      console.error('Erreur annulation tags CM360:', error);
    } finally {
      setCm360Loading(false);
    }
  };

  /**
   * MODIFIÉE : Obtient le statut CM360 d'une ligne en utilisant les tags filtrés
   */
  const getCM360Status = (rowId: string): 'none' | 'created' | 'changed' => {
    const filteredTags = getFilteredCM360Tags();
    const tagHistory = filteredTags.get(rowId);
    if (!tagHistory?.latestTag) return 'none';
    if (tagHistory.hasChanges) return 'changed';
    return 'created';
  };

  /**
   * MODIFIÉE : Filtre les lignes selon le terme de recherche, le filtre CM360 ET le filtre couleur
   * Utilise les tags filtrés
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
    
    // Appliquer le filtre CM360 avec tags filtrés
    if (cm360Filter !== 'all') {
      const filteredTags = getFilteredCM360Tags();
      
      baseRows = baseRows.filter(row => {
        const rowId = `${row.type}-${row.data.id}`;
        const history = filteredTags.get(rowId);
        
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
    
    // NOUVEAU : Appliquer le filtre couleur
    if (colorFilter !== 'all') {
      baseRows = baseRows.filter(row => {
        const colorValue = row.type === 'placement' 
          ? (row.data as Placement).PL_Adops_Color 
          : (row.data as Creative).CR_Adops_Color;
        
        if (colorFilter === 'none') {
          // Filtrer les lignes sans couleur
          return !colorValue || colorValue.trim() === '';
        } else {
          // Filtrer par couleur spécifique
          return colorValue === colorFilter;
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
   * MODIFIÉE : Récupère les créatifs enfants d'un placement en utilisant les créatifs filtrés
   */
  const getChildrenForPlacement = (placementId: string): Creative[] => {
    const filteredCreatives = getFilteredCreatives();
    return filteredCreatives[placementId] || [];
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
   * MODIFIÉE : Vérifie si des lignes sélectionnées ont des tags CM360 en utilisant les tags filtrés
   */
  const selectedHasTags = (): boolean => {
    const filteredTags = getFilteredCM360Tags();
    for (const rowId of selectedRows) {
      const tagHistory = filteredTags.get(rowId);
      if (tagHistory?.latestTag) return true;
    }
    return false;
  };

  /**
   * Applique une couleur aux lignes sélectionnées
   */
  const applyColorToSelected = async (color: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedTactique) return;
    
    const clientId = selectedClient.clientId;
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
          // CORRIGÉ : Type assertions pour éviter les erreurs TypeScript
          if (row.type === 'placement') {
            const placementData = { ...row.data } as Placement;
            placementData.PL_Adops_Color = color;
            
            const updatedChildren = row.children?.map(child => {
              const childRowId = `${child.type}-${child.data.id}`;
              if (selectedRows.has(childRowId)) {
                const creativeData = { ...child.data } as Creative;
                creativeData.CR_Adops_Color = color;
                return {
                  ...child,
                  data: creativeData
                };
              }
              return child;
            });
            
            return {
              ...row,
              data: placementData,
              children: updatedChildren
            };
          } else {
            // Creative
            const creativeData = { ...row.data } as Creative;
            creativeData.CR_Adops_Color = color;
            
            return {
              ...row,
              data: creativeData
            };
          }
        }
        
        if (row.children) {
          const updatedChildren = row.children.map(child => {
            const childRowId = `${child.type}-${child.data.id}`;
            if (selectedRows.has(childRowId)) {
              const creativeData = { ...child.data } as Creative;
              creativeData.CR_Adops_Color = color;
              return {
                ...child,
                data: creativeData
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
   * MODIFIÉE : Trouve l'ID du placement parent pour un créatif en utilisant les créatifs filtrés
   */
  const getPlacementIdForCreative = (creativeId: string): string | null => {
    const filteredCreatives = getFilteredCreatives();
    for (const [placementId, creatives] of Object.entries(filteredCreatives)) {
      if (creatives.some(c => c.id === creativeId)) {
        return placementId;
      }
    }
    return null;
  };

  // MODIFIÉ : Construire les lignes quand les données changent + réinitialiser les filtres
  useEffect(() => {
    if (selectedTactique) {
      const filteredCreatives = getFilteredCreatives();
      buildTableRows(selectedTactique.placementsWithTags, filteredCreatives);
    } else {
      setTableRows([]);
    }
    setSelectedRows(new Set());
    setSearchTerm('');
    // Réinitialiser tous les filtres
    setCm360Filter('all');
    setColorFilter('all');
  }, [selectedTactique, creativesData]);

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
  const filteredTags = getFilteredCM360Tags();

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
     
              
              {/* Boutons CM360 */}
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={createCM360Tags}
                  disabled={cm360Loading}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  {cm360Loading ? 'Création...' : 'Créer'}
                </button>
                
                {selectedHasTags() && (
                  <button
                    onClick={cancelCM360Tags}
                    disabled={cm360Loading}
                    className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                    title="Supprime TOUT l'historique des tags CM360 pour les éléments sélectionnés"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
              </div>
              
              {/* Couleurs */}
              <div className="flex items-center gap-1 ml-5">
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
                    <div className="w-4 h-4 rounded-full bg-white relative">
                      {/* La première barre de la croix */}
                      <div className="absolute top-1/2 left-1/2 w-3 h-0.5 -translate-x-[0.175rem] -translate-y-1/2 bg-red-500 rotate-45"></div>
                      
                      {/* La deuxième barre de la croix */}
                      <div className="absolute top-1/2 left-1/2 w-3 h-0.5 -translate-x-[0.175rem] -translate-y-1/2 bg-red-500 -rotate-45"></div>
                    </div>
                </button>
              </div>
              
              <button
                onClick={() => setSelectedRows(new Set())}
                className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 ml-5"
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
          <span className="text-sm font-medium text-gray-700">Statut :</span>
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
        
        {/* NOUVEAU : Filtres par couleur */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Couleur:</span>
          <div className="flex items-center gap-1">
            {COLOR_FILTER_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setColorFilter(option.value)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors flex items-center  ${
                  colorFilter === option.value
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
                title={`Filtrer par ${option.label.toLowerCase()}`}
              >
                {/* Indicateur visuel de couleur */}
                {option.color && (
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: option.color }}
                  ></div>
                )}
                {option.value === 'none' && (
                  <div className="w-4 h-4 rounded-full border border-gray-400 bg-white relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-0.5 bg-red-500 rotate-45"></div>
                      <div className="w-2 h-0.5 bg-red-500 -rotate-45 absolute"></div>
                    </div>
                  </div>
                )}
                <span>{option.label}</span>
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
              <th className="w-8 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
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
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucun placement trouvé'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => {
                const rowId = `${row.type}-${row.data.id}`;
                const cm360Status = getCM360Status(rowId);
                const cm360History = filteredTags.get(rowId);
                
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
                    cm360Tags={filteredTags}
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