// app/components/Campaigns/CampaignDrawer.tsx

'use client';

import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  BanknotesIcon, 
  CogIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Campaign, CampaignFormData } from '../../types/campaign';
import { useClient } from '../../contexts/ClientContext';
import FormTabs, { FormTab } from '../Tactiques/FormTabs';
import { TooltipBanner } from '../Tactiques/TactiqueFormComponents';
import CampaignFormInfo from './CampaignFormInfo';
import CampaignFormDates from './CampaignFormDates';
import CampaignFormBudget from './CampaignFormBudget';
import CampaignFormAdmin from './CampaignFormAdmin';
import CampaignFormBreakdown from './CampaignFormBreakdown';
import {
  getClientList,
  ShortcodeItem,
  getClientInfo,
} from '../../lib/listService';

// ==================== TYPES ====================

interface CampaignDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  onSave: (campaign: CampaignFormData) => void;
}

interface ClientConfig {
  CA_Custom_Dim_1?: string;
  CA_Custom_Dim_2?: string;
  CA_Custom_Dim_3?: string;
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function CampaignDrawer({
  isOpen,
  onClose,
  campaign,
  onSave,
}: CampaignDrawerProps) {
  const { selectedClient } = useClient();

  // ==================== ÉTATS ====================
  
  // Navigation
  const [activeTab, setActiveTab] = useState('info');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Formulaire
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    status: 'Draft',
    quarter: 'Q1',
    year: new Date().getFullYear().toString(),
    startDate: '',
    endDate: '',
    budget: '',
    currency: 'CAD',
  });

  // Listes et configuration
  const [divisions, setDivisions] = useState<ShortcodeItem[]>([]);
  const [quarters, setQuarters] = useState<ShortcodeItem[]>([]);
  const [years, setYears] = useState<ShortcodeItem[]>([]);
  const [customDim1List, setCustomDim1List] = useState<ShortcodeItem[]>([]);
  const [customDim2List, setCustomDim2List] = useState<ShortcodeItem[]>([]);
  const [customDim3List, setCustomDim3List] = useState<ShortcodeItem[]>([]);
  const [clientConfig, setClientConfig] = useState<ClientConfig>({});

  // États de chargement
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingQuarters, setLoadingQuarters] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingCustomDims, setLoadingCustomDims] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==================== ONGLETS ====================
  
  const tabs: FormTab[] = useMemo(() => [
    { id: 'info', name: 'Informations', icon: DocumentTextIcon },
    { id: 'dates', name: 'Dates', icon: CalendarIcon },
    { id: 'budget', name: 'Budget', icon: BanknotesIcon },
    { id: 'breakdown', name: 'Planification', icon: ClockIcon },
    { id: 'admin', name: 'Administration', icon: CogIcon },
  ], []);

  // ==================== EFFECTS ====================
  
  // Initialiser le formulaire
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        division: campaign.division || '',
        status: campaign.status,
        quarter: campaign.quarter,
        year: campaign.year.toString(),
        customDim1: campaign.customDim1 || '',
        customDim2: campaign.customDim2 || '',
        customDim3: campaign.customDim3 || '',
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        sprintDates: campaign.sprintDates || '',
        budget: campaign.budget.toString(),
        currency: campaign.currency || 'CAD',
        customFee1: campaign.customFee1?.toString() || '',
        customFee2: campaign.customFee2?.toString() || '',
        customFee3: campaign.customFee3?.toString() || '',
        customFee4: campaign.customFee4?.toString() || '',
        customFee5: campaign.customFee5?.toString() || '',
        clientExtId: campaign.clientExtId || '',
        po: campaign.po || '',
        billingId: campaign.billingId || '',
        creativeFolder: campaign.creativeFolder || '',
      });
      setActiveTab('info');
    } else {
      setFormData({
        name: '',
        status: 'Draft',
        quarter: 'Q1',
        year: new Date().getFullYear().toString(),
        startDate: '',
        endDate: '',
        budget: '',
        currency: 'CAD',
      });
      setActiveTab('info');
    }
  }, [campaign]);

  // Charger les données client
  useEffect(() => {
    if (!selectedClient || !isOpen) return;
    loadAllData();
  }, [selectedClient, isOpen]);

  // ==================== GESTIONNAIRES ====================
  
  const loadAllData = async () => {
    if (!selectedClient) return;
    
    try {
      // Charger la configuration client
      const clientInfo = await getClientInfo(selectedClient.clientId);
      if (clientInfo) {
        setClientConfig({
          CA_Custom_Dim_1: clientInfo.CA_Custom_Dim_1 || undefined,
          CA_Custom_Dim_2: clientInfo.CA_Custom_Dim_2 || undefined,
          CA_Custom_Dim_3: clientInfo.CA_Custom_Dim_3 || undefined,
        });

        // Charger les dimensions personnalisées
        setLoadingCustomDims(true);
        const customDimPromises = [];
        
        if (clientInfo.CA_Custom_Dim_1) {
          customDimPromises.push(
            getClientList('CA_Custom_Dim_1', selectedClient.clientId)
              .catch(() => getClientList('CA_Custom_Dim_1', 'PlusCo'))
              .then(setCustomDim1List)
          );
        }
        
        if (clientInfo.CA_Custom_Dim_2) {
          customDimPromises.push(
            getClientList('CA_Custom_Dim_2', selectedClient.clientId)
              .catch(() => getClientList('CA_Custom_Dim_2', 'PlusCo'))
              .then(setCustomDim2List)
          );
        }
        
        if (clientInfo.CA_Custom_Dim_3) {
          customDimPromises.push(
            getClientList('CA_Custom_Dim_3', selectedClient.clientId)
              .catch(() => getClientList('CA_Custom_Dim_3', 'PlusCo'))
              .then(setCustomDim3List)
          );
        }
        
        await Promise.all(customDimPromises);
        setLoadingCustomDims(false);
      }

      // Charger les listes standard
      const standardPromises = [
        // Divisions
        setLoadingDivisions(true),
        getClientList('CA_Division', selectedClient.clientId)
          .catch(() => getClientList('CA_Division', 'PlusCo'))
          .then(setDivisions)
          .finally(() => setLoadingDivisions(false)),
        
        // Quarters
        setLoadingQuarters(true),
        getClientList('CA_Quarter', selectedClient.clientId)
          .catch(() => getClientList('CA_Quarter', 'PlusCo'))
          .then(setQuarters)
          .finally(() => setLoadingQuarters(false)),
        
        // Years
        setLoadingYears(true),
        getClientList('CA_Year', selectedClient.clientId)
          .catch(() => getClientList('CA_Year', 'PlusCo'))
          .then(setYears)
          .finally(() => setLoadingYears(false)),
      ];
      
      await Promise.all(standardPromises);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseFloat(value) || 0) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // ==================== RENDU DES ONGLETS ====================
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <CampaignFormInfo
            formData={formData}
            onChange={handleChange}
            onTooltipChange={setActiveTooltip}
            divisions={divisions}
            quarters={quarters}
            years={years}
            customDim1List={customDim1List}
            customDim2List={customDim2List}
            customDim3List={customDim3List}
            clientConfig={clientConfig}
            loadingDivisions={loadingDivisions}
            loadingQuarters={loadingQuarters}
            loadingYears={loadingYears}
            loadingCustomDims={loadingCustomDims}
            loading={loading}
          />
        );
      
      case 'dates':
        return (
          <CampaignFormDates
            formData={formData}
            onChange={handleChange}
            onTooltipChange={setActiveTooltip}
            loading={loading}
          />
        );
        
      case 'budget':
        return (
          <CampaignFormBudget
            formData={formData}
            onChange={handleChange}
            onTooltipChange={setActiveTooltip}
            loading={loading}
          />
        );
        
      case 'breakdown':
        return (
          <CampaignFormBreakdown
            clientId={selectedClient?.clientId || ''}
            campaignId={campaign?.id}
            campaignStartDate={formData.startDate}
            campaignEndDate={formData.endDate}
            onTooltipChange={setActiveTooltip}
            loading={loading}
          />
        );
        
      case 'admin':
        return (
          <CampaignFormAdmin
            formData={formData}
            onChange={handleChange}
            onTooltipChange={setActiveTooltip}
            loading={loading}
          />
        );
        
      default:
        return null;
    }
  };

  // ==================== RENDU PRINCIPAL ====================
  
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-[50vw]">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-indigo-600 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-medium text-white">
                          {campaign ? 'Modifier la campagne' : 'Nouvelle campagne'}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                            onClick={onClose}
                          >
                            <span className="sr-only">Fermer</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} className="h-full flex flex-col">
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
                      
                      {/* Footer avec boutons d'action */}
                      <div className="sticky bottom-0 bg-gray-50 px-6 py-4 sm:px-8 border-t border-gray-200">
                        <div className="flex justify-end space-x-4">
                          <button
                            type="button"
                            onClick={onClose}
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
                            {loading ? 'Enregistrement...' : (campaign ? 'Mettre à jour' : 'Créer')}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
        
        {/* Bandeau de tooltip */}
        <TooltipBanner tooltip={activeTooltip} />
      </Dialog>
    </Transition.Root>
  );
}