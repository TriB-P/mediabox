/**
 * Ce composant gère l'affichage et la modification des informations générales d'un client.
 * Il permet aux utilisateurs disposant des permissions adéquates de mettre à jour le nom, le logo,
 * les bureaux, l'agence et d'autres paramètres spécifiques au client.
 * Il charge les informations depuis Firebase et gère la soumission des mises à jour.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getClientInfo, updateClientInfo, uploadClientLogo } from '../../lib/clientService';
import { getCostGuides } from '../../lib/costGuideService';
import type { CostGuide } from '../../types/costGuide';
import { useTranslation } from '../../contexts/LanguageContext';

interface ClientDetails {
  CL_Logo: string;
  CL_Name: string;
  CL_Office: string[];
  CL_Agency: string;
  CL_Export_Language: 'FR' | 'EN';
  CL_ID: string;
  CL_Default_Drive_Folder: string;
  CL_Cost_Guide_ID: string;
  CL_Custom_Fee_1: string;
  CL_Custom_Fee_2: string;
  CL_Custom_Fee_3: string;
}

const OFFICES = ['QC', 'VAN', 'MTL', 'TO'];
const AGENCIES = ['Jungle Média', 'Mekanism', 'Cossette Media', 'K72', 'Showroom'];

/**
 * Composant principal pour la gestion des informations générales du client.
 * Il affiche un formulaire pré-rempli avec les données du client sélectionné
 * et permet leur modification et enregistrement.
 * Le composant gère son propre état pour les détails du client, le chargement,
 * les erreurs et les confirmations de succès.
 */
const ClientGeneral: React.FC = () => {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [costGuides, setCostGuides] = useState<CostGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const hasClientInfoPermission = canPerformAction('ClientInfo');

  /**
   * Charge la liste de tous les guides de coûts disponibles depuis Firebase.
   * Met à jour l'état `costGuides` avec les données récupérées.
   */
  const loadCostGuides = async () => {
    try {
      console.log("FIREBASE: [LECTURE] - Fichier: ClientGeneral.tsx - Fonction: loadCostGuides - Path: cost_guides");
      const guides = await getCostGuides();
      setCostGuides(guides);
    } catch (err) {
      console.error('Erreur lors du chargement des guides de coûts:', err);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      loadClientDetails();
    }
    loadCostGuides();
  }, [selectedClient]);

  /**
   * Récupère les détails du client actuellement sélectionné depuis Firebase.
   * Met à jour l'état `clientDetails` et gère les états de chargement et d'erreur.
   */
  const loadClientDetails = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`FIREBASE: [LECTURE] - Fichier: ClientGeneral.tsx - Fonction: loadClientDetails - Path: clients/${selectedClient.clientId}`);
      const details = await getClientInfo(selectedClient.clientId);
      
      setClientDetails({
        CL_Logo: details.CL_Logo || '',
        CL_Name: details.CL_Name || '',
        CL_Office: details.CL_Office || [],
        CL_Agency: details.CL_Agency || '',
        CL_Export_Language: details.CL_Export_Language || 'FR',
        CL_ID: selectedClient.clientId,
        CL_Default_Drive_Folder: details.CL_Default_Drive_Folder || '',
        CL_Cost_Guide_ID: details.CL_Cost_Guide_ID || '',
        CL_Custom_Fee_1: details.CL_Custom_Fee_1 || '',
        CL_Custom_Fee_2: details.CL_Custom_Fee_2 || '',
        CL_Custom_Fee_3: details.CL_Custom_Fee_3 || '',
      });
    } catch (err) {
      console.error('Erreur lors du chargement des détails du client:', err);
      setError(t('clientGeneral.messages.error.loadDetailsFailed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère la soumission du formulaire de modification des informations du client.
   * Si un nouveau logo est fourni, il le télécharge d'abord.
   * Ensuite, il met à jour les informations du client dans Firebase.
   * @param {React.FormEvent} e L'événement du formulaire.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !clientDetails || !hasClientInfoPermission) return;
    
    try {
      setSaving(true);
      setError(null);
      
      if (logoFile) {
        try {
          console.log(`FIREBASE: [ÉCRITURE] - Fichier: ClientGeneral.tsx - Fonction: handleSubmit - Path: client_logos/${selectedClient.clientId}`);
          const logoUrl = await uploadClientLogo(selectedClient.clientId, logoFile);
          clientDetails.CL_Logo = logoUrl;
        } catch (logoError) {
          console.error('Erreur lors du téléchargement du logo:', logoError);
          setError(t('clientGeneral.messages.error.logoUploadFailed'));
        }
      }
      
      console.log(`FIREBASE: [ÉCRITURE] - Fichier: ClientGeneral.tsx - Fonction: handleSubmit - Path: clients/${selectedClient.clientId}`);
      await updateClientInfo(selectedClient.clientId, clientDetails);
      
      setSuccess(t('clientGeneral.messages.success.updateSuccess'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des détails du client:', err);
      setError(t('clientGeneral.messages.error.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  /**
   * Met à jour l'état `clientDetails` lorsqu'un utilisateur modifie un champ
   * du formulaire (input, select, textarea).
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e L'événement de changement.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!clientDetails || !hasClientInfoPermission) return;
    
    const { name, value } = e.target;
    setClientDetails({
      ...clientDetails,
      [name]: value,
    });
  };

  /**
   * Gère la sélection/désélection des checkboxes pour les bureaux.
   * Met à jour la liste des bureaux dans l'état `clientDetails`.
   * @param {string} office Le nom du bureau (ex: 'QC', 'MTL').
   */
  const handleCheckboxChange = (office: string) => {
    if (!clientDetails || !hasClientInfoPermission) return;
    
    const updatedOffices = clientDetails.CL_Office.includes(office)
      ? clientDetails.CL_Office.filter(o => o !== office)
      : [...clientDetails.CL_Office, office];
    
    setClientDetails({
      ...clientDetails,
      CL_Office: updatedOffices,
    });
  };

  /**
   * Gère le changement de fichier pour le logo du client.
   * Stocke le fichier sélectionné dans l'état `logoFile` et génère un aperçu
   * qui est stocké dans l'état `logoPreview`.
   * @param {React.ChangeEvent<HTMLInputElement>} e L'événement de changement du champ de fichier.
   */
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasClientInfoPermission) return;
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Copie le texte fourni dans le presse-papiers de l'utilisateur.
   * Affiche une confirmation visuelle temporaire.
   * @param {string} text Le texte à copier.
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Erreur lors de la copie dans le presse-papier:', err);
      }
    );
  };
  
  /**
   * Trouve et retourne le nom du guide de coûts actuellement sélectionné pour le client.
   * Si aucun guide n'est sélectionné ou si le guide n'est pas trouvé, retourne un message par défaut.
   * @returns {string} Le nom du guide de coûts ou un message par défaut.
   */
  const getSelectedCostGuideName = () => {
    if (!clientDetails?.CL_Cost_Guide_ID) return t('clientGeneral.form.costGuide.noGuideSelected');
    const selectedGuide = costGuides.find(guide => guide.id === clientDetails.CL_Cost_Guide_ID);
    return selectedGuide ? selectedGuide.name : t('clientGeneral.form.costGuide.guideNotFound');
  };

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">{t('clientGeneral.messages.info.selectClient')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">{t('clientGeneral.messages.info.loading')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">{t('clientGeneral.header.title')}</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
            {success}
          </div>
        )}
        
        {!hasClientInfoPermission && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700">
            {t('clientGeneral.messages.warning.readOnly')}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <div className="grid grid-cols-12 gap-6 pb-6">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('clientGeneral.form.labels.clientLogo')}
              </label>
              <div className="flex flex-col items-start">
                <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 mb-2">
                  {logoPreview ? (
                    <img src={logoPreview} alt={t('clientGeneral.form.altText.logoPreview')} className="w-full h-full object-cover" />
                  ) : clientDetails?.CL_Logo ? (
                    <img src={clientDetails.CL_Logo} alt={t('clientGeneral.form.altText.clientLogo')} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">{t('clientGeneral.form.labels.noLogo')}</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    disabled={!hasClientInfoPermission}
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md ${
                      hasClientInfoPermission 
                        ? 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer' 
                        : 'text-gray-500 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {t('clientGeneral.buttons.changeLogo')}
                  </label>
                </div>
              </div>
            </div>
            
            <div className="col-span-9">
              <div className="mb-6">
                <label htmlFor="CL_Name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientGeneral.form.labels.clientName')}
                </label>
                <input
                  type="text"
                  id="CL_Name"
                  name="CL_Name"
                  value={clientDetails?.CL_Name || ''}
                  onChange={handleChange}
                  required
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg font-medium ${
                    !hasClientInfoPermission ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  disabled={!hasClientInfoPermission}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientGeneral.form.labels.clientId')}
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={clientDetails?.CL_ID || ''}
                    readOnly
                    className="block w-full rounded-l-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(clientDetails?.CL_ID || '')}
                    className="relative inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ClipboardIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t('clientGeneral.form.helpText.clientId')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 my-4"></div>
          
          <div className="grid grid-cols-12 gap-6 pt-2">
            <div className="col-span-3">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('clientGeneral.form.labels.offices')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {OFFICES.map((office) => (
                    <div key={office} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`office-${office}`}
                        checked={clientDetails?.CL_Office.includes(office) || false}
                        onChange={() => handleCheckboxChange(office)}
                        className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${
                          !hasClientInfoPermission ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                        disabled={!hasClientInfoPermission}
                      />
                      <label htmlFor={`office-${office}`} className="ml-2 block text-sm text-gray-700">
                        {office}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('clientGeneral.form.labels.exportLanguage')}
                </label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="export-fr"
                      name="CL_Export_Language"
                      value="FR"
                      checked={clientDetails?.CL_Export_Language === 'FR'}
                      onChange={handleChange}
                      className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 ${
                        !hasClientInfoPermission ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                      disabled={!hasClientInfoPermission}
                    />
                    <label htmlFor="export-fr" className="ml-2 block text-sm text-gray-700">
                      {t('clientGeneral.form.options.french')}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="export-en"
                      name="CL_Export_Language"
                      value="EN"
                      checked={clientDetails?.CL_Export_Language === 'EN'}
                      onChange={handleChange}
                      className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 ${
                        !hasClientInfoPermission ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                      disabled={!hasClientInfoPermission}
                    />
                    <label htmlFor="export-en" className="ml-2 block text-sm text-gray-700">
                      {t('clientGeneral.form.options.english')}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-9">
              <div className="mb-6">
                <label htmlFor="CL_Agency" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientGeneral.form.labels.agency')}
                </label>
                <select
                  id="CL_Agency"
                  name="CL_Agency"
                  value={clientDetails?.CL_Agency || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    !hasClientInfoPermission ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  disabled={!hasClientInfoPermission}
                >
                  <option value="">{t('clientGeneral.form.options.selectAgency')}</option>
                  {AGENCIES.map((agency) => (
                    <option key={agency} value={agency}>
                      {agency}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label htmlFor="CL_Cost_Guide_ID" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientGeneral.form.labels.costGuide')}
                </label>
                <select
                  id="CL_Cost_Guide_ID"
                  name="CL_Cost_Guide_ID"
                  value={clientDetails?.CL_Cost_Guide_ID || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    !hasClientInfoPermission ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  disabled={!hasClientInfoPermission}
                >
                  <option value="">{t('clientGeneral.form.costGuide.noGuideSelected')}</option>
                  {costGuides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name}
                    </option>
                  ))}
                </select>
              
              </div>
              
              <div>
                <label htmlFor="CL_Default_Drive_Folder" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientGeneral.form.labels.defaultDriveFolder')}
                </label>
                <input
                  type="url"
                  id="CL_Default_Drive_Folder"
                  name="CL_Default_Drive_Folder"
                  value={clientDetails?.CL_Default_Drive_Folder || ''}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    !hasClientInfoPermission ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  disabled={!hasClientInfoPermission}
                />
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 my-4"></div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">{t('clientGeneral.header.generalFees')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="CL_Custom_Fee_1" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientGeneral.form.labels.customFee1')}
                </label>
                <input
                  type="text"
                  id="CL_Custom_Fee_1"
                  name="CL_Custom_Fee_1"
                  value={clientDetails?.CL_Custom_Fee_1 || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    !hasClientInfoPermission ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  disabled={!hasClientInfoPermission}
                />
              </div>
              
              <div>
                <label htmlFor="CL_Custom_Fee_2" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientGeneral.form.labels.customFee2')}
                </label>
                <input
                  type="text"
                  id="CL_Custom_Fee_2"
                  name="CL_Custom_Fee_2"
                  value={clientDetails?.CL_Custom_Fee_2 || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    !hasClientInfoPermission ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  disabled={!hasClientInfoPermission}
                />
              </div>
              
              <div>
                <label htmlFor="CL_Custom_Fee_3" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientGeneral.form.labels.customFee3')}
                </label>
                <input
                  type="text"
                  id="CL_Custom_Fee_3"
                  name="CL_Custom_Fee_3"
                  value={clientDetails?.CL_Custom_Fee_3 || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    !hasClientInfoPermission ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  disabled={!hasClientInfoPermission}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-5 border-t border-gray-200 mt-8">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={loadClientDetails}
                className={`bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  !hasClientInfoPermission ? 'hidden' : ''
                }`}
              >
                {t('clientGeneral.buttons.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving || !hasClientInfoPermission}
                className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  hasClientInfoPermission
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? t('clientGeneral.buttons.saving') : t('clientGeneral.buttons.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientGeneral;