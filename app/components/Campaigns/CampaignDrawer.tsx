// app/components/Campaigns/CampaignDrawer.tsx

'use client';

import { Fragment, useState, useEffect, useMemo, useCallback } from 'react';
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
import { BreakdownFormData } from '../../types/breakdown';
import { useClient } from '../../contexts/ClientContext';
import FormTabs, { FormTab } from '../Tactiques/FormTabs';
import { TooltipBanner } from '../Tactiques/Tactiques/TactiqueFormComponents';
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

interface CampaignDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  onSave: (campaign: CampaignFormData, additionalBreakdowns?: BreakdownFormData[]) => void;
}

interface ClientConfig {
  CA_Custom_Dim_1?: string;
  CA_Custom_Dim_2?: string;
  CA_Custom_Dim_3?: string;
}

export default function CampaignDrawer({
  isOpen,
  onClose,
  campaign,
  onSave,
}: CampaignDrawerProps) {
  const { selectedClient } = useClient();

  const [activeTab, setActiveTab] = useState('info');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [formData, setFormData] = useState<CampaignFormData>({
    CA_Name: '',
    CA_Campaign_Identifier: '',
    CA_Status: 'Draft',
    CA_Quarter: 'Q1',
    CA_Year: new Date().getFullYear().toString(),
    CA_Start_Date: '',
    CA_End_Date: '',
    CA_Sprint_Dates: '',
    CA_Budget: '',
    CA_Currency: 'CAD',
  });

  const [additionalBreakdowns, setAdditionalBreakdowns] = useState<BreakdownFormData[]>([]);
  const [divisions, setDivisions] = useState<ShortcodeItem[]>([]);
  const [quarters, setQuarters] = useState<ShortcodeItem[]>([]);
  const [years, setYears] = useState<ShortcodeItem[]>([]);
  const [customDim1List, setCustomDim1List] = useState<ShortcodeItem[]>([]);
  const [customDim2List, setCustomDim2List] = useState<ShortcodeItem[]>([]);
  const [customDim3List, setCustomDim3List] = useState<ShortcodeItem[]>([]);
  const [clientConfig, setClientConfig] = useState<ClientConfig>({});
  const [loading, setLoading] = useState(false);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingQuarters, setLoadingQuarters] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingCustomDims, setLoadingCustomDims] = useState(false);

  const tabs: FormTab[] = useMemo(() => [
    { id: 'info', name: 'Informations', icon: DocumentTextIcon },
    { id: 'dates', name: 'Dates', icon: CalendarIcon },
    { id: 'budget', name: 'Budget', icon: BanknotesIcon },
    { id: 'breakdown', name: 'Répartition', icon: ClockIcon },
    { id: 'admin', name: 'Administration', icon: CogIcon },
  ], []);

  useEffect(() => {
    if (campaign) {
      setFormData({
        CA_Name: campaign.CA_Name || '',
        CA_Campaign_Identifier: campaign.CA_Campaign_Identifier || '',
        CA_Division: campaign.CA_Division || '',
        CA_Status: campaign.CA_Status,
        CA_Quarter: campaign.CA_Quarter,
        CA_Year: campaign.CA_Year.toString(),
        CA_Custom_Dim_1: campaign.CA_Custom_Dim_1 || '',
        CA_Custom_Dim_2: campaign.CA_Custom_Dim_2 || '',
        CA_Custom_Dim_3: campaign.CA_Custom_Dim_3 || '',
        CA_Start_Date: campaign.CA_Start_Date,
        CA_End_Date: campaign.CA_End_Date,
        CA_Sprint_Dates: campaign.CA_Sprint_Dates || '',
        CA_Budget: campaign.CA_Budget.toString(),
        CA_Currency: campaign.CA_Currency || 'CAD',
        CA_Custom_Fee_1: campaign.CA_Custom_Fee_1?.toString() || '',
        CA_Custom_Fee_2: campaign.CA_Custom_Fee_2?.toString() || '',
        CA_Custom_Fee_3: campaign.CA_Custom_Fee_3?.toString() || '',
        CA_Client_Ext_Id: campaign.CA_Client_Ext_Id || '',
        CA_PO: campaign.CA_PO || '',
        CA_Billing_ID: campaign.CA_Billing_ID || '',
        CA_Creative_Folder: campaign.CA_Creative_Folder || '',
      });
      setActiveTab('info');
      setAdditionalBreakdowns([]);
    } else {
      setFormData({
        CA_Name: '',
        CA_Campaign_Identifier: '',
        CA_Status: 'Draft',
        CA_Quarter: 'Q1',
        CA_Year: new Date().getFullYear().toString(),
        CA_Start_Date: '',
        CA_End_Date: '',
        CA_Sprint_Dates: '',
        CA_Budget: '',
        CA_Currency: 'CAD',
      });
      setActiveTab('info');
      setAdditionalBreakdowns([]);
    }
  }, [campaign]);
  
  // 🔥 NOUVEAU: useEffect pour mettre à jour CA_Sprint_Dates automatiquement
  useEffect(() => {
    const { CA_Start_Date, CA_End_Date } = formData;

    if (CA_Start_Date && CA_End_Date) {
      const startDate = new Date(CA_Start_Date);
      const endDate = new Date(CA_End_Date);

      // Vérifier si les dates sont valides
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate) {
        const formatSprintDate = (date: Date): string => {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const month = monthNames[date.getUTCMonth()]; // Utiliser getUTCMonth pour éviter les pbs de fuseau horaire
          const year = date.getUTCFullYear();
          return `${month}${year}`;
        };

        const formattedSprintDates = `${formatSprintDate(startDate)}-${formatSprintDate(endDate)}`;
        
        // Mettre à jour le formulaire seulement si la valeur a changé
        if (formattedSprintDates !== formData.CA_Sprint_Dates) {
          setFormData(prev => ({
            ...prev,
            CA_Sprint_Dates: formattedSprintDates
          }));
        }
      }
    }
  }, [formData.CA_Start_Date, formData.CA_End_Date]);

  useEffect(() => {
    if (!selectedClient || !isOpen) return;
    loadAllData();
  }, [selectedClient, isOpen]);

  const loadAllData = async () => {
    if (!selectedClient) return;
    setLoading(true);
    try {
      const clientInfo = await getClientInfo(selectedClient.clientId);
      if (clientInfo) {
        setClientConfig({
          CA_Custom_Dim_1: clientInfo.CA_Custom_Dim_1 || undefined,
          CA_Custom_Dim_2: clientInfo.CA_Custom_Dim_2 || undefined,
          CA_Custom_Dim_3: clientInfo.CA_Custom_Dim_3 || undefined,
        });
        setLoadingCustomDims(true);
        const customDimPromises = [
          clientInfo.CA_Custom_Dim_1 ? getClientList('CA_Custom_Dim_1', selectedClient.clientId).catch(() => getClientList('CA_Custom_Dim_1', 'PlusCo')).then(setCustomDim1List) : Promise.resolve(),
          clientInfo.CA_Custom_Dim_2 ? getClientList('CA_Custom_Dim_2', selectedClient.clientId).catch(() => getClientList('CA_Custom_Dim_2', 'PlusCo')).then(setCustomDim2List) : Promise.resolve(),
          clientInfo.CA_Custom_Dim_3 ? getClientList('CA_Custom_Dim_3', selectedClient.clientId).catch(() => getClientList('CA_Custom_Dim_3', 'PlusCo')).then(setCustomDim3List) : Promise.resolve(),
        ];
        await Promise.all(customDimPromises);
        setLoadingCustomDims(false);
      }
      setLoadingDivisions(true);
      getClientList('CA_Division', selectedClient.clientId).catch(() => getClientList('CA_Division', 'PlusCo')).then(setDivisions).finally(() => setLoadingDivisions(false));
      setLoadingQuarters(true);
      getClientList('CA_Quarter', selectedClient.clientId).catch(() => getClientList('CA_Quarter', 'PlusCo')).then(setQuarters).finally(() => setLoadingQuarters(false));
      setLoadingYears(true);
      getClientList('CA_Year', selectedClient.clientId).catch(() => getClientList('CA_Year', 'PlusCo')).then(setYears).finally(() => setLoadingYears(false));
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, campaign ? undefined : additionalBreakdowns);
    onClose();
  };

  const handleBreakdownsChange = (breakdowns: BreakdownFormData[]) => {
    setAdditionalBreakdowns(breakdowns);
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <CampaignFormInfo
            formData={formData} onChange={handleChange} onTooltipChange={setActiveTooltip}
            divisions={divisions} quarters={quarters} years={years}
            customDim1List={customDim1List} customDim2List={customDim2List} customDim3List={customDim3List}
            clientConfig={clientConfig}
            loadingDivisions={loadingDivisions} loadingQuarters={loadingQuarters}
            loadingYears={loadingYears} loadingCustomDims={loadingCustomDims} loading={loading}
          />);
      case 'dates':
        return <CampaignFormDates formData={formData} onChange={handleChange} onTooltipChange={setActiveTooltip} loading={loading} />;
      case 'budget':
        return <CampaignFormBudget formData={formData} onChange={handleChange} onTooltipChange={setActiveTooltip} loading={loading} />;
      case 'breakdown':
        return (
          <CampaignFormBreakdown
            clientId={selectedClient?.clientId || ''}
            campaignId={campaign?.id}
            campaignStartDate={formData.CA_Start_Date}
            campaignEndDate={formData.CA_End_Date}
            onTooltipChange={setActiveTooltip}
            onBreakdownsChange={handleBreakdownsChange}
            loading={loading}
          />);
      case 'admin':
        return <CampaignFormAdmin formData={formData} onChange={handleChange} onTooltipChange={setActiveTooltip} loading={loading} />;
      default:
        return null;
    }
  };
  
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-in-out duration-500" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-500" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-500 sm:duration-700" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-500 sm:duration-700" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                <Dialog.Panel className="pointer-events-auto w-[50vw]">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="sticky top-0 z-10 bg-indigo-600 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-medium text-white">{campaign ? 'Modifier la campagne' : 'Nouvelle campagne'}</Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button type="button" className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white" onClick={onClose}>
                            <span className="sr-only">Fermer</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <form onSubmit={handleSubmit} className="h-full flex flex-col">
                      <FormTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                      <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>
                      <div className="sticky bottom-0 bg-gray-50 px-6 py-4 sm:px-8 border-t border-gray-200">
                        <div className="flex justify-end space-x-4">
                          <button type="button" onClick={onClose} disabled={loading} className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">Annuler</button>
                          <button type="submit" disabled={loading} className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">{loading ? 'Enregistrement...' : (campaign ? 'Mettre à jour' : 'Créer')}</button>
                        </div>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
        <TooltipBanner tooltip={activeTooltip} />
      </Dialog>
    </Transition.Root>
  );
}