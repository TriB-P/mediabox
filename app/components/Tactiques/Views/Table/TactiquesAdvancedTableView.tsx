// app/components/Tactiques/Views/Table/TactiquesAdvancedTableView.tsx

/**
 * Ce composant affiche une vue de tableau avancée pour gérer les tactiques,
 * placements et créatifs d'une campagne. Il permet l'édition en ligne des données,
 * la gestion des niveaux d'affichage (section, tactique, placement, créatif)
 * et intègre des listes dynamiques (comme les éditeurs ou les dimensions personnalisées)
 * pour enrichir les options de sélection dans le tableau.
 * 
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Section, Tactique, Placement, Creatif } from '../../../../types/tactiques';
import { useAdvancedTableData } from '../../../../hooks/useAdvancedTableData';
import DynamicTableStructure from './DynamicTableStructure';
import { useTableNavigation } from './EditableTableCell';
import { getColumnsForLevel, TactiqueSubCategory } from './tableColumns.config';
import { useClient } from '../../../../contexts/ClientContext';
import { useCampaignSelection } from '../../../../hooks/useCampaignSelection';
import {
  getDynamicList,
  getClientCustomDimensions,
  getCampaignBuckets,
  hasDynamicList,
  ListItem,
  ClientCustomDimensions,
  CampaignBucket,
} from '../../../../lib/tactiqueListService';

// NOUVEAU : Import des fonctions de cache
import {
  getListForClient,
  getCachedAllShortcodes,
  getCachedOptimizedLists,
  ShortcodeItem
} from '../../../../lib/cacheService';

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

interface TactiquesAdvancedTableViewProps {
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
  onUpdateTactique: (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => Promise<void>;
  onUpdateSection: (sectionId: string, data: Partial<Section>) => Promise<void>;
  onUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  onUpdateCreatif: (sectionId: string, tactiqueId: string, placementId: string, creatifId: string, data: Partial<Creatif>) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

/**
 * NOUVEAU : Fonction utilitaire pour récupérer une liste depuis le cache ou Firebase
 * @param fieldId - L'identifiant du champ (ex: 'TC_Publisher', 'TC_LoB')
 * @param clientId - L'identifiant du client
 * @returns Promise<ListItem[]> - La liste des éléments
 */
const getCachedOrFirebaseList = async (fieldId: string, clientId: string): Promise<ListItem[]> => {
  try {
    console.log(`[CACHE] Tentative de récupération de ${fieldId} pour client ${clientId}`);
    
    // Essayer d'abord le cache
    const cachedList = getListForClient(fieldId, clientId);
    
    if (cachedList && cachedList.length > 0) {
      console.log(`[CACHE] ✅ ${fieldId} trouvé dans le cache (${cachedList.length} éléments)`);
      
      // Convertir ShortcodeItem[] vers ListItem[] (structures identiques)
      return cachedList.map(item => ({
        id: item.id,
        SH_Code: item.SH_Code,
        SH_Display_Name_FR: item.SH_Display_Name_FR,
        SH_Display_Name_EN: item.SH_Display_Name_EN,
        SH_Default_UTM: item.SH_Default_UTM,
        SH_Logo: item.SH_Logo,
        SH_Type: item.SH_Type,
        SH_Tags: item.SH_Tags
      }));
    }
    
    // Fallback sur Firebase si pas de cache
    console.log(`[CACHE] ⚠️ ${fieldId} non trouvé dans le cache, fallback Firebase`);
    console.log(`FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: getCachedOrFirebaseList - Path: dynamic_lists/${fieldId}`);
    return await getDynamicList(fieldId, clientId);
    
  } catch (error) {
    console.error(`[CACHE] Erreur récupération ${fieldId}:`, error);
    
    // En cas d'erreur, fallback sur Firebase
    console.log(`FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: getCachedOrFirebaseList - Path: dynamic_lists/${fieldId} (FALLBACK)`);
    return await getDynamicList(fieldId, clientId);
  }
};

/**
 * NOUVEAU : Fonction utilitaire pour vérifier l'existence d'une liste depuis le cache ou Firebase
 * @param fieldId - L'identifiant du champ
 * @param clientId - L'identifiant du client
 * @returns Promise<boolean> - true si la liste existe
 */
const hasCachedOrFirebaseList = async (fieldId: string, clientId: string): Promise<boolean> => {
  try {
    // Essayer d'abord le cache
    const cachedList = getListForClient(fieldId, clientId);
    
    if (cachedList !== null) {
      const hasItems = cachedList.length > 0;
      console.log(`[CACHE] ${fieldId} existe dans le cache: ${hasItems}`);
      return hasItems;
    }
    
    // Fallback sur Firebase
    console.log(`[CACHE] Vérification ${fieldId} via Firebase (fallback)`);
    console.log(`FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: hasCachedOrFirebaseList - Path: dynamic_lists/${fieldId}`);
    return await hasDynamicList(fieldId, clientId);
    
  } catch (error) {
    console.error(`[CACHE] Erreur vérification ${fieldId}:`, error);
    
    // En cas d'erreur, fallback sur Firebase
    console.log(`FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: hasCachedOrFirebaseList - Path: dynamic_lists/${fieldId} (FALLBACK)`);
    return await hasDynamicList(fieldId, clientId);
  }
};

