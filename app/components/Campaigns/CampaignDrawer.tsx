// app/components/Campaigns/CampaignDrawer.tsx - AVEC VALIDATION OBLIGATOIRE DES DATES

/**
 * @file Ce fichier définit le composant CampaignDrawer avec validation obligatoire des champs critiques.
 * NOUVELLE FONCTIONNALITÉ : Validation programmatique qui empêche la sauvegarde si les dates
 * de début et de fin ne sont pas remplies, avec navigation automatique vers l'onglet concerné.
 * CORRIGÉ : Boucle infinie dans le useEffect de CA_Sprint_Dates
 */

'use client';

import { Fragment, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { getClientInfo } from '../../lib/listService';
import { useAsyncTaxonomyUpdate } from '../../hooks/useAsyncTaxonomyUpdate';
import { useTranslation } from '../../contexts/LanguageContext';
import TaxonomyUpdateBanner from '../Others/TaxonomyUpdateBanner';

// Import du système de cache
import { getListForClient } from '../../lib/cacheService';
import { ShortcodeItem } from '../../lib/listService';

// Fonction utilitaire pour vérifier l'existence d'une liste depuis le cache
const hasCachedList = (fieldId: string, clientId: string): boolean => {
  try {
    const cachedList = getListForClient(fieldId, clientId);
    return cachedList !== null && cachedList.length > 0;
  } catch (error) {
    console.error(`[CACHE] Erreur vérification ${fieldId}:`, error);
    return false;
  }
};

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

// NOUVEAU : Interface pour les erreurs de validation
interface ValidationErrors {
  [fieldName: string]: string;
}

export default function CampaignDrawer({
  isOpen,
  onClose,
  campaign,
  onSave,
}: CampaignDrawerProps) {
  const { t, language } = useTranslation(); // MODIFIÉ : Ajout de language pour debug
  const { selectedClient } = useClient();
  const { status, updateTaxonomiesAsync, dismissNotification } =
    useAsyncTaxonomyUpdate();

  const [activeTab, setActiveTab] = useState('info');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // NOUVEAU : État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showValidationError, setShowValidationError] = useState(false);

  // États pour les listes dynamiques
  const [dynamicLists, setDynamicLists] = useState<{ [key: string]: ShortcodeItem[] }>({});
  const [visibleFields, setVisibleFields] = useState<{ [key: string]: boolean }>({});

  // Liste des champs dynamiques possibles pour les campagnes
  const dynamicListFields = useMemo(() => [
    'CA_Division',
    'CA_Quarter', 
    'CA_Year',
    'CA_Custom_Dim_1',
    'CA_Custom_Dim_2', 
    'CA_Custom_Dim_3'
  ], []);

  // NOUVEAU : Définition des champs obligatoires avec leurs onglets
  const REQUIRED_FIELDS = useMemo(() => [
    { 
      field: 'CA_Start_Date', 
      label: t('campaigns.formDates.startDateLabel'),
      tab: 'dates',
      tabLabel: t('campaigns.drawer.tabs.dates')
    },
    { 
      field: 'CA_End_Date', 
      label: t('campaigns.formDates.endDateLabel'),
      tab: 'dates',
      tabLabel: t('campaigns.drawer.tabs.dates')
    }
  ], [t]);

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

  // NOUVEAU : Ref pour éviter la boucle infinie dans le calcul de CA_Sprint_Dates
  const lastSprintDatesRef = useRef<string>('');

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

  // NOUVEAU : Fonction de validation des champs obligatoires
  const validateRequiredFields = useCallback((): { isValid: boolean; errors: ValidationErrors; firstErrorTab: string | null } => {
    const errors: ValidationErrors = {};
    let firstErrorTab: string | null = null;

    REQUIRED_FIELDS.forEach(({ field, label, tab }) => {
      const value = formData[field as keyof CampaignFormData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = `${label}`;
        if (!firstErrorTab) {
          firstErrorTab = tab;
        }
      }
    });

    // Validation supplémentaire : la date de fin doit être après la date de début
    if (formData.CA_Start_Date && formData.CA_End_Date) {
      const startDate = new Date(formData.CA_Start_Date);
      const endDate = new Date(formData.CA_End_Date);
      
      if (endDate <= startDate) {
        errors.CA_End_Date = t('campaigns.formDates.validationError');
        if (!firstErrorTab) {
          firstErrorTab = 'dates';
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      firstErrorTab
    };
  }, [formData, REQUIRED_FIELDS, t]);

  useEffect(() => {
    if (campaign) {
      setFormData({
        CA_Name: campaign.CA_Name || '',
        CA_Campaign_Identifier: campaign.CA_Campaign_Identifier || '',
        CA_Division: campaign.CA_Division || '',
        CA_Status: campaign.CA_Status,
        CA_Quarter: campaign.CA_Quarter,
        CA_Year: campaign.CA_Year,
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
      // NOUVEAU : Réinitialiser les erreurs de validation
      setValidationErrors({});
      setShowValidationError(false);
      // NOUVEAU : Réinitialiser la ref
      lastSprintDatesRef.current = campaign.CA_Sprint_Dates || '';
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
      // NOUVEAU : Réinitialiser les erreurs de validation
      setValidationErrors({});
      setShowValidationError(false);
      // NOUVEAU : Réinitialiser la ref
      lastSprintDatesRef.current = '';
    }
  }, [campaign]);

  useEffect(() => {
    // Réinitialiser l'onglet et le tooltip quand le drawer s'ouvre
    if (isOpen) {
      setActiveTab('info');
      setActiveTooltip(null);
      // NOUVEAU : Réinitialiser les erreurs de validation
      setValidationErrors({});
      setShowValidationError(false);
      
      // Si pas de campagne (mode création), réinitialiser les données
      if (!campaign) {
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
        setAdditionalBreakdowns([]);
        // NOUVEAU : Réinitialiser la ref
        lastSprintDatesRef.current = '';
      }
    }
  }, [isOpen, campaign]);

  // CORRIGÉ : useEffect pour CA_Sprint_Dates sans dépendance circulaire
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

        // CORRIGÉ : Ne mettre à jour que si la valeur a réellement changé
        if (formattedSprintDates !== lastSprintDatesRef.current) {
          lastSprintDatesRef.current = formattedSprintDates;
          setFormData((prev) => ({
            ...prev,
            CA_Sprint_Dates: formattedSprintDates,
          }));
        }
      }
    }
  }, [formData.CA_Start_Date, formData.CA_End_Date]); // CORRIGÉ : Supprimer formData.CA_Sprint_Dates des dépendances

  useEffect(() => {
    if (!selectedClient || !isOpen) return;
    loadAllData();
  }, [selectedClient, isOpen]);

  /**
   * Charge toutes les données nécessaires depuis le cache au lieu de Firebase.
   */
  const loadAllData = useCallback(async () => {
    if (!selectedClient) return;
    setLoading(true);
    
    try {
      console.log(`[CACHE] 🚀 Début chargement optimisé CampaignDrawer`);
      
      // 1. Charger la configuration client
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
      }

      // 2. Vérifier et charger toutes les listes depuis le cache
      const newVisibleFields: { [key: string]: boolean } = {};
      const newDynamicLists: { [key: string]: ShortcodeItem[] } = {};

      for (const field of dynamicListFields) {
        const hasListResult = hasCachedList(field, selectedClient.clientId);
        newVisibleFields[field] = hasListResult;

        if (hasListResult) {
          const cachedList = getListForClient(field, selectedClient.clientId);
          
          if (cachedList && cachedList.length > 0) {
            newDynamicLists[field] = cachedList.map(item => ({
              id: item.id,
              SH_Code: item.SH_Code,
              SH_Display_Name_FR: item.SH_Display_Name_FR,
              SH_Display_Name_EN: item.SH_Display_Name_EN ?? '',
              SH_Default_UTM: item.SH_Default_UTM,
              SH_Logo: item.SH_Logo,
              SH_Type: item.SH_Type,
              SH_Tags: item.SH_Tags
            }));
            
            console.log(`[CACHE] ✅ ${field} chargé depuis cache (${cachedList.length} éléments)`);
          }
        }
      }

      setVisibleFields(newVisibleFields);
      setDynamicLists(newDynamicLists);

      // 3. Attribuer les listes aux états spécifiques pour compatibilité
      setLoadingDivisions(true);
      setDivisions(newDynamicLists['CA_Division'] || []);
      setLoadingDivisions(false);

      setLoadingQuarters(true);
      setQuarters(newDynamicLists['CA_Quarter'] || []);
      setLoadingQuarters(false);

      setLoadingYears(true);
      setYears(newDynamicLists['CA_Year'] || []);
      setLoadingYears(false);

      setLoadingCustomDims(true);
      setCustomDim1List(newDynamicLists['CA_Custom_Dim_1'] || []);
      setCustomDim2List(newDynamicLists['CA_Custom_Dim_2'] || []);
      setCustomDim3List(newDynamicLists['CA_Custom_Dim_3'] || []);
      setLoadingCustomDims(false);

      console.log(`[CACHE] ✅ Chargement optimisé CampaignDrawer terminé`);
      
    } catch (error) {
      console.error('[CACHE] Erreur lors du chargement des données:', error);
      
      // Réinitialiser les états en cas d'erreur
      setDivisions([]);
      setQuarters([]);
      setYears([]);
      setCustomDim1List([]);
      setCustomDim2List([]);
      setCustomDim3List([]);
      setLoadingDivisions(false);
      setLoadingQuarters(false);
      setLoadingYears(false);
      setLoadingCustomDims(false);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, dynamicListFields]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // NOUVEAU : Effacer l'erreur de validation pour ce champ quand l'utilisateur le modifie
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });

      // Si c'était le dernier champ en erreur, cacher le message d'erreur globale
      if (Object.keys(validationErrors).length === 1) {
        setShowValidationError(false);
      }
    }
  };

  /**
   * MODIFIÉ : Gère la soumission du formulaire avec validation obligatoire et log de debug.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // NOUVEAU : Log de debug pour vérifier la langue
    console.log(`🌍 [CampaignDrawer] Langue actuelle: ${language}`);
    console.log(`🌍 [CampaignDrawer] Mode: ${campaign ? 'Édition' : 'Création'}`);
    
    // NOUVEAU : Validation avant sauvegarde
    const validation = validateRequiredFields();
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setShowValidationError(true);
      
      // Naviguer automatiquement vers l'onglet contenant le premier champ en erreur
      if (validation.firstErrorTab) {
        setActiveTab(validation.firstErrorTab);
      }
      
      return; // Empêcher la sauvegarde
    }

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

  const handleBreakdownsChange = (breakdowns: BreakdownFormData[]) => {
    setAdditionalBreakdowns(breakdowns);
  };

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

                      {/* NOUVEAU : Banner d'erreur de validation */}
                      {showValidationError && Object.keys(validationErrors).length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
                          <div className="flex">
                            <div className="ml-3">
                              <div className="mt-2 text-sm text-red-700">
                                <ul className="list-disc list-inside space-y-1">
                                  {Object.entries(validationErrors).map(([field, error]) => (
                                    <li key={field}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

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