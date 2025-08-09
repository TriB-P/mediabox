// app/components/AdOps/AdOpsTacticTable.tsx
/**
 * Composant AdOpsTacticTable
 * Tableau hiérarchique avancé pour afficher placements et créatifs d'une tactique.
 * Fonctionnalités: recherche, coloration, sélection multiple, copie, collapse/expand.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useClient } from '../../contexts/ClientContext';
import AdOpsTableRow from './AdOpsTableRow';

interface SelectedTactique {
  id: string;
  TC_Label?: string;
  ongletName: string;
  sectionName: string;
  ongletId: string; // Ajout des IDs
  sectionId: string; // Ajout des IDs
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
  placementId?: string; // Pour les créatifs
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
 * Composant principal du tableau AdOps
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

  /**
   * Charge les créatifs ET recharge les placements avec leurs couleurs
   */
  const loadCreatives = async () => {
    if (!selectedTactique || !selectedClient || !selectedCampaign || !selectedVersion) return;
    
    setLoading(true);
    const clientId = selectedClient.clientId || selectedClient.id;
    const allCreatives: { [placementId: string]: Creative[] } = {};
    const updatedPlacements: Placement[] = [];

    try {
      // Utiliser les IDs au lieu des noms
      const basePath = `clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${selectedTactique.ongletId}/sections/${selectedTactique.sectionId}/tactiques/${selectedTactique.id}`;
      
      for (const placement of selectedTactique.placementsWithTags) {
        // 1. Recharger les données du placement pour récupérer les couleurs
        try {
          const placementRef = doc(db, `${basePath}/placements/${placement.id}`);
          const placementSnapshot = await getDoc(placementRef);
          
          if (placementSnapshot.exists()) {
            const placementData = placementSnapshot.data() as Placement;
            const updatedPlacement = {
              ...placement,
              ...placementData,
              id: placement.id
            };
            updatedPlacements.push(updatedPlacement);
          } else {
            // Si pas trouvé, garder l'original
            updatedPlacements.push(placement);
          }
        } catch (error) {
          console.warn(`Erreur chargement placement ${placement.id}:`, error);
          updatedPlacements.push(placement);
        }

        // 2. Charger les créatifs
        const creativesPath = `${basePath}/placements/${placement.id}/creatifs`;
        const creativesRef = collection(db, creativesPath);
        
        console.log(`FIREBASE: LECTURE - Fichier: AdOpsTacticTable.tsx - Path: ${creativesPath}`);
        const creativesSnapshot = await getDocs(query(creativesRef, orderBy('CR_Order', 'asc')));
        
        const creatives: Creative[] = creativesSnapshot.docs.map(doc => ({
          ...doc.data() as Creative,
          id: doc.id
        }));
        
        allCreatives[placement.id] = creatives;
      }
      
      setCreativesData(allCreatives);
      buildTableRows(updatedPlacements, allCreatives); // Utiliser les placements rechargés
    } catch (error) {
      console.error('Erreur chargement créatifs:', error);
      // Continuer sans créatifs si erreur
      setCreativesData({});
      buildTableRows(selectedTactique.placementsWithTags, {}); // Fallback sur les données originales
    } finally {
      setLoading(false);
    }
  };

  /**
   * Construit la structure hiérarchique du tableau
   */
  const buildTableRows = (placements: Placement[], creatives: { [placementId: string]: Creative[] }) => {
    const rows: TableRow[] = [];
    
    placements.forEach(placement => {
      // Ligne du placement
      const placementRow: TableRow = {
        type: 'placement',
        level: 0,
        data: placement,
        isExpanded: false,
        children: []
      };
      
      // Ajouter les créatifs comme enfants
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
   * Filtre les lignes selon le terme de recherche
   */
  const getFilteredRows = (): TableRow[] => {
    if (!searchTerm.trim()) return getFlattenedRows();
    
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
          isExpanded: hasMatchingCreatives, // Auto-expand si créatifs correspondent
          children: placementMatches ? placementRow.children : matchingCreatives
        };
        filtered.push(filteredPlacementRow);
      }
    });
    
    return getFlattenedRows(filtered);
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
   * Gère la sélection des lignes avec support Shift et logique hiérarchique corrigée
   */
  const handleRowSelection = (rowId: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const flatRows = getFilteredRows();
    const newSelection = new Set(selectedRows);
    
    if (event.shiftKey && lastClickedIndex !== null) {
      // SÉLECTION PAR PLAGE avec Shift
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      
      // Déterminer si on sélectionne ou désélectionne (basé sur l'élément cliqué)
      const shouldSelect = !newSelection.has(rowId);
      
      // Appliquer l'action à toutes les lignes dans la plage
      for (let i = start; i <= end; i++) {
        if (flatRows[i]) {
          const rangeRowId = `${flatRows[i].type}-${flatRows[i].data.id}`;
          
          if (shouldSelect) {
            newSelection.add(rangeRowId);
            
            // Si c'est un placement, sélectionner aussi ses créatifs
            if (flatRows[i].type === 'placement') {
              const children = getChildrenForPlacement(flatRows[i].data.id);
              children.forEach(child => {
                const childRowId = `creative-${child.id}`;
                newSelection.add(childRowId);
              });
            }
          } else {
            newSelection.delete(rangeRowId);
            
            // Si c'est un placement, désélectionner aussi ses créatifs
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
      // SÉLECTION SIMPLE avec logique hiérarchique simplifiée
      const [type, id] = rowId.split('-');
      
      if (newSelection.has(rowId)) {
        // DÉSÉLECTION
        newSelection.delete(rowId);
        
        // RÈGLE: Si placement désélectionné → désélectionner tous ses créatifs
        if (type === 'placement') {
          const children = getChildrenForPlacement(id);
          children.forEach(child => {
            const childRowId = `creative-${child.id}`;
            newSelection.delete(childRowId);
          });
        }
        
      } else {
        // SÉLECTION
        newSelection.add(rowId);
        
        // RÈGLE: Si placement sélectionné → sélectionner tous ses créatifs
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
   * Applique une couleur aux lignes sélectionnées avec mise à jour optimiste
   */
  const applyColorToSelected = async (color: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedTactique) return;
    
    const clientId = selectedClient.clientId || selectedClient.id;
    // Utiliser les IDs au lieu des noms
    const basePath = `clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${selectedTactique.ongletId}/sections/${selectedTactique.sectionId}/tactiques/${selectedTactique.id}`;
    const updates: Promise<void>[] = [];
    
    // 1. Mise à jour optimiste locale AVANT Firebase
    updateLocalColors(color);
    
    // 2. Préparer les mises à jour Firebase
    selectedRows.forEach(rowId => {
      const [type, id] = rowId.split('-');
      
      if (type === 'placement') {
        const docRef = doc(db, `${basePath}/placements/${id}`);
        updates.push(updateDoc(docRef, { PL_Adops_Color: color }));
      } else if (type === 'creative') {
        // Trouver le placement parent
        const placementId = getPlacementIdForCreative(id);
        if (placementId) {
          const docRef = doc(db, `${basePath}/placements/${placementId}/creatifs/${id}`);
          updates.push(updateDoc(docRef, { CR_Adops_Color: color }));
        }
      }
    });
    
    // 3. Sauvegarder dans Firebase en arrière-plan
    try {
      await Promise.all(updates);
    } catch (error) {
      console.error('Erreur sauvegarde couleurs:', error);
      // En cas d'erreur, on pourrait revert les changements locaux
    }
    
    // 4. NE PAS désélectionner - maintenir la sélection pour permettre d'autres actions
    // setSelectedRows(new Set()); // SUPPRIMÉ
  };

  /**
   * Met à jour les couleurs localement sans recharger depuis Firebase
   */
  const updateLocalColors = (color: string) => {
    // Mettre à jour les données des tactiques
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

    // Mettre à jour les créatifs localement
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
    
    // Reconstruire les lignes du tableau SANS perdre les états d'expansion
    updateTableRowsColors(color);
  };

  /**
   * Met à jour les couleurs dans tableRows en préservant les états d'expansion
   */
  const updateTableRowsColors = (color: string) => {
    setTableRows(prevRows => 
      prevRows.map(row => {
        const rowId = `${row.type}-${row.data.id}`;
        
        // Mettre à jour la couleur si cette ligne est sélectionnée
        if (selectedRows.has(rowId)) {
          const updatedData = { ...row.data };
          if (row.type === 'placement') {
            updatedData.PL_Adops_Color = color;
          } else {
            updatedData.CR_Adops_Color = color;
          }
          
          // Mettre à jour les enfants aussi si c'est un placement
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
            // IMPORTANT: on garde isExpanded tel quel !
          };
        }
        
        // Même si le placement n'est pas sélectionné, vérifier ses enfants
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
            // IMPORTANT: on garde isExpanded tel quel !
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
      loadCreatives();
    } else {
      setTableRows([]);
      setCreativesData({});
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
      {/* En-tête avec recherche et actions */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{selectedTactique.TC_Label}</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectionStats.total} sélectionné{selectionStats.total > 1 ? 's' : ''} 
                {selectionStats.placements > 0 && selectionStats.creatives > 0 && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({selectionStats.placements} placement{selectionStats.placements > 1 ? 's' : ''}, {selectionStats.creatives} créatif{selectionStats.creatives > 1 ? 's' : ''})
                  </span>
                )}
              </span>
              
              {/* Icônes de couleur directement cliquables */}
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
                
                {/* Bouton transparent pour enlever la couleur */}
                <button
                  onClick={() => applyColorToSelected('')}
                  className="w-6 h-6 rounded-full border-2 border-gray-400 hover:border-gray-600 bg-white transition-all duration-200 relative"
                  title="Enlever la couleur"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border border-gray-400 bg-white relative">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs font-bold">
                        ∅
                      </div>
                    </div>
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

      {/* Barre de recherche */}
      <div className="mb-3">
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
                      // Sélectionner toutes les lignes visibles
                      const allIds = new Set(filteredRows.map(row => `${row.type}-${row.data.id}`));
                      setSelectedRows(allIds);
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
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
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
                    Chargement des créatifs...
                  </div>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucun placement trouvé'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => (
                <AdOpsTableRow
                  key={`${row.type}-${row.data.id}`}
                  row={row}
                  index={index}
                  isSelected={selectedRows.has(`${row.type}-${row.data.id}`)}
                  onToggleExpanded={toggleExpanded}
                  onRowSelection={handleRowSelection}
                  selectedTactique={selectedTactique}
                  selectedCampaign={selectedCampaign}
                  selectedVersion={selectedVersion}
                  selectedRows={selectedRows}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Informations */}
      <div className="mt-3 text-xs text-gray-500">
        {filteredRows.length} ligne{filteredRows.length > 1 ? 's' : ''} • 
        Maintenez Shift pour sélectionner/désélectionner une plage • 
        Sélectionner un placement sélectionne ses créatifs •
        Cliquez sur une valeur pour la copier
      </div>
    </div>
  );
}