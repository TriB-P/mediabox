// app/components/Tactiques/Tactiques/TactiqueDrawer.tsx

/**
 * Ce fichier définit le composant `TactiqueDrawer` avec intégration du système de cache localStorage.
 * VERSION MODIFIÉE : Correction de la logique des dimensions personnalisées pour les tactiques.
 * Les dimensions TC_Custom_Dim_1/2/3 sont maintenant correctement gérées selon :
 * - Si configurée + liste existe → Select
 * - Si configurée + pas de liste → Input text
 * - Si non configurée → Masqué
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FormDrawer from '../FormDrawer';
import FormTabs, { FormTab } from '../FormTabs';
import TactiqueFormInfo from './TactiqueFormInfo';
import TactiqueFormStrategie from './TactiqueFormStrategie';
import TactiqueFormKPI from './TactiqueFormKPI';
import TactiqueFormBudget from './TactiqueFormBudget';
import TactiqueFormAdmin from './TactiqueFormAdmin';
import TactiqueFormRepartition from './TactiqueFormRepartition';
import { TooltipBanner } from './TactiqueFormComponents';
import {
  DocumentTextIcon,
  LightBulbIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CogIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { Tactique, TactiqueFormData } from '../../../types/tactiques';
import { Breakdown } from '../../../types/breakdown';
import { useClient } from '../../../contexts/ClientContext';
import { useCampaignSelection } from '../../../hooks/useCampaignSelection';
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
} from '../../../lib/tactiqueListService';
import { getBreakdowns } from '../../../lib/breakdownService';
import { useAsyncTaxonomyUpdate } from '../../../hooks/useAsyncTaxonomyUpdate';
import TaxonomyUpdateBanner from '../../Others/TaxonomyUpdateBanner';

// Import des fonctions de cache
import {
  getListForClient,
  getCachedAllShortcodes,
  getCachedOptimizedLists,
  ShortcodeItem
} from '../../../lib/cacheService';

interface TactiqueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tactique?: Tactique | null;
  sectionId: string;
  mode: 'create' | 'edit';  // 👈 AJOUT
  onSave: (tactiqueData: TactiqueFormData) => Promise<void>;
}

interface KPIData {
  TC_Kpi: string;
  TC_Kpi_CostPer: number;
  TC_Kpi_Volume: number;
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

// NOUVEAU : Interface pour distinguer les dimensions configurées de celles ayant des listes
interface CustomDimensionsState {
  configured: {
    TC_Custom_Dim_1?: string;
    TC_Custom_Dim_2?: string;
    TC_Custom_Dim_3?: string;
  };
  hasLists: {
    TC_Custom_Dim_1: boolean;
    TC_Custom_Dim_2: boolean;
    TC_Custom_Dim_3: boolean;
  };
}

/**
 * Fonction utilitaire pour récupérer une liste depuis le cache ou Firebase
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
    console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: getCachedOrFirebaseList - Path: dynamic_lists/${fieldId}`);
    return await getDynamicList(fieldId, clientId);
    
  } catch (error) {
    console.error(`[CACHE] Erreur récupération ${fieldId}:`, error);
    
    console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: getCachedOrFirebaseList - Path: dynamic_lists/${fieldId} (FALLBACK)`);
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
      const hasItems = cachedList.length > 0;
      console.log(`[CACHE] ${fieldId} existe dans le cache: ${hasItems}`);
      return hasItems;
    }
    
    console.log(`[CACHE] Vérification ${fieldId} via Firebase (fallback)`);
    console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: hasCachedOrFirebaseList - Path: dynamic_lists/${fieldId}`);
    return await hasDynamicList(fieldId, clientId);
    
  } catch (error) {
    console.error(`[CACHE] Erreur vérification ${fieldId}:`, error);
    
    console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: hasCachedOrFirebaseList - Path: dynamic_lists/${fieldId} (FALLBACK)`);
    return await hasDynamicList(fieldId, clientId);
  }
};

/**
 * Convertit un objet tactique provenant de Firestore en un format adapté au formulaire.
 */
