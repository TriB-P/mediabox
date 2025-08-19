// app/components/AdOps/AdOpsTacticTable.tsx
/**
 * Composant AdOpsTacticTable SIMPLIFIÉ avec niveau hiérarchique Tactiques
 * REFACTORISÉ : Tableau principal allégé utilisant AdOpsTableRow séparé
 * CORRIGÉ : Gestion des couleurs optimisée sans rechargement intempestif
 * AMÉLIORÉ : Boutons de filtres remontés, panneau de filtres, sélection avec Shift
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  FunnelIcon,
  CheckIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useClient } from '../../contexts/ClientContext';
import AdOpsTableRow from './AdOpsTableRow';
import {
  createCM360Tag,
  deleteAllCM360TagsForItem,
  CM360TagHistory,
  CM360Filter,
  detectMetricsChanges
} from '../../lib/cm360Service';
import { useTranslation } from '../../contexts/LanguageContext';

// Interfaces simplifiées
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

/**
 * Composant principal du tableau AdOps simplifié
 */
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
  
  // États simplifiés
  const [searchTerm, setSearchTerm] = useState('');
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  
  // États de filtres
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
   * Calcule le statut CM360 d'une tactique
   */
  const getTactiqueCM360Status = (tactique: AdOpsTactique): 'none' | 'created' | 'changed' | 'partial' => {
    const tactiquesCM360Tags = getFilteredCM360Tags(tactique.id);
    const tactiquesCreatives = creativesData?.[tactique.id] || {};
    
    const allElements: string[] = [];
    tactique.placementsWithTags.forEach(placement => {
      allElements.push(`placement-${placement.id}`);
      const creatives = tactiquesCreatives[placement.id] || [];
      creatives.forEach(creative => {
        allElements.push(`creative-${creative.id}`);
      });
    });
    
    if (allElements.length === 0) return 'none';
    
    let elementsWithTags = 0;
    let elementsWithChanges = 0;
    
    allElements.forEach(itemKey => {
      const history = tactiquesCM360Tags.get(itemKey);
      if (history?.latestTag) {
        elementsWithTags++;
        if (history.hasChanges) {
          elementsWithChanges++;
        }
      }
    });
    
    let metricsHaveTag = false;
    let metricsHaveChanges = false;
    
    const metricsHistory = tactiquesCM360Tags.get('metrics-tactics');
    if (metricsHistory?.latestTag) {
      metricsHaveTag = true;
      
      const tactiqueMetrics = {
        TC_Media_Budget: tactique.TC_Media_Budget,
        TC_BuyCurrency: tactique.TC_BuyCurrency,
        TC_CM360_Rate: tactique.TC_CM360_Rate,
        TC_CM360_Volume: tactique.TC_CM360_Volume,
        TC_Buy_Type: tactique.TC_Buy_Type
      };
      
      const metricsChanges = detectMetricsChanges(tactiqueMetrics, tactiquesCM360Tags);
      metricsHaveChanges = metricsChanges.hasChanges;
    }
    
    const hasAnyTags = elementsWithTags > 0 || metricsHaveTag;
    const hasAnyChanges = elementsWithChanges > 0 || metricsHaveChanges;
    const allElementsHaveTags = elementsWithTags === allElements.length;
    
    if (!hasAnyTags) return 'none';
    if (hasAnyChanges) return 'changed';
    if (allElementsHaveTags && metricsHaveTag) return 'created';
    return 'partial';
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
        if (row.type === 'tactique') {
          const status = getTactiqueCM360Status(row.data as AdOpsTactique);
          switch (cm360Filter) {
            case 'created': return status === 'created';
            case 'changed': return status === 'changed';
            case 'none': return status === 'none';
            default: return true;
          }
        } else {
          const rowId = `${row.type}-${row.data.id}`;
          const tactiqueId = row.tactiqueId!;
          const filteredTags = getFilteredCM360Tags(tactiqueId);
          const history = filteredTags.get(rowId);
          
          switch (cm360Filter) {
            case 'created': return history?.latestTag && !history.hasChanges;
            case 'changed': return history?.latestTag && history.hasChanges;
            case 'none': return !history?.latestTag;
            default: return true;
          }
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
   * NOUVEAU : Gère la sélection des lignes avec support Shift pour les plages
   */
  const handleRowSelection = (rowId: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const newSelection = new Set(selectedRows);
    const filteredRows = getFilteredRows();
    
    if (event.shiftKey && lastSelectedIndex !== null) {
      // Sélection de plage avec Shift
      const startIndex = Math.min(lastSelectedIndex, index);
      const endIndex = Math.max(lastSelectedIndex, index);
      
      // Ajouter toutes les lignes dans la plage
      for (let i = startIndex; i <= endIndex; i++) {
        if (filteredRows[i]) {
          const currentRowId = `${filteredRows[i].type}-${filteredRows[i].data.id}`;
          newSelection.add(currentRowId);
        }
      }
    } else {
      // Sélection normale
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
   * CORRIGÉ : Application des couleurs sans rechargement intempestif
   */
  const applyColorToSelected = async (color: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    const clientId = selectedClient.clientId;
    const updates: Promise<void>[] = [];
    
    console.log('🎨 [ApplyColor] Application couleur:', { color, selectedRows: Array.from(selectedRows) });
    
    // 1. Mise à jour locale IMMÉDIATE (pas de rechargement)
    setTableRows(prevRows => {
      const updateRowsRecursive = (rows: TableRow[]): TableRow[] => {
        return rows.map(row => {
          const rowId = `${row.type}-${row.data.id}`;
          
          if (selectedRows.has(rowId)) {
            console.log(`🎨 Mise à jour locale ${row.type} ${row.data.id}`);
            
            // NOUVEAU : Support couleur tactiques
            if (row.type === 'tactique') {
              const updatedData = { ...row.data, TC_Adops_Color: color };
              return { ...row, data: updatedData };
            } else if (row.type === 'placement') {
              const updatedData = { ...row.data, PL_Adops_Color: color };
              return { ...row, data: updatedData };
            } else if (row.type === 'creative') {
              const updatedData = { ...row.data, CR_Adops_Color: color };
              return { ...row, data: updatedData };
            }
          }
          
          // Récursion pour les enfants
          if (row.children && row.children.length > 0) {
            return { ...row, children: updateRowsRecursive(row.children) };
          }
          
          return row;
        });
      };
      
      return updateRowsRecursive(prevRows);
    });
    
    // 2. Préparation des mises à jour Firestore (en arrière-plan)
    selectedRows.forEach(rowId => {
      const [type, id] = rowId.split('-');
      
      for (const tactique of selectedTactiques) {
        const basePath = `clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${tactique.ongletId}/sections/${tactique.sectionId}/tactiques/${tactique.id}`;
        
        if (type === 'tactique' && tactique.id === id) {
          // NOUVEAU : Support couleur tactiques dans Firestore
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
    
    // 3. Sauvegarde Firestore en arrière-plan (SANS RECHARGEMENT)
    try {
      await Promise.all(updates);
      console.log('✅ [ApplyColor] Couleurs sauvegardées dans Firestore');
      // SUPPRIMÉ : Plus de rechargement automatique !
    } catch (error) {
      console.error('❌ [ApplyColor] Erreur sauvegarde couleurs:', error);
    }
  };

  // Construction des lignes quand les tactiques changent
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
      {/* NOUVEAU : En-tête avec titre et boutons de filtrage remontés */}
      <div className="flex items-center justify-between mb-3 px-4 pt-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedTactiques.length} {selectedTactiques.length > 1 ? 'tactiques sélectionnées' : 'tactique sélectionnée'}
          </h3>
          
          {/* REMONTÉ : Boutons de filtrage par type */}
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
                disabled={cm360Loading}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                <CheckIcon className="w-4 h-4" />
                {cm360Loading ? 'Création...' : 'Créer'}
              </button>
            </div>
            
            {/* Couleurs - CORRIGÉ */}
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

      {/* Barre de recherche et filtres */}
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

        {/* NOUVEAU : Panneau de filtres déroulant */}
        {isFiltersVisible && (
          <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              {/* Filtre CM360 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut CM360
                </label>
                <select
                  value={cm360Filter}
                  onChange={(e) => setCm360Filter(e.target.value as CM360Filter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tous</option>
                  <option value="created">Tags créés</option>
                  <option value="changed">Changements détectés</option>
                  <option value="none">Aucun tag</option>
                </select>
              </div>

              {/* Filtre couleur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <select
                  value={colorFilter}
                  onChange={(e) => setColorFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Toutes</option>
                  <option value="none">Aucune couleur</option>
                  {COLORS.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setCm360Filter('all');
                  setColorFilter('all');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tableau pleine largeur */}
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
              
              {/* Colonnes conditionnelles */}
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
                const cm360Status = row.type === 'tactique' 
                  ? getTactiqueCM360Status(row.data as AdOpsTactique)
                  : 'none'; // Simplifié pour l'instant
                
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