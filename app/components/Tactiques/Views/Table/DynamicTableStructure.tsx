// app/components/Tactiques/Views/Table/DynamicTableStructure.tsx

/**
 * Version refactorisée utilisant la même logique de calcul que le drawer
 * SUPPRIME TableBudgetCalculations.tsx et utilise budgetService directement
 * MODIFIÉ : Ajout du support multilingue complet
 * 🆕 NOUVEAU : Permet les calculs même sans TC_Unit_Price valide (utilise TC_Unit_Volume = 0)
 * 🔥 NOUVEAU : Ajout du filtrage des colonnes PL_/CR_ sans format 'open' et sans liste
 */
'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { ChevronRightIcon, ChevronDownIcon, QuestionMarkCircleIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { TableRow, DynamicColumn, TableLevel } from './TactiquesAdvancedTableView';
import { getFieldLabel, ClientConfig } from '../../../../config/TaxonomyFieldLabels';
import { useTranslation } from '../../../../contexts/LanguageContext';
import {
  getColumnsWithHierarchy,
  getTactiqueSubCategories,
  getPlacementSubCategories,
  getCreatifSubCategories,
  TactiqueSubCategory,
  PlacementSubCategory,
  CreatifSubCategory
} from './tableColumns.config';
import {
  createBudgetColumnsComplete,
  isFeeCompositeColumn,
  FeeColumnDefinition
} from './budgetColumns.config';
import {
  enrichColumnsWithData,
  processTableRows,
  getHierarchyLabel,
  getRowStyles,
  getTypeStyles,
  getTypeLabel,
  formatDisplayValue
} from './DynamicTableHelpers';
import {
  SelectedCell,
  CopiedData,
  ValidationError,
  validateCellValue,
  generateRectangularSelection,
  applyPastedData,
  canCellReceiveValue,
  formatCopiedValueDisplay,
  getColumnOptions,
  cleanupExpiredErrors,
  createValidationError
} from './CellSelectionHelper';

// NOUVEAU : Import du service budget unifié (remplace TableBudgetCalculations)
import { budgetService, BudgetData, ClientFee as BudgetClientFee } from '../../../../lib/budgetService';

// Composants réactifs simplifiés
import ReactiveBudgetCell from './ReactiveBudgetCell';
import ReactiveFeeComposite, { ReactiveFeeCompositeReadonly } from './ReactiveFeeComposite';

// Imports taxonomie
import { getClientTaxonomies, getTaxonomyById } from '../../../../lib/taxonomyService';
import { useClient } from '../../../../contexts/ClientContext';
import { useCampaignSelection } from '../../../../hooks/useCampaignSelection';
import { 
  getPlacementVariableNames,
  getCreatifVariableNames,
  getVariableConfig,
  formatRequiresShortcode,
  TaxonomyFormat
} from '../../../../config/taxonomyFields';
import { 
  getListForClient,
  getCachedOptimizedLists 
} from '../../../../lib/cacheService';

import { Fee } from '../../../../lib/tactiqueListService';
import { useAsyncTaxonomyUpdate } from '../../../../hooks/useAsyncTaxonomyUpdate';



interface CampaignBucket {
  id: string;
  name: string;
  description?: string;
  target: number;
  color?: string;
}

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
  SH_Display_Name_EN: string;
}

function getLocalizedDisplayName(item: any, currentLanguage: string): string {
  if (currentLanguage === 'en') {
    return item.SH_Display_Name_EN || item.SH_Display_Name_FR || item.SH_Code || item.id;
  } else {
    return item.SH_Display_Name_FR || item.SH_Display_Name_EN || item.SH_Code || item.id;
  }
}

interface DynamicTableStructureProps {
  tableRows: TableRow[];
  selectedLevel: TableLevel;
  pendingChanges: Map<string, Partial<any>>;
  editingCells: Set<string>;
  expandedSections: Set<string>;
  onCellChange: (entityId: string, fieldKey: string, value: any) => void;
  onStartEdit: (cellKey: string) => void;
  onEndEdit: (cellKey: string) => void;
  onToggleSection: (sectionId: string) => void;
  onLevelChange: (level: TableLevel) => void;
  entityCounts: {
    sections: number;
    tactiques: number;
    placements: number;
    creatifs: number;
  };
  buckets: CampaignBucket[];
  dynamicLists: { [key: string]: any[] }; // ← Changer le type pour éviter le conflit
  clientFees: Fee[];
  exchangeRates: { [key: string]: number };
  campaignCurrency: string;
  currentLanguage?: string;
  isLoading: boolean; // ← NOUVEAU : Ajout de la prop isLoading
}

type TableColumn = DynamicColumn | FeeColumnDefinition;

// NOUVEAU : Fonction pour convertir Fee vers BudgetClientFee (compatibilité types)
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

// NOUVEAU : Fonction pour convertir les données de ligne vers BudgetData
// CORRIGÉ : Gestion correcte des valeurs 0 pour éviter que TC_Unit_Volume ne se remette pas à 0
function convertRowDataToBudgetData(rowData: any, unitTypeOptions: Array<{id: string; SH_Display_Name_FR: string}>): BudgetData {
  // Fonction utilitaire pour récupérer une valeur en préservant le 0
  const getValue = (primary: any, fallback: any, defaultValue: any) => {
    if (primary !== undefined && primary !== null) return primary;
    if (fallback !== undefined && fallback !== null) return fallback;
    return defaultValue;
  };

  const getNumericValue = (primary: any, fallback: any, defaultValue: number = 0) => {
    const value = getValue(primary, fallback, defaultValue);
    return typeof value === 'number' ? value : (parseFloat(value) || defaultValue);
  };

  return {
    TC_Budget_Mode: rowData.TC_Budget_Mode || 'media',
    TC_BudgetInput: getNumericValue(rowData.TC_BudgetInput, rowData.TC_Budget, 0),
    TC_Unit_Price: getNumericValue(rowData.TC_Unit_Price, rowData.TC_Cost_Per_Unit, 0), // ✅ Préserve le 0
    TC_Unit_Volume: getNumericValue(rowData.TC_Unit_Volume, null, 0),
    TC_Media_Value: getNumericValue(rowData.TC_Media_Value, rowData.TC_Real_Value, 0),
    TC_Bonification: getNumericValue(rowData.TC_Bonification, rowData.TC_Bonus_Value, 0),
    TC_Media_Budget: getNumericValue(rowData.TC_Media_Budget, null, 0),
    TC_Client_Budget: getNumericValue(rowData.TC_Client_Budget, null, 0),
    TC_Currency_Rate: getNumericValue(rowData.TC_Currency_Rate, null, 1),
    TC_BuyCurrency: rowData.TC_BuyCurrency || rowData.TC_Currency || 'CAD',
    TC_Delta: getNumericValue(rowData.TC_Delta, null, 0),
    TC_Unit_Type: rowData.TC_Unit_Type || '',
    TC_Fee_1_Option: rowData.TC_Fee_1_Option || '',
    TC_Fee_1_Volume: getNumericValue(rowData.TC_Fee_1_Volume, null, 0),
    TC_Fee_1_Value: getNumericValue(rowData.TC_Fee_1_Value, null, 0),
    TC_Fee_2_Option: rowData.TC_Fee_2_Option || '',
    TC_Fee_2_Volume: getNumericValue(rowData.TC_Fee_2_Volume, null, 0),
    TC_Fee_2_Value: getNumericValue(rowData.TC_Fee_2_Value, null, 0),
    TC_Fee_3_Option: rowData.TC_Fee_3_Option || '',
    TC_Fee_3_Volume: getNumericValue(rowData.TC_Fee_3_Volume, null, 0),
    TC_Fee_3_Value: getNumericValue(rowData.TC_Fee_3_Value, null, 0),
    TC_Fee_4_Option: rowData.TC_Fee_4_Option || '',
    TC_Fee_4_Volume: getNumericValue(rowData.TC_Fee_4_Volume, null, 0),
    TC_Fee_4_Value: getNumericValue(rowData.TC_Fee_4_Value, null, 0),
    TC_Fee_5_Option: rowData.TC_Fee_5_Option || '',
    TC_Fee_5_Volume: getNumericValue(rowData.TC_Fee_5_Volume, null, 0),
    TC_Fee_5_Value: getNumericValue(rowData.TC_Fee_5_Value, null, 0),
  };
}