/**
 * Composant principal de la vue de tableau avancée des tactiques.
 * Gère l'affichage, l'édition et la sauvegarde des données de campagne.
 * VERSION 2024 : TC_Publisher traité via le cache localStorage
 *
 * @param {TactiquesAdvancedTableViewProps} props Les propriétés du composant incluant les données et les fonctions de mise à jour.
 * @returns {JSX.Element} Le composant de la vue de tableau avancée.
 */
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

  const { selectedClient } = useClient();
  const { selectedCampaign, selectedVersion } = useCampaignSelection();

  const [dynamicLists, setDynamicLists] = useState<{ [key: string]: ListItem[] }>({});
  const [buckets, setBuckets] = useState<CampaignBucket[]>([]);
  const [customDimensions, setCustomDimensions] = useState<ClientCustomDimensions>({});
  const [visibleFields, setVisibleFields] = useState<VisibleFields>({});
  const [listsLoading, setListsLoading] = useState(false);

  /**
   * Charge toutes les données dynamiques nécessaires pour les listes de sélection
   * du tableau (dimensions personnalisées, listes dynamiques de champs, buckets de campagne).
   * VERSION 2024 : TC_Publisher chargé via le cache comme les autres listes
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois les données chargées.
   */
  const loadAllDynamicData = useCallback(async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) {
      return;
    }

    setListsLoading(true);

    try {
      console.log(`[CACHE] 🚀 Début chargement données avec cache pour TactiquesAdvancedTableView`);
      
      console.log("FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: loadAllDynamicData - Path: clients/${selectedClient.clientId}/customDimensions");
      const clientDimensions = await getClientCustomDimensions(selectedClient.clientId);
      setCustomDimensions(clientDimensions);

      // MODIFIÉ : TC_Publisher ajouté dans la liste des champs dynamiques
      const dynamicListFields = [
        'TC_LoB', 'TC_Media_Type', 'TC_Publisher', 'TC_Buying_Method', 'TC_Custom_Dim_1',
        'TC_Custom_Dim_2', 'TC_Custom_Dim_3', 'TC_Inventory', 'TC_Market', 'TC_Language',
        'TC_Media_Objective', 'TC_Kpi', 'TC_Unit_Type'
      ];

      const newVisibleFields: VisibleFields = {
        TC_Custom_Dim_1: !!clientDimensions.Custom_Dim_CA_1,
        TC_Custom_Dim_2: !!clientDimensions.Custom_Dim_CA_2,
        TC_Custom_Dim_3: !!clientDimensions.Custom_Dim_CA_3,
      };

      const newDynamicLists: { [key: string]: ListItem[] } = {};
      
      // MODIFIÉ : Traiter tous les champs via le cache (incluant TC_Publisher)
      for (const field of dynamicListFields) {
        if (field.startsWith('TC_Custom_Dim_') && !newVisibleFields[field]) {
          continue;
        }
        
        try {
          console.log(`[CACHE] Vérification existence de ${field}`);
          const hasListResult = await hasCachedOrFirebaseList(field, selectedClient.clientId);
          newVisibleFields[field] = hasListResult;
          
          if (hasListResult) {
            console.log(`[CACHE] Chargement de ${field}`);
            const list = await getCachedOrFirebaseList(field, selectedClient.clientId);
            newDynamicLists[field] = list;
          }
        } catch (fieldError) {
          console.warn(`⚠️ Erreur chargement ${field}:`, fieldError);
          newVisibleFields[field] = false;
        }
      }

      setDynamicLists(newDynamicLists);
      setVisibleFields(newVisibleFields);

      try {
        console.log("FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: loadAllDynamicData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/buckets");
        const campaignBuckets = await getCampaignBuckets(
          selectedClient.clientId,
          selectedCampaign.id,
          selectedVersion.id
        );
        setBuckets(campaignBuckets);
      } catch (bucketError) {
        console.warn('Erreur lors du chargement des buckets:', bucketError);
        setBuckets([]);
      }

      console.log(`[CACHE] ✅ Chargement terminé avec cache pour TactiquesAdvancedTableView`);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des listes dynamiques:', error);
    } finally {
      setListsLoading(false);
    }
  }, [selectedClient?.clientId, selectedCampaign?.id, selectedVersion?.id]);

  /**
   * Effet de bord qui déclenche le chargement des données dynamiques
   * chaque fois que le client, la campagne ou la version sélectionnée change.
   */
  useEffect(() => {
    loadAllDynamicData();
  }, [selectedClient?.clientId, selectedCampaign?.id, selectedVersion?.id, loadAllDynamicData]);

  /**
   * Effet de bord qui réinitialise les états des listes dynamiques
   * lorsque le contexte (client, campagne, version) change,
   * assurant que les anciennes données ne persistent pas avant le rechargement.
   */
  useEffect(() => {
    setDynamicLists({});
    setBuckets([]);
    setCustomDimensions({});
    setVisibleFields({});
  }, [selectedClient?.clientId, selectedCampaign?.id, selectedVersion?.id]);

  /**
   * Enrichit les colonnes de tableau de base avec des options de listes dynamiques
   * (buckets, listes dynamiques des champs, partenaires via cache).
   * VERSION 2024 : TC_Publisher traité comme les autres listes dynamiques
   *
   * @param {TableLevel} level Le niveau actuel du tableau (section, tactique, placement, créatif).
   * @param {TactiqueSubCategory} [tactiqueSubCategory] La sous-catégorie de tactique, si applicable.
   * @returns {DynamicColumn[]} Les colonnes enrichies avec les options dynamiques.
   */
  const enrichedColumns = useCallback((level: TableLevel, tactiqueSubCategory?: TactiqueSubCategory) => {
    const baseColumns = getColumnsForLevel(level, tactiqueSubCategory);
    
    return baseColumns.map(column => {
      const enrichedColumn = { ...column };

      if (column.type === 'select') {
        switch (column.key) {
          case 'TC_Bucket':
            enrichedColumn.options = buckets.map(bucket => ({
              id: bucket.id,
              label: bucket.name
            }));
            break;

          // MODIFIÉ : TC_Publisher traité comme les autres listes dynamiques
          case 'TC_LoB':
          case 'TC_Media_Type':
          case 'TC_Publisher':
          case 'TC_Buying_Method':
          case 'TC_Custom_Dim_1':
          case 'TC_Custom_Dim_2':
          case 'TC_Custom_Dim_3':
          case 'TC_Inventory':
          case 'TC_Market':
          case 'TC_Language':
          case 'TC_Media_Objective':
          case 'TC_Kpi':
          case 'TC_Unit_Type':
            const listData = dynamicLists[column.key] || [];
            enrichedColumn.options = listData.map(item => ({
              id: item.id,
              label: item.SH_Display_Name_FR
            }));
            break;

          default:
            break;
        }
      }

      return enrichedColumn;
    });
  }, [dynamicLists, buckets]);

  const {
    tableRows,
    entityCounts,
    selectedLevel,
    pendingChanges,
    editingCells,
    expandedSections,
    setSelectedLevel,
    updateCell,
    startEdit,
    endEdit,
    toggleSectionExpansion,
    expandAllSections,
    collapseAllSections,
    saveAllChanges,
    cancelAllChanges,
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

  const columns = useMemo(() => enrichedColumns(selectedLevel), [enrichedColumns, selectedLevel]);
  const navigate = useTableNavigation(tableRows, columns, editingCells, startEdit);

  /**
   * Gère le changement de niveau d'affichage du tableau.
   *
   * @param {TableLevel} level Le nouveau niveau d'affichage à appliquer.
   */
  const handleLevelChange = (level: TableLevel) => {
    setSelectedLevel(level);
  };

  /**
   * Gère la sauvegarde de toutes les modifications en attente.
   * Affiche un message de succès ou d'erreur selon le résultat.
   *
   * @returns {Promise<void>} Une promesse qui se résout après la tentative de sauvegarde.
   */
  const handleSaveAllChanges = async () => {
    try {
      await saveAllChanges();
      // TODO: Afficher un toast de succès
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // TODO: Afficher un toast d'erreur
    }
  };

  /**
   * Gère l'annulation de toutes les modifications en attente.
   * Demande une confirmation à l'utilisateur si des modifications existent.
   */
  const handleCancelAllChanges = () => {
    if (hasUnsavedChanges && !confirm('Êtes-vous sûr de vouloir annuler toutes les modifications ?')) {
      return;
    }
    cancelAllChanges();
  };

  return (
    <div className="space-y-3">
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

      {listsLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Chargement des listes dynamiques...</span>
          </div>
        </div>
      )}

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

      <div className="flex items-center justify-between text-sm text-gray-500 py-2">
        <div className="flex items-center space-x-4">
          <span>{tableRows.length} ligne{tableRows.length > 1 ? 's' : ''} affichée{tableRows.length > 1 ? 's' : ''}</span>
          
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
          
          {!listsLoading && Object.keys(dynamicLists).length > 0 && (
            <span className="text-green-600 text-xs">
              ✓ Listes chargées ({Object.keys(dynamicLists).length})
            </span>
          )}
          
          <span>Mode: <strong className="capitalize">{selectedLevel}</strong></span>
        </div>
      </div>

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