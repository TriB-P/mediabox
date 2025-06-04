// app/components/Tactiques/TactiqueDrawer.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FormDrawer from './FormDrawer';
import FormTabs, { FormTab } from './FormTabs';
import TactiqueFormInfo from './TactiqueFormInfo';
import TactiqueFormStrategie from './TactiqueFormStrategie';
import TactiqueFormKPI from './TactiqueFormKPI';
import TactiqueFormBudget from './TactiqueFormBudget';
import TactiqueFormAdmin from './TactiqueFormAdmin';
import { TooltipBanner } from './TactiqueFormComponents';
import { 
  DocumentTextIcon, 
  LightBulbIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  CogIcon,
  BugAntIcon
} from '@heroicons/react/24/outline';
import { Tactique, TactiqueFormData } from '../../types/tactiques';
import { useClient } from '../../contexts/ClientContext';
import { useCampaignSelection } from '../../hooks/useCampaignSelection';
import {
  getDynamicList,
  getClientCustomDimensions,
  getCampaignBuckets,
  hasDynamicList,
  getCampaignAdminValues,
  getClientFees,
  getCampaignCurrency,
  getExchangeRates,
  ListItem,
  ClientCustomDimensions,
  CampaignBucket,
} from '../../lib/tactiqueListService';
import { usePartners } from '../../contexts/PartnerContext';

// ==================== TYPES ====================

interface TactiqueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tactique?: Tactique | null;
  sectionId: string;
  onSave: (tactiqueData: TactiqueFormData) => Promise<void>;
}

