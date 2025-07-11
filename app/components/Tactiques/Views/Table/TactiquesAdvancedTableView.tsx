// app/components/Tactiques/Views/Table/TactiquesAdvancedTableView.tsx - CORRECTION LISTES DYNAMIQUES

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Section, Tactique, Placement, Creatif } from '../../../../types/tactiques';
import { useAdvancedTableData } from '../../../../hooks/useAdvancedTableData';
import DynamicTableStructure from './DynamicTableStructure';
import { useTableNavigation } from './EditableTableCell';
import { getColumnsForLevel, getTactiqueSubCategories, TactiqueSubCategory } from './tableColumns.config';
import { useClient } from '../../../../contexts/ClientContext';
import { useCampaignSelection } from '../../../../hooks/useCampaignSelection';
import { usePartners } from '../../../../contexts/PartnerContext';
import {
  getDynamicList,
  getClientCustomDimensions,
  getCampaignBuckets,
  hasDynamicList,
  ListItem,
  ClientCustomDimensions,
  CampaignBucket,
} from '../../../../lib/tactiqueListService';

// ==================== TYPES ====================

export type TableLevel = 'section' | 'tactique' | 'placement' | 'creatif';

export interface TableRow {
  id: string;
  type: TableLevel;
  data: Section | Tactique | Placement | Creatif;
  level: number;
  isEditable: boolean;
  parentId?: string;
  sectionId: string;
  tactiqueId?: string;
  placementId?: string;
}

export interface DynamicColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'currency' | 'readonly';
  width?: number;
  options?: Array<{ id: string; label: string }>;
  validation?: (value: any) => boolean;
  format?: (value: any) => string;
}

export interface EntityCounts {
  sections: number;
  tactiques: number;
  placements: number;
  creatifs: number;
}

interface VisibleFields {
  TC_LoB?: boolean;
  TC_Media_Type?: boolean;
  TC_Publisher?: boolean;
  TC_Buying_Method?: boolean;
  TC_Custom_Dim_1?: boolean;
  TC_Custom_Dim_2?: boolean;
  TC_Custom_Dim_3?: boolean;
  TC_Inventory?: boolean;
  TC_Market?: boolean;
  TC_Language?: boolean;
  TC_Media_Objective?: boolean;
  TC_Kpi?: boolean;
  TC_Unit_Type?: boolean;
  [key: string]: boolean | undefined;
}

// ==================== PROPS ====================

