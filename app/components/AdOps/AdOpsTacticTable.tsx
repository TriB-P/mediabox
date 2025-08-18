// app/components/AdOps/AdOpsTacticTable.tsx
/**
 * Composant AdOpsTacticTable avec fonctionnalités CM360
 * Tableau hiérarchique avancé avec création de tags CM360, détection de changements,
 * et indicateurs visuels pour le statut des tags.
 * MODIFIÉ : Utilise les données centralisées d'AdOpsPage avec filtrage hierarchique
 * AMÉLIORÉ : Sans fond blanc individuel + colonne Actions élargie
 * CORRIGÉ : Rechargement des données après modification des couleurs
 * NOUVEAU : Expansion des colonnes tags avec chevron + filtres rétractables
 */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  ChevronRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { doc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useClient } from '../../contexts/ClientContext';
import AdOpsTableRow from './AdOpsTableRow';
import {
  createCM360Tag,
  deleteAllCM360TagsForItem,
  createTacticsMetricsTagIfNeeded,
  CM360TagHistory,
  CM360Filter
} from '../../lib/cm360Service';
import { Check } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';


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
  onDataReload?: () => void; // NOUVEAU : Callback pour recharger toutes les données
}

const COLORS = [
  { name: '', value: '#F9C8DC', class: 'bg-pink-100' },
  { name: '', value: '#FFDE70', class: 'bg-green-100' },
  { name: '', value: '#ADE0EB', class: 'bg-blue-100' },
  { name: '', value: '#7EDD8F', class: 'bg-yellow-100' }
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
  onCM360TagsReload,
  onDataReload // NOUVEAU : Callback pour recharger toutes les données
}: AdOpsTacticTableProps) {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  
  // États CM360 et filtres
  const [cm360Loading, setCm360Loading] = useState(false);
  const [cm360Filter, setCm360Filter] = useState<CM360Filter>('all');
  const [colorFilter, setColorFilter] = useState<string>('all'); // NOUVEAU : Filtre par couleur
  const [isTagColumnsExpanded, setIsTagColumnsExpanded] = useState(false); // NOUVEAU : État expansion colonnes tags
  const [isFiltersVisible, setIsFiltersVisible] = useState(false); // NOUVEAU : État visibilité filtres

  // NOUVEAU : Options de filtre par couleur
  const COLOR_FILTER_OPTIONS = [
    { value: 'all', label: t('adOpsTacticTable.colorFilter.all'), color: null },
    { value: 'none', label: '', color: null },
    ...COLORS.map(color => ({ value: color.value, label: color.name, color: color.value }))
  ];

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
 * OPTIMISÉ : Sauvegarde dans Firestore SANS recharger les données
 * Les modifications locales sont conservées pour un feedback immédiat
 */
const applyColorToSelected = async (color: string) => {
  if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedTactique) return;
  
  const clientId = selectedClient.clientId;
  const basePath = `clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${selectedTactique.ongletId}/sections/${selectedTactique.sectionId}/tactiques/${selectedTactique.id}`;
  const updates: Promise<void>[] = [];
  
  // 1. Mise à jour locale immédiate pour un feedback visuel
  updateLocalColors(color);
  
  // 2. Préparer les mises à jour Firestore
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
    // 3. Sauvegarder dans Firestore
    await Promise.all(updates);
    console.log('✅ [TacticTable] Couleurs sauvegardées dans Firestore');
    
    // 4. SUPPRIMÉ : Plus besoin de recharger les données !
    // Les modifications locales sont déjà appliquées et Firestore est à jour
    // onDataReload() était inutile et causait des problèmes
    
  } catch (error) {
    console.error('Erreur sauvegarde couleurs:', error);
    // En cas d'erreur, on pourrait optionnellement revenir en arrière sur les modifications locales
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
 * AMÉLIORÉ : Debug logging pour vérifier que les créatifs sont bien mis à jour
 */
const updateTableRowsColors = (color: string) => {
  console.log('🎨 [TacticTable] Mise à jour locale des couleurs:', {
    color,
    selectedRows: Array.from(selectedRows),
    selectedRowsSize: selectedRows.size
  });
  
  setTableRows(prevRows => 
    prevRows.map(row => {
      const rowId = `${row.type}-${row.data.id}`;
      
      if (selectedRows.has(rowId)) {
        console.log(`🎨 [TacticTable] Mise à jour couleur pour ${row.type} ${row.data.id}`);
        
        // CORRIGÉ : Type assertions pour éviter les erreurs TypeScript
        if (row.type === 'placement') {
          const placementData = { ...row.data } as Placement;
          placementData.PL_Adops_Color = color;
          
          // Mettre à jour les créatifs enfants sélectionnés
          const updatedChildren = row.children?.map(child => {
            const childRowId = `${child.type}-${child.data.id}`;
            if (selectedRows.has(childRowId)) {
              console.log(`🎨 [TacticTable] Mise à jour couleur pour créatif enfant ${child.data.id}`);
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
          // Creative standalone
          console.log(`🎨 [TacticTable] Mise à jour couleur pour créatif standalone ${row.data.id}`);
          const creativeData = { ...row.data } as Creative;
          creativeData.CR_Adops_Color = color;
          
          return {
            ...row,
            data: creativeData
          };
        }
      }
      
      // Vérifier les créatifs enfants même si le placement parent n'est pas sélectionné
      if (row.children && row.type === 'placement') {
        const updatedChildren = row.children.map(child => {
          const childRowId = `${child.type}-${child.data.id}`;
          if (selectedRows.has(childRowId)) {
            console.log(`🎨 [TacticTable] Mise à jour couleur pour créatif enfant indépendant ${child.data.id}`);
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
  
  console.log('✅ [TacticTable] Mise à jour locale des couleurs terminée');
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

  const reloadCurrentTactiqueData = async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedTactique) return;
    
    console.log('🔄 [TacticTable] Rechargement données tactique courante:', selectedTactique.TC_Label);
    
    const clientId = selectedClient.clientId;
    const basePath = `clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${selectedTactique.ongletId}/sections/${selectedTactique.sectionId}/tactiques/${selectedTactique.id}`;
    
    try {
      // Recharger tous les placements avec leurs dernières données (incluant couleurs)
      const placementsRef = collection(db, `${basePath}/placements`);
      const placementsSnapshot = await getDocs(query(placementsRef, orderBy('PL_Order', 'asc')));
      
      const updatedPlacements: Placement[] = [];
      const updatedCreativesData: { [placementId: string]: Creative[] } = {};
      
      // Pour chaque placement, recharger ses données et ses créatifs
      for (const placementDoc of placementsSnapshot.docs) {
        const placementData = { ...placementDoc.data(), id: placementDoc.id } as Placement;
        
        // Vérifier si ce placement a PL_Tag_Type (filtre AdOps)
        if (placementData.PL_Tag_Type && placementData.PL_Tag_Type.trim() !== '') {
          updatedPlacements.push(placementData);
          
          // Recharger les créatifs de ce placement avec leurs couleurs
          const creativesRef = collection(db, `${basePath}/placements/${placementDoc.id}/creatifs`);
          const creativesSnapshot = await getDocs(query(creativesRef, orderBy('CR_Order', 'asc')));
          
          const creatives: Creative[] = creativesSnapshot.docs.map(doc => ({
            ...doc.data() as Creative,
            id: doc.id
          }));
          
          updatedCreativesData[placementDoc.id] = creatives;
        }
      }
      
      console.log('✅ [TacticTable] Données tactique rechargées avec couleurs:', {
        placements: updatedPlacements.length,
        totalCreatives: Object.values(updatedCreativesData).reduce((sum, creatives) => sum + creatives.length, 0)
      });
      
      // Reconstruire les lignes du tableau avec les nouvelles données
      buildTableRows(updatedPlacements, updatedCreativesData);
      
    } catch (error) {
      console.error('❌ [TacticTable] Erreur rechargement données tactique:', error);
      // En cas d'erreur, utiliser les données existantes
      const filteredCreatives = getFilteredCreatives();
      buildTableRows(selectedTactique.placementsWithTags, filteredCreatives);
    }
  };

  // MODIFIÉ : Construire les lignes quand les données changent + réinitialiser les filtres
  useEffect(() => {
    if (selectedTactique) {
      // Recharger spécifiquement les données de cette tactique depuis Firestore
      // pour avoir les dernières couleurs sauvegardées
      reloadCurrentTactiqueData();
    } else {
      setTableRows([]);
    }
    setSelectedRows(new Set());
    setSearchTerm('');
    // Réinitialiser tous les filtres
    setCm360Filter('all');
    setColorFilter('all');
    setIsTagColumnsExpanded(false); // NOUVEAU : Réinitialiser l'expansion des colonnes
    setIsFiltersVisible(false); // NOUVEAU : Masquer les filtres
  }, [selectedTactique?.id]); // IMPORTANT : Dépendre de l'ID pour déclencher le rechargement

  if (!selectedTactique) {
    return (
      <div className="p-4 h-full">
        <div className="flex items-center justify-center h-32 text-gray-500 text-center">
          <div>
            <p className="text-sm">{t('adOpsTacticTable.placeholder.noTacticSelected')}</p>
            <p className="text-xs mt-1">{t('adOpsTacticTable.placeholder.selectTacticPrompt')}</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredRows = getFilteredRows();
  const selectionStats = getSelectionStats();
  const filteredTags = getFilteredCM360Tags();

  return (
    <div className="p-4 h-full flex flex-col">
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
                  {cm360Loading ? t('adOpsTacticTable.buttons.creating') : t('common.create')}
                </button>
                
                {selectedHasTags() && (
                  <button
                    onClick={cancelCM360Tags}
                    disabled={cm360Loading}
                    className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                    title={t('adOpsTacticTable.tooltips.deleteAllHistory')}
                  >
                    <XMarkIcon className="w-4 h-4" />
                    {t('common.delete')}
                  </button>
                )}
              </div>
              
              {/* Couleurs */}
              <div className="flex items-center gap-1 ml-5">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => applyColorToSelected(color.value)}
                    className={`w-6 h-6 rounded-full border-2  hover:border-gray-500 transition-all duration-200 ${color.class}`}
                    title={`${t('adOpsTacticTable.tooltips.applyColor')} ${color.name.toLowerCase()}`}
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
                  title={t('adOpsTacticTable.tooltips.removeColor')}
                >
                    <div className="w-4 h-4 rounded-full bg-white relative">
                      {/* La première barre de la croix */}
                      <div className="absolute top-1/2 left-1/2 w-3 h-0.5 -translate-x-[0.22rem] -translate-y-1/2 bg-red-500 rotate-45"></div>
                      
                      {/* La deuxième barre de la croix */}
                      <div className="absolute top-1/2 left-1/2 w-3 h-0.5 -translate-x-[0.22rem] -translate-y-1/2 bg-red-500 -rotate-45"></div>
                    </div>
                </button>
              </div>
              
              <button
                onClick={() => setSelectedRows(new Set())}
                className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 ml-5"
              >
                {t('adOpsTacticTable.buttons.deselect')} ({selectionStats.total})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-3 space-y-3">
        {/* Recherche avec icône de filtre */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('adOpsTacticTable.search.placeholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {/* Bouton filtre */}
          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className={`p-2 border rounded-md transition-colors flex items-center gap-2 ${
              isFiltersVisible || cm360Filter !== 'all' || colorFilter !== 'all'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            title="Afficher/masquer les filtres"
          >
            <FunnelIcon className="w-4 h-4" />
            {(cm360Filter !== 'all' || colorFilter !== 'all') && (
              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
            )}
          </button>
        </div>
        
        {/* Filtres Statut et Couleur - Affichage conditionnel */}
        {isFiltersVisible && (
          <div className="flex items-center gap-6 flex-wrap p-3 bg-gray-50 rounded-lg border">
            {/* Filtres CM360 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{t('adOpsTacticTable.filters.statusLabel')}</span>
              <div className="flex items-center gap-1">
                {[
                  { value: 'all' as CM360Filter, label: t('adOpsTacticTable.filters.all'), color: 'gray' },
                  { value: 'created' as CM360Filter, label: t('adOpsTacticTable.filters.tagsCreated'), color: 'green' },
                  { value: 'changed' as CM360Filter, label: t('adOpsTacticTable.filters.toModify'), color: 'orange' },
                  { value: 'none' as CM360Filter, label: t('adOpsTacticTable.filters.toCreate'), color: 'blue' }
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
            
            {/* Filtres par couleur - Style mixte */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{t('adOpsTacticTable.filters.colorLabel')}</span>
              <div className="flex items-center gap-1">
                {/* Bouton "Tous" textuel */}
                <button
                  onClick={() => setColorFilter('all')}
                  className={`px-3 h-6 text-xs rounded-full border transition-colors flex items-center ${
                    colorFilter === 'all'
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t('adOpsTacticTable.filters.all')}
                </button>
                
                {/* Bouton "Aucune" avec croix */}
                <button
                  onClick={() => setColorFilter('none')}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center bg-white ${
                    colorFilter === 'none'
                      ? 'border-indigo-500 ring-2 ring-indigo-200'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  title={t('adOpsTacticTable.tooltips.filterNoColor')}
                >
                  <div className="w-5 h-5 rounded-full bg-white relative">
                    <div className="absolute inset-0 flex items-center justify-center">
             
                    </div>
                  </div>
                </button>
                
                {/* Boutons couleurs pleines */}
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
                    title={`${t('adOpsTacticTable.tooltips.filterByColor')} ${color.name.toLowerCase()}`}
                  >
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tableau scrollable avec colonne Actions élargie */}
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
              <th className="w-12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
              {/* NOUVEAU : Colonne Actions avec chevron d'expansion */}
              <th className="w-96 px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center gap-2">
                  {t('adOpsTacticTable.headers.actions')}
                  <button
                    onClick={() => setIsTagColumnsExpanded(!isTagColumnsExpanded)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ChevronRightIcon
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isTagColumnsExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </th>
              {/* NOUVEAU : Colonnes tags conditionnelles */}
              {isTagColumnsExpanded && (
                <>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tag 1</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tag 2</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tag 3</th>
                </>
              )}
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOpsTacticTable.headers.tagType')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOpsTacticTable.headers.startDate')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOpsTacticTable.headers.endDate')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOpsTacticTable.headers.rotation')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOpsTacticTable.headers.floodlight')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOpsTacticTable.headers.thirdParty')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOpsTacticTable.headers.vpaid')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={isTagColumnsExpanded ? 14 : 11} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? `${t('adOpsTacticTable.table.noResultsFor')} "${searchTerm}"` : t('adOpsTacticTable.table.noPlacementsFound')}
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
                    isTagColumnsExpanded={isTagColumnsExpanded}
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