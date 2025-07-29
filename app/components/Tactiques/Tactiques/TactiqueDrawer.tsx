// app/components/Tactiques/Tactiques/TactiqueDrawer.tsx

/**
 * Ce fichier définit le composant `TactiqueDrawer` avec intégration du système de cache localStorage.
 * VERSION MODIFIÉE : Utilise le cache en priorité pour les listes dynamiques et shortcodes,
 * avec fallback sur Firebase si le cache n'est pas disponible.
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

// NOUVEAU : Import des fonctions de cache
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
    console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: getCachedOrFirebaseList - Path: dynamic_lists/${fieldId}`);
    return await getDynamicList(fieldId, clientId);
    
  } catch (error) {
    console.error(`[CACHE] Erreur récupération ${fieldId}:`, error);
    
    // En cas d'erreur, fallback sur Firebase
    console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: getCachedOrFirebaseList - Path: dynamic_lists/${fieldId} (FALLBACK)`);
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
    console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: hasCachedOrFirebaseList - Path: dynamic_lists/${fieldId}`);
    return await hasDynamicList(fieldId, clientId);
    
  } catch (error) {
    console.error(`[CACHE] Erreur vérification ${fieldId}:`, error);
    
    // En cas d'erreur, fallback sur Firebase
    console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: hasCachedOrFirebaseList - Path: dynamic_lists/${fieldId} (FALLBACK)`);
    return await hasDynamicList(fieldId, clientId);
  }
};

/**
 * Convertit un objet tactique provenant de Firestore en un format adapté au formulaire (`TactiqueFormData`).
 */
