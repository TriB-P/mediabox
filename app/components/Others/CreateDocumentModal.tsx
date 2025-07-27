// app/components/Others/CreateDocumentModal.tsx

/**
 * Ce composant affiche un modal pour créer un nouveau document.
 * Il permet à l'utilisateur de sélectionner un template, donner un nom au document,
 * puis lance le processus de création complet en utilisant la campagne et version
 * déjà sélectionnées dans le contexte de l'application.
 * Le modal affiche la progression en temps réel et gère les états d'erreur.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useClient } from '../../contexts/ClientContext';
import { useSelection } from '../../contexts/SelectionContext';
import { useCreateDocument } from '../../hooks/documents/useCreateDocument';
import { getTemplatesByClient } from '../../lib/templateService';
import { getCampaigns } from '../../lib/campaignService';
import { getVersions } from '../../lib/versionService';
import { Template } from '../../types/template';
import { DocumentFormData, DocumentCreationResult } from '../../types/document';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated?: (result: DocumentCreationResult) => void;
}

/**
 * Composant modal pour créer un nouveau document.
 * @param isOpen État d'ouverture du modal.
 * @param onClose Callback appelé lors de la fermeture du modal.
 * @param onDocumentCreated Callback appelé après création réussie d'un document.
 */
export default function CreateDocumentModal({
  isOpen,
  onClose,
  onDocumentCreated
}: CreateDocumentModalProps) {
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId } = useSelection();
  const { createDocument, loading: createLoading, error: createError, progress } = useCreateDocument();
  
  // États du formulaire
  const [documentName, setDocumentName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // États des données
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // États pour afficher les informations de campagne/version
  const [campaignName, setCampaignName] = useState<string>('');
  const [versionName, setVersionName] = useState<string>('');

  // États de progression
  const [creationResult, setCreationResult] = useState<DocumentCreationResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /**
   * Charge les templates du client sélectionné.
   */
  const loadTemplates = useCallback(async () => {
    if (!selectedClient) return;

    try {
      setDataLoading(true);
      setDataError(null);
      
      const clientTemplates = await getTemplatesByClient(selectedClient.clientId);
      setTemplates(clientTemplates);
    } catch (err) {
      console.error('Erreur lors du chargement des templates:', err);
      setDataError('Impossible de charger les templates du client.');
    } finally {
      setDataLoading(false);
    }
  }, [selectedClient]);

  /**
   * Charge les informations de la campagne et version sélectionnées pour affichage.
   */
  const loadCampaignVersionInfo = useCallback(async () => {
    if (!selectedClient || !selectedCampaignId || !selectedVersionId) {
      setCampaignName('');
      setVersionName('');
      return;
    }

    try {
      // Charger les informations de la campagne
      const campaigns = await getCampaigns(selectedClient.clientId);
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      setCampaignName(campaign?.CA_Name || 'Campagne inconnue');

      // Charger les informations de la version
      const versions = await getVersions(selectedClient.clientId, selectedCampaignId);
      const version = versions.find(v => v.id === selectedVersionId);
      setVersionName(version?.name || 'Version inconnue');
    } catch (err) {
      console.error('Erreur lors du chargement des informations:', err);
      setCampaignName('Erreur de chargement');
      setVersionName('Erreur de chargement');
    }
  }, [selectedClient, selectedCampaignId, selectedVersionId]);

  // Charger les données initiales
  useEffect(() => {
    if (isOpen && selectedClient) {
      loadTemplates();
      loadCampaignVersionInfo();
    }
  }, [isOpen, selectedClient, loadTemplates, loadCampaignVersionInfo]);

  /**
   * Réinitialise tous les états du modal.
   */
  const resetModal = useCallback(() => {
    setDocumentName('');
    setSelectedTemplate(null);
    setFormError(null);
    setCreationResult(null);
    setShowSuccess(false);
  }, []);

  /**
   * Ferme le modal et réinitialise les états.
   */
  const handleClose = useCallback(() => {
    if (!createLoading) {
      resetModal();
      onClose();
    }
  }, [createLoading, resetModal, onClose]);

  /**
   * Valide le formulaire avant soumission.
   * @returns true si le formulaire est valide, false sinon.
   */
  const validateForm = useCallback((): boolean => {
    setFormError(null);

    if (!documentName.trim()) {
      setFormError('Veuillez saisir un nom pour le document.');
      return false;
    }

    if (!selectedTemplate) {
      setFormError('Veuillez sélectionner un template.');
      return false;
    }

    if (!selectedCampaignId) {
      setFormError('Aucune campagne sélectionnée. Veuillez sélectionner une campagne depuis la page principale.');
      return false;
    }

    if (!selectedVersionId) {
      setFormError('Aucune version sélectionnée. Veuillez sélectionner une version depuis la page principale.');
      return false;
    }

    return true;
  }, [documentName, selectedTemplate, selectedCampaignId, selectedVersionId]);

  /**
   * Gère la soumission du formulaire et lance la création du document.
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !validateForm()) {
      return;
    }

    const formData: DocumentFormData = {
      name: documentName.trim(),
      templateId: selectedTemplate!.id,
      campaignId: selectedCampaignId!,
      versionId: selectedVersionId!
    };

    try {
      const result = await createDocument(selectedClient.clientId, formData);
      setCreationResult(result);
      
      if (result.success) {
        setShowSuccess(true);
        if (onDocumentCreated) {
          onDocumentCreated(result);
        }
        // Fermer automatiquement après 3 secondes
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (err) {
      console.error('Erreur lors de la création du document:', err);
    }
  }, [selectedClient, validateForm, documentName, selectedTemplate, selectedCampaignId, selectedVersionId, createDocument, onDocumentCreated, handleClose]);

  // Ne pas afficher le modal si pas de client sélectionné
  if (!selectedClient) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            
            {/* En-tête */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Créer un nouveau document
                </h3>
              </div>
              <button
                onClick={handleClose}
                disabled={createLoading}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Contenu principal */}
            <div className="mt-6">
              
              {/* Affichage des erreurs de chargement */}
              {dataError && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm">{dataError}</p>
                  </div>
                </div>
              )}

              {/* Affichage du succès */}
              {showSuccess && creationResult?.success && (
                <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
                  <div className="flex">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Document créé avec succès !</p>
                      <p className="text-sm mt-1">
                        Le document "{creationResult.document?.name}" est maintenant disponible.
                      </p>
                      {creationResult.document?.url && (
                        <a
                          href={creationResult.document.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-800 underline mt-1 inline-block"
                        >
                          Ouvrir le document →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Affichage des erreurs de création */}
              {(formError || createError || (creationResult && !creationResult.success)) && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm">
                      {formError || createError || creationResult?.errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Indicateur de progression */}
              {progress && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">{progress.step}</p>
                      <p className="text-sm text-blue-600 mt-1">{progress.details}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations sur la campagne et version sélectionnées */}
              {selectedCampaignId && selectedVersionId && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
           
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Campagne : </span>
                      <span className="text-blue-600">{campaignName}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Version : </span>
                      <span className="text-blue-600">{versionName}</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Pour changer, retournez à la page principale.
                  </p>
                </div>
              )}

              {/* Message d'erreur si pas de sélection */}
              {(!selectedCampaignId || !selectedVersionId) && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Sélection manquante</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Veuillez sélectionner une campagne et une version depuis la page principale avant de créer un document.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Nom du document */}
                <div>
                  <label htmlFor="document-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du document *
                  </label>
                  <input
                    type="text"
                    id="document-name"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Ex: Plan Média Q1 2024"
                    disabled={createLoading || dataLoading || !selectedCampaignId || !selectedVersionId}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                      createLoading || dataLoading || !selectedCampaignId || !selectedVersionId ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    required
                  />
                </div>

                {/* Sélection du template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template *
                  </label>
                  {dataLoading ? (
                    <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
                  ) : (
                    <select
                      value={selectedTemplate?.id || ''}
                      onChange={(e) => {
                        const template = templates.find(t => t.id === e.target.value);
                        setSelectedTemplate(template || null);
                      }}
                      disabled={createLoading || !selectedCampaignId || !selectedVersionId}
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        createLoading || !selectedCampaignId || !selectedVersionId ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      required
                    >
                      <option value="">Sélectionner un template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.TE_Name} ({template.TE_Language})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Les shortcodes seront convertis selon la langue du template sélectionné.
                  </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={createLoading}
                    className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      createLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading || dataLoading || showSuccess || !selectedCampaignId || !selectedVersionId}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      createLoading || dataLoading || showSuccess || !selectedCampaignId || !selectedVersionId
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                  >
                    {createLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Création en cours...
                      </>
                    ) : (
                      'Créer le document'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}