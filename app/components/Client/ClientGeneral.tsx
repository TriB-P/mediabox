// app/components/Client/ClientGeneral.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getClientInfo, updateClientInfo, uploadClientLogo } from '../../lib/clientService';
import { getCostGuides } from '../../lib/costGuideService';
import type { CostGuide } from '../../types/costGuide';

interface ClientDetails {
  CL_Logo: string;
  CL_Name: string;
  CL_Office: string[];
  CL_Agency: string;
  CL_Export_Language: 'FR' | 'EN';
  CL_ID: string;
  CL_Default_Drive_Folder: string;
  CL_Cost_Guide_ID: string; // NOUVEAU
  CL_Custom_Fee_1: string;
  CL_Custom_Fee_2: string;
  CL_Custom_Fee_3: string;
}

const OFFICES = ['QC', 'VAN', 'MTL', 'TO'];
const AGENCIES = ['Jungle Média', 'Mekanism', 'Cossette Media', 'K72', 'Showroom'];

const ClientGeneral: React.FC = () => {
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [costGuides, setCostGuides] = useState<CostGuide[]>([]); // NOUVEAU
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Vérifier si l'utilisateur a la permission de gérer les informations générales du client
  const hasClientInfoPermission = canPerformAction('ClientInfo');

  // Charger les guides de coûts disponibles
  const loadCostGuides = async () => {
    try {
      const guides = await getCostGuides();
      setCostGuides(guides);
    } catch (err) {
      console.error('Erreur lors du chargement des guides de coûts:', err);
    }
  };

  // Charger les données du client quand le client sélectionné change
  useEffect(() => {
    if (selectedClient) {
      loadClientDetails();
    }
    loadCostGuides(); // Charger les guides de coûts
  }, [selectedClient]);

  const loadClientDetails = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const details = await getClientInfo(selectedClient.clientId);
      
      setClientDetails({
        CL_Logo: details.CL_Logo || '',
        CL_Name: details.CL_Name || '',
        CL_Office: details.CL_Office || [],
        CL_Agency: details.CL_Agency || '',
        CL_Export_Language: details.CL_Export_Language || 'FR',
        CL_ID: selectedClient.clientId,
        CL_Default_Drive_Folder: details.CL_Default_Drive_Folder || '',
        CL_Cost_Guide_ID: details.CL_Cost_Guide_ID || '', // NOUVEAU
        CL_Custom_Fee_1: details.CL_Custom_Fee_1 || '',
        CL_Custom_Fee_2: details.CL_Custom_Fee_2 || '',
        CL_Custom_Fee_3: details.CL_Custom_Fee_3 || '',
      });
    } catch (err) {
      console.error('Erreur lors du chargement des détails du client:', err);
      setError('Impossible de charger les détails du client.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !clientDetails || !hasClientInfoPermission) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Si un nouveau logo a été sélectionné, le télécharger
      if (logoFile) {
        try {
          const logoUrl = await uploadClientLogo(selectedClient.clientId, logoFile);
          clientDetails.CL_Logo = logoUrl;
        } catch (logoError) {
          console.error('Erreur lors du téléchargement du logo:', logoError);
          setError('Impossible de télécharger le logo. Les autres informations seront enregistrées.');
        }
      }
      
      await updateClientInfo(selectedClient.clientId, clientDetails);
      
      setSuccess('Les informations du client ont été mises à jour avec succès.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des détails du client:', err);
      setError('Impossible de mettre à jour les détails du client.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!clientDetails || !hasClientInfoPermission) return;
    
    const { name, value } = e.target;
    setClientDetails({
      ...clientDetails,
      [name]: value,
    });
  };

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasClientInfoPermission) return;
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Créer une URL pour la prévisualisation
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  // Trouver le nom du guide de coûts sélectionné
  const getSelectedCostGuideName = () => {
    if (!clientDetails?.CL_Cost_Guide_ID) return 'Aucun guide sélectionné';
    const selectedGuide = costGuides.find(guide => guide.id === clientDetails.CL_Cost_Guide_ID);
    return selectedGuide ? selectedGuide.name : 'Guide non trouvé';
  };

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Veuillez sélectionner un client pour voir ses informations.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Chargement des informations du client...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Informations générales</h2>
        
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
            Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les informations du client.
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          {/* Section du haut : Logo, Nom et ID */}
          <div className="grid grid-cols-12 gap-6 pb-6">
            {/* Logo du client - aligné à gauche */}
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo du client
              </label>
              <div className="flex flex-col items-start">
                <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 mb-2">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Aperçu du logo" className="w-full h-full object-cover" />
                  ) : clientDetails?.CL_Logo ? (
                    <img src={clientDetails.CL_Logo} alt="Logo du client" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">Aucun logo</span>
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
                    Changer le logo
                  </label>
                </div>
              </div>
            </div>
            
            {/* Nom et ID du client */}
            <div className="col-span-9">
              {/* Nom du client */}
              <div className="mb-6">
                <label htmlFor="CL_Name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du client
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
              
              {/* ID Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Client
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
                  Identifiant unique du client (non modifiable)
                </p>
              </div>
            </div>
          </div>
          
          {/* Séparateur horizontal avec espace supplémentaire */}
          <div className="border-t border-gray-200 my-4"></div>
          
          {/* Section du bas : Bureaux, Agence, Langue, Drive, Guide de coûts */}
          <div className="grid grid-cols-12 gap-6 pt-2">
            {/* Colonne de gauche - réduite */}
            <div className="col-span-3">
              {/* Bureaux */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bureaux
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
              
              {/* Langue d'exportation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue d'exportation
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
                      Français
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
                      Anglais
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Colonne de droite - plus large et alignée */}
            <div className="col-span-9">
              {/* Agence */}
              <div className="mb-6">
                <label htmlFor="CL_Agency" className="block text-sm font-medium text-gray-700 mb-1">
                  Agence
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
                  <option value="">Sélectionner une agence</option>
                  {AGENCIES.map((agency) => (
                    <option key={agency} value={agency}>
                      {agency}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Guide de coûts - NOUVEAU */}
              <div className="mb-6">
                <label htmlFor="CL_Cost_Guide_ID" className="block text-sm font-medium text-gray-700 mb-1">
                  Guide de coûts
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
                  <option value="">Aucun guide sélectionné</option>
                  {costGuides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name}
                    </option>
                  ))}
                </select>
              
              </div>
              
              {/* Dossier Drive par défaut */}
              <div>
                <label htmlFor="CL_Default_Drive_Folder" className="block text-sm font-medium text-gray-700 mb-1">
                  Dossier Drive par défaut
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
          
          {/* Séparateur horizontal avec espace supplémentaire */}
          <div className="border-t border-gray-200 my-4"></div>
          
          {/* Section des frais généraux */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Frais généraux</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Frais 1 */}
              <div>
                <label htmlFor="CL_Custom_Fee_1" className="block text-sm font-medium text-gray-700 mb-1">
                  Frais personnalisé 1
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
              
              {/* Frais 2 */}
              <div>
                <label htmlFor="CL_Custom_Fee_2" className="block text-sm font-medium text-gray-700 mb-1">
                  Frais personnalisé 2
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
              
              {/* Frais 3 */}
              <div>
                <label htmlFor="CL_Custom_Fee_3" className="block text-sm font-medium text-gray-700 mb-1">
                  Frais personnalisé 3
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
          
          {/* Boutons d'action */}
          <div className="pt-5 border-t border-gray-200 mt-8">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={loadClientDetails}
                className={`bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  !hasClientInfoPermission ? 'hidden' : ''
                }`}
              >
                Annuler
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
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientGeneral;