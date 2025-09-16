// app/hooks/documents/useCreateDocument.ts

/**
 * Ce hook orchestre le processus complet de création d'un document :
 * 1. Validation des données et récupération des métadonnées
 * 2. Duplication du template via Google Drive API
 * 3. Création de l'entrée Firebase avec statut "creating"
 * 4. Duplication des onglets si TE_Duplicate = TRUE
 * 5. Injection des données de campagne/version dans le document
 * 6. Mise à jour du statut final (completed/error)
 * * IMPORTANT: Les shortcodes sont convertis selon la langue du template (TE_Language)
 * et non selon la langue d'exportation du client.
 * * AMÉLIORÉ: Propagation des erreurs détaillées (notamment pop-ups bloquées)
 * * MODIFIÉ: Support du templateType dans les métadonnées du document
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDuplicateTemplate } from './useDuplicateTemplate';
import { useCombinedDocExport } from './useCombinedDocExport';
import { useConvertShortcodesDoc } from './useConvertShortcodesDoc';
import { useDuplicateTabsDoc } from './useDuplicateTabsDoc';
import { 
  createDocument, 
  updateDocumentStatus, 
  updateDocumentMetadata,
  updateDocumentDataSync,
  documentNameExists 
} from '../../lib/documentService';
import { getTemplateById } from '../../lib/templateService';
import { getCampaigns } from '../../lib/campaignService';
import { getVersions } from '../../lib/versionService';
import { getClientInfo } from '../../lib/clientService';
import { 
  DocumentCreationResult, 
  DocumentCreationContext, 
  DocumentFormData,
  DocumentCreationOptions,
  DocumentStatus 
} from '../../types/document';
import { useTranslation } from '../../contexts/LanguageContext';

interface UseCreateDocumentReturn {
  createDocument: (
    clientId: string,
    formData: DocumentFormData,
    options?: DocumentCreationOptions
  ) => Promise<DocumentCreationResult>;
  loading: boolean;
  error: string | null;
  progress: {
    step: string;
    details: string;
  } | null;
}

/**
 * Hook principal pour créer des documents complets.
 * @returns {UseCreateDocumentReturn} Un objet contenant la fonction createDocument,
 * les états de chargement, d'erreur et de progression.
 */
