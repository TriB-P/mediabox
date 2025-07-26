// app/documents/page.tsx

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import CreateDocumentModal from '../components/Others/CreateDocumentModal';
import CampaignVersionSelector, { useCampaignVersionSelector } from '../components/Others/CampaignVersionSelector';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { getDocumentsByVersion } from '../lib/documentService';
import { getCampaigns } from '../lib/campaignService';
import { getVersions } from '../lib/versionService';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  LinkIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Document, DocumentStatus, DocumentCreationResult } from '../types/document';
import { Campaign } from '../types/campaign';

interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

/**
 * Page principale de gestion des documents.
 * Permet de créer de nouveaux documents à partir de templates et de naviguer
 * entre les documents existants par campagne/version.
 * @returns {JSX.Element} Le composant de la page des documents.
 */
export default function DocumentsPage() {
  const { selectedClient } = useClient();
  const { 
    selectedCampaignId, 
    selectedVersionId,
    setSelectedCampaignId,
    setSelectedVersionId 
  } = useSelection();

  // États du modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // États des données
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hook pour la sélection campagne/version
  const {
    selectedCampaign,
    selectedVersion,
    handleCampaignChange,
    handleVersionChange,
    reset: resetSelection
  } = useCampaignVersionSelector();

  // Refs pour éviter les boucles de synchronisation
  const isInitializing = useRef(true);
  const lastSyncedCampaignId = useRef<string | null>(null);
  const lastSyncedVersionId = useRef<string | null>(null);

  /**
   * Charge les campagnes du client sélectionné.
   */
  const loadCampaigns = useCallback(async () => {
    if (!selectedClient) {
      setCampaigns([]);
      return;
    }

    try {
      setError(null);
      const clientCampaigns = await getCampaigns(selectedClient.clientId);
      setCampaigns(clientCampaigns);

      // Restaurer la sélection depuis le contexte SEULEMENT lors de l'initialisation
      if (isInitializing.current && selectedCampaignId) {
        const campaign = clientCampaigns.find(c => c.id === selectedCampaignId);
        if (campaign) {
          handleCampaignChange(campaign);
          lastSyncedCampaignId.current = selectedCampaignId;
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des campagnes:', err);
      setError('Impossible de charger les campagnes.');
    }
  }, [selectedClient, selectedCampaignId, handleCampaignChange]);

  /**
   * Charge les versions d'une campagne sélectionnée.
   */
  const loadVersions = useCallback(async () => {
    if (!selectedClient || !selectedCampaign) {
      setVersions([]);
      return;
    }

    try {
      setError(null);
      const campaignVersions = await getVersions(selectedClient.clientId, selectedCampaign.id);
      setVersions(campaignVersions);

      // Restaurer la sélection depuis le contexte SEULEMENT lors de l'initialisation
      if (isInitializing.current && selectedVersionId) {
        const version = campaignVersions.find(v => v.id === selectedVersionId);
        if (version) {
          handleVersionChange(version);
          lastSyncedVersionId.current = selectedVersionId;
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des versions:', err);
      setError('Impossible de charger les versions.');
    }
  }, [selectedClient, selectedCampaign, selectedVersionId, handleVersionChange]);

  /**
   * Charge les documents d'une version sélectionnée.
   */
  const loadDocuments = useCallback(async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) {
      setDocuments([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const versionDocuments = await getDocumentsByVersion(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id
      );
      
      setDocuments(versionDocuments);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setError('Impossible de charger les documents.');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedCampaign, selectedVersion]);

  // Charger les campagnes au changement de client
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Charger les versions au changement de campagne
  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Charger les documents au changement de version
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Synchroniser avec le contexte de sélection (uniquement pour les changements utilisateur)
  useEffect(() => {
    if (selectedCampaign && selectedCampaign.id !== lastSyncedCampaignId.current) {
      setSelectedCampaignId(selectedCampaign.id);
      lastSyncedCampaignId.current = selectedCampaign.id;
    }
  }, [selectedCampaign, setSelectedCampaignId]);

  useEffect(() => {
    if (selectedVersion && selectedVersion.id !== lastSyncedVersionId.current) {
      setSelectedVersionId(selectedVersion.id);
      lastSyncedVersionId.current = selectedVersion.id;
    }
  }, [selectedVersion, setSelectedVersionId]);

  // Marquer la fin de l'initialisation après le premier chargement complet
  useEffect(() => {
    if (selectedClient && campaigns.length > 0) {
      isInitializing.current = false;
    }
  }, [selectedClient, campaigns]);

  // Réinitialiser les flags lors du changement de client
  useEffect(() => {
    if (selectedClient) {
      isInitializing.current = true;
      lastSyncedCampaignId.current = null;
      lastSyncedVersionId.current = null;
    }
  }, [selectedClient]);

  /**
   * Ouvre le modal de création de document.
   */
  const handleCreateDocument = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  /**
   * Ferme le modal de création de document.
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  /**
   * Gère la création réussie d'un document.
   * @param result Le résultat de la création.
   */
  const handleDocumentCreated = useCallback((result: DocumentCreationResult) => {
    if (result.success) {
      // Recharger la liste des documents
      loadDocuments();
    }
  }, [loadDocuments]);

  /**
   * Formate une date en format lisible.
   * @param dateString La date en format ISO string.
   * @returns La date formatée.
   */
  const formatDate = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  }, []);

  /**
   * Retourne l'icône appropriée selon le statut du document.
   * @param status Le statut du document.
   * @returns L'élément icône.
   */
  const getStatusIcon = useCallback((status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case DocumentStatus.ERROR:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case DocumentStatus.CREATING:
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-pulse" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  }, []);

  /**
   * Retourne le texte du statut en français.
   * @param status Le statut du document.
   * @returns Le texte du statut.
   */
  const getStatusText = useCallback((status: DocumentStatus): string => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return 'Terminé';
      case DocumentStatus.ERROR:
        return 'Erreur';
      case DocumentStatus.CREATING:
        return 'En création...';
      default:
        return 'Inconnu';
    }
  }, []);

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div className="space-y-6">

          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                <p className="text-sm text-gray-500">
                  Création et gestion des documents basés sur des templates
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateDocument}
              disabled={!selectedClient}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                selectedClient
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              title={!selectedClient ? "Sélectionnez un client pour créer un document" : ""}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nouveau document
            </button>
          </div>

          {/* Message si pas de client sélectionné */}
          {!selectedClient && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Aucun client sélectionné</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Veuillez sélectionner un client dans la barre de navigation pour gérer ses documents.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Interface principale */}
          {selectedClient && (
            <>
              {/* Sélecteur campagne/version */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Navigation par campagne et version
                </h2>
                <CampaignVersionSelector
                  campaigns={campaigns}
                  versions={versions}
                  selectedCampaign={selectedCampaign}
                  selectedVersion={selectedVersion}
                  loading={loading}
                  error={error}
                  onCampaignChange={handleCampaignChange}
                  onVersionChange={handleVersionChange}
                  className="space-y-4"
                />
              </div>

              {/* Liste des documents */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                      Documents
                      {selectedCampaign && selectedVersion && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          {selectedCampaign.CA_Name} - {selectedVersion.name}
                        </span>
                      )}
                    </h2>
                    {documents.length > 0 && (
                      <span className="text-sm text-gray-500">
                        {documents.length} document{documents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4">
                  {/* États de chargement et d'erreur */}
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <span className="ml-3 text-gray-600">Chargement des documents...</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Message si pas de sélection */}
                  {!selectedCampaign && !loading && !error && (
                    <div className="text-center py-8 text-gray-500">
                      <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Sélectionnez une campagne</p>
                      <p className="text-sm mt-1">
                        Choisissez une campagne et une version pour voir les documents associés.
                      </p>
                    </div>
                  )}

                  {/* Message si pas de version */}
                  {selectedCampaign && !selectedVersion && !loading && !error && (
                    <div className="text-center py-8 text-gray-500">
                      <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Sélectionnez une version</p>
                      <p className="text-sm mt-1">
                        Choisissez une version pour voir les documents associés.
                      </p>
                    </div>
                  )}

                  {/* Liste des documents */}
                  {selectedCampaign && selectedVersion && !loading && !error && (
                    <>
                      {documents.length === 0 ? (
                        <div className="text-center py-8">
                          <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium text-gray-900">Aucun document</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Cette version ne contient pas encore de documents.
                          </p>
                          <button
                            onClick={handleCreateDocument}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-4"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Créer le premier document
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {documents.map((document) => (
                            <div
                              key={document.id}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    {getStatusIcon(document.status)}
                                    <h3 className="text-lg font-medium text-gray-900">
                                      {document.name}
                                    </h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      document.status === DocumentStatus.COMPLETED
                                        ? 'bg-green-100 text-green-800'
                                        : document.status === DocumentStatus.ERROR
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {getStatusText(document.status)}
                                    </span>
                                  </div>
                                  
                                  <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                                    <div className="flex items-center space-x-1">
                                      <DocumentTextIcon className="h-4 w-4" />
                                      <span>Template: {document.template.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <UserIcon className="h-4 w-4" />
                                      <span>{document.createdBy.userDisplayName}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <ClockIcon className="h-4 w-4" />
                                      <span>{formatDate(document.createdAt)}</span>
                                    </div>
                                  </div>

                                  {document.errorMessage && (
                                    <div className="mt-2 text-sm text-red-600">
                                      Erreur: {document.errorMessage}
                                    </div>
                                  )}

                                  {document.lastDataSync && (
                                    <div className="mt-2 text-xs text-gray-400">
                                      Dernière sync: {formatDate(document.lastDataSync.syncedAt)} 
                                      {document.lastDataSync.success ? '' : ' (échec)'}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2">
                                  {document.status === DocumentStatus.COMPLETED && (
                                    <a
                                      href={document.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                      <LinkIcon className="h-4 w-4 mr-1" />
                                      Ouvrir
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Modal de création */}
          <CreateDocumentModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onDocumentCreated={handleDocumentCreated}
          />
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}