const mapTactiqueToForm = (tactique: any): TactiqueFormData => {
  const baseData = {
    TC_Label: tactique.TC_Label || '',
    TC_MPA: tactique.TC_MPA || '',
    TC_Budget: tactique.TC_Budget || 0,
    TC_Order: tactique.TC_Order || 0,
    TC_SectionId: tactique.TC_SectionId || '',
    TC_Status: tactique.TC_Status || 'Planned',
    TC_Start_Date: tactique.TC_Start_Date || '',
    TC_End_Date: tactique.TC_End_Date || '',
    TC_Bucket: tactique.TC_Bucket || '',
    breakdowns: tactique.TC_Bucket || '',
    TC_LOB: tactique.TC_LOB || '',
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
    TC_Location_Open: tactique.TC_Location_Open || '',
    TC_Market: tactique.TC_Market || '',
    TC_Language_Open: tactique.TC_Language_Open || '',
    TC_Format_Open: tactique.TC_Format_Open || '',
    TC_NumberCreative: tactique.TC_NumberCreative || '',
    TC_AssetDate: tactique.TC_AssetDate || '',
    TC_Media_Objective: tactique.TC_Media_Objective || '',
    TC_Billing_ID: tactique.TC_Billing_ID || '',
    TC_PO: tactique.TC_PO || '',
    TC_Placement: tactique.TC_Placement || '',
    TC_Format: tactique.TC_Format || '',
    ...Object.fromEntries(
      Object.entries(tactique).filter(([key]) =>
        key.startsWith('TC_Budget') ||
        key.startsWith('TC_Unit_') ||
        key.startsWith('TC_Media_') ||
        key.startsWith('TC_Bonification') ||
        key.startsWith('TC_Client_') ||
        key.startsWith('TC_Currency') ||
        key.startsWith('TC_BuyCurrency') ||
        key.startsWith('TC_Delta') ||
        key.startsWith('TC_Fee_') ||
        key.startsWith('TC_Cost_') ||
        key.startsWith('TC_Real_') ||
        key.startsWith('TC_Bonus_') ||
        key.startsWith('TC_Has_')
      )
    )
  };

  if (tactique.breakdowns) {
    baseData.breakdowns = tactique.breakdowns;
  }

  return baseData;
};

/**
 * Convertit les données du formulaire vers un format prêt à être enregistré dans Firestore.
 */
const mapFormToTactique = (formData: TactiqueFormData): any => {
  const formDataAny = formData as any;
  return {
    ...formData,
    TC_Budget: formDataAny.TC_Client_Budget || formData.TC_Budget || 0,
  };
};

/**
 * Retourne un objet TactiqueFormData avec des valeurs par défaut.
 */
const getDefaultFormData = (): TactiqueFormData => ({
  TC_Label: '',
  TC_MPA:'',
  TC_Budget: 0,
  TC_Order: 0,
  TC_SectionId: '',
  TC_Status: 'Planned',
});

/**
 * Composant principal TactiqueDrawer CORRIGÉ pour les dimensions personnalisées.
 */
export default function TactiqueDrawer({
  isOpen,
  onClose,
  tactique,
  sectionId,
  mode, 
  onSave
}: TactiqueDrawerProps) {
  const { selectedClient } = useClient();
  const { selectedCampaign, selectedVersion } = useCampaignSelection();
  const { status, updateTaxonomiesAsync, dismissNotification } = useAsyncTaxonomyUpdate();

  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState<TactiqueFormData>(() => {
    if (tactique) {
      return mapTactiqueToForm(tactique);
    } else {
      return {
        ...getDefaultFormData(),
        TC_SectionId: sectionId,
      };
    }
  });
  const [kpis, setKpis] = useState<KPIData[]>([
    { TC_Kpi: '', TC_Kpi_CostPer: 0, TC_Kpi_Volume: 0 }
  ]);
  const [useInheritedBilling, setUseInheritedBilling] = useState(true);
  const [useInheritedPO, setUseInheritedPO] = useState(true);
  const [campaignAdminValues, setCampaignAdminValues] = useState<{ CA_Billing_ID?: string; CA_PO?: string }>({});
  const [dynamicLists, setDynamicLists] = useState<{ [key: string]: ListItem[] }>({});
  const [buckets, setBuckets] = useState<CampaignBucket[]>([]);
  
  // MODIFIÉ : Séparer les dimensions configurées de celles ayant des listes
  const [customDimensions, setCustomDimensions] = useState<CustomDimensionsState>({
    configured: {},
    hasLists: {
      TC_Custom_Dim_1: false,
      TC_Custom_Dim_2: false,
      TC_Custom_Dim_3: false,
    }
  });
  
  const [visibleFields, setVisibleFields] = useState<VisibleFields>({});
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [clientFees, setClientFees] = useState<any[]>([]);
  const [campaignCurrency, setCampaignCurrency] = useState('CAD');
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});

  const tabs: FormTab[] = useMemo(() => [
    { id: 'info', name: 'Info', icon: DocumentTextIcon },
    { id: 'strategie', name: 'Stratégie', icon: LightBulbIcon },
    { id: 'kpi', name: 'KPI', icon: ChartBarIcon },
    { id: 'budget', name: 'Budget', icon: CurrencyDollarIcon },
    { id: 'repartition', name: 'Répartition', icon: CalendarDaysIcon },
    { id: 'admin', name: 'Admin', icon: CogIcon },
  ], []);

  // MODIFIÉ : Exclure les dimensions personnalisées de cette liste car elles sont traitées séparément
  const dynamicListFields = useMemo(() => [
    'TC_LOB', 'TC_Media_Type', 'TC_Publisher', 'TC_Buying_Method', 
    'TC_Inventory', 'TC_Market', 'TC_Language_Open',
    'TC_Media_Objective', 'TC_Kpi', 'TC_Unit_Type'
  ], []);

  useEffect(() => {
    if (mode === 'edit' && tactique) {
      // ✅ Mode édition - charger les données existantes
      const mappedFormData = mapTactiqueToForm(tactique);
      setFormData(mappedFormData);

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

      setUseInheritedBilling(!tactique.TC_Billing_ID);
      setUseInheritedPO(!tactique.TC_PO);
      setActiveTab('info');
      setIsDirty(false);
    } else if (mode === 'create') {
      // ✅ Mode création - données par défaut
      setFormData({
        ...getDefaultFormData(),
        TC_SectionId: sectionId,
      });
      setKpis([{ TC_Kpi: '', TC_Kpi_CostPer: 0, TC_Kpi_Volume: 0 }]);
      setUseInheritedBilling(true);
      setUseInheritedPO(true);
      setActiveTab('info');
      setIsDirty(false);
    }
  }, [mode, tactique, sectionId]); 

  useEffect(() => {
    if (isOpen && selectedClient && selectedCampaign && selectedVersion) {
      loadAllData();
    }
  }, [isOpen, selectedClient, selectedCampaign, selectedVersion]);

  /**
   * CORRIGÉE : Charge toutes les données avec logique correcte pour les dimensions personnalisées
   */
  const loadAllData = useCallback(async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`[CACHE] 🚀 Début chargement données avec cache pour TactiqueDrawer`);
      
      // 1. CORRIGÉ : Charger les dimensions personnalisées pour les tactiques (TC)
      console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/config/dimensions`);
      const clientDimensions = await getClientCustomDimensions(selectedClient.clientId);
      
      // CORRIGÉ : Utiliser les bonnes dimensions pour les tactiques
      const configuredDimensions = {
        TC_Custom_Dim_1: clientDimensions.Custom_Dim_TC_1,
        TC_Custom_Dim_2: clientDimensions.Custom_Dim_TC_2,
        TC_Custom_Dim_3: clientDimensions.Custom_Dim_TC_3,
      };

      // 2. NOUVEAU : Vérifier l'existence des listes pour les dimensions configurées
      const dimensionsHasLists = {
        TC_Custom_Dim_1: false,
        TC_Custom_Dim_2: false,
        TC_Custom_Dim_3: false,
      };

      const customDimPromises = [];
      
      if (configuredDimensions.TC_Custom_Dim_1) {
        console.log(`[CACHE] Vérification existence TC_Custom_Dim_1`);
        customDimPromises.push(
          hasCachedOrFirebaseList('TC_Custom_Dim_1', selectedClient.clientId)
            .then(hasList => {
              dimensionsHasLists.TC_Custom_Dim_1 = hasList;
            })
        );
      }
      
      if (configuredDimensions.TC_Custom_Dim_2) {
        console.log(`[CACHE] Vérification existence TC_Custom_Dim_2`);
        customDimPromises.push(
          hasCachedOrFirebaseList('TC_Custom_Dim_2', selectedClient.clientId)
            .then(hasList => {
              dimensionsHasLists.TC_Custom_Dim_2 = hasList;
            })
        );
      }
      
      if (configuredDimensions.TC_Custom_Dim_3) {
        console.log(`[CACHE] Vérification existence TC_Custom_Dim_3`);
        customDimPromises.push(
          hasCachedOrFirebaseList('TC_Custom_Dim_3', selectedClient.clientId)
            .then(hasList => {
              dimensionsHasLists.TC_Custom_Dim_3 = hasList;
            })
        );
      }

      await Promise.all(customDimPromises);

      // 3. NOUVEAU : Mettre à jour l'état des dimensions personnalisées
      setCustomDimensions({
        configured: configuredDimensions,
        hasLists: dimensionsHasLists
      });

      // 4. Initialiser visibleFields pour les autres champs
      const newVisibleFields: VisibleFields = {};

      // 5. Vérifier l'existence des autres listes dynamiques
      for (const field of dynamicListFields) {
        console.log(`[CACHE] Vérification existence de ${field}`);
        const hasListResult = await hasCachedOrFirebaseList(field, selectedClient.clientId);
        newVisibleFields[field] = hasListResult;
      }

      setVisibleFields(newVisibleFields);

      // 6. Charger les listes dynamiques (autres que dimensions personnalisées)
      const newDynamicLists: { [key: string]: ListItem[] } = {};
      for (const field of dynamicListFields) {
        if (newVisibleFields[field]) {
          console.log(`[CACHE] Chargement de ${field}`);
          const list = await getCachedOrFirebaseList(field, selectedClient.clientId);
          newDynamicLists[field] = list;
        }
      }

      // 7. NOUVEAU : Charger les listes des dimensions personnalisées qui en ont
      if (dimensionsHasLists.TC_Custom_Dim_1) {
        console.log(`[CACHE] Chargement de TC_Custom_Dim_1`);
        const list = await getCachedOrFirebaseList('TC_Custom_Dim_1', selectedClient.clientId);
        newDynamicLists.TC_Custom_Dim_1 = list;
      }
      
      if (dimensionsHasLists.TC_Custom_Dim_2) {
        console.log(`[CACHE] Chargement de TC_Custom_Dim_2`);
        const list = await getCachedOrFirebaseList('TC_Custom_Dim_2', selectedClient.clientId);
        newDynamicLists.TC_Custom_Dim_2 = list;
      }
      
      if (dimensionsHasLists.TC_Custom_Dim_3) {
        console.log(`[CACHE] Chargement de TC_Custom_Dim_3`);
        const list = await getCachedOrFirebaseList('TC_Custom_Dim_3', selectedClient.clientId);
        newDynamicLists.TC_Custom_Dim_3 = list;
      }

      setDynamicLists(newDynamicLists);

      // 8. Charger les autres données (inchangé)
      console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/buckets`);
      console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaign.id}`);
      const [campaignBuckets, adminValues] = await Promise.all([
        getCampaignBuckets(selectedClient.clientId, selectedCampaign.id, selectedVersion.id),
        getCampaignAdminValues(selectedClient.clientId, selectedCampaign.id)
      ]);

      setBuckets(campaignBuckets);
      setCampaignAdminValues(adminValues);

      try {
        console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaign.id}/breakdowns`);
        const campaignBreakdowns = await getBreakdowns(selectedClient.clientId, selectedCampaign.id);
        setBreakdowns(campaignBreakdowns);
      } catch (breakdownError) {
        console.warn('Erreur lors du chargement des breakdowns:', breakdownError);
        setBreakdowns([]);
      }

      try {
        console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/fees`);
        console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaign.id}`);
        console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/config/exchangeRates`);
        const [fees, currency, rates] = await Promise.all([
          getClientFees(selectedClient.clientId),
          getCampaignCurrency(selectedClient.clientId, selectedCampaign.id),
          getExchangeRates(selectedClient.clientId)
        ]);

        setClientFees(fees);
        setCampaignCurrency(currency);
        setExchangeRates(rates);
      } catch (budgetError) {
        console.warn('Erreur lors du chargement des données budget:', budgetError);
        setClientFees([]);
        setCampaignCurrency('CAD');
        setExchangeRates({});
      }

      console.log(`[CACHE] ✅ Chargement terminé avec cache et dimensions personnalisées corrigées`);

    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedCampaign, selectedVersion, dynamicListFields]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    let processedValue: any = value;

    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    setIsDirty(true);
  }, []);

  const handleBudgetChange = useCallback((budgetData: any) => {
    setFormData(prev => ({
      ...prev,
      ...budgetData
    }));
    setIsDirty(true);
  }, []);

  const handleKpiChange = useCallback((index: number, field: keyof KPIData, value: string | number) => {
    setKpis(prev => {
      const newKpis = [...prev];
      newKpis[index] = { ...newKpis[index], [field]: value };
      return newKpis;
    });
    setIsDirty(true);
  }, []);

  const addKpi = useCallback(() => {
    setKpis(prev => {
      if (prev.length < 5) {
        return [...prev, { TC_Kpi: '', TC_Kpi_CostPer: 0, TC_Kpi_Volume: 0 }];
      }
      return prev;
    });
    setIsDirty(true);
  }, []);

  const removeKpi = useCallback((index: number) => {
    setKpis(prev => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
    setIsDirty(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      let dataToSave = { ...formData };

      // Traitement des KPIs (inchangé)
      kpis.forEach((kpi, index) => {
        const suffix = index === 0 ? '' : `_${index + 1}`;
        (dataToSave as any)[`TC_Kpi${suffix}`] = kpi.TC_Kpi;
        (dataToSave as any)[`TC_Kpi_CostPer${suffix}`] = kpi.TC_Kpi_CostPer;
        (dataToSave as any)[`TC_Kpi_Volume${suffix}`] = kpi.TC_Kpi_Volume;
      });

      // Traitement héritage (inchangé)
      if (useInheritedBilling) {
        (dataToSave as any).TC_Billing_ID = campaignAdminValues.CA_Billing_ID || '';
      }
      if (useInheritedPO) {
        (dataToSave as any).TC_PO = campaignAdminValues.CA_PO || '';
      }

      const mappedData = mapFormToTactique(dataToSave);

      // ✅ CORRECTION : Appeler onSave directement
      // Le parent (TactiquesHierarchyView) gère création vs mise à jour
      await onSave(mappedData);

      setIsDirty(false);
      onClose();

      // Mise à jour taxonomies (inchangé)
      if (mode === 'edit' && tactique && tactique.id && selectedClient && selectedCampaign) {
        updateTaxonomiesAsync('tactic', {
          id: tactique.id,
          name: mappedData.TC_Label,
          clientId: selectedClient.clientId,
          campaignId: selectedCampaign.id
        }).catch(error => {
          console.error('Erreur mise à jour taxonomies tactique:', error);
        });
      }

    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la tactique:', err);
      setError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
      setLoading(false);
    }
  }, [mode, formData, kpis, useInheritedBilling, useInheritedPO, campaignAdminValues, onSave, onClose, tactique, selectedClient, selectedCampaign, updateTaxonomiesAsync]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      const shouldClose = confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?');
      if (!shouldClose) return;
    }

    setIsDirty(false);
    onClose();
  }, [isDirty, onClose]);

  const getDrawerTitle = () => {
    if (mode === 'edit' && tactique) {
      return `Modifier la tactique: ${tactique.TC_Label}`;
    }
    return 'Nouvelle tactique';
  };

  const getSubmitButtonText = () => {
    if (loading) return 'Enregistrement...';
    return mode === 'edit' ? 'Mettre à jour' : 'Créer';
  };

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
            publishersOptions={[]}
            loading={loading}
            isPublishersLoading={false}
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
            clientId={selectedClient?.clientId || ''} 

            onChange={handleChange}
            onCalculatedChange={handleBudgetChange}
            onTooltipChange={setActiveTooltip}
            loading={loading}
            
          />
        );

      case 'repartition':
        return (
          <TactiqueFormRepartition
            formData={formData}
            onChange={handleChange}
            onTooltipChange={setActiveTooltip}
            breakdowns={breakdowns}
            loading={loading}
            clientId={selectedClient?.clientId || ''}
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

  return (
    <>
      <TaxonomyUpdateBanner
        status={status}
        onDismiss={dismissNotification}
      />

      <FormDrawer
        isOpen={isOpen}
        onClose={handleClose}
        title={getDrawerTitle()}
      >
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <FormTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="flex-1 overflow-y-auto">
            {renderTabContent()}
          </div>

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
                {getSubmitButtonText()}
              </button>
            </div>
          </div>
        </form>

        <TooltipBanner tooltip={activeTooltip} />
      </FormDrawer>
    </>
  );
}