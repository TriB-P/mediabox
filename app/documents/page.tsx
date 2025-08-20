// app/documents/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import CreateDocumentModal from '../components/Others/CreateDocumentModal';
import UnlinkDocumentModal from '../components/Others/UnlinkDocumentModal';
import CampaignVersionSelector from '../components/Others/CampaignVersionSelector';
import { useClient } from '../contexts/ClientContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useCampaignSelection } from '../hooks/useCampaignSelection';
import { getDocumentsByVersion, deleteDocumentWithDrive, updateDocumentDataSync } from '../lib/documentService';
import { useCombinedDocExport } from '../hooks/documents/useCombinedDocExport';
import { useUnlinkDoc } from '../hooks/documents/useUnlinkDoc';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  LinkIcon,
  LinkSlashIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Document, DocumentStatus, DocumentCreationResult } from '../types/document';

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: ease } },
};

const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: ease } },
};

const cardVariants: Variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: ease } },
};

const buttonHoverTap = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};


/**
 * Page principale de gestion des documents.
 * Permet de créer de nouveaux documents à partir de templates et de naviguer
 * entre les documents existants par campagne/version.
 * @returns {JSX.Element} Le composant de la page des documents.
 */
export default function DocumentsPage() {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Hook pour la sélection campagne/version (même logique que strategy)
  const {
    campaigns,
    versions,
    selectedCampaign,
    selectedVersion,
    loading: campaignLoading,
    error: campaignError,
    handleCampaignChange,
    handleVersionChange,
  } = useCampaignSelection();

  // Hook pour l'export combiné (utilisé pour le refresh)
  const { exportCombinedData, loading: exportLoading } = useCombinedDocExport();

  // Hook pour la dissociation des documents
  const { unlinkDocument, loading: unlinkLoading, error: unlinkError } = useUnlinkDoc();

  // États du modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [documentToUnlink, setDocumentToUnlink] = useState<Document | null>(null);

  // États des données
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [refreshingDocumentId, setRefreshingDocumentId] = useState<string | null>(null);

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
      setError(t('documents.errors.loadDocuments'));
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedCampaign, selectedVersion, t]);

  // Charger les documents au changement de version
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  /**
   * Gère le changement de campagne sélectionnée.
   */
  const handleCampaignChangeLocal = (campaign: any) => {
    handleCampaignChange(campaign);
    setDocuments([]);
    setError(null);
  };

  /**
   * Gère le changement de version de campagne sélectionnée.
   */
  const handleVersionChangeLocal = (version: any) => {
    handleVersionChange(version);
    setError(null);
  };

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
   * Ouvre le modal de dissociation pour un document.
   * @param document Le document à dissocier.
   */
  const handleOpenUnlinkModal = useCallback((document: Document) => {
    setDocumentToUnlink(document);
    setIsUnlinkModalOpen(true);
  }, []);

  /**
   * Ferme le modal de dissociation.
   */
  const handleCloseUnlinkModal = useCallback(() => {
    setIsUnlinkModalOpen(false);
    setDocumentToUnlink(null);
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
   * Gère la confirmation de dissociation d'un document.
   * @param document Le document à dissocier.
   * @param newName Le nouveau nom pour le document dissocié.
   * @returns Le résultat de la dissociation.
   */
  const handleUnlinkConfirm = useCallback(async (document: Document, newName: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) {
      return {
        success: false,
        errorMessage: t('documents.errors.missingContext')
      };
    }

    try {
      const result = await unlinkDocument(
        document,
        newName,
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id
      );

      if (result.success) {
        // Recharger la liste des documents pour voir le nouveau document dissocié
        await loadDocuments();
        console.log(`✅ Document "${document.name}" dissocié avec succès`);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('documents.errors.unlinkUnknown');
      console.error('❌ Erreur dissociation document:', errorMessage);
      
      return {
        success: false,
        errorMessage
      };
    }
  }, [selectedClient, selectedCampaign, selectedVersion, unlinkDocument, loadDocuments, t]);

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
      return t('documents.common.invalidDate');
    }
  }, [t]);

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
        return t('documents.status.completed');
      case DocumentStatus.ERROR:
        return t('documents.status.error');
      case DocumentStatus.CREATING:
        return t('documents.status.creating');
      default:
        return t('documents.status.unknown');
    }
  }, [t]);

  /**
   * Gère la suppression d'un document avec confirmation.
   * @param document Le document à supprimer.
   */
  const handleDeleteDocument = useCallback(async (document: Document) => {
    const confirmMessage = t('documents.actions.deleteConfirm', { name: document.name });
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    if (!selectedClient || !selectedCampaign || !selectedVersion) {
      setError(t('documents.errors.missingContextDelete'));
      return;
    }

    try {
      setDeletingDocumentId(document.id);
      setError(null);

      await deleteDocumentWithDrive(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id,
        document.id
      );

      // Recharger la liste des documents
      await loadDocuments();
      
      console.log(`✅ Document "${document.name}" supprimé avec succès`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('documents.errors.deleteUnknown');
      console.error('❌ Erreur suppression document:', errorMessage);
      setError(t('documents.errors.deleteError', { message: errorMessage }));
    } finally {
      setDeletingDocumentId(null);
    }
  }, [selectedClient, selectedCampaign, selectedVersion, loadDocuments, t]);

  /**
   * Gère l'actualisation des données d'un document.
   * @param document Le document à actualiser.
   */
  const handleRefreshDocument = useCallback(async (document: Document) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) {
      setError(t('documents.errors.missingContextRefresh'));
      return;
    }

    if (document.status !== DocumentStatus.COMPLETED) {
      setError(t('documents.errors.onlyCompletedRefresh'));
      return;
    }

    try {
      setRefreshingDocumentId(document.id);
      setError(null);

      // Déterminer la langue d'export selon le template
      const templateLanguage = document.template.name.includes('EN') || document.template.name.includes('Anglais') ? 'EN' : 'FR';

      // Utiliser le hook d'export combiné pour repousser les données
      const success = await exportCombinedData(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id,
        document.url,
        templateLanguage
      );

      if (success) {
        // Mettre à jour l'horodatage de synchronisation
        await updateDocumentDataSync(
          selectedClient.clientId,
          selectedCampaign.id,
          selectedVersion.id,
          document.id,
          user?.email || t('documents.common.unknownUser'),
          true
        );

        // Recharger la liste des documents pour voir la mise à jour
        await loadDocuments();
        
        console.log(`✅ Document "${document.name}" actualisé avec succès`);
      } else {
        throw new Error(t('documents.errors.refreshFailed'));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('documents.errors.refreshUnknown');
      console.error('❌ Erreur actualisation document:', errorMessage);
      
      // Enregistrer l'échec de synchronisation
      try {
        await updateDocumentDataSync(
          selectedClient.clientId,
          selectedCampaign.id,
          selectedVersion.id,
          document.id,
          user?.email || t('documents.common.unknownUser'),
          false,
          errorMessage
        );
      } catch (syncError) {
        console.error('Erreur lors de l\'enregistrement de l\'échec de sync:', syncError);
      }

      setError(t('documents.errors.refreshError', { message: errorMessage }));
    } finally {
      setRefreshingDocumentId(null);
    }
  }, [selectedClient, selectedCampaign, selectedVersion, exportCombinedData, loadDocuments, user, t]);

  /**
   * Groupe les documents par nom de template.
   * @param documents La liste des documents à grouper.
   * @returns Un objet avec les templates comme clés et les documents correspondants comme valeurs.
   */
  const groupDocumentsByTemplate = useCallback((documents: Document[]): { [templateName: string]: Document[] } => {
    return documents.reduce((groups, document) => {
      const templateName = document.template.name || t('documents.common.unknownTemplate');
      if (!groups[templateName]) {
        groups[templateName] = [];
      }
      groups[templateName].push(document);
      return groups;
    }, {} as { [templateName: string]: Document[] });
  }, [t]);

  const isLoading = campaignLoading || loading;
  const hasError = campaignError || error;

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <motion.div 
          className="space-y-6"
          variants={pageVariants}
          initial="initial"
          animate="animate"
        >

          {/* En-tête */}
          <motion.div className="flex items-center justify-between" variants={itemVariants}>
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('documents.title')}</h1>
              </div>
            </div>
            <motion.button
              onClick={handleCreateDocument}
              disabled={!selectedClient}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                selectedClient
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              title={!selectedClient ? t('documents.newDocumentDisabled') : ""}
              variants={buttonHoverTap}
              whileHover="hover"
              whileTap="tap"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('documents.newDocument')}
            </motion.button>
          </motion.div>

          {/* Message si pas de client sélectionné */}
          {!selectedClient && (
            <motion.div className="bg-amber-50 border border-amber-200 rounded-lg p-4" variants={cardVariants}>
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">{t('documents.noClientSelected')}</p>
                  <p className="text-sm text-amber-700 mt-1">
                    {t('documents.noClientMessage')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Interface principale */}
          {selectedClient && (
            <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
              {/* Sélecteur campagne/version */}
              <motion.div className="flex justify-between items-center" variants={itemVariants}>
                <div className="flex-1 max-w-4xl">
                  <CampaignVersionSelector
                    campaigns={campaigns}
                    versions={versions}
                    selectedCampaign={selectedCampaign}
                    selectedVersion={selectedVersion}
                    loading={campaignLoading}
                    error={campaignError}
                    onCampaignChange={handleCampaignChangeLocal}
                    onVersionChange={handleVersionChangeLocal}
                    className="mb-0"
                  />
                </div>
              </motion.div>

              {/* Liste des documents */}
              <motion.div className="bg-white shadow rounded-lg" variants={cardVariants}>
                <div className="px-6 py-4">
                  {/* États de chargement et d'erreur */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <span className="ml-3 text-gray-600">{t('documents.loadingDocuments')}</span>
                    </div>
                  )}

                  {hasError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{hasError}</p>
                      </div>
                    </div>
                  )}

                  {/* Message si pas de sélection */}
                  {!selectedCampaign && !isLoading && !hasError && (
                    <div className="text-center py-8 text-gray-500">
                      <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">{t('documents.selectCampaign')}</p>
                      <p className="text-sm mt-1">
                        {t('documents.selectCampaignMessage')}
                      </p>
                    </div>
                  )}

                  {/* Message si pas de version */}
                  {selectedCampaign && !selectedVersion && !isLoading && !hasError && (
                    <div className="text-center py-8 text-gray-500">
                      <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">{t('documents.selectVersion')}</p>
                      <p className="text-sm mt-1">
                        {t('documents.selectVersionMessage')}
                      </p>
                    </div>
                  )}

                  {/* Liste des documents organisés par template */}
                  {selectedCampaign && selectedVersion && !isLoading && !hasError && (
                    <>
                      {documents.length === 0 ? (
                        <div className="text-center py-8">
                          <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium text-gray-900">{t('documents.noDocuments')}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {t('documents.noDocumentsMessage')}
                          </p>
                          <motion.button
                            onClick={handleCreateDocument}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-4"
                            variants={buttonHoverTap}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            {t('documents.createFirstDocument')}
                          </motion.button>
                        </div>
                      ) : (
                        <motion.div className="space-y-8" variants={containerVariants}>
                          {Object.entries(groupDocumentsByTemplate(documents)).map(([templateName, templateDocuments]) => (
                            <motion.div key={templateName} className="space-y-4" variants={itemVariants}>
                              {/* En-tête de section par template */}
                              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                <div className="flex items-center space-x-2">
                                  <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                                  <h3 className="text-lg font-medium text-gray-900">{templateName}</h3>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {templateDocuments.length === 1 
                                      ? 1 + ' ' +  t('documents.documentCount')
                                      : templateDocuments.length + ' ' +t('documents.documentCountPlural')
                                    }
                                  </span>
                                </div>
                              </div>

                              {/* Documents de ce template */}
                              <motion.div className="space-y-3" variants={containerVariants}>
                                {templateDocuments.map((document) => (
                                  <motion.div
                                    key={document.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    variants={cardVariants}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3">
                                          {getStatusIcon(document.status)}
                                          <h4 className="text-lg font-medium text-gray-900">
                                            {document.name}
                                          </h4>
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            document.status === DocumentStatus.COMPLETED
                                              ? 'bg-green-100 text-green-800'
                                              : document.status === DocumentStatus.ERROR
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {getStatusText(document.status)}
                                          </span>
                                          {document.isUnlinked && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                              <LinkSlashIcon className="h-3 w-3 mr-1" />
                                              {t('documents.unlinked')}
                                            </span>
                                          )}
                                        </div>
                                        
                                        <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                                          <div className="flex items-center space-x-1">
                                            <UserIcon className="h-4 w-4" />
                                            <span>{document.createdBy.userDisplayName}</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <ClockIcon className="h-4 w-4" />
                                            <span>{formatDate(document.createdAt)}</span>
                                          </div>
                                          {document.lastDataSync && (
                                            <div className="flex items-center space-x-1">
                                              <span className="text-gray-400">•</span>
                                              <span className="text-gray-400">
                                                {t('documents.syncInfo', { 
                                                  date: formatDate(document.lastDataSync.syncedAt),
                                                  status: document.lastDataSync.success ? '' : ` (${t('documents.syncFailed')})`
                                                })}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {document.errorMessage && (
                                          <div className="mt-2 text-sm text-red-600">
                                            {t('documents.errorLabel')}: {document.errorMessage}
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        {document.status === DocumentStatus.COMPLETED && (
                                          <>
                                            <motion.a
                                              href={document.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                              variants={buttonHoverTap}
                                              whileHover="hover"
                                              whileTap="tap"
                                            >
                                              <LinkIcon className="h-4 w-4 mr-1" />
                                              {t('documents.actions.open')}
                                            </motion.a>
                                            
                                            {!document.isUnlinked && (
                                              <>
                                                <motion.button
                                                  onClick={() => handleRefreshDocument(document)}
                                                  disabled={refreshingDocumentId === document.id || exportLoading}
                                                  className={`inline-flex items-center justify-center w-9 h-9 border border-blue-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                                    refreshingDocumentId === document.id || exportLoading
                                                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                      : 'text-blue-700 bg-white hover:bg-blue-50'
                                                  }`}
                                                  title={t('documents.actions.refreshTooltip')}
                                                  variants={buttonHoverTap}
                                                  whileHover="hover"
                                                  whileTap="tap"
                                                >
                                                  {refreshingDocumentId === document.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" />
                                                  ) : (
                                                    <ArrowPathIcon className="h-4 w-4" />
                                                  )}
                                                </motion.button>

                                                <motion.button
                                                  onClick={() => handleOpenUnlinkModal(document)}
                                                  disabled={unlinkLoading}
                                                  className={`inline-flex items-center justify-center w-9 h-9 border border-orange-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                                                    unlinkLoading
                                                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                      : 'text-orange-700 bg-white hover:bg-orange-50'
                                                  }`}
                                                  title={t('documents.actions.unlinkTooltip')}
                                                  variants={buttonHoverTap}
                                                  whileHover="hover"
                                                  whileTap="tap"
                                                >
                                                  <LinkSlashIcon className="h-4 w-4" />
                                                </motion.button>
                                              </>
                                            )}
                                          </>
                                        )}
                                        
                                        <motion.button
                                          onClick={() => handleDeleteDocument(document)}
                                          disabled={deletingDocumentId === document.id}
                                          className={`inline-flex items-center justify-center w-9 h-9 border border-red-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                            deletingDocumentId === document.id
                                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                              : 'text-red-700 bg-white hover:bg-red-50'
                                          }`}
                                          title={t('documents.actions.deleteTooltip')}
                                          variants={buttonHoverTap}
                                          whileHover="hover"
                                          whileTap="tap"
                                        >
                                          {deletingDocumentId === document.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                                          ) : (
                                            <TrashIcon className="h-4 w-4" />
                                          )}
                                        </motion.button>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </motion.div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Modal de création */}
          <CreateDocumentModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onDocumentCreated={handleDocumentCreated}
          />

          {/* Modal de dissociation */}
          <UnlinkDocumentModal
            isOpen={isUnlinkModalOpen}
            onClose={handleCloseUnlinkModal}
            document={documentToUnlink}
            onConfirm={handleUnlinkConfirm}
            loading={unlinkLoading}
          />
        </motion.div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}