const mapTactiqueToForm = (tactique: any): TactiqueFormData => {
  const baseData = {
    TC_Label: tactique.TC_Label || '',
    TC_Budget: tactique.TC_Budget || 0,
    TC_Order: tactique.TC_Order || 0,
    TC_SectionId: tactique.TC_SectionId || '',
    TC_Status: tactique.TC_Status || 'Planned',
    TC_StartDate: tactique.TC_StartDate || '',
    TC_EndDate: tactique.TC_EndDate || '',
    TC_Bucket: tactique.TC_Bucket || '',
    breakdowns: tactique.TC_Bucket || '',
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
 * Retourne un objet `TactiqueFormData` avec des valeurs par défaut pour une nouvelle tactique.
 */
const getDefaultFormData = (): TactiqueFormData => ({
  TC_Label: '',
  TC_Budget: 0,
  TC_Order: 0,
  TC_SectionId: '',
  TC_Status: 'Planned',
});

/**
 * Composant principal `TactiqueDrawer` MODIFIÉ pour utiliser le cache localStorage.
 */
export default function TactiqueDrawer({
  isOpen,
  onClose,
  tactique,
  sectionId,
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
  const [customDimensions, setCustomDimensions] = useState<ClientCustomDimensions>({});
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

  // MODIFIÉ : TC_Publisher ajouté dans la liste des champs dynamiques
  const dynamicListFields = useMemo(() => [
    'TC_LoB', 'TC_Media_Type', 'TC_Publisher', 'TC_Buying_Method', 'TC_Custom_Dim_1',
    'TC_Custom_Dim_2', 'TC_Custom_Dim_3', 'TC_Inventory', 'TC_Market', 'TC_Language',
    'TC_Media_Objective', 'TC_Kpi', 'TC_Unit_Type'
  ], []);

  useEffect(() => {
    if (tactique) {
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
    } else {
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
  }, [tactique, sectionId]);

  useEffect(() => {
    if (isOpen && selectedClient && selectedCampaign && selectedVersion) {
      loadAllData();
    }
  }, [isOpen, selectedClient, selectedCampaign, selectedVersion]);

  /**
   * MODIFIÉE : Charge toutes les données avec priorité sur le cache localStorage
   * VERSION 2024 : TC_Publisher traité comme toute autre liste
   */
  const loadAllData = useCallback(async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`[CACHE] 🚀 Début chargement données avec cache pour TactiqueDrawer`);
      
      // 1. Dimensions personnalisées (pas encore cachées, reste Firebase)
      console.log(`FIREBASE: LECTURE - Fichier: TactiqueDrawer.tsx - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/config/dimensions`);
      const clientDimensions = await getClientCustomDimensions(selectedClient.clientId);
      setCustomDimensions(clientDimensions);

      const newVisibleFields: VisibleFields = {
        TC_Custom_Dim_1: !!clientDimensions.Custom_Dim_CA_1,
        TC_Custom_Dim_2: !!clientDimensions.Custom_Dim_CA_2,
        TC_Custom_Dim_3: !!clientDimensions.Custom_Dim_CA_3,
      };

      // 2. MODIFIÉ : Vérifier l'existence des listes via le cache (incluant TC_Publisher)
      for (const field of dynamicListFields) {
        if (field.startsWith('TC_Custom_Dim_') && !newVisibleFields[field]) {
          continue;
        }
        
        console.log(`[CACHE] Vérification existence de ${field}`);
        const hasListResult = await hasCachedOrFirebaseList(field, selectedClient.clientId);
        newVisibleFields[field] = hasListResult;
      }

      // 3. MODIFIÉ : Charger les listes via le cache (incluant TC_Publisher)
      const newDynamicLists: { [key: string]: ListItem[] } = {};
      for (const field of dynamicListFields) {
        if (newVisibleFields[field]) {
          console.log(`[CACHE] Chargement de ${field}`);
          const list = await getCachedOrFirebaseList(field, selectedClient.clientId);
          newDynamicLists[field] = list;
        }
      }

      setDynamicLists(newDynamicLists);
      setVisibleFields(newVisibleFields);

      // 4. Autres données (pas encore cachées, reste Firebase)
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

      console.log(`[CACHE] ✅ Chargement terminé avec cache`);

    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedCampaign, selectedVersion, dynamicListFields]);

  /**
   * Gestionnaire générique pour mettre à jour l'état du formulaire lors d'un changement d'input.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e - L'événement de changement.
   */
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

  /**
   * Met à jour l'état du formulaire avec les données calculées provenant de l'onglet Budget.
   * @param {any} budgetData - Les données calculées du budget.
   */
  const handleBudgetChange = useCallback((budgetData: any) => {
    setFormData(prev => ({
      ...prev,
      ...budgetData
    }));
    setIsDirty(true);
  }, []);

  /**
   * Gère les changements dans les champs de KPI.
   * @param {number} index - L'index du KPI dans la liste.
   * @param {keyof KPIData} field - Le champ du KPI à modifier.
   * @param {string | number} value - La nouvelle valeur.
   */
  const handleKpiChange = useCallback((index: number, field: keyof KPIData, value: string | number) => {
    setKpis(prev => {
      const newKpis = [...prev];
      newKpis[index] = { ...newKpis[index], [field]: value };
      return newKpis;
    });
    setIsDirty(true);
  }, []);

  /**
   * Ajoute une nouvelle ligne de KPI vide au formulaire.
   */
  const addKpi = useCallback(() => {
    setKpis(prev => {
      if (prev.length < 5) {
        return [...prev, { TC_Kpi: '', TC_Kpi_CostPer: 0, TC_Kpi_Volume: 0 }];
      }
      return prev;
    });
    setIsDirty(true);
  }, []);

  /**
   * Supprime une ligne de KPI du formulaire.
   * @param {number} index - L'index du KPI à supprimer.
   */
  const removeKpi = useCallback((index: number) => {
    setKpis(prev => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
    setIsDirty(true);
  }, []);

  /**
   * Gère la soumission du formulaire. Prépare les données, les sauvegarde,
   * ferme le drawer et lance une mise à jour des taxonomies en arrière-plan.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      let dataToSave = { ...formData };

      kpis.forEach((kpi, index) => {
        const suffix = index === 0 ? '' : `_${index + 1}`;
        (dataToSave as any)[`TC_Kpi${suffix}`] = kpi.TC_Kpi;
        (dataToSave as any)[`TC_Kpi_CostPer${suffix}`] = kpi.TC_Kpi_CostPer;
        (dataToSave as any)[`TC_Kpi_Volume${suffix}`] = kpi.TC_Kpi_Volume;
      });

      if (useInheritedBilling) {
        (dataToSave as any).TC_Billing_ID = campaignAdminValues.CA_Billing_ID || '';
      }
      if (useInheritedPO) {
        (dataToSave as any).TC_PO = campaignAdminValues.CA_PO || '';
      }

      const mappedData = mapFormToTactique(dataToSave);

      console.log("FIREBASE: ÉCRITURE - Fichier: TactiqueDrawer.tsx - Fonction: handleSubmit - Path: tactics");
      await onSave(mappedData);

      setIsDirty(false);
      onClose();

      if (tactique && tactique.id && selectedClient && selectedCampaign) {
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
  }, [formData, kpis, useInheritedBilling, useInheritedPO, campaignAdminValues, onSave, onClose, tactique, selectedClient, selectedCampaign, updateTaxonomiesAsync]);

  /**
   * Gère la fermeture du drawer, en affichant une confirmation si des modifications n'ont pas été sauvegardées.
   */
  const handleClose = useCallback(() => {
    if (isDirty) {
      const shouldClose = confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?');
      if (!shouldClose) return;
    }

    setIsDirty(false);
    onClose();
  }, [isDirty, onClose]);

  /**
   * Rend le contenu de l'onglet actuellement sélectionné.
   * @returns {React.ReactElement | null} Le composant de l'onglet actif.
   */
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
            publishersOptions={[]} // SUPPRIMÉ : Plus d'options spéciales pour publishers
            loading={loading}
            isPublishersLoading={false} // SUPPRIMÉ : Plus de loading spécial pour publishers
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
        title={tactique ? `Modifier la tactique: ${tactique.TC_Label}` : 'Nouvelle tactique'}
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
                {loading ? 'Enregistrement...' : (tactique ? 'Mettre à jour' : 'Créer')}
              </button>
            </div>
          </div>
        </form>

        <TooltipBanner tooltip={activeTooltip} />
      </FormDrawer>
    </>
  );
}