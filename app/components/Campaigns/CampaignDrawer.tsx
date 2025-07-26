/**
 * @file Ce fichier définit le composant CampaignDrawer, qui est une interface utilisateur sous forme de panneau latéral ("drawer").
 * Ce panneau est utilisé pour créer une nouvelle campagne ou pour modifier une campagne existante.
 * Il gère l'état du formulaire, charge les données nécessaires depuis Firebase (comme les listes pour les menus déroulants) et gère la soumission des données.
 */

'use client';

import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  DocumentTextIcon,
  CalendarIcon,
  BanknotesIcon,
  CogIcon,
  ClockIcon,
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
import { useAsyncTaxonomyUpdate } from '../../hooks/useAsyncTaxonomyUpdate';
import { useTranslation } from '../../contexts/LanguageContext';
import TaxonomyUpdateBanner from '../Others/TaxonomyUpdateBanner';

interface CampaignDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  onSave: (
    campaign: CampaignFormData,
    additionalBreakdowns?: BreakdownFormData[]
  ) => void;
}

interface ClientConfig {
  CA_Custom_Dim_1?: string;
  CA_Custom_Dim_2?: string;
  CA_Custom_Dim_3?: string;
  CL_Custom_Fee_1?: string;
  CL_Custom_Fee_2?: string;
  CL_Custom_Fee_3?: string;
}

/**
 * Affiche un panneau latéral (drawer) pour créer ou modifier une campagne.
 * Le composant gère les onglets de formulaire, la récupération des données de listes,
 * la validation et la soumission des données de campagne.
 * @param {CampaignDrawerProps} props - Les propriétés du composant.
 * @param {boolean} props.isOpen - Indique si le panneau est ouvert ou fermé.
 * @param {() => void} props.onClose - Fonction à appeler pour fermer le panneau.
 * @param {Campaign | null} [props.campaign] - Les données de la campagne à modifier. Si null, le formulaire est en mode création.
 * @param {(campaign: CampaignFormData, additionalBreakdowns?: BreakdownFormData[]) => void} props.onSave - Fonction à appeler lors de la sauvegarde de la campagne.
 * @returns {JSX.Element} Le composant du panneau latéral de la campagne.
 */
