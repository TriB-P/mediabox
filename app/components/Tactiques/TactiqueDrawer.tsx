'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FormDrawer from './FormDrawer';
import FormTabs, { FormTab } from './FormTabs';
import { 
  DocumentTextIcon, 
  LightBulbIcon, 
  ChartBarIcon, 
  CogIcon,
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/outline';
import { Tactique, TactiqueFormData } from '../../types/tactiques';
import { useClient } from '../../contexts/ClientContext';
import { useCampaignSelection } from '../../hooks/useCampaignSelection';
import SearchableSelect from './SearchableSelect';
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

  // État pour les onglets
  const [activeTab, setActiveTab] = useState('info');
  
  // État pour le formulaire principal
  const [formData, setFormData] = useState<TactiqueFormData>({
    TC_Label: '',
    TC_Budget: 0,
    TC_Order: 0,
    TC_SectionId: sectionId,
    TC_Status: 'Planned',
  });

  // États pour les KPIs multiples (jusqu'à 5)
  const [kpis, setKpis] = useState<KPIData[]>([
    { TC_Kpi: '', TC_Kpi_CostPer: 0, TC_Kpi_Volume: 0 }
  ]);

  // États pour les champs admin avec héritage de campagne
  const [useInheritedBilling, setUseInheritedBilling] = useState(true);
  const [useInheritedPO, setUseInheritedPO] = useState(true);
  const [campaignAdminValues, setCampaignAdminValues] = useState<{ CA_Billing_ID?: string; CA_PO?: string }>({});

  // États pour les listes dynamiques
  const [dynamicLists, setDynamicLists] = useState<{ [key: string]: ListItem[] }>({});
  const [buckets, setBuckets] = useState<CampaignBucket[]>([]);
  const [customDimensions, setCustomDimensions] = useState<ClientCustomDimensions>({});
  const [visibleFields, setVisibleFields] = useState<VisibleFields>({});
  
  // État de chargement et erreurs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // État pour le tooltip affiché
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // Définition des onglets (memoized)
  const tabs: FormTab[] = useMemo(() => [
    { id: 'info', name: 'Info', icon: DocumentTextIcon },
    { id: 'strategie', name: 'Stratégie', icon: LightBulbIcon },
    { id: 'kpi', name: 'KPI', icon: ChartBarIcon },
    { id: 'admin', name: 'Admin', icon: CogIcon },
  ], []);

  // Liste des champs avec listes dynamiques (memoized)
  const dynamicListFields = useMemo(() => [
    'TC_LoB',
    'TC_Media_Type', 
    'TC_Buying_Method',
    'TC_Custom_Dim_1',
    'TC_Custom_Dim_2', 
    'TC_Custom_Dim_3',
    'TC_Market',
    'TC_Language',
    'TC_Media_Objective',
    'TC_Kpi'
  ], []);
  
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
        const kpi = (tactique as any)[`TC_Kpi_${i}`];
        const costPer = (tactique as any)[`TC_Kpi_CostPer_${i}`] || 0;
        const volume = (tactique as any)[`TC_Kpi_Volume_${i}`] || 0;
        
        if (kpi || costPer || volume) {
          existingKpis.push({
            TC_Kpi: kpi || '',
            TC_Kpi_CostPer: costPer,
            TC_Kpi_Volume: volume,
          });
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
      // Nouvelle tactique
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
  
  // Charger toutes les données nécessaires quand le drawer s'ouvre
  useEffect(() => {
    if (isOpen && selectedClient && selectedCampaign && selectedVersion) {
      loadAllData();
    }
  }, [isOpen, selectedClient, selectedCampaign, selectedVersion]);
  
  const loadAllData = async () => {
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
          continue; // Skip les dimensions personnalisées non définies
        }
        
        const hasListResult = await hasDynamicList(field, selectedClient.clientId);
        newVisibleFields[field] = hasListResult;
      }

      // TC_Publisher est toujours visible si les partenaires sont disponibles
      newVisibleFields.TC_Publisher = !isPublishersLoading && getPublishersForSelect().length > 0;

      // Charger toutes les listes dynamiques visibles (sauf TC_Publisher)
      const newDynamicLists: { [key: string]: ListItem[] } = {};

      for (const field of dynamicListFields) {
        if (newVisibleFields[field]) {
          const list = await getDynamicList(field, selectedClient.clientId);
          newDynamicLists[field] = list;
        }
      }
      
      setDynamicLists(newDynamicLists);

      // Charger les buckets de campagne
      const campaignBuckets = await getCampaignBuckets(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id
      );
      setBuckets(campaignBuckets);

      // Charger les valeurs admin de la campagne
      const adminValues = await getCampaignAdminValues(
        selectedClient.clientId,
        selectedCampaign.id
      );
      setCampaignAdminValues(adminValues);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer les changements dans le formulaire (optimisé avec useCallback)
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseFloat(value) || 0) : value
    }));
    
    setIsDirty(true);
  }, []);

  // Gérer les changements de KPI (optimisé avec useCallback)
  const handleKpiChange = useCallback((index: number, field: keyof KPIData, value: string | number) => {
    setKpis(prev => {
      const newKpis = [...prev];
      newKpis[index] = {
        ...newKpis[index],
        [field]: value
      };
      return newKpis;
    });
    setIsDirty(true);
  }, []);

  // Ajouter un KPI (optimisé avec useCallback)
  const addKpi = useCallback(() => {
    setKpis(prev => {
      if (prev.length < 5) {
        return [...prev, { TC_Kpi: '', TC_Kpi_CostPer: 0, TC_Kpi_Volume: 0 }];
      }
      return prev;
    });
    setIsDirty(true);
  }, []);

  // Supprimer un KPI (optimisé avec useCallback)
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
  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  // Gérer la fermeture avec vérification des modifications
  const handleClose = () => {
    if (isDirty) {
      const shouldClose = confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?');
      if (!shouldClose) return;
    }
    
    setIsDirty(false);
    onClose();
  };

  // Composant pour afficher l'icône d'aide optimisée
  const HelpIcon = React.memo(({ tooltip }: { tooltip: string }) => (
    <QuestionMarkCircleIcon 
      className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" 
      onMouseEnter={() => setActiveTooltip(tooltip)}
      onMouseLeave={() => setActiveTooltip(null)}
    />
  ));

  // Composant pour les boutons de sélection (optimisé)
  const SelectionButtons = React.memo(({ 
    options, 
    value, 
    onChange, 
    name, 
    placeholder 
  }: {
    options: { id: string; label: string }[];
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
    placeholder: string;
  }) => (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              const event = {
                target: { name, value: value === option.id ? '' : option.id }
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(event);
            }}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              value === option.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => {
            const event = {
              target: { name, value: '' }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(event);
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Effacer la sélection
        </button>
      )}
    </div>
  ));

  // Composant intelligent qui choisit entre boutons ou dropdown (optimisé)
  const SmartSelect = React.memo(({ 
    id, 
    name, 
    value, 
    onChange, 
    options, 
    placeholder, 
    label 
  }: {
    id: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    options: { id: string; label: string }[];
    placeholder: string;
    label: React.ReactNode;
  }) => {
    return (
      <div>
        <div className="flex items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        </div>
        {options.length <= 5 ? (
          <SelectionButtons
            options={options}
            value={value}
            onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            name={name}
            placeholder={placeholder}
          />
        ) : (
          <SearchableSelect
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            label=""
          />
        )}
      </div>
    );
  });
  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="p-8 space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-xl font-semibold text-gray-900">Informations générales</h3>
              <p className="text-sm text-gray-600 mt-1">Configuration de base de la tactique</p>
            </div>
            
            {/* TC_Label */}
            <div>
              <div className="flex items-center mb-2">
                <HelpIcon tooltip="Open string. Pas de contraintes" />
                <label htmlFor="TC_Label" className="block text-sm font-medium text-gray-700 ml-3">
                  Étiquette *
                </label>
              </div>
              <input
                type="text"
                id="TC_Label"
                name="TC_Label"
                value={formData.TC_Label || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Bannières Display Google"
              />
            </div>

            {/* TC_Bucket */}
            {buckets.length > 0 && (
              <SmartSelect
                id="TC_Bucket"
                name="TC_Bucket"
                value={formData.TC_Bucket || ''}
                onChange={handleChange}
                options={buckets.map(bucket => ({ id: bucket.id, label: bucket.name }))}
                placeholder="Sélectionner une enveloppe..."
                label={
                  <>
                    <HelpIcon tooltip="Liste des buckets dans la campagne. Une selection possible" />
                    <span className="ml-3">Enveloppe</span>
                  </>
                }
              />
            )}
          </div>
        );
      
      case 'strategie':
        return (
          <div className="p-8 space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-xl font-semibold text-gray-900">Stratégie média</h3>
              <p className="text-sm text-gray-600 mt-1">Configuration stratégique et ciblage</p>
            </div>
            
            {/* Section principale */}
            <div className="space-y-6">
              {/* TC_LoB */}
              {(dynamicLists.TC_LoB && dynamicLists.TC_LoB.length > 0) && (
                <SmartSelect
                  id="TC_LoB"
                  name="TC_LoB"
                  value={formData.TC_LoB || ''}
                  onChange={handleChange}
                  options={dynamicLists.TC_LoB?.map(item => ({ id: item.id, label: item.SH_Display_Name_FR })) || []}
                  placeholder="Sélectionner une ligne d'affaire..."
                  label={
                    <>
                      <HelpIcon tooltip="Masquer si aucune liste trouvée" />
                      <span className="ml-3">Ligne d'affaire</span>
                    </>
                  }
                />
              )}

              {/* TC_Media_Type */}
              {(dynamicLists.TC_Media_Type && dynamicLists.TC_Media_Type.length > 0) && (
                <SmartSelect
                  id="TC_Media_Type"
                  name="TC_Media_Type"
                  value={formData.TC_Media_Type || ''}
                  onChange={handleChange}
                  options={dynamicLists.TC_Media_Type?.map(item => ({ id: item.id, label: item.SH_Display_Name_FR })) || []}
                  placeholder="Sélectionner un type de média..."
                  label={
                    <>
                      <HelpIcon tooltip="Masquer si aucune liste trouvée" />
                      <span className="ml-3">Type média</span>
                    </>
                  }
                />
              )}

           {/* TC_Publisher */}
           {(!isPublishersLoading && getPublishersForSelect().length > 0) && (
                <SmartSelect
                  id="TC_Publisher"
                  name="TC_Publisher"
                  value={formData.TC_Publisher || ''}
                  onChange={handleChange}
                  options={getPublishersForSelect()}
                  placeholder="Sélectionner un partenaire..."
                  label={
                    <>
                      <HelpIcon tooltip="Liste des partenaires pré-chargée" />
                      <span className="ml-3">Partenaire</span>
                    </>
                  }
                />
              )}

              {/* TC_Inventory */}
              {(!isPublishersLoading && getPublishersForSelect().length > 0) && (
                <SmartSelect
                  id="TC_Inventory"
                  name="TC_Inventory"
                  value={formData.TC_Inventory || ''}
                  onChange={handleChange}
                  options={getPublishersForSelect()}
                  placeholder="Sélectionner un inventaire..."
                  label={
                    <>
                      <HelpIcon tooltip="Masquer si aucune liste trouvée" />
                      <span className="ml-3">Inventaire</span>
                    </>
                  }
                />
              )}

              {/* TC_Product_Open */}
              <div>
                <div className="flex items-center mb-2">
                  <HelpIcon tooltip="Open string. Pas de contraintes" />
                  <label htmlFor="TC_Product_Open" className="block text-sm font-medium text-gray-700 ml-3">
                    Description du produit
                  </label>
                </div>
                <input
                  type="text"
                  id="TC_Product_Open"
                  name="TC_Product_Open"
                  value={formData.TC_Product_Open || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: iPhone 15 Pro"
                />
              </div>

              {/* TC_Targeting_Open */}
              <div>
                <div className="flex items-center mb-2">
                  <HelpIcon tooltip="Open string. Pas de contraintes" />
                  <label htmlFor="TC_Targeting_Open" className="block text-sm font-medium text-gray-700 ml-3">
                    Description de l'audience
                  </label>
                </div>
                <textarea
                  id="TC_Targeting_Open"
                  name="TC_Targeting_Open"
                  rows={3}
                  value={formData.TC_Targeting_Open || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Décrivez le ciblage de cette tactique..."
                />
              </div>

              {/* TC_Market_Open */}
              <div>
                <div className="flex items-center mb-2">
                  <HelpIcon tooltip="Open string. Pas de contraintes" />
                  <label htmlFor="TC_Market_Open" className="block text-sm font-medium text-gray-700 ml-3">
                    Description du marché
                  </label>
                </div>
                <input
                  type="text"
                  id="TC_Market_Open"
                  name="TC_Market_Open"
                  value={formData.TC_Market_Open || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Canada, Québec, Montréal"
                />
              </div>

              {/* TC_Frequence */}
              <div>
                <div className="flex items-center mb-2">
                  <HelpIcon tooltip="Open string. Pas de contraintes" />
                  <label htmlFor="TC_Frequence" className="block text-sm font-medium text-gray-700 ml-3">
                    Fréquence
                  </label>
                </div>
                <input
                  type="text"
                  id="TC_Frequence"
                  name="TC_Frequence"
                  value={formData.TC_Frequence || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: 3 fois par semaine"
                />
              </div>

              {/* TC_Location */}
              <div>
                <div className="flex items-center mb-2">
                  <HelpIcon tooltip="Open string. Pas de contraintes" />
                  <label htmlFor="TC_Location" className="block text-sm font-medium text-gray-700 ml-3">
                    Description de l'emplacement
                  </label>
                </div>
                <input
                  type="text"
                  id="TC_Location"
                  name="TC_Location"
                  value={formData.TC_Location || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Décrivez l'emplacement"
                  />
              </div>

              {/* TC_Market */}
              {(dynamicLists.TC_Market && dynamicLists.TC_Market.length > 0) && (
                <SmartSelect
                  id="TC_Market"
                  name="TC_Market"
                  value={formData.TC_Market || ''}
                  onChange={handleChange}
                  options={dynamicLists.TC_Market?.map(item => ({ id: item.id, label: item.SH_Display_Name_FR })) || []}
                  placeholder="Sélectionner un marché..."
                  label={
                    <>
                      <HelpIcon tooltip="Masquer si aucune liste trouvée" />
                      <span className="ml-3">Marché</span>
                    </>
                  }
                />
              )}

              {/* TC_Language */}
              {(dynamicLists.TC_Language && dynamicLists.TC_Language.length > 0) && (
                <SmartSelect
                  id="TC_Language"
                  name="TC_Language"
                  value={formData.TC_Language || ''}
                  onChange={handleChange}
                  options={dynamicLists.TC_Language?.map(item => ({ id: item.id, label: item.SH_Display_Name_FR })) || []}
                  placeholder="Sélectionner une langue..."
                  label={
                    <>
                      <HelpIcon tooltip="Masquer si aucune liste trouvée" />
                      <span className="ml-3">Langue</span>
                    </>
                  }
                />
              )}

              {/* TC_Format_Open */}
              <div>
                <div className="flex items-center mb-2">
                  <HelpIcon tooltip="Open string. Pas de contraintes" />
                  <label htmlFor="TC_Format_Open" className="block text-sm font-medium text-gray-700 ml-3">
                    Description du format
                  </label>
                </div>
                <textarea
                  id="TC_Format_Open"
                  name="TC_Format_Open"
                  rows={2}
                  value={formData.TC_Format_Open || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Décrivez le format utilisé..."
                />
              </div>
            </div>

            {/* Sous-section: Champs personnalisés */}
            {(visibleFields.TC_Custom_Dim_1 || visibleFields.TC_Custom_Dim_2 || visibleFields.TC_Custom_Dim_3 || visibleFields.TC_Buying_Method) && (
              <div className="border-t border-gray-200 pt-8">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800">Champs personnalisés</h4>
                  <p className="text-sm text-gray-600 mt-1">Configuration spécifique au client</p>
                </div>
                <div className="space-y-6">
                  
                  {/* TC_Buying_Method */}
                  {(dynamicLists.TC_Buying_Method && dynamicLists.TC_Buying_Method.length > 0) && (
                    <SmartSelect
                      id="TC_Buying_Method"
                      name="TC_Buying_Method"
                      value={formData.TC_Buying_Method || ''}
                      onChange={handleChange}
                      options={dynamicLists.TC_Buying_Method?.map(item => ({ id: item.id, label: item.SH_Display_Name_FR })) || []}
                      placeholder="Sélectionner une méthode d'achat..."
                      label={
                        <>
                          <HelpIcon tooltip="Masquer si aucune liste trouvée" />
                          <span className="ml-3">Méthode d'achat</span>
                        </>
                      }
                    />
                  )}

                  {/* TC_Custom_Dim_1 */}
                  {(dynamicLists.TC_Custom_Dim_1 && dynamicLists.TC_Custom_Dim_1.length > 0) && (
                    <SmartSelect
                      id="TC_Custom_Dim_1"
                      name="TC_Custom_Dim_1"
                      value={formData.TC_Custom_Dim_1 || ''}
                      onChange={handleChange}
                      options={dynamicLists.TC_Custom_Dim_1?.map(item => ({ id: item.id, label: item.SH_Display_Name_FR })) || []}
                      placeholder={`Sélectionner ${customDimensions.Custom_Dim_CA_1}...`}
                      label={
                        <>
                          <HelpIcon tooltip="Afficher seulement si Custom_Dim_CA_1 (dans la collection du client) est rempli. Champs ouvert si aucune liste est trouvée." />
                          <span className="ml-3">{customDimensions.Custom_Dim_CA_1}</span>
                        </>
                      }
                    />
                  )}

                  {/* TC_Custom_Dim_2 */}
                  {(dynamicLists.TC_Custom_Dim_2 && dynamicLists.TC_Custom_Dim_2.length > 0) && (
                    <SmartSelect
                      id="TC_Custom_Dim_2"
                      name="TC_Custom_Dim_2"
                      value={formData.TC_Custom_Dim_2 || ''}
                      onChange={handleChange}
                      options={dynamicLists.TC_Custom_Dim_2?.map(item => ({ id: item.id, label: item.SH_Display_Name_FR })) || []}
                      placeholder={`Sélectionner ${customDimensions.Custom_Dim_CA_2}...`}
                      label={
                        <>
                          <HelpIcon tooltip="Afficher seulement si Custom_Dim_CA_2 (dans la collection du client) est rempli. Champs ouvert si aucune liste est trouvée." />
                          <span className="ml-3">{customDimensions.Custom_Dim_CA_2}</span>
                        </>
                      }
                    />
                  )}

                  {/* TC_Custom_Dim_3 */}
                  {(dynamicLists.TC_Custom_Dim_3 && dynamicLists.TC_Custom_Dim_3.length > 0) && (
                    <SmartSelect
                      id="TC_Custom_Dim_3"
                      name="TC_Custom_Dim_3"
                      value={formData.TC_Custom_Dim_3 || ''}
                      onChange={handleChange}
                      options={dynamicLists.TC_Custom_Dim_3?.map(item => ({ id: item.id, label: item.SH_Display_Name_FR })) || []}
                      placeholder={`Sélectionner ${customDimensions.Custom_Dim_CA_3}...`}
                      label={
                        <>
                          <HelpIcon tooltip="Afficher seulement si Custom_Dim_CA_3 (dans la collection du client) est rempli. Champs ouvert si aucune liste est trouvée." />
                          <span className="ml-3">{customDimensions.Custom_Dim_CA_3}</span>
                        </>
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* Sous-section: Production */}
            <div className="border-t border-gray-200 pt-8">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h4 className="text-lg font-semibold text-gray-800">Production</h4>
                <p className="text-sm text-gray-600 mt-1">Gestion des créatifs et des livrables</p>
              </div>
              <div className="space-y-6">
                
                {/* TC_NumberCreatives */}
                <div>
                  <div className="flex items-center mb-2">
                    <HelpIcon tooltip="Open string. Pas de contraintes" />
                    <label htmlFor="TC_NumberCreatives" className="block text-sm font-medium text-gray-700 ml-3">
                      Nombre de créatifs suggérés
                    </label>
                  </div>
                  <input
                    type="text"
                    id="TC_NumberCreatives"
                    name="TC_NumberCreatives"
                    value={formData.TC_NumberCreatives || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: 5 bannières + 2 vidéos"
                  />
                </div>

                {/* TC_AssetDate */}
                <div>
                  <div className="flex items-center mb-2">
                    <HelpIcon tooltip="Open date. Pas de contraintes" />
                    <label htmlFor="TC_AssetDate" className="block text-sm font-medium text-gray-700 ml-3">
                      Date de livraison des créatifs
                    </label>
                  </div>
                  <input
                    type="date"
                    id="TC_AssetDate"
                    name="TC_AssetDate"
                    value={formData.TC_AssetDate || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'kpi':
        return (
          <div className="p-8 space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-xl font-semibold text-gray-900">KPIs et objectifs</h3>
              <p className="text-sm text-gray-600 mt-1">Définition des indicateurs de performance</p>
            </div>
            
            {/* TC_Media_Objective */}
            {(dynamicLists.TC_Media_Objective && dynamicLists.TC_Media_Objective.length > 0) && (
              <SmartSelect
                id="TC_Media_Objective"
                name="TC_Media_Objective"
                value={formData.TC_Media_Objective || ''}
                onChange={handleChange}
                options={dynamicLists.TC_Media_Objective?.map(item => ({ id: item.id, label: item.SH_Display_Name_FR })) || []}
                placeholder="Sélectionner un objectif média..."
                label={
                  <>
                    <HelpIcon tooltip="Masquer si aucune liste trouvée" />
                    <span className="ml-3">Objectif média</span>
                  </>
                }
              />
            )}

            {/* Section KPIs multiples */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">KPIs de performance</h4>
                  <p className="text-sm text-gray-600 mt-1">Jusqu'à 5 KPIs peuvent être définis</p>
                </div>
                {kpis.length < 5 && (
                  <button
                    type="button"
                    onClick={addKpi}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    + Ajouter un KPI
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {kpis.map((kpi, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-medium text-gray-800">KPI #{index + 1}</span>
                      {kpis.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeKpi(index)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* KPI Type */}
                      {(dynamicLists.TC_Kpi && dynamicLists.TC_Kpi.length > 0) && (
                        <div>
                          <div className="flex items-center mb-2">
                            <HelpIcon tooltip="Masquer si aucune liste trouvée" />
                            <label className="block text-sm font-medium text-gray-700 ml-3">
                              KPI
                            </label>
                          </div>
                          {dynamicLists.TC_Kpi.length <= 5 ? (
                            <SelectionButtons
                              options={dynamicLists.TC_Kpi?.map(item => ({ id: item.id, label: item.SH_Display_Name_FR })) || []}
                              value={kpi.TC_Kpi}
                              onChange={(e) => handleKpiChange(index, 'TC_Kpi', e.target.value)}
                              name={`TC_Kpi_${index}`}
                              placeholder="Sélectionner un KPI..."
                            />
                          ) : (
                            <SearchableSelect
                              id={`TC_Kpi_${index}`}
                              name={`TC_Kpi_${index}`}
                              value={kpi.TC_Kpi}
                              onChange={(e) => handleKpiChange(index, 'TC_Kpi', e.target.value)}
                              options={dynamicLists.TC_Kpi?.map(item => ({ id: item.id, label: item.SH_Display_Name_FR })) || []}
                              placeholder="Sélectionner un KPI..."
                              label=""
                            />
                          )}
                        </div>
                      )}

                      {/* Cost Per */}
                      <div>
                        <div className="flex items-center mb-2">
                          <HelpIcon tooltip="Champs libre" />
                          <label className="block text-sm font-medium text-gray-700 ml-3">
                            Coût par
                          </label>
                        </div>
                        <div className="relative rounded-lg shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            value={kpi.TC_Kpi_CostPer}
                            onChange={(e) => handleKpiChange(index, 'TC_Kpi_CostPer', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="block w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Volume */}
                      <div>
                        <div className="flex items-center mb-2">
                          <HelpIcon tooltip="Champs libre" />
                          <label className="block text-sm font-medium text-gray-700 ml-3">
                            Volume
                          </label>
                        </div>
                        <input
                          type="number"
                          value={kpi.TC_Kpi_Volume}
                          onChange={(e) => handleKpiChange(index, 'TC_Kpi_Volume', parseFloat(e.target.value) || 0)}
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'admin':
        return (
          <div className="p-8 space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-xl font-semibold text-gray-900">Administration</h3>
              <p className="text-sm text-gray-600 mt-1">Configuration administrative et facturation</p>
            </div>
            
            {/* TC_Billing_ID */}
            <div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="inherit_billing"
                  checked={useInheritedBilling}
                  onChange={(e) => {
                    setUseInheritedBilling(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="inherit_billing" className="ml-3 text-sm text-gray-700">
                  Utiliser le même que la campagne
                </label>
              </div>
              
              <div className="flex items-center mb-2">
                <HelpIcon tooltip="Numéro utilisé pour la facturation de cette tactique" />
                <label htmlFor="TC_Billing_ID" className="block text-sm font-medium text-gray-700 ml-3">
                  Numéro de facturation
                </label>
              </div>
              
              {useInheritedBilling ? (
                <input
                  type="text"
                  value={campaignAdminValues.CA_Billing_ID || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500"
                  placeholder="Valeur héritée de la campagne"
                />
              ) : (
                <input
                  type="text"
                  id="TC_Billing_ID"
                  name="TC_Billing_ID"
                  value={formData.TC_Billing_ID || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Numéro de facturation spécifique"
                />
              )}
            </div>

            {/* TC_PO */}
            <div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="inherit_po"
                  checked={useInheritedPO}
                  onChange={(e) => {
                    setUseInheritedPO(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="inherit_po" className="ml-3 text-sm text-gray-700">
                  Utiliser le même que la campagne
                </label>
              </div>
              
              <div className="flex items-center mb-2">
                <HelpIcon tooltip="Numéro de bon de commande pour cette tactique" />
                <label htmlFor="TC_PO" className="block text-sm font-medium text-gray-700 ml-3">
                  PO
                </label>
              </div>
              
              {useInheritedPO ? (
                <input
                  type="text"
                  value={campaignAdminValues.CA_PO || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500"
                  placeholder="Valeur héritée de la campagne"
                />
              ) : (
                <input
                  type="text"
                  id="TC_PO"
                  name="TC_PO"
                  value={formData.TC_PO || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="PO spécifique"
                />
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
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
        
        {/* Indicateur de chargement */}
        {loading && (
          <div className="mx-6 mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            Chargement des données...
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
        
        {/* Bandeau sticky pour tooltip */}
        {activeTooltip && (
          <div className="sticky bottom-16 mx-6 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg">
            <p className="text-sm">{activeTooltip}</p>
          </div>
        )}
        
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
    </FormDrawer>
  );
}