interface KPIData {
  TC_Kpi: string;
  TC_Kpi_CostPer: number;
  TC_Kpi_Volume: number;
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

// NOUVEAU: Interface étendue pour les données du formulaire avec les nouveaux champs budget
interface ExtendedTactiqueFormData extends TactiqueFormData {
  // === NOUVEAUX CHAMPS BUDGET SELON LES SPÉCIFICATIONS ===
  // Champs de base
  TC_BudgetChoice?: 'media' | 'client';  // Mode d'input
  TC_BudgetInput?: number;               // Montant saisi par l'utilisateur
  TC_Unit_Price?: number;                // Coût par unité
  TC_Unit_Volume?: number;               // Nombre d'unités (calculé)
  TC_Media_Value?: number;               // Valeur réelle de la tactique
  TC_Bonification?: number;              // Valeur de bonification (calculée)
  TC_Media_Budget?: number;              // Budget média (calculé ou inputé)
  TC_Client_Budget?: number;             // Budget client (calculé ou inputé)
  TC_Currency_Rate?: number;             // Taux de conversion (défaut: 1)
  TC_BuyCurrency?: string;               // Devise sélectionnée
  TC_Delta?: number;                     // Différence de budget si convergence échoue
  TC_Unit_Type?: string;
  TC_Has_Bonus?: boolean;

  
  // Champs de frais - jusqu'à 5 frais selon FE_Order
  TC_Fee_1_Option?: string;   // ID de l'option sélectionnée
  TC_Fee_1_Volume?: number;   // Valeur saisie par l'utilisateur
  TC_Fee_1_Value?: number;    // Coût total calculé
  TC_Fee_2_Option?: string;
  TC_Fee_2_Volume?: number;
  TC_Fee_2_Value?: number;
  TC_Fee_3_Option?: string;
  TC_Fee_3_Volume?: number;
  TC_Fee_3_Value?: number;
  TC_Fee_4_Option?: string;
  TC_Fee_4_Volume?: number;
  TC_Fee_4_Value?: number;
  TC_Fee_5_Option?: string;
  TC_Fee_5_Volume?: number;
  TC_Fee_5_Value?: number;
}

// ==================== UTILITAIRES POUR LE MAPPING DES CHAMPS ====================

/**
 * Convertit les données de la tactique Firestore vers le formulaire
 */
const mapTactiqueToForm = (tactique: any): ExtendedTactiqueFormData => {
  return {
    // Champs de base existants
    TC_Label: tactique.TC_Label || '',
    TC_Budget: tactique.TC_Budget || 0, // Maintenu pour compatibilité
    TC_Order: tactique.TC_Order || 0,
    TC_SectionId: tactique.TC_SectionId || '',
    TC_Status: tactique.TC_Status || 'Planned',
    TC_StartDate: tactique.TC_StartDate || '',
    TC_EndDate: tactique.TC_EndDate || '',
    TC_Bucket: tactique.TC_Bucket || '',
    
    // Tous les autres champs existants
    TC_LoB: tactique.TC_LoB || '',
    TC_Media_Type: tactique.TC_Media_Type || '',
    TC_Publisher: tactique.TC_Publisher || '',
    TC_Buying_Method: tactique.TC_Buying_Method || '',
    TC_Custom_Dim_1: tactique.TC_Custom_Dim_1 || '',
    TC_Custom_Dim_2: tactique.TC_Custom_Dim_2 || '',
    TC_Custom_Dim_3: tactique.TC_Custom_Dim_3 || '',
    TC_Inventory: tactique.TC_Inventory || '',
    TC_Product_Open: tactique.TC_Product_Open || '',
    TC_Targeting_Open: tactique.TC_Targeting_Open || '',
    TC_Market_Open: tactique.TC_Market_Open || '',
    TC_Frequence: tactique.TC_Frequence || '',
    TC_Location: tactique.TC_Location || '',
    TC_Market: tactique.TC_Market || '',
    TC_Language: tactique.TC_Language || '',
    TC_Format_Open: tactique.TC_Format_Open || '',
    TC_NumberCreatives: tactique.TC_NumberCreatives || '',
    TC_AssetDate: tactique.TC_AssetDate || '',
    TC_Media_Objective: tactique.TC_Media_Objective || '',
    TC_Billing_ID: tactique.TC_Billing_ID || '',
    TC_PO: tactique.TC_PO || '',
    
    // === MAPPING DES NOUVEAUX CHAMPS BUDGET ===
    // Champs directs (nouveaux noms)
    TC_BudgetChoice: tactique.TC_BudgetChoice || tactique.TC_Budget_Mode || 'media',
    TC_BudgetInput: tactique.TC_BudgetInput || tactique.TC_Budget || 0,
    TC_Unit_Price: tactique.TC_Unit_Price || tactique.TC_Cost_Per_Unit || 0,
    TC_Unit_Volume: tactique.TC_Unit_Volume || 0,
    TC_Media_Value: tactique.TC_Media_Value || tactique.TC_Real_Value || 0,
    TC_Bonification: tactique.TC_Bonification || tactique.TC_Bonus_Value || 0,
    TC_Media_Budget: tactique.TC_Media_Budget || 0,
    TC_Client_Budget: tactique.TC_Client_Budget || 0,
    TC_Currency_Rate: tactique.TC_Currency_Rate || 1,
    TC_BuyCurrency: tactique.TC_BuyCurrency || tactique.TC_Currency || 'CAD',
    TC_Delta: tactique.TC_Delta || 0,
    
    // Type d'unité et bonification (pour compatibilité avec l'interface existante)
    TC_Unit_Type: tactique.TC_Unit_Type || '',
    TC_Has_Bonus: (tactique.TC_Media_Value || tactique.TC_Real_Value || 0) > 0,
    
    // === MAPPING DES FRAIS ===
    TC_Fee_1_Option: tactique.TC_Fee_1_Option || '',
    TC_Fee_1_Volume: tactique.TC_Fee_1_Volume || tactique.TC_Fee_1_Input || tactique.TC_Fee_1_Units || 0,
    TC_Fee_1_Value: tactique.TC_Fee_1_Value || 0,
    TC_Fee_2_Option: tactique.TC_Fee_2_Option || '',
    TC_Fee_2_Volume: tactique.TC_Fee_2_Volume || tactique.TC_Fee_2_Input || tactique.TC_Fee_2_Units || 0,
    TC_Fee_2_Value: tactique.TC_Fee_2_Value || 0,
    TC_Fee_3_Option: tactique.TC_Fee_3_Option || '',
    TC_Fee_3_Volume: tactique.TC_Fee_3_Volume || tactique.TC_Fee_3_Input || tactique.TC_Fee_3_Units || 0,
    TC_Fee_3_Value: tactique.TC_Fee_3_Value || 0,
    TC_Fee_4_Option: tactique.TC_Fee_4_Option || '',
    TC_Fee_4_Volume: tactique.TC_Fee_4_Volume || tactique.TC_Fee_4_Input || tactique.TC_Fee_4_Units || 0,
    TC_Fee_4_Value: tactique.TC_Fee_4_Value || 0,
    TC_Fee_5_Option: tactique.TC_Fee_5_Option || '',
    TC_Fee_5_Volume: tactique.TC_Fee_5_Volume || tactique.TC_Fee_5_Input || tactique.TC_Fee_5_Units || 0,
    TC_Fee_5_Value: tactique.TC_Fee_5_Value || 0,
  };
};

/**
 * Convertit les données du formulaire vers le format Firestore
 */
const mapFormToTactique = (formData: ExtendedTactiqueFormData): any => {
  return {
    // Champs de base
    TC_Label: formData.TC_Label,
    TC_Budget: formData.TC_Client_Budget || formData.TC_Budget || 0, // Utiliser le budget client calculé
    TC_Order: formData.TC_Order,
    TC_SectionId: formData.TC_SectionId,
    TC_Status: formData.TC_Status,
    TC_StartDate: formData.TC_StartDate,
    TC_EndDate: formData.TC_EndDate,
    TC_Bucket: formData.TC_Bucket,
    
    // Tous les autres champs existants
    TC_LoB: formData.TC_LoB,
    TC_Media_Type: formData.TC_Media_Type,
    TC_Publisher: formData.TC_Publisher,
    TC_Buying_Method: formData.TC_Buying_Method,
    TC_Custom_Dim_1: formData.TC_Custom_Dim_1,
    TC_Custom_Dim_2: formData.TC_Custom_Dim_2,
    TC_Custom_Dim_3: formData.TC_Custom_Dim_3,
    TC_Inventory: formData.TC_Inventory,
    TC_Product_Open: formData.TC_Product_Open,
    TC_Targeting_Open: formData.TC_Targeting_Open,
    TC_Market_Open: formData.TC_Market_Open,
    TC_Frequence: formData.TC_Frequence,
    TC_Location: formData.TC_Location,
    TC_Market: formData.TC_Market,
    TC_Language: formData.TC_Language,
    TC_Format_Open: formData.TC_Format_Open,
    TC_NumberCreatives: formData.TC_NumberCreatives,
    TC_AssetDate: formData.TC_AssetDate,
    TC_Media_Objective: formData.TC_Media_Objective,
    TC_Billing_ID: formData.TC_Billing_ID,
    TC_PO: formData.TC_PO,
    TC_Unit_Type: formData.TC_Unit_Type,
    
    // === SAUVEGARDE DES NOUVEAUX CHAMPS BUDGET ===
    TC_BudgetChoice: formData.TC_BudgetChoice,
    TC_BudgetInput: formData.TC_BudgetInput,
    TC_Unit_Price: formData.TC_Unit_Price,
    TC_Unit_Volume: formData.TC_Unit_Volume,
    TC_Media_Value: formData.TC_Media_Value,
    TC_Bonification: formData.TC_Bonification,
    TC_Media_Budget: formData.TC_Media_Budget,
    TC_Client_Budget: formData.TC_Client_Budget,
    TC_Currency_Rate: formData.TC_Currency_Rate || 1,
    TC_BuyCurrency: formData.TC_BuyCurrency,
    TC_Delta: formData.TC_Delta,
    
    // === SAUVEGARDE DES FRAIS ===
    TC_Fee_1_Option: formData.TC_Fee_1_Option,
    TC_Fee_1_Volume: formData.TC_Fee_1_Volume,
    TC_Fee_1_Value: formData.TC_Fee_1_Value,
    TC_Fee_2_Option: formData.TC_Fee_2_Option,
    TC_Fee_2_Volume: formData.TC_Fee_2_Volume,
    TC_Fee_2_Value: formData.TC_Fee_2_Value,
    TC_Fee_3_Option: formData.TC_Fee_3_Option,
    TC_Fee_3_Volume: formData.TC_Fee_3_Volume,
    TC_Fee_3_Value: formData.TC_Fee_3_Value,
    TC_Fee_4_Option: formData.TC_Fee_4_Option,
    TC_Fee_4_Volume: formData.TC_Fee_4_Volume,
    TC_Fee_4_Value: formData.TC_Fee_4_Value,
    TC_Fee_5_Option: formData.TC_Fee_5_Option,
    TC_Fee_5_Volume: formData.TC_Fee_5_Volume,
    TC_Fee_5_Value: formData.TC_Fee_5_Value,
    
    // Champs legacy pour compatibilité (mapping inverse)
    TC_Budget_Mode: formData.TC_BudgetChoice,
    TC_Cost_Per_Unit: formData.TC_Unit_Price,
    TC_Real_Value: formData.TC_Media_Value,
    TC_Bonus_Value: formData.TC_Bonification,
    TC_Currency: formData.TC_BuyCurrency,
    TC_Has_Bonus: (formData.TC_Media_Value || 0) > 0,
  };
};

// Valeurs par défaut pour les nouveaux frais
const getDefaultFeeValues = (): Partial<ExtendedTactiqueFormData> => ({
  TC_Fee_1_Option: '',
  TC_Fee_1_Volume: 0,
  TC_Fee_1_Value: 0,
  TC_Fee_2_Option: '',
  TC_Fee_2_Volume: 0,
  TC_Fee_2_Value: 0,
  TC_Fee_3_Option: '',
  TC_Fee_3_Volume: 0,
  TC_Fee_3_Value: 0,
  TC_Fee_4_Option: '',
  TC_Fee_4_Volume: 0,
  TC_Fee_4_Value: 0,
  TC_Fee_5_Option: '',
  TC_Fee_5_Volume: 0,
  TC_Fee_5_Value: 0,
});

// ==================== COMPOSANT PRINCIPAL ====================

export default function TactiqueDrawer({
  isOpen,
  onClose,
  tactique,
  sectionId,
  onSave
}: TactiqueDrawerProps) {
  const { selectedClient } = useClient();
  const { selectedCampaign, selectedVersion } = useCampaignSelection();
  const { getPublishersForSelect, isPublishersLoading } = usePartners();

  // ==================== ÉTATS ====================
  
  // Onglet actif
  const [activeTab, setActiveTab] = useState('info');
  
  // NOUVEAU: État pour le toggle debug
  const [debugMode, setDebugMode] = useState(false);
  
  // Données du formulaire - MODIFIÉ pour utiliser ExtendedTactiqueFormData
  const [formData, setFormData] = useState<ExtendedTactiqueFormData>({
    TC_Label: '',
    TC_Budget: 0,
    TC_Order: 0,
    TC_SectionId: sectionId,
    TC_Status: 'Planned',
    // Valeurs par défaut pour les nouveaux champs Budget
    TC_BudgetChoice: 'media',
    TC_BudgetInput: 0,
    TC_Unit_Price: 0,
    TC_Unit_Volume: 0,
    TC_Media_Value: 0,
    TC_Bonification: 0,
    TC_Media_Budget: 0,
    TC_Client_Budget: 0,
    TC_Currency_Rate: 1,
    TC_BuyCurrency: 'CAD',
    TC_Delta: 0,
    // Champs legacy pour compatibilité
    TC_Unit_Type: '',
    TC_Has_Bonus: false,
    // Valeurs par défaut pour les frais
    ...getDefaultFeeValues(),
  });

  // KPIs multiples
  const [kpis, setKpis] = useState<KPIData[]>([
    { TC_Kpi: '', TC_Kpi_CostPer: 0, TC_Kpi_Volume: 0 }
  ]);

  // Héritage des champs admin
  const [useInheritedBilling, setUseInheritedBilling] = useState(true);
  const [useInheritedPO, setUseInheritedPO] = useState(true);
  const [campaignAdminValues, setCampaignAdminValues] = useState<{ CA_Billing_ID?: string; CA_PO?: string }>({});

  // Listes dynamiques et configuration
  const [dynamicLists, setDynamicLists] = useState<{ [key: string]: ListItem[] }>({});
  const [buckets, setBuckets] = useState<CampaignBucket[]>([]);
  const [customDimensions, setCustomDimensions] = useState<ClientCustomDimensions>({});
  const [visibleFields, setVisibleFields] = useState<VisibleFields>({});
  
  // États de chargement et UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // États locaux pour le budget
  const [clientFees, setClientFees] = useState<any[]>([]);
  const [campaignCurrency, setCampaignCurrency] = useState('CAD');
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  
  // ==================== DONNÉES MEMOIZED ====================
  
  // Onglets de navigation
  const tabs: FormTab[] = useMemo(() => [
    { id: 'info', name: 'Info', icon: DocumentTextIcon },
    { id: 'strategie', name: 'Stratégie', icon: LightBulbIcon },
    { id: 'kpi', name: 'KPI', icon: ChartBarIcon },
    { id: 'budget', name: 'Budget', icon: CurrencyDollarIcon },
    { id: 'admin', name: 'Admin', icon: CogIcon },
  ], []);

  // Champs avec listes dynamiques
  const dynamicListFields = useMemo(() => [
    'TC_LoB', 'TC_Media_Type', 'TC_Buying_Method', 'TC_Custom_Dim_1',
    'TC_Custom_Dim_2', 'TC_Custom_Dim_3', 'TC_Market', 'TC_Language',
    'TC_Media_Objective', 'TC_Kpi', 'TC_Unit_Type'
  ], []);

  // Options pour les partenaires
  const publishersOptions = useMemo(() => 
    getPublishersForSelect(), [getPublishersForSelect]
  );

  // ==================== EFFECTS ====================
  
  // Initialiser le formulaire quand la tactique change - MODIFIÉ pour utiliser le mapping
  useEffect(() => {
    if (tactique) {
      console.log('🔄 Chargement tactique existante:', tactique);
      
      // Utiliser le mapping pour convertir les données Firestore vers le formulaire
      const mappedFormData = mapTactiqueToForm(tactique);
      setFormData(mappedFormData);
      
      console.log('📋 Données mappées pour le formulaire:', mappedFormData);

      // Charger les KPIs existants
      const existingKpis: KPIData[] = [];
      for (let i = 1; i <= 5; i++) {
        const kpi = (tactique as any)[`TC_Kpi${i === 1 ? '' : `_${i}`}`];
        const costPer = (tactique as any)[`TC_Kpi_CostPer${i === 1 ? '' : `_${i}`}`] || 0;
        const volume = (tactique as any)[`TC_Kpi_Volume${i === 1 ? '' : `_${i}`}`] || 0;
        
        if (kpi || costPer || volume) {
          existingKpis.push({ TC_Kpi: kpi || '', TC_Kpi_CostPer: costPer, TC_Kpi_Volume: volume });
        }
      }
      
      if (existingKpis.length > 0) {
        setKpis(existingKpis);
      }

      // Gérer l'héritage des champs admin
      setUseInheritedBilling(!tactique.TC_Billing_ID);
      setUseInheritedPO(!tactique.TC_PO);
      
      setActiveTab('info');
      setIsDirty(false);
    } else {
      // Nouvelle tactique - valeurs par défaut
      console.log('✨ Nouvelle tactique - valeurs par défaut');
      setFormData({
        TC_Label: '',
        TC_Budget: 0,
        TC_Order: 0,
        TC_SectionId: sectionId,
        TC_Status: 'Planned',
        // Valeurs par défaut pour les nouveaux champs Budget
        TC_BudgetChoice: 'media',
        TC_BudgetInput: 0,
        TC_Unit_Price: 0,
        TC_Unit_Volume: 0,
        TC_Media_Value: 0,
        TC_Bonification: 0,
        TC_Media_Budget: 0,
        TC_Client_Budget: 0,
        TC_Currency_Rate: 1,
        TC_BuyCurrency: 'CAD',
        TC_Delta: 0,
        // Champs legacy pour compatibilité
        TC_Unit_Type: '',
        TC_Has_Bonus: false,
        // Valeurs par défaut pour les frais
        ...getDefaultFeeValues(),
      });
      setKpis([{ TC_Kpi: '', TC_Kpi_CostPer: 0, TC_Kpi_Volume: 0 }]);
      setUseInheritedBilling(true);
      setUseInheritedPO(true);
      setActiveTab('info');
      setIsDirty(false);
    }
  }, [tactique, sectionId]);
  
  // Charger les données quand le drawer s'ouvre
  useEffect(() => {
    if (isOpen && selectedClient && selectedCampaign && selectedVersion) {
      loadAllData();
    }
  }, [isOpen, selectedClient, selectedCampaign, selectedVersion]);
  
  // ==================== GESTIONNAIRES ====================
  
  // Charger toutes les données nécessaires
  const loadAllData = useCallback(async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Charger les dimensions personnalisées du client
      const clientDimensions = await getClientCustomDimensions(selectedClient.clientId);
      setCustomDimensions(clientDimensions);

      // Déterminer quels champs personnalisés afficher
      const newVisibleFields: VisibleFields = {
        TC_Custom_Dim_1: !!clientDimensions.Custom_Dim_CA_1,
        TC_Custom_Dim_2: !!clientDimensions.Custom_Dim_CA_2,
        TC_Custom_Dim_3: !!clientDimensions.Custom_Dim_CA_3,
      };

      // Vérifier quelles listes dynamiques existent
      for (const field of dynamicListFields) {
        if (field.startsWith('TC_Custom_Dim_') && !newVisibleFields[field]) {
          continue;
        }
        
        const hasListResult = await hasDynamicList(field, selectedClient.clientId);
        newVisibleFields[field] = hasListResult;
      }

      // TC_Publisher est toujours visible si les partenaires sont disponibles
      newVisibleFields.TC_Publisher = !isPublishersLoading && publishersOptions.length > 0;

      // Charger toutes les listes dynamiques visibles
      const newDynamicLists: { [key: string]: ListItem[] } = {};
      for (const field of dynamicListFields) {
        if (newVisibleFields[field]) {
          const list = await getDynamicList(field, selectedClient.clientId);
          newDynamicLists[field] = list;
        }
      }
      
      setDynamicLists(newDynamicLists);
      setVisibleFields(newVisibleFields);

      // Charger les buckets et valeurs admin
      const [campaignBuckets, adminValues] = await Promise.all([
        getCampaignBuckets(selectedClient.clientId, selectedCampaign.id, selectedVersion.id),
        getCampaignAdminValues(selectedClient.clientId, selectedCampaign.id)
      ]);
      
      setBuckets(campaignBuckets);
      setCampaignAdminValues(adminValues);
      
      // Charger les données pour l'onglet Budget
      try {
        const [fees, currency, rates] = await Promise.all([
          getClientFees(selectedClient.clientId),
          getCampaignCurrency(selectedClient.clientId, selectedCampaign.id),
          getExchangeRates(selectedClient.clientId)
        ]);
        
        setClientFees(fees);
        setCampaignCurrency(currency);
        setExchangeRates(rates);
        
        console.log('💰 Données budget chargées:', { fees: fees.length, currency, ratesCount: Object.keys(rates).length });
      } catch (budgetError) {
        console.warn('Erreur lors du chargement des données budget:', budgetError);
        // Continuer avec des valeurs par défaut
        setClientFees([]);
        setCampaignCurrency('CAD');
        setExchangeRates({});
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedCampaign, selectedVersion, dynamicListFields, isPublishersLoading, publishersOptions.length]);
  
  // CORRECTION: Gérer les changements dans le formulaire avec support des checkboxes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    // Gérer les différents types d'inputs
    if (type === 'checkbox') {
      // Pour les checkboxes, utiliser checked au lieu de value
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      // Pour les nombres, parser la valeur
      processedValue = parseFloat(value) || 0;
    }
    // Pour les autres types (text, select, etc.), garder la valeur string
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    setIsDirty(true);
  }, []);

  // NOUVEAU: Gestionnaire pour les changements calculés depuis le composant Budget
  const handleBudgetCalculatedChange = useCallback((updates: Partial<ExtendedTactiqueFormData>) => {
    console.log('🧮 Mise à jour calculée depuis Budget:', updates);
    
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    
    setIsDirty(true);
  }, []);

  // Gérer les changements de KPI
  const handleKpiChange = useCallback((index: number, field: keyof KPIData, value: string | number) => {
    setKpis(prev => {
      const newKpis = [...prev];
      newKpis[index] = { ...newKpis[index], [field]: value };
      return newKpis;
    });
    setIsDirty(true);
  }, []);

  // Ajouter un KPI
  const addKpi = useCallback(() => {
    setKpis(prev => {
      if (prev.length < 5) {
        return [...prev, { TC_Kpi: '', TC_Kpi_CostPer: 0, TC_Kpi_Volume: 0 }];
      }
      return prev;
    });
    setIsDirty(true);
  }, []);

  // Supprimer un KPI
  const removeKpi = useCallback((index: number) => {
    setKpis(prev => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
    setIsDirty(true);
  }, []);
  
  // Gérer la soumission du formulaire - MODIFIÉ pour utiliser le mapping
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Préparer les données avec les KPIs
      let dataToSave = { ...formData };
      
      // Ajouter les KPIs
      kpis.forEach((kpi, index) => {
        const suffix = index === 0 ? '' : `_${index + 1}`;
        (dataToSave as any)[`TC_Kpi${suffix}`] = kpi.TC_Kpi;
        (dataToSave as any)[`TC_Kpi_CostPer${suffix}`] = kpi.TC_Kpi_CostPer;
        (dataToSave as any)[`TC_Kpi_Volume${suffix}`] = kpi.TC_Kpi_Volume;
      });

      // Gérer les champs admin avec héritage
      if (useInheritedBilling) {
        (dataToSave as any).TC_Billing_ID = campaignAdminValues.CA_Billing_ID || '';
      }
      if (useInheritedPO) {
        (dataToSave as any).TC_PO = campaignAdminValues.CA_PO || '';
      }

      // Utiliser le mapping pour convertir vers le format Firestore
      const mappedData = mapFormToTactique(dataToSave);
      
      if (debugMode) {
        console.log('📤 Données originales du formulaire:', dataToSave);
        console.log('🔄 Données mappées pour Firestore:', mappedData);
      }

      await onSave(mappedData);
      setIsDirty(false);
      onClose();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la tactique:', err);
      setError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [formData, kpis, useInheritedBilling, useInheritedPO, campaignAdminValues, onSave, onClose, debugMode]);

  // Gérer la fermeture avec vérification
  const handleClose = useCallback(() => {
    if (isDirty) {
      const shouldClose = confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?');
      if (!shouldClose) return;
    }
    
    setIsDirty(false);
    onClose();
  }, [isDirty, onClose]);

  // ==================== RENDU DES ONGLETS ====================
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <TactiqueFormInfo
            formData={formData}
            onChange={handleChange}
            onTooltipChange={setActiveTooltip}
            buckets={buckets}
            loading={loading}
          />
        );
      
      case 'strategie':
        return (
          <TactiqueFormStrategie
            formData={formData}
            onChange={handleChange}
            onTooltipChange={setActiveTooltip}
            dynamicLists={dynamicLists}
            visibleFields={visibleFields}
            customDimensions={customDimensions}
            publishersOptions={publishersOptions}
            loading={loading}
            isPublishersLoading={isPublishersLoading}
          />
        );
        
      case 'kpi':
        return (
          <TactiqueFormKPI
            formData={formData}
            kpis={kpis}
            onChange={handleChange}
            onTooltipChange={setActiveTooltip}
            onKpiChange={handleKpiChange}
            onAddKpi={addKpi}
            onRemoveKpi={removeKpi}
            dynamicLists={dynamicLists}
            loading={loading}
          />
        );
        
      case 'budget':
        return (
          <TactiqueFormBudget
            formData={formData}
            dynamicLists={dynamicLists}
            clientFees={clientFees}
            campaignCurrency={campaignCurrency}
            exchangeRates={exchangeRates}
            onChange={handleChange}
            onCalculatedChange={handleBudgetCalculatedChange}
            onTooltipChange={setActiveTooltip}
            loading={loading}
          />
        );
        
      case 'admin':
        return (
          <TactiqueFormAdmin
            formData={formData}
            useInheritedBilling={useInheritedBilling}
            useInheritedPO={useInheritedPO}
            onChange={handleChange}
            onTooltipChange={setActiveTooltip}
            onInheritedBillingChange={setUseInheritedBilling}
            onInheritedPOChange={setUseInheritedPO}
            campaignAdminValues={campaignAdminValues}
            loading={loading}
          />
        );
        
      default:
        return null;
    }
  };
  
  // ==================== RENDU PRINCIPAL ====================
  
  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title={tactique ? `Modifier la tactique: ${tactique.TC_Label}` : 'Nouvelle tactique'}
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Messages d'erreur */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Navigation par onglets */}
        <FormTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {/* Contenu de l'onglet actif */}
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
        
        {/* Footer avec les boutons d'action */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 sm:px-8 border-t border-gray-200">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enregistrement...' : (tactique ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </div>
      </form>
      
      {/* Bandeau de tooltip */}
      <TooltipBanner tooltip={activeTooltip} />
    </FormDrawer>
  );
}