export default function CampaignDrawer({
  isOpen,
  onClose,
  campaign,
  onSave,
}: CampaignDrawerProps) {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const { status, updateTaxonomiesAsync, dismissNotification } =
    useAsyncTaxonomyUpdate();

  const [activeTab, setActiveTab] = useState('info');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [formData, setFormData] = useState<CampaignFormData>({
    CA_Name: '',
    CA_Campaign_Identifier: '',
    CA_Status: 'Draft',
    CA_Quarter: '',
    CA_Year: '',
    CA_Start_Date: '',
    CA_End_Date: '',
    CA_Sprint_Dates: '',
    CA_Budget: '',
    CA_Currency: 'CAD',
  });

  const [additionalBreakdowns, setAdditionalBreakdowns] = useState<
    BreakdownFormData[]
  >([]);
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

  const tabs: FormTab[] = useMemo(
    () => [
      { id: 'info', name: t('campaigns.drawer.tabs.info'), icon: DocumentTextIcon },
      { id: 'dates', name: t('campaigns.drawer.tabs.dates'), icon: CalendarIcon },
      { id: 'budget', name: t('campaigns.drawer.tabs.budget'), icon: BanknotesIcon },
      { id: 'breakdown', name: t('campaigns.drawer.tabs.breakdown'), icon: ClockIcon },
      { id: 'admin', name: t('campaigns.drawer.tabs.admin'), icon: CogIcon },
    ],
    [t]
  );

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
        CA_Quarter: '',
        CA_Year: '',
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

  useEffect(() => {
    const { CA_Start_Date, CA_End_Date } = formData;

    if (CA_Start_Date && CA_End_Date) {
      const startDate = new Date(CA_Start_Date);
      const endDate = new Date(CA_End_Date);

      if (
        !isNaN(startDate.getTime()) &&
        !isNaN(endDate.getTime()) &&
        startDate <= endDate
      ) {
        const formatSprintDate = (date: Date): string => {
          const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
          ];
          const month = monthNames[date.getUTCMonth()];
          const year = date.getUTCFullYear();
          return `${month}${year}`;
        };

        const formattedSprintDates = `${formatSprintDate(
          startDate
        )}-${formatSprintDate(endDate)}`;

        if (formattedSprintDates !== formData.CA_Sprint_Dates) {
          setFormData((prev) => ({
            ...prev,
            CA_Sprint_Dates: formattedSprintDates,
          }));
        }
      }
    }
  }, [formData.CA_Start_Date, formData.CA_End_Date, formData.CA_Sprint_Dates]);

  useEffect(() => {
    if (!selectedClient || !isOpen) return;
    loadAllData();
  }, [selectedClient, isOpen]);

  /**
   * Charge toutes les données nécessaires pour les listes déroulantes du formulaire de campagne.
   * Récupère les informations du client, les dimensions personnalisées, les divisions,
   * les trimestres et les années depuis Firebase.
   */
  const loadAllData = async () => {
    if (!selectedClient) return;
    setLoading(true);
    try {
      console.log(`FIREBASE: LECTURE - Fichier: CampaignDrawer.tsx - Fonction: loadAllData - Path: clients/${selectedClient.clientId}`);
      const clientInfo = await getClientInfo(selectedClient.clientId);
      if (clientInfo) {
        setClientConfig({
          CA_Custom_Dim_1: clientInfo.Custom_Dim_CA_1 || undefined,
          CA_Custom_Dim_2: clientInfo.Custom_Dim_CA_2 || undefined,
          CA_Custom_Dim_3: clientInfo.Custom_Dim_CA_3 || undefined,
          CL_Custom_Fee_1: clientInfo.CL_Custom_Fee_1 || undefined,
          CL_Custom_Fee_2: clientInfo.CL_Custom_Fee_2 || undefined,
          CL_Custom_Fee_3: clientInfo.CL_Custom_Fee_3 || undefined,
        });
        setLoadingCustomDims(true);
        const customDimPromises = [
          clientInfo.Custom_Dim_CA_1
            ? (console.log(`FIREBASE: LECTURE - Fichier: CampaignDrawer.tsx - Fonction: loadAllData - Path: list/CA_Custom_Dim_1/${selectedClient.clientId} or list/CA_Custom_Dim_1/PlusCo`),
              getClientList('CA_Custom_Dim_1', selectedClient.clientId)
                .catch(() => getClientList('CA_Custom_Dim_1', 'PlusCo'))
                .then(setCustomDim1List))
            : Promise.resolve(),
          clientInfo.Custom_Dim_CA_2
            ? (console.log(`FIREBASE: LECTURE - Fichier: CampaignDrawer.tsx - Fonction: loadAllData - Path: list/CA_Custom_Dim_2/${selectedClient.clientId} or list/CA_Custom_Dim_2/PlusCo`),
              getClientList('CA_Custom_Dim_2', selectedClient.clientId)
                .catch(() => getClientList('CA_Custom_Dim_2', 'PlusCo'))
                .then(setCustomDim2List))
            : Promise.resolve(),
          clientInfo.Custom_Dim_CA_3
            ? (console.log(`FIREBASE: LECTURE - Fichier: CampaignDrawer.tsx - Fonction: loadAllData - Path: list/CA_Custom_Dim_3/${selectedClient.clientId} or list/CA_Custom_Dim_3/PlusCo`),
              getClientList('CA_Custom_Dim_3', selectedClient.clientId)
                .catch(() => getClientList('CA_Custom_Dim_3', 'PlusCo'))
                .then(setCustomDim3List))
            : Promise.resolve(),
        ];
        await Promise.all(customDimPromises);
        setLoadingCustomDims(false);
      }
      setLoadingDivisions(true);
      console.log(`FIREBASE: LECTURE - Fichier: CampaignDrawer.tsx - Fonction: loadAllData - Path: list/CA_Division/${selectedClient.clientId} (fallback: PlusCo)`);
      getClientList('CA_Division', selectedClient.clientId)
        .catch(() => getClientList('CA_Division', 'PlusCo'))
        .then(setDivisions)
        .finally(() => setLoadingDivisions(false));
      setLoadingQuarters(true);
      console.log(`FIREBASE: LECTURE - Fichier: CampaignDrawer.tsx - Fonction: loadAllData - Path: list/CA_Quarter/${selectedClient.clientId} (fallback: PlusCo)`);
      getClientList('CA_Quarter', selectedClient.clientId)
        .catch(() => getClientList('CA_Quarter', 'PlusCo'))
        .then(setQuarters)
        .finally(() => setLoadingQuarters(false));
      setLoadingYears(true);
      console.log(`FIREBASE: LECTURE - Fichier: CampaignDrawer.tsx - Fonction: loadAllData - Path: list/CA_Year/${selectedClient.clientId} (fallback: PlusCo)`);
      getClientList('CA_Year', selectedClient.clientId)
        .catch(() => getClientList('CA_Year', 'PlusCo'))
        .then(setYears)
        .finally(() => setLoadingYears(false));
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère les changements de valeur des champs du formulaire et met à jour l'état `formData`.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e - L'événement de changement.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Gère la soumission du formulaire. Appelle la fonction `onSave` passée en props,
   * ferme le panneau, et déclenche une mise à jour des taxonomies en arrière-plan si nécessaire.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData, campaign ? undefined : additionalBreakdowns);
      onClose();

      if (campaign && campaign.id && selectedClient) {
        console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignDrawer.tsx - Fonction: handleSubmit - Path: taxonomies/campaigns/${campaign.id}`);
        updateTaxonomiesAsync('campaign', {
          id: campaign.id,
          name: formData.CA_Name,
          clientId: selectedClient.clientId,
        }).catch((error) => {
          console.error('Erreur mise à jour taxonomies:', error);
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour l'état des répartitions budgétaires supplémentaires (breakdowns)
   * qui sont créées en même temps qu'une nouvelle campagne.
   * @param {BreakdownFormData[]} breakdowns - Le tableau des nouvelles répartitions.
   */
  const handleBreakdownsChange = (breakdowns: BreakdownFormData[]) => {
    setAdditionalBreakdowns(breakdowns);
  };

  /**
   * Affiche le contenu de l'onglet actif dans le formulaire.
   * @returns {JSX.Element | null} Le composant de formulaire pour l'onglet actuellement sélectionné.
   */
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
            clientConfig={clientConfig}
            loading={loading}
          />
        );
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

  return (
    <>
      <TaxonomyUpdateBanner
        status={status}
        onDismiss={dismissNotification}
      />
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
                      <div className="sticky top-0 z-10 bg-indigo-600 px-4 py-6 sm:px-6">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-medium text-white">
                            {campaign ? t('campaigns.drawer.editTitle') : t('campaigns.drawer.createTitle')}
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                              onClick={onClose}
                            >
                              <span className="sr-only">{t('campaigns.drawer.closeSr')}</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <form
                        onSubmit={handleSubmit}
                        className="h-full flex flex-col"
                      >
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
                              onClick={onClose}
                              disabled={loading}
                              className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                              {loading
                                ? t('campaigns.drawer.buttons.saving')
                                : campaign
                                ? t('common.update')
                                : t('common.create')}
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
          <TooltipBanner tooltip={activeTooltip} />
        </Dialog>
      </Transition.Root>
    </>
  );
}