export function useCreateDocument(): UseCreateDocumentReturn {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{step: string; details: string} | null>(null);

  const { duplicateTemplate, loading: duplicateLoading } = useDuplicateTemplate();
  const { exportCombinedData, loading: exportLoading, error: exportError } = useCombinedDocExport();
  const { duplicateAndManageTabs, loading: tabsLoading } = useDuplicateTabsDoc();

  /**
   * Met à jour l'état de progression du processus.
   * @param step L'étape actuelle.
   * @param details Les détails de l'étape.
   */
  const updateProgress = useCallback((step: string, details: string) => {
    setProgress({ step, details });
  }, []);

  /**
   * Extrait l'ID d'un Google Sheet depuis son URL.
   * @param url L'URL complète du Google Sheet.
   * @returns L'ID du sheet ou null si non trouvé.
   */
  const extractSheetId = useCallback((url: string): string | null => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }, []);

  /**
   * Valide les données du formulaire et vérifie les pré-requis.
   * @param clientId L'ID du client.
   * @param formData Les données du formulaire.
   * @returns Les informations validées ou null si erreur.
   */
  const validateAndFetchData = useCallback(async (
    clientId: string,
    formData: DocumentFormData
  ) => {
    updateProgress(t('useCreateDocument.progress.validationStep'), t('useCreateDocument.progress.validatingData'));

    // 1. Vérifier que le nom n'existe pas déjà
    const nameExists = await documentNameExists(
      clientId,
      formData.campaignId,
      formData.versionId,
      formData.name
    );

    if (nameExists) {
      throw new Error(t('useCreateDocument.error.documentNameExistsStart') + `"${formData.name}"` + t('useCreateDocument.error.documentNameExistsEnd'));
    }

    updateProgress(t('useCreateDocument.progress.validationStep'), t('useCreateDocument.progress.fetchingTemplateInfo'));

    // 2. Récupérer les informations du template
    const template = await getTemplateById(clientId, formData.templateId);
    if (!template) {
      throw new Error(t('useCreateDocument.error.templateNotFound'));
    }

    updateProgress(t('useCreateDocument.progress.validationStep'), t('useCreateDocument.progress.fetchingCampaignInfo'));

    // 3. Récupérer les informations de la campagne
    const campaigns = await getCampaigns(clientId);
    const campaign = campaigns.find(c => c.id === formData.campaignId);
    if (!campaign) {
      throw new Error(t('useCreateDocument.error.campaignNotFound'));
    }

    updateProgress(t('useCreateDocument.progress.validationStep'), t('useCreateDocument.progress.fetchingVersionInfo'));

    // 4. Récupérer les informations de la version
    const versions = await getVersions(clientId, formData.campaignId);
    const version = versions.find(v => v.id === formData.versionId);
    if (!version) {
      throw new Error(t('useCreateDocument.error.versionNotFound'));
    }

    updateProgress(t('useCreateDocument.progress.validationStep'), t('useCreateDocument.progress.fetchingClientInfo'));

    // 5. Récupérer les informations du client
    const clientInfo = await getClientInfo(clientId);

    return {
      template,
      campaign,
      version,
      clientInfo
    };
  }, [updateProgress, t]);

  /**
   * Gère la duplication des onglets si le template l'exige.
   * @param template Le template avec ses propriétés.
   * @param documentUrl L'URL du document dupliqué.
   * @param context Le contexte de création.
   * @returns Le résultat de la duplication des onglets.
   */
  const handleTabsDuplication = useCallback(async (
    template: any,
    documentUrl: string,
    context: DocumentCreationContext
  ) => {
    // Vérifier si le template nécessite la duplication d'onglets
    if (!template.TE_Duplicate) {
      console.log('[CREATE] Template ne nécessite pas de duplication d\'onglets');
      return { success: true };
    }

    updateProgress(t('useCreateDocument.progress.tabsStep'), t('useCreateDocument.progress.duplicatingTabs'));

    // Extraire l'ID du sheet
    const sheetId = extractSheetId(documentUrl);
    if (!sheetId) {
      return {
        success: false,
        errorMessage: t('useCreateDocument.error.cannotExtractSheetId')
      };
    }

    try {
      const success = await duplicateAndManageTabs(
        'creation',
        sheetId,
        context.clientId,
        context.formData.campaignId,
        context.formData.versionId
      );

      if (!success) {
        return {
          success: false,
          errorMessage: t('useCreateDocument.error.tabsDuplicationFailed')
        };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('useCreateDocument.error.tabsDuplicationError');
      return {
        success: false,
        errorMessage
      };
    }
  }, [updateProgress, extractSheetId, duplicateAndManageTabs, t]);

  /**
   * Injecte les données dans le document dupliqué via le hook combiné.
   * Utilise la langue du template pour la conversion des shortcodes.
   * AMÉLIORÉ: Récupère l'erreur spécifique du hook exportCombinedData au lieu d'utiliser un message générique.
   * @param documentUrl L'URL du document dupliqué.
   * @param context Le contexte de création.
   * @param templateLanguage La langue du template pour la conversion des shortcodes.
   * @returns Le résultat de l'injection.
   */
  const injectDataIntoDocument = useCallback(async (
    documentUrl: string,
    context: DocumentCreationContext,
    templateLanguage: string
  ) => {
    updateProgress(t('useCreateDocument.progress.injectionStep'), t('useCreateDocument.progress.extractingCampaignData'));

    const { clientId, formData } = context;

    try {
      // Déterminer la langue pour la conversion des shortcodes depuis le template
      const exportLanguage: 'FR' | 'EN' = templateLanguage === 'Anglais' ? 'EN' : 'FR';

      // Utiliser le hook combiné existant avec l'URL du document dupliqué
      const success = await exportCombinedData(
        clientId,
        formData.campaignId,
        formData.versionId,
        documentUrl,
        exportLanguage
      );

      return {
        success,
        rowsInjected: success ? 100 : 0, // Placeholder - le hook combiné ne retourne pas ces détails
        sheetsUpdated: success ? ['MB_Data', 'MB_Splits'] : [],
        // AMÉLIORÉ: Utiliser l'erreur spécifique du hook exportCombinedData au lieu d'un message générique
        errorMessage: success ? undefined : (exportError || t('useCreateDocument.error.dataInjectionError'))
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('useCreateDocument.error.unknownInjectionError');
      return {
        success: false,
        errorMessage
      };
    }
  }, [updateProgress, exportCombinedData, exportError, t]);

  /**
   * Fonction principale pour créer un document complet.
   * @param clientId L'ID du client.
   * @param formData Les données du formulaire.
   * @param options Les options de création.
   * @returns Le résultat complet de la création.
   */
  const createDocumentComplete = useCallback(async (
    clientId: string,
    formData: DocumentFormData,
    options: DocumentCreationOptions = {}
  ): Promise<DocumentCreationResult> => {
    if (!user) {
      return {
        success: false,
        errorMessage: t('useCreateDocument.error.userNotAuthenticated'),
        failedStep: 'validation'
      };
    }

    try {
      setLoading(true);
      setError(null);

      // 1. VALIDATION ET RÉCUPÉRATION DES DONNÉES
      const validatedData = await validateAndFetchData(clientId, formData);
      const { template, campaign, version, clientInfo } = validatedData;

      // Construire le contexte de création
      const context: DocumentCreationContext = {
        clientId,
        client: {
          name: clientInfo.CL_Name,
          defaultDriveFolder: clientInfo.CL_Default_Drive_Folder || '',
          exportLanguage: clientInfo.CL_Export_Language
        },
        formData,
        options: {
          includeBreakdowns: true,
          includeCampaignData: true,
          includeHierarchyData: true,
          convertShortcodes: true,
          ...options
        },
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName || 'User'
        }
      };

      // 2. DUPLICATION DU TEMPLATE
      updateProgress(t('useCreateDocument.progress.duplicationStep'), t('useCreateDocument.progress.duplicatingTemplate') + ` "${template.TE_Name}"...`);
      
      const duplicationResult = await duplicateTemplate(
        template.TE_URL,
        formData.name,
        clientInfo.CL_Default_Drive_Folder || undefined
      );

      if (!duplicationResult.success || !duplicationResult.duplicatedUrl) {
        return {
          success: false,
          duplicationResult,
          errorMessage: duplicationResult.errorMessage || t('useCreateDocument.error.templateDuplicationFailed'),
          failedStep: 'duplication'
        };
      }

      // 3. CRÉATION DE L'ENTRÉE FIREBASE
      updateProgress(t('useCreateDocument.progress.savingStep'), t('useCreateDocument.progress.creatingDatabaseEntry'));
      
      const documentId = await createDocument(context, duplicationResult.duplicatedUrl);

      // 4. MISE À JOUR DES MÉTADONNÉES (MODIFIÉ: Ajout du templateType)
      await updateDocumentMetadata(
        clientId,
        formData.campaignId,
        formData.versionId,
        documentId,
        {
          template: {
            id: template.id,
            name: template.TE_Name,
            originalUrl: template.TE_URL,
            templateType: template.TE_Type || 'Other' // NOUVEAU: Inclure le type de template
          },
          campaign: {
            id: campaign.id,
            name: campaign.CA_Name
          },
          version: {
            id: version.id,
            name: version.name
          }
        }
      );

      // 5. DUPLICATION DES ONGLETS (SI NÉCESSAIRE)
      const tabsResult = await handleTabsDuplication(
        template,
        duplicationResult.duplicatedUrl,
        context
      );

      if (!tabsResult.success) {
        // Mettre à jour le statut d'erreur
        await updateDocumentStatus(
          clientId,
          formData.campaignId,
          formData.versionId,
          documentId,
          DocumentStatus.ERROR,
          tabsResult.errorMessage
        );

        return {
          success: false,
          duplicationResult,
          errorMessage: tabsResult.errorMessage || t('useCreateDocument.error.tabsDuplicationFailed'),
          failedStep: 'duplication'
        };
      }

      // 6. INJECTION DES DONNÉES
      updateProgress(t('useCreateDocument.progress.injectionStep'), t('useCreateDocument.progress.injectingData'));
      
      const injectionResult = await injectDataIntoDocument(
        duplicationResult.duplicatedUrl,
        context,
        template.TE_Language // Utilisation de la langue du template
      );

      // 7. MISE À JOUR DU STATUT FINAL
      if (injectionResult.success) {
        await updateDocumentStatus(
          clientId,
          formData.campaignId,
          formData.versionId,
          documentId,
          DocumentStatus.COMPLETED
        );

        await updateDocumentDataSync(
          clientId,
          formData.campaignId,
          formData.versionId,
          documentId,
          user.email,
          true
        );

        updateProgress(t('useCreateDocument.progress.finishedStep'), t('useCreateDocument.progress.documentCreatedSuccessfully'));
      } else {
        await updateDocumentStatus(
          clientId,
          formData.campaignId,
          formData.versionId,
          documentId,
          DocumentStatus.ERROR,
          injectionResult.errorMessage
        );

        await updateDocumentDataSync(
          clientId,
          formData.campaignId,
          formData.versionId,
          documentId,
          user.email,
          false,
          injectionResult.errorMessage
        );
      }

      // 8. CONSTRUIRE LE DOCUMENT FINAL (MODIFIÉ: Ajout du templateType)
      const finalDocument = {
        id: documentId,
        name: formData.name,
        url: duplicationResult.duplicatedUrl,
        status: injectionResult.success ? DocumentStatus.COMPLETED : DocumentStatus.ERROR,
        template: {
          id: template.id,
          name: template.TE_Name,
          originalUrl: template.TE_URL,
          templateType: template.TE_Type || 'Other' // NOUVEAU: Inclure le type de template
        },
        campaign: {
          id: campaign.id,
          name: campaign.CA_Name
        },
        version: {
          id: version.id,
          name: version.name
        },
        createdBy: {
          userId: user.id,
          userEmail: user.email,
          userDisplayName: user.displayName || 'User'
        },
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        errorMessage: injectionResult.success ? undefined : injectionResult.errorMessage
      };

      return {
        success: injectionResult.success,
        document: finalDocument,
        duplicationResult,
        injectionResult,
        errorMessage: injectionResult.success ? undefined : injectionResult.errorMessage
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('useCreateDocument.error.unknownCreationError');
      console.error('❌ Erreur création document:', errorMessage);
      setError(errorMessage);
      
      return {
        success: false,
        errorMessage,
        failedStep: 'validation'
      };
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [
    user, 
    validateAndFetchData, 
    duplicateTemplate, 
    handleTabsDuplication,
    injectDataIntoDocument, 
    updateProgress,
    t
  ]);

  const overallLoading = loading || duplicateLoading || exportLoading || tabsLoading;

  return {
    createDocument: createDocumentComplete,
    loading: overallLoading,
    error,
    progress,
  };
}