interface TactiquesAdvancedTableViewProps {
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  onUpdateTactique: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  onUpdateSection: (sectionId: string, data: Partial<Section>) => Promise<void>;
  onUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  onUpdateCreatif: (creatifId: string, data: Partial<Creatif>) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function TactiquesAdvancedTableView({
  sections,
  tactiques,
  placements,
  creatifs,
  onUpdateTactique,
  onUpdateSection,
  onUpdatePlacement,
  onUpdateCreatif,
  formatCurrency
}: TactiquesAdvancedTableViewProps) {

  // ==================== CONTEXTES ====================

  const { selectedClient } = useClient();
  const { selectedCampaign, selectedVersion } = useCampaignSelection();
  const { getPublishersForSelect, isPublishersLoading } = usePartners();

  // ==================== ÉTATS POUR LES LISTES DYNAMIQUES ====================

  const [dynamicLists, setDynamicLists] = useState<{ [key: string]: ListItem[] }>({});
  const [buckets, setBuckets] = useState<CampaignBucket[]>([]);
  const [customDimensions, setCustomDimensions] = useState<ClientCustomDimensions>({});
  const [visibleFields, setVisibleFields] = useState<VisibleFields>({});
  const [listsLoading, setListsLoading] = useState(false);

  // ==================== CHARGEMENT DES LISTES DYNAMIQUES CORRIGÉ ====================

  const loadAllDynamicData = useCallback(async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) {
      console.log('🔄 loadAllDynamicData: Contexte incomplet');
      return;
    }

    console.log('🔄 Chargement des listes dynamiques pour le tableau...');
    setListsLoading(true);

    try {
      // 1. Charger les dimensions personnalisées du client
      const clientDimensions = await getClientCustomDimensions(selectedClient.clientId);
      setCustomDimensions(clientDimensions);

      // 2. Liste des champs à vérifier
      const dynamicListFields = [
        'TC_LoB', 'TC_Media_Type', 'TC_Buying_Method', 'TC_Custom_Dim_1',
        'TC_Custom_Dim_2', 'TC_Custom_Dim_3', 'TC_Market', 'TC_Language',
        'TC_Media_Objective', 'TC_Kpi', 'TC_Unit_Type'
      ];

      // 3. Déterminer quels champs personnalisés afficher
      const newVisibleFields: VisibleFields = {
        TC_Custom_Dim_1: !!clientDimensions.Custom_Dim_CA_1,
        TC_Custom_Dim_2: !!clientDimensions.Custom_Dim_CA_2,
        TC_Custom_Dim_3: !!clientDimensions.Custom_Dim_CA_3,
      };

      // 4. Vérifier quelles listes dynamiques existent et charger les données
      const newDynamicLists: { [key: string]: ListItem[] } = {};
      
      for (const field of dynamicListFields) {
        // Skip les custom dimensions non configurées
        if (field.startsWith('TC_Custom_Dim_') && !newVisibleFields[field]) {
          continue;
        }
        
        try {
          const hasListResult = await hasDynamicList(field, selectedClient.clientId);
          newVisibleFields[field] = hasListResult;
          
          if (hasListResult) {
            const list = await getDynamicList(field, selectedClient.clientId);
            newDynamicLists[field] = list;
            console.log(`✅ Liste ${field}: ${list.length} éléments chargés`);
          }
        } catch (fieldError) {
          console.warn(`⚠️ Erreur chargement ${field}:`, fieldError);
          newVisibleFields[field] = false;
        }
      }

      // 5. TC_Publisher et TC_Inventory depuis les partenaires
      const publishersOptions = getPublishersForSelect();
      if (!isPublishersLoading && publishersOptions.length > 0) {
        newVisibleFields.TC_Publisher = true;
        newVisibleFields.TC_Inventory = true;

        // Convertir les options partenaires au format ListItem
        const publishersAsListItems = publishersOptions.map(p => ({
          id: p.id,
          SH_Code: p.id,
          SH_Display_Name_FR: p.label,
        } as ListItem));

        newDynamicLists.TC_Publisher = publishersAsListItems;
        newDynamicLists.TC_Inventory = publishersAsListItems; // Même liste pour l'inventaire
      }

      setDynamicLists(newDynamicLists);
      setVisibleFields(newVisibleFields);

      // 6. Charger les buckets de campagne
      try {
        const campaignBuckets = await getCampaignBuckets(
          selectedClient.clientId,
          selectedCampaign.id,
          selectedVersion.id
        );
        setBuckets(campaignBuckets);
        console.log(`✅ Buckets: ${campaignBuckets.length} éléments chargés`);
      } catch (bucketError) {
        console.warn('Erreur lors du chargement des buckets:', bucketError);
        setBuckets([]);
      }

      console.log('✅ Toutes les listes dynamiques chargées avec succès');

    } catch (error) {
      console.error('❌ Erreur lors du chargement des listes dynamiques:', error);
    } finally {
      setListsLoading(false);
    }
  }, [selectedClient?.clientId, selectedCampaign?.id, selectedVersion?.id, isPublishersLoading, getPublishersForSelect]);

  // ==================== EFFECTS CORRIGÉS ====================

  // 🔥 CORRECTION: Effect principal pour charger les listes dynamiques
  useEffect(() => {
    loadAllDynamicData();
  }, [selectedClient?.clientId, selectedCampaign?.id, selectedVersion?.id, isPublishersLoading]);

  // 🔥 CORRECTION: Effect séparé pour reset les données quand le contexte change
  useEffect(() => {
    // Reset immédiat des données
    setDynamicLists({});
    setBuckets([]);
    setCustomDimensions({});
    setVisibleFields({});
  }, [selectedClient?.clientId, selectedCampaign?.id, selectedVersion?.id]);

  // ==================== ENRICHISSEMENT DES COLONNES ====================

  const enrichedColumns = useCallback((level: TableLevel, tactiqueSubCategory?: TactiqueSubCategory) => {
    const baseColumns = getColumnsForLevel(level, tactiqueSubCategory);
    
    return baseColumns.map(column => {
      const enrichedColumn = { ...column };

      // Enrichir avec les options des listes dynamiques
      if (column.type === 'select') {
        switch (column.key) {
          case 'TC_Bucket':
            enrichedColumn.options = buckets.map(bucket => ({
              id: bucket.id,
              label: bucket.name
            }));
            break;

          // Listes dynamiques tactiques
          case 'TC_LoB':
          case 'TC_Media_Type':
          case 'TC_Buying_Method':
          case 'TC_Custom_Dim_1':
          case 'TC_Custom_Dim_2':
          case 'TC_Custom_Dim_3':
          case 'TC_Market':
          case 'TC_Language':
          case 'TC_Media_Objective':
          case 'TC_Kpi':
          case 'TC_Unit_Type':
          case 'TC_Publisher':
          case 'TC_Inventory':
            const listData = dynamicLists[column.key] || [];
            enrichedColumn.options = listData.map(item => ({
              id: item.id,
              label: item.SH_Display_Name_FR
            }));
            break;

          // Listes statiques (déjà définies dans la config)
          default:
            // Garder les options existantes pour les listes statiques
            break;
        }
      }

      return enrichedColumn;
    });
  }, [dynamicLists, buckets]);

  // ==================== HOOK DE GESTION DES DONNÉES ====================

  const {
    // Données transformées
    tableRows,
    entityCounts,
    
    // États d'édition
    selectedLevel,
    pendingChanges,
    editingCells,
    expandedSections,
    
    // Actions de modification
    setSelectedLevel,
    updateCell,
    startEdit,
    endEdit,
    
    // Actions d'expansion
    toggleSectionExpansion,
    expandAllSections,
    collapseAllSections,
    
    // Actions de sauvegarde
    saveAllChanges,
    cancelAllChanges,
    
    // États utilitaires
    isSaving,
    hasUnsavedChanges
  } = useAdvancedTableData({
    sections,
    tactiques,
    placements,
    creatifs,
    onUpdateSection,
    onUpdateTactique,
    onUpdatePlacement,
    onUpdateCreatif
  });

  // ==================== NAVIGATION CLAVIER ====================

  const columns = useMemo(() => enrichedColumns(selectedLevel), [enrichedColumns, selectedLevel]);
  const navigate = useTableNavigation(tableRows, columns, editingCells, startEdit);

  // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================

  const handleLevelChange = (level: TableLevel) => {
    setSelectedLevel(level);
  };

  const handleSaveAllChanges = async () => {
    try {
      await saveAllChanges();
      // TODO: Afficher un toast de succès
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // TODO: Afficher un toast d'erreur
    }
  };

  const handleCancelAllChanges = () => {
    if (hasUnsavedChanges && !confirm('Êtes-vous sûr de vouloir annuler toutes les modifications ?')) {
      return;
    }
    cancelAllChanges();
  };

  // ==================== RENDU ====================

  return (
    <div className="space-y-3">
      {/* Barre de sauvegarde - COMPACTE */}
      {hasUnsavedChanges && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              <span className="font-medium text-orange-600">{pendingChanges.size}</span> modification{pendingChanges.size > 1 ? 's' : ''} en attente
            </span>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancelAllChanges}
                disabled={isSaving}
                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              
              <button
                onClick={handleSaveAllChanges}
                disabled={isSaving}
                className="flex items-center px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de chargement des listes */}
      {listsLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Chargement des listes dynamiques...</span>
          </div>
        </div>
      )}

      {/* Structure du tableau principal avec barre d'outils intégrée */}
      <DynamicTableStructure
        tableRows={tableRows}
        selectedLevel={selectedLevel}
        pendingChanges={pendingChanges}
        editingCells={editingCells}
        expandedSections={expandedSections}
        onCellChange={updateCell}
        onStartEdit={startEdit}
        onEndEdit={endEdit}
        onToggleSection={toggleSectionExpansion}
        onLevelChange={handleLevelChange}
        entityCounts={entityCounts}
      />

      {/* Informations de statut - COMPACTE */}
      <div className="flex items-center justify-between text-sm text-gray-500 py-2">
        <div className="flex items-center space-x-4">
          <span>{tableRows.length} ligne{tableRows.length > 1 ? 's' : ''} affichée{tableRows.length > 1 ? 's' : ''}</span>
          
          {/* Actions d'expansion rapide */}
          <div className="flex items-center space-x-2">
            <button
              onClick={expandAllSections}
              className="text-xs text-gray-600 hover:text-gray-800 px-1 py-1 rounded hover:bg-gray-100"
            >
              Tout étendre
            </button>
            <button
              onClick={collapseAllSections}
              className="text-xs text-gray-600 hover:text-gray-800 px-1 py-1 rounded hover:bg-gray-100"
            >
              Tout replier
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {hasUnsavedChanges && (
            <span className="text-orange-600 font-medium">
              {pendingChanges.size} modification{pendingChanges.size > 1 ? 's' : ''} non sauvegardée{pendingChanges.size > 1 ? 's' : ''}
            </span>
          )}
          
          {/* Indicateur des listes chargées */}
          {!listsLoading && Object.keys(dynamicLists).length > 0 && (
            <span className="text-green-600 text-xs">
              ✓ Listes chargées ({Object.keys(dynamicLists).length})
            </span>
          )}
          
          <span>Mode: <strong className="capitalize">{selectedLevel}</strong></span>
        </div>
      </div>

      {/* Debug info (développement seulement) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="bg-gray-50 p-3 rounded text-xs text-gray-600">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <div className="mt-2 space-y-1">
            <p><strong>Selected Level:</strong> {selectedLevel}</p>
            <p><strong>Entity Counts:</strong> {JSON.stringify(entityCounts)}</p>
            <p><strong>Expanded Sections:</strong> {Array.from(expandedSections).join(', ') || 'Aucune'}</p>
            <p><strong>Editing Cells:</strong> {Array.from(editingCells).join(', ') || 'Aucune'}</p>
            <p><strong>Pending Changes:</strong> {pendingChanges.size}</p>
            <p><strong>Lists Loading:</strong> {listsLoading ? 'Oui' : 'Non'}</p>
            <p><strong>Dynamic Lists:</strong> {Object.keys(dynamicLists).join(', ') || 'Aucune'}</p>
            <p><strong>Buckets:</strong> {buckets.length}</p>
            <p><strong>Is Saving:</strong> {isSaving ? 'Oui' : 'Non'}</p>
          </div>
        </details>
      )}
    </div>
  );
}