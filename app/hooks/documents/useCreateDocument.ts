// app/hooks/documents/useCreateDocument.ts

/**
 * Ce hook orchestre le processus complet de création d'un document :
 * 1. Validation des données et récupération des métadonnées
 * 2. Duplication du template via Google Drive API
 * 3. Création de l'entrée Firebase avec statut "creating"
 * 4. Injection des données de campagne/version dans le document
 * 5. Mise à jour du statut final (completed/error)
 * 
 * IMPORTANT: Les shortcodes sont convertis selon la langue du template (TE_Language)
 * et non selon la langue d'exportation du client.
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDuplicateTemplate } from './useDuplicateTemplate';
import { useCombinedDocExport } from './useCombinedDocExport';
import { useConvertShortcodesDoc } from './useConvertShortcodesDoc';
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{step: string; details: string} | null>(null);

  const { duplicateTemplate, loading: duplicateLoading } = useDuplicateTemplate();
  const { exportCombinedData, loading: exportLoading } = useCombinedDocExport();

  /**
   * Met à jour l'état de progression du processus.
   * @param step L'étape actuelle.
   * @param details Les détails de l'étape.
   */
  const updateProgress = useCallback((step: string, details: string) => {
    setProgress({ step, details });
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
    updateProgress('Validation', 'Validation des données...');

    // 1. Vérifier que le nom n'existe pas déjà
    const nameExists = await documentNameExists(
      clientId,
      formData.campaignId,
      formData.versionId,
      formData.name
    );

    if (nameExists) {
      throw new Error(`Un document avec le nom "${formData.name}" existe déjà pour cette version.`);
    }

    updateProgress('Validation', 'Récupération des informations du template...');

    // 2. Récupérer les informations du template
    const template = await getTemplateById(clientId, formData.templateId);
    if (!template) {
      throw new Error('Template non trouvé.');
    }

    updateProgress('Validation', 'Récupération des informations de la campagne...');

    // 3. Récupérer les informations de la campagne
    const campaigns = await getCampaigns(clientId);
    const campaign = campaigns.find(c => c.id === formData.campaignId);
    if (!campaign) {
      throw new Error('Campagne non trouvée.');
    }

    updateProgress('Validation', 'Récupération des informations de la version...');

    // 4. Récupérer les informations de la version
    const versions = await getVersions(clientId, formData.campaignId);
    const version = versions.find(v => v.id === formData.versionId);
    if (!version) {
      throw new Error('Version non trouvée.');
    }

    updateProgress('Validation', 'Récupération des informations du client...');

    // 5. Récupérer les informations du client
    const clientInfo = await getClientInfo(clientId);

    return {
      template,
      campaign,
      version,
      clientInfo
    };
  }, [updateProgress]);

  /**
   * Injecte les données dans le document dupliqué via le hook combiné.
   * Utilise la langue du template pour la conversion des shortcodes.
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
    updateProgress('Injection', 'Extraction des données de la campagne...');

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
        exportLanguage // Utilisation de la langue du template
      );

      return {
        success,
        rowsInjected: success ? 100 : 0, // Placeholder - le hook combiné ne retourne pas ces détails
        sheetsUpdated: success ? ['MB_Data', 'MB_Splits'] : [],
        errorMessage: success ? undefined : 'Erreur lors de l\'injection des données'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'injection';
      return {
        success: false,
        errorMessage
      };
    }
  }, [updateProgress, exportCombinedData]);

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
        errorMessage: 'Utilisateur non authentifié',
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
      updateProgress('Duplication', `Duplication du template "${template.TE_Name}"...`);
      
      const duplicationResult = await duplicateTemplate(
        template.TE_URL,
        formData.name,
        clientInfo.CL_Default_Drive_Folder || undefined
      );

      if (!duplicationResult.success || !duplicationResult.duplicatedUrl) {
        return {
          success: false,
          duplicationResult,
          errorMessage: duplicationResult.errorMessage || 'Échec de la duplication du template',
          failedStep: 'duplication'
        };
      }

      // 3. CRÉATION DE L'ENTRÉE FIREBASE
      updateProgress('Sauvegarde', 'Création de l\'entrée dans la base de données...');
      
      const documentId = await createDocument(context, duplicationResult.duplicatedUrl);

      // 4. MISE À JOUR DES MÉTADONNÉES
      await updateDocumentMetadata(
        clientId,
        formData.campaignId,
        formData.versionId,
        documentId,
        {
          template: {
            id: template.id,
            name: template.TE_Name,
            originalUrl: template.TE_URL
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

      // 5. INJECTION DES DONNÉES
      updateProgress('Injection', 'Injection des données dans le document...');
      
      const injectionResult = await injectDataIntoDocument(
        duplicationResult.duplicatedUrl,
        context,
        template.TE_Language // Utilisation de la langue du template
      );

      // 6. MISE À JOUR DU STATUT FINAL
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

        updateProgress('Terminé', 'Document créé avec succès !');
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

      // 7. CONSTRUIRE LE DOCUMENT FINAL
      const finalDocument = {
        id: documentId,
        name: formData.name,
        url: duplicationResult.duplicatedUrl,
        status: injectionResult.success ? DocumentStatus.COMPLETED : DocumentStatus.ERROR,
        template: {
          id: template.id,
          name: template.TE_Name,
          originalUrl: template.TE_URL
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
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de la création du document';
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
    injectDataIntoDocument, 
    updateProgress
  ]);

  const overallLoading = loading || duplicateLoading || exportLoading;

  return {
    createDocument: createDocumentComplete,
    loading: overallLoading,
    error,
    progress,
  };
}