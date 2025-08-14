// app/components/Tactiques/Views/Table/TactiquesAdvancedTableView.tsx

/**
 * Version refactorisée utilisant la même logique de calcul que le drawer
 * SUPPRIME TableBudgetCalculations.tsx et utilise budgetService directement
 * MODIFIÉ : Ajout du support multilingue
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
import { useTranslation } from '../../../../contexts/LanguageContext';
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

// NOUVEAU : Import du service budget unifié (remplace TableBudgetCalculations)
import { budgetService, BudgetData, ClientFee as BudgetClientFee } from '../../../../lib/budgetService';

// Import des fonctions de cache
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
  TC_Prog_Buying_Method?: boolean;
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
 * Fonction utilitaire pour récupérer une liste depuis le cache ou Firebase
 */
const getCachedOrFirebaseList = async (fieldId: string, clientId: string): Promise<ListItem[]> => {
  try {
    const cachedList = getListForClient(fieldId, clientId);
    
    if (cachedList && cachedList.length > 0) {
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
    
    return await getDynamicList(fieldId, clientId);
    
  } catch (error) {
    console.error(`Erreur récupération ${fieldId}:`, error);
    return await getDynamicList(fieldId, clientId);
  }
};

/**
 * Fonction utilitaire pour vérifier l'existence d'une liste depuis le cache ou Firebase
 */
const hasCachedOrFirebaseList = async (fieldId: string, clientId: string): Promise<boolean> => {
  try {
    const cachedList = getListForClient(fieldId, clientId);
    
    if (cachedList !== null) {
      return cachedList.length > 0;
    }
    
    return await hasDynamicList(fieldId, clientId);
    
  } catch (error) {
    console.error(`Erreur vérification ${fieldId}:`, error);
    return await hasDynamicList(fieldId, clientId);
  }
};

/**
 * NOUVEAU : Fonction pour convertir Fee vers BudgetClientFee (compatibilité types)
 */
function convertToBudgetClientFee(fee: Fee): BudgetClientFee {
  return {
    id: fee.id,
    FE_Name: fee.FE_Name,
    FE_Calculation_Type: fee.FE_Calculation_Type as any,
    FE_Calculation_Mode: fee.FE_Calculation_Mode as any,
    FE_Order: fee.FE_Order,
    options: fee.options.map(option => ({
      id: option.id,
      FO_Option: option.FO_Option,
      FO_Value: option.FO_Value,
      FO_Buffer: option.FO_Buffer,
      FO_Editable: option.FO_Editable
    }))
  };
}

/**
 * Composant principal de la vue de tableau avancée des tactiques.
 * VERSION REFACTORISÉE : Utilise maintenant budgetService au lieu de TableBudgetCalculations
 * MODIFIÉ : Ajout du support multilingue
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
  const { t } = useTranslation();

  // États existants
  const [dynamicLists, setDynamicLists] = useState<{ [key: string]: ListItem[] }>({});
  const [buckets, setBuckets] = useState<CampaignBucket[]>([]);
  const [customDimensions, setCustomDimensions] = useState<ClientCustomDimensions>({});
  const [visibleFields, setVisibleFields] = useState<VisibleFields>({});
  const [listsLoading, setListsLoading] = useState(false);

  // MODIFIÉ : États pour les données budget (simplifiés)
  const [clientFees, setClientFees] = useState<Fee[]>([]);
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  const [campaignCurrency, setCampaignCurrency] = useState<string>('CAD');
  const [budgetDataLoading, setBudgetDataLoading] = useState(false);

  /**
   * MODIFIÉ : Charge toutes les données dynamiques avec logique budget simplifiée
   */
  const loadAllDynamicData = useCallback(async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) {
      return;
    }

    setListsLoading(true);
    setBudgetDataLoading(true);

    try {
      console.log(`🚀 ${t('table.loading.startAdvancedTable')}`);
      
      // Chargement des dimensions client
      const clientDimensions = await getClientCustomDimensions(selectedClient.clientId);
      setCustomDimensions(clientDimensions);

      // MODIFIÉ : Chargement des données budget avec gestion d'erreur simplifiée
      try {
        const budgetClientFees = await getClientFees(selectedClient.clientId);
        setClientFees(budgetClientFees);
        console.log(`✅ ${t('table.loading.clientFeesLoaded', { count: Array.isArray(budgetClientFees) ? budgetClientFees.length : 0 })}`);
      } catch (error) {
        console.warn(t('table.loading.clientFeesError'), error);
        setClientFees([]);
      }

      try {
        const budgetExchangeRates = await getExchangeRates(selectedClient.clientId);
        setExchangeRates(budgetExchangeRates);
        console.log(`✅ ${t('table.loading.exchangeRatesLoaded', { count: Object.keys(budgetExchangeRates).length })}`);
      } catch (error) {
        console.warn(t('table.loading.exchangeRatesError'), error);
        setExchangeRates({});
      }

      try {
        const budgetCampaignCurrency = await getCampaignCurrency(selectedClient.clientId, selectedCampaign.id);
        setCampaignCurrency(budgetCampaignCurrency);
        console.log(`✅ ${t('table.loading.currencyLoaded', { currency: budgetCampaignCurrency })}`);
      } catch (error) {
        console.warn(t('table.loading.currencyError'), error);
        setCampaignCurrency('CAD');
      }

      // Chargement des listes dynamiques (logique existante)
      const dynamicListFields = [
        'TC_LOB', 'TC_Media_Type', 'TC_Publisher', 'TC_Prog_Buying_Method', 'TC_Custom_Dim_1',
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
          const hasListResult = await hasCachedOrFirebaseList(field, selectedClient.clientId);
          newVisibleFields[field] = hasListResult;
          
          if (hasListResult) {
            const list = await getCachedOrFirebaseList(field, selectedClient.clientId);
            newDynamicLists[field] = list;
          }
        } catch (fieldError) {
          console.warn(`⚠️ ${t('table.loading.fieldError', { field })}:`, fieldError);
          newVisibleFields[field] = false;
        }
      }

      setDynamicLists(newDynamicLists);
      setVisibleFields(newVisibleFields);

      // Chargement des buckets
      try {
        const campaignBuckets = await getCampaignBuckets(
          selectedClient.clientId,
          selectedCampaign.id,
          selectedVersion.id
        );
        setBuckets(campaignBuckets);
      } catch (bucketError) {
        console.warn(t('table.loading.bucketsError'), bucketError);
        setBuckets([]);
      }

      console.log(`✅ ${t('table.loading.completedAdvancedTable')}`);

    } catch (error) {
      console.error(`❌ ${t('table.loading.generalError')}:`, error);
    } finally {
      setListsLoading(false);
      setBudgetDataLoading(false);
    }
  }, [selectedClient?.clientId, selectedCampaign?.id, selectedVersion?.id, t]);

  /**
   * NOUVEAU : Wrapper pour onUpdateTactique avec validation budget
   * Utilise budgetService pour valider les données avant la sauvegarde
   */
  const handleUpdateTactiqueWithBudget = useCallback(async (
    sectionId: string, 
    tactiqueId: string, 
    data: Partial<Tactique>
  ): Promise<void> => {
    try {
      // 1. Si ce sont des données budget, les valider avec budgetService
      const isBudgetUpdate = Object.keys(data).some(key => 
        key.startsWith('TC_Budget') || key.startsWith('TC_Unit_') || 
        key.startsWith('TC_Media_') || key.startsWith('TC_Client_') ||
        key.startsWith('TC_Fee_') || key.includes('Currency')
      );

      if (isBudgetUpdate && clientFees.length > 0) {
        console.log(`🧮 ${t('table.budget.validatingTactic', { id: tactiqueId })}:`, data);
        
        // Convertir les frais pour budgetService
        const budgetClientFees = clientFees.map(convertToBudgetClientFee);
        
        // Créer BudgetData à partir des données de la tactique
        const currentTactique = Object.values(tactiques).flat().find(t => t.id === tactiqueId);
        if (currentTactique) {
          const budgetData = budgetService.loadFromFirestore({
            ...currentTactique,
            ...data
          }, budgetClientFees);

          // Valider avec budgetService
          const unitTypeOptions = (dynamicLists.TC_Unit_Type || []).map(item => ({
            id: item.id,
            SH_Display_Name_FR: item.SH_Display_Name_FR
          }));

          const result = budgetService.calculateComplete(
            budgetData,
            budgetClientFees,
            exchangeRates,
            campaignCurrency,
            unitTypeOptions
          );

          if (!result.success) {
            console.warn(`⚠️ ${t('table.budget.validationFailed', { id: tactiqueId })}:`, result.error);
            // On continue quand même la sauvegarde (les erreurs ne sont que des avertissements)
          } else {
            console.log(`✅ ${t('table.budget.validationSuccess', { id: tactiqueId })}`);
          }
        }
      }

      // 2. Effectuer la mise à jour normale
      await onUpdateTactique(sectionId, tactiqueId, data);

      // 3. Déclencher la mise à jour des taxonomies si nécessaire
      if (selectedClient?.clientId && selectedCampaign?.id) {
        await updateTaxonomiesAsync('tactic', {
          id: tactiqueId,
          name: data.TC_Label || `Tactique ${tactiqueId}`,
          clientId: selectedClient.clientId,
          campaignId: selectedCampaign.id
        });
      }
    } catch (error) {
      console.error(`❌ ${t('table.budget.updateError')}:`, error);
      throw error;
    }
  }, [onUpdateTactique, selectedClient?.clientId, selectedCampaign?.id, updateTaxonomiesAsync, 
      clientFees, dynamicLists.TC_Unit_Type, exchangeRates, campaignCurrency, tactiques, t]);

  /**
   * Wrapper pour onUpdatePlacement avec mise à jour taxonomique
   */
  const handleUpdatePlacementWithTaxonomy = useCallback(async (
    placementId: string, 
    data: Partial<Placement>
  ): Promise<void> => {
    try {
      await onUpdatePlacement(placementId, data);

      if (selectedClient?.clientId && selectedCampaign?.id) {
        await updateTaxonomiesAsync('placement', {
          id: placementId,
          name: data.PL_Label || `Placement ${placementId}`,
          clientId: selectedClient.clientId,
          campaignId: selectedCampaign.id
        });
      }
    } catch (error) {
      console.error(`❌ ${t('table.taxonomy.placementUpdateError')}:`, error);
      throw error;
    }
  }, [onUpdatePlacement, selectedClient?.clientId, selectedCampaign?.id, updateTaxonomiesAsync, t]);

  /**
   * Effet de bord qui déclenche le chargement des données
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
    setClientFees([]);
    setExchangeRates({});
    setCampaignCurrency('CAD');
  }, [selectedClient?.clientId, selectedCampaign?.id, selectedVersion?.id]);

  /**
   * MODIFIÉ : useAdvancedTableData avec le nouveau wrapper budget
   */
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
    onUpdateTactique: handleUpdateTactiqueWithBudget, // ✅ Utiliser le wrapper budget
    onUpdatePlacement: handleUpdatePlacementWithTaxonomy,
    onUpdateCreatif
  });

  const handleLevelChange = (level: TableLevel) => {
    setSelectedLevel(level);
  };

  /**
   * MODIFIÉ : Sauvegarde avec validation budget optionnelle
   */
  const handleSaveAllChanges = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaign?.id) {
      try {
        await saveAllChanges();
      } catch (error) {
        console.error(t('table.save.generalError'), error);
      }
      return;
    }
  
    try {
      // 1. Identifier les entités modifiées qui nécessitent une mise à jour des taxonomies
      const modifiedTactiques = new Set<string>();
      const modifiedPlacements = new Set<string>();
  
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
        console.log(`🔄 ${t('table.taxonomy.triggeringUpdates', { count: taxonomyPromises.length })}`);
        await Promise.all(taxonomyPromises);
        console.log(`✅ ${t('table.taxonomy.updatesCompleted')}`);
      }

    } catch (error) {
      console.error(`❌ ${t('table.save.errorWithBudget')}:`, error);
    }
  }, [saveAllChanges, pendingChanges, tableRows, selectedClient?.clientId, selectedCampaign?.id, updateTaxonomiesAsync, t]);

  const handleCancelAllChanges = () => {
    if (hasUnsavedChanges && !confirm(t('table.actions.confirmCancelChanges'))) {
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
              {t('table.changes.pending', { count: pendingChanges.size })}
            </span>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancelAllChanges}
                disabled={isSaving}
                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {t('table.actions.cancel')}
              </button>
              
              <button
                onClick={handleSaveAllChanges}
                disabled={isSaving}
                className="flex items-center px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? t('table.actions.saving') : t('table.actions.save')}
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
              {t('table.loading.loadingData', { 
                type: listsLoading && budgetDataLoading ? 'listsAndBudget' : 
                      listsLoading ? 'lists' : 'budget'
              })}
            </span>
          </div>
        </div>
      )}

      {/* MODIFIÉ : DynamicTableStructure avec nouvelles props budget unifiées */}
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
        clientFees={clientFees}
        exchangeRates={exchangeRates}
        campaignCurrency={campaignCurrency}
      />
    </div>
  );
}