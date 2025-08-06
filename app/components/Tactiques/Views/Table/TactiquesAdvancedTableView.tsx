// app/components/Tactiques/Views/Table/TactiquesAdvancedTableView.tsx

/**
 * Ce composant affiche une vue de tableau avancée pour gérer les tactiques,
 * placements et créatifs d'une campagne. Il permet l'édition en ligne des données,
 * la gestion des niveaux d'affichage (section, tactique, placement, créatif)
 * et intègre des listes dynamiques (comme les éditeurs ou les dimensions personnalisées)
 * pour enrichir les options de sélection dans le tableau.
 * VERSION BUDGET : Ajoute le support pour les calculs budgétaires automatiques
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
  getClientFees,
  getCampaignCurrency,
  getExchangeRates,
  ListItem,
  ClientCustomDimensions,
  CampaignBucket,
  Fee,
  FeeOption,
} from '../../../../lib/tactiqueListService';

import { useAsyncTaxonomyUpdate } from '../../../../hooks/useAsyncTaxonomyUpdate';


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
  TC_LOB?: boolean;
  TC_Media_Type?: boolean;
  TC_Publisher?: boolean;
  TC_Buying_Method?: boolean;
  TC_Custom_Dim_1?: boolean;
  TC_Custom_Dim_2?: boolean;
  TC_Custom_Dim_3?: boolean;
  TC_Inventory?: boolean;
  TC_Market?: boolean;
  TC_Language_Open?: boolean;
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
 */
const getCachedOrFirebaseList = async (fieldId: string, clientId: string): Promise<ListItem[]> => {
  try {
    console.log(`[CACHE] Tentative de récupération de ${fieldId} pour client ${clientId}`);
    
    const cachedList = getListForClient(fieldId, clientId);
    
    if (cachedList && cachedList.length > 0) {
      console.log(`[CACHE] ✅ ${fieldId} trouvé dans le cache (${cachedList.length} éléments)`);
      
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
    
    console.log(`[CACHE] ⚠️ ${fieldId} non trouvé dans le cache, fallback Firebase`);
    console.log(`FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: getCachedOrFirebaseList - Path: dynamic_lists/${fieldId}`);
    return await getDynamicList(fieldId, clientId);
    
  } catch (error) {
    console.error(`[CACHE] Erreur récupération ${fieldId}:`, error);
    console.log(`FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: getCachedOrFirebaseList - Path: dynamic_lists/${fieldId} (FALLBACK)`);
    return await getDynamicList(fieldId, clientId);
  }
};

/**
 * NOUVEAU : Fonction utilitaire pour vérifier l'existence d'une liste depuis le cache ou Firebase
 */
const hasCachedOrFirebaseList = async (fieldId: string, clientId: string): Promise<boolean> => {
  try {
    const cachedList = getListForClient(fieldId, clientId);
    
    if (cachedList !== null) {
      const hasItems = cachedList.length > 0;
      console.log(`[CACHE] ${fieldId} existe dans le cache: ${hasItems}`);
      return hasItems;
    }
    
    console.log(`[CACHE] Vérification ${fieldId} via Firebase (fallback)`);
    console.log(`FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: hasCachedOrFirebaseList - Path: dynamic_lists/${fieldId}`);
    return await hasDynamicList(fieldId, clientId);
    
  } catch (error) {
    console.error(`[CACHE] Erreur vérification ${fieldId}:`, error);
    console.log(`FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: hasCachedOrFirebaseList - Path: dynamic_lists/${fieldId} (FALLBACK)`);
    return await hasDynamicList(fieldId, clientId);
  }
};

/**
 * Composant principal de la vue de tableau avancée des tactiques.
 * VERSION BUDGET : Supporte maintenant les calculs budgétaires automatiques
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
  const { updateTaxonomiesAsync } = useAsyncTaxonomyUpdate();


  // États existants
  const [dynamicLists, setDynamicLists] = useState<{ [key: string]: ListItem[] }>({});
  const [buckets, setBuckets] = useState<CampaignBucket[]>([]);
  const [customDimensions, setCustomDimensions] = useState<ClientCustomDimensions>({});
  const [visibleFields, setVisibleFields] = useState<VisibleFields>({});
  const [listsLoading, setListsLoading] = useState(false);

// NOUVEAU : États pour les données budget
  const [clientFees, setClientFees] = useState<Fee[]>([]);
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  const [campaignCurrency, setCampaignCurrency] = useState<string>('CAD');
  const [budgetDataLoading, setBudgetDataLoading] = useState(false);

  /**
   * MODIFIÉ : Charge toutes les données dynamiques incluant les données budget
   * VERSION BUDGET : Ajoute le chargement des frais client, taux de change et devise de campagne
   */
  const loadAllDynamicData = useCallback(async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) {
      return;
    }

    setListsLoading(true);
    setBudgetDataLoading(true);

    try {
      console.log(`[BUDGET] 🚀 Début chargement données avec budget pour TactiquesAdvancedTableView`);
      
      // Chargement des dimensions client
      console.log("FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: loadAllDynamicData - Path: clients/${selectedClient.clientId}/customDimensions");
      const clientDimensions = await getClientCustomDimensions(selectedClient.clientId);
      setCustomDimensions(clientDimensions);

      // NOUVEAU : Chargement des données budget séparément pour éviter les problèmes de types
      try {
        console.log("FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: loadAllDynamicData - Path: clients/${selectedClient.clientId}/fees");
        const budgetClientFees = await getClientFees(selectedClient.clientId);
        setClientFees(budgetClientFees);
        console.log(`[BUDGET] ✅ Frais client chargés: ${Array.isArray(budgetClientFees) ? budgetClientFees.length : 0} frais`);
      } catch (error) {
        console.warn('Erreur chargement frais client:', error);
        setClientFees([]);
      }

      try {
        console.log("FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: loadAllDynamicData - Path: clients/${selectedClient.clientId}/currencies");
        const budgetExchangeRates = await getExchangeRates(selectedClient.clientId);
        setExchangeRates(budgetExchangeRates);
        console.log(`[BUDGET] ✅ Taux de change chargés: ${Object.keys(budgetExchangeRates).length} taux`);
      } catch (error) {
        console.warn('Erreur chargement taux de change:', error);
        setExchangeRates({});
      }

      try {
        console.log("FIREBASE: LECTURE - Fichier: TactiquesAdvancedTableView.tsx - Fonction: loadAllDynamicData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaign.id}");
        const budgetCampaignCurrency = await getCampaignCurrency(selectedClient.clientId, selectedCampaign.id);
        setCampaignCurrency(budgetCampaignCurrency);
        console.log(`[BUDGET] ✅ Devise campagne chargée: ${budgetCampaignCurrency}`);
      } catch (error) {
        console.warn('Erreur chargement devise campagne:', error);
        setCampaignCurrency('CAD');
      }

      // Chargement des listes dynamiques (logique existante)
      const dynamicListFields = [
        'TC_LOB', 'TC_Media_Type', 'TC_Publisher', 'TC_Buying_Method', 'TC_Custom_Dim_1',
        'TC_Custom_Dim_2', 'TC_Custom_Dim_3', 'TC_Inventory', 'TC_Market', 'TC_Language_Open',
        'TC_Media_Objective', 'TC_Kpi', 'TC_Unit_Type'
      ];

      const newVisibleFields: VisibleFields = {
        TC_Custom_Dim_1: !!clientDimensions.Custom_Dim_CA_1,
        TC_Custom_Dim_2: !!clientDimensions.Custom_Dim_CA_2,
        TC_Custom_Dim_3: !!clientDimensions.Custom_Dim_CA_3,
      };

      const newDynamicLists: { [key: string]: ListItem[] } = {};
      
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

      // Chargement des buckets
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

      console.log(`[BUDGET] ✅ Chargement terminé avec données budget pour TactiquesAdvancedTableView`);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des listes dynamiques et données budget:', error);
    } finally {
      setListsLoading(false);
      setBudgetDataLoading(false);
    }
  }, [selectedClient?.clientId, selectedCampaign?.id, selectedVersion?.id]);

  const handleUpdateTactiqueWithTaxonomy = useCallback(async (
    sectionId: string, 
    tactiqueId: string, 
    data: Partial<Tactique>
  ): Promise<void> => {
    try {
      // 1. Effectuer la mise à jour normale
      await onUpdateTactique(sectionId, tactiqueId, data);

      // 2. Déclencher la mise à jour des taxonomies si client et campagne sont sélectionnés
      if (selectedClient?.clientId && selectedCampaign?.id) {
        await updateTaxonomiesAsync('tactic', {
          id: tactiqueId,
          name: data.TC_Label || `Tactique ${tactiqueId}`,
          clientId: selectedClient.clientId,
          campaignId: selectedCampaign.id
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la tactique avec taxonomies:', error);
      throw error;
    }
  }, [onUpdateTactique, selectedClient?.clientId, selectedCampaign?.id, updateTaxonomiesAsync]);

  /**
   * AJOUT : Wrapper pour onUpdatePlacement avec mise à jour taxonomique
   */
  const handleUpdatePlacementWithTaxonomy = useCallback(async (
    placementId: string, 
    data: Partial<Placement>
  ): Promise<void> => {
    try {
      // 1. Effectuer la mise à jour normale
      await onUpdatePlacement(placementId, data);

      // 2. Déclencher la mise à jour des taxonomies si client et campagne sont sélectionnés
      if (selectedClient?.clientId && selectedCampaign?.id) {
        await updateTaxonomiesAsync('placement', {
          id: placementId,
          name: data.PL_Label || `Placement ${placementId}`,
          clientId: selectedClient.clientId,
          campaignId: selectedCampaign.id
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du placement avec taxonomies:', error);
      throw error;
    }
  }, [onUpdatePlacement, selectedClient?.clientId, selectedCampaign?.id, updateTaxonomiesAsync]);

  /**
   * Effet de bord qui déclenche le chargement des données dynamiques et budget
   */
  useEffect(() => {
    loadAllDynamicData();
  }, [selectedClient?.clientId, selectedCampaign?.id, selectedVersion?.id, loadAllDynamicData]);

  /**
   * Effet de bord qui réinitialise tous les états lors du changement de contexte
   */
  useEffect(() => {
    setDynamicLists({});
    setBuckets([]);
    setCustomDimensions({});
    setVisibleFields({});
    // NOUVEAU : Réinitialiser les données budget
    setClientFees([]);
    setExchangeRates({});
    setCampaignCurrency('CAD');
  }, [selectedClient?.clientId, selectedCampaign?.id, selectedVersion?.id]);

  /**
   * Enrichit les colonnes de tableau avec des options de listes dynamiques
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

          case 'TC_LOB':
          case 'TC_Media_Type':
          case 'TC_Publisher':
          case 'TC_Buying_Method':
          case 'TC_Custom_Dim_1':
          case 'TC_Custom_Dim_2':
          case 'TC_Custom_Dim_3':
          case 'TC_Inventory':
          case 'TC_Market':
          case 'TC_Language_Open':
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
    onUpdateTactique: handleUpdateTactiqueWithTaxonomy, // ✅ Utiliser le wrapper
    onUpdatePlacement: handleUpdatePlacementWithTaxonomy, // ✅ Utiliser le wrapper
    onUpdateCreatif // ✅ Pas de wrapper pour les créatifs (pas d'enfants)
  });

  const columns = useMemo(() => enrichedColumns(selectedLevel), [enrichedColumns, selectedLevel]);
  const navigate = useTableNavigation(tableRows, columns, editingCells, startEdit);

  const handleLevelChange = (level: TableLevel) => {
    setSelectedLevel(level);
  };

  

  const handleSaveAllChanges = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaign?.id) {
      // Fallback vers la sauvegarde normale si pas de contexte
      try {
        await saveAllChanges();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
      }
      return;
    }
  
    try {
      // 1. Identifier les entités modifiées qui nécessitent une mise à jour des taxonomies
      const modifiedTactiques = new Set<string>();
      const modifiedPlacements = new Set<string>();
  
      // ✅ CORRECTION : Utiliser Array.from() pour l'itération
      const pendingEntries = Array.from(pendingChanges.entries());
      for (const [entityId, changes] of pendingEntries) {
        const row = tableRows.find(r => r.id === entityId);
        if (!row) continue;
  
        // Vérifier si des champs qui affectent les taxonomies ont été modifiés
        const taxonomyAffectingFields = [
          'TC_LOB', 'TC_Media_Type', 'TC_Publisher', 'TC_Custom_Dim_1', 'TC_Custom_Dim_2', 'TC_Custom_Dim_3',
          'PL_Product', 'PL_Location', 'PL_Audience_Demographics', 'PL_Device', 'PL_Targeting',
          'PL_Taxonomy_Tags', 'PL_Taxonomy_Platform', 'PL_Taxonomy_MediaOcean',
          'CR_Taxonomy_Tags', 'CR_Taxonomy_Platform', 'CR_Taxonomy_MediaOcean'
        ];
  
        const hasAffectingChanges = Object.keys(changes).some(key => 
          taxonomyAffectingFields.includes(key)
        );
  
        if (hasAffectingChanges) {
          if (row.type === 'tactique') {
            modifiedTactiques.add(entityId);
          } else if (row.type === 'placement') {
            modifiedPlacements.add(entityId);
          }
        }
      }
  
      // 2. Sauvegarder toutes les modifications d'abord
      await saveAllChanges();
  
      // 3. Déclencher les mises à jour de taxonomies seulement si nécessaire
      const taxonomyPromises: Promise<void>[] = [];
  
      // ✅ CORRECTION : Utiliser Array.from() pour l'itération des Sets
      // Mise à jour pour les tactiques modifiées
      const tactiqueIds = Array.from(modifiedTactiques);
      for (const tactiqueId of tactiqueIds) {
        const tactiqueRow = tableRows.find(r => r.id === tactiqueId && r.type === 'tactique');
        if (tactiqueRow) {
          const tactiqueData = tactiqueRow.data as any;
          taxonomyPromises.push(
            updateTaxonomiesAsync('tactic', {
              id: tactiqueId,
              name: tactiqueData.TC_Label || `Tactique ${tactiqueId}`,
              clientId: selectedClient.clientId,
              campaignId: selectedCampaign.id
            })
          );
        }
      }
  
      // Mise à jour pour les placements modifiés
      const placementIds = Array.from(modifiedPlacements);
      for (const placementId of placementIds) {
        const placementRow = tableRows.find(r => r.id === placementId && r.type === 'placement');
        if (placementRow) {
          const placementData = placementRow.data as any;
          taxonomyPromises.push(
            updateTaxonomiesAsync('placement', {
              id: placementId,
              name: placementData.PL_Label || `Placement ${placementId}`,
              clientId: selectedClient.clientId,
              campaignId: selectedCampaign.id
            })
          );
        }
      }
  
      // Attendre toutes les mises à jour de taxonomies
      if (taxonomyPromises.length > 0) {
        console.log(`🔄 Déclenchement des mises à jour taxonomiques pour ${taxonomyPromises.length} entité(s)`);
        await Promise.all(taxonomyPromises);
        console.log(`✅ Mises à jour taxonomiques terminées`);
      }
  
      // TODO: Afficher un toast de succès
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde avec taxonomies:', error);
      // TODO: Afficher un toast d'erreur
    }
  }, [saveAllChanges, pendingChanges, tableRows, selectedClient?.clientId, selectedCampaign?.id, updateTaxonomiesAsync]);

  
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

      {(listsLoading || budgetDataLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">
              Chargement des {listsLoading && budgetDataLoading ? 'listes dynamiques et données budget' : 
                              listsLoading ? 'listes dynamiques' : 'données budget'}...
            </span>
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
        buckets={buckets}
        dynamicLists={dynamicLists}
        // NOUVEAU : Ajout des props budget
        clientFees={clientFees}
        exchangeRates={exchangeRates}
        campaignCurrency={campaignCurrency}
      />


    </div>
  );
}