// NOUVEAU : Champs qui déclenchent des recalculs (même logique que le drawer)
const TRIGGER_RECALC_FIELDS = [
  'TC_Budget_Mode', 'TC_BudgetInput', 'TC_Unit_Price', 'TC_Unit_Type', 
  'TC_BuyCurrency', 'TC_Media_Value',
  'TC_Fee_1_Option', 'TC_Fee_1_Volume',
  'TC_Fee_2_Option', 'TC_Fee_2_Volume',
  'TC_Fee_3_Option', 'TC_Fee_3_Volume',
  'TC_Fee_4_Option', 'TC_Fee_4_Volume',
  'TC_Fee_5_Option', 'TC_Fee_5_Volume',
  // 🆕 Ajouter les champs CM360
  'TC_Buy_Type',
  'TC_CM360_Volume_Linked_To_Unit_Volume'
];

// NOUVEAU : Champs calculés automatiquement (readonly)
const CALCULATED_FIELDS = [
  'TC_Unit_Volume', 'TC_Media_Budget', 'TC_Client_Budget', 'TC_Client_Budget_RefCurrency',
  'TC_Bonification', 'TC_Total_Fees',
  'TC_Fee_1_Value', 'TC_Fee_2_Value', 'TC_Fee_3_Value', 'TC_Fee_4_Value', 'TC_Fee_5_Value',
  'TC_CM360_Rate' // 🆕 NOUVEAU
];



function shouldRecalculate(fieldKey: string): boolean {
  return TRIGGER_RECALC_FIELDS.includes(fieldKey);
}

function isCalculatedField(fieldKey: string): boolean {
  return CALCULATED_FIELDS.includes(fieldKey);
}

