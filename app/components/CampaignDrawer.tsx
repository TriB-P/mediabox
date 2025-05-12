'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { Campaign, CampaignFormData } from '../types/campaign';
import {
  getClientList,
  ShortcodeItem,
  getClientInfo,
} from '../lib/listService';
import { useClient } from '../contexts/ClientContext';

interface CampaignDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  onSave: (campaign: CampaignFormData) => void;
}

export default function CampaignDrawer({
  isOpen,
  onClose,
  campaign,
  onSave,
}: CampaignDrawerProps) {
  const { selectedClient } = useClient();

  // État pour les sections ouvertes/fermées
  const [openSections, setOpenSections] = useState({
    info: true,
    dates: true,
    budget: true,
    admin: true,
  });

  // État pour les listes de valeurs
  const [divisions, setDivisions] = useState<ShortcodeItem[]>([]);
  const [quarters, setQuarters] = useState<ShortcodeItem[]>([]);
  const [years, setYears] = useState<ShortcodeItem[]>([]);
  const [customDim1List, setCustomDim1List] = useState<ShortcodeItem[]>([]);
  const [customDim2List, setCustomDim2List] = useState<ShortcodeItem[]>([]);
  const [customDim3List, setCustomDim3List] = useState<ShortcodeItem[]>([]);

  // État pour les configurations clients
  const [clientConfig, setClientConfig] = useState<{
    CA_Custom_Dim_1?: string;
    CA_Custom_Dim_2?: string;
    CA_Custom_Dim_3?: string;
  }>({});

  // États de chargement
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingQuarters, setLoadingQuarters] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingCustomDims, setLoadingCustomDims] = useState(false);

  // État initial du formulaire
  const initialFormData: CampaignFormData = {
    // Info
    name: '',
    campaignId: '',
    division: '',
    quarter: 'Q1',
    year: new Date().getFullYear().toString(),
    customDim1: '',
    customDim2: '',
    customDim3: '',

    // Dates
    startDate: '',
    endDate: '',

    // Budget
    budget: '',
    currency: 'CAD',
    customFee1: '',
    customFee2: '',
    customFee3: '',
    customFee4: '',
    customFee5: '',

    // Admin
    clientExtId: '',
    po: '',
    billingId: '',
  };

  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);

  // Remplir le formulaire si on édite une campagne existante
  useEffect(() => {
    if (campaign) {
      setFormData({
        // Info
        name: campaign.name,
        campaignId: campaign.campaignId || '',
        division: campaign.division || '',
        quarter: campaign.quarter,
        year: campaign.year.toString(),
        customDim1: campaign.customDim1 || '',
        customDim2: campaign.customDim2 || '',
        customDim3: campaign.customDim3 || '',

        // Dates
        startDate: campaign.startDate,
        endDate: campaign.endDate,

        // Budget
        budget: campaign.budget.toString(),
        currency: campaign.currency || 'CAD',
        customFee1: campaign.customFee1?.toString() || '',
        customFee2: campaign.customFee2?.toString() || '',
        customFee3: campaign.customFee3?.toString() || '',
        customFee4: campaign.customFee4?.toString() || '',
        customFee5: campaign.customFee5?.toString() || '',

        // Admin
        clientExtId: campaign.clientExtId || '',
        po: campaign.po || '',
        billingId: campaign.billingId || '',
      });
    } else {
      setFormData(initialFormData);
    }
  }, [campaign]);

  // Charger les informations du client
  useEffect(() => {
    async function loadClientInfo() {
      if (!selectedClient || !isOpen) return;

      try {
        const clientInfo = await getClientInfo(selectedClient.clientId);
        if (clientInfo) {
          // Stocker les VALEURS des propriétés pour l'affichage des labels
          setClientConfig({
            CA_Custom_Dim_1: clientInfo.CA_Custom_Dim_1 || undefined,
            CA_Custom_Dim_2: clientInfo.CA_Custom_Dim_2 || undefined,
            CA_Custom_Dim_3: clientInfo.CA_Custom_Dim_3 || undefined,
          });

          // Charger les listes de dimensions personnalisées si elles existent
          setLoadingCustomDims(true);

          // MODIFICATION CRUCIALE: Utiliser les noms littéraux des dimensions
          // au lieu des valeurs des propriétés pour les chemins Firestore
          if (clientInfo.CA_Custom_Dim_1) {
            try {
              // Utiliser "CA_Custom_Dim_1" comme nom de liste, pas sa valeur
              const dim1List = await getClientList(
                'CA_Custom_Dim_1',
                selectedClient.clientId
              );
              if (dim1List.length === 0) {
                const fallbackList = await getClientList(
                  'CA_Custom_Dim_1',
                  'PlusCo'
                );
                setCustomDim1List(fallbackList);
              } else {
                setCustomDim1List(dim1List);
              }
            } catch (error) {
              console.error(
                `Erreur lors du chargement de la liste CA_Custom_Dim_1:`,
                error
              );
            }
          }

          if (clientInfo.CA_Custom_Dim_2) {
            try {
              // Utiliser "CA_Custom_Dim_2" comme nom de liste, pas sa valeur
              const dim2List = await getClientList(
                'CA_Custom_Dim_2',
                selectedClient.clientId
              );
              if (dim2List.length === 0) {
                const fallbackList = await getClientList(
                  'CA_Custom_Dim_2',
                  'PlusCo'
                );
                setCustomDim2List(fallbackList);
              } else {
                setCustomDim2List(dim2List);
              }
            } catch (error) {
              console.error(
                `Erreur lors du chargement de la liste CA_Custom_Dim_2:`,
                error
              );
            }
          }

          if (clientInfo.CA_Custom_Dim_3) {
            try {
              // Utiliser "CA_Custom_Dim_3" comme nom de liste, pas sa valeur
              const dim3List = await getClientList(
                'CA_Custom_Dim_3',
                selectedClient.clientId
              );
              if (dim3List.length === 0) {
                const fallbackList = await getClientList(
                  'CA_Custom_Dim_3',
                  'PlusCo'
                );
                setCustomDim3List(fallbackList);
              } else {
                setCustomDim3List(dim3List);
              }
            } catch (error) {
              console.error(
                `Erreur lors du chargement de la liste CA_Custom_Dim_3:`,
                error
              );
            }
          }
        }
      } catch (error) {
        console.error(
          'Erreur lors du chargement des informations client:',
          error
        );
      } finally {
        setLoadingCustomDims(false);
      }
    }

    loadClientInfo();
  }, [selectedClient, isOpen]);

  // Charger les listes standards
  useEffect(() => {
    async function loadStandardLists() {
      if (!selectedClient || !isOpen) return;

      try {
        // Charger les divisions
        setLoadingDivisions(true);
        let divisionsData = await getClientList(
          'CA_Division',
          selectedClient.clientId
        );
        if (divisionsData.length === 0) {
          divisionsData = await getClientList('CA_Division', 'PlusCo');
        }
        setDivisions(divisionsData);

        // Charger les quarter
        setLoadingQuarters(true);
        let quartersData = await getClientList(
          'CA_Quarter',
          selectedClient.clientId
        );
        if (quartersData.length === 0) {
          quartersData = await getClientList('CA_Quarter', 'PlusCo');
        }
        setQuarters(quartersData);

        // Charger les années
        setLoadingYears(true);
        let yearsData = await getClientList('CA_Year', selectedClient.clientId);
        if (yearsData.length === 0) {
          yearsData = await getClientList('CA_Year', 'PlusCo');
        }
        setYears(yearsData);
      } catch (error) {
        console.error('Erreur lors du chargement des listes:', error);
      } finally {
        setLoadingDivisions(false);
        setLoadingQuarters(false);
        setLoadingYears(false);
      }
    }

    loadStandardLists();
  }, [selectedClient, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Toggle pour ouvrir/fermer une section
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Composant pour l'en-tête de section
  const SectionHeader = ({
    title,
    section,
  }: {
    title: string;
    section: keyof typeof openSections;
  }) => (
    <div
      className="flex items-center justify-between py-3 cursor-pointer border-b border-gray-200"
      onClick={() => toggleSection(section)}
    >
      <h3 className="font-medium text-gray-900">{title}</h3>
      {openSections[section] ? (
        <ChevronUpIcon className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
      )}
    </div>
  );

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
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-primary-500 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-medium text-white">
                          {campaign
                            ? 'Modifier la campagne'
                            : 'Nouvelle campagne'}
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
                    <div className="relative flex-1 px-4 py-6 sm:px-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Section Informations */}
                        <div className="space-y-4">
                          <SectionHeader title="Informations" section="info" />

                          {openSections.info && (
                            <div className="space-y-4 pt-3">
                              {/* Identifiant de campagne */}
                              <div>
                                <label
                                  htmlFor="campaignId"
                                  className="form-label"
                                >
                                  Identifiant de campagne
                                </label>
                                <input
                                  type="text"
                                  name="campaignId"
                                  id="campaignId"
                                  value={formData.campaignId}
                                  onChange={handleChange}
                                  className="form-input"
                                />
                              </div>

                              {/* Nom de la campagne */}
                              <div>
                                <label htmlFor="name" className="form-label">
                                  Nom de la campagne *
                                </label>
                                <input
                                  type="text"
                                  name="name"
                                  id="name"
                                  required
                                  value={formData.name}
                                  onChange={handleChange}
                                  className="form-input"
                                />
                              </div>

                              {/* Division */}
                              <div>
                                <label
                                  htmlFor="division"
                                  className="form-label"
                                >
                                  Division
                                </label>
                                {loadingDivisions ? (
                                  <div className="text-sm text-gray-500 py-2">
                                    Chargement des divisions...
                                  </div>
                                ) : divisions.length > 0 ? (
                                  <select
                                    name="division"
                                    id="division"
                                    value={formData.division}
                                    onChange={handleChange}
                                    className="form-input"
                                  >
                                    <option value="">
                                      Sélectionner une division
                                    </option>
                                    {divisions.map((division) => (
                                      <option
                                        key={division.id}
                                        value={division.id}
                                      >
                                        {division.SH_Display_Name_FR ||
                                          division.SH_Code}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    name="division"
                                    id="division"
                                    value={formData.division}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Aucune division disponible"
                                  />
                                )}
                              </div>

                              {/* Quarter */}
                              <div>
                                <label htmlFor="quarter" className="form-label">
                                  Quarter *
                                </label>
                                {loadingQuarters ? (
                                  <div className="text-sm text-gray-500 py-2">
                                    Chargement des trimestres...
                                  </div>
                                ) : quarters.length > 0 ? (
                                  <select
                                    name="quarter"
                                    id="quarter"
                                    value={formData.quarter}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                  >
                                    <option value="">
                                      Sélectionner un trimestre
                                    </option>
                                    {quarters.map((quarter) => (
                                      <option
                                        key={quarter.id}
                                        value={quarter.id}
                                      >
                                        {quarter.SH_Display_Name_FR ||
                                          quarter.SH_Code}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <select
                                    name="quarter"
                                    id="quarter"
                                    value={formData.quarter}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                  >
                                    <option value="Q1">Q1</option>
                                    <option value="Q2">Q2</option>
                                    <option value="Q3">Q3</option>
                                    <option value="Q4">Q4</option>
                                    <option value="Full Year">Full Year</option>
                                  </select>
                                )}
                              </div>

                              {/* Année */}
                              <div>
                                <label htmlFor="year" className="form-label">
                                  Année *
                                </label>
                                {loadingYears ? (
                                  <div className="text-sm text-gray-500 py-2">
                                    Chargement des années...
                                  </div>
                                ) : years.length > 0 ? (
                                  <select
                                    name="year"
                                    id="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                  >
                                    <option value="">
                                      Sélectionner une année
                                    </option>
                                    {years.map((year) => (
                                      <option key={year.id} value={year.id}>
                                        {year.SH_Display_Name_FR ||
                                          year.SH_Code}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="number"
                                    name="year"
                                    id="year"
                                    required
                                    value={formData.year}
                                    onChange={handleChange}
                                    className="form-input"
                                    min="2020"
                                    max="2030"
                                  />
                                )}
                              </div>

                              {/* Dimensions personnalisées */}
                              {clientConfig.CA_Custom_Dim_1 && (
                                <div>
                                  <label
                                    htmlFor="customDim1"
                                    className="form-label"
                                  >
                                    {clientConfig.CA_Custom_Dim_1.replace(
                                      'CA_',
                                      ''
                                    )}
                                  </label>
                                  {loadingCustomDims ? (
                                    <div className="text-sm text-gray-500 py-2">
                                      Chargement...
                                    </div>
                                  ) : customDim1List.length > 0 ? (
                                    <select
                                      name="customDim1"
                                      id="customDim1"
                                      value={formData.customDim1}
                                      onChange={handleChange}
                                      className="form-input"
                                    >
                                      <option value="">
                                        Sélectionner une option
                                      </option>
                                      {customDim1List.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.SH_Display_Name_FR ||
                                            item.SH_Code}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      name="customDim1"
                                      id="customDim1"
                                      value={formData.customDim1}
                                      onChange={handleChange}
                                      className="form-input"
                                    />
                                  )}
                                </div>
                              )}

                              {clientConfig.CA_Custom_Dim_2 && (
                                <div>
                                  <label
                                    htmlFor="customDim2"
                                    className="form-label"
                                  >
                                    {clientConfig.CA_Custom_Dim_2.replace(
                                      'CA_',
                                      ''
                                    )}
                                  </label>
                                  {loadingCustomDims ? (
                                    <div className="text-sm text-gray-500 py-2">
                                      Chargement...
                                    </div>
                                  ) : customDim2List.length > 0 ? (
                                    <select
                                      name="customDim2"
                                      id="customDim2"
                                      value={formData.customDim2}
                                      onChange={handleChange}
                                      className="form-input"
                                    >
                                      <option value="">
                                        Sélectionner une option
                                      </option>
                                      {customDim2List.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.SH_Display_Name_FR ||
                                            item.SH_Code}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      name="customDim2"
                                      id="customDim2"
                                      value={formData.customDim2}
                                      onChange={handleChange}
                                      className="form-input"
                                    />
                                  )}
                                </div>
                              )}

                              {clientConfig.CA_Custom_Dim_3 && (
                                <div>
                                  <label
                                    htmlFor="customDim3"
                                    className="form-label"
                                  >
                                    {clientConfig.CA_Custom_Dim_3.replace(
                                      'CA_',
                                      ''
                                    )}
                                  </label>
                                  {loadingCustomDims ? (
                                    <div className="text-sm text-gray-500 py-2">
                                      Chargement...
                                    </div>
                                  ) : customDim3List.length > 0 ? (
                                    <select
                                      name="customDim3"
                                      id="customDim3"
                                      value={formData.customDim3}
                                      onChange={handleChange}
                                      className="form-input"
                                    >
                                      <option value="">
                                        Sélectionner une option
                                      </option>
                                      {customDim3List.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.SH_Display_Name_FR ||
                                            item.SH_Code}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      name="customDim3"
                                      id="customDim3"
                                      value={formData.customDim3}
                                      onChange={handleChange}
                                      className="form-input"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Section Dates */}
                        <div className="space-y-4">
                          <SectionHeader title="Dates" section="dates" />

                          {openSections.dates && (
                            <div className="space-y-4 pt-3">
                              {/* Date de début */}
                              <div>
                                <label
                                  htmlFor="startDate"
                                  className="form-label"
                                >
                                  Date de début *
                                </label>
                                <input
                                  type="date"
                                  name="startDate"
                                  id="startDate"
                                  required
                                  value={formData.startDate}
                                  onChange={handleChange}
                                  className="form-input"
                                />
                              </div>

                              {/* Date de fin */}
                              <div>
                                <label htmlFor="endDate" className="form-label">
                                  Date de fin *
                                </label>
                                <input
                                  type="date"
                                  name="endDate"
                                  id="endDate"
                                  required
                                  value={formData.endDate}
                                  onChange={handleChange}
                                  className="form-input"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section Budget */}
                        <div className="space-y-4">
                          <SectionHeader title="Budget" section="budget" />

                          {openSections.budget && (
                            <div className="space-y-4 pt-3">
                              {/* Budget */}
                              <div>
                                <label htmlFor="budget" className="form-label">
                                  Budget *
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-500 sm:text-sm">
                                      $
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    name="budget"
                                    id="budget"
                                    required
                                    value={formData.budget}
                                    onChange={handleChange}
                                    className="form-input pl-7"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>

                              {/* Devise */}
                              <div>
                                <label
                                  htmlFor="currency"
                                  className="form-label"
                                >
                                  Devise
                                </label>
                                <select
                                  name="currency"
                                  id="currency"
                                  value={formData.currency}
                                  onChange={handleChange}
                                  className="form-input"
                                >
                                  <option value="CAD">CAD</option>
                                  <option value="USD">USD</option>
                                  <option value="EUR">EUR</option>
                                </select>
                              </div>

                              {/* Frais personnalisés */}
                              <div>
                                <label
                                  htmlFor="customFee1"
                                  className="form-label"
                                >
                                  Frais personnalisé 1
                                </label>
                                <input
                                  type="number"
                                  name="customFee1"
                                  id="customFee1"
                                  value={formData.customFee1}
                                  onChange={handleChange}
                                  className="form-input"
                                  placeholder="0.00"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="customFee2"
                                  className="form-label"
                                >
                                  Frais personnalisé 2
                                </label>
                                <input
                                  type="number"
                                  name="customFee2"
                                  id="customFee2"
                                  value={formData.customFee2}
                                  onChange={handleChange}
                                  className="form-input"
                                  placeholder="0.00"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="customFee3"
                                  className="form-label"
                                >
                                  Frais personnalisé 3
                                </label>
                                <input
                                  type="number"
                                  name="customFee3"
                                  id="customFee3"
                                  value={formData.customFee3}
                                  onChange={handleChange}
                                  className="form-input"
                                  placeholder="0.00"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="customFee4"
                                  className="form-label"
                                >
                                  Frais personnalisé 4
                                </label>
                                <input
                                  type="number"
                                  name="customFee4"
                                  id="customFee4"
                                  value={formData.customFee4}
                                  onChange={handleChange}
                                  className="form-input"
                                  placeholder="0.00"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="customFee5"
                                  className="form-label"
                                >
                                  Frais personnalisé 5
                                </label>
                                <input
                                  type="number"
                                  name="customFee5"
                                  id="customFee5"
                                  value={formData.customFee5}
                                  onChange={handleChange}
                                  className="form-input"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section Admin */}
                        <div className="space-y-4">
                          <SectionHeader
                            title="Administration"
                            section="admin"
                          />

                          {openSections.admin && (
                            <div className="space-y-4 pt-3">
                              {/* ID externe client */}
                              <div>
                                <label
                                  htmlFor="clientExtId"
                                  className="form-label"
                                >
                                  ID externe client
                                </label>
                                <input
                                  type="text"
                                  name="clientExtId"
                                  id="clientExtId"
                                  value={formData.clientExtId}
                                  onChange={handleChange}
                                  className="form-input"
                                  placeholder="ID client dans le système externe"
                                />
                              </div>

                              {/* PO */}
                              <div>
                                <label htmlFor="po" className="form-label">
                                  PO
                                </label>
                                <input
                                  type="text"
                                  name="po"
                                  id="po"
                                  value={formData.po}
                                  onChange={handleChange}
                                  className="form-input"
                                  placeholder="Numéro de PO"
                                />
                              </div>

                              {/* ID Facturation */}
                              <div>
                                <label
                                  htmlFor="billingId"
                                  className="form-label"
                                >
                                  ID Facturation
                                </label>
                                <input
                                  type="text"
                                  name="billingId"
                                  id="billingId"
                                  value={formData.billingId}
                                  onChange={handleChange}
                                  className="form-input"
                                  placeholder="ID pour la facturation"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                          <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                          >
                            Annuler
                          </button>
                          <button type="submit" className="btn-primary">
                            {campaign ? 'Mettre à jour' : 'Créer'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
