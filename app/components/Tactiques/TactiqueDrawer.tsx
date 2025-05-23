'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FormDrawer from './FormDrawer';
import FormTabs, { FormTab } from './FormTabs';
import { TooltipBanner } from './TactiqueFormComponents';
// Import des composants réels progressivement
import TactiqueFormInfo from './TactiqueFormInfo';
import TactiqueFormStrategie from './TactiqueFormStrategie';

// Composants temporaires restants
const TactiqueFormKPI = ({ formData, kpis, onChange, onTooltipChange }: any) => (
  <div className="p-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">KPIs et objectifs</h3>
    <p className="text-gray-600">Composant KPI temporaire - en cours de création...</p>
  </div>
);

const TactiqueFormAdmin = ({ formData, onChange, onTooltipChange }: any) => (
  <div className="p-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Administration</h3>
    <p className="text-gray-600">Composant Admin temporaire - en cours de création...</p>
  </div>
);
import { 
  DocumentTextIcon, 
  LightBulbIcon, 
  ChartBarIcon, 
  CogIcon
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
  [key: string]: boolean | undefined;
}

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
  
  // Données du formulaire
  const [formData, setFormData] = useState<TactiqueFormData>({
    TC_Label: '',
    TC_Budget: 0,
    TC_Order: 0,
    TC_SectionId: sectionId,
    TC_Status: 'Planned',
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
  
  // ==================== DONNÉES MEMOIZED ====================
  
  // Onglets de navigation
  const tabs: FormTab[] = useMemo(() => [
    { id: 'info', name: 'Info', icon: DocumentTextIcon },
    { id: 'strategie', name: 'Stratégie', icon: LightBulbIcon },
    { id: 'kpi', name: 'KPI', icon: ChartBarIcon },
    { id: 'admin', name: 'Admin', icon: CogIcon },
  ], []);

  // Champs avec listes dynamiques
  const dynamicListFields = useMemo(() => [
    'TC_LoB', 'TC_Media_Type', 'TC_Buying_Method', 'TC_Custom_Dim_1',
    'TC_Custom_Dim_2', 'TC_Custom_Dim_3', 'TC_Market', 'TC_Language',
    'TC_Media_Objective', 'TC_Kpi'
  ], []);

  // Options pour les partenaires
  const publishersOptions = useMemo(() => 
    getPublishersForSelect(), [getPublishersForSelect]
  );

  // ==================== EFFECTS ====================
  
  // Initialiser le formulaire quand la tactique change
  useEffect(() => {
    if (tactique) {
      setFormData({
        TC_Label: tactique.TC_Label || '',
        TC_Budget: tactique.TC_Budget || 0,
        TC_Order: tactique.TC_Order || 0,
        TC_SectionId: tactique.TC_SectionId || sectionId,
        TC_Status: tactique.TC_Status || 'Planned',
        TC_StartDate: tactique.TC_StartDate || '',
        TC_EndDate: tactique.TC_EndDate || '',
        TC_Bucket: tactique.TC_Bucket || '',
        // ... tous les autres champs
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
      });

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
      setFormData({
        TC_Label: '',
        TC_Budget: 0,
        TC_Order: 0,
        TC_SectionId: sectionId,
        TC_Status: 'Planned',
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
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedCampaign, selectedVersion, dynamicListFields, isPublishersLoading, publishersOptions.length]);
  
  // Gérer les changements dans le formulaire
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseFloat(value) || 0) : value
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
  
  // Gérer la soumission du formulaire
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Préparer les données avec les KPIs
      const dataToSave = { ...formData };
      
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

      await onSave(dataToSave);
      setIsDirty(false);
      onClose();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la tactique:', err);
      setError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [formData, kpis, useInheritedBilling, useInheritedPO, campaignAdminValues, onSave, onClose]);

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