export default function DynamicTableStructure({
  tableRows,
  selectedLevel,
  pendingChanges,
  editingCells,
  expandedSections,
  onCellChange,
  onStartEdit,
  onEndEdit,
  onToggleSection,
  onLevelChange,
  entityCounts,
  buckets,
  dynamicLists,
  clientFees,
  exchangeRates,
  campaignCurrency,
  isLoading
  
}: DynamicTableStructureProps): React.ReactElement {
  
  const { selectedClient } = useClient();
  const { selectedCampaign } = useCampaignSelection();
  const { updateTaxonomiesAsync } = useAsyncTaxonomyUpdate();
  const { t } = useTranslation();
  const currentLanguage = useTranslation().language || 'fr';


  // États existants (taxonomie, sélection, etc.)
  const [searchTerm, setSearchTerm] = useState('');
  const [hideChildrenLevels, setHideChildrenLevels] = useState(false);
  const [selectedTactiqueSubCategory, setSelectedTactiqueSubCategory] = useState<TactiqueSubCategory>('info');
  const [selectedPlacementSubCategory, setSelectedPlacementSubCategory] = useState<PlacementSubCategory>('info');
  const [selectedCreatifSubCategory, setSelectedCreatifSubCategory] = useState<CreatifSubCategory>('info');
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  // États taxonomie
  const [clientTaxonomies, setClientTaxonomies] = useState<any[]>([]);
  const [taxonomiesLoading, setTaxonomiesLoading] = useState(false);
  const [dynamicTaxonomyColumns, setDynamicTaxonomyColumns] = useState<DynamicColumn[]>([]);
  const [clientConfig, setClientConfig] = useState<ClientConfig>({});

  // États sélection
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [selectionStart, setSelectionStart] = useState<SelectedCell | null>(null);
  const [copiedData, setCopiedData] = useState<CopiedData | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const tableRef = useRef<HTMLTableElement>(null);

  const calculateCM360Values = useCallback((rowData: any): {
  TC_CM360_Rate: number;
  TC_CM360_Volume?: number;
} => {
  const mediaBudget = rowData.TC_Media_Budget || 0;
  const volume = rowData.TC_CM360_Volume || 0;
  const buyType = rowData.TC_Buy_Type;
  const isLinked = rowData.TC_CM360_Volume_Linked_To_Unit_Volume || false;
  const unitVolume = rowData.TC_Unit_Volume || 0;

  let calculatedVolume: number | undefined = undefined;
  
  // Si liaison activée, synchroniser avec TC_Unit_Volume
  if (isLinked && unitVolume !== volume && unitVolume > 0) {
    calculatedVolume = unitVolume;
  }

  // Calculer le taux
  const volumeToUse = calculatedVolume !== undefined ? calculatedVolume : volume;
  let calculatedRate = 0;

  if (volumeToUse > 0) {
    const baseRate = mediaBudget / volumeToUse;
    
    if (buyType === 'CPM') {
      calculatedRate = baseRate * 1000;
    } else {
      calculatedRate = baseRate;
    }
  }

  const result: { TC_CM360_Rate: number; TC_CM360_Volume?: number } = {
    TC_CM360_Rate: calculatedRate
  };

  if (calculatedVolume !== undefined) {
    result.TC_CM360_Volume = calculatedVolume;
  }

  return result;
}, []);


  // NOUVEAU : Convertir clientFees pour le budgetService
  const budgetClientFees = useMemo(() => {
    return clientFees.map(convertToBudgetClientFee);
  }, [clientFees]);

  // Options de type d'unité pour le budgetService
  const unitTypeOptions = useMemo(() => {
    const unitTypeList = dynamicLists.TC_Unit_Type || [];
    return unitTypeList.map(item => ({
      id: item.id,
      SH_Display_Name_FR: getLocalizedDisplayName(item, currentLanguage)
    }));
  }, [dynamicLists.TC_Unit_Type, currentLanguage]);

 
  /**
   * 🆕 NOUVEAU : Logique de calcul modifiée pour permettre TC_Unit_Price = 0
   * Supprime la logique qui court-circuitait les calculs et laisse budgetService tout gérer
   */
const performBudgetCalculation = useCallback((
  entityId: string, 
  currentRowData: any, 
  changedField?: string, 
  changedValue?: any
) => {
  try {
    // Construire les données complètes avec la modification
    const completeRowData = {
      ...currentRowData,
      ...(changedField && changedValue !== undefined ? { [changedField]: changedValue } : {})
    };

    // Convertir vers BudgetData
    const budgetData = convertRowDataToBudgetData(completeRowData, unitTypeOptions);

    // Effectuer le calcul avec budgetService
    const result = budgetService.calculateComplete(
      budgetData,
      budgetClientFees,
      exchangeRates,
      campaignCurrency,
      unitTypeOptions
    );

    if (result.success && result.data) {
      const updatedData = result.data.updatedData;
      
      // Préparer les mises à jour pour les champs calculés
      const calculatedUpdates: { [key: string]: any } = {};
      
      // Champs calculés principaux
      calculatedUpdates.TC_Unit_Volume = updatedData.TC_Unit_Volume;
      calculatedUpdates.TC_Media_Budget = updatedData.TC_Media_Budget;
      calculatedUpdates.TC_Client_Budget = updatedData.TC_Client_Budget;
      calculatedUpdates.TC_Bonification = updatedData.TC_Bonification;
      calculatedUpdates.TC_Currency_Rate = updatedData.TC_Currency_Rate;
      calculatedUpdates.TC_Delta = updatedData.TC_Delta;
      
      // Montants des frais
      calculatedUpdates.TC_Fee_1_Value = updatedData.TC_Fee_1_Value;
      calculatedUpdates.TC_Fee_2_Value = updatedData.TC_Fee_2_Value;
      calculatedUpdates.TC_Fee_3_Value = updatedData.TC_Fee_3_Value;
      calculatedUpdates.TC_Fee_4_Value = updatedData.TC_Fee_4_Value;
      calculatedUpdates.TC_Fee_5_Value = updatedData.TC_Fee_5_Value;

      // RefCurrency calculés
      if (updatedData.TC_Media_Budget_RefCurrency !== undefined) {
        calculatedUpdates.TC_Media_Budget_RefCurrency = updatedData.TC_Media_Budget_RefCurrency;
      }
      if (updatedData.TC_Client_Budget_RefCurrency !== undefined) {
        calculatedUpdates.TC_Client_Budget_RefCurrency = updatedData.TC_Client_Budget_RefCurrency;
      }
      
      const updatedDataAny = updatedData as any;
      for (let i = 1; i <= 5; i++) {
        const refCurrencyKey = `TC_Fee_${i}_RefCurrency`;
        if (updatedDataAny[refCurrencyKey] !== undefined) {
          calculatedUpdates[refCurrencyKey] = updatedDataAny[refCurrencyKey];
        }
      }

      // Total des frais
      const totalFees = updatedData.TC_Fee_1_Value + updatedData.TC_Fee_2_Value + 
                       updatedData.TC_Fee_3_Value + updatedData.TC_Fee_4_Value + 
                       updatedData.TC_Fee_5_Value;
      calculatedUpdates.TC_Total_Fees = totalFees;

      // 🆕 NOUVEAU : Calculer les valeurs CM360
      const cm360Updates = calculateCM360Values({
        ...completeRowData,
        ...calculatedUpdates // Utiliser les valeurs fraîchement calculées
      });

      calculatedUpdates.TC_CM360_Rate = cm360Updates.TC_CM360_Rate;
      
      if (cm360Updates.TC_CM360_Volume !== undefined) {
        calculatedUpdates.TC_CM360_Volume = cm360Updates.TC_CM360_Volume;
      }

      // Appliquer toutes les mises à jour calculées
      Object.entries(calculatedUpdates).forEach(([fieldKey, value]) => {
        onCellChange(entityId, fieldKey, value);
      });

      console.log(`✅ Calcul budget réussi pour ${entityId}:`, {
        mediaBudget: updatedData.TC_Media_Budget,
        clientBudget: updatedData.TC_Client_Budget,
        unitVolume: updatedData.TC_Unit_Volume,
        totalFees,
        cm360Rate: cm360Updates.TC_CM360_Rate,
        cm360Volume: cm360Updates.TC_CM360_Volume,
        hasConverged: result.data.hasConverged
      });

    } else {
      console.error(`❌ Erreur calcul budget pour ${entityId}:`, result.error);
    }

  } catch (error) {
    console.error(`💥 Exception calcul budget pour ${entityId}:`, error);
  }
}, [budgetClientFees, exchangeRates, campaignCurrency, unitTypeOptions, onCellChange, calculateCM360Values]);


  /**
   * Charge les taxonomies du client
   */
  useEffect(() => {
    const loadClientTaxonomies = async () => {
      if (!selectedClient?.clientId) return;
      
      setTaxonomiesLoading(true);
      try {
        const taxonomies = await getClientTaxonomies(selectedClient.clientId);
        setClientTaxonomies(taxonomies);
        
        const { getClientInfo } = await import('../../../../lib/clientService');
        const clientInfo = await getClientInfo(selectedClient.clientId);
        setClientConfig({
          Custom_Dim_PL_1: clientInfo.Custom_Dim_PL_1,
          Custom_Dim_PL_2: clientInfo.Custom_Dim_PL_2,
          Custom_Dim_PL_3: clientInfo.Custom_Dim_PL_3,
          Custom_Dim_CR_1: clientInfo.Custom_Dim_CR_1,
          Custom_Dim_CR_2: clientInfo.Custom_Dim_CR_2,
          Custom_Dim_CR_3: clientInfo.Custom_Dim_CR_3,
        });
      } catch (error) {
        console.error('Erreur chargement taxonomies client:', error);
        setClientTaxonomies([]);
        setClientConfig({});
      } finally {
        setTaxonomiesLoading(false);
      }
    };

    loadClientTaxonomies();
  }, [selectedClient?.clientId]);

  /**
   * 🔥 MODIFIÉ : Génère les colonnes dynamiques pour l'onglet taxonomie avec filtrage
   * Applique la même logique que TaxonomyFieldRenderer pour masquer les champs sans format 'open' et sans liste
   */
  const generateTaxonomyColumns = useCallback(async (): Promise<DynamicColumn[]> => {
    if (!selectedClient?.clientId) return [];
    
    const isPlacementTaxonomy = selectedLevel === 'placement' && selectedPlacementSubCategory === 'taxonomie';
    const isCreatifTaxonomy = selectedLevel === 'creatif' && selectedCreatifSubCategory === 'taxonomie';

    
    
    if (!isPlacementTaxonomy && !isCreatifTaxonomy) return [];

    const targetType = isPlacementTaxonomy ? 'placement' : 'creatif';
    const targetRows = tableRows.filter(row => row.type === targetType);
    
    if (targetRows.length === 0) return [];

    // Collecter toutes les taxonomies utilisées
    const usedTaxonomyIds = new Set<string>();
    const taxonomyFields = isPlacementTaxonomy 
      ? ['PL_Taxonomy_Tags', 'PL_Taxonomy_Platform', 'PL_Taxonomy_MediaOcean']
      : ['CR_Taxonomy_Tags', 'CR_Taxonomy_Platform', 'CR_Taxonomy_MediaOcean'];
    
    targetRows.forEach(row => {
      const data = row.data as any;
      const pendingData = pendingChanges.get(row.id) || {};
      const mergedData = { ...data, ...pendingData };
    
      taxonomyFields
        .map(field => mergedData[field])
        .filter(Boolean)
        .forEach(id => usedTaxonomyIds.add(id));
    });

    if (usedTaxonomyIds.size === 0) {
      // Aucune taxonomie assignée = onglet vide
      return [];
    }

    // Analyser les taxonomies pour extraire les variables manuelles
    const allManualVariables = new Set<string>();
    const taxonomyIdsArray = Array.from(usedTaxonomyIds);
    
    for (const taxonomyId of taxonomyIdsArray) {
      try {
        const taxonomy = await getTaxonomyById(selectedClient.clientId, taxonomyId);
        if (!taxonomy) continue;

        const levelsToAnalyze = isPlacementTaxonomy 
          ? [taxonomy.NA_Name_Level_1, taxonomy.NA_Name_Level_2, taxonomy.NA_Name_Level_3, taxonomy.NA_Name_Level_4]
          : [taxonomy.NA_Name_Level_5, taxonomy.NA_Name_Level_6];

        levelsToAnalyze
          .filter(Boolean)
          .forEach(levelStructure => {
            const variableMatches = levelStructure.match(/\[([^:]+):/g);
            if (variableMatches) {
              variableMatches.forEach(match => {
                const variableName = match.slice(1, -1);
                allManualVariables.add(variableName);
              });
            }
          });
      } catch (error) {
        console.warn(`Erreur chargement taxonomie ${taxonomyId}:`, error);
      }
    }

    // Filtrer pour les variables connues
    const knownVariables = isPlacementTaxonomy 
      ? getPlacementVariableNames()
      : getCreatifVariableNames();
    
    const prefix = isPlacementTaxonomy ? 'PL_' : 'CR_';
    const relevantVariables = Array.from(allManualVariables).filter(varName => {
      return varName.startsWith(prefix) || knownVariables.includes(varName);
    });

    // 🔥 NOUVEAU : Filtrer les variables selon la même logique que TaxonomyFieldRenderer
    const filteredVariables: string[] = [];
    
    for (const variableName of relevantVariables) {
      const config = getVariableConfig(variableName);
      if (!config) continue;

      // Pour les champs TC_ (tactique), garder le comportement actuel
      if (variableName.startsWith('TC_')) {
        filteredVariables.push(variableName);
        continue;
      }
      
      // Pour les champs PL_ et CR_, appliquer la nouvelle logique
      if (variableName.startsWith('PL_') || variableName.startsWith('CR_')) {
        // Vérifier si le champ accepte le format 'open'
        const allowedFormats = config.allowedFormats || [];
        const isOpenFormat = allowedFormats.includes('open');
        
        // Vérifier si une liste est configurée pour ce client
        let hasCustomList = false;
        try {
          const cachedList = getListForClient(variableName, selectedClient.clientId);
          hasCustomList = cachedList !== null && cachedList.length > 0;
        } catch (error) {
          hasCustomList = false;
        }
        
        // Inclure le champ SI : format 'open' OU liste configurée
        if (isOpenFormat || hasCustomList) {
          filteredVariables.push(variableName);
        }
        // Sinon, masquer silencieusement le champ (pas de message informatif dans le tableau)
        continue;
      }
      
      // Pour tous les autres champs, garder le comportement actuel
      filteredVariables.push(variableName);
    }

    // Masquer les dimensions personnalisées non configurées
    const finalVariables = filteredVariables.filter(variableName => {
      const isCustomDim = variableName.match(/^(PL|CR)_Custom_Dim_[123]$/);
      if (isCustomDim) {
        let hasClientConfig = false;
        
        if (variableName === 'PL_Custom_Dim_1' && clientConfig.Custom_Dim_PL_1) hasClientConfig = true;
        if (variableName === 'PL_Custom_Dim_2' && clientConfig.Custom_Dim_PL_2) hasClientConfig = true;
        if (variableName === 'PL_Custom_Dim_3' && clientConfig.Custom_Dim_PL_3) hasClientConfig = true;
        if (variableName === 'CR_Custom_Dim_1' && clientConfig.Custom_Dim_CR_1) hasClientConfig = true;
        if (variableName === 'CR_Custom_Dim_2' && clientConfig.Custom_Dim_CR_2) hasClientConfig = true;
        if (variableName === 'CR_Custom_Dim_3' && clientConfig.Custom_Dim_CR_3) hasClientConfig = true;
        
        return hasClientConfig;
      }
      
      return true;
    });

    console.log(`[TABLEAU TAXONOMIE] ${isPlacementTaxonomy ? 'Placement' : 'Créatif'} → ${finalVariables.length} colonnes générées (filtrées):`, finalVariables);

    // Générer les colonnes
    const columns: DynamicColumn[] = [];
    
    for (const variableName of finalVariables) {
      const config = getVariableConfig(variableName);
      if (!config) continue;

      const hasShortcodeFormat = config.allowedFormats.some(formatRequiresShortcode);
      let options: Array<{ id: string; label: string }> = [];

      if (hasShortcodeFormat && selectedClient?.clientId) {
        try {
          const cachedList = getListForClient(variableName, selectedClient.clientId);
          if (cachedList && cachedList.length > 0) {
            options = cachedList.map(item => ({
              id: item.id,
              label: item.SH_Display_Name_FR || item.SH_Code || item.id
            }));
          }
        } catch (error) {
          console.warn(`Erreur chargement options pour ${variableName}:`, error);
        }
      }

      const column = {
        key: variableName,
        label: getFieldLabel(variableName, t, clientConfig),
        type: options.length > 0 ? 'select' : 'text',
        width: 180,
        options
      } as DynamicColumn;

      columns.push(column);
    }

    return columns.sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedClient?.clientId, selectedLevel, selectedPlacementSubCategory, selectedCreatifSubCategory, tableRows, pendingChanges, clientConfig, t]);

  /**
   * Génère les colonnes dynamiques de taxonomie
   */
  useEffect(() => {
    const generateColumns = async () => {
      if ((selectedLevel === 'placement' && selectedPlacementSubCategory === 'taxonomie') ||
          (selectedLevel === 'creatif' && selectedCreatifSubCategory === 'taxonomie')) {
        const columns = await generateTaxonomyColumns();
        setDynamicTaxonomyColumns(columns);
      }
    };
    
    generateColumns();
  }, [selectedLevel, selectedPlacementSubCategory, selectedCreatifSubCategory, generateTaxonomyColumns, clientConfig]);

  /**
   * Configuration des colonnes avec support budget unifié
   */
  const columns = useMemo(() => {
    let baseColumns: TableColumn[];
    
    if (selectedLevel === 'tactique' && selectedTactiqueSubCategory === 'budget') {
      baseColumns = [
        {
          key: '_hierarchy',
          label: t('table.columns.structure'),
          type: 'readonly' as const,
          width: 300
        },
        ...createBudgetColumnsComplete(budgetClientFees, t).map(col => {
          if (isFeeCompositeColumn(col)) {
            return { ...col, width: 320 };
          }
          return col;
        })
      ];
      
      return baseColumns.map(col => {
        if (isFeeCompositeColumn(col)) {
          return col;
        }
        
        const enrichedCol = enrichColumnsWithData([col as DynamicColumn], buckets, dynamicLists, currentLanguage)[0];
        return {
          ...enrichedCol,
          options: enrichedCol.options || getColumnOptions(enrichedCol.key, buckets, dynamicLists, currentLanguage)
        };
      });
    } else if (selectedLevel === 'placement' && selectedPlacementSubCategory === 'taxonomie') {
      return [
        {
          key: '_hierarchy',
          label: t('table.columns.structure'),
          type: 'readonly' as const,
          width: 300
        },
        ...dynamicTaxonomyColumns
      ];
    } else if (selectedLevel === 'creatif' && selectedCreatifSubCategory === 'taxonomie') {
      return [
        {
          key: '_hierarchy',
          label: t('table.columns.structure'),
          type: 'readonly' as const,
          width: 300
        },
        ...dynamicTaxonomyColumns
      ];
    } else {
      const subCategory = selectedLevel === 'tactique' ? selectedTactiqueSubCategory : 
        selectedLevel === 'placement' ? selectedPlacementSubCategory : 
        selectedLevel === 'creatif' ? selectedCreatifSubCategory :
        undefined;
      
        const hierarchyColumns = getColumnsWithHierarchy(selectedLevel, t, subCategory);
      
        const enrichedColumns = enrichColumnsWithData(hierarchyColumns, buckets, dynamicLists, currentLanguage).map(col => {
          if (['PL_Taxonomy_Tags', 'PL_Taxonomy_Platform', 'PL_Taxonomy_MediaOcean',
          'CR_Taxonomy_Tags', 'CR_Taxonomy_Platform', 'CR_Taxonomy_MediaOcean'].includes(col.key)) {
          return {
            ...col,
            options: clientTaxonomies.map(taxonomy => ({
              id: taxonomy.id,
              label: taxonomy.NA_Display_Name
            }))
          };
        }
        
        return {
          ...col,
          options: col.options || getColumnOptions(col.key, buckets, dynamicLists)
        };
      });
      
      return enrichedColumns;
    }
  }, [
    selectedLevel, 
    selectedTactiqueSubCategory, 
    selectedPlacementSubCategory, 
    selectedCreatifSubCategory,
    buckets, 
    dynamicLists, 
    budgetClientFees,
    clientTaxonomies,
    dynamicTaxonomyColumns,
    currentLanguage, // ← AJOUTER cette dépendance
    t
  ]);

  /**
   * Lignes traitées avec filtrage et tri
   */
const processedRows = useMemo(() => {
  return processTableRows(tableRows, hideChildrenLevels, selectedLevel, searchTerm, null, (row) => getHierarchyLabel(row));
}, [tableRows, hideChildrenLevels, selectedLevel, searchTerm, t]);

  /**
   * MODIFIÉ : Gestion des changements avec calculs budget unifiés
   */
  const handleCellChange = useCallback((entityId: string, fieldKey: string, value: any) => {
    // Appliquer le changement immédiatement
    onCellChange(entityId, fieldKey, value);

    // Si c'est un champ budget sur une tactique, déclencher les calculs
    const row = tableRows.find(r => r.id === entityId);
    if (row?.type === 'tactique' && shouldRecalculate(fieldKey)) {
      // Construire les données complètes
      const currentData = { ...row.data, ...pendingChanges.get(entityId) };
      
      // Déclencher le calcul avec la nouvelle valeur
      setTimeout(() => {
        performBudgetCalculation(entityId, currentData, fieldKey, value);
      }, 0);
    }
  }, [onCellChange, tableRows, pendingChanges, performBudgetCalculation]);

  /**
   * Gestion des événements clavier pour la sélection
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
  
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCells.length > 0) {
        // NOUVEAU : Vérifier si l'utilisateur est en train d'éditer du texte
        const activeElement = document.activeElement;
        const isEditingText = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.tagName === 'SELECT'
        );
        
        // Si on édite du texte et qu'il y a une sélection, laisser le comportement natif
        if (isEditingText) {
          const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;
          
          // Vérifier s'il y a du texte sélectionné dans l'input/textarea
          if (inputElement.selectionStart !== undefined && 
              inputElement.selectionStart !== inputElement.selectionEnd) {
            setCopiedData(null); // Vider la copie de cellule précédente
            return; // Laisser le comportement natif de copie de texte sélectionné
          }
          
          // Vérifier aussi la sélection globale (au cas où)
          const selection = window.getSelection();
          if (selection && selection.toString().length > 0) {
            setCopiedData(null); // Vider la copie de cellule précédente
            return; // Laisser le comportement natif de copie
          }
        }
        
        // Sinon, procéder avec la logique de copie de cellule complète
        e.preventDefault();
        const firstCell = selectedCells[0];
        const row = processedRows[firstCell.rowIndex];
        const column = columns.find(col => col.key === firstCell.columnKey);
        
        if (row && column && !isFeeCompositeColumn(column)) {
          const value = getCellValue(row, firstCell.columnKey);
          setCopiedData({
            value,
            columnType: column.type,
            options: (column as DynamicColumn).options,
            sourceColumnKey: column.key
          });
          
          const displayValue = column.type === 'select' && (column as DynamicColumn).options ? 
            (column as DynamicColumn).options?.find((option: { id: string; label: string }) => option.id === value)?.label || value : value;
          console.log(`✅ ${t('table.actions.copied')}: ${displayValue}`);
        }
      }
  
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedData && selectedCells.length > 0) {
        e.preventDefault();
        handlePaste();
      }
  
      if (e.key === 'Escape') {
        setSelectedCells([]);
        setSelectionStart(null);
      }
    };
  
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };
  
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedCells, copiedData, processedRows, columns, isShiftPressed, t]);

  /**
   * Nettoyage des erreurs expirées
   */
  useEffect(() => {
    const cleanup = setInterval(() => {
      setValidationErrors(prev => cleanupExpiredErrors(prev));
    }, 1000);
    return () => clearInterval(cleanup);
  }, []);

  /**
   * Récupère la valeur d'une cellule
   */
  const getCellValue = useCallback((row: TableRow, columnKey: string): any => {
    const pendingChange = pendingChanges.get(row.id);
    return (pendingChange && pendingChange[columnKey] !== undefined) 
      ? pendingChange[columnKey] 
      : (row.data as any)[columnKey];
  }, [pendingChanges]);

  /**
   * Vérifie si une cellule a une erreur de validation
   */
  const hasValidationError = useCallback((cellKey: string): boolean => {
    return validationErrors.some(error => error.cellKey === cellKey);
  }, [validationErrors]);

  /**
   * Vérifie si une cellule est sélectionnée
   */
  const isCellSelected = useCallback((rowIndex: number, columnKey: string): boolean => {
    return selectedCells.some(cell => cell.rowIndex === rowIndex && cell.columnKey === columnKey);
  }, [selectedCells]);

  /**
   * Gère la sélection de cellules
   */
  const handleCellClick = useCallback((rowIndex: number, columnKey: string, event?: React.MouseEvent) => {
    if (event && ['INPUT', 'SELECT', 'BUTTON'].includes((event.target as HTMLElement).tagName)) {
      return;
    }

    const newCell = { rowIndex, columnKey };

    if (isShiftPressed && selectionStart) {
      const rectangularSelection = generateRectangularSelection(
        selectionStart, 
        newCell, 
        columns as DynamicColumn[],
        processedRows
      );
      setSelectedCells(rectangularSelection);
    } else {
      const row = processedRows[rowIndex];
      if (row?.isEditable && canCellReceiveValue(newCell, processedRows, columns as DynamicColumn[])) {
        setSelectedCells([newCell]);
        setSelectionStart(newCell);
      }
    }
  }, [isShiftPressed, selectionStart, columns, processedRows]);

  /**
   * Gère le collage
   */
  const handlePaste = useCallback(() => {
    if (!copiedData || selectedCells.length === 0) return;

    const dynamicColumns = columns.reduce<DynamicColumn[]>((acc, col) => {
      if (!isFeeCompositeColumn(col)) {
        acc.push(col as DynamicColumn);
      }
      return acc;
    }, []);

    const { applied, errors } = applyPastedData(
      selectedCells,
      copiedData,
      processedRows,
      dynamicColumns,
      (rowId: string, columnKey: string, value: any) => {
        handleCellChange(rowId, columnKey, value);
      },
      (cellKey: string, errorMessage: string) => {
        setValidationErrors(prev => [
          ...prev.filter(err => err.cellKey !== cellKey),
          createValidationError(cellKey, errorMessage)
        ]);
      },
      t
    );

    if (errors > 0) {
      console.log(`${applied} ${t('table.paste.result')} - ${errors} ${t('table.validation.errors')}`);
    }
  }, [copiedData, selectedCells, processedRows, columns, handleCellChange, t]);

  /**
   * Gère le changement de niveau
   */
  const handleLevelChange = useCallback((level: TableLevel) => {
    onLevelChange(level);
    if (level !== 'tactique') {
      setSelectedTactiqueSubCategory('info');
    }
    if (level !== 'placement') {
      setSelectedPlacementSubCategory('info');
    }
    if (level !== 'creatif') {
      setSelectedCreatifSubCategory('info');
    }
    setSelectedCells([]);
    setSelectionStart(null);
  }, [onLevelChange]);



  /**
   * Efface la sélection
   */
  const clearSelection = useCallback(() => {
    setSelectedCells([]);
    setSelectionStart(null);
    setCopiedData(null);
  }, []);

  /**
   * Rend la cellule de hiérarchie
   */
  const renderHierarchyCell = useCallback((row: TableRow) => {
    const label = getHierarchyLabel(row);
    const hasChanges = pendingChanges.has(row.id);

    return (
      <div className="flex items-center space-x-2" style={{ paddingLeft: `${row.level * 20}px` }}>
        {row.type === 'section' && (
          <button
            onClick={() => onToggleSection(row.id)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {expandedSections.has(row.id) ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
        )}

        <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeStyles(row.type)}`}>
          {getTypeLabel(row.type)}
        </span>

        <span className={`font-medium ${hasChanges ? 'text-orange-700' : 'text-gray-900'}`}>
          {label}
          {hasChanges && <span className="ml-1 text-orange-500">●</span>}
        </span>
      </div>
    );
  }, [pendingChanges, onToggleSection, expandedSections, t]);

  /**
   * Gère le double-clic pour démarrer l'édition
   */
  const handleCellDoubleClick = useCallback((rowIndex: number, columnKey: string, event?: React.MouseEvent) => {
    if (event && ['INPUT', 'SELECT', 'BUTTON'].includes((event.target as HTMLElement).tagName)) {
      return;
    }

    const row = processedRows[rowIndex];
    if (row?.isEditable && columnKey !== '_hierarchy') {
      const cellKey = `${row.id}_${columnKey}`;
      onStartEdit(cellKey);
    }
  }, [processedRows, onStartEdit]);

  /**
   * MODIFIÉ : Rend les cellules de données avec logique budget unifiée
   */
  const renderDataCell = useCallback((row: TableRow, column: TableColumn, rowIndex: number) => {
    const cellKey = `${row.id}_${column.key}`;
    const value = getCellValue(row, column.key);
    const isEditing = editingCells.has(cellKey);
    const isSelected = isCellSelected(rowIndex, column.key);
    const hasError = hasValidationError(cellKey);
    const isBudgetMode = selectedLevel === 'tactique' && selectedTactiqueSubCategory === 'budget';

    // Si c'est une colonne budget mais pas une ligne tactique, ne rien afficher
    if (isBudgetMode && row.type !== 'tactique' && (shouldRecalculate(column.key) || isCalculatedField(column.key) || isFeeCompositeColumn(column))) {
      return (
        <div 
          className={`min-h-[32px] flex items-center justify-center text-gray-400 text-sm ${
            isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-gray-100'
          }`}
          onClick={() => handleCellClick(rowIndex, column.key)}
        >
          -
        </div>
      );
    }

    // Mode taxonomie - ne montrer que pour les bonnes lignes
    if (selectedLevel === 'placement' && selectedPlacementSubCategory === 'taxonomie' && row.type !== 'placement') {
      return (
        <div 
          className={`min-h-[32px] flex items-center justify-center text-gray-400 text-sm ${
            isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-gray-100'
          }`}
          onClick={() => handleCellClick(rowIndex, column.key)}
        >
          -
        </div>
      );
    }

    if (selectedLevel === 'creatif' && selectedCreatifSubCategory === 'taxonomie' && row.type !== 'creatif') {
      return (
        <div 
          className={`min-h-[32px] flex items-center justify-center text-gray-400 text-sm ${
            isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-gray-100'
          }`}
          onClick={() => handleCellClick(rowIndex, column.key)}
        >
          -
        </div>
      );
    }

        // Mode specs - ne montrer que pour les lignes tactiques
    if (selectedLevel === 'tactique' && selectedTactiqueSubCategory === 'specs' && row.type !== 'tactique') {
      return (
        <div 
          className={`min-h-[32px] flex items-center justify-center text-gray-400 text-sm ${
            isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'bg-gray-100'
          }`}
          onClick={() => handleCellClick(rowIndex, column.key)}
        >
          -
        </div>
      );
    }

    // Gestion des colonnes de frais composites
    if (isFeeCompositeColumn(column)) {
      const rowDataWithPending = {
        ...row.data,
        ...pendingChanges.get(row.id)
      };

      if (!row.isEditable) {
        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleCellClick(rowIndex, column.key, e);
            }}
          >
            <ReactiveFeeCompositeReadonly
              column={column}
              rowData={rowDataWithPending}
              clientFees={clientFees}
              currency={(row.data as any).TC_BuyCurrency || campaignCurrency}
              isSelected={isSelected}
              onClick={() => {}}
              pendingChanges={pendingChanges.get(row.id) || {}}
            />
          </div>
        );
      }

      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleCellClick(rowIndex, column.key, e);
          }}
        >
          <ReactiveFeeComposite
            entityId={row.id}
            column={column}
            rowData={rowDataWithPending}
            isEditable={row.isEditable}
            clientFees={clientFees}
            currency={(row.data as any).TC_BuyCurrency || campaignCurrency}
            isSelected={isSelected}
            hasValidationError={hasError}
            onChange={handleCellChange}
            onClick={() => {}}
            pendingChanges={pendingChanges.get(row.id) || {}}
          />
        </div>
      );
    }

    // NOUVEAU : Cellules budget avec logique unifiée
    if (isBudgetMode && (shouldRecalculate(column.key) || isCalculatedField(column.key))) {
      const rowDataWithPending = {
        ...row.data,
        ...pendingChanges.get(row.id)
      };
      
      // Déterminer si la cellule est éditable
      const isCellEditable = row.isEditable && !isCalculatedField(column.key) && column.type !== 'readonly';
      
      return (
        <div 
          className={`relative ${isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleCellClick(rowIndex, column.key, e);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (isCellEditable) {
              handleCellDoubleClick(rowIndex, column.key, e);
            }
          }}
        >
          <ReactiveBudgetCell
            entityId={row.id}
            fieldKey={column.key}
            value={value}
            column={column as DynamicColumn}
            rowData={rowDataWithPending}
            isEditable={isCellEditable}
            isEditing={isEditing}
            clientFees={budgetClientFees}
            campaignCurrency={campaignCurrency}
            onChange={handleCellChange}
            onStartEdit={onStartEdit}
            onEndEdit={onEndEdit}
            // NOUVEAU : Pas de callback onCalculatedChange car les calculs sont gérés par handleCellChange
          />
        </div>
      );
    }

    // Cellules readonly normales
    if (column.type === 'readonly' || !row.isEditable) {
      const subCategory = selectedLevel === 'tactique' ? selectedTactiqueSubCategory : 
        selectedLevel === 'placement' ? selectedPlacementSubCategory : 
        selectedLevel === 'creatif' ? selectedCreatifSubCategory :
        undefined;
      
      const formattedValue = isBudgetMode ? 
        value : 
        formatDisplayValue(column.key, value, buckets, dynamicLists, selectedLevel, subCategory, (column as DynamicColumn).options,currentLanguage);
      
      return (
        <div 
          className={`min-h-[32px] flex items-center justify-center px-2 py-1 cursor-pointer ${
            isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'hover:bg-gray-50'
          } ${!row.isEditable || column.type === 'readonly' ? 'text-gray-400' : 'text-gray-900'}`}
          onClick={(e) => {
            e.stopPropagation();
            handleCellClick(rowIndex, column.key, e);
          }}
        >
          <span>{formattedValue || '-'}</span>
        </div>
      );
    }

    // Cellules éditables normales
    return (
      <div
        className={`min-h-[32px] flex items-center relative group cursor-pointer ${
          isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : 'hover:bg-gray-50'
        } ${hasError ? 'ring-2 ring-red-500 ring-inset bg-red-50 animate-pulse' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          handleCellClick(rowIndex, column.key, e);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleCellDoubleClick(rowIndex, column.key, e);
        }}
      >
        {isEditing ? (
          <>
            {column.type === 'select' ? (
              <select
                value={value || ''}
                onChange={(e) => handleCellChange(row.id, column.key, e.target.value)}
                onBlur={() => onEndEdit(cellKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') onEndEdit(cellKey);
                  if (e.key === 'Escape') onEndEdit(cellKey);
                }}
                className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">{t('table.select.placeholder')}</option>
                {(column as DynamicColumn).options?.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={column.type === 'number' || column.type === 'currency' ? 'number' :
                  column.type === 'date' ? 'date' : 'text'}
                value={value || ''}
                onChange={(e) => {
                  const newValue = column.type === 'number' || column.type === 'currency' ? 
                    (parseFloat(e.target.value) || 0) : e.target.value;
                  handleCellChange(row.id, column.key, newValue);
                }}
                onBlur={() => onEndEdit(cellKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') onEndEdit(cellKey);
                  if (e.key === 'Escape') onEndEdit(cellKey);
                }}
                className={`w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  column.type === 'number' || column.type === 'currency' ? 'text-center' : 'text-left'
                }`}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                step="0.01"
                min={column.type === 'number' || column.type === 'currency' ? '0' : undefined}
              />
            )}
          </>
        ) : (
          <div className={`w-full px-2 py-1 text-sm min-h-[20px] flex items-center transition-colors ${
            column.type === 'number' || column.type === 'currency' ? 'justify-center' : 'justify-start'
          }`}>
            {formatDisplayValue(
              column.key, 
              value, 
              buckets, 
              dynamicLists, 
              selectedLevel, 
              selectedLevel === 'tactique' ? selectedTactiqueSubCategory : 
              selectedLevel === 'placement' ? selectedPlacementSubCategory : 
              selectedLevel === 'creatif' ? selectedCreatifSubCategory :
              undefined,
              (column as DynamicColumn).options,
              currentLanguage // ✅ Passer currentLanguage

            ) || (
              <span className="text-gray-400 italic">{t('table.cell.doubleClickToEdit')}</span>
            )}
          </div>
        )}

        {hasError && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}
      </div>
    );
  }, [
    getCellValue, editingCells, isCellSelected, hasValidationError, selectedLevel, selectedTactiqueSubCategory, 
    selectedPlacementSubCategory, selectedCreatifSubCategory, handleCellClick, handleCellDoubleClick, 
    pendingChanges, clientFees, campaignCurrency, budgetClientFees, handleCellChange, onStartEdit, onEndEdit,
    buckets, dynamicLists, t
  ]);

  return (
    <div className="space-y-3">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex space-x-1">
          {(['section', 'tactique', 'placement', 'creatif'] as TableLevel[]).map(level => (
            <button
              key={level}
              onClick={() => handleLevelChange(level)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedLevel === level
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="capitalize">{t(`table.levels.${level}s`)}</span>
              <span className="ml-1.5 text-xs bg-white px-1.5 py-0.5 rounded">
                {entityCounts[level + 's' as keyof typeof entityCounts]}
              </span>
            </button>
          ))}
        </div>

 {/* Sous-onglets pour tactiques - MODIFIÉ : Conditionner sur isLoading */}
        {selectedLevel === 'tactique' && !isLoading && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded">
            {getTactiqueSubCategories(t).map(subCategory => (
              <button
                key={subCategory.id}
                onClick={() => setSelectedTactiqueSubCategory(subCategory.id)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedTactiqueSubCategory === subCategory.id
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
              >
                {subCategory.label}
              </button>
            ))}
          </div>
        )}

        {/* Sous-onglets pour placements - MODIFIÉ : Conditionner sur isLoading */}
        {selectedLevel === 'placement' && !isLoading && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded">
            {getPlacementSubCategories(t).map(subCategory => (
              <button
                key={subCategory.id}
                onClick={() => setSelectedPlacementSubCategory(subCategory.id)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedPlacementSubCategory === subCategory.id
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
                disabled={taxonomiesLoading && subCategory.id === 'taxonomie'}
              >
                {subCategory.label}
                {taxonomiesLoading && subCategory.id === 'taxonomie' && (
                  <span className="ml-1 animate-spin">⏳</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Sous-onglets pour créatifs - MODIFIÉ : Conditionner sur isLoading */}
        {selectedLevel === 'creatif' && !isLoading && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded">
            {getCreatifSubCategories(t).map(subCategory => (
              <button
                key={subCategory.id}
                onClick={() => setSelectedCreatifSubCategory(subCategory.id)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedCreatifSubCategory === subCategory.id
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
                disabled={taxonomiesLoading && subCategory.id === 'taxonomie'}
              >
                {subCategory.label}
                {taxonomiesLoading && subCategory.id === 'taxonomie' && (
                  <span className="ml-1 animate-spin">⏳</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* NOUVEAU : Indicateur de chargement pour les sous-onglets */}
        {isLoading && selectedLevel !== 'section' && (
          <div className="flex items-center justify-center space-x-2 bg-gray-100 p-2 rounded">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          </div>
        )}

        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder={t(`table.search.${selectedLevel}s`)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setHideChildrenLevels(!hideChildrenLevels)}
            className={`p-1.5 rounded transition-colors ${
              hideChildrenLevels
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={t('table.toolbar.hideLevels')}
          >
            <EyeSlashIcon className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              onMouseEnter={() => setShowHelpTooltip(true)}
              onMouseLeave={() => setShowHelpTooltip(false)}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <QuestionMarkCircleIcon className="h-4 w-4" />
            </button>

            {showHelpTooltip && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50">
                <div className="space-y-2">
                  <div><strong>{t('table.help.selection.title')}:</strong> {t('table.help.selection.description')}</div>
                  <div><strong>{t('table.help.editing.title')}:</strong> {t('table.help.editing.description')}</div>
                  <div><strong>{t('table.help.copy.title')}:</strong> {t('table.help.copy.description')}</div>
                  {selectedLevel === 'tactique' && selectedTactiqueSubCategory === 'budget' && (
                    <div><strong>{t('table.help.budget.title')}:</strong> {t('table.help.budget.description')}</div>
                  )}
                  {selectedLevel === 'placement' && selectedPlacementSubCategory === 'taxonomie' && (
                    <div><strong>{t('table.help.columns.title')}:</strong> {t('table.help.columns.description')}</div>
                  )}
                </div>
                <div className="absolute top-0 right-4 transform -translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </div>

          <span className="text-sm text-gray-500 whitespace-nowrap">
            {processedRows.length} {t('table.footer.rows')}
          </span>

         
        </div>
      </div>

      {/* Barre d'action pour sélection et copie */}
      {(selectedCells.length > 0 || copiedData) && (
        <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm">
              {selectedCells.length > 0 && (
                <span className="text-indigo-700 pl-2">
                  {selectedCells.length} {t('table.selection.cellsSelected')}
                </span>
              )}

              {copiedData && (
                <span className="text-black-700 pl-3">
                  📋  <strong>"{formatCopiedValueDisplay(copiedData, t)}"</strong>
                  {copiedData.columnType === 'select' && ' (menu déroulant)'}
                </span>
              )}

              {validationErrors.length > 0 && (
                <span className="text-red-700">
                  ⚠️ {validationErrors.length} {t('table.validation.errors')}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={clearSelection}
                className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div
          className="overflow-auto"
          style={{
            maxHeight: '75vh',
            width: '100%',
            maxWidth: 'calc(100vw - 220px)',
          }}
        >
          <table 
            ref={tableRef}
            className="divide-y divide-gray-200" 
            style={{ width: 'max-content', minWidth: '100%' }}
          >
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {columns.map(column => (
                 <th
                  key={column.key}
                  className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                    column.key === '_hierarchy' ? 'sticky left-0 z-20 bg-gray-50' : ''
                  }`}
                  style={{ 
                    width: column.width || 150, 
                    minWidth: column.width || 150,
                    ...(column.key === '_hierarchy' ? { 
                      position: 'sticky', 
                      left: 0, 
                      zIndex: 20,
                      boxShadow: '8px 0 15px -3px rgba(0, 0, 0, 0.25), 4px 0 6px -1px rgba(0, 0, 0, 0.15)'
                    } : {})
                  }}
                >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {isFeeCompositeColumn(column) && (
                        <span className="text-blue-600 text-xs" title="Frais composite réactif">
                          🔧
                        </span>
                      )}

                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {processedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-6 text-center text-gray-500">
                    {searchTerm ? t('table.noResults') : t('table.noData')}
                  </td>
                </tr>
              ) : (
                processedRows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className={getRowStyles(row, new Set(), pendingChanges)}
                  >
                    {columns.map(column => (
                      <td
                      key={column.key}
                      className={`px-3 py-2 text-sm whitespace-nowrap ${
                        column.key === '_hierarchy' ? 'sticky left-0 z-10 bg-white' : ''
                      }`}
                      style={{ 
                        width: column.width || 150, 
                        minWidth: column.width || 150,
                        ...(column.key === '_hierarchy' ? { 
                          position: 'sticky', 
                          left: 0, 
                          zIndex: 10,
                          boxShadow: '8px 0 15px -3px rgba(0, 0, 0, 0.25), 4px 0 6px -1px rgba(0, 0, 0, 0.15)'
                        } : {})
                      }}
                    >
                      {column.key === '_hierarchy' 
                        ? renderHierarchyCell(row)
                        : renderDataCell(row, column, rowIndex)
                      }
                    </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}